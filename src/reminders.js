// Reminder emails, run by Cloudflare every 15 minutes (see "triggers" in wrangler.jsonc).
// About a day before and about 15 minutes before, to the host and everyone who said yes.

import { canEmail, sendReminderEmail, DAILY_EMAIL_CAP } from './email.js';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const WINDOWS = [
  { kind: 'soon', from: 0, to: 20 * MIN },
  { kind: 'day', from: 20 * HOUR, to: 28 * HOUR }
];

export async function sendReminders(env) {
  if (!canEmail(env)) return;
  const now = Date.now();
  const used = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM sent_reminders WHERE sent_at > ?1) + (SELECT COUNT(*) FROM password_resets WHERE created_at > ?1) AS n`
  ).bind(now - 24 * HOUR).first();
  let budget = DAILY_EMAIL_CAP - used.n;
  if (budget <= 0) return console.log('Reminder emails paused: daily email limit reached.');

  const appUrl = (env.APP_URL || '').replace(/\/+$/, '');
  for (const w of WINDOWS) {
    if (budget <= 0) break;
    // Host + everyone going, who want reminders and haven't had this one yet.
    const { results } = await env.DB.prepare(
      `SELECT l.id, l.title, l.starts_at, l.class_link, l.room, l.host_id,
         u.id AS user_id, u.name, u.email, u.lang, u.tz
       FROM lessons l
       JOIN (SELECT l2.id AS lesson_id, l2.host_id AS user_id FROM lessons l2
             UNION SELECT r.lesson_id, r.user_id FROM rsvps r) p ON p.lesson_id = l.id
       JOIN users u ON u.id = p.user_id
       WHERE l.starts_at > ?1 AND l.starts_at <= ?2 AND u.email_reminders = 1
         AND NOT EXISTS (SELECT 1 FROM sent_reminders s WHERE s.lesson_id = l.id AND s.user_id = u.id AND s.kind = ?3)
       ORDER BY l.starts_at LIMIT ?4`
    ).bind(now + w.from, now + w.to, w.kind, budget).all();
    for (const r of results) {
      const callLink = r.class_link || (r.room ? `https://meet.jit.si/${r.room}` : '');
      const ok = await sendReminderEmail(env, {
        user: { name: r.name, email: r.email, lang: r.lang, tz: r.tz },
        lesson: { id: r.id, title: r.title, starts_at: r.starts_at },
        kind: w.kind,
        isHost: r.host_id === r.user_id,
        callLink,
        appUrl
      });
      if (ok) {
        await env.DB.prepare('INSERT OR IGNORE INTO sent_reminders (lesson_id, user_id, kind, sent_at) VALUES (?, ?, ?, ?)')
          .bind(r.id, r.user_id, w.kind, Date.now()).run();
        budget--;
      }
    }
  }
}
