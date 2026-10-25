"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ORTAMLAR, DURUMLAR, FIYATLAR, ODULLER, MEKANLAR, GECELER,
  mekanBul, ortamBul, haritaGomulu, haritaLink, yolTarifi, rotaLink,
} from "../lib/istanbul";

// İstanbul Rehberi — "gece listesi" kimliği. Seyahat alanının fotoğraf
// ağırlıklı, turkuaz broşür havasının tam tersi: siyah zemin, sıcak beyaz
// yazı, her ortamın kendi neon rengi, büyük sıra numaraları.
//
// Kullanım mantığı arama ve sıralama öncelikli:
//   1) Ortamı seç (rakı, kokteyl, Michelin…) ya da doğrudan ara.
//   2) Liste puana göre sıralı gelir; satıra dokununca sağdaki panelde
//      (telefonda tam ekran) fotoğraf, harita ve "Google Haritalar'da aç".
//   3) Mekân adına/📍'ya dokunmak doğrudan Google Haritalar'da mekânı açar.
//
// Puan: editoryal "rehber puanı". Sunucuda GOOGLE_PLACES_API_KEY varsa canlı
// Google puanı, yorum sayısı ve mekân fotoğrafı da gelir (bkz. /api/mekan-google).

const R = {
  zemin: "#0b0b0d",
  panel: "#141417",
  panel2: "#1b1b1f",
  cizgi: "rgba(255,255,255,.09)",
  metin: "#f4f1ea",
  soluk: "#a19d94",
  silik: "#6c6962",
  vurgu: "#f4f1ea",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const fiyatSimge = (f) => FIYATLAR.find((x) => x.id === f)?.simge || "";
const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");
const ana = (m) => ortamBul(m.ortamlar[0]);
const sayiTR = (n) => new Intl.NumberFormat("tr-TR").format(n);

// ---------- canlı Google verisi (anahtar varsa) ----------
function useGoogle() {
  const [aktif, setAktif] = useState(false);
  const [veri, setVeri] = useState({});
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const d = await (await fetch("/api/mekan-google")).json();
        if (!d.aktif || iptal) return;
        setAktif(true);
        const kuyruk = [...MEKANLAR];
        const isci = async () => {
          while (kuyruk.length && !iptal) {
            const m = kuyruk.shift();
            try {
              const r = await (await fetch(`/api/mekan-google?q=${encodeURIComponent(m.harita)}`)).json();
              if (!iptal && (r.puan || r.foto)) setVeri((v) => ({ ...v, [m.id]: r }));
            } catch {}
          }
        };
        await Promise.all(Array.from({ length: 5 }, isci));
      } catch {}
    })();
    return () => { iptal = true; };
  }, []);
  return { aktif, veri };
}

function useDar() {
  const [dar, setDar] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const f = () => setDar(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return dar;
}

export default function IstanbulRehberi({ data, setData }) {
  const kayit = data || {};
  const favoriler = Array.isArray(kayit.favoriler) ? kayit.favoriler : [];
  const gittim = Array.isArray(kayit.gittim) ? kayit.gittim : [];
  const notlar = kayit.notlar && typeof kayit.notlar === "object" ? kayit.notlar : {};

  const google = useGoogle();
  const dar = useDar();

  const [ortam, setOrtam] = useState("hepsi");
  const [arama, setArama] = useState("");
  const [yaka, setYaka] = useState("hepsi");
  const [durum, setDurum] = useState(null);
  const [fiyatlar, setFiyatlar] = useState([]);
  const [sirala, setSirala] = useState("puan");
  const [liste, setListe] = useState("hepsi"); // hepsi | fav | gittim
  const [seciliId, setSeciliId] = useState(null);
  const [sayfaAcik, setSayfaAcik] = useState(false);

  const listeDegis = (alan, id) =>
    setData((s) => {
      const l = Array.isArray((s || {})[alan]) ? s[alan] : [];
      return { ...(s || {}), [alan]: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] };
    });
  const isaret = {
    fav: (id) => favoriler.includes(id),
    git: (id) => gittim.includes(id),
    favDegis: (id) => listeDegis("favoriler", id),
    gitDegis: (id) => listeDegis("gittim", id),
  };
  const notYaz = (id, metin) => setData((s) => ({ ...(s || {}), notlar: { ...((s || {}).notlar || {}), [id]: metin } }));

  const puanOf = (m) => m.puan;
  const sonuc = useMemo(() => {
    const t = kucuk(arama.trim());
    let l = MEKANLAR.filter((m) =>
      (ortam === "hepsi" || m.ortamlar.includes(ortam)) &&
      (yaka === "hepsi" || m.yaka === yaka) &&
      (!durum || m.durumlar.includes(durum)) &&
      (!fiyatlar.length || fiyatlar.includes(m.fiyat)) &&
      (liste === "hepsi" || (liste === "fav" ? favoriler.includes(m.id) : gittim.includes(m.id))) &&
      (!t || [m.ad, m.semt, m.imza, m.not, ...m.etiketler, ...m.ortamlar.map((o) => ortamBul(o).ad)].some((x) => kucuk(x).includes(t))));
    const g = google.veri;
    if (sirala === "puan") l = [...l].sort((a, b) => puanOf(b) - puanOf(a));
    else if (sirala === "google") l = [...l].sort((a, b) => (g[b.id]?.puan || 0) - (g[a.id]?.puan || 0) || puanOf(b) - puanOf(a));
    else if (sirala === "ucuz") l = [...l].sort((a, b) => a.fiyat - b.fiyat || puanOf(b) - puanOf(a));
    else if (sirala === "pahali") l = [...l].sort((a, b) => b.fiyat - a.fiyat || puanOf(b) - puanOf(a));
    return l;
  }, [ortam, arama, yaka, durum, fiyatlar, sirala, liste, favoriler, gittim, google.veri]);

  const secili = mekanBul(seciliId) || sonuc[0] || null;
  const sec = (m) => { setSeciliId(m.id); if (dar) setSayfaAcik(true); };
  const fiyatDegis = (f) => setFiyatlar((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]));
  const temizle = () => { setOrtam("hepsi"); setArama(""); setYaka("hepsi"); setDurum(null); setFiyatlar([]); setListe("hepsi"); };
  const ortamRenk = ortam === "hepsi" ? R.vurgu : ortamBul(ortam).renk;

  return (
    <section className="ist" style={{ color: R.metin }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Masthead arama={arama} setArama={setArama} renk={ortamRenk} google={google.aktif} />

      <OrtamSeridi ortam={ortam} setOrtam={(o) => { setOrtam(o); setSeciliId(null); }} />

      <div className="ist-filtre">
        <Segment deger={yaka} onDeger={setYaka} secenekler={[["hepsi", "Tüm şehir"], ["avrupa", "Avrupa"], ["anadolu", "Anadolu"]]} />
        <div className="ist-cipler">
          {DURUMLAR.map((d) => (
            <Cip key={d.id} aktif={durum === d.id} onClick={() => setDurum(durum === d.id ? null : d.id)}>{d.ikon} {d.ad}</Cip>
          ))}
        </div>
        <div className="ist-cipler">
          {FIYATLAR.map((f) => <Cip key={f.id} aktif={fiyatlar.includes(f.id)} onClick={() => fiyatDegis(f.id)} mono>{f.simge}</Cip>)}
          <span style={{ width: 1, alignSelf: "stretch", background: R.cizgi, margin: "0 4px" }} />
          <Cip aktif={liste === "fav"} onClick={() => setListe(liste === "fav" ? "hepsi" : "fav")}>♥ Favorilerim · {favoriler.length}</Cip>
          <Cip aktif={liste === "gittim"} onClick={() => setListe(liste === "gittim" ? "hepsi" : "gittim")}>✓ Gittiklerim · {gittim.length}</Cip>
        </div>
      </div>

      <div className="ist-bar">
        <span style={{ fontFamily: MONO, fontSize: 12.5, color: R.soluk, letterSpacing: ".04em" }}>
          {String(sonuc.length).padStart(2, "0")} MEKÂN{ortam !== "hepsi" ? ` · ${ortamBul(ortam).ad.toLocaleUpperCase("tr")}` : ""}
        </span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={sirala} onChange={(e) => setSirala(e.target.value)} className="ist-select">
            <option value="puan">Sırala: Rehber puanı</option>
            {google.aktif ? <option value="google">Sırala: Google puanı</option> : null}
            <option value="ucuz">Sırala: Uygundan pahalıya</option>
            <option value="pahali">Sırala: Pahalıdan uyguna</option>
          </select>
          <button type="button" onClick={temizle} className="ist-dugme ince">Sıfırla</button>
        </span>
      </div>

      <div className="ist-govde">
        <ol className="ist-liste">
          {sonuc.map((m, i) => (
            <Satir key={m.id} m={m} sira={i + 1} aktif={!dar && secili?.id === m.id} onSec={() => sec(m)}
              isaret={isaret} g={google.veri[m.id]} />
          ))}
          {!sonuc.length ? (
            <li className="ist-bos">
              Bu filtrelerle eşleşen mekân yok.
              <button type="button" onClick={temizle} className="ist-dugme">Filtreleri sıfırla</button>
            </li>
          ) : null}
        </ol>

        {!dar && secili ? (
          <aside className="ist-panel">
            <Detay m={secili} isaret={isaret} not={notlar[secili.id] || ""} onNot={(t) => notYaz(secili.id, t)} g={google.veri[secili.id]} />
          </aside>
        ) : null}
      </div>

      <Geceler onSec={(m) => sec(m)} />

      <p style={{ color: R.silik, fontSize: 11.5, lineHeight: 1.65, margin: "26px 2px 0", maxWidth: 820 }}>
        <b style={{ color: R.soluk }}>Rehber puanı</b> 10 üzerinden editoryal bir değerlendirmedir: ödüller (Michelin 2026, Bib Gourmand),
        Google ve internet yorumlarının genel seviyesi ve tutarlılığı, mekânın kendi türündeki yeri birlikte tartılır.
        {google.aktif ? " Yıldızlı Google puanları ve yorum sayıları canlı olarak Google'dan gelir." : " Canlı Google puanı ve yorum sayısı için her mekânda \"Google yorumları\" bağlantısı var."}
        {" "}Görseller mekânların kendi siteleri, Michelin Rehberi ve Time Out İstanbul sayfalarından alınır. Saat ve fiyatlar değişebilir; gitmeden önce kontrol et.
      </p>

      {dar && sayfaAcik && secili ? (
        <div className="ist-sayfa" role="dialog" aria-modal="true" aria-label={secili.ad}>
          <button type="button" className="ist-kapat" onClick={() => setSayfaAcik(false)} aria-label="Kapat">✕</button>
          <Detay m={secili} isaret={isaret} not={notlar[secili.id] || ""} onNot={(t) => notYaz(secili.id, t)} g={google.veri[secili.id]} />
        </div>
      ) : null}
    </section>
  );
}

// ======================= BAŞLIK =============================================

function Masthead({ arama, setArama, renk, google }) {
  return (
    <header className="ist-mast">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".28em", color: R.soluk }}>İSTANBUL · REHBER · {new Date().getFullYear()}</div>
        <h2 className="ist-baslik">
          Bu gece<br /><span style={{ color: renk, transition: "color .25s" }}>nereye?</span>
        </h2>
        <p style={{ margin: "8px 0 0", color: R.soluk, fontSize: 14, maxWidth: 440, lineHeight: 1.55 }}>
          Şehrin en iyi {MEKANLAR.length} adresi: rakı masasından kokteyl barına, techno kulübünden Michelin yıldızına — puanına göre sıralı.
        </p>
      </div>
      <div className="ist-arama">
        <label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: R.silik }}>ARA</label>
        <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="negroni, Kadıköy, teras, omakase…" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Boğaz", "teras", "canlı", "kendi kavurur", "rezervasyon"].map((k) => (
            <button key={k} type="button" className="ist-oneri" onClick={() => setArama(k)}>{k}</button>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: google ? "#4ade80" : R.silik }}>
          {google ? "● Google puanları canlı" : "○ Rehber puanı · Google yorumları mekân sayfasında"}
        </span>
      </div>
    </header>
  );
}

function OrtamSeridi({ ortam, setOrtam }) {
  const tum = [{ id: "hepsi", ad: "Hepsi", kisa: "Hepsi", ikon: "∗", renk: R.vurgu }, ...ORTAMLAR];
  return (
    <div className="ist-ortamlar">
      {tum.map((o) => {
        const l = o.id === "hepsi" ? MEKANLAR : MEKANLAR.filter((m) => m.ortamlar.includes(o.id));
        const lider = [...l].sort((a, b) => b.puan - a.puan)[0];
        const aktif = ortam === o.id;
        return (
          <button key={o.id} type="button" onClick={() => setOrtam(o.id)} className={aktif ? "ist-ortam aktif" : "ist-ortam"}
            style={{ "--r": o.renk }}>
            <span className="ist-ortam-ikon">{o.ikon}</span>
            <span className="ist-ortam-ad">{o.kisa}</span>
            <span className="ist-ortam-alt">{l.length} yer{lider ? ` · ${lider.ad}` : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

// ======================= LİSTE SATIRI =======================================

function Satir({ m, sira, aktif, onSec, isaret, g }) {
  const o = ana(m);
  const fav = isaret.fav(m.id);
  const git = isaret.git(m.id);
  const odul = m.odul ? ODULLER[m.odul] : null;
  return (
    <li className={aktif ? "ist-satir aktif" : "ist-satir"} style={{ "--r": o.renk }} onClick={onSec}>
      <span className="ist-sira" style={{ color: sira <= 3 ? o.renk : R.silik }}>{String(sira).padStart(2, "0")}</span>
      <Kapak m={m} g={g} boy="kucuk" />
      <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <a href={haritaLink(m.harita)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="ist-ad" title="Google Haritalar'da aç">{m.ad}</a>
          {odul ? <span className="ist-odul" style={{ color: odul.renk, borderColor: `${odul.renk}66` }}>{odul.kisa}</span> : null}
          {m.yesil ? <span className="ist-odul" style={{ color: "#86efac", borderColor: "#86efac66" }}>Yeşil Yıldız</span> : null}
          {git ? <span className="ist-odul" style={{ color: "#4ade80", borderColor: "#4ade8066" }}>✓ Gittim</span> : null}
        </div>
        <div style={{ fontSize: 12.5, color: R.soluk, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {m.ortamlar.map((id) => {
            const x = ortamBul(id);
            return <span key={id} style={{ color: x.renk, fontWeight: 800 }}>{x.ikon} {x.kisa}</span>;
          })}
          <span style={{ color: R.silik }}>/</span>
          <span>{m.semt}</span>
          <span style={{ color: R.silik }}>/</span>
          <span style={{ fontFamily: MONO, color: R.metin }}>{fiyatSimge(m.fiyat)}</span>
        </div>
        <div className="ist-imza"><span style={{ color: R.silik }}>İmza →</span> {m.imza}</div>
      </div>
      <div className="ist-sag">
        <Puan m={m} g={g} />
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className={fav ? "ist-ikon aktif" : "ist-ikon"} title={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
            onClick={(e) => { e.stopPropagation(); isaret.favDegis(m.id); }} style={fav ? { color: "#f472b6" } : undefined}>{fav ? "♥" : "♡"}</button>
          <a className="ist-ikon" href={haritaLink(m.harita)} target="_blank" rel="noopener noreferrer" title="Google Haritalar'da aç"
            onClick={(e) => e.stopPropagation()}>📍</a>
        </div>
      </div>
    </li>
  );
}

function Puan({ m, g, buyuk }) {
  const o = ana(m);
  return (
    <div style={{ textAlign: "right", display: "grid", gap: 3, justifyItems: "end" }}>
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: buyuk ? 40 : 22, lineHeight: 1, color: R.metin }}>
        {m.puan.toFixed(1)}<span style={{ fontSize: buyuk ? 14 : 11, color: R.silik }}>/10</span>
      </div>
      <div style={{ width: buyuk ? 120 : 64, height: 3, borderRadius: 3, background: R.cizgi, overflow: "hidden" }}>
        <div style={{ width: `${m.puan * 10}%`, height: "100%", background: o.renk }} />
      </div>
      {g?.puan ? (
        <div style={{ fontSize: buyuk ? 13 : 11, color: "#fcd34d", fontFamily: MONO, whiteSpace: "nowrap" }}>
          ★ {g.puan.toFixed(1)} <span style={{ color: R.silik }}>({sayiTR(g.yorum || 0)})</span>
        </div>
      ) : buyuk ? <div style={{ fontSize: 11.5, color: R.silik }}>Rehber puanı</div> : null}
    </div>
  );
}

// Fotoğraf varsa fotoğraf + üzerinde mekân adı; yoksa adıyla tasarlanmış kapak.
function Kapak({ m, g, boy }) {
  const [hata, setHata] = useState(false);
  const src = g?.foto || m.gorsel;
  const o = ana(m);
  const kucukMu = boy === "kucuk";
  const style = kucukMu ? { width: 88, height: 88, borderRadius: 12 } : { width: "100%", aspectRatio: "16 / 10", borderRadius: 18 };
  return (
    <div className="ist-kapak" style={{ ...style, "--r": o.renk }}>
      {src && !hata ? (
        <img src={src} alt={m.ad} loading="lazy" referrerPolicy="no-referrer" onError={() => setHata(true)} />
      ) : (
        <div className="ist-poster">
          <span className="ist-poster-ikon">{o.ikon}</span>
        </div>
      )}
      <div className="ist-kapak-ad" style={kucukMu ? { fontSize: 10.5, padding: "0 6px 5px" } : undefined}>
        {kucukMu ? m.ad : (
          <>
            <span style={{ display: "block", fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", color: o.renk }}>{o.ad.toLocaleUpperCase("tr")}</span>
            <span style={{ display: "block", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 900, letterSpacing: "-.02em", lineHeight: 1.05 }}>{m.ad}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ======================= DETAY (panel / tam ekran) ==========================

function Detay({ m, isaret, not, onNot, g }) {
  const o = ana(m);
  const fav = isaret.fav(m.id);
  const git = isaret.git(m.id);
  const odul = m.odul ? ODULLER[m.odul] : null;
  const google = g?.harita || haritaLink(m.harita);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Kapak m={m} g={g} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: R.soluk }}>
            {m.semt} · {m.yaka === "anadolu" ? "Anadolu" : "Avrupa"} yakası · <span style={{ fontFamily: MONO, color: R.metin }}>{fiyatSimge(m.fiyat)}</span>
          </div>
          {g?.adres ? <div style={{ fontSize: 12, color: R.silik }}>{g.adres}</div> : null}
          {odul || m.yesil ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {odul ? <span className="ist-odul" style={{ color: odul.renk, borderColor: `${odul.renk}66` }}>{odul.ad} · 2026</span> : null}
              {m.yesil ? <span className="ist-odul" style={{ color: "#86efac", borderColor: "#86efac66" }}>Michelin Yeşil Yıldızı</span> : null}
            </div>
          ) : null}
        </div>
        <Puan m={m} g={g} buyuk />
      </div>

      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65 }}>{m.not}</p>
      <div style={{ padding: "10px 12px", borderRadius: 12, background: R.panel2, borderLeft: `3px solid ${o.renk}`, fontSize: 13.5 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", color: o.renk }}>İMZA</span>
        <div style={{ marginTop: 3 }}>{m.imza}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {m.etiketler.map((e) => <span key={e} className="ist-etiket">{e}</span>)}
        {m.durumlar.map((id) => {
          const d = DURUMLAR.find((x) => x.id === id);
          return <span key={id} className="ist-etiket">{d.ikon} {d.ad}</span>;
        })}
      </div>

      <a href={google} target="_blank" rel="noopener noreferrer" className="ist-harita" title="Google Haritalar'da aç">
        <iframe key={m.id} title={`${m.ad} haritası`} src={haritaGomulu(m.harita)} referrerPolicy="no-referrer-when-downgrade" />
      </a>

      <div className="ist-eylemler">
        <a href={google} target="_blank" rel="noopener noreferrer" className="ist-dugme ana" style={{ background: o.renk }}>📍 Google Haritalar'da aç</a>
        <a href={yolTarifi(m.harita)} target="_blank" rel="noopener noreferrer" className="ist-dugme">🧭 Yol tarifi</a>
        <a href={google} target="_blank" rel="noopener noreferrer" className="ist-dugme">★ Google yorumları</a>
        {m.site || g?.site ? <a href={m.site || g.site} target="_blank" rel="noopener noreferrer" className="ist-dugme">↗ Web sitesi / rezervasyon</a> : null}
        <button type="button" className="ist-dugme" onClick={() => isaret.favDegis(m.id)} style={fav ? { color: "#f472b6", borderColor: "#f472b688" } : undefined}>
          {fav ? "♥ Favorilerde" : "♡ Favorilere ekle"}
        </button>
        <button type="button" className="ist-dugme" onClick={() => isaret.gitDegis(m.id)} style={git ? { color: "#4ade80", borderColor: "#4ade8088" } : undefined}>
          {git ? "✓ Gittim" : "Gittim olarak işaretle"}
        </button>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", color: R.silik }}>KENDİ NOTUN</span>
        <textarea value={not} onChange={(e) => onNot(e.target.value)} rows={2} className="ist-not"
          placeholder="Ör. bar tarafında otur, cuma çok kalabalık, şu kokteyli dene…" />
      </label>
    </div>
  );
}

// ======================= HAZIR GECELER ======================================

function Geceler({ onSec }) {
  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <h3 className="ist-h3">Hazır geceler</h3>
        <span style={{ color: R.soluk, fontSize: 13 }}>Birbirine yakın duraklar — tüm rotayı tek tıkla Google Haritalar'da aç.</span>
      </div>
      <div className="ist-geceler">
        {GECELER.map((gc) => {
          const o = ortamBul(gc.ortam);
          const duraklar = gc.adimlar.map((a) => mekanBul(a[1]));
          return (
            <article key={gc.id} className="ist-gece" style={{ "--r": o.renk }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", color: o.renk }}>{o.ikon} {o.kisa.toLocaleUpperCase("tr")}</div>
              <h4 style={{ margin: "4px 0 12px", fontSize: 18, fontWeight: 900, letterSpacing: "-.01em" }}>{gc.ad}</h4>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {gc.adimlar.map(([saat, id, aciklama]) => {
                  const m = mekanBul(id);
                  return (
                    <li key={id} style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12.5, color: R.soluk, paddingTop: 1 }}>{saat}</span>
                      <span style={{ fontSize: 13, lineHeight: 1.45 }}>
                        <button type="button" onClick={() => onSec(m)} className="ist-link">{m.ad}</button>
                        <span style={{ display: "block", color: R.soluk }}>{aciklama}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <a href={rotaLink(duraklar)} target="_blank" rel="noopener noreferrer" className="ist-dugme" style={{ marginTop: 14, width: "100%" }}>
                🗺️ Rotayı Google Haritalar'da aç
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ======================= ORTAK =============================================

function Cip({ aktif, onClick, children, mono }) {
  return (
    <button type="button" onClick={onClick} className={aktif ? "ist-cip aktif" : "ist-cip"} style={mono ? { fontFamily: MONO } : undefined}>
      {children}
    </button>
  );
}

function Segment({ deger, onDeger, secenekler }) {
  return (
    <div className="ist-segment">
      {secenekler.map(([id, ad]) => (
        <button key={id} type="button" onClick={() => onDeger(id)} className={deger === id ? "aktif" : ""}>{ad}</button>
      ))}
    </div>
  );
}

const CSS = `
.ist { --zemin:${R.zemin}; background:${R.zemin}; border:1px solid ${R.cizgi}; border-radius:26px; padding:clamp(16px,3vw,30px); }
.ist button, .ist a { font-family: inherit; }
.ist-mast { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:24px; align-items:end; padding-bottom:22px; border-bottom:1px solid ${R.cizgi}; margin-bottom:18px; }
.ist-baslik { margin:10px 0 0; font-size:clamp(46px,8vw,92px); line-height:.9; font-weight:900; letter-spacing:-.045em; text-transform:none; }
.ist-arama { display:grid; gap:10px; }
.ist-arama input { width:100%; box-sizing:border-box; height:58px; padding:0 18px; border-radius:16px; background:${R.panel}; border:1.5px solid ${R.cizgi}; color:${R.metin}; font-size:17px; outline:none; transition:border-color .2s; }
.ist-arama input:focus { border-color:${R.metin}; }
.ist-oneri { padding:5px 10px; border-radius:999px; border:1px dashed ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12px; cursor:pointer; }
.ist-oneri:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-ortamlar { display:grid; grid-template-columns:repeat(9,minmax(0,1fr)); gap:8px; margin-bottom:14px; }
.ist-ortam { position:relative; display:grid; gap:2px; justify-items:start; text-align:left; padding:12px 12px 11px; border-radius:16px; cursor:pointer; background:${R.panel}; border:1px solid ${R.cizgi}; color:${R.metin}; overflow:hidden; transition:transform .15s, border-color .2s, box-shadow .2s; }
.ist-ortam:hover { transform:translateY(-2px); border-color:color-mix(in srgb, var(--r) 55%, transparent); }
.ist-ortam.aktif { border-color:var(--r); box-shadow:0 0 0 1px var(--r), 0 10px 30px -12px var(--r); background:color-mix(in srgb, var(--r) 14%, ${R.panel}); }
.ist-ortam-ikon { font-size:20px; color:var(--r); line-height:1.2; }
.ist-ortam-ad { font-weight:900; font-size:14px; letter-spacing:-.01em; }
.ist-ortam-alt { font-size:11px; color:${R.silik}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.ist-filtre { display:flex; flex-wrap:wrap; gap:8px 14px; align-items:center; padding:12px 0; border-top:1px solid ${R.cizgi}; border-bottom:1px solid ${R.cizgi}; }
.ist-cipler { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.ist-cip { padding:7px 11px; border-radius:999px; border:1px solid ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap; }
.ist-cip:hover { color:${R.metin}; }
.ist-cip.aktif { background:${R.metin}; color:${R.zemin}; border-color:${R.metin}; }
.ist-segment { display:inline-flex; padding:3px; border-radius:12px; background:${R.panel}; border:1px solid ${R.cizgi}; }
.ist-segment button { padding:7px 12px; border:none; border-radius:9px; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:800; cursor:pointer; }
.ist-segment button.aktif { background:${R.metin}; color:${R.zemin}; }
.ist-bar { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; padding:14px 0 10px; }
.ist-select { height:36px; padding:0 10px; border-radius:10px; background:${R.panel}; border:1px solid ${R.cizgi}; color:${R.metin}; font-size:12.5px; }
.ist-govde { display:grid; grid-template-columns:minmax(0,1fr) minmax(340px,420px); gap:18px; align-items:start; }
.ist-liste { list-style:none; margin:0; padding:0; display:grid; gap:6px; }
.ist-satir { display:grid; grid-template-columns:38px 88px minmax(0,1fr) auto; gap:14px; align-items:center; padding:10px 12px 10px 8px; border-radius:16px; cursor:pointer; border:1px solid transparent; transition:background .15s, border-color .15s; }
.ist-satir:hover { background:${R.panel}; }
.ist-satir.aktif { background:${R.panel}; border-color:var(--r); box-shadow:inset 3px 0 0 var(--r); }
.ist-sira { font-family:${MONO}; font-size:22px; font-weight:800; text-align:center; }
.ist-ad { color:${R.metin}; font-weight:900; font-size:17px; letter-spacing:-.01em; text-decoration:none; }
.ist-ad:hover { text-decoration:underline; text-decoration-color:var(--r); text-underline-offset:4px; }
.ist-imza { font-size:12.5px; color:${R.metin}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ist-sag { display:grid; gap:8px; justify-items:end; }
.ist-odul { font-family:${MONO}; font-size:10.5px; letter-spacing:.06em; padding:2px 7px; border-radius:6px; border:1px solid; white-space:nowrap; }
.ist-ikon { display:grid; place-items:center; width:32px; height:32px; border-radius:10px; border:1px solid ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:14px; cursor:pointer; text-decoration:none; }
.ist-ikon:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-kapak { position:relative; overflow:hidden; background:${R.panel2}; flex-shrink:0; }
.ist-kapak img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.ist-kapak::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, transparent 40%, rgba(0,0,0,.85)); pointer-events:none; }
.ist-kapak-ad { position:absolute; left:0; right:0; bottom:0; z-index:1; padding:0 18px 16px; color:#fff; font-weight:900; text-shadow:0 1px 12px rgba(0,0,0,.6); line-height:1.1; }
.ist-poster { position:absolute; inset:0; background:radial-gradient(120% 90% at 85% 10%, color-mix(in srgb, var(--r) 55%, transparent), transparent 60%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 2px, transparent 2px 9px), ${R.panel2}; }
.ist-poster-ikon { position:absolute; right:10%; top:8%; font-size:clamp(28px,6vw,90px); color:var(--r); opacity:.85; }
.ist-panel { position:sticky; top:14px; max-height:calc(100vh - 28px); overflow-y:auto; padding:14px; border-radius:22px; background:${R.panel}; border:1px solid ${R.cizgi}; scrollbar-width:thin; }
.ist-harita { display:block; border-radius:16px; overflow:hidden; border:1px solid ${R.cizgi}; }
.ist-harita iframe { display:block; width:100%; height:230px; border:0; pointer-events:none; filter:grayscale(.3) contrast(1.05); }
.ist-eylemler { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
.ist-eylemler .ana { grid-column:1 / -1; }
.ist-dugme { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:40px; padding:0 14px; border-radius:12px; border:1px solid ${R.cizgi}; background:${R.panel2}; color:${R.metin}; font-size:13px; font-weight:800; cursor:pointer; text-decoration:none; text-align:center; box-sizing:border-box; }
.ist-dugme:hover { border-color:${R.soluk}; }
.ist-dugme.ana { color:#111; border:none; }
.ist-dugme.ince { min-height:36px; background:transparent; }
.ist-etiket { font-size:12px; padding:4px 9px; border-radius:999px; border:1px solid ${R.cizgi}; color:${R.soluk}; }
.ist-not { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; background:${R.panel2}; border:1px solid ${R.cizgi}; color:${R.metin}; font:inherit; font-size:13.5px; resize:vertical; outline:none; }
.ist-bos { display:grid; gap:12px; justify-items:center; padding:40px 16px; border:1px dashed ${R.cizgi}; border-radius:16px; color:${R.soluk}; }
.ist-h3 { margin:0; font-size:26px; font-weight:900; letter-spacing:-.03em; }
.ist-geceler { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:10px; }
.ist-gece { padding:16px; border-radius:18px; background:${R.panel}; border:1px solid ${R.cizgi}; border-top:3px solid var(--r); display:flex; flex-direction:column; }
.ist-gece ol { flex:1; }
.ist-link { background:none; border:none; padding:0; color:${R.metin}; font-weight:800; font-size:13.5px; cursor:pointer; text-decoration:underline; text-decoration-color:${R.silik}; text-underline-offset:3px; text-align:left; }
.ist-sayfa { position:fixed; inset:0; z-index:90; overflow-y:auto; background:${R.zemin}; padding:14px 14px 30px; }
.ist-kapat { position:sticky; top:0; z-index:3; float:right; width:42px; height:42px; margin:0 0 -42px; border-radius:999px; border:1px solid ${R.cizgi}; background:rgba(11,11,13,.85); color:#fff; font-size:18px; cursor:pointer; }
@media (max-width: 1200px) { .ist-ortamlar { grid-template-columns:repeat(5,minmax(0,1fr)); } }
@media (max-width: 980px) {
  .ist-govde { grid-template-columns:1fr; }
  .ist-mast { grid-template-columns:1fr; }
}
@media (max-width: 640px) {
  .ist { border-radius:20px; }
  .ist-ortamlar { display:flex; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
  .ist-ortam { flex:0 0 132px; }
  .ist-satir { grid-template-columns:62px minmax(0,1fr) auto; gap:10px; padding:9px 6px; }
  .ist-sira { display:none; }
  .ist-satir .ist-kapak { width:62px !important; height:62px !important; }
  .ist-satir .ist-kapak-ad { display:none; }
  .ist-imza { display:none; }
  .ist-ad { font-size:15.5px; }
  .ist-eylemler { grid-template-columns:1fr; }
}
`;
