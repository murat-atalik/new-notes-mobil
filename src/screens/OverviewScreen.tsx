import React from 'react';
import { ScrollView, Text } from 'react-native';

import { strings } from '../strings/tr';
import { styles } from './styles';

export function OverviewScreen({ tab }: { tab: 'finance' | 'analytics' }) {
  const data = strings.overview[tab];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.lead}>{data.lead}</Text>
      <Text style={styles.subtitle}>{data.sectionTitle}</Text>
      <Text style={styles.lead}>{data.sectionBody}</Text>
    </ScrollView>
  );
}
