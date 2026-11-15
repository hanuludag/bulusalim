// DataStore: veri katmanının "sözleşmesi" (§11).
// Ekranlar SADECE bu arayüzü kullanır. Bugün localStore.ts (tarayıcı hafızası) yerine getiriyor,
// yarın supabaseStore.ts yerine getirecek. Ekran kodu değişmez.
import type { ID, Idea, Item, Member, Rating, Room, RoomSnapshot, Slot } from './types';

export interface DataStore {
  createRoom(input: { name: string; startDate: string; creatorName: string }): Promise<{ room: Room; creator: Member }>;
  /** Aynı isimli üyelerle yeni oda (yeni id'ler), startDate = bugün. Fikir/puan/saat/katılım/madde kopyalanmaz. */
  createRoomFrom(oldRoomId: ID, input: { name: string; creatorId: ID }): Promise<{ room: Room; me: Member }>;
  getRoom(roomId: ID): Promise<RoomSnapshot | null>;
  joinRoom(roomId: ID, name: string): Promise<Member>;
  addIdea(
    roomId: ID,
    input: { name: string; place?: string; mapUrl?: string; note?: string; suggestionId?: string; addedBy: ID },
  ): Promise<Idea>;
  updateIdea(ideaId: ID, patch: { name?: string; place?: string; mapUrl?: string; note?: string }): Promise<Idea>;
  /** O fikrin puanlarını da siler. */
  deleteIdea(ideaId: ID): Promise<void>;
  setRating(input: { roomId: ID; memberId: ID; ideaId: ID; score: Rating['score'] }): Promise<void>;
  /** Yeni durumu döndürür (true = seçili). */
  toggleAvailability(input: { roomId: ID; memberId: ID; day: string; slot: Slot }): Promise<boolean>;
  /** status null = seçimi kaldır (kayıt silinir). */
  setAttendance(input: { roomId: ID; memberId: ID; status: 'yes' | 'no' | null }): Promise<void>;
  /** room.itemsSeeded false ise şablon maddeleri ekler ve true yapar. İkinci çağrı hiçbir şey yapmaz. */
  seedItemsIfNeeded(roomId: ID, suggestionId: string | null): Promise<void>;
  addItem(roomId: ID, input: { name: string; createdBy: ID }): Promise<Item>;
  /** null = vazgeç. Başkası almışsa hata fırlatır. */
  claimItem(itemId: ID, memberId: ID | null): Promise<void>;
  /** Oda değişince haber verir. Dönen fonksiyon aboneliği bitirir. */
  subscribe(roomId: ID, onChange: () => void): () => void;
  /** Sadece test paneli için. */
  resetAll(): Promise<void>;
}

/** Kota dolunca ya da yazılamayınca fırlatılır; ekran "Kaydedilemedi" gösterir. */
export class SaveError extends Error {
  constructor(message = 'save-failed') {
    super(message);
    this.name = 'SaveError';
  }
}

/** Başkasının aldığı maddeyi almaya çalışınca fırlatılır. */
export class ItemTakenError extends Error {
  constructor() {
    super('item-taken');
    this.name = 'ItemTakenError';
  }
}
