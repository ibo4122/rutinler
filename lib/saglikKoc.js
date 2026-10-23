// Kalori ve vücut kompozisyonu motoru.
//
// Buradaki hesaplar beslenme ve spor bilimlerinde standart kabul edilen açık
// formüllerdir; hiçbiri patentli ya da kapalı değildir:
//
//   BMR  — Mifflin-St Jeor (1990). Vücut yağ oranı bilinmiyorsa en doğru
//          tahmin veren denklem budur; Harris-Benedict'in yerini aldı.
//   BMR  — Katch-McArdle, vücut yağ oranı biliniyorsa. Yağsız kütleye göre
//          hesapladığı için kaslı kişilerde Mifflin'den daha isabetli.
//   TDEE — BMR × fiziksel aktivite düzeyi (PAL).
//   Yağ  — US Navy çevre ölçümü yöntemi (boyun, bel, kalça).
//   Egzersiz — Compendium of Physical Activities MET değerleri.
//
// ÖNEMLİ: Bunlar tahmin aracıdır, tıbbi tavsiye değildir. Gerçek harcama
// kişiden kişiye ±%10-15 sapar; doğru yol 2-3 hafta takip edip tartıdaki
// değişime göre kaloriyi ayarlamaktır. Ekran bunu açıkça söyler.

export const AKTIVITE_SEVIYELERI = [
  { id: "hareketsiz", ad: "Hareketsiz", carpan: 1.2, ikon: "🪑", aciklama: "Masa başı iş, planlı egzersiz yok" },
  { id: "hafif", ad: "Hafif aktif", carpan: 1.375, ikon: "🚶", aciklama: "Haftada 1–3 gün hafif egzersiz ya da bol yürüyüş" },
  { id: "orta", ad: "Orta aktif", carpan: 1.55, ikon: "🏃", aciklama: "Haftada 3–5 gün düzenli antrenman" },
  { id: "yuksek", ad: "Çok aktif", carpan: 1.725, ikon: "🏋️", aciklama: "Haftada 6–7 gün yoğun antrenman" },
  { id: "atlet", ad: "Atlet / ağır iş", carpan: 1.9, ikon: "🥇", aciklama: "Günde iki antrenman ya da fiziksel ağır iş" },
];

export const HEDEFLER = [
  { id: "hizliVer", ad: "Hızlı kilo ver", yuzde: -0.25, ikon: "⚡", renk: "#fb7185", aciklama: "TDEE'nin %25 altı. Hızlı ama kas kaybı riski yüksek; 8-10 haftadan uzun sürdürme." },
  { id: "ver", ad: "Kilo ver", yuzde: -0.18, ikon: "📉", renk: "#f59e0b", aciklama: "TDEE'nin %18 altı. Haftada ~0,5-0,7 kg; sürdürülebilir ve kas koruyan aralık." },
  { id: "yavasVer", ad: "Yavaş kilo ver", yuzde: -0.1, ikon: "🐢", renk: "#fbbf24", aciklama: "TDEE'nin %10 altı. Yavaş ama performans ve kas en iyi korunur." },
  { id: "koru", ad: "Kiloyu koru", yuzde: 0, ikon: "⚖️", renk: "#60a5fa", aciklama: "TDEE kadar. Mevcut kiloyu koruyup kompozisyonu iyileştirmek için." },
  { id: "al", ad: "Kilo al", yuzde: 0.12, ikon: "📈", renk: "#34d399", aciklama: "TDEE'nin %12 üstü. Haftada ~0,25-0,4 kg; yağlanmayı sınırlı tutar." },
  { id: "hizliAl", ad: "Hızlı kilo al", yuzde: 0.2, ikon: "🚀", renk: "#2dd4bf", aciklama: "TDEE'nin %20 üstü. Hızlı kütle artışı ama yağ oranı da belirgin artar." },
];

// Makro dağılım şablonları. Protein hedefi gram/kg olarak verilir — yüzdeyle
// hesaplamak düşük kalorili diyetlerde yanıltıcı olur.
export const MAKRO_SABLONLARI = [
  { id: "dengeli", ad: "Dengeli", ikon: "🍽️", proteinGkg: 1.8, yagYuzde: 0.28, aciklama: "Çoğu kişi için varsayılan. Protein 1,8 g/kg, kalan kaloriler karbonhidrat ve yağ arasında dengeli." },
  { id: "yuksekProtein", ad: "Yüksek protein", ikon: "🥩", proteinGkg: 2.2, yagYuzde: 0.25, aciklama: "Kilo verirken kas korumak ya da güç antrenmanı yapmak için. Tokluk hissi de en yüksek." },
  { id: "dusukKarb", ad: "Düşük karbonhidrat", ikon: "🥑", proteinGkg: 2.0, yagYuzde: 0.45, aciklama: "Karbonhidrat kısıtlı; insulin direnci olanlar ya da bu düzene iyi yanıt verenler için." },
  { id: "performans", ad: "Performans / dayanıklılık", ikon: "🚴", proteinGkg: 1.6, yagYuzde: 0.22, aciklama: "Karbonhidrat ağırlıklı. Koşu, bisiklet gibi dayanıklılık sporları için." },
];

const n = (v) => {
  const x = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};

// --- Bazal metabolizma ------------------------------------------------------
// Vücut yağ oranı girilmişse Katch-McArdle, yoksa Mifflin-St Jeor.
export function bmrHesapla({ cinsiyet, yas, boy, kilo, yagOrani }) {
  const k = n(kilo), b = n(boy), y = n(yas), yag = n(yagOrani);
  if (k <= 0 || b <= 0 || y <= 0) return null;

  if (yag > 3 && yag < 65) {
    const yagsizKutle = k * (1 - yag / 100);
    return { deger: 370 + 21.6 * yagsizKutle, yontem: "Katch-McArdle", yagsizKutle };
  }
  const taban = 10 * k + 6.25 * b - 5 * y;
  const deger = cinsiyet === "kadin" ? taban - 161 : taban + 5;
  return { deger, yontem: "Mifflin-St Jeor", yagsizKutle: null };
}

export function tdeeHesapla(bmr, aktiviteId) {
  const a = AKTIVITE_SEVIYELERI.find((x) => x.id === aktiviteId) || AKTIVITE_SEVIYELERI[1];
  return { deger: bmr * a.carpan, aktivite: a };
}

// --- Hedef kalori -----------------------------------------------------------
// Güvenlik sınırı: kadınlarda 1.200, erkeklerde 1.500 kcal altına inilmez.
// Bu eşikler mikro besin yetersizliğinin başladığı yaygın kabul edilen alt sınırdır.
export const ALT_SINIR = { kadin: 1200, erkek: 1500 };

export function hedefKalori({ tdee, hedefId, cinsiyet }) {
  const h = HEDEFLER.find((x) => x.id === hedefId) || HEDEFLER[3];
  const ham = tdee * (1 + h.yuzde);
  const sinir = ALT_SINIR[cinsiyet === "kadin" ? "kadin" : "erkek"];
  const kirpildi = ham < sinir;
  return { deger: Math.max(ham, sinir), hedef: h, kirpildi, hamDeger: ham, sinir };
}

// 1 kg vücut yağı ≈ 7.700 kcal. Haftalık değişim buradan çıkar.
export const KG_KALORI = 7700;

export function haftalikDegisim(hedefKcal, tdee) {
  const gunlukFark = hedefKcal - tdee;
  return (gunlukFark * 7) / KG_KALORI; // kg/hafta (negatif = kayıp)
}

// --- Makrolar ---------------------------------------------------------------
export function makroHesapla({ kalori, kilo, sablonId, yagOrani }) {
  const s = MAKRO_SABLONLARI.find((x) => x.id === sablonId) || MAKRO_SABLONLARI[0];
  const k = n(kilo);
  // Yağ oranı biliniyorsa protein yağsız kütle üzerinden hesaplanır; obezitede
  // toplam kilo üzerinden hesaplamak gereksiz yüksek protein hedefi veriyor.
  const yag = n(yagOrani);
  const referansKilo = yag > 3 && yag < 65 ? k * (1 - yag / 100) * 1.15 : k;

  const proteinG = Math.round(referansKilo * s.proteinGkg);
  const yagKcal = kalori * s.yagYuzde;
  const yagG = Math.round(yagKcal / 9);
  const kalanKcal = kalori - proteinG * 4 - yagG * 9;
  const karbG = Math.max(0, Math.round(kalanKcal / 4));

  return {
    sablon: s,
    protein: { gram: proteinG, kcal: proteinG * 4 },
    yag: { gram: yagG, kcal: yagG * 9 },
    karb: { gram: karbG, kcal: karbG * 4 },
    lif: Math.round((kalori / 1000) * 14), // 14 g / 1000 kcal — yaygın öneri
  };
}

// --- Vücut ölçüleri ---------------------------------------------------------
export function bmiHesapla(kilo, boy) {
  const k = n(kilo), b = n(boy) / 100;
  if (k <= 0 || b <= 0) return null;
  const deger = k / (b * b);
  let sinif, renk, not;
  if (deger < 18.5) { sinif = "Zayıf"; renk = "#60a5fa"; not = "Kilo almak sağlık açısından faydalı olabilir."; }
  else if (deger < 25) { sinif = "Normal"; renk = "#34d399"; not = "Sağlıklı aralıktasın."; }
  else if (deger < 30) { sinif = "Fazla kilolu"; renk = "#fbbf24"; not = "Bel çevresi de ölçülmeli; kas kütlesi yüksekse BKİ yanıltır."; }
  else if (deger < 35) { sinif = "Obez (1. derece)"; renk = "#fb923c"; not = "Kilo vermenin sağlık getirisi bu aralıkta en yüksek."; }
  else { sinif = "Obez (2+ derece)"; renk = "#fb7185"; not = "Bir hekimle birlikte planlamak gerekiyor."; }
  return { deger, sinif, renk, not };
}

export function idealKiloAraligi(boy) {
  const b = n(boy) / 100;
  if (b <= 0) return null;
  return { alt: 18.5 * b * b, ust: 24.9 * b * b };
}

// US Navy yöntemi — mezura dışında alet istemez, ±%3 isabetlidir.
export function yagOraniTahmin({ cinsiyet, boy, boyun, bel, kalca }) {
  const b = n(boy), bo = n(boyun), be = n(bel), ka = n(kalca);
  if (b <= 0 || bo <= 0 || be <= 0) return null;
  if (cinsiyet === "kadin") {
    if (ka <= 0) return null;
    const v = 163.205 * Math.log10(be + ka - bo) - 97.684 * Math.log10(b) - 78.387;
    return v > 0 && v < 70 ? v : null;
  }
  const v = 86.010 * Math.log10(be - bo) - 70.041 * Math.log10(b) + 36.76;
  return v > 0 && v < 70 ? v : null;
}

// Sağlıklı vücut yağ aralıkları (ACE sınıflandırması)
export function yagYorumu(cinsiyet, oran) {
  if (oran == null) return null;
  const esik = cinsiyet === "kadin"
    ? [[13, "Temel yağ"], [20, "Atlet"], [24, "Fit"], [31, "Ortalama"], [100, "Yüksek"]]
    : [[5, "Temel yağ"], [13, "Atlet"], [17, "Fit"], [25, "Ortalama"], [100, "Yüksek"]];
  const renkler = ["#60a5fa", "#34d399", "#a3e635", "#fbbf24", "#fb7185"];
  const i = esik.findIndex(([ust]) => oran < ust);
  const idx = i < 0 ? esik.length - 1 : i;
  return { sinif: esik[idx][1], renk: renkler[idx] };
}

// Su ihtiyacı: 35 ml/kg taban + egzersiz başına ek.
export function suIhtiyaci(kilo, egzersizDakika = 0) {
  return (n(kilo) * 35 + (egzersizDakika / 30) * 350) / 1000; // litre
}

// --- Egzersiz ---------------------------------------------------------------
// MET: 1 MET ≈ 1 kcal/kg/saat (dinlenme). Yakılan kalori = MET × kg × saat.
export const EGZERSIZLER = [
  { ad: "Yürüyüş (normal tempo)", met: 3.5, ikon: "🚶" },
  { ad: "Tempolu yürüyüş", met: 4.8, ikon: "🚶‍♂️" },
  { ad: "Koşu (8 km/sa)", met: 8.3, ikon: "🏃" },
  { ad: "Koşu (12 km/sa)", met: 11.5, ikon: "🏃‍♂️" },
  { ad: "Bisiklet (orta tempo)", met: 7.5, ikon: "🚴" },
  { ad: "Yüzme (serbest)", met: 7.0, ikon: "🏊" },
  { ad: "Ağırlık antrenmanı", met: 5.0, ikon: "🏋️" },
  { ad: "Yoğun ağırlık / crossfit", met: 8.0, ikon: "💪" },
  { ad: "HIIT", met: 9.0, ikon: "⚡" },
  { ad: "Pilates", met: 3.8, ikon: "🧘‍♀️" },
  { ad: "Yoga", met: 3.0, ikon: "🧘" },
  { ad: "Futbol", met: 8.5, ikon: "⚽" },
  { ad: "Basketbol", met: 7.5, ikon: "🏀" },
  { ad: "Tenis", met: 7.3, ikon: "🎾" },
  { ad: "Dans / zumba", met: 6.5, ikon: "💃" },
  { ad: "Merdiven çıkma", met: 8.8, ikon: "🪜" },
  { ad: "Ev işi / temizlik", met: 3.3, ikon: "🧹" },
  { ad: "Bahçe işi", met: 4.0, ikon: "🌱" },
  { ad: "Kürek çekme (makine)", met: 7.0, ikon: "🚣" },
  { ad: "Boks / kickbox", met: 9.5, ikon: "🥊" },
];

export function egzersizKalori(met, kilo, dakika) {
  return n(met) * n(kilo) * (n(dakika) / 60);
}

// --- Zaman tahmini ----------------------------------------------------------
export function hedefeSure({ mevcutKilo, hedefKilo, haftalikKg }) {
  const fark = n(hedefKilo) - n(mevcutKilo);
  if (!fark || !haftalikKg) return null;
  if (Math.sign(fark) !== Math.sign(haftalikKg)) return { uyumsuz: true };
  const hafta = Math.abs(fark / haftalikKg);
  const tarih = new Date();
  tarih.setDate(tarih.getDate() + Math.round(hafta * 7));
  return { hafta, tarih, fark };
}

export const bugun = () => new Date().toISOString().slice(0, 10);

export function tarihAdi(iso) {
  const g = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const a = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${a[d.getMonth()]} ${d.getFullYear()}, ${g[d.getDay()]}`;
}

export const OGUNLER = [
  { id: "kahvalti", ad: "Kahvaltı", ikon: "🌅", renk: "#fbbf24", pay: 0.25 },
  { id: "ara1", ad: "Ara öğün", ikon: "🍎", renk: "#a3e635", pay: 0.1 },
  { id: "ogle", ad: "Öğle", ikon: "☀️", renk: "#fb923c", pay: 0.3 },
  { id: "ara2", ad: "İkindi", ikon: "🥜", renk: "#2dd4bf", pay: 0.1 },
  { id: "aksam", ad: "Akşam", ikon: "🌙", renk: "#a78bfa", pay: 0.25 },
];
