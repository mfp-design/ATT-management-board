import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { classify, promptMessage, flushOutbox, ingestClassification } from './classification.mjs';
import worker from './worker.mjs';
const txn = '22222222-2222-4222-8222-222222222222';
function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./classification.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./corrections.sql',import.meta.url),'utf8'));
  const db = { prepare(sql) { return { bind(...args) { return {
    async first() { return sqlite.prepare(sql).get(...args) || null; },
    async all() { return {results:sqlite.prepare(sql).all(...args)}; },
    async run() { return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}; },
  }; } }; }, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results=[]; for (const s of statements) results.push(await s.run()); sqlite.exec('COMMIT'); return results; }
    catch(e) { sqlite.exec('ROLLBACK'); throw e; }
  } };
  const env = {DB:db,SLACK_TEAM_ID:'TTEST',SLACK_CHANNEL_ID:'CTEST',SLACK_APP_ID:'ATEST',SLACK_SIGNING_SECRET:'test-secret',
    POC_CLASSIFICATION_ENABLED:'true',POC_CURRENCY:'JPY',POC_TIMEZONE:'Asia/Tokyo',POC_SLACK_SEND_ENABLED:'true',SLACK_BOT_TOKEN:'synthetic'};
  sqlite.prepare('INSERT INTO poc_card_owners VALUES (?,?,?,?,?,?)').run('TTEST','card-1','小島','架空利用者','UOWNER',1);
  sqlite.prepare(`INSERT INTO poc_classifications (team_id,transaction_id,card_id,channel_id,source_ts,event_id,details,owner_id,state,prompt_ts)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run('TTEST',txn,'card-1','CTEST','100.1','EvTEST',JSON.stringify({cardName:'架空カード',merchant:'<@UEVIL>',amount:800,occurredAtLocal:'2026/09/09 18:00:00'}),'UOWNER','pending','101.1');
  const payload = {type:'block_actions',api_app_id:'ATEST',team:{id:'TTEST'},channel:{id:'CTEST'},user:{id:'UOWNER'},
    container:{type:'message',channel_id:'CTEST',message_ts:'101.1'},message:{ts:'101.1',thread_ts:'100.1'},
    actions:[{type:'static_select',action_id:'poc_classify',block_id:`classify:${txn}`,selected_option:{value:'fp'}}]};
  return {sqlite,env,payload};
}
test('owner classification, duplicate delivery, conflicting answer and audit',async()=>{
  const {sqlite,env,payload}=setup();
  assert.equal(await classify(env,payload),200);
  assert.equal(await classify(env,payload),200);
  payload.actions[0].selected_option.value='common'; assert.equal(await classify(env,payload),409);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_audit').get().n,1);
  assert.equal(sqlite.prepare('SELECT business_id FROM poc_classifications').get().business_id,'fp');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM poc_slack_outbox').get().n,1);
});
for (const [label,mutate] of [
  ['third party',p=>p.user.id='UOTHER'], ['wrong team',p=>p.team.id='TOTHER'],
  ['wrong app',p=>p.api_app_id='AOTHER'], ['wrong channel',p=>p.channel.id='COTHER'],
  ['wrong message',p=>p.container.message_ts='999.1'], ['wrong thread',p=>p.message.thread_ts='999.1'],
  ['invalid business',p=>p.actions[0].selected_option.value='__proto__'],
]) test(label+' cannot classify',async()=>{
  const {sqlite,env,payload}=setup(); mutate(payload); assert.notEqual(await classify(env,payload),200);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_audit').get().n,0);
});
test('disabled or reassigned card denies stale prompt',async()=>{
  const {sqlite,env,payload}=setup(); sqlite.exec('UPDATE poc_card_owners SET enabled=0');
  assert.equal(await classify(env,payload),403);
});
test('UI mentions only owner, untrusted merchant rendered as plain text',()=>{
  const {sqlite}=setup(); const body=promptMessage(sqlite.prepare('SELECT * FROM poc_classifications').get());
  assert.match(body.blocks[0].text.text,/<@UOWNER>/);
  assert.equal(body.blocks[1].text.type,'plain_text');
  assert.deepEqual(body.blocks[2].elements[0].options.map(option => option.text.text), ['FP事業','MoneRun','Agerun','自社不動産事業','日本酒','トラストサロン','ビルメンテナンス','企業研修','全社共通']);
});
test('send disabled performs no network calls',async()=>{
  const {env}=setup(); env.POC_SLACK_SEND_ENABLED='false';
  await flushOutbox(env,()=>{throw Error('must not send')});
});
test('successful prompt recorded once and timeout held without re-posting',async()=>{
  for(const fail of [false,true]) {
    const {sqlite,env}=setup(); sqlite.prepare("INSERT INTO poc_slack_outbox VALUES (?,?,'prompt','pending')").run('TTEST',txn);
    let calls=0;
    const send=async()=>{calls++;if(fail)throw Error('timeout');return Response.json({ok:true,channel:'CTEST',ts:'102.1'});};
    await flushOutbox(env,send); await flushOutbox(env,send);
    assert.equal(calls,1);
    assert.equal(sqlite.prepare('SELECT state FROM poc_slack_outbox').get().state,fail?'uncertain':'sent');
  }
});
test('failed audit write rolls back classification',async()=>{
  const {sqlite,env,payload}=setup(); sqlite.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON poc_classification_audit BEGIN SELECT RAISE(ABORT,'test'); END");
  await assert.rejects(classify(env,payload));
  assert.equal(sqlite.prepare('SELECT state FROM poc_classifications').get().state,'pending');
});
test('unparsable event preserved as reason, no prompt',async()=>{
  const {sqlite,env}=setup(); await ingestClassification(env,{team_id:'TTEST',event_id:'EvBAD',event:{type:'message'}});
  assert.equal(sqlite.prepare('SELECT reason FROM poc_parse_reviews').get().reason,'unsupported_structure');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM poc_slack_outbox').get().n,0);
});
test('form interaction verifies raw signature before processing',async()=>{
  const {env,payload}=setup(); env.POC_SLACK_SEND_ENABLED='false';
  for(const valid of [false,true]) {
    const raw=new URLSearchParams({payload:JSON.stringify(payload)}).toString();
    const ts=String(Math.floor(Date.now()/1000));
    const sig=createHmac('sha256',valid?'test-secret':'wrong').update(`v0:${ts}:${raw}`).digest('hex');
    const req=new Request('https://example.test/slack/interactions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-slack-request-timestamp':ts,'x-slack-signature':`v0=${sig}`},body:raw});
    assert.equal((await worker.fetch(req,env,{waitUntil(){}})).status,valid?200:401);
  }
});

function notice() {
  const card='11111111-1111-4111-8111-111111111111';
  const t=text=>({type:'mrkdwn',text});
  return {team_id:'TTEST',event_id:'EvNEW',event:{type:'message',channel:'CTEST',ts:'200.1',attachments:[{blocks:[
    {type:'section',fields:[t('カードの利用がありました。')]},
    {type:'section',fields:[t('ご利用先:\nTEST STORE'),t('ご利用金額:\n800')],accessory:{type:'button',value:txn,action_id:`add_txn_memo-${txn}`}},
    {type:'context',elements:[t('*ステータス*: OK | *日時*: 2026/09/09 18:00:00')]},
    {type:'context',elements:[t('ユーザー名: `shared-user`'),t('カード名: `TEST CARD`'),t(`決済ID: <https://up-sider.com/user-cards/${card}/transactions/${txn}|${txn}>`)]},
  ]}]}};
}
test('shared username never routes an unmapped card; card ID mapping queues one prompt',async()=>{
  for(const mapped of [false,true]) {
    const {sqlite,env}=setup(); sqlite.exec('DELETE FROM poc_classifications');
    if(mapped) sqlite.prepare('INSERT INTO poc_card_owners VALUES (?,?,?,?,?,?)').run('TTEST','11111111-1111-4111-8111-111111111111','TEST CARD','架空利用者','UOWNER',1);
    await ingestClassification(env,notice()); await ingestClassification(env,{...notice(),event_id:'EvRETRY'});
    const row=sqlite.prepare('SELECT * FROM poc_classifications').get();
    assert.equal(row.state,mapped?'pending':'unmapped');
    assert.equal(row.owner_id,mapped?'UOWNER':null);
    assert.equal(JSON.parse(row.details).currency,'JPY');
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM poc_slack_outbox').get().n,mapped?1:0);
    const edit=notice(); edit.event.attachments[0].blocks[1].fields[1].text='ご利用金額:\n900'; edit.event_id='EvEDIT';
    await ingestClassification(env,edit);
    assert.equal(sqlite.prepare('SELECT state FROM poc_classifications').get().state,'review_required');
  }
});
test('currency/timezone confirmation is required before preparing expenses',async()=>{
  const {sqlite,env}=setup(); delete env.POC_CURRENCY;
  await ingestClassification(env,notice());
  assert.equal(sqlite.prepare('SELECT reason FROM poc_parse_reviews').get().reason,'currency_timezone_unconfirmed');
});
