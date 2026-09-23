import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Check, ChevronRight, Plus } from 'lucide-react-native';

import { Btn, Text, palette, type TextInputHandle } from '../../design';
import { ic, tw } from '../../lib/tw';

/** Round checkbox (visual only — the whole row handles the press). */
export const RoundCheck: React.FC<{ checked: boolean; color?: string }> = ({ checked, color = palette.brandLight }) => (
  <View
    style={[
      tw`w-[26px] h-[26px] rounded-full items-center justify-center border-2`,
      checked ? { backgroundColor: color, borderColor: color } : tw`border-slate-300 dark:border-slate-600`,
    ]}
  >
    {checked ? <Check size={16} color="#fff" strokeWidth={3} /> : null}
  </View>
);

/** Trailing chevron that opens the item form (separate hit target from the row). */
export const RowChevron: React.FC<{ onPress: () => void; label?: string }> = ({ onPress, label = 'Düzenle' }) => (
  <Pressable
    onPress={onPress}
    hitSlop={10}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={tw`w-8 h-11 items-center justify-center -mr-2`}
  >
    <ChevronRight {...ic('w-5 h-5 text-slate-300 dark:text-slate-600')} />
  </Pressable>
);

/** White rounded container with dividers between children. */
export const RowGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={tw`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden`}>
      {rows.map((row, index) => (
        <View key={index}>
          {row}
          {index < rows.length - 1 ? <View style={tw`h-px bg-slate-100 dark:bg-slate-800 ml-14`} /> : null}
        </View>
      ))}
    </View>
  );
};

/**
 * Inline "capture first" bar: return key adds and keeps focus, commas add several at once.
 */
export const QuickAddBar: React.FC<{
  placeholder: string;
  onSubmit: (text: string) => void;
  inputRef?: React.RefObject<TextInputHandle | null>;
}> = ({ placeholder, onSubmit, inputRef }) => {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };
  return (
    <View style={tw`flex-row items-center gap-2`}>
      <View style={tw`flex-1 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-row items-center`}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={palette.slate400}
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={submit}
          autoCorrect
          accessibilityLabel={placeholder}
          style={tw`flex-1 text-[16px] text-slate-900 dark:text-white`}
        />
      </View>
      <Btn
        onPress={submit}
        disabled={!text.trim()}
        accessibilityLabel="Ekle"
        className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center"
      >
        <Plus size={24} color="#fff" strokeWidth={2.6} />
      </Btn>
    </View>
  );
};

/** Small section header used inside list detail ("Bugün 3"). */
export const GroupHeader: React.FC<{ left?: React.ReactNode; title: string; count?: number; tone?: 'default' | 'danger'; onPress?: () => void; right?: React.ReactNode }> = ({
  left,
  title,
  count,
  tone = 'default',
  onPress,
  right,
}) => {
  const content = (
    <>
      {left}
      <Text variant="headline" tone={tone} className="flex-1" numberOfLines={1}>
        {title}
      </Text>
      {count !== undefined ? (
        <Text variant="subhead" tone="faint" weight="semibold">
          {String(count)}
        </Text>
      ) : null}
      {right}
    </>
  );
  const cls = tw`flex-row items-center gap-2.5 px-1 min-h-[36px]`;
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={cls}>
      {content}
    </Pressable>
  ) : (
    <View style={cls}>{content}</View>
  );
};
