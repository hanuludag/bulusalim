// Paylaşma metinleri (§21, §21a). Gönderme işi core/share.ts'te.
import { formatDate, joinNames, withSuffix } from '../core/format';
import { copy } from './copy';
import type { Result } from './result';
import { slotHours, slotLower } from './slots';
import type { RoomSnapshot } from './types';

export function roomLink(roomId: string): string {
  return `${window.location.origin}/r/${roomId}`;
}

export function firstShareText(roomName: string, link: string): string {
  return copy.share.first(roomName, link);
}

export function waitingNames(snap: RoomSnapshot, result: Result): string {
  return joinNames(result.waiting.map((id) => snap.members.find((m) => m.id === id)?.name ?? ''));
}

export function remindText(snap: RoomSnapshot, result: Result, link: string): string {
  return copy.share.remind(snap.room.name, result.totalMembers, withSuffix(result.voters.length), waitingNames(snap, result), link);
}

/** Kazanan ve zaman varsa sonuç metni; yoksa ilk paylaşım metnine düşer. */
export function resultText(snap: RoomSnapshot, result: Result, link: string): string {
  const w = result.winnerIdea;
  const b = result.bestSlot;
  if (!w || !b) return firstShareText(snap.room.name, link);
  return copy.share.result(
    snap.room.name,
    w.name,
    w.place,
    formatDate(b.day),
    slotLower(b.slot),
    slotHours(b.slot),
    result.attendance.yes,
    result.totalMembers,
    link,
  );
}
