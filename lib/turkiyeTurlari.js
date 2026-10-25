// Türkiye bölgesel tur rotaları.
//
// Her rota birden fazla ili gün gün bağlar: hangi gün hangi şehirde, neler
// gezilir, nerede kalınır, o gün kaç km yol yapılır. Yedi coğrafi bölgenin
// hepsi en az bir rotayla kapsanır; Ege, Akdeniz ve Karadeniz iki rotaya
// bölündü çünkü tek rotaya sığmıyorlar.
//
// Bütçe tahmini kişi başı günlük harcama (konaklama payı + yemek + girişler)
// ve araçla gidiliyorsa yakıt üzerinden hesaplanır. Bölgeler arası fiyat
// farkı "fiyatCarpani" ile yansıtılır: Ege kıyısı ve İstanbul pahalı, Doğu ve
// Güneydoğu belirgin ucuz.

import { ilBul } from "./turkiye";

export const TUR_SEGMENTLERI = [
  { id: "ekonomi", ad: "Ekonomi", ikon: "🎒", kisiGun: 2000, not: "Pansiyon, butik otel, esnaf lokantası" },
  { id: "konfor", ad: "Konfor", ikon: "🏨", kisiGun: 3600, not: "3–4 yıldız otel, iyi restoranlar" },
  { id: "luks", ad: "Lüks", ikon: "✨", kisiGun: 7500, not: "Butik/5 yıldız, seçkin restoranlar" },
];

export const YAKIT_VARSAYILAN = { tuketim: 7, litre: 58 }; // L/100km, ₺/L — düzenlenebilir

const g = (gun, il, baslik, duraklar, konaklama, km = 0) => ({ gun, il, baslik, duraklar, konaklama, km });

export const TURLAR = [
  {
    id: "marmara", ad: "Marmara Klasikleri", alt: "İstanbul · Edirne · Gelibolu · Truva",
    bolgeler: ["marmara"], renk: "#3b82f6", ikon: "🌉", fiyatCarpani: 1.3,
    enIyiZaman: "Nisan–Haziran, Eylül–Ekim", ulasim: "İstanbul'da toplu taşıma; sonrası araçla",
    ozet: "İki imparatorluğun başkenti, Sinan'ın ustalık eseri ve Çanakkale'nin destanı. Türkiye'yi ilk kez gezecek biri için en doğru başlangıç.",
    gunler: [
      g(1, "istanbul", "Tarihi Yarımada", ["Ayasofya", "Sultanahmet Camii", "Yerebatan Sarnıcı", "Kapalıçarşı", "Akşam: Süleymaniye'de gün batımı"], "İstanbul"),
      g(2, "istanbul", "Boğaz ve Beyoğlu", ["Dolmabahçe Sarayı", "Şehir Hatları Boğaz turu", "Galata Kulesi", "Karaköy'de akşam yemeği"], "İstanbul"),
      g(3, "edirne", "Selimiye'nin şehri", ["Selimiye Camii", "Eski Cami & Üç Şerefeli", "Ali Paşa Çarşısı", "Meriç Köprüsü'nde gün batımı", "Tava ciğer"], "Edirne", 240),
      g(4, "canakkale", "Gelibolu Yarımadası", ["Kabatepe Tanıtım Merkezi", "Conkbayırı & 57. Alay", "Şehitler Abidesi", "Eceabat'tan feribotla Çanakkale"], "Çanakkale", 230),
      g(5, "canakkale", "Truva ve dönüş", ["Truva Antik Kenti", "Troya Müzesi", "Kordon'da öğle yemeği", "İstanbul'a dönüş"], "—", 320),
    ],
    ipuclari: [
      "Gelibolu'yu rehberle gezmek çok daha anlamlı; Eceabat'ta yarım günlük turlar var.",
      "Edirne'ye Haziran sonunda gidersen Kırkpınar güreşlerine denk gelebilirsin; oteller dolar.",
      "Çanakkale Köprüsü ücretli; feribot hem ucuz hem keyifli bir alternatif.",
    ],
  },
  {
    id: "kuzeyege", ad: "Kuzey Ege & Kaz Dağları", alt: "Bozcaada · Assos · Ayvalık · Bergama · İzmir",
    bolgeler: ["marmara", "ege"], renk: "#0ea5e9", ikon: "🫒", fiyatCarpani: 1.15,
    enIyiZaman: "Mayıs–Haziran, Eylül–Ekim", ulasim: "Araçla önerilir",
    ozet: "Zeytinlikler, taş köyler, ada şarapları ve Bergama'nın dik tiyatrosu. Güney Ege'den daha sakin ve daha otantik.",
    gunler: [
      g(1, "canakkale", "Bozcaada", ["Geyikli'den feribot", "Bozcaada Kalesi", "Bağ evlerinde tadım", "Polente Feneri'nde gün batımı"], "Bozcaada"),
      g(2, "canakkale", "Assos", ["Feribotla dönüş", "Behramkale & Athena Tapınağı", "Assos iskelesi", "Kadırga koyunda yüzme"], "Assos", 90),
      g(3, "balikesir", "Kaz Dağları → Ayvalık", ["Adatepe köyü & zeytinyağı müzesi", "Zeytinli köyü", "Ayvalık'a varış", "Şeytan Sofrası'nda gün batımı"], "Ayvalık", 120),
      g(4, "balikesir", "Cunda & Ayvalık", ["Taksiyarhis Anıt Müzesi", "Ayvalık çarşısı", "Cunda sokakları", "Adalar tekne turu"], "Ayvalık"),
      g(5, "izmir", "Bergama → İzmir", ["Bergama Akropolü (teleferik)", "Asklepion", "Kızıl Avlu", "İzmir Kordon'da akşam"], "İzmir", 160),
    ],
    ipuclari: [
      "Bozcaada feribotu yaz hafta sonlarında dolar; araçla geçeceksen sırayı erken al.",
      "Ayvalık tostunu Cunda'da değil Ayvalık çarşısında ye.",
      "Bergama'da Akropol ve Asklepion ayrı yerlerde; ikisi arasında araçla 10 dakika.",
    ],
  },
  {
    id: "guneyege", ad: "Güney Ege Antik Rota", alt: "İzmir · Efes · Şirince · Pamukkale · Bodrum",
    bolgeler: ["ege"], renk: "#06b6d4", ikon: "🏛️", fiyatCarpani: 1.25,
    enIyiZaman: "Nisan–Haziran, Eylül–Ekim", ulasim: "Araçla önerilir",
    ozet: "Efes'in mermer caddeleri, Pamukkale'nin beyaz travertenleri ve Bodrum'un mavisi. Antik çağın en yoğun koridoru.",
    gunler: [
      g(1, "izmir", "İzmir", ["Kemeraltı Çarşısı", "Kızlarağası Hanı", "Tarihi Asansör", "Kordon'da gün batımı", "Boyoz ve gevrek"], "İzmir"),
      g(2, "izmir", "Alaçatı & Çeşme", ["Alaçatı taş sokaklar", "Çeşme Kalesi", "Ilıca plajı", "İzmir'e dönüş"], "İzmir", 160),
      g(3, "izmir", "Efes & Şirince", ["Efes Antik Kenti (sabah erken)", "Yamaç Evler", "Meryem Ana Evi", "Şirince'de şarap tadımı"], "Selçuk", 80),
      g(4, "denizli", "Afrodisias → Pamukkale", ["Afrodisias", "Pamukkale travertenleri", "Hierapolis", "Travertenlerde gün batımı"], "Pamukkale", 190),
      g(5, "mugla", "Pamukkale → Bodrum", ["Antik Havuz'da sabah yüzme", "Bodrum'a yolculuk", "Bodrum Kalesi", "Sualtı Arkeoloji Müzesi"], "Bodrum", 260),
      g(6, "mugla", "Bodrum Yarımadası", ["Yalıkavak", "Gümüşlük'te gün batımı", "Tekne turu"], "Bodrum"),
    ],
    ipuclari: [
      "Efes'e 08:00'de gir; 10:00'dan sonra kruvaziyer grupları ve sıcak birlikte gelir.",
      "Pamukkale'de travertenlere çıplak ayakla çıkılır; sırt çantasına havlu koy.",
      "Müzekart bu rotadaki ören yerlerinin çoğunu kapsar ve kendini çabuk amorti eder.",
    ],
  },
  {
    id: "likya", ad: "Likya & Turkuaz Kıyı", alt: "Fethiye · Ölüdeniz · Kaş · Kekova · Olympos · Antalya",
    bolgeler: ["ege", "akdeniz"], renk: "#14b8a6", ikon: "⛵", fiyatCarpani: 1.2,
    enIyiZaman: "Mayıs–Haziran, Eylül–Ekim", ulasim: "Araçla önerilir; kıyı yolu virajlı",
    ozet: "Kaya mezarları, batık şehirler ve Akdeniz'in en güzel koyları. Likya Yolu'nun araçla gezilebilen versiyonu.",
    gunler: [
      g(1, "mugla", "Fethiye", ["Amintas Kaya Mezarları", "Kayaköy (terk edilmiş Rum köyü)", "Fethiye balık pazarı"], "Fethiye"),
      g(2, "mugla", "Ölüdeniz", ["Babadağ'dan yamaç paraşütü", "Ölüdeniz lagünü", "Kelebekler Vadisi (tekne)"], "Fethiye"),
      g(3, "antalya", "Saklıkent → Patara → Kaş", ["Saklıkent Kanyonu", "Patara antik kenti ve 18 km kumsal", "Kaputaş plajı", "Kaş'ta akşam"], "Kaş", 110),
      g(4, "antalya", "Kekova", ["Üçağız'dan tekne turu", "Batık şehir", "Kaleköy (Simena) kalesi", "Kaş'ta gün batımı"], "Kaş"),
      g(5, "antalya", "Myra → Olympos", ["Myra kaya mezarları", "Aziz Nikolaos Kilisesi (Noel Baba)", "Olympos antik kenti", "Gece Yanartaş"], "Çıralı", 130),
      g(6, "antalya", "Antalya", ["Kaleiçi & Hadrian Kapısı", "Düden Şelalesi", "Antalya Müzesi"], "Antalya", 80),
    ],
    ipuclari: [
      "Yamaç paraşütünü sabah erken uçuşlara ayarla; öğleden sonra rüzgâr sertleşir.",
      "Kekova'da batık şehrin üstünde yüzmek yasak; tekneden izlenir.",
      "Olympos'ta ağaç evlerde kalmak bu rotanın en farklı gecesidir.",
    ],
  },
  {
    id: "lezzet", ad: "Doğu Akdeniz Lezzet Rotası", alt: "Mersin · Tarsus · Adana · Hatay · Gaziantep",
    bolgeler: ["akdeniz", "guneydogu"], renk: "#f97316", ikon: "🍢", fiyatCarpani: 0.9,
    enIyiZaman: "Ekim–Mayıs (yazın çok sıcak)", ulasim: "Araçla önerilir",
    ozet: "Tantuniden künefeye, Adana kebaptan Antep baklavasına. Türkiye'nin en güçlü mutfak koridoru; aradaki kaleler ve obruklar cabası.",
    gunler: [
      g(1, "mersin", "Kızkalesi & Obruklar", ["Kızkalesi", "Cennet ve Cehennem Obrukları", "Narlıkuyu'da balık", "Akşam tantuni"], "Kızkalesi"),
      g(2, "adana", "Tarsus → Adana", ["St. Paul Kuyusu", "Kleopatra Kapısı", "Tarsus Şelalesi", "Taşköprü", "Akşam Adana kebap & şalgam"], "Adana", 150),
      g(3, "hatay", "Antakya", ["Hatay Arkeoloji Müzesi (mozaikler)", "Sen Piyer Kilisesi", "Künefe ve tepsi kebabı"], "Antakya", 200),
      g(4, "hatay", "Samandağ → Gaziantep", ["Vespasianus-Titus Tüneli", "Harbiye Şelalesi", "Gaziantep'e yolculuk"], "Gaziantep", 220),
      g(5, "gaziantep", "Gaziantep", ["Katmer kahvaltısı", "Zeugma Mozaik Müzesi", "Gaziantep Kalesi", "Bakırcılar Çarşısı", "Baklava"], "Gaziantep"),
    ],
    ipuclari: [
      "Hatay ve Gaziantep 2023 depreminden etkilendi; bazı yapılar restorasyonda olabilir. Gitmeden önce açık olanları kontrol et.",
      "Antep'te katmeri sabah ye; öğleden sonra çoğu yer kapatıyor.",
      "Bu rotada asıl bütçe yemek; kebapçılarda porsiyonlar büyük, paylaşmak mantıklı.",
    ],
  },
  {
    id: "icanadolu", ad: "İç Anadolu & Kapadokya", alt: "Ankara · Kapadokya · Ihlara · Konya",
    bolgeler: ["icanadolu"], renk: "#f59e0b", ikon: "🎈", fiyatCarpani: 1.05,
    enIyiZaman: "Nisan–Haziran, Eylül–Kasım", ulasim: "Araçla önerilir; Kapadokya'da tur da olur",
    ozet: "Cumhuriyetin başkenti, peribacalarının üstünde balonlar ve Mevlana'nın şehri. Bozkırın ortasında üç ayrı dünya.",
    gunler: [
      g(1, "ankara", "Ankara", ["Anıtkabir", "Anadolu Medeniyetleri Müzesi", "Ankara Kalesi", "Hamamönü'nde akşam"], "Ankara"),
      g(2, "nevsehir", "Kapadokya", ["Göreme Açık Hava Müzesi", "Paşabağları", "Avanos'ta çömlek atölyesi", "Uçhisar'da gün batımı"], "Göreme", 300),
      g(3, "nevsehir", "Balon & yeraltı", ["Gün doğumunda balon", "Derinkuyu Yeraltı Şehri", "Güvercinlik Vadisi yürüyüşü", "Testi kebabı"], "Göreme"),
      g(4, "aksaray", "Ihlara → Konya", ["Ihlara Vadisi yürüyüşü", "Selime Katedrali", "Sultanhanı Kervansarayı", "Konya'ya varış"], "Konya", 260),
      g(5, "konya", "Konya", ["Mevlana Müzesi", "Karatay Medresesi Çini Müzesi", "Sille", "Etli ekmek", "Dönüş"], "—"),
    ],
    ipuclari: [
      "Balon uçuşu rüzgâra bağlı iptal olabilir; seyahatin ilk günlerine koy ki telafi şansın olsun.",
      "Kapadokya'da mağara otellerinde kalmak deneyimin yarısı; erken rezervasyon şart.",
      "Aralık'ta gidiyorsan Konya'daki Şeb-i Arus törenlerinin biletini önceden al.",
    ],
  },
  {
    id: "batikaradeniz", ad: "Batı Karadeniz", alt: "Safranbolu · Amasra · Kastamonu · Sinop",
    bolgeler: ["karadeniz"], renk: "#16a34a", ikon: "🏘️", fiyatCarpani: 1.0,
    enIyiZaman: "Mayıs–Ekim", ulasim: "Araçla önerilir",
    ozet: "Safranbolu'nun Osmanlı konakları, Amasra'nın kalesi, Valla Kanyonu ve Türkiye'nin en kuzey ucu. Sakin ve yeşil bir rota.",
    gunler: [
      g(1, "karabuk", "Safranbolu", ["Safranbolu Çarşısı", "Cinci Hanı", "Hıdırlık Tepesi", "Konak otelde konaklama"], "Safranbolu"),
      g(2, "bartin", "Amasra", ["Yörük Köyü (sabah)", "Amasra'ya yolculuk", "Amasra Kalesi & Kemere Köprüsü", "Balık akşam yemeği"], "Amasra", 90),
      g(3, "kastamonu", "Kastamonu", ["Valla / Horma Kanyonu", "Kasaba Köyü Mahmut Bey Camii", "Kastamonu Kalesi", "Etli ekmek"], "Kastamonu", 230),
      g(4, "sinop", "Sinop", ["Tarihi Sinop Cezaevi", "Hamsilos Fiyordu", "İnceburun", "Sinop mantısı"], "Sinop", 175),
    ],
    ipuclari: [
      "Safranbolu'da bir gece konak otelde kalmak rotanın en özel gecesi.",
      "Amasra–Kurucaşile kıyı yolu Türkiye'nin en güzel sahil yollarından; acele etme.",
      "Horma Kanyonu'nun ahşap patikası kısa ve kolay; Valla daha zorlu.",
    ],
  },
  {
    id: "dogukaradeniz", ad: "Doğu Karadeniz Yaylaları", alt: "Trabzon · Sümela · Uzungöl · Ayder · Artvin",
    bolgeler: ["karadeniz"], renk: "#22c55e", ikon: "🌲", fiyatCarpani: 1.0,
    enIyiZaman: "Haziran–Eylül", ulasim: "Araçla önerilir; yaylalar için jeep turu",
    ozet: "Uçuruma yaslanmış Sümela, bulut denizinin üstündeki yaylalar ve çay bahçeleri. Yazın Türkiye'nin en serin rotası.",
    gunler: [
      g(1, "trabzon", "Trabzon", ["Ayasofya", "Atatürk Köşkü", "Boztepe'de çay", "Akçaabat köftesi"], "Trabzon"),
      g(2, "trabzon", "Sümela", ["Sümela Manastırı", "Hamsiköy sütlacı", "Zigana yolu"], "Trabzon", 100),
      g(3, "trabzon", "Uzungöl", ["Uzungöl çevresi", "Seyrantepe", "Göl kenarında alabalık"], "Uzungöl", 100),
      g(4, "rize", "Rize → Ayder", ["Çay bahçeleri", "Zilkale", "Fırtına Vadisi rafting", "Ayder kaplıcası"], "Ayder", 150),
      g(5, "rize", "Yaylalar", ["Pokut Yaylası", "Sal Yaylası", "Gito Yaylası (jeep turu)", "Muhlama"], "Ayder"),
      g(6, "artvin", "Artvin", ["Borçka Karagöl", "Macahel ya da Şavşat Karagöl", "Artvin'e varış"], "Artvin", 200),
    ],
    ipuclari: [
      "Yayla yolları dar ve yer yer toprak; binek araçla zorlanabilirsin, jeep turu daha güvenli.",
      "Sis öğleden sonra iner; manzara için sabah erken çık.",
      "Yağmurluk ve kat kat giyinmek şart — yazın bile yaylalar serin.",
    ],
  },
  {
    id: "doguanadolu", ad: "Doğu Anadolu Büyük Tur", alt: "Erzurum · Kars · Ani · Doğubayazıt · Van · Ahlat",
    bolgeler: ["dogu"], renk: "#8b5cf6", ikon: "🏔️", fiyatCarpani: 0.78,
    enIyiZaman: "Haziran–Eylül; kış için Aralık–Şubat (Kars & Çıldır)", ulasim: "Araçla önerilir; Ankara–Kars arası Doğu Ekspresi",
    ozet: "Ani'nin sınırdaki kiliseleri, Ağrı Dağı'nın gölgesinde İshak Paşa Sarayı ve Van Gölü'nün ortasında Akdamar. Türkiye'nin en etkileyici ve en az kalabalık rotası.",
    gunler: [
      g(1, "erzurum", "Erzurum", ["Çifte Minareli Medrese", "Yakutiye Medresesi", "Erzurum Kalesi", "Cağ kebabı"], "Erzurum"),
      g(2, "kars", "Erzurum → Kars", ["Sarıkamış ormanları", "Kars Kalesi", "Baltık mimarisi sokaklar", "Kaz eti"], "Kars", 205),
      g(3, "kars", "Ani & Çıldır", ["Ani Ören Yeri", "Çıldır Gölü", "Kars kaşarı & gravyer"], "Kars", 150),
      g(4, "agri", "Iğdır → Doğubayazıt", ["Ağrı Dağı manzarası", "Meteor Çukuru", "İshak Paşa Sarayı'nda gün batımı"], "Doğubayazıt", 240),
      g(5, "van", "Doğubayazıt → Van", ["Muradiye Şelalesi", "Van'a varış", "Van Kalesi'nde gün batımı"], "Van", 180),
      g(6, "van", "Van", ["Van kahvaltısı", "Akdamar Adası", "Hoşap Kalesi"], "Van"),
      g(7, "bitlis", "Ahlat & Nemrut Krater", ["Ahlat Selçuklu Mezarlığı", "Nemrut Krater Gölü", "Tatvan"], "Tatvan", 150),
    ],
    ipuclari: [
      "Ani sınıra yakın; kimliğini yanında taşı.",
      "Kışın gidiyorsan Doğu Ekspresi ile Kars'a varıp Çıldır'da atlı kızağa bin — rota tamamen değişir.",
      "Nemrut Krater Gölü yolu Haziran'dan önce karla kapalı olabilir.",
    ],
  },
  {
    id: "mezopotamya", ad: "Mezopotamya Rotası", alt: "Gaziantep · Halfeti · Şanlıurfa · Mardin · Diyarbakır · Nemrut",
    bolgeler: ["guneydogu"], renk: "#ef4444", ikon: "🏺", fiyatCarpani: 0.8,
    enIyiZaman: "Ekim–Kasım, Mart–Mayıs", ulasim: "Araçla önerilir",
    ozet: "Göbeklitepe'nin 12.000 yıllık taşlarından Mardin'in taş evlerine, Nemrut'un dev başlarına. İnsanlık tarihinin başladığı yer.",
    gunler: [
      g(1, "gaziantep", "Gaziantep", ["Zeugma Mozaik Müzesi", "Gaziantep Kalesi", "Bakırcılar Çarşısı", "Baklava"], "Gaziantep"),
      g(2, "sanliurfa", "Halfeti → Şanlıurfa", ["Halfeti tekne turu", "Rumkale", "Batık şehir", "Balıklıgöl'de akşam"], "Şanlıurfa", 150),
      g(3, "sanliurfa", "Göbeklitepe & Harran", ["Göbeklitepe", "Karahantepe", "Harran konik evleri", "Sıra gecesi"], "Şanlıurfa", 120),
      g(4, "mardin", "Mardin", ["Eski Mardin", "Zinciriye Medresesi", "Kasımiye Medresesi", "Deyrulzafaran Manastırı"], "Mardin", 185),
      g(5, "mardin", "Midyat & Hasankeyf", ["Midyat konakları", "Mor Gabriel Manastırı", "Hasankeyf Kültür Parkı"], "Mardin", 150),
      g(6, "diyarbakir", "Diyarbakır", ["Hasan Paşa Hanı'nda kahvaltı", "Surlar & Hevsel Bahçeleri", "Ulu Cami", "On Gözlü Köprü"], "Diyarbakır", 95),
      g(7, "adiyaman", "Nemrut Dağı", ["Cendere Köprüsü", "Arsameia", "Nemrut'ta gün batımı", "Kahta'da konaklama"], "Kahta", 250),
    ],
    ipuclari: [
      "Yazın 40°C'yi geçer; bu rota ilkbahar ve sonbaharın rotası.",
      "Nemrut'ta gün batımı da gün doğumu da muhteşem; zirvede rüzgâr serttir, mont al.",
      "Göbeklitepe'ye sabah erken git; gölgelikli ama öğlen sıcağı yorucu.",
    ],
  },
];

export const turBul = (id) => TURLAR.find((t) => t.id === id) || null;
export const turunIlleri = (tur) => [...new Set(tur.gunler.map((x) => x.il))].map(ilBul).filter(Boolean);
export const turKm = (tur) => tur.gunler.reduce((s, x) => s + (x.km || 0), 0);
export const ilinTurlari = (ilId) => TURLAR.filter((t) => t.gunler.some((x) => x.il === ilId));
