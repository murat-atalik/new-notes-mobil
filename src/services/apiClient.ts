import { API_BASE_URL } from '../config/api';
import type { AppList, Item, ListType, User } from '../types';

type ApiUser = User & { password?: string | null };
type ApiList = Omit<AppList, 'items' | 'updatedAt'> & {
  description: string | null;
  updatedAt?: string;
};
type ApiItem = Omit<Item, 'isCompleted' | 'isPinned' | 'quantity' | 'priority'> & {
  isCompleted: boolean;
  isPinned: boolean;
  quantity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
};

type RequestOptions = {
  method?: 'POST' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await globalThis.fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const body = (await response.json()) as { success?: boolean; error?: string };
  if (!response.ok || body.success === false) {
    throw new Error(body.error ?? `API request failed: ${response.status}`);
  }
  return body as T;
}

const priorityToServer = (priority: Item['priority']): Item['priority'] => priority ?? 'MEDIUM';

export async function authenticate(
  username: string,
  password: string,
  name?: string,
): Promise<User> {
  const usersResponse = await request<{ users: ApiUser[] }>('/api/users');
  const normalized = username.trim().replace(/^@/, '').toLocaleLowerCase('tr');
  const existing = usersResponse.users.find(
    (candidate) =>
      candidate.username?.toLocaleLowerCase('tr') === normalized && candidate.password === password,
  );
  if (existing) {
    const { password: _password, ...user } = existing;
    return user;
  }
  if (!name) throw new Error('Kullanıcı adı veya şifre hatalı');

  const response = await request<{ user: ApiUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      id: `user-${Date.now()}`,
      name: name.trim(),
      username: normalized,
      password,
      avatar: '🦊',
      familyRole: 'HEAD',
    }),
  });
  const { password: _password, ...user } = response.user;
  return user;
}

export async function fetchLists(): Promise<AppList[]> {
  const [listsResponse, itemsResponse] = await Promise.all([
    request<{ lists: ApiList[] }>('/api/lists'),
    request<{ items: ApiItem[] }>('/api/items'),
  ]);
  const itemsByList = new Map<string, Item[]>();
  for (const item of itemsResponse.items) {
    const current = itemsByList.get(item.listId ?? '') ?? [];
    current.push({
      ...item,
      quantity: item.quantity,
      isCompleted: item.isCompleted,
      isPinned: item.isPinned,
      priority: priorityToServer(item.priority),
    });
    itemsByList.set(item.listId ?? '', current);
  }
  return listsResponse.lists.map((list) => ({
    ...list,
    description: list.description ?? '',
    updatedAt: list.updatedAt ?? list.createdAt ?? new Date().toISOString(),
    isShared: list.isShared ?? true,
    items: itemsByList.get(list.id) ?? [],
  }));
}

export async function createList(
  user: User,
  title: string,
  type: ListType,
  isShared: boolean,
): Promise<AppList> {
  const response = await request<{ list: ApiList }>('/api/lists', {
    method: 'POST',
    body: JSON.stringify({
      title,
      type,
      isShared,
      ownerId: user.id,
      familyId: user.familyId ?? null,
      members: [{ userId: user.id, role: 'OWNER', joinedAt: new Date().toISOString() }],
    }),
  });
  return {
    ...response.list,
    description: response.list.description ?? '',
    updatedAt: response.list.updatedAt ?? new Date().toISOString(),
    items: [],
  };
}

export async function updateList(list: AppList): Promise<void> {
  await request('/api/lists', {
    method: 'PUT',
    body: JSON.stringify({
      id: list.id,
      title: list.title,
      description: list.description ?? '',
      type: list.type,
      color: list.color,
      icon: list.icon,
      isShared: list.isShared,
      ownerId: list.ownerId,
      familyId: list.familyId,
      inviteCode: list.inviteCode,
      members: list.members,
    }),
  });
  await Promise.all(
    list.items.map((item) =>
      request('/api/items', {
        method: 'POST',
        body: JSON.stringify({
          ...item,
          listId: list.id,
          isCompleted: item.isCompleted,
          isPinned: item.isPinned ?? false,
          quantity: item.quantity ?? 1,
          priority: priorityToServer(item.priority),
        }),
      }),
    ),
  );
}

export async function deleteList(id: string): Promise<void> {
  await request(`/api/lists?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}
