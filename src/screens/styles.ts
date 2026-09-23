import { StyleSheet } from 'react-native';

import { colors } from '../constants/colors';

export const styles = StyleSheet.create({
  safeScreen: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 20 },
  content: { padding: 20, gap: 14, backgroundColor: colors.background, flexGrow: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorCard: {
    margin: 20,
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  errorTitle: { color: colors.dangerText, fontSize: 18, fontWeight: '800' },
  errorText: { color: colors.dangerText, fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  lead: { color: colors.muted, fontSize: 14 },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: colors.ink,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
});
