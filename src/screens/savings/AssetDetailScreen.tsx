import React from 'react';
import { View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, History, Minus, Pencil, Plus, Trash2 } from 'lucide-react-native';

import {
  Button,
  Card,
  confirmAction,
  EmptyState,
  IconButton,
  IconTile,
  ListGroup,
  palette,
  ProgressRing,
  Row,
  Section,
  showToast,
  StackScreen,
  Stat,
  Text,
} from '../../design';
import { formatDay, formatMoney } from '../../logic/format';
import { convertCurrencyToTRY, formatAssetQuantityDisplay, getCurrencyRateInTRY, getCurrencyUnitConfig } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { ASSET_TYPE_META, assetTypeOf, isUnitAsset } from './assetShared';

export const AssetDetailScreen: React.FC<RootScreenProps<'AssetDetail'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const { assetId } = route.params;
  const asset = useAppStore((s) => s.savingsGoals.find((g) => g.id === assetId));
  const rates = useAppStore((s) => s.exchangeRates);
  const deleteSavingsGoal = useAppStore((s) => s.deleteSavingsGoal);

  if (!asset) {
    return (
      <StackScreen title="Birikim">
        <EmptyState title="Birikim bulunamadı" message="Bu kayıt silinmiş olabilir." action={{ label: 'Geri dön', onPress: () => navigation.goBack() }} />
      </StackScreen>
    );
  }

  const type = assetTypeOf(asset);
  const meta = ASSET_TYPE_META[type];
  const color = asset.color || meta.color;
  const unit = isUnitAsset(asset.currency);
  const cfg = getCurrencyUnitConfig(asset.currency);
  const qty = formatAssetQuantityDisplay(asset.unitQuantity, asset.currency);
  const liveValue = unit && asset.unitQuantity ? convertCurrencyToTRY(asset.unitQuantity, asset.currency, rates) : 0;
  const liveRate = unit ? getCurrencyRateInTRY(asset.currency, rates) : 0;
  const diff = liveValue ? liveValue - (asset.currentAmount || 0) : 0;
  const target = asset.targetAmount || 0;
  const pct = target > 0 ? ((asset.currentAmount || 0) / target) * 100 : 0;
  const contributions = [...(asset.contributions || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const onDelete = () =>
    confirmAction({
      title: 'Birikim silinsin mi?',
      message: `"${asset.title}" ve hareket geçmişi silinecek.`,
      onConfirm: () => {
        deleteSavingsGoal(asset.id);
        showToast('Birikim silindi');
        navigation.goBack();
      },
    });

  return (
    <StackScreen
      title={asset.title}
      subtitle={asset.institution || meta.label}
      right={<IconButton icon={Pencil} label="Düzenle" variant="plain" onPress={() => navigation.navigate('AssetForm', { assetId })} />}
    >
      <Card className="gap-4">
        <View style={tw`flex-row items-center gap-4`}>
          <View style={tw`flex-1 min-w-0 gap-1`}>
            <View style={tw`flex-row items-center gap-2`}>
              <IconTile emoji={asset.icon || meta.emoji} color={color} size="sm" />
              <Text variant="footnote" tone="muted" weight="semibold" numberOfLines={1}>
                {meta.label}
              </Text>
            </View>
            <Text variant="amount" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(asset.currentAmount || 0)}
            </Text>
            {qty ? (
              <Text variant="callout" tone="muted" weight="semibold">
                {qty}
              </Text>
            ) : null}
          </View>
          {target > 0 ? (
            <ProgressRing value={pct} size={84} color={color}>
              <Text variant="subhead" weight="bold">{`%${Math.min(100, Math.round(pct))}`}</Text>
            </ProgressRing>
          ) : null}
        </View>
        {target > 0 ? (
          <Text variant="footnote" tone="muted">
            {pct >= 100 ? `Hedefe ulaşıldı 🎉 (${formatMoney(target)})` : `Hedef ${formatMoney(target)} · ${formatMoney(target - (asset.currentAmount || 0))} kaldı`}
          </Text>
        ) : null}

        {unit ? (
          <View style={tw`flex-row gap-4 pt-1`}>
            <View style={tw`flex-1`}>
              <Stat
                label="Güncel değer"
                value={liveValue ? formatMoney(Math.round(liveValue)) : '—'}
                tone={diff > 0 ? 'success' : diff < 0 ? 'danger' : 'default'}
                caption="güncel kur"
              />
            </View>
            <View style={tw`flex-1`}>
              <Stat
                label={`Birim (${cfg.unitSuffix})`}
                value={formatMoney(liveRate, 'TRY', 2)}
                caption={asset.unitPrice ? `Alış ${formatMoney(asset.unitPrice, 'TRY', 2)}` : undefined}
              />
            </View>
          </View>
        ) : null}
        {unit && liveValue && Math.abs(diff) >= 1 ? (
          <Text variant="caption" tone={diff > 0 ? 'success' : 'danger'} weight="semibold">
            {`Kayıtlı tutara göre ${diff > 0 ? '+' : ''}${formatMoney(Math.round(diff))}`}
          </Text>
        ) : null}
      </Card>

      <View style={tw`flex-row gap-3`}>
        <View style={tw`flex-1`}>
          <Button title="Para Ekle" icon={Plus} onPress={() => navigation.navigate('AssetTransaction', { assetId, mode: 'DEPOSIT' })} fullWidth />
        </View>
        <View style={tw`flex-1`}>
          <Button
            title="Çek"
            icon={Minus}
            variant="secondary"
            onPress={() => navigation.navigate('AssetTransaction', { assetId, mode: 'WITHDRAW' })}
            fullWidth
          />
        </View>
      </View>

      <ListGroup>
          {asset.linkedCardName ? <Row icon="CreditCard" iconColor={palette.info} title="Bağlı kart" value={asset.linkedCardName} /> : null}
          <Row icon="Users" iconColor={palette.brand} title="Görünürlük" value={asset.isShared !== false ? 'Aile birikimi' : 'Kişisel'} />
          {asset.excludeFromReports ? <Row icon="EyeOff" iconColor={palette.slate500} title="Raporlardan hariç" /> : null}
          {asset.notes ? <Row icon="StickyNote" iconColor={palette.warning} title="Not" subtitle={asset.notes} /> : null}
      </ListGroup>

      <Section title="Hareketler">
        {contributions.length === 0 ? (
          <Card>
            <EmptyState icon={History} title="Henüz hareket yok" message="Para ekledikçe ya da çektikçe burada görünür." />
          </Card>
        ) : (
          <ListGroup>
            {contributions.map((c) => {
              const deposit = c.type === 'DEPOSIT';
              const q = formatAssetQuantityDisplay(c.unitQuantity, asset.currency);
              return (
                <Row
                  key={c.id}
                  left={<IconTile icon={deposit ? ArrowDownLeft : ArrowUpRight} color={deposit ? palette.brand : palette.danger} size="sm" />}
                  title={c.note || (deposit ? 'Para eklendi' : 'Para çekildi')}
                  subtitle={[formatDay(c.date), q, c.cardName].filter(Boolean).join(' · ')}
                  value={`${deposit ? '+' : '−'}${formatMoney(c.amount)}`}
                  valueTone={deposit ? 'success' : 'danger'}
                />
              );
            })}
          </ListGroup>
        )}
      </Section>

      <View style={tw`gap-3`}>
        <Button title="Düzenle" icon={Pencil} variant="secondary" onPress={() => navigation.navigate('AssetForm', { assetId })} fullWidth />
        <Button title="Birikimi Sil" icon={Trash2} variant="dangerTinted" onPress={onDelete} fullWidth />
      </View>
    </StackScreen>
  );
};
