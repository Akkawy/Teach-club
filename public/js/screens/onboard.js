// The "add to home screen" step shown after signing up, and the community rules page.

import { html } from '../html.js';
import { app, navigate, render } from '../core.js';
import { t, th } from '../i18n.js';
import { icon, toast, langToggle, brand } from '../ui.js';
import { isInstalled, isIOS, canPrompt, promptInstall, onInstallChange, isInAppBrowser, installStepSeen } from '../install.js';

const safeThen = (v) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/');

onInstallChange(() => {
  if (document.getElementById('install-step')) render();
});

function steps(list) {
  return html`<ol class="plain stack-12 install-steps">${list.map((s, i) => html`<li><span class="num">${i + 1}</span><span>${th(s, { icon: icon('share', 18) })}</span></li>`)}</ol>`;
}

export const installStep = {
  title: () => t('installStep.title'),
  load({ query }) {
    const then = safeThen(query.get('then'));
    installStepSeen(true);
    if (isInstalled()) return { redirect: then };
    return { then };
  },
  view(s) {
    const inApp = isInAppBrowser();
    let how;
    if (inApp) {
      how = html`<div class="note warn stack-8">
        <strong>${t('installStep.inApp')}</strong>
        <span>${t('installStep.inAppHow')}</span>
        <button class="btn btn-secondary btn-sm self-start" data-action="copy">${icon('copy', 18)}${t('installStep.copy')}</button>
      </div>`;
    } else if (canPrompt()) {
      how = html`<button class="btn btn-primary btn-xl shadow" data-action="install">${icon('plus', 22, 2.4)}${t('install.button')}</button>`;
    } else if (isIOS()) {
      how = steps(t('installStep.ios').map((_, i) => `installStep.ios.${i}`));
    } else {
      how = steps(t('installStep.android').map((_, i) => `installStep.android.${i}`));
    }
    return html`
<main class="screen pad-auth gap-22" id="install-step">
  <div class="row-between">${brand()}${langToggle()}</div>
  <div class="center-col stack-14 pt-12">
    <img src="/icons/icon-192.png" alt="" width="96" height="96" class="app-icon">
    <h1 class="display h-30">${t('installStep.heading')}</h1>
    <p class="lede">${t('installStep.lede')}</p>
  </div>
  ${how}
  <div class="mt-auto stack-10">
    <a class="btn btn-secondary btn-lg" href="${s.then}">${t('installStep.next')}</a>
  </div>
</main>`;
  },
  actions: {
    async install(s) {
      if (await promptInstall()) {
        toast(t('installStep.installed'));
        navigate(s.then, { replace: true });
      }
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(location.origin);
        toast(t('installStep.copied'));
      } catch {
        toast(location.origin);
      }
    }
  }
};

export const rules = {
  title: () => t('rules.title'),
  public: true,
  view: () => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">
    <a class="icon-btn" href="${app.me ? '/profile/edit' : '/signup'}" aria-label="${t('common.back')}">${icon('chevronLeft', 20, 2.2)}</a>
    ${langToggle()}
  </div>
  <h1 class="display h-30 row gap-8">${icon('shield', 26)}${t('rules.heading')}</h1>
  <p class="lede">${t('rules.intro')}</p>
  ${rulesList()}
</main>`
};

export function rulesList() {
  return html`<ol class="plain stack-10 rules-list">${t('rules.items').map((r, i) => html`<li><span class="num">${i + 1}</span><span>${r}</span></li>`)}</ol>`;
}
