import { API_BASE_URL } from '../config/api';
import {
  getAccessibleCards,
  getAccessibleExpenses,
  getAccessibleLists,
  getAccessibleSavings,
} from '../lib/permissions';
import type { AppList, ExpenseLog, ListItem, PaymentCard, SavingsGoal, User } from '../types';

/**
 * Client for the `/api/mobile/*` routes of `new-notes` (server-side auth, scoped data).
 *
 * Until the backend with those routes is deployed, every call falls back to the
 * legacy web endpoints and applies the same rules on the device (passwords are
 * stripped before anything reaches the store).
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

type JsonBody = { success?: boolean; error?: string; [key: string]: unknown };

/** Thrown when the mobile route does not exist on the deployed backend (non-JSON 404). */
class RouteMissing extends Error {}

async function call(path: string, init?: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown }): Promise<JsonBody & { __status: number }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  let json: JsonBody;
  try {
    json = (await res.json()) as JsonBody;
  } catch {
    if (res.status === 404 || res.status === 405) throw new RouteMissing(path);
    throw new Error(`Sunucu yanıtı okunamadı (${res.status})`);
  }
  return { ...json, __status: res.status };
}

function toResult<T>(json: JsonBody & { __status: number }, pick: (j: JsonBody) => T): ApiResult<T> {
  if (json.success === false || json.__status >= 400) {
    return { ok: false, error: json.error || 'İşlem başarısız oldu', status: json.__status };
  }
  return { ok: true, data: pick(json) };
}

function networkError(error: unknown): ApiResult<never> {
  return {
    ok: false,
    status: 0,
    error: error instanceof Error ? `Sunucuya ulaşılamadı: ${error.message}` : 'Sunucuya ulaşılamadı',
  };
}

const stripPassword = (u: User): User => {
  const { password: _password, ...rest } = u;
  return rest as User;
};

const normalizeLogin = (value: string) => value.trim().toLowerCase().replace(/^@/, '');

async function legacyUsers(): Promise<User[]> {
  const json = await call('/api/users');
  return Array.isArray(json.users) ? (json.users as User[]) : [];
}

// ---------- Auth ----------

export async function login(username: string, password: string): Promise<ApiResult<User>> {
  try {
    try {
      return toResult(await call('/api/mobile/auth/login', { method: 'POST', body: { username, password } }), (j) => j.user as User);
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const clean = normalizeLogin(username);
    const user = (await legacyUsers()).find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean) ||
        u.name.toLowerCase() === clean,
    );
    if (!user) return { ok: false, status: 404, error: 'Bu kullanıcı adına ait kayıtlı bir hesap bulunamadı. Lütfen önce kayıt olun.' };
    if (user.password && user.password !== password) return { ok: false, status: 401, error: 'Girdiğiniz şifre hatalı. Lütfen tekrar deneyin.' };
    return { ok: true, data: stripPassword(user) };
  } catch (error) {
    return networkError(error);
  }
}

export async function register(input: {
  name: string;
  username: string;
  password: string;
  avatar: string;
  color: string;
  newUser: User;
}): Promise<ApiResult<User>> {
  try {
    try {
      return toResult(await call('/api/mobile/auth/register', { method: 'POST', body: input }), (j) => j.user as User);
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const clean = normalizeLogin(input.username);
    if ((await legacyUsers()).some((u) => u.username?.toLowerCase() === clean)) {
      return { ok: false, status: 409, error: 'Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seçin.' };
    }
    const json = await call('/api/users', { method: 'POST', body: input.newUser });
    return toResult(json, () => stripPassword(input.newUser));
  } catch (error) {
    return networkError(error);
  }
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ApiResult<true>> {
  try {
    try {
      return toResult(
        await call('/api/mobile/auth/change-password', { method: 'POST', body: { userId, oldPassword, newPassword, confirmPassword: newPassword } }),
        () => true as const,
      );
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const user = (await legacyUsers()).find((u) => u.id === userId);
    if (!user) return { ok: false, status: 404, error: 'Oturum açmış kullanıcı bulunamadı.' };
    if (user.password && user.password !== oldPassword) {
      return { ok: false, status: 401, error: 'Mevcut (eski) şifreniz hatalı. Lütfen kontrol edip tekrar deneyin.' };
    }
    return toResult(await call('/api/users', { method: 'PUT', body: { id: userId, password: newPassword } }), () => true as const);
  } catch (error) {
    return networkError(error);
  }
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

export async function bootstrap(user: User): Promise<ApiResult<BootstrapData>> {
  try {
    try {
      return toResult(await call(`/api/mobile/bootstrap?userId=${encodeURIComponent(user.id)}`), (j) => j.data as BootstrapData);
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const json = await call('/api/initial-data');
    return toResult(json, (j) => {
      const raw = j.data as Omit<BootstrapData, 'user'>;
      const users = (raw.users ?? []).map(stripPassword);
      const me = users.find((u) => u.id === user.id) ?? user;
      const lists = getAccessibleLists(
        (raw.lists ?? []).map((l) => ({ ...l, members: Array.isArray(l.members) ? l.members : [] })),
        me,
      );
      const listIds = new Set(lists.map((l) => l.id));
      const visible = new Set<string>([me.id, ...lists.flatMap((l) => [l.ownerId, ...l.members.map((m) => m.userId)])]);
      return {
        user: me,
        users: users.filter((u) => visible.has(u.id) || (!!u.familyId && u.familyId === me.familyId)),
        lists,
        items: (raw.items ?? []).filter((i) => listIds.has(i.listId)),
        expenses: getAccessibleExpenses(raw.expenses ?? [], me),
        savingsGoals: getAccessibleSavings(raw.savingsGoals ?? [], me),
        paymentCards: getAccessibleCards(raw.paymentCards ?? [], me),
      };
    });
  } catch (error) {
    return networkError(error);
  }
}

// ---------- Family & sharing ----------

export async function joinFamily(userId: string, familyCode: string): Promise<ApiResult<{ user: User; message: string }>> {
  try {
    try {
      return toResult(await call('/api/mobile/family/join', { method: 'POST', body: { userId, familyCode } }), (j) => ({
        user: j.user as User,
        message: String(j.message ?? ''),
      }));
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const clean = familyCode.trim().toUpperCase().replace(/\s+/g, '');
    const head = (await legacyUsers()).find((u) => (u.familyCode || '').toUpperCase() === clean);
    if (!head) return { ok: false, status: 404, error: 'Bu Aile Koduna ait bir aile bulunamadı. Lütfen kodu kontrol edin.' };
    const updates = {
      familyId: head.familyId || `fam_${head.username || head.id}`,
      familyName: head.familyName || `${head.name} Ailesi`,
      familyCode: head.familyCode || clean,
      familyRole: 'MEMBER' as const,
    };
    await call('/api/users', { method: 'PUT', body: { id: userId, ...updates } });
    return {
      ok: true,
      data: { user: { ...(stripPassword(head) as User), ...updates, id: userId } as User, message: `"${updates.familyName}" ailesine başarıyla katıldınız!` },
    };
  } catch (error) {
    return networkError(error);
  }
}

export async function joinListByCode(userId: string, inviteCode: string): Promise<ApiResult<{ list: AppList; message: string }>> {
  try {
    return toResult(await call('/api/mobile/lists/join', { method: 'POST', body: { userId, inviteCode } }), (j) => ({
      list: j.list as AppList,
      message: String(j.message ?? ''),
    }));
  } catch (error) {
    if (error instanceof RouteMissing) {
      return { ok: false, status: 404, error: 'Kodla katılma için sunucunun güncellenmesi gerekiyor.' };
    }
    return networkError(error);
  }
}

export async function inviteToList(listId: string, username: string, role: 'EDITOR' | 'OWNER' = 'EDITOR'): Promise<ApiResult<{ list: AppList; user: User; message: string }>> {
  try {
    try {
      return toResult(await call('/api/mobile/lists/invite', { method: 'POST', body: { listId, username, role } }), (j) => ({
        list: j.list as AppList,
        user: j.user as User,
        message: String(j.message ?? ''),
      }));
    } catch (error) {
      if (!(error instanceof RouteMissing)) throw error;
    }
    const clean = normalizeLogin(username);
    const invitee = (await legacyUsers()).find(
      (u) => (u.username && u.username.toLowerCase() === clean) || (u.email && u.email.toLowerCase() === clean),
    );
    if (!invitee) return { ok: false, status: 404, error: 'Bu kullanıcı adı veya e-posta ile kayıtlı bir aile üyesi bulunamadı.' };
    return { ok: true, data: { list: { id: listId } as AppList, user: stripPassword(invitee), message: '' } };
  } catch (error) {
    return networkError(error);
  }
}
