// Quick follow: a small ➕ on people's faces all over the app (lesson cards, videos, comments, club
// members…). One tap follows (or asks to, if they approve followers), with Undo in the toast.
// Also keeps the bell's unread count fresh.

import { html } from './html.js';
import { api } from './api.js';
import { app, addGlobalActions } from './core.js';
import { t, tp } from './i18n.js';
import { icon, toast, setUnreadForBells } from './ui.js';

export const canQuickFollow = (u) =>
  !!(app.me && u && u.id && u.id !== app.me.id && !app.following.has(u.id) && !app.requested.has(u.id) && !app.blocked.has(u.id));

// An avatar (already rendered) with the ➕ in its corner, when following makes sense.
export function withFollow(u, face, size = 28) {
  if (!canQuickFollow(u)) return face;
  const small = size < 32;
  return html`<span class="qf-wrap">${face}<button type="button" class="qf ${small ? 'qf-s' : ''}" data-action="quickFollow" data-user="${u.id}" data-name="${u.firstName}"
    aria-label="${t('quickFollow.follow', { name: u.firstName })}">${icon('plus', small ? 10 : 12, 3.2)}</button></span>`;
}

// A full-size "Follow" button that works the same way (for "People to follow" and lists of people).
export function followButton(u) {
  if (!app.me || !u || u.id === app.me.id || app.blocked.has(u.id)) return '';
  const done = app.following.has(u.id) || app.requested.has(u.id);
  return html`<button type="button" class="btn ${done ? 'btn-secondary' : 'btn-soft'} btn-sm qf-btn" data-action="quickFollow" data-user="${u.id}" data-name="${u.firstName}" ${done ? 'disabled' : ''}>
    ${followLabel(done ? (app.requested.has(u.id) ? 'requested' : 'following') : 'follow')}</button>`;
}

const followLabel = (k) => (k === 'follow' ? html`${icon('plus', 16, 2.6)}${t('social.follow')}`
  : html`${icon('check', 16, 2.6)}${k === 'requested' ? t('social.requested') : t('social.following')}`);

function markButtons(id, done, requested = false) {
  document.querySelectorAll(`.qf-btn[data-user="${id}"]`).forEach((b) => {
    b.disabled = done;
    b.classList.toggle('btn-soft', !done);
    b.classList.toggle('btn-secondary', done);
    b.innerHTML = String(followLabel(done ? (requested ? 'requested' : 'following') : 'follow'));
  });
  document.querySelectorAll(`.qf[data-user="${id}"]`).forEach((b) => {
    b.classList.toggle('done', done);
    b.disabled = done;
    b.innerHTML = String(icon(done ? 'check' : 'plus', b.classList.contains('qf-s') ? 10 : 12, 3.2));
    b.setAttribute('aria-label', t(done ? 'quickFollow.following' : 'quickFollow.follow', { name: b.dataset.name }));
  });
}

addGlobalActions({
  async quickFollow(state, el, event) {
    event?.stopPropagation();
    const id = Number(el.dataset.user);
    const name = el.dataset.name;
    markButtons(id, true);
    let follow;
    try {
      ({ follow } = await api(`/users/${id}/follow`, { method: 'POST' }));
    } catch (err) {
      markButtons(id, false);
      throw err;
    }
    (follow === 'pending' ? app.requested : app.following).add(id);
    if (follow === 'pending') markButtons(id, true, true);
    toast(t(follow === 'pending' ? 'quickFollow.requested' : 'quickFollow.done', { name }), {
      label: t('quickFollow.undo'),
      async run() {
        await api(`/users/${id}/follow`, { method: 'DELETE' }).catch(() => {});
        app.following.delete(id);
        app.requested.delete(id);
        markButtons(id, false);
        toast(t('quickFollow.undone', { name }));
      }
    });
  }
});

// ---------- the bell ----------

export function setUnread(n) {
  app.unread = n;
  setUnreadForBells(n);
}

// Checks for new notifications every minute while the app is open and visible.
export function startBellPolling() {
  setUnreadForBells(app.unread);
  const tick = async () => {
    if (!app.me || document.hidden) return;
    try {
      setUnread((await api('/notifications/unread')).unread);
    } catch {
      // offline or logged out: try again next time
    }
  };
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });
}

// Little helper for screens: "Sara", "Sara and Ali", "Sara and 4 others".
export function namesOf(actors, total) {
  const first = actors[0] ? actors[0].firstName : '';
  if (total <= 1 || actors.length === 0) return first;
  if (total === 2 && actors[1]) return t('notif.two', { a: first, b: actors[1].firstName });
  return tp('others', total - 1, { name: first });
}
