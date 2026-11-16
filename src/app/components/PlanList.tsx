// Gün gün plan: her gün+dilimin kazanan fikri. detail = kurucu görünümü (onay sayısı ve kaç kişi boş).
import { copy } from '../copy';
import type { Result } from '../result';
import { slotHours, slotLower } from '../slots';
import { formatDate } from '../../core/format';
import './PlanList.css';

export function PlanList({ result, detail = false }: { result: Result; detail?: boolean }) {
  return (
    <ol className="plan">
      {result.plan.map((o) => {
        const top = o.ideas[0];
        return (
          <li key={`${o.day}-${o.slot}`} className={`plan-row${o.winner ? '' : ' none'}`}>
            <p className="mono s13 plan-when">
              {formatDate(o.day)} {slotLower(o.slot)} <span className="sec">{slotHours(o.slot)}</span>
            </p>
            <p className="plan-what">
              {o.winner ? (o.winner.place ? `${o.winner.name} · ${o.winner.place}` : o.winner.name) : copy.guest.noWinner}
            </p>
            {detail && (
              <p className="sec s13 mono">
                {o.winner && top ? `✓${top.yes} ✗${top.no} · ` : ''}
                {copy.result.planFree(o.freeCount, result.totalMembers)}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
