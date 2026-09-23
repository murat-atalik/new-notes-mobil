/** Template icons are lucide names (web-compatible); anything else is treated as an emoji. */
export function templateTileProps(icon: string | undefined): { icon?: string; emoji?: string } {
  if (!icon) return { icon: 'LayoutTemplate' };
  return /^[A-Z][A-Za-z0-9]+$/.test(icon) ? { icon } : { emoji: icon };
}

export const TEMPLATE_ICONS = [
  'ShoppingCart', 'ShoppingBag', 'Apple', 'Coffee', 'Utensils', 'Baby', 'PawPrint', 'Gift', 'Sparkles', 'Home',
  'CheckSquare', 'Briefcase', 'Plane', 'Car', 'Dumbbell', 'Calendar', 'StickyNote', 'Lightbulb', 'BookOpen', 'Star',
];
