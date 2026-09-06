"use client";

import { useMemo, useState } from "react";
import { money } from "../lib/format";

// Hedef türleri — her tür kendi ekranına sahip. Tür seçilince ekran o türe göre kurulur.
const GOAL_TYPES = [
  { id: "konut", label: "Konut", icon: "🏠", ready: true },
  { id: "arac", label: "Araç", icon: "🚗", ready: true },
  { id: "evlilik", label: "Evlilik", icon: "💍", ready: false },
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

function Blok({ no, baslik, aciklama, children }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 14, background: "rgba(2,6,23,.34)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: aciklama ? 2 : 11 }}>
        <span style={{ width: 21, height: 21, borderRadius: 999, background: "rgba(96,165,250,.22)", color: "#93c5fd", fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{no}</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 13.5 }}>{baslik}</span>
      </div>
      {aciklama ? <div style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 11px 30px" }}>{aciklama}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 11 }}>{children}</div>
    </div>
  );
}

function KonutKarti({ goal, c, onChange, onDelete, likit, aylikGelir }) {
  const [masrafAcik, setMasrafAcik] = useState(false);
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

        {/* Masraf dökümü */}
        {c.price > 0 ? (
          <div style={{ marginTop: 13 }}>
            <button type="button" onClick={() => setMasrafAcik((v) => !v)}
              style={{ background: "none", border: "none", color: "#93c5fd", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              {masrafAcik ? "▾" : "▸"} Masraf dökümü ({money(c.masrafToplam)})
            </button>
            {masrafAcik ? (
              <div style={{ marginTop: 9, display: "grid", gap: 5, color: "#cbd5e1", fontSize: 12 }}>
                <Satir ad="Tapu harcı (%4)" tutar={c.masraflar.tapu} not="Yasada yarısı satıcının; pratikte alıcı öder" />
                <Satir ad="Emlak komisyonu (%2 + KDV)" tutar={c.masraflar.komisyon} />
                {c.masraflar.ekspertiz > 0 ? <Satir ad="Ekspertiz" tutar={c.masraflar.ekspertiz} not="Kredi çekilirken zorunlu" /> : null}
                {c.masraflar.tahsis > 0 ? <Satir ad="Kredi tahsis (binde 5)" tutar={c.masraflar.tahsis} /> : null}
                {c.masraflar.extra > 0 ? <Satir ad="Tadilat / taşınma" tutar={c.masraflar.extra} /> : null}
                <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 3, lineHeight: 1.5 }}>
                  Oranlar 2026 mevzuatına göredir. DASK ve konut sigortası (yıllık birkaç bin ₺) ayrıca ödenir.
                </div>
              </div>
            ) : null}
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
  const [masrafAcik, setMasrafAcik] = useState(false);
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

      <Blok no="1" baslik="Almak istediğin araç" aciklama="Yakıt tipi ve durumu, kredi limitini ve değer kaybını belirler.">
        <Alan label="Aracın Fiyatı (₺)">
          <input style={inputStyle} inputMode="decimal" value={goal.price || ""} placeholder="Örn: 1.450.000" onChange={(e) => onChange("price", e.target.value)} />
        </Alan>
        <Alan label="Yakıt Tipi" hint="Elektrikliye daha yüksek kredi limiti var">
          <select style={inputStyle} value={goal.fuel || "ice"} onChange={(e) => onChange("fuel", e.target.value)}>
            <option value="ice">Benzin / Dizel / Hibrit</option>
            <option value="ev">Elektrikli</option>
          </select>
        </Alan>
        <Alan label="Durumu" hint="Sıfır araç ilk yıl daha hızlı değer kaybeder">
          <select style={inputStyle} value={goal.condition || "new"} onChange={(e) => onChange("condition", e.target.value)}>
            <option value="new">Sıfır</option>
            <option value="used">İkinci El</option>
          </select>
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
        <Alan label="Takas / Satacağın Araç (₺)" hint="Mevcut aracını verecekesen değerini yaz">
          <input style={inputStyle} inputMode="decimal" value={goal.tradeIn || ""} placeholder="0" onChange={(e) => onChange("tradeIn", e.target.value)} />
        </Alan>
        <Alan label="O Aracın Kalan Kredi Borcu (₺)" hint="Takastan düşülür — eline net bu kadar geçer">
          <input style={inputStyle} inputMode="decimal" value={goal.tradeInDebt || ""} placeholder="0" onChange={(e) => onChange("tradeInDebt", e.target.value)} />
        </Alan>
      </Blok>

      <Blok no="3" baslik="Taşıt kredisi" aciklama="Kredi kullanmayacaksan boş bırak.">
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
        <Alan label="Aylık Yakıt + Bakım (₺)" hint="Otopark, lastik, servis dâhil tahminin">
          <input style={inputStyle} inputMode="decimal" value={goal.monthlyRun || ""} placeholder="0" onChange={(e) => onChange("monthlyRun", e.target.value)} />
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

        {/* Masraf dökümü */}
        {c.price > 0 ? (
          <div style={{ marginTop: 13 }}>
            <button type="button" onClick={() => setMasrafAcik((v) => !v)}
              style={{ background: "none", border: "none", color: "#93c5fd", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              {masrafAcik ? "▾" : "▸"} Masraf ve gider dökümü
            </button>
            {masrafAcik ? (
              <div style={{ marginTop: 9, display: "grid", gap: 5, color: "#cbd5e1", fontSize: 12 }}>
                <Satir ad="Noter satış harcı (binde 2)" tutar={c.masraflar.noterHarc} not="Asgari 1.000 ₺" />
                <Satir ad="Noter hizmet bedeli" tutar={c.masraflar.noterHizmet} not="Harcın %30'u + sayfa/nüsha/bildirim" />
                <Satir ad="Tescil / plaka" tutar={c.masraflar.tescil} />
                <Satir ad="Aylık sigorta + vergi (tahmini)" tutar={c.aylikSigortaVergi} not="Kasko + trafik + MTV; yaş ve motor hacmine göre değişir" />
                {c.aylikKullanim > 0 ? <Satir ad="Aylık yakıt + bakım" tutar={c.aylikKullanim} /> : null}
                <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 3, lineHeight: 1.5 }}>
                  Noter tarifesi 2026'ya göredir. Sigorta/vergi ve değer kaybı tahminidir; gerçek tutarlar araca göre değişir.
                </div>
              </div>
            ) : null}
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
  const likitAvailable = Number(investmentTotals?.availableInvestment || 0);
  const aylikGelir = Number(financeTotals?.totalIncome || 0);

  // Hedef listesini DAİMA en güncel state üzerinden değiştir (bayat closure koruması).
  const mutateGoals = (fn) =>
    setData((d) => {
      const cur = { categories: [], assets: [], debts: [], goals: [], ...d };
      return { ...cur, goals: fn(cur.goals || []) };
    });

  const addGoal = (type) => {
    const meta = GOAL_TYPES.find((t) => t.id === type);
    if (!meta?.ready) {
      setBilgi(`"${meta?.label}" kategorisi hazırlanıyor. Şu an Konut hedefi oluşturabilirsin.`);
      return;
    }
    setBilgi("");
    const base = { id: uid(), type, targetDate: "", cash: "", loan: "" };
    const yeni = type === "arac"
      ? { ...base, name: "Araç Alma Hedefi", price: "", fuel: "ice", condition: "new",
          tradeIn: "", tradeInDebt: "", monthlyRun: "", loanMonths: "24", loanRate: "3,25" }
      : { ...base, name: "Ev Alma Hedefi", housePrice: "", extraCost: "",
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

      {/* Kategori seçimi */}
      <section style={card}>
        <h2 className="gradientTitle" style={{ margin: 0 }}>Yeni Hedef Oluştur</h2>
        <p className="sectionDescription" style={{ marginTop: 4 }}>Bir kategori seç — ekran o hedefe özel alanlarla açılır.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 9, marginTop: 12 }}>
          {GOAL_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => addGoal(t.id)}
              title={t.ready ? `${t.label} hedefi ekle` : "Hazırlanıyor"}
              style={{
                display: "grid", placeItems: "center", gap: 4, padding: "13px 8px", borderRadius: 15, cursor: "pointer",
                border: `1px solid ${t.ready ? "rgba(96,165,250,.5)" : "rgba(255,255,255,.10)"}`,
                background: t.ready ? "linear-gradient(150deg, rgba(96,165,250,.18), rgba(139,92,246,.12))" : "rgba(2,6,23,.4)",
                color: "#fff", opacity: t.ready ? 1 : 0.45,
              }}>
              <span style={{ fontSize: 21 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{t.label}</span>
              <span style={{ fontSize: 9.5, color: t.ready ? "#86efac" : "#94a3b8" }}>{t.ready ? "Hazır" : "Hazırlanıyor"}</span>
            </button>
          ))}
        </div>
        {bilgi ? (
          <div style={{ marginTop: 11, color: "#93c5fd", fontSize: 12, background: "rgba(96,165,250,.10)", border: "1px solid rgba(96,165,250,.28)", borderRadius: 12, padding: "9px 12px" }}>
            {bilgi}
          </div>
        ) : null}
      </section>

      {/* Hedefler */}
      {goals.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Henüz hedef yok. Yukarıdan bir kategori seçerek başla.
        </div>
      ) : (
        goals.map((raw) => {
          const goal = migrate(raw);
          const c = calcGoal(goal);
          if (goal.type === "konut") {
            return (
              <KonutKarti key={goal.id} goal={goal} c={c} likit={likitAvailable} aylikGelir={aylikGelir}
                onChange={(f, v) => updateGoal(goal.id, f, v)} onDelete={() => deleteGoal(goal.id)} />
            );
          }
          if (goal.type === "arac") {
            return (
              <AracKarti key={goal.id} goal={goal} c={c} likit={likitAvailable} aylikGelir={aylikGelir}
                onChange={(f, v) => updateGoal(goal.id, f, v)} onDelete={() => deleteGoal(goal.id)} />
            );
          }
          const meta = typeMeta(goal.type);
          return (
            <article key={goal.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <strong style={{ color: "#fff" }}>{meta.icon} {goal.name || meta.label}</strong>
                <button type="button" className="deleteButton" onClick={() => deleteGoal(goal.id)}>Sil</button>
              </div>
              <p className="sectionDescription" style={{ marginBottom: 0 }}>Bu kategori hazırlanıyor.</p>
            </article>
          );
        })
      )}
    </div>
  );
}
