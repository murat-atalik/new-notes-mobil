import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, ChevronDown } from 'lucide-react-native';

import { ic, tw } from '../../lib/tw';

/**
 * Shared primitives for components ported from the web app.
 * Every primitive takes a Tailwind class string via `className` (twrnc) plus an
 * optional RN `style` for computed values.
 */

type ClassProps = { className?: string; style?: StyleProp<ViewStyle> };

/** Text with the web's inherited defaults (text-slate-900 / dark:text-slate-100). */
export const Text: React.FC<TextProps & { className?: string; style?: StyleProp<TextStyle> }> = ({
  className = '',
  style,
  ...rest
}) => (
  <RNText {...rest} style={[tw.style('text-base text-slate-900 dark:text-slate-100', className), style]} />
);

/** Pressable replacement for <button>/<div onClick> with press feedback (active:scale-95). */
export const Btn: React.FC<
  Omit<PressableProps, 'style'> & ClassProps & { children?: React.ReactNode }
> = ({ className = '', style, disabled, children, ...rest }) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled}
    {...rest}
    style={({ pressed }) => [
      tw.style(className),
      disabled ? tw`opacity-50` : null,
      pressed ? { opacity: 0.85, transform: [{ scale: 0.97 }] } : null,
      style,
    ]}
  >
    {children}
  </Pressable>
);

const GRADIENT_DIRECTIONS = {
  r: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  l: { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
  b: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  t: { start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },
  br: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  bl: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
  tr: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  tl: { start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },
} as const;

/**
 * `bg-gradient-to-br from-emerald-500 to-teal-600` →
 * `<Gradient dir="br" colors={['emerald-500', 'teal-600']} className="...">`.
 * Colors accept Tailwind names or raw hex/rgba values.
 */
export const Gradient: React.FC<
  ClassProps & {
    colors: string[];
    dir?: keyof typeof GRADIENT_DIRECTIONS;
    children?: React.ReactNode;
  }
> = ({ colors, dir = 'br', className = '', style, children }) => (
  <LinearGradient
    colors={colors.map((c) => (c.startsWith('#') || c.startsWith('rgb') ? c : tw.color(c) ?? c))}
    {...GRADIENT_DIRECTIONS[dir]}
    style={[tw.style(className), style]}
  >
    {children}
  </LinearGradient>
);

/**
 * Web `fixed inset-0 bg-black/60 flex items-center justify-center` modal wrapper.
 * `position="bottom"` gives the mobile bottom-sheet variant (`items-end`).
 * Tapping the backdrop calls `onClose`.
 */
export const Overlay: React.FC<{
  visible?: boolean;
  onClose: () => void;
  position?: 'center' | 'bottom';
  overlayClassName?: string;
  children?: React.ReactNode;
}> = ({ visible = true, onClose, position = 'center', overlayClassName = 'bg-black/60', children }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={tw.style('flex-1', overlayClassName)}
    >
      <Pressable style={tw`absolute inset-0`} onPress={onClose} accessibilityLabel="Kapat" />
      <View
        pointerEvents="box-none"
        style={tw.style('flex-1', position === 'bottom' ? 'justify-end' : 'justify-center p-4')}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

/** Modal panel body: scrolls when taller than the screen (web `max-h-[90vh] overflow-y-auto`). */
export const Panel: React.FC<ClassProps & { children?: React.ReactNode; maxHeight?: number }> = ({
  className = '',
  style,
  maxHeight = 0.9,
  children,
}) => (
  <View style={[tw.style(className), { maxHeight: `${maxHeight * 100}%` }, style]}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
      {children}
    </ScrollView>
  </View>
);

/** <input>/<textarea> with themed text and placeholder colors. */
export const Input = React.forwardRef<TextInput, TextInputProps & { className?: string }>(
  ({ className = '', style, multiline, ...rest }, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor={tw.color('slate-400')}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      autoCorrect={false}
      {...rest}
      style={[tw.style('text-slate-900 dark:text-slate-100', className), style]}
    />
  ),
);

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Native replacement for <select>. Renders a pressable field styled with
 * `className` and opens a themed option sheet.
 */
export const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  textClassName?: string;
  placeholder?: string;
  title?: string;
}> = ({ value, onChange, options, className = '', textClassName = 'text-xs', placeholder = 'Seçiniz', title }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Btn className={`flex-row items-center justify-between ${className}`} onPress={() => setOpen(true)}>
        <Text className={`flex-1 ${textClassName}`} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown {...ic('w-4 h-4 text-slate-400')} />
      </Btn>
      {open && (
        <Overlay onClose={() => setOpen(false)} position="bottom">
          <View style={tw`bg-white dark:bg-slate-900 rounded-t-3xl pt-3 pb-8 max-h-[70%]`}>
            <View style={tw`w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 self-center mb-3`} />
            {title ? (
              <Text className="text-sm font-bold px-5 mb-2">{title}</Text>
            ) : null}
            <ScrollView>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Btn
                    key={option.value}
                    disabled={option.disabled}
                    className={`mx-3 px-3 py-3 rounded-xl flex-row items-center justify-between ${
                      active ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      className={`text-sm flex-1 ${
                        active ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {active && <Check {...ic('w-4 h-4 text-emerald-600 dark:text-emerald-400')} />}
                  </Btn>
                );
              })}
            </ScrollView>
          </View>
        </Overlay>
      )}
    </>
  );
};

/** <input type="date"> replacement: YYYY-MM-DD text field with a numeric keyboard. */
export const DateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  mode?: 'date' | 'month';
}> = ({ value, onChange, className = '', placeholder, mode = 'date' }) => {
  const maxLength = mode === 'month' ? 7 : 10;
  const format = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, mode === 'month' ? 6 : 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };
  return (
    <Input
      value={value}
      onChangeText={(text) => onChange(format(text))}
      placeholder={placeholder ?? (mode === 'month' ? 'YYYY-AA' : 'YYYY-AA-GG')}
      keyboardType="number-pad"
      maxLength={maxLength}
      className={className}
    />
  );
};

/**
 * CSS grid replacement: `grid grid-cols-2 gap-2` → `<Grid cols={2} gap={2}>`.
 * `gap` is in Tailwind spacing units (1 = 4px).
 */
export const Grid: React.FC<ClassProps & { cols: number; gap?: number; children?: React.ReactNode }> = ({
  cols,
  gap = 0,
  className = '',
  style,
  children,
}) => {
  const spacing = gap * 4;
  const items = React.Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  items.forEach((child, index) => {
    if (index % cols === 0) rows.push([]);
    rows[rows.length - 1].push(child);
  });
  return (
    <View style={[tw.style(className), { gap: spacing }, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[tw`flex-row`, { gap: spacing }]}>
          {row.map((child, index) => (
            <View key={index} style={tw`flex-1 min-w-0`}>
              {child}
            </View>
          ))}
          {Array.from({ length: cols - row.length }).map((_, index) => (
            <View key={`pad-${index}`} style={tw`flex-1`} />
          ))}
        </View>
      ))}
    </View>
  );
};

/** Progress bar: web `<div class="h-2 bg-slate-100"><div style={{width: pct%}} /></div>`. */
export const Progress: React.FC<{
  value: number;
  className?: string;
  barClassName?: string;
  color?: string;
}> = ({ value, className = 'h-2 bg-slate-100 dark:bg-slate-800 rounded-full', barClassName = 'bg-emerald-500 rounded-full', color }) => (
  <View style={tw.style('overflow-hidden', className)}>
    <View
      style={[
        tw.style('h-full', barClassName),
        { width: `${Math.max(0, Math.min(100, value))}%` },
        color ? { backgroundColor: color } : null,
      ]}
    />
  </View>
);
