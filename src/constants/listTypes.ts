import { strings } from '../strings/tr';
import type { ListType } from '../types';

export const LIST_TYPES: ListType[] = ['SHOPPING', 'TODO', 'NOTE'];
export const typeLabels = strings.listTypes;
export const typeEmoji: Record<ListType, string> = {
  SHOPPING: '🛒',
  TODO: '✓',
  NOTE: '📝',
};
