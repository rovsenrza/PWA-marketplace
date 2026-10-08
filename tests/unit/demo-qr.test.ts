import { describe, expect, it } from 'vitest';
import { demoUrl, qrSvg } from '../../src/app/vendor/demo-qr';
import qrcode from '../../src/app/vendor/qrcode.mjs';

/** The dark modules of a rendered code, rebuilt from its path (viewBox 0 0 N N, quiet zone of 4 on each side). */
function darkModules(svg: string): { span: number; dark: Set<string> } {
  const span = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)![1]);
  const dark = new Set<string>();
  for (const [, x, y, run] of svg.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
    for (let i = 0; i < Number(run); i += 1) dark.add(`${Number(y) - 4},${Number(x) - 4 + i}`);
  }
  return { span, dark };
}

describe('demoUrl: the address a phone should open', () => {
  it('drops the hash and keeps the path and the query', () => {
    expect(demoUrl('https://user.github.io/repo/index.html#/cart')).toBe('https://user.github.io/repo/index.html');
    expect(demoUrl('http://localhost:4173/#home')).toBe('http://localhost:4173/');
    expect(demoUrl('https://x.test/a?b=1&c=2#d')).toBe('https://x.test/a?b=1&c=2');
  });

  it('leaves an address without a hash as it is', () => {
    expect(demoUrl('https://demo.surge.sh/')).toBe('https://demo.surge.sh/');
  });
});

describe('qrSvg: the code as one inline svg', () => {
  const url = 'https://user.github.io/superapp/';

  it('draws exactly the modules the library makes, inside a quiet zone of four', () => {
    const { span, dark } = darkModules(qrSvg(url, 'код'));
    const code = qrcode(0, 'M');
    code.addData(url);
    code.make();
    const count = code.getModuleCount();
    expect(span).toBe(count + 8);
    const expected = new Set<string>();
    for (let row = 0; row < count; row += 1) for (let col = 0; col < count; col += 1) if (code.isDark(row, col)) expected.add(`${row},${col}`);
    expect(dark).toEqual(expected);
  });

  it('has the three finder squares in their corners', () => {
    const { span, dark } = darkModules(qrSvg(url, 'код'));
    const count = span - 8;
    for (const [row, col] of [[0, 0], [0, count - 7], [count - 7, 0]]) {
      for (let i = 0; i < 7; i += 1) {
        for (const [r, c] of [[row, col + i], [row + 6, col + i], [row + i, col], [row + i, col + 6]]) expect(dark.has(`${r},${c}`)).toBe(true);
      }
      expect(dark.has(`${row + 3},${col + 3}`)).toBe(true); // the centre of the square
      expect(dark.has(`${row + 1},${col + 1}`)).toBe(false); // and the light ring round it
    }
  });

  it('is sized in whole pixels per module, so it is crisp at 100%', () => {
    for (const text of [url, `${url}index.html`, `https://very-long-name.example.com/${'a'.repeat(70)}/`]) {
      const svg = qrSvg(text, 'код');
      const { span } = darkModules(svg);
      const side = Number(/width="(\d+)"/.exec(svg)![1]);
      expect(side % span).toBe(0);
      expect(side / span).toBeGreaterThanOrEqual(3);
      expect(side).toBeGreaterThan(150);
      expect(side).toBeLessThan(260);
    }
  });

  it('reads as an image with the given name, and escapes it', () => {
    const svg = qrSvg(url, 'код "для" <телефона>');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="код &quot;для&quot; &lt;телефона&gt;"');
    expect(svg).not.toContain('<телефона>');
  });
});
