// "Günlere dağıt" otomatik önerisi (kurucu için). Saf fonksiyon: sadece öneri üretir, kaydetmez.
// Kural: onay almış fikirler (en çok onaylanan önce), en çok kişinin boş olduğu ve dolu olmayan
// gün+dilimlere sırayla yerleşir. Her zamana 1 etkinlik. Eşitlikte erken gün, sonra gündüz.
import type { IdeaResult, Result } from './result';
import type { Idea, Slot } from './types';

export interface Assignment { idea: Idea; day: string; slot: Slot; freeCount: number }

/**
 * @param candidates yerleştirilecek fikirler (varsayılan: henüz zamanı olmayanlar)
 * @param alsoTaken  ayrıca dolu sayılacak zamanlar ("YYYY-MM-DD|slot"), ör. taslakta seçilenler
 */
export function distribute(r: Result, candidates: IdeaResult[] = r.general, alsoTaken: Iterable<string> = []): Assignment[] {
  const taken = new Set([...r.plan.filter((o) => o.winner).map((o) => `${o.day}|${o.slot}`), ...alsoTaken]);
  const free = r.slots
    .filter((s) => s.freeCount > 0 && !taken.has(`${s.day}|${s.slot}`))
    .sort((a, b) => b.freeCount - a.freeCount); // sort kararlı: eşitlikte gün/dilim sırası korunur
  const ideas = candidates.filter((g) => g.yes >= 1);
  return ideas.slice(0, free.length).map((g, i) => ({ idea: g.idea, day: free[i].day, slot: free[i].slot, freeCount: free[i].freeCount }));
}
