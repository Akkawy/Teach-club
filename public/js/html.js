// Tiny templating: html`...` escapes every value you drop in, so names and notes typed by
// members can never inject markup. Wrap trusted markup (our own SVG icons) in raw().

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export class Safe {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

export const raw = (s) => new Safe(String(s));
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

function out(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(out).join('');
  return esc(v);
}

export function html(strings, ...values) {
  let s = strings[0];
  for (let i = 0; i < values.length; i++) s += out(values[i]) + strings[i + 1];
  return new Safe(s);
}
