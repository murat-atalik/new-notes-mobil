import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, CheckSquare, PiggyBank, Settings, Users } from 'lucide-react-native';

import { getAccessibleLists, isFamilyListForUser } from '../lib/permissions';
import { usePathname, useRouter } from '../lib/router';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { TabType } from '../types';
import { Btn, Text } from './ui';

export const BottomNav: React.FC = () => {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setActiveTab, lists, currentUser } = useAppStore();

  const accessibleLists = getAccessibleLists(lists, currentUser);
  const totalListsCount = accessibleLists.length;
  const sharedListsCount = accessibleLists.filter((l) => isFamilyListForUser(l, currentUser)).length;

  const navItems: {
    id: TabType;
    path: string;
    label: string;
    icon: typeof CheckSquare;
    badge?: number | string;
    isActive: (p: string) => boolean;
  }[] = [
    {
      id: 'lists',
      path: '/',
      label: 'Listeler',
      icon: CheckSquare,
      badge: totalListsCount > 0 ? (totalListsCount > 99 ? '99+' : totalListsCount) : undefined,
      isActive: (p) => p === '/' || p === '/lists' || p.startsWith('/list/'),
    },
    {
      id: 'finance',
      path: '/finance',
      label: 'Finans',
      icon: PiggyBank,
      isActive: (p) => p.startsWith('/finance'),
    },
    {
      id: 'shared',
      path: '/family',
      label: 'Ailemiz',
      icon: Users,
      badge: sharedListsCount > 0 ? (sharedListsCount > 99 ? '99+' : sharedListsCount) : undefined,
      isActive: (p) => p.startsWith('/family') || p.startsWith('/shared'),
    },
    {
      id: 'analytics',
      path: '/analytics',
      label: 'Raporlar',
      icon: BarChart3,
      isActive: (p) => p.startsWith('/analytics'),
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Ayarlar',
      icon: Settings,
      isActive: (p) => p.startsWith('/settings') || p.startsWith('/categories') || p.startsWith('/templates'),
    },
  ];

  return (
    <View
      style={[
        tw`bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800 shadow-lg`,
        { paddingBottom: Math.max(insets.bottom, 8) + 4 },
      ]}
    >
      <View style={tw`w-full max-w-md self-center flex-row px-2 pt-2 pb-0.5 gap-1`}>
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Btn
              key={item.id}
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                setActiveTab(item.id);
                router.push(item.path);
              }}
              className={`flex-1 items-center justify-center min-h-[52px] py-1.5 px-1 rounded-2xl ${
                active ? 'bg-emerald-50/90 dark:bg-emerald-950/60' : ''
              }`}
            >
              <View>
                <Icon
                  {...ic(
                    active
                      ? 'w-6 h-6 text-emerald-700 dark:text-emerald-400'
                      : 'w-6 h-6 text-slate-500 dark:text-slate-400',
                  )}
                />
                {item.badge !== undefined && (
                  <View
                    style={tw`absolute -top-1.5 -right-2 px-1.5 min-w-[17px] h-4 bg-emerald-600 dark:bg-emerald-500 rounded-full items-center justify-center border-2 border-white dark:border-slate-900`}
                  >
                    <Text className="text-white text-[9px] font-black">{item.badge}</Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                className={`text-[10px] mt-0.5 tracking-tight text-center max-w-[68px] leading-tight ${
                  active ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </Text>
            </Btn>
          );
        })}
      </View>
    </View>
  );
};
