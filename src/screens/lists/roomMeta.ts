import { Home } from 'lucide-react-native';

/**
 * Metadata for the Room (Oda) list type. Kept separate from `LIST_TYPE_META` in
 * `listMeta.ts`, which stays exhaustive over the narrow `ListType` (Categories and
 * Templates don't apply to Rooms).
 */
export const ROOM_META = {
  label: 'Odalar',
  singular: 'Oda',
  icon: Home,
  defaultIcon: 'Home',
  emptyTitle: 'Henüz oda eklemedin',
  emptyMessage: 'Salon, yatak odası gibi odalar oluştur; her biri için alınacak ürünleri ve bütçeni takip et.',
};

export const ROOM_ICONS: string[] = [
  'Home',
  'Sofa',
  'BedDouble',
  'UtensilsCrossed',
  'Bath',
  'Baby',
  'DoorOpen',
  'Briefcase',
  'Warehouse',
  'TreePine',
  'Car',
  'Building2',
];
