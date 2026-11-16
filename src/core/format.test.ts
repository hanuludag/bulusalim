import { describe, expect, it } from 'vitest';
import {
  addDays, formatDate, formatRatio, formatShortDay, parseDay, todayString, weekDays,
} from './format';

describe('tarih', () => {
  it('yerel saatle parçalar (UTC kayması yok)', () => {
    const d = parseDay('2026-11-17');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(17);
  });
  it('"Cmt 15 Kas" biçimi', () => {
    expect(formatDate('2026-11-14')).toBe('Cmt 14 Kas');
    expect(formatDate('2026-11-15')).toBe('Paz 15 Kas');
    expect(formatDate('2026-11-19')).toBe('Per 19 Kas');
    expect(formatDate('2026-11-18')).toBe('Çar 18 Kas');
  });
  it('kısa gün', () => {
    expect(formatShortDay('2026-11-14')).toBe('Cmt');
    expect(formatShortDay('2026-11-16')).toBe('Pzt');
  });
  it('ay ve yıl geçişi', () => {
    expect(addDays('2026-12-29', 5)).toBe('2027-01-03');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('7 gün', () => {
    const w = weekDays('2026-11-14');
    expect(w).toHaveLength(7);
    expect(w[0]).toBe('2026-11-14');
    expect(w[6]).toBe('2026-11-20');
  });
  it('bugün', () => {
    expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('formatRatio', () => {
  it('x/y', () => expect(formatRatio(4, 6)).toBe('4/6'));
});
