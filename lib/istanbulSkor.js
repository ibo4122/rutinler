// İstanbul Rehberi — Mekân Türü, Plan Türü, Uygulama Skoru ve türetilen bilgiler.
//
// Mekân verisi (lib/istanbulMekanlar.js) üç eksende etiketli: yemekler, türler,
// özellikler. Kullanıcının gördüğü "Mekân Türü" kategorileri bu eksenlerin
// üstüne kurulu birer süzgeç; "Plan Türü" ise mekânın bir plana ne kadar uyduğunu
// 0–1 arası ölçen kurallar (0,6 ve üstü "uygun"). Hiçbiri yeni veri uydurmaz: elde olmayan bilgi
// (çalışma saati, telefon, otopark) yalnızca Google Places bağlıyken gösterilir.
//
// Uygulama Skoru (100): Google puanı 40 · değerlendirme güveni 20 · kategori
// uygunluğu 15 · plan uygunluğu 10 · güncellik 5 · fiyat-performans 5 ·
// atmosfer/servis/menü 5. Google bağlı değilse ilk iki bileşen editoryal
// karşılıklarıyla ("Rehber puanı", "Kaynak güveni") hesaplanır ve ekranda bu
// açıkça yazılır — rehber puanı hiçbir yerde Google puanı gibi gösterilmez.

const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");
const metin = (m) => kucuk(`${m.not} ${m.imza} ${m.etiketler.join(" ")}`);
const etiketVar = (m, re) => m.etiketler.some((e) => re.test(e));
const tur = (m, ...t) => m.turler.some((x) => t.includes(x));
const yemek = (m, ...y) => m.yemekler.some((x) => y.includes(x));
const oz = (m, ...o) => m.ozellikler.some((x) => o.includes(x));
const sinirla = (v) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// MEKÂN TÜRÜ — üç grup; her kategori bir süzgeç. "ana" mekânın o kategoride
// asıl uzman olup olmadığını söyler (kategori uygunluğu puanı için).
// ---------------------------------------------------------------------------
const ICKI_TUR = ["kokteyl", "sarap", "bira", "kulup", "eglence"];
const yemekKat = (id, ad, ikon, yemekler, ekTest) => ({
  id, ad, ikon,
  test: (m) => yemek(m, ...yemekler) || (ekTest ? ekTest(m) : false),
  ana: (m) => yemekler.includes(m.yemekler[0]),
});
const turKat = (id, ad, ikon, turler) => ({
  id, ad, ikon, test: (m) => tur(m, ...turler), ana: (m) => turler.includes(m.turler[0]),
});

export const KATEGORI_GRUPLARI = [
  {
    id: "yemek", ad: "Yemek", ikon: "🍽",
    kategoriler: [
      yemekKat("kebap", "Kebap", "🍢", ["kebap", "kaburga", "lahmacun"]),
      yemekKat("hamburger", "Hamburger", "🍔", ["burger"]),
      yemekKat("pizza", "Pizza", "🍕", ["pizza"]),
      yemekKat("balik", "Balık ve Deniz Ürünleri", "🐟", ["balik"]),
      turKat("meyhane", "Meyhane", "🫒", ["meyhane"]),
      yemekKat("kahvalti", "Kahvaltı ve Brunch", "🍳", ["kahvalti"]),
      { id: "sokak", ad: "Sokak Lezzetleri", ikon: "🥙", test: (m) => tur(m, "sokak") || etiketVar(m, /sokak lezzeti/i), ana: (m) => m.turler[0] === "sokak" },
      yemekKat("doner", "Döner", "🌯", ["doner"]),
      yemekKat("et", "Et ve Steakhouse", "🥩", ["et", "kaburga"]),
      yemekKat("susi", "Suşi", "🍣", ["susi"]),
      yemekKat("uzakdogu", "Uzak Doğu", "🍜", ["asya", "susi"]),
      yemekKat("italyan", "İtalyan", "🍝", ["italyan", "pizza"]),
      { id: "turk", ad: "Türk Mutfağı", ikon: "🥘",
        test: (m) => yemek(m, "anadolu", "kebap", "meze", "lahmacun", "doner", "kofte", "kaburga") || tur(m, "lokanta", "meyhane"),
        ana: (m) => ["anadolu", "kebap", "meze", "lahmacun", "doner", "kofte", "kaburga"].includes(m.yemekler[0]) || ["lokanta", "meyhane"].includes(m.turler[0]) },
      { id: "dunya", ad: "Dünya Mutfağı", ikon: "🌍",
        test: (m) => yemek(m, "italyan", "asya", "susi") || /fransız|peru|tapas|ispanyol|yunan|lübnan|akdeniz|meksika|nikkei|kore|tay|çin|japon/.test(metin(m)),
        ana: (m) => ["italyan", "asya", "susi"].includes(m.yemekler[0]) },
      yemekKat("vegan", "Vegan", "🥗", ["vegan"]),
      { id: "vejetaryen", ad: "Vejetaryen", ikon: "🥬",
        test: (m) => yemek(m, "vegan") || /vejetaryen|sebze ağırlıklı|bitki/.test(metin(m)), ana: (m) => m.yemekler[0] === "vegan" },
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
      { id: "rooftop", ad: "Rooftop", ikon: "🌇", test: (m) => oz(m, "manzara") && /çatı|teras|\d+\. kat|rooftop|tepesinde/.test(metin(m)), ana: () => true },
      { id: "sarap", ad: "Şarap Mekânları", ikon: "🍷", test: (m) => tur(m, "sarap") || yemek(m, "sarap"), ana: (m) => m.turler[0] === "sarap" },
      { id: "raki", ad: "Rakı Mekânları", ikon: "🥃", test: (m) => tur(m, "meyhane") || (yemek(m, "meze") && /rakı/.test(metin(m))), ana: (m) => m.turler[0] === "meyhane" },
      { id: "bira", ad: "Bira ve Pub", ikon: "🍺", test: (m) => tur(m, "bira") || yemek(m, "bira"), ana: (m) => m.turler[0] === "bira" },
      { id: "manzarali", ad: "Manzaralı", ikon: "🌊", test: (m) => oz(m, "manzara", "bogaz"), ana: () => true },
      { id: "kahvemekan", ad: "Kahve Mekânları", ikon: "🫘", test: (m) => yemek(m, "kahve"), ana: (m) => m.yemekler[0] === "kahve" },
      { id: "lounge", ad: "Lounge", ikon: "🛋", test: (m) => /lounge/.test(metin(m)) || (tur(m, "kokteyl") && etiketVar(m, /otel|şık/i)), ana: () => false },
    ],
  },
  {
    id: "eglence", ad: "Eğlence", ikon: "🎶",
    kategoriler: [
      { id: "canli", ad: "Canlı Müzik", ikon: "🎷", test: (m) => oz(m, "canli") || etiketVar(m, /canlı/i), ana: () => true },
      { id: "dans", ad: "Dans ve Eğlence", ikon: "💃", test: (m) => tur(m, "eglence") || /dans|eller havaya|fasıl|şov/.test(metin(m)), ana: (m) => m.turler[0] === "eglence" },
      { id: "kulup", ad: "Gece Kulüpleri", ikon: "✺", test: (m) => tur(m, "kulup") && !/caz|jazz/.test(metin(m)), ana: (m) => m.turler[0] === "kulup" },
      { id: "dj", ad: "DJ Performansı", ikon: "🎧", test: (m) => /\bdj\b/.test(metin(m)), ana: () => true },
      { id: "after", ad: "After ve Geç Saat", ikon: "🌙", test: (m) => etiketVar(m, /geç saat/i) || /sabaha|gece yarısından sonra|after/.test(metin(m)), ana: () => true },
      { id: "konser", ad: "Konser ve Etkinlik", ikon: "🎤", test: (m) => /konser|sahne|etkinlik|caz/.test(metin(m)), ana: () => true },
    ],
  },
];
export const KATEGORILER = KATEGORI_GRUPLARI.flatMap((g) => g.kategoriler.map((k) => ({ ...k, grup: g.id })));
export const kategoriBul = (id) => KATEGORILER.find((k) => k.id === id) || null;

// Mekânın kartta görünen ana kategorisi.
export function anaKategori(m) {
  return KATEGORILER.find((k) => k.id !== "diger" && k.id !== "turk" && k.id !== "dunya" && k.ana(m) && k.test(m))
    || KATEGORILER.find((k) => k.test(m)) || null;
}

// ---------------------------------------------------------------------------
// PLAN TÜRÜ — bağımsız, birleştirilebilir. uyum(m) 0–1; PLAN_ESIK ve üstü "uygun".
// ---------------------------------------------------------------------------
const durumSira = (m, d) => { const i = m.durumlar.indexOf(d); return i === 0 ? 1 : i === 1 ? 0.85 : i > 1 ? 0.7 : 0; };
const gurultulu = (m) => tur(m, "kulup", "eglence") || /\bdj\b|dans|fasıl|eller havaya/.test(metin(m));
const sakinMi = (m) => etiketVar(m, /sakin|loş|romantik|samimi/i) || tur(m, "sarap") || oz(m, "romantik");

export const PLAN_TURLERI = [
  { id: "ilk", ad: "İlk Buluşma", ikon: "💞", uyum: (m) => sinirla(Math.max(durumSira(m, "randevu"), tur(m, "kokteyl", "sarap") ? 0.7 : 0, sakinMi(m) ? 0.6 : 0) - (gurultulu(m) ? 0.35 : 0) - (m.fiyat === 4 && !m.durumlar.includes("randevu") ? 0.2 : 0) - (yemek(m, "tadim") ? 0.35 : 0)) },
  { id: "ozel", ad: "Özel Gün ve Kutlama", ikon: "🎉", uyum: (m) => sinirla(Math.max(durumSira(m, "kutlama"), tur(m, "fine") ? 0.8 : 0, m.odul === "1y" || m.odul === "2y" ? 0.9 : 0, tur(m, "eglence") ? 0.75 : 0)) },
  { id: "romantik", ad: "Romantik Akşam", ikon: "🕯", uyum: (m) => sinirla(Math.max(oz(m, "romantik") ? 1 : 0, durumSira(m, "randevu") * 0.85, oz(m, "manzara", "bogaz") && !gurultulu(m) ? 0.7 : 0, tur(m, "fine", "sarap") ? 0.65 : 0) - (tur(m, "sokak") ? 0.5 : 0)) },
  { id: "arkadas", ad: "Arkadaşlarla Buluşma", ikon: "🥂", uyum: (m) => sinirla(Math.max(durumSira(m, "arkadas"), tur(m, "meyhane", "bira", "eglence") ? 0.8 : 0, tur(m, "kokteyl", "sokak") ? 0.6 : 0)) },
  { id: "kalabalik", ad: "Kalabalık Grup", ikon: "👥", uyum: (m) => sinirla(Math.max(etiketVar(m, /grup|kalabalık|uzun masa/i) ? 1 : 0, tur(m, "meyhane", "eglence") ? 0.75 : 0, tur(m, "bira") ? 0.7 : 0, durumSira(m, "kutlama") * 0.7) - (etiketVar(m, /küçük|tezgâh/i) ? 0.5 : 0) - (yemek(m, "tadim") ? 0.3 : 0)) },
  { id: "is", ad: "İş Yemeği", ikon: "💼", uyum: (m) => sinirla(Math.max(durumSira(m, "is"), etiketVar(m, /iş yemeği/i) ? 1 : 0) - (gurultulu(m) ? 0.5 : 0)) },
  { id: "aile", ad: "Aileyle", ikon: "👨‍👩‍👧", uyum: (m) => sinirla(Math.max(durumSira(m, "aile"), etiketVar(m, /aile/i) ? 0.9 : 0, tur(m, "lokanta") ? 0.6 : 0) - (tur(m, "kulup", "kokteyl", "bira") ? 0.6 : 0)) },
  { id: "tek", ad: "Tek Başına", ikon: "☕", uyum: (m) => sinirla(Math.max(durumSira(m, "tek"), tur(m, "kafe") ? 0.7 : 0, etiketVar(m, /tezgâh|bar tezgâhı/i) ? 0.7 : 0) - (tur(m, "eglence") ? 0.6 : 0)) },
  { id: "spontane", ad: "Spontane Plan", ikon: "⚡", uyum: (m) => (rezervasyon(m).id === "gerekmez" ? 0.9 : rezervasyon(m).id === "onerilir" ? 0.45 : 0.1) },
  { id: "sakin", ad: "Sakin Akşam", ikon: "🌿", uyum: (m) => sinirla(Math.max(sakinMi(m) ? 0.9 : 0, tur(m, "sarap", "kafe") ? 0.7 : 0, oz(m, "bahce") ? 0.6 : 0, tur(m, "fine") ? 0.6 : 0) - (gurultulu(m) ? 0.8 : 0)) },
  { id: "eglenceli", ad: "Eğlenceli Gece", ikon: "🪩", uyum: (m) => sinirla(Math.max(tur(m, "eglence", "kulup") ? 1 : 0, gurultulu(m) ? 0.85 : 0, oz(m, "canli") ? 0.7 : 0, tur(m, "meyhane") && /fasıl|canlı/.test(metin(m)) ? 0.8 : 0)) },
  { id: "manzara", ad: "Manzaralı Mekân", ikon: "🌉", uyum: (m) => (oz(m, "manzara", "bogaz") ? 1 : etiketVar(m, /manzara|deniz/i) ? 0.7 : 0) },
  { id: "sohbet", ad: "Uzun Sohbet", ikon: "💬", uyum: (m) => sinirla(Math.max(tur(m, "meyhane", "sarap") ? 0.9 : 0, tur(m, "kafe") ? 0.6 : 0, oz(m, "bahce") ? 0.6 : 0, sakinMi(m) ? 0.6 : 0) - (gurultulu(m) ? 0.7 : 0) - (tur(m, "sokak") ? 0.5 : 0)) },
  { id: "hizli", ad: "Hızlı Yemek", ikon: "🏃", uyum: (m) => sinirla(Math.max(tur(m, "sokak") ? 1 : 0, etiketVar(m, /hızlı/i) ? 0.9 : 0, yemek(m, "doner", "lahmacun", "burger", "pizza") && m.fiyat <= 2 ? 0.75 : 0, tur(m, "lokanta") ? 0.65 : 0) - (tur(m, "fine") || yemek(m, "tadim") ? 0.9 : 0)) },
  { id: "kahvalti", ad: "Hafta Sonu Kahvaltısı", ikon: "🍳", uyum: (m) => (yemek(m, "kahvalti") ? (m.yemekler[0] === "kahvalti" ? 1 : 0.75) : etiketVar(m, /brunch|kahvaltı/i) ? 0.7 : 0) },
  { id: "gec", ad: "Geç Saat Planı", ikon: "🌙", uyum: (m) => sinirla(Math.max(etiketVar(m, /geç saat/i) ? 1 : 0, tur(m, "kulup", "eglence") ? 0.9 : 0, tur(m, "kokteyl", "bira") ? 0.65 : 0, tur(m, "meyhane") ? 0.55 : 0) - (tur(m, "kafe", "lokanta") ? 0.6 : 0)) },
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
  if (m.odul === "1y" || m.odul === "2y" || /haftalar önceden|rezervasyon şart/.test(metin(m))) return { id: "sart", ad: "Rezervasyon şart" };
  if (tur(m, "fine") || /rezervasyon|yer ayırt/.test(metin(m))) return { id: "onerilir", ad: "Rezervasyon önerilir" };
  if (tur(m, "sokak", "kafe", "lokanta") && !tur(m, "fine", "meyhane", "restoran")) return { id: "gerekmez", ad: "Rezervasyon gerekmez" };
  if (tur(m, "bira")) return { id: "gerekmez", ad: "Genelde gerekmez" };
  return { id: "onerilir", ad: "Akşamları önerilir" };
}

export function muzik(m) {
  if (tur(m, "kulup", "eglence") || /\bdj\b|dans|eller havaya/.test(metin(m))) return { seviye: 3, ad: "Yüksek", not: "DJ ya da sahne; sohbet zor" };
  if (oz(m, "canli") || /canlı|fasıl|caz/.test(metin(m))) return { seviye: 2, ad: "Orta", not: "Canlı müzik saatlerinde yükselir" };
  if (tur(m, "kokteyl", "bira", "meyhane")) return { seviye: 2, ad: "Orta", not: "Arka plan müziği, hareketli" };
  return { seviye: 1, ad: "Düşük", not: "Rahat konuşulur" };
}

export function kalabalik(m) {
  if (tur(m, "kulup", "eglence", "bira") || etiketVar(m, /kalabalık|grup/i)) return "Hareketli, kalabalık";
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
  return { var: oz(m, "bahce") || /teras|bahçe|çatı|avlu|deniz kenarı|iskele/.test(metin(m)) };
}

export function kimIcinDegil(m) {
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

export function skorHesapla(m, { kategoriler = [], planlar = [] } = {}, g = null) {
  const googleVar = g && typeof g.puan === "number";
  const parcalar = [];

  if (googleVar) {
    parcalar.push({ id: "kalite", ad: "Google puanı", agirlik: 40, deger: sinirla((g.puan - 3.6) / 1.3), aciklama: `★ ${g.puan.toFixed(1)} / 5` });
    const k = GUVEN_KADEMELERI.find((x) => (g.yorum || 0) >= x.alt);
    parcalar.push({ id: "guven", ad: "Değerlendirme güveni", agirlik: 20, deger: k.deger, aciklama: k.ad });
  } else {
    parcalar.push({ id: "kalite", ad: "Rehber puanı (Google bağlı değil)", agirlik: 40, deger: sinirla((m.puan - 6.8) / 2.8), aciklama: `${m.puan.toFixed(1).replace(".", ",")} / 10 editoryal değerlendirme` });
    parcalar.push({ id: "guven", ad: "Kaynak güveni", agirlik: 20, deger: m.odul ? 0.9 : 0.6, aciklama: m.odul ? "Michelin Rehberi 2026 ile doğrulandı" : "Güncel editoryal rehberlerden derlendi" });
  }

  let kat = 0.75, katAciklama = "Kategori seçilmedi — genel değerlendirme";
  if (kategoriler.length) {
    const eslesen = kategoriler.map(kategoriBul).filter((k) => k && k.test(m));
    const asil = eslesen.find((k) => k.ana(m));
    kat = asil ? 1 : eslesen.length ? 0.7 : 0.3;
    katAciklama = asil ? `${asil.ad}: asıl uzmanlığı` : eslesen.length ? `${eslesen[0].ad}: menüde var, asıl uzmanlığı değil` : "Seçilen kategoriye zayıf uyum";
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

  parcalar.push({ id: "guncellik", ad: "Güncellik", agirlik: 5, deger: googleVar ? 1 : m.odul ? 0.95 : 0.8, aciklama: googleVar ? `Google verisi ${g.guncelleme ? new Date(g.guncelleme).toLocaleDateString("tr-TR") : "bugün"}` : m.odul ? "Michelin 2026 listesi" : "2025–2026 rehber kaynakları" });

  const fp = sinirla(((m.puan - 7.7) / 2.1) * 0.6 + (4 - m.fiyat) * 0.15 + 0.05);
  parcalar.push({ id: "fiyat", ad: "Fiyat-performans", agirlik: 5, deger: fp, aciklama: fp >= 0.75 ? "Fiyatına göre çok iyi" : fp >= 0.5 ? "Fiyatıyla dengeli" : "Fiyatı kalitesinin üstünde olabilir" });

  const at = sinirla((m.puan - 7.7) / 2.1 * 0.7 + (m.guzel ? 0.2 : 0) + (m.odul ? 0.15 : 0));
  parcalar.push({ id: "atmosfer", ad: "Atmosfer, servis, menü", agirlik: 5, deger: at, aciklama: m.guzel ? "Mekânın kendisi de deneyimin parçası" : "Editoryal notlara göre" });

  const toplam = Math.round(parcalar.reduce((s, p) => s + p.agirlik * p.deger, 0));
  const zayif = googleVar && (g.puan < 4.0 || (g.yorum || 0) < 50);
  return { toplam, parcalar, googleVar, zayif };
}

// Kartta görünen kısa gerekçe ve detaydaki "Neden önerildi?" maddeleri.
export function nedenler(m, { kategoriler = [], planlar = [] } = {}, g = null, oduller = {}) {
  const l = [];
  if (m.odul && oduller[m.odul]) l.push(`${oduller[m.odul].ad} (2026)`);
  if (g?.puan && (g.yorum || 0) >= 200) l.push(`Google'da ★ ${g.puan.toFixed(1)} · ${new Intl.NumberFormat("tr-TR").format(g.yorum)} değerlendirme`);
  for (const k of kategoriler.map(kategoriBul).filter((k) => k && k.test(m))) {
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
