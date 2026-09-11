// One explicitly prepared expense/date, not the production reminder scheduler.
import { mentionUserId, promptMessage } from './classification.mjs';
const reminderQuery = (db,sql,...args) => db.prepare(sql).bind(...args);
const reminderChanged = r => r?.meta?.changes === 1;
export function reminderDue(date) {
  if (!/^\d{4}-\d{2}-(01|11|21)$/.test(date || '')) throw Error('Invalid reminder date');
  const due = Date.parse(`${date}T01:00:00.000Z`); // 10:00 Asia/Tokyo
  if (!Number.isFinite(due) || new Date(due).toISOString().slice(0,10) !== date) throw Error('Invalid reminder date');
  return due;
}
async function reminderRow(env,test) {
  const row = await reminderQuery(env.DB,`SELECT c.* FROM poc_classifications c JOIN poc_card_owners o
    ON o.team_id=c.team_id AND o.card_id=c.card_id
    WHERE c.team_id=? AND c.transaction_id=? AND o.enabled=1 AND o.slack_user_id IS c.owner_id`,
    test.team_id,test.transaction_id).first();
  if (!row || row.team_id !== env.SLACK_TEAM_ID || row.channel_id !== env.SLACK_CHANNEL_ID ||
      row.channel_id !== test.channel_id || row.source_ts !== test.source_ts || row.prompt_ts !== test.prompt_ts ||
      row.state !== 'pending' || mentionUserId(row) !== test.recipient_id) return null;
  const data = JSON.parse(row.details);
  const date = data.occurredAtLocal?.slice(0,10).replaceAll('/','-');
  if (data.currency !== 'JPY' || data.timezone !== 'Asia/Tokyo' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date >= test.run_date) return null;
  return row;
}
async function reminderSlack(env,method,body,send) {
  const url=new URL(`https://slack.com/api/${method}`);
  const read=method === 'chat.getPermalink';
  if (read) for (const [key,value] of Object.entries(body)) url.searchParams.set(key,value);
  const response = await send(url.href,{
    method:read?'GET':'POST',headers:{authorization:`Bearer ${env.SLACK_BOT_TOKEN}`,...(read?{}:{'content-type':'application/json'})},
    ...(read?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw Error('Slack operation failed');
  return result;
}
// Operator-only helper, never routed through the deployed Worker's HTTP handler.
export async function prepareReminderTest(env,spec,now=Date.now()) {
  if (!spec.testId || spec.testId !== env.POC_REMINDER_TEST_ID || reminderDue(spec.runDate) <= now)
    throw Error('Invalid test configuration');
  const row = await reminderQuery(env.DB,'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?',
    env.SLACK_TEAM_ID,spec.transactionId).first();
  if (!row || row.state !== 'classified' || row.classified_at !== spec.expectedClassifiedAt ||
      row.channel_id !== env.SLACK_CHANNEL_ID || !/^\d+\.\d+$/.test(row.prompt_ts || '') || !mentionUserId(row))
    throw Error('Classification changed or is not ready');
  const token = crypto.randomUUID();
  const resetAt = new Date(now).toISOString();
  const writes = await env.DB.batch([
    reminderQuery(env.DB,`INSERT OR IGNORE INTO poc_reminder_tests
      (test_id,team_id,transaction_id,run_date,channel_id,source_ts,prompt_ts,recipient_id,before_json,reset_at,reset_token,reason,state)
      SELECT ?,c.team_id,c.transaction_id,?,c.channel_id,c.source_ts,c.prompt_ts,?,?,?,?,'User-approved PoC reminder rehearsal','prepared'
      FROM poc_classifications c JOIN poc_card_owners o ON o.team_id=c.team_id AND o.card_id=c.card_id
      WHERE c.team_id=? AND c.transaction_id=? AND c.state='classified' AND c.classified_at=?
        AND c.channel_id=? AND c.prompt_ts=? AND o.enabled=1 AND o.slack_user_id IS c.owner_id
        AND NOT EXISTS (SELECT 1 FROM poc_slack_outbox b WHERE b.team_id=c.team_id AND b.transaction_id=c.transaction_id
          AND b.state!='sent')`,spec.testId,spec.runDate,mentionUserId(row),JSON.stringify(row),resetAt,token,
      row.team_id,row.transaction_id,row.classified_at,row.channel_id,row.prompt_ts),
    reminderQuery(env.DB,`UPDATE poc_classifications SET state='pending',business_id=NULL,classified_by=NULL,classified_at=NULL
      WHERE team_id=? AND transaction_id=? AND state='classified' AND classified_at=?
      AND EXISTS (SELECT 1 FROM poc_reminder_tests WHERE test_id=? AND reset_token=?)`,
      row.team_id,row.transaction_id,row.classified_at,spec.testId,token),
  ]);
  if (!reminderChanged(writes[0]) || !reminderChanged(writes[1])) throw Error('Test already exists or classification changed');
}
// Update the original app post without mentioning anyone; arm only after Slack confirms it.
export async function showPendingReminderTest(env,send=fetch) {
  const test = await reminderQuery(env.DB,'SELECT * FROM poc_reminder_tests WHERE test_id=? AND team_id=?',
    env.POC_REMINDER_TEST_ID,env.SLACK_TEAM_ID).first();
  if (!test || test.state !== 'prepared' || !env.SLACK_BOT_TOKEN) return;
  const row = await reminderRow(env,test);
  if (!row) throw Error('Test target changed');
  const claim = await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='resetting' WHERE test_id=? AND state='prepared'",test.test_id).run();
  if (!reminderChanged(claim)) return;
  try {
    const body = promptMessage(row);
    delete body.thread_ts;
    body.ts=row.prompt_ts;
    body.text='【検証】未回答：経費の対象事業を選択してください。';
    body.blocks[0]={type:'section',text:{type:'plain_text',text:body.text,emoji:false}};
    const posted=await reminderSlack(env,'chat.update',body,send);
    if (posted.channel !== row.channel_id || posted.ts !== row.prompt_ts) throw Error('Unexpected Slack post');
    await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='armed' WHERE test_id=? AND state='resetting'",test.test_id).run();
  } catch {
    await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='reset_uncertain',outcome='reset_display_failed' WHERE test_id=?",test.test_id).run();
    throw Error('Reset display requires operator review');
  }
}
export function reminderMessage(row,recipient,permalink) {
  const data=JSON.parse(row.details);
  return {channel:row.channel_id,thread_ts:row.source_ts,reply_broadcast:false,unfurl_links:false,unfurl_media:false,
    text:`<@${recipient}> 【検証・再通知】この経費の対象事業が未回答です。`,
    blocks:[
      {type:'section',text:{type:'mrkdwn',text:`<@${recipient}> 【検証・再通知】この経費の対象事業が未回答です。入力をお願いします。`}},
      {type:'section',text:{type:'plain_text',text:`${data.cardName} / ${data.amount}円\n${data.merchant}\n${data.occurredAtLocal}（日本時間）`,emoji:false}},
      {type:'section',text:{type:'mrkdwn',text:`<${permalink}|対象事業を回答する>`}},
    ]};
}
export async function runReminderTest(env,scheduledTime,send=fetch,now=Date.now()) {
  if (env.POC_REMINDER_TEST_ENABLED !== 'true' || env.POC_CLASSIFICATION_ENABLED !== 'true' ||
      !env.POC_REMINDER_TEST_ID || !env.SLACK_BOT_TOKEN) return;
  const test=await reminderQuery(env.DB,'SELECT * FROM poc_reminder_tests WHERE test_id=? AND team_id=?',
    env.POC_REMINDER_TEST_ID,env.SLACK_TEAM_ID).first();
  if (!test || test.state !== 'armed') return;
  const due=reminderDue(test.run_date);
  if (now >= due+3600000) {
    await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='skipped',outcome='expired' WHERE test_id=? AND state='armed'",test.test_id).run();
    return;
  }
  if (scheduledTime !== due || now < due) return;
  const claim=await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='sending' WHERE test_id=? AND state='armed'",test.test_id).run();
  if (!reminderChanged(claim)) return;
  try {
    let row=await reminderRow(env,test);
    if (!row) {
      await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='skipped',outcome='not_eligible' WHERE test_id=?",test.test_id).run();
      return;
    }
    const link=await reminderSlack(env,'chat.getPermalink',{channel:row.channel_id,message_ts:row.prompt_ts},send);
    const url=new URL(link.permalink);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.slack\.com$/.test(url.hostname) ||
        url.pathname !== `/archives/${row.channel_id}/p${row.prompt_ts.replace('.','')}`) throw Error('Unexpected permalink');
    row=await reminderRow(env,test); // Answer may arrive during the permalink request.
    if (!row) {
      await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='skipped',outcome='not_eligible' WHERE test_id=?",test.test_id).run();
      return;
    }
    const posted=await reminderSlack(env,'chat.postMessage',reminderMessage(row,test.recipient_id,url.href),send);
    if (posted.channel !== row.channel_id || !/^\d+\.\d+$/.test(posted.ts || '')) throw Error('Unexpected Slack post');
    await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='sent',outcome='posted',message_ts=?,sent_at=? WHERE test_id=?",
      posted.ts,new Date(now).toISOString(),test.test_id).run();
  } catch {
    // No automatic retry after an uncertain external side effect.
    await reminderQuery(env.DB,"UPDATE poc_reminder_tests SET state='uncertain',outcome='slack_or_storage_failed' WHERE test_id=?",test.test_id).run();
  }
}
