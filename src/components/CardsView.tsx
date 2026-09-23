import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Edit2,
  History,
  Info,
  PiggyBank,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  User,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react-native';

import { useAppStore } from '../store/useAppStore';
import type { PaymentCard, PaymentCardType } from '../types';
import { getAccessibleCards } from '../lib/permissions';
import {
  BANK_CARD_CURRENCIES,
  convertCurrencyToTRY,
  formatCurrencyWithSymbol,
  getCreditCardBillingCycles,
  getCurrencyRateInTRY,
  getCurrencySymbol,
  isDateInCycle,
} from '../lib/currencyUnits';
import { ic, tw } from '../lib/tw';
import { ConfirmModal } from './ConfirmModal';
import { Btn, DateInput, Gradient, Grid, Input, Overlay, Panel, Select, showToast, Text } from './ui';

interface CardsViewProps {
  onAddExpenseWithCard?: (cardId: string) => void;
  onTransferToSavings?: (cardId: string) => void;
}

// ---------------------------------------------------------------------------
// Local helpers (web-only visuals re-created for RN)
// ---------------------------------------------------------------------------

/** Mixes two hex colors (t = 0 → a, t = 1 → b). */
const mixHex = (a: string, b: string, t: number): string => {
  const parse = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return Number.isNaN(n) ? [99, 102, 241] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const ca = parse(a);
  const cb = parse(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** <input type="checkbox"> replacement (w-4 h-4 rounded box). */
const CheckBox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedClassName: string;
  label: string;
}> = ({ checked, onChange, checkedClassName, label }) => (
  <Btn
    onPress={() => onChange(!checked)}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
    hitSlop={10}
    className={`w-4 h-4 rounded border items-center justify-center ml-3 ${
      checked ? `${checkedClassName} border-transparent` : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
    }`}
  >
    {checked ? <Check {...ic('w-3 h-3 text-white', 3)} /> : null}
  </Btn>
);

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500';
const LABEL_CLS = 'text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

// Inline quick cutoff presets on the card (day, due day, label)
const INLINE_CUTOFF_PRESETS: { day: number; due: number; label: string }[] = [
  { day: 1, due: 11, label: "🗓️ Ayın 1'i (İlk Hafta Başı)" },
  { day: 5, due: 15, label: "🗓️ Ayın 5'i (İlk Hafta)" },
  { day: 7, due: 17, label: "🗓️ Ayın 7'si (İlk Hafta Sonu)" },
  { day: 15, due: 25, label: "🗓️ Ayın 15'i (Ay Ortası / Maaş)" },
  { day: 20, due: 30, label: "🗓️ Ayın 20'si (Son Hafta Başı)" },
  { day: 25, due: 5, label: "🗓️ Ayın 25'i (Son Hafta)" },
  { day: 28, due: 8, label: "🗓️ Ayın 28'i (Son Hafta Sonu)" },
  { day: 30, due: 10, label: "🗓️ Ayın 30'u (Ay Sonu)" },
];

// Presets in the add / edit form
const FORM_CUTOFF_PRESETS: { day: number; label: string }[] = [
  { day: 1, label: "Ayın 1'i (İlk Hafta)" },
  { day: 5, label: "Ayın 5'i (İlk Hafta)" },
  { day: 7, label: "Ayın 7'si (İlk Hafta)" },
  { day: 15, label: "Ayın 15'i (Maaş/Orta)" },
  { day: 20, label: "Ayın 20'si (Son Hafta)" },
  { day: 25, label: "Ayın 25'i (Son Hafta)" },
  { day: 28, label: "Ayın 28'i (Son Hafta)" },
  { day: 30, label: "Ayın 30'u (Ay Sonu)" },
];

// <select> with <optgroup>s flattened (native sheet has no groups)
const CUTOFF_DAY_LABELS: Record<number, string> = {
  1: 'Her Ayın 1. Günü (Ay Başı)',
  5: 'Her Ayın 5. Günü (İlk Hafta)',
  7: 'Her Ayın 7. Günü (İlk Hafta Sonu)',
  15: 'Her Ayın 15. Günü (Ay Ortası / Maaş)',
  20: 'Her Ayın 20. Günü (Son Hafta Başı)',
  25: 'Her Ayın 25. Günü (Son Hafta)',
  28: 'Her Ayın 28. Günü (Son Hafta Sonu)',
  30: 'Her Ayın 30. Günü (Ay Sonu)',
  31: 'Her Ayın 31. Günü (Ay Sonu)',
};
const CUTOFF_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return { value: String(day), label: CUTOFF_DAY_LABELS[day] || `Her Ayın ${day}. Günü` };
});

const INVESTMENT_TYPE_OPTIONS = [
  { value: 'Döviz Hesabı (EUR)', label: 'Euro Döviz Birikim Hesabı (EUR)' },
  { value: 'Döviz Hesabı (USD)', label: 'Dolar Döviz Birikim Hesabı (USD)' },
  { value: 'Vadeli Mevduat Hesabı', label: 'Vadeli Mevduat Hesabı' },
  { value: 'Yatırım Fonu Hesabı', label: 'Yatırım Fonu Hesabı' },
  { value: 'Hisse Senedi Hesabı', label: 'Hisse Senedi Hesabı' },
  { value: 'Altın / Emtia Hesabı', label: 'Altın / Kıymetli Maden Hesabı' },
  { value: 'Özel Yatırım & Birikim', label: 'Özel Yatırım & Birikim Hesabı' },
];

const SPEND_CATEGORY_OPTIONS = [
  'Restoran & Yemek',
  'Süpermarket & Gıda',
  'Kahve & İçecek',
  'Ulaşım & Yakıt',
  'Giyim & Alışveriş',
  'Diğer',
].map((c) => ({ value: c, label: c }));

const SCOPE_OPTIONS = [
  { value: 'ALL', label: 'Tüm Sahiplikler' },
  { value: 'PERSONAL', label: 'Sadece Kişisel' },
  { value: 'SHARED', label: 'Aile / Ortak' },
];

export const CardsView: React.FC<CardsViewProps> = ({ onAddExpenseWithCard: _onAddExpenseWithCard, onTransferToSavings }) => {
  const {
    paymentCards: allCards,
    currentUser,
    addPaymentCard,
    updatePaymentCard,
    deletePaymentCard,
    topUpCardBalance,
    addDirectExpense,
    exchangeRates,
    exchangeRatesDate,
    isRatesFromDb,
    isFetchingRates,
    fetchDailyExchangeRates,
  } = useAppStore();

  const accessibleCards = useMemo(() => {
    return getAccessibleCards(allCards, currentUser);
  }, [allCards, currentUser]);

  // Card filter (Tümü | Yemek Kartları | Kredi Kartları | Banka & Nakit)
  const [filterType, setFilterType] = useState<'ALL' | 'FOOD_CARD' | 'CREDIT_CARD' | 'BANK_AND_CASH'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'PERSONAL' | 'SHARED'>('ALL');

  // Modals state
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<PaymentCard | null>(null);
  const [selectedCardForTopUp, setSelectedCardForTopUp] = useState<PaymentCard | null>(null);
  const [selectedCardForSpend, setSelectedCardForSpend] = useState<PaymentCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<PaymentCard | null>(null);

  // Top Up Form State
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpDate, setTopUpDate] = useState(new Date().toISOString().split('T')[0]);

  // Spend Form State
  const [spendAmount, setSpendAmount] = useState('');
  const [spendTitle, setSpendTitle] = useState('');
  const [spendCategory, setSpendCategory] = useState('Restoran & Yemek');
  const [spendNote, setSpendNote] = useState('');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().split('T')[0]);

  // Add / Edit Card Form State
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<PaymentCardType>('FOOD_CARD');
  const [cardProvider, setCardProvider] = useState('Sodexo');
  const [cardLast4, setCardLast4] = useState('');
  const [cardColor, setCardColor] = useState('#0284c7');
  const [cardBalance, setCardBalance] = useState('');
  const [cardMonthlyAllowance, setCardMonthlyAllowance] = useState('');
  const [cardCreditLimit, setCardCreditLimit] = useState('');
  const [cardCurrentDebt, setCardCurrentDebt] = useState('');
  const [cardCutoffDay, setCardCutoffDay] = useState('');
  const [cardDueDay, setCardDueDay] = useState('');
  const [cardIsShared, setCardIsShared] = useState(true);
  const [cardExcludeFromReports, setCardExcludeFromReports] = useState(false);
  const [cardCurrency, setCardCurrency] = useState('TRY');
  const [cardIsInvestmentAccount, setCardIsInvestmentAccount] = useState(false);
  const [cardInvestmentType, setCardInvestmentType] = useState('Döviz Hesabı (EUR)');

  // Quick Cutoff Changing State & Feedback
  const [quickCutoffCardId, setQuickCutoffCardId] = useState<string | null>(null);

  const handleApplyCutoffDay = (cardId: string, cutoffDay: number, customDueDay?: number) => {
    const calculatedDue = customDueDay || (cutoffDay <= 20 ? cutoffDay + 10 : (cutoffDay - 20 <= 0 ? 1 : cutoffDay - 20));
    updatePaymentCard(cardId, {
      cutoffDay,
      dueDay: calculatedDue,
    });
    showToast(`Hesap kesim günü her ayın ${cutoffDay}. günü olarak güncellendi (Son Ödeme: ${calculatedDue}. gün)`, 'success', 4000);
    setQuickCutoffCardId(null);
  };

  const handleSelectCutoffPreset = (day: number) => {
    setCardCutoffDay(day.toString());
    const calculatedDue = day <= 20 ? day + 10 : (day - 20 <= 0 ? 1 : day - 20);
    setCardDueDay(calculatedDue.toString());
  };

  // Preset Providers for Quick Selection
  const FOOD_CARD_PRESETS = [
    { name: 'Sodexo / Pluxee', provider: 'Sodexo', color: '#0284c7', icon: 'Utensils' },
    { name: 'Multinet', provider: 'Multinet', color: '#f59e0b', icon: 'Utensils' },
    { name: 'Ticket Restaurant (Edenred)', provider: 'Ticket', color: '#ef4444', icon: 'Utensils' },
    { name: 'Metropol Card', provider: 'Metropol', color: '#10b981', icon: 'Utensils' },
    { name: 'Setcard', provider: 'Setcard', color: '#8b5cf6', icon: 'Utensils' },
  ];

  const BANK_PRESETS = [
    { name: 'Garanti BBVA', color: '#059669' },
    { name: 'İş Bankası', color: '#1d4ed8' },
    { name: 'Yapı Kredi', color: '#0284c7' },
    { name: 'Akbank', color: '#dc2626' },
    { name: 'QNB Finansbank', color: '#4338ca' },
    { name: 'Ziraat Bankası', color: '#b91c1c' },
    { name: 'Papara / Tosla', color: '#ec4899' },
  ];

  // <input type="color"> replacement: swatch palette built from the preset colors
  const COLOR_SWATCHES = useMemo(() => {
    const colors = [
      '#0284c7',
      '#6366f1',
      '#10b981',
      '#0d9488',
      ...FOOD_CARD_PRESETS.map((p) => p.color),
      ...BANK_PRESETS.map((p) => p.color),
      '#0f172a',
    ];
    return Array.from(new Set(colors));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered Cards - User explicitly requested: "kredi kartları üste gelsin"
  const filteredCards = useMemo(() => {
    const list = accessibleCards.filter((card) => {
      // Type filter
      if (filterType === 'FOOD_CARD' && card.type !== 'FOOD_CARD') return false;
      if (filterType === 'CREDIT_CARD' && card.type !== 'CREDIT_CARD') return false;
      if (filterType === 'BANK_AND_CASH' && card.type !== 'DEBIT_CARD' && card.type !== 'CASH_WALLET' && card.type !== 'PREPAID_CARD') return false;

      // Scope filter
      if (scopeFilter === 'PERSONAL' && card.isShared === true) return false;
      if (scopeFilter === 'SHARED' && card.isShared !== true) return false;

      return true;
    });

    // Credit cards are sorted to the top!
    return [...list].sort((a, b) => {
      if (a.type === 'CREDIT_CARD' && b.type !== 'CREDIT_CARD') return -1;
      if (a.type !== 'CREDIT_CARD' && b.type === 'CREDIT_CARD') return 1;
      return 0;
    });
  }, [accessibleCards, filterType, scopeFilter]);

  // Aggregate Metrics
  const foodCards = useMemo(() => accessibleCards.filter((c) => c.type === 'FOOD_CARD'), [accessibleCards]);
  const creditCards = useMemo(() => accessibleCards.filter((c) => c.type === 'CREDIT_CARD'), [accessibleCards]);
  const bankAndCashCards = useMemo(() => accessibleCards.filter((c) => c.type === 'DEBIT_CARD' || c.type === 'CASH_WALLET' || c.type === 'PREPAID_CARD'), [accessibleCards]);

  const totalFoodBalance = useMemo(() => foodCards.reduce((sum, c) => sum + (c.balance || 0), 0), [foodCards]);
  const totalFoodAllowance = useMemo(() => foodCards.reduce((sum, c) => sum + (c.monthlyAllowance || 0), 0), [foodCards]);
  const totalLiquidBalance = useMemo(() => {
    return bankAndCashCards.reduce((sum, c) => sum + convertCurrencyToTRY(c.balance || 0, c.currency, exchangeRates), 0);
  }, [bankAndCashCards, exchangeRates]);
  const totalCreditDebt = useMemo(() => creditCards.reduce((sum, c) => sum + (c.currentDebt || 0), 0), [creditCards]);
  const totalCreditLimit = useMemo(() => creditCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0), [creditCards]);

  // Doğrudan Yatırım Hesabı olarak tanımlı kartlar
  const investmentCards = useMemo(() => accessibleCards.filter((c) => c.isInvestmentAccount), [accessibleCards]);
  const totalInvestmentBalance = useMemo(() => {
    return investmentCards.reduce((sum, c) => sum + convertCurrencyToTRY(c.balance || 0, c.currency, exchangeRates), 0);
  }, [investmentCards, exchangeRates]);

  // Reset Add Form
  const resetForm = () => {
    setCardName('');
    setCardType('FOOD_CARD');
    setCardProvider('Sodexo');
    setCardLast4('');
    setCardColor('#0284c7');
    setCardBalance('');
    setCardMonthlyAllowance('');
    setCardCreditLimit('');
    setCardCurrentDebt('');
    setCardCutoffDay('');
    setCardDueDay('');
    setCardIsShared(true);
    setCardExcludeFromReports(false);
    setCardCurrency('TRY');
    setCardIsInvestmentAccount(false);
    setCardInvestmentType('Döviz Hesabı (EUR)');
    setEditingCard(null);
  };

  const openAddModal = (presetType: PaymentCardType = 'FOOD_CARD') => {
    resetForm();
    setCardType(presetType);
    if (presetType === 'FOOD_CARD') {
      setCardName('Sodexo / Pluxee Yemek Kartı');
      setCardProvider('Sodexo');
      setCardColor('#0284c7');
      setCardCurrency('TRY');
    } else if (presetType === 'CREDIT_CARD') {
      setCardName('Kredi Kartım');
      setCardProvider('Garanti BBVA');
      setCardColor('#6366f1');
      setCardCurrency('TRY');
    } else if (presetType === 'CASH_WALLET') {
      setCardName('Nakit Para Cüzdanım');
      setCardProvider('Nakit');
      setCardColor('#0d9488');
      setCardCurrency('TRY');
    } else {
      setCardName('Banka Kartım');
      setCardProvider('İş Bankası');
      setCardColor('#10b981');
      setCardCurrency('TRY');
    }
    setIsAddCardOpen(true);
  };

  const openEditModal = (card: PaymentCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardType(card.type);
    setCardProvider(card.provider || '');
    setCardLast4(card.last4 || '');
    setCardColor(card.color || '#6366f1');
    setCardBalance(card.balance !== undefined ? card.balance.toString() : '0');
    setCardMonthlyAllowance(card.monthlyAllowance ? card.monthlyAllowance.toString() : '');
    setCardCreditLimit(card.creditLimit ? card.creditLimit.toString() : '');
    setCardCurrentDebt(card.currentDebt ? card.currentDebt.toString() : '');
    setCardCutoffDay(card.cutoffDay ? card.cutoffDay.toString() : '');
    setCardDueDay(card.dueDay ? card.dueDay.toString() : '');
    setCardIsShared(card.isShared !== false);
    setCardExcludeFromReports(card.excludeFromReports || false);
    setCardCurrency(card.currency || 'TRY');
    setCardIsInvestmentAccount(card.isInvestmentAccount === true);
    setCardInvestmentType(card.investmentType || 'Döviz Hesabı (EUR)');
    setIsAddCardOpen(true);
  };

  const handleSaveCard = () => {
    if (!cardName.trim()) return;
    // Web: `required` on the balance input (food / bank / cash forms)
    if (cardType !== 'CREDIT_CARD' && cardBalance === '') return;

    if (editingCard) {
      updatePaymentCard(editingCard.id, {
        name: cardName.trim(),
        type: cardType,
        provider: cardProvider.trim() || undefined,
        last4: cardLast4.trim() || undefined,
        color: cardColor,
        balance: Number(cardBalance) || 0,
        monthlyAllowance: Number(cardMonthlyAllowance) || 0,
        creditLimit: Number(cardCreditLimit) || 0,
        currentDebt: Number(cardCurrentDebt) || 0,
        cutoffDay: cardCutoffDay ? Number(cardCutoffDay) : undefined,
        dueDay: cardDueDay ? Number(cardDueDay) : undefined,
        isShared: cardIsShared,
        excludeFromReports: cardExcludeFromReports,
        currency: cardCurrency,
        isInvestmentAccount: cardIsInvestmentAccount,
        investmentType: cardIsInvestmentAccount ? cardInvestmentType : undefined,
      });
    } else {
      addPaymentCard({
        userId: currentUser.id || 'u1',
        name: cardName.trim(),
        type: cardType,
        provider: cardProvider.trim() || undefined,
        last4: cardLast4.trim() || undefined,
        color: cardColor,
        balance: Number(cardBalance) || 0,
        initialBalance: Number(cardBalance) || 0,
        monthlyAllowance: Number(cardMonthlyAllowance) || 0,
        creditLimit: Number(cardCreditLimit) || 0,
        currentDebt: Number(cardCurrentDebt) || 0,
        cutoffDay: cardCutoffDay ? Number(cardCutoffDay) : undefined,
        dueDay: cardDueDay ? Number(cardDueDay) : undefined,
        isShared: cardIsShared,
        excludeFromReports: cardExcludeFromReports,
        currency: cardCurrency,
        isInvestmentAccount: cardIsInvestmentAccount,
        investmentType: cardIsInvestmentAccount ? cardInvestmentType : undefined,
        icon: cardType === 'FOOD_CARD' ? 'Utensils' : cardType === 'CREDIT_CARD' ? 'CreditCard' : cardType === 'CASH_WALLET' ? 'Wallet' : 'Building2',
      });
    }

    setIsAddCardOpen(false);
    resetForm();
  };

  // Top Up Action Handler
  const handleTopUpSubmit = () => {
    if (!selectedCardForTopUp) return;
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) return;

    topUpCardBalance(selectedCardForTopUp.id, amt, topUpNote.trim() || undefined);
    setSelectedCardForTopUp(null);
    setTopUpAmount('');
    setTopUpNote('');
  };

  // Direct Spend Action Handler
  const handleSpendSubmit = () => {
    if (!selectedCardForSpend) return;
    // Web: `required` on the title input
    if (!spendTitle) return;
    const amt = parseFloat(spendAmount);
    if (isNaN(amt) || amt <= 0) return;

    // Single source of truth: addDirectExpense logs the expense AND records the card transaction & balance/debt
    addDirectExpense({
      userId: currentUser.id,
      familyId: currentUser.familyId,
      isShared: selectedCardForSpend.isShared !== false,
      amount: amt,
      categoryName: spendCategory,
      date: spendDate,
      itemCount: 1,
      itemsSummary: [spendTitle.trim() || (selectedCardForSpend.type === 'FOOD_CARD' ? 'Yemek Harcaması' : 'Kart Harcaması')],
      type: 'DIRECT_EXPENSE',
      paymentMethod: selectedCardForSpend.type === 'FOOD_CARD' ? 'Yemek Kartı' : selectedCardForSpend.name,
      cardId: selectedCardForSpend.id,
      cardName: selectedCardForSpend.name,
      cardType: selectedCardForSpend.type,
      note: spendNote.trim() || undefined,
    });

    setSelectedCardForSpend(null);
    setSpendAmount('');
    setSpendTitle('');
    setSpendNote('');
  };

  const filterTabCls = (active: boolean, activeCls: string) =>
    `px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 ${active ? `${activeCls} shadow-xs` : ''}`;
  const filterTabTextCls = (active: boolean, activeTextCls: string) =>
    `text-xs font-semibold ${active ? activeTextCls : 'text-slate-600 dark:text-slate-400'}`;

  return (
    <View nativeID="cards-view-root" style={tw`gap-6`}>
      {/* Günlük Otomatik Kur Çekim & DB Önbellek Bandı */}
      <Gradient
        dir="r"
        colors={['slate-900', 'indigo-950', 'slate-900']}
        className="p-4 rounded-2xl border border-indigo-500/30 shadow-sm flex-col items-start justify-between gap-3"
      >
        <View style={tw`flex-row items-center gap-3`}>
          <View style={tw`w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0`}>
            <Text className="text-xl text-white">💶</Text>
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center gap-2 flex-wrap`}>
              <Text className="text-xs font-bold tracking-wide uppercase text-indigo-200">
                Günlük Döviz Kurları (Günde 1 Kez Çekilir & DB'den Kullanılır)
              </Text>
              <View
                style={tw.style(
                  'px-2 py-0.5 rounded-full border',
                  isRatesFromDb ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-sky-500/20 border-sky-500/40',
                )}
              >
                <Text className={`text-[10px] font-semibold ${isRatesFromDb ? 'text-emerald-300' : 'text-sky-300'}`}>
                  {isRatesFromDb ? '✓ DB Günlük Önbellek' : '🌐 Açık API (Yeni Çekildi)'}
                </Text>
              </View>
            </View>
            <View style={tw`flex-row flex-wrap items-center gap-x-4 gap-y-1 mt-1`}>
              <View style={tw`flex-row items-center gap-1`}>
                <Text className="text-sm font-semibold text-indigo-300">1 EUR (€):</Text>
                <Text className="text-sm text-white font-black">{(exchangeRates.EUR || 37.80).toFixed(2)} ₺</Text>
              </View>
              <View style={tw`flex-row items-center gap-1`}>
                <Text className="text-sm font-semibold text-indigo-300">1 USD ($):</Text>
                <Text className="text-sm text-white font-black">{(exchangeRates.USD || 34.25).toFixed(2)} ₺</Text>
              </View>
              <View style={tw`flex-row items-center gap-1`}>
                <Text className="text-sm font-semibold text-indigo-300">1 GBP (£):</Text>
                <Text className="text-sm text-white font-black">{(exchangeRates.GBP || 44.90).toFixed(2)} ₺</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-2 self-end`}>
          <Text className="text-[11px] text-indigo-300/80 hidden sm:flex">
            {exchangeRatesDate ? `Tarih: ${exchangeRatesDate}` : 'Bugün güncellendi'}
          </Text>
          <Btn
            onPress={() => fetchDailyExchangeRates(true)}
            disabled={isFetchingRates}
            accessibilityLabel="Döviz kurunu açık API'den zorla yeniden çek ve DB'ye kaydet"
            className="px-3 py-1.5 rounded-xl bg-white/10 flex-row items-center gap-1.5"
          >
            <RefreshCw {...ic('w-3.5 h-3.5 text-white')} />
            <Text className="text-xs text-white font-medium">{isFetchingRates ? 'Çekiliyor...' : 'Kuru Yenile'}</Text>
          </Btn>
        </View>
      </Gradient>

      {/* Top Banner & Overview Metrics - Credit Cards first as requested */}
      <View nativeID="cards-overview-cards" style={tw`gap-4`}>
        {/* 1. Credit Cards Summary (Prioritized) */}
        <View
          nativeID="metric-credit-cards"
          style={tw`bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl p-5 shadow-xs relative overflow-hidden`}
        >
          <View pointerEvents="none" style={tw`absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-4 -mt-4`} />
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center`}>
                <CreditCard {...ic('w-5 h-5 text-indigo-600 dark:text-indigo-400')} />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Kredi Kartları</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{creditCards.length} Kart</Text>
              </View>
            </View>
            <Btn
              onPress={() => openAddModal('CREDIT_CARD')}
              className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex-row items-center gap-1"
            >
              <Plus {...ic('w-4 h-4 text-indigo-700 dark:text-indigo-300')} />
              <Text className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Ekle</Text>
            </Btn>
          </View>

          <View style={tw`gap-1`}>
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalCreditDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
              <Text className="text-sm font-semibold text-slate-500">₺ Borç</Text>
            </Text>
            <View style={tw`flex-row items-center justify-between pt-1 border-t border-indigo-100 dark:border-indigo-950/60`}>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Toplam Limit: {totalCreditLimit.toLocaleString('tr-TR')} ₺</Text>
              <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Kalan: {Math.max(0, totalCreditLimit - totalCreditDebt).toLocaleString('tr-TR')} ₺
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Liquid Bank Accounts & Cash Wallets */}
        <View
          nativeID="metric-liquid-accounts"
          style={tw`bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-5 shadow-xs relative overflow-hidden`}
        >
          <View pointerEvents="none" style={tw`absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-4 -mt-4`} />
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center`}>
                <Wallet {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-400')} />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Vadesiz & Cüzdan</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{bankAndCashCards.length} Hesap / Cüzdan</Text>
              </View>
            </View>
            <Btn
              onPress={() => openAddModal('DEBIT_CARD')}
              className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex-row items-center gap-1"
            >
              <Plus {...ic('w-4 h-4 text-emerald-700 dark:text-emerald-300')} />
              <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ekle</Text>
            </Btn>
          </View>

          <View style={tw`gap-1`}>
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalLiquidBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
              <Text className="text-sm font-semibold text-slate-500">₺</Text>
            </Text>
            <View style={tw`flex-row items-center justify-between pt-1 border-t border-emerald-100 dark:border-emerald-950/60`}>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Kullanılabilir Likit (TL Karşılığı)</Text>
              <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Likidite Aktif</Text>
            </View>
          </View>
        </View>

        {/* 3. Yatırım & Döviz Hesapları Metric (Eğer tanımlıysa) */}
        {investmentCards.length > 0 && (
          <View
            nativeID="metric-investment-accounts"
            style={tw`bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-5 shadow-xs relative overflow-hidden`}
          >
            <View pointerEvents="none" style={tw`absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-4 -mt-4`} />
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center gap-2.5`}>
                <View style={tw`w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center`}>
                  <TrendingUp {...ic('w-5 h-5 text-amber-600 dark:text-amber-400')} />
                </View>
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Yatırım Kartları</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{investmentCards.length} Yatırım Hesabı</Text>
                </View>
              </View>
            </View>

            <View style={tw`gap-1`}>
              <Text className="text-2xl font-bold text-amber-900 dark:text-amber-200 tracking-tight">
                {totalInvestmentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                <Text className="text-sm font-semibold text-slate-500">₺</Text>
              </Text>
              <View style={tw`flex-row items-center justify-between pt-1 border-t border-amber-100 dark:border-amber-950/60`}>
                <Text className="text-xs text-slate-500 dark:text-slate-400">Döviz & Vadeli Birikim</Text>
                <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium">Güncel Kur</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. Food Cards (Yemek Kartları) Metric */}
        <View
          nativeID="metric-food-cards"
          style={tw`bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900/40 rounded-2xl p-5 shadow-xs relative overflow-hidden`}
        >
          <View pointerEvents="none" style={tw`absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full -mr-4 -mt-4`} />
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-10 h-10 rounded-xl bg-teal-500/10 items-center justify-center`}>
                <Utensils {...ic('w-5 h-5 text-teal-600 dark:text-teal-400')} />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Yemek Kartları</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{foodCards.length} Kart Tanımlı</Text>
              </View>
            </View>
            <Btn
              onPress={() => openAddModal('FOOD_CARD')}
              accessibilityLabel="Yemek Kartı Ekle"
              className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950/60 flex-row items-center gap-1"
            >
              <Plus {...ic('w-4 h-4 text-teal-700 dark:text-teal-300')} />
              <Text className="text-xs font-medium text-teal-700 dark:text-teal-300">Ekle</Text>
            </Btn>
          </View>

          <View style={tw`gap-1`}>
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalFoodBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
              <Text className="text-sm font-semibold text-slate-500">₺</Text>
            </Text>
            <View style={tw`flex-row items-center justify-between pt-1 border-t border-teal-100 dark:border-teal-950/60`}>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Toplam Bakiye</Text>
              {totalFoodAllowance > 0 && (
                <Text className="text-xs text-teal-600 dark:text-teal-400 font-medium">Aylık Hak: {totalFoodAllowance.toLocaleString('tr-TR')} ₺</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Control Bar: Filters & Add Action */}
      <View
        nativeID="cards-control-bar"
        style={tw`flex-row flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs`}
      >
        {/* Category Type Filter Tabs - Credit cards prioritized */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`max-w-full`}
          contentContainerStyle={tw`flex-row items-center gap-1.5 pb-1`}
        >
          <Btn onPress={() => setFilterType('ALL')} className={filterTabCls(filterType === 'ALL', 'bg-slate-900 dark:bg-slate-100')}>
            <Text className={filterTabTextCls(filterType === 'ALL', 'text-white dark:text-slate-900')}>
              Tüm Kartlar ({accessibleCards.length})
            </Text>
          </Btn>
          <Btn onPress={() => setFilterType('CREDIT_CARD')} className={filterTabCls(filterType === 'CREDIT_CARD', 'bg-indigo-600')}>
            <CreditCard {...ic(`w-3.5 h-3.5 ${filterType === 'CREDIT_CARD' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`)} />
            <Text className={filterTabTextCls(filterType === 'CREDIT_CARD', 'text-white')}>Kredi Kartları ({creditCards.length})</Text>
          </Btn>
          <Btn onPress={() => setFilterType('FOOD_CARD')} className={filterTabCls(filterType === 'FOOD_CARD', 'bg-amber-600')}>
            <Utensils {...ic(`w-3.5 h-3.5 ${filterType === 'FOOD_CARD' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`)} />
            <Text className={filterTabTextCls(filterType === 'FOOD_CARD', 'text-white')}>Yemek Kartları ({foodCards.length})</Text>
          </Btn>
          <Btn onPress={() => setFilterType('BANK_AND_CASH')} className={filterTabCls(filterType === 'BANK_AND_CASH', 'bg-emerald-600')}>
            <Wallet {...ic(`w-3.5 h-3.5 ${filterType === 'BANK_AND_CASH' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`)} />
            <Text className={filterTabTextCls(filterType === 'BANK_AND_CASH', 'text-white')}>Banka & Nakit ({bankAndCashCards.length})</Text>
          </Btn>
        </ScrollView>

        {/* Right side: Scope filter & Add button */}
        <View style={tw`flex-row items-center gap-2 ml-auto`}>
          <Select
            value={scopeFilter}
            onChange={(v) => setScopeFilter(v as 'ALL' | 'PERSONAL' | 'SHARED')}
            options={SCOPE_OPTIONS}
            title="Kart görünürlük filtresi"
            className="w-36 gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
            textClassName="text-xs text-slate-700 dark:text-slate-300 font-medium"
          />

          <Btn
            onPress={() => openAddModal('FOOD_CARD')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 flex-row items-center gap-1.5 shadow-xs"
          >
            <Plus {...ic('w-4 h-4 text-white')} />
            <Text className="text-white text-xs font-semibold">Yeni Kart Ekle</Text>
          </Btn>
        </View>
      </View>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <View style={tw`items-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8`}>
          <View style={tw`w-14 h-14 self-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 items-center justify-center mb-3`}>
            <Utensils {...ic('w-7 h-7 text-amber-600')} />
          </View>
          <Text className="text-center text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Henüz kart eklenmemiş</Text>
          <Text className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-md self-center mb-4">
            Yemek kartlarınızı (Sodexo, Multinet vb.), kredi ve banka kartlarınızı ekleyerek harcamalarınızı kaynağına göre takip edin.
          </Text>
          <View style={tw`flex-row justify-center gap-2`}>
            <Btn
              onPress={() => openAddModal('FOOD_CARD')}
              className="px-4 py-2 bg-amber-600 rounded-xl shadow-xs flex-row items-center gap-1.5"
            >
              <Utensils {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-xs font-semibold">Yemek Kartı Ekle</Text>
            </Btn>
            <Btn
              onPress={() => openAddModal('CREDIT_CARD')}
              className="px-4 py-2 bg-indigo-600 rounded-xl shadow-xs flex-row items-center gap-1.5"
            >
              <CreditCard {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-xs font-semibold">Kredi Kartı Ekle</Text>
            </Btn>
          </View>
        </View>
      ) : (
        <View nativeID="cards-list-grid" style={tw`gap-5`}>
          {filteredCards.map((card) => {
            const isFood = card.type === 'FOOD_CARD';
            const isCredit = card.type === 'CREDIT_CARD';
            const isCash = card.type === 'CASH_WALLET';
            const txCount = (card.transactions || []).length;

            const billingCycles = isCredit ? getCreditCardBillingCycles(card.cutoffDay, card.dueDay) : [];
            const activeCycleId = card.activeBillingCycle || 'CURRENT';
            const currentCycle = billingCycles.find((c) => c.id === activeCycleId) || billingCycles.find((c) => c.id === 'CURRENT') || billingCycles[0];
            const cycleSpends = (card.transactions || []).filter(
              (t) => t.type === 'SPEND' && currentCycle && isDateInCycle(t.date, currentCycle.startDate, currentCycle.endDate)
            );
            const cycleSpendTotal = cycleSpends.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            const allSpends = (card.transactions || []).filter((t) => t.type === 'SPEND');
            const allSpendTotal = allSpends.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const allTopUps = (card.transactions || []).filter((t) => t.type === 'TOP_UP');
            const allTopUpTotal = allTopUps.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const netSpendDebt = Math.max(0, allSpendTotal - allTopUpTotal);
            const effectiveTotalDebt = card.currentDebt !== undefined && card.currentDebt !== null ? Number(card.currentDebt) : netSpendDebt;

            const skinColor = card.color || '#6366f1';
            // web: linear-gradient(135deg, color 0%, #1e1b4b 130%) → end stop at 100/130
            const skinEnd = mixHex(skinColor, '#1e1b4b', 100 / 130);

            return (
              <View
                key={card.id}
                style={tw`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex-col justify-between`}
              >
                {/* Top Card Visual / Skin */}
                <Gradient dir="br" colors={[skinColor, skinEnd]} className="p-5 relative overflow-hidden">
                  {/* Subtle Background Accent Pattern */}
                  <View pointerEvents="none" style={tw`absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10`} />
                  <View pointerEvents="none" style={tw`absolute right-4 top-4 opacity-20`}>
                    {isFood ? (
                      <Utensils {...ic('w-16 h-16 text-white')} />
                    ) : isCredit ? (
                      <CreditCard {...ic('w-16 h-16 text-white')} />
                    ) : isCash ? (
                      <Wallet {...ic('w-16 h-16 text-white')} />
                    ) : (
                      <Building2 {...ic('w-16 h-16 text-white')} />
                    )}
                  </View>

                  <View style={tw`relative z-10`}>
                    {/* Top Row: Provider / Type Badge & Scope */}
                    <View style={tw`flex-row items-center justify-between mb-4`}>
                      <View style={tw`flex-row items-center gap-1.5 flex-shrink`}>
                        <View style={tw`px-2.5 py-0.5 rounded-full bg-white/20`}>
                          <Text className="text-[11px] font-bold text-white tracking-wider uppercase">
                            {isFood ? 'YEMEK KARTI' : isCredit ? 'KREDİ KARTI' : isCash ? 'NAKİT CÜZDAN' : 'BANKA KARTI'}
                          </Text>
                        </View>
                        {card.provider ? (
                          <Text className="text-xs font-semibold text-white/90 flex-shrink" numberOfLines={1}>
                            {card.provider}
                          </Text>
                        ) : null}
                      </View>

                      <View style={tw`flex-row items-center gap-1`}>
                        {card.isInvestmentAccount && (
                          <View
                            accessibilityLabel={card.investmentType || 'Yatırım Hesabı'}
                            style={tw`flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 shadow-xs`}
                          >
                            <TrendingUp {...ic('w-3 h-3 text-amber-950')} />
                            <Text className="text-[10px] text-amber-950 font-bold tracking-wide">YATIRIM</Text>
                          </View>
                        )}
                        {card.excludeFromReports && (
                          <View
                            accessibilityLabel="Bu kart finans raporlarına dahil edilmiyor"
                            style={tw`flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/80`}
                          >
                            <Text className="text-[10px] text-white font-semibold">🚫 Rapordan Hariç</Text>
                          </View>
                        )}
                        {card.isShared ? (
                          <View accessibilityLabel="Aileyle Ortak" style={tw`flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-white/15`}>
                            <Users {...ic('w-3 h-3 text-white/90')} />
                            <Text className="text-[10px] text-white/90">Ortak</Text>
                          </View>
                        ) : (
                          <View accessibilityLabel="Kişisel Kart" style={tw`flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-black/20`}>
                            <User {...ic('w-3 h-3 text-white/80')} />
                            <Text className="text-[10px] text-white/80">Kişisel</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Card Name & Last4 */}
                    <View style={tw`mb-4`}>
                      <Text className="text-lg font-bold text-white tracking-wide" numberOfLines={1}>
                        {card.name}
                      </Text>
                      {card.last4 ? (
                        <Text className="text-xs font-mono text-white/75 tracking-widest mt-0.5">•••• •••• •••• {card.last4}</Text>
                      ) : null}
                    </View>

                    {/* Balance / Debt Display */}
                    <View style={tw`pt-2 border-t border-white/15 flex-row items-end justify-between`}>
                      <View style={tw`flex-1`}>
                        <Text className="text-[11px] uppercase tracking-wider text-white/75">
                          {isCredit
                            ? (currentCycle?.id === 'CURRENT' ? 'Güncel Dönem Borcu' : `${currentCycle?.label?.split(' ')[0] || 'Dönem'} Borcu`)
                            : card.isInvestmentAccount
                            ? (card.investmentType || 'Yatırım / Birikim Bakiyesi')
                            : 'Kullanılabilir Bakiye'}
                        </Text>
                        <View style={tw`mt-0.5 flex-row items-baseline gap-2`}>
                          <Text className="text-2xl font-black tracking-tight text-white">
                            {formatCurrencyWithSymbol(
                              isCredit ? cycleSpendTotal : (card.balance || 0),
                              card.currency || 'TRY'
                            )}
                          </Text>
                          {isCredit && cycleSpends.length > 0 && (
                            <Text className="text-xs text-white/75 font-normal">({cycleSpends.length} harcama)</Text>
                          )}
                        </View>
                        {isCredit && (
                          <View style={tw`mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-0.5`}>
                            <Text className="text-xs text-white/80 font-medium">
                              Toplam Borç:{' '}
                              <Text className="text-xs text-white font-bold">{formatCurrencyWithSymbol(effectiveTotalDebt, card.currency || 'TRY')}</Text>
                            </Text>
                            {card.creditLimit && card.creditLimit > 0 ? (
                              <Text className="text-xs text-white/80 font-medium">
                                Kalan Limit:{' '}
                                <Text className="text-xs text-emerald-300 font-bold">
                                  {formatCurrencyWithSymbol(Math.max(0, card.creditLimit - effectiveTotalDebt), card.currency || 'TRY')}
                                </Text>
                              </Text>
                            ) : null}
                          </View>
                        )}
                        {card.currency && card.currency !== 'TRY' ? (
                          <View style={tw`mt-0.5 flex-row flex-wrap items-center gap-1`}>
                            <Text className="text-xs font-semibold text-emerald-300">
                              ≈ {convertCurrencyToTRY(isCredit ? effectiveTotalDebt : (card.balance || 0), card.currency, exchangeRates).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </Text>
                            <Text className="text-[10px] text-white/75 font-normal">
                              (1 {getCurrencySymbol(card.currency)} = {getCurrencyRateInTRY(card.currency, exchangeRates).toFixed(2)} ₺)
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Extra context badge (Monthly allowance / Credit limit) */}
                      {isFood && !!card.monthlyAllowance && card.monthlyAllowance > 0 && (
                        <View style={tw`items-end`}>
                          <Text className="text-[10px] uppercase text-white/70">Aylık Hak</Text>
                          <Text className="text-xs font-bold text-white/90">{card.monthlyAllowance.toLocaleString('tr-TR')} ₺</Text>
                        </View>
                      )}

                      {isCredit && !!card.creditLimit && card.creditLimit > 0 && (
                        <View style={tw`items-end pl-2`}>
                          <Text className="text-[10px] uppercase text-white/70">Limit</Text>
                          <Text className="text-xs font-bold text-white/90">{card.creditLimit.toLocaleString('tr-TR')} ₺</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Gradient>

                {/* Card Body & Quick Operations */}
                <View style={tw`p-4 gap-3 bg-slate-50/50 dark:bg-slate-900/50 flex-1 flex-col justify-between`}>
                  {/* Additional info pills */}
                  <View style={tw`gap-2`}>
                    {card.isInvestmentAccount && (
                      <View style={tw`bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center gap-1.5 flex-shrink`}>
                          <TrendingUp {...ic('w-3.5 h-3.5 text-amber-600 dark:text-amber-400')} />
                          <Text className="text-xs font-bold text-amber-900 dark:text-amber-200 flex-shrink">
                            {card.investmentType || 'Döviz Birikim Hesabı'}
                          </Text>
                        </View>
                        <View style={tw`bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md`}>
                          <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">Varlıklar & Birikimlerde</Text>
                        </View>
                      </View>
                    )}
                    {isCredit && (
                      <View style={tw`bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 gap-2`}>
                        <View style={tw`flex-row items-center justify-between gap-2`}>
                          <View style={tw`flex-row items-center gap-1`}>
                            <Calendar {...ic('w-3 h-3 text-indigo-600 dark:text-indigo-400')} />
                            <Text className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Ekstre Dönemi</Text>
                          </View>
                          <Select
                            value={activeCycleId}
                            onChange={(v) => updatePaymentCard(card.id, { activeBillingCycle: v })}
                            options={billingCycles.map((cycle) => ({
                              value: cycle.id,
                              label: `${cycle.label} (${cycle.shortLabel})`,
                            }))}
                            title="Ekstre Dönemi"
                            className="flex-1 gap-1 bg-indigo-50 dark:bg-slate-700 rounded-lg px-2 py-1 border border-indigo-200 dark:border-indigo-800"
                            textClassName="text-[11px] text-indigo-900 dark:text-indigo-200 font-semibold"
                          />
                        </View>
                        <View style={tw`flex-row items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700`}>
                          <Text className="text-xs text-slate-600 dark:text-slate-300">Dönem Harcaması:</Text>
                          <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {cycleSpendTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            <Text className="text-[10px] text-slate-400 font-normal"> ({cycleSpends.length} işlem)</Text>
                          </Text>
                        </View>
                      </View>
                    )}

                    <Grid cols={2} gap={2}>
                      {isCredit
                        ? [
                            <View
                              key="cutoff"
                              style={tw`bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}
                            >
                              <View style={tw`flex-row items-center justify-between`}>
                                <Text className="text-[10px] text-slate-400">Hesap Kesim</Text>
                                <Btn
                                  onPress={() => setQuickCutoffCardId(quickCutoffCardId === card.id ? null : card.id)}
                                  accessibilityLabel="Kesim gününü değiştir"
                                  hitSlop={6}
                                  className="flex-row items-center gap-0.5"
                                >
                                  <Edit2 {...ic('w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400')} />
                                  <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Değiştir</Text>
                                </Btn>
                              </View>
                              <Text className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                                Her Ayın {card.cutoffDay || '15'}. Günü
                              </Text>
                            </View>,
                            <View
                              key="due"
                              style={tw`bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}
                            >
                              <Text className="text-[10px] text-slate-400">Son Ödeme</Text>
                              <Text className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                                Her Ayın {card.dueDay || '25'}. Günü
                              </Text>
                            </View>,
                          ]
                        : [
                            <View
                              key="tx"
                              style={tw`bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}
                            >
                              <Text className="text-[10px] text-slate-400">İşlem Sayısı</Text>
                              <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">{txCount} Hareket</Text>
                            </View>,
                            <View
                              key="status"
                              style={tw`bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}
                            >
                              <Text className="text-[10px] text-slate-400">Durum</Text>
                              <View style={tw`flex-row items-center gap-1`}>
                                <CheckCircle2 {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
                                <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Aktif</Text>
                              </View>
                            </View>,
                          ]}
                    </Grid>

                    {/* INLINE QUICK CUTOFF SELECTOR */}
                    {isCredit && quickCutoffCardId === card.id && (
                      <View style={tw`bg-indigo-50/90 dark:bg-indigo-950/60 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 gap-2.5 shadow-xs`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={tw`flex-row items-center gap-1.5`}>
                            <Calendar {...ic('w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400')} />
                            <Text className="text-xs font-bold text-indigo-950 dark:text-indigo-100">Ekstre Kesim Gününü Değiştir</Text>
                          </View>
                          <Btn onPress={() => setQuickCutoffCardId(null)} className="p-1 rounded-md">
                            <X {...ic('w-3.5 h-3.5 text-slate-400')} />
                          </Btn>
                        </View>

                        {/* Presets Grid */}
                        <View style={tw`gap-1.5`}>
                          <Text className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                            Hızlı Seçim (Haftalık & Dönemsel):
                          </Text>
                          <Grid cols={2} gap={1.5}>
                            {INLINE_CUTOFF_PRESETS.map((preset) => {
                              const active =
                                preset.day === 15
                                  ? Number(card.cutoffDay) === 15 || !card.cutoffDay
                                  : Number(card.cutoffDay) === preset.day;
                              return (
                                <Btn
                                  key={preset.day}
                                  onPress={() => handleApplyCutoffDay(card.id, preset.day, preset.due)}
                                  className={`px-2 py-1.5 rounded-xl border ${
                                    active
                                      ? 'bg-indigo-600 border-indigo-600 shadow-xs'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <Text
                                    className={`text-left text-[11px] ${
                                      active ? 'text-white font-bold' : 'font-medium text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {preset.label}
                                  </Text>
                                </Btn>
                              );
                            })}
                          </Grid>
                        </View>

                        {/* Or Select Any Day */}
                        <View style={tw`pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 flex-row items-center gap-2`}>
                          <Text className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Veya Gün Seç:</Text>
                          <Select
                            value={String(card.cutoffDay || 15)}
                            onChange={(v) => handleApplyCutoffDay(card.id, Number(v))}
                            options={CUTOFF_DAY_OPTIONS}
                            title="Hesap Kesim Günü"
                            className="flex-1 gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            textClassName="text-xs font-semibold text-slate-800 dark:text-slate-200"
                          />
                        </View>
                      </View>
                    )}

                    {/* Quick Report Toggle */}
                    <View style={tw`flex-row items-center justify-between bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60`}>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400">Rapor Durumu:</Text>
                      <Btn
                        onPress={() => updatePaymentCard(card.id, { excludeFromReports: !card.excludeFromReports })}
                        accessibilityLabel="Tıklayarak finans raporlarına dahil edebilir veya hariç tutabilirsiniz"
                        className={`px-2 py-0.5 rounded-md ${
                          card.excludeFromReports ? 'bg-rose-100 dark:bg-rose-950/60' : 'bg-emerald-100 dark:bg-emerald-950/60'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            card.excludeFromReports ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {card.excludeFromReports ? '🚫 Rapordan Hariç' : '✓ Raporda Aktif'}
                        </Text>
                      </Btn>
                    </View>
                  </View>

                  {/* Primary Interactive Action Buttons */}
                  <View style={tw`flex-row items-center gap-2 pt-1`}>
                    {/* Top-up (Bakiye Yükle / Hak Ediş) */}
                    <Btn
                      onPress={() => {
                        setSelectedCardForTopUp(card);
                        setTopUpAmount(card.monthlyAllowance ? card.monthlyAllowance.toString() : '');
                        setTopUpNote(card.type === 'FOOD_CARD' ? 'Aylık Yemek Ücreti Yüklemesi' : 'Bakiye Yükleme');
                      }}
                      accessibilityLabel={isCredit ? 'Borç Öde / Limit Aç' : 'Bakiye Yükle / Hak Ediş'}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ArrowDownLeft {...ic('w-4 h-4 text-white')} />
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                        {isCredit ? 'Borç Öde' : 'Bakiye Yükle'}
                      </Text>
                    </Btn>

                    {/* Spend (Harcama Yap) */}
                    <Btn
                      onPress={() => {
                        setSelectedCardForSpend(card);
                        setSpendCategory(card.type === 'FOOD_CARD' ? 'Restoran & Yemek' : 'Süpermarket & Alışveriş');
                        setSpendTitle('');
                        setSpendAmount('');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 flex-row items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ArrowUpRight {...ic('w-4 h-4 text-white dark:text-slate-900')} />
                      <Text className="text-white dark:text-slate-900 text-xs font-semibold" numberOfLines={1}>
                        Harcama Yap
                      </Text>
                    </Btn>

                    {/* Transfer to Savings button */}
                    {onTransferToSavings && (
                      <Btn
                        onPress={() => onTransferToSavings(card.id)}
                        accessibilityLabel="Bu Karttan Birikime Aktar"
                        className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40"
                      >
                        <PiggyBank {...ic('w-4 h-4 text-amber-600 dark:text-amber-400')} />
                      </Btn>
                    )}

                    {/* History button */}
                    <Btn
                      onPress={() => setSelectedCardForHistory(card)}
                      accessibilityLabel="Kart Hareketleri"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <History {...ic('w-4 h-4 text-slate-700 dark:text-slate-300')} />
                    </Btn>

                    {/* Edit button */}
                    <Btn
                      onPress={() => openEditModal(card)}
                      accessibilityLabel="Kartı Düzenle"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <Edit2 {...ic('w-4 h-4 text-slate-700 dark:text-slate-300')} />
                    </Btn>

                    {/* Delete button */}
                    <Btn
                      onPress={() => setCardToDelete(card)}
                      accessibilityLabel="Kartı Sil"
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40"
                    >
                      <Trash2 {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
                    </Btn>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* --- MODAL 1: ADD / EDIT CARD MODAL --- */}
      {isAddCardOpen && (
        <Overlay onClose={() => setIsAddCardOpen(false)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View style={tw`flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800`}>
              <View style={tw`flex-row items-center gap-2.5 flex-1`}>
                <View style={tw`w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                  <CreditCard {...ic('w-5 h-5 text-indigo-600 dark:text-indigo-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingCard ? 'Kartı Düzenle' : 'Yeni Kart & Cüzdan Ekle'}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Yemek kartı, kredi kartı veya vadesiz hesap</Text>
                </View>
              </View>
              <Btn onPress={() => setIsAddCardOpen(false)} accessibilityLabel="Kapat" className="p-2 rounded-xl">
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              {/* 1. Kart Türü Seçimi */}
              <View>
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kart / Hesap Türü</Text>
                <Grid cols={2} gap={2}>
                  {[
                    { type: 'FOOD_CARD', label: '🍽️ Yemek Kartı', desc: 'Sodexo, Multi' },
                    { type: 'CREDIT_CARD', label: '💳 Kredi Kartı', desc: 'Bonus, World' },
                    { type: 'DEBIT_CARD', label: '🏦 Banka Hesabı', desc: 'Vadesiz' },
                    { type: 'CASH_WALLET', label: '💵 Nakit Cüzdan', desc: 'Fiziki Para' },
                  ].map((item) => {
                    const active = cardType === item.type;
                    return (
                      <Btn
                        key={item.type}
                        onPress={() => {
                          setCardType(item.type as PaymentCardType);
                          if (item.type === 'FOOD_CARD') setCardColor('#0284c7');
                          if (item.type === 'CREDIT_CARD') setCardColor('#6366f1');
                          if (item.type === 'DEBIT_CARD') setCardColor('#10b981');
                          if (item.type === 'CASH_WALLET') setCardColor('#0d9488');
                        }}
                        className={`p-2.5 rounded-xl border items-start ${
                          active
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            active ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.label}
                        </Text>
                        <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </Btn>
                    );
                  })}
                </Grid>
              </View>

              {/* Quick Presets for Food Card */}
              {cardType === 'FOOD_CARD' && (
                <View>
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Hızlı Yemek Kartı Şablonları:</Text>
                  <View style={tw`flex-row flex-wrap gap-1.5`}>
                    {FOOD_CARD_PRESETS.map((p) => (
                      <Btn
                        key={p.provider}
                        onPress={() => {
                          setCardName(p.name);
                          setCardProvider(p.provider);
                          setCardColor(p.color);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-row items-center gap-1"
                      >
                        <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: p.color }]} />
                        <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.provider}</Text>
                      </Btn>
                    ))}
                  </View>
                </View>
              )}

              {/* 2. Kart Adı & Sağlayıcı */}
              <View style={tw`gap-3`}>
                <View>
                  <Text className={LABEL_CLS}>Kart / Hesap Adı *</Text>
                  <Input value={cardName} onChangeText={setCardName} placeholder="Örn: Sodexo Yemek Kartım" className={INPUT_CLS} />
                </View>

                <View>
                  <Text className={LABEL_CLS}>Kurum / Sağlayıcı</Text>
                  <Input
                    value={cardProvider}
                    onChangeText={setCardProvider}
                    placeholder="Örn: Sodexo, Garanti, İş Bankası"
                    className={INPUT_CLS}
                  />
                </View>
              </View>

              {/* 3. Bakiye & Hak Ediş / Limit */}
              {cardType === 'FOOD_CARD' ? (
                <View style={tw`gap-3`}>
                  <View>
                    <Text className={LABEL_CLS}>Mevcut Bakiye (₺) *</Text>
                    <Input
                      keyboardType="decimal-pad"
                      value={cardBalance}
                      onChangeText={setCardBalance}
                      placeholder="Örn: 2450"
                      className={INPUT_CLS}
                    />
                  </View>
                  <View>
                    <Text className={LABEL_CLS}>Aylık Yemek Hak Edişi (₺)</Text>
                    <Input
                      keyboardType="decimal-pad"
                      value={cardMonthlyAllowance}
                      onChangeText={setCardMonthlyAllowance}
                      placeholder="Örn: 4500"
                      className={INPUT_CLS}
                    />
                  </View>
                </View>
              ) : cardType === 'CREDIT_CARD' ? (
                <View style={tw`gap-3`}>
                  <View style={tw`gap-3`}>
                    <View>
                      <Text className={LABEL_CLS}>Toplam Kredi Limiti (₺)</Text>
                      <Input
                        keyboardType="decimal-pad"
                        value={cardCreditLimit}
                        onChangeText={setCardCreditLimit}
                        placeholder="Örn: 50000"
                        className={INPUT_CLS}
                      />
                    </View>
                    <View>
                      <Text className={LABEL_CLS}>Güncel Borç (₺)</Text>
                      <Input
                        keyboardType="decimal-pad"
                        value={cardCurrentDebt}
                        onChangeText={setCardCurrentDebt}
                        placeholder="Örn: 6450"
                        className={INPUT_CLS}
                      />
                    </View>
                  </View>
                  {/* Ekstre Kesim ve Son Ödeme Günleri */}
                  <View style={tw`gap-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text className="text-xs font-bold text-indigo-950 dark:text-indigo-200">🗓️ Ekstre Kesim & Döngü Şablonu</Text>
                      <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Hızlı Seçim</Text>
                    </View>

                    {/* Quick Presets Buttons */}
                    <Grid cols={2} gap={1.5}>
                      {FORM_CUTOFF_PRESETS.map((preset) => {
                        const active =
                          preset.day === 15
                            ? Number(cardCutoffDay) === 15 || (!cardCutoffDay && !editingCard)
                            : Number(cardCutoffDay) === preset.day;
                        return (
                          <Btn
                            key={preset.day}
                            onPress={() => handleSelectCutoffPreset(preset.day)}
                            className={`px-2 py-1.5 rounded-xl border items-center ${
                              active
                                ? 'bg-indigo-600 border-indigo-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Text
                              className={`text-[11px] text-center ${
                                active ? 'text-white font-bold' : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {preset.label}
                            </Text>
                          </Btn>
                        );
                      })}
                    </Grid>

                    <View style={tw`gap-3 pt-1`}>
                      <View>
                        <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Hesap Kesim Günü (1-31)</Text>
                        <Input
                          keyboardType="number-pad"
                          maxLength={2}
                          value={cardCutoffDay}
                          onChangeText={(text) => {
                            setCardCutoffDay(text);
                            const val = Number(text);
                            if (val >= 1 && val <= 31 && !cardDueDay) {
                              const calculatedDue = val <= 20 ? val + 10 : (val - 20 <= 0 ? 1 : val - 20);
                              setCardDueDay(calculatedDue.toString());
                            }
                          }}
                          placeholder="Örn: 15"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Son Ödeme Günü (1-31)</Text>
                        <Input
                          keyboardType="number-pad"
                          maxLength={2}
                          value={cardDueDay}
                          onChangeText={setCardDueDay}
                          placeholder="Örn: 25"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={tw`gap-3`}>
                  <View style={tw`gap-3`}>
                    <View>
                      <Text className={LABEL_CLS}>Hesap / Kart Para Birimi *</Text>
                      <Select
                        value={cardCurrency}
                        onChange={setCardCurrency}
                        options={BANK_CARD_CURRENCIES.map((curr) => ({
                          value: curr.code,
                          label: `${curr.symbol} ${curr.label} (${curr.code})`,
                        }))}
                        title="Hesap / Kart Para Birimi"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        textClassName="text-slate-900 dark:text-slate-100 text-xs font-semibold"
                      />
                    </View>

                    <View>
                      <Text className={LABEL_CLS}>Mevcut Bakiye ({getCurrencySymbol(cardCurrency)}) *</Text>
                      <Input
                        keyboardType="decimal-pad"
                        value={cardBalance}
                        onChangeText={setCardBalance}
                        placeholder="Örn: 15000"
                        className={INPUT_CLS}
                      />
                    </View>
                  </View>

                  {cardCurrency !== 'TRY' && (
                    <View style={tw`p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 flex-row items-start gap-2`}>
                      <View style={tw`mt-0.5`}>
                        <Info {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                          Otomatik Kur Çevrimi: 1 {getCurrencySymbol(cardCurrency)} ≈ {getCurrencyRateInTRY(cardCurrency, exchangeRates).toFixed(2)} ₺
                        </Text>
                        <Text className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                          Güncel TL Karşılığı: {convertCurrencyToTRY(parseFloat(cardBalance) || 0, cardCurrency, exchangeRates).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          {' '}(Veritabanında saklanan günlük kur ile otomatik hesaplanır)
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Banka Kartı Doğrudan Yatırım Hesabı Seçeneği */}
                  <View style={tw`p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 gap-2.5`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center gap-1.5`}>
                          <TrendingUp {...ic('w-3.5 h-3.5 text-amber-600')} />
                          <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">Doğrudan Yatırım / Birikim Hesabı</Text>
                        </View>
                        <Text className="text-[11px] text-amber-700 dark:text-amber-300">
                          Bu kartı döviz birikim veya yatırım hesabı olarak takip edin
                        </Text>
                      </View>
                      <CheckBox
                        checked={cardIsInvestmentAccount}
                        onChange={setCardIsInvestmentAccount}
                        checkedClassName="bg-amber-600"
                        label="Doğrudan Yatırım Hesabı"
                      />
                    </View>

                    {cardIsInvestmentAccount && (
                      <View>
                        <Text className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                          Yatırım Hesabı Türü / Açıklaması
                        </Text>
                        <Select
                          value={cardInvestmentType}
                          onChange={setCardInvestmentType}
                          options={INVESTMENT_TYPE_OPTIONS}
                          title="Yatırım Hesabı Türü / Açıklaması"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800"
                          textClassName="text-slate-900 dark:text-slate-100 text-xs font-semibold"
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* 4. Son 4 Hane & Renk */}
              <View style={tw`gap-3`}>
                <View>
                  <Text className={LABEL_CLS}>Kart Son 4 Hanesi (Opsiyonel)</Text>
                  <Input
                    keyboardType="number-pad"
                    maxLength={4}
                    value={cardLast4}
                    onChangeText={(text) => setCardLast4(text.replace(/\D/g, ''))}
                    placeholder="Örn: 4589"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono font-medium outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </View>

                <View>
                  <Text className={LABEL_CLS}>Kart Rengi</Text>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View
                      style={[
                        tw`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800`,
                      ]}
                    >
                      <View style={[tw`flex-1 rounded-lg`, { backgroundColor: cardColor }]} />
                    </View>
                    <Text className="text-xs font-mono text-slate-500">{cardColor}</Text>
                  </View>
                  <View style={tw`flex-row flex-wrap gap-1.5 mt-2`}>
                    {COLOR_SWATCHES.map((color) => (
                      <Btn
                        key={color}
                        onPress={() => setCardColor(color)}
                        accessibilityLabel={color}
                        className={`w-7 h-7 rounded-lg border-2 ${
                          cardColor.toLowerCase() === color.toLowerCase()
                            ? 'border-slate-900 dark:border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* 5. Aile ile Paylaşım */}
              <View style={tw`p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between`}>
                <View style={tw`flex-1`}>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">Aileyle Ortak Kullanım</Text>
                  <Text className="text-[11px] text-slate-500">Aile üyeleri bu kartı harcamalarında seçebilir</Text>
                </View>
                <CheckBox checked={cardIsShared} onChange={setCardIsShared} checkedClassName="bg-indigo-600" label="Aileyle Ortak Kullanım" />
              </View>

              {/* 6. Finans Raporlarından Hariç Tut */}
              <View style={tw`p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between`}>
                <View style={tw`flex-1`}>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">Finans Raporlarından Hariç Tut</Text>
                  <Text className="text-[11px] text-slate-500">
                    Bu kartın bakiyesini ve harcamalarını genel finans raporlarına dahil etme
                  </Text>
                </View>
                <CheckBox
                  checked={cardExcludeFromReports}
                  onChange={setCardExcludeFromReports}
                  checkedClassName="bg-rose-600"
                  label="Finans Raporlarından Hariç Tut"
                />
              </View>

              {/* Buttons */}
              <View style={tw`flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}>
                <Btn onPress={() => setIsAddCardOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Vazgeç</Text>
                </Btn>
                <Btn onPress={handleSaveCard} className="px-5 py-2.5 rounded-xl bg-indigo-600 shadow-xs">
                  <Text className="text-white text-xs font-semibold">{editingCard ? 'Değişiklikleri Kaydet' : 'Kartı Kaydet'}</Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* --- MODAL 2: TOP-UP / BAKİYE YÜKLEME MODAL --- */}
      {selectedCardForTopUp && (
        <Overlay onClose={() => setSelectedCardForTopUp(null)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View style={tw`flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800`}>
              <View style={tw`flex-row items-center gap-2.5 flex-1`}>
                <View style={tw`w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center`}>
                  <ArrowDownLeft {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedCardForTopUp.type === 'FOOD_CARD' ? 'Yemek Ücreti / Bakiye Yükle' : selectedCardForTopUp.type === 'CREDIT_CARD' ? 'Borç Ödeme' : 'Bakiye Yükle'}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{selectedCardForTopUp.name}</Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedCardForTopUp(null)} accessibilityLabel="Kapat" className="p-2 rounded-xl">
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View style={tw`p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40`}>
                <Text className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Mevcut Bakiye</Text>
                <Text className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {formatCurrencyWithSymbol(selectedCardForTopUp.balance || 0, selectedCardForTopUp.currency || 'TRY')}
                </Text>
              </View>

              <View>
                <Text className={LABEL_CLS}>Yüklenecek Tutar ({getCurrencySymbol(selectedCardForTopUp.currency || 'TRY')}) *</Text>
                <Input
                  keyboardType="decimal-pad"
                  autoFocus
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="Örn: 4500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </View>

              <View>
                <Text className={LABEL_CLS}>Açıklama / Not</Text>
                <Input
                  value={topUpNote}
                  onChangeText={setTopUpNote}
                  placeholder="Örn: Şirket Aylık Yemek Hak Edişi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </View>

              <View>
                <Text className={LABEL_CLS}>İşlem Tarihi</Text>
                <DateInput
                  value={topUpDate}
                  onChange={setTopUpDate}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </View>

              <View style={tw`flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}>
                <Btn onPress={() => setSelectedCardForTopUp(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Vazgeç</Text>
                </Btn>
                <Btn onPress={handleTopUpSubmit} className="flex-shrink px-5 py-2.5 rounded-xl bg-emerald-600 shadow-xs">
                  <Text className="text-white text-xs font-semibold">
                    Bakiyeyi Yükle (+{parseFloat(topUpAmount) ? parseFloat(topUpAmount).toLocaleString('tr-TR') : '0'} {getCurrencySymbol(selectedCardForTopUp.currency || 'TRY')})
                  </Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* --- MODAL 3: SPEND / HARCAMA YAP MODAL --- */}
      {selectedCardForSpend && (
        <Overlay onClose={() => setSelectedCardForSpend(null)}>
          <Panel className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md self-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <View style={tw`flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800`}>
              <View style={tw`flex-row items-center gap-2.5 flex-1`}>
                <View style={tw`w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center`}>
                  <ArrowUpRight {...ic('w-5 h-5 text-rose-600 dark:text-rose-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-slate-100">Karttan Harcama Yap</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{selectedCardForSpend.name}</Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedCardForSpend(null)} accessibilityLabel="Kapat" className="p-2 rounded-xl">
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-4`}>
              <View style={tw`p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between`}>
                <Text className="text-xs text-slate-500">Mevcut Bakiye</Text>
                <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrencyWithSymbol(selectedCardForSpend.balance || 0, selectedCardForSpend.currency || 'TRY')}
                </Text>
              </View>

              <View>
                <Text className={LABEL_CLS}>Harcama Tutarı ({getCurrencySymbol(selectedCardForSpend.currency || 'TRY')}) *</Text>
                <Input
                  keyboardType="decimal-pad"
                  autoFocus
                  value={spendAmount}
                  onChangeText={setSpendAmount}
                  placeholder="Örn: 250"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </View>

              <View>
                <Text className={LABEL_CLS}>Harcama Başlığı / Nereye Harcandı? *</Text>
                <Input
                  value={spendTitle}
                  onChangeText={setSpendTitle}
                  placeholder="Örn: Öğle Yemeği, Kahve, Market vb."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </View>

              <Grid cols={2} gap={3}>
                <View>
                  <Text className={LABEL_CLS}>Kategori</Text>
                  <Select
                    value={spendCategory}
                    onChange={setSpendCategory}
                    options={SPEND_CATEGORY_OPTIONS}
                    placeholder={SPEND_CATEGORY_OPTIONS[0].label}
                    title="Kategori"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    textClassName="text-slate-900 dark:text-slate-100 text-xs font-medium"
                  />
                </View>

                <View>
                  <Text className={LABEL_CLS}>Tarih</Text>
                  <DateInput
                    value={spendDate}
                    onChange={setSpendDate}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden"
                  />
                </View>
              </Grid>

              <View>
                <Text className={LABEL_CLS}>Not (Opsiyonel)</Text>
                <Input
                  value={spendNote}
                  onChangeText={setSpendNote}
                  placeholder="Ek detaylar..."
                  onSubmitEditing={handleSpendSubmit}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium outline-hidden"
                />
              </View>

              <View style={tw`flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}>
                <Btn onPress={() => setSelectedCardForSpend(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Vazgeç</Text>
                </Btn>
                <Btn onPress={handleSpendSubmit} className="flex-shrink px-5 py-2.5 rounded-xl bg-rose-600 shadow-xs">
                  <Text className="text-white text-xs font-semibold">
                    Harcamayı Kaydet (-{parseFloat(spendAmount) ? parseFloat(spendAmount).toLocaleString('tr-TR') : '0'} {getCurrencySymbol(selectedCardForSpend.currency || 'TRY')})
                  </Text>
                </Btn>
              </View>
            </View>
          </Panel>
        </Overlay>
      )}

      {/* --- MODAL 4: TRANSACTION HISTORY DRAWER / MODAL --- */}
      {selectedCardForHistory && (
        <Overlay onClose={() => setSelectedCardForHistory(null)}>
          <View
            style={[
              tw`bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg self-center shadow-2xl border border-slate-200 dark:border-slate-800 flex-col`,
              { maxHeight: '85%' },
            ]}
          >
            <View style={tw`flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800`}>
              <View style={tw`flex-row items-center gap-2.5 flex-1`}>
                <View style={tw`w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                  <History {...ic('w-5 h-5 text-indigo-600 dark:text-indigo-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="text-base font-bold text-slate-900 dark:text-slate-100">Kart Hareketleri</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{selectedCardForHistory.name}</Text>
                </View>
              </View>
              <Btn onPress={() => setSelectedCardForHistory(null)} accessibilityLabel="Kapat" className="p-2 rounded-xl">
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Btn>
            </View>

            {/* Balance / Debt Summary in Drawer */}
            {(() => {
              const activeCard = allCards.find((c) => c.id === selectedCardForHistory.id) || selectedCardForHistory;
              const isCredit = activeCard.type === 'CREDIT_CARD';
              const currentDebt = activeCard.currentDebt || 0;
              const creditLimit = activeCard.creditLimit || 0;
              const availableLimit = Math.max(0, creditLimit - currentDebt);

              return (
                <View style={tw`my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between gap-2`}>
                  <View style={tw`flex-1`}>
                    <Text className="text-xs text-slate-500">{isCredit ? 'Güncel Borç Durumu' : 'Güncel Bakiye'}</Text>
                    <Text className={`text-xl font-bold ${isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {isCredit
                        ? formatCurrencyWithSymbol(currentDebt, activeCard.currency || 'TRY')
                        : formatCurrencyWithSymbol(activeCard.balance || 0, activeCard.currency || 'TRY')}
                    </Text>
                    {isCredit && (
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        Kullanılabilir Limit: {formatCurrencyWithSymbol(availableLimit, activeCard.currency || 'TRY')} / {formatCurrencyWithSymbol(creditLimit, activeCard.currency || 'TRY')}
                      </Text>
                    )}
                  </View>
                  <View style={tw`px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60`}>
                    <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {activeCard.type === 'FOOD_CARD' ? 'Yemek Kartı' : isCredit ? 'Kredi Kartı' : 'Banka/Cüzdan'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Transactions List */}
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={tw`gap-2 pr-1`} showsVerticalScrollIndicator={false}>
              {(() => {
                const activeCard = allCards.find((c) => c.id === selectedCardForHistory.id) || selectedCardForHistory;
                const txList = activeCard.transactions || [];

                if (txList.length === 0) {
                  return (
                    <View style={tw`py-10`}>
                      <Text className="text-center text-slate-400 text-xs">Henüz işlem hareketi kaydedilmemiş.</Text>
                    </View>
                  );
                }

                return txList.map((tx) => {
                  const isTopUp = tx.type === 'TOP_UP';
                  return (
                    <View
                      key={tx.id}
                      style={tw`p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex-row items-center justify-between gap-2`}
                    >
                      <View style={tw`flex-row items-center gap-3 flex-1`}>
                        <View
                          style={tw.style(
                            'w-9 h-9 rounded-xl items-center justify-center',
                            isTopUp ? 'bg-emerald-50 dark:bg-emerald-950/60' : 'bg-rose-50 dark:bg-rose-950/60',
                          )}
                        >
                          {isTopUp ? (
                            <ArrowDownLeft {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                          ) : (
                            <ArrowUpRight {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
                          )}
                        </View>
                        <View style={tw`flex-1`}>
                          <Text className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {tx.title || (isTopUp ? (activeCard.type === 'CREDIT_CARD' ? 'Borç Ödemesi' : 'Bakiye Yükleme') : 'Harcama')}
                          </Text>
                          <View style={tw`flex-row flex-wrap items-center gap-2`}>
                            <Text className="text-[11px] text-slate-400">{tx.date}</Text>
                            {tx.categoryName ? <Text className="text-[11px] text-slate-400">• {tx.categoryName}</Text> : null}
                            {tx.note ? <Text className="text-[11px] text-slate-400">• {tx.note}</Text> : null}
                          </View>
                        </View>
                      </View>

                      <Text className={`text-sm font-bold ${isTopUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isTopUp ? '+' : '-'}
                        {formatCurrencyWithSymbol(tx.amount, activeCard.currency || 'TRY')}
                      </Text>
                    </View>
                  );
                });
              })()}
            </ScrollView>

            <View style={tw`pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex-row justify-end`}>
              <Btn onPress={() => setSelectedCardForHistory(null)} className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100">
                <Text className="text-white dark:text-slate-900 text-xs font-semibold">Kapat</Text>
              </Btn>
            </View>
          </View>
        </Overlay>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        title="Kartı Sil"
        message={`"${cardToDelete?.name}" kartını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Kartı Sil"
        cancelText="Vazgeç"
        danger={true}
        onConfirm={() => {
          if (cardToDelete) {
            deletePaymentCard(cardToDelete.id);
            setCardToDelete(null);
          }
        }}
        onClose={() => setCardToDelete(null)}
      />
    </View>
  );
};
