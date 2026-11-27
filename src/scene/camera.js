import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Narrow-FOV "macro lens" camera looking down at the table, with constrained orbit. */
export function createCamera(dom) {
  const camera = new PerspectiveCamera(24, window.innerWidth / window.innerHeight, 0.5, 200);
  const offset = new Vector3().setFromSpherical(new Spherical(17, 0.85, 0.55));
  camera.position.copy(offset);

  const controls = new OrbitControls(camera, dom);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 9;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = 1.0;
  controls.update();

  return { camera, controls };
}
