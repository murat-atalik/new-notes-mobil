import { CheckSquare, ShoppingCart, StickyNote } from 'lucide-react-native';

import type { SegmentOption } from '../../design';
import type { ListType } from '../../types';

export const LIST_TYPE_OPTIONS: SegmentOption<ListType>[] = [
  { value: 'SHOPPING', label: 'Alışveriş', icon: ShoppingCart },
  { value: 'TODO', label: 'Görevler', icon: CheckSquare },
  { value: 'NOTE', label: 'Notlar', icon: StickyNote },
];

export const LIST_TYPE_LABEL: Record<ListType, string> = { SHOPPING: 'Alışveriş', TODO: 'Görevler', NOTE: 'Notlar' };
