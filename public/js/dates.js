// Dates are plain 'YYYY-MM-DD' strings in the member's local time; weeks start on Monday.
// Names come from the current language.

import { t, tp } from './i18n.js';

const pad = (n) => String(n).padStart(2, '0');

export function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parse(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(parse(s)) === s;
}

export const today = () => iso(new Date());

export function addDays(s, n) {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const weekdayIndex = (s) => (parse(s).getDay() + 6) % 7;

export const monthName = (m) => t('dates.months')[m];
export const monShort = (m) => t('dates.mon')[m];
export const wdShort = (i) => t('dates.wdShort')[i];
export const monthYear = (y, m) => t('dates.monthYear', { m: monthName(m), y });

export function fmtTime(time) {
  const [h, m] = time.split(':').map(Number);
  return t('dates.time', { h: h % 12 === 0 ? 12 : h % 12, m: pad(m), ap: h >= 12 ? t('dates.pm') : t('dates.am') });
}

export function shortDate(s) {
  const d = parse(s);
  return t('dates.short', { wd: wdShort(weekdayIndex(s)), d: d.getDate(), m: monShort(d.getMonth()) });
}

export function longDay(s) {
  const d = parse(s);
  return t('dates.long', { wd: t('dates.wdLong')[weekdayIndex(s)], d: d.getDate(), m: monShort(d.getMonth()) });
}

export function rangeLabel(a, b) {
  const da = parse(a);
  const db = parse(b);
  return da.getMonth() === db.getMonth()
    ? t('dates.rangeSame', { m: monShort(da.getMonth()), a: da.getDate(), b: db.getDate() })
    : t('dates.rangeDiff', { ma: monShort(da.getMonth()), a: da.getDate(), mb: monShort(db.getMonth()), b: db.getDate() });
}

// Lessons come with startsAt (UTC). Show them on the viewer's own clock; keep the host's for reference.
export function localize(lesson) {
  if (!lesson || !lesson.startsAt || lesson.hostDate) return lesson;
  const d = new Date(lesson.startsAt);
  lesson.hostDate = lesson.date;
  lesson.hostTime = lesson.time;
  lesson.date = iso(d);
  lesson.time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return lesson;
}

export const dayStartMs = (s) => parse(s).getTime();
export const tzCity = (tz) => String(tz || '').split('/').pop().replace(/_/g, ' ');

export function startOf(lesson) {
  if (lesson.startsAt) return new Date(lesson.startsAt);
  const d = parse(lesson.date);
  const [h, m] = lesson.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export const isOver = (lesson) => startOf(lesson).getTime() + lesson.length * 60000 <= Date.now();

export function happenedLabel(s) {
  const diff = daysBetween(s, today());
  if (diff <= 0) return t('thanks.today');
  if (diff === 1) return t('thanks.yesterday');
  if (diff < 7) return t('thanks.ago', { days: tp('days', diff) });
  return t('thanks.on', { date: shortDate(s) });
}

export const minutes = (n) => tp('min', n);
export const minShort = (n) => t('dates.minShort', { n });

// SQLite stores "2026-09-12 10:00:00" in UTC
export function memberSince(sql) {
  const d = new Date(String(sql).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? '' : monthYear(d.getFullYear(), d.getMonth());
}
