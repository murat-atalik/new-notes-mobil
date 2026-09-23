import { AppList } from '../types';

export type GroupByMode = 'NONE' | 'CATEGORY' | 'DATE' | 'SCOPE' | 'STATUS';

export interface ListGroup {
  id: string;
  title: string;
  subtitle?: string;
  iconName: 'shopping' | 'todo' | 'note' | 'calendar' | 'clock' | 'users' | 'lock' | 'check' | 'sparkles';
  color: string;
  lists: AppList[];
}

/**
 * Checks if two dates fall on the exact same calendar day
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Returns grouped lists according to the chosen group-by mode
 */
export function groupLists(
  lists: AppList[],
  mode: GroupByMode,
  completedListIds: Set<string> = new Set()
): ListGroup[] {
  if (lists.length === 0) return [];

  if (mode === 'NONE') {
    return [
      {
        id: 'all',
        title: 'Tüm Listeler',
        iconName: 'sparkles',
        color: '#10b981',
        lists,
      },
    ];
  }

  // 1. Group by Category / Type
  if (mode === 'CATEGORY') {
    const shopping = lists.filter((l) => l.type === 'SHOPPING');
    const todos = lists.filter((l) => l.type === 'TODO');
    const notes = lists.filter((l) => l.type === 'NOTE');

    const groups: ListGroup[] = [];

    if (shopping.length > 0) {
      groups.push({
        id: 'shopping',
        title: 'Alışveriş Listeleri',
        subtitle: `${shopping.length} liste`,
        iconName: 'shopping',
        color: '#10b981',
        lists: shopping,
      });
    }

    if (todos.length > 0) {
      groups.push({
        id: 'todo',
        title: 'Yapılacaklar Listeleri',
        subtitle: `${todos.length} liste`,
        iconName: 'todo',
        color: '#f59e0b',
        lists: todos,
      });
    }

    if (notes.length > 0) {
      groups.push({
        id: 'note',
        title: 'Notlar & Belgeler',
        subtitle: `${notes.length} liste`,
        iconName: 'note',
        color: '#9333ea',
        lists: notes,
      });
    }

    return groups;
  }

  // 2. Group by Creation Date
  if (mode === 'DATE') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayLists: AppList[] = [];
    const yesterdayLists: AppList[] = [];
    const thisWeekLists: AppList[] = [];
    const thisMonthLists: AppList[] = [];
    const olderLists: AppList[] = [];

    lists.forEach((list) => {
      const listDate = list.createdAt ? new Date(list.createdAt) : new Date();

      if (isSameDay(listDate, now)) {
        todayLists.push(list);
      } else if (isSameDay(listDate, yesterday)) {
        yesterdayLists.push(list);
      } else if (listDate >= startOfWeek) {
        thisWeekLists.push(list);
      } else if (listDate >= startOfMonth) {
        thisMonthLists.push(list);
      } else {
        olderLists.push(list);
      }
    });

    const groups: ListGroup[] = [];

    if (todayLists.length > 0) {
      groups.push({
        id: 'today',
        title: 'Bugün Oluşturulanlar',
        subtitle: `${todayLists.length} liste`,
        iconName: 'clock',
        color: '#10b981',
        lists: todayLists,
      });
    }

    if (yesterdayLists.length > 0) {
      groups.push({
        id: 'yesterday',
        title: 'Dün Oluşturulanlar',
        subtitle: `${yesterdayLists.length} liste`,
        iconName: 'clock',
        color: '#0284c7',
        lists: yesterdayLists,
      });
    }

    if (thisWeekLists.length > 0) {
      groups.push({
        id: 'this_week',
        title: 'Bu Hafta',
        subtitle: `${thisWeekLists.length} liste`,
        iconName: 'calendar',
        color: '#6366f1',
        lists: thisWeekLists,
      });
    }

    if (thisMonthLists.length > 0) {
      groups.push({
        id: 'this_month',
        title: 'Bu Ay',
        subtitle: `${thisMonthLists.length} liste`,
        iconName: 'calendar',
        color: '#8b5cf6',
        lists: thisMonthLists,
      });
    }

    if (olderLists.length > 0) {
      groups.push({
        id: 'older',
        title: 'Daha Eski',
        subtitle: `${olderLists.length} liste`,
        iconName: 'calendar',
        color: '#64748b',
        lists: olderLists,
      });
    }

    return groups;
  }

  // 3. Group by Scope (Shared vs Personal)
  if (mode === 'SCOPE') {
    const shared = lists.filter((l) => l.isShared !== false);
    const personal = lists.filter((l) => l.isShared === false);

    const groups: ListGroup[] = [];

    if (shared.length > 0) {
      groups.push({
        id: 'shared',
        title: 'Aile ve Ortak Listeler',
        subtitle: `${shared.length} liste`,
        iconName: 'users',
        color: '#0284c7',
        lists: shared,
      });
    }

    if (personal.length > 0) {
      groups.push({
        id: 'personal',
        title: 'Kişisel & Özel Listeler',
        subtitle: `${personal.length} liste`,
        iconName: 'lock',
        color: '#9333ea',
        lists: personal,
      });
    }

    return groups;
  }

  // 4. Group by Status (Completed vs Active)
  if (mode === 'STATUS') {
    const completed = lists.filter((l) => completedListIds.has(l.id));
    const active = lists.filter((l) => !completedListIds.has(l.id));

    const groups: ListGroup[] = [];

    if (active.length > 0) {
      groups.push({
        id: 'active',
        title: 'Devam Eden Listeler',
        subtitle: `${active.length} liste`,
        iconName: 'clock',
        color: '#f59e0b',
        lists: active,
      });
    }

    if (completed.length > 0) {
      groups.push({
        id: 'completed',
        title: 'Tamamlanan Listeler (%100)',
        subtitle: `${completed.length} liste`,
        iconName: 'check',
        color: '#10b981',
        lists: completed,
      });
    }

    return groups;
  }

  return [];
}
