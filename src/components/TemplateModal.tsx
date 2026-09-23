import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AlertCircle, Check, CheckSquare, Layers, Plus, ShoppingCart, StickyNote, Trash2, X } from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { ListTemplate, ListType, TemplateItem } from '../types';
import { ICON_MAP } from './CategoryModal';
import { Btn, Grid, Input, Overlay, Select, Text } from './ui';

interface TemplateModalProps {
  initialTemplate?: ListTemplate | null;
  defaultType?: ListType;
  onClose: () => void;
}

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const lookupIcon = (name: string): IconType =>
  ((ICON_MAP as Record<string, unknown>)[name] as IconType | undefined) || ShoppingCart;

const COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#f59e0b', // amber
  '#ef4444', // red
  '#64748b', // slate
];

const ICONS = [
  { name: 'ShoppingCart', label: 'Market' },
  { name: 'Sparkles', label: 'Temizlik' },
  { name: 'Utensils', label: 'Mutfak' },
  { name: 'Plane', label: 'Seyahat' },
  { name: 'Home', label: 'Ev' },
  { name: 'CheckSquare', label: 'Görev' },
  { name: 'Briefcase', label: 'İş' },
  { name: 'StickyNote', label: 'Not' },
  { name: 'Heart', label: 'Bakım' },
  { name: 'Laptop', label: 'Teknoloji' },
];

const UNIT_OPTIONS = ['adet', 'kg', 'paket', 'lt', 'demet', 'gram', 'koli'].map((u) => ({ value: u, label: u }));

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
];

export const TemplateModal: React.FC<TemplateModalProps> = ({ initialTemplate, defaultType = 'SHOPPING', onClose }) => {
  const { addTemplate, updateTemplate, categories } = useAppStore();

  const isEditing = !!initialTemplate;

  const [title, setTitle] = useState(initialTemplate?.title || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [type, setType] = useState<ListType>(initialTemplate?.type || defaultType);
  const [color, setColor] = useState(initialTemplate?.color || '#10b981');
  const [icon, setIcon] = useState(
    initialTemplate?.icon || (type === 'SHOPPING' ? 'ShoppingCart' : type === 'TODO' ? 'CheckSquare' : 'StickyNote'),
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Items in template
  const [items, setItems] = useState<TemplateItem[]>(
    initialTemplate?.items && initialTemplate.items.length > 0
      ? initialTemplate.items
      : [
          {
            id: `ti-1`,
            title: '',
            quantity: 1,
            unit: 'adet',
            price: 0,
            priority: 'MEDIUM',
            categoryId: '',
          },
        ],
  );

  // Web keeps the raw number-input text; keep per-row text so decimals can be typed.
  const [quantityText, setQuantityText] = useState<Record<string, string>>({});

  const typeCategories = categories.filter((c) => c.type === type);

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `ti-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: '',
        quantity: 1,
        unit: 'adet',
        price: 0,
        priority: 'MEDIUM',
        categoryId: typeCategories[0]?.id || '',
      },
    ]);
  };

  const handleUpdateItem = (index: number, updates: Partial<TemplateItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ id: `ti-1`, title: '', quantity: 1, unit: 'adet', price: 0, priority: 'MEDIUM', categoryId: '' }]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Lütfen şablon için bir başlık girin.');
      return;
    }

    const validItems = items
      .filter((i) => i.title.trim().length > 0)
      .map((i) => ({
        ...i,
        title: i.title.trim(),
        categoryId: i.categoryId || typeCategories[0]?.id || '',
      }));

    if (validItems.length === 0) {
      setErrorMessage('Lütfen şablona en az 1 adet geçerli madde ekleyin.');
      return;
    }

    if (isEditing && initialTemplate) {
      updateTemplate(initialTemplate.id, {
        title: title.trim(),
        description: description.trim(),
        type,
        color,
        icon,
        items: validItems,
      });
    } else {
      const newTemplate: ListTemplate = {
        id: `tmpl-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        type,
        color,
        icon,
        items: validItems,
        isCustom: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addTemplate(newTemplate);
    }

    onClose();
  };

  const SelectedIconComp = lookupIcon(icon);

  const typeButton = (
    value: ListType,
    label: string,
    Icon: IconType,
    iconClass: string,
    activeBox: string,
    activeText: string,
    nextIcon: string,
    nextColor: string,
  ) => {
    const active = type === value;
    return (
      <Btn
        onPress={() => {
          setType(value);
          setIcon(nextIcon);
          setColor(nextColor);
        }}
        className={`flex-col items-center justify-center p-2.5 rounded-2xl border ${
          active ? activeBox : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <View style={tw`mb-1`}>
          <Icon {...ic(`w-4 h-4 ${iconClass}`)} />
        </View>
        <Text
          className={`text-xs ${active ? `${activeText} font-bold` : 'text-slate-600 dark:text-slate-400'}`}
        >
          {label}
        </Text>
      </Btn>
    );
  };

  const labelClass = 'text-xs font-semibold text-slate-700 dark:text-slate-300';

  return (
    <Overlay onClose={onClose}>
      <View
        style={[
          tw`bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full self-center p-5 shadow-2xl border border-slate-100 dark:border-slate-800`,
          { maxHeight: '92%' },
        ]}
      >
        {/* Header */}
        <View
          style={tw`flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0`}
        >
          <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
            <View
              style={[
                tw`w-10 h-10 rounded-2xl items-center justify-center shadow-sm shrink-0`,
                { backgroundColor: color },
              ]}
            >
              <SelectedIconComp {...ic('w-5 h-5 text-white')} />
            </View>
            <View style={tw`flex-1 min-w-0`}>
              <Text className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isEditing ? 'Şablonu Düzenle' : 'Yeni Liste Şablonu Oluştur'}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                Sık tekrarladığınız listeleri şablon olarak kaydedin
              </Text>
            </View>
          </View>

          <Btn onPress={onClose} className="p-1.5 rounded-full" accessibilityLabel="Kapat">
            <X {...ic('w-5 h-5 text-slate-400')} />
          </Btn>
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          style={tw`shrink`}
          contentContainerStyle={tw`gap-4 pt-4`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View
              style={tw`p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex-row items-center gap-2`}
            >
              <AlertCircle {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
              <Text className="text-rose-800 dark:text-rose-300 text-xs font-semibold flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          {/* List Type Selection */}
          <View>
            <Text className={`${labelClass} mb-1.5`}>Şablon Türü</Text>
            <Grid cols={3} gap={2}>
              {typeButton(
                'SHOPPING',
                'Alışveriş',
                ShoppingCart,
                'text-emerald-600 dark:text-emerald-400',
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
                'text-emerald-800 dark:text-emerald-300',
                'ShoppingCart',
                '#10b981',
              )}
              {typeButton(
                'TODO',
                'Yapılacaklar',
                CheckSquare,
                'text-amber-500 dark:text-amber-400',
                'border-amber-500 bg-amber-50 dark:bg-amber-950/50',
                'text-amber-800 dark:text-amber-300',
                'CheckSquare',
                '#f59e0b',
              )}
              {typeButton(
                'NOTE',
                'Not & Fikir',
                StickyNote,
                'text-purple-600 dark:text-purple-400',
                'border-purple-500 bg-purple-50 dark:bg-purple-950/50',
                'text-purple-800 dark:text-purple-300',
                'StickyNote',
                '#8b5cf6',
              )}
            </Grid>
          </View>

          {/* Title & Description */}
          <View style={tw`gap-2.5`}>
            <View>
              <Text className={`${labelClass} mb-1`}>Şablon Başlığı *</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Örn: Haftalık Organik Pazar, Kamp Malzemeleri..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-medium"
              />
            </View>

            <View>
              <Text className={`${labelClass} mb-1`}>Açıklama (İsteğe bağlı)</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Bu liste şablonunun amacı..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
              />
            </View>
          </View>

          {/* Color & Icon Picker */}
          <View style={tw`gap-3`}>
            <View>
              <Text className={`${labelClass} mb-1.5`}>Tema Rengi</Text>
              <View
                style={tw`flex-row flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700`}
              >
                {COLORS.map((c) => (
                  <Btn
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-6 h-6 rounded-full relative items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check {...ic('w-3.5 h-3.5 text-white', 3)} />}
                  </Btn>
                ))}
              </View>
            </View>

            <View>
              <Text className={`${labelClass} mb-1.5`}>Simge</Text>
              <View
                style={tw`flex-row flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700`}
              >
                {ICONS.map((ico) => {
                  const IcoComp = lookupIcon(ico.name);
                  const active = icon === ico.name;
                  return (
                    <Btn
                      key={ico.name}
                      onPress={() => setIcon(ico.name)}
                      accessibilityLabel={ico.label}
                      className={`p-1.5 rounded-lg ${
                        active
                          ? 'bg-white dark:bg-slate-700 shadow-sm border-2 border-slate-800 dark:border-white'
                          : 'border-2 border-transparent'
                      }`}
                    >
                      <IcoComp
                        {...ic(
                          `w-4 h-4 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`,
                        )}
                      />
                    </Btn>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Pre-defined Items List */}
          <View style={tw`gap-2 pt-2 border-t border-slate-100 dark:border-slate-800`}>
            <View style={tw`flex-row items-center justify-between gap-2`}>
              <View style={tw`flex-1 min-w-0`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Layers {...ic('w-3.5 h-3.5 text-slate-500 dark:text-slate-400')} />
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    Şablon Maddeleri ({items.filter((i) => i.title.trim()).length})
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                  Bu şablon kullanıldığında otomatik eklenecek ürün/maddeler
                </Text>
              </View>

              <Btn
                onPress={handleAddItemRow}
                className="flex-row items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm"
              >
                <Plus {...ic('w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300')} />
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">Madde Ekle</Text>
              </Btn>
            </View>

            <ScrollView
              style={tw`max-h-60`}
              contentContainerStyle={tw`gap-2.5`}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {items.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={tw`p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 gap-2`}
                >
                  <View style={tw`flex-row items-center gap-2`}>
                    <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500 w-4 text-center">
                      {idx + 1}
                    </Text>
                    <Input
                      value={item.title}
                      onChangeText={(text) => handleUpdateItem(idx, { title: text })}
                      placeholder={`Madde / Ürün adı...`}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-medium"
                    />
                    <Btn
                      onPress={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded-lg shrink-0"
                      accessibilityLabel="Maddeyi Çıkar"
                    >
                      <Trash2 {...ic('w-4 h-4 text-slate-400')} />
                    </Btn>
                  </View>

                  <View style={tw`flex-row items-center gap-2 pl-6 flex-wrap`}>
                    {type === 'SHOPPING' && (
                      <View style={tw`flex-row items-center gap-1.5`}>
                        <Input
                          value={quantityText[item.id] ?? String(item.quantity || 1)}
                          onChangeText={(text) => {
                            setQuantityText((prev) => ({ ...prev, [item.id]: text }));
                            handleUpdateItem(idx, { quantity: parseFloat(text.replace(',', '.')) || 1 });
                          }}
                          onBlur={() =>
                            setQuantityText((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            })
                          }
                          keyboardType="decimal-pad"
                          accessibilityLabel="Miktar"
                          className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-center font-semibold"
                        />
                        <Select
                          value={item.unit || 'adet'}
                          onChange={(value) => handleUpdateItem(idx, { unit: value })}
                          options={UNIT_OPTIONS}
                          title="Birim"
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg gap-1"
                          textClassName="text-[11px] font-medium text-slate-900 dark:text-white"
                        />
                      </View>
                    )}

                    {type === 'TODO' && (
                      <View style={tw`flex-row items-center gap-1`}>
                        <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Öncelik:</Text>
                        <Select
                          value={item.priority || 'MEDIUM'}
                          onChange={(value) =>
                            handleUpdateItem(idx, { priority: value as TemplateItem['priority'] })
                          }
                          options={PRIORITY_OPTIONS}
                          title="Öncelik"
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg gap-1"
                          textClassName="text-[11px] font-semibold text-slate-900 dark:text-white"
                        />
                      </View>
                    )}

                    <View style={tw`flex-row items-center gap-1 flex-1 min-w-[130px]`}>
                      <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Kategori:</Text>
                      <View style={tw`flex-1`}>
                        <Select
                          value={item.categoryId || ''}
                          onChange={(value) => handleUpdateItem(idx, { categoryId: value })}
                          options={[
                            { value: '', label: 'Kategori Seç (Opsiyonel)' },
                            ...typeCategories.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                          title="Kategori"
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-1"
                          textClassName="text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Footer Submit */}
          <View
            style={tw`pt-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-end gap-2 shrink-0`}
          >
            <Btn onPress={onClose} className="px-4 py-2 rounded-xl">
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vazgeç</Text>
            </Btn>
            <Btn onPress={handleSubmit} className="px-5 py-2 bg-emerald-600 rounded-xl shadow-sm">
              <Text className="text-white font-bold text-xs">{isEditing ? 'Şablonu Güncelle' : 'Şablonu Kaydet'}</Text>
            </Btn>
          </View>
        </ScrollView>
      </View>
    </Overlay>
  );
};
