// Gün seçici: bu haftanın pazartesisinden 5 haftalık takvim. Geçmiş günler kapalı, en fazla MAX_DAYS gün.
import { copy } from '../copy';
import { calendarWeeks, isWeekend, nextDays, normalizeDays } from '../days';
import { MAX_DAYS } from '../store';
import { formatDate, parseDay, todayString } from '../../core/format';
import './DayPicker.css';

export interface DayPickerProps {
  value: string[];
  onChange: (days: string[]) => void;
  /** Önceden seçili ama geçmişte kalan günler de gösterilsin (oda düzenlerken) */
  weeks?: number;
  error?: string;
  onLimit?: () => void;
}

export function DayPicker({ value, onChange, weeks = 5, error, onLimit }: DayPickerProps) {
  const today = todayString();
  const grid = calendarWeeks(weeks, today);
  const selected = new Set(value);

  function toggle(day: string) {
    if (selected.has(day)) return onChange(value.filter((d) => d !== day));
    if (value.length >= MAX_DAYS) return onLimit?.();
    onChange(normalizeDays([...value, day]));
  }

  const weekends = grid.flat().filter((d) => d >= today && isWeekend(d)).slice(0, MAX_DAYS);

  return (
    <div className="dp">
      <div className="dp-quick">
        <button type="button" className="btn2 sm" onClick={() => onChange(nextDays(7, today))}>
          {copy.days.next7}
        </button>
        <button type="button" className="btn2 sm" onClick={() => onChange(weekends)}>
          {copy.days.weekends}
        </button>
        {value.length > 0 && (
          <button type="button" className="tb sm" onClick={() => onChange([])}>
            {copy.days.clear}
          </button>
        )}
      </div>
      <div className="dp-grid" role="group" aria-label={copy.home.daysLabel}>
        {copy.days.weekdays.map((w) => (
          <span key={w} className="dp-wd sec s13" aria-hidden="true">
            {w}
          </span>
        ))}
        {grid.flat().map((day) => {
          const past = day < today;
          const on = selected.has(day);
          const d = parseDay(day);
          const first = d.getDate() === 1 || day === grid[0][0];
          return (
            <button
              key={day}
              type="button"
              className={['dp-d', on && 'on', day === today && 'today'].filter(Boolean).join(' ')}
              disabled={past && !on}
              aria-pressed={on}
              aria-label={copy.days.dayLabel(formatDate(day), on)}
              onClick={() => toggle(day)}
            >
              <span className="mono">{d.getDate()}</span>
              {first && <span className="dp-m">{formatDate(day).split(' ')[2]}</span>}
            </button>
          );
        })}
      </div>
      <p className={error ? 'err' : 'hint'}>{error ?? copy.days.count(value.length, MAX_DAYS)}</p>
    </div>
  );
}
