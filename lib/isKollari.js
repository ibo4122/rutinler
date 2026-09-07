// İş kolu veri tabanı (Türkiye, 2026 piyasa aralıkları)
//
// GİRİŞİMCİ MANTIĞI — bu modülü diğer hedeflerden ayıran şey:
// Diğer hedeflerde "biriktir ve al" vardır. İş kurmada üç ayrı para vardır:
//   1) KURULUŞ YATIRIMI (CAPEX)  — bir kez ödenir
//   2) AYLIK İŞLETME GİDERİ (OPEX) — her ay yanar, işletmeyi öldüren budur
//   3) NAKİT TAMPONU (runway)      — gelir oturana kadar dayanma parası
// Girişimcilerin en sık hatası 1'i bütçeleyip 2 ve 3'ü unutmaktır.
// Ekran bu yüzden başabaş noktası, geri dönüş ve dayanma süresi hesaplar.

export const IS_KOLLARI = [
  {
    id: "kafe",
    ad: "Kafe / Kahve Dükkânı",
    ikon: "☕",
    ozet: "60–150 m², yoğun lokasyon, hızlı devir",
    birim: "müşteri", periyot: "gün",
    varsayilan: { adet: "110", fiyat: "180", marj: "62" },
    capex: [
      ["Mekân & Tadilat", [["Kira depozitosu (3 ay)", 90000], ["Tadilat & dekorasyon", 450000], ["Tabela & dış cephe", 60000]]],
      ["Ekipman", [["Espresso makinesi & değirmen", 320000], ["Buzdolabı, tezgâh, davlumbaz", 280000], ["Mobilya (masa/sandalye)", 180000], ["Kasa & POS / adisyon sistemi", 45000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu (şahıs/limited)", 12000], ["İşyeri açma ruhsatı & harçlar", 35000], ["Gıda kayıt, hijyen, itfaiye", 25000], ["İlk stok (kahve, süt, malzeme)", 90000], ["Açılış pazarlaması", 40000]]],
    ],
    opex: [["Kira", 45000], ["Personel (3 kişi)", 135000], ["Hammadde & stok", 90000], ["Elektrik, su, doğalgaz", 22000], ["Muhasebe & yazılım", 12000], ["Diğer (temizlik, bakım)", 15000]],
    yol: [
      { faz: "Hazırlık", sure: "0–2. ay", gorevler: ["Lokasyon araştırması: yaya trafiği say, rakip kafeleri listele", "Hedef kitleyi netleştir (öğrenci / ofis / mahalle)", "Fizibilite tablosu: kira + personel + hammadde", "Şirket türüne karar ver, mali müşavirle görüş", "Kira sözleşmesi ve depozito"] },
      { faz: "Kurulum", sure: "2–4. ay", gorevler: ["Tadilat projesi ve usta anlaşması", "Ekipman siparişi (teslim süresi 4–6 hafta)", "İşyeri açma ruhsatı başvurusu", "Gıda işletme kayıt belgesi (Tarım Bakanlığı)", "İtfaiye uygunluk raporu", "Menü ve fiyatlandırma (maliyet + %60 marj)", "Tedarikçi anlaşmaları (kahve, süt, unlu mamul)"] },
      { faz: "Açılış", sure: "4–5. ay", gorevler: ["Personel işe alım + hijyen sertifikaları", "Deneme servisi (soft opening, 1 hafta)", "Google Haritalar & Instagram hesabı", "Açılış kampanyası ve mahalle duyurusu"] },
      { faz: "Büyüme", sure: "5–12. ay", gorevler: ["Günlük müşteri ve sepet ortalamasını takip et", "En çok satan 5 ürünü öne çıkar, satmayanı menüden çıkar", "Sadakat kartı / kurumsal anlaşmalar", "Başabaş noktasını geçtikten sonra kâr payı ayır"] },
    ],
  },
  {
    id: "restoran",
    ad: "Restoran / Fast Food",
    ikon: "🍽️",
    ozet: "Mutfak yatırımı ağır, ciro yüksek",
    birim: "müşteri", periyot: "gün",
    varsayilan: { adet: "100", fiyat: "420", marj: "58" },
    capex: [
      ["Mekân & Tadilat", [["Kira depozitosu (3 ay)", 150000], ["Tadilat & dekorasyon", 700000], ["Havalandırma & baca sistemi", 220000]]],
      ["Mutfak Ekipmanı", [["Endüstriyel ocak, fırın, fritöz", 550000], ["Soğutma & depolama", 300000], ["Bulaşık makinesi & tezgâh", 180000], ["Servis ekipmanı (tabak, çatal)", 90000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu", 15000], ["Ruhsat, harç, gıda kaydı", 60000], ["İlk stok", 150000], ["Açılış pazarlaması", 60000]]],
    ],
    opex: [["Kira", 70000], ["Personel (6 kişi)", 260000], ["Hammadde", 200000], ["Faturalar", 45000], ["Muhasebe & yazılım", 15000], ["Paket servis komisyonu", 40000]],
    yol: [
      { faz: "Hazırlık", sure: "0–2. ay", gorevler: ["Konsept ve mutfak türünü netleştir", "Lokasyon: otopark, yaya trafiği, rakip analizi", "Menü mühendisliği: her ürünün maliyetini çıkar", "Şef / mutfak sorumlusu görüşmeleri", "Kira sözleşmesi"] },
      { faz: "Kurulum", sure: "2–5. ay", gorevler: ["Mutfak projesi ve havalandırma ruhsatı", "Ekipman siparişi ve montaj", "İşyeri açma ruhsatı + gıda kayıt", "İtfaiye ve hijyen denetimi", "Tedarikçi anlaşmaları (et, sebze, kuru gıda)", "Personel alımı ve eğitim"] },
      { faz: "Açılış", sure: "5–6. ay", gorevler: ["Menü tadım ve porsiyon standardizasyonu", "Soft opening (davetli servis)", "Yemek Sepeti / Getir entegrasyonu", "Google & sosyal medya profilleri"] },
      { faz: "Büyüme", sure: "6–12. ay", gorevler: ["Gıda maliyet oranını %30 altında tut", "Fire ve israfı ölç, azalt", "Öğle menüsü / kurumsal paket geliştir", "Yorum puanlarını 4,5+ tut"] },
    ],
  },
  {
    id: "giyim",
    ad: "Giyim Markası",
    ikon: "👗",
    ozet: "Koleksiyon + üretim + marka; stok riski yüksek",
    birim: "sipariş", periyot: "ay",
    varsayilan: { adet: "750", fiyat: "1100", marj: "55" },
    capex: [
      ["Marka & Tasarım", [["Marka tescili (TÜRKPATENT)", 25000], ["Logo & kurumsal kimlik", 40000], ["Kalıp & numune üretimi", 120000], ["Ürün fotoğraf çekimi", 60000]]],
      ["Üretim & Stok", [["İlk koleksiyon üretimi", 350000], ["Kumaş & aksesuar", 120000], ["Etiket, poşet, ambalaj", 45000]]],
      ["Satış Altyapısı", [["E-ticaret sitesi kurulumu", 60000], ["Depo rafı & paketleme", 35000], ["Şirket kuruluşu", 12000], ["Lansman reklamı", 100000]]],
    ],
    opex: [["Reklam (Meta/Google)", 90000], ["Üretim & stok yenileme", 150000], ["Kargo & iade", 45000], ["Personel (2 kişi)", 70000], ["Depo/ofis kirası", 25000], ["Yazılım & muhasebe", 15000]],
    yol: [
      { faz: "Hazırlık", sure: "0–3. ay", gorevler: ["Hedef kitle ve fiyat segmenti belirle", "Rakip markaları ve fiyatlarını incele", "Marka adı seç, TÜRKPATENT'te müsaitlik sorgula", "Üretici / fason atölye görüşmeleri", "İlk koleksiyon: 8–12 model belirle"] },
      { faz: "Kurulum", sure: "3–6. ay", gorevler: ["Kalıp çıkarma ve numune üretimi", "Kumaş tedarikçisi anlaşması", "Marka tescil başvurusu", "Ürün çekimi ve içerik üretimi", "E-ticaret sitesi + ödeme altyapısı", "Beden tablosu ve iade politikası"] },
      { faz: "Lansman", sure: "6–8. ay", gorevler: ["Ön sipariş / bekleme listesi topla", "Mikro influencer iş birlikleri", "Lansman kampanyası", "Trendyol / Hepsiburada mağaza açılışı"] },
      { faz: "Büyüme", sure: "8–18. ay", gorevler: ["Satmayan modelleri erken indir, stok bağlama", "Müşteri edinme maliyetini (CAC) ölç", "Tekrar satın alma oranını artır", "İkinci koleksiyon planı"] },
    ],
  },
  {
    id: "eticaret",
    ad: "E-ticaret / Online Satış",
    ikon: "🛒",
    ozet: "Düşük giriş maliyeti, yüksek reklam gideri",
    birim: "sipariş", periyot: "ay",
    varsayilan: { adet: "1300", fiyat: "750", marj: "35" },
    capex: [
      ["Altyapı", [["E-ticaret sitesi / paket yazılım", 60000], ["Alan adı, SSL, hosting (yıllık)", 15000], ["Ödeme & kargo entegrasyonu", 20000]]],
      ["Ürün & Marka", [["İlk stok", 200000], ["Ürün fotoğraf & içerik", 45000], ["Marka tescili", 25000], ["Ambalaj & etiket", 20000]]],
      ["Kuruluş", [["Şirket kuruluşu", 12000], ["E-ticaret bilgi sistemi (ETBİS) kaydı", 3000], ["Lansman reklamı", 80000]]],
    ],
    opex: [["Reklam bütçesi", 80000], ["Stok yenileme", 120000], ["Kargo & iade", 40000], ["Pazaryeri komisyonu", 35000], ["Yazılım abonelikleri", 12000], ["Muhasebe", 8000]],
    yol: [
      { faz: "Hazırlık", sure: "0–1. ay", gorevler: ["Ürün / niş seçimi: talep ve rekabet analizi", "Tedarikçi bul, numune iste, maliyet çıkar", "Birim ekonomi hesabı: ürün + kargo + komisyon + reklam", "Şirket kuruluşu ve ETBİS kaydı"] },
      { faz: "Kurulum", sure: "1–3. ay", gorevler: ["Site kurulumu ve ürün yükleme", "Ödeme altyapısı (sanal POS) başvurusu", "Kargo anlaşması (hacim indirimi pazarlığı)", "Ürün fotoğrafları ve açıklamaları", "Mesafeli satış sözleşmesi & iade politikası"] },
      { faz: "Lansman", sure: "3–4. ay", gorevler: ["Meta & Google reklam hesapları, piksel kurulumu", "İlk kampanya: küçük bütçeyle test", "Pazaryeri mağazaları (Trendyol, Hepsiburada)", "İlk 50 siparişte müşteri geri bildirimi topla"] },
      { faz: "Büyüme", sure: "4–12. ay", gorevler: ["ROAS (reklam getirisi) 3'ün altına düşerse durdur", "Sepet ortalamasını artır (paket/çapraz satış)", "E-posta & SMS ile tekrar satış", "En kârlı 3 üründe derinleş"] },
    ],
  },
  {
    id: "magaza",
    ad: "Fiziki Mağaza (Perakende)",
    ikon: "🏪",
    ozet: "Lokasyon her şeydir; stok ve kira ağır basar",
    birim: "müşteri", periyot: "gün",
    varsayilan: { adet: "40", fiyat: "850", marj: "42" },
    capex: [
      ["Mekân", [["Kira depozitosu (3 ay)", 120000], ["Tadilat & vitrin", 350000], ["Tabela & aydınlatma", 70000]]],
      ["Donanım & Stok", [["Raf, askılık, kabin", 150000], ["Kasa & POS sistemi", 40000], ["Güvenlik & kamera", 45000], ["İlk stok", 450000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu", 12000], ["Ruhsat & harçlar", 30000], ["Açılış pazarlaması", 50000]]],
    ],
    opex: [["Kira", 60000], ["Personel (2 kişi)", 90000], ["Stok yenileme", 180000], ["Faturalar", 18000], ["Muhasebe & yazılım", 12000]],
    yol: [
      { faz: "Hazırlık", sure: "0–2. ay", gorevler: ["Lokasyon: yaya sayımı yap, saat saat ölç", "Rakip mağazaların fiyat ve ürün analizi", "Tedarikçi ve marka görüşmeleri", "Kira pazarlığı (ciro kirası mümkün mü?)"] },
      { faz: "Kurulum", sure: "2–4. ay", gorevler: ["Tadilat ve vitrin tasarımı", "Raf düzeni ve müşteri akış planı", "Stok siparişi ve barkod sistemi", "Ruhsat başvurusu", "Personel alımı ve satış eğitimi"] },
      { faz: "Açılış", sure: "4–5. ay", gorevler: ["Vitrin düzenlemesi", "Açılış indirimi ve mahalle duyurusu", "Google İşletme kaydı", "Müşteri iletişim listesi oluştur"] },
      { faz: "Büyüme", sure: "5–12. ay", gorevler: ["Metrekare başına ciroyu takip et", "Dönüşüm oranı: giren kaç kişi alıyor?", "Ölü stoku 90 günde temizle", "Sezon planlaması ve kampanya takvimi"] },
    ],
  },
  {
    id: "kres",
    ad: "Kreş / Anaokulu",
    ikon: "🧸",
    ozet: "MEB izinleri uzun; doluluk oranı belirleyici",
    birim: "öğrenci", periyot: "ay",
    varsayilan: { adet: "70", fiyat: "18000", marj: "70" },
    capex: [
      ["Bina & Uygunluk", [["Kira depozitosu (3 ay)", 180000], ["Tadilat (MEB standartları)", 800000], ["Bahçe & oyun alanı", 250000], ["Yangın & güvenlik sistemi", 120000]]],
      ["Donanım", [["Sınıf mobilyası ve dolaplar", 300000], ["Oyuncak & eğitim materyali", 180000], ["Mutfak ve yemekhane", 150000], ["Kamera sistemi (veli erişimli)", 90000]]],
      ["Yasal", [["Kurum açma izni (MEB)", 60000], ["Şirket kuruluşu", 15000], ["İtfaiye, sağlık, deprem raporu", 80000], ["Tanıtım & kayıt kampanyası", 100000]]],
    ],
    opex: [["Kira", 90000], ["Öğretmen & personel (8 kişi)", 380000], ["Yemek & mutfak", 110000], ["Faturalar", 35000], ["Servis (varsa)", 60000], ["Muhasebe & yazılım", 15000]],
    yol: [
      { faz: "Hazırlık", sure: "0–3. ay", gorevler: ["Bölgedeki 0–6 yaş nüfusu ve rakip kreşleri araştır", "MEB kurum açma yönetmeliğini incele (m² / öğrenci şartı)", "Uygun bina bul: zemin kat, bahçe, kaçış yolu", "Kurucu temsilcisi ve mali müşavir belirle"] },
      { faz: "İzin & Kurulum", sure: "3–7. ay", gorevler: ["MEB kurum açma izni dosyası hazırla", "İtfaiye, sağlık, deprem dayanıklılık raporları", "Tadilat: lavabo yüksekliği, güvenlik, havalandırma", "Eğitim programı ve günlük akış planı", "Öğretmen alımı (branş + yardımcı)", "Menü ve diyetisyen onayı"] },
      { faz: "Kayıt", sure: "7–9. ay", gorevler: ["Tanıtım günü ve veli görüşmeleri", "Erken kayıt indirimi", "Sosyal medya ve mahalle tanıtımı", "Kayıt sözleşmesi ve ücret politikası"] },
      { faz: "İşletme", sure: "9–18. ay", gorevler: ["Doluluk oranını takip et (kârlılık eşiği ~%70)", "Veli memnuniyeti anketi (dönemsel)", "Öğretmen devir hızını düşük tut", "İkinci dönem kayıt yenileme oranını ölç"] },
    ],
  },
  {
    id: "kurs",
    ad: "Kurs Merkezi / Dershane",
    ikon: "📚",
    ozet: "MEB izinli; sınıf doluluğu ve öğretmen kalitesi",
    birim: "öğrenci", periyot: "ay",
    varsayilan: { adet: "170", fiyat: "4500", marj: "75" },
    capex: [
      ["Mekân", [["Kira depozitosu (3 ay)", 120000], ["Tadilat & sınıf düzeni", 400000], ["Tabela & yönlendirme", 50000]]],
      ["Donanım", [["Sıra, sandalye, tahta", 220000], ["Projeksiyon & akıllı tahta", 180000], ["Bilgisayar & ofis donanımı", 90000], ["Kütüphane & kaynak kitaplar", 60000]]],
      ["Yasal & Açılış", [["MEB kurum açma izni", 50000], ["Şirket kuruluşu", 15000], ["İtfaiye & sağlık raporu", 40000], ["Tanıtım kampanyası", 120000]]],
    ],
    opex: [["Kira", 60000], ["Öğretmen kadrosu", 320000], ["İdari personel", 60000], ["Faturalar", 25000], ["Yayın & materyal", 40000], ["Muhasebe & yazılım", 15000]],
    yol: [
      { faz: "Hazırlık", sure: "0–3. ay", gorevler: ["Hedef sınav / branş seç (YKS, LGS, dil, meslek)", "Bölgedeki öğrenci sayısı ve rakip kurumlar", "MEB özel öğretim kurumları yönetmeliğini incele", "Bina: sınıf m², kaçış yolu, tuvalet sayısı şartları"] },
      { faz: "İzin & Kurulum", sure: "3–6. ay", gorevler: ["Kurum açma izni dosyası (MEB)", "Yangın, sağlık, deprem raporları", "Sınıf tadilatı ve donanım kurulumu", "Öğretmen alımı ve deneme dersleri", "Müfredat ve deneme sınavı takvimi"] },
      { faz: "Kayıt", sure: "6–8. ay", gorevler: ["Ücretsiz deneme sınavı ile öğrenci topla", "Okul çıkışı tanıtım ve broşür", "Veli bilgilendirme toplantısı", "Erken kayıt ve kardeş indirimi"] },
      { faz: "İşletme", sure: "8–18. ay", gorevler: ["Sınıf başına doluluk ve kârlılık takibi", "Öğrenci başarı takibi ve rapor", "Referans/tavsiye ile kayıt oranını ölç", "Yaz kursu ile atıl dönemi doldur"] },
    ],
  },
  {
    id: "dil",
    ad: "Dil Kursu / Özel Ders",
    ikon: "🗣️",
    ozet: "Düşük sermaye, online ile hızlı ölçeklenir",
    birim: "öğrenci", periyot: "ay",
    varsayilan: { adet: "95", fiyat: "3200", marj: "68" },
    capex: [
      ["Kurulum", [["Ofis/derslik depozito & tadilat", 120000], ["Masa, sandalye, tahta", 60000], ["Bilgisayar & kamera/mikrofon", 55000], ["Ders materyali & lisanslar", 45000]]],
      ["Dijital", [["Web sitesi & kayıt sistemi", 40000], ["Online ders platformu (yıllık)", 25000], ["Marka & tanıtım tasarımı", 25000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu", 12000], ["İzin & harçlar (kurum ise)", 35000], ["Lansman reklamı", 60000]]],
    ],
    opex: [["Kira", 25000], ["Eğitmen ödemeleri", 90000], ["Reklam", 30000], ["Platform & yazılım", 12000], ["Faturalar", 10000], ["Muhasebe", 8000]],
    yol: [
      { faz: "Hazırlık", sure: "0–1. ay", gorevler: ["Hedef kitle: yetişkin / sınav / çocuk / kurumsal", "Seviye sistemi ve müfredat taslağı", "Fiyatlandırma: birebir mi grup mu?", "Eğitmen havuzu oluştur (yarı zamanlı başla)"] },
      { faz: "Kurulum", sure: "1–3. ay", gorevler: ["Online platform ve kayıt sistemi", "Deneme dersi akışı tasarla", "Seviye belirleme sınavı hazırla", "Web sitesi ve referans/yorum altyapısı", "Şirket kuruluşu"] },
      { faz: "Lansman", sure: "3–4. ay", gorevler: ["Ücretsiz deneme dersi kampanyası", "Instagram / TikTok içerik üretimi", "İlk 20 öğrenciden video yorum topla", "Kurumsal (şirket içi eğitim) teklifleri"] },
      { faz: "Büyüme", sure: "4–12. ay", gorevler: ["Öğrenci devam ve tamamlama oranını ölç", "Grup dersiyle eğitmen saatini verimli kullan", "Sertifika / seviye atlama ile tekrar kayıt", "Kurumsal anlaşmalarla dalgalanmayı azalt"] },
    ],
  },
  {
    id: "guzellik",
    ad: "Güzellik Salonu / Kuaför",
    ikon: "💇",
    ozet: "Randevu doluluğu ve tekrar müşteri belirleyici",
    birim: "müşteri", periyot: "gün",
    varsayilan: { adet: "20", fiyat: "900", marj: "60" },
    capex: [
      ["Mekân", [["Kira depozitosu (3 ay)", 90000], ["Tadilat & dekorasyon", 300000], ["Tabela & aydınlatma", 45000]]],
      ["Ekipman", [["Koltuk, ayna, yıkama ünitesi", 220000], ["Cihazlar (lazer, cilt bakım)", 280000], ["Sterilizasyon & havalandırma", 70000], ["İlk ürün stoğu", 80000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu", 12000], ["İşyeri açma ruhsatı & harçlar", 35000], ["Sağlık & hijyen belgeleri", 20000], ["Açılış kampanyası", 45000]]],
    ],
    opex: [["Kira", 40000], ["Personel (3 kişi)", 120000], ["Ürün & sarf malzeme", 45000], ["Faturalar", 15000], ["Randevu yazılımı & muhasebe", 10000], ["Reklam", 20000]],
    yol: [
      { faz: "Hazırlık", sure: "0–2. ay", gorevler: ["Hizmet menüsü belirle (saç / cilt / tırnak / lazer)", "Bölge analizi: rakip fiyatları ve doluluk", "Usta/personel görüşmeleri (müşteri portföyü önemli)", "Kira sözleşmesi ve depozito"] },
      { faz: "Kurulum", sure: "2–4. ay", gorevler: ["Tadilat: su tesisatı, havalandırma, aydınlatma", "Cihaz seçimi ve eğitim (sertifikalı kullanım)", "İşyeri açma ruhsatı ve hijyen belgeleri", "Randevu sistemi kurulumu", "Marka ve fiyat listesi tasarımı"] },
      { faz: "Açılış", sure: "4–5. ay", gorevler: ["Açılış indirimi ve paket satışı", "Instagram öncesi/sonrası içerikleri", "Google İşletme + randevu bağlantısı", "İlk müşterilerden yorum topla"] },
      { faz: "Büyüme", sure: "5–12. ay", gorevler: ["Koltuk doluluk oranını takip et", "Paket/abonelik ile tekrar geliri sabitle", "Ürün satışıyla ek gelir yarat", "Personel prim sistemi kur"] },
    ],
  },
  {
    id: "spor",
    ad: "Spor Salonu / Fitness",
    ikon: "🏋️",
    ozet: "Ekipman ağır yatırım; üyelik tekrar geliri sağlar",
    birim: "üye", periyot: "ay",
    varsayilan: { adet: "420", fiyat: "1600", marj: "68" },
    capex: [
      ["Mekân", [["Kira depozitosu (3 ay)", 180000], ["Tadilat, zemin, ayna", 500000], ["Soyunma odası & duş", 250000], ["Havalandırma & klima", 180000]]],
      ["Ekipman", [["Kardiyo aletleri", 600000], ["Ağırlık & kuvvet istasyonları", 550000], ["Serbest ağırlık & aksesuar", 150000], ["Ses sistemi & TV", 70000]]],
      ["Yasal & Açılış", [["Şirket kuruluşu", 15000], ["Ruhsat & harçlar", 40000], ["Üyelik yazılımı & turnike", 90000], ["Açılış kampanyası", 90000]]],
    ],
    opex: [["Kira", 90000], ["Antrenör & personel (5 kişi)", 190000], ["Faturalar (yüksek elektrik)", 55000], ["Ekipman bakım", 20000], ["Yazılım & muhasebe", 15000], ["Reklam", 30000]],
    yol: [
      { faz: "Hazırlık", sure: "0–2. ay", gorevler: ["Konsept: butik mi geniş salon mu?", "Bölgede üye potansiyeli ve rakip fiyatları", "Tavan yüksekliği, zemin dayanımı, otopark kontrolü", "Ekipman tedarikçisi teklifleri (kiralama seçeneği?)"] },
      { faz: "Kurulum", sure: "2–5. ay", gorevler: ["Tadilat: zemin, havalandırma, duş tesisatı", "Ekipman siparişi ve yerleşim planı", "Ruhsat ve spor tesisi izinleri", "Üyelik yazılımı + turnike kurulumu", "Antrenör alımı ve sertifika kontrolü"] },
      { faz: "Açılış", sure: "5–6. ay", gorevler: ["Ön kayıt kampanyası (açılış öncesi indirim)", "Ücretsiz deneme haftası", "Sosyal medya ve mahalle tanıtımı", "Grup ders programı oluştur"] },
      { faz: "Büyüme", sure: "6–18. ay", gorevler: ["Üye kaybı (churn) oranını aylık ölç", "Yıllık üyelikle nakit akışını öne çek", "PT ve grup dersleriyle ek gelir", "Yoğun saat doluluğunu yönet"] },
    ],
  },
];

export const isKolu = (id) => IS_KOLLARI.find((s) => s.id === id) || null;

// Ölçek: aynı iş kolu küçük veya büyük kurulabilir.
export const IS_OLCEK = [
  { id: "kucuk", label: "Küçük", carpan: 0.55, aciklama: "Küçük şehir / dar metrekare / ikinci el" },
  { id: "orta", label: "Orta", carpan: 1, aciklama: "Büyükşehir semt, standart kurulum" },
  { id: "buyuk", label: "Büyük", carpan: 1.9, aciklama: "Merkezi lokasyon, premium konsept" },
];
