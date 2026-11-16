// Küçük tek satır: "✓2 Ali, Veli · ✗1 Ayşe". Hiç cevap yoksa görünmez.
import { copy } from '../copy';
import './VoteLine.css';

export function VoteLine({ yes, no }: { yes: string[]; no: string[] }) {
  if (yes.length + no.length === 0) return null;
  return <p className="sec s13 vline">{copy.who.line(yes.length, yes.join(', '), no.length, no.join(', '))}</p>;
}
