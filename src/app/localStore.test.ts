import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStore, DB_KEY } from './localStore';
import { ItemTakenError, SaveError } from './store';
import type { Sync } from '../core/sync';

/** İki "sekme"yi taklit eden bellek içi kanal */
function fakeBus() {
  const subs = new Set<{ from: number; fn: (r: string) => void }>();
  let tabs = 0;
  return () => {
    const me = tabs++;
    const sync: Sync = {
      notify: (roomId) => subs.forEach((s) => s.from !== me && s.fn(roomId)),
      listen: (fn) => {
        const entry = { from: me, fn };
        subs.add(entry);
        return () => subs.delete(entry);
      },
      close: () => {},
    };
    return sync;
  };
}

let tab: () => Sync;
beforeEach(() => {
  localStorage.clear();
  tab = fakeBus();
});

describe('localStore', () => {
  it('tam akış: kur → katıl → fikir → puan → sil → saat → katılım', async () => {
    const s = createLocalStore({ sync: tab() });
    const { room, creator } = await s.createRoom({ name: ' Cumartesi ekibi ', startDate: '2026-11-14', creatorName: ' Emirhan ' });
    expect(room.name).toBe('Cumartesi ekibi');
    expect(creator.name).toBe('Emirhan');
    expect(room.createdBy).toBe(creator.id);

    const kaan = await s.joinRoom(room.id, 'Kaan');
    const idea = await s.addIdea(room.id, { name: 'Balık tutma', place: 'Moda', note: 'x'.repeat(200), addedBy: creator.id, suggestionId: 'balik' });
    expect(idea.note).toHaveLength(140);
    expect(idea.suggestionId).toBe('balik');

    await s.setRating({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, score: 4 });
    await s.setRating({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, score: 5 });
    let snap = (await s.getRoom(room.id))!;
    expect(snap.members.map((m) => m.name)).toEqual(['Emirhan', 'Kaan']);
    expect(snap.ratings).toHaveLength(1); // aynı üye aynı fikre tek kayıt
    expect(snap.ratings[0].score).toBe(5);

    const upd = await s.updateIdea(idea.id, { place: 'Kalamış' });
    expect(upd.place).toBe('Kalamış');

    await s.deleteIdea(idea.id);
    snap = (await s.getRoom(room.id))!;
    expect(snap.ideas).toHaveLength(0);
    expect(snap.ratings).toHaveLength(0); // puanlar da silindi

    const t1 = await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-14', slot: 'ogle' });
    expect(t1).toBe(true);
    const t2 = await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-14', slot: 'ogle' });
    expect(t2).toBe(false);
    expect((await s.getRoom(room.id))!.availability).toHaveLength(0);

    await s.setAttendance({ roomId: room.id, memberId: kaan.id, status: 'yes' });
    await s.setAttendance({ roomId: room.id, memberId: kaan.id, status: 'no' });
    expect((await s.getRoom(room.id))!.attendance).toEqual([{ roomId: room.id, memberId: kaan.id, status: 'no' }]);
    await s.setAttendance({ roomId: room.id, memberId: kaan.id, status: null });
    expect((await s.getRoom(room.id))!.attendance).toHaveLength(0);
  });

  it('bilinmeyen oda null', async () => {
    const s = createLocalStore({ sync: tab() });
    expect(await s.getRoom('yok')).toBeNull();
  });

  it('seedItemsIfNeeded iki kez (iki sekme) çağrılınca maddeler tek kez eklenir', async () => {
    const a = createLocalStore({ sync: tab() });
    const b = createLocalStore({ sync: tab() });
    const { room } = await a.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' });
    await Promise.all([a.seedItemsIfNeeded(room.id, 'balik'), b.seedItemsIfNeeded(room.id, 'balik')]);
    await a.seedItemsIfNeeded(room.id, 'piknik');
    const snap = (await a.getRoom(room.id))!;
    expect(snap.items.map((i) => i.name)).toEqual(['Olta', 'Yem', 'Sandalye', 'Su']);
    expect(snap.room.itemsSeeded).toBe(true);
  });

  it('kendi yazdığı fikirde şablon yok', async () => {
    const s = createLocalStore({ sync: tab() });
    const { room } = await s.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' });
    await s.seedItemsIfNeeded(room.id, null);
    const snap = (await s.getRoom(room.id))!;
    expect(snap.items).toHaveLength(0);
    expect(snap.room.itemsSeeded).toBe(true);
  });

  it('başkasının aldığı madde alınamaz; vazgeçince alınabilir', async () => {
    const s = createLocalStore({ sync: tab() });
    const { room, creator } = await s.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' });
    const kaan = await s.joinRoom(room.id, 'Kaan');
    const item = await s.addItem(room.id, { name: 'Sandalye', createdBy: creator.id });
    expect(item.claimedBy).toBeNull();
    await s.claimItem(item.id, kaan.id);
    await expect(s.claimItem(item.id, creator.id)).rejects.toBeInstanceOf(ItemTakenError);
    await s.claimItem(item.id, null);
    await s.claimItem(item.id, creator.id);
    expect((await s.getRoom(room.id))!.items[0].claimedBy).toBe(creator.id);
  });

  it('createRoomFrom üyeleri kopyalar, fikirleri kopyalamaz', async () => {
    const s = createLocalStore({ sync: tab(), now: () => new Date(2026, 10, 20, 12).getTime() });
    const { room, creator } = await s.createRoom({ name: 'Cumartesi ekibi', startDate: '2026-11-14', creatorName: 'Emirhan' });
    const kaan = await s.joinRoom(room.id, 'Kaan');
    const idea = await s.addIdea(room.id, { name: 'Sinema', addedBy: creator.id });
    await s.setRating({ roomId: room.id, memberId: kaan.id, ideaId: idea.id, score: 3 });
    await s.toggleAvailability({ roomId: room.id, memberId: kaan.id, day: '2026-11-14', slot: 'aksam' });

    const { room: r2, me } = await s.createRoomFrom(room.id, { name: 'Cumartesi ekibi 2', creatorId: kaan.id });
    const snap = (await s.getRoom(r2.id))!;
    expect(snap.members.map((m) => m.name)).toEqual(['Emirhan', 'Kaan']);
    expect(snap.members.every((m) => m.id !== creator.id && m.id !== kaan.id)).toBe(true);
    expect(me.name).toBe('Kaan');
    expect(r2.createdBy).toBe(me.id);
    expect(r2.startDate).toBe('2026-11-20');
    expect(snap.ideas).toHaveLength(0);
    expect(snap.ratings).toHaveLength(0);
    expect(snap.availability).toHaveLength(0);
    // eski oda aynen duruyor
    expect((await s.getRoom(room.id))!.ideas).toHaveLength(1);
  });

  it('diğer sekmeye haber verir, kendi mesajını işlemez', async () => {
    const a = createLocalStore({ sync: tab() });
    const b = createLocalStore({ sync: tab() });
    const { room } = await a.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' });
    let bCalls = 0;
    let aCalls = 0;
    b.subscribe(room.id, () => bCalls++);
    const stopA = a.subscribe(room.id, () => aCalls++);
    await a.joinRoom(room.id, 'Kaan');
    expect(bCalls).toBe(1);
    expect(aCalls).toBe(1); // aynı sekmedeki aboneler yerel olarak tazelenir (mesaj değil)
    stopA();
    await a.joinRoom(room.id, 'Mert');
    expect(aCalls).toBe(1);
    expect(bCalls).toBe(2);
  });

  it('bozuk veri gelirse çökmez', async () => {
    localStorage.setItem(DB_KEY, '{bozuk');
    const s = createLocalStore({ sync: tab() });
    expect(await s.getRoom('x')).toBeNull();
    const { room } = await s.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' });
    expect(await s.getRoom(room.id)).not.toBeNull();
  });

  it('kota hatası SaveError olur', async () => {
    const full: Storage = {
      length: 0,
      clear() {},
      key: () => null,
      getItem: () => null,
      removeItem() {},
      setItem() {
        throw new DOMException('dolu', 'QuotaExceededError');
      },
    };
    const s = createLocalStore({ sync: tab(), storage: full });
    await expect(s.createRoom({ name: 'X', startDate: '2026-11-14', creatorName: 'E' })).rejects.toBeInstanceOf(SaveError);
  });
});
