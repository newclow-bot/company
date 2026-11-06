const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const closeMenu = () => {
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const quoteForm = document.querySelector('#quote-form');
// Only known categories can prefill the editable item field; never render URL text as HTML.
const inquiryCategories = { valves: '밸브·피팅', mro: '기업 소모성 자재', wires: '각종 전선' };
if (quoteForm) {
  const category = new URLSearchParams(window.location.search).get('category');
  const item = quoteForm.elements.namedItem('item');
  if (Object.hasOwn(inquiryCategories, category) && !item.value) item.value = inquiryCategories[category];
}
let requestId;
const fileInput = quoteForm?.elements.namedItem('attachments');
const attachmentNote = document.querySelector('#attachment-selection');
function selectedFiles() {
  const files = [...(fileInput?.files || [])];
  if (files.length > 3) throw new Error('파일은 최대 3개까지 첨부할 수 있습니다.');
  if (files.some(file => !/\.(pdf|jpe?g|png|xlsx|csv|txt)$/i.test(file.name))) throw new Error('PDF, JPG, PNG, XLSX, CSV, TXT 파일만 선택해 주세요.');
  if (files.some(file => !file.size || file.size > 3 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 6 * 1024 * 1024) throw new Error('빈 파일은 첨부할 수 없습니다. 파일당 3MB, 전체 6MB 이하로 선택해 주세요.');
  return files;
}
fileInput?.addEventListener('change', () => {
  fileInput.setCustomValidity('');
  try { const files = selectedFiles(); attachmentNote.textContent = files.length ? files.map(file => `${file.name} (${Math.max(1, Math.ceil(file.size / 1024))}KB)`).join('\n') : '선택한 파일이 없습니다.'; }
  catch (error) { fileInput.setCustomValidity(error.message); attachmentNote.textContent = error.message; }
});
document.querySelector('#clear-attachments')?.addEventListener('click', () => {
  fileInput.value = ''; fileInput.setCustomValidity(''); attachmentNote.textContent = '선택한 파일이 없습니다.'; requestId = undefined;
});
const encodeFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, content: String(reader.result).split(',')[1] });
  reader.onerror = () => reject(new Error('파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.'));
  reader.readAsDataURL(file);
});
quoteForm?.addEventListener('input', () => { requestId = undefined; });
quoteForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = quoteForm.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const status = document.querySelector('#quote-status');
  const data = Object.fromEntries(new FormData(quoteForm));
  delete data.attachments;
  data.consent = quoteForm.elements.consent.checked;
  requestId ||= crypto.randomUUID();
  data.requestId = requestId;
  button.disabled = true;
  const controls = [...quoteForm.querySelectorAll('input, textarea, button[type=button]')];
  controls.forEach(control => { control.disabled = true; });
  quoteForm.setAttribute('aria-busy', 'true');
  button.textContent = '전송 중…';
  status.textContent = '견적문의를 전송하고 있습니다.';
  status.dataset.state = 'pending';
  try {
    const files = selectedFiles();
    if (files.length) {
      const readiness = await fetch('https://qualbridge-quote-api.newclow.workers.dev/', { signal: AbortSignal.timeout(10000) });
      if (!readiness.ok || (await readiness.json()).supportsAttachments !== true) throw new Error('파일 첨부 연결을 준비 중입니다. 입력 내용은 유지됩니다. 자료는 qbridge3@naver.com으로 보내주세요.');
      data.attachments = await Promise.all(files.map(encodeFile));
    }
    const response = await fetch('https://qualbridge-quote-api.newclow.workers.dev/api/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(60000)
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('서버 연결을 확인할 수 없습니다. 입력 내용은 유지됩니다. 전화 010-7757-2096으로 문의해 주세요.'); }
    if (!response.ok || result.ok !== true) throw new Error(result.message || '전송을 완료하지 못했습니다. 전화로 문의해 주세요.');
    const receipt = typeof result.receipt === 'string' && /^QB-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.receipt) ? result.receipt : '';
    status.textContent = '견적문의 전송 요청이 정상 처리되었습니다.'
      + (receipt ? `\n접수번호: ${receipt}` : '')
      + `\n문의 품목: ${data.item}\n첨부파일: ${files.length}개\n담당자가 내용을 확인한 뒤 입력하신 연락처로 회신드립니다.`;
    status.dataset.state = 'success';
    quoteForm.reset();
    attachmentNote.textContent = '선택한 파일이 없습니다.';
    requestId = undefined;
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.name === 'TimeoutError' || error.name === 'SyntaxError' || error.name === 'TypeError'
      ? '전송 결과를 확인할 수 없습니다. 입력 내용은 유지됩니다. 전화 010-7757-2096으로 문의해 주세요.' : error.message;
  } finally {
    controls.forEach(control => { control.disabled = false; });
    button.disabled = false;
    button.textContent = '견적문의 전송';
    quoteForm.removeAttribute('aria-busy');
    status.focus();
  }
});
