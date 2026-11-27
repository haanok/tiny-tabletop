import { Color, DirectionalLight, HemisphereLight } from 'three';

export function addLighting(scene) {
  scene.background = new Color('#c9dccb');

  const hemi = new HemisphereLight('#fff4e0', '#5d6b45', 1.0);
  scene.add(hemi);

  const key = new DirectionalLight('#ffe2b8', 2.6);
  key.position.set(6, 10, 4);
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
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const fill = new DirectionalLight('#b8d4ff', 0.55);
  fill.position.set(-6, 5, -5);
  scene.add(fill);

  return { hemi, key, fill };
}
