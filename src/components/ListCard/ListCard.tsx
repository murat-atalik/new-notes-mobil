import React, { memo } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../Button';
import type { AppList } from '../../types';
import { strings } from '../../strings/tr';
import { styles } from './styles';

export type ListCardProps = {
  list: AppList;
  onOpen: () => void;
  onDelete: () => void;
};

export const ListCard = memo(function ListCard({ list, onOpen, onDelete }: ListCardProps) {
  const completed = list.items.filter((item) => item.isCompleted).length;
  const icon = list.type === 'SHOPPING' ? '🛒' : list.type === 'TODO' ? '✓' : '✎';
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>{list.title}</Text>
          <Text style={styles.meta}>{strings.lists.progress(completed, list.items.length)}</Text>
        </View>
      </View>
      {!!list.description && <Text style={styles.description}>{list.description}</Text>}
      <View style={styles.actions}>
        <Button title={strings.lists.open} variant="secondary" onPress={onOpen} />
        <Button title={strings.common.delete} variant="danger" small onPress={onDelete} />
      </View>
    </View>
  );
});
