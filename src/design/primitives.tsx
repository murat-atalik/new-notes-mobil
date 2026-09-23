import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Check, ChevronDown } from 'lucide-react-native';
import { create } from 'zustand';

import { ic, tw } from '../lib/tw';

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
    hitSlop={8}
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
 * Modal wrapper for the web's `fixed inset-0 bg-black/60 ...` dialogs.
 *
 * - `sheet` (default): phone-native floating sheet anchored to the bottom, slides
 *   up, dismiss by tapping the backdrop or dragging the grab handle down.
 * - `bottom`: full-width bottom sheet (child draws its own `rounded-t-3xl` panel).
 * - `center`: centered alert-style dialog (confirmations, auth).
 */
export const Overlay: React.FC<{
  visible?: boolean;
  onClose: () => void;
  position?: 'sheet' | 'bottom' | 'center';
  overlayClassName?: string;
  dismissible?: boolean;
  children?: React.ReactNode;
}> = ({
  visible = true,
  onClose,
  position = 'sheet',
  overlayClassName = 'bg-black/60',
  dismissible = true,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const isSheet = position !== 'center';
  const backdrop = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(isSheet ? screenHeight : 24)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(offset, { toValue: 0, damping: 26, stiffness: 260, mass: 0.9, useNativeDriver: true }),
    ]).start();
  }, [visible, backdrop, offset]);

  const dismiss = () => {
    if (!dismissible || closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(offset, { toValue: isSheet ? screenHeight : 24, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => offset.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 110 || g.vy > 1.1) dismissRef.current();
        else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={tw`flex-1`}>
        <Animated.View style={[tw.style('absolute inset-0', overlayClassName), { opacity: backdrop }]}>
          <Pressable style={tw`flex-1`} onPress={dismiss} accessibilityLabel="Kapat" />
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          style={[
            tw`flex-1`,
            position === 'center' ? tw`justify-center p-4` : tw`justify-end`,
            position === 'sheet' ? { paddingHorizontal: 8, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 } : null,
            position === 'bottom' ? { paddingTop: insets.top + 12 } : null,
            position === 'center' ? { opacity: backdrop } : null,
            { transform: [{ translateY: offset }] },
          ]}
        >
          {isSheet && dismissible ? (
            <View
              {...pan.panHandlers}
              accessibilityLabel="Kapatmak için aşağı kaydırın"
              style={tw`self-center w-32 h-6 items-center justify-center`}
            >
              <View style={tw`w-10 h-1.5 rounded-full bg-white/70`} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/** Modal panel body: scrolls when taller than the screen (web `max-h-[90vh] overflow-y-auto`). */
export const Panel: React.FC<ClassProps & { children?: React.ReactNode; maxHeight?: number }> = ({
  className = '',
  style,
  maxHeight = 0.9,
  children,
}) => (
  <View style={[tw.style(className), { maxHeight: `${maxHeight * 100}%` }, style]}>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  </View>
);

/** <input>/<textarea> with themed text and placeholder colors. */
export const Input = ({
  className = '',
  style,
  multiline,
  ref,
  ...rest
}: TextInputProps & { className?: string; ref?: React.Ref<React.ComponentRef<typeof TextInput>> }) => (
    <TextInput
      ref={ref}
      placeholderTextColor={tw.color('slate-400')}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      autoCorrect={false}
      {...rest}
      style={[tw.style('text-slate-900 dark:text-slate-100', className), style]}
    />
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
          <SelectSheet>
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
          </SelectSheet>
        </Overlay>
      )}
    </>
  );
};

const SelectSheet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[tw`bg-white dark:bg-slate-900 rounded-t-3xl pt-8 max-h-[75%]`, { paddingBottom: insets.bottom + 12 }]}>
      {children}
    </View>
  );
};

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const pad2 = (n: number) => String(n).padStart(2, '0');

function parseIso(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, d || 1);
}

/**
 * <input type="date"> / type="month" replacement with the native date picker.
 * Value format stays `YYYY-MM-DD` (or `YYYY-MM` for `mode="month"`) like the web.
 */
export const DateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  mode?: 'date' | 'month';
}> = ({ value, onChange, className = '', placeholder, mode = 'date' }) => {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseIso(value));

  const toValue = (date: Date) =>
    mode === 'month'
      ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
      : `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const label = (() => {
    if (!value) return placeholder ?? (mode === 'month' ? 'Ay seçin' : 'Tarih seçin');
    const date = parseIso(value);
    return mode === 'month'
      ? `${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`
      : `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
  })();

  const open = () => {
    const current = parseIso(value);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toValue(date));
        },
      });
      return;
    }
    setDraft(current);
    setIosOpen(true);
  };

  return (
    <>
      <Btn onPress={open} className={`flex-row items-center justify-between gap-2 ${className}`}>
        <Text className={`text-[15px] flex-1 ${value ? '' : 'text-slate-400'}`} numberOfLines={1}>
          {label}
        </Text>
        <Calendar {...ic('w-4 h-4 text-slate-400')} />
      </Btn>
      {iosOpen && (
        <Overlay onClose={() => setIosOpen(false)}>
          <View style={tw`bg-white dark:bg-slate-900 rounded-3xl p-4 pt-7`}>
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              locale="tr-TR"
              accentColor="#059669"
              themeVariant={tw.isDark() ? 'dark' : 'light'}
              onChange={(_event, date) => date && setDraft(date)}
            />
            <View style={tw`flex-row gap-2 mt-2`}>
              <Btn onPress={() => setIosOpen(false)} className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center">
                <Text className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">Vazgeç</Text>
              </Btn>
              <Btn
                onPress={() => {
                  onChange(toValue(draft));
                  setIosOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 items-center"
              >
                <Text className="text-[15px] font-bold text-white">Tamam</Text>
              </Btn>
            </View>
          </View>
        </Overlay>
      )}
    </>
  );
};

type ToastTone = 'success' | 'info' | 'error';
const toastStore = create<{ message: string | null; tone: ToastTone; seq: number }>(() => ({
  message: null,
  tone: 'success',
  seq: 0,
}));

/** Non-blocking toast (web `fixed top-20` notifications). Render `<ToastHost />` once at the root. */
export function showToast(message: string, tone: ToastTone = 'success', durationMs = 3200) {
  const seq = toastStore.getState().seq + 1;
  toastStore.setState({ message, tone, seq });
  setTimeout(() => {
    if (toastStore.getState().seq === seq) toastStore.setState({ message: null });
  }, durationMs);
}

export const ToastHost: React.FC = () => {
  const { message, tone } = toastStore();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (message) setShown(message);
    Animated.timing(opacity, { toValue: message ? 1 : 0, duration: 180, useNativeDriver: true }).start(() => {
      if (!message) setShown(null);
    });
  }, [message, opacity]);

  if (!shown) return null;
  const toneCls =
    tone === 'error' ? 'bg-rose-600 border-rose-400/40' : tone === 'info' ? 'bg-slate-900 border-slate-700' : 'bg-indigo-600 border-indigo-400/40';
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[tw`absolute left-4 right-4 z-50 items-center`, { top: insets.top + 8, opacity }]}
    >
      <Pressable
        onPress={() => toastStore.setState({ message: null })}
        style={tw.style('max-w-md w-full px-4 py-3 rounded-2xl shadow-2xl border flex-row items-center gap-2.5', toneCls)}
      >
        <Check {...ic('w-4 h-4 text-emerald-300')} />
        <Text className="flex-1 text-[13px] font-semibold text-white">{shown}</Text>
      </Pressable>
    </Animated.View>
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
