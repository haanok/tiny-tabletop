import { Color } from 'three';

const tweens = new Set();

export const ease = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

/** Run fn(easedT) every frame for `duration` seconds. Resolves when done. */
export function tween(duration, fn, easing = ease.linear) {
  return new Promise((resolve) => tweens.add({ t: 0, duration, fn, easing, resolve }));
}

export const wait = (s) => tween(s, () => {});

export function updateTweens(dt) {
  for (const tw of tweens) {
    tw.t = Math.min(1, tw.t + dt / tw.duration);
    tw.fn(tw.easing(tw.t));
    if (tw.t >= 1) {
      tweens.delete(tw);
      tw.resolve();
    }
  }
}

/** Collect unique materials under an object (for hit flashes). */
export function materialsOf(obj) {
  const set = new Set();
  obj.traverse((o) => o.isMesh && o.material?.emissive && set.add(o.material));
  return [...set];
}

/** Flash emissive colour on a set of materials, then restore. */
export function flash(mats, color = '#ff3030', duration = 0.35) {
  const c = new Color(color);
  const saved = mats.map((m) => ({ m, e: m.emissive.clone(), i: m.emissiveIntensity }));
  return tween(duration, (t) => {
    const k = Math.sin(t * Math.PI);
    for (const s of saved) {
      s.m.emissive.copy(s.e).lerp(c, k);
      s.m.emissiveIntensity = s.i + (1 - s.i) * k;
    }
  }).then(() => saved.forEach((s) => { s.m.emissive.copy(s.e); s.m.emissiveIntensity = s.i; }));
}
