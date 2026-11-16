# Supabase veritabanı

Proje: `bulusalim` (Frankfurt, eu-central-1). Şema `bulusalim_v2` migration'ı ile kuruldu (rooms, members, ideas, votes, availability):

- `bulusalim_schema`: rooms, members, ideas, ratings, availability, attendance, items tabloları.
  RLS açık, politika yok ve anon/authenticated rollerinin tablo yetkileri geri alındı → tarayıcı tablolara doğrudan dokunamaz.
- `bulusalim_functions`: `bs_*` fonksiyonları (security definer). Tarayıcı sadece bunları çağırabilir.
  Her yazma işlemi "bu üye bu odada mı?" kontrolü yapar. Getirilecekler oda satırı kilitlenerek tek kez eklenir.

Güvenlik denetimindeki "anon SECURITY DEFINER çalıştırabilir" uyarıları bilerek böyle: uygulamada hesap yok,
oda linkindeki tahmin edilemez UUID odaya erişim anahtarıdır (Google Docs'taki "linki olan herkes" gibi).

## Güncellemeler
- `bulusalim_short_codes`: oda kimliği 8 harfli kısa kod (`rooms.id` text, `bs_new_code()`), eski uuid'li odalar aynen çalışır.
- `bulusalim_days_admin`: `rooms.days date[]` (1–14 gün); `bs_create_room(..., p_days)`;
  kurucu fonksiyonları `bs_rename_room`, `bs_set_days`, `bs_remove_member`, `bs_delete_room` (hepsi `created_by` kontrolü yapar);
  `bs_update_idea(p_idea, p_member, ...)` sadece ekleyen, `bs_delete_idea(p_idea, p_member)` ekleyen ya da kurucu.
