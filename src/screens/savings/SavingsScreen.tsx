import React, { useState } from 'react';
import { View } from 'react-native';
import { PiggyBank, Plus } from 'lucide-react-native';

import { Card, EmptyState, IconButton, IconTile, ProgressBar, Section, StackScreen, Stat, Text } from '../../design';
import { formatMoney } from '../../logic/format';
import { netWorth, useFinance } from '../../logic/selectors';
import { formatAssetQuantityDisplay } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { ASSET_TYPE_META, ASSET_TYPE_ORDER, assetTypeOf } from './assetShared';

export const SavingsScreen: React.FC<RootScreenProps<'Savings'>> = () => {
  const navigation = useAppNavigation();
  const { cards, savings, rates } = useFinance();
  const syncWithServer = useAppStore((s) => s.syncWithServer);
  const [refreshing, setRefreshing] = useState(false);

  const worth = netWorth(cards, savings, rates);
  const included = savings.filter((a) => !a.excludeFromReports);
  const allocation = ASSET_TYPE_ORDER.map((type) => ({
    type,
    amount: included.filter((a) => assetTypeOf(a) === type).reduce((s, a) => s + (a.currentAmount || 0), 0),
  })).filter((a) => a.amount > 0);
  const allocTotal = allocation.reduce((s, a) => s + a.amount, 0);
  const sorted = [...savings].sort((a, b) => (b.currentAmount || 0) - (a.currentAmount || 0));

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
      {savings.length === 0 ? (
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
                {formatMoney(worth.savingsTotal)}
              </Text>
            </View>
            <View style={tw`flex-row gap-4`}>
              <View style={tw`flex-1`}>
                <Stat label="Net varlık" value={formatMoney(worth.total)} tone={worth.total >= 0 ? 'success' : 'danger'} caption="Likit + birikim − kredi borcu" />
              </View>
              <View style={tw`flex-1`}>
                <Stat label="Varlık sayısı" value={String(savings.length)} caption={`${allocation.length} farklı tür`} />
              </View>
            </View>

            {allocTotal > 0 ? (
              <View style={tw`gap-3`}>
                <View style={tw`flex-row h-3 rounded-full overflow-hidden gap-0.5`}>
                  {allocation.map((a) => (
                    <View key={a.type} style={{ flex: a.amount, backgroundColor: ASSET_TYPE_META[a.type].color }} />
                  ))}
                </View>
                <View style={tw`flex-row flex-wrap gap-x-4 gap-y-2`}>
                  {allocation.map((a) => (
                    <View key={a.type} style={tw`flex-row items-center gap-1.5`}>
                      <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: ASSET_TYPE_META[a.type].color }]} />
                      <Text variant="caption" tone="muted" weight="semibold">
                        {`${ASSET_TYPE_META[a.type].label} %${Math.round((a.amount / allocTotal) * 100)}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          <Section title="Varlıklarım">
            <View style={tw`gap-3`}>
              {sorted.map((asset) => {
                const type = assetTypeOf(asset);
                const meta = ASSET_TYPE_META[type];
                const color = asset.color || meta.color;
                const qty = formatAssetQuantityDisplay(asset.unitQuantity, asset.currency);
                const target = asset.targetAmount || 0;
                const pct = target > 0 ? ((asset.currentAmount || 0) / target) * 100 : 0;
                return (
                  <Card
                    key={asset.id}
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
