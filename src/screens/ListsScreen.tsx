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
  const submit = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    void onCreate(nextTitle, 'SHOPPING', true);
    setTitle('');
  };
  return (
    <FlatList
      data={lists}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListEmptyComponent={<Text style={styles.lead}>{strings.lists.emptyServer}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Button
            variant="secondary"
            title={item.title}
            onPress={() => navigation.navigate('Detail', { list: item })}
          />
          <Text style={styles.subtitle}>{item.title}</Text>
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
        <View style={styles.card}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={strings.lists.createPlaceholder}
            style={styles.input}
          />
          <Button title={strings.lists.createSubmit} onPress={submit} />
        </View>
      }
    />
  );
}
