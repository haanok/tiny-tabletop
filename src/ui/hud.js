import { attackBonus, sneakBonus, maxHp } from '../game/state.js';
import { QUESTS } from '../game/quests.js';
import { t } from '../i18n/i18n.js';

/**
 * Top-left status card + quest tracker.
 * render(state, { boardName, guidance })
 */
export function createHUD({ onDrink, onTrack }) {
  const el = document.createElement('div');
  el.id = 'hud';
  el.innerHTML = `
    <div class="hud-top">
      <div class="hud-name"></div>
      <div class="hud-place"></div>
    </div>
    <div class="hud-hearts"></div>
    <div class="hud-stats"></div>
    <button class="hud-drink" type="button"></button>
    <div class="hud-quests"></div>
  `;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  $('.hud-drink').addEventListener('click', onDrink);
  $('.hud-quests').addEventListener('click', (e) => {
    const row = e.target.closest('[data-quest]');
    if (row) onTrack(row.dataset.quest);
  });

  return {
    render(s, { boardName, guidance }) {
      const title = s.titles.length ? `${t('ui.hero')} <span class="hud-title">${t(`title.${s.titles[s.titles.length - 1]}`)}</span>` : t('ui.hero');
      $('.hud-drink').textContent = t('ui.drink');
      $('.hud-name').innerHTML = title;
      $('.hud-place').textContent = `📍 ${boardName}`;
      const mx = maxHp(s);
      $('.hud-hearts').innerHTML = Array.from({ length: mx }, (_, i) =>
        `<span class="heart ${i < s.hp ? 'full' : 'empty'}">♥</span>`).join('');
      $('.hud-stats').innerHTML = `
        <span title="${t('ui.gold')}"><i class="coin"></i>${s.gold}</span>
        <span title="${t('ui.attack')}">⚔️ +${attackBonus(s)}</span>
        <span title="${t('ui.sneak')}">🥾 +${sneakBonus(s)}</span>
        <span title="${t('ui.potions')}">🧪 ${s.potions}</span>
        <span title="${t('ui.clovers')}">🍀 ${s.clovers}</span>`;
      $('.hud-drink').hidden = !(s.potions > 0 && s.hp < mx);

      const known = Object.keys(QUESTS).map((id) => [id]).filter(([id]) => s.quests[id] !== 'none');
      $('.hud-quests').innerHTML = known.length
        ? `<div class="hud-qhead">${t('ui.quests')}</div>` + known.map(([id]) => {
          const stage = s.quests[id];
          const done = stage === 'complete';
          const tracked = s.tracked === id;
          return `<button type="button" class="hud-quest ${tracked ? 'tracked' : ''} ${done ? 'done' : ''}" data-quest="${id}" ${done ? 'disabled' : ''}>
            <span class="hud-qtitle">${done ? '✓' : tracked ? '◉' : '○'} ${t(`quest.${id}.title`)}</span>
            <span class="hud-qstep">${t(`quest.${id}.${stage}`)}</span>
            ${tracked && guidance ? `<span class="hud-qguide">➜ ${guidance}</span>` : ''}
          </button>`;
        }).join('')
        : `<div class="hud-qhead">${t('ui.quests')}</div><div class="hud-qempty">${t('ui.noQuests')}</div>`;
    },
  };
}
