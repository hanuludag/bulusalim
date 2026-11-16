// Gün dilimleri ve etiketleri (v2: gündüz / akşam). Tire en-dash (–).
import type { Slot } from './types';

export const SLOTS: readonly Slot[] = ['gunduz', 'aksam'];
const LABELS: Record<Slot, { label: string; hours: string }> = {
  gunduz: { label: 'Gündüz', hours: '10–17' },
  aksam: { label: 'Akşam', hours: '17–21' },
};
export const slotLabel = (s: Slot) => LABELS[s].label;
export const slotLower = (s: Slot) => LABELS[s].label.toLocaleLowerCase('tr');
export const slotHours = (s: Slot) => LABELS[s].hours;
export const slotIndex = (s: Slot) => SLOTS.indexOf(s);
