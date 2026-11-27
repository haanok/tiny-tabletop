import {
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { createBase, BASE_HEIGHT } from './base.js';
import { paint, castAll } from './materials.js';
import { tween, flash, materialsOf, ease } from '../core/anim.js';

/**
 * Captain Pinch: a giant hermit crab living in a ship's barrel, wearing a tiny
 * tricorn hat, with the stolen lighthouse lens wedged on top of the barrel. Faces +Z.
 */
export function createCrab() {
  const shell = paint('#e0573a');
  const belly = paint('#f4a070');
  const dark = paint('#2a1a14');
  const white = paint('#ffffff', { roughness: 0.3 });
  const wood = paint('#8a5a32');
  const band = paint('#4a4440');
  const lensMat = paint('#9ff0ff', { emissive: '#5fd8ff', emissiveIntensity: 1.2, roughness: 0.1 });

  const root = new Group();
  root.name = 'crab';
  root.add(createBase({ radius: 0.48, seed: 88, grass: '#d8c08a' }));

  const figure = new Group();
  figure.position.y = BASE_HEIGHT;
  figure.scale.setScalar(1.25);
  root.add(figure);

  // Barrel shell (tilted back)
  const barrelGroup = new Group();
  const barrel = new Mesh(new CylinderGeometry(0.22, 0.22, 0.46, 16), wood);
  barrel.scale.set(1.08, 1, 1.08);
  barrelGroup.add(barrel);
  for (const y of [-0.16, 0, 0.16]) {
    const b = new Mesh(new TorusGeometry(0.235, 0.014, 4, 18), band);
    b.rotation.x = Math.PI / 2;
    b.position.y = y;
    barrelGroup.add(b);
  }
  const lens = new Mesh(new OctahedronGeometry(0.09, 0), lensMat);
  lens.position.y = 0.3;
  barrelGroup.add(lens);
  barrelGroup.position.set(0, 0.36, -0.12);
  barrelGroup.rotation.x = -0.55;
  figure.add(barrelGroup);

  // Body peeking out the front
  const body = new Mesh(new SphereGeometry(0.2, 20, 14), shell);
  body.scale.set(1.25, 0.65, 1);
  body.position.set(0, 0.2, 0.08);
  const tummy = new Mesh(new SphereGeometry(0.16, 16, 10), belly);
  tummy.scale.set(1.2, 0.5, 0.8);
  tummy.position.set(0, 0.16, 0.14);
  figure.add(body, tummy);

  // Legs: 3 per side
  const legs = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new Group();
      leg.position.set(side * 0.2, 0.18, 0.12 - i * 0.1);
      const upper = new Mesh(new CapsuleGeometry(0.025, 0.14, 4, 6), shell);
      upper.rotation.z = side * 1.0;
      upper.position.set(side * 0.07, 0.03, 0);
      const lower = new Mesh(new CapsuleGeometry(0.02, 0.14, 4, 6), shell);
      lower.rotation.z = side * -0.4;
      lower.position.set(side * 0.16, -0.07, 0);
      leg.add(upper, lower);
      leg.rotation.y = side * (i - 1) * 0.35;
      figure.add(leg);
      legs.push({ leg, side, i });
    }
  }

  // Big claws
  const claws = {};
  for (const side of [-1, 1]) {
    const arm = new Group();
    arm.position.set(side * 0.22, 0.24, 0.18);
    const fore = new Mesh(new CapsuleGeometry(0.04, 0.12, 4, 8), shell);
    fore.rotation.set(1.1, 0, side * -0.5);
    fore.position.set(side * 0.05, 0.04, 0.06);
    arm.add(fore);
    const pincer = new Group();
    pincer.position.set(side * 0.1, 0.1, 0.16);
    const big = new Mesh(new SphereGeometry(0.1, 14, 10), shell);
    big.scale.set(side === -1 ? 1.15 : 0.9, 0.8, 1.2);
    const fixedFinger = new Mesh(new ConeGeometry(0.045, 0.16, 8), shell);
    fixedFinger.rotation.x = Math.PI / 2;
    fixedFinger.position.set(0, -0.02, 0.15);
    const jaw = new Group();
    jaw.position.set(0, 0.03, 0.06);
    const finger = new Mesh(new ConeGeometry(0.035, 0.14, 8), shell);
    finger.rotation.x = Math.PI / 2;
    finger.position.z = 0.08;
    jaw.add(finger);
    pincer.add(big, fixedFinger, jaw);
    pincer.scale.setScalar(side === -1 ? 1.25 : 0.95); // one claw bigger, like a real fiddler
    arm.add(pincer);
    figure.add(arm);
    claws[side] = { arm, jaw };
  }

  // Eye stalks + pupils
  const eyes = [];
  for (const side of [-1, 1]) {
    const stalk = new Group();
    stalk.position.set(side * 0.07, 0.28, 0.17);
    const stem = new Mesh(new CylinderGeometry(0.014, 0.018, 0.14, 6), shell);
    stem.position.y = 0.07;
    const ball = new Mesh(new SphereGeometry(0.045, 12, 10), white);
    ball.position.y = 0.15;
    const pupil = new Mesh(new SphereGeometry(0.022, 10, 8), dark);
    pupil.position.set(0, 0.155, 0.032);
    const lid = new Mesh(new SphereGeometry(0.048, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell);
    lid.position.y = 0.15;
    lid.rotation.x = 0.0;
    stalk.add(stem, ball, pupil, lid);
    stalk.rotation.z = side * -0.25;
    figure.add(stalk);
    eyes.push({ stalk, lid });
  }
  // Tiny tricorn hat between the stalks
  const hat = new Group();
  const brim = new Mesh(new CylinderGeometry(0.1, 0.1, 0.015, 3), dark);
  const crown = new Mesh(new SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  const skull = new Mesh(new SphereGeometry(0.012, 6, 4), white);
  skull.position.set(0, 0.03, 0.045);
  hat.add(brim, crown, skull);
  hat.position.set(0, 0.33, 0.12);
  hat.rotation.set(-0.15, Math.PI, 0.1);
  figure.add(hat);

  castAll(root);
  const allMats = materialsOf(root);

  let time = 0;
  let targetYaw = 0;
  let lunge = 0;
  let snap = 0;
  let shake = 0;
  let asleep = false;
  let defeated = false;

  return {
    object: root,
    name: 'Captain Pinch',
    faceTowards(pos) {
      targetYaw = Math.atan2(pos.x - root.position.x, pos.z - root.position.z);
    },
    setAsleep(v) { asleep = v; },
    setLens(v) { lens.visible = v; },
    async attack() {
      await tween(0.45, (t) => {
        const k = Math.sin(t * Math.PI);
        lunge = k * 0.3;
        snap = Math.abs(Math.sin(t * Math.PI * 3));
      });
      lunge = snap = 0;
    },
    async hit() {
      flash(allMats, '#ffffff');
      await tween(0.45, (t) => { shake = (1 - t) * Math.sin(t * 45) * 0.06; });
      shake = 0;
    },
    async defeat() {
      defeated = true;
      await tween(0.8, (t) => {
        figure.rotation.z = t * Math.PI;
        figure.position.y = BASE_HEIGHT + Math.sin(t * Math.PI) * 0.4 + t * 0.35;
      }, ease.outCubic);
      await tween(0.7, (t) => { root.scale.setScalar(1 - t); });
      root.visible = false;
    },
    update(dt) {
      time += dt;
      let dy = targetYaw - root.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      root.rotation.y += dy * Math.min(1, dt * 6);
      if (defeated) return;
      const speed = asleep ? 0.6 : 2.2;
      figure.position.z = lunge;
      figure.position.x = shake + (asleep ? 0 : Math.sin(time * 1.3) * 0.02);
      figure.position.y = BASE_HEIGHT + (asleep ? Math.sin(time * speed) * 0.01 : 0);
      for (const side of [-1, 1]) {
        const c = claws[side];
        c.jaw.rotation.x = -0.15 - (asleep ? 0 : Math.max(0, Math.sin(time * 2.5 + side)) * 0.35) - snap * 0.5;
        c.arm.rotation.x = asleep ? 0.35 : Math.sin(time * 1.4 + side) * 0.12 - lunge;
      }
      for (const { leg, side, i } of legs) leg.rotation.z = asleep ? 0 : Math.sin(time * 6 + i * 2 + side) * 0.08;
      for (const e of eyes) {
        e.lid.rotation.x = asleep ? -1.5 : 0;
        e.lid.visible = asleep;
        e.stalk.rotation.x = asleep ? 0.6 : Math.sin(time * 0.9 + e.stalk.position.x * 20) * 0.15;
      }
      lensMat.emissiveIntensity = 1.0 + Math.sin(time * 4) * 0.4;
    },
  };
}
