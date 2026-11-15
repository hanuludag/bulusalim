// Demo odalarının BEKLENEN sonuçları. Elle hesaplayıp kontrol edebilirsin (README'de tablo var).
import { describe, expect, it } from 'vitest';
import { buildDemo } from './demo';
import { computeResult } from './result';
import { formatAvg } from '../core/format';

let n = 0;
const id = () => `id${n++}`;
const START = '2026-11-14'; // Cmt

function summary(kind: 'eksik' | 'kesin') {
  const snap = buildDemo(kind, START, id);
  const r = computeResult(snap);
  const nameOf = (mid: string) => snap.members.find((m) => m.id === mid)?.name;
  return {
    snap,
    r,
    ranking: r.ideas.map((i) => `${i.idea.name} ${formatAvg(i.avg)}${i.eliminated ? ' (elendi)' : ''}`),
    waiting: r.waiting.map(nameOf),
    vetoedBy: r.ideas.filter((i) => i.eliminated).map((i) => i.vetoedBy.map(nameOf)),
  };
}

describe('Demo (eksik)', () => {
  const { r, ranking, waiting, vetoedBy } = summary('eksik');
  it('6 kişiden 4ü cevap verdi, Kaan ve Arda bekleniyor', () => {
    expect(r.totalMembers).toBe(6);
    expect(r.voters).toHaveLength(4);
    expect(waiting).toEqual(['Kaan', 'Arda']);
    expect(r.isFinal).toBe(false);
  });
  it('kazanan ve sıralama', () => {
    expect(r.winnerIdea?.name).toBe('Balık tutma');
    expect(ranking).toEqual([
      'Balık tutma 4,5',
      'Sinema 3,8',
      'Birlikte ders çalışma 3,0',
      'Bowling 3,0',
      'Halı saha 3,0 (elendi)',
    ]);
    expect(vetoedBy).toEqual([['Mert']]);
  });
  it('en iyi zaman: Cmt öğle 4/4', () => {
    expect(r.bestSlot).toEqual({ day: '2026-11-14', slot: 'ogle', freeCount: 4 });
    expect(r.topSlots).toEqual([
      { day: '2026-11-14', slot: 'ogle', freeCount: 4 },
      { day: '2026-11-14', slot: 'aksam', freeCount: 3 },
      { day: '2026-11-15', slot: 'ogle', freeCount: 3 },
    ]);
  });
  it('katılım 3/6 (Kaan geliyorum dedi ama cevap saymadı)', () => {
    expect(r.attendance).toEqual({ yes: 3, no: 1, undecided: 2 });
  });
});

describe('Demo (kesin)', () => {
  const { snap, r, ranking, waiting } = summary('kesin');
  it('herkes cevap verdi → kesin sonuç', () => {
    expect(r.voters).toHaveLength(6);
    expect(waiting).toEqual([]);
    expect(r.isFinal).toBe(true);
  });
  it('kazanan Balık tutma 4,3; sıralama', () => {
    expect(r.winnerIdea?.name).toBe('Balık tutma');
    expect(ranking).toEqual([
      'Balık tutma 4,3',
      'Sinema 3,7',
      'Birlikte ders çalışma 3,2',
      'Bowling 2,6',
      'Halı saha 3,5 (elendi)',
    ]);
  });
  it('en iyi zaman: Cmt öğle 5/6', () => {
    expect(r.bestSlot).toEqual({ day: '2026-11-14', slot: 'ogle', freeCount: 5 });
    expect(r.topSlots.map((t) => `${t.day} ${t.slot} ${t.freeCount}`)).toEqual([
      '2026-11-14 ogle 5', '2026-11-14 aksam 4', '2026-11-15 ogle 4',
    ]);
  });
  it('katılım 5/6, getirilecekler hazır', () => {
    expect(r.attendance.yes).toBe(5);
    expect(snap.items.map((i) => i.name)).toEqual(['Olta', 'Yem', 'Sandalye', 'Su']);
    expect(snap.room.itemsSeeded).toBe(true);
  });
});
