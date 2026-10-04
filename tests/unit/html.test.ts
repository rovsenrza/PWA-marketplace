import { describe, expect, it } from 'vitest';
import { esc, escJsArg, html, raw } from '../../src/shared/ui/html';

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

describe('escJsArg: a JS string inside an attribute', () => {
  it('a quote does not break out of the string, and the attribute stays whole', () => {
    const v = escJsArg(`O'Neil "Дом" \\ </script>`);
    expect(v).toBe('O\\&#39;Neil &quot;Дом&quot; \\\\ &lt;\\/script&gt;');
    /* what the JS engine sees after the browser decodes the entities */
    const decoded = v.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    expect(eval(`'${decoded}'`)).toBe(`O'Neil "Дом" \\ </script>`);
  });
});
