import React, { useState } from 'react';
import { View } from 'react-native';

import { AmountField, Card, DateField, EmptyState, FormScreen, showToast, SwatchField, Text, TextField, type SwatchOption } from '../../design';
import { formatMoney, isoDate, parseAmount } from '../../logic/format';
import { isCreditCard } from '../../logic/selectors';
import { getCurrencySymbol } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { SPEND_CATEGORIES } from './cardShared';

export const CardTransactionScreen: React.FC<RootScreenProps<'CardTransaction'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const { cardId, mode } = route.params;
  const card = useAppStore((s) => s.paymentCards.find((c) => c.id === cardId));
  const currentUser = useAppStore((s) => s.currentUser);
  const addDirectExpense = useAppStore((s) => s.addDirectExpense);
  const topUpCardBalance = useAppStore((s) => s.topUpCardBalance);

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SPEND_CATEGORIES[0].name);
  const [date, setDate] = useState(isoDate());
  const [note, setNote] = useState('');

  if (!card) {
    return (
      <FormScreen title="İşlem">
        <EmptyState title="Kart bulunamadı" />
      </FormScreen>
    );
  }

  const credit = isCreditCard(card);
  const spend = mode === 'SPEND';
  const currency = credit ? 'TRY' : card.currency || 'TRY';
  const value = parseAmount(amount);
  const screenTitle = spend ? 'Harcama Ekle' : credit ? 'Borç Öde' : 'Bakiye Yükle';
  const categorySwatches: SwatchOption[] = SPEND_CATEGORIES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }));

  // Preview mirrors the store rules (spend: balance floors at 0 / debt grows; top-up on credit = payment).
  const debt = card.currentDebt || 0;
  const balance = card.balance || 0;
  const nextDebt = spend ? debt + value : Math.max(0, debt - value);
  const nextBalance = spend ? Math.max(0, balance - value) : balance + value;
  const overBalance = spend && !credit && value > balance;
  const overLimit = spend && credit && (card.creditLimit || 0) > 0 && nextDebt > (card.creditLimit || 0);

  const onSubmit = () => {
    if (value <= 0) return;
    if (spend) {
      // Same as the web: addDirectExpense logs the expense AND records the card transaction
      // (balance/debt). Calling spendFromCard as well would double count.
      const label = title.trim() || (card.type === 'FOOD_CARD' ? 'Yemek Harcaması' : 'Kart Harcaması');
      addDirectExpense({
        userId: currentUser.id,
        familyId: currentUser.familyId,
        isShared: card.isShared !== false,
        amount: value,
        currency,
        categoryName: category,
        date,
        itemCount: 1,
        itemsSummary: [label],
        type: 'DIRECT_EXPENSE',
        paymentMethod: card.type === 'FOOD_CARD' ? 'Yemek Kartı' : card.name,
        cardId: card.id,
        cardName: card.name,
        cardType: card.type,
        note: note.trim() || undefined,
      });
      showToast('Harcama eklendi');
    } else {
      topUpCardBalance(card.id, value, note.trim() || undefined);
      showToast(credit ? 'Ödeme kaydedildi' : 'Bakiye yüklendi');
    }
    navigation.goBack();
  };

  return (
    <FormScreen title={screenTitle} onSubmit={onSubmit} submitDisabled={value <= 0}>
      <View>
        <AmountField
          value={amount}
          onChangeText={setAmount}
          currencySymbol={getCurrencySymbol(currency)}
          label={card.name}
          autoFocus
          tone={spend ? 'danger' : 'success'}
        />
        <Card className="gap-1">
          <View style={tw`flex-row justify-between`}>
            <Text variant="footnote" tone="muted">
              {credit ? 'Güncel borç' : 'Güncel bakiye'}
            </Text>
            <Text variant="footnote" weight="semibold">
              {formatMoney(credit ? debt : balance, currency)}
            </Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text variant="footnote" tone="muted">
              {credit ? 'İşlem sonrası borç' : 'İşlem sonrası bakiye'}
            </Text>
            <Text variant="footnote" weight="bold" tone={overBalance || overLimit ? 'danger' : spend ? 'default' : 'success'}>
              {formatMoney(credit ? nextDebt : nextBalance, currency)}
            </Text>
          </View>
          {overBalance ? (
            <Text variant="caption" tone="danger">
              Tutar bakiyeden fazla; bakiye sıfırlanır.
            </Text>
          ) : null}
          {overLimit ? (
            <Text variant="caption" tone="danger">
              Bu harcama kart limitini aşıyor.
            </Text>
          ) : null}
          {!spend && credit && value > debt && debt > 0 ? (
            <Text variant="caption" tone="warning">
              Ödeme borçtan fazla; borç sıfırlanır.
            </Text>
          ) : null}
        </Card>
      </View>

      {spend ? (
        <>
          <TextField
            label="Açıklama"
            value={title}
            onChangeText={setTitle}
            placeholder={card.type === 'FOOD_CARD' ? 'Örn. Öğle yemeği' : 'Örn. Market alışverişi'}
            returnKeyType="done"
          />
          <SwatchField label="Kategori" value={category} onChange={setCategory} options={categorySwatches} sheetTitle="Kategori seç" />
          <DateField label="Tarih" value={date} onChange={setDate} />
        </>
      ) : null}

      <TextField
        label="Not"
        value={note}
        onChangeText={setNote}
        placeholder={spend ? 'Opsiyonel' : credit ? 'Örn. Eylül ekstresi' : 'Örn. Maaş yatışı'}
        hint={spend ? 'Harcama, giderlerine de eklenir.' : undefined}
      />
    </FormScreen>
  );
};
