// Fikir ekleme / düzenleme paneli. Eklerken üstte öneri şeridi var (öneriye basmak fikri hemen ekler).
import { useId, useState } from 'react';
import { copy } from '../copy';
import { SUGGESTIONS, type Suggestion } from '../suggestions';
import type { Idea } from '../types';
import { findByName, sameName } from '../../core/names';
import { Sheet } from '../../core/components/Sheet';
import { SuggestionStrip } from './SuggestionStrip';

export interface IdeaDraft { name: string; place: string; note: string; suggestionId: string | null }

export interface IdeaSheetProps {
  open: boolean;
  editing: Idea | null;
  ideas: Idea[];
  onClose: () => void;
  onSubmit: (d: IdeaDraft) => Promise<boolean>;
  onPickSuggestion: (s: Suggestion) => Promise<boolean>;
}

export function IdeaSheet(props: IdeaSheetProps) {
  if (!props.open) return null;
  return <Body key={props.editing?.id ?? 'new'} {...props} />;
}

function Body({ editing, ideas, onClose, onSubmit, onPickSuggestion }: IdeaSheetProps) {
  const titleId = useId();
  const [name, setName] = useState(editing?.name ?? '');
  const [place, setPlace] = useState(editing?.place ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return setError(copy.ideaSheet.errName);
    if (ideas.some((i) => i.id !== editing?.id && sameName(i.name, name))) return setError(copy.ideaSheet.errDuplicate);
    setBusy(true);
    const ok = await onSubmit({ name, place, note, suggestionId: findByName([...SUGGESTIONS], name)?.id ?? null });
    setBusy(false);
    if (ok) onClose();
  }

  async function pick(s: Suggestion) {
    if (await onPickSuggestion(s)) onClose();
  }

  return (
    <Sheet open onClose={onClose} labelledBy={titleId} as="form" onSubmit={() => void submit()}>
      <h2 id={titleId} className="h1">
        {editing ? copy.ideaSheet.titleEdit : copy.ideaSheet.titleAdd}
      </h2>
      {!editing && <SuggestionStrip title ideas={ideas} onPick={(s) => void pick(s)} />}
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
