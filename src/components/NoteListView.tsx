import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Edit3, Pencil, Pin, Plus, Share2, Trash2 } from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { AppList, ListItem } from '../types';
import { AddItemDrawer } from './AddItemDrawer';
import { ConfirmModal } from './ConfirmModal';
import { EditListModal } from './EditListModal';
import { Btn, Text } from './ui';

interface NoteListViewProps {
  list: AppList;
  onBack: () => void;
  onOpenInvite: () => void;
}

export const NoteListView: React.FC<NoteListViewProps> = ({ list, onBack, onOpenInvite }) => {
  const insets = useSafeAreaInsets();
  const { items, deleteItem, updateItem, categories, syncWithServer } = useAppStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ListItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const listColor = list.color || '#a855f7';

  const listItems = items.filter((i) => i.listId === list.id);
  const pinnedNotes = listItems.filter((i) => i.isPinned);
  const otherNotes = listItems.filter((i) => !i.isPinned);

  // Web PullToRefresh equivalent
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const purple600 = tw.color('purple-600');

  return (
    <View style={tw`flex-1 bg-slate-50/50 dark:bg-slate-950`}>
      {/* Top Header */}
      <View
        style={[
          tw`z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 pb-3`,
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
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">{listItems.length} Not Kayıtlı</Text>
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
        {listItems.length === 0 ? (
          <View
            style={tw`items-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 gap-3`}
          >
            <View
              style={[tw`w-14 h-14 rounded-2xl items-center justify-center shadow-sm`, { backgroundColor: listColor }]}
            >
              <Edit3 {...ic('w-7 h-7 text-white')} />
            </View>
            <View style={tw`items-center`}>
              <Text className="text-base font-bold text-slate-800 dark:text-white text-center">Henüz Not Eklenmedi</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
                Bu listeye fikirlerinizi, tariflerinizi veya önemli notlarınızı ekleyebilirsiniz.
              </Text>
            </View>
            <Btn
              onPress={() => setIsAddOpen(true)}
              style={{ backgroundColor: listColor }}
              className="h-12 flex-row items-center self-center gap-2 px-5 rounded-2xl shadow-xs"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-sm font-bold">İlk Notu Ekle</Text>
            </Btn>
          </View>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <View>
                <View style={tw`flex-row items-center gap-1 mb-2.5 px-1`}>
                  <Pin {...ic('w-3 h-3 text-purple-600')} fill={purple600} />
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">Sabitlenenler</Text>
                </View>
                <View style={tw`gap-3`}>
                  {pinnedNotes.map((note) => {
                    const cat = categories.find((c) => c.id === note.categoryId);
                    return (
                      <View
                        key={note.id}
                        style={tw`bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs flex-col justify-between`}
                      >
                        <View>
                          <View style={tw`flex-row items-start justify-between gap-2 mb-1`}>
                            <Text className="flex-1 font-bold text-slate-900 dark:text-purple-100 text-sm">
                              {note.title}
                            </Text>
                            <Btn
                              onPress={() => updateItem(note.id, { isPinned: false })}
                              className="w-10 h-10 -mt-2 -mr-2 rounded-xl items-center justify-center"
                              accessibilityLabel="Sabitlemeyi Kaldır"
                            >
                              <Pin {...ic('w-4 h-4 text-purple-600 dark:text-purple-400')} fill={purple600} />
                            </Btn>
                          </View>
                          {note.content ? (
                            <Text className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {note.content}
                            </Text>
                          ) : null}
                        </View>

                        <View
                          style={tw`flex-row items-center justify-between mt-3 pt-1 border-t border-purple-200/50 dark:border-purple-800/40`}
                        >
                          {cat ? (
                            <View style={tw`bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md`}>
                              <Text className="text-[10px] font-semibold text-purple-800 dark:text-purple-300">
                                {cat.name}
                              </Text>
                            </View>
                          ) : null}
                          <Btn
                            onPress={() => setNoteToDelete(note)}
                            className="w-10 h-10 -mr-2 -mb-2 ml-auto rounded-xl items-center justify-center"
                            accessibilityLabel="Notu Sil"
                          >
                            <Trash2 {...ic('w-4 h-4 text-slate-400')} />
                          </Btn>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Regular Notes */}
            <View>
              {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2.5 px-1">Diğer Notlar</Text>
              )}
              <View style={tw`gap-3`}>
                {otherNotes.map((note) => {
                  const cat = categories.find((c) => c.id === note.categoryId);
                  return (
                    <View
                      key={note.id}
                      style={tw`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex-col justify-between`}
                    >
                      <View>
                        <View style={tw`flex-row items-start justify-between gap-2 mb-1`}>
                          <Text className="flex-1 font-bold text-slate-900 dark:text-white text-sm">{note.title}</Text>
                          <Btn
                            onPress={() => updateItem(note.id, { isPinned: true })}
                            className="w-10 h-10 -mt-2 -mr-2 rounded-xl items-center justify-center"
                            accessibilityLabel="En Üste Sabitle"
                          >
                            <Pin {...ic('w-4 h-4 text-slate-400 dark:text-slate-500')} />
                          </Btn>
                        </View>
                        {note.content ? (
                          <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {note.content}
                          </Text>
                        ) : null}
                      </View>

                      <View
                        style={tw`flex-row items-center justify-between mt-3 pt-1 border-t border-slate-100 dark:border-slate-800`}
                      >
                        {cat ? (
                          <View style={tw`bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md`}>
                            <Text className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {cat.name}
                            </Text>
                          </View>
                        ) : null}
                        <Btn
                          onPress={() => setNoteToDelete(note)}
                          className="w-10 h-10 -mr-2 -mb-2 ml-auto rounded-xl items-center justify-center"
                          accessibilityLabel="Notu Sil"
                        >
                          <Trash2 {...ic('w-4 h-4 text-slate-300 dark:text-slate-600')} />
                        </Btn>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={[tw`absolute right-4 z-30 flex-row items-center gap-2`, { bottom: 16 + Math.max(insets.bottom, 8) }]}>
        {/* Floating Add Note Button */}
        <Btn
          testID="floating-add-note-btn"
          onPress={() => setIsAddOpen(true)}
          style={{ backgroundColor: listColor }}
          className="h-14 flex-row items-center gap-2 px-6 rounded-full shadow-xl"
          accessibilityLabel="Yeni Not"
        >
          <Plus {...ic('w-5 h-5 text-white', 2.5)} />
          <Text className="text-white font-bold text-[15px]">Yeni Not</Text>
        </Btn>
      </View>

      {isAddOpen && <AddItemDrawer list={list} onClose={() => setIsAddOpen(false)} />}

      {/* Edit List Modal */}
      {showEditModal && <EditListModal list={list} onClose={() => setShowEditModal(false)} />}

      {/* Delete Note Confirm Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Notu Sil"
        message={
          noteToDelete ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">"{noteToDelete.title}"</Text>{' '}
              notunu silmek istediğinize emin misiniz?
            </Text>
          ) : (
            ''
          )
        }
        confirmText="Notu Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (noteToDelete) {
            deleteItem(noteToDelete.id);
            setNoteToDelete(null);
          }
        }}
        onClose={() => setNoteToDelete(null)}
      />
    </View>
  );
};
