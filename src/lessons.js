// Lessons: the calendar, lesson pages, RSVPs (with seats and a waitlist), thank-you notes, questions,
// after-lesson photos, part twos, archiving, "For you" suggestions, and the year-in-review ("Wrapped").

import {
  HttpError, json, readJson, text, linkOf, imageOf, imageResponse, isDate, validTz, zonedToUtc, parseJson,
  randomCode, userCols, userFrom, requireClub, currentClub, TOPICS, rateLimit, isNewAccount, hasLink, isOwner
} from './lib.js';
import { LESSON_COLS, lessonBasics, VISIBLE } from './accounts.js';

const FORMATS = ['talk', 'demo', 'disc', 'show', 'read'];
const LENGTHS = [5, 10, 15, 20, 25, 30];
const MODES = ['online', 'in_person', 'both'];
const REACTIONS = ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'];
const MAX_PHOTOS = 4;

const jitsi = (room) => `https://meet.jit.si/${room}`;
const notFound = () => new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");

// The lesson if this member may see it: their own; or not blocked/archived/hidden, and they're in the
// lesson's club or follow a teacher who shared it with followers. The site owner sees everything.
async function lessonFor(env, me, id) {
  const row = await env.DB.prepare(
    `SELECT l.*, m.role AS my_role,
       EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = l.host_id AND f.status = 'accepted') AS following,
       EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = l.host_id AND b.blocked_id = ?1) OR (b.blocker_id = ?1 AND b.blocked_id = l.host_id)) AS blocked
     FROM lessons l LEFT JOIN club_members m ON m.club_id = l.club_id AND m.user_id = ?1 WHERE l.id = ?2`
  ).bind(me.id, id).first();
  if (!row) throw notFound();
  row.isHost = row.host_id === me.id;
  row.isOwner = isOwner(env, me);
  row.isAdmin = row.my_role === 'admin';
  if (row.isHost || row.isOwner) return row;
  if (row.blocked || row.archived || (row.hidden && !row.isAdmin)) throw notFound();
  if (row.my_role || (row.visibility === 'followers' && row.following)) return row;
  throw notFound();
}

function requireHost(row) {
  if (!row.isHost) throw new HttpError(403, 'Only the person teaching can change this lesson.');
}

// scope: club (your current club), following (people you follow), all (both). Your own lessons that
// aren't in a club always show.
export async function listLessons(env, me, url) {
  const from = Number(url.searchParams.get('from'));
  const to = Number(url.searchParams.get('to'));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new HttpError(400, 'Pick a date range.');
  const scope = ['club', 'following', 'all'].includes(url.searchParams.get('scope')) ? url.searchParams.get('scope') : 'all';
  const club = await currentClub(env, me);
  const inClub = 'l.club_id = ?4'; // with no club, ?4 is 0, which matches nothing (only bound when used)
  const followed = "(l.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = l.host_id AND f.status = 'accepted'))";
  const ownLoose = '(l.host_id = ?1 AND l.club_id IS NULL)';
  const which = scope === 'club' ? inClub : scope === 'following' ? `${followed} OR ${ownLoose} OR (l.host_id = ?1 AND l.visibility = 'followers')` : `${inClub} OR ${followed} OR ${ownLoose}`;
  const { results } = await env.DB.prepare(
    `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')},
      (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id AND r.waitlist = 0) AS going_count,
      (SELECT CASE WHEN r.waitlist THEN 'waitlist' ELSE 'going' END FROM rsvps r WHERE r.lesson_id = l.id AND r.user_id = ?1) AS my_status,
      l.club_id
     FROM lessons l JOIN users h ON h.id = l.host_id
     WHERE l.starts_at >= ?2 AND l.starts_at < ?3 AND l.archived = 0 AND h.banned = 0 AND (l.hidden = 0 OR l.host_id = ?1)
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = l.host_id AND b.blocked_id = ?1) OR (b.blocker_id = ?1 AND b.blocked_id = l.host_id))
       AND (${which})
     ORDER BY l.starts_at LIMIT 500`
  ).bind(...[me.id, from, to].concat(which.includes('?4') ? [club ? club.id : 0] : [])).all();
  return json({
    lessons: results.map((r) => ({
      ...lessonBasics(r), host: userFrom(r, 'h_'), goingCount: r.going_count, going: r.my_status === 'going', waitlisted: r.my_status === 'waitlist',
      inMyClub: !!club && r.club_id === club.id
    }))
  });
}

export async function getLesson(env, me, id) {
  const row = await lessonFor(env, me, id);
  const [host, attendees, waiting, notes, questions, photos, parent, children] = await env.DB.batch([
    env.DB.prepare(`SELECT ${userCols('h', 'h_')} FROM users h WHERE h.id = ?`).bind(row.host_id),
    env.DB.prepare(`SELECT ${userCols('u', 'u_')} FROM rsvps r JOIN users u ON u.id = r.user_id WHERE r.lesson_id = ? AND r.waitlist = 0 ORDER BY r.created_at`).bind(id),
    env.DB.prepare('SELECT user_id FROM rsvps WHERE lesson_id = ? AND waitlist = 1 ORDER BY created_at').bind(id),
    env.DB.prepare(
      `SELECT n.reactions, n.body, n.created_at AS note_at, ${userCols('u', 'u_')}
       FROM notes n JOIN users u ON u.id = n.user_id WHERE n.lesson_id = ? ORDER BY n.created_at`
    ).bind(id),
    env.DB.prepare(
      `SELECT q.id, q.body, q.answer, q.created_at AS q_at, ${userCols('u', 'u_')}
       FROM questions q JOIN users u ON u.id = q.user_id WHERE q.lesson_id = ? ORDER BY q.created_at`
    ).bind(id),
    env.DB.prepare('SELECT id FROM lesson_photos WHERE lesson_id = ? ORDER BY id').bind(id),
    env.DB.prepare('SELECT id, title FROM lessons WHERE id = ? AND archived = 0').bind(row.parent_id || 0),
    env.DB.prepare('SELECT id, title, starts_at FROM lessons WHERE parent_id = ? AND archived = 0 ORDER BY starts_at').bind(id)
  ]);
  const people = attendees.results.map((r) => userFrom(r, 'u_'));
  const isHost = row.isHost;
  const going = people.some((u) => u.id === me.id);
  const waitPos = waiting.results.findIndex((w) => w.user_id === me.id);
  const over = row.starts_at + row.length * 60000 <= Date.now();
  const insider = isHost || going || row.isOwner;
  const answers = parseJson(row.answers, []);
  const noteList = notes.results.map((r) => ({ author: userFrom(r, 'u_'), reactions: parseJson(r.reactions, []), body: r.body, at: r.note_at }));
  const online = row.mode !== 'in_person';
  const callLink = online ? row.class_link || (row.room ? jitsi(row.room) : '') : '';
  return json({
    lesson: {
      ...lessonBasics(row),
      host: userFrom(host.results[0], 'h_'),
      isHost,
      isAdmin: row.isAdmin,
      isOwner: row.isOwner,
      inClub: !!row.my_role,
      going,
      waitlisted: waitPos >= 0,
      waitlistPosition: waitPos + 1,
      waitlistCount: waiting.results.length,
      goingCount: people.length,
      seats: row.seats,
      attendees: people,
      hidden: !!row.hidden,
      surprise: !!row.surprise,
      // A "surprise" outline stays hidden from everyone except the host, enforced here rather than in the browser.
      plan: isHost || !row.surprise ? parseJson(row.plan, []) : null,
      teacherNotes: isHost ? parseJson(row.notes, []) : null,
      answers: isHost ? answers : null,
      reading: row.format === 'read' ? answers[0] || '' : '',
      prep: row.prep,
      // Only the host and people who said yes see the call link and the exact place.
      classLink: insider ? callLink : '',
      ownLink: isHost ? row.class_link : undefined,
      autoRoom: online && !row.class_link,
      place: insider ? row.place : '',
      mapLink: insider ? row.map_link : '',
      // Material links: for the host and people going, and for everyone once the lesson is over.
      materials: insider || over ? parseJson(row.materials, []) : [],
      materialCount: parseJson(row.materials, []).length,
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

function httpsUrl(value, field, max = 500) {
  const s = text(value, field, { max });
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
  } catch {
    // fall through
  }
  throw new HttpError(400, field === 'Map link' ? "That map link doesn't look right." : 'That class link does not look like a web address. It should start with https://');
}

function lessonInput(b, me) {
  if (!FORMATS.includes(b.format)) throw new HttpError(400, 'Pick a format for your lesson.');
  if (!isDate(b.date)) throw new HttpError(400, 'Pick a day for your lesson.');
  if (typeof b.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)) throw new HttpError(400, 'Pick a start time.');
  const tz = validTz(b.tz) ? b.tz : null;
  if (!tz) throw new HttpError(400, "That time zone isn't recognised.");
  const length = Number(b.length);
  if (!LENGTHS.includes(length)) throw new HttpError(400, 'Lessons are 5 to 30 minutes.');
  const mode = b.mode || 'online';
  if (!MODES.includes(mode)) throw new HttpError(400, 'Pick how the lesson happens.');
  let place = '';
  let area = '';
  let mapLink = '';
  if (mode !== 'online') {
    place = text(b.place, 'Place', { max: 80 });
    area = text(b.area, 'Area', { max: 60 });
    if (!place || !area) throw new HttpError(400, 'Add the place and area for an in-person lesson.');
    if (b.publicPlace !== true) throw new HttpError(400, 'Please confirm it is a public place.');
    mapLink = httpsUrl(b.mapLink, 'Map link');
  }
  const seats = Math.max(0, Math.min(500, Math.floor(Number(b.seats) || 0)));
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
  const notes = (Array.isArray(b.teacherNotes) ? b.teacherNotes : []).slice(0, 6).map((n) => text(n, 'Teacher notes', { max: 2000 }));
  const materials = (Array.isArray(b.materials) ? b.materials : []).slice(0, 8).map((m) => {
    m = m || {};
    const url = httpsUrl(m.url, 'Material link');
    if (!url) throw new HttpError(400, '{field} is required.', { field: 'Material link' });
    return { url, title: text(m.title, 'Material title', { max: 80 }) };
  });
  const v = {
    format: b.format, date: b.date, time: b.time, tz, startsAt: zonedToUtc(b.date, b.time, tz), length,
    title: text(b.title, 'Title', { max: 60, required: true }),
    pitch: text(b.pitch, 'Pitch', { max: 90 }),
    prep: text(b.prep, 'Prep note', { max: 200 }),
    classLink: mode === 'in_person' ? '' : linkOf(b.classLink),
    answers, plan, notes, materials, mode, place, area, mapLink, seats,
    visibility: b.visibility === 'followers' ? 'followers' : 'club',
    tags: [...new Set((Array.isArray(b.tags) ? b.tags : []).filter((t) => TOPICS.includes(t)))].slice(0, 3),
    surprise: !!b.surprise
  };
  // Brand-new accounts can't post links (the usual way spam gets in).
  if (isNewAccount(me) && (materials.length || [v.title, v.pitch, v.prep, ...answers, ...plan.map((p) => p.desc)].some(hasLink))) {
    throw new HttpError(400, "New accounts can't add links yet. Try again in a few days.");
  }
  return v;
}

const COLUMNS = 'title, pitch, format, date, time, tz, starts_at, length, answers, plan, notes, materials, class_link, surprise, prep, mode, place, area, map_link, seats, visibility, tags';
const values = (v) => [v.title, v.pitch, v.format, v.date, v.time, v.tz, v.startsAt, v.length, JSON.stringify(v.answers), JSON.stringify(v.plan),
  JSON.stringify(v.notes), JSON.stringify(v.materials), v.classLink, v.surprise ? 1 : 0, v.prep, v.mode, v.place, v.area, v.mapLink, v.seats, v.visibility, JSON.stringify(v.tags)];

export async function createLesson(request, env, me) {
  const club = await currentClub(env, me);
  const b = await readJson(request);
  const v = lessonInput(b, me);
  await rateLimit(env, `lessons:${me.id}`, isNewAccount(me) ? 2 : 10, 86400); // counted only for valid lessons
  if (!club) v.visibility = 'followers'; // no club: lessons are for your followers
  let parentId = null;
  if (b.parentId) {
    const parent = await env.DB.prepare('SELECT host_id FROM lessons WHERE id = ?').bind(Number(b.parentId)).first();
    if (!parent || parent.host_id !== me.id) throw new HttpError(400, 'You can only follow up your own lessons.');
    parentId = Number(b.parentId);
  }
  const row = await env.DB.prepare(
    `INSERT INTO lessons (host_id, club_id, room, parent_id, ${COLUMNS}) VALUES (?, ?, ?, ?, ${COLUMNS.split(',').map(() => '?').join(', ')}) RETURNING id`
  ).bind(me.id, club ? club.id : null, `TeachClub-${randomCode(12)}`, parentId, ...values(v)).first();
  // Teaching someone's wish? Mark it as taken.
  if (b.wishId && club) {
    await env.DB.prepare('UPDATE wishes SET lesson_id = ? WHERE id = ? AND club_id = ? AND lesson_id IS NULL').bind(row.id, Number(b.wishId), club.id).run();
  }
  return json({ id: row.id }, 201);
}

export async function updateLesson(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row);
  const v = lessonInput(await readJson(request), me);
  if (!row.club_id) v.visibility = 'followers';
  await env.DB.prepare(`UPDATE lessons SET ${COLUMNS.split(', ').map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).bind(...values(v), id).run();
  // A new time means new reminders.
  await env.DB.prepare('DELETE FROM sent_reminders WHERE lesson_id = ?').bind(id).run();
  return json({ id });
}

// The host can cancel; so can a club admin or the site owner (for reported lessons).
export async function deleteLesson(env, me, id) {
  const row = await lessonFor(env, me, id);
  if (!row.isHost && !row.isAdmin && !row.isOwner) throw new HttpError(403, 'Only the person teaching can change this lesson.');
  await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

export async function archiveLesson(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row);
  const archived = (await readJson(request)).archived ? 1 : 0;
  await env.DB.prepare('UPDATE lessons SET archived = ? WHERE id = ?').bind(archived, id).run();
  return json({ archived: !!archived });
}

// Saying yes. When the lesson has a seat limit and is full, you go on the waitlist; when someone
// drops out, the first person waiting moves up.
export async function setRsvp(env, me, id, on) {
  const row = await lessonFor(env, me, id);
  if (row.isHost) throw new HttpError(400, "You're teaching this one, so you're already in!");
  if (on) {
    const existing = await env.DB.prepare('SELECT waitlist FROM rsvps WHERE lesson_id = ? AND user_id = ?').bind(id, me.id).first();
    if (!existing) {
      const taken = await env.DB.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE lesson_id = ? AND waitlist = 0').bind(id).first();
      const wait = row.seats > 0 && taken.n >= row.seats ? 1 : 0;
      await env.DB.prepare('INSERT OR IGNORE INTO rsvps (lesson_id, user_id, waitlist) VALUES (?, ?, ?)').bind(id, me.id, wait).run();
      return json({ status: wait ? 'waitlist' : 'going' });
    }
    return json({ status: existing.waitlist ? 'waitlist' : 'going' });
  }
  const was = await env.DB.prepare('SELECT waitlist FROM rsvps WHERE lesson_id = ? AND user_id = ?').bind(id, me.id).first();
  await env.DB.prepare('DELETE FROM rsvps WHERE lesson_id = ? AND user_id = ?').bind(id, me.id).run();
  if (was && !was.waitlist) {
    await env.DB.prepare(
      'UPDATE rsvps SET waitlist = 0 WHERE lesson_id = ?1 AND user_id = (SELECT user_id FROM rsvps WHERE lesson_id = ?1 AND waitlist = 1 ORDER BY created_at LIMIT 1)'
    ).bind(id).run();
  }
  return json({ status: null });
}

export async function saveNote(request, env, me, id) {
  const b = await readJson(request);
  const row = await lessonFor(env, me, id);
  if (row.isHost) throw new HttpError(400, "You can't send yourself a thank-you note.");
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
  await rateLimit(env, `questions:${me.id}`, 30, 3600);
  const body = text((await readJson(request)).body, 'Question', { max: 280, required: true });
  if (isNewAccount(me) && hasLink(body)) throw new HttpError(400, "New accounts can't add links yet. Try again in a few days.");
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
  requireHost(lesson);
  const answer = text((await readJson(request)).answer, 'Reply', { max: 500 });
  await env.DB.prepare('UPDATE questions SET answer = ? WHERE id = ?').bind(answer, qid).run();
  return json({ ok: true });
}

export async function deleteQuestion(env, me, qid) {
  const { q, lesson } = await questionFor(env, me, qid);
  if (q.user_id !== me.id && !lesson.isHost && !lesson.isAdmin && !lesson.isOwner) throw new HttpError(403, 'Only the person teaching can change this lesson.');
  await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(qid).run();
  return json({ ok: true });
}

// ---------- after the lesson: recap and photos ----------

export async function saveRecap(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row);
  const recap = text((await readJson(request)).recap, 'Recap', { max: 1000 });
  if (isNewAccount(me) && hasLink(recap)) throw new HttpError(400, "New accounts can't add links yet. Try again in a few days.");
  await env.DB.prepare('UPDATE lessons SET recap = ? WHERE id = ?').bind(recap, id).run();
  return json({ ok: true });
}

export async function addPhoto(request, env, me, id) {
  const row = await lessonFor(env, me, id);
  requireHost(row);
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
  requireHost(row);
  await env.DB.prepare('DELETE FROM lesson_photos WHERE id = ? AND lesson_id = ?').bind(photoId, id).run();
  return json({ ok: true });
}

// ---------- "For you": a simple, explainable score ----------
// Points for: topics you like, formats you often go to, teachers you know or follow, people you follow
// going, a wish you voted for, being popular, and starting soon. Each suggestion says why.

export async function forYou(env, me) {
  const now = Date.now();
  const interests = parseJson(me.interests, []);
  const [cands, formats] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${LESSON_COLS}, ${userCols('h', 'h_')},
         (SELECT COUNT(*) FROM rsvps r WHERE r.lesson_id = l.id AND r.waitlist = 0) AS going_count,
         (SELECT COUNT(*) FROM rsvps r JOIN follows f ON f.followee_id = r.user_id AND f.follower_id = ?1 AND f.status = 'accepted'
            WHERE r.lesson_id = l.id AND r.waitlist = 0) AS friends_going,
         EXISTS (SELECT 1 FROM wishes w JOIN wish_votes v ON v.wish_id = w.id WHERE w.lesson_id = l.id AND v.user_id = ?1) AS my_wish,
         EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = l.host_id AND f.status = 'accepted') AS follow_host,
         (EXISTS (SELECT 1 FROM rsvps r2 JOIN lessons l2 ON l2.id = r2.lesson_id WHERE r2.user_id = ?1 AND r2.waitlist = 0 AND l2.host_id = l.host_id AND l2.starts_at < ?2)
          OR EXISTS (SELECT 1 FROM notes n2 JOIN lessons l3 ON l3.id = n2.lesson_id WHERE n2.user_id = ?1 AND l3.host_id = l.host_id)) AS knows_host
       FROM lessons l JOIN users h ON h.id = l.host_id
       WHERE l.starts_at > ?2 AND l.starts_at < ?3 AND l.host_id != ?1 AND h.banned = 0
         AND NOT EXISTS (SELECT 1 FROM rsvps r WHERE r.lesson_id = l.id AND r.user_id = ?1)
         AND ${VISIBLE}
       ORDER BY l.starts_at LIMIT 200`
    ).bind(me.id, now, now + 30 * 864e5),
    env.DB.prepare(
      `SELECT l.format, COUNT(*) AS n FROM rsvps r JOIN lessons l ON l.id = r.lesson_id
       WHERE r.user_id = ? AND r.waitlist = 0 GROUP BY l.format HAVING n >= 2`
    ).bind(me.id)
  ]);
  const liked = new Set(formats.results.map((f) => f.format));
  const scored = cands.results.map((r) => {
    const l = { ...lessonBasics(r), host: userFrom(r, 'h_'), goingCount: r.going_count };
    const reasons = [];
    let score = 0;
    const add = (points, reason) => {
      score += points;
      reasons.push({ ...reason, points });
    };
    const topic = l.tags.find((tag) => interests.includes(tag));
    if (topic) add(3 * l.tags.filter((tag) => interests.includes(tag)).length, { kind: 'topic', topic });
    if (r.my_wish) add(4, { kind: 'wish' });
    if (r.friends_going) add(1.5 * Math.min(3, r.friends_going), { kind: 'friends', n: r.friends_going });
    if (r.follow_host) add(2, { kind: 'following', name: l.host.firstName });
    else if (r.knows_host) add(2, { kind: 'teacher', name: l.host.firstName });
    if (liked.has(l.format)) add(2, { kind: 'format', format: l.format });
    if (l.goingCount >= 3) add(1, { kind: 'popular' });
    if (l.startsAt - now < 3 * 864e5) add(1, { kind: 'soon' });
    reasons.sort((a, b) => b.points - a.points);
    return { lesson: l, score, reasons: reasons.slice(0, 2) };
  });
  const top = scored.filter((s) => s.score >= 2).sort((a, b) => b.score - a.score || a.lesson.startsAt - b.lesson.startsAt).slice(0, 8);
  return json({ suggestions: top });
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
      (SELECT COUNT(*) FROM rsvps r JOIN lessons l ON l.id = r.lesson_id WHERE ${done} AND r.user_id = ?4 AND r.waitlist = 0) AS attended,
      (SELECT COALESCE(SUM(l.length), 0) FROM rsvps r JOIN lessons l ON l.id = r.lesson_id WHERE ${done} AND r.user_id = ?4 AND r.waitlist = 0) AS learned_minutes,
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
