// Uçak bileti ve otel fiyatı tazeleme ucu.
//
// NEDEN BÖYLE: Uçak bileti günde birkaç kez değişiyor, otel fiyatı da doluluğa
// göre oynuyor. Sabit bir rakam yazmak bir süre sonra yanıltıyor. Bu uç, aynı
// rota için gün içinde birkaç kez tazelenen bir fiyat döndürür ve fiyatın
// NEREDEN geldiğini açıkça söyler.
//
// İKİ KAYNAK VAR:
//   1) "amadeus" — AMADEUS_API_KEY ve AMADEUS_API_SECRET ortam değişkenleri
//      tanımlıysa Amadeus Self-Service API'sinden GERÇEK fiyat çekilir.
//      (Ücretsiz katman mevcut; developers.amadeus.com üzerinden alınır.)
//   2) "tahmin" — anahtar yoksa, kalkışa kalan süre, sezon ve haftanın günü
//      üzerinden hesaplanan bir TAHMİN döner. Bunlar uydurma değil, bilet
//      fiyatlandırmasının bilinen davranışları; ama gerçek fiyat değildir ve
//      arayüzde bu şekilde etiketlenir.
//
// Önbellek: aynı rota + tarih için sonuç 8 saat tutulur. Böylece fiyat günde
// yaklaşık üç kez tazelenir; kullanıcı "yenile" derse önbellek atlanır.

export const dynamic = "force-dynamic";

const IATA = {
  roma: "FCO", floransa: "FLR", venedik: "VCE", napoli: "NAP", milano: "MXP",
  paris: "CDG", nice: "NCE", barselona: "BCN", madrid: "MAD", sevilla: "SVQ",
  lizbon: "LIS", porto: "OPO", londra: "LHR", edinburgh: "EDI", prag: "PRG",
  budapeste: "BUD", viyana: "VIE", krakow: "KRK", varsova: "WAW", amsterdam: "AMS",
  brugge: "BRU", berlin: "BER", munih: "MUC", zurih: "ZRH", kopenhag: "CPH",
  stockholm: "ARN", atina: "ATH", dubrovnik: "DBV", belgrad: "BEG", saraybosna: "SJJ",
  tiflis: "TBS", baku: "GYD", semerkant: "SKD", dubai: "DXB", tokyo: "HND",
  kyoto: "KIX", seul: "ICN", singapur: "SIN", bangkok: "BKK", bali: "DPS",
  kahire: "CAI", marakes: "RAK", newyork: "JFK",
  // Hallstatt'ın havalimanı yok → Salzburg; Heidelberg'in yok → Frankfurt.
  salzburg: "SZG", hallstatt: "SZG", heidelberg: "FRA", stuttgart: "STR",
};

const KALKIS = "IST";
const ONBELLEK = new Map();          // anahtar -> { veri, zaman }
const TTL = 8 * 60 * 60 * 1000;      // 8 saat ≈ günde 3 tazeleme

const gunFarki = (iso) => {
  const h = new Date(iso + "T12:00:00");
  if (Number.isNaN(h.getTime())) return 45;
  return Math.max(0, Math.round((h - Date.now()) / 86400000));
};

// Kalkışa kalan süreye göre fiyat eğrisi. Son dakika pahalı, çok erken de
// her zaman en ucuz değil; en iyi aralık genelde 3 hafta–3 ay arası.
function vadeCarpani(gun) {
  if (gun <= 3) return 2.1;
  if (gun <= 7) return 1.75;
  if (gun <= 14) return 1.4;
  if (gun <= 21) return 1.18;
  if (gun <= 60) return 1.0;
  if (gun <= 120) return 0.88;
  return 0.84;
}

// Sezon: yaz ve yılbaşı zirve, ilkbahar/sonbahar orta, kış dibi.
function sezonCarpani(iso) {
  const h = new Date(iso + "T12:00:00");
  if (Number.isNaN(h.getTime())) return 1;
  const ay = h.getMonth() + 1, gun = h.getDate();
  if ((ay === 12 && gun >= 18) || (ay === 1 && gun <= 6)) return 1.38;
  if (ay >= 6 && ay <= 8) return 1.32;
  if (ay === 4 || ay === 5 || ay === 9 || ay === 10) return 1.05;
  return 0.86;
}

// Cuma ve pazar kalkışları pahalı, salı-çarşamba ucuz.
function gunCarpani(iso) {
  const h = new Date(iso + "T12:00:00");
  if (Number.isNaN(h.getTime())) return 1;
  const g = h.getDay();
  if (g === 5 || g === 0) return 1.12;
  if (g === 2 || g === 3) return 0.92;
  return 1;
}

// --- Amadeus ---------------------------------------------------------------
let amadeusJeton = null; // { token, bitis }

async function amadeusJetonAl() {
  const id = process.env.AMADEUS_API_KEY;
  const sifre = process.env.AMADEUS_API_SECRET;
  if (!id || !sifre) return null;
  if (amadeusJeton && amadeusJeton.bitis > Date.now() + 30000) return amadeusJeton.token;

  const r = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(sifre)}`,
    cache: "no-store",
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (!j.access_token) return null;
  amadeusJeton = { token: j.access_token, bitis: Date.now() + (j.expires_in || 1700) * 1000 };
  return amadeusJeton.token;
}

async function amadeusUcus(iata, tarih, donus, kisi) {
  const token = await amadeusJetonAl();
  if (!token) return null;
  const url = new URL("https://api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.set("originLocationCode", KALKIS);
  url.searchParams.set("destinationLocationCode", iata);
  url.searchParams.set("departureDate", tarih);
  if (donus) url.searchParams.set("returnDate", donus);
  url.searchParams.set("adults", String(Math.max(1, Math.min(9, kisi))));
  url.searchParams.set("currencyCode", "TRY");
  url.searchParams.set("max", "5");
  url.searchParams.set("nonStop", "false");

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json();
  const teklifler = (j.data || [])
    .map((t) => Number(t.price?.grandTotal || t.price?.total))
    .filter((x) => Number.isFinite(x) && x > 0)
    .sort((a, b) => a - b);
  if (!teklifler.length) return null;
  // Kişi başı: Amadeus toplam fiyat döndürüyor.
  return { kisiBasi: Math.round(teklifler[0] / Math.max(1, kisi)), enDusuk: Math.round(teklifler[0]) };
}

async function amadeusOtel(iata, tarih, donus, kisi) {
  const token = await amadeusJetonAl();
  if (!token) return null;
  const liste = new URL("https://api.amadeus.com/v1/reference-data/locations/hotels/by-city");
  liste.searchParams.set("cityCode", iata);
  liste.searchParams.set("radius", "20");
  liste.searchParams.set("radiusUnit", "KM");
  const lr = await fetch(liste, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!lr.ok) return null;
  const lj = await lr.json();
  const idler = (lj.data || []).slice(0, 40).map((h) => h.hotelId).filter(Boolean);
  if (!idler.length) return null;

  const teklif = new URL("https://api.amadeus.com/v3/shopping/hotel-offers");
  teklif.searchParams.set("hotelIds", idler.join(","));
  teklif.searchParams.set("checkInDate", tarih);
  if (donus) teklif.searchParams.set("checkOutDate", donus);
  teklif.searchParams.set("adults", String(Math.max(1, Math.min(4, kisi))));
  teklif.searchParams.set("currency", "TRY");
  const tr = await fetch(teklif, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!tr.ok) return null;
  const tj = await tr.json();

  const geceler = (tj.data || [])
    .map((h) => {
      const o = h.offers?.[0];
      const toplam = Number(o?.price?.total);
      const gece = Math.max(1, Number(o?.checkOutDate && o?.checkInDate
        ? (new Date(o.checkOutDate) - new Date(o.checkInDate)) / 86400000 : 1));
      return Number.isFinite(toplam) ? toplam / gece : null;
    })
    .filter((x) => x && x > 0)
    .sort((a, b) => a - b);
  if (geceler.length < 3) return null;

  // Yüzdeliklerle segmentleme: en ucuz %25 ekonomi, orta %50 konfor, üst %25 lüks.
  const yuzdelik = (p) => geceler[Math.min(geceler.length - 1, Math.floor(geceler.length * p))];
  return {
    ekonomi: Math.round(yuzdelik(0.15)),
    konfor: Math.round(yuzdelik(0.5)),
    luks: Math.round(yuzdelik(0.85)),
    ornekSayisi: geceler.length,
  };
}

// --- Uç nokta ---------------------------------------------------------------
export async function GET(istek) {
  const q = new URL(istek.url).searchParams;
  const sehir = q.get("sehir") || "";
  const tarih = q.get("tarih") || "";
  const donus = q.get("donus") || "";
  const kisi = Math.max(1, Number(q.get("kisi") || 1));
  const tabanUcus = Number(q.get("tabanUcus") || 0);
  const tabanOtel = {
    ekonomi: Number(q.get("ekonomi") || 0),
    konfor: Number(q.get("konfor") || 0),
    luks: Number(q.get("luks") || 0),
  };
  const zorla = q.get("zorla") === "1";

  const iata = IATA[sehir];
  if (!iata || !tarih) {
    return Response.json({ hata: "sehir ve tarih gerekli" }, { status: 400 });
  }

  const anahtar = `${sehir}|${tarih}|${donus}|${kisi}`;
  const onbellek = ONBELLEK.get(anahtar);
  if (!zorla && onbellek && Date.now() - onbellek.zaman < TTL) {
    return Response.json({ ...onbellek.veri, onbellekten: true });
  }

  const gun = gunFarki(tarih);
  const carpan = vadeCarpani(gun) * sezonCarpani(tarih) * gunCarpani(tarih);

  let ucus = null, otel = null, kaynak = "tahmin", uyari = null;

  try {
    const [au, ao] = await Promise.all([
      amadeusUcus(iata, tarih, donus, kisi).catch(() => null),
      amadeusOtel(iata, tarih, donus, kisi).catch(() => null),
    ]);
    if (au) { ucus = au.kisiBasi; kaynak = "amadeus"; }
    if (ao) otel = ao;
  } catch {
    uyari = "Canlı fiyat servisine ulaşılamadı; tahmin kullanıldı.";
  }

  if (ucus == null && tabanUcus > 0) ucus = Math.round(tabanUcus * carpan);
  if (!otel) {
    const o = sezonCarpani(tarih) * (gunCarpani(tarih) > 1 ? 1.08 : 1);
    otel = {
      ekonomi: tabanOtel.ekonomi ? Math.round(tabanOtel.ekonomi * o * 100) / 100 : null,
      konfor: tabanOtel.konfor ? Math.round(tabanOtel.konfor * o * 100) / 100 : null,
      luks: tabanOtel.luks ? Math.round(tabanOtel.luks * o * 100) / 100 : null,
      ornekSayisi: 0,
    };
  }

  const veri = {
    sehir, iata, tarih, donus, kisi,
    ucus: { kisiBasiTL: ucus, kaynak, carpan: Math.round(carpan * 100) / 100 },
    konaklama: { ...otel, kaynak: otel.ornekSayisi ? "amadeus" : "tahmin" },
    bagvarlar: {
      ucus: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${KALKIS} to ${iata} on ${tarih}${donus ? ` through ${donus}` : ""}`)}`,
      otel: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(sehir)}&checkin=${tarih}${donus ? `&checkout=${donus}` : ""}&group_adults=${kisi}`,
    },
    gunKaldi: gun,
    guncellendi: new Date().toISOString(),
    uyari,
  };

  ONBELLEK.set(anahtar, { veri, zaman: Date.now() });
  // Önbellek sınırsız büyümesin.
  if (ONBELLEK.size > 400) {
    const enEski = [...ONBELLEK.entries()].sort((a, b) => a[1].zaman - b[1].zaman)[0];
    if (enEski) ONBELLEK.delete(enEski[0]);
  }

  return Response.json(veri);
}
