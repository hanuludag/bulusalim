// Ana sayfa: oda kur (§6, §29).
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { formatDate, todayString } from '../../core/format';
import { cleanName, NAME_MAX } from '../../core/names';
import { useToast } from '../../core/useToast';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [roomName, setRoomName] = useState('');
  const [startDate, setStartDate] = useState(todayString());
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
      const { room, creator } = await store.createRoom({ name: roomName, startDate, creatorName: name });
      device.bindMember(room.id, creator.id);
      device.setLastName(creator.name);
      device.setLastRoom({ id: room.id, name: room.name });
      navigate(`/r/${room.id}/hazir`);
    } catch (err) {
      console.error('[bulusalim] Oda kurulamadı', err);
      toast.show(copy.common.saveFailed);
      setBusy(false);
    }
  }

  return (
    <main className="page home">
      <header className="bar">
        <span className="logo">{copy.common.logo}</span>
      </header>
      {lastRoom && (
        <Link to={`/r/${lastRoom.id}`} className="pad last-room">
          <span>
            <span className="sec">{copy.home.lastRoomPrefix}</span>
            <span className="b">{lastRoom.name}</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <div className="pad home-head">
        <h1 className="h1">{copy.home.title}</h1>
        <p className="sec">{copy.home.sub}</p>
      </div>
      <form id="create" className="pad home-form" onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="room">{copy.home.roomLabel}</label>
          <input
            ref={roomInput}
            id="room"
            className="inp"
            placeholder={copy.home.roomHint}
            value={roomName}
            maxLength={40}
            autoComplete="off"
            aria-invalid={!!errors.room}
            aria-describedby={errors.room ? 'room-err' : undefined}
            onChange={(e) => setRoomName(e.target.value)}
          />
          {errors.room && (
            <p id="room-err" className="err">
              {errors.room}
            </p>
          )}
        </div>
        <div className="fld">
          <label htmlFor="week">{copy.home.weekLabel}</label>
          {/* Görünen kısım biçimli metin; üstünde görünmez tarih alanı, dokununca seçici açılır */}
          <div className="date-wrap">
            <span className="inp mono date-face" aria-hidden="true">
              {formatDate(startDate)}
            </span>
            <input
              id="week"
              type="date"
              className="date-input"
              value={startDate}
              aria-describedby="week-note"
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* bazı tarayıcılar desteklemez */
                }
              }}
            />
          </div>
          <p id="week-note" className="hint">
            {copy.home.weekNote}
          </p>
        </div>
        <div className="fld">
          <label htmlFor="name">{copy.home.nameLabel}</label>
          <input
            ref={nameInput}
            id="name"
            className="inp"
            placeholder={copy.home.nameHint}
            value={name}
            maxLength={NAME_MAX}
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-err' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p id="name-err" className="err">
              {errors.name}
            </p>
          )}
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
