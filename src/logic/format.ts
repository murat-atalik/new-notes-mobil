/** Formatting helpers shared by all screens (Turkish locale). */

const CURRENCY_SYMBOL: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

/** `1234.5` → `₺1.234,50` (decimals hidden for whole amounts unless `decimals` is set). */
export function formatMoney(amount: number, currency = 'TRY', decimals?: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const digits = decimals ?? (Math.round(value) === value ? 0 : 2);
  const formatted = Math.abs(value).toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const sign = value < 0 ? '-' : '';
  return symbol ? `${sign}${symbol}${formatted}` : `${sign}${formatted} ${currency}`;
}

/** Compact: `₺12,4B` style for tiles (B = bin, Mn = milyon). */
export function formatMoneyCompact(amount: number, currency = 'TRY'): string {
  const abs = Math.abs(amount);
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} Mn`;
  if (abs >= 10_000) return `${sign}${symbol}${(abs / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} B`;
  return formatMoney(amount, currency, 0);
}

export const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const MONTHS_SHORT_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local `YYYY-MM-DD` for a Date (defaults to today). */
export function isoDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local `YYYY-MM` month key. */
export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function parseDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('T')[0].split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, d || 1);
}

/** `2026-09` → `Eylül 2026`. */
export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_TR[(m || 1) - 1]} ${y}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

/** `Bugün`, `Dün`, `Yarın`, weekday within a week, else `23 Eyl` (+ year if different). */
export function formatDay(value?: string): string {
  const date = parseDate(value);
  if (!date) return '';
  const today = parseDate(isoDate())!;
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Bugün';
  if (diff === -1) return 'Dün';
  if (diff === 1) return 'Yarın';
  if (diff > 1 && diff < 7) return WEEKDAYS_TR[date.getDay()];
  const base = `${date.getDate()} ${MONTHS_SHORT_TR[date.getMonth()]}`;
  return date.getFullYear() === today.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/** Days from today to `value` (negative = past). */
export function daysFromToday(value?: string): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const today = parseDate(isoDate())!;
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

/** Parses user-typed Turkish numbers: `1.234,5` / `1234.5` / `1234,5`. */
export function parseAmount(text: string): number {
  const cleaned = text.replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}
