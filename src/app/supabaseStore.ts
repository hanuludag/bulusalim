// DataStore'un Supabase (çevrimiçi) hâli. localStore.ts ile AYNI sözleşmeyi yerine getirir,
// bu yüzden ekranların hiçbir satırı değişmedi.
// - Veri: veritabanındaki bs_* fonksiyonları (RPC). Tablolara doğrudan erişim kapalı.
// - Canlı güncelleme: Supabase Realtime "broadcast" kanalı (room:{id}). Mesaj sadece "tekrar oku" der,
//   tıpkı çevrimdışı sürümdeki BroadcastChannel gibi.
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { findSuggestion } from './suggestions';
import { ItemTakenError, SaveError, type DataStore } from './store';
import type { Idea, Item, Member, Room, RoomSnapshot } from './types';

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
      if (msg.includes('item-taken')) throw new ItemTakenError();
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
    async createRoom({ name, startDate, creatorName }) {
      return rpc<{ room: Room; creator: Member }>('bs_create_room', {
        p_name: name,
        p_start_date: startDate,
        p_creator_name: creatorName,
      });
    },

    async createRoomFrom(oldRoomId, { name, creatorId }) {
      return rpc<{ room: Room; me: Member }>('bs_create_room_from', {
        p_old_room: oldRoomId,
        p_name: name,
        p_creator_id: creatorId,
      });
    },

    async getRoom(roomId) {
      // Geçersiz biçimli id'yi sunucuya hiç gönderme
      if (!/^[0-9a-f-]{36}$/i.test(roomId)) return null;
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
        p_map_url: input.mapUrl ?? '',
        p_note: input.note ?? '',
        p_suggestion_id: input.suggestionId ?? null,
        p_added_by: input.addedBy,
      });
      changed(roomId);
      return idea;
    },

    async updateIdea(ideaId, patch) {
      const idea = await rpc<Idea>('bs_update_idea', {
        p_idea: ideaId,
        p_name: patch.name ?? null,
        p_place: patch.place ?? null,
        p_map_url: patch.mapUrl ?? null,
        p_note: patch.note ?? null,
      });
      changed(idea.roomId);
      return idea;
    },

    async deleteIdea(ideaId) {
      const roomId = await rpc<string | null>('bs_delete_idea', { p_idea: ideaId });
      changed(roomId);
    },

    async setRating({ roomId, memberId, ideaId, score }) {
      await rpc('bs_set_rating', { p_room: roomId, p_member: memberId, p_idea: ideaId, p_score: score });
      changed(roomId);
    },

    async toggleAvailability({ roomId, memberId, day, slot }) {
      const on = await rpc<boolean>('bs_toggle_availability', { p_room: roomId, p_member: memberId, p_day: day, p_slot: slot });
      changed(roomId);
      return on;
    },

    async setAttendance({ roomId, memberId, status }) {
      await rpc('bs_set_attendance', { p_room: roomId, p_member: memberId, p_status: status });
      changed(roomId);
    },

    async seedItemsIfNeeded(roomId, suggestionId) {
      // Şablon istemcide (suggestions.ts); "tek kez" garantisi sunucuda (oda satırı kilitlenir)
      const names = findSuggestion(suggestionId)?.bring ?? [];
      await rpc('bs_seed_items', { p_room: roomId, p_names: names });
      changed(roomId);
    },

    async addItem(roomId, { name, createdBy }) {
      const item = await rpc<Item>('bs_add_item', { p_room: roomId, p_name: name, p_created_by: createdBy });
      changed(roomId);
      return item;
    },

    async claimItem(itemId, memberId) {
      const roomId = await rpc<string>('bs_claim_item', { p_item: itemId, p_member: memberId });
      changed(roomId);
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
