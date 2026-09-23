import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Lock, User as UserIcon } from 'lucide-react-native';

import { Button, StackScreen, Text, TextField, type TextInputHandle } from '../../design';
import { tw } from '../../lib/tw';
import type { AuthScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

export const LoginScreen: React.FC<AuthScreenProps<'Login'>> = ({ navigation }) => {
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputHandle>(null);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login({ username: username.trim().toLowerCase().replace(/^@/, ''), password, rememberMe: true });
      // On success the root navigator switches to the app (isAuthenticated).
      if (!res.success) setError(res.error ?? 'Giriş yapılamadı. Bilgilerini kontrol et.');
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StackScreen contentClassName="pt-4 gap-6">
      <View style={tw`gap-1.5 px-1`}>
        <Text variant="largeTitle">Tekrar hoş geldin</Text>
        <Text variant="callout" tone="muted">
          Listelerine ve bütçene kaldığın yerden devam et.
        </Text>
      </View>

      <View style={tw`gap-4`}>
        <TextField
          label="Kullanıcı adı"
          icon={UserIcon}
          value={username}
          onChangeText={(t) => {
            setUsername(t);
            setError(null);
          }}
          placeholder="kullanici_adi"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          autoFocus
        />
        <TextField
          inputRef={passwordRef}
          label="Şifre"
          icon={Lock}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          placeholder="••••••"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error ? (
          <View style={tw`bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3`}>
            <Text variant="subhead" tone="danger">
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <Button title="Giriş Yap" onPress={submit} loading={loading} disabled={!canSubmit} fullWidth />

      <Pressable
        onPress={() => navigation.replace('Register')}
        accessibilityRole="button"
        hitSlop={8}
        style={tw`self-center flex-row items-center min-h-[44px]`}
      >
        <Text variant="callout" tone="muted">
          Hesabın yok mu?{' '}
        </Text>
        <Text variant="callout" tone="brand" weight="semibold">
          Hesap Oluştur
        </Text>
      </Pressable>
    </StackScreen>
  );
};
