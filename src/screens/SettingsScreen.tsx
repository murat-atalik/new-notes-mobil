import React from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

import type { User } from '../types';
import { strings } from '../strings/tr';
import { styles } from './styles';

type Props = {
  user: User;
  dark: boolean;
  onDarkChange: (value: boolean) => void;
  onLogout: () => void;
};

export function SettingsScreen({ user, dark, onDarkChange, onLogout }: Props) {
  return (
    <SafeAreaView style={styles.safeScreen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{strings.settings.title}</Text>
        <Text style={styles.lead}>
          {user.name} · @{user.username}
        </Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>{strings.common.darkTheme}</Text>
          <Switch value={dark} onValueChange={onDarkChange} />
        </View>
        <Button title={strings.common.logout} variant="danger" onPress={onLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}
