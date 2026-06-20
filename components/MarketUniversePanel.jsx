"use client";

import { useEffect, useMemo, useState } from "react";
import { pct } from "../lib/format";
import { assetValueTry } from "../lib/assets";

function trMoney(value, currency = "TRY") {
  const number = Number(value || 0);
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "TRY" ? 0 : 2,
    }).format(number);
  } catch {
    return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(number)} ${currency}`;
  }
}

function compact(value) {
  return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function distributionFrom(investments, investmentTotals) {
  const bes = Number(investmentTotals?.besTotal || 0);
  const gold = Number(investmentTotals?.goldValue || 0);
  const crypto = Number(investmentTotals?.cryptoValue || 0);
  const forex = Number(investmentTotals?.forexValue || 0);
  const funds = (investments?.funds || []).reduce((s, item) => s + assetValueTry(item), 0);
  const trStocks = (investments?.stocks || [])
    .filter((item) => (item.currency || "TRY") === "TRY")
    .reduce((s, item) => s + assetValueTry(item), 0);
  const usStocks = (investments?.stocks || [])
    .filter((item) => ["USD", "USDT"].includes(item.currency))
    .reduce((s, item) => s + assetValueTry(item), 0);

  return [
    { key: "bes", label: "BES", value: bes, color: "#a78bfa" },
    { key: "gold", label: "Altın / Metal", value: gold, color: "#fbbf24" },
    { key: "crypto", label: "Kripto", value: crypto, color: "#fb7185" },
    { key: "trStocks", label: "Türk Hisseleri", value: trStocks, color: "#34d399" },
    { key: "usStocks", label: "ABD Hisseleri", value: usStocks, color: "#60a5fa" },
    { key: "funds", label: "Türk Fonları", value: funds, color: "#f472b6" },
    { key: "forex", label: "Döviz / Nakit", value: forex, color: "#22d3ee" },
  ].filter((item) => item.value > 0);
}

function pieGradient(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return "conic-gradient(rgba(148,163,184,.35) 0deg 360deg)";

  let angle = 0;
  const parts = items.map((item) => {
    const size = (item.value / total) * 360;
    const start = angle;
    angle += size;
    return `${item.color} ${start}deg ${angle}deg`;
  });

  return `conic-gradient(${parts.join(",")})`;
}

export default function MarketUniversePanel({ investments, investmentTotals, marketData, onReload }) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("crypto");
  const [query, setQuery] = useState("");
  const [localData, setLocalData] = useState(marketData || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (marketData?.markets) setLocalData(marketData);
  }, [marketData]);

  const load = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/market-prices", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ investments }),
      });

      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.markets) {
        setLocalData(payload);
        onReload?.(payload);
        setMessage("Piyasa verileri güncellendi");
      } else {
        setMessage("Piyasa verisi alınamadı, mevcut liste korundu");
      }
    } catch (error) {
      console.log(error);
      setMessage("Piyasa verisi alınamadı, mevcut liste korundu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localData) load();
  }, []);

  const markets = localData?.markets || {};
  const distribution = distributionFrom(investments, investmentTotals);
  const totalDistribution = distribution.reduce((sum, item) => sum + item.value, 0);

  const rows = useMemo(() => {
    const q = normalize(query);
    const source =
      active === "tr"
        ? markets.turkishStocks || []
        : active === "us"
          ? markets.usStocks || []
          : active === "metals"
            ? markets.metals || []
            : active === "funds"
              ? markets.funds || []
              : markets.crypto || [];

    return source
      .filter((item) => {
        if (!q) return true;
        return normalize(`${item.symbol} ${item.name} ${item.category || ""} ${item.source || ""}`).includes(q);
      })
      .slice(0, 600);
  }, [active, query, markets]);

  return (
    <section className="panelCard" style={{ marginTop: 18 }}>
      <button type="button" className="panelHeader" onClick={() => setOpen((v) => !v)}>
        <div>
          <h2 className="gradientTitle">Canlı Piyasa Merkezi</h2>
          <p>Türk hisseleri, ABD hisseleri, kripto piyasası, altın/gümüş/metaller ve Türk fonları.</p>
          {message ? <p className="sectionDescription" style={{ marginTop: 6 }}>{message}</p> : null}
        </div>
        <div className="panelRight">
          <div className="panelTotal"><span>Veri Durumu</span><strong>{loading ? "Yükleniyor" : "Hazır"}</strong></div>
          <div className="toggleButton">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? (
        <div className="panelBody">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button type="button" className="premiumButton" onClick={load} disabled={loading}>{loading ? "Yükleniyor" : "Piyasayı Yenile"}</button>
          </div>

          <div className="marketTwoCol">
            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 24, padding: 18, background: "linear-gradient(145deg, rgba(15,23,42,.72), rgba(49,46,129,.34))" }}>
              <h3 style={{ margin: "0 0 8px", color: "#fff" }}>Portföy Dağılımı</h3>
              <p className="sectionDescription">Yatırım kalemlerinin toplam içindeki yüzdesel dağılımı.</p>
              <div style={{ width: 230, height: 230, borderRadius: "50%", margin: "20px auto", background: pieGradient(distribution), boxShadow: "0 22px 45px rgba(0,0,0,.35)", display: "grid", placeItems: "center" }}>
                <div style={{ width: 118, height: 118, borderRadius: "50%", background: "rgba(15,23,42,.92)", border: "1px solid rgba(255,255,255,.16)", display: "grid", placeItems: "center", textAlign: "center", color: "#fff", fontWeight: 900 }}>
                  <span style={{ display: "block", fontSize: 11, color: "#cbd5e1" }}>Toplam</span>
                  {trMoney(totalDistribution)}
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {distribution.length ? distribution.map((item) => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#e2e8f0", fontSize: 12 }}>
                    <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: item.color, marginRight: 7 }} />{item.label}</span>
                    <strong>{totalDistribution > 0 ? pct((item.value / totalDistribution) * 100) : "%0.00"}</strong>
                  </div>
                )) : <div className="emptyState"><strong>Dağılım için yatırım kaydı yok.</strong></div>}
              </div>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 24, padding: 18, background: "rgba(15,23,42,.54)", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <MarketTab active={active === "crypto"} onClick={() => setActive("crypto")} label={`Kripto (${markets.crypto?.length || 0})`} />
                <MarketTab active={active === "tr"} onClick={() => setActive("tr")} label={`Türk Hisseleri (${markets.turkishStocks?.length || 0})`} />
                <MarketTab active={active === "us"} onClick={() => setActive("us")} label={`ABD Hisseleri (${markets.usStocks?.length || 0})`} />
                <MarketTab active={active === "metals"} onClick={() => setActive("metals")} label={`Altın / Gümüş (${markets.metals?.length || 0})`} />
                <MarketTab active={active === "funds"} onClick={() => setActive("funds")} label={`Fonlar (${markets.funds?.length || 0})`} />
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sembol veya isim ara..."
                style={{ width: "100%", border: "1px solid rgba(255,255,255,.18)", background: "rgba(2,6,23,.62)", color: "#fff", borderRadius: 14, padding: "12px 14px", outline: "none", marginBottom: 12 }}
              />
              <MarketTable type={active} rows={rows} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MarketTab({ active, label, onClick }) {
  return <button type="button" onClick={onClick} style={{ border: "1px solid rgba(255,255,255,.18)", background: active ? "linear-gradient(135deg,#60a5fa,#8b5cf6)" : "rgba(2,6,23,.48)", color: "#fff", borderRadius: 14, padding: "10px 12px", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>{label}</button>;
}

function MarketTable({ rows, type }) {
  if (!rows.length) return <div className="emptyState"><strong>Veri bulunamadı.</strong><span>Piyasayı yenile veya arama metnini değiştir.</span></div>;

  return (
    <div style={{ maxHeight: 520, overflow: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,.10)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 12 }}>
        <thead style={{ position: "sticky", top: 0, background: "rgba(15,23,42,.96)", zIndex: 1 }}>
          <tr><Th>Sembol</Th><Th>İsim</Th><Th>Fiyat</Th><Th>Değişim</Th><Th>{type === "funds" ? "Tarih / Kaynak" : "Hacim / Market Cap"}</Th></tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const key = `${type}-${item.symbol || item.id}-${index}`;
            const currency = item.currency || (type === "tr" || type === "metals" || type === "funds" ? "TRY" : "USD");
            const price = type === "metals" ? item.priceTry : item.price;
            const volume = type === "crypto" ? (item.marketCap || item.volume) : item.volume;
            const changeValue = Number(item.changePercent || item.change24h || 0);

            return (
              <tr key={key} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <Td><strong style={{ color: "#fff" }}>{item.symbol}</strong>{item.portfolio ? <div style={{ color: "#86efac", fontSize: 10, fontWeight: 900 }}>Portföy</div> : null}</Td>
                <Td>{item.name || item.category || "-"}<div style={{ color: "#94a3b8", fontSize: 10 }}>{item.source || item.market || ""}</div></Td>
                <Td>{price ? trMoney(price, currency) : <span style={{ color: "#94a3b8" }}>Fiyat bekleniyor</span>}</Td>
                <Td><span style={{ color: changeValue >= 0 ? "#86efac" : "#fca5a5", fontWeight: 900 }}>{changeValue ? pct(changeValue) : "-"}</span></Td>
                <Td>{type === "funds" ? (item.date || item.source || "-") : volume ? compact(volume) : "-"}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "12px 10px", color: "#bfdbfe", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase" }}>{children}</th>;
}

function Td({ children }) {
  return <td style={{ padding: "11px 10px", verticalAlign: "top" }}>{children}</td>;
}

