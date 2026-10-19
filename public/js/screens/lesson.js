// Lesson detail (RSVP, plan, host tools) and the after-the-lesson thank-you screen.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { FORMATS, REACTIONS } from '../formats.js';
import { avatar, icon, formatPill, toast, busy, isWebLink, hostOf } from '../ui.js';
import { fmtTime, shortDate, isOver, happenedLabel } from '../dates.js';

async function fetchLesson(id) {
  const { lesson } = await api(`/lessons/${id}`);
  return lesson;
}

function infoTile(ic, label, value) {
  return html`<div class="info-tile">${icon(ic, 22)}<span class="stack-0"><span class="tiny muted">${label}</span><strong>${value}</strong></span></div>`;
}

function linkTile(l) {
  const open = (label) => html`<a class="info-tile accent" href="${l.classLink}" target="_blank" rel="noopener noreferrer">
    ${icon('video', 22)}<span class="stack-0"><span class="tiny">Class link</span><strong>${label}</strong></span></a>`;
  const dashed = (ic, text, href) => {
    const inner = html`${icon(ic, 22)}<span class="stack-0"><span class="tiny muted">Class link</span><strong class="small-strong">${text}</strong></span>`;
    return href ? html`<a class="info-tile dashed" href="${href}">${inner}</a>` : html`<div class="info-tile dashed">${inner}</div>`;
  };
  const usable = isWebLink(l.classLink);
  if (l.isHost) return usable ? open('Open the call') : dashed('link', 'Add a link', `/create/new?edit=${l.id}`);
  if (l.going) return usable ? open('Join the call') : dashed('clock', 'Link coming soon');
  return dashed('lock', 'Shown after you RSVP');
}

function hostCard(l) {
  const h = l.host;
  return html`<section class="card host-card">
    ${avatar(h, 56, { font: 19 })}
    <div class="grow stack-4">
      <span class="small muted">Taught by</span>
      <strong class="display h-19">${l.isHost ? `${h.name} (you)` : h.name}</strong>
      ${h.bio ? html`<span class="body-3">${h.bio}</span>` : ''}
      ${l.isHost ? '' : html`<a href="/u/${h.id}" class="strong small self-start pad-y-6">See ${h.firstName}'s profile</a>`}
    </div>
  </section>`;
}

function beforeCard(l) {
  const items = [];
  if (l.prep) items.push(html`${l.prep}`);
  if (l.reading) {
    items.push(isWebLink(l.reading)
      ? html`<strong>Read this first:</strong> <a href="${l.reading}" target="_blank" rel="noopener noreferrer">${hostOf(l.reading)}</a>`
      : html`<strong>The reading:</strong> ${l.reading}`);
  }
  if (!items.length) return '';
  return html`<section class="before-card">
    <h2 class="display h-19 row gap-8">${icon('bag', 22)}Before you come</h2>
    <ul class="plain steps">${items.map((it, i) => html`<li><span class="num">${i + 1}</span><span>${it}</span></li>`)}</ul>
  </section>`;
}

function goingCard(l, over) {
  const shown = l.attendees.slice(0, 5);
  const extra = l.goingCount - shown.length;
  let actions;
  if (l.isHost) actions = html`<p class="small muted">You're teaching this one. Friends who RSVP show up here.</p>`;
  else if (over) actions = html`<p class="small muted">This lesson has finished.</p>`;
  else if (l.going) {
    actions = html`<div class="row gap-8">
      <span class="going-yes grow">${icon('check', 20, 2.6)}You're going</span>
      <button class="btn btn-secondary btn-lg compact" data-action="leave">Can't make it</button>
    </div>`;
  } else actions = html`<button class="btn btn-primary btn-lg" data-action="join">I'm in!</button>`;
  return html`<section class="card pad-18 stack-14">
    <div class="row-between gap-10">
      <div class="faces">
        ${shown.map((u) => avatar(u, 38, { cls: 'face', title: u.name, font: 12 }))}
        ${extra > 0 ? html`<span class="avatar face more" style="width:38px;height:38px">+${extra}</span>` : ''}
      </div>
      <span class="going-count">${l.goingCount ? `${l.goingCount} going` : over ? 'Nobody RSVPed' : 'Be the first to say yes'}</span>
    </div>
    ${actions}
  </section>`;
}

function planCard(l) {
  const f = FORMATS[l.format];
  const title = l.isHost ? 'Your plan' : `${l.host.firstName}'s plan`;
  if (!l.plan) {
    return html`<section class="card pad-18 stack-14">
      <h2 class="display h-19">${title}</h2>
      <div class="surprise-box">
        ${raw('<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="30" width="44" height="28" rx="5" fill="#D99A12"/><rect x="6" y="22" width="52" height="11" rx="4" fill="#F0C455"/><path d="M32 22v36" stroke="#FFFFFF" stroke-width="3.5"/><path d="M32 22c-4-10-14-10-14-5s8 5 14 5zm0 0c4-10 14-10 14-5s-8 5-14 5z" fill="#F0C455"/></svg>')}
        <strong>It's a surprise!</strong>
        <span class="body-3">${l.host.firstName} is keeping the outline under wraps.${l.prep ? '' : ' Just bring an open mind.'}</span>
      </div>
    </section>`;
  }
  if (!l.plan.length) return '';
  return html`<section class="card pad-18 stack-14">
    <h2 class="display h-19">${title}</h2>
    ${l.isHost && l.surprise ? html`<p class="note warn small">${icon('gift', 18)}Friends see this as a surprise. Only you can see the outline.</p>` : ''}
    <div class="seg-bar thin" aria-hidden="true">${l.plan.map((p, i) => html`<span style="flex:${p.min} 1 0;background:${f.ramp[i % f.ramp.length]}"></span>`)}</div>
    <ol class="plain plan-list">
      ${l.plan.map((p) => html`<li>
        <span class="ol-min" style="color:${f.fg}">${p.min} min</span>
        <span class="stack-2"><strong>${p.name}</strong><span class="small muted pre-line">${p.desc || p.hint}</span></span>
      </li>`)}
    </ol>
  </section>`;
}

function afterCard(l, over) {
  const name = l.host.firstName;
  let title;
  let text;
  if (l.isHost) {
    title = 'Thank-you notes';
    text = l.notes.length ? `${l.notes.length} ${l.notes.length > 1 ? 'notes' : 'note'} from your group.` : 'Notes from your group will show up here after the lesson.';
  } else if (over) {
    title = `Say thanks to ${name}`;
    text = l.notes.some((n) => n.author.id === app.me.id) ? 'You sent a note. You can change it any time.' : `Leave ${name} a quick thank-you note.`;
  } else {
    title = 'After the lesson';
    text = `You'll be able to leave ${name} a thank-you note here.`;
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
    const f = FORMATS[l.format];
    const over = isOver(l);
    return html`
<div class="screen">
  <div class="lesson-hero" style="background:${f.bg}">
    <span class="hero-art" aria-hidden="true">${raw(f.art)}</span>
    <div class="hero-bar">
      <a class="icon-btn" href="/?day=${l.date}" aria-label="Back to calendar">${icon('chevronLeft', 20, 2.2)}</a>
      <button class="icon-btn" data-action="share" aria-label="Share lesson">${icon('share', 20)}</button>
    </div>
    <div class="hero-text">
      ${formatPill(l.format, { onHero: true })}
      <h1 class="display h-32">${l.title}</h1>
      ${l.pitch ? html`<p class="hero-pitch" style="color:${f.heroInk}">${l.pitch}</p>` : ''}
    </div>
  </div>

  <main class="lesson-main">
    <section class="grid-2 gap-8" aria-label="When and how long">
      ${infoTile('calendar', 'Date', shortDate(l.date))}
      ${infoTile('clock', 'Time', fmtTime(l.time))}
      ${infoTile('hourglass', 'Length', `${l.length} minutes`)}
      ${linkTile(l)}
    </section>
    ${hostCard(l)}
    ${beforeCard(l)}
    ${goingCard(l, over)}
    ${planCard(l)}
    ${afterCard(l, over)}
    ${l.isHost ? html`<section class="host-tools">
      <a class="btn btn-secondary btn-md grow" href="/create/new?edit=${l.id}">${icon('pencil', 18)}Edit lesson</a>
      <button class="btn btn-danger btn-md" data-action="cancelLesson">${icon('trash', 18)}Cancel it</button>
    </section>` : ''}
  </main>
</div>`;
  },
  actions: {
    async share(s) {
      const url = `${location.origin}/lesson/${s.l.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: s.l.title, text: `Come to "${s.l.title}" on Teach Club`, url });
        } catch {
          // closed the share sheet
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied. Paste it to a friend!');
      } catch {
        toast(url);
      }
    },
    async join(s, button) {
      busy(button, true, 'Saving…');
      await api(`/lessons/${s.l.id}/rsvp`, { method: 'POST' });
      s.l = await fetchLesson(s.l.id);
      render();
      toast("You're in! See you there.");
    },
    async leave(s, button) {
      busy(button, true, 'Saving…');
      await api(`/lessons/${s.l.id}/rsvp`, { method: 'DELETE' });
      s.l = await fetchLesson(s.l.id);
      render();
      toast("No worries. We've taken you off the list.");
    },
    async cancelLesson(s, button) {
      if (!window.confirm(`Cancel "${s.l.title}"? It will be removed from the calendar for everyone.`)) return;
      busy(button, true, 'Cancelling…');
      await api(`/lessons/${s.l.id}`, { method: 'DELETE' });
      toast('Lesson cancelled.');
      navigate('/', { replace: true });
    }
  }
};

// ---------- thank-you notes ----------

function noteCard(n) {
  return html`<div class="card note-card">
    ${avatar(n.author, 36, { font: 12 })}
    <span class="stack-4 grow">
      <strong class="small">${n.author.id === app.me.id ? 'You' : n.author.firstName}</strong>
      ${n.reactions.length ? html`<span class="mini-chips">${n.reactions.map((r) => html`<span>${r}</span>`)}</span>` : ''}
      ${n.body ? html`<span class="body-2 pre-line">${n.body}</span>` : ''}
    </span>
  </div>`;
}

function noteForm(s) {
  const l = s.l;
  if (l.isHost) return '';
  if (!isOver(l)) {
    return html`<section class="card lock-box">
      ${icon('lock', 22)}
      <span>You can leave ${l.host.firstName} a note once the lesson is over. It's on ${shortDate(l.date)} at ${fmtTime(l.time)}.</span>
    </section>`;
  }
  if (!s.editing) {
    return html`<section class="sent-box">
      <span class="sent-check">${icon('check', 26, 2.6)}</span>
      <strong class="display h-20">Sent! That'll make ${l.host.firstName}'s day.</strong>
      <span class="body-ok">Fancy teaching something back? Turns are what keep the club going.</span>
      <div class="row gap-8 mt-6">
        <button class="btn btn-sm btn-outline-ok" data-action="edit">Edit note</button>
        <a class="btn btn-sm btn-primary" href="/create/new">Teach something</a>
      </div>
    </section>`;
  }
  return html`<section class="card pad-18 stack-16">
    <div class="stack-10">
      <h2 class="h-16" id="quick">Quick reactions</h2>
      <div class="wrap gap-8" role="group" aria-labelledby="quick">
        ${REACTIONS.map((r) => {
          const on = s.picked.includes(r);
          return html`<button class="react-chip ${on ? 'on' : ''}" data-action="react" data-r="${r}" aria-pressed="${on ? 'true' : 'false'}">${r}</button>`;
        })}
      </div>
    </div>
    <div class="field">
      <label for="learned" class="h-16">What I learned</label>
      <textarea id="learned" class="input soft" rows="4" maxlength="500" data-input="note" placeholder="One thing that stuck with you…">${s.note}</textarea>
      <span class="hint">A sentence is plenty. ${l.host.firstName} will see it on their profile.</span>
    </div>
    <button class="btn btn-primary btn-lg" data-action="send">Send my note</button>
  </section>`;
}

export const thanks = {
  title: (s) => `Thanks · ${s.l.title}`,
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
    <a class="icon-btn" href="/lesson/${l.id}" aria-label="Back to lesson">${icon('chevronLeft', 20, 2.2)}</a>
    <span class="status-pill ${over ? 'ok' : ''}"><span class="dot"></span>${over ? happenedLabel(l.date) : `Coming up ${shortDate(l.date)}`}</span>
    <span class="spacer-44"></span>
  </div>

  <div class="center-col stack-12 pad-x-8">
    ${avatar(l.host, 76, { display: true, font: 26 })}
    <h1 class="display h-28">${l.isHost ? 'Notes from your group' : `Say thanks to ${l.host.firstName}`}</h1>
    <p class="muted">${l.title} · ${l.length} min</p>
  </div>

  ${noteForm(s)}

  <section class="stack-10">
    <h2 class="display h-19 pad-x-4">From the group</h2>
    ${others.length ? others.map(noteCard) : html`<p class="empty-note">${over ? 'No notes yet.' : 'Notes show up here after the lesson.'}</p>`}
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
      if (!s.picked.length && !s.note.trim()) return toast('Pick a reaction or write a line first.');
      busy(button, true, 'Sending…');
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
