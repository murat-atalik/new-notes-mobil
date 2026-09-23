import React from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';

import type { RootStackParamList } from '../../App';
import type { AppList, ListType } from '../types';
import { strings } from '../strings/tr';
import { styles } from './styles';

type Props = {
  lists: AppList[];
  onDelete: (id: string) => Promise<void>;
  onCreate: (title: string, type: ListType, isShared: boolean) => Promise<void>;
};

export function ListsScreen({ lists, onDelete, onCreate }: Props) {
  const navigation =
    useNavigation<
      import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>
    >();
  const [title, setTitle] = React.useState('');
  const [search, setSearch] = React.useState('');
  const visibleLists = lists.filter((list) =>
    list.title.toLocaleLowerCase('tr').includes(search.trim().toLocaleLowerCase('tr')),
  );
  const submit = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    void onCreate(nextTitle, 'SHOPPING', true);
    setTitle('');
  };
  return (
    <FlatList
      data={visibleLists}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <Text style={styles.lead}>
          {lists.length === 0 ? strings.lists.emptyServer : strings.lists.emptySearch}
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>
                {item.type === 'SHOPPING' ? '🛒' : item.type === 'TODO' ? '✓' : '✎'}
              </Text>
            </View>
            <View style={styles.cardHeadingText}>
              <Button
                variant="secondary"
                title={item.title}
                onPress={() => navigation.navigate('Detail', { list: item })}
              />
              <Text style={styles.subtitle}>{item.title}</Text>
            </View>
          </View>
          <Text style={styles.lead}>{item.description}</Text>
          <Button
            title={strings.lists.deleteButton}
            variant="danger"
            small
            onPress={() => void onDelete(item.id)}
          />
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.headerStack}>
          <Text style={styles.title}>{strings.lists.title}</Text>
          <Text style={styles.lead}>{strings.lists.lead}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={strings.lists.searchPlaceholder}
            style={styles.input}
          />
          <View style={styles.card}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={strings.lists.createPlaceholder}
              style={styles.input}
            />
            <Button title={strings.lists.createSubmit} onPress={submit} />
          </View>
        </View>
      }
    />
  );
}
