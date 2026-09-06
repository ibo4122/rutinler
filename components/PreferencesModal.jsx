"use client";

import { useState } from "react";
import ModulePicker from "./ModulePicker";
import { DEFAULT_PREFERENCES } from "../lib/preferences";

// "Kisiselestir" penceresi: kullanici hangi bolumleri kullanacagini istedigi an
// degistirebilir. Kaydedene kadar degisiklikler uygulanmaz (iptal edilebilir).
export default function PreferencesModal({ prefs, onSave, onClose }) {
  const [taslak, setTaslak] = useState(prefs || DEFAULT_PREFERENCES);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900, background: "rgba(2,6,23,.78)",
        backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 20, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 100%)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 24,
          background: "linear-gradient(150deg, rgba(15,23,42,.97), rgba(49,46,129,.4))",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)", color: "#f8fafc", padding: "24px 22px",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>⚙️ Kişiselleştir</h2>
            <p style={{ color: "#94a3b8", fontSize: 12.5, margin: "5px 0 0", lineHeight: 1.55 }}>
              Kullanmadığın bölümleri kapat, paneli sadeleştir. Verilerin silinmez —
              bölümü tekrar açtığında her şey yerinde olur.
            </p>
          </div>
          <button type="button" className="ghostBtn" onClick={onClose}>Kapat</button>
        </div>

        <ModulePicker prefs={taslak} onChange={setTaslak} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          <button type="button" className="secondaryButton" onClick={() => setTaslak(DEFAULT_PREFERENCES)}>
            Hepsini Aç
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="secondaryButton" onClick={onClose}>Vazgeç</button>
            <button type="button" className="premiumButton" onClick={() => onSave(taslak)}>Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
