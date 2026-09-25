import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Package, Plus } from 'lucide-react-native';

import { Btn, Card, EmptyState, ProgressBar, ProgressRing, Stat, Text, palette } from '../../design';
import { formatMoney } from '../../logic/format';
import { productProgressPercent, productPurchased, productTarget, roomProgress } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { RowGroup } from './parts';

const ProductRow: React.FC<{ item: ListItem; onEdit: () => void; onBumpPurchased: () => void }> = ({ item, onEdit, onBumpPurchased }) => {
  const target = productTarget(item);
  const purchased = productPurchased(item);
  const percent = productProgressPercent(item);
  const done = purchased >= target;
  const photo = item.photos?.[0];

  return (
    <Pressable
      onPress={onEdit}
      onLongPress={onEdit}
      accessibilityRole="button"
      accessibilityHint="Ürünü düzenle"
      style={({ pressed }) => [tw`flex-row items-center gap-3 px-4 py-3`, pressed ? tw`bg-slate-100 dark:bg-slate-800` : null]}
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
          {`${purchased.toLocaleString('tr-TR')}/${target.toLocaleString('tr-TR')} adet${item.price ? ` · ${formatMoney(item.price * target)}` : ''}`}
        </Text>
        <ProgressBar value={percent} color={done ? palette.brand : palette.info} height={5} />
      </View>
      {!done ? (
        <Btn
          onPress={onBumpPurchased}
          accessibilityLabel={`${item.title}: bir adet daha satın alındı olarak işaretle`}
          className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center"
        >
          <Plus size={18} color="#fff" />
        </Btn>
      ) : null}
    </Pressable>
  );
};

export const RoomContent: React.FC<{ listId: string; items: ListItem[] }> = ({ listId, items }) => {
  const navigation = useAppNavigation();
  const updateItem = useAppStore((s) => s.updateItem);
  const { percent, boughtValue, targetValue } = roomProgress(items);

  const edit = (item: ListItem) => navigation.navigate('ItemForm', { listId, itemId: item.id });
  const bump = (item: ListItem) => {
    const next = Math.min(productTarget(item), productPurchased(item) + 1);
    updateItem(item.id, { purchasedQuantity: next, isCompleted: next >= productTarget(item) });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Bu odaya henüz ürün eklemedin"
        message="Alınacak ürünleri, tahmini fiyatlarını ve hedeflenen miktarı ekle."
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
            <Stat label="Alınan" value={formatMoney(boughtValue)} tone="brand" caption={`${items.length} ürün`} />
          </View>
          <View style={tw`flex-1`}>
            <Stat label="Hedef" value={formatMoney(targetValue)} />
          </View>
        </View>
      </Card>

      <RowGroup>
        {items.map((item) => (
          <ProductRow key={item.id} item={item} onEdit={() => edit(item)} onBumpPurchased={() => bump(item)} />
        ))}
      </RowGroup>
    </>
  );
};
