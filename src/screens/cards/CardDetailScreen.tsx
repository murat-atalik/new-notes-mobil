import React from 'react';
import { View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Minus, Pencil, Plus, Receipt, Trash2 } from 'lucide-react-native';

import {
  Button,
  Card,
  confirmAction,
  EmptyState,
  IconButton,
  IconTile,
  ListGroup,
  palette,
  ProgressBar,
  Row,
  Section,
  showToast,
  StackScreen,
  Stat,
  SwitchRow,
  Text,
} from '../../design';
import { formatDay, formatMoney } from '../../logic/format';
import { CARD_TYPE_META, isCreditCard } from '../../logic/selectors';
import { getCreditCardBillingCycles, isDateInCycle } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { CardTransaction } from '../../types';
import { CardVisual, daysLeftLabel, daysUntilDayOfMonth } from './cardShared';

function groupTransactions(txs: CardTransaction[]) {
  const map = new Map<string, CardTransaction[]>();
  for (const t of txs) {
    const day = (t.date || '').split('T')[0];
    map.set(day, [...(map.get(day) || []), t]);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, items]) => ({ day, items }));
}

export const CardDetailScreen: React.FC<RootScreenProps<'CardDetail'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const { cardId } = route.params;
  const card = useAppStore((s) => s.paymentCards.find((c) => c.id === cardId));
  const updatePaymentCard = useAppStore((s) => s.updatePaymentCard);
  const deletePaymentCard = useAppStore((s) => s.deletePaymentCard);

  if (!card) {
    return (
      <StackScreen title="Kart">
        <EmptyState title="Kart bulunamadı" message="Bu kart silinmiş olabilir." action={{ label: 'Geri dön', onPress: () => navigation.goBack() }} />
      </StackScreen>
    );
  }

  const credit = isCreditCard(card);
  const food = card.type === 'FOOD_CARD';
  const currency = credit ? 'TRY' : card.currency || 'TRY';
  const txs = card.transactions || [];
  const limit = card.creditLimit || 0;
  const debt = card.currentDebt || 0;
  const usage = limit ? (debt / limit) * 100 : 0;

  const cycle = credit ? getCreditCardBillingCycles(card.cutoffDay, card.dueDay).find((c) => c.id === 'CURRENT') : undefined;
  const cycleSpend = cycle
    ? txs.filter((t) => t.type === 'SPEND' && isDateInCycle(t.date, cycle.startDate, cycle.endDate)).reduce((s, t) => s + (Number(t.amount) || 0), 0)
    : 0;

  const onDelete = () =>
    confirmAction({
      title: 'Kart silinsin mi?',
      message: `"${card.name}" ve işlem geçmişi silinecek.`,
      onConfirm: () => {
        deletePaymentCard(card.id);
        showToast('Kart silindi');
        navigation.goBack();
      },
    });

  const actions: { label: string; icon: typeof Plus; onPress: () => void; color: string }[] = [
    { label: 'Harcama', icon: Minus, color: palette.danger, onPress: () => navigation.navigate('CardTransaction', { cardId, mode: 'SPEND' }) },
    {
      label: credit ? 'Borç Öde' : 'Yükle',
      icon: Plus,
      color: palette.brand,
      onPress: () => navigation.navigate('CardTransaction', { cardId, mode: 'TOP_UP' }),
    },
    { label: 'Düzenle', icon: Pencil, color: palette.info, onPress: () => navigation.navigate('CardForm', { cardId }) },
  ];

  return (
    <StackScreen
      title={card.name}
      subtitle={CARD_TYPE_META[card.type]?.label}
      right={<IconButton icon={Pencil} label="Düzenle" variant="plain" onPress={() => navigation.navigate('CardForm', { cardId })} />}
    >
      <CardVisual card={card} />

      <View style={tw`flex-row gap-3`}>
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Card key={a.label} className="flex-1 items-center gap-1.5 py-3" onPress={a.onPress}>
              <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: `${a.color}1f` }]}>
                <Icon size={22} color={a.color} strokeWidth={2.4} />
              </View>
              <Text variant="subhead" weight="semibold">
                {a.label}
              </Text>
            </Card>
          );
        })}
      </View>

      {credit ? (
        <Card className="gap-4">
          <View style={tw`flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <Stat label="Güncel borç" value={formatMoney(debt)} tone={debt > 0 ? 'danger' : 'default'} />
            </View>
            <View style={tw`flex-1`}>
              <Stat label="Kullanılabilir" value={formatMoney(Math.max(0, limit - debt))} tone="success" caption={`Limit ${formatMoney(limit)}`} />
            </View>
          </View>
          {limit > 0 ? (
            <View style={tw`gap-1.5`}>
              <ProgressBar value={usage} color={usage > 80 ? palette.danger : usage > 50 ? palette.warning : palette.info} />
              <Text variant="caption" tone="muted">{`Limitin %${Math.round(usage)} kullanımda`}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {credit ? (
        <ListGroup header="Ekstre" footer={cycle ? `Dönem: ${cycle.shortLabel}` : undefined}>
          <Row
            icon={CalendarClock}
            iconColor={palette.info}
            title="Hesap kesim"
            subtitle={card.cutoffDay ? `Her ayın ${card.cutoffDay}. günü` : 'Belirtilmedi'}
            value={card.cutoffDay ? daysLeftLabel(daysUntilDayOfMonth(card.cutoffDay)) : undefined}
          />
          <Row
            icon={CalendarClock}
            iconColor={palette.danger}
            title="Son ödeme"
            subtitle={card.dueDay ? `Her ayın ${card.dueDay}. günü` : 'Belirtilmedi'}
            value={card.dueDay ? daysLeftLabel(daysUntilDayOfMonth(card.dueDay)) : undefined}
            valueTone={card.dueDay && daysUntilDayOfMonth(card.dueDay) <= 3 ? 'danger' : 'muted'}
          />
          <Row icon={Receipt} iconColor={palette.warning} title="Bu dönem harcama" value={formatMoney(cycleSpend)} valueTone="default" />
        </ListGroup>
      ) : null}

      {food ? (
        <ListGroup header="Yemek kartı">
          <Row icon="Utensils" iconColor={palette.warning} title="Aylık yükleme" value={formatMoney(card.monthlyAllowance || 0)} valueTone="default" />
          <Row icon="Wallet" iconColor={palette.brand} title="Kalan bakiye" value={formatMoney(card.balance || 0)} valueTone="default" />
        </ListGroup>
      ) : null}

      <Section title="İşlemler">
        {txs.length === 0 ? (
          <Card>
            <EmptyState
              icon={Receipt}
              title="Henüz işlem yok"
              message="Bu karttan yaptığın harcamalar ve yüklemeler burada görünür."
              action={{ label: 'Harcama ekle', icon: Minus, onPress: () => navigation.navigate('CardTransaction', { cardId, mode: 'SPEND' }) }}
            />
          </Card>
        ) : (
          <View style={tw`gap-4`}>
            {groupTransactions(txs).map((group) => (
              <ListGroup key={group.day} header={formatDay(group.day)}>
                {group.items.map((t) => {
                  const spend = t.type === 'SPEND';
                  return (
                    <Row
                      key={t.id}
                      left={
                        <IconTile icon={spend ? ArrowUpRight : ArrowDownLeft} color={spend ? palette.danger : palette.brand} size="sm" />
                      }
                      title={t.title || (spend ? 'Harcama' : 'Yükleme')}
                      subtitle={[t.categoryName, t.note && t.note !== t.title ? t.note : undefined].filter(Boolean).join(' · ') || undefined}
                      value={`${spend ? '−' : '+'}${formatMoney(t.amount, currency)}`}
                      valueTone={spend ? 'danger' : 'success'}
                    />
                  );
                })}
              </ListGroup>
            ))}
          </View>
        )}
      </Section>

      <ListGroup footer="Kapalıysa bu kart net varlık ve raporlarda hesaba katılmaz.">
        <SwitchRow
          title="Raporlara dahil et"
          icon="ChartPie"
          iconColor={palette.info}
          value={!card.excludeFromReports}
          onValueChange={(v) => updatePaymentCard(card.id, { excludeFromReports: !v })}
        />
      </ListGroup>

      <Button title="Kartı Sil" variant="dangerTinted" icon={Trash2} onPress={onDelete} fullWidth />
    </StackScreen>
  );
};
