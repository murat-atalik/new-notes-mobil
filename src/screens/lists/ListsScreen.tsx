import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Copy, LogOut, Pencil, Plus, Search, Share2, Ticket, Trash2, User as UserIcon, Users, Users2, X } from 'lucide-react-native';

import {
  ChipRow,
  confirmAction,
  EmptyState,
  FAB,
  IconButton,
  Screen,
  showActionSheet,
  showToast,
  Text,
  TextField,
  type ActionSheetOption,
  type ChipOption,
} from '../../design';
import { filterByScope, listMembership, useMyLists, type Scope } from '../../logic/selectors';
import { ic, tw } from '../../lib/tw';
import { useAppNavigation, type TabParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { AnyListType, AppList, ListItem, User } from '../../types';
import { LIST_TYPE_META, LIST_TYPES } from './listMeta';
import { ListRow } from './ListRow';
import { RoomCard } from './RoomCard';
import { ROOM_META } from './roomMeta';
import { WeightCard } from './WeightCard';
import { WEIGHT_META } from './weightMeta';

// Cycling order for the header scope toggle: Hepsi → Aile → Kişisel → Hepsi …
const SCOPE_ORDER: Scope[] = ['ALL', 'SHARED', 'PERSONAL'];
const SCOPE_META: Record<Scope, { label: string; icon: typeof Users2 }> = {
  ALL: { label: 'Hepsi', icon: Users2 },
  SHARED: { label: 'Aile', icon: Users },
  PERSONAL: { label: 'Kişisel', icon: UserIcon },
};

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();

export const ListsScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<TabParamList, 'Lists'>>();
  const paramType = route.params?.type;

  const lists = useMyLists();
  const items = useAppStore((s) => s.items);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const duplicateList = useAppStore((s) => s.duplicateList);
  const deleteList = useAppStore((s) => s.deleteList);
  const leaveList = useAppStore((s) => s.leaveList);

  const [type, setType] = useState<AnyListType>(paramType ?? 'SHOPPING');
  const [lastParam, setLastParam] = useState(paramType);
  // Honor a new `type` route param (e.g. jump from Home) while keeping the user's own choice otherwise.
  if (paramType !== lastParam) {
    setLastParam(paramType);
    if (paramType) setType(paramType);
  }
  const [scope, setScope] = useState<Scope>('ALL');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const itemsByList = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const item of items) {
      const arr = map.get(item.listId);
      if (arr) arr.push(item);
      else map.set(item.listId, [item]);
    }
    return map;
  }, [items]);

  const userById = useMemo(() => {
    const map = new Map<string, User>(users.map((u) => [u.id, u]));
    map.set(currentUser.id, currentUser);
    return map;
  }, [users, currentUser]);

  const counts = useMemo(() => {
    const c: Record<AnyListType, number> = { SHOPPING: 0, TODO: 0, NOTE: 0, ROOM: 0, WEIGHT: 0 };
    for (const l of lists) c[l.type] += 1;
    return c;
  }, [lists]);

  const visible = useMemo(() => {
    const q = normalize(query);
    return filterByScope(lists, scope, currentUser).filter(
      (l) => l.type === type && (!q || normalize(l.title).includes(q) || normalize(l.description ?? '').includes(q)),
    );
  }, [lists, scope, currentUser, type, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => navigation.navigate('ListForm', { type });
  const cycleScope = () => setScope(SCOPE_ORDER[(SCOPE_ORDER.indexOf(scope) + 1) % SCOPE_ORDER.length]);

  const openActions = (list: AppList) => {
    const { isOwner, canLeave } = listMembership(list, currentUser);
    const options: ActionSheetOption[] = [
      { label: 'Düzenle', icon: Pencil, onPress: () => navigation.navigate('ListForm', { listId: list.id }) },
      { label: 'Paylaş & Davet', icon: Share2, onPress: () => navigation.navigate('ListShare', { listId: list.id }) },
      {
        label: 'Kopyala',
        icon: Copy,
        onPress: () => {
          duplicateList(list.id);
          showToast('Liste kopyalandı');
        },
      },
    ];
    if (isOwner) {
      options.push({
        label: 'Sil',
        icon: Trash2,
        destructive: true,
        onPress: () =>
          confirmAction({
            title: 'Liste silinsin mi?',
            message: `"${list.title}" ve içindeki tüm öğeler kalıcı olarak silinecek.`,
            onConfirm: () => {
              deleteList(list.id);
              showToast('Liste silindi');
            },
          }),
      });
    } else if (canLeave) {
      options.push({
        label: 'Listeden Ayrıl',
        icon: LogOut,
        destructive: true,
        onPress: () =>
          confirmAction({
            title: 'Listeden ayrılınsın mı?',
            message: `"${list.title}" listesine artık erişemeyeceksin. Tekrar katılmak için davet kodu gerekir.`,
            confirmText: 'Ayrıl',
            onConfirm: () => {
              leaveList(list.id);
              showToast('Listeden ayrıldın');
            },
          }),
      });
    }
    showActionSheet({ title: list.title, options });
  };

  const meta = type === 'ROOM' ? ROOM_META : type === 'WEIGHT' ? WEIGHT_META : LIST_TYPE_META[type];
  const filtering = query.trim().length > 0 || scope !== 'ALL';

  return (
    <Screen
      title="Listeler"
      right={
        <>
          <IconButton
            icon={SCOPE_META[scope].icon}
            label={`Görünüm: ${SCOPE_META[scope].label} — değiştirmek için dokun`}
            onPress={cycleScope}
          />
          <IconButton icon={Ticket} label="Kodla katıl" onPress={() => navigation.navigate('JoinList')} />
        </>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      overlay={<FAB icon={Plus} onPress={openCreate} aboveTabBar />}
    >
      <ChipRow<AnyListType>
        options={[
          ...LIST_TYPES.map((t): ChipOption<AnyListType> => ({ value: t, label: LIST_TYPE_META[t].label, color: LIST_TYPE_META[t].color, count: counts[t] })),
          { value: 'ROOM', label: ROOM_META.label, color: ROOM_META.color, count: counts.ROOM },
          { value: 'WEIGHT', label: WEIGHT_META.label, color: WEIGHT_META.color, count: counts.WEIGHT },
        ]}
        value={type}
        onChange={setType}
      />

      <View>
        <TextField
          icon={Search}
          value={query}
          onChangeText={setQuery}
          placeholder={`${meta.label} içinde ara`}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            style={tw`absolute right-3 top-0 bottom-0 w-8 items-center justify-center`}
          >
            <X {...ic('w-5 h-5 text-slate-400')} />
          </Pressable>
        ) : null}
      </View>

      {visible.length ? (
        <View style={tw`gap-3`}>
          {visible.map((list) => {
            const members = list.members.map((m) => userById.get(m.userId)).filter((u): u is User => !!u);
            const rowProps = {
              items: itemsByList.get(list.id) ?? [],
              members,
              onPress: () => navigation.navigate('ListDetail', { listId: list.id }),
              onMore: () => openActions(list),
            };
            return list.type === 'ROOM' ? (
              <RoomCard key={list.id} {...rowProps} room={list} />
            ) : list.type === 'WEIGHT' ? (
              <WeightCard key={list.id} {...rowProps} list={list} />
            ) : (
              <ListRow key={list.id} {...rowProps} list={list} />
            );
          })}
          <Text variant="caption" tone="faint" className="text-center pt-1">
            Daha fazla işlem için listeye basılı tut
          </Text>
        </View>
      ) : filtering ? (
        <EmptyState
          icon={Search}
          title="Sonuç yok"
          message="Aramanı ya da filtreyi değiştirerek tekrar dene."
          action={{
            label: 'Filtreleri temizle',
            onPress: () => {
              setQuery('');
              setScope('ALL');
            },
          }}
        />
      ) : (
        <EmptyState icon={meta.icon} title={meta.emptyTitle} message={meta.emptyMessage} action={{ label: 'Liste Oluştur', icon: Plus, onPress: openCreate }} />
      )}
    </Screen>
  );
};
