import React from 'react';
import { View } from 'react-native';
import { Calendar, CreditCard, FileText, ListChecks, Pencil, Receipt, Trash2, UserRound, Users } from 'lucide-react-native';

import { Badge, Button, Card, EmptyState, IconTile, ListGroup, Row, StackScreen, Text, UserAvatar, confirmAction, showToast } from '../../design';
import { formatMoney, parseDate } from '../../logic/format';
import { CARD_TYPE_META, expenseInTRY } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import { expenseTitle, useCategoryMeta } from './shared';

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function longDate(value?: string): string {
  const date = parseDate(value);
  if (!date) return '—';
  return `${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${WEEKDAYS[date.getDay()]}`;
}

export const ExpenseDetailScreen: React.FC<RootScreenProps<'ExpenseDetail'>> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  const expense = useAppStore((s) => s.expenses.find((e) => e.id === expenseId));
  const card = useAppStore((s) => (expense?.cardId ? s.paymentCards.find((c) => c.id === expense.cardId) : undefined));
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const rates = useAppStore((s) => s.exchangeRates);
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const metaFor = useCategoryMeta();

  if (!expense) {
    return (
      <StackScreen title="Harcama">
        <EmptyState icon={Receipt} title="Harcama bulunamadı" message="Silinmiş veya erişimin olmayan bir harcama olabilir." />
      </StackScreen>
    );
  }

  const meta = metaFor(expense.categoryName);
  const currency = expense.currency || 'TRY';
  const creator = users.find((u) => u.id === expense.userId) ?? (currentUser.id === expense.userId ? currentUser : undefined);
  const isCheckout = expense.type === 'SHOPPING_CHECKOUT' || !!expense.listId;
  const items = expense.itemsSummary || [];
  const title = expenseTitle(expense);
  const methodLabel = expense.cardName || expense.paymentMethod || 'Belirtilmedi';
  const methodSub = card ? CARD_TYPE_META[card.type].label : expense.cardType ? CARD_TYPE_META[expense.cardType].label : undefined;

  const onDelete = () =>
    confirmAction({
      title: 'Harcama silinsin mi?',
      message: card ? `${card.name} üzerindeki işlem de geri alınır.` : 'Bu işlem geri alınamaz.',
      onConfirm: () => {
        deleteExpense(expense.id);
        showToast('Harcama silindi');
        navigation.goBack();
      },
    });

  return (
    <StackScreen
      title="Harcama"
      footer={
        <View style={tw`flex-row gap-3`}>
          <View style={tw`flex-1`}>
            <Button title="Düzenle" icon={Pencil} variant="secondary" onPress={() => navigation.navigate('ExpenseForm', { expenseId: expense.id })} />
          </View>
          <View style={tw`flex-1`}>
            <Button title="Sil" icon={Trash2} variant="dangerTinted" onPress={onDelete} />
          </View>
        </View>
      }
    >
      <View style={tw`items-center gap-3 pt-2`}>
        <IconTile icon={meta.icon} color={meta.color} size="lg" />
        <Text variant="amount" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(expense.amount, currency)}
        </Text>
        {currency !== 'TRY' ? (
          <Text variant="footnote" tone="muted">
            ≈ {formatMoney(Math.round(expenseInTRY(expense, rates)))}
          </Text>
        ) : null}
        <Text variant="headline" className="text-center" numberOfLines={2}>
          {title}
        </Text>
        <View style={tw`flex-row gap-2`}>
          <Badge label={meta.name} tone="neutral" />
          {expense.isShared === false ? <Badge label="Kişisel" icon={UserRound} tone="info" /> : <Badge label="Aile harcaması" icon={Users} tone="brand" />}
        </View>
      </View>

      <ListGroup>
        <Row icon={Calendar} iconColor="#6366f1" title={longDate(expense.date)} subtitle="Tarih" chevron={false} />
        <Row
          icon={CreditCard}
          iconColor={card?.color || '#0ea5e9'}
          title={methodLabel}
          subtitle={methodSub ? `Ödeme · ${methodSub}` : 'Ödeme yöntemi'}
          onPress={card ? () => navigation.navigate('CardDetail', { cardId: card.id }) : undefined}
        />
        {creator ? (
          <Row
            left={<UserAvatar avatar={creator.avatar} name={creator.name} color={creator.color} size="md" />}
            title={creator.id === currentUser.id ? `${creator.name} (sen)` : creator.name}
            subtitle="Ekleyen"
            chevron={false}
          />
        ) : null}
      </ListGroup>

      {isCheckout ? (
        <Card className="gap-3">
          <View style={tw`flex-row items-center gap-2`}>
            <ListChecks size={18} color="#10b981" />
            <Text variant="callout" weight="semibold" className="flex-1" numberOfLines={1}>
              {expense.listTitle || 'Alışveriş listesi'}
            </Text>
            {expense.itemCount ? (
              <Text variant="footnote" tone="muted">
                {expense.itemCount} ürün
              </Text>
            ) : null}
          </View>
          {items.length > 0 ? (
            <View style={tw`flex-row flex-wrap gap-2`}>
              {items.map((item, index) => (
                <View key={`${item}-${index}`} style={tw`px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800`}>
                  <Text variant="footnote" weight="medium">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {expense.note && expense.note !== title ? (
        <Card className="gap-1.5">
          <View style={tw`flex-row items-center gap-2`}>
            <FileText size={16} color="#94a3b8" />
            <Text variant="footnote" tone="muted" weight="semibold">
              Not
            </Text>
          </View>
          <Text variant="body">{expense.note}</Text>
        </Card>
      ) : null}
    </StackScreen>
  );
};
