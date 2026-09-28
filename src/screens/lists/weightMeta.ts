import { Scale } from 'lucide-react-native';

/**
 * Metadata for the Weight (Kilo Takibi) list type. Kept separate from `LIST_TYPE_META` in
 * `listMeta.ts`, which stays exhaustive over the narrow `ListType` (Categories and
 * Templates don't apply to weight tracking).
 */
export const WEIGHT_META = {
  label: 'Kilo Takibi',
  singular: 'Kilo takibi',
  icon: Scale,
  defaultIcon: 'Scale',
  color: '#ec4899',
  emptyTitle: 'Henüz ölçüm eklemedin',
  emptyMessage: 'Tarih ve kilonu ekle; bir önceki ölçüme göre farkı otomatik göreceksin.',
};

export const WEIGHT_ICONS: string[] = ['Scale', 'Activity', 'HeartPulse', 'TrendingDown', 'TrendingUp', 'Dumbbell', 'Footprints', 'Salad'];
