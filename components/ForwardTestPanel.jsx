"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
  ComposedChart, Line,
} from "recharts";

const fmt$ = (n) => (n == null ? "—" : `$${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const fmtPct = (n) => (n == null ? "—" : `%${Number(n).toFixed(1)}`);
const fmtDate = (t) => new Date(t).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
const fmtTime = (t) => new Date(t).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Stat({ label, value, tone = "default", sub }) {
  const color = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function ForwardTestPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/forward", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Veri yok"); setData(null); }
      else { setData(json); setError(""); }
    } catch (e) { setError(String(e?.message || e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // 20 sn'de bir canlı yenile
    return () => clearInterval(id);
  }, [load]);

  const up = data && data.pnl >= 0;

  return (
    <div className="mx-auto max-w-5xl px-1 py-2 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Trading Forward-Test</h2>
          <p className="text-sm text-slate-300">Gerçek-zamanlı paper trading · sahte para · canlı fiyat</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> canlı
          </span>
          <button onClick={load} className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-white/10">Yenile</button>
        </div>
      </div>

      {loading && <p className="mt-8 text-slate-300">Yükleniyor…</p>}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {data && (
        <>
          <p className="mt-2 text-xs text-slate-300">
            {data.config} · başlangıç {new Date(data.startISO).toLocaleDateString("tr-TR")} · {data.elapsedDays} gün ·
            son güncelleme {fmtTime(data.updatedAt)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Bakiye" value={fmt$(data.combinedEquity)} sub="başlangıç $200" />
            <Stat label="Kâr / Zarar" value={`${up ? "+" : ""}${fmt$(data.pnl)}`} tone={up ? "up" : "down"} />
            <Stat label="Getiri" value={fmtPct(data.returnPct)} tone={up ? "up" : "down"} />
            <Stat label="Max Drawdown" value={fmtPct(data.drawdownPct)} tone="down" />
            <Stat label="Win Rate" value={fmtPct(data.winRate)} />
            <Stat label="İşlem" value={data.trades} />
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Bakiye eğrisi (birleşik $200)</div>
            <div className="h-64 w-full">
              {data.equityCurve?.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.equityCurve} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? "#10b981" : "#f43f5e"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={up ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "#94a3b8" }} minTickGap={40} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#94a3b8" }} width={48} />
                    <Tooltip
                      labelFormatter={(t) => fmtTime(t)}
                      formatter={(v) => [fmt$(v), "Bakiye"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <ReferenceLine y={200} stroke="#cbd5e1" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="equity" stroke={up ? "#10b981" : "#f43f5e"} strokeWidth={2} fill="url(#eq)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Henüz kapanmış işlem yok — sistem yeni başladı, veri birikiyor.
                </div>
              )}
            </div>
          </div>

          {data.expectation && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 text-sm font-medium text-slate-700">Beklenti vs Gerçek</div>
              <p className="mb-3 text-xs text-slate-400">
                Gri bant = backtest'e göre bu işlem sayısında %80 olasılıkla olman gereken aralık (2000 simülasyon).
                Çizgin bandın içindeyse sistem normal davranıyor demektir.
              </p>
              <div className="mb-3 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-400">Win rate</div>
                  <div>beklenen %{data.expectation.stats.expWinRate} · gerçek <span className={data.winRate >= data.expectation.stats.expWinRate * 0.7 ? "text-emerald-600" : "text-amber-600"}>%{data.winRate}</span></div>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-400">İşlem / gün</div>
                  <div>beklenen {data.expectation.stats.expTradesPerDay} · gerçek {data.expectation.stats.actualTradesPerDay ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-400">Max drawdown</div>
                  <div>beklenen ~%{data.expectation.stats.expMaxDrawdownPct} · gerçek <span className={data.drawdownPct <= data.expectation.stats.expMaxDrawdownPct ? "text-emerald-600" : "text-rose-600"}>%{data.drawdownPct}</span></div>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.expectation.cone.map((c) => ({
                      ...c,
                      band: [c.p10, c.p90],
                      actual: data.actualByTrade?.find((a) => a.n === c.n)?.actual ?? null,
                    }))}
                    margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
                  >
                    <XAxis dataKey="n" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "işlem sırası", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#94a3b8" }} width={48} />
                    <Tooltip
                      formatter={(v, name) => {
                        if (name === "band") return [`${fmt$(v[0])} – ${fmt$(v[1])}`, "beklenen aralık (p10–p90)"];
                        if (name === "p50") return [fmt$(v), "beklenen orta (p50)"];
                        return [fmt$(v), "gerçek"];
                      }}
                      labelFormatter={(n) => `${n}. işlem`}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <ReferenceLine y={200} stroke="#cbd5e1" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="band" stroke="none" fill="#94a3b8" fillOpacity={0.18} />
                    <Line type="monotone" dataKey="p50" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="actual" stroke={up ? "#10b981" : "#f43f5e"} strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {data.parallel && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 text-sm font-medium text-slate-700">Paralel aday testi — v1 (canlı) vs v2 (BTC'de ADX kilidi)</div>
              <p className="mb-3 text-xs text-slate-400">
                İki sürüm de {new Date(data.parallel.startISO).toLocaleDateString("tr-TR")} tarihinden itibaren aynı koşullarda izleniyor.
                Yeterli işlem birikince hangisinin daha iyi olduğuna gerçek zamanlı veri karar verecek.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[["v1 — mevcut sistem", data.parallel.v1], ["v2 — aday (BTC+ADX20)", data.parallel.v2]].map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className={`text-lg font-semibold ${v.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {fmt$(v.equity)} <span className="text-xs font-normal">({v.pnl >= 0 ? "+" : ""}{fmt$(v.pnl)})</span>
                    </div>
                    <div className="text-xs text-slate-500">{v.trades} işlem · WR %{v.wr}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-slate-700">Ortalama gelir (şimdiye dek)</div>
              {data.perPeriod ? (
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Günlük" value={fmt$(data.perPeriod.daily)} tone={data.perPeriod.daily >= 0 ? "up" : "down"} />
                  <Stat label="Haftalık" value={fmt$(data.perPeriod.weekly)} tone={data.perPeriod.weekly >= 0 ? "up" : "down"} />
                  <Stat label="Aylık" value={fmt$(data.perPeriod.monthly)} tone={data.perPeriod.monthly >= 0 ? "up" : "down"} />
                </div>
              ) : (
                <p className="text-sm text-slate-400">Ortalama için en az ~1 gün veri gerekiyor.</p>
              )}
              <div className="mt-4 space-y-2">
                {data.positions?.map((p) => (
                  <div key={p.sym} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium">{p.sym}</span>
                    <span className="text-slate-500">{fmt$(p.equity)} · {p.trades} işlem</span>
                    <span className={p.open ? (p.open === "long" ? "text-emerald-600" : "text-rose-600") : "text-slate-400"}>
                      {p.open ? `AÇIK ${p.open}` : "pozisyon yok"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-slate-700">Son işlemler</div>
              {data.recentTrades?.length ? (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-slate-400">
                      <tr><th className="py-1">Coin</th><th>Yön</th><th>Sonuç</th><th className="text-right">Zaman</th></tr>
                    </thead>
                    <tbody>
                      {data.recentTrades.map((t, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="py-1.5">{t.sym.replace("/USDT", "")}</td>
                          <td className={t.side === "long" ? "text-emerald-600" : "text-rose-600"}>{t.side}</td>
                          <td className={t.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>{t.pnl >= 0 ? "+" : ""}{fmt$(t.pnl)}</td>
                          <td className="text-right text-slate-400">{fmtTime(t.exitTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Henüz kapanmış işlem yok.</p>
              )}
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400/90">
            Not: Bu backtest değil, gerçek-zamanlı paper trading. Sahte para, canlı fiyat. 4-8 hafta izlenir.
            Panel 20 saniyede bir otomatik yenilenir.
          </p>
        </>
      )}
    </div>
  );
}
