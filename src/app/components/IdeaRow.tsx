// Fikir satırı: ad, yer, not, ⋯ menüsü (sadece ekleyene), Onaylıyorum / Onaylamıyorum.
import { useEffect, useRef, useState } from 'react';
import { copy } from '../copy';
import type { Idea, VoteValue } from '../types';
import { DotsIcon } from '../../core/components/Icons';
import './IdeaRow.css';

export interface IdeaRowProps {
  idea: Idea;
  myVote: VoteValue | null;
  yes: number;
  no: number;
  mine: boolean;
  onVote: (v: VoteValue) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IdeaRow({ idea, myVote, yes, no, mine, onVote, onEdit, onDelete }: IdeaRowProps) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') {
          setMenu(false);
          btnRef.current?.focus();
        }
        return;
      }
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    menuRef.current?.querySelector('button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menu]);

  const pick = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <li className="idea">
      <div className="idea-top">
        <div className="idea-text">
          <p className="nm">{idea.name}</p>
          {idea.place && <p className="sec">{idea.place}</p>}
          {idea.note && <p className="sec s13">{idea.note}</p>}
        </div>
        {mine && (
          <button
            ref={btnRef}
            className={`ib${menu ? ' ib-on' : ''}`}
            type="button"
            aria-label={copy.ideas.menu}
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((o) => !o)}
          >
            <DotsIcon />
          </button>
        )}
        {menu && (
          <div ref={menuRef} className="idea-menu" role="menu">
            <button role="menuitem" type="button" onClick={pick(onEdit)}>
              {copy.ideas.edit}
            </button>
            <button role="menuitem" type="button" onClick={pick(onDelete)}>
              {copy.ideas.delete}
            </button>
          </div>
        )}
      </div>
      <div className="votes" role="group" aria-label={idea.name}>
        <button className={`vote${myVote === 'yes' ? ' yes' : ''}`} type="button" aria-pressed={myVote === 'yes'} onClick={() => onVote('yes')}>
          {copy.ideas.yes}
          {yes > 0 && <span className="mono"> {yes}</span>}
        </button>
        <button className={`vote${myVote === 'no' ? ' no' : ''}`} type="button" aria-pressed={myVote === 'no'} onClick={() => onVote('no')}>
          {copy.ideas.no}
          {no > 0 && <span className="mono"> {no}</span>}
        </button>
      </div>
    </li>
  );
}
