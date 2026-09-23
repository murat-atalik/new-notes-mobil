import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import {
  Settings as SettingsIcon,
  Wallet,
  Tag,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  LogOut,
  AtSign,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react-native';

import { useRouter } from '../lib/router';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { CategoriesView } from './CategoriesView';
import { ProfileModal } from './ProfileModal';
import { TemplatesView } from './TemplatesView';
import { ThemeToggle } from './ThemeToggle';
import { Btn, Input, Overlay, Text } from './ui';
import { UserAvatar } from './UserAvatar';

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const {
    currentUser,
    monthlyBudget,
    setMonthlyBudget,
    categories,
    templates,
    resetUserData,
    setChangePasswordModalOpen,
    logout,
  } = useAppStore();

  const [subView, setSubView] = useState<'main' | 'categories' | 'templates'>('main');
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2000);
    }
  };

  if (subView === 'categories') {
    return <CategoriesView onBack={() => setSubView('main')} />;
  }

  if (subView === 'templates') {
    return <TemplatesView onBack={() => setSubView('main')} />;
  }

  const shoppingCategoriesCount = categories.filter((c) => c.type === 'SHOPPING').length;
  const todoCategoriesCount = categories.filter((c) => c.type === 'TODO').length;
  const noteCategoriesCount = categories.filter((c) => c.type === 'NOTE').length;

  const bullets = [
    'Oluşturduğunuz tüm alışveriş, görev ve not listeleri',
    'Listelerdeki tüm maddeler ve görevler',
    'Kaydettiğiniz harcama geçmişi ve fişler',
    'Oluşturduğunuz birikim ve varlık hedefleri',
  ];

  return (
    <View style={tw`gap-3.5`}>
      {/* Top Header Card */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-2.5`}
      >
        <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
          <View
            style={tw`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center shadow-sm`}
          >
            <SettingsIcon {...ic('w-4 h-4 text-slate-700 dark:text-slate-300')} />
          </View>
          <View style={tw`flex-1 min-w-0`}>
            <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight">Ayarlar & Hesap</Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              Hesap Yönetimi, Profil, Emoji Avatar, Kategoriler ve Bütçe
            </Text>
          </View>
        </View>
      </View>

      <View style={tw`gap-3.5`}>
        {/* User Profile & Auth Card */}
        <View
          style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm gap-4`}
        >
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-row items-center gap-3.5 min-w-0 flex-1`}>
              <UserAvatar
                avatar={currentUser.avatar}
                name={currentUser.name}
                color={currentUser.color}
                size="lg"
                className="border-2"
              />
              <View style={tw`min-w-0 flex-1`}>
                <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm" numberOfLines={1}>
                    {currentUser.name}
                  </Text>
                  <View
                    style={tw`bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded shrink-0 flex-row items-center gap-1`}
                  >
                    <ShieldCheck {...ic('w-3 h-3 text-emerald-800 dark:text-emerald-300')} />
                    <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Aktif Oturum</Text>
                  </View>
                  {currentUser.color ? (
                    <View
                      style={[
                        tw`px-2 py-0.5 rounded shrink-0 flex-row items-center gap-1 border`,
                        {
                          backgroundColor: `${currentUser.color}15`,
                          borderColor: `${currentUser.color}35`,
                        },
                      ]}
                    >
                      <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: currentUser.color }]} />
                      <Text className="text-[10px] font-bold" style={{ color: currentUser.color }}>
                        Tema Rengi
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={tw`flex-row items-center gap-1 mt-0.5`}>
                  <AtSign {...ic('w-3 h-3 text-emerald-700 dark:text-emerald-400')} />
                  <Text
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex-1"
                    numberOfLines={1}
                  >
                    {currentUser.username || 'kullanici'}
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Kayıt Tarihi: {currentUser.createdAt || '2026-01-15'}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-1.5 shrink-0`}>
              <Btn
                testID="edit-profile-settings-btn"
                onPress={() => setShowProfileModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 shadow-sm"
              >
                <Text className="text-white text-xs font-bold">Profili Düzenle</Text>
              </Btn>
            </View>
          </View>

          {/* Account Actions */}
          <View
            style={tw`flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800`}
          >
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium flex-1">
              Şifre değiştirmek için profili düzenleyin
            </Text>

            <Btn
              onPress={logout}
              className="flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
            >
              <LogOut {...ic('w-3.5 h-3.5 text-rose-700 dark:text-rose-300')} />
              <Text className="text-rose-700 dark:text-rose-300 text-xs font-bold">Oturumu Kapat</Text>
            </Btn>
          </View>
        </View>

        {/* Family Membership Card */}
        <View
          style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-950/60 shadow-sm gap-3`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
              <View style={tw`w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                <ShieldCheck {...ic('w-5 h-5 text-indigo-600 dark:text-indigo-400')} />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text className="font-bold text-slate-900 dark:text-white text-sm">
                  {currentUser.familyName || `${currentUser.name} Ailesi`}
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aile Rolü:{' '}
                  <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {currentUser.familyRole === 'HEAD' ? 'Kurucu / Yönetici' : 'Aile Üyesi'}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={tw`items-end`}>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                Aile Kodu
              </Text>
              <Text
                className="font-black text-indigo-700 dark:text-indigo-400 text-xs tracking-wider"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
              >
                {currentUser.familyCode || 'AIL-0001'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance & Theme (Light / Dark) */}
        <View
          style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm gap-3`}
        >
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <View style={tw`flex-1 min-w-0`}>
              <Text className="font-bold text-slate-900 dark:text-white text-sm">Görünüm & Tema</Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Uygulama temasını Aydınlık veya Karanlık olarak seçin.
              </Text>
            </View>
            <View style={tw`w-48 shrink-0`}>
              <ThemeToggle variant="segmented" />
            </View>
          </View>
        </View>

        {/* Management Subpage Navigation Cards */}
        <View style={tw`gap-2.5`}>
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Yönetim & Şablonlar
          </Text>

          {/* Category Management Entry Card */}
          <Btn
            onPress={() => router.push('/categories')}
            className="w-full bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-3"
          >
            <View style={tw`flex-row items-center gap-3.5 min-w-0 flex-1`}>
              <View
                style={tw`w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 items-center justify-center shrink-0`}
              >
                <Tag {...ic('w-5 h-5 text-purple-600 dark:text-purple-400')} />
              </View>
              <View style={tw`min-w-0 flex-1`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">Kategori Yönetimi</Text>
                  <View style={tw`px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950`}>
                    <Text className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      {categories.length} Kategori
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                  {shoppingCategoriesCount} Alışveriş • {todoCategoriesCount} Görev • {noteCategoriesCount} Not
                  kategorisini düzenle veya ekle
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-1 shrink-0`}>
              <ChevronRight {...ic('w-4 h-4 text-purple-600 dark:text-purple-400')} />
            </View>
          </Btn>

          {/* Template Management Entry Card */}
          <Btn
            onPress={() => router.push('/templates')}
            className="w-full bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-3"
          >
            <View style={tw`flex-row items-center gap-3.5 min-w-0 flex-1`}>
              <View
                style={tw`w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center shrink-0`}
              >
                <Sparkles {...ic('w-5 h-5 text-emerald-600 dark:text-emerald-400')} />
              </View>
              <View style={tw`min-w-0 flex-1`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">Hazır Liste Şablonları</Text>
                  <View style={tw`px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950`}>
                    <Text className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      {templates.length} Şablon
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                  Hazır paket listeler, tatil hazırlıkları veya kendi özel şablonlarınızı oluşturun
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-1 shrink-0`}>
              <ChevronRight {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            </View>
          </Btn>
        </View>

        {/* Monthly Budget Setting */}
        <View
          style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm`}
        >
          <View style={tw`flex-row items-center gap-2 mb-1.5`}>
            <Wallet {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            <Text className="font-bold text-slate-900 dark:text-white text-sm">Aylık Hedef Bütçe Belirle</Text>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
            Harcama analizi sayfasında bütçe aşımını takip etmek için aylık tavan tutarı girin.
          </Text>

          <View style={tw`flex-row gap-2`}>
            <View style={tw`relative flex-1 justify-center`}>
              <Input
                keyboardType="decimal-pad"
                value={budgetInput}
                onChangeText={setBudgetInput}
                returnKeyType="done"
                onSubmitEditing={handleSaveBudget}
                className="w-full pl-3.5 pr-16 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-bold"
              />
              <View style={tw`absolute right-3.5`} pointerEvents="none">
                <Text className="text-xs font-bold text-slate-400">₺ / Ay</Text>
              </View>
            </View>
            <Btn onPress={handleSaveBudget} className="px-4 py-2 bg-emerald-600 rounded-xl shadow-sm justify-center">
              <Text className="text-white font-bold text-xs">Kaydet</Text>
            </Btn>
          </View>
          {budgetSaved && (
            <View style={tw`flex-row items-center gap-1 mt-2`}>
              <CheckCircle2 {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
              <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Bütçe güncellendi!</Text>
            </View>
          )}
        </View>

        {/* Reset User Data */}
        <View
          style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-sm`}
        >
          <View style={tw`flex-row items-center gap-2 mb-1`}>
            <View style={tw`w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center`}>
              <Trash2 {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
            </View>
            <Text className="font-bold text-rose-950 dark:text-rose-200 text-sm">Hesap Verilerimi Sıfırla</Text>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
            Yalnızca{' '}
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</Text> (@
            {currentUser.username}) hesabınıza ait tüm listeleri, görevleri, harcama kayıtlarını ve birikim
            varlıklarını kalıcı olarak temizler. Diğer kullanıcıların verileri veya hesabınızın kendisi silinmez.
          </Text>

          <Btn
            testID="reset-user-data-btn"
            onPress={() => setShowResetConfirmModal(true)}
            className="flex-row items-center self-start gap-1.5 px-4 py-2 rounded-xl bg-rose-600 shadow-sm"
          >
            <RefreshCw {...ic('w-3.5 h-3.5 text-white')} />
            <Text className="text-white text-xs font-bold">Verilerimi Sıfırla</Text>
          </Btn>

          {resetSuccessToast && (
            <View
              style={tw`mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex-row items-center gap-2`}
            >
              <CheckCircle2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
              <Text className="text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex-1">
                Hesabınıza ait tüm veriler başarıyla sıfırlandı.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Confirmation Modal for Resetting User Data */}
      {showResetConfirmModal && (
        <Overlay onClose={() => setShowResetConfirmModal(false)} position="center" overlayClassName="bg-slate-950/60">
          <View
            style={tw`bg-white dark:bg-slate-900 w-full max-w-md self-center rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 gap-4`}
          >
            <View style={tw`flex-row items-start justify-between gap-3`}>
              <View style={tw`w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 items-center justify-center shrink-0`}>
                <AlertTriangle {...ic('w-6 h-6 text-rose-600 dark:text-rose-400')} />
              </View>
              <Btn
                onPress={() => setShowResetConfirmModal(false)}
                accessibilityLabel="Kapat"
                className="p-1.5 rounded-full"
              >
                <X {...ic('w-5 h-5 text-slate-400')} />
              </Btn>
            </View>

            <View style={tw`gap-2`}>
              <Text className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Verileriniz Sıfırlansın mı?
              </Text>
              <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bu işlem <Text className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</Text>{' '}
                (@{currentUser.username}) hesabınıza ait tüm:
              </Text>
              <View
                style={tw`gap-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60`}
              >
                {bullets.map((b) => (
                  <View key={b} style={tw`flex-row`}>
                    <Text className="text-xs text-slate-600 dark:text-slate-300 mr-1.5">•</Text>
                    <Text className="text-xs text-slate-600 dark:text-slate-300 flex-1">{b}</Text>
                  </View>
                ))}
              </View>
              <View
                style={tw`p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800 rounded-2xl`}
              >
                <Text className="text-rose-800 dark:text-rose-300 text-xs font-semibold text-center">
                  ⚠️ Tüm verileriniz kalıcı olarak silinecek, emin misiniz?
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-2 pt-2`}>
              <Btn
                onPress={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center"
              >
                <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs">Vazgeç</Text>
              </Btn>
              <Btn
                testID="confirm-reset-user-data-btn"
                onPress={() => {
                  resetUserData();
                  setShowResetConfirmModal(false);
                  setResetSuccessToast(true);
                  setTimeout(() => setResetSuccessToast(false), 4000);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 rounded-xl shadow-sm flex-row items-center justify-center gap-1.5"
              >
                <Trash2 {...ic('w-3.5 h-3.5 text-white')} />
                <Text className="text-white font-bold text-xs">Evet, Verilerimi Sil</Text>
              </Btn>
            </View>
          </View>
        </Overlay>
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onOpenChangePassword={() => {
            setShowProfileModal(false);
            setChangePasswordModalOpen(true);
          }}
        />
      )}
    </View>
  );
};
