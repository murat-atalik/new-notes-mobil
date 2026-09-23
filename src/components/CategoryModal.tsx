import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  X,
  Plus,
  Trash2,
  Check,
  Tag,
  ShoppingCart,
  Apple,
  Beef,
  Sparkles,
  Heart,
  Laptop,
  Shirt,
  Package,
  Briefcase,
  Activity,
  Home,
  CreditCard,
  GraduationCap,
  Plane,
  CheckCircle2,
  Lightbulb,
  Users,
  BookOpen,
  Utensils,
  Key,
  StickyNote,
  Dumbbell,
  Coffee,
  Car,
  Scissors,
  Music,
  Film,
  Baby,
  Shield,
  Smile,
  Gift,
  Wrench,
  Camera,
  Layers,
  type LucideIcon,
} from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { Category, ListType } from '../types';
import { Btn, Grid, Input, Overlay, Panel, Text } from './ui';

export const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Apple,
  Beef,
  Sparkles,
  Heart,
  Laptop,
  Shirt,
  Package,
  Briefcase,
  Activity,
  Home,
  CreditCard,
  GraduationCap,
  Plane,
  CheckCircle2,
  Lightbulb,
  Users,
  BookOpen,
  Utensils,
  Key,
  StickyNote,
  Dumbbell,
  Coffee,
  Car,
  Scissors,
  Music,
  Film,
  Baby,
  Shield,
  Smile,
  Gift,
  Wrench,
  Camera,
  Layers,
};

const COLOR_PRESETS = [
  { color: '#10b981', bgLight: '#ecfdf5', label: 'Zümrüt' },
  { color: '#84cc16', bgLight: '#f7fee7', label: 'Yeşil' },
  { color: '#06b6d4', bgLight: '#ecfeff', label: 'Turkuaz' },
  { color: '#3b82f6', bgLight: '#eff6ff', label: 'Mavi' },
  { color: '#6366f1', bgLight: '#eef2ff', label: 'İndigo' },
  { color: '#8b5cf6', bgLight: '#f5f3ff', label: 'Mor' },
  { color: '#ec4899', bgLight: '#fdf2f8', label: 'Pembe' },
  { color: '#ef4444', bgLight: '#fef2f2', label: 'Kırmızı' },
  { color: '#f97316', bgLight: '#fff7ed', label: 'Turuncu' },
  { color: '#f59e0b', bgLight: '#fffbeb', label: 'Amber' },
  { color: '#64748b', bgLight: '#f8fafc', label: 'Gri' },
  { color: '#0f172a', bgLight: '#f1f5f9', label: 'Koyu' },
];

interface CategoryModalProps {
  initialCategory?: Category | null;
  defaultType?: ListType;
  onClose: () => void;
}

const TYPE_INACTIVE =
  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
const TYPE_INACTIVE_TEXT = 'text-slate-600 dark:text-slate-300';

export const CategoryModal: React.FC<CategoryModalProps> = ({
  initialCategory,
  defaultType = 'SHOPPING',
  onClose,
}) => {
  const { addCategory, updateCategory, deleteCategory } = useAppStore();

  const isEditing = !!initialCategory;

  const [name, setName] = useState(initialCategory?.name || '');
  const [type, setType] = useState<ListType>(initialCategory?.type || defaultType);
  const [selectedColor, setSelectedColor] = useState(initialCategory?.color || COLOR_PRESETS[0].color);
  const [selectedBgLight, setSelectedBgLight] = useState(initialCategory?.bgLight || COLOR_PRESETS[0].bgLight);
  const [selectedIcon, setSelectedIcon] = useState(
    initialCategory?.icon || (type === 'SHOPPING' ? 'ShoppingCart' : type === 'TODO' ? 'CheckCircle2' : 'StickyNote'),
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setSelectedColor(initialCategory.color);
      setSelectedBgLight(initialCategory.bgLight);
      setSelectedIcon(initialCategory.icon);
    }
  }, [initialCategory]);

  const handleColorSelect = (preset: (typeof COLOR_PRESETS)[0]) => {
    setSelectedColor(preset.color);
    setSelectedBgLight(preset.bgLight);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (isEditing && initialCategory) {
      updateCategory(initialCategory.id, {
        name: name.trim(),
        type,
        color: selectedColor,
        bgLight: selectedBgLight,
        icon: selectedIcon,
      });
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        type,
        color: selectedColor,
        bgLight: selectedBgLight,
        icon: selectedIcon,
      };
      addCategory(newCat);
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialCategory) {
      deleteCategory(initialCategory.id);
      onClose();
    }
  };

  const PreviewIconComponent = ICON_MAP[selectedIcon] || Tag;

  const typeButtons: { id: ListType; label: string; active: string; activeText: string }[] = [
    {
      id: 'SHOPPING',
      label: '🛒 Alışveriş',
      active: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
      activeText: 'text-emerald-900 dark:text-emerald-300',
    },
    {
      id: 'TODO',
      label: '📋 Görev',
      active: 'border-amber-600 bg-amber-50 dark:bg-amber-950/50',
      activeText: 'text-amber-900 dark:text-amber-300',
    },
    {
      id: 'NOTE',
      label: '📝 Not & Fikir',
      active: 'border-purple-600 bg-purple-50 dark:bg-purple-950/50',
      activeText: 'text-purple-900 dark:text-purple-300',
    },
  ];

  return (
    <Overlay onClose={onClose} overlayClassName="bg-black/50">
      <Panel className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full self-center shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <View style={tw`p-6`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-5`}>
            <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
              <View
                style={[tw`w-9 h-9 rounded-2xl items-center justify-center`, { backgroundColor: selectedBgLight }]}
              >
                <PreviewIconComponent size={20} color={selectedColor} />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {isEditing ? 'Kategori bilgilerini güncelleyin' : 'Listeleriniz için yeni kategori oluşturun'}
                </Text>
              </View>
            </View>

            <Btn onPress={onClose} accessibilityLabel="Kapat" className="p-1.5 rounded-full">
              <X {...ic('w-5 h-5 text-slate-400')} />
            </Btn>
          </View>

          {/* Live Preview Pill */}
          <View
            style={tw`mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between`}
          >
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Önizleme:</Text>
            <View
              style={[
                tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm`,
                { backgroundColor: selectedBgLight },
              ]}
            >
              <PreviewIconComponent size={14} color={selectedColor} />
              <Text className="text-xs font-bold" style={{ color: selectedColor }}>
                {name.trim() || 'Kategori Adı'}
              </Text>
            </View>
          </View>

          <View style={tw`gap-4`}>
            {/* Category Type */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kategori Türü *</Text>
              <Grid cols={3} gap={2}>
                {typeButtons.map((tb) => (
                  <Btn
                    key={tb.id}
                    onPress={() => setType(tb.id)}
                    className={`py-2 px-2.5 rounded-xl items-center justify-center border ${
                      type === tb.id ? tb.active : TYPE_INACTIVE
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold text-center ${type === tb.id ? tb.activeText : TYPE_INACTIVE_TEXT}`}
                    >
                      {tb.label}
                    </Text>
                  </Btn>
                ))}
              </Grid>
            </View>

            {/* Name Input */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori Adı *</Text>
              <Input
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="Örn: Kırtasiye, İlaç & Eczane, Kitaplar..."
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
              />
            </View>

            {/* Color Palette */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Renk Seçimi</Text>
              <Grid cols={6} gap={2}>
                {COLOR_PRESETS.map((preset) => (
                  <Btn
                    key={preset.color}
                    onPress={() => handleColorSelect(preset)}
                    accessibilityLabel={preset.label}
                    className={`h-9 rounded-xl items-center justify-center border ${
                      selectedColor === preset.color ? 'border-slate-900 dark:border-white' : 'border-transparent'
                    }`}
                    style={[
                      { backgroundColor: preset.color },
                      selectedColor === preset.color ? { transform: [{ scale: 1.05 }] } : null,
                    ]}
                  >
                    {selectedColor === preset.color && <Check {...ic('w-4 h-4 text-white')} />}
                  </Btn>
                ))}
              </Grid>
            </View>

            {/* Icon Selector */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">İkon Seçimi</Text>
              <ScrollView
                nestedScrollEnabled
                style={tw`max-h-36 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700`}
                contentContainerStyle={tw`p-2`}
              >
              <Grid cols={6} gap={1.5}>
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const IconComp = ICON_MAP[iconKey];
                  const isSelected = selectedIcon === iconKey;
                  return (
                    <Btn
                      key={iconKey}
                      onPress={() => setSelectedIcon(iconKey)}
                      accessibilityLabel={iconKey}
                      className={`p-2 rounded-xl items-center justify-center ${
                        isSelected ? 'bg-slate-900 dark:bg-white shadow-sm' : ''
                      }`}
                    >
                      <IconComp
                        {...ic(
                          isSelected
                            ? 'w-4 h-4 text-white dark:text-slate-900'
                            : 'w-4 h-4 text-slate-600 dark:text-slate-400',
                        )}
                      />
                    </Btn>
                  );
                })}
              </Grid>
              </ScrollView>
            </View>

            {/* Delete Confirmation Box */}
            {showDeleteConfirm && isEditing && (
              <View
                style={tw`p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl`}
              >
                <Text className="text-xs font-bold text-rose-900 dark:text-rose-300 mb-2">
                  Bu kategoriyi silmek istediğinizden emin misiniz?
                </Text>
                <View style={tw`flex-row items-center justify-end gap-2`}>
                  <Btn onPress={() => setShowDeleteConfirm(false)} className="px-2.5 py-1 rounded-lg">
                    <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400">Vazgeç</Text>
                  </Btn>
                  <Btn onPress={handleDelete} className="px-3 py-1 bg-rose-600 rounded-lg">
                    <Text className="text-xs font-bold text-white">Evet, Sil</Text>
                  </Btn>
                </View>
              </View>
            )}

            {/* Footer Actions */}
            <View
              style={tw`flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800`}
            >
              {isEditing ? (
                <Btn
                  onPress={() => setShowDeleteConfirm(true)}
                  className="flex-row items-center gap-1 px-3 py-2 rounded-xl"
                >
                  <Trash2 {...ic('w-3.5 h-3.5 text-rose-600 dark:text-rose-400')} />
                  <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">Kategoriyi Sil</Text>
                </Btn>
              ) : (
                <View />
              )}

              <View style={tw`flex-row items-center gap-2`}>
                <Btn onPress={onClose} className="px-4 py-2 rounded-xl">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">İptal</Text>
                </Btn>
                <Btn
                  onPress={handleSubmit}
                  disabled={!name.trim()}
                  className="flex-row items-center gap-1.5 px-5 py-2 bg-emerald-600 rounded-xl shadow-sm"
                >
                  {isEditing ? (
                    <>
                      <Check {...ic('w-3.5 h-3.5 text-white')} />
                      <Text className="text-xs font-bold text-white">Kaydet</Text>
                    </>
                  ) : (
                    <>
                      <Plus {...ic('w-3.5 h-3.5 text-white')} />
                      <Text className="text-xs font-bold text-white">Kategori Oluştur</Text>
                    </>
                  )}
                </Btn>
              </View>
            </View>
          </View>
        </View>
      </Panel>
    </Overlay>
  );
};
