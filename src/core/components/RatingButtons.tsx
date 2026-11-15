// RatingButtons: 1–5 puan butonları. Seçili puan kırmızı; 1 seçiliyse siyah (eleme renkli değil).
import './RatingButtons.css';

export interface RatingButtonsProps {
  value: number | null;
  onChange: (score: number) => void;
  labelFor: (n: number) => string;
  groupLabel?: string;
}

export function RatingButtons({ value, onChange, labelFor, groupLabel }: RatingButtonsProps) {
  return (
    <div className="rate" role="group" aria-label={groupLabel}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            className={`r${on ? (n === 1 ? ' out' : ' sel') : ''}`}
            aria-pressed={on}
            aria-label={labelFor(n)}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
