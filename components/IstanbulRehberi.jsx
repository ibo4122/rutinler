"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALANLAR, ORTAMLAR, DURUMLAR, FIYATLAR, ODULLER, BOLGELER, MEKANLAR, ONERILER, GECELER,
  mekanBul, ortamBul, haritaGomulu, haritaLink, yolTarifi, rotaLink, durumPuani,
} from "../lib/istanbul";

// İstanbul Rehberi — "gece listesi" kimliği: siyah zemin, sıcak beyaz yazı,
// her ortamın kendi neon rengi, büyük sıra numaraları ve gerçek mekân
// fotoğrafları. Seyahat alanının turkuaz broşür havasından bilinçli olarak ayrışır.
//
// Gezinme dört soruyla kurulur: NEREDE · KİMİNLE · NE · BÜTÇE. Hepsinin
// varsayılanı "fark etmez"; hiçbir şey seçmek zorunlu değil. Sorulardan birine
// dokununca altında fotoğraflı seçenekler açılır (bölge kartları, ortam
// karoları…). Hiç filtre yokken sayfa bir keşif ekranıdır: ortam karoları,
// semt kartları, numaralı öneri listeleri ve her ortamın en iyileri.
// Bir semt seçilince o semtin restoranları, barları, kafeleri bölüm bölüm gelir.
//
// Puan editoryal "rehber puanı"; GOOGLE_PLACES_API_KEY varsa canlı Google
// puanı, yorum sayısı ve mekân fotoğrafı da gelir (bkz. /api/mekan-google).

const R = {
  zemin: "#0b0b0d",
  panel: "#141417",
  panel2: "#1b1b1f",
  cizgi: "rgba(255,255,255,.09)",
  metin: "#f4f1ea",
  soluk: "#a19d94",
  silik: "#6c6962",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const BOLUM_ILK = 5;
const fiyatSimge = (f) => FIYATLAR.find((x) => x.id === f)?.simge || "";
const kucuk = (s) => String(s || "").toLocaleLowerCase("tr");
const ana = (m) => ortamBul(m.ortamlar[0]) || ORTAMLAR[0];
const sayiTR = (n) => new Intl.NumberFormat("tr-TR").format(n);
const puanSirala = (a, b) => b.puan - a.puan;
// Karolarda aynı fotoğraf iki kez görünmesin: "kullanilan" kümesi verilirse onları atlar.
const enIyiGorsel = (l, kullanilan) => {
  const g = [...l].sort(puanSirala).find((m) => m.gorsel && !kullanilan?.has(m.gorsel))?.gorsel || null;
  if (g && kullanilan) kullanilan.add(g);
  return g;
};
const bolgeBul = (id) => BOLGELER.find((b) => b.id === id) || null;

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

const BOS_FILTRE = { alan: "hepsi", ortam: "hepsi", bolge: "hepsi", durum: "hepsi", fiyat: "hepsi", liste: "hepsi", arama: "" };

export default function IstanbulRehberi({ data, setData }) {
  const kayit = data || {};
  const favoriler = Array.isArray(kayit.favoriler) ? kayit.favoriler : [];
  const gittim = Array.isArray(kayit.gittim) ? kayit.gittim : [];
  const notlar = kayit.notlar && typeof kayit.notlar === "object" ? kayit.notlar : {};

  const google = useGoogle();
  const dar = useDar();

  const [f, setF] = useState(BOS_FILTRE);
  const [oneri, setOneri] = useState(null);
  const [secici, setSecici] = useState(null); // nerede | kiminle | ne | butce
  const [sirala, setSirala] = useState("puan");
  const [acikBolumler, setAcikBolumler] = useState({});
  const [seciliId, setSeciliId] = useState(null);
  const [sayfaAcik, setSayfaAcik] = useState(false);

  const sonuclaraIn = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => document.getElementById("ist-sonuclar")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  // Her filtre değişikliğinde seçim sıfırlanır: panel her zaman görünen listeden bir mekân gösterir.
  const filtre = (degisen, kaydir) => {
    setF((x) => ({ ...x, ...degisen })); setSeciliId(null); setOneri(null); setAcikBolumler({});
    if (kaydir) { setSecici(null); sonuclaraIn(); }
  };
  const sifirla = () => { setF(BOS_FILTRE); setSeciliId(null); setOneri(null); setAcikBolumler({}); setSecici(null); };
  const oneriAc = (id) => { setF(BOS_FILTRE); setOneri(id); setSeciliId(null); setSecici(null); sonuclaraIn(); };

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

  // Ortam dışındaki tüm filtreler
  const uyar = useMemo(() => {
    const t = kucuk(f.arama.trim());
    return (m) =>
      (f.bolge === "hepsi" || (f.bolge === "avrupa" || f.bolge === "anadolu" ? m.yaka === f.bolge : m.bolge === f.bolge)) &&
      (f.durum === "hepsi" || m.durumlar.includes(f.durum)) &&
      (f.fiyat === "hepsi" || m.fiyat === f.fiyat) &&
      (f.liste === "hepsi" || (f.liste === "fav" ? favoriler.includes(m.id) : gittim.includes(m.id))) &&
      (!t || [m.ad, m.semt, bolgeBul(m.bolge)?.ad, m.imza, m.not, ...m.etiketler, ...m.ortamlar.map((o) => ortamBul(o)?.ad)].some((x) => kucuk(x).includes(t)));
  }, [f, favoriler, gittim]);

  const durumObj = DURUMLAR.find((d) => d.id === f.durum) || null;
  const sirali = (l) => {
    const g = google.veri;
    const temel = durumObj ? (a, b) => durumPuani(b, durumObj.id) - durumPuani(a, durumObj.id) : puanSirala;
    if (sirala === "google") return [...l].sort((a, b) => (g[b.id]?.puan || 0) - (g[a.id]?.puan || 0) || temel(a, b));
    if (sirala === "ucuz") return [...l].sort((a, b) => a.fiyat - b.fiyat || temel(a, b));
    if (sirala === "pahali") return [...l].sort((a, b) => b.fiyat - a.fiyat || temel(a, b));
    return [...l].sort(temel);
  };

  // Durum seçiliyse bölümler o durumun öncelik sırasına dizilir.
  const oncelik = (id) => { const i = durumObj ? durumObj.oncelik.indexOf(id) : -1; return i < 0 ? 99 : i; };
  const gorunurOrtamlar = ORTAMLAR.filter((o) => f.alan === "hepsi" || o.alanlar.includes(f.alan))
    .map((o, i) => ({ o, i })).sort((a, b) => oncelik(a.o.id) - oncelik(b.o.id) || a.i - b.i).map((x) => x.o);
  const oneriObj = ONERILER.find((o) => o.id === oneri) || null;
  const filtreVar = Object.keys(BOS_FILTRE).some((k) => f[k] !== BOS_FILTRE[k]);
  const kesif = !oneriObj && !filtreVar;
  const bolumlu = !oneriObj && f.ortam === "hepsi" && !f.arama.trim() && f.liste === "hepsi";

  const gorunum = useMemo(() => {
    if (oneriObj) {
      return { tur: "oneri", satirlar: oneriObj.liste.map(([id, neden]) => ({ m: mekanBul(id), neden })).filter((x) => x.m) };
    }
    if (bolumlu) {
      const bolumler = gorunurOrtamlar
        .map((o) => ({ o, l: sirali(MEKANLAR.filter((m) => m.ortamlar.includes(o.id) && uyar(m))) }))
        .filter((b) => b.l.length);
      return { tur: "bolum", bolumler };
    }
    const l = MEKANLAR.filter((m) =>
      (f.ortam === "hepsi" ? m.ortamlar.some((o) => gorunurOrtamlar.some((g) => g.id === o)) : m.ortamlar.includes(f.ortam)) && uyar(m));
    return { tur: "duz", satirlar: sirali(l).map((m) => ({ m })) };
  }, [oneriObj, bolumlu, f, uyar, sirala, google.veri]);

  const gorunenler = gorunum.tur === "bolum"
    ? gorunum.bolumler.flatMap((b) => (acikBolumler[b.o.id] ? b.l : b.l.slice(0, BOLUM_ILK)))
    : gorunum.satirlar.map((s) => s.m);
  const toplam = gorunum.tur === "bolum" ? new Set(gorunum.bolumler.flatMap((b) => b.l.map((m) => m.id))).size : gorunenler.length;
  const secili = gorunenler.find((m) => m.id === seciliId) || mekanBul(seciliId) || gorunenler[0] || null;
  const sec = (m) => { setSeciliId(m.id); if (dar) setSayfaAcik(true); };

  // Soru kutularındaki değer metinleri
  const neredeMetin = f.bolge === "hepsi" ? "Tüm İstanbul" : f.bolge === "avrupa" ? "Avrupa yakası" : f.bolge === "anadolu" ? "Anadolu yakası" : bolgeBul(f.bolge).ad;
  const neMetin = f.ortam !== "hepsi" ? ortamBul(f.ortam).ad : f.alan !== "hepsi" ? `${ALANLAR.find((a) => a.id === f.alan).ad} — hepsi` : "Her şey";
  const kiminleMetin = durumObj ? durumObj.ad : "Fark etmez";
  const butceMetin = f.fiyat === "hepsi" ? "Fark etmez" : `${fiyatSimge(f.fiyat)} ${FIYATLAR.find((x) => x.id === f.fiyat).ad}`;
  const neRenk = f.ortam !== "hepsi" ? ortamBul(f.ortam).renk : null;

  const sonucBaslik = oneriObj ? oneriObj.ad
    : f.bolge !== "hepsi" && f.ortam === "hepsi" ? `${neredeMetin}: en iyileri`
    : durumObj ? durumObj.baslik
    : f.ortam !== "hepsi" ? ortamBul(f.ortam).ad
    : "Sonuçlar";

  return (
    <section className="ist" style={{ color: R.metin }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Masthead arama={f.arama} setArama={(a) => filtre({ arama: a })} google={google.aktif} />

      {/* ---------- dört soru ---------- */}
      <div className="ist-sorular-sar">
        <div className="ist-sorular">
          <span className="ist-sorular-giris">Bu gece</span>
          <Soru ikon="📍" etiket="Nerede?" deger={neredeMetin} aktif={secici === "nerede"} dolu={f.bolge !== "hepsi"} onClick={() => setSecici(secici === "nerede" ? null : "nerede")} />
          <Soru ikon="👥" etiket="Kiminle?" deger={kiminleMetin} aktif={secici === "kiminle"} dolu={f.durum !== "hepsi"} onClick={() => setSecici(secici === "kiminle" ? null : "kiminle")} />
          <Soru ikon="🍸" etiket="Ne yiyip içelim?" deger={neMetin} renk={neRenk} aktif={secici === "ne"} dolu={f.ortam !== "hepsi" || f.alan !== "hepsi"} onClick={() => setSecici(secici === "ne" ? null : "ne")} />
          <Soru ikon="₺" etiket="Bütçe?" deger={butceMetin} aktif={secici === "butce"} dolu={f.fiyat !== "hepsi"} onClick={() => setSecici(secici === "butce" ? null : "butce")} />
          {filtreVar || oneriObj ? <button type="button" className="ist-sifirla" onClick={sifirla} title="Tüm seçimleri temizle">✕ Temizle</button> : null}
        </div>

        {secici === "nerede" ? <NeredeSecici f={f} onSec={(b) => filtre({ bolge: b }, true)} /> : null}
        {secici === "kiminle" ? <KiminleSecici deger={f.durum} onSec={(d) => filtre({ durum: d }, true)} /> : null}
        {secici === "ne" ? <NeSecici f={f} onSec={(degisen) => filtre(degisen, true)} /> : null}
        {secici === "butce" ? <ButceSecici deger={f.fiyat} onSec={(x) => filtre({ fiyat: x }, true)} /> : null}
      </div>

      {/* ---------- keşif ekranı (hiç filtre yokken) ---------- */}
      {kesif ? (
        <>
          <OrtamKarolari onSec={(id) => filtre({ ortam: id }, true)} />
          <SemtKartlari onSec={(id) => filtre({ bolge: id }, true)} />
          <OneriListesi onAc={oneriAc} />
        </>
      ) : null}

      {/* ---------- sonuç çubuğu ---------- */}
      <div id="ist-sonuclar" className="ist-bar">
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <h3 className="ist-sonuc-baslik">{kesif ? "Her ortamın en iyileri" : sonucBaslik}</h3>
          <span className="ist-sayac">
            {String(toplam).padStart(2, "0")} MEKÂN
            {!kesif && !oneriObj ? ` · ${[neredeMetin, durumObj?.ad, f.ortam !== "hepsi" ? ortamBul(f.ortam).kisa : null, f.fiyat !== "hepsi" ? fiyatSimge(f.fiyat) : null, f.arama.trim() ? `"${f.arama.trim()}"` : null].filter(Boolean).join(" · ")}` : ""}
          </span>
        </div>
        <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="ist-liste-dugmeler">
            <button type="button" className={f.liste === "fav" ? "ist-cip aktif" : "ist-cip"} onClick={() => filtre({ liste: f.liste === "fav" ? "hepsi" : "fav" })}>♥ Favorilerim · {favoriler.length}</button>
            <button type="button" className={f.liste === "gittim" ? "ist-cip aktif" : "ist-cip"} onClick={() => filtre({ liste: f.liste === "gittim" ? "hepsi" : "gittim" })}>✓ Gittiklerim · {gittim.length}</button>
          </span>
          {!oneriObj ? (
            <select value={sirala} onChange={(e) => setSirala(e.target.value)} className="ist-select" aria-label="Sıralama">
              <option value="puan">Sırala: Rehber puanı</option>
              {google.aktif ? <option value="google">Sırala: Google puanı</option> : null}
              <option value="ucuz">Sırala: Uygundan pahalıya</option>
              <option value="pahali">Sırala: Pahalıdan uyguna</option>
            </select>
          ) : null}
        </span>
      </div>

      {f.bolge !== "hepsi" && bolgeBul(f.bolge) && !oneriObj ? <SemtBasligi b={bolgeBul(f.bolge)} /> : null}

      {/* ---------- liste + panel ---------- */}
      <div className="ist-govde">
        <div style={{ minWidth: 0 }}>
          {gorunum.tur === "oneri" ? (
            <>
              <div className="ist-vurgu-baslik" style={{ "--r": oneriObj.renk }}>
                <span style={{ fontSize: 26 }}>{oneriObj.ikon}</span>
                <span><b>{oneriObj.ad}</b><span style={{ display: "block", color: R.soluk, fontSize: 13.5 }}>{oneriObj.ozet}</span></span>
                <button type="button" className="ist-dugme ince" onClick={() => setOneri(null)} style={{ marginLeft: "auto" }}>✕ Kapat</button>
              </div>
              <ol className="ist-liste">
                {gorunum.satirlar.map(({ m, neden }, i) => (
                  <Satir key={m.id} m={m} sira={i + 1} neden={neden} aktif={!dar && secili?.id === m.id} onSec={() => sec(m)} isaret={isaret} g={google.veri[m.id]} />
                ))}
              </ol>
            </>
          ) : gorunum.tur === "bolum" ? (
            <>
              {durumObj ? (
                <p className="ist-aciklama">{durumObj.ikon} Bölümler bu duruma en uygun olandan başlar; her bölümde asıl amacı bu olan yerler öne çıkar.</p>
              ) : null}
              {gorunum.bolumler.length ? gorunum.bolumler.map(({ o, l }) => {
                const acik = !!acikBolumler[o.id];
                return (
                  <section key={o.id} className="ist-bolum" style={{ "--r": o.renk }}>
                    <header className="ist-bolum-baslik">
                      <button type="button" onClick={() => filtre({ ortam: o.id })} className="ist-bolum-ad">
                        <span style={{ color: o.renk }}>{o.ikon}</span> {o.ad} <span className="ist-bolum-sayi">{l.length}</span>
                      </button>
                      <span className="ist-bolum-aciklama">{o.aciklama}</span>
                    </header>
                    <ol className="ist-liste">
                      {(acik ? l : l.slice(0, BOLUM_ILK)).map((m, i) => (
                        <Satir key={m.id} m={m} sira={i + 1} vurgu={o} aktif={!dar && secili?.id === m.id} onSec={() => sec(m)} isaret={isaret} g={google.veri[m.id]} />
                      ))}
                    </ol>
                    {l.length > BOLUM_ILK ? (
                      <button type="button" className="ist-daha" onClick={() => setAcikBolumler((x) => ({ ...x, [o.id]: !acik }))}>
                        {acik ? "Daha az göster ↑" : `${o.kisa}: kalan ${l.length - BOLUM_ILK} mekânı göster ↓`}
                      </button>
                    ) : null}
                  </section>
                );
              }) : <Bos onSifirla={sifirla} />}
            </>
          ) : gorunum.satirlar.length ? (
            <ol className="ist-liste">
              {gorunum.satirlar.map(({ m }, i) => (
                <Satir key={m.id} m={m} sira={i + 1} vurgu={f.ortam !== "hepsi" ? ortamBul(f.ortam) : null} aktif={!dar && secili?.id === m.id} onSec={() => sec(m)} isaret={isaret} g={google.veri[m.id]} />
              ))}
            </ol>
          ) : <Bos onSifirla={sifirla} />}
        </div>

        {!dar && secili ? (
          <aside className="ist-panel">
            <Detay m={secili} isaret={isaret} not={notlar[secili.id] || ""} onNot={(t) => notYaz(secili.id, t)} g={google.veri[secili.id]} />
          </aside>
        ) : null}
      </div>

      <Geceler onSec={sec} />

      <p className="ist-dipnot">
        <b style={{ color: R.soluk }}>Rehber puanı</b> 10 üzerinden editoryal bir değerlendirmedir: ödüller (Michelin 2026, Bib Gourmand),
        Google ve internet yorumlarının genel seviyesi ve tutarlılığı, mekânın kendi türündeki yeri birlikte tartılır.
        {google.aktif ? " Yıldızlı Google puanları ve yorum sayıları canlı olarak Google'dan gelir." : " Canlı Google puanı ve yorum sayısı için her mekânda \"Google yorumları\" bağlantısı var."}
        {" "}Michelin ödülleri ve adresleri 2026 rehberindeki mekân sayfalarından doğrulandı. Görseller Michelin Rehberi, Time Out İstanbul,
        OGGUSTO ve mekânların kendi sitelerinden. Saat ve fiyatlar değişebilir; gitmeden önce kontrol et.
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

function Masthead({ arama, setArama, google }) {
  const yildiz = MEKANLAR.filter((m) => m.odul === "1y" || m.odul === "2y").length;
  const bib = MEKANLAR.filter((m) => m.odul === "bib").length;
  return (
    <header className="ist-mast">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".28em", color: R.soluk }}>İSTANBUL · REHBER · {new Date().getFullYear()}</div>
        <h2 className="ist-baslik">Bu gece<br /><span>nereye?</span></h2>
        <div className="ist-istatistik">
          <span><b>{MEKANLAR.length}</b> mekân</span>
          <span><b>{BOLGELER.length}</b> semt</span>
          <span><b>{ORTAMLAR.length}</b> ortam</span>
          <span><b>{yildiz}</b> yıldızlı</span>
          <span><b>{bib}</b> Bib Gourmand</span>
        </div>
      </div>
      <div className="ist-arama">
        <label htmlFor="ist-ara" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: R.silik }}>ADIYLA YA DA LEZZETLE ARA</label>
        <input id="ist-ara" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Kaburgacı Cabbar, negroni, Suadiye, omakase…" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["kaburga", "istiridye", "canlı müzik", "Bib Gourmand", "teras", "fasıl", "matcha"].map((k) => (
            <button key={k} type="button" className="ist-oneri-kelime" onClick={() => setArama(k)}>{k}</button>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: google ? "#4ade80" : R.silik }}>
          {google ? "● Google puanları canlı" : "○ Rehber puanı · Google yorumları mekân sayfasında"}
        </span>
      </div>
    </header>
  );
}

// ======================= DÖRT SORU ==========================================

function Soru({ ikon, etiket, deger, aktif, dolu, onClick, renk }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={aktif}
      className={["ist-soru", aktif ? "acik" : "", dolu ? "dolu" : ""].join(" ")} style={renk ? { "--r": renk } : undefined}>
      <span className="ist-soru-etiket">{ikon} {etiket}</span>
      <span className="ist-soru-deger">{deger} <span className="ist-soru-ok">{aktif ? "▴" : "▾"}</span></span>
    </button>
  );
}

function SeciciKutu({ baslik, children }) {
  return (
    <div className="ist-secici">
      <div className="ist-secici-baslik">{baslik}</div>
      {children}
    </div>
  );
}

function NeredeSecici({ f, onSec }) {
  const say = (bolge) => MEKANLAR.filter((m) =>
    bolge === "hepsi" || (bolge === "avrupa" || bolge === "anadolu" ? m.yaka === bolge : m.bolge === bolge)).length;
  const kart = (b) => {
    const l = MEKANLAR.filter((m) => m.bolge === b.id);
    return (
      <button key={b.id} type="button" onClick={() => onSec(b.id)} className={f.bolge === b.id ? "ist-semt-mini aktif" : "ist-semt-mini"}>
        <b>{b.ad}</b><span>{b.semtler}</span><em>{l.length}</em>
      </button>
    );
  };
  return (
    <SeciciKutu baslik="Hangi semtte?">
      <div className="ist-cipler" style={{ marginBottom: 10 }}>
        <button type="button" className={f.bolge === "hepsi" ? "ist-cip aktif" : "ist-cip"} onClick={() => onSec("hepsi")}>Tüm İstanbul · {say("hepsi")}</button>
        <button type="button" className={f.bolge === "avrupa" ? "ist-cip aktif" : "ist-cip"} onClick={() => onSec("avrupa")}>Avrupa yakası · {say("avrupa")}</button>
        <button type="button" className={f.bolge === "anadolu" ? "ist-cip aktif" : "ist-cip"} onClick={() => onSec("anadolu")}>Anadolu yakası · {say("anadolu")}</button>
      </div>
      <div className="ist-yakalar">
        <div><div className="ist-yaka-ad">Avrupa</div><div className="ist-semt-izgara">{BOLGELER.filter((b) => b.yaka === "avrupa").map(kart)}</div></div>
        <div><div className="ist-yaka-ad">Anadolu</div><div className="ist-semt-izgara">{BOLGELER.filter((b) => b.yaka === "anadolu").map(kart)}</div></div>
      </div>
    </SeciciKutu>
  );
}

function KiminleSecici({ deger, onSec }) {
  return (
    <SeciciKutu baslik="Kiminle çıkıyorsun?">
      <div className="ist-kiminle">
        <button type="button" className={deger === "hepsi" ? "ist-kiminle-k aktif" : "ist-kiminle-k"} onClick={() => onSec("hepsi")}>
          <span style={{ fontSize: 26 }}>✨</span><b>Fark etmez</b><span>Tüm mekânlar</span>
        </button>
        {DURUMLAR.map((d) => (
          <button key={d.id} type="button" className={deger === d.id ? "ist-kiminle-k aktif" : "ist-kiminle-k"} onClick={() => onSec(d.id)}>
            <span style={{ fontSize: 26 }}>{d.ikon}</span><b>{d.ad}</b><span>{MEKANLAR.filter((m) => m.durumlar.includes(d.id)).length} mekân</span>
          </button>
        ))}
      </div>
    </SeciciKutu>
  );
}

function NeSecici({ f, onSec }) {
  return (
    <SeciciKutu baslik="Ne yiyip içelim?">
      <div className="ist-cipler" style={{ marginBottom: 12 }}>
        <button type="button" className={f.alan === "hepsi" && f.ortam === "hepsi" ? "ist-cip aktif" : "ist-cip"} onClick={() => onSec({ alan: "hepsi", ortam: "hepsi" })}>Her şey</button>
        {ALANLAR.map((a) => (
          <button key={a.id} type="button" className={f.alan === a.id && f.ortam === "hepsi" ? "ist-cip aktif" : "ist-cip"} onClick={() => onSec({ alan: a.id, ortam: "hepsi" })}>
            {a.ikon} {a.ad} — hepsi
          </button>
        ))}
      </div>
      <OrtamIzgara secili={f.ortam} onSec={(id) => onSec({ ortam: id })} kompakt />
    </SeciciKutu>
  );
}

function ButceSecici({ deger, onSec }) {
  const aciklama = { 1: "Esnaf lokantası, döner, kahve", 2: "Meyhane, pizza, bistro", 3: "İyi restoran, kokteyl barı", 4: "Fine dining, otel, Boğaz" };
  return (
    <SeciciKutu baslik="Bütçe ne kadar?">
      <div className="ist-butce">
        <button type="button" className={deger === "hepsi" ? "ist-butce-k aktif" : "ist-butce-k"} onClick={() => onSec("hepsi")}><b>Fark etmez</b><span>Hepsi</span></button>
        {FIYATLAR.map((x) => (
          <button key={x.id} type="button" className={deger === x.id ? "ist-butce-k aktif" : "ist-butce-k"} onClick={() => onSec(x.id)}>
            <b style={{ fontFamily: MONO }}>{x.simge}</b><span>{x.ad} · {aciklama[x.id]}</span>
          </button>
        ))}
      </div>
    </SeciciKutu>
  );
}

// ======================= KEŞİF EKRANI =======================================

function OrtamIzgara({ secili, onSec, kompakt }) {
  const kullanilan = new Set();
  return (
    <div className={kompakt ? "ist-ortam-izgara kompakt" : "ist-ortam-izgara"}>
      {ORTAMLAR.map((o) => {
        const l = MEKANLAR.filter((m) => m.ortamlar.includes(o.id));
        const lider = [...l].sort(puanSirala)[0];
        const kapak = o.kapak ? mekanBul(o.kapak)?.gorsel : null;
        if (kapak) kullanilan.add(kapak);
        const g = kapak || enIyiGorsel(l, kullanilan);
        return (
          <button key={o.id} type="button" onClick={() => onSec(o.id)} className={secili === o.id ? "ist-ortam-karo aktif" : "ist-ortam-karo"} style={{ "--r": o.renk }}>
            {g ? <img src={g} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
            <span className="ist-ortam-karo-ic">
              <span className="ist-ortam-karo-ikon">{o.ikon}</span>
              <b>{o.ad}</b>
              {!kompakt && lider ? <span className="ist-ortam-karo-alt">#1 {lider.ad}</span> : null}
              <em>{l.length} mekân</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OrtamKarolari({ onSec }) {
  return (
    <section className="ist-kesif">
      <BolumBasligi no="01" baslik="Ne arıyorsun?" alt="Karoya dokun, o ortamın puana göre sıralı listesi açılsın." />
      <OrtamIzgara onSec={onSec} />
    </section>
  );
}

function SemtKartlari({ onSec }) {
  const kullanilan = new Set();
  const kart = (b) => {
    const l = MEKANLAR.filter((m) => m.bolge === b.id);
    const g = enIyiGorsel(l, kullanilan);
    const say = (ids) => l.filter((m) => m.ortamlar.some((o) => ids.includes(o))).length;
    return (
      <button key={b.id} type="button" onClick={() => onSec(b.id)} className="ist-semt-kart">
        {g ? <img src={g} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
        <span className="ist-semt-kart-ic">
          <b>{b.ad}</b>
          <span className="ist-semt-kart-alt">{b.aciklama}</span>
          <span className="ist-semt-kart-sayilar">
            <span>🍽 {say(["michelin", "luks", "meyhane", "balik", "kebap", "lokanta", "dunya", "sokak"])}</span>
            <span>🍸 {say(["kokteyl", "sarap", "bira", "kulup", "eglence"])}</span>
            <span>☕ {say(["kahvalti", "kahve", "tatli"])}</span>
          </span>
        </span>
      </button>
    );
  };
  return (
    <section className="ist-kesif">
      <BolumBasligi no="02" baslik="Semt semt İstanbul" alt="Bir semt seç: restoranları, barları, pub'ları ve kafeleri bölüm bölüm gelsin." />
      <div className="ist-yakalar">
        <div><div className="ist-yaka-ad">Avrupa yakası</div><div className="ist-semt-kartlar">{BOLGELER.filter((b) => b.yaka === "avrupa").map(kart)}</div></div>
        <div><div className="ist-yaka-ad">Anadolu yakası</div><div className="ist-semt-kartlar">{BOLGELER.filter((b) => b.yaka === "anadolu").map(kart)}</div></div>
      </div>
    </section>
  );
}

function OneriListesi({ onAc }) {
  return (
    <section className="ist-kesif">
      <BolumBasligi no="03" baslik="Önerilerim" alt="Ne arayacağını bilmiyorsan buradan başla — her listeyi elle seçtim, her mekânın neden orada olduğu yazıyor." />
      <ol className="ist-oneri-liste">
        {ONERILER.map((o, i) => {
          const ilkler = o.liste.slice(0, 4).map(([id]) => mekanBul(id)).filter(Boolean);
          return (
            <li key={o.id}>
              <button type="button" onClick={() => onAc(o.id)} className="ist-oneri-satir" style={{ "--r": o.renk }}>
                <span className="ist-oneri-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="ist-oneri-ikon">{o.ikon}</span>
                <span style={{ minWidth: 0 }}>
                  <b>{o.ad}</b>
                  <span className="ist-oneri-ozet">{o.ozet}</span>
                  <span className="ist-oneri-adlar">{ilkler.map((m) => m.ad).join(" · ")}{o.liste.length > 4 ? " …" : ""}</span>
                </span>
                <span className="ist-oneri-sayi">{o.liste.length}<small>mekân</small></span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function BolumBasligi({ no, baslik, alt }) {
  return (
    <div className="ist-bolum-basligi">
      <span className="ist-bolum-no">{no}</span>
      <div>
        <h3 className="ist-h3">{baslik}</h3>
        <span style={{ color: R.soluk, fontSize: 13 }}>{alt}</span>
      </div>
    </div>
  );
}

function SemtBasligi({ b }) {
  const l = MEKANLAR.filter((m) => m.bolge === b.id);
  const g = enIyiGorsel(l);
  const yildiz = l.filter((m) => m.odul === "1y" || m.odul === "2y" || m.odul === "bib");
  return (
    <div className="ist-semt-baslik">
      {g ? <img src={g} alt="" referrerPolicy="no-referrer" /> : null}
      <div className="ist-semt-baslik-ic">
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: "#fdba74" }}>{b.yaka === "avrupa" ? "AVRUPA YAKASI" : "ANADOLU YAKASI"} · {b.semtler.toLocaleUpperCase("tr")}</span>
        <b>{b.ad}</b>
        <span style={{ color: "#ddd", fontSize: 14 }}>{b.aciklama} {l.length} mekân{yildiz.length ? `, ${yildiz.length} Michelin yıldızı/Bib Gourmand` : ""}.</span>
      </div>
    </div>
  );
}

// ======================= LİSTE SATIRI =======================================

function Satir({ m, sira, aktif, onSec, isaret, g, neden, vurgu }) {
  const o = vurgu || ana(m);
  const fav = isaret.fav(m.id);
  const git = isaret.git(m.id);
  const odul = m.odul ? ODULLER[m.odul] : null;
  return (
    <li className={aktif ? "ist-satir aktif" : "ist-satir"} style={{ "--r": o.renk }} onClick={onSec}>
      <span className="ist-sira" style={{ color: sira <= 3 ? o.renk : R.silik }}>{String(sira).padStart(2, "0")}</span>
      <Kapak m={m} g={g} boy="kucuk" />
      <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <a href={g?.harita || haritaLink(m.harita)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="ist-ad" title="Google Haritalar'da aç">{m.ad}</a>
          {odul ? <span className="ist-odul" style={{ color: odul.renk, borderColor: `${odul.renk}66` }}>{odul.kisa}</span> : null}
          {m.yesil ? <span className="ist-odul" style={{ color: "#86efac", borderColor: "#86efac66" }}>Yeşil Yıldız</span> : null}
          {git ? <span className="ist-odul" style={{ color: "#4ade80", borderColor: "#4ade8066" }}>✓ Gittim</span> : null}
        </div>
        <div className="ist-meta">
          {m.ortamlar.filter((id) => id !== "michelin" || !m.odul).slice(0, 3).map((id) => {
            const x = ortamBul(id);
            return <span key={id} style={{ color: x.renk, fontWeight: 800 }}>{x.ikon} {x.kisa}</span>;
          })}
          <span style={{ color: R.silik }}>/</span>
          <span>{m.semt}</span>
          <span style={{ color: R.silik }}>/</span>
          <span style={{ fontFamily: MONO, color: R.metin }}>{fiyatSimge(m.fiyat)}</span>
        </div>
        {neden ? (
          <div className="ist-neden"><span style={{ color: o.renk }}>Neden →</span> {neden}</div>
        ) : (
          <div className="ist-imza"><span style={{ color: R.silik }}>İmza →</span> {m.imza}</div>
        )}
      </div>
      <div className="ist-sag">
        <Puan m={m} g={g} />
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className="ist-ikon" title={fav ? "Favorilerden çıkar" : "Favorilere ekle"} aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
            onClick={(e) => { e.stopPropagation(); isaret.favDegis(m.id); }} style={fav ? { color: "#f472b6", borderColor: "#f472b688" } : undefined}>{fav ? "♥" : "♡"}</button>
          <a className="ist-ikon" href={g?.harita || haritaLink(m.harita)} target="_blank" rel="noopener noreferrer" title="Google Haritalar'da aç"
            aria-label="Google Haritalar'da aç" onClick={(e) => e.stopPropagation()}>📍</a>
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
  useEffect(() => { setHata(false); }, [src]);
  return (
    <div className="ist-kapak" style={{ ...style, "--r": o.renk }}>
      {src && !hata ? (
        <img src={src} alt={m.ad} loading="lazy" referrerPolicy="no-referrer" onError={() => setHata(true)} />
      ) : (
        <div className="ist-poster"><span className="ist-poster-ikon">{o.ikon}</span></div>
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
  const listeler = ONERILER.filter((x) => x.liste.some(([id]) => id === m.id));
  const b = bolgeBul(m.bolge);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Kapak m={m} g={g} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: R.soluk }}>
            {m.semt}{b ? ` · ${b.ad}` : ""} · <span style={{ fontFamily: MONO, color: R.metin }}>{fiyatSimge(m.fiyat)}</span>
          </div>
          {g?.adres || m.adres ? <div style={{ fontSize: 12, color: R.silik }}>📍 {g?.adres || m.adres}</div> : null}
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
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", color: o.renk }}>NE YENİR / NE İÇİLİR</span>
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

      {listeler.length ? (
        <div style={{ fontSize: 12.5, color: R.soluk }}>
          Önerilerimde: {listeler.map((x) => `${x.ikon} ${x.ad}`).join(" · ")}
        </div>
      ) : null}

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

function Bos({ onSifirla }) {
  return (
    <div className="ist-bos">
      Bu seçimlerle eşleşen mekân yok — bir soruyu "fark etmez"e çevirmeyi dene.
      <button type="button" onClick={onSifirla} className="ist-dugme">Seçimleri temizle</button>
    </div>
  );
}

const CSS = `
.ist { background:${R.zemin}; border:1px solid ${R.cizgi}; border-radius:26px; padding:clamp(16px,3vw,30px); }
.ist button, .ist a, .ist input, .ist select { font-family: inherit; }
.ist-mast { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:24px; align-items:end; padding-bottom:22px; border-bottom:1px solid ${R.cizgi}; margin-bottom:18px; }
.ist-baslik { margin:10px 0 12px; font-size:clamp(46px,8vw,92px); line-height:.9; font-weight:900; letter-spacing:-.045em; }
.ist-baslik span { background:linear-gradient(90deg,#f472b6,#e8c25a 45%,#7dd3fc); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ist-istatistik { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:12.5px; color:${R.soluk}; }
.ist-istatistik b { color:${R.metin}; font-family:${MONO}; font-size:14px; }
.ist-arama { display:grid; gap:10px; }
.ist-arama input { width:100%; box-sizing:border-box; height:58px; padding:0 18px; border-radius:16px; background:${R.panel}; border:1.5px solid ${R.cizgi}; color:${R.metin}; font-size:17px; outline:none; transition:border-color .2s; }
.ist-arama input:focus { border-color:${R.metin}; }
.ist-oneri-kelime { padding:5px 10px; border-radius:999px; border:1px dashed ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12px; cursor:pointer; }
.ist-oneri-kelime:hover { color:${R.metin}; border-color:${R.soluk}; }

/* --- dört soru --- */
.ist-sorular-sar { position:sticky; top:8px; z-index:6; margin-bottom:22px; }
.ist-sorular { display:grid; grid-template-columns:auto repeat(4,minmax(0,1fr)) auto; gap:8px; align-items:stretch; padding:8px; border-radius:22px; background:rgba(20,20,23,.92); border:1px solid ${R.cizgi}; backdrop-filter:blur(10px); box-shadow:0 18px 50px -24px rgba(0,0,0,.9); }
.ist-sorular-giris { align-self:center; padding:0 10px 0 8px; font-size:20px; font-weight:900; letter-spacing:-.02em; white-space:nowrap; }
.ist-soru { --r:${R.metin}; display:grid; gap:3px; text-align:left; padding:10px 14px; border-radius:15px; border:1px solid transparent; background:${R.panel2}; color:${R.metin}; cursor:pointer; min-width:0; transition:background .15s, border-color .15s, transform .15s; }
.ist-soru:hover { border-color:${R.soluk}; transform:translateY(-1px); }
.ist-soru.dolu { background:color-mix(in srgb, var(--r) 16%, ${R.panel2}); border-color:color-mix(in srgb, var(--r) 55%, transparent); }
.ist-soru.acik { border-color:${R.metin}; background:${R.metin}; color:${R.zemin}; }
.ist-soru-etiket { font-family:${MONO}; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; opacity:.7; white-space:nowrap; }
.ist-soru-deger { font-size:15px; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ist-soru-ok { opacity:.5; font-size:11px; }
.ist-sifirla { align-self:center; padding:10px 12px; border-radius:12px; border:1px solid ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:800; cursor:pointer; white-space:nowrap; }
.ist-sifirla:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-secici { margin-top:8px; padding:16px; border-radius:20px; background:${R.panel}; border:1px solid ${R.cizgi}; box-shadow:0 30px 60px -30px rgba(0,0,0,.95); max-height:min(70vh,640px); overflow-y:auto; animation:ist-ac .18s ease-out; }
@keyframes ist-ac { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
.ist-secici-baslik { font-size:20px; font-weight:900; letter-spacing:-.02em; margin-bottom:12px; }
.ist-yakalar { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.ist-yaka-ad { font-family:${MONO}; font-size:11px; letter-spacing:.2em; color:${R.silik}; text-transform:uppercase; margin-bottom:8px; }
.ist-semt-izgara { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr)); gap:6px; }
.ist-semt-mini { position:relative; display:grid; gap:1px; text-align:left; padding:10px 40px 10px 12px; border-radius:12px; border:1px solid ${R.cizgi}; background:${R.zemin}; color:${R.metin}; cursor:pointer; }
.ist-semt-mini:hover { border-color:${R.soluk}; }
.ist-semt-mini.aktif { background:${R.metin}; color:${R.zemin}; }
.ist-semt-mini b { font-size:14px; }
.ist-semt-mini span { font-size:11.5px; opacity:.65; }
.ist-semt-mini em { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-style:normal; font-family:${MONO}; font-size:13px; opacity:.7; }
.ist-kiminle { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr)); gap:8px; }
.ist-kiminle-k, .ist-butce-k { display:grid; gap:4px; justify-items:start; text-align:left; padding:14px; border-radius:16px; border:1px solid ${R.cizgi}; background:${R.zemin}; color:${R.metin}; cursor:pointer; transition:transform .15s, border-color .15s; }
.ist-kiminle-k:hover, .ist-butce-k:hover { transform:translateY(-2px); border-color:${R.soluk}; }
.ist-kiminle-k.aktif, .ist-butce-k.aktif { background:${R.metin}; color:${R.zemin}; border-color:${R.metin}; }
.ist-kiminle-k b, .ist-butce-k b { font-size:15px; }
.ist-kiminle-k span:last-child, .ist-butce-k span { font-size:12px; opacity:.65; }
.ist-butce { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(180px,100%),1fr)); gap:8px; }
.ist-butce-k b { font-size:22px; }

/* --- keşif --- */
.ist-kesif { margin-bottom:34px; }
.ist-bolum-basligi { display:flex; gap:14px; align-items:flex-end; margin-bottom:14px; }
.ist-bolum-no { font-family:${MONO}; font-size:44px; line-height:.8; font-weight:800; color:transparent; -webkit-text-stroke:1px ${R.soluk}; }
.ist-h3 { margin:0; font-size:26px; font-weight:900; letter-spacing:-.03em; }
.ist-ortam-izgara { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(170px,100%),1fr)); gap:10px; }
.ist-ortam-izgara.kompakt { grid-template-columns:repeat(auto-fill,minmax(min(140px,100%),1fr)); }
.ist-ortam-karo { position:relative; aspect-ratio:4 / 5; border-radius:18px; overflow:hidden; border:1px solid ${R.cizgi}; background:${R.panel2}; cursor:pointer; padding:0; color:#fff; text-align:left; transition:transform .18s, box-shadow .2s, border-color .2s; }
.ist-ortam-izgara.kompakt .ist-ortam-karo { aspect-ratio:1 / 1; }
.ist-ortam-karo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .5s; }
.ist-ortam-karo::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.05) 25%, rgba(0,0,0,.88)); }
.ist-ortam-karo:hover { transform:translateY(-3px); border-color:var(--r); box-shadow:0 16px 36px -16px var(--r); }
.ist-ortam-karo:hover img { transform:scale(1.06); }
.ist-ortam-karo.aktif { border-color:var(--r); box-shadow:0 0 0 2px var(--r); }
.ist-ortam-karo-ic { position:absolute; left:12px; right:12px; bottom:12px; z-index:1; display:grid; gap:2px; }
.ist-ortam-karo-ikon { color:var(--r); font-size:20px; text-shadow:0 0 18px var(--r); }
.ist-ortam-karo-ic b { font-size:16px; line-height:1.15; letter-spacing:-.01em; }
.ist-ortam-karo-alt { font-size:11.5px; opacity:.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ist-ortam-karo-ic em { font-style:normal; font-family:${MONO}; font-size:11px; color:var(--r); }
.ist-semt-kartlar { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr)); gap:8px; }
.ist-semt-kart { position:relative; min-height:128px; border-radius:16px; overflow:hidden; border:1px solid ${R.cizgi}; background:${R.panel2}; cursor:pointer; padding:0; color:#fff; text-align:left; transition:transform .18s, border-color .2s; }
.ist-semt-kart img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.5; transition:opacity .25s, transform .5s; }
.ist-semt-kart::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,.85), rgba(0,0,0,.25)); }
.ist-semt-kart:hover { transform:translateY(-2px); border-color:#fdba74; }
.ist-semt-kart:hover img { opacity:.75; transform:scale(1.05); }
.ist-semt-kart-ic { position:relative; z-index:1; display:grid; gap:4px; padding:14px; }
.ist-semt-kart-ic b { font-size:17px; letter-spacing:-.01em; }
.ist-semt-kart-alt { font-size:12px; color:#ddd; line-height:1.4; }
.ist-semt-kart-sayilar { display:flex; gap:10px; font-family:${MONO}; font-size:12px; color:#fdba74; margin-top:2px; }
.ist-oneri-liste { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(min(440px,100%),1fr)); gap:6px; }
.ist-oneri-satir { width:100%; display:grid; grid-template-columns:44px 40px minmax(0,1fr) auto; gap:10px; align-items:center; text-align:left; padding:12px 14px; border-radius:16px; border:1px solid ${R.cizgi}; background:${R.panel}; color:${R.metin}; cursor:pointer; transition:border-color .15s, background .15s; }
.ist-oneri-satir:hover { border-color:var(--r); background:color-mix(in srgb, var(--r) 9%, ${R.panel}); }
.ist-oneri-no { font-family:${MONO}; font-size:22px; font-weight:800; color:var(--r); }
.ist-oneri-ikon { font-size:24px; }
.ist-oneri-satir b { display:block; font-size:16px; letter-spacing:-.01em; }
.ist-oneri-ozet { display:block; font-size:12.5px; color:${R.soluk}; }
.ist-oneri-adlar { display:block; font-size:11.5px; color:${R.silik}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.ist-oneri-sayi { font-family:${MONO}; font-size:20px; font-weight:800; text-align:right; display:grid; }
.ist-oneri-sayi small { font-size:10px; color:${R.silik}; font-weight:400; }

/* --- sonuçlar --- */
.ist-bar { display:flex; justify-content:space-between; align-items:flex-end; gap:10px; flex-wrap:wrap; padding:6px 0 14px; border-bottom:1px solid ${R.cizgi}; margin-bottom:12px; scroll-margin-top:110px; }
.ist-sonuc-baslik { margin:0; font-size:24px; font-weight:900; letter-spacing:-.03em; }
.ist-sayac { font-family:${MONO}; font-size:12px; color:${R.soluk}; letter-spacing:.04em; }
.ist-liste-dugmeler { display:flex; gap:6px; }
.ist-cipler { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.ist-cip { display:inline-flex; align-items:center; gap:5px; padding:7px 11px; border-radius:999px; border:1px solid ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap; }
.ist-cip:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-cip.aktif { background:${R.metin}; color:${R.zemin}; border-color:${R.metin}; }
.ist-select { height:36px; padding:0 10px; border-radius:10px; background:${R.panel}; border:1px solid ${R.cizgi}; color:${R.metin}; font-size:12.5px; }
.ist-semt-baslik { position:relative; overflow:hidden; border-radius:20px; min-height:150px; margin-bottom:16px; border:1px solid ${R.cizgi}; background:${R.panel2}; }
.ist-semt-baslik img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.55; }
.ist-semt-baslik::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,.9) 20%, rgba(0,0,0,.2)); }
.ist-semt-baslik-ic { position:relative; z-index:1; display:grid; gap:6px; padding:20px 22px; max-width:640px; }
.ist-semt-baslik-ic b { font-size:clamp(28px,4vw,42px); letter-spacing:-.03em; line-height:1; }
.ist-govde { display:grid; grid-template-columns:minmax(0,1fr) minmax(340px,420px); gap:18px; align-items:start; }
.ist-bolum { margin-bottom:18px; }
.ist-bolum-baslik { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; padding:10px 4px 8px; border-bottom:1px solid ${R.cizgi}; margin-bottom:6px; }
.ist-bolum-ad { background:none; border:none; padding:0; color:${R.metin}; font-size:21px; font-weight:900; letter-spacing:-.02em; cursor:pointer; }
.ist-bolum-ad:hover { text-decoration:underline; text-decoration-color:var(--r); text-underline-offset:5px; }
.ist-bolum-sayi { font-family:${MONO}; font-size:12px; color:var(--r); vertical-align:middle; }
.ist-bolum-aciklama { font-size:12.5px; color:${R.silik}; }
.ist-daha { width:100%; margin-top:4px; padding:10px; border-radius:12px; border:1px dashed ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:800; cursor:pointer; }
.ist-daha:hover { color:${R.metin}; border-color:var(--r); }
.ist-vurgu-baslik { display:flex; gap:12px; align-items:center; padding:14px 16px; margin-bottom:8px; border-radius:16px; background:linear-gradient(110deg, color-mix(in srgb, var(--r) 18%, transparent), transparent); border-left:3px solid var(--r); }
.ist-vurgu-baslik b { font-size:19px; letter-spacing:-.01em; }
.ist-aciklama { margin:0 2px 10px; font-size:13px; color:${R.soluk}; }
.ist-liste { list-style:none; margin:0; padding:0; display:grid; gap:6px; }
.ist-satir { display:grid; grid-template-columns:38px 88px minmax(0,1fr) auto; gap:14px; align-items:center; padding:10px 12px 10px 8px; border-radius:16px; cursor:pointer; border:1px solid transparent; transition:background .15s, border-color .15s; }
.ist-satir:hover { background:${R.panel}; }
.ist-satir.aktif { background:${R.panel}; border-color:var(--r); box-shadow:inset 3px 0 0 var(--r); }
.ist-sira { font-family:${MONO}; font-size:22px; font-weight:800; text-align:center; }
.ist-ad { color:${R.metin}; font-weight:900; font-size:17px; letter-spacing:-.01em; text-decoration:none; }
.ist-ad:hover { text-decoration:underline; text-decoration-color:var(--r); text-underline-offset:4px; }
.ist-meta { font-size:12.5px; color:${R.soluk}; display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.ist-imza, .ist-neden { font-size:12.5px; color:${R.metin}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ist-neden { white-space:normal; }
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
.ist-panel { position:sticky; top:110px; max-height:calc(100vh - 124px); overflow-y:auto; padding:14px; border-radius:22px; background:${R.panel}; border:1px solid ${R.cizgi}; scrollbar-width:thin; }
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
.ist-bos { display:grid; gap:12px; justify-items:center; padding:40px 16px; border:1px dashed ${R.cizgi}; border-radius:16px; color:${R.soluk}; text-align:center; }
.ist-geceler { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:10px; }
.ist-gece { padding:16px; border-radius:18px; background:${R.panel}; border:1px solid ${R.cizgi}; border-top:3px solid var(--r); display:flex; flex-direction:column; }
.ist-gece ol { flex:1; }
.ist-link { background:none; border:none; padding:0; color:${R.metin}; font-weight:800; font-size:13.5px; cursor:pointer; text-decoration:underline; text-decoration-color:${R.silik}; text-underline-offset:3px; text-align:left; }
.ist-dipnot { color:${R.silik}; font-size:11.5px; line-height:1.65; margin:26px 2px 0; max-width:860px; }
.ist-sayfa { position:fixed; inset:0; z-index:90; overflow-y:auto; background:${R.zemin}; padding:14px 14px 30px; }
.ist-kapat { position:sticky; top:0; z-index:3; float:right; width:42px; height:42px; margin:0 0 -42px; border-radius:999px; border:1px solid ${R.cizgi}; background:rgba(11,11,13,.85); color:#fff; font-size:18px; cursor:pointer; }
@media (max-width: 1100px) {
  .ist-sorular { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ist-sorular-giris { grid-column:1 / -1; padding:2px 6px; font-size:16px; }
  .ist-sifirla { grid-column:1 / -1; }
}
@media (max-width: 980px) {
  .ist-govde { grid-template-columns:1fr; }
  .ist-mast { grid-template-columns:1fr; }
  .ist-yakalar { grid-template-columns:1fr; }
}
@media (max-width: 640px) {
  .ist { border-radius:20px; }
  .ist-sorular-sar { position:static; }
  .ist-secici { max-height:none; padding:12px; }
  .ist-kiminle, .ist-butce { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ist-kiminle-k, .ist-butce-k { padding:11px; }
  .ist-panel { top:14px; }
  .ist-sorular { border-radius:18px; padding:6px; gap:6px; }
  .ist-soru { padding:8px 10px; }
  .ist-soru-deger { font-size:13.5px; }
  .ist-ortam-izgara { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ist-ortam-izgara.kompakt { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .ist-ortam-izgara.kompakt .ist-ortam-karo-ic b { font-size:12.5px; }
  .ist-oneri-satir { grid-template-columns:34px minmax(0,1fr) auto; }
  .ist-oneri-ikon { display:none; }
  .ist-satir { grid-template-columns:62px minmax(0,1fr) auto; gap:10px; padding:9px 6px; }
  .ist-sira { display:none; }
  .ist-satir .ist-kapak { width:62px !important; height:62px !important; }
  .ist-satir .ist-kapak-ad { display:none; }
  .ist-imza { display:none; }
  .ist-ad { font-size:15.5px; }
  .ist-eylemler { grid-template-columns:1fr; }
  .ist-bolum-no { font-size:32px; }
}
`;
