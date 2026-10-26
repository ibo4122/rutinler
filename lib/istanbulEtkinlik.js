// İstanbul Rehberi — ETKİNLİK, GECE HAYATI ve KAYNAK DOĞRULAMA katmanı.
//
// NEDEN VAR: Eski sürümde "Konser", "After", "DJ", "Canlı müzik" gibi seçimler
// mekân açıklamalarında kelime arayarak (sahne, caz, geç saat…) eşleşiyordu.
// Sonuç: "Konser"de restoranlar, "After"da gece açık kaburgacılar çıkıyordu.
// Artık bu seçimler yalnızca aşağıdaki YAPISAL alanlara bakar:
//
//   m.etkinlikler  [{ id, guven, kaynak, tarih, not }]  — ne tür etkinlik var
//   m.turler       "kulup" ve "sahne" türü yalnızca bu dosyada kanıtla verilir
//   m.kaynaklar    kaydın dayandığı kaynaklar (adres, tarih, ne için kullanıldığı)
//   m.gorselKoken  görselin geldiği sayfa ve başlık; eşleşmeyen görsel gösterilmez
//
// GÜVEN DÜZEYİ (kaynağın tarihine ve türüne göre otomatik):
//   yuksek  2026 tarihli etkinlik takvimi / bilet sayfası ya da 2026 yayını
//   orta    son iki yıl içindeki (2025–2026) yayın ya da mekânın kendi sitesi
//   dusuk   tarihsiz ya da eski yayın, ya da yalnızca rehber notu
// Etkinlik süzgeçleri varsayılan olarak "orta" ve üstünü kullanır; düşük güvenli
// bilgiler kullanıcı isterse "doğrulanmamış" etiketiyle ve düşük puanla gelir.
//
// TANIMLAR (birbirine karışmaz):
//   konser  Biletli/programlı konserlerin yapıldığı sahne — işi müzik olan mekân
//   canli   Düzenli canlı performans (caz, akustik, grup, fasıl dahil)
//   dj      Düzenli DJ setleri
//   dans    Dans pisti ya da dansa dönüşen gece; fasıl ve sahne şovu dahil
//   after   Kulüp gecesinin 04:00 ve sonrasına sürdüğü belgelenmiş mekân
//   ("Geç saat" ≠ after: gece geç saate kadar yemek veren yer Plan Türü'ndeki
//    "Geç Saat Planı"na girer, "After"a değil.)

export const VERI_TARIHI = "2026-10";

export const ETKINLIK_TURLERI = [
  { id: "konser", ad: "Konser", ikon: "🎤", tanim: "Programlı konserlerin yapıldığı sahne" },
  { id: "canli", ad: "Canlı müzik", ikon: "🎷", tanim: "Düzenli canlı performans" },
  { id: "dj", ad: "DJ", ikon: "🎧", tanim: "Düzenli DJ setleri" },
  { id: "dans", ad: "Dans & şov", ikon: "💃", tanim: "Dans pisti, fasıl ya da sahne şovu" },
  { id: "after", ad: "After", ikon: "🌙", tanim: "Gece 04:00 ve sonrasına süren kulüp gecesi" },
];
export const etkinlikTuruBul = (id) => ETKINLIK_TURLERI.find((e) => e.id === id) || null;

// ---------------------------------------------------------------------------
// KAYNAK SİCİLİ — kod içinde yalnızca bu kimliklerle anılır.
// ---------------------------------------------------------------------------
export const KAYNAKLAR = {
  michelin: { ad: "Michelin Rehberi", tur: "rehber" },
  timeout: { ad: "Time Out İstanbul", tur: "yayin" },
  oggusto: { ad: "OGGUSTO", tur: "yayin" },
  yemekcom: { ad: "yemek.com", tur: "yayin" },
  oksijen: { ad: "Gazete Oksijen", tur: "yayin" },
  songkick: { ad: "Songkick etkinlik takvimi", tur: "takvim" },
  technoairlines: { ad: "Techno Airlines kulüp sayfası", tur: "takvim" },
  site: { ad: "Mekânın kendi sitesi", tur: "resmi" },
  editoryal: { ad: "Rehber notu", tur: "editoryal" },
};

const OKSIJEN = { k: "oksijen", url: "https://gazeteoksijen.com/gastronomi/istanbulun-en-iyi-canli-muzik-mekanlari-245994", tarih: "2026-06" };

export function guvenHesapla(kaynak, tarih) {
  const t = KAYNAKLAR[kaynak]?.tur;
  const yil = tarih ? Number(String(tarih).slice(0, 4)) : 0;
  if ((t === "takvim" || t === "yayin" || t === "rehber") && yil >= 2026) return "yuksek";
  if (t === "resmi" || (t === "takvim" && yil >= 2025) || (t === "yayin" && yil >= 2025)) return "orta";
  return "dusuk";
}
export const GUVEN_SIRA = { yuksek: 3, orta: 2, dusuk: 1 };
export const GUVEN_AD = { yuksek: "Doğrulandı", orta: "Kaynaklı", dusuk: "Doğrulanmamış" };

// ---------------------------------------------------------------------------
// ELLE DOĞRULANMIŞ GECE HAYATI KAYITLARI
// e: [etkinlik, kaynak, not]  (kaynak: k/url/tarih)
// tur: bu kaynaklarla verilen tür (kulup = gece kulübü, sahne = konser sahnesi)
// ---------------------------------------------------------------------------
const SK = (yol, tarih) => ({ k: "songkick", url: `https://www.songkick.com/venues/${yol}`, tarih });

export const GECE_KAYITLARI = {
  kleinphonix: { tur: ["kulup"], e: [
    ["dj", { k: "technoairlines", url: "https://www.technoairlines.com/club/klein-phonix-istanbul", tarih: "2026-10" }, "Uluslararası DJ'lerle elektronik/techno geceleri"],
    ["after", { k: "technoairlines", url: "https://www.technoairlines.com/club/klein-phonix-istanbul", tarih: "2026-10" }, "Programda 22:00–05:00 süren geceler var (ör. 20 Kasım 2026)"],
    ["dans", { k: "technoairlines", url: "https://www.technoairlines.com/club/klein-phonix-istanbul", tarih: "2026-10" }, "4.000 kişilik iki sahneli dans kulübü"],
  ] },
  kastel: { tur: ["kulup"], e: [
    ["dj", SK("4364561-kastel", "2026-05"), "DJ geceleri (ör. Rebūke, 2 Mayıs 2026)"],
    ["konser", SK("4364561-kastel", "2026-10"), "Takvimde Kasım 2026 ve Ocak 2027 konserleri"],
    ["dans", SK("4364561-kastel", "2026-05"), "Sahil kulübü; DJ gecelerinde dans pisti"],
  ] },
  babylon: { tur: ["sahne"], e: [
    ["konser", OKSIJEN, "İndie, elektronik, caz ve alternatif konser programı"],
    ["canli", OKSIJEN, "Yıl boyu yerli ve yabancı sahne programı"],
  ] },
  kadikoysahne: { tur: ["sahne"], e: [["konser", OKSIJEN, "Rock, indie, alternatif konserler"], ["canli", OKSIJEN, "Düzenli konser programı"]] },
  zorlupsm: { tur: ["sahne"], e: [["konser", SK("2440569-zorlu-psm", "2026-10"), "Turkcell Sahnesi'nde 2026–2027 konserleri"]] },
  salon: { tur: ["sahne"], e: [["konser", { k: "songkick", url: "https://detour.songkick.com/venues/858006-salon-iksv", tarih: "2026-10" }, "İKSV'nin 400 kişilik konser salonu"]] },
  blind: { tur: ["sahne"], e: [["konser", { k: "songkick", url: "https://www.songkick.com/concerts/43329154-guncel-gursel-artiktay-at-blind", tarih: "2026-08" }, "Konser ve lansman sahnesi (Ağustos 2026 konseri)"]] },
  boaz: { tur: ["sahne"], e: [["konser", OKSIJEN, "Rock, pop, caz, elektronik ve Türkçe müzik konserleri"], ["canli", OKSIJEN, "Düzenli sahne programı"]] },
  nardis: { tur: ["sahne"], e: [["canli", OKSIJEN, "Haftanın çoğu günü canlı caz"]] },
  asakhai: { tur: ["sahne"], e: [["canli", OKSIJEN, "Yerli ve yabancı caz sanatçıları"]] },
  divine: { e: [["canli", OKSIJEN, "Akşam yemeği boyunca canlı caz"]] },
  pera77: { e: [["canli", OKSIJEN, "Caz geceleri ve özel performanslar"]] },
  sazzou: { e: [["canli", OKSIJEN, "Caz performansları"]] },
  bova: { e: [["canli", OKSIJEN, "Canlı müzik programı"]] },
  modakayikhane: { e: [["canli", OKSIJEN, "Caz, akustik, rock ve pop performansları"]] },
  risenfall: { e: [["canli", OKSIJEN, "Her gece canlı müzik"]] },
  sortie: { tur: ["kulup"], e: [["dj", OKSIJEN, "Özellikle yazın DJ performansları"], ["canli", OKSIJEN, "Yaz sezonunda canlı müzik"]] },
  korto: { tur: ["kulup"], e: [["canli", OKSIJEN, "Akşam canlı performans"], ["dj", OKSIJEN, "Gece ilerledikçe DJ setleri; gündüz restoran, gece kulüp"]] },
  dandy: { tur: ["kulup"], e: [["canli", OKSIJEN, "Akşam yemeğinde canlı performans"], ["dj", OKSIJEN, "Geç saatte DJ setleri"]] },
  anyarnavutkoy: { e: [["canli", OKSIJEN, "Küçük sahne programı, hafta sonu müzik"]] },
  alacatikafasi: { e: [["canli", OKSIJEN, "90'lar ve 2000'ler Türkçe pop canlı performanslar"], ["dans", OKSIJEN, "Grupla eşlik edilen, dansa dönen geceler"]] },
  gunay: { e: [["dans", OKSIJEN, "Fasıl ve oryantal sahne şovları"], ["canli", OKSIJEN, "Fasıl"]] },
  cahidepalazzo: { e: [["dans", OKSIJEN, "Dans ve müzikli yemekli şov"], ["canli", OKSIJEN, "Sahne müziği"]] },
  // Yalnızca tür doğrulaması: kulüp oldukları kendi kaynaklarında yazıyor; etkinlik
  // bilgisi rehber notundaki etiketlerden ve kaydın kaynağının güveninden gelir.
  gizlibahce: { tur: ["kulup"] },
  supermarket: { tur: ["kulup"] },
  clubalice: { tur: ["kulup"] },
  arkaoda: { tur: ["kulup"] },
  "360": { tur: ["kulup"] },
  oligark: { tur: ["kulup"] },
  because: { tur: ["kulup"] },
  hadikarakoy: { e: [["dans", { k: "site", url: "https://www.hadikarakoy.com.tr", tarih: null }, "Kendi tanımı: oturmak serbest, dans etmek de"]] },
};

// Kapanan ya da taşınan mekânlar: listelerde gösterilmez (yerine yenisi var).
export const KAPANAN = {
  klein: "Klein Harbiye'den ayrıldı; kulüp bugün Maslak'ta Klein Phönix adıyla çalışıyor (Time Out İstanbul).",
};

// ---------------------------------------------------------------------------
// ZENGİNLEŞTİRME — her kaydı tek tip veri modeline çevirir.
// ---------------------------------------------------------------------------
// Etiketten etkinlik çıkarımı: yalnızca rehber notunda AÇIKÇA yazılan etiketler
// (serbest metin taranmaz). Güven, kaydın kaynağının tarihine göre belirlenir.
const ETIKET_ETKINLIK = [
  [/^DJ$/i, "dj"], [/^Canlı (müzik|caz)$/i, "canli"], [/^Konser$/i, "konser"],
  [/^(Dans|Şov|Fasıl)$/i, "dans"],
];

export function mekaniZenginlestir(m, koken) {
  const kayit = GECE_KAYITLARI[m.id];
  const kaynaklar = (m.kaynaklar || koken?.kaynaklar || [{ k: "editoryal", url: null, alanlar: ["kayit"], tarih: null }])
    .map((q) => ({ ...q, ad: KAYNAKLAR[q.k]?.ad || q.k, guven: guvenHesapla(q.k, q.tarih) }));
  const anaKaynak = [...kaynaklar].sort((a, b) => GUVEN_SIRA[b.guven] - GUVEN_SIRA[a.guven])[0];

  const etkinlikler = [];
  if (kayit?.e) {
    for (const [id, q, not] of kayit.e) {
      etkinlikler.push({ id, kaynak: q.k, kaynakAd: KAYNAKLAR[q.k]?.ad, url: q.url, tarih: q.tarih, not, guven: guvenHesapla(q.k, q.tarih) });
      if (q.url && !kaynaklar.some((x) => x.url === q.url)) {
        kaynaklar.push({ k: q.k, ad: KAYNAKLAR[q.k]?.ad, url: q.url, alanlar: ["etkinlik"], tarih: q.tarih, guven: guvenHesapla(q.k, q.tarih) });
      }
    }
  } else {
    for (const e of m.etiketler) {
      const hit = ETIKET_ETKINLIK.find(([re]) => re.test(e));
      if (hit && !etkinlikler.some((x) => x.id === hit[1])) {
        etkinlikler.push({ id: hit[1], kaynak: anaKaynak.k, kaynakAd: anaKaynak.ad, url: anaKaynak.url, tarih: anaKaynak.tarih,
          not: `Rehber notunda "${e}" olarak geçiyor`, guven: anaKaynak.guven === "yuksek" && anaKaynak.k === "michelin" ? "dusuk" : anaKaynak.guven });
      }
    }
  }
  // Michelin bir restoranın DJ/canlı müzik yaptığını doğrulamaz: o kaynaktan gelen
  // etkinlik bilgisi düşük güvenlidir (yukarıda). "kulup" ve "sahne" türü yalnızca
  // elle doğrulanmış kayıtta verilir; sınıflandırıcıdan gelen "kulup" düşer.
  const turler = [...m.turler.filter((t) => t !== "kulup" && t !== "sahne"), ...(kayit?.tur || [])];
  if (!turler.length) turler.push("restoran");

  const gorselGecerli = Boolean(m.gorsel && (m.gorselKoken?.eslesme ?? koken?.gorsel?.eslesme) === true);
  // Türün güveni: elle kaydın etkinlik kanıtlarının en iyisi, yoksa kaydın kaynağı.
  const turGuven = kayit?.e
    ? etkinlikler.reduce((g, e) => (GUVEN_SIRA[e.guven] > GUVEN_SIRA[g] ? e.guven : g), "dusuk")
    : anaKaynak.guven;
  return {
    ...m,
    turler,
    turGuven,
    // Etkinlik ayrı bir eksen: atmosfer etiketlerinden "canlı müzik" çıkarıldı.
    ozellikler: m.ozellikler.filter((o) => o !== "canli"),
    etkinlikler,
    kaynaklar,
    gorselKoken: m.gorselKoken || koken?.gorsel || null,
    gorsel: gorselGecerli ? m.gorsel : null,
    kapandi: KAPANAN[m.id] || null,
  };
}

// m bu etkinliği en az bu güvenle taşıyor mu?
export function etkinlikVar(m, id, dusukDahil = false) {
  const esik = dusukDahil ? 1 : 2;
  return m.etkinlikler.some((e) => e.id === id && GUVEN_SIRA[e.guven] >= esik);
}
export const etkinlikBul = (m, id) =>
  [...m.etkinlikler].filter((e) => e.id === id).sort((a, b) => GUVEN_SIRA[b.guven] - GUVEN_SIRA[a.guven])[0] || null;
