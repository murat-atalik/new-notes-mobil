import { ListChecks, ShoppingCart, StickyNote, type LucideIcon } from 'lucide-react-native';

import type { ListType } from '../../types';

/** Per-type labels, icons and defaults for the Lists screens. */
export const LIST_TYPE_META: Record<
  ListType,
  { label: string; singular: string; icon: LucideIcon; defaultIcon: string; emptyTitle: string; emptyMessage: string }
> = {
  SHOPPING: {
    label: 'Alışveriş',
    singular: 'Alışveriş listesi',
    icon: ShoppingCart,
    defaultIcon: 'ShoppingCart',
    emptyTitle: 'Alışveriş listen yok',
    emptyMessage: 'Market, pazar ya da ev ihtiyaçları için bir liste oluştur, ailecek birlikte doldurun.',
  },
  TODO: {
    label: 'Görevler',
    singular: 'Görev listesi',
    icon: ListChecks,
    defaultIcon: 'ListTodo',
    emptyTitle: 'Görev listen yok',
    emptyMessage: 'Yapılacakları tek yerde topla, son tarih ver ve aile üyelerine ata.',
  },
  NOTE: {
    label: 'Notlar',
    singular: 'Not defteri',
    icon: StickyNote,
    defaultIcon: 'StickyNote',
    emptyTitle: 'Not defterin yok',
    emptyMessage: 'Tarifler, fikirler ve önemli bilgiler için bir not defteri oluştur.',
  },
};

export const LIST_TYPES: ListType[] = ['SHOPPING', 'TODO', 'NOTE'];

/** Lucide icon names offered in the list form, per type. */
export const LIST_ICONS: Record<ListType, string[]> = {
  SHOPPING: ['ShoppingCart', 'ShoppingBasket', 'ShoppingBag', 'Apple', 'Carrot', 'Beef', 'Milk', 'Coffee', 'Baby', 'PawPrint', 'Pill', 'Gift', 'House', 'Package'],
  TODO: ['ListTodo', 'SquareCheckBig', 'ClipboardList', 'Briefcase', 'Hammer', 'Wrench', 'House', 'Plane', 'Calendar', 'Dumbbell', 'BookOpen', 'Heart', 'Star'],
  NOTE: ['StickyNote', 'NotebookPen', 'FileText', 'Lightbulb', 'BookOpen', 'Bookmark', 'PenLine', 'Utensils', 'Film', 'Music', 'Lock', 'Heart', 'Star'],
};
