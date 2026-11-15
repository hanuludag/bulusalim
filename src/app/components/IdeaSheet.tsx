// Fikir ekleme / düzenleme paneli (§6, §18, §19).
import { useId, useState } from 'react';
import { copy } from '../copy';
import { SUGGESTIONS, findSuggestion } from '../suggestions';
import { isValidMapUrl } from '../mapUrl';
import type { Idea } from '../types';
import { findByName, sameName } from '../../core/names';
import { Sheet } from '../../core/components/Sheet';

export interface IdeaDraft {
  name: string;
  place: string;
  mapUrl: string;
  note: string;
  suggestionId: string | null;
}

export interface IdeaSheetProps {
  open: boolean;
  editing: Idea | null;
  initialName?: string;
  initialSuggestionId?: string | null;
  ideas: Idea[];
  onClose: () => void;
  onSubmit: (draft: IdeaDraft) => Promise<boolean>;
}

export function IdeaSheet(props: IdeaSheetProps) {
  // Panel her açılışta temiz başlasın diye içerik ayrı bileşende (key ile sıfırlanır)
  if (!props.open) return null;
  return <IdeaSheetBody key={props.editing?.id ?? props.initialName ?? 'new'} {...props} />;
}

function IdeaSheetBody({ editing, initialName = '', initialSuggestionId = null, ideas, onClose, onSubmit }: IdeaSheetProps) {
  const titleId = useId();
  const [name, setName] = useState(editing?.name ?? initialName);
  const [place, setPlace] = useState(editing?.place ?? '');
  const [mapUrl, setMapUrl] = useState(editing?.mapUrl ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [more, setMore] = useState(!!(editing?.mapUrl || editing?.note));
  const [errors, setErrors] = useState<{ name?: string; map?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = copy.ideaSheet.errName;
    else {
      const dup = ideas.find((i) => i.id !== editing?.id && sameName(i.name, name));
      if (dup) next.name = copy.ideaSheet.errDuplicate;
    }
    if (!isValidMapUrl(mapUrl)) {
      next.map = copy.ideaSheet.errMap;
      setMore(true);
    }
    setErrors(next);
    if (next.name || next.map) {
      requestAnimationFrame(() => document.getElementById(next.name ? 'idea-name' : 'idea-map')?.focus());
      return;
    }
    // Öneri bağlantısı: ad hâlâ önerinin adıysa korunur; elle yazılan ad bir öneriyle aynıysa ona bağlanır.
    const keep = findSuggestion(editing ? editing.suggestionId : initialSuggestionId);
    const suggestionId =
      keep && sameName(keep.name, name) ? keep.id : (findByName([...SUGGESTIONS], name)?.id ?? null);

    setBusy(true);
    const ok = await onSubmit({ name, place, mapUrl, note, suggestionId });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Sheet open onClose={onClose} labelledBy={titleId} as="form" onSubmit={() => void submit()}>
      <h2 id={titleId} className="h1">
        {editing ? copy.ideaSheet.titleEdit : copy.ideaSheet.titleAdd}
      </h2>
      <div className="fld">
        <label htmlFor="idea-name">{copy.ideaSheet.nameLabel}</label>
        <input
          id="idea-name"
          className="inp"
          placeholder={copy.ideaSheet.nameHint}
          value={name}
          maxLength={60}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'idea-name-err' : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
          }}
        />
        {errors.name && (
          <p id="idea-name-err" className="err">
            {errors.name}
          </p>
        )}
      </div>
      <div className="fld">
        <label htmlFor="idea-place">{copy.ideaSheet.placeLabel}</label>
        <input
          id="idea-place"
          className="inp"
          placeholder={copy.ideaSheet.placeHint}
          value={place}
          maxLength={60}
          autoComplete="off"
          onChange={(e) => setPlace(e.target.value)}
        />
      </div>
      {more ? (
        <>
          <div className="fld">
            <label htmlFor="idea-map">{copy.ideaSheet.mapLabel}</label>
            <input
              id="idea-map"
              className="inp mono"
              type="url"
              inputMode="url"
              placeholder={copy.ideaSheet.mapHint}
              value={mapUrl}
              autoComplete="off"
              aria-invalid={!!errors.map}
              aria-describedby={errors.map ? 'idea-map-err' : undefined}
              onChange={(e) => {
                setMapUrl(e.target.value);
                if (errors.map) setErrors((er) => ({ ...er, map: undefined }));
              }}
            />
            {errors.map && (
              <p id="idea-map-err" className="err">
                {errors.map}
              </p>
            )}
          </div>
          <div className="fld">
            <label htmlFor="idea-note">{copy.ideaSheet.noteLabel}</label>
            <input
              id="idea-note"
              className="inp"
              placeholder={copy.ideaSheet.noteHint}
              value={note}
              maxLength={140}
              autoComplete="off"
              aria-describedby="idea-note-count"
              onChange={(e) => setNote(e.target.value)}
            />
            <p id="idea-note-count" className="hint mono" style={{ textAlign: 'right' }}>
              {copy.ideaSheet.noteCount(note.length)}
            </p>
          </div>
        </>
      ) : (
        <div>
          <button className="tb" type="button" onClick={() => setMore(true)}>
            {copy.ideaSheet.more}
          </button>
        </div>
      )}
      <button className="btn" type="submit" disabled={busy}>
        {editing ? copy.ideaSheet.submitEdit : copy.ideaSheet.submitAdd}
      </button>
    </Sheet>
  );
}
