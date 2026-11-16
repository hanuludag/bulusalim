// Yeni oda: oda adı (hazır "Buluşma") + ad + günler → oda kur.
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { nextDays } from '../days';
import { MAX_DAYS } from '../store';
import { DayPicker } from '../components/DayPicker';
import { BackIcon } from '../../core/components/Icons';
import { cleanName, NAME_MAX } from '../../core/names';
import { useToast } from '../../core/useToast';
import './Home.css';

export default function CreateRoom({ showBack = true }: { showBack?: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [roomName, setRoomName] = useState<string>(copy.home.roomDefault);
  const [name, setName] = useState(() => device.getLastName());
  const [days, setDays] = useState<string[]>(() => nextDays(7));
  const [errors, setErrors] = useState<{ room?: string; name?: string; days?: string }>({});
  const [busy, setBusy] = useState(false);
  const roomInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!roomName.trim()) next.room = copy.home.errRoom;
    if (!cleanName(name)) next.name = copy.common.errName;
    if (days.length === 0) next.days = copy.home.errDays;
    setErrors(next);
    if (next.room) return roomInput.current?.focus();
    if (next.name) return nameInput.current?.focus();
    if (next.days) return;
    setBusy(true);
    try {
      const { room, creator } = await store.createRoom({ name: roomName, startDate: days[0], creatorName: name, days });
      device.bindMember(room.id, creator.id);
      device.setLastName(creator.name);
      device.setLastRoom({ id: room.id, name: room.name });
      navigate(`/r/${room.id}/hazir`);
    } catch (err) {
      console.error('[bulusalim] Oda kurulamadı', err);
      toast.show(copy.common.saveFailed, 2500);
      setBusy(false);
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, ref: React.RefObject<HTMLInputElement>, err?: string, hint?: string, max = 40) => (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <input
        ref={ref}
        id={id}
        className="inp"
        placeholder={hint}
        value={value}
        maxLength={max}
        autoComplete="off"
        aria-invalid={!!err}
        aria-describedby={err ? `${id}-err` : undefined}
        onChange={(e) => set(e.target.value)}
      />
      {err && (
        <p id={`${id}-err`} className="err">
          {err}
        </p>
      )}
    </div>
  );

  return (
    <main className="page">
      <header className="bar">
        {showBack ? (
          <Link to="/" className="logo home-back">
            <BackIcon /> {copy.home.myRooms}
          </Link>
        ) : (
          <span className="logo">{copy.common.logo}</span>
        )}
      </header>
      <div className="pad home-head">
        <h1 className="h1">{showBack ? copy.home.newTitle : copy.home.title}</h1>
        <p className="sec">{copy.home.sub}</p>
      </div>
      <form id="create" className="pad home-form" onSubmit={submit} noValidate>
        {field('room', copy.home.roomLabel, roomName, setRoomName, roomInput, errors.room)}
        {field('name', copy.home.nameLabel, name, setName, nameInput, errors.name, copy.home.nameHint, NAME_MAX)}
        <div className="fld">
          <label>{copy.home.daysLabel}</label>
          <DayPicker
            value={days}
            onChange={(d) => {
              setDays(d);
              if (d.length) setErrors((x) => ({ ...x, days: undefined }));
            }}
            error={errors.days}
            onLimit={() => toast.show(copy.days.max(MAX_DAYS), 2000)}
          />
        </div>
      </form>
      <div className="grow" />
      <div className="dock">
        <button className="btn" type="submit" form="create" disabled={busy}>
          {copy.home.submit}
        </button>
      </div>
    </main>
  );
}
