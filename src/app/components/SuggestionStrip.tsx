// Öneri şeridi: yatay kayan öneri kutuları. "+ ekle" fikri hemen ekler; listede olan "eklendi ✓".
import { copy } from '../copy';
import { SUGGESTIONS, type Suggestion } from '../suggestions';
import type { Idea } from '../types';
import { sameName } from '../../core/names';
import './SuggestionStrip.css';

export function SuggestionStrip({ ideas, onPick, title }: { ideas: Idea[]; onPick: (s: Suggestion) => void; title?: boolean }) {
  return (
    <section className="sug-section">
      {title && <p className="sec s13 sug-title">{copy.suggestions.title}</p>}
      <ul className="sug-strip" aria-label={copy.suggestions.title}>
        {SUGGESTIONS.map((s) => {
          const added = ideas.some((i) => sameName(i.name, s.name));
          return (
            <li key={s.id} className="sug">
              <span className="b">{s.name}</span>
              <span className="sec s13">{s.tag}</span>
              {added ? (
                <span className="s13 sug-added">{copy.suggestions.added}</span>
              ) : (
                <button className="tb sm" type="button" onClick={() => onPick(s)} aria-label={`${s.name} ${copy.suggestions.add}`}>
                  {copy.suggestions.add}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
