const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * 4-directional A* on the infinite grid.
 * @param start {gx,gz}
 * @param target {gx,gz} heuristic target
 * @param isGoal (gx,gz) => boolean
 * @param isBlocked (gx,gz) => boolean
 * @returns array of cells after start, or null if unreachable within budget.
 */
export function findPath(start, target, isGoal, isBlocked, maxNodes = 5000) {
  const k = (x, z) => `${x},${z}`;
  const h = (x, z) => Math.abs(x - target.gx) + Math.abs(z - target.gz);
  const open = [{ gx: start.gx, gz: start.gz, g: 0, f: h(start.gx, start.gz) }];
  const came = new Map([[k(start.gx, start.gz), null]]);
  const gScore = new Map([[k(start.gx, start.gz), 0]]);
  let expanded = 0;

  while (open.length && expanded < maxNodes) {
    // Small open sets: linear min search is fine.
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    expanded++;

    if (isGoal(cur.gx, cur.gz)) {
      const path = [];
      let node = k(cur.gx, cur.gz);
      while (node) {
        const [x, z] = node.split(',').map(Number);
        path.unshift({ gx: x, gz: z });
        node = came.get(node);
      }
      path.shift(); // drop start
      return path;
    }

    for (const [dx, dz] of DIRS) {
      const nx = cur.gx + dx;
      const nz = cur.gz + dz;
      if (isBlocked(nx, nz)) continue;
      const nk = k(nx, nz);
      const g = cur.g + 1;
      if (g < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, g);
        came.set(nk, k(cur.gx, cur.gz));
        open.push({ gx: nx, gz: nz, g, f: g + h(nx, nz) });
      }
    }
  }
  return null;
}
