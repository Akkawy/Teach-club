// The welcome walkthrough: five swipeable slides that explain what Teach Club is.
// First-time visitors see it before logging in or signing up; anyone can replay it from /intro.

import { html, raw } from '../html.js';
import { app, navigate } from '../core.js';
import { fmt, ORDER } from '../formats.js';
import { t, lang } from '../i18n.js';
import { avatar, icon, logoMark, langToggle } from '../ui.js';
import { minShort } from '../dates.js';

const SEEN = 'tc_intro_seen';

export function introSeen() {
  try {
    return localStorage.getItem(SEEN) === '1';
  } catch {
    return true; // without storage, don't trap people in the intro
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN, '1');
  } catch {
    // ignore
  }
}

const sparkle = (size, color, style) =>
  raw(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;${style}"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="${color}"/></svg>`);

const friend = (initials, color) => ({ initials, color, photo: null });

const ART = [
  () => html`<div class="art-stack">
    ${logoMark(116)}
    ${sparkle(34, '#D99A12', 'inset-inline-start:-34px;top:-6px')}
    ${sparkle(22, '#3A7BD5', 'inset-inline-end:-26px;top:-14px')}
    ${raw('<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;inset-inline-end:-34px;bottom:4px"><circle cx="12" cy="12" r="7" fill="#D24E7C"/></svg>')}
  </div>`,
  () => html`<div class="art-formats">${ORDER.map((k) => {
    const f = fmt(k);
    return html`<span class="art-tile" style="background:${f.bg}">${raw(f.art)}<span style="color:${f.fg}">${f.legend}</span></span>`;
  })}</div>`,
  () => {
    const f = fmt('talk');
    const mins = [3, 12, 3, 2];
    return html`<div class="art-card">
      <div class="row-between"><strong class="display art-big">20<span class="muted"> / 20</span></strong>${icon('check', 22, 2.6)}</div>
      <div class="seg-bar">${mins.map((m, i) => html`<span style="flex:${m} 1 0;background:${f.ramp[i]}"></span>`)}</div>
      <ol class="plain stack-8">${f.plan.slice(0, 3).map(([name], i) => html`<li class="row-between small"><span class="row gap-8"><span class="seg-swatch mini" style="background:${f.ramp[i]}"></span>${name}</span><strong>${minShort(mins[i])}</strong></li>`)}</ol>
    </div>`;
  },
  () => html`<div class="art-card center-col gap-14">
    <div class="faces">
      ${avatar(friend('PN', 1), 46, { cls: 'face' })}${avatar(friend('JW', 2), 46, { cls: 'face' })}${avatar(friend('LM', 3), 46, { cls: 'face' })}${avatar(friend('AR', 4), 46, { cls: 'face' })}
    </div>
    <span class="btn btn-primary btn-md art-btn">${t('lesson.imIn')}</span>
    <span class="art-note">${icon('heart', 18)}${t('reactions')[0]}</span>
  </div>`,
  () => html`<div class="art-stack">
    ${raw(`<svg width="132" height="132" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#F0C455"/>
      <path d="M20 26c1.5-3 6.5-3 8 0M36 26c1.5-3 6.5-3 8 0" stroke="#4A3300" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M18 35h28c0 9-6.3 15-14 15s-14-6-14-15z" fill="#4A3300"/>
      <path d="M24 44c2.3 2.2 5 3.2 8 3.2s5.7-1 8-3.2c-2.4-1.6-5.1-2.4-8-2.4s-5.6.8-8 2.4z" fill="#D24E7C"/>
      <circle cx="14" cy="36" r="3.5" fill="#F7A28C" opacity=".8"/><circle cx="50" cy="36" r="3.5" fill="#F7A28C" opacity=".8"/>
    </svg>`)}
    ${sparkle(26, '#CC4A14', 'inset-inline-start:-20px;top:4px')}
    ${sparkle(18, '#7B5AD4', 'inset-inline-end:-14px;bottom:10px')}
  </div>`
];

const BG = ['#FCE9DD', '#FFFFFF', '#E4EEFB', '#DDF2EA', '#FBEFD0'];
const COUNT = ART.length;

function footerActions(s) {
  if (s.i < COUNT - 1) {
    return html`<button class="btn btn-primary btn-lg" data-action="next">${t('intro.next')}${icon('chevronRight', 20, 2.4)}</button>`;
  }
  if (app.me) return html`<button class="btn btn-primary btn-lg" data-action="finish" data-to="/">${t('intro.done')}</button>`;
  const loginTo = s.then.startsWith('/login') ? s.then : '/login';
  return html`<div class="stack-10">
    <button class="btn btn-primary btn-lg" data-action="finish" data-to="/signup">${t('intro.join')}</button>
    <button class="btn btn-secondary btn-lg" data-action="finish" data-to="${loginTo}">${t('intro.haveAccount')}</button>
  </div>`;
}

function dots(s) {
  return Array.from({ length: COUNT }, (_, i) => html`<button class="intro-dot ${i === s.i ? 'on' : ''}" data-action="go" data-i="${i}" aria-label="${t('intro.slideOf', { n: i + 1, total: COUNT })}" ${i === s.i ? raw('aria-current="step"') : ''}></button>`);
}

function slidesEl() {
  return document.getElementById('slides');
}

// Which slide is showing (scrollLeft runs negative in right-to-left layouts).
function shownIndex() {
  const el = slidesEl();
  return Math.max(0, Math.min(COUNT - 1, Math.round(Math.abs(el.scrollLeft) / el.clientWidth)));
}

function scrollToSlide(i, smooth) {
  const el = slidesEl();
  const x = i * el.clientWidth * (lang === 'ar' ? -1 : 1);
  el.scrollTo({ left: x, behavior: smooth ? 'smooth' : 'instant' });
  // Some browsers (and reduced-motion setups) skip smooth scrolling; make sure we still arrive.
  if (smooth) {
    setTimeout(() => {
      if (slidesEl() === el && shownIndex() !== i) el.scrollTo({ left: x, behavior: 'instant' });
    }, 700);
  }
}

function goTo(s, i) {
  s.i = i;
  refreshChrome(s);
  scrollToSlide(i, true);
}

function refreshChrome(s) {
  document.getElementById('intro-dots').innerHTML = String(html`${dots(s)}`);
  document.getElementById('intro-actions').innerHTML = String(footerActions(s));
  document.getElementById('intro-skip').hidden = s.i === COUNT - 1;
}

export const intro = {
  title: () => t('intro.title'),
  public: true,
  load({ query }) {
    const then = query.get('then');
    return { i: 0, then: then && then.startsWith('/') && !then.startsWith('//') ? then : '/signup' };
  },
  view: (s) => html`
<main class="screen intro">
  <div class="intro-top">
    ${langToggle()}
    <button class="text-btn" id="intro-skip" data-action="finish" data-to="${app.me ? '/' : s.then}" ${s.i === COUNT - 1 ? raw('hidden') : ''}>${t('intro.skip')}</button>
  </div>

  <div class="slides" id="slides" role="region" aria-roledescription="carousel" aria-label="${t('intro.slides')}">
    ${ART.map((art, i) => html`<section class="slide" aria-roledescription="slide" aria-label="${t('intro.slideOf', { n: i + 1, total: COUNT })}">
      <div class="slide-art" style="background:${BG[i]}" aria-hidden="true">${art()}</div>
      <div class="slide-text">
        ${i === 0 ? html`<h1 class="display h-30">${t('intro.s1t')}</h1>` : html`<h2 class="display h-30">${t(`intro.s${i + 1}t`)}</h2>`}
        <p class="lede">${t(`intro.s${i + 1}b`)}</p>
        ${i === COUNT - 1 ? html`<p class="joke-line">${t('intro.s5c')}</p>` : ''}
      </div>
    </section>`)}
  </div>

  <div class="intro-foot">
    <div class="intro-dots" id="intro-dots">${dots(s)}</div>
    <div id="intro-actions">${footerActions(s)}</div>
  </div>
</main>`,
  after(s) {
    const el = slidesEl();
    scrollToSlide(s.i, false);
    // Update the dots once a swipe settles (works on browsers without the scrollend event too).
    let timer = 0;
    el.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const i = shownIndex();
        if (i !== s.i) {
          s.i = i;
          refreshChrome(s);
        }
      }, 120);
    }, { passive: true });
  },
  actions: {
    next(s) {
      goTo(s, Math.min(COUNT - 1, s.i + 1));
    },
    go(s, el) {
      goTo(s, Number(el.dataset.i));
    },
    finish(s, el) {
      markSeen();
      navigate(el.dataset.to || '/');
    }
  }
};
