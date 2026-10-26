# Sağlık & İstanbul Rehberi — kullanıcı akışları ve ekran hiyerarşisi

Tasarımdan önce yazıldı; ekranlar bu akışlara göre kuruldu. Ortak kural:
**en az adım, geri dönülebilir her işlem, hiçbir durumda kör nokta yok.**

## Ortak sistemler

| Sistem | Davranış |
|---|---|
| **← Geri** | Her detay/alt ekranın sol üstünde, aynı yerde, aynı görünüşte. Kaydedilmemiş giriş varsa önce "Kaydedilmemiş bilgiler silinecek" onayı. |
| **Geri Al** | Ekleme, düzenleme, silme sonrası altta bildirim: "Kayıt güncellendi · Geri Al". 6 sn görünür. Geri Al o işlemden önceki veriyi bütünüyle geri yükler. Art arda hızlı değişiklikler (yazarken) tek işlem sayılır. Finans, tatil, sağlık, İstanbul — veri giren her alanda çalışır. |
| **Boş / hata durumları** | Suçlamayan dil + tek tıklık çözüm: "Filtreleri gevşet", "Konumu kullanmadan devam et", "Tekrar dene". |

## Sağlık

### Akışlar
1. **Günü görmek (0 tık):** Sağlık'a gir → üstte bugün alınan kalori (büyük), altında protein/karb/yağ/lif/su kartları. Hedef ve kalan ikincil.
2. **Besin eklemek (3 tık):** "+ Ekle" ya da öğün satırındaki "+" → arama (ilk harfte sonuç) → porsiyon seç → "Ekle". Öğün önceden seçili gelir.
3. **Fotoğrafla eklemek:** "📷 Fotoğrafla" → fotoğraf çek/seç → yapay zekâ tabaktaki yemekleri ve tahmini gramajı listeler → kullanıcı gramı düzeltir, istemediğini çıkarır → "Seçilenleri ekle". Tahmin olduğu açıkça yazar.
4. **Düzenlemek / silmek:** Öğünü aç → kayıtta "Düzenle" (gram değişince değerler orantılı güncellenir) ya da "Sil" → altta "Geri Al".
5. **Su:** Su bölümünde +1 bardak / +0,5 L; hedef kiloya göre.
6. **Hedefleri ayarlamak:** Alttaki "Profil & hedefler" — ilk girişte üstte açılır, sonra kapanır.

### Ekran hiyerarşisi
```
Sağlık
├─ Gün çubuğu (‹ Bugün ›)
├─ Günün özeti (premium kart): alınan kcal · P/K/Y/lif/su kartları · ince hedef çubuğu
├─ Hızlı eylemler: + Besin ekle · 📷 Fotoğrafla · + Su
├─ Akordeon (istenirse tek bölüm açık)
│  ├─ Kahvaltı · Öğle · Akşam · Ara öğünler   (kapalı: kcal, makro özeti, kayıt sayısı)
│  │   └─ açık = öğün detayı: kayıtlar (ad, porsiyon, kcal, P/K/Y, Düzenle, Sil) + "Ekle"
│  ├─ Su tüketimi
│  ├─ Egzersizler
│  └─ Günlük notlar
├─ Son 7 gün
├─ Profil & hedefler (makro hedefleri, vücut ölçüleri)
└─ Veri paneli
Besin ekleme sayfası (alt sayfa / telefonda tam ekran): ← Geri · öğün seçimi · Ara | Fotoğraf | Elle gir
```

## İstanbul Rehberi

### Akışlar
1. **Hızlı arama:** "Mekân, mutfak ya da semt ara" → sonuçlar anında.
2. **Plan kurmak:** Mekân Türü (çoklu) + Plan Türü (çoklu) + Semt → sonuçlar her seçimde güncellenir; liste "Mekânları göster" ile de açılır.
3. **Daraltmak:** "Filtreler" → fiyat, şimdi açık, rezervasyon, uzaklık, puan & değerlendirme sayısı → "Uygula". Seçili filtreler küçük etiketler, tek tek ✕, "Tümünü temizle".
4. **Karar vermek:** Kartta Google puanı + değerlendirme sayısı + Uygulama Skoru + kısa gerekçe → "Detayları incele" → "Neden önerildi?", plan uygunluğu, atmosfer, müzik, fiyat, saatler, harita, benzer mekânlar.
5. **Saklamak:** Kaydet (favori) ya da "Listeye ekle" → Kayıtlı ekranı: Favoriler + kendi listelerin.
6. **Sonuç yoksa:** hangi filtrenin daralttığı söylenir, tek tıkla gevşetilir.

### Ekran hiyerarşisi
```
İstanbul'da Mekân Keşfet
├─ Arama + [Mekân Türü ▾] [Plan Türü ▾] [Semt ▾] [Filtreler]
├─ Seçili etiketler (✕) · Tümünü temizle
├─ Seçim yoksa: keşif (yemek rafı, hazır listeler, semtler)
├─ Sonuç listesi (sıralama: Uygulama Skoru / Google / fiyat / uzaklık)
│  └─ Kart: foto · ad · semt · kategori · Google puanı (sayı) · Skor/100 · fiyat · atmosfer · açık/kapalı · tanım · Haritada gör / Detay / Kaydet
├─ Detay (← Geri): galeri · Neden önerildi? · plan uygunluğu · bilgiler · eylemler · benzer mekânlar
└─ Kayıtlı: Favoriler · Listelerim (oluştur, yeniden adlandır, sil)
```

### Uygulama Skoru (100)
| Bileşen | Ağırlık | Kaynak |
|---|---|---|
| Google puanı | 40 | Places API (yalnızca bağlıysa; güncelleme tarihiyle) |
| Değerlendirme güveni | 20 | Yorum sayısı kademeleri: <50, 50–199, 200–999, 1000–4999, 5000+ |
| Kategori uygunluğu | 15 | Seçilen mekân türüne asıl uzmanlık mı, yan ürün mü |
| Plan uygunluğu | 10 | Seçilen plan türlerine uyum |
| Güncellik | 5 | Kaynak tarihi |
| Fiyat-performans | 5 | Fiyat seviyesi ↔ puan |
| Atmosfer/servis/menü | 5 | Editoryal not, ödüller |

Google verisi yoksa skor kalan bileşenlerle hesaplanır ve kartta **"Google verisi bağlı değil"** yazar; rehber puanı hiçbir yerde Google puanı gibi gösterilmez. Sponsorlu içerik yok; eklenirse ayrı bölümde "Sponsorlu" etiketiyle gösterilir ve skoru etkilemez.
