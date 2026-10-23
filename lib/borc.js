// Borç planlama motoru (Türkiye, 2026).
//
// Buradaki fikir şu: bir borç tablosu "ne kadar borcum var" sorusunu yanıtlar,
// ama asıl işe yarayan soru "ne zaman biter ve nasıl hızlandırırım" sorusudur.
// Bu dosya ikincisini hesaplar.
//
// Temel mekanik (borç kartopu / çığ yöntemi):
//   Aylık toplam ödeme SABİT tutulur. Bir kredi kapandığında taksiti cebe
//   girmez — otomatik olarak sıradaki borca eklenir. Böylece her kapanış
//   bir sonrakini hızlandırır ve etki katlanarak büyür.

// --- TCMB kredi kartı azami AKDİ faiz oranları (1 Ocak 2026'dan beri) -------
// Dönem borcu büyüdükçe oran artar. Kullanıcı kendi oranını yazmazsa bu tablo
// kullanılır; bankalar azami oranın altında kalabilir.
export const KART_FAIZ_KADEMELERI = [
  { ustSinir: 30000, oran: 3.25 },
  { ustSinir: 180000, oran: 3.75 },
  { ustSinir: Infinity, oran: 4.25 },
];

export function kartFaizi(bakiye) {
  const k = KART_FAIZ_KADEMELERI.find((x) => bakiye < x.ustSinir) || KART_FAIZ_KADEMELERI[KART_FAIZ_KADEMELERI.length - 1];
  return k.oran;
}

// --- Asgari ödeme oranı (limite göre) --------------------------------------
// Limit büyüdükçe asgari oran da artar. Asgari ödemek borcu kapatmaz; faizi
// ancak zar zor karşılar — simülasyon bunu gösterir.
export const ASGARI_KADEMELERI = [
  { ustSinir: 25000, oran: 0.20 },
  { ustSinir: 50000, oran: 0.30 },
  { ustSinir: Infinity, oran: 0.40 },
];

export function asgariOran(limit) {
  const k = ASGARI_KADEMELERI.find((x) => limit < x.ustSinir) || ASGARI_KADEMELERI[ASGARI_KADEMELERI.length - 1];
  return k.oran;
}

export const STRATEJILER = [
  {
    id: "cig",
    ad: "Çığ (faiz odaklı)",
    ikon: "❄️",
    aciklama: "Ek parayı en yüksek faizli borca yönlendirir. Matematiksel olarak en az faiz ödetir — para olarak en kârlı yol.",
  },
  {
    id: "kartopu",
    ad: "Kartopu (motivasyon odaklı)",
    ikon: "⛄",
    aciklama: "Ek parayı en küçük bakiyeli borca yönlendirir. Biraz daha fazla faiz ödersin ama borçlar hızlı hızlı kapanır, bırakma ihtimali düşer.",
  },
  {
    id: "asgari",
    ad: "Sadece asgari (karşılaştırma)",
    ikon: "🐌",
    aciklama: "Hiç ek ödeme yapmadan devam etme senaryosu. Diğer iki yöntemin ne kazandırdığını görmek için referans.",
  },
];

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

// "8/24" → { odenen: 8, toplam: 24, kalan: 16 }
export function taksitAyristir(metin) {
  const t = String(metin || "").replace(/\s/g, "");
  if (!t.includes("/")) return { odenen: 0, toplam: 0, kalan: 0, gecerli: false };
  const [a, b] = t.split("/");
  const odenen = Math.max(0, Math.floor(n(a)));
  const toplam = Math.max(0, Math.floor(n(b)));
  if (!toplam) return { odenen: 0, toplam: 0, kalan: 0, gecerli: false };
  return { odenen, toplam, kalan: Math.max(0, toplam - odenen), gecerli: true };
}

// Kullanıcı faiz oranını çoğu zaman bilmez — ama taksitini, kalan borcunu ve
// kaç taksiti kaldığını bilir. Bu üçünden örtük aylık faiz oranı çözülebilir:
//   bakiye = taksit * (1 - (1+i)^-n) / i
// Kapalı çözümü yok, ikiye bölerek (bisection) buluyoruz.
export function ortukFaiz(bakiye, taksit, kalanTaksit) {
  const B = n(bakiye), T = n(taksit), N = Math.floor(n(kalanTaksit));
  if (B <= 0 || T <= 0 || N <= 0) return null;
  if (T * N <= B) return 0;          // faizsiz ya da veri tutarsız
  if (T >= B) return null;           // tek ödemede kapanıyor, oran anlamsız
  const bugunkuDeger = (i) => (i === 0 ? T * N : (T * (1 - Math.pow(1 + i, -N))) / i);
  let alt = 0, ust = 1;              // %0 – %100 aylık
  for (let k = 0; k < 80; k++) {
    const orta = (alt + ust) / 2;
    if (bugunkuDeger(orta) > B) alt = orta; else ust = orta;
  }
  const oran = ((alt + ust) / 2) * 100;
  return oran > 0.01 && oran < 99 ? Number(oran.toFixed(2)) : null;
}

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// Bugünden N ay sonrasının "Mart 2027" biçimli adı.
export function ayAdi(aySonra, baslangic = new Date()) {
  const d = new Date(baslangic.getFullYear(), baslangic.getMonth() + Math.max(0, Math.round(aySonra)), 1);
  return `${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

// --- Simülasyon -------------------------------------------------------------
// borclar: [{ id, ad, tur: "kredi"|"kart", bakiye, taksit, aylikFaiz, limit, kalanTaksit }]
//   kredi → sabit taksit, kalan taksit sayısı kadar sürer
//   kart  → sabit taksit yok; asgari oran üzerinden zorunlu ödeme hesaplanır
//
// ekKapasite: kullanıcının her ay borca ayırabileceği EK tutar
// strateji  : "cig" | "kartopu" | "asgari"
export function simule({ borclar, ekKapasite = 0, strateji = "cig", maxAy = 360 }) {
  const liste = (borclar || [])
    .map((b) => ({
      id: b.id,
      ad: b.ad,
      tur: b.tur === "kart" ? "kart" : "kredi",
      bakiye: Math.max(0, n(b.bakiye)),
      taksit: Math.max(0, n(b.taksit)),
      faiz: Math.max(0, n(b.aylikFaiz)) / 100,
      asgari: asgariOran(Math.max(n(b.limit), n(b.bakiye))),
      kalanTaksit: b.kalanTaksit == null ? null : Math.max(0, Math.floor(n(b.kalanTaksit))),
    }))
    .filter((b) => b.bakiye > 0);

  if (!liste.length) {
    return { gecerli: false, ay: 0, toplamFaiz: 0, toplamOdeme: 0, olaylar: [], aylik: [], sabitOdeme: 0, bitti: true };
  }

  // Bir borcun o ayki ZORUNLU ödemesi.
  // Kartlarda kullanıcı kendi aylık ödemesini yazdıysa o geçerlidir (taksitli
  // harcamaya bölünmüş bir bakiyede yasal asgari oran gerçeği yansıtmaz);
  // yazmadıysa limite göre yasal asgari oran kullanılır.
  const zorunlu = (b) => {
    if (b.bakiye <= 0) return 0;
    if (b.tur === "kart") {
      if (b.taksit > 0) return Math.min(b.bakiye, b.taksit);
      return Math.min(b.bakiye, Math.max(b.bakiye * b.asgari, 100));
    }
    return Math.min(b.bakiye, b.taksit || b.bakiye);
  };

  // Aylık toplam ödeme sabit kalsın: başlangıçtaki zorunlu yük + ek kapasite.
  // Bir borç kapandığında zorunlu yük düşer, aradaki fark kendiliğinden
  // sıradaki borca akar. Kartopu etkisinin tamamı bu satırda saklı.
  const sabitOdeme = liste.reduce((s, b) => s + zorunlu(b), 0) + Math.max(0, n(ekKapasite));

  const sirala = (acik) => {
    const kopya = [...acik];
    if (strateji === "kartopu") kopya.sort((a, b) => a.bakiye - b.bakiye || b.faiz - a.faiz);
    else kopya.sort((a, b) => b.faiz - a.faiz || a.bakiye - b.bakiye);
    return kopya;
  };

  const olaylar = [];
  const aylik = [];
  let toplamFaiz = 0;
  let toplamOdeme = 0;
  let ay = 0;
  let bitti = false;

  while (ay < maxAy) {
    const acik = liste.filter((b) => b.bakiye > 0.5);
    if (!acik.length) { bitti = true; break; }
    ay += 1;

    // 1) Faiz tahakkuku
    let ayFaiz = 0;
    for (const b of acik) {
      const f = b.bakiye * b.faiz;
      b.bakiye += f;
      ayFaiz += f;
    }
    toplamFaiz += ayFaiz;

    // 2) Zorunlu ödemeler
    let butce = strateji === "asgari"
      ? acik.reduce((s, b) => s + zorunlu(b), 0)
      : sabitOdeme;
    let ayOdeme = 0;

    for (const b of acik) {
      // Kapanışta "ne kadar yer açıldığını" söyleyebilmek için, borç daha
      // erimeden önceki tam zorunlu tutarı sakla (son ay kısmi ödeme olabilir).
      b.buAyZorunlu = zorunlu(b);
      const z = Math.min(b.buAyZorunlu, b.bakiye, butce);
      b.bakiye -= z;
      butce -= z;
      ayOdeme += z;
      if (b.kalanTaksit != null && b.kalanTaksit > 0) b.kalanTaksit -= 1;
    }

    // 3) Artan bütçe → stratejinin hedefine, kapandıkça sıradakine
    if (butce > 0.5) {
      for (const b of sirala(liste.filter((x) => x.bakiye > 0.5))) {
        if (butce <= 0.5) break;
        const ode = Math.min(b.bakiye, butce);
        b.bakiye -= ode;
        butce -= ode;
        ayOdeme += ode;
      }
    }
    toplamOdeme += ayOdeme;

    // 4) Bu ay kapananları kaydet
    for (const b of acik) {
      if (b.bakiye <= 0.5 && !olaylar.some((o) => o.id === b.id)) {
        b.bakiye = 0;
        olaylar.push({
          id: b.id,
          ad: b.ad,
          tur: b.tur,
          ay,
          ayAdi: ayAdi(ay),
          serbestlesen: b.tur === "kredi" ? b.taksit : (b.buAyZorunlu || 0),
        });
      }
    }

    aylik.push({
      ay,
      ayAdi: ayAdi(ay),
      odeme: ayOdeme,
      faiz: ayFaiz,
      kalanBorc: liste.reduce((s, b) => s + Math.max(0, b.bakiye), 0),
      acikSayi: liste.filter((b) => b.bakiye > 0.5).length,
    });

    if (liste.every((b) => b.bakiye <= 0.5)) { bitti = true; break; }
  }

  return { gecerli: true, ay, toplamFaiz, toplamOdeme, olaylar, aylik, sabitOdeme, bitti };
}

// İki senaryoyu karşılaştır: seçili strateji vs. hiç ek ödeme yapmama.
export function karsilastir(borclar, ekKapasite, strateji) {
  const secili = simule({ borclar, ekKapasite, strateji });
  const taban = simule({ borclar, ekKapasite: 0, strateji: "asgari" });
  return {
    secili,
    taban,
    kazanilanAy: taban.bitti && secili.bitti ? Math.max(0, taban.ay - secili.ay) : null,
    faizTasarrufu: taban.bitti && secili.bitti ? Math.max(0, taban.toplamFaiz - secili.toplamFaiz) : null,
  };
}

// --- Sağlık göstergeleri ----------------------------------------------------
// Eşikler bankacılık ve bütçe pratiğinde yaygın kabul görenlerdir.
export function saglikGostergeleri({ gelir, aylikTaksit, toplamBorc, kartBorcu, kartLimiti }) {
  const dti = gelir > 0 ? (aylikTaksit / gelir) * 100 : null;              // taksit / gelir
  const borcGelir = gelir > 0 ? toplamBorc / gelir : null;                 // kaç aylık gelire eşit
  const kartKullanim = kartLimiti > 0 ? (kartBorcu / kartLimiti) * 100 : null;
  const seviye = (deger, iyi, orta) => (deger == null ? "yok" : deger <= iyi ? "iyi" : deger <= orta ? "orta" : "kotu");
  return {
    dti,
    dtiSeviye: seviye(dti, 35, 50),
    borcGelir,
    borcGelirSeviye: seviye(borcGelir, 6, 12),
    kartKullanim,
    kartKullanimSeviye: seviye(kartKullanim, 30, 60),
  };
}

export const SEVIYE_RENK = { iyi: "#34d399", orta: "#fbbf24", kotu: "#fb7185", yok: "#64748b" };
