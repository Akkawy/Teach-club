// Lesson detail (RSVP, plan, questions, extras, part two, host tools) and the thank-you screen.

import { html, raw } from '../html.js';
import { api, browserTz } from '../api.js';
import { app, navigate, render } from '../core.js';
import { fmt, REACTIONS, reactionLabel } from '../formats.js';
import { t, tp } from '../i18n.js';
import { avatar, icon, formatPill, toast, busy, isWebLink, hostOf, linkify } from '../ui.js';
import { fmtTime, shortDate, isOver, happenedLabel, minutes, localize, tzCity } from '../dates.js';
import { resizeImage } from '../photo.js';

export async function fetchLesson(id) {
  const { lesson } = await api(`/lessons/${id}`);
  localize(lesson);
  (lesson.children || []).forEach(localize);
  return lesson;
}

// Outline parts are shown in the reader's language; the host's own notes stay as written.
export function planParts(l) {
  const tpl = fmt(l.format).plan;
  const same = tpl.length === l.plan.length;
  return l.plan.map((p, i) => {
    const own = p.desc && p.desc !== p.hint ? p.desc : '';
    return { min: p.min, name: same ? tpl[i][0] : p.name, desc: own || (same ? tpl[i][1] : p.hint), own: !!own };
  });
}

// ---------- add to calendar ----------

const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const lessonUrl = (l) => `${location.origin}/lesson/${l.id}`;

function googleLink(l) {
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: l.title, dates: `${stamp(l.startsAt)}/${stamp(l.startsAt + l.length * 60000)}`, details: lessonUrl(l)
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function downloadIcs(l) {
  const escIcs = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Teach Club//EN', 'BEGIN:VEVENT',
    `UID:lesson-${l.id}@teach-club`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(l.startsAt)}`, `DTEND:${stamp(l.startsAt + l.length * 60000)}`,
    `SUMMARY:${escIcs(l.title)}`, `DESCRIPTION:${escIcs(lessonUrl(l))}`, `URL:${lessonUrl(l)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${escIcs(l.title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  a.download = 'teach-club-lesson.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

// ---------- pieces of the lesson page ----------

function infoTile(ic, label, value, note) {
  return html`<div class="info-tile">${icon(ic, 22)}<span class="stack-0"><span class="tiny muted">${label}</span><strong>${value}</strong>${note ? html`<span class="tiny muted">${note}</span>` : ''}</span></div>`;
}

function linkTile(l) {
  const open = (label) => html`<a class="info-tile accent" href="${l.classLink}" target="_blank" rel="noopener noreferrer">
    ${icon('video', 22)}<span class="stack-0"><span class="tiny">${t('create.classLink')}</span><strong>${label}</strong></span></a>`;
  const dashed = (ic, text) => html`<div class="info-tile dashed">${icon(ic, 22)}<span class="stack-0"><span class="tiny muted">${t('create.classLink')}</span><strong class="small-strong">${text}</strong></span></div>`;
  const usable = isWebLink(l.classLink);
  if (l.isHost) return usable ? open(t('lesson.openCall')) : dashed('link', t('lesson.addLink'));
  if (l.going) return usable ? open(t('lesson.joinCall')) : dashed('clock', t('lesson.linkSoon'));
  return dashed('lock', t('lesson.afterRsvp'));
}

function hostCard(l) {
  const h = l.host;
  return html`<section class="card host-card">
    ${avatar(h, 56, { font: 19 })}
    <div class="grow stack-4">
      <span class="small muted">${t('lesson.taughtBy')}</span>
      <strong class="display h-19"><bdi>${l.isHost ? t('lesson.youSuffix', { name: h.name }) : h.name}</bdi></strong>
      ${h.bio ? html`<span class="body-3" dir="auto">${h.bio}</span>` : ''}
      ${l.isHost ? '' : html`<a href="/u/${h.id}" class="strong small self-start pad-y-6">${t('lesson.seeProfile', { name: h.firstName })}</a>`}
    </div>
  </section>`;
}

function beforeCard(l) {
  const items = [];
  if (l.prep) items.push(html`<span dir="auto">${l.prep}</span>`);
  if (l.reading) {
    items.push(isWebLink(l.reading)
      ? html`<strong>${t('lesson.readFirst')}</strong> <a href="${l.reading}" target="_blank" rel="noopener noreferrer" dir="ltr">${hostOf(l.reading)}</a>`
      : html`<strong>${t('lesson.theReading')}</strong> <span dir="auto">${l.reading}</span>`);
  }
  if (!items.length) return '';
  return html`<section class="before-card">
    <h2 class="display h-19 row gap-8">${icon('bag', 22)}${t('lesson.before')}</h2>
    <ul class="plain steps">${items.map((it, i) => html`<li><span class="num">${i + 1}</span><span>${it}</span></li>`)}</ul>
  </section>`;
}

function goingCard(l, over) {
  const shown = l.attendees.slice(0, 5);
  const extra = l.goingCount - shown.length;
  let actions;
  if (l.isHost) actions = html`<p class="small muted">${t('lesson.hostNote')}</p>`;
  else if (over) actions = html`<p class="small muted">${t('lesson.finished')}</p>`;
  else if (l.going) {
    actions = html`<div class="row gap-8">
      <span class="going-yes grow">${icon('check', 20, 2.6)}${t('lesson.youreGoing')}</span>
      <button class="btn btn-secondary btn-lg compact" data-action="leave">${t('lesson.cantMake')}</button>
    </div>`;
  } else actions = html`<button class="btn btn-primary btn-lg" data-action="join">${t('lesson.imIn')}</button>`;
  return html`<section class="card pad-18 stack-14">
    <div class="row-between gap-10">
      <div class="faces">
        ${shown.map((u) => avatar(u, 38, { cls: 'face', title: u.name, font: 12 }))}
        ${extra > 0 ? html`<span class="avatar face more" style="width:38px;height:38px">+${extra}</span>` : ''}
      </div>
      <span class="going-count">${l.goingCount ? t('lesson.goingN', { n: l.goingCount }) : over ? t('lesson.nobody') : t('lesson.beFirst')}</span>
    </div>
    ${actions}
  </section>`;
}

function planCard(l) {
  const f = fmt(l.format);
  const title = l.isHost ? t('lesson.yourPlan') : t('lesson.theirPlan', { name: l.host.firstName });
  if (!l.plan) {
    return html`<section class="card pad-18 stack-14">
      <h2 class="display h-19">${title}</h2>
      <div class="surprise-box">
        ${raw('<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="30" width="44" height="28" rx="5" fill="#D99A12"/><rect x="6" y="22" width="52" height="11" rx="4" fill="#F0C455"/><path d="M32 22v36" stroke="#FFFFFF" stroke-width="3.5"/><path d="M32 22c-4-10-14-10-14-5s8 5 14 5zm0 0c4-10 14-10 14-5s-8 5-14 5z" fill="#F0C455"/></svg>')}
        <strong>${t('lesson.surpriseTitle')}</strong>
        <span class="body-3">${t('lesson.surpriseBody', { name: l.host.firstName })}${l.prep ? '' : t('lesson.openMind')}</span>
      </div>
    </section>`;
  }
  if (!l.plan.length) return '';
  const parts = planParts(l);
  return html`<section class="card pad-18 stack-14">
    <div class="row-between gap-10">
      <h2 class="display h-19">${title}</h2>
      ${l.isHost ? html`<a class="btn btn-soft btn-sm" href="/lesson/${l.id}/present">${icon('play', 16, 2.4)}${t('lesson.present')}</a>` : ''}
    </div>
    ${l.isHost && l.surprise ? html`<p class="note warn small">${icon('gift', 18)}${t('lesson.surpriseHost')}</p>` : ''}
    <div class="seg-bar thin" aria-hidden="true">${parts.map((p, i) => html`<span style="flex:${p.min} 1 0;background:${f.ramp[i % f.ramp.length]}"></span>`)}</div>
    <ol class="plain plan-list">
      ${parts.map((p) => html`<li>
        <span class="ol-min" style="color:${f.fg}">${minutes(p.min)}</span>
        <span class="stack-2"><strong>${p.name}</strong><span class="small muted pre-line" ${p.own ? raw('dir="auto"') : ''}>${p.desc}</span></span>
      </li>`)}
    </ol>
  </section>`;
}

function questionsCard(l) {
  const canDelete = (q) => q.author.id === app.me.id || l.isHost || l.isAdmin;
  return html`<section class="card pad-18 stack-14">
    <h2 class="display h-19 row gap-8">${icon('bubbles', 22)}${l.isHost ? t('lesson.questionsHost') : t('lesson.questions', { name: l.host.firstName })}</h2>
    ${l.questions.length ? html`<ul class="plain stack-12">${l.questions.map((q) => html`<li class="question">
      <div class="row gap-10">
        ${avatar(q.author, 32, { font: 11 })}
        <span class="grow min0 stack-2">
          <strong class="small">${q.author.id === app.me.id ? t('common.you') : q.author.firstName}</strong>
          <span class="body-2 pre-line" dir="auto">${q.body}</span>
        </span>
        ${canDelete(q) ? html`<button class="icon-btn small" data-action="deleteQuestion" data-id="${q.id}" aria-label="${t('lesson.deleteQ')}">${icon('trash', 16)}</button>` : ''}
      </div>
      ${q.answer ? html`<div class="answer"><span class="tiny muted">${t('lesson.replied', { name: l.isHost ? t('common.you') : l.host.firstName })}</span><span class="body-2 pre-line" dir="auto">${linkify(q.answer)}</span></div>` : ''}
      ${l.isHost ? html`<div class="row gap-8 reply-row">
        <input class="input soft" id="reply-${q.id}" maxlength="500" dir="auto" value="${q.answer}" placeholder="${t('lesson.replyPh')}" aria-label="${t('lesson.reply')}">
        <button class="btn btn-secondary btn-sm" data-action="answer" data-id="${q.id}">${t('lesson.saveReply')}</button>
      </div>` : ''}
    </li>`)}</ul>` : html`<p class="small muted">${t('lesson.noQuestions')}</p>`}
    ${l.isHost ? '' : html`<div class="stack-8">
      <textarea class="input soft" id="ask" rows="2" maxlength="280" dir="auto" placeholder="${t('lesson.askPh', { name: l.host.firstName })}" aria-label="${t('lesson.ask')}"></textarea>
      <button class="btn btn-secondary btn-sm self-start" data-action="ask">${t('lesson.ask')}</button>
    </div>`}
  </section>`;
}

function extrasCard(l, over) {
  if (!l.isHost && !l.recap && !l.photos.length) return '';
  if (l.isHost && !over && !l.recap && !l.photos.length) return '';
  return html`<section class="card pad-18 stack-14">
    <h2 class="display h-19 row gap-8">${icon('image', 22)}${t('lesson.extras')}</h2>
    ${l.isHost
      ? html`<textarea class="input soft" id="recap" rows="3" maxlength="1000" dir="auto" placeholder="${t('lesson.recapPh')}" aria-label="${t('lesson.extras')}">${l.recap}</textarea>
        <button class="btn btn-secondary btn-sm self-start" data-action="saveRecap">${t('lesson.saveRecap')}</button>`
      : html`<p class="body-2 pre-line" dir="auto">${linkify(l.recap)}</p>`}
    ${l.photos.length ? html`<div class="photo-grid">${l.photos.map((src) => html`<span class="photo-cell">
      <a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="" loading="lazy"></a>
      ${l.isHost ? html`<button class="photo-x" data-action="removePhoto" data-src="${src}" aria-label="${t('lesson.removePhoto')}">${icon('close', 14, 2.6)}</button>` : ''}
    </span>`)}</div>` : ''}
    ${l.isHost && l.photos.length < 4 ? html`<div class="row gap-8 wrap">
      <button class="btn btn-soft btn-sm" data-action="pickPhotos">${icon('camera', 18)}${t('lesson.addPhotos')}</button>
      <span class="tiny muted">${t('lesson.photosLimit')}</span>
      <input type="file" id="photo-files" accept="image/*" multiple data-change="photos" hidden>
    </div>` : ''}
  </section>`;
}

function partTwoCard(l, over) {
  const kids = l.children || [];
  if (!kids.length && !(l.isHost && (over || l.partTwoWanted))) return '';
  return html`<section class="card pad-18 stack-12">
    ${l.isHost && l.partTwoWanted ? html`<p class="note ok">${icon('heart', 18)}${tp('wantPartTwo', l.partTwoWanted)}</p>` : ''}
    ${kids.length ? html`<h2 class="h-16">${t('lesson.followUps')}</h2>
      <ul class="plain stack-8">${kids.map((k) => html`<li><a class="row gap-8" href="/lesson/${k.id}">${icon('link', 16)}<bdi>${k.title}</bdi> · ${shortDate(k.date)}</a></li>`)}</ul>` : ''}
    ${l.isHost ? html`<a class="btn btn-secondary btn-sm self-start" href="/create/new?parent=${l.id}">${icon('plus', 18)}${t('lesson.planPartTwo')}</a>` : ''}
  </section>`;
}

function afterCard(l, over) {
  const name = l.host.firstName;
  let title;
  let text;
  if (l.isHost) {
    title = t('lesson.thanksTitle');
    text = l.notes.length ? t('lesson.thanksSome', { notes: tp('notes', l.notes.length) }) : t('lesson.thanksNone');
  } else if (over) {
    title = t('lesson.sayThanks', { name });
    text = l.notes.some((n) => n.author.id === app.me.id) ? t('lesson.sentAlready') : t('lesson.leaveNote', { name });
  } else {
    title = t('lesson.afterTitle');
    text = t('lesson.afterBody', { name });
  }
  return html`<a class="after-card" href="/lesson/${l.id}/thanks">
    <span class="soft-square plain-bg">${icon('heart', 22)}</span>
    <span class="grow stack-2"><strong>${title}</strong><span class="small muted">${text}</span></span>
    <span class="round-btn small" aria-hidden="true">${icon('chevronRight', 18, 2.2)}</span>
  </a>`;
}

export const lesson = {
  title: (s) => s.l.title,
  async load({ params }) {
    return { l: await fetchLesson(params[0]) };
  },
  view(s) {
    const l = s.l;
    const f = fmt(l.format);
    const over = isOver(l);
    const otherZone = l.tz && l.tz !== browserTz && l.hostTime && l.hostTime !== l.time;
    return html`
<div class="screen">
  <div class="lesson-hero" style="background:${f.bg}">
    <span class="hero-art" aria-hidden="true">${raw(f.art)}</span>
    <div class="hero-bar">
      <a class="icon-btn" href="/?day=${l.date}" aria-label="${t('lesson.backCal')}">${icon('chevronLeft', 20, 2.2)}</a>
      <div class="row gap-8">
        ${l.isHost ? '' : html`<a class="icon-btn" href="/report?lesson=${l.id}" aria-label="${t('lesson.report')}">${icon('flag', 18)}</a>`}
        <button class="icon-btn" data-action="share" aria-label="${t('lesson.share')}">${icon('share', 20)}</button>
      </div>
    </div>
    <div class="hero-text">
      ${formatPill(l.format, { onHero: true })}
      ${l.parent ? html`<a class="parent-link" href="/lesson/${l.parent.id}">${icon('link', 14)}<bdi>${t('lesson.partTwoOf', { title: l.parent.title })}</bdi></a>` : ''}
      <h1 class="display h-32"><bdi>${l.title}</bdi></h1>
      ${l.pitch ? html`<p class="hero-pitch" style="color:${f.heroInk}"><bdi>${l.pitch}</bdi></p>` : ''}
    </div>
  </div>

  <main class="lesson-main">
    <section class="grid-2 gap-8" aria-label="${t('lesson.whenHow')}">
      ${infoTile('calendar', t('common.date'), shortDate(l.date))}
      ${infoTile('clock', t('common.time'), fmtTime(l.time), otherZone ? t('lesson.hostTime', { time: fmtTime(l.hostTime), tz: tzCity(l.tz) }) : '')}
      ${infoTile('hourglass', t('common.length'), tp('minLong', l.length))}
      ${linkTile(l)}
    </section>
    ${l.isHost && l.autoRoom ? html`<p class="note small">${icon('video', 18)}${t('lesson.autoRoom')}</p>` : ''}
    ${over ? '' : html`<div class="cal-buttons">
      <span class="small muted row gap-6">${icon('calendarPlus', 18)}${t('lesson.addCal')}</span>
      <a class="chip-btn" href="${googleLink(l)}" target="_blank" rel="noopener noreferrer">${t('lesson.google')}</a>
      <button class="chip-btn" data-action="ics">${t('lesson.ics')}</button>
    </div>`}
    ${hostCard(l)}
    ${beforeCard(l)}
    ${goingCard(l, over)}
    ${planCard(l)}
    ${questionsCard(l)}
    ${extrasCard(l, over)}
    ${partTwoCard(l, over)}
    ${afterCard(l, over)}
    ${l.isHost ? html`<section class="host-tools">
      <a class="btn btn-secondary btn-md grow" href="/create/new?edit=${l.id}">${icon('pencil', 18)}${t('lesson.edit')}</a>
      <button class="btn btn-danger btn-md" data-action="cancelLesson">${icon('trash', 18)}${t('lesson.cancel')}</button>
    </section>` : l.isAdmin ? html`<section class="host-tools">
      <button class="btn btn-danger btn-md" data-action="cancelLesson">${icon('trash', 18)}${t('lesson.adminDelete')}</button>
    </section>` : ''}
  </main>
</div>`;
  },
  actions: {
    async share(s) {
      const url = lessonUrl(s.l);
      if (navigator.share) {
        try {
          await navigator.share({ title: s.l.title, text: t('lesson.shareText', { title: s.l.title }), url });
        } catch {
          // closed the share sheet
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast(t('lesson.copied'));
      } catch {
        toast(url);
      }
    },
    ics(s) {
      downloadIcs(s.l);
    },
    async join(s, button) {
      busy(button, true, t('common.saving'));
      await api(`/lessons/${s.l.id}/rsvp`, { method: 'POST' });
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.joined'));
    },
    async leave(s, button) {
      busy(button, true, t('common.saving'));
      await api(`/lessons/${s.l.id}/rsvp`, { method: 'DELETE' });
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.left'));
    },
    async cancelLesson(s, button) {
      if (!window.confirm(t('lesson.confirmCancel', { title: s.l.title }))) return;
      busy(button, true, t('lesson.cancelling'));
      await api(`/lessons/${s.l.id}`, { method: 'DELETE' });
      toast(t('lesson.cancelled'));
      navigate('/', { replace: true });
    },
    async ask(s, button) {
      const box = document.getElementById('ask');
      if (!box.value.trim()) return box.focus();
      busy(button, true);
      await api(`/lessons/${s.l.id}/questions`, { method: 'POST', body: { body: box.value } });
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.asked'));
    },
    async answer(s, el) {
      const value = document.getElementById(`reply-${el.dataset.id}`).value;
      await api(`/questions/${el.dataset.id}`, { method: 'PUT', body: { answer: value } });
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.recapSaved'));
    },
    async deleteQuestion(s, el) {
      await api(`/questions/${el.dataset.id}`, { method: 'DELETE' });
      s.l = await fetchLesson(s.l.id);
      render();
    },
    async saveRecap(s, button) {
      busy(button, true, t('common.saving'));
      await api(`/lessons/${s.l.id}/recap`, { method: 'PUT', body: { recap: document.getElementById('recap').value } });
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.recapSaved'));
    },
    pickPhotos() {
      document.getElementById('photo-files').click();
    },
    async removePhoto(s, el) {
      await api(el.dataset.src.replace(/^\/api/, ''), { method: 'DELETE' });
      s.l = await fetchLesson(s.l.id);
      render();
    }
  },
  changes: {
    async photos(s, el) {
      const files = [...(el.files || [])].slice(0, 4 - s.l.photos.length);
      el.value = '';
      if (!files.length) return;
      toast(t('lesson.uploading'));
      for (const file of files) {
        const data = await resizeImage(file);
        await api(`/lessons/${s.l.id}/photos`, { method: 'POST', body: { data } });
      }
      s.l = await fetchLesson(s.l.id);
      render();
      toast(t('lesson.photoAdded'));
    }
  }
};

// ---------- thank-you notes ----------

function noteCard(n) {
  return html`<div class="card note-card">
    ${avatar(n.author, 36, { font: 12 })}
    <span class="stack-4 grow">
      <strong class="small">${n.author.id === app.me.id ? t('common.you') : n.author.firstName}</strong>
      ${n.reactions.length ? html`<span class="mini-chips">${n.reactions.map((r) => html`<span>${reactionLabel(r)}</span>`)}</span>` : ''}
      ${n.body ? html`<span class="body-2 pre-line" dir="auto">${n.body}</span>` : ''}
    </span>
  </div>`;
}

function noteForm(s) {
  const l = s.l;
  const name = l.host.firstName;
  if (l.isHost) return '';
  if (!isOver(l)) {
    return html`<section class="card lock-box">
      ${icon('lock', 22)}
      <span>${t('thanks.lock', { name, date: shortDate(l.date), time: fmtTime(l.time) })}</span>
    </section>`;
  }
  if (!s.editing) {
    return html`<section class="sent-box">
      <span class="sent-check">${icon('check', 26, 2.6)}</span>
      <strong class="display h-20">${t('thanks.sentTitle', { name })}</strong>
      <span class="body-ok">${t('thanks.sentBody')}</span>
      <div class="row gap-8 mt-6">
        <button class="btn btn-sm btn-outline-ok" data-action="edit">${t('thanks.editNote')}</button>
        <a class="btn btn-sm btn-primary" href="/create/new">${t('nav.teach')}</a>
      </div>
    </section>`;
  }
  return html`<section class="card pad-18 stack-16">
    <div class="stack-10">
      <h2 class="h-16" id="quick">${t('thanks.quick')}</h2>
      <div class="wrap gap-8" role="group" aria-labelledby="quick">
        ${REACTIONS.map((r) => {
          const on = s.picked.includes(r);
          return html`<button class="react-chip ${on ? 'on' : ''}" data-action="react" data-r="${r}" aria-pressed="${on ? 'true' : 'false'}">${reactionLabel(r)}</button>`;
        })}
      </div>
    </div>
    <div class="field">
      <label for="learned" class="h-16">${t('thanks.learned')}</label>
      <textarea id="learned" class="input soft" rows="4" maxlength="500" dir="auto" data-input="note" placeholder="${t('thanks.learnedPh')}">${s.note}</textarea>
      <span class="hint">${t('thanks.learnedHint', { name })}</span>
    </div>
    <button class="btn btn-primary btn-lg" data-action="send">${t('thanks.send')}</button>
  </section>`;
}

export const thanks = {
  title: (s) => t('thanks.title', { title: s.l.title }),
  async load({ params }) {
    const l = await fetchLesson(params[0]);
    const mine = l.notes.find((n) => n.author.id === app.me.id);
    return { l, picked: mine ? mine.reactions.slice() : [], note: mine ? mine.body : '', editing: !mine };
  },
  view(s) {
    const l = s.l;
    const over = isOver(l);
    const others = l.notes.filter((n) => l.isHost || n.author.id !== app.me.id);
    return html`
<main class="screen pad-16 stack-16">
  <div class="row-between">
    <a class="icon-btn" href="/lesson/${l.id}" aria-label="${t('thanks.backLesson')}">${icon('chevronLeft', 20, 2.2)}</a>
    <span class="status-pill ${over ? 'ok' : ''}"><span class="dot"></span>${over ? happenedLabel(l.date) : t('thanks.comingUp', { date: shortDate(l.date) })}</span>
    <span class="spacer-44"></span>
  </div>

  <div class="center-col stack-12 pad-x-8">
    ${avatar(l.host, 76, { display: true, font: 26 })}
    <h1 class="display h-28">${l.isHost ? t('thanks.fromYourGroup') : t('lesson.sayThanks', { name: l.host.firstName })}</h1>
    <p class="muted"><bdi>${l.title}</bdi> · ${minutes(l.length)}</p>
  </div>

  ${noteForm(s)}

  <section class="stack-10">
    <h2 class="display h-19 pad-x-4">${t('thanks.fromGroup')}</h2>
    ${others.length ? others.map(noteCard) : html`<p class="empty-note">${over ? t('thanks.noNotes') : t('thanks.notesAfter')}</p>`}
  </section>
</main>`;
  },
  inputs: {
    note(s, el) {
      s.note = el.value;
    }
  },
  actions: {
    react(s, el) {
      const r = el.dataset.r;
      s.picked = s.picked.includes(r) ? s.picked.filter((x) => x !== r) : s.picked.concat(r);
      render();
    },
    async send(s, button) {
      if (!s.picked.length && !s.note.trim()) return toast(t('thanks.needReaction'));
      busy(button, true, t('thanks.sending'));
      try {
        await api(`/lessons/${s.l.id}/note`, { method: 'PUT', body: { reactions: s.picked, body: s.note } });
      } catch (err) {
        busy(button, false);
        throw err;
      }
      s.l = await fetchLesson(s.l.id);
      s.editing = false;
      render();
    },
    edit(s) {
      s.editing = true;
      render();
    }
  }
};
