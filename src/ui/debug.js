import GUI from 'lil-gui';
import { DEFAULT_PALETTE } from '../minis/hero.js';

export function createDebugUI({ fx, hero }) {
  const gui = new GUI({ title: 'Look & feel' });
  gui.close();

  const lens = gui.addFolder('Tilt-shift');
  lens.add(fx.params, 'autoFocus').name('focus follows hero');
  lens.add(fx.params, 'focusY', 0, 1, 0.001).name('focus line').listen();
  lens.add(fx.params, 'band', 0, 0.3, 0.001).name('sharp band');
  lens.add(fx.params, 'falloff', 0.02, 0.8, 0.001).name('falloff');
  lens.add(fx.params, 'blur', 0, 8, 0.01).name('blur strength');

  const grade = gui.addFolder('Toy grade');
  grade.add(fx.params, 'saturation', 0, 2, 0.01);
  grade.add(fx.params, 'contrast', 0.6, 1.6, 0.01);
  grade.add(fx.params, 'vignette', 0, 1, 0.01);
  grade.close();

  const colors = gui.addFolder('Hero paint');
  for (const key of Object.keys(DEFAULT_PALETTE)) {
    colors.addColor(hero.palette, key).onChange(() => hero.setPalette({}));
  }
  colors.add({ reset: () => { hero.setPalette(DEFAULT_PALETTE); colors.controllers.forEach((c) => c.updateDisplay()); } }, 'reset');
  colors.close();

  return gui;
}
