// Demo odalarının BEKLENEN sonuçları (README'de tablo var).
import { describe, expect, it } from 'vitest';
import { buildDemo, seedDemo } from './demo';
import { computeResult } from './result';
import { createLocalStore } from './localStore';
import type { Sync } from '../core/sync';

let n = 0;
const id = () => `id${n++}`;
const START = '2026-11-14'; // Cmt
const summary = (kind: 'eksik' | 'kesin') => {
  const snap = buildDemo(kind, START, id);
  const r = computeResult(snap);
  return {
    r,
    ranking: r.ideas.map((i) => `${i.idea.name} ${i.yes}/${i.no}`),
    waiting: r.waiting.map((mid) => snap.members.find((m) => m.id === mid)?.name),
  };
};

describe('Demo (eksik)', () => {
  const { r, ranking, waiting } = summary('eksik');
  it('4/6 cevap verdi, Kaan ve Arda bekleniyor', () => {
    expect(r.voters).toHaveLength(4);
    expect(waiting).toEqual(['Kaan', 'Arda']);
    expect(r.isFinal).toBe(false);
  });
  it('kazanan ve sıralama', () => {
    expect(r.winnerIdea?.name).toBe('Balık tutma');
    expect(ranking).toEqual(['Balık tutma 3/1', 'Sinema 2/0', 'Birlikte ders çalışma 1/2', 'Halı saha 0/2']);
  });
  it('en iyi zaman: Cmt gündüz 4 kişi, herkes boş kutu yok', () => {
    expect(r.bestSlot).toEqual({ day: '2026-11-14', slot: 'gunduz', freeCount: 4 });
    expect(r.allFreeSlots).toEqual([]);
  });
});

describe('Demo (kesin)', () => {
  const { r, ranking, waiting } = summary('kesin');
  it('6/6 → kesin sonuç', () => {
    expect(waiting).toEqual([]);
    expect(r.isFinal).toBe(true);
  });
  it('kazanan ve sıralama', () => {
    expect(r.winnerIdea?.name).toBe('Balık tutma');
    expect(ranking).toEqual(['Balık tutma 4/1', 'Sinema 3/1', 'Birlikte ders çalışma 2/2', 'Halı saha 1/3']);
  });
  it('en iyi zaman: Cmt gündüz 6/6, herkes boş', () => {
    expect(r.bestSlot).toEqual({ day: '2026-11-14', slot: 'gunduz', freeCount: 6 });
    expect(r.allFreeSlots).toEqual([{ day: '2026-11-14', slot: 'gunduz' }]);
  });
});

describe('seedDemo', () => {
  it('DataStore üzerinden aynı sonucu kurar', async () => {
    localStorage.clear();
    const sync: Sync = { notify() {}, listen: () => () => {}, close() {} };
    const store = createLocalStore({ sync });
    const { roomId } = await seedDemo(store, 'kesin', START);
    const r = computeResult((await store.getRoom(roomId))!);
    expect(r.isFinal).toBe(true);
    expect(r.ideas.map((i) => `${i.idea.name} ${i.yes}/${i.no}`)[0]).toBe('Balık tutma 4/1');
    expect(r.bestSlot?.freeCount).toBe(6);
  });
});
