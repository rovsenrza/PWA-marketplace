/** Phone and form rules: the same in the demo and with a server (the server checks again). */
import type { AuthError, RegistrationInput } from './types';

/** '+7 (900) 123-45-67' from any input: 8… → 7…, at most 11 digits. Text with letters (service logins) is left as is. */
export function formatPhone(input: string): string {
  if (/[a-zа-яё]/i.test(input.trim())) return input;
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  let out = '+7';
  if (digits.length > 1) out += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 4) out += `) ${digits.slice(4, 7)}`;
  if (digits.length >= 7) out += `-${digits.slice(7, 9)}`;
  if (digits.length >= 9) out += `-${digits.slice(9, 11)}`;
  return out;
}

/** A full Russian mobile number in mask format (11 digits). */
export const isCompletePhone = (phone: string): boolean => phone.replace(/\D/g, '').length === 11;

export const MIN_PASSWORD = 6;

export function validateRegistration(i: RegistrationInput): AuthError | null {
  if (!i.name.trim()) return 'name_required';
  if (!isCompletePhone(i.phone)) return 'phone_invalid';
  if (i.password.trim().length < MIN_PASSWORD) return 'password_too_short';
  if (i.password.trim() !== i.password2.trim()) return 'passwords_differ';
  return null;
}
