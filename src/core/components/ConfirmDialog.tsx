// ConfirmDialog: tarayıcının confirm() penceresi yerine kendi onay panelimiz.
import { useId } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const id = useId();
  return (
    <Sheet open={open} onClose={onCancel} labelledBy={id} role="alertdialog">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <h2 id={id} className="h1">
          {title}
        </h2>
        {body && <p className="sec">{body}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  );
}
