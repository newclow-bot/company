const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

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

document.querySelector('#year').textContent = String(new Date().getFullYear());

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
  quoteForm.setAttribute('aria-busy', 'true');
  button.textContent = '전송 중…';
  status.textContent = '견적문의를 전송하고 있습니다.';
  try {
    const response = await fetch('https://qualbridge-quote-api.newclow.workers.dev/api/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(20000)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.message || '전송을 완료하지 못했습니다. 전화로 문의해 주세요.');
    status.textContent = result.message;
    quoteForm.reset();
    requestId = undefined;
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' || error.name === 'SyntaxError' || error.name === 'TypeError'
      ? '전송 결과를 확인할 수 없습니다. 입력 내용은 유지됩니다. 전화 010-7757-2096으로 문의해 주세요.' : error.message;
  } finally {
    button.disabled = false;
    button.textContent = '견적문의 전송';
    quoteForm.removeAttribute('aria-busy');
  }
});
