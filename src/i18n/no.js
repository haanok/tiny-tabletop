// Norsk bokmål
export default {
  ui: {
    hint: 'Klikk eller bruk WASD for å gå · klikk på figurer for å snakke · dra for å rotere · scroll for å zoome',
    hero: 'Helt',
    drink: 'Drikk helsedrikk',
    quests: 'Oppdrag',
    noQuests: 'Se etter et <b>!</b> over hodet på noen.',
    entering: 'Velkommen til',
    gold: 'Gull',
    attack: 'Angrepsbonus',
    sneak: 'Snikebonus',
    potions: 'Helsedrikker',
    clovers: 'Firkløvere',
    music: 'Musikk',
    sfx: 'Lydeffekter',
    language: 'Språk',
    youHave: 'Du har',
    welcomeTitle: 'Velkommen, eventyrer',
    welcomeText: 'Klikk på en rute eller bruk <b>WASD</b> for å hoppe rundt, og klikk på en figur for å snakke. ' +
      'Lysende piler i kanten av brettet fører til <b>nye brett</b>.<br>' +
      'Se etter et <b>!</b> for å finne oppdrag. Når du tar på deg et, viser et <b>gyllent spor</b> veien.',
    welcomeGo: 'Kjør på!',
    find: 'Finn {name} her',
    route: 'Ta veien mot {side} til {next}',
    routeOn: ', og videre til {final}',
    sides: { north: 'nord', south: 'sør', east: 'øst', west: 'vest' },
    lensRecovered: 'Linsen er funnet!',
    reroll: '🍀 Nytt kast!',
  },

  board: {
    thimblecross: { name: 'Fingerbøl', subtitle: 'En søvnig landsby midt på bordet' },
    bogmire: { name: 'Sumpmyra', subtitle: 'Der den sølte teen ble sur' },
    gullhaven: { name: 'Måkehavn', subtitle: 'En luftig havneby der måkene aldri slutter å prate' },
    shellshore: { name: 'Skjellvika', subtitle: 'Tidevannspytter, skipsvrak og noe som klyper' },
  },

  npc: {
    pip: 'Pip Kremmer',
    bramble: 'Sersjant Bramble',
    bess: 'Rur-Bess',
    marla: 'Gamle Marla',
    troll: 'Grumlegap, myrtrollet',
    crab: 'Kaptein Klype',
  },

  title: { bogbane: 'Myrtemmer', tidefriend: 'Tidevannsvenn' },

  quest: {
    troll: {
      title: 'Myrtrollet',
      active: 'Beseire Grumlegap i Sumpmyra.',
      ready: 'Gå tilbake til sersjant Bramble i Fingerbøl.',
      complete: 'Grumlegap er slått. Fingerbøl er trygt!',
    },
    lens: {
      title: 'Den stjålne linsen',
      active: 'Hent fyrlinsen fra Kaptein Klype i Skjellvika.',
      ready: 'Gi linsen tilbake til Gamle Marla i Måkehavn.',
      complete: 'Fyret i Måkehavn lyser igjen!',
    },
  },

  item: {
    whetstone: { name: 'Slipestein', desc: '+1 på angrepskast' },
    tinPlate: { name: 'Blikkrustning', desc: '+1 maks hjerte' },
    potion: { name: 'Helsedrikk', desc: 'Gir 2 hjerter tilbake (når som helst)' },
    clover: { name: 'Firkløver', desc: 'Kast på nytt etter ett mislykket slag' },
    narwhal: { name: 'Narhvalsverd', desc: '+2 på angrepskast' },
    coralMail: { name: 'Korallbrynje', desc: '+1 maks hjerte' },
    boots: { name: 'Tidevannsstøvler', desc: '+3 på snikeslag' },
    tonic: { name: 'Taretonikum', desc: 'Drikk nå: alle hjerter tilbake' },
  },

  shop: {
    owned: 'kjøpt',
    notNeeded: 'trengs ikke',
    rumours: 'Hørt noen rykter?',
    goodbye: 'Ha det',
    bought: [
      'Godt valg! {item} kler deg.',
      'Takk for handelen! Ingen angrerett, ingen bytting.',
      'Åh, {item}. Du har godt øye.',
    ],
    pip: {
      greeting: 'Pssst! Blanke saker for blanke mynter! Pip har varer fra alle fire hjørner av bordet.',
      gossip: 'Kusina til Pip, Bess, har en bod i <b>Måkehavn</b>, østover langs veien. Finere sverd, mer fiskelukt. ' +
        'Og trollet i myra? Tregt, men slår hardt. En skarp egg og en firkløver gjør hele forskjellen!',
    },
    bess: {
      greeting: 'Ohoi, landkrabbe! Fersk fisk, finere stål og støvler som ikke knirker. Hva skal det være?',
      gossip: 'Kaptein Klype? Største krabben jeg har sett. Bor i en tønne nede i <b>Skjellvika</b>, sør for her. ' +
        'Elsker alt som glitrer. Heldigvis tar han seg en lur de fleste ettermiddager. Lister du deg inn med myke støvler, trenger du kanskje aldri svinge sverdet.',
    },
  },

  common: {
    back: 'Interessant... (tilbake)',
    farewell: 'Ha det bra',
    leave: 'Gå',
  },

  bramble: {
    place: 'Dette er <b>Fingerbøl</b>, den første ruten som noen gang ble lagt på bordet. De gamle fortellingene sier at verden ble lagt ut ' +
      'brett for brett av <b>Den store hånden</b>, og at skjebnen vår avgjøres når <b>De tjuesidede</b> triller. ' +
      'I nord ligger Sumpmyra. Mot øst går veien til fiskerfolket i <b>Måkehavn</b>.',
    bog: 'For lenge siden veltet en kjempekopp te utover det nordlige brettet. Den trakk inn og ble sur, og den bløte grunnen ble til <b>Sumpmyra</b>. ' +
      'Der vokste ting som ikke burde vokse: selvlysende sopp, sinte frosker, og verst av alt <b>Grumlegap</b>, et troll som en gang var en mosegrodd stein til teen vekket det.',
    tips: 'Hvert slag er et sjansespill. Kast <b>d20</b> og legg til angrepsbonusen din (din er <b>+{bonus}</b>). ' +
      'Slår du minst <b>{dc}</b>, treffer du; bommer du, slår det tilbake. En naturlig <b>20</b> treffer dobbelt så hardt, en naturlig <b>1</b> bommer alltid. ' +
      'Tre gode treff, så velter det. Følg det lysende sporet; det fører deg rett til hulen.',
    readyText: 'Ved barten min... du <b>klarte det</b>! Hele torget hørte Grumlegap stønne. Fingerbøl står i gjeld til deg.',
    claim: 'Hent belønningen',
    claimSub: '+30 gull og en tittel',
    rewardText: 'Tretti gull fra byens pengepung, og fra i dag skal du kalles <b>Myrtemmer</b>. ',
    rewardHint: 'Jeg har hørt at fyrvokteren i <b>Måkehavn</b> har sine egne problemer...',
    rewardProud: 'Bær den med stolthet, helt.',
    thanks: 'Tusen takk, sersjant',
    greetNone: 'Stopp! Hvem der... å. En eventyrer, å dømme etter den kappen. Vi kunne trenge en sånn.',
    greetActive: 'Grumlegap snorker fortsatt i myra mot nord. Angrepsbonusen din er <b>+{bonus}</b>. {comment}',
    lowBonus: 'Litt lavt, spør du meg.',
    goodBonus: 'Ser skarpt ut!',
    greetComplete: 'Hei, Myrtemmer! Veien nordover er stille nå. Ingenting igjen der ute enn frosker og sopp.',
    askPlace: 'Hva er dette for et sted?',
    askBog: 'Fortell om myra.',
    askWork: 'Har du noe arbeid til meg?',
    askTips: 'Hvordan slår jeg Grumlegap?',
    offer: 'Arbeid? Ja da. <b>Grumlegap, myrtrollet</b>, har tråkket rundt på nordveien og spist ostevognene våre. ' +
      'Slå det ned, så betaler byen godt. Her er ti gull på forskudd til utstyr. Bruk dem hos Pip.',
    accept: 'Ta oppdraget',
    acceptSub: '+10 gull · vises på kartet',
    notYet: 'Ikke ennå',
    onIt: 'Jeg fikser det',
  },

  marla: {
    place: '<b>Måkehavn</b>, vennen. Førti båter, fire hundre måker og ett fyr. Utenfor bryggene ligger <b>Den store dammen</b>. ' +
      'Ingen vet hvor langt den går; helt til bordkanten, sier noen. Lyset mitt har vist fiskebåtene hjem i seksti år.',
    tips: 'Det er to måter å ta en krabbe på, vennen. <b>Snik</b>: list deg innpå mens han sover og lirk linsen løs. Det er d20 + sniking ' +
      '(din er <b>+{sneak}</b>) mot <b>{sneakDc}</b>. Bess selger støvler som hjelper. ' +
      'Eller <b>slåss</b>: skallet hans er mykere enn et trolls (VG <b>{dc}</b>), men han har <b>{hp}</b> hjerter og en slem klype.',
    readyText: 'Å! Å, er det... <b>linsen min!</b> Ikke en ripe! Hjelp meg opp trappen, er du snill? La oss gi båtene litt lys.',
    claim: 'Gi tilbake linsen',
    claimSub: '+35 gull og en tittel',
    rewardText: '<i>Fyret flimrer... og flammer opp, og lysstrålen sveiper over vannet.</i><br>' +
      'Trettifem gull fra havnekassa, og måkene kommer til å synge om <b>Tidevannsvenn</b> i årevis. Mest falskt.',
    thanks: 'Bare hyggelig',
    greetNone: 'Hei, vennen. Pass deg for måkene, de biter. Og stjeler. Alt stjeler her for tiden...',
    greetActive: 'Noe hell med krabben, vennen? Båtene famler seg fortsatt hjem i mørket.',
    greetComplete: 'Se så hun skinner! Ikke en eneste båt borte siden du kom hjem med linsen, Tidevannsvenn.',
    askPlace: 'Hva er dette for et sted?',
    askStolen: 'Hva er blitt stjålet?',
    askTips: 'Hvordan skal jeg ta krabben?',
    offer: 'Fyr<b>linsen</b> min, vennen! En kjempestor eremittkreps som kalles <b>Kaptein Klype</b> klatret opp steinene for tre netter siden og ' +
      'bar den med seg til <b>Skjellvika</b>, sør for her. Uten den er fyret bare et stearinlys. Vil du hente den tilbake?',
    accept: 'Jeg skal hente linsen din',
    acceptSub: '+5 gull · vises på kartet',
    notYet: 'Ikke akkurat nå',
    onIt: 'Overlat det til meg',
  },

  enemy: {
    troll: {
      short: 'Grumlegap',
      intro: '<i>Den mosegrodde steinen rister, åpner to glødende øyne og gjesper rungende.</i><br>' +
        '«<b>GRRRUMLE.</b> Lite ting kommer til Grumlegaps myr? Lite ting ser <b>sprøtt</b> ut.»',
      idle: 'Grumlegap løfter den piggete køllen. Din tur!',
      hit: ['Sverdet ditt finner en åpning i mosen!', 'Et solid smell rett på kneskåla!'],
      crit: 'Et kritisk treff! Grumlegap vakler!',
      miss: 'Grumlegaps kølle dunker deg i hodet!',
      flee: '«Hrrm. Lite ting løper. Grumlegap sover igjen.» <i>Trollet synker tilbake i gjørma.</i>',
      victory: 'Grumlegap vagler... vakler... og velter ut i myra med et enormt PLASK!',
      loot: 'Myra blir stille. I gjørma finner du <b>25 gull</b> og en halv ostevogn. Sersjant Bramble vil gjerne høre om dette!',
      after: 'Bare bobler og froskekvekk er igjen der Grumlegap en gang sto.',
    },
    crab: {
      short: 'Kaptein Klype',
      intro: '<i>En tønne på størrelse med en robåt står i sanden og snorker. To øyestilker henger over kanten. ' +
        'Fastkilt på toppen glitrer fyrlinsen.</i>',
      idle: 'Kaptein Klype klaprer med klørne. «Jarr. Ingen rører skatten min!»',
      hit: ['Klonk! Rett på skallet!', 'Du slår til en klo. Han slipper den i sanden med et hyl!'],
      crit: 'Et perfekt treff mellom skallplatene!',
      miss: 'KNIPS! Kaptein Klype klyper deg i tærne!',
      flee: '«Arr, og hold deg unna!» <i>Krabben graver seg tilbake i tønna.</i>',
      victory: 'Kaptein Klype velter over på ryggen med beina i været, og linsen triller løs i sanden!',
      loot: 'Du tar <b>fyrlinsen</b> og blanke knapper verdt <b>15 gull</b> fra tønna. Gamle Marla kommer til å bli overlykkelig!',
      after: 'Det er stille i vika. Bare bølger, måker og en tom tønne.',
      sneakSuccess: 'Du lister deg over sanden... lirker linsen løs... og sniker deg unna. Kaptein Klype smatter og snorker videre. <b>Du har linsen!</b>',
      sneakFail: '<i>Knas.</i> Du tråkker på et skjell. To øyestilker spretter opp. «<b>TYV!</b>»',
      sleeping: 'Kaptein Klype snorker fornøyd og drømmer om knapper. Best å ikke vekke ham.',
    },
  },

  fight: {
    sneakChoice: 'Snik deg innpå og ta linsen',
    sneakSub: 'd20 + {bonus} sniking mot VG {dc}',
    fightChoice: 'Slåss!',
    fightSub: 'd20 + {bonus} mot VG {dc}',
    backAway: 'Rygg sakte unna',
    you: 'Deg',
    rollFor: 'Du kaster for {what}... <span class="muted">(trenger {need}+ på terningen)</span>',
    whatSneak: 'sniking',
    whatAttack: 'angrep',
    rolled: 'Du kastet <b>{r}</b> + {bonus} = <b>{total}</b> mot VG {dc}.',
    nat1: 'En naturlig 1!',
    notQuiet: 'Ikke stille nok!',
    miss: 'Bom!',
    clover: 'Firkløveren rykker i lomma di...',
    useClover: 'Bruk en firkløver',
    useCloverSub: 'Kast på nytt ({n} igjen)',
    acceptFate: 'Godta skjebnen',
    sneaky: 'Lur!',
    tiptoe: 'List deg unna',
    freePinch: '{line} Han fikk inn en gratis klype, men nå er det en rettferdig kamp!',
    attack: 'Angrip',
    attackSub: 'Kast d20 + {bonus} mot VG {dc}',
    drink: 'Drikk en helsedrikk',
    drinkSub: '+2 hjerter ({n} igjen)',
    flee: 'Flykt',
    fleeSub: '{name} kommer seg hvis du går',
    critHit: 'KRITISK TREFF!',
    hit: 'Treff!',
    fumble: 'Naturlig 1. Du snubler i din egen kappe!',
    missShort: 'Bom!',
    drank: 'Du skyller ned helsedrikken. Den smaker jordbær og mot.',
    victory: 'Seier!',
    hooray: 'Hurra!',
    wobbly: 'Alt blir vinglete og mørkt...',
    knockedOut: 'Slått ut!',
    wakeUp: 'Du våkner med en kul i hodet{lost}. Kanskje du burde innom en butikk før du prøver igjen?',
    lostGold: ' og <b>{n} gull</b> mindre i pungen',
    ouch: 'Au',
  },
};
