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

describe('gün gün plan', () => {
  it('her gün+dilimin kendi kazananı; günsüz fikirler ayrı', () => {
    const s = makeSnap(['A', 'B', 'C']);
    const balik = addIdea(s, 'balik', 1);
    balik.day = '2026-11-14'; balik.slot = 'gunduz';
    const sinema = addIdea(s, 'sinema', 2);
    sinema.day = '2026-11-14'; sinema.slot = 'gunduz';
    const pizza = addIdea(s, 'pizza', 3);
    pizza.day = '2026-11-15'; pizza.slot = 'aksam';
    const bos = addIdea(s, 'bos', 4);
    bos.day = '2026-11-16'; bos.slot = 'aksam';
    addIdea(s, 'genel', 5);
    vote(s, 'm0', 'balik', 'yes');
    vote(s, 'm1', 'sinema', 'yes');
    vote(s, 'm2', 'sinema', 'yes');
    vote(s, 'm0', 'pizza', 'yes');
    vote(s, 'm1', 'bos', 'no');
    free(s, 'm0', '2026-11-14', 'gunduz');
    const r = computeResult(s);
    expect(r.plan.map((o) => [o.day, o.slot, o.winner?.id ?? null])).toEqual([
      ['2026-11-14', 'gunduz', 'sinema'],
      ['2026-11-15', 'aksam', 'pizza'],
      ['2026-11-16', 'aksam', null], // onay yok → kazanan yok
    ]);
    expect(r.plan[0].freeCount).toBe(1);
    expect(r.general.map((x) => x.idea.id)).toEqual(['genel']);
    expect(r.winnerIdea).toBeNull(); // genel fikre onay yok
  });

  it('oda dışında kalan gündeki fikir genel sayılır', () => {
    const s = makeSnap(['A']);
    const x = addIdea(s, 'x', 1);
    x.day = '2027-01-01'; x.slot = 'aksam';
    vote(s, 'm0', 'x', 'yes');
    const r = computeResult(s);
    expect(r.plan).toHaveLength(0);
    expect(r.winnerIdea?.id).toBe('x');
  });
});

describe('gün oylaması', () => {
  it('açıkken günü olmayan fikir en çok gün oyu aldığı zamana gider; kapalıyken gitmez', () => {
    const s = makeSnap(['A', 'B', 'C']);
    addIdea(s, 'balik', 1);
    vote(s, 'm0', 'balik', 'yes');
    s.placements = [
      { roomId: 'r', memberId: 'm0', ideaId: 'balik', day: '2026-11-15', slot: 'aksam' },
      { roomId: 'r', memberId: 'm1', ideaId: 'balik', day: '2026-11-15', slot: 'aksam' },
      { roomId: 'r', memberId: 'm2', ideaId: 'balik', day: '2026-11-14', slot: 'gunduz' },
    ];
    expect(computeResult(s).plan).toHaveLength(0); // kapalı
    s.room.dayVoting = true;
    const r = computeResult(s);
    expect(r.plan.map((o) => [o.day, o.slot, o.winner?.id])).toEqual([['2026-11-15', 'aksam', 'balik']]);
    expect(r.general).toHaveLength(0);
    expect(r.ideas[0].dayVote).toEqual({ day: '2026-11-15', slot: 'aksam', count: 2 });
  });

  it('eşit gün oyunda daha çok kişinin boş olduğu zaman kazanır', () => {
    const s = makeSnap(['A', 'B']);
    s.room.dayVoting = true;
    addIdea(s, 'x', 1);
    s.placements = [
      { roomId: 'r', memberId: 'm0', ideaId: 'x', day: '2026-11-14', slot: 'gunduz' },
      { roomId: 'r', memberId: 'm1', ideaId: 'x', day: '2026-11-16', slot: 'aksam' },
    ];
    free(s, 'm0', '2026-11-16', 'aksam');
    expect(computeResult(s).ideas[0].dayVote).toEqual({ day: '2026-11-16', slot: 'aksam', count: 1 });
  });
});
