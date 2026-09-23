import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, ColorPicker, confirmAction, FormScreen, IconTile, LIST_COLORS, Segmented, showToast, Text, TextField } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListType } from '../../types';
import { ICON_CHOICES } from './iconChoices';
import { IconGrid } from './IconGrid';
import { LIST_TYPE_OPTIONS } from './listTypes';

const DEFAULT_ICON: Record<ListType, string> = { SHOPPING: 'ShoppingCart', TODO: 'CheckCircle2', NOTE: 'StickyNote' };

export const CategoryFormScreen: React.FC<RootScreenProps<'CategoryForm'>> = ({ navigation, route }) => {
  const categoryId = route.params?.categoryId;
  const existing = useAppStore((s) => s.categories.find((c) => c.id === categoryId));
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<ListType>(existing?.type ?? route.params?.type ?? 'SHOPPING');
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_ICON[route.params?.type ?? 'SHOPPING']);
  const [color, setColor] = useState(existing?.color ?? LIST_COLORS[0]);

  const isEdit = !!existing;
  const trimmed = name.trim();
  const icons = ICON_CHOICES.includes(icon) ? ICON_CHOICES : [icon, ...ICON_CHOICES];
  const colors = LIST_COLORS.some((c) => c.toLowerCase() === color.toLowerCase()) ? LIST_COLORS : [color, ...LIST_COLORS];

  const save = () => {
    if (!trimmed) return;
    if (existing) {
      updateCategory(existing.id, { name: trimmed, icon, color, bgLight: `${color}1a` });
      showToast('Kategori güncellendi');
    } else {
      addCategory({ id: `cat-${Date.now()}`, name: trimmed, icon, color, bgLight: `${color}1a`, type });
      showToast('Kategori eklendi');
    }
    navigation.goBack();
  };

  const remove = () => {
    if (!existing) return;
    confirmAction({
      title: `"${existing.name}" silinsin mi?`,
      message: 'Bu kategorideki öğeler kategorisiz kalır.',
      onConfirm: () => {
        deleteCategory(existing.id);
        navigation.goBack();
        showToast('Kategori silindi');
      },
    });
  };

  return (
    <FormScreen title={isEdit ? 'Kategoriyi Düzenle' : 'Yeni Kategori'} onSubmit={save} submitDisabled={!trimmed}>
      <View style={tw`items-center gap-2 pt-2`}>
        <IconTile icon={icon} color={color} size="lg" solid />
        <Text variant="headline" numberOfLines={1}>
          {trimmed || 'Kategori adı'}
        </Text>
      </View>

      <TextField
        label="Ad"
        value={name}
        onChangeText={setName}
        placeholder="Örn. Kırtasiye"
        autoFocus={!isEdit}
        returnKeyType="done"
        onSubmitEditing={save}
      />

      {!isEdit ? (
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
      ) : null}

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

      {isEdit ? <Button title="Kategoriyi Sil" variant="dangerTinted" onPress={remove} fullWidth className="mt-2" /> : null}
    </FormScreen>
  );
};
