import { describe, expect, it } from 'vitest';
import { SLOTS, slotHours, slotLabel, slotLower } from './slots';

describe('dilimler v2', () => {
  it('etiketler', () => {
    expect(SLOTS).toEqual(['gunduz', 'aksam']);
    expect(slotLabel('gunduz')).toBe('Gündüz');
    expect(slotLower('gunduz')).toBe('gündüz');
    expect(slotLower('aksam')).toBe('akşam');
    expect(slotHours('gunduz')).toBe('10–17');
    expect(slotHours('aksam')).toBe('17–21');
  });
});
