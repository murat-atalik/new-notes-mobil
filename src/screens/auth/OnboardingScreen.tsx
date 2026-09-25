import React, { useState } from 'react';

import {
  AmountField,
  Button,
  Card,
  IconTile,
  Segmented,
  showToast,
  StackScreen,
  Text,
  TextField,
} from '../../design';
import { parseAmount } from '../../logic/format';
import { CARD_TYPE_META } from '../../logic/selectors';
import { ASSET_TYPE_META } from '../savings/assetShared';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { PaymentCard } from '../../types';

type WalletType = Extract<PaymentCard['type'], 'CASH_WALLET' | 'DEBIT_CARD'>;

/**
 * Shown once, right after registration (see `justRegistered` in the store and
 * `AppStack`'s initial route). Both steps are optional — "Atla" skips straight to the app.
 */
export const OnboardingScreen: React.FC<RootScreenProps<'Onboarding'>> = ({ navigation }) => {
  const currentUser = useAppStore((s) => s.currentUser);
  const setJustRegistered = useAppStore((s) => s.setJustRegistered);
  const addSavingsGoal = useAppStore((s) => s.addSavingsGoal);
  const addPaymentCard = useAppStore((s) => s.addPaymentCard);

  const [savingsTarget, setSavingsTarget] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('CASH_WALLET');
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');

  const finish = () => {
    const target = parseAmount(savingsTarget);
    if (target > 0) {
      const meta = ASSET_TYPE_META.CASH_VAULT;
      addSavingsGoal({
        title: 'Genel Birikim Hedefim',
        category: meta.category,
        targetAmount: target,
        currency: 'TRY',
        icon: meta.icon,
        color: meta.color,
        initialAmount: 0,
        isShared: true,
      });
    }

    const balance = parseAmount(walletBalance);
    if (walletName.trim() || balance > 0) {
      addPaymentCard({
        userId: currentUser.id,
        familyId: currentUser.familyId,
        name: walletName.trim() || (walletType === 'CASH_WALLET' ? 'Nakit Cüzdanım' : 'Ana Hesabım'),
        type: walletType,
        color: '#3b82f6',
        icon: CARD_TYPE_META[walletType].icon,
        balance,
        initialBalance: balance,
        currency: 'TRY',
        isShared: true,
        excludeFromReports: false,
      });
    }

    if (target > 0 || walletName.trim() || balance > 0) showToast('Başlangıç bilgilerin kaydedildi');
    setJustRegistered(false);
    navigation.replace('Tabs');
  };

  return (
    <StackScreen
      title="Başlarken"
      right={
        <Button title="Atla" variant="ghost" size="sm" onPress={finish} />
      }
      onBack={finish}
      footer={<Button title="Devam Et" onPress={finish} fullWidth />}
    >
      <Text variant="title2" className="pt-1">
        {`Hoş geldin, ${currentUser.name.split(' ')[0]}!`}
      </Text>
      <Text variant="subhead" tone="muted">
        Bu ikisi isteğe bağlı — istersen hemen atlayıp sonra Cüzdan sekmesinden ekleyebilirsin.
      </Text>

      <Card className="gap-1">
        <IconTile icon={ASSET_TYPE_META.CASH_VAULT.icon} color={ASSET_TYPE_META.CASH_VAULT.color} />
        <Text variant="headline" className="pt-2">
          Toplam birikim hedefin
        </Text>
        <Text variant="footnote" tone="muted">
          Ne kadar birikim yapmayı hedefliyorsun?
        </Text>
        <AmountField value={savingsTarget} onChangeText={setSavingsTarget} />
      </Card>

      <Card className="gap-3">
        <IconTile icon="Wallet" color="#3b82f6" />
        <Text variant="headline" className="pt-2">
          Ana cüzdanın
        </Text>
        <Text variant="footnote" tone="muted">
          Harcamalarını takip etmeye başlayacağın hesap ya da nakit.
        </Text>
        <Segmented<WalletType>
          options={[
            { value: 'CASH_WALLET', label: CARD_TYPE_META.CASH_WALLET.label },
            { value: 'DEBIT_CARD', label: CARD_TYPE_META.DEBIT_CARD.label },
          ]}
          value={walletType}
          onChange={setWalletType}
        />
        <TextField
          label="Ad"
          value={walletName}
          onChangeText={setWalletName}
          placeholder={walletType === 'CASH_WALLET' ? 'Örn. Nakit Cüzdanım' : 'Örn. Ziraat Hesabım'}
        />
        <AmountField label="Başlangıç bakiyesi" value={walletBalance} onChangeText={setWalletBalance} />
      </Card>
    </StackScreen>
  );
};
