// The five lesson formats: colours, artwork and time-plan shapes. Their words live in strings.js.
// shares: each part's share of the time; core: which part absorbs rounding;
// descFrom: which prompt answer describes each part of the outline (null = use the hint).

import { t } from './i18n.js';

export const ORDER = ['talk', 'demo', 'disc', 'show', 'read'];

const LOOK = {
  talk: {
    icon: 'mic', bg: '#E4EEFB', fg: '#1D4F8F', dot: '#3A7BD5', heroInk: '#26405F',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 12h36a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8H28l-10 8v-8h-6a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z" fill="#3A7BD5"/><path d="M15 24h28M15 31h18" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/><circle cx="56" cy="10" r="4" fill="#9CC0EE"/><circle cx="8" cy="54" r="3" fill="#9CC0EE"/></svg>',
    rows: [2, 2, 2], shares: [0.15, 0.6, 0.15, 0.1], core: 1, ramp: ['#7FAAE6', '#1D4F8F', '#3A7BD5', '#BCD3F3'], descFrom: [0, null, 1, null]
  },
  demo: {
    icon: 'screen', bg: '#DDF2EA', fg: '#11684F', dot: '#1F9A78', heroInk: '#2F4A40',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="10" width="52" height="36" rx="8" fill="#1F9A78"/><path d="M27 20v16l13-8z" fill="#FFFFFF"/><rect x="20" y="51" width="24" height="5" rx="2.5" fill="#8FD3BE"/><circle cx="56" cy="8" r="4" fill="#8FD3BE"/></svg>',
    rows: [2, 4, 2], shares: [0.15, 0.4, 0.3, 0.15], core: 1, ramp: ['#62C3A5', '#11684F', '#1F9A78', '#AEE3D2'], descFrom: [0, 1, null, 2]
  },
  disc: {
    icon: 'bubbles', bg: '#ECE6FA', fg: '#5232A3', dot: '#7B5AD4', heroInk: '#3D2F66',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="8" width="36" height="26" rx="10" fill="#7B5AD4"/><path d="M12 33l-2 9 10-8z" fill="#7B5AD4"/><rect x="24" y="26" width="36" height="26" rx="10" fill="#BCA9EC"/><path d="M52 51l2 9-10-8z" fill="#BCA9EC"/><circle cx="15" cy="21" r="2.5" fill="#FFFFFF"/><circle cx="22" cy="21" r="2.5" fill="#FFFFFF"/><circle cx="29" cy="21" r="2.5" fill="#FFFFFF"/></svg>',
    rows: [2, 3, 2], shares: [0.15, 0.5, 0.25, 0.1], core: 1, ramp: ['#A68EE3', '#3E2585', '#7B5AD4', '#D3C7F3'], descFrom: [0, 1, 2, null]
  },
  show: {
    icon: 'gift', bg: '#FBEFD0', fg: '#744F00', dot: '#D99A12', heroInk: '#4D3A0B',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="30" width="44" height="28" rx="5" fill="#D99A12"/><rect x="6" y="22" width="52" height="11" rx="4" fill="#F0C455"/><path d="M32 22v36" stroke="#FFFFFF" stroke-width="3.5"/><path d="M32 3l2.4 5 5.5.8-4 3.9.9 5.4-4.8-2.6-4.9 2.6 1-5.4-4-3.9 5.5-.8z" fill="#D99A12"/></svg>',
    rows: [3, 2, 2], shares: [0.1, 0.6, 0.2, 0.1], core: 1, ramp: ['#EDC15A', '#744F00', '#D99A12', '#F7DFA0'], descFrom: [1, 0, 2, null]
  },
  read: {
    icon: 'book', bg: '#FAE3EB', fg: '#962553', dot: '#D24E7C', heroInk: '#5C2238',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><path d="M4 16c9-5 19-5 28 2v36c-9-6-19-6-28-2z" fill="#D24E7C"/><path d="M60 16c-9-5-19-5-28 2v36c9-6 19-6 28-2z" fill="#F0A3BF"/><path d="M38 26c5-2 10-2 15 0M38 34c5-2 10-2 15 0" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/></svg>',
    rows: [1, 2, 3], shares: [0.3, 0.1, 0.45, 0.15], core: 2, ramp: ['#E58AAB', '#F4C5D6', '#962553', '#D24E7C'], descFrom: [null, 1, 2, null]
  }
};

// Everything about a format, in the current language.
export function fmt(key) {
  const look = LOOK[key] || LOOK.talk;
  const words = t(`formats.${key in LOOK ? key : 'talk'}`);
  return {
    ...look,
    ...words,
    prompts: words.prompts.map((p, i) => ({ ...p, rows: look.rows[i] })),
    plan: words.plan.map(([name, hint], i) => [name, hint, look.shares[i]])
  };
}

export function suggestPlan(format, len) {
  const look = LOOK[format];
  const mins = look.shares.map((s) => Math.max(1, Math.round(s * len)));
  const others = mins.reduce((sum, m, i) => sum + (i === look.core ? 0 : m), 0);
  mins[look.core] = Math.max(1, len - others);
  return mins;
}

// Reactions are saved in English (the server checks them); show them in the current language.
export const REACTIONS = ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'];
export const reactionLabel = (r) => t('reactions')[REACTIONS.indexOf(r)] || r;
