// Profiles (yours at /profile, a friend's at /u/:id) and editing your own.

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { FORMATS } from '../formats.js';
import { avatar, icon, bottomNav, toast, busy, initialsOf } from '../ui.js';
import { MON, parse, isOver, memberSince } from '../dates.js';
import { resizePhoto } from '../photo.js';
import { isInstalled, isIOS, canPrompt, promptInstall, onInstallChange } from '../install.js';

onInstallChange(() => {
  if (document.getElementById('install-card')) render();
});

function installCard() {
  if (isInstalled()) return '';
  let how;
  if (canPrompt()) how = html`<button class="btn btn-primary btn-sm self-start" data-action="install">Install the app</button>`;
  else if (isIOS()) how = html`<span class="small muted">In Safari, tap ${icon('share', 16)} <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</span>`;
  else how = html`<span class="small muted">In your browser's menu, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>`;
  return html`<section class="card install-card mx-16 mt-20" id="install-card">
    <img src="/icons/icon-192.png" alt="" width="52" height="52">
    <div class="grow stack-6">
      <strong>Get Teach Club on your phone</strong>
      ${how}
    </div>
  </section>`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function lessonRow(l, meta) {
  const f = FORMATS[l.format];
  const d = parse(l.date);
  return html`<a class="card lesson-row" href="/lesson/${l.id}">
    <span class="date-chip" style="background:${f.bg};color:${f.fg}">
      <span class="mon">${MON[d.getMonth()]}</span><span class="display day">${d.getDate()}</span>
    </span>
    <span class="grow stack-4 min0"><strong class="lr-title">${l.title}</strong><span class="small muted">${f.label} · ${meta}</span></span>
    <span class="muted">${icon('chevronRight', 18, 2.2)}</span>
  </a>`;
}

function taughtMeta(l) {
  if (!isOver(l)) return `Coming up · ${l.length} min`;
  if (l.notesCount) return `${l.length} min · ${plural(l.notesCount, 'thank-you')}`;
  return `${l.length} min · ${l.goingCount} went`;
}

function attendedMeta(l) {
  return `with ${l.host.id === app.me.id ? 'you' : l.host.firstName}${isOver(l) ? '' : ' · coming up'}`;
}

function stat(n, label) {
  return html`<div class="card stat"><strong class="display">${n}</strong><span class="small muted">${label}</span></div>`;
}

function noteFigure(n) {
  const text = n.body || n.reactions.join(' · ');
  return html`<figure class="friend-note">
    <blockquote>${n.body ? `“${text}”` : text}</blockquote>
    <figcaption>${avatar(n.author, 26, { font: 10 })}${n.author.firstName}, on <a href="/lesson/${n.lesson.id}">${n.lesson.title}</a></figcaption>
  </figure>`;
}

export const profile = {
  title: (s) => (s.isMe ? 'Your profile' : s.user.name),
  async load({ params }) {
    const id = params[0] ? Number(params[0]) : app.me.id;
    const data = await api(`/users/${id}`);
    if (data.isMe) app.me = data.user;
    return { ...data, tab: 'taught' };
  },
  view(s) {
    const u = s.user;
    const taught = s.hosted.filter(isOver).length;
    const attended = s.attended.filter(isOver).length;
    const list = s.tab === 'taught' ? s.hosted : s.attended;
    const tab = (key, label) => html`<button role="tab" class="${s.tab === key ? 'on' : ''}" aria-selected="${s.tab === key ? 'true' : 'false'}" data-action="tab" data-tab="${key}">${label}</button>`;
    const empty = s.tab === 'taught'
      ? html`<div class="empty-day"><span class="muted">${s.isMe ? "You haven't taught anything yet." : `${u.firstName} hasn't taught anything yet.`}</span>${s.isMe ? html`<a class="btn btn-soft btn-sm mt-4" href="/create/new">Teach something</a>` : ''}</div>`
      : html`<div class="empty-day"><span class="muted">${s.isMe ? 'Lessons you RSVP to show up here.' : 'Nothing here yet.'}</span></div>`;
    return html`
<div class="screen with-nav">
  <div class="profile-top ${s.isMe ? 'end' : ''}">
    ${s.isMe
      ? html`<a class="pill-btn" href="/profile/edit">${icon('pencil', 18)}Edit profile</a>`
      : html`<button class="icon-btn" data-action="back" aria-label="Back">${icon('chevronLeft', 20, 2.2)}</button>`}
  </div>

  <section class="profile-head">
    ${avatar(u, 120, { display: true, font: 44, cls: 'ring' })}
    <h1 class="display h-30">${u.name}</h1>
    ${u.bio
      ? html`<p class="bio">${u.bio}</p>`
      : s.isMe ? html`<p class="bio muted">Add a line about what you're good at. <a href="/profile/edit">Edit profile</a></p>` : ''}
    <span class="tiny muted">Member since ${memberSince(u.memberSince)}</span>
  </section>

  <section class="stats" aria-label="Stats">
    ${stat(taught, 'Taught')}
    ${stat(attended, 'Attended')}
    ${stat(s.thanksCount, 'Thank-yous')}
  </section>

  ${s.isMe ? installCard() : ''}

  <section class="mx-16 mt-20">
    <div class="tabs" role="tablist" aria-label="Lessons">${tab('taught', 'Lessons taught')}${tab('attended', 'Attended')}</div>
    <div role="tabpanel" class="stack-10 mt-12">
      ${list.length ? list.map((l) => lessonRow(l, s.tab === 'taught' ? taughtMeta(l) : attendedMeta(l))) : empty}
    </div>
  </section>

  <section class="mx-16 mt-22 stack-10">
    <h2 class="display h-19 pad-x-4">Notes from friends</h2>
    ${s.notes.length
      ? s.notes.map(noteFigure)
      : html`<p class="empty-note">${s.isMe ? 'Thank-you notes from friends show up here after you teach.' : `No notes for ${u.firstName} yet.`}</p>`}
  </section>

  ${bottomNav(s.isMe ? 'profile' : null)}
</div>`;
  },
  actions: {
    tab(s, el) {
      s.tab = el.dataset.tab;
      render();
    },
    async install() {
      if (await promptInstall()) toast('Installed! Look for Teach Club on your home screen.');
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
      ${avatar(u, 128, { display: true, font: 46, alt: src ? 'Your profile photo' : 'Default avatar with your initials' })}
      <span class="cam-btn badge" aria-hidden="true">${icon('camera', 18, 2.2)}</span>
    </div>
    <div class="row gap-8">
      <button class="btn btn-soft btn-sm" data-action="pickPhoto">${src ? 'Change photo' : 'Add a photo'}</button>
      ${src ? html`<button class="btn btn-secondary btn-sm" data-action="removePhoto">Remove</button>` : ''}
    </div>
    <span class="tiny muted center">${src ? 'Square photos work best. We crop to a circle.' : 'No photo? No problem. Your initials look great.'}</span>`;
}

function refreshPhoto(s) {
  document.getElementById('photo-card').innerHTML = String(photoCard(s));
}

export const editProfile = {
  title: 'Edit profile',
  load: () => ({ name: app.me.name, bio: app.me.bio, email: app.me.email, newPhoto: undefined }),
  view: (s) => html`
<div class="screen">
  <header class="edit-head">
    <a href="/profile" class="text-link">Cancel</a>
    <h1 class="display h-20">Edit profile</h1>
    <button class="text-link strong accent" data-action="save">Save</button>
  </header>

  <main class="stack-16 px-16">
    <section class="card photo-edit" id="photo-card">${photoCard(s)}</section>
    <input type="file" id="photo-file" accept="image/*" data-change="photo" hidden>

    <section class="card pad-18 stack-16">
      <label class="field strong">Name
        <input class="input soft" data-input="name" value="${s.name}" autocomplete="name" maxlength="60">
      </label>
      <div class="field">
        <label for="bio" class="field-head strong">What are you good at? <span class="count" id="bio-count">${s.bio.length}/160</span></label>
        <textarea id="bio" class="input soft" rows="4" maxlength="160" data-input="bio">${s.bio}</textarea>
      </div>
      <label class="field strong">Email
        <input class="input soft" type="email" data-input="email" value="${s.email}" autocomplete="email" placeholder="you@example.com">
      </label>
    </section>
  </main>

  <footer class="flow-foot col">
    <button class="btn btn-primary btn-lg" data-action="save">Save changes</button>
    <button class="btn btn-ghost" data-action="logout">Log out</button>
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
    pickPhoto() {
      document.getElementById('photo-file').click();
    },
    removePhoto(s) {
      s.newPhoto = null;
      refreshPhoto(s);
    },
    async save(s, button) {
      if (!s.name.trim()) return toast('Your name can’t be empty.');
      busy(button, true, 'Saving…');
      const { user } = await api('/me', { method: 'PUT', body: { name: s.name, bio: s.bio, email: s.email, photo: s.newPhoto } });
      app.me = user;
      toast('Profile saved.');
      navigate('/profile', { replace: true });
    },
    async logout() {
      await api('/logout', { method: 'POST' });
      app.me = null;
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
      navigate('/login', { replace: true });
    }
  }
};
