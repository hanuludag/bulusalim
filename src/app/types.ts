// Uygulamanın veri tipleri (v2).
export type ID = string; // crypto.randomUUID()
export type Slot = 'gunduz' | 'aksam';
export type VoteValue = 'yes' | 'no';
export type ScreenKey = 'fikirler' | 'zaman' | 'sonuc' | 'cevap' | 'plan';

export interface Room {
  id: ID; name: string; startDate: string /* YYYY-MM-DD, ilk gün */;
  days?: string[] /* buluşulabilecek günler, sıralı; boş/yoksa startDate'ten 7 gün (eski odalar) */;
  createdBy: ID; createdAt: number;
}
export interface Member { id: ID; roomId: ID; name: string; createdAt: number }
export interface Idea {
  id: ID; roomId: ID; name: string; place: string; note: string /* ≤140 */;
  addedBy: ID; suggestionId: string | null; createdAt: number;
  /** Fikrin günü ve dilimi (ikisi birlikte). null = herhangi bir gün (eski fikirler). */
  day?: string | null; slot?: Slot | null;
}
/** Bir üyenin bir fikre cevabı. Kayıt yoksa: cevap yok. */
export interface Vote { roomId: ID; memberId: ID; ideaId: ID; value: VoteValue }
export interface Availability { roomId: ID; memberId: ID; day: string /* YYYY-MM-DD */; slot: Slot }
export interface RoomSnapshot { room: Room; members: Member[]; ideas: Idea[]; votes: Vote[]; availability: Availability[] }
