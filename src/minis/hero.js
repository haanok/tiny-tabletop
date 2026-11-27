import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
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
  skin: '#e9c2a6',
  hair: '#2a2420',
  tunic: '#2b2e35',
  cape: '#6b1717',
  metal: '#848b95',
  accent: '#b08a46',
  leather: '#3a2618',
  boots: '#1f1d1c',
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

  const { figure, head, right, left, R } = buildChibi(mats, { hair: false });
  root.add(figure);
  const darkSteel = metal('#4a4f57');
  const slitMat = paint('#050505', { roughness: 1 });
  const emberMat = paint('#ffb347', { emissive: '#ff8a1f', emissiveIntensity: 3.2 });
  const boneMat = paint('#d8ccb0', { roughness: 0.55 });

  // Tattered cape: long, with a jagged hem of hanging strips
  const cape = new Mesh(new CylinderGeometry(0.1, 0.21, 0.4, 20, 1, true, Math.PI - 1.3, 2.6), mats.cape);
  cape.position.set(0, 0.25, -0.02);
  cape.rotation.x = -0.14;
  figure.add(cape);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI - 1.0 + i * 0.5;
    const strip = new Mesh(new BoxGeometry(0.06, 0.07 + (i % 2) * 0.04, 0.008), mats.cape);
    strip.position.set(Math.sin(a) * 0.2, 0.02 - (i % 2) * 0.02, Math.cos(a) * 0.2 - 0.04);
    strip.rotation.set(-0.2, a, 0);
    figure.add(strip);
  }

  // Breastplate + gorget + faulds (always worn)
  const plate = new Mesh(new CapsuleGeometry(0.13, 0.06, 6, 16), mats.metal);
  plate.scale.set(1, 1, 0.9);
  plate.position.y = 0.33;
  figure.add(plate);
  const ridge = new Mesh(new BoxGeometry(0.02, 0.16, 0.03), darkSteel);
  ridge.position.set(0, 0.34, 0.115);
  figure.add(ridge);
  const gorget = new Mesh(new CylinderGeometry(0.1, 0.13, 0.06, 18), darkSteel);
  gorget.position.y = 0.44;
  figure.add(gorget);
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.6;
    const fauld = new Mesh(new BoxGeometry(0.08, 0.08, 0.02), darkSteel);
    fauld.position.set(Math.sin(a) * 0.14, 0.19, Math.cos(a) * 0.14);
    fauld.rotation.set(0.15, a, 0);
    figure.add(fauld);
  }

  // Pauldrons with bone spikes
  for (const side of [-1, 1]) {
    const pauldron = new Mesh(new SphereGeometry(0.075, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), darkSteel);
    pauldron.position.set(side * 0.155, 0.39, 0);
    pauldron.rotation.z = side * -0.45;
    figure.add(pauldron);
    const spike = new Mesh(new ConeGeometry(0.02, 0.09, 8), boneMat);
    spike.position.set(side * 0.19, 0.45, 0);
    spike.rotation.z = side * -0.6;
    figure.add(spike);
  }
  // Vambraces
  for (const { arm } of [right, left]) {
    const v = new Mesh(new CylinderGeometry(0.05, 0.055, 0.07, 12), mats.metal);
    v.position.y = -0.11;
    arm.add(v);
  }

  // Great helm: covers the face; a T-visor with ember eyes; curled horns
  const helm = new Group();
  const dome = new Mesh(new SphereGeometry(R * 1.1, 32, 24), mats.metal);
  dome.scale.set(1, 1.02, 1);
  helm.add(dome);
  const brow = new Mesh(new TorusGeometry(R * 1.08, 0.014, 8, 40), darkSteel);
  brow.rotation.x = Math.PI / 2;
  brow.position.y = 0.035;
  helm.add(brow);
  const slitH = new Mesh(new BoxGeometry(0.22, 0.032, 0.05), slitMat);
  slitH.position.set(0, -0.005, R * 1.04);
  const slitV = new Mesh(new BoxGeometry(0.032, 0.11, 0.05), slitMat);
  slitV.position.set(0, -0.06, R * 1.03);
  helm.add(slitH, slitV);
  for (const side of [-1, 1]) {
    const eye = new Mesh(new SphereGeometry(0.013, 10, 8), emberMat);
    eye.position.set(side * 0.055, -0.005, R * 1.09);
    helm.add(eye);
    const horn = new Group();
    const h1 = new Mesh(new ConeGeometry(0.035, 0.13, 10), boneMat);
    h1.position.y = 0.06;
    horn.add(h1);
    horn.position.set(side * R * 0.95, 0.07, 0);
    horn.rotation.set(-0.2, 0, side * -0.95);
    helm.add(horn);
  }
  const crest = new Mesh(new BoxGeometry(0.022, 0.05, R * 1.9), darkSteel);
  crest.position.y = R * 1.08;
  helm.add(crest);
  head.add(helm);

  // Upgrade armour: gilded trims and a heavier spiked mantle (hidden until bought)
  const armour = new Group();
  for (const side of [-1, 1]) {
    const trim = new Mesh(new TorusGeometry(0.073, 0.009, 6, 20), mats.accent);
    trim.position.set(side * 0.155, 0.39, 0);
    trim.rotation.set(Math.PI / 2, side * 0.45, 0);
    armour.add(trim);
    for (const dz of [-0.04, 0.04]) {
      const spike = new Mesh(new ConeGeometry(0.014, 0.07, 8), boneMat);
      spike.position.set(side * 0.18, 0.43, dz);
      spike.rotation.z = side * -0.5;
      armour.add(spike);
    }
  }
  const sigil = new Mesh(new ExtrudeGeometry(starShape(0.045, 0.015, 4), { depth: 0.01, bevelEnabled: false }), mats.accent);
  sigil.position.set(0, 0.35, 0.118);
  armour.add(sigil);
  armour.visible = false;
  figure.add(armour);

  right.arm.rotation.set(-0.7, 0, -0.3);
  left.arm.rotation.set(-0.35, 0, 0.4);

  // Sword
  const sword = new Group();
  const bladeGroup = new Group();
  const blade = new Mesh(new BoxGeometry(0.042, 0.38, 0.012), swordMat);
  blade.position.y = 0.23;
  const tip = new Mesh(new CylinderGeometry(0, 0.024, 0.05, 4), swordMat);
  tip.rotation.y = Math.PI / 4;
  tip.scale.z = 0.35;
  tip.position.y = 0.435;
  bladeGroup.add(blade, tip);
  const guard = new Mesh(new BoxGeometry(0.14, 0.024, 0.032), darkSteel);
  guard.position.y = 0.05;
  const grip = new Mesh(new CylinderGeometry(0.014, 0.014, 0.08, 8), mats.leather);
  const pommel = new Mesh(new SphereGeometry(0.022, 10, 8), mats.accent);
  pommel.position.y = -0.05;
  sword.add(bladeGroup, guard, grip, pommel);
  sword.rotation.set(1.0, 0, 0.3);
  right.hand.add(sword);

  // Shield: dark heater shield with a brass rim and a four-point star
  const shield = new Group();
  const heater = new Shape();
  heater.moveTo(-0.14, 0.13);
  heater.lineTo(0.14, 0.13);
  heater.lineTo(0.14, 0.02);
  heater.quadraticCurveTo(0.13, -0.12, 0, -0.19);
  heater.quadraticCurveTo(-0.13, -0.12, -0.14, 0.02);
  heater.closePath();
  const face = new Mesh(new ExtrudeGeometry(heater, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.008, bevelSegments: 2 }), mats.cape);
  face.position.z = -0.015;
  const rimMesh = new Mesh(new ExtrudeGeometry(heater, { depth: 0.012, bevelEnabled: false }), darkSteel);
  rimMesh.scale.setScalar(1.09);
  rimMesh.position.z = -0.02;
  const star = new Mesh(new ExtrudeGeometry(starShape(0.08, 0.025, 4), { depth: 0.008, bevelEnabled: false }), mats.accent);
  star.position.z = 0.016;
  const boss = new Mesh(new SphereGeometry(0.025, 12, 8), mats.accent);
  boss.scale.z = 0.6;
  boss.position.z = 0.025;
  shield.add(rimMesh, face, star, boss);
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
  function setGear({ swordLevel = 0, armour: hasArmour = false, boots = false }) {
    armour.visible = hasArmour;
    mats.boots.color.set(boots ? '#2c4a4a' : pal.boots);
    bladeGroup.scale.set(1 + swordLevel * 0.15, 1 + swordLevel * 0.18, 1);
    swordMat.emissive.set(swordLevel >= 2 ? '#4fa8ff' : swordLevel === 1 ? '#ff7a2a' : '#000000');
    swordMat.emissiveIntensity = swordLevel >= 2 ? 1.6 : swordLevel === 1 ? 0.35 : 0;
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
    land() { landSquash = 1; },
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
