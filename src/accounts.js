// Accounts: sign up, log in/out, your settings, deleting your account, password resets,
// and member profiles (with badges, follows and blocks).

import {
  HttpError, json, readJson, text, emailOf, passwordOf, imageOf, imageResponse, validTz,
  hashPassword, verifyPassword, pbkdf2, sha256, randomToken, createSession, sessionCookie, readCookie,
  USER_COLS, userCols, userFrom, publicUser, selfUser, currentClub, parseJson,
  TOPICS, clientIp, rateLimit, verifyHuman, isOwner, blockedBetween
} from './lib.js';
import { canEmail, sendResetEmail } from './email.js';
import { unreadCount, GROUPS } from './notify.js';

export const LESSON_COLS = 'l.id, l.title, l.pitch, l.format, l.date, l.time, l.length, l.tz, l.starts_at, l.mode, l.area, l.visibility, l.tags, l.archived';

export function lessonBasics(r) {
  return {
    id: r.id, title: r.title, pitch: r.pitch, format: r.format, date: r.date, time: r.time, length: r.length, tz: r.tz, startsAt: r.starts_at,
    mode: r.mode || 'online', area: r.area || '', visibility: r.visibility || 'club', tags: parseJson(r.tags, []), archived: !!r.archived
  };
}

// SQL: lesson "l" can be seen by member ?1. Your own lessons always; others' when they're not hidden or
// archived, nobody has blocked anybody, and you're in the lesson's club or follow a teacher who shared it
// with followers.
export const VISIBLE = `(l.host_id = ?1 OR (l.archived = 0 AND l.hidden = 0
  AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = l.host_id AND b.blocked_id = ?1) OR (b.blocker_id = ?1 AND b.blocked_id = l.host_id))
  AND (l.club_id IN (SELECT club_id FROM club_members WHERE user_id = ?1)
       OR (l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = l.host_id AND f.status = 'accepted')))))`;

const prefsOf = (request) => {
  const lang = request.headers.get('x-lang') === 'ar' ? 'ar' : 'en';
  const tz = request.headers.get('x-tz');
  return { lang, tz: validTz(tz) ? tz : 'Asia/Riyadh' };
};

const topicsOf = (list, max) => [...new Set((Array.isArray(list) ? list : []).filter((t) => TOPICS.includes(t)))].slice(0, max);

export async function signup(request, env) {
  const b = await readJson(request);
  await rateLimit(env, `signup:${clientIp(request)}`, 5, 3600);
  if (b.agree !== true) throw new HttpError(400, "Please confirm you're 18 or older and agree to the community rules.");
  await verifyHuman(env, request, b.turnstile);
  const name = text(b.name, 'Your name', { max: 60, required: true });
  const email = emailOf(b.email);
  const password = passwordOf(b.password);
  const bio = text(b.bio, 'What you are good at', { max: 160 });
  const photo = imageOf(b.photo, 300000) ?? null;
  const { lang, tz } = prefsOf(request);

  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first();
  if (taken) throw new HttpError(409, 'There is already an account with that email. Try logging in.');

  let row;
  try {
    row = await env.DB.prepare(
      `INSERT INTO users (name, email, password_hash, bio, photo, lang, tz, agreed_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) RETURNING ${USER_COLS}`
    ).bind(name, email, await hashPassword(password), bio, photo, lang, tz).first();
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) throw new HttpError(409, 'There is already an account with that email. Try logging in.');
    throw err;
  }
  return json({ user: selfUser(row), club: null, owner: isOwner(env, row) }, 201, { 'set-cookie': await createSession(env, row.id) });
}

export async function login(request, env) {
  const b = await readJson(request);
  const email = String(b.email || '').trim().toLowerCase();
  await rateLimit(env, `login:${clientIp(request)}`, 20, 900);
  if (email) await rateLimit(env, `login:${email}`, 10, 900);
  const password = typeof b.password === 'string' ? b.password : '';
  const row = email ? await env.DB.prepare(`SELECT ${USER_COLS}, password_hash FROM users WHERE email = ?`).bind(email).first() : null;
  // Do the same amount of work for unknown emails so response time doesn't reveal who has an account.
  const ok = row ? await verifyPassword(password, row.password_hash) : (await pbkdf2(password, new Uint8Array(16)), false);
  if (!ok) throw new HttpError(400, "That email and password don't match.");
  if (row.banned) throw new HttpError(403, 'This account has been suspended.');
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(row.id, Date.now()).run();
  return json({ user: selfUser(row), club: await currentClub(env, row), owner: isOwner(env, row) }, 200, { 'set-cookie': await createSession(env, row.id) });
}

export async function logout(request, env) {
  const token = readCookie(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

export async function getMe(request, env, me) {
  // Keep the language and time zone used for emails in step with the member's device.
  const { lang, tz } = prefsOf(request);
  if (lang !== me.lang || (request.headers.get('x-tz') && tz !== me.tz)) {
    await env.DB.prepare('UPDATE users SET lang = ?, tz = ? WHERE id = ?').bind(lang, tz, me.id).run();
    me.lang = lang;
    me.tz = tz;
  }
  const [requests, following, blocked] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE followee_id = ? AND status = 'pending'").bind(me.id),
    env.DB.prepare('SELECT followee_id AS id, status FROM follows WHERE follower_id = ?').bind(me.id),
    env.DB.prepare('SELECT blocked_id AS id FROM blocks WHERE blocker_id = ?1 UNION SELECT blocker_id FROM blocks WHERE blocked_id = ?1').bind(me.id)
  ]);
  return json({
    user: selfUser(me), club: await currentClub(env, me), owner: isOwner(env, me), followRequests: requests.results[0].n,
    // For the quick-follow ➕ on avatars: who you already follow (or asked to), and who to never offer.
    following: following.results.filter((r) => r.status === 'accepted').map((r) => r.id),
    requested: following.results.filter((r) => r.status === 'pending').map((r) => r.id),
    blocked: blocked.results.map((r) => r.id),
    unread: await unreadCount(env, me)
  });
}

export async function updateMe(request, env, me) {
  const b = await readJson(request);
  const name = text(b.name, 'Name', { max: 60, required: true });
  const bio = text(b.bio, 'What you are good at', { max: 160 });
  const email = emailOf(b.email);
  const photo = imageOf(b.photo, 300000);
  const reminders = b.emailReminders === undefined ? me.email_reminders : (b.emailReminders ? 1 : 0);
  const approve = b.approveFollowers === undefined ? me.approve_followers : (b.approveFollowers ? 1 : 0);
  const interests = b.interests === undefined ? me.interests : JSON.stringify(topicsOf(b.interests, 8));
  const notifyOff = b.notifyOff === undefined ? me.notify_off
    : JSON.stringify([...new Set((Array.isArray(b.notifyOff) ? b.notifyOff : []).filter((g) => GROUPS.includes(g)))]);

  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').bind(email, me.id).first();
  if (taken) throw new HttpError(409, 'Another member already uses that email.');

  const set = 'name = ?, bio = ?, email = ?, email_reminders = ?, approve_followers = ?, interests = ?, notify_off = ?';
  const row = photo === undefined
    ? await env.DB.prepare(`UPDATE users SET ${set} WHERE id = ? RETURNING ${USER_COLS}`)
      .bind(name, bio, email, reminders, approve, interests, notifyOff, me.id).first()
    : await env.DB.prepare(`UPDATE users SET ${set}, photo = ?, photo_v = photo_v + 1 WHERE id = ? RETURNING ${USER_COLS}`)
      .bind(name, bio, email, reminders, approve, interests, notifyOff, photo, me.id).first();
  // Turning approval off lets everyone who was waiting in.
  if (!approve) await env.DB.prepare("UPDATE follows SET status = 'accepted' WHERE followee_id = ? AND status = 'pending'").bind(me.id).run();
  return json({ user: selfUser(row) });
}

// Deleting an account removes everything the member made. Clubs they ran get a new admin.
export async function deleteMe(request, env, me) {
  const b = await readJson(request);
  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(me.id).first();
  if (!(await verifyPassword(typeof b.password === 'string' ? b.password : '', row.password_hash))) {
    throw new HttpError(400, "That password isn't right.");
  }
  const { results: clubs } = await env.DB.prepare(
    `SELECT m.club_id,
       (SELECT COUNT(*) FROM club_members o WHERE o.club_id = m.club_id AND o.user_id != ? AND o.role = 'admin') AS other_admins,
       (SELECT o.user_id FROM club_members o WHERE o.club_id = m.club_id AND o.user_id != ? ORDER BY o.joined_at LIMIT 1) AS successor
     FROM club_members m WHERE m.user_id = ?`
  ).bind(me.id, me.id, me.id).all();
  const steps = [];
  for (const c of clubs) {
    if (!c.successor) steps.push(env.DB.prepare('DELETE FROM clubs WHERE id = ?').bind(c.club_id));
    else if (!c.other_admins) steps.push(env.DB.prepare("UPDATE club_members SET role = 'admin' WHERE club_id = ? AND user_id = ?").bind(c.club_id, c.successor));
  }
  steps.push(env.DB.prepare('DELETE FROM users WHERE id = ?').bind(me.id));
  await env.DB.batch(steps);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

// ---------- forgotten passwords ----------

const RESET_MINUTES = 60;
const RESET_COOLDOWN_MS = 2 * 60 * 1000; // at most one email per person every 2 minutes

// Always answers the same way whether or not the email has an account.
export async function forgot(request, env, url) {
  if (!canEmail(env)) throw new HttpError(503, "Password reset isn't set up yet.");
  const b = await readJson(request);
  await rateLimit(env, `forgot:${clientIp(request)}`, 5, 3600);
  await verifyHuman(env, request, b.turnstile);
  const email = emailOf(b.email);
  const user = await env.DB.prepare('SELECT id, name, email FROM users WHERE email = ? AND banned = 0').bind(email).first();
  if (user) {
    const now = Date.now();
    const recent = await env.DB.prepare('SELECT 1 FROM password_resets WHERE user_id = ? AND created_at > ?').bind(user.id, now - RESET_COOLDOWN_MS).first();
    if (!recent) {
      const token = randomToken();
      await env.DB.batch([
        env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id),
        env.DB.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
          .bind(await sha256(token), user.id, now + RESET_MINUTES * 60000, now)
      ]);
      await sendResetEmail(env, user, `${url.origin}/reset?token=${token}`, request.headers.get('x-lang') === 'ar', RESET_MINUTES);
    }
  }
  return json({ ok: true });
}

export async function resetPassword(request, env) {
  const b = await readJson(request);
  await rateLimit(env, `reset:${clientIp(request)}`, 10, 3600);
  const token = typeof b.token === 'string' ? b.token : '';
  const password = passwordOf(b.password);
  const row = token
    ? await env.DB.prepare('SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?').bind(await sha256(token), Date.now()).first()
    : null;
  if (!row) throw new HttpError(400, 'This reset link has expired or was already used. Ask for a new one.');
  // New password, link used up, and every old log-in signed out.
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), row.user_id),
    env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(row.user_id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id)
  ]);
  const user = await env.DB.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).bind(row.user_id).first();
  if (user.banned) throw new HttpError(403, 'This account has been suspended.');
  return json({ user: selfUser(user), club: await currentClub(env, user), owner: isOwner(env, user) }, 200, { 'set-cookie': await createSession(env, user.id) });
}

// ---------- profiles ----------

const BADGES = ['first_lesson', 'five_lessons', 'all_formats', 'regular', 'thanks_magnet', 'night_owl', 'early_bird', 'curious', 'wish_granter', 'sequel'];

async function badgesFor(env, id) {
  const now = Date.now();
  const r = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM lessons WHERE host_id = ?1 AND starts_at + length * 60000 <= ?2) AS taught,
       (SELECT COUNT(DISTINCT format) FROM lessons WHERE host_id = ?1 AND starts_at + length * 60000 <= ?2) AS formats,
       (SELECT COUNT(*) FROM rsvps r JOIN lessons l ON l.id = r.lesson_id WHERE r.user_id = ?1 AND r.waitlist = 0 AND l.starts_at + l.length * 60000 <= ?2) AS attended,
       (SELECT COUNT(*) FROM notes n JOIN lessons l ON l.id = n.lesson_id WHERE l.host_id = ?1) AS thanks,
       (SELECT COUNT(*) FROM lessons WHERE host_id = ?1 AND starts_at <= ?2 AND time >= '22:00') AS late,
       (SELECT COUNT(*) FROM lessons WHERE host_id = ?1 AND starts_at <= ?2 AND time < '08:00') AS early,
       (SELECT COUNT(*) FROM questions WHERE user_id = ?1) AS asked,
       (SELECT COUNT(*) FROM wishes w JOIN lessons l ON l.id = w.lesson_id WHERE l.host_id = ?1) AS granted,
       (SELECT COUNT(*) FROM lessons WHERE host_id = ?1 AND parent_id IS NOT NULL) AS sequels`
  ).bind(id, now).first();
  const earned = {
    first_lesson: r.taught >= 1, five_lessons: r.taught >= 5, all_formats: r.formats >= 5, regular: r.attended >= 5,
    thanks_magnet: r.thanks >= 10, night_owl: r.late >= 1, early_bird: r.early >= 1, curious: r.asked >= 3,
    wish_granter: r.granted >= 1, sequel: r.sequels >= 1
  };
  return BADGES.map((key) => ({ key, earned: earned[key] }));
}

export async function getProfile(env, me, id) {
  const owner = isOwner(env, me);
  const user = await env.DB.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).bind(id).first();
  const blockedMe = user && id !== me.id
    ? await env.DB.prepare('SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?').bind(id, me.id).first()
    : null;
  if (!user || (blockedMe && !owner) || (user.banned && !owner)) throw new HttpError(404, "We couldn't find that member.");
  const [hosted, archived, attended, notes, thanks, follow, counts, blocked] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${LESSON_COLS},
        (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id AND r.waitlist = 0) AS going_count,
        (SELECT COUNT(*) FROM notes n WHERE n.lesson_id = l.id) AS notes_count
       FROM lessons l WHERE l.host_id = ?2 AND l.archived = 0 AND ${VISIBLE} ORDER BY l.starts_at DESC LIMIT 200`
    ).bind(me.id, id),
    env.DB.prepare(
      `SELECT ${LESSON_COLS}, 0 AS going_count, 0 AS notes_count FROM lessons l WHERE l.host_id = ?1 AND ?1 = ?2 AND l.archived = 1 ORDER BY l.starts_at DESC LIMIT 200`
    ).bind(me.id, id),
    env.DB.prepare(
      `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')}
       FROM rsvps r JOIN lessons l ON l.id = r.lesson_id JOIN users h ON h.id = l.host_id
       WHERE r.user_id = ?2 AND r.waitlist = 0 AND l.archived = 0 AND ${VISIBLE} ORDER BY l.starts_at DESC LIMIT 200`
    ).bind(me.id, id),
    env.DB.prepare(
      `SELECT n.reactions, n.body, n.created_at AS note_at, l.id AS lesson_id, l.title AS lesson_title, ${userCols('a', 'a_')}
       FROM notes n JOIN lessons l ON l.id = n.lesson_id JOIN users a ON a.id = n.user_id
       WHERE l.host_id = ?2 AND ${VISIBLE} ORDER BY n.created_at DESC LIMIT 30`
    ).bind(me.id, id),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM notes n JOIN lessons l ON l.id = n.lesson_id WHERE l.host_id = ?2 AND ${VISIBLE}`).bind(me.id, id),
    env.DB.prepare('SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, id),
    env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND status = 'accepted') AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND status = 'accepted') AS following`
    ).bind(id),
    env.DB.prepare('SELECT 1 AS b FROM blocks WHERE blocker_id = ? AND blocked_id = ?').bind(me.id, id)
  ]);
  const isMe = user.id === me.id;
  const shape = (r) => ({ ...lessonBasics(r), goingCount: r.going_count, notesCount: r.notes_count });
  return json({
    user: isMe ? selfUser(user) : publicUser(user),
    isMe,
    hosted: hosted.results.map(shape),
    archivedLessons: archived.results.map(shape),
    attended: attended.results.map((r) => ({ ...lessonBasics(r), host: userFrom(r, 'h_') })),
    notes: notes.results.map((r) => ({
      author: userFrom(r, 'a_'),
      lesson: { id: r.lesson_id, title: r.lesson_title },
      reactions: parseJson(r.reactions, []),
      body: r.body,
      at: r.note_at
    })),
    thanksCount: thanks.results[0]?.n ?? 0,
    badges: await badgesFor(env, id),
    follow: follow.results[0]?.status || null,
    followers: counts.results[0].followers,
    following: counts.results[0].following,
    blockedByMe: !!blocked.results[0],
    interests: parseJson(user.interests, []),
    banned: !!user.banned
  });
}

export async function getUserPhoto(env, me, id) {
  if (await blockedBetween(env, me.id, id)) throw new HttpError(404, 'No photo.');
  const row = await env.DB.prepare('SELECT photo FROM users WHERE id = ?').bind(id).first();
  return imageResponse(row && row.photo);
}

export { publicUser };
