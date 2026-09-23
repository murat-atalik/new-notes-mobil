import React, { useState } from 'react';
import { View } from 'react-native';
import { KeyRound, ShieldCheck, Users } from 'lucide-react-native';

import { isFamilyListForUser } from '../lib/permissions';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { AppList } from '../types';
import { ListCard } from './ListCard';
import { Btn, Gradient, Input, Text } from './ui';
import { UserAvatar } from './UserAvatar';

interface SharedListsViewProps {
  onOpenInvite: (list: AppList) => void;
  onOpenCreateModal: () => void;
}

export const SharedListsView: React.FC<SharedListsViewProps> = ({
  onOpenInvite,
  onOpenCreateModal,
}) => {
  const { lists, currentUser, users, joinListWithCode } = useAppStore();
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinMessage, setJoinMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Shared lists strictly for the current user and their family / shared collaborators
  const sharedLists = lists.filter((l) => isFamilyListForUser(l, currentUser));

  const handleJoinByCode = () => {
    if (!inviteCodeInput.trim()) return;

    const res = joinListWithCode(inviteCodeInput.trim());
    if (res.success) {
      setJoinMessage({ text: res.message || 'Listeye başarıyla katıldınız!', type: 'success' });
      setInviteCodeInput('');
    } else {
      setJoinMessage({ text: res.message || 'Hata oluştu.', type: 'error' });
    }
  };

  return (
    <View style={tw`gap-4`}>
      {/* Top Header Card */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between gap-3`}
      >
        <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
          <View style={tw`w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 items-center justify-center shadow-sm`}>
            <Users {...ic('w-5 h-5 text-indigo-700 dark:text-indigo-300')} />
          </View>
          <View style={tw`flex-1 min-w-0`}>
            <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
              Ortak Çalışma & Paylaşılanlar
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Aile üyeleri ve arkadaşlarla paylaşılan ortak listeler
            </Text>
          </View>
        </View>

        <Btn
          onPress={onOpenCreateModal}
          className="px-3.5 h-10 justify-center bg-emerald-600 rounded-xl shadow-sm"
        >
          <Text className="text-white text-xs font-bold">+ Ortak Liste</Text>
        </Btn>
      </View>

      <View style={tw`gap-4`}>
        {/* Join by 6-digit invite code box */}
        <Gradient
          dir="br"
          colors={['indigo-900', 'slate-900']}
          className="rounded-3xl p-5 shadow-md"
        >
          <View style={tw`flex-row items-center gap-2 mb-2`}>
            <KeyRound {...ic('w-4 h-4 text-indigo-300')} />
            <Text className="font-bold text-sm text-white">Davet Kodu ile Listeye Katıl</Text>
          </View>
          <Text className="text-xs text-indigo-200 mb-3.5 leading-relaxed">
            Arkadaşınızın sizinle paylaştığı 6 haneli kodu (Örn: EV-8842) girerek listeye hemen
            dahil olun.
          </Text>

          <View style={tw`flex-row gap-2`}>
            <Input
              value={inviteCodeInput}
              onChangeText={(text) => setInviteCodeInput(text.toUpperCase())}
              placeholder="Örn: EV-8842"
              placeholderTextColor={tw.color('indigo-300')}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleJoinByCode}
              autoCorrect={false}
              className="flex-1 h-12 px-4 text-[16px] font-mono bg-white/10 border border-white/20 rounded-2xl text-white dark:text-white"
            />
            <Btn
              onPress={handleJoinByCode}
              className="px-5 h-12 bg-indigo-500 rounded-2xl shadow-sm shrink-0 items-center justify-center"
            >
              <Text className="text-white font-bold text-sm">Katıl</Text>
            </Btn>
          </View>

          {joinMessage ? (
            <Text
              className={`text-xs mt-2.5 font-medium ${
                joinMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {joinMessage.text}
            </Text>
          ) : null}
        </Gradient>

        {/* Current Active Collaborators */}
        <View style={tw`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <ShieldCheck {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Sistemdeki Kayıtlı Kullanıcılar
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 dark:text-slate-500">Canlı Eşzamanlı</Text>
          </View>

          <View style={tw`gap-2 mt-2`}>
            {users.map((u) => (
              <View
                key={u.id}
                style={tw.style(
                  'px-3 py-3 rounded-xl border flex-row items-center gap-3',
                  currentUser.id === u.id
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                )}
              >
                <UserAvatar avatar={u.avatar} name={u.name} color={u.color} size="sm" />
                <View style={tw`min-w-0 flex-1`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-xs" numberOfLines={1}>
                    {u.name}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    @{u.username}
                  </Text>
                </View>
                {currentUser.id === u.id ? (
                  <View style={tw`px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-950/60`}>
                    <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Sen</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Shared Lists Grid */}
        <View>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text className="font-bold text-slate-900 dark:text-white text-sm">
              Ortak Listeler ({sharedLists.length})
            </Text>
          </View>

          {sharedLists.length > 0 ? (
            <View style={tw`gap-4`}>
              {sharedLists.map((list) => (
                <ListCard key={list.id} list={list} onOpenInvite={onOpenInvite} />
              ))}
            </View>
          ) : (
            <View style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 items-center`}>
              <View
                style={tw`w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center self-center mb-3`}
              >
                <Users {...ic('w-6 h-6 text-indigo-600 dark:text-indigo-300')} />
              </View>
              <Text className="font-bold text-slate-900 dark:text-white text-sm mb-1 text-center">
                Henüz Paylaşılan Listeniz Yok
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-sm self-center mb-4 text-center">
                Kendi listelerinizi aile veya arkadaşlarınızla paylaşabilir ya da bir davet kodu ile
                ortak listeye katılabilirsiniz.
              </Text>
              <Btn
                onPress={onOpenCreateModal}
                className="px-5 h-12 bg-emerald-600 rounded-2xl shadow-sm flex-row items-center justify-center self-center gap-1.5"
              >
                <Text className="text-white text-sm font-bold">Yeni Ortak Liste Oluştur</Text>
              </Btn>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
