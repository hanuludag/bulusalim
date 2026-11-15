import { describe, expect, it } from 'vitest';
import { computeResult } from './result';
import { addIdea, free, makeSnap, rate } from './testHelpers';

describe('computeResult', () => {
  it('boş oda', () => {
    const r = computeResult(makeSnap([]));
    expect(r.totalMembers).toBe(0);
    expect(r.isFinal).toBe(false);
    expect(r.winnerIdea).toBeNull();
    expect(r.bestSlot).toBeNull();
    expect(r.topSlots).toEqual([]);
    expect(r.slots).toHaveLength(21);
  });

  it('tek kişi, cevap verince kesin', () => {
    const s = makeSnap(['Emirhan']);
    addIdea(s, 'a', 1);
    expect(computeResult(s).isFinal).toBe(false);
    rate(s, 'm0', 'a', 4);
    const r = computeResult(s);
    expect(r.isFinal).toBe(true);
    expect(r.winnerIdea?.id).toBe('a');
    expect(r.ideas[0].avg).toBe(4);
  });

  it('veto edilen fikir elenir, en alta gider, kazanamaz', () => {
    const s = makeSnap(['A', 'B']);
    addIdea(s, 'iyi', 1);
    addIdea(s, 'veto', 2);
    rate(s, 'm0', 'veto', 5);
    rate(s, 'm1', 'veto', 1);
    rate(s, 'm0', 'iyi', 2);
    const r = computeResult(s);
    expect(r.winnerIdea?.id).toBe('iyi');
    expect(r.ideas.map((i) => i.idea.id)).toEqual(['iyi', 'veto']);
    expect(r.ideas[1].eliminated).toBe(true);
    expect(r.ideas[1].vetoedBy).toEqual(['m1']);
    expect(r.ideas[1].minScore).toBe(1);
  });

  it('eşitlik: avg → ratedCount → createdAt', () => {
    const s = makeSnap(['A', 'B', 'C']);
    addIdea(s, 'yeni', 3);
    addIdea(s, 'eski', 2);
    addIdea(s, 'cok', 4);
    addIdea(s, 'yuksek', 5);
    rate(s, 'm0', 'yeni', 3);
    rate(s, 'm0', 'eski', 3);
    rate(s, 'm0', 'cok', 3);
    rate(s, 'm1', 'cok', 3);
    rate(s, 'm0', 'yuksek', 4);
    const r = computeResult(s);
    expect(r.ideas.map((i) => i.idea.id)).toEqual(['yuksek', 'cok', 'eski', 'yeni']);
  });

  it('elenenler kendi içinde de sıralanır', () => {
    const s = makeSnap(['A', 'B']);
    addIdea(s, 'x', 1);
    addIdea(s, 'y', 2);
    rate(s, 'm0', 'x', 1);
    rate(s, 'm0', 'y', 1);
    rate(s, 'm1', 'y', 5);
    const r = computeResult(s);
    expect(r.ideas.map((i) => i.idea.id)).toEqual(['y', 'x']);
  });

  it('puansız fikir kazanamaz, puanlıların altında durur', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'bos', 1);
    addIdea(s, 'puanli', 2);
    rate(s, 'm0', 'puanli', 2);
    rate(s, 'm0', 'bos', null);
    const r = computeResult(s);
    expect(r.ideas.map((i) => i.idea.id)).toEqual(['puanli', 'bos']);
    expect(r.ideas[1].avg).toBeNull();
    expect(r.winnerIdea?.id).toBe('puanli');

    const s2 = makeSnap(['A']);
    addIdea(s2, 'bos', 1);
    free(s2, 'm0', '2026-11-14', 'ogle');
    expect(computeResult(s2).winnerIdea).toBeNull();
  });

  it('bütün fikirler elenirse kazanan yok', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    addIdea(s, 'b', 2);
    rate(s, 'm0', 'a', 1);
    rate(s, 'm0', 'b', 1);
    expect(computeResult(s).winnerIdea).toBeNull();
  });

  it('cevap vermeyen paydaya girmez; katılım cevap sayılmaz', () => {
    const s = makeSnap(['A', 'B', 'C']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', 5);
    free(s, 'm1', '2026-11-14', 'ogle');
    s.attendance.push({ roomId: 'r', memberId: 'm2', status: 'yes' });
    const r = computeResult(s);
    expect(r.voters).toEqual(['m0', 'm1']);
    expect(r.waiting).toEqual(['m2']);
    expect(r.isFinal).toBe(false);
    expect(r.attendance).toEqual({ yes: 1, no: 0, undecided: 2 });
  });

  it('score=null cevap sayılmaz', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', null);
    expect(computeResult(s).voters).toEqual([]);
  });

  it('hiç saat seçilmemiş', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', 3);
    const r = computeResult(s);
    expect(r.bestSlot).toBeNull();
    expect(r.topSlots).toEqual([]);
  });

  it('slot eşitliği: erken gün, sonra sabah → öğle → akşam', () => {
    const s = makeSnap(['A']);
    free(s, 'm0', '2026-11-15', 'sabah');
    free(s, 'm0', '2026-11-14', 'aksam');
    free(s, 'm0', '2026-11-14', 'ogle');
    const r = computeResult(s);
    expect(r.bestSlot).toEqual({ day: '2026-11-14', slot: 'ogle', freeCount: 1 });
    expect(r.topSlots.map((t) => `${t.day} ${t.slot}`)).toEqual([
      '2026-11-14 ogle', '2026-11-14 aksam', '2026-11-15 sabah',
    ]);
  });

  it('topSlots en fazla 3 ve sadece freeCount > 0', () => {
    const s = makeSnap(['A', 'B']);
    ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'].forEach((d) => free(s, 'm0', d, 'sabah'));
    free(s, 'm1', '2026-11-17', 'sabah');
    const r = computeResult(s);
    expect(r.topSlots).toHaveLength(3);
    expect(r.topSlots[0]).toEqual({ day: '2026-11-17', slot: 'sabah', freeCount: 2 });
    expect(r.slots[0].freeIds).toEqual(['m0', 'm1']);
  });

  it('haftanın dışındaki saatler sayılmaz', () => {
    const s = makeSnap(['A']);
    free(s, 'm0', '2026-12-30', 'sabah');
    expect(computeResult(s).bestSlot).toBeNull();
  });
});
