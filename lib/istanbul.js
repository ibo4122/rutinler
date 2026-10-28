// İstanbul Rehberi — "bu akşam nereye?" sorusunun cevabı.
//
// Veri iki katmanlı:
//   lib/istanbulMekanlar.js — betikle üretilen mekân listesi.
//     Notlar, imza ve puan editoryal; ödül (Michelin 2026), Michelin fiyatı,
//     adres ve görsel doğrulanmış kaynaklardan gelir.
//   Bu dosya — üç eksen (yemek, mekân türü, özellik), semtler, durumlar ve
//   elle seçilmiş öneri listeleri.
//
// PUAN: "Rehber puanı" (10 üzerinden) editoryal bir değerlendirmedir: ödüller,
// Google ve internet yorumlarının genel seviyesi ve tutarlılığı, mekânın kendi
// türündeki yeri birlikte tartılır. Canlı Google puanı ve yorum sayısı,
// GOOGLE_PLACES_API_KEY tanımlıysa /api/mekan-google üzerinden gelir.

import { MEKAN_VERISI } from "./istanbulMekanlar";
import { EK_MEKANLAR, EK_GORSELLER } from "./istanbulMekanlarEk";
import { KAYIT_KOKENI } from "./istanbulKaynaklar";
import { mekaniZenginlestir } from "./istanbulEtkinlik";

// ÜÇ EKSEN — her mekân üç soruya ayrı ayrı cevap verir:
//   YEMEKLER   "Canın ne çekiyor?"  burger, pizza, suşi, döner… (bir mekânın birden çok yemeği olabilir)
//   TURLER     "Nasıl bir yer?"     meyhane, kokteyl barı, esnaf lokantası…
//   OZELLIKLER "Mekân nasıl?"       rooftop, Boğaz kıyısı, bahçe, tarihi bina…
// Eskiden bunlar tek bir "ortam" listesindeydi; "en iyi burgerciler" gibi bir
// soru cevapsız kalıyordu. "guzel" alanı manzara/Boğaz/bahçe/tarihi/romantik ya
// da fine dining olan mekânları işaretler ("güzel mekân" süzgeci).

// Yemek rafı grupları
export const YEMEK_GRUPLARI = [
  { id: "yemek", ad: "Yemek" },
  { id: "tatli", ad: "Kahvaltı, tatlı & kahve" },
  { id: "icki", ad: "İçki" },
];

// "baslik": liste başlığı ("İstanbul'un en iyi burgercileri").
export const YEMEKLER = [
  { id: "burger", grup: "yemek", ad: "Burger", ikon: "🍔", renk: "#f59e0b", baslik: "en iyi burgerciler", kapak: "zula" },
  { id: "pizza", grup: "yemek", ad: "Pizza", ikon: "🍕", renk: "#ef4444", baslik: "en iyi pizzacılar" },
  { id: "susi", grup: "yemek", ad: "Suşi & Japon", ikon: "🍣", renk: "#fb7185", baslik: "en iyi suşi & Japon mutfakları" },
  { id: "doner", grup: "yemek", ad: "Döner & Dürüm", ikon: "🥙", renk: "#d97706", baslik: "en iyi dönerciler" },
  { id: "kebap", grup: "yemek", ad: "Kebap & Ocakbaşı", ikon: "🍢", renk: "#f97316", baslik: "en iyi kebapçılar & ocakbaşılar" },
  { id: "kaburga", grup: "yemek", ad: "Kaburga", ikon: "🍖", renk: "#b45309", baslik: "en iyi kaburgacılar" },
  { id: "lahmacun", grup: "yemek", ad: "Lahmacun & Pide", ikon: "🫓", renk: "#ea580c", baslik: "en iyi lahmacun & pideciler" },
  { id: "kofte", grup: "yemek", ad: "Köfte", ikon: "🧆", renk: "#a16207", baslik: "en iyi köfteciler" },
  { id: "et", grup: "yemek", ad: "Steak & Et", ikon: "🥩", renk: "#dc2626", baslik: "en iyi steakhouse & et restoranları" },
  { id: "balik", grup: "yemek", ad: "Balık & Deniz", ikon: "🐟", renk: "#38bdf8", baslik: "en iyi balıkçılar" },
  { id: "meze", grup: "yemek", ad: "Meze & Rakı", ikon: "🫒", renk: "#7dd3fc", baslik: "en iyi meze sofraları" },
  { id: "italyan", grup: "yemek", ad: "İtalyan & Makarna", ikon: "🍝", renk: "#22c55e", baslik: "en iyi İtalyanlar" },
  { id: "asya", grup: "yemek", ad: "Uzak Doğu", ikon: "🍜", renk: "#e11d48", baslik: "en iyi Uzak Doğu mutfakları" },
  { id: "anadolu", grup: "yemek", ad: "Anadolu & Ev Yemeği", ikon: "🥘", renk: "#fca5a5", baslik: "en iyi Anadolu & ev yemekleri" },
  { id: "tadim", grup: "yemek", ad: "Tadım Menüsü", ikon: "✦", renk: "#e8c25a", baslik: "en iyi tadım menüleri" },
  { id: "vegan", grup: "yemek", ad: "Vegan & Bitki", ikon: "🥗", renk: "#4ade80", baslik: "en iyi vegan dostu sofralar" },
  { id: "kahvalti", grup: "tatli", ad: "Kahvaltı & Brunch", ikon: "🍳", renk: "#fdba74", baslik: "en iyi kahvaltıcılar" },
  { id: "firin", grup: "tatli", ad: "Fırın & Kruvasan", ikon: "🥐", renk: "#fcd34d", baslik: "en iyi fırınlar" },
  { id: "tatli", grup: "tatli", ad: "Tatlı & Baklava", ikon: "🍰", renk: "#f9a8d4", baslik: "en iyi tatlıcılar & baklavacılar" },
  { id: "dondurma", grup: "tatli", ad: "Dondurma", ikon: "🍦", renk: "#a5f3fc", baslik: "en iyi dondurmacılar" },
  { id: "kahve", grup: "tatli", ad: "Kahve & Çay", ikon: "☕", renk: "#c8996b", baslik: "en iyi kahveciler" },
  { id: "kokteyl", grup: "icki", ad: "Kokteyl", ikon: "🍸", renk: "#f472b6", baslik: "en iyi kokteyl barları" },
  { id: "sarap", grup: "icki", ad: "Şarap", ikon: "🍷", renk: "#e0607e", baslik: "en iyi şarap barları" },
  { id: "bira", grup: "icki", ad: "Bira", ikon: "🍺", renk: "#fbbf24", baslik: "en iyi bira & pub'lar" },
];

// Üç alan: ne zaman, ne için çıkıyorsun? (mekân türlerini gruplar)
export const ALANLAR = [
  { id: "yemek", ad: "Yemek", ikon: "🍽", aciklama: "Fine dining'den esnaf lokantasına" },
  { id: "gece", ad: "Gece", ikon: "🌙", aciklama: "Meyhane, bar, kulüp ve eğlence" },
  { id: "gunduz", ad: "Gündüz", ikon: "☀️", aciklama: "Kafe, fırın ve hızlı lezzetler" },
];

// "kapak": keşif karosunda fotoğrafı kullanılacak mekân (yoksa en yüksek puanlı).
export const TURLER = [
  { id: "fine", alanlar: ["yemek"], ad: "Fine Dining & Lüks", kisa: "Fine dining", ikon: "✦", renk: "#e8c25a", aciklama: "Yıldızlı şef restoranları, saraylar, otel restoranları." },
  { id: "restoran", alanlar: ["yemek"], ad: "Restoran & Bistro", kisa: "Restoran", ikon: "◎", renk: "#c4b5fd", aciklama: "Oturup yemek yenecek iyi restoranlar ve bistrolar." },
  { id: "meyhane", alanlar: ["yemek", "gece"], ad: "Meyhane", kisa: "Meyhane", kapak: "asmalicavit", ikon: "◗", renk: "#7dd3fc", aciklama: "Meze, rakı, fasıl; klasik meyhaneden yeni nesile." },
  { id: "lokanta", alanlar: ["yemek", "gunduz"], ad: "Esnaf Lokantası", kisa: "Lokanta", ikon: "◍", renk: "#fca5a5", aciklama: "Tencere yemekleri, nesillerdir aynı tarifler." },
  { id: "sokak", alanlar: ["yemek", "gunduz"], ad: "Sokak & Hızlı", kisa: "Sokak", ikon: "◐", renk: "#fde047", aciklama: "Burger, pizza dilimi, döner, pide: hızlı ama iyi." },
  { id: "kafe", alanlar: ["gunduz"], ad: "Kafe & Pastane", kisa: "Kafe", ikon: "●", renk: "#c8996b", aciklama: "Kahvaltı, kahve, tatlı ve dondurma." },
  { id: "kokteyl", alanlar: ["gece"], ad: "Kokteyl Barı", kisa: "Kokteyl", ikon: "▼", renk: "#f472b6", aciklama: "İmza kokteyller, iyi barmenler, çatı barları." },
  { id: "sarap", alanlar: ["gece"], ad: "Şarap Barı", kisa: "Şarap", ikon: "◉", renk: "#e0607e", aciklama: "Kadehle geniş seçki, yerel üzümler, mahzenler." },
  { id: "bira", alanlar: ["gece"], ad: "Pub & Bira", kisa: "Pub", ikon: "▮", renk: "#fbbf24", aciklama: "Craft bira, brewpub'lar, maç ve muhabbet." },
  { id: "sahne", alanlar: ["gece"], ad: "Konser & Sahne", kisa: "Sahne", ikon: "♫", renk: "#22d3ee", aciklama: "Programlı konser ve canlı performans sahneleri." },
  { id: "kulup", alanlar: ["gece"], ad: "Gece Kulübü", kisa: "Kulüp", ikon: "✺", renk: "#a78bfa", aciklama: "DJ'li dans geceleri; tür yalnızca kaynakla doğrulanınca verilir." },
  { id: "eglence", alanlar: ["gece"], ad: "Eğlence & Fasıl", kisa: "Eğlence", ikon: "✷", renk: "#facc15", aciklama: "Masada dans, fasıl, şov — 'eller havaya' geceler." },
];

// Mekânın atmosferi. "guzel" bunlardan birini taşıyan ya da fine dining olan mekânlar.
export const OZELLIKLER = [
  { id: "manzara", ad: "Rooftop & Manzara", kisa: "Manzara", ikon: "🌇", renk: "#fb923c", kapak: "monkey" },
  { id: "bogaz", ad: "Boğaz kıyısında", kisa: "Boğaz", ikon: "🌊", renk: "#38bdf8", kapak: "rumelihisariiskele" },
  { id: "bahce", ad: "Bahçe & Teras", kisa: "Bahçe", ikon: "🌿", renk: "#4ade80" },
  { id: "tarihi", ad: "Tarihi mekân", kisa: "Tarihi", ikon: "🏛", renk: "#d6c08a", kapak: "tugra" },
  { id: "canli", ad: "Canlı müzik & DJ", kisa: "Canlı müzik", ikon: "🎶", renk: "#a78bfa", kapak: "nardis" },
  { id: "romantik", ad: "Romantik & loş", kisa: "Romantik", ikon: "🕯", renk: "#f472b6" },
  { id: "michelin", ad: "Michelin Rehberi'nde", kisa: "Michelin", ikon: "✦", renk: "#e8c25a" },
];
export const GUZEL_NEDEN = { manzara: "Manzaralı", bogaz: "Boğaz kıyısı", tarihi: "Tarihi mekân", bahce: "Bahçeli", romantik: "Romantik", fine: "Şık" };

// "oncelik": bu durumda hangi mekân türleri önce gösterilir. Durum seçilince hem
// bölümler bu sıraya dizilir hem de mekânın o durumu ilk sıralarda taşıması
// (yani asıl amacının bu olması) sıralamada öne geçirir — yoksa randevu
// seçmek, zaten her şeye uygun olan yıldızlıları değiştirmeden bırakıyordu.
export const DURUMLAR = [
  { id: "randevu", ad: "Randevu", ikon: "💞", baslik: "Randevu için en iyileri", oncelik: ["kokteyl", "sarap", "meyhane", "fine", "restoran", "kulup", "kafe"] },
  { id: "arkadas", ad: "Arkadaşlarla", ikon: "🥂", baslik: "Arkadaşlarla gidilecek yerler", oncelik: ["meyhane", "eglence", "bira", "kokteyl", "sokak", "restoran", "kulup", "kafe"] },
  { id: "kutlama", ad: "Doğum günü & kutlama", ikon: "🎂", baslik: "Doğum günü ve kutlamalar için", oncelik: ["eglence", "fine", "meyhane", "restoran", "kulup", "kokteyl"] },
  { id: "is", ad: "İş yemeği", ikon: "💼", baslik: "İş yemeği için", oncelik: ["fine", "restoran", "lokanta", "kafe"] },
  { id: "aile", ad: "Aileyle", ikon: "👨‍👩‍👧", baslik: "Aileyle gidilecek yerler", oncelik: ["restoran", "lokanta", "sokak", "kafe", "meyhane", "fine"] },
  { id: "tek", ad: "Tek başına", ikon: "☕", baslik: "Tek başına iyi hissettiren yerler", oncelik: ["kafe", "lokanta", "sokak", "sarap", "bira"] },
];

// Durum seçiliyken sıralama puanı: asıl amacı o durum olan mekân öne çıkar.
export function durumPuani(m, durum) {
  const i = m.durumlar.indexOf(durum);
  return m.puan + (i === 0 ? 0.6 : i === 1 ? 0.3 : 0);
}

export const FIYATLAR = [
  { id: 1, simge: "₺", ad: "Uygun" },
  { id: 2, simge: "₺₺", ad: "Orta" },
  { id: 3, simge: "₺₺₺", ad: "Üst" },
  { id: 4, simge: "₺₺₺₺", ad: "Lüks" },
];

// Semt bölgeleri — mekânın "bolge" alanı derleme betiğinde semt adından atanır.
export const BOLGELER = [
  { id: "beyoglu", yaka: "avrupa", ad: "Beyoğlu", semtler: "Cihangir · Asmalımescit · Pera · Taksim", aciklama: "Meyhane sokakları, kokteyl barları, caz ve çatı katları." },
  { id: "karakoy", yaka: "avrupa", ad: "Karaköy & Galata", semtler: "Galataport · Tophane · Galata", aciklama: "Michelin yıldızları, ocakbaşı, rooftop ve rıhtım." },
  { id: "nisantasi", yaka: "avrupa", ad: "Nişantaşı & Maçka", semtler: "Teşvikiye · Harbiye · Topağacı", aciklama: "Şık barlar, brasserie'ler, kahve ve kruvasan." },
  { id: "bomonti", yaka: "avrupa", ad: "Bomonti & Kurtuluş", semtler: "Bomonti · Kurtuluş · Şişli", aciklama: "Bira fabrikası, konser sahnesi, mahalle meyhaneleri." },
  { id: "besiktas", yaka: "avrupa", ad: "Beşiktaş & Akaretler", semtler: "Çarşı · Akaretler · Çırağan · Zorlu", aciklama: "Kahvaltı sokağı, kokteyl barları, saray terasları." },
  { id: "ortakoy", yaka: "avrupa", ad: "Ortaköy · Kuruçeşme · Arnavutköy", semtler: "Boğaz hattı", aciklama: "Boğaz kıyısında kulüpler, meyhaneler, balıkçılar." },
  { id: "bebek", yaka: "avrupa", ad: "Bebek · Rumelihisarı · Emirgan", semtler: "Boğaz köyleri", aciklama: "Boğaz kahvaltısı, omakase, sahil yürüyüşü." },
  { id: "etiler", yaka: "avrupa", ad: "Etiler · Ulus · Levent", semtler: "Akatlar · Maslak · Kanyon", aciklama: "Gece kulüpleri, şık restoranlar, iş yemekleri." },
  { id: "sariyer", yaka: "avrupa", ad: "Yeniköy · İstinye · Sarıyer", semtler: "Tarabya · Rumeli Kavağı · Kilyos", aciklama: "Balıkçılar, Michelin yıldızlı Araka, sakin Boğaz akşamları." },
  { id: "tarihi", yaka: "avrupa", ad: "Tarihi Yarımada", semtler: "Sultanahmet · Eminönü · Balat · Kumkapı", aciklama: "Turist tuzağı olmayan lokantalar, meyhaneler ve tatlıcılar." },
  { id: "bati", yaka: "avrupa", ad: "Yeşilköy · Florya · Ataköy", semtler: "Bakırköy ve batı", aciklama: "Deniz kenarında balık, Beyti ve aile sofraları." },
  { id: "kadikoy", yaka: "anadolu", ad: "Kadıköy & Moda", semtler: "Caferağa · Yeldeğirmeni · Kadife Sokak", aciklama: "Kokteyl barları, meyhaneler, kahve ve sokak lezzeti." },
  { id: "bagdat", yaka: "anadolu", ad: "Bağdat Caddesi", semtler: "Suadiye · Caddebostan · Fenerbahçe · Kalamış", aciklama: "Kokteyl barları, bistrolar, burger ve brunch." },
  { id: "uskudar", yaka: "anadolu", ad: "Üsküdar & Boğaz köyleri", semtler: "Kuzguncuk · Çengelköy · Beylerbeyi · Kandilli", aciklama: "Su kenarında balık, meyhane, çay ve kitapçı kafeler." },
  { id: "beykoz", yaka: "anadolu", ad: "Anadoluhisarı & Beykoz", semtler: "Kanlıca · Anadoluhisarı", aciklama: "Yalı restoranları ve iskele balıkçıları." },
  { id: "atasehir", yaka: "anadolu", ad: "Ataşehir & Ümraniye", semtler: "Kozyatağı · Ümraniye", aciklama: "Yeni yıldız Araf, kaburgacılar, modern lokantalar." },
  { id: "adalar", yaka: "anadolu", ad: "Adalar & şehir dışı", semtler: "Burgazada · Şile", aciklama: "Ada meyhanesi ve şehir dışı kaçamak." },
];

export const ODULLER = {
  "2y": { ad: "2 Michelin Yıldızı", kisa: "★★ Michelin", renk: "#e8c25a" },
  "1y": { ad: "1 Michelin Yıldızı", kisa: "★ Michelin", renk: "#e8c25a" },
  bib: { ad: "Michelin Bib Gourmand", kisa: "Bib Gourmand", renk: "#f87171" },
  secki: { ad: "Michelin Rehberi seçkisi", kisa: "Michelin seçkisi", renk: "#d6c08a" },
};

// Elle eklenenler (istanbulMekanlarEk.js) üretilen listeye katılır; aynı id varsa elle olan kazanır.
const EK_IDLER = new Set(EK_MEKANLAR.map((m) => m.id));
// Her kayıt tek tip modele çevrilir: kaynaklar, görsel kökeni, yapısal etkinlikler
// (bkz. lib/istanbulEtkinlik.js). Kapanan/taşınan mekânlar listelerden çıkar ama
// kaydedilmişse adıyla bulunabilir.
export const TUM_MEKANLAR = [...MEKAN_VERISI.filter((m) => !EK_IDLER.has(m.id)), ...EK_MEKANLAR].map((m) => (!m.gorsel && EK_GORSELLER[m.id] ? { ...m, ...EK_GORSELLER[m.id] } : m))
  .map((m) => mekaniZenginlestir(m, KAYIT_KOKENI[m.id])).map((m) => ({
  ...m,
  // Michelin'in güncel adresi varsa onunla, yoksa ad + semt ile aranır —
  // Google Haritalar her iki durumda da mekânın kendi kartını açar.
  harita: m.adres ? `${m.ad}, ${m.adres}, İstanbul` : `${m.ad}, ${m.semt}, İstanbul`,
}));
export const MEKANLAR = TUM_MEKANLAR.filter((m) => !m.kapandi);

// ---------- Önerilerim: elle seçilmiş listeler ----------
// Her satır [mekânId, neden bu listede]. Sıra önem sırasıdır.
export const ONERILER = [
  { id: "ellerhavaya", ad: "Eller havaya geceler", ikon: "🙌", renk: "#facc15", ozet: "Masada dans, fasıl, şov: oturarak bitmeyecek akşamlar.",
    liste: [
      ["hadikarakoy", "Kendi sloganı: oturmak serbest, dans etmek de. Karaköy rıhtımında her gece."],
      ["yasonra", "23:00'ten sonra davul, oryantal ve drag şovu; Boğaz manzarası bonus."],
      ["duble", "Meze ile başlayıp gece yarısı partiye dönen terası."],
      ["madera", "Ateşte kebap, sonra canlı müzik ve DJ."],
      ["cemiyet", "Cuma–cumartesi canlı müzik, bahçeli tarihi bina."],
      ["galatameyhanesi", "Fasılla pasta kesmek İstanbul usulü kutlama."],
      ["madamdespina", "Kına ve bekarlığa veda gecelerinin klasiği."],
      ["korto", "Boğaz kıyısında suşi, sonra sahne."],
      ["alacatikafasi", "Anadolu yakasında 90'lar pop eşliğinde meyhane."],
      ["koragop", "Kumkapı'da şarkılı, uzun fasıl gecesi."],
      ["keyifnevizade", "Nevizade'de her akşam terasta fasıl; şarkılara eşlik edilen kalabalık geceler."],
      ["ziyadefasil", "Fasıl, DJ, zeybek ve oryantal bir arada; kına ve doğum günlerinin adresi."],
      ["sutliman", "Kumkapı'da her gün fasıl, hafta sonu oryantal şov."],
    ] },
  { id: "gunbatimi", ad: "Çatıda gün batımı", ikon: "🌇", renk: "#fb923c", ozet: "Güneş batarken elinde bir kadeh: şehrin en iyi çatıları.",
    liste: [
      ["monkey", "İKSV'nin çatısında Haliç'e karşı; şehrin en ikonik gün batımı."],
      ["topside", "The Peninsula'nın tepesinde Boğaz ve Tarihi Yarımada."],
      ["mikla", "18. katta önce bar, sonra yıldızlı akşam yemeği."],
      ["16roof", "Avrupa'nın en iyi çatı barları listesinde İstanbul'dan."],
      ["alexandra", "Arnavutköy'de Boğaz terasında kokteyl."],
      ["firuze", "6. katta meze ve Tarihi Yarımada."],
      ["sunset", "Adı üstünde: Ulus'tan iki köprü birden."],
      ["manifest", "Galata Kulesi'ne bakan çatı."],
      ["theroof", "Ritz-Carlton'ın havuzlu terasında 360°."],
      ["tershane", "Bib Gourmand fiyatına 9. katta manzara."],
    ] },
  { id: "ilk", ad: "İlk buluşma", ikon: "💞", renk: "#f472b6", ozet: "Konuşulabilen, sakin, ne çok resmî ne çok gürültülü yerler.",
    liste: [
      ["wayana", "Bahçede kadeh kadeh şarap; sohbet kendiliğinden akar."],
      ["aheste", "Tonozlu romantik salon ve paylaşmalık modern mezeler."],
      ["solera", "Mum ışığı ve şarap anlatan garsonlar: buzları kırmanın en kolay yolu."],
      ["flekk", "Akşamın ikinci durağı için şehrin en iyi kokteylleri."],
      ["cuma", "Gündüz buluşması: Çukurcuma'da terasta öğle yemeği."],
      ["araf", "İddialı ama fiyatı makul; tezgâhta yan yana oturmak samimi."],
      ["nardis", "Konuşmak yerine dinlemek isteyenlere: canlı caz."],
      ["cinaralti", "Bütçesiz, tamamen Boğaz: çınar altında çay ve simit."],
      ["coffeedept", "Balat yürüyüşünün ortasında bir kahve molası."],
    ] },
  { id: "dogumgunu", ad: "Kalabalık doğum günü", ikon: "🎂", renk: "#facc15", ozet: "Uzun masa, paylaşmalık tabaklar, sonrasına devam edilebilecek yerler.",
    liste: [
      ["karakoylokantasi", "Meyhane sofrası klasiği; akşam için önceden yer ayırt."],
      ["galatameyhanesi", "Fasıl eşliğinde pasta kesmek İstanbul usulü kutlamadır."],
      ["tershane", "Bib Gourmand fiyatına manzaralı teras ve kebap-meze."],
      ["populist", "Büyük avlu, kendi biraları; grup için çok rahat."],
      ["giritli", "İçkiler dahil sabit menü: hesap bölüşmek kolay."],
      ["sirali", "Ferah salon, lahmacundan kebaba geniş paylaşım."],
      ["zuma", "Enerjik, şık ve kalabalık bir kutlama için."],
      ["ruby", "Yemek sonrası aynı yerde DJ ile devam."],
      ["koragop", "Kumkapı'da şarkılı, uzun bir fasıl gecesi."],
    ] },
  { id: "ozel", ad: "Yıl dönümü & teklif", ikon: "💍", renk: "#e8c25a", ozet: "Unutulmayacak bir akşam: yıldızlar, saraylar ve Boğaz kıyısı.",
    liste: [
      ["turk", "İki yıldız; bir akşamı tamamen yemeğe adamak için."],
      ["nicole", "Boğaz'a bakan sakin salon ve ödüllü servis."],
      ["tugra", "Çırağan Sarayı'nda mermer sütunlar arasından Boğaz."],
      ["lacivert", "Karşıya tekneyle geçip suyun üstünde yemek."],
      ["mikla", "18. kattan bütün şehir; önce çatı barında kadeh."],
      ["araka", "Yeniköy'e vapurla gidilen romantik kır evi."],
      ["aqua", "Su kenarında camla çevrili salon, köprü ışıkları."],
      ["alexandra", "Teklif sonrası Boğaz terasında kutlama kokteyli."],
    ] },
  { id: "butce", ad: "Ucuz ama çok iyi", ikon: "💸", renk: "#4ade80", ozet: "Fiyatı düşük, kalitesi yüksek; çoğu Michelin'in Bib Gourmand listesinden.",
    liste: [
      ["mahir", "Bib Gourmand; Urfa isotlu lahmacunu için kuyruğa değer."],
      ["karadenizdoner", "Şehrin en iyi dönerlerinden biri, küçücük bir dükkânda."],
      ["sade", "Nişantaşı'nda gün boyu dolu, fiyatı şaşırtıcı."],
      ["ciya", "Başka yerde olmayan Anadolu yemekleri, makul hesap."],
      ["araf", "Michelin yıldızlıların en ulaşılabilir olanı."],
      ["safa", "Turistsiz mahalle meyhanesi; fiyat/performans şampiyonu."],
      ["muutto", "Galataport'ta Michelin seçkisinde tapas, ₺ fiyatla."],
      ["bastastreet", "Gastronomik dürüm, öğrenci bütçesine."],
      ["mandabatmaz", "Şehrin en ünlü Türk kahvelerinden biri, birkaç tabure."],
    ] },
  { id: "bogaz", ad: "Boğaz kıyısında", ikon: "🌊", renk: "#38bdf8", ozet: "Masadan suya: iskele köşkleri, yalı restoranları, çınar altları.",
    liste: [
      ["rumelihisariiskele", "Her masa Boğaz'a bakıyor, balık vitrinden seçiliyor."],
      ["lacivert", "Göksu'nun ağzında, suyun hemen üstünde."],
      ["feriye", "Gece ışıklı Ortaköy Camii ve köprü."],
      ["ismetbaba", "Kuzguncuk'ta eski usul balıkçı; pencere kenarı için erken ara."],
      ["balikcikahraman", "Boğaz'ın en kuzeyinde, lakerda ve kalkan."],
      ["sankai", "Bebek'te Boğaz kıyısında omakase."],
      ["sadekahve", "Rumeli Hisarı'nın dibinde kahvaltı."],
      ["taps", "Kendi biraları ve Bebek koyu."],
      ["cinaralti", "Çengelköy'de asırlık çınarın altında çay."],
    ] },
  { id: "pazar", ad: "Pazar kahvaltısı", ikon: "☀️", renk: "#fdba74", ozet: "Geç kalkılan bir pazar için en iyi sofralar.",
    liste: [
      ["vankahvalti", "Otlu peynir, murtuğa, kavut: Van usulü serpme."],
      ["casius", "Taş fırından çıkan Antakya kahvaltısı."],
      ["sadekahve", "Boğaz kıyısında, hisarın dibinde."],
      ["emirgansutis", "Klasik aile kahvaltısı ve sütlü tatlılar."],
      ["pando", "Bal-kaymak; asırlık dükkân, hızlı akan kuyruk."],
      ["cuma", "Çukurcuma'da terasta sakin bir kahvaltı."],
      ["kevcafe", "Moda'da kat kat pankek."],
      ["sariyerborek", "1895'ten beri su böreği, sonra sahil yürüyüşü."],
    ] },
  { id: "is", ad: "İş yemeği", ikon: "💼", renk: "#94a3b8", ozet: "Sessiz masa, hızlı servis, etkileyici ama abartısız.",
    liste: [
      ["sans", "1992'den beri iş dünyasının villa restoranı; özel salonlar."],
      ["neolokal", "Misafiri etkilemek için Anadolu tadım menüsü."],
      ["topaz", "Boğaz manzarası, şık ama rahat."],
      ["ahmetustam", "Maslak'ta plaza arası; et ve hız."],
      ["hunkar", "Nişantaşı'nda klasik ev yemeği öğle yemeği."],
      ["aila", "Gösterişli salon, premium ürünler."],
      ["stregis", "Her damak zevkine bir şey olan geniş menü."],
      ["sapa", "Ataşehir'de set menüyle iddialı bir öğle."],
    ] },
  { id: "anadolu", ad: "Anadolu yakası favorilerim", ikon: "⛴", renk: "#a78bfa", ozet: "Vapuru geçmeye değen Kadıköy, Moda ve Boğaz köyleri.",
    liste: [
      ["ciya", "Kadıköy çarşısının kalbi."],
      ["araf", "Kozyatağı'nda yeni yıldız."],
      ["fahrikonsolos", "Moda'da şehrin en yaratıcı kokteylleri."],
      ["wayana", "Bahçeli şarap barı."],
      ["yanyalifehmi", "1919'dan beri lokanta."],
      ["aida", "Üç katlı, canlı bir İtalyan."],
      ["telezzuz", "Yeşil Yıldızlı vegan sofra."],
      ["ismetbaba", "Kuzguncuk'ta balık."],
      ["mathildas", "Sürdürülebilir kokteyller."],
      ["parvus", "Birkaç masalık mükemmel makarna."],
      ["bargabriel", "Suadiye'de, dünyanın en iyi 100 barı listesinde."],
      ["hani", "Caddebostan'da şef meyhanesi."],
      ["koco", "Moda iskelesinin ucunda denize sıfır."],
    ] },
  { id: "yarimada", ad: "Tarihi Yarımada, tuzaksız", ikon: "🕌", renk: "#fca5a5", ozet: "Turist menülerinin arasından gerçekten iyi olanlar.",
    liste: [
      ["pandeli", "Mısır Çarşısı'nın üstünde, 1901'den beri."],
      ["khorasani", "Sultanahmet'te kaliteden ödün vermeyen ızgara."],
      ["lokanta1741", "Cağaloğlu Hamamı'nın yanında çatı terası."],
      ["avlu", "Four Seasons'ın sakin iç avlusu."],
      ["giritli", "Bahçede Girit mezeleri."],
      ["balikcisabahattin", "Ahşap köşkte balık."],
      ["kurufasulye", "Süleymaniye'de kuru fasulye geleneği."],
      ["vefabozacisi", "Kış akşamı boza molası."],
    ] },
  { id: "tek", ad: "Tek başına & laptopla", ikon: "💻", renk: "#c8996b", ozet: "Yalnız oturmanın garip kaçmadığı, çalışmaya müsait yerler.",
    liste: [
      ["petra", "Geniş, aydınlık, priz bol."],
      ["kronotrop", "Cihangir'de tek köken filtre."],
      ["coffeesapiens", "İstikrarlı zincir, uzun oturmaya uygun."],
      ["demkarakoy", "Onlarca çay çeşidiyle sakin bir köşe."],
      ["mahir", "Tek kişilik öğle yemeğinin en iyisi."],
      ["sensus", "Akşam bar tezgâhında tek kadeh."],
      ["opscafe", "Gün boyu kahvaltı, küçük ve sakin."],
    ] },
];

// Hazır geceler — mekânlar birbirine yürüme mesafesinde.
export const GECELER = [
  { id: "kadikoy", ad: "Kadıköy kokteyl gecesi", tur: "kokteyl",
    adimlar: [["19:30", "wayana", "Bahçede bir kadeh ve tapas."], ["21:30", "mathildas", "Mevsim kokteyli."], ["23:00", "fahrikonsolos", "Gecenin imza kokteyli — kapıda bekleme olabilir."]] },
  { id: "beyoglu", ad: "Beyoğlu: meze → kokteyl → caz", tur: "meyhane",
    adimlar: [["19:30", "aheste", "Modern mezeler ve rakı."], ["22:00", "flekk", "İmza kokteyl."], ["23:30", "nardis", "Gece seansında canlı caz."]] },
  { id: "bogaz", ad: "Boğaz'da özel akşam", tur: "fine",
    adimlar: [["19:00", "alexandra", "Gün batımında terasta kokteyl."], ["20:30", "sunset", "Ulus'ta akşam yemeği."], ["23:30", "ulus29", "Gecenin devamı DJ ile."]] },
  { id: "karakoy", ad: "Karaköy: ocakbaşı → çatı", tur: "restoran",
    adimlar: [["19:30", "aliocakbasi", "Suya bakan ocakbaşında akşam yemeği."], ["22:00", "murver", "Çatı barında kokteyl ve şehir."], ["23:30", "finn", "Şampiyon barmenlerle kapanış."]] },
  { id: "bira", ad: "Bomonti bira & konser", tur: "bira",
    adimlar: [["19:00", "populist", "Avluda craft bira ve burger."], ["21:30", "babylon", "Aynı kampüste konser."]] },
];

export const mekanBul = (id) => TUM_MEKANLAR.find((x) => x.id === id) || null;
export const turBul = (id) => TURLER.find((x) => x.id === id) || null;
export const yemekBul = (id) => YEMEKLER.find((x) => x.id === id) || null;
export const ozellikBul = (id) => OZELLIKLER.find((x) => x.id === id) || null;
export const haritaGomulu = (sorgu) => `https://maps.google.com/maps?q=${encodeURIComponent(sorgu)}&z=16&output=embed`;
export const haritaLink = (sorgu) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sorgu)}`;
export const yolTarifi = (sorgu) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sorgu)}`;
export function rotaLink(mekanlar) {
  const s = mekanlar.filter(Boolean).map((x) => x.harita);
  if (s.length < 2) return s[0] ? haritaLink(s[0]) : null;
  const q = new URLSearchParams({ api: "1", origin: s[0], destination: s[s.length - 1], travelmode: "walking" });
  if (s.length > 2) q.set("waypoints", s.slice(1, -1).join("|"));
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
