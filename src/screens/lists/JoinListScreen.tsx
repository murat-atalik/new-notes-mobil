import React, { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { Ticket } from 'lucide-react-native';

import { FieldLabel, FormScreen, palette, showToast, Text } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

const CODE_MAX = 8;

export const JoinListScreen: React.FC<RootScreenProps<'JoinList'>> = ({ navigation }) => {
  const joinListWithCode = useAppStore((s) => s.joinListWithCode);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const clean = code.trim();
  const valid = clean.length >= 4;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await joinListWithCode(clean);
      if (res.success && res.listId) {
        showToast(res.message || 'Listeye katıldın');
        navigation.replace('ListDetail', { listId: res.listId });
      } else {
        setError(res.message || 'Bu koda ait bir liste bulunamadı.');
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen title="Listeye Katıl" submitLabel="Katıl" onSubmit={submit} submitDisabled={!valid} submitting={submitting}>
      <View style={tw`items-center gap-3 pt-4`}>
        <View style={tw`w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 items-center justify-center`}>
          <Ticket size={30} color={palette.brand} />
        </View>
        <Text variant="title2" className="text-center">
          Davet kodunu gir
        </Text>
        <Text variant="callout" tone="muted" className="text-center px-4">
          Liste sahibinden aldığın kodu yaz; liste hemen Listeler sekmende görünür ve birlikte düzenleyebilirsiniz.
        </Text>
      </View>

      <FieldLabel error={error} hint="Kod büyük/küçük harf duyarlı değildir.">
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
            if (error) setError(undefined);
          }}
          placeholder="ABC123"
          placeholderTextColor={palette.slate400}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          autoFocus
          maxLength={CODE_MAX}
          returnKeyType="join"
          onSubmitEditing={submit}
          accessibilityLabel="Davet kodu"
          style={[
            tw.style(
              'h-[72px] rounded-2xl border bg-white dark:bg-slate-900 text-center text-[30px] font-extrabold text-slate-900 dark:text-white',
              error ? 'border-rose-400 dark:border-rose-700' : 'border-slate-200 dark:border-slate-800',
            ),
            { letterSpacing: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
          ]}
        />
      </FieldLabel>
    </FormScreen>
  );
};
