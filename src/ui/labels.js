import { Vector3 } from 'three';
import { tween, ease } from '../core/anim.js';

/** HTML labels pinned to 3D objects (markers, name tags) and floating popups. */
export function createLabels(camera) {
  const layer = document.createElement('div');
  layer.className = 'label-layer';
  document.body.appendChild(layer);
  const items = new Set();
  const v = new Vector3();

  function place(el, worldPos) {
    v.copy(worldPos).project(camera);
    const hidden = v.z > 1;
    el.style.display = hidden ? 'none' : '';
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }

  return {
    /** Label that follows an object at a height offset. */
    attach(object, { y = 1, className = '', html = '' } = {}) {
      const el = document.createElement('div');
      el.className = `label ${className}`;
      el.innerHTML = html;
      layer.appendChild(el);
      const item = { object, y, el, visible: true };
      items.add(item);
      return {
        el,
        set(h) { el.innerHTML = h; },
        show(on) { item.visible = on; },
        remove() { el.remove(); items.delete(item); },
      };
    },

    /** Text that floats up from a world position and fades out. */
    popup(worldPos, html, className = '') {
      const el = document.createElement('div');
      el.className = `label popup ${className}`;
      el.innerHTML = html;
      layer.appendChild(el);
      const start = worldPos.clone();
      const p = new Vector3();
      return tween(1.3, (t) => {
        p.copy(start).y += t * 0.8;
        place(el, p);
        el.style.opacity = String(t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
      }, ease.outCubic).then(() => el.remove());
    },

    update() {
      for (const it of items) {
        if (!it.visible || !it.object.visible) { it.el.style.display = 'none'; continue; }
        it.object.getWorldPosition(v);
        v.y += it.y;
        place(it.el, v);
      }
    },
  };
}
