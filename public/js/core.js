// The app shell: routing, rendering and event wiring.
//
// A screen is { title, public?, guestOnly?, responsive?, load(ctx) -> state, view(state) -> html,
// actions, inputs, changes }. Elements opt into handlers with data-action (click), data-submit
// (form submit), data-input (typing) and data-change (file pickers, time inputs).

import { html } from './html.js';
import { toast } from './ui.js';

export const app = { me: null };

const wideQuery = window.matchMedia('(min-width: 900px)');
export const isWide = () => wideQuery.matches;

let routes = [];
let current = null;
let navToken = 0;
const root = () => document.getElementById('app');

const errorScreen = {
  title: 'Oops',
  view: (s) => html`<main class="screen pad-auth center-col">
    <h1 class="display h-30">Hmm, that didn't work</h1>
    <p class="lede">${s.message}</p>
    <a class="btn btn-primary btn-md" href="/">Back to the calendar</a>
  </main>`
};

export function setRoutes(list) {
  routes = list;
}

export function navigate(to, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  return show(to);
}

export function render() {
  if (!current) return;
  root().innerHTML = String(current.screen.view(current.state));
}

async function show(href, { scroll = true } = {}) {
  const token = ++navToken;
  const url = new URL(href, location.origin);
  let found = null;
  for (const r of routes) {
    const m = r.re.exec(url.pathname);
    if (m) {
      found = { screen: r.screen, params: m.slice(1) };
      break;
    }
  }
  if (!found) return navigate('/', { replace: true });
  const { screen, params } = found;
  if (!screen.public && !app.me) return navigate('/login?next=' + encodeURIComponent(url.pathname + url.search), { replace: true });
  if (screen.guestOnly && app.me) return navigate('/', { replace: true });

  const spinner = setTimeout(() => {
    if (token === navToken) root().innerHTML = '<div class="loading" role="status"><span class="spinner"></span><span class="sr-only">Loading…</span></div>';
  }, 150);
  let state;
  let shown = screen;
  try {
    state = (await screen.load?.({ params, query: url.searchParams })) || {};
  } catch (err) {
    if (err.status === 401) {
      app.me = null;
      clearTimeout(spinner);
      return navigate('/login', { replace: true });
    }
    shown = errorScreen;
    state = { message: err.message };
  }
  clearTimeout(spinner);
  if (token !== navToken) return;
  if (state.redirect) return navigate(state.redirect, { replace: true });

  current = { screen: shown, state };
  const title = typeof shown.title === 'function' ? shown.title(state) : shown.title;
  document.title = title ? `${title} · Teach Club` : 'Teach Club';
  render();
  if (scroll) window.scrollTo(0, 0);
}

function run(fn, el, event) {
  Promise.resolve()
    .then(() => fn(current.state, el, event))
    .catch((err) => {
      if (err.status === 401) {
        app.me = null;
        navigate('/login', { replace: true });
      } else {
        toast(err.message || 'Something went wrong.');
        render(); // puts back any button that was left in its busy state
      }
    });
}

export function start() {
  const el = root();

  el.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (target && el.contains(target) && current) {
      const fn = current.screen.actions?.[target.dataset.action];
      if (fn) {
        e.preventDefault();
        if (!target.disabled) run(fn, target, e);
        return;
      }
    }
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute('href');
    if (a.target || a.hasAttribute('download') || !href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/')) return;
    e.preventDefault();
    navigate(href);
  });

  el.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-submit]');
    if (!form || !current) return;
    e.preventDefault();
    const fn = current.screen.actions?.[form.dataset.submit];
    if (fn) run(fn, form, e);
  });

  el.addEventListener('input', (e) => {
    const target = e.target.closest('[data-input]');
    if (!target || !current) return;
    current.screen.inputs?.[target.dataset.input]?.(current.state, target, e);
  });

  el.addEventListener('change', (e) => {
    const target = e.target.closest('[data-change]');
    if (!target || !current) return;
    const fn = current.screen.changes?.[target.dataset.change];
    if (fn) run(fn, target, e);
  });

  window.addEventListener('popstate', () => show(location.href, { scroll: false }));
  wideQuery.addEventListener('change', () => {
    if (current?.screen.responsive) render();
  });

  return show(location.href);
}
