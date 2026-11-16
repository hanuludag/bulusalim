// Odaya girince hangi ekran açılacak. Saf fonksiyon.
import type { ID, RoomSnapshot, ScreenKey } from './types';

export const hasMyVote = (s: RoomSnapshot, me: ID) => s.votes.some((v) => v.memberId === me);
export const hasMyTime = (s: RoomSnapshot, me: ID) => s.availability.some((a) => a.memberId === me);

/** Cevap yok → fikirler · cevap var saat yok → zaman · ikisi de var → sonuç */
export function landingScreen(snap: RoomSnapshot, memberId: ID): ScreenKey {
  if (!hasMyVote(snap, memberId)) return 'fikirler';
  return hasMyTime(snap, memberId) ? 'sonuc' : 'zaman';
}
