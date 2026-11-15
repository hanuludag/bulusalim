// Zaman sekmesi (§6, §25).
import { useState } from 'react';
import { copy } from '../copy';
import { store } from '../runtime';
import type { RoomSnapshot, Slot } from '../types';
import { TimeGrid } from '../components/TimeGrid';
import { PersonSheet } from '../components/PersonSheet';
import type { RoomCtx } from './roomCtx';
import './TimeTab.css';

export default function TimeTab({ ctx }: { ctx: RoomCtx }) {
  const { snap, me, dev, updateDev, mutate, guide, goTab } = ctx;
  const [cell, setCell] = useState<{ day: string; slot: Slot } | null>(null);

  function toggle(day: string, slot: Slot) {
    const apply = (s: RoomSnapshot): RoomSnapshot => {
      const has = s.availability.some((a) => a.memberId === me.id && a.day === day && a.slot === slot);
      return {
        ...s,
        availability: has
          ? s.availability.filter((a) => !(a.memberId === me.id && a.day === day && a.slot === slot))
          : [...s.availability, { roomId: s.room.id, memberId: me.id, day, slot }],
      };
    };
    void mutate(apply, () => store.toggleAvailability({ roomId: snap.room.id, memberId: me.id, day, slot }));
  }

  function hold(day: string, slot: Slot) {
    if (!dev.hints.gridHold) updateDev({ hints: { gridHold: true } });
    setCell({ day, slot });
  }

  return (
    <>
      <div className="pad time-head">
        <h1 className="h1">{copy.time.title}</h1>
        <p className="sec">{copy.time.sub}</p>
        {!dev.hints.gridHold && <p className="sec s13">{copy.time.hintHold}</p>}
      </div>
      <div className="pad time-grid-wrap">
        <TimeGrid snap={snap} meId={me.id} onToggle={toggle} onHold={hold} />
      </div>
      <div className="grow" />
      {guide && (
        <div className="dock above-tabs">
          <button className="btn" type="button" onClick={() => goTab('sonuc')}>
            {copy.time.next}
          </button>
        </div>
      )}
      <PersonSheet snap={snap} cell={cell} onClose={() => setCell(null)} />
    </>
  );
}
