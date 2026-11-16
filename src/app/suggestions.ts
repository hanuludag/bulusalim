// Öneri aktiviteler (arkadaş grubu, 16–25 yaş, Türkiye). Listeyi istediğin gibi değiştirebilirsin.
// id'ler kalıcıdır (kayıtlı fikirler suggestionId ile buraya bağlanır): var olanı değiştirme, yenisini ekle.
// free = genelde ücretsiz ya da çok ucuz.
export type SuggestionTag = 'açık hava' | 'kapalı mekan' | 'spor' | 'yeme-içme' | 'kültür' | 'evde';
export interface Suggestion { id: string; name: string; tag: SuggestionTag; free?: boolean }

/** Filtre sırası (öneri şeridinin üstünde) */
export const SUGGESTION_TAGS: readonly SuggestionTag[] = ['açık hava', 'kapalı mekan', 'spor', 'yeme-içme', 'kültür', 'evde'];

export const SUGGESTIONS: readonly Suggestion[] = [
  // açık hava
  { id: 'balik', name: 'Balık tutma', tag: 'açık hava', free: true },
  { id: 'piknik', name: 'Piknik', tag: 'açık hava', free: true },
  { id: 'yuruyus', name: 'Yürüyüş', tag: 'açık hava', free: true },
  { id: 'bisiklet', name: 'Bisiklet turu', tag: 'açık hava', free: true },
  { id: 'kamp', name: 'Kamp', tag: 'açık hava' },
  { id: 'deniz', name: 'Deniz', tag: 'açık hava', free: true },
  { id: 'mangal', name: 'Mangal', tag: 'açık hava' },
  { id: 'gokart', name: 'Go-kart', tag: 'açık hava' },
  { id: 'paintball', name: 'Paintball', tag: 'açık hava' },
  { id: 'sahil', name: 'Sahilde oturma', tag: 'açık hava', free: true },
  { id: 'gundogumu', name: 'Gün doğumu izleme', tag: 'açık hava', free: true },
  { id: 'adalar', name: 'Ada turu', tag: 'açık hava' },
  { id: 'vapur', name: 'Vapurla gezme', tag: 'açık hava', free: true },
  { id: 'fotograf', name: 'Fotoğraf yürüyüşü', tag: 'açık hava', free: true },
  { id: 'kaykay', name: 'Kaykay / paten', tag: 'açık hava', free: true },
  { id: 'lunapark', name: 'Lunapark', tag: 'açık hava' },
  // kapalı mekan
  { id: 'sinema', name: 'Sinema', tag: 'kapalı mekan' },
  { id: 'bowling', name: 'Bowling', tag: 'kapalı mekan' },
  { id: 'kacis', name: 'Kaçış odası', tag: 'kapalı mekan' },
  { id: 'kutuoyunu', name: 'Kutu oyunu kafe', tag: 'kapalı mekan' },
  { id: 'bilardo', name: 'Bilardo', tag: 'kapalı mekan' },
  { id: 'karaoke', name: 'Karaoke', tag: 'kapalı mekan' },
  { id: 'vr', name: 'VR oyun salonu', tag: 'kapalı mekan' },
  { id: 'atari', name: 'Oyun salonu', tag: 'kapalı mekan' },
  { id: 'lasertag', name: 'Laser tag', tag: 'kapalı mekan' },
  { id: 'avm', name: 'AVM gezisi', tag: 'kapalı mekan', free: true },
  { id: 'ders', name: 'Birlikte ders çalışma', tag: 'kapalı mekan', free: true },
  // spor
  { id: 'halisaha', name: 'Halı saha', tag: 'spor' },
  { id: 'basketbol', name: 'Basketbol', tag: 'spor', free: true },
  { id: 'voleybol', name: 'Plaj voleybolu', tag: 'spor', free: true },
  { id: 'masatenisi', name: 'Masa tenisi', tag: 'spor' },
  { id: 'tirmanis', name: 'Tırmanış duvarı', tag: 'spor' },
  { id: 'trampolin', name: 'Trampolin park', tag: 'spor' },
  { id: 'buzpateni', name: 'Buz pateni', tag: 'spor' },
  { id: 'kosu', name: 'Birlikte koşu', tag: 'spor', free: true },
  // yeme-içme
  { id: 'kahvalti', name: 'Kahvaltı', tag: 'yeme-içme' },
  { id: 'kafe', name: 'Kafe', tag: 'yeme-içme' },
  { id: 'sokaklezzeti', name: 'Sokak lezzetleri turu', tag: 'yeme-içme' },
  { id: 'tatli', name: 'Tatlıcı', tag: 'yeme-içme' },
  { id: 'pazar', name: 'Semt pazarı', tag: 'yeme-içme', free: true },
  // kültür
  { id: 'konser', name: 'Konser', tag: 'kültür' },
  { id: 'muze', name: 'Müze', tag: 'kültür' },
  { id: 'sergi', name: 'Sergi', tag: 'kültür', free: true },
  { id: 'tiyatro', name: 'Tiyatro', tag: 'kültür' },
  { id: 'standup', name: 'Stand-up', tag: 'kültür' },
  { id: 'festival', name: 'Festival', tag: 'kültür' },
  { id: 'mac', name: 'Maç izleme', tag: 'kültür' },
  { id: 'atolye', name: 'Atölye (seramik, resim)', tag: 'kültür' },
  // evde
  { id: 'filmgecesi', name: 'Film gecesi', tag: 'evde', free: true },
  { id: 'oyungecesi', name: 'Konsol turnuvası', tag: 'evde', free: true },
  { id: 'masaoyunu', name: 'Masa oyunu gecesi', tag: 'evde', free: true },
  { id: 'yemekyarismasi', name: 'Yemek yarışması', tag: 'evde' },
  { id: 'pizza', name: 'Evde pizza', tag: 'evde' },
];
