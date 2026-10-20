// Following people (one-way, with optional approval), blocking, and the site owner's moderation tools.

import { HttpError, json, userCols, userFrom, rateLimit, blockedBetween, requireOwner } from './lib.js';

export async function follow(env, me, id) {
  if (id === me.id) throw new HttpError(400, "You can't follow yourself.");
  await rateLimit(env, `follow:${me.id}`, 100, 86400);
  const target = await env.DB.prepare('SELECT approve_followers FROM users WHERE id = ? AND banned = 0').bind(id).first();
  if (!target || (await blockedBetween(env, me.id, id))) throw new HttpError(404, "We couldn't find that member.");
  const status = target.approve_followers ? 'pending' : 'accepted';
  await env.DB.prepare('INSERT OR IGNORE INTO follows (follower_id, followee_id, status) VALUES (?, ?, ?)').bind(me.id, id, status).run();
  const row = await env.DB.prepare('SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, id).first();
  return json({ follow: row.status });
}

export async function unfollow(env, me, id) {
  await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, id).run();
  return json({ follow: null });
}

// Your followers, who you follow, requests waiting for you, and who you've blocked.
export async function listFollows(env, me) {
  const [followers, following, requests, blocked] = await env.DB.batch([
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ? AND f.status = 'accepted' AND u.banned = 0 ORDER BY f.created_at DESC`).bind(me.id),
    env.DB.prepare(`SELECT f.status, ${userCols('u', 'u_')} FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? AND u.banned = 0 ORDER BY f.created_at DESC`).bind(me.id),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ? AND f.status = 'pending' AND u.banned = 0 ORDER BY f.created_at`).bind(me.id),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? ORDER BY b.created_at DESC`).bind(me.id)
  ]);
  const people = (r) => r.results.map((x) => userFrom(x, 'u_'));
  return json({
    followers: people(followers),
    following: following.results.map((x) => ({ ...userFrom(x, 'u_'), pending: x.status === 'pending' })),
    requests: people(requests),
    blocked: people(blocked)
  });
}

export async function acceptFollower(env, me, id) {
  await env.DB.prepare("UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND followee_id = ?").bind(id, me.id).run();
  return json({ ok: true });
}

// Declines a request or removes an existing follower.
export async function removeFollower(env, me, id) {
  await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(id, me.id).run();
  return json({ ok: true });
}

// Blocking cuts both directions: no follows either way, no seeing each other's lessons or profile.
export async function block(env, me, id) {
  if (id === me.id) throw new HttpError(400, "You can't do that to yourself.");
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)').bind(me.id, id),
    env.DB.prepare('DELETE FROM follows WHERE (follower_id = ?1 AND followee_id = ?2) OR (follower_id = ?2 AND followee_id = ?1)').bind(me.id, id)
  ]);
  return json({ ok: true });
}

export async function unblock(env, me, id) {
  await env.DB.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').bind(me.id, id).run();
  return json({ ok: true });
}

// ---------- site owner ----------

export async function ownerReports(env, me) {
  requireOwner(env, me);
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.reason, r.details, r.created_at, r.lesson_id, l.title AS lesson_title, l.hidden AS lesson_hidden, l.host_id,
       r.user_id AS target_id, t.name AS target_name, t.banned AS target_banned, p.name AS reporter_name, c.name AS club_name
     FROM reports r JOIN clubs c ON c.id = r.club_id LEFT JOIN lessons l ON l.id = r.lesson_id LEFT JOIN users t ON t.id = r.user_id LEFT JOIN users p ON p.id = r.reporter_id
     WHERE r.resolved = 0 ORDER BY r.created_at DESC LIMIT 200`
  ).all();
  return json({
    reports: results.map((r) => ({
      id: r.id, reason: r.reason, details: r.details, at: r.created_at, club: r.club_name, reporter: r.reporter_name || '',
      lesson: r.lesson_id ? { id: r.lesson_id, title: r.lesson_title, hidden: !!r.lesson_hidden, hostId: r.host_id } : null,
      member: r.target_id ? { id: r.target_id, name: r.target_name, banned: !!r.target_banned } : null
    }))
  });
}

export async function setBanned(env, me, id, banned) {
  requireOwner(env, me);
  if (id === me.id) throw new HttpError(400, "You can't do that to yourself.");
  const steps = [env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(banned ? 1 : 0, id)];
  if (banned) steps.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id));
  await env.DB.batch(steps);
  return json({ ok: true });
}
