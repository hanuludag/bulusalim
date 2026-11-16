// Sonuç ekranı: kazanan + durum + tek buton; altında bütün fikirler ve en uygun zamanlar (dokununca kim).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { copy } from '../copy';
import { computeResult } from '../result';
import { slotLower } from '../slots';
import { remindText, resultText, waitingNames } from '../share';
import { formatRatio, formatShortDay } from '../../core/format';
import { shareToWhatsApp } from '../../core/share';
import { TopBar } from '../../core/components/TopBar';
import { useRoomScreen } from './useRoomScreen';
import { SlotWho } from '../components/WhoList';
import { PlanList } from '../components/PlanList';
import { DistributeSheet } from '../components/DistributeSheet';
import { distribute } from '../distribute';
import { store } from '../runtime';
import { copyText } from '../../core/share';
import { useToast } from '../../core/useToast';
import './screens.css';

export default function ResultScreen() {
  const { gate, ctx } = useRoomScreen();
  const result = useMemo(() => (ctx ? computeResult(ctx.snap) : null), [ctx]);
  const toast = useToast();
  const [dist, setDist] = useState(false);
  if (!ctx || !result) return gate;
  const { snap, link, shareFirst, me, refresh, isCreator } = ctx;
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
  const proposal = isCreator ? distribute(result) : [];
  async function applyDistribution() {
    try {
      for (const a of proposal) await store.moveIdea(a.idea.id, me.id, a.day, a.slot);
      setDist(false);
      toast.show(copy.result.distributeDone, 2000);
    } catch (e) {
      console.error('[bulusalim] Dağıtılamadı', e);
      toast.show(copy.common.saveFailed, 2500);
    }
    await refresh();
  }
  async function copyLink() {
    if (await copyText(link)) toast.show(copy.common.copied, 1500);
  }
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
        {r.plan.length > 0 && (
          <div className="res-plan">
            <h2 className="sec s13">{copy.result.planTitle}</h2>
            <PlanList result={r} detail />
          </div>
        )}
        {(r.winnerIdea || r.plan.length === 0) && <div className="win">
          <h1 className="h1">{w ? (w.place ? `${w.name} · ${w.place}` : w.name) : copy.result.noIdea}</h1>
          {b ? (
            <p className="win-time mono">
              {formatShortDay(b.day)} {slotLower(b.slot)}
            </p>
          ) : (
            <p className="s17">{copy.result.noTime}</p>
          )}
        </div>}
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
        <div className="res-actions">
          {!r.isFinal && (
            <button className="btn2 sm" type="button" onClick={() => void shareToWhatsApp(resultText(snap, r, link))}>
              {copy.result.shareAnyway}
            </button>
          )}
          <button className="btn2 sm" type="button" onClick={() => void copyLink()}>
            {copy.result.copyLink}
          </button>
        </div>
        {proposal.length > 0 && (
          <button className="btn2" type="button" onClick={() => setDist(true)}>
            {copy.result.distribute}
          </button>
        )}
        <SlotWho snap={snap} slots={bestTimes} title={copy.result.timesTitle} />
        {nav}
      </section>
      <DistributeSheet open={dist} items={proposal} onClose={() => setDist(false)} onApply={applyDistribution} />
      {ctx.menu}
    </main>
  );
}
