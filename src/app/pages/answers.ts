// Cevap verme işlemleri (iyimser güncelleme ile): fikre ✓/✗, saate dokun, fikir öner.
import { store } from '../runtime';
import type { Idea, RoomSnapshot, Slot, VoteValue } from '../types';
import type { OccasionPick } from '../components/IdeaSheet';
import type { RoomCtx } from './useRoomScreen';

export function answers({ snap, me, mutate }: RoomCtx) {
  const myVote = (ideaId: string) => snap.votes.find((v) => v.ideaId === ideaId && v.memberId === me.id)?.value ?? null;

  function vote(idea: Idea, v: VoteValue) {
    const value = myVote(idea.id) === v ? null : v; // aynı cevaba tekrar basmak kaldırır
    return mutate(
      (s) => ({
        ...s,
        votes: [
          ...s.votes.filter((x) => !(x.ideaId === idea.id && x.memberId === me.id)),
          ...(value ? [{ roomId: s.room.id, memberId: me.id, ideaId: idea.id, value }] : []),
        ],
      }),
      () => store.setVote({ roomId: snap.room.id, memberId: me.id, ideaId: idea.id, value }),
    );
  }

  function toggle(day: string, slot: Slot) {
    const same = (a: { memberId: string; day: string; slot: Slot }) => a.memberId === me.id && a.day === day && a.slot === slot;
    return mutate(
      (s: RoomSnapshot) => ({
        ...s,
        availability: s.availability.some(same)
          ? s.availability.filter((a) => !same(a))
          : [...s.availability, { roomId: s.room.id, memberId: me.id, day, slot }],
      }),
      () => store.toggleAvailability({ roomId: snap.room.id, memberId: me.id, day, slot }),
    );
  }

  const myPlacement = (ideaId: string): OccasionPick => {
    const p = (snap.placements ?? []).find((x) => x.ideaId === ideaId && x.memberId === me.id);
    return p ? { day: p.day, slot: p.slot } : null;
  };

  /** Gün oyu ver (o = null → oyu kaldır) */
  async function placeVote(idea: Idea, o: OccasionPick) {
    await mutate(
      (s) => ({
        ...s,
        placements: [
          ...(s.placements ?? []).filter((p) => !(p.ideaId === idea.id && p.memberId === me.id)),
          ...(o ? [{ roomId: s.room.id, memberId: me.id, ideaId: idea.id, day: o.day, slot: o.slot }] : []),
        ],
      }),
      () => store.setPlacement({ roomId: snap.room.id, memberId: me.id, ideaId: idea.id, day: o?.day ?? null, slot: o?.slot ?? null }),
    );
  }

  /** Bir fikrin ✓ ve ✗ diyenlerinin adları (üye sırasıyla) */
  const voters = (ideaId: string, value: VoteValue) =>
    snap.members.filter((m) => snap.votes.some((v) => v.ideaId === ideaId && v.memberId === m.id && v.value === value)).map((m) => m.name);

  return { myVote, vote, toggle, myPlacement, placeVote, voters };
}
