import {
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { paint, metal, castAll } from '../minis/materials.js';
import { BOARDS, SIDE_DIR } from './boards.js';
import { PROP_BUILDERS, pine, deadTree, palm, glowShrooms } from './props.js';

export const TILE_H = 0.2;
export const key = (gx, gz) => `${gx},${gz}`;

const CHARS = {
  '.': { type: 'grass' },
  ',': { type: 'meadow' },
  '#': { type: 'stone' },
  '=': { type: 'path' },
  s: { type: 'sand' },
  w: { type: 'dock' },
  b: { type: 'bog' },
  '~': { type: 'water' },
  T: { type: 'grass', obstacle: 'tree' },
  P: { type: 'grass', obstacle: 'pine' },
  R: { type: 'grass', obstacle: 'rock' },
  r: { type: 'sand', obstacle: 'rock' },
  D: { type: 'bog', obstacle: 'dead' },
  Y: { type: 'sand', obstacle: 'palm' },
  m: { type: 'bog', deco: 'shrooms' },
};

const TYPE = {
  grass: { hsl: [0.26, 0.42, 0.46], h: 0 },
  meadow: { hsl: [0.22, 0.48, 0.54], h: 0 },
  stone: { hsl: [0.08, 0.1, 0.6], h: 0.01 },
  path: { hsl: [0.09, 0.32, 0.56], h: -0.01 },
  sand: { hsl: [0.12, 0.45, 0.72], h: -0.005 },
  dock: { hsl: [0.07, 0.38, 0.42], h: 0.02 },
  bog: { hsl: [0.28, 0.22, 0.27], h: -0.03 },
  water: { hsl: [0.53, 0.5, 0.45], h: -0.09 },
};

function hash(x, z, s = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(s + 71, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Shared geometry/materials
const tileGeo = new RoundedBoxGeometry(0.94, TILE_H, 0.94, 2, 0.05);
const trunkGeo = new CylinderGeometry(0.07, 0.1, 0.5, 8);
const blobGeo = new IcosahedronGeometry(1, 1);
const rockGeo = new DodecahedronGeometry(1, 0);
const flowerGeo = new SphereGeometry(0.03, 6, 4);
const coinGeo = new CylinderGeometry(0.11, 0.11, 0.025, 20);
const tileMat = paint('#ffffff');
const waterMat = paint('#ffffff', { roughness: 0.12, metalness: 0.1 });
const trunkMat = paint('#6b4429');
const leafMat = paint('#ffffff', { flatShading: true });
const rockMat = paint('#ffffff', { flatShading: true });
const flowerMat = paint('#ffffff', { roughness: 0.6 });
const coinMat = metal('#f5c542');
coinMat.emissive.set('#a06a00');
coinMat.emissiveIntensity = 0.35;
const FLOWERS = ['#ff8fb1', '#fff27a', '#ffffff', '#b99cff'];

const arrowShape = new Shape();
arrowShape.moveTo(0, 0.28);
arrowShape.lineTo(0.22, 0.02);
arrowShape.lineTo(0.09, 0.02);
arrowShape.lineTo(0.09, -0.24);
arrowShape.lineTo(-0.09, -0.24);
arrowShape.lineTo(-0.09, 0.02);
arrowShape.lineTo(-0.22, 0.02);
arrowShape.closePath();
const arrowGeo = new ShapeGeometry(arrowShape);

const dummy = new Object3D();
const color = new Color();

function instanced(geo, mat, items, write, { cast = true } = {}) {
  if (!items.length) return null;
  const mesh = new InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => {
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    write(it, dummy, color);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color);
  });
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Build a board from its definition.
 * npcFactory: { [id]: () => npcController }
 * collected: Set of `${boardId}:${x},${y}` coin keys already taken.
 */
export function buildBoard(id, npcFactory, collected) {
  const def = BOARDS[id];
  const H = def.rows.length;
  const W = def.rows[0].length;
  const group = new Group();
  group.name = `board:${id}`;

  // ---- Terrain grid ----
  const cells = [];
  for (let gz = 0; gz < H; gz++) {
    for (let gx = 0; gx < W; gx++) {
      const ch = def.rows[gz][gx];
      const c = CHARS[ch];
      if (!c) throw new Error(`Board ${id}: unknown tile '${ch}' at ${gx},${gz}`);
      const t = TYPE[c.type];
      cells.push({ gx, gz, ...c, h: t.h + hash(gx, gz, 4) * 0.02 });
    }
  }
  const cellAt = (gx, gz) => (gx < 0 || gz < 0 || gx >= W || gz >= H ? null : cells[gz * W + gx]);
  const occupied = new Map();

  // ---- Board slab (the physical game board) ----
  const slab = new Mesh(new RoundedBoxGeometry(W + 0.5, 0.3, H + 0.5, 3, 0.1), paint(def.edge));
  slab.position.set((W - 1) / 2, -TILE_H - 0.15, (H - 1) / 2);
  slab.receiveShadow = true;
  slab.castShadow = true;
  group.add(slab);

  // ---- Tiles ----
  const writeTile = ({ gx, gz, type, h }, d, c) => {
    const [hh, s, l] = TYPE[type].hsl;
    const checker = type === 'stone' && (gx + gz) % 2 === 0 ? 0.04 : 0;
    c.setHSL(hh + (hash(gx, gz, 11) - 0.5) * 0.03, s, l + checker + (hash(gx, gz, 12) - 0.5) * 0.06);
    d.position.set(gx, h - TILE_H / 2, gz);
    d.rotation.y = (hash(gx, gz, 13) - 0.5) * 0.04;
    if (type === 'dock') d.scale.set(1, 0.6, 0.98);
  };
  group.add(instanced(tileGeo, tileMat, cells.filter((c) => c.type !== 'water'), writeTile, { cast: false }));
  const water = instanced(tileGeo, waterMat, cells.filter((c) => c.type === 'water'), writeTile, { cast: false });
  water && group.add(water);

  // ---- Oaks & rocks (instanced) ----
  const oaks = cells.filter((c) => c.obstacle === 'tree');
  const trunks = instanced(trunkGeo, trunkMat, oaks, ({ gx, gz, h }, d, c) => {
    const s = 0.8 + hash(gx, gz, 14) * 0.5;
    d.position.set(gx, h + 0.25 * s, gz);
    d.scale.setScalar(s);
    c.set('#ffffff');
  });
  trunks && group.add(trunks);
  const blobs = [];
  for (const tr of oaks) {
    const s = 0.8 + hash(tr.gx, tr.gz, 14) * 0.5;
    const hue = 0.26 + hash(tr.gx, tr.gz, 15) * 0.07;
    const light = 0.3 + hash(tr.gx, tr.gz, 16) * 0.1;
    for (const [x, y, z, r] of [[0, 0.72, 0, 0.36], [0.18, 0.58, 0.1, 0.25], [-0.17, 0.6, -0.06, 0.26], [0.02, 0.98, 0, 0.24]]) {
      blobs.push({ x: tr.gx + x * s, y: tr.h + y * s, z: tr.gz + z * s, r: r * s, hue, light });
    }
  }
  const foliage = instanced(blobGeo, leafMat, blobs, (b, d, c) => {
    d.position.set(b.x, b.y, b.z);
    d.rotation.set(b.x, b.z, 0);
    d.scale.setScalar(b.r);
    c.setHSL(b.hue, 0.5, b.light);
  });
  foliage && group.add(foliage);

  const rocks = instanced(rockGeo, rockMat, cells.filter((c) => c.obstacle === 'rock'), ({ gx, gz, h, type }, d, c) => {
    const s = 0.24 + hash(gx, gz, 17) * 0.16;
    d.position.set(gx + (hash(gx, gz, 18) - 0.5) * 0.2, h + s * 0.45, gz);
    d.rotation.set(hash(gx, gz, 19) * 3, hash(gx, gz, 20) * 3, 0);
    d.scale.set(s, s * 0.75, s);
    c.setHSL(type === 'sand' ? 0.08 : 0.1, 0.06, 0.45 + hash(gx, gz, 21) * 0.15);
  });
  rocks && group.add(rocks);

  const flowers = [];
  for (const c of cells) {
    if (c.type === 'meadow' && !c.obstacle) {
      for (let f = 0; f < 4; f++) if (hash(c.gx, c.gz, 20 + f) < 0.6) flowers.push({ ...c, f });
    }
  }
  const flowerMesh = instanced(flowerGeo, flowerMat, flowers, ({ gx, gz, h, f }, d, c) => {
    d.position.set(gx + (hash(gx, gz, 30 + f) - 0.5) * 0.7, h + 0.03, gz + (hash(gx, gz, 40 + f) - 0.5) * 0.7);
    d.scale.set(1, 0.7, 1);
    c.set(FLOWERS[Math.floor(hash(gx, gz, 50 + f) * FLOWERS.length)]);
  }, { cast: false });
  flowerMesh && group.add(flowerMesh);

  // ---- Unique obstacles (pines, dead trees, palms) & decorations ----
  for (const c of cells) {
    let obj = null;
    const seed = c.gx * 31 + c.gz * 17;
    if (c.obstacle === 'pine') obj = pine(seed);
    else if (c.obstacle === 'dead') obj = deadTree(seed);
    else if (c.obstacle === 'palm') obj = palm(seed);
    else if (c.deco === 'shrooms') obj = glowShrooms(seed);
    if (obj) {
      obj.position.set(c.gx, c.h, c.gz);
      obj.rotation.y = hash(c.gx, c.gz, 60) * Math.PI * 2;
      group.add(obj);
    }
  }

  // ---- Props ----
  const animated = [];
  const props = {};
  for (const p of def.props) {
    const [w, d] = p.size ?? [1, 1];
    const obj = PROP_BUILDERS[p.type](p);
    const cx = p.at[0] + (w - 1) / 2;
    const cz = p.at[1] + (d - 1) / 2;
    const base = cellAt(p.at[0], p.at[1]);
    obj.position.set(cx, base.h, cz);
    obj.userData.baseY = base.h;
    obj.rotation.y = p.yaw ?? 0;
    group.add(obj);
    if (obj.userData.animate) animated.push(obj);
    props[p.type] = obj;
    if (p.block !== false) {
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) occupied.set(key(p.at[0] + i, p.at[1] + j), { kind: 'prop' });
    }
  }

  // ---- NPCs ----
  const npcs = new Map();
  for (const n of def.npcs) {
    const npc = npcFactory[n.id]();
    npc.id = n.id;
    npc.cell = { gx: n.at[0], gz: n.at[1] };
    npc.object.position.set(n.at[0], cellAt(n.at[0], n.at[1]).h, n.at[1]);
    npc.object.rotation.y = n.yaw ?? 0;
    group.add(npc.object);
    npcs.set(n.id, npc);
    occupied.set(key(n.at[0], n.at[1]), { kind: 'npc', id: n.id, npc });
  }

  // ---- Exits: pulsing arrows + label anchors ----
  const exits = def.exits.map((ex) => {
    const [dx, dz] = SIDE_DIR[ex.side];
    const anchor = new Object3D();
    const mid = ex.cells.reduce((a, [x, z]) => [a[0] + x / ex.cells.length, a[1] + z / ex.cells.length], [0, 0]);
    anchor.position.set(mid[0] + dx * 0.3, 0.9, mid[1] + dz * 0.3);
    group.add(anchor);
    const mat = new MeshBasicMaterial({ color: '#fff6d8', transparent: true, opacity: 0.7, depthWrite: false, side: DoubleSide });
    for (const [x, z] of ex.cells) {
      const a = new Mesh(arrowGeo, mat);
      a.rotation.x = -Math.PI / 2;
      a.rotation.z = Math.atan2(-dx, -dz); // shape +Y → world (dx, dz)
      a.position.set(x, cellAt(x, z).h + 0.008, z);
      group.add(a);
    }
    return { ...ex, dir: new Vector3(dx, 0, dz), anchor, mat };
  });
  const exitAt = (gx, gz) => exits.find((e) => e.cells.some(([x, z]) => x === gx && z === gz)) ?? null;

  // ---- Coins ----
  const coins = new Map();
  for (const [x, z] of def.coins) {
    if (collected.has(`${id}:${x},${z}`)) continue;
    const coin = new Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(x, cellAt(x, z).h + 0.22, z);
    coin.castShadow = true;
    coin.userData.phase = hash(x, z, 9) * 6;
    coin.userData.baseY = coin.position.y;
    group.add(coin);
    coins.set(key(x, z), coin);
  }

  castAll(group);
  group.traverse((o) => { if (o.isMesh && o.material?.transparent && o.material.depthWrite === false) o.castShadow = false; });
  if (flowerMesh) flowerMesh.castShadow = false;

  let time = 0;

  return {
    id,
    def,
    W,
    H,
    group,
    npcs,
    exits,
    props,
    occupied,
    exitAt,
    cellAt,
    occupantAt: (gx, gz) => occupied.get(key(gx, gz)),
    isBlocked(gx, gz) {
      const c = cellAt(gx, gz);
      return !c || !!c.obstacle || c.type === 'water' || occupied.has(key(gx, gz));
    },
    localPos: (gx, gz, out = new Vector3()) => out.set(gx, cellAt(gx, gz)?.h ?? 0, gz),
    worldPos(gx, gz, out = new Vector3()) {
      return out.set(gx, cellAt(gx, gz)?.h ?? 0, gz).add(group.position);
    },
    cellFromWorld(p) {
      return { gx: Math.round(p.x - group.position.x), gz: Math.round(p.z - group.position.z) };
    },
    /** Returns coin value (and removes it) or 0. */
    collectCoin(gx, gz) {
      const k = key(gx, gz);
      const coin = coins.get(k);
      if (!coin) return 0;
      group.remove(coin);
      coins.delete(k);
      collected.add(`${id}:${k}`);
      return 4 + Math.floor(hash(gx, gz, 8) * 3);
    },
    animate(dt) {
      time += dt;
      for (const coin of coins.values()) {
        coin.rotation.z = time * 2 + coin.userData.phase;
        coin.position.y = coin.userData.baseY + Math.sin(time * 3 + coin.userData.phase) * 0.03;
      }
      for (const obj of animated) obj.userData.animate(time);
      for (const ex of exits) ex.mat.opacity = 0.45 + Math.sin(time * 3) * 0.25;
    },
  };
}
