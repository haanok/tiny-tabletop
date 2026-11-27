import { INSTRUMENTS, freq } from './synth.js';
import { SONGS } from './songs.js';

const LOOKAHEAD = 0.15;
const FADE = 0.9;

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === '1'; } catch { return fallback; }
}
function save(key, v) {
  try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* ignore */ }
}

/**
 * Game audio: looping synthesized music with crossfades + one-shot SFX.
 * Audio starts on the first user gesture (browser autoplay rules).
 */
export function createAudio() {
  let A = null; // { ctx, noise, master, musicBus, sfxBus, reverb }
  let musicOn = load('tt-music', true);
  let sfxOn = load('tt-sfx', true);
  let wanted = null; // song name requested
  let player = null; // current song player

  function init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);

    // Soft room reverb from a generated impulse response.
    const len = ctx.sampleRate * 1.8;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    reverb.connect(wet).connect(master);

    const musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 0.5 : 0;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxOn ? 0.75 : 0;
    for (const bus of [musicBus, sfxBus]) {
      bus.connect(master);
      bus.connect(reverb);
    }

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return { ctx, noise, master, musicBus, sfxBus, reverb };
  }

  // ---------------- Music ----------------
  function compile(song) {
    const length = Math.max(...song.tracks.map((t) => t.length));
    const byStep = Array.from({ length }, () => []);
    for (const t of song.tracks) for (const e of t.events) byStep[e.step % length].push(e);
    return { byStep, length, step: song.step };
  }
  const compiled = {};

  function startPlayer(name) {
    const song = (compiled[name] ??= compile(SONGS[name]));
    const { ctx } = A;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE);
    gain.connect(A.musicBus);
    const p = { name, gain, step: 0, next: ctx.currentTime + 0.08, timer: null };
    p.timer = setInterval(() => {
      const now = ctx.currentTime;
      if (p.next < now - 0.25) p.next = now + 0.05; // tab was asleep: skip ahead, don't burst
      while (p.next < now + LOOKAHEAD) {
        for (const e of song.byStep[p.step % song.length]) {
          for (const n of e.notes) INSTRUMENTS[e.inst](A, gain, freq(n), p.next, e.dur * song.step, e.vol);
        }
        p.next += song.step;
        p.step++;
      }
    }, 30);
    return p;
  }

  function stopPlayer(p) {
    if (!p) return;
    const { ctx } = A;
    p.gain.gain.cancelScheduledValues(ctx.currentTime);
    p.gain.gain.setValueAtTime(Math.max(0.0001, p.gain.gain.value), ctx.currentTime);
    p.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + FADE);
    setTimeout(() => { clearInterval(p.timer); p.gain.disconnect(); }, FADE * 1000 + 600);
  }

  function music(name) {
    wanted = name;
    if (!A || player?.name === name) return;
    stopPlayer(player);
    player = name ? startPlayer(name) : null;
  }

  // ---------------- SFX ----------------
  const I = INSTRUMENTS;
  const tone = (inst, note, at, dur, vol) => I[inst](A, A.sfxBus, typeof note === 'string' || typeof note === 'number' ? freq(note) : note, A.ctx.currentTime + at, dur, vol);
  const seq = (inst, notes, gap, vol, dur = gap) => notes.forEach((n, i) => n && tone(inst, n, i * gap, dur, vol));

  function sweep({ type = 'sine', from, to, dur, vol, at = 0, filterType, filterFrom, filterTo, noisy = false }) {
    const { ctx } = A;
    const t = ctx.currentTime + at;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let src;
    if (noisy) {
      src = ctx.createBufferSource();
      src.buffer = A.noise;
      src.loop = true;
    } else {
      src = ctx.createOscillator();
      src.type = type;
      src.frequency.setValueAtTime(from, t);
      src.frequency.exponentialRampToValueAtTime(to, t + dur);
    }
    let node = src;
    if (filterType) {
      const f = ctx.createBiquadFilter();
      f.type = filterType;
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(filterFrom, t);
      f.frequency.exponentialRampToValueAtTime(filterTo, t + dur);
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(A.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const PENTA = ['C6', 'D6', 'E6', 'G6', 'A6'];

  const SFX = {
    step: () => sweep({ from: rnd(170, 210), to: 90, dur: 0.09, vol: 0.12 }),
    land: () => { sweep({ from: 160, to: 60, dur: 0.18, vol: 0.3 }); sweep({ noisy: true, dur: 0.12, vol: 0.06, filterType: 'lowpass', filterFrom: 1200, filterTo: 300 }); },
    bump: () => sweep({ type: 'triangle', from: 140, to: 80, dur: 0.1, vol: 0.2 }),
    coin: () => { tone('bell', 'B5', 0, 0.1, 0.22); tone('bell', 'E6', 0.07, 0.3, 0.25); },
    blip: () => tone('marimba', PENTA[Math.floor(Math.random() * PENTA.length)], 0, 0.1, 0.12),
    select: () => tone('pluck', 'G5', 0, 0.08, 0.12),
    buy: () => { seq('bell', ['E6', 'G6', 'C7'], 0.06, 0.18); sweep({ noisy: true, dur: 0.25, vol: 0.05, filterType: 'highpass', filterFrom: 6000, filterTo: 9000, at: 0.05 }); },
    quest: () => seq('bell', ['G5', 'C6', 'E6', 'G6'], 0.09, 0.22),
    fanfare: () => {
      seq('lead', ['C5', 'E5', 'G5', 'C6', null, 'G5', 'C6'], 0.11, 0.08, 0.12);
      tone('bell', 'C6', 0.66, 1, 0.25); tone('bell', 'E6', 0.66, 1, 0.2); tone('bell', 'G6', 0.66, 1, 0.18);
    },
    victory: () => {
      seq('lead', ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5'], 0.12, 0.09, 0.13);
      [['C5', 'E5', 'G5', 'C6']].forEach((ch) => ch.forEach((n) => tone('pad', n, 0.84, 1.2, 0.05)));
      seq('bell', [null, null, null, null, null, null, null, 'C6', 'E6', 'G6', 'C7'], 0.12, 0.18);
    },
    defeat: () => seq('flute', ['E5', 'D#5', 'D5', 'C#5'], 0.35, 0.16, 0.45),
    whoosh: () => sweep({ noisy: true, dur: 1.3, vol: 0.14, filterType: 'bandpass', filterFrom: 300, filterTo: 2400 }),
    lift: () => sweep({ type: 'sine', from: 300, to: 700, dur: 0.25, vol: 0.12 }),
    banner: () => seq('bell', ['C6', 'G6'], 0.12, 0.12),
    swing: () => sweep({ noisy: true, dur: 0.22, vol: 0.18, filterType: 'bandpass', filterFrom: 600, filterTo: 3500 }),
    hit: () => { sweep({ from: 220, to: 50, dur: 0.22, vol: 0.4 }); sweep({ noisy: true, dur: 0.12, vol: 0.18, filterType: 'lowpass', filterFrom: 3000, filterTo: 400 }); },
    hurt: () => { seq('lead', ['A4', 'E4'], 0.08, 0.1, 0.1); sweep({ from: 180, to: 60, dur: 0.18, vol: 0.3 }); },
    roar: () => {
      sweep({ type: 'sawtooth', from: 110, to: 55, dur: 1.0, vol: 0.18, filterType: 'lowpass', filterFrom: 600, filterTo: 180 });
      sweep({ noisy: true, dur: 0.9, vol: 0.1, filterType: 'lowpass', filterFrom: 500, filterTo: 150 });
    },
    snap: () => { for (let i = 0; i < 3; i++) sweep({ noisy: true, at: i * 0.12, dur: 0.04, vol: 0.25, filterType: 'bandpass', filterFrom: 2500, filterTo: 2000 }); },
    snore: () => sweep({ type: 'sawtooth', from: 70, to: 90, dur: 0.8, vol: 0.06, filterType: 'lowpass', filterFrom: 300, filterTo: 500 }),
    diceShake: () => { for (let i = 0; i < 5; i++) sweep({ noisy: true, at: i * 0.05, dur: 0.03, vol: 0.12, filterType: 'bandpass', filterFrom: 3000, filterTo: 2500 }); },
    diceBounce: (o = {}) => sweep({ noisy: true, dur: 0.05, vol: 0.08 + (o.strength ?? 1) * 0.18, filterType: 'bandpass', filterFrom: rnd(1800, 2800), filterTo: 1500 }),
    success: () => seq('bell', ['C6', 'E6', 'G6'], 0.07, 0.2),
    fail: () => seq('pluck', ['E4', 'C4'], 0.13, 0.18),
    crit: () => { seq('bell', ['C6', 'E6', 'G6', 'C7', 'E7'], 0.05, 0.2); sweep({ noisy: true, at: 0.1, dur: 0.5, vol: 0.06, filterType: 'highpass', filterFrom: 7000, filterTo: 10000 }); },
    fumble: () => sweep({ type: 'sawtooth', from: 300, to: 110, dur: 0.7, vol: 0.12, filterType: 'lowpass', filterFrom: 1500, filterTo: 400 }),
    potion: () => { for (let i = 0; i < 4; i++) sweep({ from: rnd(300, 500), to: rnd(700, 1000), at: i * 0.09, dur: 0.08, vol: 0.12 }); },
    luck: () => seq('bell', ['A6', 'E6', 'A6', 'C#7'], 0.05, 0.14),
    sneak: () => seq('pluck', ['C5', null, 'E5', null, 'G5', null, 'C6'], 0.09, 0.12),
    toggle: () => tone('marimba', 'A5', 0, 0.1, 0.15),
  };

  function sfx(name, opts) {
    if (!A || !sfxOn) return;
    SFX[name]?.(opts);
  }

  return {
    /** Call from a user gesture. */
    unlock() {
      if (!A) A = init();
      if (!A) return;
      if (A.ctx.state !== 'running') A.ctx.resume();
      if (wanted && !player) music(wanted);
    },
    music,
    sfx,
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
    setMusic(on) {
      musicOn = on;
      save('tt-music', on);
      if (A) A.musicBus.gain.setTargetAtTime(on ? 0.5 : 0, A.ctx.currentTime, 0.2);
    },
    setSfx(on) {
      sfxOn = on;
      save('tt-sfx', on);
      if (A) A.sfxBus.gain.setTargetAtTime(on ? 0.75 : 0, A.ctx.currentTime, 0.05);
    },
  };
}
