import React, { useState } from 'react';
import { View } from 'react-native';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CheckSquare,
  Lock,
  Palette,
  ShoppingCart,
  StickyNote,
  Users,
  X,
} from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { AppList } from '../types';
import { Btn, Grid, Input, Overlay, Panel, Text } from './ui';

const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

interface EditListModalProps {
  list: AppList;
  onClose: () => void;
}

export const EditListModal: React.FC<EditListModalProps> = ({ list, onClose }) => {
  const { updateList, users, currentUser } = useAppStore();

  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || '');
  const [selectedColor, setSelectedColor] = useState(list.color || COLORS[0]);
  const [isShared, setIsShared] = useState<boolean>(list.isShared !== false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 2) {
      setError('Liste başlığı en az 2 karakter olmalıdır.');
      return;
    }

    const isOwner = list.ownerId === currentUser.id;

    const updates: Partial<AppList> = {
      title: cleanTitle,
      description: description.trim() || undefined,
      color: selectedColor,
    };

    if (isOwner && isShared !== (list.isShared !== false)) {
      updates.isShared = isShared;
      if (isShared) {
        const familyUsers = users.filter(
          (u) => u.familyId && currentUser.familyId && u.familyId === currentUser.familyId,
        );
        updates.familyId = currentUser.familyId;
        updates.members = (familyUsers.length > 0 ? familyUsers : [currentUser]).map((u) => ({
          userId: u.id,
          role: (u.id === currentUser.id ? 'OWNER' : 'EDITOR') as 'OWNER' | 'EDITOR',
          joinedAt: new Date().toISOString().split('T')[0],
        }));
      } else {
        updates.familyId = undefined;
        updates.members = list.members.filter((m) => m.userId === currentUser.id);
      }
    }

    updateList(list.id, updates);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const getTypeIcon = () => {
    const props = { size: 16, color: selectedColor };
    switch (list.type) {
      case 'SHOPPING':
        return <ShoppingCart {...props} />;
      case 'TODO':
        return <CheckSquare {...props} />;
      case 'NOTE':
        return <StickyNote {...props} />;
    }
  };

  const getTypeName = () => {
    switch (list.type) {
      case 'SHOPPING':
        return 'Alışveriş Listesi';
      case 'TODO':
        return 'Yapılacaklar Listesi';
      case 'NOTE':
        return 'Not Defteri';
    }
  };

  return (
    <Overlay onClose={onClose}>
      <Panel className="bg-white rounded-3xl max-w-md w-full self-center shadow-2xl border border-slate-100 overflow-hidden">
        <View style={tw`p-5`}>
          <Btn
            onPress={onClose}
            accessibilityLabel="Kapat"
            className="absolute top-4 right-4 p-1.5 rounded-full z-10"
          >
            <X {...ic('w-5 h-5 text-slate-400')} />
          </Btn>

          {/* Top Accent Strip */}
          <View
            style={[tw`h-1.5 w-full rounded-t-3xl absolute top-0 left-0 right-0`, { backgroundColor: selectedColor }]}
          />

          <View style={tw`flex-row items-center gap-2 mb-1 pt-1`}>
            <View
              style={[
                tw`p-1.5 rounded-xl border`,
                { backgroundColor: `${selectedColor}15`, borderColor: `${selectedColor}30` },
              ]}
            >
              {getTypeIcon()}
            </View>
            <View style={tw`flex-1 pr-6`}>
              <Text className="text-base font-bold text-slate-900 leading-tight">Listeyi Düzenle</Text>
              <Text className="text-xs text-slate-500">
                {getTypeName()} • Başlık, tema rengi ve paylaşım ayarları
              </Text>
            </View>
          </View>

          {success ? (
            <View
              style={tw`my-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex-row items-center gap-2`}
            >
              <CheckCircle2 {...ic('w-4 h-4 text-emerald-600')} />
              <Text className="flex-1 text-emerald-900 text-xs font-semibold">Liste ve renk teması güncellendi!</Text>
            </View>
          ) : null}

          {error ? (
            <View style={tw`my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex-row items-start gap-2`}>
              <View style={tw`mt-0.5`}>
                <AlertCircle {...ic('w-4 h-4 text-rose-600')} />
              </View>
              <Text className="flex-1 text-rose-800 text-xs font-semibold">{error}</Text>
            </View>
          ) : null}

          <View style={tw`gap-4 mt-3`}>
            {/* Title */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 mb-1">Liste Başlığı *</Text>
              <Input
                autoFocus
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 mb-1">
                Açıklama / Not <Text className="text-xs text-slate-400 font-normal">(İsteğe Bağlı)</Text>
              </Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Açıklama giriniz..."
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </View>

            {/* Color Theme Selector */}
            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Palette size={14} color={selectedColor} />
                  <Text className="text-xs font-semibold text-slate-700">Liste Tema Rengi:</Text>
                </View>
                <View
                  style={[
                    tw`w-4 h-4 rounded-full border shadow-sm`,
                    { backgroundColor: selectedColor, borderColor: selectedColor },
                  ]}
                />
              </View>
              <View
                style={tw`flex-row items-center gap-2 flex-wrap p-2 bg-slate-50 rounded-2xl border border-slate-200`}
              >
                {COLORS.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <Btn
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full items-center justify-center ${active ? 'shadow-sm' : 'opacity-75'}`}
                      style={[{ backgroundColor: c }, active ? { transform: [{ scale: 1.2 }] } : null]}
                    >
                      {active ? (
                        <>
                          {/* ring-2 ring-offset-2 ring-slate-800 */}
                          <View
                            pointerEvents="none"
                            style={[
                              tw`absolute rounded-full border-2 border-slate-800`,
                              { top: -4, left: -4, right: -4, bottom: -4 },
                            ]}
                          />
                          <Check {...ic('w-4 h-4 text-white')} />
                        </>
                      ) : null}
                    </Btn>
                  );
                })}
              </View>
            </View>

            {/* Scope Selection */}
            {list.ownerId === currentUser.id ? (
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1.5">Paylaşım Kapsamı</Text>
                <Grid cols={2} gap={2}>
                  <Btn
                    onPress={() => setIsShared(true)}
                    className={`p-2.5 rounded-2xl border flex-row items-start gap-2 ${
                      isShared ? 'border-sky-500 bg-sky-50/60' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <View style={tw`p-1 bg-sky-100 rounded-lg mt-0.5`}>
                      <Users {...ic('w-3.5 h-3.5 text-sky-700')} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text className="font-bold text-xs text-slate-900">Ortak / Aile</Text>
                      <Text className="text-[10px] text-slate-500">Aile üyeleriyle ortak</Text>
                    </View>
                  </Btn>

                  <Btn
                    onPress={() => setIsShared(false)}
                    className={`p-2.5 rounded-2xl border flex-row items-start gap-2 ${
                      !isShared ? 'border-purple-500 bg-purple-50/60' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <View style={tw`p-1 bg-purple-100 rounded-lg mt-0.5`}>
                      <Lock {...ic('w-3.5 h-3.5 text-purple-700')} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text className="font-bold text-xs text-slate-900">Kişisel Özel</Text>
                      <Text className="text-[10px] text-slate-500">Sadece siz</Text>
                    </View>
                  </Btn>
                </Grid>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={tw`flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100`}>
              <Btn onPress={onClose} className="px-4 py-2.5 rounded-xl">
                <Text className="text-xs font-semibold text-slate-600">İptal</Text>
              </Btn>
              <Btn
                onPress={handleSubmit}
                style={{ backgroundColor: selectedColor }}
                className="px-4 py-2.5 rounded-xl shadow-xs"
              >
                <Text className="text-xs font-bold text-white">Kaydet</Text>
              </Btn>
            </View>
          </View>
        </View>
      </Panel>
    </Overlay>
  );
};
