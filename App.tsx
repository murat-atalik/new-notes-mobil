import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer, type RouteProp, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react-native';

import { AnalyticsView } from './src/components/AnalyticsView';
import { AppShell } from './src/components/AppShell';
import { AuthModal } from './src/components/AuthModal';
import { BottomNav } from './src/components/BottomNav';
import { CategoriesView } from './src/components/CategoriesView';
import { ChangePasswordModal } from './src/components/ChangePasswordModal';
import { CreateListModal } from './src/components/CreateListModal';
import { FamilyView } from './src/components/FamilyView';
import { FinanceView } from './src/components/FinanceView';
import { InviteModal } from './src/components/InviteModal';
import { ListsView } from './src/components/ListsView';
import { NoteListView } from './src/components/NoteListView';
import { SettingsView } from './src/components/SettingsView';
import { ShoppingListView } from './src/components/ShoppingListView';
import { TemplatesView } from './src/components/TemplatesView';
import { TodoListView } from './src/components/TodoListView';
import { Btn, Text, ToastHost } from './src/components/ui';
import { loadTheme, useTheme } from './src/hooks/useTheme';
import { canUserAccessList } from './src/lib/permissions';
import {
  navigationRef,
  syncPathname,
  useRouter,
  type RootStackParamList,
  type TabParamList,
} from './src/lib/router';
import { preloadStorage } from './src/lib/storage';
import { ic, tw } from './src/lib/tw';
import { useAppStore } from './src/store/useAppStore';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

// Each screen subscribes to the theme so the whole subtree re-renders with the
// new twrnc color scheme when the user toggles light/dark.

function ListsScreen() {
  useTheme();
  const { setCreateListModalOpen, setInviteModalTargetList, setPwaInstallModalOpen } = useAppStore();
  return (
    <AppShell>
      <ListsView
        onOpenCreateModal={(type) => setCreateListModalOpen(true, type)}
        onOpenInvite={(list) => setInviteModalTargetList(list)}
        onOpenPwaModal={() => setPwaInstallModalOpen(true)}
      />
    </AppShell>
  );
}

function FinanceScreen() {
  useTheme();
  return (
    <AppShell>
      <FinanceView />
    </AppShell>
  );
}

function FamilyScreen() {
  useTheme();
  const { setCreateListModalOpen, setInviteModalTargetList } = useAppStore();
  return (
    <AppShell>
      <FamilyView
        onOpenCreateModal={() => setCreateListModalOpen(true)}
        onOpenInvite={(list) => setInviteModalTargetList(list)}
      />
    </AppShell>
  );
}

function AnalyticsScreen() {
  useTheme();
  return (
    <AppShell>
      <AnalyticsView />
    </AppShell>
  );
}

function SettingsScreen() {
  useTheme();
  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  );
}

function CategoriesScreen() {
  useTheme();
  const router = useRouter();
  return (
    <AppShell>
      <CategoriesView onBack={() => router.push('/settings')} />
    </AppShell>
  );
}

function TemplatesScreen() {
  useTheme();
  const router = useRouter();
  return (
    <AppShell>
      <TemplatesView onBack={() => router.push('/settings')} />
    </AppShell>
  );
}

/** Web `app/list/[id]/page.tsx`. */
function ListScreen() {
  useTheme();
  const router = useRouter();
  const route = useRoute<RouteProp<RootStackParamList, 'List'>>();
  const listId = route.params.id;
  const { lists, currentUser, isLoadingData, setInviteModalTargetList } = useAppStore();

  const list = lists.find((l) => l.id === listId);
  const hasAccess = list ? canUserAccessList(list, currentUser) : false;

  if (!list || !hasAccess) {
    if (isLoadingData) {
      return (
        <View style={tw`flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-4`}>
          <View style={tw`mb-3`}>
            <Loader2 {...ic('w-8 h-8 text-emerald-600')} />
          </View>
          <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400">Liste yükleniyor...</Text>
        </View>
      );
    }

    return (
      <View style={tw`flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-4`}>
        <View
          style={tw`w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 items-center justify-center mb-3`}
        >
          <ShieldAlert {...ic('w-6 h-6 text-rose-700 dark:text-rose-400')} />
        </View>
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {list ? 'Erişim İzniniz Yok' : 'Liste Bulunamadı'}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4 text-center">
          {list
            ? 'Bu liste başka bir aileye veya kişiye aittir. Yalnızca yetkili aile üyeleri bu listeyi görüntüleyebilir.'
            : 'Bu liste silinmiş veya mevcut değil.'}
        </Text>
        <Btn
          onPress={() => router.push('/')}
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white shadow-sm"
        >
          <ArrowLeft {...ic('w-4 h-4 text-white dark:text-slate-900')} />
          <Text className="text-xs font-bold text-white dark:text-slate-900">Listelerime Dön</Text>
        </Btn>
      </View>
    );
  }

  const onBack = () => router.back();
  const onOpenInvite = () => setInviteModalTargetList(list);

  return (
    <View style={tw`flex-1 bg-slate-50/70 dark:bg-slate-950`}>
      {list.type === 'SHOPPING' && <ShoppingListView list={list} onBack={onBack} onOpenInvite={onOpenInvite} />}
      {list.type === 'TODO' && <TodoListView list={list} onBack={onBack} onOpenInvite={onOpenInvite} />}
      {list.type === 'NOTE' && <NoteListView list={list} onBack={onBack} onOpenInvite={onOpenInvite} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={() => <ThemedBottomNav />}
      backBehavior="history"
    >
      <Tabs.Screen name="lists" component={ListsScreen} />
      <Tabs.Screen name="finance" component={FinanceScreen} />
      <Tabs.Screen name="family" component={FamilyScreen} />
      <Tabs.Screen name="analytics" component={AnalyticsScreen} />
      <Tabs.Screen name="settings" component={SettingsScreen} />
      <Tabs.Screen name="categories" component={CategoriesScreen} />
      <Tabs.Screen name="templates" component={TemplatesScreen} />
    </Tabs.Navigator>
  );
}

function ThemedBottomNav() {
  useTheme();
  return <BottomNav />;
}

/** Web AppShell's global modals, mounted once for the whole app. */
function GlobalModals() {
  const {
    createListModalOpen,
    createListModalInitialType,
    setCreateListModalOpen,
    inviteModalTargetList,
    setInviteModalTargetList,
    changePasswordModalOpen,
    authModalOpen,
  } = useAppStore();

  return (
    <>
      {createListModalOpen && (
        <CreateListModal initialType={createListModalInitialType} onClose={() => setCreateListModalOpen(false)} />
      )}
      {inviteModalTargetList && (
        <InviteModal list={inviteModalTargetList} onClose={() => setInviteModalTargetList(null)} />
      )}
      {changePasswordModalOpen && <ChangePasswordModal />}
      {authModalOpen && <AuthModal />}
    </>
  );
}

function Root() {
  const { isDark } = useTheme();
  const { isAuthenticated, fetchInitialData } = useAppStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // STRICT AUTH ENFORCEMENT: If user is not authenticated, show AuthModal only
  if (!isAuthenticated) {
    return (
      <View style={tw`flex-1 bg-slate-950 items-center justify-center p-4`}>
        <StatusBar barStyle="light-content" />
        <AuthModal />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-slate-50 dark:bg-slate-950`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navigationRef} onReady={syncPathname} onStateChange={syncPathname}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="List" component={ListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <GlobalModals />
      <ToastHost />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    preloadStorage().then(() => {
      loadTheme();
      useAppStore.getState().rehydrate();
      setReady(true);
    });
  }, []);

  return (
    <SafeAreaProvider>
      {ready ? (
        <Root />
      ) : (
        <View style={tw`flex-1 bg-slate-950 items-center justify-center`}>
          <ActivityIndicator color="#10b981" />
        </View>
      )}
    </SafeAreaProvider>
  );
}
