import React from 'react';
import { View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';

import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { ic, tw } from '../lib/tw';
import { Btn, Text } from './ui';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented' | 'icon-only';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { themeMode, setThemeMode, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
      { id: 'light', label: 'Aydınlık', icon: Sun },
      { id: 'dark', label: 'Karanlık', icon: Moon },
    ];

    return (
      <View
        style={tw.style(
          'bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex-row items-center gap-1 border border-slate-200/80 dark:border-slate-700/80',
          className,
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = themeMode === opt.id;
          return (
            <Btn
              key={opt.id}
              onPress={() => setThemeMode(opt.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-xl ${
                isActive
                  ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'border border-transparent'
              }`}
            >
              <Icon
                {...ic(
                  isActive
                    ? 'w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400'
                    : 'w-3.5 h-3.5 text-slate-600 dark:text-slate-400',
                )}
              />
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {opt.label}
              </Text>
            </Btn>
          );
        })}
      </View>
    );
  }

  const isDark = themeMode === 'dark';
  const label = isDark ? 'Karanlık' : 'Aydınlık';
  const Icon = isDark ? Moon : Sun;
  const iconProps = ic(`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-amber-500'}`);

  if (variant === 'icon-only') {
    return (
      <Btn
        onPress={toggleTheme}
        accessibilityLabel={`Tema: ${label}`}
        className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center ${className}`}
      >
        <Icon {...iconProps} />
      </Btn>
    );
  }

  return (
    <Btn
      onPress={toggleTheme}
      accessibilityLabel={`Tema: ${label}`}
      className={`flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <Icon {...iconProps} />
      <Text className="hidden sm:flex text-[11px] font-semibold text-slate-700 dark:text-slate-200">{label}</Text>
    </Btn>
  );
};
