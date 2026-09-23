import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { CheckCheck, Eraser, FileQuestion, MoreHorizontal, Pencil, Plus, ShoppingBag, Trash2, Undo2, UserPlus } from 'lucide-react-native';

import {
  Button,
  EmptyState,
  FAB,
  IconButton,
  StackScreen,
  confirmAction,
  showActionSheet,
  showToast,
  type ActionSheetOption,
  type TextInputHandle,
} from '../../design';
import { formatMoney } from '../../logic/format';
import { shoppingTotals, useListItems } from '../../logic/selectors';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { listSubtitle, splitTitles, useAccessibleList, useCategoriesFor } from './helpers';
import { NotesContent } from './NotesContent';
import { QuickAddBar } from './parts';
import { ShoppingContent } from './ShoppingContent';
import { TodoContent } from './TodoContent';

export const ListDetailScreen: React.FC<RootScreenProps<'ListDetail'>> = ({ navigation, route }) => {
  const { listId } = route.params;
  const list = useAccessibleList(listId);
  const items = useListItems(listId);
  const categories = useCategoriesFor(list?.type);
  const currentUser = useAppStore((s) => s.currentUser);
  const addItem = useAppStore((s) => s.addItem);
  const bulkAddItems = useAppStore((s) => s.bulkAddItems);
  const markAll = useAppStore((s) => s.markAllItemsCompleted);
  const unmarkAll = useAppStore((s) => s.unmarkAllItemsCompleted);
  const clearCompleted = useAppStore((s) => s.clearCompletedItems);
  const deleteList = useAppStore((s) => s.deleteList);
  const syncWithServer = useAppStore((s) => s.syncWithServer);

  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInputHandle>(null);

  if (!list) {
    return (
      <StackScreen title="Liste">
        <EmptyState
          icon={FileQuestion}
          title="Liste bulunamadı"
          message="Bu liste silinmiş olabilir ya da erişim izniniz yok."
          action={{ label: 'Geri dön', onPress: () => navigation.goBack() }}
        />
      </StackScreen>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const defaultCategoryId = categories[0]?.id ?? (list.type === 'SHOPPING' ? 'cat-market' : '');

  const quickAdd = (text: string) => {
    const titles = splitTitles(text);
    if (titles.length === 0) return;
    if (titles.length > 1) {
      bulkAddItems(list.id, titles, defaultCategoryId);
      showToast(`${titles.length} ${list.type === 'SHOPPING' ? 'ürün' : 'görev'} eklendi`);
      return;
    }
    addItem({
      listId: list.id,
      title: titles[0],
      isCompleted: false,
      price: 0,
      quantity: 1,
      unit: 'adet',
      categoryId: defaultCategoryId,
      ...(list.type === 'TODO' ? { priority: 'MEDIUM' as const } : {}),
    });
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const allDone = items.length > 0 && completedCount === items.length;
  const isOwner = list.ownerId === currentUser.id;

  const openMenu = () => {
    const options: ActionSheetOption[] = [{ label: 'Listeyi Düzenle', icon: Pencil, onPress: () => navigation.navigate('ListForm', { listId: list.id }) }];
    if (list.type !== 'NOTE' && items.length > 0) {
      options.push(
        allDone
          ? { label: 'Tümünü kaldır', icon: Undo2, onPress: () => unmarkAll(list.id) }
          : { label: 'Tümünü işaretle', icon: CheckCheck, onPress: () => markAll(list.id) },
      );
    }
    if (list.type !== 'NOTE' && completedCount > 0) {
      options.push({
        label: 'Tamamlananları temizle',
        icon: Eraser,
        onPress: () =>
          confirmAction({
            title: 'Tamamlananlar silinsin mi?',
            message: `${completedCount} öğe listeden kaldırılacak.`,
            confirmText: 'Temizle',
            onConfirm: () => clearCompleted(list.id),
          }),
      });
    }
    if (isOwner) {
      options.push({
        label: 'Listeyi Sil',
        icon: Trash2,
        destructive: true,
        onPress: () =>
          confirmAction({
            title: 'Liste silinsin mi?',
            message: `"${list.title}" ve içindeki tüm öğeler silinecek.`,
            onConfirm: () => {
              deleteList(list.id);
              navigation.goBack();
              showToast('Liste silindi');
            },
          }),
      });
    }
    showActionSheet({ title: list.title, options });
  };

  const right = (
    <>
      <IconButton icon={UserPlus} label="Paylaş" onPress={() => navigation.navigate('ListShare', { listId: list.id })} />
      <IconButton icon={MoreHorizontal} label="Diğer işlemler" onPress={openMenu} />
    </>
  );

  const checkedTotal = shoppingTotals(items).checked;
  const footer =
    list.type === 'NOTE' ? undefined : (
      <View style={{ gap: 10 }}>
        {list.type === 'SHOPPING' && completedCount > 0 ? (
          <Button
            title={checkedTotal > 0 ? `Alışverişi Tamamla · ${formatMoney(checkedTotal)}` : 'Alışverişi Tamamla'}
            icon={ShoppingBag}
            onPress={() => navigation.navigate('Checkout', { listId: list.id })}
            fullWidth
          />
        ) : null}
        <QuickAddBar placeholder={list.type === 'SHOPPING' ? 'Ürün ekle…' : 'Görev ekle…'} onSubmit={quickAdd} inputRef={inputRef} />
      </View>
    );

  const focusInput = () => inputRef.current?.focus();

  return (
    <StackScreen
      title={list.title}
      subtitle={listSubtitle(list)}
      right={right}
      footer={footer}
      refreshing={refreshing}
      onRefresh={onRefresh}
      overlay={list.type === 'NOTE' ? <FAB icon={Plus} label="Yeni Not" onPress={() => navigation.navigate('NoteEditor', { listId: list.id })} /> : undefined}
    >
      {list.type === 'SHOPPING' ? <ShoppingContent listId={list.id} items={items} onAddFocus={focusInput} /> : null}
      {list.type === 'TODO' ? <TodoContent listId={list.id} items={items} onAddFocus={focusInput} /> : null}
      {list.type === 'NOTE' ? <NotesContent listId={list.id} items={items} /> : null}
    </StackScreen>
  );
};
