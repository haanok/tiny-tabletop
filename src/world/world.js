import {
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { paint, metal } from '../minis/materials.js';

export const CHUNK = 8;
export const VIEW_RADIUS = 2; // chunks kept around the hero
export const PLAZA = 3; // town square half-size
export const BOSS_CELL = { gx: 0, gz: -15 };
const TILE_H = 0.2;
const SEED = 1337;

export const key = (gx, gz) => `${gx},${gz}`;

// ---------- deterministic noise ----------
function hash(x, z, s = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(s + SEED, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise(x, z, s) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, s), b = hash(ix + 1, iz, s), c = hash(ix, iz + 1, s), d = hash(ix + 1, iz + 1, s);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
const fbm = (x, z, s) => valueNoise(x, z, s) * 0.65 + valueNoise(x * 2.1, z * 2.1, s + 5) * 0.35;

/** The winding road from the plaza north to the bog. */
const roadX = (gz) => Math.round(Math.sin(gz * 0.33) * 1.3);
function onRoad(gx, gz) {
  if (gz >= -PLAZA || gz <= BOSS_CELL.gz + 2) return false;
  return gx === roadX(gz) || gx === roadX(gz + 1);
}

// ---------- terrain ----------
const cache = new Map();

/**
 * Terrain for a cell: { type, h, obstacle: null|'tree'|'rock', coin }.
 * h is the tile-top height. Pure function of coordinates (memoised).
 */
export function terrainAt(gx, gz) {
  const k = key(gx, gz);
  let t = cache.get(k);
  if (t) return t;

  const inPlaza = Math.abs(gx) <= PLAZA && Math.abs(gz) <= PLAZA;
  const bossDist = Math.hypot(gx - BOSS_CELL.gx, gz - BOSS_CELL.gz);
  const inLair = bossDist <= 3.6;
  const road = onRoad(gx, gz);
  const n = fbm(gx * 0.09, gz * 0.09, 1);
  const r1 = hash(gx, gz, 2);
  const r2 = hash(gx, gz, 3);

  let type;
  if (inPlaza) type = 'stone';
  else if (inLair) type = r1 < 0.25 && bossDist > 2.2 ? 'water' : 'bog';
  else if (road) type = 'path';
  else if (n > 0.62) type = 'forest';
  else if (n < 0.33) type = 'meadow';
  else if (r1 < 0.04) type = 'dirt';
  else type = 'grass';

  let obstacle = null;
  const reserved = inPlaza || road || bossDist <= 2.2 || (Math.abs(gx) <= 1 && Math.abs(gz) <= PLAZA + 1);
  if (!reserved) {
    if (inLair) obstacle = r2 < 0.35 ? 'rock' : null;
    else {
      const treeP = { forest: 0.4, grass: 0.07, meadow: 0.03, dirt: 0.02 }[type];
      const rockP = { forest: 0.04, grass: 0.03, meadow: 0.02, dirt: 0.2 }[type];
      if (r2 < treeP) obstacle = 'tree';
      else if (r2 < treeP + rockP) obstacle = 'rock';
    }
  }
  if (type === 'water') obstacle = null;

  const coin =
    !obstacle && !inPlaza && !inLair && hash(gx, gz, 7) < 0.03 ? 3 + Math.floor(hash(gx, gz, 8) * 4) : 0;

  let h = hash(gx, gz, 4) * 0.025;
  if (type === 'bog') h -= 0.03;
  if (type === 'water') h -= 0.07;
  if (type === 'path') h -= 0.01;

  t = { type, h, obstacle, coin };
  cache.set(k, t);
  return t;
}

export const heightAt = (gx, gz) => terrainAt(gx, gz).h;

const TYPE_COLOR = {
  stone: () => [0.08, 0.1, 0.6],
  path: () => [0.09, 0.32, 0.6],
  grass: () => [0.26, 0.42, 0.46],
  forest: () => [0.3, 0.42, 0.34],
  meadow: () => [0.22, 0.48, 0.54],
  dirt: () => [0.07, 0.33, 0.4],
  bog: () => [0.28, 0.22, 0.26],
  water: () => [0.47, 0.35, 0.32],
};

// ---------- shared geometry / materials ----------
const tileGeo = new RoundedBoxGeometry(0.94, TILE_H, 0.94, 2, 0.05);
const trunkGeo = new CylinderGeometry(0.07, 0.1, 0.5, 8);
const blobGeo = new IcosahedronGeometry(1, 1);
const rockGeo = new DodecahedronGeometry(1, 0);
const flowerGeo = new SphereGeometry(0.03, 6, 4);
const coinGeo = new CylinderGeometry(0.11, 0.11, 0.025, 20);

const tileMat = paint('#ffffff');
const trunkMat = paint('#6b4429');
const leafMat = paint('#ffffff', { flatShading: true });
const rockMat = paint('#ffffff', { flatShading: true });
const flowerMat = paint('#ffffff', { roughness: 0.6 });
const coinMat = metal('#f5c542');
coinMat.emissive.set('#a06a00');
coinMat.emissiveIntensity = 0.35;

const dummy = new Object3D();
const color = new Color();
const FLOWER_COLORS = ['#ff8fb1', '#fff27a', '#ffffff', '#b99cff'];

function makeInstanced(geo, mat, items, write) {
  if (!items.length) return null;
  const mesh = new InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => {
    write(it, dummy, color);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color);
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildChunk(cx, cz, collected) {
  const group = new Group();
  const cells = [];
  const trees = [];
  const rocks = [];
  const flowers = [];
  const coins = new Map();

  for (let i = 0; i < CHUNK; i++) {
    for (let j = 0; j < CHUNK; j++) {
      const gx = cx * CHUNK + i;
      const gz = cz * CHUNK + j;
      const t = terrainAt(gx, gz);
      cells.push({ gx, gz, t });
      if (t.obstacle === 'tree') trees.push({ gx, gz, t });
      if (t.obstacle === 'rock') rocks.push({ gx, gz, t });
      if (t.type === 'meadow' && !t.obstacle) {
        for (let f = 0; f < 3; f++) {
          if (hash(gx, gz, 20 + f) < 0.5) flowers.push({ gx, gz, t, f });
        }
      }
      if (t.coin && !collected.has(key(gx, gz))) {
        const coin = new Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(gx, t.h + 0.22, gz);
        coin.castShadow = true;
        coin.userData.phase = hash(gx, gz, 9) * 6;
        group.add(coin);
        coins.set(key(gx, gz), coin);
      }
    }
  }

  const tiles = makeInstanced(tileGeo, tileMat, cells, ({ gx, gz, t }, d, c) => {
    const [h, s, l] = TYPE_COLOR[t.type]();
    const checker = t.type === 'stone' && (gx + gz) % 2 === 0 ? 0.04 : 0;
    c.setHSL(h + (hash(gx, gz, 11) - 0.5) * 0.03, s, l + checker + (hash(gx, gz, 12) - 0.5) * 0.06);
    d.position.set(gx, t.h - TILE_H / 2, gz);
    d.rotation.set(0, (hash(gx, gz, 13) - 0.5) * 0.04, 0);
    d.scale.set(1, 1, 1);
  });
  tiles.castShadow = false;
  group.add(tiles);

  const trunks = makeInstanced(trunkGeo, trunkMat, trees, ({ gx, gz, t }, d, c) => {
    const s = 0.8 + hash(gx, gz, 14) * 0.5;
    d.position.set(gx, t.h + 0.25 * s, gz);
    d.rotation.set(0, 0, 0);
    d.scale.set(s, s, s);
    c.set('#ffffff');
  });
  trunks && group.add(trunks);

  const blobs = [];
  for (const tr of trees) {
    const s = 0.8 + hash(tr.gx, tr.gz, 14) * 0.5;
    const hue = 0.26 + hash(tr.gx, tr.gz, 15) * 0.07;
    const light = 0.3 + hash(tr.gx, tr.gz, 16) * 0.1;
    for (const [x, y, z, r] of [[0, 0.72, 0, 0.36], [0.18, 0.58, 0.1, 0.25], [-0.17, 0.6, -0.06, 0.26], [0.02, 0.98, 0, 0.24]]) {
      blobs.push({ x: tr.gx + x * s, y: tr.t.h + y * s, z: tr.gz + z * s, r: r * s, hue, light });
    }
  }
  const foliage = makeInstanced(blobGeo, leafMat, blobs, (b, d, c) => {
    d.position.set(b.x, b.y, b.z);
    d.rotation.set(b.x, b.z, 0);
    d.scale.setScalar(b.r);
    c.setHSL(b.hue, 0.5, b.light);
  });
  foliage && group.add(foliage);

  const rockMesh = makeInstanced(rockGeo, rockMat, rocks, ({ gx, gz, t }, d, c) => {
    const s = 0.22 + hash(gx, gz, 17) * 0.16;
    d.position.set(gx + (hash(gx, gz, 18) - 0.5) * 0.2, t.h + s * 0.45, gz);
    d.rotation.set(hash(gx, gz, 19) * 3, hash(gx, gz, 20) * 3, 0);
    d.scale.set(s, s * 0.75, s);
    c.setHSL(t.type === 'bog' ? 0.3 : 0.08, 0.06, 0.42 + hash(gx, gz, 21) * 0.15);
  });
  rockMesh && group.add(rockMesh);

  const flowerMesh = makeInstanced(flowerGeo, flowerMat, flowers, ({ gx, gz, t, f }, d, c) => {
    d.position.set(gx + (hash(gx, gz, 30 + f) - 0.5) * 0.7, t.h + 0.03, gz + (hash(gx, gz, 40 + f) - 0.5) * 0.7);
    d.rotation.set(0, 0, 0);
    d.scale.set(1, 0.7, 1);
    c.set(FLOWER_COLORS[Math.floor(hash(gx, gz, 50 + f) * FLOWER_COLORS.length)]);
  });
  if (flowerMesh) {
    flowerMesh.castShadow = false;
    group.add(flowerMesh);
  }

  return { group, coins, meshes: [tiles, trunks, foliage, rockMesh, flowerMesh].filter(Boolean) };
}

/**
 * Streams chunks in/out around the hero. Also tracks collected coins and
 * extra blocked cells (NPCs, props).
 */
export function createWorld(scene) {
  const root = new Group();
  scene.add(root);
  const chunks = new Map();
  const collected = new Set();
  const occupied = new Map(); // key -> thing standing there
  let time = 0;

  function update(cell) {
    const hcx = Math.floor(cell.gx / CHUNK);
    const hcz = Math.floor(cell.gz / CHUNK);
    const wanted = new Set();
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
        const k = key(hcx + dx, hcz + dz);
        wanted.add(k);
        if (!chunks.has(k)) {
          const c = buildChunk(hcx + dx, hcz + dz, collected);
          chunks.set(k, c);
          root.add(c.group);
        }
      }
    }
    for (const [k, c] of chunks) {
      if (!wanted.has(k)) {
        root.remove(c.group);
        c.meshes.forEach((m) => m.dispose());
        chunks.delete(k);
      }
    }
  }

  function animate(dt) {
    time += dt;
    for (const c of chunks.values()) {
      for (const coin of c.coins.values()) {
        coin.rotation.z = time * 2 + coin.userData.phase;
        coin.position.y = terrainAt(Math.round(coin.position.x), Math.round(coin.position.z)).h + 0.22 + Math.sin(time * 3 + coin.userData.phase) * 0.03;
      }
    }
  }

  /** Returns the coin value at a cell (and removes it), or 0. */
  function collectCoin(gx, gz) {
    const k = key(gx, gz);
    const t = terrainAt(gx, gz);
    if (!t.coin || collected.has(k)) return 0;
    collected.add(k);
    for (const c of chunks.values()) {
      const mesh = c.coins.get(k);
      if (mesh) {
        c.group.remove(mesh);
        c.coins.delete(k);
      }
    }
    return t.coin;
  }

  const isBlocked = (gx, gz) => {
    const t = terrainAt(gx, gz);
    return !!t.obstacle || t.type === 'water' || occupied.has(key(gx, gz));
  };

  const worldPos = (gx, gz, out = new Vector3()) => out.set(gx, heightAt(gx, gz), gz);

  return {
    update,
    animate,
    collectCoin,
    isBlocked,
    occupied,
    occupantAt: (gx, gz) => occupied.get(key(gx, gz)),
    worldPos,
  };
}

