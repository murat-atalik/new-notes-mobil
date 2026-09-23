import React, { useState } from 'react';
import { View } from 'react-native';

import { ColorPicker, FormScreen, LIST_COLORS, showToast, Text, TextField, UserAvatar } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { AvatarPicker } from '../auth/AvatarPicker';

export const ProfileScreen: React.FC<RootScreenProps<'Profile'>> = ({ navigation }) => {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [color, setColor] = useState(currentUser.color || LIST_COLORS[0]);

  const trimmed = name.trim();
  const nameError = trimmed.length > 0 && trimmed.length < 2 ? 'İsim en az 2 karakter olmalı.' : undefined;
  const colors = LIST_COLORS.some((c) => c.toLowerCase() === color.toLowerCase()) ? LIST_COLORS : [color, ...LIST_COLORS];

  const save = () => {
    updateUserProfile({ name: trimmed, avatar, color });
    navigation.goBack();
    showToast('Profil güncellendi');
  };

  return (
    <FormScreen title="Profil" onSubmit={save} submitDisabled={trimmed.length < 2}>
      <View style={tw`items-center gap-2 pt-2`}>
        <UserAvatar avatar={avatar} name={trimmed} color={color} size="xl" />
        <Text variant="title2">{trimmed || 'Adın'}</Text>
        <Text variant="subhead" tone="muted">
          @{currentUser.username}
        </Text>
      </View>

      <TextField
        label="Ad Soyad"
        value={name}
        onChangeText={setName}
        placeholder="Adın"
        autoCapitalize="words"
        textContentType="name"
        returnKeyType="done"
        error={nameError}
      />

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Avatar
        </Text>
        <View style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-3`}>
          <AvatarPicker value={avatar} onChange={setAvatar} color={color} layout="grid" />
        </View>
      </View>

      <View style={tw`gap-2`}>
        <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
          Renk
        </Text>
        <ColorPicker colors={colors} value={color} onChange={setColor} />
      </View>
    </FormScreen>
  );
};
