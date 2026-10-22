// Clubs: private groups with their own calendar and invite link. Plus reports for club admins.

import {
  HttpError, json, readJson, text, randomCode, userCols, userFrom, currentClub, requireClub, roleIn, rateLimit, isOwner
} from './lib.js';
import { reportTarget, autoHide, unhideAfterReview } from './videos.js';

const AUTO_HIDE_REPORTS = 3; // a lesson reported by this many different people is hidden until reviewed

const clubOut = (c) => ({ id: c.id, name: c.name, role: c.role });

// Reports about a video or a comment on one (shared with the site owner's report list).
export const REPORT_MEDIA_COLS = `r.video_id, rv.title AS video_title, rv.hidden AS video_hidden,
  r.comment_id, rc.body AS comment_body, rc.video_id AS comment_video_id, rc.hidden AS comment_hidden, rc.user_id AS comment_author_id`;
export const REPORT_MEDIA_JOINS = 'LEFT JOIN videos rv ON rv.id = r.video_id LEFT JOIN video_comments rc ON rc.id = r.comment_id';
export const reportMedia = (r) => ({
  video: r.video_id ? { id: r.video_id, title: r.video_title, hidden: !!r.video_hidden } : null,
  comment: r.comment_id ? { id: r.comment_id, body: r.comment_body, videoId: r.comment_video_id, hidden: !!r.comment_hidden, authorId: r.comment_author_id } : null
});

export async function listClubs(env, me) {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, m.role, (SELECT COUNT(*) FROM club_members x WHERE x.club_id = c.id) AS members
     FROM club_members m JOIN clubs c ON c.id = m.club_id WHERE m.user_id = ? ORDER BY m.joined_at`
  ).bind(me.id).all();
  const current = await currentClub(env, me);
  return json({ clubs: results.map((c) => ({ ...clubOut(c), members: c.members, current: current && current.id === c.id })) });
}

export async function createClub(request, env, me) {
  const b = await readJson(request);
  const name = text(b.name, 'Club name', { max: 40, required: true });
  const club = await env.DB.prepare('INSERT INTO clubs (name, invite_code, created_by) VALUES (?, ?, ?) RETURNING id, name')
    .bind(name, randomCode(), me.id).first();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, 'admin')").bind(club.id, me.id),
    env.DB.prepare('UPDATE users SET current_club_id = ? WHERE id = ?').bind(club.id, me.id)
  ]);
  return json({ club: { ...club, role: 'admin' } }, 201);
}

export async function switchClub(env, me, clubId) {
  const role = await roleIn(env, me.id, clubId);
  if (!role) throw new HttpError(404, "We couldn't find that club.");
  await env.DB.prepare('UPDATE users SET current_club_id = ? WHERE id = ?').bind(clubId, me.id).run();
  me.current_club_id = clubId;
  return json({ club: await currentClub(env, me) });
}

// The current club's page: invite link, members (with what they're good at), and reports for admins.
export async function clubDetail(env, me) {
  const club = await requireClub(env, me);
  const isAdmin = club.role === 'admin';
  const [info, members, reports] = await env.DB.batch([
    env.DB.prepare('SELECT invite_code FROM clubs WHERE id = ?').bind(club.id),
    env.DB.prepare(
      `SELECT m.role, m.joined_at, ${userCols('u', 'u_')} FROM club_members m JOIN users u ON u.id = m.user_id
       WHERE m.club_id = ? ORDER BY m.role = 'admin' DESC, u.name COLLATE NOCASE`
    ).bind(club.id),
    env.DB.prepare(
      `SELECT r.id, r.reason, r.details, r.created_at, r.lesson_id, l.title AS lesson_title, r.user_id AS target_id,
         t.name AS target_name, p.name AS reporter_name, ${REPORT_MEDIA_COLS}
       FROM reports r LEFT JOIN lessons l ON l.id = r.lesson_id LEFT JOIN users t ON t.id = r.user_id LEFT JOIN users p ON p.id = r.reporter_id
         ${REPORT_MEDIA_JOINS}
       WHERE r.club_id = ? AND r.resolved = 0 AND ? ORDER BY r.created_at DESC LIMIT 50`
    ).bind(club.id, isAdmin ? 1 : 0)
  ]);
  return json({
    club: { ...clubOut(club), inviteCode: info.results[0].invite_code },
    isAdmin,
    members: members.results.map((r) => ({ user: userFrom(r, 'u_'), role: r.role, joinedAt: r.joined_at })),
    reports: reports.results.map((r) => ({
      id: r.id, reason: r.reason, details: r.details, at: r.created_at,
      lesson: r.lesson_id ? { id: r.lesson_id, title: r.lesson_title } : null,
      member: r.target_id ? { id: r.target_id, name: r.target_name } : null,
      ...reportMedia(r),
      reporter: r.reporter_name || ''
    }))
  });
}

async function requireAdmin(env, me, clubId) {
  if ((await roleIn(env, me.id, clubId)) !== 'admin') throw new HttpError(403, 'Only club admins can do that.');
}

export async function renameClub(request, env, me, clubId) {
  await requireAdmin(env, me, clubId);
  const name = text((await readJson(request)).name, 'Club name', { max: 40, required: true });
  await env.DB.prepare('UPDATE clubs SET name = ? WHERE id = ?').bind(name, clubId).run();
  return json({ ok: true });
}

export async function newInvite(env, me, clubId) {
  await requireAdmin(env, me, clubId);
  const code = randomCode();
  await env.DB.prepare('UPDATE clubs SET invite_code = ? WHERE id = ?').bind(code, clubId).run();
  return json({ inviteCode: code });
}

export async function setRole(request, env, me, clubId, userId) {
  await requireAdmin(env, me, clubId);
  const role = (await readJson(request)).role === 'admin' ? 'admin' : 'member';
  if (role === 'member' && userId === me.id) await assertAnotherAdmin(env, clubId, me.id);
  await env.DB.prepare('UPDATE club_members SET role = ? WHERE club_id = ? AND user_id = ?').bind(role, clubId, userId).run();
  return json({ ok: true });
}

async function assertAnotherAdmin(env, clubId, userId) {
  const other = await env.DB.prepare("SELECT 1 FROM club_members WHERE club_id = ? AND user_id != ? AND role = 'admin'").bind(clubId, userId).first();
  const anyone = await env.DB.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id != ?').bind(clubId, userId).first();
  if (!other && anyone) throw new HttpError(400, "You're the only admin. Make someone else an admin first.");
}

// Leaving a club (yourself) or removing someone (admins). Their upcoming lessons in that club go too.
export async function removeMember(env, me, clubId, userId) {
  if (userId !== me.id) await requireAdmin(env, me, clubId);
  else await assertAnotherAdmin(env, clubId, me.id);
  const steps = [
    env.DB.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').bind(clubId, userId),
    env.DB.prepare('DELETE FROM lessons WHERE club_id = ? AND host_id = ? AND starts_at > ?').bind(clubId, userId, Date.now()),
    env.DB.prepare('UPDATE users SET current_club_id = NULL WHERE id = ? AND current_club_id = ?').bind(userId, clubId)
  ];
  // Last one out turns off the lights.
  steps.push(env.DB.prepare('DELETE FROM clubs WHERE id = ? AND NOT EXISTS (SELECT 1 FROM club_members WHERE club_id = ?)').bind(clubId, clubId));
  await env.DB.batch(steps);
  return json({ ok: true });
}

export async function invitePreview(env, code) {
  const club = await env.DB.prepare(
    'SELECT c.id, c.name, (SELECT COUNT(*) FROM club_members m WHERE m.club_id = c.id) AS members FROM clubs c WHERE c.invite_code = ?'
  ).bind(String(code)).first();
  if (!club) throw new HttpError(404, "That invite link doesn't work anymore. Ask for a new one.");
  return json({ club: { name: club.name, members: club.members } });
}

export async function joinByInvite(env, me, code) {
  const club = await env.DB.prepare('SELECT id, name FROM clubs WHERE invite_code = ?').bind(String(code)).first();
  if (!club) throw new HttpError(404, "That invite link doesn't work anymore. Ask for a new one.");
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO club_members (club_id, user_id, role) VALUES (?, ?, 'member')").bind(club.id, me.id),
    env.DB.prepare('UPDATE users SET current_club_id = ? WHERE id = ?').bind(club.id, me.id)
  ]);
  me.current_club_id = club.id;
  return json({ club: await currentClub(env, me) });
}

// ---------- reports ----------

const REASONS = ['spam', 'offensive', 'unsafe', 'other'];

export async function createReport(request, env, me) {
  await rateLimit(env, `reports:${me.id}`, 10, 86400);
  const b = await readJson(request);
  if (!REASONS.includes(b.reason)) throw new HttpError(400, 'Pick a reason.');
  const details = text(b.details, 'Report details', { max: 500 });
  let clubId;
  let lessonId = null;
  let userId = null;
  if (b.videoId || b.commentId) {
    // Videos and comments: only people who can see them may report. Follower-only ones go to the site owner.
    const target = await reportTarget(env, me, b);
    await env.DB.prepare('INSERT INTO reports (club_id, reporter_id, video_id, comment_id, reason, details) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(target.clubId, me.id, target.videoId, target.commentId, b.reason, details).run();
    await autoHide(env, target);
    return json({ ok: true }, 201);
  }
  if (b.lessonId) {
    const lesson = await env.DB.prepare('SELECT club_id, host_id FROM lessons WHERE id = ?').bind(Number(b.lessonId)).first();
    // Only people who can actually see the lesson may report it (so outsiders can't gang up to hide it).
    const canSee = lesson && ((lesson.club_id && (await roleIn(env, me.id, lesson.club_id)))
      || (await env.DB.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ? AND status = 'accepted'").bind(me.id, lesson.host_id).first()));
    if (!canSee) throw new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");
    // Lessons outside a club (shared with followers) are reviewed by the site owner; they use the teacher's first club.
    clubId = lesson.club_id || (await env.DB.prepare('SELECT club_id FROM club_members WHERE user_id = ? ORDER BY joined_at LIMIT 1').bind(lesson.host_id).first())?.club_id;
    if (!clubId) {
      const any = await env.DB.prepare('SELECT id FROM clubs ORDER BY id LIMIT 1').first();
      clubId = any && any.id;
    }
    if (!clubId) throw new HttpError(404, "We couldn't find that lesson. It may have been cancelled.");
    lessonId = Number(b.lessonId);
  } else {
    const club = await requireClub(env, me);
    if (!(await roleIn(env, Number(b.userId), club.id))) throw new HttpError(404, "We couldn't find that member.");
    clubId = club.id;
    userId = Number(b.userId);
  }
  await env.DB.prepare('INSERT INTO reports (club_id, reporter_id, lesson_id, user_id, reason, details) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(clubId, me.id, lessonId, userId, b.reason, details).run();
  if (lessonId) {
    await env.DB.prepare(
      'UPDATE lessons SET hidden = 1 WHERE id = ?1 AND (SELECT COUNT(DISTINCT reporter_id) FROM reports WHERE lesson_id = ?1 AND resolved = 0) >= ?2'
    ).bind(lessonId, AUTO_HIDE_REPORTS).run();
  }
  return json({ ok: true }, 201);
}

export async function resolveReport(env, me, reportId) {
  const report = await env.DB.prepare('SELECT club_id, lesson_id FROM reports WHERE id = ?').bind(reportId).first();
  if (!report) throw new HttpError(404, 'Not found.');
  if (!isOwner(env, me)) await requireAdmin(env, me, report.club_id);
  await env.DB.prepare('UPDATE reports SET resolved = 1 WHERE id = ?').bind(reportId).run();
  // Reviewed and kept: a hidden lesson comes back once no reports are left open.
  await env.DB.prepare(
    'UPDATE lessons SET hidden = 0 WHERE id = (SELECT lesson_id FROM reports WHERE id = ?1) AND NOT EXISTS (SELECT 1 FROM reports WHERE lesson_id = lessons.id AND resolved = 0)'
  ).bind(reportId).run();
  await unhideAfterReview(env, reportId);
  return json({ ok: true });
}
