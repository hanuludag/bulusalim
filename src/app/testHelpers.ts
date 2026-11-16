// Testlerde elle oda verisi kurmak için yardımcılar.
import type { Idea, RoomSnapshot, Slot, VoteValue } from './types';

export function makeSnap(names: string[], startDate = '2026-11-14'): RoomSnapshot {
  return {
    room: { id: 'r', name: 'Oda', startDate, createdBy: 'm0', createdAt: 0 },
    members: names.map((name, i) => ({ id: `m${i}`, roomId: 'r', name, createdAt: i })),
    ideas: [], votes: [], availability: [],
  };
}
export function addIdea(s: RoomSnapshot, id: string, createdAt: number): Idea {
  const idea: Idea = { id, roomId: 'r', name: id, place: '', note: '', addedBy: 'm0', suggestionId: null, createdAt };
  s.ideas.push(idea);
  return idea;
}
export const vote = (s: RoomSnapshot, memberId: string, ideaId: string, value: VoteValue) =>
  s.votes.push({ roomId: 'r', memberId, ideaId, value });
export const free = (s: RoomSnapshot, memberId: string, day: string, slot: Slot) =>
  s.availability.push({ roomId: 'r', memberId, day, slot });
