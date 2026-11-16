// Sonuç ekranı: kazanan + durum + tek buton; altında bütün fikirler ve en uygun zamanlar (dokununca kim).
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { copy } from '../copy';
import { computeResult } from '../result';
import { slotLower } from '../slots';
import { remindText, resultText, waitingNames } from '../share';
import { formatRatio, formatShortDay } from '../../core/format';
import { shareToWhatsApp } from '../../core/share';
import { TopBar } from '../../core/components/TopBar';
import { useRoomScreen } from './useRoomScreen';
import { IdeaWho, SlotWho } from '../components/WhoList';
import './screens.css';

export default function ResultScreen() {
  const { gate, ctx } = useRoomScreen();
  const result = useMemo(() => (ctx ? computeResult(ctx.snap) : null), [ctx]);
  if (!ctx || !result) return gate;
  const { snap, link, shareFirst } = ctx;
  const base = `/r/${snap.room.id}`;
  const r = result;

  const bar = (
    <TopBar
      title={snap.room.name}
      back={{ to: `${base}/zaman`, label: copy.bar.back }}
      link={{ to: `${base}/fikirler`, label: copy.bar.myAnswers }}
      share={{ label: copy.bar.share, onClick: shareFirst }}
      menu={ctx.barMenu}
    />
  );

  const nav = (
    <nav className="res-nav">
      <Link to="/" className="tb sm">
        {copy.result.myRooms}
      </Link>
      <Link to="/yeni" className="tb sm">
        {copy.result.newRoom}
      </Link>
    </nav>
  );
  const bestTimes = [...r.slots].filter((s) => s.freeCount > 0).sort((a, b) => b.freeCount - a.freeCount).slice(0, 5);

  if (r.voters.length === 0) {
    return (
      <main className="page">
        {bar}
        <section className="pad res">
          <div className="win neutral">
            <h1 className="h1">{copy.result.emptyTitle}</h1>
            <p className="s17 sec">{copy.result.emptySub}</p>
          </div>
          <Link to={`${base}/fikirler`} className="btn">
            {copy.result.goIdeas}
          </Link>
          {nav}
        </section>
        {ctx.menu}
      </main>
    );
  }

  const w = r.winnerIdea;
  const b = r.bestSlot;
  return (
    <main className="page">
      {bar}
      <section className="pad res">
        <div className="win">
          <h1 className="h1">{w ? (w.place ? `${w.name} · ${w.place}` : w.name) : copy.result.noIdea}</h1>
          {b ? (
            <p className="win-time mono">
              {formatShortDay(b.day)} {slotLower(b.slot)}
            </p>
          ) : (
            <p className="s17">{copy.result.noTime}</p>
          )}
        </div>
        <div className="res-status">
          {r.isFinal ? (
            <p className="b">{copy.result.final}</p>
          ) : (
            <>
              <p>
                <span className="mono">{formatRatio(r.voters.length, r.totalMembers)}</span> {copy.result.partial}
              </p>
              <p className="sec">{copy.result.waiting(waitingNames(snap, r))}</p>
            </>
          )}
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => void shareToWhatsApp(r.isFinal ? resultText(snap, r, link) : remindText(snap, r, link))}
        >
          {r.isFinal ? copy.result.share : copy.result.remind}
        </button>
        {r.ideas.length > 0 && <IdeaWho snap={snap} ideas={r.ideas} title={copy.result.ideasTitle} />}
        <SlotWho snap={snap} slots={bestTimes} title={copy.result.timesTitle} />
        {nav}
      </section>
      {ctx.menu}
    </main>
  );
}
