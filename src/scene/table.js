import { CanvasTexture, Mesh, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three';
import { paint, seededRandom } from '../minis/materials.js';

const SIZE = 240;
const REPEAT_WORLD = 12; // world units per texture repeat

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2516';
  g.fillRect(0, 0, 512, 512);
  const rand = seededRandom(3);
  for (let i = 0; i < 160; i++) {
    const y = rand() * 512;
    g.strokeStyle = `rgba(${rand() < 0.5 ? '18,10,5' : '95,62,36'},${0.15 + rand() * 0.25})`;
    g.lineWidth = 1 + rand() * 4;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 6 * rand());
    g.stroke();
  }
  // Plank seams
  g.strokeStyle = 'rgba(30,16,8,0.6)';
  g.lineWidth = 3;
  for (const y of [0, 128, 256, 384]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(SIZE / REPEAT_WORLD, SIZE / REPEAT_WORLD);
  tex.anisotropy = 8;
  return tex;
}

/** The big wooden table every board sits on. recenter(x, z) keeps the grain fixed in world space. */
export function createTable(scene, y = -0.5) {
  const tex = woodTexture();
  const mesh = new Mesh(new PlaneGeometry(SIZE, SIZE), paint('#ffffff', { map: tex, roughness: 0.6 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return {
    mesh,
    recenter(x, z) {
      mesh.position.x = x;
      mesh.position.z = z;
      tex.offset.set(x / REPEAT_WORLD, -z / REPEAT_WORLD);
    },
  };
}
