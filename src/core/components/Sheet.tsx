// Sheet: alttan açılan panel + arka perde (scrim).
// Açılınca odak panelin içine gider, Esc ile kapanır, Tab panelin dışına çıkmaz, arka plan kaymaz.
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Sheet.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
  as?: 'div' | 'form';
  onSubmit?: () => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, labelledBy, label, role = 'dialog', children, as = 'div', onSubmit }: SheetProps) {
  const panel = useRef<HTMLDivElement & HTMLFormElement>(null);
  const closeRef = useRef(onClose);
  const downOnScrim = useRef(false);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add('no-scroll');
    // ilk alan ya da ilk buton odak alır
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>('input, textarea') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab' && el) {
        const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const firstItem = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const Tag = as;
  return createPortal(
    <div className="sheet-root">
      <div
        className="scrim"
        aria-hidden="true"
        // Sadece perdenin üstünde BAŞLAYAN dokunuş kapatır. Uzun basmadan sonra tarayıcının
        // ürettiği "tık" olayı perdeye denk gelse bile paneli kapatmaz.
        onPointerDown={() => {
          downOnScrim.current = true;
        }}
        onClick={() => {
          if (downOnScrim.current) onClose();
          downOnScrim.current = false;
        }}
      />
      <Tag
        ref={panel}
        className="sheet"
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        noValidate={as === 'form' ? true : undefined}
        onSubmit={
          as === 'form'
            ? (e: React.FormEvent) => {
                e.preventDefault();
                onSubmit?.();
              }
            : undefined
        }
      >
        <span className="grab" aria-hidden="true" />
        {children}
      </Tag>
    </div>,
    document.body,
  );
}
