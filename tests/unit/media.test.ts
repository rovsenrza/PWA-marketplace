import { describe, expect, it } from 'vitest';
import { dataUrlBytes, fitWithin } from '../../src/shared/media/types';

describe('media: sizes', () => {
  it('fitWithin keeps the proportions and never enlarges', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ w: 1600, h: 1200 });
    expect(fitWithin(1080, 1920, 1920)).toEqual({ w: 1080, h: 1920 });
    expect(fitWithin(300, 200, 1600)).toEqual({ w: 300, h: 200 });
  });
  it('dataUrlBytes counts base64 padding', () => {
    expect(dataUrlBytes('data:text/plain;base64,QUJD')).toBe(3);
    expect(dataUrlBytes('data:text/plain;base64,QUI=')).toBe(2);
    expect(dataUrlBytes('data:text/plain;base64,QQ==')).toBe(1);
  });
});
