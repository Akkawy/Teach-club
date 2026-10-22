// Video cards and the player. Videos stay on the site they were posted to; the player only loads
// (from that site) once you tap play. YouTube uses its privacy-friendly "no cookie" player.

import { html } from './html.js';
import { t, tp } from './i18n.js';
import { app } from './core.js';
import { avatar, icon } from './ui.js';
import { withFollow } from './follow.js';

export const SITE_NAMES = { youtube: 'YouTube', vimeo: 'Vimeo', tiktok: 'TikTok', instagram: 'Instagram', drive: 'Google Drive' };
export const siteName = (v) => SITE_NAMES[v.provider] || t('video.link');

// The address of the site's own embeddable player, or '' when it can't be played inside the app.
export function embedUrl(v) {
  const id = encodeURIComponent(v.embedId || '');
  if (v.provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  if (v.provider === 'vimeo') {
    const [vid, hash] = String(v.embedId).split(':');
    return `https://player.vimeo.com/video/${encodeURIComponent(vid)}?autoplay=1${hash ? `&h=${encodeURIComponent(hash)}` : ''}`;
  }
  if (v.provider === 'tiktok') return `https://www.tiktok.com/embed/v2/${id}`;
  if (v.provider === 'instagram') return `https://www.instagram.com/p/${id}/embed`;
  if (v.provider === 'drive') return `https://drive.google.com/file/d/${id}/preview`;
  return '';
}

function thumb(v, big) {
  return html`<span class="v-thumb ${v.vertical ? 'tall' : ''} ${big ? 'big' : ''}">
    ${v.thumb ? html`<img src="${v.thumb}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
    <span class="v-fallback" aria-hidden="true">${icon('video', 34, 1.6)}</span>
    <span class="v-play" aria-hidden="true">${icon(embedUrl(v) ? 'playVideo' : 'external', 22, 2.2)}</span>
    <span class="v-site">${siteName(v)}</span>
  </span>`;
}

// The player on a video's page: a picture with a play button, swapped for the real player on tap.
export function player(v) {
  const src = embedUrl(v);
  if (!src) {
    return html`<a class="v-player" href="${v.url}" target="_blank" rel="noopener noreferrer">${thumb(v, true)}</a>
      <p class="small muted">${t('video.opensOn', { site: siteName(v) })}</p>`;
  }
  return html`<div class="v-player" id="v-player">
      <button class="v-start" data-action="play" aria-label="${t('video.play', { title: v.title })}">${thumb(v, true)}</button>
    </div>
    <p class="small muted row gap-6 wrap">${t('video.loadsFrom', { site: siteName(v) })}
      <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="row gap-4">${t('video.openOn', { site: siteName(v) })}${icon('external', 14)}</a></p>`;
}

export function startPlayer(v) {
  const box = document.getElementById('v-player');
  if (!box) return;
  const frame = document.createElement('iframe');
  frame.src = embedUrl(v);
  frame.title = v.title;
  frame.className = v.vertical ? 'tall' : '';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  box.replaceChildren(frame);
}

export function videoCard(v, { showAuthor = true } = {}) {
  const mine = app.me && v.author.id === app.me.id;
  return html`<li class="card v-card">
    <a class="v-link" href="/video/${v.id}" aria-label="${v.title}">${thumb(v)}</a>
    <div class="v-info">
      ${showAuthor ? withFollow(v.author, html`<a href="/u/${v.author.id}" class="v-face">${avatar(v.author, 36, { font: 13 })}</a>`, 36) : ''}
      <div class="grow min0 stack-2">
        <a class="v-title" href="/video/${v.id}"><bdi>${v.title}</bdi></a>
        <span class="small muted">${showAuthor ? html`<bdi>${mine ? t('common.you') : v.author.name}</bdi> · ` : ''}${v.topic ? t(`topics.${v.topic}`) : siteName(v)}</span>
        <span class="v-stats small">
          ${v.lesson ? html`<span class="v-lesson">${icon('calendar', 13, 2.2)}${t('video.nowLesson')}</span>` : ''}
          ${v.interestCount ? html`<span class="${v.interested ? 'accent' : ''}">${icon('hand', 14)}${tp('wouldJoin', v.interestCount)}</span>` : ''}
          ${v.commentCount ? html`<span>${icon('bubbles', 14)}${v.commentCount}<span class="sr-only"> ${tp('comments', v.commentCount)}</span></span>` : ''}
        </span>
      </div>
    </div>
  </li>`;
}

export const videoGrid = (list, opts) => html`<ul class="plain v-grid">${list.map((v) => videoCard(v, opts))}</ul>`;
