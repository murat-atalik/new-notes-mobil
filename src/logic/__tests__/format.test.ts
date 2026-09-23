import { daysFromToday, formatDay, formatMoney, formatMonth, isoDate, parseAmount, shiftMonth } from '../format';

describe('format', () => {
  it('formats Turkish money', () => {
    expect(formatMoney(1234.5)).toBe('₺1.234,50');
    expect(formatMoney(1500)).toBe('₺1.500');
    expect(formatMoney(-20, 'EUR')).toBe('-€20');
  });

  it('parses user typed amounts', () => {
    expect(parseAmount('1.234,5')).toBe(1234.5);
    expect(parseAmount('1234.5')).toBe(1234.5);
    expect(parseAmount('12,75')).toBe(12.75);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });

  it('handles months', () => {
    expect(formatMonth('2026-09')).toBe('Eylül 2026');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('describes relative days', () => {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    expect(formatDay(isoDate(today))).toBe('Bugün');
    expect(formatDay(isoDate(tomorrow))).toBe('Yarın');
    expect(daysFromToday(isoDate(tomorrow))).toBe(1);
    expect(formatDay(undefined)).toBe('');
  });
});
