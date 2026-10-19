// Talks to the Worker under /api. Throws an Error with a friendly message (and .status) on failure.
// x-lang picks the language of error messages and emails; x-tz is the member's time zone (for emails).

import { t, lang } from './i18n.js';

let tz = 'UTC';
try {
  tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
} catch {
  // very old browser
}
export const browserTz = tz;

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: { 'x-lang': lang, 'x-tz': browserTz, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    const err = new Error(t('common.network'));
    err.status = 0;
    throw err;
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || t('common.somethingWrong'));
    err.status = res.status;
    throw err;
  }
  return data;
}
