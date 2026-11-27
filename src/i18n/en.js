export default {
  ui: {
    hint: 'Click or WASD to move · click characters to talk · drag to orbit · scroll to zoom',
    hero: 'Hero',
    drink: 'Drink potion',
    quests: 'Quests',
    noQuests: 'Look for a <b>!</b> above someone\'s head.',
    entering: 'Entering',
    gold: 'Gold',
    attack: 'Attack bonus',
    sneak: 'Sneak bonus',
    potions: 'Healing potions',
    clovers: 'Lucky clovers',
    oil: 'Bane oil (+2 attack for one fight)',
    music: 'Music',
    sfx: 'Sound effects',
    language: 'Language',
    youHave: 'You have',
    welcomeTitle: 'Welcome, adventurer',
    welcomeText: 'Click a tile or use <b>WASD</b> to hop around, and click a character to talk. ' +
      'Glowing arrows at the board\'s edge lead to <b>new boards</b>.<br>' +
      'Look for a <b>!</b> to find quests. Once you accept one, a <b>golden trail</b> guides you.',
    welcomeGo: 'Let\'s go!',
    find: 'Find {name} here',
    route: 'Take the {side} road to {next}',
    routeOn: ', then on to {final}',
    sides: { north: 'north', south: 'south', east: 'east', west: 'west' },
    lensRecovered: 'Lens recovered!',
    reroll: '🍀 Reroll!',
  },

  board: {
    thimblecross: { name: 'Thimblecross', subtitle: 'A sleepy village at the heart of the table' },
    bogmire: { name: 'The Bogmire', subtitle: 'Where the spilled tea went sour' },
    gullhaven: { name: 'Gullhaven', subtitle: 'A breezy harbour where the gulls never stop talking' },
    shellshore: { name: 'Shellshore Cove', subtitle: 'Tide pools, shipwrecks and something that pinches' },
  },

  npc: {
    pip: 'Pip the Peddler',
    bramble: 'Sergeant Bramble',
    bess: 'Barnacle Bess',
    marla: 'Old Marla',
    troll: 'Grumblemaw, the Bog Troll',
    crab: 'Captain Pinch',
  },

  title: { bogbane: 'Bogbane', tidefriend: 'Tidefriend' },

  quest: {
    troll: {
      title: 'The Bog Troll',
      active: 'Defeat Grumblemaw in the Bogmire.',
      ready: 'Return to Sergeant Bramble in Thimblecross.',
      complete: 'Grumblemaw is beaten. Thimblecross is safe!',
    },
    lens: {
      title: 'The Stolen Lens',
      active: 'Recover the lighthouse lens from Captain Pinch at Shellshore Cove.',
      ready: 'Bring the lens back to Old Marla in Gullhaven.',
      complete: 'The Gullhaven light shines again!',
    },
  },

  item: {
    whetstone: { name: 'Whetstone', desc: '+1 to attack rolls' },
    tinPlate: { name: 'Tin Plate Armour', desc: '+1 max heart' },
    potion: { name: 'Healing Potion', desc: 'Restore 2 hearts (use any time)' },
    oil: { name: 'Bane Oil', desc: '+2 to attack rolls for your next fight' },
    clover: { name: 'Lucky Clover', desc: 'Reroll one failed check' },
    narwhal: { name: 'Narwhal Blade', desc: '+2 to attack rolls' },
    coralMail: { name: 'Coral Mail', desc: '+1 max heart' },
    boots: { name: 'Tidewalker Boots', desc: '+3 to sneak checks' },
    tonic: { name: 'Kelp Tonic', desc: 'Drink now: restore all hearts' },
  },

  shop: {
    owned: 'owned',
    notNeeded: 'not needed',
    rumours: 'Heard any rumours?',
    goodbye: 'Goodbye',
    bought: [
      'A fine choice! The {item} suits you.',
      'Pleasure doing business! No refunds, no take-backsies.',
      'Ooh, the {item}. Good eye.',
    ],
    pip: {
      greeting: 'Psst! Shiny things for shiny coins! Pip has wares from all four corners of the table.',
      gossip: 'Pip\'s cousin Bess runs a stall in <b>Gullhaven</b>, east along the road. Fancier blades, smellier stall. ' +
        'And the troll in the bog? Slow, but hits hard. Nobody beats it with a butter knife. Sharpen your blade, buy armour, and bring potions and Bane Oil!',
    },
    bess: {
      greeting: 'Ahoy, landlubber! Fresh fish, finer steel and boots that don\'t squeak. What\'ll it be?',
      gossip: 'Captain Pinch? Biggest crab I ever saw, lives in a barrel down at <b>Shellshore Cove</b>, south of here. ' +
        'Loves anything shiny. Good news is he naps most afternoons. Tiptoe in with soft boots and you might never need to swing a sword.',
    },
  },

  common: {
    back: 'Interesting... (back)',
    farewell: 'Farewell',
    leave: 'Leave',
  },

  bramble: {
    place: 'This is <b>Thimblecross</b>, the first square ever laid on the table. The old tales say the world was set out ' +
      'board by board by the <b>Great Hand</b>, and that our fates are settled by the tumbling of the <b>Twenty-Sided Ones</b>. ' +
      'North lies the Bogmire. East, the road runs to the fishing folk of <b>Gullhaven</b>.',
    bog: 'Long ago a giant cup of tea spilled across the northern board. It soaked in and soured, and the soggy ground became the <b>Bogmire</b>. ' +
      'Things grew there that shouldn\'t: glowing mushrooms, angry frogs, and worst of all <b>Grumblemaw</b>, a troll who was once a mossy boulder until the tea woke it up.',
    tips: 'Every blow is a gamble. Roll the <b>d20</b> and add your attack bonus (yours is <b>+{bonus}</b>). ' +
      'Beat <b>{dc}</b> to land a hit; miss and it clubs you back. A natural <b>20</b> hits twice as hard, a natural <b>1</b> always misses. ' +
      'It takes <b>{hp}</b> good hits to topple it, and a natural 1 means a crushing blow. Don\'t go in with bare steel and three hearts. Follow the glowing trail; it\'ll lead you right to its lair.',
    readyText: 'By my mustache... you actually <b>did it</b>! The whole square heard Grumblemaw\'s groan. Thimblecross owes you a debt.',
    claim: 'Claim your reward',
    claimSub: '+30 gold and a title',
    rewardText: 'Thirty gold from the town purse, and from today you\'ll be known as <b>Bogbane</b>. ',
    rewardHint: 'I hear the lighthouse keeper in <b>Gullhaven</b> has troubles of her own...',
    rewardProud: 'Wear it proudly, hero.',
    thanks: 'Thank you, Sergeant',
    greetNone: 'Halt! Who goes... oh. An adventurer, by the looks of that cape. We could use one of those.',
    greetActive: 'Grumblemaw still snores in the bog up north. Your attack bonus is <b>+{bonus}</b>. {comment}',
    lowBonus: 'That won\'t dent troll hide. Go see Pip, or Bess in Gullhaven, before you try.',
    goodBonus: 'Now that\'s a blade that bites. Stock up on potions and go.',
    greetComplete: 'Hail, Bogbane! The road north is quiet now. Nothing left out there but frogs and mushrooms.',
    askPlace: 'What is this place?',
    askBog: 'Tell me about the bog.',
    askWork: 'Any work for me?',
    askTips: 'How do I beat Grumblemaw?',
    offer: 'Work? Aye. <b>Grumblemaw the Bog Troll</b> has been stomping the north road and eating our cheese wagons. ' +
      'Knock it down and the town will pay well. Here\'s ten gold up front for supplies. Spend it at Pip\'s.',
    accept: 'Accept the quest',
    acceptSub: '+10 gold · tracked on your map',
    notYet: 'Not yet',
    onIt: 'I\'m on it',
  },

  marla: {
    place: '<b>Gullhaven</b>, dearie. Forty boats, four hundred gulls and one lighthouse. Out past the docks is the <b>Great Puddle</b>. ' +
      'Nobody knows how far it goes; the table edge, some say. My light has guided the fishing boats home for sixty years.',
    tips: 'Two ways to handle a crab, dearie. <b>Sneak</b>: tiptoe up while he naps and pry the lens loose. That\'s d20 + sneak ' +
      '(yours is <b>+{sneak}</b>) against <b>{sneakDc}</b>. Bess sells boots that help. ' +
      'Or <b>fight</b>: his shell is softer than a troll\'s (DC <b>{dc}</b>), but he has <b>{hp}</b> hearts and a mean pinch.',
    readyText: 'Oh! Oh my, is that... <b>my lens!</b> Not a scratch on it! Help me up the stairs, would you? Let\'s give those boats some light.',
    claim: 'Return the lens',
    claimSub: '+35 gold and a title',
    rewardText: '<i>The lighthouse flickers... and blazes to life, sweeping its beam across the water.</i><br>' +
      'Thirty-five gold from the harbour fund, and the gulls will sing of <b>Tidefriend</b> for years. Mostly off-key.',
    thanks: 'Glad to help',
    greetNone: 'Hello, dearie. Mind the gulls, they bite. And they steal. Everything steals around here lately...',
    greetActive: 'Any luck with that crab, dearie? The boats are still feeling their way home in the dark.',
    greetComplete: 'Look at her shine! Not a single boat lost since you brought the lens home, Tidefriend.',
    askPlace: 'What is this place?',
    askStolen: 'What\'s been stolen?',
    askTips: 'How should I deal with the crab?',
    offer: 'My lighthouse <b>lens</b>, dearie! A giant hermit crab called <b>Captain Pinch</b> scuttled up the rocks three nights ago and ' +
      'carried it off to <b>Shellshore Cove</b>, south of here. Without it the light\'s just a candle. Would you fetch it back?',
    accept: 'I\'ll get your lens back',
    acceptSub: '+5 gold · tracked on your map',
    notYet: 'Not right now',
    onIt: 'Leave it to me',
  },

  enemy: {
    troll: {
      short: 'Grumblemaw',
      intro: '<i>The mossy boulder shudders, opens two glowing eyes and lets out a rumbling yawn.</i><br>' +
        '"<b>GRRRUMBLE.</b> Tiny thing come to Grumblemaw\'s bog? Tiny thing look <b>crunchy</b>."',
      idle: 'Grumblemaw raises its spiked club. Your move!',
      hit: ['Your blade finds a gap in the moss!', 'A solid thwack right on the kneecap!'],
      crit: 'A critical blow! Grumblemaw staggers!',
      miss: 'Grumblemaw\'s club bonks you!',
      flee: '"Hrrm. Tiny thing runs. Grumblemaw nap again." <i>The troll settles back into the mud.</i>',
      victory: 'Grumblemaw wobbles... totters... and topples into the bog with an enormous SPLORCH!',
      loot: 'The bog falls silent. Among the mud you find <b>25 gold</b> and half a cheese wagon. Sergeant Bramble will want to hear about this!',
      after: 'Only bubbles and the croak of frogs remain where Grumblemaw once stood.',
    },
    crab: {
      short: 'Captain Pinch',
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
      sneakSuccess: 'You tiptoe across the sand... ease the lens loose... and slip away. Captain Pinch smacks his lips and snores on. <b>You have the lens!</b>',
      sneakFail: '<i>Crunch.</i> You step on a shell. Two eye stalks snap upright. "<b>THIEF!</b>"',
      sleeping: 'Captain Pinch is still snoring happily, dreaming of buttons. Best not wake him.',
    },
  },

  fight: {
    sneakChoice: 'Sneak up and take the lens',
    sneakSub: 'd20 + {bonus} sneak vs DC {dc}',
    fightChoice: 'Fight!',
    fightSub: 'd20 + {bonus} vs DC {dc}',
    backAway: 'Back away slowly',
    you: 'You',
    rollFor: 'You roll for {what}... <span class="muted">(need {need}+ on the die)</span>',
    whatSneak: 'sneak',
    whatAttack: 'attack',
    rolled: 'You rolled <b>{r}</b> + {bonus} = <b>{total}</b> vs DC {dc}.',
    nat1: 'A natural 1!',
    notQuiet: 'Not quiet enough!',
    miss: 'A miss!',
    clover: 'Your lucky clover twitches in your pocket...',
    useClover: 'Use a Lucky Clover',
    useCloverSub: 'Reroll ({n} left)',
    acceptFate: 'Accept fate',
    sneaky: 'Sneaky!',
    tiptoe: 'Tiptoe away',
    freePinch: '{line} He got a free pinch in, but now it\'s a fair fight!',
    attack: 'Attack',
    attackSub: 'Roll d20 + {bonus} vs DC {dc}',
    drink: 'Drink a potion',
    drinkSub: '+2 hearts ({n} left)',
    flee: 'Flee',
    fleeSub: '{name} recovers if you leave',
    critHit: 'CRITICAL HIT!',
    hit: 'Hit!',
    fumble: 'Natural 1. You stumble, and it lands a crushing blow!',
    missShort: 'Miss!',
    drank: 'You gulp down the potion. It tastes like strawberries and courage.',
    victory: 'Victory!',
    hooray: 'Hooray!',
    wobbly: 'Everything goes wobbly and dark...',
    knockedOut: 'Knocked out!',
    wakeUp: 'You wake up with a bump on your head{lost}. Maybe visit a shop before trying again?',
    lostGold: ' and <b>{n} gold</b> missing from your purse',
    ouch: 'Ouch',
    odds: 'Your odds in a fight: <b class="{cls}">{pct}%</b> ({verdict})',
    verdict: { doomed: 'hopeless', grim: 'grim', risky: 'risky', even: 'fair', good: 'favourable' },
    gearUp: 'You feel badly outmatched. Better armour, a sharper blade and a few potions would make all the difference.',
    oilApplied: 'You rub Bane Oil along your blade. It hisses and glows (+2 this fight).',
  },
};
