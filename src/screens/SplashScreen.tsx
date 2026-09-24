import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Gradient, Text } from '../design';
import { tw } from '../lib/tw';

/**
 * Shown while the persisted session is validated against the server (see App.tsx).
 * Deliberately fixed-dark and mirrors the native launch screen (LaunchScreen.storyboard /
 * launch_screen.xml) so there is no flash when the JS layer takes over.
 */
export const SplashScreen: React.FC = () => (
  <View style={[tw`flex-1 items-center justify-center gap-4`, { backgroundColor: '#020617' }]}>
    <Gradient colors={['emerald-400', 'teal-600']} dir="br" className="w-[120px] h-[120px] rounded-[30px] items-center justify-center">
      <Text className="text-[52px] leading-[60px] font-extrabold text-white">₺</Text>
    </Gradient>
    <Text className="text-[28px] leading-[34px] font-extrabold text-white">Akıllı Liste</Text>
    <ActivityIndicator color="#10b981" style={tw`mt-6`} />
  </View>
);
