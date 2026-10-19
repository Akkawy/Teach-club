// Clubs: start or join one (/clubs/start), the club page (/club) and invite links (/join/:code).

import { html } from '../html.js';
import { api } from '../api.js';
import { app, navigate, render, pendingInvite } from '../core.js';
import { t, tp } from '../i18n.js';
import { avatar, icon, bottomNav, toast, busy, showError, langToggle, brand } from '../ui.js';

const inviteUrl = (code) => `${location.origin}/join/${code}`;

function codeFrom(input) {
  const s = String(input || '').trim();
  const m = /\/join\/([a-z0-9]{4,20})\/?$/i.exec(s) || /^([a-z0-9]{4,20})$/i.exec(s);
  return m ? m[1].toLowerCase() : null;
}

// ---------- start or join ----------

export const clubStart = {
  title: () => t('club.startTitle'),
  view: () => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">${brand()}${langToggle()}</div>
  <div class="stack-8">
    <h1 class="display h-34">${t('club.startHeading')}</h1>
    <p class="lede">${t('club.startLede')}</p>
  </div>

  <form class="card pad-18 stack-12" data-submit="create" novalidate>
    <h2 class="display h-20 row gap-8">${icon('users', 22)}${t('club.createTitle')}</h2>
    <p class="form-error" id="create-error" role="alert" hidden></p>
    <input class="input" name="name" maxlength="40" dir="auto" placeholder="${t('club.namePh')}" aria-label="${t('club.createTitle')}" required>
    <button class="btn btn-primary btn-lg" type="submit">${t('club.create')}</button>
  </form>

  <form class="card pad-18 stack-12" data-submit="join" novalidate>
    <h2 class="display h-20 row gap-8">${icon('link', 22)}${t('club.joinTitle')}</h2>
    <p class="form-error" id="join-error" role="alert" hidden></p>
    <input class="input" name="code" dir="ltr" autocomplete="off" placeholder="${t('club.joinPh')}" aria-label="${t('club.joinTitle')}" required>
    <button class="btn btn-secondary btn-lg" type="submit">${t('club.join')}</button>
  </form>
</main>`,
  actions: {
    async create(s, form) {
      const name = String(new FormData(form).get('name') || '').trim();
      if (!name) return showError('create-error', t('club.namePh'));
      const button = form.querySelector('[type=submit]');
      busy(button, true, t('club.creating'));
      try {
        const { club } = await api('/clubs', { method: 'POST', body: { name } });
        app.club = club;
        navigate('/club', { replace: true });
      } catch (err) {
        busy(button, false);
        showError('create-error', err.message);
      }
    },
    join(s, form) {
      const code = codeFrom(new FormData(form).get('code'));
      if (!code) return showError('join-error', t('club.badCode'));
      navigate(`/join/${code}`);
    }
  }
};

// ---------- invite link ----------

export const join = {
  title: () => t('club.joinTitlePage'),
  public: true,
  async load({ params }) {
    const code = params[0].toLowerCase();
    try {
      const { club } = await api(`/invites/${code}`);
      if (!app.me) pendingInvite(code); // join automatically after signing up or logging in
      return { code, club };
    } catch (err) {
      if (err.status !== 404) throw err;
      pendingInvite(null);
      return { code, bad: true };
    }
  },
  view: (s) => html`
<main class="screen pad-auth gap-22">
  <div class="row-between">${brand()}${langToggle()}</div>
  ${s.bad
    ? html`<div class="center-col stack-14 pt-12">
        <h1 class="display h-30">${t('club.badInvite')}</h1>
        <a class="btn btn-primary btn-md" href="/">${t('common.backToCalendar')}</a>
      </div>`
    : html`<div class="center-col stack-14 pt-12">
        <span class="club-badge">${icon('users', 40)}</span>
        <h1 class="display h-30">${t('club.joinHeading', { club: s.club.name })}</h1>
        <p class="lede">${t('club.joinLede', { members: tp('members', s.club.members) })}</p>
      </div>
      <div class="mt-auto stack-12">
        ${app.me
          ? html`<button class="btn btn-primary btn-lg" data-action="join">${t('club.joinButton')}</button>`
          : html`<p class="small muted center">${t('club.needAccount')}</p>
            <a class="btn btn-primary btn-lg" href="/signup">${t('club.signup')}</a>
            <a class="btn btn-secondary btn-lg" href="/login">${t('club.login')}</a>`}
      </div>`}
</main>`,
  actions: {
    async join(s, button) {
      busy(button, true, t('club.joining'));
      const { club } = await api(`/invites/${s.code}/join`, { method: 'POST' });
      app.club = club;
      pendingInvite(null);
      toast(t('club.joined', { club: club.name }));
      navigate('/', { replace: true });
    }
  }
};

// ---------- the club page ----------

function memberRow(s, m) {
  const isMe = m.user.id === app.me.id;
  const admin = m.role === 'admin';
  return html`<li class="card member-row">
    <a href="/u/${m.user.id}" class="member-main">
      ${avatar(m.user, 44, { font: 15 })}
      <span class="grow stack-2 min0">
        <span class="row gap-6 wrap"><strong><bdi>${m.user.name}</bdi></strong>${isMe ? html`<span class="small muted">${t('club.youTag')}</span>` : ''}${admin ? html`<span class="tag">${t('club.admin')}</span>` : ''}</span>
        ${m.user.bio ? html`<span class="small muted clamp-2" dir="auto">${m.user.bio}</span>` : ''}
      </span>
    </a>
    ${s.isAdmin && !isMe ? html`<div class="member-tools">
      <button class="chip-btn" data-action="role" data-id="${m.user.id}" data-role="${admin ? 'member' : 'admin'}">${admin ? t('club.removeAdmin') : t('club.makeAdmin')}</button>
      <button class="chip-btn danger" data-action="removeMember" data-id="${m.user.id}" data-name="${m.user.name}">${t('club.remove')}</button>
    </div>` : ''}
  </li>`;
}

function reportCard(r) {
  return html`<li class="card pad-16 stack-8">
    <strong>${t(`report.reasons.${r.reason}`)}</strong>
    ${r.lesson ? html`<a href="/lesson/${r.lesson.id}" class="small">${t('club.reportOn', { title: r.lesson.title })}</a>` : ''}
    ${r.member ? html`<a href="/u/${r.member.id}" class="small">${t('club.reportOnMember', { name: r.member.name })}</a>` : ''}
    ${r.details ? html`<p class="body-3 pre-line" dir="auto">${r.details}</p>` : ''}
    ${r.reporter ? html`<span class="tiny muted">${t('club.reportBy', { name: r.reporter })}</span>` : ''}
    <div class="row gap-8 wrap">
      <button class="chip-btn" data-action="resolve" data-id="${r.id}">${icon('check', 16, 2.4)}${t('club.resolve')}</button>
      ${r.lesson ? html`<button class="chip-btn danger" data-action="deleteLesson" data-id="${r.lesson.id}" data-report="${r.id}">${icon('trash', 16)}${t('club.deleteLesson')}</button>` : ''}
    </div>
  </li>`;
}

export const club = {
  title: (s) => s.club.name,
  needsClub: true,
  async load() {
    const [detail, list] = await Promise.all([api('/clubs/current'), api('/clubs')]);
    app.club = { id: detail.club.id, name: detail.club.name, role: detail.club.role };
    return { ...detail, clubs: list.clubs };
  },
  view(s) {
    const c = s.club;
    const year = new Date().getFullYear();
    return html`
<div class="screen with-nav">
  <header class="club-head">
    <span class="club-badge small">${icon('users', 28)}</span>
    <div class="grow min0">
      <h1 class="display h-28"><bdi>${c.name}</bdi></h1>
      <p class="small muted">${tp('members', s.members.length)}</p>
    </div>
    ${s.isAdmin ? html`<button class="pill-btn" data-action="rename">${icon('pencil', 16)}${t('club.rename')}</button>` : ''}
  </header>

  <main class="lesson-main">
    <section class="card pad-18 stack-12">
      <h2 class="display h-19 row gap-8">${icon('mail', 22)}${t('club.invite')}</h2>
      <p class="body-3">${t('club.inviteBody', { club: c.name })}</p>
      <div class="invite-box" dir="ltr">${inviteUrl(c.inviteCode)}</div>
      <div class="row gap-8 wrap">
        <button class="btn btn-primary btn-sm" data-action="copy">${icon('copy', 18)}${t('club.copy')}</button>
        ${navigator.share ? html`<button class="btn btn-secondary btn-sm" data-action="share">${icon('share', 18)}${t('club.share')}</button>` : ''}
        ${s.isAdmin ? html`<button class="btn btn-ghost btn-sm" data-action="newLink">${icon('refresh', 18)}${t('club.newLink')}</button>` : ''}
      </div>
    </section>

    <a class="card wrapped-link" href="/wrapped">
      <span class="soft-square">${icon('trophy', 22)}</span>
      <strong class="grow">${t('club.wrapped', { year })}</strong>
      ${icon('chevronRight', 18, 2.2)}
    </a>

    ${s.isAdmin ? html`<section class="stack-10">
      <h2 class="display h-19 pad-x-4 row gap-8">${icon('flag', 20)}${t('club.reports')}</h2>
      ${s.reports.length ? html`<ul class="plain stack-10">${s.reports.map(reportCard)}</ul>` : html`<p class="empty-note">${t('club.noReports')}</p>`}
    </section>` : ''}

    <section class="stack-10">
      <h2 class="display h-19 pad-x-4">${t('club.members')}</h2>
      <ul class="plain stack-8">${s.members.map((m) => memberRow(s, m))}</ul>
    </section>

    <section class="stack-10">
      <h2 class="display h-19 pad-x-4">${t('club.yourClubs')}</h2>
      <ul class="plain stack-8">
        ${s.clubs.map((x) => html`<li class="card club-row">
          <span class="grow min0 stack-2"><strong><bdi>${x.name}</bdi></strong><span class="small muted">${tp('members', x.members)}</span></span>
          ${x.current ? html`<span class="tag ok">${t('club.current')}</span>` : html`<button class="chip-btn" data-action="switch" data-id="${x.id}" data-name="${x.name}">${t('club.switchTo')}</button>`}
        </li>`)}
      </ul>
      <a class="btn btn-secondary btn-md" href="/clubs/start">${icon('plus', 18)}${t('club.another')}</a>
    </section>

    <button class="btn btn-danger btn-md" data-action="leave">${icon('door', 18)}${t('club.leave')}</button>
  </main>

  ${bottomNav('club')}
</div>`;
  },
  actions: {
    async copy(s) {
      try {
        await navigator.clipboard.writeText(inviteUrl(s.club.inviteCode));
        toast(t('club.copied'));
      } catch {
        toast(inviteUrl(s.club.inviteCode));
      }
    },
    async share(s) {
      try {
        await navigator.share({ title: s.club.name, text: t('club.shareText', { club: s.club.name }), url: inviteUrl(s.club.inviteCode) });
      } catch {
        // closed the share sheet
      }
    },
    async newLink(s) {
      if (!window.confirm(t('club.newLinkConfirm'))) return;
      const { inviteCode } = await api(`/clubs/${s.club.id}/invite`, { method: 'POST' });
      s.club.inviteCode = inviteCode;
      render();
      toast(t('club.newLinkDone'));
    },
    async rename(s) {
      const name = window.prompt(t('club.renamePrompt'), s.club.name);
      if (!name || !name.trim() || name.trim() === s.club.name) return;
      await api(`/clubs/${s.club.id}`, { method: 'PUT', body: { name: name.trim() } });
      toast(t('club.renamed'));
      navigate('/club', { replace: true });
    },
    async role(s, el) {
      await api(`/clubs/${s.club.id}/members/${el.dataset.id}`, { method: 'PUT', body: { role: el.dataset.role } });
      navigate('/club', { replace: true });
    },
    async removeMember(s, el) {
      if (!window.confirm(t('club.removeConfirm', { name: el.dataset.name, club: s.club.name }))) return;
      await api(`/clubs/${s.club.id}/members/${el.dataset.id}`, { method: 'DELETE' });
      toast(t('club.removed'));
      navigate('/club', { replace: true });
    },
    async leave(s) {
      if (!window.confirm(t('club.leaveConfirm', { club: s.club.name }))) return;
      await api(`/clubs/${s.club.id}/members/${app.me.id}`, { method: 'DELETE' });
      const { club: next } = await api('/me');
      app.club = next;
      toast(t('club.left'));
      navigate(next ? '/' : '/clubs/start', { replace: true });
    },
    async switch(s, el) {
      const { club: next } = await api(`/clubs/${el.dataset.id}/switch`, { method: 'POST' });
      app.club = next;
      toast(t('club.switched', { club: el.dataset.name }));
      navigate('/', { replace: true });
    },
    async resolve(s, el) {
      await api(`/reports/${el.dataset.id}/resolve`, { method: 'POST' });
      toast(t('club.resolved'));
      navigate('/club', { replace: true });
    },
    async deleteLesson(s, el) {
      if (!window.confirm(t('club.deleteLessonConfirm'))) return;
      await api(`/lessons/${el.dataset.id}`, { method: 'DELETE' }); // its reports go with it
      toast(t('lesson.cancelled'));
      navigate('/club', { replace: true });
    }
  }
};
