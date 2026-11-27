import { Vector2 } from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * One direction of a separable gaussian blur whose radius grows with the
 * distance from a horizontal focus line. Run it horizontally then vertically.
 */
export const TiltShiftShader = {
  name: 'TiltShiftShader',
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new Vector2(1, 1) },
    direction: { value: new Vector2(1, 0) },
    focusY: { value: 0.5 }, // screen-space UV y of the sharp line
    band: { value: 0.07 }, // half-height of the fully sharp band
    falloff: { value: 0.32 }, // distance over which blur ramps to max
    maxBlur: { value: 3.0 }, // pixels between taps at full blur
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform vec2 direction;
    uniform float focusY;
    uniform float band;
    uniform float falloff;
    uniform float maxBlur;
    varying vec2 vUv;

    void main() {
      float d = abs(vUv.y - focusY);
      float amt = smoothstep(band, band + falloff, d) * maxBlur;
      vec2 stepUv = direction * amt / resolution;

      vec4 c = texture2D(tDiffuse, vUv) * 0.2270270270;
      c += (texture2D(tDiffuse, vUv + stepUv * 1.0) + texture2D(tDiffuse, vUv - stepUv * 1.0)) * 0.1945945946;
      c += (texture2D(tDiffuse, vUv + stepUv * 2.0) + texture2D(tDiffuse, vUv - stepUv * 2.0)) * 0.1216216216;
      c += (texture2D(tDiffuse, vUv + stepUv * 3.0) + texture2D(tDiffuse, vUv - stepUv * 3.0)) * 0.0540540541;
      c += (texture2D(tDiffuse, vUv + stepUv * 4.0) + texture2D(tDiffuse, vUv - stepUv * 4.0)) * 0.0162162162;
      gl_FragColor = c;
    }
  `,
};

/** Saturation / contrast / vignette — the "toy photo" grade. Works in linear space. */
export const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.35 },
    contrast: { value: 1.12 },
    vignette: { value: 0.45 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float vignette;
    varying vec2 vUv;

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = max(c.rgb, vec3(0.0));
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(l), col, saturation), vec3(0.0));
      col = 0.18 * pow(col / 0.18, vec3(contrast));
      float v = smoothstep(0.85, 0.3, length(vUv - 0.5));
      col *= mix(1.0, v, vignette);
      gl_FragColor = vec4(col, c.a);
    }
  `,
};
