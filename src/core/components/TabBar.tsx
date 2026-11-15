// TabBar: alt sekmeler. Her sekme gerçek bir buton; bulunulan sekme aria-current taşır.
import type { ReactNode } from 'react';
import './TabBar.css';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon: ReactNode;
  dot?: boolean;
}

export interface TabBarProps<K extends string> {
  items: TabItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  label?: string;
}

export function TabBar<K extends string>({ items, active, onSelect, label }: TabBarProps<K>) {
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`tab${t.key === active ? ' on' : ''}`}
          aria-current={t.key === active ? 'page' : undefined}
          onClick={() => onSelect(t.key)}
        >
          {t.icon}
          {t.label}
          {t.dot && <span className="dot" aria-hidden="true" />}
        </button>
      ))}
    </nav>
  );
}
