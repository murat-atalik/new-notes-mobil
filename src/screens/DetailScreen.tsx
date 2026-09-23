import React from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { deleteItem, saveItem, updateItem } from '../services/apiClient';
import type { RootStackParamList } from '../../App';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Item } from '../types';
import { strings } from '../strings/tr';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ route }: Props) {
  const { list } = route.params;
  const [items, setItems] = React.useState(list.items);
  const [title, setTitle] = React.useState('');

  const addItem = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    const item: Item = {
      id: `item-${Date.now()}`,
      listId: list.id,
      title: nextTitle,
      isCompleted: false,
      quantity: 1,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await saveItem(item);
      setItems((current) => [...current, saved]);
      setTitle('');
    } catch (error) {
      Alert.alert(
        strings.common.error,
        error instanceof Error ? error.message : strings.common.error,
      );
    }
  };

  const toggleItem = async (item: Item) => {
    const updated = { ...item, isCompleted: !item.isCompleted };
    try {
      await updateItem(updated);
      setItems((current) =>
        current.map((candidate) => (candidate.id === item.id ? updated : candidate)),
      );
    } catch (error) {
      Alert.alert(
        strings.common.error,
        error instanceof Error ? error.message : strings.common.error,
      );
    }
  };

  const removeItem = async (item: Item) => {
    try {
      await deleteItem(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (error) {
      Alert.alert(
        strings.common.error,
        error instanceof Error ? error.message : strings.common.error,
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeScreen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <Text style={styles.title}>{list.title}</Text>
            <Text style={styles.lead}>{list.description || strings.detail.emptyLead}</Text>
            <View style={styles.card}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={strings.detail.titlePlaceholder[list.type]}
                style={styles.input}
              />
              <Button title={strings.detail.add} onPress={() => void addItem()} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.subtitle}>{strings.detail.emptyTitle}</Text>
            <Text style={styles.lead}>{strings.detail.emptyLead}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Button
              title={item.isCompleted ? '✓' : '○'}
              small
              variant={item.isCompleted ? 'primary' : 'secondary'}
              onPress={() => void toggleItem(item)}
            />
            <Text style={[styles.itemTitle, item.isCompleted && styles.itemCompleted]}>
              {item.title}
            </Text>
            <Button
              title={strings.common.delete}
              variant="danger"
              small
              onPress={() => void removeItem(item)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
