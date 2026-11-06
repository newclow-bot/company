const fields = { company: ['회사명', 120], name: ['담당자명', 80], phone: ['연락처', 60], email: ['회신 이메일', 254], item: ['문의 품목', 200], spec: ['규격·모델명', 300], quantity: ['수량', 100], due: ['희망 납기', 100], message: ['상세 요청사항', 5000] };
const attempts = new Map();
const maxFileBytes = 3 * 1024 * 1024;
const maxTotalBytes = 6 * 1024 * 1024;
function validateAttachments(files) {
  if (!Array.isArray(files) || files.length > 3) throw new Error('첨부파일은 최대 3개까지 선택해 주세요.');
  let total = 0;
  return files.map(file => {
    if (!file || typeof file.name !== 'string' || file.name.length > 120 || /[\x00-\x1f\x7f/\\]/.test(file.name)) throw new Error('첨부파일 이름을 확인해 주세요.');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png', 'xlsx', 'csv', 'txt'].includes(ext)) throw new Error('PDF, JPG, PNG, XLSX, CSV, TXT 파일만 첨부할 수 있습니다.');
    const content = file.content;
    if (typeof content !== 'string' || content.length === 0 || content.length > 4 * Math.ceil(maxFileBytes / 3) || (content.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(content))) throw new Error('첨부파일 내용을 확인해 주세요. 파일당 최대 3MB입니다.');
    const bytes = Uint8Array.from(atob(content), c => c.charCodeAt(0));
    total += bytes.length;
    if (!bytes.length || bytes.length > maxFileBytes || total > maxTotalBytes) throw new Error('파일당 3MB, 전체 6MB 이하로 첨부해 주세요.');
    const begins = signature => signature.every((b, i) => bytes[i] === b);
    const valid = ext === 'pdf' ? begins([37,80,68,70,45])
      : ['jpg','jpeg'].includes(ext) ? begins([255,216,255])
      : ext === 'png' ? begins([137,80,78,71,13,10,26,10])
      : ext === 'xlsx' ? begins([80,75,3,4])
      : !bytes.includes(0);
    if (!valid) throw new Error('파일 확장자와 내용이 일치하는지 확인해 주세요.');
    if (['txt','csv'].includes(ext)) { try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('TXT·CSV 파일은 UTF-8 형식으로 저장해 주세요.'); } }
    return { name: file.name, content };
  });
}
const json = (status, message, details = {}) => Response.json({ ok: status === 200, message, ...details }, { status, headers: { 'Cache-Control': 'no-store' } });

// Shared by the Node server and a future Sites Worker adapter.
export async function handleQuote(request, env, { send = fetch, ip = 'unknown', now = Date.now() } = {}) {
  if (request.method !== 'POST') return json(405, 'POST 요청만 지원합니다.');
  if (!env.SITE_ORIGIN || request.headers.get('origin') !== env.SITE_ORIGIN) return json(403, '홈페이지에서 다시 전송해 주세요.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, '지원하지 않는 요청 형식입니다.');
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) return json(503, '메일 전송 준비 중입니다. 010-7757-2096으로 문의해 주세요.');
  let data;
  try { data = await request.json(); } catch { return json(400, '입력 내용을 확인해 주세요.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, '입력 내용을 확인해 주세요.');
  if (data.website) return json(400, '요청을 처리할 수 없습니다.');
  if (data.consent !== true) return json(400, '정보 전달에 동의해 주세요.');
  for (const [key, [label, max]] of Object.entries(fields)) {
    if (typeof data[key] !== 'string' || data[key].length > max) return json(400, `${label} 입력 길이를 확인해 주세요.`);
    data[key] = data[key].trim();
  }
  if (['company', 'name', 'phone', 'email', 'item'].some(key => !data[key])) return json(400, '필수 항목을 입력해 주세요.');
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email) || /[\r\n]/.test(data.company + data.item)) return json(400, '이메일과 문의 품목을 확인해 주세요.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.requestId || '')) return json(400, '페이지를 새로 열어 다시 작성해 주세요.');
  const receipt = `QB-${data.requestId.toLowerCase()}`;
  let attachment;
  try { attachment = validateAttachments(data.attachments ?? []); }
  catch (error) { return json(400, error.message); }
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const attempt = attempts.get(ip) || { count: 0, until: now + 600000 };
  if (attempt.count >= 5 || attempts.size >= 10000) return json(429, '요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  attempt.count++; attempts.set(ip, attempt);
  try {
    const response = await send('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: { name: '퀼브릿지 홈페이지', email: env.MAIL_FROM }, to: [{ email: 'qbridge3@naver.com' }], replyTo: { email: data.email },
        ...(attachment.length ? { attachment } : {}),
        subject: `[견적문의] ${data.company} - ${data.item}`,
        textContent: `접수번호: ${receipt}\n\n` + Object.entries(fields).map(([key, [label]]) => `${label}: ${data[key] || '-'}`).join('\n\n') })
    });
    const result = await response.json();
    if (!response.ok || !result.messageId) return json(502, '전송을 완료하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.');
    return json(200, '메일 발송 서비스에 문의가 접수되었습니다. 확인 후 연락드리겠습니다.', { receipt, attachmentCount: attachment.length });
  } catch { return json(502, '전송 결과를 확인할 수 없습니다. 입력 내용은 유지됩니다. 전화로 접수 여부를 확인하거나 다시 시도해 주세요.'); }
}
