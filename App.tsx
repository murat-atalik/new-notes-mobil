import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthScreen } from './src/screens/AuthScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { ListsScreen } from './src/screens/ListsScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { AppList, Tab } from './src/types';
import {
  hydrateApp,
  selectApp,
  setDark,
  setUser,
  signIn,
  createServerList,
  deleteServerList,
} from './src/store/appStore';
import { store, type AppDispatch } from './src/store/store';

export type RootStackParamList = {
  Main: undefined;
  Detail: { list: AppList };
};

export type MainTabParamList = {
  lists: undefined;
  finance: undefined;
  family: undefined;
  analytics: undefined;
  settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

enableScreens();

function MainTabs() {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selectApp);
  const tabLabels: Record<Tab, string> = {
    lists: 'Listeler',
    finance: 'Finans',
    family: 'Ailemiz',
    analytics: 'Raporlar',
    settings: 'Ayarlar',
  };

  React.useEffect(() => {
    void dispatch(hydrateApp());
  }, [dispatch]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <View>
        <ActivityIndicator />
        <Text>Sunucu verileri yükleniyor</Text>
      </View>
    );
  }
  if (state.error && !state.user) {
    return (
      <View>
        <Text>{state.error}</Text>
      </View>
    );
  }

  const currentUser = state.user;
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={(username, password, name) =>
          dispatch(signIn({ username, password, name }))
            .unwrap()
            .then(() => undefined)
        }
      />
    );
  }

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        title: tabLabels[route.name],
      })}
    >
      <Tabs.Screen name="lists">
        {() => (
          <ListsScreen
            lists={state.lists}
            onDelete={(id) =>
              dispatch(deleteServerList(id))
                .unwrap()
                .then(() => undefined)
            }
            onCreate={(title, type, isShared) =>
              dispatch(createServerList({ title, type, isShared }))
                .unwrap()
                .then(() => undefined)
            }
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="finance">{() => <OverviewScreen tab="finance" />}</Tabs.Screen>
      <Tabs.Screen name="family">
        {() => <FamilyScreen user={currentUser} onUserChange={(user) => dispatch(setUser(user))} />}
      </Tabs.Screen>
      <Tabs.Screen name="analytics">{() => <OverviewScreen tab="analytics" />}</Tabs.Screen>
      <Tabs.Screen name="settings">
        {() => (
          <SettingsScreen
            user={currentUser}
            dark={state.dark}
            onDarkChange={(value) => dispatch(setDark(value))}
            onLogout={() => dispatch(setUser(null))}
          />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
