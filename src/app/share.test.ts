import { describe, expect, it } from 'vitest';
import { buildDemo } from './demo';
import { computeResult } from './result';
import { firstShareText, remindText, resultText } from './share';
import { makeSnap } from './testHelpers';

let n = 0;
const id = () => `s${n++}`;
const L = 'http://localhost:5173/r/abc';

describe('paylaşma metinleri v2', () => {
  it('ilk paylaşım', () => {
    expect(firstShareText('Buluşma', L)).toBe(`Buluşma: ne yapıyoruz, nerede, ne zaman? Fikirleri onayla, boş zamanını seç. 1 dk sürüyor: ${L}`);
  });
  it('hatırlat', () => {
    const s = buildDemo('eksik', '2026-11-14', id);
    expect(remindText(s, computeResult(s), L)).toBe(`Cumartesi ekibi: 4/6 cevap verdi. Bekleniyor: Kaan, Arda. 1 dk sürüyor: ${L}`);
  });
  it('sonuç (tam)', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    expect(resultText(s, computeResult(s), L)).toBe(`Cumartesi ekibi sonucu: Balık tutma · Moda sahili, Cmt 14 Kas gündüz (10–17). Detay: ${L}`);
  });
  it('sonuç: eksik parçalar atlanır', () => {
    const s = makeSnap(['A']);
    expect(resultText(s, computeResult(s), L)).toBe(`Oda sonucu: Detay: ${L}`);
    s.availability.push({ roomId: 'r', memberId: 'm0', day: '2026-11-14', slot: 'aksam' });
    expect(resultText(s, computeResult(s), L)).toBe(`Oda sonucu: Cmt 14 Kas akşam (17–21). Detay: ${L}`);
  });
  it('emoji ve ünlem yok, link sonda', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    for (const t of [firstShareText('X', L), remindText(s, computeResult(s), L), resultText(s, computeResult(s), L)]) {
      expect(t.endsWith(L)).toBe(true);
      expect(t).not.toMatch(/!|\p{Extended_Pictographic}/u);
    }
  });
});
