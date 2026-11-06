import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuote } from './quote.mjs';

const origin = 'https://qualbridge.newclow.chatgpt.site';
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
  const result = await response.json();
  assert.equal(result.receipt, `QB-${valid.requestId}`);
  assert.deepEqual(payload.to, [{ email: 'qbridge3@naver.com' }]);
  assert.deepEqual(payload.replyTo, { email: valid.email });
  assert(payload.textContent.includes('밸브'));
  assert(payload.textContent.includes(`접수번호: ${result.receipt}`));
  assert(!JSON.stringify(result).includes(env.BREVO_API_KEY));
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

test('passes attachment bytes and names to mail provider without changing fixed recipient', async () => {
  const attachment = { name: '품목표.txt', content: Buffer.from('밸브 10개').toString('base64') };
  let payload;
  const response = await handleQuote(request({ ...valid, attachments: [attachment] }), env, { ip: 'attachment-success', send: async (url, options) => {
    payload = JSON.parse(options.body);
    return Response.json({ messageId: 'attachment-test' });
  } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).attachmentCount, 1);
  assert.deepEqual(payload.attachment, [attachment]);
  assert.deepEqual(payload.to, [{ email: 'qbridge3@naver.com' }]);
});

test('rejects invalid attachment count, names, encoding, signature and per-file size before sending', async () => {
  const txt = { name: 'test.txt', content: Buffer.from('test').toString('base64') };
  const cases = [ {}, Array(4).fill(txt), [{ ...txt, name: '../test.txt' }], [{ ...txt, name: 'test.exe' }], [{ ...txt, name: 'fake.png' }], [{ ...txt, content: '!!!!' }], [{ ...txt, content: '' }], [{ ...txt, content: Buffer.alloc(3 * 1024 * 1024 + 1, 65).toString('base64') }] ];
  for (const attachments of cases) {
    const response = await handleQuote(request({ ...valid, attachments }), env, { send: async () => { throw new Error('must not send'); } });
    assert.equal(response.status, 400);
  }
});

test('enforces combined decoded attachment limit', async () => {
  const content = Buffer.alloc(3 * 1024 * 1024, 65).toString('base64');
  const response = await handleQuote(request({ ...valid, attachments: [1,2,3].map(n => ({ name: `${n}.txt`, content })) }), env, { send: async () => { throw new Error('must not send'); } });
  assert.equal(response.status, 400);
});
