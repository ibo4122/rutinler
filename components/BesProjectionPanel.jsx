"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "../lib/format";

// ---------------------------------------------------------------------------
// BES kurallari (2026)
//  - Devlet katkisi: odenen katki payinin %20'si (01.01.2026'dan itibaren; onceden %30)
//  - Yillik ust sinir: 396.360 TL katkiya karsilik en fazla 79.272 TL devlet katkisi
//  - Hak edis (sistemde kalma suresine gore devlet katkisinin ne kadarini alirsin):
//      <3 yil %0 | 3-6 yil %15 | 6-10 yil %35 | 10+ yil %60 | 10 yil + 56 yas %100
//  - Stopaj: yalnizca GETIRI uzerinden. 10 yildan once cikis %15, 10 yil (emekli degil)
//    %10, emeklilik %5. Anaparadan kesinti yapilmaz.
// ---------------------------------------------------------------------------
const STATE_RATE = 0.20;
const ANNUAL_STATE_CAP = 79272;      // 2026 yillik devlet katkisi ust siniri
const ANNUAL_CONTRIB_CAP = 396360;   // bu sinira karsilik gelen yillik katki payi

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

// Aylik odemeli birikimin gelecek degeri (donem sonu odemeli anuite)
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

// Yillik ust sinir dikkate alinarak aylik devlet katkisi
function monthlyStateContribution(monthlyContribution) {
  const yearly = monthlyContribution * 12;
  const capped = Math.min(yearly, ANNUAL_CONTRIB_CAP);
  return (capped * STATE_RATE) / 12;
}

function project({ startDate, monthly, ownBalance, stateBalance, annualReturn, exitYears }) {
  const elapsed = monthsBetween(startDate);
  const exitMonths = exitYears * 12;
  const remaining = Math.max(0, exitMonths - elapsed);
  const i = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const monthlyState = monthlyStateContribution(monthly);

  // Bugunku bakiyeler: kullanici girdiyse onu kullan, girmediyse plana gore tahmin et
  const ownNow = ownBalance > 0 ? ownBalance : futureValue(monthly, i, elapsed);
  const stateNow = stateBalance > 0 ? stateBalance : futureValue(monthlyState, i, elapsed);

  // Cikisa kadar: mevcut bakiye buyur + yeni katkilar birikir
  const growth = Math.pow(1 + i, remaining);
  const ownAtExit = ownNow * growth + futureValue(monthly, i, remaining);
  const stateAtExit = stateNow * growth + futureValue(monthlyState, i, remaining);

  // Anapara (stopaj matrahi icin): toplam odenen katki payi ve devlet katkisi anaparasi
  const paidPrincipal = monthly * exitMonths;
  const statePrincipal = monthlyState * exitMonths;

  const option = EXIT_OPTIONS.find((o) => o.years === exitYears) || EXIT_OPTIONS[1];
  const vestedState = stateAtExit * option.vest;
  const vestedStatePrincipal = statePrincipal * option.vest;

  const gross = ownAtExit + vestedState;
  const gain = Math.max(0, gross - paidPrincipal - vestedStatePrincipal);
  const tax = gain * option.tax;
  const net = gross - tax;

  // Bugun itibariyle hak edilen (panel basligi ve portfoy toplami icin)
  const elapsedYears = elapsed / 12;
  const currentVest = elapsedYears >= 10 ? 0.6 : elapsedYears >= 6 ? 0.35 : elapsedYears >= 3 ? 0.15 : 0;
  const currentTotal = ownNow + stateNow * currentVest;

  return {
    elapsed, remaining, exitMonths, option,
    ownNow, stateNow, currentVest, currentTotal,
    ownAtExit, stateAtExit, vestedState, gross, gain, tax, net,
    paidPrincipal, statePrincipal,
    lostState: stateAtExit - vestedState,
    progress: Math.min(100, (elapsed / exitMonths) * 100),
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

export default function BesProjectionPanel({ onTotalChange, settings, onSettingsChange }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(todayIso());
  const [monthly, setMonthly] = useState("0");
  const [ownBalance, setOwnBalance] = useState("");
  const [stateBalance, setStateBalance] = useState("");
  const [annualReturn, setAnnualReturn] = useState("30");
  const [exitYears, setExitYears] = useState(6);

  // Kayitli ayarlari bir kez yukle (eski surumun alanlarindan da tasi).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !settings || typeof settings !== "object") return;
    hydratedRef.current = true;
    const s = settings;
    if (s.startDate) setStartDate(s.startDate);
    if (s.monthlyContribution != null) setMonthly(String(s.monthlyContribution));
    else if (Array.isArray(s.yearlyInputs) && s.yearlyInputs[0]?.monthlyContribution) setMonthly(String(s.yearlyInputs[0].monthlyContribution));
    if (s.ownBalance != null) setOwnBalance(String(s.ownBalance));
    else if (s.actualPrincipalPaid || s.actualMainFundReturn) setOwnBalance(String(num(s.actualPrincipalPaid) + num(s.actualMainFundReturn) || ""));
    if (s.stateBalance != null) setStateBalance(String(s.stateBalance));
    else if (s.actualStateContribution || s.actualStateFundReturn) setStateBalance(String(num(s.actualStateContribution) + num(s.actualStateFundReturn) || ""));
    if (s.annualReturn != null) setAnnualReturn(String(s.annualReturn));
    if (s.exitYears != null) setExitYears(Number(s.exitYears) || 6);
  }, [settings]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    onSettingsChange?.({ startDate, monthlyContribution: monthly, ownBalance, stateBalance, annualReturn, exitYears });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, monthly, ownBalance, stateBalance, annualReturn, exitYears]);

  const p = useMemo(() => project({
    startDate, monthly: num(monthly), ownBalance: num(ownBalance),
    stateBalance: num(stateBalance), annualReturn: num(annualReturn) || 0, exitYears,
  }), [startDate, monthly, ownBalance, stateBalance, annualReturn, exitYears]);

  useEffect(() => { onTotalChange?.(Number(p.currentTotal || 0)); }, [onTotalChange, p.currentTotal]);

  const karsilastirma = useMemo(() => EXIT_OPTIONS.map((o) =>
    ({ ...o, sonuc: project({ startDate, monthly: num(monthly), ownBalance: num(ownBalance), stateBalance: num(stateBalance), annualReturn: num(annualReturn) || 0, exitYears: o.years }) })
  ), [startDate, monthly, ownBalance, stateBalance, annualReturn]);

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
          {/* Girisler */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 18 }}>
            <Field label="BES Başlangıç Tarihi">
              <input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Aylık Katkı Payı (₺)">
              <input style={inputStyle} inputMode="decimal" value={monthly} placeholder="Örn: 5.000" onChange={(e) => setMonthly(e.target.value)} />
            </Field>
            <Field label="Mevcut Birikimin (₺)" hint="Boş bırakırsan plana göre tahmin edilir">
              <input style={inputStyle} inputMode="decimal" value={ownBalance} placeholder="Hesabındaki tutar" onChange={(e) => setOwnBalance(e.target.value)} />
            </Field>
            <Field label="Devlet Katkısı Hesabın (₺)" hint="Boş bırakırsan %20'den hesaplanır">
              <input style={inputStyle} inputMode="decimal" value={stateBalance} placeholder="Devlet katkısı tutarı" onChange={(e) => setStateBalance(e.target.value)} />
            </Field>
            <Field label="Yıllık Getiri Beklentin (%)" hint="Fonlarının ortalama yıllık kazancı">
              <input style={inputStyle} inputMode="decimal" value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} />
            </Field>
            <Field label="Çıkış Planın">
              <select style={inputStyle} value={exitYears} onChange={(e) => setExitYears(Number(e.target.value))}>
                {EXIT_OPTIONS.map((o) => <option key={o.years} value={o.years}>{o.label} — devlet katkısının %{Math.round(o.vest * 100)}'i</option>)}
              </select>
            </Field>
          </div>

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

          {/* Sonuc: cikista eline gececek */}
          <div style={{ border: "1px solid rgba(34,197,94,.35)", borderRadius: 20, padding: 20, background: "linear-gradient(150deg, rgba(34,197,94,.16), rgba(15,23,42,.6))", marginBottom: 16 }}>
            <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
              {p.option.label}nda elinize geçecek NET
            </div>
            <div style={{ color: "#86efac", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, margin: "6px 0 4px", lineHeight: 1.1 }}>{money(p.net)}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Vergi ve hak ediş kesintileri düşülmüş hâli</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginTop: 16 }}>
              <Kalem etiket="Kendi Birikimin" tutar={money(p.ownAtExit)} renk="#60a5fa" alt={`${money(p.paidPrincipal)} yatırdın`} />
              <Kalem etiket={`Hak Edilen Devlet Katkısı (%${Math.round(p.option.vest * 100)})`} tutar={money(p.vestedState)} renk="#a78bfa" alt={`${money(p.stateAtExit)} birikenin payı`} />
              <Kalem etiket="Brüt Toplam" tutar={money(p.gross)} renk="#e2e8f0" />
              <Kalem etiket={`Stopaj (%${Math.round(p.option.tax * 100)})`} tutar={`− ${money(p.tax)}`} renk="#fb7185" alt="Sadece getiri üzerinden" />
            </div>
          </div>

          {/* Cikis zamani karsilastirmasi */}
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
            {p.lostState > 0 ? (
              <div style={{ marginTop: 12, color: "#fbbf24", fontSize: 12, lineHeight: 1.55 }}>
                ⚠️ {p.option.label}nda çıkarsan devlet katkısının <strong>{money(p.lostState)}</strong> kadarını alamıyorsun. Daha uzun kalmak bu tutarı kazandırır.
              </div>
            ) : null}
          </div>

          <p className="sectionDescription" style={{ marginTop: 14, lineHeight: 1.6 }}>
            <strong>Kurallar (2026):</strong> Devlet katkısı ödediğin katkı payının %20'si (yılda en fazla {money(ANNUAL_STATE_CAP)}).
            Hak ediş: 3 yıl %15 · 6 yıl %35 · 10 yıl %60 · emeklilik %100. Stopaj yalnızca <em>getiri</em> üzerinden alınır,
            anaparandan kesinti yapılmaz. Bu hesap bir tahmindir; gerçek tutar fon performansına göre değişir.
          </p>
        </div>
      ) : null}
    </section>
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
