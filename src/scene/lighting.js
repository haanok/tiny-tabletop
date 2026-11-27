import { Color, DirectionalLight, HemisphereLight } from 'three';

/** Moody dusk: cold moonlight key, dim sky, a warm ember rim from the opposite side. */
export function addLighting(scene) {
  scene.background = new Color('#0b0908');

  const hemi = new HemisphereLight('#7f8fb8', '#2a1f17', 0.38);
  scene.add(hemi);

  const key = new DirectionalLight('#c3cdf0', 1.35);
  key.position.set(7, 8, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 14;
  key.shadow.camera.bottom = -14;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key, key.target);

  const fill = new DirectionalLight('#ff8a4a', 0.45);
  fill.position.set(-6, 4, -5);
  scene.add(fill);

  return { hemi, key, fill };
}
