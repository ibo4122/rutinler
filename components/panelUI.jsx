"use client";

// Paylaşılan panel parçaları. FinancialGoals'daki görsel dil burada toplandı ki
// yeni alanlar (Borç Planı, Tatil Planlayıcı) aynı yapıyı sıfırdan yazmasın.
// Hepsi inline style — proje genelinde Tailwind kullanılmıyor.

// DİKKAT: Sayı gelirse olduğu gibi döner. Metin ayrıştırma kuralı ("1.996,80")
// binlik ayracı olan noktayı siler; bu kural bir JS ondalığına (1996.8)
// uygulanırsa sayıyı 19968'e çevirip her hesabı bozar.
export const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const x = Number(String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};

export const yeniId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const tl = (v) => "₺" + Math.round(num(v)).toLocaleString("tr-TR");

// Türkçe yüzde: ondalık ayracı virgüldür.
export const yzd = (v, basamak = 1) => "%" + num(v).toFixed(basamak).replace(".", ",");

// minWidth: 0 — dar ekranda input'un doğal genişliği ızgarayı taşırıyor.
export const satirInput = {
  width: "100%", minWidth: 0, background: "rgba(2,6,23,.55)",
  border: "1px solid rgba(255,255,255,.12)", borderRadius: 9,
  padding: "7px 9px", color: "#e2e8f0", fontSize: 13.5, outline: "none",
};

export const kucukBtn = {
  flex: "0 0 auto", width: 26, height: 26, borderRadius: 8, cursor: "pointer",
  display: "grid", placeItems: "center", fontSize: 14, lineHeight: 1,
};

export function Kutu({ etiket, deger, renk = "#93c5fd", alt }) {
  return (
    <div style={{ border: `1px solid ${renk}3a`, borderRadius: 14, padding: "11px 13px", background: `${renk}10`, minWidth: 0 }}>
      <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", lineHeight: 1.3 }}>{etiket}</div>
      <div style={{ color: renk, fontSize: 20, fontWeight: 900, marginTop: 4, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{deger}</div>
      {alt ? <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{alt}</div> : null}
    </div>
  );
}

export function KutuIzgara({ children, min = 170 }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 11, marginBottom: 14 }}>
      {children}
    </section>
  );
}

export function Bolum({ baslik, ikon, aciklama, renk = "#60a5fa", acik = true, onToggle, sag, children }) {
  return (
    <section style={{ border: `1px solid ${renk}33`, borderRadius: 18, overflow: "hidden", background: "rgba(2,6,23,.3)", marginBottom: 14 }}>
      <header
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
          padding: "12px 15px", background: `linear-gradient(120deg, ${renk}30, ${renk}10)`,
          borderBottom: acik ? `1px solid ${renk}33` : "none", cursor: onToggle ? "pointer" : "default",
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 15.5 }}>{ikon} {baslik}</span>
          {aciklama ? <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 3, lineHeight: 1.45 }}>{aciklama}</span> : null}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
          {sag}
          {onToggle ? <span style={{ color: renk, fontWeight: 900, fontSize: 18 }}>{acik ? "−" : "+"}</span> : null}
        </span>
      </header>
      {acik ? <div style={{ padding: "14px 15px", display: "grid", gap: 13 }}>{children}</div> : null}
    </section>
  );
}

export function Tablo({ basliklar, satirlar, renk = "#93c5fd", not, minGenislik = 460 }) {
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, color: "#e2e8f0", minWidth: minGenislik }}>
          <thead>
            <tr>
              {basliklar.map((b, i) => (
                <th key={i} style={{
                  textAlign: i === 0 ? "left" : "right", padding: "7px 10px", color: renk,
                  fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em",
                  borderBottom: `1px solid ${renk}33`, whiteSpace: "nowrap",
                }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s, i) => (
              <tr key={i} style={{
                background: s.vurgu ? "rgba(255,255,255,.07)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,.05)",
                fontWeight: s.kalin ? 800 : 400,
              }}>
                {s.hucreler.map((h, j) => (
                  <td key={j} style={{
                    textAlign: j === 0 ? "left" : "right", padding: "8px 10px",
                    color: j === 0 ? "#e2e8f0" : s.renk || "#fff",
                    whiteSpace: j === 0 ? "normal" : "nowrap",
                  }}>{h}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {not ? <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 7, lineHeight: 1.5 }}>{not}</div> : null}
    </div>
  );
}

export function Alan({ label, hint, children }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 5 }}>{label}</span>
      {children}
      {hint ? <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>{hint}</span> : null}
    </label>
  );
}

export function Izgara({ children, min = 150 }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 11 }}>{children}</div>;
}

// Uyarı / bilgi şeridi. tur: "uyari" | "bilgi" | "iyi"
export function Not({ tur = "bilgi", children }) {
  const renk = tur === "uyari" ? "#fbbf24" : tur === "iyi" ? "#34d399" : "#60a5fa";
  return (
    <div style={{
      border: `1px solid ${renk}44`, background: `${renk}12`, borderRadius: 12,
      padding: "10px 13px", color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

// Yatay sekme şeridi (kategori / ülke seçimi).
export function Sekmeler({ secenekler, aktif, onSec, renk = "#60a5fa" }) {
  return (
    <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 13 }}>
      {secenekler.map((s) => {
        const secili = s.id === aktif;
        const c = s.renk || renk;
        return (
          <button key={s.id} type="button" onClick={() => onSec(s.id)}
            style={{
              flex: "0 0 auto", display: "flex", alignItems: "center", gap: 7,
              padding: "9px 14px", borderRadius: 12, cursor: "pointer", fontSize: 13.5, fontWeight: 800,
              border: `1px solid ${secili ? c + "88" : "rgba(148,163,184,.22)"}`,
              background: secili ? `linear-gradient(120deg, ${c}38, ${c}14)` : "rgba(2,6,23,.4)",
              color: secili ? "#fff" : "#94a3b8", whiteSpace: "nowrap",
            }}>
            <span style={{ fontSize: 15 }}>{s.ikon}</span>{s.ad}
          </button>
        );
      })}
    </div>
  );
}

export function BosDurum({ baslik, aciklama, aksiyon }) {
  return (
    <div style={{
      border: "1px dashed rgba(148,163,184,.28)", borderRadius: 16, padding: "26px 20px",
      textAlign: "center", background: "rgba(2,6,23,.3)",
    }}>
      <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 14.5 }}>{baslik}</div>
      {aciklama ? <div style={{ color: "#94a3b8", fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>{aciklama}</div> : null}
      {aksiyon ? <div style={{ marginTop: 14 }}>{aksiyon}</div> : null}
    </div>
  );
}

export function Buton({ onClick, renk = "#60a5fa", dolu = false, children, title }) {
  return (
    <button type="button" onClick={onClick} title={title}
      style={{
        border: `1px solid ${renk}66`, borderRadius: 11, padding: "8px 14px", cursor: "pointer",
        background: dolu ? `linear-gradient(120deg, ${renk}, ${renk}bb)` : `${renk}16`,
        color: dolu ? "#04121f" : renk, fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap",
      }}>
      {children}
    </button>
  );
}
