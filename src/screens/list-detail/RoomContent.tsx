import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { CheckCheck, Package, PiggyBank } from 'lucide-react-native';

import { AmountField, Btn, Button, Card, EmptyState, ProgressBar, ProgressRing, Sheet, Stat, Text, showToast, palette } from '../../design';
import { formatMoney, parseAmount } from '../../logic/format';
import { isProductFunded, productProgressPercent, productSaved, productTargetCost, roomProgress } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { RowGroup } from './parts';

const ProductRow: React.FC<{ item: ListItem; onEdit: () => void; onFund: () => void }> = ({ item, onEdit, onFund }) => {
  const target = productTargetCost(item);
  const saved = productSaved(item);
  const percent = productProgressPercent(item);
  const funded = isProductFunded(item);
  const photo = item.photos?.[0];

  return (
    <View style={tw`flex-row items-center gap-3 px-4 py-3`}>
      <Pressable
        onPress={onEdit}
        onLongPress={onEdit}
        accessibilityRole="button"
        accessibilityHint="Ürünü düzenle"
        style={({ pressed }) => [tw`flex-1 flex-row items-center gap-3`, pressed ? tw`opacity-60` : null]}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={tw`w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800`} />
        ) : (
          <View style={tw`w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center`}>
            <Package size={22} color={palette.slate400} />
          </View>
        )}
        <View style={tw`flex-1 min-w-0 gap-1`}>
          <Text variant="body" weight="medium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="footnote" tone="muted" numberOfLines={1}>
            {target > 0 ? `${formatMoney(saved)} / ${formatMoney(target)} birikti` : 'Hedef fiyat girilmedi'}
          </Text>
          {target > 0 ? <ProgressBar value={percent} color={funded ? palette.brand : palette.info} height={5} /> : null}
        </View>
      </Pressable>
      {funded ? (
        <View style={tw`w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center`}>
          <CheckCheck size={18} color={palette.brand} />
        </View>
      ) : (
        <Btn
          onPress={onFund}
          accessibilityLabel={`${item.title} için birikim ekle`}
          className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center"
        >
          <PiggyBank size={17} color="#fff" />
        </Btn>
      )}
    </View>
  );
};

/** "Para Ekle" sheet — adds a one-off amount to a product's saved total. */
const FundSheet: React.FC<{ item: ListItem | null; onClose: () => void }> = ({ item, onClose }) => {
  const updateItem = useAppStore((s) => s.updateItem);
  const [amount, setAmount] = useState('');
  if (!item) return null;

  const target = productTargetCost(item);
  const remaining = Math.max(0, Math.round((target - productSaved(item)) * 100) / 100);

  const add = () => {
    const value = parseAmount(amount);
    if (value <= 0) return;
    const nextSaved = productSaved(item) + value;
    updateItem(item.id, { savedAmount: nextSaved, isCompleted: target > 0 && nextSaved >= target });
    showToast(target > 0 && nextSaved >= target ? 'Hedefe ulaşıldı, satın almaya hazır 🎉' : 'Birikim eklendi');
    onClose();
  };

  return (
    <Sheet visible onClose={onClose} title={item.title}>
      <Text variant="subhead" tone="muted">
        {target > 0 ? `Şu ana kadar ${formatMoney(productSaved(item))} / ${formatMoney(target)} biriktirdin.` : 'Bu ürün için henüz hedef fiyat girilmedi.'}
      </Text>
      <AmountField label="Eklenecek tutar" value={amount} onChangeText={setAmount} autoFocus />
      {remaining > 0 ? (
        <Button title={`Kalanı ekle · ${formatMoney(remaining)}`} variant="secondary" size="sm" onPress={() => setAmount(String(remaining).replace('.', ','))} />
      ) : null}
      <Button title="Ekle" onPress={add} disabled={parseAmount(amount) <= 0} fullWidth />
    </Sheet>
  );
};

export const RoomContent: React.FC<{ listId: string; items: ListItem[] }> = ({ listId, items }) => {
  const navigation = useAppNavigation();
  const [funding, setFunding] = useState<ListItem | null>(null);
  const { percent, savedValue, targetValue } = roomProgress(items);

  const edit = (item: ListItem) => navigation.navigate('ItemForm', { listId, itemId: item.id });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Bu odaya henüz ürün eklemedin"
        message="Alınacak ürünleri ve tahmini fiyatlarını ekle, sonra üzerlerine para biriktir."
        action={{ label: 'Ürün ekle', onPress: () => navigation.navigate('ItemForm', { listId }) }}
      />
    );
  }

  return (
    <>
      <Card className="flex-row items-center gap-4">
        <ProgressRing value={percent} size={68} stroke={7}>
          <Text variant="footnote" weight="bold">{`%${percent}`}</Text>
        </ProgressRing>
        <View style={tw`flex-1 flex-row gap-4 min-w-0`}>
          <View style={tw`flex-1`}>
            <Stat label="Biriken" value={formatMoney(savedValue)} tone="brand" caption={`${items.length} ürün`} />
          </View>
          <View style={tw`flex-1`}>
            <Stat label="Hedef" value={formatMoney(targetValue)} />
          </View>
        </View>
      </Card>

      <RowGroup>
        {items.map((item) => (
          <ProductRow key={item.id} item={item} onEdit={() => edit(item)} onFund={() => setFunding(item)} />
        ))}
      </RowGroup>

      <FundSheet item={funding} onClose={() => setFunding(null)} />
    </>
  );
};
