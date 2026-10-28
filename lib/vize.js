// Vize ve giriş şartları — T.C. vatandaşları için.
//
// KAYNAK: T.C. Dışişleri Bakanlığı, "Türk Vatandaşlarının Tabi Olduğu Vize
// Uygulamaları" sayfası (ülke ülke, pasaport türüne göre). Son kontrol tarihi
// aşağıda. Bakanlığın sayfası turistik, tek girişli seyahat içindir; öğrenim,
// çalışma ya da çok girişli vize için ilgili ülkenin temsilciliğine danışılır.
//
// Her kayıt:
//   umuma   — UMUMA MAHSUS (bordo, sıradan) pasaport için kural (rehberin varsayılanı)
//   diger   — hususi (yeşil), hizmet (gri), diplomatik (siyah) pasaport için fark
//   durum   — muaf | kimlik | evize | kapida | tabi   (rozet ve süzgeç için)
//   notlar  — ek zorunluluklar (ön kayıt, sigorta, varış kartı…)
//   kaynak  — ülkeye özel resmî bağlantı (varsa); genel kaynak her zaman Dışişleri
// Dışişleri sayfasında açıkça yazmayan bir ayrıntı "dogrulanamadi" ile işaretlenir.

export const VIZE_KONTROL = "2026-10-28";
export const VIZE_KAYNAK = {
  ad: "T.C. Dışişleri Bakanlığı — Türk Vatandaşlarının Tabi Olduğu Vize Uygulamaları",
  url: "https://www.mfa.gov.tr/turk-vatandaslarinin-tabi-oldugu-vize-uygulamalari.tr.mfa",
};
export const PASAPORT_NOTU =
  "Bilgiler T.C. vatandaşlarının umuma mahsus (bordo) pasaportu ve turistik, kısa seyahat içindir. " +
  "Hususi (yeşil), hizmet (gri) ve diplomatik (siyah) pasaportta kural farklı olabilir — her ülkede ayrıca yazıyor. " +
  "Başka ülke vatandaşlığın varsa o ülkenin pasaportuyla kurallar tamamen değişir. Öğrenim, çalışma ya da uzun kalış için ilgili ülkenin temsilciliğine danış.";

export const DURUMLAR = {
  muaf: { ad: "Vizesiz", renk: "#34d399" },
  kimlik: { ad: "Kimlikle de girilir", renk: "#34d399" },
  evize: { ad: "e-Vize / ön kayıt", renk: "#38bdf8" },
  kapida: { ad: "Kapıda vize", renk: "#38bdf8" },
  tabi: { ad: "Vize gerekli", renk: "#f59e0b" },
};

const SCHENGEN_DIGER = "Hususi, hizmet ve diplomatik pasaport: 180 günde 90 güne kadar vizesiz.";
const schengen = (ulke, bayrak, ek = {}) => ({
  ulke, bayrak, durum: "tabi", vizeTuru: "schengen", umuma: "Vizeye tabi — Schengen vizesi gerekir.",
  diger: SCHENGEN_DIGER, notlar: ["Schengen vizesi tüm Schengen ülkelerinde geçerlidir; başvuru en uzun kalınacak ülkeye yapılır."], ...ek,
});

export const ULKE_VIZELERI = [
  // --- Schengen ---
  schengen("Almanya", "🇩🇪"), schengen("Avusturya", "🇦🇹"),
  schengen("Belçika", "🇧🇪", { notlar: ["Schengen vizesi gerekir.", "1 Aralık 2022'den beri Belçika havalimanlarında aktarma için havalimanı transit vizesi gerekir."] }),
  schengen("Çekya", "🇨🇿", { diger: "Hususi, hizmet ve diplomatik pasaport: 90 güne kadar vizesiz." }),
  schengen("Danimarka", "🇩🇰"), schengen("Estonya", "🇪🇪"), schengen("Finlandiya", "🇫🇮"), schengen("Fransa", "🇫🇷"),
  schengen("Hırvatistan", "🇭🇷"),
  schengen("Hollanda", "🇳🇱", { notlar: ["Schengen vizesi gerekir.", "Umuma mahsus ve hususi pasaportla Hollanda'da aktarmada transit vize gerekir."] }),
  schengen("İspanya", "🇪🇸"), schengen("İsveç", "🇸🇪"), schengen("İsviçre", "🇨🇭"), schengen("İtalya", "🇮🇹", { notlar: ["Schengen vizesi gerekir; Vatikan dahil."] }),
  schengen("İzlanda", "🇮🇸"), schengen("Letonya", "🇱🇻"), schengen("Lüksemburg", "🇱🇺"), schengen("Macaristan", "🇭🇺"),
  schengen("Malta", "🇲🇹", { diger: "Hususi, hizmet ve diplomatik pasaport: vizesiz." }),
  schengen("Norveç", "🇳🇴", { notlar: ["Schengen vizesi gerekir.", "Oslo Gardermoen'de aktarmada vize gerekir."] }),
  schengen("Polonya", "🇵🇱"), schengen("Portekiz", "🇵🇹"), schengen("Slovenya", "🇸🇮"),
  schengen("Slovakya", "🇸🇰", { diger: "Hususi, hizmet ve diplomatik pasaport: 90 güne kadar vizesiz." }),
  schengen("Yunanistan", "🇬🇷", { diger: "Hususi, hizmet ve diplomatik pasaport: vizesiz." }),
  // --- Avrupa, Schengen dışı ---
  { ulke: "Birleşik Krallık", bayrak: "🇬🇧", diger_adlar: ["İskoçya", "İngiltere"], durum: "tabi", vizeTuru: "uk", umuma: "Vizeye tabi — standart ziyaretçi vizesi gerekir.", diger: "Tüm pasaport türleri vizeye tabi.", notlar: ["Schengen vizesi geçerli değildir; ayrı başvurulur.", "Aktarmada transit vize gerekebilir."], kaynak: { ad: "GOV.UK — Standard Visitor visa", url: "https://www.gov.uk/standard-visitor" } },
  { ulke: "İrlanda", bayrak: "🇮🇪", durum: "tabi", umuma: "Vizeye tabi.", diger: "Diplomatik: 180 günde 90 gün vizesiz; hizmet ve hususi vizeye tabi.", notlar: ["Birleşik Krallık ve Schengen vizesinden ayrıdır."] },
  { ulke: "Bulgaristan", bayrak: "🇧🇬", durum: "tabi", umuma: "Vizeye tabi.", diger: "Hususi: 180 günde 90 gün; diplomatik ve hizmet: 30 güne kadar vizesiz.", notlar: [] },
  { ulke: "Romanya", bayrak: "🇷🇴", durum: "tabi", umuma: "Vizeye tabi.", diger: "Hususi, hizmet ve diplomatik: 6 ayda 3 ay vizesiz.", notlar: [] },
  { ulke: "Kıbrıs Rum Kesimi", bayrak: "🇨🇾", durum: "tabi", umuma: "Vizeye tabi; vize Atina Büyükelçiliğinden alınabilir.", diger: "Tüm pasaport türleri vizeye tabi.", notlar: [] },
  { ulke: "Sırbistan", bayrak: "🇷🇸", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Bosna-Hersek", bayrak: "🇧🇦", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Karadağ", bayrak: "🇲🇪", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Diplomatik, hususi ve hizmet: 90 gün vizesiz.", notlar: [] },
  { ulke: "Arnavutluk", bayrak: "🇦🇱", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Kuzey Makedonya", bayrak: "🇲🇰", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Kosova", bayrak: "🇽🇰", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Moldova", bayrak: "🇲🇩", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Ukrayna", bayrak: "🇺🇦", durum: "kimlik", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: ["Türkiye'den doğrudan seyahatte yeni tip kimlik kartıyla vizesiz giriş yapılabilir."] },
  { ulke: "Belarus", bayrak: "🇧🇾", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: her girişte 30 gün; bir yılda toplam 90 günü geçemez.", diger: "Aynı.", notlar: [] },
  { ulke: "Rusya", bayrak: "🇷🇺", durum: "evize", umuma: "Vizeye tabi; e-vize alınabilir (120 gün geçerli, en fazla 30 gün kalış).", diger: "Hususi ve hizmet: 180 günde 30 gün; diplomatik: 90 gün vizesiz.", notlar: [] },
  { ulke: "Gürcistan", bayrak: "🇬🇪", durum: "kimlik", sure: "1 yıl", umuma: "Vizesiz: 1 yıla kadar. Kimlik kartıyla da girilir.", diger: "Aynı.", notlar: ["1 Ocak 2026'dan beri zorunlu seyahat sağlık sigortası (en az 30.000 GEL teminat)."] },
  { ulke: "Azerbaycan", bayrak: "🇦🇿", durum: "kimlik", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar. Turistik seyahatte kimlik kartıyla da girilir.", diger: "Aynı.", notlar: [] },
  { ulke: "Ermenistan", bayrak: "🇦🇲", durum: "evize", umuma: "Vizeye tabi; vize ya da e-vize önceden alınmalı.", diger: "Diplomatik, hususi ve hizmet: 1 Ocak 2026'dan beri 21 gün e-vizeyle.", notlar: [] },
  { ulke: "KKTC", bayrak: "🇹🇷", durum: "kimlik", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar. Yeni nesil kimlik kartıyla da girilir.", diger: "Aynı.", notlar: ["30 Haziran 2021'den beri yalnızca yeni nesil (çipli) kimlik kartı kabul ediliyor."] },
  // --- Orta Doğu ---
  { ulke: "Birleşik Arap Emirlikleri", bayrak: "🇦🇪", durum: "tabi", umuma: "Vizeye tabi.", diger: "Hususi, hizmet ve diplomatik: 90 güne kadar vizesiz.", notlar: ["Dışişleri sayfası başvuru yolunu (e-vize, havayolu aracılığı vb.) belirtmiyor — doğrulanamadı; seyahatten önce BAE'nin resmî kanalından kontrol et."], dogrulanamadi: true },
  { ulke: "Katar", bayrak: "🇶🇦", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Umman", bayrak: "🇴🇲", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 180 gün içinde her ziyarette 30 gün.", diger: "Diplomatik, hizmet ve hususi: 90 güne kadar vizesiz.", notlar: [] },
  { ulke: "Bahreyn", bayrak: "🇧🇭", durum: "evize", umuma: "30 günlük e-vize.", diger: "Hizmet, hususi ve diplomatik: 90 gün vizesiz.", notlar: [] },
  { ulke: "Kuveyt", bayrak: "🇰🇼", durum: "kapida", umuma: "Vizeye tabi; sınır kapısında 90 günlük vize ücretsiz verilir.", diger: "Hizmet, hususi ve diplomatik: 180 günde 90 gün vizesiz.", notlar: [] },
  { ulke: "Suudi Arabistan", bayrak: "🇸🇦", durum: "evize", umuma: "Vizeye tabi; turistik e-vize (365 günde 90 gün, tek ya da çok girişli).", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Hac dönemi turistik e-vize kapsamı dışındadır."] },
  { ulke: "Ürdün", bayrak: "🇯🇴", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Lübnan", bayrak: "🇱🇧", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "İran", bayrak: "🇮🇷", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "İsrail", bayrak: "🇮🇱", durum: "tabi", umuma: "Vizeye tabi.", diger: "Hususi, hizmet ve diplomatik: 180 günde 90 gün vizesiz.", notlar: [] },
  { ulke: "Mısır", bayrak: "🇪🇬", durum: "tabi", umuma: "Vizeye tabi.", diger: "Diplomatik, hizmet ve hususi: 90 güne kadar vizesiz.", notlar: ["Kapıda ya da e-vize imkânı Dışişleri sayfasında yazmıyor — doğrulanamadı. Eski rehber 'kapıda vize' diyordu; seyahatten önce Mısır'ın resmî e-vize kanalından ve havayolundan teyit et."], dogrulanamadi: true },
  // --- Afrika ---
  { ulke: "Fas", bayrak: "🇲🇦", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Tunus", bayrak: "🇹🇳", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Güney Afrika", bayrak: "🇿🇦", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar (sınırda harçsız kaşe).", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: [] },
  { ulke: "Kenya", bayrak: "🇰🇪", durum: "evize", umuma: "Girişten önce ücretli eTA başvurusu zorunlu.", diger: "Diplomatik, hususi ve hizmet: eTA'dan 90 gün muaf.", notlar: ["12 aydan kısa kalışta seyahat sigortası gerekir."] },
  { ulke: "Tanzanya", bayrak: "🇹🇿", durum: "evize", umuma: "Vizeye tabi; e-vize ya da sınırda vize alınabilir.", diger: "Diplomatik, hususi ve hizmet: 90 güne kadar vizesiz.", notlar: ["Zanzibar Tanzanya'ya bağlıdır."] },
  { ulke: "Mauritius", bayrak: "🇲🇺", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Son 21 günde Kongo DC, Uganda ya da Güney Sudan'da bulunanlara geçici giriş yasağı (12 Haziran 2026 duyurusu)."] },
  { ulke: "Seyşeller", bayrak: "🇸🇨", durum: "evize", umuma: "Vizesiz; ancak girişten önce Seyşeller seyahat izni (TA) sistemine başvuru zorunlu.", diger: "Aynı.", notlar: [] },
  { ulke: "Zambiya", bayrak: "🇿🇲", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 gün; iki kez 30 gün uzatılabilir.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: [] },
  // --- Asya ---
  { ulke: "Japonya", bayrak: "🇯🇵", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Hizmet, hususi ve diplomatik: aynı (90 gün vizesiz).", notlar: [] },
  { ulke: "Güney Kore", bayrak: "🇰🇷", durum: "evize", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar — ancak K-ETA kaydı zorunlu.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Uçuştan önce K-ETA (elektronik seyahat izni) alınmalı."], kaynak: { ad: "K-ETA resmî başvuru", url: "https://www.k-eta.go.kr" } },
  { ulke: "Çin", bayrak: "🇨🇳", durum: "tabi", umuma: "Vizeye tabi.", diger: "Diplomatik, hizmet ve hususi: 30 güne kadar vizesiz.", notlar: [] },
  { ulke: "Hong Kong", bayrak: "🇭🇰", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Pasaport en az 6 ay geçerli olmalı."] },
  { ulke: "Makao", bayrak: "🇲🇴", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Pasaport en az 6 ay geçerli olmalı."] },
  { ulke: "Tayvan", bayrak: "🇹🇼", durum: "evize", umuma: "Vizeye tabi; 30 gün tek girişli e-vize (ücretsiz).", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: ["Havalimanında vize uygulaması 15 Ocak 2026'da sona erdi."] },
  { ulke: "Tayland", bayrak: "🇹🇭", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 15 Eylül 2026'dan itibaren 30 gün (öncesinde 60 gün).", diger: "Diplomatik, hizmet ve hususi: 90 güne kadar vizesiz.", notlar: ["Varıştan 3 gün önce Tayland Dijital Varış Kartı (TDAC) doldurulmalı."], kaynak: { ad: "Tayland Dijital Varış Kartı (TDAC)", url: "https://tdac.immigration.go.th" } },
  { ulke: "Vietnam", bayrak: "🇻🇳", durum: "evize", umuma: "Vizeye tabi; e-vize alınır.", diger: "Diplomatik, hizmet ve hususi: 90 güne kadar vizesiz.", notlar: [], kaynak: { ad: "Vietnam resmî e-vize", url: "https://evisa.immigration.gov.vn" } },
  { ulke: "Kamboçya", bayrak: "🇰🇭", durum: "evize", umuma: "Vizeye tabi; 30 günlük turistik vize e-vize, sınır kapısı ya da fahri konsolosluktan.", diger: "Diplomatik, hizmet ve hususi: 180 günde 30 gün vizesiz.", notlar: [] },
  { ulke: "Malezya", bayrak: "🇲🇾", durum: "kapida", sure: "90 gün", umuma: "Vizeye tabi; ancak girişte ücretsiz 90 günlük giriş vizesi pasaporta damgalanır.", diger: "Hususi, hizmet ve diplomatik: 90 gün vizesiz.", notlar: [] },
  { ulke: "Singapur", bayrak: "🇸🇬", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar (onayla 90 güne uzatılabilir).", diger: "Aynı.", notlar: [] },
  { ulke: "Endonezya", bayrak: "🇮🇩", diger_adlar: ["Bali"], durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Aynı.", notlar: ["1 Ekim 2025'ten beri girişte çevrimiçi bildirim formu ve QR kod zorunlu."] },
  { ulke: "Filipinler", bayrak: "🇵🇭", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Maldivler", bayrak: "🇲🇻", durum: "kapida", sure: "30 gün", umuma: "Vizeye tabi; 30 günlük vize sınır kapısında harçsız verilir.", diger: "Aynı (sınırda harçsız).", notlar: [] },
  { ulke: "Sri Lanka", bayrak: "🇱🇰", durum: "evize", sure: "30 gün", umuma: "Vizeye tabi; 30 günlük turistik vize ETA ile (25 Mayıs 2026'dan beri ücretsiz) ya da sınırda.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: [], kaynak: { ad: "Sri Lanka ETA", url: "https://eta.gov.lk" } },
  { ulke: "Hindistan", bayrak: "🇮🇳", durum: "tabi", umuma: "Vizeye tabi.", diger: "Hususi ve hizmet: vizeye tabi; diplomatik: 90 gün vizesiz.", notlar: [] },
  { ulke: "Nepal", bayrak: "🇳🇵", durum: "kapida", umuma: "Vizeye tabi; vize sınır kapısında alınabilir.", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: [] },
  { ulke: "Özbekistan", bayrak: "🇺🇿", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Diplomatik: vizesiz.", notlar: ["3 günden uzun kalışta ikamet kaydı zorunlu (otel genelde yapar)."] },
  { ulke: "Kazakistan", bayrak: "🇰🇿", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Kırgızistan", bayrak: "🇰🇬", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Moğolistan", bayrak: "🇲🇳", durum: "muaf", sure: "30 gün", umuma: "Vizesiz: 30 güne kadar.", diger: "Aynı.", notlar: [] },
  // --- Amerika ---
  { ulke: "ABD", bayrak: "🇺🇸", durum: "tabi", vizeTuru: "abd", umuma: "Vizeye tabi (B1/B2 ziyaretçi vizesi, mülakatlı).", diger: "Tüm pasaport türleri vizeye tabi.", notlar: ["Mülakat randevusu bekleme süreleri uzun olabilir."], kaynak: { ad: "ABD Dışişleri — Ziyaretçi vizesi", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html" } },
  { ulke: "Kanada", bayrak: "🇨🇦", durum: "tabi", umuma: "Vizeye tabi.", diger: "Tüm pasaport türleri vizeye tabi.", notlar: [] },
  { ulke: "Meksika", bayrak: "🇲🇽", durum: "evize", umuma: "Vizeye tabi; yalnızca havayoluyla girişte 30 gün tek girişli e-vize alınabilir.", diger: "Hususi ve hizmet: temsilcilikten etiket vize; diplomatik: vizesiz.", notlar: [] },
  { ulke: "Küba", bayrak: "🇨🇺", durum: "tabi", umuma: "Vizeye tabi.", diger: "Diplomatik, hizmet ve hususi: 90 güne kadar vizesiz.", notlar: ["Seyahatten 48 saat önce çevrimiçi form ve QR kod gerekir."] },
  { ulke: "Dominik Cumhuriyeti", bayrak: "🇩🇴", durum: "kapida", sure: "30 gün", umuma: "Vizeye tabi; havalimanında 30 günlük vize alınabilir.", diger: "Hususi, hizmet ve diplomatik: 180 günde 90 gün vizesiz.", notlar: [] },
  { ulke: "Kosta Rika", bayrak: "🇨🇷", durum: "muaf", sure: "180 günde 30 gün", umuma: "Vizesiz: 180 gün içinde 30 gün (zamanında başvurulursa 90 güne uzatılabilir).", diger: "Ayrıntı için Dışişleri sayfasına bak.", notlar: [] },
  { ulke: "Panama", bayrak: "🇵🇦", durum: "muaf", sure: "3 ay", umuma: "Vizesiz: 3 aya kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Kolombiya", bayrak: "🇨🇴", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Ekvator", bayrak: "🇪🇨", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Peru", bayrak: "🇵🇪", durum: "muaf", sure: "180 günde 90 gün", umuma: "Vizesiz: 180 gün içinde 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Bolivya", bayrak: "🇧🇴", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Brezilya", bayrak: "🇧🇷", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Arjantin", bayrak: "🇦🇷", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar; toplam kalış ilk girişten itibaren 1 yılda 90 günü geçemez.", diger: "Hizmet, hususi ve diplomatik: aynı (90 güne kadar vizesiz).", notlar: ["31 Ağustos 1992'den beri yürürlükteki vize muafiyeti anlaşmasına dayanır; turistik amaçlı seyahat içindir.", "Çalışma ya da öğrenim için Arjantin temsilciliğinden vize alınmalı."], kaynak: { ad: "Dışişleri — Arjantin'e seyahat edecek vatandaşlarımızın dikkatine", url: "https://www.mfa.gov.tr/arjantin-seyahat-edecek-turk-vatandaslarinin-dikkatine.tr.mfa" } },
  { ulke: "Şili", bayrak: "🇨🇱", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Uruguay", bayrak: "🇺🇾", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Paraguay", bayrak: "🇵🇾", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Venezuela", bayrak: "🇻🇪", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: turistik seyahatte 90 güne kadar.", diger: "Aynı.", notlar: [] },
  { ulke: "Jamaika", bayrak: "🇯🇲", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
  // --- Okyanusya ---
  { ulke: "Avustralya", bayrak: "🇦🇺", durum: "tabi", umuma: "Vizeye tabi.", diger: "Tüm pasaport türleri vizeye tabi.", notlar: [] },
  { ulke: "Yeni Zelanda", bayrak: "🇳🇿", durum: "tabi", umuma: "Vizeye tabi.", diger: "Tüm pasaport türleri vizeye tabi.", notlar: [] },
  { ulke: "Fiji", bayrak: "🇫🇯", durum: "muaf", sure: "90 gün", umuma: "Vizesiz: 90 güne kadar.", diger: "Aynı.", notlar: [] },
].map((v) => ({ notlar: [], ...v, kontrol: VIZE_KONTROL }));

const sade = (s) => String(s || "").toLocaleLowerCase("tr");
const DIZIN = new Map();
for (const v of ULKE_VIZELERI) for (const ad of [v.ulke, ...(v.diger_adlar || [])]) DIZIN.set(sade(ad), v);

export const vizeBul = (ulke) => DIZIN.get(sade(ulke)) || null;
export const vizesizMi = (v) => Boolean(v && (v.durum === "muaf" || v.durum === "kimlik"));

// Rehberdeki bir şehir için gösterilecek özet (rozet + açıklama).
const OZEL = {
  schengen: { ad: "Schengen vizesi", kisa: "Schengen" },
  uk: { ad: "Birleşik Krallık vizesi", kisa: "UK vizesi" },
  abd: { ad: "ABD vizesi (B1/B2)", kisa: "ABD vizesi" },
};
export function sehirVizesi(sehir) {
  const v = vizeBul(sehir?.ulke);
  if (!v) {
    return { ad: "Vize bilgisi doğrulanmadı", kisa: "Doğrulanmadı", renk: "#94a3b8", not: "Bu ülke için resmî kayıt henüz eklenmedi; Dışişleri sayfasından kontrol et.", kayit: null };
  }
  const d = DURUMLAR[v.durum];
  const ozel = OZEL[v.vizeTuru];
  return {
    ad: ozel?.ad || d.ad,
    kisa: ozel?.kisa || (v.sure && (v.durum === "muaf" || v.durum === "kimlik") ? `${d.ad} · ${v.sure}` : d.ad),
    renk: d.renk,
    not: [v.umuma, ...v.notlar].join(" "),
    kayit: v,
  };
}
