// Zaman kutusu (§25): kısa dokunuş seç/kaldır, 450 ms basılı tutma kişi panelini açar.
// Parmak 10px'ten fazla kayarsa iptal (kaydırmayla karışmasın). Klavye: Enter/Boşluk seç, Shift+Enter panel.
import { useRef } from 'react';

const HOLD_MS = 450;
const MOVE_PX = 10;

export interface TimeCellProps {
  text: string;
  label: string;
  mine: boolean;
  all: boolean;
  zero: boolean;
  onToggle: () => void;
  onHold: () => void;
}

export function TimeCell({ text, label, mine, all, zero, onToggle, onHold }: TimeCellProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const fromPointer = useRef(false);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <button
      type="button"
      className={['c', mine && 'me', all && 'all', zero && !mine && 'z'].filter(Boolean).join(' ')}
      aria-pressed={mine}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        // Dokunuşu bu kutuya bağla: tarayıcı uzun basmada "pointerleave" gönderse de iptal olmasın
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* desteklenmiyorsa sorun değil */
        }
        fromPointer.current = true;
        held.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = setTimeout(() => {
          held.current = true;
          timer.current = null;
          onHold(); // seçimi DEĞİŞTİRMEZ
        }, HOLD_MS);
      }}
      onPointerMove={(e) => {
        if (!start.current || !timer.current) return;
        if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_PX) {
          clear();
          start.current = null;
        }
      }}
      onPointerUp={() => {
        if (timer.current) {
          clear();
          if (start.current) onToggle(); // süre dolmadan bırakıldı → seç/kaldır
        }
        start.current = null;
      }}
      onPointerCancel={() => {
        clear();
        start.current = null;
      }}
      onClick={(e) => {
        // Fareyle/parmakla basışlar pointer olaylarında işlendi; burada sadece klavye (Enter/Boşluk)
        if (fromPointer.current) {
          fromPointer.current = false;
          e.preventDefault();
          return;
        }
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          onHold();
        } else if (e.key === 'Enter' || e.key === ' ') {
          fromPointer.current = false;
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {text}
    </button>
  );
}
