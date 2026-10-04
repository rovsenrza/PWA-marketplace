import { describe, expect, it } from 'vitest';
import { mergeCommunity } from '../../src/shared/data/engagement';

describe('lifehack reaction totals', () => {
  const demo = { useful: { a: 10, b: 5 }, polls: { p: { yes: 3, no: 1 } } };
  it('nothing stored: the demo totals', () => expect(mergeCommunity(demo, {})).toEqual(demo));
  it('what is stored wins; the demo fills missing items', () => {
    expect(mergeCommunity(demo, { useful: { a: 11 }, polls: { q: { x: 1 } } })).toEqual({ useful: { a: 11, b: 5 }, polls: { q: { x: 1 }, p: { yes: 3, no: 1 } } });
  });
  it('broken records are ignored', () => expect(mergeCommunity(demo, { useful: 'junk', polls: [1] })).toEqual(demo));
});
