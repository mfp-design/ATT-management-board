// Independent PoC receiver. No production finance writes or public data reads.
const utf8 = new TextEncoder();
const reply = (body, status = 200) => new Response(body, {
  status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
});
async function validSignature(request, raw, secret) {
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');
  if (!/^\d{10}$/.test(timestamp || '') || !/^v0=[0-9a-f]{64}$/.test(signature || '')) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', utf8.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature.slice(3).match(/../g), h => parseInt(h, 16));
  return crypto.subtle.verify('HMAC', key, bytes, utf8.encode(`v0:${timestamp}:${raw}`));
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/') return reply('ATT UPSIDER PoC receiver');
    if (path !== '/slack/events') return reply('Not found', 404);
    if (request.method !== 'POST') return reply('Method not allowed', 405);
    if (!env.SLACK_SIGNING_SECRET || !env.SLACK_TEAM_ID || !env.SLACK_CHANNEL_ID || !env.DB) return reply('Configuration incomplete', 503);
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply('Unsupported content type', 415);
    // Bound memory use even when Content-Length is absent or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) return reply('Missing body', 400);
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 262144) { await reader.cancel(); return reply('Payload too large', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
    let raw;
    try { raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return reply('Invalid encoding', 400); }
    if (!await validSignature(request, raw, env.SLACK_SIGNING_SECRET)) return reply('Unauthorized', 401);
    let payload;
    try { payload = JSON.parse(raw); } catch { return reply('Invalid JSON', 400); }
    if (!payload || typeof payload !== 'object') return reply('Invalid payload', 400);
    try {
      // Slack's URL challenge does not necessarily contain team_id.
      if (payload.type === 'url_verification' && typeof payload.challenge === 'string') {
        await env.DB.prepare('SELECT 1 AS ok').first();
        return reply(payload.challenge);
      }
      if (payload.type !== 'event_callback') return reply('Ignored');
      if (payload.team_id !== env.SLACK_TEAM_ID) return reply('Forbidden', 403);
      const event = payload.event;
      if (!event || event.channel !== env.SLACK_CHANNEL_ID) return reply('Forbidden', 403);
      // Stay closed until the actual UPSIDER app AND bot IDs have been checked.
      // Marketplace IDs and display names alone are not sufficient evidence.
      if (!env.UPSIDER_APP_ID || !env.UPSIDER_BOT_ID) return reply('Source verification pending', 503);
      if (event.type !== 'message' || event.app_id !== env.UPSIDER_APP_ID || event.bot_id !== env.UPSIDER_BOT_ID) return reply('Ignored');
      if (typeof payload.event_id !== 'string' || !payload.event_id || typeof event.ts !== 'string') return reply('Invalid event', 400);
      // Store the original body for authorized, test-only source events; do not parse expense fields yet.
      await env.DB.prepare('INSERT OR IGNORE INTO poc_events (team_id, event_id, channel_id, message_ts, received_at, raw_body) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(payload.team_id, payload.event_id, event.channel, event.ts, new Date().toISOString(), raw).run();
      // Acknowledge only after D1 has committed. Slack can retry a failed write.
      return reply('OK');
    } catch {
      // Never log raw bodies, tokens, or database error strings.
      return reply('Storage unavailable', 503);
    }
  },
};
