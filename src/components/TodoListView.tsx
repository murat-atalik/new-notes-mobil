import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Check, Pencil, Plus, Share2, Trash2 } from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { AppList, ListItem } from '../types';
import { AddItemDrawer } from './AddItemDrawer';
import { ConfirmModal } from './ConfirmModal';
import { EditListModal } from './EditListModal';
import { Btn, Text } from './ui';

interface TodoListViewProps {
  list: AppList;
  onBack: () => void;
  onOpenInvite: () => void;
}

export const TodoListView: React.FC<TodoListViewProps> = ({ list, onBack, onOpenInvite }) => {
  const insets = useSafeAreaInsets();
  const { items, toggleItemComplete, deleteItem, categories, syncWithServer } = useAppStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ListItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const listColor = list.color || '#f59e0b';

  const listItems = items.filter((i) => i.listId === list.id);
  const uncompleted = listItems.filter((i) => !i.isCompleted);
  const completed = listItems.filter((i) => i.isCompleted);

  // Web PullToRefresh equivalent
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityBadge = (p?: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (p) {
      case 'HIGH':
        return (
          <View style={tw`px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70`}>
            <Text className="text-[10px] font-bold text-rose-700 dark:text-rose-400">Yüksek</Text>
          </View>
        );
      case 'MEDIUM':
        return (
          <View style={tw`px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70`}>
            <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Orta</Text>
          </View>
        );
      default:
        return (
          <View style={tw`px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70`}>
            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Düşük</Text>
          </View>
        );
    }
  };

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
          <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
            <Btn onPress={onBack} className="w-10 h-10 -ml-1 rounded-xl items-center justify-center" accessibilityLabel="Geri">
              <ArrowLeft {...ic('w-5 h-5 text-slate-600 dark:text-slate-300')} />
            </Btn>
            <View style={tw`flex-1 min-w-0`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={[tw`w-2.5 h-2.5 rounded-full shadow-2xs`, { backgroundColor: listColor }]} />
                <Text
                  className="flex-shrink font-bold text-slate-900 dark:text-white text-base leading-tight"
                  numberOfLines={1}
                >
                  {list.title}
                </Text>
              </View>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                {completed.length} / {listItems.length} Görev Tamamlandı
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-center gap-2 ml-2`}>
            <Btn
              onPress={() => setShowEditModal(true)}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-center"
              accessibilityLabel="Listeyi ve Rengi Düzenle"
            >
              <Pencil {...ic('w-4 h-4 text-slate-600 dark:text-slate-300')} />
            </Btn>

            <Btn
              onPress={onOpenInvite}
              className="h-10 flex-row items-center gap-1.5 px-3 rounded-xl border"
              style={{ backgroundColor: `${listColor}15`, borderColor: `${listColor}35` }}
            >
              <Share2 size={16} color={listColor} />
              <Text className="text-xs font-semibold" style={{ color: listColor }}>
                Paylaş
              </Text>
            </Btn>
          </View>
        </View>
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`w-full max-w-3xl self-center px-4 pt-5 pb-32 gap-5`}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" colors={['#10b981']} />}
      >
        {/* Uncompleted Tasks */}
        <View style={tw`gap-2.5`}>
          {uncompleted.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            return (
              <View
                key={item.id}
                style={tw`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 pl-4 pr-2 py-3 shadow-xs flex-row items-center justify-between gap-2`}
              >
                <Btn
                  onPress={() => toggleItemComplete(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: false }}
                  className="flex-row items-center gap-3 min-w-0 flex-1 py-1"
                >
                  <View style={tw`w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 items-center justify-center`}>
                    <Check {...ic('w-4 h-4 text-transparent')} />
                  </View>
                  <View style={tw`min-w-0 flex-1`}>
                    <Text className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</Text>
                    <View style={tw`flex-row flex-wrap items-center gap-2 mt-1.5`}>
                      {getPriorityBadge(item.priority)}
                      {item.dueDate ? (
                        <View style={tw`flex-row items-center gap-1`}>
                          <Calendar {...ic('w-3 h-3 text-slate-500 dark:text-slate-400')} />
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {item.dueDate}
                          </Text>
                        </View>
                      ) : null}
                      {cat ? (
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400">• {cat.name}</Text>
                      ) : null}
                    </View>
                  </View>
                </Btn>
                <Btn
                  onPress={() => setItemToDelete(item)}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  accessibilityLabel="Görevi Sil"
                >
                  <Trash2 {...ic('w-4 h-4 text-slate-300 dark:text-slate-600')} />
                </Btn>
              </View>
            );
          })}
        </View>

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <View style={tw`gap-2.5 pt-1`}>
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 px-1">
              Tamamlanan Görevler ({completed.length})
            </Text>
            {completed.map((item) => (
              <View
                key={item.id}
                style={tw`bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 pl-4 pr-2 py-2 flex-row items-center justify-between gap-2 opacity-75`}
              >
                <Btn
                  onPress={() => toggleItemComplete(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: true }}
                  className="flex-row items-center gap-3 min-w-0 flex-1 py-1"
                >
                  <View style={tw`w-6 h-6 rounded-md bg-emerald-600 items-center justify-center`}>
                    <Check {...ic('w-4 h-4 text-white')} />
                  </View>
                  <Text
                    className="flex-1 font-medium text-slate-600 dark:text-slate-400 text-sm line-through"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </Btn>
                <Btn
                  onPress={() => setItemToDelete(item)}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  accessibilityLabel="Görevi Sil"
                >
                  <Trash2 {...ic('w-4 h-4 text-slate-300 dark:text-slate-600')} />
                </Btn>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Task Button */}
      <View style={[tw`absolute right-4 z-30`, { bottom: 16 + Math.max(insets.bottom, 8) }]}>
        <Btn
          testID="floating-add-todo-btn"
          onPress={() => setIsAddOpen(true)}
          style={{ backgroundColor: listColor }}
          className="h-14 flex-row items-center gap-2 px-6 rounded-full shadow-xl"
          accessibilityLabel="Yeni Görev Ekle"
        >
          <Plus {...ic('w-5 h-5 text-white', 2.5)} />
          <Text className="text-white font-bold text-[15px]">Yeni Görev Ekle</Text>
        </Btn>
      </View>

      {isAddOpen && <AddItemDrawer list={list} onClose={() => setIsAddOpen(false)} />}

      {/* Edit List Modal */}
      {showEditModal && <EditListModal list={list} onClose={() => setShowEditModal(false)} />}

      {/* Delete Item Confirm Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Görevi Sil"
        message={
          itemToDelete ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">"{itemToDelete.title}"</Text>{' '}
              görevini silmek istediğinize emin misiniz?
            </Text>
          ) : (
            ''
          )
        }
        confirmText="Görevi Sil"
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
