"use client";

import { useMemo } from "react";
import { money } from "../lib/format";

// Hedef türleri — her tür kendi ekranına/şablonuna sahip (tür seçilince ekran o türe
// göre değişir). Şimdilik yalnız "konut" tam kurulu; diğerleri için talimat bekleniyor.
const GOAL_TYPES = [
  { id: "konut", label: "Konut", icon: "🏠", ready: true },
  { id: "arac", label: "Araç", icon: "🚗", ready: false },
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

// Tür bazlı hesaplama: her tür hedefini kendi alanlarından {target, resources}'a indirger.
function calcGoal(goal) {
  if (goal.type === "konut") {
    const target = num(goal.houseValue);
    const resources = num(goal.mortgage) + num(goal.liquidFunds) + num(goal.currentHomeValue);
    return baseCalc(goal, target, resources);
  }
  // İleride diğer türler buraya eklenecek.
  return baseCalc(goal, num(goal.targetValue), 0);
}
function baseCalc(goal, target, resources) {
  const gap = Math.max(0, target - resources);
  const percent = target > 0 ? Math.min(100, (resources / target) * 100) : 0;
  let monthsLeft = null;
  if (goal.targetDate) {
    const d = new Date(goal.targetDate);
    const now = new Date();
    if (!Number.isNaN(d.getTime())) monthsLeft = Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
  }
  const monthlyNeeded = monthsLeft && monthsLeft > 0 ? gap / monthsLeft : null;
  return { target, resources, gap, percent, monthsLeft, monthlyNeeded };
}

const card = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 20,
  padding: 18,
  background: "linear-gradient(150deg, rgba(15,23,42,.72), rgba(30,27,75,.34))",
};
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(2,6,23,.6)",
  color: "#f8fafc",
  borderRadius: 12,
  padding: "9px 11px",
  outline: "none",
  fontSize: 13,
};

export default function FinancialGoals({ data, setData, financeTotals, investmentTotals, monthlyBalance = 0 }) {
  const goals = data?.goals || [];
  const liquidAvailable = Number(investmentTotals?.availableInvestment || 0);

  // Hedef listesini DAİMA en güncel state (functional updater'ın d'si) üzerinden değiştir
  // — closure'daki `goals` bayatlayıp art arda güncellemeleri kaybetmesin.
  const mutateGoals = (fn) =>
    setData((d) => {
      const cur = { categories: [], assets: [], debts: [], goals: [], ...d };
      return { ...cur, goals: fn(cur.goals || []) };
    });

  const addGoal = (type) => {
    const meta = GOAL_TYPES.find((t) => t.id === type);
    if (!meta?.ready) {
      window.alert(`"${meta?.label}" kategorisi yakında eklenecek. Şimdilik Konut hedefi oluşturabilirsin.`);
      return;
    }
    const base = { id: uid(), type, name: type === "konut" ? "Ev Alma Hedefi" : `${meta.label} Hedefi`, targetDate: "" };
    const fields = type === "konut" ? { houseValue: "", mortgage: "", liquidFunds: "", currentHomeValue: "" } : { targetValue: "" };
    mutateGoals((gs) => [{ ...base, ...fields }, ...gs]);
  };
  const updateGoal = (id, field, value) => mutateGoals((gs) => gs.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  const deleteGoal = (id) => mutateGoals((gs) => gs.filter((g) => g.id !== id));

  const summary = useMemo(() => {
    const gc = goals.map(calcGoal);
    const totalTarget = gc.reduce((s, g) => s + g.target, 0);
    const totalResources = gc.reduce((s, g) => s + g.resources, 0);
    const totalGap = gc.reduce((s, g) => s + g.gap, 0);
    const achievement = totalTarget > 0 ? Math.min(100, (totalResources / totalTarget) * 100) : 0;
    return { totalTarget, totalResources, totalGap, achievement };
  }, [goals]);

  return (
    <section style={{ display: "grid", gap: 18 }}>
      {/* Finansal Durum Özeti */}
      <div style={{ ...card, padding: 22 }}>
        <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Finansal Durum Özeti</h3>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 16px" }}>Hedeflerinin toplamı ve mevcut likit durumun.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <SummaryStat label="Likit Edilebilir Varlıklar" value={money(liquidAvailable)} color="#60a5fa" />
          <SummaryStat label="Toplam Hedef Büyüklüğü" value={money(summary.totalTarget)} color="#fbbf24" />
          <SummaryStat label="Karşılanan Kaynak" value={money(summary.totalResources)} color="#34d399" />
          <SummaryStat label="Finansman Açığı" value={money(summary.totalGap)} color="#fb7185" />
          <SummaryStat label="Hedef Gerçekleşme Oranı" value={`%${summary.achievement.toFixed(1)}`} color="#22d3ee" />
        </div>
      </div>

      {/* Hedef Türü Seç */}
      <div style={card}>
        <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Yeni Hedef Oluştur</h3>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 14px" }}>Bir kategori seç — ekran o hedefe özel alanlarla açılır.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {GOAL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addGoal(t.id)}
              title={t.ready ? `${t.label} hedefi ekle` : "Yakında"}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                minWidth: 96, padding: "14px 12px", borderRadius: 16, cursor: "pointer",
                border: `1px solid ${t.ready ? "rgba(96,165,250,.5)" : "rgba(255,255,255,.12)"}`,
                background: t.ready ? "linear-gradient(150deg, rgba(96,165,250,.18), rgba(139,92,246,.12))" : "rgba(2,6,23,.4)",
                color: "#fff", opacity: t.ready ? 1 : 0.55,
              }}
            >
              <span style={{ fontSize: 26 }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
              <span style={{ fontSize: 10, color: t.ready ? "#86efac" : "#94a3b8" }}>{t.ready ? "Hazır" : "Yakında"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hedefler */}
      {goals.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#94a3b8", fontSize: 14, padding: 28 }}>
          Henüz hedef yok. Yukarıdan bir kategori seçerek başla.
        </div>
      ) : (
        goals.map((goal) =>
          goal.type === "konut" ? (
            <KonutGoalCard key={goal.id} goal={goal} onChange={updateGoal} onDelete={deleteGoal} monthlyBalance={monthlyBalance} liquidHint={liquidAvailable} />
          ) : (
            <div key={goal.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#fff" }}>{typeMeta(goal.type).icon} {goal.name}</strong>
                <button type="button" className="deleteButton" onClick={() => deleteGoal(goal.id)}>Sil</button>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 0 }}>Bu kategori şablonu yakında eklenecek.</p>
            </div>
          )
        )
      )}
    </section>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <div style={{ border: `1px solid ${color}44`, borderRadius: 16, padding: "12px 14px", background: `linear-gradient(150deg, ${color}24, ${color}0c)`, minWidth: 0 }}>
      <div style={{ color: "#cbd5e1", fontSize: 10.5, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase", lineHeight: 1.3 }}>{label}</div>
      <div style={{ color, fontSize: "clamp(17px, 2vw, 22px)", fontWeight: 900, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, hint }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: "#cbd5e1", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</span>
      <input style={inputStyle} type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint ? <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 3 }}>{hint}</span> : null}
    </label>
  );
}

function Calc({ label, value, tone = "#e2e8f0", sub }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "10px 12px", background: "rgba(2,6,23,.4)", minWidth: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", lineHeight: 1.3 }}>{label}</div>
      <div style={{ color: tone, fontSize: 15, fontWeight: 800, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      {sub ? <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

// --- KONUT (Ev Alma) şablonu ---
function KonutGoalCard({ goal, onChange, onDelete, monthlyBalance, liquidHint }) {
  const c = calcGoal(goal);
  const set = (field) => (value) => onChange(goal.id, field, value);
  const estMonths = c.gap > 0 && monthlyBalance > 0 ? Math.ceil(c.gap / monthlyBalance) : null;
  const estDate = estMonths != null ? new Date(Date.now() + estMonths * 30 * 24 * 3600 * 1000).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) : null;

  return (
    <div style={{ ...card, borderLeft: "4px solid #60a5fa" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) auto", gap: 10, alignItems: "end", marginBottom: 14 }}>
        <Field label="🏠 Hedef Adı" value={goal.name} onChange={set("name")} placeholder="Örn: Ev Alma Hedefi" />
        <Field label="Hedeflenen Tarih" type="date" value={goal.targetDate} onChange={set("targetDate")} />
        <button type="button" className="deleteButton" onClick={() => onDelete(goal.id)}>Sil</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
        <Field label="Evin Değeri" value={goal.houseValue} onChange={set("houseValue")} placeholder="0" />
        <Field label="Kullanılacak Ev Kredisi" value={goal.mortgage} onChange={set("mortgage")} placeholder="0" />
        <Field label="Mevcut Likidite Edilebilir Tutar" value={goal.liquidFunds} onChange={set("liquidFunds")} placeholder="0" hint={`Yatırımlarındaki likit değer: ${money(liquidHint)}`} />
        <Field label="Mevcut Ev Değeri (satılacak/kullanılacak)" value={goal.currentHomeValue} onChange={set("currentHomeValue")} placeholder="0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        <Calc label="Toplam Finansman İhtiyacı" value={money(c.target)} />
        <Calc label="Kullanılabilir Kaynaklar" value={money(c.resources)} tone="#34d399" />
        <Calc label="Finansman Açığı" value={money(c.gap)} tone={c.gap > 0 ? "#fb7185" : "#34d399"} sub="Gerekli ek sermaye" />
        <Calc label="Aylık Hedef Tutarı" value={c.monthlyNeeded != null ? money(c.monthlyNeeded) : "—"} sub={c.monthsLeft != null ? `${c.monthsLeft} ay kaldı` : "tarih gir"} />
        <Calc label="Tahmini Ulaşma" value={estDate || "—"} sub={estMonths != null ? `~${estMonths} ay (aylık ${money(monthlyBalance)})` : "aylık kalan ≤ 0"} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 12, marginBottom: 6 }}>
          <span>Hedef Gerçekleşme Oranı</span>
          <strong style={{ color: c.percent >= 100 ? "#34d399" : "#60a5fa" }}>%{c.percent.toFixed(1)}</strong>
        </div>
        <div style={{ height: 12, borderRadius: 999, background: "rgba(2,6,23,.5)", overflow: "hidden" }}>
          <div style={{ width: `${c.percent}%`, height: "100%", background: c.percent >= 100 ? "linear-gradient(90deg,#22c55e,#34d399)" : "linear-gradient(90deg,#60a5fa,#fff)", transition: "width .3s ease" }} />
        </div>
      </div>
    </div>
  );
}
