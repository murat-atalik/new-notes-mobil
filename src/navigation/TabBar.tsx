import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ListChecks, Plus, Users, Wallet, type LucideIcon } from 'lucide-react-native';

import { palette, Text } from '../design';
import { useTheme } from '../hooks/useTheme';
import { tw } from '../lib/tw';
import { QuickAddSheet } from '../screens/home/QuickAddSheet';
import type { TabParamList } from './types';

const TABS: Record<keyof TabParamList, { label: string; icon: LucideIcon }> = {
  Home: { label: 'Bugün', icon: House },
  Lists: { label: 'Listeler', icon: ListChecks },
  Wallet: { label: 'Cüzdan', icon: Wallet },
  Family: { label: 'Aile', icon: Users },
};

/** Bottom bar: 4 tabs with a raised "+" (Hızlı Ekle) in the middle. */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [quickAdd, setQuickAdd] = useState(false);

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const meta = TABS[route.name as keyof TabParamList];
    const focused = state.index === index;
    const Icon = meta.icon;
    const color = focused ? (isDark ? palette.brandDark : palette.brand) : palette.slate400;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={tw`flex-1 items-center justify-center gap-1 h-14`}
      >
        <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
        <Text variant="caption" weight={focused ? 'bold' : 'medium'} style={{ color }}>
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <View
        style={[
          tw`absolute left-0 right-0 bottom-0 flex-row items-center px-2 pt-1.5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800`,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {renderTab(0)}
        {renderTab(1)}
        <View style={tw`flex-1 items-center`}>
          <Pressable
            onPress={() => setQuickAdd(true)}
            accessibilityRole="button"
            accessibilityLabel="Hızlı ekle"
            style={({ pressed }) => [
              tw`w-14 h-14 -mt-6 rounded-full bg-emerald-600 items-center justify-center shadow-lg border-4 border-slate-100 dark:border-slate-950`,
              pressed ? { transform: [{ scale: 0.94 }] } : null,
            ]}
          >
            <Plus size={28} color="#fff" strokeWidth={2.6} />
          </Pressable>
        </View>
        {renderTab(2)}
        {renderTab(3)}
      </View>
      <QuickAddSheet visible={quickAdd} onClose={() => setQuickAdd(false)} />
    </>
  );
};
