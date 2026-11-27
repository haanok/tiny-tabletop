/**
 * Hand-authored boards. Each row is one line of tiles, north at the top.
 *
 * Legend
 *   .  grass        ,  meadow (flowers)   #  cobblestone    =  dirt road
 *   s  sand         w  wooden planks      b  bog            ~  water (blocked)
 *   T  oak tree     P  pine tree          R  rock           r  rock on sand
 *   D  dead tree    Y  palm tree          m  glowing mushrooms on bog (walkable)
 *
 * Cells are [x, y] = [column, row]. Props with size [w, d] occupy that footprint.
 * Exits sit on the board edge; walking onto one travels to the linked board.
 */
export const BOARDS = {
  thimblecross: {
    name: 'Thimblecross',
    subtitle: 'A sleepy village at the heart of the table',
    edge: '#4a3324',
    rows: [
      'TPTT.,T.==..TPTTPT',
      'T....,..==.....,.T',
      'P.......==.......P',
      'T.,.....==.....,.T',
      'T..,##########..,T',
      'P...##########...T',
      'T...##########====',
      '.,..##########====',
      'T...##########...T',
      'T..,##########.,.P',
      'T.......,.......,T',
      'TT.,.....T....,.TT',
      'TPTTTTPTTTTTPTTTTT',
    ],
    start: [8, 8],
    npcs: [
      { id: 'pip', at: [6, 5], yaw: 0.2 },
      { id: 'bramble', at: [10, 3], yaw: -0.3 },
    ],
    props: [
      { type: 'house', at: [2, 1], size: [2, 2], roof: '#c4553a', seed: 1 },
      { type: 'house', at: [13, 1], size: [2, 2], roof: '#3f6fb0', seed: 2 },
      { type: 'house', at: [2, 10], size: [2, 2], roof: '#5a9a4a', seed: 3 },
      { type: 'house', at: [13, 10], size: [2, 2], roof: '#8a5ab0', wall: '#f6dcc0', seed: 4 },
      { type: 'stall', at: [6, 4], stripe: '#7a4fa8' },
      { type: 'well', at: [8, 6] },
      { type: 'lamp', at: [4, 4] }, { type: 'lamp', at: [13, 4] },
      { type: 'lamp', at: [4, 9] }, { type: 'lamp', at: [13, 9] },
      { type: 'barrel', at: [12, 5] },
      { type: 'arch', at: [8, 0], size: [2, 1], block: false },
      { type: 'arch', at: [17, 6], size: [1, 2], block: false, yaw: Math.PI / 2 },
    ],
    coins: [[1, 3], [15, 11], [15, 2], [5, 11]],
    exits: [
      { to: 'bogmire', side: 'north', cells: [[8, 0], [9, 0]] },
      { to: 'gullhaven', side: 'east', cells: [[17, 6], [17, 7]] },
    ],
  },

  bogmire: {
    name: 'The Bogmire',
    subtitle: 'Where the spilled tea went sour',
    edge: '#2e3a28',
    rows: [
      'DD~~DRDDbbDDRD~~DD',
      'D~~bbbbbbbbbbbb~~D',
      'R~bbbmbbbbbbmbbb~D',
      'D~bbbbbbbbbbbbbbbR',
      'Dbbm~~bbbbbb~~bbbD',
      'Rbb~~~bbmbbbb~~bmD',
      'DDbb~bbbwwbbb~bbDD',
      'D~bbbbbbwwbbbbb~~D',
      'D~~bbmbbwwbbmbb~DD',
      'DR~~bbbbwwbbbb~~RD',
      'DD~bbbbbwwbbbbb~DD',
      'DDD.,...ww...,.DDD',
      'TTTT...TwwT...TTTT',
    ],
    npcs: [{ id: 'troll', at: [8, 2], yaw: 0 }],
    props: [
      { type: 'sign', at: [11, 11], yaw: -Math.PI / 2 },
      { type: 'shrooms', at: [7, 3], block: false, seed: 9 },
      { type: 'shrooms', at: [10, 1], block: false, seed: 10 },
    ],
    coins: [[3, 1], [15, 3], [5, 9], [12, 7]],
    exits: [{ to: 'thimblecross', side: 'south', cells: [[8, 12], [9, 12]] }],
  },

  gullhaven: {
    name: 'Gullhaven',
    subtitle: 'A breezy harbour where the gulls never stop talking',
    edge: '#3a4a5a',
    rows: [
      'TTPT..ssss~~~~~~~~',
      'T....,sss~~~~rr~~~',
      'P.....ssss~~~rr~~~',
      'T..,..####s~~~~~~~',
      'T.....####sswww~~~',
      '......####ss~~w~~~',
      '======####ss~~w~~~',
      '======####sswwww~~',
      'T.....####ss~~~~~~',
      'P..,..####sss~~~~~',
      'T.....,..ssss~~~~~',
      'TT.,...sssss~~~~~~',
      'TTPTT.sssss~~~~~~~',
    ],
    start: [7, 6],
    npcs: [
      { id: 'bess', at: [11, 5], yaw: -0.8 },
      { id: 'marla', at: [9, 2], yaw: 0.4 },
    ],
    props: [
      { type: 'house', at: [2, 1], size: [2, 2], roof: '#3a8a9a', seed: 5 },
      { type: 'house', at: [2, 8], size: [2, 2], roof: '#d08a3a', seed: 6 },
      { type: 'house', at: [4, 3], size: [2, 2], roof: '#4a6ab0', wall: '#e8eef0', seed: 7 },
      { type: 'stall', at: [11, 4], stripe: '#3a7ab8', goods: 'fish' },
      { type: 'lighthouse', at: [13, 1] },
      { type: 'boat', at: [16, 4], block: false, color: '#d6473b' },
      { type: 'boat', at: [14, 9], block: false, color: '#3a7ab8', yaw: 1.2 },
      { type: 'boat', at: [16, 7], block: false, color: '#e8b63d', yaw: -0.4 },
      { type: 'barrel', at: [14, 4] },
      { type: 'crates', at: [15, 7] },
      { type: 'lamp', at: [6, 3] }, { type: 'lamp', at: [9, 9] },
      { type: 'arch', at: [0, 6], size: [1, 2], block: false, yaw: Math.PI / 2 },
    ],
    coins: [[1, 10], [12, 7], [7, 1], [4, 11]],
    exits: [
      { to: 'thimblecross', side: 'west', cells: [[0, 6], [0, 7]] },
      { to: 'shellshore', side: 'south', cells: [[7, 12], [8, 12]] },
    ],
  },

  shellshore: {
    name: 'Shellshore Cove',
    subtitle: 'Tide pools, shipwrecks and something that pinches',
    edge: '#6a5a40',
    rows: [
      'TTTTT.sssss~~~~~~~',
      'TY...sssssss~~~~~~',
      'Y..ssssrsssss~~~~~',
      '.ssss~~sssYsss~~~~',
      'sss~~~ssssssssr~~~',
      'Ysss~ssssrsssssr~~',
      'sssssssYssssssss~~',
      'ssss~~sssssssssr~~',
      'Yss~~~ssssssssss~~',
      'sssssrssssssssss~~',
      'ssYsssssssssssss~~',
      '~~ssssssrsssssss~~',
      '~~~~~~~~~~~~~~~~~~',
    ],
    npcs: [{ id: 'crab', at: [11, 9], yaw: -0.6 }],
    props: [
      { type: 'wreck', at: [13, 9], size: [2, 2] },
      { type: 'barrel', at: [4, 6] },
      { type: 'crates', at: [15, 6] },
      { type: 'boat', at: [16, 2], block: false, color: '#8a6a3e', yaw: 0.8 },
    ],
    coins: [[2, 7], [9, 3], [12, 4], [5, 10], [3, 1]],
    exits: [{ to: 'gullhaven', side: 'north', cells: [[7, 0], [8, 0]] }],
  },
};

export const SIDE_DIR = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

/** BFS over the board graph; returns the next board to step into, or null. */
export function nextBoardToward(from, to) {
  if (from === to) return null;
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const b = queue.shift();
    for (const ex of BOARDS[b].exits) {
      if (prev.has(ex.to)) continue;
      prev.set(ex.to, b);
      if (ex.to === to) {
        let cur = to;
        while (prev.get(cur) !== from) cur = prev.get(cur);
        return cur;
      }
      queue.push(ex.to);
    }
  }
  return null;
}
