// Fikirler ekranı: fikirleri onayla / onaylama, fikir ekle, düzenle, sil.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { store } from '../runtime';
import { hasMyVote } from '../landing';
import type { Idea, VoteValue } from '../types';
import type { Suggestion } from '../suggestions';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { TopBar } from '../../core/components/TopBar';
import { Dock } from '../../core/components/Dock';
import { useToast } from '../../core/useToast';
import { IdeaRow } from '../components/IdeaRow';
import { IdeaSheet, type IdeaDraft } from '../components/IdeaSheet';
import { SuggestionStrip } from '../components/SuggestionStrip';
import { useRoomScreen } from './useRoomScreen';
import './screens.css';

type SheetState = { open: false } | { open: true; editing: Idea | null };

export default function IdeasScreen() {
  const { gate, ctx } = useRoomScreen();
  const navigate = useNavigate();
  const toast = useToast();
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [toDelete, setToDelete] = useState<Idea | null>(null);
  if (!ctx) return gate;
  const { snap, me, mutate, refresh, shareFirst } = ctx;
  const base = `/r/${snap.room.id}`;

  const myVote = (ideaId: string) => snap.votes.find((v) => v.ideaId === ideaId && v.memberId === me.id)?.value ?? null;
  const count = (ideaId: string, value: VoteValue) => snap.votes.filter((v) => v.ideaId === ideaId && v.value === value).length;

  function vote(idea: Idea, v: VoteValue) {
    const value = myVote(idea.id) === v ? null : v; // aynı cevaba tekrar basmak kaldırır
    void mutate(
      (s) => ({
        ...s,
        votes: [
          ...s.votes.filter((x) => !(x.ideaId === idea.id && x.memberId === me.id)),
          ...(value ? [{ roomId: s.room.id, memberId: me.id, ideaId: idea.id, value }] : []),
        ],
      }),
      () => store.setVote({ roomId: snap.room.id, memberId: me.id, ideaId: idea.id, value }),
    );
  }

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    try {
      await action();
      await refresh();
      return true;
    } catch (e) {
      console.error('[bulusalim] Fikir kaydedilemedi', e);
      toast.show(copy.common.saveFailed, 2500);
      return false;
    }
  }

  const addSuggestion = (s: Suggestion) =>
    run(() => store.addIdea(snap.room.id, { name: s.name, suggestionId: s.id, addedBy: me.id }));

  const save = (d: IdeaDraft) =>
    run(() =>
      sheet.open && sheet.editing
        ? store.updateIdea(sheet.editing.id, { name: d.name, place: d.place, note: d.note })
        : store.addIdea(snap.room.id, { name: d.name, place: d.place, note: d.note, suggestionId: d.suggestionId ?? undefined, addedBy: me.id }),
    );

  async function confirmDelete() {
    const idea = toDelete;
    setToDelete(null);
    if (idea)
      await mutate(
        (s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== idea.id), votes: s.votes.filter((v) => v.ideaId !== idea.id) }),
        () => store.deleteIdea(idea.id),
      );
  }

  const hasIdeas = snap.ideas.length > 0;
  const showDock = hasMyVote(snap, me.id);

  return (
    <main className={`page${showDock ? ' has-dock' : ''}`}>
      <TopBar
        title={snap.room.name}
        link={{ to: `${base}/sonuc`, label: copy.bar.result }}
        share={{ label: copy.bar.share, onClick: shareFirst }}
      />
      <div className="pad screen-head">
        <h1 className="h1">{copy.ideas.title}</h1>
        {hasIdeas && (
          <button className="btn2 sm" type="button" onClick={() => setSheet({ open: true, editing: null })}>
            {copy.ideas.add}
          </button>
        )}
      </div>

      {hasIdeas ? (
        <ul className="idea-list">
          {snap.ideas.map((idea) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              myVote={myVote(idea.id)}
              yes={count(idea.id, 'yes')}
              no={count(idea.id, 'no')}
              mine={idea.addedBy === me.id}
              onVote={(v) => vote(idea, v)}
              onEdit={() => setSheet({ open: true, editing: idea })}
              onDelete={() => setToDelete(idea)}
            />
          ))}
        </ul>
      ) : (
        <div className="ideas-empty">
          <p className="pad s17 m">{copy.ideas.empty}</p>
          <SuggestionStrip ideas={snap.ideas} onPick={addSuggestion} />
          <div className="pad">
            <button className="btn2 sm" type="button" onClick={() => setSheet({ open: true, editing: null })}>
              {copy.ideas.add}
            </button>
          </div>
        </div>
      )}

      {showDock && (
        <Dock>
          <button className="btn" type="button" onClick={() => navigate(`${base}/zaman`)}>
            {copy.ideas.next}
          </button>
        </Dock>
      )}

      <IdeaSheet
        open={sheet.open}
        editing={sheet.open ? sheet.editing : null}
        ideas={snap.ideas}
        onClose={() => setSheet({ open: false })}
        onSubmit={save}
        onPickSuggestion={addSuggestion}
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
    </main>
  );
}
