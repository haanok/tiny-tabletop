import { BoxGeometry, CapsuleGeometry, CylinderGeometry, Group, Mesh, SphereGeometry, TorusGeometry, Vector3 } from 'three';
import { BASE_HEIGHT } from './base.js';
import { paint, metal } from './materials.js';

const faceMats = {
  eye: paint('#1b1412', { roughness: 0.3 }),
  shine: paint('#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.4 }),
  blush: paint('#ff8f8f', { transparent: true, opacity: 0.55 }),
};

/** Standard material set for a chibi. Keys match the palette keys. */
export function chibiMaterials(pal) {
  return {
    skin: paint(pal.skin, { roughness: 0.7 }),
    hair: paint(pal.hair),
    tunic: paint(pal.tunic),
    metal: metal(pal.metal),
    accent: metal(pal.accent),
    leather: paint(pal.leather),
    boots: paint(pal.boots),
  };
}

/**
 * Shared chibi body: stubby legs, tunic, belt, arms, big head with face and hair.
 * Faces +Z. Returns the parts so characters can attach props.
 */
export function buildChibi(m, { hair = true, mustache = false } = {}) {
  const figure = new Group();
  figure.position.y = BASE_HEIGHT;

  // Legs & boots
  const legGeo = new CapsuleGeometry(0.055, 0.07, 4, 10);
  for (const side of [-1, 1]) {
    const leg = new Mesh(legGeo, m.boots);
    leg.position.set(side * 0.065, 0.09, 0);
    figure.add(leg);
    const toe = new Mesh(new SphereGeometry(0.05, 12, 8), m.boots);
    toe.scale.set(1, 0.6, 1.3);
    toe.position.set(side * 0.065, 0.035, 0.03);
    figure.add(toe);
  }

  // Body
  const torso = new Mesh(new CapsuleGeometry(0.12, 0.1, 6, 16), m.tunic);
  torso.scale.z = 0.85;
  torso.position.y = 0.3;
  figure.add(torso);
  const skirt = new Mesh(new CylinderGeometry(0.115, 0.15, 0.1, 18), m.tunic);
  skirt.position.y = 0.2;
  figure.add(skirt);
  const belt = new Mesh(new CylinderGeometry(0.124, 0.124, 0.035, 18), m.leather);
  belt.scale.z = 0.88;
  belt.position.y = 0.255;
  figure.add(belt);
  const buckle = new Mesh(new BoxGeometry(0.05, 0.04, 0.02), m.accent);
  buckle.position.set(0, 0.255, 0.108);
  figure.add(buckle);

  // Arms (character's right is -X)
  function makeArm(side) {
    const arm = new Group();
    arm.position.set(side * 0.15, 0.39, 0);
    const sleeve = new Mesh(new CapsuleGeometry(0.045, 0.08, 4, 10), m.tunic);
    sleeve.position.y = -0.07;
    arm.add(sleeve);
    const hand = new Group();
    hand.position.y = -0.15;
    hand.add(new Mesh(new SphereGeometry(0.045, 12, 10), m.skin));
    arm.add(hand);
    figure.add(arm);
    return { arm, hand };
  }
  const right = makeArm(-1);
  const left = makeArm(1);

  // Head
  const head = new Group();
  head.position.y = 0.63;
  figure.add(head);
  const R = 0.21;
  head.add(new Mesh(new SphereGeometry(R, 32, 24), m.skin));
  const onHead = (x, y, z = 1, scale = 1) => new Vector3(x, y, z).normalize().multiplyScalar(R * scale);

  if (hair) {
    const cap = new Mesh(new SphereGeometry(R * 1.06, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), m.hair);
    cap.rotation.x = -0.4;
    head.add(cap);
    for (const [x, s] of [[-0.45, 1], [0, 1.15], [0.45, 1]]) {
      const tuft = new Mesh(new SphereGeometry(0.06 * s, 12, 10), m.hair);
      tuft.scale.set(1, 0.75, 0.7);
      tuft.position.copy(onHead(x, 0.75, 1, 0.98));
      head.add(tuft);
    }
  }

  const center = new Vector3();
  for (const side of [-1, 1]) {
    const eye = new Mesh(new SphereGeometry(0.032, 14, 10), faceMats.eye);
    eye.scale.set(0.85, 1.15, 0.45);
    eye.position.copy(onHead(side * 0.42, -0.08));
    eye.lookAt(center.copy(eye.position).multiplyScalar(2));
    head.add(eye);
    const shine = new Mesh(new SphereGeometry(0.009, 8, 6), faceMats.shine);
    shine.position.copy(onHead(side * 0.42 - 0.04, 0.0, 1, 1.02));
    head.add(shine);
    const blush = new Mesh(new SphereGeometry(0.035, 12, 8), faceMats.blush);
    blush.scale.set(1.2, 0.7, 0.2);
    blush.position.copy(onHead(side * 0.72, -0.32, 1, 0.99));
    blush.lookAt(center.copy(blush.position).multiplyScalar(2));
    head.add(blush);
    if (mustache) {
      const m1 = new Mesh(new SphereGeometry(0.04, 10, 8), m.hair);
      m1.scale.set(1.4, 0.55, 0.6);
      m1.position.copy(onHead(side * 0.2, -0.3, 1, 1.0));
      m1.rotation.z = side * 0.35;
      head.add(m1);
    }
  }
  if (!mustache) {
    const mouth = new Mesh(new TorusGeometry(0.018, 0.005, 6, 12, Math.PI), faceMats.eye);
    mouth.position.copy(onHead(0, -0.33));
    mouth.rotation.set(0.3, 0, Math.PI);
    head.add(mouth);
  }

  return { figure, head, torso, right, left, onHead, R };
}

/** Idle behaviour shared by NPC chibis: breathe, sway, smoothly turn to a yaw. */
export function createIdle(root, figure, head) {
  let time = Math.random() * 10;
  let targetYaw = root.rotation.y;
  return {
    faceTowards(pos) {
      targetYaw = Math.atan2(pos.x - root.position.x, pos.z - root.position.z);
    },
    update(dt) {
      time += dt;
      let dy = targetYaw - root.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      root.rotation.y += dy * Math.min(1, dt * 8);
      figure.scale.y = 1 + Math.sin(time * 2.2) * 0.015;
      figure.rotation.z = Math.sin(time * 1.2) * 0.025;
      head.rotation.z = Math.sin(time * 1.05 + 1) * 0.05;
    },
  };
}
