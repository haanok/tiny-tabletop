import { attackBonus, sneakBonus, maxHp } from './state.js';
import { wait } from '../core/anim.js';
import { t } from '../i18n/i18n.js';

/** Mechanics per enemy. All text lives in i18n under enemy.<id>.* */
export const ENEMIES = {
  troll: {
    color: '#3f6b3a',
    dc: 16,
    maxHp: 4,
    fumbleDmg: 2,
    quest: 'troll',
    reward: 25,
    cry: 'roar',
    respawn: { board: 'thimblecross', cell: [8, 8] },
  },
  crab: {
    color: '#c0452e',
    dc: 15,
    maxHp: 5,
    fumbleDmg: 2,
    quest: 'lens',
    reward: 15,
    cry: 'snap',
    respawn: { board: 'gullhaven', cell: [7, 6] },
    sneak: { dc: 17 },
  },
};

/** Chance a single d20 + bonus check beats dc (natural 20 always hits, natural 1 always misses). */
export const checkChance = (bonus, dc) => Math.min(0.95, Math.max(0.05, (21 - (dc - bonus)) / 20));

/**
 * Exact odds of winning a fight from here, assuming the hero always uses clovers on a miss and
 * drinks a potion whenever the next blow could be fatal.
 */
export function winChance({ bonus, dc, enemyHp, hp, maxHp: mx, potions, clovers, fumbleDmg = 1 }) {
  const p = checkChance(bonus, dc);
  const crit = 0.05;
  const nat1 = 0.05;
  const memo = new Map();
  const f = (e, h, pot, c) => {
    if (e <= 0) return 1;
    if (h <= 0) return 0;
    if (pot > 0 && h <= fumbleDmg && h < mx) return f(e, Math.min(mx, h + 2), pot - 1, c);
    const k = `${e},${h},${pot},${c}`;
    if (memo.has(k)) return memo.get(k);
    const miss = c > 0
      ? (1 - p) * f(e, h, pot, c - 1)
      : nat1 * f(e, h - fumbleDmg, pot, 0) + (1 - p - nat1) * f(e, h - 1, pot, 0);
    const v = crit * f(e - 2, h, pot, c) + (p - crit) * f(e - 1, h, pot, c) + miss;
    memo.set(k, v);
    return v;
  };
  return f(enemyHp, hp, potions, clovers);
}

const VERDICTS = [[0.15, 'doomed', 'bad'], [0.35, 'grim', 'bad'], [0.55, 'risky', 'bad'], [0.75, 'even', ''], [2, 'good', 'good']];

const hearts = (n, max, cls = '') =>
  Array.from({ length: max }, (_, i) => `<span class="heart ${cls} ${i < n ? 'full' : 'empty'}">♥</span>`).join('');

/**
 * Dice-driven encounters.
 * ctx: { state, dialog, hero, dice, changed, popupHero, popupNpc, lock, enemy(id), groundY,
 *        respawn(board, cell), onEnemyDefeated(id), sfx(name), music(name|null) }
 */
export function createEncounters(ctx) {
  const { state, dialog, hero, dice } = ctx;
  const tx = (id, k, p) => t(`enemy.${id}.${k}`, p);
  const header = (id) => ({ name: t(`npc.${id}`), color: ENEMIES[id].color });

  function start(id) {
    const E = ENEMIES[id];
    const es = state.enemies[id];
    const q = state.quests[E.quest];
    if (es.defeated) return info(id, tx(id, 'after'));
    if (es.sneaked || q === 'ready' || q === 'complete') {
      if (E.sneak) ctx.sfx('snore');
      return info(id, E.sneak ? tx(id, 'sleeping') : tx(id, 'after'));
    }

    ctx.lock(true);
    if (E.sneak) ctx.sfx('snore');
    else { ctx.sfx(E.cry); ctx.music('battle'); }
    const choices = [];
    if (E.sneak) {
      choices.push({ label: t('fight.sneakChoice'), sub: `${t('fight.sneakSub', { bonus: sneakBonus(state), dc: E.sneak.dc })} · ${pct(1 - (1 - checkChance(sneakBonus(state), E.sneak.dc)) ** (1 + state.clovers))}%`, onSelect: () => sneak(id) });
    }
    choices.push({
      label: t('fight.fightChoice'), sub: t('fight.fightSub', { bonus: attackBonus(state) + (state.oil > 0 && !state.oiled ? 2 : 0), dc: E.dc }),
      onSelect: () => { wake(id); const oil = applyOil(); round(id, oil ? tx(id, 'idle') + oil : undefined); },
    });
    choices.push({ label: t('fight.backAway'), onSelect: () => flee(id) });
    show(id, tx(id, 'intro') + oddsLine(id), choices);
  }

  const pct = (x) => Math.round(x * 100);

  /** Win odds shown before a fight, with a nudge to gear up when they are poor. */
  function oddsLine(id) {
    const E = ENEMIES[id];
    const chance = winChance({
      bonus: attackBonus(state) + (state.oil > 0 && !state.oiled ? 2 : 0),
      dc: E.dc,
      enemyHp: state.enemies[id].hp,
      hp: state.hp,
      maxHp: maxHp(state),
      potions: state.potions,
      clovers: state.clovers,
      fumbleDmg: E.fumbleDmg,
    });
    const [, verdict, cls] = VERDICTS.find(([lim]) => chance < lim);
    const line = t('fight.odds', { pct: pct(chance), verdict: t(`fight.verdict.${verdict}`), cls });
    return `<div class="fight-odds">${line}${chance < 0.55 ? `<br><span class="muted">${t('fight.gearUp')}</span>` : ''}</div>`;
  }

  /** Apply a flask of Bane Oil at the start of a fight. */
  function applyOil() {
    if (state.oiled || state.oil <= 0) return '';
    state.oil -= 1;
    state.oiled = true;
    ctx.sfx('luck');
    ctx.popupHero('+2 ⚔️', 'luck');
    ctx.changed();
    return `<br><span class="muted">${t('fight.oilApplied')}</span>`;
  }

  /** Fight over (won, lost or fled): the oil wears off. */
  function endFight() {
    state.oiled = false;
  }

  function wake(id) {
    const enemy = ctx.enemy(id);
    if (enemy.setAsleep) {
      enemy.setAsleep(false);
      ctx.sfx(ENEMIES[id].cry);
    }
    ctx.music('battle');
  }

  function info(id, text) {
    dialog.show({ ...header(id), text, choices: [{ label: t('common.leave'), onSelect: () => dialog.hide() }] });
  }

  function status(id) {
    return `<div class="fight-status">
      <div><small>${tx(id, 'short')}</small>${hearts(state.enemies[id].hp, ENEMIES[id].maxHp, 'boss')}</div>
      <div><small>${t('fight.you')}</small>${hearts(state.hp, maxHp(state))}</div>
    </div>`;
  }

  const show = (id, text, choices = []) => dialog.show({ ...header(id), text: text + status(id), choices });

  async function rollCheck(id, bonus, dc, what) {
    show(id, t('fight.rollFor', { what: t(what === 'sneak' ? 'fight.whatSneak' : 'fight.whatAttack'), need: Math.max(2, dc - bonus) }));
    ctx.sfx('diceShake');
    const enemy = ctx.enemy(id);
    const mid = hero.object.position.clone().lerp(enemy.object.getWorldPosition(enemy.object.position.clone()), 0.5);
    return dice.roll(mid, ctx.groundY(mid), (n) =>
      n === 20 ? 'crit' : n === 1 ? 'fumble' : n + bonus >= dc ? 'success' : 'fail');
  }

  const rolledLine = (r, bonus, dc) => t('fight.rolled', { r, bonus, total: r + bonus, dc });

  /** On a failed roll, offer a clover reroll if the hero has one. */
  function cloverOr(id, line, missText, retry, accept) {
    if (state.clovers <= 0) return accept();
    show(id, `${line} <b class="bad">${missText}</b> ${t('fight.clover')}`, [
      { label: t('fight.useClover'), sub: t('fight.useCloverSub', { n: state.clovers }), onSelect: () => {
        state.clovers -= 1;
        ctx.sfx('luck');
        ctx.changed();
        ctx.popupHero(t('ui.reroll'), 'luck');
        retry();
      } },
      { label: t('fight.acceptFate'), onSelect: accept },
    ]);
  }

  // ---------------- Sneak ----------------
  async function sneak(id) {
    const E = ENEMIES[id];
    const bonus = sneakBonus(state);
    const r = await rollCheck(id, bonus, E.sneak.dc, 'sneak');
    const ok = r === 20 || (r !== 1 && r + bonus >= E.sneak.dc);
    const line = rolledLine(r, bonus, E.sneak.dc);
    if (ok) return sneakSuccess(id, line);
    cloverOr(id, line, t(r === 1 ? 'fight.nat1' : 'fight.notQuiet'), () => sneak(id), () => sneakFail(id, line));
  }

  function sneakSuccess(id, line) {
    const E = ENEMIES[id];
    state.enemies[id].sneaked = true;
    state.quests[E.quest] = 'ready';
    ctx.enemy(id).setLens?.(false);
    ctx.sfx('sneak');
    ctx.changed();
    ctx.popupHero(t('ui.lensRecovered'), 'gold');
    ctx.lock(false);
    dialog.show({ name: t('fight.sneaky'), color: '#3e8a6a', text: `${line}<br>${tx(id, 'sneakSuccess')}`, choices: [{ label: t('fight.tiptoe'), onSelect: () => dialog.hide() }] });
  }

  async function sneakFail(id, line) {
    const enemy = ctx.enemy(id);
    wake(id);
    show(id, `${line}<br>${tx(id, 'sneakFail')}`);
    await wait(0.4);
    ctx.sfx('swing');
    await enemy.attack();
    if (await hurtHero()) return defeat(id);
    round(id, t('fight.freePinch', { line }) + applyOil());
  }

  // ---------------- Fight ----------------
  function round(id, msg) {
    const E = ENEMIES[id];
    const bonus = attackBonus(state);
    const choices = [{ label: t('fight.attack'), sub: t('fight.attackSub', { bonus, dc: E.dc }), onSelect: () => attack(id) }];
    if (state.potions > 0 && state.hp < maxHp(state)) {
      choices.push({ label: t('fight.drink'), sub: t('fight.drinkSub', { n: state.potions }), onSelect: () => drink(id) });
    }
    choices.push({ label: t('fight.flee'), sub: t('fight.fleeSub', { name: tx(id, 'short') }), onSelect: () => flee(id) });
    show(id, msg || tx(id, 'idle'), choices);
  }

  async function attack(id) {
    const E = ENEMIES[id];
    const bonus = attackBonus(state);
    const r = await rollCheck(id, bonus, E.dc, 'attack');
    const hit = r === 20 || (r !== 1 && r + bonus >= E.dc);
    const line = rolledLine(r, bonus, E.dc);
    if (hit) return exchange(id, true, r, line);
    cloverOr(id, line, t(r === 1 ? 'fight.nat1' : 'fight.miss'), () => attack(id), () => exchange(id, false, r, line));
  }

  async function exchange(id, hit, r, line) {
    const enemy = ctx.enemy(id);
    const es = state.enemies[id];
    if (hit) {
      const dmg = r === 20 ? 2 : 1;
      show(id, `${line} <b class="good">${t(r === 20 ? 'fight.critHit' : 'fight.hit')}</b>`);
      ctx.sfx('swing');
      await hero.attack();
      ctx.sfx('hit');
      enemy.hit();
      es.hp = Math.max(0, es.hp - dmg);
      ctx.popupNpc(enemy, r === 20 ? '-2 ♥ CRIT!' : '-1 ♥', 'dmg');
      ctx.changed();
      await wait(0.5);
      if (es.hp <= 0) return victory(id);
      round(id, `${line} <b class="good">${r === 20 ? tx(id, 'crit') : tx(id, 'hit')}</b>`);
    } else {
      show(id, `${line} <b class="bad">${t(r === 1 ? 'fight.fumble' : 'fight.missShort')}</b>`);
      ctx.sfx(ENEMIES[id].cry === 'snap' ? 'snap' : 'swing');
      await enemy.attack();
      if (await hurtHero(r === 1 ? ENEMIES[id].fumbleDmg : 1)) return defeat(id);
      round(id, `${line} <b class="bad">${tx(id, 'miss')}</b>`);
    }
  }

  /** Damage the hero; returns true if knocked out. */
  async function hurtHero(dmg = 1) {
    ctx.sfx('hurt');
    hero.hit();
    state.hp = Math.max(0, state.hp - dmg);
    ctx.popupHero(`-${dmg} ♥`, 'dmg');
    ctx.changed();
    await wait(0.5);
    return state.hp <= 0;
  }

  function drink(id) {
    state.potions -= 1;
    state.hp = Math.min(maxHp(state), state.hp + 2);
    ctx.sfx('potion');
    ctx.changed();
    ctx.popupHero('+2 ♥', 'heal');
    round(id, t('fight.drank'));
  }

  function flee(id) {
    endFight();
    state.enemies[id].hp = ENEMIES[id].maxHp;
    ctx.enemy(id).setAsleep?.(true);
    ctx.music(null);
    ctx.changed();
    ctx.lock(false);
    info(id, tx(id, 'flee'));
  }

  async function victory(id) {
    const E = ENEMIES[id];
    show(id, `<b class="good">${tx(id, 'victory')}</b>`);
    ctx.music(null, { silent: true });
    await ctx.enemy(id).defeat();
    ctx.sfx('victory');
    endFight();
    state.enemies[id].defeated = true;
    ctx.onEnemyDefeated(id);
    state.gold += E.reward;
    if (state.quests[E.quest] !== 'complete') state.quests[E.quest] = 'ready';
    ctx.changed();
    ctx.popupHero(`+${E.reward}g`, 'gold');
    ctx.lock(false);
    dialog.show({ name: t('fight.victory'), color: '#c8962a', text: tx(id, 'loot'), choices: [{ label: t('fight.hooray'), onSelect: () => dialog.hide() }] });
    await wait(2.2);
    ctx.music(null);
  }

  async function defeat(id) {
    const E = ENEMIES[id];
    show(id, `<b class="bad">${t('fight.wobbly')}</b>`);
    ctx.music(null, { silent: true });
    ctx.sfx('defeat');
    await wait(1.2);
    endFight();
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
      name: t('fight.knockedOut'),
      color: '#555',
      text: t('fight.wakeUp', { lost: lost ? t('fight.lostGold', { n: lost }) : '' }),
      choices: [{ label: t('fight.ouch'), onSelect: () => dialog.hide() }],
    });
  }

  return { start };
}
