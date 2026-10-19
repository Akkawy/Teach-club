// Home: the month calendar and the selected day's lessons. Phone layout below 900px, desktop above.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, render, isWide } from '../core.js';
import { FORMATS, ORDER } from '../formats.js';
import { avatar, brand, icon, formatPill, dotPill, bottomNav } from '../ui.js';
import { MONTHS, WD_SHORT, iso, parse, isDate, today, addDays, fmtTime, longDay } from '../dates.js';

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
  const { lessons } = await api(`/lessons?from=${start}&to=${end}`);
  s.lessons = lessons;
}

function byDate(s) {
  const map = {};
  for (const l of s.lessons) (map[l.date] ||= []).push(l);
  return map;
}

async function moveMonth(s, delta) {
  const d = new Date(s.y, s.m + delta, 1);
  s.y = d.getFullYear();
  s.m = d.getMonth();
  const t = parse(today());
  s.sel = t.getFullYear() === s.y && t.getMonth() === s.m ? today() : iso(d);
  await fetchMonth(s);
  render();
}

const inMonth = (s, d) => parse(d).getMonth() === s.m;
const countLabel = (n) => (n ? `${n} ${n > 1 ? 'lessons' : 'lesson'}` : '');
const who = (l) => (l.host.id === app.me.id ? 'You' : l.host.firstName);

function dayAria(d, list) {
  return `${longDay(d)}, ${list.length ? countLabel(list.length) : 'no lessons'}`;
}

function selLabel(s) {
  return (s.sel === today() ? 'Today, ' : '') + longDay(s.sel);
}

function monthLessons(s) {
  return s.lessons.filter((l) => inMonth(s, l.date));
}

function emptyDay(s, wide) {
  const future = s.sel >= today();
  return html`<div class="empty-day">
    <strong class="display">${future ? 'Nothing planned yet' : 'Nothing happened this day'}</strong>
    <span class="muted">${future ? (wide ? 'This day is wide open.' : 'This day is wide open. Got 10 minutes of something you love?') : 'Pick another day to see what friends taught.'}</span>
    ${future ? html`<a class="btn btn-soft btn-sm mt-4" href="/create/new?date=${s.sel}">Teach on this day</a>` : ''}
  </div>`;
}

function goingTag(l) {
  return l.going ? html`<span class="going-tag">${icon('check', 14, 2.6)}Going</span>` : '';
}

// ---------- phone ----------

function mobileCell(s, d, map) {
  const ok = inMonth(s, d);
  const list = ok ? map[d] || [] : [];
  const sel = ok && d === s.sel;
  const cls = ['cal-cell', sel ? 'sel' : '', !sel && d === today() ? 'today' : '', ok ? '' : 'out'].join(' ');
  return html`<button class="${cls}" data-action="pick" data-day="${d}" ${ok ? '' : raw('disabled')} aria-pressed="${sel ? 'true' : 'false'}" aria-label="${ok ? dayAria(d, list) : 'Outside this month'}">
    <span>${parse(d).getDate()}</span>
    <span class="dots">${list.slice(0, 3).map((l) => html`<span class="dot" style="background:${sel ? '#FFFFFF' : FORMATS[l.format].dot}"></span>`)}</span>
  </button>`;
}

function mobileLesson(l) {
  return html`<a class="card lesson-card" href="/lesson/${l.id}">
    <div class="lc-when"><span class="lc-time">${fmtTime(l.time)}</span><span class="small muted">${l.length} min</span></div>
    <div class="lc-body">
      <span class="lc-title display">${l.title}</span>
      <div class="lc-meta">
        <span class="who">${avatar(l.host, 28, { font: 11 })}${who(l)}${goingTag(l)}</span>
        ${formatPill(l.format)}
      </div>
    </div>
  </a>`;
}

function legend(dotSize, long) {
  return html`<div class="legend">${ORDER.map((k) => html`<span><span class="dot" style="width:${dotSize}px;height:${dotSize}px;background:${FORMATS[k].dot}"></span>${long ? FORMATS[k].label : FORMATS[k].legend}</span>`)}</div>`;
}

function monthButtons() {
  return {
    prev: html`<button class="round-btn" data-action="prev" aria-label="Previous month">${icon('chevronLeft', 20, 2.2)}</button>`,
    next: html`<button class="round-btn" data-action="next" aria-label="Next month">${icon('chevronRight', 20, 2.2)}</button>`
  };
}

function mobileView(s) {
  const map = byDate(s);
  const list = map[s.sel] || [];
  const b = monthButtons();
  return html`
<div class="screen with-nav">
  <header class="home-head">
    ${brand()}
    <a href="/profile" class="me-link" aria-label="Your profile">${avatar(app.me, 44, { font: 15 })}</a>
  </header>

  <section class="home-hero">
    <h1 class="display h-30">Hi ${app.me.firstName}, here's what's coming up</h1>
    <a class="btn btn-primary btn-xl shadow" href="/create/new">${icon('plus', 22, 2.4)}Teach something</a>
    <p class="small muted center">5 to 30 minutes. We'll help you plan it.</p>
  </section>

  <section class="card cal-m">
    <div class="cal-head">${b.prev}<h2 class="display h-20">${MONTHS[s.m]} ${s.y}</h2>${b.next}</div>
    <div class="wd-row">${WD_SHORT.map((w) => html`<span>${w}</span>`)}</div>
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
  return html`<button class="${cls}" data-action="pick" data-day="${d}" ${ok ? '' : raw('disabled')} aria-pressed="${sel ? 'true' : 'false'}" aria-label="${ok ? dayAria(d, list) : 'Outside this month'}">
    <span class="dk-n">${parse(d).getDate()}</span>
    ${list.slice(0, 3).map((l) => {
      const f = FORMATS[l.format];
      return html`<span class="chip-line" style="background:${f.bg};color:${f.fg}"><span class="dot" style="background:${f.dot}"></span><span class="chip-t">${l.title}</span></span>`;
    })}
    ${list.length > 3 ? html`<span class="small muted">+${list.length - 3} more</span>` : ''}
  </button>`;
}

function desktopLesson(l) {
  return html`<a class="card dk-lesson" href="/lesson/${l.id}">
    <div class="row-between">
      <span class="strong">${fmtTime(l.time)} <span class="muted normal">آ· ${l.length} min</span></span>
      ${dotPill(l.format)}
    </div>
    <span class="display dk-title">${l.title}</span>
    <span class="who">${avatar(l.host, 28, { font: 11 })}${who(l)}${goingTag(l)}</span>
  </a>`;
}

function desktopView(s) {
  const map = byDate(s);
  const list = map[s.sel] || [];
  const b = monthButtons();
  const month = monthLessons(s);
  const hosts = new Set(month.map((l) => l.host.id)).size;
  const summary = month.length
    ? `${countLabel(month.length)} from ${hosts} ${hosts > 1 ? 'friends' : 'friend'} this month`
    : 'No lessons this month yet. Be the first!';
  return html`
<div class="dk">
  <header class="dk-header">
    <div class="dk-inner">
      ${brand()}
      <nav class="dk-nav" aria-label="Main">
        <a href="/" class="on" aria-current="page">Calendar</a>
        <a href="/profile">My lessons</a>
      </nav>
      <div class="dk-right">
        <a class="btn btn-primary btn-sm" href="/create/new">${icon('plus', 20, 2.4)}Teach something</a>
        <a href="/profile" class="me-link" aria-label="Your profile">${avatar(app.me, 44, { font: 15 })}</a>
      </div>
    </div>
  </header>

  <main class="dk-main">
    <section class="card dk-cal">
      <div class="dk-cal-head">
        <div>
          <h1 class="display h-30">${MONTHS[s.m]} ${s.y}</h1>
          <p class="muted mt-4">${summary}</p>
        </div>
        <div class="row gap-8">
          ${b.prev}
          <button class="pill-round" data-action="goToday">Today</button>
          ${b.next}
        </div>
      </div>
      <div class="wd-row dk-wd">${WD_SHORT.map((w) => html`<span>${w}</span>`)}</div>
      <div class="dk-grid">${cells(s).map((d) => desktopCell(s, d, map))}</div>
      ${legend(9, true)}
    </section>

    <aside class="dk-aside">
      <div class="day-head"><h2 class="display h-22">${selLabel(s)}</h2><span class="small muted">${countLabel(list.length)}</span></div>
      ${list.length ? list.map(desktopLesson) : emptyDay(s, true)}
      <div class="promo">
        <strong class="display">Know something small and fun?</strong>
        <span>That's a lesson. Ten minutes on how you fold a fitted sheet counts.</span>
        <a class="btn btn-primary btn-sm self-start" href="/create/new">Teach something</a>
      </div>
    </aside>
  </main>
</div>`;
}

export const home = {
  title: 'Calendar',
  responsive: true,
  async load({ query }) {
    const day = isDate(query.get('day')) ? query.get('day') : today();
    const d = parse(day);
    const s = { y: d.getFullYear(), m: d.getMonth(), sel: day, lessons: [] };
    await fetchMonth(s);
    return s;
  },
  view: (s) => (isWide() ? desktopView(s) : mobileView(s)),
  actions: {
    prev: (s) => moveMonth(s, -1),
    next: (s) => moveMonth(s, 1),
    async goToday(s) {
      const t = parse(today());
      s.y = t.getFullYear();
      s.m = t.getMonth();
      s.sel = today();
      await fetchMonth(s);
      render();
    },
    pick(s, el) {
      s.sel = el.dataset.day;
      render();
    }
  }
};
