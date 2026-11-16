// Test için örnek odalar (§13). Veri sabittir ve tahmin edilebilir (rastgele değil),
// böylece sonucu elle hesaplayıp kontrol edebilirsin. Beklenen sonuçlar demo.test.ts'te.
import type { Attendance, Availability, Idea, Item, Member, Rating, Room, RoomSnapshot, Score, Slot } from './types';
import { addDays } from '../core/format';
import type { DataStore } from './store';

export type DemoKind = 'eksik' | 'kesin';

export const DEMO_ROOM_NAME = 'Cumartesi ekibi';
export const DEMO_NAMES = ['Emirhan', 'Kaan', 'Mert', 'Berk', 'Arda', 'Yusuf'] as const;
type Name = (typeof DEMO_NAMES)[number];

const IDEAS = [
  { key: 'balik', name: 'Balık tutma', place: 'Moda sahili', mapUrl: 'https://maps.google.com/?q=Moda+sahili', note: 'Olta getiren olsun', suggestionId: 'balik', by: 'Emirhan' },
  { key: 'ders', name: 'Birlikte ders çalışma', place: 'Kütüphane', mapUrl: '', note: '', suggestionId: 'ders', by: 'Mert' },
  { key: 'hali', name: 'Halı saha', place: 'Mahalle', mapUrl: '', note: '', suggestionId: 'halisaha', by: 'Berk' },
  { key: 'sinema', name: 'Sinema', place: '', mapUrl: '', note: '', suggestionId: 'sinema', by: 'Emirhan' },
  { key: 'bowling', name: 'Bowling', place: '', mapUrl: '', note: '', suggestionId: 'bowling', by: 'Yusuf' },
] as const;
type IdeaKey = (typeof IDEAS)[number]['key'];

type Scores = Partial<Record<Name, Score>>;

// Puanlar: fikir → kişi → puan
const RATINGS: Record<DemoKind, Record<IdeaKey, Scores>> = {
  // 4 kişi cevap verdi: Emirhan, Mert, Berk, Yusuf. Kaan ve Arda bekleniyor.
  eksik: {
    balik: { Emirhan: 5, Mert: 4, Berk: 5, Yusuf: 4 }, // 18/4 = 4,5
    ders: { Emirhan: 3, Mert: 3, Berk: 3, Yusuf: 3 }, // 3,0 (4 kişi)
    hali: { Emirhan: 4, Mert: 1, Berk: 4, Yusuf: 3 }, // elendi (Mert)
    sinema: { Emirhan: 4, Mert: 3, Berk: 4, Yusuf: 4 }, // 15/4 = 3,75 → "3,8"
    bowling: { Emirhan: 3, Berk: 3 }, // 3,0 (2 kişi) → dersin altında
  },
  // 6 kişinin hepsi cevap verdi
  kesin: {
    balik: { Emirhan: 5, Kaan: 4, Mert: 4, Berk: 5, Arda: 4, Yusuf: 4 }, // 26/6 = 4,33 → "4,3"
    ders: { Emirhan: 3, Kaan: 3, Mert: 3, Berk: 4, Arda: 3, Yusuf: 3 }, // 19/6 = 3,17 → "3,2"
    hali: { Emirhan: 4, Kaan: 5, Mert: 1, Berk: 4, Arda: 4, Yusuf: 3 }, // elendi (Mert)
    sinema: { Emirhan: 4, Kaan: 4, Mert: 3, Berk: 4, Arda: 3, Yusuf: 4 }, // 22/6 = 3,67 → "3,7"
    bowling: { Emirhan: 3, Kaan: 2, Berk: 3, Arda: 2, Yusuf: 3 }, // 13/5 = 2,6
  },
};

// Boş saatler: [gün sırası (0 = başlangıç), dilim, kişiler]
type Free = [number, Slot, Name[]];
const AVAILABILITY: Record<DemoKind, Free[]> = {
  eksik: [
    [0, 'ogle', ['Emirhan', 'Mert', 'Berk', 'Yusuf']], // 4/4 → en iyi
    [0, 'aksam', ['Emirhan', 'Mert', 'Yusuf']], // 3
    [1, 'ogle', ['Emirhan', 'Berk', 'Yusuf']], // 3
    [0, 'sabah', ['Berk']], // 1
  ],
  kesin: [
    [0, 'ogle', ['Emirhan', 'Kaan', 'Mert', 'Berk', 'Yusuf']], // 5/6 → en iyi
    [0, 'aksam', ['Emirhan', 'Mert', 'Arda', 'Yusuf']], // 4
    [1, 'ogle', ['Emirhan', 'Kaan', 'Berk', 'Arda']], // 4
    [0, 'sabah', ['Kaan', 'Berk']], // 2
    [4, 'aksam', ['Arda', 'Yusuf']], // 2
    [1, 'aksam', ['Mert']], // 1
  ],
};

// Katılım (sonucu etkilemez). Eksik odada Kaan "geliyorum" demiş ama cevap vermemiş:
// bu, katılımın cevap sayılmadığını gösterir.
const ATTENDANCE: Record<DemoKind, Partial<Record<Name, 'yes' | 'no'>>> = {
  eksik: { Emirhan: 'yes', Mert: 'yes', Kaan: 'yes', Berk: 'no' }, // 3/6 geliyor
  kesin: { Emirhan: 'yes', Kaan: 'yes', Mert: 'yes', Berk: 'yes', Arda: 'no', Yusuf: 'yes' }, // 5/6 geliyor
};

/** Demo odasının bütün verisini üretir (saf fonksiyon). */
export function buildDemo(kind: DemoKind, startDate: string, newId: () => string, baseTime = 1_700_000_000_000): RoomSnapshot {
  const roomId = newId();
  const members: Member[] = DEMO_NAMES.map((name, i) => ({ id: newId(), roomId, name, createdAt: baseTime + i }));
  const idOf = (name: Name) => members[DEMO_NAMES.indexOf(name)].id;

  const room: Room = { id: roomId, name: DEMO_ROOM_NAME, startDate, createdBy: idOf('Emirhan'), createdAt: baseTime, itemsSeeded: false };

  const ideaIds: Record<string, string> = {};
  const ideas: Idea[] = IDEAS.map((x, i) => {
    const id = newId();
    ideaIds[x.key] = id;
    return {
      id, roomId, name: x.name, place: x.place, mapUrl: x.mapUrl, note: x.note,
      addedBy: idOf(x.by), suggestionId: x.suggestionId, createdAt: baseTime + 100 + i,
    };
  });

  const ratings: Rating[] = [];
  (Object.keys(RATINGS[kind]) as IdeaKey[]).forEach((key) => {
    Object.entries(RATINGS[kind][key]).forEach(([name, score]) => {
      ratings.push({ roomId, memberId: idOf(name as Name), ideaId: ideaIds[key], score: score as Score, updatedAt: baseTime + 200 });
    });
  });

  const availability: Availability[] = [];
  AVAILABILITY[kind].forEach(([dayIndex, slot, names]) => {
    names.forEach((n) => availability.push({ roomId, memberId: idOf(n), day: addDays(startDate, dayIndex), slot }));
  });

  const attendance: Attendance[] = Object.entries(ATTENDANCE[kind]).map(([name, status]) => ({
    roomId, memberId: idOf(name as Name), status: status as 'yes' | 'no',
  }));

  // Kesin odada getirilecekler hazır: Olta'yı Kaan almış
  const items: Item[] = [];
  if (kind === 'kesin') {
    room.itemsSeeded = true;
    ['Olta', 'Yem', 'Sandalye', 'Su'].forEach((name, i) => {
      items.push({ id: newId(), roomId, name, claimedBy: name === 'Olta' ? idOf('Kaan') : null, createdBy: null, createdAt: baseTime + 300 + i });
    });
  }

  return { room, members, ideas, ratings, availability, attendance, items };
}

/**
 * Demo odayı herhangi bir DataStore'a (çevrimdışı ya da çevrimiçi) sözleşme fonksiyonlarıyla yazar.
 * Döndürür: oda id'si ve "sen" olacağın Emirhan'ın üye id'si.
 */
export async function seedDemo(store: DataStore, kind: DemoKind, startDate: string): Promise<{ roomId: string; meId: string }> {
  const plan = buildDemo(kind, startDate, () => crypto.randomUUID());
  const nameOf = (id: string) => plan.members.find((m) => m.id === id)!.name;
  const { room, creator } = await store.createRoom({ name: plan.room.name, startDate, creatorName: 'Emirhan' });
  const ids = new Map<string, string>([['Emirhan', creator.id]]);
  for (const m of plan.members.slice(1)) ids.set(m.name, (await store.joinRoom(room.id, m.name)).id);
  const realId = (planMemberId: string) => ids.get(nameOf(planMemberId))!;

  const ideaIds = new Map<string, string>();
  for (const i of plan.ideas) {
    const idea = await store.addIdea(room.id, {
      name: i.name, place: i.place, mapUrl: i.mapUrl, note: i.note,
      suggestionId: i.suggestionId ?? undefined, addedBy: realId(i.addedBy),
    });
    ideaIds.set(i.id, idea.id);
  }
  await Promise.all(plan.ratings.map((r) =>
    store.setRating({ roomId: room.id, memberId: realId(r.memberId), ideaId: ideaIds.get(r.ideaId)!, score: r.score })));
  await Promise.all(plan.availability.map((a) =>
    store.toggleAvailability({ roomId: room.id, memberId: realId(a.memberId), day: a.day, slot: a.slot })));
  await Promise.all(plan.attendance.map((a) =>
    store.setAttendance({ roomId: room.id, memberId: realId(a.memberId), status: a.status })));
  if (kind === 'kesin') {
    await store.seedItemsIfNeeded(room.id, 'balik');
    const snap = await store.getRoom(room.id);
    const olta = snap?.items.find((i) => i.name === 'Olta');
    if (olta) await store.claimItem(olta.id, ids.get('Kaan')!);
  }
  return { roomId: room.id, meId: creator.id };
}
