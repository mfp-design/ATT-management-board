import type { ApiResult, FieldErrors } from '../shared/contracts.ts';

export class RequestFailure extends Error {
  readonly requestId: string | undefined;
  readonly fields: FieldErrors | undefined;
  constructor(message: string, requestId?: string, fields?: FieldErrors) {
    super(message); this.requestId = requestId; this.fields = fields;
  }
}

export async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(10000);
    response = await fetch(path, { ...options, credentials: 'same-origin', headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new RequestFailure('接続できませんでした。しばらく待ってから再度お試しください。');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new RequestFailure('応答を読み取れませんでした。画面を開き直してください。');
  let result: ApiResult<T>;
  try { result = await response.json() as ApiResult<T>; }
  catch { throw new RequestFailure('応答を読み取れませんでした。'); }
  if (!result || typeof result.ok !== 'boolean' || typeof result.requestId !== 'string') throw new RequestFailure('応答の形式が正しくありません。');
  if (!result.ok) throw new RequestFailure(result.error.message, result.requestId, result.error.fields);
  if (!response.ok) throw new RequestFailure('処理に失敗しました。', result.requestId);
  return result.data;
}
