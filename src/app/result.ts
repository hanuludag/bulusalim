// Sonuç hesabı. Saf fonksiyon: aynı girdi → aynı çıktı. Bütün ekranlar sonucu buradan alır.
// Fikirler bir güne+dilime ("etkinlik zamanı") ait olabilir: her zamanın kendi kazananı olur → plan.
// Günü olmayan fikirler ("herhangi bir gün") eski usul: tek kazanan + en iyi zaman.
import { roomDays } from './days';
import { SLOTS } from './slots';
import type { ID, Idea, RoomSnapshot, Slot, Vote } from './types';

export interface IdeaResult { idea: Idea; yes: number; no: number }
export interface SlotResult { day: string; slot: Slot; freeCount: number; freeIds: ID[] }
/** Bir günün bir dilimi ve oraya eklenen fikirler */
export interface Occasion extends SlotResult { ideas: IdeaResult[]; winner: Idea | null }

export interface Result {
  totalMembers: number;
  voters: ID[]; // en az 1 cevap VEYA en az 1 saat
  waiting: ID[];
  isFinal: boolean;
  ideas: IdeaResult[]; // bütün fikirler, sıralı
  general: IdeaResult[]; // günü olmayan fikirler, sıralı
  winnerIdea: Idea | null; // günü olmayan fikirlerin kazananı
  plan: Occasion[]; // fikri olan gün+dilimler, gün sırasıyla
  slots: SlotResult[]; // oda günleri × 2 dilim, gün sırasıyla
  bestSlot: { day: string; slot: Slot; freeCount: number } | null;
  allFreeSlots: Array<{ day: string; slot: Slot }>;
}

const rank = (list: IdeaResult[]) => list.sort((a, b) => b.yes - a.yes || a.no - b.no || a.idea.createdAt - b.idea.createdAt);
const winnerOf = (list: IdeaResult[]) => (list[0] && list[0].yes >= 1 ? list[0].idea : null);
const tally = (idea: Idea, votes: Vote[]): IdeaResult => ({
  idea,
  yes: votes.filter((v) => v.ideaId === idea.id && v.value === 'yes').length,
  no: votes.filter((v) => v.ideaId === idea.id && v.value === 'no').length,
});

export function computeResult(snap: RoomSnapshot): Result {
  const memberIds = snap.members.map((m) => m.id);
  const isMember = new Set(memberIds);
  const days = roomDays(snap.room);
  const daySet = new Set(days);
  const votes = snap.votes.filter((v) => isMember.has(v.memberId));
  const avail = snap.availability.filter((a) => isMember.has(a.memberId) && daySet.has(a.day));

  const answered = new Set<ID>([...votes.map((v) => v.memberId), ...avail.map((a) => a.memberId)]);
  const voters = memberIds.filter((id) => answered.has(id));
  const waiting = memberIds.filter((id) => !answered.has(id));

  // Fikirler: onay çok → onaylamama az → eski önce. Eleme yok.
  const dated = (i: Idea) => !!(i.day && i.slot && daySet.has(i.day));
  const ideas = rank(snap.ideas.map((i) => tally(i, votes)));
  const general = ideas.filter((r) => !dated(r.idea));

  // Zaman
  const slots: SlotResult[] = [];
  const plan: Occasion[] = [];
  days.forEach((day) =>
    SLOTS.forEach((slot) => {
      const freeIds = memberIds.filter((id) => avail.some((a) => a.memberId === id && a.day === day && a.slot === slot));
      const s = { day, slot, freeCount: freeIds.length, freeIds };
      slots.push(s);
      const here = ideas.filter((r) => dated(r.idea) && r.idea.day === day && r.idea.slot === slot);
      if (here.length) plan.push({ ...s, ideas: here, winner: winnerOf(here) });
    }),
  );
  let best: SlotResult | null = null;
  for (const s of slots) {
    if (s.freeCount === 0) continue;
    if (!best || s.freeCount > best.freeCount) best = s; // eşitlikte erken gün, sonra gündüz
  }
  const total = memberIds.length;

  return {
    totalMembers: total,
    voters,
    waiting,
    isFinal: waiting.length === 0 && total > 0,
    ideas,
    general,
    winnerIdea: winnerOf(general),
    plan,
    slots,
    bestSlot: best ? { day: best.day, slot: best.slot, freeCount: best.freeCount } : null,
    allFreeSlots: total > 0 ? slots.filter((s) => s.freeCount === total).map((s) => ({ day: s.day, slot: s.slot })) : [],
  };
}
