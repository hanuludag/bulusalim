// Harita linki kontrolü (§19). Linke istek atılmaz, sadece biçimi kontrol edilir.
// Sadece http: ve https: kabul edilir. "javascript:" gibi protokoller reddedilir,
// çünkü böyle bir link tıklanınca sayfada kod çalıştırabilir (XSS).

export function isValidMapUrl(value: string): boolean {
  const v = value.trim();
  if (v === '') return true; // isteğe bağlı
  try {
    const url = new URL(v);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Kaydetmeden önce temizler (boşlukları atar). */
export function cleanMapUrl(value: string): string {
  return value.trim();
}
