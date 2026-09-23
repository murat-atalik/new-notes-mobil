import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '../../design';
import { EMOJI_AVATARS } from '../../data/emojis';
import { tw } from '../../lib/tw';

/** Emoji avatar picker: horizontal row (`layout="row"`) or wrapping grid. */
export const AvatarPicker: React.FC<{
  value: string;
  onChange: (emoji: string) => void;
  color: string;
  layout?: 'row' | 'grid';
}> = ({ value, onChange, color, layout = 'row' }) => {
  const cells = EMOJI_AVATARS.map((emoji) => {
    const active = emoji === value;
    return (
      <Pressable
        key={emoji}
        onPress={() => onChange(emoji)}
        accessibilityRole="button"
        accessibilityLabel={`Avatar ${emoji}`}
        accessibilityState={{ selected: active }}
        style={[
          tw`w-12 h-12 rounded-full items-center justify-center`,
          { borderWidth: active ? 3 : 0, borderColor: color },
        ]}
      >
        <View
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: active ? `${color}22` : tw.isDark() ? '#1e293b' : '#f1f5f9' },
          ]}
        >
          <Text style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</Text>
        </View>
      </Pressable>
    );
  });

  if (layout === 'grid') {
    return <View style={tw`flex-row flex-wrap gap-1.5 justify-center`}>{cells}</View>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-1.5 px-1`} style={tw`-mx-1`}>
      {cells}
    </ScrollView>
  );
};
