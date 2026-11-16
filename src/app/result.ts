// Sonuç hesabı (v2). Saf fonksiyon: aynı girdi → aynı çıktı. Bütün ekranlar sonucu buradan alır.
import { weekDays } from '../core/format';
import { SLOTS } from './slots';
import type { ID, Idea, RoomSnapshot, Slot } from './types';

export interface IdeaResult { idea: Idea; yes: number; no: number }
export interface SlotResult { day: string; slot: Slot; freeCount: number; freeIds: ID[] }

export interface Result {
  totalMembers: number;
  voters: ID[]; // en az 1 cevap VEYA en az 1 saat
  waiting: ID[];
  isFinal: boolean;
  ideas: IdeaResult[]; // sıralı
  winnerIdea: Idea | null;
  slots: SlotResult[]; // 7 gün × 2 dilim = 14, gün sırasıyla
  bestSlot: { day: string; slot: Slot; freeCount: number } | null;
  allFreeSlots: Array<{ day: string; slot: Slot }>;
}

export function computeResult(snap: RoomSnapshot): Result {
  const memberIds = snap.members.map((m) => m.id);
  const isMember = new Set(memberIds);
  const days = weekDays(snap.room.startDate);
  const daySet = new Set(days);
  const votes = snap.votes.filter((v) => isMember.has(v.memberId));
  const avail = snap.availability.filter((a) => isMember.has(a.memberId) && daySet.has(a.day));

  const answered = new Set<ID>([...votes.map((v) => v.memberId), ...avail.map((a) => a.memberId)]);
  const voters = memberIds.filter((id) => answered.has(id));
  const waiting = memberIds.filter((id) => !answered.has(id));

  // Fikirler: yes çok → no az → eski önce. Eleme yok.
  const ideas = snap.ideas
    .map((idea) => ({
      idea,
      yes: votes.filter((v) => v.ideaId === idea.id && v.value === 'yes').length,
      no: votes.filter((v) => v.ideaId === idea.id && v.value === 'no').length,
    }))
    .sort((a, b) => b.yes - a.yes || a.no - b.no || a.idea.createdAt - b.idea.createdAt);
  const winnerIdea = ideas[0] && ideas[0].yes >= 1 ? ideas[0].idea : null;

  // Zaman
  const slots: SlotResult[] = [];
  days.forEach((day) =>
    SLOTS.forEach((slot) => {
      const freeIds = memberIds.filter((id) => avail.some((a) => a.memberId === id && a.day === day && a.slot === slot));
      slots.push({ day, slot, freeCount: freeIds.length, freeIds });
    }),
  );
  let best: SlotResult | null = null;
  for (const s of slots) {
    if (s.freeCount === 0) continue;
    if (!best || s.freeCount > best.freeCount) best = s; // slots zaten gün ve dilim sırasında: eşitlikte ilk kalır
  }
  const total = memberIds.length;

  return {
    totalMembers: total,
    voters,
    waiting,
    isFinal: waiting.length === 0 && total > 0,
    ideas,
    winnerIdea,
    slots,
    bestSlot: best ? { day: best.day, slot: best.slot, freeCount: best.freeCount } : null,
    allFreeSlots: total > 0 ? slots.filter((s) => s.freeCount === total).map((s) => ({ day: s.day, slot: s.slot })) : [],
  };
}
