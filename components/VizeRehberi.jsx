"use client";

import { useMemo, useState } from "react";
import { ULKE_VIZELERI, DURUMLAR, VIZE_KAYNAK, VIZE_KONTROL, PASAPORT_NOTU, vizeBul } from "../lib/vize";
import { SEHIRLER } from "../lib/destinasyonlar";

// Vize Rehberi — ülke ülke giriş şartları (T.C. umuma mahsus pasaport).
// Şehir sayfalarındaki vize satırları da aynı kaynaktan (lib/vize.js) gelir;
// bilgi tek yerde tutulur, her yerde aynı görünür.

const sade = (s) => String(s || "").toLocaleLowerCase("tr")
  .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
const SUZGECLER = [
  { id: "hepsi", ad: "Tümü" },
  { id: "vizesiz", ad: "Vizesiz", test: (v) => v.durum === "muaf" || v.durum === "kimlik" },
  { id: "kimlik", ad: "Kimlikle girilen", test: (v) => v.durum === "kimlik" },
  { id: "kolay", ad: "e-Vize / kapıda", test: (v) => v.durum === "evize" || v.durum === "kapida" },
  { id: "gerekli", ad: "Vize gerekli", test: (v) => v.durum === "tabi" },
];

export default function VizeRehberi({ onSehir }) {
  const [arama, setArama] = useState("");
  const [suzgec, setSuzgec] = useState("hepsi");
  const [rehberdekiler, setRehberdekiler] = useState(false);

  // Rehberdeki şehirler ülkelerine göre (vize kaydından şehir sayfasına geçiş için).
  const sehirler = useMemo(() => {
    const m = new Map();
    for (const s of SEHIRLER) {
      const v = vizeBul(s.ulke);
      if (!v) continue;
      m.set(v.ulke, [...(m.get(v.ulke) || []), s]);
    }
    return m;
  }, []);
  const eksik = SEHIRLER.filter((s) => !vizeBul(s.ulke)).map((s) => s.ulke);

  const liste = useMemo(() => {
    const t = sade(arama.trim());
    const sz = SUZGECLER.find((x) => x.id === suzgec);
    return ULKE_VIZELERI
      .filter((v) => !sz.test || sz.test(v))
      .filter((v) => !rehberdekiler || sehirler.has(v.ulke))
      .filter((v) => !t || sade([v.ulke, ...(v.diger_adlar || []), ...(sehirler.get(v.ulke) || []).map((s) => s.ad)].join(" ")).includes(t))
      .sort((a, b) => a.ulke.localeCompare(b.ulke, "tr"));
  }, [arama, suzgec, rehberdekiler, sehirler]);

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <header style={{ border: "1px solid rgba(96,165,250,.35)", borderRadius: 20, padding: "18px 18px 16px", background: "linear-gradient(135deg, rgba(96,165,250,.16), rgba(2,6,23,.6))" }}>
        <div style={{ color: "#93c5fd", fontSize: 11, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" }}>🛂 Vize Rehberi</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "6px 0 8px" }}>Hangi ülkeye nasıl girilir?</h2>
        <p style={{ color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>{PASAPORT_NOTU}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5, margin: "10px 0 0" }}>
          Kaynak: <a href={VIZE_KAYNAK.url} target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd" }}>{VIZE_KAYNAK.ad}</a> · son kontrol {new Date(VIZE_KONTROL).toLocaleDateString("tr-TR")}.
          Kurallar sık değişir; biletini almadan önce bağlantıdan son durumu kontrol et.
        </p>
      </header>

      <div style={{ display: "grid", gap: 10 }}>
        <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ülke ya da şehir ara — Arjantin, Tokyo, Bali…"
          aria-label="Ülke ya da şehir ara"
          style={{ width: "100%", height: 48, borderRadius: 14, padding: "0 14px", background: "rgba(2,6,23,.55)", border: "1.5px solid rgba(148,163,184,.25)", color: "#fff", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {SUZGECLER.map((x) => (
            <button key={x.id} type="button" onClick={() => setSuzgec(x.id)} aria-pressed={suzgec === x.id}
              style={{ height: 34, padding: "0 12px", borderRadius: 99, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
                border: `1px solid ${suzgec === x.id ? "#60a5fa" : "rgba(148,163,184,.25)"}`, background: suzgec === x.id ? "rgba(96,165,250,.18)" : "rgba(2,6,23,.45)", color: suzgec === x.id ? "#fff" : "#cbd5e1" }}>
              {x.ad}
            </button>
          ))}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 12.5, fontWeight: 700, marginLeft: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={rehberdekiler} onChange={(e) => setRehberdekiler(e.target.checked)} /> Yalnız rehberdeki ülkeler
          </label>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{liste.length} ülke</div>
      </div>

      {liste.length ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 10 }}>
          {liste.map((v) => {
            const d = DURUMLAR[v.durum];
            const ss = sehirler.get(v.ulke) || [];
            return (
              <li key={v.ulke} style={{ border: `1px solid ${d.renk}40`, borderRadius: 16, padding: "13px 14px", background: "rgba(2,6,23,.5)", display: "grid", gap: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22 }} aria-hidden>{v.bayrak}</span>
                  <b style={{ color: "#fff", fontSize: 15.5, flex: 1, minWidth: 0 }}>{v.ulke}</b>
                  <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 900, color: d.renk, border: `1px solid ${d.renk}66`, background: `${d.renk}14`, whiteSpace: "nowrap" }}>
                    {d.ad}{v.sure && (v.durum === "muaf" || v.durum === "kimlik") ? ` · ${v.sure}` : ""}
                  </span>
                </div>
                <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.55 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 800 }}>Umuma mahsus (bordo): </span>{v.umuma}
                </div>
                {v.notlar.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.55 }}>
                    {v.notlar.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                ) : null}
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 800 }}>Hususi / hizmet / diplomatik: </span>{v.diger}
                </div>
                {v.dogrulanamadi ? (
                  <div style={{ color: "#fbbf24", fontSize: 12, fontWeight: 800 }}>⚠ Bazı ayrıntılar resmî kaynakta yazmıyor; seyahatten önce teyit et.</div>
                ) : null}
                {ss.length ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ss.map((s) => (
                      <button key={s.id} type="button" onClick={() => onSehir?.(s.id)}
                        style={{ height: 28, padding: "0 10px", borderRadius: 99, cursor: "pointer", border: "1px solid rgba(45,212,191,.35)", background: "rgba(45,212,191,.08)", color: "#5eead4", fontSize: 12, fontWeight: 800 }}>
                        {s.ad} rehberi →
                      </button>
                    ))}
                  </div>
                ) : null}
                <div style={{ color: "#64748b", fontSize: 11.5 }}>
                  <a href={v.kaynak?.url || VIZE_KAYNAK.url} target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd" }}>{v.kaynak?.ad || "Dışişleri Bakanlığı"}</a>
                  {v.kaynak ? <> · <a href={VIZE_KAYNAK.url} target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd" }}>Dışişleri</a></> : null}
                  {" · "}son kontrol {new Date(v.kontrol).toLocaleDateString("tr-TR")}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div style={{ border: "1px dashed rgba(148,163,184,.3)", borderRadius: 16, padding: 18, color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.6 }}>
          Aradığın ülke bu listede yok. Güncel bilgi için <a href={VIZE_KAYNAK.url} target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd" }}>Dışişleri Bakanlığı'nın ülke listesine</a> bak; tahmine dayalı bilgi göstermiyoruz.
        </div>
      )}

      {eksik.length ? (
        <p style={{ color: "#fbbf24", fontSize: 12 }}>Vize kaydı eksik ülkeler: {[...new Set(eksik)].join(", ")}</p>
      ) : null}
    </section>
  );
}
