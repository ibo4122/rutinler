// Tatil planlama verisi.
//
// Mantık: bir tatil bütçesi dört kalemden oluşur ve üçü sabit, biri değişkendir.
//   1) Ulaşım  — uçak bileti (Türkiye'den alınır, TL)
//   2) Konaklama — gece × oda (yerel para)
//   3) Günlük yaşam — yemek + şehir içi ulaşım (gün × kişi, yerel para)
//   4) Girişler & alışveriş — gezilecek yer biletleri + harçlık
// Ayrıca Türkiye'den çıkışa özel kalemler var: vize, seyahat sağlık sigortası,
// yurt dışı çıkış harcı. Çoğu plan bunları unutur, bütçe de bu yüzden şaşar.
//
// Fiyatlar 2026 referanslarıdır; sezona, kura ve ne kadar erken aldığına göre
// ciddi değişir. Hepsi ekranda düzenlenebilir — bunlar başlangıç noktasıdır.

// Kurlar tahminîdir; ekranda güncellenebilir.
export const PARALAR = {
  EUR: { simge: "€", ad: "Euro", kur: 52 },
  GBP: { simge: "£", ad: "Sterlin", kur: 60 },
  USD: { simge: "$", ad: "Dolar", kur: 46 },
  CZK: { simge: "Kč", ad: "Çek Korunası", kur: 2.1 },
  JPY: { simge: "¥", ad: "Japon Yeni", kur: 0.31 },
  EGP: { simge: "E£", ad: "Mısır Lirası", kur: 0.95 },
  AED: { simge: "AED", ad: "BAE Dirhemi", kur: 12.6 },
  GEL: { simge: "₾", ad: "Gürcü Larisi", kur: 17.2 },
  THB: { simge: "฿", ad: "Tayland Bahtı", kur: 1.42 },
};

// Türkiye'den çıkışa özel sabit kalemler (TL).
export const YURTDISI_HARC = 1000;        // yurt dışı çıkış harcı (kara/hava)
export const SIGORTA_GUNLUK = 90;         // seyahat sağlık sigortası, kişi/gün

export const VIZE_TURLERI = {
  schengen: { ad: "Schengen vizesi", ucret: 90, para: "EUR", hizmet: 3200, not: "90 € konsolosluk harcı + başvuru merkezi hizmet bedeli. Randevu için 1–2 ay önceden başla." },
  uk: { ad: "Birleşik Krallık vizesi", ucret: 127, para: "GBP", hizmet: 3500, not: "6 aylık standart ziyaretçi vizesi. Schengen'den ayrıdır, ayrı başvurulur." },
  japonya: { ad: "Japonya turistik vize", ucret: 0, para: "EUR", hizmet: 1500, not: "Konsolosluk harcı alınmıyor; aracı kurum hizmet bedeli var. İşlem ~5 iş günü." },
  kapida: { ad: "Kapıda vize", ucret: 25, para: "USD", hizmet: 0, not: "Varışta havalimanında alınır; nakit bulundurmak işi hızlandırır." },
  yok: { ad: "Vize yok", ucret: 0, para: "EUR", hizmet: 0, not: "Türk pasaportuyla vizesiz giriş. Pasaportun dönüş tarihinden sonra en az 6 ay geçerli olmalı." },
  kimlik: { ad: "Kimlikle giriş", ucret: 0, para: "EUR", hizmet: 0, not: "Yeni çipli T.C. kimlik kartıyla giriş yapılabilir; pasaport şart değil." },
};

export const ULKELER = [
  // ===================== İTALYA ===========================================
  {
    id: "italya", ad: "İtalya", bayrak: "🇮🇹", renk: "#22c55e", para: "EUR", vize: "schengen",
    sehirler: [
      {
        id: "roma", ad: "Roma", ikon: "🏛️", onerilenGun: 5,
        ozet: "Üç bin yıllık katmanlı bir şehir: antik Roma, Vatikan ve barok İtalya üst üste duruyor. Ayakta en çok yorulacağın ama en çok şey gördüğün rota.",
        enIyiZaman: "Nisan–Haziran, Eylül–Ekim. Temmuz–Ağustos 35°C üstü ve kuyruklar iki katı.",
        ucusTL: 11500,
        konaklama: { ekonomik: 75, orta: 135, konfor: 250 },
        gunluk: { yemek: 45, ulasim: 8, ekstra: 15 },
        gezilecek: [
          { ad: "Kolosyum + Roma Forumu + Palatine Tepesi", ucret: 18, sure: "3–4 saat", not: "Tek bilet, 24 saat geçerli. ticketing.colosseo.it'te kontenjan 30 gün önce açılır ve dakikalar içinde biter." },
          { ad: "Vatikan Müzeleri + Sistine Şapeli", ucret: 25, sure: "3–4 saat", not: "Resmî sitede 20 €, online rezervasyonla 25 €. Sabah 08:00 seansı kalabalığın yarısı demek." },
          { ad: "Aziz Petrus Bazilikası", ucret: 0, sure: "1–2 saat", not: "Giriş ücretsiz; kubbeye çıkış 10 € (asansör 15 €). Omuz ve diz kapalı olmalı." },
          { ad: "Pantheon", ucret: 5, sure: "45 dk", not: "2023'ten beri ücretli. Pazar sabahları ücretsiz." },
          { ad: "Borghese Galerisi", ucret: 15, sure: "2 saat", not: "Zorunlu randevu, 2 saatlik seans. Bernini heykelleri için tek başına gelmeye değer." },
          { ad: "Castel Sant'Angelo", ucret: 16, sure: "1,5 saat", not: "Teras, Roma'nın en iyi gün batımı manzarası." },
          { ad: "Trevi Çeşmesi, İspanyol Merdivenleri, Navona", ucret: 0, sure: "2 saat", not: "Ücretsiz. Trevi'yi sabah 07:00'de görmek ile öğlen görmek iki ayrı deneyim." },
          { ad: "Ostia Antica (günübirlik)", ucret: 18, sure: "Yarım gün", not: "Roma'nın liman kenti; Pompeii kadar etkileyici, onda biri kadar kalabalık. Metro + tren 1,50 €." },
        ],
        plan: [
          { gun: 1, baslik: "Antik Roma", duraklar: ["Kolosyum (sabah ilk seans)", "Roma Forumu", "Palatine Tepesi", "Capitoline Meydanı", "Akşam: Trastevere'de yemek"], ipucu: "Kolosyum biletini 30 gün önce al. Forum'a öğleden sonra geç — sabah gölge yok." },
          { gun: 2, baslik: "Vatikan", duraklar: ["Vatikan Müzeleri (08:00 seansı)", "Sistine Şapeli", "Aziz Petrus Bazilikası", "Kubbe çıkışı", "Castel Sant'Angelo'da gün batımı"], ipucu: "Müzeden bazilikaya geçen iç kapı turlu gruplara açık; bireyselsen meydandan dolaşırsın." },
          { gun: 3, baslik: "Barok merkez", duraklar: ["Pantheon", "Navona Meydanı", "Trevi Çeşmesi", "İspanyol Merdivenleri", "Villa Borghese + Galeri (randevulu)"], ipucu: "Bugün bilet yükü hafif; ayakkabını ve kahve molalarını buna göre planla." },
          { gun: 4, baslik: "Ostia Antica + yerel Roma", duraklar: ["Ostia Antica antik kenti", "Testaccio pazarı", "Aventine Anahtar Deliği", "Portakal Bahçesi'nde gün batımı"], ipucu: "Ostia, Pompeii'ye gitmeye vaktin yoksa en iyi alternatif — merkezden 40 dakika." },
          { gun: 5, baslik: "Boşluk günü & alışveriş", duraklar: ["Campo de' Fiori sabah pazarı", "Via del Corso alışveriş", "Son kalan müze / kilise", "Havalimanı transferi"], ipucu: "Son günü doldurma. Beğendiğin bir yere dönmek, yeni bir yere koşmaktan iyi." },
        ],
        ipuclari: [
          "Roma Pass (3 gün, 62 €) 2 müze + sınırsız toplu taşıma içerir; Kolosyum + Borghese gidecekseniz başa baş.",
          "Restoranlarda 'coperto' (kuver) 2–3 €/kişi normaldir, dolandırıcılık değil.",
          "Ayakta içilen kahve ile oturarak içilen kahvenin fiyatı farklıdır — bar tezgâhında 1,20 €, masada 4 €.",
        ],
      },
      {
        id: "toskana", ad: "Floransa & Toskana", ikon: "🎨", onerilenGun: 4,
        ozet: "Rönesans'ın doğduğu şehir ve çevresindeki bağ kasabaları. Roma'dan daha sakin, daha yürünebilir, yemeği daha iyi.",
        enIyiZaman: "Mayıs–Haziran, Eylül. Bağ bozumu için Eylül sonu.",
        ucusTL: 12500,
        konaklama: { ekonomik: 70, orta: 125, konfor: 220 },
        gunluk: { yemek: 48, ulasim: 6, ekstra: 15 },
        gezilecek: [
          { ad: "Uffizi Galerisi", ucret: 25, sure: "3 saat", not: "Botticelli ve Leonardo. Randevu şart; Salı sabahları en sakin." },
          { ad: "Accademia (Davut heykeli)", ucret: 16, sure: "1 saat", not: "Sadece Davut için gidilir ve değer. 45 dakikada çıkarsın." },
          { ad: "Duomo kompleksi (Brunelleschi Pass)", ucret: 30, sure: "3 saat", not: "Kubbe + çan kulesi + vaftizhane + müze. Kubbe için 463 basamak, asansör yok." },
          { ad: "Pitti Sarayı + Boboli Bahçeleri", ucret: 22, sure: "3 saat", not: "Sıcakta Boboli'yi sabah gez." },
          { ad: "Siena günübirlik", ucret: 15, sure: "Tam gün", not: "Otobüsle 1,5 saat. Piazza del Campo ve katedral." },
          { ad: "San Gimignano + Chianti bağ turu", ucret: 85, sure: "Tam gün", not: "Rehberli tur + 2 bağ tadımı + öğle yemeği dahil fiyat." },
          { ad: "Pisa günübirlik", ucret: 20, sure: "Yarım gün", not: "Trenle 1 saat. Kuleye çıkış 20 €; çıkmazsan 2 saatte biter." },
        ],
        plan: [
          { gun: 1, baslik: "Rönesans merkezi", duraklar: ["Duomo + kubbe çıkışı", "Vaftizhane", "Piazza della Signoria", "Ponte Vecchio", "Akşam: Piazzale Michelangelo'da gün batımı"], ipucu: "Kubbe çıkışını güne ilk iş koy; öğleden sonra hem kuyruk hem sıcak." },
          { gun: 2, baslik: "Müze günü", duraklar: ["Uffizi (randevulu, sabah)", "Accademia / Davut", "Mercato Centrale'de öğle", "Oltrarno zanaatkâr sokakları"], ipucu: "İki büyük müzeyi aynı güne koymak yorucu ama bilet randevuları çoğu zaman buna zorluyor." },
          { gun: 3, baslik: "Chianti & ortaçağ kasabaları", duraklar: ["San Gimignano kuleleri", "Chianti bağında tadım + öğle", "Greve in Chianti", "Akşam Floransa'ya dönüş"], ipucu: "Tadım varsa araç kiralama yerine turu seç — yolda alkol kontrolü ciddidir." },
          { gun: 4, baslik: "Siena ya da Pisa", duraklar: ["Siena: Piazza del Campo + Duomo", "veya Pisa: Mucizeler Meydanı", "Dönüşte Floransa'da son alışveriş"], ipucu: "İkisini aynı güne sıkıştırma; biri seçilir, diğerine bir dahaki sefere." },
        ],
        ipuclari: [
          "Floransa müzelerinin çoğu Pazartesi kapalı — programı buna göre kur.",
          "Deri çarşısındaki fiyatlar pazarlığa açıktır; ilk fiyatın %30 altı makul.",
          "Bistecca alla Fiorentina kilo ile satılır, genelde 1 kg ve 2 kişiliktir.",
        ],
      },
    ],
  },

  // ===================== FRANSA ============================================
  {
    id: "fransa", ad: "Fransa", bayrak: "🇫🇷", renk: "#60a5fa", para: "EUR", vize: "schengen",
    sehirler: [
      {
        id: "paris", ad: "Paris", ikon: "🗼", onerilenGun: 5,
        ozet: "Müze yoğunluğu dünyada eşi olmayan şehir. 2026'dan beri AB dışı ziyaretçiler büyük müzelerde daha yüksek tarife ödüyor — bütçeyi bu değiştirdi.",
        enIyiZaman: "Mayıs–Haziran, Eylül–Ekim. Ağustos'ta şehir boşalır, birçok esnaf tatildedir.",
        ucusTL: 12000,
        konaklama: { ekonomik: 95, orta: 165, konfor: 300 },
        gunluk: { yemek: 55, ulasim: 9, ekstra: 20 },
        gezilecek: [
          { ad: "Louvre", ucret: 32, sure: "4 saat", not: "14 Ocak 2026'dan beri AB dışı ziyaretçiler için 32 € (önceden 22 €). Randevu zorunlu." },
          { ad: "Eyfel Kulesi (2. kat, asansör)", ucret: 29, sure: "2–3 saat", not: "Tepe katı 45 €. Merdivenle 2. kat 14 € ve kuyruk yok." },
          { ad: "Versailles Sarayı (Passport)", ucret: 35, sure: "Tam gün", not: "AB dışı ziyaretçi tarifesi 35 €. Bahçelerde fıskiye gösterisi olan günler ayrı ücretli." },
          { ad: "Orsay Müzesi", ucret: 16, sure: "2–3 saat", not: "İzlenimciler burada. Louvre'dan daha insani ölçekte, çoğu kişi daha çok seviyor." },
          { ad: "Sainte-Chapelle", ucret: 13, sure: "45 dk", not: "Vitraylar için güneşli bir öğleden önce git." },
          { ad: "Notre-Dame", ucret: 0, sure: "1 saat", not: "Restorasyon sonrası yeniden açık; giriş ücretsiz ama online randevu alırsan kuyruğu atlarsın." },
          { ad: "Montmartre + Sacré-Cœur", ucret: 0, sure: "3 saat", not: "Bazilika ücretsiz, kubbe 8 €. Füniküler metro biletiyle geçerli." },
          { ad: "Musée de l'Orangerie (Nilüferler)", ucret: 12.5, sure: "1,5 saat", not: "Monet'nin panoramik nilüfer salonları. Küçük ve güçlü bir müze." },
        ],
        plan: [
          { gun: 1, baslik: "Klasik Paris", duraklar: ["Eyfel Kulesi (sabah)", "Trocadéro", "Seine nehir turu", "Champs-Élysées", "Zafer Takı'nda gün batımı"], ipucu: "Eyfel biletini tam 60 gün önce, satışa açıldığı gün al — ucuz asansör biletleri saatler içinde tükeniyor." },
          { gun: 2, baslik: "Louvre & Tuileries", duraklar: ["Louvre (randevulu, sabah)", "Tuileries Bahçesi", "Orangerie / Nilüferler", "Palais Royal", "Akşam: Le Marais"], ipucu: "Louvre'da üç şeyi hedefle, 'hepsini görme' niyetini baştan bırak." },
          { gun: 3, baslik: "Versailles", duraklar: ["Versailles Sarayı", "Aynalı Salon", "Bahçeler ve Trianon", "Akşam Paris'e dönüş"], ipucu: "RER C ile 45 dakika. Sarayı erken, bahçeleri öğleden sonra gez — tersi kuyrukta geçer." },
          { gun: 4, baslik: "Sanat ve adalar", duraklar: ["Orsay Müzesi", "Sainte-Chapelle", "Notre-Dame", "Île Saint-Louis", "Latin Mahallesi'nde akşam"], ipucu: "Üçü de yürüme mesafesinde; bu, Paris'in en az metro kullandığın günü." },
          { gun: 5, baslik: "Montmartre & alışveriş", duraklar: ["Sacré-Cœur", "Place du Tertre", "Galeries Lafayette terası", "Son alışveriş", "Havalimanı"], ipucu: "Galeries Lafayette'in çatı terası ücretsiz ve şehrin en iyi ücretsiz manzarası." },
        ],
        ipuclari: [
          "Müze fiyat artışı AB dışı pasaportlar için geçerli — Türk pasaportuyla yüksek tarife ödenir, bütçeyi buna göre kur.",
          "Metro için Navigo Easy kartı al; tekli bilet 2,50 €, 10'lu karne 17,35 €.",
          "Restoranda 'menu du jour' (günün menüsü) öğle vakti aynı yemeği akşamın yarı fiyatına verir.",
        ],
      },
    ],
  },

  // ===================== İSPANYA ===========================================
  {
    id: "ispanya", ad: "İspanya", bayrak: "🇪🇸", renk: "#f59e0b", para: "EUR", vize: "schengen",
    sehirler: [
      {
        id: "barselona", ad: "Barselona", ikon: "🏖️", onerilenGun: 4,
        ozet: "Gaudí mimarisi, Akdeniz sahili ve Avrupa'nın en iyi sokak yemeği bir arada. 2026 Gaudí Yüzüncü Yılı nedeniyle biletler her zamankinden hızlı tükeniyor.",
        enIyiZaman: "Mayıs–Haziran, Eylül. Ağustos hem sıcak hem tıklım tıklım.",
        ucusTL: 11000,
        konaklama: { ekonomik: 80, orta: 140, konfor: 240 },
        gunluk: { yemek: 42, ulasim: 7, ekstra: 15 },
        gezilecek: [
          { ad: "Sagrada Família", ucret: 26, sure: "2 saat", not: "Kule çıkışlı biletler 40 €'ya kadar. 2026'da tamamlanma yılı — talep rekor seviyede, aylar öncesinden al." },
          { ad: "Park Güell", ucret: 18, sure: "2 saat", not: "2026 Ocak'ta 10 €'dan 18 €'ya çıktı. Saatli giriş; geç kalırsan bilet yanar." },
          { ad: "Casa Batlló", ucret: 29, sure: "1,5 saat", not: "Gaudí'nin en teatral evi. Gece seansı daha pahalı ama çok daha sakin." },
          { ad: "La Pedrera (Casa Milà)", ucret: 28, sure: "1,5 saat", not: "Çatı bacaları için gidilir." },
          { ad: "Gotik Mahalle + Katedral", ucret: 9, sure: "3 saat", not: "Mahalle ücretsiz, katedral ziyareti 9 €." },
          { ad: "Picasso Müzesi", ucret: 15, sure: "2 saat", not: "Perşembe 16:00 sonrası ücretsiz, ama kuyruk uzun." },
          { ad: "Montjuïc + Sihirli Çeşme", ucret: 0, sure: "Yarım gün", not: "Çeşme gösterisi ücretsiz; teleferik 14 €." },
          { ad: "Camp Nou turu", ucret: 32, sure: "2,5 saat", not: "Renovasyon takvimini gitmeden kontrol et." },
        ],
        plan: [
          { gun: 1, baslik: "Gaudí günü", duraklar: ["Sagrada Família (sabah ilk seans)", "Casa Batlló", "La Pedrera", "Passeig de Gràcia'da akşam"], ipucu: "Üç Gaudí yapısını aynı güne koymak yoğun ama yürüme mesafesinde — mantıklı." },
          { gun: 2, baslik: "Park Güell & Gràcia", duraklar: ["Park Güell (saatli giriş)", "Gràcia mahallesi", "Bunkers del Carmel'de gün batımı", "Tapas turu"], ipucu: "Bunkers ücretsiz ve şehrin en iyi panoraması; gün batımından 1 saat önce çık." },
          { gun: 3, baslik: "Eski şehir & deniz", duraklar: ["Gotik Mahalle", "Katedral", "Picasso Müzesi", "Born mahallesi", "Barceloneta sahili"], ipucu: "Las Ramblas'ta yemek yeme — iki sokak içerisi hem yarı fiyat hem gerçek." },
          { gun: 4, baslik: "Montjuïc & kapanış", duraklar: ["Montjuïc teleferiği", "Joan Miró Vakfı", "Sihirli Çeşme", "Son alışveriş", "Havalimanı"], ipucu: "Aerobús havalimanına 7,25 € ve 35 dakika; taksinin yarı fiyatı." },
        ],
        ipuclari: [
          "Yankesicilik Avrupa ortalamasının çok üstünde — metroda ve Ramblas'ta telefonu cebe koyma.",
          "T-casual kartı 10 yolculuk 12,55 €; tekli bilet 2,65 €.",
          "Akşam yemeği 21:00'den önce başlamaz; 19:00'da açık olan yer turist tuzağıdır.",
        ],
      },
    ],
  },

  // ===================== İNGİLTERE =========================================
  {
    id: "ingiltere", ad: "İngiltere", bayrak: "🇬🇧", renk: "#f43f5e", para: "GBP", vize: "uk",
    sehirler: [
      {
        id: "londra", ad: "Londra", ikon: "🎡", onerilenGun: 4,
        ozet: "Dünyanın en iyi müzelerinin çoğu burada ve ücretsiz. Pahalı olan konaklama ve yemek; kültür bedava.",
        enIyiZaman: "Mayıs–Eylül. Kasım–Şubat erken kararır ama tiyatro ve Noel pazarları için güzel.",
        ucusTL: 13500,
        konaklama: { ekonomik: 110, orta: 180, konfor: 320 },
        gunluk: { yemek: 50, ulasim: 9, ekstra: 20 },
        gezilecek: [
          { ad: "British Museum", ucret: 0, sure: "3 saat", not: "Ücretsiz. Rosetta Taşı ve Partenon kabartmaları." },
          { ad: "National Gallery", ucret: 0, sure: "2 saat", not: "Ücretsiz. Van Gogh'un Ayçiçekleri burada." },
          { ad: "Tower of London", ucret: 37, sure: "3 saat", not: "Taç mücevherleri dahil. Şehrin en pahalı ama en doyurucu bileti." },
          { ad: "Westminster Abbey", ucret: 32, sure: "1,5 saat", not: "Sesli rehber fiyata dahil. Pazar günleri ziyarete kapalı, sadece ayin." },
          { ad: "London Eye", ucret: 34, sure: "1 saat", not: "Online erken alırsan ~%25 ucuz. Gün batımı seansı en iyisi." },
          { ad: "St Paul's Katedrali", ucret: 26, sure: "2 saat", not: "Fısıltı Galerisi'ne 528 basamak." },
          { ad: "Natural History + V&A + Science Museum", ucret: 0, sure: "Yarım gün", not: "Üçü yan yana ve üçü de ücretsiz. Çocuklu seyahatin kurtarıcısı." },
          { ad: "West End müzikali", ucret: 45, sure: "3 saat", not: "TodayTix veya Leicester Square TKTS gişesinden son dakika yarı fiyat." },
        ],
        plan: [
          { gun: 1, baslik: "Westminster & nehir", duraklar: ["Big Ben + Parlamento", "Westminster Abbey", "Nöbetçi değişimi (Buckingham)", "St James's Park", "London Eye'da gün batımı"], ipucu: "Nöbetçi değişimi her gün değil — takvimi gitmeden kontrol et." },
          { gun: 2, baslik: "Tower & doğu", duraklar: ["Tower of London (açılışta)", "Tower Bridge", "Borough Market'te öğle", "Shakespeare's Globe", "Tate Modern"], ipucu: "Borough Market Pazar kapalı; Pazartesi yarım gün." },
          { gun: 3, baslik: "Müzeler & Soho", duraklar: ["British Museum", "Covent Garden", "National Gallery", "Soho", "Akşam: West End müzikali"], ipucu: "Üç büyük müze ücretsiz ama 'bağış önerisi' sorulur — zorunlu değildir." },
          { gun: 4, baslik: "Notting Hill & kapanış", duraklar: ["Portobello Road pazarı", "Notting Hill", "Hyde Park", "Oxford Street alışveriş", "Havalimanı"], ipucu: "Portobello'nun asıl pazar günü Cumartesi; diğer günler sadece dükkânlar açık." },
        ],
        ipuclari: [
          "Oyster yerine temassız banka kartıyla bin — günlük tavan aynı, kart depozitosu yok.",
          "UK vizesi Schengen'den tamamen ayrıdır; ikisini aynı seyahatte kullanacaksan ikisini de almalısın.",
          "Pub'larda masaya servis yok, siparişi bardan verirsin; bahşiş beklenmez.",
        ],
      },
    ],
  },

  // ===================== ÇEKYA =============================================
  {
    id: "cekya", ad: "Çekya", bayrak: "🇨🇿", renk: "#a78bfa", para: "CZK", vize: "schengen",
    sehirler: [
      {
        id: "prag", ad: "Prag", ikon: "🏰", onerilenGun: 4,
        ozet: "Savaşta yıkılmamış bir ortaçağ merkezi. Batı Avrupa fiyatlarının yarısına Avrupa'nın en güzel silüeti.",
        enIyiZaman: "Nisan–Haziran, Eylül–Ekim. Aralık'ta Noel pazarları için ayrı bir sebep var.",
        ucusTL: 9500,
        konaklama: { ekonomik: 1600, orta: 2900, konfor: 5200 },
        gunluk: { yemek: 900, ulasim: 150, ekstra: 400 },
        gezilecek: [
          { ad: "Prag Kalesi (B rotası)", ucret: 450, sure: "3 saat", not: "Aziz Vitus Katedrali, Eski Saray, Altın Sokak dahil." },
          { ad: "Charles Köprüsü", ucret: 0, sure: "1 saat", not: "Ücretsiz. 07:00'den önce veya 22:00'den sonra git; gündüz omuz omuza." },
          { ad: "Astronomik Saat + Eski Belediye kulesi", ucret: 350, sure: "1 saat", not: "Saat başı gösteri 1 dakika sürer ve açıkçası abartılır; asıl değer kule manzarası." },
          { ad: "Yahudi Mahallesi (müze bileti)", ucret: 600, sure: "3 saat", not: "Altı sinagog + mezarlık tek bilette. Cumartesi kapalı." },
          { ad: "Petřín Tepesi + kule", ucret: 250, sure: "2 saat", not: "Füniküler toplu taşıma biletiyle. Mini Eyfel manzarası." },
          { ad: "Strahov Manastırı Kütüphanesi", ucret: 200, sure: "45 dk", not: "Barok kütüphane salonları; fotoğraf için ayrı ücret." },
          { ad: "Vyšehrad", ucret: 0, sure: "2 saat", not: "Turist akınından uzak kale ve mezarlık; Prag'ın en huzurlu manzarası." },
        ],
        plan: [
          { gun: 1, baslik: "Eski Şehir", duraklar: ["Eski Şehir Meydanı", "Astronomik Saat kulesi", "Tyn Kilisesi", "Charles Köprüsü (gün batımı)", "Akşam: eski şehirde bira evi"], ipucu: "Meydandaki restoranlar üç kat pahalı; bir sokak içeri gir." },
          { gun: 2, baslik: "Kale bölgesi", duraklar: ["Prag Kalesi", "Aziz Vitus Katedrali", "Altın Sokak", "Strahov Kütüphanesi", "Petřín Tepesi"], ipucu: "Kaleye tramvay 22 ile çık, yürüyerek in — tersi 20 dakika rampa demek." },
          { gun: 3, baslik: "Yahudi Mahallesi & modern Prag", duraklar: ["Josefov sinagogları", "Eski Yahudi Mezarlığı", "Wenceslas Meydanı", "Dans Eden Ev", "Náplavka nehir kıyısı"], ipucu: "Josefov Cumartesi ve Yahudi bayramlarında kapalıdır." },
          { gun: 4, baslik: "Vyšehrad veya Kutná Hora", duraklar: ["Vyšehrad kalesi", "veya trenle Kutná Hora kemik kilisesi", "Son alışveriş: Havelská pazarı"], ipucu: "Kutná Hora trenle 1 saat; kemik kilisesi için bilet online alınmalı." },
        ],
        ipuclari: [
          "Euro ile ödeme kabul eden yerlerde kur çok kötü; koruna çek ve ATM'de 'dinamik kur çevrimi'ni reddet.",
          "Sokakta döviz bozdurma — komisyonsuz yazıp kuru kıran çok yer var.",
          "Toplu taşıma 30 dakikalık bilet 30 Kč; kontrol sık ve ceza ağır.",
        ],
      },
    ],
  },

  // ===================== HOLLANDA ==========================================
  {
    id: "hollanda", ad: "Hollanda", bayrak: "🇳🇱", renk: "#fb923c", para: "EUR", vize: "schengen",
    sehirler: [
      {
        id: "amsterdam", ad: "Amsterdam", ikon: "🚲", onerilenGun: 3,
        ozet: "Kanal halkaları, dünya çapında iki müze ve bisikletle gezilen bir merkez. Üç gün çoğu kişiye yeter.",
        enIyiZaman: "Nisan (lale), Mayıs–Eylül. Kasım–Şubat ıslak ve erken karanlık.",
        ucusTL: 11000,
        konaklama: { ekonomik: 110, orta: 185, konfor: 300 },
        gunluk: { yemek: 48, ulasim: 9, ekstra: 18 },
        gezilecek: [
          { ad: "Rijksmuseum", ucret: 25, sure: "3 saat", not: "Rembrandt'ın Gece Devriyesi. Sabah 09:00 en sakin saat." },
          { ad: "Van Gogh Müzesi", ucret: 24, sure: "2,5 saat", not: "Sadece online saatli bilet; gişede satış yok." },
          { ad: "Anne Frank Evi", ucret: 16, sure: "1,5 saat", not: "Biletler tam 6 hafta önce saat 10:00'da açılır ve aynı gün biter. Takvime alarm kur." },
          { ad: "Kanal turu", ucret: 20, sure: "1 saat", not: "Akşam turu, ışıklı kanallar için daha iyi." },
          { ad: "Jordaan + Dokuz Sokak", ucret: 0, sure: "3 saat", not: "Ücretsiz. Şehrin en güzel yürüyüşü." },
          { ad: "Keukenhof (Mart sonu–Mayıs)", ucret: 23, sure: "Yarım gün", not: "Sadece ilkbaharda açık. Otobüs kombine bileti 33 €." },
          { ad: "Zaanse Schans yel değirmenleri", ucret: 0, sure: "Yarım gün", not: "Alana giriş ücretsiz, değirmen içi 5 €. Trenle 20 dakika." },
        ],
        plan: [
          { gun: 1, baslik: "Müze Meydanı", duraklar: ["Rijksmuseum", "Van Gogh Müzesi", "Vondelpark", "Dokuz Sokak", "Akşam: kanal turu"], ipucu: "İki büyük müze aynı gün yorucu — aralarına Vondelpark'ta uzun bir mola koy." },
          { gun: 2, baslik: "Kanallar & tarih", duraklar: ["Anne Frank Evi (randevulu)", "Westerkerk", "Jordaan", "Begijnhof", "Çiçek pazarı"], ipucu: "Anne Frank Evi bileti yoksa planı buna göre kur; gişede satış gerçekten yok." },
          { gun: 3, baslik: "Zaanse Schans & kapanış", duraklar: ["Zaanse Schans yel değirmenleri", "Peynir ve takunya atölyeleri", "Dönüşte Amsterdam Centraal", "Havalimanı"], ipucu: "Nisan'daysan Zaanse Schans yerine Keukenhof'u seç — yılın sadece 8 haftası açık." },
        ],
        ipuclari: [
          "Bisiklet yolunda yürüme; Amsterdam'da yayanın yeri kaldırımdır ve bisikletliler durmaz.",
          "I amsterdam City Card (24 sa 60 €) iki büyük müze + kanal turu yapacaksan başa baş.",
          "Merkezde konaklama çok pahalı; 15 dakika tramvay mesafesi fiyatı üçte bir düşürür.",
        ],
      },
    ],
  },

  // ===================== YUNANİSTAN ========================================
  {
    id: "yunanistan", ad: "Yunanistan", bayrak: "🇬🇷", renk: "#38bdf8", para: "EUR", vize: "schengen",
    sehirler: [
      {
        id: "atina", ad: "Atina", ikon: "🏺", onerilenGun: 3,
        ozet: "Türkiye'ye en yakın Avrupa başkenti ve en ucuz Schengen tatili. Üç gün antik merkez için fazlasıyla yeter.",
        enIyiZaman: "Nisan–Mayıs, Ekim. Temmuz–Ağustos'ta Akropolis öğlen saatlerinde sıcaktan kapatılabiliyor.",
        ucusTL: 7500,
        konaklama: { ekonomik: 65, orta: 110, konfor: 190 },
        gunluk: { yemek: 38, ulasim: 6, ekstra: 12 },
        gezilecek: [
          { ad: "Akropolis", ucret: 30, sure: "2,5 saat", not: "Saatli giriş zorunlu. 08:00 seansı 33 € ama hem serin hem boş." },
          { ad: "Akropolis Müzesi", ucret: 15, sure: "2 saat", not: "Arkeolojik alandan ayrı bilet. Partenon kabartmalarının bağlamı burada." },
          { ad: "Birleşik arkeoloji bileti", ucret: 30, sure: "2 gün", not: "Akropolis + Antik Agora + Kerameikos + Olympieion + Roma Agorası. 5 gün geçerli." },
          { ad: "Ulusal Arkeoloji Müzesi", ucret: 12, sure: "2,5 saat", not: "Agamemnon maskesi ve Antikythera mekanizması. Çoğu turistin atladığı en iyi müze." },
          { ad: "Plaka & Anafiotika", ucret: 0, sure: "2 saat", not: "Ücretsiz. Anafiotika, Akropolis eteğinde ada köyü gibi." },
          { ad: "Likavitos Tepesi", ucret: 10, sure: "1,5 saat", not: "Füniküler 10 €, yürüyüş ücretsiz. Gün batımında şehir ve Akropolis bir arada." },
          { ad: "Sounion / Poseidon Tapınağı", ucret: 10, sure: "Yarım gün", not: "Otobüsle 1,5 saat. Ege'ye bakan gün batımı için gidilir." },
        ],
        plan: [
          { gun: 1, baslik: "Akropolis", duraklar: ["Akropolis (08:00 seansı)", "Partenon ve Erehtheion", "Akropolis Müzesi", "Plaka'da öğle", "Anafiotika'da akşam yürüyüşü"], ipucu: "Birleşik bileti al; tek tek alırsan aynı yerler 60 €'yu geçiyor." },
          { gun: 2, baslik: "Antik merkez", duraklar: ["Antik Agora + Hephaisteion", "Roma Agorası", "Kerameikos", "Monastiraki bit pazarı", "Likavitos'ta gün batımı"], ipucu: "Hephaisteion, Yunanistan'ın en iyi korunmuş tapınağı ve Partenon'un aksine boş." },
          { gun: 3, baslik: "Müze & Sounion", duraklar: ["Ulusal Arkeoloji Müzesi", "Öğleden sonra Sounion", "Poseidon Tapınağı'nda gün batımı", "Dönüş"], ipucu: "Sounion'a gitmeyeceksen bu günü Pire veya bir günübirlik adaya ayır (Aegina 1 saat)." },
        ],
        ipuclari: [
          "Türkiye'den uçuş 2 saat ve en ucuz Schengen rotası; kapıda vize yok, Schengen şart.",
          "Metro havalimanı–merkez 9 €; taksi 40 € sabit tarife.",
          "Taverna'da 'ne önerirsiniz' demek yerine menüdeki fiyatları iste — sözlü fiyat genelde yüksek çıkar.",
        ],
      },
    ],
  },

  // ===================== JAPONYA ===========================================
  {
    id: "japonya", ad: "Japonya", bayrak: "🇯🇵", renk: "#f472b6", para: "JPY", vize: "japonya",
    sehirler: [
      {
        id: "tokyokyoto", ad: "Tokyo & Kyoto", ikon: "⛩️", onerilenGun: 7,
        ozet: "Bir uçta dünyanın en yoğun metropolü, diğer uçta 1600 tapınaklı eski başkent. Shinkansen ikisini 2 saat 15 dakikaya indiriyor.",
        enIyiZaman: "Mart sonu–Nisan başı (sakura) ve Kasım (kızıl yapraklar). İkisi de en pahalı dönemler.",
        ucusTL: 32000,
        konaklama: { ekonomik: 11000, orta: 20000, konfor: 38000 },
        gunluk: { yemek: 6500, ulasim: 1500, ekstra: 2500 },
        gezilecek: [
          { ad: "Senso-ji Tapınağı (Asakusa)", ucret: 0, sure: "2 saat", not: "Ücretsiz. Tokyo'nun en eski tapınağı; Nakamise çarşısı sabah 08:00'de bomboş." },
          { ad: "TeamLab Planets / Borderless", ucret: 3800, sure: "3 saat", not: "Dijital sanat müzesi. Haftalar öncesinden online bilet." },
          { ad: "Shibuya Sky", ucret: 2500, sure: "1,5 saat", not: "Açık çatı terası; gün batımı seansı aylar öncesinden dolar." },
          { ad: "Tokyo Ulusal Müzesi", ucret: 1000, sure: "2,5 saat", not: "Samuray zırhları ve kılıçlar. Ueno Parkı içinde." },
          { ad: "Fushimi Inari (Kyoto)", ucret: 0, sure: "2–3 saat", not: "Ücretsiz ve 24 saat açık. 07:00'den önce git — fotoğraflardaki boş tüneller ancak o saatte." },
          { ad: "Kinkaku-ji / Altın Köşk", ucret: 500, sure: "1 saat", not: "Kyoto'nun simgesi. 45 dakikada biter." },
          { ad: "Arashiyama bambu ormanı + Tenryu-ji", ucret: 800, sure: "Yarım gün", not: "Bambu yolu ücretsiz; tapınak bahçesi 800 ¥. Sabah 08:00 şart." },
          { ad: "Nara günübirlik", ucret: 800, sure: "Tam gün", not: "Todai-ji Büyük Buda + geyik parkı. Kyoto'dan trenle 45 dakika." },
          { ad: "Shinkansen Tokyo–Kyoto (tek yön)", ucret: 14000, sure: "2 sa 15 dk", not: "JR Pass artık çoğu rota için kârlı değil; tek tek bilet genelde ucuz." },
        ],
        plan: [
          { gun: 1, baslik: "Tokyo: doğu", duraklar: ["Senso-ji (erken)", "Nakamise çarşısı", "Sumida nehri", "Tokyo Skytree", "Akşam: Ueno izakaya"], ipucu: "Jet lag ilk gün en ağır — hafif bir gün bırak, erken yat." },
          { gun: 2, baslik: "Tokyo: batı", duraklar: ["Meiji Jingu", "Harajuku / Takeshita", "Omotesando", "Shibuya kavşağı", "Shibuya Sky gün batımı"], ipucu: "Shibuya Sky biletini Türkiye'den alarak git; yerinde bulunmuyor." },
          { gun: 3, baslik: "Tokyo: modern", duraklar: ["TeamLab", "Toyosu balık hali", "Ginza", "Tokyo İstasyonu", "Akşam: Shinjuku Omoide Yokocho"], ipucu: "Toyosu'da ton balığı mezatı için 05:00'te orada olman gerekir." },
          { gun: 4, baslik: "Kyoto'ya geçiş", duraklar: ["Sabah Shinkansen", "Otele yerleşme", "Gion mahallesi", "Kiyomizu-dera", "Akşam: Pontocho sokağı"], ipucu: "Büyük valizi otelden otele kargo (takkyubin) ile yolla, 2000 ¥ ve aynı gün varır." },
          { gun: 5, baslik: "Kyoto: doğu", duraklar: ["Fushimi Inari (07:00)", "Tofuku-ji", "Sanjusangendo", "Nishiki pazarı", "Akşam: Kamo nehri kıyısı"], ipucu: "Fushimi'de zirveye kadar çıkma; 30 dakika yukarısı zaten boş ve manzara aynı." },
          { gun: 6, baslik: "Kyoto: batı", duraklar: ["Arashiyama bambu ormanı (08:00)", "Tenryu-ji bahçesi", "Maymun parkı", "Kinkaku-ji", "Ryoan-ji taş bahçesi"], ipucu: "Arashiyama ve Kinkaku-ji şehrin iki ucunda; arada otobüs 40 dakika." },
          { gun: 7, baslik: "Nara & dönüş", duraklar: ["Nara: Todai-ji", "Geyik parkı", "Kasuga Taisha", "Kansai havalimanına transfer"], ipucu: "Haruka ekspresi Kyoto–Kansai arası 75 dakika; uçuştan 4 saat önce yola çık." },
        ],
        ipuclari: [
          "Suica/Pasmo kartını telefonuna yükle; hem metro hem market ödemesi tek yerden.",
          "Nakit hâlâ önemli — küçük lokantalar ve tapınaklar kart almıyor.",
          "Bahşiş kültürü yok; bırakmak kibarlık değil, kafa karışıklığı yaratır.",
          "Vize için konsolosluk harcı alınmıyor ama uçuş + otel rezervasyonu ve banka dökümü isteniyor.",
        ],
      },
    ],
  },

  // ===================== MISIR =============================================
  {
    id: "misir", ad: "Mısır", bayrak: "🇪🇬", renk: "#fbbf24", para: "EGP", vize: "kapida",
    sehirler: [
      {
        id: "kahireluksor", ad: "Kahire & Luksor", ikon: "🐫", onerilenGun: 5,
        ozet: "Piramitler, Mısır Müzesi ve Nil boyunca antik Teb. Kur farkı sayesinde Avrupa'nın üçte biri fiyatına bir medeniyet turu.",
        enIyiZaman: "Ekim–Nisan. Yaz aylarında Luksor 45°C'yi geçiyor.",
        ucusTL: 9000,
        konaklama: { ekonomik: 1800, orta: 3800, konfor: 8000 },
        gunluk: { yemek: 1200, ulasim: 500, ekstra: 800 },
        gezilecek: [
          { ad: "Giza Piramitleri + Sfenks", ucret: 700, sure: "Yarım gün", not: "Keops'un içine giriş ayrı 900 EGP; dar ve havasız, klostrofobin varsa girme." },
          { ad: "Büyük Mısır Müzesi (GEM)", ucret: 1500, sure: "4 saat", not: "Tutankamon hazinesinin tamamı artık burada. Dünyanın en büyük arkeoloji müzesi." },
          { ad: "Sakkara + Dahşur piramitleri", ucret: 600, sure: "Yarım gün", not: "Basamaklı piramit ve Kızıl Piramit. Giza'dan çok daha sakin." },
          { ad: "Han El-Halili çarşısı", ucret: 0, sure: "3 saat", not: "Ücretsiz. Pazarlık zorunlu; ilk fiyatın üçte biri hedef." },
          { ad: "Karnak Tapınağı (Luksor)", ucret: 600, sure: "3 saat", not: "Sütunlu salon tek başına yolculuğa değer." },
          { ad: "Krallar Vadisi", ucret: 750, sure: "3 saat", not: "3 mezar dahil; Tutankamon ayrı 700 EGP, Seti I ayrı 2000 EGP." },
          { ad: "Hatşepsut Tapınağı", ucret: 440, sure: "1,5 saat", not: "Sabah erken git, gölge yok." },
          { ad: "Nil'de balon turu (Luksor)", ucret: 4500, sure: "3 saat", not: "Gün doğumunda kalkar; Luksor'un en iyi deneyimi." },
          { ad: "Kahire–Luksor iç hat uçuş", ucret: 4000, sure: "1 saat", not: "Gece treni 1500 EGP ve 10 saat; yataklı vagon makul." },
        ],
        plan: [
          { gun: 1, baslik: "Giza", duraklar: ["Giza Piramitleri (08:00)", "Sfenks", "Panorama noktası", "Öğleden sonra Büyük Mısır Müzesi"], ipucu: "Piramitlerde deve/at teklifleri agresiftir; fiyatı binmeden ve yazılı netleştir." },
          { gun: 2, baslik: "Eski Kahire", duraklar: ["Sakkara basamaklı piramit", "Dahşur Kızıl Piramit", "Kıpti Kahire", "Han El-Halili'de akşam"], ipucu: "Sakkara + Dahşur için günlük şoför tut (~1500 EGP); toplu taşıma pratik değil." },
          { gun: 3, baslik: "Luksor: doğu yaka", duraklar: ["Sabah uçuş/tren", "Karnak Tapınağı", "Luksor Tapınağı (akşam ışıklandırmalı)", "Nil kenarında akşam"], ipucu: "Luksor Tapınağı'nı akşam gör; ışıklandırma gündüzden daha etkileyici." },
          { gun: 4, baslik: "Luksor: batı yaka", duraklar: ["Gün doğumunda balon turu", "Krallar Vadisi", "Hatşepsut Tapınağı", "Memnon Kolosleri"], ipucu: "Batı yakası öğleden sonra dayanılmaz sıcak; 06:00–12:00 arası bitir." },
          { gun: 5, baslik: "Dönüş", duraklar: ["Son alışveriş", "Kahire'ye dönüş", "Havalimanı"], ipucu: "Papirüs ve 'antika' satışlarının neredeyse tamamı sahte; hediyelik olarak al, yatırım olarak değil." },
        ],
        ipuclari: [
          "Kapıda vize 25 USD, nakit dolar ile alınır — havalimanına girmeden banka gişesinden.",
          "Bahşiş (bakşiş) kültürü çok yaygın; küçük banknot bulundur.",
          "Musluk suyunu içme, buz da dahil. Şişe su günde 2–3 litre.",
          "Fiyatları yabancılara yüksek söylemek yaygındır; girişlerde resmî tarife panosunu okumakta ısrar et.",
        ],
      },
    ],
  },

  // ===================== BAE ===============================================
  {
    id: "bae", ad: "Birleşik Arap Emirlikleri", bayrak: "🇦🇪", renk: "#2dd4bf", para: "AED", vize: "yok",
    sehirler: [
      {
        id: "dubai", ad: "Dubai & Abu Dabi", ikon: "🌇", onerilenGun: 4,
        ozet: "Vizesiz, 4,5 saat uçuş, Türkçe konuşulan bir şehir. Giriş serbest ama her aktivite ayrı ve pahalı — bütçeyi aktiviteler belirler.",
        enIyiZaman: "Kasım–Mart. Haziran–Eylül 45°C ve dışarıda vakit geçirilmez.",
        ucusTL: 10500,
        konaklama: { ekonomik: 320, orta: 650, konfor: 1400 },
        gunluk: { yemek: 220, ulasim: 60, ekstra: 100 },
        gezilecek: [
          { ad: "Burj Khalifa (124. + 125. kat)", ucret: 179, sure: "2 saat", not: "148. kat 399 AED. Gün batımı seansı en pahalısı ve en çok talep göreni." },
          { ad: "Dubai Çerçevesi (Frame)", ucret: 50, sure: "1 saat", not: "Eski ve yeni Dubai'yi aynı kareden görürsün; fiyat/performansı en iyi manzara." },
          { ad: "Çöl safari + akşam yemeği", ucret: 250, sure: "6 saat", not: "Dune bashing + deve + canlı gösteri + BBQ. Dubai'nin standart ama gerçekten iyi aktivitesi." },
          { ad: "Şeyh Zayed Camii (Abu Dabi)", ucret: 0, sure: "2 saat", not: "Giriş ücretsiz, online randevu gerekli. Dünyanın en etkileyici modern camilerinden." },
          { ad: "Louvre Abu Dhabi", ucret: 65, sure: "3 saat", not: "Mimarisi tek başına bileti hak ediyor." },
          { ad: "Dubai Marina + JBR sahili", ucret: 0, sure: "Yarım gün", not: "Ücretsiz. Akşam yürüyüşü için en keyifli bölge." },
          { ad: "Eski Dubai: Al Fahidi + abra geçişi", ucret: 1, sure: "3 saat", not: "Abra (su taksisi) 1 AED. Altın ve baharat çarşıları karşı kıyıda." },
          { ad: "Ski Dubai / Aquaventure", ucret: 350, sure: "Yarım gün", not: "Çocuklu seyahatte en çok talep edilen kalem." },
        ],
        plan: [
          { gun: 1, baslik: "Modern Dubai", duraklar: ["Dubai Mall", "Akvaryum", "Burj Khalifa (gün batımı)", "Çeşme gösterisi", "Souk Al Bahar'da akşam"], ipucu: "Çeşme gösterisi ücretsiz, her 30 dakikada bir; köprüden izlemek en iyi açı." },
          { gun: 2, baslik: "Eski Dubai & çöl", duraklar: ["Al Fahidi tarihi mahallesi", "Abra ile karşıya geçiş", "Altın ve Baharat Çarşısı", "Akşam: çöl safari"], ipucu: "Safari öğleden sonra 15:00'te alır, 21:00'de bırakır; o günü başka şeyle doldurma." },
          { gun: 3, baslik: "Abu Dabi", duraklar: ["Şeyh Zayed Camii", "Louvre Abu Dhabi", "Qasr Al Watan", "Corniche", "Akşam Dubai'ye dönüş"], ipucu: "Camiye kadınlar için abaya girişte ücretsiz veriliyor; erkekler uzun pantolon." },
          { gun: 4, baslik: "Marina & alışveriş", duraklar: ["Dubai Marina yürüyüşü", "JBR sahili", "Mall of the Emirates", "Havalimanı"], ipucu: "Alışverişte KDV iadesi (%5) havalimanında Planet kioskundan alınır; fişleri sakla." },
        ],
        ipuclari: [
          "Türk pasaportuyla vizesiz 90 gün; pasaportun 6 ay geçerli olması yeterli.",
          "Metro ucuz ve temiz (Nol kart); taksi orta mesafede 30–50 AED.",
          "Alkol sadece ruhsatlı otel ve restoranlarda ve çok pahalı.",
          "Ramazan'da gündüz halka açık yerde yeme-içme kısıtlı — takvimi kontrol et.",
        ],
      },
    ],
  },

  // ===================== GÜRCİSTAN =========================================
  {
    id: "gurcistan", ad: "Gürcistan", bayrak: "🇬🇪", renk: "#84cc16", para: "GEL", vize: "kimlik",
    sehirler: [
      {
        id: "tiflis", ad: "Tiflis & Kazbegi", ikon: "🍷", onerilenGun: 4,
        ozet: "Kimlikle gidilen, uçuşu 2 saat, fiyatları Türkiye'den ucuz bir ülke. Kafkas dağları ve 8000 yıllık şarap kültürü cabası.",
        enIyiZaman: "Mayıs–Haziran, Eylül–Ekim. Kazbegi yolu kışın kapanabiliyor.",
        ucusTL: 6500,
        konaklama: { ekonomik: 110, orta: 200, konfor: 380 },
        gunluk: { yemek: 90, ulasim: 25, ekstra: 40 },
        gezilecek: [
          { ad: "Narikala Kalesi + teleferik", ucret: 5, sure: "2 saat", not: "Teleferik tek yön 2,5 GEL. Tiflis'in tamamını görürsün." },
          { ad: "Kükürtlü hamamlar (Abanotubani)", ucret: 60, sure: "1,5 saat", not: "Özel oda saatlik. Kese + masaj ayrı 30 GEL." },
          { ad: "Eski Tiflis + Meydan", ucret: 0, sure: "3 saat", not: "Ücretsiz. Ahşap balkonlu evler ve Barışı Köprüsü." },
          { ad: "Mtskheta (Svetitskhoveli + Jvari)", ucret: 0, sure: "Yarım gün", not: "UNESCO listesinde eski başkent. Girişler ücretsiz, 25 dakika uzaklıkta." },
          { ad: "Kazbegi / Gergeti Üçlemesi Kilisesi", ucret: 150, sure: "Tam gün", not: "Günlük tur fiyatı. 2170 m'de, Kazbek Dağı eteğinde." },
          { ad: "Kakheti şarap bölgesi turu", ucret: 180, sure: "Tam gün", not: "Signagi kasabası + 2 bağ tadımı. Qvevri usulü şarap UNESCO mirası." },
          { ad: "Gürcistan Ulusal Müzesi", ucret: 15, sure: "1,5 saat", not: "Altın hazine salonu ve Sovyet işgali bölümü." },
        ],
        plan: [
          { gun: 1, baslik: "Eski Tiflis", duraklar: ["Meydan ve Eski Şehir", "Narikala teleferik", "Ana Gürcistan heykeli", "Kükürtlü hamamlar", "Akşam: şarap barı"], ipucu: "Hamamı günün sonuna koy; yürüyüşten sonra en doğru sıralama." },
          { gun: 2, baslik: "Kazbegi", duraklar: ["Askeri Yol", "Ananuri Kalesi", "Gudauri manzara noktası", "Gergeti Üçlemesi Kilisesi", "Akşam Tiflis'e dönüş"], ipucu: "Gergeti'ye son 6 km 4x4 ile; dağ yolunda telefon çekmez, şoförle buluşma noktası belirle." },
          { gun: 3, baslik: "Kakheti şarap rotası", duraklar: ["Signagi 'aşk şehri'", "Bodbe Manastırı", "Bağ tadımı + supra yemeği", "Dönüş"], ipucu: "Supra (Gürcü sofrası) uzun sürer ve bol alkollüdür; dönüş saatini geniş tut." },
          { gun: 4, baslik: "Mtskheta & kapanış", duraklar: ["Svetitskhoveli Katedrali", "Jvari Manastırı", "Dezerter pazarı", "Havalimanı"], ipucu: "Dezerter pazarından baharat, ceviz ve churchkhela al — en iyi hediyelik burada." },
        ],
        ipuclari: [
          "Çipli T.C. kimlik kartıyla giriş yapılır; pasaport gerekmez.",
          "Bolt uygulaması taksiden çok ucuz ve her yerde çalışıyor.",
          "Restoranda 'servis ücreti' %10–15 fişe ekleniyor; ayrıca bahşiş beklenmez.",
          "Türk lirası bozdurulabiliyor ama kur kötü; kart kullan ya da dolar/euro götür.",
        ],
      },
    ],
  },

  // ===================== TAYLAND ===========================================
  {
    id: "tayland", ad: "Tayland", bayrak: "🇹🇭", renk: "#c084fc", para: "THB", vize: "yok",
    sehirler: [
      {
        id: "bangkokphuket", ad: "Bangkok & Phuket", ikon: "🏝️", onerilenGun: 7,
        ozet: "Vizesiz 30 gün. Uçuş pahalı ama yerinde her şey ucuz — uzun kalmak maliyeti düşürüyor. Şehir + ada kombinasyonu klasik rotadır.",
        enIyiZaman: "Kasım–Şubat (kurak ve serin). Mayıs–Ekim muson, Andaman denizi dalgalı.",
        ucusTL: 24000,
        konaklama: { ekonomik: 1100, orta: 2400, konfor: 5500 },
        gunluk: { yemek: 900, ulasim: 300, ekstra: 600 },
        gezilecek: [
          { ad: "Büyük Saray + Zümrüt Buda", ucret: 500, sure: "3 saat", not: "Kıyafet kuralı katı: omuz ve diz kapalı. Girişte kiralama var ama pahalı." },
          { ad: "Wat Pho (Yatan Buda)", ucret: 300, sure: "1,5 saat", not: "Geleneksel Tay masajının doğduğu yer; içinde masaj okulu var." },
          { ad: "Wat Arun", ucret: 200, sure: "1 saat", not: "Nehrin karşısında; tekne geçişi 5 THB. Gün batımında dışarıdan izle." },
          { ad: "Chatuchak hafta sonu pazarı", ucret: 0, sure: "Yarım gün", not: "15.000 tezgâh. Sadece Cumartesi–Pazar." },
          { ad: "Ayutthaya günübirlik", ucret: 400, sure: "Tam gün", not: "Eski başkent harabeleri. Trenle 1,5 saat ve 20 THB." },
          { ad: "Phi Phi adaları tekne turu", ucret: 1800, sure: "Tam gün", not: "Maya Bay + şnorkel + öğle yemeği dahil. Hız teknesi yerine büyük tekneyi seç, daha konforlu." },
          { ad: "James Bond Adası + Phang Nga", ucret: 1600, sure: "Tam gün", not: "Kano ile mağara geçişleri dahil." },
          { ad: "Büyük Buda + Karon manzara noktası", ucret: 0, sure: "Yarım gün", not: "Ücretsiz. Scooter ile çıkılır." },
          { ad: "Bangkok–Phuket iç hat uçuş", ucret: 2200, sure: "1 sa 25 dk", not: "Günde 30'dan fazla sefer; erken alırsan 1200 THB." },
        ],
        plan: [
          { gun: 1, baslik: "Bangkok: tapınaklar", duraklar: ["Büyük Saray (08:30)", "Wat Pho", "Tekne ile Wat Arun", "Akşam: Chao Phraya nehir turu"], ipucu: "Tapınak çevresinde 'bugün kapalı, size özel tur' diyen herkes dolandırıcıdır." },
          { gun: 2, baslik: "Bangkok: şehir", duraklar: ["Chatuchak pazarı (hafta sonuysa)", "Jim Thompson Evi", "Siam alışveriş bölgesi", "Akşam: çatı barı / Asiatique"], ipucu: "Hafta içiyse Chatuchak yerine Or Tor Kor gıda pazarına git." },
          { gun: 3, baslik: "Ayutthaya", duraklar: ["Wat Mahathat (ağaçtaki Buda başı)", "Wat Chaiwatthanaram", "Bisikletle harabeler", "Akşam Bangkok'a dönüş"], ipucu: "Harabeler arası bisiklet 50 THB/gün; sıcakta yürümek imkânsız." },
          { gun: 4, baslik: "Phuket'e geçiş", duraklar: ["Sabah uçuş", "Otele yerleşme", "Kata veya Karon sahili", "Akşam: Phuket Eski Şehir"], ipucu: "Patong gürültülü; sakin bir tatil istiyorsan Kata, Karon veya Nai Harn'da kal." },
          { gun: 5, baslik: "Phi Phi adaları", duraklar: ["Maya Bay", "Pileh Lagünü", "Maymun Plajı", "Bamboo Island'da şnorkel"], ipucu: "Maya Bay'de yüzmek yasak, sadece karaya çıkılıyor; deniz tutması için önceden ilaç al." },
          { gun: 6, baslik: "Phang Nga & kara turu", duraklar: ["James Bond Adası", "Kano ile mağaralar", "Büyük Buda", "Promthep Burnu'nda gün batımı"], ipucu: "Scooter kiralarken uluslararası ehliyet şart; polis kontrolü sık." },
          { gun: 7, baslik: "Serbest gün & dönüş", duraklar: ["Tay masajı", "Son alışveriş", "Havalimanı"], ipucu: "Uzun uçuş öncesi 1 saatlik Tay masajı (300 THB) seyahatin en iyi 300 bahtı." },
        ],
        ipuclari: [
          "Vizesiz 30 güne kadar kalış; dönüş bileti ve otel rezervasyonu sorulabilir.",
          "Taksilerde taksimetre açtır ('meter please'); açmıyorsa Grab uygulamasını kullan.",
          "Sokak yemeği güvenli ve en lezzetlisi — kalabalık tezgâhı seç, devir hızlı demektir.",
          "Dengue sivrisineği gündüz ısırıyor; repellent akşam değil sabah da sürülmeli.",
        ],
      },
    ],
  },
];

export const ulke = (id) => ULKELER.find((u) => u.id === id) || null;
export const sehir = (ulkeId, sehirId) => {
  const u = ulke(ulkeId);
  return u ? u.sehirler.find((s) => s.id === sehirId) || null : null;
};

// Konaklama seviyeleri — ekranda seçilebilir.
export const KONAKLAMA_SEVIYELERI = [
  { id: "ekonomik", ad: "Ekonomik", ikon: "🛏️", not: "Hostel özel oda, 2–3 yıldız otel, merkez dışı" },
  { id: "orta", ad: "Orta", ikon: "🏨", not: "3–4 yıldız, merkeze yürüme mesafesi" },
  { id: "konfor", ad: "Konfor", ikon: "✨", not: "4–5 yıldız, merkezî konum" },
];
