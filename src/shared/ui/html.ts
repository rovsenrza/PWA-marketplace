/**
 * Safe HTML. The html`…` template escapes EVERY interpolated value (text, attributes)
 * unless it is already safe markup (the result of another html`…` or raw()).
 * New renderers write only through it; that blocks injecting tags and scripts from data
 * (product titles, store names, buyer contacts).
 */

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

/** Escape text for HTML (safe both between tags and inside attribute quotes). */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"'`]/g, (c) => ESCAPES[c]);
}

/**
 * A value for a JS string inside an HTML attribute: onclick="fn('${escJsArg(v)}')".
 * First escaping for a single-quoted JS string, then HTML escaping
 * (the browser decodes the entities before running the code). For legacy markup only;
 * new code uses data-action.
 */
export function escJsArg(value: unknown): string {
  const js = String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n').replace(/<\//g, '<\\/');
  return esc(js);
}

/** Already-safe markup. Created only by html`…` and raw(). */
export class SafeHtml {
  constructor(readonly value: string) {}
  toString(): string { return this.value; }
}

/** Marks a string as safe. Only for markup produced by the code itself (SVG icons, constants), never for data. */
export const raw = (markup: string): SafeHtml => new SafeHtml(markup);

type Part = SafeHtml | string | number | boolean | null | undefined | Part[];

function render(part: Part): string {
  if (part == null || part === false) return '';
  if (Array.isArray(part)) return part.map(render).join('');
  if (part instanceof SafeHtml) return part.value;
  return esc(part);
}

/** Template with auto-escaping. Arrays are joined (list rendering); null/false/undefined render as nothing. */
export function html(strings: TemplateStringsArray, ...values: Part[]): SafeHtml {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new SafeHtml(out);
}
