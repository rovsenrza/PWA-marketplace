import { describe, expect, it } from 'vitest';
import { compressionSteps, dataUrlBytes, fitWithin } from '../../src/shared/media/types';

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

describe('compression plan', () => {
  it('first quality at full size, then smaller; every step is lighter or the same', () => {
    const steps = compressionSteps(4000, 3000, 1600);
    expect(steps[0]).toEqual({ w: 1600, h: 1200, quality: 0.82 });
    expect(steps[3]).toEqual({ w: 1600, h: 1200, quality: 0.52 });
    expect(steps[4]).toEqual({ w: 1200, h: 900, quality: 0.82 });
    expect(steps.at(-1)!.w).toBeLessThan(700);
    for (let i = 1; i < steps.length; i++) {
      const [prev, cur] = [steps[i - 1], steps[i]];
      expect(cur.w).toBeLessThanOrEqual(prev.w); // размер не растёт
      if (cur.w === prev.w) expect(cur.quality).toBeLessThan(prev.quality); // при том же размере качество только падает
    }
  });
});
