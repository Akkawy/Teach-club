// Language support. t('home.title') looks up text in the current language (falling back to English),
// tp('lessons', 3) picks the right plural form, th() fills placeholders with markup such as icons.

import { STRINGS } from './strings.js';
import { Safe, esc } from './html.js';

const KEY = 'tc_lang';
export const LANGS = ['en', 'ar'];

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    // storage blocked
  }
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export let lang = initial();
let rules = new Intl.PluralRules(lang);

export function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  rules = new Intl.PluralRules(lang);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // storage blocked: the choice lasts until the page closes
  }
  applyLang();
}

function lookup(table, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), table);
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k]))) : s);

export function t(key, vars) {
  const value = lookup(STRINGS[lang], key) ?? lookup(STRINGS.en, key) ?? key;
  return typeof value === 'string' ? fill(value, vars) : value;
}

export function tp(key, n, vars = {}) {
  const forms = lookup(STRINGS[lang], 'plural.' + key) || lookup(STRINGS.en, 'plural.' + key);
  const cat = n === 0 && forms.zero ? 'zero' : rules.select(n);
  return fill(forms[cat] || forms.other, { ...vars, n });
}

// Like t(), but placeholders may be html`` values; the plain text around them is escaped.
export function th(key, vars = {}) {
  const value = String(t(key));
  let out = '';
  let last = 0;
  value.replace(/\{(\w+)\}/g, (m, k, at) => {
    out += esc(value.slice(last, at));
    const v = vars[k];
    out += v instanceof Safe ? v.s : esc(v == null ? '' : String(v));
    last = at + m.length;
    return m;
  });
  return new Safe(out + esc(value.slice(last)));
}
