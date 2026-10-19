// The six-step "teach something" flow. The draft lives in sessionStorage so a refresh doesn't lose it.
// /create/new starts a draft (optionally ?date= or ?edit=<lesson id>), then /create/1 … /create/6.

import { html, raw } from '../html.js';
import { api, browserTz } from '../api.js';
import { app, navigate, render } from '../core.js';
import { fmt, ORDER, suggestPlan } from '../formats.js';
import { t, tp, lang } from '../i18n.js';
import { avatar, icon, formatPill, toast, busy, isWebLink } from '../ui.js';
import { parse, isDate, today, addDays, daysBetween, weekdayIndex, fmtTime, shortDate, longDay, rangeLabel, wdShort, minutes, minShort, localize, dayStartMs } from '../dates.js';

const KEY = 'tc_draft';
const TIMES = ['12:30', '17:30', '18:00', '18:30', '19:00', '19:30'];
const LENGTHS = [5, 10, 15, 20, 25, 30];

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function saveDraft(d) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // private mode: the draft just won't survive a refresh
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

function newDraft(date) {
  return { editId: null, date, time: '19:00', tz: browserTz, length: 20, title: '', pitch: '', format: 'talk', answers: {}, plan: null, classLink: '', surprise: false, prep: '', wishId: null, parentId: null, origin: '' };
}

function answersOf(d) {
  return d.answers[d.format] || ['', '', ''];
}

function ensurePlan(d) {
  const key = `${d.format}:${d.length}`;
  if (!d.plan || d.plan.key !== key) d.plan = { key, mins: suggestPlan(d.format, d.length) };
  return d.plan.mins;
}

// The outline that gets saved: part names in the author's language, plus their own answers.
function buildPlan(d) {
  const f = fmt(d.format);
  const mins = ensurePlan(d);
  const answers = answersOf(d);
  return f.plan.map(([name, hint], i) => {
    const from = f.descFrom[i];
    return { name, hint, min: mins[i], desc: from == null ? '' : String(answers[from] || '').trim() };
  });
}

// ---------- shared chrome ----------

function header(s, title, subtitle, extra = '') {
  const d = s.draft;
  const back = s.step > 1
    ? html`<a class="icon-btn" href="/create/${s.step - 1}" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>`
    : html`<button class="icon-btn" data-action="close" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</button>`;
  return html`<header class="flow-head">
    <div class="flow-bar">
      ${back}
      <span class="step-label">${d.editId ? t('create.editing') : ''}${t('create.step', { n: s.step })}</span>
      <button class="icon-btn" data-action="close" aria-label="${t('common.close')}">${icon('close', 18, 2.2)}</button>
    </div>
    <div class="progress" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((i) => html`<span class="${i <= s.step ? 'on' : ''}"></span>`)}</div>
    <div class="flow-title">
      ${extra}
      <h1 class="display h-30">${title}</h1>
      <p class="lede">${subtitle}</p>
    </div>
  </header>`;
}

function footer(s, label, action = 'next') {
  return html`<footer class="flow-foot">
    ${s.step > 1 ? html`<a class="btn btn-secondary back-btn" href="/create/${s.step - 1}">${t('common.back')}</a>` : ''}
    <button class="btn btn-primary grow" data-action="${action}">${label}</button>
  </footer>`;
}

// ---------- step 1: when ----------

function dayNote(s) {
  const d = s.draft;
  const same = s.others.filter((l) => l.date === d.date);
  if (!same.length) return t('create.noneThatDay');
  const names = [...new Set(same.map((l) => (l.host.id === app.me.id ? t('common.you') : l.host.firstName)))];
  const comma = lang === 'ar' ? '، ' : ', ';
  const list = names.length === 1 ? names[0] : names.slice(0, -1).join(comma) + t('common.and') + names[names.length - 1];
  const one = names.length === 1 && names[0] !== t('common.you');
  return t(one ? 'create.oneThatDay' : 'create.manyThatDay', { who: list });
}

function step1(s) {
  const d = s.draft;
  const days = Array.from({ length: 7 }, (_, i) => addDays(s.weekStart, i));
  const custom = !TIMES.includes(d.time);
  return html`
<div class="screen flow">
  ${header(s, t('create.s1'), t('create.s1sub'))}
  <main class="flow-main">
    <section class="card pad-16">
      <div class="row-between mb-12">
        <h2 class="h-16">${t('create.day')}</h2>
        <div class="week-nav">
          <button class="mini-btn" data-action="week" data-dir="-1" aria-label="${t('create.earlier')}" ${s.weekStart <= today() ? raw('disabled') : ''}>${icon('chevronLeft', 16, 2.4)}</button>
          <span class="small muted">${rangeLabel(days[0], days[6])}</span>
          <button class="mini-btn" data-action="week" data-dir="1" aria-label="${t('create.later')}">${icon('chevronRight', 16, 2.4)}</button>
        </div>
      </div>
      <div class="grid-7 gap-6">
        ${days.map((day) => {
          const on = day === d.date;
          return html`<button class="day-btn ${on ? 'on' : ''}" data-action="day" data-date="${day}" aria-pressed="${on ? 'true' : 'false'}" aria-label="${longDay(day)}">
            <span class="wd">${wdShort(weekdayIndex(day))}</span><span class="n">${parse(day).getDate()}</span>
          </button>`;
        })}
      </div>
      <p class="note-line">${dayNote(s)}</p>
    </section>

    <section class="card pad-16">
      <h2 class="h-16 mb-12">${t('create.startTime')}</h2>
      <div class="grid-3 gap-8">
        ${TIMES.map((tm) => html`<button class="choice ${tm === d.time ? 'on' : ''}" data-action="time" data-time="${tm}" aria-pressed="${tm === d.time ? 'true' : 'false'}">${fmtTime(tm)}</button>`)}
      </div>
      <label class="custom-time ${custom ? 'on' : ''}">
        <span class="small muted">${t('create.otherTime')}</span>
        <input class="input soft" type="time" step="300" dir="ltr" value="${d.time}" data-change="customTime">
      </label>
    </section>

    <section class="card pad-16">
      <div class="row-between baseline mb-12">
        <h2 class="h-16">${t('create.howLong')}</h2>
        <span class="display len-big">${minutes(d.length)}</span>
      </div>
      <div class="grid-6 gap-6">
        ${LENGTHS.map((n) => html`<button class="choice solid ${n === d.length ? 'on' : ''}" data-action="len" data-n="${n}" aria-pressed="${n === d.length ? 'true' : 'false'}" aria-label="${tp('minLong', n)}">${n}</button>`)}
      </div>
      <div class="tip-box">
        ${icon('clock', 20)}
        <span><strong>${t(`create.tips.${d.length}`)}</strong> ${t('create.tipTail')}</span>
      </div>
    </section>
  </main>
  ${footer(s, t('create.next1'))}
</div>`;
}

// ---------- step 2: title & pitch ----------

function step2(s) {
  const d = s.draft;
  const openers = t('create.openers');
  return html`
<div class="screen flow">
  ${header(s, t('create.s2'), t('create.s2sub'), d.origin ? html`<span class="pill pill-soft">${icon(d.wishId ? 'sparkle' : 'link', 14)}<bdi>${d.origin}</bdi></span>` : '')}
  <main class="flow-main">
    <section class="card pad-16 stack-16">
      <div class="field">
        <label for="ttl" class="field-head">${t('create.fieldTitle')} <span class="count" id="title-count">${d.title.length}/60</span></label>
        <input id="ttl" class="input input-title" maxlength="60" dir="auto" value="${d.title}" data-input="title" placeholder="${t('create.titlePh')}" autocomplete="off">
        <p class="form-error" id="title-error" role="alert" hidden></p>
        <div class="openers">
          <button type="button" class="opener roulette" data-action="roulette">${icon('sparkle', 16)}${t('create.roulette')}</button>
          <span class="small muted">${t('create.stuck')}</span>
          ${openers.map((o, i) => html`<button type="button" class="opener" data-action="opener" data-i="${i}">${o.label}</button>`)}
        </div>
      </div>
      <div class="field">
        <label for="pitch" class="field-head">${t('create.pitch')} <span class="count" id="pitch-count">${d.pitch.length}/90</span></label>
        <textarea id="pitch" class="input" rows="2" maxlength="90" dir="auto" data-input="pitch" placeholder="${t('create.pitchPh')}">${d.pitch}</textarea>
        <span class="hint">${t('create.pitchHint')}</span>
      </div>
    </section>

    <section class="stack-10">
      <h2 class="eyebrow">${t('create.preview')}</h2>
      <div class="card lesson-card">
        <div class="lc-when"><span class="lc-time">${fmtTime(d.time)}</span><span class="small muted">${minutes(d.length)}</span></div>
        <div class="lc-body gap-6">
          <span class="lc-title display" id="pv-title">${d.title || t('create.yourTitle')}</span>
          <span class="small muted" id="pv-pitch">${d.pitch || t('create.yourPitch')}</span>
          <span class="who mt-4">${avatar(app.me, 28, { font: 11 })}${t('create.youOn', { date: shortDate(d.date) })}</span>
        </div>
      </div>
    </section>
  </main>
  ${footer(s, t('create.next2'), 'nextFromTitle')}
</div>`;
}

// ---------- step 3: format ----------

function step3(s) {
  const d = s.draft;
  return html`
<div class="screen flow">
  ${header(s, t('create.s3'), t('create.s3sub'))}
  <main class="flow-main gap-10" role="radiogroup" aria-label="${t('create.formatGroup')}">
    ${ORDER.map((k) => {
      const f = fmt(k);
      const on = d.format === k;
      return html`<button class="format-card ${on ? 'on' : ''}" role="radio" aria-checked="${on ? 'true' : 'false'}" data-action="format" data-f="${k}">
        <span class="fc-art" style="background:${f.bg}">${raw(f.art)}</span>
        <span class="fc-text">
          <span class="fc-name display"><span style="color:${f.fg}">${icon(f.icon, 16, 2.2)}</span>${f.cardLabel}</span>
          <span class="small muted">${f.blurb}</span>
        </span>
        <span class="fc-radio">${on ? icon('check', 14, 3) : ''}</span>
      </button>`;
    })}
    <p class="small muted center mt-6">${t('create.notSure')}</p>
  </main>
  ${footer(s, t('create.next3'))}
</div>`;
}

// ---------- step 4: structure ----------

function promptMark(f, i, value) {
  const done = String(value || '').trim().length > 0;
  return html`<span class="num-badge" id="mark-${i}" style="background:${done ? f.dot : '#F5F3F0'};color:${done ? '#FFFFFF' : '#4A433D'}">${done ? icon('check', 16, 3) : i + 1}</span>`;
}

function step4(s) {
  const d = s.draft;
  const f = fmt(d.format);
  const answers = answersOf(d);
  const pill = html`<a class="pill pill-link" href="/create/3" style="background:${f.bg};color:${f.fg}"><span class="dot" style="background:${f.dot}"></span>${t('create.change', { label: f.label })}</a>`;
  return html`
<div class="screen flow">
  ${header(s, f.heading, t('create.s4sub'), pill)}
  <main class="flow-main gap-12">
    ${f.prompts.map((p, i) => html`<div class="card pad-16 stack-10">
      <div class="prompt-head">
        <span id="mark-wrap-${i}">${promptMark(f, i, answers[i])}</span>
        <span class="stack-2 pt-4">
          <label for="ans-${i}" class="strong">${p.q}</label>
          <span class="small muted">${p.hint}</span>
        </span>
      </div>
      <textarea id="ans-${i}" class="input soft" rows="${p.rows}" maxlength="500" dir="auto" data-input="answer" data-i="${i}" placeholder="${p.ph}">${answers[i] || ''}</textarea>
    </div>`)}
    <p class="small muted center row-center gap-8">${icon('heart', 18)}${t('create.skipAny')}</p>
  </main>
  ${footer(s, t('create.next4'))}
</div>`;
}

// ---------- step 5: time plan ----------

function step5(s) {
  const d = s.draft;
  const f = fmt(d.format);
  const mins = ensurePlan(d);
  const sum = mins.reduce((a, b) => a + b, 0);
  const diff = sum - d.length;
  const status = diff === 0 ? t('create.fits') : diff > 0 ? t('create.over', { mins: minutes(diff) }) : t('create.spare', { mins: minutes(-diff) });
  return html`
<div class="screen flow">
  ${header(s, t('create.s5'), t('create.s5sub', { len: tp('minLong', d.length), format: f.planLabel }))}
  <main class="flow-main gap-14">
    <section class="card pad-18-16">
      <div class="row-between baseline mb-12">
        <span class="display plan-total">${sum}<span class="muted"> / ${minutes(d.length)}</span></span>
        <button class="mini-pill" data-action="resetPlan">${t('create.reset')}</button>
      </div>
      <div class="seg-bar" aria-hidden="true">${f.plan.map((_, i) => html`<span style="flex:${mins[i]} 1 0;background:${f.ramp[i]}"></span>`)}</div>
      <div class="seg-labels" aria-hidden="true">${f.plan.map((_, i) => html`<span style="flex:${mins[i]} 1 0">${minShort(mins[i])}</span>`)}</div>
      <p class="status ${diff > 0 ? 'over' : 'ok'}" role="status">${status}</p>
    </section>

    <ol class="plain stack-10">
      ${f.plan.map(([name, hint], i) => html`<li class="card seg-row">
        <span class="seg-swatch" style="background:${f.ramp[i]}"></span>
        <span class="grow stack-2"><strong>${name}</strong><span class="small muted">${hint}</span></span>
        <span class="stepper">
          <button class="step-btn" data-action="dec" data-i="${i}" aria-label="${t('create.less', { name })}" ${mins[i] <= 1 ? raw('disabled') : ''}>${icon('minus', 16, 2.6)}</button>
          <span class="step-val">${minShort(mins[i])}</span>
          <button class="step-btn" data-action="inc" data-i="${i}" aria-label="${t('create.more', { name })}" ${mins[i] >= 30 ? raw('disabled') : ''}>${icon('plus', 16, 2.6)}</button>
        </span>
      </li>`)}
    </ol>
  </main>
  ${footer(s, t('create.next5'))}
</div>`;
}

// ---------- step 6: review & publish ----------

function linkNote(d) {
  const has = d.classLink.trim().length > 0;
  return html`
    <div class="note warn" id="link-none" role="note" ${has ? raw('hidden') : ''}>
      ${icon('bell', 20)}
      <span><strong>${t('create.noLink')}</strong> ${t('create.noLinkBody')}</span>
    </div>
    <div class="note ok" id="link-ok" ${has ? '' : raw('hidden')}>
      ${icon('check', 18, 2.6)}${t('create.linkAdded')}
    </div>`;
}

function step6(s) {
  const d = s.draft;
  const f = fmt(d.format);
  const plan = buildPlan(d);
  const visBtn = (value, ic, title, sub) => {
    const on = d.surprise === value;
    return html`<button class="vis-btn ${on ? 'on' : ''}" role="radio" aria-checked="${on ? 'true' : 'false'}" data-action="vis" data-v="${value ? '1' : '0'}">
      <span class="row gap-6 strong">${icon(ic, 18)}${title}</span>
      <span class="small muted">${sub}</span>
    </button>`;
  };
  return html`
<div class="screen flow">
  ${header(s, d.editId ? t('create.s6edit') : t('create.s6'), d.editId ? t('create.s6subEdit') : t('create.s6sub'))}
  <main class="flow-main gap-14">
    <section class="card pad-18 stack-12">
      <div class="row-between">${formatPill(d.format)}<a href="/create/2" class="edit-link">${t('common.edit')}</a></div>
      <h2 class="display h-23"><bdi>${d.title || t('create.untitled')}</bdi></h2>
      ${d.pitch ? html`<p class="body-2"><bdi>${d.pitch}</bdi></p>` : ''}
      <div class="grid-3 gap-8 mt-4">
        <a class="fact" href="/create/1"><span class="tiny muted">${t('common.date')}</span><strong>${shortDate(d.date)}</strong></a>
        <a class="fact" href="/create/1"><span class="tiny muted">${t('common.time')}</span><strong>${fmtTime(d.time)}</strong></a>
        <a class="fact" href="/create/1"><span class="tiny muted">${t('common.length')}</span><strong>${minutes(d.length)}</strong></a>
      </div>
    </section>

    <section class="card pad-18 stack-8">
      <label for="classlink" class="field-head big">${t('create.classLink')} <span class="opt">${t('common.optional')}</span></label>
      <div class="icon-input">
        ${icon('link', 20)}
        <input id="classlink" class="input soft" type="url" inputmode="url" dir="ltr" autocomplete="url" maxlength="500" value="${d.classLink}" data-input="link" placeholder="${t('create.linkPh')}" aria-describedby="classlink-help">
      </div>
      <span id="classlink-help" class="hint">${t('create.linkHelp')}</span>
      ${linkNote(d)}
    </section>

    <section class="card pad-18 stack-12">
      <div class="row-between"><h2 class="h-17">${t('create.outline')}</h2><a href="/create/4" class="edit-link">${t('common.edit')}</a></div>
      <div class="seg-bar thin" aria-hidden="true">${plan.map((p, i) => html`<span style="flex:${p.min} 1 0;background:${f.ramp[i]}"></span>`)}</div>
      <ol class="plain outline">
        ${plan.map((p) => html`<li><span class="ol-min" style="color:${f.fg}">${minutes(p.min)}</span><span class="pre-line" dir="auto"><strong>${p.name}.</strong> ${p.desc || p.hint}</span></li>`)}
      </ol>
    </section>

    <section class="card pad-18 stack-12">
      <h2 class="h-17" id="vis">${t('create.whoSees')}</h2>
      <div class="grid-2 gap-8" role="radiogroup" aria-labelledby="vis">
        ${visBtn(false, 'eye', t('create.showIt'), t('create.showItSub'))}
        ${visBtn(true, 'gift', t('create.surprise'), t('create.surpriseSub'))}
      </div>
    </section>

    <section class="card pad-18 stack-8">
      <label for="prep" class="field-head big">${t('create.prep')} <span class="opt">${t('common.optional')}</span></label>
      <input id="prep" class="input soft" maxlength="200" dir="auto" value="${d.prep}" data-input="prep" placeholder="${t('create.prepPh')}">
      <span class="hint">${t('create.prepHint')}</span>
    </section>
  </main>
  <footer class="flow-foot col">
    <button class="btn btn-primary btn-xl shadow" data-action="publish">${icon('check', 20, 2.4)}${d.editId ? t('create.saveChanges') : t('create.publish')}</button>
    <span class="small muted center">${t('create.noPressure')}</span>
  </footer>
</div>`;
}

const STEPS = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5, 6: step6 };

function draftFromLesson(l) {
  const f = fmt(l.format);
  return {
    ...newDraft(l.date),
    editId: l.id,
    time: l.time,
    tz: l.tz || browserTz,
    length: l.length,
    title: l.title,
    pitch: l.pitch,
    format: l.format,
    answers: { [l.format]: l.answers || [] },
    plan: l.plan && l.plan.length === f.plan.length ? { key: `${l.format}:${l.length}`, mins: l.plan.map((p) => p.min) } : null,
    classLink: l.classLink || '',
    surprise: !!l.surprise,
    prep: l.prep || ''
  };
}

export const create = {
  title: (s) => (s.draft && s.draft.editId ? t('create.titleEdit') : t('create.titleNew')),
  needsClub: true,
  async load({ params, query }) {
    const step = params[0];
    if (step === 'new') {
      const edit = query.get('edit');
      if (edit) {
        const { lesson } = await api(`/lessons/${encodeURIComponent(edit)}`);
        if (!lesson.isHost) return { redirect: `/lesson/${lesson.id}` };
        saveDraft(draftFromLesson(lesson));
        return { redirect: '/create/6' };
      }
      const date = query.get('date');
      const draft = newDraft(isDate(date) && date >= today() ? date : today());
      const wishId = query.get('wish');
      const parentId = query.get('parent');
      if (wishId) {
        const { wish } = await api(`/wishes/${encodeURIComponent(wishId)}`);
        Object.assign(draft, { title: wish.title.slice(0, 60), wishId: wish.id, origin: `${t('create.fromWish')}: ${wish.title}` });
      } else if (parentId) {
        const { lesson } = await api(`/lessons/${encodeURIComponent(parentId)}`);
        if (lesson.isHost) {
          const title = (lesson.title + t('create.partTwoSuffix')).slice(0, 60);
          Object.assign(draft, { title, pitch: lesson.pitch, format: lesson.format, parentId: lesson.id, origin: t('lesson.partTwoOf', { title: lesson.title }) });
        }
      }
      saveDraft(draft);
      return { redirect: '/create/1' };
    }
    const draft = loadDraft();
    if (!draft) return { redirect: '/create/new' };
    const s = { step: Number(step), draft, others: [] };
    if (s.step === 1) {
      const now = today();
      s.weekStart = draft.date < now ? draft.date : addDays(now, 7 * Math.floor(daysBetween(now, draft.date) / 7));
      const from = dayStartMs(draft.date < now ? draft.date : now);
      const { lessons } = await api(`/lessons?from=${from}&to=${dayStartMs(addDays(now, 181))}`);
      s.others = lessons.map(localize).filter((l) => l.id !== draft.editId);
    }
    return s;
  },
  view: (s) => STEPS[s.step](s),
  actions: {
    close(s) {
      const back = s.draft.editId ? `/lesson/${s.draft.editId}` : '/';
      clearDraft();
      navigate(back);
    },
    next(s) {
      saveDraft(s.draft);
      navigate(`/create/${s.step + 1}`);
    },
    nextFromTitle(s) {
      if (!s.draft.title.trim()) {
        const err = document.getElementById('title-error');
        err.textContent = t('create.titleErr');
        err.hidden = false;
        document.getElementById('ttl').focus();
        return;
      }
      saveDraft(s.draft);
      navigate('/create/3');
    },
    week(s, el) {
      const next = addDays(s.weekStart, 7 * Number(el.dataset.dir));
      s.weekStart = next < today() ? today() : next;
      render();
    },
    day(s, el) {
      s.draft.date = el.dataset.date;
      saveDraft(s.draft);
      render();
    },
    time(s, el) {
      s.draft.time = el.dataset.time;
      saveDraft(s.draft);
      render();
    },
    len(s, el) {
      s.draft.length = Number(el.dataset.n);
      saveDraft(s.draft);
      render();
    },
    roulette(s) {
      const ideas = t('create.ideas');
      let idea = ideas[Math.floor(Math.random() * ideas.length)];
      if (idea === s.draft.title && ideas.length > 1) idea = ideas[(ideas.indexOf(idea) + 1) % ideas.length];
      const input = document.getElementById('ttl');
      input.value = idea;
      create.inputs.title(s, input);
      input.focus();
    },
    opener(s, el) {
      const o = t('create.openers')[Number(el.dataset.i)];
      const input = document.getElementById('ttl');
      input.value = o.text;
      create.inputs.title(s, input);
      input.focus();
      const at = o.caret ?? o.text.length;
      input.setSelectionRange(at, at);
    },
    format(s, el) {
      s.draft.format = el.dataset.f;
      saveDraft(s.draft);
      render();
    },
    dec(s, el) {
      const i = Number(el.dataset.i);
      s.draft.plan.mins[i] = Math.max(1, s.draft.plan.mins[i] - 1);
      saveDraft(s.draft);
      render();
    },
    inc(s, el) {
      const i = Number(el.dataset.i);
      s.draft.plan.mins[i] = Math.min(30, s.draft.plan.mins[i] + 1);
      saveDraft(s.draft);
      render();
    },
    resetPlan(s) {
      s.draft.plan = null;
      ensurePlan(s.draft);
      saveDraft(s.draft);
      render();
    },
    vis(s, el) {
      s.draft.surprise = el.dataset.v === '1';
      saveDraft(s.draft);
      render();
    },
    async publish(s, button) {
      const d = s.draft;
      if (!d.title.trim()) {
        toast(t('create.needTitle'));
        return navigate('/create/2');
      }
      if (d.classLink.trim() && !isWebLink(d.classLink)) {
        toast(t('create.badLink'));
        document.getElementById('classlink').focus();
        return;
      }
      const body = {
        title: d.title, pitch: d.pitch, format: d.format, date: d.date, time: d.time, tz: d.tz || browserTz, length: d.length,
        wishId: d.wishId || undefined, parentId: d.parentId || undefined,
        answers: answersOf(d), plan: buildPlan(d), classLink: d.classLink.trim(), surprise: d.surprise, prep: d.prep
      };
      busy(button, true, d.editId ? t('common.saving') : t('create.publishing'));
      try {
        const res = d.editId
          ? await api(`/lessons/${d.editId}`, { method: 'PUT', body })
          : await api('/lessons', { method: 'POST', body });
        clearDraft();
        toast(d.editId ? t('create.saved') : t('create.published'));
        navigate(`/lesson/${res.id}`, { replace: true });
      } catch (err) {
        busy(button, false);
        toast(err.message);
      }
    }
  },
  inputs: {
    title(s, el) {
      s.draft.title = el.value;
      saveDraft(s.draft);
      document.getElementById('title-count').textContent = `${el.value.length}/60`;
      document.getElementById('pv-title').textContent = el.value || t('create.yourTitle');
      if (el.value.trim()) document.getElementById('title-error').hidden = true;
    },
    pitch(s, el) {
      s.draft.pitch = el.value;
      saveDraft(s.draft);
      document.getElementById('pitch-count').textContent = `${el.value.length}/90`;
      document.getElementById('pv-pitch').textContent = el.value || t('create.yourPitch');
    },
    answer(s, el) {
      const d = s.draft;
      const i = Number(el.dataset.i);
      const list = answersOf(d).slice();
      list[i] = el.value;
      d.answers[d.format] = list;
      saveDraft(d);
      document.getElementById(`mark-wrap-${i}`).innerHTML = String(promptMark(fmt(d.format), i, el.value));
    },
    link(s, el) {
      s.draft.classLink = el.value;
      saveDraft(s.draft);
      const has = el.value.trim().length > 0;
      document.getElementById('link-none').hidden = has;
      document.getElementById('link-ok').hidden = !has;
    },
    prep(s, el) {
      s.draft.prep = el.value;
      saveDraft(s.draft);
    }
  },
  changes: {
    customTime(s, el) {
      if (!/^\d{2}:\d{2}$/.test(el.value)) return;
      s.draft.time = el.value;
      saveDraft(s.draft);
      render();
    }
  }
};
