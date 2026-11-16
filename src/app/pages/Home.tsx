// Ana sayfa: oda adı (hazır "Buluşma") + ad → oda kur. Hafta başlangıcı = bugün.
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { todayString } from '../../core/format';
import { cleanName, NAME_MAX } from '../../core/names';
import { useToast } from '../../core/useToast';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [roomName, setRoomName] = useState<string>(copy.home.roomDefault);
  const [name, setName] = useState(() => device.getLastName());
  const [errors, setErrors] = useState<{ room?: string; name?: string }>({});
  const [busy, setBusy] = useState(false);
  const lastRoom = device.getLastRoom();
  const roomInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!roomName.trim()) next.room = copy.home.errRoom;
    if (!cleanName(name)) next.name = copy.common.errName;
    setErrors(next);
    if (next.room) return roomInput.current?.focus();
    if (next.name) return nameInput.current?.focus();
    setBusy(true);
    try {
      const { room, creator } = await store.createRoom({ name: roomName, startDate: todayString(), creatorName: name });
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
        <span className="logo">{copy.common.logo}</span>
      </header>
      {lastRoom && (
        <Link to={`/r/${lastRoom.id}`} className="pad last-room">
          <span className="sec">{copy.home.lastRoom(lastRoom.name)}</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <div className="pad home-head">
        <h1 className="h1">{copy.home.title}</h1>
        <p className="sec">{copy.home.sub}</p>
      </div>
      <form id="create" className="pad home-form" onSubmit={submit} noValidate>
        {field('room', copy.home.roomLabel, roomName, setRoomName, roomInput, errors.room)}
        {field('name', copy.home.nameLabel, name, setName, nameInput, errors.name, copy.home.nameHint, NAME_MAX)}
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
