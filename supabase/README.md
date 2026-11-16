# Supabase veritabanı

Proje: `bulusalim` (Frankfurt, eu-central-1). Şema iki migration ile kuruldu:

- `bulusalim_schema`: rooms, members, ideas, ratings, availability, attendance, items tabloları.
  RLS açık, politika yok ve anon/authenticated rollerinin tablo yetkileri geri alındı → tarayıcı tablolara doğrudan dokunamaz.
- `bulusalim_functions`: `bs_*` fonksiyonları (security definer). Tarayıcı sadece bunları çağırabilir.
  Her yazma işlemi "bu üye bu odada mı?" kontrolü yapar. Getirilecekler oda satırı kilitlenerek tek kez eklenir.

Güvenlik denetimindeki "anon SECURITY DEFINER çalıştırabilir" uyarıları bilerek böyle: uygulamada hesap yok,
oda linkindeki tahmin edilemez UUID odaya erişim anahtarıdır (Google Docs'taki "linki olan herkes" gibi).
