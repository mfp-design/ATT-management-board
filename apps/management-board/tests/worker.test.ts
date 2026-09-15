import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';
import type { Env } from '../worker/env.ts';
import { validateInput } from '../shared/contracts.ts';

const origin = 'http://127.0.0.1:4177';
function environment(): Env {
  return {
    APP_ENV: 'local', APP_INSTANCE: 'att-management-board-local', SYSTEM_EMAIL: 'info@mfp-design.jp',
    DB: { prepare(sql: string) { assert.equal(sql, 'SELECT 1 AS connected'); return { async first() { return { connected: 1 }; } }; } } as unknown as NonNullable<Env['DB']>,
    ASSETS: { async fetch() { return new Response('<main>local shell</main>', { headers: { 'content-type': 'text/html' } }); } } as unknown as Env['ASSETS'],
  };
}
function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/sample/validate`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
test('status verifies local D1 and explicitly reports unavailable integrations and closing', async () => {
  const response = await worker.fetch(new Request(`${origin}/api/status`), environment());
  const result = await response.json();
  assert.equal(response.status, 200); assert.equal(result.data.database, 'connected');
  assert.equal(result.data.integrations.slack, 'not_configured');
  assert.equal(result.data.integrations.authentication, 'not_implemented');
  assert.equal(result.data.monthlyClose, 'unavailable');
  assert.equal(result.requestId, response.headers.get('x-request-id'));
});
test('missing or failing D1 returns 503 while initial shell remains usable', async () => {
  for (const mode of ['missing', 'failure']) {
    const env = environment(); delete env.DB;
    if (mode === 'failure') env.DB = { prepare() { throw Error('private credentials'); } } as unknown as NonNullable<Env['DB']>;
    const response = await worker.fetch(new Request(`${origin}/api/status`), env);
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private credentials/);
    assert.equal((await worker.fetch(new Request(`${origin}/settings`), env)).status, 200);
  }
});
test('all routes fail closed outside the exact local instance, before assets or D1 access', async () => {
  for (const mutate of [
    (e: Env) => { e.APP_ENV = 'production'; }, (e: Env) => { e.APP_ENV = 'staging'; },
    (e: Env) => { delete e.APP_ENV; }, (e: Env) => { e.APP_INSTANCE = 'att-upsider-poc'; },
    (e: Env) => { e.SYSTEM_EMAIL = 'other@example.test'; },
  ]) {
    for (const path of ['/', '/api/status', '/api/sample/expenses', '/assets/app.js']) {
      const env = environment(); mutate(env);
      env.ASSETS = { fetch() { throw Error('must not call assets'); } } as unknown as Env['ASSETS'];
      const response = await worker.fetch(new Request(`${origin}${path}`), env);
      assert.equal(response.status, 503); assert.equal((await response.json()).error.code, 'AUTHENTICATION_NOT_READY');
    }
  }
  assert.equal((await worker.fetch(new Request('https://example.workers.dev/api/sample/expenses'), environment())).status, 503);
});
test('unknown API including browser navigation never falls through to the SPA', async () => {
  for (const path of ['/api', '/api/missing', '/api/health/other']) {
    const response = await worker.fetch(new Request(`${origin}${path}`, { headers: { 'sec-fetch-mode': 'navigate' } }), environment());
    assert.equal(response.status, 404); assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  }
  assert.equal((await worker.fetch(new Request(`${origin}/api/status`, { method: 'DELETE' }), environment())).status, 405);
});
test('unconfigured integration and closing operations cannot return a false success', async () => {
  for (const path of ['/api/monthly-close', '/api/integrations/slack/sync', '/slack/events', '/slack/interactions']) {
    const response = await worker.fetch(new Request(`${origin}${path}`, { method: 'POST' }), environment());
    assert.equal(response.status, 503); assert.equal((await response.json()).ok, false);
  }
});
test('input validation normalizes text, rejects invalid values, and does not write D1', async () => {
  const env = environment(); env.DB = { prepare() { throw Error('must not write or read D1'); } } as unknown as NonNullable<Env['DB']>;
  const response = await worker.fetch(post({ description: '  <img src=x onerror=alert(1)> 日本語  ' }), env);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { description: '<img src=x onerror=alert(1)> 日本語', persisted: false });
  for (const value of [null, {}, { description: 10 }, { description: '   ' }, { description: 'あ'.repeat(121) }]) {
    const invalid = await worker.fetch(post(value), env);
    assert.equal(invalid.status, 422); assert.ok((await invalid.json()).error.fields.description);
  }
  assert.equal(validateInput({ description: '😀'.repeat(120) }).valid, true);
});
test('POST requires same origin, JSON, valid JSON and bounded bytes even without Content-Length', async () => {
  assert.equal((await worker.fetch(post({ description: 'sample' }, { origin: 'https://other.example' }), environment())).status, 403);
  const missing = post({ description: 'sample' }); missing.headers.delete('origin');
  assert.equal((await worker.fetch(missing, environment())).status, 403);
  assert.equal((await worker.fetch(post({}, { 'content-type': 'text/plain' }), environment())).status, 415);
  const invalid = new Request(`${origin}/api/sample/validate`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{' });
  assert.equal((await worker.fetch(invalid, environment())).status, 400);
  const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(' '.repeat(4097))); controller.close(); } });
  const tooLarge = new Request(`${origin}/api/sample/validate`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body, duplex: 'half' } as RequestInit);
  assert.equal((await worker.fetch(tooLarge, environment())).status, 413);
});
test('HTML, API and error responses have strict headers and do not expose exception details', async () => {
  const env = environment();
  const normal = await worker.fetch(new Request(`${origin}/`), env);
  env.ASSETS = { fetch() { throw Error('secret stack / customer amount'); } } as unknown as Env['ASSETS'];
  const failure = await worker.fetch(new Request(`${origin}/`), env);
  assert.equal(failure.status, 500); assert.doesNotMatch(await failure.clone().text(), /secret stack|customer amount/);
  for (const response of [normal, failure, await worker.fetch(new Request(`${origin}/api/health`), env)]) {
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
    assert.doesNotMatch(response.headers.get('content-security-policy') ?? '', /unsafe-inline|unsafe-eval/);
  }
});
