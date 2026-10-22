// Teach Club server. Runs on Cloudflare Workers; data lives in D1 (env.DB).
// /api/* is handled here; lesson and invite pages get link previews; everything else is the
// website in ./public. Every 15 minutes Cloudflare also runs the reminder emails.

import { HttpError, json, messageFor, isId, currentUser } from './lib.js';
import { signup, login, logout, getMe, updateMe, deleteMe, forgot, resetPassword, getProfile, getUserPhoto } from './accounts.js';
import { listClubs, createClub, switchClub, clubDetail, renameClub, newInvite, setRole, removeMember, invitePreview, joinByInvite, createReport, resolveReport } from './clubs.js';
import {
  listLessons, getLesson, createLesson, updateLesson, deleteLesson, setRsvp, saveNote,
  askQuestion, answerQuestion, deleteQuestion, saveRecap, addPhoto, getLessonPhoto, deletePhoto, wrapped, archiveLesson, forYou
} from './lessons.js';
import { follow, unfollow, listFollows, acceptFollower, removeFollower, block, unblock, ownerReports, setBanned } from './social.js';
import { listWishes, createWish, getWish, voteWish, deleteWish } from './wishes.js';
import { listVideos, createVideo, previewVideo, getVideo, deleteVideo, setInterest, addComment, deleteComment, suggestedPeople } from './videos.js';
import { listNotifications, markAllRead, unreadCount } from './notify.js';
import { sendReminders } from './reminders.js';
import { pageWithPreview } from './previews.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (request.method === 'GET' && /^\/(lesson|join)\//.test(url.pathname)) return pageWithPreview(request, env, url);
      return env.ASSETS.fetch(request);
    }
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: messageFor(err, request) }, err.status);
      console.error(err);
      return json({ error: messageFor(new HttpError(500, 'Something went wrong on our side. Please try again.'), request) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendReminders(env));
  }
};

async function route(request, env, url) {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) throw new HttpError(403, 'Blocked a cross-site request.');
  }
  const [a, b, c, d, extra] = url.pathname.replace(/\/+$/, '').split('/').slice(2);
  if (extra !== undefined) throw new HttpError(404, 'Not found.');
  const is = (m) => method === m;

  // No log-in needed.
  if (a === 'signup' && !b && is('POST')) return signup(request, env);
  if (a === 'login' && !b && is('POST')) return login(request, env);
  if (a === 'logout' && !b && is('POST')) return logout(request, env);
  if (a === 'forgot' && !b && is('POST')) return forgot(request, env, url);
  if (a === 'reset' && !b && is('POST')) return resetPassword(request, env);
  if (a === 'invites' && b && !c && is('GET')) return invitePreview(env, b);
  if (a === 'config' && !b && is('GET')) return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY || null });

  const me = await currentUser(request, env);
  if (!me) throw new HttpError(401, 'Please log in first.');

  if (a === 'me' && !b) {
    if (is('GET')) return getMe(request, env, me);
    if (is('PUT')) return updateMe(request, env, me);
    if (is('DELETE')) return deleteMe(request, env, me);
  }
  if (a === 'users' && isId(b)) {
    const id = Number(b);
    if (!c && is('GET')) return getProfile(env, me, id);
    if (c === 'photo' && is('GET')) return getUserPhoto(env, me, id);
    if (c === 'follow' && is('POST')) return follow(env, me, id);
    if (c === 'follow' && is('DELETE')) return unfollow(env, me, id);
    if (c === 'block' && is('POST')) return block(env, me, id);
    if (c === 'block' && is('DELETE')) return unblock(env, me, id);
  }
  if (a === 'follows') {
    if (!b && is('GET')) return listFollows(env, me);
    if (isId(b) && c === 'accept' && is('POST')) return acceptFollower(env, me, Number(b));
    if (isId(b) && !c && is('DELETE')) return removeFollower(env, me, Number(b));
  }
  if (a === 'owner') {
    if (b === 'reports' && !c && is('GET')) return ownerReports(env, me);
    if (b === 'users' && isId(c) && d === 'ban' && is('POST')) return setBanned(env, me, Number(c), true);
    if (b === 'users' && isId(c) && d === 'ban' && is('DELETE')) return setBanned(env, me, Number(c), false);
  }
  if (a === 'for-you' && !b && is('GET')) return forYou(env, me);
  if (a === 'people' && b === 'suggested' && !c && is('GET')) return suggestedPeople(env, me);

  if (a === 'notifications' && !b && is('GET')) return listNotifications(env, me);
  if (a === 'notifications' && b === 'unread' && !c && is('GET')) return json({ unread: await unreadCount(env, me) });
  if (a === 'notifications' && b === 'read' && !c && is('POST')) return markAllRead(env, me);

  if (a === 'videos') {
    if (!b && is('GET')) return listVideos(env, me, url);
    if (!b && is('POST')) return createVideo(request, env, me);
    if (b === 'preview' && !c && is('POST')) return previewVideo(request, env, me);
    if (isId(b)) {
      const id = Number(b);
      if (!c && is('GET')) return getVideo(env, me, id);
      if (!c && is('DELETE')) return deleteVideo(env, me, id);
      if (c === 'interest' && !d && is('POST')) return setInterest(env, me, id, true);
      if (c === 'interest' && !d && is('DELETE')) return setInterest(env, me, id, false);
      if (c === 'comments' && !d && is('POST')) return addComment(request, env, me, id);
    }
  }
  if (a === 'comments' && isId(b) && !c && is('DELETE')) return deleteComment(env, me, Number(b));
  if (a === 'invites' && b && c === 'join' && is('POST')) return joinByInvite(env, me, b);

  if (a === 'clubs') {
    if (!b && is('GET')) return listClubs(env, me);
    if (!b && is('POST')) return createClub(request, env, me);
    if (b === 'current' && !c && is('GET')) return clubDetail(env, me);
    if (isId(b)) {
      const id = Number(b);
      if (c === 'switch' && is('POST')) return switchClub(env, me, id);
      if (!c && is('PUT')) return renameClub(request, env, me, id);
      if (c === 'invite' && is('POST')) return newInvite(env, me, id);
      if (c === 'members' && isId(d)) {
        if (is('DELETE')) return removeMember(env, me, id, Number(d));
        if (is('PUT')) return setRole(request, env, me, id, Number(d));
      }
    }
  }

  if (a === 'reports') {
    if (!b && is('POST')) return createReport(request, env, me);
    if (isId(b) && c === 'resolve' && is('POST')) return resolveReport(env, me, Number(b));
  }

  if (a === 'wishes') {
    if (!b && is('GET')) return listWishes(env, me);
    if (!b && is('POST')) return createWish(request, env, me);
    if (isId(b)) {
      const id = Number(b);
      if (!c && is('GET')) return getWish(env, me, id);
      if (!c && is('DELETE')) return deleteWish(env, me, id);
      if (c === 'vote' && is('POST')) return voteWish(env, me, id, true);
      if (c === 'vote' && is('DELETE')) return voteWish(env, me, id, false);
    }
  }

  if (a === 'questions' && isId(b) && !c) {
    if (is('PUT')) return answerQuestion(request, env, me, Number(b));
    if (is('DELETE')) return deleteQuestion(env, me, Number(b));
  }

  if (a === 'wrapped' && !b && is('GET')) return wrapped(env, me, url);

  if (a === 'lessons') {
    if (!b) {
      if (is('GET')) return listLessons(env, me, url);
      if (is('POST')) return createLesson(request, env, me);
    } else if (isId(b)) {
      const id = Number(b);
      if (!c) {
        if (is('GET')) return getLesson(env, me, id);
        if (is('PUT')) return updateLesson(request, env, me, id);
        if (is('DELETE')) return deleteLesson(env, me, id);
      }
      if (c === 'rsvp' && !d && is('POST')) return setRsvp(env, me, id, true);
      if (c === 'rsvp' && !d && is('DELETE')) return setRsvp(env, me, id, false);
      if (c === 'note' && !d && is('PUT')) return saveNote(request, env, me, id);
      if (c === 'questions' && !d && is('POST')) return askQuestion(request, env, me, id);
      if (c === 'recap' && !d && is('PUT')) return saveRecap(request, env, me, id);
      if (c === 'archive' && !d && is('PUT')) return archiveLesson(request, env, me, id);
      if (c === 'photos' && !d && is('POST')) return addPhoto(request, env, me, id);
      if (c === 'photos' && isId(d) && is('GET')) return getLessonPhoto(env, me, id, Number(d));
      if (c === 'photos' && isId(d) && is('DELETE')) return deletePhoto(env, me, id, Number(d));
    }
  }
  throw new HttpError(404, 'Not found.');
}
