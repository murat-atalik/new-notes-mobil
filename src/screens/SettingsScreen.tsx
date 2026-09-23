import React from 'react';
import { Button, ScrollView, Switch, Text } from 'react-native';

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
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{strings.settings.title}</Text>
      <Text style={styles.lead}>
        {user.name} · @{user.username}
      </Text>
      <Text style={styles.subtitle}>{strings.common.darkTheme}</Text>
      <Switch value={dark} onValueChange={onDarkChange} />
      <Button title={strings.common.logout} onPress={onLogout} />
    </ScrollView>
  );
}
