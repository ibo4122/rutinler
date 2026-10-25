"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DURUMLAR, FIYATLAR, ILCELER, MEKANLAR, PLANLAR,
  mekanBul, durumBul, haritaGomulu, haritaLink, rotaLink,
} from "../lib/istanbul";

// İstanbul Rehberi — gece Boğaz'ı kimliği: lacivert gökyüzü, siluet, pembe
// neon ve altın ışık. Diğer alanlardan (turkuaz seyahat, amber defter, yeşil
// sağlık) ilk bakışta ayrışsın diye kendi paleti ve başlık tipografisi var.
//
// Dört bölüm:
//   KEŞFET        — duruma göre (randevu, arkadaşlar, kutlama…) filtrelenen mekânlar
//   HAZIR PLANLAR — saat saat akşam/gün rotaları, tek tıkla Google Haritalar rotası
//   ÖZEL GÜN      — kim için, bütçe ve yakaya göre kutlama önerisi + kontrol listesi
//   LİSTEM        — favoriler, gidilenler ve kişisel notlar (hesapta saklanır)

const P = {
  gece: "#0a0f24",
  lacivert: "#131a3e",
  kart: "rgba(19,26,62,.82)",
  kartAcik: "rgba(30,38,86,.7)",
  pembe: "#f472b6",
  altin: "#fcd34d",
  mor: "#a78bfa",
  metin: "#ecebff",
  soluk: "#a3a8d4",
  silik: "#6b70a0",
  cizgi: "rgba(167,139,250,.22)",
};
const SERIF = "Georgia, 'Times New Roman', serif";

const YAKALAR = [
  { id: "hepsi", ad: "Tüm şehir" },
  { id: "avrupa", ad: "Avrupa" },
  { id: "anadolu", ad: "Anadolu" },
  { id: "ada", ad: "Adalar" },
];
const fiyatSimge = (f) => FIYATLAR[f]?.simge || "";
const ilceAd = (id) => ILCELER.find((i) => i.id === id)?.ad || id;
const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");

export default function IstanbulRehberi({ data, setData }) {
  const kayit = data || {};
  const favoriler = Array.isArray(kayit.favoriler) ? kayit.favoriler : [];
  const gittim = Array.isArray(kayit.gittim) ? kayit.gittim : [];
  const notlar = kayit.notlar && typeof kayit.notlar === "object" ? kayit.notlar : {};

  const [bolum, setBolum] = useState("kesfet");
  const [durum, setDurum] = useState("hepsi");
  const [secili, setSecili] = useState(null);

  const listeDegis = (alan, id) =>
    setData((s) => {
      const l = Array.isArray((s || {})[alan]) ? s[alan] : [];
      return { ...(s || {}), [alan]: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] };
    });
  const notYaz = (id, metin) =>
    setData((s) => ({ ...(s || {}), notlar: { ...((s || {}).notlar || {}), [id]: metin } }));

  const isaret = {
    fav: (id) => favoriler.includes(id),
    gittim: (id) => gittim.includes(id),
    favDegis: (id) => listeDegis("favoriler", id),
    gittimDegis: (id) => listeDegis("gittim", id),
  };
  const durumAc = (id) => { setDurum(id); setBolum("kesfet"); };

  return (
    <section style={{ color: P.metin }}>
      <GeceBasligi favori={favoriler.length} gidilen={gittim.length} />
      <BolumSecici bolum={bolum} onBolum={setBolum} listeSayisi={new Set([...favoriler, ...gittim]).size} />

      {bolum === "kesfet" ? (
        <Kesfet durum={durum} setDurum={setDurum} isaret={isaret} onMekan={setSecili} />
      ) : bolum === "planlar" ? (
        <HazirPlanlar onMekan={setSecili} />
      ) : bolum === "ozel" ? (
        <OzelGunPlanlayici isaret={isaret} onMekan={setSecili} />
      ) : (
        <Listem favoriler={favoriler} gittim={gittim} notlar={notlar} isaret={isaret} onMekan={setSecili} onKesfet={() => durumAc("hepsi")} />
      )}

      <p style={{ color: P.silik, fontSize: 11.5, lineHeight: 1.6, margin: "22px 2px 0" }}>
        Mekânlar yıllardır açık, köklü adreslerden seçildi; yine de çalışma saatleri, menüler ve fiyatlar değişebilir —
        gitmeden önce Google Haritalar'dan ya da mekânı arayarak kontrol et. Fotoğraflar Wikimedia Commons'tan; çoğu
        mekânın kendisini değil bulunduğu semti gösterir.
      </p>

      {secili ? (
        <MekanDetay mekan={secili} isaret={isaret} not={notlar[secili.id] || ""} onNot={(m) => notYaz(secili.id, m)}
          onKapat={() => setSecili(null)} onMekan={setSecili} />
      ) : null}
    </section>
  );
}

// ======================= BAŞLIK =============================================

// Yıldızların yeri her çizimde aynı kalsın diye sabit tohumlu üretici.
function yildizlar(n) {
  let t = 7;
  const r = () => { t = (t * 9301 + 49297) % 233280; return t / 233280; };
  return Array.from({ length: n }, () => ({ x: r() * 1200, y: r() * 120, b: 0.4 + r() * 1.3, o: 0.3 + r() * 0.7 }));
}
const YILDIZLAR = yildizlar(70);

function Siluet() {
  // Soldan sağa: Tarihi Yarımada camileri, Galata Kulesi, köprü, Anadolu tepeleri.
  const minare = (x, h) => `M${x},200 L${x},${200 - h} L${x + 3},${200 - h - 16} L${x + 6},${200 - h} L${x + 6},200 Z`;
  const kubbe = (cx, r, taban) => `M${cx - r},${taban} A${r},${r * 0.9} 0 0 1 ${cx + r},${taban} Z`;
  const yapilar = [
    kubbe(150, 46, 150), kubbe(108, 22, 162), kubbe(194, 22, 162),
    minare(80, 92), minare(214, 92), minare(56, 70), minare(238, 70),
    kubbe(360, 38, 156), kubbe(328, 18, 166), kubbe(392, 18, 166), minare(304, 84), minare(412, 84),
  ];
  // Gökyüzü kırpılarak, siluet ise alt şeritte tam genişlikte çizilir: dar
  // ekranda da camiden köprüye bütün manzara görünsün.
  return (
    <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0a0f24 0%, #25184a 62%, #6b2154 100%)" }} />
    {YILDIZLAR.map((y, i) => (
      <span key={i} style={{ position: "absolute", left: `${y.x / 12}%`, top: `${y.y / 1.6}%`, width: y.b * 2, height: y.b * 2, borderRadius: 999, background: "#fff", opacity: y.o }} />
    ))}
    <span style={{ position: "absolute", top: 20, right: 26, width: 42, height: 42, borderRadius: 999, boxShadow: "inset -11px 7px 0 0 #fde68a", transform: "rotate(-20deg)", filter: "drop-shadow(0 0 12px rgba(253,230,138,.45))" }} />
    <svg viewBox="0 50 1200 150" aria-hidden="true"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="istSu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1440" />
          <stop offset="1" stopColor="#0a0f24" />
        </linearGradient>
      </defs>
      <g fill="#070b1c">
        <rect x="0" y="162" width="470" height="38" />
        {yapilar.map((d, i) => <path key={i} d={d} />)}
        <rect x="530" y="96" width="26" height="104" />
        <path d="M526,98 L543,62 L560,98 Z" />
        <rect x="470" y="172" width="150" height="28" />
        <path d="M980,200 C1040,150 1110,150 1200,168 L1200,200 Z" />
      </g>
      <g stroke="#f472b6" strokeOpacity=".75" fill="none">
        <line x1="640" y1="170" x2="980" y2="170" strokeWidth="3" />
        <line x1="700" y1="170" x2="700" y2="112" strokeWidth="4" />
        <line x1="920" y1="170" x2="920" y2="112" strokeWidth="4" />
        <path d="M640,168 Q670,140 700,112 Q810,190 920,112 Q950,140 980,168" strokeWidth="1.6" />
      </g>
      <rect x="0" y="182" width="1200" height="18" fill="url(#istSu)" opacity=".9" />
    </svg>
    </>
  );
}

function GeceBasligi({ favori, gidilen }) {
  const istatistik = [
    [MEKANLAR.length, "mekân"],
    [DURUMLAR.length, "durum"],
    [PLANLAR.length, "hazır plan"],
    [favori, "favori"],
    [gidilen, "gidildi"],
  ];
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, marginBottom: 16, border: `1px solid ${P.cizgi}`, background: P.gece }}>
      <Siluet />
      <div style={{ position: "relative", padding: "26px 24px clamp(48px, 10vw, 120px)", display: "grid", gap: 10 }}>
        <span style={{ color: P.altin, fontSize: 11.5, fontWeight: 900, letterSpacing: ".22em" }}>İSTANBUL REHBERİ</span>
        <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 400, lineHeight: 1.1 }}>
          Bu akşam <em style={{ color: P.pembe }}>nereye</em>?
        </h2>
        <p style={{ margin: 0, color: P.soluk, fontSize: 14, maxWidth: 520, lineHeight: 1.55 }}>
          Randevudan doğum gününe, meyhane masasından Boğaz kahvaltısına — iki yakanın en iyi adresleri duruma göre ayrıldı,
          her biri haritada.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {istatistik.map(([n, ad]) => (
            <span key={ad} style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(10,15,36,.72)", border: `1px solid ${P.cizgi}`, fontSize: 12, color: P.soluk, backdropFilter: "blur(4px)" }}>
              <b style={{ color: P.metin, fontSize: 14 }}>{n}</b> {ad}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BolumSecici({ bolum, onBolum, listeSayisi }) {
  const bolumler = [
    { id: "kesfet", ad: "Keşfet", ikon: "✨" },
    { id: "planlar", ad: "Hazır Planlar", ikon: "🗓️" },
    { id: "ozel", ad: "Özel Gün Planlayıcı", ikon: "🎂" },
    { id: "liste", ad: `Listem${listeSayisi ? ` · ${listeSayisi}` : ""}`, ikon: "♥" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, padding: 5, borderRadius: 16, background: "rgba(10,15,36,.6)", border: `1px solid ${P.cizgi}`, marginBottom: 18, overflowX: "auto" }}>
      {bolumler.map((b) => {
        const aktif = b.id === bolum;
        return (
          <button key={b.id} type="button" onClick={() => onBolum(b.id)}
            style={{
              flex: "1 0 auto", padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              fontSize: 13.5, fontWeight: 800,
              background: aktif ? `linear-gradient(120deg, ${P.pembe}, ${P.mor})` : "transparent",
              color: aktif ? "#1a0b25" : P.soluk,
            }}>{b.ikon} {b.ad}</button>
        );
      })}
    </div>
  );
}

// ======================= KEŞFET =============================================

function Kesfet({ durum, setDurum, isaret, onMekan }) {
  const [yaka, setYaka] = useState("hepsi");
  const [ilce, setIlce] = useState("hepsi");
  const [fiyatlar, setFiyatlar] = useState([]);
  const [arama, setArama] = useState("");
  const [sadeceFav, setSadeceFav] = useState(false);
  const [sirala, setSirala] = useState("onerilen");

  const liste = useMemo(() => {
    const t = kucuk(arama.trim());
    let l = MEKANLAR.filter((m) =>
      (durum === "hepsi" || m.durumlar.includes(durum)) &&
      (yaka === "hepsi" || m.yaka === yaka) &&
      (ilce === "hepsi" || m.ilce === ilce) &&
      (!fiyatlar.length || fiyatlar.includes(m.fiyat)) &&
      (!sadeceFav || isaret.fav(m.id)) &&
      (!t || [m.ad, m.semt, ilceAd(m.ilce), m.tur, m.not, ...m.etiketler].some((x) => kucuk(x).includes(t))));
    if (sirala === "ucuz") l = [...l].sort((a, b) => a.fiyat - b.fiyat);
    else if (sirala === "pahali") l = [...l].sort((a, b) => b.fiyat - a.fiyat);
    else if (sirala === "semt") l = [...l].sort((a, b) => a.semt.localeCompare(b.semt, "tr"));
    return l;
  }, [durum, yaka, ilce, fiyatlar, arama, sadeceFav, sirala, isaret]);

  const ilceler = ILCELER.filter((i) => yaka === "hepsi" || i.yaka === yaka);
  const fiyatDegis = (f) => setFiyatlar((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]));
  const d = durumBul(durum);
  const rastgele = () => { if (liste.length) onMekan(liste[Math.floor(Math.random() * liste.length)]); };

  return (
    <>
      <h3 style={baslikStil}>Ne yapmak istiyorsun?</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 100%), 1fr))", gap: 9, marginBottom: 18 }}>
        <DurumKarti aktif={durum === "hepsi"} ikon="🌃" ad="Hepsi" sayi={MEKANLAR.length} renk={P.mor} onClick={() => setDurum("hepsi")} />
        {DURUMLAR.map((x) => (
          <DurumKarti key={x.id} aktif={durum === x.id} ikon={x.ikon} ad={x.kisa} renk={x.renk}
            sayi={MEKANLAR.filter((m) => m.durumlar.includes(x.id)).length} onClick={() => setDurum(x.id)} />
        ))}
      </div>

      {d ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderRadius: 14, marginBottom: 14, background: `linear-gradient(110deg, ${d.renk}2a, transparent)`, borderLeft: `3px solid ${d.renk}` }}>
          <span style={{ fontSize: 26 }}>{d.ikon}</span>
          <span>
            <b style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400 }}>{d.ad}</b>
            <span style={{ display: "block", color: P.soluk, fontSize: 13, marginTop: 2 }}>{d.aciklama}</span>
          </span>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10, marginBottom: 16, padding: 14, borderRadius: 16, background: P.kart, border: `1px solid ${P.cizgi}` }}>
        <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="🔍 Mekân, semt ya da etiket ara — ör. meyhane, gün batımı, Moda…"
          style={girdiStil} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
          <Segment secenekler={YAKALAR} deger={yaka} onDeger={(v) => { setYaka(v); setIlce("hepsi"); }} />
          <select value={ilce} onChange={(e) => setIlce(e.target.value)} style={{ ...girdiStil, width: "auto", height: 38, fontSize: 13, padding: "0 10px" }}>
            <option value="hepsi">Tüm ilçeler</option>
            {ilceler.map((i) => <option key={i.id} value={i.id}>{i.ad}</option>)}
          </select>
          <select value={sirala} onChange={(e) => setSirala(e.target.value)} style={{ ...girdiStil, width: "auto", height: 38, fontSize: 13, padding: "0 10px" }}>
            <option value="onerilen">Önerilen sıra</option>
            <option value="ucuz">Bütçe: uygundan</option>
            <option value="pahali">Bütçe: lüksten</option>
            <option value="semt">Semte göre</option>
          </select>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ color: P.silik, fontSize: 12, fontWeight: 800, marginRight: 2 }}>BÜTÇE</span>
          {FIYATLAR.map((f) => (
            <Cip key={f.id} aktif={fiyatlar.includes(f.id)} onClick={() => fiyatDegis(f.id)} renk={P.altin}>
              {f.simge}{f.id ? <span style={{ opacity: 0.7, fontWeight: 600 }}> {f.ad}</span> : null}
            </Cip>
          ))}
          <Cip aktif={sadeceFav} onClick={() => setSadeceFav((v) => !v)} renk={P.pembe}>♥ Favorilerim</Cip>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ color: P.soluk, fontSize: 13 }}><b style={{ color: P.metin }}>{liste.length}</b> mekân</span>
        <button type="button" onClick={rastgele} disabled={!liste.length}
          style={{ ...hapStil, borderColor: `${P.altin}77`, color: P.altin }}>🎲 Kararsızım, sen seç</button>
      </div>

      {liste.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 14 }}>
          {liste.map((m) => <MekanKarti key={m.id} mekan={m} isaret={isaret} onAc={() => onMekan(m)} />)}
        </div>
      ) : (
        <div style={{ padding: 30, textAlign: "center", borderRadius: 16, border: `1px dashed ${P.cizgi}`, color: P.soluk }}>
          Bu filtrelerle eşleşen mekân yok. Bütçe ya da yaka seçimini gevşetmeyi dene.
        </div>
      )}
    </>
  );
}

function DurumKarti({ aktif, ikon, ad, sayi, renk, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 15, cursor: "pointer", textAlign: "left",
        border: `1.5px solid ${aktif ? renk : P.cizgi}`,
        background: aktif ? `linear-gradient(135deg, ${renk}40, ${renk}10)` : P.kart,
        boxShadow: aktif ? `0 0 22px ${renk}33` : "none",
      }}>
      <span style={{ fontSize: 22 }}>{ikon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", color: aktif ? "#fff" : P.metin, fontSize: 13.5, fontWeight: 800 }}>{ad}</span>
        <span style={{ display: "block", color: aktif ? renk : P.silik, fontSize: 11.5, fontWeight: 700 }}>{sayi} yer</span>
      </span>
    </button>
  );
}

function MekanKarti({ mekan: m, isaret, onAc }) {
  const fav = isaret.fav(m.id);
  const git = isaret.gittim(m.id);
  const anaDurum = durumBul(m.durumlar[0]);
  return (
    <article style={{ borderRadius: 18, overflow: "hidden", background: P.kart, border: `1px solid ${P.cizgi}`, display: "flex", flexDirection: "column" }}>
      <button type="button" onClick={onAc} style={{ all: "unset", cursor: "pointer", display: "block" }}>
        <Gorsel src={m.gorsel} yukseklik={150} renk={anaDurum?.renk}>
          <span style={{ position: "absolute", top: 10, left: 10, padding: "4px 9px", borderRadius: 999, background: "rgba(10,15,36,.82)", color: P.altin, fontSize: 12, fontWeight: 900 }}>
            {fiyatSimge(m.fiyat)}
          </span>
          {git ? (
            <span style={{ position: "absolute", top: 10, right: 10, padding: "4px 9px", borderRadius: 999, background: "#22c55e", color: "#052e16", fontSize: 11.5, fontWeight: 900 }}>✓ Gittim</span>
          ) : null}
          <span style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,.8)" }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, letterSpacing: ".06em", opacity: 0.9 }}>{m.tur.toLocaleUpperCase("tr")} · {m.semt.replace(/\s*\(.*?\)/, "")}</span>
            <span style={{ display: "block", fontFamily: SERIF, fontSize: 19, lineHeight: 1.2 }}>{m.ad}</span>
          </span>
        </Gorsel>
      </button>
      <div style={{ padding: "11px 13px 13px", display: "grid", gap: 9, flex: 1 }}>
        <p style={{ margin: 0, color: P.soluk, fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.not}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {m.durumlar.map((id) => {
            const d = durumBul(id);
            return <span key={id} title={d.ad} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: `${d.renk}1f`, color: d.renk, fontWeight: 700 }}>{d.ikon} {d.kisa}</span>;
          })}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
          <button type="button" onClick={onAc} style={{ ...hapStil, flex: 1 }}>📍 Haritada gör</button>
          <button type="button" onClick={() => isaret.favDegis(m.id)} title={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
            style={{ ...hapStil, padding: "0 12px", color: fav ? P.pembe : P.soluk, borderColor: fav ? `${P.pembe}88` : P.cizgi }}>{fav ? "♥" : "♡"}</button>
          <button type="button" onClick={() => isaret.gittimDegis(m.id)} title={git ? "Gidilmedi olarak işaretle" : "Gittim olarak işaretle"}
            style={{ ...hapStil, padding: "0 12px", color: git ? "#4ade80" : P.soluk, borderColor: git ? "#4ade8088" : P.cizgi }}>✓</button>
        </div>
      </div>
    </article>
  );
}

function Gorsel({ src, yukseklik, renk = P.mor, children }) {
  const [hata, setHata] = useState(false);
  return (
    <div style={{ position: "relative", height: yukseklik, background: `linear-gradient(135deg, ${renk}55, ${P.lacivert})` }}>
      {src && !hata ? (
        <img src={src} alt="" loading="lazy" onError={() => setHata(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,15,36,.05) 35%, rgba(10,15,36,.88))" }} />
      {children}
    </div>
  );
}

// ======================= MEKÂN DETAYI =======================================

function MekanDetay({ mekan: m, isaret, not, onNot, onKapat, onMekan }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onKapat]);
  const fav = isaret.fav(m.id);
  const git = isaret.gittim(m.id);
  const planlar = PLANLAR.filter((p) => p.adimlar.some((a) => a[1] === m.id));
  const yolTarifi = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.harita)}`;

  return (
    <div role="dialog" aria-modal="true" aria-label={m.ad} onClick={onKapat}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(4,6,18,.78)", backdropFilter: "blur(5px)", overflowY: "auto", padding: "24px 12px" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 760, margin: "0 auto", borderRadius: 22, overflow: "hidden", background: P.lacivert, border: `1px solid ${P.cizgi}`, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
        <Gorsel src={m.gorsel} yukseklik={230} renk={durumBul(m.durumlar[0])?.renk}>
          <button type="button" onClick={onKapat} aria-label="Kapat"
            style={{ position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: 999, border: "none", cursor: "pointer", background: "rgba(10,15,36,.85)", color: "#fff", fontSize: 18 }}>✕</button>
          <span style={{ position: "absolute", left: 20, right: 20, bottom: 16, color: "#fff", textShadow: "0 1px 10px rgba(0,0,0,.8)" }}>
            <span style={{ display: "block", color: P.altin, fontSize: 12, fontWeight: 900, letterSpacing: ".12em" }}>
              {m.tur.toLocaleUpperCase("tr")} · {fiyatSimge(m.fiyat)}{m.fiyat ? ` ${FIYATLAR[m.fiyat].ad}` : ""}
            </span>
            <span style={{ display: "block", fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.15 }}>{m.ad}</span>
            <span style={{ display: "block", fontSize: 13.5, opacity: 0.9 }}>{m.semt} · {ilceAd(m.ilce)} · {m.yaka === "anadolu" ? "Anadolu yakası" : m.yaka === "ada" ? "Adalar" : "Avrupa yakası"}</span>
          </span>
        </Gorsel>

        <div style={{ padding: "18px 20px 22px", display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65 }}>{m.not}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {m.durumlar.map((id) => {
              const d = durumBul(id);
              return <span key={id} style={{ fontSize: 12.5, padding: "4px 10px", borderRadius: 999, background: `${d.renk}22`, color: d.renk, fontWeight: 800 }}>{d.ikon} {d.ad}</span>;
            })}
            {m.etiketler.map((e) => (
              <span key={e} style={{ fontSize: 12.5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${P.cizgi}`, color: P.soluk }}>{e}</span>
            ))}
          </div>

          <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${P.cizgi}`, background: P.gece }}>
            <iframe title={`${m.ad} haritası`} src={haritaGomulu(m.harita)} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              style={{ display: "block", width: "100%", height: 280, border: 0 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 8 }}>
            <a href={haritaLink(m.harita)} target="_blank" rel="noopener noreferrer" style={{ ...hapStil, ...anaDugme }}>🗺️ Google Haritalar'da aç</a>
            <a href={yolTarifi} target="_blank" rel="noopener noreferrer" style={hapStil}>🧭 Yol tarifi al</a>
            <button type="button" onClick={() => isaret.favDegis(m.id)}
              style={{ ...hapStil, color: fav ? P.pembe : P.metin, borderColor: fav ? `${P.pembe}88` : P.cizgi }}>{fav ? "♥ Favorilerde" : "♡ Favorilere ekle"}</button>
            <button type="button" onClick={() => isaret.gittimDegis(m.id)}
              style={{ ...hapStil, color: git ? "#4ade80" : P.metin, borderColor: git ? "#4ade8088" : P.cizgi }}>{git ? "✓ Gittim" : "Gittim olarak işaretle"}</button>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: P.silik, fontSize: 12, fontWeight: 900, letterSpacing: ".1em" }}>KENDİ NOTUN</span>
            <textarea value={not} onChange={(e) => onNot(e.target.value)} rows={2}
              placeholder="Ör. pencere kenarı masa iste, tatlısı çok iyi, cuma akşamı kalabalık…"
              style={{ ...girdiStil, height: "auto", padding: 12, resize: "vertical", fontFamily: "inherit" }} />
          </label>

          {planlar.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ color: P.silik, fontSize: 12, fontWeight: 900, letterSpacing: ".1em" }}>BU MEKÂNIN GEÇTİĞİ PLANLAR</span>
              {planlar.map((p) => (
                <div key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, color: P.soluk, fontSize: 13 }}>
                  <b style={{ color: P.metin }}>{p.ikon} {p.ad}:</b>
                  {p.adimlar.filter((a) => a[1] && a[1] !== m.id).map((a, i) => {
                    const x = mekanBul(a[1]);
                    return <button key={i} type="button" onClick={() => onMekan(x)} style={{ ...metinDugme }}>{x.ad}</button>;
                  })}
                </div>
              ))}
            </div>
          ) : null}
          <span style={{ color: P.silik, fontSize: 11 }}>Görsel: {m.semt.replace(/\s*\(.*?\)/, "")} çevresi — Wikimedia Commons</span>
        </div>
      </div>
    </div>
  );
}

// ======================= HAZIR PLANLAR ======================================

function HazirPlanlar({ onMekan }) {
  const [filtre, setFiltre] = useState("hepsi");
  const durumlar = [...new Set(PLANLAR.map((p) => p.durum))];
  const liste = PLANLAR.filter((p) => filtre === "hepsi" || p.durum === filtre);
  return (
    <>
      <h3 style={baslikStil}>Saat saat hazır planlar</h3>
      <p style={{ color: P.soluk, fontSize: 13.5, margin: "-6px 0 14px" }}>Tek tek mekân seçmekle uğraşma: rotayı seç, duraklara dokunup detayına bak, tüm rotayı Google Haritalar'da aç.</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <Cip aktif={filtre === "hepsi"} onClick={() => setFiltre("hepsi")} renk={P.mor}>Tümü</Cip>
        {durumlar.map((id) => {
          const d = durumBul(id);
          return <Cip key={id} aktif={filtre === id} onClick={() => setFiltre(id)} renk={d.renk}>{d.ikon} {d.kisa}</Cip>;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(330px, 100%), 1fr))", gap: 14 }}>
        {liste.map((p) => <PlanKarti key={p.id} plan={p} onMekan={onMekan} />)}
      </div>
    </>
  );
}

function PlanKarti({ plan: p, onMekan }) {
  const d = durumBul(p.durum);
  const mekanlar = p.adimlar.map((a) => mekanBul(a[1])).filter(Boolean);
  const tekil = mekanlar.filter((m, i) => mekanlar.findIndex((x) => x.id === m.id) === i);
  const rota = rotaLink(tekil);
  const kapak = tekil.find((m) => m.gorsel)?.gorsel;
  return (
    <article style={{ borderRadius: 20, overflow: "hidden", background: P.kart, border: `1px solid ${P.cizgi}` }}>
      <Gorsel src={kapak} yukseklik={120} renk={d.renk}>
        <span style={{ position: "absolute", left: 16, right: 16, bottom: 12, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,.8)" }}>
          <span style={{ display: "block", color: d.renk, fontSize: 11.5, fontWeight: 900, letterSpacing: ".1em" }}>{d.ikon} {d.kisa.toLocaleUpperCase("tr")} · {p.sure.toLocaleUpperCase("tr")} · {fiyatSimge(p.fiyat)}</span>
          <span style={{ display: "block", fontFamily: SERIF, fontSize: 21 }}>{p.ikon} {p.ad}</span>
        </span>
      </Gorsel>
      <div style={{ padding: "12px 16px 16px", display: "grid", gap: 12 }}>
        <p style={{ margin: 0, color: P.soluk, fontSize: 13.5, lineHeight: 1.5 }}>{p.ozet}</p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
          {p.adimlar.map(([saat, id, aciklama], i) => {
            const m = mekanBul(id);
            const son = i === p.adimlar.length - 1;
            return (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "50px 18px 1fr", gap: 8 }}>
                <span style={{ color: P.altin, fontSize: 13, fontWeight: 900, paddingTop: 1 }}>{saat}</span>
                <span style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <span style={{ width: 11, height: 11, marginTop: 4, borderRadius: 999, background: d.renk, boxShadow: `0 0 10px ${d.renk}` }} />
                  {!son ? <span style={{ position: "absolute", top: 17, bottom: -2, width: 2, background: `${d.renk}44` }} /> : null}
                </span>
                <span style={{ paddingBottom: son ? 0 : 12, fontSize: 13.5, lineHeight: 1.45 }}>
                  {m ? <button type="button" onClick={() => onMekan(m)} style={{ ...metinDugme, fontWeight: 800, fontSize: 13.5 }}>{m.ad}</button> : null}
                  <span style={{ display: "block", color: P.soluk }}>{aciklama}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {rota ? <a href={rota} target="_blank" rel="noopener noreferrer" style={{ ...hapStil, ...anaDugme }}>🗺️ Tüm rotayı Google Haritalar'da aç</a> : null}
      </div>
    </article>
  );
}

// ======================= ÖZEL GÜN PLANLAYICI ================================

const KIMLER = [
  { id: "sevgili", ad: "Sevgilim / eşim", ikon: "💞", durumlar: ["randevu", "kutlama"] },
  { id: "arkadas", ad: "Arkadaş grubu", ikon: "🥂", durumlar: ["arkadas", "kutlama"] },
  { id: "aile", ad: "Aile", ikon: "👨‍👩‍👧", durumlar: ["kutlama", "yemek", "aile"] },
];
const VESILELER = [
  { id: "dogumgunu", ad: "Doğum günü" },
  { id: "yildonumu", ad: "Yıl dönümü" },
  { id: "teklif", ad: "Evlilik teklifi" },
  { id: "kutlama", ad: "Terfi / mezuniyet" },
  { id: "ilk", ad: "İlk buluşma" },
];

function kontrolListesi(kim, vesile, butce) {
  const l = [
    ["2 hafta önce", butce >= 3 ? "Rezervasyonu yap; fine dining ve Boğaz restoranları hafta sonu çabuk doluyor." : "Kalabalık bir masa için birkaç gün önceden yer ayırt."],
    ["Rezervasyonda", "Özel günü belirt — çoğu restoran mumlu tatlı, not kartı ya da masa süslemesi hazırlıyor."],
    ["Pasta", "Mekânın dışarıdan pasta kabul edip etmediğini ve servis ücretini sor."],
    ["Zamanlama", "Gün batımı saatine göre buluş; Boğaz'da altın saat masadan izlenince bambaşka."],
    ["Ulaşım", "Akşam Boğaz trafiği ağır: vapur, Marmaray ya da erken çıkış planla; içilecekse araçsız git."],
  ];
  if (vesile === "teklif") l.splice(2, 0, ["Teklif", "Mekâna önceden haber ver; özel tekne ya da sakin bir köşe masa iste, fotoğrafçı ayarlamayı düşün."]);
  if (vesile === "dogumgunu" && kim === "arkadas") l.splice(2, 0, ["Grup", "Kişi sayısını kesinleştir, hesap bölüşümünü önceden konuş; fasıl istenirse meyhaneyi ona göre seç."]);
  if (vesile === "ilk") l.splice(0, l.length, ["Seçim", "İlk buluşmada konuşabileceğin, gürültüsüz ve çıkışı kolay bir yer seç."], ["Plan B", "Yakınında yürüyüş ya da tatlıcı olsun; iyi giderse akşam uzar."], ["Zamanlama", "Gün batımına denk getir; manzara konuşmayı kolaylaştırır."]);
  return l;
}

function OzelGunPlanlayici({ isaret, onMekan }) {
  const [kim, setKim] = useState("sevgili");
  const [vesile, setVesile] = useState("dogumgunu");
  const [butce, setButce] = useState(3);
  const [yaka, setYaka] = useState("hepsi");

  const k = KIMLER.find((x) => x.id === kim);
  const oneriler = useMemo(() => {
    const puanla = (m) => {
      let p = m.durumlar.filter((d) => k.durumlar.includes(d)).length * 3;
      p -= Math.abs(m.fiyat - butce) * 2;
      if (m.durumlar.includes("kutlama")) p += vesile === "ilk" ? -1 : 2;
      if (m.durumlar.includes("yemek")) p += 1;
      // Kutlama bir akşam yemeği; yalnızca kahvaltı/kahve durağı olan yerler geri düşer.
      if (vesile !== "ilk" && !m.durumlar.some((d) => d === "yemek" || d === "kutlama")) p -= 3;
      if ((vesile === "teklif" || vesile === "yildonumu") && m.etiketler.some((e) => /Boğaz|Gün batımı/.test(e))) p += 2;
      if (vesile === "ilk" && m.fiyat >= 4) p -= 2;
      return p;
    };
    return MEKANLAR
      .filter((m) => m.fiyat > 0 && m.durumlar.some((d) => k.durumlar.includes(d)) && (yaka === "hepsi" || m.yaka === yaka))
      .map((m) => ({ m, p: puanla(m) }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 6)
      .map((x) => x.m);
  }, [k, butce, yaka, vesile]);

  const plan = PLANLAR
    .filter((p) => k.durumlar.includes(p.durum))
    .map((p) => ({ p, uzaklik: Math.abs(p.fiyat - butce) + (vesile === "ilk" ? (p.durum === "kutlama" ? 2 : 0) : (p.durum === "kutlama" ? 0 : 1.5)) }))
    .sort((a, b) => a.uzaklik - b.uzaklik)[0]?.p;
  const liste = kontrolListesi(kim, vesile, butce);

  return (
    <>
      <h3 style={baslikStil}>Özel gün planlayıcı</h3>
      <p style={{ color: P.soluk, fontSize: 13.5, margin: "-6px 0 14px" }}>Kimi, neyi kutluyorsun? Üç seçimle sana uygun mekânları, hazır bir akşam planını ve hazırlık listesini çıkaralım.</p>

      <div style={{ display: "grid", gap: 14, padding: 16, borderRadius: 18, marginBottom: 18, background: `linear-gradient(135deg, ${P.pembe}1c, ${P.mor}12)`, border: `1px solid ${P.pembe}44` }}>
        <Secim etiket="Kim için?">
          {KIMLER.map((x) => <Cip key={x.id} aktif={kim === x.id} onClick={() => setKim(x.id)} renk={P.pembe}>{x.ikon} {x.ad}</Cip>)}
        </Secim>
        <Secim etiket="Vesile">
          {VESILELER.map((x) => <Cip key={x.id} aktif={vesile === x.id} onClick={() => setVesile(x.id)} renk={P.mor}>{x.ad}</Cip>)}
        </Secim>
        <Secim etiket="Bütçe">
          {FIYATLAR.filter((f) => f.id > 0).map((f) => <Cip key={f.id} aktif={butce === f.id} onClick={() => setButce(f.id)} renk={P.altin}>{f.simge} {f.ad}</Cip>)}
        </Secim>
        <Secim etiket="Hangi yaka?">
          <Segment secenekler={YAKALAR} deger={yaka} onDeger={setYaka} />
        </Secim>
      </div>

      <h4 style={{ ...baslikStil, fontSize: 18 }}>Sana en uygun 6 mekân</h4>
      {oneriler.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 14, marginBottom: 22 }}>
          {oneriler.map((m) => <MekanKarti key={m.id} mekan={m} isaret={isaret} onAc={() => onMekan(m)} />)}
        </div>
      ) : (
        <p style={{ color: P.soluk, marginBottom: 22 }}>Bu yakada uygun mekân bulunamadı; "Tüm şehir"i dene.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 14 }}>
        {plan ? (
          <div>
            <h4 style={{ ...baslikStil, fontSize: 18 }}>Hazır akşam önerisi</h4>
            <PlanKarti plan={plan} onMekan={onMekan} />
          </div>
        ) : null}
        <div>
          <h4 style={{ ...baslikStil, fontSize: 18 }}>Hazırlık listesi</h4>
          <ol style={{ listStyle: "none", margin: 0, padding: 16, borderRadius: 20, background: P.kart, border: `1px solid ${P.cizgi}`, display: "grid", gap: 12 }}>
            {liste.map(([baslik, metin], i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, display: "grid", placeItems: "center", background: `${P.altin}22`, color: P.altin, fontSize: 12.5, fontWeight: 900 }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  <b style={{ color: P.metin }}>{baslik}</b>
                  <span style={{ display: "block", color: P.soluk }}>{metin}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

function Secim({ etiket, children }) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <span style={{ color: P.soluk, fontSize: 12, fontWeight: 900, letterSpacing: ".1em" }}>{etiket.toLocaleUpperCase("tr")}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </div>
  );
}

// ======================= LİSTEM =============================================

function Listem({ favoriler, gittim, notlar, isaret, onMekan, onKesfet }) {
  const [sekme, setSekme] = useState("fav");
  const ids = sekme === "fav" ? favoriler : sekme === "gittim" ? gittim : Object.keys(notlar).filter((k) => String(notlar[k] || "").trim());
  const liste = ids.map(mekanBul).filter(Boolean);
  const gidilecek = favoriler.filter((id) => !gittim.includes(id)).length;
  return (
    <>
      <h3 style={baslikStil}>Benim İstanbul'um</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          ["♥", favoriler.length, "favori", P.pembe],
          ["⏳", gidilecek, "sırada bekleyen", P.altin],
          ["✓", gittim.length, "gidildi", "#4ade80"],
          ["%", Math.round((gittim.length / MEKANLAR.length) * 100), "rehber tamamlandı", P.mor],
        ].map(([ikon, n, ad, renk]) => (
          <div key={ad} style={{ padding: "14px 16px", borderRadius: 16, background: P.kart, border: `1px solid ${P.cizgi}` }}>
            <span style={{ color: renk, fontSize: 13, fontWeight: 900 }}>{ikon}</span>
            <b style={{ display: "block", fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: renk }}>{ikon === "%" ? `%${n}` : n}</b>
            <span style={{ color: P.soluk, fontSize: 12.5 }}>{ad}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Cip aktif={sekme === "fav"} onClick={() => setSekme("fav")} renk={P.pembe}>♥ Favoriler</Cip>
        <Cip aktif={sekme === "gittim"} onClick={() => setSekme("gittim")} renk="#4ade80">✓ Gittiklerim</Cip>
        <Cip aktif={sekme === "not"} onClick={() => setSekme("not")} renk={P.altin}>✎ Notlarım</Cip>
      </div>
      {liste.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 14 }}>
          {liste.map((m) => (
            <div key={m.id} style={{ display: "grid", gap: 6 }}>
              <MekanKarti mekan={m} isaret={isaret} onAc={() => onMekan(m)} />
              {String(notlar[m.id] || "").trim() ? (
                <p style={{ margin: 0, padding: "8px 12px", borderRadius: 12, background: `${P.altin}12`, borderLeft: `3px solid ${P.altin}`, color: P.metin, fontSize: 12.5, fontStyle: "italic" }}>✎ {notlar[m.id]}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 30, textAlign: "center", borderRadius: 16, border: `1px dashed ${P.cizgi}`, color: P.soluk, display: "grid", gap: 12, justifyItems: "center" }}>
          <span>{sekme === "fav" ? "Henüz favorin yok. Mekân kartlarındaki ♡ ile ekleyebilirsin." : sekme === "gittim" ? "Gittiğin yerleri ✓ ile işaretle; burada birikecek." : "Mekân detayındaki \"Kendi notun\" alanına yazdıkların burada görünür."}</span>
          <button type="button" onClick={onKesfet} style={{ ...hapStil, ...anaDugme }}>✨ Keşfetmeye başla</button>
        </div>
      )}
      <p style={{ color: P.silik, fontSize: 11.5, marginTop: 14 }}>Favoriler, gidilenler ve notlar hesabına kaydedilir; her cihazda aynı görünür.</p>
    </>
  );
}

// ======================= ORTAK PARÇALAR =====================================

function Cip({ aktif, onClick, renk, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: "7px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap",
        border: `1px solid ${aktif ? renk : P.cizgi}`,
        background: aktif ? `${renk}2e` : "rgba(10,15,36,.5)",
        color: aktif ? "#fff" : P.soluk,
      }}>{children}</button>
  );
}

function Segment({ secenekler, deger, onDeger }) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", padding: 3, borderRadius: 12, background: "rgba(10,15,36,.6)", border: `1px solid ${P.cizgi}` }}>
      {secenekler.map((s) => (
        <button key={s.id} type="button" onClick={() => onDeger(s.id)}
          style={{
            padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 800,
            background: deger === s.id ? P.mor : "transparent", color: deger === s.id ? "#140a2a" : P.soluk,
          }}>{s.ad}</button>
      ))}
    </div>
  );
}

const baslikStil = { fontFamily: SERIF, fontWeight: 400, fontSize: 22, margin: "0 0 12px", color: P.metin };
const girdiStil = {
  width: "100%", height: 46, padding: "0 14px", borderRadius: 12, fontSize: 14.5, color: P.metin,
  background: "rgba(10,15,36,.75)", border: `1px solid ${P.cizgi}`, outline: "none", boxSizing: "border-box",
};
const hapStil = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 38, padding: "0 14px",
  borderRadius: 11, border: `1px solid ${P.cizgi}`, background: "rgba(10,15,36,.55)", color: P.metin,
  fontSize: 13, fontWeight: 800, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap",
};
const anaDugme = { background: `linear-gradient(120deg, ${P.pembe}, ${P.mor})`, color: "#1a0b25", border: "none" };
const metinDugme = {
  background: "none", border: "none", padding: 0, cursor: "pointer", color: P.pembe, fontSize: 13,
  textDecoration: "underline", textDecorationColor: `${P.pembe}66`, textUnderlineOffset: 3, textAlign: "left",
};
