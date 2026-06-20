"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { money, pct } from "../lib/format";
import { fetchNotes } from "../lib/notesApi";

function relativeTime(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} gün önce`;
  return new Date(value).toLocaleDateString("tr-TR");
}

const glassCard = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 24,
  padding: 20,
  background: "linear-gradient(145deg, rgba(15,23,42,.72), rgba(49,46,129,.30))",
  boxShadow: "0 22px 55px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.08)",
};

export default function OverviewDashboard({ userId, financeTotals, investmentTotals, routines = [], showPnl = false, onNavigate }) {
  const liquid = Number(investmentTotals?.availableInvestment || 0); // likide edilebilir (BES/blokajlı hariç)
  const debt = Number(financeTotals?.totalDebt || 0);
  const netWorth = liquid - debt;
  const balance = Number(financeTotals?.balance || 0);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setNotesLoading(true);
    fetchNotes(userId)
      .then(({ data }) => { if (alive) setNotes(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setNotes([]); })
      .finally(() => { if (alive) setNotesLoading(false); });
    return () => { alive = false; };
  }, [userId]);

  const recentNotes = useMemo(() => notes.slice(0, 5), [notes]);
  const favoriteNotes = useMemo(() => notes.filter((n) => n?.is_favorite).slice(0, 4), [notes]);

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

  const reminders = useMemo(() => {
    const list = [];
    if (balance < 0) list.push({ icon: "⚠️", text: `Aylık giderlerin gelirini ${money(Math.abs(balance))} aşıyor.`, tone: "#fca5a5" });
    if (debt > 0 && liquid > 0 && debt > liquid) list.push({ icon: "📉", text: "Toplam borcun likide varlıklarını aşıyor.", tone: "#fbbf24" });
    if (Number(financeTotals?.creditDebtTotal || 0) > 0) list.push({ icon: "💳", text: `Açık kredi borcun: ${money(financeTotals.creditDebtTotal)}.`, tone: "#93c5fd" });
    if (routineStats.pending > 0) list.push({ icon: "📋", text: `${routineStats.pending} rutin görevi seni bekliyor.`, tone: "#a5b4fc" });
    if (routineStats.failed > 0) list.push({ icon: "❌", text: `${routineStats.failed} görev tamamlanamadı.`, tone: "#fca5a5" });
    if (!list.length) list.push({ icon: "✅", text: "Acil bir hatırlatma yok, her şey yolunda.", tone: "#86efac" });
    return list;
  }, [balance, debt, liquid, financeTotals, routineStats]);

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

      <div className="dashTwoCol">
        {/* Hatırlatmalar */}
        <div style={glassCard}>
          <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Hatırlatmalar</h3>
          <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 14px" }}>Finans ve rutin durumundan öne çıkanlar.</p>
          <div style={{ display: "grid", gap: 10 }}>
            {reminders.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, padding: "11px 14px", background: "rgba(2,6,23,.40)" }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{ color: r.tone, fontSize: 13, fontWeight: 600 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Son Notlar */}
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Son Notlar</h3>
            <button type="button" className="tabButton" onClick={() => onNavigate?.("notes")}>Notlar'a git →</button>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 14px" }}>En son düzenlediğin ve favori notların.</p>
          {notesLoading ? (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Notlar yükleniyor...</div>
          ) : recentNotes.length ? (
            <>
              <div style={{ display: "grid", gap: 8 }}>
                {recentNotes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onNavigate?.("notes")}
                    style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, padding: "11px 14px", background: "rgba(2,6,23,.40)", cursor: "pointer", color: "#e2e8f0" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <span>{n.is_favorite ? "⭐" : "📄"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: 13 }}>{n.title || "Adsız not"}</span>
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap" }}>{relativeTime(n.updated_at || n.created_at)}</span>
                  </button>
                ))}
              </div>
              {favoriteNotes.length ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>Favoriler</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {favoriteNotes.map((n) => (
                      <button key={n.id} type="button" onClick={() => onNavigate?.("notes")} style={{ border: "1px solid rgba(250,204,21,.35)", background: "rgba(250,204,21,.10)", color: "#fde68a", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        ⭐ {n.title || "Adsız not"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              Henüz not yok. <button type="button" className="tabButton" style={{ marginLeft: 6 }} onClick={() => onNavigate?.("notes")}>İlk notunu oluştur →</button>
            </div>
          )}
        </div>
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
