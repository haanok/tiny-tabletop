import { BOARDS, nextBoardToward } from '../world/boards.js';

// Titles and step text live in i18n under quest.<id>.*

/**
 * Quest definitions. Stages: none → active → ready → complete.
 * active: go to `target`; ready: return to `giver`.
 */
export const QUESTS = {
  troll: {
    giver: { board: 'thimblecross', npc: 'bramble' },
    target: { board: 'bogmire', npc: 'troll' },
  },
  lens: {
    giver: { board: 'gullhaven', npc: 'marla' },
    target: { board: 'shellshore', npc: 'crab' },
  },
};

/** Where the tracked quest wants you to go next: { board, npc } or null. */
export function objective(state) {
  const id = state.tracked;
  if (!id) return null;
  const stage = state.quests[id];
  if (stage === 'active') return QUESTS[id].target;
  if (stage === 'ready') return QUESTS[id].giver;
  return null;
}

/** For an objective on another board: which exit of the current board to take. */
export function routeHint(currentBoard, obj) {
  const next = nextBoardToward(currentBoard, obj.board);
  if (!next) return null;
  const exit = BOARDS[currentBoard].exits.find((e) => e.to === next);
  return { next, exit };
}

/** Pick the next quest to track automatically (e.g. after one completes). */
export function autoTrack(state) {
  if (state.tracked && ['active', 'ready'].includes(state.quests[state.tracked])) return;
  state.tracked = Object.keys(QUESTS).find((id) => ['active', 'ready'].includes(state.quests[id])) ?? null;
}
