import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Icons from 'lucide-react-native';
import { ChevronLeft, ChevronRight, Eye, EyeOff, type LucideIcon, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { create } from 'zustand';

import { useTheme } from '../hooks/useTheme';
import { ic, tw } from '../lib/tw';
import { Btn, DateInput, Overlay, Select, Text as BaseText, type SelectOption } from './primitives';

export { Btn, DateInput, Gradient, Grid, Input, Overlay, Panel, Progress, Select, showToast, ToastHost } from './primitives';
export type { SelectOption } from './primitives';
export { UserAvatar } from './UserAvatar';

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

export const palette = {
  brand: '#059669',
  brandLight: '#10b981',
  brandDark: '#34d399',
  danger: '#e11d48',
  warning: '#d97706',
  info: '#4f46e5',
  slate400: '#94a3b8',
  slate500: '#64748b',
} as const;

/** Space reserved at the bottom of tab screens for the floating tab bar. */
export const TAB_BAR_SPACE = 96;

/* ------------------------------------------------------------------ *
 * Typography
 * ------------------------------------------------------------------ */

const VARIANTS = {
  largeTitle: 'text-[32px] leading-[38px] font-extrabold tracking-tight',
  title: 'text-[22px] leading-[28px] font-bold tracking-tight',
  title2: 'text-[19px] leading-[24px] font-bold',
  headline: 'text-[17px] leading-[22px] font-semibold',
  body: 'text-[16px] leading-[22px]',
  callout: 'text-[15px] leading-[20px]',
  subhead: 'text-[14px] leading-[19px]',
  footnote: 'text-[13px] leading-[18px]',
  caption: 'text-[12px] leading-[16px]',
  overline: 'text-[11px] leading-[14px] font-bold uppercase tracking-wider',
  amount: 'text-[34px] leading-[40px] font-extrabold tracking-tight',
} as const;

const TONES = {
  default: 'text-slate-900 dark:text-white',
  muted: 'text-slate-500 dark:text-slate-400',
  faint: 'text-slate-400 dark:text-slate-500',
  brand: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-indigo-600 dark:text-indigo-400',
  inverse: 'text-white',
} as const;

export type TextVariant = keyof typeof VARIANTS;
export type TextTone = keyof typeof TONES;

export const Text: React.FC<
  React.ComponentProps<typeof BaseText> & { variant?: TextVariant; tone?: TextTone; weight?: 'normal' | 'medium' | 'semibold' | 'bold' }
> = ({ variant = 'body', tone = 'default', weight, className = '', ...rest }) => (
  <BaseText
    {...rest}
    className={`${VARIANTS[variant]} ${TONES[tone]} ${weight ? `font-${weight}` : ''} ${className}`}
  />
);

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

/** Resolves a lucide icon by name (category/list icons are stored as names). */
export function iconByName(name?: string): LucideIcon {
  const lib = Icons as unknown as Record<string, LucideIcon>;
  return (name && lib[name]) || Icons.Circle;
}

/** Rounded colored square with an icon or emoji — used for lists, categories, cards. */
export const IconTile: React.FC<{
  icon?: string | LucideIcon;
  emoji?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  solid?: boolean;
}> = ({ icon, emoji, color = palette.brandLight, size = 'md', solid = false }) => {
  const box = size === 'sm' ? 32 : size === 'lg' ? 52 : 40;
  const glyph = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;
  // Some records (older SavingsAsset rows) store a lucide icon name in the same field
  // that otherwise holds an emoji, depending on asset type — render it as an icon rather
  // than literal text in that case.
  const emojiIsIconName = !!emoji && /^[A-Z][A-Za-z0-9]*$/.test(emoji);
  const Icon =
    typeof icon === 'string' || icon === undefined
      ? iconByName((icon as string) || (emojiIsIconName ? emoji : undefined))
      : icon;
  return (
    <View
      style={[
        tw`items-center justify-center`,
        { width: box, height: box, borderRadius: box * 0.3, backgroundColor: solid ? color : `${color}22` },
      ]}
    >
      {emoji && !emojiIsIconName ? (
        <BaseText style={{ fontSize: glyph }}>{emoji}</BaseText>
      ) : (
        <Icon size={glyph} color={solid ? '#fff' : color} strokeWidth={2.2} />
      )}
    </View>
  );
};

/* ------------------------------------------------------------------ *
 * Screens
 * ------------------------------------------------------------------ */

type ScreenProps = {
  title?: string;
  subtitle?: string;
  /** Rendered next to the large title (icon buttons, avatar). */
  right?: React.ReactNode;
  /** Replaces the title block entirely (e.g. Home greeting). */
  header?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  children?: React.ReactNode;
  /** Absolutely positioned overlay content (FAB). */
  overlay?: React.ReactNode;
  contentClassName?: string;
  scroll?: boolean;
};

/** Root screen of a bottom tab: large title + scrolling content above the tab bar. */
export const Screen: React.FC<ScreenProps> = ({
  title,
  subtitle,
  right,
  header,
  refreshing = false,
  onRefresh,
  children,
  overlay,
  contentClassName = '',
  scroll = true,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const head = header ?? (
    <View style={tw`flex-row items-end justify-between gap-3`}>
      <View style={tw`flex-1 min-w-0`}>
        {subtitle ? (
          <Text variant="footnote" tone="muted" weight="semibold" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {title ? (
          <Text variant="largeTitle" numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
        ) : null}
      </View>
      {right ? <View style={tw`flex-row items-center gap-2 pb-1`}>{right}</View> : null}
    </View>
  );
  const body = (
    <>
      {head}
      {children}
    </>
  );
  return (
    <View style={tw`flex-1 bg-slate-100 dark:bg-slate-950`}>
      {scroll ? (
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={[
            tw.style('px-4 gap-5', contentClassName),
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + TAB_BAR_SPACE },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? palette.brandDark : palette.brand} />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[tw.style('flex-1 px-4', contentClassName), { paddingTop: insets.top + 12 }]}>{body}</View>
      )}
      {overlay}
    </View>
  );
};

/** Header for pushed stack screens: back chevron, centered title, right actions. */
export const StackHeader: React.FC<{
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}> = ({ title, subtitle, right, onBack, transparent }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View
      style={[
        tw.style('flex-row items-center px-2 pb-2', transparent ? '' : 'bg-slate-100 dark:bg-slate-950'),
        { paddingTop: insets.top + 4 },
      ]}
    >
      <View style={tw`w-24 items-start`}>
        <IconButton
          icon={ChevronLeft}
          label="Geri"
          onPress={onBack ?? (() => navigation.goBack())}
          size="lg"
        />
      </View>
      <View style={tw`flex-1 items-center min-w-0`}>
        {title ? (
          <Text variant="headline" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={tw`w-24 flex-row items-center justify-end gap-1 pr-1`}>{right}</View>
    </View>
  );
};

/** Pushed screen: StackHeader + scroll body + optional sticky footer (safe-area aware). */
export const StackScreen: React.FC<{
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  footer?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  overlay?: React.ReactNode;
  contentClassName?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, right, onBack, footer, refreshing = false, onRefresh, scroll = true, overlay, contentClassName = '', children }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-slate-100 dark:bg-slate-950`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StackHeader title={title} subtitle={subtitle} right={right} onBack={onBack} />
      {scroll ? (
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={[tw.style('px-4 pt-2 gap-5', contentClassName), { paddingBottom: footer ? 24 : insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? palette.brandDark : palette.brand} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={tw.style('flex-1', contentClassName)}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            tw`px-4 pt-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800`,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {footer}
        </View>
      ) : null}
      {overlay}
    </KeyboardAvoidingView>
  );
};

/**
 * Top safe area for modal screens, measured natively: 0 inside an iOS page sheet,
 * the status-bar/notch height when the modal is presented full screen (Android,
 * iPad form sheets, large text, …).
 */
export const ModalHeaderSafeArea: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <SafeAreaView edges={['top', 'left', 'right']}>{children}</SafeAreaView>
);

/**
 * Form presented modally (native iOS sheet via `presentation: 'modal'`):
 * "Vazgeç" | title | "Kaydet". Keyboard-aware scroll body.
 */
export const FormScreen: React.FC<{
  title: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitting?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, onCancel, onSubmit, submitLabel = 'Kaydet', submitDisabled, submitting, children, footer }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-slate-100 dark:bg-slate-950`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeaderSafeArea>
      <View style={tw`flex-row items-center px-4 pt-3 pb-3`}>
        <Pressable hitSlop={10} onPress={onCancel ?? (() => navigation.goBack())} style={tw`w-20`} accessibilityRole="button">
          <Text variant="callout" tone="brand">
            Vazgeç
          </Text>
        </Pressable>
        <Text variant="headline" className="flex-1 text-center" numberOfLines={1}>
          {title}
        </Text>
        <View style={tw`w-20 items-end`}>
          {onSubmit ? (
            submitting ? (
              <ActivityIndicator color={palette.brand} />
            ) : (
              <Pressable hitSlop={10} disabled={submitDisabled} onPress={onSubmit} accessibilityRole="button">
                <Text variant="callout" weight="bold" tone={submitDisabled ? 'faint' : 'brand'}>
                  {submitLabel}
                </Text>
              </Pressable>
            )
          ) : null}
        </View>
      </View>
      </ModalHeaderSafeArea>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={[tw`px-4 pt-2 gap-5`, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
      {footer ? <View style={[tw`px-4 pt-2`, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
};

/* ------------------------------------------------------------------ *
 * Containers
 * ------------------------------------------------------------------ */

export const Card: React.FC<{
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  padded?: boolean;
}> = ({ children, className = '', style, onPress, onLongPress, padded = true }) => {
  const cls = `bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 ${padded ? 'p-4' : ''} ${className}`;
  if (onPress || onLongPress) {
    return (
      <Btn className={cls} style={style} onPress={onPress} onLongPress={onLongPress}>
        {children}
      </Btn>
    );
  }
  return <View style={[tw.style(cls), style]}>{children}</View>;
};

/** Titled block; optional trailing text action ("Tümü"). */
export const Section: React.FC<{
  title?: string;
  action?: { label: string; onPress: () => void };
  children?: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = '' }) => (
  <View style={tw.style('gap-2.5', className)}>
    {title || action ? (
      <View style={tw`flex-row items-center justify-between px-1`}>
        {title ? (
          <Text variant="headline" className="text-[18px]">
            {title}
          </Text>
        ) : (
          <View />
        )}
        {action ? (
          <Pressable hitSlop={10} onPress={action.onPress} accessibilityRole="button">
            <Text variant="subhead" tone="brand" weight="semibold">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    ) : null}
    {children}
  </View>
);

/** iOS inset-grouped container for `Row`s (adds dividers). */
export const ListGroup: React.FC<{ children?: React.ReactNode; header?: string; footer?: string }> = ({ children, header, footer }) => {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={tw`gap-1.5`}>
      {header ? (
        <Text variant="overline" tone="muted" className="px-4">
          {header}
        </Text>
      ) : null}
      <View style={tw`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden`}>
        {rows.map((row, index) => (
          <View key={index}>
            {row}
            {index < rows.length - 1 ? <View style={tw`h-px bg-slate-100 dark:bg-slate-800 ml-16`} /> : null}
          </View>
        ))}
      </View>
      {footer ? (
        <Text variant="caption" tone="muted" className="px-4">
          {footer}
        </Text>
      ) : null}
    </View>
  );
};

export const Row: React.FC<{
  title: string;
  subtitle?: string;
  value?: string;
  valueTone?: TextTone;
  left?: React.ReactNode;
  icon?: string | LucideIcon;
  iconColor?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}> = ({ title, subtitle, value, valueTone = 'muted', left, icon, iconColor, right, chevron, destructive, onPress, onLongPress, disabled }) => {
  const content = (
    <>
      {left ?? (icon ? <IconTile icon={icon} color={destructive ? palette.danger : iconColor} size="sm" /> : null)}
      <View style={tw`flex-1 min-w-0`}>
        <Text variant="body" tone={destructive ? 'danger' : 'default'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="callout" tone={valueTone} numberOfLines={1} className="max-w-[45%]">
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ?? !!onPress ? <ChevronRight {...ic('w-5 h-5 text-slate-300 dark:text-slate-600')} /> : null}
    </>
  );
  const cls = 'flex-row items-center gap-3 px-4 min-h-[56px] py-2.5';
  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [tw.style(cls), pressed ? tw`bg-slate-100 dark:bg-slate-800` : null, disabled ? tw`opacity-50` : null]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={tw.style(cls)}>{content}</View>;
};

/** Row with a native switch. */
export const SwitchRow: React.FC<{
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: string | LucideIcon;
  iconColor?: string;
}> = ({ title, subtitle, value, onValueChange, icon, iconColor }) => (
  <Row
    title={title}
    subtitle={subtitle}
    icon={icon}
    iconColor={iconColor}
    chevron={false}
    right={<Switch value={value} onValueChange={onValueChange} trackColor={{ true: palette.brandLight, false: undefined }} />}
  />
);

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary: ['bg-emerald-600', 'inverse'],
  secondary: ['bg-slate-200/80 dark:bg-slate-800', 'default'],
  tinted: ['bg-emerald-100 dark:bg-emerald-950', 'brand'],
  danger: ['bg-rose-600', 'inverse'],
  dangerTinted: ['bg-rose-100 dark:bg-rose-950/70', 'danger'],
  ghost: ['bg-transparent', 'brand'],
} as const;

export const Button: React.FC<{
  title: string;
  onPress?: () => void;
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}> = ({ title, onPress, variant = 'primary', size = 'lg', icon: Icon, loading, disabled, fullWidth, className = '' }) => {
  const [bg, tone] = BUTTON_VARIANTS[variant];
  const height = size === 'lg' ? 'h-[52px] px-5 rounded-2xl' : size === 'md' ? 'h-11 px-4 rounded-xl' : 'h-9 px-3 rounded-full';
  const textVariant: TextVariant = size === 'sm' ? 'subhead' : 'headline';
  const iconColor = tone === 'inverse' ? '#fff' : tone === 'danger' ? palette.danger : tone === 'brand' ? palette.brand : tw.isDark() ? '#fff' : '#0f172a';
  return (
    <Btn
      onPress={onPress}
      disabled={disabled || loading}
      className={`${bg} ${height} flex-row items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {Icon ? <Icon size={size === 'sm' ? 16 : 20} color={iconColor} strokeWidth={2.4} /> : null}
          <Text variant={textVariant} tone={tone} weight="semibold" numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Btn>
  );
};

export const IconButton: React.FC<{
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'filled' | 'brand';
  size?: 'md' | 'lg';
  color?: string;
  badge?: number;
}> = ({ icon: Icon, label, onPress, variant = 'filled', size = 'md', color, badge }) => {
  const box = size === 'lg' ? 'w-11 h-11' : 'w-10 h-10';
  const bg = variant === 'filled' ? 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700' : variant === 'brand' ? 'bg-emerald-600' : '';
  const iconColor = color ?? (variant === 'brand' ? '#fff' : tw.isDark() ? '#e2e8f0' : '#334155');
  return (
    <Btn onPress={onPress} accessibilityLabel={label} className={`${box} ${bg} rounded-full items-center justify-center`}>
      <Icon size={size === 'lg' ? 24 : 20} color={iconColor} strokeWidth={2.2} />
      {badge ? (
        <View style={tw`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 items-center justify-center`}>
          <Text variant="caption" tone="inverse" weight="bold" className="text-[10px] leading-[12px]">
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </Btn>
  );
};

/** Floating action button, bottom-right above the tab bar / safe area. */
export const FAB: React.FC<{ icon: LucideIcon; label?: string; onPress: () => void; aboveTabBar?: boolean }> = ({
  icon: Icon,
  label,
  onPress,
  aboveTabBar = false,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[tw`absolute right-4`, { bottom: (aboveTabBar ? TAB_BAR_SPACE : 16) + insets.bottom }]}
    >
      <Btn
        onPress={onPress}
        accessibilityLabel={label ?? 'Ekle'}
        className={`bg-emerald-600 shadow-lg flex-row items-center justify-center gap-2 ${label ? 'h-14 px-5 rounded-full' : 'w-14 h-14 rounded-full'}`}
      >
        <Icon size={24} color="#fff" strokeWidth={2.5} />
        {label ? (
          <Text variant="headline" tone="inverse">
            {label}
          </Text>
        ) : null}
      </Btn>
    </View>
  );
};

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/** Instance type of RN TextInput (focus/blur). */
export type TextInputHandle = React.ComponentRef<typeof TextInput>;

const fieldBox = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl';

export const FieldLabel: React.FC<{ label?: string; hint?: string; error?: string; children: React.ReactNode }> = ({
  label,
  hint,
  error,
  children,
}) => (
  <View style={tw`gap-1.5`}>
    {label ? (
      <Text variant="footnote" tone="muted" weight="semibold" className="px-1">
        {label}
      </Text>
    ) : null}
    {children}
    {error ? (
      <Text variant="footnote" tone="danger" className="px-1">
        {error}
      </Text>
    ) : hint ? (
      <Text variant="caption" tone="muted" className="px-1">
        {hint}
      </Text>
    ) : null}
  </View>
);

export const TextField: React.FC<
  TextInputProps & { label?: string; hint?: string; error?: string; icon?: LucideIcon; inputRef?: React.Ref<TextInputHandle> }
> = ({ label, hint, error, icon: Icon, secureTextEntry, multiline, style, inputRef, ...rest }) => {
  const [hidden, setHidden] = useState(true);
  return (
    <FieldLabel label={label} hint={hint} error={error}>
      <View
        style={tw.style(
          fieldBox,
          'flex-row px-4 gap-2.5',
          multiline ? 'items-start py-3 min-h-[110px]' : 'items-center h-[52px]',
          error ? 'border-rose-400 dark:border-rose-700' : '',
        )}
      >
        {Icon ? <Icon {...ic('w-5 h-5 text-slate-400')} /> : null}
        <TextInput
          ref={inputRef}
          placeholderTextColor={palette.slate400}
          secureTextEntry={secureTextEntry && hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
          style={[tw`flex-1 text-[16px] text-slate-900 dark:text-white`, multiline ? tw`min-h-[88px]` : null, style]}
        />
        {secureTextEntry ? (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)} accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}>
            {hidden ? <Eye {...ic('w-5 h-5 text-slate-400')} /> : <EyeOff {...ic('w-5 h-5 text-slate-400')} />}
          </Pressable>
        ) : null}
      </View>
    </FieldLabel>
  );
};

/** Big centered money input (expenses, top-ups). Value is the raw typed string. */
export const AmountField: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  currencySymbol?: string;
  label?: string;
  autoFocus?: boolean;
  tone?: TextTone;
}> = ({ value, onChangeText, currencySymbol = '₺', label, autoFocus, tone = 'default' }) => {
  const ref = useRef<TextInputHandle>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={tw`items-center py-4 gap-1`}>
      {label ? (
        <Text variant="footnote" tone="muted" weight="semibold">
          {label}
        </Text>
      ) : null}
      <View style={tw`flex-row items-center`}>
        <Text variant="amount" tone={value ? tone : 'faint'}>
          {currencySymbol}
        </Text>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^\d.,]/g, ''))}
          placeholder="0"
          placeholderTextColor={palette.slate400}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          style={tw.style(VARIANTS.amount, TONES[tone], 'min-w-[40px] p-0')}
        />
      </View>
    </Pressable>
  );
};

export const SelectField: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}> = ({ label, value, onChange, options, placeholder, hint, error }) => (
  <FieldLabel label={label} hint={hint} error={error}>
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      title={label}
      className={`${fieldBox} h-[52px] px-4 gap-2`}
      textClassName="text-[16px]"
    />
  </FieldLabel>
);

export const DateField: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'month';
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, mode, placeholder, hint }) => (
  <FieldLabel label={label} hint={hint}>
    <DateInput value={value} onChange={onChange} mode={mode} placeholder={placeholder} className={`${fieldBox} h-[52px] px-4`} />
  </FieldLabel>
);

/* ------------------------------------------------------------------ *
 * Selection controls
 * ------------------------------------------------------------------ */

export type SegmentOption<T extends string> = { value: T; label: string; count?: number; icon?: LucideIcon };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={tw`flex-row bg-slate-200/70 dark:bg-slate-800 rounded-2xl p-1`}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={tw.style(
              'flex-1 h-10 rounded-xl flex-row items-center justify-center gap-1.5 px-1',
              active ? 'bg-white dark:bg-slate-950 shadow-sm' : '',
            )}
          >
            {Icon ? <Icon size={16} color={active ? palette.brand : palette.slate500} strokeWidth={2.4} /> : null}
            <Text variant="subhead" weight={active ? 'bold' : 'medium'} tone={active ? 'default' : 'muted'} numberOfLines={1}>
              {opt.label}
            </Text>
            {opt.count !== undefined ? (
              <Text variant="caption" tone={active ? 'brand' : 'faint'} weight="bold">
                {String(opt.count)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export type ChipOption<T extends string> = { value: T; label: string; color?: string; icon?: LucideIcon };

/** Horizontally scrolling single-select chips. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`gap-2 px-1`}
      // Horizontal ScrollViews otherwise grow to fill a column's height.
      style={[tw`-mx-1`, { flexGrow: 0 }]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              tw.style(
                'h-9 px-4 rounded-full flex-row items-center gap-1.5 border',
                active ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
              ),
              active && opt.color ? { backgroundColor: opt.color, borderColor: opt.color } : null,
            ]}
          >
            {Icon ? <Icon size={15} color={active ? (opt.color ? '#fff' : tw.isDark() ? '#0f172a' : '#fff') : palette.slate500} /> : null}
            <Text
              variant="subhead"
              weight="semibold"
              className={active ? (opt.color ? 'text-white' : 'text-white dark:text-slate-900') : 'text-slate-700 dark:text-slate-300'}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Color swatch picker. */
export const ColorPicker: React.FC<{ colors: string[]; value: string; onChange: (color: string) => void }> = ({ colors, value, onChange }) => (
  <View style={tw`flex-row flex-wrap gap-3`}>
    {colors.map((color) => {
      const active = color.toLowerCase() === value.toLowerCase();
      return (
        <Pressable
          key={color}
          onPress={() => onChange(color)}
          accessibilityLabel={`Renk ${color}`}
          accessibilityState={{ selected: active }}
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { borderWidth: active ? 3 : 0, borderColor: tw.isDark() ? '#fff' : '#0f172a' },
          ]}
        >
          <View style={[tw`w-8 h-8 rounded-full`, { backgroundColor: color }]} />
        </Pressable>
      );
    })}
  </View>
);

export const LIST_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#84cc16', '#14b8a6', '#64748b'];

/* ------------------------------------------------------------------ *
 * Display
 * ------------------------------------------------------------------ */

const BADGE_TONES = {
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  brand: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  info: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  warning: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
} as const;

export const Badge: React.FC<{ label: string; tone?: keyof typeof BADGE_TONES; icon?: LucideIcon }> = ({ label, tone = 'neutral', icon: Icon }) => {
  const [bg1, bg2, fg1, fg2] = BADGE_TONES[tone].split(' ');
  return (
    <View style={tw.style('flex-row items-center gap-1 self-start px-2 h-6 rounded-full', bg1, bg2)}>
      {Icon ? <Icon {...ic(`w-3 h-3 ${fg1} ${fg2}`)} /> : null}
      <BaseText className={`text-[12px] font-bold ${fg1} ${fg2}`}>{label}</BaseText>
    </View>
  );
};

export const ProgressBar: React.FC<{ value: number; color?: string; height?: number; trackClassName?: string }> = ({
  value,
  color = palette.brandLight,
  height = 8,
  trackClassName = 'bg-slate-100 dark:bg-slate-800',
}) => (
  <View style={[tw.style('rounded-full overflow-hidden', trackClassName), { height }]}>
    <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height, backgroundColor: color, borderRadius: height }} />
  </View>
);

export const ProgressRing: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}> = ({ value, size = 72, stroke = 8, color = palette.brandLight, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={tw.isDark() ? '#1e293b' : '#e2e8f0'} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={tw`absolute inset-0 items-center justify-center`}>{children}</View>
    </View>
  );
};

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void; icon?: LucideIcon };
}> = ({ icon: Icon, emoji, title, message, action }) => (
  <View style={tw`items-center py-10 px-6 gap-3`}>
    {emoji ? (
      <BaseText style={{ fontSize: 44 }}>{emoji}</BaseText>
    ) : Icon ? (
      <View style={tw`w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 items-center justify-center`}>
        <Icon size={30} color={palette.brand} />
      </View>
    ) : null}
    <Text variant="title2" className="text-center">
      {title}
    </Text>
    {message ? (
      <Text variant="callout" tone="muted" className="text-center">
        {message}
      </Text>
    ) : null}
    {action ? <Button title={action.label} icon={action.icon} onPress={action.onPress} size="md" className="mt-2" /> : null}
  </View>
);

/** Small labeled figure for summary cards. */
export const Stat: React.FC<{ label: string; value: string; tone?: TextTone; caption?: string }> = ({ label, value, tone = 'default', caption }) => (
  <View style={tw`gap-0.5 min-w-0`}>
    <Text variant="caption" tone="muted" weight="semibold" numberOfLines={1}>
      {label}
    </Text>
    <Text variant="title2" tone={tone} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    {caption ? (
      <Text variant="caption" tone="faint" numberOfLines={1}>
        {caption}
      </Text>
    ) : null}
  </View>
);

/* ------------------------------------------------------------------ *
 * Sheets, action sheets & confirmation
 * ------------------------------------------------------------------ */

/** Titled bottom sheet for small pickers / actions. */
export const Sheet: React.FC<{ visible: boolean; onClose: () => void; title?: string; children?: React.ReactNode }> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  if (!visible) return null;
  return (
    <Overlay onClose={onClose} position="sheet">
      <View style={tw`bg-white dark:bg-slate-900 rounded-[28px] p-5 gap-4 max-h-full`}>
        {title ? (
          <View style={tw`flex-row items-center justify-between`}>
            <Text variant="title2">{title}</Text>
            <Btn onPress={onClose} accessibilityLabel="Kapat" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
              <X {...ic('w-4 h-4 text-slate-500 dark:text-slate-300')} />
            </Btn>
          </View>
        ) : null}
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={tw`gap-3`}>
          {children}
        </ScrollView>
      </View>
    </Overlay>
  );
};

export type ActionSheetOption = { label: string; icon?: LucideIcon; destructive?: boolean; onPress: () => void };

const actionStore = create<{ title?: string; message?: string; options: ActionSheetOption[] | null }>(() => ({ options: null }));

/** Imperative action sheet (long-press menus, "…" buttons). Rendered by `<ActionSheetHost/>`. */
export function showActionSheet(config: { title?: string; message?: string; options: ActionSheetOption[] }) {
  actionStore.setState(config);
}

export const ActionSheetHost: React.FC = () => {
  const { title, message, options } = actionStore();
  const close = () => actionStore.setState({ options: null });
  if (!options) return null;
  return (
    <Overlay onClose={close} position="sheet">
      <View style={tw`gap-2`}>
        <View style={tw`bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden`}>
          {title || message ? (
            <View style={tw`px-5 pt-4 pb-3 items-center border-b border-slate-100 dark:border-slate-800`}>
              {title ? (
                <Text variant="subhead" weight="bold" tone="muted" className="text-center">
                  {title}
                </Text>
              ) : null}
              {message ? (
                <Text variant="footnote" tone="muted" className="text-center">
                  {message}
                </Text>
              ) : null}
            </View>
          ) : null}
          {options.map((opt, index) => {
            const Icon = opt.icon;
            return (
              <Pressable
                key={opt.label}
                onPress={() => {
                  close();
                  // Let the sheet unmount before the action opens another modal.
                  setTimeout(opt.onPress, 250);
                }}
                style={({ pressed }) => [
                  tw`flex-row items-center gap-3 px-5 h-14`,
                  index < options.length - 1 ? tw`border-b border-slate-100 dark:border-slate-800` : null,
                  pressed ? tw`bg-slate-100 dark:bg-slate-800` : null,
                ]}
              >
                {Icon ? <Icon size={20} color={opt.destructive ? palette.danger : tw.isDark() ? '#e2e8f0' : '#334155'} /> : null}
                <Text variant="body" tone={opt.destructive ? 'danger' : 'default'} weight="medium">
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={close} style={tw`bg-white dark:bg-slate-900 rounded-[24px] h-14 items-center justify-center`}>
          <Text variant="body" weight="bold" tone="brand">
            Vazgeç
          </Text>
        </Pressable>
      </View>
    </Overlay>
  );
};

/** Native destructive confirmation. */
export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  Alert.alert(opts.title, opts.message, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: opts.confirmText ?? 'Sil', style: opts.destructive === false ? 'default' : 'destructive', onPress: opts.onConfirm },
  ]);
}

/** Runs `effect` once after the first render (for autofocus timing inside sheets). */
export function useAfterMount(effect: () => void, delay = 350) {
  useEffect(() => {
    const t = setTimeout(effect, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
