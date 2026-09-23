import React, { useMemo } from 'react';
import { View } from 'react-native';
import { NotebookPen, Pencil, Pin, PinOff, Trash2 } from 'lucide-react-native';

import { Card, EmptyState, Text, confirmAction, palette, showActionSheet } from '../../design';
import { formatDay } from '../../logic/format';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { GroupHeader } from './parts';

const NoteCard: React.FC<{ item: ListItem; onPress: () => void; onLongPress: () => void }> = ({ item, onPress, onLongPress }) => {
  const category = useAppStore((s) => s.categories.find((c) => c.id === item.categoryId));
  return (
    <Card onPress={onPress} onLongPress={onLongPress} className="gap-2" style={category ? { borderTopWidth: 3, borderTopColor: category.color } : undefined}>
      <View style={tw`flex-row items-start gap-1.5`}>
        <Text variant="headline" numberOfLines={2} className="flex-1">
          {item.title || 'Başlıksız not'}
        </Text>
        {item.isPinned ? <Pin size={14} color={palette.warning} fill={palette.warning} /> : null}
      </View>
      {item.content ? (
        <Text variant="subhead" tone="muted" numberOfLines={4}>
          {item.content}
        </Text>
      ) : null}
      <Text variant="caption" tone="faint">
        {category ? `${formatDay(item.createdAt)} · ${category.name}` : formatDay(item.createdAt)}
      </Text>
    </Card>
  );
};

/** Two independent columns so cards of different heights pack like a masonry grid. */
const NoteGrid: React.FC<{ notes: ListItem[]; renderCard: (note: ListItem) => React.ReactNode }> = ({ notes, renderCard }) => {
  const left = notes.filter((_, i) => i % 2 === 0);
  const right = notes.filter((_, i) => i % 2 === 1);
  return (
    <View style={tw`flex-row gap-3 items-start`}>
      <View style={tw`flex-1 gap-3`}>{left.map(renderCard)}</View>
      <View style={tw`flex-1 gap-3`}>{right.map(renderCard)}</View>
    </View>
  );
};

export const NotesContent: React.FC<{ listId: string; items: ListItem[] }> = ({ listId, items }) => {
  const navigation = useAppNavigation();
  const updateItem = useAppStore((s) => s.updateItem);
  const deleteItem = useAppStore((s) => s.deleteItem);

  const { pinned, others } = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return { pinned: sorted.filter((n) => n.isPinned), others: sorted.filter((n) => !n.isPinned) };
  }, [items]);

  const open = (note: ListItem) => navigation.navigate('NoteEditor', { listId, itemId: note.id });

  const more = (note: ListItem) =>
    showActionSheet({
      title: note.title || 'Not',
      options: [
        { label: 'Düzenle', icon: Pencil, onPress: () => open(note) },
        {
          label: note.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle',
          icon: note.isPinned ? PinOff : Pin,
          onPress: () => updateItem(note.id, { isPinned: !note.isPinned }),
        },
        {
          label: 'Sil',
          icon: Trash2,
          destructive: true,
          onPress: () =>
            confirmAction({ title: 'Not silinsin mi?', message: 'Bu işlem geri alınamaz.', onConfirm: () => deleteItem(note.id) }),
        },
      ],
    });

  const renderCard = (note: ListItem) => <NoteCard key={note.id} item={note} onPress={() => open(note)} onLongPress={() => more(note)} />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Henüz not yok"
        message="Fikirlerinizi, tariflerinizi ve önemli bilgileri burada saklayın."
        action={{ label: 'Yeni Not', onPress: () => navigation.navigate('NoteEditor', { listId }) }}
      />
    );
  }

  return (
    <>
      {pinned.length ? (
        <View style={tw`gap-2`}>
          <GroupHeader title="Sabitlenmiş" count={pinned.length} />
          <NoteGrid notes={pinned} renderCard={renderCard} />
        </View>
      ) : null}
      {others.length ? (
        <View style={tw`gap-2`}>
          {pinned.length ? <GroupHeader title="Diğer notlar" count={others.length} /> : null}
          <NoteGrid notes={others} renderCard={renderCard} />
        </View>
      ) : null}
      <View style={tw`h-16`} />
    </>
  );
};
