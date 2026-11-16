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
    expect(firstShareText('Buluşma', L)).toBe(`*Buluşma*\nNe yapıyoruz, nerede, ne zaman? Fikirleri onayla, boş zamanını seç. 1 dk sürüyor.\n\n${L}`);
  });
  it('hatırlat', () => {
    const s = buildDemo('eksik', '2026-11-14', id);
    expect(remindText(s, computeResult(s), L)).toBe(`*Cumartesi ekibi*\n4/6 kişi cevap verdi. Bekleniyor: Kaan, Arda. 1 dk sürüyor.\n\n${L}`);
  });
  it('sonuç (tam)', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    expect(resultText(s, computeResult(s), L)).toBe(`*Cumartesi ekibi* sonucu\nBalık tutma · Moda sahili\nCmt 14 Kas gündüz (10–17)\n\nDetay: ${L}`);
  });
  it('sonuç: eksik parçalar atlanır', () => {
    const s = makeSnap(['A']);
    expect(resultText(s, computeResult(s), L)).toBe(`*Oda* sonucu\n\nDetay: ${L}`);
    s.availability.push({ roomId: 'r', memberId: 'm0', day: '2026-11-14', slot: 'aksam' });
    expect(resultText(s, computeResult(s), L)).toBe(`*Oda* sonucu\nCmt 14 Kas akşam (17–21)\n\nDetay: ${L}`);
  });
  it('emoji ve ünlem yok, link sonda', () => {
    const s = buildDemo('kesin', '2026-11-14', id);
    for (const t of [firstShareText('X', L), remindText(s, computeResult(s), L), resultText(s, computeResult(s), L)]) {
      expect(t.endsWith(L)).toBe(true);
      expect(t).not.toMatch(/!|\p{Extended_Pictographic}/u);
    }
  });
});
