import { validateInput } from '../shared/contracts.ts';
import type { ConnectionStatus } from '../shared/contracts.ts';
import { isLocalEnvironment } from './env.ts';
import type { Env } from './env.ts';
import { ApiFailure, failure, json, readJson, secure } from './http.ts';
import { sampleExpenses } from './fixtures.ts';

async function route(request: Request, env: Env, requestId: string): Promise<Response> {
  const url = new URL(request.url);
  if (!isLocalEnvironment(env, url)) throw new ApiFailure(503, 'AUTHENTICATION_NOT_READY', '認証・権限設定が完了するまで利用できません。');
  const path = url.pathname;
  if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok', environment: 'local' }, requestId);
  if (path === '/api/status' && request.method === 'GET') {
    if (!env.DB) throw new ApiFailure(503, 'DATABASE_UNAVAILABLE', 'ローカルのデータベースが設定されていません。');
    try {
      const row = await env.DB.prepare('SELECT 1 AS connected').first<{ connected: number }>();
      if (row?.connected !== 1) throw new Error('Invalid database response');
    } catch { throw new ApiFailure(503, 'DATABASE_UNAVAILABLE', 'ローカルのデータベースに接続できません。'); }
    return json<ConnectionStatus>({ environment: 'local', database: 'connected', integrations: { slack: 'not_configured', email: 'not_configured', authentication: 'not_implemented' }, monthlyClose: 'unavailable' }, requestId);
  }
  if (path === '/api/sample/expenses' && request.method === 'GET') return json({ items: sampleExpenses, synthetic: true }, requestId);
  if (path === '/api/sample/validate' && request.method === 'POST') {
    const result = validateInput(await readJson(request));
    if (!result.valid) throw new ApiFailure(422, 'VALIDATION_FAILED', '入力内容を確認してください。', result.fields);
    return json({ ...result.value, persisted: false }, requestId);
  }
  if (path === '/api/monthly-close' || path.startsWith('/api/monthly-close/')) throw new ApiFailure(503, 'MONTHLY_CLOSE_NOT_READY', '月次締めは準備中です。認証・データ保存・経費照合の実装後に利用できます。');
  if (path.startsWith('/api/integrations/') || path === '/slack/events' || path === '/slack/interactions') throw new ApiFailure(503, 'INTEGRATION_NOT_CONFIGURED', 'この環境の外部連携は設定されていません。');
  if (['/api/health', '/api/status', '/api/sample/expenses', '/api/sample/validate'].includes(path)) throw new ApiFailure(405, 'METHOD_NOT_ALLOWED', 'この操作方法には対応していません。');
  if (path === '/api' || path.startsWith('/api/')) throw new ApiFailure(404, 'NOT_FOUND', '指定されたAPIはありません。');
  if (!['GET', 'HEAD'].includes(request.method)) throw new ApiFailure(405, 'METHOD_NOT_ALLOWED', 'この操作方法には対応していません。');
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    let response: Response;
    try { response = await route(request, env, requestId); }
    catch (error) { response = failure(error, requestId); }
    return secure(response, requestId, import.meta.env?.DEV === true);
  },
};
