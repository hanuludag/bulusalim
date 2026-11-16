// DataStore'un tarayıcı hafızası (localStorage) hâli. Test ve geliştirme için (VITE_OFFLINE=1).
// Bütün veri tek anahtarda JSON: "bs:db:v2". Anahtardaki sürüm numarası, veri biçimi değişince
// eski biçimdeki veriyi yanlışlıkla okumayı önler: yeni sürüm yeni anahtara yazar, eskisini siler.
import { createSync, type Sync } from '../core/sync';
import { cleanName } from '../core/names';
import { SaveError, type DataStore } from './store';
import type { Availability, ID, Idea, Member, Room, RoomSnapshot, Vote } from './types';

export const DB_KEY = 'bs:db:v2';
const OLD_KEYS = ['bs:db:v1'];

export interface DB { rooms: Room[]; members: Member[]; ideas: Idea[]; votes: Vote[]; availability: Availability[] }
const emptyDb = (): DB => ({ rooms: [], members: [], ideas: [], votes: [], availability: [] });

export interface LocalStoreOptions { storage?: Storage; sync?: Sync; now?: () => number; id?: () => string }
export interface LocalStore extends DataStore {
  setLatency(enabled: boolean): void;
  getLatency(): boolean;
  usedBytes(): number;
}

export function createLocalStore(opts: LocalStoreOptions = {}): LocalStore {
  const storage = () => opts.storage ?? window.localStorage;
  const sync = opts.sync ?? createSync('bulusalim', 'bs');
  const now = opts.now ?? (() => Date.now());
  const newId = opts.id ?? (() => crypto.randomUUID());
  let latency = false;
  const localSubs = new Map<ID, Set<() => void>>();

  // Eski sürüm test verisini sil
  try {
    OLD_KEYS.forEach((k) => {
      if (storage().getItem(k) !== null) {
        storage().removeItem(k);
        console.info(`[bulusalim] Eski test verisi silindi (${k}).`);
      }
    });
  } catch {
    /* yok say */
  }

  const delay = () => (latency ? new Promise<void>((r) => setTimeout(r, Math.round(Math.random() * 300))) : Promise.resolve());

  function load(): DB {
    let raw: string | null;
    try {
      raw = storage().getItem(DB_KEY);
    } catch (e) {
      console.warn('[bulusalim] localStorage okunamadı.', e);
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

  function save(db: DB) {
    try {
      storage().setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('[bulusalim] Kaydedilemedi (kota dolmuş olabilir).', e);
      throw new SaveError();
    }
  }

  async function write<T>(roomId: ID | null, mutate: (db: DB) => T): Promise<T> {
    await delay();
    const db = load();
    const result = mutate(db);
    save(db);
    if (roomId) {
      sync.notify(roomId);
      localSubs.get(roomId)?.forEach((fn) => fn());
    }
    return result;
  }

  const mustRoom = (db: DB, roomId: ID) => {
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) throw new Error(`Oda yok: ${roomId}`);
    return room;
  };

  return {
    async createRoom({ name, startDate, creatorName }) {
      return write(null, (db) => {
        const t = now();
        const roomId = newId();
        const creator: Member = { id: newId(), roomId, name: cleanName(creatorName), createdAt: t };
        const room: Room = { id: roomId, name: name.trim(), startDate, createdBy: creator.id, createdAt: t };
        db.rooms.push(room);
        db.members.push(creator);
        return { room, creator };
      });
    },

    async getRoom(roomId) {
      await delay();
      const db = load();
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) return null;
      const byRoom = <T extends { roomId: ID }>(list: T[]) => list.filter((x) => x.roomId === roomId);
      return {
        room,
        members: byRoom(db.members).sort((a, b) => a.createdAt - b.createdAt),
        ideas: byRoom(db.ideas).sort((a, b) => a.createdAt - b.createdAt),
        votes: byRoom(db.votes),
        availability: byRoom(db.availability),
      } satisfies RoomSnapshot;
    },

    async joinRoom(roomId, name) {
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
          id: newId(), roomId, name: input.name.trim(), place: (input.place ?? '').trim(),
          note: (input.note ?? '').trim().slice(0, 140), addedBy: input.addedBy,
          suggestionId: input.suggestionId ?? null, createdAt: now(),
        };
        db.ideas.push(idea);
        return idea;
      });
    },

    async updateIdea(ideaId, patch) {
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      return write(roomId, (db) => {
        const idea = db.ideas.find((i) => i.id === ideaId);
        if (!idea) throw new Error(`Fikir yok: ${ideaId}`);
        if (patch.name !== undefined) idea.name = patch.name.trim();
        if (patch.place !== undefined) idea.place = patch.place.trim();
        if (patch.note !== undefined) idea.note = patch.note.trim().slice(0, 140);
        return { ...idea };
      });
    },

    async deleteIdea(ideaId) {
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      await write(roomId, (db) => {
        db.ideas = db.ideas.filter((i) => i.id !== ideaId);
        db.votes = db.votes.filter((v) => v.ideaId !== ideaId);
      });
    },

    async setVote({ roomId, memberId, ideaId, value }) {
      await write(roomId, (db) => {
        db.votes = db.votes.filter((v) => !(v.memberId === memberId && v.ideaId === ideaId));
        if (value) db.votes.push({ roomId, memberId, ideaId, value });
      });
    },

    async toggleAvailability({ roomId, memberId, day, slot }) {
      return write(roomId, (db) => {
        const i = db.availability.findIndex((a) => a.memberId === memberId && a.day === day && a.slot === slot);
        if (i >= 0) {
          db.availability.splice(i, 1);
          return false;
        }
        db.availability.push({ roomId, memberId, day, slot });
        return true;
      });
    },

    subscribe(roomId, onChange) {
      let set = localSubs.get(roomId);
      if (!set) localSubs.set(roomId, (set = new Set()));
      set.add(onChange);
      const stopRemote = sync.listen((changed) => changed === roomId && onChange());
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
      [...localSubs.keys()].forEach((r) => {
        sync.notify(r);
        localSubs.get(r)?.forEach((fn) => fn());
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
          if (k) total += (k.length + (s.getItem(k)?.length ?? 0)) * 2;
        }
      } catch {
        /* yok say */
      }
      return total;
    },
  };
}
