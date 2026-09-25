import React from 'react';
import { Image, View } from 'react-native';
import { Ellipsis } from 'lucide-react-native';

import { Badge, Btn, Card, IconTile, ProgressBar, Text } from '../../design';
import { formatMoney } from '../../logic/format';
import { roomProgress } from '../../logic/selectors';
import { ic, tw } from '../../lib/tw';
import type { AppList, ListItem, User } from '../../types';
import { AvatarStack } from './ListRow';

/** Room (Oda) row for the Listeler tab — a cover photo instead of an icon tile. */
export const RoomCard: React.FC<{
  room: AppList;
  items: ListItem[];
  members: User[];
  onPress: () => void;
  onMore: () => void;
}> = ({ room, items, members, onPress, onMore }) => {
  const { percent, boughtValue, targetValue, totalCount } = roomProgress(items);
  const shared = room.isShared !== false;
  const subtitle = totalCount
    ? targetValue > 0
      ? `${totalCount} ürün · ${formatMoney(boughtValue)} / ${formatMoney(targetValue)}`
      : `${totalCount} ürün`
    : 'Henüz ürün yok';

  return (
    <Card onPress={onPress} onLongPress={onMore} className="gap-3">
      <View style={tw`flex-row items-center gap-3`}>
        {room.coverPhoto ? (
          <Image source={{ uri: room.coverPhoto }} style={tw`w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800`} />
        ) : (
          <IconTile icon={room.icon} color={room.color} size="lg" />
        )}
        <View style={tw`flex-1 min-w-0`}>
          <Text variant="headline" numberOfLines={1}>
            {room.title}
          </Text>
          <Text variant="footnote" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Btn onPress={onMore} accessibilityLabel="Diğer işlemler" className="w-11 h-11 -mr-2 items-center justify-center rounded-full">
          <Ellipsis {...ic('w-5 h-5 text-slate-400')} />
        </Btn>
      </View>
      {totalCount > 0 ? <ProgressBar value={percent} color={room.color} height={6} /> : null}
      <View style={tw`flex-row items-center justify-between`}>
        <AvatarStack members={members} />
        <Badge label={shared ? 'Aile' : 'Kişisel'} tone={shared ? 'brand' : 'neutral'} />
      </View>
    </Card>
  );
};
