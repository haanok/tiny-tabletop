import { BOARDS, nextBoardToward } from '../world/boards.js';

/**
 * Quest definitions. Stages: none → active → ready → complete.
 * active: go to `target`; ready: return to `giver`.
 */
export const QUESTS = {
  troll: {
    title: 'The Bog Troll',
    giver: { board: 'thimblecross', npc: 'bramble' },
    target: { board: 'bogmire', npc: 'troll' },
    steps: {
      active: 'Defeat Grumblemaw in the Bogmire.',
      ready: 'Return to Sergeant Bramble in Thimblecross.',
      complete: 'Grumblemaw is beaten. Thimblecross is safe!',
    },
  },
  lens: {
    title: 'The Stolen Lens',
    giver: { board: 'gullhaven', npc: 'marla' },
    target: { board: 'shellshore', npc: 'crab' },
    steps: {
      active: 'Recover the lighthouse lens from Captain Pinch at Shellshore Cove.',
      ready: 'Bring the lens back to Old Marla in Gullhaven.',
      complete: 'The Gullhaven light shines again!',
    },
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
  return { next, exit, nextName: BOARDS[next].name, finalName: BOARDS[obj.board].name };
}

/** Pick the next quest to track automatically (e.g. after one completes). */
export function autoTrack(state) {
  if (state.tracked && ['active', 'ready'].includes(state.quests[state.tracked])) return;
  state.tracked = Object.keys(QUESTS).find((id) => ['active', 'ready'].includes(state.quests[id])) ?? null;
}
