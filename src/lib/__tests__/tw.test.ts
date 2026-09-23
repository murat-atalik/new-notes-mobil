jest.mock('react-native', () => ({
  Platform: { OS: 'ios', constants: { reactNativeVersion: { major: 0, minor: 87, patch: 1 } } },
  useColorScheme: () => 'light',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}));

import { clean, ic, tw } from '../tw';

describe('tw', () => {
  it('drops web-only utilities', () => {
    expect(
      clean('flex items-center hover:bg-slate-100 transition active:scale-95 backdrop-blur-md bg-gradient-to-br from-emerald-500 to-teal-600 truncate grid grid-cols-2 space-y-2 shadow-2xs'),
    ).toBe('flex items-center shadow-sm');
  });

  it('keeps responsive reveal as flex', () => {
    expect(clean('hidden sm:inline')).toBe('hidden sm:flex');
  });

  it('resolves dark variants after scheme switch', () => {
    tw.setColorScheme('light');
    expect(tw`bg-white dark:bg-slate-900`.backgroundColor).toBe('#fff');
    tw.setColorScheme('dark');
    expect(tw`bg-white dark:bg-slate-900`.backgroundColor).toBe('#0f172a');
    tw.setColorScheme('light');
  });

  it('parses alpha, arbitrary values and shadows', () => {
    const style = tw`bg-white/95 text-[10px] min-w-[17px] rounded-2xl shadow-sm`;
    expect(style.fontSize).toBe(10);
    expect(style.minWidth).toBe(17);
    expect(style.borderRadius).toBe(16);
  });

  it('ic() maps icon classes to lucide props', () => {
    expect(ic('w-4 h-4 text-emerald-600')).toEqual({ size: 16, color: '#059669' });
  });
});
