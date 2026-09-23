import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import {
  Button,
  ColorPicker,
  confirmAction,
  FormScreen,
  IconTile,
  Input,
  LIST_COLORS,
  palette,
  Segmented,
  showToast,
  Text,
  TextField,
  type TextInputHandle,
} from '../../design';
import { ic, tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListType, TemplateItem } from '../../types';
import { IconGrid } from './IconGrid';
import { LIST_TYPE_OPTIONS } from './listTypes';
import { TEMPLATE_ICONS, templateTileProps } from './templateIcon';
import { TemplateItemSheet, templateItemSummary } from './TemplateItemSheet';

const DEFAULT_ICON: Record<ListType, string> = { SHOPPING: 'ShoppingCart', TODO: 'CheckSquare', NOTE: 'StickyNote' };
const ITEM_NOUN: Record<ListType, string> = { SHOPPING: 'ürün', TODO: 'görev', NOTE: 'not' };

export const TemplateFormScreen: React.FC<RootScreenProps<'TemplateForm'>> = ({ navigation, route }) => {
  const templateId = route.params?.templateId;
  const existing = useAppStore((s) => s.templates.find((t) => t.id === templateId));
  const addTemplate = useAppStore((s) => s.addTemplate);
  const updateTemplate = useAppStore((s) => s.updateTemplate);
  const deleteTemplate = useAppStore((s) => s.deleteTemplate);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [type, setType] = useState<ListType>(existing?.type ?? 'SHOPPING');
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_ICON.SHOPPING);
  const [color, setColor] = useState(existing?.color ?? LIST_COLORS[0]);
  const [items, setItems] = useState<TemplateItem[]>(existing?.items ?? []);
  const [draft, setDraft] = useState('');
  const draftRef = useRef<TextInputHandle>(null);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const categories = useAppStore((s) => s.categories);

  const trimmed = title.trim();
  const isEdit = !!existing;
  const tile = templateTileProps(icon);
  const icons = tile.icon && !TEMPLATE_ICONS.includes(icon) ? [icon, ...TEMPLATE_ICONS] : TEMPLATE_ICONS;
  const colors = LIST_COLORS.some((c) => c.toLowerCase() === color.toLowerCase()) ? LIST_COLORS : [color, ...LIST_COLORS];

  const addDraft = () => {
    const text = draft.trim();
    if (!text) return;
    const item: TemplateItem =
      type === 'SHOPPING'
        ? { id: `tpl-item-${Date.now()}-${items.length}`, title: text, quantity: 1, unit: 'adet' }
        : { id: `tpl-item-${Date.now()}-${items.length}`, title: text };
    setItems((prev) => [...prev, item]);
    setDraft('');
    // Keep the keyboard up for rapid entry.
    draftRef.current?.focus();
  };

  const save = () => {
    if (!trimmed) return;
    const finalItems = draft.trim()
      ? [...items, { id: `tpl-item-${Date.now()}-${items.length}`, title: draft.trim() }]
      : items;
    const data = {
      title: trimmed,
      description: description.trim() || undefined,
      type,
      icon,
      color,
      bgLight: `${color}1a`,
      items: finalItems,
    };
    if (existing) {
      updateTemplate(existing.id, data);
      showToast('Şablon güncellendi');
    } else {
      addTemplate({ id: `tpl-${Date.now()}`, ...data, isCustom: true, createdAt: new Date().toISOString() });
      showToast('Şablon oluşturuldu');
    }
    navigation.goBack();
  };

  const remove = () => {
    if (!existing) return;
    confirmAction({
      title: `"${existing.title}" silinsin mi?`,
      message: 'Bu şablondan oluşturulan listeler etkilenmez.',
      onConfirm: () => {
        deleteTemplate(existing.id);
        navigation.goBack();
        showToast('Şablon silindi');
      },
    });
  };

  return (
    <FormScreen title={isEdit ? 'Şablonu Düzenle' : 'Yeni Şablon'} onSubmit={save} submitDisabled={!trimmed}>
      <View style={tw`items-center gap-2 pt-2`}>
        <IconTile {...tile} color={color} size="lg" solid />
        <Text variant="headline" numberOfLines={1}>
          {trimmed || 'Şablon adı'}
        </Text>
        <Text variant="footnote" tone="muted">
          {items.length} {ITEM_NOUN[type]}
        </Text>
      </View>

      <TextField label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn. Haftalık Market" autoFocus={!isEdit} returnKeyType="next" />
      <TextField label="Açıklama" value={description} onChangeText={setDescription} placeholder="İsteğe bağlı" returnKeyType="done" />

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Tür
        </Text>
        <Segmented
          options={LIST_TYPE_OPTIONS}
          value={type}
          onChange={(t) => {
            if (icon === DEFAULT_ICON[type]) setIcon(DEFAULT_ICON[t]);
            setType(t);
          }}
        />
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          {type === 'SHOPPING' ? 'Ürünler' : type === 'TODO' ? 'Görevler' : 'Notlar'}
        </Text>
        <View style={tw`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden`}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setEditing(item)}
              accessibilityRole="button"
              accessibilityHint="Ayrıntıları düzenle"
              style={({ pressed }) => [
                tw`flex-row items-center gap-3 pl-4 pr-2 min-h-[52px] border-b border-slate-100 dark:border-slate-800`,
                pressed ? tw`bg-slate-100 dark:bg-slate-800` : null,
              ]}
            >
              <Text variant="footnote" tone="faint" weight="bold" className="w-5">
                {String(index + 1)}
              </Text>
              <View style={tw`flex-1 py-2`}>
                <Text variant="body" numberOfLines={2}>
                  {item.title}
                </Text>
                {(() => {
                  const summary = templateItemSummary(item, type, categories.find((c) => c.id === item.categoryId)?.name);
                  return summary ? (
                    <Text variant="footnote" tone="muted" numberOfLines={1}>
                      {summary}
                    </Text>
                  ) : null;
                })()}
              </View>
              <Pressable
                onPress={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                accessibilityRole="button"
                accessibilityLabel={`${item.title} sil`}
                hitSlop={6}
                style={tw`w-11 h-11 items-center justify-center`}
              >
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Pressable>
            </Pressable>
          ))}
          <View style={tw`flex-row items-center gap-3 pl-4 pr-2 min-h-[52px]`}>
            <Plus size={20} color={palette.brand} strokeWidth={2.4} />
            <Input
              ref={draftRef}
              value={draft}
              onChangeText={setDraft}
              placeholder={`${ITEM_NOUN[type].charAt(0).toUpperCase()}${ITEM_NOUN[type].slice(1)} ekle`}
              returnKeyType="done"
              submitBehavior="submit"
              onSubmitEditing={addDraft}
              className="flex-1 h-[52px] text-[16px]"
            />
          </View>
        </View>
        <Text variant="caption" tone="muted" className="px-1">
          Yaz ve klavyeden "Bitti"ye bas; sıradaki için alan açık kalır. Ayrıntılar için öğeye dokun.
        </Text>
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          İkon
        </Text>
        <IconGrid value={icon} onChange={setIcon} color={color} icons={icons} />
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Renk
        </Text>
        <ColorPicker colors={colors} value={color} onChange={setColor} />
      </View>

      <TemplateItemSheet
        item={editing}
        type={type}
        onClose={() => setEditing(null)}
        onSave={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
      />

      {isEdit ? <Button title="Şablonu Sil" variant="dangerTinted" onPress={remove} fullWidth className="mt-2" /> : null}
    </FormScreen>
  );
};
