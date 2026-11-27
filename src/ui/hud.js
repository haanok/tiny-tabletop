import { attackBonus, QUEST_TEXT } from '../game/state.js';

export function createHUD({ onDrink }) {
  const el = document.createElement('div');
  el.id = 'hud';
  el.innerHTML = `
    <div class="hud-name"></div>
    <div class="hud-hearts"></div>
    <div class="hud-stats"></div>
    <button class="hud-drink" type="button">Drink potion</button>
    <div class="hud-quest"></div>
  `;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  $('.hud-drink').addEventListener('click', onDrink);

  return {
    render(s) {
      $('.hud-name').textContent = s.title ? `Hero ${s.title}` : 'Hero';
      $('.hud-hearts').innerHTML = Array.from({ length: s.maxHp }, (_, i) =>
        `<span class="heart ${i < s.hp ? 'full' : 'empty'}">♥</span>`).join('');
      const bonus = attackBonus(s);
      $('.hud-stats').innerHTML = `
        <span title="Gold"><i class="coin"></i>${s.gold}</span>
        <span title="Attack bonus">⚔️ +${bonus}</span>
        <span title="Healing potions">🧪 ${s.potions}</span>
        <span title="Lucky clovers">🍀 ${s.clovers}</span>`;
      $('.hud-drink').hidden = !(s.potions > 0 && s.hp < s.maxHp);
      $('.hud-quest').innerHTML = `<b>Quest</b> ${QUEST_TEXT[s.quest]}`;
    },
  };
}
