// Testlerde kullanılan küçük yardımcılar: elle oda verisi kurmak için.
import type { Idea, RoomSnapshot, Score, Slot } from './types';

export function makeSnap(memberNames: string[], startDate = '2026-11-14'): RoomSnapshot {
  return {
    room: { id: 'r', name: 'Oda', startDate, createdBy: 'm0', createdAt: 0, itemsSeeded: false },
    members: memberNames.map((name, i) => ({ id: `m${i}`, roomId: 'r', name, createdAt: i })),
    ideas: [], ratings: [], availability: [], attendance: [], items: [],
  };
}

export function addIdea(s: RoomSnapshot, id: string, createdAt: number, suggestionId: string | null = null): Idea {
  const idea: Idea = { id, roomId: 'r', name: id, place: '', mapUrl: '', note: '', addedBy: 'm0', suggestionId, createdAt };
  s.ideas.push(idea);
  return idea;
}

export function rate(s: RoomSnapshot, memberId: string, ideaId: string, score: Score | null) {
  s.ratings.push({ roomId: 'r', memberId, ideaId, score, updatedAt: 0 });
}

export function free(s: RoomSnapshot, memberId: string, day: string, slot: Slot) {
  s.availability.push({ roomId: 'r', memberId, day, slot });
}
