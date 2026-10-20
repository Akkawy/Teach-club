// "Install the app" support: registers the service worker and remembers Chrome's install prompt
// so the profile page can offer a button. iPhones have no prompt, so we show Safari's steps instead.

let deferred = null;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  listeners.forEach((fn) => fn());
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach((fn) => fn());
});

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // the site still works without it, just not offline
    });
  }
}

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const canPrompt = () => !!deferred;

// Browsers built into other apps (Instagram, Facebook, Snapchat, TikTok…) can't install web apps.
export const isInAppBrowser = () =>
  /Instagram|FBAN|FBAV|FB_IAB|Snapchat|Line\/|TikTok|musical_ly|Bytedance|Twitter|LinkedInApp|GSA\//i.test(navigator.userAgent);

const flag = (key, value) => {
  try {
    if (value === undefined) return localStorage.getItem(key) === '1';
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // storage blocked
  }
  return false;
};
// Whether the "add to home screen" step was already shown, and whether the home banner was dismissed.
export const installStepSeen = (v) => flag('tc_install_seen', v);
export const installBannerOff = (v) => flag('tc_install_banner_off', v);
export const shouldOfferInstall = () => !isInstalled() && !installStepSeen();

export async function promptInstall() {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  e.prompt();
  const { outcome } = await e.userChoice;
  listeners.forEach((fn) => fn());
  return outcome === 'accepted';
}

export function onInstallChange(fn) {
  listeners.add(fn);
}
