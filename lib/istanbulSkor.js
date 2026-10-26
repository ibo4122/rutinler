// İstanbul Rehberi — Mekân Türü, Plan Türü, Uygulama Skoru ve türetilen bilgiler.
//
// Mekân verisi dört AYRI eksende etiketli: yemekler (ne yenir), türler (nasıl
// bir yer), özellikler (atmosfer) ve etkinlikler (konser, DJ, after… — kaynaklı ve
// güven düzeyli, bkz. lib/istanbulEtkinlik.js). Kategoriler yalnızca bu yapısal
// alanlara ve rehber notundaki birebir etiketlere bakar; serbest metinde kelime
// aranmaz (eskiden "sahne" geçen restoran "Konser"e, "geç saat" açık kaburgacı
// "After"a düşüyordu). "Mekân Türü" kategorileri bu eksenlerin üstüne kurulu
// birer süzgeç; "Plan Türü" ise mekânın bir plana ne kadar uyduğunu
// 0–1 arası ölçen kurallar (0,6 ve üstü "uygun"). Hiçbiri yeni veri uydurmaz: elde olmayan bilgi
// (çalışma saati, telefon, otopark) yalnızca Google Places bağlıyken gösterilir.
//
// Uygulama Skoru (100): Google puanı 40 · değerlendirme güveni 20 · kategori
// uygunluğu 15 · plan uygunluğu 10 · güncellik 5 · fiyat-performans 5 ·
// atmosfer/servis/menü 5. Google bağlı değilse ilk iki bileşen editoryal
// karşılıklarıyla ("Rehber puanı", "Kaynak güveni") hesaplanır ve ekranda bu
// açıkça yazılır — rehber puanı hiçbir yerde Google puanı gibi gösterilmez.

import { etkinlikVar, etkinlikBul, GUVEN_SIRA, GUVEN_AD } from "./istanbulEtkinlik";

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const tarihYaz = (t) => {
  if (!t) return "tarihsiz";
  const [y, a] = String(t).split("-");
  return a ? `${AYLAR[Number(a) - 1]} ${y}` : y;
};
// Mekânın kaynakları içinde en güvenilir olanın düzeyi.
export const kayitGuveni = (m) => (m.kaynaklar || []).reduce((g, k) => (GUVEN_SIRA[k.guven] > GUVEN_SIRA[g] ? k.guven : g), "dusuk");
// Kategori bu mekâna hangi kanıtla uyuyor? (etkinlik kategorisi değilse null)
export function kategoriKaniti(m, k) {
  if (!k?.etkinlik) return null;
  return etkinlikBul(m, k.etkinlik) || (k.id === "canli" ? etkinlikBul(m, "konser") : null);
}

// Birebir etiket: rehber notunda bu etiket açıkça yazılmış mı (kelime içi arama yok).
const etiketVar = (m, re) => m.etiketler.some((e) => re.test(e));
const ET = (...adlar) => new RegExp(`^(${adlar.join("|")})$`, "i");
const tur = (m, ...t) => m.turler.some((x) => t.includes(x));
const yemek = (m, ...y) => m.yemekler.some((x) => y.includes(x));
const oz = (m, ...o) => m.ozellikler.some((x) => o.includes(x));
const sinirla = (v) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// MEKÂN TÜRÜ — üç grup; her kategori bir süzgeç. "ana" mekânın o kategoride
// asıl uzman olup olmadığını söyler (kategori uygunluğu puanı için).
// ---------------------------------------------------------------------------
const ICKI_TUR = ["kokteyl", "sarap", "bira", "kulup", "eglence", "sahne"];
const yemekKat = (id, ad, ikon, yemekler, ekTest) => ({
  id, ad, ikon,
  test: (m) => yemek(m, ...yemekler) || (ekTest ? ekTest(m) : false),
  ana: (m) => yemekler.includes(m.yemekler[0]),
});
const turKat = (id, ad, ikon, turler) => ({
  id, ad, ikon, test: (m) => tur(m, ...turler), ana: (m) => turler.includes(m.turler[0]),
});

// Michelin mekânları ayrı tutulur (kullanıcı isteği): genel listelerde
// görünmezler; yalnızca bu gruptan bir tür seçilince ya da adıyla aranınca gelir.
export const michelinMi = (m) => Boolean(m.odul);
export const KATEGORI_GRUPLARI = [
  {
    id: "michelin", ad: "Michelin Rehberi", ikon: "✦", michelin: true,
    kategoriler: [
      { id: "m-yildiz", ad: "Michelin Yıldızlı", ikon: "★", michelin: true, test: (m) => m.odul === "1y" || m.odul === "2y", ana: () => true },
      { id: "m-bib", ad: "Bib Gourmand", ikon: "☺", michelin: true, test: (m) => m.odul === "bib", ana: () => true },
      { id: "m-secki", ad: "Michelin Seçkisi", ikon: "✦", michelin: true, test: (m) => m.odul === "secki", ana: () => true },
    ],
  },
  {
    id: "yemek", ad: "Yemek", ikon: "🍽",
    kategoriler: [
      yemekKat("kebap", "Kebap", "🍢", ["kebap", "kaburga", "lahmacun"]),
      yemekKat("hamburger", "Hamburger", "🍔", ["burger"]),
      yemekKat("pizza", "Pizza", "🍕", ["pizza"]),
      yemekKat("balik", "Balık ve Deniz Ürünleri", "🐟", ["balik"]),
      turKat("meyhane", "Meyhane", "🫒", ["meyhane"]),
      yemekKat("kahvalti", "Kahvaltı ve Brunch", "🍳", ["kahvalti"]),
      { id: "sokak", ad: "Sokak Lezzetleri", ikon: "🥙", test: (m) => tur(m, "sokak") || etiketVar(m, ET("Sokak lezzeti")), ana: (m) => m.turler[0] === "sokak" },
      yemekKat("doner", "Döner", "🌯", ["doner"]),
      yemekKat("et", "Et ve Steakhouse", "🥩", ["et", "kaburga"]),
      yemekKat("susi", "Suşi", "🍣", ["susi"]),
      yemekKat("uzakdogu", "Uzak Doğu", "🍜", ["asya", "susi"]),
      yemekKat("italyan", "İtalyan", "🍝", ["italyan", "pizza"]),
      { id: "turk", ad: "Türk Mutfağı", ikon: "🥘",
        test: (m) => yemek(m, "anadolu", "kebap", "meze", "lahmacun", "doner", "kofte", "kaburga") || tur(m, "lokanta", "meyhane"),
        ana: (m) => ["anadolu", "kebap", "meze", "lahmacun", "doner", "kofte", "kaburga"].includes(m.yemekler[0]) || ["lokanta", "meyhane"].includes(m.turler[0]) },
      { id: "dunya", ad: "Dünya Mutfağı", ikon: "🌍",
        test: (m) => yemek(m, "italyan", "asya", "susi") || etiketVar(m, ET("Fransız", "Peru", "Tapas", "İspanyol", "Yunan", "Lübnan", "Akdeniz", "Meksika", "Nikkei", "Kore", "Tay", "Çin", "Japon", "Hint")),
        ana: (m) => ["italyan", "asya", "susi"].includes(m.yemekler[0]) },
      yemekKat("vegan", "Vegan", "🥗", ["vegan"]),
      { id: "vejetaryen", ad: "Vejetaryen", ikon: "🥬",
        test: (m) => yemek(m, "vegan") || etiketVar(m, ET("Vejetaryen", "Vegan", "Vejetaryen seçenek", "Bitki bazlı")), ana: (m) => m.yemekler[0] === "vegan" },
      yemekKat("tatli", "Tatlı ve Pastane", "🍰", ["tatli", "dondurma", "firin"]),
      { id: "kafe", ad: "Kahve ve Kafe", ikon: "☕", test: (m) => tur(m, "kafe") || yemek(m, "kahve"), ana: (m) => m.turler[0] === "kafe" },
      turKat("fine", "Fine Dining", "✦", ["fine"]),
      turKat("esnaf", "Esnaf Lokantası", "🍲", ["lokanta"]),
      { id: "diger", ad: "Diğer", ikon: "◎", test: (m) => tur(m, "restoran") && m.yemekler.filter((y) => !["kokteyl", "sarap", "bira", "meze"].includes(y)).length === 0, ana: () => false },
    ],
  },
  {
    id: "icecek", ad: "İçecek ve Sosyalleşme", ikon: "🍸",
    kategoriler: [
      { id: "kokteyl", ad: "Kokteyl Barlar", ikon: "🍸", test: (m) => tur(m, "kokteyl"), ana: (m) => m.turler[0] === "kokteyl" },
      { id: "rooftop", ad: "Rooftop", ikon: "🌇", test: (m) => oz(m, "manzara") && etiketVar(m, ET("Çatı", "Teras", "Rooftop", "Panorama", "360°", "Gün batımı")), ana: () => true },
      { id: "sarap", ad: "Şarap Mekânları", ikon: "🍷", test: (m) => tur(m, "sarap") || yemek(m, "sarap"), ana: (m) => m.turler[0] === "sarap" },
      { id: "raki", ad: "Rakı Mekânları", ikon: "🥃", test: (m) => tur(m, "meyhane") || (yemek(m, "meze") && etiketVar(m, ET("Rakı", "Meze"))), ana: (m) => m.turler[0] === "meyhane" },
      { id: "bira", ad: "Bira ve Pub", ikon: "🍺", test: (m) => tur(m, "bira") || yemek(m, "bira"), ana: (m) => m.turler[0] === "bira" },
      { id: "manzarali", ad: "Manzaralı", ikon: "🌊", test: (m) => oz(m, "manzara", "bogaz"), ana: () => true },
      { id: "kahvemekan", ad: "Kahve Mekânları", ikon: "🫘", test: (m) => yemek(m, "kahve"), ana: (m) => m.yemekler[0] === "kahve" },
      { id: "lounge", ad: "Lounge", ikon: "🛋", test: (m) => etiketVar(m, ET("Lounge")) || (tur(m, "kokteyl") && etiketVar(m, ET("Otel", "Şık"))), ana: () => false },
    ],
  },
  {
    id: "eglence", ad: "Eğlence", ikon: "🎶",
    kategoriler: [
      // Etkinlik kategorileri: yalnızca kaynaklı etkinlik kaydına bakar (bkz. istanbulEtkinlik.js).
      // o.dusukDahil: kullanıcı "doğrulanmamışları da göster" dediyse düşük güvenliler de girer.
      { id: "canli", ad: "Canlı Müzik", ikon: "🎷", etkinlik: "canli", tanim: "Düzenli canlı performans (caz, akustik, grup, fasıl) ya da konser",
        test: (m, o = {}) => etkinlikVar(m, "canli", o.dusukDahil) || etkinlikVar(m, "konser", o.dusukDahil), ana: (m) => tur(m, "sahne") },
      { id: "dans", ad: "Dans ve Eğlence", ikon: "💃", etkinlik: "dans", tanim: "Dans pisti, fasıl ya da sahne şovu olan geceler",
        test: (m, o = {}) => etkinlikVar(m, "dans", o.dusukDahil), ana: (m) => tur(m, "eglence", "kulup") },
      { id: "kulup", ad: "Gece Kulüpleri", ikon: "✺", tanim: "Kaynakla doğrulanmış gece kulüpleri (DJ'li dans geceleri)",
        test: (m, o = {}) => tur(m, "kulup") && (o.dusukDahil || GUVEN_SIRA[m.turGuven] >= 2), ana: (m) => m.turler[0] === "kulup" },
      { id: "dj", ad: "DJ Performansı", ikon: "🎧", etkinlik: "dj", tanim: "Düzenli DJ setleri",
        test: (m, o = {}) => etkinlikVar(m, "dj", o.dusukDahil), ana: (m) => tur(m, "kulup") },
      { id: "after", ad: "After", ikon: "🌙", etkinlik: "after", tanim: "Kulüp gecesinin 04:00 ve sonrasına sürdüğü belgelenmiş mekânlar. Geç saate kadar yemek veren yerler: Plan Türü › Geç Saat Planı",
        test: (m, o = {}) => etkinlikVar(m, "after", o.dusukDahil) && tur(m, "kulup", "eglence"), ana: () => true },
      { id: "konser", ad: "Konser ve Etkinlik", ikon: "🎤", etkinlik: "konser", tanim: "Programlı konserlerin yapıldığı sahneler",
        test: (m, o = {}) => etkinlikVar(m, "konser", o.dusukDahil) && tur(m, "sahne", "kulup"), ana: (m) => tur(m, "sahne") },
    ],
  },
];
export const KATEGORILER = KATEGORI_GRUPLARI.flatMap((g) => g.kategoriler.map((k) => ({ ...k, grup: g.id })));
export const kategoriBul = (id) => KATEGORILER.find((k) => k.id === id) || null;
export const michelinKategoriMi = (id) => Boolean(kategoriBul(id)?.michelin);

// Mekânın kartta görünen ana kategorisi (mutfak/tür; Michelin rozeti ayrıca gösterilir).
export function anaKategori(m) {
  const l = KATEGORILER.filter((k) => !k.michelin);
  // Konser sahnesi ya da kulüpse ana kategorisi o (mutfağı değil).
  if (tur(m, "sahne")) return kategoriBul("konser");
  if (m.turler[0] === "kulup") return kategoriBul("kulup");
  return l.find((k) => k.id !== "diger" && k.id !== "turk" && k.id !== "dunya" && k.ana(m) && k.test(m))
    || l.find((k) => k.test(m)) || null;
}

// ---------------------------------------------------------------------------
// PLAN TÜRÜ — bağımsız, birleştirilebilir. uyum(m) 0–1; PLAN_ESIK ve üstü "uygun".
// ---------------------------------------------------------------------------
const durumSira = (m, d) => { const i = m.durumlar.indexOf(d); return i === 0 ? 1 : i === 1 ? 0.85 : i > 1 ? 0.7 : 0; };
const gurultulu = (m) => tur(m, "kulup", "eglence", "sahne") || etkinlikVar(m, "dj", true) || etkinlikVar(m, "dans", true);
const sakinMi = (m) => etiketVar(m, ET("Sakin", "Loş", "Romantik", "Samimi")) || tur(m, "sarap") || oz(m, "romantik");

export const PLAN_TURLERI = [
  { id: "ilk", ad: "İlk Buluşma", ikon: "💞", uyum: (m) => sinirla(Math.max(durumSira(m, "randevu"), tur(m, "kokteyl", "sarap") ? 0.7 : 0, sakinMi(m) ? 0.6 : 0) - (gurultulu(m) ? 0.35 : 0) - (m.fiyat === 4 && !m.durumlar.includes("randevu") ? 0.2 : 0) - (yemek(m, "tadim") ? 0.35 : 0)) },
  { id: "ozel", ad: "Özel Gün ve Kutlama", ikon: "🎉", uyum: (m) => sinirla(Math.max(durumSira(m, "kutlama"), tur(m, "fine") ? 0.8 : 0, m.odul === "1y" || m.odul === "2y" ? 0.9 : 0, tur(m, "eglence") ? 0.75 : 0)) },
  { id: "romantik", ad: "Romantik Akşam", ikon: "🕯", uyum: (m) => sinirla(Math.max(oz(m, "romantik") ? 1 : 0, durumSira(m, "randevu") * 0.85, oz(m, "manzara", "bogaz") && !gurultulu(m) ? 0.7 : 0, tur(m, "fine", "sarap") ? 0.65 : 0) - (tur(m, "sokak") ? 0.5 : 0)) },
  { id: "arkadas", ad: "Arkadaşlarla Buluşma", ikon: "🥂", uyum: (m) => sinirla(Math.max(durumSira(m, "arkadas"), tur(m, "meyhane", "bira", "eglence") ? 0.8 : 0, tur(m, "kokteyl", "sokak") ? 0.6 : 0)) },
  { id: "kalabalik", ad: "Kalabalık Grup", ikon: "👥", uyum: (m) => sinirla(Math.max(etiketVar(m, ET("Grup", "Büyük grup", "Kalabalık", "Uzun masa")) ? 1 : 0, tur(m, "meyhane", "eglence") ? 0.75 : 0, tur(m, "bira") ? 0.7 : 0, durumSira(m, "kutlama") * 0.7) - (etiketVar(m, ET("Küçük", "Tezgâh")) ? 0.5 : 0) - (yemek(m, "tadim") ? 0.3 : 0)) },
  { id: "is", ad: "İş Yemeği", ikon: "💼", uyum: (m) => sinirla(Math.max(durumSira(m, "is"), etiketVar(m, ET("İş yemeği")) ? 1 : 0) - (gurultulu(m) ? 0.5 : 0)) },
  { id: "aile", ad: "Aileyle", ikon: "👨‍👩‍👧", uyum: (m) => sinirla(Math.max(durumSira(m, "aile"), etiketVar(m, ET("Aile")) ? 0.9 : 0, tur(m, "lokanta") ? 0.6 : 0) - (tur(m, "kulup", "kokteyl", "bira") ? 0.6 : 0)) },
  { id: "tek", ad: "Tek Başına", ikon: "☕", uyum: (m) => sinirla(Math.max(durumSira(m, "tek"), tur(m, "kafe") ? 0.7 : 0, etiketVar(m, ET("Tezgâh", "Bar tezgâhı")) ? 0.7 : 0) - (tur(m, "eglence") ? 0.6 : 0)) },
  { id: "spontane", ad: "Spontane Plan", ikon: "⚡", uyum: (m) => (rezervasyon(m).id === "gerekmez" ? 0.9 : rezervasyon(m).id === "onerilir" ? 0.45 : 0.1) },
  { id: "sakin", ad: "Sakin Akşam", ikon: "🌿", uyum: (m) => sinirla(Math.max(sakinMi(m) ? 0.9 : 0, tur(m, "sarap", "kafe") ? 0.7 : 0, oz(m, "bahce") ? 0.6 : 0, tur(m, "fine") ? 0.6 : 0) - (gurultulu(m) ? 0.8 : 0)) },
  { id: "eglenceli", ad: "Eğlenceli Gece", ikon: "🪩", uyum: (m) => sinirla(Math.max(tur(m, "eglence", "kulup") ? 1 : 0, etkinlikVar(m, "dj") || etkinlikVar(m, "dans") ? 0.9 : 0, etkinlikVar(m, "canli") || etkinlikVar(m, "konser") ? 0.75 : 0, gurultulu(m) ? 0.6 : 0)) },
  { id: "manzara", ad: "Manzaralı Mekân", ikon: "🌉", uyum: (m) => (oz(m, "manzara", "bogaz") ? 1 : etiketVar(m, ET("Manzara", "Boğaz manzarası", "Deniz manzarası", "Deniz kenarı")) ? 0.7 : 0) },
  { id: "sohbet", ad: "Uzun Sohbet", ikon: "💬", uyum: (m) => sinirla(Math.max(tur(m, "meyhane", "sarap") ? 0.9 : 0, tur(m, "kafe") ? 0.6 : 0, oz(m, "bahce") ? 0.6 : 0, sakinMi(m) ? 0.6 : 0) - (gurultulu(m) ? 0.7 : 0) - (tur(m, "sokak") ? 0.5 : 0)) },
  { id: "hizli", ad: "Hızlı Yemek", ikon: "🏃", uyum: (m) => sinirla(Math.max(tur(m, "sokak") ? 1 : 0, etiketVar(m, ET("Hızlı")) ? 0.9 : 0, yemek(m, "doner", "lahmacun", "burger", "pizza") && m.fiyat <= 2 ? 0.75 : 0, tur(m, "lokanta") ? 0.65 : 0) - (tur(m, "fine") || yemek(m, "tadim") ? 0.9 : 0)) },
  { id: "kahvalti", ad: "Hafta Sonu Kahvaltısı", ikon: "🍳", uyum: (m) => (yemek(m, "kahvalti") ? (m.yemekler[0] === "kahvalti" ? 1 : 0.75) : etiketVar(m, ET("Brunch", "Kahvaltı")) ? 0.7 : 0) },
  { id: "gec", ad: "Geç Saat Planı", ikon: "🌙", uyum: (m) => sinirla(Math.max(etiketVar(m, ET("Geç saat")) ? 1 : 0, etkinlikVar(m, "after", true) ? 1 : 0, tur(m, "kulup", "eglence") ? 0.9 : 0, tur(m, "kokteyl", "bira") ? 0.65 : 0, tur(m, "meyhane") ? 0.55 : 0) - (tur(m, "kafe", "lokanta") ? 0.6 : 0)) },
];
export const planBul = (id) => PLAN_TURLERI.find((p) => p.id === id) || null;
export const PLAN_ESIK = 0.6;
export const planUyum = (m, id) => planBul(id)?.uyum(m) || 0;
export const planUyumEtiketi = (v) => (v >= 0.85 ? "Çok uygun" : v >= 0.7 ? "Uygun" : v >= PLAN_ESIK ? "Olabilir" : "Uygun değil");

// ---------------------------------------------------------------------------
// TÜRETİLEN BİLGİLER (Google yoksa "rehber tahmini" olarak etiketlenir)
// ---------------------------------------------------------------------------
export function rezervasyon(m, g) {
  if (g?.rezervasyon === true) return { id: "onerilir", ad: "Rezervasyon alıyor", kaynak: "google" };
  if (m.odul === "1y" || m.odul === "2y" || etiketVar(m, ET("Haftalar önceden rezervasyon", "Rezervasyon şart"))) return { id: "sart", ad: "Rezervasyon şart" };
  if (etiketVar(m, ET("Biletli"))) return { id: "bilet", ad: "Biletli giriş (etkinliğe göre)" };
  if (tur(m, "fine") || etiketVar(m, ET("Rezervasyon önerilir", "Rezervasyon"))) return { id: "onerilir", ad: "Rezervasyon önerilir" };
  if (tur(m, "sokak", "kafe", "lokanta") && !tur(m, "fine", "meyhane", "restoran")) return { id: "gerekmez", ad: "Rezervasyon gerekmez" };
  if (tur(m, "bira")) return { id: "gerekmez", ad: "Genelde gerekmez" };
  return { id: "onerilir", ad: "Akşamları önerilir" };
}

export function muzik(m) {
  if (tur(m, "kulup", "eglence", "sahne") || etkinlikVar(m, "dj", true) || etkinlikVar(m, "dans", true)) return { seviye: 3, ad: "Yüksek", not: "DJ, konser ya da sahne; sohbet zor" };
  if (etkinlikVar(m, "canli", true)) return { seviye: 2, ad: "Orta", not: "Canlı müzik saatlerinde yükselir" };
  if (tur(m, "kokteyl", "bira", "meyhane")) return { seviye: 2, ad: "Orta", not: "Arka plan müziği, hareketli" };
  return { seviye: 1, ad: "Düşük", not: "Rahat konuşulur" };
}

export function kalabalik(m) {
  if (tur(m, "kulup", "eglence", "bira") || etiketVar(m, ET("Kalabalık", "Grup", "Büyük grup"))) return "Hareketli, kalabalık";
  if (sakinMi(m) || tur(m, "fine")) return "Sakin, rezerve masalar";
  if (tur(m, "sokak")) return "Hızlı sirkülasyon, kuyruk olabilir";
  return "Orta yoğunluk";
}

export function alkol(m, g) {
  if (g && (g.alkol?.bira || g.alkol?.sarap || g.alkol?.kokteyl)) {
    return { var: true, ad: [g.alkol.kokteyl && "kokteyl", g.alkol.sarap && "şarap", g.alkol.bira && "bira"].filter(Boolean).join(", "), kaynak: "google" };
  }
  if (tur(m, ...ICKI_TUR, "meyhane", "fine") || yemek(m, "kokteyl", "sarap", "bira", "meze")) return { var: true, ad: "Var" };
  if (tur(m, "kafe", "sokak", "lokanta")) return { var: false, ad: "Genelde yok" };
  return { var: null, ad: "Mekâna sor" };
}

export function acikAlan(m, g) {
  if (g?.acikAlan != null) return { var: g.acikAlan, kaynak: "google" };
  return { var: oz(m, "bahce") || etiketVar(m, ET("Teras", "Bahçe", "Çatı", "Avlu", "Deniz kenarı", "İskele")) };
}

export function kimIcinDegil(m) {
  if (tur(m, "sahne")) return "Konser programı olmayan bir akşam ya da yemek için değil; gitmeden programa bak.";
  if (tur(m, "kulup", "eglence")) return "Sakin bir sohbet ya da erken bir akşam arayanlar için değil.";
  if (tur(m, "fine") || yemek(m, "tadim")) return "Hızlı ve hesaplı bir yemek arayanlar için değil.";
  if (tur(m, "sokak")) return "Oturup uzun bir akşam yemeği planlayanlar için değil.";
  if (tur(m, "meyhane")) return "Alkolsüz, hızlı bir yemek isteyenler için ideal değil.";
  if (tur(m, "kafe")) return "Akşam yemeği ya da gece planı için değil.";
  if (tur(m, "kokteyl", "bira", "sarap")) return "Doyurucu bir akşam yemeği arayanlar için ilk durak değil.";
  if (m.fiyat >= 4) return "Bütçe dostu bir akşam arayanlar için değil.";
  if (tur(m, "lokanta")) return "Akşam keyfi ve içkili bir sofra arayanlar için değil.";
  return "";
}

// ---------------------------------------------------------------------------
// UYGULAMA SKORU
// ---------------------------------------------------------------------------
export const GUVEN_KADEMELERI = [
  { alt: 5000, deger: 1, ad: "5.000+ değerlendirme — çok güvenilir" },
  { alt: 1000, deger: 0.85, ad: "1.000–4.999 değerlendirme — güvenilir" },
  { alt: 200, deger: 0.65, ad: "200–999 değerlendirme — yeterli" },
  { alt: 50, deger: 0.4, ad: "50–199 değerlendirme — sınırlı" },
  { alt: 0, deger: 0.15, ad: "50'den az değerlendirme — düşük güven" },
];

export function skorHesapla(m, { kategoriler = [], planlar = [], dogrulanmamis = false } = {}, g = null) {
  const googleVar = g && typeof g.puan === "number";
  const parcalar = [];

  if (googleVar) {
    parcalar.push({ id: "kalite", ad: "Google puanı", agirlik: 40, deger: sinirla((g.puan - 3.6) / 1.3), aciklama: `★ ${g.puan.toFixed(1)} / 5` });
    const k = GUVEN_KADEMELERI.find((x) => (g.yorum || 0) >= x.alt);
    parcalar.push({ id: "guven", ad: "Değerlendirme güveni", agirlik: 20, deger: k.deger, aciklama: k.ad });
  } else {
    parcalar.push({ id: "kalite", ad: "Rehber puanı (Google bağlı değil)", agirlik: 40, deger: sinirla((m.puan - 6.8) / 2.8), aciklama: `${m.puan.toFixed(1).replace(".", ",")} / 10 editoryal değerlendirme` });
    const kg = kayitGuveni(m);
    const kaynakAdlari = [...new Set((m.kaynaklar || []).filter((k) => k.k !== "site").map((k) => k.ad))].join(", ") || "rehber notu";
    parcalar.push({ id: "guven", ad: "Kaynak güveni", agirlik: 20, deger: { yuksek: 0.9, orta: 0.7, dusuk: 0.45 }[kg], aciklama: `${GUVEN_AD[kg]} · ${kaynakAdlari}` });
  }

  let kat = 0.75, katAciklama = "Kategori seçilmedi — genel değerlendirme";
  const normalKat = kategoriler.filter((id) => !michelinKategoriMi(id));
  if (normalKat.length) {
    const eslesen = normalKat.map(kategoriBul).filter((k) => k && k.test(m, { dusukDahil: dogrulanmamis }));
    const asil = eslesen.find((k) => k.ana(m));
    // Yalnızca doğrulanmamış bir bilgiyle eşleşiyorsa düşük ağırlık.
    const kanitlar = eslesen.map((k) => kategoriKaniti(m, k)).filter(Boolean);
    const zayifKanit = kanitlar.length && kanitlar.every((e) => GUVEN_SIRA[e.guven] < 2);
    kat = zayifKanit ? 0.35 : asil ? 1 : eslesen.length ? 0.7 : 0.3;
    katAciklama = zayifKanit ? `${eslesen[0].ad}: bilgi doğrulanmamış`
      : asil ? `${asil.ad}: asıl uzmanlığı` : eslesen.length ? `${eslesen[0].ad}: sunuyor, asıl işi değil` : "Seçilen kategoriye zayıf uyum";
  } else if (m.yemekler.length && m.yemekler.length <= 2) {
    kat = 0.85; katAciklama = "Belirgin bir uzmanlığı var";
  }
  parcalar.push({ id: "kategori", ad: "Kategori uygunluğu", agirlik: 15, deger: kat, aciklama: katAciklama });

  let plan = 0.7, planAciklama = "Plan seçilmedi";
  if (planlar.length) {
    const d = planlar.map((p) => planUyum(m, p));
    plan = d.reduce((a, b) => a + b, 0) / d.length;
    planAciklama = planlar.map((p, i) => `${planBul(p)?.ad}: ${planUyumEtiketi(d[i]).toLocaleLowerCase("tr")}`).join(" · ");
  }
  parcalar.push({ id: "plan", ad: "Plan uygunluğu", agirlik: 10, deger: plan, aciklama: planAciklama });

  const enYeni = (m.kaynaklar || []).map((k) => k.tarih).filter(Boolean).sort().pop() || null;
  const yil = enYeni ? Number(enYeni.slice(0, 4)) : 0;
  parcalar.push({ id: "guncellik", ad: "Güncellik", agirlik: 5, deger: googleVar ? 1 : yil >= 2026 ? 1 : yil === 2025 ? 0.8 : yil ? 0.5 : 0.4,
    aciklama: googleVar ? `Google verisi ${g.guncelleme ? new Date(g.guncelleme).toLocaleDateString("tr-TR") : "bugün"}` : `En yeni kaynak: ${tarihYaz(enYeni)}` });

  const fp = sinirla(((m.puan - 7.7) / 2.1) * 0.6 + (4 - m.fiyat) * 0.15 + 0.05);
  parcalar.push({ id: "fiyat", ad: "Fiyat-performans", agirlik: 5, deger: fp, aciklama: fp >= 0.75 ? "Fiyatına göre çok iyi" : fp >= 0.5 ? "Fiyatıyla dengeli" : "Fiyatı kalitesinin üstünde olabilir" });

  const at = sinirla((m.puan - 7.7) / 2.1 * 0.7 + (m.guzel ? 0.2 : 0) + (m.odul ? 0.15 : 0));
  parcalar.push({ id: "atmosfer", ad: "Atmosfer, servis, menü", agirlik: 5, deger: at, aciklama: m.guzel ? "Mekânın kendisi de deneyimin parçası" : "Editoryal notlara göre" });

  const toplam = Math.round(parcalar.reduce((s, p) => s + p.agirlik * p.deger, 0));
  const zayif = (googleVar && (g.puan < 4.0 || (g.yorum || 0) < 50)) || (normalKat.length > 0 && kat <= 0.35);
  return { toplam, parcalar, googleVar, zayif };
}

// Kartta görünen kısa gerekçe ve detaydaki "Neden önerildi?" maddeleri.
export function nedenler(m, { kategoriler = [], planlar = [], dogrulanmamis = false } = {}, g = null, oduller = {}) {
  const l = [];
  // Etkinlik seçimi varsa en önce kanıtı: ne yapılıyor, hangi kaynak, ne zaman.
  for (const k of kategoriler.map(kategoriBul).filter((k) => k?.etkinlik && k.test(m, { dusukDahil: dogrulanmamis }))) {
    const e = kategoriKaniti(m, k);
    if (e) l.push(`${e.not} — ${e.kaynakAd || "rehber"}, ${tarihYaz(e.tarih)}${GUVEN_SIRA[e.guven] < 2 ? " (doğrulanmamış)" : ""}`);
  }
  if (m.odul && oduller[m.odul]) l.push(`${oduller[m.odul].ad} (2026)`);
  if (g?.puan && (g.yorum || 0) >= 200) l.push(`Google'da ★ ${g.puan.toFixed(1)} · ${new Intl.NumberFormat("tr-TR").format(g.yorum)} değerlendirme`);
  for (const k of kategoriler.map(kategoriBul).filter((k) => k && !k.michelin && !k.etkinlik && k.test(m, { dusukDahil: dogrulanmamis }))) {
    l.push(k.ana(m) ? `${k.ad}: asıl işi bu` : `${k.ad} da sunuyor`);
  }
  for (const p of planlar) {
    const v = planUyum(m, p);
    if (v >= 0.65) l.push(`${planBul(p).ad} için ${v >= 0.85 ? "çok uygun" : "uygun"}`);
  }
  if (m.guzel && /fine/.test(m.guzel) === false) l.push("Mekânın kendisi güzel: " + ({ manzara: "manzaralı", bogaz: "Boğaz kıyısında", bahce: "bahçeli", tarihi: "tarihi bina", romantik: "romantik ortam" }[m.guzel] || "özel bir ortam"));
  if (m.fiyat <= 2 && m.puan >= 8.6) l.push("Fiyatına göre çok iyi");
  if (!l.length) l.push(`Rehber puanı ${m.puan.toFixed(1).replace(".", ",")}/10`);
  return l;
}

// ---------------------------------------------------------------------------
// KONUM — semt merkezleri (yaklaşık). Mekân koordinatı Google bağlıyken gelir.
// ---------------------------------------------------------------------------
export const BOLGE_KOORD = {
  beyoglu: [41.0335, 28.977], karakoy: [41.024, 28.977], nisantasi: [41.049, 28.993], bomonti: [41.058, 28.981],
  besiktas: [41.043, 29.005], ortakoy: [41.055, 29.028], bebek: [41.077, 29.043], etiler: [41.081, 29.03],
  sariyer: [41.11, 29.056], tarihi: [41.01, 28.97], bati: [40.979, 28.84], kadikoy: [40.988, 29.027],
  bagdat: [40.967, 29.07], uskudar: [41.03, 29.03], beykoz: [41.085, 29.07], atasehir: [40.99, 29.11], adalar: [40.876, 29.09],
};
export function mesafeKm(konum, m, g) {
  const hedef = g?.konum ? [g.konum.lat, g.konum.lng] : BOLGE_KOORD[m.bolge];
  if (!konum || !hedef) return null;
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(hedef[0] - konum.lat), dLng = r(hedef[1] - konum.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(konum.lat)) * Math.cos(r(hedef[0])) * Math.sin(dLng / 2) ** 2;
  return { km: 2 * R * Math.asin(Math.sqrt(a)), yaklasik: !g?.konum };
}

// Google "regularOpeningHours.periods" → şu an açık mı (İstanbul saatiyle).
export function acikMi(periods) {
  if (!Array.isArray(periods) || !periods.length) return null;
  if (periods.length === 1 && periods[0].open && !periods[0].close) return true; // 7/24
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const gun = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  const simdi = gun * 1440 + Number(p.hour) * 60 + Number(p.minute);
  const HAFTA = 7 * 1440;
  return periods.some(({ open, close }) => {
    if (!open || !close) return false;
    const a = open.day * 1440 + open.hour * 60 + (open.minute || 0);
    let b = close.day * 1440 + close.hour * 60 + (close.minute || 0);
    if (b <= a) b += HAFTA;
    return (simdi >= a && simdi < b) || (simdi + HAFTA >= a && simdi + HAFTA < b);
  });
}
