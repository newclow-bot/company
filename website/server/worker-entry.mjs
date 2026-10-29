import { handleQuote } from './quote.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') {
      return Response.json({ service: 'QUALBRIDGE quote API', configured: Boolean(env.BREVO_API_KEY && env.MAIL_FROM && env.SITE_ORIGIN) });
    }
    const allowed = Boolean(env.SITE_ORIGIN && request.headers.get('origin') === env.SITE_ORIGIN);
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (allowed) {
      headers['Access-Control-Allow-Origin'] = env.SITE_ORIGIN;
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
    if (url.pathname !== '/api/quote') return new Response('Not found', { status: 404, headers });
    if (!allowed) return new Response('Forbidden', { status: 403, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
    // Bound the streamed request too; Content-Length is not trusted.
    let size = 0; const parts = [];
    const reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 20000) { await reader.cancel(); return new Response('Request too large', { status: 413, headers }); }
        parts.push(value);
      }
    }
    const bounded = new Request(request.url, { method: 'POST', headers: request.headers, body: new Blob(parts) });
    const result = await handleQuote(bounded, env, { ip: request.headers.get('CF-Connecting-IP') || 'unknown' });
    for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
    return result;
  }
};
