import { describe, expect, it } from 'vitest';
import { slotHours, slotLabel, slotLower } from './slots';

describe('dilimler', () => {
  it('etiketler', () => {
    expect(slotLabel('ogle')).toBe('Öğle');
    expect(slotLower('ogle')).toBe('öğle');
    expect(slotLower('aksam')).toBe('akşam');
    expect(slotHours('sabah')).toBe('10–13');
    expect(slotHours('aksam')).toBe('17–21');
  });
});
