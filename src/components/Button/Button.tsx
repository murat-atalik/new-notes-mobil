import React, { memo } from 'react';
import { Pressable, Text } from 'react-native';

import { styles } from './styles';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  small?: boolean;
};

export const Button = memo(function Button({
  title,
  onPress,
  variant = 'primary',
  small = false,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.button,
        small && styles.buttonSmall,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextDark]}>
        {title}
      </Text>
    </Pressable>
  );
});
