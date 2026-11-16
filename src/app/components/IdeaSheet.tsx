// Fikir ekleme / düzenleme paneli. Eklerken üstte öneri şeridi var (öneriye basmak fikri hemen ekler).
import { useId, useState } from 'react';
import { copy } from '../copy';
import { SUGGESTIONS, type Suggestion } from '../suggestions';
import type { Idea, Slot } from '../types';
import { SLOTS, slotLabel } from '../slots';
import { formatDate } from '../../core/format';
import { findByName, sameName } from '../../core/names';
import { Sheet } from '../../core/components/Sheet';
import { SuggestionStrip } from './SuggestionStrip';

/** Fikrin zamanı: null = herhangi bir gün */
export type OccasionPick = { day: string; slot: Slot } | null;
export interface IdeaDraft { name: string; place: string; note: string; suggestionId: string | null; occasion: OccasionPick }
export const sameOccasion = (i: Idea, o: OccasionPick) => (o ? i.day === o.day && i.slot === o.slot : !i.day);

export interface IdeaSheetProps {
  open: boolean;
  editing: Idea | null;
  ideas: Idea[];
  onClose: () => void;
  onSubmit: (d: IdeaDraft) => Promise<boolean>;
  onPickSuggestion: (s: Suggestion, occasion: OccasionPick) => Promise<boolean>;
  /** Oda günleri: verilirse gün/dilim seçici çıkar */
  days?: string[];
  /** Panel açılırken seçili gelen zaman */
  occasion?: OccasionPick;
}

export function IdeaSheet(props: IdeaSheetProps) {
  if (!props.open) return null;
  return <Body key={props.editing?.id ?? 'new'} {...props} />;
}

function Body({ editing, ideas, onClose, onSubmit, onPickSuggestion, days, occasion: initial }: IdeaSheetProps) {
  const titleId = useId();
  const [name, setName] = useState(editing?.name ?? '');
  const [place, setPlace] = useState(editing?.place ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [occasion, setOccasion] = useState<OccasionPick>(initial ?? null);
  // Aynı isim kontrolü sadece aynı gün+dilimde (farklı günlere aynı fikir eklenebilir)
  const ref: OccasionPick = editing ? (editing.day && editing.slot ? { day: editing.day, slot: editing.slot } : null) : occasion;
  const here = ideas.filter((i) => sameOccasion(i, ref));

  async function submit() {
    if (!name.trim()) return setError(copy.ideaSheet.errName);
    if (here.some((i) => i.id !== editing?.id && sameName(i.name, name))) return setError(copy.ideaSheet.errDuplicate);
    setBusy(true);
    const ok = await onSubmit({ name, place, note, suggestionId: findByName([...SUGGESTIONS], name)?.id ?? null, occasion });
    setBusy(false);
    if (ok) onClose();
  }

  async function pick(s: Suggestion) {
    if (await onPickSuggestion(s, occasion)) onClose();
  }

  return (
    <Sheet open onClose={onClose} labelledBy={titleId} as="form" onSubmit={() => void submit()}>
      <h2 id={titleId} className="h1">
        {editing ? copy.ideaSheet.titleEdit : copy.ideaSheet.titleAdd}
      </h2>
      {!editing && days && days.length > 0 && (
        <div className="occ">
          <p className="sec s13">{copy.occasion.dayLabel}</p>
          <div className="occ-row">
            <button type="button" className="btn2 sm" aria-pressed={!occasion} onClick={() => setOccasion(null)}>
              {copy.occasion.any}
            </button>
            {days.map((d) => (
              <button key={d} type="button" className="btn2 sm" aria-pressed={occasion?.day === d} onClick={() => setOccasion({ day: d, slot: occasion?.slot ?? 'gunduz' })}>
                {formatDate(d)}
              </button>
            ))}
          </div>
          {occasion && (
            <>
              <p className="sec s13">{copy.occasion.slotLabel}</p>
              <div className="occ-row">
                {SLOTS.map((s) => (
                  <button key={s} type="button" className="btn2 sm" aria-pressed={occasion.slot === s} onClick={() => setOccasion({ day: occasion.day, slot: s })}>
                    {slotLabel(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {!editing && <SuggestionStrip title ideas={here} onPick={(s) => void pick(s)} />}
      <div className="fld">
        <label htmlFor="idea-name">{copy.ideaSheet.nameLabel}</label>
        <input
          id="idea-name"
          className="inp"
          placeholder={copy.ideaSheet.nameHint}
          value={name}
          maxLength={60}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? 'idea-err' : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
        {error && (
          <p id="idea-err" className="err">
            {error}
          </p>
        )}
      </div>
      <div className="fld">
        <label htmlFor="idea-place">{copy.ideaSheet.placeLabel}</label>
        <input id="idea-place" className="inp" placeholder={copy.ideaSheet.placeHint} value={place} maxLength={60} autoComplete="off" onChange={(e) => setPlace(e.target.value)} />
      </div>
      {showNote ? (
        <div className="fld">
          <label htmlFor="idea-note">{copy.ideaSheet.noteLabel}</label>
          <input id="idea-note" className="inp" placeholder={copy.ideaSheet.noteHint} value={note} maxLength={140} autoComplete="off" aria-describedby="idea-note-count" onChange={(e) => setNote(e.target.value)} />
          <p id="idea-note-count" className="hint mono" style={{ textAlign: 'right' }}>
            {copy.ideaSheet.noteCount(note.length)}
          </p>
        </div>
      ) : (
        <div>
          <button className="tb" type="button" onClick={() => setShowNote(true)}>
            {copy.ideaSheet.addNote}
          </button>
        </div>
      )}
      <button className="btn" type="submit" disabled={busy}>
        {editing ? copy.ideaSheet.submitEdit : copy.ideaSheet.submitAdd}
      </button>
    </Sheet>
  );
}
