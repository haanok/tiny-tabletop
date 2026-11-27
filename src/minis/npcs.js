import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { createBase } from './base.js';
import { paint, metal, castAll } from './materials.js';
import { buildChibi, chibiMaterials, createIdle } from './chibi.js';

function bottle(color) {
  const g = new Group();
  const body = new Mesh(new SphereGeometry(0.035, 12, 10), paint(color, { roughness: 0.2, emissive: color, emissiveIntensity: 0.25 }));
  body.position.y = 0.035;
  const neck = new Mesh(new CylinderGeometry(0.012, 0.012, 0.03, 8), paint('#e8f4f2', { roughness: 0.2 }));
  neck.position.y = 0.075;
  const cork = new Mesh(new CylinderGeometry(0.014, 0.012, 0.015, 8), paint('#a57a4a'));
  cork.position.y = 0.095;
  g.add(body, neck, cork);
  return g;
}

/** Pip the Peddler: floppy hat, giant backpack, crate of potions. */
export function createMerchant() {
  const m = chibiMaterials({
    skin: '#f1c39c', hair: '#d8d0c4', tunic: '#5c9a4a', metal: '#c8c8c8',
    accent: '#e8b63d', leather: '#7a4b2a', boots: '#5a3a24',
  });
  const root = new Group();
  root.name = 'merchant';
  root.add(createBase({ seed: 21, grass: '#8a9a5a' }));
  const { figure, head, right, left, R } = buildChibi(m, { mustache: true });
  root.add(figure);

  // Floppy wizard-ish hat
  const hatMat = paint('#7a4fa8');
  const brim = new Mesh(new CylinderGeometry(R * 1.45, R * 1.5, 0.025, 28), hatMat);
  brim.position.y = R * 0.55;
  brim.rotation.x = -0.12;
  const cone = new Mesh(new ConeGeometry(R * 0.95, 0.32, 20), hatMat);
  cone.position.set(0, R * 0.55 + 0.15, -0.03);
  cone.rotation.set(-0.35, 0, 0.15);
  const band = new Mesh(new TorusGeometry(R * 0.9, 0.018, 8, 24), paint('#e8b63d'));
  band.rotation.x = Math.PI / 2 - 0.12;
  band.position.y = R * 0.6;
  head.add(brim, cone, band);

  // Backpack with bedroll and hanging pan
  const pack = new Mesh(new BoxGeometry(0.28, 0.32, 0.16), paint('#9a6a3a'));
  pack.position.set(0, 0.36, -0.16);
  const roll = new Mesh(new CylinderGeometry(0.06, 0.06, 0.32, 14), paint('#b8443c'));
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.56, -0.16);
  const pan = new Mesh(new CylinderGeometry(0.07, 0.06, 0.02, 16), metal('#555'));
  pan.rotation.x = Math.PI / 2;
  pan.position.set(0.12, 0.3, -0.25);
  figure.add(pack, roll, pan);

  // Holding up a potion
  right.arm.rotation.set(-1.4, 0, -0.2);
  const held = bottle('#ff5a7a');
  held.position.y = 0.02;
  right.hand.add(held);
  left.arm.rotation.set(0, 0, 0.25);

  // Crate of potions beside him
  const crate = new Group();
  const box = new Mesh(new BoxGeometry(0.2, 0.12, 0.16), paint('#b07b45'));
  box.position.y = 0.06;
  crate.add(box);
  ['#5ab0ff', '#7ce05a', '#ffcf4a'].forEach((c, i) => {
    const b = bottle(c);
    b.position.set(-0.06 + i * 0.06, 0.12, 0);
    crate.add(b);
  });
  crate.position.set(0.24, 0.07, 0.12);
  crate.rotation.y = -0.4;
  root.add(crate);

  castAll(root);
  const idle = createIdle(root, figure, head);
  return { object: root, name: 'Pip the Peddler', ...idle };
}

/** Sergeant Bramble: plumed helmet, tabard, long spear. */
export function createGuard() {
  const m = chibiMaterials({
    skin: '#e9b48e', hair: '#5a3a24', tunic: '#b8443c', metal: '#bfc6cf',
    accent: '#e8b63d', leather: '#5a3a24', boots: '#3a2a20',
  });
  const root = new Group();
  root.name = 'guard';
  root.add(createBase({ seed: 31 }));
  const { figure, head, torso, right, left, R } = buildChibi(m, { hair: true, mustache: true });
  root.add(figure);

  // Helmet + plume
  const helm = new Mesh(new SphereGeometry(R * 1.1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), m.metal);
  helm.rotation.x = -0.15;
  const helmRim = new Mesh(new TorusGeometry(R * 1.08, 0.02, 8, 28), m.metal);
  helmRim.rotation.x = Math.PI / 2 - 0.15;
  helmRim.position.y = 0.0;
  const nose = new Mesh(new BoxGeometry(0.025, 0.1, 0.02), m.metal);
  nose.position.set(0, 0.0, R * 1.07);
  const plume = new Mesh(new SphereGeometry(0.06, 12, 10), paint('#e84a3c'));
  plume.scale.set(0.6, 1.3, 1.8);
  plume.position.set(0, R * 1.15, -0.02);
  head.add(helm, helmRim, nose, plume);

  // Chest plate over tabard
  const plate = new Mesh(new SphereGeometry(0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), m.metal);
  plate.scale.set(1, 0.9, 0.8);
  plate.position.y = 0.3;
  figure.add(plate);
  torso.scale.z = 0.9;

  // Spear held upright
  right.arm.rotation.set(-0.5, 0, -0.15);
  const spear = new Group();
  const shaft = new Mesh(new CylinderGeometry(0.014, 0.014, 0.95, 8), paint('#7a5232'));
  shaft.position.y = 0.2;
  const head2 = new Mesh(new ConeGeometry(0.035, 0.12, 4), m.metal);
  head2.position.y = 0.73;
  const pennant = new Mesh(new BoxGeometry(0.004, 0.08, 0.12), paint('#e8b63d'));
  pennant.position.set(0, 0.6, -0.07);
  spear.add(shaft, head2, pennant);
  spear.rotation.x = 0.5;
  right.hand.add(spear);
  left.arm.rotation.set(-0.2, 0, 0.3);

  castAll(root);
  const idle = createIdle(root, figure, head);
  return { object: root, name: 'Sergeant Bramble', ...idle };
}

function fish(color = '#8fb8d8') {
  const g = new Group();
  const body = new Mesh(new SphereGeometry(0.06, 12, 8), paint(color, { roughness: 0.4 }));
  body.scale.set(0.5, 0.9, 1.9);
  const tail = new Mesh(new ConeGeometry(0.05, 0.07, 4), paint(color));
  tail.rotation.x = -Math.PI / 2;
  tail.scale.set(0.3, 1, 1);
  tail.position.z = -0.13;
  const eye = new Mesh(new SphereGeometry(0.012, 6, 4), paint('#111'));
  eye.position.set(0.028, 0.015, 0.07);
  g.add(body, tail, eye);
  return g;
}

/** Barnacle Bess: fishmonger with a bandana, apron and a fish held high. */
export function createFishmonger() {
  const m = chibiMaterials({
    skin: '#e8a882', hair: '#d0602a', tunic: '#3a7ab8', metal: '#c8c8c8',
    accent: '#e8b63d', leather: '#5a3a24', boots: '#2a3a4a',
  });
  const root = new Group();
  root.name = 'fishmonger';
  root.add(createBase({ seed: 41, grass: '#d8c08a' }));
  const { figure, head, right, left, R, onHead } = buildChibi(m);
  root.add(figure);

  // Bandana + knot
  const bandMat = paint('#d6473b');
  const band = new Mesh(new SphereGeometry(R * 1.08, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), bandMat);
  band.rotation.x = -0.35;
  const knot = new Mesh(new SphereGeometry(0.04, 10, 8), bandMat);
  knot.position.set(0, R * 0.55, -R * 0.95);
  const tails = new Mesh(new ConeGeometry(0.03, 0.1, 4), bandMat);
  tails.position.set(0.03, R * 0.4, -R * 1.02);
  tails.rotation.set(0.6, 0, 0.4);
  head.add(band, knot, tails);
  // Pigtails
  for (const side of [-1, 1]) {
    const tail = new Mesh(new SphereGeometry(0.06, 10, 8), m.hair);
    tail.scale.set(0.8, 1.3, 0.8);
    tail.position.set(side * R * 0.95, -0.06, -0.06);
    head.add(tail);
  }
  // Apron
  const apron = new Mesh(new BoxGeometry(0.2, 0.26, 0.02), paint('#f4f0e8'));
  apron.position.set(0, 0.26, 0.11);
  figure.add(apron);

  right.arm.rotation.set(-2.4, 0, -0.15);
  const held = fish('#7fb0d0');
  held.rotation.set(Math.PI / 2, 0, 0);
  held.position.y = -0.02;
  right.hand.add(held);
  left.arm.rotation.set(-0.2, 0, 0.5);

  castAll(root);
  const idle = createIdle(root, figure, head);
  return { object: root, name: 'Barnacle Bess', ...idle };
}

/** Old Marla: lighthouse keeper in a yellow raincoat and sou'wester, holding a lantern. */
export function createKeeper() {
  const m = chibiMaterials({
    skin: '#f0c8a8', hair: '#d8d4d0', tunic: '#f0c23a', metal: '#c8c8c8',
    accent: '#3a3330', leather: '#3a3330', boots: '#2a3a4a',
  });
  const root = new Group();
  root.name = 'keeper';
  root.add(createBase({ seed: 51, grass: '#d8c08a' }));
  const { figure, head, right, left, R, onHead } = buildChibi(m);
  root.add(figure);

  // Sou'wester hat: dome + sloped wide brim
  const hatMat = paint('#f0c23a');
  const dome = new Mesh(new SphereGeometry(R * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hatMat);
  dome.rotation.x = -0.25;
  const brim = new Mesh(new CylinderGeometry(R * 1.35, R * 1.6, 0.05, 24, 1, true), paint('#f0c23a', { side: 2 }));
  brim.position.set(0, R * 0.25, -0.03);
  brim.rotation.x = -0.25;
  head.add(dome, brim);
  // Bun
  const bun = new Mesh(new SphereGeometry(0.07, 12, 10), m.hair);
  bun.position.set(0, R * 0.2, -R * 1.05);
  head.add(bun);
  // Round glasses
  for (const side of [-1, 1]) {
    const lens = new Mesh(new TorusGeometry(0.04, 0.006, 6, 16), paint('#3a3330'));
    lens.position.copy(onHead(side * 0.42, -0.08, 1, 1.04));
    lens.lookAt(lens.position.clone().multiplyScalar(2));
    head.add(lens);
  }
  // Raincoat buttons
  for (const y of [0.24, 0.32, 0.4]) {
    const b = new Mesh(new SphereGeometry(0.012, 6, 4), paint('#3a3330'));
    b.position.set(0, y, 0.115);
    figure.add(b);
  }

  // Lantern
  right.arm.rotation.set(-0.9, 0, -0.25);
  const lantern = new Group();
  const frame = new Mesh(new BoxGeometry(0.08, 0.1, 0.08), paint('#3a3330'));
  frame.position.y = -0.07;
  const glow = new Mesh(new BoxGeometry(0.065, 0.085, 0.065), paint('#ffd36a', { emissive: '#ffb84a', emissiveIntensity: 1.2 }));
  glow.position.y = -0.07;
  const handle = new Mesh(new TorusGeometry(0.03, 0.006, 4, 10, Math.PI), paint('#3a3330'));
  handle.position.y = -0.015;
  lantern.add(frame, glow, handle);
  lantern.rotation.x = 0.9;
  right.hand.add(lantern);
  left.arm.rotation.set(-0.1, 0, 0.3);

  castAll(root);
  const idle = createIdle(root, figure, head);
  return { object: root, name: 'Old Marla', ...idle };
}
