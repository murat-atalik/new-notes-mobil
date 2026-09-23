import React, { useState } from 'react';
import { View } from 'react-native';
import { Banknote } from 'lucide-react-native';

import { AmountField, Card, FormScreen, ProgressBar, Text, TextField, palette, showToast } from '../../design';
import { formatMoney, parseAmount } from '../../logic/format';
import { expensesInMonth, sumTRY, useFinance } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';

const toInput = (n: number) => (n > 0 ? String(n).replace('.', ',') : '');

export const BudgetScreen: React.FC<RootScreenProps<'Budget'>> = ({ navigation }) => {
  const { expenses, rates, monthlyBudget, monthlyIncome } = useFinance();
  const setMonthlyBudget = useAppStore((s) => s.setMonthlyBudget);
  const setMonthlyIncome = useAppStore((s) => s.setMonthlyIncome);
  const [budget, setBudget] = useState(() => toInput(monthlyBudget));
  const [income, setIncome] = useState(() => toInput(monthlyIncome));

  const spent = sumTRY(expensesInMonth(expenses), rates);
  const budgetValue = parseAmount(budget);
  const incomeValue = parseAmount(income);
  const pct = budgetValue > 0 ? (spent / budgetValue) * 100 : 0;
  const over = budgetValue > 0 && spent > budgetValue;
  const barColor = over ? palette.danger : pct >= 80 ? palette.warning : palette.brandLight;

  const onSubmit = () => {
    setMonthlyBudget(budgetValue);
    setMonthlyIncome(incomeValue);
    showToast('Bütçe güncellendi');
    navigation.goBack();
  };

  return (
    <FormScreen title="Bütçe & Gelir" onSubmit={onSubmit}>
      <AmountField label="Aylık bütçe" value={budget} onChangeText={setBudget} autoFocus />

      <Card className="gap-2.5">
        <View style={tw`flex-row justify-between`}>
          <Text variant="subhead" weight="semibold">
            Bu ay harcanan
          </Text>
          <Text variant="subhead" weight="bold" tone={over ? 'danger' : 'default'}>
            {formatMoney(Math.round(spent))}
          </Text>
        </View>
        <ProgressBar value={pct} color={barColor} />
        <Text variant="footnote" tone={over ? 'danger' : 'muted'}>
          {budgetValue > 0
            ? over
              ? `Bütçeyi ${formatMoney(Math.round(spent - budgetValue))} aştın (%${Math.round(pct)}).`
              : `Bütçenin %${Math.round(pct)}'i kullanıldı · ${formatMoney(Math.round(budgetValue - spent))} kaldı.`
            : 'Bir bütçe belirlediğinde harcamaların buna göre takip edilir.'}
        </Text>
      </Card>

      <TextField
        label="Aylık gelir"
        icon={Banknote}
        value={income}
        onChangeText={(t) => setIncome(t.replace(/[^\d.,]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0"
        hint={
          incomeValue > 0
            ? `Gelirin %${Math.round((spent / incomeValue) * 100)}'i bu ay harcandı · kalan ${formatMoney(Math.round(incomeValue - spent))}`
            : 'Maaş ve düzenli gelirlerinin toplamı.'
        }
      />
    </FormScreen>
  );
};
