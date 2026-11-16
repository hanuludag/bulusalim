// Öneri şeridi: üstte küçük kategori filtresi, altında yatay kayan öneri kutuları.
// "+ ekle" fikri hemen ekler; listede olan "eklendi ✓".
import { useState } from 'react';
import { copy } from '../copy';
import { SUGGESTION_TAGS, SUGGESTIONS, type Suggestion, type SuggestionTag } from '../suggestions';
import type { Idea } from '../types';
import { sameName } from '../../core/names';
import './SuggestionStrip.css';

type Filter = SuggestionTag | 'all' | 'free';

export function SuggestionStrip({ ideas, onPick, title }: { ideas: Idea[]; onPick: (s: Suggestion) => void; title?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = SUGGESTIONS.filter((s) => filter === 'all' || (filter === 'free' ? s.free : s.tag === filter));
  const chips: Array<[Filter, string]> = [['all', copy.suggestions.all], ['free', copy.suggestions.free], ...SUGGESTION_TAGS.map((t): [Filter, string] => [t, t])];
  return (
    <section className="sug-section">
      {title && <p className="sec s13 sug-title">{copy.suggestions.title}</p>}
      <div className="sug-filter" role="group" aria-label={copy.suggestions.filter}>
        {chips.map(([f, label]) => (
          <button key={f} type="button" className="sug-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
      </div>
      <ul key={filter} className="sug-strip" aria-label={copy.suggestions.title}>
        {list.map((s) => {
          const added = ideas.some((i) => sameName(i.name, s.name));
          return (
            <li key={s.id} className="sug">
              <span className="b">{s.name}</span>
              <span className="sec s13">{s.free ? `${s.tag} · ${copy.suggestions.free.toLocaleLowerCase('tr')}` : s.tag}</span>
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
