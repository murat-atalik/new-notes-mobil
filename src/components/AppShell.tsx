import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Web AppShell: fixed Header + pull-to-refresh main column. The BottomNav is the
 * tab bar of the navigator and the global modals live in App.tsx, so they are
 * mounted exactly once.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isDark } = useTheme();
  const { syncWithServer, isSyncing, setCreateListModalOpen } = useAppStore();

  return (
    <View style={tw`flex-1 bg-slate-100/70 dark:bg-slate-950`}>
      <Header onOpenCreateModal={() => setCreateListModalOpen(true)} />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`w-full max-w-4xl self-center px-3 pt-6 pb-8`}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => {
              syncWithServer(false);
            }}
            tintColor={isDark ? '#34d399' : '#059669'}
            colors={['#059669']}
          />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
};
