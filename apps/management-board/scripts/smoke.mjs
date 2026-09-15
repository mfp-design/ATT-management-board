import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://127.0.0.1:4178';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname)) throw Error('Smoke tests are local-only');
for (const path of ['/', '/input-check', '/settings']) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200); assert.match(await response.text(), /<div id="root"><\/div>/);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.doesNotMatch(response.headers.get('content-security-policy'), /unsafe-inline|unsafe-eval/);
}
const status = await (await fetch(`${origin}/api/status`)).json();
assert.equal(status.data.database, 'connected'); assert.equal(status.data.monthlyClose, 'unavailable');
assert.equal(status.data.integrations.slack, 'not_configured');
const sample = await (await fetch(`${origin}/api/sample/expenses`)).json();
assert.equal(sample.data.synthetic, true); assert.equal(sample.data.items.length, 3);
const input = await fetch(`${origin}/api/sample/validate`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ description: '  架空の入力  ' }) });
assert.deepEqual((await input.json()).data, { description: '架空の入力', persisted: false });
const invalid = await fetch(`${origin}/api/sample/validate`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ description: '' }) });
assert.equal(invalid.status, 422);
for (const [path, code] of [['/api/missing', 404], ['/api/integrations/slack/sync', 503], ['/api/monthly-close', 503]]) {
  assert.equal((await fetch(`${origin}${path}`, { headers: { 'sec-fetch-mode': 'navigate' } })).status, code);
}
console.log('Built Worker + local D1 smoke checks passed (pages, API, validation, unavailable operations, headers).');
