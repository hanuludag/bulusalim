// DataStore: veri katmanının "sözleşmesi" (v2).
// localStore.ts (tarayıcı hafızası) ve supabaseStore.ts (çevrimiçi) aynı sözleşmeyi yerine getirir.
import type { ID, Idea, Member, Room, RoomSnapshot, Slot, VoteValue } from './types';

export interface DataStore {
  createRoom(input: { name: string; startDate: string; creatorName: string }): Promise<{ room: Room; creator: Member }>;
  getRoom(roomId: ID): Promise<RoomSnapshot | null>;
  joinRoom(roomId: ID, name: string): Promise<Member>;
  addIdea(roomId: ID, input: { name: string; place?: string; note?: string; suggestionId?: string; addedBy: ID }): Promise<Idea>;
  updateIdea(ideaId: ID, patch: { name?: string; place?: string; note?: string }): Promise<Idea>;
  /** O fikrin cevaplarını da siler. */
  deleteIdea(ideaId: ID): Promise<void>;
  /** value null = cevabı kaldır. */
  setVote(input: { roomId: ID; memberId: ID; ideaId: ID; value: VoteValue | null }): Promise<void>;
  /** Yeni durumu döndürür (true = seçili). */
  toggleAvailability(input: { roomId: ID; memberId: ID; day: string; slot: Slot }): Promise<boolean>;
  subscribe(roomId: ID, onChange: () => void): () => void;
  resetAll(): Promise<void>;
}

/** Kaydedilemeyince fırlatılır; ekran "Kaydedilemedi. Tekrar dene." gösterir. */
export class SaveError extends Error {
  constructor(message = 'save-failed') {
    super(message);
    this.name = 'SaveError';
  }
}
