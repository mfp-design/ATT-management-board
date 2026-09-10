import { parseNotification } from './parse-notification.mjs';
export const BUSINESSES = Object.freeze({ fp: 'FP事業', monerun: 'MoneRun', agerun: 'Agerun', real_estate: '自社不動産事業', sake: '日本酒', trust_salon: 'トラストサロン', building_maintenance: 'ビルメンテナンス', corporate_training: '企業研修', common: '全社共通' });
const userId = /^U[A-Z0-9]+$/;
const transactionId = /^[0-9a-f-]{36}$/i;
const changed = r => r?.meta?.changes === 1;
const statement = (db, sql, ...args) => db.prepare(sql).bind(...args);

export async function canRespond(db, row, actor) {
  if (!row || !userId.test(actor || '')) return false;
  if (actor === row.owner_id) return true;
  return Boolean(await statement(db, 'SELECT 1 FROM poc_responders WHERE team_id=? AND slack_user_id=? AND enabled=1',row.team_id,actor).first());
}

export async function ingestClassification(env, payload) {
  const { DB: db } = env;
  const team = payload.team_id;
  const parsed = parseNotification(payload.event);
  const review = reason => statement(db, 'INSERT OR IGNORE INTO poc_parse_reviews VALUES (?,?,?)', team, payload.event_id, reason).run();
  if (parsed.status !== 'parsed_candidate') return review(parsed.reason);
  // Explicit configuration per verified PoC, not an inference from digits.
  if (env.POC_CURRENCY !== 'JPY' || env.POC_TIMEZONE !== 'Asia/Tokyo') return review('currency_timezone_unconfirmed');
  const value = { ...parsed.value, currency: 'JPY', timezone: 'Asia/Tokyo' };
  const owner = await statement(db, 'SELECT * FROM poc_card_owners WHERE team_id=? AND card_id=? AND enabled=1', team, value.cardId).first();
  const mapped = owner && userId.test(owner.slack_user_id || '');
  const existing = await statement(db, 'SELECT details FROM poc_classifications WHERE team_id=? AND transaction_id=?', team, value.transactionId).first();
  if (existing && existing.details !== JSON.stringify(value)) {
    await db.batch([
      statement(db, 'INSERT OR IGNORE INTO poc_parse_reviews VALUES (?,?,?)', team, payload.event_id, 'transaction_changed'),
      statement(db, "UPDATE poc_classifications SET state='review_required' WHERE team_id=? AND transaction_id=?", team, value.transactionId),
    ]);
    return;
  }
  await db.batch([
    statement(db, `INSERT OR IGNORE INTO poc_classifications
      (team_id,transaction_id,card_id,channel_id,source_ts,event_id,details,owner_id,state)
      VALUES (?,?,?,?,?,?,?,?,?)`, team, value.transactionId, value.cardId, payload.event.channel,
      payload.event.ts, payload.event_id, JSON.stringify(value), mapped ? owner.slack_user_id : null, mapped ? 'pending' : 'unmapped'),
    statement(db, `INSERT OR IGNORE INTO poc_slack_outbox (team_id,transaction_id,kind)
      SELECT team_id,transaction_id,'prompt' FROM poc_classifications
      WHERE team_id=? AND transaction_id=? AND state='pending'`, team, value.transactionId),
  ]);
}

export function promptMessage(row) {
  const data = JSON.parse(row.details);
  if (!userId.test(row.owner_id || '')) throw Error('Unmapped owner');
  return { channel: row.channel_id, thread_ts: row.source_ts,
    text: '【検証】経費の対象事業を選択してください。',
    unfurl_links: false, unfurl_media: false,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `<@${row.owner_id}> 【検証】この決済の対象事業を選択してください。` } },
      { type: 'section', text: { type: 'plain_text', text: `${data.cardName} / ${data.amount}円\n${data.merchant}\n${data.occurredAtLocal}（日本時間）`, emoji: false } },
      { type: 'actions', block_id: `classify:${row.transaction_id}`, elements: [{
        type: 'static_select', action_id: 'poc_classify', placeholder: { type: 'plain_text', text: '対象事業を選択' },
        confirm: { title: {type:'plain_text',text:'事業の登録確認'}, text: {type:'plain_text',text:'選択した事業で登録します。よろしいですか？'}, confirm: {type:'plain_text',text:'登録する'}, deny: {type:'plain_text',text:'戻る'} },
        options: Object.entries(BUSINESSES).map(([value,text]) => ({text:{type:'plain_text',text},value})),
      }] },
    ] };
}

export async function classify(env, payload) {
  const action = payload?.actions?.[0];
  if (payload?.type !== 'block_actions' || payload.api_app_id !== env.SLACK_APP_ID ||
      payload.team?.id !== env.SLACK_TEAM_ID || payload.channel?.id !== env.SLACK_CHANNEL_ID ||
      payload.actions?.length !== 1 || action?.action_id !== 'poc_classify' || action?.type !== 'static_select') return 403;
  const id = action.block_id?.startsWith('classify:') ? action.block_id.slice(9) : '';
  const business = action.selected_option?.value;
  if (!transactionId.test(id) || !Object.hasOwn(BUSINESSES,business || '')) return 400;
  const db = env.DB;
  const row = await statement(db, 'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?', env.SLACK_TEAM_ID,id).first();
  const currentOwner = row && await statement(db, 'SELECT slack_user_id FROM poc_card_owners WHERE team_id=? AND card_id=? AND enabled=1', row.team_id,row.card_id).first();
  if (!row || !row.owner_id || currentOwner?.slack_user_id !== row.owner_id ||
      !row.prompt_ts || payload.container?.type !== 'message' || payload.container.channel_id !== row.channel_id ||
      payload.container.message_ts !== row.prompt_ts || payload.message?.ts !== row.prompt_ts || payload.message?.thread_ts !== row.source_ts) return 403;
  if (!await canRespond(db,row,payload.user?.id)) return 403;
  if (row.state === 'classified') return row.business_id === business ? 200 : 409;
  if (row.state !== 'pending') return 409;
  const now = new Date().toISOString();
  // Single write winner; audit and Slack update intent are committed atomically.
  await db.batch([
    statement(db, `UPDATE poc_classifications SET state='classified', business_id=?, classified_by=?, classified_at=?
      WHERE team_id=? AND transaction_id=? AND state='pending'
      AND EXISTS (SELECT 1 FROM poc_card_owners o WHERE o.team_id=poc_classifications.team_id
        AND o.card_id=poc_classifications.card_id AND o.enabled=1 AND o.slack_user_id=poc_classifications.owner_id)
      AND (owner_id=? OR EXISTS (SELECT 1 FROM poc_responders r WHERE r.team_id=poc_classifications.team_id
        AND r.slack_user_id=? AND r.enabled=1))`,
      business,payload.user.id,now,row.team_id,id,payload.user.id,payload.user.id),
    statement(db, `INSERT OR IGNORE INTO poc_classification_audit
      SELECT team_id,transaction_id,classified_by,business_id,classified_at FROM poc_classifications
      WHERE team_id=? AND transaction_id=? AND state='classified'`,row.team_id,id),
    statement(db, `INSERT OR IGNORE INTO poc_slack_outbox (team_id,transaction_id,kind)
      SELECT team_id,transaction_id,'update' FROM poc_classifications WHERE team_id=? AND transaction_id=? AND state='classified'`,row.team_id,id),
  ]);
  const winner = await statement(db, 'SELECT business_id FROM poc_classifications WHERE team_id=? AND transaction_id=?',row.team_id,id).first();
  return winner?.business_id === business ? 200 : 409;
}

// Claim once before network I/O. An uncertain send is held for operator review,
// never automatically re-posted (Slack posting is not a DB transaction).
export async function flushOutbox(env, send = fetch) {
  if (env.POC_SLACK_SEND_ENABLED !== 'true' || !env.SLACK_BOT_TOKEN) return;
  const db = env.DB;
  const jobs = await statement(db, "SELECT * FROM poc_slack_outbox WHERE team_id=? AND state='pending' LIMIT 5",env.SLACK_TEAM_ID).all();
  for (const job of jobs.results) {
    let row = await statement(db, 'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?',job.team_id,job.transaction_id).first();
    if (!row || row.channel_id !== env.SLACK_CHANNEL_ID || !['pending','classified'].includes(row.state)) continue;
    const owner = await statement(db, 'SELECT slack_user_id, owner_name FROM poc_card_owners WHERE team_id=? AND card_id=? AND enabled=1',row.team_id,row.card_id).first();
    if (owner?.slack_user_id !== row.owner_id) continue;
    if (job.kind === 'update' && (!row.prompt_ts || row.state !== 'classified')) continue;
    const claim = await statement(db, "UPDATE poc_slack_outbox SET state='sending' WHERE team_id=? AND transaction_id=? AND kind=? AND state='pending'",job.team_id,job.transaction_id,job.kind).run();
    if (!changed(claim)) continue;
    try {
      // Re-read after claim: a correction may have committed between the initial read and claim.
      row = await statement(db, 'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?',job.team_id,job.transaction_id).first();
      const responder = job.kind === 'update' && row.classified_by !== owner.slack_user_id
        ? await statement(db,'SELECT display_name FROM poc_responders WHERE team_id=? AND slack_user_id=?',row.team_id,row.classified_by).first() : null;
      const responderName = row.classified_by === owner.slack_user_id ? (owner.owner_name || row.classified_by) : (responder?.display_name || row.classified_by);
      const revision = job.kind === 'update' ? await statement(db, `SELECT reason FROM poc_classification_revisions
        WHERE team_id=? AND transaction_id=? AND after_business=? AND actor_id=? AND created_at=?
        ORDER BY rowid DESC LIMIT 1`,row.team_id,row.transaction_id,row.business_id,row.classified_by,row.classified_at).first() : null;
      const body = job.kind === 'prompt' ? promptMessage(row) : {
        channel:row.channel_id, ts:row.prompt_ts,
        text:`【検証】分類済み：${BUSINESSES[row.business_id]}`,
        blocks:[{type:'section',text:{type:'plain_text',text:`【検証】分類済み：${BUSINESSES[row.business_id]}（回答者：${responderName}）`,emoji:false}},
          ...(revision ? [{type:'section',text:{type:'plain_text',text:`修正理由：${revision.reason}`,emoji:false}}] : []),
          {type:'actions',block_id:`correct:${row.transaction_id}`,elements:[{type:'button',action_id:'poc_correct',value:row.transaction_id,text:{type:'plain_text',text:'回答を修正する'}}]}],
      };
      const response = await send(`https://slack.com/api/${job.kind === 'prompt' ? 'chat.postMessage' : 'chat.update'}`, {
        method:'POST', headers:{authorization:`Bearer ${env.SLACK_BOT_TOKEN}`,'content-type':'application/json'},
        body:JSON.stringify(body), signal:AbortSignal.timeout(8000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok || result.channel !== row.channel_id || !/^\d+\.\d+$/.test(result.ts || '')) throw Error('Slack send uncertain');
      const writes = [statement(db,"UPDATE poc_slack_outbox SET state='sent' WHERE team_id=? AND transaction_id=? AND kind=?",job.team_id,job.transaction_id,job.kind)];
      if (job.kind === 'prompt') writes.push(statement(db,'UPDATE poc_classifications SET prompt_ts=? WHERE team_id=? AND transaction_id=?',result.ts,job.team_id,job.transaction_id));
      await db.batch(writes);
    } catch {
      await statement(db,"UPDATE poc_slack_outbox SET state='uncertain' WHERE team_id=? AND transaction_id=? AND kind=?",job.team_id,job.transaction_id,job.kind).run();
    }
  }
}
