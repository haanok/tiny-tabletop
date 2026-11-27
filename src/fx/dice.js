import { EdgesGeometry, Group, IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, Vector3 } from 'three';
import { paint } from '../minis/materials.js';
import { wait } from '../core/anim.js';

/**
 * A chunky 3D d20 that drops, bounces and settles, then shows its number.
 * roll(at, groundY, judge?) resolves with the result once the number is shown.
 */
export function createDice(scene, labels) {
  const R = 0.19;
  const die = new Group();
  const geo = new IcosahedronGeometry(R, 0);
  const body = new Mesh(geo, paint('#e84a5f', { flatShading: true, roughness: 0.35 }));
  body.castShadow = true;
  const edges = new LineSegments(new EdgesGeometry(geo), new LineBasicMaterial({ color: '#fff2e0' }));
  edges.scale.setScalar(1.002);
  die.add(body, edges);
  die.visible = false;
  scene.add(die);

  let sim = null;
  let tag = null;

  function update(dt) {
    if (!sim) return;
    const s = sim;
    s.vel.y -= 14 * dt;
    die.position.addScaledVector(s.vel, dt);
    die.rotation.x += s.spin.x * dt;
    die.rotation.y += s.spin.y * dt;
    die.rotation.z += s.spin.z * dt;
    const floor = s.ground + R * 0.8;
    if (die.position.y < floor) {
      die.position.y = floor;
      s.vel.y = -s.vel.y * 0.45;
      s.vel.x *= 0.6;
      s.vel.z *= 0.6;
      s.spin.multiplyScalar(0.55);
      s.bounces++;
      if (s.bounces >= 4 || Math.abs(s.vel.y) < 0.6) {
        sim = null;
        s.done();
      }
    }
  }

  async function roll(at, ground, judge = () => '') {
    tag?.remove();
    const result = 1 + Math.floor(Math.random() * 20);
    die.visible = true;
    die.position.set(at.x - 0.4, ground + 1.6, at.z + 0.4);
    die.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    await new Promise((done) => {
      sim = {
        ground,
        bounces: 0,
        vel: new Vector3(1.0 + Math.random() * 0.4, 0, -0.8 - Math.random() * 0.4),
        spin: new Vector3(14 + Math.random() * 8, 10 * Math.random(), 12 + Math.random() * 8),
        done,
      };
    });
    const cls = judge(result);
    tag = labels.attach(die, { y: 0.32, className: `dice-result ${cls}`, html: `${result}` });
    await wait(0.9);
    const t = tag;
    setTimeout(() => { t.remove(); if (tag === t) die.visible = false; }, 1800);
    return result;
  }

  return { roll, update };
}
