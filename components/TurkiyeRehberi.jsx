"use client";

import { useMemo, useState } from "react";
import { BOLGELER_TR, ILLER, YER_TURLERI, ilBul, bolgeBul, bolgeIlleri } from "../lib/turkiye";
import { TURLAR, TUR_SEGMENTLERI, YAKIT_VARSAYILAN, turBul, turunIlleri, turKm, ilinTurlari } from "../lib/turkiyeTurlari";
import { num, tl, satirInput, Kutu, KutuIzgara, Tablo, Alan, Izgara, Not } from "./panelUI";

// Türkiye Rehberi.
//
// İki giriş kapısı var çünkü insanlar Türkiye'yi iki farklı şekilde gezer:
//   BÖLGESEL TUR — "Doğuya gidelim" der, birkaç ili bağlayan bir rota arar.
//   İL — "Mardin'e gidelim" der, tek bir şehrin dosyasına bakar.
// İkisi birbirine bağlı: il sayfası o ili içeren turları gösterir, tur sayfası
// rotadaki her ile tek tıkla gider.
//
// Kimlik rengi bayrak kırmızısı — Keşfet (turkuaz) ve Defter (amber) ile
// karışmasın diye.

const KIRMIZI = "#e11d48";

const sade = (s) =>
  String(s || "").toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a");

export default function TurkiyeRehberi({ planlar, hayaller, onDefter, acilis }) {
  // Defterden "Rehberde aç" denince doğrudan o il/tur sayfasıyla başlar.
  const [gorunum, setGorunum] = useState(() => ({
    ekran: acilis?.ekran || "liste",
    sekme: acilis?.ekran === "il" ? "iller" : "turlar",
    id: acilis?.id || null,
  }));
  const git = (ekran, id = null) => { setGorunum((g) => ({ ...g, ekran, id })); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  const defterDurumu = (ref) => {
    const eslesir = (k) => (ref.ilId && k.ilId === ref.ilId) || (ref.turId && k.turId === ref.turId);
    const p = planlar.find(eslesir);
    if (p) return p.durum === "gidildi" ? "gidildi" : "plan";
    if (hayaller.some(eslesir)) return "hayal";
    return null;
  };

  if (gorunum.ekran === "il" && gorunum.id) {
    return <IlSayfasi il={ilBul(gorunum.id)} onGeri={() => git("liste")} onTur={(id) => git("tur", id)}
      durum={defterDurumu({ ilId: gorunum.id })} onDefter={onDefter} />;
  }
  if (gorunum.ekran === "tur" && gorunum.id) {
    return <TurSayfasi tur={turBul(gorunum.id)} onGeri={() => git("liste")} onIl={(id) => git("il", id)}
      durum={defterDurumu({ turId: gorunum.id })} onDefter={onDefter} />;
  }

  return (
    <section>
      <RehberBasligi />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "turlar", ad: "Bölgesel Turlar", ikon: "🗺️", alt: `${TURLAR.length} rota · 7 bölge` },
          { id: "iller", ad: "81 İl", ikon: "🏙️", alt: "il il gezilecek yerler" },
        ].map((s) => {
          const aktif = gorunum.sekme === s.id;
          return (
            <button key={s.id} type="button" onClick={() => setGorunum((g) => ({ ...g, sekme: s.id }))}
              style={{
                flex: "1 1 220px", textAlign: "left", padding: "13px 16px", borderRadius: 15, cursor: "pointer",
                border: `1.5px solid ${aktif ? KIRMIZI + "aa" : "rgba(148,163,184,.2)"}`,
                background: aktif ? `linear-gradient(120deg, ${KIRMIZI}33, ${KIRMIZI}0d)` : "rgba(2,6,23,.45)",
              }}>
              <div style={{ color: aktif ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 15.5 }}>{s.ikon} {s.ad}</div>
              <div style={{ color: aktif ? "#fda4af" : "#64748b", fontSize: 11.5, marginTop: 3, fontWeight: 700 }}>{s.alt}</div>
            </button>
          );
        })}
      </div>

      {gorunum.sekme === "turlar"
        ? <TurListesi onTur={(id) => git("tur", id)} defterDurumu={defterDurumu} />
        : <IlListesi onIl={(id) => git("il", id)} defterDurumu={defterDurumu} />}
    </section>
  );
}

function RehberBasligi() {
  const kolaj = ["nevsehir", "denizli", "trabzon", "kars", "mardin"].map((id) => ilBul(id)?.gorseller?.[0]).filter(Boolean);
  return (
    <header style={{ position: "relative", overflow: "hidden", borderRadius: 22, marginBottom: 16, border: `1px solid ${KIRMIZI}55`, minHeight: 210 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {kolaj.map((g, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0 }}>
            <img src={g} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(20,4,8,.97) 20%, rgba(20,4,8,.84) 48%, rgba(225,29,72,.38) 82%, rgba(20,4,8,.6))" }} />
      <div style={{ position: "relative", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 20, borderRadius: 4, background: KIRMIZI, display: "grid", placeItems: "center", color: "#fff", fontSize: 12, fontWeight: 900 }}>☾★</span>
          <span style={{ color: "#fda4af", fontSize: 11.5, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>Türkiye Rehberi</span>
        </div>
        <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "10px 0 0", lineHeight: 1.15 }}>
          81 il, 7 bölge, 10 rota
        </h2>
        <p style={{ color: "#e2e8f0", fontSize: 13.5, margin: "10px 0 0", lineHeight: 1.65, maxWidth: 560 }}>
          Bir bölgeyi baştan sona gezmek istiyorsan <strong style={{ color: "#fff" }}>bölgesel turlara</strong>, tek bir şehre
          gidiyorsan <strong style={{ color: "#fff" }}>il sayfalarına</strong> bak. Her rota gün gün kurgulandı; her ilin
          gezilecek yerleri, lezzetleri ve en iyi zamanı var.
        </p>
      </div>
    </header>
  );
}

function DurumRozeti({ durum, kucuk }) {
  if (!durum) return null;
  const s = { gidildi: ["✓ Gidildi", "#34d399"], plan: ["📍 Planlı", "#fbbf24"], hayal: ["✨ Hayal", "#c084fc"] }[durum];
  return (
    <span style={{
      background: s[1], color: "#0b0b0b", borderRadius: 999, padding: kucuk ? "2px 8px" : "3px 10px",
      fontSize: kucuk ? 10 : 11, fontWeight: 900, whiteSpace: "nowrap",
    }}>{s[0]}</span>
  );
}

// ======================= TUR LİSTESİ ========================================

function TurListesi({ onTur, defterDurumu }) {
  const [bolge, setBolge] = useState("hepsi");
  const liste = TURLAR.filter((t) => bolge === "hepsi" || t.bolgeler.includes(bolge));
  return (
    <>
      <BolgeSeridi aktif={bolge} onSec={setBolge} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
        {liste.map((t) => {
          const iller = turunIlleri(t);
          const gorsel = iller.map((x) => x.gorseller?.[0]).filter(Boolean).slice(0, 3);
          const durum = defterDurumu({ turId: t.id });
          return (
            <button key={t.id} type="button" onClick={() => onTur(t.id)}
              style={{
                display: "block", textAlign: "left", padding: 0, cursor: "pointer", borderRadius: 18, overflow: "hidden",
                border: `1px solid ${t.renk}55`, background: "rgba(2,6,23,.5)",
              }}>
              <div style={{ position: "relative", height: 150, display: "flex" }}>
                {gorsel.map((g, i) => (
                  <img key={i} src={g} alt="" loading="lazy" style={{ flex: 1, minWidth: 0, objectFit: "cover", display: "block" }} />
                ))}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${t.renk}22, rgba(2,6,23,.92))` }} />
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                  <span style={{ background: t.renk, color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 900 }}>
                    {t.gunler.length} gün
                  </span>
                  <DurumRozeti durum={durum} />
                </div>
                <div style={{ position: "absolute", left: 13, right: 13, bottom: 11 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>{t.ikon} {t.ad}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 11.5, marginTop: 3 }}>{t.alt}</div>
                </div>
              </div>
              <div style={{ padding: "12px 13px" }}>
                <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.55, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.ozet}</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {t.bolgeler.map((b) => {
                    const bb = bolgeBul(b);
                    return <Cip key={b} renk={bb.renk}>{bb.ikon} {bb.ad}</Cip>;
                  })}
                  <Cip>🚗 {turKm(t).toLocaleString("tr-TR")} km</Cip>
                  <Cip>🏙️ {iller.length} il</Cip>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function BolgeSeridi({ aktif, onSec }) {
  return (
    <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
      {[{ id: "hepsi", ad: "Tüm bölgeler", ikon: "🇹🇷", renk: KIRMIZI }, ...BOLGELER_TR].map((b) => {
        const s = b.id === aktif;
        return (
          <button key={b.id} type="button" onClick={() => onSec(b.id)}
            style={{
              flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap",
              border: `1px solid ${s ? b.renk + "aa" : "rgba(148,163,184,.22)"}`,
              background: s ? `${b.renk}2e` : "rgba(2,6,23,.4)", color: s ? "#fff" : "#94a3b8",
            }}>{b.ikon} {b.ad}</button>
        );
      })}
    </div>
  );
}

function Cip({ children, renk = "#94a3b8" }) {
  return (
    <span style={{
      border: `1px solid ${renk}44`, background: `${renk}14`, color: renk,
      borderRadius: 999, padding: "2px 9px", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ======================= İL LİSTESİ =========================================

function IlListesi({ onIl, defterDurumu }) {
  const [bolge, setBolge] = useState("hepsi");
  const [arama, setArama] = useState("");
  const t = sade(arama).trim();
  const gruplar = (bolge === "hepsi" ? BOLGELER_TR : BOLGELER_TR.filter((b) => b.id === bolge))
    .map((b) => ({ b, iller: bolgeIlleri(b.id).filter((i) => !t || sade(i.ad).includes(t) || String(i.plaka).padStart(2, "0") === t.padStart(2, "0") || i.yerler.some((y) => sade(y.ad).includes(t))) }))
    .filter((g) => g.iller.length);

  return (
    <>
      <input value={arama} placeholder="🔍 İl, plaka ya da gezilecek yer ara — örn: Mardin, 36, Sümela"
        onChange={(e) => setArama(e.target.value)}
        style={{ ...satirInput, height: 46, fontSize: 14.5, borderRadius: 13, marginBottom: 12 }} />
      <BolgeSeridi aktif={bolge} onSec={setBolge} />

      {gruplar.map(({ b, iller }) => (
        <section key={b.id} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 900 }}>
              <span style={{ color: b.renk }}>{b.ikon}</span> {b.ad}
            </h3>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{iller.length} il</span>
            <span style={{ flex: "1 1 100%", color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>{b.ozet}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: 11 }}>
            {iller.map((i) => (
              <IlKarti key={i.id} il={i} renk={b.renk} durum={defterDurumu({ ilId: i.id })} onAc={() => onIl(i.id)} />
            ))}
          </div>
        </section>
      ))}
      {!gruplar.length ? <Not tur="uyari">"{arama}" ile eşleşen il ya da yer bulunamadı.</Not> : null}
    </>
  );
}

function IlKarti({ il, renk, durum, onAc }) {
  return (
    <button type="button" onClick={onAc}
      style={{
        display: "block", textAlign: "left", padding: 0, cursor: "pointer", borderRadius: 15, overflow: "hidden",
        border: `1px solid ${durum === "gidildi" ? "#34d39988" : renk + "40"}`, background: "rgba(2,6,23,.5)",
      }}>
      <div style={{ position: "relative", height: 112, background: `linear-gradient(135deg, ${renk}66, ${renk}18)` }}>
        {il.gorseller[0] ? (
          <img src={il.gorseller[0]} alt={il.ad} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#ffffff55", fontSize: 46, fontWeight: 900 }}>
            {String(il.plaka).padStart(2, "0")}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(2,6,23,.9))" }} />
        <span style={{
          position: "absolute", top: 8, left: 8, background: "#fff", color: "#111", borderRadius: 6,
          padding: "2px 7px", fontSize: 11, fontWeight: 900, letterSpacing: ".05em", border: `2px solid ${renk}`,
        }}>{String(il.plaka).padStart(2, "0")}</span>
        {durum ? <span style={{ position: "absolute", top: 8, right: 8 }}><DurumRozeti durum={durum} kucuk /></span> : null}
        <span style={{ position: "absolute", left: 10, bottom: 8, color: "#fff", fontWeight: 900, fontSize: 15.5 }}>{il.ad}</span>
      </div>
      <div style={{ padding: "9px 11px 11px" }}>
        <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 33 }}>
          {il.yerler.slice(0, 3).map((y) => y.ad).join(" · ")}
        </div>
        <div style={{ color: renk, fontSize: 11, fontWeight: 800, marginTop: 6 }}>📅 {il.gun} gün önerilir</div>
      </div>
    </button>
  );
}

// ======================= DEFTER DÜĞMELERİ ===================================

function DefterButonlari({ refObj, durum, onDefter, tarihli, gun }) {
  const [tarih, setTarih] = useState("");
  const [bildirim, setBildirim] = useState("");
  const ekle = (tur) => {
    const bitis = tarih && gun ? (() => { const d = new Date(tarih + "T12:00:00"); d.setDate(d.getDate() + gun - 1); return d.toISOString().slice(0, 10); })() : "";
    onDefter(refObj, tur, { baslangic: tarih, bitis, gun });
    setBildirim(tur === "gidildi" ? "Defterine ✓ gidildi olarak işlendi." : tur === "plan" ? "Planlanan seyahatlerine eklendi." : "Hayal listene eklendi.");
    setTimeout(() => setBildirim(""), 3500);
  };

  if (durum) {
    return (
      <Not tur="iyi">
        Bu {refObj.turId ? "rota" : "il"} Seyahat Defteri'nde: <strong>{durum === "gidildi" ? "✓ gidildi" : durum === "plan" ? "📍 planlandı" : "✨ hayal listesinde"}</strong>.
        Düzenlemek için <strong>Seyahat Defterim</strong> sekmesine geç.
      </Not>
    );
  }

  const btn = (renk, metin) => ({
    flex: "1 1 160px", height: 46, borderRadius: 13, cursor: "pointer", border: `1px solid ${renk}77`,
    background: `linear-gradient(120deg, ${renk}33, ${renk}12)`, color: "#fff", fontSize: 13.5, fontWeight: 900,
  });

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {tarihli ? (
        <Alan label="Ne zaman? (opsiyonel)" hint="Planlarken ya da gittiğin tarihi işlerken kullanılır">
          <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...satirInput, maxWidth: 220 }} />
        </Alan>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => ekle("plan")} style={btn("#fbbf24")}>📍 Planla</button>
        <button type="button" onClick={() => ekle("gidildi")} style={btn("#34d399")}>✓ Gittim</button>
        <button type="button" onClick={() => ekle("hayal")} style={btn("#c084fc")}>✨ Hayal listeme ekle</button>
      </div>
      {bildirim ? <div style={{ color: "#6ee7b7", fontSize: 12.5, fontWeight: 700 }}>{bildirim}</div> : null}
    </div>
  );
}

// ======================= İL SAYFASI =========================================

function IlSayfasi({ il, onGeri, onTur, durum, onDefter }) {
  const [heroIdx, setHeroIdx] = useState(0);
  if (!il) return null;
  const b = bolgeBul(il.bolge);
  const turlar = ilinTurlari(il.id);
  const turGruplari = Object.entries(YER_TURLERI)
    .map(([id, t]) => ({ id, t, yerler: il.yerler.filter((y) => y.tur === id) }))
    .filter((g) => g.yerler.length);

  return (
    <section>
      <GeriButonu onClick={onGeri}>← Türkiye Rehberi</GeriButonu>

      <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", marginBottom: 14, border: `1px solid ${b.renk}55`, background: `linear-gradient(135deg, ${b.renk}55, ${b.renk}12)` }}>
        <div style={{ position: "relative", height: 290 }}>
          {il.gorseller[heroIdx] ? (
            <img src={il.gorseller[heroIdx]} alt={il.ad} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#ffffff33", fontSize: 120, fontWeight: 900 }}>{String(il.plaka).padStart(2, "0")}</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,6,23,.1), rgba(2,6,23,.35) 45%, rgba(2,6,23,.95))" }} />
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
              <span style={{ background: "#fff", color: "#111", borderRadius: 7, padding: "3px 10px", fontSize: 16, fontWeight: 900, letterSpacing: ".06em", border: `3px solid ${b.renk}` }}>
                {String(il.plaka).padStart(2, "0")}
              </span>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 32, lineHeight: 1.05 }}>{il.ad}</span>
              <DurumRozeti durum={durum} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              <Cip renk={b.renk}>{b.ikon} {b.ad}</Cip>
              <Cip>📅 {il.gun} gün önerilir</Cip>
              <Cip>📍 {il.yerler.length} gezilecek yer</Cip>
            </div>
          </div>
        </div>
        {il.gorseller.length > 1 ? (
          <div style={{ display: "flex", gap: 7, padding: "10px 12px", background: "rgba(2,6,23,.6)" }}>
            {il.gorseller.map((g, i) => (
              <button key={g} type="button" onClick={() => setHeroIdx(i)}
                style={{ width: 84, height: 56, borderRadius: 9, overflow: "hidden", cursor: "pointer", padding: 0, border: `2px solid ${i === heroIdx ? b.renk : "transparent"}`, opacity: i === heroIdx ? 1 : 0.6 }}>
                <img src={g} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 13, marginBottom: 14 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 17, padding: "15px 16px", background: "rgba(2,6,23,.4)" }}>
          <p style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{il.ozet}</p>
          <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>En iyi zaman</div>
            <div style={{ color: "#cbd5e1", fontSize: 12.5, marginTop: 3 }}>{il.zaman}</div>
          </div>
        </div>
        {il.lezzet.length ? (
          <div style={{ border: "1px solid rgba(251,146,60,.3)", borderRadius: 17, padding: "15px 16px", background: "rgba(251,146,60,.07)" }}>
            <div style={{ color: "#fb923c", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>🍽️ Mutlaka tat</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {il.lezzet.map((l) => (
                <span key={l} style={{ border: "1px solid rgba(251,146,60,.35)", background: "rgba(251,146,60,.12)", color: "#fed7aa", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 700 }}>{l}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {il.not ? <div style={{ marginBottom: 14 }}><Not tur="uyari">{il.not}</Not></div> : null}

      <Kart baslik="Gezilecek Yerler" ikon="📍" renk={b.renk} aciklama="Türüne göre gruplandı.">
        <div style={{ display: "grid", gap: 14 }}>
          {turGruplari.map(({ id, t, yerler }) => (
            <div key={id}>
              <div style={{ color: t.renk, fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 7 }}>
                {t.ikon} {t.ad}
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {yerler.map((y) => (
                  <div key={y.ad} style={{ display: "flex", gap: 11, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.renk}2e`, background: `${t.renk}0a` }}>
                    <span style={{ fontSize: 17, flex: "0 0 auto" }}>{t.ikon}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", color: "#fff", fontSize: 13.5 }}>{y.ad}</strong>
                      <span style={{ display: "block", color: "#94a3b8", fontSize: 12, marginTop: 2, lineHeight: 1.55 }}>{y.not}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Kart>

      {turlar.length ? (
        <Kart baslik="Bu ili içeren rotalar" ikon="🗺️" renk={KIRMIZI} aciklama="Tek il yerine bölgeyi gezmek istersen.">
          <div style={{ display: "grid", gap: 8 }}>
            {turlar.map((t) => (
              <button key={t.id} type="button" onClick={() => onTur(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "11px 13px", borderRadius: 13, cursor: "pointer", border: `1px solid ${t.renk}55`, background: `${t.renk}12` }}>
                <span style={{ fontSize: 20 }}>{t.ikon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#fff", fontSize: 14 }}>{t.ad}</strong>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 2 }}>{t.alt} · {t.gunler.length} gün</span>
                </span>
                <span style={{ color: t.renk, fontWeight: 900, fontSize: 12.5 }}>Rotayı aç →</span>
              </button>
            ))}
          </div>
        </Kart>
      ) : null}

      <Kart baslik="Seyahat Defterime" ikon="📔" renk="#fbbf24" aciklama="Bu ili planla, gittim diye işaretle ya da hayal listene koy.">
        <DefterButonlari refObj={{ ilId: il.id }} durum={durum} onDefter={onDefter} tarihli gun={il.gun} />
      </Kart>
    </section>
  );
}

// ======================= TUR SAYFASI ========================================

function TurSayfasi({ tur, onGeri, onIl, durum, onDefter }) {
  const [kisi, setKisi] = useState("2");
  const [segment, setSegment] = useState("konfor");
  const [aracla, setAracla] = useState(true);
  const [tuketim, setTuketim] = useState(String(YAKIT_VARSAYILAN.tuketim));
  const [litre, setLitre] = useState(String(YAKIT_VARSAYILAN.litre));
  const [acikGun, setAcikGun] = useState(1);

  // Hook'lar koşulsuz çağrılmalı; tur yoksa hesaplar boş kalır, aşağıda erken dönülür.
  const iller = tur ? turunIlleri(tur) : [];
  const km = tur ? turKm(tur) : 0;
  const gun = tur ? tur.gunler.length : 0;
  const kolaj = iller.map((x) => x.gorseller?.[0]).filter(Boolean).slice(0, 4);

  const butce = useMemo(() => {
    const k = Math.max(1, Math.round(num(kisi) || 1));
    const seg = TUR_SEGMENTLERI.find((s) => s.id === segment) || TUR_SEGMENTLERI[1];
    const gunluk = seg.kisiGun * (tur?.fiyatCarpani || 1);
    const konaklamaYemek = gunluk * gun * k;
    const arac = Math.ceil(k / 4);
    const yakit = aracla ? (km / 100) * num(tuketim) * num(litre) * arac : 0;
    const pay = (konaklamaYemek + yakit) * 0.1;
    const toplam = konaklamaYemek + yakit + pay;
    return { k, seg, gunluk, konaklamaYemek, arac, yakit, pay, toplam, kisiBasi: toplam / k };
  }, [kisi, segment, aracla, tuketim, litre, tur, km, gun]);

  if (!tur) return null;

  return (
    <section>
      <GeriButonu onClick={onGeri}>← Türkiye Rehberi</GeriButonu>

      <header style={{ position: "relative", borderRadius: 22, overflow: "hidden", marginBottom: 14, border: `1px solid ${tur.renk}66`, minHeight: 280 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {kolaj.map((g, i) => <img key={i} src={g} alt="" loading="lazy" style={{ flex: 1, minWidth: 0, objectFit: "cover", display: "block" }} />)}
        </div>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${tur.renk}30, rgba(2,6,23,.55) 40%, rgba(2,6,23,.96))` }} />
        <div style={{ position: "relative", padding: "22px 20px", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 280 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 9 }}>
            {tur.bolgeler.map((x) => { const bb = bolgeBul(x); return <Cip key={x} renk={bb.renk}>{bb.ikon} {bb.ad}</Cip>; })}
            <DurumRozeti durum={durum} />
          </div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 30, lineHeight: 1.1 }}>{tur.ikon} {tur.ad}</div>
          <div style={{ color: "#cbd5e1", fontSize: 13.5, marginTop: 6 }}>{tur.alt}</div>
        </div>
      </header>

      <KutuIzgara min={150}>
        <Kutu etiket="Süre" deger={`${gun} gün`} renk={tur.renk} alt={`${iller.length} il`} />
        <Kutu etiket="Yol" deger={`${km.toLocaleString("tr-TR")} km`} renk="#60a5fa" alt="Rota boyunca araçla" />
        <Kutu etiket="En iyi zaman" deger={tur.enIyiZaman.split(";")[0]} renk="#34d399" alt={tur.enIyiZaman.includes(";") ? tur.enIyiZaman.split(";")[1].trim() : ""} />
        <Kutu etiket="Ulaşım" deger={tur.ulasim.split(";")[0]} renk="#fbbf24" alt={tur.ulasim.includes(";") ? tur.ulasim.split(";")[1].trim() : ""} />
      </KutuIzgara>

      <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 17, padding: "15px 16px", background: "rgba(2,6,23,.4)", marginBottom: 14 }}>
        <p style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{tur.ozet}</p>
      </div>

      {/* Rota şeridi */}
      <Kart baslik="Rota" ikon="🧭" renk={tur.renk} aciklama="Bir ile tıkla, o ilin tüm gezilecek yerlerini aç.">
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {iller.map((i, idx) => (
            <span key={i.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button type="button" onClick={() => onIl(i.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px 7px 7px", borderRadius: 999, cursor: "pointer", border: `1px solid ${tur.renk}66`, background: `${tur.renk}18`, color: "#fff", fontSize: 13, fontWeight: 800 }}>
                <span style={{ background: "#fff", color: "#111", borderRadius: 5, padding: "1px 6px", fontSize: 10.5, fontWeight: 900 }}>{String(i.plaka).padStart(2, "0")}</span>
                {i.ad}
              </button>
              {idx < iller.length - 1 ? <span style={{ color: tur.renk, fontWeight: 900 }}>→</span> : null}
            </span>
          ))}
        </div>
      </Kart>

      {/* Gün gün */}
      <Kart baslik={`${gun} Günlük Program`} ikon="🗓️" renk={tur.renk} aciklama="Her gün hangi şehirde, ne yapılır, nerede kalınır.">
        <div style={{ display: "grid", gap: 9 }}>
          {tur.gunler.map((gg) => {
            const ilx = ilBul(gg.il);
            const acik = acikGun === gg.gun;
            return (
              <div key={gg.gun} style={{ border: `1px solid ${tur.renk}33`, borderRadius: 15, overflow: "hidden", background: `${tur.renk}08` }}>
                <button type="button" onClick={() => setAcikGun(acik ? null : gg.gun)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", cursor: "pointer", border: "none", textAlign: "left", background: `linear-gradient(120deg, ${tur.renk}26, ${tur.renk}08)` }}>
                  <span style={{ flex: "0 0 auto", width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center", background: tur.renk, color: "#fff", fontWeight: 900, fontSize: 14 }}>{gg.gun}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 14.5 }}>{gg.baslik}</span>
                    <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 2 }}>
                      {ilx?.ad}{gg.km ? ` · ${gg.km} km yol` : ""}{gg.konaklama && gg.konaklama !== "—" ? ` · 🛏 ${gg.konaklama}` : ""}
                    </span>
                  </span>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 17 }}>{acik ? "−" : "+"}</span>
                </button>
                {acik ? (
                  <div style={{ padding: "11px 13px 13px" }}>
                    <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                      {gg.duraklar.map((d, i) => <li key={i} style={{ color: "#e2e8f0", fontSize: 13.5, lineHeight: 1.5 }}>{d}</li>)}
                    </ol>
                    {ilx ? (
                      <button type="button" onClick={() => onIl(ilx.id)}
                        style={{ marginTop: 10, border: `1px solid ${tur.renk}55`, background: "transparent", color: tur.renk, borderRadius: 9, padding: "5px 11px", cursor: "pointer", fontSize: 11.5, fontWeight: 800 }}>
                        {ilx.ad} sayfasını aç →
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Kart>

      {/* Bütçe */}
      <Kart baslik="Tahmini Bütçe" ikon="💰" renk="#fbbf24" aciklama="Kişi başı günlük harcama × gün × kişi + yakıt. Bölge fiyat farkı hesaba katıldı."
        sag={<strong style={{ color: "#fbbf24", fontSize: 16 }}>{tl(butce.toplam)}</strong>}>
        <Izgara min={140}>
          <Alan label="Kaç kişi" hint={`${butce.arac} araç varsayıldı`}>
            <input value={kisi} inputMode="numeric" onChange={(e) => setKisi(e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Alan label="Ulaşım">
            <select value={aracla ? "arac" : "yok"} onChange={(e) => setAracla(e.target.value === "arac")} style={satirInput}>
              <option value="arac">Kendi aracımla / kiralık</option>
              <option value="yok">Otobüs / tur (yakıt hariç)</option>
            </select>
          </Alan>
          {aracla ? (
            <>
              <Alan label="Tüketim (L/100 km)"><input value={tuketim} inputMode="decimal" onChange={(e) => setTuketim(e.target.value.replace(/[^\d.,]/g, ""))} style={satirInput} /></Alan>
              <Alan label="Yakıt (₺/L)" hint="Güncel pompa fiyatını yaz"><input value={litre} inputMode="decimal" onChange={(e) => setLitre(e.target.value.replace(/[^\d.,]/g, ""))} style={satirInput} /></Alan>
            </>
          ) : null}
        </Izgara>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 9 }}>
          {TUR_SEGMENTLERI.map((s) => {
            const sec = s.id === segment;
            return (
              <button key={s.id} type="button" onClick={() => setSegment(s.id)}
                style={{ textAlign: "left", padding: "11px 13px", borderRadius: 13, cursor: "pointer", border: `1px solid ${sec ? "#fbbf24aa" : "rgba(148,163,184,.2)"}`, background: sec ? "rgba(251,191,36,.14)" : "rgba(2,6,23,.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ color: sec ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13.5 }}>{s.ikon} {s.ad}</span>
                  <span style={{ color: "#fbbf24", fontWeight: 900, fontSize: 12.5 }}>{tl(s.kisiGun * tur.fiyatCarpani)}</span>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 10.5, marginTop: 4 }}>{s.not} · kişi/gün</div>
              </button>
            );
          })}
        </div>

        <Tablo renk="#fbbf24" minGenislik={420}
          basliklar={["Kalem", "Hesap", "Tutar"]}
          satirlar={[
            { hucreler: ["🏨 Konaklama + yemek + girişler", `${gun} gün × ${butce.k} kişi × ${tl(butce.gunluk)}`, tl(butce.konaklamaYemek)] },
            aracla ? { hucreler: ["⛽ Yakıt", `${km} km × ${tuketim} L/100 × ${tl(num(litre))} × ${butce.arac} araç`, tl(butce.yakit)] } : null,
            { hucreler: ["🧯 Acil pay (%10)", "Beklenmeyen, otopark, köprü", tl(butce.pay)], renk: "#94a3b8" },
            { hucreler: ["TOPLAM", `${butce.k} kişi · ${gun} gün`, tl(butce.toplam)], vurgu: true, kalin: true, renk: "#fbbf24" },
            { hucreler: ["Kişi başı", "", tl(butce.kisiBasi)], kalin: true, renk: "#60a5fa" },
          ].filter(Boolean)}
          not="Tahmini rakamlardır; 2026 ortalamalarına ve bölgesel fiyat farklarına göre hesaplandı. Uçak bileti ve köprü/otoyol ücretleri dahil değil."
        />
      </Kart>

      <Kart baslik="Bilmen Gerekenler" ikon="💡" renk="#34d399">
        <div style={{ display: "grid", gap: 8 }}>
          {tur.ipuclari.map((i, idx) => (
            <div key={idx} style={{ display: "flex", gap: 9, border: "1px solid rgba(52,211,153,.24)", background: "rgba(52,211,153,.07)", borderRadius: 12, padding: "10px 12px", color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6 }}>
              <span style={{ color: "#34d399", fontWeight: 900 }}>•</span><span>{i}</span>
            </div>
          ))}
        </div>
      </Kart>

      <Kart baslik="Seyahat Defterime" ikon="📔" renk="#fbbf24" aciklama="Bu rotayı planla ya da gittiysen işaretle — rotadaki tüm iller Türkiye haritanda yanar.">
        <DefterButonlari refObj={{ turId: tur.id }} durum={durum} onDefter={onDefter} tarihli gun={gun} />
      </Kart>
    </section>
  );
}

function GeriButonu({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.45)", color: "#cbd5e1", borderRadius: 11, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 800, marginBottom: 13 }}>
      {children}
    </button>
  );
}

function Kart({ baslik, ikon, aciklama, renk, sag, children }) {
  return (
    <section style={{ border: `1px solid ${renk}33`, borderRadius: 18, overflow: "hidden", background: "rgba(2,6,23,.3)", marginBottom: 14 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "12px 15px", background: `linear-gradient(120deg, ${renk}26, ${renk}0b)`, borderBottom: `1px solid ${renk}2e` }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 15.5 }}>{ikon} {baslik}</span>
          {aciklama ? <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{aciklama}</span> : null}
        </span>
        {sag}
      </header>
      <div style={{ padding: "14px 15px", display: "grid", gap: 13 }}>{children}</div>
    </section>
  );
}
