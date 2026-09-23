import React, { useState } from 'react';
import { View } from 'react-native';
import { FileQuestion, Minus, Plus, Trash2 } from 'lucide-react-native';

import {
  Btn,
  Button,
  ChipRow,
  DateField,
  EmptyState,
  FieldLabel,
  FormScreen,
  Segmented,
  SelectField,
  Text,
  TextField,
  confirmAction,
  showToast,
} from '../../design';
import { formatMoney, isoDate, parseAmount } from '../../logic/format';
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
  const categories = useCategoriesFor(list?.type);
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

  const noun = isShopping ? 'Ürün' : isTodo ? 'Görev' : 'Not';

  return (
    <FormScreen
      title={isEdit ? `${noun} Düzenle` : `Yeni ${noun}`}
      onSubmit={save}
      submitDisabled={!valid}
      footer={isEdit ? <Button title="Sil" icon={Trash2} variant="dangerTinted" onPress={remove} fullWidth /> : undefined}
    >
      <TextField
        label={isShopping ? 'Ürün adı' : 'Başlık'}
        value={title}
        onChangeText={setTitle}
        placeholder={isShopping ? 'Örn. Süt' : 'Örn. Faturayı öde'}
        autoFocus={!isEdit}
        returnKeyType="done"
      />

      {isShopping ? (
        <>
          <FieldLabel label="Miktar">
            <View style={tw`flex-row items-center gap-3`}>
              <Btn
                onPress={() => setQuantity((q) => Math.max(step, +(q - step).toFixed(2)))}
                disabled={quantity <= step}
                accessibilityLabel="Azalt"
                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center"
              >
                <Minus size={22} color="#64748b" />
              </Btn>
              <View style={tw`flex-1 items-center`}>
                <Text variant="title2">{`${quantity.toLocaleString('tr-TR')} ${unit}`}</Text>
              </View>
              <Btn
                onPress={() => setQuantity((q) => +(q + step).toFixed(2))}
                accessibilityLabel="Artır"
                className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center"
              >
                <Plus size={22} color="#fff" />
              </Btn>
            </View>
          </FieldLabel>
          <FieldLabel label="Birim">
            <ChipRow
              options={UNITS.map((u) => ({ value: u, label: u }))}
              value={unit}
              onChange={(u) => {
                setUnit(u);
                const s = stepFor(u);
                setQuantity((q) => (q < s || (s >= 1 && q % 1 !== 0) ? s : q));
              }}
            />
          </FieldLabel>
          <TextField
            label="Birim fiyat (₺)"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^\d.,]/g, ''))}
            placeholder="0"
            keyboardType="decimal-pad"
            hint={lineTotal > 0 ? `Toplam ${formatMoney(lineTotal)}` : 'İsteğe bağlı — sepet toplamında kullanılır.'}
          />
        </>
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
        <SelectField
          label="Kategori"
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Kategori seçin"
        />
      ) : null}

      <SelectField
        label="Atanan kişi"
        value={assignedTo}
        onChange={setAssignedTo}
        options={[{ value: '', label: 'Atanmamış' }, ...people.map((u) => ({ value: u.id, label: /^(https?:|data:|\/)/.test(u.avatar || '') ? u.name : `${u.avatar} ${u.name}` }))]}
        placeholder="Atanmamış"
      />

      <TextField label="Not" value={content} onChangeText={setContent} placeholder="İsteğe bağlı" multiline />
    </FormScreen>
  );
};
