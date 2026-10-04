import { describe, expect, it } from 'vitest';
import type { BuyerProfile } from '../../src/shared/domain/types';
import { normalizeBuyer } from '../../src/shared/data/repositories';
import { BuyerStore } from '../../src/app/features/buyer/buyer-store';

describe('buyer profile', () => {
  it('normalisation: four trimmed string fields', () => {
    expect(normalizeBuyer({ name: '  Иван ', phone: 79001112233, extra: 1 })).toEqual({ name: 'Иван', phone: '', email: '', city: '' });
    expect(normalizeBuyer('junk')).toEqual({ name: '', phone: '', email: '', city: '' });
  });
  it('rememberGuest fills in only the missing fields and saves', () => {
    let saved: BuyerProfile | null = null;
    const s = new BuyerStore({ load: () => normalizeBuyer(null), save: (p) => { saved = p; } });
    s.replace({ name: 'Анна' });
    s.rememberGuest({ name: 'Гость', phone: '+7 900' });
    expect(s.get()).toMatchObject({ name: 'Анна', phone: '+7 900' });
    expect(saved).toMatchObject({ phone: '+7 900' });
  });
});
