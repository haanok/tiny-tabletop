export const BOSS_DC = 14;
export const BOSS_MAX_HP = 3;

export function createState() {
  return {
    gold: 10,
    hp: 3,
    maxHp: 3,
    whetstone: false,
    fineSword: false,
    armour: false,
    potions: 0,
    clovers: 0,
    quest: 'none', // none | accepted | bossDefeated | complete
    bossHp: BOSS_MAX_HP,
    title: '',
  };
}

export const attackBonus = (s) => (s.whetstone ? 1 : 0) + (s.fineSword ? 2 : 0);
export const swordLevel = (s) => (s.fineSword ? 2 : s.whetstone ? 1 : 0);

export const QUEST_TEXT = {
  none: 'Talk to the guard in the square.',
  accepted: 'Defeat Grumblemaw in the bog to the north.',
  bossDefeated: 'Return to Sergeant Bramble for your reward.',
  complete: 'Grumblemaw is beaten. Thimblecross is safe!',
};
