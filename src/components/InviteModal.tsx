import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AlertCircle, AtSign, Check, CheckCircle2, Copy, Users, X } from 'lucide-react-native';

import { copyToClipboard } from '../lib/native';
import { ic, tw } from '../lib/tw';
import {
  handleZodValidation,
  inviteUserSchema,
  type BilingualError,
  type FieldErrors,
} from '../lib/validations';
import { useAppStore } from '../store/useAppStore';
import type { AppList } from '../types';
import { Btn, Input, Overlay, Panel, Text } from './ui';
import { UserAvatar } from './UserAvatar';

interface InviteModalProps {
  list: AppList;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ list, onClose }) => {
  const { inviteUserToList, users, currentUser } = useAppStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    bilingualMessage?: BilingualError;
  } | null>(null);

  const listMembers = list.members
    .map((m) => ({
      ...m,
      user: users.find((u) => u.id === m.userId),
    }))
    .filter((m) => m.user);

  const handleCopyCode = () => {
    copyToClipboard(list.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteSubmit = async () => {
    setFieldErrors({});
    setFeedback(null);

    const val = handleZodValidation(inviteUserSchema, {
      usernameOrEmail: usernameInput.trim(),
    });

    if (!val.success) {
      if (val.fieldErrors) setFieldErrors(val.fieldErrors);
      return;
    }

    const res = await inviteUserToList(list.id, usernameInput.trim());
    setFeedback({
      success: res.success,
      message: res.message || res.error || '',
      bilingualMessage: res.bilingualError,
    });
    if (res.success) {
      setUsernameInput('');
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Panel className="w-full max-w-md self-center bg-white rounded-3xl shadow-2xl">
        <View style={tw`p-6`}>
          <Btn
            onPress={onClose}
            accessibilityLabel="Kapat"
            className="absolute top-4 right-4 p-1 rounded-full z-10"
          >
            <X {...ic('w-5 h-5 text-slate-400')} />
          </Btn>

          <View style={tw`flex-row items-center gap-2 mb-1`}>
            <View style={tw`p-2 bg-emerald-50 rounded-xl`}>
              <Users {...ic('w-5 h-5 text-emerald-700')} />
            </View>
            <View style={tw`flex-1 pr-6`}>
              <Text className="font-extrabold text-slate-900 text-base">Listeyi Paylaş & Davet Et</Text>
              <Text className="text-xs text-slate-500">{list.title}</Text>
            </View>
          </View>

          {/* 6-Digit Code Box */}
          <View style={tw`my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200`}>
            <Text className="text-[11px] font-semibold text-slate-500 mb-1">Özel Liste Davet Kodu</Text>
            <View style={tw`flex-row items-center justify-between gap-2`}>
              <Text className="text-base font-black tracking-widest font-mono text-slate-900">
                {list.inviteCode}
              </Text>
              <Btn
                onPress={handleCopyCode}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check {...ic('w-3.5 h-3.5 text-emerald-400')} />
                    <Text className="text-white text-xs font-semibold">Kopyalandı</Text>
                  </>
                ) : (
                  <>
                    <Copy {...ic('w-3.5 h-3.5 text-white')} />
                    <Text className="text-white text-xs font-semibold">Kodu Kopyala</Text>
                  </>
                )}
              </Btn>
            </View>
          </View>

          {/* Username Invite Form */}
          <View style={tw`gap-2 mb-5`}>
            <Text className="text-xs font-semibold text-slate-700">Kullanıcı Adı ile Davet Gönder</Text>
            <View style={tw`flex-row gap-2`}>
              <View style={tw`flex-1 justify-center`}>
                <View style={tw`absolute left-3 z-10`} pointerEvents="none">
                  <AtSign {...ic('w-4 h-4 text-slate-400')} />
                </View>
                <Input
                  value={usernameInput}
                  onChangeText={(text) => {
                    setUsernameInput(text);
                    if (fieldErrors.username)
                      // web clears the field error with a loose `undefined as any`
                      setFieldErrors((p) => ({ ...p, username: undefined as unknown as BilingualError }));
                  }}
                  placeholder="örn: ayse, can, murat"
                  autoCapitalize="none"
                  returnKeyType="send"
                  onSubmitEditing={handleInviteSubmit}
                  className={`w-full pl-8 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl font-medium ${
                    fieldErrors.username ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </View>
              <Btn onPress={handleInviteSubmit} className="px-4 py-2 bg-emerald-600 rounded-xl shadow-xs justify-center">
                <Text className="text-white font-bold text-xs">Davet Et</Text>
              </Btn>
            </View>

            {fieldErrors.username ? (
              <View style={tw`px-2.5 py-1.5 bg-rose-50 border border-rose-100 rounded-lg`}>
                <Text className="text-[11px] font-semibold text-rose-700">
                  {fieldErrors.username.tr || fieldErrors.username.en}
                </Text>
              </View>
            ) : null}

            {feedback ? (
              <View
                style={tw.style(
                  'p-2.5 rounded-xl flex-row items-start gap-2',
                  feedback.success
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-rose-50 border border-rose-200',
                )}
              >
                <View style={tw`mt-0.5`}>
                  {feedback.success ? (
                    <CheckCircle2 {...ic('w-4 h-4 text-emerald-600')} />
                  ) : (
                    <AlertCircle {...ic('w-4 h-4 text-rose-600')} />
                  )}
                </View>
                <View style={tw`flex-1`}>
                  {feedback.bilingualMessage ? (
                    <Text
                      className={`text-xs font-semibold ${feedback.success ? 'text-emerald-900' : 'text-rose-900'}`}
                    >
                      {feedback.bilingualMessage.tr || feedback.bilingualMessage.en}
                    </Text>
                  ) : (
                    <Text className={`text-xs font-medium ${feedback.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {feedback.message}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}
          </View>

          {/* Current Members List */}
          <View>
            <Text className="text-xs font-bold text-slate-500 mb-2">
              Mevcut Liste Üyeleri ({listMembers.length})
            </Text>
            <ScrollView style={tw`max-h-48`} nestedScrollEnabled contentContainerStyle={tw`gap-2 pr-1`}>
              {listMembers.map((m) => (
                <View
                  key={m.userId}
                  style={tw`flex-row items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80`}
                >
                  <View style={tw`flex-row items-center gap-2.5 min-w-0 flex-1`}>
                    <UserAvatar avatar={m.user?.avatar} name={m.user?.name} color={m.user?.color} size="sm" />
                    <View style={tw`min-w-0 flex-1`}>
                      <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                        {m.user?.name}{' '}
                        {m.userId === currentUser.id ? (
                          <Text className="text-[10px] text-emerald-600 font-semibold">(Sen)</Text>
                        ) : null}
                      </Text>
                      <Text className="text-[10px] text-slate-400">@{m.user?.username}</Text>
                    </View>
                  </View>

                  <View
                    style={tw.style('px-2 py-0.5 rounded', m.role === 'OWNER' ? 'bg-amber-100' : 'bg-indigo-100')}
                  >
                    <Text
                      className={`text-[10px] font-bold ${m.role === 'OWNER' ? 'text-amber-800' : 'text-indigo-800'}`}
                    >
                      {m.role === 'OWNER' ? 'Sahip' : 'Düzenleyici'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Panel>
    </Overlay>
  );
};
