import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ActionSheetHost, ToastHost } from './src/design';
import { loadTheme, useTheme } from './src/hooks/useTheme';
import { preloadStorage } from './src/lib/storage';
import { tw } from './src/lib/tw';
import { TabBar } from './src/navigation/TabBar';
import type { AuthStackParamList, RootStackParamList, TabParamList } from './src/navigation/types';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { CardDetailScreen } from './src/screens/cards/CardDetailScreen';
import { CardFormScreen } from './src/screens/cards/CardFormScreen';
import { CardsScreen } from './src/screens/cards/CardsScreen';
import { CardTransactionScreen } from './src/screens/cards/CardTransactionScreen';
import { FamilyEditScreen } from './src/screens/family/FamilyEditScreen';
import { FamilyJoinScreen } from './src/screens/family/FamilyJoinScreen';
import { FamilyScreen } from './src/screens/family/FamilyScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { CheckoutScreen } from './src/screens/list-detail/CheckoutScreen';
import { ItemFormScreen } from './src/screens/list-detail/ItemFormScreen';
import { ListDetailScreen } from './src/screens/list-detail/ListDetailScreen';
import { NoteEditorScreen } from './src/screens/list-detail/NoteEditorScreen';
import { JoinListScreen } from './src/screens/lists/JoinListScreen';
import { ListFormScreen } from './src/screens/lists/ListFormScreen';
import { ListShareScreen } from './src/screens/lists/ListShareScreen';
import { ListsScreen } from './src/screens/lists/ListsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { AssetDetailScreen } from './src/screens/savings/AssetDetailScreen';
import { AssetFormScreen } from './src/screens/savings/AssetFormScreen';
import { AssetTransactionScreen } from './src/screens/savings/AssetTransactionScreen';
import { SavingsScreen } from './src/screens/savings/SavingsScreen';
import { CategoriesScreen } from './src/screens/settings/CategoriesScreen';
import { CategoryFormScreen } from './src/screens/settings/CategoryFormScreen';
import { ChangePasswordScreen } from './src/screens/settings/ChangePasswordScreen';
import { ProfileScreen } from './src/screens/settings/ProfileScreen';
import { SettingsScreen } from './src/screens/settings/SettingsScreen';
import { TemplateFormScreen } from './src/screens/settings/TemplateFormScreen';
import { TemplatesScreen } from './src/screens/settings/TemplatesScreen';
import { BudgetScreen } from './src/screens/wallet/BudgetScreen';
import { ExpenseDetailScreen } from './src/screens/wallet/ExpenseDetailScreen';
import { ExpenseFormScreen } from './src/screens/wallet/ExpenseFormScreen';
import { ExpensesScreen } from './src/screens/wallet/ExpensesScreen';
import { ReportsScreen } from './src/screens/wallet/ReportsScreen';
import { WalletScreen } from './src/screens/wallet/WalletScreen';
import { useAppStore } from './src/store/useAppStore';

enableScreens();

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const modal: NativeStackNavigationOptions = { presentation: 'modal', gestureEnabled: true };

// Screens subscribe to the theme through `withTheme`, so a light/dark switch
// re-renders them with the new twrnc color scheme.
function withTheme<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const Themed: React.FC<P> = (props) => {
    useTheme();
    return <Component {...props} />;
  };
  Themed.displayName = `Themed(${Component.displayName ?? Component.name})`;
  return Themed;
}

const T = {
  Home: withTheme(HomeScreen),
  Lists: withTheme(ListsScreen),
  Wallet: withTheme(WalletScreen),
  Family: withTheme(FamilyScreen),
  Welcome: withTheme(WelcomeScreen),
  Login: withTheme(LoginScreen),
  Register: withTheme(RegisterScreen),
  Onboarding: withTheme(OnboardingScreen),
  ListDetail: withTheme(ListDetailScreen),
  ListForm: withTheme(ListFormScreen),
  ListShare: withTheme(ListShareScreen),
  JoinList: withTheme(JoinListScreen),
  ItemForm: withTheme(ItemFormScreen),
  NoteEditor: withTheme(NoteEditorScreen),
  Checkout: withTheme(CheckoutScreen),
  Expenses: withTheme(ExpensesScreen),
  ExpenseDetail: withTheme(ExpenseDetailScreen),
  ExpenseForm: withTheme(ExpenseFormScreen),
  Budget: withTheme(BudgetScreen),
  Reports: withTheme(ReportsScreen),
  Cards: withTheme(CardsScreen),
  CardDetail: withTheme(CardDetailScreen),
  CardForm: withTheme(CardFormScreen),
  CardTransaction: withTheme(CardTransactionScreen),
  Savings: withTheme(SavingsScreen),
  AssetDetail: withTheme(AssetDetailScreen),
  AssetForm: withTheme(AssetFormScreen),
  AssetTransaction: withTheme(AssetTransactionScreen),
  FamilyJoin: withTheme(FamilyJoinScreen),
  FamilyEdit: withTheme(FamilyEditScreen),
  Settings: withTheme(SettingsScreen),
  Profile: withTheme(ProfileScreen),
  ChangePassword: withTheme(ChangePasswordScreen),
  Categories: withTheme(CategoriesScreen),
  CategoryForm: withTheme(CategoryFormScreen),
  Templates: withTheme(TemplatesScreen),
  TemplateForm: withTheme(TemplateFormScreen),
};

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="Home" component={T.Home} />
      <Tabs.Screen name="Lists" component={T.Lists} />
      <Tabs.Screen name="Wallet" component={T.Wallet} />
      <Tabs.Screen name="Family" component={T.Family} />
    </Tabs.Navigator>
  );
}

function AppStack() {
  // Registration lands here first (see `justRegistered` in the store); a normal login
  // goes straight to Tabs. Read once per mount — Onboarding itself navigates away with
  // `replace`, so this never needs to react to the flag changing mid-session.
  const [initialRoute] = useState<'Tabs' | 'Onboarding'>(useAppStore.getState().justRegistered ? 'Onboarding' : 'Tabs');
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Onboarding" component={T.Onboarding} />

      <Stack.Screen name="ListDetail" component={T.ListDetail} />
      <Stack.Screen name="ListForm" component={T.ListForm} options={modal} />
      <Stack.Screen name="ListShare" component={T.ListShare} options={modal} />
      <Stack.Screen name="JoinList" component={T.JoinList} options={modal} />
      <Stack.Screen name="ItemForm" component={T.ItemForm} options={modal} />
      <Stack.Screen name="NoteEditor" component={T.NoteEditor} options={modal} />
      <Stack.Screen name="Checkout" component={T.Checkout} options={modal} />

      <Stack.Screen name="Expenses" component={T.Expenses} />
      <Stack.Screen name="ExpenseDetail" component={T.ExpenseDetail} />
      <Stack.Screen name="ExpenseForm" component={T.ExpenseForm} options={modal} />
      <Stack.Screen name="Budget" component={T.Budget} options={modal} />
      <Stack.Screen name="Reports" component={T.Reports} />
      <Stack.Screen name="Cards" component={T.Cards} />
      <Stack.Screen name="CardDetail" component={T.CardDetail} />
      <Stack.Screen name="CardForm" component={T.CardForm} options={modal} />
      <Stack.Screen name="CardTransaction" component={T.CardTransaction} options={modal} />
      <Stack.Screen name="Savings" component={T.Savings} />
      <Stack.Screen name="AssetDetail" component={T.AssetDetail} />
      <Stack.Screen name="AssetForm" component={T.AssetForm} options={modal} />
      <Stack.Screen name="AssetTransaction" component={T.AssetTransaction} options={modal} />

      <Stack.Screen name="FamilyJoin" component={T.FamilyJoin} options={modal} />
      <Stack.Screen name="FamilyEdit" component={T.FamilyEdit} options={modal} />

      <Stack.Screen name="Settings" component={T.Settings} />
      <Stack.Screen name="Profile" component={T.Profile} options={modal} />
      <Stack.Screen name="ChangePassword" component={T.ChangePassword} options={modal} />
      <Stack.Screen name="Categories" component={T.Categories} />
      <Stack.Screen name="CategoryForm" component={T.CategoryForm} options={modal} />
      <Stack.Screen name="Templates" component={T.Templates} />
      <Stack.Screen name="TemplateForm" component={T.TemplateForm} options={modal} />
    </Stack.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={T.Welcome} />
      <AuthStack.Screen name="Login" component={T.Login} />
      <AuthStack.Screen name="Register" component={T.Register} />
    </AuthStack.Navigator>
  );
}

function Root() {
  const { isDark } = useTheme();
  const { isAuthenticated, fetchInitialData } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) fetchInitialData();
  }, [isAuthenticated, fetchInitialData]);

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#020617', card: '#0f172a' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#f1f5f9', card: '#ffffff' } };

  return (
    <View style={tw`flex-1 bg-slate-100 dark:bg-slate-950`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navTheme}>{isAuthenticated ? <AppStack /> : <AuthFlow />}</NavigationContainer>
      <ActionSheetHost />
      <ToastHost />
    </View>
  );
}

/** Resolves with `undefined` instead of rejecting/hanging past `ms` (used so an offline
 * or slow network can't strand the user on the splash screen). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    preloadStorage().then(async () => {
      loadTheme();
      const store = useAppStore.getState();
      store.rehydrate();
      if (store.isAuthenticated) {
        // Confirms the persisted session token is still valid and loads fresh data in one
        // request, before the first frame renders — otherwise the app would flash the main
        // screen and immediately bounce back to login the moment the token turns out expired.
        await withTimeout(store.fetchInitialData(true), 8000);
      }
      setReady(true);
    });
  }, []);

  return <SafeAreaProvider>{ready ? <Root /> : <SplashScreen />}</SafeAreaProvider>;
}
