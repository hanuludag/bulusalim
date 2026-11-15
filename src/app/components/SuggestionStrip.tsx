// Öneri şeridi: yatay kaydırılan öneri kutuları. Listede olan "eklendi ✓" görünür.
import { copy } from '../copy';
import { SUGGESTIONS, type Suggestion } from '../suggestions';
import type { Idea } from '../types';
import { sameName } from '../../core/names';
import './SuggestionStrip.css';

export function SuggestionStrip({ ideas, onPick }: { ideas: Idea[]; onPick: (s: Suggestion) => void }) {
  return (
    <section className="sug-section" aria-labelledby="sug-title">
      <p id="sug-title" className="pad sec s13 sug-title">
        {copy.ideas.suggestionsTitle}
      </p>
      <ul className="sug-strip">
        {SUGGESTIONS.map((s) => {
          const added = ideas.some((i) => sameName(i.name, s.name));
          return (
            <li key={s.id} className="sug">
              <span className="b">{s.name}</span>
              <span className="sec s13">{s.tag}</span>
              {added ? (
                <span className="s13 sug-added">{copy.ideas.suggestionAdded}</span>
              ) : (
                <button className="tb sm" type="button" onClick={() => onPick(s)} aria-label={`${s.name} ${copy.ideas.suggestionAdd}`}>
                  {copy.ideas.suggestionAdd}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
