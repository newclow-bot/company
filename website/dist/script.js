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

document.querySelector('#quote-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const subject = `[견적문의] ${form.get('company')} - ${form.get('item')}`;
  const body = [
    '퀼브릿지 견적문의',
    '',
    `회사명: ${form.get('company')}`,
    `담당자명: ${form.get('name')}`,
    `연락처: ${form.get('phone')}`,
    `회신 이메일: ${form.get('email')}`,
    '',
    `문의 품목: ${form.get('item')}`,
    `규격·모델명: ${form.get('spec') || '-'}`,
    `수량: ${form.get('quantity') || '-'}`,
    `희망 납기: ${form.get('due') || '-'}`,
    '',
    '상세 요청사항:',
    form.get('message') || '-',
    '',
    '도면, 사진 또는 품목표가 있으면 이 메일에 첨부해 주세요.'
  ].join('\n');

  window.location.href = `mailto:qbridge3@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
