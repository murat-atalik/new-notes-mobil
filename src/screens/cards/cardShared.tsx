import React from 'react';
import { View } from 'react-native';

import { Gradient, iconByName, Text } from '../../design';
import { formatMoney } from '../../logic/format';
import { CARD_TYPE_META, cardAvailable, isCreditCard } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import type { PaymentCard, PaymentCardType } from '../../types';

/** Display order of card groups. */
export const CARD_TYPE_ORDER: PaymentCardType[] = ['CREDIT_CARD', 'DEBIT_CARD', 'FOOD_CARD', 'PREPAID_CARD', 'CASH_WALLET'];

export const CARD_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#334155', '#b45309'];

export const PROVIDER_SUGGESTIONS: Record<PaymentCardType, string[]> = {
  FOOD_CARD: ['Sodexo / Pluxee', 'Multinet', 'Ticket', 'Metropol', 'Setcard'],
  CREDIT_CARD: ['Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Akbank', 'Ziraat', 'QNB', 'Enpara'],
  DEBIT_CARD: ['Garanti BBVA', 'İş Bankası', 'Yapı Kredi', 'Akbank', 'Ziraat', 'QNB', 'Enpara'],
  PREPAID_CARD: ['Papara', 'Paycell'],
  CASH_WALLET: ['Nakit'],
};

/** Same spend categories the web card spend form offers. */
export const SPEND_CATEGORIES: { name: string; color: string; icon: string }[] = [
  { name: 'Restoran & Yemek', color: '#f97316', icon: 'Utensils' },
  { name: 'Süpermarket & Gıda', color: '#10b981', icon: 'ShoppingCart' },
  { name: 'Kahve & İçecek', color: '#92400e', icon: 'Coffee' },
  { name: 'Ulaşım & Yakıt', color: '#06b6d4', icon: 'Car' },
  { name: 'Giyim & Alışveriş', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Diğer', color: '#64748b', icon: 'CircleDollarSign' },
];

/** Mixes a hex color toward black (`amount` 0–1). */
export function darken(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return '#1e1b4b';
  const ch = (shift: number) => Math.round(((num >> shift) & 255) * (1 - amount));
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Days until the next occurrence of day-of-month `day` (0 = today). */
export function daysUntilDayOfMonth(day: number, from = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const clamp = (y: number, m: number) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  let target = clamp(today.getFullYear(), today.getMonth());
  if (target < today) target = clamp(today.getFullYear(), today.getMonth() + 1);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function daysLeftLabel(days: number): string {
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  return `${days} gün kaldı`;
}

/** Realistic card face: gradient from the card color, provider, name, last4 and main amount. */
export const CardVisual: React.FC<{ card: PaymentCard; compact?: boolean }> = ({ card, compact }) => {
  const credit = isCreditCard(card);
  const meta = CARD_TYPE_META[card.type];
  const Icon = iconByName(meta?.icon);
  const color = card.color || '#6366f1';
  const currency = card.currency || 'TRY';
  return (
    <Gradient
      colors={[color, darken(color, 0.55)]}
      dir="br"
      className={`rounded-3xl overflow-hidden ${compact ? 'p-4' : 'p-5'}`}
      style={{ aspectRatio: compact ? 1.9 : 1.62 }}
    >
      <View style={[tw`absolute rounded-full bg-white/10`, { width: 180, height: 180, right: -50, bottom: -70 }]} />
      <View style={[tw`absolute rounded-full bg-white/10`, { width: 110, height: 110, right: 40, top: -50 }]} />
      <View style={tw`flex-1 justify-between`}>
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1 min-w-0`}>
            <Text variant="overline" tone="inverse" className="opacity-80" numberOfLines={1}>
              {card.provider || meta?.label || 'Kart'}
            </Text>
            <Text variant="headline" tone="inverse" numberOfLines={1}>
              {card.name}
            </Text>
          </View>
          <View style={tw`flex-row items-center gap-2`}>
            {card.isShared !== false ? (
              <View style={tw`px-2 h-6 rounded-full bg-white/20 items-center justify-center`}>
                <Text variant="caption" tone="inverse" weight="bold">
                  Aile
                </Text>
              </View>
            ) : null}
            <Icon size={24} color="rgba(255,255,255,0.85)" />
          </View>
        </View>
        <View style={tw`gap-0.5`}>
          <Text variant="caption" tone="inverse" className="opacity-80">
            {credit ? 'Kullanılabilir' : 'Bakiye'}
          </Text>
          <Text variant={compact ? 'title' : 'amount'} tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(cardAvailable(card), credit ? 'TRY' : currency)}
          </Text>
          <View style={tw`flex-row items-center justify-between mt-1`}>
            <Text variant="footnote" tone="inverse" className="opacity-90" numberOfLines={1}>
              {credit
                ? `Borç ${formatMoney(card.currentDebt || 0)} · Limit ${formatMoney(card.creditLimit || 0)}`
                : card.type === 'FOOD_CARD' && card.monthlyAllowance
                  ? `Aylık ${formatMoney(card.monthlyAllowance)}`
                  : meta?.label}
            </Text>
            {card.last4 ? (
              <Text variant="callout" tone="inverse" weight="semibold" className="tracking-widest">
                {`•••• ${card.last4}`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Gradient>
  );
};
