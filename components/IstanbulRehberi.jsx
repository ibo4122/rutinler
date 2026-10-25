"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALANLAR, ORTAMLAR, DURUMLAR, FIYATLAR, ODULLER, MEKANLAR, ONERILER, GECELER,
  mekanBul, ortamBul, haritaGomulu, haritaLink, yolTarifi, rotaLink, durumPuani,
} from "../lib/istanbul";

// İstanbul Rehberi — "gece listesi" kimliği: siyah zemin, sıcak beyaz yazı,
// her ortamın kendi neon rengi, büyük sıra numaraları. Seyahat alanının
// fotoğraf ağırlıklı broşür havasından bilinçli olarak ayrışır.
//
// Gezinme:
//   Alan (Yemek / Gece / Gündüz) → Ortam (Meyhane, Kokteyl…) → liste.
//   Her filtrenin başında açık bir "Tümü" var; hiçbir şey seçmek zorunda değilsin.
//   Ortam seçilmemişken liste ortamlara bölünür ve her bölümün en iyi beşi
//   görünür — "Randevu" gibi bir durum seçmek her bölümü ona göre süzer.
//   "Önerilerim" elle seçilmiş listeleri açar (ilk buluşma, doğum günü…).
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

const BOS_FILTRE = { alan: "hepsi", ortam: "hepsi", durum: "hepsi", fiyat: "hepsi", yaka: "hepsi", liste: "hepsi", arama: "" };

export default function IstanbulRehberi({ data, setData }) {
  const kayit = data || {};
  const favoriler = Array.isArray(kayit.favoriler) ? kayit.favoriler : [];
  const gittim = Array.isArray(kayit.gittim) ? kayit.gittim : [];
  const notlar = kayit.notlar && typeof kayit.notlar === "object" ? kayit.notlar : {};

  const google = useGoogle();
  const dar = useDar();

  const [f, setF] = useState(BOS_FILTRE);
  const [oneri, setOneri] = useState(null);
  const [sirala, setSirala] = useState("puan");
  const [acikBolumler, setAcikBolumler] = useState({});
  const [seciliId, setSeciliId] = useState(null);
  const [sayfaAcik, setSayfaAcik] = useState(false);

  // Her filtre değişikliğinde seçim sıfırlanır: panel her zaman görünen listeden bir mekân gösterir.
  const filtre = (degisen) => { setF((x) => ({ ...x, ...degisen })); setSeciliId(null); setOneri(null); };
  const sifirla = () => { setF(BOS_FILTRE); setSeciliId(null); setOneri(null); setAcikBolumler({}); };
  const oneriAc = (id) => { setF(BOS_FILTRE); setOneri(id); setSeciliId(null); };

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

  // Ortam/alan dışındaki tüm filtreler
  const uyar = useMemo(() => {
    const t = kucuk(f.arama.trim());
    return (m) =>
      (f.durum === "hepsi" || m.durumlar.includes(f.durum)) &&
      (f.fiyat === "hepsi" || m.fiyat === f.fiyat) &&
      (f.yaka === "hepsi" || m.yaka === f.yaka) &&
      (f.liste === "hepsi" || (f.liste === "fav" ? favoriler.includes(m.id) : gittim.includes(m.id))) &&
      (!t || [m.ad, m.semt, m.imza, m.not, ...m.etiketler, ...m.ortamlar.map((o) => ortamBul(o)?.ad)].some((x) => kucuk(x).includes(t)));
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
  const gorunurOrtamlar = ORTAMLAR.filter((o) => f.alan === "hepsi" || o.alan === f.alan)
    .map((o, i) => ({ o, i })).sort((a, b) => oncelik(a.o.id) - oncelik(b.o.id) || a.i - b.i).map((x) => x.o);
  const oneriObj = ONERILER.find((o) => o.id === oneri) || null;
  const bolumlu = !oneriObj && f.ortam === "hepsi" && !f.arama.trim() && f.liste === "hepsi";

  // Görünüm modeli: ya öneri listesi, ya bölümler, ya düz liste.
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

  const aktifFiltreler = [
    f.alan !== "hepsi" && { k: "alan", ad: ALANLAR.find((a) => a.id === f.alan).ad, sil: { alan: "hepsi", ortam: "hepsi" } },
    f.ortam !== "hepsi" && { k: "ortam", ad: ortamBul(f.ortam).ad, sil: { ortam: "hepsi" } },
    f.durum !== "hepsi" && { k: "durum", ad: DURUMLAR.find((d) => d.id === f.durum).ad, sil: { durum: "hepsi" } },
    f.fiyat !== "hepsi" && { k: "fiyat", ad: `${fiyatSimge(f.fiyat)} ${FIYATLAR.find((x) => x.id === f.fiyat).ad}`, sil: { fiyat: "hepsi" } },
    f.yaka !== "hepsi" && { k: "yaka", ad: f.yaka === "avrupa" ? "Avrupa yakası" : "Anadolu yakası", sil: { yaka: "hepsi" } },
    f.liste !== "hepsi" && { k: "liste", ad: f.liste === "fav" ? "Favorilerim" : "Gittiklerim", sil: { liste: "hepsi" } },
    f.arama.trim() && { k: "arama", ad: `"${f.arama.trim()}"`, sil: { arama: "" } },
  ].filter(Boolean);

  return (
    <section className="ist" style={{ color: R.metin }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Masthead arama={f.arama} setArama={(a) => filtre({ arama: a })} google={google.aktif} />

      <Oneriler aktif={oneri} onAc={oneriAc} />

      {/* ---------- filtreler ---------- */}
      <div className="ist-filtreler">
        <div className="ist-alanlar">
          <button type="button" className={f.alan === "hepsi" ? "ist-alan aktif" : "ist-alan"} onClick={() => filtre({ alan: "hepsi", ortam: "hepsi" })}>
            <span className="ist-alan-ad">Tümü</span><span className="ist-alan-alt">{MEKANLAR.length} mekân</span>
          </button>
          {ALANLAR.map((a) => (
            <button key={a.id} type="button" className={f.alan === a.id ? "ist-alan aktif" : "ist-alan"} onClick={() => filtre({ alan: a.id, ortam: "hepsi" })}>
              <span className="ist-alan-ad">{a.ikon} {a.ad}</span><span className="ist-alan-alt">{a.aciklama}</span>
            </button>
          ))}
        </div>

        <Satirli etiket="Ortam">
          <Cip aktif={f.ortam === "hepsi"} onClick={() => filtre({ ortam: "hepsi" })}>Tümü</Cip>
          {gorunurOrtamlar.map((o) => (
            <Cip key={o.id} aktif={f.ortam === o.id} renk={o.renk} onClick={() => filtre({ ortam: o.id })}>
              <span style={{ color: f.ortam === o.id ? undefined : o.renk }}>{o.ikon}</span> {o.kisa}
              <span className="ist-cip-sayi">{MEKANLAR.filter((m) => m.ortamlar.includes(o.id)).length}</span>
            </Cip>
          ))}
        </Satirli>

        <Satirli etiket="Ne için?">
          <Cip aktif={f.durum === "hepsi"} onClick={() => filtre({ durum: "hepsi" })}>Tümü</Cip>
          {DURUMLAR.map((d) => <Cip key={d.id} aktif={f.durum === d.id} onClick={() => filtre({ durum: d.id })}>{d.ikon} {d.ad}</Cip>)}
        </Satirli>

        <div className="ist-satir-cift">
          <Satirli etiket="Bütçe">
            <Cip aktif={f.fiyat === "hepsi"} onClick={() => filtre({ fiyat: "hepsi" })}>Tümü</Cip>
            {FIYATLAR.map((x) => <Cip key={x.id} mono aktif={f.fiyat === x.id} onClick={() => filtre({ fiyat: x.id })} title={x.ad}>{x.simge}</Cip>)}
          </Satirli>
          <Satirli etiket="Yaka">
            <Cip aktif={f.yaka === "hepsi"} onClick={() => filtre({ yaka: "hepsi" })}>Tüm şehir</Cip>
            <Cip aktif={f.yaka === "avrupa"} onClick={() => filtre({ yaka: "avrupa" })}>Avrupa</Cip>
            <Cip aktif={f.yaka === "anadolu"} onClick={() => filtre({ yaka: "anadolu" })}>Anadolu</Cip>
          </Satirli>
          <Satirli etiket="Listem">
            <Cip aktif={f.liste === "fav"} onClick={() => filtre({ liste: f.liste === "fav" ? "hepsi" : "fav" })}>♥ Favorilerim · {favoriler.length}</Cip>
            <Cip aktif={f.liste === "gittim"} onClick={() => filtre({ liste: f.liste === "gittim" ? "hepsi" : "gittim" })}>✓ Gittiklerim · {gittim.length}</Cip>
          </Satirli>
        </div>
      </div>

      {/* ---------- sonuç çubuğu ---------- */}
      <div className="ist-bar">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
          <span className="ist-sayac">{String(toplam).padStart(2, "0")} MEKÂN</span>
          {oneriObj ? <span className="ist-etiket-aktif" style={{ borderColor: oneriObj.renk }}>{oneriObj.ikon} {oneriObj.ad}<button type="button" onClick={() => setOneri(null)} aria-label="Öneriyi kapat">✕</button></span> : null}
          {aktifFiltreler.map((x) => (
            <span key={x.k} className="ist-etiket-aktif">{x.ad}<button type="button" onClick={() => filtre(x.sil)} aria-label={`${x.ad} filtresini kaldır`}>✕</button></span>
          ))}
        </div>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!oneriObj ? (
            <select value={sirala} onChange={(e) => setSirala(e.target.value)} className="ist-select" aria-label="Sıralama">
              <option value="puan">Sırala: Rehber puanı</option>
              {google.aktif ? <option value="google">Sırala: Google puanı</option> : null}
              <option value="ucuz">Sırala: Uygundan pahalıya</option>
              <option value="pahali">Sırala: Pahalıdan uyguna</option>
            </select>
          ) : null}
          {aktifFiltreler.length || oneriObj ? <button type="button" onClick={sifirla} className="ist-dugme ince">Tümünü sıfırla</button> : null}
        </span>
      </div>

      {/* ---------- liste + panel ---------- */}
      <div className="ist-govde">
        <div style={{ minWidth: 0 }}>
          {gorunum.tur === "oneri" ? (
            <>
              <div className="ist-oneri-baslik" style={{ "--r": oneriObj.renk }}>
                <span style={{ fontSize: 26 }}>{oneriObj.ikon}</span>
                <span><b>{oneriObj.ad}</b><span style={{ display: "block", color: R.soluk, fontSize: 13.5 }}>{oneriObj.ozet}</span></span>
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
              <div className="ist-oneri-baslik" style={{ "--r": "#f4f1ea" }}>
                <span style={{ fontSize: 26 }}>{durumObj.ikon}</span>
                <span><b>{durumObj.baslik}</b><span style={{ display: "block", color: R.soluk, fontSize: 13.5 }}>
                  {toplam} mekân · bölümler bu duruma en uygun olandan başlar; her bölümde asıl amacı bu olan yerler öne çıkar.
                </span></span>
              </div>
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
        {" "}Michelin ödülleri ve adresleri 2026 rehberindeki mekân sayfalarından doğrulandı. Görseller Michelin Rehberi, Time Out İstanbul ve
        mekânların kendi sitelerinden. Saat ve fiyatlar değişebilir; gitmeden önce kontrol et.
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

// ======================= BAŞLIK & ÖNERİLER ==================================

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
          <span><b>{ORTAMLAR.length}</b> ortam</span>
          <span><b>{yildiz}</b> yıldızlı</span>
          <span><b>{bib}</b> Bib Gourmand</span>
          <span><b>{ONERILER.length}</b> öneri listesi</span>
        </div>
      </div>
      <div className="ist-arama">
        <label htmlFor="ist-ara" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: R.silik }}>ARA</label>
        <input id="ist-ara" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="negroni, Kadıköy, lahmacun, teras, omakase…" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Boğaz", "teras", "canlı müzik", "Bib Gourmand", "kendi kavurur", "fasıl"].map((k) => (
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

function Oneriler({ aktif, onAc }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 className="ist-h3">Önerilerim</h3>
        <span style={{ color: R.soluk, fontSize: 13 }}>Ne arayacağını bilmiyorsan buradan başla — her liste elle seçildi, her mekânın neden orada olduğu yazıyor.</span>
      </div>
      <div className="ist-oneriler">
        {ONERILER.map((o) => {
          const kapak = o.liste.map(([id]) => mekanBul(id)).find((m) => m?.gorsel);
          return (
            <button key={o.id} type="button" onClick={() => onAc(aktif === o.id ? null : o.id)}
              className={aktif === o.id ? "ist-oneri aktif" : "ist-oneri"} style={{ "--r": o.renk }}>
              {kapak ? <img src={kapak.gorsel} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
              <span className="ist-oneri-ic">
                <span style={{ fontSize: 20 }}>{o.ikon}</span>
                <b>{o.ad}</b>
                <span className="ist-oneri-alt">{o.liste.length} mekân</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
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
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Kapak m={m} g={g} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: R.soluk }}>
            {m.semt} · {m.yaka === "anadolu" ? "Anadolu" : "Avrupa"} yakası · <span style={{ fontFamily: MONO, color: R.metin }}>{fiyatSimge(m.fiyat)}</span>
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

// ======================= ORTAK =============================================

function Satirli({ etiket, children }) {
  return (
    <div className="ist-satirli">
      <span className="ist-satirli-etiket">{etiket}</span>
      <div className="ist-cipler">{children}</div>
    </div>
  );
}

function Cip({ aktif, onClick, children, mono, renk, title }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={!!aktif}
      className={aktif ? "ist-cip aktif" : "ist-cip"}
      style={{ ...(mono ? { fontFamily: MONO } : null), ...(aktif && renk ? { background: renk, borderColor: renk } : null) }}>
      {children}
    </button>
  );
}

function Bos({ onSifirla }) {
  return (
    <div className="ist-bos">
      Bu filtrelerle eşleşen mekân yok.
      <button type="button" onClick={onSifirla} className="ist-dugme">Filtreleri sıfırla</button>
    </div>
  );
}

const CSS = `
.ist { background:${R.zemin}; border:1px solid ${R.cizgi}; border-radius:26px; padding:clamp(16px,3vw,30px); }
.ist button, .ist a, .ist input, .ist select { font-family: inherit; }
.ist-mast { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:24px; align-items:end; padding-bottom:22px; border-bottom:1px solid ${R.cizgi}; margin-bottom:20px; }
.ist-baslik { margin:10px 0 12px; font-size:clamp(46px,8vw,92px); line-height:.9; font-weight:900; letter-spacing:-.045em; }
.ist-baslik span { background:linear-gradient(90deg,#f472b6,#e8c25a 45%,#7dd3fc); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ist-istatistik { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:12.5px; color:${R.soluk}; }
.ist-istatistik b { color:${R.metin}; font-family:${MONO}; font-size:14px; }
.ist-arama { display:grid; gap:10px; }
.ist-arama input { width:100%; box-sizing:border-box; height:58px; padding:0 18px; border-radius:16px; background:${R.panel}; border:1.5px solid ${R.cizgi}; color:${R.metin}; font-size:17px; outline:none; transition:border-color .2s; }
.ist-arama input:focus { border-color:${R.metin}; }
.ist-oneri-kelime { padding:5px 10px; border-radius:999px; border:1px dashed ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12px; cursor:pointer; }
.ist-oneri-kelime:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-h3 { margin:0; font-size:24px; font-weight:900; letter-spacing:-.03em; }
.ist-oneriler { display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; scrollbar-width:thin; scrollbar-color:${R.silik} transparent; }
.ist-oneri { position:relative; flex:0 0 190px; height:118px; border-radius:18px; overflow:hidden; border:1px solid ${R.cizgi}; background:${R.panel}; cursor:pointer; padding:0; text-align:left; color:#fff; transition:transform .15s, box-shadow .2s, border-color .2s; }
.ist-oneri img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.55; transition:opacity .2s; }
.ist-oneri::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.85)); }
.ist-oneri:hover { transform:translateY(-2px); border-color:var(--r); }
.ist-oneri:hover img { opacity:.75; }
.ist-oneri.aktif { border-color:var(--r); box-shadow:0 0 0 2px var(--r), 0 12px 30px -12px var(--r); }
.ist-oneri-ic { position:absolute; left:12px; right:12px; bottom:10px; z-index:1; display:grid; gap:1px; }
.ist-oneri-ic b { font-size:15.5px; letter-spacing:-.01em; }
.ist-oneri-alt { font-family:${MONO}; font-size:11px; color:var(--r); }
.ist-filtreler { display:grid; gap:12px; padding:16px; border-radius:20px; background:${R.panel}; border:1px solid ${R.cizgi}; }
.ist-alanlar { display:grid; grid-template-columns:auto repeat(3,minmax(0,1fr)); gap:8px; }
.ist-alan { display:grid; gap:2px; text-align:left; padding:11px 14px; border-radius:14px; border:1px solid ${R.cizgi}; background:${R.zemin}; color:${R.metin}; cursor:pointer; min-width:0; }
.ist-alan:hover { border-color:${R.soluk}; }
.ist-alan.aktif { background:${R.metin}; color:${R.zemin}; border-color:${R.metin}; }
.ist-alan-ad { font-weight:900; font-size:15px; }
.ist-alan-alt { font-size:11.5px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ist-satirli { display:grid; grid-template-columns:78px minmax(0,1fr); gap:10px; align-items:start; }
.ist-satirli-etiket { font-family:${MONO}; font-size:11px; letter-spacing:.14em; color:${R.silik}; text-transform:uppercase; padding-top:9px; }
.ist-satir-cift { display:grid; grid-template-columns:repeat(3,auto); gap:12px 22px; justify-content:start; }
.ist-satir-cift .ist-satirli { grid-template-columns:auto minmax(0,1fr); }
.ist-cipler { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.ist-cip { display:inline-flex; align-items:center; gap:5px; padding:7px 11px; border-radius:999px; border:1px solid ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap; }
.ist-cip:hover { color:${R.metin}; border-color:${R.soluk}; }
.ist-cip.aktif { background:${R.metin}; color:${R.zemin}; border-color:${R.metin}; }
.ist-cip-sayi { font-family:${MONO}; font-size:10.5px; opacity:.6; }
.ist-bar { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; padding:16px 0 10px; }
.ist-sayac { font-family:${MONO}; font-size:12.5px; color:${R.soluk}; letter-spacing:.04em; margin-right:4px; }
.ist-etiket-aktif { display:inline-flex; align-items:center; gap:6px; padding:4px 6px 4px 10px; border-radius:999px; border:1px solid ${R.soluk}; font-size:12px; font-weight:700; }
.ist-etiket-aktif button { width:20px; height:20px; border-radius:999px; border:none; background:${R.panel2}; color:${R.metin}; cursor:pointer; font-size:10px; }
.ist-select { height:36px; padding:0 10px; border-radius:10px; background:${R.panel}; border:1px solid ${R.cizgi}; color:${R.metin}; font-size:12.5px; }
.ist-govde { display:grid; grid-template-columns:minmax(0,1fr) minmax(340px,420px); gap:18px; align-items:start; }
.ist-bolum { margin-bottom:18px; }
.ist-bolum-baslik { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; padding:10px 4px 8px; border-bottom:1px solid ${R.cizgi}; margin-bottom:6px; }
.ist-bolum-ad { background:none; border:none; padding:0; color:${R.metin}; font-size:21px; font-weight:900; letter-spacing:-.02em; cursor:pointer; }
.ist-bolum-ad:hover { text-decoration:underline; text-decoration-color:var(--r); text-underline-offset:5px; }
.ist-bolum-sayi { font-family:${MONO}; font-size:12px; color:var(--r); vertical-align:middle; }
.ist-bolum-aciklama { font-size:12.5px; color:${R.silik}; }
.ist-daha { width:100%; margin-top:4px; padding:10px; border-radius:12px; border:1px dashed ${R.cizgi}; background:transparent; color:${R.soluk}; font-size:12.5px; font-weight:800; cursor:pointer; }
.ist-daha:hover { color:${R.metin}; border-color:var(--r); }
.ist-oneri-baslik { display:flex; gap:12px; align-items:center; padding:14px 16px; margin-bottom:8px; border-radius:16px; background:linear-gradient(110deg, color-mix(in srgb, var(--r) 22%, transparent), transparent); border-left:3px solid var(--r); }
.ist-oneri-baslik b { font-size:19px; letter-spacing:-.01em; }
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
.ist-geceler { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:10px; }
.ist-gece { padding:16px; border-radius:18px; background:${R.panel}; border:1px solid ${R.cizgi}; border-top:3px solid var(--r); display:flex; flex-direction:column; }
.ist-gece ol { flex:1; }
.ist-link { background:none; border:none; padding:0; color:${R.metin}; font-weight:800; font-size:13.5px; cursor:pointer; text-decoration:underline; text-decoration-color:${R.silik}; text-underline-offset:3px; text-align:left; }
.ist-dipnot { color:${R.silik}; font-size:11.5px; line-height:1.65; margin:26px 2px 0; max-width:860px; }
.ist-sayfa { position:fixed; inset:0; z-index:90; overflow-y:auto; background:${R.zemin}; padding:14px 14px 30px; }
.ist-kapat { position:sticky; top:0; z-index:3; float:right; width:42px; height:42px; margin:0 0 -42px; border-radius:999px; border:1px solid ${R.cizgi}; background:rgba(11,11,13,.85); color:#fff; font-size:18px; cursor:pointer; }
@media (max-width: 1100px) { .ist-satir-cift { grid-template-columns:1fr; } .ist-satir-cift .ist-satirli { grid-template-columns:78px minmax(0,1fr); } }
@media (max-width: 980px) {
  .ist-govde { grid-template-columns:1fr; }
  .ist-mast { grid-template-columns:1fr; }
  .ist-alanlar { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media (max-width: 640px) {
  .ist { border-radius:20px; }
  .ist-filtreler { padding:12px; }
  .ist-satirli, .ist-satir-cift .ist-satirli { grid-template-columns:1fr; gap:6px; }
  .ist-satirli-etiket { padding-top:0; }
  .ist-cipler { flex-wrap:nowrap; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
  .ist-alan-alt { display:none; }
  .ist-oneri { flex-basis:160px; height:104px; }
  .ist-satir { grid-template-columns:62px minmax(0,1fr) auto; gap:10px; padding:9px 6px; }
  .ist-sira { display:none; }
  .ist-satir .ist-kapak { width:62px !important; height:62px !important; }
  .ist-satir .ist-kapak-ad { display:none; }
  .ist-imza { display:none; }
  .ist-ad { font-size:15.5px; }
  .ist-eylemler { grid-template-columns:1fr; }
}
`;
