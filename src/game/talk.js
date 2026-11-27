import { attackBonus, sneakBonus, maxHp } from './state.js';
import { ENEMIES } from './encounter.js';

const SPEAKERS = {
  pip: { name: 'Pip the Peddler', color: '#7a4fa8' },
  bramble: { name: 'Sergeant Bramble', color: '#b8443c' },
  bess: { name: 'Barnacle Bess', color: '#3a7ab8' },
  marla: { name: 'Old Marla', color: '#c8962a' },
};

const SHOPS = {
  pip: {
    greeting: 'Psst! Shiny things for shiny coins! Pip has wares from all four corners of the table.',
    items: [
      { name: 'Whetstone', desc: '+1 to attack rolls', price: 8,
        owned: (s) => s.gear.whetstone, buy: (s) => { s.gear.whetstone = true; } },
      { name: 'Tin Plate Armour', desc: '+1 max heart', price: 15,
        owned: (s) => s.gear.tinPlate, buy: (s) => { s.gear.tinPlate = true; s.hp += 1; } },
      { name: 'Healing Potion', desc: 'Restore 2 hearts (use any time)', price: 6,
        owned: () => false, buy: (s) => { s.potions += 1; } },
      { name: 'Lucky Clover', desc: 'Reroll one failed check', price: 10,
        owned: () => false, buy: (s) => { s.clovers += 1; } },
    ],
    gossip: 'Pip\'s cousin Bess runs a stall in <b>Gullhaven</b>, east along the road. Fancier blades, smellier stall. ' +
      'And the troll in the bog? Slow, but hits hard. A sharp edge and a lucky clover make all the difference!',
  },
  bess: {
    greeting: 'Ahoy, landlubber! Fresh fish, finer steel and boots that don\'t squeak. What\'ll it be?',
    items: [
      { name: 'Narwhal Blade', desc: '+2 to attack rolls', price: 22,
        owned: (s) => s.gear.narwhal, buy: (s) => { s.gear.narwhal = true; } },
      { name: 'Coral Mail', desc: '+1 max heart', price: 18,
        owned: (s) => s.gear.coralMail, buy: (s) => { s.gear.coralMail = true; s.hp += 1; } },
      { name: 'Tidewalker Boots', desc: '+3 to sneak checks', price: 12,
        owned: (s) => s.gear.boots, buy: (s) => { s.gear.boots = true; } },
      { name: 'Kelp Tonic', desc: 'Drink now: restore all hearts', price: 5,
        owned: (s) => s.hp >= maxHp(s), buy: (s) => { s.hp = maxHp(s); } },
    ],
    gossip: 'Captain Pinch? Biggest crab I ever saw, lives in a barrel down at <b>Shellshore Cove</b>, south of here. ' +
      'Loves anything shiny. Good news is he naps most afternoons. Tiptoe in with soft boots and you might never need to swing a sword.',
  },
};

/** Conversations. ctx: { state, dialog, changed, popupHero } */
export function createTalk(ctx) {
  const { state, dialog } = ctx;

  // ---------------- Shops ----------------
  function shop(id, line) {
    const def = SHOPS[id];
    dialog.show({
      ...SPEAKERS[id],
      text: `${line ?? def.greeting}<div class="dlg-gold">You have <i class="coin"></i>${state.gold}</div>`,
      choices: [
        ...def.items.map((item) => {
          const owned = item.owned(state);
          return {
            label: `${item.name} — ${owned ? (item.price < 6 ? 'not needed' : 'owned') : `${item.price}g`}`,
            sub: item.desc,
            disabled: owned || state.gold < item.price,
            onSelect: () => {
              state.gold -= item.price;
              item.buy(state);
              ctx.changed();
              ctx.popupHero(`-${item.price}g`, 'gold');
              shop(id, pick([
                `A fine choice! The ${item.name} suits you.`,
                'Pleasure doing business! No refunds, no take-backsies.',
                `Ooh, the ${item.name}. Good eye.`,
              ]));
            },
          };
        }),
        { label: 'Heard any rumours?', onSelect: () => shop(id, def.gossip) },
        { label: 'Goodbye', onSelect: () => dialog.hide() },
      ],
    });
  }

  // ---------------- Quest givers ----------------
  function say(id, text, choices) {
    dialog.show({ ...SPEAKERS[id], text, choices });
  }
  const back = (fn) => ({ label: 'Interesting... (back)', onSelect: fn });
  const bye = (label = 'Farewell') => ({ label, onSelect: () => dialog.hide() });

  function acceptQuest(qid, advance, then) {
    state.quests[qid] = 'active';
    state.tracked = qid;
    state.gold += advance;
    ctx.changed();
    if (advance) ctx.popupHero(`+${advance}g`, 'gold');
    then();
  }

  function completeQuest(qid, gold, title) {
    state.quests[qid] = 'complete';
    state.gold += gold;
    state.titles.push(title);
    state.tracked = null;
    ctx.changed();
    ctx.popupHero(`+${gold}g`, 'gold');
  }

  // Sergeant Bramble — Thimblecross, troll quest
  const BRAMBLE_LORE = {
    place: 'This is <b>Thimblecross</b>, the first square ever laid on the table. The old tales say the world was set out ' +
      'board by board by the <b>Great Hand</b>, and that our fates are settled by the tumbling of the <b>Twenty-Sided Ones</b>. ' +
      'North lies the Bogmire. East, the road runs to the fishing folk of <b>Gullhaven</b>.',
    bog: 'Long ago a giant cup of tea spilled across the northern board. It soaked in and soured, and the soggy ground became the <b>Bogmire</b>. ' +
      'Things grew there that shouldn\'t: glowing mushrooms, angry frogs, and worst of all <b>Grumblemaw</b>, a troll who was once a mossy boulder until the tea woke it up.',
    tips: () => `Every blow is a gamble. Roll the <b>d20</b> and add your attack bonus (yours is <b>+${attackBonus(state)}</b>). ` +
      `Beat <b>${ENEMIES.troll.dc}</b> to land a hit; miss and it clubs you back. A natural <b>20</b> hits twice as hard, a natural <b>1</b> always misses. ` +
      'Three good hits topples it. Follow the glowing trail; it\'ll lead you right to its lair.',
  };

  function bramble() {
    const q = state.quests.troll;
    if (q === 'ready') {
      return say('bramble', 'By my mustache... you actually <b>did it</b>! The whole square heard Grumblemaw\'s groan. Thimblecross owes you a debt.', [{
        label: 'Claim your reward', sub: '+30 gold and a title',
        onSelect: () => {
          completeQuest('troll', 30, 'Bogbane');
          say('bramble', 'Thirty gold from the town purse, and from today you\'ll be known as <b>Bogbane</b>. ' +
            (state.quests.lens === 'none' ? 'I hear the lighthouse keeper in <b>Gullhaven</b> has troubles of her own...' : 'Wear it proudly, hero.'),
          [bye('Thank you, Sergeant')]);
        },
      }]);
    }
    const greeting = {
      none: 'Halt! Who goes... oh. An adventurer, by the looks of that cape. We could use one of those.',
      active: `Grumblemaw still snores in the bog up north. Your attack bonus is <b>+${attackBonus(state)}</b>. ${attackBonus(state) < 2 ? 'Bit low, if you ask me.' : 'Looking sharp!'}`,
      complete: 'Hail, Bogbane! The road north is quiet now. Nothing left out there but frogs and mushrooms.',
    }[q];
    const choices = [
      { label: 'What is this place?', onSelect: () => say('bramble', BRAMBLE_LORE.place, [back(bramble)]) },
      { label: 'Tell me about the bog.', onSelect: () => say('bramble', BRAMBLE_LORE.bog, [back(bramble)]) },
    ];
    if (q === 'none') choices.push({ label: 'Any work for me?', onSelect: offerTroll });
    if (q === 'active') choices.push({ label: 'How do I beat Grumblemaw?', onSelect: () => say('bramble', BRAMBLE_LORE.tips(), [back(bramble)]) });
    choices.push(bye());
    say('bramble', greeting, choices);
  }

  function offerTroll() {
    say('bramble', 'Work? Aye. <b>Grumblemaw the Bog Troll</b> has been stomping the north road and eating our cheese wagons. ' +
      'Knock it down and the town will pay well. Here\'s ten gold up front for supplies. Spend it at Pip\'s.', [
      { label: 'Accept the quest', sub: '+10 gold · tracked on your map', onSelect: () => acceptQuest('troll', 10, () => say('bramble', BRAMBLE_LORE.tips(), [bye('I\'m on it')])) },
      { label: 'Not yet', onSelect: bramble },
    ]);
  }

  // Old Marla — Gullhaven, lens quest
  const MARLA_LORE = {
    place: '<b>Gullhaven</b>, dearie. Forty boats, four hundred gulls and one lighthouse. Out past the docks is the <b>Great Puddle</b>. ' +
      'Nobody knows how far it goes; the table edge, some say. My light has guided the fishing boats home for sixty years.',
    tips: () => `Two ways to handle a crab, dearie. <b>Sneak</b>: tiptoe up while he naps and pry the lens loose. That's d20 + sneak ` +
      `(yours is <b>+${sneakBonus(state)}</b>) against <b>${ENEMIES.crab.sneak.dc}</b>. Bess sells boots that help. ` +
      `Or <b>fight</b>: his shell is softer than a troll's (DC <b>${ENEMIES.crab.dc}</b>), but he has <b>${ENEMIES.crab.maxHp}</b> hearts and a mean pinch.`,
  };

  function marla() {
    const q = state.quests.lens;
    if (q === 'ready') {
      return say('marla', 'Oh! Oh my, is that... <b>my lens!</b> Not a scratch on it! Help me up the stairs, would you? Let\'s give those boats some light.', [{
        label: 'Return the lens', sub: '+35 gold and a title',
        onSelect: () => {
          completeQuest('lens', 35, 'Tidefriend');
          say('marla', '<i>The lighthouse flickers... and blazes to life, sweeping its beam across the water.</i><br>' +
            'Thirty-five gold from the harbour fund, and the gulls will sing of <b>Tidefriend</b> for years. Mostly off-key.', [bye('Glad to help')]);
        },
      }]);
    }
    const greeting = {
      none: 'Hello, dearie. Mind the gulls, they bite. And they steal. Everything steals around here lately...',
      active: 'Any luck with that crab, dearie? The boats are still feeling their way home in the dark.',
      complete: 'Look at her shine! Not a single boat lost since you brought the lens home, Tidefriend.',
    }[q];
    const choices = [
      { label: 'What is this place?', onSelect: () => say('marla', MARLA_LORE.place, [back(marla)]) },
    ];
    if (q === 'none') choices.push({ label: 'What\'s been stolen?', onSelect: offerLens });
    if (q === 'active') choices.push({ label: 'How should I deal with the crab?', onSelect: () => say('marla', MARLA_LORE.tips(), [back(marla)]) });
    choices.push(bye());
    say('marla', greeting, choices);
  }

  function offerLens() {
    say('marla', 'My lighthouse <b>lens</b>, dearie! A giant hermit crab called <b>Captain Pinch</b> scuttled up the rocks three nights ago and ' +
      'carried it off to <b>Shellshore Cove</b>, south of here. Without it the light\'s just a candle. Would you fetch it back?', [
      { label: 'I\'ll get your lens back', sub: '+5 gold · tracked on your map', onSelect: () => acceptQuest('lens', 5, () => say('marla', MARLA_LORE.tips(), [bye('Leave it to me')])) },
      { label: 'Not right now', onSelect: marla },
    ]);
  }

  return {
    open(id) {
      if (id === 'pip' || id === 'bess') shop(id);
      else if (id === 'bramble') bramble();
      else if (id === 'marla') marla();
    },
  };
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
