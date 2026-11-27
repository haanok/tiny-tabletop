import en from './en.js';
import no from './no.js';

const STRINGS = { en, no };
export const LANGS = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'no', label: 'NO', name: 'Norsk' },
];

function initial() {
  try {
    const saved = localStorage.getItem('tt-lang');
    if (saved && STRINGS[saved]) return saved;
  } catch { /* ignore */ }
  const nav = (navigator.language || '').toLowerCase();
  return /^(nb|nn|no)\b/.test(nav) ? 'no' : 'en';
}

let lang = initial();
const listeners = new Set();

const lookup = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/**
 * Translate a dotted key. `{name}` placeholders are filled from params.
 * Arrays (variant lines) return a random entry unless params.all is set.
 */
export function t(key, params = {}) {
  let v = lookup(STRINGS[lang], key);
  if (v === undefined) v = lookup(STRINGS.en, key);
  if (v === undefined) return key;
  if (Array.isArray(v)) {
    if (params.all) return v;
    v = v[Math.floor(Math.random() * v.length)];
  }
  if (typeof v === 'function') return v(params);
  if (typeof v !== 'string') return v;
  return v.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
}

export const getLang = () => lang;

export function setLang(id) {
  if (!STRINGS[id] || id === lang) return;
  lang = id;
  try { localStorage.setItem('tt-lang', id); } catch { /* ignore */ }
  document.documentElement.lang = id === 'no' ? 'nb' : 'en';
  listeners.forEach((fn) => fn(id));
}

export const onLangChange = (fn) => listeners.add(fn);

document.documentElement.lang = lang === 'no' ? 'nb' : 'en';
