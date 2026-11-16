// DataStore'un tarayıcı hafızası (localStorage) hâli. Test ve geliştirme için (VITE_OFFLINE=1).
// Bütün veri tek anahtarda JSON: "bs:db:v2". Anahtardaki sürüm numarası, veri biçimi değişince
// eski biçimdeki veriyi yanlışlıkla okumayı önler: yeni sürüm yeni anahtara yazar, eskisini siler.
import { createSync, type Sync } from '../core/sync';
import { cleanName } from '../core/names';
import { MAX_DAYS, SaveError, type DataStore } from './store';
import { normalizeDays, roomDays } from './days';
import { weekDays } from '../core/format';
import type { Availability, ID, Idea, Member, Placement, Room, RoomSnapshot, Vote } from './types';

export const DB_KEY = 'bs:db:v2';
const OLD_KEYS = ['bs:db:v1'];

export interface DB { rooms: Room[]; members: Member[]; ideas: Idea[]; votes: Vote[]; availability: Availability[]; placements: Placement[] }
const emptyDb = (): DB => ({ rooms: [], members: [], ideas: [], votes: [], availability: [], placements: [] });

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
  const mustCreator = (db: DB, roomId: ID, memberId: ID) => {
    const room = mustRoom(db, roomId);
    if (room.createdBy !== memberId) throw new SaveError('not-creator');
    return room;
  };
  function checkDays(days: string[]) {
    const list = normalizeDays(days);
    if (list.length < 1 || list.length > MAX_DAYS) throw new SaveError('bad-days');
    return list;
  }

  return {
    async createRoom({ name, startDate, creatorName, days }) {
      const list = checkDays(days ?? weekDays(startDate));
      return write(null, (db) => {
        const t = now();
        const roomId = newId();
        const creator: Member = { id: newId(), roomId, name: cleanName(creatorName), createdAt: t };
        const room: Room = { id: roomId, name: name.trim(), startDate: list[0], days: list, createdBy: creator.id, createdAt: t };
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
        placements: byRoom(db.placements),
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
      const day = input.day ?? null;
      const slot = day ? (input.slot ?? null) : null;
      if (!!day !== !!slot) throw new SaveError('bad-occasion');
      return write(roomId, (db) => {
        const room = mustRoom(db, roomId);
        if (day && !roomDays(room).includes(day)) throw new SaveError('day-not-in-room');
        const idea: Idea = {
          id: newId(), roomId, name: input.name.trim(), place: (input.place ?? '').trim(),
          note: (input.note ?? '').trim().slice(0, 140), addedBy: input.addedBy,
          suggestionId: input.suggestionId ?? null, createdAt: now(), day, slot,
        };
        db.ideas.push(idea);
        return idea;
      });
    },

    async updateIdea(ideaId, memberId, patch) {
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      return write(roomId, (db) => {
        const idea = db.ideas.find((i) => i.id === ideaId && i.addedBy === memberId);
        if (!idea) throw new SaveError('idea-not-found');
        if (patch.name !== undefined) idea.name = patch.name.trim();
        if (patch.place !== undefined) idea.place = patch.place.trim();
        if (patch.note !== undefined) idea.note = patch.note.trim().slice(0, 140);
        return { ...idea };
      });
    },

    async deleteIdea(ideaId, memberId) {
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      await write(roomId, (db) => {
        const idea = db.ideas.find((i) => i.id === ideaId);
        const room = idea && db.rooms.find((r) => r.id === idea.roomId);
        if (!idea || (idea.addedBy !== memberId && room?.createdBy !== memberId)) throw new SaveError('idea-not-found');
        db.ideas = db.ideas.filter((i) => i.id !== ideaId);
        db.votes = db.votes.filter((v) => v.ideaId !== ideaId);
        db.placements = db.placements.filter((p) => p.ideaId !== ideaId);
      });
    },

    async setVote({ roomId, memberId, ideaId, value }) {
      await write(roomId, (db) => {
        db.votes = db.votes.filter((v) => !(v.memberId === memberId && v.ideaId === ideaId));
        if (value) db.votes.push({ roomId, memberId, ideaId, value });
      });
    },

    async moveIdea(ideaId, memberId, day, slot) {
      if (!!day !== !!slot) throw new SaveError('bad-occasion');
      const roomId = load().ideas.find((i) => i.id === ideaId)?.roomId ?? null;
      return write(roomId, (db) => {
        const idea = db.ideas.find((i) => i.id === ideaId);
        const room = idea && db.rooms.find((r) => r.id === idea.roomId);
        if (!idea || !room || (idea.addedBy !== memberId && room.createdBy !== memberId)) throw new SaveError('not-allowed');
        if (day && !roomDays(room).includes(day)) throw new SaveError('day-not-in-room');
        idea.day = day;
        idea.slot = slot;
        return { ...idea };
      });
    },

    async setPlacement({ roomId, memberId, ideaId, day, slot }) {
      await write(roomId, (db) => {
        db.placements = db.placements.filter((p) => !(p.memberId === memberId && p.ideaId === ideaId));
        if (!day) return;
        const room = mustRoom(db, roomId);
        if (!room.dayVoting) throw new SaveError('day-voting-off');
        if (!slot || !roomDays(room).includes(day)) throw new SaveError('day-not-in-room');
        if (!db.ideas.some((i) => i.id === ideaId && i.roomId === roomId && !i.day)) throw new SaveError('idea-not-found');
        db.placements.push({ roomId, memberId, ideaId, day, slot });
      });
    },

    async setDayVoting(roomId, memberId, on) {
      await write(roomId, (db) => {
        mustCreator(db, roomId, memberId).dayVoting = on;
      });
    },

    async setDistribution(roomId, memberId, on) {
      await write(roomId, (db) => {
        mustCreator(db, roomId, memberId).distribution = on;
      });
    },

    async assignIdeas(roomId, memberId, items) {
      await write(roomId, (db) => {
        const room = mustCreator(db, roomId, memberId);
        const days = roomDays(room);
        items.forEach(({ ideaId, day, slot }) => {
          if (day && (!slot || !days.includes(day))) throw new SaveError('bad-occasion');
          const idea = db.ideas.find((i) => i.id === ideaId && i.roomId === roomId);
          if (!idea) return;
          idea.assignedDay = day;
          idea.assignedSlot = day ? slot : null;
        });
      });
    },

    async renameRoom(roomId, memberId, name) {
      if (!name.trim()) throw new SaveError('empty-name');
      await write(roomId, (db) => {
        mustCreator(db, roomId, memberId).name = name.trim().slice(0, 40);
      });
    },

    async setDays(roomId, memberId, days) {
      const list = checkDays(days);
      await write(roomId, (db) => {
        const room = mustCreator(db, roomId, memberId);
        room.days = list;
        room.startDate = list[0];
        db.availability = db.availability.filter((a) => a.roomId !== roomId || list.includes(a.day));
        db.placements = db.placements.filter((p) => p.roomId !== roomId || list.includes(p.day));
        db.ideas.forEach((i) => {
          if (i.roomId === roomId && i.assignedDay && !list.includes(i.assignedDay)) {
            i.assignedDay = null;
            i.assignedSlot = null;
          }
          if (i.roomId === roomId && i.day && !list.includes(i.day)) {
            i.day = null; // çıkarılan günün fikirleri "herhangi bir gün"e düşer
            i.slot = null;
          }
        });
      });
    },

    async removeMember(roomId, memberId, targetId) {
      if (targetId === memberId) throw new SaveError('cannot-remove-self');
      await write(roomId, (db) => {
        mustCreator(db, roomId, memberId);
        db.members = db.members.filter((m) => !(m.id === targetId && m.roomId === roomId));
        db.votes = db.votes.filter((v) => v.memberId !== targetId);
        db.availability = db.availability.filter((a) => a.memberId !== targetId);
        db.placements = db.placements.filter((p) => p.memberId !== targetId);
      });
    },

    async deleteRoom(roomId, memberId) {
      await write(roomId, (db) => {
        mustCreator(db, roomId, memberId);
        const keep = <T extends { roomId: ID }>(l: T[]) => l.filter((x) => x.roomId !== roomId);
        db.rooms = db.rooms.filter((r) => r.id !== roomId);
        db.members = keep(db.members);
        db.ideas = keep(db.ideas);
        db.votes = keep(db.votes);
        db.availability = keep(db.availability);
        db.placements = keep(db.placements);
      });
    },

    async toggleAvailability({ roomId, memberId, day, slot }) {
      return write(roomId, (db) => {
        if (!roomDays(mustRoom(db, roomId)).includes(day)) throw new SaveError('day-not-in-room');
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
