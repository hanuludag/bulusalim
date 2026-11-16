// Fikir satırı: ad, yer, not, kim ekledi, ⋯ menüsü (ekleyen düzenler; ekleyen ya da kurucu siler),
// Onaylıyorum / Onaylamıyorum, altında küçük "✓2 Ali, Veli · ✗1 Ayşe".
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { VoteLine } from './VoteLine';
import { copy } from '../copy';
import type { Idea, VoteValue } from '../types';
import { DotsIcon } from '../../core/components/Icons';
import './IdeaRow.css';

export interface IdeaRowProps {
  idea: Idea;
  myVote: VoteValue | null;
  yesNames: string[];
  noNames: string[];
  addedBy: string;
  canEdit: boolean;
  canDelete: boolean;
  onVote: (v: VoteValue) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Verilirse ⋯ menüsünde "Zamanını değiştir" */
  onMove?: () => void;
  /** Satırın altına eklenecek küçük içerik (ör. gün oyu) */
  extra?: ReactNode;
}

export function IdeaRow({ idea, myVote, yesNames, noNames, addedBy, canEdit, canDelete, onVote, onEdit, onDelete, onMove, extra }: IdeaRowProps) {
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
          {addedBy && <p className="sec s13">{copy.ideas.addedBy(addedBy)}</p>}
        </div>
        {(canEdit || canDelete) && (
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
            {canEdit && (
              <button role="menuitem" type="button" onClick={pick(onEdit)}>
                {copy.ideas.edit}
              </button>
            )}
            {canDelete && onMove && (
              <button role="menuitem" type="button" onClick={pick(onMove)}>
                {copy.occasion.move}
              </button>
            )}
            {canDelete && (
              <button role="menuitem" type="button" onClick={pick(onDelete)}>
                {copy.ideas.delete}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="votes" role="group" aria-label={idea.name}>
        <button className={`vote${myVote === 'yes' ? ' yes' : ''}`} type="button" aria-pressed={myVote === 'yes'} onClick={() => onVote('yes')}>
          {copy.ideas.yes}
        </button>
        <button className={`vote${myVote === 'no' ? ' no' : ''}`} type="button" aria-pressed={myVote === 'no'} onClick={() => onVote('no')}>
          {copy.ideas.no}
        </button>
      </div>
      <VoteLine yes={yesNames} no={noNames} />
      {extra}
    </li>
  );
}
