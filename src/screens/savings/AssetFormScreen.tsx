import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Card,
  FieldLabel,
  FormScreen,
  iconByName,
  ListGroup,
  palette,
  SelectField,
  showToast,
  SwatchField,
  SwitchRow,
  Text,
  TextField,
  type SwatchOption,
} from '../../design';
import { formatMoney, parseAmount } from '../../logic/format';
import { useFinance } from '../../logic/selectors';
import { CURRENCY_UNIT_LIST, getCurrencyRateInTRY, getCurrencyUnitConfig } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { SavingsAssetType } from '../../types';
import { ASSET_TYPE_META, ASSET_TYPE_ORDER, assetTypeOf, isUnitAsset } from './assetShared';

const CURRENCY_SWATCHES: SwatchOption[] = CURRENCY_UNIT_LIST.map((u) => ({ value: u.key, label: u.label, sublabel: u.description, emoji: u.icon, color: u.color }));

const numStr = (n?: number) => (n ? String(n).replace('.', ',') : '');

/** Default unit when a type implies one (web: selecting a gold/currency unit sets the category). */
const DEFAULT_UNIT: Partial<Record<SavingsAssetType, string>> = { GOLD: 'GOLD_GRAM', CURRENCY: 'USD' };

export const AssetFormScreen: React.FC<RootScreenProps<'AssetForm'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const assetId = route.params?.assetId;
  const existing = useAppStore((s) => (assetId ? s.savingsGoals.find((g) => g.id === assetId) : undefined));
  const addSavingsGoal = useAppStore((s) => s.addSavingsGoal);
  const updateSavingsGoal = useAppStore((s) => s.updateSavingsGoal);
  const { cards, rates } = useFinance();

  const [type, setType] = useState<SavingsAssetType>(existing ? assetTypeOf(existing) : 'BANK_DEPOSIT');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [institution, setInstitution] = useState(existing?.institution ?? '');
  const [currency, setCurrency] = useState(existing?.currency || 'TRY');
  const [quantity, setQuantity] = useState(numStr(existing?.unitQuantity));
  const [unitPrice, setUnitPrice] = useState(
    existing?.unitPrice ? numStr(existing.unitPrice) : isUnitAsset(existing?.currency) ? numStr(getCurrencyRateInTRY(existing?.currency, rates)) : '',
  );
  const [amount, setAmount] = useState(numStr(existing ? existing.currentAmount : undefined));
  const [target, setTarget] = useState(numStr(existing?.targetAmount));
  const [cardId, setCardId] = useState(existing?.linkedCardId ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isShared, setIsShared] = useState(existing ? existing.isShared !== false : true);
  const [exclude, setExclude] = useState(existing?.excludeFromReports ?? false);

  const unit = isUnitAsset(currency);
  const cfg = getCurrencyUnitConfig(currency);
  const qtyNum = parseAmount(quantity);
  const priceNum = parseAmount(unitPrice);
  const computed = unit ? qtyNum * priceNum : parseAmount(amount);
  const selectedCard = cards.find((c) => c.id === cardId);
  const valid = title.trim().length > 0 && (!unit || qtyNum > 0);

  const applyCurrency = (next: string) => {
    setCurrency(next);
    if (isUnitAsset(next)) {
      setUnitPrice(numStr(Math.round(getCurrencyRateInTRY(next, rates) * 100) / 100));
      const nextCfg = getCurrencyUnitConfig(next);
      if (nextCfg.category === 'GOLD') setType('GOLD');
      else if (type === 'BANK_DEPOSIT' || type === 'CASH_VAULT' || type === 'OTHER') setType('CURRENCY');
    } else {
      setUnitPrice('');
      setQuantity('');
    }
  };

  const chooseType = (t: SavingsAssetType) => {
    setType(t);
    const unitKey = DEFAULT_UNIT[t];
    if (unitKey && getCurrencyUnitConfig(currency).category !== getCurrencyUnitConfig(unitKey).category) applyCurrency(unitKey);
    if (!unitKey && (t === 'BANK_DEPOSIT' || t === 'PENSION_BES' || t === 'INVESTMENT_FUND') && getCurrencyUnitConfig(currency).category === 'GOLD') {
      applyCurrency('TRY');
    }
  };

  const onSubmit = () => {
    if (!valid) return;
    const meta = ASSET_TYPE_META[type];
    const base = {
      title: title.trim(),
      category: meta.category,
      assetType: type,
      institution: institution.trim() || undefined,
      currency,
      unitQuantity: unit ? qtyNum : undefined,
      unitPrice: unit && priceNum > 0 ? priceNum : undefined,
      targetAmount: parseAmount(target) || 0,
      notes: notes.trim() || undefined,
      isShared,
      excludeFromReports: exclude,
    };
    if (existing) {
      updateSavingsGoal(existing.id, {
        ...base,
        currentAmount: computed,
        linkedCardId: cardId || undefined,
        linkedCardName: selectedCard?.name,
        icon: existing.icon && existing.assetType === type ? existing.icon : unit ? cfg.icon : meta.emoji,
        color: existing.assetType === type && existing.color ? existing.color : meta.color,
        updatedAt: new Date().toISOString(),
      });
      showToast('Birikim güncellendi');
    } else {
      addSavingsGoal({
        ...base,
        initialAmount: computed,
        icon: unit ? cfg.icon : meta.emoji,
        color: meta.color,
        linkedCardId: cardId || undefined,
        linkedCardName: selectedCard?.name,
      });
      showToast('Birikim eklendi');
    }
    navigation.goBack();
  };

  const cardOptions = [
    { value: '', label: 'Bağlantısız' },
    ...cards.map((c) => ({
      value: c.id,
      label: `${c.name} · ${c.type === 'CREDIT_CARD' ? `Borç ${formatMoney(c.currentDebt || 0)}` : `Bakiye ${formatMoney(c.balance || 0, c.currency || 'TRY')}`}`,
    })),
  ];

  return (
    <FormScreen title={existing ? 'Birikimi Düzenle' : 'Yeni Birikim'} onSubmit={onSubmit} submitDisabled={!valid}>
      <FieldLabel label="Varlık türü">
        <View style={tw`flex-row flex-wrap gap-2.5`}>
          {ASSET_TYPE_ORDER.map((t) => {
            const meta = ASSET_TYPE_META[t];
            const Icon = iconByName(meta.icon);
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => chooseType(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  tw.style(
                    'w-[22%] grow min-h-[78px] rounded-2xl border-2 items-center justify-center gap-1 p-1.5',
                    active ? 'bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  ),
                  active ? { borderColor: meta.color, backgroundColor: `${meta.color}1a` } : null,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Icon size={22} color={active ? meta.color : palette.slate500} strokeWidth={2.2} />
                <Text variant="caption" weight="semibold" className="text-center" numberOfLines={1} adjustsFontSizeToFit>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FieldLabel>

      <TextField label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn. Çeyrek altın birikimi, Ev peşinatı" autoFocus={!existing} />
      <TextField label="Kurum / Banka" value={institution} onChangeText={setInstitution} placeholder="Örn. Garanti BBVA, Fiziki kasa" />

      <SwatchField label="Para birimi / birim" value={currency} onChange={applyCurrency} options={CURRENCY_SWATCHES} sheetTitle="Para birimi / birim seç" />

      {unit ? (
        <Card className="gap-4">
          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <TextField
                label={`Miktar (${cfg.unitSuffix})`}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="Örn. 5"
                error={quantity && qtyNum <= 0 ? 'Miktar girin' : undefined}
              />
            </View>
            <View style={tw`flex-1`}>
              <TextField label="Birim fiyat (₺)" value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" placeholder="0" />
            </View>
          </View>
          <View style={tw`flex-row justify-between items-center`}>
            <Text variant="footnote" tone="muted">
              {existing ? 'Güncel tutar' : 'Başlangıç tutarı'}
            </Text>
            <Text variant="headline">{formatMoney(Math.round(computed * 100) / 100)}</Text>
          </View>
          <Text variant="caption" tone="faint">
            {`Güncel kur: 1 ${cfg.unitSuffix} = ${formatMoney(getCurrencyRateInTRY(currency, rates), 'TRY', 2)}`}
          </Text>
        </Card>
      ) : (
        <TextField
          label={existing ? 'Güncel tutar (₺)' : 'Başlangıç tutarı (₺)'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Örn. 15000"
        />
      )}

      <TextField label="Hedef tutar (₺, opsiyonel)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Örn. 100000" />

      <SelectField
        label="Bağlı kart (opsiyonel)"
        value={cardId}
        onChange={setCardId}
        options={cardOptions}
        placeholder="Bağlantısız"
        hint={
          existing
            ? undefined
            : cardId && computed > 0
              ? `${formatMoney(computed)} bu karttan düşülecek.`
              : 'Kart seçer ve tutar girersen başlangıç tutarı karttan düşülür.'
        }
      />

      <TextField label="Not" value={notes} onChangeText={setNotes} placeholder="Opsiyonel" multiline />

      <ListGroup>
        <SwitchRow title="Aile birikimi" subtitle="Aile üyeleriyle paylaşılır" icon="Users" iconColor={palette.info} value={isShared} onValueChange={setIsShared} />
        <SwitchRow title="Raporlardan hariç tut" subtitle="Net varlık ve raporlarda sayılmaz" icon="EyeOff" iconColor={palette.slate500} value={exclude} onValueChange={setExclude} />
      </ListGroup>
    </FormScreen>
  );
};
