import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '../strings/tr';
import { styles } from './styles';
import type { Expense, PaymentCard, SavingsGoal } from '../types';

type Props = {
  tab: 'finance' | 'analytics';
  expenses: Expense[];
  paymentCards: PaymentCard[];
  savingsGoals: SavingsGoal[];
};

export function OverviewScreen({ tab, expenses, paymentCards, savingsGoals }: Props) {
  const data = strings.overview[tab];
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingLists = 0;
  const chartBars = [
    {
      label: strings.overview.chart.expenses,
      value: totalExpenses > 0 ? 'chartBarFull' : 'chartBarEmpty',
    },
    {
      label: strings.overview.chart.cards,
      value: paymentCards.length > 0 ? 'chartBarThreeQuarter' : 'chartBarEmpty',
    },
    {
      label: strings.overview.chart.goals,
      value: savingsGoals.length > 0 ? 'chartBarHalf' : 'chartBarEmpty',
    },
  ] as const;
  return (
    <SafeAreaView style={styles.safeScreen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.lead}>{data.lead}</Text>
        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>₺{totalExpenses.toLocaleString('tr-TR')}</Text>
            <Text style={styles.metricLabel}>{strings.overview.metrics.expenses}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{paymentCards.length}</Text>
            <Text style={styles.metricLabel}>{strings.overview.metrics.cards}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {tab === 'analytics' ? pendingLists : savingsGoals.length}
            </Text>
            <Text style={styles.metricLabel}>
              {tab === 'analytics'
                ? strings.overview.metrics.pending
                : strings.overview.metrics.goals}
            </Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>
              {tab === 'finance' ? strings.icons.finance : strings.icons.analytics}
            </Text>
          </View>
          <Text style={styles.sectionLabel}>{data.sectionTitle.toLocaleUpperCase('tr')}</Text>
          <Text style={styles.lead}>{data.sectionBody}</Text>
          <View style={styles.chart}>
            {chartBars.map((bar) => (
              <View key={bar.label} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{bar.label}</Text>
                <View style={styles.chartTrack}>
                  <View style={[styles.chartBar, styles[bar.value]]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
