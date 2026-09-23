import React, { useState, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  BarChart2,
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  CreditCard,
  Filter,
  ListChecks,
  Lock,
  PieChart as PieIcon,
  Receipt,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Users,
} from 'lucide-react-native';

import { getAccessibleExpenses, getAccessibleLists } from '../lib/permissions';
import { copyToClipboard } from '../lib/native';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { BarChart, DonutChart } from './charts';
import { Btn, Gradient, Grid, Input, Select, Text } from './ui';
import { UserAvatar } from './UserAvatar';

const PERIOD_OPTIONS = [
  { value: '2026-08', label: 'Ağustos 2026 (Bu Ay)' },
  { value: '2026-07', label: 'Temmuz 2026' },
  { value: '2026-06', label: 'Haziran 2026' },
  { value: '2026-05', label: 'Mayıs 2026' },
  { value: 'LAST_3_MONTHS', label: 'Son 3 Ay (Yaz 2026)' },
  { value: 'LAST_6_MONTHS', label: 'Son 6 Ay (Mart-Ağustos)' },
  { value: 'ALL_2026', label: '2026 Tüm Yıl' },
];

export const AnalyticsView: React.FC = () => {
  const {
    expenses: allExpenses,
    categories,
    lists: allLists,
    items,
    users,
    currentUser,
    monthlyBudget,
    setSelectedListId,
  } = useAppStore();

  // Strictly filter by permissions for current user / family
  const expenses = useMemo(
    () => getAccessibleExpenses(allExpenses, currentUser),
    [allExpenses, currentUser],
  );
  const lists = useMemo(() => getAccessibleLists(allLists, currentUser), [allLists, currentUser]);

  // Active View Tab: 'spending' | 'lists' | 'members'
  const [activeReportTab, setActiveReportTab] = useState<'spending' | 'lists' | 'members'>(
    'spending',
  );

  // Scope Filter: ALL | SHARED (Ortak) | PERSONAL (Kişisel)
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SHARED' | 'PERSONAL'>('ALL');

  // Period Selector: Month or Multi-month
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');

  // Expense Category filter & search query
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Copy Summary feedback
  const [copied, setCopied] = useState(false);

  // 1. FILTER EXPENSES BY PERIOD & SCOPE
  const filteredPeriodExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Period filter
      let periodMatch = false;
      if (selectedPeriod === 'ALL_2026') {
        periodMatch = e.date.startsWith('2026');
      } else if (selectedPeriod === 'LAST_3_MONTHS') {
        // Jun, Jul, Aug 2026
        periodMatch =
          e.date.startsWith('2026-08') ||
          e.date.startsWith('2026-07') ||
          e.date.startsWith('2026-06');
      } else if (selectedPeriod === 'LAST_6_MONTHS') {
        // Mar - Aug 2026
        periodMatch =
          e.date.startsWith('2026-08') ||
          e.date.startsWith('2026-07') ||
          e.date.startsWith('2026-06') ||
          e.date.startsWith('2026-05') ||
          e.date.startsWith('2026-04') ||
          e.date.startsWith('2026-03');
      } else {
        periodMatch = e.date.startsWith(selectedPeriod);
      }

      if (!periodMatch) return false;

      // Scope filter
      const isExpShared = e.isShared === true;
      if (scopeFilter === 'SHARED' && !isExpShared) return false;
      if (scopeFilter === 'PERSONAL' && isExpShared) return false;

      return true;
    });
  }, [expenses, selectedPeriod, scopeFilter]);

  // Filtered expense list for display (with category and text search)
  const displayExpenses = useMemo(() => {
    return filteredPeriodExpenses.filter((e) => {
      if (filterCategoryId && e.categoryId !== filterCategoryId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.listTitle?.toLowerCase().includes(q);
        const matchesCat = e.categoryName?.toLowerCase().includes(q);
        const matchesNote = e.note?.toLowerCase().includes(q);
        const matchesItems = e.itemsSummary?.some((i) => i.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCat && !matchesNote && !matchesItems) {
          return false;
        }
      }
      return true;
    });
  }, [filteredPeriodExpenses, filterCategoryId, searchQuery]);

  // 2. FINANCIAL CALCULATIONS
  const totalSpent = useMemo(() => {
    return filteredPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredPeriodExpenses]);

  const sharedSpent = useMemo(() => {
    return filteredPeriodExpenses
      .filter((e) => e.isShared === true)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredPeriodExpenses]);

  const personalSpent = useMemo(() => {
    return filteredPeriodExpenses
      .filter((e) => e.isShared !== true)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredPeriodExpenses]);

  const sharedPercent = totalSpent > 0 ? Math.round((sharedSpent / totalSpent) * 100) : 0;
  const personalPercent = totalSpent > 0 ? 100 - sharedPercent : 0;

  const averageTransaction =
    filteredPeriodExpenses.length > 0 ? Math.round(totalSpent / filteredPeriodExpenses.length) : 0;

  // Budget calculations (adjusted if multi-month)
  const periodMultiplier =
    selectedPeriod === 'LAST_3_MONTHS'
      ? 3
      : selectedPeriod === 'LAST_6_MONTHS'
        ? 6
        : selectedPeriod === 'ALL_2026'
          ? 8
          : 1;

  const adjustedMonthlyBudget = monthlyBudget * periodMultiplier;
  const remainingBudget = adjustedMonthlyBudget - totalSpent;
  const budgetUsagePercent = Math.min(100, Math.round((totalSpent / adjustedMonthlyBudget) * 100));

  // 3. CATEGORY AGGREGATIONS FOR PIE CHART
  const { pieChartData, rankedCategories } = useMemo(() => {
    const map: { [catId: string]: { name: string; color: string; amount: number; count: number } } =
      {};

    categories.forEach((cat) => {
      map[cat.id] = { name: cat.name, color: cat.color, amount: 0, count: 0 };
    });

    filteredPeriodExpenses.forEach((exp) => {
      const cat = categories.find((c) => c.id === exp.categoryId);
      const catKey = exp.categoryId || 'cat-diger';
      if (!map[catKey]) {
        map[catKey] = {
          name: exp.categoryName || cat?.name || 'Diğer Giderler',
          color: cat?.color || '#8b5cf6',
          amount: 0,
          count: 0,
        };
      }
      map[catKey].amount += exp.amount;
      map[catKey].count += exp.itemCount || 1;
    });

    const pie = Object.values(map)
      .filter((c) => c.amount > 0)
      .map((c) => ({
        name: c.name,
        value: Math.round(c.amount),
        color: c.color,
      }))
      .sort((a, b) => b.value - a.value);

    const ranked = Object.entries(map)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount);

    return { pieChartData: pie, rankedCategories: ranked };
  }, [categories, filteredPeriodExpenses]);

  // 4. TREND CHART DATA (Weekly or Monthly depending on period)
  const trendChartData = useMemo(() => {
    if (
      selectedPeriod === 'LAST_3_MONTHS' ||
      selectedPeriod === 'LAST_6_MONTHS' ||
      selectedPeriod === 'ALL_2026'
    ) {
      // Group by Month
      const monthMap: {
        [month: string]: { name: string; ortak: number; kisisel: number; total: number };
      } = {
        '2026-01': { name: 'Oca', ortak: 0, kisisel: 0, total: 0 },
        '2026-02': { name: 'Şub', ortak: 0, kisisel: 0, total: 0 },
        '2026-03': { name: 'Mar', ortak: 0, kisisel: 0, total: 0 },
        '2026-04': { name: 'Nis', ortak: 0, kisisel: 0, total: 0 },
        '2026-05': { name: 'May', ortak: 0, kisisel: 0, total: 0 },
        '2026-06': { name: 'Haz', ortak: 0, kisisel: 0, total: 0 },
        '2026-07': { name: 'Tem', ortak: 0, kisisel: 0, total: 0 },
        '2026-08': { name: 'Ağu', ortak: 0, kisisel: 0, total: 0 },
      };

      filteredPeriodExpenses.forEach((exp) => {
        const ym = exp.date.substring(0, 7);
        if (monthMap[ym]) {
          if (exp.isShared === true) {
            monthMap[ym].ortak += exp.amount;
          } else {
            monthMap[ym].kisisel += exp.amount;
          }
          monthMap[ym].total += exp.amount;
        }
      });

      if (selectedPeriod === 'LAST_3_MONTHS') {
        return [monthMap['2026-06'], monthMap['2026-07'], monthMap['2026-08']];
      }
      if (selectedPeriod === 'LAST_6_MONTHS') {
        return [
          monthMap['2026-03'],
          monthMap['2026-04'],
          monthMap['2026-05'],
          monthMap['2026-06'],
          monthMap['2026-07'],
          monthMap['2026-08'],
        ];
      }
      return Object.values(monthMap);
    } else {
      // Group by Week in Single Month
      const weekly = [
        { name: '1. Hafta (1-7)', ortak: 0, kisisel: 0, total: 0 },
        { name: '2. Hafta (8-14)', ortak: 0, kisisel: 0, total: 0 },
        { name: '3. Hafta (15-21)', ortak: 0, kisisel: 0, total: 0 },
        { name: '4. Hafta (22+)', ortak: 0, kisisel: 0, total: 0 },
      ];

      filteredPeriodExpenses.forEach((exp) => {
        const day = parseInt(exp.date.split('-')[2], 10) || 1;
        let index = 0;
        if (day <= 7) index = 0;
        else if (day <= 14) index = 1;
        else if (day <= 21) index = 2;
        else index = 3;

        if (exp.isShared === true) {
          weekly[index].ortak += exp.amount;
        } else {
          weekly[index].kisisel += exp.amount;
        }
        weekly[index].total += exp.amount;
      });

      return weekly;
    }
  }, [filteredPeriodExpenses, selectedPeriod]);

  // 5. PAYMENT METHOD BREAKDOWN
  const paymentMethodsBreakdown = useMemo(() => {
    const map: { [method: string]: { amount: number; count: number } } = {
      'Kredi Kartı': { amount: 0, count: 0 },
      'Banka Kartı / Havale': { amount: 0, count: 0 },
      'Otomatik Ödeme': { amount: 0, count: 0 },
      Nakit: { amount: 0, count: 0 },
    };

    filteredPeriodExpenses.forEach((e) => {
      const pm = e.paymentMethod || 'Kredi Kartı';
      if (!map[pm]) {
        map[pm] = { amount: 0, count: 0 };
      }
      map[pm].amount += e.amount;
      map[pm].count += 1;
    });

    return Object.entries(map).filter(([_, data]) => data.amount > 0);
  }, [filteredPeriodExpenses]);

  // 6. LIST & TASK ANALYTICS CALCULATIONS
  const listStats = useMemo(() => {
    const totalListsCount = lists.length;
    const sharedListsCount = lists.filter((l) => l.isShared !== false).length;
    const personalListsCount = lists.filter((l) => l.isShared === false).length;

    const shoppingLists = lists.filter((l) => l.type === 'SHOPPING');
    const todoLists = lists.filter((l) => l.type === 'TODO');
    const noteLists = lists.filter((l) => l.type === 'NOTE');

    // Total active shopping cart amount pending to be bought
    const pendingShoppingCost = items
      .filter((i) => {
        const parentList = lists.find((l) => l.id === i.listId);
        return parentList?.type === 'SHOPPING' && !i.isCompleted;
      })
      .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

    const completedShoppingCost = items
      .filter((i) => {
        const parentList = lists.find((l) => l.id === i.listId);
        return parentList?.type === 'SHOPPING' && i.isCompleted;
      })
      .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

    // Todo tasks completion stats
    const todoItems = items.filter((i) => {
      const parentList = lists.find((l) => l.id === i.listId);
      return parentList?.type === 'TODO';
    });
    const totalTodos = todoItems.length;
    const completedTodos = todoItems.filter((i) => i.isCompleted).length;
    const pendingTodos = totalTodos - completedTodos;
    const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // High priority pending todos
    const urgentPendingTodos = todoItems.filter(
      (i) => !i.isCompleted && i.priority === 'HIGH',
    ).length;

    // List individual breakdown stats
    const listBreakdown = lists.map((l) => {
      const listItems = items.filter((i) => i.listId === l.id);
      const completedCount = listItems.filter((i) => i.isCompleted).length;
      const totalCount = listItems.length;
      const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const estBudget =
        l.type === 'SHOPPING'
          ? listItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)
          : 0;

      return {
        ...l,
        itemCount: totalCount,
        completedCount,
        completionRate: rate,
        estimatedBudget: estBudget,
      };
    });

    return {
      totalListsCount,
      sharedListsCount,
      personalListsCount,
      shoppingListsCount: shoppingLists.length,
      todoListsCount: todoLists.length,
      noteListsCount: noteLists.length,
      pendingShoppingCost,
      completedShoppingCost,
      totalTodos,
      completedTodos,
      pendingTodos,
      urgentPendingTodos,
      todoCompletionRate,
      listBreakdown,
    };
  }, [lists, items]);

  // 7. MEMBER BREAKDOWN & SPENDING CONTRIBUTIONS
  const memberStats = useMemo(() => {
    return users
      .map((user) => {
        const userExpenses = filteredPeriodExpenses.filter((e) => e.userId === user.id);
        const userTotalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
        const userSharedSpent = userExpenses
          .filter((e) => e.isShared === true)
          .reduce((sum, e) => sum + e.amount, 0);
        const userPersonalSpent = userExpenses
          .filter((e) => e.isShared !== true)
          .reduce((sum, e) => sum + e.amount, 0);

        // Completed items by user
        const userCompletedItems = items.filter((i) => i.completedBy === user.id).length;

        // Lists owned by user
        const ownedLists = lists.filter((l) => l.ownerId === user.id).length;

        const shareOfTotal = totalSpent > 0 ? Math.round((userTotalSpent / totalSpent) * 100) : 0;

        return {
          user,
          totalSpent: userTotalSpent,
          sharedSpent: userSharedSpent,
          personalSpent: userPersonalSpent,
          expenseCount: userExpenses.length,
          completedTasksCount: userCompletedItems,
          ownedListsCount: ownedLists,
          shareOfTotal,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [users, filteredPeriodExpenses, items, lists, totalSpent]);

  // Copy Report Summary to Clipboard
  const handleCopySummary = () => {
    const periodLabel =
      selectedPeriod === '2026-08'
        ? 'Ağustos 2026'
        : selectedPeriod === '2026-07'
          ? 'Temmuz 2026'
          : selectedPeriod === '2026-06'
            ? 'Haziran 2026'
            : selectedPeriod === 'LAST_3_MONTHS'
              ? 'Son 3 Ay (Yaz 2026)'
              : selectedPeriod === 'LAST_6_MONTHS'
                ? 'Son 6 Ay'
                : '2026 Yıllık';

    const scopeLabel =
      scopeFilter === 'ALL' ? 'Tüm Kapsam' : scopeFilter === 'SHARED' ? 'Ortak / Aile' : 'Kişisel';

    const summaryText = `📊 FINANS & LİSTE RAPORU (${periodLabel} - ${scopeLabel})
-----------------------------------------
💰 Toplam Harcama: ${totalSpent.toLocaleString('tr-TR')} ₺
👥 Ortak / Aile Harcaması: ${sharedSpent.toLocaleString('tr-TR')} ₺ (%${sharedPercent})
🔒 Kişisel Harcama: ${personalSpent.toLocaleString('tr-TR')} ₺ (%${personalPercent})
🎯 Bütçe Kullanımı: %${budgetUsagePercent} (Kalan: ${remainingBudget.toLocaleString('tr-TR')} ₺)
🧾 Toplam Fiş/İşlem: ${filteredPeriodExpenses.length} Adet (Ort. ${averageTransaction.toLocaleString('tr-TR')} ₺)

🏆 En Çok Harcanan Kategoriler:
${rankedCategories
  .slice(0, 3)
  .map((c, i) => `${i + 1}. ${c[1].name}: ${c[1].amount.toLocaleString('tr-TR')} ₺`)
  .join('\n')}

📋 Liste Durumu:
- Toplam Liste: ${listStats.totalListsCount} (${listStats.sharedListsCount} Ortak, ${listStats.personalListsCount} Kişisel)
- Bekleyen Alışveriş Sepeti: ${listStats.pendingShoppingCost.toLocaleString('tr-TR')} ₺
- Yapılacaklar Tamamlama Oranı: %${listStats.todoCompletionRate} (${listStats.completedTodos}/${listStats.totalTodos})
-----------------------------------------
Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;

    copyToClipboard(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reportTabs = [
    { id: 'spending' as const, label: 'Harcama & Bütçe', icon: PieIcon },
    { id: 'lists' as const, label: 'Liste & Görev Analizi', icon: ListChecks },
    { id: 'members' as const, label: 'Kişi / Üye Paylaşımı', icon: Users },
  ];

  const kpiCard = 'bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm';
  const kpiLabel = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider';

  return (
    <View style={tw`gap-4`}>
      {/* Top Header Card */}
      <View style={tw`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm gap-3`}>
        <View style={tw`flex-col justify-between gap-2.5`}>
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
              <Gradient
                dir="tr"
                colors={['emerald-600', 'teal-500']}
                className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              >
                <BarChart2 {...ic('w-4 h-4 text-white')} />
              </Gradient>
              <View style={tw`flex-1 min-w-0`}>
                <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                  Raporlar & Analizler
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ortak, Kişisel Harcamalar ve Liste İstatistikleri
                </Text>
              </View>
            </View>

            {/* Copy Summary Button on Mobile */}
            <Btn
              onPress={handleCopySummary}
              accessibilityLabel="Özeti Kopyala"
              className="flex-row items-center gap-1.5 px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"
            >
              {copied ? (
                <Check {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
              ) : (
                <Copy {...ic('w-4 h-4 text-slate-700 dark:text-slate-200')} />
              )}
              <Text className="text-slate-700 dark:text-slate-200 text-xs font-semibold">
                {copied ? 'Kopyalandı' : 'Özet'}
              </Text>
            </Btn>
          </View>

          {/* Period Selector & Scope Quick Bar */}
          <View style={tw`flex-row items-center gap-2 flex-wrap`}>
            {/* Period Dropdown */}
            <View
              style={tw`flex-1 flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800 pl-3 pr-2 h-11 rounded-xl border border-slate-200 dark:border-slate-700`}
            >
              <Calendar {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                options={PERIOD_OPTIONS}
                className="flex-1 h-11 bg-transparent pr-1 gap-1"
                textClassName="text-sm font-bold text-slate-800 dark:text-slate-100"
              />
            </View>
          </View>
        </View>

        {/* Report Sub-Tabs (Harcama & Bütçe | Listeler & Görevler | Kişi Dağılımı) */}
        <View style={tw`border-t border-slate-100 dark:border-slate-800 pt-3`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2`}
          >
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeReportTab === tab.id;
              return (
                <Btn
                  key={tab.id}
                  onPress={() => setActiveReportTab(tab.id)}
                  className={`flex-row items-center gap-1.5 px-3.5 h-10 rounded-xl ${
                    isActive ? 'bg-emerald-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Icon {...ic(`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`)} />
                  <Text
                    className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    {tab.label}
                  </Text>
                </Btn>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={tw`gap-4`}>
        {/* ============================================================ */}
        {/* TAB 1: HARCAMA & BÜTÇE RAPORU                                 */}
        {/* ============================================================ */}
        {activeReportTab === 'spending' && (
          <View style={tw`gap-4`}>
            {/* Scope Filter Switcher (Tümü | Ortak / Aile | Kişisel) */}
            <View
              style={tw`bg-white dark:bg-slate-900 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-2.5`}
            >
              <View style={tw`flex-row items-center gap-1.5 px-4`}>
                <Filter {...ic('w-3.5 h-3.5 text-slate-400 dark:text-slate-500')} />
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">Kapsam Filtresi:</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-2 px-4`}
              >
                <Btn
                  onPress={() => setScopeFilter('ALL')}
                  className={`px-3.5 h-10 justify-center rounded-xl ${scopeFilter === 'ALL' ? 'bg-slate-900 dark:bg-slate-700 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  <Text
                    className={`text-xs font-bold ${scopeFilter === 'ALL' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    Tümü ({filteredPeriodExpenses.length})
                  </Text>
                </Btn>
                <Btn
                  onPress={() => setScopeFilter('SHARED')}
                  className={`flex-row items-center gap-1.5 px-3.5 h-10 rounded-xl ${
                    scopeFilter === 'SHARED' ? 'bg-sky-500 shadow-sm' : 'bg-sky-50 dark:bg-sky-950/60'
                  }`}
                >
                  <Users
                    {...ic(`w-3.5 h-3.5 ${scopeFilter === 'SHARED' ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`)}
                  />
                  <Text
                    className={`text-xs font-bold ${scopeFilter === 'SHARED' ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`}
                  >
                    Ortak / Aile
                  </Text>
                </Btn>
                <Btn
                  onPress={() => setScopeFilter('PERSONAL')}
                  className={`flex-row items-center gap-1.5 px-3.5 h-10 rounded-xl ${
                    scopeFilter === 'PERSONAL' ? 'bg-purple-600 shadow-sm' : 'bg-purple-50 dark:bg-purple-950/60'
                  }`}
                >
                  <Lock
                    {...ic(
                      `w-3.5 h-3.5 ${scopeFilter === 'PERSONAL' ? 'text-white' : 'text-purple-700 dark:text-purple-300'}`,
                    )}
                  />
                  <Text
                    className={`text-xs font-bold ${scopeFilter === 'PERSONAL' ? 'text-white' : 'text-purple-700 dark:text-purple-300'}`}
                  >
                    Kişisel / Özel
                  </Text>
                </Btn>
              </ScrollView>
            </View>

            {/* Scope Comparison Visual Banner */}
            <Gradient
              dir="r"
              colors={['sky-900', 'indigo-900', 'slate-900']}
              className="p-4 rounded-3xl shadow-sm"
            >
              <View style={tw`flex-col justify-between gap-4`}>
                <View>
                  <Text className="text-[11px] font-bold tracking-wider uppercase text-sky-300">
                    Seçili Dönem Kapsam Özeti
                  </Text>
                  <Text className="text-xl font-black mt-0.5 text-white" numberOfLines={1} adjustsFontSizeToFit>
                    {totalSpent.toLocaleString('tr-TR')} ₺
                  </Text>
                  <Text className="text-xs text-slate-300 mt-1">
                    {filteredPeriodExpenses.length} işlem kaydı üzerinden hesaplandı
                  </Text>
                </View>

                {/* Shared vs Personal Split */}
                <Grid
                  cols={2}
                  gap={3}
                  className="bg-white/10 p-3 rounded-2xl border border-white/10"
                >
                  <View style={tw`gap-0.5`}>
                    <View style={tw`flex-row items-center gap-1`}>
                      <Users {...ic('w-3 h-3 text-sky-400')} />
                      <Text className="text-[11px] text-sky-200 font-semibold">Ortak / Aile</Text>
                    </View>
                    <Text className="text-sm font-black text-white" numberOfLines={1} adjustsFontSizeToFit>
                      {sharedSpent.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text className="text-[10px] text-sky-300 font-bold">%{sharedPercent} pay</Text>
                  </View>

                  <View style={tw`gap-0.5 border-l border-white/10 pl-3`}>
                    <View style={tw`flex-row items-center gap-1`}>
                      <Lock {...ic('w-3 h-3 text-purple-400')} />
                      <Text className="text-[11px] text-purple-200 font-semibold">
                        Kişisel / Özel
                      </Text>
                    </View>
                    <Text className="text-sm font-black text-white" numberOfLines={1} adjustsFontSizeToFit>
                      {personalSpent.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text className="text-[10px] text-purple-300 font-bold">
                      %{personalPercent} pay
                    </Text>
                  </View>
                </Grid>
              </View>

              {/* Progress bar of Shared vs Personal */}
              <View style={tw`mt-4 pt-3 border-t border-white/10`}>
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <Text className="text-[11px] text-slate-300 font-medium">
                    Harcama Kapsam Dağılımı
                  </Text>
                  <Text className="text-[11px] text-slate-300 font-medium">
                    Ortak %{sharedPercent} — Kişisel %{personalPercent}
                  </Text>
                </View>
                <View style={tw`w-full bg-black/40 h-2.5 rounded-full overflow-hidden flex-row`}>
                  <View style={[tw`bg-sky-400 h-full`, { width: `${sharedPercent}%` }]} />
                  <View style={[tw`bg-purple-400 h-full`, { width: `${personalPercent}%` }]} />
                </View>
              </View>
            </Gradient>

            {/* KPI Metric Cards */}
            <Grid cols={2} gap={3}>
              {/* Total Spent */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Toplam Harcama</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-1" numberOfLines={1} adjustsFontSizeToFit>
                  {totalSpent.toLocaleString('tr-TR')} ₺
                </Text>
                <View style={tw`flex-row items-center gap-1 mt-1`}>
                  <Sparkles {...ic('w-3 h-3 text-emerald-600 dark:text-emerald-400')} />
                  <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {filteredPeriodExpenses.length} Fiş / İşlem
                  </Text>
                </View>
              </View>

              {/* Budget Limit Card */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Dönem Hedef Bütçe</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-1" numberOfLines={1} adjustsFontSizeToFit>
                  {adjustedMonthlyBudget.toLocaleString('tr-TR')} ₺
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {periodMultiplier > 1 ? `${periodMultiplier} Aylık Toplam` : 'Aylık Tavan'}
                </Text>
              </View>

              {/* Remaining Budget */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Kalan Bütçe</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className={`text-lg font-black mt-1 ${remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {remainingBudget.toLocaleString('tr-TR')} ₺
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {remainingBudget >= 0 ? 'Bütçe Dahilinde' : 'Bütçe Aşıldı'}
                </Text>
              </View>

              {/* Average Transaction */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Ortalama Fiş Tutarı</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-1" numberOfLines={1} adjustsFontSizeToFit>
                  {averageTransaction.toLocaleString('tr-TR')} ₺
                </Text>
                <Text className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                  İşlem Başı Harcama
                </Text>
              </View>
            </Grid>

            {/* Charts Section: Pie (Donut) & Bar Chart */}
            <View style={tw`gap-4`}>
              {/* Category Donut Chart */}
              <View
                style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm justify-between`}
              >
                <View>
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <View style={tw`flex-row items-center gap-1.5`}>
                      <PieIcon {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                      <Text className="font-bold text-slate-900 dark:text-white text-sm">
                        Kategorilere Göre Harcama
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Halka Grafik</Text>
                  </View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Seçili dönemdeki harcamaların sektör bazlı dökümü
                  </Text>
                </View>

                {pieChartData.length > 0 ? (
                  <View style={tw`h-64 w-full my-2`}>
                    <DonutChart
                      data={pieChartData}
                      height={256}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      formatter={(value) => [
                        `${Number(value).toLocaleString('tr-TR')} ₺`,
                        'Harcama',
                      ]}
                    />
                  </View>
                ) : (
                  <View style={tw`h-60 items-center justify-center`}>
                    <Text className="text-xs text-slate-400 dark:text-slate-500">
                      Bu dönem için harcama kaydı bulunmuyor.
                    </Text>
                  </View>
                )}

                {/* Custom Pie Chart Legend */}
                <Grid cols={2} gap={1.5} className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {pieChartData.slice(0, 6).map((item, idx) => (
                    <View key={idx} style={tw`flex-row items-center gap-1.5`}>
                      <View
                        style={[
                          tw`w-2.5 h-2.5 rounded-full shrink-0`,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text
                        className="text-slate-600 dark:text-slate-300 text-[11px]"
                        numberOfLines={1}
                        style={{ flexShrink: 1 }}
                      >
                        {item.name}:
                      </Text>
                      <Text className="font-bold text-slate-900 dark:text-white text-[11px]">
                        {item.value.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                  ))}
                </Grid>
              </View>

              {/* Trend Bar Chart */}
              <View
                style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm justify-between`}
              >
                <View>
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <View style={tw`flex-row items-center gap-1.5`}>
                      <BarChart2 {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />
                      <Text className="font-bold text-slate-900 dark:text-white text-sm">
                        Dönemsel Harcama Trendi
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {selectedPeriod.startsWith('LAST') || selectedPeriod === 'ALL_2026'
                        ? 'Aylık Dağılım'
                        : 'Haftalık Dağılım'}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Ortak ve kişisel harcamaların zaman içindeki akışı
                  </Text>
                </View>

                <View style={tw`h-64 w-full my-2`}>
                  <BarChart
                    data={trendChartData}
                    xKey="name"
                    height={256}
                    margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                    series={[
                      { dataKey: 'ortak', name: 'Ortak', color: '#0284c7', radius: 0 },
                      { dataKey: 'kisisel', name: 'Kişisel', color: '#9333ea', radius: 6 },
                    ]}
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString('tr-TR')} ₺`,
                      name === 'ortak' ? 'Ortak / Aile' : name === 'kisisel' ? 'Kişisel' : 'Toplam',
                    ]}
                  />
                </View>

                {/* Trend Legend */}
                <View
                  style={tw`flex-row items-center justify-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800`}
                >
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <View style={tw`w-3 h-3 rounded-md bg-sky-600`} />
                    <Text className="text-[11px] text-slate-600 dark:text-slate-300">Ortak / Aile</Text>
                  </View>
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <View style={tw`w-3 h-3 rounded-md bg-purple-600`} />
                    <Text className="text-[11px] text-slate-600 dark:text-slate-300">Kişisel / Özel</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Ranked Categories Breakdown List */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm`}>
              <Text className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                Kategori Harcama Sıralaması (Leaderboard)
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Bütçenizin en çok aktarıldığı sektörlerin detaylı sıralaması
              </Text>

              <View style={tw`gap-3`}>
                {rankedCategories.map(([catId, data], index) => {
                  const percent = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
                  return (
                    <View key={catId} style={tw`gap-1`}>
                      <View style={tw`flex-row items-center justify-between gap-2`}>
                        <View style={tw`flex-row items-center gap-2 flex-1 min-w-0 flex-wrap`}>
                          <View
                            style={tw`w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center`}
                          >
                            <Text className="text-slate-700 dark:text-slate-200 font-bold text-[10px]">
                              {index + 1}
                            </Text>
                          </View>
                          <View
                            style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: data.color }]}
                          />
                          <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.name}</Text>
                          <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({data.count} Fiş / Ürün)
                          </Text>
                        </View>
                        <View style={tw`flex-row items-baseline`}>
                          <Text className="text-xs font-black text-slate-900 dark:text-white">
                            {data.amount.toLocaleString('tr-TR')} ₺
                          </Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                            %{percent}
                          </Text>
                        </View>
                      </View>
                      <View style={tw`w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden`}>
                        <View
                          style={[
                            tw`h-full rounded-full`,
                            { width: `${percent}%`, backgroundColor: data.color },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Payment Methods Breakdown Cards */}
            {paymentMethodsBreakdown.length > 0 && (
              <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm`}>
                <Text className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                  Ödeme Yöntemleri Dağılımı
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Kart, havale ve nakit kanalları üzerinden yapılan harcama hacmi
                </Text>

                <Grid cols={2} gap={2.5}>
                  {paymentMethodsBreakdown.map(([method, data]) => {
                    const pct = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
                    return (
                      <View
                        key={method}
                        style={tw`p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 gap-1`}
                      >
                        <View style={tw`flex-row items-center gap-1.5`}>
                          <CreditCard {...ic('w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')} />
                          <Text
                            className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex-1"
                            numberOfLines={1}
                          >
                            {method}
                          </Text>
                        </View>
                        <Text className="font-black text-slate-900 dark:text-white text-sm" numberOfLines={1} adjustsFontSizeToFit>
                          {data.amount.toLocaleString('tr-TR')} ₺
                        </Text>
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                          {data.count} İşlem (%{pct})
                        </Text>
                      </View>
                    );
                  })}
                </Grid>
              </View>
            )}

            {/* Expense Logs Timeline & Filter */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm gap-3`}>
              <View style={tw`flex-col justify-between gap-2.5`}>
                <View>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">
                    Alışveriş & Harcama Geçmişi
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Seçili döneme ve filtreye ait tüm onaylı kayıtlar
                  </Text>
                </View>

                <View style={tw`gap-2`}>
                  {/* Search Input */}
                  <View style={tw`relative justify-center`}>
                    <View style={tw`absolute left-3.5 z-10`} pointerEvents="none">
                      <Search {...ic('w-4 h-4 text-slate-400 dark:text-slate-500')} />
                    </View>
                    <Input
                      placeholder="Fiş, ürün veya not ara..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                      autoCapitalize="none"
                      clearButtonMode="while-editing"
                      className="w-full h-11 pl-10 pr-3 text-[15px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </View>

                  {/* Filter by Category */}
                  <View>
                    <Select
                      value={filterCategoryId || ''}
                      onChange={(value) => setFilterCategoryId(value || null)}
                      options={[
                        { value: '', label: 'Tüm Kategoriler' },
                        ...categories.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 h-11 gap-1"
                      textClassName="text-sm text-slate-700 dark:text-slate-200"
                    />
                  </View>
                </View>
              </View>

              {/* Expense List */}
              <View style={tw`gap-2.5 pt-1`}>
                {displayExpenses.length > 0 ? (
                  displayExpenses.map((exp) => {
                    const cat = categories.find((c) => c.id === exp.categoryId);
                    const user = users.find((u) => u.id === exp.userId);
                    const isExpShared = exp.isShared === true;

                    return (
                      <View
                        key={exp.id}
                        style={tw`p-3 bg-slate-50/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex-row items-center justify-between gap-3`}
                      >
                        <View style={tw`flex-row items-center gap-3 min-w-0 flex-1`}>
                          <View
                            style={[
                              tw`w-10 h-10 rounded-xl items-center justify-center shrink-0 shadow-sm`,
                              { backgroundColor: cat?.color || '#10b981' },
                            ]}
                          >
                            {exp.type === 'BILL' ? (
                              <Receipt {...ic('w-5 h-5 text-white')} />
                            ) : (
                              <ShoppingBag {...ic('w-5 h-5 text-white')} />
                            )}
                          </View>
                          <View style={tw`min-w-0 flex-1`}>
                            <View style={tw`flex-row items-center gap-1.5 flex-wrap`}>
                              <Text
                                className="font-bold text-slate-900 dark:text-white text-xs"
                                numberOfLines={1}
                                style={{ flexShrink: 1 }}
                              >
                                {exp.listTitle || exp.note || 'Harcama Kaydı'}
                              </Text>

                              {/* Scope Badge */}
                              <View
                                style={tw.style(
                                  'px-2 py-px rounded-md flex-row items-center gap-0.5',
                                  isExpShared ? 'bg-sky-100 dark:bg-sky-950/60' : 'bg-purple-100 dark:bg-purple-950/60',
                                )}
                              >
                                {isExpShared ? (
                                  <Users {...ic('w-2.5 h-2.5 text-sky-700 dark:text-sky-300')} />
                                ) : (
                                  <Lock {...ic('w-2.5 h-2.5 text-purple-700 dark:text-purple-300')} />
                                )}
                                <Text
                                  className={`text-[10px] font-bold ${isExpShared ? 'text-sky-700 dark:text-sky-300' : 'text-purple-700 dark:text-purple-300'}`}
                                >
                                  {isExpShared ? 'Ortak' : 'Kişisel'}
                                </Text>
                              </View>

                              {/* Category Badge */}
                              <View
                                style={[
                                  tw`px-2 py-px rounded-md`,
                                  { backgroundColor: cat?.bgLight },
                                ]}
                              >
                                <Text
                                  className="text-[10px] font-semibold"
                                  style={cat?.color ? { color: cat.color } : undefined}
                                >
                                  {exp.categoryName || cat?.name}
                                </Text>
                              </View>
                            </View>

                            <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                              {exp.itemsSummary && exp.itemsSummary.length > 0
                                ? exp.itemsSummary.join(', ')
                                : exp.note || `${exp.itemCount || 1} adet harcama`}
                            </Text>

                            {/* Footer info: User & Payment method */}
                            <View style={tw`flex-row items-center gap-2 mt-1 flex-wrap`}>
                              {user ? (
                                <View style={tw`flex-row items-center gap-1`}>
                                  <UserAvatar
                                    avatar={user.avatar}
                                    name={user.name}
                                    color={user.color}
                                    size="xs"
                                  />
                                  <Text className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                    {user.name}
                                  </Text>
                                </View>
                              ) : null}
                              {exp.paymentMethod ? (
                                <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                                  • {exp.paymentMethod}
                                </Text>
                              ) : null}
                              <Text className="text-[10px] text-slate-400 dark:text-slate-500">• {exp.date}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={tw`items-end shrink-0`}>
                          <Text className="font-black text-slate-900 dark:text-white text-sm" numberOfLines={1}>
                            {exp.amount.toLocaleString('tr-TR')} ₺
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                    Seçilen kriterlere uygun harcama kaydı bulunamadı.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 2: LİSTE & GÖREV ANALİZİ                                  */}
        {/* ============================================================ */}
        {activeReportTab === 'lists' && (
          <View style={tw`gap-4`}>
            {/* List High-level Summary Cards */}
            <Grid cols={2} gap={3}>
              {/* Total Lists */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Toplam Liste Sayısı</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {listStats.totalListsCount}
                </Text>
                <View style={tw`flex-row items-center gap-1.5 mt-1 flex-wrap`}>
                  <Text className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                    {listStats.sharedListsCount} Ortak
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400">•</Text>
                  <Text className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                    {listStats.personalListsCount} Kişisel
                  </Text>
                </View>
              </View>

              {/* Active Shopping Estimate */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Bekleyen Alışveriş Sepeti</Text>
                <Text className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1" numberOfLines={1} adjustsFontSizeToFit>
                  {listStats.pendingShoppingCost.toLocaleString('tr-TR')} ₺
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {listStats.shoppingListsCount} Alışveriş Listesi
                </Text>
              </View>

              {/* Todo Completion Rate */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Görev Tamamlama Oranı</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  %{listStats.todoCompletionRate}
                </Text>
                <View style={tw`w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5`}>
                  <View
                    style={[
                      tw`bg-amber-500 h-full rounded-full`,
                      { width: `${listStats.todoCompletionRate}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Pending / Urgent Tasks */}
              <View style={tw.style(kpiCard)}>
                <Text className={kpiLabel}>Bekleyen Görevler</Text>
                <Text className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {listStats.pendingTodos} / {listStats.totalTodos}
                </Text>
                <Text className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1">
                  {listStats.urgentPendingTodos} Yüksek Öncelikli
                </Text>
              </View>
            </Grid>

            {/* List Type Distribution Cards */}
            <View style={tw`gap-3`}>
              {/* Shopping Lists Card */}
              <View
                style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center gap-3`}
              >
                <View
                  style={tw`w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center shrink-0`}
                >
                  <ShoppingCart {...ic('w-6 h-6 text-emerald-700 dark:text-emerald-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">Alışveriş Listeleri</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {listStats.shoppingListsCount} Aktif Liste
                  </Text>
                  <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {listStats.completedShoppingCost.toLocaleString('tr-TR')} ₺ Tamamlanan
                  </Text>
                </View>
              </View>

              {/* Todo Lists Card */}
              <View
                style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center gap-3`}
              >
                <View
                  style={tw`w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 items-center justify-center shrink-0`}
                >
                  <CheckSquare {...ic('w-6 h-6 text-amber-700 dark:text-amber-400')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">Yapılacaklar</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {listStats.todoListsCount} Liste • {listStats.totalTodos} Görev
                  </Text>
                  <Text className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                    {listStats.completedTodos} Görev Tamamlandı
                  </Text>
                </View>
              </View>

              {/* Notes Card */}
              <View
                style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-row items-center gap-3`}
              >
                <View
                  style={tw`w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 items-center justify-center shrink-0`}
                >
                  <StickyNote {...ic('w-6 h-6 text-purple-700 dark:text-purple-300')} />
                </View>
                <View style={tw`flex-1`}>
                  <Text className="font-bold text-slate-900 dark:text-white text-sm">Notlar & Fikirler</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {listStats.noteListsCount} Not Defteri
                  </Text>
                  <Text className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                    Fikir & Plan Kayıtları
                  </Text>
                </View>
              </View>
            </View>

            {/* Individual Lists Progress Breakdown */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm`}>
              <Text className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                Listelere Göre Tamamlanma & Bütçe Durumu
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Her bir listenin ilerleme yüzdesi ve tahmini harcama hacmi
              </Text>

              <View style={tw`gap-3`}>
                {listStats.listBreakdown.map((l) => {
                  const isShared = l.isShared !== false;
                  return (
                    <Btn
                      key={l.id}
                      onPress={() => setSelectedListId(l.id)}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 gap-2"
                    >
                      <View style={tw`flex-row items-center justify-between gap-2`}>
                        <View style={tw`flex-row items-center gap-2 flex-1 min-w-0 flex-wrap`}>
                          <View
                            style={[
                              tw`w-2.5 h-2.5 rounded-full`,
                              { backgroundColor: l.color || '#10b981' },
                            ]}
                          />
                          <Text className="font-bold text-slate-900 dark:text-white text-xs">{l.title}</Text>

                          {/* Scope badge */}
                          <View
                            style={tw.style(
                              'px-2 py-px rounded-md flex-row items-center gap-0.5',
                              isShared ? 'bg-sky-100 dark:bg-sky-950/60' : 'bg-purple-100 dark:bg-purple-950/60',
                            )}
                          >
                            {isShared ? (
                              <Users {...ic('w-2.5 h-2.5 text-sky-700 dark:text-sky-300')} />
                            ) : (
                              <Lock {...ic('w-2.5 h-2.5 text-purple-700 dark:text-purple-300')} />
                            )}
                            <Text
                              className={`text-[10px] font-bold ${isShared ? 'text-sky-700 dark:text-sky-300' : 'text-purple-700 dark:text-purple-300'}`}
                            >
                              {isShared ? 'Ortak' : 'Kişisel'}
                            </Text>
                          </View>
                        </View>

                        <View style={tw`flex-row items-center gap-2`}>
                          {l.type === 'SHOPPING' ? (
                            <Text className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                              {l.estimatedBudget.toLocaleString('tr-TR')} ₺
                            </Text>
                          ) : null}
                          <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {l.completedCount}/{l.itemCount} (%{l.completionRate})
                          </Text>
                          <ChevronRight {...ic('w-4 h-4 text-slate-400 dark:text-slate-500')} />
                        </View>
                      </View>

                      {/* Progress bar */}
                      <View style={tw`w-full bg-slate-200/80 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden`}>
                        <View
                          style={[
                            tw`h-full rounded-full`,
                            {
                              width: `${l.completionRate}%`,
                              backgroundColor: l.color || '#10b981',
                            },
                          ]}
                        />
                      </View>
                    </Btn>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 3: KİŞİ / ÜYE PAYLAŞIMI RAPORU                           */}
        {/* ============================================================ */}
        {activeReportTab === 'members' && (
          <View style={tw`gap-4`}>
            {/* Member Comparison Banner */}
            <Gradient
              dir="r"
              colors={['emerald-800', 'teal-900']}
              className="p-5 rounded-3xl shadow-sm"
            >
              <View style={tw`flex-row items-center justify-between gap-2`}>
                <View style={tw`flex-1`}>
                  <Text className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">
                    Aile & Çevre Üye Raporu
                  </Text>
                  <Text className="text-xl font-black mt-0.5 text-white">
                    Harcama & Görev Paylaşımı
                  </Text>
                  <Text className="text-xs text-emerald-100 mt-1">
                    Ortak ve bireysel bütçede kim ne kadar katkıda bulundu?
                  </Text>
                </View>
                <View style={tw`w-12 h-12 rounded-2xl bg-white/10 items-center justify-center`}>
                  <Text className="text-2xl">👥</Text>
                </View>
              </View>
            </Gradient>

            {/* Member Cards Grid */}
            <View style={tw`gap-4`}>
              {memberStats.map((ms) => (
                <View
                  key={ms.user.id}
                  style={tw`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm gap-3`}
                >
                  <View style={tw`flex-row items-center justify-between gap-2`}>
                    <View style={tw`flex-row items-center gap-2.5 flex-1 min-w-0`}>
                      <UserAvatar
                        avatar={ms.user.avatar}
                        name={ms.user.name}
                        color={ms.user.color}
                        size="md"
                      />
                      <View style={tw`flex-1 min-w-0`}>
                        <Text className="font-bold text-slate-900 dark:text-white text-sm">{ms.user.name}</Text>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">@{ms.user.username}</Text>
                      </View>
                    </View>

                    <View style={tw`items-end`}>
                      <Text className="text-base font-black text-slate-900 dark:text-white" numberOfLines={1}>
                        {ms.totalSpent.toLocaleString('tr-TR')} ₺
                      </Text>
                      <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Toplamın %{ms.shareOfTotal}'i
                      </Text>
                    </View>
                  </View>

                  {/* Split Details: Shared vs Personal */}
                  <Grid cols={2} gap={2} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                    <View>
                      <View style={tw`flex-row items-center gap-1`}>
                        <Users {...ic('w-3 h-3 text-sky-600 dark:text-sky-400')} />
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          Ortak Harcama
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
                        {ms.sharedSpent.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>

                    <View style={tw`border-l border-slate-200 dark:border-slate-700 pl-3`}>
                      <View style={tw`flex-row items-center gap-1`}>
                        <Lock {...ic('w-3 h-3 text-purple-600 dark:text-purple-400')} />
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          Kişisel Harcama
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
                        {ms.personalSpent.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                  </Grid>

                  {/* Action stats */}
                  <View
                    style={tw`flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2.5 border-t border-slate-100 dark:border-slate-800`}
                  >
                    <Text className="text-xs text-slate-600 dark:text-slate-300">{ms.expenseCount} Harcama Fişi</Text>
                    <Text className="text-xs text-slate-600 dark:text-slate-300">
                      {ms.completedTasksCount} Görev Tamamladı
                    </Text>
                    <Text className="text-xs text-slate-600 dark:text-slate-300">
                      {ms.ownedListsCount} Liste Sahibi
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
