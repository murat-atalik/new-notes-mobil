import { CURRENCY_UNITS, getCurrencyUnitConfig } from '../../lib/currencyUnits';
import type { SavingsAsset, SavingsAssetType } from '../../types';

export const ASSET_TYPE_ORDER: SavingsAssetType[] = [
  'BANK_DEPOSIT',
  'GOLD',
  'CURRENCY',
  'INVESTMENT_FUND',
  'PENSION_BES',
  'CASH_VAULT',
  'CRYPTO',
  'OTHER',
];

/** Turkish labels, icons and the web's `category` string per asset type. */
export const ASSET_TYPE_META: Record<SavingsAssetType, { label: string; icon: string; emoji: string; color: string; category: string }> = {
  BANK_DEPOSIT: { label: 'Vadeli Mevduat', icon: 'Landmark', emoji: '🏦', color: '#0ea5e9', category: 'Banka Vadeli Hesabı' },
  GOLD: { label: 'Altın', icon: 'Coins', emoji: '🪙', color: '#f59e0b', category: 'Altın & Kıymetli Maden' },
  CURRENCY: { label: 'Döviz', icon: 'Banknote', emoji: '💵', color: '#10b981', category: 'Döviz & Yabancı Para' },
  INVESTMENT_FUND: { label: 'Yatırım Fonu', icon: 'TrendingUp', emoji: '📈', color: '#6366f1', category: 'Yatırım Fonu & Hisse' },
  PENSION_BES: { label: 'BES', icon: 'ShieldCheck', emoji: '🛡️', color: '#8b5cf6', category: 'Bireysel Emeklilik (BES)' },
  CASH_VAULT: { label: 'Nakit Kasa', icon: 'Vault', emoji: '💰', color: '#14b8a6', category: 'Fiziki Kasa / Nakit' },
  CRYPTO: { label: 'Kripto', icon: 'Bitcoin', emoji: '₿', color: '#f97316', category: 'Kripto Varlık' },
  OTHER: { label: 'Diğer', icon: 'PiggyBank', emoji: '🎯', color: '#64748b', category: 'Diğer' },
};

/** Resolves an asset's type (older records only have the web `category` string / currency). */
export function assetTypeOf(asset: SavingsAsset): SavingsAssetType {
  if (asset.assetType && ASSET_TYPE_META[asset.assetType]) return asset.assetType;
  const cfg = asset.currency ? CURRENCY_UNITS[asset.currency as keyof typeof CURRENCY_UNITS] : undefined;
  if (cfg?.category === 'GOLD') return 'GOLD';
  if (cfg && cfg.key !== 'TRY') return 'CURRENCY';
  const found = ASSET_TYPE_ORDER.find((t) => ASSET_TYPE_META[t].category === asset.category);
  return found ?? 'OTHER';
}

export function isUnitAsset(currency?: string): boolean {
  return !!currency && currency !== 'TRY';
}

export function unitSuffix(currency?: string): string {
  return getCurrencyUnitConfig(currency).unitSuffix;
}
