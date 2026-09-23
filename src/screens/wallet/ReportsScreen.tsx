import React, { useState } from 'react';
import { View } from 'react-native';
import { BarChart3, CreditCard, PieChart, Plus, TrendingDown, TrendingUp, Users } from 'lucide-react-native';

import { Badge, Card, EmptyState, Grid, ProgressBar, Segmented, StackScreen, Stat, Text, UserAvatar, palette, type SegmentOption } from '../../design';
import { BarChart, DonutChart } from '../../design/charts';
import { MONTHS_SHORT_TR, formatMoney, monthKey, shiftMonth } from '../../logic/format';
import { expenseInTRY, expensesInMonth, sumTRY, useFinance } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { ExpenseLog } from '../../types';
import { MonthSwitcher, expenseTitle, useCategoryMeta, useMonthState, useRefresh } from './shared';

type Tab = 'CATEGORY' | 'TREND' | 'PERSON' | 'CARD';

const TABS: SegmentOption<Tab>[] = [
  { value: 'CATEGORY', label: 'Kategori', icon: PieChart },
  { value: 'TREND', label: 'Trend', icon: BarChart3 },
  { value: 'PERSON', label: 'Kişi', icon: Users },
  { value: 'CARD', label: 'Kart', icon: CreditCard },
];

const FALLBACK_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#0ea5e9', '#ef4444', '#8b5cf6', '#84cc16', '#14b8a6', '#f97316'];

const money = (n: number) => formatMoney(Math.round(n));
const pctLabel = (n: number) => `%${n >= 10 || n === 0 ? Math.round(n) : n.toFixed(1).replace('.', ',')}`;

type Slice = { key: string; name: string; amount: number; percent: number; color: string; count: number };

function groupBy(expenses: ExpenseLog[], rates: Record<string, number>, keyOf: (e: ExpenseLog) => string): Omit<Slice, 'color' | 'name'>[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const key = keyOf(e);
    const cur = map.get(key) || { amount: 0, count: 0 };
    map.set(key, { amount: cur.amount + expenseInTRY(e, rates), count: cur.count + 1 });
  }
  const total = [...map.values()].reduce((s, v) => s + v.amount, 0);
  return [...map.entries()]
    .map(([key, v]) => ({ key, amount: v.amount, count: v.count, percent: total ? (v.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

const LegendRow: React.FC<{ slice: Slice; left?: React.ReactNode; showBar?: boolean }> = ({ slice, left, showBar }) => (
  <View style={tw`gap-1.5`}>
    <View style={tw`flex-row items-center gap-2.5`}>
      {left ?? <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: slice.color }]} />}
      <View style={tw`flex-1 min-w-0`}>
        <Text variant="subhead" weight="semibold" numberOfLines={1}>
          {slice.name}
        </Text>
        <Text variant="caption" tone="muted">
          {slice.count} harcama · {pctLabel(slice.percent)}
        </Text>
      </View>
      <Text variant="subhead" weight="bold">
        {money(slice.amount)}
      </Text>
    </View>
    {showBar ? <ProgressBar value={slice.percent} color={slice.color} height={6} /> : null}
  </View>
);

export const ReportsScreen: React.FC<RootScreenProps<'Reports'>> = ({ navigation, route }) => {
  const { expenses, cards, rates, monthlyBudget, user } = useFinance();
  const users = useAppStore((s) => s.users);
  const [month, setMonth] = useMonthState(route.params?.month);
  const [tab, setTab] = useState<Tab>('CATEGORY');
  const { refreshing, onRefresh } = useRefresh();
  const metaFor = useCategoryMeta();

  const monthExpenses = expensesInMonth(expenses, month);
  const total = sumTRY(monthExpenses, rates);

  // Summary
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const elapsedDays = month === monthKey() ? new Date().getDate() : daysInMonth;
  const dailyAvg = elapsedDays > 0 ? total / elapsedDays : 0;
  const biggest = monthExpenses.reduce<ExpenseLog | undefined>(
    (best, e) => (!best || expenseInTRY(e, rates) > expenseInTRY(best, rates) ? e : best),
    undefined,
  );
  const budgetPct = monthlyBudget > 0 ? (total / monthlyBudget) * 100 : 0;

  // Category
  const categorySlices: Slice[] = groupBy(monthExpenses, rates, (e) => e.categoryName || 'Diğer').map((s, i) => {
    const meta = metaFor(s.key);
    const color = meta.color === palette.slate500 ? FALLBACK_COLORS[i % FALLBACK_COLORS.length] : meta.color;
    return { ...s, name: s.key, color };
  });

  // Trend (6 months ending at the selected month)
  const trend = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonth(month, i - 5);
    const [, mm] = key.split('-').map(Number);
    return { key, label: MONTHS_SHORT_TR[mm - 1], total: Math.round(sumTRY(expensesInMonth(expenses, key), rates)) };
  });
  const trendWithData = trend.filter((t) => t.total > 0);
  const trendAvg = trendWithData.length ? trendWithData.reduce((s, t) => s + t.total, 0) / trendWithData.length : 0;
  const prevTotal = trend[4].total;
  const change = prevTotal > 0 ? ((trend[5].total - prevTotal) / prevTotal) * 100 : null;

  // Person
  const personSlices = groupBy(monthExpenses, rates, (e) => e.userId || 'unknown').map((s, i) => {
    const u = users.find((x) => x.id === s.key) ?? (user.id === s.key ? user : undefined);
    return { slice: { ...s, name: u ? (u.id === user.id ? `${u.name} (sen)` : u.name) : 'Bilinmeyen', color: u?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }, user: u };
  });

  // Card / payment method
  const cardSlices: Slice[] = groupBy(monthExpenses, rates, (e) => e.cardId || e.cardName || e.paymentMethod || 'Belirtilmedi').map((s, i) => {
    const card = cards.find((c) => c.id === s.key);
    const sample = monthExpenses.find((e) => (e.cardId || e.cardName || e.paymentMethod || 'Belirtilmedi') === s.key);
    return {
      ...s,
      name: card?.name || sample?.cardName || sample?.paymentMethod || 'Belirtilmedi',
      color: card?.color || FALLBACK_COLORS[(i + 3) % FALLBACK_COLORS.length],
    };
  });

  return (
    <StackScreen title="Raporlar" refreshing={refreshing} onRefresh={onRefresh}>
      <MonthSwitcher month={month} onChange={setMonth} />

      {monthExpenses.length === 0 && tab !== 'TREND' ? (
        <>
          <Segmented options={TABS} value={tab} onChange={setTab} />
          <EmptyState
            icon={PieChart}
            title="Bu ay harcama yok"
            message="Harcama ekledikçe kategori, kişi ve kart dağılımını burada görürsün."
            action={{ label: 'Harcama Ekle', icon: Plus, onPress: () => navigation.navigate('ExpenseForm') }}
          />
        </>
      ) : (
        <>
          <Grid cols={2} gap={3}>
            <Card>
              <Stat label="Toplam" value={money(total)} caption={`${monthExpenses.length} harcama`} />
            </Card>
            <Card>
              <Stat label="Günlük ortalama" value={money(dailyAvg)} caption={`${elapsedDays} gün`} />
            </Card>
            <Card onPress={biggest ? () => navigation.navigate('ExpenseDetail', { expenseId: biggest.id }) : undefined}>
              <Stat
                label="En büyük harcama"
                value={biggest ? formatMoney(biggest.amount, biggest.currency || 'TRY') : '—'}
                caption={biggest ? expenseTitle(biggest) : undefined}
              />
            </Card>
            <Card onPress={() => navigation.navigate('Budget')}>
              <Stat
                label="Bütçe kullanımı"
                value={monthlyBudget > 0 ? `%${Math.round(budgetPct)}` : '—'}
                tone={budgetPct > 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'default'}
                caption={monthlyBudget > 0 ? `${money(monthlyBudget)} bütçe` : 'Bütçe belirle'}
              />
            </Card>
          </Grid>

          <Segmented options={TABS} value={tab} onChange={setTab} />

          {tab === 'CATEGORY' ? (
            <Card className="gap-4">
              <View>
                <DonutChart
                  data={categorySlices.map((s) => ({ name: s.name, value: Math.round(s.amount), color: s.color }))}
                  height={220}
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={2}
                  formatter={(v, name) => [money(v), name]}
                />
                <View pointerEvents="none" style={tw`absolute inset-0 items-center justify-center`}>
                  <Text variant="caption" tone="muted" weight="semibold">
                    Toplam
                  </Text>
                  <Text variant="title2">{money(total)}</Text>
                </View>
              </View>
              <View style={tw`gap-3.5`}>
                {categorySlices.map((s) => (
                  <LegendRow key={s.key} slice={s} />
                ))}
              </View>
            </Card>
          ) : null}

          {tab === 'TREND' ? (
            <Card className="gap-3">
              <View style={tw`flex-row items-start justify-between gap-2`}>
                <View style={tw`flex-1`}>
                  <Text variant="headline">Son 6 ay</Text>
                  <Text variant="footnote" tone="muted">
                    Ortalama {money(trendAvg)} / ay
                  </Text>
                </View>
                {change !== null ? (
                  <Badge
                    label={`${change > 0 ? '+' : ''}${Math.round(change)}% önceki aya göre`}
                    tone={change > 0 ? 'danger' : 'brand'}
                    icon={change > 0 ? TrendingUp : TrendingDown}
                  />
                ) : null}
              </View>
              <BarChart
                data={trend.map((t) => ({ month: t.label, total: t.total }))}
                xKey="month"
                series={[{ dataKey: 'total', name: 'Harcama', color: palette.brandLight, radius: 8 }]}
                height={220}
                formatter={(v, name) => [money(v), name]}
              />
              <View style={tw`gap-2`}>
                {trend
                  .slice()
                  .reverse()
                  .map((t) => (
                    <View key={t.key} style={tw`flex-row items-center gap-3`}>
                      <Text variant="subhead" tone="muted" className="w-10">
                        {t.label}
                      </Text>
                      <View style={tw`flex-1`}>
                        <ProgressBar
                          value={Math.max(...trend.map((x) => x.total)) > 0 ? (t.total / Math.max(...trend.map((x) => x.total))) * 100 : 0}
                          color={t.key === month ? palette.brand : palette.slate400}
                          height={6}
                        />
                      </View>
                      <Text variant="subhead" weight={t.key === month ? 'bold' : 'medium'} className="w-24 text-right">
                        {money(t.total)}
                      </Text>
                    </View>
                  ))}
              </View>
            </Card>
          ) : null}

          {tab === 'PERSON' ? (
            <Card className="gap-4">
              {personSlices.map(({ slice, user: u }) => (
                <LegendRow
                  key={slice.key}
                  slice={slice}
                  showBar
                  left={<UserAvatar avatar={u?.avatar} name={u?.name || '?'} color={u?.color} size="md" />}
                />
              ))}
            </Card>
          ) : null}

          {tab === 'CARD' ? (
            <Card className="gap-4">
              {cardSlices.map((s) => (
                <LegendRow key={s.key} slice={s} showBar />
              ))}
            </Card>
          ) : null}
        </>
      )}
    </StackScreen>
  );
};
