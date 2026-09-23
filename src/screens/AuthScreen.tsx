import React, { useState } from 'react';
import { Alert, Button, SafeAreaView, Text, TextInput, View } from 'react-native';

import { strings } from '../strings/tr';
import { styles } from './styles';

type Props = {
  onLogin: (username: string, password: string, name?: string) => Promise<void>;
};

export function AuthScreen({ onLogin }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!username.trim() || password.length < 6 || (isRegistering && !name.trim())) {
      Alert.alert(strings.auth.missingTitle, strings.auth.missingLogin);
      return;
    }
    try {
      await onLogin(username, password, isRegistering ? name : undefined);
    } catch (error) {
      Alert.alert(
        strings.common.error,
        error instanceof Error ? error.message : strings.common.error,
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{strings.app.name}</Text>
        <Text style={styles.lead}>{strings.auth.lead}</Text>
        {isRegistering && (
          <TextInput
            placeholder={strings.auth.namePlaceholder}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        )}
        <TextInput
          placeholder={strings.auth.usernamePlaceholder}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder={strings.auth.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <Button
          title={isRegistering ? strings.auth.register : strings.auth.login}
          onPress={() => void submit()}
        />
        <Button
          title={isRegistering ? strings.auth.haveAccount : strings.auth.newAccount}
          onPress={() => setIsRegistering((value) => !value)}
        />
      </View>
    </SafeAreaView>
  );
}
