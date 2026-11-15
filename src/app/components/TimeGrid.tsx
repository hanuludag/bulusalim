// Zaman ızgarası: 7 gün × 3 dilim.
import { copy } from '../copy';
import { SLOTS, slotHours, slotLabel, slotLower } from '../slots';
import type { RoomSnapshot, Slot } from '../types';
import { formatDate, formatRatio, weekDays } from '../../core/format';
import { TimeCell } from './TimeCell';
import './TimeGrid.css';

export interface TimeGridProps {
  snap: RoomSnapshot;
  meId: string;
  onToggle: (day: string, slot: Slot) => void;
  onHold: (day: string, slot: Slot) => void;
}

export function TimeGrid({ snap, meId, onToggle, onHold }: TimeGridProps) {
  const total = snap.members.length;
  const days = weekDays(snap.room.startDate);
  const memberIds = new Set(snap.members.map((m) => m.id));

  return (
    <div className="tgrid">
      <div className="tg tg-head" aria-hidden="true">
        <span />
        {SLOTS.map((s) => (
          <span key={s} className="tg-col">
            <span className="b">{slotLabel(s)}</span>
            <span className="sec s13 mono">{slotHours(s)}</span>
          </span>
        ))}
      </div>
      <div className="tg-rows">
        {days.map((day) => (
          <div className="tg" key={day} role="group" aria-label={formatDate(day)}>
            <span className="mono s13">{formatDate(day)}</span>
            {SLOTS.map((slot) => {
              const free = snap.availability.filter((a) => a.day === day && a.slot === slot && memberIds.has(a.memberId));
              const mine = free.some((a) => a.memberId === meId);
              const ratio = formatRatio(free.length, total);
              return (
                <TimeCell
                  key={slot}
                  text={ratio}
                  label={copy.time.cellLabel(formatDate(day), slotLower(slot), ratio, mine)}
                  mine={mine}
                  all={total > 0 && free.length === total}
                  zero={free.length === 0}
                  onToggle={() => onToggle(day, slot)}
                  onHold={() => onHold(day, slot)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
