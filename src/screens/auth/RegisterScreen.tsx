import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AtSign, Lock, User as UserIcon } from 'lucide-react-native';

import { Button, ColorPicker, LIST_COLORS, StackScreen, Text, TextField, UserAvatar, type TextInputHandle } from '../../design';
import { DEFAULT_AVATAR } from '../../data/emojis';
import { tw } from '../../lib/tw';
import type { AuthScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { AvatarPicker } from './AvatarPicker';

const USERNAME_RE = /^[a-z0-9_.-]+$/;

function validate(name: string, username: string, password: string, confirm: string) {
  const uname = username.trim().replace(/^@/, '');
  return {
    name: name.trim().length > 0 && name.trim().length < 2 ? 'İsim en az 2 karakter olmalı.' : undefined,
    username:
      uname.length === 0
        ? undefined
        : uname.length < 3
          ? 'Kullanıcı adı en az 3 karakter olmalı.'
          : !USERNAME_RE.test(uname)
            ? 'Sadece küçük harf, rakam, "_", "." ve "-" kullanılabilir.'
            : undefined,
    password: password.length > 0 && password.length < 6 ? 'Şifre en az 6 karakter olmalı.' : undefined,
    confirm: confirm.length > 0 && confirm !== password ? 'Şifreler eşleşmiyor.' : undefined,
  };
}

export const RegisterScreen: React.FC<AuthScreenProps<'Register'>> = ({ navigation }) => {
  const register = useAppStore((s) => s.register);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [color, setColor] = useState(LIST_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);

  const errors = validate(name, username, password, confirm);
  const complete = name.trim() && username.trim() && password && confirm;
  const canSubmit = !!complete && !Object.values(errors).some(Boolean) && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await register({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/^@/, ''),
        password,
        confirmPassword: confirm,
        avatar,
        color,
      });
      // On success the root navigator switches to the app (isAuthenticated).
      if (!res.success) setError(res.error ?? 'Hesap oluşturulamadı.');
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StackScreen
      title="Hesap Oluştur"
      contentClassName="pt-2 gap-6"
      footer={<Button title="Hesap Oluştur" onPress={submit} loading={loading} disabled={!canSubmit} fullWidth />}
    >
      <View style={tw`items-center gap-2`}>
        <UserAvatar avatar={avatar} name={name || 'Yeni kullanıcı'} color={color} size="xl" />
        <Text variant="headline">{name.trim() || 'Adın'}</Text>
        <Text variant="footnote" tone="muted">
          @{username.trim().toLowerCase().replace(/^@/, '') || 'kullanici_adi'}
        </Text>
      </View>

      <View style={tw`gap-4`}>
        <TextField
          label="Ad Soyad"
          icon={UserIcon}
          value={name}
          onChangeText={setName}
          placeholder="Örn. Ayşe Yılmaz"
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current?.focus()}
          error={errors.name}
        />
        <TextField
          inputRef={usernameRef}
          label="Kullanıcı adı"
          icon={AtSign}
          value={username}
          onChangeText={(t) => setUsername(t.toLowerCase())}
          placeholder="ayse_yilmaz"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username-new"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.username}
          hint="Aile üyelerin seni bu adla davet eder."
        />
        <TextField
          inputRef={passwordRef}
          label="Şifre"
          icon={Lock}
          value={password}
          onChangeText={setPassword}
          placeholder="En az 6 karakter"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.password}
        />
        <TextField
          inputRef={confirmRef}
          label="Şifre (tekrar)"
          icon={Lock}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Şifreni tekrar yaz"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={errors.confirm}
        />
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Avatar
        </Text>
        <AvatarPicker value={avatar} onChange={setAvatar} color={color} />
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Renk
        </Text>
        <ColorPicker colors={LIST_COLORS} value={color} onChange={setColor} />
      </View>

      {error ? (
        <View style={tw`bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3`}>
          <Text variant="subhead" tone="danger">
            {error}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => navigation.replace('Login')}
        accessibilityRole="button"
        hitSlop={8}
        style={tw`self-center flex-row items-center min-h-[44px]`}
      >
        <Text variant="callout" tone="muted">
          Zaten hesabın var mı?{' '}
        </Text>
        <Text variant="callout" tone="brand" weight="semibold">
          Giriş Yap
        </Text>
      </Pressable>
    </StackScreen>
  );
};
