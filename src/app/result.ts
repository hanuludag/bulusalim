// Sonuç hesabı. Saf fonksiyon: aynı girdi → aynı çıktı. Bütün ekranlar sonucu buradan alır.
// Fikirler bir güne+dilime ("etkinlik zamanı") ait olabilir: her zamanın kendi kazananı olur → plan.
// Gün oylaması açıksa günü olmayan fikir, en çok gün oyu aldığı zamana gider.
// Hâlâ günü olmayan fikirler ("herhangi bir gün") eski usul: tek kazanan + en iyi zaman.
import { roomDays } from './days';
import { SLOTS } from './slots';
import type { ID, Idea, RoomSnapshot, Slot, Vote } from './types';

/** Gün oylamasında bir fikrin en çok oy alan zamanı */
export interface DayVote { day: string; slot: Slot; count: number }
export interface IdeaResult { idea: Idea; yes: number; no: number; dayVote?: DayVote | null }
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

  // Herkesin boş olduğu kişi sayısı (gün oyu eşitliğini bozmak için)
  const freeAt = (day: string, slot: Slot) => new Set(avail.filter((a) => a.day === day && a.slot === slot).map((a) => a.memberId)).size;

  // Gün oylaması açıksa: günü olmayan fikrin zamanı = en çok gün oyu alan gün+dilim
  // (eşitlikte daha çok kişinin boş olduğu, sonra erken gün, sonra gündüz)
  const placements = snap.room.dayVoting ? (snap.placements ?? []).filter((p) => isMember.has(p.memberId) && daySet.has(p.day)) : [];
  const dayVoteOf = (idea: Idea): DayVote | null => {
    const counts = new Map<string, DayVote>();
    placements
      .filter((p) => p.ideaId === idea.id)
      .forEach((p) => {
        const k = `${p.day}|${p.slot}`;
        const c = counts.get(k) ?? { day: p.day, slot: p.slot, count: 0 };
        c.count++;
        counts.set(k, c);
      });
    const order = (d: DayVote) => days.indexOf(d.day) * 2 + SLOTS.indexOf(d.slot);
    return [...counts.values()].sort((a, b) => b.count - a.count || freeAt(b.day, b.slot) - freeAt(a.day, a.slot) || order(a) - order(b))[0] ?? null;
  };
  const occasionOf = (r: IdeaResult): { day: string; slot: Slot } | null => {
    const i = r.idea;
    if (i.day && i.slot && daySet.has(i.day)) return { day: i.day, slot: i.slot };
    return r.dayVote ?? null;
  };

  // Fikirler: onay çok → onaylamama az → eski önce. Eleme yok.
  const ideas = rank(
    snap.ideas.map((i) => {
      const t = tally(i, votes);
      return !(i.day && i.slot && daySet.has(i.day)) && snap.room.dayVoting ? { ...t, dayVote: dayVoteOf(i) } : t;
    }),
  );
  const general = ideas.filter((r) => !occasionOf(r));

  // Zaman
  const slots: SlotResult[] = [];
  const plan: Occasion[] = [];
  days.forEach((day) =>
    SLOTS.forEach((slot) => {
      const freeIds = memberIds.filter((id) => avail.some((a) => a.memberId === id && a.day === day && a.slot === slot));
      const s = { day, slot, freeCount: freeIds.length, freeIds };
      slots.push(s);
      const here = ideas.filter((r) => {
        const o = occasionOf(r);
        return o && o.day === day && o.slot === slot;
      });
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
