// İstanbul Rehberi — süzgeç ve sıralama (arayüzden bağımsız, test edilebilir).
//
// Bir mekân ancak SEÇİLEN HER EKSENDE kanıtla uyuyorsa sonuca girer:
//   tür/mutfak/atmosfer kategorileri  → yapısal alanlar ve birebir etiketler
//   etkinlik kategorileri (konser, DJ, after, canlı müzik, dans)
//                                     → kaynaklı etkinlik kaydı; varsayılan olarak
//                                       en az "orta" güven (bkz. istanbulEtkinlik.js)
//   plan türü                         → planUyum ≥ PLAN_ESIK (her seçili plan için)
//   semt, fiyat, rezervasyon, uzaklık, puan
// Arama yalnızca ad, semt, bölge, imza, etiket, tür, yemek ve kategori adlarında
// yapılır; arama sonucu bir kategoriye "benzediği" için kategoriye eklenmez.

import { TURLER, BOLGELER, MEKANLAR, ONERILER, turBul, yemekBul } from "./istanbul";
import {
  KATEGORILER, kategoriBul, planUyum, PLAN_ESIK, skorHesapla, rezervasyon, mesafeKm, acikMi,
  michelinMi, michelinKategoriMi,
} from "./istanbulSkor";

export const BOS_FILTRE = {
  arama: "", kategoriler: [], planlar: [], semtler: [], fiyatlar: [], acik: false,
  rezervasyon: "hepsi", uzaklik: 0, minPuan: 0, minGoogle: 0, minYorum: 0, liste: null, tumu: false,
  dogrulanmamis: false,
};

export const sade = (s) => String(s || "").toLocaleLowerCase("tr")
  .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a");
const bolgeBul = (id) => BOLGELER.find((b) => b.id === id) || null;

// Arama dizini bir kez kurulur.
export const DIZIN = Object.fromEntries(MEKANLAR.map((m) => [m.id, sade([
  m.ad, m.semt, bolgeBul(m.bolge)?.ad, m.imza, m.etiketler.join(" "),
  m.turler.map((t) => turBul(t)?.ad).join(" "), m.yemekler.map((y) => yemekBul(y)?.ad).join(" "),
  KATEGORILER.filter((k) => k.test(m)).map((k) => k.ad).join(" "),
].join(" "))]));

// "haric": sayım yaparken o eksen yok sayılır (seçenek yanındaki sayılar için).
export function eslesir(m, f, ctx = { g: {}, googleAktif: false, konum: null }, haric) {
  const g = ctx.g?.[m.id];
  const o = { dusukDahil: Boolean(f.dogrulanmamis) };
  if (f.liste && haric !== "liste" && !ONERILER.find((x) => x.id === f.liste)?.liste.some(([id]) => id === m.id)) return false;
  if (f.arama.trim() && haric !== "arama") {
    const kelimeler = sade(f.arama).split(/\s+/).filter(Boolean);
    if (!kelimeler.every((k) => (DIZIN[m.id] || sade(m.ad)).includes(k))) return false;
  }
  // Michelin ayrı bir dünya: Michelin türü seçilmedikçe genel listelerde yok
  // (adıyla arandığında ve hazır listelerde bulunur).
  const mk = f.kategoriler.filter(michelinKategoriMi);
  const nk = f.kategoriler.filter((id) => !michelinKategoriMi(id));
  if (haric !== "kategori") {
    if (mk.length && !mk.some((id) => kategoriBul(id)?.test(m, o))) return false;
    if (nk.length && !nk.some((id) => kategoriBul(id)?.test(m, o))) return false;
  }
  if (michelinMi(m) && !mk.length && !f.liste && haric !== "kategori") {
    const ara = sade(f.arama.trim());
    if (!ara || !sade(m.ad).includes(ara)) return false;
  }
  if (f.planlar.length && haric !== "plan" && !f.planlar.every((p) => planUyum(m, p) >= PLAN_ESIK)) return false;
  if (f.semtler.length && haric !== "semt" && !f.semtler.includes(m.bolge)) return false;
  if (f.fiyatlar.length && haric !== "fiyat" && !f.fiyatlar.includes(m.fiyat)) return false;
  if (f.acik && haric !== "acik" && ctx.googleAktif && acikMi(g?.periyotlar) !== true) return false;
  if (f.rezervasyon !== "hepsi" && haric !== "rezervasyon") {
    const r = rezervasyon(m, g).id;
    if (f.rezervasyon === "gerekmez" ? r !== "gerekmez" : r === "gerekmez") return false;
  }
  if (f.uzaklik && haric !== "uzaklik" && ctx.konum) {
    const d = mesafeKm(ctx.konum, m, g);
    if (d && d.km > f.uzaklik) return false;
  }
  if (f.minPuan && haric !== "puan" && m.puan < f.minPuan) return false;
  if (ctx.googleAktif && haric !== "puan") {
    if (f.minGoogle && !(g?.puan >= f.minGoogle)) return false;
    if (f.minYorum && !((g?.yorum || 0) >= f.minYorum)) return false;
  }
  return true;
}

export const aktifSayisi = (f) =>
  f.kategoriler.length + f.planlar.length + f.semtler.length + f.fiyatlar.length + (f.acik ? 1 : 0) +
  (f.rezervasyon !== "hepsi" ? 1 : 0) + (f.uzaklik ? 1 : 0) + (f.minPuan ? 1 : 0) + (f.minGoogle ? 1 : 0) + (f.minYorum ? 1 : 0) +
  (f.liste ? 1 : 0) + (f.arama.trim() ? 1 : 0) + (f.dogrulanmamis ? 1 : 0);
export const panelSayisi = (f) => f.fiyatlar.length + (f.acik ? 1 : 0) + (f.rezervasyon !== "hepsi" ? 1 : 0) + (f.uzaklik ? 1 : 0) +
  (f.minPuan ? 1 : 0) + (f.minGoogle ? 1 : 0) + (f.minYorum ? 1 : 0) + (f.dogrulanmamis ? 1 : 0);

// Sıralama: önce zayıf olmayanlar (düşük Google puanı / yalnızca doğrulanmamış
// bilgiyle eşleşme sona), sonra seçilen ölçüt, eşitlikte Uygulama Skoru.
export const SIRALAMALAR = {
  skor: (a, b) => b.skor.toplam - a.skor.toplam || b.m.puan - a.m.puan || a.m.ad.localeCompare(b.m.ad, "tr"),
  google: (a, b) => (b.g?.puan || 0) - (a.g?.puan || 0) || b.skor.toplam - a.skor.toplam,
  ucuz: (a, b) => a.m.fiyat - b.m.fiyat || b.skor.toplam - a.skor.toplam,
  pahali: (a, b) => b.m.fiyat - a.m.fiyat || b.skor.toplam - a.skor.toplam,
  yakin: (a, b) => (a.mesafe?.km ?? 999) - (b.mesafe?.km ?? 999) || b.skor.toplam - a.skor.toplam,
};

export function sonuclariHesapla(f, ctx = { g: {}, googleAktif: false, konum: null }, sirala = "skor", liste = MEKANLAR) {
  const s = SIRALAMALAR[sirala] || SIRALAMALAR.skor;
  return liste.filter((m) => eslesir(m, f, ctx)).map((m) => {
    const g = ctx.g?.[m.id];
    return { m, g, skor: skorHesapla(m, f, g), mesafe: ctx.konum ? mesafeKm(ctx.konum, m, g) : null };
  }).sort((a, b) => (a.skor.zayif - b.skor.zayif) || s(a, b));
}

// Doğrulanmamış bilgiler de sayılsaydı kaç sonuç daha gelirdi?
export function dogrulanmamisFarki(f, ctx) {
  if (f.dogrulanmamis) return 0;
  const once = MEKANLAR.filter((m) => eslesir(m, f, ctx)).length;
  return MEKANLAR.filter((m) => eslesir(m, { ...f, dogrulanmamis: true }, ctx)).length - once;
}

export const GENEL_MEKANLAR = MEKANLAR.filter((m) => !michelinMi(m));
export { TURLER };
