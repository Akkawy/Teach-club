// Teach Club API. Runs on Cloudflare Workers; data lives in D1 (env.DB).
// Every request that isn't /api/* is served from ./public by the assets binding.

const SESSION_COOKIE = 'tc_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // the Workers runtime caps PBKDF2 at 100k
const FORMATS = ['talk', 'demo', 'disc', 'show', 'read'];
const LENGTHS = [5, 10, 15, 20, 25, 30];
const REACTIONS = ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'];

const USER_COLS = 'id, name, email, bio, photo_v, created_at, (photo IS NOT NULL) AS has_photo';
const LESSON_COLS = 'l.id, l.title, l.pitch, l.format, l.date, l.time, l.length';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong on our side. Please try again.' }, 500);
    }
  }
};

async function route(request, env, url) {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) throw new HttpError(403, 'Blocked a cross-site request.');
  }
  const [a, b, c, extra] = url.pathname.replace(/\/+$/, '').split('/').slice(2);
  if (extra !== undefined) throw new HttpError(404, 'Not found.');

  if (a === 'signup' && !b && method === 'POST') return signup(request, env);
  if (a === 'login' && !b && method === 'POST') return login(request, env);
  if (a === 'logout' && !b && method === 'POST') return logout(request, env);

  const me = await currentUser(request, env);
  if (!me) throw new HttpError(401, 'Please log in first.');

  if (a === 'me' && !b) {
    if (method === 'GET') return json({ user: selfUser(me) });
    if (method === 'PUT') return updateMe(request, env, me);
  }
  if (a === 'users' && isId(b)) {
    if (!c && method === 'GET') return getProfile(env, me, Number(b));
    if (c === 'photo' && method === 'GET') return getPhoto(env, Number(b));
  }
  if (a === 'lessons') {
    if (!b) {
      if (method === 'GET') return listLessons(env, me, url);
      if (method === 'POST') return createLesson(request, env, me);
    } else if (isId(b)) {
      const id = Number(b);
      if (!c) {
        if (method === 'GET') return getLesson(env, me, id);
        if (method === 'PUT') return updateLesson(request, env, me, id);
        if (method === 'DELETE') return deleteLesson(env, me, id);
      }
      if (c === 'rsvp' && method === 'POST') return setRsvp(env, me, id, true);
      if (c === 'rsvp' && method === 'DELETE') return setRsvp(env, me, id, false);
      if (c === 'note' && method === 'PUT') return saveNote(request, env, me, id);
    }
  }
  throw new HttpError(404, 'Not found.');
}

// ---------- accounts ----------

async function signup(request, env) {
  const b = await readJson(request);
  const name = text(b.name, 'Your name', { max: 60, required: true });
  const email = emailOf(b.email);
  const password = passwordOf(b.password);
  const bio = text(b.bio, 'What you are good at', { max: 160 });
  const photo = photoOf(b.photo) ?? null;

  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first();
  if (taken) throw new HttpError(409, 'There is already an account with that email. Try logging in.');

  let row;
  try {
    row = await env.DB.prepare(
      `INSERT INTO users (name, email, password_hash, bio, photo) VALUES (?, ?, ?, ?, ?) RETURNING ${USER_COLS}`
    ).bind(name, email, await hashPassword(password), bio, photo).first();
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) throw new HttpError(409, 'There is already an account with that email. Try logging in.');
    throw err;
  }
  return json({ user: selfUser(row) }, 201, { 'set-cookie': await createSession(env, row.id) });
}

async function login(request, env) {
  const b = await readJson(request);
  const email = String(b.email || '').trim().toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const row = email
    ? await env.DB.prepare(`SELECT ${USER_COLS}, password_hash FROM users WHERE email = ?`).bind(email).first()
    : null;
  // Do the same amount of work for unknown emails so response time doesn't reveal who has an account.
  const ok = row ? await verifyPassword(password, row.password_hash) : (await pbkdf2(password, new Uint8Array(16)), false);
  if (!ok) throw new HttpError(400, "That email and password don't match.");
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(row.id, Date.now()).run();
  return json({ user: selfUser(row) }, 200, { 'set-cookie': await createSession(env, row.id) });
}

async function logout(request, env) {
  const token = readCookie(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

async function updateMe(request, env, me) {
  const b = await readJson(request);
  const name = text(b.name, 'Name', { max: 60, required: true });
  const bio = text(b.bio, 'What you are good at', { max: 160 });
  const email = emailOf(b.email);
  const photo = photoOf(b.photo);

  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').bind(email, me.id).first();
  if (taken) throw new HttpError(409, 'Another member already uses that email.');

  const row = photo === undefined
    ? await env.DB.prepare(`UPDATE users SET name = ?, bio = ?, email = ? WHERE id = ? RETURNING ${USER_COLS}`)
      .bind(name, bio, email, me.id).first()
    : await env.DB.prepare(`UPDATE users SET name = ?, bio = ?, email = ?, photo = ?, photo_v = photo_v + 1 WHERE id = ? RETURNING ${USER_COLS}`)
      .bind(name, bio, email, photo, me.id).first();
  return json({ user: selfUser(row) });
}

async function getProfile(env, me, id) {
  const user = await env.DB.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).bind(id).first();
  if (!user) throw new HttpError(404, "We couldn't find that member.");
  const [hosted, attended, notes, thanks] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${LESSON_COLS},
        (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id) AS going_count,
        (SELECT COUNT(*) FROM notes n WHERE n.lesson_id = l.id) AS notes_count
       FROM lessons l WHERE l.host_id = ? ORDER BY l.date DESC, l.time DESC LIMIT 200`
    ).bind(id),
    env.DB.prepare(
      `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')}
       FROM rsvps r JOIN lessons l ON l.id = r.lesson_id JOIN users h ON h.id = l.host_id
       WHERE r.user_id = ? ORDER BY l.date DESC, l.time DESC LIMIT 200`
    ).bind(id),
    env.DB.prepare(
      `SELECT n.reactions, n.body, n.created_at AS note_at, l.id AS lesson_id, l.title AS lesson_title, ${userCols('a', 'a_')}
       FROM notes n JOIN lessons l ON l.id = n.lesson_id JOIN users a ON a.id = n.user_id
       WHERE l.host_id = ? ORDER BY n.created_at DESC LIMIT 30`
    ).bind(id),
    env.DB.prepare('SELECT COUNT(*) AS n FROM notes n JOIN lessons l ON l.id = n.lesson_id WHERE l.host_id = ?').bind(id)
  ]);
  return json({
    user: user.id === me.id ? selfUser(user) : publicUser(user),
    isMe: user.id === me.id,
    hosted: hosted.results.map((r) => ({ ...lessonBasics(r), goingCount: r.going_count, notesCount: r.notes_count })),
    attended: attended.results.map((r) => ({ ...lessonBasics(r), host: userFrom(r, 'h_') })),
    notes: notes.results.map((r) => ({
      author: userFrom(r, 'a_'),
      lesson: { id: r.lesson_id, title: r.lesson_title },
      reactions: parseJson(r.reactions, []),
      body: r.body,
      at: r.note_at
    })),
    thanksCount: thanks.results[0]?.n ?? 0
  });
}

async function getPhoto(env, id) {
  const row = await env.DB.prepare('SELECT photo FROM users WHERE id = ?').bind(id).first();
  const m = row && row.photo && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(row.photo);
  if (!m) throw new HttpError(404, 'No photo.');
  return new Response(unb64(m[2]), {
    headers: { 'content-type': m[1], 'cache-control': 'private, max-age=31536000, immutable' }
  });
}

// ---------- lessons ----------

async function listLessons(env, me, url) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!isDate(from) || !isDate(to)) throw new HttpError(400, 'Pick a date range.');
  const { results } = await env.DB.prepare(
    `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')},
      (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id) AS going_count,
      EXISTS (SELECT 1 FROM rsvps r WHERE r.lesson_id = l.id AND r.user_id = ?) AS me_going
     FROM lessons l JOIN users h ON h.id = l.host_id
     WHERE l.date BETWEEN ? AND ? ORDER BY l.date, l.time LIMIT 500`
  ).bind(me.id, from, to).all();
  return json({
    lessons: results.map((r) => ({ ...lessonBasics(r), host: userFrom(r, 'h_'), goingCount: r.going_count, going: !!r.me_going }))
  });
}

async function getLesson(env, me, id) {
  const row = await env.DB.prepare(
    `SELECT l.*, ${userCols('h', 'h_')} FROM lessons l JOIN users h ON h.id = l.host_id WHERE l.id = ?`
  ).bind(id).first();
  if (!row) throw new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");
  const [attendees, notes] = await env.DB.batch([
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM rsvps r JOIN users u ON u.id = r.user_id WHERE r.lesson_id = ? ORDER BY r.created_at`).bind(id),
    env.DB.prepare(
      `SELECT n.reactions, n.body, n.created_at AS note_at, ${userCols('u', 'u_')}
       FROM notes n JOIN users u ON u.id = n.user_id WHERE n.lesson_id = ? ORDER BY n.created_at`
    ).bind(id)
  ]);
  const people = attendees.results.map((r) => userFrom(r, 'u_'));
  const isHost = row.host_id === me.id;
  const going = people.some((u) => u.id === me.id);
  const answers = parseJson(row.answers, []);
  return json({
    lesson: {
      ...lessonBasics(row),
      host: userFrom(row, 'h_'),
      isHost,
      going,
      goingCount: people.length,
      attendees: people,
      surprise: !!row.surprise,
      // A "surprise" outline stays hidden from everyone except the host, enforced here rather than in the browser.
      plan: isHost || !row.surprise ? parseJson(row.plan, []) : null,
      answers: isHost ? answers : null,
      reading: row.format === 'read' ? answers[0] || '' : '',
      prep: row.prep,
      classLink: isHost || going ? row.class_link : '',
      hasClassLink: !!row.class_link,
      notes: notes.results.map((r) => ({
        author: userFrom(r, 'u_'),
        reactions: parseJson(r.reactions, []),
        body: r.body,
        at: r.note_at
      }))
    }
  });
}

async function createLesson(request, env, me) {
  const v = lessonInput(await readJson(request));
  const row = await env.DB.prepare(
    `INSERT INTO lessons (host_id, title, pitch, format, date, time, length, answers, plan, class_link, surprise, prep)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.id, v.title, v.pitch, v.format, v.date, v.time, v.length, JSON.stringify(v.answers), JSON.stringify(v.plan), v.classLink, v.surprise ? 1 : 0, v.prep).first();
  return json({ id: row.id }, 201);
}

async function updateLesson(request, env, me, id) {
  await requireHost(env, me, id);
  const v = lessonInput(await readJson(request));
  await env.DB.prepare(
    `UPDATE lessons SET title = ?, pitch = ?, format = ?, date = ?, time = ?, length = ?, answers = ?, plan = ?, class_link = ?, surprise = ?, prep = ?
     WHERE id = ? AND host_id = ?`
  ).bind(v.title, v.pitch, v.format, v.date, v.time, v.length, JSON.stringify(v.answers), JSON.stringify(v.plan), v.classLink, v.surprise ? 1 : 0, v.prep, id, me.id).run();
  return json({ id });
}

async function deleteLesson(env, me, id) {
  await requireHost(env, me, id);
  await env.DB.prepare('DELETE FROM lessons WHERE id = ? AND host_id = ?').bind(id, me.id).run();
  return json({ ok: true });
}

async function setRsvp(env, me, id, on) {
  const lesson = await findLesson(env, id);
  if (lesson.host_id === me.id) throw new HttpError(400, "You're teaching this one, so you're already in!");
  const sql = on
    ? 'INSERT OR IGNORE INTO rsvps (lesson_id, user_id) VALUES (?, ?)'
    : 'DELETE FROM rsvps WHERE lesson_id = ? AND user_id = ?';
  await env.DB.prepare(sql).bind(id, me.id).run();
  return json({ ok: true });
}

async function saveNote(request, env, me, id) {
  const b = await readJson(request);
  const lesson = await findLesson(env, id);
  if (lesson.host_id === me.id) throw new HttpError(400, "You can't send yourself a thank-you note.");
  const reactions = Array.isArray(b.reactions) ? [...new Set(b.reactions.filter((r) => REACTIONS.includes(r)))] : [];
  const body = text(b.body, 'Your note', { max: 500 });
  if (!reactions.length && !body) throw new HttpError(400, 'Pick a reaction or write a line first.');
  await env.DB.prepare(
    `INSERT INTO notes (lesson_id, user_id, reactions, body) VALUES (?, ?, ?, ?)
     ON CONFLICT (lesson_id, user_id) DO UPDATE SET reactions = excluded.reactions, body = excluded.body`
  ).bind(id, me.id, JSON.stringify(reactions), body).run();
  return json({ ok: true });
}

async function findLesson(env, id) {
  const row = await env.DB.prepare('SELECT host_id FROM lessons WHERE id = ?').bind(id).first();
  if (!row) throw new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");
  return row;
}

async function requireHost(env, me, id) {
  const row = await findLesson(env, id);
  if (row.host_id !== me.id) throw new HttpError(403, 'Only the person teaching can change this lesson.');
}

function lessonInput(b) {
  if (!FORMATS.includes(b.format)) throw new HttpError(400, 'Pick a format for your lesson.');
  if (!isDate(b.date)) throw new HttpError(400, 'Pick a day for your lesson.');
  if (typeof b.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)) throw new HttpError(400, 'Pick a start time.');
  const length = Number(b.length);
  if (!LENGTHS.includes(length)) throw new HttpError(400, 'Lessons are 5 to 30 minutes.');
  const answers = (Array.isArray(b.answers) ? b.answers : []).slice(0, 3).map((a) => text(a, 'Your answer', { max: 500 }));
  const plan = (Array.isArray(b.plan) ? b.plan : []).slice(0, 6).map((p) => {
    p = p || {};
    const min = Number(p.min);
    if (!Number.isInteger(min) || min < 1 || min > 30) throw new HttpError(400, 'Each part of the plan needs 1 to 30 minutes.');
    return {
      name: text(p.name, 'Plan step', { max: 40, required: true }),
      hint: text(p.hint, 'Plan hint', { max: 120 }),
      desc: text(p.desc, 'Plan note', { max: 500 }),
      min
    };
  });
  return {
    format: b.format,
    date: b.date,
    time: b.time,
    length,
    title: text(b.title, 'Title', { max: 60, required: true }),
    pitch: text(b.pitch, 'Pitch', { max: 90 }),
    prep: text(b.prep, 'Prep note', { max: 200 }),
    classLink: linkOf(b.classLink),
    answers,
    plan,
    surprise: !!b.surprise
  };
}

function lessonBasics(r) {
  return { id: r.id, title: r.title, pitch: r.pitch, format: r.format, date: r.date, time: r.time, length: r.length };
}

// ---------- people ----------

function userCols(alias, prefix) {
  return ['id', 'name', 'bio', 'photo_v', 'created_at']
    .map((c) => `${alias}.${c} AS ${prefix}${c}`)
    .concat(`(${alias}.photo IS NOT NULL) AS ${prefix}has_photo`)
    .join(', ');
}

function userFrom(row, prefix) {
  return publicUser({
    id: row[prefix + 'id'],
    name: row[prefix + 'name'],
    bio: row[prefix + 'bio'],
    photo_v: row[prefix + 'photo_v'],
    created_at: row[prefix + 'created_at'],
    has_photo: row[prefix + 'has_photo']
  });
}

function publicUser(u) {
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

function selfUser(u) {
  return { ...publicUser(u), email: u.email };
}

// ---------- sessions & passwords ----------

async function currentUser(request, env) {
  const token = readCookie(request);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.bio, u.photo_v, u.created_at, (u.photo IS NOT NULL) AS has_photo
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(await sha256(token), Date.now()).first();
}

async function createSession(env, userId) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, Date.now() + SESSION_DAYS * 864e5).run();
  return sessionCookie(token, SESSION_DAYS * 86400);
}

function sessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function readCookie(request) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === SESSION_COOKIE) return part.slice(i + 1).trim() || null;
  }
  return null;
}

const enc = new TextEncoder();

async function pbkdf2(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt))}`;
}

async function verifyPassword(password, stored) {
  const [scheme, iterations, salt, hash] = String(stored).split('$');
  if (scheme !== 'pbkdf2') return false;
  const got = await pbkdf2(password, unb64(salt), Number(iterations));
  const want = unb64(hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

async function sha256(str) {
  return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(str))));
}

function b64(bytes) {
  let s = '';
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s);
}

function b64url(bytes) {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// ---------- input checks ----------

async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new HttpError(415, 'Expected JSON.');
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('not an object');
    return body;
  } catch {
    throw new HttpError(400, 'That request was not valid JSON.');
  }
}

function text(value, field, { max, required = false }) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && !s) throw new HttpError(400, `${field} is required.`);
  if (s.length > max) throw new HttpError(400, `${field} is too long (${max} characters max).`);
  return s;
}

function emailOf(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 200) throw new HttpError(400, 'That email address does not look right.');
  return s;
}

function passwordOf(value) {
  const s = typeof value === 'string' ? value : '';
  if (s.length < 8) throw new HttpError(400, 'Your password needs at least 8 characters.');
  if (s.length > 200) throw new HttpError(400, 'That password is too long.');
  return s;
}

// undefined = leave the photo alone, null = remove it, string = a new photo
function photoOf(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    throw new HttpError(400, 'That photo could not be read. Try a JPEG or PNG.');
  }
  if (value.length > 400000) throw new HttpError(400, 'That photo is too big. Try a smaller one.');
  return value;
}

function linkOf(value) {
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

function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isId(s) {
  return typeof s === 'string' && /^[1-9]\d{0,9}$/.test(s);
}

function parseJson(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}
