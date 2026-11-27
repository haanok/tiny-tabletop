import { MeshStandardMaterial } from 'three';

/** Matte "acrylic paint" look used for every miniature. */
export function paint(color, opts = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...opts });
}

const metals = [];
let metalEnv = null;

/** Slightly shiny drybrushed metal. Picks up the shared reflection map once one is set. */
export function metal(color) {
  const m = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.65, envMap: metalEnv, envMapIntensity: 0.45 });
  metals.push(m);
  return m;
}

/** Give every metal material (existing and future) a reflection map, so steel reads in dim light. */
export function setMetalEnv(tex) {
  metalEnv = tex;
  for (const m of metals) { m.envMap = tex; m.needsUpdate = true; }
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
