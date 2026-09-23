import React, { useState } from 'react';
import { View } from 'react-native';
import { KeyRound } from 'lucide-react-native';

import { Card, FormScreen, IconTile, palette, showToast, Text, TextField } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

export const FamilyJoinScreen: React.FC<RootScreenProps<'FamilyJoin'>> = ({ navigation }) => {
  const joinFamilyByCode = useAppStore((s) => s.joinFamilyByCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const clean = code.trim();

  const submit = async () => {
    if (!clean || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await joinFamilyByCode(clean);
      if (result.success) {
        showToast(result.message);
        navigation.goBack();
      } else {
        setError(result.message);
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen title="Aileye Katıl" onSubmit={submit} submitLabel="Katıl" submitDisabled={!clean} submitting={submitting}>
      <Card className="flex-row items-start gap-3">
        <IconTile icon={KeyRound} color={palette.info} />
        <View style={tw`flex-1 gap-1`}>
          <Text variant="headline">Aile kodunu gir</Text>
          <Text variant="subhead" tone="muted">
            Aile reisinden aile kodunu iste. Katıldığında ailenin ortak listeleri, harcamaları ve birikimleri seninle paylaşılır.
            Kişisel listelerin korunur.
          </Text>
        </View>
      </Card>
      <TextField
        label="Aile Kodu"
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          if (error) setError(undefined);
        }}
        placeholder="AIL-XXX0000"
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        returnKeyType="join"
        onSubmitEditing={submit}
        error={error}
        style={tw`text-[22px] font-bold tracking-widest`}
      />
    </FormScreen>
  );
};
