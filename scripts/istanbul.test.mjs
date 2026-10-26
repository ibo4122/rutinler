// İstanbul Rehberi — veri ve süzgeç kontrolleri.
// Çalıştır: npm test   (node --import ./scripts/uzanti-kancasi.mjs --test scripts/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { MEKANLAR, TUM_MEKANLAR, TURLER, BOLGELER } from "../lib/istanbul.js";
import { BOS_FILTRE, sonuclariHesapla, eslesir } from "../lib/istanbulFiltre.js";
import { kategoriBul, planUyum, PLAN_ESIK, KATEGORILER } from "../lib/istanbulSkor.js";
import { GECE_KAYITLARI, GUVEN_SIRA } from "../lib/istanbulEtkinlik.js";

const ctx = { g: {}, googleAktif: false, konum: null };
const sec = (kategoriler, ek = {}) => sonuclariHesapla({ ...BOS_FILTRE, kategoriler, ...ek }, ctx).map((x) => x.m);
const idler = (l) => l.map((m) => m.id);
const bul = (id) => TUM_MEKANLAR.find((m) => m.id === id);
// Yemek ağırlıklı türler: bunlardan biri ANA türse ve kulüp/sahne/eğlence değilse
// "after" ya da "konser" sonucunda olmamalı.
const YEMEK_TURLERI = ["fine", "restoran", "lokanta", "sokak", "kafe", "meyhane"];
const yemekMekani = (m) => YEMEK_TURLERI.includes(m.turler[0]) && !m.turler.some((t) => ["kulup", "sahne", "eglence"].includes(t));

test("After: yemek mekânı çıkmaz, yalnızca kanıtlı after gecesi olan kulüpler gelir", () => {
  const l = sec(["after"]);
  assert.ok(l.length > 0, "en az bir doğrulanmış after mekânı olmalı");
  for (const m of l) {
    assert.ok(!yemekMekani(m), `${m.ad} bir yemek mekânı, After'da olmamalı`);
    const e = m.etkinlikler.find((x) => x.id === "after");
    assert.ok(e && GUVEN_SIRA[e.guven] >= 2, `${m.ad}: after kanıtı yok ya da doğrulanmamış`);
    assert.ok(e.url, `${m.ad}: after kanıtının kaynak bağlantısı yok`);
  }
  assert.ok(!idler(l).includes("kaburgacicabbar") && !l.some((m) => /Cabbar/.test(m.ad)), "Kaburgacı Cabbar After'da olmamalı");
  assert.ok(idler(l).includes("kleinphonix"), "Klein Phönix After'da olmalı");
});

test("Geç saat ≠ after: gece açık kaburgacı Geç Saat Planı'nda, After'da değil", () => {
  const cabbar = MEKANLAR.find((m) => /Cabbar/.test(m.ad));
  assert.ok(cabbar, "Kaburgacı Cabbar veride olmalı");
  assert.ok(planUyum(cabbar, "gec") >= PLAN_ESIK, "Geç Saat Planı'na uymalı");
  assert.equal(kategoriBul("after").test(cabbar), false);
  assert.equal(kategoriBul("after").test(cabbar, { dusukDahil: true }), false, "doğrulanmamışlar açıkken de After'a girmemeli");
});

test("Konser ve Etkinlik: yalnızca kaynaklı konser sahneleri; restoran yok", () => {
  const l = sec(["konser"]);
  assert.ok(l.length >= 5);
  for (const m of l) {
    assert.ok(!yemekMekani(m), `${m.ad} bir yemek mekânı, Konser'de olmamalı`);
    assert.ok(m.turler.some((t) => t === "sahne" || t === "kulup"), `${m.ad} sahne/kulüp değil`);
    const e = m.etkinlikler.find((x) => x.id === "konser");
    assert.ok(e?.url, `${m.ad}: konser kanıtının kaynağı yok`);
  }
  for (const id of ["ruby", "biz", "banyan", "latifehanim", "filbooks"]) {
    assert.ok(!idler(l).includes(id), `${id} Konser'de olmamalı`);
  }
  for (const id of ["babylon", "salon", "zorlupsm", "kadikoysahne"]) assert.ok(idler(l).includes(id), `${id} Konser'de olmalı`);
});

test("Gece kulüpleri: Klein Phönix ve Kastel var; DJ çalan bar kulüp sayılmaz", () => {
  const l = idler(sec(["kulup"]));
  assert.ok(l.includes("kleinphonix") && l.includes("kastel"));
  for (const id of ["hazine", "bina", "galatameyhanesi", "muaf", "zihni"]) assert.ok(!l.includes(id), `${id} kulüp olarak listelenmemeli`);
});

test("Birden çok geçerli kategori: Korto hem DJ hem Canlı Müzik; Babylon hem Konser hem Canlı Müzik", () => {
  const dj = idler(sec(["dj"])), canli = idler(sec(["canli"])), konser = idler(sec(["konser"]));
  assert.ok(dj.includes("korto") && canli.includes("korto"));
  assert.ok(konser.includes("babylon") && canli.includes("babylon"));
  // Çoklu seçim "herhangi biri" demektir: DJ + Konser birleşimi ikisinin de üst kümesi.
  const ikisi = idler(sec(["dj", "konser"]));
  for (const id of [...dj, ...konser]) assert.ok(ikisi.includes(id));
});

test("Doğrulanmamış bilgi varsayılan olarak etkinlik süzgecine girmez", () => {
  const varsayilan = idler(sec(["dj"]));
  const hepsi = idler(sec(["dj"], { dogrulanmamis: true }));
  assert.ok(hepsi.length >= varsayilan.length);
  for (const id of hepsi.filter((x) => !varsayilan.includes(x))) {
    const m = bul(id);
    assert.ok(m.etkinlikler.filter((e) => e.id === "dj").every((e) => GUVEN_SIRA[e.guven] < 2), `${id} doğrulanmış olduğu halde gizlenmiş`);
  }
  // Doğrulanmamış eşleşmeler sona sıralanır.
  const l = sonuclariHesapla({ ...BOS_FILTRE, kategoriler: ["dj"], dogrulanmamis: true }, ctx);
  const ilkZayif = l.findIndex((x) => x.skor.zayif);
  if (ilkZayif >= 0) assert.ok(l.slice(ilkZayif).every((x) => x.skor.zayif), "zayıf eşleşmeler arada kalmamalı");
});

test("Etkinlik kayıtları gerçek mekânlara bağlı ve her kanıtın kaynağı var", () => {
  for (const [id, k] of Object.entries(GECE_KAYITLARI)) {
    assert.ok(bul(id), `GECE_KAYITLARI'nda bilinmeyen mekân: ${id}`);
    for (const [, q] of k.e || []) assert.ok(q.k && (q.url || q.k === "site"), `${id}: kaynaksız kanıt`);
  }
});

test("Görsel, ad ve kaynak tutarlılığı", () => {
  const goruldu = new Map();
  for (const m of MEKANLAR) {
    if (!m.gorsel) continue;
    assert.equal(m.gorselKoken?.eslesme, true, `${m.ad}: kaynağı mekânla eşleşmeyen görsel gösteriliyor`);
    assert.ok(!goruldu.has(m.gorsel), `${m.ad} ve ${goruldu.get(m.gorsel)} aynı görseli kullanıyor`);
    goruldu.set(m.gorsel, m.ad);
  }
});

test("Veri modeli: tekil id, geçerli tür/bölge, en az bir kaynak", () => {
  const turIdleri = new Set(TURLER.map((t) => t.id));
  const bolgeIdleri = new Set(BOLGELER.map((b) => b.id));
  const ids = new Set();
  for (const m of TUM_MEKANLAR) {
    assert.ok(!ids.has(m.id), `tekrarlanan id: ${m.id}`);
    ids.add(m.id);
    assert.ok(m.turler.length && m.turler.every((t) => turIdleri.has(t)), `${m.id}: geçersiz tür ${m.turler}`);
    assert.ok(bolgeIdleri.has(m.bolge), `${m.id}: geçersiz bölge ${m.bolge}`);
    assert.ok(m.kaynaklar.length > 0, `${m.id}: kaynak yok`);
    for (const e of m.etkinlikler) assert.ok(["yuksek", "orta", "dusuk"].includes(e.guven));
  }
  assert.ok(!MEKANLAR.some((m) => m.id === "klein"), "taşınan Klein Harbiye listelerde olmamalı");
});

test("Her kategori yapısal alanla çalışır ve arama kategoriye sızmaz", () => {
  for (const k of KATEGORILER) assert.equal(typeof k.test(MEKANLAR[0]), "boolean", k.id);
  // "sahne" kelimesi geçen ama konser mekânı olmayan bir kayıt arama ile bulunur, Konser'e girmez.
  const l = sonuclariHesapla({ ...BOS_FILTRE, arama: "kaburga" }, ctx).map((x) => x.m);
  assert.ok(l.length > 0);
  assert.ok(l.every((m) => eslesir(m, { ...BOS_FILTRE, arama: "kaburga" }, ctx)));
});
