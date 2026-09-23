import { StyleSheet } from 'react-native';

import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySurface,
  },
  icon: { fontSize: 21, color: colors.primaryDark },
  headingText: { flex: 1, gap: 4 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
