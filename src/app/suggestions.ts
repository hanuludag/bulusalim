// Öneri aktiviteler. Listeyi istediğin gibi değiştirebilirsin.
export type SuggestionTag = 'açık hava' | 'kapalı mekan';
export interface Suggestion { id: string; name: string; tag: SuggestionTag }

export const SUGGESTIONS: readonly Suggestion[] = [
  { id: 'balik', name: 'Balık tutma', tag: 'açık hava' },
  { id: 'piknik', name: 'Piknik', tag: 'açık hava' },
  { id: 'bowling', name: 'Bowling', tag: 'kapalı mekan' },
  { id: 'ders', name: 'Birlikte ders çalışma', tag: 'kapalı mekan' },
  { id: 'halisaha', name: 'Halı saha', tag: 'açık hava' },
  { id: 'sinema', name: 'Sinema', tag: 'kapalı mekan' },
  { id: 'kacis', name: 'Kaçış odası', tag: 'kapalı mekan' },
  { id: 'kahvalti', name: 'Kahvaltı', tag: 'kapalı mekan' },
  { id: 'yuruyus', name: 'Yürüyüş', tag: 'açık hava' },
  { id: 'bisiklet', name: 'Bisiklet turu', tag: 'açık hava' },
  { id: 'basketbol', name: 'Basketbol', tag: 'açık hava' },
  { id: 'kamp', name: 'Kamp', tag: 'açık hava' },
  { id: 'kutuoyunu', name: 'Kutu oyunu kafe', tag: 'kapalı mekan' },
  { id: 'gokart', name: 'Go-kart', tag: 'açık hava' },
  { id: 'paintball', name: 'Paintball', tag: 'açık hava' },
  { id: 'deniz', name: 'Deniz', tag: 'açık hava' },
  { id: 'mangal', name: 'Mangal', tag: 'açık hava' },
  { id: 'konser', name: 'Konser', tag: 'kapalı mekan' },
];
