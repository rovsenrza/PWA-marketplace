/**
 * ⚠ DEMO SIGN-IN. Real security does not exist here and can't exist in the browser:
 *   - «admin» with any password → administrator;
 *   - «shop», «shop1», «shop2», «shop3» with any password → that store's cabinet;
 *   - any phone with a password of 6+ characters → buyer (no account is checked).
 * This is the prototype's behaviour, kept for showing the app. Before real users
 * arrive, this file is replaced by a server implementation of AuthService (docs/BACKEND.md).
 */
import type { AuthResult, AuthService, RegistrationInput, Session } from './types';
import { MIN_PASSWORD, validateRegistration } from './validation';

/** Demo logins for store cabinets (they used to be shopLoginsMap in core/data.js). */
export const DEMO_STORE_LOGINS: Record<string, string> = {
  shop: 'Любимый Дом',
  shop1: 'Любимый Дом',
  shop2: 'Кухни Дриада',
  shop3: 'Новоселье',
};
export const DEMO_ADMIN_LOGIN = 'admin';

export class DemoAuthService implements AuthService {
  private session: Session | null = null;
  private listeners = new Set<(s: Session | null) => void>();

  private set(s: Session | null): void {
    this.session = s;
    this.listeners.forEach((cb) => cb(s));
  }

  async signIn(loginRaw: string, passwordRaw: string): Promise<AuthResult> {
    const login = loginRaw.trim();
    const password = passwordRaw.trim();
    if (!login) return { ok: false, error: 'login_required' };
    if (!password) return { ok: false, error: 'password_required' };
    const lower = login.toLowerCase();
    let session: Session;
    if (lower === DEMO_ADMIN_LOGIN) session = { userId: lower, login, role: 'admin' };
    else if (DEMO_STORE_LOGINS[lower]) session = { userId: lower, login, role: 'store', storeId: DEMO_STORE_LOGINS[lower] };
    else {
      if (password.length < MIN_PASSWORD) return { ok: false, error: 'password_too_short' };
      session = { userId: login, login, role: 'buyer' };
    }
    this.set(session);
    return { ok: true, session };
  }

  async register(input: RegistrationInput): Promise<AuthResult> {
    const error = validateRegistration(input);
    if (error) return { ok: false, error };
    const phone = input.phone.trim();
    const session: Session = { userId: phone, login: phone, role: 'buyer', displayName: input.name.trim() };
    this.set(session);
    return { ok: true, session };
  }

  async signOut(): Promise<void> { this.set(null); }

  current(): Session | null { return this.session; }

  onChange(cb: (s: Session | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
