import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  ColorPicker,
  FieldLabel,
  FormScreen,
  IconTile,
  LIST_COLORS,
  ListGroup,
  Segmented,
  showToast,
  SwitchRow,
  Text,
  TextField,
} from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListType } from '../../types';
import { LIST_ICONS, LIST_TYPE_META, LIST_TYPES } from './listMeta';

const TITLE_MAX = 60;

export const ListFormScreen: React.FC<RootScreenProps<'ListForm'>> = ({ navigation, route }) => {
  const listId = route.params?.listId;
  const existing = useAppStore((s) => (listId ? s.lists.find((l) => l.id === listId) : undefined));
  const templates = useAppStore((s) => s.templates);
  const currentUser = useAppStore((s) => s.currentUser);
  const createList = useAppStore((s) => s.createList);
  const updateList = useAppStore((s) => s.updateList);
  const createListFromTemplate = useAppStore((s) => s.createListFromTemplate);

  const isEdit = !!existing;
  const initialType: ListType = existing?.type ?? route.params?.type ?? 'SHOPPING';

  const [type, setType] = useState<ListType>(initialType);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? LIST_TYPE_META[initialType].defaultIcon);
  const [color, setColor] = useState(existing?.color ?? LIST_COLORS[0]);
  const [isShared, setIsShared] = useState(existing ? existing.isShared !== false : true);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const typeTemplates = useMemo(() => templates.filter((t) => t.type === type), [templates, type]);
  const icons = useMemo(() => {
    const base = LIST_ICONS[type];
    return icon && !base.includes(icon) ? [icon, ...base] : base;
  }, [type, icon]);

  const trimmed = title.trim();
  const titleError = touched && !trimmed ? 'Liste adı gerekli' : undefined;
  const valid = trimmed.length > 0 && trimmed.length <= TITLE_MAX;

  const changeType = (next: ListType) => {
    setType(next);
    setTemplateId(null);
    if (!LIST_ICONS[next].includes(icon)) setIcon(LIST_TYPE_META[next].defaultIcon);
  };

  const pickTemplate = (id: string) => {
    if (templateId === id) {
      setTemplateId(null);
      return;
    }
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    if (!trimmed) setTitle(tpl.title.slice(0, TITLE_MAX));
    if (tpl.icon) setIcon(tpl.icon);
    if (tpl.color) setColor(tpl.color);
  };

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const desc = description.trim() || undefined;

    if (existing) {
      updateList(existing.id, { title: trimmed, description: desc, color, icon, isShared });
      showToast('Liste güncellendi');
      navigation.goBack();
      return;
    }

    let newId: string;
    if (templateId) {
      newId = createListFromTemplate(templateId, trimmed, isShared);
      // Apply the choices made on this form over the template defaults.
      if (newId) updateList(newId, { color, icon, ...(desc ? { description: desc } : {}) });
    } else {
      newId = createList({ title: trimmed, description: desc, type, color, icon, isShared, familyId: currentUser.familyId });
    }
    if (!newId) {
      showToast('Liste oluşturulamadı', 'error');
      return;
    }
    showToast('Liste oluşturuldu');
    navigation.replace('ListDetail', { listId: newId });
  };

  return (
    <FormScreen
      title={isEdit ? 'Listeyi Düzenle' : 'Yeni Liste'}
      onSubmit={submit}
      submitLabel={isEdit ? 'Kaydet' : 'Oluştur'}
      submitDisabled={!valid}
    >
      {!isEdit ? (
        <Segmented
          options={LIST_TYPES.map((t) => ({ value: t, label: LIST_TYPE_META[t].label, icon: LIST_TYPE_META[t].icon }))}
          value={type}
          onChange={changeType}
        />
      ) : null}

      <View style={tw`items-center gap-2 pt-1`}>
        <IconTile icon={icon} color={color} size="lg" solid />
        <Text variant="footnote" tone="muted">
          {LIST_TYPE_META[type].singular}
        </Text>
      </View>

      <TextField
        label="Liste adı"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        placeholder={type === 'SHOPPING' ? 'Örn. Haftalık market' : type === 'TODO' ? 'Örn. Ev işleri' : 'Örn. Tarifler'}
        autoFocus={!isEdit}
        maxLength={TITLE_MAX}
        returnKeyType="done"
        error={titleError}
        hint={`${trimmed.length}/${TITLE_MAX}`}
      />

      <TextField
        label="Açıklama (isteğe bağlı)"
        value={description}
        onChangeText={setDescription}
        placeholder="Kısa bir not ekle"
        maxLength={200}
      />

      {!isEdit && typeTemplates.length ? (
        <FieldLabel label="Şablondan başla" hint={templateId ? 'Şablondaki öğeler listeye eklenecek.' : 'İsteğe bağlı — hazır öğelerle başla.'}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2.5 px-1`} style={tw`-mx-1`}>
            {typeTemplates.map((tpl) => {
              const active = tpl.id === templateId;
              return (
                <Pressable
                  key={tpl.id}
                  onPress={() => pickTemplate(tpl.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    tw.style(
                      'w-36 p-3 rounded-2xl gap-2 bg-white dark:bg-slate-900 border-2',
                      active ? 'border-emerald-500' : 'border-slate-200/70 dark:border-slate-800',
                    ),
                  ]}
                >
                  <IconTile icon={tpl.icon} color={tpl.color} size="sm" />
                  <Text variant="subhead" weight="semibold" numberOfLines={1}>
                    {tpl.title}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {`${tpl.items.length} öğe`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FieldLabel>
      ) : null}

      <FieldLabel label="Simge">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2 px-1 py-1`} style={tw`-mx-1`}>
          {icons.map((name) => {
            const active = name === icon;
            return (
              <Pressable
                key={name}
                onPress={() => setIcon(name)}
                accessibilityRole="button"
                accessibilityLabel={`Simge ${name}`}
                accessibilityState={{ selected: active }}
                style={[tw`p-[3px] rounded-[16px]`, { borderWidth: 2, borderColor: active ? color : 'transparent' }]}
              >
                <IconTile icon={name} color={color} solid={active} />
              </Pressable>
            );
          })}
        </ScrollView>
      </FieldLabel>

      <FieldLabel label="Renk">
        <ColorPicker colors={LIST_COLORS} value={color} onChange={setColor} />
      </FieldLabel>

      <ListGroup footer={isShared ? 'Ailendeki herkes bu listeyi görebilir ve düzenleyebilir.' : 'Sadece sen ve davet ettiğin kişiler görebilir.'}>
        <SwitchRow title="Aile ile paylaş" icon="Users" iconColor={color} value={isShared} onValueChange={setIsShared} />
      </ListGroup>
    </FormScreen>
  );
};
