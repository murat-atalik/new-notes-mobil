import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShoppingBag,
  Trash2,
} from 'lucide-react-native';

import { useTheme } from '../hooks/useTheme';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { AppList, ListItem } from '../types';
import { AddItemDrawer } from './AddItemDrawer';
import { CheckoutSummaryModal } from './CheckoutSummaryModal';
import { ConfirmModal } from './ConfirmModal';
import { EditListModal } from './EditListModal';
import { Btn, Gradient, Input, Text } from './ui';

interface ShoppingListViewProps {
  list: AppList;
  onBack: () => void;
  onOpenInvite: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ list, onBack, onOpenInvite }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const {
    items,
    categories,
    users,
    toggleItemComplete,
    deleteItem,
    updateItem,
    checkoutShoppingList,
    uncheckAllItems,
    syncWithServer,
  } = useAppStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNCOMPLETED' | 'COMPLETED'>('ALL');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<{ totalAmount: number; itemCount: number } | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const listItems = items.filter((i) => i.listId === list.id);

  // Filtered items
  const filteredItems = listItems.filter((i) => {
    const matchesCategory = !selectedFilterCategory || i.categoryId === selectedFilterCategory;
    const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const uncompletedItems = filteredItems.filter((i) => !i.isCompleted);
  const completedItems = filteredItems.filter((i) => i.isCompleted);

  // Calculations
  const totalEstimated = listItems.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
  const totalInCart = listItems
    .filter((i) => i.isCompleted)
    .reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
  const totalRemaining = totalEstimated - totalInCart;
  const progress =
    listItems.length > 0 ? Math.round((listItems.filter((i) => i.isCompleted).length / listItems.length) * 100) : 0;

  // Web PullToRefresh equivalent
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckout = () => {
    if (completedItems.length === 0 && listItems.filter((i) => i.isCompleted).length === 0) {
      Alert.alert('Lütfen önce sepetinize aldığınız en az bir ürünü işaretleyin.');
      return;
    }
    const result = checkoutShoppingList(list.id);
    setCheckoutResult(result);
  };

  const handleStartEditPrice = (item: ListItem) => {
    setEditingPriceId(item.id);
    setTempPrice(item.price.toString());
  };

  const handleSavePrice = (id: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      updateItem(id, { price: parsed });
    }
    setEditingPriceId(null);
  };

  const handleQuantityChange = (item: ListItem, delta: number) => {
    const newQty = Math.max(0.5, (item.quantity || 1) + delta);
    updateItem(item.id, { quantity: newQty });
  };

  const shoppingCategories = categories.filter((c) => c.type === 'SHOPPING');

  return (
    <View style={tw`flex-1 bg-slate-50/70 dark:bg-slate-950`}>
      {/* Top Header */}
      <View
        style={[
          tw`z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-3 pb-3`,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={tw`w-full max-w-3xl self-center flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center gap-2.5`}>
            <Btn onPress={onBack} className="p-1.5 rounded-xl" accessibilityLabel="Listelere Dön">
              <ArrowLeft {...ic('w-5 h-5 text-slate-600 dark:text-slate-300')} />
            </Btn>
            <View>
              <View style={tw`flex-row items-center gap-2`}>
                <View
                  style={[tw`w-2.5 h-2.5 rounded-full shadow-2xs`, { backgroundColor: list.color || '#10b981' }]}
                />
                <Text
                  className="font-bold text-slate-900 dark:text-white text-base leading-tight max-w-[170px]"
                  numberOfLines={1}
                >
                  {list.title}
                </Text>
              </View>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                {list.members.length} Üye • Akıllı Alışveriş & Bütçe
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-center gap-1.5`}>
            <Btn
              onPress={() => setShowEditModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              accessibilityLabel="Listeyi ve Rengi Düzenle"
            >
              <Pencil {...ic('w-3.5 h-3.5 text-slate-600 dark:text-slate-300')} />
            </Btn>

            <Btn
              onPress={onOpenInvite}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
              accessibilityLabel="Kişi Davet Et"
            >
              <Share2 {...ic('w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400')} />
              <Text className="hidden sm:inline text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Paylaş
              </Text>
            </Btn>
          </View>
        </View>
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`w-full max-w-3xl self-center px-3 pt-6 pb-6`}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" colors={['#10b981']} />}
      >
        {/* Dynamic Live Calculation Card */}
        <Gradient
          dir="br"
          colors={isDark ? ['slate-900', 'slate-900', 'emerald-950'] : ['slate-900', 'slate-800', 'emerald-950']}
          className="rounded-3xl p-4 shadow-lg mb-4 border border-slate-800/80"
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`p-1.5 bg-emerald-500/20 rounded-lg`}>
                <ShoppingBag {...ic('w-4 h-4 text-emerald-400')} />
              </View>
              <Text className="text-xs font-semibold text-emerald-300">Canlı Sepet & Bütçe Hesabı</Text>
            </View>
            <View style={tw`px-2 py-0.5 rounded-full bg-white/10`}>
              <Text className="text-xs font-bold text-slate-200">
                %{progress} ({listItems.filter((i) => i.isCompleted).length}/{listItems.length})
              </Text>
            </View>
          </View>

          {/* 3 Metric Column */}
          <View style={tw`flex-row gap-1.5 py-2 bg-white/5 rounded-2xl border border-white/10`}>
            <View style={tw`flex-1 px-1 items-center`}>
              <Text className="text-[10px] uppercase font-semibold text-slate-400 text-center">Tahmini</Text>
              <Text className="text-xs font-bold text-white mt-0.5 text-center" numberOfLines={1}>
                {totalEstimated.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} ₺
              </Text>
            </View>

            <View style={tw`flex-1 px-1 border-l border-r border-white/10 items-center`}>
              <Text className="text-[10px] uppercase font-semibold text-emerald-400 text-center">Sepetteki</Text>
              <Text className="text-xs font-black text-emerald-400 mt-0.5 text-center" numberOfLines={1}>
                {totalInCart.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} ₺
              </Text>
            </View>

            <View style={tw`flex-1 px-1 items-center`}>
              <Text className="text-[10px] uppercase font-semibold text-amber-300 text-center">Kalan</Text>
              <Text className="text-xs font-bold text-amber-200 mt-0.5 text-center" numberOfLines={1}>
                {totalRemaining.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} ₺
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={tw`mt-3.5`}>
            <View style={tw`w-full bg-white/10 h-2 rounded-full overflow-hidden`}>
              <Gradient
                dir="r"
                colors={['emerald-400', 'teal-300']}
                className="h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        </Gradient>

        {/* Search, Status Tabs & Category Filter Chips */}
        <View style={tw`gap-2.5 mb-4`}>
          <View style={tw`relative justify-center`}>
            <View style={tw`absolute left-3.5 z-10`} pointerEvents="none">
              <Search {...ic('w-4 h-4 text-slate-400')} />
            </View>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Listede ürün ara..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl"
            />
          </View>

          {/* Status Tabs: Tümü, Alınacaklar, Alınanlar */}
          <View style={tw`flex-row items-center gap-1.5 pb-0.5`}>
            <Btn
              onPress={() => setStatusFilter('ALL')}
              className={`flex-1 items-center justify-center py-1.5 px-2.5 rounded-xl ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  statusFilter === 'ALL' ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
                numberOfLines={1}
              >
                Tümü ({listItems.length})
              </Text>
            </Btn>
            <Btn
              onPress={() => setStatusFilter('UNCOMPLETED')}
              className={`flex-1 items-center justify-center py-1.5 px-2.5 rounded-xl ${
                statusFilter === 'UNCOMPLETED'
                  ? 'bg-amber-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  statusFilter === 'UNCOMPLETED' ? 'text-white' : 'text-amber-700 dark:text-amber-400'
                }`}
                numberOfLines={1}
              >
                Alınacaklar ({listItems.filter((i) => !i.isCompleted).length})
              </Text>
            </Btn>
            <Btn
              onPress={() => setStatusFilter('COMPLETED')}
              className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <CheckCircle2
                {...ic(statusFilter === 'COMPLETED' ? 'w-3.5 h-3.5 text-white' : 'w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400')}
              />
              <Text
                className={`text-xs font-bold text-center ${
                  statusFilter === 'COMPLETED' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                }`}
                numberOfLines={1}
              >
                Alınanlar ({listItems.filter((i) => i.isCompleted).length})
              </Text>
            </Btn>
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`flex-row items-center gap-1.5 pb-1`}
          >
            <Btn
              onPress={() => setSelectedFilterCategory(null)}
              className={`px-3 py-1 rounded-full ${
                selectedFilterCategory === null
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedFilterCategory === null
                    ? 'text-emerald-900 dark:text-emerald-300 font-bold'
                    : 'font-semibold text-slate-600 dark:text-slate-400'
                }`}
              >
                Tüm Kategoriler
              </Text>
            </Btn>
            {shoppingCategories.map((cat) => {
              const count = listItems.filter((i) => i.categoryId === cat.id).length;
              if (count === 0) return null;
              const isSelected = selectedFilterCategory === cat.id;
              return (
                <Btn
                  key={cat.id}
                  onPress={() => setSelectedFilterCategory(isSelected ? null : cat.id)}
                  className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: cat.color }]} />
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat.name} ({count})
                  </Text>
                </Btn>
              );
            })}
          </ScrollView>
        </View>

        {/* Empty State when list has zero items at all */}
        {listItems.length === 0 && (
          <View
            style={tw`items-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-6`}
          >
            <View
              style={tw`w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center self-center mb-3`}
            >
              <ShoppingBag {...ic('w-6 h-6 text-emerald-600 dark:text-emerald-400')} />
            </View>
            <Text className="font-bold text-slate-800 dark:text-slate-200 text-sm text-center">Bu liste henüz boş</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center">
              Alışveriş sepetinize ürün ekleyin, birim fiyatları belirleyin ve anlık bütçenizi kontrol edin.
            </Text>
            <Btn
              onPress={() => setIsAddOpen(true)}
              className="mt-4 flex-row items-center self-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 shadow-xs"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-xs font-semibold">İlk Ürünü Ekle</Text>
            </Btn>
          </View>
        )}

        {/* All Items Completed Celebratory Banner */}
        {listItems.length > 0 && uncompletedItems.length === 0 && (
          <Gradient
            dir="r"
            colors={isDark ? ['emerald-700', 'teal-800'] : ['emerald-500', 'teal-600']}
            className="mb-5 p-4 rounded-3xl shadow-md flex-row items-center justify-between gap-3"
          >
            <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
              <View style={tw`p-2.5 bg-white/20 rounded-2xl`}>
                <CheckCheck {...ic('w-6 h-6 text-white')} />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text className="font-extrabold text-sm leading-tight text-white">Tüm Ürünler Alındı! 🎉</Text>
                <Text className="text-xs text-emerald-100 mt-0.5">
                  Toplam {totalInCart.toLocaleString('tr-TR')} ₺ sepet tamamlandı.
                </Text>
              </View>
            </View>
            <Btn
              onPress={() => uncheckAllItems(list.id)}
              className="px-3 py-1.5 bg-white rounded-xl shadow-xs"
              accessibilityLabel="Tümünü sıfırlayıp bir sonraki alışveriş için hazırla"
            >
              <Text className="text-emerald-800 text-xs font-bold" numberOfLines={1}>
                Tekrar Alınacak Yap
              </Text>
            </Btn>
          </Gradient>
        )}

        {/* Uncompleted Section */}
        {(statusFilter === 'ALL' || statusFilter === 'UNCOMPLETED') && uncompletedItems.length > 0 && (
          <View style={tw`gap-2 mb-6`}>
            <View style={tw`flex-row items-center justify-between px-1`}>
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Alınacak Ürünler ({uncompletedItems.length})
              </Text>
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {uncompletedItems.reduce((a, b) => a + (b.price || 0) * (b.quantity || 1), 0).toLocaleString('tr-TR')}{' '}
                ₺
              </Text>
            </View>

            {uncompletedItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const itemTotal = (item.price || 0) * (item.quantity || 1);

              return (
                <View
                  key={item.id}
                  style={tw`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs flex-row items-center justify-between gap-3`}
                >
                  {/* Left: Checkbox & Name */}
                  <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                    <Btn
                      onPress={() => toggleItemComplete(item.id)}
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 items-center justify-center"
                      accessibilityLabel="Sepete Ekle / Alındı Olarak İşaretle"
                    >
                      <Check {...ic('w-4 h-4 text-transparent')} />
                    </Btn>

                    <View style={tw`min-w-0 flex-1`}>
                      <Text className="font-bold text-slate-900 dark:text-white text-sm" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={tw`flex-row items-center gap-2 mt-0.5 flex-wrap`}>
                        {cat ? (
                          <View style={[tw`px-2 py-0.5 rounded-md`, { backgroundColor: cat.bgLight }]}>
                            <Text className="text-[10px] font-semibold" style={{ color: cat.color }}>
                              {cat.name}
                            </Text>
                          </View>
                        ) : null}
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: Quantity Stepper & Price & Delete */}
                  <View style={tw`flex-row items-center gap-2`}>
                    {/* Quantity Stepper */}
                    <View
                      style={tw`flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700`}
                    >
                      <Btn
                        onPress={() => handleQuantityChange(item, -1)}
                        className="w-5 h-5 items-center justify-center rounded"
                      >
                        <Text className="text-slate-600 dark:text-slate-300 text-xs font-bold">-</Text>
                      </Btn>
                      <Text className="px-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[20px] text-center">
                        {item.quantity}
                      </Text>
                      <Btn
                        onPress={() => handleQuantityChange(item, 1)}
                        className="w-5 h-5 items-center justify-center rounded"
                      >
                        <Text className="text-slate-600 dark:text-slate-300 text-xs font-bold">+</Text>
                      </Btn>
                    </View>

                    {/* Price Editor */}
                    {editingPriceId === item.id ? (
                      <View style={tw`flex-row items-center gap-1`}>
                        <Input
                          keyboardType="decimal-pad"
                          autoFocus
                          selectTextOnFocus
                          value={tempPrice}
                          onChangeText={setTempPrice}
                          onBlur={() => handleSavePrice(item.id)}
                          onSubmitEditing={() => handleSavePrice(item.id)}
                          className="w-16 px-1.5 py-1 text-xs border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md font-bold text-right"
                        />
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">₺</Text>
                      </View>
                    ) : (
                      <Btn
                        onPress={() => handleStartEditPrice(item)}
                        accessibilityLabel="Fiyatı Düzenle"
                        className="items-end px-2 py-1 rounded-lg"
                      >
                        <Text className="font-black text-slate-900 dark:text-white text-xs text-right">
                          {itemTotal > 0 ? `${itemTotal.toLocaleString('tr-TR')} ₺` : '0.00 ₺'}
                        </Text>
                        {item.quantity > 1 && item.price > 0 ? (
                          <Text className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                            ({item.price} ₺/{item.unit})
                          </Text>
                        ) : null}
                      </Btn>
                    )}

                    <Btn onPress={() => setItemToDelete(item)} className="p-1 rounded" accessibilityLabel="Sil">
                      <Trash2 {...ic('w-4 h-4 text-slate-300 dark:text-slate-600')} />
                    </Btn>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completed Section */}
        {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && completedItems.length > 0 && (
          <View style={tw`gap-2`}>
            <View style={tw`flex-row items-center justify-between px-1 pt-1 gap-2`}>
              <View style={tw`flex-row items-center gap-1.5 flex-1 min-w-0`}>
                <CheckCircle2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                <Text className="flex-1 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  Sepetteki & Alınan Ürünler ({completedItems.length})
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-2`}>
                <Text className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  {completedItems.reduce((a, b) => a + (b.price || 0) * (b.quantity || 1), 0).toLocaleString('tr-TR')}{' '}
                  ₺
                </Text>
                <Btn
                  onPress={() => uncheckAllItems(list.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg flex-row items-center gap-1"
                  accessibilityLabel="Tümünü tekrar alınacak yap"
                >
                  <RotateCcw {...ic('w-3 h-3 text-slate-600 dark:text-slate-300')} />
                  <Text className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Tümünü Geri Al</Text>
                </Btn>
              </View>
            </View>

            {completedItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const completedUser = users.find((u) => u.id === item.completedBy);
              const itemTotal = (item.price || 0) * (item.quantity || 1);

              return (
                <View
                  key={item.id}
                  style={tw`bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-3 flex-row items-center justify-between gap-3`}
                >
                  <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                    <Btn
                      onPress={() => toggleItemComplete(item.id)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 items-center justify-center shadow-2xs"
                      accessibilityLabel="İşareti Kaldır (Alınacak Yap)"
                    >
                      <Check {...ic('w-4 h-4 text-white')} />
                    </Btn>

                    <View style={tw`min-w-0 flex-1`}>
                      <Text
                        className="font-bold text-slate-700 dark:text-slate-300 text-sm line-through"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={tw`flex-row items-center gap-2 mt-0.5 flex-wrap`}>
                        {cat ? (
                          <View style={[tw`px-2 py-0.5 rounded-md`, { backgroundColor: cat.bgLight }]}>
                            <Text className="text-[10px] font-semibold" style={{ color: cat.color }}>
                              {cat.name}
                            </Text>
                          </View>
                        ) : null}
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.quantity} {item.unit}
                        </Text>
                        {completedUser ? (
                          <View style={tw`bg-emerald-100 dark:bg-emerald-950/60 px-1.5 rounded`}>
                            <Text className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
                              {completedUser.name.split(' ')[0]} aldı
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={tw`flex-row items-center gap-2`}>
                    <Text className="font-black text-emerald-900 dark:text-emerald-300 text-xs">
                      {itemTotal.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Btn
                      onPress={() => toggleItemComplete(item.id)}
                      className="p-1 rounded"
                      accessibilityLabel="Geri Al (Alınacaklara Ekle)"
                    >
                      <RotateCcw {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                    </Btn>
                    <Btn onPress={() => setItemToDelete(item)} className="p-1 rounded" accessibilityLabel="Sil">
                      <Trash2 {...ic('w-4 h-4 text-slate-300 dark:text-slate-600')} />
                    </Btn>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar - Docked to Bottom */}
      <View
        style={[
          tw`z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800 pt-3 px-3`,
          // web: shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]
          {
            paddingBottom: Math.max(12, insets.bottom),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 12,
          },
        ]}
      >
        <View style={tw`w-full max-w-3xl self-center flex-row items-center gap-2.5`}>
          <Btn
            onPress={() => setIsAddOpen(true)}
            className="flex-1 h-12 flex-row items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-900 dark:bg-white shadow-xs"
          >
            <Plus {...ic('w-4 h-4 text-white dark:text-slate-900')} />
            <Text className="text-white dark:text-slate-900 text-xs font-bold">Yeni Ürün Ekle</Text>
          </Btn>

          {/* Checkout button */}
          <Btn
            onPress={handleCheckout}
            disabled={totalInCart === 0}
            // web keeps full opacity when disabled (only the color changes)
            style={{ opacity: 1 }}
            className={`flex-1 h-12 flex-row items-center justify-center gap-1.5 px-3 rounded-xl shadow-xs ${
              totalInCart > 0
                ? 'bg-emerald-600 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckCircle2
              {...ic(totalInCart > 0 ? 'w-4 h-4 text-white' : 'w-4 h-4 text-slate-400 dark:text-slate-500')}
            />
            <Text
              className={`text-xs font-bold ${totalInCart > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}
              numberOfLines={1}
            >
              Alışverişi Bitir ({totalInCart.toLocaleString('tr-TR')} ₺)
            </Text>
          </Btn>
        </View>
      </View>

      {/* Add Item Drawer */}
      {isAddOpen && <AddItemDrawer list={list} onClose={() => setIsAddOpen(false)} />}

      {/* Checkout Receipt Modal */}
      {checkoutResult && (
        <CheckoutSummaryModal
          totalAmount={checkoutResult.totalAmount}
          itemCount={checkoutResult.itemCount}
          listTitle={list.title}
          onClose={() => setCheckoutResult(null)}
        />
      )}

      {/* Edit List Modal */}
      {showEditModal && <EditListModal list={list} onClose={() => setShowEditModal(false)} />}

      {/* Item Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Ürünü Listeden Sil"
        message={
          itemToDelete ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">"{itemToDelete.title}"</Text>{' '}
              ürününü listeden silmek istediğinize emin misiniz?
            </Text>
          ) : (
            ''
          )
        }
        confirmText="Ürünü Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (itemToDelete) {
            deleteItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
      />
    </View>
  );
};
