// Videos: links to videos people made elsewhere (YouTube, TikTok, Instagram, Vimeo, Google Drive),
// any length, to share an idea or show what they're good at. Others tap "I'd join a lesson on this",
// comment, and the owner can turn a video into a lesson. Plus "People to follow" suggestions.

import {
  HttpError, json, readJson, text, userCols, userFrom, currentClub, TOPICS, parseJson,
  rateLimit, isNewAccount, hasLink, isOwner
} from './lib.js';
import { notify } from './notify.js';

const AUTO_HIDE_REPORTS = 3;
const notFound = () => new HttpError(404, "We couldn't find that video. It may have been removed.");

// SQL: video "v" (by user "a") can be seen by member ?1. Like lessons: yours always; others' when not
// hidden, nobody blocked anybody, and you're in its club or follow someone who shared it with followers.
const VIDEO_VISIBLE = `(v.user_id = ?1 OR (v.hidden = 0 AND a.banned = 0
  AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = v.user_id AND b.blocked_id = ?1) OR (b.blocker_id = ?1 AND b.blocked_id = v.user_id))
  AND (v.club_id IN (SELECT club_id FROM club_members WHERE user_id = ?1)
       OR (v.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = v.user_id AND f.status = 'accepted')))))`;

const VIDEO_COLS = `v.id, v.user_id, v.club_id, v.visibility, v.url, v.provider, v.embed_id, v.vertical, v.title, v.caption, v.topic, v.thumb,
  v.hidden, v.lesson_id, v.created_at,
  (SELECT COUNT(*) FROM video_interest i WHERE i.video_id = v.id) AS interest_count,
  (SELECT COUNT(*) FROM video_comments c WHERE c.video_id = v.id AND c.hidden = 0) AS comment_count,
  EXISTS (SELECT 1 FROM video_interest i WHERE i.video_id = v.id AND i.user_id = ?1) AS my_interest,
  l.title AS lesson_title, l.starts_at AS lesson_starts_at`;

function videoOut(r) {
  return {
    id: r.id, url: r.url, provider: r.provider, embedId: r.embed_id, vertical: !!r.vertical, title: r.title, caption: r.caption,
    topic: r.topic, thumb: r.thumb, visibility: r.visibility, hidden: !!r.hidden, at: r.created_at,
    author: userFrom(r, 'a_'), interestCount: r.interest_count, commentCount: r.comment_count, interested: !!r.my_interest,
    lesson: r.lesson_id && r.lesson_title ? { id: r.lesson_id, title: r.lesson_title, startsAt: r.lesson_starts_at } : null
  };
}

// ---------- reading a video link ----------

const YT_ID = /^[\w-]{11}$/;

// Works out which site a link is from and the video's id there. Anything else is kept as a plain link.
export function parseVideoUrl(raw) {
  let u;
  try {
    u = new URL(String(raw || '').trim());
  } catch {
    throw new HttpError(400, "That doesn't look like a video link.");
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new HttpError(400, "That doesn't look like a video link.");
  u.protocol = 'https:';
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  const parts = u.pathname.split('/').filter(Boolean);
  const out = (provider, embedId, vertical = false) => ({ provider, embedId, vertical, url: u.href });

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = u.searchParams.get('v');
    if (parts[0] === 'watch' && YT_ID.test(v || '')) return out('youtube', v);
    if (['shorts', 'live', 'embed'].includes(parts[0]) && YT_ID.test(parts[1] || '')) return out('youtube', parts[1], parts[0] === 'shorts');
  }
  if (host === 'youtu.be' && YT_ID.test(parts[0] || '')) return out('youtube', parts[0]);
  if (host === 'vimeo.com' && /^\d+$/.test(parts[0] || '')) return out('vimeo', parts[1] && /^\w+$/.test(parts[1]) ? `${parts[0]}:${parts[1]}` : parts[0]);
  if (host === 'player.vimeo.com' && parts[0] === 'video' && /^\d+$/.test(parts[1] || '')) {
    const h = u.searchParams.get('h');
    return out('vimeo', h && /^\w+$/.test(h) ? `${parts[1]}:${h}` : parts[1]);
  }
  if (host === 'tiktok.com') {
    const i = parts.indexOf('video');
    if (i > -1 && /^\d+$/.test(parts[i + 1] || '')) return out('tiktok', parts[i + 1], true);
  }
  if (host === 'instagram.com' && ['p', 'reel', 'reels', 'tv'].includes(parts[0]) && /^[\w-]+$/.test(parts[1] || '')) {
    return out('instagram', parts[1], parts[0] !== 'p');
  }
  if (host === 'drive.google.com') {
    if (parts[0] === 'file' && parts[1] === 'd' && /^[\w-]+$/.test(parts[2] || '')) return out('drive', parts[2]);
    const id = u.searchParams.get('id');
    if (parts[0] === 'open' && /^[\w-]+$/.test(id || '')) return out('drive', id);
  }
  return out('link', '');
}

async function fetchWithTimeout(url, ms = 5000, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, headers: { 'user-agent': 'TeachClubBot/1.0 (+link preview)', ...(init.headers || {}) } });
  } finally {
    clearTimeout(timer);
  }
}

async function oembed(endpoint) {
  try {
    const res = await fetchWithTimeout(endpoint);
    if (!res.ok) return {};
    const d = await res.json();
    return { title: String(d.title || ''), thumb: String(d.thumbnail_url || '') };
  } catch {
    return {};
  }
}

// Title and picture from a normal web page's <meta property="og:…"> tags.
async function openGraph(url) {
  try {
    const res = await fetchWithTimeout(url, 5000, { headers: { accept: 'text/html' } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('text/html')) return {};
    const html = (await res.text()).slice(0, 200000);
    const meta = (name) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, 'i'));
      return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : '';
    };
    const title = meta('og:title') || (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
    return { title: title.trim(), thumb: meta('og:image') };
  } catch {
    return {};
  }
}

// Short TikTok links (vm.tiktok.com/…) only reveal the real address after a redirect.
async function expandShortLink(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    if (!/^(vm|vt)\.tiktok\.com$/.test(u.hostname) && !(u.hostname.endsWith('tiktok.com') && u.pathname.startsWith('/t/'))) return raw;
    const res = await fetchWithTimeout(u.href, 5000, { redirect: 'follow' });
    return res.url || raw;
  } catch {
    return raw;
  }
}

async function videoInfo(raw) {
  const v = parseVideoUrl(await expandShortLink(raw));
  const enc = encodeURIComponent(v.url);
  let meta = {};
  if (v.provider === 'youtube') {
    meta = await oembed(`https://www.youtube.com/oembed?format=json&url=${enc}`);
    meta.thumb = `https://i.ytimg.com/vi/${v.embedId}/hqdefault.jpg`;
  } else if (v.provider === 'vimeo') meta = await oembed(`https://vimeo.com/api/oembed.json?url=${enc}`);
  else if (v.provider === 'tiktok') meta = await oembed(`https://www.tiktok.com/oembed?url=${enc}`);
  else if (v.provider === 'drive') meta = { thumb: `https://drive.google.com/thumbnail?id=${v.embedId}&sz=w640` };
  else if (v.provider === 'link') meta = await openGraph(v.url);
  const thumb = /^https:\/\//.test(meta.thumb || '') ? meta.thumb.slice(0, 1000) : '';
  return { ...v, title: (meta.title || '').slice(0, 100), thumb };
}

export async function previewVideo(request, env, me) {
  await rateLimit(env, `video-preview:${me.id}`, 60, 3600);
  const info = await videoInfo((await readJson(request)).url);
  return json({ video: info });
}

// ---------- videos ----------

async function videoFor(env, me, id) {
  const row = await env.DB.prepare(
    `SELECT ${VIDEO_COLS}, ${userCols('a', 'a_')}, m.role AS my_role
     FROM videos v JOIN users a ON a.id = v.user_id LEFT JOIN lessons l ON l.id = v.lesson_id
       LEFT JOIN club_members m ON m.club_id = v.club_id AND m.user_id = ?1
     WHERE v.id = ?2 AND (${VIDEO_VISIBLE} OR ?3 = 1 OR (m.role = 'admin' AND v.hidden = 1))`
  ).bind(me.id, id, isOwner(env, me) ? 1 : 0).first();
  if (!row) throw notFound();
  row.isMine = row.user_id === me.id;
  row.canModerate = row.my_role === 'admin' || isOwner(env, me);
  return row;
}

// scope: club (your current club), following (people you follow), all. user: one member's videos.
export async function listVideos(env, me, url) {
  const club = await currentClub(env, me);
  const scope = ['club', 'following', 'all'].includes(url.searchParams.get('scope')) ? url.searchParams.get('scope') : 'all';
  const userId = Number(url.searchParams.get('user')) || 0;
  const topic = TOPICS.includes(url.searchParams.get('topic')) ? url.searchParams.get('topic') : '';
  const before = Number(url.searchParams.get('before')) || 0;
  const where = [VIDEO_VISIBLE];
  const binds = [me.id];
  if (userId) {
    where.push('v.user_id = ?2');
    binds.push(userId);
  } else if (scope === 'club') {
    where.push('v.club_id = ?2');
    binds.push(club ? club.id : 0);
  } else if (scope === 'following') {
    where.push("(v.user_id = ?1 OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = v.user_id AND f.status = 'accepted'))");
  }
  if (topic) {
    where.push(`v.topic = ?${binds.length + 1}`);
    binds.push(topic);
  }
  if (before) {
    where.push(`v.id < ?${binds.length + 1}`);
    binds.push(before);
  }
  const { results } = await env.DB.prepare(
    `SELECT ${VIDEO_COLS}, ${userCols('a', 'a_')}
     FROM videos v JOIN users a ON a.id = v.user_id LEFT JOIN lessons l ON l.id = v.lesson_id
     WHERE ${where.join(' AND ')} ORDER BY v.id DESC LIMIT 30`
  ).bind(...binds).all();
  return json({ videos: results.map(videoOut), more: results.length === 30 });
}

export async function getVideo(env, me, id) {
  const row = await videoFor(env, me, id);
  const [comments, interested] = await env.DB.batch([
    env.DB.prepare(
      `SELECT c.id, c.body, c.created_at AS c_at, c.hidden, ${userCols('u', 'u_')} FROM video_comments c JOIN users u ON u.id = c.user_id
       WHERE c.video_id = ?1 AND u.banned = 0 AND (c.hidden = 0 OR c.user_id = ?2 OR ?3 = 1)
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = c.user_id AND b.blocked_id = ?2) OR (b.blocker_id = ?2 AND b.blocked_id = c.user_id))
       ORDER BY c.created_at LIMIT 300`
    ).bind(id, me.id, row.canModerate ? 1 : 0),
    env.DB.prepare(
      `SELECT ${userCols('u', 'u_')} FROM video_interest i JOIN users u ON u.id = i.user_id WHERE i.video_id = ? AND u.banned = 0 ORDER BY i.created_at DESC LIMIT 24`
    ).bind(id)
  ]);
  return json({
    video: {
      ...videoOut(row),
      isMine: row.isMine,
      canModerate: row.canModerate,
      comments: comments.results.map((c) => ({ id: c.id, body: c.body, at: c.c_at, hidden: !!c.hidden, author: userFrom(c, 'u_') })),
      interestedPeople: interested.results.map((u) => userFrom(u, 'u_'))
    }
  });
}

export async function createVideo(request, env, me) {
  if (isNewAccount(me)) throw new HttpError(403, 'New accounts can share videos after 3 days.');
  const b = await readJson(request);
  const info = await videoInfo(b.url);
  const title = text(b.title || info.title, 'Title', { max: 80, required: true });
  const caption = text(b.caption, 'Caption', { max: 500 });
  const topic = TOPICS.includes(b.topic) ? b.topic : '';
  await rateLimit(env, `videos:${me.id}`, 10, 86400); // counted only for valid posts
  const club = await currentClub(env, me);
  const visibility = !club || b.visibility === 'followers' ? 'followers' : 'club';
  const row = await env.DB.prepare(
    `INSERT INTO videos (user_id, club_id, visibility, url, provider, embed_id, vertical, title, caption, topic, thumb)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(me.id, club ? club.id : null, visibility, info.url, info.provider, info.embedId, info.vertical ? 1 : 0, title, caption, topic, info.thumb).first();
  return json({ id: row.id }, 201);
}

export async function deleteVideo(env, me, id) {
  const row = await videoFor(env, me, id);
  if (!row.isMine && !row.canModerate) throw new HttpError(403, 'Only the person who shared it can remove this.');
  await env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

// "I'd join a lesson on this."
export async function setInterest(env, me, id, on) {
  const row = await videoFor(env, me, id);
  if (row.isMine) throw new HttpError(400, "It's your video, so you're already in!");
  if (on) {
    const added = await env.DB.prepare('INSERT OR IGNORE INTO video_interest (video_id, user_id) VALUES (?, ?)').bind(id, me.id).run();
    if (added.meta.changes) {
      const again = await env.DB.prepare("SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND video_id = ? AND type = 'video_interest'").bind(row.user_id, me.id, id).first();
      if (!again) await notify(env, row.user_id, { type: 'video_interest', actor: me.id, videoId: id });
    }
  } else {
    await env.DB.prepare('DELETE FROM video_interest WHERE video_id = ? AND user_id = ?').bind(id, me.id).run();
  }
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM video_interest WHERE video_id = ?').bind(id).first();
  return json({ interested: on, interestCount: n.n });
}

// ---------- comments ----------

export async function addComment(request, env, me, id) {
  const row = await videoFor(env, me, id);
  await rateLimit(env, `comments:${me.id}`, 30, 3600);
  const body = text((await readJson(request)).body, 'Comment', { max: 500, required: true });
  if (isNewAccount(me) && hasLink(body)) throw new HttpError(400, "New accounts can't add links yet. Try again in a few days.");
  await env.DB.prepare('INSERT INTO video_comments (video_id, user_id, body) VALUES (?, ?, ?)').bind(id, me.id, body).run();
  await notify(env, row.user_id, { type: 'video_comment', actor: me.id, videoId: id });
  return json({ ok: true }, 201);
}

export async function deleteComment(env, me, commentId) {
  const c = await env.DB.prepare('SELECT user_id, video_id FROM video_comments WHERE id = ?').bind(commentId).first();
  if (!c) throw new HttpError(404, 'Not found.');
  const video = await videoFor(env, me, c.video_id);
  if (c.user_id !== me.id && !video.isMine && !video.canModerate) throw new HttpError(403, 'Only the person who wrote it can remove this.');
  await env.DB.prepare('DELETE FROM video_comments WHERE id = ?').bind(commentId).run();
  return json({ ok: true });
}

// ---------- reports (called from createReport) ----------

// Returns the club a video/comment report belongs to (null = follower-only video, for the site owner).
export async function reportTarget(env, me, b) {
  if (b.commentId) {
    const c = await env.DB.prepare('SELECT video_id FROM video_comments WHERE id = ?').bind(Number(b.commentId)).first();
    if (!c) throw new HttpError(404, 'Not found.');
    const v = await videoFor(env, me, c.video_id);
    return { clubId: v.club_id, videoId: null, commentId: Number(b.commentId) };
  }
  const v = await videoFor(env, me, Number(b.videoId));
  if (v.isMine) throw new HttpError(400, "You can't do that to yourself.");
  return { clubId: v.club_id, videoId: v.id, commentId: null };
}

export async function autoHide(env, { videoId, commentId }) {
  if (videoId) {
    await env.DB.prepare('UPDATE videos SET hidden = 1 WHERE id = ?1 AND (SELECT COUNT(DISTINCT reporter_id) FROM reports WHERE video_id = ?1 AND resolved = 0) >= ?2')
      .bind(videoId, AUTO_HIDE_REPORTS).run();
  }
  if (commentId) {
    await env.DB.prepare('UPDATE video_comments SET hidden = 1 WHERE id = ?1 AND (SELECT COUNT(DISTINCT reporter_id) FROM reports WHERE comment_id = ?1 AND resolved = 0) >= ?2')
      .bind(commentId, AUTO_HIDE_REPORTS).run();
  }
}

// Reviewed and kept: hidden videos and comments come back once no reports are left open.
export async function unhideAfterReview(env, reportId) {
  await env.DB.batch([
    env.DB.prepare('UPDATE videos SET hidden = 0 WHERE id = (SELECT video_id FROM reports WHERE id = ?1) AND NOT EXISTS (SELECT 1 FROM reports WHERE video_id = videos.id AND resolved = 0)').bind(reportId),
    env.DB.prepare('UPDATE video_comments SET hidden = 0 WHERE id = (SELECT comment_id FROM reports WHERE id = ?1) AND NOT EXISTS (SELECT 1 FROM reports WHERE comment_id = video_comments.id AND resolved = 0)').bind(reportId)
  ]);
}

// ---------- suggestions ----------

// A few recent videos for the "For you" row: topics you like, people you follow, and what others want lessons on.
export async function suggestedVideos(env, me) {
  const interests = parseJson(me.interests, []);
  const { results } = await env.DB.prepare(
    `SELECT ${VIDEO_COLS}, ${userCols('a', 'a_')},
       EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = v.user_id AND f.status = 'accepted') AS follow_author
     FROM videos v JOIN users a ON a.id = v.user_id LEFT JOIN lessons l ON l.id = v.lesson_id
     WHERE v.user_id != ?1 AND v.created_at > datetime('now', '-30 days') AND ${VIDEO_VISIBLE}
     ORDER BY v.id DESC LIMIT 100`
  ).bind(me.id).all();
  return results
    .filter((r) => !r.my_interest)
    .map((r) => {
      const reasons = [];
      let score = 0;
      if (interests.includes(r.topic)) { score += 3; reasons.push({ kind: 'topic', topic: r.topic }); }
      if (r.follow_author) { score += 2; reasons.push({ kind: 'following', name: userFrom(r, 'a_').firstName }); }
      if (r.interest_count >= 3) { score += 1; reasons.push({ kind: 'wanted', n: r.interest_count }); }
      return { video: videoOut(r), score, reasons: reasons.slice(0, 1) };
    })
    .filter((s) => s.score >= 2)
    .sort((a, b) => b.score - a.score || b.video.id - a.video.id)
    .slice(0, 4);
}

// "People to follow": club members you don't follow yet, people who follow you, and teachers of topics you like.
export async function suggestedPeople(env, me) {
  const interests = parseJson(me.interests, []);
  const club = await currentClub(env, me);
  const notYet = `u.id != ?1 AND u.banned = 0
    AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ?1 AND f.followee_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = u.id AND b.blocked_id = ?1) OR (b.blocker_id = ?1 AND b.blocked_id = u.id))`;
  const topicTeachers = interests.length
    ? `SELECT DISTINCT l.host_id AS id, 'topic' AS why FROM lessons l, json_each(l.tags) t
       WHERE t.value IN (${interests.map((_, i) => `?${i + 3}`).join(', ')}) AND l.hidden = 0 AND l.archived = 0
       UNION ALL SELECT DISTINCT v.user_id, 'topic' FROM videos v WHERE v.hidden = 0 AND v.topic IN (${interests.map((_, i) => `?${i + 3}`).join(', ')})`
    : 'SELECT NULL AS id, NULL AS why WHERE 0';
  const { results } = await env.DB.prepare(
    `WITH c AS (
       SELECT follower_id AS id, 'follows_you' AS why FROM follows WHERE followee_id = ?1 AND status = 'accepted'
       UNION ALL SELECT user_id, 'club' FROM club_members WHERE club_id = ?2
       UNION ALL ${topicTeachers}
     )
     SELECT ${userCols('u', 'u_')}, group_concat(DISTINCT c.why) AS whys
     FROM c JOIN users u ON u.id = c.id WHERE ${notYet}
       -- only people you could actually see: in a club with you, or who'd share with followers
       AND (EXISTS (SELECT 1 FROM club_members x JOIN club_members y ON y.club_id = x.club_id WHERE x.user_id = ?1 AND y.user_id = u.id)
            OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.followee_id = ?1)
            OR EXISTS (SELECT 1 FROM lessons l WHERE l.host_id = u.id AND l.visibility = 'followers')
            OR EXISTS (SELECT 1 FROM videos v WHERE v.user_id = u.id AND v.visibility = 'followers'))
     GROUP BY u.id LIMIT 60`
  ).bind(me.id, club ? club.id : 0, ...interests).all();
  const points = { follows_you: 3, topic: 2, club: 1 };
  const people = results
    .map((r) => {
      const whys = String(r.whys || '').split(',').filter(Boolean).sort((a, b) => points[b] - points[a]);
      return { user: userFrom(r, 'u_'), reason: whys[0], score: whys.reduce((s, w) => s + points[w], 0) };
    })
    .sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name))
    .slice(0, 12);
  return json({ people });
}
