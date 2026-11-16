// Test için örnek odalar. Veri sabit ve tahmin edilebilir; beklenen sonuçlar demo.test.ts'te.
import type { DataStore } from './store';
import type { Availability, Idea, Member, RoomSnapshot, Slot, Vote, VoteValue } from './types';
import { addDays } from '../core/format';

export type DemoKind = 'eksik' | 'kesin';
export const DEMO_ROOM_NAME = 'Cumartesi ekibi';
export const DEMO_NAMES = ['Emirhan', 'Kaan', 'Mert', 'Berk', 'Arda', 'Yusuf'] as const;
type Name = (typeof DEMO_NAMES)[number];

const IDEAS = [
  { key: 'balik', name: 'Balık tutma', place: 'Moda sahili', note: 'Olta getiren olsun', suggestionId: 'balik', by: 'Emirhan' },
  { key: 'sinema', name: 'Sinema', place: '', note: '', suggestionId: 'sinema', by: 'Emirhan' },
  { key: 'ders', name: 'Birlikte ders çalışma', place: 'Kütüphane', note: '', suggestionId: 'ders', by: 'Mert' },
  { key: 'hali', name: 'Halı saha', place: 'Mahalle', note: '', suggestionId: 'halisaha', by: 'Berk' },
] as const;
type IdeaKey = (typeof IDEAS)[number]['key'];
type Answers = { yes: Name[]; no: Name[] };

const VOTES: Record<DemoKind, Record<IdeaKey, Answers>> = {
  // Emirhan, Mert, Berk, Yusuf cevap verdi; Kaan ve Arda bekleniyor
  eksik: {
    balik: { yes: ['Emirhan', 'Mert', 'Berk'], no: ['Yusuf'] }, // 3/1
    sinema: { yes: ['Emirhan', 'Yusuf'], no: [] }, // 2/0
    ders: { yes: ['Mert'], no: ['Emirhan', 'Berk'] }, // 1/2
    hali: { yes: [], no: ['Mert', 'Berk'] }, // 0/2
  },
  kesin: {
    balik: { yes: ['Emirhan', 'Kaan', 'Mert', 'Berk'], no: ['Arda'] }, // 4/1
    sinema: { yes: ['Emirhan', 'Berk', 'Yusuf'], no: ['Kaan'] }, // 3/1
    ders: { yes: ['Mert', 'Arda'], no: ['Emirhan', 'Yusuf'] }, // 2/2
    hali: { yes: ['Kaan'], no: ['Mert', 'Berk', 'Arda'] }, // 1/3
  },
};

// [gün sırası (0 = başlangıç), dilim, kişiler]
const FREE: Record<DemoKind, [number, Slot, Name[]][]> = {
  eksik: [
    [0, 'gunduz', ['Emirhan', 'Mert', 'Berk', 'Yusuf']], // 4 → en iyi
    [0, 'aksam', ['Emirhan', 'Yusuf']],
    [1, 'aksam', ['Mert']],
  ],
  kesin: [
    [0, 'gunduz', ['Emirhan', 'Kaan', 'Mert', 'Berk', 'Arda', 'Yusuf']], // 6/6 → en iyi, herkes boş
    [0, 'aksam', ['Emirhan', 'Mert', 'Yusuf']],
    [1, 'gunduz', ['Kaan', 'Berk', 'Arda']],
    [2, 'aksam', ['Emirhan', 'Kaan']],
  ],
};

/** Demo odasının bütün verisi (saf fonksiyon). */
export function buildDemo(kind: DemoKind, startDate: string, newId: () => string, t0 = 1_700_000_000_000): RoomSnapshot {
  const roomId = newId();
  const members: Member[] = DEMO_NAMES.map((name, i) => ({ id: newId(), roomId, name, createdAt: t0 + i }));
  const idOf = (n: Name) => members[DEMO_NAMES.indexOf(n)].id;
  const ideas: Idea[] = IDEAS.map((x, i) => ({
    id: newId(), roomId, name: x.name, place: x.place, note: x.note, addedBy: idOf(x.by),
    suggestionId: x.suggestionId, createdAt: t0 + 100 + i,
  }));
  const votes: Vote[] = [];
  IDEAS.forEach((x, i) => {
    const a = VOTES[kind][x.key];
    const push = (names: Name[], value: VoteValue) =>
      names.forEach((n) => votes.push({ roomId, memberId: idOf(n), ideaId: ideas[i].id, value }));
    push(a.yes, 'yes');
    push(a.no, 'no');
  });
  const availability: Availability[] = [];
  FREE[kind].forEach(([d, slot, names]) =>
    names.forEach((n) => availability.push({ roomId, memberId: idOf(n), day: addDays(startDate, d), slot })),
  );
  return {
    room: { id: roomId, name: DEMO_ROOM_NAME, startDate, createdBy: idOf('Emirhan'), createdAt: t0 },
    members, ideas, votes, availability,
  };
}

/** Demo odayı herhangi bir DataStore'a yazar. Döndürür: oda id'si ve "sen" olacağın Emirhan'ın id'si. */
export async function seedDemo(store: DataStore, kind: DemoKind, startDate: string): Promise<{ roomId: string; meId: string }> {
  const plan = buildDemo(kind, startDate, () => crypto.randomUUID());
  const nameOf = (id: string) => plan.members.find((m) => m.id === id)!.name;
  const { room, creator } = await store.createRoom({ name: plan.room.name, startDate, creatorName: 'Emirhan' });
  const ids = new Map<string, string>([['Emirhan', creator.id]]);
  for (const m of plan.members.slice(1)) ids.set(m.name, (await store.joinRoom(room.id, m.name)).id);
  const real = (planId: string) => ids.get(nameOf(planId))!;
  const ideaIds = new Map<string, string>();
  for (const i of plan.ideas) {
    const idea = await store.addIdea(room.id, {
      name: i.name, place: i.place, note: i.note, suggestionId: i.suggestionId ?? undefined, addedBy: real(i.addedBy),
    });
    ideaIds.set(i.id, idea.id);
  }
  await Promise.all(plan.votes.map((v) =>
    store.setVote({ roomId: room.id, memberId: real(v.memberId), ideaId: ideaIds.get(v.ideaId)!, value: v.value })));
  await Promise.all(plan.availability.map((a) =>
    store.toggleAvailability({ roomId: room.id, memberId: real(a.memberId), day: a.day, slot: a.slot })));
  return { roomId: room.id, meId: creator.id };
}
