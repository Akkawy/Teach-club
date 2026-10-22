// A video's page (player, "I'd join a lesson on this", comments, turn into a lesson) and sharing a new one.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { t, tp } from '../i18n.js';
import { avatar, icon, toast, busy, showError, linkify } from '../ui.js';
import { withFollow } from '../follow.js';
import { player, startPlayer, siteName } from '../videos.js';
import { TOPIC_KEYS } from './explore.js';

const back = () => (history.length > 1 ? history.back() : navigate('/explore'));

function commentItem(s, c) {
  const mine = c.author.id === app.me.id;
  const canRemove = mine || s.v.isMine || s.v.canModerate;
  return html`<li class="comment ${c.hidden ? 'is-hidden' : ''}">
    ${withFollow(c.author, html`<a href="/u/${c.author.id}">${avatar(c.author, 34, { font: 12 })}</a>`, 34)}
    <div class="grow min0 stack-2">
      <span class="small"><strong><bdi>${mine ? t('common.you') : c.author.name}</bdi></strong></span>
      <p class="comment-body" dir="auto">${linkify(c.body)}</p>
      ${c.hidden ? html`<span class="tiny warn">${t('video.commentHidden')}</span>` : ''}
      <span class="row gap-12 tiny">
        ${canRemove ? html`<button class="link-btn" data-action="removeComment" data-id="${c.id}">${t('common.remove')}</button>` : ''}
        ${mine ? '' : html`<a href="/report?comment=${c.id}&from=${s.v.id}" class="muted">${t('video.reportComment')}</a>`}
      </span>
    </div>
  </li>`;
}

export const video = {
  title: (s) => s.v.title,
  async load({ params }) {
    const { video: v } = await api(`/videos/${params[0]}`);
    return { v, playing: false };
  },
  view(s) {
    const v = s.v;
    const mine = v.isMine;
    return html`
<div class="screen">
  <div class="profile-top">
    <button class="icon-btn" data-action="back" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</button>
    ${mine ? '' : html`<a class="pill-btn" href="/report?video=${v.id}">${icon('flag', 16)}${t('profile.report')}</a>`}
  </div>

  <main class="lesson-main">
    ${v.hidden ? html`<p class="note warn small">${t('video.hidden')}</p>` : ''}
    ${player(v)}

    <section class="stack-10">
      <h1 class="display h-26"><bdi>${v.title}</bdi></h1>
      <div class="row gap-10">
        ${withFollow(v.author, html`<a href="/u/${v.author.id}">${avatar(v.author, 40, { font: 14 })}</a>`, 40)}
        <span class="grow stack-0"><a href="/u/${v.author.id}" class="strong"><bdi>${mine ? t('common.you') : v.author.name}</bdi></a>
          <span class="small muted">${v.topic ? `${t(`topics.${v.topic}`)} · ` : ''}${siteName(v)}${v.visibility === 'followers' ? ` · ${t('where.followers')}` : ''}</span></span>
      </div>
      ${v.caption ? html`<p class="body-3" dir="auto">${linkify(v.caption)}</p>` : ''}
    </section>

    ${v.lesson ? html`<a class="card wish-taught" href="/lesson/${v.lesson.id}">${icon('calendar', 20)}<span class="grow"><span class="tiny muted">${t('video.becameLesson')}</span><br><strong><bdi>${v.lesson.title}</bdi></strong></span>${icon('chevronRight', 16, 2.2)}</a>` : ''}

    <section class="card pad-18 stack-12" id="v-interest">${interestCard(s)}</section>

    <section class="stack-12" id="v-comments">${commentsSection(s)}</section>
  </main>
</div>`;
  },
  actions: {
    back,
    play(s) {
      startPlayer(s.v);
    },
    async interest(s, el) {
      busy(el, true);
      const on = !s.v.interested;
      await api(`/videos/${s.v.id}/interest`, { method: on ? 'POST' : 'DELETE' });
      await refresh(s, 'v-interest', interestCard);
      if (on) toast(t('video.interestToast', { name: s.v.author.firstName }));
    },
    async comment(s, form) {
      const body = String(new FormData(form).get('body') || '').trim();
      if (!body) return;
      const button = form.querySelector('[type=submit]');
      busy(button, true);
      try {
        await api(`/videos/${s.v.id}/comments`, { method: 'POST', body: { body } });
      } catch (err) {
        busy(button, false);
        return showError('comment-error', err.message);
      }
      await refresh(s, 'v-comments', commentsSection);
    },
    async removeComment(s, el) {
      if (!window.confirm(t('video.removeCommentConfirm'))) return;
      await api(`/comments/${el.dataset.id}`, { method: 'DELETE' });
      await refresh(s, 'v-comments', commentsSection);
    },
    async remove(s) {
      if (!window.confirm(t('video.removeConfirm'))) return;
      await api(`/videos/${s.v.id}`, { method: 'DELETE' });
      toast(t('video.removed'));
      navigate('/explore', { replace: true });
    }
  }
};

// Redraws one part of the page only, so a playing video keeps playing.
async function refresh(s, id, part) {
  s.v = (await api(`/videos/${s.v.id}`)).video;
  const el = document.getElementById(id);
  if (el) el.innerHTML = String(part(s));
  else render();
}

function interestCard(s) {
  const v = s.v;
  const mine = v.isMine;
  return html`
      ${mine
        ? html`<strong>${v.interestCount ? tp('wouldJoin', v.interestCount) : t('video.noInterestYet')}</strong>
          <span class="small muted">${t('video.ownerHint')}</span>
          <div class="row gap-8 wrap">
            ${v.lesson ? '' : html`<a class="btn btn-primary btn-md" href="/create/new?video=${v.id}">${icon('calendar', 18)}${t('video.turnInto')}</a>`}
            <button class="btn btn-ghost btn-sm" data-action="remove">${icon('trash', 16)}${t('video.remove')}</button>
          </div>`
        : html`<button class="btn ${v.interested ? 'btn-secondary' : 'btn-primary'} btn-lg" data-action="interest" aria-pressed="${v.interested ? 'true' : 'false'}">
            ${icon(v.interested ? 'check' : 'hand', 20, 2.2)}${v.interested ? t('video.interested') : t('video.wouldJoin')}</button>
          <span class="small muted center">${v.interestCount ? tp('wouldJoin', v.interestCount) : t('video.beFirst')}</span>
          ${v.canModerate ? html`<button class="btn btn-ghost btn-sm self-center" data-action="remove">${icon('trash', 16)}${t('video.remove')}</button>` : ''}`}
      ${v.interestedPeople.length ? html`<div class="faces">${v.interestedPeople.slice(0, 12).map((u) => withFollow(u, avatar(u, 30, { cls: 'face', font: 11, title: u.name }), 30))}</div>` : ''}`;
}

function commentsSection(s) {
  const v = s.v;
  return html`
      <h2 class="display h-20">${t('video.comments')} ${v.comments.length ? html`<span class="muted normal">(${v.comments.length})</span>` : ''}</h2>
      <form class="comment-form" data-submit="comment" novalidate>
        ${avatar(app.me, 34, { font: 12 })}
        <textarea class="input soft grow" name="body" rows="1" maxlength="500" dir="auto" placeholder="${t('video.commentPh')}" aria-label="${t('video.commentPh')}" required></textarea>
        <button class="icon-btn accent-bg" type="submit" aria-label="${t('video.post')}">${icon('send', 18, 2.2)}</button>
      </form>
      <p class="form-error" id="comment-error" role="alert" hidden></p>
      ${v.comments.length ? html`<ul class="plain stack-12">${v.comments.map((c) => commentItem(s, c))}</ul>` : html`<p class="empty-note">${t('video.noComments')}</p>`}`;
}

// ---------- sharing a video ----------

const isNew = () => Date.now() - new Date(String(app.me.memberSince).replace(' ', 'T') + 'Z').getTime() < 3 * 864e5;

export const newVideo = {
  title: () => t('video.shareTitle'),
  load: () => ({ url: '', preview: null, title: '', caption: '', topic: '', visibility: 'club', checking: false }),
  view(s) {
    const p = s.preview;
    const vis = (k, ic) => html`<button type="button" class="vis-btn ${s.visibility === k ? 'on' : ''}" role="radio" aria-checked="${s.visibility === k ? 'true' : 'false'}" data-action="visibility" data-v="${k}">
      <span class="row gap-6 strong">${icon(ic, 18)}${t(`where.${k}`)}</span><span class="small muted">${t(`video.${k}Sub`)}</span></button>`;
    return html`
<div class="screen">
  <header class="edit-head">
    <button class="text-link" data-action="cancel">${t('common.cancel')}</button>
    <h1 class="display h-20">${t('video.shareTitle')}</h1>
    <span></span>
  </header>

  <main class="stack-16 px-16">
    <p class="lede">${t('video.shareLede')}</p>
    ${isNew() ? html`<p class="note warn small">${t('video.newAccount')}</p>` : ''}

    <form class="card pad-18 stack-12" data-submit="check" novalidate>
      <label class="field strong" for="v-url">${t('video.linkLabel')}</label>
      <div class="row gap-8">
        <input id="v-url" class="input soft grow" type="url" dir="ltr" name="url" value="${s.url}" placeholder="https://youtube.com/watch?v=…" required>
        <button class="btn btn-soft btn-md" type="submit">${t('video.check')}</button>
      </div>
      <span class="hint">${t('video.supported')}</span>
      <p class="form-error" id="url-error" role="alert" hidden></p>
    </form>

    ${p ? html`
    <section class="card pad-18 stack-14">
      <div class="v-preview">${player(p)}</div>
      <label class="field strong">${t('video.titleLabel')}
        <input class="input soft" data-input="title" dir="auto" maxlength="80" value="${s.title}" placeholder="${t('video.titlePh')}">
      </label>
      <label class="field strong">${t('video.captionLabel')} <span class="opt">${t('common.optional')}</span>
        <textarea class="input soft" data-input="caption" dir="auto" rows="3" maxlength="500" placeholder="${t('video.captionPh')}">${s.caption}</textarea>
      </label>
      <div class="field">
        <span class="field-head strong">${t('explore.topic')}</span>
        <div class="wrap gap-6">${TOPIC_KEYS.map((k) => html`<button type="button" class="topic-chip ${s.topic === k ? 'on' : ''}" data-action="topic" data-k="${k}" aria-pressed="${s.topic === k ? 'true' : 'false'}">${t(`topics.${k}`)}</button>`)}</div>
      </div>
      ${app.club
        ? html`<div class="stack-8"><span class="strong" id="v-who">${t('where.who')}</span>
            <div class="grid-2 gap-8" role="radiogroup" aria-labelledby="v-who">${vis('club', 'users')}${vis('followers', 'heart')}</div></div>`
        : html`<p class="note small">${icon('users', 18)}${t('video.noClub')}</p>`}
      <p class="form-error" id="post-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-lg" data-action="post" ${isNew() ? raw('disabled') : ''}>${icon('send', 18, 2.2)}${t('video.postVideo')}</button>
    </section>` : ''}
  </main>
</div>`;
  },
  inputs: {
    title(s, el) {
      s.title = el.value;
    },
    caption(s, el) {
      s.caption = el.value;
    }
  },
  actions: {
    cancel: back,
    async check(s, form) {
      const url = String(new FormData(form).get('url') || '').trim();
      if (!url) return showError('url-error', t('video.needLink'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('video.checking'));
      try {
        const { video: p } = await api('/videos/preview', { method: 'POST', body: { url } });
        s.url = url;
        s.preview = p;
        if (!s.title) s.title = p.title;
      } catch (err) {
        busy(button, false);
        return showError('url-error', err.message);
      }
      render();
    },
    play(s) {
      startPlayer(s.preview);
    },
    topic(s, el) {
      s.topic = s.topic === el.dataset.k ? '' : el.dataset.k;
      render();
    },
    visibility(s, el) {
      s.visibility = el.dataset.v;
      render();
    },
    async post(s, el) {
      if (!s.title.trim()) return showError('post-error', t('video.needTitle'));
      busy(el, true, t('video.posting'));
      try {
        const { id } = await api('/videos', { method: 'POST', body: { url: s.url, title: s.title, caption: s.caption, topic: s.topic, visibility: s.visibility } });
        toast(t('video.posted'));
        navigate(`/video/${id}`, { replace: true });
      } catch (err) {
        busy(el, false);
        showError('post-error', err.message);
      }
    }
  }
};
