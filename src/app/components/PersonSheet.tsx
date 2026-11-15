// Kişi paneli: o dilimde kim boş, kim hiç saat seçmedi.
import { useId } from 'react';
import { copy } from '../copy';
import { slotHours, slotLabel } from '../slots';
import type { Member, RoomSnapshot, Slot } from '../types';
import { formatDate } from '../../core/format';
import { Sheet } from '../../core/components/Sheet';
import { Avatar } from '../../core/components/Avatar';
import './PersonSheet.css';

function People({ title, people }: { title: string; people: Member[] }) {
  return (
    <div className="ps-group">
      <p className="sec s13">{title}</p>
      <ul className="ps-list">
        {people.map((m) => (
          <li key={m.id}>
            <Avatar name={m.name} />
            {m.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PersonSheet({ snap, cell, onClose }: { snap: RoomSnapshot; cell: { day: string; slot: Slot } | null; onClose: () => void }) {
  const titleId = useId();
  if (!cell) return null;
  const free = snap.members.filter((m) =>
    snap.availability.some((a) => a.memberId === m.id && a.day === cell.day && a.slot === cell.slot),
  );
  // "Henüz seçmedi" = HİÇ saat seçmemiş üyeler
  const notYet = snap.members.filter((m) => !snap.availability.some((a) => a.memberId === m.id));

  return (
    <Sheet open onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="h2 mono ps-title">
        {copy.time.sheetTitle(formatDate(cell.day), slotLabel(cell.slot), slotHours(cell.slot))}
      </h2>
      {free.length > 0 && <People title={copy.time.free} people={free} />}
      {notYet.length > 0 && <People title={copy.time.notYet} people={notYet} />}
    </Sheet>
  );
}
