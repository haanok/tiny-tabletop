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

/**
 * The "painted mini under a moody lamp" grade, in linear space:
 * saturation, contrast, cold-shadow / warm-highlight split tone, heavy vignette, light film grain.
 */
export const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 0.92 },
    contrast: { value: 1.22 },
    vignette: { value: 0.85 },
    tint: { value: 0.6 },
    grain: { value: 0.035 },
    time: { value: 0 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float vignette;
    uniform float tint;
    uniform float grain;
    uniform float time;
    varying vec2 vUv;

    float rand(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = max(c.rgb, vec3(0.0));
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(l), col, saturation), vec3(0.0));
      col = 0.18 * pow(col / 0.18, vec3(contrast));

      // Split tone: teal in the shadows, amber in the highlights.
      float lum = clamp(l / 0.5, 0.0, 1.0);
      vec3 toneC = mix(vec3(0.82, 0.95, 1.08), vec3(1.1, 1.0, 0.86), smoothstep(0.1, 0.9, lum));
      col *= mix(vec3(1.0), toneC, tint);

      float v = smoothstep(0.8, 0.22, length((vUv - 0.5) * vec2(1.15, 1.0)));
      col *= mix(1.0, v, vignette);

      float n = rand(vUv * 1000.0 + fract(time) * 37.0) - 0.5;
      col += n * grain * (0.25 + col);
      gl_FragColor = vec4(max(col, vec3(0.0)), c.a);
    }
  `,
};
