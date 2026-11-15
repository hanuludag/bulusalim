// İsim karşılaştırma (§18). Türkçe büyük-küçük harf kurallarına uyar: "İLKER" = "ilker", "Işık" = "ışık".

export const NAME_MAX = 20;

/** Boşlukları toplar, Türkçe küçük harfe çevirir. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
}

/** İki isim aynı mı? */
export function sameName(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

/** Gösterim için temizlenmiş isim (baştaki/sondaki boşluk ve çift boşluk yok). */
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Listede aynı isimli kaydı bulur. */
export function findByName<T extends { name: string }>(list: T[], name: string): T | undefined {
  const key = normalizeName(name);
  return list.find((x) => normalizeName(x.name) === key);
}

/** Avatar için baş harf (Türkçe büyük harf). */
export function initial(name: string): string {
  return cleanName(name).charAt(0).toLocaleUpperCase('tr') || '?';
}
