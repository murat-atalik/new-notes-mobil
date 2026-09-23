import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Edit2,
  Layers,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { ListTemplate, ListType } from '../types';
import { ICON_MAP } from './CategoryModal';
import { ConfirmModal } from './ConfirmModal';
import { TemplateModal } from './TemplateModal';
import { Btn, Input, Text } from './ui';

interface TemplatesViewProps {
  onBack: () => void;
}

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onBack }) => {
  const { templates, deleteTemplate, createListFromTemplate } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | ListType>('ALL');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ListTemplate | null>(null);
  const [templateModalDefaultType, setTemplateModalDefaultType] = useState<ListType>('SHOPPING');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ListTemplate | null>(null);

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesType = selectedType === 'ALL' || tmpl.type === selectedType;
    const matchesSearch =
      !search ||
      tmpl.title.toLowerCase().includes(search.toLowerCase()) ||
      (tmpl.description && tmpl.description.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const shoppingCount = templates.filter((t) => t.type === 'SHOPPING').length;
  const todoCount = templates.filter((t) => t.type === 'TODO').length;
  const noteCount = templates.filter((t) => t.type === 'NOTE').length;

  const handleOpenAddTemplate = (type: 'ALL' | ListType = 'SHOPPING') => {
    setEditingTemplate(null);
    setTemplateModalDefaultType(type === 'ALL' ? 'SHOPPING' : type);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tmpl: ListTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateModalDefaultType(tmpl.type);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteTemplate = (tmpl: ListTemplate) => {
    setTemplateToDelete(tmpl);
  };

  const handleUseTemplate = (tmpl: ListTemplate) => {
    const newListId = createListFromTemplate(tmpl.id);
    if (newListId) {
      setSuccessToast(`"${tmpl.title}" şablonu ile yeni liste oluşturuldu!`);
    }
  };

  const typeChip = (
    value: ListType,
    label: string,
    Icon: IconType,
    activeClass: string,
    inactiveClass: string,
    activeText: string,
    inactiveText: string,
  ) => {
    const active = selectedType === value;
    return (
      <Btn
        onPress={() => setSelectedType(value)}
        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${active ? activeClass : inactiveClass}`}
      >
        <Icon {...ic(`w-3.5 h-3.5 ${active ? activeText : inactiveText}`)} />
        <Text className={`text-xs font-bold ${active ? activeText : inactiveText}`}>{label}</Text>
      </Btn>
    );
  };

  return (
    <View style={tw`gap-3.5`}>
      {/* Top Header Card */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-2.5`}
      >
        <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
          <Btn onPress={onBack} className="p-1.5 -ml-1 rounded-xl flex-row items-center gap-1">
            <ArrowLeft {...ic('w-4 h-4 text-slate-600 dark:text-slate-400')} />
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Ayarlar</Text>
          </Btn>
          <View style={tw`h-4 w-px bg-slate-200 dark:bg-slate-700`} />
          <View style={tw`flex-1 min-w-0`}>
            <View style={tw`flex-row items-center gap-2`}>
              <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight shrink">
                Hazır Liste Şablonları
              </Text>
              <View style={tw`px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950`}>
                <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">{templates.length}</Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              Sık kullanılan listeleri tek dokunuşla başlatın veya yeni şablon oluşturun
            </Text>
          </View>
        </View>

        <Btn
          onPress={() => handleOpenAddTemplate(selectedType === 'ALL' ? 'SHOPPING' : selectedType)}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded-xl shadow-sm shrink-0"
        >
          <Plus {...ic('w-3.5 h-3.5 text-white')} />
          <Text className="text-white font-bold text-xs">Ekle</Text>
        </Btn>
      </View>

      {/* Success Notification */}
      {successToast ? (
        <View
          style={tw`p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex-row items-center justify-between shadow-sm`}
        >
          <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
            <CheckCircle2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            <Text className="text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex-1">{successToast}</Text>
          </View>
          <Btn onPress={() => setSuccessToast(null)} className="p-1">
            <X {...ic('w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400')} />
          </Btn>
        </View>
      ) : null}

      <View style={tw`gap-3.5`}>
        {/* Search & Filter Tabs */}
        <View style={tw`gap-2.5`}>
          <View style={tw`relative`}>
            <View pointerEvents="none" style={tw`absolute left-3.5 top-0 bottom-0 justify-center z-10`}>
              <Search {...ic('w-4 h-4 text-slate-400')} />
            </View>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Şablon başlığı veya maddelerde ara..."
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-sm"
            />
            {search ? (
              <View style={tw`absolute right-2.5 top-0 bottom-0 justify-center`}>
                <Btn onPress={() => setSearch('')} className="p-1">
                  <X {...ic('w-3.5 h-3.5 text-slate-400')} />
                </Btn>
              </View>
            ) : null}
          </View>

          {/* Type Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`pb-1`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Btn
                onPress={() => setSelectedType('ALL')}
                className={`px-3.5 py-1.5 rounded-xl ${
                  selectedType === 'ALL'
                    ? 'bg-slate-900 dark:bg-slate-100 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedType === 'ALL' ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tümü ({templates.length})
                </Text>
              </Btn>
              {typeChip(
                'SHOPPING',
                `Alışveriş (${shoppingCount})`,
                ShoppingCart,
                'bg-emerald-600 border-emerald-600 shadow-sm',
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                'text-white',
                'text-emerald-800 dark:text-emerald-400',
              )}
              {typeChip(
                'TODO',
                `Yapılacaklar (${todoCount})`,
                CheckSquare,
                'bg-amber-500 border-amber-500 shadow-sm',
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                'text-white',
                'text-amber-800 dark:text-amber-400',
              )}
              {typeChip(
                'NOTE',
                `Notlar (${noteCount})`,
                StickyNote,
                'bg-purple-600 border-purple-600 shadow-sm',
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                'text-white',
                'text-purple-800 dark:text-purple-400',
              )}
            </View>
          </ScrollView>
        </View>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <View style={tw`gap-4`}>
            {filteredTemplates.map((tmpl) => {
              const IconComp = ((ICON_MAP as Record<string, unknown>)[tmpl.icon] as IconType | undefined) || ShoppingCart;
              return (
                <View
                  key={tmpl.id}
                  style={tw`bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm justify-between`}
                >
                  <View>
                    {/* Header Top Bar */}
                    <View style={tw`flex-row items-start justify-between gap-3 mb-3`}>
                      <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                        <View
                          style={[
                            tw`w-11 h-11 rounded-2xl items-center justify-center shrink-0 shadow-sm`,
                            { backgroundColor: tmpl.color },
                          ]}
                        >
                          <IconComp {...ic('w-5 h-5 text-white')} />
                        </View>
                        <View style={tw`min-w-0 flex-1`}>
                          <Text
                            className="font-bold text-slate-900 dark:text-white text-sm leading-snug"
                            numberOfLines={1}
                          >
                            {tmpl.title}
                          </Text>
                          <View style={tw`flex-row items-center gap-1.5 mt-1 flex-wrap`}>
                            <View
                              style={[
                                tw`px-2 py-0.5 rounded-md`,
                                {
                                  backgroundColor:
                                    tmpl.type === 'SHOPPING'
                                      ? '#ecfdf5'
                                      : tmpl.type === 'TODO'
                                      ? '#fffbeb'
                                      : '#f5f3ff',
                                },
                              ]}
                            >
                              <Text
                                className="text-[10px] font-semibold"
                                style={{
                                  color:
                                    tmpl.type === 'SHOPPING'
                                      ? '#065f46'
                                      : tmpl.type === 'TODO'
                                      ? '#92400e'
                                      : '#5b21b6',
                                }}
                              >
                                {tmpl.type === 'SHOPPING'
                                  ? 'Alışveriş'
                                  : tmpl.type === 'TODO'
                                  ? 'Yapılacaklar'
                                  : tmpl.type === 'NOTE'
                                  ? 'Not & Fikir'
                                  : ''}
                              </Text>
                            </View>
                            <View
                              style={tw`flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md`}
                            >
                              <Layers {...ic('w-3 h-3 text-slate-400')} />
                              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {tmpl.items.length} Madde
                              </Text>
                            </View>
                            {tmpl.isCustom ? (
                              <View
                                style={tw`px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800`}
                              >
                                <Text className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                  Özel Şablon
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {/* Edit & Delete Action Buttons */}
                      <View style={tw`flex-row items-center gap-0.5 shrink-0`}>
                        <Btn
                          onPress={() => handleOpenEditTemplate(tmpl)}
                          className="p-1.5 rounded-lg"
                          accessibilityLabel="Şablonu Düzenle"
                        >
                          <Edit2 {...ic('w-3.5 h-3.5 text-slate-400')} />
                        </Btn>
                        <Btn
                          onPress={() => handleDeleteTemplate(tmpl)}
                          className="p-1.5 rounded-lg"
                          accessibilityLabel="Şablonu Sil"
                        >
                          <Trash2 {...ic('w-3.5 h-3.5 text-slate-400')} />
                        </Btn>
                      </View>
                    </View>

                    {/* Description */}
                    {tmpl.description ? (
                      <Text
                        className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed"
                        numberOfLines={2}
                      >
                        {tmpl.description}
                      </Text>
                    ) : null}

                    {/* Items preview box */}
                    <View
                      style={tw`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-4 gap-1.5`}
                    >
                      <View style={tw`flex-row items-center justify-between`}>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          İçerik Önizleme
                        </Text>
                        <Text className="text-[10px] text-slate-400 font-medium">
                          Toplam {tmpl.items.length} madde
                        </Text>
                      </View>
                      <View style={tw`gap-1.5 pt-0.5`}>
                        {tmpl.items.slice(0, 4).map((item, idx) => (
                          <View key={item.id || idx} style={tw`flex-row items-center justify-between gap-2`}>
                            <View style={tw`flex-row items-center gap-1.5 min-w-0 flex-1`}>
                              <View style={tw`w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0`} />
                              <Text
                                className="text-xs text-slate-700 dark:text-slate-200 font-medium flex-1"
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                            </View>
                            {item.quantity ? (
                              <View
                                style={tw`shrink-0 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700`}
                              >
                                <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                  {item.quantity} {item.unit}
                                </Text>
                              </View>
                            ) : null}
                            {item.priority ? (
                              <View
                                style={tw.style(
                                  'px-1.5 py-0.5 rounded shrink-0',
                                  item.priority === 'HIGH'
                                    ? 'bg-rose-50 dark:bg-rose-950/70'
                                    : item.priority === 'MEDIUM'
                                    ? 'bg-amber-50 dark:bg-amber-950/70'
                                    : 'bg-slate-100 dark:bg-slate-800',
                                )}
                              >
                                <Text
                                  className={`text-[10px] font-bold ${
                                    item.priority === 'HIGH'
                                      ? 'text-rose-700 dark:text-rose-300'
                                      : item.priority === 'MEDIUM'
                                      ? 'text-amber-700 dark:text-amber-300'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {item.priority === 'HIGH' ? 'Yüksek' : item.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
                        {tmpl.items.length > 4 ? (
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                            +{tmpl.items.length - 4} diğer madde daha...
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* 1-Click Launch Button */}
                  <Btn
                    onPress={() => handleUseTemplate(tmpl)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 shadow-sm flex-row items-center justify-center gap-2"
                  >
                    <Zap {...ic('w-4 h-4 text-amber-400')} />
                    <Text className="text-white text-xs font-bold">Bu Şablonla Liste Oluştur</Text>
                    <View style={tw`opacity-70`}>
                      <ArrowRight {...ic('w-3.5 h-3.5 text-white')} />
                    </View>
                  </Btn>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={tw`items-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-6 gap-3`}
          >
            <View
              style={tw`w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 self-center items-center justify-center`}
            >
              <Sparkles {...ic('w-6 h-6 text-emerald-600 dark:text-emerald-400')} />
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-800 dark:text-white text-center">Şablon Bulunamadı</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                Arama kriterinize uygun şablon bulunamadı. Hemen yeni bir şablon oluşturabilirsiniz.
              </Text>
            </View>
            <Btn
              onPress={() => handleOpenAddTemplate(selectedType === 'ALL' ? 'SHOPPING' : selectedType)}
              className="flex-row items-center self-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 shadow-sm"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-xs font-bold">Yeni Şablon Oluştur</Text>
            </Btn>
          </View>
        )}
      </View>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <TemplateModal
          initialTemplate={editingTemplate}
          defaultType={templateModalDefaultType}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Delete Template Confirm Modal */}
      <ConfirmModal
        isOpen={!!templateToDelete}
        title="Şablonu Sil"
        message={
          templateToDelete ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">"{templateToDelete.title}"</Text>{' '}
              hazır şablonunu silmek istediğinize emin misiniz?
            </Text>
          ) : (
            ''
          )
        }
        confirmText="Şablonu Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (templateToDelete) {
            deleteTemplate(templateToDelete.id);
            setTemplateToDelete(null);
          }
        }}
        onClose={() => setTemplateToDelete(null)}
      />
    </View>
  );
};
