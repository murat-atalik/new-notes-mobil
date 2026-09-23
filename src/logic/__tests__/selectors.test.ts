jest.mock('react-native', () => ({
  Platform: { OS: 'ios', constants: { reactNativeVersion: { major: 0, minor: 87, patch: 1 } } },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('../../store/useAppStore', () => ({ useAppStore: () => undefined }));

import type { ExpenseLog, ListItem, PaymentCard } from '../../types';
import { categoryBreakdown, groupByDay, listProgress, netWorth, shoppingTotals, sumTRY, taskBucket } from '../selectors';

const item = (over: Partial<ListItem>): ListItem => ({
  id: 'i', listId: 'l', title: 't', isCompleted: false, price: 0, quantity: 1, unit: 'adet', categoryId: '', createdAt: '', ...over,
});
const exp = (over: Partial<ExpenseLog>): ExpenseLog => ({ id: 'e', userId: 'u', amount: 0, categoryName: 'Market', date: '2026-09-01', ...over });
const RATES = { TRY: 1, EUR: 40, USD: 35 };

describe('selectors', () => {
  it('computes list progress and shopping totals', () => {
    const items = [item({ price: 10, quantity: 2 }), item({ price: 5, isCompleted: true })];
    expect(listProgress(items)).toEqual({ total: 2, done: 1, pending: 1, percent: 50 });
    expect(shoppingTotals(items)).toEqual({ pending: 20, all: 25, checked: 5 });
  });

  it('buckets tasks by due date', () => {
    expect(taskBucket(item({ isCompleted: true }))).toBe('DONE');
    expect(taskBucket(item({}))).toBe('NODATE');
    expect(taskBucket(item({ dueDate: '2000-01-01' }))).toBe('OVERDUE');
  });

  it('converts expenses to TRY and groups them', () => {
    const list = [exp({ id: 'a', amount: 10, currency: 'EUR' }), exp({ id: 'b', amount: 100, categoryName: 'Fatura', date: '2026-09-02' })];
    expect(sumTRY(list, RATES)).toBe(500);
    expect(categoryBreakdown(list, RATES)[0]).toMatchObject({ name: 'Market', amount: 400 });
    expect(groupByDay(list).map((g) => g.day)).toEqual(['2026-09-02', '2026-09-01']);
  });

  it('computes net worth like the web', () => {
    const cards = [
      { id: 'c1', type: 'DEBIT_CARD', balance: 1000, currency: 'TRY' },
      { id: 'c2', type: 'CREDIT_CARD', currentDebt: 300, creditLimit: 5000 },
      { id: 'c3', type: 'DEBIT_CARD', balance: 999, excludeFromReports: true },
    ] as PaymentCard[];
    const result = netWorth(cards, [{ currentAmount: 200 } as never], RATES);
    expect(result).toMatchObject({ liquid: 1000, creditDebt: 300, savingsTotal: 200, total: 900 });
  });
});

describe('resolveExpenseCard', () => {
  const { resolveExpenseCard } = jest.requireActual('../selectors') as typeof import('../selectors');
  const cards = [
    { id: 'c1', name: 'Garanti Bonus' },
    { id: 'c2', name: 'Kredi Kartı' },
  ] as PaymentCard[];
  it('matches by id, then card name, then non-generic payment method', () => {
    expect(resolveExpenseCard(exp({ cardId: 'c1' }), cards)?.id).toBe('c1');
    expect(resolveExpenseCard(exp({ cardName: 'garanti bonus' }), cards)?.id).toBe('c1');
    expect(resolveExpenseCard(exp({ paymentMethod: 'Garanti Bonus' }), cards)?.id).toBe('c1');
    // Generic phrases never match a card, even if a card happens to share the name.
    expect(resolveExpenseCard(exp({ paymentMethod: 'Kredi Kartı' }), cards)).toBeUndefined();
  });
});
