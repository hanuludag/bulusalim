import { describe, expect, it } from 'vitest';
import { cleanName, findByName, initial, normalizeName, sameName } from './names';

describe('isimler', () => {
  it('Türkçe İ/ı kuralları', () => {
    expect(sameName('İLKER', 'ilker')).toBe(true);
    expect(sameName('Işık', 'ışık')).toBe(true);
    expect(sameName('IŞIK', 'ışık')).toBe(true);
    expect(sameName('Işık', 'isik')).toBe(false);
  });
  it('boşlukları toplar', () => {
    expect(normalizeName('  Kaan   Yılmaz ')).toBe('kaan yılmaz');
    expect(cleanName('  Kaan   Yılmaz ')).toBe('Kaan Yılmaz');
    expect(sameName('balık  tutma', 'Balık Tutma')).toBe(true);
  });
  it('listede bulur', () => {
    const list = [{ name: 'Emirhan' }, { name: 'İlker' }];
    expect(findByName(list, 'ilker')).toBe(list[1]);
    expect(findByName(list, 'Mert')).toBeUndefined();
  });
  it('baş harf', () => {
    expect(initial('ilker')).toBe('İ');
    expect(initial('ışık')).toBe('I');
  });
});
