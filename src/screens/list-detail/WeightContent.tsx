import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Scale, TrendingDown, TrendingUp, Trash2 } from 'lucide-react-native';

import { Button, Card, DateField, EmptyState, IconTile, Sheet, Text, TextField, confirmAction, showActionSheet, showToast, palette } from '../../design';
import { formatDay, isoDate, parseAmount } from '../../logic/format';
import { weightDiffs, weightSummary, type WeightEntry } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { WEIGHT_META } from '../lists/weightMeta';
import { RowGroup } from './parts';

const numStr = (n?: number | null) => (n == null ? '' : String(n).replace('.', ','));

/** `1,2 kg` (green, ▼) / `+0,8 kg` (red, ▲) / "Değişim yok" / "İlk ölçüm". */
const DiffBadge: React.FC<{ diff: number | null }> = ({ diff }) => {
  if (diff === null) {
    return (
      <Text variant="caption" tone="faint">
        İlk ölçüm
      </Text>
    );
  }
  if (diff === 0) {
    return (
      <Text variant="caption" tone="muted">
        Değişim yok
      </Text>
    );
  }
  const down = diff < 0;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <View style={tw`flex-row items-center gap-1`}>
      <Icon size={13} color={down ? palette.brand : palette.danger} />
      <Text variant="caption" weight="bold" tone={down ? 'brand' : 'danger'}>
        {`${down ? '' : '+'}${numStr(Math.abs(diff))} kg`}
      </Text>
    </View>
  );
};

const EntryRow: React.FC<{ entry: WeightEntry & { diff: number | null }; previousDate?: string; onPress: () => void }> = ({
  entry,
  previousDate,
  onPress,
}) => {
  const dayGap = previousDate ? Math.round((Date.parse(entry.date) - Date.parse(previousDate)) / 86_400_000) : null;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [tw`flex-row items-center gap-3 px-4 py-3`, pressed ? tw`opacity-60` : null]}>
      <IconTile icon="Scale" color={WEIGHT_META.color} size="sm" />
      <View style={tw`flex-1 min-w-0`}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {`${numStr(entry.value)} kg`}
        </Text>
        <Text variant="footnote" tone="muted" numberOfLines={1}>
          {dayGap ? `${formatDay(entry.date)} · bir önceki ölçümden ${dayGap} gün sonra` : formatDay(entry.date)}
        </Text>
      </View>
      <DiffBadge diff={entry.diff} />
    </Pressable>
  );
};

/** Add/edit sheet for a single weight entry (date + kg). */
const EntrySheet: React.FC<{ item: ListItem | null; listId: string; visible: boolean; onClose: () => void }> = ({
  item,
  listId,
  visible,
  onClose,
}) => {
  const addItem = useAppStore((s) => s.addItem);
  const updateItem = useAppStore((s) => s.updateItem);
  const deleteItem = useAppStore((s) => s.deleteItem);
  const [date, setDate] = useState(item?.dueDate || isoDate());
  const [weight, setWeight] = useState(numStr(item?.price));

  // Reset local state whenever a different entry (or a fresh "add") is opened.
  React.useEffect(() => {
    if (visible) {
      setDate(item?.dueDate || isoDate());
      setWeight(numStr(item?.price));
    }
  }, [visible, item]);

  if (!visible) return null;
  const value = parseAmount(weight);
  const valid = value > 0 && !!date;

  const save = () => {
    if (!valid) return;
    if (item) {
      updateItem(item.id, { price: value, dueDate: date, title: formatDay(date) });
      showToast('Ölçüm güncellendi');
    } else {
      addItem({ listId, title: formatDay(date), isCompleted: false, price: value, quantity: 1, unit: 'adet', categoryId: '', dueDate: date });
      showToast('Ölçüm eklendi');
    }
    onClose();
  };

  const remove = () => {
    if (!item) return;
    confirmAction({
      title: 'Ölçüm silinsin mi?',
      message: `${formatDay(item.dueDate)} tarihli ölçüm kaldırılacak.`,
      onConfirm: () => {
        deleteItem(item.id);
        onClose();
      },
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={item ? 'Ölçümü Düzenle' : 'Ölçüm Ekle'}>
      <DateField label="Tarih" value={date} onChange={setDate} />
      <TextField label="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Örn. 82,4" autoFocus={!item} />
      <Button title="Kaydet" onPress={save} disabled={!valid} fullWidth />
      {item ? <Button title="Sil" icon={Trash2} variant="dangerTinted" onPress={remove} fullWidth /> : null}
    </Sheet>
  );
};

export const WeightContent: React.FC<{ listId: string; items: ListItem[]; adding: boolean; onAddingChange: (v: boolean) => void }> = ({
  listId,
  items,
  adding,
  onAddingChange,
}) => {
  const [editing, setEditing] = useState<ListItem | null>(null);
  const diffs = weightDiffs(items); // newest first
  const summary = weightSummary(items);

  const openMenu = (item: ListItem) =>
    showActionSheet({
      title: formatDay(item.dueDate),
      options: [{ label: 'Düzenle', onPress: () => setEditing(item) }],
    });

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon={Scale}
          title={WEIGHT_META.emptyTitle}
          message={WEIGHT_META.emptyMessage}
          action={{ label: 'Ölçüm ekle', onPress: () => onAddingChange(true) }}
        />
        <EntrySheet item={null} listId={listId} visible={adding} onClose={() => onAddingChange(false)} />
      </>
    );
  }

  return (
    <>
      <Card className="flex-row items-center gap-4">
        <IconTile icon="Scale" color={WEIGHT_META.color} size="lg" />
        <View style={tw`flex-1 flex-row gap-4 min-w-0`}>
          <View style={tw`flex-1`}>
            <Text variant="footnote" tone="muted" weight="semibold">
              Son ölçüm
            </Text>
            <Text variant="headline">{summary.latest != null ? `${numStr(summary.latest)} kg` : '—'}</Text>
          </View>
          <View style={tw`flex-1`}>
            <Text variant="footnote" tone="muted" weight="semibold">
              İlk ölçümden bu yana
            </Text>
            {summary.totalDiff != null ? <DiffBadge diff={summary.totalDiff} /> : <Text variant="headline">—</Text>}
          </View>
        </View>
      </Card>

      <RowGroup>
        {diffs.map((entry, index) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            previousDate={diffs[index + 1]?.date}
            onPress={() => openMenu(items.find((i) => i.id === entry.id)!)}
          />
        ))}
      </RowGroup>

      <EntrySheet item={editing} listId={listId} visible={!!editing} onClose={() => setEditing(null)} />
      <EntrySheet item={null} listId={listId} visible={adding} onClose={() => onAddingChange(false)} />
    </>
  );
};
