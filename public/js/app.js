// Entry point: register the screens, find out who's logged in, then start the router.

import { api } from './api.js';
import { app, setRoutes, start } from './core.js';
import { registerServiceWorker } from './install.js';
import { login, signup, welcome } from './screens/auth.js';
import { home } from './screens/home.js';
import { create } from './screens/create.js';
import { lesson, thanks } from './screens/lesson.js';
import { profile, editProfile } from './screens/profile.js';

setRoutes([
  { re: /^\/$/, screen: home },
  { re: /^\/login$/, screen: login },
  { re: /^\/signup$/, screen: signup },
  { re: /^\/welcome$/, screen: welcome },
  { re: /^\/create\/(new|[1-6])$/, screen: create },
  { re: /^\/lesson\/(\d+)$/, screen: lesson },
  { re: /^\/lesson\/(\d+)\/thanks$/, screen: thanks },
  { re: /^\/profile$/, screen: profile },
  { re: /^\/profile\/edit$/, screen: editProfile },
  { re: /^\/u\/(\d+)$/, screen: profile }
]);

registerServiceWorker();

let offline = false;
try {
  app.me = (await api('/me')).user;
} catch (err) {
  offline = err.status === 0; // 401 just means "not logged in"
}

if (offline) {
  document.getElementById('app').innerHTML = `<main class="screen pad-auth center-col">
    <h1 class="display h-30">You're offline</h1>
    <p class="lede">Teach Club needs the internet to show lessons. Check your connection and try again.</p>
    <a class="btn btn-primary btn-md" href="">Try again</a>
  </main>`;
} else {
  start();
}
