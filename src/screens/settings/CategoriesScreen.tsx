import React, { useState } from 'react';
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react-native';

import { confirmAction, EmptyState, IconButton, IconTile, ListGroup, palette, Row, Segmented, showActionSheet, showToast, StackScreen } from '../../design';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { Category, ListType } from '../../types';
import { LIST_TYPE_LABEL, LIST_TYPE_OPTIONS } from './listTypes';

export const CategoriesScreen: React.FC<RootScreenProps<'Categories'>> = ({ navigation }) => {
  const categories = useAppStore((s) => s.categories);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const isSyncing = useAppStore((s) => s.isSyncing);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const [type, setType] = useState<ListType>('SHOPPING');

  const visible = categories.filter((c) => c.type === type);
  const options = LIST_TYPE_OPTIONS.map((o) => ({ ...o, count: categories.filter((c) => c.type === o.value).length }));

  const askDelete = (category: Category) =>
    confirmAction({
      title: `"${category.name}" silinsin mi?`,
      message: 'Bu kategorideki öğeler kategorisiz kalır.',
      onConfirm: () => {
        deleteCategory(category.id);
        showToast('Kategori silindi');
      },
    });

  const openActions = (category: Category) =>
    showActionSheet({
      title: category.name,
      options: [
        { label: 'Düzenle', icon: Pencil, onPress: () => navigation.navigate('CategoryForm', { categoryId: category.id }) },
        { label: 'Sil', icon: Trash2, destructive: true, onPress: () => askDelete(category) },
      ],
    });

  return (
    <StackScreen
      title="Kategoriler"
      right={<IconButton icon={Plus} label="Kategori ekle" variant="plain" color={palette.brand} onPress={() => navigation.navigate('CategoryForm', { type })} />}
      refreshing={isSyncing}
      onRefresh={() => syncWithServer(false)}
    >
      <Segmented options={options} value={type} onChange={setType} />
      {visible.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={`${LIST_TYPE_LABEL[type]} kategorisi yok`}
          message="Öğelerini gruplamak için bir kategori oluştur."
          action={{ label: 'Kategori Ekle', icon: Plus, onPress: () => navigation.navigate('CategoryForm', { type }) }}
        />
      ) : (
        <ListGroup footer="Düzenlemek için dokun, daha fazla seçenek için basılı tut.">
          {visible.map((category) => (
            <Row
              key={category.id}
              title={category.name}
              left={<IconTile icon={category.icon} color={category.color} size="sm" />}
              onPress={() => navigation.navigate('CategoryForm', { categoryId: category.id })}
              onLongPress={() => openActions(category)}
              chevron={false}
              right={<IconButton icon={MoreHorizontal} label="Seçenekler" variant="plain" size="md" onPress={() => openActions(category)} />}
            />
          ))}
        </ListGroup>
      )}
    </StackScreen>
  );
};
