import React, { useState } from 'react';
import { View } from 'react-native';

import { AmountField, Card, EmptyState, FormScreen, SelectField, showToast, Text, TextField } from '../../design';
import { formatMoney, parseAmount } from '../../logic/format';
import { useFinance } from '../../logic/selectors';
import { formatAssetQuantityDisplay, getCurrencyRateInTRY, getCurrencyUnitConfig } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { isUnitAsset } from './assetShared';

const numStr = (n: number) => (n ? String(Math.round(n * 100) / 100).replace('.', ',') : '');

export const AssetTransactionScreen: React.FC<RootScreenProps<'AssetTransaction'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const { assetId, mode } = route.params;
  const asset = useAppStore((s) => s.savingsGoals.find((g) => g.id === assetId));
  const addSavingsContribution = useAppStore((s) => s.addSavingsContribution);
  const { cards, rates } = useFinance();

  const deposit = mode === 'DEPOSIT';
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cardId, setCardId] = useState(deposit ? asset?.linkedCardId ?? '' : '');
  const [note, setNote] = useState('');

  if (!asset) {
    return (
      <FormScreen title={deposit ? 'Para Ekle' : 'Para Çek'}>
        <EmptyState title="Birikim bulunamadı" />
      </FormScreen>
    );
  }

  const unit = isUnitAsset(asset.currency);
  const cfg = getCurrencyUnitConfig(asset.currency);
  const rate = unit ? getCurrencyRateInTRY(asset.currency, rates) : 1;
  const value = parseAmount(amount);
  const qty = parseAmount(quantity);
  const card = cards.find((c) => c.id === cardId);
  const current = asset.currentAmount || 0;
  const nextAmount = Math.max(0, current + (deposit ? value : -value));
  const nextQty = unit ? Math.max(0, (asset.unitQuantity || 0) + (deposit ? qty : -qty)) : 0;
  const overWithdraw = !deposit && value > current;
  const overQty = !deposit && unit && qty > (asset.unitQuantity || 0);
  const cardShort = deposit && card && card.type !== 'CREDIT_CARD' && value > (card.balance || 0);

  const onQuantity = (text: string) => {
    setQuantity(text);
    const q = parseAmount(text);
    if (q > 0) setAmount(numStr(q * rate));
  };

  const onSubmit = () => {
    if (value <= 0) return;
    addSavingsContribution(asset.id, {
      amount: value,
      unitQuantity: unit && qty > 0 ? qty : undefined,
      note: note.trim() || (deposit ? (card ? `${card.name} kartından birikime aktarıldı` : 'Birikim yatırıldı') : 'Birikimden çekildi/kullanıldı'),
      type: mode,
      cardId: card?.id,
      cardName: card?.name,
    });
    showToast(deposit ? 'Birikime eklendi' : 'Birikimden çekildi');
    navigation.goBack();
  };

  const cardOptions = [
    { value: '', label: deposit ? 'Kart yok (dışarıdan)' : 'Karta aktarma' },
    ...cards.map((c) => ({
      value: c.id,
      label: `${c.name} · ${c.type === 'CREDIT_CARD' ? `Borç ${formatMoney(c.currentDebt || 0)}` : `Bakiye ${formatMoney(c.balance || 0, c.currency || 'TRY')}`}`,
    })),
  ];

  return (
    <FormScreen title={deposit ? 'Para Ekle' : 'Para Çek'} onSubmit={onSubmit} submitDisabled={value <= 0 || overQty}>
      <View>
        <AmountField value={amount} onChangeText={setAmount} label={asset.title} autoFocus={!unit} tone={deposit ? 'success' : 'danger'} />
        <Card className="gap-1">
          <View style={tw`flex-row justify-between`}>
            <Text variant="footnote" tone="muted">
              Güncel tutar
            </Text>
            <Text variant="footnote" weight="semibold">
              {formatMoney(current)}
            </Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text variant="footnote" tone="muted">
              İşlem sonrası
            </Text>
            <Text variant="footnote" weight="bold" tone={overWithdraw ? 'danger' : deposit ? 'success' : 'default'}>
              {formatMoney(nextAmount)}
            </Text>
          </View>
          {unit ? (
            <View style={tw`flex-row justify-between`}>
              <Text variant="footnote" tone="muted">
                Miktar
              </Text>
              <Text variant="footnote" weight="semibold">
                {`${formatAssetQuantityDisplay(asset.unitQuantity, asset.currency) ?? `0 ${cfg.unitSuffix}`} → ${nextQty.toLocaleString('tr-TR')} ${cfg.unitSuffix}`}
              </Text>
            </View>
          ) : null}
          {overWithdraw ? (
            <Text variant="caption" tone="danger">
              Tutar birikimden fazla; birikim sıfırlanır.
            </Text>
          ) : null}
        </Card>
      </View>

      {unit ? (
        <TextField
          label={`Miktar (${cfg.unitSuffix})`}
          value={quantity}
          onChangeText={onQuantity}
          keyboardType="decimal-pad"
          placeholder="Örn. 1"
          autoFocus
          error={overQty ? 'Eldeki miktardan fazla' : undefined}
          hint={`Güncel kur: 1 ${cfg.unitSuffix} = ${formatMoney(rate, 'TRY', 2)} · tutar otomatik hesaplanır`}
        />
      ) : null}

      <SelectField
        label={deposit ? 'Kaynak kart (opsiyonel)' : 'Aktarılacak kart (opsiyonel)'}
        value={cardId}
        onChange={setCardId}
        options={cardOptions}
        placeholder="Seçin"
        error={cardShort ? 'Kart bakiyesi yetersiz; bakiye sıfırlanır.' : undefined}
        hint={
          card
            ? deposit
              ? card.type === 'CREDIT_CARD'
                ? 'Tutar kart borcuna eklenir.'
                : 'Tutar kart bakiyesinden düşülür.'
              : card.type === 'CREDIT_CARD'
                ? 'Tutar kart borcundan düşülür.'
                : 'Tutar kart bakiyesine eklenir.'
            : undefined
        }
      />

      <TextField label="Not" value={note} onChangeText={setNote} placeholder="Opsiyonel" />
    </FormScreen>
  );
};
