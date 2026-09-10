// PoC only: operates on an event from the signature/source-verified receiver.
// No writes, network calls, currency/timezone inference, or business classification.
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const pending = reason => ({ status: 'review_required', reason });

export function parseNotification(event) {
  if (!event || event.type !== 'message' ||
      (event.subtype && event.subtype !== 'bot_message')) return pending('unsupported_event');
  if (!Array.isArray(event.attachments) || event.attachments.length !== 1 ||
      !Array.isArray(event.attachments[0]?.blocks)) return pending('unsupported_structure');
  const blocks = event.attachments[0].blocks;
  const fields = blocks.flatMap(b => Array.isArray(b?.fields) ? b.fields : []);
  const elements = blocks.flatMap(b => Array.isArray(b?.elements) ? b.elements : []);
  const texts = [...fields, ...elements].filter(x => x?.type === 'mrkdwn' && typeof x.text === 'string').map(x => x.text);
  const one = pattern => {
    const matches = texts.map(t => t.match(pattern)).filter(Boolean);
    return matches.length === 1 ? matches[0] : null;
  };
  if (!one(/^カードの利用がありました。$/)) return pending('unsupported_notice');
  const merchant = one(/^ご利用先:\n([^\n]+)$/)?.[1]?.trim();
  const amountText = one(/^ご利用金額:\n([^\n]+)$/)?.[1];
  const owner = one(/^ユーザー名: `([^`\n]+)`$/)?.[1]?.trim();
  const card = one(/^カード名: `([^`\n]+)`$/)?.[1]?.trim();
  const statusDate = one(/^\*ステータス\*: ([^|]+) \| \*日時\*: (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})$/);
  // The pasted sample's links were damaged by Markdown. Accept only Slack's
  // native <url|label> encoding; do not silently repair unverified input.
  const transaction = one(new RegExp(`^決済ID: <https://up-sider\\.com/user-cards/(${uuid})/transactions/(${uuid})\\|(${uuid})>$`, 'i'));
  if (!merchant || !amountText || !owner || !card || !statusDate || !transaction)
    return pending('missing_or_ambiguous_fields');
  if (statusDate[1] !== 'OK') return pending('unsupported_status');
  const amount = Number(amountText.replaceAll(',', ''));
  if (!/^(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/.test(amountText) || !Number.isSafeInteger(amount) || amount <= 0)
    return pending('unsupported_amount');
  const local = statusDate[2];
  const iso = local.replaceAll('/', '-').replace(' ', 'T');
  const date = new Date(`${iso}Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== iso)
    return pending('invalid_datetime');
  const [, cardId, transactionId, labelId] = transaction;
  const buttons = blocks.map(b => b?.accessory).filter(b => b?.type === 'button' &&
    typeof b.action_id === 'string' && b.action_id.startsWith('add_txn_memo-'));
  // A captured normal notification has no interactive controls at all. Its
  // matching transaction URL/label remains the identifier; a memo button is optional.
  // Do not generalize this to unknown or relocated controls without evidence.
  const withoutControls = !blocks.some(b => b?.accessory || b?.type === 'actions' ||
    (Array.isArray(b?.elements) && b.elements.some(e => e?.type === 'button')));
  if (labelId !== transactionId || (buttons.length !== 1 && !withoutControls) ||
      (buttons.length === 1 && (buttons[0].value !== transactionId || buttons[0].action_id !== `add_txn_memo-${transactionId}`)))
    return pending('conflicting_transaction_id');
  return {
    status: 'parsed_candidate',
    value: {
      merchant, amount, currency: null,
      occurredAtLocal: local, timezone: null, sourceStatus: 'OK',
      upsiderUserName: owner, cardName: card, cardId, transactionId,
      businessId: null,
    },
  };
}
