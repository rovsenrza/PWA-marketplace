import { describe, expect, it } from 'vitest';
import { DemoAuthService, DEMO_STORE_LOGINS } from '../../src/shared/auth/demo-auth';
import { formatPhone, isCompletePhone, validateRegistration } from '../../src/shared/auth/validation';

describe('phone', () => {
  it('mask from any input: 8 → +7, at most 11 digits', () => {
    expect(formatPhone('89001234567')).toBe('+7 (900) 123-45-67');
    expect(formatPhone('9001234567999')).toBe('+7 (900) 123-45-67');
    expect(formatPhone('+7 900')).toBe('+7 (900) '); // как в прототипе: после 4-й цифры — разделитель
    expect(formatPhone('shop1')).toBe('shop1'); // служебные логины не трогаем
    expect(isCompletePhone('+7 (900) 123-45-67')).toBe(true);
    expect(isCompletePhone('+7 (900) 123-45')).toBe(false);
  });
});

describe('registration', () => {
  const ok = { name: 'Анна', phone: '+7 (900) 123-45-67', password: 'secret1', password2: 'secret1' };
  it('rules in order: name, phone, password length, match', () => {
    expect(validateRegistration(ok)).toBeNull();
    expect(validateRegistration({ ...ok, name: ' ' })).toBe('name_required');
    expect(validateRegistration({ ...ok, phone: '+7 (900' })).toBe('phone_invalid');
    expect(validateRegistration({ ...ok, password: '123', password2: '123' })).toBe('password_too_short');
    expect(validateRegistration({ ...ok, password2: 'other12' })).toBe('passwords_differ');
  });
});

describe('DemoAuthService (prototype behaviour)', () => {
  it('admin and store logins give their roles; a store gets its store', async () => {
    const a = new DemoAuthService();
    expect((await a.signIn('admin', 'x'))).toMatchObject({ ok: true, session: { role: 'admin' } });
    const s = await a.signIn('Shop2', 'x');
    expect(s).toMatchObject({ ok: true, session: { role: 'store', storeId: DEMO_STORE_LOGINS.shop2 } });
  });
  it('a buyer needs a 6+ character password; empty fields are refused', async () => {
    const a = new DemoAuthService();
    expect(await a.signIn('', 'x')).toEqual({ ok: false, error: 'login_required' });
    expect(await a.signIn('+7 (900) 123-45-67', '')).toEqual({ ok: false, error: 'password_required' });
    expect(await a.signIn('+7 (900) 123-45-67', '12345')).toEqual({ ok: false, error: 'password_too_short' });
    expect(await a.signIn('+7 (900) 123-45-67', '123456')).toMatchObject({ ok: true, session: { role: 'buyer' } });
  });
  it('the session and change notifications; sign-out clears the session', async () => {
    const a = new DemoAuthService();
    const seen: Array<string | null> = [];
    a.onChange((s) => seen.push(s?.role ?? null));
    await a.signIn('admin', 'x');
    await a.signOut();
    expect(seen).toEqual(['admin', null]);
    expect(a.current()).toBeNull();
  });
});
