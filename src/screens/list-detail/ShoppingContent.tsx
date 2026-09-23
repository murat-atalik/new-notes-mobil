import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, ChevronRight, ShoppingBasket, ShoppingCart } from 'lucide-react-native';

import { Card, EmptyState, IconTile, ProgressRing, Stat, Text, palette } from '../../design';
import { formatMoney } from '../../logic/format';
import { listProgress, shoppingTotals } from '../../logic/selectors';
import { ic, tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { Category, ListItem } from '../../types';
import { lineTotal, shoppingMeta } from './helpers';
import { GroupHeader, RoundCheck, RowChevron, RowGroup } from './parts';

const ShoppingRow: React.FC<{ item: ListItem; onToggle: () => void; onEdit: () => void }> = ({ item, onToggle, onEdit }) => {
  const total = lineTotal(item);
  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onEdit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.isCompleted }}
      accessibilityLabel={item.title}
      style={({ pressed }) => [tw`flex-row items-center gap-3 pl-4 pr-3 min-h-[60px] py-2.5`, pressed ? tw`bg-slate-100 dark:bg-slate-800` : null]}
    >
      <RoundCheck checked={item.isCompleted} />
      <View style={tw`flex-1 min-w-0`}>
        <Text
          variant="body"
          tone={item.isCompleted ? 'faint' : 'default'}
          weight="medium"
          numberOfLines={2}
          style={item.isCompleted ? { textDecorationLine: 'line-through' } : undefined}
        >
          {item.title}
        </Text>
        <Text variant="footnote" tone="muted" numberOfLines={1}>
          {shoppingMeta(item)}
        </Text>
      </View>
      {total > 0 ? (
        <Text variant="callout" weight="semibold" tone={item.isCompleted ? 'faint' : 'default'}>
          {formatMoney(total)}
        </Text>
      ) : null}
      <RowChevron onPress={onEdit} />
    </Pressable>
  );
};

export const ShoppingContent: React.FC<{ listId: string; items: ListItem[]; onAddFocus: () => void }> = ({ listId, items, onAddFocus }) => {
  const navigation = useAppNavigation();
  const categories = useAppStore((s) => s.categories);
  const toggle = useAppStore((s) => s.toggleItemCompleted);
  const [basketOpen, setBasketOpen] = useState(false);

  const progress = listProgress(items);
  const totals = shoppingTotals(items);

  const { groups, checked } = useMemo(() => {
    const pending = items.filter((i) => !i.isCompleted);
    const map = new Map<string, ListItem[]>();
    for (const item of pending) map.set(item.categoryId, [...(map.get(item.categoryId) ?? []), item]);
    const known = categories.filter((c) => map.has(c.id));
    const fallback: Category = { id: '__other', name: 'Diğer', color: palette.slate500, icon: 'Tag', bgLight: '', type: 'SHOPPING' };
    const unknownItems = [...map.entries()].filter(([id]) => !categories.some((c) => c.id === id)).flatMap(([, list]) => list);
    const result = known.map((category) => ({ category, items: map.get(category.id) ?? [] }));
    if (unknownItems.length) result.push({ category: fallback, items: unknownItems });
    return { groups: result, checked: items.filter((i) => i.isCompleted) };
  }, [items, categories]);

  const edit = (item: ListItem) => navigation.navigate('ItemForm', { listId, itemId: item.id });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Liste boş"
        message="Aşağıdaki alana ürün adını yazıp ekleyin. Virgülle birden fazla ürün ekleyebilirsiniz."
        action={{ label: 'Ürün ekle', onPress: onAddFocus }}
      />
    );
  }

  return (
    <>
      <Card className="flex-row items-center gap-4">
        <ProgressRing value={progress.percent} size={76} stroke={8}>
          <Text variant="subhead" weight="bold">
            {`%${progress.percent}`}
          </Text>
        </ProgressRing>
        <View style={tw`flex-1 gap-2 min-w-0`}>
          <Text variant="headline">{`${progress.done}/${progress.total} alındı`}</Text>
          <View style={tw`flex-row gap-5`}>
            <Stat label="Kalan" value={formatMoney(totals.pending)} />
            <Stat label="Sepette" value={formatMoney(totals.checked)} tone="brand" />
          </View>
        </View>
      </Card>

      {groups.length === 0 ? (
        <Card className="items-center gap-1 py-6">
          <Text variant="headline">Hepsi sepette 🎉</Text>
          <Text variant="subhead" tone="muted" className="text-center">
            Alışverişi tamamlayıp harcama olarak kaydedebilirsiniz.
          </Text>
        </Card>
      ) : null}

      {groups.map(({ category, items: rows }) => (
        <View key={category.id} style={tw`gap-2`}>
          <GroupHeader left={<IconTile icon={category.icon} color={category.color} size="sm" />} title={category.name} count={rows.length} />
          <RowGroup>
            {rows.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={() => toggle(item.id)} onEdit={() => edit(item)} />
            ))}
          </RowGroup>
        </View>
      ))}

      {checked.length ? (
        <View style={tw`gap-2`}>
          <GroupHeader
            left={<IconTile icon={ShoppingBasket} color={palette.brandLight} size="sm" />}
            title={`Sepette (${checked.length})`}
            onPress={() => setBasketOpen((o) => !o)}
            right={basketOpen ? <ChevronDown {...ic('w-5 h-5 text-slate-400')} /> : <ChevronRight {...ic('w-5 h-5 text-slate-400')} />}
          />
          {basketOpen ? (
            <RowGroup>
              {checked.map((item) => (
                <ShoppingRow key={item.id} item={item} onToggle={() => toggle(item.id)} onEdit={() => edit(item)} />
              ))}
            </RowGroup>
          ) : null}
        </View>
      ) : null}
    </>
  );
};
