import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
import { strings } from './src/strings/tr';
import { styles } from './src/screens/styles';
import { colors } from './src/constants/colors';

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
  const tabLabels: Record<Tab, string> = strings.nav;

  React.useEffect(() => {
    void dispatch(hydrateApp());
  }, [dispatch]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <SafeAreaView style={styles.safeScreen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.lead}>{strings.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (state.error && !state.user) {
    return (
      <SafeAreaView style={styles.safeScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{strings.common.error}</Text>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </SafeAreaView>
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
        tabBarIcon: () => <Text style={styles.navIcon}>{strings.icons[route.name]}</Text>,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.navLabel,
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
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
      <Tabs.Screen name="finance">
        {() => (
          <OverviewScreen
            tab="finance"
            expenses={state.expenses}
            paymentCards={state.paymentCards}
            savingsGoals={state.savingsGoals}
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="family">
        {() => <FamilyScreen user={currentUser} onUserChange={(user) => dispatch(setUser(user))} />}
      </Tabs.Screen>
      <Tabs.Screen name="analytics">
        {() => (
          <OverviewScreen
            tab="analytics"
            expenses={state.expenses}
            paymentCards={state.paymentCards}
            savingsGoals={state.savingsGoals}
          />
        )}
      </Tabs.Screen>
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
