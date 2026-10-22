// Explore: videos people shared (ideas, vlogs, recipes, how-tos) and the club's "Teach me…" wishlist.
// The Videos tab starts with "People to follow".

import { html } from '../html.js';
import { api } from '../api.js';
import { app, render } from '../core.js';
import { t } from '../i18n.js';
import { avatar, icon, bottomNav, bellLink } from '../ui.js';
import { followButton, canQuickFollow } from '../follow.js';
import { videoGrid } from '../videos.js';
import { wishesPanel, wishActions, fetchWishes } from './wishes.js';

export const TOPIC_KEYS = ['cooking', 'tech', 'languages', 'art', 'music', 'science', 'sports', 'health', 'money', 'books', 'games', 'crafts', 'travel', 'career', 'history', 'nature'];

async function fetchVideos(s, more = false) {
  const q = new URLSearchParams({ scope: s.scope });
  if (s.topic) q.set('topic', s.topic);
  if (more && s.videos.length) q.set('before', s.videos[s.videos.length - 1].id);
  const { videos, more: hasMore } = await api(`/videos?${q}`);
  s.videos = more ? s.videos.concat(videos) : videos;
  s.more = hasMore;
}

function peopleRow(s) {
  // People you followed from here stay until the next visit, showing ✓.
  const people = s.people.filter((p) => canQuickFollow(p.user) || s.shown.has(p.user.id));
  people.forEach((p) => s.shown.add(p.user.id));
  if (!people.length) return '';
  return html`<section class="stack-10">
    <h2 class="display h-19 pad-x-4">${t('explore.people')}</h2>
    <ul class="plain people-row">${people.map(({ user: u, reason }) => html`<li class="card person-card">
      <a href="/u/${u.id}" class="stack-6 center-col">
        ${avatar(u, 56, { font: 20 })}
        <strong class="person-name"><bdi>${u.firstName}</bdi></strong>
        <span class="tiny muted">${t(`explore.why.${reason}`)}</span>
      </a>
      ${followButton(u)}
    </li>`)}</ul>
  </section>`;
}

function videosPanel(s) {
  const scopes = app.club ? ['all', 'club', 'following'] : [];
  return html`
    <p class="lede pad-x-4">${t('explore.lede')}</p>
    <a class="btn btn-primary btn-md self-start" href="/videos/new">${icon('plus', 18, 2.4)}${t('explore.share')}</a>
    ${peopleRow(s)}
    <div class="stack-10">
      ${scopes.length ? html`<div class="seg-switch" role="radiogroup" aria-label="${t('feed.label')}">
        ${scopes.map((k) => html`<button role="radio" aria-checked="${s.scope === k ? 'true' : 'false'}" class="${s.scope === k ? 'on' : ''}" data-action="scope" data-scope="${k}">${t(`feed.${k}`)}</button>`)}
      </div>` : ''}
      <label class="field small strong">${t('explore.topic')}
        <select class="input soft" data-change="topic">
          <option value="">${t('explore.allTopics')}</option>
          ${TOPIC_KEYS.map((k) => html`<option value="${k}" ${s.topic === k ? 'selected' : ''}>${t(`topics.${k}`)}</option>`)}
        </select>
      </label>
    </div>
    ${s.videos.length ? videoGrid(s.videos) : html`<p class="empty-note">${s.topic || s.scope !== 'all' ? t('explore.emptyFilter') : t('explore.empty')}</p>`}
    ${s.more ? html`<button class="btn btn-secondary btn-md self-center" data-action="more">${t('explore.more')}</button>` : ''}`;
}

export const explore = {
  title: () => t('explore.title'),
  async load({ query }) {
    const s = { tab: query.get('tab') === 'wishes' ? 'wishes' : 'videos', scope: 'all', topic: '', videos: [], more: false, people: [], wishes: [], shown: new Set() };
    if (s.tab === 'wishes') {
      if (app.club) await fetchWishes(s);
    } else {
      const [, people] = await Promise.all([fetchVideos(s), api('/people/suggested').catch(() => ({ people: [] }))]);
      s.people = people.people;
    }
    return s;
  },
  view(s) {
    const tab = (key, ic, label) => html`<a role="tab" href="/explore${key === 'wishes' ? '?tab=wishes' : ''}" class="${s.tab === key ? 'on' : ''}" aria-selected="${s.tab === key ? 'true' : 'false'}">${icon(ic, 18)}${label}</a>`;
    return html`
<div class="screen with-nav">
  <header class="page-head">
    <div class="row-between">
      <h1 class="display h-30 row gap-8">${icon('compass', 28)}${t('explore.title')}</h1>
      ${bellLink()}
    </div>
    <div class="tabs mt-12" role="tablist">${tab('videos', 'video', t('explore.videos'))}${tab('wishes', 'sparkle', t('explore.wishes'))}</div>
  </header>

  <main class="lesson-main" role="tabpanel">
    ${s.tab === 'videos'
      ? videosPanel(s)
      : app.club ? wishesPanel(s) : html`<section class="card pad-18 stack-10">
          <strong class="display h-19">${t('explore.wishesNoClub')}</strong>
          <a class="btn btn-soft btn-sm self-start" href="/clubs/start">${icon('users', 18)}${t('feed.noClubButton')}</a>
        </section>`}
  </main>

  ${bottomNav('explore')}
</div>`;
  },
  actions: {
    ...wishActions,
    async scope(s, el) {
      s.scope = el.dataset.scope;
      await fetchVideos(s);
      render();
    },
    async more(s, el) {
      el.disabled = true;
      await fetchVideos(s, true);
      render();
    }
  },
  changes: {
    async topic(s, el) {
      s.topic = el.value;
      await fetchVideos(s);
      render();
    }
  }
};
