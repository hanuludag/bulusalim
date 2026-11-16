// Zaman ızgarası: oda günleri × 2 dilim. Kutuda sadece boş kişi sayısı. Tek dokunuş seç/kaldır.
import { copy } from '../copy';
import { SLOTS, slotHours, slotLabel, slotLower } from '../slots';
import type { Result } from '../result';
import type { RoomSnapshot, Slot } from '../types';
import { formatDate } from '../../core/format';
import { roomDays } from '../days';
import './TimeGrid.css';

export interface TimeGridProps {
  result: Result; snap: RoomSnapshot; meId: string; onToggle: (day: string, slot: Slot) => void;
  /** Sade görünüm (arkadaşlar): sayı yok, sadece kendi seçimin ✓ */
  simple?: boolean;
}

export function TimeGrid({ result, snap, meId, onToggle, simple = false }: TimeGridProps) {
  const days = roomDays(snap.room);
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
              const cell = result.slots.find((s) => s.day === day && s.slot === slot);
              const n = cell?.freeCount ?? 0;
              const mine = cell?.freeIds.includes(meId) ?? false;
              const all = !simple && result.allFreeSlots.some((s) => s.day === day && s.slot === slot);
              return (
                <button
                  key={slot}
                  type="button"
                  className={['c', mine && 'me', all && 'all', !simple && n === 0 && 'z'].filter(Boolean).join(' ')}
                  aria-pressed={mine}
                  aria-label={simple ? copy.time.cellLabelSimple(formatDate(day), slotLower(slot), mine) : copy.time.cellLabel(formatDate(day), slotLower(slot), n, mine)}
                  onClick={() => onToggle(day, slot)}
                >
                  {simple ? (mine ? '✓' : '') : n}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
