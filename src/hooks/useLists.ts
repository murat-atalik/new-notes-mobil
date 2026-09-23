import { useCallback, useState } from 'react';

import type { AppList, Item, ListType } from '../types';
import { strings } from '../strings/tr';
import { uid } from '../utils/id';

export function useLists(initialLists: AppList[]) {
  const [lists, setLists] = useState(initialLists);

  const createList = useCallback((title: string, type: ListType, shared: boolean) => {
    setLists((current) => [
      {
        id: uid(),
        title,
        description: '',
        type,
        isShared: shared,
        items: [],
        updatedAt: strings.common.justNow,
      },
      ...current,
    ]);
  }, []);

  const updateList = useCallback((updated: AppList) => {
    setLists((current) => current.map((list) => (list.id === updated.id ? updated : list)));
  }, []);

  const deleteList = useCallback((id: string) => {
    setLists((current) => current.filter((list) => list.id !== id));
  }, []);

  const addItem = useCallback(
    (list: AppList, item: Omit<Item, 'id'>) => {
      updateList({ ...list, items: [{ ...item, id: uid() }, ...list.items] });
    },
    [updateList],
  );

  return { lists, setLists, createList, updateList, deleteList, addItem };
}
