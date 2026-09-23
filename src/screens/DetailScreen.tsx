import React from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../App';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ route }: Props) {
  const { list } = route.params;
  return (
    <SafeAreaView style={styles.safeScreen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{list.title}</Text>
        {list.items.map((item) => (
          <Text key={item.id} style={styles.subtitle}>
            {item.title}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
