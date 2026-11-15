// Fikir satırı: ad, yer, not, harita linki, ⋯ menüsü (sadece ekleyene), puan butonları, durum.
import { useEffect, useRef, useState } from 'react';
import { copy } from '../copy';
import type { Idea } from '../types';
import { RatingButtons } from '../../core/components/RatingButtons';
import { DotsIcon } from '../../core/components/Icons';
import './IdeaRow.css';

export interface IdeaRowProps {
  idea: Idea;
  myScore: number | null;
  ratedCount: number;
  mine: boolean;
  showHint: boolean;
  onRate: (score: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IdeaRow({ idea, myScore, ratedCount, mine, showHint, onRate, onEdit, onDelete }: IdeaRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') {
          setMenuOpen(false);
          btnRef.current?.focus();
        }
        return;
      }
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    menuRef.current?.querySelector('button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  return (
    <li className="idea">
      <div className="idea-top">
        <div className="idea-text">
          <p className="nm">{idea.name}</p>
          {idea.place && <p className="sec">{idea.place}</p>}
          {idea.note && <p className="sec s13">{idea.note}</p>}
        </div>
        {(idea.mapUrl || mine) && (
          <div className="idea-actions">
            {idea.mapUrl && (
              <a href={idea.mapUrl} target="_blank" rel="noopener noreferrer" className="tb sm">
                {copy.common.mapOpen}
              </a>
            )}
            {mine && (
              <button
                ref={btnRef}
                className={`ib${menuOpen ? ' ib-on' : ''}`}
                type="button"
                aria-label={copy.ideas.menu}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <DotsIcon />
              </button>
            )}
          </div>
        )}
        {menuOpen && (
          <div ref={menuRef} className="idea-menu" role="menu">
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              {copy.ideas.edit}
            </button>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              {copy.ideas.delete}
            </button>
          </div>
        )}
      </div>
      <RatingButtons value={myScore} onChange={onRate} labelFor={copy.ideas.rateLabel} groupLabel={idea.name} />
      {showHint && <p className="sec s13 idea-hint">{copy.ideas.hintRating}</p>}
      <p className="s13 idea-status">
        {myScore === 1 && <span className="b">{copy.ideas.veto}</span>}
        {ratedCount > 0 && <span className="sec">{copy.ideas.groupRated(ratedCount)}</span>}
      </p>
    </li>
  );
}
