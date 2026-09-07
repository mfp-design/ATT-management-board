import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, webcrypto } from 'node:crypto';
import worker from './worker.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const secret = 'synthetic-test-secret';
function setup() {
  const rows = new Map();
  const env = { SLACK_SIGNING_SECRET: secret, SLACK_TEAM_ID: 'Ttest', SLACK_CHANNEL_ID: 'Ctest', UPSIDER_APP_ID: 'Atest', UPSIDER_BOT_ID: 'Btest', DB: { prepare() { return { first: async () => ({ ok: 1 }), bind(...values) { return { run: async () => { rows.set(values[1], values); } }; } }; } } };
  return { env, rows };
}
function request(body, { timestamp = Math.floor(Date.now()/1000), key = secret } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const sig = createHmac('sha256', key).update(`v0:${timestamp}:${raw}`).digest('hex');
  return new Request('https://example.test/slack/events', { method: 'POST', headers: { 'content-type': 'application/json', 'x-slack-request-timestamp': String(timestamp), 'x-slack-signature': `v0=${sig}` }, body: raw });
}
const event = () => ({ type: 'event_callback', team_id: 'Ttest', event_id: 'Ev1', event: { type: 'message', channel: 'Ctest', app_id: 'Atest', bot_id: 'Btest', ts: '123.456', text: '架空通知' } });
test('signed challenge verifies D1 and returns exact challenge', async () => { const {env}=setup(); const r=await worker.fetch(request({type:'url_verification',challenge:'challenge'}),env); assert.equal(r.status,200);assert.equal(await r.text(),'challenge'); });
for (const [name, options] of [['wrong key',{key:'wrong'}],['stale timestamp',{timestamp:Math.floor(Date.now()/1000)-600}],['future timestamp',{timestamp:Math.floor(Date.now()/1000)+600}]]) test(name,async()=>{const {env,rows}=setup();assert.equal((await worker.fetch(request(event(),options),env)).status,401);assert.equal(rows.size,0);});
for (const field of ['team_id','channel']) test(`wrong ${field}`,async()=>{const {env,rows}=setup();const p=event();if(field==='channel')p.event.channel='Cother';else p.team_id='Tother';assert.equal((await worker.fetch(request(p),env)).status,403);assert.equal(rows.size,0);});
test('unconfigured source stays closed',async()=>{const {env,rows}=setup();delete env.UPSIDER_BOT_ID;assert.equal((await worker.fetch(request(event()),env)).status,503);assert.equal(rows.size,0);});
for (const field of ['app_id','bot_id']) test(`other or own app rejected by ${field}`,async()=>{const {env,rows}=setup();const p=event();p.event[field]='other';assert.equal((await worker.fetch(request(p),env)).status,200);assert.equal(rows.size,0);});
test('human message ignored',async()=>{const {env,rows}=setup();const p=event();delete p.event.bot_id;delete p.event.app_id;await worker.fetch(request(p),env);assert.equal(rows.size,0);});
test('authorized raw event persisted; same event key on retry',async()=>{const {env,rows}=setup();for(let i=0;i<2;i++)assert.equal((await worker.fetch(request(event()),env)).status,200);assert.equal(rows.size,1);assert.equal(JSON.parse(rows.get('Ev1')[5]).event.text,'架空通知');});
test('DB failure asks Slack to retry',async()=>{const {env}=setup();env.DB.prepare=()=>{throw Error('private error');};const r=await worker.fetch(request(event()),env);assert.equal(r.status,503);assert.equal(await r.text(),'Storage unavailable');});
test('malformed JSON fails',async()=>{const {env}=setup();assert.equal((await worker.fetch(request('{'),env)).status,400);});
test('oversize fails before storage',async()=>{const {env,rows}=setup();assert.equal((await worker.fetch(request('x'.repeat(262145)),env)).status,413);assert.equal(rows.size,0);});
test('no public event viewer',async()=>{const {env}=setup();assert.equal((await worker.fetch(new Request('https://example.test/events'),env)).status,404);});
