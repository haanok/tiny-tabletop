import './style.css';
import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  Fog,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  Plane,
  Raycaster,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { createCamera } from './scene/camera.js';
import { addLighting } from './scene/lighting.js';
import { createTable } from './scene/table.js';
import { buildBoard } from './world/board.js';
import { BOARDS } from './world/boards.js';
import { findPath } from './world/pathfind.js';
import { createPostFX } from './post/tiltShift.js';
import { createHero } from './minis/hero.js';
import { createMerchant, createGuard, createFishmonger, createKeeper } from './minis/npcs.js';
import { createBoss } from './minis/boss.js';
import { createCrab } from './minis/crab.js';
import { createDice } from './fx/dice.js';
import { createWaypoint } from './fx/waypoint.js';
import { updateTweens, tween, ease } from './core/anim.js';
import { createLabels } from './ui/labels.js';
import { createHUD } from './ui/hud.js';
import { createDialog } from './ui/dialog.js';
import { createBanner } from './ui/banner.js';
import { createDebugUI } from './ui/debug.js';
import { createState, swordLevel, maxHp } from './game/state.js';
import { objective, routeHint, autoTrack } from './game/quests.js';
import { createTalk } from './game/talk.js';
import { createEncounters, ENEMIES } from './game/encounter.js';

// ---------------- Renderer / scene ----------------
const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new Scene();
const lights = addLighting(scene);
scene.background = new Color('#2b1e15');
scene.fog = new Fog('#2b1e15', 24, 48);
const { camera, controls } = createCamera(renderer.domElement);
const fx = createPostFX(renderer, scene, camera);
const table = createTable(scene);

const labels = createLabels(camera);
const dice = createDice(scene, labels);
const dialog = createDialog();
const banner = createBanner();
const waypoint = createWaypoint(scene);
const state = createState();

// ---------------- Characters & boards ----------------
const NPC_FACTORY = {
  pip: createMerchant,
  bramble: createGuard,
  bess: createFishmonger,
  marla: createKeeper,
  troll: createBoss,
  crab: createCrab,
};
// Heights for the floating marker above each character.
const NPC_TOP = { pip: 1.3, bramble: 1.2, bess: 1.15, marla: 1.25, troll: 1.95, crab: 1.45 };
const ARROWS = { north: '↑', south: '↓', east: '→', west: '←' };

const boards = new Map();
const markers = new Map(); // npcId -> label
const nameTags = new Map(); // npc -> label

function getBoard(id) {
  if (boards.has(id)) return boards.get(id);
  const b = buildBoard(id, NPC_FACTORY, state.collected);
  b.group.visible = false;
  scene.add(b.group);
  boards.set(id, b);

  for (const [npcId, npc] of b.npcs) {
    markers.set(npcId, labels.attach(npc.object, { y: NPC_TOP[npcId], className: 'marker' }));
    const tag = labels.attach(npc.object, { y: NPC_TOP[npcId] - 0.3, className: 'nametag', html: npc.name });
    tag.show(false);
    nameTags.set(npc, tag);
    const es = state.enemies[npcId];
    if (es?.defeated) {
      npc.object.visible = false;
      b.occupied.delete(`${npc.cell.gx},${npc.cell.gz}`);
    }
  }
  const crab = b.npcs.get('crab');
  if (crab) {
    crab.setAsleep(true);
    crab.setLens(state.quests.lens === 'none' || state.quests.lens === 'active');
  }
  for (const ex of b.exits) {
    labels.attach(ex.anchor, { y: 0, className: 'exit-label', html: `${ARROWS[ex.side]} ${BOARDS[ex.to].name}` });
  }
  return b;
}

let board = getBoard(state.board);
board.group.visible = true;

const hero = createHero();
const start = BOARDS[state.board].start;
hero.place({ gx: start[0], gz: start[1] }, board.worldPos(start[0], start[1]));
scene.add(hero.object);
controls.target.copy(hero.object.position).setY(0);

// ---------------- Game glue ----------------
let locked = false;
let transitioning = false;
let guidance = '';
const v3 = new Vector3();

const popupAt = (obj, y, text, cls) => labels.popup(obj.getWorldPosition(new Vector3()).add({ x: 0, y, z: 0 }), text, cls);
const popupHero = (text, cls) => popupAt(hero.object, 1.05, text, cls);
const popupNpc = (npc, text, cls) => popupAt(npc.object, NPC_TOP[npc.id] - 0.2, text, cls);

const hud = createHUD({
  onDrink() {
    if (state.potions <= 0 || state.hp >= maxHp(state)) return;
    state.potions -= 1;
    state.hp = Math.min(maxHp(state), state.hp + 2);
    popupHero('+2 ♥', 'heal');
    changed();
  },
  onTrack(id) {
    state.tracked = state.tracked === id ? null : id;
    changed();
  },
});

function refreshMarkers() {
  const q = state.quests;
  const set = (id, html, cls) => {
    const m = markers.get(id);
    if (!m) return;
    m.show(!!html);
    if (html) {
      m.set(html);
      m.el.className = `label marker ${cls}`;
    }
  };
  const giver = (stage) => (stage === 'none' ? ['!', 'quest'] : stage === 'ready' ? ['?', 'quest'] : [null]);
  set('pip', '<i class="coin"></i>', 'shop');
  set('bess', '<i class="coin"></i>', 'shop');
  set('bramble', ...giver(q.troll));
  set('marla', ...giver(q.lens));
  const t = state.enemies.troll;
  set('troll', !t.defeated && q.troll !== 'complete' ? '☠' : null, 'boss');
  const c = state.enemies.crab;
  if (c.sneaked && !c.defeated) set('crab', 'Zzz', 'sleep');
  else set('crab', !c.defeated && q.lens !== 'ready' && q.lens !== 'complete' ? '☠' : null, 'boss');
}

function changed() {
  autoTrack(state);
  hero.setGear({ swordLevel: swordLevel(state), armour: state.gear.tinPlate || state.gear.coralMail, boots: state.gear.boots });
  boards.get('gullhaven')?.props.lighthouse?.userData.setLit(state.quests.lens === 'complete');
  refreshMarkers();
  updateWaypoint(true);
  hud.render(state, { boardName: board.def.name, guidance });
}

const ctx = {
  state,
  dialog,
  hero,
  dice,
  changed,
  popupHero,
  popupNpc,
  lock: (v) => { locked = v; },
  enemy: (id) => board.npcs.get(id),
  groundY: (p) => board.worldPos(...Object.values(board.cellFromWorld(p))).y,
  onEnemyDefeated(id) {
    for (const b of boards.values()) {
      const npc = b.npcs.get(id);
      if (npc) b.occupied.delete(`${npc.cell.gx},${npc.cell.gz}`);
    }
  },
  async respawn(boardId, cell) {
    if (boardId === board.id) {
      hero.place(cell, board.worldPos(cell.gx, cell.gz));
      return;
    }
    await switchBoard(getBoard(boardId), cell, new Vector3(0, 0, -1));
  },
};
const talk = createTalk(ctx);
const encounters = createEncounters(ctx);

function interact(occ) {
  hero.faceTowards(occ.npc.object.getWorldPosition(v3));
  occ.npc.faceTowards(hero.object.position.clone().sub(board.group.position));
  if (ENEMIES[occ.id]) encounters.start(occ.id);
  else talk.open(occ.id);
}

// ---------------- Movement ----------------
const adjacent = (a, b) => Math.abs(a.gx - b.gx) + Math.abs(a.gz - b.gz) === 1;
const toSteps = (cells) => cells.map((c) => ({ ...c, pos: board.worldPos(c.gx, c.gz) }));
/** Exit tiles only count as walkable when they are the destination. */
const blockedFor = (goal) => (x, z) =>
  board.isBlocked(x, z) || (!!board.exitAt(x, z) && !(goal && goal.gx === x && goal.gz === z));

function goTo(gx, gz) {
  if (locked) return;
  const target = { gx, gz };
  const occ = board.occupantAt(gx, gz);
  if (occ?.npc) {
    if (adjacent(hero.cell, target) && !hero.isMoving) return interact(occ);
    const path = findPath(hero.cell, target, (x, z) => adjacent({ gx: x, gz: z }, target), blockedFor(null));
    if (!path) return;
    dialog.hide();
    hero.moveAlong(toSteps(path), () => interact(occ));
    return;
  }
  if (board.isBlocked(gx, gz)) return;
  const path = findPath(hero.cell, target, (x, z) => x === gx && z === gz, blockedFor(target));
  if (!path) return;
  dialog.hide();
  hero.moveAlong(toSteps(path));
}

hero.onStep = (cell) => {
  const coin = board.collectCoin(cell.gx, cell.gz);
  if (coin) {
    state.gold += coin;
    popupHero(`+${coin}g`, 'gold');
    changed();
  }
  const exit = board.exitAt(cell.gx, cell.gz);
  if (exit && !transitioning) {
    hero.stop();
    travel(exit, cell);
  }
};

// ---------------- Board switching ----------------
async function travel(exit, fromCell) {
  const to = getBoard(exit.to);
  const back = to.exits.find((e) => e.to === board.id);
  const idx = Math.max(0, exit.cells.findIndex(([x, z]) => x === fromCell.gx && z === fromCell.gz));
  const [ax, az] = back.cells[Math.min(idx, back.cells.length - 1)];
  const arrival = { gx: ax - back.dir.x, gz: az - back.dir.z }; // one step inward
  await switchBoard(to, arrival, exit.dir);
}

/**
 * Lift the hero, slide the old board away and the new one in underneath,
 * then set the hero down on `arrival`.
 */
async function switchBoard(to, arrival, dir) {
  transitioning = true;
  locked = true;
  dialog.hide();
  hoverRing.visible = false;
  waypoint.hide();
  const from = board;
  const P = hero.object.position.clone();
  const local = to.localPos(arrival.gx, arrival.gz);
  const finalOff = new Vector3(P.x - local.x, 0, P.z - local.z);
  const span = Math.max(to.W, to.H, from.W, from.H) + 10;
  const startOff = finalOff.clone().addScaledVector(dir, span);
  to.group.position.copy(startOff);
  to.group.visible = true;
  banner.show(to.def.name, to.def.subtitle);

  const fromStart = from.group.position.clone();
  const lift = 1.0;
  await tween(0.3, (t) => { hero.object.position.y = P.y + t * lift; }, ease.outCubic);
  await tween(1.2, (t) => {
    from.group.position.copy(fromStart).addScaledVector(dir, -span * t);
    to.group.position.lerpVectors(startOff, finalOff, t);
  }, ease.inOut);
  from.group.visible = false;

  board = to;
  state.board = to.id;
  const ground = to.worldPos(arrival.gx, arrival.gz);
  hero.place(arrival, ground.clone().setY(ground.y + lift));
  await tween(0.28, (t) => { hero.object.position.y = ground.y + (1 - t * t) * lift; });
  hero.object.position.y = ground.y;
  hero.land();
  table.recenter(finalOff.x + to.W / 2, finalOff.z + to.H / 2);

  transitioning = false;
  locked = false;
  changed();
}

// ---------------- Waypoint ----------------
let wpKey = '';
function updateWaypoint(force = false) {
  if (transitioning) return;
  const obj = objective(state);
  const k = `${board.id}|${hero.cell.gx},${hero.cell.gz}|${state.tracked}|${obj?.board}|${obj?.npc}`;
  if (!force && k === wpKey) return;
  wpKey = k;
  const prevGuidance = guidance;
  guidance = '';
  if (!obj) {
    waypoint.hide();
  } else if (obj.board === board.id) {
    const npc = board.npcs.get(obj.npc);
    const goal = npc.cell;
    const path = findPath(hero.cell, goal, (x, z) => adjacent({ gx: x, gz: z }, goal), blockedFor(null)) ?? [];
    const pts = [hero.cell, ...path].map((c) => board.worldPos(c.gx, c.gz));
    waypoint.set(pts, board.worldPos(goal.gx, goal.gz), NPC_TOP[obj.npc] + 0.55);
    guidance = `Find ${npc.name} here`;
  } else {
    const hint = routeHint(board.id, obj);
    if (hint) {
      const exit = board.exits.find((e) => e.to === hint.next);
      const cells = exit.cells.map(([gx, gz]) => ({ gx, gz }));
      cells.sort((a, b) => (Math.abs(a.gx - hero.cell.gx) + Math.abs(a.gz - hero.cell.gz)) - (Math.abs(b.gx - hero.cell.gx) + Math.abs(b.gz - hero.cell.gz)));
      const goal = cells[0];
      const path = findPath(hero.cell, goal, (x, z) => x === goal.gx && z === goal.gz, blockedFor(goal)) ?? [];
      const pts = [hero.cell, ...path].map((c) => board.worldPos(c.gx, c.gz));
      waypoint.set(pts, board.worldPos(goal.gx, goal.gz), 1.2);
      guidance = `Take the ${exit.side} road to ${hint.nextName}${hint.next !== obj.board ? `, then on to ${hint.finalName}` : ''}`;
    }
  }
  if (guidance !== prevGuidance && !force) hud.render(state, { boardName: board.def.name, guidance });
}

// ---------------- Pointer ----------------
const hoverRing = new Mesh(
  new RingGeometry(0.36, 0.44, 40),
  new MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.85, depthWrite: false }),
);
hoverRing.rotation.x = -Math.PI / 2;
hoverRing.visible = false;
scene.add(hoverRing);

const raycaster = new Raycaster();
const pointer = new Vector2();
const ground = new Plane(new Vector3(0, 1, 0), 0);
let hoveredTag = null;
let downAt = null;

function pickCell(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const npcObjects = [...board.npcs.values()].map((n) => n.object).filter((o) => o.visible);
  const hit = raycaster.intersectObjects(npcObjects, true)[0];
  if (hit) {
    let o = hit.object;
    while (o.parent && !npcObjects.includes(o)) o = o.parent;
    const npc = [...board.npcs.values()].find((n) => n.object === o);
    if (npc) return { ...npc.cell };
  }
  const p = raycaster.ray.intersectPlane(ground, v3);
  return p ? board.cellFromWorld(p) : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  hoveredTag?.show(false);
  hoveredTag = null;
  if (transitioning) return;
  const c = pickCell(e);
  if (!c || !board.cellAt(c.gx, c.gz)) { hoverRing.visible = false; return; }
  const occ = board.occupantAt(c.gx, c.gz);
  const exit = board.exitAt(c.gx, c.gz);
  const blocked = board.isBlocked(c.gx, c.gz);
  hoverRing.visible = !blocked || !!occ?.npc;
  hoverRing.material.color.set(occ?.npc ? (ENEMIES[occ.id] ? '#ff6a5a' : '#7fe0ff') : exit ? '#ffffff' : '#ffd76a');
  board.worldPos(c.gx, c.gz, hoverRing.position).y += 0.006;
  if (occ?.npc) {
    hoveredTag = nameTags.get(occ.npc);
    hoveredTag?.show(true);
  }
  renderer.domElement.style.cursor = blocked && !occ?.npc ? 'not-allowed' : 'pointer';
});
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
  const c = pickCell(e);
  if (c) goTo(c.gx, c.gz);
});

// ---------------- Keyboard (camera-relative WASD / arrows) ----------------
const held = new Set();
const KEYMAP = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.key.toLowerCase()];
  if (k) { held.add(k); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => held.delete(KEYMAP[e.key.toLowerCase()]));
window.addEventListener('blur', () => held.clear());

let bumpCooldown = 0;
function keyboardStep(dt) {
  bumpCooldown -= dt;
  if (locked || hero.isMoving || !held.size) return;
  const f = v3.subVectors(controls.target, camera.position);
  const fwd = Math.abs(f.x) > Math.abs(f.z) ? { x: Math.sign(f.x), z: 0 } : { x: 0, z: Math.sign(f.z) };
  const right = { x: -fwd.z, z: fwd.x };
  const dir = held.has('f') ? fwd : held.has('b') ? { x: -fwd.x, z: -fwd.z }
    : held.has('r') ? right : { x: -right.x, z: -right.z };
  const t = { gx: hero.cell.gx + dir.x, gz: hero.cell.gz + dir.z };
  const occ = board.occupantAt(t.gx, t.gz);
  if (occ?.npc) {
    held.clear();
    interact(occ);
  } else if (board.isBlocked(t.gx, t.gz)) {
    if (bumpCooldown <= 0) { hero.bump(dir); bumpCooldown = 0.3; }
  } else {
    dialog.hide();
    hero.moveAlong(toSteps([t]));
  }
}

// ---------------- Resize ----------------
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  fx.setSize(w, h);
});

// ---------------- Start ----------------
createDebugUI({ fx, hero });
table.recenter(board.W / 2, board.H / 2);
changed();
banner.show(board.def.name, board.def.subtitle);
dialog.show({
  name: 'Welcome, adventurer',
  color: '#c8962a',
  text: 'Click a tile or use <b>WASD</b> to hop around, and click a character to talk. ' +
    'Glowing arrows at the board\'s edge lead to <b>new boards</b>.<br>' +
    'Look for a <b>!</b> to find quests. Once you accept one, a <b>golden trail</b> guides you.',
  choices: [{ label: "Let's go!", onSelect: () => dialog.hide() }],
});

const clock = new Clock();
const focusPoint = new Vector3();
const follow = new Vector3();
const keyOffset = lights.key.position.clone();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateTweens(dt);
  keyboardStep(dt);
  hero.update(dt);
  for (const b of boards.values()) {
    if (!b.group.visible) continue;
    b.animate(dt);
    for (const npc of b.npcs.values()) npc.update(dt);
  }
  dice.update(dt);
  updateWaypoint();
  waypoint.update(dt);

  // Camera + shadow light follow the hero (but hold still while boards swap).
  if (!transitioning) {
    follow.copy(hero.object.position).setY(0).sub(controls.target).multiplyScalar(Math.min(1, dt * 4));
    controls.target.add(follow);
    camera.position.add(follow);
  }
  controls.update();
  lights.key.position.copy(controls.target).add(keyOffset);
  lights.key.target.position.copy(controls.target);

  if (fx.params.autoFocus) {
    focusPoint.copy(hero.object.position).setY(hero.object.position.y + 0.45).project(camera);
    const target = (focusPoint.y + 1) / 2;
    fx.params.focusY += (target - fx.params.focusY) * Math.min(1, dt * 6);
  }

  labels.update();
  fx.render(dt);
});
