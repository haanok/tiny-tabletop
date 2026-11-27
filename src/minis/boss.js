import {
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  SphereGeometry,
} from 'three';
import { createBase, BASE_HEIGHT } from './base.js';
import { paint, castAll, seededRandom } from './materials.js';
import { tween, flash, materialsOf, ease } from '../core/anim.js';

function mushroom(capColor, scale = 1, glow = false) {
  const g = new Group();
  const stem = new Mesh(new CylinderGeometry(0.02, 0.028, 0.08, 8), paint('#efe3c8'));
  stem.position.y = 0.04;
  const capMat = paint(capColor, glow ? { emissive: capColor, emissiveIntensity: 0.9 } : {});
  const cap = new Mesh(new SphereGeometry(0.055, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  cap.position.y = 0.075;
  g.add(stem, cap);
  if (!glow) {
    for (let i = 0; i < 4; i++) {
      const dot = new Mesh(new SphereGeometry(0.01, 6, 4), paint('#ffffff'));
      const a = (i / 4) * Math.PI * 2;
      dot.position.set(Math.cos(a) * 0.035, 0.11, Math.sin(a) * 0.035);
      g.add(dot);
    }
  }
  g.scale.setScalar(scale);
  return g;
}

/** Grumblemaw, the Bog Troll. Big, mossy, tusked, mushrooms on its back. Faces +Z. */
export function createBoss() {
  const skin = paint('#5f8f5a');
  const belly = paint('#a7c27a');
  const dark = paint('#2c3b2a');
  const tuskMat = paint('#f3ead2', { roughness: 0.5 });
  const eyeMat = paint('#ffde4a', { emissive: '#ffcc22', emissiveIntensity: 1.2 });
  const moss = paint('#4f7a2e', { flatShading: true });
  const club = paint('#7a5232');

  const root = new Group();
  root.name = 'boss';
  root.add(createBase({ radius: 0.48, seed: 66, grass: '#3d4f33' }));

  const figure = new Group();
  figure.position.y = BASE_HEIGHT;
  figure.scale.setScalar(1.3);
  root.add(figure);

  // Stumpy legs
  for (const side of [-1, 1]) {
    const leg = new Mesh(new CapsuleGeometry(0.08, 0.08, 4, 10), skin);
    leg.position.set(side * 0.12, 0.11, 0);
    figure.add(leg);
    const foot = new Mesh(new SphereGeometry(0.085, 12, 8), skin);
    foot.scale.set(1, 0.5, 1.3);
    foot.position.set(side * 0.12, 0.04, 0.04);
    figure.add(foot);
  }

  // Pear body
  const body = new Mesh(new SphereGeometry(0.28, 28, 20), skin);
  body.scale.set(1, 1.05, 0.85);
  body.position.y = 0.42;
  const tummy = new Mesh(new SphereGeometry(0.2, 20, 14), belly);
  tummy.scale.set(1, 1.1, 0.6);
  tummy.position.set(0, 0.38, 0.13);
  const loincloth = new Mesh(new CylinderGeometry(0.25, 0.27, 0.08, 16), paint('#6b4a2c'));
  loincloth.position.y = 0.22;
  figure.add(body, tummy, loincloth);

  // Head sunk into shoulders
  const head = new Group();
  head.position.set(0, 0.72, 0.06);
  figure.add(head);
  const skull = new Mesh(new SphereGeometry(0.2, 24, 18), skin);
  skull.scale.set(1.15, 0.9, 1);
  head.add(skull);
  const brow = new Mesh(new CapsuleGeometry(0.04, 0.2, 4, 10), dark);
  brow.rotation.z = Math.PI / 2;
  brow.position.set(0, 0.05, 0.16);
  head.add(brow);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new Mesh(new SphereGeometry(0.035, 12, 10), eyeMat);
    eye.scale.set(1.2, 0.7, 0.5);
    eye.position.set(side * 0.08, 0.0, 0.18);
    head.add(eye);
    eyes.push(eye);
    const tusk = new Mesh(new ConeGeometry(0.025, 0.1, 8), tuskMat);
    tusk.position.set(side * 0.09, -0.06, 0.17);
    tusk.rotation.set(0.2, 0, side * -0.25);
    head.add(tusk);
    const horn = new Mesh(new ConeGeometry(0.04, 0.18, 10), tuskMat);
    horn.position.set(side * 0.19, 0.12, -0.02);
    horn.rotation.set(-0.3, 0, side * -0.9);
    head.add(horn);
    const ear = new Mesh(new ConeGeometry(0.04, 0.12, 6), skin);
    ear.position.set(side * 0.23, 0.0, 0);
    ear.rotation.z = side * -1.6;
    head.add(ear);
  }
  const jaw = new Mesh(new SphereGeometry(0.15, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), skin);
  jaw.scale.set(1.1, 0.7, 1);
  jaw.position.set(0, -0.06, 0.05);
  const mouth = new Mesh(new CapsuleGeometry(0.02, 0.12, 4, 8), dark);
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.09, 0.17);
  const nose = new Mesh(new SphereGeometry(0.045, 12, 10), skin);
  nose.scale.set(1.2, 0.8, 1);
  nose.position.set(0, -0.025, 0.2);
  head.add(jaw, mouth, nose);

  // Long arms; club in right hand (-X)
  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new Group();
    arm.position.set(side * 0.28, 0.58, 0);
    const upper = new Mesh(new CapsuleGeometry(0.07, 0.22, 4, 10), skin);
    upper.position.y = -0.15;
    const fist = new Mesh(new SphereGeometry(0.085, 14, 10), skin);
    fist.position.y = -0.32;
    arm.add(upper, fist);
    arm.rotation.set(-0.2, 0, side * 0.3);
    figure.add(arm);
    arms[side] = { arm, fist };
  }
  const clubGroup = new Group();
  const shaft = new Mesh(new CylinderGeometry(0.09, 0.035, 0.55, 10), club);
  shaft.position.y = 0.22;
  clubGroup.add(shaft);
  const rand = seededRandom(9);
  for (let i = 0; i < 7; i++) {
    const spike = new Mesh(new ConeGeometry(0.02, 0.07, 6), tuskMat);
    const a = rand() * Math.PI * 2;
    const y = 0.3 + rand() * 0.18;
    spike.position.set(Math.cos(a) * 0.08, y, Math.sin(a) * 0.08);
    spike.lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2);
    spike.rotateX(Math.PI / 2);
    clubGroup.add(spike);
  }
  clubGroup.position.y = -0.32;
  clubGroup.rotation.set(1.1, 0, 0.2);
  arms[-1].arm.add(clubGroup);

  // Moss & mushrooms on shoulders/back
  for (const [x, y, z, r] of [[-0.2, 0.64, -0.05, 0.09], [0.22, 0.62, -0.08, 0.08], [0, 0.6, -0.2, 0.12], [0.1, 0.48, -0.24, 0.08]]) {
    const blob = new Mesh(new IcosahedronGeometry(r, 1), moss);
    blob.position.set(x, y, z);
    figure.add(blob);
  }
  for (const [x, y, z, s] of [[-0.05, 0.68, -0.22, 1.1], [0.14, 0.58, -0.25, 0.8], [-0.2, 0.7, -0.08, 0.7]]) {
    const mush = mushroom('#d6473b', s);
    mush.position.set(x, y, z);
    mush.rotation.x = -0.4;
    figure.add(mush);
  }

  castAll(root);
  const allMats = materialsOf(root);

  let time = 0;
  let targetYaw = 0;
  let lunge = 0;
  let swing = 0;
  let shake = 0;
  let defeated = false;

  return {
    object: root,
    name: 'Grumblemaw, the Bog Troll',
    faceTowards(pos) {
      targetYaw = Math.atan2(pos.x - root.position.x, pos.z - root.position.z);
    },
    async attack() {
      await tween(0.5, (t) => {
        const k = Math.sin(t * Math.PI);
        lunge = k * 0.3;
        swing = k * 1.8;
      });
      lunge = swing = 0;
    },
    async hit() {
      flash(allMats, '#ffffff');
      await tween(0.45, (t) => { shake = (1 - t) * Math.sin(t * 45) * 0.06; });
      shake = 0;
    },
    async defeat() {
      defeated = true;
      await tween(0.9, (t) => {
        figure.rotation.x = -t * 1.45;
        figure.position.y = BASE_HEIGHT + Math.sin(t * Math.PI) * 0.1;
      }, ease.outCubic);
      await tween(0.8, (t) => { root.scale.setScalar(1 - t); });
      root.visible = false;
    },
    reset() {
      defeated = false;
      root.visible = true;
      root.scale.setScalar(1);
      figure.rotation.x = 0;
      figure.position.y = BASE_HEIGHT;
    },
    update(dt) {
      time += dt;
      let dy = targetYaw - root.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      root.rotation.y += dy * Math.min(1, dt * 5);
      if (defeated) return;
      const breathe = Math.sin(time * 1.6);
      figure.scale.set(1.3 + breathe * 0.015, 1.3 - breathe * 0.025, 1.3);
      figure.position.z = lunge;
      figure.position.x = shake;
      head.rotation.z = Math.sin(time * 0.7) * 0.06;
      eyeMat.emissiveIntensity = 1.0 + Math.sin(time * 3) * 0.4;
      arms[-1].arm.rotation.x = -0.2 + Math.sin(time * 1.6) * 0.05 - swing;
      arms[1].arm.rotation.x = -0.2 - Math.sin(time * 1.6) * 0.05;
    },
  };
}

/** Glowing mushrooms + bones scattered around the lair (non-blocking). */
export function createLairDecor(center, heightAt) {
  const g = new Group();
  const rand = seededRandom(77);
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.2 + rand() * 2.4;
    const x = center.gx + Math.cos(a) * r;
    const z = center.gz + Math.sin(a) * r;
    const glow = rand() < 0.6;
    const m = mushroom(glow ? (rand() < 0.5 ? '#5ff0e0' : '#b47cff') : '#d6473b', 0.8 + rand() * 1.2, glow);
    m.position.set(x, heightAt(Math.round(x), Math.round(z)), z);
    g.add(m);
  }
  for (let i = 0; i < 6; i++) {
    const bone = new Mesh(new CapsuleGeometry(0.015, 0.12, 4, 6), paint('#efe6d2'));
    const a = rand() * Math.PI * 2;
    const r = 1 + rand() * 2;
    const x = center.gx + Math.cos(a) * r;
    const z = center.gz + Math.sin(a) * r;
    bone.rotation.set(Math.PI / 2, 0, rand() * 3);
    bone.position.set(x, heightAt(Math.round(x), Math.round(z)) + 0.015, z);
    g.add(bone);
  }
  return castAll(g);
}
