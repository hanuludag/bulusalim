// DataStore'un Supabase (çevrimiçi) hâli. localStore.ts ile AYNI sözleşmeyi yerine getirir,
// bu yüzden ekranların hiçbir satırı değişmedi.
// - Veri: veritabanındaki bs_* fonksiyonları (RPC). Tablolara doğrudan erişim kapalı.
// - Canlı güncelleme: Supabase Realtime "broadcast" kanalı (room:{id}). Mesaj sadece "tekrar oku" der,
//   tıpkı çevrimdışı sürümdeki BroadcastChannel gibi.
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { SaveError, type DataStore } from './store';
import type { Idea, Member, Room, RoomSnapshot } from './types';

/** Ağ hatası: ekran "Bağlantı yok. Tekrar dene." gösterir. */
export class OfflineError extends Error {
  constructor(cause?: unknown) {
    super('offline', { cause });
    this.name = 'OfflineError';
  }
}

export function createSupabaseStore(url: string, key: string): DataStore {
  const db: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  // Oda başına tek kanal; aynı sekmedeki bütün aboneler paylaşır
  const channels = new Map<string, { ch: RealtimeChannel; subs: Set<() => void> }>();

  async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    let res;
    try {
      res = await db.rpc(fn, args);
    } catch (e) {
      throw new OfflineError(e);
    }
    if (res.error) {
      const msg = res.error.message ?? '';
      if (!res.error.code && /fetch|network/i.test(msg)) throw new OfflineError(res.error);
      console.error(`[bulusalim] ${fn} hata verdi:`, res.error);
      throw new SaveError(msg);
    }
    return res.data as T;
  }

  /** Değişiklikten sonra: bu sekmedeki abonelere ve diğer cihazlara haber ver. */
  function changed(roomId: string | null | undefined) {
    if (!roomId) return;
    const entry = channels.get(roomId);
    entry?.subs.forEach((fn) => fn());
    if (entry) {
      void entry.ch.send({ type: 'broadcast', event: 'room-changed', payload: {} });
    } else {
      // Bu sekme o odayı dinlemiyorsa (ör. yeni plan kurarken) geçici kanalla gönder
      const tmp = db.channel(`room:${roomId}`);
      tmp.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void tmp.send({ type: 'broadcast', event: 'room-changed', payload: {} }).finally(() => void db.removeChannel(tmp));
        }
      });
    }
  }

  return {
    async createRoom({ name, startDate, creatorName, days }) {
      return rpc<{ room: Room; creator: Member }>('bs_create_room', {
        p_name: name,
        p_start_date: startDate,
        p_creator_name: creatorName,
        p_days: days ?? null,
      });
    },

    async getRoom(roomId) {
      // Geçersiz biçimli id'yi sunucuya hiç gönderme
      if (!/^[0-9a-z-]{6,36}$/i.test(roomId)) return null; // kısa kod (yeni) ya da uuid (eski odalar)
      return rpc<RoomSnapshot | null>('bs_get_room', { p_room: roomId });
    },

    async joinRoom(roomId, name) {
      const m = await rpc<Member>('bs_join_room', { p_room: roomId, p_name: name });
      changed(roomId);
      return m;
    },

    async addIdea(roomId, input) {
      const idea = await rpc<Idea>('bs_add_idea', {
        p_room: roomId,
        p_name: input.name,
        p_place: input.place ?? '',
        p_note: input.note ?? '',
        p_suggestion_id: input.suggestionId ?? null,
        p_added_by: input.addedBy,
        p_day: input.day ?? null,
        p_slot: input.day ? (input.slot ?? null) : null,
      });
      changed(roomId);
      return idea;
    },

    async updateIdea(ideaId, memberId, patch) {
      const idea = await rpc<Idea>('bs_update_idea', {
        p_idea: ideaId,
        p_member: memberId,
        p_name: patch.name ?? null,
        p_place: patch.place ?? null,
        p_note: patch.note ?? null,
      });
      changed(idea.roomId);
      return idea;
    },

    async deleteIdea(ideaId, memberId) {
      const roomId = await rpc<string | null>('bs_delete_idea', { p_idea: ideaId, p_member: memberId });
      changed(roomId);
    },

    async moveIdea(ideaId, memberId, day, slot) {
      const idea = await rpc<Idea>('bs_move_idea', { p_idea: ideaId, p_member: memberId, p_day: day, p_slot: day ? slot : null });
      changed(idea.roomId);
      return idea;
    },

    async setPlacement({ roomId, memberId, ideaId, day, slot }) {
      await rpc('bs_set_placement', { p_room: roomId, p_member: memberId, p_idea: ideaId, p_day: day, p_slot: day ? slot : null });
      changed(roomId);
    },

    async setDayVoting(roomId, memberId, on) {
      await rpc('bs_set_day_voting', { p_room: roomId, p_member: memberId, p_on: on });
      changed(roomId);
    },

    async setDistribution(roomId, memberId, on) {
      await rpc('bs_set_distribution', { p_room: roomId, p_member: memberId, p_on: on });
      changed(roomId);
    },

    async assignIdeas(roomId, memberId, items) {
      await rpc('bs_assign_ideas', {
        p_room: roomId,
        p_member: memberId,
        p_items: items.map((x) => ({ idea: x.ideaId, day: x.day, slot: x.day ? x.slot : null })),
      });
      changed(roomId);
    },

    async renameRoom(roomId, memberId, name) {
      await rpc('bs_rename_room', { p_room: roomId, p_member: memberId, p_name: name });
      changed(roomId);
    },

    async setDays(roomId, memberId, days) {
      await rpc('bs_set_days', { p_room: roomId, p_member: memberId, p_days: days });
      changed(roomId);
    },

    async removeMember(roomId, memberId, targetId) {
      await rpc('bs_remove_member', { p_room: roomId, p_member: memberId, p_target: targetId });
      changed(roomId);
    },

    async deleteRoom(roomId, memberId) {
      await rpc('bs_delete_room', { p_room: roomId, p_member: memberId });
      changed(roomId);
    },

    async setVote({ roomId, memberId, ideaId, value }) {
      await rpc('bs_set_vote', { p_room: roomId, p_member: memberId, p_idea: ideaId, p_value: value });
      changed(roomId);
    },

    async toggleAvailability({ roomId, memberId, day, slot }) {
      const on = await rpc<boolean>('bs_toggle_availability', { p_room: roomId, p_member: memberId, p_day: day, p_slot: slot });
      changed(roomId);
      return on;
    },

    subscribe(roomId, onChange) {
      let entry = channels.get(roomId);
      if (!entry) {
        const subs = new Set<() => void>();
        const ch = db
          .channel(`room:${roomId}`, { config: { broadcast: { self: false } } })
          .on('broadcast', { event: 'room-changed' }, () => subs.forEach((fn) => fn()))
          .subscribe((status) => {
            // Bağlantı koptuktan sonra yeniden bağlanınca kaçırılanları almak için tazele
            if (status === 'SUBSCRIBED') subs.forEach((fn) => fn());
          });
        entry = { ch, subs };
        channels.set(roomId, entry);
      }
      entry.subs.add(onChange);
      return () => {
        const e = channels.get(roomId);
        if (!e) return;
        e.subs.delete(onChange);
        if (e.subs.size === 0) {
          channels.delete(roomId);
          void db.removeChannel(e.ch);
        }
      };
    },

    async resetAll() {
      // Çevrimiçi sürümde sunucudaki veriler silinmez; sadece bu cihazın kayıtları temizlenir (test paneli).
    },
  };
}
