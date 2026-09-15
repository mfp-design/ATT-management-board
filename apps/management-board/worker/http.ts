import type { ApiResult, FieldErrors } from '../shared/contracts.ts';

export class ApiFailure extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors | undefined;
  constructor(status: number, code: string, message: string, fields?: FieldErrors) {
    super(message); this.status = status; this.code = code; this.fields = fields;
  }
}

export function json<T>(data: T, requestId: string): Response {
  return Response.json({ ok: true, data, requestId } satisfies ApiResult<T>);
}

export function failure(error: unknown, requestId: string): Response {
  const known = error instanceof ApiFailure ? error : new ApiFailure(500, 'INTERNAL_ERROR', '処理に失敗しました。もう一度お試しください。');
  return Response.json({ ok: false, requestId, error: {
    code: known.code, message: known.message, ...(known.fields ? { fields: known.fields } : {}),
  } } satisfies ApiResult<never>, { status: known.status });
}

export async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new ApiFailure(403, 'ORIGIN_REJECTED', '送信元を確認できません。画面を開き直してください。');
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new ApiFailure(415, 'JSON_REQUIRED', 'JSON形式で送信してください。');
  const limit = 4096;
  const reader = request.body?.getReader();
  if (!reader) throw new ApiFailure(400, 'INVALID_JSON', '入力内容を読み取れません。');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ApiFailure(413, 'BODY_TOO_LARGE', '入力内容が大きすぎます。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)) as unknown; }
  catch { throw new ApiFailure(400, 'INVALID_JSON', '入力内容を読み取れません。'); }
}

export function secure(response: Response, requestId: string, development = false): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', requestId);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Vite injects the React refresh preamble and styles only during development.
  headers.set('Content-Security-Policy', `default-src 'none'; script-src 'self'${development ? " 'unsafe-inline'" : ''}; style-src 'self'${development ? " 'unsafe-inline'" : ''}; connect-src 'self'${development ? ' ws://127.0.0.1:4177 ws://localhost:4177' : ''}; img-src 'self' data:; font-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
