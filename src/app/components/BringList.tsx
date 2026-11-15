// Getirilecekler (sadece kesin sonuçta): "Ben getiririm", "{isim} getiriyor", "Vazgeç", "+ Madde ekle".
import { useState, type FormEvent } from 'react';
import { copy } from '../copy';
import type { Item, Member } from '../types';
import './BringList.css';

export interface BringListProps {
  items: Item[];
  members: Member[];
  meId: string;
  onClaim: (item: Item, claim: boolean) => void;
  onAdd: (name: string) => Promise<boolean>;
}

export function BringList({ items, members, meId, onClaim, onAdd }: BringListProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onAdd(name)) {
      setName('');
      setAdding(false);
    }
  }

  return (
    <section aria-labelledby="bring-title">
      <h2 id="bring-title" className="h2 section-title">
        {copy.result.bringTitle}
      </h2>
      <ul>
        {items.map((it) => (
          <li key={it.id} className="br">
            <span className="bring-name">{it.name}</span>
            {it.claimedBy === null ? (
              <button className="btn2 sm" type="button" onClick={() => onClaim(it, true)}>
                {copy.result.bringClaim}
              </button>
            ) : it.claimedBy === meId ? (
              <span className="bring-mine">
                <span className="sec">{copy.result.bringBy(nameOf(meId))}</span>
                <button className="tb sm muted" type="button" onClick={() => onClaim(it, false)}>
                  {copy.result.bringUnclaim}
                </button>
              </span>
            ) : (
              <span className="sec">{copy.result.bringBy(nameOf(it.claimedBy))}</span>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <form className="bring-add" onSubmit={submit} noValidate>
          <div className="fld grow">
            <label htmlFor="bring-name">{copy.result.bringLabel}</label>
            <input
              id="bring-name"
              className="inp"
              placeholder={copy.result.bringHint}
              value={name}
              maxLength={40}
              autoComplete="off"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
            />
          </div>
          <button className="btn2 sm" type="submit">
            {copy.result.bringSubmit}
          </button>
        </form>
      ) : (
        <button className="tb bring-open" type="button" onClick={() => setAdding(true)}>
          {copy.result.bringAdd}
        </button>
      )}
    </section>
  );
}
