import { attackBonus, sneakBonus, maxHp } from './state.js';
import { wait } from '../core/anim.js';

export const ENEMIES = {
  troll: {
    name: 'Grumblemaw, the Bog Troll',
    short: 'Grumblemaw',
    color: '#3f6b3a',
    dc: 14,
    maxHp: 3,
    quest: 'troll',
    reward: 25,
    respawn: { board: 'thimblecross', cell: [8, 8] },
    intro: '<i>The mossy boulder shudders, opens two glowing eyes and lets out a rumbling yawn.</i><br>' +
      '"<b>GRRRUMBLE.</b> Tiny thing come to Grumblemaw\'s bog? Tiny thing look <b>crunchy</b>."',
    idle: 'Grumblemaw raises its spiked club. Your move!',
    hit: ['Your blade finds a gap in the moss!', 'A solid thwack right on the kneecap!'],
    crit: 'A critical blow! Grumblemaw staggers!',
    miss: "Grumblemaw's club bonks you!",
    flee: '"Hrrm. Tiny thing runs. Grumblemaw nap again." <i>The troll settles back into the mud.</i>',
    victory: 'Grumblemaw wobbles... totters... and topples into the bog with an enormous SPLORCH!',
    loot: 'The bog falls silent. Among the mud you find <b>25 gold</b> and half a cheese wagon. Sergeant Bramble will want to hear about this!',
    after: 'Only bubbles and the croak of frogs remain where Grumblemaw once stood.',
  },
  crab: {
    name: 'Captain Pinch',
    short: 'Captain Pinch',
    color: '#c0452e',
    dc: 13,
    maxHp: 4,
    quest: 'lens',
    reward: 15,
    respawn: { board: 'gullhaven', cell: [7, 6] },
    intro: '<i>A barrel the size of a rowboat sits in the sand, snoring. Two eye stalks droop over the rim. ' +
      'Wedged on top, the lighthouse lens glitters.</i>',
    idle: 'Captain Pinch clacks his claws. "Yarr. Nobody touches me treasure!"',
    hit: ['Clonk! Right on the shell!', 'You whack a claw. He drops into the sand with a yelp!'],
    crit: 'A perfect strike between the shell plates!',
    miss: 'SNIP! Captain Pinch pinches your toes!',
    flee: '"Arr, and stay out!" <i>The crab burrows back into his barrel.</i>',
    victory: 'Captain Pinch flips onto his back, legs wiggling, and the lens rolls free into the sand!',
    loot: 'You grab the <b>lighthouse lens</b> and <b>15 gold</b> worth of shiny buttons from the barrel. Old Marla will be thrilled!',
    after: 'The cove is quiet. Just waves, gulls and an empty barrel.',
    sneak: {
      dc: 15,
      success: 'You tiptoe across the sand... ease the lens loose... and slip away. Captain Pinch smacks his lips and snores on. <b>You have the lens!</b>',
      fail: '<i>Crunch.</i> You step on a shell. Two eye stalks snap upright. "<b>THIEF!</b>"',
      sleeping: 'Captain Pinch is still snoring happily, dreaming of buttons. Best not wake him.',
    },
  },
};

const hearts = (n, max, cls = '') =>
  Array.from({ length: max }, (_, i) => `<span class="heart ${cls} ${i < n ? 'full' : 'empty'}">♥</span>`).join('');

const pick = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * Dice-driven encounters.
 * ctx: { state, dialog, hero, dice, changed, popupHero, popupNpc, lock, enemy(id), groundY, respawn(board, cell), onEnemyDefeated(id) }
 */
export function createEncounters(ctx) {
  const { state, dialog, hero, dice } = ctx;

  function start(id) {
    const E = ENEMIES[id];
    const es = state.enemies[id];
    const q = state.quests[E.quest];
    if (es.defeated) return info(E, E.after);
    if (es.sneaked || q === 'ready' || q === 'complete') return info(E, E.sneak?.sleeping ?? E.after);

    const enemy = ctx.enemy(id);
    ctx.lock(true);
    const choices = [];
    if (E.sneak) {
      choices.push({ label: 'Sneak up and take the lens', sub: `d20 + ${sneakBonus(state)} sneak vs DC ${E.sneak.dc}`, onSelect: () => sneak(id) });
    }
    choices.push({ label: 'Fight!', sub: `d20 + ${attackBonus(state)} vs DC ${E.dc}`, onSelect: () => { enemy.setAsleep?.(false); round(id); } });
    choices.push({ label: 'Back away slowly', onSelect: () => flee(id) });
    show(E, E.intro, choices, id);
  }

  function info(E, text) {
    dialog.show({ name: E.name, color: E.color, text, choices: [{ label: 'Leave', onSelect: () => dialog.hide() }] });
  }

  function status(id) {
    const E = ENEMIES[id];
    return `<div class="fight-status">
      <div><small>${E.short}</small>${hearts(state.enemies[id].hp, E.maxHp, 'boss')}</div>
      <div><small>You</small>${hearts(state.hp, maxHp(state))}</div>
    </div>`;
  }

  function show(E, text, choices, id) {
    dialog.show({ name: E.name, color: E.color, text: text + status(id), choices });
  }

  async function rollCheck(id, bonus, dc, label) {
    show(ENEMIES[id], `You roll for ${label}... <span class="muted">(need ${Math.max(2, dc - bonus)}+ on the die)</span>`, [], id);
    const enemy = ctx.enemy(id);
    const mid = hero.object.position.clone().lerp(enemy.object.position, 0.5);
    return dice.roll(mid, ctx.groundY(mid), (n) =>
      n === 20 ? 'crit' : n === 1 ? 'fumble' : n + bonus >= dc ? 'success' : 'fail');
  }

  /** Offer a clover reroll on failure. Calls next(r, rerolled). */
  function cloverOr(id, line, missText, retry, accept) {
    if (state.clovers <= 0) return accept();
    show(ENEMIES[id], `${line} <b class="bad">${missText}</b> Your lucky clover twitches in your pocket...`, [
      { label: 'Use a Lucky Clover', sub: `Reroll (${state.clovers} left)`, onSelect: () => {
        state.clovers -= 1;
        ctx.changed();
        ctx.popupHero('🍀 Reroll!', 'luck');
        retry();
      } },
      { label: 'Accept fate', onSelect: accept },
    ], id);
  }

  // ---------------- Sneak ----------------
  async function sneak(id) {
    const E = ENEMIES[id];
    const bonus = sneakBonus(state);
    const r = await rollCheck(id, bonus, E.sneak.dc, 'sneak');
    const total = r + bonus;
    const ok = r === 20 || (r !== 1 && total >= E.sneak.dc);
    const line = `You rolled <b>${r}</b> + ${bonus} = <b>${total}</b> vs DC ${E.sneak.dc}.`;
    if (ok) return sneakSuccess(id, line);
    cloverOr(id, line, r === 1 ? 'A natural 1!' : 'Not quiet enough!', () => sneak(id), () => sneakFail(id, line));
  }

  function sneakSuccess(id, line) {
    const E = ENEMIES[id];
    state.enemies[id].sneaked = true;
    state.quests[E.quest] = 'ready';
    ctx.enemy(id).setLens?.(false);
    ctx.changed();
    ctx.popupHero('Lens recovered!', 'gold');
    ctx.lock(false);
    dialog.show({ name: 'Sneaky!', color: '#3e8a6a', text: `${line}<br>${E.sneak.success}`, choices: [{ label: 'Tiptoe away', onSelect: () => dialog.hide() }] });
  }

  async function sneakFail(id, line) {
    const E = ENEMIES[id];
    const enemy = ctx.enemy(id);
    enemy.setAsleep?.(false);
    show(E, `${line}<br>${E.sneak.fail}`, [], id);
    await wait(0.4);
    await enemy.attack();
    if (await hurtHero(id)) return;
    round(id, `${line} He got a free pinch in, but now it\'s a fair fight!`);
  }

  // ---------------- Fight ----------------
  function round(id, msg) {
    const E = ENEMIES[id];
    const bonus = attackBonus(state);
    const choices = [{ label: 'Attack', sub: `Roll d20 + ${bonus} vs DC ${E.dc}`, onSelect: () => attack(id) }];
    if (state.potions > 0 && state.hp < maxHp(state)) {
      choices.push({ label: 'Drink a potion', sub: `+2 hearts (${state.potions} left)`, onSelect: () => drink(id) });
    }
    choices.push({ label: 'Flee', sub: `${E.short} recovers if you leave`, onSelect: () => flee(id) });
    show(E, msg || E.idle, choices, id);
  }

  async function attack(id) {
    const E = ENEMIES[id];
    const bonus = attackBonus(state);
    const r = await rollCheck(id, bonus, E.dc, 'attack');
    const total = r + bonus;
    const hit = r === 20 || (r !== 1 && total >= E.dc);
    const line = `You rolled <b>${r}</b> + ${bonus} = <b>${total}</b> vs DC ${E.dc}.`;
    if (hit) return exchange(id, true, r, line);
    cloverOr(id, line, r === 1 ? 'A natural 1!' : 'A miss!', () => attack(id), () => exchange(id, false, r, line));
  }

  async function exchange(id, hit, r, line) {
    const E = ENEMIES[id];
    const enemy = ctx.enemy(id);
    const es = state.enemies[id];
    if (hit) {
      const dmg = r === 20 ? 2 : 1;
      show(E, `${line} <b class="good">${r === 20 ? 'CRITICAL HIT!' : 'Hit!'}</b>`, [], id);
      await hero.attack();
      enemy.hit();
      es.hp = Math.max(0, es.hp - dmg);
      ctx.popupNpc(enemy, r === 20 ? '-2 ♥ CRIT!' : '-1 ♥', 'dmg');
      ctx.changed();
      await wait(0.5);
      if (es.hp <= 0) return victory(id);
      round(id, `${line} <b class="good">${r === 20 ? E.crit : pick(E.hit)}</b>`);
    } else {
      show(E, `${line} <b class="bad">${r === 1 ? 'Natural 1. You trip over your own cape!' : 'Miss!'}</b>`, [], id);
      await enemy.attack();
      if (await hurtHero(id)) return;
      round(id, `${line} <b class="bad">${E.miss}</b>`);
    }
  }

  /** Apply one point of damage to the hero; returns true if knocked out. */
  async function hurtHero(id) {
    hero.hit();
    state.hp = Math.max(0, state.hp - 1);
    ctx.popupHero('-1 ♥', 'dmg');
    ctx.changed();
    await wait(0.5);
    if (state.hp <= 0) {
      await defeat(id);
      return true;
    }
    return false;
  }

  function drink(id) {
    state.potions -= 1;
    state.hp = Math.min(maxHp(state), state.hp + 2);
    ctx.changed();
    ctx.popupHero('+2 ♥', 'heal');
    round(id, 'You gulp down the potion. It tastes like strawberries and courage.');
  }

  function flee(id) {
    const E = ENEMIES[id];
    state.enemies[id].hp = E.maxHp;
    ctx.enemy(id).setAsleep?.(true);
    ctx.changed();
    ctx.lock(false);
    info(E, E.flee);
  }

  async function victory(id) {
    const E = ENEMIES[id];
    show(E, `<b class="good">${E.victory}</b>`, [], id);
    await ctx.enemy(id).defeat();
    state.enemies[id].defeated = true;
    ctx.onEnemyDefeated(id);
    state.gold += E.reward;
    if (state.quests[E.quest] !== 'complete') state.quests[E.quest] = 'ready';
    ctx.changed();
    ctx.popupHero(`+${E.reward}g`, 'gold');
    ctx.lock(false);
    dialog.show({ name: 'Victory!', color: '#c8962a', text: E.loot, choices: [{ label: 'Hooray!', onSelect: () => dialog.hide() }] });
  }

  async function defeat(id) {
    const E = ENEMIES[id];
    show(E, '<b class="bad">Everything goes wobbly and dark...</b>', [], id);
    await wait(0.8);
    const lost = Math.floor(state.gold / 2);
    state.gold -= lost;
    state.hp = maxHp(state);
    state.enemies[id].hp = E.maxHp;
    ctx.enemy(id).setAsleep?.(true);
    ctx.changed();
    dialog.hide();
    await ctx.respawn(E.respawn.board, { gx: E.respawn.cell[0], gz: E.respawn.cell[1] });
    ctx.lock(false);
    dialog.show({
      name: 'Knocked out!',
      color: '#555',
      text: `You wake up with a bump on your head${lost ? ` and <b>${lost} gold</b> missing from your purse` : ''}. Maybe visit a shop before trying again?`,
      choices: [{ label: 'Ouch', onSelect: () => dialog.hide() }],
    });
  }

  return { start };
}
