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
let requestId;
quoteForm?.addEventListener('input', () => { requestId = undefined; });
quoteForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = quoteForm.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const status = document.querySelector('#quote-status');
  const data = Object.fromEntries(new FormData(quoteForm));
  data.consent = quoteForm.elements.consent.checked;
  requestId ||= crypto.randomUUID();
  data.requestId = requestId;
  button.disabled = true;
  const controls = [...quoteForm.querySelectorAll('input, textarea')];
  controls.forEach(control => { control.disabled = true; });
  quoteForm.setAttribute('aria-busy', 'true');
  button.textContent = '전송 중…';
  status.textContent = '견적문의를 전송하고 있습니다.';
  status.dataset.state = 'pending';
  try {
    const response = await fetch('https://qualbridge-quote-api.newclow.workers.dev/api/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(20000)
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('서버 연결을 확인할 수 없습니다. 입력 내용은 유지됩니다. 전화 010-7757-2096으로 문의해 주세요.'); }
    if (!response.ok || result.ok !== true) throw new Error(result.message || '전송을 완료하지 못했습니다. 전화로 문의해 주세요.');
    status.textContent = '견적문의 전송 요청이 정상 처리되었습니다. 담당자가 내용을 확인한 뒤 연락드리겠습니다. 참고 자료는 회사명과 품목명을 적어 qbridge3@naver.com으로 보내주세요.';
    status.dataset.state = 'success';
    quoteForm.reset();
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
