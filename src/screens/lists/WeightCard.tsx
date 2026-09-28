import React from 'react';
import { View } from 'react-native';
import { Ellipsis, TrendingDown, TrendingUp } from 'lucide-react-native';

import { Badge, Btn, Card, IconTile, Text } from '../../design';
import { weightSummary } from '../../logic/selectors';
import { ic, tw } from '../../lib/tw';
import type { AppList, ListItem, User } from '../../types';
import { AvatarStack } from './ListRow';
import { WEIGHT_META } from './weightMeta';

const numStr = (n: number) => String(n).replace('.', ',');

/** Weight-tracking (Kilo Takibi) row for the Listeler tab. */
export const WeightCard: React.FC<{
  list: AppList;
  items: ListItem[];
  members: User[];
  onPress: () => void;
  onMore: () => void;
}> = ({ list, items, members, onPress, onMore }) => {
  const { count, latest, totalDiff } = weightSummary(items);
  const shared = list.isShared !== false;
  const color = list.color || WEIGHT_META.color;
  const subtitle = count === 0 ? 'Henüz ölçüm yok' : count === 1 ? `${numStr(latest!)} kg` : `${numStr(latest!)} kg · ${count} ölçüm`;

  return (
    <Card onPress={onPress} onLongPress={onMore} className="gap-3" style={{ backgroundColor: `${color}14`, borderColor: `${color}33` }}>
      <View style={tw`flex-row items-center gap-3`}>
        <IconTile icon={list.icon || WEIGHT_META.defaultIcon} color={color} />
        <View style={tw`flex-1 min-w-0`}>
          <Text variant="headline" numberOfLines={1}>
            {list.title}
          </Text>
          <Text variant="footnote" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {totalDiff != null ? (
          <View style={tw`flex-row items-center gap-1`}>
            {totalDiff < 0 ? <TrendingDown size={14} color="#10b981" /> : totalDiff > 0 ? <TrendingUp size={14} color="#e11d48" /> : null}
            <Text variant="footnote" weight="bold" tone={totalDiff < 0 ? 'brand' : totalDiff > 0 ? 'danger' : 'muted'}>
              {`${totalDiff > 0 ? '+' : ''}${numStr(totalDiff)} kg`}
            </Text>
          </View>
        ) : null}
        <Btn onPress={onMore} accessibilityLabel="Diğer işlemler" className="w-11 h-11 -mr-2 items-center justify-center rounded-full">
          <Ellipsis {...ic('w-5 h-5 text-slate-400')} />
        </Btn>
      </View>
      <View style={tw`flex-row items-center justify-between`}>
        <AvatarStack members={members} />
        <Badge label={shared ? 'Aile' : 'Kişisel'} tone={shared ? 'brand' : 'neutral'} />
      </View>
    </Card>
  );
};
