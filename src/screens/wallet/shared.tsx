import React, { useState } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { IconButton, Text, palette } from '../../design';
import { formatDay, formatMonth, monthKey, shiftMonth } from '../../logic/format';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { Category, ExpenseLog } from '../../types';

/** Expense categories that are not list categories but common for direct expenses. */
export const EXTRA_EXPENSE_CATEGORIES: Pick<Category, 'name' | 'color' | 'icon'>[] = [
  { name: 'Fatura', color: '#ef4444', icon: 'Receipt' },
  { name: 'Ulaşım', color: '#06b6d4', icon: 'Car' },
  { name: 'Restoran & Yemek', color: '#f97316', icon: 'Utensils' },
  { name: 'Sağlık', color: '#14b8a6', icon: 'HeartPulse' },
  { name: 'Eğlence', color: '#a855f7', icon: 'Ticket' },
  { name: 'Diğer', color: '#64748b', icon: 'CircleDollarSign' },
];

export type CategoryMeta = { name: string; color: string; icon: string };

const DEFAULT_META = { color: palette.slate500, icon: 'Receipt' };

/** Returns color/icon for a category name (store categories first, then the extra expense set). */
export function useCategoryMeta(): (name?: string) => CategoryMeta {
  const categories = useAppStore((s) => s.categories);
  return (name?: string) => {
    const label = name || 'Diğer';
    const found = categories.find((c) => c.name === label) ?? EXTRA_EXPENSE_CATEGORIES.find((c) => c.name === label);
    return { name: label, color: found?.color ?? DEFAULT_META.color, icon: found?.icon ?? DEFAULT_META.icon };
  };
}

export function expenseTitle(expense: ExpenseLog): string {
  return expense.itemsSummary?.[0] || expense.note || expense.categoryName || 'Harcama';
}

export function expenseSubtitle(expense: ExpenseLog): string {
  const method = expense.cardName || expense.paymentMethod;
  return [formatDay(expense.date), method].filter(Boolean).join(' · ');
}

/** Month key state + `‹ Eylül 2026 ›` control. */
export function useMonthState(initial?: string) {
  return useState<string>(initial || monthKey());
}

export const MonthSwitcher: React.FC<{ month: string; onChange: (month: string) => void; compact?: boolean }> = ({
  month,
  onChange,
  compact,
}) => {
  const isCurrent = month >= monthKey();
  return (
    <View style={tw.style('flex-row items-center gap-2', compact ? '' : 'justify-between')}>
      <IconButton icon={ChevronLeft} label="Önceki ay" onPress={() => onChange(shiftMonth(month, -1))} />
      <Text variant="headline" className={compact ? '' : 'flex-1 text-center'} numberOfLines={1}>
        {formatMonth(month)}
      </Text>
      <View style={isCurrent ? tw`opacity-40` : undefined} pointerEvents={isCurrent ? 'none' : 'auto'}>
        <IconButton icon={ChevronRight} label="Sonraki ay" onPress={() => onChange(shiftMonth(month, 1))} />
      </View>
    </View>
  );
};

/** Pull-to-refresh wired to `syncWithServer(false)`. */
export function useRefresh() {
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    syncWithServer(false).finally(() => setRefreshing(false));
  };
  return { refreshing, onRefresh };
}
