import { attackBonus, sneakBonus, maxHp } from '../game/state.js';
import { QUESTS } from '../game/quests.js';

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
    <button class="hud-drink" type="button">Drink potion</button>
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
      const title = s.titles.length ? `Hero <span class="hud-title">${s.titles[s.titles.length - 1]}</span>` : 'Hero';
      $('.hud-name').innerHTML = title;
      $('.hud-place').textContent = `📍 ${boardName}`;
      const mx = maxHp(s);
      $('.hud-hearts').innerHTML = Array.from({ length: mx }, (_, i) =>
        `<span class="heart ${i < s.hp ? 'full' : 'empty'}">♥</span>`).join('');
      $('.hud-stats').innerHTML = `
        <span title="Gold"><i class="coin"></i>${s.gold}</span>
        <span title="Attack bonus">⚔️ +${attackBonus(s)}</span>
        <span title="Sneak bonus">🥾 +${sneakBonus(s)}</span>
        <span title="Healing potions">🧪 ${s.potions}</span>
        <span title="Lucky clovers">🍀 ${s.clovers}</span>`;
      $('.hud-drink').hidden = !(s.potions > 0 && s.hp < mx);

      const known = Object.entries(QUESTS).filter(([id]) => s.quests[id] !== 'none');
      $('.hud-quests').innerHTML = known.length
        ? `<div class="hud-qhead">Quests</div>` + known.map(([id, q]) => {
          const stage = s.quests[id];
          const done = stage === 'complete';
          const tracked = s.tracked === id;
          return `<button type="button" class="hud-quest ${tracked ? 'tracked' : ''} ${done ? 'done' : ''}" data-quest="${id}" ${done ? 'disabled' : ''}>
            <span class="hud-qtitle">${done ? '✓' : tracked ? '◉' : '○'} ${q.title}</span>
            <span class="hud-qstep">${q.steps[stage]}</span>
            ${tracked && guidance ? `<span class="hud-qguide">➜ ${guidance}</span>` : ''}
          </button>`;
        }).join('')
        : `<div class="hud-qhead">Quests</div><div class="hud-qempty">Look for a <b>!</b> above someone's head.</div>`;
    },
  };
}
