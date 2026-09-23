import React from 'react';
import { Pressable, View } from 'react-native';

import { iconByName } from '../../design';
import { tw } from '../../lib/tw';
import { ICON_CHOICES } from './iconChoices';

/** Wrapping grid of lucide icons; selected cell is filled with `color`. */
export const IconGrid: React.FC<{ value: string; onChange: (name: string) => void; color: string; icons?: string[] }> = ({
  value,
  onChange,
  color,
  icons = ICON_CHOICES,
}) => (
  <View style={tw`flex-row flex-wrap gap-2`}>
    {icons.map((name) => {
      const Icon = iconByName(name);
      const active = name === value;
      return (
        <Pressable
          key={name}
          onPress={() => onChange(name)}
          accessibilityRole="button"
          accessibilityLabel={`İkon ${name}`}
          accessibilityState={{ selected: active }}
          style={[
            tw`w-12 h-12 rounded-2xl items-center justify-center`,
            { backgroundColor: active ? color : tw.isDark() ? '#1e293b' : '#f1f5f9' },
          ]}
        >
          <Icon size={22} color={active ? '#fff' : tw.isDark() ? '#cbd5e1' : '#475569'} strokeWidth={2.2} />
        </Pressable>
      );
    })}
  </View>
);
