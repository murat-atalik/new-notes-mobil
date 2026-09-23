import { StyleSheet } from 'react-native';

import { colors } from '../constants/colors';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 20 },
  content: { padding: 20, gap: 14, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  lead: { color: colors.muted, fontSize: 14 },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: colors.ink,
  },
});
