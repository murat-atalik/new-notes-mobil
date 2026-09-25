import { useMemo } from 'react';

import { convertCurrencyToTRY } from '../lib/currencyUnits';
import {
  canUserAccessList,
  getAccessibleCards,
  getAccessibleExpenses,
  getAccessibleLists,
  getAccessibleSavings,
  isFamilyListForUser,
} from '../lib/permissions';
import { useAppStore } from '../store/useAppStore';
import type { AppList, ExpenseLog, ListItem, ListType, PaymentCard, SavingsGoal, User } from '../types';
import { daysFromToday, isoDate, monthKey } from './format';

/**
 * Shared derived data for every screen. Always read collections through these
 * hooks/helpers so permission rules and TRY conversion stay consistent.
 */

export type Scope = 'ALL' | 'SHARED' | 'PERSONAL';

// ---------- Lists ----------

export function useMyLists(): AppList[] {
  const lists = useAppStore((s) => s.lists);
  const user = useAppStore((s) => s.currentUser);
  return useMemo(
    () => getAccessibleLists(lists, user).filter((l) => !l.isArchived).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [lists, user],
  );
}

export function useList(listId: string | undefined): AppList | undefined {
  return useAppStore((s) => s.lists.find((l) => l.id === listId));
}

export function useListItems(listId: string | undefined): ListItem[] {
  const items = useAppStore((s) => s.items);
  return useMemo(() => items.filter((i) => i.listId === listId), [items, listId]);
}

export function listProgress(items: ListItem[]) {
  const total = items.length;
  const done = items.filter((i) => i.isCompleted).length;
  return { total, done, pending: total - done, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Shopping list total (price × quantity) for pending / all items. */
export function shoppingTotals(items: ListItem[]) {
  let pending = 0;
  let all = 0;
  let checked = 0;
  for (const i of items) {
    const line = (i.price || 0) * (i.quantity || 1);
    all += line;
    if (i.isCompleted) checked += line;
    else pending += line;
  }
  return { pending, all, checked };
}

/** Target quantity for a Room product (falls back to 1, same as shopping items). */
export function productTarget(item: ListItem): number {
  return item.quantity || 1;
}

/** How many of the target quantity have actually been bought, clamped to the target. */
export function productPurchased(item: ListItem): number {
  return Math.min(item.purchasedQuantity || 0, productTarget(item));
}

/** 0–100, how much of one product's target quantity has been bought. */
export function productProgressPercent(item: ListItem): number {
  const target = productTarget(item);
  return target > 0 ? Math.round((productPurchased(item) / target) * 100) : 0;
}

/**
 * Room progress across all its products, weighted by value (estimated price × quantity)
 * rather than a plain average of percentages, so one expensive unfinished product pulls
 * the room total down more than a cheap one.
 */
export function roomProgress(items: ListItem[]) {
  let targetValue = 0;
  let boughtValue = 0;
  let doneCount = 0;
  for (const item of items) {
    const price = item.price || 0;
    const target = productTarget(item);
    targetValue += price * target;
    boughtValue += price * productPurchased(item);
    if (productPurchased(item) >= target) doneCount += 1;
  }
  return {
    totalCount: items.length,
    doneCount,
    targetValue,
    boughtValue,
    percent: targetValue > 0 ? Math.round((boughtValue / targetValue) * 100) : items.length ? Math.round((doneCount / items.length) * 100) : 0,
  };
}

export function filterByScope(lists: AppList[], scope: Scope, user: User): AppList[] {
  if (scope === 'ALL') return lists;
  return lists.filter((l) => (scope === 'SHARED' ? isFamilyListForUser(l, user) : l.isShared === false));
}

export function listsOfType(lists: AppList[], type: ListType) {
  return lists.filter((l) => l.type === type);
}

/**
 * What the current user may do with a list's membership.
 * `canLeave` only when leaving actually removes access (family-shared lists stay
 * visible through the family rule, so leaving them would be a no-op).
 */
export function listMembership(list: AppList, user: User) {
  const isOwner = list.ownerId === user.id;
  const isMember = list.members.some((m) => m.userId === user.id);
  const keepsAccess = canUserAccessList({ ...list, members: list.members.filter((m) => m.userId !== user.id) }, user);
  return { isOwner, isMember, canLeave: !isOwner && isMember && !keepsAccess, viaFamily: !isOwner && keepsAccess };
}

export type TaskBucket = 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'NODATE' | 'DONE';

export function taskBucket(item: ListItem): TaskBucket {
  if (item.isCompleted) return 'DONE';
  const d = daysFromToday(item.dueDate);
  if (d === null) return 'NODATE';
  if (d < 0) return 'OVERDUE';
  if (d === 0) return 'TODAY';
  return 'UPCOMING';
}

export const PRIORITY_META = {
  HIGH: { label: 'Yüksek', color: '#e11d48' },
  MEDIUM: { label: 'Orta', color: '#d97706' },
  LOW: { label: 'Düşük', color: '#64748b' },
} as const;

// ---------- Finance ----------

export function useFinance() {
  const user = useAppStore((s) => s.currentUser);
  const expenses = useAppStore((s) => s.expenses);
  const cards = useAppStore((s) => s.paymentCards);
  const savings = useAppStore((s) => s.savingsGoals);
  const rates = useAppStore((s) => s.exchangeRates);
  const monthlyBudget = useAppStore((s) => s.monthlyBudget);
  const monthlyIncome = useAppStore((s) => s.monthlyIncome);
  return useMemo(
    () => ({
      user,
      rates,
      monthlyBudget,
      monthlyIncome,
      expenses: getAccessibleExpenses(expenses, user).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      cards: getAccessibleCards(cards, user),
      savings: getAccessibleSavings(savings, user),
    }),
    [user, expenses, cards, savings, rates, monthlyBudget, monthlyIncome],
  );
}

export function expenseInTRY(expense: ExpenseLog, rates: Record<string, number>): number {
  return convertCurrencyToTRY(expense.amount || 0, expense.currency || 'TRY', rates);
}

export function expensesInMonth(expenses: ExpenseLog[], month = monthKey()): ExpenseLog[] {
  return expenses.filter((e) => (e.date || '').startsWith(month));
}

export function filterExpensesByScope(expenses: ExpenseLog[], scope: Scope, user: User): ExpenseLog[] {
  if (scope === 'ALL') return expenses;
  if (scope === 'PERSONAL') return expenses.filter((e) => e.isShared === false && e.userId === user.id);
  return expenses.filter((e) => e.isShared !== false);
}

export function sumTRY(expenses: ExpenseLog[], rates: Record<string, number>): number {
  return expenses.reduce((sum, e) => sum + expenseInTRY(e, rates), 0);
}

/** Category totals in TRY, largest first. */
export function categoryBreakdown(expenses: ExpenseLog[], rates: Record<string, number>) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.categoryName || 'Diğer', (map.get(e.categoryName || 'Diğer') || 0) + expenseInTRY(e, rates));
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount, percent: total ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Expenses grouped by day (`YYYY-MM-DD`), newest first. */
export function groupByDay(expenses: ExpenseLog[]) {
  const map = new Map<string, ExpenseLog[]>();
  for (const e of expenses) {
    const day = (e.date || isoDate()).split('T')[0];
    map.set(day, [...(map.get(day) || []), e]);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, items]) => ({ day, items }));
}

export function isCreditCard(card: PaymentCard) {
  return card.type === 'CREDIT_CARD';
}

/** Same net-worth definition as the web FinanceView (excluded cards ignored). */
export function netWorth(cards: PaymentCard[], savings: SavingsGoal[], rates: Record<string, number>) {
  const active = cards.filter((c) => !c.excludeFromReports);
  const liquid = active.filter((c) => !isCreditCard(c)).reduce((s, c) => s + convertCurrencyToTRY(c.balance || 0, c.currency || 'TRY', rates), 0);
  const creditDebt = active.filter(isCreditCard).reduce((s, c) => s + (c.currentDebt || 0), 0);
  const creditLimit = active.filter(isCreditCard).reduce((s, c) => s + (c.creditLimit || 0), 0);
  const savingsTotal = savings.filter((a) => !a.excludeFromReports).reduce((s, a) => s + (a.currentAmount || 0), 0);
  return { liquid, creditDebt, creditLimit, savingsTotal, total: liquid + savingsTotal - creditDebt };
}

export const CARD_TYPE_META: Record<PaymentCard['type'], { label: string; icon: string }> = {
  CREDIT_CARD: { label: 'Kredi Kartı', icon: 'CreditCard' },
  DEBIT_CARD: { label: 'Banka Hesabı', icon: 'Landmark' },
  FOOD_CARD: { label: 'Yemek Kartı', icon: 'Utensils' },
  CASH_WALLET: { label: 'Nakit', icon: 'Wallet' },
  PREPAID_CARD: { label: 'Ön Ödemeli', icon: 'Smartphone' },
};

/** Spendable amount shown on a card tile. */
export function cardAvailable(card: PaymentCard): number {
  if (isCreditCard(card)) return Math.max(0, (card.creditLimit || 0) - (card.currentDebt || 0));
  return card.balance || 0;
}

const GENERIC_PAYMENT_PHRASES = new Set([
  'kredi kartı', 'kredi karti', 'kredi', 'kart', 'nakit', 'banka kartı', 'banka karti',
  'havale', 'eft', 'otomatik ödeme', 'diğer', 'diger',
]);

/**
 * The card an expense was paid with — same ownership rules as the store's
 * `sanitizePaymentCards`: cardId, then exact card name, then a non-generic payment method.
 */
export function resolveExpenseCard(expense: ExpenseLog, cards: PaymentCard[]): PaymentCard | undefined {
  if (expense.cardId) {
    const byId = cards.find((c) => c.id === expense.cardId);
    if (byId) return byId;
  }
  const byName = (name?: string) => {
    const clean = name?.trim().toLowerCase();
    return clean ? cards.find((c) => c.name.trim().toLowerCase() === clean) : undefined;
  };
  const named = byName(expense.cardName);
  if (named) return named;
  const pm = expense.paymentMethod?.trim().toLowerCase();
  return pm && !GENERIC_PAYMENT_PHRASES.has(pm) ? byName(pm) : undefined;
}
