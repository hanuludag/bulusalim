// Arkadaşın gördüğü sonuç: sadece plan + durum + "Cevaplarımı düzenle". İsim ve sayı yok.
import { useMemo } from 'react';
import { resultText } from '../share';
import { copyText, shareToWhatsApp } from '../../core/share';
import { useToast } from '../../core/useToast';
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
  const toast = useToast();
  if (!ctx || !r) return gate;
  const { snap, shareFirst, link } = ctx;
  const w = r.winnerIdea;
  const b = r.bestSlot;
  const names = (ids: string[]) => snap.members.filter((m) => ids.includes(m.id)).map((m) => m.name).join(', ');
  const showGeneral = !!w || r.plan.length === 0; // plan varken onaysız genel fikirler kafa karıştırmasın

  return (
    <main className="page">
      <GuestBar title={snap.room.name} onShare={shareFirst} />
      <section className="pad res">
        <h1 className="h1">{copy.guest.planTitle}</h1>
        {r.plan.length > 0 && <PlanList result={r} detail />}
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
        <div>
          <p className={r.isFinal ? 'b' : 'sec'}>{r.isFinal ? copy.guest.planFinal : copy.guest.planPartial(r.voters.length, r.totalMembers)}</p>
          {!r.isFinal && <p className="sec s13">{copy.who.waiting(names(r.waiting))}</p>}
        </div>
        <button className="btn" type="button" onClick={() => void shareToWhatsApp(resultText(snap, r, link))}>
          {copy.guest.sharePlan}
        </button>
        <button className="btn2 sm g-copy" type="button" onClick={async () => (await copyText(link)) && toast.show(copy.common.copied, 1500)}>
          {copy.result.copyLink}
        </button>
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
