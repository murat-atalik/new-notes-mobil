import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ChevronLeft, ChevronRight, CreditCard, PieChart, PiggyBank, Plus, type LucideIcon } from 'lucide-react-native';

import { Btn, Card, Gradient, IconButton, IconTile, ListGroup, ProgressBar, Row, Screen, Section, Stat, Text, iconByName, palette } from '../../design';
import { formatMoney, formatMonth, monthKey, shiftMonth } from '../../logic/format';
import { CARD_TYPE_META, cardAvailable, categoryBreakdown, expensesInMonth, netWorth, sumTRY, useFinance } from '../../logic/selectors';
import { useAppNavigation } from '../../navigation/types';
import { ic, tw } from '../../lib/tw';
import { expenseSubtitle, expenseTitle, useCategoryMeta, useMonthState, useRefresh } from './shared';

const QuickAction: React.FC<{ icon: LucideIcon; label: string; color: string; onPress: () => void }> = ({ icon: Icon, label, color, onPress }) => (
  <Btn onPress={onPress} accessibilityLabel={label} className="flex-1 items-center gap-1.5">
    <View style={[tw`w-14 h-14 rounded-full items-center justify-center`, { backgroundColor: `${color}22` }]}>
      <Icon size={24} color={color} strokeWidth={2.2} />
    </View>
    <Text variant="caption" weight="semibold" className="text-center" numberOfLines={1}>
      {label}
    </Text>
  </Btn>
);

export const WalletScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const { expenses, cards, savings, rates, monthlyBudget, monthlyIncome } = useFinance();
  const [month, setMonth] = useMonthState();
  const { refreshing, onRefresh } = useRefresh();
  const metaFor = useCategoryMeta();

  const monthExpenses = expensesInMonth(expenses, month);
  const spent = sumTRY(monthExpenses, rates);
  const remaining = monthlyBudget - spent;
  const budgetPct = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
  const worth = netWorth(cards, savings, rates);
  const recent = monthExpenses.slice(0, 5);
  const topCategories = categoryBreakdown(monthExpenses, rates).slice(0, 4);
  const isCurrent = month >= monthKey();

  const monthSwitch = (
    <>
      <IconButton icon={ChevronLeft} label="Önceki ay" onPress={() => setMonth(shiftMonth(month, -1))} />
      <View style={isCurrent ? tw`opacity-40` : undefined} pointerEvents={isCurrent ? 'none' : 'auto'}>
        <IconButton icon={ChevronRight} label="Sonraki ay" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>
    </>
  );

  return (
    <Screen title="Cüzdan" subtitle={formatMonth(month)} right={monthSwitch} refreshing={refreshing} onRefresh={onRefresh}>
      {/* Hero */}
      <Pressable onPress={() => navigation.navigate('Budget')} accessibilityRole="button" accessibilityLabel="Bütçe ve gelir">
        <Gradient colors={['emerald-500', 'teal-600']} dir="br" className="rounded-3xl p-5 gap-4">
          <View style={tw`gap-1`}>
            <Text variant="footnote" tone="inverse" weight="semibold" className="opacity-80">
              Bu ay harcanan
            </Text>
            <Text variant="amount" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(spent)}
            </Text>
          </View>
          <View style={tw`gap-2`}>
            <ProgressBar
              value={budgetPct}
              color={budgetPct >= 100 ? '#fecdd3' : '#ffffff'}
              trackClassName="bg-white/25"
            />
            <View style={tw`flex-row justify-between`}>
              <Text variant="footnote" tone="inverse" weight="semibold">
                {monthlyBudget > 0
                  ? remaining >= 0
                    ? `${formatMoney(remaining)} kaldı`
                    : `${formatMoney(-remaining)} aşıldı`
                  : 'Bütçe belirlenmedi'}
              </Text>
              <Text variant="footnote" tone="inverse" className="opacity-80">
                {monthlyBudget > 0 ? `${formatMoney(monthlyBudget)} bütçe` : 'Belirlemek için dokun'}
              </Text>
            </View>
          </View>
          <View style={tw`flex-row justify-between items-center border-t border-white/20 pt-3`}>
            <Text variant="footnote" tone="inverse" className="opacity-80">
              Aylık gelir
            </Text>
            <Text variant="callout" tone="inverse" weight="bold">
              {formatMoney(monthlyIncome)}
            </Text>
          </View>
        </Gradient>
      </Pressable>

      {/* Quick actions */}
      <View style={tw`flex-row`}>
        <QuickAction icon={Plus} label="Harcama Ekle" color={palette.brand} onPress={() => navigation.navigate('ExpenseForm')} />
        <QuickAction icon={CreditCard} label="Kartlar" color={palette.info} onPress={() => navigation.navigate('Cards')} />
        <QuickAction icon={PiggyBank} label="Birikim" color={palette.warning} onPress={() => navigation.navigate('Savings')} />
        <QuickAction icon={PieChart} label="Raporlar" color="#db2777" onPress={() => navigation.navigate('Reports', { month })} />
      </View>

      {/* Cards */}
      <Section title="Kartlar & Hesaplar" action={{ label: 'Tümü', onPress: () => navigation.navigate('Cards') }}>
        {cards.length === 0 ? (
          <Card onPress={() => navigation.navigate('CardForm')} className="flex-row items-center gap-3">
            <IconTile icon={CreditCard} color={palette.info} />
            <View style={tw`flex-1`}>
              <Text variant="callout" weight="semibold">
                İlk kartını ekle
              </Text>
              <Text variant="footnote" tone="muted">
                Kredi, banka, yemek kartı veya nakit cüzdan
              </Text>
            </View>
            <Plus {...ic('w-5 h-5 text-emerald-600')} />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 px-1`} style={tw`-mx-1`}>
            {cards.map((card) => {
              const meta = CARD_TYPE_META[card.type];
              const Icon = iconByName(meta.icon);
              return (
                <Btn
                  key={card.id}
                  onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
                  accessibilityLabel={card.name}
                  className="w-40 h-28 rounded-3xl p-3.5 justify-between"
                  style={{ backgroundColor: card.color || palette.slate500 }}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <Icon size={18} color="#fff" />
                    <Text variant="caption" tone="inverse" weight="semibold" className="opacity-80" numberOfLines={1}>
                      {meta.label}
                    </Text>
                  </View>
                  <View>
                    <Text variant="footnote" tone="inverse" weight="semibold" numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text variant="headline" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
                      {formatMoney(cardAvailable(card), card.currency || 'TRY')}
                    </Text>
                  </View>
                </Btn>
              );
            })}
            <Btn
              onPress={() => navigation.navigate('CardForm')}
              accessibilityLabel="Kart ekle"
              className="w-24 h-28 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 items-center justify-center gap-1"
            >
              <Plus {...ic('w-6 h-6 text-slate-400')} />
              <Text variant="footnote" tone="muted" weight="semibold">
                Ekle
              </Text>
            </Btn>
          </ScrollView>
        )}
      </Section>

      {/* Net worth */}
      <Section title="Net Varlık">
        <Card onPress={() => navigation.navigate('Savings')} className="gap-3">
          <View style={tw`flex-row items-center justify-between`}>
            <Text variant="title" tone={worth.total < 0 ? 'danger' : 'default'} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(worth.total)}
            </Text>
            <ChevronRight {...ic('w-5 h-5 text-slate-300 dark:text-slate-600')} />
          </View>
          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <Stat label="Nakit & Hesap" value={formatMoney(worth.liquid)} />
            </View>
            <View style={tw`flex-1`}>
              <Stat label="Birikim" value={formatMoney(worth.savingsTotal)} tone="brand" />
            </View>
            <View style={tw`flex-1`}>
              <Stat label="Kart Borcu" value={formatMoney(worth.creditDebt)} tone={worth.creditDebt > 0 ? 'danger' : 'default'} />
            </View>
          </View>
        </Card>
      </Section>

      {/* Recent expenses */}
      <Section title="Son Harcamalar" action={{ label: 'Tümü', onPress: () => navigation.navigate('Expenses', { month }) }}>
        {recent.length === 0 ? (
          <Card onPress={() => navigation.navigate('ExpenseForm')} className="flex-row items-center gap-3">
            <IconTile icon="Receipt" color={palette.brand} />
            <View style={tw`flex-1`}>
              <Text variant="callout" weight="semibold">
                Bu ay harcama yok
              </Text>
              <Text variant="footnote" tone="muted">
                İlk harcamanı eklemek için dokun
              </Text>
            </View>
            <Plus {...ic('w-5 h-5 text-emerald-600')} />
          </Card>
        ) : (
          <ListGroup>
            {recent.map((e) => {
              const meta = metaFor(e.categoryName);
              return (
                <Row
                  key={e.id}
                  left={<IconTile icon={meta.icon} color={meta.color} size="sm" />}
                  title={expenseTitle(e)}
                  subtitle={expenseSubtitle(e)}
                  value={formatMoney(e.amount, e.currency || 'TRY')}
                  valueTone="default"
                  tint={meta.color}
                  onPress={() => navigation.navigate('ExpenseDetail', { expenseId: e.id })}
                />
              );
            })}
          </ListGroup>
        )}
      </Section>

      {/* Categories */}
      {topCategories.length > 0 ? (
        <Section title="Kategoriler" action={{ label: 'Rapor', onPress: () => navigation.navigate('Reports', { month }) }}>
          <Card onPress={() => navigation.navigate('Reports', { month })} className="gap-3.5">
            {topCategories.map((c) => {
              const meta = metaFor(c.name);
              return (
                <View key={c.name} style={tw`gap-1.5`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: meta.color }]} />
                    <Text variant="subhead" weight="semibold" className="flex-1" numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text variant="subhead" tone="muted">
                      {formatMoney(Math.round(c.amount))}
                    </Text>
                  </View>
                  <ProgressBar value={c.percent} color={meta.color} height={6} />
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
};
