import React, { useState } from 'react';
import { View } from 'react-native';
import { CreditCard, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react-native';

import { Btn, Card, confirmAction, EmptyState, IconButton, ProgressBar, Section, showActionSheet, showToast, StackScreen, Stat, Text } from '../../design';
import { formatMoney } from '../../logic/format';
import { CARD_TYPE_META, netWorth, useFinance } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { PaymentCard } from '../../types';
import { CARD_TYPE_ORDER, CardVisual } from './cardShared';

export const CardsScreen: React.FC<RootScreenProps<'Cards'>> = () => {
  const navigation = useAppNavigation();
  const { cards, rates } = useFinance();
  const deletePaymentCard = useAppStore((s) => s.deletePaymentCard);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const [refreshing, setRefreshing] = useState(false);

  const totals = netWorth(cards, [], rates);
  const usage = totals.creditLimit ? (totals.creditDebt / totals.creditLimit) * 100 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await syncWithServer(false);
    setRefreshing(false);
  };

  const openMenu = (card: PaymentCard) =>
    showActionSheet({
      title: card.name,
      options: [
        { label: 'Düzenle', icon: Pencil, onPress: () => navigation.navigate('CardForm', { cardId: card.id }) },
        {
          label: 'Sil',
          icon: Trash2,
          destructive: true,
          onPress: () =>
            confirmAction({
              title: 'Kart silinsin mi?',
              message: `"${card.name}" ve işlem geçmişi silinecek.`,
              onConfirm: () => {
                deletePaymentCard(card.id);
                showToast('Kart silindi');
              },
            }),
        },
      ],
    });

  const groups = CARD_TYPE_ORDER.map((type) => ({ type, items: cards.filter((c) => c.type === type) })).filter((g) => g.items.length);

  return (
    <StackScreen
      title="Kartlar & Hesaplar"
      refreshing={refreshing}
      onRefresh={onRefresh}
      right={<IconButton icon={Plus} label="Kart ekle" variant="brand" onPress={() => navigation.navigate('CardForm')} />}
    >
      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="İlk kartını ekle"
          message="Kredi kartı, banka hesabı, yemek kartı ya da nakit cüzdanını ekle; harcamaların otomatik düşsün."
          action={{ label: 'Kart Ekle', icon: Plus, onPress: () => navigation.navigate('CardForm') }}
        />
      ) : (
        <>
          <Card className="gap-4">
            <View style={tw`flex-row gap-4`}>
              <View style={tw`flex-1`}>
                <Stat label="Toplam likit" value={formatMoney(totals.liquid)} tone="success" caption="Kredi kartları hariç" />
              </View>
              <View style={tw`flex-1`}>
                <Stat
                  label="Kredi borcu"
                  value={formatMoney(totals.creditDebt)}
                  tone={totals.creditDebt > 0 ? 'danger' : 'default'}
                  caption={`Limit ${formatMoney(totals.creditLimit)}`}
                />
              </View>
            </View>
            {totals.creditLimit > 0 ? (
              <View style={tw`gap-1.5`}>
                <ProgressBar value={usage} color={usage > 80 ? '#e11d48' : usage > 50 ? '#d97706' : '#6366f1'} />
                <Text variant="caption" tone="muted">
                  {`Limitin %${Math.round(usage)} kullanımda`}
                </Text>
              </View>
            ) : null}
          </Card>

          {groups.map((group) => (
            <Section key={group.type} title={CARD_TYPE_META[group.type].label}>
              <View style={tw`gap-3`}>
                {group.items.map((card) => (
                  <View key={card.id}>
                    <Btn
                      onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
                      onLongPress={() => openMenu(card)}
                      accessibilityLabel={card.name}
                    >
                      <CardVisual card={card} compact />
                    </Btn>
                    <View style={tw`flex-row items-center justify-between px-2 pt-1.5`}>
                      <Text variant="caption" tone="muted" numberOfLines={1} className="flex-1">
                        {`${(card.transactions || []).length} işlem${card.excludeFromReports ? ' · Raporlara dahil değil' : ''}`}
                      </Text>
                      <IconButton icon={MoreHorizontal} label="Diğer" variant="plain" onPress={() => openMenu(card)} />
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          ))}
        </>
      )}
    </StackScreen>
  );
};
