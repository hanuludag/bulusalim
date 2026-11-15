import { describe, expect, it } from 'vitest';
import {
  addDays, formatAvg, formatDate, formatRatio, formatShortDay, parseDay, todayString, weekDays, withSuffix,
} from './format';

describe('formatAvg', () => {
  it('1 basamak, virgüllü', () => {
    expect(formatAvg(4.25)).toBe('4,3');
    expect(formatAvg(4)).toBe('4,0');
    expect(formatAvg(3.66666)).toBe('3,7');
  });
  it('boşsa tire', () => {
    expect(formatAvg(null)).toBe('–');
    expect(formatAvg(undefined)).toBe('–');
  });
});

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

describe('withSuffix', () => {
  it('1–10', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(withSuffix)).toEqual([
      "1'i", "2'si", "3'ü", "4'ü", "5'i", "6'sı", "7'si", "8'i", "9'u", "10'u",
    ]);
  });
  it('0, onluklar ve büyük sayılar', () => {
    expect(withSuffix(0)).toBe("0'ı");
    expect(withSuffix(20)).toBe("20'si");
    expect(withSuffix(40)).toBe("40'ı");
    expect(withSuffix(60)).toBe("60'ı");
    expect(withSuffix(100)).toBe("100'ü");
    expect(withSuffix(1000)).toBe("1000'i");
    expect(withSuffix(13)).toBe("13'ü");
  });
});
