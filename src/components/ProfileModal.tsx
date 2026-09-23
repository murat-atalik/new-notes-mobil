import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  AlertCircle,
  AtSign,
  Check,
  CheckCircle2,
  Lock,
  Palette,
  ShieldCheck,
  Smile,
  User as UserIcon,
  X,
} from 'lucide-react-native';

import { EMOJI_AVATARS } from '../data/emojis';
import { ic, tw } from '../lib/tw';
import { type BilingualError, type FieldErrors } from '../lib/validations';
import { useAppStore } from '../store/useAppStore';
import { Btn, Grid, Input, Overlay, Panel, Text } from './ui';

const USER_THEME_COLORS = [
  { hex: '#10b981', label: 'Zümrüt Yeşili' },
  { hex: '#3b82f6', label: 'Safir Mavisi' },
  { hex: '#6366f1', label: 'İndigo' },
  { hex: '#8b5cf6', label: 'Ametist Moru' },
  { hex: '#ec4899', label: 'Fuşya Pembesi' },
  { hex: '#f43f5e', label: 'Gül Kurusu' },
  { hex: '#f59e0b', label: 'Kehribar Sarısı' },
  { hex: '#06b6d4', label: 'Turkuaz' },
];

interface ProfileModalProps {
  onClose: () => void;
  onOpenChangePassword?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onOpenChangePassword }) => {
  const { currentUser, updateUserProfile, setChangePasswordModalOpen } = useAppStore();

  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar || '🐟');
  const [color, setColor] = useState(currentUser.color || '#10b981');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<BilingualError | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setFieldErrors({});
    setGlobalError(null);

    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      const err: BilingualError = {
        tr: 'Ad ve soyad en az 2 karakter olmalıdır.',
        en: 'Name must be at least 2 characters.',
      };
      setFieldErrors({ name: err });
      setGlobalError(err);
      return;
    }

    updateUserProfile({
      name: cleanName,
      avatar,
      color,
    });

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleOpenPasswordModal = () => {
    onClose();
    if (onOpenChangePassword) {
      onOpenChangePassword();
    } else {
      setChangePasswordModalOpen(true);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Panel className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full self-center shadow-2xl border border-slate-100 dark:border-slate-800">
        <View style={tw`p-5`}>
          <Btn onPress={onClose} accessibilityLabel="Kapat" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center z-10">
            <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
          </Btn>

          <Text className="text-lg font-bold text-slate-900 dark:text-white leading-tight pr-12">
            Profil & Kişiselleştirme
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4 pr-12">
            Profil adınızı, tema renginizi ve emoji avatarınızı özelleştirin
          </Text>

          {success && (
            <View
              style={tw`p-3 mb-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex-row items-center gap-2`}
            >
              <CheckCircle2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
              <Text className="flex-1 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                Profiliniz ve renk tercihiniz başarıyla güncellendi!
              </Text>
            </View>
          )}

          {globalError && (
            <View
              style={tw`p-3 mb-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex-row items-start gap-2`}
            >
              <View style={tw`mt-0.5`}>
                <AlertCircle {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
              </View>
              <Text className="flex-1 text-xs font-semibold text-rose-800 dark:text-rose-300">
                {globalError.tr || globalError.en}
              </Text>
            </View>
          )}

          <View style={tw`gap-4`}>
            {/* Avatar Emoji & Color Preview */}
            <View style={tw`items-center pb-1`}>
              <View
                style={[
                  tw`items-center justify-center w-20 h-20 rounded-full shadow-sm mb-2 border-4`,
                  { backgroundColor: `${color}18`, borderColor: color },
                ]}
              >
                <Text className="text-4xl">{avatar}</Text>
              </View>

              {/* Color Accent Picker */}
              <View style={tw`mb-3 w-full`}>
                <View style={tw`flex-row items-center justify-center gap-1.5 mb-2`}>
                  <Palette size={14} color={color} />
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Kişisel Tema Renginiz:</Text>
                </View>
                <View style={tw`flex-row items-center justify-center gap-3 flex-wrap py-1.5`}>
                  {USER_THEME_COLORS.map((c) => {
                    const active = color === c.hex;
                    return (
                      <Btn
                        key={c.hex}
                        accessibilityLabel={c.label}
                        onPress={() => setColor(c.hex)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${active ? 'shadow-sm' : 'opacity-75'}`}
                        style={[{ backgroundColor: c.hex }, active ? { transform: [{ scale: 1.1 }] } : null]}
                      >
                        {/* ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 */}
                        {active && (
                          <View
                            pointerEvents="none"
                            style={tw`absolute -inset-1 rounded-full border-2 border-slate-800 dark:border-slate-200`}
                          />
                        )}
                        {active && <Check {...ic('w-4 h-4 text-white')} />}
                      </Btn>
                    );
                  })}
                </View>
              </View>

              <View style={tw`flex-row items-center justify-center gap-1.5 mb-2`}>
                <Smile {...ic('w-3.5 h-3.5 text-slate-600 dark:text-slate-400')} />
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Emoji Avatarınızı Değiştirin:</Text>
              </View>
              <View
                style={tw`w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-44 overflow-hidden`}
              >
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={tw`p-2`}>
                  <Grid cols={6} gap={1.5}>
                    {EMOJI_AVATARS.map((emoji, idx) => {
                      const active = avatar === emoji;
                      return (
                        <Btn
                          key={idx}
                          onPress={() => setAvatar(emoji)}
                          className={`h-11 rounded-xl items-center justify-center ${
                            active
                              ? 'shadow-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700'
                          }`}
                          style={active ? { backgroundColor: color, transform: [{ scale: 1.05 }] } : undefined}
                        >
                          <Text className={`text-lg ${active ? 'text-white' : ''}`}>{emoji}</Text>
                        </Btn>
                      );
                    })}
                  </Grid>
                </ScrollView>
              </View>
            </View>

            <View>
              <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Görünen Adınız</Text>
              <View>
                <View pointerEvents="none" style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                  <UserIcon {...ic('w-4 h-4 text-slate-400')} />
                </View>
                <Input
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (fieldErrors.name) {
                      setFieldErrors((p) => {
                        const next = { ...p };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  className={`w-full h-12 pl-11 pr-4 text-[16px] bg-slate-50 dark:bg-slate-800 border rounded-2xl text-slate-900 dark:text-white font-medium ${
                    fieldErrors.name
                      ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </View>
              {fieldErrors.name && (
                <View
                  style={tw`mt-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/50 rounded-lg`}
                >
                  <Text className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    {fieldErrors.name.tr || fieldErrors.name.en}
                  </Text>
                </View>
              )}
            </View>

            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Kullanıcı Adı</Text>
                <View style={tw`flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800`}>
                  <Lock {...ic('w-2.5 h-2.5 text-slate-500 dark:text-slate-400')} />
                  <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-bold">Sabit / Değiştirilemez</Text>
                </View>
              </View>
              <View>
                <View pointerEvents="none" style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                  <AtSign {...ic('w-4 h-4 text-slate-400')} />
                </View>
                <Input
                  value={currentUser.username}
                  editable={false}
                  selectTextOnFocus
                  className="w-full h-12 pl-11 pr-10 text-[16px] bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-400"
                />
                <View pointerEvents="none" style={tw`absolute right-4 top-0 bottom-0 justify-center`}>
                  <Lock {...ic('w-3.5 h-3.5 text-slate-400')} />
                </View>
              </View>
              <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Kullanıcı adı hesap güvenliği ve ortak liste davetleri için sabittir, değiştirilemez.
              </Text>
            </View>

            {/* Password Change Action inside Profile Modal */}
            <View style={tw`pt-1`}>
              <Btn
                onPress={handleOpenPasswordModal}
                className="w-full min-h-[52px] py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex-row items-center justify-between"
              >
                <View style={tw`flex-row items-center gap-2`}>
                  <ShieldCheck {...ic('w-4 h-4 text-amber-700 dark:text-amber-400')} />
                  <Text className="text-amber-900 dark:text-amber-300 text-xs font-bold">Hesap Şifresini Değiştir</Text>
                </View>
                <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Şifre Yenile →</Text>
              </Btn>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800`}>
              <Btn
                onPress={onClose}
                className="flex-1 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Text className="text-slate-700 dark:text-slate-200 text-[15px] font-bold">İptal</Text>
              </Btn>
              <Btn onPress={handleSubmit} className="flex-1 h-12 px-4 rounded-2xl bg-emerald-600 shadow-sm items-center justify-center">
                <Text className="text-white text-[15px] font-bold">Kaydet</Text>
              </Btn>
            </View>
          </View>
        </View>
      </Panel>
    </Overlay>
  );
};
