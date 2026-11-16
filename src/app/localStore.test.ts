import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStore, DB_KEY } from './localStore';
import { SaveError } from './store';
import type { Sync } from '../core/sync';

function fakeBus() {
  const subs = new Set<{ from: number; fn: (r: string) => void }>();
  let tabs = 0;
  return (): Sync => {
    const me = tabs++;
    return {
      notify: (roomId) => subs.forEach((s) => s.from !== me && s.fn(roomId)),
      listen: (fn) => {
        const e = { from: me, fn };
        subs.add(e);
        return () => subs.delete(e);
      },
      close: () => {},
    };
  };
}
let tab: () => Sync;
beforeEach(() => {
  localStorage.clear();
  tab = fakeBus();
});

describe('localStore v2', () => {
  it('kur → katıl → fikir → onayla/onaylama/kaldır → sil → saat', async () => {
    const s = createLocalStore({ sync: tab() });
    const { room, creator } = await s.createRoom({ name: ' Buluşma ', startDate: '2026-11-16', creatorName: ' Emirhan ' });
    expect(room.name).toBe('Buluşma');
    expect(room.createdBy).toBe(creator.id);
    const kaan = await s.joinRoom(room.id, 'Kaan');
    const idea = await s.addIdea(room.id, { name: 'Sinema', note: 'x'.repeat(200), addedBy: creator.id });
    expect(idea.note).toHaveLength(140);

    await s.setVote({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, value: 'yes' });
    await s.setVote({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, value: 'no' });
    let snap = (await s.getRoom(room.id))!;
    expect(snap.votes).toEqual([{ roomId: room.id, memberId: kaan.id, ideaId: idea.id, value: 'no' }]);
    await s.setVote({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, value: null });
    expect((await s.getRoom(room.id))!.votes).toHaveLength(0);

    await expect(s.updateIdea(idea.id, kaan.id, { place: 'X' })).rejects.toBeInstanceOf(SaveError); // başkasının fikri
    expect((await s.updateIdea(idea.id, creator.id, { place: 'Kadıköy' })).place).toBe('Kadıköy');
    await s.setVote({ roomId: room.id, memberId: creator.id, ideaId: idea.id, value: 'yes' });
    await expect(s.deleteIdea(idea.id, kaan.id)).rejects.toBeInstanceOf(SaveError);
    await s.deleteIdea(idea.id, creator.id);
    snap = (await s.getRoom(room.id))!;
    expect(snap.ideas).toHaveLength(0);
    expect(snap.votes).toHaveLength(0);

    expect(await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-16', slot: 'aksam' })).toBe(true);
    expect(await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-16', slot: 'aksam' })).toBe(false);
    expect((await s.getRoom(room.id))!.availability).toHaveLength(0);
  });

  it('günler + kurucu yetkileri: ad, günler, üye çıkar, fikir sil, oda sil', async () => {
    const s = createLocalStore({ sync: tab() });
    const days = ['2026-11-22', '2026-11-21', '2026-11-21'];
    const { room, creator } = await s.createRoom({ name: 'A', startDate: '2026-11-16', creatorName: 'E', days });
    expect(room.days).toEqual(['2026-11-21', '2026-11-22']);
    expect(room.startDate).toBe('2026-11-21');
    const kaan = await s.joinRoom(room.id, 'Kaan');
    await expect(s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-16', slot: 'aksam' })).rejects.toBeInstanceOf(SaveError);
    await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-21', slot: 'aksam' });
    await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-22', slot: 'aksam' });

    await expect(s.renameRoom(room.id, kaan.id, 'B')).rejects.toBeInstanceOf(SaveError);
    await s.renameRoom(room.id, creator.id, ' B ');
    await s.setDays(room.id, creator.id, ['2026-11-22', '2026-11-29']);
    let snap = (await s.getRoom(room.id))!;
    expect(snap.room.name).toBe('B');
    expect(snap.availability.map((a) => a.day)).toEqual(['2026-11-22']); // çıkarılan günün seçimi gitti
    await expect(s.setDays(room.id, creator.id, [])).rejects.toBeInstanceOf(SaveError);

    const idea = await s.addIdea(room.id, { name: 'Sinema', addedBy: kaan.id });
    await s.deleteIdea(idea.id, creator.id); // kurucu başkasının fikrini silebilir
    await expect(s.removeMember(room.id, creator.id, creator.id)).rejects.toBeInstanceOf(SaveError);
    await s.removeMember(room.id, creator.id, kaan.id);
    snap = (await s.getRoom(room.id))!;
    expect(snap.members.map((m) => m.name)).toEqual(['E']);
    expect(snap.availability).toHaveLength(0);

    await expect(s.deleteRoom(room.id, kaan.id)).rejects.toBeInstanceOf(SaveError);
    await s.deleteRoom(room.id, creator.id);
    expect(await s.getRoom(room.id)).toBeNull();
  });

  it('eski bs:db:v1 silinir', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    localStorage.setItem('bs:db:v1', '{"rooms":[]}');
    createLocalStore({ sync: tab() });
    expect(localStorage.getItem('bs:db:v1')).toBeNull();
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it('bilinmeyen oda null; bozuk veri çökertmez', async () => {
    localStorage.setItem(DB_KEY, '{bozuk');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = createLocalStore({ sync: tab() });
    expect(await s.getRoom('yok')).toBeNull();
    warn.mockRestore();
  });

  it('diğer sekmeye haber verir', async () => {
    const a = createLocalStore({ sync: tab() });
    const b = createLocalStore({ sync: tab() });
    const { room } = await a.createRoom({ name: 'X', startDate: '2026-11-16', creatorName: 'E' });
    let calls = 0;
    b.subscribe(room.id, () => calls++);
    await a.joinRoom(room.id, 'Kaan');
    expect(calls).toBe(1);
  });

  it('kota hatası SaveError olur', async () => {
    const full = { length: 0, clear() {}, key: () => null, getItem: () => null, removeItem() {},
      setItem() { throw new DOMException('dolu', 'QuotaExceededError'); } } as Storage;
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = createLocalStore({ sync: tab(), storage: full });
    await expect(s.createRoom({ name: 'X', startDate: '2026-11-16', creatorName: 'E' })).rejects.toBeInstanceOf(SaveError);
    err.mockRestore();
  });
});
