import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { classify, promptMessage, flushOutbox, ingestClassification } from './classification.mjs';
import worker from './worker.mjs';
import { reminderDue, prepareReminderTest, showPendingReminderTest, runReminderTest } from './reminder-test.mjs';
const txn = '22222222-2222-4222-8222-222222222222';
function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./classification.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./corrections.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./responders.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./reminder-test.sql',import.meta.url),'utf8'));
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
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run('TTEST',txn,'card-1','CTEST','100.1','EvTEST',JSON.stringify({cardName:'架空カード',merchant:'<@UEVIL>',amount:800,currency:'JPY',timezone:'Asia/Tokyo',occurredAtLocal:'2026/09/09 18:00:00'}),'UOWNER','pending','101.1');
  const payload = {type:'block_actions',api_app_id:'ATEST',team:{id:'TTEST'},channel:{id:'CTEST'},user:{id:'UOWNER'},
    container:{type:'message',channel_id:'CTEST',message_ts:'101.1'},message:{ts:'101.1',thread_ts:'100.1'},
    actions:[{type:'static_select',action_id:'poc_classify',block_id:`classify:${txn}`,selected_option:{value:'fp'}}]};
  return {sqlite,env,payload};
}
const due=Date.parse('2026-09-11T01:00:00.000Z'), before=due-86400000;
const record=s=>s.sqlite.prepare('SELECT * FROM poc_reminder_tests').get();
const row=s=>s.sqlite.prepare('SELECT * FROM poc_classifications WHERE transaction_id=?').get(txn);
async function prepare() {
  const s=setup();
  await classify(s.env,s.payload);
  // The original answer belongs to the day before this rehearsal, not the same millisecond.
  const originalAt=new Date(before-3600000).toISOString();
  s.sqlite.prepare('UPDATE poc_classifications SET classified_at=?').run(originalAt);
  s.sqlite.prepare('UPDATE poc_classification_answers SET classified_at=?').run(originalAt);
  s.sqlite.prepare('UPDATE poc_classification_audit SET created_at=?').run(originalAt);
  s.sqlite.exec("UPDATE poc_slack_outbox SET state='sent'");
  s.env.POC_REMINDER_TEST_ID='test-september';s.env.POC_REMINDER_TEST_ENABLED='true';
  s.spec={testId:'test-september',transactionId:txn,runDate:'2026-09-11',expectedClassifiedAt:row(s).classified_at};
  s.original={...row(s)};
  await prepareReminderTest(s.env,s.spec,before);
  return s;
}
async function armed() {
  const s=await prepare();
  await showPendingReminderTest(s.env,async(url,req)=>{
    assert.equal(url,'https://slack.com/api/chat.update');
    const body=JSON.parse(req.body);assert.equal(body.ts,'101.1');assert.equal(body.thread_ts,undefined);
    assert.doesNotMatch(body.text,/<@/);assert.doesNotMatch(body.blocks[0].text.text,/<@/);
    assert.equal(body.blocks[1].text.type,'plain_text');
    assert.equal(body.blocks[2].elements[0].options.length,9);
    return Response.json({ok:true,channel:'CTEST',ts:'101.1'});
  });
  return s;
}
function network(calls,fail=false) {
  return async(url,req)=>{
    const read=url.startsWith('https://slack.com/api/chat.getPermalink?');
    const body=read?Object.fromEntries(new URL(url).searchParams):JSON.parse(req.body);calls.push({url,body});
    if (read) {
      assert.equal(req.method,'GET');assert.equal(req.body,undefined);
      assert.deepEqual(body,{channel:'CTEST',message_ts:'101.1'});
      return Response.json({ok:true,permalink:'https://example.slack.com/archives/CTEST/p1011'});
    }
    assert.equal(url,'https://slack.com/api/chat.postMessage');
    if(fail)throw Error('network timeout');
    return Response.json({ok:true,channel:'CTEST',ts:'102.1'});
  };
}
test('schedule uses 10:00 JST on calendar boundaries; malformed dates fail closed',()=>{
  for(const date of ['2026-09-01','2026-09-11','2026-09-21','2027-01-01','2028-03-01'])
    assert.equal(new Date(reminderDue(date)).toISOString(),date+'T01:00:00.000Z');
  for(const date of ['2026-09-10','2026-13-01','2026-00-11','oops'])assert.throws(()=>reminderDue(date));
});
test('reset preserves complete previous answer and audit; immutable test cannot reset twice',async()=>{
  const s=await prepare();
  assert.deepEqual(JSON.parse(record(s).before_json),s.original);
  assert.equal(row(s).state,'pending');assert.equal(row(s).business_id,null);
  assert.equal(row(s).owner_id,'UOWNER');assert.equal(row(s).prompt_ts,'101.1');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_audit').get().n,1);
  await assert.rejects(prepareReminderTest(s.env,s.spec,before));
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_reminder_tests').get().n,1);
});
test('stale answer snapshot, busy outbox and wrong test ID cannot reset',async()=>{
  for(const kind of ['version','outbox','id']) {
    const s=setup();await classify(s.env,s.payload);
    s.env.POC_REMINDER_TEST_ID='test';
    if(kind!=='outbox')s.sqlite.exec("UPDATE poc_slack_outbox SET state='sent'");
    await assert.rejects(prepareReminderTest(s.env,{testId:kind==='id'?'other':'test',transactionId:txn,
      runDate:'2026-09-11',expectedClassifiedAt:kind==='version'?'old':row(s).classified_at},before));
    assert.equal(row(s).state,'classified');
  }
});
test('failed reset write rolls back snapshot and classification together',async()=>{
  const s=setup();await classify(s.env,s.payload);s.sqlite.exec("UPDATE poc_slack_outbox SET state='sent'");
  s.env.POC_REMINDER_TEST_ID='test';
  s.sqlite.exec("CREATE TRIGGER fail_reset BEFORE UPDATE ON poc_classifications BEGIN SELECT RAISE(ABORT,'test'); END");
  await assert.rejects(prepareReminderTest(s.env,{testId:'test',transactionId:txn,runDate:'2026-09-11',expectedClassifiedAt:row(s).classified_at},before));
  assert.equal(row(s).state,'classified');assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_reminder_tests').get().n,0);
});
test('one reminder in original thread with mention and original answer link; duplicate/concurrent run sends once',async()=>{
  const s=await armed(),calls=[];
  // Unrelated pending expense never joins the explicitly scoped test.
  s.sqlite.exec(`INSERT INTO poc_classifications SELECT team_id,'33333333-3333-4333-8333-333333333333',card_id,channel_id,'200.1',event_id,details,owner_id,state,business_id,classified_by,classified_at,'201.1' FROM poc_classifications`);
  await Promise.all([runReminderTest(s.env,due,network(calls),due),runReminderTest(s.env,due,network(calls),due)]);
  await runReminderTest(s.env,due,network(calls),due);
  assert.equal(calls.length,2);assert.equal(record(s).state,'sent');assert.equal(record(s).message_ts,'102.1');
  const body=calls[1].body;assert.equal(body.thread_ts,'100.1');assert.match(body.text,/<@UOWNER>/);
  assert.match(body.blocks[2].text.text,/p1011/);assert.equal(body.reply_broadcast,false);
  assert.equal(body.blocks[1].text.type,'plain_text');
});
for(const kind of ['disabled','wrong_id','wrong_team','wrong_channel','early','wrong_scheduled_time','next_date','future_year'])
test(kind+' does not post',async()=>{
  const s=await armed();let at=due,scheduled=due;
  if(kind==='disabled')s.env.POC_REMINDER_TEST_ENABLED='false';
  if(kind==='wrong_id')s.env.POC_REMINDER_TEST_ID='other';
  if(kind==='wrong_team')s.env.SLACK_TEAM_ID='TOTHER';
  if(kind==='wrong_channel')s.env.SLACK_CHANNEL_ID='COTHER';
  if(kind==='early')at=due-1;
  if(kind==='wrong_scheduled_time')scheduled=due-60000;
  if(kind==='next_date')at=scheduled=due+10*86400000;
  if(kind==='future_year')at=scheduled=Date.parse('2027-09-11T01:00:00Z');
  await runReminderTest(s.env,scheduled,()=>{throw Error('No network expected');},at);
  assert.notEqual(record(s).state,'sent');assert.notEqual(record(s).state,'uncertain');
});
for(const kind of ['answered','review','disabled_card','owner_changed','recipient_changed','same_day'])
test(kind+' is skipped before sending',async()=>{
  const s=await armed();
  if(kind==='answered')await classify(s.env,s.payload);
  if(kind==='review')s.sqlite.exec("UPDATE poc_classifications SET state='review_required'");
  if(kind==='disabled_card')s.sqlite.exec('UPDATE poc_card_owners SET enabled=0');
  if(kind==='owner_changed')s.sqlite.exec("UPDATE poc_card_owners SET slack_user_id='UCHANGED'");
  if(kind==='recipient_changed'){s.sqlite.exec("UPDATE poc_card_owners SET slack_user_id='UCHANGED'; UPDATE poc_classifications SET owner_id='UCHANGED'");}
  if(kind==='same_day'){
    const data=JSON.parse(row(s).details);data.occurredAtLocal='2026/09/11 00:00:00';
    s.sqlite.prepare('UPDATE poc_classifications SET details=?').run(JSON.stringify(data));
  }
  await runReminderTest(s.env,due,()=>{throw Error('No network expected');},due);
  assert.equal(record(s).state,'skipped');
});
test('answer received during permalink lookup cancels the imminent post',async()=>{
  const s=await armed();let calls=0;
  await runReminderTest(s.env,due,async()=>{
    calls++;await classify(s.env,s.payload);
    return Response.json({ok:true,permalink:'https://example.slack.com/archives/CTEST/p1011'});
  },due);
  assert.equal(calls,1);assert.equal(record(s).state,'skipped');
});
test('uncertain delivery is held and never automatically posted again',async()=>{
  const s=await armed(),calls=[];
  await runReminderTest(s.env,due,network(calls,true),due);
  await runReminderTest(s.env,due,network(calls),due);
  assert.equal(calls.length,2);assert.equal(record(s).state,'uncertain');
});
test('reset display failure never arms delivery or retries a Slack update',async()=>{
  const s=await prepare();let calls=0;
  await assert.rejects(showPendingReminderTest(s.env,()=>{calls++;throw Error('timeout');}));
  await showPendingReminderTest(s.env,()=>{calls++;throw Error('no retry');});
  await runReminderTest(s.env,due,()=>{calls++;throw Error('not armed');},due);
  assert.equal(calls,1);assert.equal(record(s).state,'reset_uncertain');
});
test('answer after reset is audited and updates only that expense while global sends remain off',async()=>{
  const s=await armed();
  s.env.POC_SLACK_SEND_ENABLED='false';s.env.POC_SLACK_UPDATE_ONLY_TRANSACTION_ID=txn;
  s.sqlite.prepare("INSERT INTO poc_slack_outbox VALUES (?,?,'prompt','pending')").run('TTEST',txn);
  s.sqlite.prepare("INSERT INTO poc_slack_outbox VALUES (?,?,'update','pending')").run('TTEST','33333333-3333-4333-8333-333333333333');
  s.payload.actions[0].selected_option.value='common';await classify(s.env,s.payload);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_answers').get().n,2);
  assert.equal(s.sqlite.prepare('SELECT business_id FROM poc_classification_audit').get().business_id,'fp');
  let calls=0;
  await flushOutbox(s.env,async(url,req)=>{
    calls++;assert.equal(url,'https://slack.com/api/chat.update');
    const body=JSON.parse(req.body);assert.equal(body.ts,'101.1');assert.doesNotMatch(JSON.stringify(body),/<@/);
    assert.match(body.blocks[0].text.text,/全社共通/);return Response.json({ok:true,channel:'CTEST',ts:'101.1'});
  });
  await classify(s.env,s.payload);await flushOutbox(s.env,()=>{throw Error('duplicate answer must not requeue');});
  assert.equal(calls,1);
  assert.equal(s.sqlite.prepare("SELECT COUNT(*) n FROM poc_slack_outbox WHERE state='pending'").get().n,2);
});
test('scheduled handler invokes the date-guarded test without exposing a public reset route',async(t)=>{
  t.mock.method(Date,'now',()=>due-60000);
  const s=await armed(),jobs=[];s.env.POC_SLACK_SEND_ENABLED='false';
  await worker.scheduled({scheduledTime:due-60000},s.env,{waitUntil(p){jobs.push(p);}});
  await Promise.all(jobs);assert.equal(record(s).state,'armed');
  assert.equal((await worker.fetch(new Request('https://example.test/reminder/reset'),s.env,{})).status,404);
});
