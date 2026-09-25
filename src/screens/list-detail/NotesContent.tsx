import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { NotebookPen, Pencil, Pin, PinOff, Trash2 } from 'lucide-react-native';

import { EmptyState, Text, confirmAction, palette, showActionSheet } from '../../design';
import { useTheme } from '../../hooks/useTheme';
import { formatDay } from '../../logic/format';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { GroupHeader } from './parts';

/** Sticky-note style card tinted with the category colour. */
const NoteCard: React.FC<{ item: ListItem; onPress: () => void; onLongPress: () => void }> = ({ item, onPress, onLongPress }) => {
  const category = useAppStore((s) => s.categories.find((c) => c.id === item.categoryId));
  const { isDark } = useTheme();
  const color = category?.color ?? palette.slate500;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={item.title || 'Başlıksız not'}
      accessibilityHint="Notu aç; uzun basarak diğer işlemler"
      style={({ pressed }) => [
        tw`rounded-3xl p-4 gap-2 border`,
        {
          backgroundColor: isDark ? `${color}24` : `${color}12`,
          borderColor: isDark ? `${color}40` : `${color}30`,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={tw`flex-row items-start gap-2`}>
        <Text variant="headline" numberOfLines={3} className="flex-1">
          {item.title || 'Başlıksız not'}
        </Text>
        {item.isPinned ? <Pin size={15} color={color} fill={color} /> : null}
      </View>
      {item.content ? (
        <Text variant="subhead" tone="muted" numberOfLines={7} className="leading-[20px]">
          {item.content}
        </Text>
      ) : null}
      <View style={tw`flex-row items-center gap-1.5 pt-1`}>
        <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: color }]} />
        <Text variant="caption" tone="faint" numberOfLines={1} className="flex-1">
          {/* Date first so a long category name is what gets truncated, not the (always short) date. */}
          {category ? `${formatDay(item.createdAt)} · ${category.name}` : formatDay(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

/** Rough rendered height, used to balance the two masonry columns. */
const estimateHeight = (note: ListItem) =>
  60 + Math.min(3, Math.ceil((note.title?.length || 10) / 16)) * 22 + Math.min(7, Math.ceil((note.content?.length || 0) / 22)) * 20;

/** Two independent columns; each card goes to the currently shorter column. */
const NoteGrid: React.FC<{ notes: ListItem[]; renderCard: (note: ListItem) => React.ReactNode }> = ({ notes, renderCard }) => {
  const left: ListItem[] = [];
  const right: ListItem[] = [];
  let lh = 0;
  let rh = 0;
  for (const note of notes) {
    const h = estimateHeight(note);
    if (lh <= rh) {
      left.push(note);
      lh += h;
    } else {
      right.push(note);
      rh += h;
    }
  }
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
          <GroupHeader left={<Pin size={16} color={palette.warning} fill={palette.warning} />} title="Sabitlenmiş" count={pinned.length} />
          <NoteGrid notes={pinned} renderCard={renderCard} />
        </View>
      ) : null}
      {others.length ? (
        <View style={tw`gap-2`}>
          {pinned.length ? <GroupHeader title="Diğer notlar" count={others.length} /> : <GroupHeader title="Tüm notlar" count={others.length} />}
          <NoteGrid notes={others} renderCard={renderCard} />
        </View>
      ) : null}
      <View style={tw`h-16`} />
    </>
  );
};
