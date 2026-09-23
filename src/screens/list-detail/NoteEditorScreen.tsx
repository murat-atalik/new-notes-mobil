import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileQuestion, Pin, PinOff } from 'lucide-react-native';

import { ChipRow, EmptyState, IconButton, ModalHeaderSafeArea, Text, confirmAction, palette, showToast } from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useAccessibleList, useCategoriesFor } from './helpers';

export const NoteEditorScreen: React.FC<RootScreenProps<'NoteEditor'>> = ({ navigation, route }) => {
  const { listId, itemId } = route.params;
  const insets = useSafeAreaInsets();
  const list = useAccessibleList(listId);
  const note = useAppStore((s) => (itemId ? s.items.find((i) => i.id === itemId) : undefined));
  const categories = useCategoriesFor('NOTE');
  const addItem = useAppStore((s) => s.addItem);
  const updateItem = useAppStore((s) => s.updateItem);

  const initial = {
    title: note?.title ?? '',
    content: note?.content ?? '',
    isPinned: !!note?.isPinned,
    categoryId: note?.categoryId ?? categories[0]?.id ?? '',
  };
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [isPinned, setPinned] = useState(initial.isPinned);
  const [categoryId, setCategoryId] = useState(initial.categoryId);

  if (!list || (itemId && !note)) {
    return (
      <View style={tw`flex-1 bg-slate-100 dark:bg-slate-950`}>
        <ModalHeaderSafeArea />
        <EmptyState
          icon={FileQuestion}
          title="Not bulunamadı"
          message="Bu not silinmiş olabilir ya da erişim izniniz yok."
          action={{ label: 'Kapat', onPress: () => navigation.goBack() }}
        />
      </View>
    );
  }

  const dirty =
    title !== initial.title || content !== initial.content || isPinned !== initial.isPinned || categoryId !== initial.categoryId;
  const canSave = (title.trim() || content.trim()).length > 0;

  const cancel = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    confirmAction({
      title: 'Değişiklikler kaydedilmedi',
      message: 'Çıkarsanız yaptığınız değişiklikler kaybolacak.',
      confirmText: 'Vazgeç ve çık',
      destructive: false,
      onConfirm: () => navigation.goBack(),
    });
  };

  const save = () => {
    if (!canSave) return;
    // Untitled notes take their first line as title.
    const finalTitle = title.trim() || content.trim().split('\n')[0].slice(0, 60);
    const fields = { title: finalTitle, content, isPinned, categoryId };
    if (note) {
      updateItem(note.id, fields);
    } else {
      addItem({ listId: list.id, isCompleted: false, price: 0, quantity: 1, unit: 'adet', ...fields });
      showToast('Not kaydedildi');
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-white dark:bg-slate-950`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeaderSafeArea>
      <View style={tw`flex-row items-center px-4 pt-3 pb-2`}>
        <Pressable hitSlop={10} onPress={cancel} style={tw`w-20`} accessibilityRole="button">
          <Text variant="callout" tone="brand">
            Vazgeç
          </Text>
        </Pressable>
        <View style={tw`flex-1 items-center`}>
          <IconButton
            icon={isPinned ? PinOff : Pin}
            label={isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
            variant="plain"
            color={isPinned ? palette.warning : undefined}
            onPress={() => setPinned((p) => !p)}
          />
        </View>
        <View style={tw`w-20 items-end`}>
          <Pressable hitSlop={10} disabled={!canSave} onPress={save} accessibilityRole="button">
            <Text variant="callout" weight="bold" tone={canSave ? 'brand' : 'faint'}>
              Kaydet
            </Text>
          </Pressable>
        </View>
      </View>
      </ModalHeaderSafeArea>

      <View style={[tw`flex-1 px-5 pt-2 gap-3`, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Başlık"
          placeholderTextColor={palette.slate400}
          autoFocus={!note}
          returnKeyType="next"
          accessibilityLabel="Başlık"
          style={tw`text-[24px] leading-[30px] font-extrabold text-slate-900 dark:text-white py-1`}
        />
        {categories.length ? (
          <ChipRow
            options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        ) : null}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Notunuzu yazın…"
          placeholderTextColor={palette.slate400}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Not içeriği"
          scrollEnabled
          style={tw`flex-1 text-[17px] leading-[26px] text-slate-900 dark:text-white pt-0`}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
