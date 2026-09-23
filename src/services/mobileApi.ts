import { API_BASE_URL } from '../config/api';
import type { AppList, ExpenseLog, ListItem, PaymentCard, SavingsGoal, User } from '../types';
import { authHeaders, notifyUnauthorized, setSessionToken } from './session';

/**
 * Client for the session-based routes of the `new-notes` API.
 * Credentials are checked on the server; every call carries the Bearer token and
 * the server derives the user from it (no user ids are trusted from the client).
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

type JsonBody = { success?: boolean; error?: string; [key: string]: unknown };

async function call<T>(
  path: string,
  pick: (json: JsonBody) => T,
  init?: { method?: 'GET' | 'POST'; body?: unknown; public?: boolean },
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init?.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...authHeaders() },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? `Sunucuya ulaşılamadı: ${error.message}` : 'Sunucuya ulaşılamadı' };
  }
  let json: JsonBody = {};
  try {
    json = (await res.json()) as JsonBody;
  } catch {
    // Non-JSON error page.
  }
  // An expired/missing session on an authenticated route sends the user back to login.
  if (res.status === 401 && !init?.public) notifyUnauthorized();
  if (!res.ok || json.success === false) {
    return { ok: false, status: res.status, error: json.error || `İşlem başarısız oldu (${res.status})` };
  }
  return { ok: true, data: pick(json) };
}

// ---------- Auth ----------

function withSession(json: JsonBody): User {
  if (typeof json.token === 'string') setSessionToken(json.token);
  return json.user as User;
}

export const login = (username: string, password: string) =>
  call('/api/auth/login', withSession, { method: 'POST', body: { username, password }, public: true });

export const register = (input: { name: string; username: string; password: string; avatar: string; color: string }) =>
  call('/api/auth/register', withSession, { method: 'POST', body: input, public: true });

export const changePassword = (oldPassword: string, newPassword: string) =>
  call('/api/auth/change-password', () => true as const, {
    method: 'POST',
    body: { oldPassword, newPassword, confirmPassword: newPassword },
  });

export function logout() {
  setSessionToken(null);
}

// ---------- Data ----------

export type BootstrapData = {
  user: User;
  users: User[];
  lists: AppList[];
  items: ListItem[];
  expenses: ExpenseLog[];
  savingsGoals: SavingsGoal[];
  paymentCards: PaymentCard[];
};

export const bootstrap = () => call('/api/bootstrap', (j) => j.data as BootstrapData);

// ---------- Family & sharing ----------

export const joinFamily = (familyCode: string) =>
  call('/api/family/join', (j) => ({ user: j.user as User, message: String(j.message ?? '') }), { method: 'POST', body: { familyCode } });

export const joinListByCode = (inviteCode: string) =>
  call('/api/lists/join', (j) => ({ list: j.list as AppList, message: String(j.message ?? '') }), { method: 'POST', body: { inviteCode } });

export const inviteToList = (listId: string, username: string, role: 'EDITOR' | 'OWNER' = 'EDITOR') =>
  call('/api/lists/invite', (j) => ({ list: j.list as AppList, user: j.user as User, message: String(j.message ?? '') }), {
    method: 'POST',
    body: { listId, username, role },
  });
