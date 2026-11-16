// "Buluşmaları günlere dağıt" önizlemesi: öneriyi gösterir, "Dağıt" ile kaydeder.
import { useId, useState } from 'react';
import { copy } from '../copy';
import type { Assignment } from '../distribute';
import { slotLower } from '../slots';
import { formatDate } from '../../core/format';
import { Sheet } from '../../core/components/Sheet';

export function DistributeSheet({ open, items, onClose, onApply }: { open: boolean; items: Assignment[]; onClose: () => void; onApply: () => Promise<void> }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} labelledBy={id}>
      <h2 id={id} className="h1">{copy.result.distribute}</h2>
      <p className="sec s13">{copy.result.distributeSub}</p>
      <ol className="plan">
        {items.map((a) => (
          <li key={a.idea.id} className="plan-row">
            <p className="mono s13 plan-when">
              {formatDate(a.day)} {slotLower(a.slot)} <span className="sec">· {copy.result.distributeRow(a.freeCount)}</span>
            </p>
            <p className="plan-what">{a.idea.place ? `${a.idea.name} · ${a.idea.place}` : a.idea.name}</p>
          </li>
        ))}
      </ol>
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onApply();
          setBusy(false);
        }}
      >
        {copy.result.distributeApply}
      </button>
      <button className="btn2" type="button" onClick={onClose}>
        {copy.menu.cancel}
      </button>
    </Sheet>
  );
}
