// "Kim?" listeleri: satıra dokununca isimler açılır.
// SlotWho: zaman dilimleri (kim boş). IdeaWho: fikirler (kim onayladı / onaylamadı).
import { useState } from 'react';
import { copy } from '../copy';
import { slotLower } from '../slots';
import type { IdeaResult, SlotResult } from '../result';
import type { RoomSnapshot } from '../types';
import { formatDate } from '../../core/format';
import './WhoList.css';

const names = (snap: RoomSnapshot, ids: string[]) => snap.members.filter((m) => ids.includes(m.id)).map((m) => m.name).join(', ');

function Row({ title, right, children }: { title: string; right: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="wl-item">
      <button className="wl-row" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="wl-title">{title}</span>
        <span className="mono s13">{right}</span>
        <span className="wl-chev" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="wl-names s13">{children}</div>}
    </li>
  );
}

export function SlotWho({ snap, slots, title }: { snap: RoomSnapshot; slots: SlotResult[]; title: string }) {
  const list = slots.filter((s) => s.freeCount > 0);
  return (
    <section className="wl">
      <h2 className="sec s13 wl-h">{title}</h2>
      {list.length === 0 ? (
        <p className="sec s13">{copy.who.none}</p>
      ) : (
        <ul>
          {list.map((s) => (
            <Row key={`${s.day}-${s.slot}`} title={`${formatDate(s.day)} ${slotLower(s.slot)}`} right={copy.who.free(s.freeCount)}>
              <p>{names(snap, s.freeIds)}</p>
            </Row>
          ))}
        </ul>
      )}
    </section>
  );
}

export function IdeaWho({ snap, ideas, title }: { snap: RoomSnapshot; ideas: IdeaResult[]; title: string }) {
  const by = (ideaId: string, value: 'yes' | 'no') =>
    names(snap, snap.votes.filter((v) => v.ideaId === ideaId && v.value === value).map((v) => v.memberId));
  return (
    <section className="wl">
      <h2 className="sec s13 wl-h">{title}</h2>
      <ul>
        {ideas.map(({ idea, yes, no }) => (
          <Row key={idea.id} title={idea.place ? `${idea.name} · ${idea.place}` : idea.name} right={`✓${yes} ✗${no}`}>
            {yes > 0 && <p>{copy.who.yes(by(idea.id, 'yes'))}</p>}
            {no > 0 && <p className="sec">{copy.who.no(by(idea.id, 'no'))}</p>}
            {yes + no === 0 && <p className="sec">—</p>}
          </Row>
        ))}
      </ul>
    </section>
  );
}
