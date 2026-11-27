import './style.css';
import {
  ACESFilmicToneMapping,
  Clock,
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
import { createWorld, heightAt, key, BOSS_CELL } from './world/world.js';
import { findPath } from './world/pathfind.js';
import { createPostFX } from './post/tiltShift.js';
import { createHero } from './minis/hero.js';
import { createMerchant, createGuard, createSignpost } from './minis/npcs.js';
import { createBoss, createLairDecor } from './minis/boss.js';
import { createDice } from './fx/dice.js';
import { updateTweens } from './core/anim.js';
import { createLabels } from './ui/labels.js';
import { createHUD } from './ui/hud.js';
import { createDialog } from './ui/dialog.js';
import { createDebugUI } from './ui/debug.js';
import { createState, swordLevel } from './game/state.js';
import { createTalk } from './game/talk.js';
import { createFight } from './game/fight.js';

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
scene.fog = new Fog(scene.background, 20, 40);
const { camera, controls } = createCamera(renderer.domElement);
const fx = createPostFX(renderer, scene, camera);

const world = createWorld(scene);
const labels = createLabels(camera);
const dice = createDice(scene, labels);
const dialog = createDialog();
const state = createState();

// ---------------- Characters ----------------
const START = { gx: 0, gz: 1 };
const hero = createHero();
hero.place(START, world.worldPos(START.gx, START.gz));
scene.add(hero.object);

const merchant = createMerchant();
const guard = createGuard();
const boss = createBoss();

function placeProp(obj, cell, occupant, yaw = 0) {
  obj.position.copy(world.worldPos(cell.gx, cell.gz));
  obj.rotation.y = yaw;
  scene.add(obj);
  world.occupied.set(key(cell.gx, cell.gz), occupant);
}
placeProp(merchant.object, { gx: -2, gz: 0 }, { kind: 'merchant', npc: merchant }, 0.6);
placeProp(guard.object, { gx: 2, gz: -3 }, { kind: 'guard', npc: guard }, 0.3);
placeProp(boss.object, BOSS_CELL, { kind: 'boss', npc: boss }, 0);
placeProp(createSignpost(), { gx: 1, gz: -4 }, { kind: 'prop' });
scene.add(createLairDecor(BOSS_CELL, heightAt));

const markers = {
  guard: labels.attach(guard.object, { y: 1.2, className: 'marker quest', html: '!' }),
  merchant: labels.attach(merchant.object, { y: 1.3, className: 'marker shop', html: '<i class="coin"></i>' }),
  boss: labels.attach(boss.object, { y: 1.95, className: 'marker boss', html: '☠' }),
};
const nameTags = new Map(
  [[merchant, 0.95], [guard, 1.0], [boss, 1.6]].map(([npc, y]) => {
    const tag = labels.attach(npc.object, { y, className: 'nametag', html: npc.name });
    tag.show(false);
    return [npc, tag];
  }),
);

// ---------------- Game glue ----------------
let locked = false;
const v3 = new Vector3();
const popupHero = (text, cls) => labels.popup(v3.copy(hero.object.position).setY(hero.object.position.y + 1.05), text, cls);
const popupBoss = (text, cls) => labels.popup(v3.copy(boss.object.position).setY(boss.object.position.y + 1.7), text, cls);

const hud = createHUD({
  onDrink() {
    if (state.potions <= 0 || state.hp >= state.maxHp) return;
    state.potions -= 1;
    state.hp = Math.min(state.maxHp, state.hp + 2);
    popupHero('+2 ♥', 'heal');
    changed();
  },
});

function changed() {
  hud.render(state);
  hero.setGear({ swordLevel: swordLevel(state), armour: state.armour });
  const q = state.quest;
  markers.guard.show(q === 'none' || q === 'bossDefeated');
  markers.guard.set(q === 'bossDefeated' ? '?' : '!');
  markers.boss.show(q === 'none' || q === 'accepted');
}

const ctx = {
  state,
  dialog,
  hero,
  boss,
  dice,
  changed,
  popupHero,
  popupBoss,
  lock: (v) => { locked = v; },
  groundY: (p) => heightAt(Math.round(p.x), Math.round(p.z)),
  respawn: () => hero.place(START, world.worldPos(START.gx, START.gz)),
  onBossDefeated: () => world.occupied.delete(key(BOSS_CELL.gx, BOSS_CELL.gz)),
};
const talk = createTalk(ctx);
const fight = createFight(ctx);

function interact(occ) {
  hero.faceTowards(occ.npc.object.position);
  occ.npc.faceTowards(hero.object.position);
  if (occ.kind === 'merchant') talk.merchant();
  else if (occ.kind === 'guard') talk.guard();
  else if (occ.kind === 'boss') fight.start();
}

hero.onStep = (cell) => {
  const coin = world.collectCoin(cell.gx, cell.gz);
  if (coin) {
    state.gold += coin;
    popupHero(`+${coin}g`, 'gold');
    changed();
  }
};

const adjacent = (a, b) => Math.abs(a.gx - b.gx) + Math.abs(a.gz - b.gz) === 1;
const toSteps = (cells) => cells.map((c) => ({ ...c, pos: world.worldPos(c.gx, c.gz) }));

/** Click-to-move: path to a tile, or next to a character and talk. */
function goTo(gx, gz) {
  if (locked) return;
  const target = { gx, gz };
  const occ = world.occupantAt(gx, gz);
  if (occ?.npc) {
    if (adjacent(hero.cell, target) && !hero.isMoving) return interact(occ);
    const path = findPath(hero.cell, target, (x, z) => adjacent({ gx: x, gz: z }, target), world.isBlocked);
    if (!path) return;
    dialog.hide();
    hero.moveAlong(toSteps(path), () => interact(occ));
    return;
  }
  if (world.isBlocked(gx, gz)) return;
  const path = findPath(hero.cell, target, (x, z) => x === gx && z === gz, world.isBlocked);
  if (!path) return;
  dialog.hide();
  hero.moveAlong(toSteps(path));
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
const npcObjects = [merchant.object, guard.object, boss.object];
let hoveredTag = null;
let downAt = null;

function pickCell(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(npcObjects.filter((o) => o.visible), true)[0];
  if (hit) {
    let o = hit.object;
    while (o.parent && !npcObjects.includes(o)) o = o.parent;
    return { gx: Math.round(o.position.x), gz: Math.round(o.position.z) };
  }
  const p = raycaster.ray.intersectPlane(ground, v3);
  return p ? { gx: Math.round(p.x), gz: Math.round(p.z) } : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  const c = pickCell(e);
  hoveredTag?.show(false);
  hoveredTag = null;
  if (!c) { hoverRing.visible = false; return; }
  const occ = world.occupantAt(c.gx, c.gz);
  const blocked = world.isBlocked(c.gx, c.gz);
  hoverRing.visible = !blocked || !!occ?.npc;
  hoverRing.material.color.set(occ?.npc ? (occ.kind === 'boss' ? '#ff6a5a' : '#7fe0ff') : '#ffd76a');
  hoverRing.position.set(c.gx, heightAt(c.gx, c.gz) + 0.006, c.gz);
  if (occ?.npc) {
    hoveredTag = nameTags.get(occ.npc);
    hoveredTag?.show(true);
  }
  renderer.domElement.style.cursor = occ?.npc ? 'pointer' : blocked ? 'not-allowed' : 'pointer';
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
  const occ = world.occupantAt(t.gx, t.gz);
  if (occ?.npc) {
    held.clear();
    interact(occ);
  } else if (world.isBlocked(t.gx, t.gz)) {
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
changed();
dialog.show({
  name: 'Welcome to Thimblecross',
  color: '#c8962a',
  text: 'Click a tile or use <b>WASD</b> to hop around. Click a character to talk.<br>' +
    'The guard with the <b>!</b> has work for you, and Pip the Peddler sells upgrades for gold. ' +
    'Pick up coins as you explore!',
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
  merchant.update(dt);
  guard.update(dt);
  boss.update(dt);
  dice.update(dt);
  world.update(hero.cell);
  world.animate(dt);

  // Camera + shadow light follow the hero.
  follow.copy(hero.object.position).setY(0).sub(controls.target).multiplyScalar(Math.min(1, dt * 4));
  controls.target.add(follow);
  camera.position.add(follow);
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
