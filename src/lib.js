// Shared helpers: errors and their Arabic translations, input checks, passwords, sessions,
// how members are shaped for the app, time zones and club membership.

export class HttpError extends Error {
  constructor(status, message, vars = {}) {
    super(message);
    this.status = status;
    this.vars = vars;
  }
}

// Messages are written in English here; the app asks for Arabic with an "x-lang: ar" header.
const AR = {
  'Blocked a cross-site request.': 'تم حظر طلب من موقع آخر.',
  'Not found.': 'غير موجود.',
  'Please log in first.': 'سجّل الدخول أولًا.',
  'There is already an account with that email. Try logging in.': 'يوجد حساب بهذا البريد الإلكتروني بالفعل. جرّب تسجيل الدخول.',
  "That email and password don't match.": 'البريد الإلكتروني وكلمة المرور غير متطابقين.',
  'Another member already uses that email.': 'هذا البريد الإلكتروني مستخدم من عضو آخر.',
  "We couldn't find that member.": 'لم نجد هذا العضو.',
  'No photo.': 'لا توجد صورة.',
  'Pick a date range.': 'اختر نطاقًا زمنيًا.',
  "We couldn't find that lesson. It may have been cancelled.": 'لم نجد هذا الدرس. ربما تم إلغاؤه.',
  "You're teaching this one, so you're already in!": 'أنت من يقدّم هذا الدرس، فأنت حاضر بالفعل!',
  "You can't send yourself a thank-you note.": 'لا يمكنك إرسال رسالة شكر لنفسك.',
  'Pick a reaction or write a line first.': 'اختر تفاعلًا أو اكتب سطرًا أولًا.',
  'Only the person teaching can change this lesson.': 'يمكن لمقدّم الدرس فقط تعديله.',
  'Pick a format for your lesson.': 'اختر شكلًا لدرسك.',
  'Pick a day for your lesson.': 'اختر يومًا لدرسك.',
  'Pick a start time.': 'اختر وقت البدء.',
  'Lessons are 5 to 30 minutes.': 'مدة الدرس من 5 إلى 30 دقيقة.',
  'Each part of the plan needs 1 to 30 minutes.': 'يحتاج كل جزء من الخطة من 1 إلى 30 دقيقة.',
  'Expected JSON.': 'صيغة الطلب غير صحيحة.',
  'That request was not valid JSON.': 'صيغة الطلب غير صحيحة.',
  '{field} is required.': '{field} مطلوب.',
  '{field} is too long ({max} characters max).': '{field} طويل جدًا (الحد الأقصى {max} حرفًا).',
  'That email address does not look right.': 'يبدو أن البريد الإلكتروني غير صحيح.',
  'Your password needs at least 8 characters.': 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
  'That password is too long.': 'كلمة المرور طويلة جدًا.',
  'That photo could not be read. Try a JPEG or PNG.': 'تعذّرت قراءة الصورة. جرّب JPEG أو PNG.',
  'That photo is too big. Try a smaller one.': 'الصورة كبيرة جدًا. جرّب صورة أصغر.',
  'That class link does not look like a web address. It should start with https://': 'رابط الدرس لا يبدو عنوان ويب. يجب أن يبدأ بـ https://',
  'Class links need to start with https://': 'يجب أن يبدأ رابط الدرس بـ https://',
  'Something went wrong on our side. Please try again.': 'حدث خطأ من جهتنا. حاول مرة أخرى.',
  "Password reset isn't set up yet.": 'استعادة كلمة المرور غير مفعّلة بعد.',
  'This reset link has expired or was already used. Ask for a new one.': 'انتهت صلاحية هذا الرابط أو سبق استخدامه. اطلب رابطًا جديدًا.',
  "We couldn't send the email right now. Please try again in a few minutes.": 'تعذّر إرسال الرسالة الآن. حاول مرة أخرى بعد دقائق.',
  'Join or create a club first.': 'انضم إلى نادٍ أو أنشئ واحدًا أولًا.',
  "We couldn't find that club.": 'لم نجد هذا النادي.',
  "That invite link doesn't work anymore. Ask for a new one.": 'رابط الدعوة هذا لم يعد يعمل. اطلب رابطًا جديدًا.',
  'Only club admins can do that.': 'هذا متاح لمشرفي النادي فقط.',
  "You're the only admin. Make someone else an admin first.": 'أنت المشرف الوحيد. اجعل شخصًا آخر مشرفًا أولًا.',
  'A lesson can have up to 4 photos.': 'يمكن إضافة 4 صور كحد أقصى لكل درس.',
  "That wish is already being taught.": 'هذه الأمنية يعلّمها شخص ما بالفعل.',
  'Pick a reason.': 'اختر سببًا.',
  "That password isn't right.": 'كلمة المرور غير صحيحة.',
  "That time zone isn't recognised.": 'لم نتعرّف على المنطقة الزمنية.',
  'You can only follow up your own lessons.': 'يمكنك إضافة جزء ثانٍ لدروسك فقط.',
  'Slow down a little. Try again in a few minutes.': 'تمهّل قليلًا. حاول مرة أخرى بعد دقائق.',
  "Please confirm you're 18 or older and agree to the community rules.": 'يُرجى تأكيد أن عمرك 18 عامًا أو أكثر وموافقتك على قواعد المجتمع.',
  "We couldn't check that you're human. Please try again.": 'تعذّر التحقق من أنك إنسان. حاول مرة أخرى.',
  'This account has been suspended.': 'تم إيقاف هذا الحساب.',
  "New accounts can't add links yet. Try again in a few days.": 'لا يمكن للحسابات الجديدة إضافة روابط بعد. حاول مرة أخرى بعد أيام.',
  'Add the place and area for an in-person lesson.': 'أضف المكان والمنطقة للدرس الحضوري.',
  'Please confirm it is a public place.': 'يُرجى تأكيد أن المكان عام.',
  'Pick how the lesson happens.': 'اختر طريقة إقامة الدرس.',
  'Only the site owner can do that.': 'هذا متاح لمالك الموقع فقط.',
  "That map link doesn't look right.": 'رابط الخريطة لا يبدو صحيحًا.',
  "You can't follow yourself.": 'لا يمكنك متابعة نفسك.',
  "You can't do that to yourself.": 'لا يمكنك فعل ذلك مع نفسك.',
  'That lesson is full. You are on the waitlist.': 'الدرس ممتلئ. أنت على قائمة الانتظار.'
};

const AR_FIELDS = {
  'Your name': 'الاسم', Name: 'الاسم', 'What you are good at': 'ما تجيده', 'Your note': 'رسالتك', 'Your answer': 'إجابتك',
  'Plan step': 'جزء الخطة', 'Plan hint': 'تلميح الخطة', 'Plan note': 'ملاحظة الخطة', Title: 'العنوان', Pitch: 'الوصف',
  'Prep note': 'ملاحظة التحضير', 'Class link': 'رابط الدرس', 'Club name': 'اسم النادي', Wish: 'الأمنية', Details: 'التفاصيل',
  Question: 'السؤال', Reply: 'الرد', Recap: 'الملخّص', 'Report details': 'تفاصيل البلاغ',
  Place: 'المكان', Area: 'المنطقة', 'Material title': 'عنوان المادة', 'Material link': 'رابط المادة', 'Teacher notes': 'ملاحظات المقدّم'
};

export function messageFor(err, request) {
  const ar = request.headers.get('x-lang') === 'ar';
  const vars = { ...err.vars };
  if (ar && vars.field) vars.field = AR_FIELDS[vars.field] || vars.field;
  const template = (ar && AR[err.message]) || err.message;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

// ---------- input checks ----------

export async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new HttpError(415, 'Expected JSON.');
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('not an object');
    return body;
  } catch {
    throw new HttpError(400, 'That request was not valid JSON.');
  }
}

export function text(value, field, { max, required = false }) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && !s) throw new HttpError(400, '{field} is required.', { field });
  if (s.length > max) throw new HttpError(400, '{field} is too long ({max} characters max).', { field, max });
  return s;
}

export function emailOf(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 200) throw new HttpError(400, 'That email address does not look right.');
  return s;
}

export function passwordOf(value) {
  const s = typeof value === 'string' ? value : '';
  if (s.length < 8) throw new HttpError(400, 'Your password needs at least 8 characters.');
  if (s.length > 200) throw new HttpError(400, 'That password is too long.');
  return s;
}

// undefined = leave the photo alone, null = remove it, string = a new photo
export function imageOf(value, maxLength = 400000) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    throw new HttpError(400, 'That photo could not be read. Try a JPEG or PNG.');
  }
  if (value.length > maxLength) throw new HttpError(400, 'That photo is too big. Try a smaller one.');
  return value;
}

export function imageResponse(dataUrl) {
  const m = dataUrl && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) throw new HttpError(404, 'No photo.');
  return new Response(unb64(m[2]), { headers: { 'content-type': m[1], 'cache-control': 'private, max-age=31536000, immutable' } });
}

export function linkOf(value) {
  const s = text(value, 'Class link', { max: 500 });
  if (!s) return '';
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new HttpError(400, 'That class link does not look like a web address. It should start with https://');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new HttpError(400, 'Class links need to start with https://');
  return u.href;
}

export function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const isId = (s) => typeof s === 'string' && /^[1-9]\d{0,9}$/.test(s);

export function parseJson(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

// ---------- time zones ----------

export function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(utcMs, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(utcMs));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - utcMs;
}

// "2026-10-21" + "19:00" in Asia/Riyadh -> UTC milliseconds
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(first, tz);
}

// ---------- passwords & tokens ----------

export const PBKDF2_ITERATIONS = 100000; // the Workers runtime caps PBKDF2 at 100k
const enc = new TextEncoder();

export async function pbkdf2(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt))}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, iterations, salt, hash] = String(stored).split('$');
  if (scheme !== 'pbkdf2') return false;
  const got = await pbkdf2(password, unb64(salt), Number(iterations));
  const want = unb64(hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

export async function sha256(str) {
  return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(str))));
}

export function b64(bytes) {
  let s = '';
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s);
}

export const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

export function randomCode(length = 10) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export function unb64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// ---------- sessions ----------

const SESSION_COOKIE = 'tc_session';
const SESSION_DAYS = 30;

export const USER_COLS = 'id, name, email, bio, photo_v, created_at, (photo IS NOT NULL) AS has_photo, current_club_id, lang, tz, email_reminders, interests, approve_followers, banned';

export function readCookie(request) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === SESSION_COOKIE) return part.slice(i + 1).trim() || null;
  }
  return null;
}

export function sessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function createSession(env, userId) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, Date.now() + SESSION_DAYS * 864e5).run();
  return sessionCookie(token, SESSION_DAYS * 86400);
}

export async function currentUser(request, env) {
  const token = readCookie(request);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT ${USER_COLS.split(', ').map((c) => (c.startsWith('(') ? '(u.photo IS NOT NULL) AS has_photo' : 'u.' + c)).join(', ')}
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.banned = 0`
  ).bind(await sha256(token), Date.now()).first();
}

// ---------- how members look to the app ----------

export function userCols(alias, prefix) {
  return ['id', 'name', 'bio', 'photo_v', 'created_at']
    .map((c) => `${alias}.${c} AS ${prefix}${c}`)
    .concat(`(${alias}.photo IS NOT NULL) AS ${prefix}has_photo`)
    .join(', ');
}

export function userFrom(row, prefix) {
  return publicUser({
    id: row[prefix + 'id'],
    name: row[prefix + 'name'],
    bio: row[prefix + 'bio'],
    photo_v: row[prefix + 'photo_v'],
    created_at: row[prefix + 'created_at'],
    has_photo: row[prefix + 'has_photo']
  });
}

export function publicUser(u) {
  const parts = u.name.trim().split(/\s+/).filter(Boolean);
  return {
    id: u.id,
    name: u.name,
    firstName: parts[0] || u.name,
    initials: parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?',
    color: u.id % 7,
    bio: u.bio || '',
    photo: u.has_photo ? `/api/users/${u.id}/photo?v=${u.photo_v}` : null,
    memberSince: u.created_at
  };
}

export function selfUser(u) {
  return {
    ...publicUser(u), email: u.email, lang: u.lang, tz: u.tz, emailReminders: !!u.email_reminders,
    interests: parseJson(u.interests, []), approveFollowers: !!u.approve_followers
  };
}

// ---------- clubs ----------

// The member's current club ({ id, name, role }), repairing the pointer if they've left it.
export async function currentClub(env, me) {
  if (me.current_club_id) {
    const club = await env.DB.prepare(
      'SELECT c.id, c.name, m.role FROM clubs c JOIN club_members m ON m.club_id = c.id AND m.user_id = ? WHERE c.id = ?'
    ).bind(me.id, me.current_club_id).first();
    if (club) return club;
  }
  const club = await env.DB.prepare(
    'SELECT c.id, c.name, m.role FROM club_members m JOIN clubs c ON c.id = m.club_id WHERE m.user_id = ? ORDER BY m.joined_at LIMIT 1'
  ).bind(me.id).first();
  await env.DB.prepare('UPDATE users SET current_club_id = ? WHERE id = ?').bind(club ? club.id : null, me.id).run();
  me.current_club_id = club ? club.id : null;
  return club || null;
}

export async function requireClub(env, me) {
  const club = await currentClub(env, me);
  if (!club) throw new HttpError(412, 'Join or create a club first.'); // 412 = "no club yet" (the app sends you to /clubs/start)
  return club;
}

export async function roleIn(env, userId, clubId) {
  const row = await env.DB.prepare('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?').bind(clubId, userId).first();
  return row ? row.role : null;
}

// True when two members share at least one club (needed to see each other's profile).
export async function shareClub(env, a, b) {
  if (a === b) return true;
  const row = await env.DB.prepare(
    'SELECT 1 FROM club_members x JOIN club_members y ON y.club_id = x.club_id WHERE x.user_id = ? AND y.user_id = ? LIMIT 1'
  ).bind(a, b).first();
  return !!row;
}

// ---------- safety ----------

export const TOPICS = ['cooking', 'tech', 'languages', 'art', 'music', 'science', 'sports', 'health', 'money', 'books', 'games', 'crafts', 'travel', 'career', 'history', 'nature'];

export const clientIp = (request) => request.headers.get('cf-connecting-ip') || 'local';

// Allows at most `max` actions per `seconds` for a key (an IP address or a member). Throws 429 above that.
export async function rateLimit(env, key, max, seconds) {
  const bucket = Math.floor(Date.now() / 1000 / seconds) * seconds;
  const row = await env.DB.prepare(
    'INSERT INTO rate_limits (key, bucket, count) VALUES (?, ?, 1) ON CONFLICT (key, bucket) DO UPDATE SET count = count + 1 RETURNING count'
  ).bind(key, bucket).first();
  if (row.count > max) throw new HttpError(429, 'Slow down a little. Try again in a few minutes.');
}

// Cloudflare Turnstile: the free, mostly invisible "are you human?" check. Skipped until the secret is set.
export async function verifyHuman(env, request, token) {
  if (!env.TURNSTILE_SECRET || !env.TURNSTILE_SITE_KEY) return; // only on once both keys are in place
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', String(token || ''));
  form.append('remoteip', clientIp(request));
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    if (data.success) return;
  } catch (err) {
    console.error('turnstile', err);
  }
  throw new HttpError(400, "We couldn't check that you're human. Please try again.");
}

// The site owner (set OWNER_EMAILS in wrangler.jsonc) can review reports from every club and suspend accounts.
export function isOwner(env, me) {
  const list = String(env.OWNER_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  return !!me && list.includes(String(me.email).toLowerCase());
}

export function requireOwner(env, me) {
  if (!isOwner(env, me)) throw new HttpError(403, 'Only the site owner can do that.');
}

// Accounts younger than 3 days get stricter limits (stops throwaway spam accounts).
export const isNewAccount = (me) => Date.now() - new Date(String(me.created_at).replace(' ', 'T') + 'Z').getTime() < 3 * 864e5;
export const hasLink = (s) => /https?:\/\/|www\.|\.(com|net|org|io|sa|me|ly)\b/i.test(String(s || ''));

export async function blockedBetween(env, a, b) {
  if (a === b) return false;
  const row = await env.DB.prepare(
    'SELECT 1 FROM blocks WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1) LIMIT 1'
  ).bind(a, b).first();
  return !!row;
}