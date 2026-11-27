import {
  AdditiveBlending,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three';

const MAX_DOTS = 160;

/**
 * Guided waypoint: a trail of glowing breadcrumbs along the path plus a
 * floating beacon (spinning gem + light pillar + pulsing ring) at the goal.
 */
export function createWaypoint(scene) {
  const dotMat = new MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false });
  const dots = new InstancedMesh(new SphereGeometry(0.055, 10, 6), dotMat, MAX_DOTS);
  dots.count = 0;
  dots.frustumCulled = false;
  scene.add(dots);

  const beacon = new Group();
  const gem = new Mesh(
    new OctahedronGeometry(0.16, 0),
    new MeshBasicMaterial({ color: '#ffd84a' }),
  );
  gem.scale.set(0.8, 1.3, 0.8);
  const pillar = new Mesh(
    new CylinderGeometry(0.1, 0.22, 4, 16, 1, true),
    new MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false }),
  );
  pillar.position.y = 2;
  const ringMat = new MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.8, depthWrite: false });
  const ring = new Mesh(new RingGeometry(0.38, 0.46, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  beacon.add(gem, pillar, ring);
  beacon.visible = false;
  scene.add(beacon);

  const points = [];
  const dummy = new Object3D();
  let time = 0;
  let gemHeight = 1.4;

  return {
    /** pts: Vector3[] along the route (world space, tile tops). goal: Vector3 | null. */
    set(pts, goal, height = 1.4) {
      points.length = 0;
      // Two crumbs per tile for a smoother line.
      // pts[0] is the hero's own tile: start from the halfway point after it.
      for (let i = 1; i < pts.length; i++) {
        points.push(new Vector3().lerpVectors(pts[i - 1], pts[i], 0.5));
        points.push(pts[i].clone());
      }
      if (points.length > MAX_DOTS) points.length = MAX_DOTS;
      dots.count = points.length;
      beacon.visible = !!goal;
      if (goal) beacon.position.copy(goal);
      gemHeight = height;
    },
    hide() {
      dots.count = 0;
      beacon.visible = false;
    },
    update(dt) {
      time += dt;
      for (let i = 0; i < points.length; i++) {
        const wave = Math.max(0, Math.sin(time * 5 - i * 0.45));
        const s = 0.55 + wave * 0.65;
        dummy.position.copy(points[i]);
        dummy.position.y += 0.06 + wave * 0.05;
        dummy.scale.set(s, s * 0.6, s);
        dummy.updateMatrix();
        dots.setMatrixAt(i, dummy.matrix);
      }
      dots.instanceMatrix.needsUpdate = true;
      gem.position.y = gemHeight + Math.sin(time * 2.5) * 0.08;
      gem.rotation.y = time * 2;
      const k = (time * 0.8) % 1;
      ring.scale.setScalar(0.7 + k * 0.8);
      ringMat.opacity = 0.8 * (1 - k);
    },
  };
}
