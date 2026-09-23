import type { AppList, ListType } from '../types';

export function filterLists(lists: AppList[], type: ListType, search: string): AppList[] {
  const normalized = search.trim().toLocaleLowerCase('tr');
  return lists.filter((list) => {
    if (list.type !== type) return false;
    if (!normalized) return true;
    const haystack = `${list.title} ${list.description} ${list.items
      .map((item) => `${item.title} ${item.content ?? ''}`)
      .join(' ')}`.toLocaleLowerCase('tr');
    return haystack.includes(normalized);
  });
}

export function completedCount(list: AppList): number {
  return list.items.filter((item) => item.isCompleted).length;
}

export function completionPercent(lists: AppList[]): number {
  const total = lists.reduce((sum, list) => sum + list.items.length, 0);
  if (!total) return 0;
  return Math.round((lists.reduce((sum, list) => sum + completedCount(list), 0) / total) * 100);
}
