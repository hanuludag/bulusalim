// Öneri aktiviteler ve "getirilecekler" şablonları (§20).
// Şablonlar tahmindir, kesin bilgi değildir. İstediğin gibi değiştirebilirsin.

export type SuggestionTag = 'açık hava' | 'kapalı mekan';

export interface Suggestion {
  id: string;
  name: string;
  tag: SuggestionTag;
  bring: string[]; // en çok 4 madde, boş olabilir
}

export const SUGGESTIONS: readonly Suggestion[] = [
  { id: 'balik', name: 'Balık tutma', tag: 'açık hava', bring: ['Olta', 'Yem', 'Sandalye', 'Su'] },
  { id: 'ders', name: 'Birlikte ders çalışma', tag: 'kapalı mekan', bring: ['Defter', 'Şarj aleti', 'Kulaklık'] },
  { id: 'piknik', name: 'Piknik', tag: 'açık hava', bring: ['Örtü', 'Yiyecek', 'İçecek', 'Çöp poşeti'] },
  { id: 'halisaha', name: 'Halı saha', tag: 'açık hava', bring: ['Top', 'Su', 'Yedek forma'] },
  { id: 'sinema', name: 'Sinema', tag: 'kapalı mekan', bring: [] },
  { id: 'bowling', name: 'Bowling', tag: 'kapalı mekan', bring: ['Çorap'] },
  { id: 'kacis', name: 'Kaçış odası', tag: 'kapalı mekan', bring: [] },
  { id: 'kahvalti', name: 'Kahvaltı', tag: 'kapalı mekan', bring: [] },
  { id: 'yuruyus', name: 'Yürüyüş', tag: 'açık hava', bring: ['Su', 'Atıştırmalık', 'Rahat ayakkabı'] },
  { id: 'bisiklet', name: 'Bisiklet turu', tag: 'açık hava', bring: ['Bisiklet', 'Kask', 'Su'] },
  { id: 'basketbol', name: 'Basketbol', tag: 'açık hava', bring: ['Top', 'Su'] },
  { id: 'kamp', name: 'Kamp', tag: 'açık hava', bring: ['Çadır', 'Uyku tulumu', 'Fener', 'Yiyecek'] },
  { id: 'kutuoyunu', name: 'Kutu oyunu kafe', tag: 'kapalı mekan', bring: [] },
  { id: 'gokart', name: 'Go-kart', tag: 'açık hava', bring: [] },
  { id: 'paintball', name: 'Paintball', tag: 'açık hava', bring: ['Yedek kıyafet', 'Su'] },
  { id: 'deniz', name: 'Deniz', tag: 'açık hava', bring: ['Havlu', 'Güneş kremi', 'Su', 'Mayo'] },
  { id: 'mangal', name: 'Mangal', tag: 'açık hava', bring: ['Mangal', 'Kömür', 'Et', 'Ekmek'] },
  { id: 'konser', name: 'Konser', tag: 'kapalı mekan', bring: [] },
];

export function findSuggestion(id: string | null | undefined): Suggestion | undefined {
  if (!id) return undefined;
  return SUGGESTIONS.find((s) => s.id === id);
}
