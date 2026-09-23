import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Check, Plus, Receipt, ShoppingCart, UserPlus } from 'lucide-react-native';

import { Card, ListGroup, palette, ProgressBar, ProgressRing, Row, Screen, Section, Text, UserAvatar } from '../../design';
import { formatDay, formatMoney, greeting, MONTHS_TR } from '../../logic/format';
import { expensesInMonth, listProgress, sumTRY, taskBucket, useFinance, useMyLists } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation, useTabNavigation } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { AppList, ListItem, User } from '../../types';

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function todayLabel(date = new Date()) {
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${WEEKDAYS[date.getDay()]}`;
}

const TaskCheck: React.FC<{ done: boolean; color: string; onPress: () => void }> = ({ done, color, onPress }) => (
  <Pressable
    onPress={onPress}
    hitSlop={12}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: done }}
    accessibilityLabel="Tamamlandı olarak işaretle"
    style={[
      tw`w-7 h-7 rounded-full items-center justify-center border-2`,
      { borderColor: done ? color : palette.slate400, backgroundColor: done ? color : 'transparent' },
    ]}
  >
    {done ? <Check size={16} color="#fff" strokeWidth={3} /> : null}
  </Pressable>
);

const MemberAvatars: React.FC<{ list: AppList; users: User[] }> = ({ list, users }) => {
  const members = list.members
    .map((m) => users.find((u) => u.id === m.userId))
    .filter((u): u is User => !!u)
    .slice(0, 4);
  if (!members.length) return null;
  return (
    <View style={tw`flex-row`}>
      {members.map((u, i) => (
        <View key={u.id} style={i ? tw`-ml-2` : undefined}>
          <UserAvatar avatar={u.avatar} name={u.name} color={u.color} size="xs" />
        </View>
      ))}
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const goTab = useTabNavigation();
  const user = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const allItems = useAppStore((s) => s.items);
  const toggleItemCompleted = useAppStore((s) => s.toggleItemCompleted);
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const lists = useMyLists();
  const { expenses, rates, monthlyBudget } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const itemsByList = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const i of allItems) map.set(i.listId, [...(map.get(i.listId) || []), i]);
    return map;
  }, [allItems]);

  const listById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);

  const todayTasks = useMemo(
    () =>
      lists
        .filter((l) => l.type === 'TODO')
        .flatMap((l) => itemsByList.get(l.id) || [])
        .filter((i) => {
          const b = taskBucket(i);
          return b === 'OVERDUE' || b === 'TODAY';
        })
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
        .slice(0, 5),
    [lists, itemsByList],
  );

  const shoppingLists = useMemo(
    () =>
      lists
        .filter((l) => l.type === 'SHOPPING')
        .map((l) => ({ list: l, progress: listProgress(itemsByList.get(l.id) || []) }))
        .filter((x) => x.progress.pending > 0),
    [lists, itemsByList],
  );

  const pinnedNotes = useMemo(
    () =>
      lists
        .filter((l) => l.type === 'NOTE')
        .flatMap((l) => (itemsByList.get(l.id) || []).filter((i) => i.isPinned))
        .slice(0, 6),
    [lists, itemsByList],
  );

  const spent = sumTRY(expensesInMonth(expenses), rates);
  const usage = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - spent;
  const over = monthlyBudget > 0 && remaining < 0;
  const ringColor = over ? palette.danger : usage >= 80 ? palette.warning : palette.brandLight;
  const recent = expenses.slice(0, 3);
  const firstRun = lists.length === 0 && expenses.length === 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(false);
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <View style={tw`flex-row items-center justify-between gap-3`}>
      <View style={tw`flex-1 min-w-0`}>
        <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
          {`${greeting()}, ${user.name.split(' ')[0]} 👋`}
        </Text>
        <Text variant="subhead" tone="muted" numberOfLines={1}>
          {todayLabel()}
          {user.familyName ? ` · ${user.familyName}` : ''}
        </Text>
      </View>
      <Pressable onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Ayarlar" hitSlop={8}>
        <UserAvatar avatar={user.avatar} name={user.name} color={user.color} size="md" />
      </Pressable>
    </View>
  );

  return (
    <Screen header={header} refreshing={refreshing} onRefresh={onRefresh}>
      {firstRun ? (
        <Card className="gap-3">
          <Text variant="title2">Hoş geldin! 🎉</Text>
          <Text variant="callout" tone="muted">
            Üç adımda başla:
          </Text>
          <ListGroup>
            <Row
              icon={ShoppingCart}
              iconColor={palette.brandLight}
              title="1. Liste oluştur"
              subtitle="Alışveriş, görev ya da not listesi"
              onPress={() => navigation.navigate('ListForm', {})}
            />
            <Row
              icon={UserPlus}
              iconColor={palette.info}
              title="2. Aileni davet et"
              subtitle="Aile kodunu paylaş"
              onPress={() => goTab('Family')}
            />
            <Row
              icon={Receipt}
              iconColor={palette.warning}
              title="3. Harcama ekle"
              subtitle="Bütçeni takip et"
              onPress={() => navigation.navigate('ExpenseForm')}
            />
          </ListGroup>
        </Card>
      ) : null}

      <Card onPress={() => goTab('Wallet')} className="flex-row items-center gap-4">
        <View style={tw`flex-1 min-w-0 gap-1`}>
          <Text variant="overline" tone="muted">
            Bu ay
          </Text>
          <Text variant="amount" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(spent)}
          </Text>
          {monthlyBudget > 0 ? (
            <Text variant="subhead" tone={over ? 'danger' : usage >= 80 ? 'warning' : 'success'} weight="semibold">
              {over ? `Bütçe ${formatMoney(-remaining)} aşıldı` : `${formatMoney(remaining)} kaldı`}
            </Text>
          ) : (
            <Text variant="subhead" tone="muted">
              Bütçe belirlenmedi
            </Text>
          )}
        </View>
        <ProgressRing value={usage} size={76} color={ringColor}>
          <Text variant="subhead" weight="bold" tone={over ? 'danger' : 'default'}>
            {monthlyBudget > 0 ? `%${Math.round(usage)}` : '–'}
          </Text>
        </ProgressRing>
      </Card>

      <Section title="Bugünün görevleri" action={{ label: 'Tümü', onPress: () => goTab('Lists', { type: 'TODO' }) }}>
        {todayTasks.length ? (
          <ListGroup>
            {todayTasks.map((item) => {
              const list = listById.get(item.listId);
              const overdue = taskBucket(item) === 'OVERDUE';
              return (
                <Row
                  key={item.id}
                  left={<TaskCheck done={item.isCompleted} color={list?.color || palette.brandLight} onPress={() => toggleItemCompleted(item.id)} />}
                  title={item.title}
                  subtitle={list?.title}
                  value={formatDay(item.dueDate)}
                  valueTone={overdue ? 'danger' : 'muted'}
                  onPress={() => navigation.navigate('ListDetail', { listId: item.listId })}
                  chevron={false}
                />
              );
            })}
          </ListGroup>
        ) : (
          <Card>
            <Text variant="callout" tone="muted">
              Bugün için görev yok 🎉
            </Text>
          </Card>
        )}
      </Section>

      <Section title="Alışveriş">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4`} contentContainerStyle={tw`px-4 gap-3`}>
          {shoppingLists.map(({ list, progress }) => (
            <Card key={list.id} className="w-44 gap-2" onPress={() => navigation.navigate('ListDetail', { listId: list.id })}>
              <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: list.color }]} />
              <Text variant="headline" numberOfLines={1}>
                {list.title}
              </Text>
              <Text variant="footnote" tone="muted">
                {`${progress.pending} ürün kaldı`}
              </Text>
              <ProgressBar value={progress.percent} color={list.color} height={6} />
              <MemberAvatars list={list} users={users} />
            </Card>
          ))}
          <Card
            className="w-32 items-center justify-center gap-2 border-dashed"
            onPress={() => navigation.navigate('ListForm', { type: 'SHOPPING' })}
          >
            <Plus size={24} color={palette.brand} />
            <Text variant="subhead" tone="brand" weight="semibold">
              + Yeni
            </Text>
          </Card>
        </ScrollView>
      </Section>

      {pinnedNotes.length ? (
        <Section title="Sabitlenmiş notlar">
          <View style={tw`flex-row flex-wrap gap-3`}>
            {pinnedNotes.map((note) => (
              <Card
                key={note.id}
                className="gap-1 grow basis-[45%]"
                onPress={() => navigation.navigate('NoteEditor', { listId: note.listId, itemId: note.id })}
              >
                <Text variant="headline" numberOfLines={1}>
                  {note.title || 'Başlıksız not'}
                </Text>
                <Text variant="footnote" tone="muted" numberOfLines={2}>
                  {note.content || ' '}
                </Text>
              </Card>
            ))}
          </View>
        </Section>
      ) : null}

      {recent.length ? (
        <Section title="Son harcamalar" action={{ label: 'Tümü', onPress: () => navigation.navigate('Expenses') }}>
          <ListGroup>
            {recent.map((e) => (
              <Row
                key={e.id}
                icon={Receipt}
                iconColor={palette.warning}
                title={e.listTitle || e.note || e.categoryName || 'Harcama'}
                subtitle={`${e.categoryName || 'Diğer'} · ${formatDay(e.date)}`}
                value={formatMoney(e.amount, e.currency || 'TRY')}
                valueTone="default"
                onPress={() => navigation.navigate('ExpenseDetail', { expenseId: e.id })}
              />
            ))}
          </ListGroup>
        </Section>
      ) : null}
    </Screen>
  );
};
