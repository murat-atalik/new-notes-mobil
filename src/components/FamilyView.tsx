import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import {
  AlertTriangle,
  Check,
  Copy,
  Edit2,
  Home,
  KeyRound,
  LogOut,
  PiggyBank,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';

import { copyToClipboard, shareText as nativeShare } from '../lib/native';
import { isFamilyListForUser } from '../lib/permissions';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { AppList } from '../types';
import { ListCard } from './ListCard';
import { Btn, Gradient, Grid, Input, Overlay, Text } from './ui';
import { UserAvatar } from './UserAvatar';

// `font-mono` is not supported by twrnc.
const MONO = { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' };

interface FamilyViewProps {
  onOpenInvite: (list: AppList) => void;
  onOpenCreateModal: () => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({ onOpenInvite, onOpenCreateModal }) => {
  const {
    lists,
    currentUser,
    users,
    expenses,
    savingsGoals,
    isSyncing,
    syncWithServer,
    joinFamilyByCode,
    updateFamilyName,
    leaveFamilyToPersonal,
    createFamily,
  } = useAppStore();

  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState(currentUser.familyName || `${currentUser.name} Ailesi`);

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFamilyNameInput, setCreateFamilyNameInput] = useState('');

  // Active family members: Users with the same familyId
  const activeFamilyId = currentUser.familyId || `fam_${currentUser.username || currentUser.id}`;
  const familyMembers = users.filter((u) => (u.familyId && u.familyId === activeFamilyId) || u.id === currentUser.id);

  // Lists that belong to this family or shared with family
  const familyLists = lists.filter((l) => isFamilyListForUser(l, currentUser));

  // Calculate family metrics strictly for this family
  const currentMonth = new Date().toISOString().substring(0, 7);
  const familyMonthExpenses = expenses
    .filter((e) => {
      const isThisFamilyExpense =
        (e.familyId && e.familyId === activeFamilyId && e.isShared !== false) ||
        (e.userId === currentUser.id && e.isShared !== false) ||
        (e.sharedWith && e.sharedWith.includes(currentUser.id));
      return isThisFamilyExpense && e.date.startsWith(currentMonth);
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const familySavingsTotal = savingsGoals
    .filter((s) => {
      return (
        (s.familyId && s.familyId === activeFamilyId && s.isShared !== false) ||
        (s.userId === currentUser.id && s.isShared !== false) ||
        (s.sharedWith && s.sharedWith.includes(currentUser.id))
      );
    })
    .reduce((sum, s) => sum + (s.currentAmount || 0), 0);

  const handleCopyCode = () => {
    if (!currentUser.familyCode) return;
    copyToClipboard(currentUser.familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    if (!currentUser.familyCode) return;
    const shareText = `Merhaba! "${currentUser.familyName || 'Ailemiz'}" aile listelerimize ve bütçemize katılmak için Aile Kodumuz: ${currentUser.familyCode}`;
    // navigator.share is always available on native.
    nativeShare({
      title: `${currentUser.familyName || 'Ailemiz'} - Akıllı Liste`,
      text: shareText,
    }).catch(() => {});
  };

  const handleSaveFamilyName = async () => {
    if (newFamilyName.trim()) {
      setIsEditingName(false);
      await updateFamilyName(newFamilyName.trim());
      setJoinMessage({ text: 'Aile adı başarıyla güncellendi.', type: 'success' });
      setTimeout(() => setJoinMessage(null), 4000);
    }
  };

  const handleJoinFamily = async () => {
    const code = familyCodeInput.trim();
    if (!code) return;

    setIsSubmitting(true);
    try {
      const res = await joinFamilyByCode(code);
      if (res.success) {
        setJoinMessage({ text: res.message, type: 'success' });
        setFamilyCodeInput('');
        setTimeout(() => setJoinMessage(null), 5000);
      } else {
        setJoinMessage({ text: res.message, type: 'error' });
      }
    } catch (err: unknown) {
      setJoinMessage({
        text: (err as { message?: string } | null)?.message || 'Aileye katılırken bir sorun oluştu.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLeaveFamily = async () => {
    setShowLeaveModal(false);
    await leaveFamilyToPersonal();
    setJoinMessage({
      text: 'Aileden ayrıldınız ve bağımsız kişisel alanınıza geçtiniz. Veriler güncellendi.',
      type: 'success',
    });
    setTimeout(() => setJoinMessage(null), 5000);
  };

  const handleCreateNewFamilySubmit = async () => {
    const name = createFamilyNameInput.trim();
    if (!name) return;

    setShowCreateModal(false);
    setCreateFamilyNameInput('');
    const newCode = await createFamily(name);
    setJoinMessage({
      text: `"${name}" ailesi oluşturuldu! Yeni Aile Kodunuz: ${newCode}`,
      type: 'success',
    });
    setTimeout(() => setJoinMessage(null), 5000);
  };

  return (
    <View style={tw`gap-4`}>
      {/* Feedback Notification Toast */}
      {joinMessage && (
        <View
          style={tw.style(
            'pl-4 pr-1.5 py-1.5 min-h-12 rounded-2xl border flex-row items-center justify-between gap-2 shadow-sm',
            joinMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
          )}
        >
          <View style={tw`flex-row items-center gap-2 flex-1`}>
            {joinMessage.type === 'success' ? (
              <Check {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            ) : (
              <AlertTriangle {...ic('w-4 h-4 text-rose-600 dark:text-rose-400')} />
            )}
            <Text
              className={`flex-1 text-xs font-semibold ${
                joinMessage.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
              }`}
            >
              {joinMessage.text}
            </Text>
          </View>
          <Btn onPress={() => setJoinMessage(null)} accessibilityLabel="Kapat" className="w-9 h-9 rounded-full items-center justify-center">
            <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
          </Btn>
        </View>
      )}

      {/* Family Main Hub Header Card */}
      <Gradient
        dir="br"
        colors={['slate-900', 'indigo-950', 'slate-900']}
        className="rounded-3xl p-4 shadow-lg overflow-hidden"
      >
        {/* Web uses blur-3xl on this glow; RN has no blur, so it is rendered fainter. */}
        <View pointerEvents="none" style={tw`absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/5 rounded-full`} />

        <View style={tw`gap-3.5`}>
          {/* Family Title & Actions */}
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
              <View
                style={tw`w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 items-center justify-center shrink-0`}
              >
                <Home {...ic('w-6 h-6 text-emerald-300')} />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                {isEditingName ? (
                  <View style={tw`flex-row items-center gap-1.5 mt-0.5`}>
                    <Input
                      value={newFamilyName}
                      onChangeText={setNewFamilyName}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveFamilyName}
                      autoCapitalize="words"
                      className="flex-1 min-w-0 h-10 px-3 text-[16px] bg-white/20 border border-white/30 rounded-xl text-white dark:text-white font-bold"
                    />
                    <Btn onPress={handleSaveFamilyName} className="px-3 h-10 justify-center bg-emerald-500 rounded-xl">
                      <Text className="text-white text-xs font-bold">Kaydet</Text>
                    </Btn>
                    <Btn onPress={() => setIsEditingName(false)} className="px-2 h-10 justify-center">
                      <Text className="text-slate-300 text-xs">İptal</Text>
                    </Btn>
                  </View>
                ) : (
                  <View style={tw`flex-row items-center gap-2`}>
                    <Text className="font-black text-white dark:text-white text-base tracking-tight flex-shrink" numberOfLines={1}>
                      {currentUser.familyName || `${currentUser.name} Ailesi`}
                    </Text>
                    <Btn
                      onPress={() => {
                        setNewFamilyName(currentUser.familyName || `${currentUser.name} Ailesi`);
                        setIsEditingName(true);
                      }}
                      accessibilityLabel="Aile Adını Değiştir"
                      className="w-9 h-9 -my-2 items-center justify-center"
                    >
                      <Edit2 {...ic('w-4 h-4 text-slate-400')} />
                    </Btn>
                  </View>
                )}
                <View style={tw`mt-0.5 flex-row items-center gap-1`}>
                  <Sparkles {...ic('w-3 h-3 text-amber-400')} />
                  <Text className="flex-1 text-[11px] text-indigo-200/80">Ortak Aile Yaşamı & Eşzamanlı Listeler</Text>
                </View>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-2 shrink-0`}>
              <Btn
                onPress={() => syncWithServer(false)}
                disabled={isSyncing}
                accessibilityLabel="Tüm aile verilerini yenile"
                className="w-10 h-10 bg-white/10 rounded-xl border border-white/15 flex-row items-center justify-center gap-1.5"
              >
                <RefreshCw {...ic(`w-4 h-4 ${isSyncing ? 'text-emerald-400' : 'text-indigo-200'}`)} />
                <Text className="hidden sm:flex text-indigo-200 text-xs font-semibold">
                  {isSyncing ? 'Yenileniyor...' : 'Yenile'}
                </Text>
              </Btn>
              <Btn
                onPress={() => setShowCreateModal(true)}
                accessibilityLabel="Yeni Aile Kur"
                className="w-10 h-10 bg-white/10 rounded-xl border border-white/15 flex-row items-center justify-center gap-1"
              >
                <Plus {...ic('w-4 h-4 text-indigo-200')} />
                <Text className="hidden sm:flex text-indigo-200 text-xs font-semibold">Yeni Aile</Text>
              </Btn>
              <Btn
                onPress={onOpenCreateModal}
                className="px-3 h-10 bg-emerald-500 rounded-xl shadow-sm flex-row items-center gap-1"
              >
                <Plus {...ic('w-3.5 h-3.5 text-white')} />
                <Text className="text-white text-xs font-bold">Aile Listesi</Text>
              </Btn>
            </View>
          </View>

          {/* Family Code Sharing Box */}
          <View style={tw`bg-white/10 rounded-2xl p-4 border border-white/15 flex-col items-start justify-between gap-3`}>
            <View>
              <Text className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Aile Katılım Kodu</Text>
              <Text className="font-mono font-black text-emerald-300 text-base tracking-widest mt-0.5" style={MONO}>
                {currentUser.familyCode || 'AIL-0001'}
              </Text>
              <Text className="text-[10px] text-slate-300 mt-1">
                Bu kodu eşiniz veya aile bireylerinizle paylaşarak onları aileye dahil edin.
              </Text>
            </View>

            <View style={tw`flex-row items-center gap-2 w-full`}>
              <Btn
                onPress={handleCopyCode}
                className="flex-1 px-3 h-11 bg-white/20 rounded-xl flex-row items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check {...ic('w-4 h-4 text-emerald-400')} /> : <Copy {...ic('w-4 h-4 text-white')} />}
                <Text className="text-white text-xs font-bold">{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</Text>
              </Btn>
              <Btn
                onPress={handleShareCode}
                accessibilityLabel="Paylaş"
                className="px-4 h-11 bg-emerald-500 rounded-xl flex-row items-center justify-center gap-1.5"
              >
                <Share2 {...ic('w-4 h-4 text-white')} />
                <Text className="text-white text-xs font-bold">Paylaş</Text>
              </Btn>
            </View>
          </View>

          {/* Family Quick Glance Metrics */}
          <Grid cols={2} gap={2} className="pt-1">
            <View style={tw`bg-white/5 rounded-xl p-3 border border-white/10`}>
              <View style={tw`flex-row items-center gap-1`}>
                <ShoppingBag {...ic('w-3.5 h-3.5 text-amber-400')} />
                <Text className="flex-1 text-[11px] text-indigo-200" numberOfLines={1}>
                  Bu Ay Aile Harcaması
                </Text>
              </View>
              <Text className="text-sm font-bold text-white dark:text-white mt-1" numberOfLines={1} adjustsFontSizeToFit>
                {familyMonthExpenses.toLocaleString('tr-TR')} ₺
              </Text>
            </View>

            <View style={tw`bg-white/5 rounded-xl p-3 border border-white/10`}>
              <View style={tw`flex-row items-center gap-1`}>
                <PiggyBank {...ic('w-3.5 h-3.5 text-emerald-400')} />
                <Text className="flex-1 text-[11px] text-indigo-200" numberOfLines={1}>
                  Aile Birikim Varlıkları
                </Text>
              </View>
              <Text className="text-sm font-bold text-white dark:text-white mt-1" numberOfLines={1} adjustsFontSizeToFit>
                {familySavingsTotal.toLocaleString('tr-TR')} ₺
              </Text>
            </View>
          </Grid>
        </View>
      </Gradient>

      {/* Family Members Card */}
      <View style={tw`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center gap-1.5 flex-1 min-w-0`}>
            <Users {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-shrink" numberOfLines={1}>
              Aile Üyelerimiz ({familyMembers.length})
            </Text>
          </View>
          <View style={tw`flex-row items-center gap-2`}>
            <View style={tw`flex-row items-center gap-1`}>
              <ShieldCheck {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
              <Text className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Eşzamanlı</Text>
            </View>
            <Btn
              onPress={() => setShowLeaveModal(true)}
              accessibilityLabel="Aileden Ayrıl"
              className="flex-row items-center gap-1 px-2.5 h-9 -my-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60"
            >
              <LogOut {...ic('w-3 h-3 text-rose-600 dark:text-rose-400')} />
              <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Aileden Ayrıl</Text>
            </Btn>
          </View>
        </View>

        <View style={tw`gap-2.5`}>
          {familyMembers.map((member) => (
            <View
              key={member.id}
              style={tw.style(
                'p-3 rounded-2xl border flex-row items-center justify-between gap-3',
                currentUser.id === member.id
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80',
              )}
            >
              <View style={tw`flex-row items-center gap-2.5 min-w-0 flex-1`}>
                <UserAvatar avatar={member.avatar} name={member.name} color={member.color} size="sm" />
                <View style={tw`min-w-0 flex-1`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-xs" numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    @{member.username}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row items-center gap-1`}>
                {member.familyRole === 'HEAD' && (
                  <View style={tw`px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950`}>
                    <Text className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">Kurucu</Text>
                  </View>
                )}
                {currentUser.id === member.id && (
                  <View style={tw`px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950`}>
                    <Text className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">Sen</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Join Another Family or Switch Family Form */}
      <View
        style={tw`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm gap-3`}
      >
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
            <KeyRound {...ic('w-4 h-4 text-indigo-600 dark:text-indigo-400')} />
          </View>
          <View style={tw`flex-1`}>
            <Text className="text-xs font-bold text-slate-900 dark:text-white">Aile Koduna Katıl / Aile Değiştir</Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Eşinizin veya yakınınızın paylaştığı Aile Kodunu girerek anında o aileye dahil olun.
            </Text>
          </View>
        </View>

        <View style={tw`flex-row gap-2`}>
          <Input
            value={familyCodeInput}
            onChangeText={(text) => setFamilyCodeInput(text.toUpperCase())}
            placeholder="Örn: AIL-DEM7291"
            autoCapitalize="characters"
            style={MONO}
            returnKeyType="go"
            autoCorrect={false}
            onSubmitEditing={handleJoinFamily}
            className="flex-1 h-12 px-4 text-[16px] font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
          />
          <Btn
            onPress={handleJoinFamily}
            disabled={isSubmitting}
            className="px-4 h-12 bg-indigo-600 rounded-2xl shadow-sm shrink-0 flex-row items-center gap-1.5"
          >
            {isSubmitting ? (
              <RefreshCw {...ic('w-4 h-4 text-white')} />
            ) : (
              <UserPlus {...ic('w-4 h-4 text-white')} />
            )}
            <Text className="text-white font-bold text-xs">{isSubmitting ? 'Katılınıyor...' : 'Aileye Katıl'}</Text>
          </Btn>
        </View>
      </View>

      {/* Family Shared Lists Grid */}
      <View style={tw`gap-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center gap-1.5 flex-1 min-w-0`}>
            <Home {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
            <Text className="font-bold text-slate-900 dark:text-white text-sm flex-shrink" numberOfLines={1}>
              Ailemizin Ortak Listeleri ({familyLists.length})
            </Text>
          </View>
          <Btn onPress={onOpenCreateModal} className="px-2 h-10 -my-2 justify-center">
            <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+ Yeni Liste</Text>
          </Btn>
        </View>

        {familyLists.length > 0 ? (
          <View style={tw`gap-4`}>
            {familyLists.map((list) => (
              <ListCard key={list.id} list={list} onOpenInvite={onOpenInvite} />
            ))}
          </View>
        ) : (
          <View
            style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 items-center`}
          >
            <View
              style={tw`w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center self-center mb-3`}
            >
              <Home {...ic('w-6 h-6 text-indigo-600 dark:text-indigo-400')} />
            </View>
            <Text className="font-bold text-slate-900 dark:text-white text-sm mb-1 text-center">
              Henüz Aile Listeniz Yok
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 text-center">
              Mutfak alışverişi, ev ihtiyaçları veya ailece yapılacak işler için ilk aile listenizi oluşturun.
            </Text>
            <Btn
              onPress={onOpenCreateModal}
              className="px-5 h-12 bg-emerald-600 rounded-2xl shadow-sm flex-row items-center justify-center self-center gap-1.5"
            >
              <Plus {...ic('w-4 h-4 text-white')} />
              <Text className="text-white text-sm font-bold">İlk Aile Listesini Aç</Text>
            </Btn>
          </View>
        )}
      </View>

      {/* Leave Family Confirmation Modal */}
      {showLeaveModal && (
        <Overlay onClose={() => setShowLeaveModal(false)} position="center">
          <View
            style={tw`w-full max-w-md self-center bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 gap-4`}
          >
            <View
              style={tw`w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center self-center`}
            >
              <LogOut {...ic('w-6 h-6 text-rose-600 dark:text-rose-400')} />
            </View>

            <View style={tw`items-center gap-1.5`}>
              <Text className="font-bold text-slate-900 dark:text-white text-base text-center">
                Aileden Ayrılmak İstiyor Musunuz?
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                "{currentUser.familyName || 'Aile'}" grubundan ayrıldığınızda bu ailenin ortak listeleri ve harcama
                kayıtları ekranınızdan kaldırılır. Kendi oluşturduğunuz şahsi listeleriniz ise korunur.
              </Text>
            </View>

            <View
              style={tw`flex-row items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}
            >
              <Btn
                onPress={() => setShowLeaveModal(false)}
                className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vazgeç</Text>
              </Btn>
              <Btn
                onPress={handleConfirmLeaveFamily}
                className="flex-1 h-12 bg-rose-600 rounded-2xl shadow-sm items-center justify-center"
              >
                <Text className="text-sm font-bold text-white">Evet, Aileden Ayrıl</Text>
              </Btn>
            </View>
          </View>
        </Overlay>
      )}

      {/* Create New Family Modal */}
      {showCreateModal && (
        <Overlay onClose={() => setShowCreateModal(false)}>
          <View
            style={tw`w-full max-w-md self-center bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 gap-4`}
          >
            <Btn
              onPress={() => setShowCreateModal(false)}
              accessibilityLabel="Kapat"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center z-10"
            >
              <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
            </Btn>

            <View style={tw`flex-row items-center gap-3 pr-10`}>
              <View style={tw`w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center`}>
                <Home {...ic('w-5 h-5 text-indigo-600 dark:text-indigo-400')} />
              </View>
              <View style={tw`flex-1`}>
                <Text className="font-bold text-slate-900 dark:text-white text-sm">Yeni Aile Oluştur</Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ailenize özel bir isim verin ve yeni bir Aile Kodu oluşturun.
                </Text>
              </View>
            </View>

            <View style={tw`gap-4 pt-1`}>
              <View>
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Aile Adı</Text>
                <Input
                  autoFocus
                  value={createFamilyNameInput}
                  onChangeText={setCreateFamilyNameInput}
                  placeholder="Örn: Yılmaz Ailesi"
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleCreateNewFamilySubmit}
                  className="w-full h-12 px-4 text-[16px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white"
                />
              </View>

              <View
                style={tw`flex-row items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800`}
              >
                <Btn
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">İptal</Text>
                </Btn>
                <Btn
                  onPress={handleCreateNewFamilySubmit}
                  className="flex-1 h-12 bg-indigo-600 rounded-2xl shadow-sm items-center justify-center"
                >
                  <Text className="text-sm font-bold text-white">Aileyi Oluştur</Text>
                </Btn>
              </View>
            </View>
          </View>
        </Overlay>
      )}
    </View>
  );
};
