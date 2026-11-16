// Fikirleri zamanlarına göre gruplar: önce "herhangi bir gün", sonra oda günleri × dilimler.
import { roomDays } from './days';
import { SLOTS } from './slots';
import type { Idea, RoomSnapshot, Slot } from './types';

export interface SlotGroup { slot: Slot; ideas: Idea[] }
export interface DayGroup { day: string; slots: SlotGroup[] }
export interface IdeaGroups { general: Idea[]; days: DayGroup[] }

export function groupIdeas(snap: RoomSnapshot): IdeaGroups {
  const days = roomDays(snap.room);
  const inRoom = new Set(days);
  const general = snap.ideas.filter((i) => !(i.day && i.slot && inRoom.has(i.day)));
  return {
    general,
    days: days.map((day) => ({
      day,
      slots: SLOTS.map((slot) => ({ slot, ideas: snap.ideas.filter((i) => i.day === day && i.slot === slot) })).filter((g) => g.ideas.length > 0),
    })),
  };
}
