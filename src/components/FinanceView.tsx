import React, { useState, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Plus,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  CheckCircle2,
  Trash2,
  Search,
  Layers,
  Receipt,
  CreditCard,
  Building2,
  Coins,
  History,
  Info,
  Check,
  BarChart3,
  PieChart,
  Percent,
  User,
  Users,
  SlidersHorizontal,
  Utensils,
  X,
  Sliders,
} from 'lucide-react-native';

import { useAppStore } from '../store/useAppStore';
import { SavingsAsset, ExpenseLog, PaymentCard } from '../types';
import { getAccessibleExpenses, getAccessibleSavings, getAccessibleCards } from '../lib/permissions';
import {
  CURRENCY_UNIT_LIST,
  formatAssetQuantityDisplay,
  getCurrencyUnitConfig,
  getCreditCardBillingCycles,
  isDateInCycle,
  convertCurrencyToTRY,
  formatCurrencyWithSymbol,
  getCurrencyRateInTRY,
} from '../lib/currencyUnits';
import { ic, tw } from '../lib/tw';
import { ConfirmModal } from './ConfirmModal';
import { CardsView } from './CardsView';
import { Btn, DateInput, Gradient, Grid, Input, Overlay, Panel, Progress, Select, Text } from './ui';

export type ReportPeriod = '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '1_YEAR' | 'CUSTOM';
export type FinanceScope = 'ALL' | 'PERSONAL' | 'SHARED';

type DateRangeFilter = 'THIS_MONTH' | 'THIS_WEEK' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'LAST_3_MONTHS' | 'ALL' | 'CUSTOM';

const DATE_RANGE_PILLS: { id: DateRangeFilter; label: string }[] = [
  { id: 'THIS_MONTH', label: 'Bu Ay' },
  { id: 'THIS_WEEK', label: 'Bu Hafta' },
  { id: 'LAST_MONTH', label: 'Geçen Ay' },
  { id: 'LAST_30_DAYS', label: 'Son 30 Gün' },
  { id: 'ALL', label: 'Tüm Zamanlar' },
];

const REPORT_PERIOD_PILLS: { id: ReportPeriod; label: string }[] = [
  { id: '1_MONTH', label: '1 Ay' },
  { id: '3_MONTHS', label: '3 Ay' },
  { id: '6_MONTHS', label: '6 Ay' },
  { id: '1_YEAR', label: '1 Yıl' },
];

const ASSET_CATEGORY_OPTIONS = [
  'Banka Vadeli Hesabı',
  'Altın & Kıymetli Maden',
  'Döviz & Yabancı Para',
  'Yatırım Fonu & Hisse',
  'Bireysel Emeklilik (BES)',
  'Fiziki Kasa / Nakit',
  'Diğer',
].map((value) => ({ value, label: value }));

const EXPENSE_CATEGORY_OPTIONS = [
  'Süpermarket & Gıda',
  'Kira & Konut',
  'Faturalar & Abonelik',
  'Ulaşım & Akaryakıt',
  'Yeme-İçme & Kafe',
  'Giyim & Moda',
  'Sağlık & İlaç',
  'Teknoloji & Elektronik',
  'Temizlik & Ev',
  'Diğer',
].map((value) => ({ value, label: value }));

// Repeated web class strings
const LABEL = 'text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5';
const CARD = 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs';
const CANCEL_BTN = 'flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center';
const CANCEL_TXT = 'text-[15px] font-semibold text-slate-600 dark:text-slate-300';
const PRIMARY_BTN = 'flex-1 h-12 rounded-2xl shadow-xs items-center justify-center';
const PRIMARY_TXT = 'text-[15px] font-bold text-white';
const MODAL_CLOSE_BTN = 'w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center';
// Mobile form field (sheet inputs, selects, date pickers)
const FIELD =
  'w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[16px]';
const SELECT_FIELD =
  'w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
const SELECT_TXT = 'text-[16px] text-slate-900 dark:text-slate-100';

/** <input type="checkbox"> visual */
const CheckBox: React.FC<{ checked: boolean; activeClassName?: string }> = ({
  checked,
  activeClassName = 'bg-teal-600 border-teal-600',
}) => (
  <View
    style={tw.style(
      'w-6 h-6 rounded-md border items-center justify-center',
      checked ? activeClassName : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
    )}
  >
    {checked && <Check {...ic('w-4 h-4 text-white', 3)} />}
  </View>
);

export const FinanceView: React.FC = () => {
  const {
    savingsGoals: allSavingsGoals,
    expenses: allExpenses,
    paymentCards: allPaymentCards,
    exchangeRates,
    monthlyIncome,
    monthlyBudget,
    setMonthlyIncome,
    setMonthlyBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsContribution,
    addDirectExpense,
    deleteExpense,
    updatePaymentCard,
    currentUser,
    users,
  } = useAppStore();

  // Strictly filter by permission for current user / family
  const expenses = useMemo(() => getAccessibleExpenses(allExpenses, currentUser), [allExpenses, currentUser]);
  const savingsGoals = useMemo(() => getAccessibleSavings(allSavingsGoals, currentUser), [allSavingsGoals, currentUser]);
  const accessibleCards = useMemo(() => getAccessibleCards(allPaymentCards, currentUser), [allPaymentCards, currentUser]);

  // Sub-tabs: 'cards' | 'expenses' | 'savings' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'expenses' | 'savings' | 'reports'>('cards');

  // Global Scope Filter (Tümü | Kişisel / Özel | Ortak / Aile)
  const [globalScope, setGlobalScope] = useState<FinanceScope>('ALL');

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<SavingsAsset | null>(null);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<SavingsAsset | null>(null);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<ExpenseLog | null>(null);
  const [cardForSavingsTransfer, setCardForSavingsTransfer] = useState<PaymentCard | null>(null);

  // Asset Contribution (Para Yatır / Çek) Form State
  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [actionAmount, setActionAmount] = useState('');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionNote, setActionNote] = useState('');
  const [actionCardId, setActionCardId] = useState('');

  // Transfer from Card to Savings State
  const [transferTargetSavingsId, setTransferTargetSavingsId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Add Asset Form State
  const [assetTitle, setAssetTitle] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetTargetAmount, setAssetTargetAmount] = useState('');
  const [assetCategory, setAssetCategory] = useState('Banka Vadeli Hesabı');
  const [assetInstitution, setAssetInstitution] = useState('');
  const [assetCurrency, setAssetCurrency] = useState('TRY');
  const [assetUnitQuantity, setAssetUnitQuantity] = useState('');
  const [assetUnitPrice, setAssetUnitPrice] = useState('');
  const [assetExcludeFromReports, setAssetExcludeFromReports] = useState(false);
  const [assetNotes, setAssetNotes] = useState('');
  const [assetIcon, setAssetIcon] = useState('🏦');
  const [assetColor] = useState('#0284c7');
  const [assetIsShared, setAssetIsShared] = useState(false);
  const [assetLinkedCardId, setAssetLinkedCardId] = useState('');

  // Add Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Süpermarket & Gıda');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaymentMethod] = useState('Kredi Kartı');
  const [expCardId, setExpCardId] = useState('');
  const [expNote, setExpNote] = useState('');
  const [expIsShared, setExpIsShared] = useState(true);

  // Expense Filters State (Harcama Listesi)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('THIS_MONTH');
  const [customStartDate] = useState('');
  const [customEndDate] = useState('');
  const [expenseTypeFilter] = useState<'ALL' | 'SHOPPING' | 'DIRECT'>('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseScopeFilter, setExpenseScopeFilter] = useState<FinanceScope>('ALL');

  // Financial Report Time Range & Scope State (Finans Raporu)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('1_MONTH');
  const [reportScopeFilter, setReportScopeFilter] = useState<FinanceScope>('ALL');
  const [reportCustomStart] = useState('2026-06-01');
  const [reportCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const [showReportAccountFilter, setShowReportAccountFilter] = useState(false);

  // Savings Asset Filter & Search & Scope
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('ALL');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetScopeFilter, setAssetScopeFilter] = useState<FinanceScope>('ALL');

  // Income / Budget Temp State
  const [tempIncome, setTempIncome] = useState(monthlyIncome.toString());
  const [tempBudget, setTempBudget] = useState(monthlyBudget.toString());

  // Confirm delete states
  const [assetToDelete, setAssetToDelete] = useState<SavingsAsset | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseLog | null>(null);

  // Current Reference Date
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // --- FILTER EXPENSES BY TIME RANGE & SCOPE ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDateObj = new Date(exp.date);

      // 1. Time Range Filter
      let dateMatch = true;
      if (dateRangeFilter === 'THIS_MONTH') {
        const isCurrentMonth = expDateObj.getFullYear() === currentYear && expDateObj.getMonth() === currentMonth;
        dateMatch = isCurrentMonth;
      } else if (dateRangeFilter === 'THIS_WEEK') {
        const firstDayOfWeek = new Date(today);
        const day = today.getDay() || 7;
        firstDayOfWeek.setDate(today.getDate() - day + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        dateMatch = expDateObj >= firstDayOfWeek;
      } else if (dateRangeFilter === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        dateMatch = expDateObj.getFullYear() === lastMonthYear && expDateObj.getMonth() === lastMonth;
      } else if (dateRangeFilter === 'LAST_30_DAYS') {
        const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateMatch = expDateObj >= past30;
      } else if (dateRangeFilter === 'LAST_3_MONTHS') {
        const past90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateMatch = expDateObj >= past90;
      } else if (dateRangeFilter === 'CUSTOM' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = expDateObj >= start && expDateObj <= end;
      }

      // 2. Scope Filter
      const effectiveScope = expenseScopeFilter !== 'ALL' ? expenseScopeFilter : globalScope;
      let scopeMatch = true;
      if (effectiveScope === 'PERSONAL') {
        scopeMatch = exp.isShared === false;
      } else if (effectiveScope === 'SHARED') {
        scopeMatch = exp.isShared === true;
      }

      // 3. Type Filter
      let typeMatch = true;
      if (expenseTypeFilter === 'SHOPPING') {
        typeMatch = exp.type === 'SHOPPING_CHECKOUT' || !!exp.listId;
      } else if (expenseTypeFilter === 'DIRECT') {
        typeMatch = exp.type === 'DIRECT_EXPENSE' && !exp.listId;
      }

      // 4. Category Filter
      const categoryMatch = expenseCategoryFilter === 'ALL' || exp.categoryName === expenseCategoryFilter;

      // 5. Search Query Filter
      const q = expenseSearchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        (exp.listTitle && exp.listTitle.toLowerCase().includes(q)) ||
        (exp.categoryName && exp.categoryName.toLowerCase().includes(q)) ||
        (exp.note && exp.note.toLowerCase().includes(q)) ||
        (exp.cardName && exp.cardName.toLowerCase().includes(q)) ||
        (exp.paymentMethod && exp.paymentMethod.toLowerCase().includes(q));

      return dateMatch && scopeMatch && typeMatch && categoryMatch && searchMatch;
    });
  }, [
    expenses,
    dateRangeFilter,
    customStartDate,
    customEndDate,
    expenseScopeFilter,
    globalScope,
    expenseTypeFilter,
    expenseCategoryFilter,
    expenseSearchQuery,
    currentYear,
    currentMonth,
    today,
  ]);

  // --- FILTER SAVINGS ASSETS BY CATEGORY, SEARCH & SCOPE ---
  const filteredSavingsGoals = useMemo(() => {
    return savingsGoals.filter((asset) => {
      const effectiveScope = assetScopeFilter !== 'ALL' ? assetScopeFilter : globalScope;
      let scopeMatch = true;
      if (effectiveScope === 'PERSONAL') {
        scopeMatch = asset.isShared === false;
      } else if (effectiveScope === 'SHARED') {
        scopeMatch = asset.isShared === true;
      }

      const categoryMatch = assetCategoryFilter === 'ALL' || asset.category === assetCategoryFilter;
      const q = assetSearchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        asset.title.toLowerCase().includes(q) ||
        (asset.institution && asset.institution.toLowerCase().includes(q)) ||
        (asset.notes && asset.notes.toLowerCase().includes(q)) ||
        (asset.linkedCardName && asset.linkedCardName.toLowerCase().includes(q));

      return scopeMatch && categoryMatch && searchMatch;
    });
  }, [savingsGoals, assetScopeFilter, globalScope, assetCategoryFilter, assetSearchQuery]);

  // --- OVERVIEW CALCULATIONS ---
  const totalSavingsAssets = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [savingsGoals]);

  const getExpenseAmountInTRY = (exp: ExpenseLog): number => {
    const card = exp.cardId ? accessibleCards.find((c) => c.id === exp.cardId) : undefined;
    const currency = exp.currency || card?.currency || 'TRY';
    return convertCurrencyToTRY(exp.amount || 0, currency, exchangeRates);
  };

  const totalSpentThisMonth = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, currentYear, currentMonth, accessibleCards, exchangeRates]);

  const shoppingExpensesThisMonth = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth && (e.type === 'SHOPPING_CHECKOUT' || !!e.listId);
      })
      .reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, currentYear, currentMonth, accessibleCards, exchangeRates]);

  const directExpensesThisMonth = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth && (e.type === 'DIRECT_EXPENSE' && !e.listId);
      })
      .reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, currentYear, currentMonth, accessibleCards, exchangeRates]);

  const savingsDepositsThisMonth = useMemo(() => {
    let deposits = 0;
    savingsGoals.forEach((goal) => {
      (goal.contributions || []).forEach((c) => {
        const d = new Date(c.date);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          if (c.type === 'DEPOSIT') deposits += c.amount;
          else if (c.type === 'WITHDRAW') deposits -= c.amount;
        }
      });
    });
    return Math.max(0, deposits);
  }, [savingsGoals, currentYear, currentMonth]);

  const expenseCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => {
      if (e.categoryName) cats.add(e.categoryName);
    });
    return Array.from(cats);
  }, [expenses]);

  const assetCategories = useMemo(() => {
    const cats = new Set<string>();
    savingsGoals.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }, [savingsGoals]);

  const personalSavingsCount = savingsGoals.filter((s) => s.isShared === false).length;
  const sharedSavingsCount = savingsGoals.filter((s) => s.isShared === true).length;
  const personalExpensesCount = expenses.filter((e) => e.isShared === false).length;
  const sharedExpensesCount = expenses.filter((e) => e.isShared === true).length;

  // --- FINANCIAL REPORT CALCULATIONS ---
  const reportData = useMemo(() => {
    let startDate = new Date(today);
    const endDate = new Date(today);
    let periodLabel = 'Bu Ay';
    let periodSubLabel = 'Son 1 Aylık Dönem';
    let monthsCount = 1;

    if (reportPeriod === '1_MONTH') {
      startDate = new Date(currentYear, currentMonth, 1);
      periodLabel = 'Son 1 Ay';
      periodSubLabel = startDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      monthsCount = 1;
    } else if (reportPeriod === '3_MONTHS') {
      startDate = new Date(currentYear, currentMonth - 2, 1);
      periodLabel = 'Son 3 Ay';
      periodSubLabel = `${startDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;
      monthsCount = 3;
    } else if (reportPeriod === '6_MONTHS') {
      startDate = new Date(currentYear, currentMonth - 5, 1);
      periodLabel = 'Son 6 Ay';
      periodSubLabel = `${startDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;
      monthsCount = 6;
    } else if (reportPeriod === '1_YEAR') {
      startDate = new Date(currentYear, currentMonth - 11, 1);
      periodLabel = 'Son 1 Yıl';
      periodSubLabel = `${startDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;
      monthsCount = 12;
    } else if (reportPeriod === 'CUSTOM') {
      startDate = new Date(reportCustomStart);
      const partsEnd = reportCustomEnd.split('-');
      endDate.setFullYear(parseInt(partsEnd[0], 10), parseInt(partsEnd[1], 10) - 1, parseInt(partsEnd[2], 10));
      endDate.setHours(23, 59, 59, 999);
      periodLabel = 'Özel Tarih Aralığı';
      periodSubLabel = `${reportCustomStart} ile ${reportCustomEnd} arası`;
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      monthsCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24 * 30)));
    }

    const effectiveReportScope = reportScopeFilter !== 'ALL' ? reportScopeFilter : globalScope;

    const excludedCardIds = new Set(accessibleCards.filter((c) => c.excludeFromReports).map((c) => c.id));
    const excludedCardsCount = accessibleCards.filter((c) => c.excludeFromReports).length;
    const excludedAssetsCount = savingsGoals.filter((a) => a.excludeFromReports).length;

    const periodExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      const inDate = d >= startDate && d <= endDate;
      if (!inDate) return false;
      // Filter out expenses paid with cards/accounts excluded from reports
      if (e.cardId && excludedCardIds.has(e.cardId)) return false;
      if (effectiveReportScope === 'PERSONAL') return e.isShared === false;
      if (effectiveReportScope === 'SHARED') return e.isShared === true;
      return true;
    });

    const relevantSavingsGoals = savingsGoals.filter((a) => {
      // Filter out savings accounts/assets excluded from reports
      if (a.excludeFromReports) return false;
      if (effectiveReportScope === 'PERSONAL') return a.isShared === false;
      if (effectiveReportScope === 'SHARED') return a.isShared === true;
      return true;
    });

    let periodSavingsDeposits = 0;
    relevantSavingsGoals.forEach((a) => {
      (a.contributions || []).forEach((c) => {
        const cd = new Date(c.date);
        if (cd >= startDate && cd <= endDate) {
          if (c.type === 'DEPOSIT') periodSavingsDeposits += c.amount;
          else if (c.type === 'WITHDRAW') periodSavingsDeposits -= c.amount;
        }
      });
    });

    const totalSpent = periodExpenses.reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);
    const shoppingSpent = periodExpenses
      .filter((e) => e.type === 'SHOPPING_CHECKOUT' || !!e.listId)
      .reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);
    const directSpent = periodExpenses
      .filter((e) => e.type === 'DIRECT_EXPENSE' && !e.listId)
      .reduce((sum, e) => sum + getExpenseAmountInTRY(e), 0);

    const totalIncome = monthlyIncome * monthsCount;
    const totalBudget = monthlyBudget * monthsCount;
    const netSavings = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const budgetUsagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const shoppingRatio = totalSpent > 0 ? Math.round((shoppingSpent / totalSpent) * 100) : 0;

    const categoryMap: { [cat: string]: number } = {};
    periodExpenses.forEach((e) => {
      const c = e.categoryName || 'Diğer';
      categoryMap[c] = (categoryMap[c] || 0) + getExpenseAmountInTRY(e);
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Credit cards current status & billing cycles report
    const creditCardsReport = accessibleCards
      .filter((c) => c.type === 'CREDIT_CARD')
      .map((card) => {
        const billingCycles = getCreditCardBillingCycles(card.cutoffDay, card.dueDay);
        const activeCycleId = card.activeBillingCycle || 'CURRENT';
        const currentCycle = billingCycles.find((c) => c.id === activeCycleId) || billingCycles.find((c) => c.id === 'CURRENT') || billingCycles[0];
        const cycleSpends = (card.transactions || []).filter(
          (t) => t.type === 'SPEND' && currentCycle && isDateInCycle(t.date, currentCycle.startDate, currentCycle.endDate)
        );
        const cycleSpendTotal = cycleSpends.reduce((sum, t) => sum + t.amount, 0);
        const limit = card.creditLimit || 0;
        const debt = card.currentDebt || 0;
        const availableLimit = Math.max(0, limit - debt);
        const usagePercent = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;

        return {
          card,
          billingCycles,
          activeCycleId,
          currentCycle,
          cycleSpends,
          cycleSpendTotal,
          limit,
          debt,
          availableLimit,
          usagePercent,
          isExcluded: !!card.excludeFromReports,
        };
      });

    const totalCreditDebt = creditCardsReport
      .filter((c) => !c.isExcluded)
      .reduce((sum, c) => sum + c.debt, 0);
    const totalCreditLimit = creditCardsReport
      .filter((c) => !c.isExcluded)
      .reduce((sum, c) => sum + c.limit, 0);

    // Bank accounts report with multi-currency conversion to TRY & investment separation
    const bankAccountsReport = accessibleCards
      .filter((c) => c.type !== 'CREDIT_CARD')
      .map((card) => {
        const rawBalance = card.balance || 0;
        const balanceInTRY = convertCurrencyToTRY(rawBalance, card.currency || 'TRY', exchangeRates);
        return {
          card,
          rawBalance,
          balanceInTRY,
          currency: card.currency || 'TRY',
          isInvestmentAccount: !!card.isInvestmentAccount,
          investmentType: card.investmentType,
          isExcluded: !!card.excludeFromReports,
        };
      });

    const activeBankAccounts = bankAccountsReport.filter((b) => !b.isExcluded);
    const totalLiquidInTRY = activeBankAccounts.reduce((sum, b) => sum + b.balanceInTRY, 0);
    const regularBankInTRY = activeBankAccounts.filter((b) => !b.isInvestmentAccount).reduce((sum, b) => sum + b.balanceInTRY, 0);
    const investmentAccountsInTRY = activeBankAccounts.filter((b) => b.isInvestmentAccount).reduce((sum, b) => sum + b.balanceInTRY, 0);
    const totalSavingsGoalsInTRY = relevantSavingsGoals.reduce((sum, a) => sum + (a.currentAmount || 0), 0);
    const netWorthInTRY = totalLiquidInTRY + totalSavingsGoalsInTRY - totalCreditDebt;

    return {
      periodLabel,
      periodSubLabel,
      totalIncome,
      totalBudget,
      totalSpent,
      shoppingSpent,
      directSpent,
      shoppingRatio,
      netSavings,
      savingsRate,
      budgetUsagePercent,
      periodSavingsDeposits,
      categoryBreakdown,
      periodExpensesCount: periodExpenses.length,
      relevantAssetsCount: relevantSavingsGoals.length,
      creditCardsReport,
      totalCreditDebt,
      totalCreditLimit,
      bankAccountsReport,
      totalLiquidInTRY,
      regularBankInTRY,
      investmentAccountsInTRY,
      totalSavingsGoalsInTRY,
      netWorthInTRY,
      excludedCardsCount,
      excludedAssetsCount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reportPeriod,
    reportScopeFilter,
    reportCustomStart,
    reportCustomEnd,
    globalScope,
    expenses,
    savingsGoals,
    accessibleCards,
    exchangeRates,
    monthlyIncome,
    monthlyBudget,
    currentYear,
    currentMonth,
    today,
  ]);

  // --- ACTIONS HANDLERS ---
  const handleCreateAsset = () => {
    if (!assetTitle.trim()) return;
    // Web `required` on the quantity input blocks submit for non-TRY assets
    if (assetCurrency !== 'TRY' && !assetUnitQuantity) return;

    const selectedCard = accessibleCards.find((c) => c.id === assetLinkedCardId);
    const initialAmt = parseFloat(assetAmount) || 0;
    const targetAmt = parseFloat(assetTargetAmount) || 0;
    const unitPriceNum = assetUnitPrice ? parseFloat(assetUnitPrice) : undefined;
    const unitQuantityNum = assetUnitQuantity ? parseFloat(assetUnitQuantity) : undefined;
    const computedAmt = (unitQuantityNum && unitPriceNum) ? (unitQuantityNum * unitPriceNum) : initialAmt;

    addSavingsGoal({
      title: assetTitle.trim(),
      initialAmount: computedAmt,
      targetAmount: targetAmt,
      category: assetCategory,
      institution: assetInstitution.trim() || undefined,
      currency: assetCurrency,
      unitQuantity: unitQuantityNum,
      unitPrice: unitPriceNum,
      excludeFromReports: assetExcludeFromReports,
      notes: assetNotes.trim() || undefined,
      icon: assetIcon,
      color: assetColor,
      isShared: assetIsShared,
      linkedCardId: assetLinkedCardId || undefined,
      linkedCardName: selectedCard?.name || undefined,
    });

    setIsAddAssetOpen(false);
    setAssetTitle('');
    setAssetAmount('');
    setAssetTargetAmount('');
    setAssetInstitution('');
    setAssetUnitQuantity('');
    setAssetUnitPrice('');
    setAssetCurrency('TRY');
    setAssetExcludeFromReports(false);
    setAssetNotes('');
    setAssetLinkedCardId('');
  };

  const handleAssetContribution = () => {
    if (!selectedAssetForAction) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const selectedCard = accessibleCards.find((c) => c.id === actionCardId);

    addSavingsContribution(selectedAssetForAction.id, {
      amount,
      note: actionNote.trim() || (actionType === 'DEPOSIT' ? 'Birikim yatırıldı' : 'Birikimden çekildi/kullanıldı'),
      type: actionType,
      cardId: actionCardId || undefined,
      cardName: selectedCard?.name || undefined,
    });

    setSelectedAssetForAction(null);
    setActionAmount('');
    setActionNote('');
    setActionCardId('');
  };

  const handleExecuteTransferFromCard = () => {
    if (!cardForSavingsTransfer || !transferTargetSavingsId) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;

    const targetGoal = savingsGoals.find((g) => g.id === transferTargetSavingsId);
    if (!targetGoal) return;

    addSavingsContribution(targetGoal.id, {
      amount,
      note: transferNote.trim() || `${cardForSavingsTransfer.name} kartından birikime aktarıldı`,
      type: 'DEPOSIT',
      cardId: cardForSavingsTransfer.id,
      cardName: cardForSavingsTransfer.name,
    });

    setCardForSavingsTransfer(null);
    setTransferTargetSavingsId('');
    setTransferAmount('');
    setTransferNote('');
  };

  const handleCreateExpense = () => {
    if (!expTitle.trim()) return;
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) return;

    let selectedCard = expCardId ? accessibleCards.find((c) => c.id === expCardId) : undefined;
    if (!selectedCard && expPaymentMethod) {
      const pm = expPaymentMethod.trim().toLowerCase();
      const genericPhrases = ['kredi kartı', 'kredi karti', 'kredi', 'kart', 'nakit', 'banka kartı', 'banka karti'];
      if (!genericPhrases.includes(pm)) {
        selectedCard = accessibleCards.find((c) => c.name.trim().toLowerCase() === pm);
      }
    }

    addDirectExpense({
      userId: currentUser.id || 'u1',
      amount,
      categoryName: expCategory,
      date: expDate || new Date().toISOString().split('T')[0],
      itemCount: 1,
      itemsSummary: [expTitle.trim()],
      paymentMethod: selectedCard ? selectedCard.name : expPaymentMethod,
      cardId: selectedCard?.id,
      cardName: selectedCard?.name,
      cardType: selectedCard?.type,
      note: expNote.trim() || expTitle.trim(),
      type: 'DIRECT_EXPENSE',
      isShared: expIsShared,
      sharedWith: expIsShared ? users.filter((u) => u.id !== currentUser.id).map((u) => u.name) : undefined,
    });

    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpNote('');
    setExpCardId('');
  };

  const handleOpenAddExpenseWithCard = (cardId: string) => {
    setExpCardId(cardId);
    const c = accessibleCards.find((item) => item.id === cardId);
    if (c) {
      if (c.type === 'FOOD_CARD') setExpCategory('Yeme-İçme & Kafe');
      else setExpCategory('Süpermarket & Gıda');
    }
    setIsAddExpenseOpen(true);
  };

  const handleOpenTransferFromCard = (cardId: string) => {
    const c = accessibleCards.find((item) => item.id === cardId);
    if (c) {
      setCardForSavingsTransfer(c);
      if (savingsGoals.length > 0) {
        setTransferTargetSavingsId(savingsGoals[0].id);
      }
    }
  };

  const handleSaveIncomeBudget = () => {
    // Web `required` inputs block an empty submit
    if (!tempIncome || !tempBudget) return;
    const inc = parseFloat(tempIncome);
    const bud = parseFloat(tempBudget);
    if (!isNaN(inc) && inc >= 0) setMonthlyIncome(inc);
    if (!isNaN(bud) && bud >= 0) setMonthlyBudget(bud);
    setIsIncomeModalOpen(false);
  };

  const cardOptionLabel = (c: PaymentCard) =>
    `${c.name} (${c.type === 'CREDIT_CARD' ? `Borç: ₺${c.currentDebt || 0}` : `Bakiye: ₺${c.balance || 0}`})`;

  const excludedTotal = reportData.excludedCardsCount + reportData.excludedAssetsCount;

  const scopeInactiveText = 'text-slate-600 dark:text-slate-400';
  const subTabInactive = 'text-slate-600 dark:text-slate-400';

  return (
    <View nativeID="finance-view-root" style={tw`gap-4`}>
      {/* 1. Header Bar with Global Scope & Monthly Income */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-row flex-wrap items-center justify-between gap-3`}
      >
        <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
          <Gradient
            dir="tr"
            colors={['emerald-600', 'teal-500']}
            className="w-10 h-10 rounded-xl items-center justify-center shadow-xs"
          >
            <PiggyBank {...ic('w-5 h-5 text-white')} />
          </Gradient>
          <View style={tw`flex-1 min-w-0`}>
            <Text className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Finansal Yönetim Merkezi
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Kartlar, harcamalar, birikim hedefleri ve bütçe
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-2`}>
          <Btn
            nativeID="edit-income-budget-btn"
            onPress={() => {
              setTempIncome(monthlyIncome.toString());
              setTempBudget(monthlyBudget.toString());
              setIsIncomeModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex-row items-center gap-1.5 border border-slate-200/60 dark:border-slate-700"
          >
            <Wallet {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            <Text className="text-slate-700 dark:text-slate-200 text-xs font-semibold">
              Gelir: ₺{monthlyIncome.toLocaleString('tr-TR')}
            </Text>
          </Btn>
        </View>
      </View>

      {/* 2. Global Scope Filter Bar (Tümü | Kişisel / Özel | Ortak / Aile) */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-col items-center justify-between gap-3`}
      >
        <View style={tw`flex-row items-center gap-2 self-start`}>
          <View
            style={tw`w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 items-center justify-center`}
          >
            <SlidersHorizontal {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
          </View>
          <View style={tw`flex-1`}>
            <Text className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Finansal Kapsam</Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {globalScope === 'ALL' ? 'Tüm şahsi ve paylaşımlı aile finansı' : null}
              {globalScope === 'PERSONAL' ? 'Yalnızca şahsi / özel birikim ve harcamalarınız' : null}
              {globalScope === 'SHARED' ? 'Ortak aile ve ev bütçesi varlıkları' : null}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full`}
          contentContainerStyle={tw`flex-row items-center gap-1 p-1 flex-grow`}
        >
          <Btn
            nativeID="scope-all-btn"
            onPress={() => {
              setGlobalScope('ALL');
              setAssetScopeFilter('ALL');
              setExpenseScopeFilter('ALL');
              setReportScopeFilter('ALL');
            }}
            className={`flex-grow px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 ${
              globalScope === 'ALL' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''
            }`}
          >
            <Layers {...ic('w-3.5 h-3.5 text-slate-500')} />
            <Text
              className={`text-xs font-bold ${
                globalScope === 'ALL' ? 'text-slate-900 dark:text-white' : scopeInactiveText
              }`}
            >
              Tümü ({savingsGoals.length + expenses.length})
            </Text>
          </Btn>
          <Btn
            nativeID="scope-personal-btn"
            onPress={() => {
              setGlobalScope('PERSONAL');
              setAssetScopeFilter('PERSONAL');
              setExpenseScopeFilter('PERSONAL');
              setReportScopeFilter('PERSONAL');
            }}
            className={`flex-grow px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 ${
              globalScope === 'PERSONAL' ? 'bg-purple-600 shadow-xs' : ''
            }`}
          >
            <User {...ic(`w-3.5 h-3.5 ${globalScope === 'PERSONAL' ? 'text-white' : scopeInactiveText}`)} />
            <Text className={`text-xs font-bold ${globalScope === 'PERSONAL' ? 'text-white' : scopeInactiveText}`}>
              Kişisel ({personalSavingsCount + personalExpensesCount})
            </Text>
          </Btn>
          <Btn
            nativeID="scope-shared-btn"
            onPress={() => {
              setGlobalScope('SHARED');
              setAssetScopeFilter('SHARED');
              setExpenseScopeFilter('SHARED');
              setReportScopeFilter('SHARED');
            }}
            className={`flex-grow px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 ${
              globalScope === 'SHARED' ? 'bg-sky-600 shadow-xs' : ''
            }`}
          >
            <Users {...ic(`w-3.5 h-3.5 ${globalScope === 'SHARED' ? 'text-white' : scopeInactiveText}`)} />
            <Text className={`text-xs font-bold ${globalScope === 'SHARED' ? 'text-white' : scopeInactiveText}`}>
              Ortak / Aile ({sharedSavingsCount + sharedExpensesCount})
            </Text>
          </Btn>
        </ScrollView>
      </View>

      {/* 3. Primary Segmented Sub-Tab Switcher (Kartlar | Harcamalar | Birikimler | Raporlar) */}
      <View
        style={tw`bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs`}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`flex-row items-center gap-1.5 flex-grow`}
        >
          {(
            [
              { id: 'cards', label: 'Kartlarım & Cüzdan', Icon: CreditCard, active: 'bg-indigo-600', pill: 'bg-indigo-500/40', count: accessibleCards.length },
              { id: 'expenses', label: 'Harcama Listesi', Icon: Receipt, active: 'bg-rose-600', pill: 'bg-rose-500/40', count: expenses.length },
              { id: 'savings', label: 'Birikimler & Hedefler', Icon: Coins, active: 'bg-emerald-600', pill: 'bg-emerald-500/40', count: savingsGoals.length },
              { id: 'reports', label: 'Finans Raporu', Icon: BarChart3, active: 'bg-teal-600', pill: '', count: null },
            ] as const
          ).map((tab) => {
            const isActive = activeSubTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <Btn
                key={tab.id}
                nativeID={`subtab-${tab.id}-btn`}
                onPress={() => setActiveSubTab(tab.id)}
                className={`flex-grow shrink-0 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-2 ${
                  isActive ? `${tab.active} shadow-xs` : ''
                }`}
              >
                <TabIcon {...ic(`w-4 h-4 ${isActive ? 'text-white' : subTabInactive}`)} />
                <Text className={`text-xs font-bold ${isActive ? 'text-white' : subTabInactive}`}>{tab.label}</Text>
                {tab.count !== null ? (
                  <View
                    style={tw.style(
                      'px-1.5 py-0.5 rounded-full',
                      isActive ? tab.pill : 'bg-slate-200 dark:bg-slate-800',
                    )}
                  >
                    <Text
                      className={`text-[10px] ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </Btn>
            );
          })}
        </ScrollView>
      </View>

      {/* ========================================================================= */}
      {/* SECTION 1: KARTLARIM & CÜZDAN (CARDSVIEW)                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'cards' && (
        <View key="subtab-cards-content" style={tw`gap-4`}>
          <CardsView
            onAddExpenseWithCard={handleOpenAddExpenseWithCard}
            onTransferToSavings={handleOpenTransferFromCard}
          />
        </View>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: HARCAMA LİSTESİ (EXPENSES LIST & EXPENSE SUMMARY)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'expenses' && (
        <View key="subtab-expenses-content" style={tw`gap-4`}>
          {/* Top 3 Quick Expense Metrics */}
          <View style={tw`gap-3`}>
            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Bu Ay Toplam Harcama
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center`}>
                  <TrendingDown {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                ₺{totalSpentThisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
              <View style={tw`mt-1 flex-row items-center justify-between`}>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bütçe: ₺{monthlyBudget.toLocaleString('tr-TR')}
                </Text>
                <Text
                  className={`text-[11px] font-bold ${
                    totalSpentThisMonth > monthlyBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  %{monthlyBudget > 0 ? Math.round((totalSpentThisMonth / monthlyBudget) * 100) : 0} Kullanıldı
                </Text>
              </View>
            </View>

            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Alışveriş / Market Kasası
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 items-center justify-center`}>
                  <ShoppingBag {...ic('w-4 h-4 text-teal-600 dark:text-teal-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                ₺{shoppingExpensesThisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Tamamlanan market listelerinden kaydedildi
              </Text>
            </View>

            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Doğrudan Harcama & Fatura
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                  <CreditCard {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                ₺{directExpensesThisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Kart, yemek kartı veya nakit direkt ödemeler
              </Text>
            </View>
          </View>

          {/* Expense Filter Control Bar */}
          <View
            style={tw`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-3`}
          >
            <View style={tw`flex-row flex-wrap items-center justify-between gap-3`}>
              {/* Search input */}
              <View style={tw`relative flex-1 min-w-[200px] justify-center`}>
                <View style={tw`absolute left-3 z-10`}>
                  <Search {...ic('w-4 h-4 text-slate-400')} />
                </View>
                <Input
                  placeholder="Harcama, kategori, not veya kart adına göre ara..."
                  value={expenseSearchQuery}
                  onChangeText={setExpenseSearchQuery}
                  returnKeyType="search"
                  autoCapitalize="none"
                  className="w-full h-11 pl-9 pr-3.5 text-[15px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </View>

              {/* Add Expense Action Button */}
              <Btn
                onPress={() => setIsAddExpenseOpen(true)}
                className="px-4 py-3 rounded-xl bg-rose-600 flex-row items-center gap-1.5 shadow-xs"
              >
                <Plus {...ic('w-4 h-4 text-white')} />
                <Text className="text-white text-xs font-bold">Yeni Harcama Ekle</Text>
              </Btn>
            </View>

            {/* Time Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`flex-row items-center gap-1.5 pb-1 flex-grow`}
            >
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Dönem:</Text>
              {DATE_RANGE_PILLS.map((item) => (
                <Btn
                  key={item.id}
                  onPress={() => setDateRangeFilter(item.id)}
                  className={`px-3.5 py-2 rounded-lg ${
                    dateRangeFilter === item.id ? 'bg-rose-600 shadow-2xs' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      dateRangeFilter === item.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Btn>
              ))}

              {/* Category Filter Dropdown */}
              <Select
                value={expenseCategoryFilter}
                onChange={setExpenseCategoryFilter}
                options={[
                  { value: 'ALL', label: `Tüm Kategoriler (${expenseCategories.length})` },
                  ...expenseCategories.map((cat) => ({ value: cat, label: cat })),
                ]}
                className="ml-auto px-3 py-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                textClassName="flex-none text-xs font-semibold text-slate-700 dark:text-slate-300"
              />
            </ScrollView>
          </View>

          {/* Harcama Listesi Öğeleri */}
          <View style={tw`gap-2.5`}>
            {filteredExpenses.length === 0 ? (
              <View
                style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 items-center`}
              >
                <View style={tw`mb-3`}>
                  <Receipt {...ic('w-12 h-12 text-slate-300 dark:text-slate-600')} />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 text-center">
                  Kayıtlı Harcama Bulunamadı
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 text-center">
                  Seçilen filtrelere uygun harcama kaydı bulunmuyor. Yeni bir harcama ekleyebilir veya filtreleri sıfırlayabilirsiniz.
                </Text>
                <Btn
                  onPress={() => setIsAddExpenseOpen(true)}
                  className="px-4 py-3 rounded-xl bg-rose-600 flex-row items-center gap-1.5 shadow-xs"
                >
                  <Plus {...ic('w-4 h-4 text-white')} />
                  <Text className="text-white text-xs font-bold">İlk Harcamayı Ekle</Text>
                </Btn>
              </View>
            ) : (
              filteredExpenses.map((exp) => {
                const isShopping = exp.type === 'SHOPPING_CHECKOUT' || !!exp.listId;
                return (
                  <View
                    key={exp.id}
                    style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex-col justify-between gap-3`}
                  >
                    <View style={tw`flex-row items-start gap-3`}>
                      <View
                        style={tw.style(
                          'w-10 h-10 rounded-xl items-center justify-center shrink-0',
                          isShopping ? 'bg-teal-50 dark:bg-teal-950/60' : 'bg-rose-50 dark:bg-rose-950/60',
                        )}
                      >
                        {isShopping ? (
                          <ShoppingBag {...ic('w-5 h-5 text-teal-600 dark:text-teal-400')} />
                        ) : (
                          <Receipt {...ic('w-5 h-5 text-rose-600 dark:text-rose-400')} />
                        )}
                      </View>

                      <View style={tw`gap-1 flex-1 min-w-0`}>
                        <View style={tw`flex-row flex-wrap items-center gap-1.5`}>
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">
                            {exp.listTitle || exp.note || exp.categoryName}
                          </Text>
                          {exp.isShared ? (
                            <View
                              style={tw`px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800`}
                            >
                              <Text className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">Ortak</Text>
                            </View>
                          ) : (
                            <View
                              style={tw`px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800`}
                            >
                              <Text className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                                Kişisel
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Card badge & details */}
                        <View style={tw`flex-row flex-wrap items-center gap-2`}>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">{exp.date}</Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">•</Text>
                          <Text className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {exp.categoryName}
                          </Text>
                          {exp.cardName ? (
                            <>
                              <Text className="text-[11px] text-slate-500 dark:text-slate-400">•</Text>
                              <View
                                style={tw`flex-row items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md`}
                              >
                                {exp.cardType === 'FOOD_CARD' ? (
                                  <Utensils {...ic('w-3 h-3 text-indigo-600 dark:text-indigo-400')} />
                                ) : (
                                  <CreditCard {...ic('w-3 h-3 text-indigo-600 dark:text-indigo-400')} />
                                )}
                                <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                  {exp.cardName}
                                </Text>
                              </View>
                            </>
                          ) : exp.paymentMethod ? (
                            <>
                              <Text className="text-[11px] text-slate-500 dark:text-slate-400">•</Text>
                              <Text className="text-[11px] text-slate-500 dark:text-slate-400">{exp.paymentMethod}</Text>
                            </>
                          ) : null}
                          {isShopping && !!exp.itemCount ? (
                            <>
                              <Text className="text-[11px] text-slate-500 dark:text-slate-400">•</Text>
                              <Text className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                                {exp.itemCount} ürün
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    <View
                      style={tw`flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800`}
                    >
                      <View style={tw`flex-1 min-w-0`}>
                        <Text className="text-base font-black text-rose-600 dark:text-rose-400" numberOfLines={1} adjustsFontSizeToFit>
                          -{formatCurrencyWithSymbol(exp.amount, exp.currency || 'TRY')}
                        </Text>
                        {exp.currency && exp.currency !== 'TRY' ? (
                          <Text className="text-[10px] text-slate-400 font-medium">
                            ≈ ₺{getExpenseAmountInTRY(exp).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </Text>
                        ) : null}
                      </View>

                      <View style={tw`flex-row items-center gap-1`}>
                        {isShopping && exp.itemsSummary && exp.itemsSummary.length > 0 ? (
                          <Btn
                            onPress={() => setSelectedExpenseForDetail(exp)}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                            accessibilityLabel="Ürün Detayı"
                          >
                            <Info {...ic('w-4 h-4 text-slate-600 dark:text-slate-300')} />
                          </Btn>
                        ) : null}
                        <Btn
                          onPress={() => setExpenseToDelete(exp)}
                          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                          accessibilityLabel="Harcamayı Sil"
                        >
                          <Trash2 {...ic('w-4 h-4 text-slate-400')} />
                        </Btn>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BİRİKİMLER & HEDEFLER (SAVINGS & WEALTH GOALS)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'savings' && (
        <View key="subtab-savings-content" style={tw`gap-4`}>
          {/* Top 3 Quick Savings Metrics */}
          <View style={tw`gap-3`}>
            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Toplam Birikim Varlığı
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center`}>
                  <PiggyBank {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                ₺{totalSavingsAssets.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {savingsGoals.length} Farklı birikim hesabı / hedefi
              </Text>
            </View>

            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Bu Ay Biriktirilen
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 items-center justify-center`}>
                  <TrendingUp {...ic('w-4 h-4 text-teal-600 dark:text-teal-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                ₺{savingsDepositsThisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Bu ay hedeflere yatırılan net tutar
              </Text>
            </View>

            <View style={tw.style(CARD)}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tasarruf Oranı
                </Text>
                <View style={tw`w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                  <Percent {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
                </View>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                %{monthlyIncome > 0 ? Math.round((savingsDepositsThisMonth / monthlyIncome) * 100) : 0}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Aylık gelire göre biriktirme oranı
              </Text>
            </View>
          </View>

          {/* Savings Filter Control Bar */}
          <View
            style={tw`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-3`}
          >
            <View style={tw`flex-row flex-wrap items-center justify-between gap-3`}>
              {/* Search input */}
              <View style={tw`relative flex-1 min-w-[200px] justify-center`}>
                <View style={tw`absolute left-3 z-10`}>
                  <Search {...ic('w-4 h-4 text-slate-400')} />
                </View>
                <Input
                  placeholder="Birikim başlığı, kurum veya karta göre ara..."
                  value={assetSearchQuery}
                  onChangeText={setAssetSearchQuery}
                  returnKeyType="search"
                  autoCapitalize="none"
                  className="w-full h-11 pl-9 pr-3.5 text-[15px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </View>

              {/* Add Savings Goal Button */}
              <Btn
                onPress={() => setIsAddAssetOpen(true)}
                className="px-4 py-3 rounded-xl bg-emerald-600 flex-row items-center gap-1.5 shadow-xs"
              >
                <Plus {...ic('w-4 h-4 text-white')} />
                <Text className="text-white text-xs font-bold">Yeni Birikim / Hedef Ekle</Text>
              </Btn>
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`flex-row items-center gap-1.5 pb-1`}
            >
              {['ALL', ...assetCategories].map((cat) => {
                const isActive = assetCategoryFilter === cat;
                return (
                  <Btn
                    key={cat}
                    onPress={() => setAssetCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-lg ${isActive ? 'bg-emerald-600 shadow-2xs' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      {cat === 'ALL' ? `Tümü (${savingsGoals.length})` : cat}
                    </Text>
                  </Btn>
                );
              })}
            </ScrollView>
          </View>

          {/* Savings Goals Grid */}
          <View style={tw`gap-4`}>
            {filteredSavingsGoals.length === 0 ? (
              <View
                style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 items-center`}
              >
                <View style={tw`mb-3`}>
                  <PiggyBank {...ic('w-12 h-12 text-slate-300 dark:text-slate-600')} />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 text-center">
                  Henüz Birikim Hesabı Eklenmedi
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 text-center">
                  Vadeli mevduat, altın, döviz, fon veya fiziki nakit birikimlerinizi tanımlayarak tasarruflarınızı kartlarınızla entegre takip edin.
                </Text>
                <Btn
                  onPress={() => setIsAddAssetOpen(true)}
                  className="px-4 py-3 rounded-xl bg-emerald-600 flex-row items-center gap-1.5 shadow-xs"
                >
                  <Plus {...ic('w-4 h-4 text-white')} />
                  <Text className="text-white text-xs font-bold">İlk Birikim Hedefini Oluştur</Text>
                </Btn>
              </View>
            ) : (
              filteredSavingsGoals.map((asset) => {
                const targetAmt = asset.targetAmount || 0;
                const progress = targetAmt > 0 ? Math.min(100, Math.round((asset.currentAmount / targetAmt) * 100)) : 0;
                const linkedCard = accessibleCards.find((c) => c.id === asset.linkedCardId);
                const assetTint = asset.color || '#10b981';

                return (
                  <View
                    key={asset.id}
                    style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex-col justify-between`}
                  >
                    <View>
                      {/* Top Header: Icon, Title, Institution, Scope */}
                      <View style={tw`flex-row items-start justify-between gap-2 mb-3`}>
                        <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
                          <View
                            style={[
                              tw`w-10 h-10 rounded-xl items-center justify-center shadow-2xs`,
                              { backgroundColor: `${assetTint}20` },
                            ]}
                          >
                            <Text className="text-lg" style={{ color: assetTint }}>
                              {asset.icon || '🏦'}
                            </Text>
                          </View>
                          <View style={tw`flex-1 min-w-0`}>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {asset.title}
                            </Text>
                            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                              {asset.institution || asset.category}
                            </Text>
                          </View>
                        </View>

                        <View style={tw`flex-row items-center gap-1`}>
                          {asset.excludeFromReports ? (
                            <View
                              style={tw`px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800`}
                            >
                              <Text className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                                🚫 Rapordan Hariç
                              </Text>
                            </View>
                          ) : null}
                          {asset.isShared ? (
                            <View
                              style={tw`px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800`}
                            >
                              <Text className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">Ortak</Text>
                            </View>
                          ) : (
                            <View
                              style={tw`px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800`}
                            >
                              <Text className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                                Kişisel
                              </Text>
                            </View>
                          )}
                          <Btn onPress={() => setAssetToDelete(asset)} className="w-10 h-10 -my-2 -mr-2 rounded-xl items-center justify-center" accessibilityLabel="Sil">
                            <Trash2 {...ic('w-4 h-4 text-slate-400')} />
                          </Btn>
                        </View>
                      </View>

                      {/* Current Amount Display */}
                      <View style={tw`mb-3`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <Text className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                            Mevcut Birikim
                          </Text>
                          {asset.currency && asset.currency !== 'TRY' ? (
                            <View style={tw`bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md`}>
                              <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {formatAssetQuantityDisplay(asset.unitQuantity, asset.currency)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
                          ₺{asset.currentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </Text>
                        {!!asset.unitPrice && asset.unitPrice > 0 && asset.currency !== 'TRY' ? (
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Birim Fiyat: ₺{asset.unitPrice.toLocaleString('tr-TR')}
                          </Text>
                        ) : null}
                      </View>

                      {/* Target Progress Bar (If target amount is set) */}
                      {targetAmt > 0 ? (
                        <View style={tw`mb-3 gap-1`}>
                          <View style={tw`flex-row items-center justify-between`}>
                            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                              Hedef: ₺{targetAmt.toLocaleString('tr-TR')}
                            </Text>
                            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">%{progress}</Text>
                          </View>
                          <Progress
                            value={progress}
                            className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800"
                            barClassName="rounded-full bg-emerald-500"
                          />
                        </View>
                      ) : null}

                      {/* LINKED CARD BADGE (Kullanıcının talep ettiği Birikim Yapıldığı Kart Bağı) */}
                      {asset.linkedCardName || linkedCard ? (
                        <View
                          style={tw`mb-3 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 flex-row items-center justify-between`}
                        >
                          <View style={tw`flex-row items-center gap-1.5 flex-1 min-w-0`}>
                            <CreditCard {...ic('w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300')} />
                            <Text
                              className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex-1"
                              numberOfLines={1}
                            >
                              Kaynak: {asset.linkedCardName || linkedCard?.name}
                            </Text>
                          </View>
                          {linkedCard ? (
                            <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
                              {linkedCard.type === 'CREDIT_CARD'
                                ? `Borç: ₺${(linkedCard.currentDebt || 0).toLocaleString('tr-TR')}`
                                : `Bakiye: ₺${(linkedCard.balance || 0).toLocaleString('tr-TR')}`}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {/* Quick Report Toggle */}
                      <View
                        style={tw`mb-3 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/60 pl-3 pr-1.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800`}
                      >
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">Rapor Durumu:</Text>
                        <Btn
                          onPress={() => updateSavingsGoal(asset.id, { excludeFromReports: !asset.excludeFromReports })}
                          className={`px-3 py-2 rounded-lg ${
                            asset.excludeFromReports
                              ? 'bg-rose-100 dark:bg-rose-950/60'
                              : 'bg-emerald-100 dark:bg-emerald-950/60'
                          }`}
                          accessibilityLabel="Tıklayarak finans raporlarına dahil edebilir veya hariç tutabilirsiniz"
                        >
                          <Text
                            className={`text-[10px] font-semibold ${
                              asset.excludeFromReports
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {asset.excludeFromReports ? '🚫 Rapordan Hariç' : '✓ Raporda Aktif'}
                          </Text>
                        </Btn>
                      </View>
                    </View>

                    {/* Bottom Action Controls: Para Yatır, Para Çek, Geçmiş */}
                    <View style={tw`pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-row items-center gap-2`}>
                      <Btn
                        onPress={() => {
                          setSelectedAssetForAction(asset);
                          setActionType('DEPOSIT');
                          setActionAmount('');
                          setActionNote('');
                          setActionCardId(asset.linkedCardId || '');
                        }}
                        className="flex-1 py-3 px-2 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-1 shadow-2xs"
                      >
                        <ArrowDownLeft {...ic('w-3.5 h-3.5 text-white')} />
                        <Text className="text-white text-xs font-bold">Para Yatır</Text>
                      </Btn>

                      <Btn
                        onPress={() => {
                          setSelectedAssetForAction(asset);
                          setActionType('WITHDRAW');
                          setActionAmount('');
                          setActionNote('');
                          setActionCardId(asset.linkedCardId || '');
                        }}
                        className="flex-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-row items-center justify-center gap-1"
                      >
                        <ArrowUpRight {...ic('w-3.5 h-3.5 text-slate-700 dark:text-slate-300')} />
                        <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold">Para Çek</Text>
                      </Btn>

                      <Btn
                        onPress={() => setSelectedAssetForHistory(asset)}
                        className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                        accessibilityLabel="İşlem Geçmişi"
                      >
                        <History {...ic('w-4 h-4 text-slate-600 dark:text-slate-300')} />
                      </Btn>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: FİNANS RAPORU & ANALİZ (REPORTS & BUDGET)                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <View key="subtab-reports-content" style={tw`gap-4`}>
          {/* Period & Scope Header */}
          <View
            style={tw`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-3`}
          >
            <View>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Finansal Durum ve Bütçe Analizi</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {reportData.periodSubLabel}
                {excludedTotal > 0 ? (
                  <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    {'  '}({excludedTotal} hesap rapordan hariç)
                  </Text>
                ) : null}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`flex-row items-center gap-2`}
            >
              <Btn
                onPress={() => setShowReportAccountFilter(!showReportAccountFilter)}
                className={`px-3 py-2.5 rounded-xl flex-row items-center gap-1.5 border ${
                  showReportAccountFilter || excludedTotal > 0
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                }`}
                accessibilityLabel="Rapora dahil edilecek veya hariç tutulacak hesapları seçin"
              >
                <SlidersHorizontal
                  {...ic(
                    `w-3.5 h-3.5 ${
                      showReportAccountFilter || excludedTotal > 0
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`,
                  )}
                />
                <Text
                  className={`text-xs font-bold ${
                    showReportAccountFilter || excludedTotal > 0
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Hesap Filtresi
                </Text>
                {excludedTotal > 0 ? (
                  <View style={tw`min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 items-center justify-center`}>
                    <Text className="text-white text-[10px] font-bold">{excludedTotal}</Text>
                  </View>
                ) : null}
              </Btn>

              <View style={tw`flex-row items-center gap-1`}>
                {REPORT_PERIOD_PILLS.map((p) => (
                  <Btn
                    key={p.id}
                    onPress={() => setReportPeriod(p.id)}
                    className={`px-3.5 py-2.5 rounded-xl ${
                      reportPeriod === p.id ? 'bg-teal-600 shadow-2xs' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        reportPeriod === p.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </Text>
                  </Btn>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Expandable Account Filter Panel (Kullanıcı Talebi: İstediğim banka hesaplarını raporlardan hariç tutayım) */}
          {showReportAccountFilter ? (
            <View
              style={tw`bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-sm gap-3 overflow-hidden`}
            >
              <View
                style={tw`flex-row flex-wrap items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2`}
              >
                <View style={tw`flex-row items-center gap-2`}>
                  <Sliders {...ic('w-4 h-4 text-amber-600 dark:text-amber-400')} />
                  <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1">
                    Rapor Kapsamındaki Banka & Kart Hesapları
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  İşareti kaldırılan hesapların harcamaları ve bakiyeleri bu rapordan hariç tutulur.
                </Text>
              </View>

              <View style={tw`gap-4 pt-1`}>
                {/* Banka & Kredi Kartları */}
                <View>
                  <View style={tw`mb-2 flex-row items-center gap-1.5`}>
                    <CreditCard {...ic('w-3.5 h-3.5 text-slate-500')} />
                    <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Kartlar ({accessibleCards.length})
                    </Text>
                  </View>
                  <ScrollView style={tw`max-h-48`} nestedScrollEnabled contentContainerStyle={tw`gap-2 pr-1`}>
                    {accessibleCards.length === 0 ? (
                      <Text className="text-xs text-slate-400">Kayıtlı kart yok.</Text>
                    ) : (
                      accessibleCards.map((card) => {
                        const isIncluded = !card.excludeFromReports;
                        return (
                          <Btn
                            key={card.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isIncluded }}
                            onPress={() => updatePaymentCard(card.id, { excludeFromReports: !card.excludeFromReports })}
                            className={`flex-row items-center justify-between gap-2 px-3 py-3 rounded-xl border ${
                              isIncluded
                                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                            }`}
                          >
                            <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
                              <CheckBox checked={isIncluded} />
                              <View style={tw`flex-1 min-w-0`}>
                                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {card.name}
                                </Text>
                                <Text className="text-[10px] text-slate-400">
                                  {card.provider} • {card.type === 'CREDIT_CARD' ? 'Kredi Kartı' : 'Banka Kartı'}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={tw.style(
                                'px-2 py-0.5 rounded-full',
                                isIncluded ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-rose-100 dark:bg-rose-950/80',
                              )}
                            >
                              <Text
                                className={`text-[10px] font-bold ${
                                  isIncluded ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {isIncluded ? 'Dahil' : 'Hariç'}
                              </Text>
                            </View>
                          </Btn>
                        );
                      })
                    )}
                  </ScrollView>
                </View>

                {/* Birikim & Varlık Hesapları */}
                <View>
                  <View style={tw`mb-2 flex-row items-center gap-1.5`}>
                    <PiggyBank {...ic('w-3.5 h-3.5 text-slate-500')} />
                    <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Banka & Birikim Hesapları ({savingsGoals.length})
                    </Text>
                  </View>
                  <ScrollView style={tw`max-h-48`} nestedScrollEnabled contentContainerStyle={tw`gap-2 pr-1`}>
                    {savingsGoals.length === 0 ? (
                      <Text className="text-xs text-slate-400">Kayıtlı birikim hesabı yok.</Text>
                    ) : (
                      savingsGoals.map((asset) => {
                        const isIncluded = !asset.excludeFromReports;
                        return (
                          <Btn
                            key={asset.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isIncluded }}
                            onPress={() => updateSavingsGoal(asset.id, { excludeFromReports: !asset.excludeFromReports })}
                            className={`flex-row items-center justify-between gap-2 px-3 py-3 rounded-xl border ${
                              isIncluded
                                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                            }`}
                          >
                            <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
                              <CheckBox checked={isIncluded} />
                              <View style={tw`flex-1 min-w-0`}>
                                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {asset.title}
                                </Text>
                                <Text className="text-[10px] text-slate-400">
                                  {asset.institution || asset.category} • ₺{asset.currentAmount.toLocaleString('tr-TR')}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={tw.style(
                                'px-2 py-0.5 rounded-full',
                                isIncluded ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-rose-100 dark:bg-rose-950/80',
                              )}
                            >
                              <Text
                                className={`text-[10px] font-bold ${
                                  isIncluded ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {isIncluded ? 'Dahil' : 'Hariç'}
                              </Text>
                            </View>
                          </Btn>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          ) : null}

          {/* 4 Cards: Gelir, Harcama, Net Tasarruf, Bütçe Kullanımı */}
          <Grid cols={2} gap={3}>
            <View style={tw.style(CARD, 'flex-1')}>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplam Gelir</Text>
              <Text className="text-xl font-black text-emerald-600 dark:text-emerald-400" numberOfLines={1} adjustsFontSizeToFit>
                ₺{reportData.totalIncome.toLocaleString('tr-TR')}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Dönemlik bütçe geliri</Text>
            </View>

            <View style={tw.style(CARD, 'flex-1')}>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplam Gider</Text>
              <Text className="text-xl font-black text-rose-600 dark:text-rose-400" numberOfLines={1} adjustsFontSizeToFit>
                ₺{reportData.totalSpent.toLocaleString('tr-TR')}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {reportData.periodExpensesCount} Harcama kaydı
              </Text>
            </View>

            <View style={tw.style(CARD, 'flex-1')}>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Kalan</Text>
              <Text
                className={`text-xl font-black ${
                  reportData.netSavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                }`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₺{reportData.netSavings.toLocaleString('tr-TR')}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Gelir - Gider dengesi</Text>
            </View>

            <View style={tw.style(CARD, 'flex-1')}>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Bütçe Kullanımı
              </Text>
              <Text
                className={`text-xl font-black ${
                  reportData.budgetUsagePercent > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                %{reportData.budgetUsagePercent}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Hedef bütçe oranı</Text>
            </View>
          </Grid>

          {/* Kredi Kartları Güncel Durumu ve Aylık Dönem Analizi (Kullanıcı Talebi) */}
          <View
            style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs gap-4`}
          >
            <View
              style={tw`gap-3 border-b border-slate-100 dark:border-slate-800 pb-3`}
            >
              <View>
                <View style={tw`flex-row items-center gap-2`}>
                  <CreditCard {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white flex-1">
                    Kredi Kartları Güncel Durumu & Ekstre Dönemleri
                  </Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Her kartın güncel borç, kullanılabilir limit durumu ve seçtiğiniz hesap kesim dönemi harcama dökümü
                </Text>
              </View>

              <View style={tw`flex-row flex-wrap items-center gap-3`}>
                <View
                  style={tw`px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800`}
                >
                  <Text className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                    Toplam Borç: ₺{reportData.totalCreditDebt.toLocaleString('tr-TR')}
                  </Text>
                </View>
                <View
                  style={tw`px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800`}
                >
                  <Text className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                    Toplam Limit: ₺{reportData.totalCreditLimit.toLocaleString('tr-TR')}
                  </Text>
                </View>
              </View>
            </View>

            {reportData.creditCardsReport.length === 0 ? (
              <View style={tw`py-6 items-center`}>
                <View style={tw`mb-2`}>
                  <CreditCard {...ic('w-10 h-10 text-slate-300 dark:text-slate-600')} />
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Henüz kayıtlı kredi kartı bulunmuyor.
                </Text>
                <Btn onPress={() => setActiveSubTab('cards')} className="mt-2 py-2.5 px-3">
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Kartlar sekmesinden kredi kartı ekleyin →
                  </Text>
                </Btn>
              </View>
            ) : (
              <View style={tw`gap-4`}>
                {reportData.creditCardsReport.map((cardItem) => {
                  const {
                    card,
                    billingCycles,
                    activeCycleId,
                    currentCycle,
                    cycleSpends,
                    cycleSpendTotal,
                    limit,
                    debt,
                    availableLimit,
                    usagePercent,
                    isExcluded,
                  } = cardItem;

                  return (
                    <View
                      key={card.id}
                      style={tw.style(
                        'p-4 rounded-2xl border',
                        isExcluded
                          ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/50'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700',
                      )}
                    >
                      {/* Card Header: Name, Provider, Excluded Toggle */}
                      <View style={tw`flex-row items-center justify-between gap-2 mb-3`}>
                        <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
                          <View style={tw`w-8 h-8 rounded-lg bg-indigo-600 items-center justify-center shadow-2xs`}>
                            <Text className={PRIMARY_TXT}>💳</Text>
                          </View>
                          <View style={tw`flex-1 min-w-0`}>
                            <View style={tw`flex-row flex-wrap items-center gap-1.5`}>
                              <Text className="text-xs font-bold text-slate-900 dark:text-white">{card.name}</Text>
                              <Text className="text-[10px] font-normal text-slate-400">({card.provider})</Text>
                            </View>
                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              •••• {card.last4 || '0000'}
                            </Text>
                          </View>
                        </View>

                        <View style={tw`flex-row items-center gap-1.5`}>
                          <Btn
                            onPress={() => updatePaymentCard(card.id, { excludeFromReports: !card.excludeFromReports })}
                            className={`px-3 py-2 rounded-lg ${
                              isExcluded ? 'bg-rose-100 dark:bg-rose-950/60' : 'bg-emerald-100 dark:bg-emerald-950/60'
                            }`}
                            accessibilityLabel="Tıklayarak genel finans raporuna dahil edebilir veya hariç tutabilirsiniz"
                          >
                            <Text
                              className={`text-[10px] font-semibold ${
                                isExcluded ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {isExcluded ? '🚫 Rapordan Hariç' : '✓ Raporda Aktif'}
                            </Text>
                          </Btn>
                        </View>
                      </View>

                      {/* EKSTRE DÖNEMİ SEÇİCİ (Kullanıcı Talebi: Kredi kartlarının aylık dönemlerini ben seçebileyim) */}
                      <View
                        style={tw`mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 gap-1.5`}
                      >
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={tw`flex-row items-center gap-1`}>
                            <Calendar {...ic('w-3.5 h-3.5 text-indigo-500')} />
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Aylık Ekstre Dönemi Seçimi:
                            </Text>
                          </View>
                          {currentCycle ? (
                            <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              {currentCycle.shortLabel}
                            </Text>
                          ) : null}
                        </View>

                        <Select
                          value={activeCycleId}
                          onChange={(value) => updatePaymentCard(card.id, { activeBillingCycle: value })}
                          options={billingCycles.map((cycle) => ({
                            value: cycle.id,
                            label: `${cycle.label} — (${cycle.shortLabel})`,
                          }))}
                          className="w-full h-11 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          textClassName="text-[15px] font-bold text-slate-900 dark:text-slate-100"
                        />
                      </View>

                      {/* Current Status Metrics */}
                      <Grid cols={2} gap={2} className="mb-3">
                        <View
                          style={tw`flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700`}
                        >
                          <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Güncel Dönem Borcu
                          </Text>
                          <Text className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
                            ₺{debt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text className="text-[10px] text-slate-400 mt-0.5">Son Ödeme: {card.dueDay}. Gün</Text>
                        </View>

                        <View
                          style={tw`flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700`}
                        >
                          <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Seçilen Dönem Harcaması
                          </Text>
                          <Text className="text-base font-black text-slate-900 dark:text-white mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
                            ₺{cycleSpendTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {cycleSpends.length} harcama kaydı
                          </Text>
                        </View>
                      </Grid>

                      {/* Limit & Progress */}
                      <View style={tw`gap-1.5`}>
                        <View style={tw`flex-row flex-wrap items-center justify-between`}>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kullanılabilir:{' '}
                            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              ₺{availableLimit.toLocaleString('tr-TR')}
                            </Text>
                          </Text>
                          <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Toplam Limit: ₺{limit.toLocaleString('tr-TR')} (%{usagePercent})
                          </Text>
                        </View>
                        <Progress
                          value={usagePercent}
                          className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700"
                          barClassName={`rounded-full ${
                            usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                        />
                      </View>

                      {/* Selected Cycle Spends Accordion / Mini List */}
                      {cycleSpends.length > 0 ? (
                        <View style={tw`mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60`}>
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Bu Dönemin Harcamaları:
                          </Text>
                          <ScrollView style={tw`max-h-24`} nestedScrollEnabled contentContainerStyle={tw`gap-1`}>
                            {cycleSpends.slice(0, 4).map((t) => (
                              <View key={t.id} style={tw`flex-row items-center justify-between py-0.5`}>
                                <Text
                                  className="text-[11px] text-slate-600 dark:text-slate-300 pr-2 flex-1"
                                  numberOfLines={1}
                                >
                                  {t.title}
                                </Text>
                                <Text className="text-[11px] font-bold text-slate-900 dark:text-white shrink-0">
                                  -₺{t.amount.toLocaleString('tr-TR')}
                                </Text>
                              </View>
                            ))}
                            {cycleSpends.length > 4 ? (
                              <Text className="text-[10px] text-indigo-500 font-semibold text-center">
                                +{cycleSpends.length - 4} diğer harcama
                              </Text>
                            ) : null}
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Varlık, Likidite & Banka Hesapları Özeti (Kullanıcı Talebi: Banka Kartı Para Birimi & Doğrudan Yatırım Hesabı) */}
          <View
            style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs gap-4`}
          >
            <View
              style={tw`gap-3 border-b border-slate-100 dark:border-slate-800 pb-3`}
            >
              <View>
                <View style={tw`flex-row items-center gap-2`}>
                  <Building2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white flex-1">
                    Varlık, Likidite & Banka Hesapları Durumu
                  </Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Banka kartları, doğrudan yatırım hesapları (EUR/USD vb.) ve birikim hedeflerinizin konsolide finansal durumu
                </Text>
              </View>

              {/* Net Worth Badge */}
              <View style={tw`flex-row items-center gap-2 self-start max-w-full`}>
                <Gradient
                  dir="r"
                  colors={['rgba(16,185,129,0.15)', 'rgba(20,184,166,0.15)']}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30"
                >
                  <Text className="text-emerald-800 dark:text-emerald-300 text-xs font-black" numberOfLines={1} adjustsFontSizeToFit>
                    Net Varlık: ₺{reportData.netWorthInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Text>
                </Gradient>
              </View>
            </View>

            {/* Financial Totals Breakdown Bar */}
            <Grid cols={2} gap={3}>
              <View
                style={tw`flex-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}
              >
                <Text className="text-[10px] uppercase font-bold text-slate-400">Vadesiz Nakit (TL)</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  ₺{reportData.regularBankInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Text>
                <Text className="text-[10px] text-slate-400">Harcanabilir nakit</Text>
              </View>

              <View
                style={tw`flex-1 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40`}
              >
                <View style={tw`flex-row items-center gap-1`}>
                  <TrendingUp {...ic('w-3 h-3 text-amber-800 dark:text-amber-400')} />
                  <Text className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
                    Doğrudan Yatırım
                  </Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-amber-900 dark:text-amber-200 mt-0.5">
                  ₺{reportData.investmentAccountsInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Text>
                <Text className="text-[10px] text-amber-700 dark:text-amber-400">Banka döviz / fon birikimi</Text>
              </View>

              <View
                style={tw`flex-1 p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-900/40`}
              >
                <View style={tw`flex-row items-center gap-1`}>
                  <Coins {...ic('w-3 h-3 text-teal-800 dark:text-teal-400')} />
                  <Text className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-400">
                    Birikim Hedefleri
                  </Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-teal-900 dark:text-teal-200 mt-0.5">
                  ₺{reportData.totalSavingsGoalsInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Text>
                <Text className="text-[10px] text-teal-700 dark:text-teal-400">Altın / döviz hedefleri</Text>
              </View>

              <View
                style={tw`flex-1 p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40`}
              >
                <Text className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                  Kredi Kartı Borçları
                </Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  -₺{reportData.totalCreditDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Text>
                <Text className="text-[10px] text-rose-600/80 dark:text-rose-400/80">Toplam ekstre yükü</Text>
              </View>
            </Grid>

            {/* List of Bank & Investment Accounts with currency translation */}
            {reportData.bankAccountsReport.length > 0 ? (
              <View style={tw`gap-2 pt-2`}>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hesap Dökümü & Para Birimi Karşılıkları
                </Text>
                <View style={tw`gap-2.5`}>
                  {reportData.bankAccountsReport.map((acc) => (
                    <View
                      key={acc.card.id}
                      style={tw.style(
                        'p-3 rounded-xl border',
                        acc.isExcluded
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : acc.isInvestmentAccount
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                      )}
                    >
                      <View style={tw`flex-row items-center justify-between mb-1.5`}>
                        <Text
                          className="font-bold text-xs text-slate-800 dark:text-slate-200 pr-2 flex-1"
                          numberOfLines={1}
                        >
                          {acc.card.name}
                        </Text>
                        <View style={tw`flex-row items-center gap-1`}>
                          {acc.isInvestmentAccount ? (
                            <View style={tw`px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900`}>
                              <Text className="text-[9px] font-bold text-amber-900 dark:text-amber-200">Yatırım</Text>
                            </View>
                          ) : null}
                          <View style={tw`px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700`}>
                            <Text className="text-[9px] font-black text-slate-700 dark:text-slate-300">
                              {acc.currency}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={tw`flex-row items-end justify-between gap-2`}>
                        <View style={tw`flex-1 min-w-0`}>
                          <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrencyWithSymbol(acc.rawBalance, acc.currency)}
                          </Text>
                          {acc.currency !== 'TRY' ? (
                            <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ≈ ₺{acc.balanceInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </Text>
                          ) : null}
                        </View>

                        {acc.currency !== 'TRY' ? (
                          <View style={tw`items-end`}>
                            <Text className="text-[10px] text-slate-400">Günlük Kur</Text>
                            <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {getCurrencyRateInTRY(acc.currency, exchangeRates).toFixed(2)} ₺
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Kategori Bazlı Harcama Dağılımı */}
          <View
            style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs gap-4`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <PieChart {...ic('w-4 h-4 text-teal-600 dark:text-teal-400')} />
              <Text className="text-sm font-bold text-slate-900 dark:text-white flex-1">Kategori Bazlı Harcama Dağılımı</Text>
            </View>

            {reportData.categoryBreakdown.length === 0 ? (
              <Text className="text-xs text-slate-400 py-4 text-center">Bu dönem için harcama verisi bulunamadı.</Text>
            ) : (
              <View style={tw`gap-3`}>
                {reportData.categoryBreakdown.map((cat) => (
                  <View key={cat.name} style={tw`gap-1`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">{cat.name}</Text>
                      <View style={tw`flex-row items-center gap-2`}>
                        <Text className="text-xs font-bold text-slate-900 dark:text-white">
                          ₺{cat.amount.toLocaleString('tr-TR')}
                        </Text>
                        <Text className="text-[10px] text-slate-400">%{cat.percent}</Text>
                      </View>
                    </View>
                    <Progress
                      value={cat.percent}
                      className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800"
                      barClassName="rounded-full bg-teal-500"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: YENİ BİRİKİM VARLIĞI / HEDEF EKLE                                */}
      {/* ========================================================================= */}
      {isAddAssetOpen && (
        <Overlay onClose={() => setIsAddAssetOpen(false)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-lg self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View
              style={tw`flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
                <View style={tw`w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center`}>
                  <PiggyBank {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-400')} />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-white">Yeni Birikim / Hedef Ekle</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Mevduat, altın, döviz veya fiziki nakit birikim
                  </Text>
                </View>
              </View>
              <Btn onPress={() => setIsAddAssetOpen(false)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View>
                <Text className={LABEL}>Birikim Başlığı *</Text>
                <Input
                  placeholder="Örn: Çeyrek Altın Birikimi, Euro Hesabı, Ev Peşinatı"
autoCapitalize="sentences"
returnKeyType="next"
                  value={assetTitle}
                  onChangeText={setAssetTitle}
                  className={`${FIELD} font-medium`}
                />
              </View>

              {/* Para Birimi & Kıymetli Maden / Altın Seçimi */}
              <View>
                <Text className={LABEL}>Para Birimi / Varlık Türü (Altın, Döviz, vb.)</Text>
                <Select
                  value={assetCurrency}
                  onChange={(selected) => {
                    setAssetCurrency(selected);
                    const unitConfig = getCurrencyUnitConfig(selected);
                    if (unitConfig && selected !== 'TRY') {
                      setAssetUnitPrice(unitConfig.defaultRateInTRY.toString());
                      if (unitConfig.category === 'GOLD') {
                        setAssetCategory('Altın & Kıymetli Maden');
                        setAssetIcon('🪙');
                      } else if (unitConfig.category === 'CURRENCY') {
                        setAssetCategory('Döviz & Yabancı Para');
                        setAssetIcon(unitConfig.symbol);
                      }
                    } else {
                      setAssetUnitPrice('');
                      setAssetUnitQuantity('');
                    }
                  }}
                  options={CURRENCY_UNIT_LIST.map((unit) => ({
                    value: unit.key,
                    label: `${unit.symbol} ${unit.label} (${unit.key})`,
                  }))}
                  className={SELECT_FIELD}
                  textClassName={`${SELECT_TXT} font-bold`}
                />
              </View>

              {/* Eğer Altın veya Döviz ise: Miktar + Birim Fiyat -> Toplam Hesaplama */}
              {assetCurrency !== 'TRY' ? (
                <View
                  style={tw`p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 gap-3`}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {getCurrencyUnitConfig(assetCurrency).label} Varlık Hesabı
                    </Text>
                    <Text className="text-[11px] font-normal text-amber-700 dark:text-amber-400">Canlı Değerleme</Text>
                  </View>

                  <View style={tw`gap-3`}>
                    <View>
                      <Text className={LABEL}>
                        Varlık Miktarı ({getCurrencyUnitConfig(assetCurrency).unitSuffix}) *
                      </Text>
                      <Input
                        keyboardType="decimal-pad"
                        placeholder="Örn: 5"
returnKeyType="next"
                        value={assetUnitQuantity}
                        onChangeText={(text) => {
                          setAssetUnitQuantity(text);
                          const q = parseFloat(text) || 0;
                          const p = parseFloat(assetUnitPrice) || 0;
                          if (p > 0) setAssetAmount((q * p).toString());
                        }}
                        className={`${FIELD} bg-white dark:bg-slate-800 font-bold`}
                      />
                    </View>

                    <View>
                      <Text className={LABEL}>
                        Birim Fiyatı (₺)
                      </Text>
                      <Input
                        keyboardType="decimal-pad"
                        placeholder="Birim fiyat"
returnKeyType="done"
                        value={assetUnitPrice}
                        onChangeText={(text) => {
                          setAssetUnitPrice(text);
                          const p = parseFloat(text) || 0;
                          const q = parseFloat(assetUnitQuantity) || 0;
                          if (q > 0) setAssetAmount((q * p).toString());
                        }}
                        className={`${FIELD} bg-white dark:bg-slate-800 font-bold`}
                      />
                    </View>
                  </View>

                  <View
                    style={tw`pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex-row items-center justify-between`}
                  >
                    <Text className="text-xs text-amber-800 dark:text-amber-300 font-medium flex-1">
                      Hesaplanan Toplam Türk Lirası:
                    </Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit className="text-sm font-black text-amber-900 dark:text-amber-100">
                      ₺
                      {((parseFloat(assetUnitQuantity) || 0) * (parseFloat(assetUnitPrice) || 0)).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={tw`gap-3`}>
                  <View>
                    <Text className={LABEL}>Başlangıç Tutarı (₺)</Text>
                    <Input
                      keyboardType="decimal-pad"
                      placeholder="Örn: 15000"
returnKeyType="next"
                      value={assetAmount}
                      onChangeText={setAssetAmount}
                      className={`${FIELD} font-bold`}
                    />
                  </View>

                  <View>
                    <Text className={LABEL}>Hedef Tutar (₺ Opsiyonel)</Text>
                    <Input
                      keyboardType="decimal-pad"
                      placeholder="Örn: 100000"
returnKeyType="done"
                      value={assetTargetAmount}
                      onChangeText={setAssetTargetAmount}
                      className={`${FIELD} font-bold`}
                    />
                  </View>
                </View>
              )}

              {/* KAYNAK KART BAĞLANTISI (Kullanıcının talep ettiği Birikim Yapıldığı Kart Bağı) */}
              <View>
                <Text className={LABEL}>💳 Kaynak / Bağlantılı Kart (Opsiyonel)</Text>
                <Select
                  value={assetLinkedCardId}
                  onChange={setAssetLinkedCardId}
                  options={[
                    { value: '', label: 'Bağlantısız (Bağımsız Birikim)' },
                    ...accessibleCards.map((c) => ({ value: c.id, label: cardOptionLabel(c) })),
                  ]}
                  className={SELECT_FIELD}
                  textClassName={`${SELECT_TXT} font-medium`}
                />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Eğer bir kart seçerseniz ve başlangıç tutarı girdiyseniz, ilgili kartın bakiyesinden otomatik düşülür.
                </Text>
              </View>

              <View style={tw`gap-3`}>
                <View>
                  <Text className={LABEL}>Kategori</Text>
                  <Select
                    value={assetCategory}
                    onChange={setAssetCategory}
                    options={ASSET_CATEGORY_OPTIONS}
                    className={SELECT_FIELD}
                    textClassName={`${SELECT_TXT} font-medium`}
                  />
                </View>

                <View>
                  <Text className={LABEL}>Kurum / Banka</Text>
                  <Input
                    placeholder="Örn: Ziraat, Garanti, Fiziki Kasa"
autoCapitalize="words"
returnKeyType="done"
                    value={assetInstitution}
                    onChangeText={setAssetInstitution}
                    className={`${FIELD} font-medium`}
                  />
                </View>
              </View>

              {/* Scope Switcher: Kişisel / Ortak */}
              <View>
                <Text className={LABEL}>Paylaşım Kapsamı</Text>
                <Grid cols={2} gap={2}>
                  <Btn
                    onPress={() => setAssetIsShared(false)}
                    className={`h-12 px-2.5 rounded-2xl flex-row items-center justify-center gap-1.5 border ${
                      !assetIsShared
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <User {...ic('w-4 h-4 text-purple-600 dark:text-purple-400')} />
                    <Text
                      className={`text-xs font-bold ${
                        !assetIsShared ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Kişisel / Özel
                    </Text>
                  </Btn>
                  <Btn
                    onPress={() => setAssetIsShared(true)}
                    className={`h-12 px-2.5 rounded-2xl flex-row items-center justify-center gap-1.5 border ${
                      assetIsShared
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Users {...ic('w-4 h-4 text-sky-600 dark:text-sky-400')} />
                    <Text
                      className={`text-xs font-bold ${
                        assetIsShared ? 'text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Ortak / Aile
                    </Text>
                  </Btn>
                </Grid>
              </View>

              {/* Report Exclusion Option (Kullanıcı Talebi: İstediğim hesapları raporlardan hariç tutayım) */}
              <Btn
                accessibilityRole="checkbox"
                accessibilityState={{ checked: assetExcludeFromReports }}
                onPress={() => setAssetExcludeFromReports(!assetExcludeFromReports)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex-row items-center justify-between gap-3"
              >
                <View style={tw`flex-1`}>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Finans Raporlarından Hariç Tut
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bu birikim hesabını genel gelir/gider ve tasarruf raporlarına katma
                  </Text>
                </View>
                <CheckBox checked={assetExcludeFromReports} activeClassName="bg-rose-600 border-rose-600" />
              </Btn>

              <View style={tw`flex-row items-center gap-3 pt-2`}>
                <Btn onPress={() => setIsAddAssetOpen(false)} className={CANCEL_BTN}>
                  <Text className={CANCEL_TXT}>Vazgeç</Text>
                </Btn>
                <Btn onPress={handleCreateAsset} className={`${PRIMARY_BTN} bg-emerald-600`}>
                  <Text className={PRIMARY_TXT}>Birikimi Kaydet</Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BİRİKİME PARA YATIR / PARA ÇEK (DEPOSIT / WITHDRAW FROM ASSET)   */}
      {/* ========================================================================= */}
      {selectedAssetForAction && (
        <Overlay onClose={() => setSelectedAssetForAction(null)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
                <Text className="text-xl">{selectedAssetForAction.icon || '🏦'}</Text>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{selectedAssetForAction.title}</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Mevcut bakiye:{' '}
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₺{selectedAssetForAction.currentAmount.toLocaleString('tr-TR')}
                    </Text>
                  </Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedAssetForAction(null)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              {/* Switcher: Yatır / Çek */}
              <View style={tw`flex-row rounded-2xl bg-slate-100 dark:bg-slate-800 p-1`}>
                <Btn
                  onPress={() => setActionType('DEPOSIT')}
                  className={`flex-1 py-3 rounded-xl items-center ${actionType === 'DEPOSIT' ? 'bg-emerald-600 shadow-xs' : ''}`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      actionType === 'DEPOSIT' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Para Ekle (Yatır)
                  </Text>
                </Btn>
                <Btn
                  onPress={() => setActionType('WITHDRAW')}
                  className={`flex-1 py-3 rounded-xl items-center ${actionType === 'WITHDRAW' ? 'bg-rose-600 shadow-xs' : ''}`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      actionType === 'WITHDRAW' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    - Para Çek (Kullan)
                  </Text>
                </Btn>
              </View>

              <View>
                <Text className={LABEL}>İşlem Tutarı (₺) *</Text>
                <Input
                  keyboardType="decimal-pad"
                  placeholder="Tutar girin"
returnKeyType="done"
                  value={actionAmount}
                  onChangeText={setActionAmount}
                  className={`${FIELD} font-bold`}
                />
              </View>

              {/* HANGİ KARTTAN YATIRILDI / HANGİ KARTA ÇEKİLECEK SEÇİMİ */}
              <View>
                <Text className={LABEL}>
                  {actionType === 'DEPOSIT'
                    ? '💳 Para Çekilecek Kart / Hesap (Opsiyonel)'
                    : '💳 Aktarılacak Kart / Hesap (Opsiyonel)'}
                </Text>
                <Select
                  value={actionCardId}
                  onChange={setActionCardId}
                  options={[
                    { value: '', label: 'Kart Seçilmedi (Doğrudan İşlem)' },
                    ...accessibleCards.map((c) => ({ value: c.id, label: cardOptionLabel(c) })),
                  ]}
                  className={SELECT_FIELD}
                  textClassName={`${SELECT_TXT} font-medium`}
                />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {actionType === 'DEPOSIT'
                    ? 'Seçilen kartın bakiyesinden bu tutar anında düşülür ve kart ekstresine işlenir.'
                    : 'Seçilen karta bu tutar anında bakiye olarak aktarılır.'}
                </Text>
              </View>

              <View style={tw`gap-4`}>
                <View>
                  <Text className={LABEL}>Tarih</Text>
                  <DateInput
                    value={actionDate}
                    onChange={setActionDate}
                    className={FIELD}
                  />
                </View>

                <View>
                  <Text className={LABEL}>Açıklama / Not</Text>
                  <Input
                    placeholder="Örn: Maaştan tasarruf"
autoCapitalize="sentences"
returnKeyType="done"
                    value={actionNote}
                    onChangeText={setActionNote}
                    onSubmitEditing={handleAssetContribution}
                    className={FIELD}
                  />
                </View>
              </View>

              <View style={tw`flex-row items-center gap-3 pt-2`}>
                <Btn onPress={() => setSelectedAssetForAction(null)} className={CANCEL_BTN}>
                  <Text className={CANCEL_TXT}>İptal</Text>
                </Btn>
                <Btn
                  onPress={handleAssetContribution}
                  className={`${PRIMARY_BTN} ${actionType === 'DEPOSIT' ? 'bg-emerald-600' : 'bg-rose-600'}`}
                >
                  <Text className={PRIMARY_TXT}>
                    {actionType === 'DEPOSIT' ? 'Birikime Yatır' : 'Para Çek'}
                  </Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KARTTAN DOĞRUDAN BİRİKİME AKTAR (`TRANSFER FROM CARD TO SAVINGS`)  */}
      {/* ========================================================================= */}
      {cardForSavingsTransfer && (
        <Overlay onClose={() => setCardForSavingsTransfer(null)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
                <View style={tw`w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center`}>
                  <PiggyBank {...ic('w-5 h-5 text-amber-600 dark:text-amber-400')} />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">Karttan Birikime Aktar</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Kaynak:{' '}
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {cardForSavingsTransfer.name}
                    </Text>
                  </Text>
                </View>
              </View>
              <Btn onPress={() => setCardForSavingsTransfer(null)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View>
                <Text className={LABEL}>🎯 Hedef Birikim Hesabı *</Text>
                <Select
                  value={transferTargetSavingsId}
                  onChange={setTransferTargetSavingsId}
                  options={savingsGoals.map((g) => ({
                    value: g.id,
                    label: `${g.icon} ${g.title} (Mevcut: ₺${g.currentAmount.toLocaleString('tr-TR')})`,
                  }))}
                  className={SELECT_FIELD}
                  textClassName={`${SELECT_TXT} font-medium`}
                />
              </View>

              <View>
                <Text className={LABEL}>Aktarılacak Tutar (₺) *</Text>
                <Input
                  keyboardType="decimal-pad"
                  placeholder="Örn: 2500"
returnKeyType="next"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  className={`${FIELD} font-bold`}
                />
                {cardForSavingsTransfer.type !== 'CREDIT_CARD' ? (
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Kullanılabilir bakiye: ₺{(cardForSavingsTransfer.balance || 0).toLocaleString('tr-TR')}
                  </Text>
                ) : null}
              </View>

              <View>
                <Text className={LABEL}>Açıklama (Opsiyonel)</Text>
                <Input
                  placeholder="Örn: Maaştan ayrılan altın birikimi"
autoCapitalize="sentences"
returnKeyType="done"
                  value={transferNote}
                  onChangeText={setTransferNote}
                  onSubmitEditing={handleExecuteTransferFromCard}
                  className={FIELD}
                />
              </View>

              <View style={tw`flex-row items-center gap-3 pt-2`}>
                <Btn onPress={() => setCardForSavingsTransfer(null)} className={CANCEL_BTN}>
                  <Text className={CANCEL_TXT}>Vazgeç</Text>
                </Btn>
                <Btn
                  onPress={handleExecuteTransferFromCard}
                  className={`${PRIMARY_BTN} bg-emerald-600`}
                >
                  <Text className={PRIMARY_TXT}>Birikime Aktar</Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: YENİ HARCAMA EKLE                                                */}
      {/* ========================================================================= */}
      {isAddExpenseOpen && (
        <Overlay onClose={() => setIsAddExpenseOpen(false)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
                <View style={tw`w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center`}>
                  <Receipt {...ic('w-5 h-5 text-rose-600 dark:text-rose-400')} />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-white">Harcama Ekle</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Manuel harcama, fatura veya direkt gider kaydı
                  </Text>
                </View>
              </View>
              <Btn onPress={() => setIsAddExpenseOpen(false)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View>
                <Text className={LABEL}>Harcama Başlığı *</Text>
                <Input
                  placeholder="Örn: Ev Kirası, Elektrik Faturası, Akşam Yemeği"
autoCapitalize="sentences"
returnKeyType="next"
                  value={expTitle}
                  onChangeText={setExpTitle}
                  className={`${FIELD} font-medium`}
                />
              </View>

              <View style={tw`gap-4`}>
                <View>
                  <Text className={LABEL}>Tutar (₺) *</Text>
                  <Input
                    keyboardType="decimal-pad"
                    placeholder="Örn: 450"
returnKeyType="done"
                    value={expAmount}
                    onChangeText={setExpAmount}
                    className={`${FIELD} font-bold`}
                  />
                </View>

                <View>
                  <Text className={LABEL}>Kategori</Text>
                  <Select
                    value={expCategory}
                    onChange={setExpCategory}
                    options={EXPENSE_CATEGORY_OPTIONS}
                    className={SELECT_FIELD}
                    textClassName={`${SELECT_TXT} font-medium`}
                  />
                </View>
              </View>

              {/* ÖDEME KARTI SEÇİMİ */}
              <View>
                <Text className={LABEL}>💳 Ödeme Yapılan Kart (Opsiyonel)</Text>
                <Select
                  value={expCardId}
                  onChange={setExpCardId}
                  options={[
                    { value: '', label: 'Kart Seçilmedi (Genel Ödeme Yöntemi)' },
                    ...accessibleCards.map((c) => ({ value: c.id, label: cardOptionLabel(c) })),
                  ]}
                  className={SELECT_FIELD}
                  textClassName={`${SELECT_TXT} font-medium`}
                />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Seçilirse harcama tutarı ilgili kartın bakiyesinden otomatik düşülür ve işlem hareketlerine işlenir.
                </Text>
              </View>

              <View style={tw`gap-4`}>
                <View>
                  <Text className={LABEL}>Tarih</Text>
                  <DateInput
                    value={expDate}
                    onChange={setExpDate}
                    className={FIELD}
                  />
                </View>

                <View>
                  <Text className={LABEL}>Kapsam</Text>
                  <View style={tw`flex-row items-center gap-2`}>
                    <Btn
                      onPress={() => setExpIsShared(true)}
                      className={`flex-1 h-12 rounded-2xl border items-center justify-center ${
                        expIsShared
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          expIsShared ? 'text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Ortak
                      </Text>
                    </Btn>
                    <Btn
                      onPress={() => setExpIsShared(false)}
                      className={`flex-1 h-12 rounded-2xl border items-center justify-center ${
                        !expIsShared
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          !expIsShared ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Kişisel
                      </Text>
                    </Btn>
                  </View>
                </View>
              </View>

              <View style={tw`flex-row items-center gap-3 pt-2`}>
                <Btn onPress={() => setIsAddExpenseOpen(false)} className={CANCEL_BTN}>
                  <Text className={CANCEL_TXT}>Vazgeç</Text>
                </Btn>
                <Btn onPress={handleCreateExpense} className={`${PRIMARY_BTN} bg-rose-600`}>
                  <Text className={PRIMARY_TXT}>Harcamayı Kaydet</Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BİRİKİM İŞLEM GEÇMİŞİ                                            */}
      {/* ========================================================================= */}
      {selectedAssetForHistory && (
        <Overlay onClose={() => setSelectedAssetForHistory(null)}>
          <View
            style={[
              tw`bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800 flex-col`,
              { maxHeight: '85%' },
            ]}
          >
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
                <Text className="text-xl">{selectedAssetForHistory.icon || '🏦'}</Text>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{selectedAssetForHistory.title}</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">İşlem ve Katkı Geçmişi</Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedAssetForHistory(null)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <ScrollView style={tw`flex-shrink`} contentContainerStyle={tw`gap-2 pr-1`}>
              {selectedAssetForHistory.contributions && selectedAssetForHistory.contributions.length > 0 ? (
                selectedAssetForHistory.contributions.map((c) => (
                  <View
                    key={c.id}
                    style={tw`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex-row items-center justify-between gap-2`}
                  >
                    <View style={tw`gap-0.5 flex-1 min-w-0`}>
                      <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                        {c.note || (c.type === 'DEPOSIT' ? 'Para Yatırma' : 'Para Çekme')}
                      </Text>
                      <View style={tw`flex-row flex-wrap items-center gap-2`}>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{c.date}</Text>
                        {c.cardName ? (
                          <Text className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            • 💳 {c.cardName}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text
                      className={`font-black text-sm shrink-0 ${
                        c.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {c.type === 'DEPOSIT' ? '+₺' : '-₺'}
                      {c.amount.toLocaleString('tr-TR')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-400 text-center py-8">Kayıtlı işlem hareketi bulunmuyor.</Text>
              )}
            </ScrollView>

            <Btn
              onPress={() => setSelectedAssetForHistory(null)}
              className="mt-4 w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center"
            >
              <Text className="text-slate-700 dark:text-slate-300 text-[15px] font-bold">Kapat</Text>
            </Btn>
          </View>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: HARCAMA ÜRÜN DETAYI                                              */}
      {/* ========================================================================= */}
      {selectedExpenseForDetail && (
        <Overlay onClose={() => setSelectedExpenseForDetail(null)}>
          <View
            style={[
              tw`bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800 flex-col`,
              { maxHeight: '85%' },
            ]}
          >
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
                <View style={tw`w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 items-center justify-center`}>
                  <ShoppingBag {...ic('w-4 h-4 text-teal-600 dark:text-teal-400')} />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedExpenseForDetail.listTitle || 'Alışveriş Detayı'}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedExpenseForDetail.date} • ₺{selectedExpenseForDetail.amount.toLocaleString('tr-TR')}
                  </Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedExpenseForDetail(null)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <ScrollView style={tw`flex-shrink`} contentContainerStyle={tw`gap-2 pr-1`}>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Satın Alınan Ürünler ({selectedExpenseForDetail.itemsSummary?.length || 0})
              </Text>
              {selectedExpenseForDetail.itemsSummary?.map((item, idx) => (
                <View
                  key={idx}
                  style={tw`px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex-row items-center gap-2.5`}
                >
                  <CheckCircle2 {...ic('w-4 h-4 text-teal-600 dark:text-teal-400')} />
                  <Text className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">{item}</Text>
                </View>
              ))}
            </ScrollView>

            <Btn
              onPress={() => setSelectedExpenseForDetail(null)}
              className="mt-4 w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center"
            >
              <Text className="text-slate-700 dark:text-slate-300 text-[15px] font-bold">Kapat</Text>
            </Btn>
          </View>
        </Overlay>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: GELİR VE BÜTÇE AYARLARI                                          */}
      {/* ========================================================================= */}
      {isIncomeModalOpen && (
        <Overlay onClose={() => setIsIncomeModalOpen(false)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-sm self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View
              style={tw`flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Wallet {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-400')} />
                <Text className="text-sm font-bold text-slate-900 dark:text-white">Aylık Gelir ve Bütçe</Text>
              </View>
              <Btn onPress={() => setIsIncomeModalOpen(false)} className={MODAL_CLOSE_BTN} accessibilityLabel="Kapat">
                <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View>
                <Text className={LABEL}>Aylık Toplam Net Gelir (₺)</Text>
                <Input
                  keyboardType="decimal-pad"
                  value={tempIncome}
                  returnKeyType="next"
                  onChangeText={setTempIncome}
                  className={`${FIELD} font-bold`}
                />
              </View>

              <View>
                <Text className={LABEL}>Aylık Harcama Bütçesi Sınırı (₺)</Text>
                <Input
                  keyboardType="decimal-pad"
                  value={tempBudget}
                  returnKeyType="done"
                  onChangeText={setTempBudget}
                  onSubmitEditing={handleSaveIncomeBudget}
                  className={`${FIELD} font-bold`}
                />
              </View>

              <View style={tw`flex-row items-center gap-3 pt-2`}>
                <Btn onPress={() => setIsIncomeModalOpen(false)} className={CANCEL_BTN}>
                  <Text className={CANCEL_TXT}>Vazgeç</Text>
                </Btn>
                <Btn onPress={handleSaveIncomeBudget} className={`${PRIMARY_BTN} bg-emerald-600`}>
                  <Text className={PRIMARY_TXT}>Kaydet</Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmModal
        isOpen={!!assetToDelete}
        title="Birikim Hesabını Sil"
        message={`"${assetToDelete?.title}" birikim hesabını ve tüm geçmiş kayıtlarını silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        danger={true}
        onConfirm={() => {
          if (assetToDelete) deleteSavingsGoal(assetToDelete.id);
          setAssetToDelete(null);
        }}
        onClose={() => setAssetToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Harcama Kaydını Sil"
        message="Bu harcama kaydını silmek istediğinize emin misiniz?"
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        danger={true}
        onConfirm={() => {
          if (expenseToDelete) deleteExpense(expenseToDelete.id);
          setExpenseToDelete(null);
        }}
        onClose={() => setExpenseToDelete(null)}
      />
    </View>
  );
};
