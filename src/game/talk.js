import { BOSS_DC, attackBonus } from './state.js';

const PIP = { name: 'Pip the Peddler', color: '#7a4fa8' };
const BRAMBLE = { name: 'Sergeant Bramble', color: '#b8443c' };

const SHOP = [
  { id: 'whetstone', name: 'Whetstone', desc: '+1 to attack rolls', price: 8,
    owned: (s) => s.whetstone, buy: (s) => { s.whetstone = true; } },
  { id: 'fineSword', name: 'Moonsteel Blade', desc: '+2 to attack rolls', price: 22,
    owned: (s) => s.fineSword, buy: (s) => { s.fineSword = true; } },
  { id: 'armour', name: 'Tin Plate Armour', desc: '+1 max heart', price: 15,
    owned: (s) => s.armour, buy: (s) => { s.armour = true; s.maxHp += 1; s.hp += 1; } },
  { id: 'potion', name: 'Healing Potion', desc: 'Restore 2 hearts', price: 6,
    owned: () => false, buy: (s) => { s.potions += 1; } },
  { id: 'clover', name: 'Lucky Clover', desc: 'Reroll one failed check', price: 10,
    owned: () => false, buy: (s) => { s.clovers += 1; } },
];

/** Conversations with the merchant and the guard. ctx: { state, dialog, changed, popupHero } */
export function createTalk(ctx) {
  const { state, dialog } = ctx;

  // ---------------- Merchant ----------------
  function merchant(line = 'Psst! Shiny things for shiny coins! Pip has wares from all four corners of the table.') {
    dialog.show({
      ...PIP,
      text: `${line}<div class="dlg-gold">You have <i class="coin"></i>${state.gold}</div>`,
      choices: [
        ...SHOP.map((item) => {
          const owned = item.owned(state);
          return {
            label: `${item.name} — ${owned ? 'owned' : `${item.price}g`}`,
            sub: item.desc,
            disabled: owned || state.gold < item.price,
            onSelect: () => {
              state.gold -= item.price;
              item.buy(state);
              ctx.changed();
              ctx.popupHero(`-${item.price}g`, 'gold');
              merchant(pick([
                `A fine choice! The ${item.name} suits you.`,
                'Pleasure doing business! No refunds, no take-backsies.',
                `Ooh, the ${item.name}. Pip was hoping you'd pick that one.`,
              ]));
            },
          };
        }),
        { label: 'What do you know about the bog?', onSelect: () => merchant(
          'The bog? Pip went once. Lost a boot, a cart and nearly a nose. The troll there hits hard, but it\'s <i>slow</i>. A sharp blade and a lucky clover make all the difference. Sharp blades and lucky clovers I happen to sell!') },
        { label: 'Goodbye', onSelect: () => dialog.hide() },
      ],
    });
  }

  // ---------------- Guard ----------------
  const LORE = {
    place:
      'This is <b>Thimblecross</b>, the last square of civilisation before the edge of the map. ' +
      'The old tales say the whole world was laid out tile by tile by the <b>Great Hand</b>, and that our fates ' +
      'are settled by the tumbling of the <b>Twenty-Sided Ones</b>. I just keep the peace and the cobbles swept.',
    history:
      'Long ago a giant cup of tea spilled across the northern tiles. It soaked in and soured, and the soggy ground became the <b>Bog</b>. ' +
      'Things grew there that shouldn\'t: glowing mushrooms, angry frogs, and worst of all <b>Grumblemaw</b>, ' +
      'a troll who was once a mossy boulder until the tea woke it up.',
    boss:
      `Grumblemaw is tough, but every blow is a gamble. Roll the <b>d20</b> and add your attack bonus. ` +
      `Beat <b>${BOSS_DC}</b> and you land a hit; miss and it hits you back. A natural <b>20</b> hits twice as hard, ` +
      `and a natural <b>1</b> always misses. It takes three good hits to topple. Visit Pip first, eh?`,
  };

  function guard() {
    const q = state.quest;
    if (q === 'bossDefeated') {
      dialog.show({
        ...BRAMBLE,
        text: 'By my mustache... you actually <b>did it</b>! The whole square heard Grumblemaw\'s groan. Thimblecross owes you a debt.',
        choices: [{
          label: 'Claim your reward',
          sub: '+30 gold and a title',
          onSelect: () => {
            state.gold += 30;
            state.quest = 'complete';
            state.title = 'Bogbane';
            ctx.changed();
            ctx.popupHero('+30g', 'gold');
            dialog.show({
              ...BRAMBLE,
              text: 'Thirty gold from the town purse, and from today you\'ll be known as <b>Bogbane</b>. Wear it proudly, hero.',
              choices: [{ label: 'Thank you, Sergeant', onSelect: () => dialog.hide() }],
            });
          },
        }],
      });
      return;
    }

    const greeting = {
      none: 'Halt! Who goes... oh. An adventurer, by the looks of that cape. We could use one of those.',
      accepted: `Grumblemaw still snores in the bog up north. Follow the road, you can't miss the stench. Your attack bonus is <b>+${attackBonus(state)}</b>. ${attackBonus(state) < 2 ? 'Bit low, if you ask me.' : 'Looking sharp!'}`,
      complete: 'Hail, Bogbane! The road north is quiet now. Nothing left out there but frogs and mushrooms.',
    }[q];

    const choices = [
      { label: 'What is this place?', onSelect: () => loreThen(LORE.place) },
      { label: 'Tell me about the bog.', onSelect: () => loreThen(LORE.history) },
    ];
    if (q === 'none') {
      choices.push({ label: 'Any work for me?', onSelect: offerQuest });
    } else if (q === 'accepted') {
      choices.push({ label: 'How do I beat Grumblemaw?', onSelect: () => loreThen(LORE.boss) });
    }
    choices.push({ label: 'Farewell', onSelect: () => dialog.hide() });
    dialog.show({ ...BRAMBLE, text: greeting, choices });
  }

  function loreThen(text) {
    dialog.show({ ...BRAMBLE, text, choices: [{ label: 'Interesting... (back)', onSelect: guard }] });
  }

  function offerQuest() {
    dialog.show({
      ...BRAMBLE,
      text: 'Work? Aye. <b>Grumblemaw the Bog Troll</b> has been stomping the north road and eating our cheese wagons. ' +
        'Knock it down and the town will pay well. Here\'s ten gold up front for supplies. Spend it at Pip\'s.',
      choices: [
        { label: 'Accept the quest', sub: '+10 gold', onSelect: () => {
          state.quest = 'accepted';
          state.gold += 10;
          ctx.changed();
          ctx.popupHero('+10g', 'gold');
          loreThen(LORE.boss);
        } },
        { label: 'Not yet', onSelect: guard },
      ],
    });
  }

  return { merchant: () => merchant(), guard };
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
