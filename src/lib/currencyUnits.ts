export type CurrencyUnitKey =
  | 'TRY'
  | 'EUR'
  | 'USD'
  | 'GOLD_GRAM'
  | 'GOLD_QUARTER'
  | 'GOLD_HALF'
  | 'GOLD_FULL'
  | 'GOLD_REPUBLIC'
  | 'GOLD_ONS'
  | 'GBP';

export interface CurrencyUnitConfig {
  key: CurrencyUnitKey;
  label: string;
  symbol: string;
  category: 'CURRENCY' | 'GOLD';
  defaultRateInTRY: number; // Referans güncel piyasa değeri (₺)
  unitSuffix: string; // Adet, Gram, €, $, ₺
  icon: string;
  /** Solid hex accent used by the colorful currency/unit picker. */
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const CURRENCY_UNITS: Record<CurrencyUnitKey, CurrencyUnitConfig> = {
  TRY: {
    key: 'TRY',
    label: 'Türk Lirası (₺)',
    symbol: '₺',
    category: 'CURRENCY',
    defaultRateInTRY: 1,
    unitSuffix: '₺',
    icon: '₺',
    color: '#10b981',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    description: 'Standart TL Mevduat ve Nakit',
  },
  EUR: {
    key: 'EUR',
    label: 'Euro (€)',
    symbol: '€',
    category: 'CURRENCY',
    defaultRateInTRY: 37.80,
    unitSuffix: '€',
    icon: '💶',
    color: '#6366f1',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    description: 'Avrupa Para Birimi',
  },
  USD: {
    key: 'USD',
    label: 'Amerikan Doları ($)',
    symbol: '$',
    category: 'CURRENCY',
    defaultRateInTRY: 34.25,
    unitSuffix: '$',
    icon: '💵',
    color: '#0ea5e9',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'ABD Doları Varlığı',
  },
  GOLD_GRAM: {
    key: 'GOLD_GRAM',
    label: 'Gram Altın (24 Ayar)',
    symbol: 'gr',
    category: 'GOLD',
    defaultRateInTRY: 3150,
    unitSuffix: 'Gram',
    icon: '🪙',
    color: '#f59e0b',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    description: 'Fiziki veya Banka Gram Altın',
  },
  GOLD_QUARTER: {
    key: 'GOLD_QUARTER',
    label: 'Çeyrek Altın',
    symbol: 'çeyrek',
    category: 'GOLD',
    defaultRateInTRY: 5150,
    unitSuffix: 'Adet',
    icon: '🥇',
    color: '#ca8a04',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/60',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
    description: '1.75 gr Darphane Çeyrek Altın',
  },
  GOLD_HALF: {
    key: 'GOLD_HALF',
    label: 'Yarım Altın',
    symbol: 'yarım',
    category: 'GOLD',
    defaultRateInTRY: 10300,
    unitSuffix: 'Adet',
    icon: '🥈',
    color: '#b45309',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-200',
    description: '3.50 gr Darphane Yarım Altın',
  },
  GOLD_FULL: {
    key: 'GOLD_FULL',
    label: 'Tam Altın (Ziynet)',
    symbol: 'tam',
    category: 'GOLD',
    defaultRateInTRY: 20600,
    unitSuffix: 'Adet',
    icon: '👑',
    color: '#92400e',
    badgeBg: 'bg-amber-200/80 dark:bg-amber-900/50',
    badgeText: 'text-amber-900 dark:text-amber-100',
    description: '7.00 gr Darphane Ziynet Tam Altın',
  },
  GOLD_REPUBLIC: {
    key: 'GOLD_REPUBLIC',
    label: 'Cumhuriyet / Ata Altını',
    symbol: 'ata',
    category: 'GOLD',
    defaultRateInTRY: 21250,
    unitSuffix: 'Adet',
    icon: '🎖️',
    color: '#dc2626',
    badgeBg: 'bg-red-50 dark:bg-red-950/60',
    badgeText: 'text-red-700 dark:text-red-300',
    description: '7.21 gr Darphane Ata Lira',
  },
  GOLD_ONS: {
    key: 'GOLD_ONS',
    label: 'Ons Altın (XAU)',
    symbol: 'oz',
    category: 'GOLD',
    defaultRateInTRY: 86000,
    unitSuffix: 'Ons',
    icon: '✨',
    color: '#eab308',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    badgeText: 'text-yellow-700 dark:text-yellow-200',
    description: '31.10 gr Uluslararası Ons Altın',
  },
  GBP: {
    key: 'GBP',
    label: 'İngiliz Sterlini (£)',
    symbol: '£',
    category: 'CURRENCY',
    defaultRateInTRY: 44.90,
    unitSuffix: '£',
    icon: '💷',
    color: '#9333ea',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    description: 'İngiliz Sterlini Varlığı',
  },
};

export const CURRENCY_UNIT_LIST = Object.values(CURRENCY_UNITS);

export const BANK_CARD_CURRENCIES = [
  { key: 'TRY', label: 'Türk Lirası (₺)', symbol: '₺', icon: '₺', code: 'TRY', color: CURRENCY_UNITS.TRY.color },
  { key: 'EUR', label: 'Euro (€)', symbol: '€', icon: '💶', code: 'EUR', color: CURRENCY_UNITS.EUR.color },
  { key: 'USD', label: 'Amerikan Doları ($)', symbol: '$', icon: '💵', code: 'USD', color: CURRENCY_UNITS.USD.color },
  { key: 'GBP', label: 'İngiliz Sterlini (£)', symbol: '£', icon: '💷', code: 'GBP', color: CURRENCY_UNITS.GBP.color },
];

/**
 * Dinamik olarak API/DB'den çekilen günlük canlı kurlarla CURRENCY_UNITS nesnesini günceller
 */
export function setLiveExchangeRates(ratesInTRY: Record<string, number>) {
  if (!ratesInTRY) return;
  if (ratesInTRY.EUR && CURRENCY_UNITS.EUR) {
    CURRENCY_UNITS.EUR.defaultRateInTRY = Number(ratesInTRY.EUR);
  }
  if (ratesInTRY.USD && CURRENCY_UNITS.USD) {
    CURRENCY_UNITS.USD.defaultRateInTRY = Number(ratesInTRY.USD);
  }
  if (ratesInTRY.GBP && CURRENCY_UNITS.GBP) {
    CURRENCY_UNITS.GBP.defaultRateInTRY = Number(ratesInTRY.GBP);
  }
}

/**
 * Para biriminin 1 biriminin TL karşılığını döner
 */
export function getCurrencyRateInTRY(currencyKey?: string, customRates?: Record<string, number>): number {
  if (!currencyKey || currencyKey === 'TRY') return 1;
  if (customRates && customRates[currencyKey] !== undefined) {
    return Number(customRates[currencyKey]) || 1;
  }
  const cfg = CURRENCY_UNITS[currencyKey as CurrencyUnitKey];
  return cfg?.defaultRateInTRY || 1;
}

/**
 * Belirtilen para birimindeki tutarı TL'ye dönüştürür
 */
export function convertCurrencyToTRY(amount: number, currencyKey?: string, customRates?: Record<string, number>): number {
  if (!amount) return 0;
  if (!currencyKey || currencyKey === 'TRY') return amount;
  const rate = getCurrencyRateInTRY(currencyKey, customRates);
  return amount * rate;
}

/**
 * Para biriminin sembolünü döner (₺, €, $, £ vb.)
 */
export function getCurrencySymbol(currencyKey?: string): string {
  if (!currencyKey) return '₺';
  if (currencyKey === 'TRY') return '₺';
  if (currencyKey === 'EUR') return '€';
  if (currencyKey === 'USD') return '$';
  if (currencyKey === 'GBP') return '£';
  const cfg = CURRENCY_UNITS[currencyKey as CurrencyUnitKey];
  return cfg?.symbol || currencyKey;
}

/**
 * Tutarı kendi para birimi sembolüyle biçimlendirir (örn. "1.250,00 €" veya "15.000,00 ₺")
 */
export function formatCurrencyWithSymbol(amount: number = 0, currencyKey: string = 'TRY'): string {
  const symbol = getCurrencySymbol(currencyKey);
  const formattedNum = Number(amount || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currencyKey === 'USD') return `$${formattedNum}`;
  return `${formattedNum} ${symbol}`;
}

export function getCurrencyUnitConfig(key?: string): CurrencyUnitConfig {
  if (!key) return CURRENCY_UNITS.TRY;
  return CURRENCY_UNITS[key as CurrencyUnitKey] || CURRENCY_UNITS.TRY;
}

/**
 * Format asset unit display: e.g. "5 Adet Çeyrek Altın" or "1.500 €" or "12.5 Gram Altın"
 */
export function formatAssetQuantityDisplay(unitQuantity?: number, currencyKey?: string): string | null {
  if (unitQuantity === undefined || unitQuantity === null || unitQuantity <= 0) return null;
  const cfg = getCurrencyUnitConfig(currencyKey);
  if (cfg.key === 'TRY') return null;

  if (cfg.key === 'EUR') return `${unitQuantity.toLocaleString('tr-TR')} €`;
  if (cfg.key === 'USD') return `${unitQuantity.toLocaleString('tr-TR')} $`;
  if (cfg.key === 'GBP') return `${unitQuantity.toLocaleString('tr-TR')} £`;
  if (cfg.key === 'GOLD_GRAM') return `${unitQuantity.toLocaleString('tr-TR')} Gram`;

  return `${unitQuantity.toLocaleString('tr-TR')} Adet ${cfg.label.split('(')[0].trim()}`;
}

// =========================================================================
// CREDIT CARD BILLING CYCLE PERIOD HELPER
// =========================================================================

export interface BillingCyclePeriod {
  id: string; // e.g. 'CURRENT', 'PREV_1', 'PREV_2', 'NEXT_1'
  key: string; // e.g. '2026-08-15_2026-09-14'
  label: string; // e.g. 'Mevcut Ekstre Dönemi (15 Ağu - 14 Eyl 2026)'
  shortLabel: string; // e.g. '15 Ağu - 14 Eyl'
  startDate: string; // '2026-08-15'
  endDate: string; // '2026-09-14'
  isCurrent: boolean;
  dueDateStr?: string; // Tahmini son ödeme tarihi
}

export interface CutoffPreset {
  day: number;
  label: string;
  category: 'FIRST_WEEK' | 'MID_MONTH' | 'LAST_WEEK' | 'MONTH_END';
  description: string;
}

export const CUTOFF_PRESETS: CutoffPreset[] = [
  { day: 1, label: '1. Gün', category: 'FIRST_WEEK', description: 'Ayın ilk günü / ilk haftası başı' },
  { day: 5, label: '5. Gün', category: 'FIRST_WEEK', description: 'Ayın ilk haftası' },
  { day: 7, label: '7. Gün', category: 'FIRST_WEEK', description: 'Ayın ilk haftası sonu' },
  { day: 10, label: '10. Gün', category: 'FIRST_WEEK', description: 'Ayın 2. haftası' },
  { day: 15, label: '15. Gün', category: 'MID_MONTH', description: 'Ay ortası / Maaş dönemi' },
  { day: 20, label: '20. Gün', category: 'LAST_WEEK', description: 'Ayın 3. haftası' },
  { day: 25, label: '25. Gün', category: 'LAST_WEEK', description: 'Ayın son haftası başı' },
  { day: 28, label: '28. Gün', category: 'LAST_WEEK', description: 'Ayın son haftası' },
  { day: 30, label: '30. Gün (Ay Sonu)', category: 'MONTH_END', description: 'Ay sonu' },
];

/**
 * Returns a valid date clamped to the maximum day of the target month
 */
function getValidDateInMonth(year: number, month: number, targetDay: number): Date {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, targetDay), maxDay);
  return new Date(year, month, safeDay);
}

/**
 * Calculates billing statement cycle date windows based on card cutoff day (1-31)
 */
export function getCreditCardBillingCycles(
  cutoffDay: number = 15,
  dueDay: number = 25,
  referenceDate: Date = new Date()
): BillingCyclePeriod[] {
  const safeCutoff = Math.max(1, Math.min(31, cutoffDay || 15));
  const safeDue = Math.max(1, Math.min(31, dueDay || (safeCutoff <= 20 ? safeCutoff + 10 : (safeCutoff - 20 <= 0 ? 1 : safeCutoff - 20))));

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-11
  const refDay = referenceDate.getDate();

  // Determine current cycle offset:
  // If today's day >= cutoffDay, current cycle started this month on cutoffDay, ends next month on cutoffDay - 1.
  // If today's day < cutoffDay, current cycle started previous month on cutoffDay, ends this month on cutoffDay - 1.
  let currentCycleStartMonth = refMonth;
  let currentCycleStartYear = refYear;
  if (refDay < safeCutoff) {
    currentCycleStartMonth = refMonth - 1;
    if (currentCycleStartMonth < 0) {
      currentCycleStartMonth = 11;
      currentCycleStartYear = refYear - 1;
    }
  }

  // Generate cycles: -2 (2 months ago), -1 (last month), 0 (current), +1 (next)
  const cycles: BillingCyclePeriod[] = [];
  const offsets = [
    { offset: 1, id: 'NEXT_1', namePrefix: 'Gelecek Dönem' },
    { offset: 0, id: 'CURRENT', namePrefix: 'Mevcut Dönem (Güncel)' },
    { offset: -1, id: 'PREV_1', namePrefix: 'Önceki Dönem' },
    { offset: -2, id: 'PREV_2', namePrefix: '2 Ay Önceki Dönem' },
  ];

  const pad = (n: number) => String(n).padStart(2, '0');

  offsets.forEach(({ offset, id, namePrefix }) => {
    let sYear = currentCycleStartYear;
    let sMonth = currentCycleStartMonth + offset;
    while (sMonth > 11) {
      sMonth -= 12;
      sYear += 1;
    }
    while (sMonth < 0) {
      sMonth += 12;
      sYear -= 1;
    }

    const startDateObj = getValidDateInMonth(sYear, sMonth, safeCutoff);

    // End date is day before next month's cutoff
    let eYear = sYear;
    let eMonth = sMonth + 1;
    if (eMonth > 11) {
      eMonth = 0;
      eYear += 1;
    }
    const nextCutoffObj = getValidDateInMonth(eYear, eMonth, safeCutoff);
    const endDateObj = new Date(nextCutoffObj.getFullYear(), nextCutoffObj.getMonth(), nextCutoffObj.getDate() - 1);

    const sIso = `${startDateObj.getFullYear()}-${pad(startDateObj.getMonth() + 1)}-${pad(startDateObj.getDate())}`;
    const eIso = `${endDateObj.getFullYear()}-${pad(endDateObj.getMonth() + 1)}-${pad(endDateObj.getDate())}`;

    // Estimated due date
    const dueDateObj = getValidDateInMonth(eYear, eMonth, safeDue);
    const dueIso = dueDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    const shortLabel = `${startDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;

    cycles.push({
      id,
      key: `${sIso}_${eIso}`,
      label: `${namePrefix} (${shortLabel})`,
      shortLabel,
      startDate: sIso,
      endDate: eIso,
      isCurrent: id === 'CURRENT',
      dueDateStr: `Son Ödeme: ${dueIso}`,
    });
  });

  return cycles;
}

/**
 * Checks if a transaction date falls into a billing cycle
 */
export function isDateInCycle(dateStr: string, startDate: string, endDate: string): boolean {
  if (!dateStr || !startDate || !endDate) return false;
  const normalize = (d: string) => {
    if (!d) return '';
    const clean = d.includes('T') ? d.split('T')[0] : d.trim();
    if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(clean)) {
      const parts = clean.split(/[./-]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return clean;
  };
  const cleanDate = normalize(dateStr);
  const cleanStart = normalize(startDate);
  const cleanEnd = normalize(endDate);
  return cleanDate >= cleanStart && cleanDate <= cleanEnd;
}
