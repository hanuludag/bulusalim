// Oda menüsü (üst çubuktaki ⋯): Odalarım, Yeni oda, üyeler. Kurucu: ad, günler, üye çıkar, odayı sil.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { store } from '../runtime';
import { roomDays } from '../days';
import { MAX_DAYS } from '../store';
import type { Member, RoomSnapshot } from '../types';
import { DayPicker } from './DayPicker';
import { ToggleRow } from './Toggle';
import { Sheet } from '../../core/components/Sheet';
import { useToast } from '../../core/useToast';
import './RoomMenu.css';

type View = { k: 'main' } | { k: 'rename' } | { k: 'days' } | { k: 'remove'; m: Member } | { k: 'delete' } | { k: 'forget' };

export interface RoomMenuProps {
  open: boolean;
  onClose: () => void;
  snap: RoomSnapshot;
  me: Member;
  refresh: () => Promise<void>;
}

export function RoomMenu({ open, onClose, snap, me, refresh }: RoomMenuProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState<View>({ k: 'main' });
  const [name, setName] = useState(snap.room.name);
  const [days, setDays] = useState<string[]>(() => roomDays(snap.room));
  const [busy, setBusy] = useState(false);
  const isCreator = snap.room.createdBy === me.id;
  const roomId = snap.room.id;

  function close() {
    setView({ k: 'main' });
    onClose();
  }
  function go(k: View['k']) {
    if (k === 'rename') setName(snap.room.name);
    if (k === 'days') setDays(roomDays(snap.room));
    setView({ k } as View);
  }
  async function run(action: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    try {
      await action();
      if (after) after();
      else {
        await refresh();
        setView({ k: 'main' });
      }
    } catch (e) {
      console.error('[bulusalim] Oda ayarı kaydedilemedi', e);
      toast.show(copy.common.saveFailed, 2500);
    } finally {
      setBusy(false);
    }
  }
  // Önce ana sayfaya git; odayı listeden ana sayfa çıkarır (burada silersek oda ekranı "üye değilsin" sanıp geri döner)
  const leave = (msg?: string) => () => {
    onClose();
    if (msg) toast.show(msg, 2000);
    navigate('/', { replace: true, state: { forget: roomId } });
  };

  let body: React.ReactNode;
  if (view.k === 'rename') {
    body = (
      <form
        className="rm-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void run(() => store.renameRoom(roomId, me.id, name));
        }}
      >
        <div className="fld">
          <label htmlFor="rm-name">{copy.menu.renameLabel}</label>
          <input id="rm-name" className="inp" value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={busy || !name.trim()}>{copy.menu.save}</button>
        <button className="btn2" type="button" onClick={() => setView({ k: 'main' })}>{copy.menu.cancel}</button>
      </form>
    );
  } else if (view.k === 'days') {
    body = (
      <div className="rm-form">
        <h2 className="h2">{copy.menu.editDays}</h2>
        <p className="sec s13">{copy.menu.editDaysSub}</p>
        <DayPicker value={days} onChange={setDays} onLimit={() => toast.show(copy.days.max(MAX_DAYS), 2000)} />
        <button className="btn" type="button" disabled={busy || days.length === 0} onClick={() => void run(() => store.setDays(roomId, me.id, days))}>
          {copy.menu.save}
        </button>
        <button className="btn2" type="button" onClick={() => setView({ k: 'main' })}>{copy.menu.cancel}</button>
      </div>
    );
  } else if (view.k === 'remove' || view.k === 'delete' || view.k === 'forget') {
    const t =
      view.k === 'remove'
        ? { title: copy.menu.removeTitle(view.m.name), sub: copy.menu.removeSub, label: copy.menu.remove, act: () => run(() => store.removeMember(roomId, me.id, view.m.id)) }
        : view.k === 'delete'
          ? { title: copy.menu.deleteTitle(snap.room.name), sub: copy.menu.deleteSub, label: copy.menu.deleteRoom, act: () => run(() => store.deleteRoom(roomId, me.id), leave(copy.menu.deleted)) }
          : { title: copy.menu.forget, sub: copy.menu.forgetSub, label: copy.menu.forget, act: async () => leave()() };
    body = (
      <div className="rm-form">
        <h2 className="h1">{t.title}</h2>
        <p className="sec">{t.sub}</p>
        <button className="btn" type="button" disabled={busy} onClick={() => void t.act()}>{t.label}</button>
        <button className="btn2" type="button" onClick={() => setView({ k: 'main' })}>{copy.menu.cancel}</button>
      </div>
    );
  } else {
    body = (
      <>
        <h2 className="h2 rm-title">{snap.room.name}</h2>
        <div className="rm-links">
          <button className="rm-row" type="button" onClick={() => { close(); navigate('/'); }}>
            {copy.menu.myRooms} <span aria-hidden="true">→</span>
          </button>
          <button className="rm-row" type="button" onClick={() => { close(); navigate('/yeni'); }}>
            {copy.menu.newRoom} <span aria-hidden="true">+</span>
          </button>
        </div>
        <section>
          <p className="sec s13 rm-sec">{copy.menu.members(snap.members.length)}</p>
          <ul>
            {snap.members.map((m) => (
              <li key={m.id} className="rm-member">
                <span>
                  {m.name}
                  {m.id === snap.room.createdBy && <span className="sec s13"> · {copy.menu.creator}</span>}
                  {m.id === me.id && <span className="sec s13"> · {copy.menu.you}</span>}
                </span>
                {isCreator && m.id !== me.id && (
                  <button className="tb sm" type="button" onClick={() => setView({ k: 'remove', m })}>
                    {copy.menu.remove}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
        {isCreator ? (
          <div className="rm-links">
            <ToggleRow
              on={!!snap.room.dayVoting}
              onLabel={copy.dayVote.menuOn}
              offLabel={copy.dayVote.menuOff}
              sub={copy.dayVote.menuSub}
              disabled={busy}
              onToggle={() => void run(() => store.setDayVoting(roomId, me.id, !snap.room.dayVoting))}
            />
            <ToggleRow
              on={!!snap.room.distribution}
              onLabel={copy.distribution.menuOn}
              offLabel={copy.distribution.menuOff}
              sub={copy.distribution.menuSub}
              disabled={busy}
              onToggle={() => void run(() => store.setDistribution(roomId, me.id, !snap.room.distribution))}
            />
            <button className="rm-row" type="button" onClick={() => go('rename')}>{copy.menu.rename}</button>
            <button className="rm-row" type="button" onClick={() => go('days')}>{copy.menu.editDays}</button>
            <button className="rm-row danger" type="button" onClick={() => go('delete')}>{copy.menu.deleteRoom}</button>
          </div>
        ) : (
          <div className="rm-links">
            <p className="sec s13 rm-sec">{copy.menu.creatorOnly}</p>
            <button className="rm-row" type="button" onClick={() => go('forget')}>{copy.menu.forget}</button>
          </div>
        )}
      </>
    );
  }

  return (
    <Sheet open={open} onClose={close} label={copy.menu.title}>
      <div className="rm">{body}</div>
    </Sheet>
  );
}
