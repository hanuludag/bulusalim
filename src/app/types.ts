// Uygulamanın veri tipleri (§11). Ekranlar ve veri katmanı bu tiplerle konuşur.

export type ID = string; // crypto.randomUUID()
export type Slot = 'sabah' | 'ogle' | 'aksam';
export type Score = 1 | 2 | 3 | 4 | 5;
export type TabKey = 'fikirler' | 'zaman' | 'sonuc';

export interface Room {
  id: ID;
  name: string;
  startDate: string; // YYYY-MM-DD
  createdBy: ID;
  createdAt: number;
  itemsSeeded: boolean;
}

export interface Member {
  id: ID;
  roomId: ID;
  name: string;
  createdAt: number;
}

export interface Idea {
  id: ID;
  roomId: ID;
  name: string;
  place: string; // boş olabilir
  mapUrl: string; // boş olabilir
  note: string; // ≤140
  addedBy: ID;
  suggestionId: string | null;
  createdAt: number;
}

export interface Rating {
  roomId: ID;
  memberId: ID;
  ideaId: ID;
  score: Score | null;
  updatedAt: number;
}

export interface Availability {
  roomId: ID;
  memberId: ID;
  day: string; // YYYY-MM-DD
  slot: Slot;
}

// kayıt yoksa: henüz seçmedi
export interface Attendance {
  roomId: ID;
  memberId: ID;
  status: 'yes' | 'no';
}

export interface Item {
  id: ID;
  roomId: ID;
  name: string;
  claimedBy: ID | null;
  createdBy: ID | null;
  createdAt: number;
}

export interface RoomSnapshot {
  room: Room;
  members: Member[];
  ideas: Idea[];
  ratings: Rating[];
  availability: Availability[];
  attendance: Attendance[];
  items: Item[];
}
