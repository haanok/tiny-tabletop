import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { createBase } from './base.js';
import { paint, metal, castAll } from './materials.js';
import { buildChibi, chibiMaterials } from './chibi.js';
import { tween, flash, materialsOf } from '../core/anim.js';

export const DEFAULT_PALETTE = {
  skin: '#ffd3b4',
  hair: '#8a4b2a',
  tunic: '#3f7fd4',
  cape: '#d6473b',
  metal: '#cdd3db',
  accent: '#e8b63d',
  leather: '#6e4228',
  boots: '#4a2f20',
};

const HOP_TIME = 0.28;
const HOP_HEIGHT = 0.28;

export function starShape(outer, inner, points = 5) {
  const s = new Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}

/**
 * Generic chibi hero miniature. Faces +Z.
 * Movement is cell based: hero.cell is the cell it stands on (or is hopping to).
 */
export function createHero({ palette = DEFAULT_PALETTE } = {}) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const mats = { ...chibiMaterials(pal), cape: paint(pal.cape, { side: DoubleSide }) };
  const swordMat = metal(pal.metal);

  const root = new Group();
  root.name = 'hero';
  root.add(createBase({ seed: 11 }));

  const { figure, head, right, left, R } = buildChibi(mats);
  root.add(figure);

  // Cape
  const cape = new Mesh(new CylinderGeometry(0.1, 0.19, 0.34, 20, 1, true, Math.PI - 1.25, 2.5), mats.cape);
  cape.position.set(0, 0.28, -0.015);
  cape.rotation.x = -0.12;
  figure.add(cape);
  for (const side of [-1, 1]) {
    const clasp = new Mesh(new SphereGeometry(0.022, 10, 8), mats.accent);
    clasp.position.set(side * 0.085, 0.42, 0.07);
    figure.add(clasp);
  }

  // Cowlick
  const cowlick = new Mesh(new CylinderGeometry(0, 0.025, 0.09, 6), mats.hair);
  cowlick.position.set(0.02, R * 1.05, -0.02);
  cowlick.rotation.set(-0.5, 0, -0.3);
  head.add(cowlick);

  // Armour (hidden until bought)
  const armour = new Group();
  const plate = new Mesh(new CapsuleGeometry(0.128, 0.06, 6, 16, ), mats.metal);
  plate.scale.set(1, 1, 0.9);
  plate.position.y = 0.33;
  armour.add(plate);
  for (const side of [-1, 1]) {
    const pauldron = new Mesh(new SphereGeometry(0.065, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.metal);
    pauldron.position.set(side * 0.15, 0.39, 0);
    pauldron.rotation.z = side * -0.4;
    armour.add(pauldron);
  }
  armour.visible = false;
  figure.add(armour);

  right.arm.rotation.set(-0.7, 0, -0.3);
  left.arm.rotation.set(-0.35, 0, 0.4);

  // Sword
  const sword = new Group();
  const bladeGroup = new Group();
  const blade = new Mesh(new BoxGeometry(0.034, 0.36, 0.012), swordMat);
  blade.position.y = 0.23;
  const tip = new Mesh(new CylinderGeometry(0, 0.024, 0.05, 4), swordMat);
  tip.rotation.y = Math.PI / 4;
  tip.scale.z = 0.35;
  tip.position.y = 0.435;
  bladeGroup.add(blade, tip);
  const guard = new Mesh(new BoxGeometry(0.12, 0.022, 0.03), mats.accent);
  guard.position.y = 0.05;
  const grip = new Mesh(new CylinderGeometry(0.014, 0.014, 0.08, 8), mats.leather);
  const pommel = new Mesh(new SphereGeometry(0.022, 10, 8), mats.accent);
  pommel.position.y = -0.05;
  sword.add(bladeGroup, guard, grip, pommel);
  sword.rotation.set(1.0, 0, 0.3);
  right.hand.add(sword);

  // Shield
  const shield = new Group();
  const face = new Mesh(new CylinderGeometry(0.15, 0.15, 0.03, 28), mats.tunic);
  face.rotation.x = Math.PI / 2;
  const rim = new Mesh(new TorusGeometry(0.15, 0.016, 8, 32), mats.metal);
  const boss = new Mesh(new SphereGeometry(0.035, 12, 8), mats.metal);
  boss.scale.z = 0.6;
  boss.position.z = 0.02;
  const star = new Mesh(new ExtrudeGeometry(starShape(0.09, 0.04), { depth: 0.008, bevelEnabled: false }), mats.accent);
  star.position.z = 0.015;
  shield.add(face, rim, star, boss);
  shield.position.set(0.05, -0.02, 0.06);
  shield.rotation.set(0.35, 0.75, -0.4);
  left.hand.add(shield);

  castAll(root);
  const allMats = materialsOf(root);

  // ---------------- Movement & animation ----------------
  const cell = { gx: 0, gz: 0 };
  const queue = [];
  let hop = null;
  let onArrive = null;
  let landSquash = 0;
  let targetYaw = 0;
  let time = 0;
  let lunge = 0;
  let swing = 0;
  let shake = 0;

  function setPalette(p) {
    Object.assign(pal, p);
    for (const key of Object.keys(DEFAULT_PALETTE)) mats[key].color.set(pal[key]);
    swordMat.color.set(pal.metal);
  }

  /** Visual upgrades: swordLevel 0..2, armour boolean. */
  function setGear({ swordLevel = 0, armour: hasArmour = false }) {
    armour.visible = hasArmour;
    bladeGroup.scale.set(1 + swordLevel * 0.15, 1 + swordLevel * 0.18, 1);
    swordMat.emissive.set(swordLevel >= 2 ? '#5fb8ff' : swordLevel === 1 ? '#ffffff' : '#000000');
    swordMat.emissiveIntensity = swordLevel >= 2 ? 0.55 : swordLevel === 1 ? 0.12 : 0;
  }

  function place(c, pos) {
    queue.length = 0;
    hop = null;
    onArrive = null;
    cell.gx = c.gx;
    cell.gz = c.gz;
    root.position.copy(pos);
  }

  /** steps: [{ gx, gz, pos }] (excluding the current cell). Replaces any pending path. */
  function moveAlong(steps, arrive) {
    queue.length = 0;
    queue.push(...steps);
    onArrive = arrive ?? null;
    if (!steps.length && !hop) finishArrive();
  }

  function finishArrive() {
    const cb = onArrive;
    onArrive = null;
    cb?.();
  }

  function faceTowards(pos) {
    targetYaw = Math.atan2(pos.x - root.position.x, pos.z - root.position.z);
  }

  const api = {
    object: root,
    palette: pal,
    cell,
    onStep: null,
    setPalette,
    setGear,
    place,
    moveAlong,
    faceTowards,
    stop() { queue.length = 0; onArrive = null; },
    get isMoving() { return !!hop || queue.length > 0; },

    async attack() {
      await tween(0.4, (t) => { lunge = Math.sin(t * Math.PI) * 0.28; swing = Math.sin(t * Math.PI) * 1.6; });
      lunge = swing = 0;
    },
    async hit() {
      flash(allMats);
      await tween(0.4, (t) => { shake = (1 - t) * Math.sin(t * 40) * 0.05; });
      shake = 0;
    },
    async bump(dir) {
      targetYaw = Math.atan2(dir.x, dir.z);
      await tween(0.18, (t) => { lunge = Math.sin(t * Math.PI) * 0.12; });
      lunge = 0;
    },

    update(dt) {
      time += dt;
      if (!hop && queue.length) {
        const step = queue.shift();
        const from = root.position.clone();
        targetYaw = Math.atan2(step.pos.x - from.x, step.pos.z - from.z);
        cell.gx = step.gx;
        cell.gz = step.gz;
        hop = { from, to: step.pos.clone(), t: 0 };
      }
      if (hop) {
        hop.t = Math.min(1, hop.t + dt / HOP_TIME);
        const p = hop.t;
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        root.position.lerpVectors(hop.from, hop.to, e);
        root.position.y += Math.sin(Math.PI * p) * HOP_HEIGHT;
        if (hop.t >= 1) {
          hop = null;
          landSquash = 1;
          api.onStep?.(cell);
          if (!queue.length) finishArrive();
        }
      }

      let dy = targetYaw - root.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      root.rotation.y += dy * Math.min(1, dt * 14);

      landSquash = Math.max(0, landSquash - dt * 6);
      const squash = Math.sin(landSquash * Math.PI) * 0.12;
      const breathe = Math.sin(time * 2.4) * 0.015;
      figure.scale.set(1 + squash * 0.6, 1 - squash + breathe, 1 + squash * 0.6);
      figure.position.z = lunge;
      figure.position.x = shake;
      figure.rotation.z = Math.sin(time * 1.3) * 0.03;
      head.rotation.z = Math.sin(time * 1.1 + 1) * 0.06;
      head.rotation.x = hop ? -0.15 : Math.sin(time * 0.9) * 0.03;
      right.arm.rotation.x = -0.7 + Math.sin(time * 2.4) * 0.04 + (hop ? -0.25 : 0) - swing;
    },
  };
  return api;
}
