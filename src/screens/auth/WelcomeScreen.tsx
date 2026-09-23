import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckSquare, PiggyBank, ShoppingCart, type LucideIcon } from 'lucide-react-native';

import { Button, Gradient, IconTile, Text } from '../../design';
import { tw } from '../../lib/tw';
import type { AuthScreenProps } from '../../navigation/types';

const VALUE_PROPS: { icon: LucideIcon; color: string; title: string; text: string }[] = [
  { icon: ShoppingCart, color: '#10b981', title: 'Ortak alışveriş listeleri', text: 'Ailenle aynı listede, anlık güncel.' },
  { icon: CheckSquare, color: '#6366f1', title: 'Görevler & notlar', text: 'Yapılacakları ve fikirleri tek yerde topla.' },
  { icon: PiggyBank, color: '#f59e0b', title: 'Harcama & birikim takibi', text: 'Bütçeni, kartlarını ve birikimini izle.' },
];

export const WelcomeScreen: React.FC<AuthScreenProps<'Welcome'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[tw`flex-1 bg-slate-100 dark:bg-slate-950 px-6`, { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      <View style={tw`flex-1 justify-center gap-10`}>
        <View style={tw`items-center gap-4`}>
          <Gradient colors={['emerald-400', 'teal-600']} dir="br" className="w-24 h-24 rounded-[30px] items-center justify-center shadow-lg">
            <Text className="text-[48px] leading-[56px] font-extrabold text-white">₺</Text>
          </Gradient>
          <View style={tw`items-center gap-1.5`}>
            <Text variant="largeTitle" className="text-center">
              Akıllı Liste
            </Text>
            <Text variant="callout" tone="muted" className="text-center">
              Aile listeleri ve bütçeniz tek yerde
            </Text>
          </View>
        </View>

        <View style={tw`gap-5`}>
          {VALUE_PROPS.map((prop) => (
            <View key={prop.title} style={tw`flex-row items-center gap-4`}>
              <IconTile icon={prop.icon} color={prop.color} size="lg" />
              <View style={tw`flex-1 min-w-0`}>
                <Text variant="headline">{prop.title}</Text>
                <Text variant="subhead" tone="muted">
                  {prop.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={tw`gap-3`}>
        <Button title="Hesap Oluştur" onPress={() => navigation.navigate('Register')} fullWidth />
        <Button title="Giriş Yap" variant="secondary" onPress={() => navigation.navigate('Login')} fullWidth />
      </View>
    </View>
  );
};
