import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Banknote, CheckCircle2, Circle, CircleEllipsis, ShoppingBasket } from 'lucide-react-native';

import { Btn, Button, Card, EmptyState, FormScreen, IconTile, ListGroup, Row, Section, Text, palette, showToast } from '../../design';
import { formatMoney } from '../../logic/format';
import { CARD_TYPE_META, cardAvailable, isCreditCard, useFinance, useListItems } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { lineTotal, shoppingMeta, useAccessibleList } from './helpers';

type Method = { key: string; label: string; cardId?: string };

const PaymentOption: React.FC<{
  selected: boolean;
  onPress: () => void;
  tile: React.ReactNode;
  title: string;
  subtitle?: string;
  warning?: string;
}> = ({ selected, onPress, tile, title, subtitle, warning }) => (
  <Btn
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 ${
      selected ? 'border-emerald-500' : 'border-slate-200/70 dark:border-slate-800'
    }`}
  >
    {tile}
    <View style={tw`flex-1 min-w-0`}>
      <Text variant="body" weight="semibold" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="footnote" tone="muted" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {warning ? (
        <Text variant="footnote" tone="warning" numberOfLines={1}>
          {warning}
        </Text>
      ) : null}
    </View>
    {selected ? <CheckCircle2 size={24} color={palette.brandLight} /> : <Circle size={24} color={palette.slate400} />}
  </Btn>
);

export const CheckoutScreen: React.FC<RootScreenProps<'Checkout'>> = ({ navigation, route }) => {
  const { listId } = route.params;
  const list = useAccessibleList(listId);
  const items = useListItems(listId);
  const { cards } = useFinance();
  const checkout = useAppStore((s) => s.checkoutShoppingList);
  const clearCompleted = useAppStore((s) => s.clearCompletedItems);
  const uncheckAll = useAppStore((s) => s.unmarkAllItemsCompleted);

  const methods: Method[] = [
    ...cards.map((c) => ({ key: c.id, label: c.name, cardId: c.id })),
    { key: 'cash', label: 'Nakit' },
    { key: 'other', label: 'Diğer' },
  ];
  const [selectedKey, setSelectedKey] = useState(methods[0].key);
  const selected = methods.find((m) => m.key === selectedKey) ?? methods[0];

  const checked = items.filter((i) => i.isCompleted);
  const total = checked.reduce((sum, i) => sum + lineTotal(i), 0);
  const unpriced = checked.filter((i) => !i.price).length;

  if (!list || checked.length === 0) {
    return (
      <FormScreen title="Alışverişi Tamamla">
        <EmptyState
          icon={ShoppingBasket}
          title="Sepet boş"
          message="Aldığınız ürünleri listede işaretleyin, ardından alışverişi tamamlayın."
          action={{ label: 'Listeye dön', onPress: () => navigation.goBack() }}
        />
      </FormScreen>
    );
  }

  const confirm = () => {
    const result = checkout(list.id, selected.label, selected.cardId);
    navigation.goBack();
    if (result.totalAmount <= 0) {
      showToast('Kaydedilecek tutar yok', 'error');
      return;
    }
    showToast(`${result.itemCount} ürün · ${formatMoney(result.totalAmount)} harcama olarak kaydedildi`);
    // Checked items must not stay in the basket, otherwise the same basket could be recorded twice.
    Alert.alert('Sepetteki ürünler', 'Alınan ürünler ne olsun?', [
      { text: 'Listede tut (işareti kaldır)', onPress: () => uncheckAll(list.id) },
      { text: 'Listeden kaldır', style: 'destructive', onPress: () => clearCompleted(list.id) },
    ], { cancelable: false });
  };

  return (
    <FormScreen
      title="Alışverişi Tamamla"
      footer={
        <View style={tw`gap-2`}>
          {total <= 0 ? (
            <Text variant="footnote" tone="muted" className="text-center">
              Ürünlere fiyat girin; tutarı ₺0 olan alışveriş harcama olarak kaydedilmez.
            </Text>
          ) : null}
          <Button title={`${formatMoney(total)} Harcama Olarak Kaydet`} onPress={confirm} disabled={total <= 0} fullWidth />
        </View>
      }
    >
      <Card className="items-center gap-1 py-5">
        <Text variant="footnote" tone="muted" weight="semibold">
          {`${list.title} · ${checked.length} ürün`}
        </Text>
        <Text variant="amount">{formatMoney(total)}</Text>
        {unpriced ? (
          <Text variant="caption" tone="warning">
            {`${unpriced} ürünün fiyatı girilmemiş`}
          </Text>
        ) : null}
      </Card>

      <ListGroup header="Sepettekiler">
        {checked.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            subtitle={shoppingMeta(item)}
            value={lineTotal(item) > 0 ? formatMoney(lineTotal(item)) : '—'}
            valueTone="default"
            onPress={() => navigation.navigate('ItemForm', { listId: list.id, itemId: item.id })}
          />
        ))}
      </ListGroup>

      <Section title="Ödeme yöntemi">
        <View style={tw`gap-2.5`}>
          {cards.map((card) => {
            const meta = CARD_TYPE_META[card.type];
            const available = cardAvailable(card);
            const short = !isCreditCard(card) || card.creditLimit ? available < total : false;
            return (
              <PaymentOption
                key={card.id}
                selected={selectedKey === card.id}
                onPress={() => setSelectedKey(card.id)}
                tile={<IconTile icon={card.icon || meta.icon} color={card.color || palette.brandLight} />}
                title={card.name}
                subtitle={`${meta.label} · Kullanılabilir ${formatMoney(available, card.currency || 'TRY')}`}
                warning={short ? 'Bakiye/limit yetersiz' : undefined}
              />
            );
          })}
          <PaymentOption
            selected={selectedKey === 'cash'}
            onPress={() => setSelectedKey('cash')}
            tile={<IconTile icon={Banknote} color="#16a34a" />}
            title="Nakit"
            subtitle="Karta işlenmez"
          />
          <PaymentOption
            selected={selectedKey === 'other'}
            onPress={() => setSelectedKey('other')}
            tile={<IconTile icon={CircleEllipsis} color={palette.slate500} />}
            title="Diğer"
            subtitle="Havale, çek vb."
          />
        </View>
      </Section>
    </FormScreen>
  );
};
