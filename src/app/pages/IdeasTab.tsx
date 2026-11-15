// Fikirler sekmesi (§6): öneriler, fikir listesi, puanlama, ekleme/düzenleme/silme.
import { useState } from 'react';
import { copy } from '../copy';
import { store } from '../runtime';
import type { Idea, Rating, RoomSnapshot, Score } from '../types';
import type { Suggestion } from '../suggestions';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { useToast } from '../../core/useToast';
import { SuggestionStrip } from '../components/SuggestionStrip';
import { IdeaRow } from '../components/IdeaRow';
import { IdeaSheet, type IdeaDraft } from '../components/IdeaSheet';
import type { RoomCtx } from './roomCtx';
import './IdeasTab.css';

type SheetState = { open: false } | { open: true; editing: Idea | null; name?: string; suggestionId?: string | null };

export default function IdeasTab({ ctx }: { ctx: RoomCtx }) {
  const { snap, me, dev, updateDev, mutate, guide, goTab, refresh } = ctx;
  const toast = useToast();
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [toDelete, setToDelete] = useState<Idea | null>(null);

  const myScore = (ideaId: string) =>
    snap.ratings.find((r) => r.ideaId === ideaId && r.memberId === me.id)?.score ?? null;
  const ratedCount = (ideaId: string) => snap.ratings.filter((r) => r.ideaId === ideaId && r.score !== null).length;
  const myRatedTotal = snap.ideas.filter((i) => myScore(i.id) !== null).length;

  function rate(idea: Idea, n: number) {
    const current = myScore(idea.id);
    const score = (current === n ? null : n) as Score | null; // aynı puana tekrar basmak kaldırır
    if (score !== null && !dev.hints.rating) updateDev({ hints: { rating: true } });
    const apply = (s: RoomSnapshot): RoomSnapshot => {
      const others = s.ratings.filter((r) => !(r.ideaId === idea.id && r.memberId === me.id));
      const next: Rating = { roomId: s.room.id, memberId: me.id, ideaId: idea.id, score, updatedAt: Date.now() };
      return { ...s, ratings: [...others, next] };
    };
    void mutate(apply, () => store.setRating({ roomId: snap.room.id, memberId: me.id, ideaId: idea.id, score }));
  }

  async function save(draft: IdeaDraft): Promise<boolean> {
    try {
      if (sheet.open && sheet.editing) {
        await store.updateIdea(sheet.editing.id, {
          name: draft.name,
          place: draft.place,
          mapUrl: draft.mapUrl,
          note: draft.note,
        });
      } else {
        await store.addIdea(snap.room.id, {
          name: draft.name,
          place: draft.place,
          mapUrl: draft.mapUrl,
          note: draft.note,
          suggestionId: draft.suggestionId ?? undefined,
          addedBy: me.id,
        });
      }
      await refresh();
      return true;
    } catch (e) {
      console.error('[bulusalim] Fikir kaydedilemedi', e);
      toast.show(copy.common.saveFailed);
      return false;
    }
  }

  async function confirmDelete() {
    const idea = toDelete;
    setToDelete(null);
    if (!idea) return;
    await mutate(
      (s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== idea.id), ratings: s.ratings.filter((r) => r.ideaId !== idea.id) }),
      () => store.deleteIdea(idea.id),
      { toast: false },
    );
  }

  const openAdd = (s?: Suggestion) => setSheet({ open: true, editing: null, name: s?.name, suggestionId: s?.id ?? null });
  const hasIdeas = snap.ideas.length > 0;

  return (
    <>
      <div className="pad tab-head">
        <h1 className="h1">{copy.ideas.title}</h1>
        {hasIdeas && <span className="mono s13">{copy.ideas.ratedCount(myRatedTotal, snap.ideas.length)}</span>}
      </div>

      <SuggestionStrip ideas={snap.ideas} onPick={openAdd} />

      {hasIdeas ? (
        <>
          <div className="pad ideas-scale">
            <span className="mono s13">{copy.ideas.scale}</span>
            {guide && (
              <button className="btn2 sm" type="button" onClick={() => openAdd()}>
                {copy.ideas.add}
              </button>
            )}
          </div>
          <ul>
            {snap.ideas.map((idea, i) => (
              <IdeaRow
                key={idea.id}
                idea={idea}
                myScore={myScore(idea.id)}
                ratedCount={ratedCount(idea.id)}
                mine={idea.addedBy === me.id}
                showHint={i === 0 && !dev.hints.rating}
                onRate={(n) => rate(idea, n)}
                onEdit={() => setSheet({ open: true, editing: idea })}
                onDelete={() => setToDelete(idea)}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className="pad ideas-empty-wrap">
          <div className="ideas-empty">
            <p className="s17 m">{copy.ideas.empty}</p>
            <button className="btn2 sm" type="button" onClick={() => openAdd()}>
              {copy.ideas.add}
            </button>
          </div>
        </div>
      )}

      <div className="grow" />
      {guide ? (
        <div className="dock above-tabs">
          <button className="btn" type="button" onClick={() => goTab('zaman')}>
            {copy.ideas.next}
          </button>
        </div>
      ) : (
        hasIdeas && (
          <div className="dock above-tabs">
            <button className="btn" type="button" onClick={() => openAdd()}>
              {copy.ideas.add}
            </button>
          </div>
        )
      )}

      <IdeaSheet
        open={sheet.open}
        editing={sheet.open ? sheet.editing : null}
        initialName={sheet.open ? sheet.name : undefined}
        initialSuggestionId={sheet.open ? sheet.suggestionId : null}
        ideas={snap.ideas}
        onClose={() => setSheet({ open: false })}
        onSubmit={save}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={toDelete ? copy.ideas.deleteTitle(toDelete.name) : ''}
        body={copy.ideas.deleteSub}
        confirmLabel={copy.ideas.delete}
        cancelLabel={copy.ideas.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
