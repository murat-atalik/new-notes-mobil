import React, { useState } from 'react';

import { FormScreen, showToast, Text, TextField } from '../../design';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

export const FamilyEditScreen: React.FC<RootScreenProps<'FamilyEdit'>> = ({ navigation, route }) => {
  const { mode } = route.params;
  const user = useAppStore((s) => s.currentUser);
  const createFamily = useAppStore((s) => s.createFamily);
  const updateFamilyName = useAppStore((s) => s.updateFamilyName);
  const [name, setName] = useState(mode === 'rename' ? user.familyName || `${user.name} Ailesi` : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const clean = name.trim();
  const isCreate = mode === 'create';

  const submit = async () => {
    if (!clean || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      if (isCreate) {
        const code = await createFamily(clean);
        showToast(`Aile kodun: ${code}`, 'success', 5000);
      } else {
        await updateFamilyName(clean);
        showToast('Aile adı güncellendi');
      }
      navigation.goBack();
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title={isCreate ? 'Yeni Aile Kur' : 'Aile Adı'}
      onSubmit={submit}
      submitLabel={isCreate ? 'Kur' : 'Kaydet'}
      submitDisabled={!clean}
      submitting={submitting}
    >
      <TextField
        label="Aile adı"
        value={name}
        onChangeText={setName}
        placeholder={`${user.name} Ailesi`}
        autoFocus
        maxLength={50}
        returnKeyType="done"
        onSubmitEditing={submit}
        error={error}
      />
      <Text variant="footnote" tone="muted" className="px-1">
        {isCreate
          ? 'Yeni bir aile kurduğunda aile reisi sen olursun ve yeni bir aile kodu oluşturulur. Mevcut ailenin ortak verileri ekranından kaldırılır.'
          : 'Aile adı tüm üyeler için güncellenir.'}
      </Text>
    </FormScreen>
  );
};
