import { describe, expect, it } from 'vitest';
import { computeResult } from './result';
import { addIdea, free, makeSnap, vote } from './testHelpers';

describe('computeResult v2', () => {
  it('boş oda', () => {
    const r = computeResult(makeSnap([]));
    expect(r.totalMembers).toBe(0);
    expect(r.isFinal).toBe(false);
    expect(r.winnerIdea).toBeNull();
    expect(r.bestSlot).toBeNull();
    expect(r.allFreeSlots).toEqual([]);
  });
  it('14 slot, gün sırasıyla', () => {
    const r = computeResult(makeSnap(['A']));
    expect(r.slots).toHaveLength(14);
    expect(r.slots.slice(0, 3).map((s) => `${s.day} ${s.slot}`)).toEqual(['2026-11-14 gunduz', '2026-11-14 aksam', '2026-11-15 gunduz']);
  });
  it('tek üye, hiç cevap yok', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    const r = computeResult(s);
    expect(r.voters).toEqual([]);
    expect(r.waiting).toEqual(['m0']);
    expect(r.isFinal).toBe(false);
    expect(r.winnerIdea).toBeNull();
  });
  it('sıralama: yes çok → no az → eski', () => {
    const s = makeSnap(['A', 'B', 'C']);
    ['eski', 'yeni', 'azno', 'cokyes'].forEach((id, i) => addIdea(s, id, i));
    vote(s, 'm0', 'eski', 'yes'); vote(s, 'm1', 'eski', 'no');
    vote(s, 'm0', 'yeni', 'yes'); vote(s, 'm1', 'yeni', 'no');
    vote(s, 'm0', 'azno', 'yes');
    vote(s, 'm0', 'cokyes', 'yes'); vote(s, 'm1', 'cokyes', 'yes'); vote(s, 'm2', 'cokyes', 'no');
    const r = computeResult(s);
    expect(r.ideas.map((i) => `${i.idea.id} ${i.yes}/${i.no}`)).toEqual(['cokyes 2/1', 'azno 1/0', 'eski 1/1', 'yeni 1/1']);
    expect(r.winnerIdea?.id).toBe('cokyes');
  });
  it('herkes "no" derse kazanan yok', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    vote(s, 'm0', 'a', 'no');
    const r = computeResult(s);
    expect(r.winnerIdea).toBeNull();
    expect(r.isFinal).toBe(true);
  });
  it('sadece saat seçen ve sadece onay veren cevap verdi sayılır', () => {
    const s = makeSnap(['A', 'B', 'C']);
    addIdea(s, 'a', 1);
    vote(s, 'm0', 'a', 'yes');
    free(s, 'm1', '2026-11-14', 'aksam');
    const r = computeResult(s);
    expect(r.voters).toEqual(['m0', 'm1']);
    expect(r.waiting).toEqual(['m2']);
    expect(r.isFinal).toBe(false);
  });
  it('saat eşitliği: erken gün, sonra gündüz → akşam', () => {
    const s = makeSnap(['A']);
    free(s, 'm0', '2026-11-15', 'gunduz');
    free(s, 'm0', '2026-11-14', 'aksam');
    expect(computeResult(s).bestSlot).toEqual({ day: '2026-11-14', slot: 'aksam', freeCount: 1 });
    free(s, 'm0', '2026-11-14', 'gunduz');
    expect(computeResult(s).bestSlot).toEqual({ day: '2026-11-14', slot: 'gunduz', freeCount: 1 });
  });
  it('en çok kişi kazanır; hiç saat yoksa null', () => {
    const s = makeSnap(['A', 'B']);
    expect(computeResult(s).bestSlot).toBeNull();
    free(s, 'm0', '2026-11-14', 'gunduz');
    free(s, 'm0', '2026-11-16', 'aksam');
    free(s, 'm1', '2026-11-16', 'aksam');
    expect(computeResult(s).bestSlot).toEqual({ day: '2026-11-16', slot: 'aksam', freeCount: 2 });
  });
  it('herkes boş → allFreeSlots', () => {
    const s = makeSnap(['A', 'B']);
    free(s, 'm0', '2026-11-16', 'aksam');
    free(s, 'm1', '2026-11-16', 'aksam');
    free(s, 'm0', '2026-11-14', 'gunduz');
    expect(computeResult(s).allFreeSlots).toEqual([{ day: '2026-11-16', slot: 'aksam' }]);
  });
  it('haftanın dışındaki saat sayılmaz', () => {
    const s = makeSnap(['A']);
    free(s, 'm0', '2026-12-30', 'gunduz');
    expect(computeResult(s).bestSlot).toBeNull();
  });
});
