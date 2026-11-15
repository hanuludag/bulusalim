// Sayı, tarih ve oran biçimleri (§17). Konudan bağımsız, ileride ortak pakete gider.

const avgFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Ortalama: her zaman 1 basamak, virgüllü. Boşsa "–". 4.25 → "4,3", 4 → "4,0" */
export function formatAvg(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  return avgFormatter.format(value);
}

/** "x/y" oranı */
export function formatRatio(x: number, y: number): string {
  return `${x}/${y}`;
}

/** "YYYY-MM-DD" → yerel saatle Date. new Date('2026-11-17') UTC kayması yapar, bu yapmaz. */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → "YYYY-MM-DD" (yerel saat) */
export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Bugün, yerel saatle "YYYY-MM-DD" */
export function todayString(now: Date = new Date()): string {
  return toDayString(now);
}

/** Başlangıç + n gün */
export function addDays(day: string, n: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return toDayString(date);
}

/** Başlangıçtan itibaren 7 gün */
export function weekDays(startDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
}

function clean(s: string): string {
  return capitalize(s.replace(/\./g, '').trim());
}

const weekdayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

/** Kısa gün: "Cmt" */
export function formatShortDay(day: string): string {
  return clean(weekdayFmt.format(parseDay(day)));
}

/** Tam tarih: "Cmt 15 Kas" */
export function formatDate(day: string): string {
  const date = parseDay(day);
  return `${formatShortDay(day)} ${date.getDate()} ${clean(monthFmt.format(date))}`;
}

/**
 * Sayıya Türkçe belirtme/iyelik eki: 1'i, 2'si, 3'ü, 4'ü, 5'i, 6'sı, 7'si, 8'i, 9'u, 10'u.
 * Son okunan sözcüğün son ünlüsüne göre (büyük ünlü uyumu) ve ünsüzle bitip bitmemesine göre.
 */
export function withSuffix(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  // son basamağın / sondaki sıfırların okunuşu belirler
  const ones: Record<number, string> = {
    0: 'sıfır', 1: 'bir', 2: 'iki', 3: 'üç', 4: 'dört',
    5: 'beş', 6: 'altı', 7: 'yedi', 8: 'sekiz', 9: 'dokuz',
  };
  const tens: Record<number, string> = {
    1: 'on', 2: 'yirmi', 3: 'otuz', 4: 'kırk', 5: 'elli',
    6: 'altmış', 7: 'yetmiş', 8: 'seksen', 9: 'doksan',
  };
  let word: string;
  if (abs === 0) word = ones[0];
  else if (abs % 10 !== 0) word = ones[abs % 10];
  else if (abs % 100 !== 0) word = tens[(abs / 10) % 10];
  else if (abs % 1000 !== 0) word = 'yüz';
  else if (abs % 1_000_000 !== 0) word = 'bin';
  else word = 'milyon';

  const vowels = word.match(/[aeıioöuü]/g) ?? ['e'];
  const last = vowels[vowels.length - 1];
  const map: Record<string, string> = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' };
  const v = map[last];
  const endsWithVowel = /[aeıioöuü]$/.test(word);
  return `${n}'${endsWithVowel ? 's' : ''}${v}`;
}

/** İsim listesi: "Kaan, Arda" */
export function joinNames(names: string[]): string {
  return names.join(', ');
}
