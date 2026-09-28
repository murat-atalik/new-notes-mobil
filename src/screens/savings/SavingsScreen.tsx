import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Landmark, PiggyBank, Plus } from 'lucide-react-native';

import { Card, EmptyState, IconButton, IconTile, ProgressBar, Section, StackScreen, Stat, Text } from '../../design';
import { formatMoney } from '../../logic/format';
import { CARD_TYPE_META, netWorth, useFinance } from '../../logic/selectors';
import { convertCurrencyToTRY, formatAssetQuantityDisplay, getCurrencyRateInTRY, getCurrencySymbol, getCurrencyUnitConfig } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { PaymentCard, SavingsAsset } from '../../types';
import { ASSET_TYPE_META, ASSET_TYPE_ORDER, assetTypeOf } from './assetShared';

const BANK_COLOR = '#0ea5e9';

type SavingsRow = { key: string; amountTRY: number } & (
  | { kind: 'asset'; asset: SavingsAsset }
  | { kind: 'card'; card: PaymentCard }
);

export const SavingsScreen: React.FC<RootScreenProps<'Savings'>> = () => {
  const navigation = useAppNavigation();
  const { cards, savings, rates } = useFinance();
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const [refreshing, setRefreshing] = useState(false);

  const worth = netWorth(cards, savings, rates);
  // Bank accounts already sit in `cards`, but they're money you're holding onto too — show them
  // here as well (converted to TRY) instead of only inside the Cüzdan/Kartlar totals. Intentionally
  // independent of `excludeFromReports` — that flag is about the Cüzdan/Net Varlık totals, not this screen.
  const bankCards = useMemo(() => cards.filter((c) => c.type === 'DEBIT_CARD'), [cards]);
  const bankCardsTotal = useMemo(
    () => bankCards.reduce((s, c) => s + convertCurrencyToTRY(c.balance || 0, c.currency || 'TRY', rates), 0),
    [bankCards, rates],
  );
  const totalBirikim = worth.savingsTotal + bankCardsTotal;

  const included = savings.filter((a) => !a.excludeFromReports);
  const allocation = [
    ...ASSET_TYPE_ORDER.map((type) => ({
      key: type as string,
      label: ASSET_TYPE_META[type].label,
      color: ASSET_TYPE_META[type].color,
      amount: included.filter((a) => assetTypeOf(a) === type).reduce((s, a) => s + (a.currentAmount || 0), 0),
    })),
    { key: 'BANK', label: CARD_TYPE_META.DEBIT_CARD.label, color: BANK_COLOR, amount: bankCardsTotal },
  ].filter((a) => a.amount > 0);
  const allocTotal = allocation.reduce((s, a) => s + a.amount, 0);

  const rows: SavingsRow[] = [
    ...savings.map((asset): SavingsRow => ({ key: `asset-${asset.id}`, kind: 'asset', asset, amountTRY: asset.currentAmount || 0 })),
    ...bankCards.map((card): SavingsRow => ({
      key: `card-${card.id}`,
      kind: 'card',
      card,
      amountTRY: convertCurrencyToTRY(card.balance || 0, card.currency || 'TRY', rates),
    })),
  ].sort((a, b) => b.amountTRY - a.amountTRY);

  // Exchange rates actually behind the TL conversions above, so the totals are never a black box.
  const rateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const a of savings) if (a.currency && a.currency !== 'TRY') keys.add(a.currency);
    for (const c of bankCards) if (c.currency && c.currency !== 'TRY') keys.add(c.currency);
    return [...keys];
  }, [savings, bankCards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncWithServer(false);
    setRefreshing(false);
  };

  return (
    <StackScreen
      title="Birikimler"
      refreshing={refreshing}
      onRefresh={onRefresh}
      right={<IconButton icon={Plus} label="Birikim ekle" variant="brand" onPress={() => navigation.navigate('AssetForm')} />}
    >
      {savings.length === 0 && bankCards.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="İlk birikimini ekle"
          message="Vadeli hesap, altın, döviz ya da BES — tüm birikimlerini tek yerde takip et."
          action={{ label: 'Birikim Ekle', icon: Plus, onPress: () => navigation.navigate('AssetForm') }}
        />
      ) : (
        <>
          <Card className="gap-4">
            <View style={tw`gap-0.5`}>
              <Text variant="footnote" tone="muted" weight="semibold">
                Toplam birikim
              </Text>
              <Text variant="amount" numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(totalBirikim)}
              </Text>
              {bankCardsTotal > 0 ? (
                <Text variant="caption" tone="muted">
                  {`Banka hesapları dahil (${formatMoney(bankCardsTotal)})`}
                </Text>
              ) : null}
            </View>
            <View style={tw`flex-row gap-4`}>
              <View style={tw`flex-1`}>
                <Stat label="Net varlık" value={formatMoney(worth.total)} tone={worth.total >= 0 ? 'success' : 'danger'} caption="Likit + birikim − kredi borcu" />
              </View>
              <View style={tw`flex-1`}>
                <Stat label="Varlık sayısı" value={String(savings.length + bankCards.length)} caption={`${allocation.length} farklı tür`} />
              </View>
            </View>

            {allocTotal > 0 ? (
              <View style={tw`gap-3`}>
                <View style={tw`flex-row h-3 rounded-full overflow-hidden gap-0.5`}>
                  {allocation.map((a) => (
                    <View key={a.key} style={{ flex: a.amount, backgroundColor: a.color }} />
                  ))}
                </View>
                <View style={tw`flex-row flex-wrap gap-x-4 gap-y-2`}>
                  {allocation.map((a) => (
                    <View key={a.key} style={tw`flex-row items-center gap-1.5`}>
                      <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: a.color }]} />
                      <Text variant="caption" tone="muted" weight="semibold">
                        {`${a.label} %${Math.round((a.amount / allocTotal) * 100)}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {rateKeys.length ? (
              <View style={tw`gap-2 pt-1 border-t border-slate-100 dark:border-slate-800`}>
                <Text variant="caption" tone="muted" weight="semibold" className="pt-2">
                  Güncel kurlar
                </Text>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {rateKeys.map((key) => {
                    const cfg = getCurrencyUnitConfig(key);
                    const rate = getCurrencyRateInTRY(key, rates);
                    return (
                      <View key={key} style={[tw`flex-row items-center gap-1.5 px-3 h-9 rounded-full`, { backgroundColor: `${cfg.color}14` }]}>
                        <Text variant="caption" weight="bold" tone="muted">
                          {`1 ${getCurrencySymbol(key)}`}
                        </Text>
                        <Text variant="caption" weight="bold" style={{ color: cfg.color }}>
                          {formatMoney(rate, 'TRY', 2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </Card>

          <Section title="Varlıklarım">
            <View style={tw`gap-3`}>
              {rows.map((row) => {
                if (row.kind === 'card') {
                  const card = row.card;
                  const foreign = (card.currency || 'TRY') !== 'TRY';
                  return (
                    <Card
                      key={row.key}
                      className="gap-3"
                      onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
                      style={{ backgroundColor: `${BANK_COLOR}14`, borderColor: `${BANK_COLOR}33` }}
                    >
                      <View style={tw`flex-row items-center gap-3`}>
                        <IconTile icon={Landmark} color={card.color || BANK_COLOR} />
                        <View style={tw`flex-1 min-w-0`}>
                          <Text variant="headline" numberOfLines={1}>
                            {card.name}
                          </Text>
                          <Text variant="footnote" tone="muted" numberOfLines={1}>
                            {[card.provider, CARD_TYPE_META.DEBIT_CARD.label].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                        <View style={tw`items-end`}>
                          <Text variant="headline">{formatMoney(row.amountTRY)}</Text>
                          {foreign ? (
                            <Text variant="caption" tone="faint">
                              {formatMoney(card.balance || 0, card.currency)}
                            </Text>
                          ) : null}
                          {card.excludeFromReports ? (
                            <Text variant="caption" tone="faint">
                              Raporlarda hariç
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </Card>
                  );
                }

                const asset = row.asset;
                const type = assetTypeOf(asset);
                const meta = ASSET_TYPE_META[type];
                const color = asset.color || meta.color;
                const qty = formatAssetQuantityDisplay(asset.unitQuantity, asset.currency);
                const target = asset.targetAmount || 0;
                const pct = target > 0 ? ((asset.currentAmount || 0) / target) * 100 : 0;
                return (
                  <Card
                    key={row.key}
                    className="gap-3"
                    onPress={() => navigation.navigate('AssetDetail', { assetId: asset.id })}
                    style={{ backgroundColor: `${color}14`, borderColor: `${color}33` }}
                  >
                    <View style={tw`flex-row items-center gap-3`}>
                      <IconTile emoji={asset.icon || meta.emoji} color={color} />
                      <View style={tw`flex-1 min-w-0`}>
                        <Text variant="headline" numberOfLines={1}>
                          {asset.title}
                        </Text>
                        <Text variant="footnote" tone="muted" numberOfLines={1}>
                          {[asset.institution, qty ?? meta.label].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text variant="headline">{formatMoney(asset.currentAmount || 0)}</Text>
                        {asset.excludeFromReports ? (
                          <Text variant="caption" tone="faint">
                            Rapor dışı
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {target > 0 ? (
                      <View style={tw`gap-1`}>
                        <ProgressBar value={pct} color={color} />
                        <Text variant="caption" tone="muted">
                          {`Hedef ${formatMoney(target)} · %${Math.min(100, Math.round(pct))}`}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          </Section>
        </>
      )}
    </StackScreen>
  );
};
