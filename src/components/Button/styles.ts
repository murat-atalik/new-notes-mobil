import { StyleSheet } from 'react-native';

import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  buttonSmall: { borderRadius: 10, minHeight: 38, paddingHorizontal: 13, paddingVertical: 8 },
  buttonSecondary: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  buttonDanger: { backgroundColor: colors.dangerSurface },
  buttonText: { color: colors.onPrimary, fontWeight: '800' },
  buttonTextDark: { color: colors.dangerText },
});
