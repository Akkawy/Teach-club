// Link previews: when a lesson or club invite is shared in WhatsApp, iMessage, etc., the app page
// gets a title, a short line and a picture. Only the title, format and time are shown, never who's
// teaching, the call link or anything else inside the club.

const LABELS = { talk: 'Talk', demo: 'Live demo', disc: 'Discussion', show: 'Show-and-tell', read: 'Read-and-react' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function metaFor(env, url) {
  const lesson = /^\/lesson\/(\d{1,10})(?:\/|$)/.exec(url.pathname);
  if (lesson) {
    const row = await env.DB.prepare('SELECT title, format, starts_at, tz FROM lessons WHERE id = ?').bind(Number(lesson[1])).first();
    if (!row) return null;
    const when = new Intl.DateTimeFormat('en-GB', {
      timeZone: row.tz, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short'
    }).format(new Date(row.starts_at));
    return { title: row.title, description: `${LABELS[row.format] || 'Lesson'} · ${when} · on Teach Club`, image: `/og/${row.format}.png` };
  }
  const invite = /^\/join\/([a-z0-9]{4,20})$/.exec(url.pathname);
  if (invite) {
    const club = await env.DB.prepare('SELECT name FROM clubs WHERE invite_code = ?').bind(invite[1]).first();
    if (!club) return null;
    return { title: `Join ${club.name} on Teach Club`, description: 'Friends teaching friends, a few minutes at a time.', image: '/og/default.png' };
  }
  return null;
}

export async function pageWithPreview(request, env, url) {
  const page = await env.ASSETS.fetch(new Request(new URL('/', url), { headers: request.headers }));
  let meta = null;
  try {
    meta = await metaFor(env, url);
  } catch (err) {
    console.error('preview failed', err);
  }
  if (!meta) return page;
  const image = new URL(meta.image, url).href;
  const tags = [
    ['og:type', 'website'], ['og:site_name', 'Teach Club'], ['og:title', meta.title], ['og:description', meta.description],
    ['og:image', image], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:url', url.href]
  ].map(([p, c]) => `<meta property="${p}" content="${esc(c)}">`).join('')
    + `<meta name="twitter:card" content="summary_large_image"><meta name="description" content="${esc(meta.description)}">`;
  return new HTMLRewriter()
    .on('head', { element(el) { el.append(tags, { html: true }); } })
    .on('title', { element(el) { el.setInnerContent(`${meta.title} · Teach Club`); } })
    .transform(page);
}
