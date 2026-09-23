import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { Button, ChipRow, palette, Segmented, SelectField, Sheet, Text, TextField } from '../../design';
import { formatMoney, parseAmount } from '../../logic/format';
import { PRIORITY_META } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppStore } from '../../store/useAppStore';
import type { ListType, TemplateItem } from '../../types';

const UNITS = ['adet', 'kg', 'g', 'lt', 'paket'] as const;
type Priority = NonNullable<TemplateItem['priority']>;

/** One-line summary of a template item's details (shown under its title). */
export function templateItemSummary(item: TemplateItem, type: ListType, categoryName?: string): string | undefined {
  const parts: string[] = [];
  if (type === 'SHOPPING') {
    if (item.quantity && (item.quantity !== 1 || (item.unit && item.unit !== 'adet'))) parts.push(`${item.quantity} ${item.unit || 'adet'}`);
    if (item.price) parts.push(formatMoney(item.price));
  }
  if (type === 'TODO' && item.priority) parts.push(PRIORITY_META[item.priority].label);
  if (type === 'NOTE' && item.content) parts.push(item.content.split('\n')[0]);
  if (categoryName) parts.push(categoryName);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Bottom sheet that edits one template item; fields depend on the template type. */
export const TemplateItemSheet: React.FC<{
  item: TemplateItem | null;
  type: ListType;
  onClose: () => void;
  onSave: (item: TemplateItem) => void;
}> = ({ item, type, onClose, onSave }) => {
  const categories = useAppStore((s) => s.categories);
  // Keyed by item id so the form resets when a different item opens.
  if (!item) return null;
  return <Editor key={item.id} item={item} type={type} categories={categories.filter((c) => c.type === type)} onClose={onClose} onSave={onSave} />;
};

const Editor: React.FC<{
  item: TemplateItem;
  type: ListType;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: (item: TemplateItem) => void;
}> = ({ item, type, categories, onClose, onSave }) => {
  const [title, setTitle] = useState(item.title);
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [unit, setUnit] = useState(item.unit ?? 'adet');
  const [price, setPrice] = useState(item.price ? String(item.price).replace('.', ',') : '');
  const [categoryId, setCategoryId] = useState(item.categoryId ?? '');
  const [priority, setPriority] = useState<Priority>(item.priority ?? 'MEDIUM');
  const [content, setContent] = useState(item.content ?? '');

  const step = unit === 'kg' || unit === 'lt' ? 0.5 : unit === 'g' ? 100 : 1;
  const trimmed = title.trim();

  const save = () => {
    if (!trimmed) return;
    onSave({
      ...item,
      title: trimmed,
      categoryId: categoryId || undefined,
      ...(type === 'SHOPPING' ? { quantity, unit, price: parseAmount(price) || undefined } : {}),
      ...(type === 'TODO' ? { priority } : {}),
      ...(type === 'NOTE' ? { content: content.trim() || undefined } : {}),
    });
    onClose();
  };

  return (
    <Sheet visible onClose={onClose} title="Öğeyi Düzenle">
      <TextField label="Başlık" value={title} onChangeText={setTitle} returnKeyType="done" />

      {type === 'SHOPPING' ? (
        <>
          <View style={tw`gap-1.5`}>
            <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
              Miktar
            </Text>
            <View style={tw`flex-row items-center gap-3`}>
              <Pressable
                accessibilityLabel="Azalt"
                onPress={() => setQuantity((q) => Math.max(step, +(q - step).toFixed(2)))}
                style={tw`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center`}
              >
                <Minus size={20} color={palette.slate500} />
              </Pressable>
              <Text variant="title2" className="min-w-[64px] text-center">
                {quantity.toLocaleString('tr-TR')}
              </Text>
              <Pressable
                accessibilityLabel="Artır"
                onPress={() => setQuantity((q) => +(q + step).toFixed(2))}
                style={tw`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center`}
              >
                <Plus size={20} color={palette.brand} />
              </Pressable>
            </View>
          </View>
          <ChipRow
            options={UNITS.map((u) => ({ value: u, label: u }))}
            value={unit as (typeof UNITS)[number]}
            onChange={(u) => {
              setUnit(u);
              if (u === 'g' && quantity < 100) setQuantity(100);
              if (u !== 'g' && quantity >= 100) setQuantity(1);
            }}
          />
          <TextField label="Tahmini fiyat (₺)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="İsteğe bağlı" />
        </>
      ) : null}

      {type === 'TODO' ? (
        <View style={tw`gap-1.5`}>
          <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
            Öncelik
          </Text>
          <Segmented<Priority>
            options={(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
            value={priority}
            onChange={setPriority}
          />
        </View>
      ) : null}

      {type === 'NOTE' ? (
        <TextField label="İçerik" value={content} onChangeText={setContent} multiline placeholder="İsteğe bağlı" />
      ) : null}

      {categories.length > 0 ? (
        <SelectField
          label="Kategori"
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Varsayılan"
          options={[{ value: '', label: 'Varsayılan' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />
      ) : null}

      <Button title="Kaydet" onPress={save} disabled={!trimmed} fullWidth />
    </Sheet>
  );
};
