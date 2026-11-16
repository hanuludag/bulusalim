// DataStore: veri katmanının "sözleşmesi" (v2).
// localStore.ts (tarayıcı hafızası) ve supabaseStore.ts (çevrimiçi) aynı sözleşmeyi yerine getirir.
import type { ID, Idea, Member, Room, RoomSnapshot, Slot, VoteValue } from './types';

export interface DataStore {
  /** days verilmezse startDate'ten 7 gün. */
  createRoom(input: { name: string; startDate: string; creatorName: string; days?: string[] }): Promise<{ room: Room; creator: Member }>;
  getRoom(roomId: ID): Promise<RoomSnapshot | null>;
  joinRoom(roomId: ID, name: string): Promise<Member>;
  /** day + slot birlikte verilir (o günün o dilimine fikir); verilmezse "herhangi bir gün". */
  addIdea(roomId: ID, input: { name: string; place?: string; note?: string; suggestionId?: string; addedBy: ID; day?: string | null; slot?: Slot | null }): Promise<Idea>;
  /** Sadece fikri ekleyen düzenleyebilir. */
  updateIdea(ideaId: ID, memberId: ID, patch: { name?: string; place?: string; note?: string }): Promise<Idea>;
  /** Ekleyen ya da oda kurucusu silebilir. O fikrin cevaplarını da siler. */
  deleteIdea(ideaId: ID, memberId: ID): Promise<void>;
  /** Fikrin zamanını değiştir (day+slot ya da ikisi null = herhangi bir gün). Ekleyen ya da kurucu. */
  moveIdea(ideaId: ID, memberId: ID, day: string | null, slot: Slot | null): Promise<Idea>;
  /** Gün oyu ver/değiştir; day null = oyu kaldır. Sadece gün oylaması açıkken ve günü olmayan fikirde. */
  setPlacement(input: { roomId: ID; memberId: ID; ideaId: ID; day: string | null; slot: Slot | null }): Promise<void>;
  // --- Sadece oda kurucusu (memberId = room.createdBy) ---
  renameRoom(roomId: ID, memberId: ID, name: string): Promise<void>;
  /** 1–14 gün. Çıkarılan günlerdeki saat seçimleri silinir. */
  setDays(roomId: ID, memberId: ID, days: string[]): Promise<void>;
  /** Üyeyi ve cevaplarını siler; eklediği fikirler kalır. Kurucu kendini çıkaramaz. */
  removeMember(roomId: ID, memberId: ID, targetId: ID): Promise<void>;
  setDayVoting(roomId: ID, memberId: ID, on: boolean): Promise<void>;
  setDistribution(roomId: ID, memberId: ID, on: boolean): Promise<void>;
  /** Fikirlerin dağıtım zamanlarını kaydet (day null = dağıtımdan çıkar) */
  assignIdeas(roomId: ID, memberId: ID, items: Array<{ ideaId: ID; day: string | null; slot: Slot | null }>): Promise<void>;
  /** Odayı herkes için tamamen siler. */
  deleteRoom(roomId: ID, memberId: ID): Promise<void>;
  /** value null = cevabı kaldır. */
  setVote(input: { roomId: ID; memberId: ID; ideaId: ID; value: VoteValue | null }): Promise<void>;
  /** Yeni durumu döndürür (true = seçili). */
  toggleAvailability(input: { roomId: ID; memberId: ID; day: string; slot: Slot }): Promise<boolean>;
  subscribe(roomId: ID, onChange: () => void): () => void;
  resetAll(): Promise<void>;
}

/** Kaydedilemeyince fırlatılır; ekran "Kaydedilemedi. Tekrar dene." gösterir. */
export const MAX_DAYS = 14;

export class SaveError extends Error {
  constructor(message = 'save-failed') {
    super(message);
    this.name = 'SaveError';
  }
}
