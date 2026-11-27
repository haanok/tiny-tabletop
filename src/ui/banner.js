/** Big "Entering <place>" title card shown when switching boards. */
export function createBanner() {
  const el = document.createElement('div');
  el.id = 'banner';
  el.innerHTML = '<div class="bn-small">Entering</div><div class="bn-title"></div><div class="bn-sub"></div>';
  document.body.appendChild(el);
  let timer;
  return {
    show(title, sub, small = 'Entering') {
      el.querySelector('.bn-small').textContent = small;
      el.querySelector('.bn-title').textContent = title;
      el.querySelector('.bn-sub').textContent = sub;
      el.classList.remove('show');
      void el.offsetWidth; // restart animation
      el.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove('show'), 2800);
    },
  };
}
