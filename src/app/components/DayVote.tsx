// Gün oyu (gün oylaması açıkken, günü belli olmayan fikirde): küçük düğme + çoğunluk satırı.
import { useState } from 'react';
import { copy } from '../copy';
import './VoteLine.css';
import type { DayVote as Top } from '../result';
import { slotLower } from '../slots';
import type { Slot } from '../types';
import { formatDate } from '../../core/format';
import { MoveSheet } from './MoveSheet';
import type { Idea } from '../types';
import type { OccasionPick } from './IdeaSheet';

const when = (o: { day: string; slot: Slot }) => `${formatDate(o.day)} ${slotLower(o.slot)}`;

export function DayVote({ idea, days, mine, top, onPick }: {
  idea: Idea; days: string[]; mine: OccasionPick; top: Top | null | undefined; onPick: (o: OccasionPick) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dv">
      <button className="tb sm" type="button" onClick={() => setOpen(true)}>
        {mine ? copy.dayVote.mine(when(mine)) : copy.dayVote.ask}
      </button>
      {top && <span className="sec s13">{copy.dayVote.top(when(top), top.count)}</span>}
      <MoveSheet
        idea={open ? idea : null}
        days={days}
        initial={mine}
        title={copy.dayVote.title}
        anyLabel={copy.dayVote.remove}
        onClose={() => setOpen(false)}
        onSave={async (o) => {
          await onPick(o);
          setOpen(false);
        }}
      />
    </div>
  );
}
