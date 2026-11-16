// Arkadaşın gördüğü sonuç: sadece plan + durum + "Cevaplarımı düzenle". İsim ve sayı yok.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { copy } from '../copy';
import { computeResult } from '../result';
import { slotHours, slotLower } from '../slots';
import { formatDate } from '../../core/format';
import { GuestBar } from '../components/GuestBar';
import { PlanList } from '../components/PlanList';
import { useRoomScreen } from './useRoomScreen';
import './guest.css';

export default function GuestPlan() {
  const { gate, ctx } = useRoomScreen();
  const r = useMemo(() => (ctx ? computeResult(ctx.snap) : null), [ctx]);
  if (!ctx || !r) return gate;
  const { snap, shareFirst } = ctx;
  const w = r.winnerIdea;
  const b = r.bestSlot;
  const showGeneral = r.general.length > 0 || r.plan.length === 0;

  return (
    <main className="page">
      <GuestBar title={snap.room.name} onShare={shareFirst} />
      <section className="pad res">
        <h1 className="h1">{copy.guest.planTitle}</h1>
        {r.plan.length > 0 && <PlanList result={r} />}
        {showGeneral && (
          <div className={`win${w || b ? '' : ' neutral'}`}>
            {w || b ? (
              <>
                <p className="plan-what">{w ? (w.place ? `${w.name} · ${w.place}` : w.name) : copy.result.noIdea}</p>
                {b && (
                  <p className="mono">
                    {formatDate(b.day)} {slotLower(b.slot)} {slotHours(b.slot)}
                  </p>
                )}
              </>
            ) : (
              <p className="sec">{copy.guest.planEmpty}</p>
            )}
          </div>
        )}
        <p className={r.isFinal ? 'b' : 'sec'}>{r.isFinal ? copy.guest.planFinal : copy.guest.planPartial(r.voters.length, r.totalMembers)}</p>
        <Link to={`/r/${snap.room.id}/cevap`} className="btn2">
          {copy.guest.edit}
        </Link>
        <Link to="/" className="tb sm g-home">
          ← {copy.guest.myRooms}
        </Link>
      </section>
    </main>
  );
}
