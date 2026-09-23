import { useMemo } from 'react';

import { formatMoney } from '../../logic/format';
import { canUserAccessList } from '../../lib/permissions';
import { useAppStore } from '../../store/useAppStore';
import type { AppList, Category, ListItem, ListType, User } from '../../types';

export const UNITS = ['adet', 'kg', 'g', 'lt', 'paket'] as const;

/** The list if it exists and the current user may open it. */
export function useAccessibleList(listId: string | undefined): AppList | undefined {
  const list = useAppStore((s) => s.lists.find((l) => l.id === listId));
  const user = useAppStore((s) => s.currentUser);
  return list && canUserAccessList(list, user) ? list : undefined;
}

export function useCategoriesFor(type: ListType | undefined): Category[] {
  const categories = useAppStore((s) => s.categories);
  return useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
}

/** Family members + explicit list members (deduplicated), current user first. */
export function usePeople(list?: AppList): User[] {
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.currentUser);
  return useMemo(() => {
    const memberIds = new Set((list?.members ?? []).map((m) => m.userId));
    const others = users.filter(
      (u) => u.id !== me.id && ((me.familyId && u.familyId === me.familyId) || memberIds.has(u.id)),
    );
    return [me, ...others];
  }, [users, me, list]);
}

export function lineTotal(item: ListItem): number {
  return (item.price || 0) * (item.quantity || 1);
}

/** "2 kg · ₺45" */
export function shoppingMeta(item: ListItem): string {
  const parts: string[] = [];
  const qty = item.quantity || 1;
  parts.push(`${qty.toLocaleString('tr-TR')} ${item.unit || 'adet'}`);
  if (item.price > 0) parts.push(formatMoney(item.price));
  return parts.join(' · ');
}

export function listSubtitle(list: AppList): string {
  const scope = list.isShared === false ? 'Kişisel' : 'Aile';
  const count = list.members?.length ?? 0;
  return count > 1 ? `${scope} · ${count} üye` : scope;
}

/** Splits quick-add input on commas / newlines. */
export function splitTitles(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}
