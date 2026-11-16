import { describe, expect, it } from 'vitest';
import { computeResult } from './result';
import { distribute } from './distribute';
import { addIdea, free, makeSnap, vote } from './testHelpers';

describe('buluşmaları dağıt', () => {
  it('en çok onaylanan → en çok kişinin boş olduğu zamana; kazananı olan zaman atlanır; onaysız fikir dağıtılmaz', () => {
    const s = makeSnap(['A', 'B', 'C']);
    addIdea(s, 'balik', 1);
    addIdea(s, 'sinema', 2);
    addIdea(s, 'onaysiz', 3);
    const dolu = addIdea(s, 'dolu', 4);
    dolu.day = '2026-11-14'; dolu.slot = 'gunduz';
    vote(s, 'm0', 'balik', 'yes'); vote(s, 'm1', 'balik', 'yes');
    vote(s, 'm0', 'sinema', 'yes');
    vote(s, 'm0', 'dolu', 'yes');
    // 14 gündüz: 3 kişi ama dolu · 15 akşam: 2 kişi · 16 gündüz: 2 kişi · 17 akşam: 1 kişi
    ['m0', 'm1', 'm2'].forEach((m) => free(s, m, '2026-11-14', 'gunduz'));
    ['m0', 'm1'].forEach((m) => free(s, m, '2026-11-15', 'aksam'));
    ['m1', 'm2'].forEach((m) => free(s, m, '2026-11-16', 'gunduz'));
    free(s, 'm2', '2026-11-17', 'aksam');
    const a = distribute(computeResult(s));
    expect(a.map((x) => [x.idea.id, x.day, x.slot, x.freeCount])).toEqual([
      ['balik', '2026-11-15', 'aksam', 2],
      ['sinema', '2026-11-16', 'gunduz', 2], // eşitlikte erken gün
    ]);
  });

  it('boş zaman yoksa öneri yok', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'x', 1);
    vote(s, 'm0', 'x', 'yes');
    expect(distribute(computeResult(s))).toEqual([]);
  });
});
