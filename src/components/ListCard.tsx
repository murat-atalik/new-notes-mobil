import React, { useState } from 'react';
import { View } from 'react-native';
import {
  ArrowRight,
  CheckSquare,
  Lock,
  Pencil,
  Share2,
  ShoppingCart,
  StickyNote,
  Trash2,
  User,
  Users,
} from 'lucide-react-native';

import { useRouter } from '../lib/router';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { AppList } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { EditListModal } from './EditListModal';
import { Btn, Text } from './ui';
import { UserAvatar } from './UserAvatar';

interface ListCardProps {
  list: AppList;
  onOpenInvite: (list: AppList) => void;
}

export const ListCard: React.FC<ListCardProps> = ({ list, onOpenInvite }) => {
  const router = useRouter();
  const { items, setSelectedListId, users, deleteList, updateList, currentUser } = useAppStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const listColor = list.color || '#10b981';

  const listItems = items.filter((i) => i.listId === list.id);
  const totalItems = listItems.length;
  const completedItems = listItems.filter((i) => i.isCompleted).length;
  const pendingItems = totalItems - completedItems;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate total price if shopping list
  const totalPrice = listItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const purchasedPrice = listItems
    .filter((i) => i.isCompleted)
    .reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

  // List members
  const memberUsers = list.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean);

  const isOwner = list.ownerId === currentUser.id;
  const isShared = list.isShared !== false;

  const handleToggleScope = () => {
    if (!isOwner) return;

    if (isShared) {
      // Convert to Personal (Only keep owner)
      updateList(list.id, {
        isShared: false,
        familyId: undefined,
        members: list.members.filter((m) => m.userId === currentUser.id),
      });
    } else {
      // Convert to Shared (Add all members in the current user's family)
      const familyUsers = users.filter(
        (u) => u.familyId && currentUser.familyId && u.familyId === currentUser.familyId,
      );
      const allFamilyMembers = (familyUsers.length > 0 ? familyUsers : [currentUser]).map((u) => ({
        userId: u.id,
        role: (u.id === currentUser.id ? 'OWNER' : 'EDITOR') as 'OWNER' | 'EDITOR',
        joinedAt: new Date().toISOString().split('T')[0],
      }));
      updateList(list.id, {
        isShared: true,
        familyId: currentUser.familyId,
        members: allFamilyMembers,
      });
    }
  };

  const getTypeIcon = () => {
    const props = { size: 14, color: listColor };
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
        return 'Alışveriş';
      case 'TODO':
        return 'Yapılacaklar';
      case 'NOTE':
        return 'Notlar';
    }
  };

  const countBadgeText =
    pendingItems > 0
      ? 'text-amber-800 dark:text-amber-300'
      : totalItems > 0
        ? 'text-emerald-800 dark:text-emerald-300'
        : 'text-slate-600 dark:text-slate-400';

  return (
    <>
      <Btn
        onPress={() => {
          setSelectedListId(list.id);
          router.push(`/list/${list.id}`);
        }}
        className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 pt-5 shadow-xs flex-col justify-between overflow-hidden"
      >
        {/* Top Accent Strip with List Color */}
        <View style={[tw`h-1.5 w-full absolute top-0 left-0 right-0`, { backgroundColor: listColor }]} />

        <View>
          {/* Header: Type Badge, Scope Badge & Action Buttons */}
          <View style={tw`flex-row items-center justify-between mb-2.5 gap-2`}>
            <View style={tw`flex-row items-center gap-1.5 flex-wrap flex-1`}>
              <View
                style={[
                  tw`flex-row items-center self-start gap-1 px-2.5 py-0.5 rounded-full border shadow-sm`,
                  { backgroundColor: `${listColor}15`, borderColor: `${listColor}35` },
                ]}
              >
                {getTypeIcon()}
                <Text className="text-xs font-bold" style={{ color: listColor }}>
                  {getTypeName()}
                </Text>
              </View>

              {/* Scope Badge (Ortak vs Kişisel) */}
              <Btn
                onPress={handleToggleScope}
                accessibilityLabel={isOwner ? (isShared ? 'Tıkla: Kişisele çevir' : 'Tıkla: Ortak yap') : undefined}
                className={`flex-row items-center self-start gap-1 px-2 py-0.5 rounded-full border ${
                  isShared
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
                    : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
                }`}
              >
                {isShared ? (
                  <>
                    <Users {...ic('w-3 h-3 text-sky-600 dark:text-sky-400')} />
                    <Text className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Ortak</Text>
                  </>
                ) : (
                  <>
                    <Lock {...ic('w-3 h-3 text-purple-600 dark:text-purple-400')} />
                    <Text className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Kişisel</Text>
                  </>
                )}
              </Btn>

              {/* Item Count / Pending Items Badge */}
              <View
                style={tw.style(
                  'flex-row items-center self-start gap-1 px-2 py-0.5 rounded-full border',
                  pendingItems > 0
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                    : totalItems > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                )}
              >
                <Text className={`text-[11px] font-bold ${countBadgeText}`}>
                  {list.type === 'NOTE'
                    ? `${totalItems} not`
                    : totalItems === 0
                      ? '0 madde'
                      : pendingItems === 0
                        ? `${totalItems} tamam`
                        : `${pendingItems} bekleyen`}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-1 shrink-0`}>
              {/* Edit / Customize list button */}
              <Btn
                onPress={() => setShowEditModal(true)}
                accessibilityLabel="Listeyi ve Rengi Düzenle"
                className="p-1.5 rounded-lg"
              >
                <Pencil {...ic('w-3.5 h-3.5 text-slate-400')} />
              </Btn>

              <Btn
                onPress={() => onOpenInvite(list)}
                accessibilityLabel="Kullanıcı Davet Et / Paylaş"
                className="p-1.5 rounded-lg"
              >
                <Share2 {...ic('w-3.5 h-3.5 text-slate-400')} />
              </Btn>
              {isOwner ? (
                <Btn onPress={() => setShowDeleteModal(true)} accessibilityLabel="Listeyi Sil" className="p-1.5 rounded-lg">
                  <Trash2 {...ic('w-3.5 h-3.5 text-slate-400')} />
                </Btn>
              ) : null}
            </View>
          </View>

          {/* Title & Description */}
          <Text className="font-bold text-slate-900 dark:text-white text-base leading-snug">{list.title}</Text>
          {list.description ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed" numberOfLines={2}>
              {list.description}
            </Text>
          ) : null}
        </View>

        {/* Stats & Progress */}
        <View style={tw`mt-4 pt-3 border-t border-slate-100 dark:border-slate-800`}>
          {list.type === 'SHOPPING' ? (
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sepet:{' '}
                <Text className="text-xs text-slate-900 dark:text-white font-semibold">
                  {purchasedPrice.toLocaleString('tr-TR')} ₺
                </Text>
              </Text>
              <View style={tw`bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md`}>
                <Text className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                  Toplam: {totalPrice.toLocaleString('tr-TR')} ₺
                </Text>
              </View>
            </View>
          ) : null}

          {/* Progress Bar (Shopping, Todo, and Notes) */}
          <View style={tw`mb-2.5`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                {list.type === 'NOTE' ? `${totalItems} not kaydedildi` : `${completedItems} / ${totalItems} tamamlandı`}
              </Text>
              <Text
                className={`text-[11px] font-bold ${
                  progressPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                %{progressPercent}
              </Text>
            </View>
            <View
              style={tw`w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50`}
            >
              <View
                style={[
                  tw`h-full rounded-full shadow-xs`,
                  {
                    width: `${totalItems === 0 ? 0 : Math.max(progressPercent, 4)}%`,
                    backgroundColor: progressPercent === 100 ? '#10b981' : listColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Footer: Member avatars + Open Button */}
          <View style={tw`flex-row items-center justify-between mt-2`}>
            {/* Members with UserAvatar or Private indicator */}
            <View style={tw`flex-row items-center`}>
              {isShared ? (
                <>
                  {memberUsers.map((m, idx) => (
                    <View key={m?.id || idx} style={idx > 0 ? tw`-ml-1.5` : undefined}>
                      <UserAvatar
                        avatar={m?.avatar}
                        name={`${m?.name} (${list.ownerId === m?.id ? 'Sahip' : 'Düzenleyici'})`}
                        color={m?.color}
                        size="xs"
                        className="border-2 border-white dark:border-slate-900"
                      />
                    </View>
                  ))}
                  {list.members && list.members.length > 3 ? (
                    <View
                      style={tw`-ml-1.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 items-center justify-center`}
                    >
                      <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        +{list.members.length - 3}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={tw`flex-row items-center gap-1 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md`}>
                  <User {...ic('w-3 h-3 text-purple-700 dark:text-purple-300')} />
                  <Text className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Yalnızca Siz</Text>
                </View>
              )}
            </View>

            <View style={tw`flex-row items-center gap-1`}>
              <Text className="text-xs font-semibold" style={{ color: listColor }}>
                Görüntüle
              </Text>
              <ArrowRight size={14} color={listColor} />
            </View>
          </View>
        </View>

        {/* Bottom Progress Bar Strip attached to card edge */}
        <View style={tw`absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800/80 overflow-hidden`}>
          <View
            style={[
              tw`h-full`,
              {
                width: `${totalItems === 0 ? 0 : progressPercent}%`,
                backgroundColor: progressPercent === 100 ? '#10b981' : listColor,
              },
            ]}
          />
        </View>
      </Btn>

      {showEditModal ? <EditListModal list={list} onClose={() => setShowEditModal(false)} /> : null}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Listeyi Sil"
        message={
          <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">"{list.title}"</Text> listesini ve
            içindeki tüm maddeleri silmek istediğinize emin misiniz?
          </Text>
        }
        confirmText="Listeyi Sil"
        cancelText="Vazgeç"
        onConfirm={() => deleteList(list.id)}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
};
