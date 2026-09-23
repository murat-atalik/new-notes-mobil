import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Mic, Plus, Sparkles, Tag, X } from 'lucide-react-native';

import { useSpeechToText } from '../hooks/useSpeechToText';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { AppList } from '../types';
import { CategoryModal } from './CategoryModal';
import { Btn, DateInput, Grid, Input, Overlay, Panel, Select, Text } from './ui';

interface AddItemDrawerProps {
  list: AppList;
  onClose: () => void;
}

const COMMON_UNITS = ['adet', 'kg', 'paket', 'lt', 'demet', 'kutu', 'gr'];

const FIELD_BASE =
  'w-full px-4 text-[16px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white';
const INPUT_CLASS = `${FIELD_BASE} h-12`;
const TEXTAREA_CLASS = `${FIELD_BASE} min-h-[112px] py-3`;
const LABEL_CLASS = 'text-[13px] font-semibold text-slate-700 dark:text-slate-300';

export const AddItemDrawer: React.FC<AddItemDrawerProps> = ({ list, onClose }) => {
  const insets = useSafeAreaInsets();
  const { categories, addItem } = useAppStore();

  const typeCategories = categories.filter((c) => c.type === list.type);
  const displayedCategories = typeCategories.length > 0 ? typeCategories : categories;

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('adet');
  const [categoryId, setCategoryId] = useState(displayedCategories[0]?.id || 'cat-market');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeSpeechField, setActiveSpeechField] = useState<'title' | 'content' | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ lang: 'tr-TR', continuous: true, interimResults: true });

  // Sync speech input to active field
  useEffect(() => {
    if (transcript && activeSpeechField) {
      if (activeSpeechField === 'title') {
        setTitle(transcript);
      } else if (activeSpeechField === 'content') {
        setContent(transcript);
      }
    }
  }, [transcript, activeSpeechField]);

  const handleToggleSpeech = (field: 'title' | 'content') => {
    if (isListening && activeSpeechField === field) {
      stopListening();
      setActiveSpeechField(null);
    } else {
      resetTranscript();
      setActiveSpeechField(field);
      startListening();
    }
  };

  // Quick suggestions based on list type
  const shoppingSuggestions = [
    { title: 'Süt 1L', price: '42.50', categoryId: 'cat-market', unit: 'lt' },
    { title: 'Yumurta (15li)', price: '85.00', categoryId: 'cat-market', unit: 'paket' },
    { title: 'Ekmek', price: '15.00', categoryId: 'cat-market', unit: 'adet' },
    { title: 'Domates', price: '35.00', categoryId: 'cat-manav', unit: 'kg' },
    { title: 'Dana Kıyma', price: '460.00', categoryId: 'cat-sarkuteri', unit: 'kg' },
    { title: 'Deterjan', price: '190.00', categoryId: 'cat-temizlik', unit: 'paket' },
  ];

  const todoSuggestions = [
    { title: 'Fatura Ödemesi', priority: 'HIGH' as const, categoryId: 'cat-todo-finans' },
    { title: 'Haftalık İş Raporu', priority: 'HIGH' as const, categoryId: 'cat-todo-is' },
    { title: 'Ev Temizliği & Düzen', priority: 'MEDIUM' as const, categoryId: 'cat-todo-ev' },
    { title: 'Doktor / Diş Randevusu', priority: 'HIGH' as const, categoryId: 'cat-todo-saglik' },
    { title: 'Kitap Oku (20 sayfa)', priority: 'LOW' as const, categoryId: 'cat-todo-egitim' },
  ];

  const noteSuggestions = [
    { title: 'Yeni Proje / Uygulama Fikri', categoryId: 'cat-note-fikir' },
    { title: 'Haftalık Değerlendirme Notu', categoryId: 'cat-note-toplanti' },
    { title: 'Nefis Yemek Tarifi', categoryId: 'cat-note-tarif' },
    { title: 'Önemli Hesap & Şifre Notu', categoryId: 'cat-note-onemli' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (list.type === 'SHOPPING') {
      const parsedPrice = parseFloat(price);
      const parsedQty = parseFloat(quantity);
      addItem({
        listId: list.id,
        title: title.trim(),
        isCompleted: false,
        price: !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
        quantity: !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1,
        unit: unit,
        categoryId: categoryId,
      });
    } else if (list.type === 'TODO') {
      addItem({
        listId: list.id,
        title: title.trim(),
        isCompleted: false,
        price: 0,
        quantity: 1,
        unit: 'adet',
        categoryId: categoryId,
        priority: priority,
        dueDate: dueDate || undefined,
      });
    } else {
      // NOTE
      addItem({
        listId: list.id,
        title: title.trim(),
        content: content.trim(),
        isCompleted: false,
        price: 0,
        quantity: 1,
        unit: 'adet',
        categoryId: categoryId,
        isPinned: isPinned,
      });
    }

    if (isListening) stopListening();
    onClose();
  };

  const handleClose = () => {
    if (isListening) stopListening();
    onClose();
  };

  const applyShoppingSuggestion = (sug: (typeof shoppingSuggestions)[0]) => {
    setTitle(sug.title);
    setPrice(sug.price);
    setCategoryId(sug.categoryId);
    setUnit(sug.unit);
  };

  const applyTodoSuggestion = (sug: (typeof todoSuggestions)[0]) => {
    setTitle(sug.title);
    setPriority(sug.priority);
    setCategoryId(sug.categoryId);
  };

  const applyNoteSuggestion = (sug: (typeof noteSuggestions)[0]) => {
    setTitle(sug.title);
    setCategoryId(sug.categoryId);
  };

  const suggestionClass =
    'px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';
  const suggestionTextClass = 'text-xs text-slate-700 dark:text-slate-300';

  const renderSpeechButton = (field: 'title' | 'content', label: string) => {
    const active = isListening && activeSpeechField === field;
    return (
      <Btn
        onPress={() => handleToggleSpeech(field)}
        accessibilityLabel={label}
        className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border ${
          active
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
      >
        <Mic {...ic(active ? 'w-3 h-3 text-rose-600 dark:text-rose-400' : 'w-3 h-3 text-slate-500 dark:text-slate-400')} />
        <Text
          className={`text-[11px] font-semibold ${
            active ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {active ? 'Dinleniyor...' : 'Sesle Dikte'}
        </Text>
      </Btn>
    );
  };

  return (
    <Overlay onClose={handleClose} position="bottom">
      <Panel
        className="w-full max-w-lg self-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl"
        style={{ paddingBottom: 20 + insets.bottom }}
      >
        {/* Header */}
        <View
          style={tw`flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4`}
        >
          <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
            <View style={tw`w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center`}>
              <Plus {...ic('w-4 h-4 text-emerald-700 dark:text-emerald-400')} />
            </View>
            <View style={tw`flex-1 min-w-0`}>
              <Text className="font-bold text-slate-900 dark:text-white text-base">
                {list.type === 'SHOPPING' ? 'Yeni Ürün Ekle' : null}
                {list.type === 'TODO' ? 'Yeni Görev Ekle' : null}
                {list.type === 'NOTE' ? 'Yeni Not Ekle' : null}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">{list.title} listesine eklenecek</Text>
            </View>
          </View>
          <Btn
            onPress={handleClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            accessibilityLabel="Kapat"
          >
            <X {...ic('w-5 h-5 text-slate-500 dark:text-slate-400')} />
          </Btn>
        </View>

        {/* Quick Suggestions */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center gap-1 mb-2`}>
            <Sparkles {...ic('w-3 h-3 text-amber-500')} />
            <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Hızlı Şablon & Öneriler
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={tw`flex-row items-center gap-2 pb-1.5`}
          >
            {list.type === 'SHOPPING' &&
              shoppingSuggestions.map((sug, idx) => (
                <Btn key={idx} onPress={() => applyShoppingSuggestion(sug)} className={suggestionClass}>
                  <Text className={suggestionTextClass}>
                    {sug.title} ({sug.price}₺)
                  </Text>
                </Btn>
              ))}
            {list.type === 'TODO' &&
              todoSuggestions.map((sug, idx) => (
                <Btn key={idx} onPress={() => applyTodoSuggestion(sug)} className={suggestionClass}>
                  <Text className={suggestionTextClass}>{sug.title}</Text>
                </Btn>
              ))}
            {list.type === 'NOTE' &&
              noteSuggestions.map((sug, idx) => (
                <Btn key={idx} onPress={() => applyNoteSuggestion(sug)} className={suggestionClass}>
                  <Text className={suggestionTextClass}>{sug.title}</Text>
                </Btn>
              ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={tw`gap-4`}>
          <View>
            <View style={tw`flex-row items-center justify-between mb-1.5`}>
              <Text className={LABEL_CLASS}>
                {list.type === 'NOTE' ? 'Not Başlığı' : list.type === 'TODO' ? 'Görev Başlığı' : 'Ürün Adı'} *
              </Text>
              {isSupported ? renderSpeechButton('title', 'Sesle Dikte Et') : null}
            </View>
            <Input
              autoFocus
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              autoCapitalize="sentences"
              placeholder={
                list.type === 'SHOPPING'
                  ? 'Örn: Süt, Dana Kıyma, Bulaşık Tableti'
                  : list.type === 'TODO'
                    ? 'Örn: Faturayı öde, Randevu al'
                    : 'Not başlığı...'
              }
              className={INPUT_CLASS}
            />
          </View>

          {/* Shopping Specific Fields: Price, Quantity, Unit */}
          {list.type === 'SHOPPING' && (
            <View style={tw`gap-3`}>
              {/* Price */}
              <View>
                <Text className={`${LABEL_CLASS} mb-1.5`}>Birim Fiyat (₺)</Text>
                <Input
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  value={price}
                  selectTextOnFocus
                  onChangeText={setPrice}
                  onSubmitEditing={handleSubmit}
                  placeholder="0.00"
                  className={INPUT_CLASS}
                />
              </View>

              <View style={tw`flex-row gap-3`}>
                {/* Quantity with Stepper */}
                <View style={{ flex: 3 }}>
                  <Text className={`${LABEL_CLASS} mb-1.5`}>Miktar</Text>
                  <View
                    style={tw`h-12 flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden`}
                  >
                    <Btn
                      onPress={() => {
                        const current = parseFloat(quantity) || 1;
                        const next = Math.max(0.5, current - 1);
                        setQuantity(next.toString());
                      }}
                      className="w-11 h-full items-center justify-center"
                      accessibilityLabel="Azalt"
                    >
                      <Text className="text-slate-500 dark:text-slate-400 text-lg font-bold">-</Text>
                    </Btn>
                    <Input
                      keyboardType="decimal-pad"
                      value={quantity}
                      selectTextOnFocus
                      onChangeText={setQuantity}
                      onBlur={() => {
                        if (!quantity.trim() || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
                          setQuantity('1');
                        }
                      }}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="done"
                      placeholder="1"
                      className="flex-1 h-full text-center text-[16px] bg-transparent text-slate-900 dark:text-white font-bold"
                    />
                    <Btn
                      onPress={() => {
                        const current = parseFloat(quantity) || 1;
                        setQuantity((current + 1).toString());
                      }}
                      className="w-11 h-full items-center justify-center"
                      accessibilityLabel="Artır"
                    >
                      <Text className="text-slate-500 dark:text-slate-400 text-lg font-bold">+</Text>
                    </Btn>
                  </View>
                </View>

                {/* Unit */}
                <View style={{ flex: 2 }}>
                  <Text className={`${LABEL_CLASS} mb-1.5`}>Birim</Text>
                  <Select
                    value={unit}
                    onChange={setUnit}
                    title="Birim"
                    options={COMMON_UNITS.map((u) => ({ value: u, label: u }))}
                    textClassName="text-[16px] text-slate-900 dark:text-white"
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl"
                  />
                </View>
              </View>

              {/* Quick Quantity Presets */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={tw`flex-row items-center gap-2 pb-0.5`}
              >
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Hızlı Adet:</Text>
                {['1', '2', '3', '4', '5', '10'].map((qtyVal) => (
                  <Btn
                    key={qtyVal}
                    onPress={() => setQuantity(qtyVal)}
                    className={`min-w-[40px] px-3 py-2 items-center rounded-xl border ${
                      quantity === qtyVal
                        ? 'bg-emerald-600 border-emerald-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        quantity === qtyVal ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {qtyVal}
                    </Text>
                  </Btn>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Note Specific Content */}
          {list.type === 'NOTE' && (
            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text className={LABEL_CLASS}>Not Detayı & İçerik</Text>
                {isSupported ? renderSpeechButton('content', 'Sesle İçeriği Dikte Et') : null}
              </View>
              <Input
                multiline
                numberOfLines={4}
                value={content}
                onChangeText={setContent}
                autoCapitalize="sentences"
                placeholder="Not içeriğini buraya yazın veya mikrofon ile konuşun..."
                className={TEXTAREA_CLASS}
              />
              {isListening && interimTranscript ? (
                <View
                  style={tw`px-2 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-lg mt-1 border border-purple-100 dark:border-purple-900`}
                >
                  <Text className="text-[11px] text-purple-600 dark:text-purple-400 italic">⚡ {interimTranscript}...</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* To-Do Specific Fields: Priority & Due Date */}
          {list.type === 'TODO' && (
            <Grid cols={2} gap={3}>
              <View>
                <Text className={`${LABEL_CLASS} mb-1.5`}>Öncelik</Text>
                <Select
                  value={priority}
                  onChange={(v) => setPriority(v as 'LOW' | 'MEDIUM' | 'HIGH')}
                  title="Öncelik"
                  options={[
                    { value: 'LOW', label: '🟢 Düşük Öncelik' },
                    { value: 'MEDIUM', label: '🟡 Orta Öncelik' },
                    { value: 'HIGH', label: '🔴 Yüksek Öncelik' },
                  ]}
                  textClassName="text-[15px] text-slate-900 dark:text-white"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl"
                />
              </View>
              <View>
                <Text className={`${LABEL_CLASS} mb-1.5`}>Son Tarih</Text>
                <DateInput
                  value={dueDate}
                  onChange={setDueDate}
                  mode="date"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl"
                />
              </View>
            </Grid>
          )}

          {/* Category Selector (Filtered for current list type) */}
          <View>
            <View style={tw`flex-row items-center justify-between mb-1.5`}>
              <View style={tw`flex-row items-center gap-1`}>
                <Tag {...ic('w-3.5 h-3.5 text-slate-400')} />
                <Text className={LABEL_CLASS}>
                  {list.type === 'SHOPPING' ? 'Alışveriş Kategorisi' : null}
                  {list.type === 'TODO' ? 'Görev Kategorisi' : null}
                  {list.type === 'NOTE' ? 'Not Kategorisi' : null}
                </Text>
              </View>
              <Btn onPress={() => setIsCategoryModalOpen(true)} className="flex-row items-center gap-0.5 py-1.5 pl-2">
                <Plus {...ic('w-3 h-3 text-emerald-600 dark:text-emerald-400')} />
                <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Yeni Kategori</Text>
              </Btn>
            </View>

            <View
              style={tw`max-h-48 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden`}
            >
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={tw`p-1.5`}>
                <Grid cols={2} gap={1.5}>
                  {displayedCategories.map((cat) => {
                    const selected = categoryId === cat.id;
                    return (
                      <Btn
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        className={`flex-row items-center gap-2 px-3 py-3 rounded-xl border ${
                          selected
                            ? 'border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 shadow-xs'
                            : 'border-transparent'
                        }`}
                      >
                        <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: cat.color }]} />
                        <Text
                          className={`flex-1 text-xs ${
                            selected
                              ? 'text-slate-900 dark:text-white font-bold'
                              : 'font-medium text-slate-600 dark:text-slate-300'
                          }`}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </Btn>
                    );
                  })}
                </Grid>
              </ScrollView>
            </View>
          </View>

          {/* Pin note toggle */}
          {list.type === 'NOTE' && (
            <Btn
              onPress={() => setIsPinned(!isPinned)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isPinned }}
              className="flex-row items-center gap-3 py-2"
            >
              <View
                style={tw.style(
                  'w-6 h-6 rounded-md border-2 items-center justify-center',
                  isPinned ? 'bg-purple-600 border-purple-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
                )}
              >
                {isPinned && <Check {...ic('w-4 h-4 text-white', 3)} />}
              </View>
              <Text className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">Bu notu en üste sabitle (Pin)</Text>
            </Btn>
          )}

          {/* Submit Buttons */}
          <View
            style={tw`flex-row items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800`}
          >
            <Btn
              onPress={handleClose}
              className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-[15px] font-semibold text-slate-600 dark:text-slate-300">İptal</Text>
            </Btn>
            <Btn
              onPress={handleSubmit}
              style={{ flex: 2 }}
              className="h-12 bg-emerald-600 rounded-2xl shadow-xs items-center justify-center"
            >
              <Text className="text-[15px] font-bold text-white">
                {list.type === 'SHOPPING' ? 'Sepete Ekle' : list.type === 'TODO' ? 'Görevi Kaydet' : 'Notu Kaydet'}
              </Text>
            </Btn>
          </View>
        </View>
      </Panel>

      {/* Quick Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal defaultType={list.type} onClose={() => setIsCategoryModalOpen(false)} />
      )}
    </Overlay>
  );
};
