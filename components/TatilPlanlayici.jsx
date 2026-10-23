"use client";

import { useMemo, useState } from "react";
import {
  SEHIRLER, PARALAR, VIZELER, BOLGELER, SIRALAMALAR, KONAKLAMA_SEVIYELERI,
  PUAN_BASLIKLARI, genelPuan, YURTDISI_HARC, SIGORTA_GUNLUK,
} from "../lib/destinasyonlar";
import { ROTALAR } from "../lib/rotalar";
import { num, tl, satirInput, Kutu, KutuIzgara, Tablo, Alan, Izgara, Not } from "./panelUI";

// Seyahat Planlayıcı.
//
// İki ekran var: KEŞFET (şehirleri karşılaştır, filtrele, sırala) ve ŞEHİR
// (o şehrin dosyası: puan kartı, görseller, saat saat rota, bütçe).
//
// Buradaki tasarım kararı, bunu bir tablo değil bir seyahat sitesi gibi
// kurmak: görsel önce gelir, sayı sonra. İnsan nereye gideceğine önce
// bakarak karar verir, sonra bütçeye bakar — ekran da bu sırayı izler.

const uzunluk = (id) => (ROTALAR[id] || []).length;

export default function TatilPlanlayici({ data, setData }) {
  const kayit = data || {};
  const [gorunum, setGorunum] = useState("kesfet");
  const [seciliId, setSeciliId] = useState(null);
  const [bolge, setBolge] = useState("hepsi");
  const [siralama, setSiralama] = useState("puan");
  const [sadeceVizesiz, setSadeceVizesiz] = useState(false);

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

  // Her şehrin "varsayılan kişi başı günlük maliyeti" — kartlarda karşılaştırma için.
  const gunlukTL = (s) => {
    const kur = num(kurlar[s.para]) || PARALAR[s.para].kur;
    const g = s.gunluk;
    return (num(g.yemek) + num(g.ulasim) + num(g.ekstra)) * kur;
  };

  const liste = useMemo(() => {
    let l = SEHIRLER.filter((s) => (bolge === "hepsi" ? true : s.bolge === bolge));
    if (sadeceVizesiz) l = l.filter((s) => s.vize === "yok" || s.vize === "kimlik");
    const sure = (s) => parseFloat(String(s.ucusSure).replace(",", ".")) || 99;
    const kopya = [...l];
    if (siralama === "puan") kopya.sort((a, b) => genelPuan(b.puan) - genelPuan(a.puan));
    else if (siralama === "ucuz") kopya.sort((a, b) => gunlukTL(a) + a.ucusTL - (gunlukTL(b) + b.ucusTL));
    else if (siralama === "yakin") kopya.sort((a, b) => sure(a) - sure(b));
    else if (siralama === "populer") kopya.sort((a, b) => b.ziyaretci - a.ziyaretci);
    else if (siralama === "tarih") kopya.sort((a, b) => b.puan.tarih - a.puan.tarih || genelPuan(b.puan) - genelPuan(a.puan));
    return kopya;
  }, [bolge, siralama, sadeceVizesiz, kurlar]);

  const sehirAc = (id) => { setSeciliId(id); setGorunum("sehir"); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  if (gorunum === "sehir" && seciliId) {
    return (
      <SehirSayfasi
        sehir={SEHIRLER.find((s) => s.id === seciliId)}
        ayar={(kayit.ayarlar || {})[seciliId] || {}}
        kurlar={kurlar}
        onAyar={(alan, deger) => ayarDegis(seciliId, alan, deger)}
        onKur={kurDegis}
        onGeri={() => { setGorunum("kesfet"); if (typeof window !== "undefined") window.scrollTo(0, 0); }}
      />
    );
  }

  return (
    <section>
      <KesfetBasligi toplam={SEHIRLER.length} />

      {/* --- Filtreler ------------------------------------------------------- */}
      <div style={{ display: "grid", gap: 11, marginBottom: 18 }}>
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
                }}>
                {b.ikon} {b.ad}
              </button>
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
                  }}>
                  {s.ikon} {s.ad}
                </button>
              );
            })}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginLeft: "auto" }}>
            <input type="checkbox" checked={sadeceVizesiz} onChange={(e) => setSadeceVizesiz(e.target.checked)} />
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>Sadece vizesiz</span>
          </label>
        </div>
      </div>

      {/* --- Şehir kartları --------------------------------------------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 15 }}>
        {liste.map((s, i) => (
          <SehirKarti key={s.id} sehir={s} sira={siralama === "puan" ? i + 1 : null}
            gunlukTL={gunlukTL(s)} onAc={() => sehirAc(s.id)} />
        ))}
      </div>

      {!liste.length ? (
        <Not tur="uyari">Bu filtreyle eşleşen şehir yok. Bölgeyi değiştir ya da vizesiz filtresini kaldır.</Not>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <Not tur="bilgi">
          <strong>Puanlar nasıl hesaplanıyor?</strong> Altı başlık 10 üzerinden değerlendirilir: tarih & kültür,
          yeme & içme, gece hayatı, doğa & manzara, gezilebilirlik ve bütçe dostluğu (burada <strong>yüksek puan
          ucuz</strong> demektir). Genel puan ilk beşin ağırlıklı ortalamasıdır; <strong>bütçe bilinçli olarak dışarıda
          bırakıldı</strong> — ucuz olmak bir şehri daha iyi yapmaz, ayrı bir karardır ve yukarıdan ayrıca sıralanabilir.
          Değerlendirme; yıllık ziyaretçi sayısı, UNESCO ve müze yoğunluğu ile şehir molası maliyet endekslerinden
          türetilmiş editöryel bir karşılaştırmadır — mutlak gerçek değil, yön gösterici.
        </Not>
      </div>
    </section>
  );
}

function KesfetBasligi({ toplam }) {
  return (
    <header style={{
      position: "relative", overflow: "hidden", borderRadius: 20, marginBottom: 18,
      border: "1px solid rgba(45,212,191,.28)",
      background: "linear-gradient(130deg, rgba(45,212,191,.22), rgba(96,165,250,.12) 55%, rgba(2,6,23,.5))",
      padding: "22px 22px 20px",
    }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ color: "#2dd4bf", fontSize: 11.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Seyahat Planlayıcı
        </div>
        <h2 style={{ color: "#fff", fontSize: 27, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.2 }}>
          Nereye gidiyoruz?
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: 13.5, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 620 }}>
          {toplam} şehir, 20 ülke. Her biri altı başlıkta puanlandı; hepsinde saat saat günlük rota,
          gezilecek yerler ve giriş ücretleri var. Bir şehir seç — <strong style={{ color: "#fff" }}>program ve
          bütçe anında oluşsun.</strong>
        </p>
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

function SehirKarti({ sehir, sira, gunlukTL, onAc }) {
  const puan = genelPuan(sehir.puan);
  const vize = VIZELER[sehir.vize];
  const gun = uzunluk(sehir.id) || sehir.onerilenGun;
  return (
    <button type="button" onClick={onAc}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: 0, cursor: "pointer",
        border: `1px solid ${sehir.renk}33`, borderRadius: 18, overflow: "hidden",
        background: "rgba(2,6,23,.45)",
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
          <Etiket renk={VIZELER[sehir.vize].renk}>{vize.kisa}</Etiket>
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

function SehirSayfasi({ sehir, ayar, kurlar, onAyar, onKur, onGeri }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const rota = ROTALAR[sehir.id] || [];
  const varsayilan = { kisi: 2, gun: rota.length || sehir.onerilenGun, seviye: "orta", secilen: [], alisveris: "", notlar: "" };
  const a = { ...varsayilan, ...ayar };

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

  const butce = useMemo(() => {
    const seviye = KONAKLAMA_SEVIYELERI.find((s) => s.id === a.seviye) || KONAKLAMA_SEVIYELERI[1];
    const geceFiyat = num(sehir.konaklama[seviye.id]);
    const ucus = num(sehir.ucusTL) * kisi;
    const vizeKur = num(kurlar[vize.para]) || PARALAR[vize.para].kur;
    const vizeTL = (num(vize.ucret) * vizeKur + num(vize.hizmet)) * kisi;
    const sigorta = SIGORTA_GUNLUK * gun * kisi;
    const harc = YURTDISI_HARC * kisi;
    const konaklama = yerelTL(geceFiyat * gece * oda);
    const yemek = yerelTL(num(sehir.gunluk.yemek) * gun * kisi);
    const ulasim = yerelTL(num(sehir.gunluk.ulasim) * gun * kisi);
    const ekstra = yerelTL(num(sehir.gunluk.ekstra) * gun * kisi);
    const secilenYerler = sehir.gezilecek.filter((g) => (a.secilen || []).includes(g.ad));
    const girisYerel = secilenYerler.reduce((s, g) => s + num(g.ucret), 0);
    const girisler = yerelTL(girisYerel * kisi);
    const alisveris = num(a.alisveris);
    const ara = ucus + vizeTL + sigorta + harc + konaklama + yemek + ulasim + ekstra + girisler + alisveris;
    const pay = ara * 0.1;
    return {
      seviye, geceFiyat, ucus, vizeTL, sigorta, harc, konaklama, yemek, ulasim, ekstra,
      girisler, girisYerel, secilenYerler, alisveris, ara, pay,
      toplam: ara + pay, kisiBasi: (ara + pay) / kisi, gunlukOrt: (ara + pay) / gun,
    };
  }, [sehir, a, kisi, gun, gece, oda, kur, kurlar, vize]);

  const yerSec = (ad) => {
    const l = a.secilen || [];
    onAyar("secilen", l.includes(ad) ? l.filter((x) => x !== ad) : [...l, ad]);
  };

  return (
    <section>
      <button type="button" onClick={onGeri}
        style={{
          border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.45)", color: "#cbd5e1",
          borderRadius: 11, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 800, marginBottom: 13,
        }}>
        ← Tüm şehirler
      </button>

      {/* --- Hero ------------------------------------------------------------ */}
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

        {/* Galeri şeridi */}
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

      {/* --- Özet ve neden burası -------------------------------------------- */}
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

      {/* --- Puan kartı ------------------------------------------------------- */}
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

      {/* --- Seyahat ayarları -------------------------------------------------- */}
      <Kart baslik="Seyahatini Kur" ikon="⚙️" renk="#2dd4bf"
        aciklama="Buradaki her değişiklik bütçeyi anında yeniden hesaplar.">
        <Izgara min={135}>
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

        <div style={{ marginTop: 13 }}>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>Konaklama seviyesi</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 9 }}>
            {KONAKLAMA_SEVIYELERI.map((s) => {
              const secili = s.id === a.seviye;
              const f = num(sehir.konaklama[s.id]);
              return (
                <button key={s.id} type="button" onClick={() => onAyar("seviye", s.id)}
                  style={{
                    textAlign: "left", padding: "11px 12px", borderRadius: 13, cursor: "pointer",
                    border: `1px solid ${secili ? "rgba(45,212,191,.6)" : "rgba(148,163,184,.2)"}`,
                    background: secili ? "linear-gradient(120deg, rgba(45,212,191,.2), rgba(45,212,191,.06))" : "rgba(2,6,23,.4)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13 }}>{s.ikon} {s.ad}</span>
                    <span style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 12.5 }}>{yerel(f)}</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10.5, marginTop: 4, lineHeight: 1.45 }}>{s.not}</div>
                  <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>gece / oda · {tl(yerelTL(f))}</div>
                </button>
              );
            })}
          </div>
        </div>
      </Kart>

      {/* --- Bütçe ------------------------------------------------------------- */}
      <KutuIzgara min={158}>
        <Kutu etiket="Toplam Bütçe" deger={tl(butce.toplam)} renk="#2dd4bf" alt={`${kisi} kişi · ${gun} gün · %10 pay dahil`} />
        <Kutu etiket="Kişi Başı" deger={tl(butce.kisiBasi)} renk="#60a5fa" alt="Her şey dahil" />
        <Kutu etiket="Günlük Ortalama" deger={tl(butce.gunlukOrt)} renk="#a78bfa" alt="Toplam / gün" />
        <Kutu etiket="Gidiş Öncesi" deger={tl(butce.ucus + butce.vizeTL + butce.sigorta + butce.harc + butce.konaklama)}
          renk="#fb7185" alt="Uçak + vize + sigorta + harç + otel" />
        <Kutu etiket="Yanında Götüreceğin" deger={tl(butce.yemek + butce.ulasim + butce.ekstra + butce.girisler + butce.alisveris)}
          renk="#fbbf24" alt="Harcama + girişler + alışveriş" />
        <Kutu etiket="Seçilen Gezi Yeri" deger={`${butce.secilenYerler.length} / ${sehir.gezilecek.length}`} renk="#38bdf8"
          alt={butce.girisYerel > 0 ? `Kişi başı ${yerel(butce.girisYerel)} giriş` : "Aşağıdan işaretle"} />
      </KutuIzgara>

      <Kart baslik="Bütçe Dökümü" ikon="💰" renk="#fbbf24"
        aciklama="Türkiye'den çıkış kalemleri dahil. Sürpriz hep unutulan satırdan çıkar."
        sag={<strong style={{ color: "#fbbf24", fontSize: 16 }}>{tl(butce.toplam)}</strong>}>
        <Tablo
          renk="#fbbf24" minGenislik={470}
          basliklar={["Kalem", "Hesap", "Tutar (₺)"]}
          satirlar={[
            { hucreler: ["✈️ Uçak bileti (gidiş-dönüş)", `${kisi} × ${tl(sehir.ucusTL)}`, tl(butce.ucus)] },
            { hucreler: [`🛂 ${vize.ad}`, vize.ucret > 0 ? `${kisi} × (${vize.ucret} ${vize.para} + ${tl(vize.hizmet)})` : (vize.hizmet ? `${kisi} × ${tl(vize.hizmet)}` : "Ücret yok"), tl(butce.vizeTL)] },
            { hucreler: ["🏥 Seyahat sağlık sigortası", `${gun} gün × ${kisi} × ${tl(SIGORTA_GUNLUK)}`, tl(butce.sigorta)] },
            { hucreler: ["🧾 Yurt dışı çıkış harcı", `${kisi} × ${tl(YURTDISI_HARC)}`, tl(butce.harc)] },
            { hucreler: [`🏨 Konaklama (${butce.seviye.ad})`, `${gece} gece × ${oda} oda × ${yerel(butce.geceFiyat)}`, tl(butce.konaklama)], vurgu: true },
            { hucreler: ["🍽️ Yemek", `${gun} × ${kisi} × ${yerel(sehir.gunluk.yemek)}`, tl(butce.yemek)] },
            { hucreler: ["🚇 Şehir içi ulaşım", `${gun} × ${kisi} × ${yerel(sehir.gunluk.ulasim)}`, tl(butce.ulasim)] },
            { hucreler: ["☕ Günlük ekstra", `${gun} × ${kisi} × ${yerel(sehir.gunluk.ekstra)}`, tl(butce.ekstra)] },
            { hucreler: ["🎟️ Müze & giriş", butce.secilenYerler.length ? `${butce.secilenYerler.length} yer × ${kisi} kişi` : "Aşağıdan seç", tl(butce.girisler)], vurgu: true },
            { hucreler: ["🛍️ Alışveriş & hediyelik", "Kendi girdiğin tutar", tl(butce.alisveris)] },
            { hucreler: ["🧯 Acil pay (%10)", "Gecikme, taksi, beklenmeyen", tl(butce.pay)], renk: "#94a3b8" },
            { hucreler: ["TOPLAM", `${kisi} kişi · ${gun} gün`, tl(butce.toplam)], vurgu: true, kalin: true, renk: "#fbbf24" },
            { hucreler: ["Kişi başı", "Toplam / kişi", tl(butce.kisiBasi)], kalin: true, renk: "#60a5fa" },
          ]}
          not={`Yerel fiyatlar ${para.ad} cinsinden; 1 ${para.simge} = ${String(kur).replace(".", ",")} ₺ kuruyla çevrildi. Kuru yukarıdan güncelleyebilirsin.`}
        />
        <Not tur="uyari">
          Uçak bileti bütçenin en oynak kalemi. Aynı rota 3 ay önceden {tl(sehir.ucusTL * 0.6)} iken,
          son hafta {tl(sehir.ucusTL * 1.8)} olabiliyor. Tarih esnekse Salı–Çarşamba uçuşları belirgin ucuz.
        </Not>
      </Kart>

      {/* --- Saat saat rota ----------------------------------------------------- */}
      {rota.length ? (
        <Kart baslik={`${rota.length} Günlük Program`} ikon="🗓️" renk="#a78bfa"
          aciklama="Saatler açılış saatlerine, bilet seanslarına ve yürüme mesafelerine göre verildi. Ağır duraklar sabaha alındı.">
          <div style={{ display: "grid", gap: 12 }}>
            {rota.map((g) => <GunKarti key={g.gun} gun={g} renk={sehir.renk} />)}
          </div>
          {gun !== rota.length ? (
            <Not tur="uyari">
              Program {rota.length} gün için kurulmuş, sen {gun} gün seçtin.
              {gun > rota.length
                ? ` Fazla ${gun - rota.length} günü dinlenmeye, bir çevre gezisine ya da en beğendiğin yere ikinci ziyarete ayır.`
                : ` ${rota.length - gun} günü çıkarman gerekiyor — son günleri değil, en yorucu günü böl ve iki güne yay.`}
            </Not>
          ) : null}
        </Kart>
      ) : null}

      {/* --- Gezilecek yerler ---------------------------------------------------- */}
      <Kart baslik="Gezilecek Yerler" ikon="📍" renk="#38bdf8"
        aciklama="İşaretlediğin her yer bütçeye eklenir. Ücretsiz olanlar bütçeyi şişirmez ama programa girer."
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

      {/* --- Pratik bilgiler ------------------------------------------------------ */}
      <Kart baslik="Bilmen Gerekenler" ikon="💡" renk="#34d399">
        <div style={{ display: "grid", gap: 8 }}>
          {sehir.ipuclari.map((i, idx) => (
            <div key={idx} style={{
              display: "flex", gap: 9, border: "1px solid rgba(52,211,153,.24)", background: "rgba(52,211,153,.07)",
              borderRadius: 12, padding: "10px 12px", color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6,
            }}>
              <span style={{ flex: "0 0 auto", color: "#34d399", fontWeight: 900 }}>•</span>
              <span>{i}</span>
            </div>
          ))}
        </div>
        <Alan label="Kendi notların" hint="Rezervasyon numaraları, uçuş saatleri, kime hediye alınacak — buraya yaz, kaydedilir.">
          <textarea value={a.notlar} rows={4}
            placeholder={`Örn: ${sehir.gezilecek[0]?.ad || "müze"} bileti 14 Mayıs 09:00 · otel onay no 4412`}
            onChange={(e) => onAyar("notlar", e.target.value)}
            style={{ ...satirInput, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
        </Alan>
      </Kart>

      <div style={{ color: "#475569", fontSize: 10.5, textAlign: "center", padding: "6px 0 2px", lineHeight: 1.6 }}>
        Görseller: Wikimedia Commons (serbest lisans). Fiyatlar 2026 referanslarıdır; sezona, kura ve
        rezervasyon zamanına göre değişir.
      </div>
    </section>
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
    <div style={{ border: `1px solid ${renk}33`, borderRadius: 16, overflow: "hidden", background: `${renk}08` }}>
      <button type="button" onClick={() => setAcik((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer",
          padding: "11px 13px", border: "none",
          background: `linear-gradient(120deg, ${renk}2e, ${renk}0c)`,
          borderBottom: acik ? `1px solid ${renk}2e` : "none",
        }}>
        <span style={{
          flex: "0 0 auto", width: 32, height: 32, borderRadius: 11, display: "grid", placeItems: "center",
          background: `${renk}33`, color: "#fff", fontWeight: 900, fontSize: 13,
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
          <div style={{
            marginTop: 11, borderLeft: `2px solid ${renk}80`, paddingLeft: 11,
            color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.6,
          }}>
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
