import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { classify, promptMessage, flushOutbox, ingestClassification } from './classification.mjs';
import worker from './worker.mjs';
import { correctClassification } from './corrections.mjs';
const txn = '22222222-2222-4222-8222-222222222222';
function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./classification.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./corrections.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('./responders.sql',import.meta.url),'utf8'));
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

async function ready() {
 const state=setup(); await classify(state.env,state.payload);
 state.sqlite.exec("UPDATE poc_slack_outbox SET state='sent'");
 return state;
}
function button(payload) { return {...payload,trigger_id:'trigger-test',actions:[{type:'button',action_id:'poc_correct',block_id:`correct:${txn}`,value:txn}]}; }
async function open(state,business='common') {
 let view;
 const r=await correctClassification(state.env,button(state.payload),async(url,req)=>{
  assert.equal(url,'https://slack.com/api/views.open'); view=JSON.parse(req.body).view;
  return Response.json({ok:true,view:{id:'VTEST'}});
 });
 assert.equal(r.status,200);
 return {type:'view_submission',team:state.payload.team,api_app_id:'ATEST',user:state.payload.user,
  view:{id:'VTEST',callback_id:'poc_correct_edit',private_metadata:view.private_metadata,state:{values:{
   business:{business:{selected_option:{value:business}}},reason:{reason:{value:'誤って選択したため'}}
  }}}};
}
async function confirm(state,payload) {
 const checked=await correctClassification(state.env,payload);
 assert.equal(checked.body.response_action,'update');
 assert.equal(checked.body.view.callback_id,'poc_correct_confirm');
 return {...payload,view:{...payload.view,callback_id:'poc_correct_confirm'}};
}
const current=s=>s.sqlite.prepare('SELECT * FROM poc_classifications').get();
const revisionCount=s=>s.sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_revisions').get().n;

test('initial selection requires confirmation; completion has correction button without mention',async()=>{
 const s=await ready();
 const prompt=promptMessage(current(s)); assert.equal(prompt.blocks[2].elements[0].confirm.confirm.text,'登録する');
 s.sqlite.exec("UPDATE poc_slack_outbox SET state='pending'");
 let body;
 await flushOutbox(s.env,async(url,req)=>{ assert.match(url,/chat.update$/);body=JSON.parse(req.body);return Response.json({ok:true,channel:'CTEST',ts:'101.1'}); });
 assert.equal(body.blocks[0].text.type,'plain_text'); assert.doesNotMatch(body.blocks[0].text.text,/<@/);
 assert.equal(body.blocks[1].elements[0].text.text,'回答を修正する');
});
test('edit and confirmation leave original intact; final submit records before/after and actual actor once',async()=>{
 const s=await ready(), p=await open(s,'japan_design');
 assert.equal(current(s).business_id,'fp');
 const submit=await confirm(s,p);
 assert.equal(current(s).business_id,'fp'); assert.equal(revisionCount(s),0);
 // Client cannot override the confirmed business or reason in the final request.
 submit.view.state.values.business.business.selected_option.value='sake';
 const completed=await correctClassification(s.env,submit);
 assert.equal(completed.status,200);assert.equal(completed.saved,true);
 assert.equal(completed.body.response_action,'update');assert.equal(completed.body.view.title.text,'修正しました');
 assert.match(completed.body.view.blocks[0].text.text,/変更後：日本デザイン/);
 assert.equal(completed.body.view.close.text,'閉じる');assert.equal(completed.body.view.submit,undefined);
 assert.equal(current(s).business_id,'japan_design');
 assert.equal(current(s).classified_by,'UOWNER');
 const audit=s.sqlite.prepare('SELECT * FROM poc_classification_revisions').get();
 assert.equal(audit.before_business,'fp');assert.equal(audit.after_business,'japan_design');assert.equal(audit.actor_id,'UOWNER');
 assert.equal(audit.reason,'誤って選択したため');
 assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_classification_audit').get().n,1);
 assert.equal(s.sqlite.prepare("SELECT state FROM poc_slack_outbox WHERE kind='update'").get().state,'pending');
 s.sqlite.exec("UPDATE poc_slack_outbox SET state='sent'");
 const replay=await correctClassification(s.env,submit);
 assert.equal(replay.status,200);assert.equal(replay.body.view.callback_id,'poc_correct_done');
 assert.equal(revisionCount(s),1);assert.equal(s.sqlite.prepare('SELECT state FROM poc_slack_outbox').get().state,'sent');
});
for(const [label,mutate] of [
 ['other actor',p=>p.user={id:'UOTHER'}], ['other team',p=>p.team={id:'TOTHER'}],
 ['other app',p=>p.api_app_id='AOTHER'], ['other view',p=>p.view.id='VOTHER'],
 ['forged session',p=>p.view.private_metadata='not-a-session'],
]) test(label+' cannot submit correction',async()=>{
 const s=await ready(),p=await open(s);mutate(p);
 assert.equal((await correctClassification(s.env,p)).status,403);assert.equal(current(s).business_id,'fp');
});
for(const [label,mutate] of [
 ['other message',p=>p.container={...p.container,message_ts:'other'}],
 ['other channel',p=>p.channel={id:'COTHER'}],['other thread',p=>p.message={...p.message,thread_ts:'other'}],
 ['other actor',p=>p.user={id:'UOTHER'}],['forged block',p=>p.actions[0].block_id='wrong'],
]) test(label+' cannot open correction',async()=>{
 const s=await ready(),p=button(s.payload);mutate(p);
 const r=await correctClassification(s.env,p,()=>{throw Error('no network expected')});
 assert.notEqual(r.status,200);assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM poc_correction_requests').get().n,0);
});
test('reason and changed business are required',async()=>{
 const s=await ready(),p=await open(s);
 p.view.state.values.reason.reason.value='  ';p.view.state.values.business.business.selected_option.value='fp';
 const r=await correctClassification(s.env,p);assert.equal(r.body.response_action,'errors');
 assert.ok(r.body.errors.reason);assert.ok(r.body.errors.business);assert.equal(revisionCount(s),0);
});
test('cannot skip confirmation; expired sessions cannot be used',async()=>{
 const s=await ready(),p=await open(s);
 p.view.callback_id='poc_correct_confirm';assert.equal((await correctClassification(s.env,p)).status,409);
 s.sqlite.exec("UPDATE poc_correction_requests SET expires_at='2000-01-01T00:00:00.000Z'");
 const r=await correctClassification(s.env,p);assert.equal(r.body.view.callback_id,'poc_correct_error');assert.equal(revisionCount(s),0);
});
test('first of two correction sessions wins; stale form cannot overwrite it',async()=>{
 const s=await ready(),a=await confirm(s,await open(s)),b=await confirm(s,await open(s));
 await correctClassification(s.env,a);
 const r=await correctClassification(s.env,b);assert.equal(r.body.view.callback_id,'poc_correct_error');assert.equal(revisionCount(s),1);
});
for(const sendState of ['sending','uncertain']) test(sendState+' display update prevents conflicting correction',async()=>{
 const s=await ready(),p=await confirm(s,await open(s));s.sqlite.prepare('UPDATE poc_slack_outbox SET state=?').run(sendState);
 const r=await correctClassification(s.env,p);assert.equal(r.body.view.callback_id,'poc_correct_error');assert.equal(revisionCount(s),0);assert.equal(current(s).business_id,'fp');
});
test('disabled card cannot be corrected after opening form',async()=>{
 const s=await ready(),p=await confirm(s,await open(s));s.sqlite.exec('UPDATE poc_card_owners SET enabled=0');
 assert.equal((await correctClassification(s.env,p)).status,403);assert.equal(revisionCount(s),0);
});
test('revision failure rolls back answer, session and send intent',async()=>{
 const s=await ready(),p=await confirm(s,await open(s));
 s.sqlite.exec("CREATE TRIGGER reject_revision BEFORE INSERT ON poc_classification_revisions BEGIN SELECT RAISE(ABORT,'test'); END");
 await assert.rejects(correctClassification(s.env,p));
 assert.equal(current(s).business_id,'fp');assert.equal(s.sqlite.prepare('SELECT stage FROM poc_correction_requests').get().stage,'confirm');
 assert.equal(s.sqlite.prepare('SELECT state FROM poc_slack_outbox').get().state,'sent');
});
test('signed view submission traverses Worker endpoint and returns confirmation JSON',async()=>{
 const s=await ready(),p=await open(s);s.env.POC_SLACK_SEND_ENABLED='false';
 const raw=new URLSearchParams({payload:JSON.stringify(p)}).toString(),ts=String(Math.floor(Date.now()/1000));
 for(const secret of ['wrong','test-secret']) {
  const sig=createHmac('sha256',secret).update(`v0:${ts}:${raw}`).digest('hex');
  const r=await worker.fetch(new Request('https://example.test/slack/interactions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-slack-request-timestamp':ts,'x-slack-signature':`v0=${sig}`},body:raw}),s.env,{waitUntil(){}});
  assert.equal(r.status,secret==='wrong'?401:200);if(secret==='test-secret')assert.equal((await r.json()).view.callback_id,'poc_correct_confirm');
 }
 assert.equal(current(s).business_id,'fp');
});
test('rejected signed actor is recorded as actual actor, not card owner',async()=>{
 const s=await ready();s.env.POC_SLACK_SEND_ENABLED='false';
 const p={...s.payload,user:{id:'UOTHER'}};
 const raw=new URLSearchParams({payload:JSON.stringify(p)}).toString(),ts=String(Math.floor(Date.now()/1000));
 const sig=createHmac('sha256','test-secret').update(`v0:${ts}:${raw}`).digest('hex');
 const r=await worker.fetch(new Request('https://example.test/slack/interactions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-slack-request-timestamp':ts,'x-slack-signature':`v0=${sig}`},body:raw}),s.env,{waitUntil(){}});
 assert.equal(r.status,403);
 const receipt=s.sqlite.prepare('SELECT * FROM poc_interaction_receipts').get();
 assert.equal(receipt.actor_id,'UOTHER');assert.equal(receipt.http_status,403);
 assert.equal(current(s).classified_by,'UOWNER');
});

async function helperReady() {
  const s=await ready();
  s.sqlite.prepare('INSERT INTO poc_responders VALUES (?,?,?,1)').run('TTEST','UHELPER','総務担当');
  s.payload.user={id:'UHELPER'};
  return s;
}
test('registered responder opens and confirms correction; history keeps actual actor and original owner',async()=>{
  const s=await helperReady(),p=await confirm(s,await open(s));
  assert.equal((await correctClassification(s.env,p)).status,200);
  assert.equal(current(s).business_id,'common');assert.equal(current(s).owner_id,'UOWNER');
  assert.equal(current(s).classified_by,'UHELPER');
  assert.equal(s.sqlite.prepare('SELECT actor_id FROM poc_classification_revisions').get().actor_id,'UHELPER');
  assert.equal(s.sqlite.prepare('SELECT user_id FROM poc_classification_audit').get().user_id,'UOWNER');
});
test('registered responder cannot open another message or channel',async()=>{
  for(const mutate of [p=>p.container.message_ts='999.1',p=>p.channel.id='COTHER']) {
    const s=await helperReady(),p=button(s.payload);mutate(p);
    assert.equal((await correctClassification(s.env,p,()=>{throw Error('must not call Slack');})).status,403);
    assert.equal(revisionCount(s),0);
  }
});
test('registered responder cannot take over another actor correction session',async()=>{
  const s=await ready(),p=await open(s);
  s.sqlite.prepare('INSERT INTO poc_responders VALUES (?,?,?,1)').run('TTEST','UHELPER','総務担当');
  p.user={id:'UHELPER'};assert.equal((await correctClassification(s.env,p)).status,403);
  assert.equal(revisionCount(s),0);
});
test('revoking responder access after confirmation prevents correction',async()=>{
  const s=await helperReady(),p=await confirm(s,await open(s));s.sqlite.exec('UPDATE poc_responders SET enabled=0');
  assert.equal((await correctClassification(s.env,p)).status,403);
  assert.equal(revisionCount(s),0);assert.equal(current(s).business_id,'fp');
});
test('responder grant revoked immediately before final write cannot commit correction',async()=>{
  const s=await helperReady(),p=await confirm(s,await open(s));const batch=s.env.DB.batch;
  s.env.DB.batch=async statements=>{s.sqlite.exec('UPDATE poc_responders SET enabled=0');return batch(statements);};
  const r=await correctClassification(s.env,p);
  assert.equal(r.body.view.callback_id,'poc_correct_error');assert.equal(revisionCount(s),0);
  assert.equal(current(s).business_id,'fp');
});

test('signed correction returns private success view and schedules queued display update',async()=>{
  const s=await helperReady(),p=await confirm(s,await open(s));
  s.env.POC_SLACK_SEND_ENABLED='false';
  const raw=new URLSearchParams({payload:JSON.stringify(p)}).toString(),ts=String(Math.floor(Date.now()/1000));
  const sig=createHmac('sha256','test-secret').update(`v0:${ts}:${raw}`).digest('hex');
  const tasks=[];
  const r=await worker.fetch(new Request('https://example.test/slack/interactions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-slack-request-timestamp':ts,'x-slack-signature':`v0=${sig}`},body:raw}),s.env,{waitUntil(task){tasks.push(task);}});
  assert.equal(r.status,200);const body=await r.json();
  assert.equal(body.response_action,'update');assert.equal(body.view.callback_id,'poc_correct_done');
  assert.equal(tasks.length,1);await Promise.all(tasks);
  assert.equal(current(s).business_id,'common');assert.equal(revisionCount(s),1);
  const receipt=s.sqlite.prepare('SELECT * FROM poc_interaction_receipts').get();
  assert.equal(receipt.actor_id,'UHELPER');assert.equal(receipt.http_status,200);assert.equal(receipt.response_action,'update');
});

test('registered tester corrects a card without owner Slack ID and remains the actual actor',async()=>{
  const s=await helperReady();
  s.sqlite.exec('UPDATE poc_card_owners SET slack_user_id=NULL; UPDATE poc_classifications SET owner_id=NULL;');
  const p=await confirm(s,await open(s));
  const result=await correctClassification(s.env,p);
  assert.equal(result.saved,true);assert.equal(current(s).owner_id,null);
  assert.equal(current(s).classified_by,'UHELPER');
  assert.equal(s.sqlite.prepare('SELECT actor_id FROM poc_classification_revisions').get().actor_id,'UHELPER');
});
test('assigning the real owner during an open tester correction prevents stale save',async()=>{
  const s=await helperReady();
  s.sqlite.exec('UPDATE poc_card_owners SET slack_user_id=NULL; UPDATE poc_classifications SET owner_id=NULL;');
  const p=await confirm(s,await open(s));
  s.sqlite.exec("UPDATE poc_card_owners SET slack_user_id='UNEWOWNER'");
  assert.equal((await correctClassification(s.env,p)).status,403);
  assert.equal(revisionCount(s),0);
});
