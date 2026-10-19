// Entry point: register the screens, find out who's logged in, then start the router.

import { api } from './api.js';
import { app, setRoutes, start } from './core.js';
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

try {
  app.me = (await api('/me')).user;
} catch {
  // not logged in
}
start();
