import { attackBonus, sneakBonus, maxHp } from './state.js';
import { ENEMIES } from './encounter.js';
import { t } from '../i18n/i18n.js';

const COLORS = { pip: '#7a4fa8', bramble: '#b8443c', bess: '#3a7ab8', marla: '#c8962a' };

const SHOPS = {
  pip: [
    { id: 'whetstone', price: 8, owned: (s) => s.gear.whetstone, buy: (s) => { s.gear.whetstone = true; } },
    { id: 'tinPlate', price: 15, owned: (s) => s.gear.tinPlate, buy: (s) => { s.gear.tinPlate = true; s.hp += 1; } },
    { id: 'potion', price: 7, owned: () => false, buy: (s) => { s.potions += 1; } },
    { id: 'oil', price: 9, owned: () => false, buy: (s) => { s.oil += 1; } },
    { id: 'clover', price: 10, owned: () => false, buy: (s) => { s.clovers += 1; } },
  ],
  bess: [
    { id: 'narwhal', price: 22, owned: (s) => s.gear.narwhal, buy: (s) => { s.gear.narwhal = true; } },
    { id: 'coralMail', price: 18, owned: (s) => s.gear.coralMail, buy: (s) => { s.gear.coralMail = true; s.hp += 1; } },
    { id: 'boots', price: 12, owned: (s) => s.gear.boots, buy: (s) => { s.gear.boots = true; } },
    { id: 'tonic', price: 5, consumable: true, owned: (s) => s.hp >= maxHp(s), buy: (s) => { s.hp = maxHp(s); } },
  ],
};

/** Conversations. ctx: { state, dialog, changed, popupHero, sfx } */
export function createTalk(ctx) {
  const { state, dialog } = ctx;
  const speaker = (id) => ({ name: t(`npc.${id}`), color: COLORS[id] });

  // ---------------- Shops ----------------
  function shop(id, line) {
    dialog.show({
      ...speaker(id),
      text: `${line ?? t(`shop.${id}.greeting`)}<div class="dlg-gold">${t('ui.youHave')} <i class="coin"></i>${state.gold}</div>`,
      choices: [
        ...SHOPS[id].map((item) => {
          const owned = item.owned(state);
          const name = t(`item.${item.id}.name`);
          return {
            label: `${name} — ${owned ? t(item.consumable ? 'shop.notNeeded' : 'shop.owned') : `${item.price}g`}`,
            sub: t(`item.${item.id}.desc`),
            disabled: owned || state.gold < item.price,
            onSelect: () => {
              state.gold -= item.price;
              item.buy(state);
              ctx.sfx(item.id === 'tonic' ? 'potion' : 'buy');
              ctx.changed();
              ctx.popupHero(`-${item.price}g`, 'gold');
              shop(id, t('shop.bought', { item: name }));
            },
          };
        }),
        { label: t('shop.rumours'), onSelect: () => shop(id, t(`shop.${id}.gossip`)) },
        { label: t('shop.goodbye'), onSelect: () => dialog.hide() },
      ],
    });
  }

  // ---------------- Quest helpers ----------------
  const say = (id, text, choices) => dialog.show({ ...speaker(id), text, choices });
  const back = (fn) => ({ label: t('common.back'), onSelect: fn });
  const bye = (label = t('common.farewell')) => ({ label, onSelect: () => dialog.hide() });

  function acceptQuest(qid, advance, then) {
    state.quests[qid] = 'active';
    state.tracked = qid;
    state.gold += advance;
    ctx.sfx('quest');
    ctx.changed();
    if (advance) ctx.popupHero(`+${advance}g`, 'gold');
    then();
  }

  function completeQuest(qid, gold, title) {
    state.quests[qid] = 'complete';
    state.gold += gold;
    state.titles.push(title);
    state.tracked = null;
    ctx.sfx('fanfare');
    ctx.changed();
    ctx.popupHero(`+${gold}g`, 'gold');
  }

  // ---------------- Sergeant Bramble ----------------
  const trollTips = () => t('bramble.tips', { bonus: attackBonus(state), dc: ENEMIES.troll.dc, hp: ENEMIES.troll.maxHp });

  function bramble() {
    const q = state.quests.troll;
    if (q === 'ready') {
      return say('bramble', t('bramble.readyText'), [{
        label: t('bramble.claim'), sub: t('bramble.claimSub'),
        onSelect: () => {
          completeQuest('troll', 30, 'bogbane');
          say('bramble', t('bramble.rewardText') + (state.quests.lens === 'none' ? t('bramble.rewardHint') : t('bramble.rewardProud')),
            [bye(t('bramble.thanks'))]);
        },
      }]);
    }
    const bonus = attackBonus(state);
    const greeting = {
      none: t('bramble.greetNone'),
      active: t('bramble.greetActive', { bonus, comment: t(bonus < 3 ? 'bramble.lowBonus' : 'bramble.goodBonus') }),
      complete: t('bramble.greetComplete'),
    }[q];
    const choices = [
      { label: t('bramble.askPlace'), onSelect: () => say('bramble', t('bramble.place'), [back(bramble)]) },
      { label: t('bramble.askBog'), onSelect: () => say('bramble', t('bramble.bog'), [back(bramble)]) },
    ];
    if (q === 'none') choices.push({ label: t('bramble.askWork'), onSelect: offerTroll });
    if (q === 'active') choices.push({ label: t('bramble.askTips'), onSelect: () => say('bramble', trollTips(), [back(bramble)]) });
    choices.push(bye());
    say('bramble', greeting, choices);
  }

  function offerTroll() {
    say('bramble', t('bramble.offer'), [
      { label: t('bramble.accept'), sub: t('bramble.acceptSub'), onSelect: () => acceptQuest('troll', 10, () => say('bramble', trollTips(), [bye(t('bramble.onIt'))])) },
      { label: t('bramble.notYet'), onSelect: bramble },
    ]);
  }

  // ---------------- Old Marla ----------------
  const crabTips = () => t('marla.tips', { sneak: sneakBonus(state), sneakDc: ENEMIES.crab.sneak.dc, dc: ENEMIES.crab.dc, hp: ENEMIES.crab.maxHp });

  function marla() {
    const q = state.quests.lens;
    if (q === 'ready') {
      return say('marla', t('marla.readyText'), [{
        label: t('marla.claim'), sub: t('marla.claimSub'),
        onSelect: () => {
          completeQuest('lens', 35, 'tidefriend');
          say('marla', t('marla.rewardText'), [bye(t('marla.thanks'))]);
        },
      }]);
    }
    const greeting = { none: t('marla.greetNone'), active: t('marla.greetActive'), complete: t('marla.greetComplete') }[q];
    const choices = [{ label: t('marla.askPlace'), onSelect: () => say('marla', t('marla.place'), [back(marla)]) }];
    if (q === 'none') choices.push({ label: t('marla.askStolen'), onSelect: offerLens });
    if (q === 'active') choices.push({ label: t('marla.askTips'), onSelect: () => say('marla', crabTips(), [back(marla)]) });
    choices.push(bye());
    say('marla', greeting, choices);
  }

  function offerLens() {
    say('marla', t('marla.offer'), [
      { label: t('marla.accept'), sub: t('marla.acceptSub'), onSelect: () => acceptQuest('lens', 5, () => say('marla', crabTips(), [bye(t('marla.onIt'))])) },
      { label: t('marla.notYet'), onSelect: marla },
    ]);
  }

  return {
    open(id) {
      ctx.sfx('blip');
      if (id === 'pip' || id === 'bess') shop(id);
      else if (id === 'bramble') bramble();
      else if (id === 'marla') marla();
    },
  };
}
