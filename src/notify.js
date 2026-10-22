// In-app notifications. Other modules call notify() when something happens; members read them
// grouped ("Sara and 4 others joined Coffee basics") and can switch whole kinds off.

import { json, parseJson, userCols, userFrom } from './lib.js';

// Which settings group each type belongs to (see Edit profile → Notifications).
export const KIND = {
  follow: 'people', follow_request: 'people', follow_accepted: 'people',
  rsvp: 'my_lessons', question: 'my_lessons', note: 'my_lessons',
  waitlist_up: 'joined_lessons', answer: 'joined_lessons', lesson_changed: 'joined_lessons', lesson_cancelled: 'joined_lessons',
  video_comment: 'videos', video_interest: 'videos', video_lesson: 'videos',
  wish_taught: 'wishes'
};
export const GROUPS = ['people', 'my_lessons', 'joined_lessons', 'videos', 'wishes'];

// Sends one notification to each recipient (skipping the actor and anyone who switched this kind off).
export async function notify(env, recipients, { type, actor = null, lessonId = null, videoId = null, data = {} }) {
  const ids = [...new Set((Array.isArray(recipients) ? recipients : [recipients]).filter((id) => id && id !== actor))];
  if (!ids.length) return;
  const { results } = await env.DB.prepare(
    `SELECT id, notify_off FROM users WHERE id IN (${ids.map(() => '?').join(',')}) AND banned = 0`
  ).bind(...ids).all();
  const want = results.filter((u) => !parseJson(u.notify_off, []).includes(KIND[type])).map((u) => u.id);
  if (!want.length) return;
  const now = Date.now();
  const json_ = JSON.stringify(data);
  await env.DB.batch(want.map((id) =>
    env.DB.prepare('INSERT INTO notifications (user_id, type, actor_id, lesson_id, video_id, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, type, actor, lessonId, videoId, json_, now)
  ));
}

export async function unreadCount(env, me) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0').bind(me.id).first();
  return row.n;
}

// The latest notifications, grouped by kind and target (same lesson/video) within a day.
export async function listNotifications(env, me) {
  const { results } = await env.DB.prepare(
    `SELECT n.id, n.type, n.lesson_id, n.video_id, n.data, n.read, n.created_at, l.title AS lesson_title, v.title AS video_title,
       ${userCols('a', 'a_')}
     FROM notifications n LEFT JOIN users a ON a.id = n.actor_id
       LEFT JOIN lessons l ON l.id = n.lesson_id LEFT JOIN videos v ON v.id = n.video_id
     WHERE n.user_id = ? AND (a.id IS NULL OR a.banned = 0)
       -- notifications about a lesson that's since been cancelled go quiet (the cancellation itself says so)
       AND (n.lesson_id IS NOT NULL OR n.type NOT IN ('rsvp', 'question', 'note', 'waitlist_up', 'answer', 'lesson_changed', 'wish_taught', 'video_lesson'))
     ORDER BY n.created_at DESC LIMIT 200`
  ).bind(me.id).all();
  const groups = [];
  const byKey = new Map();
  for (const r of results) {
    const day = Math.floor(r.created_at / 864e5);
    const key = `${r.type}|${r.lesson_id || ''}|${r.video_id || ''}|${day}`;
    let g = byKey.get(key);
    if (!g) {
      g = {
        type: r.type, at: r.created_at, unread: false, actors: [],
        lesson: r.lesson_id ? { id: r.lesson_id, title: r.lesson_title } : null,
        video: r.video_id ? { id: r.video_id, title: r.video_title } : null,
        data: parseJson(r.data, {}), count: 0
      };
      byKey.set(key, g);
      groups.push(g);
    }
    g.count += 1;
    if (!r.read) g.unread = true;
    if (r.a_id && !g.actors.some((a) => a.id === r.a_id) && g.actors.length < 3) g.actors.push(userFrom(r, 'a_'));
  }
  return json({ items: groups.slice(0, 60), unread: results.filter((r) => !r.read).length });
}

export async function markAllRead(env, me) {
  await env.DB.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').bind(me.id).run();
  return json({ ok: true });
}

// Housekeeping, run with the reminders: notifications older than 60 days go.
export async function pruneNotifications(env) {
  await env.DB.prepare('DELETE FROM notifications WHERE created_at < ?').bind(Date.now() - 60 * 864e5).run();
}
