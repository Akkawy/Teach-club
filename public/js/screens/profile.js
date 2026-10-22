// Profiles (yours at /profile, a friend's at /u/:id) and editing your own.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { fmt, reactionLabel } from '../formats.js';
import { t, tp, th, lang, setLang } from '../i18n.js';
import { avatar, icon, bottomNav, toast, busy, initialsOf } from '../ui.js';
import { monShort, parse, isOver, memberSince, minutes, localize } from '../dates.js';
import { resizePhoto } from '../photo.js';
import { videoGrid } from '../videos.js';
import { isInstalled, isIOS, canPrompt, promptInstall, onInstallChange } from '../install.js';

onInstallChange(() => {
  if (document.getElementById('install-card')) render();
});

const NOTIFY_GROUPS = ['people', 'my_lessons', 'joined_lessons', 'videos', 'wishes'];
const TOPIC_KEYS = ['cooking', 'tech', 'languages', 'art', 'music', 'science', 'sports', 'health', 'money', 'books', 'games', 'crafts', 'travel', 'career', 'history', 'nature'];

function installCard() {
  if (isInstalled()) return '';
  const b = (text) => html`<strong>${text}</strong>`;
  let how;
  if (canPrompt()) how = html`<button class="btn btn-primary btn-sm self-start" data-action="install">${t('install.button')}</button>`;
  else if (isIOS()) how = html`<span class="small muted">${th('install.ios', { icon: icon('share', 16), share: b(t('install.share')), add: b(t('install.add')) })}</span>`;
  else how = html`<span class="small muted">${th('install.other', { install: b(t('install.installOpt')), add: b(t('install.addOpt')) })}</span>`;
  return html`<section class="card install-card mx-16 mt-20" id="install-card">
    <img src="/icons/icon-192.png" alt="" width="52" height="52">
    <div class="grow stack-6">
      <strong>${t('install.title')}</strong>
      ${how}
    </div>
  </section>`;
}

function lessonRow(l, meta) {
  const f = fmt(l.format);
  const d = parse(l.date);
  return html`<a class="card lesson-row" href="/lesson/${l.id}">
    <span class="date-chip" style="background:${f.bg};color:${f.fg}">
      <span class="mon">${monShort(d.getMonth())}</span><span class="display day">${d.getDate()}</span>
    </span>
    <span class="grow stack-4 min0"><strong class="lr-title"><bdi>${l.title}</bdi></strong><span class="small muted">${f.label} · ${meta}</span></span>
    <span class="muted">${icon('chevronRight', 18, 2.2)}</span>
  </a>`;
}

function taughtMeta(l) {
  const len = minutes(l.length);
  if (!isOver(l)) return t('profile.metaComing', { len });
  if (l.notesCount) return t('profile.metaThanks', { len, thanks: tp('thanks', l.notesCount) });
  return t('profile.metaWent', { len, n: l.goingCount });
}

function attendedMeta(l) {
  const name = l.host.id === app.me.id ? t('profile.withYou') : l.host.firstName;
  return t('profile.metaWith', { name }) + (isOver(l) ? '' : t('profile.comingTail'));
}

function badgesCard(s) {
  const earned = s.badges.filter((b) => b.earned);
  const list = s.isMe ? s.badges : earned;
  if (!list.length) return '';
  return html`<section class="mx-16 mt-20 stack-10">
    <h2 class="display h-19 pad-x-4 row-between">${t('badges.title')}<span class="small muted normal">${t('badges.count', { n: earned.length, total: s.badges.length })}</span></h2>
    <ul class="plain badge-grid">${list.map((b) => {
      const [name, how] = t(`badges.${b.key}`);
      return html`<li class="badge ${b.earned ? 'on' : ''}" title="${how}">
        <span class="badge-icon">${icon(BADGE_ICONS[b.key] || 'star', 22)}</span>
        <strong>${name}</strong><span class="tiny muted">${how}</span>
      </li>`;
    })}</ul>
  </section>`;
}

const BADGE_ICONS = {
  first_lesson: 'star', five_lessons: 'trophy', all_formats: 'sparkle', regular: 'users', thanks_magnet: 'heart',
  night_owl: 'clock', early_bird: 'clock', curious: 'bubbles', wish_granter: 'gift', sequel: 'link'
};

function stat(n, label) {
  return html`<div class="card stat"><strong class="display">${n}</strong><span class="small muted">${label}</span></div>`;
}

function noteFigure(n) {
  return html`<figure class="friend-note">
    <blockquote dir="auto">${n.body ? `“${n.body}”` : n.reactions.map(reactionLabel).join(' · ')}</blockquote>
    <figcaption>${avatar(n.author, 26, { font: 10 })}${t('profile.noteOn', { name: n.author.firstName })} <a href="/lesson/${n.lesson.id}"><bdi>${n.lesson.title}</bdi></a></figcaption>
  </figure>`;
}

export const profile = {
  title: (s) => (s.isMe ? t('profile.yourProfile') : s.user.name),
  async load({ params }) {
    const id = params[0] ? Number(params[0]) : app.me.id;
    const data = await api(`/users/${id}`);
    data.hosted.forEach(localize);
    data.archivedLessons.forEach(localize);
    data.attended.forEach(localize);
    if (data.isMe) app.me = { ...app.me, ...data.user };
    return { ...data, tab: 'taught', videos: null };
  },
  view(s) {
    const u = s.user;
    const taught = s.hosted.filter(isOver).length;
    const attended = s.attended.filter(isOver).length;
    const list = s.tab === 'taught' ? s.hosted : s.tab === 'attended' ? s.attended : [];
    const tab = (key, label) => html`<button role="tab" class="${s.tab === key ? 'on' : ''}" aria-selected="${s.tab === key ? 'true' : 'false'}" data-action="tab" data-tab="${key}">${label}</button>`;
    const empty = s.tab === 'taught'
      ? html`<div class="empty-day"><span class="muted">${s.isMe ? t('profile.emptyTaughtMe') : t('profile.emptyTaughtOther', { name: u.firstName })}</span>${s.isMe ? html`<a class="btn btn-soft btn-sm mt-4" href="/create/new">${t('nav.teach')}</a>` : ''}</div>`
      : html`<div class="empty-day"><span class="muted">${s.isMe ? t('profile.emptyAttendMe') : t('profile.emptyAttendOther')}</span></div>`;
    return html`
<div class="screen with-nav">
  <div class="profile-top ${s.isMe ? 'end' : ''}">
    ${s.isMe
      ? html`<a class="pill-btn" href="/profile/edit">${icon('pencil', 18)}${t('profile.edit')}</a>`
      : html`<button class="icon-btn" data-action="back" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</button>
        <a class="pill-btn" href="/report?user=${u.id}">${icon('flag', 16)}${t('profile.report')}</a>`}
  </div>

  <section class="profile-head">
    ${avatar(u, 120, { display: true, font: 44, cls: 'ring' })}
    <h1 class="display h-30"><bdi>${u.name}</bdi></h1>
    ${u.bio
      ? html`<p class="bio" dir="auto">${u.bio}</p>`
      : s.isMe ? html`<p class="bio muted">${t('profile.addBio')} <a href="/profile/edit">${t('profile.edit')}</a></p>` : ''}
    <span class="tiny muted">${t('profile.memberSince', { date: memberSince(u.memberSince) })}</span>
    ${s.isMe
      ? html`<a class="follow-counts" href="/follows">${tp('followers', s.followers)} · ${t('social.followingCount', { n: s.following })}${app.followRequests ? html` <span class="count-pill">${t('social.newRequests', { n: app.followRequests })}</span>` : ''}</a>`
      : html`<span class="follow-counts">${tp('followers', s.followers)} · ${t('social.followingCount', { n: s.following })}</span>`}
    ${s.interests.length ? html`<div class="wrap gap-6 center-wrap">${s.interests.map((k) => html`<span class="topic-chip on static">${t(`topics.${k}`)}</span>`)}</div>` : ''}
    ${s.banned ? html`<p class="note warn small">${t('social.suspended')}</p>` : ''}
    <div class="row gap-8 wrap center-wrap">
      ${s.isMe
        ? html`<a class="btn btn-secondary btn-sm" href="/follows">${icon('users', 18)}${t('social.manage')}</a>
          <button class="btn btn-secondary btn-sm" data-action="shareProfile">${icon('share', 18)}${t('social.share')}</button>`
        : s.blockedByMe
          ? html`<button class="btn btn-secondary btn-sm" data-action="unblock">${t('social.unblock')}</button>`
          : html`<button class="btn ${s.follow ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="${s.follow ? 'unfollow' : 'follow'}">${s.follow === 'accepted' ? html`${icon('check', 18, 2.4)}${t('social.following')}` : s.follow === 'pending' ? t('social.requested') : html`${icon('plus', 18, 2.4)}${t('social.follow')}`}</button>
            <button class="btn btn-ghost btn-sm" data-action="block">${t('social.block')}</button>`}
      ${!s.isMe && app.owner ? html`<button class="btn btn-danger btn-sm" data-action="ban">${s.banned ? t('social.unban') : t('social.ban')}</button>` : ''}
    </div>
  </section>

  <section class="stats" aria-label="${t('profile.stats')}">
    ${stat(taught, t('profile.taught'))}
    ${stat(attended, t('profile.attended'))}
    ${stat(s.thanksCount, t('profile.thanks'))}
  </section>

  ${badgesCard(s)}

  ${s.isMe ? installCard() : ''}

  ${s.isMe ? html`<a class="card wrapped-link mx-16 mt-20" href="/wrapped">
    <span class="soft-square">${icon('trophy', 22)}</span><strong class="grow">${t('profile.wrapped', { year: new Date().getFullYear() })}</strong>${icon('chevronRight', 18, 2.2)}
  </a>` : ''}

  <section class="mx-16 mt-20">
    <div class="tabs three" role="tablist" aria-label="${t('profile.lessons')}">${tab('taught', t('profile.tabTaught'))}${tab('attended', t('profile.tabAttended'))}${tab('videos', t('explore.videos'))}</div>
    <div role="tabpanel" class="stack-10 mt-12">
      ${s.tab === 'videos'
        ? s.videos === null
          ? html`<div class="loading small-loading" role="status"><span class="spinner"></span></div>`
          : s.videos.length
            ? videoGrid(s.videos, { showAuthor: false })
            : html`<div class="empty-day"><span class="muted">${s.isMe ? t('video.emptyMine') : t('video.emptyOther', { name: u.firstName })}</span>${s.isMe ? html`<a class="btn btn-soft btn-sm mt-4" href="/videos/new">${t('explore.share')}</a>` : ''}</div>`
        : list.length ? list.map((l) => lessonRow(l, s.tab === 'taught' ? taughtMeta(l) : attendedMeta(l))) : empty}
    </div>
  </section>

  <section class="mx-16 mt-22 stack-10">
    <h2 class="display h-19 pad-x-4">${t('profile.notes')}</h2>
    ${s.notes.length
      ? s.notes.map(noteFigure)
      : html`<p class="empty-note">${s.isMe ? t('profile.noNotesMe') : t('profile.noNotesOther', { name: u.firstName })}</p>`}
  </section>

  ${s.isMe && s.archivedLessons.length ? html`<details class="mx-16 mt-22 archived-list">
    <summary class="display h-19 pad-x-4">${icon('archive', 18)}${t('social.archived')} (${s.archivedLessons.length})</summary>
    <div class="stack-10 mt-12">${s.archivedLessons.map((l) => lessonRow(l, taughtMeta(l)))}</div>
  </details>` : ''}

  ${bottomNav(s.isMe ? 'profile' : null)}
</div>`;
  },
  actions: {
    async tab(s, el) {
      s.tab = el.dataset.tab;
      render();
      if (s.tab === 'videos' && s.videos === null) {
        s.videos = (await api(`/videos?user=${s.user.id}`)).videos;
        render();
      }
    },
    async follow(s) {
      const { follow } = await api(`/users/${s.user.id}/follow`, { method: 'POST' });
      s.follow = follow;
      (follow === 'pending' ? app.requested : app.following).add(s.user.id);
      if (follow === 'accepted') s.followers += 1;
      render();
    },
    async unfollow(s) {
      const was = s.follow;
      await api(`/users/${s.user.id}/follow`, { method: 'DELETE' });
      s.follow = null;
      app.following.delete(s.user.id);
      app.requested.delete(s.user.id);
      if (was === 'accepted') s.followers = Math.max(0, s.followers - 1);
      render();
    },
    async block(s) {
      if (!window.confirm(t('social.blockConfirm', { name: s.user.firstName }))) return;
      await api(`/users/${s.user.id}/block`, { method: 'POST' });
      app.blocked.add(s.user.id);
      app.following.delete(s.user.id);
      app.requested.delete(s.user.id);
      toast(t('social.blocked'));
      navigate(`/u/${s.user.id}`, { replace: true });
    },
    async unblock(s) {
      await api(`/users/${s.user.id}/block`, { method: 'DELETE' });
      app.blocked.delete(s.user.id);
      toast(t('social.unblocked'));
      navigate(`/u/${s.user.id}`, { replace: true });
    },
    async ban(s) {
      if (!s.banned && !window.confirm(t('social.banConfirm', { name: s.user.firstName }))) return;
      await api(`/owner/users/${s.user.id}/ban`, { method: s.banned ? 'DELETE' : 'POST' });
      navigate(`/u/${s.user.id}`, { replace: true });
    },
    async shareProfile(s) {
      const url = `${location.origin}/u/${s.user.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: s.user.name, url });
        } catch {
          // closed the share sheet
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast(t('social.copied'));
      } catch {
        toast(url);
      }
    },
    async install() {
      if (await promptInstall()) toast(t('install.done'));
    },
    back() {
      if (history.length > 1) history.back();
      else navigate('/');
    }
  }
};

// ---------- edit ----------

const currentPhoto = (s) => (s.newPhoto === undefined ? app.me.photo : s.newPhoto);

function photoCard(s) {
  const src = currentPhoto(s);
  const name = s.name.trim() || app.me.name;
  const u = { ...app.me, name, initials: initialsOf(name), photo: src };
  return html`
    <div class="photo-wrap big">
      ${avatar(u, 128, { display: true, font: 46, alt: src ? t('edit.photoAlt') : t('signup.initialsAlt') })}
      <span class="cam-btn badge" aria-hidden="true">${icon('camera', 18, 2.2)}</span>
    </div>
    <div class="row gap-8">
      <button class="btn btn-soft btn-sm" data-action="pickPhoto">${src ? t('edit.change') : t('edit.add')}</button>
      ${src ? html`<button class="btn btn-secondary btn-sm" data-action="removePhoto">${t('common.remove')}</button>` : ''}
    </div>
    <span class="tiny muted center">${src ? t('edit.photoHint') : t('edit.noPhotoHint')}</span>`;
}

function refreshPhoto(s) {
  document.getElementById('photo-card').innerHTML = String(photoCard(s));
}

export const editProfile = {
  title: () => t('edit.title'),
  load: () => ({
    name: app.me.name, bio: app.me.bio, email: app.me.email, newPhoto: undefined, reminders: app.me.emailReminders !== false,
    interests: (app.me.interests || []).slice(), approve: !!app.me.approveFollowers, notifyOff: (app.me.notifyOff || []).slice()
  }),
  after() {
    // Opened from the bell's "Notification settings": jump to that card (after the router scrolls to the top).
    if (location.hash === '#notify') setTimeout(() => document.getElementById('notify')?.scrollIntoView({ block: 'start' }), 0);
  },
  view: (s) => html`
<div class="screen">
  <header class="edit-head">
    <a href="/profile" class="text-link">${t('common.cancel')}</a>
    <h1 class="display h-20">${t('edit.title')}</h1>
    <button class="text-link strong accent" data-action="save">${t('common.save')}</button>
  </header>

  <main class="stack-16 px-16">
    <section class="card photo-edit" id="photo-card">${photoCard(s)}</section>
    <input type="file" id="photo-file" accept="image/*" data-change="photo" hidden>

    <section class="card pad-18 stack-16">
      <label class="field strong">${t('edit.name')}
        <input class="input soft" data-input="name" dir="auto" value="${s.name}" autocomplete="name" maxlength="60">
      </label>
      <div class="field">
        <label for="bio" class="field-head strong">${t('field.bio')} <span class="count" id="bio-count">${s.bio.length}/160</span></label>
        <textarea id="bio" class="input soft" rows="4" maxlength="160" dir="auto" data-input="bio">${s.bio}</textarea>
      </div>
      <label class="field strong">${t('field.email')}
        <input class="input soft" type="email" dir="ltr" data-input="email" value="${s.email}" autocomplete="email" placeholder="${t('field.emailPh')}">
      </label>
    </section>

    <section class="card pad-18 stack-12">
      <h2 class="h-16" id="lang-label">${t('edit.language')}</h2>
      <div class="tabs" role="radiogroup" aria-labelledby="lang-label">
        <button role="radio" class="${lang === 'en' ? 'on' : ''}" aria-checked="${lang === 'en' ? 'true' : 'false'}" data-action="pickLang" data-lang="en" lang="en">English</button>
        <button role="radio" class="${lang === 'ar' ? 'on' : ''}" aria-checked="${lang === 'ar' ? 'true' : 'false'}" data-action="pickLang" data-lang="ar" lang="ar">العربية</button>
      </div>
      <a class="small strong" href="/intro">${t('edit.about')}</a>
    </section>

    <section class="card pad-18 stack-12">
      <h2 class="h-16">${t('social.interestsTitle')}</h2>
      <div class="wrap gap-6">${TOPIC_KEYS.map((k) => html`<button type="button" class="topic-chip ${s.interests.includes(k) ? 'on' : ''}" data-action="interest" data-k="${k}" aria-pressed="${s.interests.includes(k) ? 'true' : 'false'}">${t(`topics.${k}`)}</button>`)}</div>
      <span class="hint">${t('social.interestsHint')}</span>
    </section>

    <section class="card pad-18 stack-12">
      <label class="toggle-row">
        <span class="grow stack-2"><strong>${t('social.approve')}</strong><span class="small muted">${t('social.approveHint')}</span></span>
        <input type="checkbox" class="switch" data-input="approve" ${s.approve ? raw('checked') : ''}>
      </label>
      <label class="toggle-row">
        <span class="grow stack-2"><strong>${t('edit.reminders')}</strong><span class="small muted">${t('edit.remindersHint')}</span></span>
        <input type="checkbox" class="switch" data-input="reminders" ${s.reminders ? raw('checked') : ''}>
      </label>
    </section>

    <section class="card pad-18 stack-12" id="notify">
      <h2 class="h-16 row gap-8">${icon('bell', 18)}${t('notif.settingsTitle')}</h2>
      <span class="hint">${t('notif.settingsHint')}</span>
      ${NOTIFY_GROUPS.map((g) => html`<label class="toggle-row">
        <span class="grow stack-2"><strong>${t(`notif.groups.${g}`)}</strong><span class="small muted">${t(`notif.groupHints.${g}`)}</span></span>
        <input type="checkbox" class="switch" data-input="notify" data-g="${g}" ${s.notifyOff.includes(g) ? '' : raw('checked')}>
      </label>`)}
      <span class="tiny muted">${t('notif.emailNote')}</span>
    </section>

    <section class="stack-8 pad-x-4">
      <a class="small strong row gap-6" href="/privacy">${icon('shield', 16)}${t('edit.privacy')}</a>
      <a class="small strong row gap-6 danger-link" href="/account/delete">${icon('trash', 16)}${t('edit.remove')}</a>
    </section>
  </main>

  <footer class="flow-foot col">
    <button class="btn btn-primary btn-lg" data-action="save">${t('create.saveChanges')}</button>
    <button class="btn btn-ghost" data-action="logout">${t('edit.logout')}</button>
  </footer>
</div>`,
  inputs: {
    name(s, el) {
      s.name = el.value;
      if (!currentPhoto(s)) refreshPhoto(s);
    },
    bio(s, el) {
      s.bio = el.value;
      document.getElementById('bio-count').textContent = `${el.value.length}/160`;
    },
    email(s, el) {
      s.email = el.value;
    },
    reminders(s, el) {
      s.reminders = el.checked;
    },
    approve(s, el) {
      s.approve = el.checked;
    },
    notify(s, el) {
      const g = el.dataset.g;
      s.notifyOff = el.checked ? s.notifyOff.filter((x) => x !== g) : s.notifyOff.concat(g);
    }
  },
  changes: {
    async photo(s, el) {
      const file = el.files && el.files[0];
      el.value = '';
      if (!file) return;
      s.newPhoto = await resizePhoto(file);
      refreshPhoto(s);
    }
  },
  actions: {
    pickLang(s, el) {
      setLang(el.dataset.lang);
      render();
    },
    interest(s, el) {
      const k = el.dataset.k;
      s.interests = s.interests.includes(k) ? s.interests.filter((x) => x !== k) : s.interests.concat(k);
      el.classList.toggle('on');
      el.setAttribute('aria-pressed', s.interests.includes(k) ? 'true' : 'false');
    },
    pickPhoto() {
      document.getElementById('photo-file').click();
    },
    removePhoto(s) {
      s.newPhoto = null;
      refreshPhoto(s);
    },
    async save(s, button) {
      if (!s.name.trim()) return toast(t('edit.nameEmpty'));
      busy(button, true, t('common.saving'));
      const { user } = await api('/me', { method: 'PUT', body: { name: s.name, bio: s.bio, email: s.email, photo: s.newPhoto, emailReminders: s.reminders, interests: s.interests, approveFollowers: s.approve, notifyOff: s.notifyOff } });
      app.me = user;
      toast(t('edit.saved'));
      navigate('/profile', { replace: true });
    },
    async logout() {
      await api('/logout', { method: 'POST' });
      app.me = null;
      app.club = null;
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
      navigate('/login', { replace: true });
    }
  }
};
