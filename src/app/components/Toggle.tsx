// Menüde aç/kapa satırı: başlık + küçük açıklama + anahtar.
import './RoomMenu.css';

export function ToggleRow({ on, onLabel, offLabel, sub, disabled, onToggle }: {
  on: boolean; onLabel: string; offLabel: string; sub: string; disabled?: boolean; onToggle: () => void;
}) {
  return (
    <button className="rm-row rm-toggle" type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onToggle}>
      <span>
        {on ? onLabel : offLabel}
        <span className="sec s13 rm-sub">{sub}</span>
      </span>
      <span className={`rm-sw${on ? ' on' : ''}`} aria-hidden="true" />
    </button>
  );
}
