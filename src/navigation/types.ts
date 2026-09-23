import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { ListType } from '../types';

/** Bottom tabs. The center "+" button is not a route — it opens `QuickAddSheet`. */
export type TabParamList = {
  Home: undefined;
  Lists: { type?: ListType } | undefined;
  Wallet: undefined;
  Family: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

/** Everything pushed on top of the tabs. Screens marked (modal) use `presentation: 'modal'`. */
export type RootStackParamList = {
  Tabs: { screen?: keyof TabParamList; params?: TabParamList[keyof TabParamList] } | undefined;

  // Lists
  ListDetail: { listId: string };
  ListForm: { listId?: string; type?: ListType }; // (modal) create / edit
  ListShare: { listId: string }; // (modal) invite code, members, invite by username
  JoinList: undefined; // (modal) join by invite code
  ItemForm: { listId: string; itemId?: string }; // (modal)
  NoteEditor: { listId: string; itemId?: string }; // (modal)
  Checkout: { listId: string }; // (modal) shopping → expense

  // Wallet
  Expenses: { month?: string } | undefined;
  ExpenseDetail: { expenseId: string };
  ExpenseForm: { expenseId?: string; cardId?: string } | undefined; // (modal)
  Budget: undefined; // (modal) monthly budget & income
  Reports: { month?: string } | undefined;
  Cards: undefined;
  CardDetail: { cardId: string };
  CardForm: { cardId?: string } | undefined; // (modal)
  CardTransaction: { cardId: string; mode: 'SPEND' | 'TOP_UP' }; // (modal)
  Savings: undefined;
  AssetDetail: { assetId: string };
  AssetForm: { assetId?: string } | undefined; // (modal)
  AssetTransaction: { assetId: string; mode: 'DEPOSIT' | 'WITHDRAW' }; // (modal)

  // Family
  FamilyJoin: undefined; // (modal) join family by code
  FamilyEdit: { mode: 'create' | 'rename' }; // (modal)

  // Settings
  Settings: undefined;
  Profile: undefined; // (modal)
  ChangePassword: undefined; // (modal)
  Categories: undefined;
  CategoryForm: { categoryId?: string; type?: ListType } | undefined; // (modal)
  Templates: undefined;
  TemplateForm: { templateId?: string } | undefined; // (modal)
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

/** Typed navigation from any screen/component inside the app. */
export const useAppNavigation = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>();

/** Jump to a tab from anywhere. */
export const useTabNavigation = () => {
  const navigation = useAppNavigation();
  return <K extends keyof TabParamList>(screen: K, params?: TabParamList[K]) =>
    navigation.navigate('Tabs', { screen, params });
};
