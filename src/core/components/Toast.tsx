// Toast: kısa bildirim ("Kaydedildi ✓"). aria-live="polite" ile ekran okuyucuya da okunur.
import './Toast.css';

export function Toast({ message }: { message: string | null }) {
  return (
    <div className="toast-wrap" aria-live="polite" role="status">
      {message && (
        <span className="toast" key={message}>
          {message}
        </span>
      )}
    </div>
  );
}
