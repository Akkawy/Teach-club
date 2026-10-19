// Lessons: the calendar, lesson pages, RSVPs, thank-you notes, questions, after-lesson photos,
// part twos, and the year-in-review ("Wrapped").

import {
  HttpError, json, readJson, text, linkOf, imageOf, imageResponse, isDate, validTz, zonedToUtc, parseJson,
  randomCode, userCols, userFrom, requireClub
} from './lib.js';
import { LESSON_COLS, lessonBasics } from './accounts.js';

const FORMATS = ['talk', 'demo', 'disc', 'show', 'read'];
const LENGTHS = [5, 10, 15, 20, 25, 30];
const REACTIONS = ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'];
const MAX_PHOTOS = 4;

const jitsi = (room) => `https://meet.jit.si/${room}`;

// The lesson plus the viewer's role in its club. Lessons outside your clubs simply don't exist for you.
async function lessonFor(env, me, id) {
  const row = await env.DB.prepare('SELECT l.*, m.role AS my_role FROM lessons l JOIN club_members m ON m.club_id = l.club_id AND m.user_id = ? WHERE l.id = ?')
    .bind(me.id, id).first();
  if (!row) throw new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");
  return row;
}

function requireHost(row, me) {
  if (row.host_id !== me.id) throw new HttpError(403, 'Only the person teaching can change this lesson.');
}

export async function listLessons(env, me, url) {
  const club = await requireClub(env, me);
  const from = Number(url.searchParams.get('from'));
  const to = Number(url.searchParams.get('to'));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new HttpError(400, 'Pick a date range.');
  const { results } = await env.DB.prepare(
    `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')},
      (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id) AS going_count,
      EXISTS (SELECT 1 FROM rsvps r WHERE r.lesson_id = l.id AND r.user_id = ?) AS me_going
     FROM lessons l JOIN users h ON h.id = l.host_id
     WHERE l.club_id = ? AND l.starts_at >= ? AND l.starts_at < ? ORDER BY l.starts_at LIMIT 500`
  ).bind(me.id, club.id, from, to).all();
  return json({
    lessons: results.map((r) => ({ ...lessonBasics(r), host: userFrom(r, 'h_'), goingCount: r.going_count, going: !!r.me_going }))
  });
}

export async function getLesson(env, me, id) {
  const row = await lessonFor(env, me, id);
  const [host, attendees, notes, questions, photos, parent, children] = await env.DB.batch([
    env.DB.prepare(`SELECT ${userCols('h', 'h_')} FROM users h WHERE h.id = ?`).bind(row.host_id),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM rsvps r JOIN users u ON u.id = r.user_id WHERE r.lesson_id = ? ORDER BY r.created_at`).bind(id),
    env.DB.prepare(
      `SELECT n.reactions, n.body, n.created_at AS note_at, ${userCols('u', 'u_')}
       FROM notes n JOIN users u ON u.id = n.user_id WHERE n.lesson_id = ? ORDER BY n.created_at`
    ).bind(id),
    env.DB.prepare(
      `SELECT q.id, q.body, q.answer, q.created_at AS q_at, ${userCols('u', 'u_')}
       FROM questions q JOIN users u ON u.id = q.user_id WHERE q.lesson_id = ? ORDER BY q.created_at`
    ).bind(id),
    env.DB.prepare('SELECT id FROM lesson_photos WHERE lesson_id = ? ORDER BY id').bind(id),
    env.DB.prepare('SELECT id, title FROM lessons WHERE id = ?').bind(row.parent_id || 0),
    env.DB.prepare('SELECT id, title, starts_at FROM lessons WHERE parent_id = ? ORDER BY starts_at').bind(id)
  ]);
  const people = attendees.results.map((r) => userFrom(r, 'u_'));
  const isHost = row.host_id === me.id;
  const going = people.some((u) => u.id === me.id);
  const answers = parseJson(row.answers, []);
  const noteList = notes.results.map((r) => ({ author: userFrom(r, 'u_'), reactions: parseJson(r.reactions, []), body: r.body, at: r.note_at }));
  const callLink = row.class_link || (row.room ? jitsi(row.room) : '');
  return json({
    lesson: {
      ...lessonBasics(row),
      host: userFrom(host.results[0], 'h_'),
      isHost,
      isAdmin: row.my_role === 'admin',
      going,
      goingCount: people.length,
      attendees: people,
      surprise: !!row.surprise,
      // A "surprise" outline stays hidden from everyone except the host, enforced here rather than in the browser.
      plan: isHost || !row.surprise ? parseJson(row.plan, []) : null,
      answers: isHost ? answers : null,
      reading: row.format === 'read' ? answers[0] || '' : '',
      prep: row.prep,
      // The call link is only for the host and people who said yes. No link of their own? A free Jitsi room.
      classLink: isHost || going ? callLink : '',
      ownLink: isHost ? row.class_link : undefined,
      autoRoom: !row.class_link,
      notes: noteList,
      partTwoWanted: noteList.filter((n) => n.reactions.includes('Want a part two')).length,
      questions: questions.results.map((r) => ({ id: r.id, body: r.body, answer: r.answer, at: r.q_at, author: userFrom(r, 'u_') })),
      recap: row.recap,
      photos: photos.results.map((p) => `/api/lessons/${id}/photos/${p.id}`),
      parent: parent.results[0] || null,
      children: children.results.map((c) => ({ id: c.id, title: c.title, startsAt: c.starts_at }))
    }
  });
}

function lessonInput(b) {
  if (!FORMATS.includes(b.format)) throw new HttpError(400, 'Pick a format for your lesson.');
  if (!isDate(b.date)) throw new HttpError(400, 'Pick a day for your lesson.');
  if (typeof b.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)) throw new HttpError(400, 'Pick a start time.');
  const tz = validTz(b.tz) ? b.tz : null;
  if (!tz) throw new HttpError(400, "That time zone isn't recognised.");
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
    format: b.format, date: b.date, time: b.time, tz, startsAt: zonedToUtc(b.date, b.time, tz), length,
    title: text(b.title, 'Title', { max: 60, required: true }),
    pitch: text(b.pitch, 'Pitch', { max: 90 }),
    prep: text(b.prep, 'Prep note', { max: 200 }),
    classLink: linkOf(b.classLink),
    answers,
    plan,
    surprise: !!b.surprise
  };
}

export async function createLesson(request, env, me) {
  const club = await requireClub(env, me);
  const b = await readJson(request);
  const v = lessonInput(b);
  let parentId = null;
  if (b.parentId) {
    const parent = await env.DB.prepare('SELECT host_id, club_id FROM lessons WHERE id = ?').bind(Number(b.parentId)).first();
    if (!parent || parent.host_id !== me.id || parent.club_id !== club.id) throw new HttpError(400, 'You can only follow up your own lessons.');
    parentId = Number(b.parentId);
  }
  const row = await env.DB.prepare(
    `INSERT INTO lessons (host_id, club_id, title, pitch, format, date, time, tz, starts_at, length, answers, plan, class_link, surprise, prep, room, parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.id, club.id, v.title, v.pitch, v.format, v.date, v.time, v.tz, v.startsAt, v.length, JSON.stringify(v.answers), JSON.stringify(v.plan),
    v.classLink, v.surprise ? 1 : 0, v.prep, `TeachClub-${randomCode(12)}`, parentId).first();
  // Teaching someone's wish? Mark it as taken.
  if (b.wishId) {
    await env.DB.prepare('UPDATE wishes SET lesson_id = ? WHERE id = ? AND club_id = ? AND lesson_id IS NULL').bind(row.id, Number(b.wishId), club.id).run();
  }
  return json({ id: row.id }, 201);
}

export async function updateLesson(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row, me);
  const v = lessonInput(await readJson(request));
  await env.DB.prepare(
    `UPDATE lessons SET title = ?, pitch = ?, format = ?, date = ?, time = ?, tz = ?, starts_at = ?, length = ?, answers = ?, plan = ?,
       class_link = ?, surprise = ?, prep = ? WHERE id = ?`
  ).bind(v.title, v.pitch, v.format, v.date, v.time, v.tz, v.startsAt, v.length, JSON.stringify(v.answers), JSON.stringify(v.plan),
    v.classLink, v.surprise ? 1 : 0, v.prep, id).run();
  // A new time means new reminders.
  await env.DB.prepare('DELETE FROM sent_reminders WHERE lesson_id = ?').bind(id).run();
  return json({ id });
}

// The host can cancel; so can a club admin (for reported lessons).
export async function deleteLesson(env, me, id) {
  const row = await lessonFor(env, me, id);
  if (row.host_id !== me.id && row.my_role !== 'admin') throw new HttpError(403, 'Only the person teaching can change this lesson.');
  await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

export async function setRsvp(env, me, id, on) {
  const row = await lessonFor(env, me, id);
  if (row.host_id === me.id) throw new HttpError(400, "You're teaching this one, so you're already in!");
  const sql = on ? 'INSERT OR IGNORE INTO rsvps (lesson_id, user_id) VALUES (?, ?)' : 'DELETE FROM rsvps WHERE lesson_id = ? AND user_id = ?';
  await env.DB.prepare(sql).bind(id, me.id).run();
  return json({ ok: true });
}

export async function saveNote(request, env, me, id) {
  const b = await readJson(request);
  const row = await lessonFor(env, me, id);
  if (row.host_id === me.id) throw new HttpError(400, "You can't send yourself a thank-you note.");
  const reactions = Array.isArray(b.reactions) ? [...new Set(b.reactions.filter((r) => REACTIONS.includes(r)))] : [];
  const body = text(b.body, 'Your note', { max: 500 });
  if (!reactions.length && !body) throw new HttpError(400, 'Pick a reaction or write a line first.');
  await env.DB.prepare(
    `INSERT INTO notes (lesson_id, user_id, reactions, body) VALUES (?, ?, ?, ?)
     ON CONFLICT (lesson_id, user_id) DO UPDATE SET reactions = excluded.reactions, body = excluded.body`
  ).bind(id, me.id, JSON.stringify(reactions), body).run();
  return json({ ok: true });
}

// ---------- questions before the lesson ----------

export async function askQuestion(request, env, me, id) {
  await lessonFor(env, me, id);
  const body = text((await readJson(request)).body, 'Question', { max: 280, required: true });
  await env.DB.prepare('INSERT INTO questions (lesson_id, user_id, body) VALUES (?, ?, ?)').bind(id, me.id, body).run();
  return json({ ok: true }, 201);
}

async function questionFor(env, me, qid) {
  const q = await env.DB.prepare('SELECT q.user_id, q.lesson_id FROM questions q WHERE q.id = ?').bind(qid).first();
  if (!q) throw new HttpError(404, 'Not found.');
  const lesson = await lessonFor(env, me, q.lesson_id);
  return { q, lesson };
}

export async function answerQuestion(request, env, me, qid) {
  const { lesson } = await questionFor(env, me, qid);
  requireHost(lesson, me);
  const answer = text((await readJson(request)).answer, 'Reply', { max: 500 });
  await env.DB.prepare('UPDATE questions SET answer = ? WHERE id = ?').bind(answer, qid).run();
  return json({ ok: true });
}

export async function deleteQuestion(env, me, qid) {
  const { q, lesson } = await questionFor(env, me, qid);
  if (q.user_id !== me.id && lesson.host_id !== me.id && lesson.my_role !== 'admin') throw new HttpError(403, 'Only the person teaching can change this lesson.');
  await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(qid).run();
  return json({ ok: true });
}

// ---------- after the lesson: recap and photos ----------

export async function saveRecap(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row, me);
  const recap = text((await readJson(request)).recap, 'Recap', { max: 1000 });
  await env.DB.prepare('UPDATE lessons SET recap = ? WHERE id = ?').bind(recap, id).run();
  return json({ ok: true });
}

export async function addPhoto(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row, me);
  const data = imageOf((await readJson(request)).data, 600000);
  if (!data) throw new HttpError(400, 'That photo could not be read. Try a JPEG or PNG.');
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM lesson_photos WHERE lesson_id = ?').bind(id).first();
  if (count.n >= MAX_PHOTOS) throw new HttpError(400, 'A lesson can have up to 4 photos.');
  await env.DB.prepare('INSERT INTO lesson_photos (lesson_id, data) VALUES (?, ?)').bind(id, data).run();
  return json({ ok: true }, 201);
}

export async function getLessonPhoto(env, me, id, photoId) {
  await lessonFor(env, me, id);
  const photo = await env.DB.prepare('SELECT data FROM lesson_photos WHERE id = ? AND lesson_id = ?').bind(photoId, id).first();
  return imageResponse(photo && photo.data);
}

export async function deletePhoto(env, me, id, photoId) {
  const row = await lessonFor(env, me, id);
  requireHost(row, me);
  await env.DB.prepare('DELETE FROM lesson_photos WHERE id = ? AND lesson_id = ?').bind(photoId, id).run();
  return json({ ok: true });
}

// ---------- Wrapped: the year so far, for the club and for you ----------

export async function wrapped(env, me, url) {
  const club = await requireClub(env, me);
  const year = Number(url.searchParams.get('year')) || new Date().getUTCFullYear();
  const from = Date.UTC(year, 0, 1);
  const to = Math.min(Date.UTC(year + 1, 0, 1), Date.now());
  const done = 'l.club_id = ?1 AND l.starts_at >= ?2 AND l.starts_at < ?3 AND l.starts_at + l.length * 60000 <= ?3';
  const [clubStats, topTeacher, topLesson, topFormat, myStats, myFormat, fan, busiest] = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) AS lessons, COALESCE(SUM(l.length), 0) AS minutes, COUNT(DISTINCT l.host_id) AS teachers,
      (SELECT COUNT(*) FROM club_members WHERE club_id = ?1) AS members FROM lessons l WHERE ${done}`).bind(club.id, from, to),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')}, COUNT(*) AS n FROM lessons l JOIN users u ON u.id = l.host_id WHERE ${done}
      GROUP BY l.host_id ORDER BY n DESC LIMIT 1`).bind(club.id, from, to),
    env.DB.prepare(`SELECT l.id, l.title, l.format, (SELECT COUNT(*) FROM notes n WHERE n.lesson_id = l.id) AS thanks FROM lessons l
      WHERE ${done} ORDER BY thanks DESC, l.starts_at DESC LIMIT 1`).bind(club.id, from, to),
    env.DB.prepare(`SELECT l.format, COUNT(*) AS n FROM lessons l WHERE ${done} GROUP BY l.format ORDER BY n DESC LIMIT 1`).bind(club.id, from, to),
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM lessons l WHERE ${done} AND l.host_id = ?4) AS taught,
      (SELECT COALESCE(SUM(l.length), 0) FROM lessons l WHERE ${done} AND l.host_id = ?4) AS taught_minutes,
      (SELECT COUNT(*) FROM rsvps r JOIN lessons l ON l.id = r.lesson_id WHERE ${done} AND r.user_id = ?4) AS attended,
      (SELECT COALESCE(SUM(l.length), 0) FROM rsvps r JOIN lessons l ON l.id = r.lesson_id WHERE ${done} AND r.user_id = ?4) AS learned_minutes,
      (SELECT COUNT(*) FROM notes n JOIN lessons l ON l.id = n.lesson_id WHERE ${done} AND l.host_id = ?4) AS thanks`).bind(club.id, from, to, me.id),
    env.DB.prepare(`SELECT l.format, COUNT(*) AS n FROM lessons l WHERE ${done} AND l.host_id = ?4 GROUP BY l.format ORDER BY n DESC LIMIT 1`).bind(club.id, from, to, me.id),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')}, COUNT(*) AS n FROM notes n JOIN lessons l ON l.id = n.lesson_id JOIN users u ON u.id = n.user_id
      WHERE ${done} AND l.host_id = ?4 GROUP BY n.user_id ORDER BY n DESC LIMIT 1`).bind(club.id, from, to, me.id),
    env.DB.prepare(`SELECT strftime('%m', l.starts_at / 1000, 'unixepoch') AS month, COUNT(*) AS n FROM lessons l WHERE ${done}
      GROUP BY month ORDER BY n DESC LIMIT 1`).bind(club.id, from, to)
  ]);
  const c = clubStats.results[0];
  const m = myStats.results[0];
  return json({
    year,
    club: {
      name: club.name, lessons: c.lessons, minutes: c.minutes, teachers: c.teachers, members: c.members,
      topTeacher: topTeacher.results[0] ? { user: userFrom(topTeacher.results[0], 'u_'), lessons: topTeacher.results[0].n } : null,
      topLesson: topLesson.results[0] && topLesson.results[0].thanks ? topLesson.results[0] : null,
      topFormat: topFormat.results[0] ? topFormat.results[0].format : null,
      busiestMonth: busiest.results[0] ? Number(busiest.results[0].month) - 1 : null
    },
    me: {
      taught: m.taught, taughtMinutes: m.taught_minutes, attended: m.attended, learnedMinutes: m.learned_minutes, thanks: m.thanks,
      topFormat: myFormat.results[0] ? myFormat.results[0].format : null,
      biggestFan: fan.results[0] ? { user: userFrom(fan.results[0], 'u_'), notes: fan.results[0].n } : null
    }
  });
}
