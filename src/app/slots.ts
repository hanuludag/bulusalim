// Gün dilimleri ve etiketleri (§17). Tire en-dash (–).
import type { Slot } from './types';

export const SLOTS: readonly Slot[] = ['sabah', 'ogle', 'aksam'];

const LABELS: Record<Slot, { label: string; hours: string }> = {
  sabah: { label: 'Sabah', hours: '10–13' },
  ogle: { label: 'Öğle', hours: '13–17' },
  aksam: { label: 'Akşam', hours: '17–21' },
};

/** "Öğle" */
export function slotLabel(slot: Slot): string {
  return LABELS[slot].label;
}

/** cümle içi: "öğle" */
export function slotLower(slot: Slot): string {
  return LABELS[slot].label.toLocaleLowerCase('tr');
}

/** "13–17" */
export function slotHours(slot: Slot): string {
  return LABELS[slot].hours;
}

/** Sıralama için: sabah 0, öğle 1, akşam 2 */
export function slotIndex(slot: Slot): number {
  return SLOTS.indexOf(slot);
}
