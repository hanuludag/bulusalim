// "Aynı grupla yeni plan" paneli.
import { useId, useState } from 'react';
import { copy } from '../copy';
import { Sheet } from '../../core/components/Sheet';
import { nextPlanName } from '../planName';

export function NewPlanSheet({ open, roomName, onClose, onSubmit }: { open: boolean; roomName: string; onClose: () => void; onSubmit: (name: string) => Promise<void> }) {
  if (!open) return null;
  return <Body roomName={roomName} onClose={onClose} onSubmit={onSubmit} />;
}

function Body({ roomName, onClose, onSubmit }: { roomName: string; onClose: () => void; onSubmit: (name: string) => Promise<void> }) {
  const titleId = useId();
  const suggested = nextPlanName(roomName);
  const [name, setName] = useState(suggested);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) {
      setError(true);
      return;
    }
    setBusy(true);
    await onSubmit(name);
    setBusy(false);
  }

  return (
    <Sheet open onClose={onClose} labelledBy={titleId} as="form" onSubmit={() => void submit()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 id={titleId} className="h1">
          {copy.newPlan.title}
        </h2>
        <p className="sec">{copy.newPlan.sub}</p>
      </div>
      <div className="fld">
        <label htmlFor="plan-name">{copy.newPlan.label}</label>
        <input
          id="plan-name"
          className="inp"
          placeholder={suggested}
          value={name}
          maxLength={40}
          autoComplete="off"
          aria-invalid={error}
          aria-describedby={error ? 'plan-err' : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        {error && (
          <p id="plan-err" className="err">
            {copy.home.errRoom}
          </p>
        )}
      </div>
      <button className="btn" type="submit" disabled={busy}>
        {copy.newPlan.submit}
      </button>
    </Sheet>
  );
}
