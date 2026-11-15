// Odaya girince hangi sekme açılacak (§16). Saf fonksiyon.
import type { ID, RoomSnapshot, TabKey } from './types';

export function hasMyRating(snap: RoomSnapshot, memberId: ID): boolean {
  return snap.ratings.some((r) => r.memberId === memberId && r.score !== null);
}

export function hasMyTime(snap: RoomSnapshot, memberId: ID): boolean {
  return snap.availability.some((a) => a.memberId === memberId);
}

/** Puan yok → fikirler · puan var saat yok → zaman · ikisi de var → sonuç */
export function landingTab(snap: RoomSnapshot, memberId: ID): TabKey {
  const rated = hasMyRating(snap, memberId);
  const timed = hasMyTime(snap, memberId);
  if (!rated && !timed) return 'fikirler';
  if (rated && !timed) return 'zaman';
  if (rated && timed) return 'sonuc';
  // saat var, puan yok: kurala göre önce puanlamaya gönder
  return 'fikirler';
}
