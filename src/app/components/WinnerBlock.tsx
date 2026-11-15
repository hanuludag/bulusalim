// Kazanan bloğu: kırmızı sol çizgili düz blok (defterin kenar çizgisi gibi).
import { copy } from '../copy';
import { slotLower } from '../slots';
import type { Result } from '../result';
import { formatAvg, formatRatio, formatShortDay } from '../../core/format';
import './WinnerBlock.css';

export function WinnerBlock({ result, animate }: { result: Result; animate: boolean }) {
  const w = result.winnerIdea;
  const avg = result.ideas.find((i) => i.idea.id === w?.id)?.avg ?? null;
  const b = result.bestSlot;
  const ratio = b ? copy.result.winnerFree(formatRatio(b.freeCount, result.voters.length)) : '';
  const sub = [w ? copy.result.winnerAvg(formatAvg(avg)) : '', ratio].filter(Boolean).join(' · ');

  return (
    <div className={`win${animate ? ' win-enter' : ''}`}>
      {w && (
        <h2 className="h1">
          {w.name}
          {w.place ? ` · ${w.place}` : ''}
        </h2>
      )}
      {b && (
        <p className={w ? 'win-time mono' : 'h1 mono win-time'}>
          {formatShortDay(b.day)} {slotLower(b.slot)}
        </p>
      )}
      {sub && <p className="sec mono win-sub">{sub}</p>}
      {w?.mapUrl && (
        <a href={w.mapUrl} target="_blank" rel="noopener noreferrer" className="tb win-map">
          {copy.common.mapOpen}
        </a>
      )}
    </div>
  );
}
