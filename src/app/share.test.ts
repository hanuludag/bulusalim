import { describe, expect, it } from 'vitest';
import { buildDemo } from './demo';
import { computeResult } from './result';
import { firstShareText, remindText, resultText } from './share';
import { nextPlanName } from './planName';

let n = 0;
const id = () => `s${n++}`;
const L = 'http://localhost:5173/r/abc';

describe('paylaşma metinleri (§21a)', () => {
  it('ilk paylaşım', () => {
    expect(firstShareText('Cumartesi ekibi', L)).toBe(
      `Cumartesi ekibi: ne yapıyoruz, nerede, ne zaman? Fikirleri puanla, boş saatini seç. 1 dk sürüyor: ${L}`,
    );
  });
  it('hatırlat', () => {
    const s = buildDemo('eksik', '2026-11-14', id);
    expect(remindText(s, computeResult(s), L)).toBe(
      `Cumartesi ekibi: 6 kişiden 4'ü cevap verdi. Bekleniyor: Kaan, Arda. 1 dk sürüyor: ${L}`,
    );
  });
  it('sonuç', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    expect(resultText(s, computeResult(s), L)).toBe(
      `Cumartesi ekibi sonucu: Balık tutma · Moda sahili, Cmt 14 Kas öğle (13–17). 5/6 kişi geliyor. Detay: ${L}`,
    );
  });
  it('mesajlarda emoji ve ünlem yok, link en sonda', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    for (const t of [firstShareText('X', L), remindText(s, computeResult(s), L), resultText(s, computeResult(s), L)]) {
      expect(t.endsWith(L)).toBe(true);
      expect(t).not.toMatch(/!|\p{Extended_Pictographic}/u);
    }
  });
});

describe('yeni plan adı', () => {
  it('2, 3, 4… artar', () => {
    expect(nextPlanName('Cumartesi ekibi')).toBe('Cumartesi ekibi 2');
    expect(nextPlanName('Cumartesi ekibi 2')).toBe('Cumartesi ekibi 3');
    expect(nextPlanName('Cumartesi ekibi 9')).toBe('Cumartesi ekibi 10');
  });
});
