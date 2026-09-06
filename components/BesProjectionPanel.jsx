"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "../lib/format";

// ---------------------------------------------------------------------------
// BES kurallari (2026)
//  - Devlet katkisi: odenen katki payinin %20'si (01.01.2026'da %30'dan dusuruldu)
//  - Yillik ust sinir: 396.360 TL katkiya karsilik en fazla 79.272 TL devlet katkisi
//  - Devlet katkisi da fonlarda degerlendirilir; kendi getirisi olur.
//  - Hak edis, devlet katkisi VE GETIRILERI uzerinden hesaplanir:
//      <3 yil %0 | 3 yil %15 | 6 yil %35 | 10 yil %60 | 10 yil + 56 yas %100
//  - Stopaj yalnizca GETIRI uzerinden alinir (anaparadan kesinti yok):
//      10 yil oncesi %15 | 10 yil %10 | emeklilik %5
// ---------------------------------------------------------------------------
const STATE_RATE = 0.20;
const ANNUAL_STATE_CAP = 79272;
const ANNUAL_CONTRIB_CAP = 396360;

const EXIT_OPTIONS = [
  { years: 3, vest: 0.15, tax: 0.15, label: "3. yıl" },
  { years: 6, vest: 0.35, tax: 0.15, label: "6. yıl" },
  { years: 10, vest: 0.60, tax: 0.10, label: "10. yıl" },
  { years: 15, vest: 1.0, tax: 0.05, label: "Emeklilik (10 yıl + 56 yaş)" },
];

const num = (v) => {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const todayIso = () => new Date().toISOString().slice(0, 10);

// Aylik odemeli birikimin gelecek degeri
function futureValue(payment, monthlyRate, months) {
  if (months <= 0 || payment <= 0) return 0;
  if (monthlyRate === 0) return payment * months;
  return payment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

function monthsBetween(fromIso, to = new Date()) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
}

// Yillik ust siniri dikkate alan aylik devlet katkisi
function monthlyStateContribution(monthlyContribution) {
  const capped = Math.min(monthlyContribution * 12, ANNUAL_CONTRIB_CAP);
  return (capped * STATE_RATE) / 12;
}

// Bir yil icin planlanan aylik katki payi
function contributionForYear(year, { baseYear, monthly, growthMode, annualIncrease, yearlyPlan }) {
  if (growthMode === "manual") {
    const rows = (yearlyPlan || []).filter((r) => num(r.monthly) > 0);
    const exact = rows.find((r) => Number(r.year) === year);
    if (exact) return num(exact.monthly);
    // O yil icin deger girilmemisse en yakin onceki yilin degerini surdur
    const prev = rows.filter((r) => Number(r.year) <= year).sort((a, b) => Number(b.year) - Number(a.year))[0];
    if (prev) return num(prev.monthly);
    return monthly;
  }
  // Otomatik: her yil %annualIncrease kadar artir
  const k = Math.max(0, year - baseYear);
  return monthly * Math.pow(1 + (annualIncrease || 0) / 100, k);
}

function project(inp) {
  const { startDate, monthly, ownPrincipal, ownReturn, statePrincipal, stateReturn, annualReturn, exitYears } = inp;

  const elapsed = monthsBetween(startDate);
  const exitMonths = exitYears * 12;
  const remaining = Math.max(0, exitMonths - elapsed);
  const i = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const growth = Math.pow(1 + i, remaining);

  // --- BUGUN (BES ekstrendeki 4 kalem) ---
  const ownNow = ownPrincipal + ownReturn;     // kendi hesabin: anapara + fon getirisi
  const stateNow = statePrincipal + stateReturn; // devlet katkisi hesabi: anapara + fon getirisi

  // --- CIKIS ANINDA ---
  // Katki payi yillara gore degisebildigi icin ay ay simule ediyoruz.
  const now = new Date();
  const baseYear = now.getFullYear();
  const planArgs = { baseYear, monthly, growthMode: inp.growthMode, annualIncrease: inp.annualIncrease, yearlyPlan: inp.yearlyPlan };

  let own = ownNow;
  let state = stateNow;
  let paidPrincipalTotal = ownPrincipal;
  let statePrincipalTotal = statePrincipal;
  const yillik = new Map(); // yil -> { aylik, ay }

  for (let m = 1; m <= remaining; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const c = contributionForYear(d.getFullYear(), planArgs);
    const sc = monthlyStateContribution(c);
    own = own * (1 + i) + c;
    state = state * (1 + i) + sc;
    paidPrincipalTotal += c;
    statePrincipalTotal += sc;
    const kayit = yillik.get(d.getFullYear()) || { aylik: c, ay: 0 };
    kayit.ay += 1;
    yillik.set(d.getFullYear(), kayit);
  }

  const ownAtExit = own;
  const stateAtExit = state;
  // Gorsel dokum icin: mevcut bakiyenin buyumesi ve yeni katkilarin payi
  const ownFromExisting = ownNow * growth;
  const ownFromNew = Math.max(0, ownAtExit - ownFromExisting);
  const stateFromExisting = stateNow * growth;
  const stateFromNew = Math.max(0, stateAtExit - stateFromExisting);
  const planTablosu = [...yillik.entries()].map(([year, v]) => ({ year, aylik: v.aylik, ay: v.ay }));

  const option = EXIT_OPTIONS.find((o) => o.years === exitYears) || EXIT_OPTIONS[1];

  // Hak edis: devlet katkisi VE GETIRILERI uzerinden
  const vestedState = stateAtExit * option.vest;
  const vestedStatePrincipal = statePrincipalTotal * option.vest;
  const lostState = stateAtExit - vestedState;

  const gross = ownAtExit + vestedState;
  const gain = Math.max(0, gross - paidPrincipalTotal - vestedStatePrincipal);
  const tax = gain * option.tax;
  const net = gross - tax;

  // Bugun itibariyle hak edilen deger (portfoy toplamina yazilir)
  const elapsedYears = elapsed / 12;
  const currentVest = elapsedYears >= 10 ? 0.6 : elapsedYears >= 6 ? 0.35 : elapsedYears >= 3 ? 0.15 : 0;
  const currentTotal = ownNow + stateNow * currentVest;

  return {
    elapsed, remaining, exitMonths, option, growth, planTablosu,
    monthlyState: monthlyStateContribution(contributionForYear(baseYear, planArgs)),
    ownNow, stateNow, currentVest, currentTotal,
    ownFromExisting, ownFromNew, ownAtExit,
    stateFromExisting, stateFromNew, stateAtExit,
    paidPrincipalTotal, statePrincipalTotal,
    vestedState, lostState, gross, gain, tax, net,
    progress: exitMonths > 0 ? Math.min(100, (elapsed / exitMonths) * 100) : 0,
    exitDate: (() => { const d = new Date(startDate); return Number.isNaN(d.getTime()) ? null : new Date(d.setMonth(d.getMonth() + exitMonths)); })(),
  };
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(2,6,23,.6)", color: "#f8fafc", borderRadius: 12,
  padding: "10px 12px", outline: "none", fontSize: 14,
};

function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 5 }}>{label}</span>
      {children}
      {hint ? <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 4 }}>{hint}</span> : null}
    </label>
  );
}

function Grup({ baslik, aciklama, children }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 16, background: "rgba(2,6,23,.35)", marginBottom: 14 }}>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{baslik}</div>
      {aciklama ? <div style={{ color: "#94a3b8", fontSize: 11.5, marginBottom: 12 }}>{aciklama}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12 }}>{children}</div>
    </div>
  );
}

export default function BesProjectionPanel({ onTotalChange, settings, onSettingsChange }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(todayIso());
  const [monthly, setMonthly] = useState("0");
  const [annualReturn, setAnnualReturn] = useState("30");
  const [exitYears, setExitYears] = useState(6);
  // BES ekstrendeki 4 kalem
  const [ownPrincipal, setOwnPrincipal] = useState("");
  const [ownReturn, setOwnReturn] = useState("");
  const [statePrincipal, setStatePrincipal] = useState("");
  const [stateReturn, setStateReturn] = useState("");
  // Katki payi artis plani: "auto" = her yil %X artir, "manual" = yil yil gir
  const [growthMode, setGrowthMode] = useState("auto");
  const [annualIncrease, setAnnualIncrease] = useState("0");
  const [yearlyPlan, setYearlyPlan] = useState([]);

  // Kayitli ayarlari bir kez yukle (eski surumlerin alan adlarindan da tasi)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !settings || typeof settings !== "object") return;
    hydratedRef.current = true;
    const s = settings;
    if (s.startDate) setStartDate(s.startDate);
    if (s.monthlyContribution != null) setMonthly(String(s.monthlyContribution));
    else if (Array.isArray(s.yearlyInputs) && s.yearlyInputs[0]?.monthlyContribution) setMonthly(String(s.yearlyInputs[0].monthlyContribution));
    if (s.annualReturn != null) setAnnualReturn(String(s.annualReturn));
    if (s.exitYears != null) setExitYears(Number(s.exitYears) || 6);

    // 4 kalem: once yeni adlar, sonra eski panelin adlari, sonra ara surum
    setOwnPrincipal(String(s.ownPrincipal ?? s.actualPrincipalPaid ?? s.ownBalance ?? ""));
    setOwnReturn(String(s.ownReturn ?? s.actualMainFundReturn ?? ""));
    setStatePrincipal(String(s.statePrincipal ?? s.actualStateContribution ?? s.stateBalance ?? ""));
    setStateReturn(String(s.stateReturn ?? s.actualStateFundReturn ?? ""));

    if (s.growthMode) setGrowthMode(s.growthMode);
    if (s.annualIncrease != null) setAnnualIncrease(String(s.annualIncrease));
    if (Array.isArray(s.yearlyPlan) && s.yearlyPlan.length) setYearlyPlan(s.yearlyPlan);
    else if (Array.isArray(s.yearlyInputs) && s.yearlyInputs.length) {
      // Eski panelin yillik tablosunu tasi
      setYearlyPlan(s.yearlyInputs.map((r) => ({ year: Number(r.year), monthly: String(r.monthlyContribution ?? "") })));
      if (!s.growthMode) setGrowthMode("manual");
    }
  }, [settings]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    onSettingsChange?.({
      startDate, monthlyContribution: monthly, annualReturn, exitYears,
      ownPrincipal, ownReturn, statePrincipal, stateReturn,
      growthMode, annualIncrease, yearlyPlan,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, monthly, annualReturn, exitYears, ownPrincipal, ownReturn, statePrincipal, stateReturn, growthMode, annualIncrease, yearlyPlan]);

  const girdi = useMemo(() => ({
    startDate, monthly: num(monthly), annualReturn: num(annualReturn) || 0, exitYears,
    ownPrincipal: num(ownPrincipal), ownReturn: num(ownReturn),
    statePrincipal: num(statePrincipal), stateReturn: num(stateReturn),
    growthMode, annualIncrease: num(annualIncrease), yearlyPlan,
  }), [startDate, monthly, annualReturn, exitYears, ownPrincipal, ownReturn, statePrincipal, stateReturn, growthMode, annualIncrease, yearlyPlan]);

  const p = useMemo(() => project(girdi), [girdi]);
  useEffect(() => { onTotalChange?.(Number(p.currentTotal || 0)); }, [onTotalChange, p.currentTotal]);

  const karsilastirma = useMemo(
    () => EXIT_OPTIONS.map((o) => ({ ...o, sonuc: project({ ...girdi, exitYears: o.years }) })),
    [girdi]
  );

  return (
    <section className="panelCard besProjectionPanel">
      <button type="button" className="panelHeader" onClick={() => setOpen((v) => !v)}>
        <div>
          <h2 className="gradientTitle">BES Projeksiyon</h2>
          <p>Bugünkü değerin ve planladığın çıkışta eline geçecek net tutar.</p>
        </div>
        <div className="panelRight">
          <div className="panelTotal"><span>Bugünkü Değer</span><strong>{money(p.currentTotal)}</strong></div>
          <div className="panelTotal"><span>{p.option.label} Net</span><strong>{money(p.net)}</strong></div>
          <div className="toggleButton">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? (
        <div className="panelBody">
          <Grup baslik="Planın" aciklama="Bundan sonrası için varsayımların.">
            <Field label="BES Başlangıç Tarihi">
              <input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Aylık Katkı Payı (₺)">
              <input style={inputStyle} inputMode="decimal" value={monthly} placeholder="Örn: 14.000" onChange={(e) => setMonthly(e.target.value)} />
            </Field>
            <Field label="Yıllık Getiri Beklentin (%)" hint="Fonlarının ortalama yıllık kazancı">
              <input style={inputStyle} inputMode="decimal" value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} />
            </Field>
            <Field label="Çıkış Planın">
              <select style={inputStyle} value={exitYears} onChange={(e) => setExitYears(Number(e.target.value))}>
                {EXIT_OPTIONS.map((o) => <option key={o.years} value={o.years}>{o.label} — devlet katkısının %{Math.round(o.vest * 100)}'i</option>)}
              </select>
            </Field>
          </Grup>

          {/* Katki payi artis plani */}
          <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 16, background: "rgba(2,6,23,.35)", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Katkı Payı Artışı</div>
                <div style={{ color: "#94a3b8", fontSize: 11.5 }}>Her yıl aynı tutarı ödemeyeceksen burayı kullan.</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["auto", "Otomatik artış"], ["manual", "Yıl yıl gireyim"]].map(([mod, etiket]) => (
                  <button key={mod} type="button" onClick={() => {
                    setGrowthMode(mod);
                    if (mod === "manual" && yearlyPlan.length === 0) {
                      const y0 = new Date().getFullYear();
                      setYearlyPlan(Array.from({ length: Math.max(1, exitYears) }, (_, k) => ({ year: y0 + k, monthly: k === 0 ? String(num(monthly) || "") : "" })));
                    }
                  }} style={{
                    border: "1px solid rgba(255,255,255,.16)", borderRadius: 10, padding: "7px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 800,
                    background: growthMode === mod ? "linear-gradient(135deg,#60a5fa,#8b5cf6)" : "rgba(2,6,23,.5)",
                    color: growthMode === mod ? "#fff" : "#cbd5e1",
                  }}>{etiket}</button>
                ))}
              </div>
            </div>

            {growthMode === "auto" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <Field label="Yıllık Katkı Artışı (%)" hint="0 girersen katkın hep aynı kalır">
                  <input style={inputStyle} inputMode="decimal" value={annualIncrease} placeholder="Örn: 25" onChange={(e) => setAnnualIncrease(e.target.value)} />
                </Field>
                <div style={{ alignSelf: "end", color: "#94a3b8", fontSize: 11.5, lineHeight: 1.5 }}>
                  {num(annualIncrease) > 0
                    ? `Bu yıl ${money(num(monthly))} → gelecek yıl ${money(num(monthly) * (1 + num(annualIncrease) / 100))} → sonraki ${money(num(monthly) * Math.pow(1 + num(annualIncrease) / 100, 2))}`
                    : "Katkın her yıl aynı kabul ediliyor."}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {yearlyPlan.map((r, idx) => (
                  <div key={r.year} style={{ display: "grid", gridTemplateColumns: "80px minmax(0,1fr)", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 800, fontSize: 13 }}>{r.year}</span>
                    <input
                      style={inputStyle} inputMode="decimal" value={r.monthly}
                      placeholder={idx > 0 ? "Boş = önceki yıl devam" : "Aylık katkı"}
                      onChange={(e) => setYearlyPlan((cur) => cur.map((x, k) => (k === idx ? { ...x, monthly: e.target.value } : x)))}
                    />
                  </div>
                ))}
                <button type="button" className="secondaryButton" style={{ justifySelf: "start", marginTop: 4 }}
                  onClick={() => setYearlyPlan((cur) => [...cur, { year: (cur.length ? Number(cur[cur.length - 1].year) : new Date().getFullYear()) + 1, monthly: "" }])}>
                  + Yıl Ekle
                </button>
              </div>
            )}
          </div>

          <Grup baslik="Bugünkü Durumun" aciklama="Bu 4 rakamı BES ekstrenden/uygulamandan aynen kopyalayabilirsin.">
            <Field label="Ödediğin Katkı Payı (anapara)">
              <input style={inputStyle} inputMode="decimal" value={ownPrincipal} placeholder="0" onChange={(e) => setOwnPrincipal(e.target.value)} />
            </Field>
            <Field label="Fon Getirin" hint="Kendi birikiminin kazancı">
              <input style={inputStyle} inputMode="decimal" value={ownReturn} placeholder="0" onChange={(e) => setOwnReturn(e.target.value)} />
            </Field>
            <Field label="Devlet Katkısı (anapara)">
              <input style={inputStyle} inputMode="decimal" value={statePrincipal} placeholder="0" onChange={(e) => setStatePrincipal(e.target.value)} />
            </Field>
            <Field label="Devlet Katkısı Fon Getirisi" hint="Devlet katkısı da fonlarda değerlenir">
              <input style={inputStyle} inputMode="decimal" value={stateReturn} placeholder="0" onChange={(e) => setStateReturn(e.target.value)} />
            </Field>
          </Grup>

          {/* Ilerleme */}
          <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "14px 16px", background: "rgba(2,6,23,.4)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 12, marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <span><strong style={{ color: "#fff" }}>{p.elapsed}</strong> ay geçti · <strong style={{ color: "#fff" }}>{p.remaining}</strong> ay kaldı</span>
              <span>{p.exitDate ? `Hedef çıkış: ${p.exitDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}` : ""}</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
              <div style={{ width: `${p.progress}%`, height: "100%", background: "linear-gradient(90deg,#60a5fa,#a78bfa)" }} />
            </div>
          </div>

          {/* Sonuc */}
          <div style={{ border: "1px solid rgba(34,197,94,.35)", borderRadius: 20, padding: 20, background: "linear-gradient(150deg, rgba(34,197,94,.16), rgba(15,23,42,.6))", marginBottom: 16 }}>
            <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
              {p.option.label}nda elinize geçecek NET
            </div>
            <div style={{ color: "#86efac", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, margin: "6px 0 4px", lineHeight: 1.1 }}>{money(p.net)}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Hak ediş ve vergi kesintileri düşülmüş hâli</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginTop: 16 }}>
              <Kalem etiket="Kendi Birikimin" tutar={money(p.ownAtExit)} renk="#60a5fa" alt={`${money(p.paidPrincipalTotal)} anapara`} />
              <Kalem etiket={`Hak Edilen Devlet Katkısı (%${Math.round(p.option.vest * 100)})`} tutar={money(p.vestedState)} renk="#a78bfa" alt={`Toplam ${money(p.stateAtExit)} birikir`} />
              <Kalem etiket="Brüt Toplam" tutar={money(p.gross)} renk="#e2e8f0" />
              <Kalem etiket={`Stopaj (%${Math.round(p.option.tax * 100)})`} tutar={`− ${money(p.tax)}`} renk="#fb7185" alt={`${money(p.gain)} getiri üzerinden`} />
            </div>
          </div>

          {/* Nasil hesaplaniyor */}
          <details style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "14px 16px", background: "rgba(2,6,23,.35)", marginBottom: 16 }}>
            <summary style={{ cursor: "pointer", color: "#93c5fd", fontSize: 13, fontWeight: 700 }}>Nasıl hesaplanıyor? (adım adım)</summary>
            <div style={{ marginTop: 12, display: "grid", gap: 10, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.6 }}>
              <Adim n="1" baslik="Bugünkü birikimin büyür">
                Kendi hesabın <strong>{money(p.ownNow)}</strong> ({money(num(ownPrincipal))} anapara + {money(num(ownReturn))} fon getirisi),
                {" "}{p.remaining} ay boyunca %{num(annualReturn)}/yıl ile → <strong style={{ color: "#60a5fa" }}>{money(p.ownFromExisting)}</strong>
              </Adim>
              <Adim n="2" baslik="Yeni katkıların birikir">
                Aylık {money(num(monthly))} × {p.remaining} ay, her biri kalan süre kadar büyür → <strong style={{ color: "#60a5fa" }}>{money(p.ownFromNew)}</strong>
              </Adim>
              <Adim n="3" baslik="Devlet katkısı hesabın">
                Mevcut {money(p.stateNow)} büyür ({money(p.stateFromExisting)}) + yeni katkıların %20'si olan aylık {money(p.monthlyState)} birikir ({money(p.stateFromNew)})
                {" "}→ toplam <strong style={{ color: "#a78bfa" }}>{money(p.stateAtExit)}</strong>
              </Adim>
              <Adim n="4" baslik={`${p.option.label}nda devlet katkısının %${Math.round(p.option.vest * 100)}'ini hak edersin`}>
                {money(p.stateAtExit)} × %{Math.round(p.option.vest * 100)} = <strong style={{ color: "#a78bfa" }}>{money(p.vestedState)}</strong>
                {p.lostState > 0 ? <> · kalan <strong style={{ color: "#fbbf24" }}>{money(p.lostState)}</strong> devlete geri döner</> : null}
              </Adim>
              <Adim n="5" baslik="Brüt toplam">
                {money(p.ownAtExit)} + {money(p.vestedState)} = <strong>{money(p.gross)}</strong>
              </Adim>
              <Adim n="6" baslik={`Stopaj yalnızca getiriden (%${Math.round(p.option.tax * 100)})`}>
                Getiri = {money(p.gross)} − {money(p.paidPrincipalTotal)} anapara − {money(p.statePrincipalTotal * p.option.vest)} devlet anaparası = <strong>{money(p.gain)}</strong>
                {" "}→ vergi <strong style={{ color: "#fb7185" }}>{money(p.tax)}</strong>
              </Adim>
              <Adim n="7" baslik="Net eline geçen">
                {money(p.gross)} − {money(p.tax)} = <strong style={{ color: "#86efac", fontSize: 14 }}>{money(p.net)}</strong>
              </Adim>
            </div>
          </details>

          {/* Karsilastirma */}
          <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 16, background: "rgba(2,6,23,.35)" }}>
            <h3 style={{ margin: "0 0 4px", color: "#fff", fontSize: 16 }}>Ne zaman çıksam?</h3>
            <p className="sectionDescription" style={{ marginTop: 0 }}>Aynı katkıyla farklı çıkış zamanlarında eline geçecek net tutar.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 12.5, minWidth: 460 }}>
                <thead>
                  <tr style={{ color: "#bfdbfe", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>Çıkış</th>
                    <th style={{ padding: "8px 10px" }}>Devlet Katkısı Hakkı</th>
                    <th style={{ padding: "8px 10px" }}>Stopaj</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Net Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {karsilastirma.map((k) => (
                    <tr key={k.years} style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: k.years === exitYears ? "rgba(96,165,250,.12)" : "transparent" }}>
                      <td style={{ padding: "10px" }}>{k.label}{k.years === exitYears ? <span style={{ color: "#93c5fd", fontSize: 10.5, marginLeft: 6 }}>seçili</span> : null}</td>
                      <td style={{ padding: "10px" }}>%{Math.round(k.vest * 100)}</td>
                      <td style={{ padding: "10px" }}>%{Math.round(k.tax * 100)}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: k.years === exitYears ? "#86efac" : "#e2e8f0" }}>{money(k.sonuc.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="sectionDescription" style={{ marginTop: 14, lineHeight: 1.6 }}>
            <strong>Kurallar (2026):</strong> Devlet katkısı ödediğin katkı payının %20'si (yılda en fazla {money(ANNUAL_STATE_CAP)}).
            Devlet katkısı da fonlarda değerlenir ve hak ediş <em>katkı + getirisi</em> üzerinden hesaplanır:
            3 yıl %15 · 6 yıl %35 · 10 yıl %60 · emeklilik %100. Stopaj yalnızca <em>getiri</em> üzerinden alınır.
            Bu bir tahmindir; gerçek tutar fon performansına göre değişir.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Adim({ n, baslik, children }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <span style={{ flex: "0 0 22px", height: 22, borderRadius: 999, background: "rgba(96,165,250,.22)", color: "#93c5fd", fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center" }}>{n}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 12.5 }}>{baslik}</span>
        <span style={{ display: "block", marginTop: 2 }}>{children}</span>
      </span>
    </div>
  );
}

function Kalem({ etiket, tutar, renk, alt }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, padding: "11px 13px", background: "rgba(2,6,23,.45)", minWidth: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.35 }}>{etiket}</div>
      <div style={{ color: renk, fontSize: 17, fontWeight: 800, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tutar}</div>
      {alt ? <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 2 }}>{alt}</div> : null}
    </div>
  );
}
