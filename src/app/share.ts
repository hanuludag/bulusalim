// Paylaşma metinleri. Gönderme işi core/share.ts'te.
import { formatDate, joinNames } from '../core/format';
import { copy } from './copy';
import type { Result } from './result';
import { slotHours, slotLower } from './slots';
import type { RoomSnapshot } from './types';

export const roomLink = (roomId: string) => `${window.location.origin}/r/${roomId}`;
export const firstShareText = (roomName: string, link: string) => copy.share.first(roomName, link);

export const waitingNames = (snap: RoomSnapshot, r: Result) =>
  joinNames(r.waiting.map((id) => snap.members.find((m) => m.id === id)?.name ?? ''));

export const remindText = (snap: RoomSnapshot, r: Result, link: string) =>
  copy.share.remind(snap.room.name, r.voters.length, r.totalMembers, waitingNames(snap, r), link);

/** Sadece mevcut parçalar yazılır: kazanan fikir ve/veya en iyi zaman. */
export function resultText(snap: RoomSnapshot, r: Result, link: string): string {
  const parts: string[] = [];
  const w = r.winnerIdea;
  if (w) parts.push(w.place ? `${w.name} · ${w.place}` : w.name);
  const b = r.bestSlot;
  if (b) parts.push(`${formatDate(b.day)} ${slotLower(b.slot)} (${slotHours(b.slot)})`);
  return copy.share.result(snap.room.name, parts, link);
}
