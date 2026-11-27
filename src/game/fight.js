import { BOSS_DC, BOSS_MAX_HP, attackBonus } from './state.js';
import { wait } from '../core/anim.js';

const TROLL = { name: 'Grumblemaw, the Bog Troll', color: '#3f6b3a' };

const hearts = (n, max, cls = '') =>
  Array.from({ length: max }, (_, i) => `<span class="heart ${cls} ${i < n ? 'full' : 'empty'}">♥</span>`).join('');

/**
 * Turn-based boss fight. Each round: roll d20 + attack bonus vs DC.
 * Hit → boss loses a heart (2 on a natural 20). Miss → you lose a heart.
 * ctx: { state, dialog, hero, boss, dice, changed, popupHero, popupBoss, lock, respawn, groundY }
 */
export function createFight(ctx) {
  const { state, dialog, hero, boss, dice } = ctx;

  function status() {
    return `<div class="fight-status">
      <div><small>Grumblemaw</small>${hearts(state.bossHp, BOSS_MAX_HP, 'boss')}</div>
      <div><small>You</small>${hearts(state.hp, state.maxHp)}</div>
    </div>`;
  }

  function start() {
    if (state.quest === 'bossDefeated' || state.quest === 'complete') {
      dialog.show({ ...TROLL, name: 'The Bog', text: 'Only bubbles and the croak of frogs remain where Grumblemaw once stood.', choices: [{ label: 'Leave', onSelect: () => dialog.hide() }] });
      return;
    }
    ctx.lock(true);
    dialog.show({
      ...TROLL,
      text: '<i>The mossy boulder shudders, opens two glowing eyes and lets out a rumbling yawn.</i><br>' +
        '"<b>GRRRUMBLE.</b> Tiny thing come to Grumblemaw\'s bog? Tiny thing look <b>crunchy</b>."' + status(),
      choices: [
        { label: 'Fight!', sub: `d20 + ${attackBonus(state)} vs DC ${BOSS_DC}`, onSelect: () => round() },
        { label: 'Back away slowly', onSelect: flee },
      ],
    });
  }

  function round(msg = '') {
    const bonus = attackBonus(state);
    const choices = [
      { label: 'Attack', sub: `Roll d20 + ${bonus} vs DC ${BOSS_DC}`, onSelect: attack },
    ];
    if (state.potions > 0 && state.hp < state.maxHp) {
      choices.push({ label: 'Drink a potion', sub: `+2 hearts (${state.potions} left)`, onSelect: drink });
    }
    choices.push({ label: 'Flee', sub: 'Grumblemaw recovers if you leave', onSelect: flee });
    dialog.show({ ...TROLL, text: (msg || 'Grumblemaw raises its spiked club. Your move!') + status(), choices });
  }

  function busy(text) {
    dialog.show({ ...TROLL, text: text + status(), choices: [] });
  }

  async function attack() {
    const bonus = attackBonus(state);
    busy(`You roll the d20... <span class="muted">(need ${BOSS_DC - bonus}+ on the die)</span>`);
    const mid = hero.object.position.clone().lerp(boss.object.position, 0.5);
    const r = await dice.roll(mid, ctx.groundY(mid), (n) =>
      n === 20 ? 'crit' : n === 1 ? 'fumble' : n + bonus >= BOSS_DC ? 'success' : 'fail');
    resolve(r, bonus);
  }

  function resolve(r, bonus) {
    const total = r + bonus;
    const hit = r === 20 || (r !== 1 && total >= BOSS_DC);
    const line = `You rolled <b>${r}</b> + ${bonus} = <b>${total}</b> vs DC ${BOSS_DC}.`;

    if (!hit && state.clovers > 0) {
      dialog.show({
        ...TROLL,
        text: `${line} <b class="bad">${r === 1 ? 'A natural 1!' : 'A miss!'}</b> Your lucky clover twitches in your pocket...` + status(),
        choices: [
          { label: 'Use a Lucky Clover', sub: `Reroll (${state.clovers} left)`, onSelect: () => {
            state.clovers -= 1;
            ctx.changed();
            ctx.popupHero('🍀 Reroll!', 'luck');
            attack();
          } },
          { label: 'Accept fate', onSelect: () => exchange(false, r, line) },
        ],
      });
      return;
    }
    exchange(hit, r, line);
  }

  async function exchange(hit, r, line) {
    if (hit) {
      const dmg = r === 20 ? 2 : 1;
      busy(`${line} <b class="good">${r === 20 ? 'CRITICAL HIT!' : 'Hit!'}</b>`);
      await hero.attack();
      boss.hit();
      state.bossHp = Math.max(0, state.bossHp - dmg);
      ctx.popupBoss(r === 20 ? '-2 ♥ CRIT!' : '-1 ♥', 'dmg');
      ctx.changed();
      await wait(0.5);
      if (state.bossHp <= 0) return victory();
      round(`${line} <b class="good">${r === 20 ? 'A critical blow! Grumblemaw staggers!' : 'Your blade finds a gap in the moss!'}</b>`);
    } else {
      busy(`${line} <b class="bad">${r === 1 ? 'Natural 1. You trip over a frog!' : 'Miss!'}</b>`);
      await boss.attack();
      hero.hit();
      state.hp = Math.max(0, state.hp - 1);
      ctx.popupHero('-1 ♥', 'dmg');
      ctx.changed();
      await wait(0.5);
      if (state.hp <= 0) return defeat();
      round(`${line} <b class="bad">Grumblemaw's club bonks you!</b>`);
    }
  }

  function drink() {
    state.potions -= 1;
    state.hp = Math.min(state.maxHp, state.hp + 2);
    ctx.changed();
    ctx.popupHero('+2 ♥', 'heal');
    round('You gulp down the potion. It tastes like strawberries and courage. Grumblemaw waits, confused.');
  }

  function flee() {
    state.bossHp = BOSS_MAX_HP;
    ctx.changed();
    ctx.lock(false);
    dialog.show({ ...TROLL, text: '"Hrrm. Tiny thing runs. Grumblemaw nap again." <i>The troll settles back into the mud.</i>', choices: [{ label: 'Leave', onSelect: () => dialog.hide() }] });
  }

  async function victory() {
    busy('<b class="good">Grumblemaw wobbles... totters... and topples into the bog with an enormous SPLORCH!</b>');
    await boss.defeat();
    ctx.onBossDefeated();
    state.gold += 25;
    state.quest = 'bossDefeated';
    ctx.changed();
    ctx.popupHero('+25g', 'gold');
    ctx.lock(false);
    dialog.show({
      ...TROLL,
      name: 'Victory!',
      color: '#c8962a',
      text: 'The bog falls silent. Among the mud you find <b>25 gold</b> and half a cheese wagon. Sergeant Bramble will want to hear about this!',
      choices: [{ label: 'Hooray!', onSelect: () => dialog.hide() }],
    });
  }

  async function defeat() {
    busy('<b class="bad">Everything goes wobbly and green...</b>');
    await wait(0.8);
    const lost = Math.floor(state.gold / 2);
    state.gold -= lost;
    state.hp = state.maxHp;
    state.bossHp = BOSS_MAX_HP;
    ctx.respawn();
    ctx.changed();
    ctx.lock(false);
    dialog.show({
      name: 'Knocked out!',
      color: '#555',
      text: `You wake up in the town square with a bump on your head${lost ? ` and <b>${lost} gold</b> missing from your purse` : ''}. Maybe visit Pip before trying again?`,
      choices: [{ label: 'Ouch', onSelect: () => dialog.hide() }],
    });
  }

  return { start };
}
