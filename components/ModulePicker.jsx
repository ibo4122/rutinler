"use client";

import { TAB_MODULES, INVESTMENT_MODULES } from "../lib/preferences";

// Modul secim listesi. Hem karsilama akisinda hem "Kisiselestir" penceresinde
// ayni bilesen kullanilir; boylece iki yerde davranis birebir ayni kalir.

function Satir({ modul, acik, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(modul.id, !acik)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        border: `1px solid ${acik ? "rgba(96,165,250,.45)" : "rgba(255,255,255,.10)"}`,
        background: acik ? "linear-gradient(150deg, rgba(96,165,250,.16), rgba(139,92,246,.08))" : "rgba(2,6,23,.4)",
        borderRadius: 14, padding: "11px 13px", cursor: "pointer", color: "#fff",
      }}
    >
      <span style={{ fontSize: 20, flex: "0 0 auto" }}>{modul.icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontWeight: 800, fontSize: 13.5 }}>{modul.label}</span>
        <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 2, lineHeight: 1.45 }}>{modul.desc}</span>
      </span>
      {/* Anahtar gorunumu */}
      <span style={{
        flex: "0 0 auto", width: 40, height: 22, borderRadius: 999, position: "relative",
        background: acik ? "linear-gradient(135deg,#60a5fa,#8b5cf6)" : "rgba(255,255,255,.14)",
        transition: "background .2s ease",
      }}>
        <span style={{
          position: "absolute", top: 3, left: acik ? 21 : 3, width: 16, height: 16, borderRadius: 999,
          background: "#fff", transition: "left .2s ease",
        }} />
      </span>
    </button>
  );
}

export default function ModulePicker({ prefs, onChange, compact = false }) {
  // Fonksiyonel guncelleme: art arda hizli tiklamada bir onceki degisiklik kaybolmasin.
  const setTab = (id, value) => onChange((cur) => ({ ...cur, tabs: { ...cur.tabs, [id]: value } }));
  const setInv = (id, value) => onChange((cur) => ({ ...cur, inv: { ...cur.inv, [id]: value } }));
  const yatirimAcik = prefs?.tabs?.investments !== false;

  return (
    <div style={{ display: "grid", gap: compact ? 14 : 18 }}>
      <div>
        <div style={{ color: "#cbd5e1", fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
          Bölümler
        </div>
        <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(255px, 1fr))", gap: 8 }}>
          {TAB_MODULES.map((m) => (
            <Satir key={m.id} modul={m} acik={prefs?.tabs?.[m.id] !== false} onToggle={setTab} />
          ))}
        </div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>
          Genel Bakış her zaman açıktır. Kapattığın bölümler menüde görünmez; istediğin an geri açabilirsin.
        </div>
      </div>

      {yatirimAcik ? (
        <div>
          <div style={{ color: "#cbd5e1", fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
            Yatırımlar içinde neler olsun?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(255px, 1fr))", gap: 8 }}>
            {INVESTMENT_MODULES.map((m) => (
              <Satir key={m.id} modul={m} acik={prefs?.inv?.[m.id] !== false} onToggle={setInv} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
