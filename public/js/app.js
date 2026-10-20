// Entry point: set the language, register the screens, find out who's logged in, then start the router.

import { api } from './api.js';
import { esc } from './html.js';
import { app, setRoutes, start } from './core.js';
import { applyLang, t } from './i18n.js';
import { registerServiceWorker } from './install.js';
import { login, signup, welcome } from './screens/auth.js';
import { intro } from './screens/intro.js';
import { forgot, reset } from './screens/reset.js';
import { home } from './screens/home.js';
import { create } from './screens/create.js';
import { lesson, thanks } from './screens/lesson.js';
import { present } from './screens/present.js';
import { profile, editProfile } from './screens/profile.js';
import { clubStart, club, join } from './screens/club.js';
import { wishes } from './screens/wishes.js';
import { report, deleteAccount, privacy, wrapped } from './screens/more.js';
import { installStep, rules } from './screens/onboard.js';
import { follows, owner } from './screens/social.js';

applyLang();

setRoutes([
  { re: /^\/$/, screen: home },
  { re: /^\/intro$/, screen: intro },
  { re: /^\/login$/, screen: login },
  { re: /^\/signup$/, screen: signup },
  { re: /^\/welcome$/, screen: welcome },
  { re: /^\/forgot$/, screen: forgot },
  { re: /^\/reset$/, screen: reset },
  { re: /^\/privacy$/, screen: privacy },
  { re: /^\/rules$/, screen: rules },
  { re: /^\/install$/, screen: installStep },
  { re: /^\/follows$/, screen: follows },
  { re: /^\/owner$/, screen: owner },
  { re: /^\/clubs\/start$/, screen: clubStart },
  { re: /^\/club$/, screen: club },
  { re: /^\/join\/([a-zA-Z0-9]{4,20})$/, screen: join },
  { re: /^\/wishes$/, screen: wishes },
  { re: /^\/wrapped$/, screen: wrapped },
  { re: /^\/report$/, screen: report },
  { re: /^\/create\/(new|[1-6])$/, screen: create },
  { re: /^\/lesson\/(\d+)$/, screen: lesson },
  { re: /^\/lesson\/(\d+)\/thanks$/, screen: thanks },
  { re: /^\/lesson\/(\d+)\/present$/, screen: present },
  { re: /^\/profile$/, screen: profile },
  { re: /^\/profile\/edit$/, screen: editProfile },
  { re: /^\/account\/delete$/, screen: deleteAccount },
  { re: /^\/u\/(\d+)$/, screen: profile }
]);

registerServiceWorker();

let offline = false;
const [config, me] = await Promise.allSettled([api('/config'), api('/me')]);
if (config.status === 'fulfilled') app.config = config.value;
if (me.status === 'fulfilled') {
  app.me = me.value.user;
  app.club = me.value.club;
  app.owner = !!me.value.owner;
  app.followRequests = me.value.followRequests || 0;
} else {
  offline = me.reason.status === 0; // 401 just means "not logged in"
}

if (offline) {
  document.getElementById('app').innerHTML = `<main class="screen pad-auth center-col">
    <h1 class="display h-30">${esc(t('common.offlineTitle'))}</h1>
    <p class="lede">${esc(t('common.offlineBody'))}</p>
    <a class="btn btn-primary btn-md" href="">${esc(t('common.tryAgain'))}</a>
  </main>`;
} else {
  start();
}
