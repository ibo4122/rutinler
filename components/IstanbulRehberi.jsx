"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TURLER, OZELLIKLER, FIYATLAR, ODULLER, BOLGELER, MEKANLAR, ONERILER,
  mekanBul, turBul, yemekBul, ozellikBul, haritaGomulu, haritaLink, yolTarifi,
} from "../lib/istanbul";
import {
  KATEGORI_GRUPLARI, KATEGORILER, kategoriBul, anaKategori, PLAN_TURLERI, planBul, planUyum, planUyumEtiketi, PLAN_ESIK,
  skorHesapla, nedenler, rezervasyon, muzik, kalabalik, alkol, acikAlan, kimIcinDegil, mesafeKm, acikMi,
  michelinMi, michelinKategoriMi,
} from "../lib/istanbulSkor";
import { GeriButon, useGeriAl } from "./GeriAl";

// İstanbul'da Mekân Keşfet.
//
// Akış (bkz. docs/saglik-istanbul-akislar.md): üstte arama + dört kontrol —
// Mekân Türü (çoklu), Plan Türü (çoklu), Semt (çoklu), Filtreler (fiyat, şimdi
// açık, rezervasyon, uzaklık, puan). Her seçim sonuçları anında günceller;
// seçili olan her şey küçük bir etiket olarak görünür ve tek tek kaldırılır.
// Hiç seçim yokken ekran keşif modundadır (kategori karoları, planlar, hazır
// listeler, semtler). Sıralama Uygulama Skoru'na göredir (lib/istanbulSkor.js).
//
// Google Places bağlı değilse (GOOGLE_PLACES_API_KEY yok) puan, saat, telefon
// gibi alanlar uydurulmaz: kartta "Google verisi bağlı değil" yazar, skor
// editoryal karşılıklarla hesaplanır, "şimdi açık" süzgeci devre dışı kalır.

const VERI_TARIHI = "Ekim 2026";
const SAYFA = 24;
const FILTRE_ANAHTARI = "rutinler:istanbul:filtre:v6";
const BOS = {
  arama: "", kategoriler: [], planlar: [], semtler: [], fiyatlar: [], acik: false,
  rezervasyon: "hepsi", uzaklik: 0, minPuan: 0, minGoogle: 0, minYorum: 0, liste: null, tumu: false,
};

const sade = (s) => String(s || "").toLocaleLowerCase("tr")
  .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a");
const sayiTR = (n) => new Intl.NumberFormat("tr-TR").format(n);
const fiyatSimge = (f) => FIYATLAR.find((x) => x.id === f)?.simge || "";
const bolgeBul = (id) => BOLGELER.find((b) => b.id === id) || null;
const anaTur = (m) => turBul(m.turler[0]) || TURLER[0];

// Arama dizini bir kez kurulur: ad, semt, bölge, imza, etiketler, tür, yemek, kategori.
const DIZIN = Object.fromEntries(MEKANLAR.map((m) => [m.id, sade([
  m.ad, m.semt, bolgeBul(m.bolge)?.ad, m.imza, m.etiketler.join(" "),
  m.turler.map((t) => turBul(t)?.ad).join(" "), m.yemekler.map((y) => yemekBul(y)?.ad).join(" "),
  KATEGORILER.filter((k) => k.test(m)).map((k) => k.ad).join(" "),
].join(" "))]));
// Genel listeler Michelin dışındaki mekânlardan oluşur.
const GENEL = MEKANLAR.filter((m) => !michelinMi(m));
const ANA_KATEGORI = Object.fromEntries(MEKANLAR.map((m) => [m.id, anaKategori(m)]));

// ---------- canlı Google verisi (anahtar varsa) ----------
function useGoogle() {
  const [durum, setDurum] = useState({ aktif: false, yukleniyor: true, hata: 0 });
  const [veri, setVeri] = useState({});
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const d = await (await fetch("/api/mekan-google")).json();
        if (iptal) return;
        if (!d.aktif) { setDurum({ aktif: false, yukleniyor: false, hata: 0 }); return; }
        setDurum({ aktif: true, yukleniyor: true, hata: 0 });
        const kuyruk = [...MEKANLAR];
        const isci = async () => {
          while (kuyruk.length && !iptal) {
            const m = kuyruk.shift();
            try {
              const r = await (await fetch(`/api/mekan-google?q=${encodeURIComponent(m.harita)}`)).json();
              if (iptal) return;
              if (r.hata) setDurum((s) => ({ ...s, hata: s.hata + 1 }));
              else if (r.puan || r.foto) setVeri((v) => ({ ...v, [m.id]: r }));
            } catch { if (!iptal) setDurum((s) => ({ ...s, hata: s.hata + 1 })); }
          }
        };
        await Promise.all(Array.from({ length: 5 }, isci));
        if (!iptal) setDurum((s) => ({ ...s, yukleniyor: false }));
      } catch {
        if (!iptal) setDurum({ aktif: false, yukleniyor: false, hata: 1 });
      }
    })();
    return () => { iptal = true; };
  }, []);
  return { ...durum, veri };
}

function useCevrimici() {
  const [var_, setVar] = useState(true);
  useEffect(() => {
    const f = () => setVar(navigator.onLine !== false);
    f();
    window.addEventListener("online", f); window.addEventListener("offline", f);
    return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
  }, []);
  return var_;
}

// ---------- süzgeç ----------
// "haric": sayım yaparken o eksen yok sayılır (seçenek yanındaki sayılar için).
function eslesir(m, f, ctx, haric) {
  const g = ctx.g[m.id];
  if (f.liste && haric !== "liste" && !ONERILER.find((o) => o.id === f.liste)?.liste.some(([id]) => id === m.id)) return false;
  if (f.arama.trim() && haric !== "arama") {
    const kelimeler = sade(f.arama).split(/\s+/).filter(Boolean);
    if (!kelimeler.every((k) => DIZIN[m.id].includes(k))) return false;
  }
  // Michelin ayrı bir dünya: Michelin türü seçilmedikçe genel listelerde yok
  // (adıyla arandığında ve hazır listelerde bulunur). Michelin türü + mutfak
  // seçilirse ikisi birlikte aranır: "Bib Gourmand" + "Kebap" = Bib kebapçılar.
  const mk = f.kategoriler.filter(michelinKategoriMi);
  const nk = f.kategoriler.filter((id) => !michelinKategoriMi(id));
  if (haric !== "kategori") {
    if (mk.length && !mk.some((id) => kategoriBul(id)?.test(m))) return false;
    if (nk.length && !nk.some((id) => kategoriBul(id)?.test(m))) return false;
  }
  if (michelinMi(m) && !mk.length && !f.liste && haric !== "kategori") {
    const ara = sade(f.arama.trim());
    if (!ara || !sade(m.ad).includes(ara)) return false;
  }
  if (f.planlar.length && haric !== "plan" && !f.planlar.every((p) => planUyum(m, p) >= PLAN_ESIK)) return false;
  if (f.semtler.length && haric !== "semt" && !f.semtler.includes(m.bolge)) return false;
  if (f.fiyatlar.length && haric !== "fiyat" && !f.fiyatlar.includes(m.fiyat)) return false;
  if (f.acik && haric !== "acik" && ctx.googleAktif && acikMi(g?.periyotlar) !== true) return false;
  if (f.rezervasyon !== "hepsi" && haric !== "rezervasyon") {
    const r = rezervasyon(m, g).id;
    if (f.rezervasyon === "gerekmez" ? r !== "gerekmez" : r === "gerekmez") return false;
  }
  if (f.uzaklik && haric !== "uzaklik" && ctx.konum) {
    const d = mesafeKm(ctx.konum, m, g);
    if (d && d.km > f.uzaklik) return false;
  }
  if (f.minPuan && haric !== "puan" && m.puan < f.minPuan) return false;
  if (ctx.googleAktif && haric !== "puan") {
    if (f.minGoogle && !(g?.puan >= f.minGoogle)) return false;
    if (f.minYorum && !((g?.yorum || 0) >= f.minYorum)) return false;
  }
  return true;
}

const aktifSayisi = (f) =>
  f.kategoriler.length + f.planlar.length + f.semtler.length + f.fiyatlar.length + (f.acik ? 1 : 0) +
  (f.rezervasyon !== "hepsi" ? 1 : 0) + (f.uzaklik ? 1 : 0) + (f.minPuan ? 1 : 0) + (f.minGoogle ? 1 : 0) + (f.minYorum ? 1 : 0) +
  (f.liste ? 1 : 0) + (f.arama.trim() ? 1 : 0);
const panelSayisi = (f) => f.fiyatlar.length + (f.acik ? 1 : 0) + (f.rezervasyon !== "hepsi" ? 1 : 0) + (f.uzaklik ? 1 : 0) + (f.minPuan ? 1 : 0) + (f.minGoogle ? 1 : 0) + (f.minYorum ? 1 : 0);

// ======================= ANA BİLEŞEN ========================================

export default function IstanbulRehberi({ data, setData }) {
  const geriAl = useGeriAl();
  const google = useGoogle();
  const cevrimici = useCevrimici();
  const [f, setF] = useState(BOS);
  const [hazir, setHazir] = useState(false);
  const [acilir, setAcilir] = useState(null); // kategori | plan | semt | filtre
  const [sirala, setSirala] = useState("skor");
  const [gosterilen, setGosterilen] = useState(SAYFA);
  const [seciliId, setSeciliId] = useState(null);
  const [gorunum, setGorunum] = useState("kesif"); // kesif | kayitli
  const [listeyeEkle, setListeyeEkle] = useState(null);
  const [konum, setKonum] = useState(null);
  const [konumDurum, setKonumDurum] = useState("yok"); // yok | isteniyor | var | izinyok | hata
  const sonucRef = useRef(null);

  const kayit = { favoriler: [], gittim: [], notlar: {}, listeler: [], ...(data || {}) };

  // Son filtreler hatırlanır (tarayıcıya özel).
  useEffect(() => {
    try {
      const k = JSON.parse(localStorage.getItem(FILTRE_ANAHTARI) || "null");
      if (k && typeof k === "object") {
        const geriYuklenen = { ...BOS, ...k.f, uzaklik: 0 };
        setF(geriYuklenen);
        if (k.sirala && k.sirala !== "yakin") setSirala(k.sirala);
        // Hatırlanan seçimlerle açılınca da "← Geri" başlangıca dönebilsin.
        if (aktifSayisi(geriYuklenen) || geriYuklenen.tumu) setGecmis([{ f: { ...BOS }, gorunum: "kesif" }]);
      }
    } catch {}
    setHazir(true);
  }, []);
  useEffect(() => {
    if (!hazir) return;
    try { localStorage.setItem(FILTRE_ANAHTARI, JSON.stringify({ f, sirala })); } catch {}
  }, [f, sirala, hazir]);
  useEffect(() => { setGosterilen(SAYFA); }, [f, sirala]);

  const konumIste = (sonra) => {
    if (!navigator.geolocation) { setKonumDurum("hata"); return; }
    setKonumDurum("isteniyor");
    navigator.geolocation.getCurrentPosition(
      (p) => { setKonum({ lat: p.coords.latitude, lng: p.coords.longitude }); setKonumDurum("var"); sonra?.(); },
      (e) => setKonumDurum(e.code === 1 ? "izinyok" : "hata"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const ctx = { g: google.veri, googleAktif: google.aktif, konum };

  // Adım geçmişi: her seçim (tür, plan, semt, filtre, liste, görünüm) bir adım.
  // "← Geri" bir önceki hale döner — "Tümü"ye basıp baştan seçmek gerekmez.
  // Yazarken her harf ayrı adım olmasın: kesintisiz arama tek adım sayılır.
  const [gecmis, setGecmis] = useState([]);
  const sonArama = useRef(0);
  const git = (yeniF, yeniGorunum = gorunum, arama = false) => {
    if (yeniGorunum === gorunum && JSON.stringify(yeniF) === JSON.stringify(f)) return;
    const aramaDevam = arama && Date.now() - sonArama.current < 1500;
    sonArama.current = arama ? Date.now() : 0;
    if (!aramaDevam) setGecmis((g) => [...g.slice(-59), { f, gorunum }]);
    setF(yeniF);
    setGorunum(yeniGorunum);
  };
  const geri = () => {
    const son = gecmis[gecmis.length - 1];
    if (!son) return;
    setGecmis((g) => g.slice(0, -1));
    sonArama.current = 0;
    setF(son.f);
    setGorunum(son.gorunum);
    setAcilir(null);
  };
  const degis = (yama) => git({ ...f, ...yama, tumu: yama.tumu ?? f.tumu }, gorunum, Object.keys(yama).length === 1 && "arama" in yama);
  const dizi = (alan, deger) => git({ ...f, [alan]: f[alan].includes(deger) ? f[alan].filter((v) => v !== deger) : [...f[alan], deger] });
  const temizle = () => git({ ...BOS });
  const gorunumDegis = (v) => git(f, v);

  const secimVar = aktifSayisi(f) > 0 || f.tumu;
  const sonuclar = useMemo(() => {
    const l = MEKANLAR.filter((m) => eslesir(m, f, ctx)).map((m) => {
      const g = google.veri[m.id];
      return { m, g, skor: skorHesapla(m, f, g), mesafe: konum ? mesafeKm(konum, m, g) : null };
    });
    const s = {
      skor: (a, b) => b.skor.toplam - a.skor.toplam || b.m.puan - a.m.puan,
      google: (a, b) => (b.g?.puan || 0) - (a.g?.puan || 0) || b.skor.toplam - a.skor.toplam,
      ucuz: (a, b) => a.m.fiyat - b.m.fiyat || b.skor.toplam - a.skor.toplam,
      pahali: (a, b) => b.m.fiyat - a.m.fiyat || b.skor.toplam - a.skor.toplam,
      yakin: (a, b) => (a.mesafe?.km ?? 999) - (b.mesafe?.km ?? 999) || b.skor.toplam - a.skor.toplam,
    }[sirala] || ((a, b) => b.skor.toplam - a.skor.toplam);
    // Zayıf mekânlar öne çıkarılmaz: düşük puan/az değerlendirme sona.
    return l.sort((a, b) => (a.skor.zayif - b.skor.zayif) || s(a, b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, sirala, google.veri, google.aktif, konum]);

  // Daraltmayı gevşetme önerileri: her aktif seçim kaldırılınca kaç sonuç çıkar?
  const gevsetme = useMemo(() => {
    if (!secimVar || sonuclar.length >= 4) return [];
    const adaylar = [
      ...f.kategoriler.map((id) => ({ ad: `"${kategoriBul(id)?.ad}" türünü kaldır`, yama: { kategoriler: f.kategoriler.filter((x) => x !== id) } })),
      ...f.planlar.map((id) => ({ ad: `"${planBul(id)?.ad}" planını kaldır`, yama: { planlar: f.planlar.filter((x) => x !== id) } })),
      ...(f.semtler.length ? [{ ad: "Semt seçimini kaldır", yama: { semtler: [] } }] : []),
      ...(f.fiyatlar.length ? [{ ad: "Fiyat süzgecini kaldır", yama: { fiyatlar: [] } }] : []),
      ...(f.acik ? [{ ad: "\"Şimdi açık\" süzgecini kaldır", yama: { acik: false } }] : []),
      ...(f.rezervasyon !== "hepsi" ? [{ ad: "Rezervasyon süzgecini kaldır", yama: { rezervasyon: "hepsi" } }] : []),
      ...(f.uzaklik ? [{ ad: "Uzaklık sınırını kaldır", yama: { uzaklik: 0 } }] : []),
      ...(f.minPuan || f.minGoogle || f.minYorum ? [{ ad: "Puan sınırını kaldır", yama: { minPuan: 0, minGoogle: 0, minYorum: 0 } }] : []),
      ...(f.arama.trim() ? [{ ad: `"${f.arama}" aramasını temizle`, yama: { arama: "" } }] : []),
      ...(f.liste ? [{ ad: "Hazır listeden çık", yama: { liste: null } }] : []),
    ];
    return adaylar.map((a) => ({ ...a, sayi: MEKANLAR.filter((m) => eslesir(m, { ...f, ...a.yama }, ctx)).length }))
      .filter((a) => a.sayi > sonuclar.length).sort((a, b) => b.sayi - a.sayi).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, sonuclar.length, google.veri, konum]);

  // ---------- kayıt işlemleri (hepsi Geri Al ile geri alınabilir) ----------
  const isaret = {
    fav: (id) => kayit.favoriler.includes(id),
    git: (id) => kayit.gittim.includes(id),
    favDegis: (id) => {
      const vardi = kayit.favoriler.includes(id);
      geriAl.etiketle(vardi ? `${mekanBul(id)?.ad} favorilerden çıkarıldı` : `${mekanBul(id)?.ad} kaydedildi`);
      setData((s) => { const fv = s?.favoriler || []; return { ...s, favoriler: fv.includes(id) ? fv.filter((x) => x !== id) : [...fv, id] }; });
    },
    gitDegis: (id) => {
      geriAl.etiketle(kayit.gittim.includes(id) ? "Gittim işareti kaldırıldı" : "Gittim olarak işaretlendi");
      setData((s) => { const l = s?.gittim || []; return { ...s, gittim: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] }; });
    },
    notYaz: (id, metin) => {
      geriAl.etiketle("Not kaydedildi");
      setData((s) => ({ ...s, notlar: { ...(s?.notlar || {}), [id]: metin } }));
    },
  };
  const listeIslem = {
    olustur: (ad, ilkMekan) => {
      const yeni = { id: `l${Date.now().toString(36)}`, ad: ad.trim() || "Yeni liste", mekanlar: ilkMekan ? [ilkMekan] : [], olusturma: new Date().toISOString() };
      geriAl.etiketle(`"${yeni.ad}" listesi oluşturuldu`);
      setData((s) => ({ ...s, listeler: [...(s?.listeler || []), yeni] }));
      return yeni.id;
    },
    degistir: (listeId, mekanId) => {
      const l = kayit.listeler.find((x) => x.id === listeId);
      const vardi = l?.mekanlar.includes(mekanId);
      geriAl.etiketle(vardi ? `"${l?.ad}" listesinden çıkarıldı` : `"${l?.ad}" listesine eklendi`);
      setData((s) => ({ ...s, listeler: (s?.listeler || []).map((x) => x.id !== listeId ? x : { ...x, mekanlar: x.mekanlar.includes(mekanId) ? x.mekanlar.filter((y) => y !== mekanId) : [...x.mekanlar, mekanId] }) }));
    },
    yenidenAdlandir: (listeId, ad) => {
      if (!ad.trim()) return;
      geriAl.etiketle("Liste adı güncellendi");
      setData((s) => ({ ...s, listeler: (s?.listeler || []).map((x) => (x.id === listeId ? { ...x, ad: ad.trim() } : x)) }));
    },
    sil: (listeId) => {
      const l = kayit.listeler.find((x) => x.id === listeId);
      geriAl.etiketle(`"${l?.ad}" listesi silindi`);
      setData((s) => ({ ...s, listeler: (s?.listeler || []).filter((x) => x.id !== listeId) }));
    },
  };

  const secili = seciliId ? mekanBul(seciliId) : null;
  const sonucaGit = () => setTimeout(() => sonucRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  const kayitliSayisi = new Set([...kayit.favoriler, ...kayit.listeler.flatMap((l) => l.mekanlar)]).size;
  const oneri = f.liste ? ONERILER.find((o) => o.id === f.liste) : null;

  return (
    <section className="ist">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ist-bas">
        <div style={{ minWidth: 0 }}>
          <div className="ist-ust-etiket">İstanbul Rehberi · {MEKANLAR.length} mekân · {BOLGELER.length} semt</div>
          <h2 className="ist-h1">İstanbul'da Mekân Keşfet</h2>
          <p className="ist-alt">Yeme-içme, buluşma ve eğlence planına uygun mekânları keşfet.</p>
        </div>
        <div className="ist-gorunum" role="tablist" aria-label="Görünüm">
          <button type="button" role="tab" aria-selected={gorunum === "kesif"} className={gorunum === "kesif" ? "secili" : ""} onClick={() => gorunumDegis("kesif")}>Keşfet</button>
          <button type="button" role="tab" aria-selected={gorunum === "kayitli"} className={gorunum === "kayitli" ? "secili" : ""} onClick={() => gorunumDegis("kayitli")}>
            ♥ Kayıtlı{kayitliSayisi ? <span className="ist-rozet-sayi">{kayitliSayisi}</span> : null}
          </button>
        </div>
      </header>

      {!cevrimici ? (
        <Uyari tur="bilgi" baslik="İnternet bağlantısı yok">
          Rehber cihazındaki verilerle çalışmaya devam ediyor; fotoğraflar, harita ve Google bilgileri bağlantı gelince yüklenir.
        </Uyari>
      ) : google.aktif && !google.yukleniyor && google.hata > 20 ? (
        <Uyari tur="uyari" baslik="Google verileri şu an güncellenemedi">
          Puanlar ve saatler yüklenemedi; sıralama rehber değerlendirmesiyle devam ediyor. Biraz sonra sayfayı yenileyebilirsin.
        </Uyari>
      ) : null}

      {gorunum === "kayitli" ? (
        <div className="ist-arac"><GeriCubugu gecmis={gecmis} geri={geri} f={f} gorunum={gorunum} /></div>
      ) : null}
      {gecmis.length ? (
        <button type="button" className="ist-geri-yuzen" onClick={geri} aria-label="Bir önceki adıma dön">← Geri</button>
      ) : null}

      {gorunum === "kayitli" ? (
        <Kayitli kayit={kayit} g={google.veri} onSec={setSeciliId} isaret={isaret} listeIslem={listeIslem} onKesfet={() => gorunumDegis("kesif")} />
      ) : (
        <>
          <AracCubugu gecmis={gecmis} geri={geri} gorunum={gorunum} f={f} ctx={ctx} acilir={acilir} setAcilir={setAcilir} degis={degis} dizi={dizi} temizle={temizle}
            sonucSayisi={sonuclar.length} google={google} konumDurum={konumDurum} konumIste={konumIste} onGoster={() => { setAcilir(null); degis({ tumu: true }); sonucaGit(); }} />

          <AktifEtiketler f={f} degis={degis} dizi={dizi} temizle={temizle} />

          {!secimVar ? (
            <Kesif ctx={ctx}
              onKategori={(id) => { degis({ kategoriler: [id] }); sonucaGit(); }}
              onPlan={(id) => { degis({ planlar: [id] }); sonucaGit(); }}
              onListe={(id) => { degis({ liste: id }); sonucaGit(); }}
              onSemt={(id) => { degis({ semtler: [id] }); sonucaGit(); }}
              onTumu={() => { degis({ tumu: true }); sonucaGit(); }} />
          ) : (
            <section ref={sonucRef} className="ist-sonuclar" aria-live="polite">
              {oneri ? (
                <div className="ist-oneri-bas" style={{ "--r": oneri.renk }}>
                  <span aria-hidden>{oneri.ikon}</span>
                  <div><b>{oneri.ad}</b><span>{oneri.ozet}</span></div>
                </div>
              ) : null}
              <div className="ist-sonuc-ust">
                <div className="ist-sonuc-sayi"><b>{sayiTR(sonuclar.length)}</b> mekân{google.aktif && google.yukleniyor ? <span className="ist-yukleniyor"><span className="ist-spin" aria-hidden /> Google verileri yükleniyor…</span> : null}</div>
                <label className="ist-sirala">
                  <span>Sırala</span>
                  <select value={sirala} onChange={(e) => {
                    const v = e.target.value;
                    if (v === "yakin" && !konum) konumIste(() => setSirala("yakin")); else setSirala(v);
                  }}>
                    <option value="skor">Uygulama Skoru</option>
                    {google.aktif ? <option value="google">Google puanı</option> : null}
                    <option value="ucuz">Fiyat: önce uygun</option>
                    <option value="pahali">Fiyat: önce lüks</option>
                    <option value="yakin">Bana en yakın</option>
                  </select>
                </label>
              </div>
              {sirala === "yakin" || f.uzaklik ? <KonumDurumu durum={konumDurum} onTekrar={() => konumIste()} onSemt={() => setAcilir("semt")} /> : null}

              {sonuclar.length === 0 ? (
                <BosDurum baslik="Bu seçimlere uyan mekân bulamadık"
                  metin="Seçimler birbirini fazla daraltmış olabilir. Aşağıdakilerden birini kaldırınca sonuçlar geri gelir."
                  oneriler={gevsetme} degis={degis} temizle={temizle} />
              ) : (
                <>
                  {gevsetme.length && sonuclar.length < 4 ? (
                    <div className="ist-ipucu">
                      Az sonuç var. {gevsetme.map((a) => (
                        <button key={a.ad} type="button" className="ist-link" onClick={() => degis(a.yama)}>{a.ad} → {a.sayi} mekân</button>
                      ))}
                    </div>
                  ) : null}
                  <ul className="ist-kartlar">
                    {sonuclar.slice(0, gosterilen).map((x) => (
                      <MekanKart key={x.m.id} x={x} f={f} isaret={isaret} onDetay={() => setSeciliId(x.m.id)} googleAktif={google.aktif} />
                    ))}
                  </ul>
                  {sonuclar.length > gosterilen ? (
                    <button type="button" className="ist-dugme genis" onClick={() => setGosterilen((n) => n + SAYFA)}>
                      Daha fazla göster ({sayiTR(sonuclar.length - gosterilen)} mekân daha)
                    </button>
                  ) : null}
                </>
              )}
            </section>
          )}
        </>
      )}

      <footer className="ist-dip">
        Rehber verisi: {VERI_TARIHI} · Michelin Rehberi 2026, Time Out İstanbul, OGGUSTO ve mekânların kendi sayfalarından derlendi.
        {google.aktif ? " Google puanları, saatler ve telefonlar Google Places'tan canlı gelir." : " Google Places bağlı olmadığı için Google puanı, çalışma saati ve telefon gösterilmiyor."}
        {" "}Sponsorlu içerik yok; sıralamayı reklam etkilemez.
      </footer>

      {secili ? (
        <Detay m={secili} g={google.veri[secili.id]} f={f} ctx={ctx} isaret={isaret} not={kayit.notlar[secili.id] || ""}
          googleAktif={google.aktif} onKapat={() => setSeciliId(null)} onSec={setSeciliId}
          onListeyeEkle={() => setListeyeEkle(secili.id)} listeSayisi={kayit.listeler.filter((l) => l.mekanlar.includes(secili.id)).length} />
      ) : null}
      {listeyeEkle ? (
        <ListeyeEkle mekan={mekanBul(listeyeEkle)} listeler={kayit.listeler} listeIslem={listeIslem} onKapat={() => setListeyeEkle(null)} />
      ) : null}
    </section>
  );
}

// ======================= ARAÇ ÇUBUĞU ========================================

// Her ekranda aynı yerde: "← Geri" + şu an nerede olduğun.
function GeriCubugu({ gecmis, geri, f, gorunum }) {
  const iz = gorunum === "kayitli" ? ["Kayıtlı mekânlar"] : [
    f.liste ? ONERILER.find((o) => o.id === f.liste)?.ad : null,
    ...f.kategoriler.map((id) => kategoriBul(id)?.ad),
    ...f.planlar.map((id) => planBul(id)?.ad),
    ...f.semtler.map((id) => bolgeBul(id)?.ad),
    f.arama.trim() ? `"${f.arama.trim()}"` : null,
    panelSayisi(f) ? `${panelSayisi(f)} filtre` : null,
  ].filter(Boolean);
  return (
    <div className="ist-gezinti">
      <button type="button" className="ist-geri" onClick={geri} disabled={!gecmis.length}
        title={gecmis.length ? "Bir önceki adıma dön" : "Geri gidilecek adım yok"}>← Geri</button>
      <span className="ist-iz">
        <b>{gorunum === "kayitli" ? "Kayıtlı" : "Keşfet"}</b>
        {iz.length && gorunum !== "kayitli" ? <> › {iz.join(" · ")}</> : !iz.length ? " › tüm İstanbul" : null}
      </span>
      {gecmis.length ? <span className="ist-adim">{gecmis.length} adım</span> : null}
    </div>
  );
}

function AracCubugu({ gecmis, geri, gorunum, f, ctx, acilir, setAcilir, degis, dizi, temizle, sonucSayisi, google, konumDurum, konumIste, onGoster }) {
  const etiket = (secili, bul, bos) => {
    if (!secili.length) return bos;
    const adlar = secili.map((id) => bul(id)?.ad).filter(Boolean);
    return adlar.length > 1 ? `${adlar[0]} +${adlar.length - 1}` : adlar[0];
  };
  const ac = (ad) => setAcilir(acilir === ad ? null : ad);
  const fs = panelSayisi(f);
  return (
    <div className="ist-arac">
      <GeriCubugu gecmis={gecmis} geri={geri} f={f} gorunum={gorunum} />
      <div className="ist-arama">
        <span aria-hidden>🔍</span>
        <input value={f.arama} onChange={(e) => degis({ arama: e.target.value })} placeholder="Mekân, mutfak ya da semt ara"
          aria-label="Mekân, mutfak ya da semt ara" />
        {f.arama ? <button type="button" onClick={() => degis({ arama: "" })} aria-label="Aramayı temizle">✕</button> : null}
      </div>
      <div className="ist-kontroller">
        <Kontrol etiket="Mekân Türü" deger={etiket(f.kategoriler, kategoriBul, "Tümü")} aktif={f.kategoriler.length > 0} acik={acilir === "kategori"} onClick={() => ac("kategori")} />
        <Kontrol etiket="Plan Türü" deger={etiket(f.planlar, planBul, "Tümü")} aktif={f.planlar.length > 0} acik={acilir === "plan"} onClick={() => ac("plan")} />
        <Kontrol etiket="Semt" deger={etiket(f.semtler, bolgeBul, "Tüm İstanbul")} aktif={f.semtler.length > 0} acik={acilir === "semt"} onClick={() => ac("semt")} />
        <button type="button" className={`ist-kontrol filtre${fs ? " aktif" : ""}${acilir === "filtre" ? " acik" : ""}`} onClick={() => ac("filtre")} aria-expanded={acilir === "filtre"}>
          <span aria-hidden>⚙</span> Filtreler{fs ? <span className="ist-rozet-sayi">{fs}</span> : null}
        </button>
      </div>

      {acilir ? (
        <Acilir baslik={{ kategori: "Mekân Türü", plan: "Plan Türü", semt: "Semt", filtre: "Filtreler" }[acilir]}
          onKapat={() => setAcilir(null)} sonucSayisi={sonucSayisi} onGoster={onGoster}
          onTemizle={() => degis({
            kategori: { kategoriler: [] }, plan: { planlar: [] }, semt: { semtler: [] },
            filtre: { fiyatlar: [], acik: false, rezervasyon: "hepsi", uzaklik: 0, minPuan: 0, minGoogle: 0, minYorum: 0 },
          }[acilir])}>
          {acilir === "kategori" ? <KategoriSecici f={f} ctx={ctx} dizi={dizi} /> : null}
          {acilir === "plan" ? <PlanSecici f={f} ctx={ctx} dizi={dizi} /> : null}
          {acilir === "semt" ? <SemtSecici f={f} ctx={ctx} dizi={dizi} /> : null}
          {acilir === "filtre" ? <FiltrePaneli f={f} ctx={ctx} degis={degis} dizi={dizi} google={google} konumDurum={konumDurum} konumIste={konumIste} /> : null}
        </Acilir>
      ) : null}
    </div>
  );
}

function Kontrol({ etiket, deger, aktif, acik, onClick }) {
  return (
    <button type="button" className={`ist-kontrol${aktif ? " aktif" : ""}${acik ? " acik" : ""}`} onClick={onClick} aria-expanded={acik} aria-haspopup="dialog">
      <span className="ist-kontrol-etiket">{etiket}</span>
      <span className="ist-kontrol-deger">{deger}</span>
      <span className="ist-kontrol-ok" aria-hidden>▾</span>
    </button>
  );
}

function Acilir({ baslik, children, onKapat, onTemizle, sonucSayisi, onGoster }) {
  useEffect(() => {
    const t = (e) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onKapat]);
  return (
    <>
      <div className="ist-acilir-perde" onClick={onKapat} aria-hidden />
      <div className="ist-acilir" role="dialog" aria-label={baslik}>
        <div className="ist-acilir-bas">
          <b>{baslik}</b>
          <button type="button" className="ist-kapat" onClick={onKapat} aria-label="Kapat">✕</button>
        </div>
        <div className="ist-acilir-govde">{children}</div>
        <div className="ist-acilir-dip">
          <button type="button" className="ist-dugme" onClick={onTemizle}>Temizle</button>
          <button type="button" className="ist-dugme ana" onClick={onGoster} disabled={!sonucSayisi}>
            {sonucSayisi ? `${sayiTR(sonucSayisi)} mekânı göster` : "Sonuç yok — seçimi gevşet"}
          </button>
        </div>
      </div>
    </>
  );
}

function Cip({ secili, onClick, ikon, ad, sayi, renk }) {
  const sifir = sayi === 0 && !secili;
  return (
    <button type="button" role="checkbox" aria-checked={secili} className={`ist-cip${secili ? " secili" : ""}${sifir ? " sifir" : ""}`}
      style={renk ? { "--r": renk } : undefined} onClick={onClick}>
      {ikon ? <span aria-hidden>{ikon}</span> : null}{ad}{sayi != null ? <em>{sayi}</em> : null}
    </button>
  );
}

const ILK_GOSTER = 6;
function KategoriSecici({ f, ctx, dizi }) {
  const [acik, setAcik] = useState({});
  // Sayı = bu seçenek tek başına (Michelin ile mutfak birlikte) seçilse kaç mekân gelir.
  const mk = f.kategoriler.filter(michelinKategoriMi);
  const nk = f.kategoriler.filter((id) => !michelinKategoriMi(id));
  const say = (k) => {
    const kat = k.michelin ? [...nk, k.id] : [...mk, k.id];
    return MEKANLAR.filter((m) => eslesir(m, { ...f, kategoriler: kat }, ctx)).length;
  };
  return (
    <div className="ist-gruplar">
      {KATEGORI_GRUPLARI.map((g) => {
        const tum = acik[g.id];
        const secililer = g.kategoriler.filter((k) => f.kategoriler.includes(k.id));
        const goster = tum ? g.kategoriler : [...new Set([...g.kategoriler.slice(0, ILK_GOSTER), ...secililer])];
        const kalan = g.kategoriler.length - goster.length;
        return (
          <fieldset key={g.id} className="ist-grup">
            <legend>{g.ikon} {g.ad}</legend>
            <div className="ist-cipler" role="group" aria-label={g.ad}>
              {goster.map((k) => <Cip key={k.id} secili={f.kategoriler.includes(k.id)} onClick={() => dizi("kategoriler", k.id)} ikon={k.ikon} ad={k.ad} sayi={say(k)} />)}
              {kalan > 0 ? <button type="button" className="ist-cip daha" onClick={() => setAcik((s) => ({ ...s, [g.id]: true }))}>+{kalan} daha</button> : null}
              {tum ? <button type="button" className="ist-cip daha" onClick={() => setAcik((s) => ({ ...s, [g.id]: false }))}>Daha az</button> : null}
            </div>
          </fieldset>
        );
      })}
      <p className="ist-dipnot">Birden fazla tür seçebilirsin; seçtiklerinden <b>herhangi birine</b> uyan mekânlar gelir.
        Michelin mekânları genel listelerde yer almaz, yalnızca <b>Michelin Rehberi</b> türlerinden birini seçince gelir;
        bir mutfakla birlikte seçersen (ör. Bib Gourmand + Kebap) ikisine birden uyanlar listelenir.</p>
    </div>
  );
}

function PlanSecici({ f, ctx, dizi }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ist-cipler" role="group" aria-label="Plan türleri">
        {PLAN_TURLERI.map((p) => (
          <Cip key={p.id} secili={f.planlar.includes(p.id)} onClick={() => dizi("planlar", p.id)} ikon={p.ikon} ad={p.ad}
            sayi={MEKANLAR.filter((m) => planUyum(m, p.id) >= PLAN_ESIK && eslesir(m, f, ctx, "plan")).length} />
        ))}
      </div>
      <p className="ist-dipnot">Planlar birleştirilebilir: "İlk Buluşma" + "Manzaralı Mekân" seçersen <b>ikisine birden</b> uyan mekânlar gelir.</p>
    </div>
  );
}

function SemtSecici({ f, ctx, dizi }) {
  const say = (b) => MEKANLAR.filter((m) => m.bolge === b.id && eslesir(m, f, ctx, "semt")).length;
  return (
    <div className="ist-semt-sec">
      {[["avrupa", "Avrupa yakası"], ["anadolu", "Anadolu yakası"]].map(([y, ad]) => (
        <fieldset key={y} className="ist-grup">
          <legend>{ad}</legend>
          <div className="ist-semt-liste">
            {BOLGELER.filter((b) => b.yaka === y).map((b) => {
              const n = say(b), s = f.semtler.includes(b.id);
              return (
                <label key={b.id} className={`ist-semt-satir${s ? " secili" : ""}${n === 0 && !s ? " sifir" : ""}`}>
                  <input type="checkbox" checked={s} onChange={() => dizi("semtler", b.id)} />
                  <span><b>{b.ad}</b><small>{b.semtler}</small></span>
                  <em>{n}</em>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function Segment({ secenekler, deger, onSec, etiket }) {
  return (
    <div className="ist-segment" role="radiogroup" aria-label={etiket}>
      {secenekler.map(([v, ad]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={deger === v} className={deger === v ? "secili" : ""} onClick={() => onSec(v)}>{ad}</button>
      ))}
    </div>
  );
}

function FiltrePaneli({ f, ctx, degis, dizi, google, konumDurum, konumIste }) {
  return (
    <div className="ist-filtre">
      <div className="ist-filtre-alan">
        <b>Fiyat</b>
        <div className="ist-cipler">
          {FIYATLAR.map((x) => (
            <Cip key={x.id} secili={f.fiyatlar.includes(x.id)} onClick={() => dizi("fiyatlar", x.id)} ad={`${x.simge} ${x.ad}`}
              sayi={MEKANLAR.filter((m) => m.fiyat === x.id && eslesir(m, f, ctx, "fiyat")).length} />
          ))}
        </div>
      </div>

      <div className="ist-filtre-alan">
        <b>Şimdi açık</b>
        <label className={`ist-anahtar${google.aktif ? "" : " pasif"}`}>
          <input type="checkbox" checked={f.acik} disabled={!google.aktif} onChange={(e) => degis({ acik: e.target.checked })} />
          <span className="ist-anahtar-iz" aria-hidden><span /></span>
          {google.aktif ? "Yalnızca şu an açık olanlar" : "Çalışma saatleri Google bağlıyken kullanılabilir"}
        </label>
      </div>

      <div className="ist-filtre-alan">
        <b>Rezervasyon</b>
        <Segment etiket="Rezervasyon" deger={f.rezervasyon} onSec={(v) => degis({ rezervasyon: v })}
          secenekler={[["hepsi", "Fark etmez"], ["gerekmez", "Rezervasyonsuz gidilebilir"], ["alir", "Rezervasyonla"]]} />
      </div>

      <div className="ist-filtre-alan">
        <b>Uzaklık</b>
        <Segment etiket="Uzaklık" deger={f.uzaklik} onSec={(v) => { degis({ uzaklik: v }); if (v && !ctx.konum) konumIste(); }}
          secenekler={[[0, "Fark etmez"], [1, "1 km"], [3, "3 km"], [5, "5 km"], [10, "10 km"]]} />
        {f.uzaklik ? <KonumDurumu durum={konumDurum} onTekrar={() => konumIste()} kisa /> : null}
        <p className="ist-dipnot">Konumun cihazında kalır, hiçbir yere gönderilmez. Mesafe {google.aktif ? "mekân konumuna göre" : "semt merkezine göre yaklaşık"} hesaplanır.</p>
      </div>

      <div className="ist-filtre-alan">
        <b>Puan ve değerlendirme</b>
        {google.aktif ? (
          <>
            <span className="ist-filtre-alt">Google puanı en az</span>
            <Segment etiket="Google puanı" deger={f.minGoogle} onSec={(v) => degis({ minGoogle: v })} secenekler={[[0, "Fark etmez"], [4, "4,0"], [4.3, "4,3"], [4.5, "4,5"]]} />
            <span className="ist-filtre-alt">Değerlendirme sayısı en az</span>
            <Segment etiket="Değerlendirme sayısı" deger={f.minYorum} onSec={(v) => degis({ minYorum: v })} secenekler={[[0, "Fark etmez"], [200, "200"], [1000, "1.000"], [5000, "5.000"]]} />
          </>
        ) : (
          <>
            <span className="ist-filtre-alt">Rehber puanı en az <i>(Google puanı bağlı değil)</i></span>
            <Segment etiket="Rehber puanı" deger={f.minPuan} onSec={(v) => degis({ minPuan: v })} secenekler={[[0, "Fark etmez"], [8, "8,0"], [8.5, "8,5"], [9, "9,0"]]} />
          </>
        )}
      </div>
    </div>
  );
}

function KonumDurumu({ durum, onTekrar, onSemt, kisa }) {
  if (durum === "var" || durum === "yok") return null;
  if (durum === "isteniyor") return <div className="ist-ipucu"><span className="ist-spin" aria-hidden /> Konumun alınıyor…</div>;
  return (
    <div className="ist-ipucu uyari" role="status">
      {durum === "izinyok"
        ? "Konum izni verilmedi, bu yüzden uzaklığa göre süzemiyoruz. Tarayıcı ayarlarından izin verebilir ya da semt seçerek devam edebilirsin."
        : "Konum alınamadı. Tekrar deneyebilir ya da semt seçerek devam edebilirsin."}
      {!kisa ? <span className="ist-ipucu-eylem">
        <button type="button" className="ist-link" onClick={onTekrar}>Tekrar dene</button>
        {onSemt ? <button type="button" className="ist-link" onClick={onSemt}>Semt seç</button> : null}
      </span> : null}
    </div>
  );
}

function AktifEtiketler({ f, degis, dizi, temizle }) {
  const l = [];
  if (f.arama.trim()) l.push({ k: "arama", ad: `"${f.arama}"`, sil: () => degis({ arama: "" }) });
  if (f.liste) l.push({ k: "liste", ad: `Liste: ${ONERILER.find((o) => o.id === f.liste)?.ad}`, sil: () => degis({ liste: null }) });
  f.kategoriler.forEach((id) => l.push({ k: `k${id}`, ad: `${kategoriBul(id)?.ikon} ${kategoriBul(id)?.ad}`, sil: () => dizi("kategoriler", id) }));
  f.planlar.forEach((id) => l.push({ k: `p${id}`, ad: `${planBul(id)?.ikon} ${planBul(id)?.ad}`, sil: () => dizi("planlar", id) }));
  f.semtler.forEach((id) => l.push({ k: `s${id}`, ad: `📍 ${bolgeBul(id)?.ad}`, sil: () => dizi("semtler", id) }));
  f.fiyatlar.forEach((id) => l.push({ k: `f${id}`, ad: fiyatSimge(id), sil: () => dizi("fiyatlar", id) }));
  if (f.acik) l.push({ k: "acik", ad: "Şimdi açık", sil: () => degis({ acik: false }) });
  if (f.rezervasyon !== "hepsi") l.push({ k: "rez", ad: f.rezervasyon === "gerekmez" ? "Rezervasyonsuz" : "Rezervasyonla", sil: () => degis({ rezervasyon: "hepsi" }) });
  if (f.uzaklik) l.push({ k: "uz", ad: `≤ ${f.uzaklik} km`, sil: () => degis({ uzaklik: 0 }) });
  if (f.minPuan) l.push({ k: "mp", ad: `Rehber ≥ ${String(f.minPuan).replace(".", ",")}`, sil: () => degis({ minPuan: 0 }) });
  if (f.minGoogle) l.push({ k: "mg", ad: `Google ≥ ${String(f.minGoogle).replace(".", ",")}`, sil: () => degis({ minGoogle: 0 }) });
  if (f.minYorum) l.push({ k: "my", ad: `${sayiTR(f.minYorum)}+ değerlendirme`, sil: () => degis({ minYorum: 0 }) });
  if (!l.length && !f.tumu) return null;
  return (
    <div className="ist-aktifler" aria-label="Seçili filtreler">
      {l.map((x) => (
        <button key={x.k} type="button" className="ist-aktif" onClick={x.sil} aria-label={`${x.ad} filtresini kaldır`}>{x.ad} <span aria-hidden>✕</span></button>
      ))}
      <button type="button" className="ist-link" onClick={temizle}>{l.length ? "Tümünü temizle" : "Keşfe dön"}</button>
    </div>
  );
}

// ======================= KEŞİF ==============================================

const KESIF_KATEGORILER = ["kebap", "hamburger", "pizza", "balik", "meyhane", "kahvalti", "kokteyl", "rooftop", "susi", "fine", "canli", "kulup"];

function Kesif({ ctx, onKategori, onPlan, onListe, onSemt, onTumu }) {
  const kullanilan = new Set();
  const foto = (l) => {
    const m = [...l].sort((a, b) => b.puan - a.puan).find((x) => x.gorsel && !kullanilan.has(x.gorsel));
    if (m) kullanilan.add(m.gorsel);
    return m?.gorsel || null;
  };
  return (
    <div className="ist-kesif">
      <section>
        <BolumBasligi baslik="Ne arıyorsun?" alt="Bir mekân türüyle başla; puanlara göre sıralı gelsin." />
        <div className="ist-karolar">
          {KESIF_KATEGORILER.map((id) => {
            const k = kategoriBul(id);
            const l = GENEL.filter(k.test);
            const g = foto(l);
            return (
              <button key={id} type="button" className="ist-karo" onClick={() => onKategori(id)}>
                {g ? <img src={g} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
                <span className="ist-karo-ic"><span aria-hidden className="ist-karo-ikon">{k.ikon}</span><b>{k.ad}</b><em>{l.length} mekân</em></span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <BolumBasligi baslik="Planın ne?" alt="Plan türü seç; o plana gerçekten uyan mekânlar öne çıksın." />
        <div className="ist-cipler">
          {PLAN_TURLERI.map((p) => (
            <Cip key={p.id} secili={false} onClick={() => onPlan(p.id)} ikon={p.ikon} ad={p.ad} sayi={GENEL.filter((m) => planUyum(m, p.id) >= PLAN_ESIK).length} />
          ))}
        </div>
      </section>

      <MichelinBolumu onKategori={onKategori} />

      <section>
        <BolumBasligi baslik="Hazır listeler" alt="Ne arayacağını bilmiyorsan: her mekânın neden listede olduğu yazıyor." />
        <ol className="ist-oneriler">
          {ONERILER.map((o, i) => (
            <li key={o.id}>
              <button type="button" className="ist-oneri" style={{ "--r": o.renk }} onClick={() => onListe(o.id)}>
                <span className="ist-oneri-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="ist-oneri-ikon" aria-hidden>{o.ikon}</span>
                <span style={{ minWidth: 0 }}>
                  <b>{o.ad}</b>
                  <span>{o.ozet}</span>
                </span>
                <em>{o.liste.length}</em>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <BolumBasligi baslik="Semt semt" alt="Bulunduğun ya da gideceğin semti seç." />
        <div className="ist-semtler">
          {BOLGELER.map((b) => {
            const l = GENEL.filter((m) => m.bolge === b.id);
            const g = foto(l);
            return (
              <button key={b.id} type="button" className="ist-semt" onClick={() => onSemt(b.id)}>
                {g ? <img src={g} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
                <span className="ist-semt-ic"><small>{b.yaka === "avrupa" ? "Avrupa" : "Anadolu"}</small><b>{b.ad}</b><em>{l.length} mekân</em></span>
              </button>
            );
          })}
        </div>
      </section>

      <button type="button" className="ist-dugme genis" onClick={onTumu}>Tüm mekânları skora göre listele ({GENEL.length})</button>
    </div>
  );
}

// Michelin mekânları genel listeden ayrı, kendi bölümünde.
function MichelinBolumu({ onKategori }) {
  const grup = KATEGORI_GRUPLARI.find((g) => g.michelin);
  return (
    <section className="ist-michelin">
      <BolumBasligi baslik="✦ Michelin Rehberi İstanbul 2026" alt="Yıldızlılar, Bib Gourmand'lar ve seçkideki restoranlar ayrı tutulur; genel listelerde görünmez." />
      <div className="ist-michelin-karolar">
        {grup.kategoriler.map((k) => {
          const l = MEKANLAR.filter(k.test).sort((a, b) => b.puan - a.puan);
          const g = l.find((m) => m.gorsel)?.gorsel;
          return (
            <button key={k.id} type="button" className="ist-michelin-karo" onClick={() => onKategori(k.id)}>
              {g ? <img src={g} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
              <span className="ist-karo-ic">
                <span className="ist-michelin-ikon" aria-hidden>{k.ikon}</span>
                <b>{k.ad}</b>
                <em>{l.length} restoran · {l.slice(0, 3).map((m) => m.ad).join(", ")}</em>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BolumBasligi({ baslik, alt }) {
  return (
    <div className="ist-bolum-bas">
      <h3>{baslik}</h3>
      {alt ? <p>{alt}</p> : null}
    </div>
  );
}

// ======================= KART ===============================================

function SkorRozet({ skor, buyuk }) {
  const renk = skor.toplam >= 80 ? "#4ade80" : skor.toplam >= 65 ? "#fde047" : "#fdba74";
  return (
    <span className={`ist-skor${buyuk ? " buyuk" : ""}`} style={{ "--r": renk }} title="Uygulama Skoru (100 üzerinden)">
      <b>{skor.toplam}</b><small>/100</small>
    </span>
  );
}

function GooglePuani({ g, googleAktif, kisa }) {
  if (g?.puan) {
    return (
      <span className="ist-google" title={`Google puanı · ${g.guncelleme ? new Date(g.guncelleme).toLocaleDateString("tr-TR") : ""}`}>
        <b>★ {g.puan.toFixed(1).replace(".", ",")}</b> <span>({sayiTR(g.yorum || 0)}{kisa ? "" : " değerlendirme"})</span> <i>Google</i>
      </span>
    );
  }
  return <span className="ist-google yok">{googleAktif ? "Google puanı bulunamadı" : "Google verisi bağlı değil"}</span>;
}

function Kapak({ m, g, oran = "16 / 10", ad = true }) {
  const [hata, setHata] = useState(false);
  const src = g?.foto || m.gorsel;
  const k = ANA_KATEGORI[m.id];
  useEffect(() => { setHata(false); }, [src]);
  return (
    <div className="ist-kapak" style={{ aspectRatio: oran, "--r": anaTur(m).renk }}>
      {src && !hata ? (
        <img src={src} alt={`${m.ad} mekân fotoğrafı`} loading="lazy" referrerPolicy="no-referrer" onError={() => setHata(true)} />
      ) : (
        <div className="ist-poster" aria-hidden><span>{k?.ikon || anaTur(m).ikon}</span></div>
      )}
      {ad ? <span className="ist-kapak-ad">{m.ad}</span> : null}
    </div>
  );
}

// Konum satırı: semt kalın, bölge ve yaka yanında, varsa uzaklık. Tıklanınca haritada açar.
function Konum({ m, g, mesafe, buyuk }) {
  const b = bolgeBul(m.bolge);
  return (
    <a className={`ist-konum${buyuk ? " buyuk" : ""}`} href={g?.harita || haritaLink(m.harita)} target="_blank" rel="noopener noreferrer"
      title="Google Haritalar'da aç">
      <span className="ist-konum-pin" aria-hidden>📍</span>
      <span className="ist-konum-metin">
        <b>{m.semt}</b>
        <span>{b ? b.ad : ""}{b ? ` · ${b.yaka === "avrupa" ? "Avrupa" : "Anadolu"} yakası` : ""}</span>
      </span>
      {mesafe ? <em>{mesafe.yaklasik ? "~" : ""}{mesafe.km.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km</em> : null}
    </a>
  );
}

function MekanKart({ x, f, isaret, onDetay, googleAktif }) {
  const { m, g, skor, mesafe } = x;
  const k = ANA_KATEGORI[m.id];
  const fav = isaret.fav(m.id);
  const gerekce = nedenler(m, f, g, ODULLER).slice(0, 2).join(" · ");
  const acik = googleAktif ? acikMi(g?.periyotlar) : null;
  const mz = muzik(m);
  const rz = rezervasyon(m, g);
  const planlar = (f.planlar.length ? f.planlar.map(planBul) : PLAN_TURLERI.filter((p) => planUyum(m, p.id) >= 0.85).slice(0, 2)).filter(Boolean);
  const atmosfer = [...new Set([...m.ozellikler.filter((o) => o !== "michelin").map((o) => ozellikBul(o)?.kisa), ...m.etiketler.filter((e) => !/michelin|bib/i.test(e))]
    .filter(Boolean).map((e) => e.charAt(0).toLocaleUpperCase("tr") + e.slice(1)))].slice(0, 3);
  return (
    <li className={`ist-kart${skor.zayif ? " zayif" : ""}`}>
      <button type="button" className="ist-kart-foto" onClick={onDetay} aria-label={`${m.ad} detaylarını incele`}>
        <Kapak m={m} g={g} ad={false} />
        <SkorRozet skor={skor} />
        <span className="ist-foto-ust">
          {m.odul ? <span className="ist-odul-rozet">✦ {ODULLER[m.odul].kisa}</span> : null}
          {acik != null ? <span className={`ist-acik${acik ? " evet" : ""}`}>{acik ? "Şimdi açık" : "Şu an kapalı"}</span> : null}
        </span>
        <span className="ist-foto-konum">📍 {m.semt}</span>
      </button>
      <div className="ist-kart-govde">
        <div className="ist-kart-ust">
          <h4><button type="button" onClick={onDetay}>{m.ad}</button></h4>
          <button type="button" className={`ist-kaydet${fav ? " secili" : ""}`} onClick={() => isaret.favDegis(m.id)}
            aria-pressed={fav} aria-label={fav ? `${m.ad} kayıtlılardan çıkar` : `${m.ad} kaydet`}>{fav ? "♥" : "♡"}</button>
        </div>
        <Konum m={m} g={g} mesafe={mesafe} />
        <div className="ist-kart-meta">
          {k ? <span style={{ color: anaTur(m).renk, fontWeight: 800 }}>{k.ikon} {k.ad}</span> : null}
          <span className="ist-fiyat">{fiyatSimge(m.fiyat)}</span>
        </div>
        <div className="ist-kart-puanlar">
          <GooglePuani g={g} googleAktif={googleAktif} kisa />
          <span className="ist-rehber">Rehber {m.puan.toFixed(1).replace(".", ",")}/10</span>
        </div>
        <p className="ist-kart-not">{m.not}</p>
        <div className="ist-kart-bilgi">
          <span title={mz.not}>🎵 Müzik: {mz.ad.toLocaleLowerCase("tr")}</span>
          <span>📅 {rz.ad}</span>
          {planlar.map((p) => <span key={p.id}>{p.ikon} {p.ad}{f.planlar.length ? `: ${planUyumEtiketi(planUyum(m, p.id)).toLocaleLowerCase("tr")}` : ""}</span>)}
        </div>
        {atmosfer.length ? <div className="ist-etiketler">{atmosfer.map((a) => <span key={a} className="ist-etiket">{a}</span>)}</div> : null}
        <div className="ist-kart-neden"><b>Neden?</b> {gerekce}</div>
        <div className="ist-kart-eylem">
          <a className="ist-dugme" href={g?.harita || haritaLink(m.harita)} target="_blank" rel="noopener noreferrer">📍 Haritada gör</a>
          <button type="button" className="ist-dugme ana" onClick={onDetay}>Detayları incele</button>
        </div>
      </div>
    </li>
  );
}

// ======================= DETAY ==============================================

function Detay({ m, g, f, ctx, isaret, not, googleAktif, onKapat, onSec, onListeyeEkle, listeSayisi }) {
  const govde = useRef(null);
  const skor = skorHesapla(m, f, g);
  const neden = nedenler(m, f, g, ODULLER);
  const k = ANA_KATEGORI[m.id];
  const b = bolgeBul(m.bolge);
  const fav = isaret.fav(m.id);
  const git = isaret.git(m.id);
  const google = g?.harita || haritaLink(m.harita);
  const acik = googleAktif ? acikMi(g?.periyotlar) : null;
  const mz = muzik(m), rz = rezervasyon(m, g), al = alkol(m, g), aa = acikAlan(m, g);
  const degil = kimIcinDegil(m);
  const fotolar = [...new Set([...(g?.fotolar || []), m.gorsel].filter(Boolean))];
  const planlar = PLAN_TURLERI.map((p) => ({ p, v: planUyum(m, p.id) })).sort((a, b) => b.v - a.v);
  const uygun = planlar.filter((x) => x.v >= PLAN_ESIK);
  const benzer = useMemo(() => MEKANLAR
    .filter((x) => x.id !== m.id && michelinMi(x) === michelinMi(m) && ANA_KATEGORI[x.id]?.id === k?.id && (x.bolge === m.bolge || x.yaka === m.yaka))
    .map((x) => ({ x, s: skorHesapla(x, f, ctx.g[x.id]).toplam })).sort((a, b) => b.s - a.s || (a.x.bolge === m.bolge ? -1 : 1)).slice(0, 6),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [m.id]);

  useEffect(() => {
    const t = (e) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", t);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", t); document.body.style.overflow = eski; };
  }, [onKapat]);
  useEffect(() => { govde.current?.scrollTo?.({ top: 0 }); }, [m.id]);

  return (
    <div className="ist-detay-perde" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <article className="ist-detay" role="dialog" aria-modal="true" aria-label={`${m.ad} detayları`}>
        <header className="ist-detay-bas">
          <GeriButon onClick={onKapat} />
          <b className="ist-detay-baslik">{m.ad}</b>
          <button type="button" className={`ist-kaydet${fav ? " secili" : ""}`} onClick={() => isaret.favDegis(m.id)} aria-pressed={fav}
            aria-label={fav ? "Kayıtlılardan çıkar" : "Kaydet"}>{fav ? "♥" : "♡"}</button>
        </header>

        <div className="ist-detay-govde" ref={govde}>
          <div className="ist-galeri" aria-label="Fotoğraflar">
            {fotolar.length ? fotolar.map((src, i) => (
              <img key={src} src={src} alt={`${m.ad} fotoğraf ${i + 1}`} loading={i ? "lazy" : "eager"} referrerPolicy="no-referrer" />
            )) : <Kapak m={m} g={g} />}
          </div>

          <div className="ist-detay-kimlik">
            <div style={{ minWidth: 0 }}>
              <div className="ist-ust-etiket" style={{ color: anaTur(m).renk }}>{k ? `${k.ikon} ${k.ad}` : anaTur(m).ad}</div>
              <h3 className="ist-detay-ad">{m.ad}</h3>
              <Konum m={m} g={g} mesafe={ctx.konum ? mesafeKm(ctx.konum, m, g) : null} buyuk />
              <div className="ist-kart-meta">
                <span className="ist-fiyat">{fiyatSimge(m.fiyat)} {FIYATLAR.find((x) => x.id === m.fiyat)?.ad}</span>
                {acik != null ? <span className={`ist-acik satir${acik ? " evet" : ""}`}>{acik ? "Şimdi açık" : "Şu an kapalı"}</span> : null}
              </div>
              {g?.adres || m.adres ? <div className="ist-adres">📍 {g?.adres || m.adres}</div> : null}
            </div>
            <SkorRozet skor={skor} buyuk />
          </div>

          <div className="ist-puan-satir">
            <div className="ist-puan-kutu">
              <span>Google</span>
              {g?.puan ? <><b>★ {g.puan.toFixed(1).replace(".", ",")}</b><small>{sayiTR(g.yorum || 0)} değerlendirme · {g.guncelleme ? new Date(g.guncelleme).toLocaleDateString("tr-TR") : ""}</small></>
                : <><b className="soluk">—</b><small>{googleAktif ? "Google'da eşleşme bulunamadı" : "Google verisi bağlı değil"}</small></>}
            </div>
            <div className="ist-puan-kutu">
              <span>Rehber puanı</span>
              <b>{m.puan.toFixed(1).replace(".", ",")}<small>/10</small></b>
              <small>Editoryal değerlendirme</small>
            </div>
            {m.odul ? (
              <div className="ist-puan-kutu">
                <span>Ödül</span>
                <b style={{ color: ODULLER[m.odul].renk, fontSize: 16 }}>{ODULLER[m.odul].kisa}</b>
                <small>Michelin Rehberi 2026{m.yesil ? " · Yeşil Yıldız" : ""}</small>
              </div>
            ) : null}
          </div>

          <section className="ist-neden-kutu" aria-label="Neden önerildi?">
            <h4>Neden önerildi?</h4>
            <ul>{neden.map((n) => <li key={n}>{n}</li>)}</ul>
            <details>
              <summary>Uygulama Skoru nasıl hesaplandı?</summary>
              <ul className="ist-skor-parca">
                {skor.parcalar.map((p) => (
                  <li key={p.id}>
                    <span><b>{p.ad}</b><small>{p.aciklama}</small></span>
                    <span className="ist-parca-bar"><span style={{ width: `${p.deger * 100}%` }} /></span>
                    <em>{Math.round(p.deger * p.agirlik)}/{p.agirlik}</em>
                  </li>
                ))}
              </ul>
              {!skor.googleVar ? <p className="ist-dipnot">Google bağlı olmadığı için ilk iki bileşen rehber puanı ve kaynak güveniyle hesaplandı.</p> : null}
            </details>
          </section>

          <p className="ist-detay-not">{m.not}</p>
          <div className="ist-imza"><span>Ne yenir / ne içilir</span>{m.imza}</div>

          <section>
            <h4 className="ist-h4">Plan uygunluğu</h4>
            <div className="ist-plan-liste">
              {(uygun.length ? uygun : planlar.slice(0, 3)).slice(0, 8).map(({ p, v }) => (
                <span key={p.id} className={`ist-plan${v >= 0.85 ? " cok" : v >= PLAN_ESIK ? "" : " degil"}`}>{p.ikon} {p.ad} <em>{planUyumEtiketi(v)}</em></span>
              ))}
            </div>
            {degil ? <p className="ist-degil"><b>Kimler için değil:</b> {degil}</p> : null}
          </section>

          <section>
            <h4 className="ist-h4">Bilgiler</h4>
            <dl className="ist-bilgiler">
              <Bilgi ad="Kategori" deger={[...new Set(KATEGORILER.filter((x) => x.test(m)).map((x) => x.ad))].slice(0, 5).join(", ")} />
              <Bilgi ad="Atmosfer" deger={[...m.ozellikler.filter((o) => o !== "michelin").map((o) => ozellikBul(o)?.ad), kalabalik(m)].filter(Boolean).join(" · ")} />
              <Bilgi ad="Müzik seviyesi" deger={`${mz.ad} — ${mz.not}`} kaynak="rehber tahmini" />
              <Bilgi ad="Fiyat" deger={`${fiyatSimge(m.fiyat)} · ${FIYATLAR.find((x) => x.id === m.fiyat)?.ad}`} />
              <Bilgi ad="Çalışma saatleri" deger={g?.saatler ? <ul className="ist-saatler">{g.saatler.map((s) => <li key={s}>{s}</li>)}</ul> : "Google bağlıyken görünür — güncel saatler için Google Haritalar'a bak."} kaynak={g?.saatler ? "Google" : null} />
              <Bilgi ad="Rezervasyon" deger={rz.ad} kaynak={rz.kaynak === "google" ? "Google" : "rehber tahmini"} />
              <Bilgi ad="Açık alan" deger={aa.var ? "Var (teras / bahçe / dış mekân)" : "Bilgi yok ya da yok"} kaynak={aa.kaynak === "google" ? "Google" : "rehber"} />
              <Bilgi ad="Alkol" deger={al.ad} kaynak={al.kaynak === "google" ? "Google" : "rehber tahmini"} />
              <Bilgi ad="Otopark / ulaşım" deger={g?.otopark ? `${g.otopark}. Yol tarifi için Google Haritalar.` : "Otopark bilgisi yok — yol tarifi ve toplu taşıma için Google Haritalar'ı kullan."} kaynak={g?.otopark ? "Google" : null} />
              {g?.telefon ? <Bilgi ad="Telefon" deger={<a href={`tel:${g.telefon.replace(/\s/g, "")}`}>{g.telefon}</a>} kaynak="Google" /> : null}
            </dl>
          </section>

          <a href={google} target="_blank" rel="noopener noreferrer" className="ist-harita" aria-label="Google Haritalar'da aç">
            <iframe key={m.id} title={`${m.ad} haritası`} src={haritaGomulu(m.harita)} referrerPolicy="no-referrer-when-downgrade" loading="lazy" />
          </a>

          <div className="ist-eylemler">
            <a href={google} target="_blank" rel="noopener noreferrer" className="ist-dugme ana">📍 Haritada aç</a>
            <a href={yolTarifi(m.harita)} target="_blank" rel="noopener noreferrer" className="ist-dugme">🧭 Yol tarifi</a>
            {g?.telefon ? <a href={`tel:${g.telefon.replace(/\s/g, "")}`} className="ist-dugme">📞 Ara</a> : null}
            {m.site || g?.site ? <a href={m.site || g.site} target="_blank" rel="noopener noreferrer" className="ist-dugme">↗ Web / rezervasyon</a> : null}
            <button type="button" className={`ist-dugme${fav ? " vurgu" : ""}`} onClick={() => isaret.favDegis(m.id)}>{fav ? "♥ Favorilerde" : "♡ Favorilere ekle"}</button>
            <button type="button" className="ist-dugme" onClick={onListeyeEkle}>＋ Listeye ekle{listeSayisi ? ` (${listeSayisi})` : ""}</button>
            <button type="button" className={`ist-dugme${git ? " vurgu-yesil" : ""}`} onClick={() => isaret.gitDegis(m.id)}>{git ? "✓ Gittim" : "Gittim olarak işaretle"}</button>
          </div>

          <NotAlani key={m.id} ilk={not} onKaydet={(v) => isaret.notYaz(m.id, v)} />

          {benzer.length ? (
            <section>
              <h4 className="ist-h4">Benzer mekânlar</h4>
              <div className="ist-benzer">
                {benzer.map(({ x, s }) => (
                  <button key={x.id} type="button" className="ist-benzer-kart" onClick={() => onSec(x.id)}>
                    <Kapak m={x} g={ctx.g[x.id]} oran="4 / 3" ad={false} />
                    <b>{x.ad}</b>
                    <span>{x.semt} · {fiyatSimge(x.fiyat)} · <em>{s}/100</em></span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function Bilgi({ ad, deger, kaynak }) {
  return (
    <div className="ist-bilgi">
      <dt>{ad}{kaynak ? <small>{kaynak}</small> : null}</dt>
      <dd>{deger}</dd>
    </div>
  );
}

function NotAlani({ ilk, onKaydet }) {
  const [v, setV] = useState(ilk);
  return (
    <label className="ist-not-alan">
      <span>Kendi notun</span>
      <textarea value={v} rows={2} onChange={(e) => setV(e.target.value)} onBlur={() => { if (v !== ilk) onKaydet(v); }}
        placeholder="Ör. bar tarafında otur, cuma çok kalabalık, şu kokteyli dene…" />
    </label>
  );
}

// ======================= KAYITLI: FAVORİLER + LİSTELER =======================

function Kayitli({ kayit, g, onSec, isaret, listeIslem, onKesfet }) {
  const [sekme, setSekme] = useState("favoriler");
  const [yeniAd, setYeniAd] = useState("");
  const [duzenle, setDuzenle] = useState(null);
  const liste = kayit.listeler.find((l) => l.id === sekme);
  const ids = sekme === "favoriler" ? kayit.favoriler : liste?.mekanlar || [];
  const mekanlar = ids.map(mekanBul).filter(Boolean);
  useEffect(() => { if (sekme !== "favoriler" && !liste) setSekme("favoriler"); }, [sekme, liste]);

  return (
    <section className="ist-kayitli">
      <div className="ist-kayitli-sekmeler" role="tablist">
        <button type="button" role="tab" aria-selected={sekme === "favoriler"} className={sekme === "favoriler" ? "secili" : ""} onClick={() => setSekme("favoriler")}>♥ Favoriler <em>{kayit.favoriler.length}</em></button>
        {kayit.listeler.map((l) => (
          <button key={l.id} type="button" role="tab" aria-selected={sekme === l.id} className={sekme === l.id ? "secili" : ""} onClick={() => setSekme(l.id)}>{l.ad} <em>{l.mekanlar.length}</em></button>
        ))}
        <form className="ist-yeni-liste" onSubmit={(e) => { e.preventDefault(); if (!yeniAd.trim()) return; const id = listeIslem.olustur(yeniAd); setYeniAd(""); setSekme(id); }}>
          <input value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="Yeni liste adı" aria-label="Yeni liste adı" maxLength={40} />
          <button type="submit" className="ist-dugme" disabled={!yeniAd.trim()}>＋ Liste</button>
        </form>
      </div>

      {liste ? (
        <div className="ist-liste-bas">
          {duzenle === liste.id ? (
            <form onSubmit={(e) => { e.preventDefault(); listeIslem.yenidenAdlandir(liste.id, e.currentTarget.ad.value); setDuzenle(null); }} className="ist-yeni-liste">
              <input name="ad" defaultValue={liste.ad} autoFocus aria-label="Liste adı" maxLength={40} />
              <button type="submit" className="ist-dugme ana">Kaydet</button>
              <button type="button" className="ist-dugme" onClick={() => setDuzenle(null)}>Vazgeç</button>
            </form>
          ) : (
            <>
              <b>{liste.ad}</b>
              <button type="button" className="ist-link" onClick={() => setDuzenle(liste.id)}>Yeniden adlandır</button>
              <button type="button" className="ist-link tehlike" onClick={() => listeIslem.sil(liste.id)}>Listeyi sil</button>
            </>
          )}
        </div>
      ) : null}

      {mekanlar.length ? (
        <ul className="ist-kayitli-liste">
          {mekanlar.map((m) => (
            <li key={m.id} className="ist-kayitli-satir">
              <button type="button" className="ist-kayitli-ana" onClick={() => onSec(m.id)}>
                <Kapak m={m} g={g[m.id]} oran="1 / 1" ad={false} />
                <span><b>{m.ad}</b><small>{ANA_KATEGORI[m.id]?.ad} · {m.semt} · {fiyatSimge(m.fiyat)}</small>{kayit.notlar[m.id] ? <i>“{kayit.notlar[m.id]}”</i> : null}</span>
              </button>
              <button type="button" className="ist-mini" onClick={() => (sekme === "favoriler" ? isaret.favDegis(m.id) : listeIslem.degistir(liste.id, m.id))}>Çıkar</button>
            </li>
          ))}
        </ul>
      ) : (
        <BosDurum baslik={sekme === "favoriler" ? "Henüz kaydettiğin mekân yok" : "Bu liste henüz boş"}
          metin={sekme === "favoriler" ? "Beğendiğin mekânlarda ♡ simgesine dokun; hepsi burada toplanır." : "Bir mekânın detayında “Listeye ekle”ye dokunarak bu listeye ekleyebilirsin."}
          eylem={{ ad: "Mekânları keşfet", fn: onKesfet }} />
      )}
    </section>
  );
}

function ListeyeEkle({ mekan, listeler, listeIslem, onKapat }) {
  const [ad, setAd] = useState("");
  useEffect(() => {
    const t = (e) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onKapat]);
  return (
    <div className="ist-detay-perde ust" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <div className="ist-kucuk-sayfa" role="dialog" aria-modal="true" aria-label="Listeye ekle">
        <header className="ist-detay-bas">
          <GeriButon onClick={onKapat} kaydedilmemis={ad.trim().length > 0} />
          <b className="ist-detay-baslik">Listeye ekle</b>
          <span />
        </header>
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          <p className="ist-dipnot" style={{ margin: 0 }}><b>{mekan.ad}</b> hangi listelerde olsun?</p>
          {listeler.length ? listeler.map((l) => (
            <label key={l.id} className="ist-semt-satir">
              <input type="checkbox" checked={l.mekanlar.includes(mekan.id)} onChange={() => listeIslem.degistir(l.id, mekan.id)} />
              <span><b>{l.ad}</b><small>{l.mekanlar.length} mekân</small></span>
            </label>
          )) : <p className="ist-dipnot" style={{ margin: 0 }}>Henüz listen yok. İlkini oluştur: "Doğum günü adayları", "Kadıköy akşamı"…</p>}
          <form className="ist-yeni-liste" onSubmit={(e) => { e.preventDefault(); if (!ad.trim()) return; listeIslem.olustur(ad, mekan.id); setAd(""); }}>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Yeni liste adı" aria-label="Yeni liste adı" maxLength={40} />
            <button type="submit" className="ist-dugme ana" disabled={!ad.trim()}>Oluştur ve ekle</button>
          </form>
          <button type="button" className="ist-dugme genis" onClick={onKapat}>Bitti</button>
        </div>
      </div>
    </div>
  );
}

// ======================= DURUMLAR ===========================================

function BosDurum({ baslik, metin, oneriler = [], degis, temizle, eylem }) {
  return (
    <div className="ist-bos" role="status">
      <span className="ist-bos-ikon" aria-hidden>🧭</span>
      <b>{baslik}</b>
      <p>{metin}</p>
      <div className="ist-bos-eylem">
        {oneriler.map((a) => <button key={a.ad} type="button" className="ist-dugme" onClick={() => degis(a.yama)}>{a.ad} <em>→ {a.sayi} mekân</em></button>)}
        {temizle ? <button type="button" className="ist-dugme ana" onClick={temizle}>Tüm seçimleri temizle</button> : null}
        {eylem ? <button type="button" className="ist-dugme ana" onClick={eylem.fn}>{eylem.ad}</button> : null}
      </div>
    </div>
  );
}

function Uyari({ tur, baslik, children }) {
  return (
    <div className={`ist-uyari ${tur}`} role="status">
      <b>{baslik}</b>
      <span>{children}</span>
    </div>
  );
}

// ======================= STİL ===============================================

const CSS = `
.ist{--zemin:#0b0b0d;--panel:#141417;--panel2:#1c1c21;--cizgi:rgba(255,255,255,.09);--metin:#f4f1ea;--soluk:#a19d94;--silik:#6c6962;--vurgu:#f472b6;
  color:var(--metin);background:radial-gradient(120% 60% at 100% 0%,rgba(244,114,182,.10),transparent 60%),var(--zemin);border-radius:24px;padding:22px 20px 18px;border:1px solid var(--cizgi);font-size:14px}
.ist *{box-sizing:border-box}
.ist button,.ist input,.ist select,.ist textarea{font-family:inherit}
.ist :focus-visible{outline:2px solid var(--vurgu);outline-offset:2px}
.ist-bas{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.ist-ust-etiket{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--vurgu)}
.ist-h1{margin:6px 0 0;font-size:clamp(28px,4.4vw,44px);line-height:1.05;font-weight:900;letter-spacing:-.02em}
.ist-alt{margin:8px 0 0;color:var(--soluk);font-size:14.5px;max-width:560px;line-height:1.55}
.ist-gorunum{display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--panel);border:1px solid var(--cizgi)}
.ist-gorunum button{height:38px;padding:0 14px;border-radius:11px;border:none;background:none;color:var(--soluk);font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.ist-gorunum button.secili{background:var(--panel2);color:var(--metin);box-shadow:0 2px 10px rgba(0,0,0,.35)}
.ist-rozet-sayi{min-width:20px;height:20px;padding:0 6px;border-radius:99px;background:var(--vurgu);color:#1a0610;font-size:11px;font-weight:900;display:inline-grid;place-items:center}
.ist-uyari{display:grid;gap:3px;padding:11px 14px;border-radius:14px;margin-bottom:12px;font-size:13px;line-height:1.5;border:1px solid}
.ist-uyari.bilgi{background:rgba(125,211,252,.08);border-color:rgba(125,211,252,.3)}
.ist-uyari.uyari{background:rgba(253,186,116,.08);border-color:rgba(253,186,116,.3)}
.ist-uyari span{color:var(--soluk)}
/* araç çubuğu */
.ist-arac{position:relative;display:grid;gap:10px;margin-bottom:10px}
@media (min-width:981px){.ist-arac{position:sticky;top:8px;z-index:30;padding:10px;margin:0 -10px 10px;border-radius:18px;background:rgba(11,11,13,.97)}}
.ist-gezinti{display:flex;align-items:center;gap:10px;min-width:0}
.ist-geri{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 16px 0 12px;border-radius:12px;cursor:pointer;font-weight:900;font-size:14px;
  background:#f4f1ea;color:#0b0b0d;border:none;box-shadow:0 6px 16px rgba(0,0,0,.35);transition:transform .15s,opacity .15s}
.ist-geri:hover:not(:disabled){transform:translateY(-1px)}
.ist-geri:disabled{background:var(--panel2);color:var(--silik);box-shadow:none;cursor:default}
.ist-iz{flex:1;min-width:0;font-size:13px;color:var(--soluk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-iz b{color:var(--metin)}
.ist-adim{flex:0 0 auto;font-size:11.5px;color:var(--silik);font-weight:800}
.ist-geri-yuzen{display:none}
.ist-arama{display:flex;align-items:center;gap:10px;height:52px;padding:0 8px 0 16px;border-radius:16px;background:var(--panel);border:1.5px solid var(--cizgi);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.ist-arama:focus-within{border-color:var(--vurgu)}
.ist-arama input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--metin);font-size:15.5px;font-weight:600}
.ist-arama input::placeholder{color:var(--silik)}
.ist-arama button{width:34px;height:34px;border-radius:10px;border:none;background:var(--panel2);color:var(--soluk);cursor:pointer;font-weight:900}
.ist-kontroller{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:8px}
.ist-kontrol{display:grid;grid-template-columns:1fr auto;align-items:center;text-align:left;min-height:52px;padding:6px 12px;border-radius:14px;cursor:pointer;
  background:var(--panel);border:1.5px solid var(--cizgi);color:var(--metin);transition:border-color .15s,background .15s,transform .15s}
.ist-kontrol:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.2)}
.ist-kontrol.aktif{border-color:rgba(244,114,182,.55);background:rgba(244,114,182,.08)}
.ist-kontrol.acik{border-color:var(--vurgu)}
.ist-kontrol-etiket{grid-column:1;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--silik)}
.ist-kontrol-deger{grid-column:1;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-kontrol-ok{grid-column:2;grid-row:1/3;color:var(--soluk);font-size:12px;transition:transform .2s}
.ist-kontrol.acik .ist-kontrol-ok{transform:rotate(180deg)}
.ist-kontrol.filtre{display:inline-flex;gap:8px;justify-content:center;font-weight:800;font-size:14px;padding:0 16px}
.ist-acilir-perde{position:fixed;inset:0;z-index:40;background:transparent}
.ist-acilir{position:absolute;z-index:41;top:calc(100% + 6px);left:0;right:0;max-height:min(70vh,640px);display:flex;flex-direction:column;
  background:#17171b;border:1px solid rgba(255,255,255,.14);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.6);animation:istAc .18s ease}
.ist-acilir-bas{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}
.ist-acilir-bas b{font-size:16px}
.ist-kapat{width:34px;height:34px;border-radius:10px;border:none;background:var(--panel2);color:var(--soluk);cursor:pointer;font-weight:900}
.ist-acilir-govde{padding:6px 16px 12px;overflow-y:auto;flex:1}
.ist-acilir-dip{display:flex;gap:8px;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--cizgi)}
.ist-acilir-dip .ana{flex:1;max-width:320px}
.ist-gruplar{display:grid;gap:14px}
.ist-grup{border:none;margin:0;padding:0;min-width:0}
.ist-grup legend{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--soluk);margin-bottom:8px;padding:0}
.ist-cipler{display:flex;flex-wrap:wrap;gap:6px}
.ist-cip{--r:#f472b6;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:99px;cursor:pointer;font-size:13px;font-weight:750;
  background:var(--panel);border:1px solid var(--cizgi);color:var(--metin);transition:background .15s,border-color .15s}
.ist-cip:hover{border-color:rgba(255,255,255,.22)}
.ist-cip em{font-style:normal;font-size:11px;color:var(--silik);font-weight:800}
.ist-cip.secili{background:color-mix(in srgb,var(--r) 20%,transparent);border-color:var(--r)}
.ist-cip.secili em{color:var(--metin)}
.ist-cip.sifir{opacity:.4}
.ist-cip.daha{color:var(--vurgu);border-style:dashed}
.ist-semt-sec{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ist-semt-liste{display:grid;gap:4px}
.ist-semt-satir{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;cursor:pointer;border:1px solid transparent}
.ist-semt-satir:hover{background:var(--panel)}
.ist-semt-satir.secili{background:rgba(244,114,182,.08);border-color:rgba(244,114,182,.4)}
.ist-semt-satir.sifir{opacity:.45}
.ist-semt-satir input{width:18px;height:18px;accent-color:#f472b6;flex:0 0 auto}
.ist-semt-satir span{flex:1;min-width:0}
.ist-semt-satir b{display:block;font-size:13.5px}
.ist-semt-satir small{display:block;color:var(--silik);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-semt-satir em{font-style:normal;color:var(--soluk);font-weight:800;font-size:12px}
.ist-filtre{display:grid;gap:16px}
.ist-filtre-alan{display:grid;gap:8px}
.ist-filtre-alan>b{font-size:13.5px}
.ist-filtre-alt{font-size:12px;color:var(--soluk)}
.ist-filtre-alt i{color:var(--silik)}
.ist-segment{display:flex;flex-wrap:wrap;gap:4px;padding:4px;border-radius:14px;background:var(--panel);border:1px solid var(--cizgi)}
.ist-segment button{flex:1 1 auto;min-height:36px;padding:0 12px;border-radius:10px;border:none;background:none;color:var(--soluk);font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
.ist-segment button.secili{background:var(--panel2);color:var(--metin);box-shadow:0 2px 8px rgba(0,0,0,.35)}
.ist-anahtar{display:inline-flex;align-items:center;gap:10px;font-size:13px;color:var(--metin);cursor:pointer}
.ist-anahtar.pasif{color:var(--silik);cursor:not-allowed}
.ist-anahtar input{position:absolute;opacity:0;width:1px;height:1px}
.ist-anahtar-iz{width:38px;height:22px;border-radius:99px;background:rgba(255,255,255,.14);position:relative;flex:0 0 auto;transition:background .2s}
.ist-anahtar-iz span{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#eee;transition:transform .2s}
.ist-anahtar input:checked+.ist-anahtar-iz{background:#f472b6}
.ist-anahtar input:checked+.ist-anahtar-iz span{transform:translateX(16px)}
.ist-anahtar input:focus-visible+.ist-anahtar-iz{outline:2px solid var(--vurgu);outline-offset:2px}
.ist-dipnot{color:var(--silik);font-size:12px;line-height:1.5;margin:0}
.ist-aktifler{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:14px}
.ist-aktif{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 12px;border-radius:99px;border:1px solid rgba(244,114,182,.45);background:rgba(244,114,182,.1);color:var(--metin);font-size:12.5px;font-weight:750;cursor:pointer}
.ist-aktif span{color:var(--soluk);font-size:11px}
.ist-aktif:hover span{color:var(--metin)}
.ist-link{background:none;border:none;padding:4px 2px;color:var(--vurgu);font-weight:800;font-size:13px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ist-link.tehlike{color:#fb7185}
.ist-dugme{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 14px;border-radius:12px;cursor:pointer;text-decoration:none;
  background:var(--panel2);border:1px solid var(--cizgi);color:var(--metin);font-weight:800;font-size:13.5px;transition:transform .15s,border-color .15s,background .15s}
.ist-dugme:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(255,255,255,.24)}
.ist-dugme:disabled{opacity:.5;cursor:not-allowed}
.ist-dugme.ana{background:linear-gradient(135deg,#f472b6,#db2777);border-color:transparent;color:#fff;box-shadow:0 8px 20px rgba(219,39,119,.3)}
.ist-dugme.genis{width:100%;margin-top:14px}
.ist-dugme.vurgu{color:#f9a8d4;border-color:rgba(244,114,182,.55)}
.ist-dugme.vurgu-yesil{color:#86efac;border-color:rgba(134,239,172,.5)}
.ist-dugme em{font-style:normal;color:var(--soluk);font-weight:700}
.ist-mini{height:32px;padding:0 12px;border-radius:10px;border:1px solid var(--cizgi);background:var(--panel2);color:var(--soluk);font-weight:800;font-size:12px;cursor:pointer}
/* keşif */
.ist-kesif{display:grid;gap:28px}
.ist-bolum-bas{margin-bottom:12px}
.ist-bolum-bas h3{margin:0;font-size:21px;font-weight:900;letter-spacing:-.01em}
.ist-bolum-bas p{margin:4px 0 0;color:var(--soluk);font-size:13.5px}
.ist-karolar{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ist-karo{position:relative;aspect-ratio:4/3;border-radius:18px;overflow:hidden;cursor:pointer;border:1px solid var(--cizgi);background:var(--panel2);padding:0;color:#fff;text-align:left;
  box-shadow:0 10px 24px rgba(0,0,0,.35);transition:transform .2s}
.ist-karo:hover{transform:translateY(-2px)}
.ist-karo img,.ist-semt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ist-karo-ic,.ist-semt-ic{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:12px;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.85))}
.ist-karo-ikon{font-size:20px}
.ist-karo b,.ist-semt b{font-size:15px;font-weight:900;line-height:1.2}
.ist-karo em,.ist-semt em{font-style:normal;font-size:11.5px;color:#ddd;font-weight:700}
.ist-oneriler{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.ist-oneri{width:100%;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;cursor:pointer;text-align:left;
  background:var(--panel);border:1px solid var(--cizgi);color:var(--metin);transition:border-color .15s,transform .15s}
.ist-oneri:hover{border-color:var(--r);transform:translateY(-1px)}
.ist-oneri-no{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--r);font-weight:800;font-size:13px}
.ist-oneri-ikon{font-size:20px}
.ist-oneri b{display:block;font-size:14.5px}
.ist-oneri span span{display:block;color:var(--soluk);font-size:12px;margin-top:2px;line-height:1.4}
.ist-oneri em{font-style:normal;color:var(--soluk);font-weight:800;font-size:12px}
.ist-semtler{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.ist-semt{position:relative;aspect-ratio:16/10;border-radius:16px;overflow:hidden;cursor:pointer;border:1px solid var(--cizgi);background:var(--panel2);padding:0;color:#fff;text-align:left;transition:transform .2s}
.ist-semt:hover{transform:translateY(-2px)}
.ist-semt small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#fbcfe8;font-weight:800}
/* sonuçlar */
.ist-sonuclar{scroll-margin-top:150px}
.ist-oneri-bas{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;border:1px solid var(--r);background:color-mix(in srgb,var(--r) 10%,transparent);margin-bottom:12px;font-size:22px}
.ist-oneri-bas b{display:block;font-size:16px}
.ist-oneri-bas span{display:block;font-size:13px;color:var(--soluk)}
.ist-sonuc-ust{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.ist-sonuc-sayi{color:var(--soluk);font-size:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ist-sonuc-sayi b{color:var(--metin);font-size:22px;font-weight:900}
.ist-yukleniyor{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--silik)}
.ist-spin{display:inline-block;width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:var(--vurgu);animation:istDon .8s linear infinite}
.ist-sirala{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:var(--soluk);font-weight:700}
.ist-sirala select{height:38px;border-radius:11px;padding:0 10px;background:var(--panel);border:1px solid var(--cizgi);color:var(--metin);font-weight:800;font-size:13px}
.ist-ipucu{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:10px 12px;border-radius:12px;background:var(--panel);border:1px dashed var(--cizgi);color:var(--soluk);font-size:13px;margin-bottom:12px}
.ist-ipucu.uyari{border-color:rgba(253,186,116,.45);color:#fed7aa}
.ist-ipucu-eylem{display:inline-flex;gap:10px}
.ist-kartlar{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.ist-kart{display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#18181c,#131316);border:1px solid var(--cizgi);
  box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 14px 30px rgba(0,0,0,.35);transition:transform .2s,border-color .2s}
.ist-kart:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.18)}
.ist-kart.zayif{opacity:.75}
.ist-kart-foto{position:relative;display:block;padding:0;border:none;background:none;cursor:pointer}
.ist-kapak{position:relative;width:100%;overflow:hidden;background:linear-gradient(135deg,#222,#151515)}
.ist-kapak img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ist-poster{position:absolute;inset:0;display:grid;place-items:center;font-size:42px;background:radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--r) 35%,transparent),transparent 60%),#17171a}
.ist-kapak-ad{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;font-weight:900;font-size:18px;color:#fff;background:linear-gradient(180deg,transparent,rgba(0,0,0,.85))}
.ist-skor{--r:#4ade80;position:absolute;top:10px;right:10px;display:inline-flex;align-items:baseline;gap:1px;padding:5px 9px;border-radius:12px;background:rgba(10,10,12,.82);backdrop-filter:blur(6px);border:1px solid color-mix(in srgb,var(--r) 55%,transparent);box-shadow:0 6px 16px rgba(0,0,0,.4)}
.ist-skor b{color:var(--r);font-size:18px;font-weight:900;font-variant-numeric:tabular-nums}
.ist-skor small{color:var(--soluk);font-size:10.5px;font-weight:800}
.ist-skor.buyuk{position:static;padding:10px 14px;border-radius:16px;flex-direction:column;align-items:center;gap:0}
.ist-skor.buyuk b{font-size:34px;line-height:1}
.ist-skor.buyuk::after{content:"Uygulama Skoru";font-size:10px;color:var(--silik);font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-top:3px}
.ist-acik{position:absolute;left:10px;top:10px;padding:4px 9px;border-radius:99px;font-size:11px;font-weight:900;background:rgba(10,10,12,.82);color:#fda4af;border:1px solid rgba(253,164,175,.4)}
.ist-acik.evet{color:#86efac;border-color:rgba(134,239,172,.45)}
.ist-acik.satir{position:static}
.ist-foto-ust{position:absolute;left:10px;top:10px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.ist-foto-ust .ist-acik{position:static}
.ist-foto-konum{position:absolute;left:10px;bottom:10px;max-width:calc(100% - 20px);padding:5px 10px;border-radius:99px;font-size:12px;font-weight:900;color:#fff;background:rgba(10,10,12,.82);border:1px solid rgba(255,255,255,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-konum{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:12px;background:rgba(244,114,182,.07);border:1px solid rgba(244,114,182,.22);color:var(--metin);text-decoration:none;min-width:0}
.ist-konum:hover{border-color:rgba(244,114,182,.5)}
.ist-konum-pin{font-size:16px;flex:0 0 auto}
.ist-konum-metin{flex:1;min-width:0;display:grid}
.ist-konum-metin b{font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-konum-metin span{font-size:11.5px;color:var(--soluk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-konum em{font-style:normal;font-size:12px;font-weight:900;color:#f9a8d4;flex:0 0 auto}
.ist-konum.buyuk{margin-top:6px;padding:10px 12px}
.ist-konum.buyuk b{font-size:16px}
.ist-michelin{padding:18px;border-radius:22px;background:linear-gradient(160deg,rgba(232,194,90,.12),rgba(232,194,90,.02));border:1px solid rgba(232,194,90,.35)}
.ist-michelin .ist-bolum-bas h3{color:#f3d98b}
.ist-michelin-karolar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ist-michelin-karo{position:relative;aspect-ratio:16/10;border-radius:16px;overflow:hidden;cursor:pointer;border:1px solid rgba(232,194,90,.4);background:#17140b;padding:0;color:#fff;text-align:left;transition:transform .2s}
.ist-michelin-karo:hover{transform:translateY(-2px)}
.ist-michelin-karo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ist-michelin-karo b{font-size:17px;font-weight:900}
.ist-michelin-karo em{font-style:normal;font-size:11.5px;color:#eee;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ist-michelin-ikon{color:#e8c25a;font-size:20px}
.ist-odul-rozet{padding:4px 9px;border-radius:99px;font-size:11px;font-weight:900;background:rgba(10,10,12,.85);color:#e8c25a;border:1px solid rgba(232,194,90,.45)}
.ist-kart-govde{display:flex;flex-direction:column;gap:8px;padding:12px 14px 14px;flex:1}
.ist-kart-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.ist-kart-ust h4{margin:0;font-size:18px;font-weight:900;letter-spacing:-.01em;line-height:1.2}
.ist-kart-ust h4 button{background:none;border:none;padding:0;color:inherit;font:inherit;cursor:pointer;text-align:left}
.ist-kaydet{flex:0 0 auto;width:38px;height:38px;border-radius:12px;border:1px solid var(--cizgi);background:var(--panel2);color:var(--soluk);font-size:18px;cursor:pointer;transition:transform .15s}
.ist-kaydet:hover{transform:scale(1.06)}
.ist-kaydet.secili{color:#f472b6;border-color:rgba(244,114,182,.6);background:rgba(244,114,182,.1)}
.ist-kart-meta{display:flex;flex-wrap:wrap;gap:4px 10px;color:var(--soluk);font-size:12.5px;align-items:center}
.ist-fiyat{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--metin)}
.ist-kart-puanlar{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.ist-google{font-size:12.5px;color:var(--soluk)}
.ist-google b{color:#fcd34d;font-weight:900}
.ist-google i{font-style:normal;font-size:10.5px;color:var(--silik);border:1px solid var(--cizgi);border-radius:6px;padding:0 5px;margin-left:2px}
.ist-google.yok{font-size:11.5px;color:var(--silik);border:1px dashed var(--cizgi);border-radius:8px;padding:2px 8px}
.ist-rehber{font-size:12px;color:var(--soluk);font-weight:700}
.ist-kart-not{margin:0;font-size:13.5px;line-height:1.55;color:#ddd8cf;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ist-kart-bilgi{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--soluk)}
.ist-etiketler{display:flex;flex-wrap:wrap;gap:5px}
.ist-etiket{font-size:11.5px;padding:3px 9px;border-radius:99px;border:1px solid var(--cizgi);color:var(--soluk)}
.ist-kart-neden{font-size:12.5px;color:#f9d6e8;line-height:1.45;padding:8px 10px;border-radius:12px;background:rgba(244,114,182,.07);border:1px solid rgba(244,114,182,.18)}
.ist-kart-neden b{color:var(--vurgu)}
.ist-kart-eylem{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto;padding-top:4px}
/* boş durum */
.ist-bos{display:grid;justify-items:center;text-align:center;gap:8px;padding:34px 18px;border-radius:20px;border:1px dashed var(--cizgi);background:var(--panel)}
.ist-bos-ikon{font-size:34px}
.ist-bos b{font-size:17px}
.ist-bos p{margin:0;color:var(--soluk);max-width:460px;line-height:1.55;font-size:13.5px}
.ist-bos-eylem{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:6px}
/* detay */
.ist-detay-perde{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);display:flex;justify-content:flex-end;animation:istPerde .2s ease}
.ist-detay-perde.ust{z-index:9100;justify-content:center;align-items:center;padding:20px}
.ist-detay{width:min(760px,100%);height:100%;display:flex;flex-direction:column;background:#0f0f12;border-left:1px solid var(--cizgi,rgba(255,255,255,.09));color:#f4f1ea;animation:istKay .25s ease;box-shadow:-30px 0 80px rgba(0,0,0,.5)}
.ist-kucuk-sayfa{width:min(440px,100%);max-height:calc(100vh - 40px);overflow-y:auto;background:#141417;border:1px solid rgba(255,255,255,.12);border-radius:20px;color:#f4f1ea;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:istAc .2s ease}
.ist-detay-bas{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(15,15,18,.95);position:sticky;top:0;z-index:2}
.ist-detay-baslik{flex:1;min-width:0;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-detay-govde{flex:1;overflow-y:auto;overflow-x:hidden;padding:0 18px 28px;display:grid;grid-template-columns:minmax(0,1fr);grid-auto-rows:max-content;gap:18px;align-content:start}
.ist-detay-govde>*{min-width:0}
.ist-galeri{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -18px;padding:0 18px;scrollbar-width:thin}
.ist-galeri img{flex:0 0 88%;max-width:600px;height:clamp(210px,34vw,380px);object-fit:cover;border-radius:16px;scroll-snap-align:start;background:#1b1b1f}
.ist-galeri img:only-child{flex-basis:100%;max-width:none}
.ist-galeri .ist-kapak{border-radius:16px;flex:1}
.ist-detay-kimlik{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
.ist-detay-ad{margin:4px 0 6px;font-size:clamp(24px,3.6vw,32px);font-weight:900;letter-spacing:-.02em;line-height:1.1}
.ist-adres{font-size:12.5px;color:#8f8a80;margin-top:6px}
.ist-puan-satir{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.ist-puan-kutu{display:grid;gap:2px;padding:12px;border-radius:14px;background:#17171b;border:1px solid rgba(255,255,255,.08)}
.ist-puan-kutu span{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6c6962}
.ist-puan-kutu b{font-size:22px;font-weight:900;color:#fcd34d}
.ist-puan-kutu b.soluk{color:#6c6962}
.ist-puan-kutu b small{font-size:12px;color:#a19d94}
.ist-puan-kutu>small{font-size:11.5px;color:#a19d94}
.ist-neden-kutu{padding:16px;border-radius:18px;background:linear-gradient(160deg,rgba(244,114,182,.14),rgba(244,114,182,.04));border:1px solid rgba(244,114,182,.35)}
.ist-neden-kutu h4{margin:0 0 8px;font-size:17px;font-weight:900}
.ist-neden-kutu>ul{margin:0;padding-left:18px;display:grid;gap:4px;font-size:14px;line-height:1.5}
.ist-neden-kutu details{margin-top:10px}
.ist-neden-kutu summary{cursor:pointer;color:#f9a8d4;font-weight:800;font-size:13px}
.ist-skor-parca{list-style:none;margin:10px 0 6px;padding:0;display:grid;gap:8px}
.ist-skor-parca li{display:grid;grid-template-columns:1fr 90px 44px;gap:10px;align-items:center}
.ist-skor-parca b{display:block;font-size:12.5px}
.ist-skor-parca small{display:block;font-size:11px;color:#a19d94}
.ist-parca-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.ist-parca-bar span{display:block;height:100%;background:#f472b6;border-radius:99px}
.ist-skor-parca em{font-style:normal;font-size:12px;color:#a19d94;font-weight:800;text-align:right;font-variant-numeric:tabular-nums}
.ist-detay-not{margin:0;font-size:15px;line-height:1.65}
.ist-imza{padding:10px 12px;border-radius:12px;background:#17171b;border-left:3px solid #f472b6;font-size:13.5px}
.ist-imza span{display:block;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#f472b6;margin-bottom:3px}
.ist-h4{margin:0 0 10px;font-size:15px;font-weight:900}
.ist-plan-liste{display:flex;flex-wrap:wrap;gap:6px}
.ist-plan{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:99px;font-size:12.5px;font-weight:750;background:#17171b;border:1px solid rgba(255,255,255,.1)}
.ist-plan em{font-style:normal;font-size:11px;color:#a19d94}
.ist-plan.cok{border-color:rgba(74,222,128,.5)}
.ist-plan.cok em{color:#86efac}
.ist-plan.degil{opacity:.55}
.ist-degil{margin:10px 0 0;font-size:13px;color:#a19d94;line-height:1.5}
.ist-degil b{color:#fda4af}
.ist-bilgiler{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}
.ist-bilgi{padding:10px 12px;border-radius:12px;background:#141417;border:1px solid rgba(255,255,255,.07)}
.ist-bilgi dt{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6c6962;display:flex;gap:6px;align-items:center}
.ist-bilgi dt small{text-transform:none;letter-spacing:0;font-weight:700;color:#8f8a80;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:0 5px}
.ist-bilgi dd{margin:4px 0 0;font-size:13.5px;line-height:1.5}
.ist-bilgi a{color:#f9a8d4}
.ist-saatler{margin:0;padding-left:16px;font-size:12.5px}
.ist-harita{display:block;height:220px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}
.ist-harita iframe{width:100%;height:100%;border:0;pointer-events:none;filter:grayscale(.2) contrast(1.05)}
.ist-eylemler{display:flex;flex-wrap:wrap;gap:8px}
.ist-not-alan{display:grid;gap:6px}
.ist-not-alan span{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6c6962}
.ist-not-alan textarea{width:100%;border-radius:12px;padding:10px 12px;background:#141417;border:1px solid rgba(255,255,255,.1);color:#f4f1ea;font-size:14px;resize:vertical}
.ist-benzer{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(170px,1fr);gap:10px;overflow-x:auto;padding-bottom:6px}
.ist-benzer-kart{display:grid;gap:4px;text-align:left;padding:0 0 10px;border-radius:14px;overflow:hidden;background:#141417;border:1px solid rgba(255,255,255,.08);color:#f4f1ea;cursor:pointer}
.ist-benzer-kart b{padding:0 10px;font-size:13.5px}
.ist-benzer-kart span{padding:0 10px;font-size:11.5px;color:#a19d94}
.ist-benzer-kart em{font-style:normal;color:#86efac;font-weight:800}
/* kayıtlı */
.ist-kayitli{display:grid;gap:14px}
.ist-kayitli-sekmeler{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ist-kayitli-sekmeler>button{height:38px;padding:0 14px;border-radius:99px;border:1px solid var(--cizgi);background:var(--panel);color:var(--soluk);font-weight:800;cursor:pointer}
.ist-kayitli-sekmeler>button.secili{color:var(--metin);border-color:var(--vurgu);background:rgba(244,114,182,.1)}
.ist-kayitli-sekmeler em{font-style:normal;font-size:11.5px;margin-left:4px;color:var(--silik)}
.ist-yeni-liste{display:flex;gap:6px;flex:1 1 260px;min-width:0}
.ist-yeni-liste input{flex:1;min-width:0;height:42px;border-radius:12px;padding:0 12px;background:var(--panel,#141417);border:1px solid rgba(255,255,255,.12);color:#f4f1ea;font-size:14px;outline:none}
.ist-yeni-liste input:focus{border-color:#f472b6}
.ist-liste-bas{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.ist-liste-bas>b{font-size:18px}
.ist-kayitli-liste{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px}
.ist-kayitli-satir{display:flex;align-items:center;gap:10px;padding:8px;border-radius:16px;background:var(--panel);border:1px solid var(--cizgi)}
.ist-kayitli-ana{flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:none;border:none;color:inherit;text-align:left;cursor:pointer;padding:0}
.ist-kayitli-ana .ist-kapak{width:64px;flex:0 0 64px;border-radius:12px}
.ist-kayitli-ana b{display:block;font-size:14.5px}
.ist-kayitli-ana small{display:block;color:var(--soluk);font-size:12px}
.ist-kayitli-ana i{display:block;color:var(--silik);font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ist-dip{margin-top:22px;padding-top:14px;border-top:1px solid var(--cizgi);color:var(--silik);font-size:12px;line-height:1.6}
@keyframes istAc{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes istPerde{from{opacity:0}to{opacity:1}}
@keyframes istKay{from{transform:translateX(40px);opacity:.4}to{transform:none;opacity:1}}
@keyframes istDon{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ist *{animation:none!important;transition:none!important}.ist-detay,.ist-detay-perde,.ist-acilir,.ist-kucuk-sayfa{animation:none}}
@media (max-width:980px){
  .ist-kontroller{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ist-kontrol.filtre{min-height:52px}
}
@media (max-width:640px){
  .ist{padding:16px 12px 14px;border-radius:18px;margin:0 -4px}
  .ist-gorunum{width:100%}.ist-gorunum button{flex:1;justify-content:center}
  .ist-kontroller{display:flex;overflow-x:auto;scrollbar-width:none;margin:0 -12px;padding:0 12px 2px}
  .ist-kontroller::-webkit-scrollbar{display:none}
  .ist-kontrol{flex:0 0 auto;min-width:138px;max-width:190px}
  .ist-kontrol.filtre{min-width:auto}
  .ist-acilir-perde{background:rgba(0,0,0,.55)}
  .ist-acilir{position:fixed;left:0;right:0;bottom:0;top:auto;max-height:85vh;border-radius:22px 22px 0 0;animation:istYukari .22s ease}
  .ist-semt-sec{grid-template-columns:1fr}
  .ist-kartlar{grid-template-columns:1fr}
  .ist-karolar{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ist-semtler{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ist-oneriler{grid-template-columns:1fr}
  .ist-detay{width:100%;border-left:none}
  .ist-detay-govde{padding:0 14px 28px}
  .ist-galeri{margin:0 -14px;padding:0 14px}
  .ist-detay-perde.ust{padding:0;align-items:flex-end}
  .ist-geri-yuzen{display:inline-flex;align-items:center;position:fixed;left:14px;bottom:84px;z-index:60;height:46px;padding:0 18px;border-radius:99px;border:none;
    background:#f4f1ea;color:#0b0b0d;font-weight:900;font-size:15px;box-shadow:0 10px 26px rgba(0,0,0,.55);cursor:pointer}
  .ist-michelin-karolar{grid-template-columns:1fr}
  .ist-michelin{padding:14px}
  .ist-kucuk-sayfa{width:100%;border-radius:22px 22px 0 0;max-height:85vh}
  .ist-kayitli-liste{grid-template-columns:1fr}
  .ist-skor-parca li{grid-template-columns:1fr 60px 40px}
}
@keyframes istYukari{from{transform:translateY(30px);opacity:.5}to{transform:none;opacity:1}}
`;
