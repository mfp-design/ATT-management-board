import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNotification } from './parse-notification.mjs';

// Synthetic data reconstructed from the observed structure, NOT a raw capture.
const cardId = '11111111-1111-4111-8111-111111111111';
const txnId = '22222222-2222-4222-8222-222222222222';
const text = text => ({ type: 'mrkdwn', text, verbatim: false });
function sample() {
  return { type: 'message', text: '', attachments: [{ blocks: [
    { type: 'section', fields: [text('カードの利用がありました。')] },
    { type: 'section', fields: [text('ご利用先:\nTEST SHOP'), text('ご利用金額:\n800')],
      accessory: { type: 'button', action_id: `add_txn_memo-${txnId}`, value: txnId } },
    { type: 'context', elements: [text('*ステータス*: OK | *日時*: 2026/09/09 18:00:28')] },
    { type: 'divider' },
    { type: 'context', elements: [text('ユーザー名: `test-user`'), text('カード名: `TEST CARD`'),
      text(`決済ID: <https://up-sider.com/user-cards/${cardId}/transactions/${txnId}|${txnId}>`)] },
  ] }] };
}
test('empty top-level text: extracts blocks without inferring currency, timezone or owner Slack ID', () => {
  const event = sample(); event.user = 'BOT_USER';
  assert.deepEqual(parseNotification(event), { status: 'parsed_candidate', value: {
    merchant: 'TEST SHOP', amount: 800, currency: null, occurredAtLocal: '2026/09/09 18:00:28',
    timezone: null, sourceStatus: 'OK', upsiderUserName: 'test-user', cardName: 'TEST CARD',
    cardId, transactionId: txnId, businessId: null,
  } });
});
test('block ordering and random block IDs do not affect extraction', () => {
  const event = sample(); event.attachments[0].blocks.reverse().forEach(b => b.block_id = 'changed');
  assert.equal(parseNotification(event).status, 'parsed_candidate');
});
for (const value of ['-800', '8.5', '1,00', '01,000', '1,000.00', 'USD 800', '0', '9007199254740992']) {
  test(`unverified amount format ${value} requires review`, () => {
    const event = sample(); event.attachments[0].blocks[1].fields[1].text = `ご利用金額:\n${value}`;
    assert.equal(parseNotification(event).reason, 'unsupported_amount');
  });
}
test('missing or duplicated field requires review', () => {
  const event = sample(); event.attachments[0].blocks[1].fields.pop();
  assert.equal(parseNotification(event).status, 'review_required');
  const duplicate = sample(); duplicate.attachments[0].blocks[1].fields.push(text('ご利用金額:\n900'));
  assert.equal(parseNotification(duplicate).status, 'review_required');
});
test('invalid calendar date and non-OK status require review', () => {
  for (const [value, reason] of [
    ['*ステータス*: OK | *日時*: 2026/02/30 18:00:28', 'invalid_datetime'],
    ['*ステータス*: FAILED | *日時*: 2026/09/09 18:00:28', 'unsupported_status'],
  ]) {
    const event = sample(); event.attachments[0].blocks[2].elements[0].text = value;
    assert.equal(parseNotification(event).reason, reason);
  }
});
test('conflicting button ID does not produce a transaction', () => {
  const event = sample(); event.attachments[0].blocks[1].accessory.value = cardId;
  assert.equal(parseNotification(event).reason, 'conflicting_transaction_id');
});
test('edited/deleted messages, malformed payloads and multiple attachments require review', () => {
  for (const event of [null, {}, { ...sample(), subtype: 'message_changed' },
    { ...sample(), subtype: 'message_deleted' }, { ...sample(), attachments: [null] },
    { ...sample(), attachments: [...sample().attachments, ...sample().attachments] }]) {
    assert.equal(parseNotification(event).status, 'review_required');
  }
});
test('Markdown-damaged links are not repaired into trusted transaction IDs', () => {
  const event = sample(); event.attachments[0].blocks[4].elements[2].text = '決済ID: [link](https://example.com)';
  assert.equal(parseNotification(event).status, 'review_required');
});

test('observed thousands grouping is accepted without accepting malformed separators', () => {
  const event = sample(); event.attachments[0].blocks[1].fields[1].text = 'ご利用金額:\n2,090';
  assert.equal(parseNotification(event).value.amount, 2090);
});
