// "Teach me…": things members would love to learn. Friends vote, and someone picks it up to teach.

import { HttpError, json, readJson, text, userCols, userFrom, requireClub } from './lib.js';

export async function listWishes(env, me) {
  const club = await requireClub(env, me);
  const { results } = await env.DB.prepare(
    `SELECT w.id, w.title, w.details, w.created_at, w.lesson_id, l.title AS lesson_title, l.starts_at AS lesson_starts,
       ${userCols('u', 'u_')}, ${userCols('h', 'h_')},
       (SELECT COUNT(*) FROM wish_votes v WHERE v.wish_id = w.id) AS votes,
       EXISTS (SELECT 1 FROM wish_votes v WHERE v.wish_id = w.id AND v.user_id = ?) AS voted
     FROM wishes w JOIN users u ON u.id = w.user_id
       LEFT JOIN lessons l ON l.id = w.lesson_id LEFT JOIN users h ON h.id = l.host_id
     WHERE w.club_id = ?
     ORDER BY w.lesson_id IS NOT NULL, votes DESC, w.created_at DESC LIMIT 200`
  ).bind(me.id, club.id).all();
  return json({
    wishes: results.map((r) => ({
      id: r.id, title: r.title, details: r.details, at: r.created_at, votes: r.votes, voted: !!r.voted,
      author: userFrom(r, 'u_'),
      lesson: r.lesson_id ? { id: r.lesson_id, title: r.lesson_title, startsAt: r.lesson_starts, host: userFrom(r, 'h_') } : null
    }))
  });
}

export async function createWish(request, env, me) {
  const club = await requireClub(env, me);
  const b = await readJson(request);
  const title = text(b.title, 'Wish', { max: 80, required: true });
  const details = text(b.details, 'Details', { max: 240 });
  const row = await env.DB.prepare('INSERT INTO wishes (club_id, user_id, title, details) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(club.id, me.id, title, details).first();
  await env.DB.prepare('INSERT INTO wish_votes (wish_id, user_id) VALUES (?, ?)').bind(row.id, me.id).run();
  return json({ id: row.id }, 201);
}

async function wishFor(env, me, id) {
  const club = await requireClub(env, me);
  const wish = await env.DB.prepare('SELECT id, user_id, lesson_id FROM wishes WHERE id = ? AND club_id = ?').bind(id, club.id).first();
  if (!wish) throw new HttpError(404, 'Not found.');
  return { wish, club };
}

export async function getWish(env, me, id) {
  const { wish } = await wishFor(env, me, id);
  if (wish.lesson_id) throw new HttpError(409, 'That wish is already being taught.');
  const row = await env.DB.prepare('SELECT id, title, details FROM wishes WHERE id = ?').bind(id).first();
  return json({ wish: row });
}

export async function voteWish(env, me, id, on) {
  await wishFor(env, me, id);
  const sql = on ? 'INSERT OR IGNORE INTO wish_votes (wish_id, user_id) VALUES (?, ?)' : 'DELETE FROM wish_votes WHERE wish_id = ? AND user_id = ?';
  await env.DB.prepare(sql).bind(id, me.id).run();
  return json({ ok: true });
}

export async function deleteWish(env, me, id) {
  const { wish, club } = await wishFor(env, me, id);
  if (wish.user_id !== me.id && club.role !== 'admin') throw new HttpError(403, 'Only club admins can do that.');
  await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
