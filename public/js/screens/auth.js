// Sign up, log in and the welcome screen.

import { html, raw } from '../html.js';
import { api } from '../api.js';
import { app, applyMe, navigate, render, afterAuth } from '../core.js';
import { t, setLang } from '../i18n.js';
import { avatar, brand, icon, initialsOf, toast, busy, showError, langToggle } from '../ui.js';
import { resizePhoto } from '../photo.js';
import { introSeen } from './intro.js';
import { humanCheck, humanCheckOn, resetHumanCheck } from '../turnstile.js';
import { shouldOfferInstall } from '../install.js';
import { rulesList } from './onboard.js';

// After signing up, offer the home-screen step once, then go on.
const viaInstall = (to) => (shouldOfferInstall() ? `/install?then=${encodeURIComponent(to)}` : to);

const safeNext = (v) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/');

// First-time visitors see the walkthrough before logging in or signing up.
function introFirst(path) {
  return introSeen() ? null : { redirect: `/intro?then=${encodeURIComponent(path)}` };
}

export const login = {
  title: () => t('login.title'),
  public: true,
  guestOnly: true,
  load: ({ query }) => introFirst('/login' + (query.toString() ? '?' + query : '')) || { next: safeNext(query.get('next')) },
  view: () => html`
<main class="screen pad-auth">
  <div class="top-tools">${langToggle()}</div>
  <div class="auth-top">
    <div class="trio" aria-hidden="true">
      <span class="trio-side side-a" style="background:#D2F0E3;color:#11684F">${icon('heart', 26)}</span>
      <span class="trio-mid"><svg width="40" height="40" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5" fill="#FFFFFF"/><circle cx="15" cy="12" r="5" fill="none" stroke="#FFFFFF" stroke-width="2"/></svg></span>
      <span class="trio-side side-b" style="background:#E4DCF8;color:#5232A3">${icon('bubbles', 26)}</span>
    </div>
    <div class="center stack-8">
      <h1 class="display h-34">${t('login.heading')}</h1>
      <p class="lede">${t('login.lede')}</p>
    </div>
  </div>

  <form class="form" data-submit="submit" novalidate>
    <p class="form-error" id="form-error" role="alert" hidden></p>
    <label class="field">${t('field.email')}
      <input class="input" name="email" type="email" dir="ltr" autocomplete="email" placeholder="${t('field.emailPh')}" required>
    </label>
    <div class="field">
      <div class="field-head"><label for="login-pw">${t('field.password')}</label><button type="button" class="text-btn" data-action="forgot">${t('login.forgot')}</button></div>
      <input class="input" id="login-pw" name="password" type="password" dir="ltr" autocomplete="current-password" placeholder="${t('login.passwordPh')}" required>
    </div>
    <button class="btn btn-primary btn-lg mt-8" type="submit">${t('login.submit')}</button>
  </form>

  <div class="card join-card">
    <span class="muted">${t('login.newHere')}</span>
    <a class="btn btn-soft btn-md" href="/signup">${t('login.join')}</a>
    <a class="small strong" href="/intro?then=/login">${t('login.whatIs')}</a>
  </div>
</main>`,
  actions: {
    async submit(s, form) {
      const data = Object.fromEntries(new FormData(form));
      if (!data.email || !data.password) return showError('form-error', t('login.missing'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('login.busy'));
      try {
        await api('/login', { method: 'POST', body: { email: data.email, password: data.password } });
        applyMe(await api('/me'));
        navigate(afterAuth(s.next), { replace: true });
      } catch (err) {
        busy(button, false);
        showError('form-error', err.message);
      }
    },
    forgot() {
      const email = document.querySelector('input[name="email"]')?.value.trim() || '';
      navigate('/forgot' + (email ? '?email=' + encodeURIComponent(email) : ''));
    }
  }
};

function photoSlot(s) {
  const pic = s.photo
    ? html`<img class="avatar" src="${s.photo}" alt="${t('signup.previewAlt')}" style="width:104px;height:104px">`
    : html`<span class="avatar avatar-dashed display" id="initials" role="img" aria-label="${t('signup.initialsAlt')}" style="width:104px;height:104px;background:#FBD9C4;color:#8A3510;font-size:38px">${initialsOf(s.name)}</span>`;
  return html`${pic}<button type="button" class="cam-btn" data-action="pickPhoto" aria-label="${s.photo ? t('signup.change') : t('signup.upload')}">${icon('camera', 18, 2.2)}</button>`;
}

function photoText(s) {
  return s.photo
    ? { title: t('signup.photoGood'), hint: t('signup.photoGoodHint') }
    : { title: t('signup.addPhoto'), hint: t('signup.addPhotoHint') };
}

// Keeps what's been typed when the language is switched mid-form.
function remember(s) {
  const form = document.querySelector('form[data-submit="submit"]');
  if (form) s.typed = Object.fromEntries(new FormData(form));
}

export const signup = {
  title: () => t('signup.title'),
  public: true,
  guestOnly: true,
  load: () => introFirst('/signup') || { name: '', photo: null, typed: {} },
  after(s) {
    s.human = humanCheck('ts-signup');
  },
  view: (s) => html`
<main class="screen pad-signup">
  <div class="row-between">${brand()}${langToggle()}</div>
  <div class="stack-8">
    <h1 class="display h-34">${t('signup.title')}</h1>
    <p class="lede">${t('signup.lede')}</p>
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
    <label class="field">${t('field.name')}
      <input class="input" name="name" data-input="name" dir="auto" autocomplete="name" maxlength="60" placeholder="${t('field.namePh')}" value="${s.typed.name || ''}" required>
    </label>
    <label class="field">${t('field.email')}
      <input class="input" name="email" type="email" dir="ltr" autocomplete="email" placeholder="${t('field.emailPh')}" value="${s.typed.email || ''}" required>
    </label>
    <div class="field">
      <label for="su-pw">${t('field.password')}</label>
      <div class="pw-wrap">
        <input class="input pw-input" id="su-pw" name="password" type="password" dir="ltr" autocomplete="new-password" minlength="8" placeholder="${t('signup.passwordPh')}" value="${s.typed.password || ''}" required>
        <button type="button" class="pw-toggle" data-action="togglePw" aria-controls="su-pw">${t('signup.show')}</button>
      </div>
    </div>
    <label class="field">
      <span class="field-head">${t('field.bio')} <span class="opt">${t('common.optional')}</span></span>
      <textarea class="input" name="bio" rows="3" maxlength="160" dir="auto" placeholder="${t('field.bioPh')}">${s.typed.bio || ''}</textarea>
      <span class="hint">${t('signup.bioHint')}</span>
    </label>
    <label class="check-row">
      <input type="checkbox" name="agree" value="1" ${s.typed.agree ? 'checked' : ''}>
      <span>${t('rules.agree')} <strong>${t('rules.agreeLink')}</strong></span>
    </label>
    <details class="rules-details">
      <summary>${t('rules.title')}</summary>
      ${rulesList()}
    </details>
    <div id="ts-signup" class="ts-box"></div>
    <button class="btn btn-primary btn-lg mt-6" type="submit">${t('signup.submit')}</button>
  </form>

  <p class="center muted">${t('signup.already')} <a href="/login" class="strong">${t('signup.login')}</a></p>
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
    setLang(s, el) {
      remember(s);
      setLang(el.dataset.lang);
      render();
    },
    pickPhoto() {
      document.getElementById('photo-file').click();
    },
    togglePw(s, button) {
      const input = document.getElementById('su-pw');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? t('signup.hide') : t('signup.show');
    },
    async submit(s, form) {
      const data = Object.fromEntries(new FormData(form));
      if (!String(data.name || '').trim()) return showError('form-error', t('signup.errName'));
      if (!data.email) return showError('form-error', t('signup.errEmail'));
      if (String(data.password || '').length < 8) return showError('form-error', t('signup.errPw'));
      if (!data.agree) return showError('form-error', t('rules.mustAgree'));
      const turnstile = s.human ? s.human() : '';
      if (humanCheckOn() && !turnstile) return showError('form-error', t('rules.human'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('signup.busy'));
      try {
        const { user } = await api('/signup', {
          method: 'POST',
          body: { name: data.name, email: data.email, password: data.password, bio: data.bio, photo: s.photo, agree: true, turnstile }
        });
        applyMe({ user, club: null });
        navigate(afterAuth('/welcome'), { replace: true });
      } catch (err) {
        busy(button, false);
        resetHumanCheck('ts-signup');
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
  title: () => t('welcome.title'),
  view: () => html`
<main class="screen pad-auth gap-26">
  <div class="center-col stack-18 pt-12">
    <div class="welcome-avatar">
      ${avatar(app.me, 120, { display: true, font: 44 })}
      ${sparkle(30, '#D99A12', 'left:-16px;top:6px')}
      ${sparkle(20, '#3A7BD5', 'right:-12px;top:0')}
      ${raw('<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;right:-18px;bottom:14px"><circle cx="12" cy="12" r="7" fill="#D24E7C"/></svg>')}
    </div>
    <h1 class="display h-34">${t('welcome.heading', { name: app.me.firstName })}</h1>
    <p class="lede narrow">${t('welcome.lede')}</p>
  </div>

  <ol class="plain stack-12">
    ${welcomeItem('clock', t('welcome.i1t'), t('welcome.i1b'))}
    ${welcomeItem('pencil', t('welcome.i2t'), t('welcome.i2b'))}
    ${welcomeItem('heart', t('welcome.i3t'), t('welcome.i3b'))}
  </ol>

  <div class="mt-auto stack-12">
    <a class="btn btn-primary btn-lg" href="${viaInstall('/')}">${t('welcome.see')}</a>
    <a class="btn btn-secondary btn-lg" href="${viaInstall('/create/new')}">${t('welcome.idea')}</a>
  </div>
</main>`
};
