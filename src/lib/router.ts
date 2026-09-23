import { createNavigationContainerRef, type NavigationState, type PartialState } from '@react-navigation/native';
import { create } from 'zustand';

/**
 * Next.js-style `useRouter()` / `usePathname()` on top of react-navigation, so
 * components ported from `new-notes-main` keep their `router.push('/finance')` calls.
 */

export type TabRouteName =
  | 'lists'
  | 'finance'
  | 'family'
  | 'analytics'
  | 'settings'
  | 'categories'
  | 'templates';

export type TabParamList = Record<TabRouteName, undefined>;

export type RootStackParamList = {
  Tabs: { screen?: TabRouteName } | undefined;
  List: { id: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const TAB_PATHS: Record<TabRouteName, string> = {
  lists: '/',
  finance: '/finance',
  family: '/family',
  analytics: '/analytics',
  settings: '/settings',
  categories: '/categories',
  templates: '/templates',
};

const pathStore = create<{ pathname: string }>(() => ({ pathname: '/' }));

type AnyState = NavigationState | PartialState<NavigationState>;

function pathFromState(state: AnyState | undefined): string {
  if (!state || state.index === undefined) return '/';
  const route = state.routes[state.index] as {
    name: string;
    params?: { id?: string };
    state?: AnyState;
  };
  if (route.name === 'List') return `/list/${route.params?.id ?? ''}`;
  if (route.name === 'Tabs') {
    if (!route.state || route.state.index === undefined) return '/';
    const tab = route.state.routes[route.state.index].name as TabRouteName;
    return TAB_PATHS[tab] ?? '/';
  }
  return TAB_PATHS[route.name as TabRouteName] ?? '/';
}

/** Wire to `NavigationContainer onStateChange/onReady`. */
export function syncPathname() {
  if (!navigationRef.isReady()) return;
  pathStore.setState({ pathname: pathFromState(navigationRef.getRootState()) });
}

export function push(path: string) {
  if (!navigationRef.isReady()) return;
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (clean.startsWith('/list/')) {
    navigationRef.navigate('List', { id: decodeURIComponent(clean.slice('/list/'.length)) });
    return;
  }
  const entry = (Object.entries(TAB_PATHS) as [TabRouteName, string][]).find(
    ([, tabPath]) => tabPath === clean,
  );
  const aliases: Record<string, TabRouteName> = { '/lists': 'lists', '/shared': 'family' };
  const screen: TabRouteName = aliases[clean] ?? (entry ? entry[0] : 'lists');
  navigationRef.navigate('Tabs', { screen });
}

export function back() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
  else push('/');
}

export const useRouter = () => ({ push, replace: push, back });

export const usePathname = () => pathStore((state) => state.pathname);
