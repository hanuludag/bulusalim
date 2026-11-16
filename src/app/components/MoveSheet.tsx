// Fikrin zamanını değiştir: gün (ya da herhangi bir gün) + gündüz/akşam.
import { useId, useState } from 'react';
import { copy } from '../copy';
import { SLOTS, slotLabel } from '../slots';
import type { Idea } from '../types';
import type { OccasionPick } from './IdeaSheet';
import { formatDate } from '../../core/format';
import { Sheet } from '../../core/components/Sheet';

interface Props {
  idea: Idea; days: string[]; onClose: () => void; onSave: (o: OccasionPick) => Promise<void>;
  /** Başlangıç seçimi (verilmezse fikrin kendi zamanı) */
  initial?: OccasionPick;
  /** Başlık (verilmezse fikrin adı) */
  title?: string;
  /** "Gün yok" düğmesinin yazısı (verilmezse "Herhangi bir gün") */
  anyLabel?: string;
}

// Fikrin zamanını seçme paneli. Hem "Zamanını değiştir" hem gün oyu için kullanılır.
export function MoveSheet({ idea, ...rest }: Omit<Props, 'idea'> & { idea: Idea | null }) {
  if (!idea) return null;
  return <Body key={idea.id} idea={idea} {...rest} />;
}

function Body({ idea, days, onClose, onSave, initial, title, anyLabel }: Props) {
  const id = useId();
  const [o, setO] = useState<OccasionPick>(initial !== undefined ? initial : idea.day && idea.slot ? { day: idea.day, slot: idea.slot } : null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open onClose={onClose} labelledBy={id}>
      <h2 id={id} className="h1">{title ?? idea.name}</h2>
      {title && <p className="sec">{idea.name}</p>}
      <div className="occ">
        <p className="sec s13">{copy.occasion.dayLabel}</p>
        <div className="occ-row">
          <button type="button" className="btn2 sm" aria-pressed={!o} onClick={() => setO(null)}>
            {anyLabel ?? copy.occasion.any}
          </button>
          {days.map((d) => (
            <button key={d} type="button" className="btn2 sm" aria-pressed={o?.day === d} onClick={() => setO({ day: d, slot: o?.slot ?? 'gunduz' })}>
              {formatDate(d)}
            </button>
          ))}
        </div>
        {o && (
          <>
            <p className="sec s13">{copy.occasion.slotLabel}</p>
            <div className="occ-row">
              {SLOTS.map((s) => (
                <button key={s} type="button" className="btn2 sm" aria-pressed={o.slot === s} onClick={() => setO({ day: o.day, slot: s })}>
                  {slotLabel(s)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onSave(o);
          setBusy(false);
        }}
      >
        {copy.menu.save}
      </button>
    </Sheet>
  );
}
