// Emails, sent through Resend (free plan: 100 a day). Every email comes in English or Arabic.
// With MAIL_DEV_LOG=1 (local testing only) emails are printed to the terminal instead of sent.

import { HttpError } from './lib.js';

export const DAILY_EMAIL_CAP = 90; // stay under Resend's free 100/day

export const canEmail = (env) => !!env.RESEND_API_KEY || env.MAIL_DEV_LOG === '1';

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function sendEmail(env, { to, subject, html, text }) {
  if (env.MAIL_DEV_LOG === '1') {
    console.log(`[dev] email to ${to}: ${subject}\n${text}`);
    return true;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'Teach Club <noreply@club.kathib.sa>', to: [to], subject, html, text })
  });
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return false;
  }
  return true;
}

// One card with a heading, a few lines, an optional button and small print. All values are escaped here.
function layout({ ar, heading, lines, button, small }) {
  const dir = ar ? 'rtl' : 'ltr';
  const body = lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4A433D">${escapeHtml(l)}</p>`).join('');
  const btn = button
    ? `<a href="${escapeHtml(button.href)}" style="display:inline-block;margin-top:8px;background:#CC4A14;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 22px;border-radius:14px">${escapeHtml(button.label)}</a>`
    : '';
  const fine = small.length ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6E655D">${small.map(escapeHtml).join('<br>')}</p>` : '';
  const html = `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${dir}"><body style="margin:0;background:#F5F3F0;font-family:Arial,Helvetica,sans-serif;color:#221D19">
<div style="max-width:480px;margin:0 auto;padding:32px 20px" dir="${dir}">
  <div style="font-size:20px;font-weight:bold;margin-bottom:24px">Teach Club</div>
  <div style="background:#FFFFFF;border:1px solid #ECE6DF;border-radius:20px;padding:24px">
    <p style="margin:0 0 12px;font-size:17px;font-weight:bold">${escapeHtml(heading)}</p>${body}${btn}${fine}
  </div>
</div></body></html>`;
  const text = [heading, '', ...lines, ...(button ? ['', `${button.label}: ${button.href}`] : []), '', ...small].join('\n');
  return { html, text };
}

const firstName = (name) => name.trim().split(/\s+/)[0] || name;

export async function sendResetEmail(env, user, link, ar, minutes) {
  const t = ar
    ? {
      subject: 'رابط تغيير كلمة المرور في Teach Club',
      heading: `أهلًا ${firstName(user.name)}،`,
      line: 'طلب أحدهم تغيير كلمة المرور لحسابك في Teach Club. اضغط على الزر لاختيار كلمة مرور جديدة.',
      button: 'اختر كلمة مرور جديدة',
      small: [`يعمل الرابط لمدة ${minutes} دقيقة ولمرة واحدة فقط.`, 'إن لم تطلب ذلك، تجاهل هذه الرسالة وستبقى كلمة مرورك كما هي.']
    }
    : {
      subject: 'Your Teach Club password link',
      heading: `Hi ${firstName(user.name)},`,
      line: 'Someone asked to change the password for your Teach Club account. Tap the button to choose a new one.',
      button: 'Choose a new password',
      small: [`The link works once, for ${minutes} minutes.`, "Didn't ask for this? Just ignore this email and your password stays the same."]
    };
  const { html, text } = layout({ ar, heading: t.heading, lines: [t.line], button: { label: t.button, href: link }, small: t.small });
  const ok = await sendEmail(env, { to: user.email, subject: t.subject, html, text });
  if (!ok) throw new HttpError(502, "We couldn't send the email right now. Please try again in a few minutes.");
}

function whenText(startsAt, tz, ar) {
  return new Intl.DateTimeFormat(ar ? 'ar-u-nu-latn' : 'en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true
  }).format(new Date(startsAt));
}

// kind: 'day' (about a day before) or 'soon' (about 15 minutes before). isHost changes the wording.
export async function sendReminderEmail(env, { user, lesson, kind, isHost, callLink, appUrl }) {
  const ar = user.lang === 'ar';
  const when = whenText(lesson.starts_at, user.tz, ar);
  const lessonUrl = `${appUrl}/lesson/${lesson.id}`;
  const settings = `${appUrl}/profile/edit`;
  let subject;
  let lines;
  let button;
  if (ar) {
    subject = kind === 'soon' ? `يبدأ قريبًا: ${lesson.title}` : `غدًا: ${lesson.title}`;
    lines = isHost
      ? [kind === 'soon' ? 'درسك يبدأ خلال دقائق. بالتوفيق!' : 'تذكير بأنك تقدّم درسًا غدًا.', `الموعد: ${when}`]
      : [kind === 'soon' ? 'الدرس الذي أكدت حضوره يبدأ خلال دقائق.' : 'تذكير بالدرس الذي أكدت حضوره غدًا.', `الموعد: ${when}`];
    if (lesson.place) lines.push(`المكان: ${lesson.place}`, ...(lesson.mapLink ? [`الخريطة: ${lesson.mapLink}`] : []));
    if (isHost && callLink) lines.push(`رابط المكالمة: ${callLink}`);
    button = kind === 'soon' && callLink ? { label: 'انضم إلى المكالمة', href: callLink } : { label: 'عرض الدرس', href: lessonUrl };
  } else {
    subject = kind === 'soon' ? `Starting soon: ${lesson.title}` : `Tomorrow: ${lesson.title}`;
    lines = isHost
      ? [kind === 'soon' ? 'Your lesson starts in a few minutes. Good luck!' : "Quick reminder: you're teaching tomorrow.", `When: ${when}`]
      : [kind === 'soon' ? 'The lesson you said yes to starts in a few minutes.' : 'Quick reminder about the lesson you said yes to.', `When: ${when}`];
    if (lesson.place) lines.push(`Where: ${lesson.place}`, ...(lesson.mapLink ? [`Map: ${lesson.mapLink}`] : []));
    if (isHost && callLink) lines.push(`Call link: ${callLink}`);
    button = kind === 'soon' && callLink ? { label: 'Join the call', href: callLink } : { label: 'See the lesson', href: lessonUrl };
  }
  const small = ar ? ['لا تريد التذكيرات؟ أوقفها من «تعديل الملف»:', settings] : ["Don't want reminders? Turn them off in Edit profile:", settings];
  const { html, text } = layout({ ar, heading: lesson.title, lines, button, small });
  return sendEmail(env, { to: user.email, subject, html, text });
}
