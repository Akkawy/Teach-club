// The bell: follows, people joining your lessons, questions, thank-you notes, comments… grouped so
// "Sara and 4 others joined Coffee basics" is one line. Opening the page marks everything as read.

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate } from '../core.js';
import { t, th, lang } from '../i18n.js';
import { avatar, icon, bottomNav } from '../ui.js';
import { namesOf, setUnread } from '../follow.js';

const ICONS = {
  follow: 'user', follow_request: 'user', follow_accepted: 'check', rsvp: 'check', question: 'bubbles', note: 'heart',
  waitlist_up: 'star', answer: 'bubbles', lesson_changed: 'pencil', lesson_cancelled: 'close',
  video_comment: 'bubbles', video_interest: 'hand', video_lesson: 'calendar', wish_taught: 'sparkle'
};

function hrefOf(n) {
  if (n.type === 'follow_request') return '/follows';
  if (n.type === 'follow' || n.type === 'follow_accepted') return n.actors[0] ? `/u/${n.actors[0].id}` : '/follows';
  if (n.lesson && (n.type !== 'video_comment' && n.type !== 'video_interest')) return `/lesson/${n.lesson.id}`;
  if (n.video) return `/video/${n.video.id}`;
  return null;
}

function ago(ms) {
  const sec = Math.round((ms - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en', { numeric: 'auto' });
  const abs = Math.abs(sec);
  if (abs < 60) return t('notif.justNow');
  // The biggest unit that fits: 5 minutes ago, 3 hours ago, yesterday, last week…
  const units = [[31557600, 'year'], [2629800, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  const [size, unit] = units.find(([n]) => abs >= n);
  return rtf.format(Math.round(sec / size), unit);
}

function item(n) {
  const strong = (s) => html`<strong><bdi>${s}</bdi></strong>`;
  const who = strong(namesOf(n.actors, n.count));
  const lesson = strong(n.lesson ? n.lesson.title : n.data.title || '');
  const video = strong(n.video ? n.video.title : '');
  const text = th(`notif.types.${n.type}`, { who, lesson, video });
  const href = hrefOf(n);
  const face = n.actors[0]
    ? html`<span class="notif-face">${avatar(n.actors[0], 44, { font: 15 })}<span class="notif-kind">${icon(ICONS[n.type] || 'bell', 12, 2.6)}</span></span>`
    : html`<span class="notif-face soft-square">${icon(ICONS[n.type] || 'bell', 22)}</span>`;
  const body = html`${face}<span class="grow min0 stack-2"><span class="notif-text">${text}</span><span class="tiny muted">${ago(n.at)}</span></span>
    ${n.unread ? html`<span class="unread-dot" aria-label="${t('notif.new')}"></span>` : ''}`;
  return html`<li>${href ? html`<a class="notif ${n.unread ? 'unread' : ''}" href="${href}">${body}</a>` : html`<div class="notif ${n.unread ? 'unread' : ''}">${body}</div>`}</li>`;
}

export const notifications = {
  title: () => t('notif.title'),
  async load() {
    const data = await api('/notifications');
    if (data.unread) api('/notifications/read', { method: 'POST' }).catch(() => {});
    setUnread(0);
    return data;
  },
  view(s) {
    const fresh = s.items.filter((n) => n.unread);
    const earlier = s.items.filter((n) => !n.unread);
    return html`
<div class="screen with-nav">
  <div class="profile-top">
    <button class="icon-btn" data-action="back" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</button>
    <a class="pill-btn" href="/profile/edit#notify">${icon('bell', 16)}${t('notif.settings')}</a>
  </div>
  <header class="page-head pt-0">
    <h1 class="display h-30">${t('notif.title')}</h1>
  </header>
  <main class="lesson-main">
    ${app.followRequests ? html`<a class="card wish-taught" href="/follows">${icon('users', 20)}<span class="grow strong">${t('social.newRequests', { n: app.followRequests })}</span>${icon('chevronRight', 16, 2.2)}</a>` : ''}
    ${s.items.length ? '' : html`<div class="empty-day">${icon('bell', 30)}<span class="muted">${t('notif.empty')}</span></div>`}
    ${fresh.length ? html`<section class="stack-8"><h2 class="eyebrow">${t('notif.new')}</h2><ul class="plain notif-list">${fresh.map(item)}</ul></section>` : ''}
    ${earlier.length ? html`<section class="stack-8"><h2 class="eyebrow">${t('notif.earlier')}</h2><ul class="plain notif-list">${earlier.map(item)}</ul></section>` : ''}
  </main>
  ${bottomNav(null)}
</div>`;
  },
  actions: {
    back() {
      if (history.length > 1) history.back();
      else navigate('/');
    }
  }
};
