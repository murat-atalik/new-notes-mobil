import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { FormScreen, showToast, Text, TextField, type TextInputHandle } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

export const ChangePasswordScreen: React.FC<RootScreenProps<'ChangePassword'>> = ({ navigation }) => {
  const changePassword = useAppStore((s) => s.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);

  const nextError = next.length > 0 && next.length < 6 ? 'Yeni şifre en az 6 karakter olmalı.' : undefined;
  const confirmError = confirm.length > 0 && confirm !== next ? 'Şifreler eşleşmiyor.' : undefined;
  const canSubmit = current.length > 0 && next.length >= 6 && confirm === next && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await changePassword({ oldPassword: current, newPassword: next, confirmPassword: confirm });
      if (res.success) {
        showToast('Şifren güncellendi');
        navigation.goBack();
      } else {
        setError(res.error ?? 'Şifre değiştirilemedi.');
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen title="Şifre Değiştir" onSubmit={submit} submitDisabled={!canSubmit} submitting={submitting}>
      <TextField
        label="Mevcut şifre"
        icon={Lock}
        value={current}
        onChangeText={(t) => {
          setCurrent(t);
          setError(null);
        }}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        autoComplete="password"
        returnKeyType="next"
        onSubmitEditing={() => nextRef.current?.focus()}
        autoFocus
      />
      <TextField
        inputRef={nextRef}
        label="Yeni şifre"
        icon={Lock}
        value={next}
        onChangeText={setNext}
        placeholder="En az 6 karakter"
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="password-new"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={nextError}
      />
      <TextField
        inputRef={confirmRef}
        label="Yeni şifre (tekrar)"
        icon={Lock}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={confirmError}
      />
      {error ? (
        <View style={tw`bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3`}>
          <Text variant="subhead" tone="danger">
            {error}
          </Text>
        </View>
      ) : null}
    </FormScreen>
  );
};
