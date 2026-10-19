// Shared bits of UI: icons, avatars, the logo, pills, the bottom nav and the toast.

import { html, raw } from './html.js';
import { FORMATS } from './formats.js';

const PATHS = {
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3"/>',
  bag: '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9C10 5 6.5 5 6.5 7S9.5 9 12 9zm0 0c2-4 5.5-4 5.5-2S14.5 9 12 9z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  screen: '<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M10 8.5v5l4-2.5z"/><path d="M8 21h8"/>',
  bubbles: '<path d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-5 3.5V6z"/><path d="M19 9h.5a1.5 1.5 0 0 1 1.5 1.5V20l-3-2.5h-6a2 2 0 0 1-2-2"/>',
  book: '<path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
};

export function icon(name, size = 20, width = 2) {
  return raw(`<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`);
}

export const PALETTE = [
  ['#FBD9C4', '#8A3510'], ['#D2F0E3', '#11684F'], ['#E4DCF8', '#5232A3'], ['#D4E6F9', '#1D4F8F'],
  ['#F7D5E0', '#962553'], ['#F8E7B5', '#744F00'], ['#E6E1DA', '#4A433D']
];

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : ':)';
}

// opts: font (px), cls, alt (gives it an accessible name; otherwise it is decorative), title, display
export function avatar(u, size = 28, opts = {}) {
  const [bg, fg] = PALETTE[(u.color ?? 0) % PALETTE.length];
  const cls = ['avatar', opts.display ? 'display' : '', opts.cls || ''].join(' ').trim();
  const dim = `width:${size}px;height:${size}px`;
  if (u.photo) {
    return html`<img class="${cls}" src="${u.photo}" alt="${opts.alt || ''}" ${opts.title ? html`title="${opts.title}"` : ''} width="${size}" height="${size}" style="${dim}">`;
  }
  const a11y = opts.alt ? html`role="img" aria-label="${opts.alt}"` : raw('aria-hidden="true"');
  return html`<span class="${cls}" ${a11y} ${opts.title ? html`title="${opts.title}"` : ''} style="${dim};background:${bg};color:${fg};font-size:${opts.font || Math.round(size * 0.38)}px">${u.initials || initialsOf(u.name)}</span>`;
}

export function logoMark(size = 36) {
  const inner = Math.round(size * 0.66);
  return raw(`<span class="logo-mark" style="width:${size}px;height:${size}px"><svg width="${inner}" height="${inner}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5" fill="#FFFFFF"/><circle cx="15" cy="12" r="5" fill="none" stroke="#FFFFFF" stroke-width="2"/></svg></span>`);
}

export const brand = () => html`<span class="brand">${logoMark()}<span class="brand-name display">Teach Club</span></span>`;

export function formatPill(key, { onHero = false } = {}) {
  const f = FORMATS[key];
  return html`<span class="pill" style="background:${onHero ? '#FFFFFF' : f.bg};color:${f.fg}">${icon(f.icon, 14, 2.2)}${f.label}</span>`;
}

export function dotPill(key) {
  const f = FORMATS[key];
  return html`<span class="pill" style="background:${f.bg};color:${f.fg}"><span class="dot" style="background:${f.dot}"></span>${f.label}</span>`;
}

export function bottomNav(active) {
  const item = (key, href, ic, label) => html`<a href="${href}" class="nav-item ${active === key ? 'on' : ''}" ${active === key ? raw('aria-current="page"') : ''}>${icon(ic, 24)}${label}</a>`;
  return html`<nav class="bottom-nav" aria-label="Main">
    ${item('calendar', '/', 'calendar', 'Calendar')}
    <a href="/create/new" class="nav-fab" aria-label="Teach something">${icon('plus', 26, 2.4)}</a>
    ${item('profile', '/profile', 'user', 'Profile')}
  </nav>`;
}

export const isWebLink = (s) => /^https?:\/\/\S+$/i.test(String(s || '').trim());

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}

export function busy(button, on, label) {
  if (!button) return;
  if (on) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    if (label) button.textContent = label;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

export function showError(id, message) {
  const el = document.getElementById(id);
  if (!el) return toast(message);
  el.textContent = message;
  el.hidden = !message;
  if (message) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
