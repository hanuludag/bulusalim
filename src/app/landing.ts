// Odaya girince hangi ekran açılacak. Saf fonksiyon.
import type { ID, RoomSnapshot, ScreenKey } from './types';

export const hasMyVote = (s: RoomSnapshot, me: ID) => s.votes.some((v) => v.memberId === me);
export const hasMyTime = (s: RoomSnapshot, me: ID) => s.availability.some((a) => a.memberId === me);

/**
 * Odaya girince açılacak ekran.
 * Odayı kuran (ayrıntılı ekranlar): cevap yok → fikirler · cevap var saat yok → zaman · ikisi de var → sonuç.
 * Linkten giren arkadaş (sade ekran): hiç cevap yok → cevap · en az bir cevap → plan.
 */
export function landingScreen(snap: RoomSnapshot, memberId: ID): ScreenKey {
  if (snap.room.createdBy !== memberId) return hasMyVote(snap, memberId) || hasMyTime(snap, memberId) ? 'plan' : 'cevap';
  if (!hasMyVote(snap, memberId)) return 'fikirler';
  return hasMyTime(snap, memberId) ? 'sonuc' : 'zaman';
}
