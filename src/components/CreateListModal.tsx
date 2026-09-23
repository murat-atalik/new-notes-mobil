import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  X,
  ShoppingCart,
  CheckSquare,
  StickyNote,
  Sparkles,
  ArrowRight,
  Search,
  AlertCircle,
  Users,
  Lock,
  Check,
} from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { createListSchema, handleZodValidation, type BilingualError, type FieldErrors } from '../lib/validations';
import { useAppStore } from '../store/useAppStore';
import type { ListType } from '../types';
import { ICON_MAP } from './CategoryModal';
import { Btn, Grid, Input, Overlay, Panel, Text } from './ui';

interface CreateListModalProps {
  onClose: () => void;
  initialType?: ListType;
}

// The web modal is light-only (no dark: classes) – kept identical here.
const LIST_TYPES: { type: ListType; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    type: 'SHOPPING',
    title: 'Akıllı Alışveriş & Bütçe',
    desc: 'Birim fiyatlar, canlı sepet toplamı ve harcama grafiği takibi',
    icon: <ShoppingCart {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-300')} />,
    color: '#10b981',
  },
  {
    type: 'TODO',
    title: 'Yapılacaklar & Görevler',
    desc: 'Öncelik etiketleri, son tarihler ve görev tamamlama',
    icon: <CheckSquare {...ic('w-5 h-5 text-amber-600 dark:text-amber-300')} />,
    color: '#f59e0b',
  },
  {
    type: 'NOTE',
    title: 'Notlar & Fikirler',
    desc: 'Hızlı karalamalar, alışveriş ipuçları ve serbest metinler',
    icon: <StickyNote {...ic('w-5 h-5 text-purple-600 dark:text-purple-300')} />,
    color: '#8b5cf6',
  },
];

const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

const INPUT_TEXT = 'text-slate-900 dark:text-white';

export const CreateListModal: React.FC<CreateListModalProps> = ({ onClose, initialType }) => {
  const { createList, setSelectedListId, templates, createListFromTemplate } = useAppStore();

  const [tab, setTab] = useState<'scratch' | 'template'>('scratch');
  const [templateSearch, setTemplateSearch] = useState('');
  const [type, setType] = useState<ListType>(initialType || 'SHOPPING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const defaultColor = initialType === 'TODO' ? '#f59e0b' : initialType === 'NOTE' ? '#8b5cf6' : COLORS[0];
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [isShared, setIsShared] = useState<boolean>(true); // default: Ortak / Aile listesi

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<BilingualError | null>(null);

  const filteredTemplates = templates.filter(
    (t) =>
      !templateSearch ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(templateSearch.toLowerCase())),
  );

  const handleSubmit = () => {
    setFieldErrors({});
    setGlobalError(null);

    const iconMap = {
      SHOPPING: 'ShoppingCart',
      TODO: 'CheckSquare',
      NOTE: 'StickyNote',
    };

    // Validate with Zod
    const val = handleZodValidation(createListSchema, {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      color: selectedColor,
      icon: iconMap[type],
      isShared,
    });

    if (!val.success) {
      if (val.fieldErrors) setFieldErrors(val.fieldErrors);
      if (val.error) setGlobalError(val.error);
      return;
    }

    const newId = createList({
      title: title.trim(),
      description: description.trim(),
      type: type,
      color: selectedColor,
      icon: iconMap[type],
      isShared,
    });

    setSelectedListId(newId);
    onClose();
  };

  const handleSelectTemplate = (templateId: string) => {
    const newId = createListFromTemplate(templateId, undefined, isShared);
    if (newId) {
      onClose();
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Panel className="w-full max-w-lg self-center bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <View style={tw`p-5 relative`}>
          <Btn onPress={onClose} accessibilityLabel="Kapat" className="absolute top-4 right-4 p-1 rounded-full z-10">
            <X {...ic('w-5 h-5 text-slate-400 dark:text-slate-500')} />
          </Btn>

          <Text className="font-extrabold text-slate-900 dark:text-white text-lg mb-1">Yeni Liste Oluştur</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
            Ortak aile listesi veya kişisel özel liste oluşturun
          </Text>

          {/* Global Error */}
          {globalError && (
            <View style={tw`p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex-row items-start gap-2`}>
              <View style={tw`mt-0.5`}>
                <AlertCircle {...ic('w-4 h-4 text-rose-600 dark:text-rose-300')} />
              </View>
              <Text className="text-rose-800 dark:text-rose-300 text-xs font-semibold flex-1">
                {globalError.tr || globalError.en}
              </Text>
            </View>
          )}

          {/* Tab switcher */}
          <View style={tw`flex-row p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4`}>
            <Btn
              onPress={() => setTab('scratch')}
              className={`flex-1 py-2 rounded-xl items-center justify-center ${
                tab === 'scratch' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  tab === 'scratch' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Sıfırdan Liste
              </Text>
            </Btn>
            <Btn
              onPress={() => setTab('template')}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${
                tab === 'template' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''
              }`}
            >
              <Sparkles {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300')} />
              <Text
                className={`text-xs font-bold ${
                  tab === 'template' ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Hazır Şablonlar ({templates.length})
              </Text>
            </Btn>
          </View>

          {/* Scope Selector on Top */}
          <View style={tw`mb-4 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 gap-2`}>
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Erişim & Paylaşım Kapsamı</Text>
            <Grid cols={2} gap={2}>
              <Btn
                onPress={() => setIsShared(true)}
                className={`flex-row items-start gap-2.5 p-2.5 rounded-xl border ${
                  isShared ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <View style={tw.style('p-2 rounded-lg shrink-0', isShared ? 'bg-emerald-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800')}>
                  <Users {...ic(isShared ? 'w-4 h-4 text-white' : 'w-4 h-4 text-slate-500 dark:text-slate-400')} />
                </View>
                <View style={tw`min-w-0 flex-1`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Text className="font-bold text-slate-900 dark:text-white text-xs">Ortak / Aile</Text>
                  </View>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Ortaklar görebilir & düzenleyebilir
                  </Text>
                </View>
              </Btn>

              <Btn
                onPress={() => setIsShared(false)}
                className={`flex-row items-start gap-2.5 p-2.5 rounded-xl border ${
                  !isShared ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <View
                  style={tw.style('p-2 rounded-lg shrink-0', !isShared ? 'bg-purple-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800')}
                >
                  <Lock {...ic(!isShared ? 'w-4 h-4 text-white' : 'w-4 h-4 text-slate-500 dark:text-slate-400')} />
                </View>
                <View style={tw`min-w-0 flex-1`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Text className="font-bold text-slate-900 dark:text-white text-xs">Kişisel / Özel</Text>
                  </View>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Yalnızca siz görürsünüz
                  </Text>
                </View>
              </Btn>
            </Grid>
          </View>

          {tab === 'template' ? (
            <View style={tw`gap-3`}>
              {/* Search within templates */}
              <View style={tw`relative justify-center`}>
                <View style={tw`absolute left-3 z-10`} pointerEvents="none">
                  <Search {...ic('w-3.5 h-3.5 text-slate-400 dark:text-slate-500')} />
                </View>
                <Input
                  value={templateSearch}
                  onChangeText={setTemplateSearch}
                  placeholder="Şablonlarda ara..."
                  className={`w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl ${INPUT_TEXT}`}
                />
              </View>

              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={tw`max-h-72`}
                contentContainerStyle={tw`gap-2.5 pr-1`}
              >
                {filteredTemplates.map((tmpl) => {
                  const IconComp = ICON_MAP[tmpl.icon] || ShoppingCart;
                  return (
                    <Btn
                      key={tmpl.id}
                      onPress={() => handleSelectTemplate(tmpl.id)}
                      className="flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60"
                    >
                      <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                        <View
                          style={[
                            tw`w-10 h-10 rounded-xl items-center justify-center shrink-0 shadow-sm`,
                            { backgroundColor: tmpl.color },
                          ]}
                        >
                          <IconComp {...ic('w-5 h-5 text-white')} />
                        </View>
                        <View style={tw`min-w-0 flex-1`}>
                          <View style={tw`flex-row items-center gap-1.5`}>
                            <Text
                              className="font-bold text-slate-900 dark:text-white text-xs shrink"
                              numberOfLines={1}
                            >
                              {tmpl.title}
                            </Text>
                            {tmpl.isCustom && (
                              <View style={tw`px-1.5 rounded bg-amber-100 dark:bg-amber-950/60`}>
                                <Text className="text-[9px] font-bold text-amber-800 dark:text-amber-300">Özel</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                            {tmpl.description || `${tmpl.items.length} hazır madde`}
                          </Text>
                          <View style={tw`flex-row items-center gap-2 mt-1`}>
                            <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              {tmpl.items.length} madde
                            </Text>
                            <Text className="text-[10px] text-slate-300 dark:text-slate-600">•</Text>
                            <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {tmpl.type === 'SHOPPING' ? 'Alışveriş' : tmpl.type === 'TODO' ? 'Yapılacaklar' : 'Not'}
                            </Text>
                            <Text className="text-[10px] text-slate-300 dark:text-slate-600">•</Text>
                            <Text
                              className={`text-[10px] font-bold ${
                                isShared ? 'text-emerald-700 dark:text-emerald-300' : 'text-purple-700 dark:text-purple-300'
                              }`}
                            >
                              {isShared ? 'Ortak Liste' : 'Özel Liste'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Btn
                        onPress={() => handleSelectTemplate(tmpl.id)}
                        className="shrink-0 flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 shadow-sm"
                      >
                        <Text className="text-white text-xs font-bold">Kullan</Text>
                        <ArrowRight {...ic('w-3.5 h-3.5 text-white')} />
                      </Btn>
                    </Btn>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <View style={tw`py-6`}>
                    <Text className="text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      Arama kriterinize uygun şablon bulunamadı.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={tw`gap-4`}>
              {/* Type Selector */}
              <View style={tw`gap-2`}>
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Liste Türü</Text>
                <View style={tw`gap-1.5`}>
                  {LIST_TYPES.map((lt) => (
                    <Btn
                      key={lt.type}
                      onPress={() => {
                        setType(lt.type);
                        setSelectedColor(lt.color);
                      }}
                      className={`w-full flex-row items-start gap-3 p-3 rounded-2xl border ${
                        type === lt.type ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                      }`}
                    >
                      <View style={tw`p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm shrink-0`}>{lt.icon}</View>
                      <View style={tw`flex-1 min-w-0`}>
                        <Text className="font-bold text-slate-900 dark:text-white text-xs">{lt.title}</Text>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                          {lt.desc}
                        </Text>
                      </View>
                    </Btn>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View>
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Liste Başlığı *</Text>
                <Input
                  autoFocus
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    // web clears the field error the same way
                    if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined as any }));
                  }}
                  placeholder={
                    type === 'SHOPPING'
                      ? 'Örn: Haftalık Pazar & Market Listesi'
                      : type === 'TODO'
                        ? 'Örn: Eylül Ayı Ödemeleri ve Görevler'
                        : 'Örn: Yeni Proje Notları'
                  }
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border rounded-xl ${INPUT_TEXT} ${
                    fieldErrors.title ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.title && (
                  <View style={tw`mt-1.5 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-lg`}>
                    <Text className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                      {fieldErrors.title.tr || fieldErrors.title.en}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View>
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Açıklama / Not{' '}
                  <Text className="text-xs text-slate-400 dark:text-slate-500 font-normal">(İsteğe Bağlı)</Text>
                </Text>
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Örn: Hafta sonu alınacaklar..."
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl ${INPUT_TEXT}`}
                />
              </View>

              {/* Scope Selection (Family/Shared vs Personal) */}
              <View>
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paylaşım Kapsamı
                </Text>
                <Grid cols={2} gap={2}>
                  <Btn
                    onPress={() => setIsShared(true)}
                    className={`p-3 rounded-2xl border flex-row items-start gap-2.5 ${
                      isShared ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <View style={tw`p-1.5 bg-sky-100 dark:bg-sky-950/60 rounded-xl shrink-0 mt-0.5`}>
                      <Users {...ic('w-4 h-4 text-sky-700 dark:text-sky-300')} />
                    </View>
                    <View style={tw`flex-1 min-w-0`}>
                      <Text className="font-bold text-xs text-slate-900 dark:text-white">Ortak & Aile Listesi</Text>
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Aile bireyleriyle ortak görüntülenir ve düzenlenir.
                      </Text>
                    </View>
                  </Btn>

                  <Btn
                    onPress={() => setIsShared(false)}
                    className={`p-3 rounded-2xl border flex-row items-start gap-2.5 ${
                      !isShared ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <View style={tw`p-1.5 bg-purple-100 dark:bg-purple-950/60 rounded-xl shrink-0 mt-0.5`}>
                      <Lock {...ic('w-4 h-4 text-purple-700 dark:text-purple-300')} />
                    </View>
                    <View style={tw`flex-1 min-w-0`}>
                      <Text className="font-bold text-xs text-slate-900 dark:text-white">Kişisel Özel Liste</Text>
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Sadece sizin görebileceğiniz gizli şahsi liste.
                      </Text>
                    </View>
                  </Btn>
                </Grid>
              </View>

              {/* Color theme selector */}
              <View>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tema Rengi</Text>
                  <View
                    style={[
                      tw`w-3.5 h-3.5 rounded-full border shadow-sm`,
                      { backgroundColor: selectedColor, borderColor: selectedColor },
                    ]}
                  />
                </View>
                <View style={tw`flex-row items-center gap-2 flex-wrap py-1 px-1`}>
                  {COLORS.map((c) => {
                    const isSelected = selectedColor === c;
                    return (
                      // Wrapper draws the web's `ring-2 ring-offset-2 ring-slate-800` without taking layout space.
                      <View
                        key={c}
                        style={[
                          tw.style(
                            '-m-1 p-0.5 rounded-full border-2',
                            isSelected ? 'border-slate-800' : 'border-transparent',
                          ),
                          isSelected ? { transform: [{ scale: 1.2 }] } : null,
                        ]}
                      >
                        <Btn
                          onPress={() => setSelectedColor(c)}
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isSelected ? 'shadow-sm' : 'opacity-75'
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {isSelected && <Check {...ic('w-4 h-4 text-white')} />}
                        </Btn>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Buttons */}
              <View style={tw`flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}>
                <Btn onPress={onClose} className="px-4 py-2.5 rounded-xl">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400">İptal</Text>
                </Btn>
                <Btn onPress={handleSubmit} className="px-5 py-2.5 bg-emerald-600 rounded-xl shadow-sm">
                  <Text className="text-xs font-semibold text-white">Listeyi Oluştur</Text>
                </Btn>
              </View>
            </View>
          )}
        </View>
      </Panel>
    </Overlay>
  );
};
