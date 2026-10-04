import { describe, expect, it } from 'vitest';
import { esc, html, raw } from '../../src/shared/ui/html';

describe('html`…`: escaping by default', () => {
  it('data cannot inject a tag or break out of an attribute', () => {
    const evil = `"><img src=x onerror=alert(1)>`;
    const out = html`<div title="${evil}">${evil}</div>`.toString();
    expect(out).not.toContain('<img');
    expect(out).toBe('<div title="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;">&quot;&gt;&lt;img src=x onerror=alert(1)&gt;</div>');
  });
  it('nested html and raw are not escaped again; arrays are joined; null is empty', () => {
    const items = ['a<b', 'c'].map((t) => html`<li>${t}</li>`);
    expect(html`<ul>${items}${null}${raw('<hr>')}</ul>`.toString()).toBe('<ul><li>a&lt;b</li><li>c</li><hr></ul>');
  });
  it('esc also covers quotes and the backtick', () => expect(esc(`'"\``)).toBe('&#39;&quot;&#96;'));
});
