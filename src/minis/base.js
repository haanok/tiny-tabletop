import { ConeGeometry, CylinderGeometry, Group, Mesh } from 'three';
import { paint, seededRandom } from './materials.js';

export const BASE_HEIGHT = 0.07;

/**
 * Round painted miniature base: black rim, flocked grass top and a few tufts.
 * Returns a group whose top surface sits at y = BASE_HEIGHT.
 */
export function createBase({ radius = 0.38, seed = 7, grass = '#6fa54a' } = {}) {
  const g = new Group();
  const rand = seededRandom(seed);

  const rim = new Mesh(
    new CylinderGeometry(radius, radius * 1.04, BASE_HEIGHT, 40),
    paint('#1d1a18', { roughness: 0.5 }),
  );
  rim.position.y = BASE_HEIGHT / 2;
  g.add(rim);

  const top = new Mesh(new CylinderGeometry(radius * 0.97, radius * 0.97, 0.012, 40), paint(grass));
  top.position.y = BASE_HEIGHT + 0.002;
  g.add(top);

  const tuftMat = paint('#8cc15a');
  const tuftGeo = new ConeGeometry(0.018, 0.07, 5);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const r = radius * (0.55 + rand() * 0.35);
    const cluster = new Group();
    for (let j = 0; j < 3; j++) {
      const blade = new Mesh(tuftGeo, tuftMat);
      blade.position.set((rand() - 0.5) * 0.03, 0.03, (rand() - 0.5) * 0.03);
      blade.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6);
      cluster.add(blade);
    }
    cluster.position.set(Math.cos(a) * r, BASE_HEIGHT, Math.sin(a) * r);
    g.add(cluster);
  }

  return g;
}
