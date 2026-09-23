import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';

import { DEFAULT_AVATAR, EMOJI_AVATARS } from '../data/emojis';
import { ic, tw } from '../lib/tw';
import {
  handleZodValidation,
  loginSchema,
  registerSchema,
  type BilingualError,
  type FieldErrors,
} from '../lib/validations';
import { useAppStore } from '../store/useAppStore';
import { Btn, Gradient, Grid, Input, Overlay, Panel, Text } from './ui';

const USER_COLORS = [
  '#10b981',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#06b6d4',
];

// Native-login-style fields: tall, rounded, 16px text (no iOS zoom / cramped typing), themed for dark mode.
const inputClass = (hasError: boolean, padding: string) =>
  `w-full h-12 ${padding} text-[16px] bg-slate-50 dark:bg-slate-800 border rounded-2xl font-medium ${
    hasError ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700'
  }`;

const FieldIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View pointerEvents="none" style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
    {children}
  </View>
);

const FieldError: React.FC<{ error?: BilingualError }> = ({ error }) =>
  error ? (
    <View style={tw`mt-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900 rounded-xl`}>
      <Text className="text-[12px] font-semibold text-rose-700 dark:text-rose-300">{error.tr || error.en}</Text>
    </View>
  ) : null;

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, login, register, isAuthenticated } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [selectedColor, setSelectedColor] = useState(USER_COLORS[0]);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation States
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<BilingualError | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ tr: string; en: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is not authenticated, AuthModal MUST be shown.
  if (!authModalOpen && isAuthenticated) return null;

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async () => {
    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);

    const cleanUser = username.trim();
    // Validate with Zod
    const val = handleZodValidation(loginSchema, {
      username: cleanUser,
      password,
      rememberMe,
    });

    if (!val.success) {
      if (val.fieldErrors) setFieldErrors(val.fieldErrors);
      if (val.error) setGlobalError(val.error);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ username: cleanUser, password, rememberMe });
      if (!res.success) {
        if (res.bilingualError) {
          setGlobalError(res.bilingualError);
        } else {
          setGlobalError({
            tr: res.error || 'Giriş yapılamadı.',
            en: 'Login failed. Please verify your credentials.',
          });
        }
      } else {
        setSuccessMessage({
          tr: 'Giriş başarılı! Hoş geldiniz.',
          en: 'Login successful! Welcome back.',
        });
      }
    } catch {
      setGlobalError({
        tr: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        en: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');

    // Validate with Zod
    const val = handleZodValidation(registerSchema, {
      name: cleanName,
      username: cleanUser,
      password,
      confirmPassword,
      avatar: selectedAvatar,
      color: selectedColor,
    });

    if (!val.success) {
      if (val.fieldErrors) setFieldErrors(val.fieldErrors);
      if (val.error) setGlobalError(val.error);
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: cleanName,
        username: cleanUser,
        password,
        confirmPassword,
        avatar: selectedAvatar,
        color: selectedColor,
      });

      if (!res.success) {
        if (res.bilingualError) {
          setGlobalError(res.bilingualError);
        } else {
          setGlobalError({
            tr: res.error || 'Kayıt işlemi gerçekleştirilemedi.',
            en: 'Registration failed.',
          });
        }
      } else {
        setSuccessMessage({
          tr: 'Hesabınız başarıyla oluşturuldu! Hoş geldiniz.',
          en: 'Your account has been successfully created! Welcome.',
        });
      }
    } catch {
      setGlobalError({
        tr: 'Kayıt esnasında bir hata oluştu.',
        en: 'An unexpected error occurred during registration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const eyeToggle = (
    <Btn
      onPress={() => setShowPassword(!showPassword)}
      accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
      className="absolute right-1 top-0 bottom-0 w-11 items-center justify-center"
    >
      {showPassword ? <EyeOff {...ic('w-5 h-5 text-slate-400')} /> : <Eye {...ic('w-5 h-5 text-slate-400')} />}
    </Btn>
  );

  return (
    // Web renders its own non-dismissable backdrop (bg-slate-900/80, no outside-click close).
    <Overlay onClose={() => undefined} position="center" dismissible={false} overlayClassName="bg-slate-900/80">
      <Panel
        maxHeight={0.94}
        className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full self-center shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <View style={tw`px-5 pt-7 pb-6`}>
          {/* Top Header */}
          <View style={tw`items-center mb-6`}>
            <Gradient
              dir="tr"
              colors={['emerald-600', 'teal-500']}
              className="items-center justify-center w-16 h-16 rounded-3xl shadow-lg mb-3"
            >
              <Text className="text-3xl text-white">{mode === 'register' ? selectedAvatar : '₺'}</Text>
            </Gradient>
            <Text className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight text-center">
              {mode === 'login' ? 'Giriş Yapın' : 'Yeni Hesap Oluşturun'}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center px-2">
              {mode === 'login'
                ? 'Akıllı Liste hesabınızla oturum açın ve listelerinize erişin'
                : 'Yeni profilinizi oluşturun ve ortak listelerinizi yönetmeye başlayın'}
            </Text>
          </View>

          {/* Mode Selector Tabs (Login / Register) */}
          <View style={tw`flex-row p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5`}>
            <Btn
              onPress={() => handleModeSwitch('login')}
              className={`flex-1 h-10 rounded-xl items-center justify-center ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            >
              <Text className={`text-sm font-bold ${mode === 'login' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                Giriş Yap
              </Text>
            </Btn>
            <Btn
              onPress={() => handleModeSwitch('register')}
              className={`flex-1 h-10 rounded-xl items-center justify-center ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            >
              <Text className={`text-sm font-bold ${mode === 'register' ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                Kayıt Ol
              </Text>
            </Btn>
          </View>

          {/* Global Alerts */}
          {globalError && (
            <View style={tw`p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl gap-1 mb-4`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <AlertCircle {...ic('w-4 h-4 text-rose-700 dark:text-rose-300')} />
                <Text className="text-xs font-bold text-rose-700 dark:text-rose-300">Hata</Text>
              </View>
              <Text className="pl-5 text-xs text-rose-800 dark:text-rose-200 font-semibold">{globalError.tr || globalError.en}</Text>
            </View>
          )}

          {successMessage && (
            <View style={tw`p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-2xl gap-1 mb-4`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <CheckCircle2 {...ic('w-4 h-4 text-emerald-700 dark:text-emerald-300')} />
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Başarılı</Text>
              </View>
              <Text className="pl-5 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">{successMessage.tr}</Text>
            </View>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <View style={tw`gap-4`}>
              <View>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Kullanıcı Adı</Text>
                </View>
                <View>
                  <FieldIcon>
                    <AtSign {...ic('w-4 h-4 text-slate-400')} />
                  </FieldIcon>
                  <Input
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      clearFieldError('username');
                    }}
                    placeholder="örn: murat, ayse, can"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                    className={inputClass(!!fieldErrors.username, 'pl-11 pr-4')}
                  />
                </View>
                <FieldError error={fieldErrors.username} />
              </View>

              <View>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Şifre</Text>
                </View>
                <View>
                  <FieldIcon>
                    <Lock {...ic('w-4 h-4 text-slate-400')} />
                  </FieldIcon>
                  <Input
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearFieldError('password');
                    }}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleLoginSubmit}
                    className={inputClass(!!fieldErrors.password, 'pl-11 pr-12')}
                  />
                  {eyeToggle}
                </View>
                <FieldError error={fieldErrors.password} />
              </View>

              <View style={tw`flex-row items-center justify-between`}>
                <Btn
                  onPress={() => setRememberMe(!rememberMe)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  className="flex-row items-center gap-2.5 py-2 pr-3"
                >
                  <View
                    style={tw.style(
                      'w-6 h-6 rounded-lg items-center justify-center border',
                      rememberMe ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
                    )}
                  >
                    {rememberMe && <Check {...ic('w-4 h-4 text-white', 3)} />}
                  </View>
                  <Text className="text-sm text-slate-600 dark:text-slate-300">Beni hatırla</Text>
                </Btn>
              </View>

              <Btn
                onPress={handleLoginSubmit}
                disabled={isLoading}
                className="w-full h-12 px-4 bg-emerald-600 rounded-2xl shadow-sm flex-row items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <Text className="text-white font-bold text-[16px]">Giriş Yapılıyor...</Text>
                ) : (
                  <>
                    <Text className="text-white font-bold text-[16px]">Giriş Yap</Text>
                    <ArrowRight {...ic('w-4 h-4 text-white')} />
                  </>
                )}
              </Btn>
            </View>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <View style={tw`gap-4`}>
              <View>
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Adınız & Soyadınız *</Text>
                <View>
                  <FieldIcon>
                    <UserIcon {...ic('w-4 h-4 text-slate-400')} />
                  </FieldIcon>
                  <Input
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      clearFieldError('name');
                    }}
                    placeholder="Örn: Ahmet Yılmaz"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    className={inputClass(!!fieldErrors.name, 'pl-11 pr-4')}
                  />
                </View>
                <FieldError error={fieldErrors.name} />
              </View>

              <View>
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kullanıcı Adı *</Text>
                <View>
                  <FieldIcon>
                    <AtSign {...ic('w-4 h-4 text-slate-400')} />
                  </FieldIcon>
                  <Input
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      clearFieldError('username');
                    }}
                    placeholder="örn: ahmetyilmaz (boşluksuz)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username-new"
                    textContentType="username"
                    returnKeyType="next"
                    className={inputClass(!!fieldErrors.username, 'pl-11 pr-4')}
                  />
                </View>
                <FieldError error={fieldErrors.username} />
              </View>

              <View style={tw`gap-4`}>
                <View>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Şifre *</Text>
                  <View>
                    <FieldIcon>
                      <Lock {...ic('w-4 h-4 text-slate-400')} />
                    </FieldIcon>
                    <Input
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        clearFieldError('password');
                      }}
                      placeholder="En az 6 karakter"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      textContentType="newPassword"
                      returnKeyType="next"
                      className={inputClass(!!fieldErrors.password, 'pl-11 pr-12')}
                    />
                    {eyeToggle}
                  </View>
                  <FieldError error={fieldErrors.password} />
                </View>

                <View>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Şifre Onayı *</Text>
                  <View>
                    <FieldIcon>
                      <KeyRound {...ic('w-4 h-4 text-slate-400')} />
                    </FieldIcon>
                    <Input
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        clearFieldError('confirmPassword');
                      }}
                      placeholder="Şifreyi onaylayın"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      textContentType="newPassword"
                      returnKeyType="done"
                      className={inputClass(!!fieldErrors.confirmPassword, 'pl-11 pr-12')}
                    />
                  </View>
                  <FieldError error={fieldErrors.confirmPassword} />
                </View>
              </View>

              {/* Color Accent Picker */}
              <View>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Profil Renk Teması:</Text>
                  <View
                    style={[
                      tw`w-4 h-4 rounded-full border shadow-sm`,
                      { backgroundColor: selectedColor, borderColor: selectedColor },
                    ]}
                  />
                </View>
                <View style={tw`flex-row items-center gap-3 flex-wrap py-1.5 px-1.5`}>
                  {USER_COLORS.map((c, idx) => {
                    const active = selectedColor === c;
                    return (
                      <Btn
                        key={idx}
                        onPress={() => setSelectedColor(c)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${active ? 'shadow-sm' : 'opacity-75'}`}
                        style={[{ backgroundColor: c }, active ? { transform: [{ scale: 1.1 }] } : null]}
                      >
                        {/* ring-2 ring-offset-2 ring-slate-800 */}
                        {active && (
                          <View pointerEvents="none" style={tw`absolute -inset-1 rounded-full border-2 border-slate-800 dark:border-white`} />
                        )}
                        {active && <Check {...ic('w-4 h-4 text-white')} />}
                      </Btn>
                    );
                  })}
                </View>
              </View>

              {/* Emoji Avatar Picker */}
              <View>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Profil Emoji Avatarı:</Text>
                  <View
                    style={[
                      tw`w-8 h-8 rounded-full items-center justify-center border shadow-sm`,
                      { backgroundColor: `${selectedColor}18`, borderColor: selectedColor },
                    ]}
                  >
                    <Text className="text-lg">{selectedAvatar}</Text>
                  </View>
                </View>
                <View style={tw`bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-44 overflow-hidden`}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={tw`p-2`}>
                    <Grid cols={6} gap={1.5}>
                      {EMOJI_AVATARS.map((emoji, idx) => {
                        const active = selectedAvatar === emoji;
                        return (
                          <Btn
                            key={idx}
                            onPress={() => setSelectedAvatar(emoji)}
                            className={`h-11 rounded-xl items-center justify-center ${
                              active ? 'shadow-sm' : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700'
                            }`}
                            style={active ? { backgroundColor: selectedColor, transform: [{ scale: 1.05 }] } : undefined}
                          >
                            <Text className={`text-lg ${active ? 'text-white' : ''}`}>{emoji}</Text>
                          </Btn>
                        );
                      })}
                    </Grid>
                  </ScrollView>
                </View>
              </View>

              <Btn
                onPress={handleRegisterSubmit}
                disabled={isLoading}
                className="w-full h-12 px-4 bg-emerald-600 rounded-2xl shadow-sm flex-row items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <Text className="text-white font-bold text-[16px]">Hesap Oluşturuluyor...</Text>
                ) : (
                  <>
                    <Text className="text-white font-bold text-[16px]">Kayıt Ol ve Başla</Text>
                    <Sparkles {...ic('w-4 h-4 text-white')} />
                  </>
                )}
              </Btn>
            </View>
          )}
        </View>
      </Panel>
    </Overlay>
  );
};
