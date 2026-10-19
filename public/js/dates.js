// Dates are plain 'YYYY-MM-DD' strings in the member's local time; weeks start on Monday.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WD_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WD_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

export function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? 'pm' : 'am'}`;
}

export function shortDate(s) {
  const d = parse(s);
  return `${WD_SHORT[weekdayIndex(s)]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function longDay(s) {
  const d = parse(s);
  return `${WD_LONG[weekdayIndex(s)]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function rangeLabel(a, b) {
  const da = parse(a);
  const db = parse(b);
  return da.getMonth() === db.getMonth()
    ? `${MON[da.getMonth()]} ${da.getDate()} – ${db.getDate()}`
    : `${MON[da.getMonth()]} ${da.getDate()} – ${MON[db.getMonth()]} ${db.getDate()}`;
}

export function startOf(lesson) {
  const d = parse(lesson.date);
  const [h, m] = lesson.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export const isOver = (lesson) => startOf(lesson).getTime() + lesson.length * 60000 <= Date.now();

export function happenedLabel(s) {
  const diff = daysBetween(s, today());
  if (diff <= 0) return 'Happened today';
  if (diff === 1) return 'Happened yesterday';
  if (diff < 7) return `Happened ${diff} days ago`;
  return `Happened ${shortDate(s)}`;
}

// SQLite stores "2026-09-12 10:00:00" in UTC
export function memberSince(sql) {
  const d = new Date(String(sql).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
