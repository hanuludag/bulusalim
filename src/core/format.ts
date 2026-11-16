// Sayı, tarih ve oran biçimleri (§17). Konudan bağımsız, ileride ortak pakete gider.

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

/** İsim listesi: "Kaan, Arda" */
export function joinNames(names: string[]): string {
  return names.join(', ');
}
