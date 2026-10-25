// İstanbul Rehberi — "bu akşam nereye?" sorusu için.
//
// Kategoriler mekân türüne göre değil DURUMA göre kuruldu, çünkü insan
// İstanbul'da "kafe arıyorum" diye değil, "sevgilimle bir yere gideceğim" ya da
// "arkadaşların doğum günü var" diye düşünür. Bir mekân birden fazla duruma
// girebilir: Mikla hem randevu hem kutlama hem manzara yeridir.
//
// Bütçe dört seviyede: 0 ücretsiz · 1 uygun · 2 orta · 3 üst · 4 lüks.
// Seçilen mekânlar köklü, yıllardır açık adresler; yine de saatler, menüler ve
// fiyatlar değişebilir — gitmeden önce kontrol etmek gerekir.
//
// Konum: her mekânın "harita" sorgusu Google Haritalar'da aranır ve sayfaya
// gömülü haritada gösterilir; API anahtarı gerektirmez.

import { IST_GORSELLERI } from "./istanbulGorselleri";

export const DURUMLAR = [
  { id: "randevu", ad: "Romantik & Randevu", kisa: "Randevu", ikon: "💞", renk: "#f472b6", aciklama: "İlk buluşmadan yıl dönümüne: manzaralı masalar, sakin köşeler, gün batımı." },
  { id: "arkadas", ad: "Arkadaşlarla", kisa: "Arkadaşlar", ikon: "🥂", renk: "#fb923c", aciklama: "Meyhane masaları, bar sokakları, sokak lezzetleri — kalabalık gruplar için." },
  { id: "kutlama", ad: "Doğum Günü & Özel Gün", kisa: "Kutlama", ikon: "🎂", renk: "#facc15", aciklama: "Şef menüleri, özel tekne, saray restoranları: unutulmayacak bir akşam." },
  { id: "yemek", ad: "Akşam Yemeği", kisa: "Yemek", ikon: "🍽️", renk: "#f87171", aciklama: "Esnaf lokantasından Michelin rehberine, kebaptan balığa." },
  { id: "kahvalti", ad: "Kahvaltı & Brunch", kisa: "Kahvaltı", ikon: "🍳", renk: "#fbbf24", aciklama: "Serpme kahvaltı, Boğaz kıyısında simit-çay, hafta sonu brunch'ı." },
  { id: "kahve", ad: "Kahve & Tatlı", kisa: "Kahve", ikon: "☕", renk: "#d6a77a", aciklama: "Üçüncü dalga kahveciler, köklü Türk kahvecileri, baklavacılar." },
  { id: "manzara", ad: "Manzara & Gün Batımı", kisa: "Manzara", ikon: "🌅", renk: "#f97316", aciklama: "Şehrin en iyi seyir noktaları — çoğu ücretsiz." },
  { id: "kesif", ad: "Keşif & Kültür", kisa: "Keşif", ikon: "🧭", renk: "#38bdf8", aciklama: "Müzeler, tarihi yapılar ve kendine has semt yürüyüşleri." },
  { id: "aile", ad: "Hafta Sonu & Doğa", kisa: "Doğa", ikon: "🌳", renk: "#4ade80", aciklama: "Korular, adalar, ormanlar; şehirden kaçmadan nefes almak." },
];

export const FIYATLAR = [
  { id: 0, ad: "Ücretsiz", simge: "Ücretsiz" },
  { id: 1, ad: "Uygun", simge: "₺" },
  { id: 2, ad: "Orta", simge: "₺₺" },
  { id: 3, ad: "Üst", simge: "₺₺₺" },
  { id: 4, ad: "Lüks", simge: "₺₺₺₺" },
];

export const ILCELER = [
  { id: "beyoglu", ad: "Beyoğlu", yaka: "avrupa" },
  { id: "besiktas", ad: "Beşiktaş", yaka: "avrupa" },
  { id: "fatih", ad: "Fatih", yaka: "avrupa" },
  { id: "sariyer", ad: "Sarıyer", yaka: "avrupa" },
  { id: "sisli", ad: "Şişli", yaka: "avrupa" },
  { id: "eyup", ad: "Eyüpsultan", yaka: "avrupa" },
  { id: "kadikoy", ad: "Kadıköy", yaka: "anadolu" },
  { id: "uskudar", ad: "Üsküdar", yaka: "anadolu" },
  { id: "beykoz", ad: "Beykoz", yaka: "anadolu" },
  { id: "adalar", ad: "Adalar", yaka: "ada" },
];

// Toplanan ilk görsel uydu fotoğrafı ya da gravür çıkabiliyor; o anahtarlarda
// daha iyi olan sıradaki görsel seçilir.
const GORSEL_SIRA = { bogaz: 1 };
const G = (k) => IST_GORSELLERI[k]?.[GORSEL_SIRA[k] || 0] || IST_GORSELLERI[k]?.[0] || null;
const parantezsiz = (s) => s.replace(/\s*\(.*?\)/g, "");

// Adı haritada tek bir noktaya karşılık gelmeyen yerler için arama sorgusu.
const HARITA = {
  tekne: "Kuruçeşme sahili, İstanbul",
  bebeksahil: "Bebek Parkı, Beşiktaş, İstanbul",
  kahvaltisokagi: "Beşiktaş Kahvaltıcılar Sokağı, İstanbul",
  nevizade: "Nevizade Sokak, Beyoğlu, İstanbul",
  asmali: "Asmalı Mescit Sokak, Beyoğlu, İstanbul",
  kadife: "Kadife Sokak, Kadıköy, İstanbul",
  sehirhatlari: "Eminönü Şehir Hatları İskelesi, İstanbul",
  balikekmek: "Eminönü balık ekmek, Galata Köprüsü, İstanbul",
  kurufasulye: "Erzincanlı Ali Baba Kuru Fasulye, Süleymaniye, İstanbul",
  kumkapi: "Kumkapı meyhaneler, Fatih, İstanbul",
  cukurcuma: "Çukurcuma, Beyoğlu, İstanbul",
  balat: "Balat, Fatih, İstanbul",
};

// [id, ad, semt, ilçe, tür, durumlar, fiyat, not, etiketler, görsel anahtarı]
const M = (id, ad, semt, ilce, tur, durumlar, fiyat, not, etiketler, gorsel) => ({
  id, ad, semt, ilce, tur, durumlar, fiyat, not, etiketler, gorsel: G(gorsel),
  yaka: ILCELER.find((i) => i.id === ilce)?.yaka || "avrupa",
  harita: HARITA[id] || `${parantezsiz(ad)}, ${parantezsiz(semt)}, İstanbul`,
});

export const MEKANLAR = [
  // ---------- Boğaz — Avrupa yakası ----------
  M("sunset", "Sunset Grill & Bar", "Ulus", "besiktas", "Restoran", ["randevu", "kutlama", "manzara", "yemek"], 4,
    "Ulus Parkı'nın tepesinde, Boğaz'ın iki köprüsünü birden gören teras. Dünya mutfağı ve suşi; İstanbul'un klasik özel gün adresi.",
    ["Boğaz manzarası", "Gün batımı", "Rezervasyon şart"], "bogaz"),
  M("tugra", "Tuğra (Çırağan Sarayı)", "Çırağan", "besiktas", "Restoran", ["kutlama", "randevu", "yemek"], 4,
    "Çırağan Sarayı'nın içinde Osmanlı saray mutfağı. Yıl dönümü ve teklif akşamları için şehrin en görkemli salonlarından.",
    ["Tarihi mekân", "Boğaz manzarası", "Rezervasyon şart"], "ciragan"),
  M("lucca", "Lucca", "Bebek", "besiktas", "Bar & Restoran", ["arkadas", "randevu"], 3,
    "Bebek'in yıllardır değişmeyen buluşma noktası. Akşamüstü kokteyl, sonrası kalabalık ve canlı bir gece.",
    ["Gece geç saate kadar", "Grup için uygun"], "bebek"),
  M("bebekkahve", "Bebek Kahve", "Bebek", "besiktas", "Kafe", ["kahve", "randevu", "manzara"], 2,
    "Boğaz'ın hemen kıyısında çay, kahve ve simit. Sahil yürüyüşünün başı ya da sonu için ideal.",
    ["Boğaz manzarası", "Açık hava"], "bebek"),
  M("mangerie", "Mangerie", "Bebek", "besiktas", "Brunch", ["kahvalti", "randevu"], 3,
    "Bebek'te bir apartmanın üst katında, Boğaz'a bakan aydınlık brunch salonu.",
    ["Boğaz manzarası", "Hafta sonu kalabalık"], "bebek"),
  M("bebeksahil", "Bebek–Arnavutköy sahil yolu", "Bebek", "besiktas", "Yürüyüş", ["randevu", "manzara"], 0,
    "Bebek'ten Arnavutköy'e yalıların önünden 2 km'lik kıyı yürüyüşü. Akşamüstü İstanbul'un en romantik 30 dakikası.",
    ["Ücretsiz", "Açık hava", "Gün batımı"], "bebek"),
  M("akinti", "Arnavutköy & Akıntı Burnu", "Arnavutköy", "besiktas", "Semt", ["randevu", "manzara", "kesif"], 0,
    "Ahşap yalılar, dar sokaklar ve akıntıya karşı balık tutanlar. Burnun ucunda gün batımı.",
    ["Ücretsiz", "Gün batımı", "Tarihi doku"], "arnavutkoy"),
  M("ortakoy", "Ortaköy Meydanı & Camii", "Ortaköy", "besiktas", "Semt", ["kesif", "manzara", "arkadas"], 0,
    "Köprünün dibindeki barok cami, sahil ve kumpir tezgâhları. Gece de canlı.",
    ["Ücretsiz", "Boğaz manzarası", "Sokak lezzeti"], "ortakoy"),
  M("tekne", "Boğaz'da özel tekne", "Kuruçeşme–Bebek", "besiktas", "Deneyim", ["kutlama", "randevu"], 4,
    "Gün batımında 2–3 saatlik özel tekne; doğum günü, evlilik teklifi ve yıl dönümü klasiği. Pasta ve yemek servisi ayarlanabiliyor.",
    ["Gün batımı", "Grup için uygun", "Rezervasyon şart"], "kurucesme"),
  M("yildiz", "Yıldız Parkı", "Yıldız", "besiktas", "Park", ["aile", "randevu"], 0,
    "Saray korusu; Malta ve Çadır köşklerinde çay. Şehrin ortasında sessiz bir orman.",
    ["Ücretsiz", "Çocuklu uygun", "Açık hava"], "yildiz"),
  M("pando", "Pando Kaymak", "Beşiktaş Çarşı", "besiktas", "Kahvaltı", ["kahvalti"], 1,
    "Asırlık aile dükkânı; bal-kaymak ve tereyağlı yumurta. Küçük ve hep kalabalık, ama hızlı akar.",
    ["Klasik", "Erken saatte git"], "besiktas"),
  M("kahvaltisokagi", "Beşiktaş Kahvaltıcılar Sokağı", "Beşiktaş Çarşı", "besiktas", "Kahvaltı", ["kahvalti", "arkadas"], 2,
    "Serpme kahvaltı salonlarının yan yana dizildiği sokak. Kalabalık arkadaş grupları için en pratik seçenek.",
    ["Grup için uygun", "Hafta sonu kalabalık"], "besiktas"),
  M("zorlu", "Zorlu PSM", "Zincirlikuyu", "besiktas", "Gösteri", ["arkadas", "kutlama"], 3,
    "Konser, müzikal ve tiyatro; büyük prodüksiyonların sahnesi. Programa göre özel bir akşamın merkezi.",
    ["Bilet gerekli", "Kapalı mekân"], "zorlu"),

  // ---------- Sarıyer ----------
  M("kiyi", "Kıyı Restaurant", "Tarabya", "sariyer", "Balık", ["yemek", "kutlama"], 4,
    "Tarabya'da onlarca yıldır balık ve meze. Boğaz'ın klasik balıkçılarının en bilinenlerinden.",
    ["Boğaz manzarası", "Rezervasyon şart"], "tarabya"),
  M("sadekahve", "Sade Kahve", "Rumelihisarı", "sariyer", "Kahvaltı", ["kahvalti", "randevu"], 2,
    "Rumeli Hisarı'nın dibinde, Boğaz kıyısında kahvaltı. Hafta sonu sabah erken git.",
    ["Boğaz manzarası", "Açık hava"], "rumelihisari"),
  M("rumelihisari", "Rumeli Hisarı", "Rumelihisarı", "sariyer", "Tarihi", ["kesif", "manzara"], 1,
    "Fatih'in 1452'de dört ayda yaptırdığı hisar; surlardan Boğaz'ın en dar noktası. Açılış saatlerini kontrol et.",
    ["Tarihi mekân", "Boğaz manzarası"], "rumelihisari"),
  M("emirgan", "Emirgan Korusu & köşkleri", "Emirgan", "sariyer", "Park", ["aile", "randevu", "kahvalti"], 1,
    "Nisan'da Lale Festivali; Beyaz, Sarı ve Pembe köşklerde çay ve kahvaltı.",
    ["Çocuklu uygun", "Açık hava", "Nisan'da lale"], "emirgan"),
  M("sutis", "Emirgan Sütiş", "Emirgan", "sariyer", "Kahvaltı", ["kahvalti", "aile"], 2,
    "Boğaz kıyısında serpme kahvaltı ve sütlü tatlılar. Aileyle pazar sabahı klasiği.",
    ["Boğaz manzarası", "Çocuklu uygun"], "emirgan"),
  M("sabanci", "Sakıp Sabancı Müzesi", "Emirgan", "sariyer", "Müze", ["kesif", "randevu"], 2,
    "Atlı Köşk'te hat sanatı ve büyük uluslararası sergiler; bahçesi Boğaz'a iniyor.",
    ["Bahçe", "Sergi programına bak"], "sabanci"),
  M("belgrad", "Belgrad Ormanı", "Bahçeköy", "sariyer", "Doğa", ["aile"], 0,
    "Osmanlı bentleri arasında 6 km'lik yürüyüş-koşu parkuru. Şehrin akciğeri.",
    ["Ücretsiz", "Çocuklu uygun", "Spor"], "belgrad"),

  // ---------- Beyoğlu ----------
  M("mikla", "Mikla", "Asmalımescit (The Marmara Pera çatısı)", "beyoglu", "Fine Dining", ["kutlama", "randevu", "yemek", "manzara"], 4,
    "Şef Mehmet Gürs'ün Yeni Anadolu mutfağı. Çatıdan Haliç ve Tarihi Yarımada; Michelin rehberindeki adreslerden.",
    ["Michelin rehberi", "Tadım menüsü", "Rezervasyon şart"], "istiklal"),
  M("neolokal", "Neolokal", "Karaköy (SALT Galata)", "beyoglu", "Fine Dining", ["kutlama", "yemek", "randevu"], 4,
    "Şef Maksut Aşkar; Anadolu'nun unutulmaya yüz tutmuş tariflerinden tadım menüsü. Michelin rehberindeki adreslerden.",
    ["Michelin rehberi", "Tadım menüsü", "Rezervasyon şart"], "karakoy"),
  M("360", "360 İstanbul", "İstiklal", "beyoglu", "Restoran & Bar", ["kutlama", "arkadas", "manzara"], 3,
    "Mısır Apartmanı'nın çatısında 360 derece şehir manzarası. Akşam yemeğinden sonra bara dönüşüyor.",
    ["Çatı", "Gece geç saate kadar"], "istiklal"),
  M("karakoylokantasi", "Karaköy Lokantası", "Karaköy", "beyoglu", "Lokanta & Meyhane", ["yemek", "arkadas", "kutlama"], 3,
    "Turkuaz çinili salonda öğlen esnaf lokantası, akşam meyhane. Karaköy'ün en sevilen sofralarından.",
    ["Akşam rezervasyon", "Meze"], "karakoy"),
  M("gulluoglu", "Karaköy Güllüoğlu", "Karaköy", "beyoglu", "Baklavacı", ["kahve", "arkadas"], 2,
    "1949'dan beri baklava; fıstıklı sarma ve kaymaklı. Ayakta yemek de geleneğin parçası.",
    ["Klasik", "Paket servis"], "karakoy"),
  M("galataport", "Galataport sahili", "Tophane", "beyoglu", "Sahil & Alışveriş", ["arkadas", "randevu"], 2,
    "Karaköy–Tophane arasında denize açılan yeni yürüyüş aksı; restoranlar, kafeler ve müze.",
    ["Açık hava", "Deniz kenarı"], "galataport"),
  M("istmodern", "İstanbul Modern", "Galataport", "beyoglu", "Müze", ["kesif", "randevu"], 2,
    "Renzo Piano tasarımı binada modern ve çağdaş sanat; kafesi denize bakıyor.",
    ["Sanat", "Kafe"], "istmodern"),
  M("salt", "SALT Galata", "Karaköy", "beyoglu", "Kültür Merkezi", ["kesif"], 0,
    "Eski Osmanlı Bankası binası; ücretsiz sergiler ve araştırma kütüphanesi.",
    ["Ücretsiz", "Sanat"], "karakoy"),
  M("galatakulesi", "Galata Kulesi", "Galata", "beyoglu", "Tarihi", ["kesif", "manzara"], 2,
    "Müze olarak düzenlendi; tepeden tüm şehir. Gün batımında kuyruk uzun — sabah erken git.",
    ["Manzara", "Kuyruk olabilir"], "galata"),
  M("pera", "Pera Müzesi", "Tepebaşı", "beyoglu", "Müze", ["kesif"], 2,
    "Osman Hamdi Bey'in 'Kaplumbağa Terbiyecisi' burada; oryantalist resim koleksiyonu.",
    ["Sanat"], "pera"),
  M("masumiyet", "Masumiyet Müzesi", "Çukurcuma", "beyoglu", "Müze", ["kesif", "randevu"], 2,
    "Orhan Pamuk'un romanıyla birlikte kurulan, İstanbul'un en kişisel müzelerinden.",
    ["Edebiyat", "Küçük ve sakin"], "cihangir"),
  M("cukurcuma", "Çukurcuma antikacıları", "Çukurcuma", "beyoglu", "Semt", ["kesif"], 0,
    "Yokuş sokaklarda antikacılar, eski plaklar ve vintage dükkânlar.",
    ["Ücretsiz", "Alışveriş"], "cihangir"),
  M("kronotrop", "Kronotrop", "Cihangir", "beyoglu", "Kahve", ["kahve"], 2,
    "İstanbul'un üçüncü dalga kahve öncülerinden; kendi kavurdukları çekirdekler.",
    ["Kendi kavurur"], "cihangir"),
  M("vankahvalti", "Van Kahvaltı Evi", "Cihangir", "beyoglu", "Kahvaltı", ["kahvalti", "arkadas"], 2,
    "Otlu peynir, murtuğa ve kavutla Van kahvaltısı. Hafta sonu sıra beklemeye değer.",
    ["Hafta sonu kalabalık", "Yöresel"], "cihangir"),
  M("mandabatmaz", "Mandabatmaz", "İstiklal ara sokağı", "beyoglu", "Türk Kahvesi", ["kahve"], 1,
    "İstiklal'in arka sokağında köpüklü Türk kahvesi efsanesi; birkaç tabure ve sokak.",
    ["Klasik", "Küçük"], "istiklal"),
  M("nevizade", "Nevizade Sokağı meyhaneleri", "Balık Pazarı", "beyoglu", "Meyhane", ["arkadas", "kutlama"], 2,
    "Balık Pazarı'nın arkasında meyhane sokağı; masalar sokağa taşar, akşam ilerledikçe şarkılar başlar.",
    ["Grup için uygun", "Canlı atmosfer"], "istiklal"),
  M("asmali", "Asmalımescit", "Tünel", "beyoglu", "Meyhane & Bar", ["arkadas"], 2,
    "Meyhaneler, barlar ve Pera'nın gece hayatı tek sokakta.",
    ["Gece geç saate kadar", "Grup için uygun"], "istiklal"),
  M("hamam", "Kılıç Ali Paşa Hamamı", "Tophane", "beyoglu", "Hamam", ["kutlama", "randevu", "kesif"], 4,
    "Mimar Sinan'ın titizlikle restore edilmiş hamamı. Özel bir gün için farklı bir hediye.",
    ["Tarihi mekân", "Rezervasyon şart"], "karakoy"),
  M("koc", "Rahmi M. Koç Müzesi", "Hasköy", "beyoglu", "Müze", ["kesif", "aile"], 2,
    "Denizaltından vapura, tramvaydan uçağa sanayi ve ulaşım müzesi. Çocuklarla gezilecek en iyi müzelerden.",
    ["Çocuklu uygun", "Haliç kıyısı"], "koc"),
  M("miniaturk", "Miniatürk", "Sütlüce", "beyoglu", "Park", ["aile"], 1,
    "Türkiye'nin yapılarının minyatürleri; çocuklar için açık hava gezisi.",
    ["Çocuklu uygun", "Açık hava"], "miniaturk"),

  // ---------- Şişli ----------
  M("turk", "TURK Fatih Tutak", "Bomonti", "sisli", "Fine Dining", ["kutlama", "yemek"], 4,
    "Şef Fatih Tutak'ın tadım menüsü; İstanbul'da Michelin rehberinin en üst sıralarındaki adreslerden.",
    ["Michelin rehberi", "Tadım menüsü", "Rezervasyon şart"], "bomonti"),
  M("hunkar", "Hünkar Lokantası", "Nişantaşı", "sisli", "Lokanta", ["yemek"], 3,
    "1950'den beri ev yemeği klasikleri; hünkar beğendi ve zeytinyağlılar.",
    ["Klasik", "Öğle yemeği"], "nisantasi"),
  M("petra", "Petra Roasting Co.", "Gayrettepe", "sisli", "Kahve", ["kahve"], 2,
    "Kendi kavurduğu çekirdekler; geniş, sakin ve çalışmaya uygun.",
    ["Çalışmaya uygun", "Kendi kavurur"], "nisantasi"),
  M("ferikoy", "Feriköy Antika Pazarı", "Bomonti", "sisli", "Pazar", ["kesif"], 0,
    "Pazar günleri antika, plak ve eski eşya pazarı. Cumartesi organik pazar.",
    ["Ücretsiz", "Yalnızca hafta sonu"], "bomonti"),

  // ---------- Fatih / Tarihi Yarımada ----------
  M("ayasofya", "Ayasofya", "Sultanahmet", "fatih", "Tarihi", ["kesif"], 0,
    "1.500 yıllık kubbe. Namaz vakitlerinde ziyaret kısıtlanır; sabah erken git.",
    ["Tarihi mekân", "Kıyafet kuralı"], "ayasofya"),
  M("yerebatan", "Yerebatan Sarnıcı", "Sultanahmet", "fatih", "Tarihi", ["kesif", "randevu"], 2,
    "336 sütunlu Bizans sarnıcı ve Medusa başları; akşam seansları daha sakin.",
    ["Tarihi mekân", "Kuyruk olabilir"], "yerebatan"),
  M("suleymaniye", "Süleymaniye Camii", "Süleymaniye", "fatih", "Tarihi", ["kesif", "manzara"], 0,
    "Mimar Sinan'ın kalfalık eseri; arka avludan Haliç ve Boğaz.",
    ["Ücretsiz", "Manzara"], "suleymaniye"),
  M("kurufasulye", "Süleymaniye kuru fasulyecileri", "Süleymaniye", "fatih", "Esnaf Lokantası", ["yemek", "arkadas"], 1,
    "Caminin hemen yanında, 1920'lerden beri aynı sokakta kuru fasulye-pilav geleneği.",
    ["Uygun", "Öğle yemeği"], "suleymaniye"),
  M("hamdi", "Hamdi Restaurant", "Eminönü", "fatih", "Kebap", ["yemek", "kutlama"], 3,
    "Fıstıklı kebap ve lahmacun; üst kat terasından Haliç ve Galata.",
    ["Manzara", "Akşam rezervasyon"], "eminonu"),
  M("pandeli", "Pandeli", "Mısır Çarşısı", "fatih", "Restoran", ["yemek", "kesif"], 3,
    "1901'den beri Mısır Çarşısı'nın üstünde; turkuaz çinili salonlarda Osmanlı-Rum mutfağı.",
    ["Tarihi mekân", "Öğle yemeği"], "misircarsisi"),
  M("kurukahveci", "Kurukahveci Mehmet Efendi", "Eminönü", "fatih", "Kahve", ["kahve", "kesif"], 1,
    "1871'den beri; dükkânın önündeki kuyruk ve sokağa yayılan kahve kokusu.",
    ["Klasik", "Paket kahve"], "misircarsisi"),
  M("hafizmustafa", "Hafız Mustafa 1864", "Sirkeci", "fatih", "Tatlıcı", ["kahve", "arkadas"], 2,
    "Lokum, baklava ve şekerleme; 1864'ten beri.",
    ["Klasik", "Hediyelik"], "eminonu"),
  M("misircarsisi", "Mısır Çarşısı", "Eminönü", "fatih", "Çarşı", ["kesif"], 0,
    "Baharat, lokum ve kuruyemiş; çevresindeki sokaklar çarşının kendisi kadar ilginç.",
    ["Ücretsiz", "Alışveriş"], "misircarsisi"),
  M("balikekmek", "Eminönü balık ekmek", "Eminönü", "fatih", "Sokak Lezzeti", ["arkadas", "kesif"], 1,
    "Galata Köprüsü'nün dibinde, sallanan teknelerden balık ekmek ve turşu suyu.",
    ["Uygun", "Sokak lezzeti"], "galatakoprusu"),
  M("sehirhatlari", "Şehir Hatları Boğaz Turu", "Eminönü", "fatih", "Vapur", ["kesif", "aile", "randevu"], 1,
    "Kısa Boğaz turu ya da Anadolu Kavağı'na tam tur. Boğaz'ı görmenin en ucuz ve en güzel yolu.",
    ["Uygun", "Boğaz manzarası"], "bogaz"),
  M("kumkapi", "Kumkapı meyhaneleri", "Kumkapı", "fatih", "Meyhane", ["arkadas", "yemek", "kutlama"], 2,
    "Fasıl eşliğinde balık ve meze; kalabalık masalar ve geç saatler.",
    ["Canlı müzik", "Grup için uygun"], "kumkapi"),
  M("develi", "Develi", "Samatya", "fatih", "Kebap", ["yemek", "kutlama"], 3,
    "1912'den beri Antep usulü kebap; çiğ köfte ve fıstıklı kebap. Kalabalık aile kutlamaları için.",
    ["Klasik", "Grup için uygun"], "kumkapi"),
  M("balat", "Balat & Fener sokakları", "Balat", "fatih", "Semt", ["kesif", "randevu", "kahve"], 0,
    "Renkli evler, antikacılar, Fener Rum Lisesi ve Demir Kilise. Şehrin en fotojenik yürüyüşü.",
    ["Ücretsiz", "Fotoğraf"], "balat"),
  M("coffeedepartment", "Coffee Department", "Balat", "fatih", "Kahve", ["kahve"], 2,
    "Balat yürüyüşünün ortasında üçüncü dalga kahve molası.",
    ["Kendi kavurur"], "balat"),
  M("kariye", "Kariye Camii (Khora)", "Edirnekapı", "fatih", "Tarihi", ["kesif"], 2,
    "Dünyanın en iyi korunmuş Bizans mozaik ve freskolarından; restorasyon sonrası yeniden açıldı.",
    ["Tarihi mekân", "Kıyafet kuralı"], "kariye"),
  M("asitane", "Asitane", "Edirnekapı", "fatih", "Restoran", ["yemek", "kutlama"], 3,
    "Osmanlı saray mutfağı tariflerini arşivden çıkarıp yeniden yorumlayan restoran; Kariye'nin hemen yanında.",
    ["Tarihi tarifler", "Rezervasyon önerilir"], "kariye"),

  // ---------- Eyüpsultan ----------
  M("pierreloti", "Pierre Loti Tepesi", "Eyüp", "eyup", "Manzara & Kafe", ["manzara", "randevu", "kahve"], 1,
    "Teleferikle çıkılan tepe; Haliç'e bakan efsane kahvehane. Gün batımında en güzel hali.",
    ["Gün batımı", "Teleferik"], "eyup"),

  // ---------- Kadıköy ----------
  M("ciya", "Çiya Sofrası", "Kadıköy Çarşı", "kadikoy", "Lokanta", ["yemek", "arkadas"], 2,
    "Musa Dağdeviren'in Anadolu mutfağı; mevsime göre değişen, başka yerde bulamayacağın yemekler.",
    ["Yöresel", "Vejetaryen dostu"], "kadikoy"),
  M("kadikoycarsi", "Kadıköy Çarşı", "Kadıköy", "kadikoy", "Çarşı", ["arkadas", "kesif", "kahve"], 1,
    "Turşucusu, şarküterisi, balıkçısıyla İstanbul'un en canlı çarşısı; ayakta meze turu yapılır.",
    ["Uygun", "Sokak lezzeti"], "kadikoy"),
  M("kadife", "Kadife Sokak (Barlar Sokağı)", "Moda", "kadikoy", "Bar", ["arkadas"], 2,
    "Kadıköy gece hayatının merkezi; uygun fiyatlı barlar yan yana.",
    ["Gece geç saate kadar", "Grup için uygun"], "moda"),
  M("moda", "Moda Sahili & Moda Burnu", "Moda", "kadikoy", "Manzara", ["randevu", "manzara", "arkadas"], 0,
    "Çimenlerde oturup gün batımında Tarihi Yarımada silüetine bakmak. Kadıköy'ün en sevilen ritüeli.",
    ["Ücretsiz", "Gün batımı", "Açık hava"], "moda"),
  M("fazilbey", "Fazıl Bey'in Türk Kahvesi", "Kadıköy Çarşı", "kadikoy", "Türk Kahvesi", ["kahve"], 1,
    "Kadıköy'de 1920'lerden beri Türk kahvesi; çarşı turunun durağı.",
    ["Klasik", "Paket kahve"], "kadikoy"),
  M("yeldegirmeni", "Yeldeğirmeni", "Yeldeğirmeni", "kadikoy", "Semt", ["kesif", "kahve"], 0,
    "Duvar resimleri, küçük kafeler ve kahve kavurucuları; Kadıköy'ün sakin yüzü.",
    ["Ücretsiz", "Sokak sanatı"], "kadikoy"),

  // ---------- Üsküdar ----------
  M("kuzguncuk", "Kuzguncuk", "Kuzguncuk", "uskudar", "Semt", ["kesif", "randevu", "kahvalti"], 0,
    "Cami, kilise ve sinagogun yan yana durduğu ahşap evli Boğaz köyü. Sakin bir pazar yürüyüşü.",
    ["Ücretsiz", "Fotoğraf"], "kuzguncuk"),
  M("cinaralti", "Çengelköy Çınaraltı", "Çengelköy", "uskudar", "Kafe", ["kahvalti", "kahve", "manzara"], 1,
    "Asırlık çınarın altında Boğaz kıyısında çay ve simit. Uygun fiyatlı Boğaz keyfi.",
    ["Uygun", "Boğaz manzarası"], "cengelkoy"),
  M("kizkulesi", "Kız Kulesi", "Salacak", "uskudar", "Tarihi", ["kesif", "randevu", "manzara"], 2,
    "Restorasyondan sonra müze olarak açıldı; Salacak ya da Karaköy'den tekneyle geçiliyor.",
    ["Tekne ile", "Manzara"], "kizkulesi"),
  M("salacak", "Salacak sahili", "Salacak", "uskudar", "Manzara", ["randevu", "manzara"], 0,
    "Kız Kulesi önünde, güneşin Tarihi Yarımada'nın arkasında battığı sahil. Çay ocağından çay al, otur.",
    ["Ücretsiz", "Gün batımı"], "kizkulesi"),
  M("camlica", "Çamlıca Tepesi", "Çamlıca", "uskudar", "Manzara", ["manzara", "aile"], 0,
    "Şehrin en yüksek seyir noktalarından; iki köprü, iki yaka.",
    ["Ücretsiz", "Manzara"], "camlica"),
  M("beylerbeyi", "Beylerbeyi Sarayı", "Beylerbeyi", "uskudar", "Tarihi", ["kesif"], 2,
    "Boğaz kıyısında yazlık saray; Dolmabahçe'den sakin ve daha samimi.",
    ["Tarihi mekân"], "beylerbeyi"),

  // ---------- Beykoz ----------
  M("lacivert", "Lacivert", "Anadoluhisarı", "beykoz", "Restoran", ["randevu", "kutlama", "yemek"], 4,
    "Göksu deresinin Boğaz'a döküldüğü yerde, suyun hemen üstünde. Avrupa yakasından restoranın teknesiyle de gidilebiliyor.",
    ["Boğaz manzarası", "Rezervasyon şart", "Tekne ile"], "anadoluhisari"),
  M("polonezkoy", "Polonezköy", "Polonezköy", "beykoz", "Doğa & Kahvaltı", ["aile", "kahvalti"], 2,
    "Lehlerin kurduğu köy; tabiat parkında yürüyüş ve köy kahvaltısı.",
    ["Çocuklu uygun", "Doğa"], "polonezkoy"),

  // ---------- Adalar ----------
  M("buyukada", "Büyükada", "Büyükada", "adalar", "Ada", ["aile", "randevu", "kesif"], 1,
    "Araçsız ada; bisiklet, köşkler ve Aya Yorgi tepesi. Kabataş ya da Bostancı'dan vapur.",
    ["Vapur ile", "Tam gün"], "buyukada"),
];

// Hazır akşam ve gün planları — tek tek mekân seçmek istemeyenler için.
// Adım biçimi: [saat, mekânId (ya da null), açıklama]
export const PLANLAR = [
  {
    id: "bogazrandevu", ad: "Klasik Boğaz Randevusu", durum: "randevu", fiyat: 4, sure: "Akşam · 5 saat", ikon: "🌉",
    ozet: "Yalıların önünde yürüyüş, burunda gün batımı ve Boğaz'a hâkim bir masa.",
    adimlar: [
      ["18:00", "bebeksahil", "Bebek'ten Arnavutköy'e kıyı yürüyüşü."],
      ["19:00", "akinti", "Akıntı Burnu'nda gün batımı."],
      ["20:30", "sunset", "Ulus'ta akşam yemeği — rezervasyonu önceden yap."],
      ["23:00", "bebekkahve", "Bebek'te Boğaz kıyısında son çay."],
    ],
  },
  {
    id: "butcerandevu", ad: "Bütçe Dostu Randevu", durum: "randevu", fiyat: 1, sure: "Akşam · 5 saat", ikon: "💸",
    ozet: "Az parayla çok güzel bir akşam: Anadolu yakasının sakin köşeleri.",
    adimlar: [
      ["17:00", "kuzguncuk", "Kuzguncuk'un ahşap evleri arasında yürüyüş."],
      ["18:30", "salacak", "Salacak'ta Kız Kulesi önünde gün batımı ve çay."],
      ["20:00", "kadikoycarsi", "Kadıköy Çarşı'da ayakta meze turu."],
      ["21:30", "moda", "Moda Burnu'nda akşam yürüyüşü."],
    ],
  },
  {
    id: "kadikoyarkadas", ad: "Kadıköy Arkadaş Gecesi", durum: "arkadas", fiyat: 2, sure: "Akşam · 6 saat", ikon: "🎉",
    ozet: "Çarşıda başlayıp barlar sokağında biten, kalabalık gruplar için klasik rota.",
    adimlar: [
      ["17:30", "kadikoycarsi", "Turşucular ve şarküterilerde ısınma turu."],
      ["19:00", "ciya", "Çiya Sofrası'nda paylaşmalı akşam yemeği."],
      ["21:00", "moda", "Moda sahilinde mola."],
      ["22:30", "kadife", "Kadife Sokak'ta bar bar gezme."],
    ],
  },
  {
    id: "beyoglumeyhane", ad: "Beyoğlu Meyhane Akşamı", durum: "arkadas", fiyat: 2, sure: "Akşam · 6 saat", ikon: "🍷",
    ozet: "Galata'dan meyhane sokaklarına, oradan şehre tepeden bakan bir çatıya.",
    adimlar: [
      ["18:00", "galatakulesi", "Galata çevresinde gün batımı."],
      ["19:30", "nevizade", "Nevizade'de meze ve uzun bir sofra."],
      ["22:30", "360", "360 İstanbul'da gece manzarası."],
    ],
  },
  {
    id: "dogumgunu", ad: "Doğum Günü: Tekne + Fine Dining", durum: "kutlama", fiyat: 4, sure: "Akşam · 6 saat", ikon: "🎂",
    ozet: "Gün batımında özel tekne ve pasta, ardından şehre tepeden bakan bir şef menüsü.",
    adimlar: [
      ["18:00", "tekne", "Boğaz'da özel tekne — pastayı teknede kes."],
      ["20:30", "mikla", "Mikla'da tadım menüsü; doğum günü olduğunu rezervasyonda belirt."],
      ["23:30", "360", "Gecenin devamı İstiklal'de bir çatıda."],
    ],
  },
  {
    id: "ozelgun", ad: "Yıl Dönümü: Saray Akşamı", durum: "kutlama", fiyat: 4, sure: "Akşam · 4 saat", ikon: "💍",
    ozet: "Sarayda akşam yemeği ve Boğaz kıyısında yürüyüş — teklif için de uygun.",
    adimlar: [
      ["18:30", "ortakoy", "Ortaköy'de cami önünde gün batımı."],
      ["20:00", "tugra", "Çırağan Sarayı'nda Osmanlı saray mutfağı."],
      ["22:30", "bebeksahil", "Bebek kıyısında gece yürüyüşü."],
    ],
  },
  {
    id: "pazarkahvalti", ad: "Pazar: Kahvaltı & Boğaz Köyleri", durum: "kahvalti", fiyat: 2, sure: "Gündüz · 7 saat", ikon: "☀️",
    ozet: "Hisarın dibinde kahvaltı, korularda yürüyüş, bir müze ve Bebek'te çay.",
    adimlar: [
      ["09:30", "sadekahve", "Rumelihisarı'nda Boğaz kıyısında kahvaltı."],
      ["11:30", "rumelihisari", "Hisarın surlarında yürüyüş."],
      ["13:00", "emirgan", "Emirgan Korusu ve köşkler."],
      ["14:30", "sabanci", "Sakıp Sabancı Müzesi'nde güncel sergi."],
      ["17:00", "bebekkahve", "Bebek'te çay ve gün batımı."],
    ],
  },
  {
    id: "tarihiyarimada", ad: "Tarihi Yarımada Keşfi", durum: "kesif", fiyat: 2, sure: "Tam gün", ikon: "🕌",
    ozet: "Ayasofya'dan Süleymaniye'ye, çarşıdan vapura — İstanbul'un özeti tek günde.",
    adimlar: [
      ["09:00", "ayasofya", "Sabah erken Ayasofya."],
      ["10:30", "yerebatan", "Yerebatan Sarnıcı."],
      ["12:30", "kurufasulye", "Süleymaniye'de kuru fasulye öğle yemeği."],
      ["13:30", "suleymaniye", "Süleymaniye avlusundan Haliç manzarası."],
      ["15:00", "misircarsisi", "Mısır Çarşısı ve Kurukahveci."],
      ["17:00", "sehirhatlari", "Eminönü'nden kısa Boğaz turu."],
      ["19:30", "hamdi", "Hamdi'de terasta akşam yemeği."],
    ],
  },
  {
    id: "balatfener", ad: "Balat–Fener Fotoğraf Turu", durum: "kesif", fiyat: 1, sure: "Gündüz · 6 saat", ikon: "📸",
    ozet: "Renkli evler, Bizans mozaikleri, saray mutfağı ve teleferikle gün batımı.",
    adimlar: [
      ["10:00", "balat", "Balat'ın renkli sokakları ve Fener."],
      ["11:30", "coffeedepartment", "Kahve molası."],
      ["12:30", "kariye", "Kariye'nin mozaikleri."],
      ["13:30", "asitane", "Asitane'de saray mutfağı."],
      ["17:00", "pierreloti", "Teleferikle Pierre Loti'de gün batımı."],
    ],
  },
  {
    id: "adalar", ad: "Adalar Günü", durum: "aile", fiyat: 1, sure: "Tam gün", ikon: "🚲",
    ozet: "Vapurla Büyükada, bisikletle ada turu ve dönüş vapurunda gün batımı.",
    adimlar: [
      ["09:30", "sehirhatlari", "Kabataş'tan Adalar vapuru (yaklaşık 1,5 saat)."],
      ["11:00", "buyukada", "Büyükada'da bisiklet ve köşkler."],
      ["13:00", "buyukada", "Aya Yorgi tepesine yürüyüş, tepede öğle."],
      ["18:00", null, "Dönüş vapurunda martılar ve gün batımı."],
    ],
  },
];

export const mekanBul = (id) => MEKANLAR.find((m) => m.id === id) || null;
export const durumBul = (id) => DURUMLAR.find((d) => d.id === id) || null;
export const haritaGomulu = (sorgu) => `https://maps.google.com/maps?q=${encodeURIComponent(sorgu)}&z=15&output=embed`;
export const haritaLink = (sorgu) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sorgu)}`;
// Birden fazla duraklı rota — Google Haritalar'ın resmî URL biçimi.
export function rotaLink(mekanlar) {
  const s = mekanlar.filter(Boolean).map((m) => m.harita);
  if (s.length < 2) return s[0] ? haritaLink(s[0]) : null;
  const q = new URLSearchParams({ api: "1", origin: s[0], destination: s[s.length - 1], travelmode: "transit" });
  if (s.length > 2) q.set("waypoints", s.slice(1, -1).join("|"));
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
