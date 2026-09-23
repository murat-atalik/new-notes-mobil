import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Home, LogOut, Plus, RefreshCw, ShieldCheck, User as UserIcon } from 'lucide-react-native';

import { useRouter } from '../lib/router';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { ProfileModal } from './ProfileModal';
import { ThemeToggle } from './ThemeToggle';
import { Btn, Gradient, Text } from './ui';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  onOpenCreateModal: () => void;
}

// Native app is always "installed", so the web's PWA install buttons are omitted
// (same as the web app running in standalone mode).
export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, setChangePasswordModalOpen, logout, syncWithServer, isSyncing, lastSyncedAt } =
    useAppStore();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <View
        style={[
          tw`bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 shadow-sm px-4 pb-3 z-40`,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={tw`w-full max-w-4xl self-center flex-row items-center justify-between`}>
          {/* Brand */}
          <Pressable onPress={() => router.push('/')} style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
            <Gradient
              colors={['emerald-500', 'teal-600']}
              dir="br"
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
            >
              <Text className="text-lg text-white">₺</Text>
            </Gradient>
            <View style={tw`flex-1 min-w-0`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <Text className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
                  Akıllı Liste
                </Text>
                {currentUser.familyName ? (
                  <View
                    style={tw`hidden sm:flex flex-row items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-150 dark:border-indigo-800 px-2 py-0.5 rounded-full`}
                  >
                    <Home {...ic('w-2.5 h-2.5 text-indigo-700 dark:text-indigo-300')} />
                    <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      {currentUser.familyName}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={tw`flex-row items-center gap-1`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                <Text className="text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  Aile & Bütçe Yönetimi
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Right actions */}
          <View style={tw`flex-row items-center gap-1.5`}>
            <Btn
              onPress={() => setShowUserDropdown(!showUserDropdown)}
              accessibilityLabel="Kullanıcı Menüsü"
              className="flex-row items-center gap-1.5 p-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              <UserAvatar avatar={currentUser.avatar} name={currentUser.name} color={currentUser.color} size="md" />
              <View style={tw`hidden sm:flex mr-1`}>
                <ChevronDown {...ic('w-3 h-3 text-slate-400')} />
              </View>
            </Btn>

            <Btn
              onPress={onOpenCreateModal}
              accessibilityLabel="Yeni Liste"
              className="flex-row items-center gap-1 pl-2.5 pr-3 h-9 rounded-full bg-emerald-600 shadow-sm"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-xs font-bold text-white">Yeni</Text>
            </Btn>
          </View>
        </View>
      </View>

      {/* User dropdown */}
      <Modal visible={showUserDropdown} transparent animationType="fade" onRequestClose={() => setShowUserDropdown(false)}>
        <Pressable style={tw`flex-1`} onPress={() => setShowUserDropdown(false)}>
          <Pressable
            onPress={() => undefined}
            style={[
              tw`absolute right-4 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5`,
              { top: insets.top + 64 },
            ]}
          >
            {/* Active user info */}
            <View style={tw`px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View
                  style={tw`flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded`}
                >
                  <ShieldCheck {...ic('w-3 h-3 text-emerald-700 dark:text-emerald-400')} />
                  <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Aktif Oturum</Text>
                </View>
                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  @{currentUser.username || 'kullanici'}
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-2 mt-2`}>
                <UserAvatar avatar={currentUser.avatar} name={currentUser.name} color={currentUser.color} size="xs" />
                <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>
                  {currentUser.name}
                </Text>
              </View>

              <Btn
                onPress={() => {
                  setShowUserDropdown(false);
                  setShowProfileModal(true);
                }}
                className="mt-2.5 w-full flex-row items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <UserIcon {...ic('w-3.5 h-3.5 text-slate-600 dark:text-slate-400')} />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">Profili Düzenle & Emoji Avatar</Text>
              </Btn>
            </View>

            {/* Theme switcher */}
            <View style={tw`p-2 border-b border-slate-100 dark:border-slate-800`}>
              <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1 mb-1.5">
                Görünüm Teması
              </Text>
              <ThemeToggle variant="segmented" />
            </View>

            {/* Sync + Logout */}
            <View style={tw`p-1`}>
              <Btn
                onPress={() => {
                  setShowUserDropdown(false);
                  syncWithServer(false);
                }}
                disabled={isSyncing}
                className="w-full flex-row items-center gap-2 px-2.5 py-2.5 rounded-xl"
              >
                <RefreshCw {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1">
                  {isSyncing ? 'Senkronize...' : 'Verileri Yenile'}
                </Text>
                {lastSyncedAt ? (
                  <Text className="text-[10px] text-slate-400">{lastSyncedAt}</Text>
                ) : null}
              </Btn>
              <Btn
                onPress={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full flex-row items-center gap-2 px-2.5 py-2.5 rounded-xl"
              >
                <LogOut {...ic('w-3.5 h-3.5 text-rose-600 dark:text-rose-400')} />
                <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">Oturumu Kapat</Text>
              </Btn>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onOpenChangePassword={() => {
            setShowProfileModal(false);
            setChangePasswordModalOpen(true);
          }}
        />
      )}
    </>
  );
};
