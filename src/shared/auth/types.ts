/**
 * Sign-in: the session and the service contract. Screens work only with AuthService;
 * the implementation is swappable (today a demo in the browser, later a server).
 */
export type Role = 'buyer' | 'store' | 'agency' | 'admin';

export interface Session {
  /** stable user id (the demo uses the login) */
  userId: string;
  /** what the user signed in with: a phone or a service login */
  login: string;
  role: Role;
  /** for the store role: which store the cabinet belongs to */
  storeId?: string;
  /** for the agency role */
  agencyId?: string;
  displayName?: string;
}

export type AuthError =
  | 'login_required' | 'password_required' | 'password_too_short'
  | 'name_required' | 'phone_invalid' | 'passwords_differ'
  | 'invalid_credentials' | 'unavailable';

export type AuthResult = { ok: true; session: Session } | { ok: false; error: AuthError };

export interface RegistrationInput { name: string; phone: string; password: string; password2: string }

export interface AuthService {
  signIn(login: string, password: string): Promise<AuthResult>;
  register(input: RegistrationInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  current(): Session | null;
  onChange(cb: (session: Session | null) => void): () => void;
}

export const AUTH_MESSAGES: Record<AuthError, string> = {
  login_required: 'Введите номер телефона',
  password_required: 'Введите пароль',
  password_too_short: 'Пароль минимум 6 символов',
  name_required: 'Введите имя и фамилию',
  phone_invalid: 'Введите корректный номер телефона',
  passwords_differ: 'Пароли не совпадают',
  invalid_credentials: 'Неверный логин или пароль',
  unavailable: 'Сервис входа недоступен, попробуйте позже',
};
