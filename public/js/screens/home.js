// Home: the month calendar and the selected day's lessons. Phone layout below 900px, desktop above.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, render, isWide } from '../core.js';
import { fmt, ORDER } from '../formats.js';
import { t, tp } from '../i18n.js';
import { avatar, brand, icon, formatPill, dotPill, bottomNav, desktopHeader } from '../ui.js';
import { isInstalled, installBannerOff } from '../install.js';
import { iso, parse, isDate, today, addDays, fmtTime, longDay, monthYear, wdShort, minutes, localize, dayStartMs } from '../dates.js';

function gridRange(y, m) {
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return {
    start: iso(new Date(y, m, 1 - ((first.getDay() + 6) % 7))),
    end: iso(new Date(y, m + 1, 6 - ((last.getDay() + 6) % 7)))
  };
}

function cells(s) {
  const { start, end } = gridRange(s.y, s.m);
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

async function fetchMonth(s) {
  const { start, end } = gridRange(s.y, s.m);
  const { lessons } = await api(`/lessons?from=${dayStartMs(start)}&to=${dayStartMs(addDays(end, 1))}&scope=${s.scope}`);
  s.lessons = lessons.map(localize);
}

// Which calendar: your club, people you follow, or both. Remembered on this device.
const SCOPES = ['club', 'following', 'all'];
function savedScope() {
  let v = null;
  try {
    v = localStorage.getItem('tc_scope');
  } catch {
    // storage blocked
  }
  if (!app.club) return 'following';
  return SCOPES.includes(v) ? v : 'all';
}

function scopeSwitch(s) {
  if (!app.club) return '';
  return html`<div class="seg-switch" role="radiogroup" aria-label="${t('feed.label')}">
    ${SCOPES.map((k) => html`<button role="radio" aria-checked="${s.scope === k ? 'true' : 'false'}" class="${s.scope === k ? 'on' : ''}" data-action="scope" data-scope="${k}">${t(`feed.${k}`)}</button>`)}
  </div>`;
}

function reasonText(r) {
  if (r.kind === 'topic') return t('feed.reasons.topic', { topic: t(`topics.${r.topic}`) });
  if (r.kind === 'friends') return tp('friendsGoing', r.n);
  if (r.kind === 'format') return t('feed.reasons.format', { format: fmt(r.format).label });
  return t(`feed.reasons.${r.kind}`, { name: r.name });
}

function forYouStrip(s) {
  if (!s.forYou.length) return '';
  return html`<section class="for-you">
    <h2 class="display h-20 pad-x-4 row gap-8">${icon('sparkle', 20)}${t('feed.forYou')}</h2>
    <div class="fy-row">${s.forYou.map(({ lesson: l, reasons }) => {
      const f = fmt(l.format);
      return html`<a class="card fy-card" href="/lesson/${l.id}">
        <span class="fy-top" style="background:${f.bg};color:${f.fg}">${icon(f.icon, 16, 2.2)}<span>${shortWhen(l)}</span></span>
        <strong class="fy-title"><bdi>${l.title}</bdi></strong>
        <span class="who small">${avatar(l.host, 22, { font: 9 })}${l.host.firstName}</span>
        ${reasons[0] ? html`<span class="fy-why">${reasonText(reasons[0])}</span>` : ''}
      </a>`;
    })}</div>
  </section>`;
}

const shortWhen = (l) => `${l.date === today() ? t('home.today') : longDay(l.date)} · ${fmtTime(l.time)}`;

function noClubCard() {
  if (app.club) return '';
  return html`<section class="card pad-18 stack-10 no-club">
    <strong class="display h-19">${t('feed.noClubTitle')}</strong>
    <span class="body-3">${t('feed.noClubBody')}</span>
    <a class="btn btn-soft btn-sm self-start" href="/clubs/start">${icon('users', 18)}${t('feed.noClubButton')}</a>
  </section>`;
}

function installBanner() {
  if (isInstalled() || installBannerOff()) return '';
  return html`<section class="install-banner">
    <img src="/icons/icon-192.png" alt="" width="40" height="40">
    <span class="grow stack-0"><strong>${t('installStep.bannerTitle')}</strong><span class="small muted">${t('installStep.bannerBody')}</span></span>
    <a class="btn btn-primary btn-sm" href="/install?then=/">${t('installStep.show')}</a>
    <button class="icon-btn small" data-action="hideBanner" aria-label="${t('installStep.dismiss')}">${icon('close', 14, 2.6)}</button>
  </section>`;
}

const whereTag = (l) => (l.mode && l.mode !== 'online' ? html`<span class="where-tag">${icon('pin', 13, 2.2)}<bdi>${l.area || t(`feed.modes.${l.mode}`)}</bdi></span>` : '');

function byDate(s) {
  const map = {};
  for (const l of s.lessons) (map[l.date] ||= []).push(l);
  return map;
}

async function moveMonth(s, delta) {
  const d = new Date(s.y, s.m + delta, 1);
  s.y = d.getFullYear();
  s.m = d.getMonth();
  const now = parse(today());
  s.sel = now.getFullYear() === s.y && now.getMonth() === s.m ? today() : iso(d);
  await fetchMonth(s);
  render();
}

const inMonth = (s, d) => parse(d).getMonth() === s.m;
const countLabel = (n) => (n ? tp('lessons', n) : '');
const who = (l) => (l.host.id === app.me.id ? t('common.you') : l.host.firstName);
const weekdays = () => [0, 1, 2, 3, 4, 5, 6].map((i) => html`<span>${wdShort(i)}</span>`);

function dayAria(d, list) {
  return `${longDay(d)}, ${tp('lessons', list.length)}`;
}

function selLabel(s) {
  return (s.sel === today() ? t('home.todayPrefix') : '') + longDay(s.sel);
}

function emptyDay(s, wide) {
  const future = s.sel >= today();
  return html`<div class="empty-day">
    <strong class="display">${future ? t('home.emptyTitle') : t('home.emptyPast')}</strong>
    <span class="muted">${future ? (wide ? t('home.emptyWide') : t('home.emptyBody')) : t('home.emptyPastBody')}</span>
    ${future ? html`<a class="btn btn-soft btn-sm mt-4" href="/create/new?date=${s.sel}">${t('home.teachOnDay')}</a>` : ''}
  </div>`;
}

function goingTag(l) {
  return l.going ? html`<span class="going-tag">${icon('check', 14, 2.6)}${t('home.going')}</span>` : '';
}

function legend(dotSize, long) {
  return html`<div class="legend">${ORDER.map((k) => {
    const f = fmt(k);
    return html`<span><span class="dot" style="width:${dotSize}px;height:${dotSize}px;background:${f.dot}"></span>${long ? f.label : f.legend}</span>`;
  })}</div>`;
}

function monthButtons() {
  return {
    prev: html`<button class="round-btn" data-action="prev" aria-label="${t('home.prev')}">${icon('chevronLeft', 20, 2.2)}</button>`,
    next: html`<button class="round-btn" data-action="next" aria-label="${t('home.next')}">${icon('chevronRight', 20, 2.2)}</button>`
  };
}

// ---------- phone ----------

function mobileCell(s, d, map) {
  const ok = inMonth(s, d);
  const list = ok ? map[d] || [] : [];
  const sel = ok && d === s.sel;
  const cls = ['cal-cell', sel ? 'sel' : '', !sel && d === today() ? 'today' : '', ok ? '' : 'out'].join(' ');
  return html`<button class="${cls}" data-action="pick" data-day="${d}" ${ok ? '' : raw('disabled')} aria-pressed="${sel ? 'true' : 'false'}" aria-label="${ok ? dayAria(d, list) : t('home.outside')}">
    <span>${parse(d).getDate()}</span>
    <span class="dots">${list.slice(0, 3).map((l) => html`<span class="dot" style="background:${sel ? '#FFFFFF' : fmt(l.format).dot}"></span>`)}</span>
  </button>`;
}

function mobileLesson(l) {
  return html`<a class="card lesson-card" href="/lesson/${l.id}">
    <div class="lc-when"><span class="lc-time">${fmtTime(l.time)}</span><span class="small muted">${minutes(l.length)}</span></div>
    <div class="lc-body">
      <span class="lc-title display"><bdi>${l.title}</bdi></span>
      <div class="lc-meta">
        <span class="who">${avatar(l.host, 28, { font: 11 })}${who(l)}${goingTag(l)}</span>
        ${whereTag(l)}
        ${formatPill(l.format)}
      </div>
    </div>
  </a>`;
}

function mobileView(s) {
  const map = byDate(s);
  const list = map[s.sel] || [];
  const b = monthButtons();
  return html`
<div class="screen with-nav">
  <header class="home-head">
    ${brand()}
    <a href="/profile" class="me-link" aria-label="${t('nav.yourProfile')}">${avatar(app.me, 44, { font: 15 })}</a>
  </header>

  <section class="home-hero">
    ${app.club ? html`<a class="club-chip" href="/club">${icon('users', 16)}<bdi>${app.club.name}</bdi></a>` : ''}
    <h1 class="display h-30">${t('home.hi', { name: app.me.firstName })}</h1>
    <a class="btn btn-primary btn-xl shadow" href="/create/new">${icon('plus', 22, 2.4)}${t('nav.teach')}</a>
    <p class="small muted center">${t('home.teachSub')}</p>
  </section>

  ${installBanner()}
  ${noClubCard()}
  ${forYouStrip(s)}
  <div class="px-16 mt-20">${scopeSwitch(s)}</div>

  <section class="card cal-m">
    <div class="cal-head">${b.prev}<h2 class="display h-20">${monthYear(s.y, s.m)}</h2>${b.next}</div>
    <div class="wd-row">${weekdays()}</div>
    <div class="cal-grid">${cells(s).map((d) => mobileCell(s, d, map))}</div>
    ${legend(8, false)}
  </section>

  <section class="day-list">
    <div class="day-head"><h2 class="display h-20">${selLabel(s)}</h2><span class="small muted">${countLabel(list.length)}</span></div>
    ${list.length ? html`<div class="stack-12">${list.map(mobileLesson)}</div>` : emptyDay(s, false)}
  </section>

  ${bottomNav('calendar')}
</div>`;
}

// ---------- desktop ----------

function desktopCell(s, d, map) {
  const ok = inMonth(s, d);
  const list = ok ? map[d] || [] : [];
  const sel = ok && d === s.sel;
  const cls = ['dk-cell', sel ? 'sel' : '', !sel && d === today() ? 'today' : '', ok ? '' : 'out'].join(' ');
  return html`<button class="${cls}" data-action="pick" data-day="${d}" ${ok ? '' : raw('disabled')} aria-pressed="${sel ? 'true' : 'false'}" aria-label="${ok ? dayAria(d, list) : t('home.outside')}">
    <span class="dk-n">${parse(d).getDate()}</span>
    ${list.slice(0, 3).map((l) => {
      const f = fmt(l.format);
      return html`<span class="chip-line" style="background:${f.bg};color:${f.fg}"><span class="dot" style="background:${f.dot}"></span><span class="chip-t"><bdi>${l.title}</bdi></span></span>`;
    })}
    ${list.length > 3 ? html`<span class="small muted">${t('home.more', { n: list.length - 3 })}</span>` : ''}
  </button>`;
}

function desktopLesson(l) {
  return html`<a class="card dk-lesson" href="/lesson/${l.id}">
    <div class="row-between">
      <span class="strong">${fmtTime(l.time)} <span class="muted normal">· ${minutes(l.length)}</span></span>
      ${dotPill(l.format)}
    </div>
    <span class="display dk-title"><bdi>${l.title}</bdi></span>
    <span class="who">${avatar(l.host, 28, { font: 11 })}${who(l)}${goingTag(l)}</span>
  </a>`;
}

function desktopView(s) {
  const map = byDate(s);
  const list = map[s.sel] || [];
  const b = monthButtons();
  const month = s.lessons.filter((l) => inMonth(s, l.date));
  const hosts = new Set(month.map((l) => l.host.id)).size;
  const summary = month.length
    ? t('home.summary', { lessons: tp('lessons', month.length), friends: tp('friends', hosts) })
    : t('home.summaryEmpty');
  return html`
<div class="dk">
  ${desktopHeader('calendar', app.me)}

  <main class="dk-main">
    <section class="card dk-cal">
      <div class="dk-cal-head">
        <div>
          <h1 class="display h-30">${monthYear(s.y, s.m)}</h1>
          <p class="muted mt-4">${summary}</p>
        </div>
        <div class="row gap-8">
          ${b.prev}
          <button class="pill-round" data-action="goToday">${t('home.today')}</button>
          ${b.next}
        </div>
      </div>
      ${scopeSwitch(s)}
      <div class="wd-row dk-wd">${weekdays()}</div>
      <div class="dk-grid">${cells(s).map((d) => desktopCell(s, d, map))}</div>
      ${legend(9, true)}
    </section>

    <aside class="dk-aside">
      ${noClubCard()}
      ${forYouStrip(s)}
      <div class="day-head"><h2 class="display h-22">${selLabel(s)}</h2><span class="small muted">${countLabel(list.length)}</span></div>
      ${list.length ? list.map(desktopLesson) : emptyDay(s, true)}
      <div class="promo">
        <strong class="display">${t('home.promoTitle')}</strong>
        <span>${t('home.promoBody')}</span>
        <a class="btn btn-primary btn-sm self-start" href="/create/new">${t('nav.teach')}</a>
      </div>
    </aside>
  </main>
</div>`;
}

export const home = {
  title: () => t('home.title'),
  responsive: true,
  async load({ query }) {
    const day = isDate(query.get('day')) ? query.get('day') : today();
    const d = parse(day);
    const s = { y: d.getFullYear(), m: d.getMonth(), sel: day, lessons: [], forYou: [], scope: savedScope() };
    const [, fy] = await Promise.all([fetchMonth(s), api('/for-you').catch(() => ({ suggestions: [] }))]);
    s.forYou = fy.suggestions.map((x) => ({ ...x, lesson: localize(x.lesson) }));
    return s;
  },
  view: (s) => (isWide() ? desktopView(s) : mobileView(s)),
  actions: {
    prev: (s) => moveMonth(s, -1),
    next: (s) => moveMonth(s, 1),
    async goToday(s) {
      const now = parse(today());
      s.y = now.getFullYear();
      s.m = now.getMonth();
      s.sel = today();
      await fetchMonth(s);
      render();
    },
    pick(s, el) {
      s.sel = el.dataset.day;
      render();
    },
    async scope(s, el) {
      s.scope = el.dataset.scope;
      try {
        localStorage.setItem('tc_scope', s.scope);
      } catch {
        // storage blocked
      }
      await fetchMonth(s);
      render();
    },
    hideBanner() {
      installBannerOff(true);
      render();
    }
  }
};
