// Service worker: lets Teach Club install as an app and open even with a weak connection.
// Pages, styles and scripts: network first (so a deploy shows up straight away), saved copy if offline.
// Google Fonts: saved copy first. /api is never cached: lessons and accounts always come live.

const VERSION = 'v6';
const SHELL = `shell-${VERSION}`;
const FONTS = `fonts-${VERSION}`;
const PRECACHE = [
  '/', '/styles.css', '/manifest.webmanifest', '/favicon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png',
  '/js/app.js', '/js/core.js', '/js/api.js', '/js/html.js', '/js/ui.js', '/js/dates.js', '/js/formats.js', '/js/photo.js', '/js/install.js', '/js/i18n.js', '/js/strings.js',
  '/js/screens/auth.js', '/js/screens/intro.js', '/js/screens/reset.js', '/js/screens/club.js', '/js/screens/wishes.js',
  '/js/screens/present.js', '/js/screens/more.js', '/js/screens/onboard.js', '/js/screens/social.js',
  '/js/strings-more.js', '/js/turnstile.js', '/js/screens/home.js', '/js/screens/create.js', '/js/screens/lesson.js', '/js/screens/profile.js',
  '/js/strings-videos.js', '/js/follow.js', '/js/videos.js', '/js/screens/explore.js', '/js/screens/video.js', '/js/screens/notifications.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode !== 'navigate') {
          const copy = res.clone();
          caches.open(SHELL).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        // Every app page (/, /lesson/3, /profile…) is the same index.html; the app's router does the rest.
        if (req.mode === 'navigate') return (await caches.match('/')) || Response.error();
        return (await caches.match(req)) || Response.error();
      })
  );
});
