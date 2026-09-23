import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MoreHorizontal, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react-native';

import {
  Card,
  ChipRow,
  EmptyState,
  FAB,
  IconTile,
  ListGroup,
  Row,
  StackScreen,
  Text,
  TextField,
  confirmAction,
  showActionSheet,
  showToast,
  type ChipOption,
} from '../../design';
import { formatDay, formatMoney } from '../../logic/format';
import { expensesInMonth, filterExpensesByScope, groupByDay, sumTRY, useFinance, type Scope } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { ic, tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { ExpenseLog } from '../../types';
import { MonthSwitcher, expenseTitle, useCategoryMeta, useMonthState, useRefresh } from './shared';

const SCOPES: ChipOption<Scope>[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'SHARED', label: 'Ortak' },
  { value: 'PERSONAL', label: 'Kişisel' },
];

const ALL = '__all__';

export const ExpensesScreen: React.FC<RootScreenProps<'Expenses'>> = ({ navigation, route }) => {
  const { expenses, user, rates } = useFinance();
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const [month, setMonth] = useMonthState(route.params?.month);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('ALL');
  const [category, setCategory] = useState<string>(ALL);
  const { refreshing, onRefresh } = useRefresh();
  const metaFor = useCategoryMeta();

  const scoped = filterExpensesByScope(expensesInMonth(expenses, month), scope, user);
  const categoryNames = [...new Set(scoped.map((e) => e.categoryName || 'Diğer'))].sort((a, b) => a.localeCompare(b, 'tr'));
  const activeCategory = categoryNames.includes(category) ? category : ALL;
  const q = query.trim().toLocaleLowerCase('tr');
  const visible = scoped.filter((e) => {
    if (activeCategory !== ALL && (e.categoryName || 'Diğer') !== activeCategory) return false;
    if (!q) return true;
    const haystack = [e.categoryName, e.note, e.listTitle, e.cardName, e.paymentMethod, ...(e.itemsSummary || [])]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('tr');
    return haystack.includes(q);
  });
  const total = sumTRY(visible, rates);
  const days = groupByDay(visible);

  const confirmDelete = (e: ExpenseLog) =>
    confirmAction({
      title: 'Harcama silinsin mi?',
      message: `${expenseTitle(e)} · ${formatMoney(e.amount, e.currency || 'TRY')}. Kartla ödendiyse kart bakiyesi geri alınır.`,
      onConfirm: () => {
        deleteExpense(e.id);
        showToast('Harcama silindi');
      },
    });

  const openMenu = (e: ExpenseLog) =>
    showActionSheet({
      title: expenseTitle(e),
      options: [
        { label: 'Düzenle', icon: Pencil, onPress: () => navigation.navigate('ExpenseForm', { expenseId: e.id }) },
        { label: 'Sil', icon: Trash2, destructive: true, onPress: () => confirmDelete(e) },
      ],
    });

  const categoryOptions: ChipOption<string>[] = [
    { value: ALL, label: 'Tüm kategoriler' },
    ...categoryNames.map((name) => ({ value: name, label: name, color: metaFor(name).color })),
  ];

  return (
    <StackScreen
      title="Harcamalar"
      refreshing={refreshing}
      onRefresh={onRefresh}
      overlay={<FAB icon={Plus} label="Harcama" onPress={() => navigation.navigate('ExpenseForm')} />}
      contentClassName="pb-24"
    >
      <MonthSwitcher month={month} onChange={setMonth} />
      <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Harcama ara" returnKeyType="search" clearButtonMode="while-editing" />
      <View style={tw`gap-2`}>
        <ChipRow options={SCOPES} value={scope} onChange={setScope} />
        {categoryNames.length > 1 ? <ChipRow options={categoryOptions} value={activeCategory} onChange={setCategory} /> : null}
      </View>

      <Card className="flex-row items-center justify-between">
        <View>
          <Text variant="footnote" tone="muted" weight="semibold">
            Toplam
          </Text>
          <Text variant="title" numberOfLines={1}>
            {formatMoney(Math.round(total * 100) / 100)}
          </Text>
        </View>
        <Text variant="subhead" tone="muted">
          {visible.length} harcama
        </Text>
      </Card>

      {days.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={q || activeCategory !== ALL || scope !== 'ALL' ? 'Sonuç bulunamadı' : 'Bu ay harcama yok'}
          message={q || activeCategory !== ALL || scope !== 'ALL' ? 'Filtreleri değiştirmeyi dene.' : 'Harcamalarını ekledikçe burada gün gün listelenir.'}
          action={{ label: 'Harcama Ekle', icon: Plus, onPress: () => navigation.navigate('ExpenseForm') }}
        />
      ) : (
        days.map(({ day, items }) => (
          <View key={day} style={tw`gap-1.5`}>
            <View style={tw`flex-row items-center justify-between px-4`}>
              <Text variant="overline" tone="muted">
                {formatDay(day)}
              </Text>
              <Text variant="overline" tone="muted">
                {formatMoney(Math.round(sumTRY(items, rates)))}
              </Text>
            </View>
            <ListGroup>
              {items.map((e) => {
                const meta = metaFor(e.categoryName);
                return (
                  <Row
                    key={e.id}
                    left={<IconTile icon={meta.icon} color={meta.color} size="sm" />}
                    title={expenseTitle(e)}
                    subtitle={[e.categoryName, e.cardName || e.paymentMethod].filter(Boolean).join(' · ')}
                    value={formatMoney(e.amount, e.currency || 'TRY')}
                    valueTone="default"
                    onPress={() => navigation.navigate('ExpenseDetail', { expenseId: e.id })}
                    onLongPress={() => openMenu(e)}
                    right={
                      <Pressable onPress={() => openMenu(e)} accessibilityRole="button" accessibilityLabel="Diğer işlemler" hitSlop={10}>
                        <MoreHorizontal {...ic('w-5 h-5 text-slate-400')} />
                      </Pressable>
                    }
                    chevron={false}
                  />
                );
              })}
            </ListGroup>
          </View>
        ))
      )}
    </StackScreen>
  );
};
