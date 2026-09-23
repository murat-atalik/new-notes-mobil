import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FolderTree, KeyRound, LayoutTemplate, LogOut, Moon, RefreshCw, Sun, SunMoon, Trash2 } from 'lucide-react-native';

import { Card, confirmAction, ListGroup, palette, Row, Segmented, showToast, StackScreen, Text, UserAvatar } from '../../design';
import { useTheme, type ThemeMode } from '../../hooks/useTheme';
import { formatDay } from '../../logic/format';
import { ic, tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

function formatSynced(value: string | null): string {
  if (!value) return 'Henüz senkronize edilmedi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Bilinmiyor';
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `Son: ${formatDay(`${y}-${m}-${d}`)} ${time}`;
}

export const SettingsScreen: React.FC<RootScreenProps<'Settings'>> = ({ navigation }) => {
  const { themeMode, setThemeMode } = useTheme();
  const currentUser = useAppStore((s) => s.currentUser);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const isSyncing = useAppStore((s) => s.isSyncing);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const resetUserData = useAppStore((s) => s.resetUserData);
  const logout = useAppStore((s) => s.logout);

  const sync = async () => {
    const res = await syncWithServer(false);
    if (res.success) showToast('Veriler senkronize edildi');
    else showToast(res.error ?? 'Senkronizasyon başarısız', 'error');
  };

  return (
    <StackScreen title="Ayarlar" refreshing={isSyncing} onRefresh={sync}>
      <Card onPress={() => navigation.navigate('Profile')} className="flex-row items-center gap-4">
        <UserAvatar avatar={currentUser.avatar} name={currentUser.name} color={currentUser.color} size="lg" />
        <View style={tw`flex-1 min-w-0`}>
          <Text variant="headline" numberOfLines={1}>
            {currentUser.name}
          </Text>
          <Text variant="subhead" tone="muted" numberOfLines={1}>
            @{currentUser.username}
          </Text>
          {currentUser.familyName ? (
            <Text variant="footnote" tone="brand" weight="semibold" numberOfLines={1}>
              {currentUser.familyName}
            </Text>
          ) : null}
        </View>
        <Text variant="subhead" tone="brand" weight="semibold">
          Düzenle
        </Text>
      </Card>

      <View style={tw`gap-1.5`}>
        <Text variant="overline" tone="muted" className="px-4">
          Görünüm
        </Text>
        <Segmented<ThemeMode>
          value={themeMode}
          onChange={setThemeMode}
          options={[
            { value: 'light', label: 'Aydınlık', icon: Sun },
            { value: 'dark', label: 'Karanlık', icon: Moon },
            { value: 'system', label: 'Sistem', icon: SunMoon },
          ]}
        />
      </View>

      <ListGroup header="İçerik">
        <Row title="Kategoriler" subtitle="Ürün, görev ve not kategorileri" icon={FolderTree} iconColor="#6366f1" onPress={() => navigation.navigate('Categories')} />
        <Row title="Şablonlar" subtitle="Hazır listelerle hızlı başla" icon={LayoutTemplate} iconColor="#f59e0b" onPress={() => navigation.navigate('Templates')} />
      </ListGroup>

      <ListGroup header="Hesap">
        <Row title="Şifre Değiştir" icon={KeyRound} iconColor="#0ea5e9" onPress={() => navigation.navigate('ChangePassword')} />
        <Row
          title="Verileri Senkronize Et"
          subtitle={formatSynced(lastSyncedAt)}
          icon={RefreshCw}
          iconColor={palette.brandLight}
          onPress={sync}
          disabled={isSyncing}
          chevron={false}
          right={isSyncing ? <ActivityIndicator color={palette.brand} /> : null}
        />
      </ListGroup>

      <ListGroup header="Tehlikeli Bölge" footer="Sıfırlama; sahibi olduğun listeleri, harcamaları ve birikimleri kalıcı olarak siler.">
        <Row
          title="Verilerimi Sıfırla"
          icon={Trash2}
          destructive
          chevron={false}
          onPress={() =>
            confirmAction({
              title: 'Verilerini sıfırla?',
              message: 'Tüm listelerin, harcamaların ve birikimlerin silinecek. Bu işlem geri alınamaz.',
              confirmText: 'Sıfırla',
              onConfirm: () => {
                resetUserData(currentUser.id);
                showToast('Verilerin sıfırlandı');
              },
            })
          }
        />
        <Row
          title="Çıkış Yap"
          left={
            <View style={tw`w-8 h-8 rounded-[10px] items-center justify-center bg-rose-100 dark:bg-rose-950`}>
              <LogOut {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
            </View>
          }
          destructive
          chevron={false}
          onPress={() =>
            confirmAction({
              title: 'Çıkış yapılsın mı?',
              message: 'Tekrar giriş yaparak verilerine ulaşabilirsin.',
              confirmText: 'Çıkış Yap',
              onConfirm: logout,
            })
          }
        />
      </ListGroup>

      <Text variant="caption" tone="faint" className="text-center">
        Akıllı Liste · v1.0
      </Text>
    </StackScreen>
  );
};
