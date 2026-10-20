// "Forgot it?": ask for a reset link (/forgot), then choose a new password from the emailed link (/reset?token=…).

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render } from '../core.js';
import { t } from '../i18n.js';
import { icon, toast, busy, showError, langToggle } from '../ui.js';
import { humanCheck, humanCheckOn, resetHumanCheck } from '../turnstile.js';

export const forgot = {
  title: () => t('forgot.title'),
  public: true,
  guestOnly: true,
  load: ({ query }) => ({ email: query.get('email') || '', sent: false }),
  after(s) {
    if (!s.sent) s.human = humanCheck('ts-forgot');
  },
  view: (s) => html`
<main class="screen pad-auth">
  <div class="row-between">
    <a class="icon-btn" href="/login" aria-label="${t('forgot.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    ${langToggle()}
  </div>
  ${s.sent
    ? html`<div class="center-col stack-14 pt-12">
        <span class="sent-check">${icon('check', 26, 2.6)}</span>
        <h1 class="display h-30">${t('forgot.sentTitle')}</h1>
        <p class="lede"><span>${t('forgot.sentBody', { email: '⁨' + s.email + '⁩' })}</span></p>
        <p class="small muted">${t('forgot.spam')}</p>
      </div>
      <div class="mt-auto stack-12">
        <a class="btn btn-primary btn-lg" href="/login">${t('forgot.back')}</a>
        <button class="btn btn-ghost" data-action="again">${t('forgot.again')}</button>
      </div>`
    : html`<div class="stack-8">
        <h1 class="display h-34">${t('forgot.heading')}</h1>
        <p class="lede">${t('forgot.lede')}</p>
      </div>
      <form class="form" data-submit="send" novalidate>
        <p class="form-error" id="form-error" role="alert" hidden></p>
        <label class="field">${t('field.email')}
          <input class="input" name="email" type="email" dir="ltr" autocomplete="email" placeholder="${t('field.emailPh')}" value="${s.email}" required>
        </label>
        <div id="ts-forgot" class="ts-box"></div>
        <button class="btn btn-primary btn-lg mt-8" type="submit">${t('forgot.submit')}</button>
      </form>`}
</main>`,
  actions: {
    async send(s, form) {
      const email = String(new FormData(form).get('email') || '').trim();
      if (!email) return showError('form-error', t('forgot.errEmail'));
      const turnstile = s.human ? s.human() : '';
      if (humanCheckOn() && !turnstile) return showError('form-error', t('rules.human'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('forgot.busy'));
      try {
        await api('/forgot', { method: 'POST', body: { email, turnstile } });
      } catch (err) {
        busy(button, false);
        resetHumanCheck('ts-forgot');
        return showError('form-error', err.message);
      }
      s.email = email;
      s.sent = true;
      render();
    },
    again(s) {
      s.sent = false;
      render();
    }
  }
};

export const reset = {
  title: () => t('reset.title'),
  public: true,
  load: ({ query }) => ({ token: query.get('token') || '' }),
  view: (s) => html`
<main class="screen pad-auth">
  <div class="top-tools">${langToggle()}</div>
  <div class="stack-8">
    <h1 class="display h-34">${t('reset.heading')}</h1>
    <p class="lede">${t('reset.lede')}</p>
  </div>
  ${s.token
    ? html`<form class="form" data-submit="save" novalidate>
        <p class="form-error" id="form-error" role="alert" hidden></p>
        <div class="field">
          <label for="new-pw">${t('reset.field')}</label>
          <div class="pw-wrap">
            <input class="input pw-input" id="new-pw" name="password" type="password" dir="ltr" autocomplete="new-password" minlength="8" placeholder="${t('signup.passwordPh')}" required>
            <button type="button" class="pw-toggle" data-action="togglePw" aria-controls="new-pw">${t('signup.show')}</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg mt-8" type="submit">${t('reset.submit')}</button>
        <a class="small strong center" href="/forgot" id="new-link" hidden>${t('reset.newLink')}</a>
      </form>`
    : html`<p class="form-error">${t('reset.noToken')}</p>
      <a class="btn btn-primary btn-lg" href="/forgot">${t('reset.newLink')}</a>`}
</main>`,
  actions: {
    togglePw(s, button) {
      const input = document.getElementById('new-pw');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? t('signup.hide') : t('signup.show');
    },
    async save(s, form) {
      const password = String(new FormData(form).get('password') || '');
      if (password.length < 8) return showError('form-error', t('signup.errPw'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('reset.busy'));
      try {
        const { user, club, owner } = await api('/reset', { method: 'POST', body: { token: s.token, password } });
        app.me = user;
        app.club = club;
        app.owner = !!owner;
        toast(t('reset.done'));
        navigate('/', { replace: true });
      } catch (err) {
        busy(button, false);
        showError('form-error', err.message);
        if (err.status === 400) document.getElementById('new-link').hidden = false;
      }
    }
  }
};
