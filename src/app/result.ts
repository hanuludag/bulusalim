// Sonuç hesabı (§15). Saf fonksiyon: aynı girdi → aynı çıktı, hiçbir yere yazmaz.
import { weekDays } from '../core/format';
import { SLOTS, slotIndex } from './slots';
import type { ID, Idea, RoomSnapshot, Slot } from './types';

export interface IdeaResult {
  idea: Idea;
  avg: number | null;
  ratedCount: number;
  minScore: number | null;
  vetoedBy: ID[];
  eliminated: boolean;
}

export interface SlotResult {
  day: string;
  slot: Slot;
  freeCount: number;
  freeIds: ID[];
}

export interface Result {
  totalMembers: number;
  voters: ID[];
  waiting: ID[];
  isFinal: boolean;
  ideas: IdeaResult[];
  winnerIdea: Idea | null;
  slots: SlotResult[];
  bestSlot: { day: string; slot: Slot; freeCount: number } | null;
  topSlots: Array<{ day: string; slot: Slot; freeCount: number }>;
  attendance: { yes: number; no: number; undecided: number };
}

/** avg yüksek → ratedCount çok → createdAt eski. avg null olanlar en altta. */
function compareIdeas(a: IdeaResult, b: IdeaResult): number {
  if (a.avg === null && b.avg !== null) return 1;
  if (a.avg !== null && b.avg === null) return -1;
  if (a.avg !== null && b.avg !== null && a.avg !== b.avg) return b.avg - a.avg;
  if (a.ratedCount !== b.ratedCount) return b.ratedCount - a.ratedCount;
  return a.idea.createdAt - b.idea.createdAt;
}

export function computeResult(snap: RoomSnapshot): Result {
  const memberIds = snap.members.map((m) => m.id);
  const isMember = new Set(memberIds);

  const ratings = snap.ratings.filter((r) => r.score !== null && isMember.has(r.memberId));
  const days = weekDays(snap.room.startDate);
  const daySet = new Set(days);
  const avail = snap.availability.filter((a) => isMember.has(a.memberId) && daySet.has(a.day));

  // cevap verdi = en az 1 puan VEYA en az 1 saat. Katılım sayılmaz.
  const answered = new Set<ID>();
  ratings.forEach((r) => answered.add(r.memberId));
  avail.forEach((a) => answered.add(a.memberId));
  const voters = memberIds.filter((id) => answered.has(id));
  const waiting = memberIds.filter((id) => !answered.has(id));

  // Fikirler
  const ideas: IdeaResult[] = snap.ideas.map((idea) => {
    const rs = ratings.filter((r) => r.ideaId === idea.id);
    const scores = rs.map((r) => r.score as number);
    const vetoedBy = rs.filter((r) => r.score === 1).map((r) => r.memberId);
    return {
      idea,
      avg: scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : null,
      ratedCount: scores.length,
      minScore: scores.length ? Math.min(...scores) : null,
      vetoedBy,
      eliminated: vetoedBy.length > 0,
    };
  });
  const alive = ideas.filter((i) => !i.eliminated).sort(compareIdeas);
  const out = ideas.filter((i) => i.eliminated).sort(compareIdeas);
  const sortedIdeas = [...alive, ...out];
  const winnerIdea = alive.find((i) => i.avg !== null)?.idea ?? null;

  // Zaman: 7 gün × 3 dilim
  const slots: SlotResult[] = [];
  days.forEach((day) => {
    SLOTS.forEach((slot) => {
      const freeIds = memberIds.filter((id) => avail.some((a) => a.memberId === id && a.day === day && a.slot === slot));
      slots.push({ day, slot, freeCount: freeIds.length, freeIds });
    });
  });
  slots.sort((a, b) => {
    if (a.freeCount !== b.freeCount) return b.freeCount - a.freeCount;
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    return slotIndex(a.slot) - slotIndex(b.slot);
  });
  const strip = (s: SlotResult) => ({ day: s.day, slot: s.slot, freeCount: s.freeCount });
  const positive = slots.filter((s) => s.freeCount > 0);
  const bestSlot = positive.length ? strip(positive[0]) : null;
  const topSlots = positive.slice(0, 3).map(strip);

  // Katılım (sonucu etkilemez)
  let yes = 0;
  let no = 0;
  memberIds.forEach((id) => {
    const a = snap.attendance.find((x) => x.memberId === id);
    if (a?.status === 'yes') yes++;
    else if (a?.status === 'no') no++;
  });

  return {
    totalMembers: memberIds.length,
    voters,
    waiting,
    isFinal: waiting.length === 0 && memberIds.length > 0,
    ideas: sortedIdeas,
    winnerIdea,
    slots,
    bestSlot,
    topSlots,
    attendance: { yes, no, undecided: memberIds.length - yes - no },
  };
}
