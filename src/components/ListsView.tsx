import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Download,
  FolderTree,
  Layers,
  Lock,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  StickyNote,
  Users,
  X,
} from 'lucide-react-native';

import { usePwaInstall } from '../hooks/usePwaInstall';
import { groupLists, type GroupByMode } from '../lib/groupingUtils';
import { getAccessibleLists, isFamilyListForUser } from '../lib/permissions';
import { localStorage } from '../lib/storage';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import type { AppList, ListType } from '../types';
import { ListCard } from './ListCard';
import { Btn, Gradient, Grid, Input, Text } from './ui';

interface ListsViewProps {
  onOpenCreateModal: (type?: ListType) => void;
  onOpenInvite: (list: AppList) => void;
  onOpenPwaModal: () => void;
  initialTab?: ListType;
}

const STORAGE_HUB_KEY = 'smart_family_active_hub';

const isHub = (value: string | null): value is ListType =>
  value === 'SHOPPING' || value === 'TODO' || value === 'NOTE';

export const ListsView: React.FC<ListsViewProps> = ({
  onOpenCreateModal,
  onOpenInvite,
  onOpenPwaModal,
  initialTab,
}) => {
  const { lists, items, currentUser, setCreateListModalOpen } = useAppStore();
  const { isInstalled, isStandalone } = usePwaInstall();
  const [pwaBannerDismissed, setPwaBannerDismissed] = useState(false);

  // Active Hub state: SHOPPING | TODO | NOTE (persisted in storage or from prop)
  const [activeHub, setActiveHub] = useState<ListType>(() => {
    if (initialTab) return initialTab;
    const saved = localStorage.getItem(STORAGE_HUB_KEY);
    if (isHub(saved)) return saved;
    return 'SHOPPING';
  });

  // Scope filter: ALL | SHARED | PERSONAL
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SHARED' | 'PERSONAL'>('ALL');
  const [search, setSearch] = useState('');
  const [showGroupingOptions, setShowGroupingOptions] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByMode>('NONE');

  // Sync activeHub when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveHub(initialTab);
    }
  }, [initialTab]);

  const handleSelectHub = (hub: ListType) => {
    setActiveHub(hub);
    setSearch('');
    localStorage.setItem(STORAGE_HUB_KEY, hub);
  };

  // Strictly accessible lists for the logged-in user
  const accessibleLists = useMemo(() => {
    return getAccessibleLists(lists, currentUser);
  }, [lists, currentUser]);

  // Separate list sets for each distinct hub
  const shoppingLists = useMemo(() => accessibleLists.filter((l) => l.type === 'SHOPPING'), [accessibleLists]);
  const todoLists = useMemo(() => accessibleLists.filter((l) => l.type === 'TODO'), [accessibleLists]);
  const noteLists = useMemo(() => accessibleLists.filter((l) => l.type === 'NOTE'), [accessibleLists]);

  // Active hub's lists
  const currentHubLists = useMemo(() => {
    if (activeHub === 'SHOPPING') return shoppingLists;
    if (activeHub === 'TODO') return todoLists;
    return noteLists;
  }, [activeHub, shoppingLists, todoLists, noteLists]);

  // Scope filtered lists for active hub
  const scopeFilteredLists = useMemo(() => {
    return currentHubLists.filter((l) => {
      const isShared = isFamilyListForUser(l, currentUser);
      if (scopeFilter === 'SHARED') return isShared;
      if (scopeFilter === 'PERSONAL') return !isShared;
      return true;
    });
  }, [currentHubLists, scopeFilter, currentUser]);

  // Search filtered lists
  const finalFilteredLists = useMemo(() => {
    if (!search.trim()) return scopeFilteredLists;
    const q = search.toLowerCase();
    return scopeFilteredLists.filter((l) => {
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchDesc = l.description && l.description.toLowerCase().includes(q);
      // Also search items inside the list for extra convenience
      const listItems = items.filter((i) => i.listId === l.id);
      const matchItems = listItems.some(
        (i) => i.title.toLowerCase().includes(q) || (i.content && i.content.toLowerCase().includes(q)),
      );
      return matchTitle || matchDesc || matchItems;
    });
  }, [scopeFilteredLists, search, items]);

  // Completed list IDs for optional grouping
  const completedListIds = useMemo(() => {
    return new Set(
      accessibleLists
        .filter((l) => {
          const listItems = items.filter((i) => i.listId === l.id);
          return listItems.length > 0 && listItems.every((i) => i.isCompleted);
        })
        .map((l) => l.id),
    );
  }, [accessibleLists, items]);

  const groupedLists = useMemo(() => {
    if (groupBy === 'NONE') return [];
    return groupLists(finalFilteredLists, groupBy, completedListIds);
  }, [finalFilteredLists, groupBy, completedListIds]);

  // Metrics: Shopping
  const shoppingMetrics = useMemo(() => {
    const activeShoppingLists = shoppingLists;
    const shoppingItems = items.filter((i) => {
      const list = activeShoppingLists.find((l) => l.id === i.listId);
      return !!list;
    });
    const pendingItems = shoppingItems.filter((i) => !i.isCompleted);
    const totalPendingBudget = pendingItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    return {
      listCount: activeShoppingLists.length,
      pendingCount: pendingItems.length,
      totalPendingBudget,
    };
  }, [shoppingLists, items]);

  // Metrics: Tasks
  const todoMetrics = useMemo(() => {
    const activeTodoLists = todoLists;
    const todoItems = items.filter((i) => {
      const list = activeTodoLists.find((l) => l.id === i.listId);
      return !!list;
    });
    const pending = todoItems.filter((i) => !i.isCompleted).length;
    const completed = todoItems.filter((i) => i.isCompleted).length;
    const total = todoItems.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      listCount: activeTodoLists.length,
      pending,
      completed,
      percent,
    };
  }, [todoLists, items]);

  // Metrics: Notes
  const noteMetrics = useMemo(() => {
    const noteItems = items.filter((i) => {
      const list = noteLists.find((l) => l.id === i.listId);
      return !!list;
    });
    const pinned = noteItems.filter((i) => i.isPinned).length;
    return {
      listCount: noteLists.length,
      itemCount: noteItems.length,
      pinned,
    };
  }, [noteLists, items]);

  const handleOpenCreateForActiveHub = () => {
    setCreateListModalOpen(true, activeHub);
    onOpenCreateModal(activeHub);
  };

  const renderGroupIcon = (iconName: string) => {
    const props = ic('w-4 h-4 text-white');
    switch (iconName) {
      case 'shopping':
        return <ShoppingCart {...props} />;
      case 'todo':
        return <CheckSquare {...props} />;
      case 'note':
        return <StickyNote {...props} />;
      case 'clock':
        return <Clock {...props} />;
      case 'calendar':
        return <Calendar {...props} />;
      case 'users':
        return <Users {...props} />;
      case 'lock':
        return <Lock {...props} />;
      case 'check':
        return <Check {...props} />;
      default:
        return <Layers {...props} />;
    }
  };

  const hubs: {
    id: ListType;
    label: string;
    icon: typeof ShoppingCart;
    count: number;
    activeBg: string;
    iconIdle: string;
    badgeIdle: string;
  }[] = [
    {
      id: 'SHOPPING',
      label: 'Alışveriş',
      icon: ShoppingCart,
      count: shoppingLists.length,
      activeBg: 'bg-emerald-600',
      iconIdle: 'text-emerald-600 dark:text-emerald-400',
      badgeIdle: 'bg-emerald-100 dark:bg-emerald-950/80',
    },
    {
      id: 'TODO',
      label: 'Görevler',
      icon: CheckSquare,
      count: todoLists.length,
      activeBg: 'bg-amber-500',
      iconIdle: 'text-amber-500 dark:text-amber-400',
      badgeIdle: 'bg-amber-100 dark:bg-amber-950/80',
    },
    {
      id: 'NOTE',
      label: 'Notlar',
      icon: StickyNote,
      count: noteLists.length,
      activeBg: 'bg-purple-600',
      iconIdle: 'text-purple-600 dark:text-purple-400',
      badgeIdle: 'bg-purple-100 dark:bg-purple-950/80',
    },
  ];
  const badgeIdleText: Record<ListType, string> = {
    SHOPPING: 'text-emerald-800 dark:text-emerald-300',
    TODO: 'text-amber-800 dark:text-amber-300',
    NOTE: 'text-purple-800 dark:text-purple-300',
  };

  const hubBg =
    activeHub === 'SHOPPING' ? 'bg-emerald-600' : activeHub === 'TODO' ? 'bg-amber-500' : 'bg-purple-600';

  const metricCard = 'bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs';

  const sharedCount = currentHubLists.filter((l) => isFamilyListForUser(l, currentUser)).length;
  const personalCount = currentHubLists.filter((l) => !isFamilyListForUser(l, currentUser)).length;

  const groupOptions: { id: GroupByMode; label: string; activeClass: string; activeText: string }[] = [
    {
      id: 'NONE',
      label: 'Düz Liste',
      activeClass: 'bg-white dark:bg-slate-900 shadow-2xs',
      activeText: 'text-slate-900 dark:text-white',
    },
    { id: 'CATEGORY', label: 'Kategoriye Göre', activeClass: 'bg-emerald-600 shadow-2xs', activeText: 'text-white' },
    { id: 'DATE', label: 'Tarihe Göre', activeClass: 'bg-indigo-600 shadow-2xs', activeText: 'text-white' },
  ];

  return (
    <View style={tw`gap-4`}>
      {/* PWA Mobile Quick Install Banner (never shown in the native app) */}
      {!isInstalled && !isStandalone && !pwaBannerDismissed ? (
        <Gradient
          dir="r"
          colors={['emerald-500/10', 'teal-500/10', 'emerald-500/10']}
          className="border border-emerald-500/30 rounded-2xl p-3 flex-row items-center justify-between gap-3 shadow-2xs"
        >
          <View style={tw`flex-row items-center gap-3 flex-1`}>
            <View style={tw`w-9 h-9 rounded-xl bg-emerald-600 items-center justify-center shrink-0 shadow-sm`}>
              <Text className="text-white text-base font-bold">₺</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                Uygulamayı Telefonunuza Yükleyin
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Ana ekranınızdan tek tıkla tam ekran & çevrimdışı açın.
              </Text>
            </View>
          </View>
          <View style={tw`flex-row items-center gap-1.5 shrink-0`}>
            <Btn
              onPress={onOpenPwaModal}
              className="px-3 py-1.5 bg-emerald-600 rounded-xl shadow-xs flex-row items-center gap-1"
            >
              <Download {...ic('w-3.5 h-3.5 text-white')} />
              <Text className="text-white font-bold text-xs">Yükle</Text>
            </Btn>
            <Btn onPress={() => setPwaBannerDismissed(true)} accessibilityLabel="Kapat" className="p-1.5 rounded-lg">
              <X {...ic('w-4 h-4 text-slate-400')} />
            </Btn>
          </View>
        </Gradient>
      ) : null}

      {/* TOP PRIMARY HUB SELECTOR (Alışveriş, Görevler, Notlar) */}
      <View
        style={tw`bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs`}
      >
        <Grid cols={3} gap={1.5}>
          {hubs.map((hub) => {
            const active = activeHub === hub.id;
            const Icon = hub.icon;
            return (
              <Btn
                key={hub.id}
                onPress={() => handleSelectHub(hub.id)}
                className={`relative flex-row items-center justify-center gap-2 py-2.5 px-2 rounded-xl ${
                  active ? `${hub.activeBg} shadow-sm` : ''
                }`}
              >
                <Icon {...ic(`w-4 h-4 ${active ? 'text-white' : hub.iconIdle}`)} />
                <Text
                  numberOfLines={1}
                  className={`shrink text-xs font-bold ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {hub.label}
                </Text>
                <View style={tw.style('px-1.5 py-0.5 rounded-full', active ? 'bg-white/25' : hub.badgeIdle)}>
                  <Text className={`text-[10px] font-extrabold ${active ? 'text-white' : badgeIdleText[hub.id]}`}>
                    {hub.count}
                  </Text>
                </View>
              </Btn>
            );
          })}
        </Grid>
      </View>

      {/* ACTIVE HUB HEADER & QUICK ACTION */}
      <View style={tw`flex-col justify-between gap-3`}>
        <View>
          <View style={tw`flex-row items-center gap-2`}>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {activeHub === 'SHOPPING'
                ? 'Alışveriş Listelerim'
                : activeHub === 'TODO'
                  ? 'Yapılacaklar & Görevler'
                  : 'Notlarım & Fikirler'}
            </Text>
            <View style={tw`px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800`}>
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {scopeFilteredLists.length} liste
              </Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeHub === 'SHOPPING'
              ? 'Market, manav ve sepet bütçenizi kolayca takip edin'
              : activeHub === 'TODO'
                ? 'Günlük işler, sorumluluklar ve yapılacaklar'
                : 'Serbest karalamalar, tarifler ve önemli aile notları'}
          </Text>
        </View>

        {/* Dedicated Create Button for this Hub */}
        <Btn
          onPress={handleOpenCreateForActiveHub}
          className={`flex-row items-center self-start justify-center gap-1.5 px-3.5 py-2 rounded-xl shadow-sm ${hubBg}`}
        >
          <Plus {...ic('w-4 h-4 text-white')} />
          <Text className="text-xs font-bold text-white">
            {activeHub === 'SHOPPING'
              ? 'Yeni Alışveriş Listesi'
              : activeHub === 'TODO'
                ? 'Yeni Görev Listesi'
                : 'Yeni Not Ekle'}
          </Text>
        </Btn>
      </View>

      {/* HUB SPECIFIC INSIGHT CARDS */}
      {activeHub === 'SHOPPING' ? (
        <Grid cols={3} gap={2.5}>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Aktif Liste</Text>
            <Text className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {shoppingMetrics.listCount}
            </Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Tahmini Bütçe</Text>
            <Text className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5" numberOfLines={1}>
              {shoppingMetrics.totalPendingBudget.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Alınacak</Text>
            <Text className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {shoppingMetrics.pendingCount} ürün
            </Text>
          </View>
        </Grid>
      ) : null}

      {activeHub === 'TODO' ? (
        <Grid cols={3} gap={2.5}>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Bekleyen</Text>
            <Text className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {todoMetrics.pending} görev
            </Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Tamamlanan</Text>
            <Text className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {todoMetrics.completed}
            </Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Başarı</Text>
            <Text className="text-base font-black text-slate-900 dark:text-white mt-0.5">%{todoMetrics.percent}</Text>
          </View>
        </Grid>
      ) : null}

      {activeHub === 'NOTE' ? (
        <Grid cols={3} gap={2.5}>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Toplam Not Listesi</Text>
            <Text className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">
              {noteMetrics.listCount}
            </Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kayıtlı Madde</Text>
            <Text className="text-base font-black text-slate-900 dark:text-white mt-0.5">{noteMetrics.itemCount}</Text>
          </View>
          <View style={tw.style(metricCard)}>
            <Text className="text-[11px] font-semibold text-amber-500 dark:text-amber-400">Sabitlenen</Text>
            <Text className="text-base font-black text-amber-500 dark:text-amber-400 mt-0.5">{noteMetrics.pinned}</Text>
          </View>
        </Grid>
      ) : null}

      {/* FILTER & SEARCH BAR (Compact & Uncluttered) */}
      <View style={tw`gap-2`}>
        <View style={tw`flex-row items-center gap-2`}>
          {/* Search Input */}
          <View style={tw`relative flex-1 justify-center`}>
            <View style={tw`absolute left-3.5 z-10`} pointerEvents="none">
              <Search {...ic('w-4 h-4 text-slate-400')} />
            </View>
            <Input
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              placeholder={
                activeHub === 'SHOPPING'
                  ? 'Alışveriş listelerinde ara...'
                  : activeHub === 'TODO'
                    ? 'Görevlerde ve listelerde ara...'
                    : 'Not başlığı veya içeriğinde ara...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl shadow-2xs"
            />
            {search ? (
              <Btn onPress={() => setSearch('')} accessibilityLabel="Aramayı temizle" className="absolute right-2.5 p-0.5">
                <X {...ic('w-3.5 h-3.5 text-slate-400')} />
              </Btn>
            ) : null}
          </View>

          {/* Grouping Toggle Button */}
          <Btn
            onPress={() => setShowGroupingOptions(!showGroupingOptions)}
            accessibilityLabel="Gruplama Seçenekleri"
            className={`p-2 rounded-xl border flex-row items-center gap-1 ${
              groupBy !== 'NONE' || showGroupingOptions
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <SlidersHorizontal
              {...ic(
                groupBy !== 'NONE' || showGroupingOptions
                  ? 'w-4 h-4 text-emerald-700 dark:text-emerald-300'
                  : 'w-4 h-4 text-slate-600 dark:text-slate-400',
              )}
            />
          </Btn>
        </View>

        {/* Scope Pill Toggle (All / Shared / Personal) */}
        <View style={tw`flex-row items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl`}>
          <Btn
            onPress={() => setScopeFilter('ALL')}
            className={`flex-1 items-center py-1.5 px-2.5 rounded-lg ${
              scopeFilter === 'ALL' ? 'bg-white dark:bg-slate-900 shadow-2xs' : ''
            }`}
          >
            <Text
              numberOfLines={1}
              className={`text-xs font-bold text-center ${
                scopeFilter === 'ALL' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tümü ({currentHubLists.length})
            </Text>
          </Btn>
          <Btn
            onPress={() => setScopeFilter('SHARED')}
            className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg ${
              scopeFilter === 'SHARED' ? 'bg-sky-500 shadow-2xs' : ''
            }`}
          >
            <Users
              {...ic(scopeFilter === 'SHARED' ? 'w-3 h-3 text-white' : 'w-3 h-3 text-slate-600 dark:text-slate-400')}
            />
            <Text
              numberOfLines={1}
              className={`shrink text-xs font-bold ${
                scopeFilter === 'SHARED' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ailemiz ({sharedCount})
            </Text>
          </Btn>
          <Btn
            onPress={() => setScopeFilter('PERSONAL')}
            className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg ${
              scopeFilter === 'PERSONAL' ? 'bg-purple-600 shadow-2xs' : ''
            }`}
          >
            <Lock
              {...ic(scopeFilter === 'PERSONAL' ? 'w-3 h-3 text-white' : 'w-3 h-3 text-slate-600 dark:text-slate-400')}
            />
            <Text
              numberOfLines={1}
              className={`shrink text-xs font-bold ${
                scopeFilter === 'PERSONAL' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kişisel ({personalCount})
            </Text>
          </Btn>
        </View>

        {/* Optional Sub-drawer for Grouping */}
        {showGroupingOptions ? (
          <View style={tw`overflow-hidden`}>
            <View
              style={tw`flex-row items-center justify-between p-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800`}
            >
              <View style={tw`flex-row items-center gap-1 shrink`}>
                <FolderTree {...ic('w-3.5 h-3.5 text-slate-400')} />
                <Text numberOfLines={1} className="shrink text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Gruplama Düzeni:
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-1`}>
                {groupOptions.map((opt) => {
                  const active = groupBy === opt.id;
                  return (
                    <Btn
                      key={opt.id}
                      onPress={() => setGroupBy(opt.id)}
                      className={`px-2 py-1 rounded-md ${active ? opt.activeClass : ''}`}
                    >
                      <Text className={`text-[11px] font-bold ${active ? opt.activeText : 'text-slate-500'}`}>
                        {opt.label}
                      </Text>
                    </Btn>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* LISTS DISPLAY (Flat or Grouped) */}
      {finalFilteredLists.length > 0 ? (
        groupBy === 'NONE' ? (
          <View style={tw`gap-3.5`}>
            {finalFilteredLists.map((list) => (
              <ListCard key={list.id} list={list} onOpenInvite={onOpenInvite} />
            ))}
          </View>
        ) : (
          <View style={tw`gap-6`}>
            {groupedLists.map((group) => (
              <View key={group.id} style={tw`gap-3`}>
                <View style={tw`flex-row items-center justify-between gap-2.5 pt-1`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View
                      style={[
                        tw`w-7 h-7 rounded-xl items-center justify-center shadow-2xs shrink-0`,
                        { backgroundColor: group.color },
                      ]}
                    >
                      {renderGroupIcon(group.iconName)}
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{group.title}</Text>
                      <View style={tw`px-2 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-full`}>
                        <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {group.lists.length}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={tw`h-px flex-1 bg-slate-200/80 dark:bg-slate-800 ml-2`} />
                </View>

                <View style={tw`gap-3.5`}>
                  {group.lists.map((list) => (
                    <ListCard key={list.id} list={list} onOpenInvite={onOpenInvite} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      ) : (
        /* Purposeful Empty State per Hub */
        <View
          style={tw`items-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-6 gap-3`}
        >
          <View style={tw`w-12 h-12 self-center rounded-2xl items-center justify-center shadow-xs`}>
            {activeHub === 'SHOPPING' ? (
              <View style={tw`w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 items-center justify-center`}>
                <ShoppingCart {...ic('w-6 h-6 text-emerald-600')} />
              </View>
            ) : null}
            {activeHub === 'TODO' ? (
              <View style={tw`w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 items-center justify-center`}>
                <CheckSquare {...ic('w-6 h-6 text-amber-500')} />
              </View>
            ) : null}
            {activeHub === 'NOTE' ? (
              <View style={tw`w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 items-center justify-center`}>
                <StickyNote {...ic('w-6 h-6 text-purple-600')} />
              </View>
            ) : null}
          </View>

          <View style={tw`items-center`}>
            <Text className="text-sm font-bold text-slate-900 dark:text-white text-center">
              {search
                ? 'Aramanıza uygun liste bulunamadı'
                : activeHub === 'SHOPPING'
                  ? 'Henüz bir alışveriş listeniz yok'
                  : activeHub === 'TODO'
                    ? 'Planlanmış bir görev listeniz yok'
                    : 'Henüz kayıtlı bir notunuz yok'}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 max-w-sm self-center mt-1 text-center">
              {search
                ? 'Farklı bir anahtar kelime deneyebilir veya yeni bir liste oluşturabilirsiniz.'
                : activeHub === 'SHOPPING'
                  ? 'Haftalık market, pazar veya eczane alışverişlerinizi planlamak için hemen bir liste açın.'
                  : activeHub === 'TODO'
                    ? 'Günlük yapılacaklar, aile görevleri veya temizlik planı oluşturun.'
                    : 'Aklınıza gelen fikirleri, yemek tariflerini veya önemli bilgileri buraya kaydedin.'}
            </Text>
          </View>

          <Btn
            onPress={handleOpenCreateForActiveHub}
            className={`flex-row items-center self-center gap-1.5 px-4 py-2 rounded-xl shadow-xs ${hubBg}`}
          >
            <Plus {...ic('w-4 h-4 text-white')} />
            <Text className="text-xs font-bold text-white">
              {activeHub === 'SHOPPING'
                ? 'İlk Alışveriş Listesini Oluştur'
                : activeHub === 'TODO'
                  ? 'İlk Görev Listesini Oluştur'
                  : 'İlk Notu Yaz'}
            </Text>
          </Btn>
        </View>
      )}
    </View>
  );
};
