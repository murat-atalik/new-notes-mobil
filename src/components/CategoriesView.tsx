import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ArrowLeft,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  ShoppingCart,
  CheckSquare,
  StickyNote,
} from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { Category, ListType } from '../types';
import { CategoryModal, ICON_MAP } from './CategoryModal';
import { ConfirmModal } from './ConfirmModal';
import { Btn, Input, Text } from './ui';

interface CategoriesViewProps {
  onBack: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onBack }) => {
  const { categories, deleteCategory, items } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | ListType>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalDefaultType, setCategoryModalDefaultType] = useState<ListType>('SHOPPING');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesType = selectedType === 'ALL' || cat.type === selectedType;
    const matchesSearch = !search || cat.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const shoppingCount = categories.filter((c) => c.type === 'SHOPPING').length;
  const todoCount = categories.filter((c) => c.type === 'TODO').length;
  const noteCount = categories.filter((c) => c.type === 'NOTE').length;

  const handleOpenAddCategory = (type: 'ALL' | ListType = 'SHOPPING') => {
    setEditingCategory(null);
    setCategoryModalDefaultType(type === 'ALL' ? 'SHOPPING' : type);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryModalDefaultType(cat.type);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (cat: Category) => {
    setCategoryToDelete(cat);
  };

  const typeFilters: {
    id: ListType;
    label: string;
    count: number;
    icon: typeof ShoppingCart;
    active: string;
    inactiveText: string;
  }[] = [
    {
      id: 'SHOPPING',
      label: 'Alışveriş',
      count: shoppingCount,
      icon: ShoppingCart,
      active: 'bg-emerald-600 border-emerald-600',
      inactiveText: 'text-emerald-800 dark:text-emerald-400',
    },
    {
      id: 'TODO',
      label: 'Yapılacaklar',
      count: todoCount,
      icon: CheckSquare,
      active: 'bg-amber-500 border-amber-500',
      inactiveText: 'text-amber-800 dark:text-amber-400',
    },
    {
      id: 'NOTE',
      label: 'Notlar',
      count: noteCount,
      icon: StickyNote,
      active: 'bg-purple-600 border-purple-600',
      inactiveText: 'text-purple-800 dark:text-purple-400',
    },
  ];

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
              <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight">Kategori Yönetimi</Text>
              <View style={tw`px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950`}>
                <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{categories.length}</Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              Alışveriş, Görev ve Not kategorilerini özelleştirin
            </Text>
          </View>
        </View>

        <Btn
          onPress={() => handleOpenAddCategory(selectedType === 'ALL' ? 'SHOPPING' : selectedType)}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded-xl shadow-sm"
        >
          <Plus {...ic('w-3.5 h-3.5 text-white')} />
          <Text className="text-white font-bold text-xs">Ekle</Text>
        </Btn>
      </View>

      <View style={tw`gap-3.5`}>
        {/* Search & Filter Tabs */}
        <View style={tw`gap-2.5`}>
          <View style={tw`relative justify-center`}>
            <View style={tw`absolute left-3.5 z-10`} pointerEvents="none">
              <Search {...ic('w-4 h-4 text-slate-400')} />
            </View>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Kategorilerde ara..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-sm"
            />
          </View>

          {/* Type Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-1.5 pb-1`}>
            <Btn
              onPress={() => setSelectedType('ALL')}
              className={`px-3.5 py-1.5 rounded-xl ${
                selectedType === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedType === 'ALL' ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tümü ({categories.length})
              </Text>
            </Btn>
            {typeFilters.map((tf) => {
              const Icon = tf.icon;
              const active = selectedType === tf.id;
              const textClass = active ? 'text-white' : tf.inactiveText;
              return (
                <Btn
                  key={tf.id}
                  onPress={() => setSelectedType(tf.id)}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    active ? tf.active : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon {...ic(`w-3.5 h-3.5 ${textClass}`)} />
                  <Text className={`text-xs font-bold ${textClass}`}>
                    {tf.label} ({tf.count})
                  </Text>
                </Btn>
              );
            })}
          </ScrollView>
        </View>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <View style={tw`gap-3`}>
            {filteredCategories.map((cat) => {
              const IconComp = ICON_MAP[cat.icon] || Tag;
              const usedItemsCount = items.filter((i) => i.categoryId === cat.id).length;

              return (
                <Btn
                  key={cat.id}
                  onPress={() => handleOpenEditCategory(cat)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-3"
                >
                  <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-xl items-center justify-center shrink-0`,
                        { backgroundColor: cat.bgLight || '#f1f5f9' },
                      ]}
                    >
                      <IconComp size={20} color={cat.color} />
                    </View>

                    <View style={tw`min-w-0 flex-1`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <Text className="font-bold text-slate-900 dark:text-white text-xs" numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2 mt-0.5`}>
                        <View style={[tw`px-2 py-0.5 rounded-md`, { backgroundColor: cat.bgLight }]}>
                          <Text className="text-[10px] font-semibold" style={{ color: cat.color }}>
                            {cat.type === 'SHOPPING' ? 'Alışveriş' : ''}
                            {cat.type === 'TODO' ? 'Yapılacaklar' : ''}
                            {cat.type === 'NOTE' ? 'Not & Fikir' : ''}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                          {usedItemsCount} ürün/görev
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={tw`flex-row items-center gap-1 shrink-0`}>
                    <Btn
                      onPress={() => handleOpenEditCategory(cat)}
                      accessibilityLabel="Düzenle"
                      className="p-1.5 rounded-lg"
                    >
                      <Edit2 {...ic('w-3.5 h-3.5 text-slate-400')} />
                    </Btn>
                    <Btn onPress={() => handleDeleteCategory(cat)} accessibilityLabel="Sil" className="p-1.5 rounded-lg">
                      <Trash2 {...ic('w-3.5 h-3.5 text-slate-400')} />
                    </Btn>
                  </View>
                </Btn>
              );
            })}
          </View>
        ) : (
          <View
            style={tw`items-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-6 gap-3`}
          >
            <View
              style={tw`w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 self-center items-center justify-center`}
            >
              <Tag {...ic('w-6 h-6 text-purple-600 dark:text-purple-400')} />
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-800 dark:text-white text-center">Kategori Bulunamadı</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                Arama kriterinize uygun kategori yok veya henüz eklenmedi.
              </Text>
            </View>
            <Btn
              onPress={() => handleOpenAddCategory(selectedType === 'ALL' ? 'SHOPPING' : selectedType)}
              className="flex-row items-center self-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 shadow-sm"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-xs font-bold">Yeni Kategori Oluştur</Text>
            </Btn>
          </View>
        )}
      </View>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          initialCategory={editingCategory}
          defaultType={categoryModalDefaultType}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Category Confirm Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Kategoriyi Sil"
        message={
          categoryToDelete ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">"{categoryToDelete.name}"</Text>{' '}
              kategorisini silmek istediğinize emin misiniz? Bu kategorideki öğeler kategorisiz kalacaktır.
            </Text>
          ) : (
            ''
          )
        }
        confirmText="Kategoriyi Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (categoryToDelete) {
            deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }
        }}
        onClose={() => setCategoryToDelete(null)}
      />
    </View>
  );
};
