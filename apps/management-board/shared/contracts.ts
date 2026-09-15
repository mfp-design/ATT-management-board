export type FieldErrors = Record<string, string>;
export type ApiResult<T> = { ok: true; data: T; requestId: string } | {
  ok: false; error: { code: string; message: string; fields?: FieldErrors }; requestId: string;
};
export interface ConnectionStatus {
  environment: 'local';
  database: 'connected';
  integrations: { slack: 'not_configured'; email: 'not_configured'; authentication: 'not_implemented' };
  monthlyClose: 'unavailable';
}
export interface SampleExpense { id: string; date: string; description: string; business: string; amountYen: number }
export interface InputValues { description: string }

export function validateInput(value: unknown): { valid: true; value: InputValues } | { valid: false; fields: FieldErrors } {
  if (!value || typeof value !== 'object' || !('description' in value) || typeof value.description !== 'string') {
    return { valid: false, fields: { description: '内容を入力してください。' } };
  }
  const description = value.description.trim();
  if (description.length === 0) return { valid: false, fields: { description: '内容を入力してください。' } };
  if ([...description].length > 120) return { valid: false, fields: { description: '内容は120文字以内で入力してください。' } };
  return { valid: true, value: { description } };
}
