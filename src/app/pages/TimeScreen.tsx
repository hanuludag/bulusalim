// Zaman ekranı: oda günleri × 2 dilim, dokununca seç/kaldır. Altta "Kim ne zaman boş".
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { store } from '../runtime';
import { computeResult } from '../result';
import type { RoomSnapshot, Slot } from '../types';
import { TopBar } from '../../core/components/TopBar';
import { Dock } from '../../core/components/Dock';
import { TimeGrid } from '../components/TimeGrid';
import { SlotWho } from '../components/WhoList';
import { useRoomScreen } from './useRoomScreen';
import './screens.css';

export default function TimeScreen() {
  const { gate, ctx } = useRoomScreen();
  const navigate = useNavigate();
  const result = useMemo(() => (ctx ? computeResult(ctx.snap) : null), [ctx]);
  if (!ctx || !result) return gate;
  const { snap, me, mutate, shareFirst } = ctx;
  const base = `/r/${snap.room.id}`;

  function toggle(day: string, slot: Slot) {
    const same = (a: { memberId: string; day: string; slot: Slot }) => a.memberId === me.id && a.day === day && a.slot === slot;
    void mutate(
      (s: RoomSnapshot) => ({
        ...s,
        availability: s.availability.some(same)
          ? s.availability.filter((a) => !same(a))
          : [...s.availability, { roomId: s.room.id, memberId: me.id, day, slot }],
      }),
      () => store.toggleAvailability({ roomId: snap.room.id, memberId: me.id, day, slot }),
    );
  }

  return (
    <main className="page has-dock">
      <TopBar
        title={snap.room.name}
        back={{ to: `${base}/fikirler`, label: copy.bar.back }}
        link={{ to: `${base}/sonuc`, label: copy.bar.result }}
        share={{ label: copy.bar.share, onClick: shareFirst }}
        menu={ctx.barMenu}
      />
      <div className="pad screen-head col">
        <h1 className="h1">{copy.time.title}</h1>
        <p className="sec">{copy.time.sub}</p>
      </div>
      <div className="pad time-wrap">
        <TimeGrid result={result} snap={snap} meId={me.id} onToggle={toggle} />
      </div>
      <div className="pad time-who">
        <SlotWho snap={snap} slots={result.slots} title={copy.who.title} />
      </div>
      <Dock>
        <button className="btn" type="button" onClick={() => navigate(`${base}/sonuc`)}>
          {copy.time.next}
        </button>
      </Dock>
      {ctx.menu}
    </main>
  );
}
