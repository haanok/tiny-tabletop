export const BASE_HP = 3;

export function createState() {
  return {
    gold: 10,
    hp: BASE_HP,
    potions: 0,
    clovers: 0,
    oil: 0, // Bane Oil flasks; one is applied when a fight starts
    oiled: false, // +2 attack for the current fight
    gear: { whetstone: false, narwhal: false, tinPlate: false, coralMail: false, boots: false },
    quests: { troll: 'none', lens: 'none' }, // none | active | ready | complete
    tracked: null,
    enemies: {
      troll: { hp: 4, defeated: false },
      crab: { hp: 5, defeated: false, sneaked: false },
    },
    titles: [],
    board: 'thimblecross',
    collected: new Set(),
  };
}

export const maxHp = (s) => BASE_HP + (s.gear.tinPlate ? 1 : 0) + (s.gear.coralMail ? 1 : 0);
export const attackBonus = (s) => (s.gear.whetstone ? 1 : 0) + (s.gear.narwhal ? 2 : 0) + (s.oiled ? 2 : 0);
export const sneakBonus = (s) => (s.gear.boots ? 3 : 0);
export const swordLevel = (s) => (s.gear.narwhal ? 2 : s.gear.whetstone ? 1 : 0);
