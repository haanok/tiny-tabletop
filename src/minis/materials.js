import { MeshStandardMaterial } from 'three';

/** Matte "acrylic paint" look used for every miniature. */
export function paint(color, opts = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...opts });
}

/** Slightly shiny drybrushed metal. */
export function metal(color) {
  return new MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.65 });
}

/** Deterministic RNG so scenery is the same every load. */
export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Enable shadows on every mesh in a group. */
export function castAll(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}
