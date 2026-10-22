// "Teach me…": the club's wishlist. Add what you'd love to learn, vote "me too", or pick one up to teach.
// Shown as the Wishes tab of Explore.

import { html } from '../html.js';
import { api } from '../api.js';
import { app, render } from '../core.js';
import { t, tp } from '../i18n.js';
import { avatar, icon, toast, busy, showError } from '../ui.js';
import { withFollow } from '../follow.js';
import { shortDate, localize } from '../dates.js';

async function fetchWishes(s) {
  const { wishes } = await api('/wishes');
  wishes.forEach((w) => w.lesson && localize(w.lesson));
  s.wishes = wishes;
}

function wishCard(w) {
  const mine = w.author.id === app.me.id;
  return html`<li class="card wish-card">
    <div class="wish-top">
      <div class="grow min0 stack-4">
        <strong class="wish-title" dir="auto">${w.title}</strong>
        ${w.details ? html`<span class="body-3" dir="auto">${w.details}</span>` : ''}
        <span class="who small">${withFollow(w.author, avatar(w.author, 22, { font: 9 }), 22)}${t('wishes.by', { name: mine ? t('common.you') : w.author.firstName })}</span>
      </div>
      <button class="vote-btn ${w.voted ? 'on' : ''}" data-action="vote" data-id="${w.id}" data-on="${w.voted ? '0' : '1'}" aria-pressed="${w.voted ? 'true' : 'false'}" ${w.lesson ? 'disabled' : ''}>
        ${icon('heart', 20, 2.2)}<span>${w.votes}</span>
        <span class="sr-only">${tp('votes', w.votes)}</span>
      </button>
    </div>
    ${w.lesson
      ? html`<a class="wish-taught" href="/lesson/${w.lesson.id}">${avatar(w.lesson.host, 26, { font: 10 })}<span class="grow">${t('wishes.taught', { name: w.lesson.host.id === app.me.id ? t('common.you') : w.lesson.host.firstName })} · ${shortDate(w.lesson.date)}</span>${icon('chevronRight', 16, 2.2)}</a>`
      : html`<div class="row gap-8 wrap">
          ${mine ? '' : html`<a class="btn btn-soft btn-sm" href="/create/new?wish=${w.id}">${icon('plus', 18, 2.4)}${t('wishes.teach')}</a>`}
          ${mine || app.club.role === 'admin' ? html`<button class="btn btn-ghost btn-sm" data-action="remove" data-id="${w.id}">${icon('trash', 16)}${t('wishes.remove')}</button>` : ''}
        </div>`}
  </li>`;
}

// The wishlist now lives in Explore → Wishes; old /wishes links go there.
export const wishes = {
  load: () => ({ redirect: '/explore?tab=wishes' }),
  view: () => ''
};

// What the Explore screen shows on its Wishes tab.
export function wishesPanel(s) {
  const open = s.wishes.filter((w) => !w.lesson);
  const taken = s.wishes.filter((w) => w.lesson);
  return html`
    <p class="lede pad-x-4">${t('wishes.lede')}</p>
    <form class="card pad-18 stack-12" data-submit="add" novalidate>
      <label for="wish-title" class="h-16">${t('wishes.addTitle')}</label>
      <p class="form-error" id="wish-error" role="alert" hidden></p>
      <input id="wish-title" class="input soft" name="title" maxlength="80" dir="auto" placeholder="${t('wishes.titlePh')}" required>
      <textarea class="input soft" name="details" rows="2" maxlength="240" dir="auto" placeholder="${t('wishes.detailsPh')}" aria-label="${t('wishes.detailsPh')}"></textarea>
      <button class="btn btn-primary btn-md" type="submit">${icon('plus', 18, 2.4)}${t('wishes.add')}</button>
    </form>

    ${s.wishes.length ? '' : html`<p class="empty-note">${t('wishes.empty')}</p>`}
    ${open.length ? html`<section class="stack-10"><h2 class="eyebrow">${t('wishes.open')}</h2><ul class="plain stack-10">${open.map(wishCard)}</ul></section>` : ''}
    ${taken.length ? html`<section class="stack-10"><h2 class="eyebrow">${t('wishes.done')}</h2><ul class="plain stack-10">${taken.map(wishCard)}</ul></section>` : ''}`;
}

export { fetchWishes };

export const wishActions = {
  async add(s, form) {
    const data = Object.fromEntries(new FormData(form));
    if (!String(data.title || '').trim()) return showError('wish-error', t('wishes.titlePh'));
    const button = form.querySelector('[type=submit]');
    busy(button, true, t('wishes.adding'));
    try {
      await api('/wishes', { method: 'POST', body: { title: data.title, details: data.details } });
    } catch (err) {
      busy(button, false);
      return showError('wish-error', err.message);
    }
    await fetchWishes(s);
    render();
    toast(t('wishes.added'));
  },
  async vote(s, el) {
    await api(`/wishes/${el.dataset.id}/vote`, { method: el.dataset.on === '1' ? 'POST' : 'DELETE' });
    await fetchWishes(s);
    render();
  },
  async remove(s, el) {
    if (!window.confirm(t('wishes.removeConfirm'))) return;
    await api(`/wishes/${el.dataset.id}`, { method: 'DELETE' });
    await fetchWishes(s);
    render();
  }
};
