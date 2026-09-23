import React, { useState } from 'react';
import { View } from 'react-native';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import {
  changePasswordSchema,
  handleZodValidation,
  type BilingualError,
  type FieldErrors,
} from '../lib/validations';
import { useAppStore } from '../store/useAppStore';
import { Btn, Input, Overlay, Panel, Text } from './ui';

interface ChangePasswordModalProps {
  onClose?: () => void;
}

const inputClass = (state: 'error' | 'match' | 'default') =>
  `w-full h-12 pl-11 pr-12 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-[16px] font-medium ${
    state === 'error'
      ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30'
      : state === 'match'
        ? 'border-emerald-300 dark:border-emerald-700'
        : 'border-slate-200 dark:border-slate-700'
  }`;

const LeftIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View pointerEvents="none" style={tw`absolute top-0 bottom-0 left-0 pl-4 justify-center z-10`}>
    {children}
  </View>
);

const EyeButton: React.FC<{ shown: boolean; onPress: () => void }> = ({ shown, onPress }) => (
  <Btn
    onPress={onPress}
    accessibilityLabel={shown ? 'Şifreyi gizle' : 'Şifreyi göster'}
    className="absolute top-0 bottom-0 right-1 w-11 items-center justify-center"
  >
    {shown ? <EyeOff {...ic('w-5 h-5 text-slate-400')} /> : <Eye {...ic('w-5 h-5 text-slate-400')} />}
  </Btn>
);

const FieldError: React.FC<{ error?: BilingualError }> = ({ error }) =>
  error ? (
    <View style={tw`px-3 py-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900 rounded-xl`}>
      <Text className="text-[12px] font-semibold text-rose-700 dark:text-rose-300">{error.tr || error.en}</Text>
    </View>
  ) : null;

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps = {}) {
  const { currentUser, changePassword, changePasswordModalOpen, setChangePasswordModalOpen } = useAppStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<BilingualError | null>(null);
  const [success, setSuccess] = useState(false);

  if (!changePasswordModalOpen && !onClose) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setChangePasswordModalOpen(false);
    }
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  // Password strength calculation
  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200', width: '0%' };
    let s = 0;
    if (pass.length >= 6) s += 1;
    if (pass.length >= 8) s += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;

    if (s <= 1) return { score: 1, text: 'Zayıf', color: 'bg-rose-500', width: '25%' };
    if (s === 2) return { score: 2, text: 'Orta', color: 'bg-amber-500', width: '50%' };
    if (s === 3) return { score: 3, text: 'İyi', color: 'bg-emerald-500', width: '75%' };
    return { score: 4, text: 'Güçlü', color: 'bg-emerald-600', width: '100%' };
  };

  const strength = getStrength(newPassword);
  const isMatch = !!newPassword && !!confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async () => {
    setFieldErrors({});
    setGlobalError(null);

    // Validate with Zod
    const val = handleZodValidation(changePasswordSchema, {
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!val.success) {
      if (val.fieldErrors) setFieldErrors(val.fieldErrors);
      if (val.error) setGlobalError(val.error);
      return;
    }

    setLoading(true);
    const result = await changePassword({
      oldPassword,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1400);
    } else {
      if (result.bilingualError) {
        setGlobalError(result.bilingualError);
      } else {
        setGlobalError({
          tr: result.error || 'Şifre güncellenirken bir hata oluştu.',
          en: 'An error occurred while updating your password.',
        });
      }
    }
  };

  return (
    <Overlay onClose={handleClose}>
      <Panel className="w-full max-w-md self-center bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header with badge */}
        <View style={tw`px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-800/40`}>
          <View style={tw`flex-row items-center gap-3 flex-1`}>
            <View
              style={tw`w-10 h-10 rounded-2xl bg-amber-500/10 items-center justify-center border border-amber-500/20`}
            >
              <KeyRound {...ic('w-5 h-5 text-amber-600')} />
            </View>
            <View style={tw`flex-1`}>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Şifre Değiştir</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                Kullanıcı:{' '}
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">@{currentUser?.username || 'kullanici'}</Text>
              </Text>
            </View>
          </View>
          <Btn
            onPress={handleClose}
            accessibilityLabel="Kapat"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
          </Btn>
        </View>

        {/* Content */}
        <View style={tw`p-5`}>
          {success ? (
            <View style={tw`items-center py-6 gap-3`}>
              <View style={tw`w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center`}>
                <CheckCircle2 {...ic('w-8 h-8 text-emerald-600')} />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white text-center">Şifreniz Başarıyla Değiştirildi</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-center">
                Yeni şifreniz kaydedildi. Bir sonraki girişinizde bu şifreyi kullanabilirsiniz.
              </Text>
            </View>
          ) : (
            <View style={tw`gap-4`}>
              {/* Global Error Banner */}
              {globalError && (
                <View style={tw`p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex-row items-start gap-2.5`}>
                  <View style={tw`mt-0.5`}>
                    <AlertCircle {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
                  </View>
                  <Text className="flex-1 text-xs font-semibold text-rose-800 dark:text-rose-200">{globalError.tr || globalError.en}</Text>
                </View>
              )}

              {/* 1. Eski Şifre */}
              <View style={tw`gap-1.5`}>
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Mevcut Şifre</Text>
                <View>
                  <LeftIcon>
                    <Lock {...ic('w-4 h-4 text-slate-400')} />
                  </LeftIcon>
                  <Input
                    value={oldPassword}
                    onChangeText={(text) => {
                      setOldPassword(text);
                      clearFieldError('oldPassword');
                    }}
                    placeholder="Mevcut şifrenizi girin"
                    secureTextEntry={!showOld}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="next"
                    className={inputClass(fieldErrors.oldPassword ? 'error' : 'default')}
                  />
                  <EyeButton shown={showOld} onPress={() => setShowOld(!showOld)} />
                </View>
                <FieldError error={fieldErrors.oldPassword} />
              </View>

              {/* 2. Yeni Şifre */}
              <View style={tw`gap-1.5`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Yeni Şifre</Text>
                  {newPassword ? (
                    <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Güç: <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{strength.text}</Text>
                    </Text>
                  ) : null}
                </View>
                <View>
                  <LeftIcon>
                    <KeyRound {...ic('w-4 h-4 text-slate-400')} />
                  </LeftIcon>
                  <Input
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      clearFieldError('newPassword');
                    }}
                    placeholder="En az 6 karakter yeni şifre"
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    className={inputClass(fieldErrors.newPassword ? 'error' : 'default')}
                  />
                  <EyeButton shown={showNew} onPress={() => setShowNew(!showNew)} />
                </View>

                <FieldError error={fieldErrors.newPassword} />

                {/* Strength bar */}
                {newPassword ? (
                  <View style={tw`w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1`}>
                    <View style={[tw.style('h-full', strength.color), { width: strength.width as `${number}%` }]} />
                  </View>
                ) : null}
              </View>

              {/* 3. Yeni Şifre Tekrarı */}
              <View style={tw`gap-1.5`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Yeni Şifre Tekrarı</Text>
                  {confirmPassword ? (
                    <View style={tw`flex-row items-center gap-1`}>
                      {isMatch ? (
                        <>
                          <Check {...ic('w-3 h-3 text-emerald-600 dark:text-emerald-400')} />
                          <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Eşleşti</Text>
                        </>
                      ) : (
                        <Text className="text-[11px] font-semibold text-rose-500">Eşleşmiyor</Text>
                      )}
                    </View>
                  ) : null}
                </View>
                <View>
                  <LeftIcon>
                    <ShieldCheck {...ic('w-4 h-4 text-slate-400')} />
                  </LeftIcon>
                  <Input
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearFieldError('confirmPassword');
                    }}
                    placeholder="Yeni şifrenizi tekrar yazın"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    className={inputClass(
                      fieldErrors.confirmPassword ? 'error' : confirmPassword && isMatch ? 'match' : 'default',
                    )}
                  />
                  <EyeButton shown={showConfirm} onPress={() => setShowConfirm(!showConfirm)} />
                </View>
                <FieldError error={fieldErrors.confirmPassword} />
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row items-center gap-2.5 pt-2`}>
                <Btn
                  onPress={handleClose}
                  className="flex-1 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <Text className="text-slate-700 dark:text-slate-200 text-[15px] font-bold">İptal</Text>
                </Btn>
                <Btn
                  onPress={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-12 px-4 rounded-2xl bg-amber-600 shadow-sm flex-row items-center justify-center gap-2"
                >
                  <Text className="text-white text-[15px] font-bold">{loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}</Text>
                </Btn>
              </View>
            </View>
          )}
        </View>
      </Panel>
    </Overlay>
  );
}
