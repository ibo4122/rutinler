"use client";

import { useMemo, useState } from "react";
import { money } from "../lib/format";

// Hedef türleri — her tür kendi ekranına sahip. Tür seçilince ekran o türe göre kurulur.
const GOAL_TYPES = [
  { id: "konut", label: "Konut", icon: "🏠", ready: true },
  { id: "arac", label: "Araç", icon: "🚗", ready: true },
  { id: "evlilik", label: "Evlilik", icon: "💍", ready: true },
  { id: "seyahat", label: "Seyahat", icon: "✈️", ready: false },
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
const YILLIK_SIGORTA_VERGI = 0.045; // kasko + trafik + MTV, araç değerine oranla (tahmini)
const SAHIPLIK_YIL = 3;             // "gerçek maliyet" ufku

function krediLimiti(price, fuel) {
  const tablo = KREDI_KADEMELERI[fuel === "ev" ? "ev" : "ice"];
  const kademe = tablo.find((k) => price <= k.ustSinir) || tablo[tablo.length - 1];
  return { maxKredi: price * kademe.oran, maxVade: kademe.vade, oran: kademe.oran };
}

// Değer kaybı: sıfır araç ilk yıl ~%20, sonraki yıllar ~%10; ikinci el ~%10/yıl.
function kalanDeger(price, yil, sifirMi) {
  let v = price;
  for (let y = 1; y <= yil; y++) v *= sifirMi && y === 1 ? 0.80 : 0.90;
  return v;
}

function calcArac(goal) {
  const price = num(goal.price);
  const loan = num(goal.loan);
  const cash = num(goal.cash);
  const tradeNet = Math.max(0, num(goal.tradeIn) - num(goal.tradeInDebt));
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

  // Sahip olma giderleri
  const aylikSigortaVergi = (price * YILLIK_SIGORTA_VERGI) / 12;
  const aylikKullanim = num(goal.monthlyRun);
  const aylikToplamGider = taksit + aylikSigortaVergi + aylikKullanim;

  // 3 yıllık gerçek maliyet: ödenenler − kalan değer
  const odenenTaksit = taksit * Math.min(ay, SAHIPLIK_YIL * 12);
  const odenenGider = (aylikSigortaVergi + aylikKullanim) * SAHIPLIK_YIL * 12;
  const pesinatCikan = cash + tradeNet;
  const kalan = kalanDeger(price, SAHIPLIK_YIL, sifirMi);
  const kalanKrediBorcu = Math.max(0, loan - (ay > 0 ? loan * (Math.min(ay, SAHIPLIK_YIL * 12) / ay) : 0));
  const gercekMaliyet = pesinatCikan + masrafToplam + odenenTaksit + odenenGider - (kalan - kalanKrediBorcu);

  const limit = krediLimiti(price, goal.fuel);

  return {
    price, loan, cash, tradeNet, sifirMi,
    masraflar: { noterHarc, noterHizmet, tescil },
    masrafToplam, target, resources, gap, percent,
    taksit, ay, aylikSigortaVergi, aylikKullanim, aylikToplamGider,
    kalan, degerKaybi: price - kalan, gercekMaliyet, limit,
  };
}

// --- Evlilik (Türkiye, 2026) ----------------------------------------------
// Sektörün kritik gerçeği: takı hem GİDER hem GELİRDİR. Düğünde gelen altın ve
// para, masrafın önemli bir kısmını karşılar — bütçe bunu görmezse yanıltır.
const EVLILIK_OLCEK = {
  sade: { label: "Sade", guests: "120", perGuest: "2000", attire: "50000", organization: "70000", jewelry: "200000", homeSetup: "350000", honeymoon: "60000" },
  orta: { label: "Orta", guests: "200", perGuest: "2500", attire: "100000", organization: "150000", jewelry: "550000", homeSetup: "750000", honeymoon: "150000" },
  genis: { label: "Gösterişli", guests: "350", perGuest: "5000", attire: "180000", organization: "300000", jewelry: "900000", homeSetup: "1200000", honeymoon: "300000" },
};

function calcEvlilik(goal) {
  const davetli = num(goal.guests);
  const kisiBasi = num(goal.perGuest);
  const salonYemek = davetli * kisiBasi;
  const attire = num(goal.attire);            // gelinlik + damatlık
  const organization = num(goal.organization); // fotoğraf, orkestra, kuaför, davetiye, nikah
  const jewelry = num(goal.jewelry);           // alınacak takı/altın
  const homeSetup = num(goal.homeSetup);       // mobilya + beyaz eşya
  const honeymoon = num(goal.honeymoon);

  const kalemler = { salonYemek, attire, organization, jewelry, homeSetup, honeymoon };
  const target = salonYemek + attire + organization + jewelry + homeSetup + honeymoon;

  const cash = num(goal.cash);
  const gifts = num(goal.expectedGifts);   // düğünde gelen takı + para
  const family = num(goal.familyHelp);
  const resources = cash + gifts + family;

  const gap = target - resources;
  const percent = target > 0 ? Math.min(100, (resources / target) * 100) : 0;
  const takiKarsilama = target > 0 ? (gifts / target) * 100 : 0;
  const kisiBasiToplam = davetli > 0 ? target / davetli : 0;

  return { davetli, kalemler, target, resources, cash, gifts, family, gap, percent, takiKarsilama, kisiBasiToplam };
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
  seyahat: { renk: ["#22d3ee", "#3b82f6"], baslik: "Seyahat Hedefi", alt: "Hazırlanıyor." },
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
  const yuk = aylikGelir > 0 ? (c.aylikToplamGider / aylikGelir) * 100 : null;

  const uyarilar = [];
  if (c.price > 0 && c.limit.oran === 0 && c.loan > 0)
    uyarilar.push(`Bu fiyat bandında taşıt kredisi kullanılamıyor (BDDK). Aracı tamamen nakit/takasla almalısın.`);
  else if (c.loan > c.limit.maxKredi && c.limit.maxKredi > 0)
    uyarilar.push(`Bu araç için azami kredi ${money(c.limit.maxKredi)} (değerin %${(c.limit.oran * 100).toFixed(0)}'i). En az ${money(c.price - c.limit.maxKredi)} peşinat gerekir.`);
  if (c.ay > c.limit.maxVade && c.limit.maxVade > 0)
    uyarilar.push(`Bu fiyat bandında azami vade ${c.limit.maxVade} ay. ${c.ay} ay yazdın — banka kabul etmez.`);
  if (yuk !== null && yuk > 20)
    uyarilar.push(`Toplam araç gideri gelirinin %${yuk.toFixed(0)}'i. Danışmanlıkta kabul gören sınır %20 — daha uygun bir araç ya da uzun vade düşün.`);

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
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, alignItems: "end",
      }}>
        <div style={{ gridColumn: "1 / -1", color: "#fcd34d", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em" }}>
          🏷️ Araç Künyesi
        </div>
        <Alan label="Aracın Fiyatı (₺)">
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
        <Alan label="Aylık Yakıt + Bakım (₺)" hint="Otopark, lastik, servis dâhil">
          <input style={inputStyle} inputMode="decimal" value={goal.monthlyRun || ""} placeholder="0" onChange={(e) => onChange("monthlyRun", e.target.value)} />
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
        <Alan label="O Aracın Kalan Kredi Borcu (₺)" hint="Takastan düşülür — eline net bu kadar geçer">
          <input style={inputStyle} inputMode="decimal" value={goal.tradeInDebt || ""} placeholder="0" onChange={(e) => onChange("tradeInDebt", e.target.value)} />
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
          {c.aylikToplamGider > 0 ? (
            <Kutu etiket="Aylık Araç Gideri" deger={money(c.aylikToplamGider)}
              renk={yuk === null ? "#a78bfa" : yuk <= 20 ? "#34d399" : yuk <= 30 ? "#fbbf24" : "#fb7185"}
              alt={yuk === null ? "Taksit + sigorta + kullanım" : `Gelire oranı %${yuk.toFixed(0)} · sınır %20`} />
          ) : null}
          {c.price > 0 ? (
            <Kutu etiket={`${SAHIPLIK_YIL} Yıl Sonra Değeri`} deger={money(c.kalan)} renk="#fb7185" alt={`${money(c.degerKaybi)} değer kaybı`} />
          ) : null}
          {aylikBirikim ? (
            <Kutu etiket="Aylık Biriktirmelisin" deger={money(aylikBirikim)} renk="#fbbf24" alt={`${ayKalan} ay içinde yetişmek için`} />
          ) : null}
        </div>

        {/* Gerçek maliyet — araçtaki asıl mesele */}
        {c.price > 0 ? (
          <div style={{ marginTop: 13, border: "1px solid rgba(251,113,133,.3)", background: "rgba(251,113,133,.08)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ color: "#fda4af", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em" }}>
              {SAHIPLIK_YIL} yılda sana gerçek maliyeti
            </div>
            <div style={{ color: "#fb7185", fontSize: 26, fontWeight: 900, margin: "3px 0 4px" }}>{money(c.gercekMaliyet)}</div>
            <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5 }}>
              Peşinat + masraf + ödenen taksitler + sigorta/vergi + yakıt/bakım − {SAHIPLIK_YIL}. yıl sonundaki araç değeri.
              Ev değer kazanır, araç kaybeder; asıl maliyet burada görünür.
            </div>
          </div>
        ) : null}

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

            <TabloKutu baslik="Değer kaybı projeksiyonu" ikon="📉">
              <Tablo
                renk="#fca5a5"
                basliklar={["Yıl", "Tahmini değer", "Kayıp"]}
                not={`${c.sifirMi ? "Sıfır araç ilk yıl ~%20, sonrasında ~%10" : "İkinci el ~%10/yıl"} değer kaybı varsayımıyla. Tahmindir.`}
                satirlar={[1, 2, 3, 4, 5].map((y) => {
                  const d = kalanDeger(c.price, y, c.sifirMi);
                  return {
                    hucreler: [`${y}. yıl`, money(d), `− ${money(c.price - d)}`],
                    vurgu: y === SAHIPLIK_YIL,
                    kalin: y === SAHIPLIK_YIL,
                    renk: "#fda4af",
                  };
                })}
              />
            </TabloKutu>

            <TabloKutu baslik="Alım masrafları ve aylık giderler" ikon="🧾">
              <Tablo
                renk="#fcd34d"
                basliklar={["Kalem", "Tutar"]}
                not="Noter tarifesi 2026'ya göredir. Sigorta/vergi tahminidir; araç yaşı ve motor hacmine göre değişir."
                satirlar={[
                  { hucreler: ["Noter satış harcı (binde 2)", money(c.masraflar.noterHarc)], not: "Asgari 1.000 ₺" },
                  { hucreler: ["Noter hizmet bedeli", money(c.masraflar.noterHizmet)], not: "Harcın %30'u + sayfa/nüsha/bildirim" },
                  { hucreler: ["Tescil / plaka", money(c.masraflar.tescil)] },
                  { hucreler: ["ALIM MASRAFI TOPLAMI", money(c.masrafToplam)], kalin: true, vurgu: true },
                  ...(c.taksit > 0 ? [{ hucreler: ["Aylık kredi taksiti", money(c.taksit)] }] : []),
                  { hucreler: ["Aylık sigorta + vergi", money(c.aylikSigortaVergi)], not: "Kasko + trafik + MTV (tahmini)" },
                  ...(c.aylikKullanim > 0 ? [{ hucreler: ["Aylık yakıt + bakım", money(c.aylikKullanim)] }] : []),
                  { hucreler: ["AYLIK TOPLAM GİDER", money(c.aylikToplamGider)], kalin: true, vurgu: true, renk: "#fbbf24" },
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

// Evlilik ekranı bilinçli olarak diğerlerinden FARKLI kurgulanmıştır:
// blok blok form yerine, düğün planlamacılarının kullandığı gibi tek bir
// DÜZENLENEBİLİR ÇİZELGE. Her satır bir bütçe kalemi; tutarı satırın içinde
// değiştirirsin, payı ve çubuğu anında güncellenir.
function CizelgeInput({ value, onChange, placeholder, genislik = 118 }) {
  return (
    <input
      style={{
        width: genislik, boxSizing: "border-box", textAlign: "right",
        border: "1px solid rgba(255,255,255,.16)", background: "rgba(2,6,23,.55)",
        color: "#f8fafc", borderRadius: 9, padding: "6px 9px", outline: "none", fontSize: 12.5,
      }}
      inputMode="decimal" value={value || ""} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CizelgeSatir({ ad, not, sagUst, children, pay, payRenk = "#f472b6", kalin, vurgu }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)", background: vurgu ? "rgba(244,114,182,.10)" : "transparent" }}>
      <td style={{ padding: "9px 10px", minWidth: 0 }}>
        <span style={{ display: "block", color: vurgu ? "#fff" : "#e2e8f0", fontWeight: kalin ? 800 : 600, fontSize: 12.5 }}>{ad}</span>
        {not ? <span style={{ display: "block", color: "#64748b", fontSize: 10, marginTop: 1 }}>{not}</span> : null}
      </td>
      <td style={{ padding: "9px 10px", textAlign: "right", whiteSpace: "nowrap" }}>{children}</td>
      <td style={{ padding: "9px 10px", textAlign: "right", whiteSpace: "nowrap", width: 108 }}>
        {pay === null || pay === undefined ? (
          sagUst || null
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 40, height: 6, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", display: "inline-block" }}>
              <span style={{ display: "block", width: `${Math.min(100, pay)}%`, height: "100%", background: `linear-gradient(90deg, ${payRenk}, #a78bfa)` }} />
            </span>
            <span style={{ minWidth: 32, textAlign: "right", color: "#cbd5e1", fontSize: 11.5 }}>%{pay.toFixed(0)}</span>
          </span>
        )}
      </td>
    </tr>
  );
}

function EvlilikKarti({ goal, c, onChange, onApplyPreset, onDelete, likit, aylikKalanPara }) {
  const ayKalan = aylikKalan(goal.targetDate);
  const aylikBirikim = c.gap > 0 && ayKalan && ayKalan > 0 ? c.gap / ayKalan : null;
  const pay = (v) => (c.target > 0 ? (v / c.target) * 100 : 0);

  const uyarilar = [];
  if (c.takiKarsilama > 60)
    uyarilar.push(`Beklenen takı, bütçenin %${c.takiKarsilama.toFixed(0)} kadarını karşılıyor. Gelen takı davetli profiline göre değişir ve garanti değildir; planı buna fazla yaslama.`);
  if (aylikBirikim && aylikKalanPara > 0 && aylikBirikim > aylikKalanPara)
    uyarilar.push(`Ayda ${money(aylikBirikim)} biriktirmen gerekiyor ama aylık kalanın ${money(aylikKalanPara)}. Tarihi ilerletmen ya da bütçeyi küçültmen gerekebilir.`);

  const tamam = c.gap <= 0;
  const th = { padding: "7px 10px", color: "#f9a8d4", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid rgba(244,114,182,.28)" };

  return (
    <article style={{
      border: "1px solid rgba(244,114,182,.3)", borderRadius: 20, padding: 18,
      background: "linear-gradient(160deg, rgba(76,29,63,.42), rgba(15,23,42,.8))",
      display: "grid", gap: 13,
    }}>
      {/* Künye şeridi */}
      <div style={{ display: "flex", gap: 11, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 190px" }}>
          <span style={{ display: "block", color: "#f9a8d4", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>💍 HEDEF ADI</span>
          <input style={inputStyle} value={goal.name || ""} placeholder="Evlilik Hedefi" onChange={(e) => onChange("name", e.target.value)} />
        </label>
        <label style={{ flex: "0 1 175px" }}>
          <span style={{ display: "block", color: "#f9a8d4", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>DÜĞÜN TARİHİ</span>
          <input style={inputStyle} type="date" value={goal.targetDate || ""} onChange={(e) => onChange("targetDate", e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {Object.entries(EVLILIK_OLCEK).map(([k, v]) => (
            <button key={k} type="button" onClick={() => onApplyPreset(v)} title="Bu ölçeğin 2026 ortalamalarıyla doldur"
              style={{ border: "1px solid rgba(244,114,182,.36)", background: "rgba(244,114,182,.12)", color: "#fbcfe8", borderRadius: 9, padding: "8px 12px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              {v.label}
            </button>
          ))}
        </div>
        <button type="button" className="deleteButton" onClick={onDelete}>Sil</button>
      </div>

      {/* ÇİZELGE — gider */}
      <div style={{ border: "1px solid rgba(244,114,182,.22)", borderRadius: 16, background: "rgba(2,6,23,.45)", overflow: "hidden" }}>
        <div style={{ padding: "11px 13px", borderBottom: "1px solid rgba(244,114,182,.2)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 13.5 }}>📋 Düğün Bütçe Çizelgesi</span>
          <span style={{ color: "#f9a8d4", fontSize: 11.5, fontWeight: 700 }}>Tutarları satır içinde değiştir</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 430 }}>
            <thead><tr><th style={{ ...th, textAlign: "left" }}>Kalem</th><th style={{ ...th, textAlign: "right" }}>Tutar</th><th style={{ ...th, textAlign: "right" }}>Pay</th></tr></thead>
            <tbody>
              <CizelgeSatir ad="Salon + yemek" not={`${c.davetli || 0} davetli × kişi başı menü`} pay={pay(c.kalemler.salonYemek)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CizelgeInput value={goal.guests} onChange={(v) => onChange("guests", v)} placeholder="200" genislik={62} />
                  <span style={{ color: "#64748b", fontSize: 12 }}>×</span>
                  <CizelgeInput value={goal.perGuest} onChange={(v) => onChange("perGuest", v)} placeholder="2.500" genislik={82} />
                </span>
                <span style={{ display: "block", color: "#f9a8d4", fontSize: 11.5, fontWeight: 700, marginTop: 3 }}>{money(c.kalemler.salonYemek)}</span>
              </CizelgeSatir>
              <CizelgeSatir ad="Gelinlik + damatlık" not="Hazır 15.000 ₺'den, özel dikim 80.000 ₺'ye" pay={pay(c.kalemler.attire)}>
                <CizelgeInput value={goal.attire} onChange={(v) => onChange("attire", v)} placeholder="100.000" />
              </CizelgeSatir>
              <CizelgeSatir ad="Organizasyon" not="Fotoğraf, orkestra, kuaför, davetiye, nikah" pay={pay(c.kalemler.organization)}>
                <CizelgeInput value={goal.organization} onChange={(v) => onChange("organization", v)} placeholder="150.000" />
              </CizelgeSatir>
              <CizelgeSatir ad="Takı / altın" not="Alyans, set, bilezik — sizin aldığınız" pay={pay(c.kalemler.jewelry)}>
                <CizelgeInput value={goal.jewelry} onChange={(v) => onChange("jewelry", v)} placeholder="550.000" />
              </CizelgeSatir>
              <CizelgeSatir ad="Ev kurma" not="Mobilya + beyaz eşya + çeyiz" pay={pay(c.kalemler.homeSetup)}>
                <CizelgeInput value={goal.homeSetup} onChange={(v) => onChange("homeSetup", v)} placeholder="750.000" />
              </CizelgeSatir>
              <CizelgeSatir ad="Balayı" not="Uçak, konaklama, harcama dâhil" pay={pay(c.kalemler.honeymoon)}>
                <CizelgeInput value={goal.honeymoon} onChange={(v) => onChange("honeymoon", v)} placeholder="150.000" />
              </CizelgeSatir>
              <CizelgeSatir ad="TOPLAM MALİYET" kalin vurgu pay={c.target > 0 ? 100 : 0}
                not={c.davetli > 0 ? `Davetli başına ${money(c.kisiBasiToplam)}` : null}>
                <strong style={{ color: "#fff", fontSize: 14 }}>{money(c.target)}</strong>
              </CizelgeSatir>
            </tbody>
          </table>
        </div>
      </div>

      {/* ÇİZELGE — kaynak */}
      <div style={{ border: "1px solid rgba(167,139,250,.24)", borderRadius: 16, background: "rgba(2,6,23,.45)", overflow: "hidden" }}>
        <div style={{ padding: "11px 13px", borderBottom: "1px solid rgba(167,139,250,.2)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 13.5 }}>💐 Kaynaklar</span>
          {likit > 0 ? (
            <button type="button" onClick={() => onChange("cash", String(Math.round(likit)))}
              style={{ background: "none", border: "none", color: "#c4b5fd", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              Portföyümden al ({money(likit)})
            </button>
          ) : null}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 430 }}>
            <thead><tr>
              <th style={{ ...th, color: "#c4b5fd", borderBottomColor: "rgba(167,139,250,.28)", textAlign: "left" }}>Kaynak</th>
              <th style={{ ...th, color: "#c4b5fd", borderBottomColor: "rgba(167,139,250,.28)", textAlign: "right" }}>Tutar</th>
              <th style={{ ...th, color: "#c4b5fd", borderBottomColor: "rgba(167,139,250,.28)", textAlign: "right" }}>Karşılama</th>
            </tr></thead>
            <tbody>
              <CizelgeSatir ad="Nakit / birikim" pay={pay(c.cash)} payRenk="#a78bfa">
                <CizelgeInput value={goal.cash} onChange={(v) => onChange("cash", v)} placeholder="0" />
              </CizelgeSatir>
              <CizelgeSatir ad="Beklenen takı + para" not="Düğünde takılacağını tahmin ettiğin altın ve para"
                pay={c.takiKarsilama} payRenk={c.takiKarsilama > 60 ? "#fbbf24" : "#a78bfa"}>
                <CizelgeInput value={goal.expectedGifts} onChange={(v) => onChange("expectedGifts", v)} placeholder="0" />
              </CizelgeSatir>
              <CizelgeSatir ad="Aile katkısı" not="İki taraftan gelecek destek" pay={pay(c.family)} payRenk="#a78bfa">
                <CizelgeInput value={goal.familyHelp} onChange={(v) => onChange("familyHelp", v)} placeholder="0" />
              </CizelgeSatir>
              <CizelgeSatir ad="TOPLAM KAYNAK" kalin vurgu pay={c.percent} payRenk="#a78bfa">
                <strong style={{ color: "#fff", fontSize: 14 }}>{money(c.resources)}</strong>
              </CizelgeSatir>
            </tbody>
          </table>
        </div>
      </div>

      {/* SONUÇ — kompakt şerit */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        border: `1px solid ${tamam ? "rgba(34,197,94,.4)" : "rgba(244,114,182,.42)"}`, borderRadius: 16, padding: "14px 17px",
        background: tamam ? "linear-gradient(120deg, rgba(34,197,94,.16), rgba(15,23,42,.5))" : "linear-gradient(120deg, rgba(244,114,182,.16), rgba(15,23,42,.5))",
      }}>
        <div>
          <div style={{ color: "#cbd5e1", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
            {tamam ? "Bütçen yeterli" : "Eksik kaynak"}
          </div>
          <div style={{ color: tamam ? "#86efac" : "#f9a8d4", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, lineHeight: 1.15 }}>
            {tamam ? `+${money(Math.abs(c.gap))}` : money(c.gap)}
          </div>
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
        Ön ayar rakamları 2026 piyasa ortalamalarıdır; şehir ve mekâna göre önemli ölçüde değişir.
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
            tradeIn: "", tradeInDebt: "", monthlyRun: "", loanMonths: "24", loanRate: "3,25" }
        : type === "evlilik"
        ? { ...base, name: "Evlilik Hedefi", guests: "", perGuest: "", attire: "", organization: "",
            jewelry: "", homeSetup: "", honeymoon: "", expectedGifts: "", familyHelp: "" }
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
