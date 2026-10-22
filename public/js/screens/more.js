// Smaller screens: reporting a lesson or member, deleting your account, the privacy page,
// and the year-in-review ("Wrapped").

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate } from '../core.js';
import { fmt } from '../formats.js';
import { t, tp } from '../i18n.js';
import { avatar, icon, toast, busy, showError, langToggle, bottomNav } from '../ui.js';
import { monthName } from '../dates.js';

// ---------- report ----------

export const report = {
  title: () => t('report.title'),
  needsClub: true,
  async load({ query }) {
    const lessonId = query.get('lesson');
    const userId = query.get('user');
    if (lessonId) return { lessonId, back: `/lesson/${lessonId}` };
    const videoId = query.get('video');
    const commentId = query.get('comment');
    if (videoId) return { videoId, back: `/video/${videoId}` };
    if (commentId) return { commentId, back: /^\d+$/.test(query.get('from') || '') ? `/video/${query.get('from')}` : '/explore' };
    if (userId) {
      const { user } = await api(`/users/${encodeURIComponent(userId)}`);
      return { userId, name: user.name, back: `/u/${userId}` };
    }
    return { redirect: '/' };
  },
  view: (s) => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">
    <a class="icon-btn" href="${s.back}" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
  </div>
  <div class="stack-8">
    <h1 class="display h-30 row gap-8">${icon('flag', 26)}${s.lessonId ? t('report.lessonHeading') : s.videoId ? t('video.reportHeading') : s.commentId ? t('video.reportCommentHeading') : t('report.memberHeading', { name: s.name })}</h1>
    <p class="lede">${t('report.lede')}</p>
  </div>
  <form class="form" data-submit="send" novalidate>
    <p class="form-error" id="report-error" role="alert" hidden></p>
    <fieldset class="plain-fieldset stack-8">
      <legend class="sr-only">${t('report.title')}</legend>
      ${['spam', 'offensive', 'unsafe', 'other'].map((r) => html`<label class="radio-card"><input type="radio" name="reason" value="${r}"><span>${t(`report.reasons.${r}`)}</span></label>`)}
    </fieldset>
    <textarea class="input" name="details" rows="3" maxlength="500" dir="auto" placeholder="${t('report.detailsPh')}" aria-label="${t('report.detailsPh')}"></textarea>
    <button class="btn btn-primary btn-lg" type="submit">${t('report.send')}</button>
  </form>
</main>`,
  actions: {
    async send(s, form) {
      const data = Object.fromEntries(new FormData(form));
      if (!data.reason) return showError('report-error', t('report.pick'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('report.sending'));
      try {
        await api('/reports', { method: 'POST', body: { reason: data.reason, details: data.details, lessonId: s.lessonId, userId: s.userId, videoId: s.videoId, commentId: s.commentId } });
      } catch (err) {
        busy(button, false);
        return showError('report-error', err.message);
      }
      toast(t('report.sent'));
      navigate(s.back, { replace: true });
    }
  }
};

// ---------- delete account ----------

export const deleteAccount = {
  title: () => t('account.title'),
  view: () => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">
    <a class="icon-btn" href="/profile/edit" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
  </div>
  <div class="stack-12">
    <h1 class="display h-30">${t('account.heading')}</h1>
    <p class="lede">${t('account.lede')}</p>
    <p class="note warn small">${icon('users', 18)}${t('account.clubsNote')}</p>
  </div>
  <form class="form" data-submit="remove" novalidate>
    <p class="form-error" id="delete-error" role="alert" hidden></p>
    <label class="field">${t('account.password')}
      <input class="input" name="password" type="password" dir="ltr" autocomplete="current-password" required>
    </label>
    <button class="btn btn-danger btn-lg" type="submit">${icon('trash', 18)}${t('account.remove')}</button>
  </form>
</main>`,
  actions: {
    async remove(s, form) {
      const password = String(new FormData(form).get('password') || '');
      if (!password) return showError('delete-error', t('account.password'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('account.removing'));
      try {
        await api('/me', { method: 'DELETE', body: { password } });
      } catch (err) {
        busy(button, false);
        return showError('delete-error', err.message);
      }
      app.me = null;
      app.club = null;
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
      toast(t('account.done'));
      navigate('/login', { replace: true });
    }
  }
};

// ---------- privacy ----------

export const privacy = {
  title: () => t('privacy.title'),
  public: true,
  view: () => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">
    <a class="icon-btn" href="${app.me ? '/profile/edit' : '/login'}" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    ${langToggle()}
  </div>
  <h1 class="display h-30 row gap-8">${icon('shield', 26)}${t('privacy.heading')}</h1>
  ${t('privacy.sections').map((sec) => html`<section class="stack-6"><h2 class="h-17">${sec.h}</h2><p class="body-2">${sec.p}</p></section>`)}
  <p class="tiny muted">${t('privacy.updated')}</p>
</main>`
};

// ---------- Wrapped ----------

function statCard(bg, fg, big, line) {
  return html`<div class="wrap-card" style="background:${bg};color:${fg}"><strong class="display wrap-big">${big}</strong><span>${line}</span></div>`;
}

export const wrapped = {
  title: () => t('wrapped.title'),
  needsClub: true,
  async load({ query }) {
    const year = Number(query.get('year')) || new Date().getFullYear();
    return api(`/wrapped?year=${year}`);
  },
  view(s) {
    const c = s.club;
    const m = s.me;
    const fmtLabel = (k) => (k ? fmt(k).label : '');
    const lines = [];
    if (c.lessons) {
      lines.push(statCard('#FCE9DD', '#8A3510', c.lessons, t('wrapped.lessons', { lessons: tp('lessons', c.lessons) })));
      lines.push(statCard('#E4EEFB', '#1D4F8F', c.minutes, t('wrapped.minutes', { minutes: tp('minLong', c.minutes) })));
      lines.push(statCard('#DDF2EA', '#11684F', c.teachers, t('wrapped.teachers', { friends: tp('friends', c.teachers) })));
    }
    return html`
<div class="screen with-nav">
  <header class="page-head">
    <a class="icon-btn" href="/club" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    <h1 class="display h-34 row gap-8">${icon('trophy', 30)}${t('wrapped.heading', { year: s.year })}</h1>
    <p class="lede"><bdi>${t('wrapped.soFar', { club: c.name })}</bdi></p>
  </header>
  <main class="lesson-main">
    ${c.lessons ? html`
      <h2 class="eyebrow">${t('wrapped.clubTitle')}</h2>
      <div class="wrap-grid">${lines}</div>
      <ul class="plain stack-8">
        ${c.topTeacher ? html`<li class="card wrap-line">${avatar(c.topTeacher.user, 36, { font: 12 })}<span>${t('wrapped.topTeacher', { name: c.topTeacher.user.firstName, lessons: tp('lessons', c.topTeacher.lessons) })}</span></li>` : ''}
        ${c.topLesson ? html`<li class="card wrap-line">${icon('heart', 22)}<a href="/lesson/${c.topLesson.id}"><bdi>${t('wrapped.topLesson', { title: c.topLesson.title })}</bdi></a></li>` : ''}
        ${c.topFormat ? html`<li class="card wrap-line">${icon(fmt(c.topFormat).icon, 22)}<span>${t('wrapped.topFormat', { format: fmtLabel(c.topFormat) })}</span></li>` : ''}
        ${c.busiestMonth != null ? html`<li class="card wrap-line">${icon('calendar', 22)}<span>${t('wrapped.busiest', { month: monthName(c.busiestMonth) })}</span></li>` : ''}
      </ul>

      <h2 class="eyebrow">${t('wrapped.youTitle')}</h2>
      <ul class="plain stack-8">
        <li class="card wrap-line">${icon('mic', 22)}<span>${t('wrapped.taught', { lessons: tp('lessons', m.taught) })} · ${t('wrapped.taughtMin', { minutes: tp('minLong', m.taughtMinutes) })}</span></li>
        <li class="card wrap-line">${icon('users', 22)}<span>${t('wrapped.attended', { lessons: tp('lessons', m.attended) })} · ${t('wrapped.learned', { minutes: tp('minLong', m.learnedMinutes) })}</span></li>
        ${m.thanks ? html`<li class="card wrap-line">${icon('heart', 22)}<span>${t('wrapped.thanks', { thanks: tp('thanks', m.thanks) })}</span></li>` : ''}
        ${m.topFormat ? html`<li class="card wrap-line">${icon(fmt(m.topFormat).icon, 22)}<span>${t('wrapped.myFormat', { format: fmtLabel(m.topFormat) })}</span></li>` : ''}
        ${m.biggestFan ? html`<li class="card wrap-line">${avatar(m.biggestFan.user, 36, { font: 12 })}<span>${t('wrapped.fan', { name: m.biggestFan.user.firstName })}</span></li>` : ''}
      </ul>
      ${navigator.share ? html`<button class="btn btn-primary btn-lg" data-action="share">${icon('share', 18)}${t('wrapped.share')}</button>` : ''}`
      : html`<p class="empty-note">${t('wrapped.empty')}</p>`}
  </main>
  ${bottomNav('club')}
</div>`;
  },
  actions: {
    async share(s) {
      try {
        await navigator.share({
          title: t('wrapped.heading', { year: s.year }),
          text: t('wrapped.shareText', { year: s.year, lessons: tp('lessons', s.club.lessons), minutes: tp('minLong', s.club.minutes) })
        });
      } catch {
        // closed the share sheet
      }
    }
  }
};
