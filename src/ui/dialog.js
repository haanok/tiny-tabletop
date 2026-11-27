/**
 * Bottom-of-screen dialogue box with a speaker, text and choice buttons.
 * show({ name, color, text, choices: [{ label, sub, disabled, onSelect }] })
 * Number keys 1-9 pick choices.
 */
export function createDialog() {
  const el = document.createElement('div');
  el.id = 'dialog';
  el.hidden = true;
  el.innerHTML = `
    <div class="dlg-name"></div>
    <div class="dlg-text"></div>
    <div class="dlg-choices"></div>
  `;
  document.body.appendChild(el);
  const nameEl = el.querySelector('.dlg-name');
  const textEl = el.querySelector('.dlg-text');
  const choicesEl = el.querySelector('.dlg-choices');
  let current = [];

  function show({ name, color = '#7a4fa8', text, choices = [] }) {
    el.hidden = false;
    nameEl.textContent = name;
    nameEl.style.background = color;
    textEl.innerHTML = text;
    choicesEl.innerHTML = '';
    current = choices;
    choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.disabled = !!c.disabled;
      b.innerHTML = `<span class="dlg-key">${i + 1}</span>${c.label}${c.sub ? `<small>${c.sub}</small>` : ''}`;
      b.addEventListener('click', () => !c.disabled && c.onSelect());
      choicesEl.appendChild(b);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    const n = Number(e.key);
    if (n >= 1 && n <= current.length && !current[n - 1].disabled) {
      e.preventDefault();
      current[n - 1].onSelect();
    }
  });

  return {
    show,
    hide() { el.hidden = true; current = []; },
    get isOpen() { return !el.hidden; },
  };
}
