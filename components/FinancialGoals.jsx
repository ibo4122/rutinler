"use client";

import { useMemo, useState } from "react";
import { money } from "../lib/format";

// Hedef türleri — her tür kendi ekranına sahip. Tür seçilince ekran o türe göre kurulur.
const GOAL_TYPES = [
  { id: "konut", label: "Konut", icon: "🏠", ready: true },
  { id: "arac", label: "Araç", icon: "🚗", ready: true },
  { id: "evlilik", label: "Evlilik", icon: "💍", ready: true },
  { id: "seyahat", label: "Seyahat", icon: "✈️", ready: true },
  { id: "is", label: "İş Kurma", icon: "💼", ready: false },
  { id: "alisveris", label: "Alışveriş", icon: "🛍️", ready: false },
  { id: "ozel", label: "Özel", icon: "🎯", ready: false },
];
const typeMeta = (id) => GOAL_TYPES.find((t) => t.id === id) || { label: "Hedef", icon: "🎯" };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (v) => {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// --- Konut alım maliyetleri (Türkiye, 2026) -------------------------------
// Alıcının ev fiyatına EK olarak ödediği kalemler. Toplamı ≈ %6,5-7.
const TAPU_HARCI = 0.04;       // yasada %2 alıcı + %2 satıcı; pratikte alıcı öder
const KOMISYON = 0.024;        // alıcıdan en fazla %2 + KDV
const EKSPERTIZ = 15000;       // SPK tarifesi 12.000-25.000 ₺; kredi varsa zorunlu
const TAHSIS_ORANI = 0.005;    // kredi tahsis ücreti: kredinin binde 5'i (yasal üst sınır)
const MAX_LTV = 0.90;          // konut kredisi ekspertiz değerinin en fazla %90'ı

// --- Araç alım kuralları (Türkiye, 2026) ----------------------------------
// BDDK kademeli taşıt kredisi: araç değeri yükseldikçe kredi oranı düşer,
// vade kısalır. Kullanıcı bunu bilmez; ekran söyler.
const KREDI_KADEMELERI = {
  ice: [
    { ustSinir: 400000, oran: 0.80, vade: 48 },
    { ustSinir: 800000, oran: 0.75, vade: 36 },
    { ustSinir: 1200000, oran: 0.70, vade: 24 },
    { ustSinir: 2000000, oran: 0.60, vade: 12 },
    { ustSinir: Infinity, oran: 0, vade: 0 },
  ],
  ev: [
    { ustSinir: 2500000, oran: 0.70, vade: 48 },
    { ustSinir: 5000000, oran: 0.60, vade: 36 },
    { ustSinir: 6500000, oran: 0.50, vade: 24 },
    { ustSinir: 7500000, oran: 0.40, vade: 12 },
    { ustSinir: Infinity, oran: 0, vade: 0 },
  ],
};
const NOTER_HARC_ORANI = 0.002;   // satış bedelinin binde 2
const NOTER_HARC_MIN = 1000;      // asgari harç
const NOTER_HIZMET_ORANI = 0.30;  // harcın %30'u
const NOTER_SABIT = 1500;         // sayfa / nüsha / tescil / bildirim
const TESCIL_PLAKA = 2500;

function krediLimiti(price, fuel) {
  const tablo = KREDI_KADEMELERI[fuel === "ev" ? "ev" : "ice"];
  const kademe = tablo.find((k) => price <= k.ustSinir) || tablo[tablo.length - 1];
  return { maxKredi: price * kademe.oran, maxVade: kademe.vade, oran: kademe.oran };
}

function calcArac(goal) {
  const price = num(goal.price);
  const loan = num(goal.loan);
  const cash = num(goal.cash);
  const tradeNet = Math.max(0, num(goal.tradeIn));
  const sifirMi = goal.condition !== "used";

  const noterHarc = price > 0 ? Math.max(price * NOTER_HARC_ORANI, NOTER_HARC_MIN) : 0;
  const noterHizmet = price > 0 ? noterHarc * NOTER_HIZMET_ORANI + NOTER_SABIT : 0;
  const tescil = price > 0 ? TESCIL_PLAKA : 0;
  const masrafToplam = noterHarc + noterHizmet + tescil;

  const target = price + masrafToplam;
  const resources = cash + tradeNet + loan;
  const gap = target - resources;
  const percent = target > 0 ? Math.min(100, (resources / target) * 100) : 0;

  const ay = num(goal.loanMonths);
  const taksit = taksitHesapla(loan, num(goal.loanRate), ay);
  const toplamGeriOdeme = taksit * ay;
  const limit = krediLimiti(price, goal.fuel);

  return {
    price, loan, cash, tradeNet, sifirMi,
    masraflar: { noterHarc, noterHizmet, tescil },
    masrafToplam, target, resources, gap, percent,
    taksit, ay, toplamGeriOdeme, limit,
  };
}

// --- Evlilik (Türkiye, 2026) ----------------------------------------------
// Sektörün kritik gerçeği: takı hem GİDER hem GELİRDİR. Düğünde gelen altın ve
// para, masrafın önemli bir kısmını karşılar — bütçe bunu görmezse yanıltır.
// Evlilik bütçesi iki ana bölüme ayrılır: DÜĞÜN (mavi) ve EV KURMA (yeşil).
// Kalemler gerçek bir düğün bütçe çizelgesinden alınmıştır; varsayılanlar
// 2026 piyasa ortalamalarıdır ve tek tıkla doldurulabilir.
// Gruplar Türkiye'deki evlilik sürecinin gerçek aşamalarına göre dizilmiştir:
// söz/kız isteme → nişan → kına → nikâh → düğün → takı & balayı, ardından ev kurma.
// Bunlar yalnızca BAŞLANGIÇ şablonudur — kullanıcı her grubu ve kalemi yeniden
// adlandırabilir, silebilir, yenisini ekleyebilir.
const EVLILIK_SABLON = {
  dugun: [
    { ad: "Söz & Kız İsteme", kalemler: [
      ["Söz yüzükleri & tepsi", 25000], ["İkramlık & tatlı", 5000],
      ["Çiçek & süsleme", 4000], ["Bohça", 12000],
    ] },
    { ad: "Nişan", kalemler: [
      ["Nişan mekânı & organizasyon", 80000], ["Nişan elbisesi & damatlık", 20000],
      ["Nişan pastası & ikramlar", 10000], ["Fotoğraf & video", 15000],
      ["Süsleme & masa dekoru", 10000], ["Takılar (bilezik, kolye)", 120000],
    ] },
    { ad: "Kına Gecesi", kalemler: [
      ["Mekân & organizasyon", 35000], ["Bindallı / kına kıyafeti", 15000],
      ["Kına malzemeleri & mumlar", 6000], ["Müzik / ekip", 12000],
      ["İkramlık & hediyelikler", 10000],
    ] },
    { ad: "Nikâh Töreni", kalemler: [
      ["Nikâh salonu kirası", 10000], ["Resmî işlemler (evrak, harç)", 5000],
      ["Gelin çiçeği, saç & makyaj", 30000], ["Nikâh şekeri & davetiye", 8000],
      ["Fotoğraf & video", 12000],
    ] },
    { ad: "Düğün", kalemler: [
      ["Düğün salonu / kır düğünü", 400000], ["Gelinlik & damatlık", 100000],
      ["Müzik grubu / DJ", 50000], ["Gelin saçı & makyajı", 20000],
      ["Düğün pastası & ikramlar", 25000], ["Davetiyeler", 10000],
      ["Fotoğraf & video çekimi", 30000], ["Gelin arabası kiralama", 3000],
    ] },
    { ad: "Takı & Balayı", kalemler: [
      ["Alyans", 30000], ["Takı & altın masrafları", 120000], ["Balayı", 200000],
    ] },
  ],
  ev: [
    { ad: "Beyaz Eşyalar", kalemler: [
      ["Buzdolabı", 50000], ["Çamaşır makinesi", 35000], ["Bulaşık makinesi", 30000],
      ["Fırın", 30000], ["Kurutma makinesi", 30000], ["Televizyon", 80000],
    ] },
    { ad: "Mobilyalar", kalemler: [
      ["Oturma odası takımı", 80000], ["Yemek odası takımı", 80000],
      ["Yatak odası takımı", 120000], ["Mutfak masası ve sandalyeler", 35000],
      ["Sehpa ve yan masalar", 15000],
    ] },
    { ad: "Mutfak Gereçleri", kalemler: [
      ["Tencere ve tava seti", 30000], ["Yemek takımı", 22000],
      ["Çatal, kaşık, bıçak seti", 10000], ["Bardak ve fincan setleri", 15000],
      ["Küçük ev aletleri", 50000],
    ] },
    { ad: "Ev Tekstili & Çeyiz", kalemler: [
      ["Nevresim takımları", 20000], ["Yorgan ve yastıklar", 20000],
      ["Havlu setleri", 7000], ["Perdeler", 25000], ["Halılar", 40000],
      ["Çeyiz bohçası", 30000],
    ] },
    { ad: "Diğer", kalemler: [
      ["Aydınlatma ürünleri", 50000], ["Elektrikli süpürge", 35000],
      ["Ütü ve ütü masası", 25000], ["Kahve makinesi", 35000],
    ] },
  ],
};

const EVLILIK_OLCEK = [
  { id: "sade", label: "Sade", carpan: 0.55 },
  { id: "standart", label: "Standart", carpan: 1 },
  { id: "genis", label: "Gösterişli", carpan: 1.8 },
];

function evlilikSablonUret(carpan) {
  const donustur = (liste) => liste.map((g) => ({
    id: yeniId(), ad: g.ad, acik: true,
    kalemler: g.kalemler.map(([ad, v]) => ({
      id: yeniId(), ad, tutar: v > 0 ? String(Math.round((v * carpan) / 500) * 500) : "",
    })),
  }));
  return { dugunGruplar: donustur(EVLILIK_SABLON.dugun), evGruplar: donustur(EVLILIK_SABLON.ev) };
}

// --- Seyahat -------------------------------------------------------------
// Seyahatin kendine özgü motoru: bütçe iki mantıkla oluşur —
//   SABİT giderler (bir kez / kişi başı / gece başı) ve
//   GÜNLÜK harcamalar (kişi × gece).
// Bu yüzden kullanıcı küçük birim fiyatları girer, çarpanları ekran yapar.
// Ayrıca %10 beklenmedik gider payı sektör standardıdır.
const SEYAHAT_KALEMLER = {
  sabit: [
    { k: "flight", ad: "Uçak / ulaşım bileti", birim: "kişi başı", carpan: "kisi", ornek: 12000 },
    { k: "lodging", ad: "Konaklama", birim: "gecelik", carpan: "gece", ornek: 4500 },
    { k: "visa", ad: "Vize", birim: "kişi başı", carpan: "kisi", ornek: 3500 },
    { k: "insurance", ad: "Seyahat sigortası", birim: "kişi başı", carpan: "kisi", ornek: 900 },
    { k: "transfer", ad: "Havalimanı transferi", birim: "toplam", carpan: "bir", ornek: 2500 },
  ],
  gunluk: [
    { k: "food", ad: "Yeme & içme", birim: "kişi/gün", carpan: "kisiGun", ornek: 1500 },
    { k: "localTransport", ad: "Şehir içi ulaşım", birim: "kişi/gün", carpan: "kisiGun", ornek: 400 },
    { k: "activities", ad: "Aktivite & müze", birim: "kişi/gün", carpan: "kisiGun", ornek: 800 },
  ],
  diger: [
    { k: "events", ad: "Etkinlik / maç bileti", birim: "kişi başı", carpan: "kisi", ornek: 300 },
    { k: "shopping", ad: "Alışveriş & hediye", birim: "toplam", carpan: "bir", ornek: 300 },
  ],
};

// Yurt dışı seyahatte bütçe dövizle planlanır, cepten TL çıkar.
const SEYAHAT_PARA = [
  { id: "TRY", simge: "₺", ad: "TL", kur: "1" },
  { id: "EUR", simge: "€", ad: "Euro", kur: "51" },
  { id: "USD", simge: "$", ad: "Dolar", kur: "44" },
  { id: "GBP", simge: "£", ad: "Sterlin", kur: "59" },
];
const paraMeta = (id) => SEYAHAT_PARA.find((p) => p.id === id) || SEYAHAT_PARA[0];

function calcSeyahat(goal) {
  const items = goal.items && typeof goal.items === "object" ? goal.items : {};
  const kisi = Math.max(0, num(goal.people));
  const gece = Math.max(0, num(goal.nights));
  const carpanlar = { kisi: kisi || 0, gece: gece || 0, bir: 1, kisiGun: (kisi || 0) * (gece || 0) };

  const hesapla = (liste) => liste.map((x) => {
    const birimFiyat = num(items[x.k]);
    const carpan = carpanlar[x.carpan] || 0;
    return { ...x, birimFiyat, carpan, toplam: birimFiyat * carpan };
  });

  const sabit = hesapla(SEYAHAT_KALEMLER.sabit);
  const gunluk = hesapla(SEYAHAT_KALEMLER.gunluk);
  const diger = hesapla(SEYAHAT_KALEMLER.diger);

  const sabitToplam = sabit.reduce((s, x) => s + x.toplam, 0);
  const gunlukToplam = gunluk.reduce((s, x) => s + x.toplam, 0);
  const digerToplam = diger.reduce((s, x) => s + x.toplam, 0);

  const araToplam = sabitToplam + gunlukToplam + digerToplam;
  const payYuzde = goal.contingency === "" ? 0 : num(goal.contingency ?? 10);
  const pay = araToplam * (payYuzde / 100);
  const target = araToplam + pay;

  // Kalemler seçilen para biriminde girilir; TL karşılığı kurla hesaplanır.
  const para = paraMeta(goal.currency || "TRY");
  const kur = goal.currency === "TRY" || !goal.currency ? 1 : (num(goal.rate) || num(para.kur) || 1);
  const tl = (v) => v * kur;

  // Kaynak (ayrılan bütçe) her zaman TL cinsindendir.
  const cash = num(goal.cash);
  const targetTL = tl(target);
  const gap = targetTL - cash;
  const percent = targetTL > 0 ? Math.min(100, (cash / targetTL) * 100) : 0;

  return {
    kisi, gece, sabit, gunluk, diger, sabitToplam, gunlukToplam, digerToplam,
    araToplam, payYuzde, pay, target, targetTL, para, kur, tl,
    cash, resources: cash, gap, percent,
    kisiBasi: kisi > 0 ? targetTL / kisi : 0,
    gunBasi: gece > 0 ? targetTL / gece : 0,
    rawItems: items,
  };
}

function calcEvlilik(goal) {
  const dugunGruplar = Array.isArray(goal.dugunGruplar) ? goal.dugunGruplar : [];
  const evGruplar = Array.isArray(goal.evGruplar) ? goal.evGruplar : [];
  const dugunToplam = grupToplami(dugunGruplar);
  const evToplam = grupToplami(evGruplar);
  const target = dugunToplam + evToplam;

  const cash = num(goal.cash);
  const gifts = num(goal.expectedGifts);
  const family = num(goal.familyHelp);
  const resources = cash + gifts + family;

  const gap = target - resources;
  const percent = target > 0 ? Math.min(100, (resources / target) * 100) : 0;
  const takiKarsilama = target > 0 ? (gifts / target) * 100 : 0;
  const davetli = num(goal.guests);
  const kisiBasiToplam = davetli > 0 ? target / davetli : 0;

  return { dugunGruplar, evGruplar, dugunToplam, evToplam, target, resources, cash, gifts, family, gap, percent, takiKarsilama, davetli, kisiBasiToplam };
}

// Anüite taksiti
function taksitHesapla(anapara, aylikFaizYuzde, ay) {
  if (anapara <= 0 || ay <= 0) return 0;
  const i = aylikFaizYuzde / 100;
  if (i <= 0) return anapara / ay;
  const k = Math.pow(1 + i, ay);
  return (anapara * i * k) / (k - 1);
}

function calcKonut(goal) {
  const price = num(goal.housePrice);
  const loan = num(goal.loan);
  const cash = num(goal.cash);
  const sellNet = Math.max(0, num(goal.sellHome) - num(goal.sellHomeDebt));
  const extra = num(goal.extraCost);

  const tapu = price * TAPU_HARCI;
  const komisyon = price * KOMISYON;
  const ekspertiz = loan > 0 ? EKSPERTIZ : 0;
  const tahsis = loan * TAHSIS_ORANI;
  const masrafToplam = tapu + komisyon + ekspertiz + tahsis + extra;

  const target = price + masrafToplam;              // gerçek toplam maliyet
  const resources = cash + sellNet + loan;
  const gap = target - resources;                   // + ise açık, − ise fazla
  const percent = target > 0 ? Math.min(100, (resources / target) * 100) : 0;

  const taksit = taksitHesapla(loan, num(goal.loanRate), num(goal.loanMonths));
  const ltv = price > 0 ? loan / price : 0;

  return {
    price, loan, cash, sellNet, extra,
    masraflar: { tapu, komisyon, ekspertiz, tahsis, extra },
    masrafToplam, target, resources, gap, percent, taksit, ltv,
  };
}

// Eski surumun alan adlarini yeni yapiya tasi (veri kaybi olmasin).
// houseValue->housePrice, mortgage->loan, liquidFunds->cash, currentHomeValue->sellHome
function migrate(goal) {
  if (goal.type !== "konut") return goal;
  if (goal.housePrice !== undefined && goal.cash !== undefined) return goal;
  return {
    ...goal,
    housePrice: goal.housePrice ?? goal.houseValue ?? "",
    loan: goal.loan ?? goal.mortgage ?? "",
    // eski "likidite" alani negatif girilebiliyordu; kaynak olarak negatif anlamsiz
    cash: goal.cash ?? (num(goal.liquidFunds) > 0 ? goal.liquidFunds : ""),
    sellHome: goal.sellHome ?? goal.currentHomeValue ?? "",
    sellHomeDebt: goal.sellHomeDebt ?? "",
    extraCost: goal.extraCost ?? "",
    loanMonths: goal.loanMonths ?? "120",
    loanRate: goal.loanRate ?? "2,75",
  };
}

function calcGoal(goal) {
  if (goal.type === "konut") return calcKonut(goal);
  if (goal.type === "arac") return calcArac(goal);
  if (goal.type === "evlilik") return calcEvlilik(goal);
  if (goal.type === "seyahat") return calcSeyahat(goal);
  // Diğer türler eklendikçe buraya gelecek.
  const target = num(goal.targetValue);
  return { target, resources: 0, gap: target, percent: 0, taksit: 0, ltv: 0, masrafToplam: 0, masraflar: {} };
}

function aylikKalan(targetDate) {
  if (!targetDate) return null;
  const d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
}

// --- Kategori görselleri --------------------------------------------------
// Dış bağımlılık/telif riski olmasın diye fotoğraf yerine satır içi SVG çizim
// kullanıyoruz: anında yüklenir, her ekranda net görünür, tema ile uyumlu.
const HERO = {
  konut: { renk: ["#60a5fa", "#8b5cf6"], baslik: "Konut Hedefi", alt: "Ev alım maliyetini, kredi tavanını ve taksit yükünü birlikte hesaplar." },
  arac: { renk: ["#f59e0b", "#ef4444"], baslik: "Araç Hedefi", alt: "Kademeli kredi limitini, sahip olma giderini ve değer kaybını gösterir." },
  evlilik: { renk: ["#f472b6", "#a78bfa"], baslik: "Evlilik Hedefi", alt: "Düğün, takı, ev kurma ve balayını tek bütçede toplar." },
  seyahat: { renk: ["#22d3ee", "#3b82f6"], baslik: "Seyahat Hedefi", alt: "Sabit giderler ve günlük harcamaları kişi/gece çarpanıyla hesaplar." },
  is: { renk: ["#34d399", "#059669"], baslik: "İş Kurma Hedefi", alt: "Hazırlanıyor." },
  alisveris: { renk: ["#fb7185", "#f59e0b"], baslik: "Alışveriş Hedefi", alt: "Hazırlanıyor." },
  ozel: { renk: ["#a78bfa", "#6366f1"], baslik: "Özel Hedef", alt: "Hazırlanıyor." },
};

function HeroCizim({ type }) {
  const c = "rgba(255,255,255,.92)";
  const s = "rgba(255,255,255,.45)";
  if (type === "konut") return (
    <svg viewBox="0 0 120 80" width="118" height="78" aria-hidden="true">
      <circle cx="97" cy="18" r="9" fill={s} opacity=".5" />
      <path d="M18 40 L48 18 L78 40 V70 H18 Z" fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 42 L48 14 L84 42" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="40" y="50" width="16" height="20" fill="none" stroke={c} strokeWidth="2.5" />
      <rect x="25" y="47" width="10" height="9" fill="none" stroke={s} strokeWidth="2" />
      <rect x="61" y="47" width="10" height="9" fill="none" stroke={s} strokeWidth="2" />
    </svg>
  );
  if (type === "arac") return (
    <svg viewBox="0 0 120 80" width="118" height="78" aria-hidden="true">
      <path d="M16 52 L23 34 C24 31 26 30 29 30 H79 C82 30 84 31 86 34 L96 52" fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <rect x="10" y="52" width="92" height="14" rx="6" fill="none" stroke={c} strokeWidth="3" />
      <circle cx="31" cy="66" r="8" fill="none" stroke={c} strokeWidth="3" />
      <circle cx="81" cy="66" r="8" fill="none" stroke={c} strokeWidth="3" />
      <path d="M40 32 V50 M63 32 V50" stroke={s} strokeWidth="2" />
      <path d="M100 40 h12 M100 46 h9" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
  if (type === "evlilik") return (
    <svg viewBox="0 0 120 80" width="118" height="78" aria-hidden="true">
      <circle cx="46" cy="48" r="17" fill="none" stroke={c} strokeWidth="3" />
      <circle cx="72" cy="48" r="17" fill="none" stroke={c} strokeWidth="3" opacity=".75" />
      <path d="M46 31 l-5 -7 h10 z" fill={c} />
      <path d="M92 22 c3-4 9-3 9 2 0 5-9 10-9 10 s-9-5-9-10 c0-5 6-6 9-2 z" fill={s} />
      <path d="M22 20 c2-3 6-2 6 1.5 0 3.5-6 7-6 7 s-6-3.5-6-7 c0-3.5 4-4.5 6-1.5 z" fill={s} opacity=".7" />
    </svg>
  );
  return (
    <svg viewBox="0 0 120 80" width="118" height="78" aria-hidden="true">
      <circle cx="60" cy="44" r="22" fill="none" stroke={c} strokeWidth="3" />
      <circle cx="60" cy="44" r="10" fill="none" stroke={s} strokeWidth="2.5" />
      <circle cx="60" cy="44" r="3" fill={c} />
    </svg>
  );
}

function Hero({ type }) {
  const h = HERO[type] || HERO.ozel;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      borderRadius: 20, padding: "18px 22px", overflow: "hidden",
      background: `linear-gradient(135deg, ${h.renk[0]}38, ${h.renk[1]}22), rgba(2,6,23,.55)`,
      border: `1px solid ${h.renk[0]}44`,
    }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: "#fff" }}>{h.baslik}</h2>
        <p style={{ margin: "5px 0 0", color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.55 }}>{h.alt}</p>
      </div>
      <div style={{ flex: "0 0 auto", opacity: 0.9 }}><HeroCizim type={type} /></div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 20,
  padding: 18,
  background: "linear-gradient(150deg, rgba(15,23,42,.72), rgba(30,27,75,.34))",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(2,6,23,.6)", color: "#f8fafc", borderRadius: 12,
  padding: "9px 11px", outline: "none", fontSize: 13,
};

// --- Kategori temaları ----------------------------------------------------
// Her kategori kendi rengiyle ayrışsın; kullanıcı hangi ekranda olduğunu
// bakar bakmaz anlasın.
const TEMA = {
  konut: { ana: "#60a5fa", ikinci: "#8b5cf6", zemin: "rgba(96,165,250,.13)", kenar: "rgba(96,165,250,.34)" },
  arac: { ana: "#f59e0b", ikinci: "#ef4444", zemin: "rgba(245,158,11,.13)", kenar: "rgba(245,158,11,.34)" },
  evlilik: { ana: "#f472b6", ikinci: "#a78bfa", zemin: "rgba(244,114,182,.13)", kenar: "rgba(244,114,182,.34)" },
};
const tema = (t) => TEMA[t] || TEMA.konut;

// Ortak tablo bileşeni — sayıları liste yerine çizelgede göstermek karşılaştırmayı
// kolaylaştırır (hangi kalem büyük, hangi bant bizim, hangi yıl ne kadar).
function Tablo({ basliklar, satirlar, renk = "#93c5fd", not }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, color: "#e2e8f0", minWidth: 340 }}>
        <thead>
          <tr>
            {basliklar.map((b, i) => (
              <th key={i} style={{
                textAlign: i === 0 ? "left" : "right", padding: "7px 10px", color: renk,
                fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em",
                borderBottom: "1px solid rgba(255,255,255,.12)", whiteSpace: "nowrap",
              }}>{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s, i) => (
            <tr key={i} style={{
              background: s.vurgu ? "rgba(255,255,255,.07)" : "transparent",
              borderBottom: "1px solid rgba(255,255,255,.05)",
              fontWeight: s.kalin ? 800 : 400,
            }}>
              {s.hucreler.map((h, j) => (
                <td key={j} style={{
                  textAlign: j === 0 ? "left" : "right", padding: "8px 10px",
                  color: s.renk && j > 0 ? s.renk : s.vurgu ? "#fff" : undefined,
                  whiteSpace: j === 0 ? "normal" : "nowrap",
                }}>
                  {h}
                  {j === 0 && s.not ? <span style={{ display: "block", color: "#64748b", fontSize: 10, marginTop: 1 }}>{s.not}</span> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {not ? <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 8, lineHeight: 1.5 }}>{not}</div> : null}
    </div>
  );
}

function TabloKutu({ baslik, ikon, renk, children }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.11)", borderRadius: 16, padding: "13px 14px", background: "rgba(2,6,23,.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ fontSize: 14 }}>{ikon}</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{baslik}</span>
      </div>
      {children}
    </div>
  );
}

// --- Düzenlenebilir bütçe grupları ---------------------------------------
// Hem Evlilik hem Seyahat bunu kullanır: kullanıcı grup ve kalem adlarını
// değiştirebilir, yenisini ekleyebilir, silebilir; gruplar açılıp kapanır.
// Kalıp bir liste değil, kendi bütçesini kurduğu bir çalışma alanı.
const yeniId = () => Math.random().toString(36).slice(2, 9);
const grupToplami = (gruplar) =>
  (gruplar || []).reduce((s, g) => s + (g.kalemler || []).reduce((t, k) => t + num(k.tutar), 0), 0);

const adInput = {
  width: "100%", boxSizing: "border-box", border: "1px solid transparent",
  background: "transparent", color: "#f1f5f9", borderRadius: 8,
  padding: "9px 10px", outline: "none", fontSize: 14,
};
const tutarInput = {
  width: "100%", boxSizing: "border-box", textAlign: "right",
  border: "1px solid rgba(255,255,255,.14)", background: "rgba(2,6,23,.55)",
  color: "#f8fafc", borderRadius: 9, padding: "9px 10px", outline: "none",
  fontSize: 14, fontVariantNumeric: "tabular-nums",
};
const kucukBtn = {
  flex: "0 0 auto", width: 30, height: 30, borderRadius: 8, cursor: "pointer",
  fontSize: 15, lineHeight: 1, display: "grid", placeItems: "center",
};

function ButceGrubu({ grup, tema, onDegis, onSil, paraSimge = "₺" }) {
  const toplam = (grup.kalemler || []).reduce((s, k) => s + num(k.tutar), 0);
  const acik = grup.acik !== false;
  const kalemDegis = (id, alan, deger) =>
    onDegis({ ...grup, kalemler: grup.kalemler.map((k) => (k.id === id ? { ...k, [alan]: deger } : k)) });
  const kalemSil = (id) => onDegis({ ...grup, kalemler: grup.kalemler.filter((k) => k.id !== id) });
  const kalemEkle = () => onDegis({ ...grup, acik: true, kalemler: [...(grup.kalemler || []), { id: yeniId(), ad: "", tutar: "" }] });

  return (
    <div style={{ border: `1px solid ${tema.kenar}`, borderRadius: 14, overflow: "hidden", background: "rgba(2,6,23,.42)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 9px", background: tema.zemin, borderBottom: acik ? `1px solid ${tema.kenar}` : "none" }}>
        <button type="button" onClick={() => onDegis({ ...grup, acik: !acik })} title={acik ? "Kapat" : "Aç"}
          style={{ ...kucukBtn, border: `1px solid ${tema.kenar}`, background: "rgba(2,6,23,.4)", color: tema.acik, fontWeight: 900 }}>
          {acik ? "−" : "+"}
        </button>
        <input value={grup.ad || ""} placeholder="Grup adı"
          onChange={(e) => onDegis({ ...grup, ad: e.target.value })}
          style={{ ...adInput, flex: 1, minWidth: 0, color: tema.acik, fontWeight: 800, fontSize: 14.5 }}
          onFocus={(e) => { e.target.style.borderColor = tema.kenar; e.target.style.background = "rgba(2,6,23,.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.background = "transparent"; }} />
        <strong style={{ flex: "0 0 auto", color: "#fff", fontSize: 14.5, whiteSpace: "nowrap" }}>
          {paraSimge}{toplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
        </strong>
        <button type="button" onClick={onSil} title="Grubu sil"
          style={{ ...kucukBtn, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.12)", color: "#fca5a5" }}>×</button>
      </div>

      {acik ? (
        <div style={{ padding: "7px 8px 9px" }}>
          {(grup.kalemler || []).map((k) => (
            <div key={k.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 30px", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <input value={k.ad || ""} placeholder="Kalem adı"
                onChange={(e) => kalemDegis(k.id, "ad", e.target.value)} style={adInput}
                onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,.16)"; e.target.style.background = "rgba(2,6,23,.45)"; }}
                onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.background = "transparent"; }} />
              <input value={k.tutar || ""} placeholder="0" inputMode="decimal"
                onChange={(e) => kalemDegis(k.id, "tutar", e.target.value)} style={tutarInput}
                onFocus={(e) => { e.target.style.borderColor = tema.ana; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,.14)"; }} />
              <button type="button" onClick={() => kalemSil(k.id)} title="Kalemi sil"
                style={{ ...kucukBtn, width: 30, border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.4)", color: "#94a3b8", fontSize: 14 }}>×</button>
            </div>
          ))}
          <button type="button" onClick={kalemEkle}
            style={{ marginTop: 4, width: "100%", border: `1px dashed ${tema.kenar}`, background: "transparent", color: tema.acik, borderRadius: 9, padding: "9px 12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            + Kalem ekle
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ButceBolumu({ baslik, ikon, tema, gruplar, onGruplar, paraSimge = "₺", ekBilgi }) {
  const toplam = grupToplami(gruplar);
  const grupDegis = (g) => onGruplar(gruplar.map((x) => (x.id === g.id ? g : x)));
  const grupSil = (id) => onGruplar(gruplar.filter((x) => x.id !== id));
  const grupEkle = () => onGruplar([...gruplar, { id: yeniId(), ad: "", acik: true, kalemler: [{ id: yeniId(), ad: "", tutar: "" }] }]);
  const hepsiKapali = gruplar.length > 0 && gruplar.every((g) => g.acik === false);

  return (
    <section style={{ border: `1px solid ${tema.kenar}`, borderRadius: 17, overflow: "hidden", background: "rgba(2,6,23,.3)" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
        padding: "12px 14px", background: `linear-gradient(120deg, ${tema.ana}44, ${tema.ana}18)`, borderBottom: `1px solid ${tema.kenar}`,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{ikon} {baslik}</span>
          <button type="button" onClick={() => onGruplar(gruplar.map((g) => ({ ...g, acik: hepsiKapali })))}
            style={{ border: `1px solid ${tema.kenar}`, background: "rgba(2,6,23,.35)", color: tema.acik, borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
            {hepsiKapali ? "Tümünü aç" : "Tümünü kapat"}
          </button>
        </span>
        <span style={{ color: tema.acik, fontWeight: 900, fontSize: 16, whiteSpace: "nowrap" }}>
          {paraSimge}{toplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}{ekBilgi}
        </span>
      </header>
      <div style={{ padding: 11, display: "grid", gap: 9 }}>
        {gruplar.map((g) => (
          <ButceGrubu key={g.id} grup={g} tema={tema} paraSimge={paraSimge} onDegis={grupDegis} onSil={() => grupSil(g.id)} />
        ))}
        <button type="button" onClick={grupEkle}
          style={{ border: `1px dashed ${tema.kenar}`, background: "rgba(2,6,23,.3)", color: tema.acik, borderRadius: 11, padding: "10px 14px", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
          + Yeni grup ekle
        </button>
      </div>
    </section>
  );
}

function Alan({ label, hint, children, aksiyon }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <span style={{ color: "#cbd5e1", fontSize: 11.5, fontWeight: 700 }}>{label}</span>
        {aksiyon}
      </span>
      {children}
      {hint ? <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>{hint}</span> : null}
    </label>
  );
}

function Blok({ no, baslik, aciklama, children, renk = "#93c5fd", zemin = "rgba(96,165,250,.22)" }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 14, background: "rgba(2,6,23,.34)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: aciklama ? 2 : 11 }}>
        <span style={{ width: 21, height: 21, borderRadius: 999, background: zemin, color: renk, fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{no}</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 13.5 }}>{baslik}</span>
      </div>
      {aciklama ? <div style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 11px 30px" }}>{aciklama}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 11 }}>{children}</div>
    </div>
  );
}

function KonutKarti({ goal, c, onChange, onDelete, likit, aylikGelir }) {
  const ay = aylikKalan(goal.targetDate);
  const aylikBirikim = c.gap > 0 && ay && ay > 0 ? c.gap / ay : null;
  const yuk = aylikGelir > 0 ? (c.taksit / aylikGelir) * 100 : null;

  const uyarilar = [];
  if (c.ltv > MAX_LTV)
    uyarilar.push(`Kredi, ev fiyatına oranla %${(c.ltv * 100).toFixed(0)}. Bankalar en fazla %90 veriyor — en az ${money(c.price * (1 - MAX_LTV))} peşinat gerekir.`);
  if (yuk !== null && yuk > 50)
    uyarilar.push(`Taksit / gelir oranı %${yuk.toFixed(0)}. %50 üstü sürdürülemez kabul edilir; vadeyi uzatmayı ya da krediyi düşürmeyi düşün.`);
  else if (yuk !== null && yuk > 35)
    uyarilar.push(`Taksit / gelir oranı %${yuk.toFixed(0)}. Rahat sayılan sınır %35 — bütçen zorlanabilir.`);
  if (c.gap > 0 && ay === 0)
    uyarilar.push("Hedef tarih geçmiş ya da bu ay; açık kapanmadan alım yapılamaz.");

  const tamam = c.gap <= 0;

  return (
    <article style={{ ...card, display: "grid", gap: 13 }}>
      {/* Başlık */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 11, alignItems: "end" }}>
        <Alan label="🏠 Hedef Adı">
          <input style={inputStyle} value={goal.name || ""} placeholder="Örn: Ev Alma Hedefi" onChange={(e) => onChange("name", e.target.value)} />
        </Alan>
        <Alan label="Ne zaman almak istiyorsun?">
          <input style={inputStyle} type="date" value={goal.targetDate || ""} onChange={(e) => onChange("targetDate", e.target.value)} />
        </Alan>
        <div style={{ justifySelf: "end" }}>
          <button type="button" className="deleteButton" onClick={onDelete}>Sil</button>
        </div>
      </div>

      <Blok no="1" baslik="Almak istediğin ev" aciklama="Satıcının istediği fiyatı yaz — masrafları aşağıda ben ekliyorum.">
        <Alan label="Evin Fiyatı (₺)">
          <input style={inputStyle} inputMode="decimal" value={goal.housePrice || ""} placeholder="Örn: 6.100.000" onChange={(e) => onChange("housePrice", e.target.value)} />
        </Alan>
        <Alan label="Tadilat / Taşınma / Eşya (₺)" hint="Opsiyonel — girmezsen 0 sayılır">
          <input style={inputStyle} inputMode="decimal" value={goal.extraCost || ""} placeholder="0" onChange={(e) => onChange("extraCost", e.target.value)} />
        </Alan>
      </Blok>

      <Blok no="2" baslik="Elindeki kaynaklar">
        <Alan
          label="Nakit / Birikim (₺)"
          hint="Peşinat için ayırabileceğin tutar"
          aksiyon={likit > 0 ? (
            <button type="button" onClick={() => onChange("cash", String(Math.round(likit)))}
              style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              Portföyümden al ({money(likit)})
            </button>
          ) : null}
        >
          <input style={inputStyle} inputMode="decimal" value={goal.cash || ""} placeholder="0" onChange={(e) => onChange("cash", e.target.value)} />
        </Alan>
        <Alan label="Satacağın Evin Değeri (₺)" hint="Mevcut evini satacaksan yaz; yoksa boş bırak">
          <input style={inputStyle} inputMode="decimal" value={goal.sellHome || ""} placeholder="0" onChange={(e) => onChange("sellHome", e.target.value)} />
        </Alan>
        <Alan label="O Evin Kalan Kredi Borcu (₺)" hint="Satıştan düşülür — eline net bu kadar geçer">
          <input style={inputStyle} inputMode="decimal" value={goal.sellHomeDebt || ""} placeholder="0" onChange={(e) => onChange("sellHomeDebt", e.target.value)} />
        </Alan>
      </Blok>

      <Blok no="3" baslik="Konut kredisi" aciklama="Kredi kullanmayacaksan bu bölümü boş bırak.">
        <Alan label="Kredi Tutarı (₺)" hint={c.price > 0 ? `Yasal tavan: ${money(c.price * MAX_LTV)} (fiyatın %90'ı)` : "Bankalar fiyatın en fazla %90'ını verir"}>
          <input style={inputStyle} inputMode="decimal" value={goal.loan || ""} placeholder="0" onChange={(e) => onChange("loan", e.target.value)} />
        </Alan>
        <Alan label="Vade (ay)" hint="Örn: 120 ay = 10 yıl">
          <input style={inputStyle} inputMode="decimal" value={goal.loanMonths || ""} placeholder="120" onChange={(e) => onChange("loanMonths", e.target.value)} />
        </Alan>
        <Alan label="Aylık Faiz (%)" hint="Bankaların güncel oranı ~%2,5–3,5">
          <input style={inputStyle} inputMode="decimal" value={goal.loanRate || ""} placeholder="2,75" onChange={(e) => onChange("loanRate", e.target.value)} />
        </Alan>
      </Blok>

      {/* SONUÇ */}
      <div style={{
        border: `1px solid ${tamam ? "rgba(34,197,94,.4)" : "rgba(251,191,36,.4)"}`,
        borderRadius: 18, padding: 17,
        background: tamam
          ? "linear-gradient(150deg, rgba(34,197,94,.15), rgba(15,23,42,.6))"
          : "linear-gradient(150deg, rgba(251,191,36,.13), rgba(15,23,42,.6))",
      }}>
        <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
          {tamam ? "Bu evi alabilirsin" : "Eksik kaynak"}
        </div>
        <div style={{ color: tamam ? "#86efac" : "#fbbf24", fontSize: "clamp(26px, 4.5vw, 38px)", fontWeight: 900, lineHeight: 1.1, margin: "5px 0 3px" }}>
          {tamam ? `+${money(Math.abs(c.gap))}` : money(c.gap)}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 11.5 }}>
          {tamam ? "Kaynakların toplam maliyeti karşılıyor, fazlan bu kadar." : "Alım için bulman gereken ek tutar."}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 9, marginTop: 14 }}>
          <Kutu etiket="Gerçek Toplam Maliyet" deger={money(c.target)} renk="#e2e8f0" alt={`Fiyat + ${money(c.masrafToplam)} masraf`} />
          <Kutu etiket="Kaynakların" deger={money(c.resources)} renk="#60a5fa" alt="Nakit + ev satışı + kredi" />
          {c.taksit > 0 ? (
            <Kutu etiket="Aylık Taksit" deger={money(c.taksit)}
              renk={yuk === null ? "#a78bfa" : yuk <= 35 ? "#34d399" : yuk <= 50 ? "#fbbf24" : "#fb7185"}
              alt={yuk === null ? `${num(goal.loanMonths) || 0} ay` : `Gelire oranı %${yuk.toFixed(0)} · ${yuk <= 35 ? "rahat" : yuk <= 50 ? "zorlayıcı" : "sürdürülemez"}`} />
          ) : null}
          {aylikBirikim ? (
            <Kutu etiket="Aylık Biriktirmelisin" deger={money(aylikBirikim)} renk="#fbbf24" alt={`${ay} ay içinde yetişmek için`} />
          ) : null}
        </div>

        {/* İlerleme */}
        <div style={{ marginTop: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>
            <span>Karşılanan</span><strong style={{ color: "#fff" }}>%{c.percent.toFixed(1)}</strong>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
            <div style={{ width: `${c.percent}%`, height: "100%", background: tamam ? "linear-gradient(90deg,#34d399,#22c55e)" : "linear-gradient(90deg,#60a5fa,#a78bfa)" }} />
          </div>
        </div>

        {/* Emlakçı dosyası: iki tablo yan yana — ne ödüyorum / nereden buluyorum */}
        {c.price > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 11, marginTop: 14 }}>
            <TabloKutu baslik="Ödeyeceklerin" ikon="🧾">
              <Tablo
                renk="#93c5fd"
                basliklar={["Kalem", "Tutar"]}
                not="Oranlar 2026 mevzuatına göredir. DASK ve konut sigortası ayrıca ödenir."
                satirlar={[
                  { hucreler: ["Ev fiyatı", money(c.price)] },
                  { hucreler: ["Tapu harcı (%4)", money(c.masraflar.tapu)], not: "Yasada yarısı satıcının; pratikte alıcı öder" },
                  { hucreler: ["Emlak komisyonu (%2 + KDV)", money(c.masraflar.komisyon)] },
                  ...(c.masraflar.ekspertiz > 0 ? [{ hucreler: ["Ekspertiz", money(c.masraflar.ekspertiz)], not: "Kredi çekilirken zorunlu" }] : []),
                  ...(c.masraflar.tahsis > 0 ? [{ hucreler: ["Kredi tahsis (binde 5)", money(c.masraflar.tahsis)] }] : []),
                  ...(c.masraflar.extra > 0 ? [{ hucreler: ["Tadilat / taşınma", money(c.masraflar.extra)] }] : []),
                  { hucreler: ["TOPLAM", money(c.target)], kalin: true, vurgu: true },
                ]}
              />
            </TabloKutu>

            <TabloKutu baslik="Nereden karşılıyorsun" ikon="🏦">
              <Tablo
                renk="#c4b5fd"
                basliklar={["Kaynak", "Tutar"]}
                not={c.taksit > 0 ? `Kredi ${num(goal.loanMonths) || 0} ay boyunca aylık ${money(c.taksit)} taksitle geri ödenir.` : null}
                satirlar={[
                  { hucreler: ["Nakit / birikim", money(c.cash)] },
                  { hucreler: ["Ev satışı (net)", money(c.sellNet)], not: num(goal.sellHomeDebt) > 0 ? `${money(num(goal.sellHome))} − ${money(num(goal.sellHomeDebt))} kredi borcu` : null },
                  { hucreler: ["Konut kredisi", money(c.loan)] },
                  { hucreler: ["TOPLAM KAYNAK", money(c.resources)], kalin: true, vurgu: true },
                  { hucreler: [c.gap > 0 ? "Açık" : "Fazla", money(Math.abs(c.gap))], kalin: true, renk: c.gap > 0 ? "#fbbf24" : "#86efac" },
                ]}
              />
            </TabloKutu>
          </div>
        ) : null}

        {/* Uyarılar */}
        {uyarilar.length ? (
          <div style={{ marginTop: 13, display: "grid", gap: 7 }}>
            {uyarilar.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 8, color: "#fbbf24", fontSize: 11.5, lineHeight: 1.5, background: "rgba(251,191,36,.09)", border: "1px solid rgba(251,191,36,.24)", borderRadius: 11, padding: "9px 11px" }}>
                <span>⚠</span><span>{u}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AracKarti({ goal, c, onChange, onDelete, likit, aylikGelir }) {
  const ayKalan = aylikKalan(goal.targetDate);
  const aylikBirikim = c.gap > 0 && ayKalan && ayKalan > 0 ? c.gap / ayKalan : null;
  // Araçta ödenebilirlik TAKSİT değil, TOPLAM aylık araç gideri üzerinden ölçülür.
  const yuk = aylikGelir > 0 ? (c.taksit / aylikGelir) * 100 : null;

  const uyarilar = [];
  if (c.price > 0 && c.limit.oran === 0 && c.loan > 0)
    uyarilar.push(`Bu fiyat bandında taşıt kredisi kullanılamıyor (BDDK). Aracı tamamen nakit/takasla almalısın.`);
  else if (c.loan > c.limit.maxKredi && c.limit.maxKredi > 0)
    uyarilar.push(`Bu araç için azami kredi ${money(c.limit.maxKredi)} (değerin %${(c.limit.oran * 100).toFixed(0)}'i). En az ${money(c.price - c.limit.maxKredi)} peşinat gerekir.`);
  if (c.ay > c.limit.maxVade && c.limit.maxVade > 0)
    uyarilar.push(`Bu fiyat bandında azami vade ${c.limit.maxVade} ay. ${c.ay} ay yazdın — banka kabul etmez.`);
  if (yuk !== null && yuk > 35)
    uyarilar.push(`Taksit / gelir oranı %${yuk.toFixed(0)}. Rahat sayılan sınır %35 — vadeyi uzatmayı ya da krediyi düşürmeyi düşün.`);

  const tamam = c.gap <= 0;

  return (
    <article style={{ ...card, display: "grid", gap: 13 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 11, alignItems: "end" }}>
        <Alan label="🚗 Hedef Adı">
          <input style={inputStyle} value={goal.name || ""} placeholder="Örn: Araç Alma Hedefi" onChange={(e) => onChange("name", e.target.value)} />
        </Alan>
        <Alan label="Ne zaman almak istiyorsun?">
          <input style={inputStyle} type="date" value={goal.targetDate || ""} onChange={(e) => onChange("targetDate", e.target.value)} />
        </Alan>
        <div style={{ justifySelf: "end" }}>
          <button type="button" className="deleteButton" onClick={onDelete}>Sil</button>
        </div>
      </div>

      {/* ARAÇ KÜNYESİ — galeri etiketi gibi tek şerit */}
      <div style={{
        border: "1px solid rgba(245,158,11,.3)", borderRadius: 16, padding: "13px 15px",
        background: "linear-gradient(120deg, rgba(245,158,11,.14), rgba(2,6,23,.5))",
        // alignItems: start — alanların ipucu satırı farklı yükseklikte olduğu için
        // "end" hizalamada girdi kutuları kayıyordu.
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, alignItems: "start",
      }}>
        <div style={{ gridColumn: "1 / -1", color: "#fcd34d", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em" }}>
          🏷️ Araç Künyesi
        </div>
        <Alan label="Aracın Fiyatı (₺)" hint="Satıcının istediği fiyat">
          <input style={inputStyle} inputMode="decimal" value={goal.price || ""} placeholder="Örn: 1.450.000" onChange={(e) => onChange("price", e.target.value)} />
        </Alan>
        <Alan label="Yakıt Tipi" hint="Elektrikliye daha yüksek kredi limiti">
          <select style={inputStyle} value={goal.fuel || "ice"} onChange={(e) => onChange("fuel", e.target.value)}>
            <option value="ice">Benzin / Dizel / Hibrit</option>
            <option value="ev">Elektrikli</option>
          </select>
        </Alan>
        <Alan label="Durumu" hint="Sıfır ilk yıl daha hızlı değer kaybeder">
          <select style={inputStyle} value={goal.condition || "new"} onChange={(e) => onChange("condition", e.target.value)}>
            <option value="new">Sıfır</option>
            <option value="used">İkinci El</option>
          </select>
        </Alan>
      </div>

      <Blok renk="#fcd34d" zemin="rgba(245,158,11,.22)" no="1" baslik="Elindeki kaynaklar">
        <Alan
          label="Nakit / Birikim (₺)"
          hint="Peşinat için ayırabileceğin tutar"
          aksiyon={likit > 0 ? (
            <button type="button" onClick={() => onChange("cash", String(Math.round(likit)))}
              style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              Portföyümden al ({money(likit)})
            </button>
          ) : null}
        >
          <input style={inputStyle} inputMode="decimal" value={goal.cash || ""} placeholder="0" onChange={(e) => onChange("cash", e.target.value)} />
        </Alan>
        <Alan label="Takas / Satacağın Araç (₺)" hint="Mevcut aracını verecekesen değerini yaz">
          <input style={inputStyle} inputMode="decimal" value={goal.tradeIn || ""} placeholder="0" onChange={(e) => onChange("tradeIn", e.target.value)} />
        </Alan>
      </Blok>

      <Blok renk="#fcd34d" zemin="rgba(245,158,11,.22)" no="2" baslik="Taşıt kredisi" aciklama="Kredi kullanmayacaksan boş bırak.">
        <Alan
          label="Kredi Tutarı (₺)"
          hint={c.price > 0
            ? (c.limit.oran === 0
              ? "⚠ Bu fiyat bandında kredi kullanılamıyor"
              : `Azami: ${money(c.limit.maxKredi)} (değerin %${(c.limit.oran * 100).toFixed(0)}'i)`)
            : "Limit, araç fiyatına göre kademeli belirlenir"}
        >
          <input style={inputStyle} inputMode="decimal" value={goal.loan || ""} placeholder="0" onChange={(e) => onChange("loan", e.target.value)} />
        </Alan>
        <Alan label="Vade (ay)" hint={c.price > 0 && c.limit.maxVade > 0 ? `Azami ${c.limit.maxVade} ay` : "Fiyat bandına göre değişir"}>
          <input style={inputStyle} inputMode="decimal" value={goal.loanMonths || ""} placeholder="24" onChange={(e) => onChange("loanMonths", e.target.value)} />
        </Alan>
        <Alan label="Aylık Faiz (%)" hint="Taşıt kredisi ~%3–4">
          <input style={inputStyle} inputMode="decimal" value={goal.loanRate || ""} placeholder="3,25" onChange={(e) => onChange("loanRate", e.target.value)} />
        </Alan>
      </Blok>

      {/* SONUÇ */}
      <div style={{
        border: `1px solid ${tamam ? "rgba(34,197,94,.4)" : "rgba(251,191,36,.4)"}`,
        borderRadius: 18, padding: 17,
        background: tamam
          ? "linear-gradient(150deg, rgba(34,197,94,.15), rgba(15,23,42,.6))"
          : "linear-gradient(150deg, rgba(251,191,36,.13), rgba(15,23,42,.6))",
      }}>
        <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
          {tamam ? "Bu aracı alabilirsin" : "Eksik kaynak"}
        </div>
        <div style={{ color: tamam ? "#86efac" : "#fbbf24", fontSize: "clamp(26px, 4.5vw, 38px)", fontWeight: 900, lineHeight: 1.1, margin: "5px 0 3px" }}>
          {tamam ? `+${money(Math.abs(c.gap))}` : money(c.gap)}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 11.5 }}>
          {tamam ? "Kaynakların alım maliyetini karşılıyor." : "Alım için bulman gereken ek tutar."}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 9, marginTop: 14 }}>
          <Kutu etiket="Alım Maliyeti" deger={money(c.target)} renk="#e2e8f0" alt={`Fiyat + ${money(c.masrafToplam)} noter/tescil`} />
          {c.taksit > 0 ? (
            <Kutu etiket="Aylık Kredi Ödemesi" deger={money(c.taksit)}
              renk={yuk === null ? "#fbbf24" : yuk <= 35 ? "#34d399" : yuk <= 50 ? "#fbbf24" : "#fb7185"}
              alt={yuk === null ? `${c.ay || 0} ay vade` : `Gelire oranı %${yuk.toFixed(0)} · ${c.ay} ay`} />
          ) : null}
          {c.toplamGeriOdeme > 0 ? (
            <Kutu etiket="Toplam Geri Ödeme" deger={money(c.toplamGeriOdeme)} renk="#a78bfa"
              alt={`${money(c.toplamGeriOdeme - c.loan)} faiz`} />
          ) : null}
          {aylikBirikim ? (
            <Kutu etiket="Aylık Biriktirmelisin" deger={money(aylikBirikim)} renk="#fbbf24" alt={`${ayKalan} ay içinde yetişmek için`} />
          ) : null}
        </div>

        {/* İlerleme */}
        <div style={{ marginTop: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>
            <span>Karşılanan</span><strong style={{ color: "#fff" }}>%{c.percent.toFixed(1)}</strong>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
            <div style={{ width: `${c.percent}%`, height: "100%", background: tamam ? "linear-gradient(90deg,#34d399,#22c55e)" : "linear-gradient(90deg,#60a5fa,#a78bfa)" }} />
          </div>
        </div>

        {/* Galerici raporu: kredi bandın + yıl yıl değer kaybı */}
        {c.price > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 11, marginTop: 14 }}>
            <TabloKutu baslik="Kredi bandın (BDDK)" ikon="📋">
              <Tablo
                renk="#fcd34d"
                basliklar={["Araç değeri", "Kredi", "Vade"]}
                not="Vurgulu satır senin aracının bandı. Değer yükseldikçe kredi oranı düşer, vade kısalır."
                satirlar={KREDI_KADEMELERI[goal.fuel === "ev" ? "ev" : "ice"].map((k, i, arr) => {
                  const alt = i === 0 ? 0 : arr[i - 1].ustSinir;
                  const aralik = k.ustSinir === Infinity ? `${money(alt)} üzeri` : `${money(alt)} – ${money(k.ustSinir)}`;
                  return {
                    hucreler: [aralik, k.oran > 0 ? `%${(k.oran * 100).toFixed(0)}` : "yok", k.vade > 0 ? `${k.vade} ay` : "—"],
                    vurgu: c.price > alt && c.price <= k.ustSinir,
                    kalin: c.price > alt && c.price <= k.ustSinir,
                  };
                })}
              />
            </TabloKutu>

            <TabloKutu baslik="Alım masrafları ve kredi" ikon="🧾">
              <Tablo
                renk="#fcd34d"
                basliklar={["Kalem", "Tutar"]}
                not="Noter tarifesi 2026'ya göredir."
                satirlar={[
                  { hucreler: ["Noter satış harcı (binde 2)", money(c.masraflar.noterHarc)], not: "Asgari 1.000 ₺" },
                  { hucreler: ["Noter hizmet bedeli", money(c.masraflar.noterHizmet)], not: "Harcın %30'u + sayfa/nüsha/bildirim" },
                  { hucreler: ["Tescil / plaka", money(c.masraflar.tescil)] },
                  { hucreler: ["ALIM MASRAFI TOPLAMI", money(c.masrafToplam)], kalin: true, vurgu: true },
                  ...(c.taksit > 0 ? [
                    { hucreler: ["Aylık kredi taksiti", money(c.taksit)], not: `${c.ay} ay vade` },
                    { hucreler: ["TOPLAM GERİ ÖDEME", money(c.toplamGeriOdeme)], kalin: true, vurgu: true, renk: "#fbbf24" },
                  ] : []),
                ]}
              />
            </TabloKutu>
          </div>
        ) : null}

        {uyarilar.length ? (
          <div style={{ marginTop: 13, display: "grid", gap: 7 }}>
            {uyarilar.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 8, color: "#fbbf24", fontSize: 11.5, lineHeight: 1.5, background: "rgba(251,191,36,.09)", border: "1px solid rgba(251,191,36,.24)", borderRadius: 11, padding: "9px 11px" }}>
                <span>⚠</span><span>{u}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SeyahatSatiri({ kalem, deger, onChange, renk, simge, dovizli, tl }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <td style={{ padding: "8px 10px" }}>
        <span style={{ display: "block", color: "#e2e8f0", fontSize: 12.5 }}>{kalem.ad}</span>
        <span style={{ display: "block", color: "#64748b", fontSize: 10 }}>{kalem.birim}</span>
      </td>
      <td style={{ padding: "8px 10px", textAlign: "right" }}>
        <input
          style={{
            width: 96, boxSizing: "border-box", textAlign: "right",
            border: "1px solid rgba(255,255,255,.13)", background: "rgba(2,6,23,.55)",
            color: deger ? "#f8fafc" : "#64748b", borderRadius: 7, padding: "5px 8px",
            outline: "none", fontSize: 11.5, fontVariantNumeric: "tabular-nums",
          }}
          inputMode="decimal" value={deger || ""} placeholder={String(kalem.ornek)}
          onFocus={(e) => { e.target.style.borderColor = renk; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,.13)"; }}
          onChange={(e) => onChange(e.target.value)}
        />
      </td>
      <td style={{ padding: "8px 6px", textAlign: "center", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
        ×{kalem.carpan === "bir" ? 1 : kalem.carpanDeger}
      </td>
      <td style={{ padding: "8px 10px", textAlign: "right", color: "#fff", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {simge}{kalem.toplam.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
      </td>
      {dovizli ? (
        <td style={{ padding: "8px 10px", textAlign: "right", color: "#a5f3fc", fontSize: 12, whiteSpace: "nowrap" }}>
          {money(tl(kalem.toplam))}
        </td>
      ) : null}
    </tr>
  );
}

function SeyahatKarti({ goal, c, onChange, onDelete, likit, aylikKalanPara }) {
  const ayKalan = aylikKalan(goal.targetDate);
  const aylikBirikim = c.gap > 0 && ayKalan && ayKalan > 0 ? c.gap / ayKalan : null;
  const onItem = (k, v) => onChange("items", { ...c.rawItems, [k]: v });
  const dovizli = (goal.currency || "TRY") !== "TRY";
  const eksikCarpan = c.kisi === 0 || c.gece === 0;

  const uyarilar = [];
  if (eksikCarpan) uyarilar.push("Kişi sayısı ve gece sayısını gir — kalemler bu çarpanlarla hesaplanıyor.");
  if (aylikBirikim && aylikKalanPara > 0 && aylikBirikim > aylikKalanPara)
    uyarilar.push(`Ayda ${money(aylikBirikim)} biriktirmen gerekiyor ama aylık kalanın ${money(aylikKalanPara)}. Tarihi ilerletmen ya da bütçeyi küçültmen gerekebilir.`);

  const tamam = c.gap <= 0;
  const th = (renk) => ({ padding: "7px 10px", color: renk, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid rgba(255,255,255,.1)" });

  const bolum = (baslik, ikon, kalemler, toplam, renk, kenar, zemin, aciklama) => (
    <section style={{ border: `1px solid ${kenar}`, borderRadius: 16, overflow: "hidden", background: "rgba(2,6,23,.4)" }}>
      <header style={{ padding: "10px 13px", background: zemin, borderBottom: `1px solid ${kenar}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12.5 }}>{ikon} {baslik}</span>
        <span style={{ color: renk, fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap" }}>{c.para.simge}{toplam.toLocaleString("tr-TR",{maximumFractionDigits:0})}{dovizli ? <span style={{ color: "#a5f3fc", fontSize: 11, fontWeight: 700, marginLeft: 7 }}>{money(c.tl(toplam))}</span> : null}</span>
      </header>
      {aciklama ? <div style={{ padding: "7px 13px 0", color: "#64748b", fontSize: 10.5 }}>{aciklama}</div> : null}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
          <thead><tr>
            <th style={{ ...th(renk), textAlign: "left" }}>Kalem</th>
            <th style={{ ...th(renk), textAlign: "right" }}>Birim</th>
            <th style={{ ...th(renk), textAlign: "center" }}>Adet</th>
            <th style={{ ...th(renk), textAlign: "right" }}>Toplam</th>
            {dovizli ? <th style={{ ...th(renk), textAlign: "right" }}>₺ Karşılığı</th> : null}
          </tr></thead>
          <tbody>
            {kalemler.map((x) => (
              <SeyahatSatiri key={x.k} renk={renk} simge={c.para.simge} dovizli={dovizli} tl={c.tl}
                kalem={{ ...x, carpanDeger: x.carpan }}
                deger={c.rawItems[x.k]} onChange={(v) => onItem(x.k, v)} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <article style={{
      border: "1px solid rgba(34,211,238,.26)", borderRadius: 20, padding: 17,
      background: "linear-gradient(165deg, rgba(8,51,68,.5), rgba(15,23,42,.85))",
      display: "grid", gap: 13,
    }}>
      {/* Sefer künyesi */}
      <div style={{
        border: "1px solid rgba(34,211,238,.3)", borderRadius: 16, padding: "13px 15px",
        background: "linear-gradient(120deg, rgba(34,211,238,.14), rgba(2,6,23,.5))",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 12, alignItems: "start",
      }}>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#67e8f9", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em" }}>✈️ Sefer Bilgileri</span>
          <button type="button" className="deleteButton" onClick={onDelete}>Sil</button>
        </div>
        <Alan label="Nereye?" hint="Şehir / ülke">
          <input style={inputStyle} value={goal.destination || ""} placeholder="Örn: Roma" onChange={(e) => onChange("destination", e.target.value)} />
        </Alan>
        <Alan label="Kaç Kişi?" hint="Bütçe buna göre çarpılır">
          <input style={inputStyle} inputMode="decimal" value={goal.people || ""} placeholder="2" onChange={(e) => onChange("people", e.target.value)} />
        </Alan>
        <Alan label="Kaç Gece?" hint="Konaklama ve günlük gider">
          <input style={inputStyle} inputMode="decimal" value={goal.nights || ""} placeholder="5" onChange={(e) => onChange("nights", e.target.value)} />
        </Alan>
        <Alan label="Gidiş Tarihi" hint="Birikim planı için">
          <input style={inputStyle} type="date" value={goal.targetDate || ""} onChange={(e) => onChange("targetDate", e.target.value)} />
        </Alan>
        <Alan label="Bütçe Para Birimi" hint="Kalemleri bu birimde gir">
          <select style={inputStyle} value={goal.currency || "TRY"}
            onChange={(e) => { const p = paraMeta(e.target.value); onChange("currency", e.target.value); if (e.target.value !== "TRY") onChange("rate", goal.rate || p.kur); }}>
            {SEYAHAT_PARA.map((p) => <option key={p.id} value={p.id}>{p.simge} {p.ad}</option>)}
          </select>
        </Alan>
        {dovizli ? (
          <Alan label={`1 ${c.para.ad} = ? ₺`} hint="Güncel kuru yaz">
            <input style={inputStyle} inputMode="decimal" value={goal.rate ?? c.para.kur} onChange={(e) => onChange("rate", e.target.value)} />
          </Alan>
        ) : null}
      </div>

      {/* İki mantık: sabit ve günlük */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        {bolum("SABİT GİDERLER", "🎫", c.sabit, c.sabitToplam, "#67e8f9", "rgba(34,211,238,.3)", "linear-gradient(120deg, rgba(34,211,238,.24), rgba(34,211,238,.08))",
          "Bir kez ödenir — kişi ya da gece sayısıyla çarpılır.")}
        <div style={{ display: "grid", gap: 12 }}>
          {bolum("GÜNLÜK HARCAMALAR", "🍽️", c.gunluk, c.gunlukToplam, "#a5b4fc", "rgba(129,140,248,.3)", "linear-gradient(120deg, rgba(129,140,248,.24), rgba(129,140,248,.08))",
            `Kişi × gece ile çarpılır (${c.kisi || 0} kişi × ${c.gece || 0} gece = ${(c.kisi || 0) * (c.gece || 0)}).`)}
          {bolum("DİĞER", "🛍️", c.diger, c.digerToplam, "#cbd5e1", "rgba(148,163,184,.28)", "linear-gradient(120deg, rgba(148,163,184,.2), rgba(148,163,184,.06))")}
        </div>
      </div>

      {/* Beklenmedik gider payı */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        border: "1px solid rgba(251,191,36,.28)", borderRadius: 14, padding: "11px 14px", background: "rgba(251,191,36,.09)",
      }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", color: "#fde68a", fontWeight: 800, fontSize: 12.5 }}>🛟 Beklenmedik gider payı</span>
          <span style={{ display: "block", color: "#94a3b8", fontSize: 10.5, marginTop: 1 }}>
            Gecikme, hastalık, kur farkı… Sektör önerisi bütçenin %10'u.
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <input style={{ width: 62, boxSizing: "border-box", textAlign: "right", border: "1px solid rgba(255,255,255,.14)", background: "rgba(2,6,23,.55)", color: "#f8fafc", borderRadius: 8, padding: "6px 9px", outline: "none", fontSize: 12.5 }}
            inputMode="decimal" value={goal.contingency ?? "10"} onChange={(e) => onChange("contingency", e.target.value)} />
          <span style={{ color: "#94a3b8", fontSize: 12 }}>%</span>
          <strong style={{ color: "#fbbf24", fontSize: 14, minWidth: 90, textAlign: "right" }}>{c.para.simge}{c.pay.toLocaleString("tr-TR",{maximumFractionDigits:0})}</strong>
        </span>
      </div>

      {/* TOPLAM */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        border: "1px solid rgba(34,211,238,.4)", borderRadius: 16, padding: "14px 18px",
        background: "linear-gradient(120deg, rgba(34,211,238,.24), rgba(30,58,138,.22))",
      }}>
        <div>
          <div style={{ color: "#a5f3fc", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>Toplam Seyahat Bütçesi</div>
          <div style={{ color: "#fff", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, lineHeight: 1.15 }}>{money(c.targetTL)}</div>
          {dovizli ? <div style={{ color: "#a5f3fc", fontSize: 13, fontWeight: 700 }}>{c.para.simge}{c.target.toLocaleString("tr-TR",{maximumFractionDigits:0})} · kur {c.kur}</div> : null}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {c.kisi > 0 ? (
            <span><span style={{ display: "block", color: "#a5f3fc", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Kişi Başına</span>
              <strong style={{ color: "#fff", fontSize: 15 }}>{money(c.kisiBasi)}</strong></span>
          ) : null}
          {c.gece > 0 ? (
            <span><span style={{ display: "block", color: "#a5f3fc", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Gece Başına</span>
              <strong style={{ color: "#fff", fontSize: 15 }}>{money(c.gunBasi)}</strong></span>
          ) : null}
        </div>
      </div>

      {/* Kaynak + sonuç */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        border: `1px solid ${tamam ? "rgba(34,197,94,.42)" : "rgba(248,113,113,.4)"}`, borderRadius: 16, padding: "13px 16px",
        background: tamam ? "linear-gradient(120deg, rgba(34,197,94,.16), rgba(15,23,42,.5))" : "linear-gradient(120deg, rgba(248,113,113,.14), rgba(15,23,42,.5))",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>
            <span style={{ display: "block", color: "#cbd5e1", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>Ayırdığın bütçe</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <input style={{ width: 128, boxSizing: "border-box", textAlign: "right", border: "1px solid rgba(255,255,255,.14)", background: "rgba(2,6,23,.55)", color: "#f8fafc", borderRadius: 8, padding: "6px 9px", outline: "none", fontSize: 13 }}
                inputMode="decimal" value={goal.cash || ""} placeholder="0" onChange={(e) => onChange("cash", e.target.value)} />
              {likit > 0 ? (
                <button type="button" onClick={() => onChange("cash", String(Math.round(likit)))}
                  style={{ background: "none", border: "none", color: "#67e8f9", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
                  Portföyümden al
                </button>
              ) : null}
            </span>
          </span>
        </span>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#cbd5e1", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>
            {tamam ? "Bütçen yeterli" : "Eksik"}
          </div>
          <div style={{ color: tamam ? "#86efac" : "#fca5a5", fontSize: 24, fontWeight: 900, lineHeight: 1.2 }}>
            {tamam ? `+${money(Math.abs(c.gap))}` : money(c.gap)}
          </div>
          {aylikBirikim ? (
            <div style={{ color: "#fbbf24", fontSize: 11 }}>Ayda {money(aylikBirikim)} · {ayKalan} ay kaldı</div>
          ) : null}
        </div>
      </div>

      {uyarilar.length ? (
        <div style={{ display: "grid", gap: 7 }}>
          {uyarilar.map((u, i) => (
            <div key={i} style={{ display: "flex", gap: 8, color: "#fbbf24", fontSize: 11.5, lineHeight: 1.5, background: "rgba(251,191,36,.09)", border: "1px solid rgba(251,191,36,.24)", borderRadius: 11, padding: "9px 11px" }}>
              <span>⚠</span><span>{u}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function EvlilikKarti({ goal, c, onChange, onApplyPreset, onDelete, likit, aylikKalanPara }) {
  const ayKalan = aylikKalan(goal.targetDate);
  const aylikBirikim = c.gap > 0 && ayKalan && ayKalan > 0 ? c.gap / ayKalan : null;
  const bosMu = c.dugunGruplar.length === 0 && c.evGruplar.length === 0;

  const uyarilar = [];
  if (c.takiKarsilama > 60)
    uyarilar.push(`Beklenen takı, bütçenin %${c.takiKarsilama.toFixed(0)} kadarını karşılıyor. Gelen takı davetli profiline göre değişir ve garanti değildir; planı buna fazla yaslama.`);
  if (aylikBirikim && aylikKalanPara > 0 && aylikBirikim > aylikKalanPara)
    uyarilar.push(`Ayda ${money(aylikBirikim)} biriktirmen gerekiyor ama aylık kalanın ${money(aylikKalanPara)}. Tarihi ilerletmen ya da bütçeyi küçültmen gerekebilir.`);

  const tamam = c.gap <= 0;
  const kaynakSatir = (etiket, alan, ipucu, aksiyon) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{etiket}</span>
        {ipucu ? <span style={{ display: "block", color: "#64748b", fontSize: 10, marginTop: 1 }}>{ipucu}</span> : null}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        {aksiyon}
        <input style={{ width: 118, boxSizing: "border-box", textAlign: "right", border: "1px solid rgba(255,255,255,.14)", background: "rgba(2,6,23,.55)", color: "#f8fafc", borderRadius: 8, padding: "6px 9px", outline: "none", fontSize: 12.5 }}
          inputMode="decimal" value={goal[alan] || ""} placeholder="0" onChange={(e) => onChange(alan, e.target.value)} />
      </span>
    </div>
  );

  return (
    <article style={{
      border: "1px solid rgba(148,163,184,.22)", borderRadius: 20, padding: 17,
      background: "linear-gradient(165deg, rgba(30,41,59,.7), rgba(15,23,42,.85))",
      display: "grid", gap: 14,
    }}>
      {/* Künye */}
      <div style={{ display: "flex", gap: 11, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 180px" }}>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>💍 HEDEF ADI</span>
          <input style={inputStyle} value={goal.name || ""} placeholder="Evlilik Hedefi" onChange={(e) => onChange("name", e.target.value)} />
        </label>
        <label style={{ flex: "0 1 165px" }}>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>DÜĞÜN TARİHİ</span>
          <input style={inputStyle} type="date" value={goal.targetDate || ""} onChange={(e) => onChange("targetDate", e.target.value)} />
        </label>
        <label style={{ flex: "0 1 120px" }}>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>DAVETLİ</span>
          <input style={inputStyle} inputMode="decimal" value={goal.guests || ""} placeholder="200" onChange={(e) => onChange("guests", e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {EVLILIK_OLCEK.map((o) => (
            <button key={o.id} type="button" onClick={() => onApplyPreset(evlilikSablonUret(o.carpan))}
              title="Bu ölçeğin 2026 ortalamalarıyla tüm grupları ve kalemleri doldur"
              style={{ border: "1px solid rgba(148,163,184,.32)", background: "rgba(2,6,23,.5)", color: "#e2e8f0", borderRadius: 9, padding: "9px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
              {o.label}
            </button>
          ))}
        </div>
        <button type="button" className="deleteButton" onClick={onDelete}>Sil</button>
      </div>

      {bosMu ? (
        <div style={{ border: "1px dashed rgba(148,163,184,.3)", borderRadius: 14, padding: "18px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13.5, lineHeight: 1.6 }}>
          Bütçen boş. Yukarıdaki <strong style={{ color: "#e2e8f0" }}>Sade / Standart / Gösterişli</strong> düğmelerinden biriyle hazır
          şablonla başla — sonra her grubu ve kalemi kendine göre düzenle, sil, yenisini ekle.
        </div>
      ) : null}

      {/* İKİ RENK AİLESİ: düğün (mavi) / ev (yeşil) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 13 }}>
        <ButceBolumu
          baslik="DÜĞÜN SÜRECİ" ikon="💍"
          tema={{ ana: "#3b82f6", acik: "#bfdbfe", zemin: "rgba(59,130,246,.14)", kenar: "rgba(59,130,246,.34)" }}
          gruplar={c.dugunGruplar} onGruplar={(g) => onChange("dugunGruplar", g)} />
        <ButceBolumu
          baslik="EV KURMA" ikon="🏡"
          tema={{ ana: "#22c55e", acik: "#bbf7d0", zemin: "rgba(34,197,94,.13)", kenar: "rgba(34,197,94,.32)" }}
          gruplar={c.evGruplar} onGruplar={(g) => onChange("evGruplar", g)} />
      </div>

      {/* GENEL TOPLAM — mor */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        border: "1px solid rgba(168,85,247,.42)", borderRadius: 16, padding: "14px 18px",
        background: "linear-gradient(120deg, rgba(168,85,247,.28), rgba(88,28,135,.2))",
      }}>
        <div>
          <div style={{ color: "#e9d5ff", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>Genel Toplam</div>
          <div style={{ color: "#fff", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, lineHeight: 1.15 }}>{money(c.target)}</div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span><span style={{ display: "block", color: "#c4b5fd", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Düğün</span>
            <strong style={{ color: "#bfdbfe", fontSize: 16 }}>{money(c.dugunToplam)}</strong></span>
          <span><span style={{ display: "block", color: "#c4b5fd", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Ev Kurma</span>
            <strong style={{ color: "#bbf7d0", fontSize: 16 }}>{money(c.evToplam)}</strong></span>
          {c.davetli > 0 ? (
            <span><span style={{ display: "block", color: "#c4b5fd", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Davetli Başına</span>
              <strong style={{ color: "#fff", fontSize: 16 }}>{money(c.kisiBasiToplam)}</strong></span>
          ) : null}
        </div>
      </div>

      {/* KAYNAKLAR */}
      <div style={{ border: "1px solid rgba(251,191,36,.26)", borderRadius: 16, background: "rgba(2,6,23,.42)", overflow: "hidden" }}>
        <div style={{ padding: "10px 13px", background: "rgba(251,191,36,.11)", borderBottom: "1px solid rgba(251,191,36,.22)", color: "#fde68a", fontWeight: 900, fontSize: 12.5 }}>
          💐 Kaynaklar
        </div>
        {kaynakSatir("Nakit / birikim", "cash", "Peşin ödeyebileceğin tutar",
          likit > 0 ? (
            <button type="button" onClick={() => onChange("cash", String(Math.round(likit)))}
              style={{ background: "none", border: "none", color: "#93c5fd", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
              Portföyümden al
            </button>
          ) : null)}
        {kaynakSatir("Beklenen takı + para", "expectedGifts", "Düğünde takılacağını tahmin ettiğin altın ve para")}
        {kaynakSatir("Aile katkısı", "familyHelp", "İki taraftan gelecek destek")}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", background: "rgba(251,191,36,.07)" }}>
          <span style={{ color: "#fde68a", fontWeight: 900, fontSize: 12.5 }}>TOPLAM KAYNAK</span>
          <strong style={{ color: "#fff", fontSize: 15 }}>{money(c.resources)}</strong>
        </div>
      </div>

      {/* SONUÇ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        border: `1px solid ${tamam ? "rgba(34,197,94,.42)" : "rgba(248,113,113,.42)"}`, borderRadius: 16, padding: "14px 17px",
        background: tamam ? "linear-gradient(120deg, rgba(34,197,94,.17), rgba(15,23,42,.5))" : "linear-gradient(120deg, rgba(248,113,113,.15), rgba(15,23,42,.5))",
      }}>
        <div>
          <div style={{ color: "#cbd5e1", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
            {tamam ? "Bütçen yeterli" : "Eksik kaynak"}
          </div>
          <div style={{ color: tamam ? "#86efac" : "#fca5a5", fontSize: "clamp(23px, 4vw, 32px)", fontWeight: 900, lineHeight: 1.15 }}>
            {tamam ? `+${money(Math.abs(c.gap))}` : money(c.gap)}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>Karşılanan: %{c.percent.toFixed(1)}</div>
        </div>
        {aylikBirikim ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Aylık biriktirmelisin</div>
            <div style={{ color: "#fbbf24", fontSize: 19, fontWeight: 900 }}>{money(aylikBirikim)}</div>
            <div style={{ color: "#64748b", fontSize: 10.5 }}>{ayKalan} ay kaldı</div>
          </div>
        ) : null}
      </div>

      {uyarilar.length ? (
        <div style={{ display: "grid", gap: 7 }}>
          {uyarilar.map((u, i) => (
            <div key={i} style={{ display: "flex", gap: 8, color: "#fbbf24", fontSize: 11.5, lineHeight: 1.5, background: "rgba(251,191,36,.09)", border: "1px solid rgba(251,191,36,.24)", borderRadius: 11, padding: "9px 11px" }}>
              <span>⚠</span><span>{u}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ color: "#64748b", fontSize: 10.5, lineHeight: 1.5 }}>
        Boş bıraktığın kalemler 0 sayılır. Ön ayar rakamları 2026 piyasa ortalamalarıdır; şehir ve mekâna göre değişir.
      </div>
    </article>
  );
}


function Kutu({ etiket, deger, renk, alt }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 13, padding: "10px 12px", background: "rgba(2,6,23,.45)", minWidth: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.3 }}>{etiket}</div>
      <div style={{ color: renk, fontSize: 16, fontWeight: 800, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{deger}</div>
      {alt ? <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{alt}</div> : null}
    </div>
  );
}

function Satir({ ad, tutar, not }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 4 }}>
      <span style={{ minWidth: 0 }}>{ad}{not ? <span style={{ display: "block", color: "#64748b", fontSize: 10 }}>{not}</span> : null}</span>
      <strong style={{ whiteSpace: "nowrap" }}>{money(tutar)}</strong>
    </div>
  );
}

export default function FinancialGoals({ data, setData, financeTotals, investmentTotals, monthlyBalance = 0 }) {
  const goals = data?.goals || [];
  const [bilgi, setBilgi] = useState("");
  // Sekme: açılışta hedefi olan ilk kategori, yoksa Konut.
  const [activeType, setActiveType] = useState(() => goals[0]?.type || "konut");
  const likitAvailable = Number(investmentTotals?.availableInvestment || 0);
  const aylikGelir = Number(financeTotals?.totalIncome || 0);
  const aktifTur = GOAL_TYPES.find((t) => t.id === activeType);
  const aktifHedefler = goals.filter((g) => g.type === activeType);

  // Hedef listesini DAİMA en güncel state üzerinden değiştir (bayat closure koruması).
  const mutateGoals = (fn) =>
    setData((d) => {
      const cur = { categories: [], assets: [], debts: [], goals: [], ...d };
      return { ...cur, goals: fn(cur.goals || []) };
    });

  const addGoal = (type) => {
    const meta = GOAL_TYPES.find((t) => t.id === type);
    if (!meta?.ready) return;
    setBilgi("");
    const base = { id: uid(), type, targetDate: "", cash: "" };
    const yeni =
      type === "arac"
        ? { ...base, name: "Araç Alma Hedefi", price: "", fuel: "ice", condition: "new", loan: "",
            tradeIn: "", loanMonths: "24", loanRate: "3,25" }
        : type === "seyahat"
        ? { ...base, name: "Seyahat Hedefi", destination: "", people: "2", nights: "5", currency: "TRY", rate: "", contingency: "10", items: {} }
        : type === "evlilik"
        ? { ...base, name: "Evlilik Hedefi", guests: "", expectedGifts: "", familyHelp: "", ...evlilikSablonUret(1) }
        : { ...base, name: "Ev Alma Hedefi", housePrice: "", extraCost: "", loan: "",
            sellHome: "", sellHomeDebt: "", loanMonths: "120", loanRate: "2,75" };
    mutateGoals((gs) => [yeni, ...gs]);
  };
  const updateGoal = (id, field, value) => mutateGoals((gs) => gs.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  const deleteGoal = (id) => mutateGoals((gs) => gs.filter((g) => g.id !== id));

  const summary = useMemo(() => {
    const gc = goals.map((g) => calcGoal(migrate(g)));
    const totalTarget = gc.reduce((s, g) => s + g.target, 0);
    const totalResources = gc.reduce((s, g) => s + g.resources, 0);
    const totalGap = gc.reduce((s, g) => s + Math.max(0, g.gap), 0);
    const totalTaksit = gc.reduce((s, g) => s + (g.taksit || 0), 0);
    const achievement = totalTarget > 0 ? Math.min(100, (totalResources / totalTarget) * 100) : 0;
    return { totalTarget, totalResources, totalGap, totalTaksit, achievement };
  }, [goals]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Özet */}
      <section style={card}>
        <h2 className="gradientTitle" style={{ margin: 0 }}>Finansal Durum Özeti</h2>
        <p className="sectionDescription" style={{ marginTop: 4 }}>
          Hedeflerinin gerçek maliyeti (masraflar dâhil) ve mevcut kaynakların.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 12 }}>
          <Kutu etiket="Likit Varlığın" deger={money(likitAvailable)} renk="#60a5fa" alt="BES hariç kullanılabilir" />
          <Kutu etiket="Toplam Maliyet" deger={money(summary.totalTarget)} renk="#e2e8f0" alt="Masraflar dâhil" />
          <Kutu etiket="Kaynakların" deger={money(summary.totalResources)} renk="#a78bfa" alt="Nakit + satış + kredi" />
          <Kutu etiket="Eksik Kaynak" deger={money(summary.totalGap)} renk={summary.totalGap > 0 ? "#fbbf24" : "#34d399"} alt={summary.totalGap > 0 ? "Bulunması gereken" : "Hedefler karşılanıyor"} />
          {summary.totalTaksit > 0 ? (
            <Kutu etiket="Aylık Taksit Yükü" deger={money(summary.totalTaksit)} renk="#fb7185"
              alt={aylikGelir > 0 ? `Gelire oranı %${((summary.totalTaksit / aylikGelir) * 100).toFixed(0)}` : "Kredi taksitleri"} />
          ) : null}
        </div>
      </section>

      {/* Kategori sekmeleri */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {GOAL_TYPES.map((t) => {
          const sayi = goals.filter((g) => g.type === t.id).length;
          const aktif = t.id === activeType;
          return (
            <button key={t.id} type="button" onClick={() => setActiveType(t.id)}
              style={{
                flex: "0 0 auto", display: "flex", alignItems: "center", gap: 7, padding: "10px 15px",
                borderRadius: 14, cursor: "pointer", whiteSpace: "nowrap",
                border: `1px solid ${aktif ? "rgba(96,165,250,.6)" : "rgba(255,255,255,.12)"}`,
                background: aktif ? "linear-gradient(135deg, rgba(96,165,250,.28), rgba(139,92,246,.2))" : "rgba(2,6,23,.45)",
                color: aktif ? "#fff" : "#cbd5e1", opacity: t.ready || aktif ? 1 : 0.6,
              }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{t.label}</span>
              {sayi > 0 ? (
                <span style={{ fontSize: 10, fontWeight: 900, background: "rgba(96,165,250,.35)", color: "#dbeafe", borderRadius: 999, padding: "1px 7px" }}>{sayi}</span>
              ) : !t.ready ? (
                <span style={{ fontSize: 9.5, color: "#94a3b8" }}>yakında</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Seçili kategorinin alanı */}
      <Hero type={activeType} />

      {aktifTur?.ready ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#94a3b8", fontSize: 12.5 }}>
              {aktifHedefler.length > 0 ? `${aktifHedefler.length} ${aktifTur.label.toLowerCase()} hedefi` : "Bu kategoride henüz hedefin yok."}
            </span>
            <button type="button" className="premiumButton" onClick={() => addGoal(activeType)}>
              + Yeni {aktifTur.label} Hedefi
            </button>
          </div>

          {aktifHedefler.length === 0 ? (
            <div style={{ ...card, textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 26 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{aktifTur.icon}</div>
              Yukarıdaki butonla ilk {aktifTur.label.toLowerCase()} hedefini oluştur.
            </div>
          ) : (
            aktifHedefler.map((raw) => {
              const goal = migrate(raw);
              const c = calcGoal(goal);
              const ortak = {
                goal, c, likit: likitAvailable, aylikGelir,
                onChange: (f, v) => updateGoal(goal.id, f, v),
                onDelete: () => deleteGoal(goal.id),
              };
              if (goal.type === "konut") return <KonutKarti key={goal.id} {...ortak} />;
              if (goal.type === "arac") return <AracKarti key={goal.id} {...ortak} />;
              if (goal.type === "seyahat") return (
                <SeyahatKarti key={goal.id} {...ortak} aylikKalanPara={monthlyBalance} />
              );
              if (goal.type === "evlilik") return (
                <EvlilikKarti key={goal.id} {...ortak} aylikKalanPara={monthlyBalance}
                  onApplyPreset={(p) => mutateGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, ...p, label: undefined } : g)))} />
              );
              return null;
            })
          )}
        </>
      ) : (
        <div style={{ ...card, textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 30 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>{aktifTur?.icon}</div>
          <strong style={{ color: "#fff", display: "block", marginBottom: 6 }}>{aktifTur?.label} hedefi hazırlanıyor</strong>
          Bu kategori için özel hesaplama ekranı yakında eklenecek.
        </div>
      )}
    </div>
  );
}
