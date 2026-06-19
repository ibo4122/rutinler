"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { money, pct } from "../lib/format";

const glassCard = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 24,
  padding: 20,
  background: "linear-gradient(145deg, rgba(15,23,42,.72), rgba(49,46,129,.30))",
  boxShadow: "0 22px 55px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.08)",
};

export default function OverviewDashboard({ financeTotals, investmentTotals, routines = [], showPnl = false, onNavigate }) {
  const liquid = Number(investmentTotals?.availableInvestment || 0); // likide edilebilir (BES/blokajlı hariç)
  const debt = Number(financeTotals?.totalDebt || 0);
  const netWorth = liquid - debt;
  const balance = Number(financeTotals?.balance || 0);

  const distribution = useMemo(() => {
    return [
      { key: "bes", label: "BES", value: Number(investmentTotals?.besTotal || 0), color: "#a78bfa" },
      { key: "gold", label: "Altın / Metal", value: Number(investmentTotals?.goldValue || 0), color: "#fbbf24" },
      { key: "stocks", label: "Hisse", value: Number(investmentTotals?.stockValue || 0), color: "#34d399" },
      { key: "crypto", label: "Kripto", value: Number(investmentTotals?.cryptoValue || 0), color: "#fb7185" },
      { key: "funds", label: "Fon", value: Number(investmentTotals?.fundValue || 0), color: "#f472b6" },
      { key: "forex", label: "Döviz / Nakit", value: Number(investmentTotals?.forexValue || 0), color: "#22d3ee" },
    ].filter((item) => item.value > 0);
  }, [investmentTotals]);

  const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0);

  const routineStats = useMemo(() => {
    const tasks = (routines || []).filter((item) => item?.recordType !== "goal");
    const count = (status) =>
      tasks.filter((item) => {
        const s = item?.status || (item?.failed ? "failed" : item?.done || item?.completed ? "done" : "pending");
        return s === status;
      }).length;
    const done = count("done");
    const failed = count("failed");
    const pending = count("pending");
    const total = tasks.length;
    return { done, failed, pending, total, rate: total > 0 ? (done / total) * 100 : 0 };
  }, [routines]);

  return (
    <section style={{ display: "grid", gap: 18 }}>
      {/* Hero: Net Değer */}
      <div style={{ ...glassCard, padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>Net Değer</div>
            <div style={{ color: netWorth >= 0 ? "#86efac" : "#fca5a5", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, marginTop: 6, lineHeight: 1.1, whiteSpace: "nowrap" }}>{money(netWorth)}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>Likide değer − toplam borç (BES/blokajlı hariç)</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 10 }}>
            <HeroStat label="Likide Değer" value={money(liquid)} tone="#60a5fa" />
            <HeroStat label="Toplam Borç" value={money(debt)} tone="#fb7185" />
            <HeroStat label="Aylık Kalan" value={money(balance)} tone={balance >= 0 ? "#34d399" : "#fb7185"} />
            <HeroStat label="Aylık Gelir" value={money(financeTotals?.totalIncome)} tone="#a78bfa" />
            {showPnl ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <HeroStat
                  label="Portföy Kâr / Zarar"
                  value={`${money(investmentTotals?.totalPnl)} • ${pct(investmentTotals?.totalPnlRate)}`}
                  tone={Number(investmentTotals?.totalPnl || 0) >= 0 ? "#34d399" : "#fb7185"}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="dashTwoCol">
        {/* Finansal özet */}
        <div style={glassCard}>
          <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Finansal Özet</h3>
          <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 16px" }}>Bu ayki gelir, gider ve borç durumu.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatCard label="Toplam Gelir" value={money(financeTotals?.totalIncome)} color="#34d399" />
            <StatCard label="Toplam Gider" value={money(financeTotals?.totalExpense)} color="#fb7185" />
            <StatCard label="Aylık Kalan" value={money(balance)} color="#60a5fa" />
            <StatCard label="Toplam Borç" value={money(debt)} color="#a78bfa" />
          </div>
          <button type="button" className="tabButton" style={{ marginTop: 16 }} onClick={() => onNavigate?.("finance")}>Gelir / Gider'e git →</button>
        </div>

        {/* Portföy dağılımı */}
        <div style={glassCard}>
          <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Portföy Dağılımı</h3>
          <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 12px" }}>Varlık türlerinin toplam içindeki payı.</p>
          {distribution.length ? (
            <>
              <div style={{ position: "relative", width: "100%", height: 200, margin: "4px 0 16px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                      {distribution.map((item) => <Cell key={item.key} fill={item.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [money(value), name]}
                      contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", textAlign: "center", color: "#fff" }}>
                  <div>
                    <span style={{ display: "block", fontSize: 10, color: "#cbd5e1" }}>Toplam</span>
                    <strong style={{ fontSize: 14 }}>{money(distributionTotal)}</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {distribution.map((item) => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0", fontSize: 12 }}>
                    <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: item.color, marginRight: 7 }} />{item.label}</span>
                    <strong>{pct((item.value / distributionTotal) * 100)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "30px 0", textAlign: "center" }}>Dağılım için yatırım kaydı yok.</div>
          )}
          <button type="button" className="tabButton" style={{ marginTop: 16 }} onClick={() => onNavigate?.("investments")}>Yatırımlar'a git →</button>
        </div>
      </div>

      {/* Rutin özeti */}
      <div style={glassCard}>
        <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Rutin Özeti</h3>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 16px" }}>Görevlerin tamamlanma durumu.</p>
        {routineStats.total ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <RoutineStat label="Tamamlandı" value={routineStats.done} icon="✅" color="#22c55e" />
              <RoutineStat label="Devam ediyor" value={routineStats.pending} icon="🔵" color="#60a5fa" />
              <RoutineStat label="Tamamlanamadı" value={routineStats.failed} icon="❌" color="#ef4444" />
              <RoutineStat label="Toplam görev" value={routineStats.total} icon="📋" color="#a78bfa" />
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 12, marginBottom: 6 }}>
                <span>Tamamlanma oranı</span>
                <strong>{pct(routineStats.rate)}</strong>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
                <div style={{ width: `${routineStats.rate}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#34d399)" }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Henüz görev kaydı yok.</div>
        )}
        <button type="button" className="tabButton" style={{ marginTop: 16 }} onClick={() => onNavigate?.("routines")}>Haftalık Rutin'e git →</button>
      </div>
    </section>
  );
}

function HeroStat({ label, value, tone }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "10px 14px", background: "rgba(2,6,23,.45)", minWidth: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ color: tone, fontSize: 17, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ border: `1px solid ${color}44`, borderRadius: 18, padding: "14px 16px", background: `linear-gradient(150deg, ${color}30, ${color}10)`, minWidth: 0 }}>
      <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ color, fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 900, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function RoutineStat({ label, value, icon, color }) {
  return (
    <div style={{ border: `1px solid ${color}55`, borderRadius: 16, padding: "14px 16px", background: `${color}1a` }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>{value}</div>
      <div style={{ color: "#cbd5e1", fontSize: 12 }}>{label}</div>
    </div>
  );
}
