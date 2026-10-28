# İstanbul Rehberi — veri modeli, süzgeç ve doğrulama

## Sorunun kök nedenleri (Ekim 2026 incelemesi)

1. **Kategoriler serbest metinde kelime arıyordu.** `Konser` = açıklamada "konser|sahne|etkinlik|caz" geçmesi; `After` = "Geç saat" etiketi ya da "sabaha" kelimesi; `DJ` = metinde "dj". Bu yüzden "DJ sahnesine dönüşen teras" yazan Ruby Konser'e, gece geç saate kadar açık Kaburgacı Cabbar After'a düşüyordu.
2. **Eksenler karışmıştı.** Sınıflandırıcı, DJ çalan barlara ve meyhanelere "kulüp" türü, açıklamada "canlı" geçen her yere "canlı müzik" atmosferi veriyordu (83 mekân; Zuma, Woody Hamburger dahil).
3. **Kaynak ve güncellik izlenmiyordu.** 560 kaydın 318'i ve görsellerin 315'i tek kaynaktan (OGGUSTO) geliyordu; hangi bilginin nereden ve ne zaman alındığı kayıtta yoktu. Klein'ın Harbiye kaydı kulüp Maslak'a (Klein Phönix) taşındıktan sonra da duruyordu.
4. **Görselin hangi mekâna ait olduğu kanıtlanmıyordu.**

## Veri modeli (her kayıt `mekaniZenginlestir` ile bu biçime gelir)

| Alan | Anlamı | Nereden |
|---|---|---|
| `ad, semt, bolge, yaka, adres` | Ad ve konum | Kayıt (`istanbulMekanlar.js`, `istanbulMekanlarEk.js`) |
| `turler` | Birincil + ikincil tür (restoran, meyhane, kokteyl, **kulup**, **sahne**…) | Kayıt; `kulup`/`sahne` yalnızca `istanbulEtkinlik.js`'te kanıtla |
| `yemekler` | Mutfak ekseni | Kayıt |
| `ozellikler` | Atmosfer (manzara, Boğaz, bahçe, tarihi, romantik) | Kayıt; "canlı müzik" artık burada değil |
| `etkinlikler` | `[{ id, guven, kaynak, url, tarih, not }]` — konser, canli, dj, dans, after | `istanbulEtkinlik.js` (elle doğrulanmış) ya da rehber notundaki birebir etiket |
| `kaynaklar` | `[{ k, url, tarih, alanlar, guven }]` | `istanbulKaynaklar.js` (üretim verisinden çıkarılan köken) + elle |
| `gorselKoken` | Görselin geldiği sayfa/başlık, eşleşme | Aynı; `eslesme !== true` ise görsel gösterilmez |
| `turGuven` | Türün (özellikle kulüp) güven düzeyi | Hesaplanır |
| `kapandi` | Kapanan/taşınan mekân notu | `KAPANAN` |

### Etkinlik tanımları
- **Konser**: programlı konserlerin yapıldığı sahne (tür `sahne` ya da `kulup` + konser kanıtı).
- **Canlı müzik**: düzenli canlı performans (caz, akustik, grup, fasıl) ya da konser.
- **DJ**: düzenli DJ setleri (bar ve restoranlar da olabilir; gerekçede yazar).
- **Dans & şov**: dans pisti, fasıl ya da sahne şovu.
- **After**: kulüp gecesinin 04:00 ve sonrasına sürdüğü *belgelenmiş* mekân. Geç saate kadar yemek veren yerler After değildir; Plan Türü › **Geç Saat Planı**'na girer.
- **Gece kulübü** bir türdür, etkinlik değil; kaynakla verilir.

### Rakı deneyimi ve "eller havaya"
- **Rakı — sakin sohbet & manzara**: rakı mekânı ve hiçbir müzik/dans kaydı yok.
- **Rakı — müzikli / eller havaya**: fasıl, canlı müzik ya da dans kaynakla belgelenmiş (yemek.com fasıl rehberi Eyl 2026, Gazete Oksijen Haz 2026, mekân sitesi).
- **Eller Havaya — dans & eğlence** (Eğlence grubu): yalnızca dans/şov kanıtı olan yerler. Müziği yalnızca eski bir kaynakta geçen meyhane iki listeye de girmez; "doğrulanmamışları da göster" ile görünür.

### Güven düzeyi
- **Doğrulandı (yüksek)**: 2026 tarihli etkinlik takvimi/bilet sayfası ya da 2026 yayını.
- **Kaynaklı (orta)**: 2025 yayını ya da mekânın kendi sitesi.
- **Doğrulanmamış (düşük)**: tarihsiz/eski yayın ya da yalnızca rehber notu. Michelin bir restoranın DJ/canlı müzik yaptığını doğrulamaz; oradan gelen etkinlik bilgisi düşük sayılır.

Etkinlik süzgeçleri varsayılan olarak orta ve üstünü kullanır. Kullanıcı Filtreler › "Doğrulanmamış bilgileri de göster" ile düşükleri açabilir; onlar "Doğrulanmamış" rozetiyle, düşük kategori puanıyla ve listenin sonunda gelir. Güvenli sonuç yoksa ekran bunu söyler ve en yakın seçeneği önerir (After → Gece Kulüpleri / DJ).

## Süzgeç ve sıralama
`lib/istanbulFiltre.js` (arayüzden bağımsız). Bir mekân seçilen her eksende kanıtla uyuyorsa sonuca girer; arama yalnızca ad/semt/etiket/kategori adlarında yapılır, bir kategoriye eklemez. Sıralama: önce zayıf olmayanlar, sonra seçilen ölçüt, eşitlikte Uygulama Skoru. Skorun "Kaynak güveni" ve "Güncellik" bileşenleri artık kaydın gerçek kaynaklarından hesaplanır.

## Kullanılan kaynaklar (gerçekte)
| Kaynak | Ne için | Nasıl |
|---|---|---|
| Michelin Rehberi 2026 | Ödül, adres, fiyat, görsel (83 kayıt) | Mekân sayfaları, önceki oturumda toplandı |
| Time Out İstanbul | Kayıt + görsel (≈90) | Mekân sayfaları (çoğu tarihsiz → düşük güven) |
| OGGUSTO | Kayıt + görsel (≈315) | Liste makaleleri; görsel, mekânın başlığı altındaki fotoğraf |
| yemek.com | 8 elle eklenen kayıt | Liste makaleleri |
| Gazete Oksijen (Haz 2026) | 23 mekânın canlı müzik/konser/dans bilgisi | Elle okundu |
| Songkick | Zorlu PSM, Salon İKSV, Blind, Kastel etkinlik takvimi | Elle okundu (Eki 2026) |
| Techno Airlines | Klein Phönix programı ve saatleri | Elle okundu (Eki 2026) |

**Kullanılmayanlar:** Instagram ve diğer sosyal ağlar (giriş duvarı; izinsiz kazıma yok), Resident Advisor (sayfası erişime kapalı döndü), Biletix/Bubilet/Passo (herkese açık API yok). Google Places entegrasyonu kodda hazır ama anahtar bağlı değil.

## Canlı ve güncel veri için gerekenler
1. **Google Places (New)**: Vercel'e `GOOGLE_PLACES_API_KEY` eklenince puan, yorum sayısı, saat (`after` için kapanış saati), telefon, rezervasyon, alkol ve fotoğraflar canlı gelir (`/api/mekan-google`, 1 gün önbellek; Enterprise SKU ücretli).
2. **Etkinlik takvimi**: Songkick API anahtarı (başvuruyla) ya da bilet platformlarıyla iş ortaklığı gerekir. O zamana kadar `GECE_KAYITLARI` elle, kaynak bağlantısı ve tarihle güncellenir.
3. **Instagram**: yalnızca mekânın kendi işletme hesabına Graph API izni verilirse kullanılabilir.

## Bakım
- Mekân eklemek: `lib/istanbulMekanlarEk.js` (kaynaklar ve varsa gorselKoken ile). Etkinlik iddiası: `lib/istanbulEtkinlik.js` › `GECE_KAYITLARI` (kaynak url + tarih zorunlu).
- Kapanan mekân: `KAPANAN`'a not ekle.
- `lib/istanbulKaynaklar.js` üretilmiş köken dosyasıdır; ham veri (Michelin/Time Out/OGGUSTO kazımaları) repoda değil.
- Kontroller: `npm test` (After'da yemek mekânı yok, Konser'de yalnızca kaynaklı sahne, çoklu kategori, görsel kökeni…), rapor: `npm run rapor:istanbul`.
