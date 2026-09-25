import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Copy, Crown, LogIn, LogOut, Pencil, Plus, Share2 } from 'lucide-react-native';

import { Badge, Btn, EmptyState, Gradient, ListGroup, palette, ProgressBar, Row, Screen, Section, Text, UserAvatar, confirmAction, showToast } from '../../design';
import { listProgress, roomProgress } from '../../logic/selectors';
import { copyToClipboard, shareText } from '../../lib/native';
import { isFamilyListForUser } from '../../lib/permissions';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

export const FamilyScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const user = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const lists = useAppStore((s) => s.lists);
  const items = useAppStore((s) => s.items);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const leaveFamilyToPersonal = useAppStore((s) => s.leaveFamilyToPersonal);
  const [refreshing, setRefreshing] = useState(false);

  const familyName = user.familyName || `${user.name} Ailesi`;
  const isHead = user.familyRole !== 'MEMBER';
  const code = user.familyCode || '';

  const members = useMemo(() => {
    const others = users.filter((u) => u.id !== user.id && !!u.familyId && u.familyId === user.familyId);
    const sorted = others.sort((a, b) => (a.familyRole === 'HEAD' ? -1 : b.familyRole === 'HEAD' ? 1 : a.name.localeCompare(b.name, 'tr')));
    return [user, ...sorted];
  }, [users, user]);

  const familyLists = useMemo(() => lists.filter((l) => !l.isArchived && isFamilyListForUser(l, user)), [lists, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    await copyToClipboard(code);
    showToast('Aile kodu kopyalandı');
  };

  const shareCode = async () => {
    if (!code) return;
    await shareText({
      title: `${familyName} - Akıllı Liste`,
      text:
        `Merhaba! "${familyName}" ailesine katıl, listelerimizi ve bütçemizi birlikte yönetelim.\n\n` +
        `Aile Kodumuz: ${code}\n\n` +
        'Akıllı Liste uygulamasında Aile sekmesine gir, "Aileye Katıl"a dokun ve bu kodu yaz.',
    });
  };

  const leave = () =>
    confirmAction({
      title: 'Aileden ayrıl',
      message: `"${familyName}" ailesinden ayrıldığında ortak listeler ve harcamalar ekranından kaldırılır. Kişisel listelerin korunur.`,
      confirmText: 'Ayrıl',
      onConfirm: async () => {
        await leaveFamilyToPersonal();
        showToast('Aileden ayrıldın, artık kendi ailen var');
      },
    });

  return (
    <Screen title="Ailem" subtitle={familyName} refreshing={refreshing} onRefresh={onRefresh}>
      <Gradient colors={['indigo-500', 'violet-600']} dir="br" className="rounded-3xl p-5 gap-4">
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1 min-w-0`}>
            <Text variant="title" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
              {familyName}
            </Text>
            <Text variant="subhead" className="text-white/80">
              {`${members.length} üye`}
            </Text>
          </View>
          <View style={tw`flex-row items-center gap-1 px-2.5 h-7 rounded-full bg-white/20`}>
            {isHead ? <Crown size={13} color="#fff" /> : null}
            <Text variant="caption" tone="inverse" weight="bold">
              {isHead ? 'Aile Reisi' : 'Üye'}
            </Text>
          </View>
        </View>
        <View style={tw`gap-1`}>
          <Text variant="overline" className="text-white/70">
            Aile Kodu
          </Text>
          <Text variant="amount" tone="inverse" selectable numberOfLines={1} adjustsFontSizeToFit>
            {code || '—'}
          </Text>
        </View>
        <View style={tw`flex-row gap-3`}>
          <Btn onPress={copyCode} disabled={!code} className="flex-1 h-11 rounded-xl bg-white/20 flex-row items-center justify-center gap-2">
            <Copy size={18} color="#fff" />
            <Text variant="headline" tone="inverse">
              Kopyala
            </Text>
          </Btn>
          <Btn onPress={shareCode} disabled={!code} className="flex-1 h-11 rounded-xl bg-white flex-row items-center justify-center gap-2">
            <Share2 size={18} color={palette.info} />
            <Text variant="headline" tone="info">
              Paylaş
            </Text>
          </Btn>
        </View>
      </Gradient>

      <ListGroup header="Üyeler" footer={members.length === 1 ? 'Aile kodunu paylaşarak ailene üye ekleyebilirsin.' : undefined}>
        {members.map((m) => (
          <Row
            key={m.id}
            left={<UserAvatar avatar={m.avatar} name={m.name} color={m.color} size="md" />}
            title={m.name}
            subtitle={`@${m.username}`}
            right={
              <View style={tw`flex-row items-center gap-1.5`}>
                {m.id === user.id ? <Badge label="Sen" tone="brand" /> : null}
                <Badge label={m.familyRole === 'MEMBER' ? 'Üye' : 'Aile Reisi'} tone={m.familyRole === 'MEMBER' ? 'neutral' : 'info'} />
              </View>
            }
          />
        ))}
      </ListGroup>

      <Section title="Aile listeleri">
        {familyLists.length ? (
          <ListGroup>
            {familyLists.map((l) => {
              const listItems = items.filter((i) => i.listId === l.id);
              const p = listProgress(listItems);
              // Rooms are funded (₺), not checked off item by item — show that percentage instead.
              const percent = l.type === 'ROOM' ? roomProgress(listItems).percent : p.percent;
              return (
                <Row
                  key={l.id}
                  icon={l.icon}
                  iconColor={l.color}
                  title={l.title}
                  right={
                    <View style={tw`w-20 gap-1 items-end`}>
                      <Text variant="caption" tone="muted">
                        {`${p.done}/${p.total}`}
                      </Text>
                      <View style={tw`w-full`}>
                        <ProgressBar value={percent} color={l.color} height={5} />
                      </View>
                    </View>
                  }
                  onPress={() => navigation.navigate('ListDetail', { listId: l.id })}
                />
              );
            })}
          </ListGroup>
        ) : (
          <EmptyState
            emoji="👨‍👩‍👧"
            title="Henüz ortak liste yok"
            message="Ortak bir liste oluştur, ailendeki herkes görsün."
            action={{ label: 'Liste oluştur', icon: Plus, onPress: () => navigation.navigate('ListForm', {}) }}
          />
        )}
      </Section>

      <ListGroup header="İşlemler">
        <Row icon={LogIn} iconColor={palette.info} title="Aileye Katıl" subtitle="Aile koduyla başka bir aileye katıl" onPress={() => navigation.navigate('FamilyJoin')} />
        {isHead ? (
          <Row icon={Pencil} iconColor={palette.brandLight} title="Aile Adını Değiştir" onPress={() => navigation.navigate('FamilyEdit', { mode: 'rename' })} />
        ) : null}
        <Row icon={Plus} iconColor="#8b5cf6" title="Yeni Aile Kur" onPress={() => navigation.navigate('FamilyEdit', { mode: 'create' })} />
        {!isHead ? <Row icon={LogOut} destructive title="Aileden Ayrıl" onPress={leave} chevron={false} /> : null}
      </ListGroup>
    </Screen>
  );
};
