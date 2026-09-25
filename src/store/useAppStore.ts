import { create } from 'zustand';
import {
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_ITEMS,
  INITIAL_LISTS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TEMPLATES,
  INITIAL_USERS,
} from '../data/initialData';
import { DEFAULT_AVATAR } from '../data/emojis';
import { AppList, Category, ExpenseLog, ListItem, ListMember, ListTemplate, ListType, PaymentCard, CardTransaction, SavingsContribution, SavingsGoal, TabType, User } from '../types';
import { setLiveExchangeRates } from '../lib/currencyUnits';
import {
  handleZodValidation,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  inviteUserSchema,
  formatBilingualMessage,
  BilingualError,
} from '../lib/validations';
import { localStorage } from '../lib/storage';
import { API_BASE_URL } from '../config/api';
import * as mobileApi from '../services/mobileApi';
import { authHeaders, notifyUnauthorized, onUnauthorized } from '../services/session';

export const DEFAULT_STARTER_CARDS: PaymentCard[] = [
  {
    id: 'card-sodexo-default',
    userId: 'guest',
    familyId: 'fam_guest',
    isShared: true,
    name: 'Sodexo / Pluxee Yemek Kartı',
    type: 'FOOD_CARD',
    provider: 'Sodexo',
    color: '#0284c7',
    icon: 'Utensils',
    balance: 2450,
    initialBalance: 2450,
    monthlyAllowance: 4500,
    transactions: [
      {
        id: 'tx-sodexo-1',
        cardId: 'card-sodexo-default',
        amount: 4500,
        type: 'TOP_UP',
        title: 'Aylık Yemek Ücreti Yüklemesi',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        note: 'Şirket yemek hak edişi',
      },
      {
        id: 'tx-sodexo-2',
        cardId: 'card-sodexo-default',
        amount: 2050,
        type: 'SPEND',
        title: 'Öğle Yemekleri & Market Harcaması',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        categoryName: 'Restoran & Yemek',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-multinet-default',
    userId: 'guest',
    familyId: 'fam_guest',
    isShared: true,
    name: 'Multinet Yemek Kartı',
    type: 'FOOD_CARD',
    provider: 'Multinet',
    color: '#f59e0b',
    icon: 'Utensils',
    balance: 1650,
    initialBalance: 1650,
    monthlyAllowance: 4000,
    transactions: [
      {
        id: 'tx-multi-1',
        cardId: 'card-multinet-default',
        amount: 4000,
        type: 'TOP_UP',
        title: 'Aylık Yemek Yüklemesi',
        date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-credit-bonus',
    userId: 'guest',
    familyId: 'fam_guest',
    isShared: true,
    name: 'Garanti BBVA Bonus Kredi Kartı',
    type: 'CREDIT_CARD',
    provider: 'Garanti BBVA',
    last4: '4589',
    color: '#6366f1',
    icon: 'CreditCard',
    balance: 0,
    creditLimit: 50000,
    currentDebt: 6450,
    cutoffDay: 15,
    dueDay: 25,
    transactions: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-debit-isbank',
    userId: 'guest',
    familyId: 'fam_guest',
    isShared: true,
    name: 'İş Bankası Vadesiz Hesap',
    type: 'DEBIT_CARD',
    provider: 'İş Bankası',
    last4: '1092',
    color: '#10b981',
    icon: 'Building2',
    balance: 14200,
    initialBalance: 14200,
    transactions: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-cash-wallet',
    userId: 'guest',
    familyId: 'fam_guest',
    isShared: true,
    name: 'Nakit Para Cüzdanım',
    type: 'CASH_WALLET',
    provider: 'Nakit',
    color: '#0d9488',
    icon: 'Wallet',
    balance: 950,
    initialBalance: 950,
    transactions: [],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ANONYMOUS_USER: User = {
  id: 'guest',
  name: 'Ziyaretçi',
  username: 'ziyaretci',
  avatar: '👤',
  color: '#10b981',
  familyId: 'fam_guest',
  familyName: 'Ailemiz',
  familyCode: 'AIL-0001',
  familyRole: 'HEAD',
};

export function generateFamilyCode(usernameOrSeed?: string): string {
  const raw = (usernameOrSeed || 'AIL').toLowerCase().replace(/[^a-z0-9]/g, '');
  const prefix = (raw.slice(0, 3) || 'AIL').toUpperCase().padEnd(3, 'X');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  const digits = Math.abs(hash % 9000) + 1000;
  return `AIL-${prefix}${digits}`;
}

export function ensureUserFamily(user: User): User {
  if (!user || user.id === 'guest') return user;
  const familyId = user.familyId || `fam_${user.username || user.id}`;
  const familyName = user.familyName || `${user.name} Ailesi`;
  const familyCode = user.familyCode || generateFamilyCode(user.username || user.id);
  const familyRole = user.familyRole || 'HEAD';
  return {
    ...user,
    familyId,
    familyName,
    familyCode,
    familyRole,
  };
}

// Native app: navigation is handled by react-navigation, not the URL hash.
export function parseRouteFromHash(): { activeTab: TabType; selectedListId: string | null } {
  return { activeTab: 'lists', selectedListId: null };
}

export function updateUrlHash(_tab: TabType, _selectedListId: string | null) {}

// Helper to fire-and-forget CRUD REST API requests
async function apiCall(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE_URL + endpoint, options);
    if (res.status === 401) notifyUnauthorized();
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.warn(`REST CRUD ${method} ${endpoint} warning:`, err);
    return null;
  }
}

interface AppState {
  // Authentication & Session
  isAuthenticated: boolean;
  /** True right after a successful registration (not persisted); tells AppStack to open
   * the onboarding screen instead of Tabs. Cleared once onboarding is left. */
  justRegistered: boolean;
  setJustRegistered: (value: boolean) => void;
  currentUser: User;
  users: User[];
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  changePasswordModalOpen: boolean;
  createListModalOpen: boolean;
  createListModalInitialType?: ListType;
  inviteModalTargetList: AppList | null;
  pwaInstallModalOpen: boolean;
  sessionToken: string | null;
  isLoadingData: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Navigation & View
  activeTab: TabType;
  selectedListId: string | null;

  // Core Data
  categories: Category[];
  templates: ListTemplate[];
  lists: AppList[];
  items: ListItem[];
  expenses: ExpenseLog[];
  savingsGoals: SavingsGoal[];
  paymentCards: PaymentCard[];
  monthlyBudget: number;
  monthlyIncome: number;

  // Filter / Search
  searchQuery: string;
  selectedCategoryId: string | null;
  analyticsMonth: string;

  // Initial Load & Synchronisation
  fetchInitialData: (forceSync?: boolean) => Promise<void>;
  syncWithServer: (silent?: boolean) => Promise<{ success: boolean; error?: string }>;

  // Family Management Actions
  updateFamilyName: (name: string) => Promise<void>;
  joinFamilyByCode: (familyCode: string) => Promise<{ success: boolean; message: string; familyName?: string }>;
  leaveFamilyToPersonal: () => Promise<void>;
  createFamily: (familyName: string) => Promise<string>;

  // Global Modals Actions
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  setChangePasswordModalOpen: (open: boolean) => void;
  setCreateListModalOpen: (open: boolean, initialType?: ListType) => void;
  setInviteModalTargetList: (list: AppList | null) => void;
  setPwaInstallModalOpen: (open: boolean) => void;
  login: (credentials: { username: string; password?: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string; bilingualError?: BilingualError }>;
  register: (data: { name: string; username: string; password?: string; confirmPassword?: string; avatar?: string; color?: string }) => Promise<{ success: boolean; error?: string; bilingualError?: BilingualError }>;
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string; bilingualError?: BilingualError }>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;

  // Navigation Actions
  setActiveTab: (tab: TabType) => void;
  setSelectedListId: (id: string | null) => void;
  syncFromHash: () => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setAnalyticsMonth: (m: string) => void;

  // List Actions (REST CRUD: /api/lists)
  createList: (list: Omit<AppList, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'members' | 'inviteCode'>) => string;
  updateList: (id: string, updates: Partial<AppList>) => void;
  deleteList: (id: string) => void;
  duplicateList: (id: string) => string;
  joinListWithCode: (code: string) => Promise<{ success: boolean; message?: string; listId?: string }>;
  inviteUserToList: (listId: string, usernameOrEmail: string, role?: 'EDITOR' | 'OWNER') => Promise<{ success: boolean; message?: string; error?: string; bilingualError?: BilingualError }>;
  removeMemberFromList: (listId: string, userId: string) => void;
  /** Current user leaves a list they do not own (sharing settings of the list stay unchanged). */
  leaveList: (listId: string) => void;

  // Item Actions (REST CRUD: /api/items)
  addItem: (item: Omit<ListItem, 'id' | 'createdAt'>) => void;
  toggleItemCompleted: (id: string) => void;
  toggleItemComplete: (id: string) => void;
  updateItem: (id: string, updates: Partial<ListItem>) => void;
  deleteItem: (id: string) => void;
  clearCompletedItems: (listId: string) => void;

  // Bulk Item Operations
  markAllItemsCompleted: (listId: string) => void;
  unmarkAllItemsCompleted: (listId: string) => void;
  uncheckAllItems: (listId: string) => void;
  deleteAllItemsInList: (listId: string) => void;
  bulkAddItems: (listId: string, titles: string[], defaultCategoryId?: string) => void;
  checkoutShoppingList: (listId: string, paymentMethod?: string, cardId?: string) => { totalAmount: number; itemCount: number };

  // Expense Actions (REST CRUD: /api/expenses)
  addExpense: (expense: Omit<ExpenseLog, 'id'>) => void;
  addDirectExpense: (expense: Omit<ExpenseLog, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, updates: Partial<ExpenseLog>) => void;
  setMonthlyBudget: (budget: number) => void;
  setMonthlyIncome: (income: number) => void;

  // Savings Actions (REST CRUD: /api/savings)
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'> & { initialAmount?: number; assetType?: any; institution?: string; currency?: string; unitQuantity?: number; unitPrice?: number; notes?: string; linkedCardId?: string; linkedCardName?: string; excludeFromReports?: boolean }) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addSavingsContribution: (goalId: string, contribution: { amount: number; unitQuantity?: number; note?: string; type: 'DEPOSIT' | 'WITHDRAW'; cardId?: string; cardName?: string }) => void;

  // Payment Cards & Food Cards Actions (REST CRUD: /api/cards)
  addPaymentCard: (card: Omit<PaymentCard, 'id' | 'createdAt'>) => string;
  updatePaymentCard: (id: string, updates: Partial<PaymentCard>) => void;
  deletePaymentCard: (id: string) => void;
  topUpCardBalance: (cardId: string, amount: number, note?: string) => void;
  spendFromCard: (cardId: string, amount: number, title: string, categoryName?: string, relatedExpenseId?: string, note?: string) => void;

  // Exchange Rates (Günlük DB önbellekli döviz kurları - EUR/TRY, USD/TRY, GBP/TRY)
  exchangeRates: Record<string, number>;
  exchangeRatesDate: string | null;
  exchangeRatesSource: string | null;
  isRatesFromDb: boolean;
  isFetchingRates: boolean;
  fetchDailyExchangeRates: (force?: boolean) => Promise<void>;

  // Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Template Actions
  addTemplate: (template: ListTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ListTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createListFromTemplate: (templateId: string, customTitle?: string, isShared?: boolean) => string;

  // Native: reload persisted state after AsyncStorage preload
  rehydrate: () => void;

  // Reset Data
  resetUserData: (userId?: string) => void;
  resetToDefaultData: () => void;
}

const LOCAL_STORAGE_KEY = 'akilli_liste_app_state_v8_clean';
const SESSION_STORAGE_KEY = 'better_auth_session_user_v8_clean';

const getInitialState = () => {
  try {
    if (false as boolean) {
      return {
        lists: INITIAL_LISTS,
        items: INITIAL_ITEMS,
        expenses: INITIAL_EXPENSES,
        savingsGoals: INITIAL_SAVINGS_GOALS,
        paymentCards: [] as PaymentCard[],
        categories: INITIAL_CATEGORIES,
        templates: INITIAL_TEMPLATES,
        monthlyBudget: 15000,
        monthlyIncome: 45000,
        users: INITIAL_USERS,
        currentUser: DEFAULT_ANONYMOUS_USER,
        isAuthenticated: false,
      };
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const sessionSaved = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionUser = sessionSaved ? JSON.parse(sessionSaved) : null;

    if (saved) {
      const parsed = JSON.parse(saved);
      const rawUsers: User[] = parsed.users || [];
      const currentUser: User = sessionUser || parsed.currentUser || (rawUsers.length > 0 ? rawUsers[0] : DEFAULT_ANONYMOUS_USER);
      const isAuth = !!sessionUser || (rawUsers.length > 0 && parsed.isAuthenticated);

      const loadedExpenses: ExpenseLog[] = parsed.expenses || INITIAL_EXPENSES;
      const rawCards: PaymentCard[] = parsed.paymentCards || [];
      const sanitizedCards = sanitizePaymentCards(rawCards, loadedExpenses);

      return {
        lists: parsed.lists || INITIAL_LISTS,
        items: parsed.items || INITIAL_ITEMS,
        expenses: loadedExpenses,
        savingsGoals: parsed.savingsGoals || INITIAL_SAVINGS_GOALS,
        paymentCards: sanitizedCards,
        categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : INITIAL_CATEGORIES,
        templates: parsed.templates || INITIAL_TEMPLATES,
        monthlyBudget: parsed.monthlyBudget || 15000,
        monthlyIncome: parsed.monthlyIncome || 45000,
        users: rawUsers,
        currentUser,
        isAuthenticated: isAuth,
      };
    }
  } catch (e) {
    console.error('LocalStorage parse error', e);
  }

  const defaultExpenses = INITIAL_EXPENSES;
  const defaultSanitizedCards = sanitizePaymentCards([], defaultExpenses);

  return {
    lists: INITIAL_LISTS,
    items: INITIAL_ITEMS,
    expenses: defaultExpenses,
    savingsGoals: INITIAL_SAVINGS_GOALS,
    paymentCards: defaultSanitizedCards,
    categories: INITIAL_CATEGORIES,
    templates: INITIAL_TEMPLATES,
    monthlyBudget: 15000,
    monthlyIncome: 45000,
    users: INITIAL_USERS,
    currentUser: DEFAULT_ANONYMOUS_USER,
    isAuthenticated: false,
  };
};

/**
 * Sanitizes payment cards:
 * 1. Strictly maps each expense to at most ONE card owner.
 * 2. Purges cross-contaminated transactions (e.g. transactions that leaked to other cards).
 * 3. Prevents generic credit card matching from duplicating an expense across multiple cards.
 * 4. Eliminates duplicate transactions and ensures each expense transaction exists only on its rightful card.
 * 5. Re-computes accurate currentDebt for credit cards (initial opening debt + total spend - total payments).
 */
export function sanitizePaymentCards(cards: PaymentCard[], expenses: ExpenseLog[] = []): PaymentCard[] {
  if (!Array.isArray(cards)) return [];

  // Step 1: Map each expense to its definitive single card owner (if any)
  // An expense can belong to at most ONE card.
  const expenseOwnerCardId = new Map<string, string>(); // expenseId -> cardId
  const genericPaymentPhrases = new Set([
    'kredi kartı',
    'kredi karti',
    'kredi',
    'kart',
    'nakit',
    'banka kartı',
    'banka karti',
    'havale',
    'eft',
    'otomatik ödeme',
    'diğer',
    'diger',
  ]);

  for (const exp of expenses) {
    if (!exp || !exp.id) continue;
    let ownerCard: PaymentCard | undefined;

    // 1. Direct cardId match takes highest priority
    if (exp.cardId) {
      ownerCard = cards.find((c) => c.id === exp.cardId);
    }
    // 2. Exact cardName match
    if (!ownerCard && exp.cardName) {
      const trimmed = exp.cardName.trim().toLowerCase();
      ownerCard = cards.find((c) => c.name.trim().toLowerCase() === trimmed);
    }
    // 3. Payment method match ONLY if it directly matches a card's name and is NOT a generic phrase
    if (!ownerCard && exp.paymentMethod) {
      const pm = exp.paymentMethod.trim().toLowerCase();
      if (!genericPaymentPhrases.has(pm)) {
        ownerCard = cards.find((c) => c.name.trim().toLowerCase() === pm);
      }
    }

    if (ownerCard) {
      expenseOwnerCardId.set(exp.id, ownerCard.id);
    }
  }

  // Step 2: Track claimed expenses globally so no expense can EVER be in more than one card
  const globallyClaimedExpenseIds = new Set<string>();

  return cards.map((card) => {
    const rawTx = Array.isArray(card.transactions) ? card.transactions : [];

    const seenTxIds = new Set<string>();
    const seenFingerprints = new Set<string>();
    const cleanTx: CardTransaction[] = [];

    // Calculate baseline/opening debt for credit cards before transactions were incurred
    let rawSpendTotal = 0;
    let rawTopUpTotal = 0;
    for (const tx of rawTx) {
      if (!tx || typeof tx.amount !== 'number' || isNaN(tx.amount)) continue;
      if (tx.type === 'SPEND') rawSpendTotal += Number(tx.amount) || 0;
      if (tx.type === 'TOP_UP') rawTopUpTotal += Number(tx.amount) || 0;
    }
    const initialOpeningDebt = Math.max(0, (card.currentDebt || 0) - rawSpendTotal + rawTopUpTotal);

    // Filter existing transactions on this card
    for (const tx of rawTx) {
      if (!tx || typeof tx.amount !== 'number' || isNaN(tx.amount)) continue;

      const relatedExpId = tx.relatedExpenseId || (tx.id?.startsWith('tx-sync-') ? tx.id.replace('tx-sync-', '') : undefined);

      if (relatedExpId) {
        const ownerCardId = expenseOwnerCardId.get(relatedExpId);

        // If this expense is owned by a different card, REJECT and purge from this card!
        if (ownerCardId && ownerCardId !== card.id) {
          continue;
        }

        // If the expense exists in the expenses list but has no card owner (unassigned/generic expense), REJECT!
        const expExists = expenses.some((e) => e.id === relatedExpId);
        if (expExists && !ownerCardId) {
          continue;
        }

        // If another card already claimed this expense, REJECT!
        if (globallyClaimedExpenseIds.has(relatedExpId)) {
          continue;
        }
      }

      // If tx.cardId was explicitly set to another card, REJECT!
      if (tx.cardId && tx.cardId !== card.id) {
        continue;
      }

      // Skip duplicate transaction IDs
      if (tx.id && seenTxIds.has(tx.id)) continue;

      // Fingerprint deduplication for this card
      const d = (tx.date || '').split('T')[0];
      const amt = Number(tx.amount).toFixed(2);
      const fp = `${card.id}_${d}_${amt}_${tx.type}_${relatedExpId || tx.title || ''}`;
      if (seenFingerprints.has(fp)) continue;

      seenFingerprints.add(fp);
      if (tx.id) seenTxIds.add(tx.id);
      if (relatedExpId) {
        globallyClaimedExpenseIds.add(relatedExpId);
      }

      cleanTx.push({
        ...tx,
        cardId: card.id,
        amount: Number(tx.amount),
        date: d || tx.date,
      });
    }

    // Step 3: Recover any expense specifically owned by THIS card that was missing from its transactions
    for (const exp of expenses) {
      if (!exp || !exp.amount) continue;
      // Only process expenses that definitively belong to this card!
      if (expenseOwnerCardId.get(exp.id) !== card.id) continue;
      if (globallyClaimedExpenseIds.has(exp.id)) continue;

      const d = (exp.date || '').split('T')[0];
      const amt = Number(exp.amount).toFixed(2);
      const fp = `${card.id}_${d}_${amt}_SPEND_${exp.id}`;
      const fpAlt = `${card.id}_${d}_${amt}_SPEND_${exp.itemsSummary?.[0] || exp.note || exp.categoryName || ''}`;

      if (!seenFingerprints.has(fp) && !seenFingerprints.has(fpAlt)) {
        seenFingerprints.add(fp);
        globallyClaimedExpenseIds.add(exp.id);
        cleanTx.push({
          id: `tx-sync-${exp.id}`,
          cardId: card.id,
          amount: Number(exp.amount),
          type: 'SPEND',
          title: exp.itemsSummary?.[0] || exp.note || exp.listTitle || exp.categoryName || 'Harcama',
          date: d,
          categoryName: exp.categoryName,
          relatedExpenseId: exp.id,
          note: exp.note,
        });
      }
    }

    // Step 4: Accurately compute currentDebt for CREDIT_CARD based on clean transactions
    let currentDebt = card.currentDebt;
    if (card.type === 'CREDIT_CARD') {
      const cleanSpendTotal = cleanTx.filter((t) => t.type === 'SPEND').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const cleanTopUpTotal = cleanTx.filter((t) => t.type === 'TOP_UP').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      currentDebt = Math.max(0, initialOpeningDebt + cleanSpendTotal - cleanTopUpTotal);
    }

    return {
      ...card,
      currentDebt,
      transactions: cleanTx.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    };
  });
}

const initialPersisted = getInitialState();

export const useAppStore = create<AppState>((set, get) => {
  // A 401 from any API call means the session is gone: return to the login screen.
  onUnauthorized(() => {
    if (get().isAuthenticated) get().logout();
  });

  const persist = () => {
    try {
      const state = get();
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          lists: state.lists,
          items: state.items,
          expenses: state.expenses,
          savingsGoals: state.savingsGoals,
          paymentCards: state.paymentCards,
          categories: state.categories,
          templates: state.templates,
          monthlyBudget: state.monthlyBudget,
          monthlyIncome: state.monthlyIncome,
          currentUser: state.currentUser,
          users: state.users,
          isAuthenticated: state.isAuthenticated,
        })
      );
      if (state.isAuthenticated && state.currentUser && state.currentUser.id !== 'guest') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state.currentUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  };

  /** Loads the user's scoped data from the server and replaces local collections. */
  const applyBootstrap = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await mobileApi.bootstrap();
    if (!res.ok) return { success: false, error: res.error };
    const { user, users, lists, items, expenses, savingsGoals, paymentCards } = res.data;
    const activeUser = ensureUserFamily(user);
    set(() => ({
      lists,
      items,
      expenses,
      savingsGoals,
      paymentCards: sanitizePaymentCards(paymentCards, expenses),
      users: users.map(ensureUserFamily),
      currentUser: activeUser,
      lastSyncedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }));
    persist();
    return { success: true };
  };

  const toggleComplete = (id: string) => {
    const state = get();
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    const nextCompleted = !item.isCompleted;
    const now = new Date().toISOString();
    const completedBy = nextCompleted ? state.currentUser.id : undefined;
    const completedAt = nextCompleted ? now : undefined;

    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? {
              ...i,
              isCompleted: nextCompleted,
              completedBy,
              completedAt,
            }
          : i
      ),
    }));
    persist();

    // Standard CRUD REST: PUT /api/items
    apiCall('/api/items', 'PUT', {
      id,
      isCompleted: nextCompleted,
      completedBy: completedBy || null,
      completedAt: completedAt || null,
    });
  };

  const unmarkAll = (listId: string) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.listId === listId
          ? {
              ...i,
              isCompleted: false,
              completedBy: undefined,
              completedAt: undefined,
            }
          : i
      ),
    }));
    persist();

    const state = get();
    state.items.filter((i) => i.listId === listId).forEach((it) => {
      apiCall('/api/items', 'PUT', { id: it.id, isCompleted: false, completedBy: null, completedAt: null });
    });
  };

  const addExpenseFn = (expenseData: Omit<ExpenseLog, 'id'>) => {
    const state = get();
    const id = `exp-${Date.now()}`;
    let cardName = expenseData.cardName;
    let cardType = expenseData.cardType;
    let updatedCards = state.paymentCards;

    // Resolve target card strictly by cardId, exact cardName, or non-generic paymentMethod
    let targetCard: PaymentCard | undefined;
    if (expenseData.cardId) {
      targetCard = state.paymentCards.find((c) => c.id === expenseData.cardId);
    } else if (expenseData.cardName) {
      const trimmed = expenseData.cardName.trim().toLowerCase();
      targetCard = state.paymentCards.find((c) => c.name.trim().toLowerCase() === trimmed);
    } else if (expenseData.paymentMethod) {
      const pm = expenseData.paymentMethod.trim().toLowerCase();
      const genericPhrases = [
        'kredi kartı',
        'kredi karti',
        'kredi',
        'kart',
        'nakit',
        'banka kartı',
        'banka karti',
        'havale',
        'eft',
        'otomatik ödeme',
        'diğer',
        'diger',
      ];
      if (!genericPhrases.includes(pm)) {
        targetCard = state.paymentCards.find((c) => c.name.trim().toLowerCase() === pm);
      }
    }

    if (targetCard) {
      cardName = targetCard.name;
      cardType = targetCard.type;

      const title =
        expenseData.itemsSummary?.[0] ||
        expenseData.note ||
        expenseData.listTitle ||
        expenseData.categoryName ||
        (targetCard.type === 'FOOD_CARD' ? 'Yemek Harcaması' : 'Harcama');

      const newTx: CardTransaction = {
        id: `tx-${Date.now()}`,
        cardId: targetCard.id,
        amount: expenseData.amount,
        type: 'SPEND',
        title,
        date: expenseData.date,
        categoryName: expenseData.categoryName,
        relatedExpenseId: id,
        note: expenseData.note,
      };

      const isBalanceCard =
        targetCard.type === 'FOOD_CARD' ||
        targetCard.type === 'DEBIT_CARD' ||
        targetCard.type === 'CASH_WALLET' ||
        targetCard.type === 'PREPAID_CARD';

      const newBalance = isBalanceCard
        ? Math.max(0, (targetCard.balance || 0) - expenseData.amount)
        : targetCard.balance;

      const newDebt =
        targetCard.type === 'CREDIT_CARD'
          ? (targetCard.currentDebt || 0) + expenseData.amount
          : targetCard.currentDebt;

      updatedCards = state.paymentCards.map((c) =>
        c.id === targetCard!.id
          ? {
              ...c,
              balance: newBalance,
              currentDebt: newDebt,
              transactions: [newTx, ...(c.transactions || [])],
              updatedAt: new Date().toISOString(),
            }
          : c
      );

      // Notify card API
      apiCall('/api/cards', 'POST', {
        action: 'TRANSACTION',
        cardId: targetCard.id,
        transaction: newTx,
        currentDebt: newDebt,
        balance: newBalance,
      });
    }

    const newExpense: ExpenseLog = {
      ...expenseData,
      id,
      currency: expenseData.currency || targetCard?.currency || 'TRY',
      cardId: targetCard?.id || expenseData.cardId,
      cardName: cardName || targetCard?.name,
      cardType: cardType || targetCard?.type,
      familyId: state.currentUser.familyId,
    };

    set((s) => ({
      expenses: [newExpense, ...s.expenses],
      paymentCards: updatedCards,
    }));
    persist();

    // Standard CRUD REST: POST /api/expenses
    apiCall('/api/expenses', 'POST', newExpense);
  };

  return {
    rehydrate: () => {
      const restored = getInitialState();
      set({ ...restored, authModalOpen: !restored.isAuthenticated });
    },

    // Auth initial states
    isAuthenticated: initialPersisted.isAuthenticated,
    justRegistered: false,
    setJustRegistered: (value) => set({ justRegistered: value }),
    currentUser: initialPersisted.currentUser,
    users: initialPersisted.users,
    authModalOpen: !initialPersisted.isAuthenticated,
    authModalMode: 'login',
    changePasswordModalOpen: false,
    createListModalOpen: false,
    inviteModalTargetList: null,
    pwaInstallModalOpen: false,
    sessionToken: 'auth_sess_' + Math.random().toString(36).substring(2, 9),
    isLoadingData: false,
    isSyncing: false,
    lastSyncedAt: null,

    // Navigation & Data (Initialized from URL Hash)
    activeTab: 'lists',
    selectedListId: null,
    categories: initialPersisted.categories,
    templates: initialPersisted.templates,
    lists: initialPersisted.lists,
    items: initialPersisted.items,
    expenses: initialPersisted.expenses,
    savingsGoals: initialPersisted.savingsGoals,
    paymentCards: initialPersisted.paymentCards,
    monthlyBudget: initialPersisted.monthlyBudget,
    monthlyIncome: initialPersisted.monthlyIncome,
    searchQuery: '',
    selectedCategoryId: null,
    analyticsMonth: new Date().toISOString().substring(0, 7),

    // Exchange Rates State
    exchangeRates: { TRY: 1, EUR: 37.80, USD: 34.25, GBP: 44.90 },
    exchangeRatesDate: null,
    exchangeRatesSource: null,
    isRatesFromDb: false,
    isFetchingRates: false,

    fetchDailyExchangeRates: async (force = false) => {
      try {
        set({ isFetchingRates: true });
        const url = force ? '/api/exchange-rates?force=true' : '/api/exchange-rates';
        const res = await fetch(API_BASE_URL + url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.ratesInTRY) {
            setLiveExchangeRates(data.ratesInTRY);
            set({
              exchangeRates: data.ratesInTRY,
              exchangeRatesDate: data.dateStr || new Date().toISOString().split('T')[0],
              exchangeRatesSource: data.source || 'Açık Döviz Kuru API',
              isRatesFromDb: !!data.fromCache,
            });
          }
        }
      } catch (err) {
        console.warn('[ExchangeRates] fetch error:', err);
      } finally {
        set({ isFetchingRates: false });
      }
    },

    fetchInitialData: async (forceSync = false) => {
      get().fetchDailyExchangeRates();
      const user = get().currentUser;
      if (!get().isAuthenticated || user.id === 'guest') return;
      set({ isLoadingData: !forceSync, isSyncing: true });
      try {
        await applyBootstrap();
      } finally {
        set({ isLoadingData: false, isSyncing: false });
      }
    },

    syncWithServer: async (silent = true) => {
      if (!get().isAuthenticated || get().currentUser.id === 'guest') return { success: false, error: 'Oturum yok' };
      if (!silent) set({ isSyncing: true });
      try {
        return await applyBootstrap();
      } finally {
        set({ isSyncing: false });
      }
    },

    // Family Management Actions (Optimistic Update + Immediate Server Re-fetch)
    updateFamilyName: async (name: string) => {
      const state = get();
      const user = state.currentUser;
      if (!user || user.id === 'guest') return;

      const trimmed = name.trim();
      if (!trimmed) return;

      // 1. Optimistic Update (0ms)
      const updatedUser: User = { ...user, familyName: trimmed };
      const updatedUsers = state.users.map((u) =>
        u.familyId === user.familyId ? { ...u, familyName: trimmed } : u
      );

      set({
        currentUser: updatedUser,
        users: updatedUsers,
      });
      persist();

      // 2. Background REST Sync + Server Re-fetch
      await apiCall('/api/users', 'PUT', { id: user.id, familyName: trimmed });
      await get().syncWithServer(true);
    },

    joinFamilyByCode: async (familyCode: string) => {
      const user = get().currentUser;
      if (!user || user.id === 'guest') {
        return { success: false, message: 'Lütfen önce giriş yapın.' };
      }
      const cleanCode = familyCode.trim().toUpperCase().replace(/\s+/g, '');
      if (!cleanCode) {
        return { success: false, message: 'Lütfen geçerli bir Aile Kodu girin.' };
      }
      if (user.familyCode && user.familyCode.toUpperCase() === cleanCode) {
        return { success: true, message: 'Zaten bu ailenin üyesisiniz!', familyName: user.familyName };
      }
      const res = await mobileApi.joinFamily(cleanCode);
      if (!res.ok) return { success: false, message: res.error };
      const updatedUser = ensureUserFamily({ ...user, ...res.data.user, id: user.id });
      set((s) => ({
        currentUser: updatedUser,
        users: s.users.map((u) => (u.id === user.id ? updatedUser : u)),
      }));
      persist();
      await get().syncWithServer(false);
      return { success: true, message: res.data.message, familyName: updatedUser.familyName };
    },

    leaveFamilyToPersonal: async () => {
      const state = get();
      const user = state.currentUser;
      if (!user || user.id === 'guest') return;

      const newFamilyId = `fam_${user.id}_${Date.now()}`;
      const newFamilyName = `${user.name} Ailesi`;
      const newFamilyCode = generateFamilyCode(user.username);

      // 1. Optimistic Update: Detach immediately
      const updatedUser: User = {
        ...user,
        familyId: newFamilyId,
        familyName: newFamilyName,
        familyCode: newFamilyCode,
        familyRole: 'HEAD',
      };

      const updatedUsers = state.users.map((u) => (u.id === user.id ? updatedUser : u));

      set({
        currentUser: updatedUser,
        users: updatedUsers,
      });
      persist();

      // 2. DB Update + Server Re-fetch
      await apiCall('/api/users', 'PUT', {
        id: user.id,
        familyId: newFamilyId,
        familyName: newFamilyName,
        familyCode: newFamilyCode,
        familyRole: 'HEAD',
      });

      await get().syncWithServer(false);
    },

    createFamily: async (familyName: string) => {
      const state = get();
      const user = state.currentUser;
      const cleanName = familyName.trim() || `${user.name} Ailesi`;
      const newFamilyId = `fam_${user.id}_${Date.now()}`;
      const newFamilyCode = generateFamilyCode(user.username);

      // 1. Optimistic Update: Create family immediately
      const updatedUser: User = {
        ...user,
        familyId: newFamilyId,
        familyName: cleanName,
        familyCode: newFamilyCode,
        familyRole: 'HEAD',
      };

      const updatedUsers = state.users.map((u) => (u.id === user.id ? updatedUser : u));

      set({
        currentUser: updatedUser,
        users: updatedUsers,
      });
      persist();

      // 2. DB Update + Server Re-fetch
      await apiCall('/api/users', 'PUT', {
        id: user.id,
        familyId: newFamilyId,
        familyName: cleanName,
        familyCode: newFamilyCode,
        familyRole: 'HEAD',
      });

      await get().syncWithServer(false);

      return newFamilyCode;
    },

    setAuthModalOpen: (open, mode = 'login') => {
      set({ authModalOpen: open, authModalMode: mode });
    },

    setChangePasswordModalOpen: (open) => {
      set({ changePasswordModalOpen: open });
    },

    setCreateListModalOpen: (open, initialType) => {
      set({ createListModalOpen: open, createListModalInitialType: initialType });
    },

    setInviteModalTargetList: (list) => {
      set({ inviteModalTargetList: list });
    },

    setPwaInstallModalOpen: (open) => {
      set({ pwaInstallModalOpen: open });
    },

    login: async ({ username, password, rememberMe }) => {
      const val = handleZodValidation(loginSchema, { username, password, rememberMe });
      if (!val.success && val.error) {
        return { success: false, error: formatBilingualMessage(val.error), bilingualError: val.error };
      }
      const res = await mobileApi.login(username, password || '');
      if (!res.ok) return { success: false, error: res.error };
      const user = ensureUserFamily(res.data);
      set((s) => ({
        currentUser: user,
        users: [user, ...s.users.filter((u) => u.id !== user.id)],
        isAuthenticated: true,
        justRegistered: false,
        authModalOpen: false,
      }));
      persist();
      get().fetchInitialData();
      return { success: true };
    },

    register: async ({ name, username, password, confirmPassword, avatar, color }) => {
      const val = handleZodValidation(registerSchema, {
        name,
        username,
        password,
        confirmPassword: confirmPassword || password,
        avatar: avatar || DEFAULT_AVATAR,
        color,
      });
      if (!val.success && val.error) {
        return { success: false, error: formatBilingualMessage(val.error), bilingualError: val.error };
      }
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const trimmedName = name.trim();
      const randomColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];
      const pickedColor = color || randomColors[Math.floor(Math.random() * randomColors.length)];
      const newUser: User = ensureUserFamily({
        id: `user-${Date.now()}`,
        name: trimmedName,
        username: cleanUsername,
        password: password || '',
        avatar: avatar || DEFAULT_AVATAR,
        color: pickedColor,
        createdAt: new Date().toISOString().split('T')[0],
        provider: 'username',
        familyName: `${trimmedName} Ailesi`,
        familyRole: 'HEAD',
      });
      const res = await mobileApi.register({
        name: trimmedName,
        username: cleanUsername,
        password: password || '',
        avatar: newUser.avatar,
        color: pickedColor,
      });
      if (!res.ok) return { success: false, error: res.error };
      const user = ensureUserFamily(res.data);
      set((s) => ({
        users: [user, ...s.users.filter((u) => u.id !== user.id)],
        currentUser: user,
        isAuthenticated: true,
        justRegistered: true,
        authModalOpen: false,
      }));
      persist();
      get().fetchInitialData();
      return { success: true };
    },

    changePassword: async ({ oldPassword, newPassword, confirmPassword }) => {
      const val = handleZodValidation(changePasswordSchema, { oldPassword, newPassword, confirmPassword });
      if (!val.success && val.error) {
        return { success: false, error: formatBilingualMessage(val.error), bilingualError: val.error };
      }
      const user = get().currentUser;
      if (!user || user.id === 'guest') return { success: false, error: 'Oturum açmış kullanıcı bulunamadı.' };
      const res = await mobileApi.changePassword(oldPassword, newPassword);
      if (!res.ok) return { success: false, error: res.error };
      return { success: true };
    },

    logout: () => {
      mobileApi.logout();
      set({
        isAuthenticated: false,
        justRegistered: false,
        currentUser: DEFAULT_ANONYMOUS_USER,
        authModalOpen: true,
        authModalMode: 'login',
      });
      localStorage.removeItem(SESSION_STORAGE_KEY);
      persist();
    },

    updateUserProfile: (updates) => {
      set((state) => {
        const updatedUser = { ...state.currentUser, ...updates };
        const updatedUsers = state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        return {
          currentUser: updatedUser,
          users: updatedUsers,
        };
      });
      persist();

      const user = get().currentUser;
      // Standard CRUD REST: PUT /api/users
      apiCall('/api/users', 'PUT', { id: user.id, ...updates });
    },

    setActiveTab: (tab) => {
      updateUrlHash(tab, null);
      set({ activeTab: tab, selectedListId: null });
      // Sync fresh data from server on navigation
      get().syncWithServer(true);
    },
    setSelectedListId: (id) => {
      updateUrlHash(get().activeTab, id);
      set({ selectedListId: id });
      // Sync fresh data when opening/closing list
      get().syncWithServer(true);
    },
    syncFromHash: () => {
      const route = parseRouteFromHash();
      set({ activeTab: route.activeTab, selectedListId: route.selectedListId });
    },
    setSearchQuery: (q) => set({ searchQuery: q }),
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    setAnalyticsMonth: (m) => set({ analyticsMonth: m }),

    // CREATE LIST (POST /api/lists)
    createList: (listData) => {
      const state = get();
      const id = `list-${Date.now()}`;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      const members: ListMember[] = [
        {
          userId: state.currentUser.id,
          role: 'OWNER',
          joinedAt: now,
        },
      ];

      // If it's a family/shared list, add other members in the same family
      if (listData.isShared) {
        state.users.forEach((u) => {
          if (
            u.id !== state.currentUser.id &&
            u.familyId === state.currentUser.familyId &&
            !members.some((m) => m.userId === u.id)
          ) {
            members.push({
              userId: u.id,
              role: 'EDITOR',
              joinedAt: now,
            });
          }
        });
      }

      const newList: AppList = {
        ...listData,
        id,
        ownerId: state.currentUser.id,
        familyId: state.currentUser.familyId,
        members,
        inviteCode,
        createdAt: now,
        updatedAt: now,
      };

      set((s) => ({
        lists: [newList, ...s.lists],
        selectedListId: id,
      }));
      persist();

      // Standard CRUD REST: POST /api/lists
      apiCall('/api/lists', 'POST', newList);

      return id;
    },

    // UPDATE LIST (PUT /api/lists)
    updateList: (id, updates) => {
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        ),
      }));
      persist();

      // Standard CRUD REST: PUT /api/lists
      apiCall('/api/lists', 'PUT', { id, ...updates });
    },

    // DELETE LIST (DELETE /api/lists?id=...)
    deleteList: (id) => {
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
        items: state.items.filter((i) => i.listId !== id),
        selectedListId: state.selectedListId === id ? null : state.selectedListId,
      }));
      persist();

      // Standard CRUD REST: DELETE /api/lists
      apiCall(`/api/lists?id=${encodeURIComponent(id)}`, 'DELETE');
    },

    duplicateList: (id) => {
      const state = get();
      const original = state.lists.find((l) => l.id === id);
      if (!original) return '';

      const newId = `list-${Date.now()}`;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      const members: ListMember[] = [
        {
          userId: state.currentUser.id,
          role: 'OWNER',
          joinedAt: now,
        },
      ];

      const newList: AppList = {
        ...original,
        id: newId,
        title: `${original.title} (Kopya)`,
        ownerId: state.currentUser.id,
        members,
        inviteCode,
        createdAt: now,
        updatedAt: now,
      };

      const originalItems = state.items.filter((i) => i.listId === id);
      const newItems: ListItem[] = originalItems.map((item, idx) => ({
        ...item,
        id: `item-${Date.now()}-${idx}`,
        listId: newId,
        isCompleted: false,
        completedBy: undefined,
        completedAt: undefined,
        createdAt: now,
      }));

      set((s) => ({
        lists: [newList, ...s.lists],
        items: [...newItems, ...s.items],
        selectedListId: newId,
      }));
      persist();

      apiCall('/api/lists', 'POST', newList);
      if (newItems.length > 0) {
        apiCall('/api/items', 'POST', newItems);
      }

      return newId;
    },

    joinListWithCode: async (code) => {
      const state = get();
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return { success: false, message: 'Lütfen davet kodunu girin.' };
      const local = state.lists.find((l) => (l.inviteCode || '').toUpperCase() === cleanCode);
      if (local && local.members.some((m) => m.userId === state.currentUser.id)) {
        return { success: true, message: 'Zaten bu listenin üyesisiniz!', listId: local.id };
      }
      const res = await mobileApi.joinListByCode(cleanCode);
      if (!res.ok) return { success: false, message: res.error };
      await get().syncWithServer(true);
      return { success: true, message: res.data.message, listId: res.data.list.id };
    },

    inviteUserToList: async (listId, usernameOrEmail, role = 'EDITOR') => {
      const val = handleZodValidation(inviteUserSchema, { usernameOrEmail, role });
      if (!val.success && val.error) {
        const msg = formatBilingualMessage(val.error);
        return { success: false, error: msg, message: msg, bilingualError: val.error };
      }
      const targetList = get().lists.find((l) => l.id === listId);
      if (!targetList) return { success: false, error: 'Liste bulunamadı.', message: 'Liste bulunamadı.' };

      const res = await mobileApi.inviteToList(listId, usernameOrEmail, role);
      if (!res.ok) return { success: false, error: res.error, message: res.error };

      const invitee = ensureUserFamily(res.data.user);
      const serverMembers = res.data.list.members;
      const members =
        serverMembers && serverMembers.length > 0
          ? serverMembers
          : targetList.members.some((m) => m.userId === invitee.id)
            ? targetList.members
            : [...targetList.members, { userId: invitee.id, role, joinedAt: new Date().toISOString() }];
      set((s) => ({
        lists: s.lists.map((l) => (l.id === listId ? { ...l, isShared: true, members } : l)),
        users: s.users.some((u) => u.id === invitee.id) ? s.users : [...s.users, invitee],
      }));
      persist();
      const message = res.data.message || `Kullanıcı "${invitee.name}" başarıyla listeye eklendi.`;
      return { success: true, message };
    },

    leaveList: (listId) => {
      const state = get();
      const target = state.lists.find((l) => l.id === listId);
      if (!target || target.ownerId === state.currentUser.id) return;
      const members = target.members.filter((m) => m.userId !== state.currentUser.id);
      set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? { ...l, members } : l)) }));
      persist();
      apiCall('/api/lists', 'PUT', { id: listId, members });
    },

    removeMemberFromList: (listId, userId) => {
      const state = get();
      const targetList = state.lists.find((l) => l.id === listId);
      if (!targetList) return;

      const filtered = targetList.members.filter((m) => m.userId !== userId);
      const isShared = filtered.length > 1;

      set((s) => ({
        lists: s.lists.map((l) =>
          l.id === listId ? { ...l, members: filtered, isShared } : l
        ),
      }));
      persist();

      apiCall('/api/lists', 'PUT', { id: listId, members: filtered, isShared });
    },

    // CREATE ITEM (POST /api/items)
    addItem: (itemData) => {
      const newItem: ListItem = {
        ...itemData,
        isCompleted: itemData.isCompleted ?? false,
        id: `item-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      set((s) => ({
        items: [newItem, ...s.items],
        lists: s.lists.map((l) =>
          l.id === itemData.listId ? { ...l, updatedAt: new Date().toISOString() } : l
        ),
      }));
      persist();

      // Standard CRUD REST: POST /api/items
      apiCall('/api/items', 'POST', newItem);
    },

    toggleItemCompleted: toggleComplete,
    toggleItemComplete: toggleComplete,

    // UPDATE ITEM (PUT /api/items)
    updateItem: (id, updates) => {
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      }));
      persist();

      // Standard CRUD REST: PUT /api/items
      apiCall('/api/items', 'PUT', { id, ...updates });
    },

    // DELETE ITEM (DELETE /api/items?id=...)
    deleteItem: (id) => {
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
      persist();

      // Standard CRUD REST: DELETE /api/items
      apiCall(`/api/items?id=${encodeURIComponent(id)}`, 'DELETE');
    },

    // CLEAR COMPLETED ITEMS (DELETE /api/items?listId=...&clearCompleted=true)
    clearCompletedItems: (listId) => {
      set((state) => ({
        items: state.items.filter((i) => !(i.listId === listId && i.isCompleted)),
      }));
      persist();

      apiCall(`/api/items?listId=${encodeURIComponent(listId)}&clearCompleted=true`, 'DELETE');
    },

    markAllItemsCompleted: (listId) => {
      const state = get();
      const now = new Date().toISOString();
      set((s) => ({
        items: s.items.map((i) =>
          i.listId === listId
            ? {
                ...i,
                isCompleted: true,
                completedBy: s.currentUser.id,
                completedAt: now,
              }
            : i
        ),
      }));
      persist();

      state.items.filter((i) => i.listId === listId).forEach((it) => {
        apiCall('/api/items', 'PUT', { id: it.id, isCompleted: true, completedBy: state.currentUser.id, completedAt: now });
      });
    },

    unmarkAllItemsCompleted: unmarkAll,
    uncheckAllItems: unmarkAll,

    checkoutShoppingList: (listId, paymentMethod = 'Kredi Kartı', cardId) => {
      const state = get();
      const list = state.lists.find((l) => l.id === listId);
      const completedItems = state.items.filter((i) => i.listId === listId && i.isCompleted);
      
      const totalAmount = completedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
      const itemCount = completedItems.length;

      if (itemCount > 0 && totalAmount > 0) {
        const expId = `exp-${Date.now()}`;
        let cardName: string | undefined;
        let cardType: any;
        let updatedCards = state.paymentCards;

        let targetCard: PaymentCard | undefined;
        if (cardId) {
          targetCard = state.paymentCards.find((c) => c.id === cardId);
        } else if (paymentMethod) {
          const pm = paymentMethod.trim().toLowerCase();
          const genericPhrases = [
            'kredi kartı',
            'kredi karti',
            'kredi',
            'kart',
            'nakit',
            'banka kartı',
            'banka karti',
            'havale',
            'eft',
            'otomatik ödeme',
            'diğer',
            'diger',
          ];
          if (!genericPhrases.includes(pm)) {
            targetCard = state.paymentCards.find((c) => c.name.trim().toLowerCase() === pm);
          }
        }

        if (targetCard) {
          cardName = targetCard.name;
          cardType = targetCard.type;

          const newTx: CardTransaction = {
            id: `tx-${Date.now()}`,
            cardId: targetCard.id,
            amount: totalAmount,
            type: 'SPEND',
            title: list?.title || 'Market Alışverişi',
            date: new Date().toISOString().split('T')[0],
            categoryName: 'Süpermarket & Gıda',
            relatedExpenseId: expId,
            note: `${itemCount} kalem ürün alındı`,
          };

          const isBalance = targetCard.type === 'FOOD_CARD' || targetCard.type === 'DEBIT_CARD' || targetCard.type === 'CASH_WALLET' || targetCard.type === 'PREPAID_CARD';
          const newBal = isBalance ? Math.max(0, (targetCard.balance || 0) - totalAmount) : targetCard.balance;
          const newDebt = targetCard.type === 'CREDIT_CARD' ? ((targetCard.currentDebt || 0) + totalAmount) : targetCard.currentDebt;

          updatedCards = state.paymentCards.map((c) =>
            c.id === targetCard!.id
              ? {
                  ...c,
                  balance: newBal,
                  currentDebt: newDebt,
                  transactions: [newTx, ...(c.transactions || [])],
                  updatedAt: new Date().toISOString(),
                }
              : c
          );

          apiCall('/api/cards', 'POST', {
            action: 'TRANSACTION',
            cardId: targetCard.id,
            transaction: newTx,
            currentDebt: newDebt,
            balance: newBal,
          });
        }

        const newExpense: ExpenseLog = {
          id: expId,
          userId: state.currentUser.id,
          familyId: state.currentUser.familyId,
          isShared: list?.isShared !== false,
          listId,
          listTitle: list?.title || 'Alışveriş Listesi',
          amount: totalAmount,
          currency: targetCard?.currency || 'TRY',
          categoryName: 'Süpermarket & Gıda',
          date: new Date().toISOString().split('T')[0],
          itemCount,
          itemsSummary: completedItems.map((i) => `${i.title} (${i.quantity || 1} ${i.unit || 'adet'})`),
          type: 'SHOPPING_CHECKOUT',
          paymentMethod: targetCard ? targetCard.name : paymentMethod,
          cardId: targetCard?.id || cardId,
          cardName: cardName || targetCard?.name,
          cardType: cardType || targetCard?.type,
        };

        set((s) => ({
          expenses: [newExpense, ...s.expenses],
          paymentCards: updatedCards,
        }));
        persist();

        apiCall('/api/expenses', 'POST', newExpense);
      }

      return { totalAmount, itemCount };
    },

    deleteAllItemsInList: (listId) => {
      set((state) => ({
        items: state.items.filter((i) => i.listId !== listId),
      }));
      persist();

      apiCall(`/api/items?listId=${encodeURIComponent(listId)}`, 'DELETE');
    },

    bulkAddItems: (listId, titles, defaultCategoryId) => {
      const now = new Date().toISOString();
      const newItems: ListItem[] = titles
        .filter((t) => t.trim().length > 0)
        .map((title, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          listId,
          title: title.trim(),
          isCompleted: false,
          price: 0,
          quantity: 1,
          unit: 'adet',
          categoryId: defaultCategoryId || 'cat-market',
          createdAt: now,
        }));

      set((s) => ({
        items: [...newItems, ...s.items],
        lists: s.lists.map((l) =>
          l.id === listId ? { ...l, updatedAt: now } : l
        ),
      }));
      persist();

      apiCall('/api/items', 'POST', newItems);
    },

    addExpense: addExpenseFn,
    addDirectExpense: addExpenseFn,

    // DELETE EXPENSE (DELETE /api/expenses?id=...)
    deleteExpense: (id) => {
      const state = get();
      const targetExpense = state.expenses.find((e) => e.id === id);
      const genericPhrases = ['kredi kartı', 'kredi karti', 'kredi', 'kart', 'nakit', 'banka kartı', 'banka karti'];

      let matchedCard: PaymentCard | undefined;
      if (targetExpense) {
        if (targetExpense.cardId) {
          matchedCard = state.paymentCards.find((c) => c.id === targetExpense.cardId);
        } else if (targetExpense.cardName) {
          matchedCard = state.paymentCards.find((c) => c.name.toLowerCase() === targetExpense.cardName?.toLowerCase());
        } else if (targetExpense.paymentMethod && !genericPhrases.includes(targetExpense.paymentMethod.toLowerCase())) {
          matchedCard = state.paymentCards.find((c) => c.name.toLowerCase() === targetExpense.paymentMethod?.toLowerCase());
        }
      }

      const updatedCards = state.paymentCards.map((c) => {
        const isTarget = matchedCard && c.id === matchedCard.id;
        const hadTx = (c.transactions || []).some((t) => t.relatedExpenseId === id);
        if (!isTarget && !hadTx) return c;

        const filteredTx = (c.transactions || []).filter((t) => t.relatedExpenseId !== id);
        let newBal = c.balance;
        let newDebt = c.currentDebt;

        if (isTarget && targetExpense) {
          const isBalance = c.type === 'FOOD_CARD' || c.type === 'DEBIT_CARD' || c.type === 'CASH_WALLET' || c.type === 'PREPAID_CARD';
          newBal = isBalance ? (c.balance || 0) + targetExpense.amount : c.balance;
          newDebt = c.type === 'CREDIT_CARD' ? Math.max(0, (c.currentDebt || 0) - targetExpense.amount) : c.currentDebt;
        }

        apiCall('/api/cards', 'PUT', { id: c.id, balance: newBal, currentDebt: newDebt, transactions: filteredTx });

        return {
          ...c,
          balance: newBal,
          currentDebt: newDebt,
          transactions: filteredTx,
          updatedAt: new Date().toISOString(),
        };
      });

      set((s) => ({
        expenses: s.expenses.filter((e) => e.id !== id),
        paymentCards: updatedCards,
      }));
      persist();

      apiCall(`/api/expenses?id=${encodeURIComponent(id)}`, 'DELETE');
    },

    // UPDATE EXPENSE (PUT /api/expenses)
    updateExpense: (id, updates) => {
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
      persist();

      apiCall('/api/expenses', 'PUT', { id, ...updates });
    },

    setMonthlyBudget: (budget) => {
      set({ monthlyBudget: budget });
      persist();
    },

    setMonthlyIncome: (income) => {
      set({ monthlyIncome: income });
      persist();
    },

    // CREATE SAVINGS GOAL (POST /api/savings)
    addSavingsGoal: (goalData) => {
      const state = get();
      const id = `save-asset-${Date.now()}`;
      const now = new Date().toISOString().split('T')[0];
      const initialAmt = Number(goalData.initialAmount) || 0;

      const initialContribution = initialAmt > 0 ? [
        {
          id: `sc-${Date.now()}`,
          amount: initialAmt,
          date: now,
          note: 'Hesap açılış başlangıç tutarı',
          type: 'DEPOSIT' as const,
        }
      ] : [];

      const newAsset: SavingsGoal = {
        id,
        userId: state.currentUser.id,
        familyId: state.currentUser.familyId,
        isShared: goalData.isShared !== false,
        title: goalData.title,
        category: goalData.category || 'Diğer Birikim',
        assetType: goalData.assetType || 'CASH_VAULT',
        currentAmount: initialAmt,
        initialAmount: initialAmt,
        targetAmount: goalData.targetAmount || 0,
        unitQuantity: goalData.unitQuantity,
        unitPrice: goalData.unitPrice,
        currency: goalData.currency || 'TRY',
        institution: goalData.institution || 'Banka / Kasa',
        icon: goalData.icon || '🏦',
        color: goalData.color || '#10b981',
        notes: goalData.notes,
        createdAt: now,
        contributions: initialContribution,
        linkedCardId: goalData.linkedCardId,
        linkedCardName: goalData.linkedCardName,
        excludeFromReports: goalData.excludeFromReports || false,
      };

      let updatedCards = state.paymentCards;
      if (goalData.linkedCardId && initialAmt > 0) {
        const card = state.paymentCards.find((c) => c.id === goalData.linkedCardId);
        if (card) {
          const isCredit = card.type === 'CREDIT_CARD';
          const newBal = isCredit ? card.balance : Math.max(0, (card.balance || 0) - initialAmt);
          const newDebt = isCredit ? (card.currentDebt || 0) + initialAmt : card.currentDebt;
          const cardTx: CardTransaction = {
            id: `tx-${Date.now()}`,
            cardId: card.id,
            amount: initialAmt,
            type: 'SPEND',
            title: `🎯 Birikim Başlangıcı: ${goalData.title}`,
            date: now,
            categoryName: 'Birikim & Yatırım',
            note: 'Birikim açılış tutarı',
          };
          updatedCards = state.paymentCards.map((c) =>
            c.id === card.id
              ? {
                  ...c,
                  balance: newBal,
                  currentDebt: newDebt,
                  transactions: [cardTx, ...(c.transactions || [])],
                }
              : c
          );
        }
      }

      set((s) => ({
        savingsGoals: [newAsset, ...s.savingsGoals],
        paymentCards: updatedCards,
      }));
      persist();

      apiCall('/api/savings', 'POST', newAsset);
    },

    // UPDATE SAVINGS GOAL (PUT /api/savings)
    updateSavingsGoal: (id, updates) => {
      const state = get();
      const oldGoal = state.savingsGoals.find((g) => g.id === id);
      let updatedCards = state.paymentCards;

      // A linked card is only charged for the goal's current amount; if editing changes
      // that amount, or moves the goal to a different card, reverse the old effect and
      // apply the new one — same rule addSavingsGoal already uses when a goal is created.
      if (oldGoal) {
        const oldAmount = oldGoal.currentAmount || 0;
        const newAmount = updates.currentAmount !== undefined ? updates.currentAmount : oldAmount;
        const oldCardId = oldGoal.linkedCardId;
        const newCardId = 'linkedCardId' in updates ? updates.linkedCardId : oldCardId;
        const now = new Date().toISOString().split('T')[0];
        const txId = `tx-goal-${id}`;

        if (newAmount !== oldAmount || newCardId !== oldCardId) {
          if (oldCardId && oldAmount > 0) {
            const oldCard = updatedCards.find((c) => c.id === oldCardId);
            if (oldCard) {
              const isCredit = oldCard.type === 'CREDIT_CARD';
              updatedCards = updatedCards.map((c) =>
                c.id === oldCard.id
                  ? {
                      ...c,
                      balance: isCredit ? c.balance : (c.balance || 0) + oldAmount,
                      currentDebt: isCredit ? Math.max(0, (c.currentDebt || 0) - oldAmount) : c.currentDebt,
                      transactions: (c.transactions || []).filter((t) => t.id !== txId),
                    }
                  : c
              );
            }
          }
          if (newCardId && newAmount > 0) {
            const newCard = updatedCards.find((c) => c.id === newCardId);
            if (newCard) {
              const isCredit = newCard.type === 'CREDIT_CARD';
              const tx: CardTransaction = {
                id: txId,
                cardId: newCard.id,
                amount: newAmount,
                type: 'SPEND',
                title: `🎯 Birikim: ${updates.title || oldGoal.title}`,
                date: now,
                categoryName: 'Birikim & Yatırım',
                note: 'Birikim güncellendi',
              };
              updatedCards = updatedCards.map((c) =>
                c.id === newCard.id
                  ? {
                      ...c,
                      balance: isCredit ? c.balance : Math.max(0, (c.balance || 0) - newAmount),
                      currentDebt: isCredit ? (c.currentDebt || 0) + newAmount : c.currentDebt,
                      transactions: [tx, ...(c.transactions || []).filter((t) => t.id !== txId)],
                    }
                  : c
              );
            }
          }
        }
      }

      set((s) => ({
        savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        paymentCards: updatedCards,
      }));
      persist();

      apiCall('/api/savings', 'PUT', { id, ...updates });
    },

    // DELETE SAVINGS GOAL (DELETE /api/savings?id=...)
    deleteSavingsGoal: (id) => {
      set((state) => ({
        savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
      }));
      persist();

      apiCall(`/api/savings?id=${encodeURIComponent(id)}`, 'DELETE');
    },

    addSavingsContribution: (goalId, contributionData) => {
      const state = get();
      const now = new Date().toISOString().split('T')[0];
      const targetGoal = state.savingsGoals.find((g) => g.id === goalId);
      const goalTitle = targetGoal?.title || 'Birikim Hesabı';

      const newContribution: SavingsContribution = {
        id: `sc-${Date.now()}`,
        amount: contributionData.amount,
        unitQuantity: contributionData.unitQuantity,
        date: now,
        note: contributionData.note || (contributionData.type === 'DEPOSIT' ? 'Birikim yatırıldı' : 'Para çekildi'),
        type: contributionData.type,
        cardId: contributionData.cardId,
        cardName: contributionData.cardName,
      };

      let updatedCards = state.paymentCards;
      if (contributionData.cardId) {
        const card = state.paymentCards.find((c) => c.id === contributionData.cardId);
        if (card) {
          const isCredit = card.type === 'CREDIT_CARD';
          let newBalance = card.balance;
          let newDebt = card.currentDebt || 0;

          if (contributionData.type === 'DEPOSIT') {
            if (isCredit) {
              newDebt += contributionData.amount;
            } else {
              newBalance = Math.max(0, (card.balance || 0) - contributionData.amount);
            }
          } else {
            // WITHDRAW (birikimden karta aktarıldı)
            if (isCredit) {
              newDebt = Math.max(0, newDebt - contributionData.amount);
            } else {
              newBalance = (card.balance || 0) + contributionData.amount;
            }
          }

          const cardTx: CardTransaction = {
            id: `tx-${Date.now()}`,
            cardId: card.id,
            amount: contributionData.amount,
            type: contributionData.type === 'DEPOSIT' ? 'SPEND' : 'TOP_UP',
            title:
              contributionData.type === 'DEPOSIT'
                ? `🎯 Birikime Aktarıldı: ${goalTitle}`
                : `💸 Birikimden Karta Aktarıldı: ${goalTitle}`,
            date: now,
            categoryName: 'Birikim & Yatırım',
            note: contributionData.note || undefined,
          };

          updatedCards = state.paymentCards.map((c) =>
            c.id === card.id
              ? {
                  ...c,
                  balance: newBalance,
                  currentDebt: newDebt,
                  transactions: [cardTx, ...(c.transactions || [])],
                }
              : c
          );
        }
      }

      set((s) => ({
        savingsGoals: s.savingsGoals.map((g) => {
          if (g.id !== goalId) return g;
          const delta = contributionData.type === 'DEPOSIT' ? contributionData.amount : -contributionData.amount;
          const updatedAmount = Math.max(0, g.currentAmount + delta);
          let updatedUnitQty = g.unitQuantity;
          if (contributionData.unitQuantity) {
            const unitDelta = contributionData.type === 'DEPOSIT' ? contributionData.unitQuantity : -contributionData.unitQuantity;
            updatedUnitQty = Math.max(0, (g.unitQuantity || 0) + unitDelta);
          }
          return {
            ...g,
            currentAmount: updatedAmount,
            unitQuantity: updatedUnitQty,
            contributions: [newContribution, ...g.contributions],
          };
        }),
        paymentCards: updatedCards,
      }));
      persist();

      apiCall('/api/savings', 'POST', {
        action: 'CONTRIBUTION',
        goalId,
        contribution: newContribution,
      });
    },

    // PAYMENT CARDS & FOOD CARDS CRUD (REST /api/cards)
    addPaymentCard: (cardData) => {
      const state = get();
      const id = `card-${Date.now()}`;
      const now = new Date().toISOString();
      const initialBal = Number(cardData.balance) || 0;

      const initialTx: CardTransaction[] = cardData.transactions || (initialBal > 0 ? [
        {
          id: `tx-${Date.now()}`,
          cardId: id,
          amount: initialBal,
          type: 'TOP_UP',
          title: 'Açılış Bakiyesi',
          date: now.split('T')[0],
          note: 'Kart başlangıç bakiyesi',
        }
      ] : []);

      const newCard: PaymentCard = {
        id,
        userId: state.currentUser.id,
        familyId: state.currentUser.familyId,
        isShared: cardData.isShared !== false,
        name: cardData.name,
        type: cardData.type,
        provider: cardData.provider,
        last4: cardData.last4,
        color: cardData.color || '#6366f1',
        icon: cardData.icon || 'CreditCard',
        balance: initialBal,
        initialBalance: initialBal,
        monthlyAllowance: Number(cardData.monthlyAllowance) || 0,
        creditLimit: Number(cardData.creditLimit) || 0,
        currentDebt: Number(cardData.currentDebt) || 0,
        currency: cardData.currency || 'TRY',
        isInvestmentAccount: cardData.isInvestmentAccount === true,
        investmentType: cardData.investmentType,
        cutoffDay: cardData.cutoffDay,
        dueDay: cardData.dueDay,
        activeBillingCycle: cardData.activeBillingCycle || 'CURRENT',
        excludeFromReports: cardData.excludeFromReports || false,
        transactions: initialTx,
        createdAt: now,
      };

      set((s) => ({
        paymentCards: [newCard, ...s.paymentCards],
      }));
      persist();

      apiCall('/api/cards', 'POST', newCard);
      return id;
    },

    updatePaymentCard: (id, updates) => {
      set((state) => ({
        paymentCards: state.paymentCards.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      }));
      persist();

      apiCall('/api/cards', 'PUT', { id, ...updates });
    },

    deletePaymentCard: (id) => {
      set((state) => ({
        paymentCards: state.paymentCards.filter((c) => c.id !== id),
      }));
      persist();

      apiCall(`/api/cards?id=${encodeURIComponent(id)}`, 'DELETE');
    },

    topUpCardBalance: (cardId, amount, note) => {
      const state = get();
      const card = state.paymentCards.find((c) => c.id === cardId);
      if (!card || amount <= 0) return;

      const isCredit = card.type === 'CREDIT_CARD';
      const now = new Date().toISOString();
      const newTx: CardTransaction = {
        id: `tx-${Date.now()}`,
        cardId,
        amount,
        type: 'TOP_UP',
        title: note || (isCredit ? 'Kredi Kartı Borç Ödemesi' : card.type === 'FOOD_CARD' ? 'Yemek Ücreti Yüklemesi' : 'Bakiye Yükleme'),
        date: now.split('T')[0],
        note,
      };

      const newBalance = isCredit ? (card.balance || 0) : ((card.balance || 0) + amount);
      const newDebt = isCredit ? Math.max(0, (card.currentDebt || 0) - amount) : (card.currentDebt || 0);

      set((s) => ({
        paymentCards: s.paymentCards.map((c) =>
          c.id === cardId
            ? {
                ...c,
                balance: newBalance,
                currentDebt: newDebt,
                transactions: [newTx, ...(c.transactions || [])],
                updatedAt: now,
              }
            : c
        ),
      }));
      persist();

      apiCall('/api/cards', 'POST', {
        action: 'TRANSACTION',
        cardId,
        transaction: newTx,
        currentDebt: newDebt,
        balance: newBalance,
      });
    },

    spendFromCard: (cardId, amount, title, categoryName, relatedExpenseId, note) => {
      const state = get();
      const card = state.paymentCards.find((c) => c.id === cardId);
      if (!card || amount <= 0) return;

      const now = new Date().toISOString();
      const newTx: CardTransaction = {
        id: `tx-${Date.now()}`,
        cardId,
        amount,
        type: 'SPEND',
        title: title || 'Harcama',
        date: now.split('T')[0],
        categoryName,
        relatedExpenseId,
        note,
      };

      const isBalance = card.type === 'FOOD_CARD' || card.type === 'DEBIT_CARD' || card.type === 'CASH_WALLET' || card.type === 'PREPAID_CARD';
      const newBalance = isBalance ? Math.max(0, (card.balance || 0) - amount) : card.balance;
      const newDebt = card.type === 'CREDIT_CARD' ? ((card.currentDebt || 0) + amount) : card.currentDebt;

      set((s) => ({
        paymentCards: s.paymentCards.map((c) =>
          c.id === cardId
            ? {
                ...c,
                balance: newBalance,
                currentDebt: newDebt,
                transactions: [newTx, ...(c.transactions || [])],
                updatedAt: now,
              }
            : c
        ),
      }));
      persist();

      apiCall('/api/cards', 'POST', {
        action: 'TRANSACTION',
        cardId,
        transaction: newTx,
        currentDebt: newDebt,
        balance: newBalance,
      });
    },

    addCategory: (category) => {
      set((state) => ({
        categories: [...state.categories, category],
      }));
      persist();
    },

    updateCategory: (id, updates) => {
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      persist();
    },

    deleteCategory: (id) => {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
      persist();
    },

    addTemplate: (template) => {
      set((state) => ({
        templates: [template, ...state.templates],
      }));
      persist();
    },

    updateTemplate: (id, updates) => {
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      persist();
    },

    deleteTemplate: (id) => {
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
      persist();
    },

    createListFromTemplate: (templateId, customTitle, isShared = true) => {
      const state = get();
      const template = state.templates.find((t) => t.id === templateId);
      if (!template) return '';

      const listId = `list-${Date.now()}`;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const members: ListMember[] = [
        {
          userId: state.currentUser.id,
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
        },
      ];

      if (isShared && state.currentUser.familyId) {
        state.users.forEach((u) => {
          if (
            u.id !== state.currentUser.id &&
            u.familyId === state.currentUser.familyId &&
            !members.some((m) => m.userId === u.id)
          ) {
            members.push({
              userId: u.id,
              role: 'EDITOR',
              joinedAt: new Date().toISOString(),
            });
          }
        });
      }

      const newList: AppList = {
        id: listId,
        title: customTitle || template.title,
        description: template.description || 'Şablondan otomatik oluşturuldu',
        type: template.type,
        color: template.color,
        icon: template.icon,
        isShared,
        ownerId: state.currentUser.id,
        familyId: state.currentUser.familyId,
        inviteCode: code,
        members,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newItems: ListItem[] = template.items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        listId,
        title: item.title,
        isCompleted: false,
        price: item.price || 0,
        quantity: item.quantity || 1,
        unit: item.unit || 'adet',
        categoryId: item.categoryId || (template.type === 'SHOPPING' ? 'cat-market' : template.type === 'TODO' ? 'cat-todo-ev' : 'cat-note-fikir'),
        priority: item.priority || 'MEDIUM',
        content: item.content || '',
        createdAt: new Date().toISOString(),
      }));

      set((s) => ({
        lists: [newList, ...s.lists],
        items: [...newItems, ...s.items],
        selectedListId: listId,
        activeTab: 'lists',
      }));
      persist();

      apiCall('/api/lists', 'POST', newList);
      if (newItems.length > 0) {
        apiCall('/api/items', 'POST', newItems);
      }

      return listId;
    },

    resetUserData: (userId?: string) => {
      const state = get();
      const targetUserId = userId || state.currentUser.id;

      // 1. Identify lists owned by the target user
      const ownedLists = state.lists.filter((l) => l.ownerId === targetUserId);
      const ownedListIds = new Set(ownedLists.map((l) => l.id));

      // 2. Clean up lists:
      // Remove owned lists.
      // For remaining lists owned by others where this user is a member, remove user from members.
      const remainingLists = state.lists
        .filter((l) => l.ownerId !== targetUserId)
        .map((l) => {
          if (l.members && l.members.some((m) => m.userId === targetUserId)) {
            const updatedMembers = l.members.filter((m) => m.userId !== targetUserId);
            apiCall('/api/lists', 'PUT', { id: l.id, members: updatedMembers });
            return {
              ...l,
              members: updatedMembers,
            };
          }
          return l;
        });

      // Fire REST DELETE for owned lists
      ownedLists.forEach((l) => {
        apiCall(`/api/lists?id=${encodeURIComponent(l.id)}`, 'DELETE');
      });

      // 3. Remove items belonging to the deleted lists
      const remainingItems = state.items.filter((item) => !ownedListIds.has(item.listId));

      // 4. Remove expenses created by target user or related to owned lists
      const userExpenses = state.expenses.filter(
        (e) => e.userId === targetUserId || (e.listId && ownedListIds.has(e.listId))
      );
      userExpenses.forEach((e) => {
        apiCall(`/api/expenses?id=${encodeURIComponent(e.id)}`, 'DELETE');
      });
      const userExpenseIds = new Set(userExpenses.map((e) => e.id));
      const remainingExpenses = state.expenses.filter((e) => !userExpenseIds.has(e.id));

      // 5. Remove savings goals created by target user
      const userSavings = state.savingsGoals.filter((g) => g.userId === targetUserId);
      userSavings.forEach((g) => {
        apiCall(`/api/savings?id=${encodeURIComponent(g.id)}`, 'DELETE');
      });
      const userSavingsIds = new Set(userSavings.map((g) => g.id));
      const remainingSavings = state.savingsGoals.filter((g) => !userSavingsIds.has(g.id));

      // 6. If currently selected list was deleted, select next available or null
      const newSelectedListId =
        state.selectedListId && ownedListIds.has(state.selectedListId)
          ? remainingLists.length > 0
            ? remainingLists[0].id
            : null
          : state.selectedListId;

      set({
        lists: remainingLists,
        items: remainingItems,
        expenses: remainingExpenses,
        savingsGoals: remainingSavings,
        selectedListId: newSelectedListId,
      });

      persist();
    },

    resetToDefaultData: () => {
      get().resetUserData();
    },
  };
});
