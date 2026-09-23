import React from 'react';
import { Image, View } from 'react-native';

import { tw } from '../lib/tw';
import { Text } from './primitives';

interface AvatarProps {
  avatar?: string;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const isEmoji = (str?: string): boolean => {
  if (!str) return false;
  if (str.startsWith('http') || str.startsWith('data:') || str.startsWith('/')) {
    return false;
  }
  return true;
};

const sizeClasses = {
  xs: ['w-6 h-6', 'text-xs'],
  sm: ['w-7 h-7', 'text-sm'],
  md: ['w-9 h-9', 'text-base'],
  lg: ['w-12 h-12', 'text-2xl'],
  xl: ['w-20 h-20', 'text-4xl'],
} as const;

export const UserAvatar: React.FC<AvatarProps> = ({
  avatar = '🦊',
  name = 'Kullanıcı',
  className = '',
  size = 'md',
  color = '#10b981',
}) => {
  const [box, text] = sizeClasses[size] || sizeClasses.md;

  if (isEmoji(avatar)) {
    return (
      <View
        accessibilityLabel={name}
        style={[
          tw.style('rounded-full items-center justify-center shrink-0 border', box, className),
          {
            backgroundColor: color ? `${color}18` : '#f1f5f9',
            borderColor: color ? `${color}40` : '#e2e8f0',
          },
        ]}
      >
        <Text className={text}>{avatar}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatar }}
      accessibilityLabel={name}
      style={[tw.style('rounded-full shrink-0 border', box, className), { borderColor: color || '#10b981' }]}
    />
  );
};
