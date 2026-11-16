// Odanın buluşulabilecek günleri. Yeni odalarda gün gün seçilir; eski odalarda başlangıçtan 7 gün.
import { addDays, parseDay, todayString, toDayString, weekDays } from '../core/format';
import type { Room } from './types';

export function roomDays(room: Pick<Room, 'startDate' | 'days'>): string[] {
  return room.days && room.days.length > 0 ? [...room.days].sort() : weekDays(room.startDate);
}

/** Tekrarsız + sıralı */
export function normalizeDays(days: string[]): string[] {
  return [...new Set(days)].sort();
}

/** Bugünden itibaren n gün */
export function nextDays(n: number, from = todayString()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

/** Takvim: bu haftanın pazartesisinden başlayan `weeks` hafta (her hafta Pzt..Paz). */
export function calendarWeeks(weeks: number, today = todayString()): string[][] {
  const d = parseDay(today);
  const monday = toDayString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(monday, w * 7 + i)));
}

export const isWeekend = (day: string) => [0, 6].includes(parseDay(day).getDay());
