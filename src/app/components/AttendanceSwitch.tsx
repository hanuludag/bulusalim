// Geliyorum / Gelemem ikili düğme. Sadece sayaç; soran, uyaran, etiketleyen hiçbir şey yok.
import { copy } from '../copy';
import './AttendanceSwitch.css';

export interface AttendanceSwitchProps {
  value: 'yes' | 'no' | null;
  yes: number;
  total: number;
  onChange: (v: 'yes' | 'no') => void;
}

export function AttendanceSwitch({ value, yes, total, onChange }: AttendanceSwitchProps) {
  return (
    <section className="attend" aria-labelledby="attend-title">
      <div className="attend-head">
        <h2 id="attend-title" className="h2">
          {copy.result.attendTitle}
        </h2>
        <span className="mono s13">{copy.result.attendCount(yes, total)}</span>
      </div>
      <div className="seg">
        <button className="btn2" type="button" aria-pressed={value === 'yes'} onClick={() => onChange('yes')}>
          {copy.result.attendYes}
        </button>
        <button className="btn2 seg-no" type="button" aria-pressed={value === 'no'} onClick={() => onChange('no')}>
          {copy.result.attendNo}
        </button>
      </div>
    </section>
  );
}
