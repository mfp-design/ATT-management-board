import { BUSINESSES, canRespond } from './classification.mjs';
const q = (db, sql, ...args) => db.prepare(sql).bind(...args);
const plain = text => ({ type: 'plain_text', text, emoji: false });
const result = (status, body = null) => ({ status, body });
const failure = text => result(200, { response_action: 'update', view: {
  type: 'modal', callback_id: 'poc_correct_error', title: plain('修正を保存できませんでした'),
  close: plain('閉じる'), blocks: [{ type: 'section', text: plain(text) }],
} });
const invalid = errors => result(200, { response_action: 'errors', errors });
const saved = session => ({ ...result(200, { response_action: 'update', view: {
  type: 'modal', callback_id: 'poc_correct_done', title: plain('修正しました'), close: plain('閉じる'),
  blocks: [{ type: 'section', text: plain(`修正内容を保存しました。\n変更前：${BUSINESSES[session.expected_business] || session.expected_business}\n変更後：${BUSINESSES[session.business_id]}\n修正理由：${session.reason}`) }],
} }), saved: true });

export function correctionForm(row, requestId) {
  return { type: 'modal', callback_id: 'poc_correct_edit', private_metadata: requestId,
    title: plain('回答を修正する'), submit: plain('確認へ'), close: plain('キャンセル'), blocks: [
      { type: 'section', text: plain(`現在の事業：${BUSINESSES[row.business_id] || row.business_id}`) },
      { type: 'input', block_id: 'business', label: plain('修正後の事業'), element: {
        type: 'static_select', action_id: 'business', placeholder: plain('事業を選択'),
        options: Object.entries(BUSINESSES).map(([value, text]) => ({ text: plain(text), value })),
      } },
      { type: 'input', block_id: 'reason', label: plain('修正理由'), element: {
        type: 'plain_text_input', action_id: 'reason', max_length: 500,
        placeholder: plain('例：事業を誤って選択したため'),
      } },
    ] };
}
function confirmation(session) {
  return { type: 'modal', callback_id: 'poc_correct_confirm', private_metadata: session.request_id,
    title: plain('修正内容の確認'), submit: plain('修正を登録'), close: plain('キャンセル'), blocks: [
      { type: 'section', text: plain(`変更前：${BUSINESSES[session.expected_business] || session.expected_business}\n変更後：${BUSINESSES[session.business_id]}\n修正理由：${session.reason}`) },
      { type: 'section', text: plain('この内容で修正します。よろしいですか？') },
    ] };
}

// Called only after worker.mjs verifies the unmodified Slack request signature.
// Current card owner or explicitly registered workspace responder; actual actor is audited.
export async function correctClassification(env, payload, send = fetch) {
  if (payload?.api_app_id !== env.SLACK_APP_ID || payload.team?.id !== env.SLACK_TEAM_ID ||
      !/^U[A-Z0-9]+$/.test(payload.user?.id || '')) return result(403);
  const db = env.DB;
  if (payload.type === 'block_actions') {
    const action = payload.actions?.[0];
    if (payload.actions?.length !== 1 || action?.type !== 'button' || action.action_id !== 'poc_correct' ||
        payload.channel?.id !== env.SLACK_CHANNEL_ID || !payload.trigger_id) return result(403);
    const id = action.value;
    if (!/^[0-9a-f-]{36}$/i.test(id || '') || action.block_id !== `correct:${id}`) return result(400);
    const row = await q(db, 'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?',env.SLACK_TEAM_ID,id).first();
    const owner = row && await q(db,'SELECT slack_user_id FROM poc_card_owners WHERE team_id=? AND card_id=? AND enabled=1',row.team_id,row.card_id).first();
    if (!row || row.channel_id !== env.SLACK_CHANNEL_ID || !owner || owner.slack_user_id !== row.owner_id ||
        !row.prompt_ts || payload.container?.type !== 'message' || payload.container.channel_id !== row.channel_id ||
        payload.container.message_ts !== row.prompt_ts || payload.message?.ts !== row.prompt_ts || payload.message?.thread_ts !== row.source_ts) return result(403);
    if (!await canRespond(db,row,payload.user.id)) return result(403);
    if (row.state !== 'classified' || !row.classified_at) return result(409);
    if (!env.SLACK_BOT_TOKEN) return result(503);
    const requestId = crypto.randomUUID();
    await q(db,`INSERT INTO poc_correction_requests
      (request_id,team_id,transaction_id,actor_id,expected_business,expected_at,stage,expires_at)
      VALUES (?,?,?,?,?,?,'edit',?)`,requestId,row.team_id,id,payload.user.id,row.business_id,row.classified_at,
      new Date(Date.now()+30*60*1000).toISOString()).run();
    try {
      const response = await send('https://slack.com/api/views.open', { method:'POST',
        headers:{ authorization:`Bearer ${env.SLACK_BOT_TOKEN}`, 'content-type':'application/json' },
        body:JSON.stringify({trigger_id:payload.trigger_id,view:correctionForm(row,requestId)}), signal:AbortSignal.timeout(1800),
      });
      const opened = await response.json();
      if (!response.ok || !opened.ok || typeof opened.view?.id !== 'string') return result(503);
      await q(db,'UPDATE poc_correction_requests SET view_id=? WHERE request_id=?',opened.view.id,requestId).run();
      return result(200);
    } catch { return result(503); }
  }
  if (payload.type !== 'view_submission' || !['poc_correct_edit','poc_correct_confirm'].includes(payload.view?.callback_id)) return result(403);
  const session = await q(db,'SELECT * FROM poc_correction_requests WHERE request_id=?',payload.view.private_metadata || '').first();
  if (!session || session.team_id !== env.SLACK_TEAM_ID || session.actor_id !== payload.user.id ||
      !session.view_id || session.view_id !== payload.view.id) return result(403);
  if (session.stage === 'applied') return payload.view.callback_id === 'poc_correct_confirm' ? saved(session) : result(409);
  if (session.expires_at < new Date().toISOString()) return failure('入力の有効期限が切れました。投稿から修正をやり直してください。');
  const row = await q(db,'SELECT * FROM poc_classifications WHERE team_id=? AND transaction_id=?',session.team_id,session.transaction_id).first();
  const owner = row && await q(db,'SELECT slack_user_id FROM poc_card_owners WHERE team_id=? AND card_id=? AND enabled=1',row.team_id,row.card_id).first();
  if (!row || row.channel_id !== env.SLACK_CHANNEL_ID || !owner || owner.slack_user_id !== row.owner_id) return result(403);
  if (!await canRespond(db,row,payload.user.id)) return result(403);
  if (row.state !== 'classified' || row.business_id !== session.expected_business || row.classified_at !== session.expected_at)
    return failure('別の変更が保存されています。最新の投稿から修正をやり直してください。');
  if (payload.view.callback_id === 'poc_correct_edit') {
    if (session.stage === 'confirm') return result(200,{response_action:'update',view:confirmation(session)});
    const business = payload.view.state?.values?.business?.business?.selected_option?.value;
    const reasonValue = payload.view.state?.values?.reason?.reason?.value;
    const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';
    const errors = {};
    if (!Object.hasOwn(BUSINESSES,business || '') || business === row.business_id) errors.business='現在と異なる事業を選択してください。';
    if (!reason || reason.length > 500) errors.reason='修正理由を1〜500文字で入力してください。';
    if (Object.keys(errors).length) return invalid(errors);
    await q(db,"UPDATE poc_correction_requests SET business_id=?,reason=?,stage='confirm' WHERE request_id=? AND stage='edit'",business,reason,session.request_id).run();
    const prepared = await q(db,'SELECT * FROM poc_correction_requests WHERE request_id=?',session.request_id).first();
    return result(200,{response_action:'update',view:confirmation(prepared)});
  }
  if (session.stage !== 'confirm') return result(409);
  const now = new Date().toISOString();
  const applyToken = crypto.randomUUID();
  const writes = await db.batch([
    q(db,`UPDATE poc_correction_requests SET stage='applied',applied_at=?,apply_token=? WHERE request_id=? AND stage='confirm'
      AND EXISTS (SELECT 1 FROM poc_classifications c JOIN poc_card_owners o ON o.team_id=c.team_id AND o.card_id=c.card_id
        WHERE c.team_id=poc_correction_requests.team_id AND c.transaction_id=poc_correction_requests.transaction_id
        AND c.state='classified' AND c.business_id=poc_correction_requests.expected_business AND c.classified_at=poc_correction_requests.expected_at
        AND o.slack_user_id IS c.owner_id AND o.enabled=1
        AND (c.owner_id=poc_correction_requests.actor_id OR EXISTS (SELECT 1 FROM poc_responders r
          WHERE r.team_id=c.team_id AND r.slack_user_id=poc_correction_requests.actor_id AND r.enabled=1)))
      AND NOT EXISTS (SELECT 1 FROM poc_slack_outbox b WHERE b.team_id=poc_correction_requests.team_id
        AND b.transaction_id=poc_correction_requests.transaction_id AND b.state IN ('sending','uncertain'))`,now,applyToken,session.request_id),
    q(db,`INSERT OR IGNORE INTO poc_classification_revisions SELECT request_id,team_id,transaction_id,actor_id,expected_business,business_id,reason,applied_at
      FROM poc_correction_requests WHERE request_id=? AND stage='applied' AND apply_token=?`,session.request_id,applyToken),
    q(db,`UPDATE poc_classifications SET business_id=?,classified_by=?,classified_at=? WHERE team_id=? AND transaction_id=?
      AND business_id=? AND classified_at=? AND EXISTS (SELECT 1 FROM poc_correction_requests WHERE request_id=? AND stage='applied' AND apply_token=?)`,
      session.business_id,payload.user.id,now,session.team_id,session.transaction_id,session.expected_business,session.expected_at,session.request_id,applyToken),
    q(db,`INSERT INTO poc_slack_outbox (team_id,transaction_id,kind,state)
      SELECT team_id,transaction_id,'update','pending' FROM poc_correction_requests WHERE request_id=? AND stage='applied' AND apply_token=?
      ON CONFLICT(team_id,transaction_id,kind) DO UPDATE SET state='pending' WHERE poc_slack_outbox.state='sent'`,session.request_id,applyToken),
  ]);
  if (writes[0]?.meta?.changes !== 1 && (await q(db,'SELECT stage FROM poc_correction_requests WHERE request_id=?',session.request_id).first())?.stage === 'applied') return saved(session);
  if (writes[0]?.meta?.changes !== 1) return failure('別の変更、または表示更新の処理中です。最新の投稿を確認してからやり直してください。');
  return saved(session);
}
