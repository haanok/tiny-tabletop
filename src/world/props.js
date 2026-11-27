import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  AdditiveBlending,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { paint, castAll, seededRandom } from '../minis/materials.js';

// Every builder returns a Group centred on its footprint, sitting at y = 0.
// Optional g.userData.animate(t) is called each frame.

const M = {
  wall: paint('#f3e6c8'),
  timber: paint('#7a5232'),
  door: paint('#5a3a24'),
  stone: paint('#9a948c', { flatShading: true }),
  wood: paint('#9a6a3a'),
  darkWood: paint('#5e3f26'),
  glass: paint('#ffd98a', { emissive: '#ff9a2e', emissiveIntensity: 2.4 }),
  water: paint('#4aa3c8', { roughness: 0.15 }),
  white: paint('#f4f0e8'),
  red: paint('#d6473b'),
  leaf: paint('#4f8a3a', { flatShading: true }),
  palmLeaf: paint('#5fa83f', { side: DoubleSide }),
  sail: paint('#efe3c4', { side: DoubleSide }),
};

/** Cosy cottage with a hip roof, chimney, glowing windows. Footprint w × d tiles. */
export function house({ w = 2, d = 2, roof = '#c4553a', wall = '#f3e6c8', seed = 1 } = {}) {
  const g = new Group();
  const rand = seededRandom(seed);
  const wallMat = paint(wall);
  const W = w * 0.86, D = d * 0.86, H = 0.75;
  const body = new Mesh(new BoxGeometry(W, H, D), wallMat);
  body.position.y = H / 2;
  g.add(body);
  // Timber corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const beam = new Mesh(new BoxGeometry(0.07, H, 0.07), M.timber);
    beam.position.set(sx * W / 2, H / 2, sz * D / 2);
    g.add(beam);
  }
  const roofMesh = new Mesh(new ConeGeometry(Math.SQRT1_2, 1, 4), paint(roof, { flatShading: true }));
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.set(W * 1.18, 0.75, D * 1.18);
  roofMesh.position.y = H + 0.37;
  g.add(roofMesh);
  const chimney = new Mesh(new BoxGeometry(0.16, 0.4, 0.16), M.stone);
  chimney.position.set(W * 0.25, H + 0.45, -D * 0.15);
  g.add(chimney);
  // Door + windows on the front (+Z)
  const door = new Mesh(new BoxGeometry(0.22, 0.38, 0.03), M.door);
  door.position.set(-W * 0.15, 0.19, D / 2 + 0.01);
  g.add(door);
  for (const x of [W * 0.22]) {
    const win = new Mesh(new BoxGeometry(0.2, 0.18, 0.03), M.glass);
    win.position.set(x, 0.45, D / 2 + 0.01);
    g.add(win);
  }
  const side = new Mesh(new BoxGeometry(0.03, 0.18, 0.2), M.glass);
  side.position.set(W / 2 + 0.01, 0.45, 0);
  g.add(side);
  // Flower box
  const box = new Mesh(new BoxGeometry(0.26, 0.06, 0.08), M.wood);
  box.position.set(W * 0.22, 0.33, D / 2 + 0.05);
  g.add(box);
  for (let i = 0; i < 3; i++) {
    const f = new Mesh(new SphereGeometry(0.03, 6, 4), paint(['#ff8fb1', '#fff27a', '#b99cff'][Math.floor(rand() * 3)]));
    f.position.set(W * 0.22 - 0.08 + i * 0.08, 0.38, D / 2 + 0.05);
    g.add(f);
  }
  return castAll(g);
}

export function well() {
  const g = new Group();
  const ring = new Mesh(new CylinderGeometry(0.32, 0.34, 0.3, 16, 1, true), M.stone);
  ring.material = paint('#a39c92', { flatShading: true, side: DoubleSide });
  ring.position.y = 0.15;
  const rim = new Mesh(new TorusGeometry(0.32, 0.04, 6, 16), M.stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  const water = new Mesh(new CylinderGeometry(0.3, 0.3, 0.02, 16), M.water);
  water.position.y = 0.18;
  g.add(ring, rim, water);
  for (const s of [-1, 1]) {
    const post = new Mesh(new CylinderGeometry(0.03, 0.03, 0.6, 6), M.timber);
    post.position.set(s * 0.3, 0.45, 0);
    g.add(post);
  }
  const roof = new Mesh(new ConeGeometry(0.45, 0.25, 4), paint('#c4553a', { flatShading: true }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.85;
  const bucket = new Mesh(new CylinderGeometry(0.05, 0.04, 0.07, 8), M.wood);
  bucket.position.set(0, 0.55, 0);
  g.add(roof, bucket);
  return castAll(g);
}

/** Market stall with a striped awning. */
export function stall({ stripe = '#d6473b', goods = 'potions' } = {}) {
  const g = new Group();
  const counter = new Mesh(new BoxGeometry(0.8, 0.32, 0.4), M.wood);
  counter.position.y = 0.16;
  g.add(counter);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new Mesh(new CylinderGeometry(0.02, 0.02, 0.8, 6), M.timber);
    post.position.set(sx * 0.38, 0.4, sz * 0.18);
    g.add(post);
  }
  const stripeMat = paint(stripe, { side: DoubleSide });
  for (let i = 0; i < 6; i++) {
    const s = new Mesh(new BoxGeometry(0.15, 0.02, 0.56), i % 2 ? M.white : stripeMat);
    s.position.set(-0.375 + i * 0.15, 0.82, 0.02);
    s.rotation.x = 0.18;
    g.add(s);
  }
  const rand = seededRandom(5);
  for (let i = 0; i < 5; i++) {
    let item;
    if (goods === 'fish') {
      item = new Mesh(new SphereGeometry(0.05, 10, 6), paint(['#8fb8d8', '#d88f6a', '#c0c8d0'][i % 3]));
      item.scale.set(1.8, 0.6, 0.8);
    } else {
      item = new Mesh(new SphereGeometry(0.04, 10, 8), paint(['#ff5a7a', '#5ab0ff', '#7ce05a', '#ffcf4a'][i % 4], { emissive: '#222', roughness: 0.2 }));
    }
    item.position.set(-0.3 + i * 0.15, 0.36, (rand() - 0.5) * 0.15);
    g.add(item);
  }
  return castAll(g);
}

export function lampPost() {
  const g = new Group();
  const post = new Mesh(new CylinderGeometry(0.025, 0.035, 0.85, 8), paint('#3a3330'));
  post.position.y = 0.42;
  const lamp = new Mesh(new BoxGeometry(0.11, 0.14, 0.11), M.glass);
  lamp.position.y = 0.9;
  const cap = new Mesh(new ConeGeometry(0.1, 0.08, 4), paint('#3a3330'));
  cap.rotation.y = Math.PI / 4;
  cap.position.y = 1.01;
  g.add(post, lamp, cap);
  return castAll(g);
}

export function signpost() {
  const g = new Group();
  const post = new Mesh(new CylinderGeometry(0.035, 0.04, 0.7, 8), M.timber);
  post.position.y = 0.35;
  const board = new Mesh(new BoxGeometry(0.42, 0.13, 0.03), paint('#b98a55'));
  board.position.y = 0.58;
  const arrow = new Mesh(new ConeGeometry(0.08, 0.1, 3), paint('#b98a55'));
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(0.25, 0.58, 0);
  g.add(post, board, arrow);
  return castAll(g);
}

export function barrel() {
  const g = new Group();
  const b = new Mesh(new CylinderGeometry(0.15, 0.15, 0.36, 12), M.wood);
  b.scale.set(1, 1, 1);
  b.position.y = 0.18;
  g.add(b);
  for (const y of [0.06, 0.3]) {
    const band = new Mesh(new TorusGeometry(0.152, 0.012, 4, 16), paint('#555'));
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  }
  return castAll(g);
}

export function crates() {
  const g = new Group();
  for (const [x, y, z, s] of [[-0.12, 0.12, 0, 0.24], [0.14, 0.1, 0.06, 0.2], [0, 0.34, 0.02, 0.2]]) {
    const c = new Mesh(new BoxGeometry(s, s, s), paint('#b07b45'));
    c.position.set(x, y, z);
    c.rotation.y = x * 2;
    g.add(c);
  }
  return castAll(g);
}

/** Red-and-white lighthouse. g.userData.setLit(bool) turns the lamp + beam on. */
export function lighthouse() {
  const g = new Group();
  const base = new Mesh(new CylinderGeometry(0.42, 0.48, 0.2, 14), M.stone);
  base.position.y = 0.1;
  g.add(base);
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const r0 = 0.34 - i * 0.03, r1 = 0.34 - (i + 1) * 0.03;
    const s = new Mesh(new CylinderGeometry(r1, r0, 0.36, 16), i % 2 ? M.white : M.red);
    s.position.y = 0.2 + 0.18 + i * 0.36;
    g.add(s);
  }
  const top = 0.2 + segs * 0.36;
  const deck = new Mesh(new CylinderGeometry(0.28, 0.28, 0.05, 16), paint('#3a3330'));
  deck.position.y = top;
  const lampMat = paint('#666', { emissive: '#ffd36a', emissiveIntensity: 0 });
  const lamp = new Mesh(new CylinderGeometry(0.17, 0.17, 0.26, 12), lampMat);
  lamp.position.y = top + 0.15;
  const cap = new Mesh(new ConeGeometry(0.24, 0.24, 12), M.red);
  cap.position.y = top + 0.4;
  g.add(deck, lamp, cap);

  const beamMat = new MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  const beam = new Mesh(new ConeGeometry(0.5, 3.5, 16, 1, true), beamMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.x = 1.75;
  const pivot = new Group();
  pivot.position.y = top + 0.15;
  pivot.add(beam);
  g.add(pivot);
  castAll(g);
  beam.castShadow = false;

  let lit = false;
  g.userData.setLit = (on) => { lit = on; };
  g.userData.animate = (t) => {
    lampMat.emissiveIntensity += ((lit ? 2.5 : 0) - lampMat.emissiveIntensity) * 0.05;
    lampMat.color.set(lit ? '#fff4c0' : '#666');
    beamMat.opacity += ((lit ? 0.22 : 0) - beamMat.opacity) * 0.05;
    pivot.rotation.y = t * 0.8;
  };
  return g;
}

export function boat({ color = '#c4553a' } = {}) {
  const g = new Group();
  const hull = new Mesh(new SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paint(color));
  hull.scale.set(0.55, 0.45, 1);
  hull.position.y = 0.12;
  const rim = new Mesh(new TorusGeometry(0.4, 0.025, 6, 20), M.wood);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(0.55, 1, 1);
  rim.position.y = 0.12;
  const seat = new Mesh(new BoxGeometry(0.4, 0.03, 0.1), M.wood);
  seat.position.y = 0.08;
  const oar = new Mesh(new CylinderGeometry(0.012, 0.012, 0.6, 6), M.timber);
  oar.rotation.set(0.3, 0, 1.2);
  oar.position.set(0.15, 0.12, 0.05);
  g.add(hull, rim, seat, oar);
  castAll(g);
  const phase = Math.random() * 6;
  g.userData.animate = (t) => {
    g.position.y = g.userData.baseY + Math.sin(t * 1.5 + phase) * 0.025;
    g.rotation.z = Math.sin(t * 1.2 + phase) * 0.06;
  };
  return g;
}

/** Broken ship hull lying on the sand, with a snapped mast and tattered sail. 2×2. */
export function shipwreck() {
  const g = new Group();
  const hull = new Mesh(new CylinderGeometry(0.6, 0.6, 1.7, 14, 1, true, 0, Math.PI), paint('#6e4a2c', { side: DoubleSide }));
  // Half-cylinder → axis along Z, opening facing up (a U-shaped hull).
  hull.rotation.set(Math.PI / 2, 0, -Math.PI / 2, 'ZYX');
  hull.position.y = 0.45;
  const tilt = new Group();
  tilt.add(hull);
  tilt.rotation.set(0, 0.5, 0.35);
  g.add(tilt);
  for (let i = 0; i < 5; i++) {
    const rib = new Mesh(new TorusGeometry(0.6, 0.03, 4, 10, Math.PI), M.darkWood);
    rib.position.set(0, 0.45, -0.7 + i * 0.35);
    rib.rotation.z = Math.PI;
    tilt.add(rib);
  }
  const mast = new Mesh(new CylinderGeometry(0.04, 0.05, 1.3, 8), M.timber);
  mast.position.set(0.1, 0.8, 0.2);
  mast.rotation.set(0.2, 0, -0.5);
  g.add(mast);
  const sail = new Mesh(new BoxGeometry(0.02, 0.45, 0.5), M.sail);
  sail.position.set(0.35, 1.05, 0.25);
  sail.rotation.set(0.2, 0.2, -0.5);
  g.add(sail);
  const b = barrel();
  b.position.set(-0.6, 0, 0.6);
  b.rotation.z = Math.PI / 2;
  b.position.y = 0.15;
  g.add(b);
  return castAll(g);
}

export function palm(seed = 1) {
  const g = new Group();
  const rand = seededRandom(seed);
  const lean = (rand() - 0.5) * 0.5;
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) {
    const seg = new Mesh(new CylinderGeometry(0.05, 0.065, 0.2, 8), paint(i % 2 ? '#a07a4a' : '#8a6a3e'));
    x += lean * 0.06;
    seg.position.set(x, y + 0.1, 0);
    seg.rotation.z = -lean * 0.3;
    y += 0.19;
    g.add(seg);
  }
  for (let i = 0; i < 7; i++) {
    const leaf = new Mesh(new BoxGeometry(0.55, 0.01, 0.13), M.palmLeaf);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(x + Math.cos(a) * 0.24, y + 0.02, Math.sin(a) * 0.24);
    leaf.rotation.set(0, -a, -0.45);
    g.add(leaf);
  }
  for (let i = 0; i < 3; i++) {
    const c = new Mesh(new SphereGeometry(0.045, 8, 6), paint('#6b4a2c'));
    c.position.set(x + Math.cos(i * 2) * 0.05, y - 0.04, Math.sin(i * 2) * 0.05);
    g.add(c);
  }
  return castAll(g);
}

export function deadTree(seed = 1) {
  const g = new Group();
  const rand = seededRandom(seed);
  const mat = paint('#5a5048', { flatShading: true });
  const trunk = new Mesh(new CylinderGeometry(0.06, 0.12, 0.9, 7), mat);
  trunk.position.y = 0.45;
  trunk.rotation.z = (rand() - 0.5) * 0.2;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const br = new Mesh(new CylinderGeometry(0.02, 0.04, 0.4, 5), mat);
    const a = rand() * Math.PI * 2;
    br.position.set(Math.cos(a) * 0.12, 0.55 + i * 0.12, Math.sin(a) * 0.12);
    br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    g.add(br);
  }
  const mossBlob = new Mesh(new IcosahedronGeometry(0.1, 0), paint('#4f6a2e', { flatShading: true }));
  mossBlob.position.set(0.05, 0.8, 0);
  g.add(mossBlob);
  return castAll(g);
}

export function pine(seed = 1) {
  const g = new Group();
  const rand = seededRandom(seed);
  const s = 0.85 + rand() * 0.4;
  const trunk = new Mesh(new CylinderGeometry(0.05, 0.07, 0.3, 6), M.timber);
  trunk.position.y = 0.15;
  g.add(trunk);
  const mat = paint(rand() < 0.5 ? '#2f6a3e' : '#3a7a44', { flatShading: true });
  for (let i = 0; i < 3; i++) {
    const c = new Mesh(new ConeGeometry(0.36 - i * 0.09, 0.42, 7), mat);
    c.position.y = 0.42 + i * 0.25;
    g.add(c);
  }
  g.scale.setScalar(s);
  return castAll(g);
}

/** Cluster of glowing mushrooms (walkable decoration). */
export function glowShrooms(seed = 1) {
  const g = new Group();
  const rand = seededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const col = ['#5ff0e0', '#b47cff', '#7cff9a'][Math.floor(rand() * 3)];
    const m = new Group();
    const stem = new Mesh(new CylinderGeometry(0.015, 0.022, 0.07, 6), paint('#efe3c8'));
    stem.position.y = 0.035;
    const cap = new Mesh(new SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), paint(col, { emissive: col, emissiveIntensity: 0.9 }));
    cap.position.y = 0.065;
    m.add(stem, cap);
    m.position.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6);
    m.scale.setScalar(0.8 + rand() * 1.2);
    g.add(m);
  }
  return castAll(g);
}

/** Wooden arch over an exit. */
export function gateArch() {
  const g = new Group();
  for (const s of [-1, 1]) {
    const post = new Mesh(new CylinderGeometry(0.05, 0.06, 1.0, 8), M.timber);
    post.position.set(s * 0.95, 0.5, 0);
    g.add(post);
  }
  const beam = new Mesh(new BoxGeometry(2.1, 0.09, 0.1), M.timber);
  beam.position.y = 1.0;
  g.add(beam);
  const vine = new Mesh(new CapsuleGeometry(0.05, 1.6, 4, 8), M.leaf);
  vine.rotation.z = Math.PI / 2;
  vine.position.y = 1.05;
  g.add(vine);
  return castAll(g);
}

export const PROP_BUILDERS = {
  house: (p) => house(p),
  well: () => well(),
  stall: (p) => stall(p),
  lamp: () => lampPost(),
  sign: () => signpost(),
  barrel: () => barrel(),
  crates: () => crates(),
  lighthouse: () => lighthouse(),
  boat: (p) => boat(p),
  wreck: () => shipwreck(),
  arch: () => gateArch(),
  shrooms: (p) => glowShrooms(p.seed),
};
