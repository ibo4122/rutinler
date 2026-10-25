// Seyahat Defteri'nin "yer" katmanı.
//
// Defterdeki bir kayıt dört farklı şeye işaret edebilir:
//   sehirId → Keşfet kataloğundaki dünya şehri (Roma, Tokyo…)
//   ilId    → Türkiye Rehberi'ndeki il (Kars, Mardin…)
//   turId   → Türkiye bölgesel turu (Doğu Anadolu Büyük Tur…)
//   ozel    → kataloğun dışında, kullanıcının kendi yazdığı yer
//
// Ekranlar bu dört türü ayrı ayrı bilmesin diye her kayıt buradan tek bir
// biçime çözülür: { anahtar, tip, ad, alt, ulke, bayrak, gorsel, renk }.

import { SEHIRLER } from "./destinasyonlar";
import { ILLER, bolgeBul } from "./turkiye";
import { TURLAR } from "./turkiyeTurlari";

const sade = (s) =>
  String(s || "").toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a");

export function yerCoz(k) {
  if (!k) return null;
  if (k.sehirId) {
    const s = SEHIRLER.find((x) => x.id === k.sehirId);
    if (s) return { anahtar: `sehir:${s.id}`, tip: "sehir", ad: s.ad, alt: s.ulke, ulke: s.ulke, bayrak: s.bayrak, gorsel: s.gorseller?.[0] || null, renk: s.renk };
  }
  if (k.ilId) {
    const i = ILLER.find((x) => x.id === k.ilId);
    if (i) {
      const b = bolgeBul(i.bolge);
      return { anahtar: `il:${i.id}`, tip: "il", ad: i.ad, alt: `${b?.ad || ""} · ${String(i.plaka).padStart(2, "0")}`, ulke: "Türkiye", bayrak: "🇹🇷", gorsel: i.gorseller?.[0] || null, renk: b?.renk || "#e11d48", plaka: i.plaka };
    }
  }
  if (k.turId) {
    const t = TURLAR.find((x) => x.id === k.turId);
    if (t) {
      const ilk = ILLER.find((x) => x.id === t.gunler[0]?.il);
      return { anahtar: `tur:${t.id}`, tip: "tur", ad: t.ad, alt: t.alt, ulke: "Türkiye", bayrak: "🇹🇷", gorsel: ilk?.gorseller?.[0] || null, renk: t.renk };
    }
  }
  if (k.ozel?.ad) {
    return { anahtar: `ozel:${k.ozel.ad}|${k.ozel.ulke || ""}`, tip: "ozel", ad: k.ozel.ad, alt: k.ozel.ulke || "", ulke: k.ozel.ulke || "", bayrak: "📍", gorsel: null, renk: "#d6a756" };
  }
  return { anahtar: "bilinmiyor", tip: "ozel", ad: "Bilinmeyen yer", alt: "", ulke: "", bayrak: "📍", gorsel: null, renk: "#94a3b8" };
}

// Seçici listesi: Defter'den doğrudan eklerken aranacak tüm yerler.
export const YER_SECENEKLERI = [
  ...ILLER.map((i) => ({ ref: { ilId: i.id }, ...yerCoz({ ilId: i.id }), grup: "Türkiye'de bir il" })),
  ...TURLAR.map((t) => ({ ref: { turId: t.id }, ...yerCoz({ turId: t.id }), grup: "Türkiye turu" })),
  ...SEHIRLER.map((s) => ({ ref: { sehirId: s.id }, ...yerCoz({ sehirId: s.id }), grup: "Dünya şehri" })),
];

const INDEKS = YER_SECENEKLERI.map((y) => ({ y, metin: sade(`${y.ad} ${y.alt} ${y.ulke}`) }));

export function yerAra(terim, limit = 12) {
  const t = sade(terim).trim();
  if (!t) return [];
  return INDEKS
    .map(({ y, metin }) => ({ y, i: metin.indexOf(t) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i || a.y.ad.length - b.y.ad.length)
    .slice(0, limit)
    .map((x) => x.y);
}

// Türkiye'de gezilmiş iller: doğrudan il kaydı + gidilmiş turların tüm illeri.
export function gezilenIller(planlar) {
  const set = new Set();
  for (const p of planlar || []) {
    if (p.durum !== "gidildi") continue;
    if (p.ilId) set.add(p.ilId);
    if (p.turId) {
      const t = TURLAR.find((x) => x.id === p.turId);
      t?.gunler.forEach((g) => set.add(g.il));
    }
  }
  return set;
}

// Gezilmiş ülkeler: dünya şehirleri + özel kayıtların ülkeleri + Türkiye.
export function gezilenUlkeler(planlar) {
  const set = new Set();
  for (const p of planlar || []) {
    if (p.durum !== "gidildi") continue;
    const y = yerCoz(p);
    if (y?.ulke) set.add(y.ulke);
  }
  return set;
}
