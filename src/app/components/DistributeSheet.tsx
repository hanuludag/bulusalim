// "Günlere dağıt" (kurucu, dağıtma açıkken): günü belli olmayan her fikre tek tek zaman seç.
// "Boş olanları otomatik doldur" sadece taslağı doldurur; "Kaydet" demeden hiçbir şey değişmez.
import { useId, useState } from 'react';
import { copy } from '../copy';
import { distribute } from '../distribute';
import type { Result } from '../result';
import { slotLower } from '../slots';
import type { Idea, Slot } from '../types';
import type { OccasionPick } from './IdeaSheet';
import { MoveSheet } from './MoveSheet';
import { formatDate } from '../../core/format';
import { Sheet } from '../../core/components/Sheet';
import './PlanList.css';

export interface DistributeSheetProps {
  open: boolean;
  result: Result;
  days: string[];
  onClose: () => void;
  onSave: (items: Array<{ ideaId: string; day: string | null; slot: Slot | null }>) => Promise<boolean>;
}

export function DistributeSheet(props: DistributeSheetProps) {
  if (!props.open) return null;
  return <Body {...props} />;
}

const current = (i: Idea): OccasionPick => (i.assignedDay && i.assignedSlot ? { day: i.assignedDay, slot: i.assignedSlot } : null);

function Body({ result, days, onClose, onSave }: DistributeSheetProps) {
  const id = useId();
  // Kendi günü olmayan bütün fikirler, onay sırasıyla
  const ideas = result.ideas.filter((r) => !r.idea.day).map((r) => r.idea);
  const [draft, setDraft] = useState<Record<string, OccasionPick>>(() => Object.fromEntries(ideas.map((i) => [i.id, current(i)])));
  const [editing, setEditing] = useState<Idea | null>(null);
  const [busy, setBusy] = useState(false);

  function autoFill() {
    // Taslakta boş olan fikirler; taslakta seçilmiş zamanlar dolu sayılır
    const chosen = Object.values(draft).flatMap((o) => (o ? [`${o.day}|${o.slot}`] : []));
    const empty = result.ideas.filter((r) => !r.idea.day && !draft[r.idea.id]);
    const next = { ...draft };
    distribute(result, empty, chosen).forEach((a) => (next[a.idea.id] = { day: a.day, slot: a.slot }));
    setDraft(next);
  }

  return (
    <>
      <Sheet open={!editing} onClose={onClose} labelledBy={id}>
        <h2 id={id} className="h1">{copy.result.distribute}</h2>
        <p className="sec s13">{copy.result.distributeSub}</p>
        {ideas.length === 0 ? (
          <p className="sec">{copy.result.distributeEmpty}</p>
        ) : (
          <>
            <ul className="dist">
              {ideas.map((i) => {
                const o = draft[i.id];
                return (
                  <li key={i.id} className="dist-row">
                    <span className="dist-name">{i.place ? `${i.name} · ${i.place}` : i.name}</span>
                    <button type="button" className={`btn2 sm dist-when${o ? ' on' : ''}`} onClick={() => setEditing(i)}>
                      {o ? `${formatDate(o.day)} ${slotLower(o.slot)}` : copy.result.distributeNone}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button className="tb sm" type="button" onClick={autoFill}>
              {copy.result.distributeAuto}
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const ok = await onSave(ideas.map((i) => ({ ideaId: i.id, day: draft[i.id]?.day ?? null, slot: draft[i.id]?.slot ?? null })));
                setBusy(false);
                if (ok) onClose();
              }}
            >
              {copy.result.distributeSave}
            </button>
          </>
        )}
      </Sheet>
      <MoveSheet
        idea={editing}
        days={days}
        initial={editing ? draft[editing.id] : null}
        anyLabel={copy.result.distributeSkip}
        onClose={() => setEditing(null)}
        onSave={async (o) => {
          if (editing) setDraft((d) => ({ ...d, [editing.id]: o }));
          setEditing(null);
        }}
      />
    </>
  );
}
