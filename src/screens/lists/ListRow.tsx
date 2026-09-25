import React from 'react';
import { View } from 'react-native';
import { Ellipsis } from 'lucide-react-native';

import { Badge, Btn, Card, IconTile, ProgressBar, Text, UserAvatar } from '../../design';
import { formatMoney } from '../../logic/format';
import { listProgress, shoppingTotals, taskBucket } from '../../logic/selectors';
import { ic, tw } from '../../lib/tw';
import type { AppList, ListItem, User } from '../../types';

/** One-line summary under a list title (depends on list type). */
export function listSubtitle(list: AppList, items: ListItem[]): string {
  if (list.type === 'SHOPPING') {
    if (!items.length) return 'Henüz ürün yok';
    const { done, total } = listProgress(items);
    const { pending } = shoppingTotals(items);
    return pending > 0 ? `${done}/${total} alındı · ${formatMoney(pending)} kaldı` : `${done}/${total} alındı`;
  }
  if (list.type === 'TODO') {
    if (!items.length) return 'Henüz görev yok';
    let overdue = 0;
    let pending = 0; // mutually exclusive from overdue, matches the detail screen's buckets
    for (const item of items) {
      const bucket = taskBucket(item);
      if (bucket === 'OVERDUE') overdue += 1;
      else if (bucket !== 'DONE') pending += 1;
    }
    if (!overdue && !pending) return 'Tüm görevler tamam 🎉';
    if (overdue && pending) return `${overdue} geciken · ${pending} bekleyen`;
    if (overdue) return `${overdue} geciken`;
    return `${pending} bekleyen`;
  }
  return items.length ? `${items.length} not` : 'Henüz not yok';
}

/** Overlapping member avatars (max 4 + "+N"). */
export const AvatarStack: React.FC<{ members: User[]; max?: number }> = ({ members, max = 4 }) => {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <View style={tw`flex-row items-center`}>
      {shown.map((user, index) => (
        <View key={user.id} style={[tw`rounded-full bg-white dark:bg-slate-900 p-[1.5px]`, index > 0 ? tw`-ml-2` : null]}>
          <UserAvatar avatar={user.avatar} name={user.name} color={user.color} size="xs" />
        </View>
      ))}
      {rest > 0 ? (
        <View style={tw`-ml-2 w-[27px] h-[27px] rounded-full bg-slate-100 dark:bg-slate-800 border-[1.5px] border-white dark:border-slate-900 items-center justify-center`}>
          <Text variant="caption" tone="muted" weight="bold" className="text-[11px]">
            {`+${rest}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export const ListRow: React.FC<{
  list: AppList;
  items: ListItem[];
  members: User[];
  onPress: () => void;
  onMore: () => void;
}> = ({ list, items, members, onPress, onMore }) => {
  const { percent } = listProgress(items);
  const shared = list.isShared !== false;
  return (
    <Card onPress={onPress} onLongPress={onMore} className="gap-3">
      <View style={tw`flex-row items-center gap-3`}>
        <IconTile icon={list.icon} color={list.color} />
        <View style={tw`flex-1 min-w-0`}>
          <Text variant="headline" numberOfLines={1}>
            {list.title}
          </Text>
          <Text variant="footnote" tone="muted" numberOfLines={1}>
            {listSubtitle(list, items)}
          </Text>
        </View>
        <Btn onPress={onMore} accessibilityLabel="Diğer işlemler" className="w-11 h-11 -mr-2 items-center justify-center rounded-full">
          <Ellipsis {...ic('w-5 h-5 text-slate-400')} />
        </Btn>
      </View>
      {list.type !== 'NOTE' && items.length > 0 ? <ProgressBar value={percent} color={list.color} height={6} /> : null}
      <View style={tw`flex-row items-center justify-between`}>
        <AvatarStack members={members} />
        <Badge label={shared ? 'Aile' : 'Kişisel'} tone={shared ? 'brand' : 'neutral'} />
      </View>
    </Card>
  );
};
