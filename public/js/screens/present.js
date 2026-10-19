// Presenter mode: a big countdown that walks the host through their time plan, part by part.
// The clock runs in the browser and updates in place (no re-render), and the screen is kept awake.

import { html } from '../html.js';
import { render, navigate } from '../core.js';
import { fmt } from '../formats.js';
import { t } from '../i18n.js';
import { icon } from '../ui.js';
import { fetchLesson, planParts } from './lesson.js';

let ticker = 0;
let wakeLock = null;

async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    // not supported or not allowed: the timer still works
  }
}

const clock = (ms) => {
  const neg = ms < 0;
  const total = Math.ceil(Math.abs(ms) / 1000);
  return `${neg ? '+' : ''}${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// Time left in the current part, in milliseconds.
function left(s) {
  const used = s.elapsed + (s.running ? Date.now() - s.since : 0);
  return s.parts[s.i].min * 60000 + s.extra[s.i] - used;
}

function tick(s) {
  const el = document.getElementById('present-clock');
  if (!el) return stop(s);
  const ms = left(s);
  el.textContent = clock(ms);
  el.classList.toggle('over', ms < 0);
  const fill = document.getElementById('present-fill');
  const full = s.parts[s.i].min * 60000 + s.extra[s.i];
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, 100 - (ms / full) * 100))}%`;
  const label = document.getElementById('present-over');
  if (label) label.hidden = ms >= 0;
}

function stop(s) {
  clearInterval(ticker);
  ticker = 0;
  if (s) s.running = false;
  keepAwake(false);
}

function moveTo(s, i) {
  s.i = Math.max(0, Math.min(s.parts.length - 1, i));
  s.elapsed = 0;
  s.since = Date.now();
  render();
}

export const present = {
  title: () => t('present.title'),
  async load({ params }) {
    const l = await fetchLesson(params[0]);
    if (!l.isHost) return { redirect: `/lesson/${l.id}` };
    const parts = l.plan && l.plan.length ? planParts(l) : [];
    return { l, parts, i: 0, running: false, elapsed: 0, since: 0, extra: parts.map(() => 0), finished: false };
  },
  view(s) {
    const f = fmt(s.l.format);
    if (!s.parts.length) {
      return html`<main class="screen pad-auth center-col gap-22"><p class="lede">${t('present.noPlan')}</p>
        <a class="btn btn-primary btn-md" href="/lesson/${s.l.id}">${t('present.back')}</a></main>`;
    }
    if (s.finished) {
      return html`<main class="present" style="background:${f.bg}">
        <div class="present-done center-col gap-22">
          ${icon('check', 64, 2.6)}
          <h1 class="display h-34">${t('present.done')}</h1>
          <a class="btn btn-primary btn-lg" href="/lesson/${s.l.id}" data-action="leave">${t('present.back')}</a>
        </div>
      </main>`;
    }
    const part = s.parts[s.i];
    const next = s.parts[s.i + 1];
    return html`
<main class="present" style="background:${f.bg}">
  <div class="present-top">
    <a class="icon-btn" href="/lesson/${s.l.id}" data-action="leave" aria-label="${t('present.back')}">${icon('close', 18, 2.2)}</a>
    <span class="small strong" style="color:${f.fg}">${t('present.partOf', { n: s.i + 1, total: s.parts.length })}</span>
    <span class="spacer-44"></span>
  </div>

  <div class="present-steps" aria-hidden="true">${s.parts.map((p, i) => html`<span class="${i < s.i ? 'done' : i === s.i ? 'on' : ''}" style="flex:${p.min} 1 0;--c:${f.ramp[i % f.ramp.length]}"></span>`)}</div>

  <section class="present-main">
    <h1 class="display present-name" style="color:${f.fg}">${part.name}</h1>
    <p class="present-desc pre-line" dir="auto">${part.desc}</p>
    <div class="present-clock" id="present-clock" role="timer" aria-live="off">${clock(left(s))}</div>
    <span class="present-over" id="present-over" hidden>${t('present.overtime')}</span>
    <div class="present-bar"><span id="present-fill"></span></div>
    <p class="small muted">${next ? t('present.upNext', { name: next.name }) : t('present.last')}</p>
  </section>

  <div class="present-controls">
    <button class="round-btn big" data-action="prev" aria-label="${t('present.prev')}" ${s.i === 0 ? 'disabled' : ''}>${icon('back', 22, 2.2)}</button>
    <button class="btn btn-primary btn-xl present-play" data-action="toggle">${s.running ? icon('pause', 22, 2.6) : icon('play', 22, 2.4)}${s.running ? t('present.pause') : s.elapsed ? t('present.resume') : t('present.start')}</button>
    ${next
      ? html`<button class="round-btn big" data-action="next" aria-label="${t('present.next')}">${icon('skip', 22, 2.2)}</button>`
      : html`<button class="round-btn big" data-action="finish" aria-label="${t('present.finish')}">${icon('check', 22, 2.6)}</button>`}
  </div>
  <div class="row-center gap-8">
    <button class="chip-btn" data-action="minus">${t('present.minus')}</button>
    <button class="chip-btn" data-action="plus">${t('present.plus')}</button>
  </div>
  <p class="tiny muted center">${t('present.awake')}</p>
</main>`;
  },
  after(s) {
    clearInterval(ticker);
    if (s.running) {
      ticker = setInterval(() => tick(s), 250);
      tick(s);
    }
  },
  actions: {
    toggle(s) {
      if (s.running) {
        s.elapsed += Date.now() - s.since;
        stop(s);
      } else {
        s.running = true;
        s.since = Date.now();
        keepAwake(true);
      }
      render();
    },
    next(s) {
      moveTo(s, s.i + 1);
    },
    prev(s) {
      moveTo(s, s.i - 1);
    },
    plus(s) {
      s.extra[s.i] += 60000;
      render();
    },
    minus(s) {
      s.extra[s.i] = Math.max(-(s.parts[s.i].min - 1) * 60000, s.extra[s.i] - 60000);
      render();
    },
    finish(s) {
      stop(s);
      s.finished = true;
      render();
    },
    leave(s, el) {
      stop(s);
      navigate(el.getAttribute('href'));
    }
  }
};
