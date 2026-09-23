import { useCallback, useEffect, useState } from 'react';

import { authenticate, fetchLists } from '../services/apiClient';
import { loadState, saveState } from '../services/storageService';
import type { AppList, User } from '../types';

export function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<AppList[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadState().then(async (saved) => {
      if (!isMounted || !saved) return;
      setUser(saved.user);
      setLists(saved.lists);
      setDark(saved.dark);
      try {
        const remoteLists = await fetchLists();
        if (isMounted) setLists(remoteLists);
      } catch (error) {
        if (__DEV__) console.warn('fetchLists failed; using cached lists', error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    void saveState({ user, lists, dark });
  }, [dark, lists, user]);

  const logout = useCallback(() => setUser(null), []);
  const signIn = useCallback(async (username: string, password: string, name?: string) => {
    const nextUser = await authenticate(username, password, name);
    const nextLists = await fetchLists();
    setUser(nextUser);
    setLists(nextLists);
  }, []);
  const resetLists = useCallback(() => setLists([]), []);

  return { user, setUser, lists, setLists, dark, setDark, logout, resetLists, signIn };
}
