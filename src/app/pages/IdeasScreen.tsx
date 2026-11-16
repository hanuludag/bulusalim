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
import { IdeaSheet, type IdeaDraft, type OccasionPick } from '../components/IdeaSheet';
import { groupIdeas } from '../groups';
import { MoveSheet } from '../components/MoveSheet';
import { DayVote } from '../components/DayVote';
import { computeResult } from '../result';
import { answers } from './answers';
import { roomDays } from '../days';
import { slotHours, slotLabel } from '../slots';
import { formatDate } from '../../core/format';
import { SuggestionStrip } from '../components/SuggestionStrip';
import { useRoomScreen } from './useRoomScreen';
import './screens.css';

type SheetState = { open: false } | { open: true; editing: Idea | null; occasion?: OccasionPick };

export default function IdeasScreen() {
  const { gate, ctx } = useRoomScreen();
  const navigate = useNavigate();
  const toast = useToast();
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [toDelete, setToDelete] = useState<Idea | null>(null);
  const [toMove, setToMove] = useState<Idea | null>(null);
  if (!ctx) return gate;
  const { snap, me, mutate, refresh, shareFirst } = ctx;
  const base = `/r/${snap.room.id}`;

  const myVote = (ideaId: string) => snap.votes.find((v) => v.ideaId === ideaId && v.memberId === me.id)?.value ?? null;
  const nameOf = (id: string | null) => snap.members.find((m) => m.id === id)?.name ?? '';
  const voters = (ideaId: string, value: VoteValue) =>
    snap.members.filter((m) => snap.votes.some((v) => v.ideaId === ideaId && v.memberId === m.id && v.value === value)).map((m) => m.name);

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

  const addSuggestion = (s: Suggestion, o: OccasionPick = null) =>
    run(() => store.addIdea(snap.room.id, { name: s.name, suggestionId: s.id, addedBy: me.id, day: o?.day ?? null, slot: o?.slot ?? null }));

  const save = (d: IdeaDraft) =>
    run(() =>
      sheet.open && sheet.editing
        ? store.updateIdea(sheet.editing.id, me.id, { name: d.name, place: d.place, note: d.note })
        : store.addIdea(snap.room.id, {
            name: d.name, place: d.place, note: d.note, suggestionId: d.suggestionId ?? undefined, addedBy: me.id,
            day: d.occasion?.day ?? null, slot: d.occasion?.slot ?? null,
          }),
    );

  async function confirmDelete() {
    const idea = toDelete;
    setToDelete(null);
    if (idea)
      await mutate(
        (s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== idea.id), votes: s.votes.filter((v) => v.ideaId !== idea.id) }),
        () => store.deleteIdea(idea.id, me.id),
      );
  }

  const hasIdeas = snap.ideas.length > 0;
  const groups = groupIdeas(snap);
  const days = roomDays(snap.room);
  const a = answers(ctx);
  const dayVotes = new Map(computeResult(snap).ideas.map((r) => [r.idea.id, r.dayVote]));
  const row = (idea: Idea) => (
    <IdeaRow
      key={idea.id}
      idea={idea}
      myVote={myVote(idea.id)}
      yesNames={voters(idea.id, 'yes')}
      noNames={voters(idea.id, 'no')}
      addedBy={nameOf(idea.addedBy)}
      canEdit={idea.addedBy === me.id}
      canDelete={idea.addedBy === me.id || ctx.isCreator}
      onVote={(v) => vote(idea, v)}
      onEdit={() => setSheet({ open: true, editing: idea })}
      onDelete={() => setToDelete(idea)}
      onMove={() => setToMove(idea)}
      extra={
        snap.room.dayVoting && !idea.day ? (
          <DayVote idea={idea} days={days} mine={a.myPlacement(idea.id)} top={dayVotes.get(idea.id)} onPick={(o) => a.placeVote(idea, o)} />
        ) : null
      }
    />
  );
  const showDock = hasMyVote(snap, me.id);

  return (
    <main className={`page${showDock ? ' has-dock' : ''}`}>
      <TopBar
        title={snap.room.name}
        link={{ to: `${base}/sonuc`, label: copy.bar.result }}
        share={{ label: copy.bar.share, onClick: shareFirst }}
        menu={ctx.barMenu}
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
        <div className="idea-groups">
          {groups.general.length > 0 && (
            <section>
              {groups.days.some((g) => g.slots.length > 0) && <h2 className="pad grp-day">{copy.occasion.any}</h2>}
              <ul className="idea-list">{groups.general.map(row)}</ul>
            </section>
          )}
          {groups.days.filter((g) => g.slots.length > 0).map((g) => (
            <section key={g.day}>
              <h2 className="pad grp-day">{formatDate(g.day)}</h2>
              {g.slots.map((sg) => (
                <div key={sg.slot}>
                  <p className="pad grp-slot sec s13">
                    {slotLabel(sg.slot)} <span className="mono">{slotHours(sg.slot)}</span>
                  </p>
                  <ul className="idea-list">{sg.ideas.map(row)}</ul>
                </div>
              ))}
              <div className="pad grp-add">
                <button className="tb sm" type="button" onClick={() => setSheet({ open: true, editing: null, occasion: { day: g.day, slot: 'gunduz' } })}>
                  {copy.occasion.addToDay}
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="ideas-empty">
          <p className="pad s17 m">{copy.ideas.empty}</p>
          <SuggestionStrip ideas={groups.general} onPick={(sg) => void addSuggestion(sg)} />
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
        days={days}
        occasion={sheet.open ? sheet.occasion : null}
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
      <MoveSheet
        idea={toMove}
        days={days}
        onClose={() => setToMove(null)}
        onSave={async (o) => {
          const idea = toMove;
          if (idea && (await run(() => store.moveIdea(idea.id, me.id, o?.day ?? null, o?.slot ?? null)))) setToMove(null);
        }}
      />
      {ctx.menu}
    </main>
  );
}
