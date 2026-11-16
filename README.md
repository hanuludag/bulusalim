# buluşalım · v2 (sade, çevrimiçi)

Arkadaş grubu **ne yapacağına, nerede yapacağına ve ne zaman buluşacağına** karar verir.
Akış: oda kur → linki WhatsApp'tan at → arkadaş adını yazar → fikirleri **onaylar / onaylamaz** → boş zamanını seçer → sonuç.

| Mod | Ne zaman | Veri nerede |
|---|---|---|
| **Çevrimiçi** (varsayılan) | `.env` içinde Supabase ayarları varsa | Supabase. Link arkadaşında da çalışır, değişiklikler ~1 sn'de herkese gider. |
| **Çevrimdışı** (test) | `.env` içinde `VITE_OFFLINE=1` | Tarayıcı hafızası, anahtar `bs:db:v2`. Eski `bs:db:v1` açılışta silinir. |

## Kurulum ve çalıştırma
```bash
npm install
```
```bash
npm run dev
```
Tarayıcıda http://localhost:5173. Telefonda denemek için (aynı Wi-Fi): `npm run dev -- --host` ve çıkan `Network:` adresi.
Testler: `npm test` · Yayın paketi: `npm run build` (çıktı `dist/`, Netlify'a sürükle-bırak ya da GitHub bağlantısı; `netlify.toml` hazır).

## Ekranlar
| Ekran | İş | Kırmızı buton |
|---|---|---|
| Odalarım (`/`) | Bu telefonda girdiğin bütün odalar. Hiç oda yoksa doğrudan "Yeni oda" | Yeni oda kur |
| Yeni oda (`/yeni`) | Oda adı (hazır "Buluşma") + adın + **günler** (takvimden gün gün, en fazla 14; hazır: "Önümüzdeki 7 gün", "Hafta sonları") | Oda kur |
| Oda hazır | Linki paylaş | WhatsApp'ta paylaş |
| Katıl | Adını yaz | Katıl |
| Fikirler | Onaylıyorum / Onaylamıyorum | Sıradaki: Zaman → (ilk cevaptan sonra) |
| Zaman | Oda günleri × Gündüz 10–17 / Akşam 17–21, altında "Kim ne zaman boş" | Sonucu gör → |
| Sonuç | Kazanan + durum + bütün fikirler + en uygun 5 zaman (dokununca kim) + Odalarım / Yeni oda kur | Gruba hatırlat / Sonucu paylaş |

**Gün gün plan:** Fikir eklerken gün + gündüz/akşam seçilir (ya da "Herhangi bir gün"). Her gün+dilim kendi oylamasını yapar:
en çok onaylanan o zamanın etkinliği olur (en az 1 onay). Bir odada her güne ayrı etkinlik konabilir.

**Gün oylaması (kurucu ⋯ menüsünden açar/kapatır):** Açıkken herkes, günü belli olmayan fikirlerin altındaki
"Hangi gün olsun?" ile gün+dilim oyu verir. En çok oyu alan zaman o fikrin zamanı olur (eşitlikte daha çok kişinin boş olduğu,
sonra erken gün); o zamanda birden fazla fikir varsa onaylarla kazanan seçilir. Kapalıyken gün oyları sayılmaz (silinmez).

**Günlere dağıtma (kurucu ⋯ menüsünden açar/kapatır):** Açıkken Sonuç ekranında "Günlere dağıt" çıkar: günü belli olmayan
her fikre tek tek gün+dilim seçilir, "Boş olanları otomatik doldur" kalanları en çok kişinin boş olduğu zamanlara yerleştirir
(`src/app/distribute.ts`), "Kaydet" ile saklanır. Dağıtım fikrin kendi gününden ayrı tutulur (`assignedDay/Slot`):
kapatınca plan gün oylamasına/eski haline döner, açınca dağıtım geri gelir. Dağıtılan fikirde gün oyu gizlenir.

**Plandaki zamanın önceliği:** fikrin kendi günü (eklerken seçilen) → kurucunun dağıtımı (açıksa) → gün oylaması (açıksa) → "herhangi bir gün".

**Paylaşım her zaman açık:** Sonuç'ta "Gruba hatırlat" yanında "Şimdiki sonucu paylaş" ve "Linki kopyala"; arkadaşın Plan sayfasında "Planı paylaş" ve "Linki kopyala".

**İki görünüm:**
- **Odayı kuran:** ayrıntılı ekranlar (Fikirler gün gün gruplu · Zaman · Sonuç), sayılar, "Kim?" listeleri, ⋯ oda menüsü.
- **Linkten giren arkadaş:** tek sayfa `/r/:id/cevap` → 1. fikirlere ✓/✗ (gün oylaması açıksa gün oyu), 2. boş saatlere dokun, Bitti → `/r/:id/plan`.
  Küçük yazıyla görür: fikrin altında "✓2 Ali, Veli · ✗1 Ayşe", saat kutularında kaç kişi boş, altta kim cevap verdi / bekleniyor,
  planda onay ve boş kişi sayısı. Menü, üye yönetimi ve dağıtma yok. Odaya tekrar girince cevap verdiyse plana, vermediyse cevap sayfasına gider.

**Kim ne dedi:** Fikrin altında her zaman küçük tek satır: ✓ onaylayanlar, ✗ onaylamayanlar. Zaman ve Sonuç'ta satıra dokununca o saatte boş olanlar.

**Oda menüsü (⋯):** herkes: Odalarım, Yeni oda kur, üye listesi. Sadece **odayı kuran**: oda adını değiştir, günleri değiştir
(çıkarılan günlerin saat seçimleri silinir), üye çıkar (onayları/saatleri silinir, fikirleri kalır), başkasının fikrini sil, **odayı sil** (herkes için).
Diğerleri: "Listemden kaldır" (oda silinmez).

Kurallar (`src/app/result.ts`): fikir sırası **onay çok → onaylamama az → eski önce**; kazanan en az 1 onay almış olmalı.
En iyi zaman en çok kişinin boş olduğu dilim; eşitlikte erken gün, sonra gündüz. Cevap verdi = en az 1 onay/onaylamama ya da 1 saat.

## Test paneli (sadece `npm run dev`)
Sol alttaki **test** düğmesi: bu sekmede kim olayım · sahte üye ekle · diğerlerine rastgele cevap (her 3 kişiden biri boş kalır) ·
Demo oda (eksik) · Demo oda (kesin) · yapay gecikme (çevrimdışı) · kayıtları sil.

### Demo odalarının beklenen sonucu (1. gün = demoyu kurduğun gün)
| Fikir | Eksik (4/6 cevap) | Kesin (6/6) |
|---|---|---|
| Balık tutma · Moda sahili | 3 onay / 1 hayır → **kazanan** | 4 / 1 → **kazanan** |
| Sinema | 2 / 0 | 3 / 1 |
| Birlikte ders çalışma · Kütüphane | 1 / 2 | 2 / 2 |
| Halı saha · Mahalle | 0 / 2 | 1 / 3 |
| En iyi zaman | 1. gün gündüz, 4 kişi | 1. gün gündüz, 6 kişi (herkes boş → kalın çerçeve) |
| Bekleniyor | Kaan, Arda | — (Kesin sonuç ✓) |

## Bilinen sınırlar
- Hesap yok: oda linkini (8 harfli kısa kod, ör. `/r/k7m2xq4p`) bilen herkes odayı görür ve katılabilir. Eski uzun linkler de çalışır.
- "Bu cihaz kim" bilgisi tarayıcıda. Başka telefondan girersen aynı adı yazıp "Evet, benim" de.
- Tek üyeli oda, o kişi cevap verince hemen "Kesin sonuç" olur.
- Öneri listesi (53 fikir, 6 kategori + "Ücretsiz" filtresi) `src/app/suggestions.ts` içinden değiştirilebilir. Var olan `id`leri değiştirme, yenisini ekle.
- Ücretsiz Supabase projesi 7 gün kullanılmazsa duraklar (panelden tek tıkla açılır).
- Çevrimdışı modda veri sadece o tarayıcıdadır; link başka cihazda çalışmaz.

## Yapı
- `src/core/` konudan bağımsız (Oyun Odası ile ortak olacak): `device`, `sync`, `format`, `names`, `useRoom`, `TopBar`, `Dock`, `Sheet`, `ConfirmDialog`… `core/` asla `app/`'i import etmez.
- `src/app/` Buluşalım'a özel. Ekrandaki bütün metinler `src/app/copy.ts`'te.
- Veri katmanı sözleşmesi `src/app/store.ts`: `localStore.ts` (çevrimdışı) ve `supabaseStore.ts` (çevrimiçi) aynı sözleşmeyi uygular; seçim `runtime.ts`'te. Supabase ayrıntısı: `supabase/README.md`.

## Elle test listesi
1. "Oda adı" hazır "Buluşma"; adı boş bırakınca "Adını yaz".
2. Oda hazır: "Linki kopyala" → "Kopyalandı ✓"; WhatsApp doğru metinle açılıyor; "Şimdi sen başla →" Fikirler'e gidiyor.
3. Boş Fikirler'de öneri kutuları; "+ ekle" fikri hemen ekliyor, kutuda "eklendi ✓"; "balık tutma" yazınca "Bu fikir zaten listede".
4. "Fikir ekle" panelinde öneri şeridi üstte; "+ Not ekle" ve sayaç çalışıyor.
5. Onaylıyorum → kırmızı, "Sıradaki: Zaman →" kayarak geliyor; tekrar basınca kalkıyor, Dock kayboluyor; Onaylamıyorum → siyah.
6. Başka cihaz/sekmeden cevap verince sayılar ~1 sn'de güncelleniyor.
7. Zaman: 7 × 2 kutu, dokununca kırmızı ve sayı artıyor, herkes boşsa kalın çerçeve, tekrar dokununca kalkıyor.
8. Sonuç eksik: kazanan, "Cmt gündüz", "x/y cevap verdi · sonuç değişebilir", "Bekleniyor: …", "Gruba hatırlat". Herkes cevap verince "Kesin sonuç ✓" ve "Sonucu paylaş".
9. Onay yoksa "Henüz onaylanan fikir yok.", saat yoksa "Henüz saat seçen yok.", hiç cevap yoksa "Henüz cevap yok. İlk sen başla." + "Fikirlere git".
10. Üst çubuk: Fikirler/Zaman'da "Sonuç", Sonuç'ta "Cevaplarım"; geri okları Zaman → Fikirler, Sonuç → Zaman.
11. Fikri sadece ekleyen düzenleyip silebiliyor; silinen fikrin cevapları da gidiyor.
12. Sayfayı kapatıp açınca isim sorulmuyor; açılış: cevap yok → Fikirler, cevap var saat yok → Zaman, ikisi de var → Sonuç.
13. Ekranda "oy", "müsait", "puan", "siz", "lütfen", "başarıyla", ünlem ve "Kaydedildi ✓" yok.
14. Telefonda butonlar rahat basılıyor, Dock alt çubukla çakışmıyor.
