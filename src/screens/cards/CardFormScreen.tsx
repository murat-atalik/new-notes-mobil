import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  ChipRow,
  ColorPicker,
  FieldLabel,
  FormScreen,
  iconByName,
  ListGroup,
  palette,
  Segmented,
  SelectField,
  showToast,
  SwitchRow,
  Text,
  TextField,
} from '../../design';
import { formatMoney, isoDate, parseAmount } from '../../logic/format';
import { CARD_TYPE_META, isCreditCard } from '../../logic/selectors';
import { CUTOFF_PRESETS } from '../../lib/currencyUnits';
import { tw } from '../../lib/tw';
import { useAppNavigation, type RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { PaymentCardType } from '../../types';
import { CARD_COLORS, CARD_TYPE_ORDER, CardVisual, PROVIDER_SUGGESTIONS } from './cardShared';

type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';
const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'TRY', label: '₺ TRY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
];

const DAY_OPTIONS = [{ value: '', label: 'Belirtilmedi' }, ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Her ayın ${i + 1}. günü` }))];

const DEFAULT_NAMES: Record<PaymentCardType, string> = {
  CREDIT_CARD: 'Kredi Kartım',
  DEBIT_CARD: 'Vadesiz Hesabım',
  FOOD_CARD: 'Yemek Kartım',
  CASH_WALLET: 'Nakit Cüzdan',
  PREPAID_CARD: 'Ön Ödemeli Kart',
};

const numStr = (n?: number) => (n ? String(n).replace('.', ',') : '');

/** Web rule: due day defaults to cutoff + 10 (or cutoff − 20 late in the month). */
const defaultDueDay = (cutoff: number) => (cutoff <= 20 ? cutoff + 10 : Math.max(1, cutoff - 20));

export const CardFormScreen: React.FC<RootScreenProps<'CardForm'>> = ({ route }) => {
  const navigation = useAppNavigation();
  const cardId = route.params?.cardId;
  const existing = useAppStore((s) => (cardId ? s.paymentCards.find((c) => c.id === cardId) : undefined));
  const currentUser = useAppStore((s) => s.currentUser);
  const addPaymentCard = useAppStore((s) => s.addPaymentCard);
  const updatePaymentCard = useAppStore((s) => s.updatePaymentCard);

  const [type, setType] = useState<PaymentCardType>(existing?.type ?? 'CREDIT_CARD');
  const [name, setName] = useState(existing?.name ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [last4, setLast4] = useState(existing?.last4 ?? '');
  const [color, setColor] = useState(existing?.color ?? CARD_COLORS[0]);
  const [currency, setCurrency] = useState<CurrencyCode>((existing?.currency as CurrencyCode) || 'TRY');
  const [limit, setLimit] = useState(numStr(existing?.creditLimit));
  const [debt, setDebt] = useState(numStr(existing?.currentDebt));
  const [cutoffDay, setCutoffDay] = useState(existing?.cutoffDay ? String(existing.cutoffDay) : '');
  const [dueDay, setDueDay] = useState(existing?.dueDay ? String(existing.dueDay) : '');
  const [allowance, setAllowance] = useState(numStr(existing?.monthlyAllowance));
  const [balance, setBalance] = useState(numStr(existing?.balance));
  const [isShared, setIsShared] = useState(existing ? existing.isShared !== false : true);

  const credit = type === 'CREDIT_CARD';
  const food = type === 'FOOD_CARD';
  const hasCurrency = type === 'DEBIT_CARD' || type === 'CASH_WALLET';
  const effectiveCurrency = hasCurrency ? currency : 'TRY';
  const finalName = name.trim() || (provider.trim() ? `${provider.trim()} ${CARD_TYPE_META[type].label}` : '');
  const last4Error = last4 && last4.length !== 4 ? '4 hane girin' : undefined;
  const valid = !!finalName && !last4Error && (!credit || parseAmount(limit) > 0);

  const chooseCutoff = (value: string) => {
    setCutoffDay(value);
    if (value && !dueDay) setDueDay(String(defaultDueDay(Number(value))));
  };

  const onSubmit = () => {
    if (!valid) return;
    const fields = {
      name: finalName,
      type,
      provider: provider.trim() || undefined,
      last4: last4 || undefined,
      color,
      icon: CARD_TYPE_META[type].icon,
      currency: effectiveCurrency,
      balance: credit ? 0 : parseAmount(balance),
      monthlyAllowance: food ? parseAmount(allowance) : 0,
      creditLimit: credit ? parseAmount(limit) : 0,
      currentDebt: credit ? parseAmount(debt) : 0,
      cutoffDay: credit && cutoffDay ? Number(cutoffDay) : undefined,
      dueDay: credit && dueDay ? Number(dueDay) : undefined,
      isShared,
    };
    if (existing) {
      // A manual balance/debt change is recorded as an adjustment transaction so the
      // card history (and the web's debt recalculation from transactions) stays consistent.
      const sameKind = isCreditCard(existing) === credit;
      const before = credit ? existing.currentDebt || 0 : existing.balance || 0;
      const after = credit ? fields.currentDebt : fields.balance;
      const delta = Math.round((after - before) * 100) / 100;
      const transactions = [...(existing.transactions || [])];
      if (sameKind && delta !== 0) {
        // Credit: more debt = SPEND, less debt = TOP_UP. Others: more balance = TOP_UP.
        const increasesSpend = credit ? delta > 0 : delta < 0;
        transactions.unshift({
          id: `tx-adjust-${Date.now()}`,
          cardId: existing.id,
          amount: Math.abs(delta),
          type: increasesSpend ? 'SPEND' : 'TOP_UP',
          title: credit ? 'Borç düzeltmesi' : 'Bakiye düzeltmesi',
          date: isoDate(),
          note: 'Kart düzenlenirken elle güncellendi',
        });
      }
      updatePaymentCard(existing.id, { ...fields, transactions });
      showToast(sameKind && delta !== 0 ? 'Kart güncellendi · düzeltme işlemi eklendi' : 'Kart güncellendi');
    } else {
      addPaymentCard({
        ...fields,
        userId: currentUser.id,
        familyId: currentUser.familyId,
        initialBalance: fields.balance,
        excludeFromReports: false,
      });
      showToast('Kart eklendi');
    }
    navigation.goBack();
  };

  const preview = {
    id: existing?.id ?? 'preview',
    userId: currentUser.id,
    createdAt: '',
    name: finalName || DEFAULT_NAMES[type],
    type,
    provider: provider.trim() || undefined,
    last4: last4 || undefined,
    color,
    currency: effectiveCurrency,
    balance: parseAmount(balance),
    monthlyAllowance: parseAmount(allowance),
    creditLimit: parseAmount(limit),
    currentDebt: parseAmount(debt),
    isShared,
  };

  const suggestions = PROVIDER_SUGGESTIONS[type];

  return (
    <FormScreen title={existing ? 'Kartı Düzenle' : 'Yeni Kart'} onSubmit={onSubmit} submitDisabled={!valid}>
      <CardVisual card={preview} compact />

      <FieldLabel label="Kart türü">
        <View style={tw`flex-row flex-wrap gap-2.5`}>
          {CARD_TYPE_ORDER.map((t) => {
            const meta = CARD_TYPE_META[t];
            const Icon = iconByName(meta.icon);
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  tw.style(
                    'w-[31%] grow min-h-[84px] rounded-2xl border-2 items-center justify-center gap-1.5 p-2',
                    active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  ),
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Icon size={24} color={active ? palette.brand : palette.slate500} strokeWidth={2.2} />
                <Text variant="footnote" weight="semibold" tone={active ? 'brand' : 'default'} className="text-center" numberOfLines={1}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FieldLabel>

      <View style={tw`gap-2`}>
        <TextField label="Sağlayıcı / Banka" value={provider} onChangeText={setProvider} placeholder="Örn. Garanti BBVA" />
        {suggestions.length ? (
          <ChipRow options={suggestions.map((s) => ({ value: s, label: s }))} value={provider} onChange={setProvider} />
        ) : null}
      </View>

      <TextField label="Kart adı" value={name} onChangeText={setName} placeholder={DEFAULT_NAMES[type]} hint={!name.trim() && finalName ? `Boş bırakılırsa "${finalName}"` : undefined} />

      {type !== 'CASH_WALLET' ? (
        <TextField
          label="Son 4 hane"
          value={last4}
          onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="1234"
          error={last4Error}
        />
      ) : null}

      <FieldLabel label="Renk">
        <ColorPicker colors={CARD_COLORS} value={color} onChange={setColor} />
      </FieldLabel>

      {hasCurrency ? (
        <FieldLabel label="Para birimi">
          <Segmented options={CURRENCIES} value={currency} onChange={setCurrency} />
        </FieldLabel>
      ) : null}

      {credit ? (
        <>
          <TextField
            label="Kart limiti (₺)"
            value={limit}
            onChangeText={setLimit}
            keyboardType="decimal-pad"
            placeholder="Örn. 50000"
            error={limit && parseAmount(limit) <= 0 ? 'Geçerli bir limit girin' : undefined}
          />
          <TextField
            label="Güncel borç (₺)"
            value={debt}
            onChangeText={setDebt}
            keyboardType="decimal-pad"
            placeholder="0"
            hint={parseAmount(limit) > 0 ? `Kullanılabilir: ${formatMoney(Math.max(0, parseAmount(limit) - parseAmount(debt)))}` : undefined}
          />
          <View style={tw`gap-2`}>
            <SelectField label="Hesap kesim günü" value={cutoffDay} onChange={chooseCutoff} options={DAY_OPTIONS} placeholder="Seçin" />
            <ChipRow
              options={CUTOFF_PRESETS.map((p) => ({ value: String(p.day), label: p.label }))}
              value={cutoffDay}
              onChange={chooseCutoff}
            />
          </View>
          <SelectField
            label="Son ödeme günü"
            value={dueDay}
            onChange={setDueDay}
            options={DAY_OPTIONS}
            placeholder="Seçin"
            hint={cutoffDay && !dueDay ? `Önerilen: ${defaultDueDay(Number(cutoffDay))}. gün` : undefined}
          />
        </>
      ) : food ? (
        <>
          <TextField label="Aylık yükleme (₺)" value={allowance} onChangeText={setAllowance} keyboardType="decimal-pad" placeholder="Örn. 4500" />
          <TextField label="Güncel bakiye (₺)" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder="0" />
        </>
      ) : (
        <TextField
          label={`Güncel bakiye (${effectiveCurrency})`}
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      )}

      <ListGroup footer="Aile kartları aile üyeleriyle paylaşılır ve ortak raporlarda görünür.">
        <SwitchRow title="Aile kartı" icon="Users" iconColor={palette.info} value={isShared} onValueChange={setIsShared} />
      </ListGroup>
    </FormScreen>
  );
};
