// "Buluşmaları dağıt" (kurucu için ek seçenek). Saf fonksiyon: sadece öneri üretir, kaydetmez.
// Kural: günü olmayan ve en az 1 onay almış fikirler (en çok onaylanan önce), en çok kişinin boş olduğu
// ve henüz kazananı olmayan gün+dilimlere sırayla yerleşir. Her zamana 1 etkinlik. Eşitlikte erken gün, sonra gündüz.
import type { Result } from './result';
import type { Idea, Slot } from './types';

export interface Assignment { idea: Idea; day: string; slot: Slot; freeCount: number }

export function distribute(r: Result): Assignment[] {
  const taken = new Set(r.plan.filter((o) => o.winner).map((o) => `${o.day}|${o.slot}`));
  const free = r.slots
    .filter((s) => s.freeCount > 0 && !taken.has(`${s.day}|${s.slot}`))
    .sort((a, b) => b.freeCount - a.freeCount); // sort kararlı: eşitlikte gün/dilim sırası korunur
  const ideas = r.general.filter((g) => g.yes >= 1); // general zaten sıralı
  return ideas.slice(0, free.length).map((g, i) => ({ idea: g.idea, day: free[i].day, slot: free[i].slot, freeCount: free[i].freeCount }));
}
