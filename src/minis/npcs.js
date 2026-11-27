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

/** Wooden signpost pointing north. */
export function createSignpost() {
  const g = new Group();
  const post = new Mesh(new CylinderGeometry(0.035, 0.04, 0.7, 8), paint('#7a5232'));
  post.position.y = 0.35;
  const board = new Mesh(new BoxGeometry(0.42, 0.13, 0.03), paint('#b98a55'));
  board.position.set(0, 0.58, 0);
  board.rotation.y = Math.PI / 2;
  const arrow = new Mesh(new ConeGeometry(0.08, 0.1, 3), paint('#b98a55'));
  arrow.rotation.set(-Math.PI / 2, 0, 0);
  arrow.position.set(0, 0.58, -0.25);
  const skull = new Mesh(new SphereGeometry(0.045, 10, 8), paint('#efe6d2'));
  skull.position.set(0.02, 0.58, 0.02);
  g.add(post, board, arrow, skull);
  return castAll(g);
}
