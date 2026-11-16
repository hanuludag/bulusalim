// Dock: ekranın altına yapışık buton alanı. Belirirken alttan kayar (hareket azaltma açıksa kaymaz).
import type { ReactNode } from 'react';
import './Dock.css';

export function Dock({ children }: { children: ReactNode }) {
  return <div className="dock2">{children}</div>;
}
