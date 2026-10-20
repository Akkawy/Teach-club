// Followers & requests (/follows) and the site owner's report review (/owner).

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { t } from '../i18n.js';
import { avatar, icon, toast, bottomNav } from '../ui.js';

const TABS = ['requests', 'followers', 'following', 'blocked'];

function personRow(u, buttons) {
  return html`<li class="card member-row">
    <div class="row gap-10">
      <a href="/u/${u.id}" class="member-main grow min0">${avatar(u, 40, { font: 14 })}<strong class="grow min0"><bdi>${u.name}</bdi></strong></a>
      <div class="row gap-6">${buttons}</div>
    </div>
  </li>`;
}

export const follows = {
  title: () => t('social.title'),
  async load({ query }) {
    const data = await api('/follows');
    app.followRequests = data.requests.length;
    const wanted = query.get('tab');
    return { ...data, tab: TABS.includes(wanted) ? wanted : data.requests.length ? 'requests' : 'followers' };
  },
  view(s) {
    const lists = {
      requests: s.requests.map((u) => personRow(u, html`
        <button class="chip-btn" data-action="accept" data-id="${u.id}">${icon('check', 16, 2.4)}${t('social.accept')}</button>
        <button class="chip-btn danger" data-action="decline" data-id="${u.id}">${t('social.decline')}</button>`)),
      followers: s.followers.map((u) => personRow(u, html`<button class="chip-btn" data-action="decline" data-id="${u.id}">${t('social.remove')}</button>`)),
      following: s.following.map((u) => personRow(u, html`<button class="chip-btn" data-action="unfollow" data-id="${u.id}">${u.pending ? t('social.requested') : t('social.unfollow')}</button>`)),
      blocked: s.blocked.map((u) => personRow(u, html`<button class="chip-btn" data-action="unblock" data-id="${u.id}">${t('social.unblock')}</button>`))
    };
    const label = { requests: t('social.tabRequests'), followers: t('social.tabFollowers'), following: t('social.tabFollowing'), blocked: t('social.tabBlocked') };
    const count = { requests: s.requests.length, followers: s.followers.length, following: s.following.length, blocked: s.blocked.length };
    return html`
<div class="screen with-nav">
  <header class="page-head">
    <a class="icon-btn" href="/profile" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    <h1 class="display h-30">${t('social.title')}</h1>
  </header>
  <main class="lesson-main">
    <div class="tabs four" role="tablist">${TABS.map((k) => html`<button role="tab" class="${s.tab === k ? 'on' : ''}" aria-selected="${s.tab === k ? 'true' : 'false'}" data-action="tab" data-tab="${k}">${label[k]}${count[k] ? html` <span class="count-pill">${count[k]}</span>` : ''}</button>`)}</div>
    ${lists[s.tab].length ? html`<ul class="plain stack-8">${lists[s.tab]}</ul>` : html`<p class="empty-note">${t('social.empty')}</p>`}
  </main>
  ${bottomNav('profile')}
</div>`;
  },
  actions: {
    tab(s, el) {
      s.tab = el.dataset.tab;
      render();
    },
    async accept(s, el) {
      await api(`/follows/${el.dataset.id}/accept`, { method: 'POST' });
      navigate(`/follows?tab=${s.tab}`, { replace: true });
    },
    async decline(s, el) {
      await api(`/follows/${el.dataset.id}`, { method: 'DELETE' });
      navigate(`/follows?tab=${s.tab}`, { replace: true });
    },
    async unfollow(s, el) {
      await api(`/users/${el.dataset.id}/follow`, { method: 'DELETE' });
      navigate(`/follows?tab=${s.tab}`, { replace: true });
    },
    async unblock(s, el) {
      await api(`/users/${el.dataset.id}/block`, { method: 'DELETE' });
      toast(t('social.unblocked'));
      navigate(`/follows?tab=${s.tab}`, { replace: true });
    }
  }
};

export const owner = {
  title: () => t('owner.title'),
  async load() {
    if (!app.owner) return { redirect: '/' };
    return api('/owner/reports');
  },
  view: (s) => html`
<div class="screen with-nav">
  <header class="page-head">
    <a class="icon-btn" href="/club" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    <h1 class="display h-30 row gap-8">${icon('shield', 26)}${t('owner.heading')}</h1>
    <p class="lede">${t('owner.lede')}</p>
  </header>
  <main class="lesson-main">
    ${s.reports.length ? html`<ul class="plain stack-10">${s.reports.map((r) => html`<li class="card pad-16 stack-8">
      <div class="row-between gap-8"><strong>${t(`report.reasons.${r.reason}`)}</strong><span class="tiny muted"><bdi>${t('owner.club', { club: r.club })}</bdi></span></div>
      ${r.lesson ? html`<a href="/lesson/${r.lesson.id}" class="small">${t('club.reportOn', { title: r.lesson.title })}${r.lesson.hidden ? html` <span class="tag">${t('owner.hidden')}</span>` : ''}</a>` : ''}
      ${r.member ? html`<a href="/u/${r.member.id}" class="small">${t('club.reportOnMember', { name: r.member.name })}</a>` : ''}
      ${r.details ? html`<p class="body-3 pre-line" dir="auto">${r.details}</p>` : ''}
      ${r.reporter ? html`<span class="tiny muted">${t('club.reportBy', { name: r.reporter })}</span>` : ''}
      <div class="row gap-8 wrap">
        <button class="chip-btn" data-action="resolve" data-id="${r.id}">${icon('check', 16, 2.4)}${t('club.resolve')}</button>
        ${r.lesson ? html`<button class="chip-btn danger" data-action="deleteLesson" data-id="${r.lesson.id}">${icon('trash', 16)}${t('club.deleteLesson')}</button>` : ''}
        ${r.lesson ? html`<button class="chip-btn danger" data-action="ban" data-id="${r.lesson.hostId}">${t('social.ban')}</button>` : ''}
        ${r.member && !r.member.banned ? html`<button class="chip-btn danger" data-action="ban" data-id="${r.member.id}">${t('social.ban')}</button>` : ''}
      </div>
    </li>`)}</ul>` : html`<p class="empty-note">${t('owner.none')}</p>`}
  </main>
  ${bottomNav('club')}
</div>`,
  actions: {
    async resolve(s, el) {
      await api(`/reports/${el.dataset.id}/resolve`, { method: 'POST' });
      toast(t('club.resolved'));
      navigate('/owner', { replace: true });
    },
    async deleteLesson(s, el) {
      if (!window.confirm(t('club.deleteLessonConfirm'))) return;
      await api(`/lessons/${el.dataset.id}`, { method: 'DELETE' });
      navigate('/owner', { replace: true });
    },
    async ban(s, el) {
      if (!window.confirm(t('social.banConfirm', { name: '' }))) return;
      await api(`/owner/users/${el.dataset.id}/ban`, { method: 'POST' });
      navigate('/owner', { replace: true });
    }
  }
};
