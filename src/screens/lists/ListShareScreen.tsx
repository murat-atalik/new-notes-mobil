import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { AtSign, Copy, SearchX, Share2, UserMinus, UserPlus } from 'lucide-react-native';

import {
  Badge,
  Button,
  Card,
  confirmAction,
  EmptyState,
  FormScreen,
  IconButton,
  IconTile,
  ListGroup,
  palette,
  Row,
  showToast,
  SwitchRow,
  Text,
  TextField,
  UserAvatar,
} from '../../design';
import { copyToClipboard, shareText } from '../../lib/native';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListMember, User } from '../../types';

const ROLE_LABEL: Record<ListMember['role'], string> = { OWNER: 'Sahip', EDITOR: 'Düzenleyebilir' };

export const ListShareScreen: React.FC<RootScreenProps<'ListShare'>> = ({ route }) => {
  const { listId } = route.params;
  const list = useAppStore((s) => s.lists.find((l) => l.id === listId));
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const inviteUserToList = useAppStore((s) => s.inviteUserToList);
  const removeMemberFromList = useAppStore((s) => s.removeMemberFromList);
  const updateList = useAppStore((s) => s.updateList);

  const [username, setUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | undefined>();

  if (!list) {
    return (
      <FormScreen title="Paylaş & Davet">
        <EmptyState icon={SearchX} title="Liste bulunamadı" message="Bu liste silinmiş ya da erişimin kaldırılmış olabilir." />
      </FormScreen>
    );
  }

  const isOwner = list.ownerId === currentUser.id;
  const findUser = (id: string): User | undefined => (id === currentUser.id ? currentUser : users.find((u) => u.id === id));
  const members = [...list.members].sort((a, b) => {
    const ao = a.userId === list.ownerId || a.role === 'OWNER' ? 0 : 1;
    const bo = b.userId === list.ownerId || b.role === 'OWNER' ? 0 : 1;
    return ao - bo;
  });

  const code = list.inviteCode || '';

  const onCopy = async () => {
    await copyToClipboard(code);
    showToast('Davet kodu kopyalandı');
  };

  const onShare = () =>
    shareText({
      title: list.title,
      text: `"${list.title}" listeme katıl! Akıllı Liste uygulamasında Listeler › Kodla katıl bölümüne şu kodu gir: ${code}`,
    });

  const onInvite = async () => {
    const value = username.trim().replace(/^@/, '');
    if (!value) return;
    setInviting(true);
    setInviteError(undefined);
    try {
      const res = await inviteUserToList(list.id, value);
      if (res.success) {
        setUsername('');
        showToast(res.message || 'Kullanıcı listeye eklendi');
      } else {
        setInviteError(res.error || res.message || 'Kullanıcı davet edilemedi.');
      }
    } catch {
      setInviteError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setInviting(false);
    }
  };

  const onRemove = (user: User | undefined, userId: string) =>
    confirmAction({
      title: 'Üye çıkarılsın mı?',
      message: `${user?.name ?? 'Bu kullanıcı'} artık "${list.title}" listesini göremeyecek.`,
      confirmText: 'Çıkar',
      onConfirm: () => {
        removeMemberFromList(list.id, userId);
        showToast('Üye listeden çıkarıldı');
      },
    });

  return (
    <FormScreen title="Paylaş & Davet">
      <Card className="items-center gap-4 py-6">
        <View style={tw`flex-row items-center gap-2`}>
          <IconTile icon={list.icon} color={list.color} size="sm" />
          <Text variant="headline" numberOfLines={1}>
            {list.title}
          </Text>
        </View>
        <Text variant="overline" tone="muted">
          Davet kodu
        </Text>
        <Text
          selectable
          accessibilityLabel={`Davet kodu ${code.split('').join(' ')}`}
          className="text-[36px] leading-[44px] font-extrabold tracking-[6px] text-slate-900 dark:text-white"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
        >
          {code || '—'}
        </Text>
        <Text variant="footnote" tone="muted" className="text-center px-4">
          Bu kodu paylaş; kodu giren kişi listeye düzenleyici olarak katılır.
        </Text>
        <View style={tw`flex-row gap-3 self-stretch`}>
          <View style={tw`flex-1`}>
            <Button title="Kopyala" icon={Copy} variant="secondary" size="md" onPress={onCopy} disabled={!code} fullWidth />
          </View>
          <View style={tw`flex-1`}>
            <Button title="Paylaş" icon={Share2} variant="primary" size="md" onPress={onShare} disabled={!code} fullWidth />
          </View>
        </View>
      </Card>

      {isOwner ? (
        <View style={tw`gap-2`}>
          <TextField
            label="Kullanıcı adıyla davet et"
            icon={AtSign}
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (inviteError) setInviteError(undefined);
            }}
            placeholder="kullaniciadi"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={onInvite}
            error={inviteError}
          />
          <Button title="Davet Et" icon={UserPlus} variant="tinted" size="md" onPress={onInvite} loading={inviting} disabled={!username.trim()} />
        </View>
      ) : (
        <Text variant="footnote" tone="muted" className="px-1">
          Kullanıcı adıyla davet göndermek yalnızca liste sahibine açıktır. Davet kodunu paylaşarak da katılım sağlayabilirsin.
        </Text>
      )}

      <ListGroup header={`Üyeler (${members.length})`}>
        {members.map((m) => {
          const user = findUser(m.userId);
          const owner = m.userId === list.ownerId || m.role === 'OWNER';
          const isMe = m.userId === currentUser.id;
          return (
            <Row
              key={m.userId}
              title={`${user?.name ?? 'Bilinmeyen kullanıcı'}${isMe ? ' (Sen)' : ''}`}
              subtitle={user?.username ? `@${user.username}` : undefined}
              left={<UserAvatar avatar={user?.avatar} name={user?.name} color={user?.color} size="md" />}
              right={
                owner ? (
                  <Badge label="Sahip" tone="brand" />
                ) : isOwner && !isMe ? (
                  <View style={tw`flex-row items-center gap-2`}>
                    <Badge label={ROLE_LABEL[m.role]} />
                    <IconButton icon={UserMinus} label="Üyeyi çıkar" variant="plain" color={palette.danger} onPress={() => onRemove(user, m.userId)} />
                  </View>
                ) : (
                  <Badge label={ROLE_LABEL[m.role]} />
                )
              }
              chevron={false}
            />
          );
        })}
      </ListGroup>

      <ListGroup
        footer={
          list.isShared !== false ? 'Ailendeki herkes bu listeyi görebilir.' : 'Liste kişisel; sadece üyeler görebilir.'
        }
      >
        <SwitchRow
          title="Aile listesi"
          icon="Users"
          iconColor={list.color}
          value={list.isShared !== false}
          onValueChange={(v) => updateList(list.id, { isShared: v })}
        />
      </ListGroup>
    </FormScreen>
  );
};
