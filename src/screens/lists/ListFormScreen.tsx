import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { Camera, X as XIcon } from 'lucide-react-native';

import {
  Btn,
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
import { pickAndUploadPhoto } from '../../lib/photoPicker';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { AnyListType } from '../../types';
import { LIST_ICONS, LIST_TYPE_META, LIST_TYPES } from './listMeta';
import { ROOM_ICONS, ROOM_META } from './roomMeta';

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
  const initialType: AnyListType = existing?.type ?? route.params?.type ?? 'SHOPPING';

  const [type, setType] = useState<AnyListType>(initialType);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(existing?.coverPhoto);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? (initialType === 'ROOM' ? ROOM_META.defaultIcon : LIST_TYPE_META[initialType].defaultIcon));
  const [color, setColor] = useState(existing?.color ?? LIST_COLORS[0]);
  const [isShared, setIsShared] = useState(existing ? existing.isShared !== false : true);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isRoom = type === 'ROOM';
  const meta = isRoom ? ROOM_META : LIST_TYPE_META[type];
  const typeTemplates = useMemo(() => (isRoom ? [] : templates.filter((t) => t.type === type)), [templates, type, isRoom]);
  const icons = useMemo(() => {
    const base = isRoom ? ROOM_ICONS : LIST_ICONS[type];
    return icon && !base.includes(icon) ? [icon, ...base] : base;
  }, [type, icon, isRoom]);

  const trimmed = title.trim();
  const titleError = touched && !trimmed ? 'Liste adı gerekli' : undefined;
  const valid = trimmed.length > 0 && trimmed.length <= TITLE_MAX;

  const changeType = (next: AnyListType) => {
    setType(next);
    setTemplateId(null);
    if (next === 'ROOM') {
      if (!ROOM_ICONS.includes(icon)) setIcon(ROOM_META.defaultIcon);
      return;
    }
    if (!LIST_ICONS[next].includes(icon)) setIcon(LIST_TYPE_META[next].defaultIcon);
  };

  const pickCoverPhoto = () => pickAndUploadPhoto((url) => setCoverPhoto(url), () => setUploadingCover(true), () => setUploadingCover(false));

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
      updateList(existing.id, { title: trimmed, description: desc, color, icon, isShared, ...(isRoom ? { coverPhoto } : {}) });
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
      newId = createList({ title: trimmed, description: desc, type, color, icon, isShared, coverPhoto, familyId: currentUser.familyId });
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
          options={[
            ...LIST_TYPES.map((t) => ({ value: t as AnyListType, label: LIST_TYPE_META[t].label, icon: LIST_TYPE_META[t].icon })),
            { value: 'ROOM' as AnyListType, label: ROOM_META.label, icon: ROOM_META.icon },
          ]}
          value={type}
          onChange={changeType}
        />
      ) : null}

      {isRoom ? (
        <View style={tw`items-center gap-2 pt-1`}>
          <Pressable onPress={pickCoverPhoto} accessibilityRole="button" accessibilityLabel="Kapak fotoğrafı seç">
            {coverPhoto ? (
              <View>
                <Image source={{ uri: coverPhoto }} style={tw`w-28 h-28 rounded-3xl bg-slate-100 dark:bg-slate-800`} />
                <Btn
                  onPress={() => setCoverPhoto(undefined)}
                  accessibilityLabel="Fotoğrafı kaldır"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 items-center justify-center"
                >
                  <XIcon size={14} color="#fff" />
                </Btn>
              </View>
            ) : (
              <View style={tw`w-28 h-28 rounded-3xl bg-slate-100 dark:bg-slate-800 items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700`}>
                <Camera size={26} color="#94a3b8" />
              </View>
            )}
          </Pressable>
          <Text variant="footnote" tone="muted">
            {uploadingCover ? 'Yükleniyor…' : 'Kapak fotoğrafı (isteğe bağlı)'}
          </Text>
        </View>
      ) : (
        <View style={tw`items-center gap-2 pt-1`}>
          <IconTile icon={icon} color={color} size="lg" solid />
          <Text variant="footnote" tone="muted">
            {meta.singular}
          </Text>
        </View>
      )}

      <TextField
        label="Liste adı"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        placeholder={type === 'SHOPPING' ? 'Örn. Haftalık market' : type === 'TODO' ? 'Örn. Ev işleri' : type === 'ROOM' ? 'Örn. Salon' : 'Örn. Tarifler'}
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
