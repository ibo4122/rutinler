"use client";

import { useMemo, useRef, useState } from "react";
import { BOLGELER_TR, bolgeIlleri } from "../lib/turkiye";
import { yerCoz, yerAra, gezilenIller, gezilenUlkeler } from "../lib/seyahatYer";
import { supabase } from "../lib/supabaseClient";
import { num, tl, yeniId } from "./panelUI";

// Seyahat Defterim — kişisel alan.
//
// Uygulamanın geri kalanı "ekran"dır: kartlar, tablolar, puanlar. Burası
// bilinçli olarak öyle değil; bir pasaport ve bir deri defter gibi tasarlandı.
// Dört bölüm, dört ayrı metafor — ayrımlar bu yüzden ilk bakışta okunur:
//
//   YOLCULUK TAKVİMİ  — planlananlar, bilet koçanı gibi, tarihe göre dizili
//   PASAPORT          — gidilen yerler, damga gibi; içinde fotoğraflar ve notlar
//   TÜRKİYE HARİTAM   — 81 plaka; gezilen iller yanar, buradan da işaretlenir
//   HAYAL PANOSU      — ileri yıllar, panoya iğnelenmiş kartpostallar
//
// Kayıt eklemek için Keşfet'e ya da Rehber'e gitmek gerekmez: "Deftere yaz"
// kutusu tüm şehirleri, 81 ili, turları arar; listede olmayan bir yer de elle
// yazılabilir.

const D = {
  murekkep: "#f3e7d0",
  soluk: "#c9b48f",
  silik: "#8a7656",
  altin: "#e7b85c",
  plan: "#ee8a62",
  gittim: "#7fc79a",
  hayal: "#b9a5e6",
  cizgi: "rgba(231,184,92,.2)",
};
const SERIF = 'Georgia, "Times New Roman", serif';
const AY_KISA = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const BUGUN = () => new Date().toISOString().slice(0, 10);
const tarihObj = (iso) => { const d = new Date((iso || "") + "T12:00:00"); return Number.isNaN(d.getTime()) ? null : d; };
const uzunTarih = (iso) => { const d = tarihObj(iso); return d ? `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}` : ""; };
const damgaTarih = (iso) => { const d = tarihObj(iso); return d ? `${String(d.getDate()).padStart(2, "0")} ${AY_KISA[d.getMonth()]} ${d.getFullYear()}` : ""; };
const gunFark = (iso) => { const d = tarihObj(iso); return d ? Math.round((d - tarihObj(BUGUN())) / 86400000) : null; };
const gunSayisi = (k) => {
  if (num(k.gun) > 0) return num(k.gun);
  const a = tarihObj(k.baslangic), b = tarihObj(k.bitis);
  return a && b ? Math.max(1, Math.round((b - a) / 86400000) + 1) : 0;
};
// Her kaydın kendine özgü ama sabit bir eğimi olsun — damgalar ve kartpostallar
// "elle yapıştırılmış" görünsün, her yenilemede zıplamasın.
const ozet = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};
const egim = (id, aralik = 5) => ((ozet(id) % (aralik * 20)) / 10 - aralik).toFixed(1);

const BOLUMLER = [
  { id: "takvim", ad: "Yolculuk Takvimi", ikon: "🗓️", renk: D.plan, mod: "plan" },
  { id: "pasaport", ad: "Pasaport", ikon: "🛂", renk: D.gittim, mod: "gidildi" },
  { id: "harita", ad: "Türkiye Haritam", ikon: "🇹🇷", renk: "#e85d6a", mod: "gidildi" },
  { id: "hayal", ad: "Hayal Panosu", ikon: "✨", renk: D.hayal, mod: "hayal" },
];

export default function SeyahatDefteri({ planlar, hayaller, setData, userId, onSehir, onIl, onTur }) {
  const [bolum, setBolum] = useState("takvim");

  const planGuncelle = (id, degisiklik) =>
    setData((s) => ({ ...(s || {}), planlar: ((s || {}).planlar || []).map((p) => (p.id === id ? { ...p, ...degisiklik } : p)) }));
  const planSil = (id) =>
    setData((s) => ({ ...(s || {}), planlar: ((s || {}).planlar || []).filter((p) => p.id !== id) }));
  const planEkle = (kayit) =>
    setData((s) => ({ ...(s || {}), planlar: [...((s || {}).planlar || []), kayit] }));
  const hayalGuncelle = (id, degisiklik) =>
    setData((s) => ({ ...(s || {}), hayaller: ((s || {}).hayaller || []).map((h) => (h.id === id ? { ...h, ...degisiklik } : h)) }));
  const hayalSil = (id) =>
    setData((s) => ({ ...(s || {}), hayaller: ((s || {}).hayaller || []).filter((h) => h.id !== id) }));
  const hayalEkle = (kayit) =>
    setData((s) => ({ ...(s || {}), hayaller: [...((s || {}).hayaller || []), kayit] }));
  const hayaliPlanla = (h) => {
    const { id, hedefYil, ...ref } = h;
    planEkle({ ...ref, id: yeniId(), durum: "plan", baslangic: "", bitis: "", fotograflar: [] });
    hayalSil(id);
    setBolum("takvim");
  };

  const ac = (k) => (k.sehirId ? onSehir?.(k.sehirId) : k.ilId ? onIl?.(k.ilId) : k.turId ? onTur?.(k.turId) : null);

  const planlanan = planlar.filter((p) => p.durum !== "gidildi");
  const gidilen = planlar.filter((p) => p.durum === "gidildi");
  const iller = useMemo(() => gezilenIller(planlar), [planlar]);
  const ulkeler = useMemo(() => gezilenUlkeler(planlar), [planlar]);
  const toplamGun = gidilen.reduce((s, p) => s + gunSayisi(p), 0);

  const aktifBolum = BOLUMLER.find((b) => b.id === bolum);
  const sayac = { takvim: planlanan.length, pasaport: gidilen.length, harita: `${iller.size}/81`, hayal: hayaller.length };

  return (
    <section style={{
      borderRadius: 26, overflow: "hidden", border: `1px solid ${D.cizgi}`,
      background: "linear-gradient(180deg, #1e150d 0%, #150f0a 60%, #120c08 100%)",
      boxShadow: "inset 0 1px 0 rgba(231,184,92,.12)",
    }}>
      <PasaportKapagi ulke={ulkeler.size} yer={gidilen.length} il={iller.size} gun={toplamGun} plan={planlanan.length} hayal={hayaller.length} />

      <div style={{ padding: "18px 18px 22px", display: "grid", gap: 18 }}>
        <DefteraYaz varsayilanMod={aktifBolum.mod} onPlan={planEkle} onHayal={hayalEkle} onBolum={setBolum} />

        {/* Bölüm sekmeleri — her bölüm kendi rengini ve metaforunu taşır */}
        <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
          {BOLUMLER.map((b) => {
            const aktif = b.id === bolum;
            return (
              <button key={b.id} type="button" onClick={() => setBolum(b.id)}
                style={{
                  position: "relative", textAlign: "left", padding: "12px 14px 12px 16px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${aktif ? b.renk : "rgba(201,180,143,.18)"}`,
                  background: aktif ? `linear-gradient(135deg, ${b.renk}30, ${b.renk}0a)` : "rgba(243,231,208,.03)",
                  overflow: "hidden",
                }}>
                {aktif ? <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: b.renk }} /> : null}
                <div style={{ fontFamily: SERIF, color: aktif ? D.murekkep : D.soluk, fontSize: 15.5, fontWeight: 700 }}>{b.ikon} {b.ad}</div>
                <div style={{ color: aktif ? b.renk : D.silik, fontSize: 12, fontWeight: 800, marginTop: 3 }}>{sayac[b.id]}</div>
              </button>
            );
          })}
        </nav>

        {bolum === "takvim" ? (
          <YolculukTakvimi planlar={planlanan} onGuncelle={planGuncelle} onSil={planSil} onAc={ac} userId={userId} />
        ) : bolum === "pasaport" ? (
          <Pasaport planlar={gidilen} onGuncelle={planGuncelle} onSil={planSil} onAc={ac} userId={userId} />
        ) : bolum === "harita" ? (
          <TurkiyeHaritam gezilen={iller} planlar={planlar} onEkle={planEkle} onIl={onIl} />
        ) : (
          <HayalPanosu hayaller={hayaller} onGuncelle={hayalGuncelle} onSil={hayalSil} onPlanla={hayaliPlanla} onAc={ac} />
        )}
      </div>
    </section>
  );
}

// ======================= KAPAK ==============================================

function PasaportKapagi({ ulke, yer, il, gun, plan, hayal }) {
  const damgalar = [
    { d: ulke, e: "ülke" }, { d: yer, e: "seyahat" }, { d: il, e: "il" },
    { d: gun, e: "gün yolda" }, { d: plan, e: "plan" }, { d: hayal, e: "hayal" },
  ];
  return (
    <header style={{
      position: "relative", padding: "24px 22px 20px",
      background: "radial-gradient(120% 140% at 0% 0%, #4a2d18 0%, #2a1a0e 45%, #1b120b 100%)",
      borderBottom: `1px solid ${D.cizgi}`,
    }}>
      {/* deri dikiş izi */}
      <div style={{ position: "absolute", inset: 10, border: "1.5px dashed rgba(231,184,92,.22)", borderRadius: 18, pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          flex: "0 0 auto", width: 64, height: 64, borderRadius: 999, display: "grid", placeItems: "center",
          border: `2px solid ${D.altin}`, color: D.altin, fontSize: 28, background: "rgba(231,184,92,.08)",
        }}>🧭</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ color: D.altin, fontSize: 11, fontWeight: 900, letterSpacing: ".32em" }}>KİŞİSEL · PASAPORT</div>
          <h2 style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 30, fontWeight: 700, margin: "5px 0 0", letterSpacing: ".01em" }}>
            Seyahat Defterim
          </h2>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", color: D.soluk, fontSize: 14, marginTop: 4 }}>
            Gittiğim, gideceğim ve bir gün mutlaka gideceğim yerler.
          </div>
        </div>
      </div>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))", gap: 8, marginTop: 18 }}>
        {damgalar.map((x) => (
          <div key={x.e} style={{ textAlign: "center", padding: "9px 6px", borderRadius: 12, border: "1px solid rgba(231,184,92,.22)", background: "rgba(20,12,7,.55)" }}>
            <div style={{ fontFamily: SERIF, color: D.altin, fontSize: 25, fontWeight: 700, lineHeight: 1 }}>{x.d}</div>
            <div style={{ color: D.silik, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginTop: 5 }}>{x.e}</div>
          </div>
        ))}
      </div>
    </header>
  );
}

// ======================= DEFTERE YAZ (doğrudan ekleme) ======================

function DefteraYaz({ varsayilanMod, onPlan, onHayal, onBolum }) {
  const [acik, setAcik] = useState(false);
  const [mod, setMod] = useState(varsayilanMod);
  const [terim, setTerim] = useState("");
  const [secili, setSecili] = useState(null);       // { ref, ad, alt, bayrak, gorsel }
  const [elle, setElle] = useState(false);
  const [elleAd, setElleAd] = useState("");
  const [elleUlke, setElleUlke] = useState("");
  const [bas, setBas] = useState("");
  const [bit, setBit] = useState("");
  const [yil, setYil] = useState(String(new Date().getFullYear() + 1));
  const [not, setNot] = useState("");
  const [mesaj, setMesaj] = useState("");

  const sonuclar = terim.trim().length >= 1 ? yerAra(terim, 10) : [];
  const MODLAR = [
    { id: "plan", ad: "Planlıyorum", ikon: "🗓️", renk: D.plan, alt: "Takvime düşer" },
    { id: "gidildi", ad: "Gittim", ikon: "🛂", renk: D.gittim, alt: "Pasaporta damga" },
    { id: "hayal", ad: "Hayalim", ikon: "✨", renk: D.hayal, alt: "Panoya iğnelenir" },
  ];
  const m = MODLAR.find((x) => x.id === mod) || MODLAR[0];

  const sifirla = () => { setTerim(""); setSecili(null); setElle(false); setElleAd(""); setElleUlke(""); setBas(""); setBit(""); setNot(""); };

  const kaydet = () => {
    const ref = elle ? (elleAd.trim() ? { ozel: { ad: elleAd.trim(), ulke: elleUlke.trim() } } : null) : secili?.ref;
    if (!ref) { setMesaj("Önce bir yer seç ya da elle yaz."); return; }
    if (mod === "hayal") {
      onHayal({ ...ref, id: yeniId(), hedefYil: num(yil) || new Date().getFullYear() + 1, not });
      onBolum("hayal");
    } else {
      onPlan({ ...ref, id: yeniId(), durum: mod, baslangic: bas, bitis: bit, notlar: not, puan: 0, fotograflar: [] });
      onBolum(mod === "gidildi" ? "pasaport" : "takvim");
    }
    setMesaj(`✓ ${elle ? elleAd : secili.ad} deftere yazıldı.`);
    setTimeout(() => setMesaj(""), 3500);
    sifirla();
    setAcik(false);
  };

  const girdi = {
    width: "100%", minWidth: 0, height: 44, borderRadius: 11, padding: "0 12px", outline: "none",
    background: "rgba(20,12,7,.7)", border: "1px solid rgba(201,180,143,.25)", color: D.murekkep, fontSize: 14,
  };

  if (!acik) {
    return (
      <button type="button" onClick={() => { setMod(varsayilanMod); setAcik(true); }}
        style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
          padding: "15px 18px", borderRadius: 16, border: `1.5px dashed ${D.altin}88`,
          background: "repeating-linear-gradient(0deg, rgba(243,231,208,.025) 0 27px, rgba(231,184,92,.07) 27px 28px)",
        }}>
        <span style={{ fontSize: 24 }}>✒️</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: SERIF, color: D.murekkep, fontSize: 18, fontWeight: 700 }}>Deftere yaz</span>
          <span style={{ display: "block", color: D.soluk, fontSize: 12.5, marginTop: 2 }}>
            Planladığın, gittiğin ya da hayal ettiğin bir yeri doğrudan buradan ekle — şehir, il, Türkiye turu ya da listede olmayan herhangi bir yer.
          </span>
        </span>
        <span style={{ color: D.altin, fontSize: 24, fontWeight: 900 }}>+</span>
        {mesaj ? <span style={{ color: D.gittim, fontSize: 12, fontWeight: 800 }}>{mesaj}</span> : null}
      </button>
    );
  }

  return (
    <div style={{
      borderRadius: 18, padding: "16px", border: `1px solid ${m.renk}66`,
      background: `linear-gradient(180deg, ${m.renk}14, rgba(20,12,7,.6))`,
      display: "grid", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 19, fontWeight: 700 }}>✒️ Deftere yaz</span>
        <button type="button" onClick={() => { setAcik(false); sifirla(); }}
          style={{ border: "none", background: "transparent", color: D.soluk, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Kapat ✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {MODLAR.map((x) => {
          const s = x.id === mod;
          return (
            <button key={x.id} type="button" onClick={() => setMod(x.id)}
              style={{
                padding: "11px 8px", borderRadius: 13, cursor: "pointer", textAlign: "center",
                border: `1.5px solid ${s ? x.renk : "rgba(201,180,143,.2)"}`,
                background: s ? `${x.renk}2e` : "rgba(20,12,7,.5)",
              }}>
              <div style={{ fontSize: 20 }}>{x.ikon}</div>
              <div style={{ fontFamily: SERIF, color: s ? D.murekkep : D.soluk, fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{x.ad}</div>
              <div style={{ color: s ? x.renk : D.silik, fontSize: 10.5, fontWeight: 700, marginTop: 2 }}>{x.alt}</div>
            </button>
          );
        })}
      </div>

      {/* Yer seçimi */}
      {secili && !elle ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: 13, border: `1px solid ${m.renk}66`, background: "rgba(20,12,7,.6)" }}>
          <Kucukresim src={secili.gorsel} renk={secili.renk} bayrak={secili.bayrak} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", fontFamily: SERIF, color: D.murekkep, fontSize: 16 }}>{secili.ad}</strong>
            <span style={{ display: "block", color: D.soluk, fontSize: 12 }}>{secili.bayrak} {secili.alt}</span>
          </span>
          <button type="button" onClick={() => setSecili(null)} style={{ border: "none", background: "transparent", color: D.soluk, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      ) : elle ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
          <input value={elleAd} placeholder="Yer — örn: Lofoten Adaları" onChange={(e) => setElleAd(e.target.value)} style={girdi} />
          <input value={elleUlke} placeholder="Ülke — örn: Norveç" onChange={(e) => setElleUlke(e.target.value)} style={girdi} />
          <button type="button" onClick={() => setElle(false)} style={{ ...girdi, cursor: "pointer", color: D.soluk, fontWeight: 800 }}>← Listeden seç</button>
        </div>
      ) : (
        <div>
          <input value={terim} placeholder="🔍 Nereye? — şehir, il, Türkiye turu…" onChange={(e) => setTerim(e.target.value)} style={girdi} />
          {sonuclar.length ? (
            <div style={{ marginTop: 6, display: "grid", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {sonuclar.map((y) => (
                <button key={y.anahtar} type="button" onClick={() => { setSecili(y); setTerim(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", borderRadius: 11, cursor: "pointer", textAlign: "left", border: "1px solid rgba(201,180,143,.14)", background: "rgba(20,12,7,.55)" }}>
                  <Kucukresim src={y.gorsel} renk={y.renk} bayrak={y.bayrak} kucuk />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", color: D.murekkep, fontSize: 13.5, fontWeight: 700 }}>{y.ad}</span>
                    <span style={{ display: "block", color: D.silik, fontSize: 11 }}>{y.bayrak} {y.alt}</span>
                  </span>
                  <span style={{ color: D.silik, fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>{y.grup}</span>
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" onClick={() => { setElle(true); setElleAd(terim); }}
            style={{ marginTop: 8, border: "none", background: "transparent", color: D.altin, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: 0 }}>
            Listede yok mu? Kendim yazayım →
          </button>
        </div>
      )}

      {/* Tarih / yıl */}
      {mod === "hayal" ? (
        <label style={{ display: "block" }}>
          <span style={{ display: "block", color: D.soluk, fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Hangi yıl?</span>
          <input value={yil} inputMode="numeric" onChange={(e) => setYil(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} style={{ ...girdi, maxWidth: 140 }} />
        </label>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", color: D.soluk, fontSize: 12, fontWeight: 800, marginBottom: 5 }}>{mod === "gidildi" ? "Gidiş" : "Gidiş (opsiyonel)"}</span>
            <input type="date" value={bas} onChange={(e) => setBas(e.target.value)} style={girdi} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", color: D.soluk, fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Dönüş</span>
            <input type="date" value={bit} min={bas || undefined} onChange={(e) => setBit(e.target.value)} style={girdi} />
          </label>
        </div>
      )}

      <textarea value={not} rows={2} placeholder={mod === "hayal" ? "Neden orası? Ne görmek istiyorsun?" : "Kısa bir not…"}
        onChange={(e) => setNot(e.target.value)}
        style={{ ...girdi, height: "auto", padding: "10px 12px", fontFamily: SERIF, fontStyle: "italic", resize: "vertical", lineHeight: 1.6 }} />

      <button type="button" onClick={kaydet}
        style={{ height: 48, borderRadius: 13, cursor: "pointer", border: "none", background: `linear-gradient(120deg, ${m.renk}, ${m.renk}bb)`, color: "#1a0f08", fontFamily: SERIF, fontSize: 16, fontWeight: 700 }}>
        {m.ikon} {mod === "hayal" ? "Panoya iğnele" : mod === "gidildi" ? "Pasaporta damgala" : "Takvime yaz"}
      </button>
      {mesaj ? <div style={{ color: D.plan, fontSize: 12.5, fontWeight: 700 }}>{mesaj}</div> : null}
    </div>
  );
}

function Kucukresim({ src, renk, bayrak, kucuk }) {
  const b = kucuk ? 38 : 52;
  return src ? (
    <img src={src} alt="" loading="lazy" style={{ width: b, height: b, borderRadius: 10, objectFit: "cover", flex: "0 0 auto", border: `1px solid ${renk}66` }} />
  ) : (
    <span style={{ width: b, height: b, borderRadius: 10, flex: "0 0 auto", display: "grid", placeItems: "center", background: `${renk}2e`, fontSize: kucuk ? 17 : 22 }}>{bayrak}</span>
  );
}

// ======================= KAYIT DÜZENLEYİCİ (ortak) ==========================

function KayitDuzenle({ kayit, onGuncelle, onSil, userId, gidildi, renk }) {
  const girdi = {
    width: "100%", minWidth: 0, height: 40, borderRadius: 10, padding: "0 10px", outline: "none",
    background: "rgba(20,12,7,.7)", border: "1px solid rgba(201,180,143,.25)", color: D.murekkep, fontSize: 13.5,
  };
  const etiket = (m) => <span style={{ display: "block", color: D.soluk, fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>{m}</span>;
  return (
    <div style={{ display: "grid", gap: 12, paddingTop: 12, borderTop: `1px dashed ${D.cizgi}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        <label>{etiket("Gidiş")}<input type="date" value={kayit.baslangic || ""} onChange={(e) => onGuncelle({ baslangic: e.target.value })} style={girdi} /></label>
        <label>{etiket("Dönüş")}<input type="date" value={kayit.bitis || ""} onChange={(e) => onGuncelle({ bitis: e.target.value })} style={girdi} /></label>
        <label>{etiket("Kişi")}<input value={kayit.kisi || ""} inputMode="numeric" onChange={(e) => onGuncelle({ kisi: num(e.target.value.replace(/[^\d]/g, "")) })} style={girdi} /></label>
        <label>{etiket(gidildi ? "Harcadığım (₺)" : "Bütçe (₺)")}<input value={kayit.butce || ""} inputMode="numeric" onChange={(e) => onGuncelle({ butce: num(e.target.value.replace(/[^\d]/g, "")) })} style={girdi} /></label>
      </div>
      {gidildi ? (
        <div>
          {etiket("Puanım")}
          <div style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onGuncelle({ puan: n })}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 25, padding: 0, color: n <= (kayit.puan || 0) ? D.altin : "#3a2d1f" }}>★</button>
            ))}
          </div>
        </div>
      ) : null}
      <label>
        {etiket(gidildi ? "Hatıram" : "Notlarım")}
        <textarea value={kayit.notlar || ""} rows={3}
          placeholder={gidildi ? "Nerede kaldın, ne yedin, kimle tanıştın…" : "Rezervasyonlar, yapılacaklar…"}
          onChange={(e) => onGuncelle({ notlar: e.target.value })}
          style={{ ...girdi, height: "auto", padding: "10px 12px", fontFamily: SERIF, fontStyle: "italic", lineHeight: 1.65, resize: "vertical" }} />
      </label>
      {gidildi ? <Polaroidler kayit={kayit} userId={userId} onGuncelle={onGuncelle} /> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => onGuncelle({ durum: gidildi ? "plan" : "gidildi" })}
          style={{ flex: "1 1 200px", height: 42, borderRadius: 11, cursor: "pointer", border: "none", fontFamily: SERIF, fontSize: 14.5, fontWeight: 700,
            background: gidildi ? "rgba(201,180,143,.15)" : `linear-gradient(120deg, ${D.gittim}, #5aa878)`, color: gidildi ? D.soluk : "#0c1a10" }}>
          {gidildi ? "↩ Takvime geri al" : "🛂 Gittim — pasaporta damgala"}
        </button>
        <button type="button" onClick={onSil}
          style={{ height: 42, padding: "0 16px", borderRadius: 11, cursor: "pointer", border: "1px solid rgba(232,93,106,.4)", background: "rgba(232,93,106,.1)", color: "#f0a0a8", fontSize: 13, fontWeight: 800 }}>
          Sil
        </button>
      </div>
    </div>
  );
}

// ======================= 1) YOLCULUK TAKVİMİ ================================

function YolculukTakvimi({ planlar, onGuncelle, onSil, onAc, userId }) {
  const [acikId, setAcikId] = useState(null);
  const sirali = [...planlar].sort((a, b) => (a.baslangic || "9999").localeCompare(b.baslangic || "9999"));
  const gruplar = [];
  for (const p of sirali) {
    const d = tarihObj(p.baslangic);
    const anahtar = d ? `${d.getFullYear()}-${d.getMonth()}` : "tarihsiz";
    const baslik = d ? `${AYLAR[d.getMonth()]} ${d.getFullYear()}` : "Tarihi henüz belli değil";
    const g = gruplar.find((x) => x.anahtar === anahtar);
    if (g) g.liste.push(p); else gruplar.push({ anahtar, baslik, liste: [p] });
  }

  if (!planlar.length) {
    return <BosSayfa ikon="🗓️" renk={D.plan} baslik="Takvimin boş"
      metin="Yukarıdaki 'Deftere yaz' ile bir yolculuk planla, ya da Keşfet ve Türkiye Rehberi'nden bir yeri 'Planla' diyerek buraya düşür." />;
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {gruplar.map((g) => (
        <div key={g.anahtar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: SERIF, color: D.plan, fontSize: 18, fontWeight: 700 }}>{g.baslik}</span>
            <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${D.plan}66, transparent)` }} />
          </div>
          <div style={{ display: "grid", gap: 11 }}>
            {g.liste.map((p) => (
              <BiletKocani key={p.id} kayit={p} acik={acikId === p.id}
                onAcKapat={() => setAcikId(acikId === p.id ? null : p.id)}
                onGuncelle={(d) => onGuncelle(p.id, d)} onSil={() => onSil(p.id)} onAc={() => onAc(p)} userId={userId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Bilet koçanı: solda tarih kocanı, delikli çizgi, sağda yolculuk.
function BiletKocani({ kayit, acik, onAcKapat, onGuncelle, onSil, onAc, userId }) {
  const y = yerCoz(kayit);
  const d = tarihObj(kayit.baslangic);
  const kalan = gunFark(kayit.baslangic);
  const gun = gunSayisi(kayit);
  const gecmis = kalan != null && kalan < 0;

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: "#f3e7d0", color: "#2a1c10", boxShadow: "0 6px 20px rgba(0,0,0,.35)" }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* koçan */}
        <div style={{ flex: "0 0 auto", width: 86, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 6px", background: D.plan, color: "#fff" }}>
          {d ? (
            <>
              <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</span>
              <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".14em", marginTop: 3 }}>{AY_KISA[d.getMonth()]}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85 }}>{d.getFullYear()}</span>
            </>
          ) : (
            <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, textAlign: "center" }}>Tarih<br />yok</span>
          )}
        </div>
        {/* delikli ayraç */}
        <div style={{ position: "relative", width: 0, borderLeft: "2px dashed rgba(42,28,16,.28)" }}>
          <span style={{ position: "absolute", top: -9, left: -10, width: 18, height: 18, borderRadius: 999, background: "#16100b" }} />
          <span style={{ position: "absolute", bottom: -9, left: -10, width: 18, height: 18, borderRadius: 999, background: "#16100b" }} />
        </div>
        {/* gövde */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
          {y.gorsel ? <img src={y.gorsel} alt="" loading="lazy" style={{ width: 62, height: 62, borderRadius: 10, objectFit: "cover", flex: "0 0 auto" }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".2em", color: "#9a7b55" }}>
              {y.tip === "tur" ? "TÜRKİYE TURU" : y.tip === "il" ? "TÜRKİYE · İL" : y.tip === "ozel" ? "KENDİ ROTAM" : "YOLCULUK"}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>{y.ad}</div>
            <div style={{ fontSize: 12, color: "#6b5236", marginTop: 3 }}>
              {y.bayrak} {y.alt}
              {gun ? ` · ${gun} gün` : ""}{kayit.kisi ? ` · ${kayit.kisi} kişi` : ""}{kayit.butce ? ` · ${tl(kayit.butce)}` : ""}
            </div>
            {kayit.notlar && !acik ? (
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12.5, color: "#7a5f40", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{kayit.notlar}”</div>
            ) : null}
          </div>
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {kalan != null ? (
              <span style={{ background: gecmis ? "#b08a5e" : "#2a1c10", color: "#f3e7d0", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, fontWeight: 900, whiteSpace: "nowrap" }}>
                {gecmis ? "Tarih geçti" : kalan === 0 ? "Bugün!" : `${kalan} gün kaldı`}
              </span>
            ) : null}
            <span style={{ display: "flex", gap: 5 }}>
              <button type="button" onClick={onAcKapat} style={{ border: "1px solid #c9b48f", background: "transparent", color: "#2a1c10", borderRadius: 9, padding: "4px 10px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
                {acik ? "Kapat" : "Düzenle"}
              </button>
              {y.tip !== "ozel" ? (
                <button type="button" onClick={onAc} style={{ border: "1px solid #c9b48f", background: "transparent", color: "#2a1c10", borderRadius: 9, padding: "4px 10px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>Rota</button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
      {acik ? (
        <div style={{ padding: "0 14px 14px", background: "#1d150d" }}>
          <KayitDuzenle kayit={kayit} onGuncelle={onGuncelle} onSil={onSil} userId={userId} renk={D.plan} />
        </div>
      ) : null}
    </div>
  );
}

// ======================= 2) PASAPORT (damgalar) =============================

function Pasaport({ planlar, onGuncelle, onSil, onAc, userId }) {
  const [seciliId, setSeciliId] = useState(null);
  const sirali = [...planlar].sort((a, b) => (b.baslangic || "").localeCompare(a.baslangic || ""));
  const secili = sirali.find((p) => p.id === seciliId);

  if (!planlar.length) {
    return <BosSayfa ikon="🛂" renk={D.gittim} baslik="Pasaportun henüz boş"
      metin="Gittiğin bir yeri 'Deftere yaz → Gittim' ile ekle ya da takvimdeki bir yolculuğu 'Gittim' diye işaretle; damgası buraya basılır." />;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 16, padding: "18px 14px",
        borderRadius: 18, background: "#efe2c6",
        backgroundImage: "repeating-linear-gradient(0deg, transparent 0 27px, rgba(120,90,50,.09) 27px 28px)",
        boxShadow: "inset 0 0 40px rgba(120,80,30,.18)",
      }}>
        {sirali.map((p) => (
          <Damga key={p.id} kayit={p} secili={p.id === seciliId} onClick={() => setSeciliId(p.id === seciliId ? null : p.id)} />
        ))}
      </div>

      {secili ? (
        <div style={{ borderRadius: 18, border: `1px solid ${D.gittim}55`, background: "rgba(20,12,7,.6)", padding: "16px" }}>
          <SayfaBasligi kayit={secili} onAc={() => onAc(secili)} />
          <KayitDuzenle kayit={secili} onGuncelle={(d) => onGuncelle(secili.id, d)} onSil={() => { onSil(secili.id); setSeciliId(null); }} userId={userId} gidildi renk={D.gittim} />
        </div>
      ) : (
        <div style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", color: D.silik, fontSize: 13.5 }}>
          Bir damgaya dokun — hatıraların, puanın ve fotoğrafların açılsın.
        </div>
      )}
    </div>
  );
}

function Damga({ kayit, secili, onClick }) {
  const y = yerCoz(kayit);
  const renk = y.renk || D.gittim;
  // Gerçek pasaporttaki gibi damgaların bir kısmı yuvarlak, bir kısmı köşeli.
  const yuvarlak = ozet(kayit.id + "d") % 3 === 0;
  return (
    <button type="button" onClick={onClick}
      style={{
        position: "relative", cursor: "pointer", background: "transparent", padding: 0, border: "none",
        transform: `rotate(${egim(kayit.id, 6)}deg) ${secili ? "scale(1.06)" : ""}`, transition: "transform .15s",
        aspectRatio: "1 / 1",
      }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: yuvarlak ? 999 : 18,
        border: `3px solid ${renk}`, outline: `1.5px solid ${renk}`, outlineOffset: -9,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16,
        color: renk, opacity: secili ? 1 : 0.88, mixBlendMode: "multiply",
        background: secili ? `${renk}14` : "transparent",
      }}>
        <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".24em" }}>{(y.ulke || "").toLocaleUpperCase("tr")}</span>
        <span style={{ fontFamily: SERIF, fontSize: y.ad.length > 12 ? 15 : 19, fontWeight: 700, textAlign: "center", lineHeight: 1.1, margin: "5px 0", letterSpacing: ".04em" }}>
          {y.ad.toLocaleUpperCase("tr")}
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".12em" }}>{damgaTarih(kayit.baslangic) || "★"}</span>
        {kayit.puan ? <span style={{ fontSize: 11, marginTop: 3, letterSpacing: "1px" }}>{"★".repeat(kayit.puan)}</span> : null}
        {kayit.fotograflar?.length ? <span style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>📷 {kayit.fotograflar.length}</span> : null}
      </div>
    </button>
  );
}

function SayfaBasligi({ kayit, onAc }) {
  const y = yerCoz(kayit);
  const gun = gunSayisi(kayit);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
      <Kucukresim src={y.gorsel} renk={y.renk} bayrak={y.bayrak} />
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 21, fontWeight: 700 }}>{y.ad}</div>
        <div style={{ color: D.soluk, fontSize: 12.5, marginTop: 2 }}>
          {y.bayrak} {y.alt}{kayit.baslangic ? ` · ${uzunTarih(kayit.baslangic)}` : ""}{gun ? ` · ${gun} gün` : ""}
        </div>
      </div>
      {y.tip !== "ozel" ? (
        <button type="button" onClick={onAc} style={{ border: `1px solid ${D.cizgi}`, background: "transparent", color: D.altin, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
          Rehberde aç →
        </button>
      ) : null}
    </div>
  );
}

// Fotoğraflar: Supabase Storage → seyahat-fotograf/{kullaniciId}/{kayitId}/…
// Polaroid çerçeve; her biri hafif eğik, altına el yazısı gibi tarih.
function Polaroidler({ kayit, userId, onGuncelle }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const girdiRef = useRef(null);
  const liste = Array.isArray(kayit.fotograflar) ? kayit.fotograflar : [];

  const yukle = async (dosyalar) => {
    if (!supabase || !userId) { setHata("Fotoğraf yüklemek için oturum gerekiyor."); return; }
    setHata(""); setYukleniyor(true);
    const yeni = [];
    for (const dosya of Array.from(dosyalar).slice(0, 10)) {
      if (dosya.size > 5 * 1024 * 1024) { setHata(`${dosya.name} 5 MB'tan büyük, atlandı.`); continue; }
      const uzanti = (dosya.name.split(".").pop() || "jpg").toLowerCase();
      const yol = `${userId}/${kayit.id}/${yeniId()}.${uzanti}`;
      const { error } = await supabase.storage.from("seyahat-fotograf").upload(yol, dosya, { cacheControl: "3600", upsert: false });
      if (error) { setHata("Yükleme hatası: " + error.message); continue; }
      const { data } = supabase.storage.from("seyahat-fotograf").getPublicUrl(yol);
      yeni.push({ yol, url: data.publicUrl });
    }
    if (yeni.length) onGuncelle({ fotograflar: [...liste, ...yeni] });
    setYukleniyor(false);
    if (girdiRef.current) girdiRef.current.value = "";
  };

  const sil = async (foto) => {
    if (supabase && foto.yol) await supabase.storage.from("seyahat-fotograf").remove([foto.yol]).catch(() => {});
    onGuncelle({ fotograflar: liste.filter((f) => f.yol !== foto.yol) });
  };

  return (
    <div>
      <span style={{ display: "block", color: D.soluk, fontSize: 11.5, fontWeight: 800, marginBottom: 10 }}>
        Fotoğraflarım {liste.length ? `· ${liste.length}` : ""}
      </span>
      {liste.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 16, padding: "4px 4px 12px" }}>
          {liste.map((f, i) => (
            <div key={f.yol} style={{ position: "relative", background: "#faf6ee", padding: "8px 8px 26px", borderRadius: 3, boxShadow: "0 6px 16px rgba(0,0,0,.45)", transform: `rotate(${egim(f.yol, 4)}deg)` }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                <img src={f.url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", background: "#ddd" }} />
              </a>
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 6, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 11.5, color: "#5a4630" }}>
                {damgaTarih(kayit.baslangic) ? damgaTarih(kayit.baslangic).toLocaleLowerCase("tr") : `#${i + 1}`}
              </span>
              <button type="button" onClick={() => sil(f)} title="Sil"
                style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: 999, cursor: "pointer", border: "none", background: "#2a1c10", color: "#f0a0a8", fontSize: 13, fontWeight: 900 }}>×</button>
            </div>
          ))}
        </div>
      ) : null}
      <input ref={girdiRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => e.target.files?.length && yukle(e.target.files)} />
      <button type="button" onClick={() => girdiRef.current?.click()} disabled={yukleniyor}
        style={{ width: "100%", height: 44, borderRadius: 11, cursor: yukleniyor ? "default" : "pointer", border: `1.5px dashed ${D.altin}88`, background: "rgba(231,184,92,.06)", color: D.altin, fontFamily: SERIF, fontSize: 14, fontWeight: 700, opacity: yukleniyor ? 0.6 : 1 }}>
        {yukleniyor ? "Yükleniyor…" : "📷 Fotoğraf ekle"}
      </button>
      {hata ? <div style={{ color: "#f0a0a8", fontSize: 11.5, marginTop: 6 }}>{hata}</div> : null}
    </div>
  );
}

// ======================= 3) TÜRKİYE HARİTAM =================================

function TurkiyeHaritam({ gezilen, planlar, onEkle, onIl }) {
  const [secili, setSecili] = useState(null);
  const planli = new Set(planlar.filter((p) => p.durum !== "gidildi" && p.ilId).map((p) => p.ilId));
  const yuzde = Math.round((gezilen.size / 81) * 100);

  const isaretle = (il, durum) => {
    onEkle({ ilId: il.id, id: yeniId(), durum, baslangic: "", bitis: "", notlar: "", puan: 0, fotograflar: [] });
    setSecili(null);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(232,93,106,.35)", background: "rgba(232,93,106,.07)" }}>
        <div style={{ fontFamily: SERIF, color: D.murekkep }}>
          <span style={{ fontSize: 38, fontWeight: 700, color: "#e85d6a" }}>{gezilen.size}</span>
          <span style={{ fontSize: 18, color: D.soluk }}> / 81 il</span>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
            <div style={{ width: `${yuzde}%`, height: "100%", background: "linear-gradient(90deg, #e85d6a, #f59e8b)", borderRadius: 999 }} />
          </div>
          <div style={{ color: D.soluk, fontSize: 12, marginTop: 6 }}>
            Gezdiğin oran: %{yuzde}. Bir plakaya dokun → gittim / planla / rehberde aç.
          </div>
        </div>
      </div>

      {BOLGELER_TR.map((b) => {
        const iller = bolgeIlleri(b.id);
        const sayi = iller.filter((i) => gezilen.has(i.id)).length;
        const seciliBurada = secili && iller.some((i) => i.id === secili.id);
        return (
          <div key={b.id}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 8 }}>
              <span style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 16, fontWeight: 700 }}>{b.ikon} {b.ad}</span>
              <span style={{ color: sayi ? b.renk : D.silik, fontSize: 12, fontWeight: 900 }}>{sayi}/{iller.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 7 }}>
              {iller.map((i) => {
                const g = gezilen.has(i.id);
                const p = planli.has(i.id);
                const s = secili?.id === i.id;
                return (
                  <button key={i.id} type="button" onClick={() => setSecili(s ? null : i)} title={i.ad}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 7, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${s ? "#fff" : g ? b.renk : p ? D.plan + "88" : "rgba(201,180,143,.2)"}`,
                      background: g ? b.renk : p ? `${D.plan}1f` : "rgba(243,231,208,.03)",
                    }}>
                    <span style={{ flex: "0 0 auto", background: "#fff", color: "#111", borderRadius: 3, padding: "0 4px", fontSize: 10, fontWeight: 900, border: "1px solid #0003" }}>
                      {String(i.plaka).padStart(2, "0")}
                    </span>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: g ? "#fff" : D.soluk, fontSize: 11.5, fontWeight: g ? 900 : 600 }}>
                      {g ? "✓ " : p ? "📍 " : ""}{i.ad.replace(/ \(.*\)/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
            {seciliBurada ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 9, padding: "10px 12px", borderRadius: 12, border: `1px solid ${b.renk}66`, background: `${b.renk}14` }}>
                <span style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 15, fontWeight: 700, flex: "1 1 120px" }}>{secili.ad}</span>
                {!gezilen.has(secili.id) ? (
                  <button type="button" onClick={() => isaretle(secili, "gidildi")} style={{ border: "none", background: D.gittim, color: "#0c1a10", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}>✓ Gittim</button>
                ) : (
                  <span style={{ color: D.gittim, fontSize: 12.5, fontWeight: 800 }}>✓ Gezildi — düzenlemek için Pasaport</span>
                )}
                {!gezilen.has(secili.id) && !planli.has(secili.id) ? (
                  <button type="button" onClick={() => isaretle(secili, "plan")} style={{ border: `1px solid ${D.plan}`, background: "transparent", color: D.plan, borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}>📍 Planla</button>
                ) : null}
                <button type="button" onClick={() => onIl?.(secili.id)} style={{ border: `1px solid ${D.cizgi}`, background: "transparent", color: D.altin, borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Rehberde aç →</button>
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ color: D.silik, fontSize: 11.5, fontFamily: SERIF, fontStyle: "italic", textAlign: "center" }}>
        Gittiğin bir Türkiye turu, rotadaki tüm illeri otomatik olarak yakar.
      </div>
    </div>
  );
}

// ======================= 4) HAYAL PANOSU ====================================

function HayalPanosu({ hayaller, onGuncelle, onSil, onPlanla, onAc }) {
  const buYil = new Date().getFullYear();
  const yillar = [...new Set(hayaller.map((h) => num(h.hedefYil) || buYil + 1))].sort((a, b) => a - b);

  if (!hayaller.length) {
    return <BosSayfa ikon="✨" renk={D.hayal} baslik="Panon boş"
      metin="Bu yıl değil ama bir gün mutlaka gideceğin yerleri 'Deftere yaz → Hayalim' ile buraya iğnele. Zamanı gelince tek dokunuşla takvime taşırsın." />;
  }

  return (
    <div style={{
      borderRadius: 18, padding: "16px 14px",
      background: "radial-gradient(circle at 20% 10%, #3a2a1a, #251a10 70%)",
      border: "8px solid #3e2a17", boxShadow: "inset 0 0 30px rgba(0,0,0,.45)",
      display: "grid", gap: 20,
    }}>
      {yillar.map((yil) => (
        <div key={yil}>
          <div style={{ display: "inline-block", fontFamily: SERIF, color: "#2a1c10", background: "#f6d98b", padding: "3px 14px", borderRadius: 3, fontSize: 15, fontWeight: 700, transform: "rotate(-1.5deg)", marginBottom: 14, boxShadow: "0 3px 8px rgba(0,0,0,.35)" }}>
            {yil <= buYil ? `${yil} — zamanı geldi` : yil}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
            {hayaller.filter((h) => (num(h.hedefYil) || buYil + 1) === yil).map((h) => (
              <Kartpostal key={h.id} hayal={h} onGuncelle={(d) => onGuncelle(h.id, d)} onSil={() => onSil(h.id)} onPlanla={() => onPlanla(h)} onAc={() => onAc(h)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Kartpostal({ hayal, onGuncelle, onSil, onPlanla, onAc }) {
  const y = yerCoz(hayal);
  const [duzen, setDuzen] = useState(false);
  return (
    <div style={{ position: "relative", background: "#fbf5e8", borderRadius: 4, padding: 8, boxShadow: "0 8px 18px rgba(0,0,0,.45)", transform: `rotate(${egim(hayal.id, 3)}deg)` }}>
      <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 22, filter: "drop-shadow(0 2px 2px rgba(0,0,0,.4))" }}>📌</span>
      <div style={{ position: "relative", height: 112, borderRadius: 2, overflow: "hidden", background: `linear-gradient(135deg, ${y.renk}, ${y.renk}66)` }}>
        {y.gorsel ? <img src={y.gorsel} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 40 }}>{y.bayrak}</div>
        )}
        <span style={{ position: "absolute", left: 8, bottom: 6, fontFamily: SERIF, color: "#fff", fontSize: 13, fontStyle: "italic", textShadow: "0 1px 4px rgba(0,0,0,.8)" }}>Selamlar,</span>
      </div>
      <div style={{ padding: "8px 4px 2px", color: "#2a1c10" }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{y.ad}</div>
        <div style={{ fontSize: 11.5, color: "#7a5f40", marginTop: 2 }}>{y.bayrak} {y.alt}</div>
        {duzen ? (
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            <input value={hayal.hedefYil || ""} inputMode="numeric" onChange={(e) => onGuncelle({ hedefYil: num(e.target.value.replace(/[^\d]/g, "").slice(0, 4)) })}
              style={{ height: 32, borderRadius: 6, border: "1px solid #c9b48f", padding: "0 8px", background: "#fff", color: "#2a1c10", fontSize: 13 }} placeholder="Yıl" />
            <textarea value={hayal.not || ""} rows={2} onChange={(e) => onGuncelle({ not: e.target.value })} placeholder="Neden orası?"
              style={{ borderRadius: 6, border: "1px solid #c9b48f", padding: "6px 8px", background: "#fff", color: "#2a1c10", fontSize: 12.5, fontFamily: SERIF, fontStyle: "italic", resize: "vertical" }} />
          </div>
        ) : hayal.not ? (
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12.5, color: "#5a4630", marginTop: 6, lineHeight: 1.5 }}>“{hayal.not}”</div>
        ) : null}
        <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}>
          <button type="button" onClick={onPlanla} style={{ flex: "1 1 auto", border: "none", background: D.plan, color: "#fff", borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>🗓️ Planla</button>
          <button type="button" onClick={() => setDuzen((v) => !v)} style={{ border: "1px solid #c9b48f", background: "transparent", color: "#2a1c10", borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>{duzen ? "Tamam" : "✎"}</button>
          {y.tip !== "ozel" ? <button type="button" onClick={onAc} style={{ border: "1px solid #c9b48f", background: "transparent", color: "#2a1c10", borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>↗</button> : null}
          <button type="button" onClick={onSil} style={{ border: "1px solid #e8a3a3", background: "transparent", color: "#b04a4a", borderRadius: 6, padding: "6px 8px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function BosSayfa({ ikon, renk, baslik, metin }) {
  return (
    <div style={{
      textAlign: "center", padding: "34px 22px", borderRadius: 18, border: `1.5px dashed ${renk}66`,
      background: "repeating-linear-gradient(0deg, rgba(243,231,208,.02) 0 27px, rgba(231,184,92,.05) 27px 28px)",
    }}>
      <div style={{ fontSize: 34 }}>{ikon}</div>
      <div style={{ fontFamily: SERIF, color: D.murekkep, fontSize: 19, fontWeight: 700, marginTop: 8 }}>{baslik}</div>
      <div style={{ color: D.soluk, fontSize: 13, lineHeight: 1.65, marginTop: 7, maxWidth: 480, marginInline: "auto" }}>{metin}</div>
    </div>
  );
}
