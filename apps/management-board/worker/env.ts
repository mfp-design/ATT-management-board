import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  APP_ENV?: string;
  APP_INSTANCE?: string;
  SYSTEM_EMAIL?: string;
  DB?: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// This is a local-development boundary, not authentication. Remove only when
// #17/#18 provide verified Access identity plus application authorization.
export function isLocalEnvironment(env: Env, url: URL): boolean {
  return env.APP_ENV === 'local' && env.APP_INSTANCE === 'att-management-board-local'
    && env.SYSTEM_EMAIL === 'info@mfp-design.jp'
    && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
}
