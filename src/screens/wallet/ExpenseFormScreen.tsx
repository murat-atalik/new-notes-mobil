import React, { useState } from 'react';
import { View } from 'react-native';

import {
  AmountField,
  ChipRow,
  DateField,
  FormScreen,
  ListGroup,
  SelectField,
  SwatchField,
  SwitchRow,
  TextField,
  showToast,
  type ChipOption,
  type SelectOption,
  type SwatchOption,
} from '../../design';
import { formatMoney, isoDate, parseAmount } from '../../logic/format';
import { CARD_TYPE_META, cardAvailable, resolveExpenseCard, useFinance } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { BANK_CARD_CURRENCIES, getCurrencySymbol } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { ExpenseLog, PaymentCard } from '../../types';
import { EXTRA_EXPENSE_CATEGORIES, type CategoryMeta } from './shared';

const CASH = 'Nakit';
const OTHER = 'Diğer';
const cardKey = (id: string) => `card:${id}`;

const isBalanceCard = (card: PaymentCard) => card.type !== 'CREDIT_CARD';

/**
 * `updateExpense` only patches the expense, so when an edit changes the amount or the
 * card we move the card effect ourselves: reverse the old SPEND (same rule as
 * `deleteExpense`) and book a new one with `spendFromCard` (same rule as `addDirectExpense`).
 */
function rebookCardSpend(old: ExpenseLog, next: { amount: number; card?: PaymentCard; title: string; categoryName: string; note?: string }) {
  const store = useAppStore.getState();
  // Also finds cards linked only by name (older shopping checkouts have no cardId).
  const oldCard = resolveExpenseCard(old, store.paymentCards);
  if (oldCard) {
    store.updatePaymentCard(oldCard.id, {
      transactions: (oldCard.transactions || []).filter(
        (t) => t.relatedExpenseId !== old.id && t.id !== `tx-sync-${old.id}`,
      ),
      ...(isBalanceCard(oldCard)
        ? { balance: (oldCard.balance || 0) + old.amount }
        : { currentDebt: Math.max(0, (oldCard.currentDebt || 0) - old.amount) }),
    });
  }
  if (next.card) {
    useAppStore.getState().spendFromCard(next.card.id, next.amount, next.title, next.categoryName, old.id, next.note);
  }
}

export const ExpenseFormScreen: React.FC<RootScreenProps<'ExpenseForm'>> = ({ navigation, route }) => {
  const expenseId = route.params?.expenseId;
  const routeCardId = route.params?.cardId;
  const existing = useAppStore((s) => (expenseId ? s.expenses.find((e) => e.id === expenseId) : undefined));
  const categories = useAppStore((s) => s.categories);
  const users = useAppStore((s) => s.users);
  const addDirectExpense = useAppStore((s) => s.addDirectExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const { user, cards } = useFinance();

  const isCheckout = !!existing && (existing.type === 'SHOPPING_CHECKOUT' || !!existing.listId);
  const routeCard = routeCardId ? cards.find((c) => c.id === routeCardId) : undefined;

  const [amount, setAmount] = useState(() => (existing ? String(existing.amount).replace('.', ',') : ''));
  const [currency, setCurrency] = useState(() => existing?.currency || routeCard?.currency || 'TRY');
  const [category, setCategory] = useState(
    () => existing?.categoryName || (routeCard?.type === 'FOOD_CARD' ? 'Restoran & Yemek' : 'Süpermarket & Gıda'),
  );
  const [title, setTitle] = useState(() => (existing ? (isCheckout ? existing.note || '' : existing.itemsSummary?.[0] || existing.note || '') : ''));
  const [date, setDate] = useState(() => (existing?.date || isoDate()).split('T')[0]);
  const [payment, setPayment] = useState(() => {
    if (existing) {
      const linked = resolveExpenseCard(existing, cards);
      if (linked) return cardKey(linked.id);
      return existing.paymentMethod === CASH ? CASH : OTHER;
    }
    return routeCard ? cardKey(routeCard.id) : CASH;
  });
  const [isShared, setIsShared] = useState(() => existing?.isShared !== false);

  // Category options: shopping categories + common direct-expense ones (+ the current one if custom).
  const categoryOptions: CategoryMeta[] = [
    ...categories.filter((c) => c.type === 'SHOPPING').map((c) => ({ name: c.name, color: c.color, icon: c.icon })),
    ...EXTRA_EXPENSE_CATEGORIES.filter((x) => !categories.some((c) => c.name === x.name)),
  ];
  if (category && !categoryOptions.some((c) => c.name === category)) {
    categoryOptions.unshift({ name: category, color: '#64748b', icon: 'Tag' });
  }
  const categorySwatches: SwatchOption[] = categoryOptions.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }));
  const currencySwatches: SwatchOption[] = BANK_CARD_CURRENCIES.map((c) => ({ value: c.code, label: c.label, emoji: c.icon, color: c.color }));

  const paymentOptions: SelectOption[] = [
    ...cards.map((c) => ({
      value: cardKey(c.id),
      label: `${c.name} · ${CARD_TYPE_META[c.type].label} (${formatMoney(cardAvailable(c), c.currency || 'TRY')})`,
    })),
    { value: CASH, label: 'Nakit' },
    { value: OTHER, label: 'Diğer' },
  ];

  const value = parseAmount(amount);
  const valid = value > 0 && !!category && !!date;
  const selectedCard = payment.startsWith('card:') ? cards.find((c) => cardKey(c.id) === payment) : undefined;
  const yesterday = isoDate(new Date(Date.now() - 86_400_000));
  const today = isoDate();
  const dateChips: ChipOption<string>[] = [
    { value: today, label: 'Bugün' },
    { value: yesterday, label: 'Dün' },
  ];

  const onSubmit = () => {
    if (!valid) return;
    const cleanTitle = title.trim();
    const paymentMethod = selectedCard ? selectedCard.name : payment;

    if (existing) {
      const cardChanged = resolveExpenseCard(existing, cards)?.id !== selectedCard?.id;
      if (cardChanged || existing.amount !== value) {
        rebookCardSpend(existing, {
          amount: value,
          card: selectedCard,
          title: cleanTitle || existing.itemsSummary?.[0] || category,
          categoryName: category,
          note: cleanTitle || undefined,
        });
      }
      const updates: Partial<ExpenseLog> = {
        amount: value,
        currency,
        categoryName: category,
        date,
        paymentMethod,
        cardId: selectedCard?.id,
        cardName: selectedCard?.name,
        cardType: selectedCard?.type,
        isShared,
        sharedWith: isShared ? users.filter((u) => u.id !== user.id).map((u) => u.name) : undefined,
      };
      if (isCheckout) {
        updates.note = cleanTitle || undefined;
      } else {
        updates.itemsSummary = [cleanTitle || category];
        updates.note = cleanTitle || category;
      }
      updateExpense(existing.id, updates);
      showToast('Harcama güncellendi');
    } else {
      // Mirrors the web FinanceView `handleCreateExpense`; the store books the card SPEND.
      addDirectExpense({
        userId: user.id,
        familyId: user.familyId,
        amount: value,
        currency,
        categoryName: category,
        date,
        itemCount: 1,
        itemsSummary: [cleanTitle || category],
        paymentMethod,
        cardId: selectedCard?.id,
        cardName: selectedCard?.name,
        cardType: selectedCard?.type,
        note: cleanTitle || category,
        type: 'DIRECT_EXPENSE',
        isShared,
        sharedWith: isShared ? users.filter((u) => u.id !== user.id).map((u) => u.name) : undefined,
      });
      showToast(selectedCard ? `${formatMoney(value, currency)} · ${selectedCard.name} kartından düşüldü` : 'Harcama eklendi');
    }
    navigation.goBack();
  };

  return (
    <FormScreen title={existing ? 'Harcamayı Düzenle' : 'Harcama Ekle'} onSubmit={onSubmit} submitDisabled={!valid}>
      <View style={tw`gap-3`}>
        <AmountField value={amount} onChangeText={setAmount} currencySymbol={getCurrencySymbol(currency)} autoFocus={!existing} />
        <SwatchField label="Para birimi" value={currency} onChange={setCurrency} options={currencySwatches} sheetTitle="Para birimi seç" />
      </View>

      <SwatchField label="Kategori" value={category} onChange={setCategory} options={categorySwatches} sheetTitle="Kategori seç" />

      <TextField
        label={isCheckout ? 'Not' : 'Başlık / Not'}
        value={title}
        onChangeText={setTitle}
        placeholder={isCheckout ? 'İsteğe bağlı not' : 'Örn. Elektrik faturası'}
        returnKeyType="done"
      />

      <View style={tw`gap-2`}>
        <DateField label="Tarih" value={date} onChange={setDate} />
        <ChipRow options={dateChips} value={date} onChange={setDate} />
      </View>

      <SelectField
        label="Ödeme"
        value={payment}
        onChange={setPayment}
        options={paymentOptions}
        hint={
          selectedCard
            ? isBalanceCard(selectedCard)
              ? 'Tutar kart bakiyesinden düşülür.'
              : 'Tutar kredi kartı borcuna eklenir.'
            : cards.length === 0
              ? 'Kart eklersen harcamalar kart bakiyesine de yansır.'
              : undefined
        }
      />

      <ListGroup>
        <SwitchRow
          title="Aile harcaması"
          subtitle={isShared ? 'Aile üyeleri görebilir' : 'Sadece sen görebilirsin'}
          icon="Users"
          iconColor="#10b981"
          value={isShared}
          onValueChange={setIsShared}
        />
      </ListGroup>
    </FormScreen>
  );
};
