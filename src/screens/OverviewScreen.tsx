import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '../strings/tr';
import { styles } from './styles';

export function OverviewScreen({ tab }: { tab: 'finance' | 'analytics' }) {
  const data = strings.overview[tab];
  return (
    <SafeAreaView style={styles.safeScreen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.lead}>{data.lead}</Text>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{data.sectionTitle.toLocaleUpperCase('tr')}</Text>
          <Text style={styles.lead}>{data.sectionBody}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
