// Küçük tek satır: "✓2 Ali, Veli · ✗1 Ayşe". Hiç cevap yoksa görünmez.
import { copy } from '../copy';
import './VoteLine.css';
import { slotLower } from '../slots';
import type { Idea } from '../types';
import { formatDate } from '../../core/format';

export function VoteLine({ yes, no }: { yes: string[]; no: string[] }) {
  if (yes.length + no.length === 0) return null;
  return <p className="sec s13 vline">{copy.who.line(yes.length, yes.join(', '), no.length, no.join(', '))}</p>;
}

/** Kurucunun dağıttığı zaman (dağıtma açıkken) */
export function AssignedLine({ idea, active }: { idea: Idea; active: boolean }) {
  if (!active || idea.day || !idea.assignedDay || !idea.assignedSlot) return null;
  return <p className="sec s13 vline">{copy.distribution.by(`${formatDate(idea.assignedDay)} ${slotLower(idea.assignedSlot)}`)}</p>;
}
