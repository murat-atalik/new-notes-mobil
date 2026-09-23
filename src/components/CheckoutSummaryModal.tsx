import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ArrowRight, BarChart3, CheckCircle2, X } from 'lucide-react-native';

import { confetti } from '../lib/native';
import { ic, tw } from '../lib/tw';
import { useAppStore } from '../store/useAppStore';
import { Btn, Overlay, Text } from './ui';

interface CheckoutSummaryModalProps {
  totalAmount: number;
  itemCount: number;
  listTitle: string;
  onClose: () => void;
}

export const CheckoutSummaryModal: React.FC<CheckoutSummaryModalProps> = ({
  totalAmount,
  itemCount,
  listTitle,
  onClose,
}) => {
  const { setActiveTab } = useAppStore();

  useEffect(() => {
    // Fire festive celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleGoToAnalytics = () => {
    onClose();
    setActiveTab('analytics');
  };

  return (
    <Overlay onClose={onClose}>
      <View
        style={tw`w-full max-w-sm self-center bg-white dark:bg-slate-900 rounded-3xl p-6 pt-7 shadow-2xl items-center relative border border-slate-100 dark:border-slate-800`}
      >
        <Btn
          onPress={onClose}
          accessibilityLabel="Kapat"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center z-10"
        >
          <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-400')} />
        </Btn>

        {/* Icon */}
        <View
          style={tw`w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center self-center mb-3.5 shadow-sm`}
        >
          <CheckCircle2 {...ic('w-9 h-9 text-emerald-600 dark:text-emerald-400')} />
        </View>

        {/* Title */}
        <Text className="font-extrabold text-xl text-slate-900 dark:text-white leading-tight text-center px-8">
          Alışveriş Tamamlandı!
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
          {listTitle} sepetindeki {itemCount} adet ürün başarıyla harcama kayıtlarına işlendi.
        </Text>

        {/* Receipt Box */}
        <View
          style={tw`w-full my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700`}
        >
          <View
            style={tw`flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700`}
          >
            <Text className="text-xs text-slate-500 dark:text-slate-400">Tarih</Text>
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View
            style={tw`flex-row items-center justify-between gap-3 py-3 border-b border-slate-200 dark:border-slate-700`}
          >
            <Text className="text-xs text-slate-500 dark:text-slate-400">Alınan Ürün Sayısı</Text>
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">{itemCount} Kalem</Text>
          </View>

          <View style={tw`flex-row items-center justify-between gap-3 pt-3`}>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">Toplam Harcanan:</Text>
            <Text
              className="flex-1 text-right text-lg font-black text-emerald-600 dark:text-emerald-400"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Text>
          </View>
        </View>

        <View style={tw`w-full gap-2`}>
          <Btn
            onPress={handleGoToAnalytics}
            className="w-full h-12 flex-row items-center justify-center gap-2 px-4 rounded-2xl bg-emerald-600 shadow-sm"
          >
            <BarChart3 {...ic('w-4 h-4 text-white')} />
            <Text className="text-white font-bold text-[15px]">Harcama Grafiğinde Gör</Text>
            <ArrowRight {...ic('w-4 h-4 text-white')} />
          </Btn>

          <Btn
            onPress={onClose}
            className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <Text className="text-slate-700 dark:text-slate-200 font-semibold text-[15px]">Listeye Geri Dön</Text>
          </Btn>
        </View>
      </View>
    </Overlay>
  );
};
