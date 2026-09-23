import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from './src/constants/colors';
import { Button } from './src/components/Button';
import { LIST_TYPES, typeEmoji, typeLabels } from './src/constants/listTypes';
import { useAppState } from './src/hooks/useAppState';
import { createList, deleteList, updateList as updateRemoteList } from './src/services/apiClient';
import { strings } from './src/strings/tr';
import { uid } from './src/utils/id';
import type { AppList, Item, ListType, Tab, User } from './src/types';
const listKey = (list: AppList) => list.id;
const itemKey = (item: Item) => item.id;

function Header({
  user,
  onNew,
  onLogout,
  dark,
  setDark,
}: {
  user: User;
  onNew: () => void;
  onLogout: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>₺</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>{strings.app.name}</Text>
          <Text style={styles.brandSubtitle}>{strings.app.tagline}</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={onNew} style={styles.roundButton}>
          <Text style={styles.plus}>＋</Text>
        </Pressable>
        <Pressable onPress={() => setOpen(!open)} style={styles.avatar}>
          <Text>{user.avatar}</Text>
        </Pressable>
      </View>
      {open && (
        <View style={styles.profileMenu}>
          <Text style={styles.menuName}>{user.name}</Text>
          <Text style={styles.menuMuted}>@{user.username}</Text>
          <View style={styles.menuRow}>
            <Text>{strings.common.darkTheme}</Text>
            <Switch value={dark} onValueChange={setDark} trackColor={{ true: colors.primary }} />
          </View>
          <Button title={strings.common.logout} variant="danger" small onPress={onLogout} />
        </View>
      )}
    </View>
  );
}

function AuthScreen({
  onLogin,
}: {
  onLogin: (username: string, password: string, name?: string) => Promise<void>;
}) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const submit = () => {
    if (!username.trim() || password.length < 6 || (register && !name.trim())) {
      Alert.alert(
        strings.auth.missingTitle,
        register ? strings.auth.missingRegister : strings.auth.missingLogin,
      );
      return;
    }
    onLogin(username, password, register ? name.trim() : undefined);
  };
  return (
    <SafeAreaView style={styles.auth}>
      <StatusBar barStyle="light-content" />
      <View style={styles.authCard}>
        <View style={styles.authLogo}>
          <Text style={styles.logoText}>₺</Text>
        </View>
        <Text style={styles.authTitle}>{strings.app.name}</Text>
        <Text style={styles.authLead}>{strings.auth.lead}</Text>
        {register && (
          <TextInput
            placeholder={strings.auth.namePlaceholder}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        )}
        <TextInput
          placeholder={strings.auth.usernamePlaceholder}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder={strings.auth.passwordPlaceholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button title={register ? strings.auth.register : strings.auth.login} onPress={submit} />
        <Pressable onPress={() => setRegister(!register)}>
          <Text style={styles.authSwitch}>
            {register ? strings.auth.haveAccount : strings.auth.newAccount}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const ListCard = memo(function ListCard({
  list,
  onOpen,
  onDelete,
}: {
  list: AppList;
  onOpen: (l: AppList) => void;
  onDelete: (l: AppList) => void;
}) {
  const done = list.items.filter((i) => i.isCompleted).length;
  return (
    <Pressable onPress={() => onOpen(list)} style={styles.listCard}>
      <View style={styles.cardTop}>
        <View style={styles.typeIcon}>
          <Text>{typeEmoji[list.type]}</Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{list.title}</Text>
          <Text style={styles.cardDescription}>{list.description}</Text>
        </View>
        <Pressable onPress={() => onDelete(list)} hitSlop={12}>
          <Text style={styles.more}>⋮</Text>
        </Pressable>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardMeta}>
          {list.isShared ? strings.lists.shared : strings.lists.private} · {list.updatedAt}
        </Text>
        <Text style={styles.progress}>{strings.lists.progress(done, list.items.length)}</Text>
      </View>
    </Pressable>
  );
});

function ListsScreen({
  lists,
  onOpen,
  onCreate,
  onDelete,
}: {
  lists: AppList[];
  onOpen: (l: AppList) => void;
  onCreate: () => void;
  onDelete: (l: AppList) => void;
}) {
  const [kind, setKind] = useState<ListType>('SHOPPING');
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const query = search.toLowerCase();
    return lists.filter(
      (l) =>
        l.type === kind &&
        `${l.title} ${l.description} ${l.items.map((i) => i.title).join(' ')}`
          .toLowerCase()
          .includes(query),
    );
  }, [lists, kind, search]);
  const { pending, percent } = useMemo(() => {
    const all = visible.reduce((a, l) => a + l.items.length, 0);
    const done = visible.reduce((a, l) => a + l.items.filter((i) => i.isCompleted).length, 0);
    return {
      pending: all - done,
      percent: all ? Math.round((done / all) * 100) : 0,
    };
  }, [visible]);
  const renderItem = useCallback<ListRenderItem<AppList>>(
    ({ item }) => <ListCard list={item} onOpen={onOpen} onDelete={onDelete} />,
    [onOpen, onDelete],
  );
  const header = (
    <>
      <View style={styles.pageHeading}>
        <View>
          <Text style={styles.pageTitle}>{strings.lists.title}</Text>
          <Text style={styles.pageLead}>{strings.lists.lead}</Text>
        </View>
        <Button title={strings.lists.newButton} small onPress={onCreate} />
      </View>
      <View style={styles.tabs}>
        {LIST_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setKind(t)}
            style={[styles.tab, kind === t && styles.tabActive]}
          >
            <Text style={styles.tabEmoji}>{typeEmoji[t]}</Text>
            <Text style={[styles.tabText, kind === t && styles.tabTextActive]}>
              {typeLabels[t]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.metricRow}>
        <View>
          <Text style={styles.metricValue}>{visible.length}</Text>
          <Text style={styles.metricLabel}>{strings.lists.metricLists}</Text>
        </View>
        <View>
          <Text style={styles.metricValue}>{pending}</Text>
          <Text style={styles.metricLabel}>
            {kind === 'NOTE' ? strings.lists.metricNotes : strings.lists.metricPending}
          </Text>
        </View>
        <View>
          <Text style={styles.metricValue}>%{percent}</Text>
          <Text style={styles.metricLabel}>{strings.lists.metricCompleted}</Text>
        </View>
      </View>
      <TextInput
        placeholder={strings.lists.searchPlaceholder}
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
    </>
  );
  const empty = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{typeEmoji[kind]}</Text>
      <Text style={styles.emptyTitle}>
        {strings.lists.emptyTitle(typeLabels[kind].toLocaleLowerCase('tr'))}
      </Text>
      <Text style={styles.cardDescription}>{strings.lists.emptyLead}</Text>
      <Button title={strings.lists.createButton} onPress={onCreate} />
    </View>
  );
  return (
    <FlatList
      data={visible}
      keyExtractor={listKey}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const ItemRow = memo(function ItemRow({
  item,
  type,
  onToggle,
  onTogglePin,
  onRemove,
}: {
  item: Item;
  type: ListType;
  onToggle: (i: Item) => void;
  onTogglePin: (i: Item) => void;
  onRemove: (i: Item) => void;
}) {
  return (
    <View style={styles.itemCard}>
      <Pressable
        onPress={() => onToggle(item)}
        style={[styles.checkbox, item.isCompleted && styles.checkboxDone]}
      >
        <Text>{item.isCompleted ? '✓' : ''}</Text>
      </Pressable>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, item.isCompleted && styles.completed]}>{item.title}</Text>
        {type === 'NOTE' && <Text style={styles.itemContent}>{item.content}</Text>}
        {type === 'SHOPPING' && (
          <Text style={styles.itemContent}>
            {item.quantity}
            {item.price ? ` · ₺${item.price}` : ''}
          </Text>
        )}
        {type === 'TODO' && item.priority && (
          <Text style={styles.itemContent}>{strings.detail.priority(item.priority)}</Text>
        )}
      </View>
      {type === 'NOTE' && (
        <Pressable onPress={() => onTogglePin(item)}>
          <Text>{item.isPinned ? '📌' : '📍'}</Text>
        </Pressable>
      )}
      <Pressable onPress={() => onRemove(item)} hitSlop={10}>
        <Text style={styles.delete}>×</Text>
      </Pressable>
    </View>
  );
});

function DetailScreen({
  list,
  onBack,
  onChange,
}: {
  list: AppList;
  onBack: () => void;
  onChange: (l: AppList) => void;
}) {
  const [text, setText] = useState('');
  const [extra, setExtra] = useState('');
  const add = () => {
    if (!text.trim()) return;
    const item: Item = {
      id: uid(),
      title: text.trim(),
      isCompleted: false,
      ...(list.type === 'NOTE'
        ? { content: extra }
        : list.type === 'SHOPPING'
          ? { quantity: Number(extra) || 1 }
          : { priority: 'MEDIUM' as const }),
    };
    onChange({
      ...list,
      items: [item, ...list.items],
      updatedAt: strings.common.justNow,
    });
    setText('');
    setExtra('');
  };
  const toggle = useCallback(
    (item: Item) =>
      onChange({
        ...list,
        items: list.items.map((i) =>
          i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i,
        ),
      }),
    [list, onChange],
  );
  const togglePin = useCallback(
    (item: Item) =>
      onChange({
        ...list,
        items: list.items.map((i) => (i.id === item.id ? { ...i, isPinned: !i.isPinned } : i)),
      }),
    [list, onChange],
  );
  const remove = useCallback(
    (item: Item) => onChange({ ...list, items: list.items.filter((i) => i.id !== item.id) }),
    [list, onChange],
  );
  const renderItem = useCallback<ListRenderItem<Item>>(
    ({ item }) => (
      <ItemRow
        item={item}
        type={list.type}
        onToggle={toggle}
        onTogglePin={togglePin}
        onRemove={remove}
      />
    ),
    [list.type, toggle, togglePin, remove],
  );
  const header = (
    <>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.detailTitleWrap}>
          <Text style={styles.pageTitle}>
            {typeEmoji[list.type]} {list.title}
          </Text>
          <Text style={styles.pageLead}>
            {list.isShared ? strings.detail.sharedList : strings.detail.privateList}
          </Text>
        </View>
        <Pressable
          onPress={() => Alert.alert(strings.detail.inviteTitle, strings.detail.inviteMessage)}
        >
          <Text style={styles.invite}>♧</Text>
        </Pressable>
      </View>
      <View style={styles.addBox}>
        <TextInput
          placeholder={strings.detail.titlePlaceholder[list.type]}
          value={text}
          onChangeText={setText}
          style={styles.addInput}
        />
        <TextInput
          placeholder={strings.detail.extraPlaceholder[list.type]}
          value={extra}
          onChangeText={setExtra}
          style={styles.addInput}
        />
        <Button title={strings.detail.add} small onPress={add} />
      </View>
    </>
  );
  const empty = (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{strings.detail.emptyTitle}</Text>
      <Text style={styles.cardDescription}>{strings.detail.emptyLead}</Text>
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={list.items}
        keyExtractor={itemKey}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

function SimpleScreen({ tab }: { tab: Exclude<Tab, 'lists' | 'settings'> }) {
  const data = strings.overview[tab];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>
        {data.emoji} {data.title}
      </Text>
      <Text style={styles.pageLead}>{data.lead}</Text>
      <View style={styles.summaryGrid}>
        {data.cards.map(([label, value]) => (
          <View key={label} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{data.sectionTitle}</Text>
        <Text style={styles.cardDescription}>{data.sectionBody}</Text>
        <View style={styles.fakeChart}>
          {chartBarStyles.map((barStyle, index) => (
            <View key={index} style={[styles.chartBar, barStyle]} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function SettingsScreen({
  user,
  onLogout,
  dark,
  setDark,
  onReset,
}: {
  user: User;
  onLogout: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  onReset: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{strings.settings.title}</Text>
      <Text style={styles.pageLead}>{strings.settings.lead}</Text>
      <View style={styles.profileCard}>
        <View style={styles.bigAvatar}>
          <Text>{user.avatar}</Text>
        </View>
        <View>
          <Text style={styles.cardTitle}>{user.name}</Text>
          <Text style={styles.cardDescription}>
            @{user.username} · {user.familyName}
          </Text>
        </View>
        <Text style={styles.edit}>{strings.settings.edit}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{strings.settings.preferences}</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>{strings.common.darkTheme}</Text>
            <Text style={styles.cardDescription}>{strings.settings.darkThemeLead}</Text>
          </View>
          <Switch value={dark} onValueChange={setDark} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>{strings.settings.notifications}</Text>
            <Text style={styles.cardDescription}>{strings.settings.notificationsLead}</Text>
          </View>
          <Switch value={true} trackColor={{ true: colors.primary }} />
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{strings.settings.dataManagement}</Text>
        <Button title={strings.settings.resetSample} variant="secondary" onPress={onReset} />
        <View style={styles.gap} />
        <Button title={strings.common.logout} variant="danger" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

function CreateModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, type: ListType, shared: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ListType>('SHOPPING');
  const [shared, setShared] = useState(true);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.sectionTitle}>{strings.create.title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <TextInput
            autoFocus
            placeholder={strings.create.namePlaceholder}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <View style={styles.typeChoices}>
            {LIST_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeChoice, type === t && styles.typeChoiceActive]}
              >
                <Text>
                  {typeEmoji[t]} {typeLabels[t]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>{strings.create.shareWithFamily}</Text>
            <Switch
              value={shared}
              onValueChange={setShared}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <Button
            title={strings.create.submit}
            onPress={() => {
              if (title.trim()) {
                onCreate(title.trim(), type, shared);
                setTitle('');
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const navItems: [Tab, string, string][] = [
  ['lists', '☷', strings.nav.lists],
  ['finance', '₺', strings.nav.finance],
  ['family', '♧', strings.nav.family],
  ['analytics', '▥', strings.nav.analytics],
  ['settings', '⚙', strings.nav.settings],
];

export default function App() {
  const {
    user,
    lists,
    setLists,
    dark,
    setDark,
    logout: clearUser,
    resetLists,
    signIn,
  } = useAppState();
  const [tab, setTab] = useState<Tab>('lists');
  const [selected, setSelected] = useState<AppList | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const updateList = useCallback(
    (list: AppList) => {
      setLists((current) => current.map((l) => (l.id === list.id ? list : l)));
      setSelected(list);
      void updateRemoteList(list).catch((error: unknown) => {
        Alert.alert(
          strings.common.error,
          error instanceof Error ? error.message : strings.common.error,
        );
      });
    },
    [setLists],
  );
  const create = (title: string, type: ListType, shared: boolean) => {
    void (async () => {
      try {
        if (!user) return;
        const created = await createList(user, title, type, shared);
        setLists((current) => [created, ...current]);
      } catch (error) {
        Alert.alert(
          strings.common.error,
          error instanceof Error ? error.message : strings.common.error,
        );
      }
    })();
    setCreateOpen(false);
    setTab('lists');
  };
  const openCreate = useCallback(() => setCreateOpen(true), []);
  const confirmDelete = useCallback(
    (l: AppList) =>
      Alert.alert(strings.lists.deleteTitle, strings.lists.deleteMessage(l.title), [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: () => {
            void deleteList(l.id).then(
              () => setLists((current) => current.filter((x) => x.id !== l.id)),
              (error: unknown) =>
                Alert.alert(
                  strings.common.error,
                  error instanceof Error ? error.message : strings.common.error,
                ),
            );
          },
        },
      ]),
    [setLists],
  );
  const logout = () => {
    clearUser();
    setSelected(null);
  };
  const reset = () =>
    Alert.alert(strings.reset.title, strings.reset.message, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.reset.confirm,
        style: 'destructive',
        onPress: resetLists,
      },
    ]);
  const theme: { safe?: object; bottomNav?: object } = dark ? darkStyles : {};
  if (!user)
    return (
      <AuthScreen
        onLogin={async (username, password, name) => {
          try {
            await signIn(username, password, name);
          } catch (error) {
            Alert.alert(
              strings.common.error,
              error instanceof Error ? error.message : strings.common.error,
            );
          }
        }}
      />
    );
  return (
    <SafeAreaView style={[styles.safe, theme.safe]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <Header user={user} onNew={openCreate} onLogout={logout} dark={dark} setDark={setDark} />
      {selected ? (
        <DetailScreen list={selected} onBack={() => setSelected(null)} onChange={updateList} />
      ) : tab === 'lists' ? (
        <ListsScreen
          lists={lists}
          onOpen={setSelected}
          onCreate={openCreate}
          onDelete={confirmDelete}
        />
      ) : tab === 'settings' ? (
        <SettingsScreen
          user={user}
          onLogout={logout}
          dark={dark}
          setDark={setDark}
          onReset={reset}
        />
      ) : (
        <SimpleScreen tab={tab} />
      )}
      <View style={[styles.bottomNav, theme.bottomNav]}>
        {navItems.map(([key, icon, label]) => (
          <Pressable
            key={key}
            onPress={() => {
              setTab(key);
              setSelected(null);
            }}
            style={[styles.navItem, tab === key && styles.navActive]}
          >
            <Text style={[styles.navIcon, tab === key && styles.navIconActive]}>{icon}</Text>
            <Text style={[styles.navLabel, tab === key && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <CreateModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} />
    </SafeAreaView>
  );
}

const darkStyles = StyleSheet.create({
  safe: { backgroundColor: '#0f172a' },
  bottomNav: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
});
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  brandTitle: { color: colors.ink, fontWeight: '800', fontSize: 17 },
  brandSubtitle: { color: colors.muted, fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 25, color: colors.primaryDark, marginTop: -3 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMenu: {
    position: 'absolute',
    top: 65,
    right: 16,
    width: 210,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: { padding: 18, paddingBottom: 100 },
  pageHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  pageTitle: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  pageLead: { color: colors.muted, fontSize: 14, marginTop: 4 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    minHeight: 46,
  },
  buttonSmall: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
  },
  buttonSecondary: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  buttonDanger: { backgroundColor: '#fee2e2' },
  buttonText: { color: '#fff', fontWeight: '800' },
  buttonTextDark: { color: '#b91c1c' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#d1fae5' },
  tabEmoji: { fontSize: 16 },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.primaryDark },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  metricValue: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    marginRight: 11,
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  cardDescription: { color: colors.muted, fontSize: 13, marginTop: 4 },
  more: { color: colors.muted, fontSize: 22 },
  cardBottom: {
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMeta: { color: colors.muted, fontSize: 11 },
  progress: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    padding: 35,
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyEmoji: { fontSize: 38, marginBottom: 10 },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 5,
  },
  back: {
    color: colors.primaryDark,
    fontSize: 40,
    lineHeight: 40,
    marginRight: 10,
  },
  detailTitleWrap: { flex: 1 },
  invite: { color: colors.primaryDark, fontSize: 27 },
  addBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
  },
  addInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 9,
    fontSize: 15,
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    marginBottom: 10,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemBody: { flex: 1 },
  itemTitle: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  completed: { textDecorationLine: 'line-through', color: colors.muted },
  itemContent: { color: colors.muted, fontSize: 12, marginTop: 4 },
  delete: { color: colors.danger, fontSize: 23, marginLeft: 12 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 7,
  },
  panel: {
    backgroundColor: colors.surface,
    padding: 17,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 12,
  },
  fakeChart: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chartBar: {
    width: 25,
    backgroundColor: '#6ee7b7',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 15,
    marginVertical: 18,
  },
  bigAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    marginRight: 12,
  },
  edit: { color: colors.primaryDark, marginLeft: 'auto', fontWeight: '700' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTitle: { color: colors.ink, fontWeight: '700' },
  gap: { height: 10 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 11,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,.45)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  close: { color: colors.muted, fontSize: 30 },
  typeChoices: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  typeChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },
  typeChoiceActive: { borderColor: colors.primary, backgroundColor: '#ecfdf5' },
  auth: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 20,
  },
  authCard: { backgroundColor: colors.surface, borderRadius: 25, padding: 24 },
  authLogo: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  authTitle: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
  },
  authLead: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  authSwitch: {
    color: colors.primaryDark,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 17,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 7,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 10,
  },
  navActive: { backgroundColor: '#d1fae5' },
  navIcon: { fontSize: 20, color: colors.muted },
  navIconActive: { color: colors.primaryDark },
  navLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  navLabelActive: { color: colors.primaryDark, fontWeight: '800' },
  menuName: { fontWeight: '800', color: colors.ink },
  menuMuted: { color: colors.muted, fontSize: 12, marginBottom: 10 },
});
const chartStyles = StyleSheet.create({
  bar1: { height: 42 },
  bar2: { height: 76 },
  bar3: { height: 54 },
  bar4: { height: 92 },
  bar5: { height: 66 },
});
const chartBarStyles = [
  chartStyles.bar1,
  chartStyles.bar2,
  chartStyles.bar3,
  chartStyles.bar4,
  chartStyles.bar5,
];
