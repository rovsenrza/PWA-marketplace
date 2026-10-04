/**
 * Sign-in and registration in the profile (the old names: the markup calls them).
 * The logic is behind AuthService (today the demo, docs/BACKEND.md); here only the screen
 * and syncing the session into the legacy state (state.userRole and friends are still read by legacy screens).
 */
import type { AuthService, Role, Session } from '../../../shared/auth/types';
import { AUTH_MESSAGES } from '../../../shared/auth/types';
import { DemoAuthService } from '../../../shared/auth/demo-auth';
import { formatPhone } from '../../../shared/auth/validation';
import { buyerStore } from '../buyer/buyer-store';

export const auth: AuthService = new DemoAuthService();

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const value = (id: string) => $<HTMLInputElement>(id)?.value ?? '';
const toast = (msg: string) => window.showSmsToast?.(msg);

/** Roles in the legacy state's terms (user / shop / admin). */
const LEGACY_ROLE: Record<Role, string> = { buyer: 'user', store: 'shop', admin: 'admin', agency: 'user' };
const ROLE_TITLE: Record<string, string> = { user: 'Покупатель', shop: 'Магазин', admin: 'Администратор' };

function syncLegacyState(s: Session | null): void {
  state.isAuthenticated = !!s;
  state.userEmail = s?.login ?? '';
  state.userRole = s ? LEGACY_ROLE[s.role] : 'user';
  state.currentShop = s?.storeId ?? '';
}

export function switchAuthTab(tab: 'login' | 'register'): void {
  const loginBtn = $('auth-tab-login');
  const regBtn = $('auth-tab-register');
  const on = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white shadow-sm transition-all';
  const off = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 transition-all';
  if (loginBtn) loginBtn.className = tab === 'login' ? `${on} text-[#1e6091]` : off;
  if (regBtn) regBtn.className = tab === 'register' ? `${on} text-emerald-600` : off;
  $('form-login')?.classList.toggle('hidden', tab !== 'login');
  $('form-register')?.classList.toggle('hidden', tab !== 'register');
}

export function applyPhoneMask(input: HTMLInputElement): void {
  input.value = formatPhone(input.value);
}

/** Show/hide the password. The label says what the button will do (before, the labels were swapped). */
export function togglePassword(inputId: string, btn: HTMLElement): void {
  const input = $<HTMLInputElement>(inputId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerText = show ? 'Скрыть' : 'Показать';
}

/** Profile after signing in: panels, role, the dashboard for that role. */
export function finishLogin(): void {
  const s = auth.current();
  syncLegacyState(s);
  $('profile-unauth')?.classList.add('hidden');
  $('profile-auth')?.classList.remove('hidden');
  ['dash-admin', 'dash-shop', 'dash-user'].forEach((d) => $(d)?.classList.add('hidden'));
  $(`dash-${state.userRole}`)?.classList.remove('hidden');
  const email = $('user-display-email');
  if (email) email.innerText = String(state.userEmail ?? '');
  const role = $('user-display-role');
  if (role) role.innerText = ROLE_TITLE[String(state.userRole)] ?? 'Покупатель';

  const isBuyer = state.userRole === 'user';
  $('buyer-card')?.classList.toggle('hidden', !isBuyer);
  const w = window;
  if (isBuyer) { w.loadBuyerProfile?.(); w.renderBuyerCard?.(); }
  if (state.userRole === 'admin') { w.renderAdminModerationList?.(); w.updateModCounter?.(); w.updateAdminStats?.(); }
  if (state.userRole === 'shop') w.renderShopDashboard?.();
}

export async function submitLogin(): Promise<void> {
  const r = await auth.signIn(value('login-phone'), value('login-password'));
  if (!r.ok) { toast(AUTH_MESSAGES[r.error]); return; }
  finishLogin();
}

export async function submitRegister(): Promise<void> {
  const input = { name: value('reg-name'), phone: value('reg-phone'), password: value('reg-password'), password2: value('reg-password2') };
  const r = await auth.register(input);
  if (!r.ok) { toast(AUTH_MESSAGES[r.error]); return; }
  /* данные — в карточку покупателя на этом устройстве */
  buyerStore.replace({ name: input.name, phone: input.phone, email: '', city: '' });
  buyerStore.save();
  finishLogin();
  toast('Регистрация успешна!');
}

/** Sign out: the role and the store are reset too (before, state.userRole stayed «shop» / «admin»). */
export async function logout(): Promise<void> {
  await auth.signOut();
  syncLegacyState(null);
  $('profile-unauth')?.classList.remove('hidden');
  $('profile-auth')?.classList.add('hidden');
}

export const authLegacyApi = { switchAuthTab, applyPhoneMask, togglePassword, finishLogin, submitLogin, submitRegister, logout };
