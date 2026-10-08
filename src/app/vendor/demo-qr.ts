/**
 * The demo link as a QR code, for the desktop stage (index.html, #stage-qr; see stage-qr.ts).
 *
 * qrcode.mjs beside this file is the MIT library qrcode-generator 2.0.4 by Kazuhiko Arase: dist/qrcode.mjs of the
 * npm package, copied unmodified with its licence header (sha256 ea91d7118a53…b7c0); qrcode.d.mts holds its types and
 * qrcode-LICENSE.txt the licence text. It is vendored as one file instead of added as a dependency, and nothing but
 * this module imports it.
 */
/*! qrcode-generator 2.0.4, (c) 2009 Kazuhiko Arase, MIT licence (http://www.opensource.org/licenses/mit-license.php) */
import { html } from '../../shared/ui/html';
import qrcode from './qrcode.mjs';

/** The page address a phone should open: the hash is the app's own navigation state, so it stays out of the code. */
export function demoUrl(href: string): string {
  const url = new URL(href);
  url.hash = '';
  return url.href;
}

/** Quiet zone around the code, in modules: four, the QR specification's minimum, so a camera finds it on any field. */
const QUIET = 4;

/**
 * The code as an inline SVG: one path of horizontal runs of dark modules, drawn in `currentColor` (the page sets the
 * ink and the paper behind it). `target` is the wanted side in pixels; the module size is rounded to whole pixels,
 * so at 100% zoom every module is crisp. Error correction M (15 %) is enough for a code that is read off a screen.
 */
export function qrSvg(text: string, label: string, target = 216): string {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();
  const count = code.getModuleCount();
  const span = count + QUIET * 2;
  const side = Math.max(3, Math.round(target / span)) * span;
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!code.isDark(row, col)) continue;
      let run = 1;
      while (col + run < count && code.isDark(row, col + run)) run += 1;
      path += `M${col + QUIET} ${row + QUIET}h${run}v1h-${run}z`;
      col += run; // the module after the run is light: the loop step moves past it
    }
  }
  return html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${span} ${span}" width="${side}" height="${side}" role="img" aria-label="${label}" shape-rendering="crispEdges"><path d="${path}" fill="currentColor"/></svg>`.toString();
}
