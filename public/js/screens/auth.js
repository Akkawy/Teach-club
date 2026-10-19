// Sign up, log in and the welcome screen.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, navigate } from '../core.js';
import { avatar, brand, icon, initialsOf, toast, busy, showError } from '../ui.js';
import { resizePhoto } from '../photo.js';

const safeNext = (v) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/');

export const login = {
  title: 'Log in',
  public: true,
  guestOnly: true,
  load: ({ query }) => ({ next: safeNext(query.get('next')) }),
  view: () => html`
<main class="screen pad-auth">
  <div class="auth-top">
    <div class="trio" aria-hidden="true">
      <span class="trio-side" style="left:0;background:#D2F0E3;color:#11684F">${icon('heart', 26)}</span>
      <span class="trio-mid"><svg width="40" height="40" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5" fill="#FFFFFF"/><circle cx="15" cy="12" r="5" fill="none" stroke="#FFFFFF" stroke-width="2"/></svg></span>
      <span class="trio-side" style="right:0;background:#E4DCF8;color:#5232A3">${icon('bubbles', 26)}</span>
    </div>
    <div class="center stack-8">
      <h1 class="display h-34">Welcome back</h1>
      <p class="lede">Good to see you. Your friends have been busy.</p>
    </div>
  </div>

  <form class="form" data-submit="submit" novalidate>
    <p class="form-error" id="form-error" role="alert" hidden></p>
    <label class="field">Email
      <input class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
    </label>
    <div class="field">
      <div class="field-head"><label for="login-pw">Password</label><button type="button" class="text-btn" data-action="forgot">Forgot it?</button></div>
      <input class="input" id="login-pw" name="password" type="password" autocomplete="current-password" placeholder="Your password" required>
    </div>
    <button class="btn btn-primary btn-lg mt-8" type="submit">Log in</button>
  </form>

  <div class="card join-card">
    <span class="muted">New here?</span>
    <a class="btn btn-soft btn-md" href="/signup">Join the club</a>
  </div>
</main>`,
  actions: {
    async submit(s, form) {
      const data = Object.fromEntries(new FormData(form));
      if (!data.email || !data.password) return showError('form-error', 'Enter your email and password.');
      const button = form.querySelector('[type=submit]');
      busy(button, true, 'Logging in…');
      try {
        const { user } = await api('/login', { method: 'POST', body: { email: data.email, password: data.password } });
        app.me = user;
        navigate(s.next, { replace: true });
      } catch (err) {
        busy(button, false);
        showError('form-error', err.message);
      }
    },
    forgot() {
      toast("Password reset isn't available yet, sorry.");
    }
  }
};

function photoSlot(s) {
  const pic = s.photo
    ? html`<img class="avatar" src="${s.photo}" alt="Your profile photo preview" style="width:104px;height:104px">`
    : html`<span class="avatar avatar-dashed display" id="initials" role="img" aria-label="Default avatar with your initials" style="width:104px;height:104px;background:#FBD9C4;color:#8A3510;font-size:38px">${initialsOf(s.name)}</span>`;
  return html`${pic}<button type="button" class="cam-btn" data-action="pickPhoto" aria-label="${s.photo ? 'Change your profile photo' : 'Upload a profile photo'}">${icon('camera', 18, 2.2)}</button>`;
}

function photoText(s) {
  return s.photo
    ? { title: 'Looking good!', hint: 'Tap the camera to change it.' }
    : { title: 'Add a photo', hint: "Totally optional. Skip it and we'll use your initials." };
}

export const signup = {
  title: 'Join the club',
  public: true,
  guestOnly: true,
  load: () => ({ name: '', photo: null }),
  view: (s) => html`
<main class="screen pad-signup">
  ${brand()}
  <div class="stack-8">
    <h1 class="display h-34">Join the club</h1>
    <p class="lede">Friends teaching friends, a few minutes at a time. No experts required.</p>
  </div>

  <div class="card photo-card">
    <div class="photo-wrap" id="photo-slot">${photoSlot(s)}</div>
    <div class="stack-6">
      <strong id="photo-title">${photoText(s).title}</strong>
      <span class="small muted" id="photo-hint">${photoText(s).hint}</span>
    </div>
    <input type="file" accept="image/*" id="photo-file" data-change="photo" hidden>
  </div>

  <form class="form" data-submit="submit" novalidate>
    <p class="form-error" id="form-error" role="alert" hidden></p>
    <label class="field">Your name
      <input class="input" name="name" data-input="name" autocomplete="name" maxlength="60" placeholder="What friends call you" required>
    </label>
    <label class="field">Email
      <input class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
    </label>
    <div class="field">
      <label for="su-pw">Password</label>
      <div class="pw-wrap">
        <input class="input pw-input" id="su-pw" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required>
        <button type="button" class="pw-toggle" data-action="togglePw" aria-controls="su-pw">Show</button>
      </div>
    </div>
    <label class="field">
      <span class="field-head">What are you good at? <span class="opt">Optional</span></span>
      <textarea class="input" name="bio" rows="3" maxlength="160" placeholder="Baking bread, chess openings, fixing bikes, bad puns…"></textarea>
      <span class="hint">A line or two is perfect. It helps friends know what to ask you about.</span>
    </label>
    <button class="btn btn-primary btn-lg mt-6" type="submit">Create my account</button>
  </form>

  <p class="center muted">Already a member? <a href="/login" class="strong">Log in</a></p>
</main>`,
  inputs: {
    name(s, el) {
      s.name = el.value;
      const initials = document.getElementById('initials');
      if (initials) initials.textContent = initialsOf(s.name);
    }
  },
  changes: {
    async photo(s, el) {
      const file = el.files && el.files[0];
      el.value = '';
      if (!file) return;
      try {
        s.photo = await resizePhoto(file);
      } catch (err) {
        return toast(err.message); // no re-render: it would clear what they've typed
      }
      document.getElementById('photo-slot').innerHTML = String(photoSlot(s));
      document.getElementById('photo-title').textContent = photoText(s).title;
      document.getElementById('photo-hint').textContent = photoText(s).hint;
    }
  },
  actions: {
    pickPhoto() {
      document.getElementById('photo-file').click();
    },
    togglePw(s, button) {
      const input = document.getElementById('su-pw');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
    },
    async submit(s, form) {
      const data = Object.fromEntries(new FormData(form));
      if (!String(data.name || '').trim()) return showError('form-error', 'Tell us what friends call you.');
      if (!data.email) return showError('form-error', 'Add your email so you can log in later.');
      if (String(data.password || '').length < 8) return showError('form-error', 'Your password needs at least 8 characters.');
      const button = form.querySelector('[type=submit]');
      busy(button, true, 'Creating your account…');
      try {
        const { user } = await api('/signup', {
          method: 'POST',
          body: { name: data.name, email: data.email, password: data.password, bio: data.bio, photo: s.photo }
        });
        app.me = user;
        navigate('/welcome', { replace: true });
      } catch (err) {
        busy(button, false);
        showError('form-error', err.message);
      }
    }
  }
};

const sparkle = (size, color, style) =>
  raw(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;${style}"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="${color}"/></svg>`);

function welcomeItem(ic, title, text) {
  return html`<li class="card welcome-item">
    <span class="soft-square">${icon(ic, 22)}</span>
    <span class="stack-3"><strong>${title}</strong><span class="muted">${text}</span></span>
  </li>`;
}

export const welcome = {
  title: 'Welcome',
  view: () => html`
<main class="screen pad-auth gap-26">
  <div class="center-col stack-18 pt-12">
    <div class="welcome-avatar">
      ${avatar(app.me, 120, { display: true, font: 44 })}
      ${sparkle(30, '#D99A12', 'left:-16px;top:6px')}
      ${sparkle(20, '#3A7BD5', 'right:-12px;top:0')}
      ${raw('<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;right:-18px;bottom:14px"><circle cx="12" cy="12" r="7" fill="#D24E7C"/></svg>')}
    </div>
    <h1 class="display h-34">You're in, ${app.me.firstName}!</h1>
    <p class="lede narrow">Here's the whole idea, in three easy bits.</p>
  </div>

  <ol class="plain stack-12">
    ${welcomeItem('clock', 'Lessons are short', "5 to 30 minutes. That's it, never longer.")}
    ${welcomeItem('pencil', 'We help you plan', 'Pick a format, answer a few prompts, get a time plan.')}
    ${welcomeItem('heart', 'Friends, not an audience', 'No slides, no grades. Just share what you love.')}
  </ol>

  <div class="mt-auto stack-12">
    <a class="btn btn-primary btn-lg" href="/">See what's coming up</a>
    <a class="btn btn-secondary btn-lg" href="/create/new">I already have an idea</a>
  </div>
</main>`
};
