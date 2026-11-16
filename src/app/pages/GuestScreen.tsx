// Arkadaş ekranı (linkten girenler): tek sayfa, 2 adım. Fikirlere ✓/✗ → boş saatlere dokun → Bitti.
// Sayı, isim listesi ve menü yok; bunlar odayı kuranın ekranlarında.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { store } from '../runtime';
import { computeResult } from '../result';
import { groupIdeas } from '../groups';
import { roomDays } from '../days';
import { slotHours, slotLabel } from '../slots';
import type { Idea } from '../types';
import type { Suggestion } from '../suggestions';
import { formatDate } from '../../core/format';
import { Dock } from '../../core/components/Dock';
import { useToast } from '../../core/useToast';
import { GuestBar } from '../components/GuestBar';
import { IdeaSheet, type IdeaDraft, type OccasionPick } from '../components/IdeaSheet';
import { TimeGrid } from '../components/TimeGrid';
import { answers } from './answers';
import { VoteLine } from '../components/VoteLine';
import { DayVote } from '../components/DayVote';
import { useRoomScreen } from './useRoomScreen';
import './guest.css';

export default function GuestScreen() {
  const { gate, ctx } = useRoomScreen();
  const navigate = useNavigate();
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const result = useMemo(() => (ctx ? computeResult(ctx.snap) : null), [ctx]);
  if (!ctx || !result) return gate;
  const { snap, me, refresh, shareFirst } = ctx;
  const { myVote, vote, toggle, myPlacement, placeVote, voters } = answers(ctx);
  const days = roomDays(snap.room);
  const dayVotes = new Map(result.ideas.map((r) => [r.idea.id, r.dayVote]));
  const groups = groupIdeas(snap);
  const hasDays = groups.days.some((g) => g.slots.length > 0);

  async function run(action: () => Promise<unknown>) {
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
  const add = (name: string, extra: { place?: string; note?: string; suggestionId?: string }, o: OccasionPick) =>
    run(() => store.addIdea(snap.room.id, { name, ...extra, addedBy: me.id, day: o?.day ?? null, slot: o?.slot ?? null }));

  const names = (ids: string[]) => snap.members.filter((m) => ids.includes(m.id)).map((m) => m.name).join(', ');
  const answeredLine = [
    result.voters.length ? copy.who.answered(names(result.voters)) : '',
    result.waiting.length ? copy.who.waiting(names(result.waiting)) : '',
  ].filter(Boolean).join(' · ');

  const row = (idea: Idea) => {
    const v = myVote(idea.id);
    return (
      <li key={idea.id} className="g-idea">
        <div className="g-text">
          <p className="m">{idea.name}</p>
          {idea.place && <p className="sec s13">{idea.place}</p>}
          {idea.note && <p className="sec s13">{idea.note}</p>}
          <VoteLine yes={voters(idea.id, 'yes')} no={voters(idea.id, 'no')} />
          {snap.room.dayVoting && !idea.day && (
            <DayVote idea={idea} days={days} mine={myPlacement(idea.id)} top={dayVotes.get(idea.id)} onPick={(o) => placeVote(idea, o)} />
          )}
        </div>
        <div className="g-votes" role="group" aria-label={idea.name}>
          <button type="button" className={`g-v${v === 'yes' ? ' yes' : ''}`} aria-pressed={v === 'yes'} aria-label={copy.guest.yes} onClick={() => void vote(idea, 'yes')}>
            ✓
          </button>
          <button type="button" className={`g-v${v === 'no' ? ' no' : ''}`} aria-pressed={v === 'no'} aria-label={copy.guest.no} onClick={() => void vote(idea, 'no')}>
            ✗
          </button>
        </div>
      </li>
    );
  };

  return (
    <main className="page has-dock g-page">
      <GuestBar title={snap.room.name} onShare={shareFirst} />

      <section className="g-step">
        <div className="pad">
          <h1 className="h1">{copy.guest.step1}</h1>
          <p className="sec">{copy.guest.step1Sub}</p>
        </div>
        {snap.ideas.length === 0 && <p className="pad sec g-empty">{copy.guest.noIdeas}</p>}
        {groups.general.length > 0 && (
          <div>
            {hasDays && <p className="pad g-when">{copy.occasion.any}</p>}
            <ul>{groups.general.map(row)}</ul>
          </div>
        )}
        {groups.days.map((g) =>
          g.slots.map((sg) => (
            <div key={`${g.day}-${sg.slot}`}>
              <p className="pad g-when">
                {formatDate(g.day)} · {slotLabel(sg.slot)} <span className="sec mono s13">{slotHours(sg.slot)}</span>
              </p>
              <ul>{sg.ideas.map(row)}</ul>
            </div>
          )),
        )}
        <div className="pad">
          <button className="tb sm g-suggest" type="button" onClick={() => setSheet(true)}>
            {copy.guest.suggest}
          </button>
        </div>
      </section>

      <section className="g-step">
        <div className="pad">
          <h2 className="h1">{copy.guest.step2}</h2>
          <p className="sec">{copy.guest.step2Sub}</p>
        </div>
        <div className="pad time-wrap">
          <TimeGrid result={result} snap={snap} meId={me.id} onToggle={(d, s) => void toggle(d, s)} />
        </div>
      </section>

      <Dock>
        <p className="sec s13 g-who">{answeredLine}</p>
        <button
          className="btn"
          type="button"
          onClick={() => {
            toast.show(copy.guest.thanks, 1800);
            navigate(`/r/${snap.room.id}/plan`);
          }}
        >
          {copy.guest.done}
        </button>
      </Dock>

      <IdeaSheet
        open={sheet}
        editing={null}
        ideas={snap.ideas}
        days={days}
        occasion={null}
        onClose={() => setSheet(false)}
        onSubmit={(d: IdeaDraft) => add(d.name, { place: d.place, note: d.note, suggestionId: d.suggestionId ?? undefined }, d.occasion)}
        onPickSuggestion={(s: Suggestion, o) => add(s.name, { suggestionId: s.id }, o)}
      />
    </main>
  );
}
