"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SEHIRLER, PARALAR, VIZELER, BOLGELER, SIRALAMALAR, KONAKLAMA_SEVIYELERI,
  PUAN_BASLIKLARI, genelPuan, YURTDISI_HARC, SIGORTA_GUNLUK, seviyeNormalle,
} from "../lib/destinasyonlar";
import { ROTALAR } from "../lib/rotalar";
import { supabase } from "../lib/supabaseClient";
import { num, tl, yeniId, satirInput, Kutu, KutuIzgara, Tablo, Alan, Izgara, Not } from "./panelUI";

// Seyahat Planlayıcı.
//
// Üç ekran:
//   KEŞFET  — şehirleri karşılaştır, filtrele, sırala
//   ŞEHİR   — o şehrin dosyası: puan, görseller, saat saat rota, canlı bütçe
//   DEFTER  — yıllık plan, hayal listesi, gidilen yerler ve fotoğraflar
//
// Vize ücreti bütçeye DAHİL DEĞİL: harç ve hizmet bedeli konsolosluğa, aracı
// kuruma ve kura göre değişiyor; sabit yazmak yanıltıyordu. Vize bilgisi
// kalıyor, tutarı değil.

const uzunluk = (id) => (ROTALAR[id] || []).length;
const BUGUN = () => new Date().toISOString().slice(0, 10);
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const kisaTarih = (iso) => {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
};
const gunFark = (iso) => Math.round((new Date(iso + "T12:00:00") - new Date(BUGUN() + "T12:00:00")) / 86400000);

export default function TatilPlanlayici({ data, setData, userId }) {
  const kayit = data || {};
  const [gorunum, setGorunum] = useState("kesfet");
  const [seciliId, setSeciliId] = useState(null);

  const kurlar = {
    ...Object.fromEntries(Object.entries(PARALAR).map(([k, v]) => [k, v.kur])),
    ...(kayit.kurlar || {}),
  };

  const ayarDegis = (sehirId, alan, deger) =>
    setData((s) => {
      const mevcut = ((s || {}).ayarlar || {})[sehirId] || {};
      return { ...(s || {}), ayarlar: { ...((s || {}).ayarlar || {}), [sehirId]: { ...mevcut, [alan]: deger } } };
    });
  const kurDegis = (kod, deger) =>
    setData((s) => ({ ...(s || {}), kurlar: { ...((s || {}).kurlar || {}), [kod]: num(deger) } }));

  const sehirAc = (id) => { setSeciliId(id); setGorunum("sehir"); if (typeof window !== "undefined") window.scrollTo(0, 0); };
  const defterAc = () => { setGorunum("defter"); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  const planlar = Array.isArray(kayit.planlar) ? kayit.planlar : [];
  const hayaller = Array.isArray(kayit.hayaller) ? kayit.hayaller : [];

  return (
    <section>
      <UstGezinme gorunum={gorunum} onGorunum={(g) => { setGorunum(g); window.scrollTo(0, 0); }}
        planSayisi={planlar.filter((p) => p.durum !== "gidildi").length}
        gidilenSayisi={planlar.filter((p) => p.durum === "gidildi").length} />

      {gorunum === "kesfet" ? (
        <KesfetEkrani kurlar={kurlar} planlar={planlar} onSehir={sehirAc} />
      ) : gorunum === "sehir" && seciliId ? (
        <SehirSayfasi
          sehir={SEHIRLER.find((s) => s.id === seciliId)}
          ayar={(kayit.ayarlar || {})[seciliId] || {}}
          kurlar={kurlar}
          planlar={planlar}
          onAyar={(alan, deger) => ayarDegis(seciliId, alan, deger)}
          onKur={kurDegis}
          onGeri={() => { setGorunum("kesfet"); window.scrollTo(0, 0); }}
          onPlanla={(plan) => { setData((s) => ({ ...(s || {}), planlar: [...(Array.isArray((s || {}).planlar) ? s.planlar : []), plan] })); defterAc(); }}
        />
      ) : (
        <SeyahatDefteri
          planlar={planlar} hayaller={hayaller} setData={setData} userId={userId}
          onSehir={sehirAc}
        />
      )}
    </section>
  );
}

function UstGezinme({ gorunum, onGorunum, planSayisi, gidilenSayisi }) {
  const sekmeler = [
    { id: "kesfet", ad: "Keşfet", ikon: "🧭", rozet: `${SEHIRLER.length} şehir` },
    { id: "defter", ad: "Seyahat Defterim", ikon: "📔", rozet: `${planSayisi} plan · ${gidilenSayisi} gidildi` },
  ];
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 16, flexWrap: "wrap" }}>
      {sekmeler.map((s) => {
        const aktif = gorunum === s.id || (s.id === "kesfet" && gorunum === "sehir");
        return (
          <button key={s.id} type="button" onClick={() => onGorunum(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 9, padding: "11px 17px", borderRadius: 14, cursor: "pointer",
              border: `1px solid ${aktif ? "rgba(45,212,191,.6)" : "rgba(148,163,184,.2)"}`,
              background: aktif ? "linear-gradient(120deg, rgba(45,212,191,.26), rgba(45,212,191,.08))" : "rgba(2,6,23,.45)",
              color: aktif ? "#fff" : "#94a3b8", fontSize: 14, fontWeight: 900,
            }}>
            <span style={{ fontSize: 16 }}>{s.ikon}</span>{s.ad}
            <span style={{
              color: aktif ? "#2dd4bf" : "#64748b", fontSize: 10.5, fontWeight: 700,
              border: `1px solid ${aktif ? "rgba(45,212,191,.4)" : "rgba(148,163,184,.2)"}`,
              borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap",
            }}>{s.rozet}</span>
          </button>
        );
      })}
    </div>
  );
}

// ======================= KEŞFET =============================================

function KesfetEkrani({ kurlar, planlar, onSehir }) {
  const [bolge, setBolge] = useState("hepsi");
  const [siralama, setSiralama] = useState("puan");
  const [sadeceVizesiz, setSadeceVizesiz] = useState(false);
  const [arama, setArama] = useState("");

  const gunlukTL = (s) => {
    const kur = num(kurlar[s.para]) || PARALAR[s.para].kur;
    return (num(s.gunluk.yemek) + num(s.gunluk.ulasim) + num(s.gunluk.ekstra)) * kur;
  };
  const gidilen = new Set(planlar.filter((p) => p.durum === "gidildi").map((p) => p.sehirId));
  const planli = new Set(planlar.filter((p) => p.durum !== "gidildi").map((p) => p.sehirId));

  const liste = useMemo(() => {
    const t = arama.trim().toLocaleLowerCase("tr");
    let l = SEHIRLER.filter((s) => (bolge === "hepsi" ? true : s.bolge === bolge));
    if (sadeceVizesiz) l = l.filter((s) => s.vize === "yok" || s.vize === "kimlik");
    if (t) l = l.filter((s) => s.ad.toLocaleLowerCase("tr").includes(t) || s.ulke.toLocaleLowerCase("tr").includes(t));
    const sure = (s) => parseFloat(String(s.ucusSure).replace(",", ".")) || 99;
    const k = [...l];
    if (siralama === "puan") k.sort((a, b) => genelPuan(b.puan) - genelPuan(a.puan));
    else if (siralama === "ucuz") k.sort((a, b) => gunlukTL(a) + a.ucusTL - (gunlukTL(b) + b.ucusTL));
    else if (siralama === "yakin") k.sort((a, b) => sure(a) - sure(b));
    else if (siralama === "populer") k.sort((a, b) => b.ziyaretci - a.ziyaretci);
    else if (siralama === "tarih") k.sort((a, b) => b.puan.tarih - a.puan.tarih || genelPuan(b.puan) - genelPuan(a.puan));
    return k;
  }, [bolge, siralama, sadeceVizesiz, arama, kurlar]);

  return (
    <>
      <KesfetBasligi toplam={SEHIRLER.length} gidilen={gidilen.size} />

      <div style={{ display: "grid", gap: 11, marginBottom: 18 }}>
        <input value={arama} placeholder="🔍 Şehir ya da ülke ara…"
          onChange={(e) => setArama(e.target.value)}
          style={{ ...satirInput, height: 46, fontSize: 14.5, borderRadius: 13 }} />

        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 3 }}>
          {BOLGELER.map((b) => {
            const secili = b.id === bolge;
            return (
              <button key={b.id} type="button" onClick={() => setBolge(b.id)}
                style={{
                  flex: "0 0 auto", padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  fontSize: 13, fontWeight: 800, whiteSpace: "nowrap",
                  border: `1px solid ${secili ? "rgba(45,212,191,.7)" : "rgba(148,163,184,.22)"}`,
                  background: secili ? "linear-gradient(120deg, rgba(45,212,191,.3), rgba(45,212,191,.1))" : "rgba(2,6,23,.4)",
                  color: secili ? "#fff" : "#94a3b8",
                }}>{b.ikon} {b.ad}</button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SIRALAMALAR.map((s) => {
              const secili = s.id === siralama;
              return (
                <button key={s.id} type="button" onClick={() => setSiralama(s.id)}
                  style={{
                    padding: "6px 11px", borderRadius: 9, cursor: "pointer", fontSize: 11.5, fontWeight: 700,
                    border: `1px solid ${secili ? "rgba(96,165,250,.6)" : "rgba(148,163,184,.18)"}`,
                    background: secili ? "rgba(96,165,250,.16)" : "transparent",
                    color: secili ? "#93c5fd" : "#64748b", whiteSpace: "nowrap",
                  }}>{s.ikon} {s.ad}</button>
              );
            })}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginLeft: "auto" }}>
            <input type="checkbox" checked={sadeceVizesiz} onChange={(e) => setSadeceVizesiz(e.target.checked)} />
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>Sadece vizesiz</span>
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 15 }}>
        {liste.map((s, i) => (
          <SehirKarti key={s.id} sehir={s} sira={siralama === "puan" && !arama ? i + 1 : null}
            gunlukTL={gunlukTL(s)} durum={gidilen.has(s.id) ? "gidildi" : planli.has(s.id) ? "planli" : null}
            onAc={() => onSehir(s.id)} />
        ))}
      </div>

      {!liste.length ? <Not tur="uyari">Bu filtreyle eşleşen şehir yok. Aramayı ya da bölgeyi değiştir.</Not> : null}

      <div style={{ marginTop: 18 }}>
        <Not tur="bilgi">
          <strong>Puanlar nasıl hesaplanıyor?</strong> Altı başlık 10 üzerinden değerlendirilir: tarih & kültür,
          yeme & içme, gece hayatı, doğa & manzara, gezilebilirlik ve bütçe dostluğu (burada <strong>yüksek puan
          ucuz</strong> demektir). Genel puan ilk beşin ağırlıklı ortalamasıdır; <strong>bütçe bilinçli olarak dışarıda
          bırakıldı</strong> — ucuz olmak bir şehri daha iyi yapmaz, ayrı bir karardır ve yukarıdan ayrıca sıralanabilir.
        </Not>
      </div>
    </>
  );
}

// Kahraman şeridi: beş şehirden kolaj + üstüne degrade. Alanı ilk bakışta
// "burası seyahat" diye anlatan şey bu.
function KesfetBasligi({ toplam, gidilen }) {
  const kolaj = useMemo(() => {
    const secim = ["roma", "tokyo", "barselona", "kopenhag", "bali"]
      .map((id) => SEHIRLER.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => s.gorseller[0])
      .filter(Boolean);
    return secim;
  }, []);

  return (
    <header style={{
      position: "relative", overflow: "hidden", borderRadius: 22, marginBottom: 18,
      border: "1px solid rgba(45,212,191,.3)", minHeight: 220,
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {kolaj.map((g, i) => (
          <div key={i} style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <img src={g} alt="" loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(100deg, rgba(2,10,20,.97) 18%, rgba(2,10,20,.82) 45%, rgba(13,148,136,.42) 80%, rgba(2,10,20,.6))",
      }} />
      <div style={{ position: "relative", padding: "26px 24px" }}>
        <div style={{ color: "#2dd4bf", fontSize: 11.5, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Seyahat Planlayıcı
        </div>
        <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "9px 0 0", lineHeight: 1.15 }}>
          Nereye gidiyoruz?
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: 13.5, margin: "10px 0 0", lineHeight: 1.65, maxWidth: 560 }}>
          {toplam} şehir, 27 ülke. Her biri altı başlıkta puanlandı; hepsinde saat saat günlük rota,
          gezilecek yerler ve canlı tazelenen bütçe var.
          <strong style={{ color: "#fff" }}> Bir şehir seç — program ve bütçe anında oluşsun.</strong>
        </p>
        {gidilen > 0 ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14,
            border: "1px solid rgba(52,211,153,.4)", background: "rgba(52,211,153,.14)",
            borderRadius: 999, padding: "6px 14px",
          }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <span style={{ color: "#6ee7b7", fontSize: 12.5, fontWeight: 800 }}>{gidilen} şehir gezildi</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function PuanRozeti({ puan, buyuk }) {
  const renk = puan >= 8.5 ? "#34d399" : puan >= 7.5 ? "#a3e635" : puan >= 6.5 ? "#fbbf24" : "#fb923c";
  return (
    <span style={{
      display: "inline-flex", alignItems: "baseline", gap: 3,
      background: `${renk}22`, border: `1px solid ${renk}66`, borderRadius: 10,
      padding: buyuk ? "5px 11px" : "3px 8px", whiteSpace: "nowrap",
    }}>
      <strong style={{ color: renk, fontSize: buyuk ? 19 : 14, fontWeight: 900, lineHeight: 1 }}>
        {puan.toFixed(1).replace(".", ",")}
      </strong>
      <span style={{ color: renk, fontSize: buyuk ? 11 : 9.5, opacity: 0.75 }}>/10</span>
    </span>
  );
}

function SehirKarti({ sehir, sira, gunlukTL, durum, onAc }) {
  const puan = genelPuan(sehir.puan);
  const vize = VIZELER[sehir.vize];
  const gun = uzunluk(sehir.id) || sehir.onerilenGun;
  return (
    <button type="button" onClick={onAc}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: 0, cursor: "pointer",
        border: `1px solid ${durum === "gidildi" ? "rgba(52,211,153,.5)" : sehir.renk + "33"}`,
        borderRadius: 18, overflow: "hidden", background: "rgba(2,6,23,.45)",
      }}>
      <div style={{ position: "relative", height: 165, overflow: "hidden", background: "rgba(15,23,42,.8)" }}>
        {sehir.gorseller[0] ? (
          <img src={sehir.gorseller[0]} alt={sehir.ad} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : null}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(2,6,23,.1) 0%, rgba(2,6,23,.25) 45%, rgba(2,6,23,.92) 100%)",
        }} />
        {sira ? (
          <span style={{
            position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: 9,
            background: "rgba(2,6,23,.75)", border: "1px solid rgba(255,255,255,.2)",
            color: "#fff", fontWeight: 900, fontSize: 13, display: "grid", placeItems: "center",
          }}>{sira}</span>
        ) : null}
        {durum ? (
          <span style={{
            position: "absolute", top: 10, left: sira ? 44 : 10,
            borderRadius: 999, padding: "3px 10px", fontSize: 10.5, fontWeight: 900,
            background: durum === "gidildi" ? "rgba(52,211,153,.92)" : "rgba(251,191,36,.92)",
            color: "#04121f",
          }}>{durum === "gidildi" ? "✓ Gidildi" : "📍 Planlı"}</span>
        ) : null}
        <span style={{ position: "absolute", top: 10, right: 10 }}><PuanRozeti puan={puan} /></span>
        <div style={{ position: "absolute", left: 13, right: 13, bottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 19, lineHeight: 1.15 }}>{sehir.ad}</span>
            <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600 }}>{sehir.bayrak} {sehir.ulke}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 13px 13px" }}>
        <p style={{
          color: "#94a3b8", fontSize: 12, lineHeight: 1.55, margin: "0 0 11px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{sehir.ozet}</p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 11 }}>
          <Etiket renk={vize.renk}>{vize.kisa}</Etiket>
          <Etiket>✈️ {sehir.ucusSure}</Etiket>
          <Etiket>📅 {gun} gün</Etiket>
        </div>
        <div style={{ display: "grid", gap: 4, marginBottom: 11 }}>
          {PUAN_BASLIKLARI.slice(0, 3).map((p) => (
            <MiniCubuk key={p.id} ad={p.ad} deger={sehir.puan[p.id]} renk={p.renk} />
          ))}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
          borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10,
        }}>
          <span style={{ color: "#64748b", fontSize: 10.5, lineHeight: 1.4 }}>
            Uçuş {tl(sehir.ucusTL)} · günlük {tl(gunlukTL)}
          </span>
          <span style={{ color: sehir.renk, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>Planla →</span>
        </div>
      </div>
    </button>
  );
}

function Etiket({ children, renk = "#94a3b8" }) {
  return (
    <span style={{
      border: `1px solid ${renk}44`, background: `${renk}12`, color: renk,
      borderRadius: 999, padding: "2px 8px", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function MiniCubuk({ ad, deger, renk }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ color: "#64748b", fontSize: 10, flex: "0 0 78px" }}>{ad}</span>
      <span style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
        <span style={{ display: "block", width: `${deger * 10}%`, height: "100%", background: renk, borderRadius: 999 }} />
      </span>
      <span style={{ color: renk, fontSize: 10, fontWeight: 800, flex: "0 0 16px", textAlign: "right" }}>{deger}</span>
    </div>
  );
}

// ======================= ŞEHİR SAYFASI =====================================

function SehirSayfasi({ sehir, ayar, kurlar, planlar, onAyar, onKur, onGeri, onPlanla }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const rota = ROTALAR[sehir.id] || [];
  const varsayilan = {
    kisi: 2, gun: rota.length || sehir.onerilenGun, seviye: "konfor",
    secilen: [], alisveris: "", notlar: "", gidisTarihi: "",
  };
  const a = { ...varsayilan, ...ayar, seviye: seviyeNormalle(ayar.seviye || "konfor") };

  const para = PARALAR[sehir.para];
  const kur = num(kurlar[sehir.para]) || para.kur;
  const vize = VIZELER[sehir.vize];
  const yerelTL = (t) => num(t) * kur;
  const yerel = (t) => para.simge + Math.round(num(t)).toLocaleString("tr-TR");

  const kisi = Math.max(1, Math.round(num(a.kisi) || 1));
  const gun = Math.max(1, Math.round(num(a.gun) || 1));
  const gece = Math.max(1, gun - 1);
  const oda = Math.ceil(kisi / 2);
  const puan = genelPuan(sehir.puan);

  // --- Canlı fiyat ----------------------------------------------------------
  const [canli, setCanli] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const sonSorgu = useRef("");

  const donusTarihi = useMemo(() => {
    if (!a.gidisTarihi) return "";
    const d = new Date(a.gidisTarihi + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + gece);
    return d.toISOString().slice(0, 10);
  }, [a.gidisTarihi, gece]);

  const fiyatCek = async (zorla = false) => {
    if (!a.gidisTarihi) return;
    const anahtar = `${sehir.id}|${a.gidisTarihi}|${donusTarihi}|${kisi}`;
    if (!zorla && sonSorgu.current === anahtar) return;
    sonSorgu.current = anahtar;
    setYukleniyor(true);
    try {
      const q = new URLSearchParams({
        sehir: sehir.id, tarih: a.gidisTarihi, donus: donusTarihi, kisi: String(kisi),
        tabanUcus: String(sehir.ucusTL),
        ekonomi: String(sehir.konaklama.ekonomi), konfor: String(sehir.konaklama.konfor), luks: String(sehir.konaklama.luks),
        ...(zorla ? { zorla: "1" } : {}),
      });
      const r = await fetch(`/api/seyahat-fiyat?${q}`, { cache: "no-store" });
      setCanli(r.ok ? await r.json() : null);
    } catch { setCanli(null); }
    setYukleniyor(false);
  };

  useEffect(() => { if (a.gidisTarihi) fiyatCek(false); /* tarih/kişi değişince tazele */ },
    [a.gidisTarihi, donusTarihi, kisi, sehir.id]);

  const ucusTL = canli?.ucus?.kisiBasiTL || sehir.ucusTL;
  const konaklamaFiyat = {
    ekonomi: canli?.konaklama?.ekonomi ?? sehir.konaklama.ekonomi,
    konfor: canli?.konaklama?.konfor ?? sehir.konaklama.konfor,
    luks: canli?.konaklama?.luks ?? sehir.konaklama.luks,
  };
  // Amadeus fiyatları TL döndürüyor; tahmin modu yerel para birimini korur.
  const konaklamaTLmi = canli?.konaklama?.kaynak === "amadeus";

  const butce = useMemo(() => {
    const seviye = KONAKLAMA_SEVIYELERI.find((s) => s.id === a.seviye) || KONAKLAMA_SEVIYELERI[1];
    const geceFiyat = num(konaklamaFiyat[seviye.id]);
    const ucus = num(ucusTL) * kisi;
    const sigorta = SIGORTA_GUNLUK * gun * kisi;
    const harc = YURTDISI_HARC * kisi;
    const konaklama = (konaklamaTLmi ? geceFiyat : yerelTL(geceFiyat)) * gece * oda;
    const yemek = yerelTL(num(sehir.gunluk.yemek) * gun * kisi);
    const ulasim = yerelTL(num(sehir.gunluk.ulasim) * gun * kisi);
    const ekstra = yerelTL(num(sehir.gunluk.ekstra) * gun * kisi);
    const secilenYerler = sehir.gezilecek.filter((g) => (a.secilen || []).includes(g.ad));
    const girisYerel = secilenYerler.reduce((s, g) => s + num(g.ucret), 0);
    const girisler = yerelTL(girisYerel * kisi);
    const alisveris = num(a.alisveris);
    const ara = ucus + sigorta + harc + konaklama + yemek + ulasim + ekstra + girisler + alisveris;
    const pay = ara * 0.1;
    return {
      seviye, geceFiyat, ucus, sigorta, harc, konaklama, yemek, ulasim, ekstra,
      girisler, girisYerel, secilenYerler, alisveris, ara, pay,
      toplam: ara + pay, kisiBasi: (ara + pay) / kisi, gunlukOrt: (ara + pay) / gun,
    };
  }, [sehir, a, kisi, gun, gece, oda, kur, ucusTL, konaklamaFiyat, konaklamaTLmi]);

  const yerSec = (ad) => {
    const l = a.secilen || [];
    onAyar("secilen", l.includes(ad) ? l.filter((x) => x !== ad) : [...l, ad]);
  };

  const mevcutPlan = planlar.find((p) => p.sehirId === sehir.id);

  return (
    <section>
      <button type="button" onClick={onGeri}
        style={{
          border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.45)", color: "#cbd5e1",
          borderRadius: 11, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 800, marginBottom: 13,
        }}>← Tüm şehirler</button>

      <div style={{
        position: "relative", borderRadius: 22, overflow: "hidden", marginBottom: 14,
        border: `1px solid ${sehir.renk}44`, background: "rgba(15,23,42,.8)",
      }}>
        <div style={{ position: "relative", minHeight: 260 }}>
          {sehir.gorseller[heroIdx] ? (
            <img src={sehir.gorseller[heroIdx]} alt={sehir.ad}
              style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
          ) : null}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(2,6,23,.15) 0%, rgba(2,6,23,.35) 40%, rgba(2,6,23,.95) 100%)",
          }} />
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 7 }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 32, lineHeight: 1.05 }}>{sehir.ad}</span>
              <PuanRozeti puan={puan} buyuk />
              {mevcutPlan ? (
                <span style={{
                  borderRadius: 999, padding: "4px 12px", fontSize: 11.5, fontWeight: 900,
                  background: mevcutPlan.durum === "gidildi" ? "rgba(52,211,153,.9)" : "rgba(251,191,36,.9)", color: "#04121f",
                }}>{mevcutPlan.durum === "gidildi" ? "✓ Gidildi" : "📍 Planlandı"}</span>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Etiket renk={sehir.renk}>{sehir.bayrak} {sehir.ulke}</Etiket>
              <Etiket renk={vize.renk}>{vize.kisa}</Etiket>
              <Etiket>✈️ {sehir.ucusSure}</Etiket>
              <Etiket>👥 Yılda {String(sehir.ziyaretci).replace(".", ",")} milyon ziyaretçi</Etiket>
              <Etiket>📅 Önerilen {rota.length || sehir.onerilenGun} gün</Etiket>
            </div>
          </div>
        </div>

        {sehir.gorseller.length > 1 ? (
          <div style={{ display: "flex", gap: 7, padding: "10px 12px", overflowX: "auto", background: "rgba(2,6,23,.6)" }}>
            {sehir.gorseller.map((g, i) => (
              <button key={g} type="button" onClick={() => setHeroIdx(i)}
                style={{
                  flex: "0 0 auto", width: 84, height: 56, borderRadius: 9, overflow: "hidden", cursor: "pointer", padding: 0,
                  border: `2px solid ${i === heroIdx ? sehir.renk : "transparent"}`, opacity: i === heroIdx ? 1 : 0.6,
                }}>
                <img src={g} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 13, marginBottom: 14 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 17, padding: "15px 16px", background: "rgba(2,6,23,.4)" }}>
          <p style={{ color: "#e2e8f0", fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{sehir.ozet}</p>
          <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 7 }}>
            <Bilgi etiket="En iyi zaman" deger={sehir.enIyiZaman} />
            <Bilgi etiket={vize.ad} deger={vize.not} />
          </div>
        </div>
        <div style={{ border: `1px solid ${sehir.renk}33`, borderRadius: 17, padding: "15px 16px", background: `${sehir.renk}0d` }}>
          <div style={{ color: sehir.renk, fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 11 }}>
            Neden burası
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {sehir.nedenBurasi.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{
                  flex: "0 0 auto", width: 21, height: 21, borderRadius: 999, background: `${sehir.renk}2e`,
                  color: sehir.renk, fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center",
                }}>{i + 1}</span>
                <span style={{ color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Kart baslik="Şehir Puan Kartı" ikon="⭐" renk="#fbbf24"
        aciklama="Altı başlıkta 10 üzerinden değerlendirme. Bütçe satırında yüksek puan ucuz demektir.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 11 }}>
          {PUAN_BASLIKLARI.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, flex: "0 0 auto" }}>{p.ikon}</span>
              <span style={{ flex: "0 0 92px", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700 }}>{p.ad}</span>
              <span style={{ flex: 1, height: 7, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                <span style={{ display: "block", width: `${sehir.puan[p.id] * 10}%`, height: "100%", background: `linear-gradient(90deg, ${p.renk}aa, ${p.renk})`, borderRadius: 999 }} />
              </span>
              <strong style={{ flex: "0 0 24px", color: p.renk, fontSize: 13, fontWeight: 900, textAlign: "right" }}>
                {sehir.puan[p.id]}
              </strong>
            </div>
          ))}
        </div>
      </Kart>

      <Kart baslik="Seyahatini Kur" ikon="⚙️" renk="#2dd4bf"
        aciklama="Gidiş tarihini girersen uçak ve otel fiyatları o tarihe göre tazelenir.">
        <Izgara min={140}>
          <Alan label="Gidiş tarihi" hint={donusTarihi ? `Dönüş: ${kisaTarih(donusTarihi)}` : "Fiyat tazelemek için gerekli"}>
            <input type="date" value={a.gidisTarihi} min={BUGUN()}
              onChange={(e) => onAyar("gidisTarihi", e.target.value)} style={satirInput} />
          </Alan>
          <Alan label="Kaç kişi" hint={`${oda} oda varsayıldı`}>
            <input value={a.kisi} inputMode="numeric"
              onChange={(e) => onAyar("kisi", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Alan label="Kaç gün" hint={`${gece} gece konaklama`}>
            <input value={a.gun} inputMode="numeric"
              onChange={(e) => onAyar("gun", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Alan label={`1 ${para.simge} kaç ₺`} hint={`${para.ad} · güncel kuru yaz`}>
            <input value={kurlar[sehir.para]} inputMode="decimal"
              onChange={(e) => onKur(sehir.para, e.target.value.replace(",", "."))} style={satirInput} />
          </Alan>
          <Alan label="Alışveriş (₺)" hint="Hediyelik, kıyafet, ekstra">
            <input value={a.alisveris} inputMode="numeric" placeholder="0"
              onChange={(e) => onAyar("alisveris", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
        </Izgara>

        <FiyatSeridi canli={canli} yukleniyor={yukleniyor} tarihVar={!!a.gidisTarihi}
          onYenile={() => fiyatCek(true)} ucusTL={ucusTL} sehir={sehir} />

        <div>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>
            Konaklama segmenti
            {konaklamaTLmi ? <span style={{ color: "#34d399", marginLeft: 8, fontSize: 10.5 }}>● canlı fiyat</span> : null}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 9 }}>
            {KONAKLAMA_SEVIYELERI.map((s) => {
              const secili = s.id === a.seviye;
              const f = num(konaklamaFiyat[s.id]);
              return (
                <button key={s.id} type="button" onClick={() => onAyar("seviye", s.id)}
                  style={{
                    textAlign: "left", padding: "12px 13px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${secili ? "rgba(45,212,191,.6)" : "rgba(148,163,184,.2)"}`,
                    background: secili ? "linear-gradient(120deg, rgba(45,212,191,.2), rgba(45,212,191,.06))" : "rgba(2,6,23,.4)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13.5 }}>{s.ikon} {s.ad}</span>
                    <span style={{ color: "#fbbf24", fontSize: 10.5, letterSpacing: "-1px" }}>{s.yildiz}</span>
                  </div>
                  <div style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 15, marginTop: 6 }}>
                    {konaklamaTLmi ? tl(f) : yerel(f)}
                    <span style={{ color: "#64748b", fontSize: 10.5, fontWeight: 600 }}> / gece</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10.5, marginTop: 5, lineHeight: 1.45 }}>{s.not}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Not tur="bilgi"><strong>{vize.ad}.</strong> {vize.not} <em>Vize bedeli bütçeye dahil edilmiyor.</em></Not>
      </Kart>

      <KutuIzgara min={158}>
        <Kutu etiket="Toplam Bütçe" deger={tl(butce.toplam)} renk="#2dd4bf" alt={`${kisi} kişi · ${gun} gün · %10 pay dahil`} />
        <Kutu etiket="Kişi Başı" deger={tl(butce.kisiBasi)} renk="#60a5fa" alt="Her şey dahil" />
        <Kutu etiket="Günlük Ortalama" deger={tl(butce.gunlukOrt)} renk="#a78bfa" alt="Toplam / gün" />
        <Kutu etiket="Gidiş Öncesi" deger={tl(butce.ucus + butce.sigorta + butce.harc + butce.konaklama)}
          renk="#fb7185" alt="Uçak + sigorta + harç + otel" />
        <Kutu etiket="Yanında Götüreceğin" deger={tl(butce.yemek + butce.ulasim + butce.ekstra + butce.girisler + butce.alisveris)}
          renk="#fbbf24" alt="Harcama + girişler + alışveriş" />
        <Kutu etiket="Seçilen Gezi Yeri" deger={`${butce.secilenYerler.length} / ${sehir.gezilecek.length}`} renk="#38bdf8"
          alt={butce.girisYerel > 0 ? `Kişi başı ${yerel(butce.girisYerel)} giriş` : "Aşağıdan işaretle"} />
      </KutuIzgara>

      <Kart baslik="Bütçe Dökümü" ikon="💰" renk="#fbbf24"
        aciklama="Vize bedeli hariç. Konsolosluk harcı ve aracı kurum ücreti çok değiştiği için bütçeye katılmıyor."
        sag={<strong style={{ color: "#fbbf24", fontSize: 16 }}>{tl(butce.toplam)}</strong>}>
        <Tablo
          renk="#fbbf24" minGenislik={470}
          basliklar={["Kalem", "Hesap", "Tutar (₺)"]}
          satirlar={[
            { hucreler: ["✈️ Uçak bileti (gidiş-dönüş)", `${kisi} × ${tl(ucusTL)}${canli?.ucus?.kaynak === "amadeus" ? " · canlı" : ""}`, tl(butce.ucus)] },
            { hucreler: ["🏥 Seyahat sağlık sigortası", `${gun} gün × ${kisi} × ${tl(SIGORTA_GUNLUK)}`, tl(butce.sigorta)] },
            { hucreler: ["🧾 Yurt dışı çıkış harcı", `${kisi} × ${tl(YURTDISI_HARC)}`, tl(butce.harc)] },
            { hucreler: [`🏨 Konaklama (${butce.seviye.ad})`, `${gece} gece × ${oda} oda × ${konaklamaTLmi ? tl(butce.geceFiyat) : yerel(butce.geceFiyat)}`, tl(butce.konaklama)], vurgu: true },
            { hucreler: ["🍽️ Yemek", `${gun} × ${kisi} × ${yerel(sehir.gunluk.yemek)}`, tl(butce.yemek)] },
            { hucreler: ["🚇 Şehir içi ulaşım", `${gun} × ${kisi} × ${yerel(sehir.gunluk.ulasim)}`, tl(butce.ulasim)] },
            { hucreler: ["☕ Günlük ekstra", `${gun} × ${kisi} × ${yerel(sehir.gunluk.ekstra)}`, tl(butce.ekstra)] },
            { hucreler: ["🎟️ Müze & giriş", butce.secilenYerler.length ? `${butce.secilenYerler.length} yer × ${kisi} kişi` : "Aşağıdan seç", tl(butce.girisler)], vurgu: true },
            { hucreler: ["🛍️ Alışveriş & hediyelik", "Kendi girdiğin tutar", tl(butce.alisveris)] },
            { hucreler: ["🧯 Acil pay (%10)", "Gecikme, taksi, beklenmeyen", tl(butce.pay)], renk: "#94a3b8" },
            { hucreler: ["TOPLAM", `${kisi} kişi · ${gun} gün`, tl(butce.toplam)], vurgu: true, kalin: true, renk: "#fbbf24" },
            { hucreler: ["Kişi başı", "Toplam / kişi", tl(butce.kisiBasi)], kalin: true, renk: "#60a5fa" },
          ]}
          not={`Yerel fiyatlar ${para.ad} cinsinden; 1 ${para.simge} = ${String(kur).replace(".", ",")} ₺ kuruyla çevrildi.`}
        />
        <PlanlaButonu sehir={sehir} a={a} butce={butce} mevcutPlan={mevcutPlan} donusTarihi={donusTarihi}
          onPlanla={onPlanla} />
      </Kart>

      {rota.length ? (
        <Kart baslik={`${rota.length} Günlük Program`} ikon="🗓️" renk="#a78bfa"
          aciklama="Saatler açılış saatlerine, bilet seanslarına ve yürüme mesafelerine göre verildi.">
          <div style={{ display: "grid", gap: 12 }}>
            {rota.map((g) => <GunKarti key={g.gun} gun={g} renk={sehir.renk} />)}
          </div>
          {gun !== rota.length ? (
            <Not tur="uyari">
              Program {rota.length} gün için kurulmuş, sen {gun} gün seçtin.
              {gun > rota.length
                ? ` Fazla ${gun - rota.length} günü dinlenmeye ya da bir çevre gezisine ayır.`
                : ` ${rota.length - gun} günü çıkarman gerekiyor — en yorucu günü böl ve iki güne yay.`}
            </Not>
          ) : null}
        </Kart>
      ) : null}

      <Kart baslik="Gezilecek Yerler" ikon="📍" renk="#38bdf8"
        aciklama="İşaretlediğin her yer bütçeye eklenir."
        sag={
          <span onClick={(e) => { e.stopPropagation(); const hepsi = sehir.gezilecek.map((g) => g.ad); onAyar("secilen", (a.secilen || []).length === hepsi.length ? [] : hepsi); }}
            style={{ border: "1px solid rgba(56,189,248,.5)", borderRadius: 10, padding: "5px 11px", color: "#38bdf8", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
            {(a.secilen || []).length === sehir.gezilecek.length ? "Seçimi temizle" : "Tümünü seç"}
          </span>
        }>
        <div style={{ display: "grid", gap: 8 }}>
          {sehir.gezilecek.map((g) => {
            const secili = (a.secilen || []).includes(g.ad);
            const bedava = num(g.ucret) === 0;
            return (
              <button key={g.ad} type="button" onClick={() => yerSec(g.ad)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", width: "100%",
                  padding: "11px 13px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${secili ? "rgba(56,189,248,.5)" : "rgba(148,163,184,.18)"}`,
                  background: secili ? "rgba(56,189,248,.1)" : "rgba(2,6,23,.38)",
                }}>
                <span style={{
                  flex: "0 0 auto", width: 20, height: 20, borderRadius: 6, marginTop: 1,
                  border: `1.5px solid ${secili ? "#38bdf8" : "rgba(148,163,184,.4)"}`,
                  background: secili ? "#38bdf8" : "transparent", color: "#04121f",
                  display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                }}>{secili ? "✓" : ""}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ color: "#fff", fontSize: 13.5 }}>{g.ad}</strong>
                    <span style={{ color: bedava ? "#34d399" : "#38bdf8", fontWeight: 900, fontSize: 12.5, whiteSpace: "nowrap" }}>
                      {bedava ? "Ücretsiz" : `${yerel(g.ucret)} · ${tl(yerelTL(g.ucret))}`}
                    </span>
                  </span>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 4, lineHeight: 1.55 }}>
                    ⏱ {g.sure} — {g.not}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Kart>

      <Kart baslik="Bilmen Gerekenler" ikon="💡" renk="#34d399">
        <div style={{ display: "grid", gap: 8 }}>
          {sehir.ipuclari.map((i, idx) => (
            <div key={idx} style={{
              display: "flex", gap: 9, border: "1px solid rgba(52,211,153,.24)", background: "rgba(52,211,153,.07)",
              borderRadius: 12, padding: "10px 12px", color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6,
            }}>
              <span style={{ flex: "0 0 auto", color: "#34d399", fontWeight: 900 }}>•</span><span>{i}</span>
            </div>
          ))}
        </div>
        <Alan label="Kendi notların" hint="Rezervasyon numaraları, uçuş saatleri — buraya yaz, kaydedilir.">
          <textarea value={a.notlar} rows={4}
            placeholder={`Örn: ${sehir.gezilecek[0]?.ad || "müze"} bileti 14 Mayıs 09:00 · otel onay no 4412`}
            onChange={(e) => onAyar("notlar", e.target.value)}
            style={{ ...satirInput, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
        </Alan>
      </Kart>

      <div style={{ color: "#475569", fontSize: 10.5, textAlign: "center", padding: "6px 0 2px", lineHeight: 1.6 }}>
        Görseller: Wikimedia Commons (serbest lisans). Fiyatlar 2026 referansıdır; tarih girildiğinde tazelenir.
      </div>
    </section>
  );
}

// Canlı fiyat şeridi: kaynak, son güncelleme ve yenile düğmesi.
function FiyatSeridi({ canli, yukleniyor, tarihVar, onYenile, ucusTL, sehir }) {
  if (!tarihVar) {
    return (
      <Not tur="bilgi">
        <strong>Gidiş tarihini gir</strong> — uçak bileti ve otel fiyatları o tarihe göre tazelensin.
        Tarih olmadan 2026 referans fiyatları kullanılıyor.
      </Not>
    );
  }
  const canliMi = canli?.ucus?.kaynak === "amadeus";
  const zaman = canli?.guncellendi ? new Date(canli.guncellendi) : null;
  return (
    <div style={{
      border: `1px solid ${canliMi ? "rgba(52,211,153,.4)" : "rgba(251,191,36,.35)"}`,
      background: canliMi ? "rgba(52,211,153,.08)" : "rgba(251,191,36,.07)",
      borderRadius: 15, padding: "13px 15px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, flex: "0 0 auto",
              background: canliMi ? "#34d399" : "#fbbf24",
            }} />
            <strong style={{ color: "#fff", fontSize: 13.5 }}>
              {canliMi ? "Canlı fiyat" : "Tahmini fiyat"}
            </strong>
            <span style={{ color: "#94a3b8", fontSize: 11.5 }}>
              uçuş {tl(ucusTL)} / kişi
              {canli?.gunKaldi != null ? ` · kalkışa ${canli.gunKaldi} gün` : ""}
            </span>
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 5, lineHeight: 1.55 }}>
            {canliMi
              ? <>Amadeus üzerinden gerçek teklif. {zaman ? `Son güncelleme ${zaman.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}.` : ""} Fiyatlar 8 saatte bir kendiliğinden tazelenir.</>
              : <>Kalkışa kalan süre, sezon ve haftanın gününe göre hesaplanan tahmin — gerçek bilet fiyatı değil.
                Canlı fiyat için Amadeus anahtarı tanımlanmalı. Gerçek fiyatı görmek için aşağıdaki bağlantıya tıkla.</>}
          </div>
        </div>
        <button type="button" onClick={onYenile} disabled={yukleniyor}
          style={{
            flex: "0 0 auto", border: "1px solid rgba(45,212,191,.5)", background: "rgba(45,212,191,.14)",
            color: "#2dd4bf", borderRadius: 11, padding: "9px 15px", cursor: yukleniyor ? "default" : "pointer",
            fontSize: 12.5, fontWeight: 900, opacity: yukleniyor ? 0.6 : 1,
          }}>
          {yukleniyor ? "⏳ Yenileniyor…" : "🔄 Fiyatları yenile"}
        </button>
      </div>
      {canli?.bagvarlar ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
          <a href={canli.bagvarlar.ucus} target="_blank" rel="noopener noreferrer"
            style={{ border: "1px solid rgba(96,165,250,.4)", background: "rgba(96,165,250,.12)", color: "#93c5fd", borderRadius: 10, padding: "6px 12px", fontSize: 11.5, fontWeight: 800, textDecoration: "none" }}>
            ✈️ Uçuşları karşılaştır ↗
          </a>
          <a href={canli.bagvarlar.otel} target="_blank" rel="noopener noreferrer"
            style={{ border: "1px solid rgba(45,212,191,.4)", background: "rgba(45,212,191,.12)", color: "#2dd4bf", borderRadius: 10, padding: "6px 12px", fontSize: 11.5, fontWeight: 800, textDecoration: "none" }}>
            🏨 Otelleri karşılaştır ↗
          </a>
        </div>
      ) : null}
    </div>
  );
}

function PlanlaButonu({ sehir, a, butce, mevcutPlan, donusTarihi, onPlanla }) {
  if (mevcutPlan) {
    return (
      <Not tur="iyi">
        Bu şehir <strong>Seyahat Defterim</strong>'de {mevcutPlan.durum === "gidildi" ? "gidilenler" : "planlananlar"} arasında.
        {mevcutPlan.baslangic ? ` Tarih: ${kisaTarih(mevcutPlan.baslangic)}.` : ""}
      </Not>
    );
  }
  return (
    <button type="button"
      onClick={() => onPlanla({
        id: yeniId(), sehirId: sehir.id, baslangic: a.gidisTarihi || "", bitis: donusTarihi || "",
        durum: "plan", butce: Math.round(butce.toplam), kisi: num(a.kisi), gun: num(a.gun),
        puan: 0, notlar: "", fotograflar: [],
      })}
      style={{
        height: 50, borderRadius: 14, cursor: "pointer", border: "none", width: "100%",
        background: "linear-gradient(120deg, #2dd4bf, #14b8a6)", color: "#04121f",
        fontSize: 15, fontWeight: 900,
      }}>
      📔 Seyahat Defterime ekle{a.gidisTarihi ? ` · ${kisaTarih(a.gidisTarihi)}` : ""}
    </button>
  );
}

function Bilgi({ etiket, deger }) {
  return (
    <div>
      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{etiket}</div>
      <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 2, lineHeight: 1.55 }}>{deger}</div>
    </div>
  );
}

function GunKarti({ gun, renk }) {
  const [acik, setAcik] = useState(gun.gun === 1);
  return (
    <div style={{ border: `1px solid ${renk}33`, borderRadius: 15, overflow: "hidden", background: `${renk}09` }}>
      <button type="button" onClick={() => setAcik((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer",
          padding: "11px 13px", border: "none",
          background: `linear-gradient(120deg, ${renk}28, ${renk}0a)`,
          borderBottom: acik ? `1px solid ${renk}22` : "none",
        }}>
        <span style={{
          flex: "0 0 auto", width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center",
          background: `${renk}30`, color: "#fff", fontWeight: 900, fontSize: 13,
        }}>{gun.gun}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 14.5 }}>{gun.baslik}</span>
          <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 2 }}>{gun.tema}</span>
        </span>
        <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 17, flex: "0 0 auto" }}>{acik ? "−" : "+"}</span>
      </button>
      {acik ? (
        <div style={{ padding: "12px 13px" }}>
          <div style={{ display: "grid", gap: 0 }}>
            {gun.bloklar.map(([saat, baslik, aciklama], i) => (
              <div key={i} style={{ display: "flex", gap: 11, minWidth: 0 }}>
                <div style={{ flex: "0 0 54px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{
                    background: `${renk}26`, border: `1px solid ${renk}4d`, color: "#fff",
                    borderRadius: 8, padding: "3px 6px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
                  }}>{saat}</span>
                  {i < gun.bloklar.length - 1 ? (
                    <span style={{ flex: 1, width: 2, minHeight: 14, background: `${renk}33`, marginTop: 4 }} />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: i < gun.bloklar.length - 1 ? 13 : 0 }}>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, lineHeight: 1.35 }}>{baslik}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11.5, marginTop: 3, lineHeight: 1.6 }}>{aciklama}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 11, borderLeft: `2px solid ${renk}80`, paddingLeft: 11, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.6 }}>
            <strong style={{ color: renk }}>İpucu:</strong> {gun.ipucu}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Kart({ baslik, ikon, aciklama, renk, sag, children }) {
  return (
    <section style={{ border: `1px solid ${renk}2e`, borderRadius: 18, overflow: "hidden", background: "rgba(2,6,23,.3)", marginBottom: 14 }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
        padding: "12px 15px", background: `linear-gradient(120deg, ${renk}26, ${renk}0b)`, borderBottom: `1px solid ${renk}2e`,
      }}>
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

// ======================= SEYAHAT DEFTERİ ===================================

function SeyahatDefteri({ planlar, hayaller, setData, userId, onSehir }) {
  const guncellePlan = (id, alan, deger) =>
    setData((s) => ({
      ...(s || {}),
      planlar: (Array.isArray((s || {}).planlar) ? s.planlar : []).map((p) => (p.id === id ? { ...p, [alan]: deger } : p)),
    }));
  const silPlan = (id) =>
    setData((s) => ({ ...(s || {}), planlar: (Array.isArray((s || {}).planlar) ? s.planlar : []).filter((p) => p.id !== id) }));
  const ekleHayal = (h) =>
    setData((s) => ({ ...(s || {}), hayaller: [...(Array.isArray((s || {}).hayaller) ? s.hayaller : []), h] }));
  const guncelleHayal = (id, alan, deger) =>
    setData((s) => ({
      ...(s || {}),
      hayaller: (Array.isArray((s || {}).hayaller) ? s.hayaller : []).map((h) => (h.id === id ? { ...h, [alan]: deger } : h)),
    }));
  const silHayal = (id) =>
    setData((s) => ({ ...(s || {}), hayaller: (Array.isArray((s || {}).hayaller) ? s.hayaller : []).filter((h) => h.id !== id) }));

  const buYil = new Date().getFullYear();
  const planlanan = planlar.filter((p) => p.durum !== "gidildi").sort((a, b) => (a.baslangic || "9999").localeCompare(b.baslangic || "9999"));
  const gidilen = planlar.filter((p) => p.durum === "gidildi").sort((a, b) => (b.baslangic || "").localeCompare(a.baslangic || ""));
  const ulkeler = new Set(gidilen.map((p) => SEHIRLER.find((s) => s.id === p.sehirId)?.ulke).filter(Boolean));
  const toplamGun = gidilen.reduce((s, p) => s + num(p.gun), 0);
  const buYilPlan = planlanan.filter((p) => p.baslangic && p.baslangic.startsWith(String(buYil))).length;

  return (
    <>
      <header style={{
        position: "relative", overflow: "hidden", borderRadius: 22, marginBottom: 16,
        border: "1px solid rgba(251,191,36,.28)",
        background: "linear-gradient(130deg, rgba(251,191,36,.18), rgba(45,212,191,.1) 55%, rgba(2,6,23,.5))",
        padding: "22px 24px",
      }}>
        <div style={{ color: "#fbbf24", fontSize: 11.5, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Seyahat Defterim
        </div>
        <h2 style={{ color: "#fff", fontSize: 27, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.2 }}>
          Nereye gittim, nereye gideceğim
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: 13.5, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 600 }}>
          Planladığın seyahatler tarihleriyle burada bekler, dönünce <strong style={{ color: "#fff" }}>✓ gidildi</strong> işaretlenir
          ve fotoğraflarınla birlikte deftere geçer. Hayal listesi ise ileri yıllar için.
        </p>
      </header>

      <KutuIzgara min={158}>
        <Kutu etiket="Gezilen Ülke" deger={String(ulkeler.size)} renk="#34d399" alt={[...ulkeler].slice(0, 3).join(", ") || "Henüz yok"} />
        <Kutu etiket="Gezilen Şehir" deger={String(gidilen.length)} renk="#2dd4bf" alt="Deftere işlenen seyahat" />
        <Kutu etiket="Toplam Gün" deger={String(toplamGun)} renk="#60a5fa" alt="Yolda geçen gün" />
        <Kutu etiket="Planlı Seyahat" deger={String(planlanan.length)} renk="#fbbf24" alt={`${buYilPlan} tanesi ${buYil} içinde`} />
        <Kutu etiket="Hayal Listesi" deger={String(hayaller.length)} renk="#c084fc" alt="Mutlaka gidilecek" />
      </KutuIzgara>

      <Kart baslik="Planlanan Seyahatler" ikon="📍" renk="#fbbf24"
        aciklama="Keşfet ekranından bir şehir seçip 'Seyahat Defterime ekle' dediğinde buraya düşer.">
        {planlanan.length ? (
          <div style={{ display: "grid", gap: 11 }}>
            {planlanan.map((p) => (
              <PlanKarti key={p.id} plan={p} onGuncelle={guncellePlan} onSil={silPlan} onSehir={onSehir} userId={userId} />
            ))}
          </div>
        ) : (
          <Not tur="bilgi">Henüz planlanmış seyahat yok. <strong>Keşfet</strong> sekmesinden bir şehir seç, gidiş tarihini gir ve deftere ekle.</Not>
        )}
      </Kart>

      <Kart baslik="Gittiğim Yerler" ikon="✅" renk="#34d399"
        aciklama="Puan ver, not düş, fotoğraflarını yükle. Fotoğraflar hesabına özel bir klasörde saklanır.">
        {gidilen.length ? (
          <div style={{ display: "grid", gap: 11 }}>
            {gidilen.map((p) => (
              <PlanKarti key={p.id} plan={p} onGuncelle={guncellePlan} onSil={silPlan} onSehir={onSehir} userId={userId} gidildi />
            ))}
          </div>
        ) : (
          <Not tur="bilgi">Henüz deftere işlenmiş seyahat yok. Planladığın bir seyahatten dönünce <strong>✓ Gidildi</strong> işaretle.</Not>
        )}
      </Kart>

      <HayalListesi hayaller={hayaller} onEkle={ekleHayal} onGuncelle={guncelleHayal} onSil={silHayal} onSehir={onSehir} />
    </>
  );
}

function PlanKarti({ plan, onGuncelle, onSil, onSehir, userId, gidildi }) {
  const sehir = SEHIRLER.find((s) => s.id === plan.sehirId);
  const [acik, setAcik] = useState(false);
  const kalan = plan.baslangic ? gunFark(plan.baslangic) : null;
  const renk = gidildi ? "#34d399" : "#fbbf24";

  return (
    <div style={{ border: `1px solid ${renk}33`, borderRadius: 16, overflow: "hidden", background: `${renk}08` }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {sehir?.gorseller?.[0] ? (
          <img src={sehir.gorseller[0]} alt="" loading="lazy"
            style={{ width: 96, flex: "0 0 auto", objectFit: "cover", display: "block" }} />
        ) : null}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 5 }}>
            <strong style={{ color: "#fff", fontSize: 16 }}>{sehir?.ad || "Şehir"}</strong>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{sehir?.bayrak} {sehir?.ulke}</span>
            {gidildi ? (
              <span style={{ background: "rgba(52,211,153,.9)", color: "#04121f", borderRadius: 999, padding: "2px 9px", fontSize: 10.5, fontWeight: 900 }}>✓ Gidildi</span>
            ) : kalan != null && kalan >= 0 ? (
              <span style={{ background: "rgba(251,191,36,.9)", color: "#04121f", borderRadius: 999, padding: "2px 9px", fontSize: 10.5, fontWeight: 900 }}>
                {kalan === 0 ? "Bugün!" : `${kalan} gün kaldı`}
              </span>
            ) : null}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11.5, lineHeight: 1.6 }}>
            {plan.baslangic ? kisaTarih(plan.baslangic) : "Tarih girilmedi"}
            {plan.bitis ? ` – ${kisaTarih(plan.bitis)}` : ""}
            {plan.gun ? ` · ${plan.gun} gün` : ""}{plan.kisi ? ` · ${plan.kisi} kişi` : ""}
            {plan.butce ? ` · ${tl(plan.butce)}` : ""}
          </div>
          {gidildi && plan.puan ? (
            <div style={{ color: "#fbbf24", fontSize: 13, marginTop: 5 }}>
              {"★".repeat(plan.puan)}<span style={{ color: "#334155" }}>{"★".repeat(5 - plan.puan)}</span>
            </div>
          ) : null}
          {gidildi && plan.fotograflar?.length ? (
            <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 4 }}>📷 {plan.fotograflar.length} fotoğraf</div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 12px 12px 0", flex: "0 0 auto" }}>
          <button type="button" onClick={() => setAcik((v) => !v)}
            style={{ border: `1px solid ${renk}55`, background: `${renk}18`, color: renk, borderRadius: 10, padding: "6px 11px", cursor: "pointer", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {acik ? "Kapat" : "Düzenle"}
          </button>
          <button type="button" onClick={() => onSehir(plan.sehirId)}
            style={{ border: "1px solid rgba(148,163,184,.3)", background: "rgba(2,6,23,.5)", color: "#94a3b8", borderRadius: 10, padding: "6px 11px", cursor: "pointer", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            Rotayı aç
          </button>
        </div>
      </div>

      {acik ? (
        <div style={{ padding: "13px", borderTop: `1px solid ${renk}22`, display: "grid", gap: 12 }}>
          <Izgara min={135}>
            <Alan label="Gidiş">
              <input type="date" value={plan.baslangic || ""} onChange={(e) => onGuncelle(plan.id, "baslangic", e.target.value)} style={satirInput} />
            </Alan>
            <Alan label="Dönüş">
              <input type="date" value={plan.bitis || ""} onChange={(e) => onGuncelle(plan.id, "bitis", e.target.value)} style={satirInput} />
            </Alan>
            <Alan label="Bütçe (₺)">
              <input value={plan.butce || ""} inputMode="numeric"
                onChange={(e) => onGuncelle(plan.id, "butce", num(e.target.value.replace(/[^\d]/g, "")))} style={satirInput} />
            </Alan>
            {gidildi ? (
              <Alan label="Puanın" hint="1–5 yıldız">
                <div style={{ display: "flex", gap: 4, alignItems: "center", height: 38 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => onGuncelle(plan.id, "puan", n)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 21, padding: 0, color: n <= (plan.puan || 0) ? "#fbbf24" : "#334155" }}>★</button>
                  ))}
                </div>
              </Alan>
            ) : null}
          </Izgara>

          <Alan label="Notların" hint="Nerede kaldın, ne yedin, bir dahakine ne yaparsın?">
            <textarea value={plan.notlar || ""} rows={3}
              onChange={(e) => onGuncelle(plan.id, "notlar", e.target.value)}
              style={{ ...satirInput, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
          </Alan>

          {gidildi ? <Fotograflar plan={plan} userId={userId} onGuncelle={onGuncelle} /> : null}

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button type="button" onClick={() => onGuncelle(plan.id, "durum", gidildi ? "plan" : "gidildi")}
              style={{
                flex: 1, minWidth: 180, height: 44, borderRadius: 12, cursor: "pointer", border: "none",
                background: gidildi ? "rgba(148,163,184,.18)" : "linear-gradient(120deg, #34d399, #10b981)",
                color: gidildi ? "#cbd5e1" : "#04121f", fontSize: 13.5, fontWeight: 900,
              }}>
              {gidildi ? "↩ Plana geri al" : "✓ Gidildi olarak işaretle"}
            </button>
            <button type="button" onClick={() => onSil(plan.id)}
              style={{ height: 44, borderRadius: 12, cursor: "pointer", border: "1px solid rgba(248,113,113,.35)", background: "rgba(248,113,113,.1)", color: "#fb7185", padding: "0 16px", fontSize: 13, fontWeight: 800 }}>
              Sil
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Fotoğraflar Supabase Storage'da: seyahat-fotograf/{kullaniciId}/{planId}/...
// Kova herkese açık okunur ama yazma yalnızca kendi klasörüne (RLS).
function Fotograflar({ plan, userId, onGuncelle }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const girdiRef = useRef(null);
  const liste = Array.isArray(plan.fotograflar) ? plan.fotograflar : [];

  const yukle = async (dosyalar) => {
    if (!supabase || !userId) { setHata("Fotoğraf yüklemek için oturum gerekiyor."); return; }
    setHata(""); setYukleniyor(true);
    const yeni = [];
    for (const dosya of Array.from(dosyalar).slice(0, 10)) {
      if (dosya.size > 5 * 1024 * 1024) { setHata(`${dosya.name} 5 MB'tan büyük, atlandı.`); continue; }
      const uzanti = (dosya.name.split(".").pop() || "jpg").toLowerCase();
      const yol = `${userId}/${plan.id}/${yeniId()}.${uzanti}`;
      const { error } = await supabase.storage.from("seyahat-fotograf").upload(yol, dosya, { cacheControl: "3600", upsert: false });
      if (error) { setHata("Yükleme hatası: " + error.message); continue; }
      const { data } = supabase.storage.from("seyahat-fotograf").getPublicUrl(yol);
      yeni.push({ yol, url: data.publicUrl });
    }
    if (yeni.length) onGuncelle(plan.id, "fotograflar", [...liste, ...yeni]);
    setYukleniyor(false);
    if (girdiRef.current) girdiRef.current.value = "";
  };

  const sil = async (foto) => {
    if (supabase && foto.yol) await supabase.storage.from("seyahat-fotograf").remove([foto.yol]).catch(() => {});
    onGuncelle(plan.id, "fotograflar", liste.filter((f) => f.yol !== foto.yol));
  };

  return (
    <div>
      <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>
        Fotoğraflarım {liste.length ? `(${liste.length})` : ""}
      </span>
      {liste.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8, marginBottom: 10 }}>
          {liste.map((f) => (
            <div key={f.yol} style={{ position: "relative", borderRadius: 11, overflow: "hidden", aspectRatio: "4/3", background: "rgba(2,6,23,.6)" }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                <img src={f.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </a>
              <button type="button" onClick={() => sil(f)} title="Fotoğrafı sil"
                style={{
                  position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: 8, cursor: "pointer",
                  border: "none", background: "rgba(2,6,23,.75)", color: "#fb7185", fontSize: 14, fontWeight: 900,
                }}>×</button>
            </div>
          ))}
        </div>
      ) : null}

      <input ref={girdiRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => e.target.files?.length && yukle(e.target.files)} />
      <button type="button" onClick={() => girdiRef.current?.click()} disabled={yukleniyor}
        style={{
          width: "100%", height: 44, borderRadius: 12, cursor: yukleniyor ? "default" : "pointer",
          border: "1px dashed rgba(45,212,191,.45)", background: "rgba(45,212,191,.08)", color: "#2dd4bf",
          fontSize: 13, fontWeight: 800, opacity: yukleniyor ? 0.6 : 1,
        }}>
        {yukleniyor ? "⏳ Yükleniyor…" : "📷 Fotoğraf ekle (en fazla 5 MB)"}
      </button>
      {hata ? <div style={{ color: "#fb7185", fontSize: 11.5, marginTop: 7 }}>{hata}</div> : null}
    </div>
  );
}

function HayalListesi({ hayaller, onEkle, onGuncelle, onSil, onSehir }) {
  const [sehirId, setSehirId] = useState("");
  const [yil, setYil] = useState(String(new Date().getFullYear() + 1));
  const buYil = new Date().getFullYear();
  const sirali = [...hayaller].sort((a, b) => num(a.hedefYil) - num(b.hedefYil));

  return (
    <Kart baslik="Hayal Listesi" ikon="🌟" renk="#c084fc"
      aciklama="Bu yıl değil ama mutlaka gidilecek yerler. Hedef yıl ver, zamanı gelince plana çevir.">
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 9, alignItems: "end" }}>
        <Alan label="Şehir">
          <select value={sehirId} onChange={(e) => setSehirId(e.target.value)} style={satirInput}>
            <option value="">Seç…</option>
            {SEHIRLER.filter((s) => !hayaller.some((h) => h.sehirId === s.id))
              .sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
              .map((s) => <option key={s.id} value={s.id}>{s.bayrak} {s.ad} — {s.ulke}</option>)}
          </select>
        </Alan>
        <Alan label="Hedef yıl">
          <input value={yil} inputMode="numeric" onChange={(e) => setYil(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} style={satirInput} />
        </Alan>
        <button type="button"
          onClick={() => { if (!sehirId) return; onEkle({ id: yeniId(), sehirId, hedefYil: num(yil) || buYil + 1, not: "" }); setSehirId(""); }}
          style={{ height: 38, borderRadius: 11, cursor: "pointer", border: "none", background: "linear-gradient(120deg, #c084fc, #a855f7)", color: "#1a0b2e", padding: "0 18px", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>
          Ekle
        </button>
      </div>

      {sirali.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {sirali.map((h) => {
            const s = SEHIRLER.find((x) => x.id === h.sehirId);
            const yakin = num(h.hedefYil) <= buYil;
            return (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 13,
                border: `1px solid ${yakin ? "rgba(192,132,252,.5)" : "rgba(148,163,184,.18)"}`,
                background: yakin ? "rgba(192,132,252,.1)" : "rgba(2,6,23,.4)",
              }}>
                {s?.gorseller?.[0] ? (
                  <img src={s.gorseller[0]} alt="" loading="lazy"
                    style={{ width: 52, height: 40, borderRadius: 9, objectFit: "cover", flex: "0 0 auto" }} />
                ) : null}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: "#fff", fontSize: 13.5, fontWeight: 800 }}>
                    {s?.ad || "Şehir"} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: 11.5 }}>{s?.bayrak} {s?.ulke}</span>
                  </span>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                    Hedef: {h.hedefYil}{yakin ? " · zamanı geldi" : ""}
                  </span>
                </span>
                <input value={h.hedefYil} inputMode="numeric"
                  onChange={(e) => onGuncelle(h.id, "hedefYil", num(e.target.value.replace(/[^\d]/g, "").slice(0, 4)))}
                  style={{ ...satirInput, width: 68, flex: "0 0 auto", textAlign: "center", padding: "6px 4px" }} />
                <button type="button" onClick={() => onSehir(h.sehirId)}
                  style={{ border: "1px solid rgba(148,163,184,.3)", background: "rgba(2,6,23,.5)", color: "#94a3b8", borderRadius: 9, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", flex: "0 0 auto" }}>
                  Planla
                </button>
                <button type="button" onClick={() => onSil(h.id)}
                  style={{ width: 30, height: 30, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.1)", color: "#fb7185", fontSize: 15, fontWeight: 900, flex: "0 0 auto" }}>×</button>
              </div>
            );
          })}
        </div>
      ) : (
        <Not tur="bilgi">Liste boş. Yukarıdan bir şehir seçip hedef yıl ver — ileride buradan plana çevirirsin.</Not>
      )}
    </Kart>
  );
}
