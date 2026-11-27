import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { TiltShiftShader, GradeShader } from './TiltShiftShader.js';

export function createPostFX(renderer, scene, camera) {
  const size = renderer.getSize(new Vector2());
  const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);

  composer.addPass(new RenderPass(scene, camera));
  // Soft glow on lamps, windows, ember eyes and enchanted blades.
  const bloom = new UnrealBloomPass(size.clone(), 0.55, 0.5, 0.9);
  composer.addPass(bloom);

  // Two H+V blur pairs: the second, at half radius, smooths out tap artifacts.
  const blurPasses = [];
  for (const scale of [1, 0.5]) {
    for (const dir of [new Vector2(1, 0), new Vector2(0, 1)]) {
      const pass = new ShaderPass(TiltShiftShader);
      pass.uniforms.direction.value.copy(dir);
      pass.userData = { scale };
      blurPasses.push(pass);
      composer.addPass(pass);
    }
  }

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  const params = {
    autoFocus: true,
    focusY: 0.45,
    band: 0.07,
    falloff: 0.32,
    blur: 3.2,
    saturation: 0.92,
    contrast: 1.22,
    vignette: 0.85,
    tint: 0.6,
    grain: 0.035,
    bloom: 0.55,
  };

  function apply() {
    for (const p of blurPasses) {
      const u = p.uniforms;
      u.focusY.value = params.focusY;
      u.band.value = params.band;
      u.falloff.value = params.falloff;
      u.maxBlur.value = params.blur * p.userData.scale;
    }
    grade.uniforms.saturation.value = params.saturation;
    grade.uniforms.contrast.value = params.contrast;
    grade.uniforms.vignette.value = params.vignette;
    grade.uniforms.tint.value = params.tint;
    grade.uniforms.grain.value = params.grain;
    bloom.strength = params.bloom;
  }

  function setSize(w, h) {
    const pr = renderer.getPixelRatio();
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    for (const p of blurPasses) p.uniforms.resolution.value.set(w * pr, h * pr);
    bloom.setSize(w * pr, h * pr);
  }

  setSize(size.x, size.y);
  apply();

  return {
    params,
    setSize,
    render(dt) {
      apply();
      grade.uniforms.time.value += dt;
      composer.render(dt);
    },
  };
}
