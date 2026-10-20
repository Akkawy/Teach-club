// Cloudflare Turnstile: the free "are you human?" check on sign-up and password reset.
// Until a site key is set (wrangler.jsonc → TURNSTILE_SITE_KEY) this does nothing and forms work as before.

import { lang } from './i18n.js';
import { app } from './core.js';

let loading = null;
const widgets = {};

function load() {
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return loading;
}

export const humanCheckOn = () => !!app.config.turnstileSiteKey;

// Draws the check into the element with this id. Returns a function that gives the latest token.
export function humanCheck(id) {
  const state = { token: '' };
  if (!humanCheckOn()) return () => '';
  load()
    .then(() => {
      const el = document.getElementById(id);
      if (!el || el.dataset.ready) return;
      el.dataset.ready = '1';
      widgets[id] = window.turnstile.render(el, {
        sitekey: app.config.turnstileSiteKey,
        language: lang,
        theme: 'light',
        callback: (token) => { state.token = token; },
        'expired-callback': () => { state.token = ''; },
        'error-callback': () => { state.token = ''; }
      });
    })
    .catch(() => {
      // blocked by the network: the server will say so if the check is required
    });
  return () => state.token;
}

// A token works once; get a fresh one after a failed submit.
export function resetHumanCheck(id) {
  if (window.turnstile && widgets[id] !== undefined) window.turnstile.reset(widgets[id]);
}
