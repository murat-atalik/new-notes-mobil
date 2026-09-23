import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Calendar, ListTodo } from 'lucide-react-native';

import { Badge, EmptyState, Text, UserAvatar } from '../../design';
import { formatDay } from '../../logic/format';
import { PRIORITY_META, taskBucket, type TaskBucket } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListItem } from '../../types';
import { GroupHeader, RoundCheck, RowChevron, RowGroup } from './parts';

const BUCKETS: { key: TaskBucket; title: string }[] = [
  { key: 'OVERDUE', title: 'Gecikmiş' },
  { key: 'TODAY', title: 'Bugün' },
  { key: 'UPCOMING', title: 'Yaklaşan' },
  { key: 'NODATE', title: 'Tarihsiz' },
  { key: 'DONE', title: 'Tamamlandı' },
];

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

function sortTasks(a: ListItem, b: ListItem) {
  const due = (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  if (due !== 0) return due;
  return PRIORITY_ORDER[a.priority ?? 'MEDIUM'] - PRIORITY_ORDER[b.priority ?? 'MEDIUM'];
}

const TodoRow: React.FC<{ item: ListItem; onToggle: () => void; onEdit: () => void }> = ({ item, onToggle, onEdit }) => {
  const users = useAppStore((s) => s.users);
  const assignee = item.assignedTo ? users.find((u) => u.id === item.assignedTo) : undefined;
  const bucket = taskBucket(item);
  const priority = item.priority ? PRIORITY_META[item.priority] : undefined;
  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onEdit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.isCompleted }}
      accessibilityLabel={item.title}
      style={({ pressed }) => [tw`flex-row items-center gap-3 pl-4 pr-3 min-h-[60px] py-2.5`, pressed ? tw`bg-slate-100 dark:bg-slate-800` : null]}
    >
      <RoundCheck checked={item.isCompleted} color={priority && !item.isCompleted ? priority.color : undefined} />
      <View style={tw`flex-1 min-w-0 gap-1`}>
        <Text
          variant="body"
          weight="medium"
          tone={item.isCompleted ? 'faint' : 'default'}
          numberOfLines={2}
          style={item.isCompleted ? { textDecorationLine: 'line-through' } : undefined}
        >
          {item.title}
        </Text>
        {item.dueDate || priority ? (
          <View style={tw`flex-row items-center gap-2`}>
            {item.dueDate ? <Badge label={formatDay(item.dueDate)} icon={Calendar} tone={bucket === 'OVERDUE' ? 'danger' : 'neutral'} /> : null}
            {priority && !item.isCompleted ? (
              <View style={tw`flex-row items-center gap-1`}>
                <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: priority.color }]} />
                <Text variant="caption" tone="muted" weight="semibold">
                  {priority.label}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {assignee ? <UserAvatar avatar={assignee.avatar} name={assignee.name} color={assignee.color} size="sm" /> : null}
      <RowChevron onPress={onEdit} />
    </Pressable>
  );
};

export const TodoContent: React.FC<{ listId: string; items: ListItem[]; onAddFocus: () => void }> = ({ listId, items, onAddFocus }) => {
  const navigation = useAppNavigation();
  const toggle = useAppStore((s) => s.toggleItemCompleted);

  const sections = useMemo(
    () =>
      BUCKETS.map((b) => ({
        ...b,
        items: items
          .filter((i) => taskBucket(i) === b.key)
          .sort(b.key === 'DONE' ? (x, y) => (y.completedAt || '').localeCompare(x.completedAt || '') : sortTasks),
      })).filter((s) => s.items.length > 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Henüz görev yok"
        message="Aşağıdaki alana yazıp ekleyin; tarih, öncelik ve kişi atamasını sonra yapabilirsiniz."
        action={{ label: 'Görev ekle', onPress: onAddFocus }}
      />
    );
  }

  return (
    <>
      {sections.map((section) => (
        <View key={section.key} style={tw`gap-2`}>
          <GroupHeader title={section.title} count={section.items.length} tone={section.key === 'OVERDUE' ? 'danger' : 'default'} />
          <RowGroup>
            {section.items.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                onToggle={() => toggle(item.id)}
                onEdit={() => navigation.navigate('ItemForm', { listId, itemId: item.id })}
              />
            ))}
          </RowGroup>
        </View>
      ))}
    </>
  );
};
