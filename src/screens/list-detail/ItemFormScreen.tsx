import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Camera, FileQuestion, Link2, Minus, Plus, Trash2, X as XIcon } from 'lucide-react-native';

import {
  Btn,
  Button,
  Card,
  ChipRow,
  DateField,
  EmptyState,
  FieldLabel,
  FormScreen,
  IconTile,
  Input,
  palette,
  Segmented,
  Text,
  TextField,
  confirmAction,
  showToast,
  UserAvatar,
} from '../../design';
import { formatMoney, isoDate, parseAmount } from '../../logic/format';
import { pickAndUploadPhoto } from '../../lib/photoPicker';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { UNITS, useAccessibleList, useCategoriesFor, usePeople } from './helpers';

type Priority = NonNullable<ListItem['priority']>;
type DueQuick = 'today' | 'tomorrow' | 'week' | 'none' | 'custom';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
];

const DUE_OPTIONS: { value: DueQuick; label: string }[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'tomorrow', label: 'Yarın' },
  { value: 'week', label: 'Haftaya' },
  { value: 'none', label: 'Tarih yok' },
];

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

function dueQuickOf(value: string): DueQuick {
  if (!value) return 'none';
  if (value === addDays(0)) return 'today';
  if (value === addDays(1)) return 'tomorrow';
  if (value === addDays(7)) return 'week';
  return 'custom';
}

function stepFor(unit: string) {
  if (unit === 'g') return 100;
  if (unit === 'kg' || unit === 'lt') return 0.5;
  return 1;
}

const formatPriceInput = (price?: number) => (price ? String(price).replace('.', ',') : '');

export const ItemFormScreen: React.FC<RootScreenProps<'ItemForm'>> = ({ navigation, route }) => {
  const { listId, itemId } = route.params;
  const list = useAccessibleList(listId);
  const item = useAppStore((s) => (itemId ? s.items.find((i) => i.id === itemId) : undefined));
  const categories = useCategoriesFor(list?.type === 'ROOM' ? undefined : list?.type);
  const people = usePeople(list);
  const addItem = useAppStore((s) => s.addItem);
  const updateItem = useAppStore((s) => s.updateItem);
  const deleteItem = useAppStore((s) => s.deleteItem);

  const isEdit = !!itemId;
  const [title, setTitle] = useState(item?.title ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '');
  const [assignedTo, setAssignedTo] = useState(item?.assignedTo ?? '');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [unit, setUnit] = useState(item?.unit || 'adet');
  const [price, setPrice] = useState(formatPriceInput(item?.price));
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(item?.dueDate?.split('T')[0] ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [purchasedQuantity, setPurchasedQuantity] = useState(item?.purchasedQuantity || 0);
  const [photos, setPhotos] = useState<string[]>(item?.photos ?? []);
  const [links, setLinks] = useState<string[]>(item?.links ?? []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (!list || (isEdit && !item)) {
    return (
      <FormScreen title="Öğe">
        <EmptyState
          icon={FileQuestion}
          title="Öğe bulunamadı"
          message="Bu öğe silinmiş olabilir ya da erişim izniniz yok."
          action={{ label: 'Kapat', onPress: () => navigation.goBack() }}
        />
      </FormScreen>
    );
  }

  const isShopping = list.type === 'SHOPPING';
  const isTodo = list.type === 'TODO';
  const isRoom = list.type === 'ROOM';
  const valid = title.trim().length > 0;
  const step = stepFor(unit);
  const lineTotal = parseAmount(price) * quantity;

  const save = () => {
    if (!valid) return;
    const fields: Partial<ListItem> = {
      title: title.trim(),
      categoryId,
      assignedTo: assignedTo || undefined,
      content: content.trim() || undefined,
    };
    if (isShopping) Object.assign(fields, { quantity, unit, price: parseAmount(price) });
    if (isTodo) Object.assign(fields, { priority, dueDate: dueDate || undefined });
    if (isRoom) {
      const target = Math.max(quantity, 1);
      const purchased = Math.min(purchasedQuantity, target);
      Object.assign(fields, {
        quantity: target,
        unit,
        price: parseAmount(price),
        purchasedQuantity: purchased,
        isCompleted: purchased >= target,
        photos: photos.filter(Boolean),
        links: links.map((l) => l.trim()).filter(Boolean),
      });
    }

    if (item) {
      // Send explicit empty values so cleared fields are cleared on the server too.
      updateItem(item.id, {
        ...fields,
        assignedTo: assignedTo || '',
        content: content.trim(),
        ...(isTodo ? { dueDate: dueDate || '' } : {}),
      });
    } else {
      addItem({
        listId: list.id,
        isCompleted: false,
        price: 0,
        quantity: 1,
        unit: 'adet',
        ...fields,
        title: title.trim(),
        categoryId,
      });
      showToast(isShopping ? 'Ürün eklendi' : 'Görev eklendi');
    }
    navigation.goBack();
  };

  const remove = () =>
    confirmAction({
      title: 'Silinsin mi?',
      message: `"${item?.title}" listeden kaldırılacak.`,
      onConfirm: () => {
        if (item) deleteItem(item.id);
        navigation.goBack();
      },
    });

  const setQuick = (q: DueQuick) => {
    if (q === 'today') setDueDate(addDays(0));
    else if (q === 'tomorrow') setDueDate(addDays(1));
    else if (q === 'week') setDueDate(addDays(7));
    else if (q === 'none') setDueDate('');
  };

  const noun = isShopping || isRoom ? 'Ürün' : isTodo ? 'Görev' : 'Not';

  return (
    <FormScreen
      title={isEdit ? `${noun} Düzenle` : `Yeni ${noun}`}
      onSubmit={save}
      submitDisabled={!valid}
      footer={isEdit ? <Button title="Sil" icon={Trash2} variant="dangerTinted" onPress={remove} fullWidth /> : undefined}
    >
      <TextField
        label={isShopping || isRoom ? 'Ürün adı' : 'Başlık'}
        value={title}
        onChangeText={setTitle}
        placeholder={isShopping ? 'Örn. Süt' : isRoom ? 'Örn. Koltuk' : 'Örn. Faturayı öde'}
        autoFocus={!isEdit}
        returnKeyType="done"
      />

      {isShopping || isRoom ? (
        <Card className="gap-4">
          <View style={tw`flex-row items-center justify-between`}>
            <Text variant="body" weight="semibold">
              {isRoom ? 'Hedeflenen miktar' : 'Miktar'}
            </Text>
            <View style={tw`flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1`}>
              <Btn
                onPress={() => setQuantity((q) => Math.max(step, +(q - step).toFixed(2)))}
                disabled={quantity <= step}
                accessibilityLabel="Azalt"
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center"
              >
                <Minus size={20} color="#64748b" />
              </Btn>
              <Text variant="headline" className="min-w-[72px] text-center">{`${quantity.toLocaleString('tr-TR')} ${unit}`}</Text>
              <Btn
                onPress={() => setQuantity((q) => +(q + step).toFixed(2))}
                accessibilityLabel="Artır"
                className="w-10 h-10 rounded-full bg-emerald-600 items-center justify-center"
              >
                <Plus size={20} color="#fff" />
              </Btn>
            </View>
          </View>
          <ChipRow
            options={UNITS.map((u) => ({ value: u, label: u }))}
            value={unit}
            onChange={(u) => {
              setUnit(u);
              const s2 = stepFor(u);
              setQuantity((q) => (q < s2 || (s2 >= 1 && q % 1 !== 0) ? s2 : q));
            }}
          />
          <View style={tw`h-px bg-slate-100 dark:bg-slate-800`} />
          <View style={tw`flex-row items-center gap-3`}>
            <Text variant="body" weight="semibold" className="flex-1">
              {isRoom ? 'Tahmini birim fiyat' : 'Birim fiyat'}
            </Text>
            <View style={tw`flex-row items-center h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 min-w-[120px]`}>
              <Text variant="body" tone="muted">
                ₺
              </Text>
              <Input
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                keyboardType="decimal-pad"
                accessibilityLabel="Birim fiyat"
                className="flex-1 text-[17px] font-semibold text-right ml-1"
              />
            </View>
          </View>
          {lineTotal > 0 ? (
            <View style={tw`flex-row justify-between`}>
              <Text variant="subhead" tone="muted">
                {isRoom ? 'Hedef toplam' : 'Satır toplamı'}
              </Text>
              <Text variant="subhead" weight="bold" tone="brand">
                {formatMoney(lineTotal)}
              </Text>
            </View>
          ) : (
            <Text variant="caption" tone="muted">
              {isRoom ? 'Fiyat isteğe bağlı — oda bütçesinde kullanılır.' : 'Fiyat isteğe bağlı — sepet toplamında kullanılır.'}
            </Text>
          )}
        </Card>
      ) : null}

      {isRoom ? (
        <Card className="gap-3">
          <View style={tw`flex-row items-center justify-between`}>
            <Text variant="body" weight="semibold">
              Satın alınan
            </Text>
            <View style={tw`flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1`}>
              <Btn
                onPress={() => setPurchasedQuantity((q) => Math.max(0, +(q - step).toFixed(2)))}
                disabled={purchasedQuantity <= 0}
                accessibilityLabel="Azalt"
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center"
              >
                <Minus size={20} color="#64748b" />
              </Btn>
              <Text variant="headline" className="min-w-[72px] text-center">{`${purchasedQuantity.toLocaleString('tr-TR')} ${unit}`}</Text>
              <Btn
                onPress={() => setPurchasedQuantity((q) => Math.min(quantity, +(q + step).toFixed(2)))}
                disabled={purchasedQuantity >= quantity}
                accessibilityLabel="Artır"
                className="w-10 h-10 rounded-full bg-emerald-600 items-center justify-center"
              >
                <Plus size={20} color="#fff" />
              </Btn>
            </View>
          </View>
          <Text variant="caption" tone="muted">
            {`Hedeflenen ${quantity.toLocaleString('tr-TR')} ${unit} üzerinden ne kadarı alındı.`}
          </Text>
        </Card>
      ) : null}

      {isRoom ? (
        <FieldLabel label="Fotoğraflar">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={tw`gap-2 px-1`}>
            {photos.map((uri, index) => (
              <View key={`${uri}-${index}`}>
                <Image source={{ uri }} style={tw`w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800`} />
                <Btn
                  onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                  accessibilityLabel="Fotoğrafı kaldır"
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 items-center justify-center"
                >
                  <XIcon size={12} color="#fff" />
                </Btn>
              </View>
            ))}
            <Pressable
              onPress={() => pickAndUploadPhoto((url) => setPhotos((prev) => [...prev, url]), () => setUploadingPhoto(true), () => setUploadingPhoto(false))}
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf ekle"
              style={tw`w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700`}
            >
              <Camera size={22} color="#94a3b8" />
            </Pressable>
          </ScrollView>
          {uploadingPhoto ? (
            <Text variant="caption" tone="muted" className="px-1 pt-1">
              Yükleniyor…
            </Text>
          ) : null}
        </FieldLabel>
      ) : null}

      {isRoom ? (
        <FieldLabel label="Alışveriş linkleri">
          <View style={tw`gap-2`}>
            {links.map((link, index) => (
              <View key={index} style={tw`flex-row items-center gap-2`}>
                <View style={tw`flex-1`}>
                  <TextField
                    value={link}
                    onChangeText={(t) => setLinks((prev) => prev.map((l, i) => (i === index ? t : l)))}
                    placeholder="https://…"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
                <Btn
                  onPress={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                  accessibilityLabel="Linki kaldır"
                  className="w-11 h-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  <XIcon size={18} color="#64748b" />
                </Btn>
              </View>
            ))}
            <Btn
              onPress={() => setLinks((prev) => [...prev, ''])}
              accessibilityLabel="Link ekle"
              className="flex-row items-center gap-2 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 self-start"
            >
              <Link2 size={16} color={palette.slate500} />
              <Text variant="subhead" weight="semibold">
                Link ekle
              </Text>
            </Btn>
          </View>
        </FieldLabel>
      ) : null}

      {isTodo ? (
        <>
          <FieldLabel label="Öncelik">
            <Segmented options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          </FieldLabel>
          <View style={tw`gap-2.5`}>
            <DateField label="Son tarih" value={dueDate} onChange={setDueDate} placeholder="Tarih yok" />
            <ChipRow options={DUE_OPTIONS} value={dueQuickOf(dueDate)} onChange={setQuick} />
          </View>
        </>
      ) : null}

      {categories.length ? (
        <FieldLabel label="Kategori">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={tw`gap-2`}>
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    tw`flex-row items-center gap-2 h-11 pl-1.5 pr-3.5 rounded-full border`,
                    active
                      ? { backgroundColor: `${c.color}22`, borderColor: c.color }
                      : tw`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`,
                  ]}
                >
                  <IconTile icon={c.icon} color={c.color} size="sm" />
                  <Text variant="subhead" weight={active ? 'bold' : 'medium'} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FieldLabel>
      ) : null}

      {people.length > 1 ? (
        <FieldLabel label="Kim alacak / yapacak?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={tw`gap-2`}>
            {[{ id: '', name: 'Herkes', avatar: '👥', color: palette.slate500 }, ...people].map((u) => {
              const active = (assignedTo || '') === u.id;
              return (
                <Pressable
                  key={u.id || 'none'}
                  onPress={() => setAssignedTo(u.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={tw.style(
                    'flex-row items-center gap-2 h-11 pl-1.5 pr-3.5 rounded-full border',
                    active ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                  )}
                >
                  <UserAvatar avatar={u.avatar} name={u.name} color={u.color} size="sm" />
                  <Text variant="subhead" weight={active ? 'bold' : 'medium'}>
                    {u.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FieldLabel>
      ) : null}

      <TextField label="Not" value={content} onChangeText={setContent} placeholder="İsteğe bağlı" multiline />
    </FormScreen>
  );
};
