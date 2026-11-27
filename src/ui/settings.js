import { t, getLang, setLang, LANGS, onLangChange } from '../i18n/i18n.js';

/** Bottom-left bar: music toggle, sound-effects toggle, language switch. */
export function createSettings(audio) {
  const el = document.createElement('div');
  el.id = 'settings';
  el.innerHTML = `
    <button type="button" class="set-btn" data-act="music"></button>
    <button type="button" class="set-btn" data-act="sfx"></button>
    <div class="set-lang" role="group"></div>
  `;
  document.body.appendChild(el);
  const music = el.querySelector('[data-act="music"]');
  const sfx = el.querySelector('[data-act="sfx"]');
  const langBox = el.querySelector('.set-lang');

  function render() {
    music.textContent = '🎵';
    music.classList.toggle('off', !audio.musicOn);
    music.title = `${t('ui.music')} (M)`;
    music.setAttribute('aria-pressed', String(audio.musicOn));
    sfx.textContent = audio.sfxOn ? '🔊' : '🔇';
    sfx.classList.toggle('off', !audio.sfxOn);
    sfx.title = t('ui.sfx');
    sfx.setAttribute('aria-pressed', String(audio.sfxOn));
    langBox.setAttribute('aria-label', t('ui.language'));
    langBox.innerHTML = LANGS.map((l) =>
      `<button type="button" data-lang="${l.id}" class="${l.id === getLang() ? 'on' : ''}" title="${l.name}" aria-pressed="${l.id === getLang()}">${l.label}</button>`).join('');
  }

  const toggleMusic = () => { audio.unlock(); audio.setMusic(!audio.musicOn); audio.sfx('toggle'); render(); };
  music.addEventListener('click', toggleMusic);
  sfx.addEventListener('click', () => { audio.unlock(); audio.setSfx(!audio.sfxOn); audio.sfx('toggle'); render(); });
  langBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) { audio.sfx('toggle'); setLang(b.dataset.lang); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) toggleMusic();
  });
  onLangChange(render);
  render();
}
