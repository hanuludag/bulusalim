# buluşalım · v0.2 (çevrimiçi)

Arkadaş grubu **ne yapacağına, nerede yapacağına ve ne zaman buluşacağına** bu uygulamayla karar verir.
Oda kur → linki paylaş → isimle katıl → fikirleri 1–5 puanla → boş saatini seç → sonuç.

İki modda çalışır:

| Mod | Ne zaman | Veri nerede |
|---|---|---|
| **Çevrimiçi** (varsayılan) | `.env` içinde Supabase ayarları varsa | Supabase veritabanı. Linki arkadaşına atınca onda da çalışır, değişiklikler ~1 sn'de herkese gider. |
| **Çevrimdışı** | `.env` içinde `VITE_OFFLINE=1` varsa | Tarayıcının hafızası (localStorage). İnternetsiz deneme için. |

Hangi modun kullanılacağına `src/app/runtime.ts` karar verir. Ekran kodu iki modda da aynıdır.

---

## Kurulum ve çalıştırma

Gerekenler: **Node.js 20 veya üstü** (https://nodejs.org → LTS).

```bash
npm install
```

```bash
npm run dev
```

Tarayıcıda **http://localhost:5173** adresini aç. Fontlar projenin içinde. Çevrimiçi modda Supabase için internet gerekir.

### Telefonda denemek (aynı Wi-Fi)

```bash
npm run dev -- --host
```

Terminalde çıkan `Network: http://192.168.x.x:5173` adresini telefonun tarayıcısında aç.
Telefonun verisi bilgisayarınkinden **ayrıdır** (her tarayıcının kendi hafızası var).

### Testler

```bash
npm test
```

Saf fonksiyonların (sonuç hesabı, açılış sekmesi, biçimler, isimler, harita linki, paylaşma metinleri) ve veri katmanının testleri çalışır.

### Yayın paketi

```bash
npm run build
```

`dist/` klasörü oluşur. TypeScript `strict` modunda kontrol edilir.

---

## Test paneli (sadece `npm run dev` ile)

Sağ üstteki küçük, kesik çizgili **test** düğmesi geliştirici panelini açar:

| İşlev | Ne yapar |
|---|---|
| **Bu sekmede kim olayım?** | Odadaki bir kişiye basınca bu sekme o kişi olur (sadece bu sekme, `sessionStorage`). **Kimse (Katıl ekranı)** ile Katıl ekranını görürsün. |
| **Sahte üye ekle** | Emirhan, Kaan, Mert, Berk, Arda, Yusuf havuzundan odada olmayan birini ekler. |
| **Diğerlerine rastgele cevap** | Senin dışındaki üyelere rastgele puan, saat ve katılım yazar. Her 3 kişiden biri bilerek boş kalır (eksik sonuç görülsün diye). |
| **Demo oda (eksik)** | 6 kişi, 5 fikir, 4 kişi cevap vermiş. Sen Emirhan olursun. |
| **Demo oda (kesin)** | Aynısı ama 6 kişinin hepsi cevap vermiş. Getirilecekler hazır. |
| **Rehber ve ipuçlarını sıfırla** | Bu sekmenin adım göstergesi, ipuçları ve "kesin sonuç" animasyonu baştan gelir. |
| **Yapay gecikme** | Sadece çevrimdışı modda. Her işleme 0–300 ms gecikme ekler. |
| **Her şeyi sil** | Onay ister. Çevrimdışı modda bütün odaları siler. Çevrimiçi modda sadece bu tarayıcının `bs:` kayıtlarını siler (sunucudaki odalar kalır). |

Çevrimdışı modda altta kullanılan localStorage boyutu (KB) yazar. Panelin başlığı hangi modda olduğunu gösterir.

**Çevrimiçi modda** çok kişiyi denemenin en kolay yolu: odayı bilgisayarda kur, linki telefonda aç (ya da başka bir tarayıcıda / gizli pencerede).

### Çok kişiyi tek bilgisayarda denemek

1. Bir oda kur (ya da demo oda aç).
2. Aynı oda adresini **yeni bir sekmede** aç. Aynı tarayıcının sekmeleri aynı kişidir.
3. O sekmede **test → Kimse (Katıl ekranı)** seç, başka bir isimle katıl. Artık bu sekme başka biri.
4. Bir sekmede puan ver ya da saat seç; diğer sekmede 1 saniye içinde görünür.

### Demo odalarının beklenen sonuçları (elle kontrol için)

Puanlar (fikir → kişi):

| Fikir | Eksik demo | Kesin demo |
|---|---|---|
| Balık tutma · Moda sahili | E5 M4 B5 Y4 → **4,5** | E5 K4 M4 B5 A4 Y4 → **4,3** |
| Sinema | E4 M3 B4 Y4 → 3,8 | E4 K4 M3 B4 A3 Y4 → 3,7 |
| Birlikte ders çalışma · Kütüphane | E3 M3 B3 Y3 → 3,0 (4 kişi) | E3 K3 M3 B4 A3 Y3 → 3,2 |
| Bowling | E3 B3 → 3,0 (2 kişi, dersin altında) | E3 K2 B3 A2 Y3 → 2,6 |
| Halı saha · Mahalle | Mert 1 verdi → **elendi** | Mert 1 verdi → **elendi** |

| | Eksik demo | Kesin demo |
|---|---|---|
| Cevap veren | 4/6 (Kaan, Arda bekleniyor) | 6/6 → Kesin sonuç ✓ |
| En iyi zaman | 1. gün öğle, 4/4 boş | 1. gün öğle, 5/6 boş |
| En iyi 3 zaman | 1. gün öğle 4 · 1. gün akşam 3 · 2. gün öğle 3 | 1. gün öğle 5 · 1. gün akşam 4 · 2. gün öğle 4 |
| Geliyor | 3/6 (Kaan "geliyorum" dedi ama cevap saymaz) | 5/6 |

"1. gün" = demo odasını kurduğun gün. Bu değerler `src/app/demo.test.ts` içinde test olarak da var.

---

## Yayınlama (Netlify)

`netlify.toml` hazır: Netlify'da GitHub deposunu seç, başka ayar gerekmez. Supabase adresi ve anahtarı `.env` dosyasından gelir.
`.env` içindeki anahtar "publishable" türündedir; tarayıcıya zaten gönderilir, gizli değildir.

## Bilinen sınırlar

- **Hesap yok, link anahtardır.** Oda linkini bilen herkes odayı görür ve katılabilir (tasarımdaki "Linki olan herkes odayı ve seçimleri görür." notu).
- **"Bu cihaz kim?" bilgisi cihazda.** Tarayıcı verisini silersen ya da başka telefondan girersen aynı ismi yazıp "Evet, benim" demen gerekir.
- **Ücretsiz Supabase projesi** 7 gün hiç kullanılmazsa duraklar; Supabase panelinden tek tıkla yeniden açılır.
- **Çevrimdışı modda** veri sadece o tarayıcıdadır ve link başka cihazda çalışmaz.
- **Getirilecekler şablonları tahmindir.** `src/app/suggestions.ts` içinden değiştirebilirsin.
- **Madde silme yok.**
- **Fikir silinince getirilecekler değişmez.** Maddeler kesin sonuç ilk çıktığında bir kez eklenir. Sonradan kazanan değişse de liste kalır.
- localStorage tarayıcı başına yaklaşık **5 MB** ile sınırlı. Bu uygulama sadece yazı sakladığı için çok sayıda oda sığar. Dolarsa "Kaydedilemedi. Tekrar dene." çıkar.
- Gizli sekmede ya da localStorage kapalıysa uygulama çökmez ama seni hatırlamaz.

---

## Klasör yapısı: `core/` ve `app/`

```
src/
  core/   ← konudan bağımsız, "Oyun Odası" ile ortak pakete gidecek kod
  app/    ← sadece Buluşalım'a özel kod (metinler, tipler, sonuç hesabı, ekranlar)
  styles/ ← tokens.css (renk, font, boyut), base.css (sıfırlama, ortak sınıflar)
```

- **Kural:** `core/` içindeki hiçbir dosya `app/` içinden import etmez (tek yönlü bağımlılık). Kontrol:
  ```bash
  grep -rnE "from ['\"](\.\./)+app/" src/core || echo "temiz"
  ```
- `core/sync.ts` ve `core/device.ts` adlarını dışarıdan alır: `createSync('bulusalim')`, `createDevice('bs')`.
  Oyun Odası aynı kodu `createSync('oyunodasi')`, `createDevice('oo')` ile kullanabilir; anahtarlar karışmaz.
- **Ekrandaki bütün metinler** `src/app/copy.ts` içindedir (test paneli hariç). Dilim adları (Sabah/Öğle/Akşam) §17 gereği `src/app/slots.ts` içinde.

## Çevrimdışı → çevrimiçi: ne değişti?

Ekranlar veriye sadece `DataStore` sözleşmesi (`src/app/store.ts`) üzerinden ulaşır. Geçişte **hiçbir ekran dosyası değişmedi**:

| Çevrimdışı | Çevrimiçi |
|---|---|
| `src/app/localStore.ts` (localStorage) | `src/app/supabaseStore.ts` (veritabanındaki `bs_*` fonksiyonları) |
| `src/core/sync.ts` (BroadcastChannel, sekmeler arası) | Supabase Realtime broadcast kanalı `room:{id}` (cihazlar arası) |
| `src/app/runtime.ts` → `createLocalStore()` | `src/app/runtime.ts` → `createSupabaseStore()` |

Veritabanı ayrıntıları: `supabase/README.md`.

---

## Elle test listesi

1. Ana sayfada oda adı ve adın boşken "Oda kur"a basınca "Oda adını yaz" ve "Adını yaz" çıkıyor. Hafta başlangıcına dokununca tarih seçici açılıyor.
2. Oda kurunca "Oda hazır" geliyor. "Linki kopyala" → "Kopyalandı ✓". "WhatsApp'ta paylaş" doğru metinle wa.me'yi açıyor.
3. "Şimdi sen başla →" Fikirler'e götürüyor. Adım göstergesinde "1 Puanla" vurgulu.
4. Öneriden 3 fikir ekle. Eklenenler önerilerde "eklendi ✓". "balık tutma" yazınca "Bu fikir zaten listede" çıkıyor.
5. Bir fikre yer, harita linki ve not ekle. `javascript:alert(1)` yazınca "Link geçerli görünmüyor" çıkıyor. Geçerli link "Haritada aç ↗" olarak açılıyor.
6. İlk puandan önce "1 verirsen fikir elenir." ipucu görünüyor, puan verince kayboluyor ve bir daha gelmiyor.
7. Her dokunuşta "Kaydedildi ✓" çıkıyor, art arda basınca üst üste yığılmıyor. Aynı puana tekrar basınca puan kalkıyor.
8. İkinci sekme aç, test panelinden sahte üye ekle ve o kişi ol. İlk sekmedeki puan bu sekmede 1 saniye içinde görünüyor.
9. Zaman'da kısa dokunuş seçiyor/kaldırıyor. Uzun basma kişi panelini açıyor ve seçimi değiştirmiyor. Telefonda kopyala menüsü çıkmıyor. Kutu sayıları x/toplam üye.
10. Sonuç eksik: "6 kişiden 4'ü cevap verdi · sonuç değişebilir", "Bekleniyor: …", buton "Gruba hatırlat". Getirilecekler görünmüyor.
11. Sonuç kesin (Demo kesin odası): "Kesin sonuç ✓", buton "Sonucu paylaş", kazanan bloğu bir kez kayarak geliyor, Getirilecekler görünüyor.
12. Bir fikre 1 verince sonuçta üstü çizili, soluk ve "gitmem: …" yazıyor. Kazanan olamıyor. Hepsi elenince "Bütün fikirler elendi" çıkıyor.
13. Geliyorum/Gelemem: seçim kaydoluyor, tekrar basınca kalkıyor, sayaç "x/6 geliyor" güncelleniyor. Cevap sayısı ve sonuç değişmiyor.
14. Getirilecekler: "Ben getiririm" → "{isim} getiriyor" + "Vazgeç". İkinci sekmede başka kişi olunca o maddeyi alamıyor. "+ Madde ekle" çalışıyor.
15. "Aynı grupla yeni plan": oda adı "… 2" geliyor, "Oda kur" yeni oda açıyor, üyeler hazır, fikirler boş. Eski oda aynen duruyor.
16. Sayfayı kapatıp açınca isim sorulmuyor, açılış sekmesi kurala uyuyor (puan yok → Fikirler, puan var saat yok → Zaman, ikisi de var → Sonuç).
17. Ekranda "oy", "müsait", "siz", "lütfen", "başarıyla" kelimeleri ve ünlem işareti hiç geçmiyor.
18. İnternet kapalıyken uygulama ve fontlar sorunsuz çalışıyor.
19. Telefonda (`npm run dev -- --host`) ekranlar düzgün, butonlar rahat basılıyor.
