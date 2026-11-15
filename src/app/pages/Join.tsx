// Katıl (§6, §18): isimle katıl, aynı isim varsa "Sen misin?".
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { landingTab } from '../landing';
import type { Member, RoomSnapshot } from '../types';
import { cleanName, findByName, NAME_MAX } from '../../core/names';
import { useToast } from '../../core/useToast';
import { Avatar } from '../../core/components/Avatar';
import './Join.css';

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
  const shown = members.slice(0, 2).map((m) => m.name);
  const extra = members.length - shown.length;

  function enter(member: Member, isNew: boolean) {
    device.bindMember(room.id, member.id);
    device.setLastName(member.name);
    device.setLastRoom({ id: room.id, name: room.name });
    navigate(`/r/${room.id}/${isNew ? 'fikirler' : landingTab(snap, member.id)}`, {
      replace: true,
      state: isNew ? undefined : { welcome: true },
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) {
      setError(copy.common.errName);
      input.current?.focus();
      return;
    }
    setError(null);
    const existing = findByName(members, clean);
    if (existing) {
      setMatch(existing);
      return;
    }
    setBusy(true);
    try {
      const m = await store.joinRoom(room.id, clean);
      enter(m, true);
    } catch {
      toast.show(copy.common.saveFailed);
      setBusy(false);
    }
  }

  function otherName() {
    setMatch(null);
    setName('');
    requestAnimationFrame(() => input.current?.focus());
  }

  return (
    <main className="page">
      <header className="bar">
        <Link to="/" className="logo">
          {copy.common.logo}
        </Link>
      </header>
      <div className="pad join-head">
        {creator && <p className="sec">{copy.join.invitedBy(creator.name)}</p>}
        <h1 className="h1">{room.name}</h1>
        <p className="sec">{copy.join.sub}</p>
      </div>
      {members.length > 0 && (
        <div className="pad join-members-wrap">
          <div className="join-members">
            <div className="join-avatars">
              {members.slice(0, 4).map((m) => (
                <Avatar key={m.id} name={m.name} />
              ))}
            </div>
            <span className="s13">
              {copy.join.inRoom}
              {shown.join(', ')}
              {extra > 0 && <span className="mono"> {copy.join.more(extra)}</span>}
            </span>
          </div>
        </div>
      )}
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
        </div>
        {match && (
          <p className="m join-q" role="alert">
            {copy.join.sameName(match.name)}
          </p>
        )}
      </form>
      <div className="grow" />
      <div className="dock">
        {match ? (
          <>
            <button className="btn" type="button" onClick={() => enter(match, false)}>
              {copy.join.itsMe}
            </button>
            <button className="btn2" type="button" onClick={otherName}>
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
