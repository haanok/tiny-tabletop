// Small Web Audio instrument kit: every voice is synthesised, no samples.

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'C#5' → MIDI number. */
export function midi(note) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Bad note ${note}`);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
export const freq = (n) => 440 * Math.pow(2, ((typeof n === 'number' ? n : midi(n)) - 69) / 12);

function env(ctx, t, { a = 0.005, peak = 1, d = 0.3, s = 0, hold = 0, r = 0.1 }) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (s > 0) {
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * s), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, peak * s), t + Math.max(a + d, hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, hold) + r);
  } else {
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  return g;
}

function osc(ctx, type, f, t, end, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  o.detune.value = detune;
  o.start(t);
  o.stop(end + 0.05);
  return o;
}

function noise(A, t, end) {
  const src = A.ctx.createBufferSource();
  src.buffer = A.noise;
  src.loop = true;
  src.start(t, Math.random() * 1.5);
  src.stop(end + 0.05);
  return src;
}

function filter(ctx, type, f, q = 0.7) {
  const n = ctx.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  return n;
}

/** Instruments: (A, out, f, t, dur, vol) */
export const INSTRUMENTS = {
  // Music box / celesta
  bell(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const e = env(ctx, t, { a: 0.004, peak: vol, d: 1.4 });
    e.connect(out);
    osc(ctx, 'sine', f, t, t + 1.5).connect(e);
    const e2 = env(ctx, t, { a: 0.002, peak: vol * 0.35, d: 0.5 });
    e2.connect(out);
    osc(ctx, 'sine', f * 2, t, t + 0.6).connect(e2);
    const e3 = env(ctx, t, { a: 0.002, peak: vol * 0.12, d: 0.2 });
    e3.connect(out);
    osc(ctx, 'triangle', f * 3, t, t + 0.3).connect(e3);
  },
  marimba(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const e = env(ctx, t, { a: 0.003, peak: vol, d: 0.6 });
    e.connect(out);
    osc(ctx, 'sine', f, t, t + 0.7).connect(e);
    const e2 = env(ctx, t, { a: 0.001, peak: vol * 0.3, d: 0.08 });
    e2.connect(out);
    osc(ctx, 'sine', f * 4, t, t + 0.1).connect(e2);
  },
  pluck(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const lp = filter(ctx, 'lowpass', 2600);
    const e = env(ctx, t, { a: 0.003, peak: vol, d: 0.45 });
    lp.connect(e).connect(out);
    osc(ctx, 'triangle', f, t, t + 0.5).connect(lp);
    osc(ctx, 'square', f, t, t + 0.5, 5).connect(env(ctx, t, { a: 0.002, peak: 0.15, d: 0.1 })).connect(lp);
  },
  flute(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const e = env(ctx, t, { a: 0.09, peak: vol, d: 0.1, s: 0.8, hold: dur, r: 0.25 });
    e.connect(out);
    const o = osc(ctx, 'sine', f, t, t + dur + 0.3);
    const lfo = osc(ctx, 'sine', 5, t, t + dur + 0.3);
    const depth = ctx.createGain();
    depth.gain.value = f * 0.006;
    lfo.connect(depth).connect(o.frequency);
    o.connect(e);
    const breath = noise(A, t, t + dur + 0.3);
    const bp = filter(ctx, 'bandpass', f * 2, 2);
    const be = env(ctx, t, { a: 0.05, peak: vol * 0.05, d: 0.1, s: 0.5, hold: dur, r: 0.2 });
    breath.connect(bp).connect(be).connect(out);
  },
  reed(A, out, f, t, dur, vol) {
    // accordion-ish: two detuned pulses through a lowpass, gentle tremolo
    const { ctx } = A;
    const lp = filter(ctx, 'lowpass', 1700, 1);
    const e = env(ctx, t, { a: 0.03, peak: vol, d: 0.08, s: 0.75, hold: dur * 0.95, r: 0.08 });
    lp.connect(e).connect(out);
    osc(ctx, 'square', f, t, t + dur + 0.1, -6).connect(lp);
    osc(ctx, 'sawtooth', f, t, t + dur + 0.1, 7).connect(lp);
  },
  lead(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const lp = filter(ctx, 'lowpass', 3200);
    const e = env(ctx, t, { a: 0.01, peak: vol, d: 0.05, s: 0.7, hold: dur * 0.85, r: 0.06 });
    lp.connect(e).connect(out);
    osc(ctx, 'square', f, t, t + dur + 0.1).connect(lp);
  },
  pad(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const lp = filter(ctx, 'lowpass', 850, 0.5);
    const e = env(ctx, t, { a: 0.7, peak: vol, d: 0.3, s: 0.85, hold: dur, r: 1.2 });
    lp.connect(e).connect(out);
    for (const dt of [-8, 0, 8]) osc(ctx, 'sawtooth', f, t, t + dur + 1.3, dt).connect(lp);
  },
  bass(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const lp = filter(ctx, 'lowpass', 700, 1);
    const e = env(ctx, t, { a: 0.008, peak: vol, d: 0.15, s: 0.6, hold: dur * 0.9, r: 0.08 });
    lp.connect(e).connect(out);
    osc(ctx, 'triangle', f, t, t + dur + 0.1).connect(lp);
    osc(ctx, 'sawtooth', f, t, t + dur + 0.1).connect(env(ctx, t, { a: 0.005, peak: 0.35, d: 0.2, s: 0.4, hold: dur, r: 0.05 })).connect(lp);
  },
  // ---- drums (f ignored) ----
  kick(A, out, f, t, dur, vol) {
    const { ctx } = A;
    const o = osc(ctx, 'sine', 150, t, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(env(ctx, t, { a: 0.002, peak: vol, d: 0.25 })).connect(out);
  },
  snare(A, out, f, t, dur, vol) {
    const { ctx } = A;
    noise(A, t, t + 0.2).connect(filter(ctx, 'bandpass', 1900, 0.8)).connect(env(ctx, t, { a: 0.001, peak: vol, d: 0.16 })).connect(out);
    osc(ctx, 'triangle', 190, t, t + 0.1).connect(env(ctx, t, { a: 0.001, peak: vol * 0.5, d: 0.07 })).connect(out);
  },
  hat(A, out, f, t, dur, vol) {
    const { ctx } = A;
    noise(A, t, t + 0.06).connect(filter(ctx, 'highpass', 7500)).connect(env(ctx, t, { a: 0.001, peak: vol, d: 0.04 })).connect(out);
  },
  shaker(A, out, f, t, dur, vol) {
    const { ctx } = A;
    noise(A, t, t + 0.1).connect(filter(ctx, 'highpass', 5000)).connect(env(ctx, t, { a: 0.015, peak: vol, d: 0.06 })).connect(out);
  },
};

// ---------------- Song notation helpers ----------------

const CHORD_SHAPES = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10] };

/** 'F#m' at octave 3 → [midi...] */
export function chordTones(name, octave) {
  const m = /^([A-G][#b]?)(m|7)?$/.exec(name);
  const root = midi(`${m[1]}${octave}`);
  return CHORD_SHAPES[m[2] ?? ''].map((i) => root + i);
}

/** 'C Am F,G C' → per bar: array of chord names (split bars with commas). */
const parseChords = (seq) => seq.trim().split(/\s+/).map((b) => b.split(','));

function chordAt(bars, bar, step, steps) {
  const halves = bars[bar % bars.length];
  return halves[Math.min(halves.length - 1, Math.floor((step / steps) * halves.length))];
}

/**
 * Compile a token string (bars separated by '|', tokens by spaces) into events.
 * Tokens: 'C5', 'C4+E4+G4' (chord), '.' rest, '-' hold previous.
 */
export function melody(inst, vol, text) {
  const tokens = text.replace(/\|/g, ' ').trim().split(/\s+/);
  const events = [];
  tokens.forEach((tok, i) => {
    if (tok === '.' || tok === '-') return;
    let dur = 1;
    while (tokens[i + dur] === '-') dur++;
    events.push({ step: i, inst, vol, notes: tok.split('+').map(midi), dur });
  });
  return { events, length: tokens.length };
}

/** Arpeggio from chord progression. pattern: indices into chord tones, '.' rest, 'c' whole chord. */
export function arp(inst, vol, seq, pattern, octave, steps) {
  const bars = parseChords(seq);
  const events = [];
  for (let b = 0; b < bars.length; b++) {
    for (let s = 0; s < steps; s++) {
      const p = pattern[s % pattern.length];
      if (p === '.') continue;
      const tones = chordTones(chordAt(bars, b, s, steps), octave);
      const notes = p === 'c' ? tones : [tones[p % tones.length] + 12 * Math.floor(p / tones.length)];
      events.push({ step: b * steps + s, inst, vol, notes, dur: 1 });
    }
  }
  return { events, length: bars.length * steps };
}

/** Bass line. pattern chars per step: R root, 5 fifth, O octave, . rest, - hold. */
export function bassline(inst, vol, seq, pattern, octave, steps) {
  const bars = parseChords(seq);
  const events = [];
  for (let b = 0; b < bars.length; b++) {
    for (let s = 0; s < steps; s++) {
      const p = pattern[s % pattern.length];
      if (p === '.' || p === '-') continue;
      let dur = 1;
      while (pattern[(s + dur) % pattern.length] === '-' && s + dur < steps) dur++;
      const root = chordTones(chordAt(bars, b, s, steps), octave)[0];
      const n = p === 'R' ? root : p === '5' ? root + 7 : root + 12;
      events.push({ step: b * steps + s, inst, vol, notes: [n], dur });
    }
  }
  return { events, length: bars.length * steps };
}

/** Held chords, one per bar (or half bar). */
export function pads(inst, vol, seq, octave, steps) {
  const bars = parseChords(seq);
  const events = [];
  bars.forEach((halves, b) => {
    const len = steps / halves.length;
    halves.forEach((c, h) => events.push({ step: b * steps + h * len, inst, vol, notes: chordTones(c, octave), dur: len }));
  });
  return { events, length: bars.length * steps };
}

/** Drum grid repeated for `bars`. pattern: tokens like 'k+h' per step; k kick, s snare, h hat, x shaker. */
export function drums(vol, pattern, bars) {
  const toks = pattern.trim().split(/\s+/);
  const map = { k: 'kick', s: 'snare', h: 'hat', x: 'shaker' };
  const events = [];
  for (let b = 0; b < bars; b++) {
    toks.forEach((tok, i) => {
      if (tok === '.') return;
      for (const d of tok.split('+')) events.push({ step: b * toks.length + i, inst: map[d], vol: vol[d] ?? 0.3, notes: [60], dur: 1 });
    });
  }
  return { events, length: bars * toks.length };
}
