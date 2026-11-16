// Katıl: kim çağırdı + oda adı + ad + Katıl. Aynı isim varsa "Sen misin?".
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { landingScreen } from '../landing';
import type { Member, RoomSnapshot } from '../types';
import { cleanName, findByName, NAME_MAX } from '../../core/names';
import { useToast } from '../../core/useToast';
import './Home.css';

export default function Join({ snap }: { snap: RoomSnapshot }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { room, members } = snap;
  const creator = members.find((m) => m.id === room.createdBy) ?? members[0];

  function enter(m: Member, isNew: boolean) {
    device.bindMember(room.id, m.id);
    device.setLastName(m.name);
    device.setLastRoom({ id: room.id, name: room.name });
    navigate(`/r/${room.id}/${isNew ? 'cevap' : landingScreen(snap, m.id)}`, { replace: true });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) {
      setError(copy.common.errName);
      return input.current?.focus();
    }
    setError(null);
    const existing = findByName(members, clean);
    if (existing) return setMatch(existing);
    setBusy(true);
    try {
      enter(await store.joinRoom(room.id, clean), true);
    } catch (err) {
      console.error('[bulusalim] Katılınamadı', err);
      toast.show(copy.common.saveFailed, 2500);
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="bar">
        <Link to="/" className="logo">
          {copy.common.logo}
        </Link>
      </header>
      <div className="pad home-head">
        {creator && <p className="sec">{copy.join.invitedBy(creator.name)}</p>}
        <h1 className="h1">{room.name}</h1>
      </div>
      <form id="join" className="pad join-form" onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="join-name">{copy.join.nameLabel}</label>
          <input
            ref={input}
            id="join-name"
            className="inp"
            placeholder={copy.join.nameHint}
            value={name}
            maxLength={NAME_MAX}
            autoComplete="given-name"
            aria-invalid={!!error}
            aria-describedby={error ? 'join-err' : undefined}
            readOnly={!!match}
            onChange={(e) => setName(e.target.value)}
          />
          {error && (
            <p id="join-err" className="err">
              {error}
            </p>
          )}
          {match && (
            <p className="m join-q" role="alert">
              {copy.join.sameName(match.name)}
            </p>
          )}
        </div>
      </form>
      <div className="grow" />
      <div className="dock">
        {match ? (
          <>
            <button className="btn" type="button" onClick={() => enter(match, false)}>
              {copy.join.itsMe}
            </button>
            <button
              className="btn2"
              type="button"
              onClick={() => {
                setMatch(null);
                setName('');
                requestAnimationFrame(() => input.current?.focus());
              }}
            >
              {copy.join.otherName}
            </button>
          </>
        ) : (
          <button className="btn" type="submit" form="join" disabled={busy}>
            {copy.join.submit}
          </button>
        )}
      </div>
    </main>
  );
}
