// DataStore'un tarayıcı hafızası (localStorage) ile çalışan hâli (§11).
// Bütün veri tek anahtarda JSON: "bs:db:v1".
// localStorage tarayıcı başına ~5 MB ile sınırlıdır ve sadece yazı saklar; bu uygulamada görsel
// olmadığı için yüzlerce oda bile rahatça sığar.
import { createSync, type Sync } from '../core/sync';
import { cleanName } from '../core/names';
import { todayString } from '../core/format';
import { findSuggestion } from './suggestions';
import { ItemTakenError, SaveError, type DataStore } from './store';
import type { Attendance, Availability, ID, Idea, Item, Member, Rating, Room, RoomSnapshot } from './types';

export const DB_KEY = 'bs:db:v1';

export interface DB {
  rooms: Room[];
  members: Member[];
  ideas: Idea[];
  ratings: Rating[];
  availability: Availability[];
  attendance: Attendance[];
  items: Item[];
}

const emptyDb = (): DB => ({ rooms: [], members: [], ideas: [], ratings: [], availability: [], attendance: [], items: [] });

export interface LocalStoreOptions {
  storage?: Storage;
  sync?: Sync;
  now?: () => number;
  id?: () => string;
}

export interface LocalStore extends DataStore {
  /** Yapay gecikme (0–300 ms), "Yükleniyor…" ve iyimser güncellemeyi denemek için. */
  setLatency(enabled: boolean): void;
  getLatency(): boolean;
  /** Kullanılan yaklaşık boyut (bayt). */
  usedBytes(): number;
  /** Test paneli: belirli bir üye adına oda verisi yazmak için düşük seviye erişim. */
  _write(roomId: ID, mutate: (db: DB) => void): Promise<void>;
}

export function createLocalStore(opts: LocalStoreOptions = {}): LocalStore {
  const storage = () => opts.storage ?? window.localStorage;
  const sync = opts.sync ?? createSync('bulusalim', 'bs');
  const now = opts.now ?? (() => Date.now());
  const newId = opts.id ?? (() => crypto.randomUUID());
  let latency = false;
  // Aynı sekmedeki aboneler (kendi değişikliğimizden sonra ekranı tazelemek için)
  const localSubs = new Map<ID, Set<() => void>>();

  const delay = () =>
    latency ? new Promise<void>((r) => setTimeout(r, Math.round(Math.random() * 300))) : Promise.resolve();

  function load(): DB {
    let raw: string | null = null;
    try {
      raw = storage().getItem(DB_KEY);
    } catch (e) {
      console.warn('[bulusalim] localStorage okunamadı, boş veritabanıyla devam ediliyor.', e);
      return emptyDb();
    }
    if (!raw) return emptyDb();
    try {
      const parsed = JSON.parse(raw) as Partial<DB>;
      const db = emptyDb();
      (Object.keys(db) as (keyof DB)[]).forEach((k) => {
        const v = parsed[k];
        if (Array.isArray(v)) (db[k] as unknown[]) = v;
      });
      return db;
    } catch (e) {
      console.warn('[bulusalim] Kayıtlı veri bozuk, boş veritabanıyla başlanıyor.', e);
      return emptyDb();
    }
  }

  function save(db: DB): void {
    try {
      storage().setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('[bulusalim] Kaydedilemedi (kota dolmuş olabilir).', e);
      throw new SaveError();
    }
  }

  function emitLocal(roomId: ID) {
    localSubs.get(roomId)?.forEach((fn) => fn());
  }

  /** Oku → değiştir → yaz → diğer sekmelere haber ver. */
  async function write<T>(roomId: ID | null, mutate: (db: DB) => T): Promise<T> {
    await delay();
    const db = load();
    const result = mutate(db);
    save(db);
    if (roomId) {
      sync.notify(roomId);
      emitLocal(roomId);
    }
    return result;
  }

  function mustRoom(db: DB, roomId: ID): Room {
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) throw new Error(`Oda yok: ${roomId}`);
    return room;
  }

  function seedItems(db: DB, room: Room, suggestionId: string | null) {
    if (room.itemsSeeded) return;
    const bring = findSuggestion(suggestionId)?.bring ?? [];
    const t = now();
    bring.forEach((name, i) => {
      db.items.push({ id: newId(), roomId: room.id, name, claimedBy: null, createdBy: null, createdAt: t + i });
    });
    room.itemsSeeded = true;
  }

  const store: LocalStore = {
    async createRoom({ name, startDate, creatorName }) {
      return write(null, (db) => {
        const t = now();
        const roomId = newId();
        const creator: Member = { id: newId(), roomId, name: cleanName(creatorName), createdAt: t };
        const room: Room = { id: roomId, name: name.trim(), startDate, createdBy: creator.id, createdAt: t, itemsSeeded: false };
        db.rooms.push(room);
        db.members.push(creator);
        return { room, creator };
      });
    },

    async createRoomFrom(oldRoomId, { name, creatorId }) {
      return write(null, (db) => {
        mustRoom(db, oldRoomId);
        const oldMembers = db.members
          .filter((m) => m.roomId === oldRoomId)
          .sort((a, b) => a.createdAt - b.createdAt);
        const oldMe = oldMembers.find((m) => m.id === creatorId);
        if (!oldMe) throw new Error('Kuran kişi eski odada yok');
        const t = now();
        const roomId = newId();
        const copies = oldMembers.map((m, i) => ({ id: newId(), roomId, name: m.name, createdAt: t + i }));
        const me = copies[oldMembers.indexOf(oldMe)];
        const room: Room = { id: roomId, name: name.trim(), startDate: todayString(new Date(t)), createdBy: me.id, createdAt: t, itemsSeeded: false };
        db.rooms.push(room);
        db.members.push(...copies);
        return { room, me };
      });
    },

    async getRoom(roomId) {
      await delay();
      const db = load();
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) return null;
      const byRoom = <T extends { roomId: ID }>(list: T[]) => list.filter((x) => x.roomId === roomId);
      const snap: RoomSnapshot = {
        room,
        members: byRoom(db.members).sort((a, b) => a.createdAt - b.createdAt),
        ideas: byRoom(db.ideas).sort((a, b) => a.createdAt - b.createdAt),
        ratings: byRoom(db.ratings),
        availability: byRoom(db.availability),
        attendance: byRoom(db.attendance),
        items: byRoom(db.items).sort((a, b) => a.createdAt - b.createdAt),
      };
      return snap;
    },

    async joinRoom(roomId, name) {
      // Aynı isim kontrolü ekranda yapılır; burada hata fırlatılmaz.
      return write(roomId, (db) => {
        mustRoom(db, roomId);
        const m: Member = { id: newId(), roomId, name: cleanName(name), createdAt: now() };
        db.members.push(m);
        return m;
      });
    },

    async addIdea(roomId, input) {
      return write(roomId, (db) => {
        mustRoom(db, roomId);
        const idea: Idea = {
          id: newId(),
          roomId,
          name: input.name.trim(),
          place: (input.place ?? '').trim(),
          mapUrl: (input.mapUrl ?? '').trim(),
          note: (input.note ?? '').trim().slice(0, 140),
          addedBy: input.addedBy,
          suggestionId: input.suggestionId ?? null,
          createdAt: now(),
        };
        db.ideas.push(idea);
        return idea;
      });
    },

    async updateIdea(ideaId, patch) {
      const db0 = load();
      const roomId = db0.ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      return write(roomId, (db) => {
        const idea = db.ideas.find((i) => i.id === ideaId);
        if (!idea) throw new Error(`Fikir yok: ${ideaId}`);
        if (patch.name !== undefined) idea.name = patch.name.trim();
        if (patch.place !== undefined) idea.place = patch.place.trim();
        if (patch.mapUrl !== undefined) idea.mapUrl = patch.mapUrl.trim();
        if (patch.note !== undefined) idea.note = patch.note.trim().slice(0, 140);
        return { ...idea };
      });
    },

    async deleteIdea(ideaId) {
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      await write(roomId, (db) => {
        db.ideas = db.ideas.filter((i) => i.id !== ideaId);
        db.ratings = db.ratings.filter((r) => r.ideaId !== ideaId);
      });
    },

    async setRating({ roomId, memberId, ideaId, score }) {
      await write(roomId, (db) => {
        // (memberId, ideaId) tek kayıt
        const existing = db.ratings.find((r) => r.memberId === memberId && r.ideaId === ideaId);
        if (existing) {
          existing.score = score;
          existing.updatedAt = now();
        } else {
          db.ratings.push({ roomId, memberId, ideaId, score, updatedAt: now() });
        }
      });
    },

    async toggleAvailability({ roomId, memberId, day, slot }) {
      return write(roomId, (db) => {
        const i = db.availability.findIndex(
          (a) => a.roomId === roomId && a.memberId === memberId && a.day === day && a.slot === slot,
        );
        if (i >= 0) {
          db.availability.splice(i, 1);
          return false;
        }
        db.availability.push({ roomId, memberId, day, slot });
        return true;
      });
    },

    async setAttendance({ roomId, memberId, status }) {
      await write(roomId, (db) => {
        db.attendance = db.attendance.filter((a) => !(a.roomId === roomId && a.memberId === memberId));
        if (status) db.attendance.push({ roomId, memberId, status });
      });
    },

    async seedItemsIfNeeded(roomId, suggestionId) {
      // Önce bak: zaten eklendiyse yazma ve haber verme
      const current = load().rooms.find((r) => r.id === roomId);
      if (!current || current.itemsSeeded) return;
      await write(roomId, (db) => {
        // Yazma anında tekrar kontrol (başka sekme bu arada eklemiş olabilir)
        seedItems(db, mustRoom(db, roomId), suggestionId);
      });
    },

    async addItem(roomId, { name, createdBy }) {
      return write(roomId, (db) => {
        mustRoom(db, roomId);
        const item: Item = { id: newId(), roomId, name: name.trim(), claimedBy: null, createdBy, createdAt: now() };
        db.items.push(item);
        return item;
      });
    },

    async claimItem(itemId, memberId) {
      const roomId = load().items.find((i) => i.id === itemId)?.roomId ?? null;
      await write(roomId, (db) => {
        const item = db.items.find((i) => i.id === itemId);
        if (!item) throw new Error(`Madde yok: ${itemId}`);
        if (memberId !== null && item.claimedBy !== null && item.claimedBy !== memberId) {
          throw new ItemTakenError();
        }
        item.claimedBy = memberId;
      });
    },

    subscribe(roomId, onChange) {
      let set = localSubs.get(roomId);
      if (!set) {
        set = new Set();
        localSubs.set(roomId, set);
      }
      set.add(onChange);
      const stopRemote = sync.listen((changed) => {
        if (changed === roomId) onChange();
      });
      return () => {
        set?.delete(onChange);
        stopRemote();
      };
    },

    async resetAll() {
      try {
        storage().removeItem(DB_KEY);
      } catch {
        /* yok say */
      }
      const rooms = [...localSubs.keys()];
      rooms.forEach((r) => {
        sync.notify(r);
        emitLocal(r);
      });
    },

    setLatency(enabled) {
      latency = enabled;
    },
    getLatency() {
      return latency;
    },
    usedBytes() {
      let total = 0;
      try {
        const s = storage();
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (!k) continue;
          total += (k.length + (s.getItem(k)?.length ?? 0)) * 2; // UTF-16: karakter başına 2 bayt
        }
      } catch {
        /* yok say */
      }
      return total;
    },
    async _write(roomId, mutate) {
      await write(roomId, mutate);
    },
  };

  return store;
}
