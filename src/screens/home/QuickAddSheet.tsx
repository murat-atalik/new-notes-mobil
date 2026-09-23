import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, CheckSquare, KeyRound, ListPlus, type LucideIcon, Receipt, ShoppingCart, StickyNote } from 'lucide-react-native';

import { IconTile, ListGroup, palette, Row, Sheet, Text } from '../../design';
import { useMyLists } from '../../logic/selectors';
import { tw } from '../../lib/tw';
import { useAppNavigation } from '../../navigation/types';
import type { AppList, ListType } from '../../types';

type Tile = { key: string; label: string; icon: LucideIcon; color: string; onPress: () => void };

const PICK_TITLES: Record<ListType, string> = {
  SHOPPING: 'Hangi alışveriş listesine?',
  TODO: 'Hangi görev listesine?',
  NOTE: 'Hangi not listesine?',
};

/** Opened by the tab bar "+": one tap to the most common capture flows. */
export const QuickAddSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const navigation = useAppNavigation();
  const lists = useMyLists();
  const [picking, setPicking] = useState<ListType | null>(null);

  const close = () => {
    setPicking(null);
    onClose();
  };

  /** Close first, then navigate once the sheet has unmounted. */
  const go = (fn: () => void) => {
    close();
    setTimeout(fn, 200);
  };

  const openItem = (list: AppList) =>
    go(() => (list.type === 'NOTE' ? navigation.navigate('NoteEditor', { listId: list.id }) : navigation.navigate('ItemForm', { listId: list.id })));

  const addTo = (type: ListType) => {
    const candidates = lists.filter((l) => l.type === type);
    if (candidates.length === 0) go(() => navigation.navigate('ListForm', { type }));
    else if (candidates.length === 1) openItem(candidates[0]);
    else setPicking(type);
  };

  const tiles: Tile[] = [
    { key: 'expense', label: 'Harcama', icon: Receipt, color: palette.warning, onPress: () => go(() => navigation.navigate('ExpenseForm')) },
    { key: 'shopping', label: 'Alışveriş Ürünü', icon: ShoppingCart, color: palette.brandLight, onPress: () => addTo('SHOPPING') },
    { key: 'todo', label: 'Görev', icon: CheckSquare, color: palette.info, onPress: () => addTo('TODO') },
    { key: 'note', label: 'Not', icon: StickyNote, color: '#f59e0b', onPress: () => addTo('NOTE') },
    { key: 'list', label: 'Yeni Liste', icon: ListPlus, color: '#8b5cf6', onPress: () => go(() => navigation.navigate('ListForm', {})) },
    { key: 'join', label: 'Kodla Katıl', icon: KeyRound, color: '#0ea5e9', onPress: () => go(() => navigation.navigate('JoinList')) },
  ];

  return (
    <Sheet visible={visible} onClose={close} title={picking ? PICK_TITLES[picking] : 'Hızlı Ekle'}>
      {picking ? (
        <View style={tw`gap-3`}>
          <Pressable onPress={() => setPicking(null)} accessibilityRole="button" hitSlop={8} style={tw`flex-row items-center gap-1 self-start`}>
            <ChevronLeft size={18} color={palette.brand} />
            <Text variant="subhead" tone="brand" weight="semibold">
              Geri
            </Text>
          </Pressable>
          <ListGroup>
            {lists
              .filter((l) => l.type === picking)
              .map((l) => (
                <Row key={l.id} icon={l.icon} iconColor={l.color} title={l.title} onPress={() => openItem(l)} />
              ))}
          </ListGroup>
        </View>
      ) : (
        <View style={tw`flex-row flex-wrap -mx-1.5`}>
          {tiles.map((t) => (
            <View key={t.key} style={tw`w-1/2 p-1.5`}>
              <Pressable
                onPress={t.onPress}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                style={({ pressed }) => [
                  tw`h-28 rounded-3xl p-4 justify-between bg-slate-100 dark:bg-slate-800`,
                  pressed ? { opacity: 0.85, transform: [{ scale: 0.97 }] } : null,
                ]}
              >
                <IconTile icon={t.icon} color={t.color} solid />
                <Text variant="headline" numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Sheet>
  );
};
