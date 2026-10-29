import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuote } from './quote.mjs';

const origin = 'https://qualbridge.quietegret16.chatgpt.site';
const env = { SITE_ORIGIN: origin, BREVO_API_KEY: 'test-only-not-a-key', MAIL_FROM: 'qbridge3@naver.com' };
const valid = { company: '테스트 회사', name: '담당자', phone: '000-0000-0000', email: 'test@example.com', item: '밸브', spec: '', quantity: '1', due: '', message: '수신 테스트', consent: true, requestId: '12345678-1234-1234-1234-123456789abc' };
function request(data = valid, headers = {}) {
  return new Request(`${origin}/api/quote`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
test('sends only to fixed company inbox, replies to customer, keeps key server-side', async () => {
  let payload;
  const response = await handleQuote(request({ ...valid, to: 'other@example.com' }), env, { ip: 'success', send: async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(options.headers['api-key'], env.BREVO_API_KEY);
    payload = JSON.parse(options.body);
    return Response.json({ messageId: 'test-message' }, { status: 201 });
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(payload.to, [{ email: 'qbridge3@naver.com' }]);
  assert.deepEqual(payload.replyTo, { email: valid.email });
  assert(payload.textContent.includes('밸브'));
  assert(!(await response.text()).includes(env.BREVO_API_KEY));
});
test('rejects wrong origin, missing consent, invalid email and excessive input before sending', async () => {
  const send = async () => { throw new Error('must not send'); };
  assert.equal((await handleQuote(request(valid, { origin: 'https://other.example' }), env, { send })).status, 403);
  for (const data of [{ ...valid, consent: false }, { ...valid, email: 'bad' }, { ...valid, message: 'x'.repeat(5001) }, { ...valid, website: 'spam' }]) {
    assert.equal((await handleQuote(request(data), env, { send })).status, 400);
  }
});
test('missing mail configuration never reports success', async () => {
  assert.equal((await handleQuote(request(), { SITE_ORIGIN: origin })).status, 503);
});
test('provider rejection, malformed response and network failure never report success', async () => {
  for (const send of [async () => Response.json({ error: 'private details' }, { status: 401 }), async () => new Response('not json'), async () => { throw new Error('network'); }]) {
    const response = await handleQuote(request(), env, { ip: 'failures', send });
    assert.equal(response.status, 502);
    assert(!(await response.text()).includes('private details'));
  }
});
test('limits repeated submissions from the same direct IP', async () => {
  const options = { ip: 'rate-test', send: async () => Response.json({ messageId: 'ok' }) };
  for (let n = 0; n < 5; n++) assert.equal((await handleQuote(request(), env, options)).status, 200);
  assert.equal((await handleQuote(request(), env, options)).status, 429);
});
