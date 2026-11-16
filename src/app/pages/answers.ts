// Cevap verme işlemleri (iyimser güncelleme ile): fikre ✓/✗, saate dokun, fikir öner.
import { store } from '../runtime';
import type { Idea, RoomSnapshot, Slot, VoteValue } from '../types';
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

  return { myVote, vote, toggle };
}
