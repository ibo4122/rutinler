"use client";

import { useMemo, useRef, useState } from "react";
import {
  AKTIVITE_SEVIYELERI, HEDEFLER, MAKRO_SABLONLARI, OGUNLER,
  bmrHesapla, tdeeHesapla, hedefKalori, haftalikDegisim, makroHesapla,
  bmiHesapla, idealKiloAraligi, yagOraniTahmin, yagYorumu, suIhtiyaci,
  hedefeSure, bugun, tarihAdi,
} from "../lib/saglikKoc";
import { num } from "./panelUI";
import { GeriButon, useGeriAl } from "./GeriAl";
import { GunOzeti, GunAkordeon, BesinSayfasi, gunToplami, saatinOgunu, SAGLIK_CSS } from "./SaglikGunluk";

// Sağlık Yönetimi.
//
// Ekranın ana sorusu "bugün ne aldım?": en üstte büyük kalori sayısı ve makro
// kartları, hemen altında öğünler. Hedef/kalan bilgisi ikincil. Profil ve
// hesaplamalar (BMR, makro hedefleri) en üstte, kapalı bir satırdır (günlük
// kalori hedefi görünür); açılınca başında "← Geri" ile günlüğe dönülür.
// Profil eksikse açık gelir.
//
// Kullanıcı akışları ve ekran hiyerarşisi: docs/saglik-istanbul-akislar.md

const T = {
  ana: "#4ade80",
  koyu: "#15803d",
  enerji: "#fb923c",
  protein: "#60a5fa",
  karb: "#fbbf24",
  yag: "#a78bfa",
  su: "#7dd3fc",
  zemin: "rgba(4,24,14,.55)",
  kenar: "rgba(74,222,128,.22)",
};

const GORSELLER = {
  sebze: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Marketvegetables.jpg/1280px-Marketvegetables.jpg",
};

const bosProfil = {
  cinsiyet: "erkek", yas: "", boy: "", kilo: "", hedefKilo: "",
  aktivite: "hafif", hedef: "koru", makro: "dengeli",
  boyun: "", bel: "", kalca: "", yagOrani: "",
};

const r0 = (v) => Math.round(num(v)).toLocaleString("tr-TR");
const r1 = (v) => num(v).toFixed(1).replace(".", ",");

export default function SaglikYonetimi({ data, setData }) {
  const geriAl = useGeriAl();
  const kayit = data || {};
  const profil = { ...bosProfil, ...(kayit.profil || {}) };
  const [tarih, setTarih] = useState(bugun());
  const [profilAcik, setProfilAcik] = useState(!kayit.profil);
  const [sayfa, setSayfa] = useState(null); // { mod, ogun, kayit?, kayitOgun? }
  const profilRef = useRef(null);

  const pDegis = (alan, deger) =>
    setData((s) => ({ ...(s || {}), profil: { ...bosProfil, ...((s || {}).profil || {}), [alan]: deger } }));

  const gun = (kayit.gunler || {})[tarih] || { ogunler: {}, egzersizler: [] };
  const gunDegis = (yeni) =>
    setData((s) => ({ ...(s || {}), gunler: { ...((s || {}).gunler || {}), [tarih]: yeni } }));

  // Ekleme ve düzenleme her zaman güncel günün üzerinden yapılır (sayfa açıkken
  // başka bir kayıt eklenmiş olabilir).
  const kayitlariEkle = (ogunId, items) => {
    if (!items.length) return;
    geriAl.etiketle(items.length === 1 ? `${items[0].ad} eklendi` : `${items.length} yiyecek eklendi`);
    setData((s) => {
      const gunler = (s || {}).gunler || {};
      const g = gunler[tarih] || { ogunler: {}, egzersizler: [] };
      return { ...(s || {}), gunler: { ...gunler, [tarih]: { ...g, ogunler: { ...(g.ogunler || {}), [ogunId]: [...((g.ogunler || {})[ogunId] || []), ...items] } } } };
    });
  };
  const kaydiGuncelle = (eskiOgun, yeniOgun, x) => {
    geriAl.etiketle("Kayıt güncellendi");
    setData((s) => {
      const gunler = (s || {}).gunler || {};
      const g = gunler[tarih] || { ogunler: {}, egzersizler: [] };
      const og = { ...(g.ogunler || {}) };
      if (eskiOgun === yeniOgun || (yeniOgun === "ara1" && eskiOgun === "ara2")) {
        og[eskiOgun] = (og[eskiOgun] || []).map((y) => (y.id === x.id ? x : y));
      } else {
        og[eskiOgun] = (og[eskiOgun] || []).filter((y) => y.id !== x.id);
        og[yeniOgun] = [...(og[yeniOgun] || []), x];
      }
      return { ...(s || {}), gunler: { ...gunler, [tarih]: { ...g, ogunler: og } } };
    });
  };
  const suEkle = () => {
    geriAl.etiketle("+250 ml su eklendi");
    gunDegis({ ...gun, su: num(gun.su) + 250 });
  };

  const hesap = useMemo(() => {
    const yagTahmin = yagOraniTahmin({
      cinsiyet: profil.cinsiyet, boy: profil.boy,
      boyun: profil.boyun, bel: profil.bel, kalca: profil.kalca,
    });
    const yag = num(profil.yagOrani) > 0 ? num(profil.yagOrani) : yagTahmin;
    const bmr = bmrHesapla({ ...profil, yagOrani: yag });
    if (!bmr) return { eksik: true, yagTahmin, yag };
    const tdee = tdeeHesapla(bmr.deger, profil.aktivite);
    const hk = hedefKalori({ tdee: tdee.deger, hedefId: profil.hedef, cinsiyet: profil.cinsiyet });
    const haftalik = haftalikDegisim(hk.deger, tdee.deger);
    const makro = makroHesapla({ kalori: hk.deger, kilo: profil.kilo, sablonId: profil.makro, yagOrani: yag });
    const bmi = bmiHesapla(profil.kilo, profil.boy);
    const ideal = idealKiloAraligi(profil.boy);
    const sure = num(profil.hedefKilo) > 0
      ? hedefeSure({ mevcutKilo: profil.kilo, hedefKilo: profil.hedefKilo, haftalikKg: haftalik })
      : null;
    return { eksik: false, bmr, tdee, hk, haftalik, makro, bmi, ideal, sure, yag, yagTahmin };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(profil)]);

  const toplam = useMemo(() => gunToplami(gun), [gun]);
  const hedefKcal = hesap.eksik ? 0 : hesap.hk.deger;
  const profilGoster = profilAcik || hesap.eksik;

  const profilKarti = (
    <div ref={profilRef}>
      <Kart
        baslik="Profil & Hedefler" ikon="👤"
        aciklama={hesap.eksik ? "Kalori hedefini hesaplamak için yaş, boy ve kilonu gir. Kayıt eklemek için beklemen gerekmez." : "Hesabın tamamı bu bilgilere dayanıyor. Kilon değiştikçe güncelle."}
        acik={profilGoster} onToggle={hesap.eksik ? undefined : () => setProfilAcik((v) => !v)}
        sag={!hesap.eksik ? <span style={{ color: T.ana, fontWeight: 900, fontSize: 15 }}>{r0(hesap.hk.deger)} kcal/gün</span> : null}
      >
        {!hesap.eksik ? (
          <div>
            <GeriButon onClick={() => { setProfilAcik(false); profilRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              etiket="Geri — günlüğe dön" />
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          <IkiliSecim label="Cinsiyet" deger={profil.cinsiyet} onChange={(v) => pDegis("cinsiyet", v)}
            secenekler={[["erkek", "♂ Erkek"], ["kadin", "♀ Kadın"]]} />
          <BuyukGiris label="Yaş" deger={profil.yas} onChange={(v) => pDegis("yas", v)} birim="yıl" adim={1} min={10} max={100} />
          <BuyukGiris label="Boy" deger={profil.boy} onChange={(v) => pDegis("boy", v)} birim="cm" adim={1} min={100} max={230} />
          <BuyukGiris label="Kilo" deger={profil.kilo} onChange={(v) => pDegis("kilo", v)} birim="kg" adim={0.5} ondalik min={30} max={300} />
          <BuyukGiris label="Hedef kilo" deger={profil.hedefKilo} onChange={(v) => pDegis("hedefKilo", v)} birim="kg" adim={0.5} ondalik min={30} max={300} ipucu="Opsiyonel" />
        </div>

        <KartSecim
          baslik="Günlük hareket düzeyin" renk={T.ana}
          secenekler={AKTIVITE_SEVIYELERI.map((a) => ({ id: a.id, ad: a.ad, ikon: a.ikon, alt: a.aciklama, rozet: "×" + String(a.carpan).replace(".", ",") }))}
          aktif={profil.aktivite} onSec={(v) => pDegis("aktivite", v)}
        />
        <KartSecim
          baslik="Hedefin" renk={T.enerji}
          secenekler={HEDEFLER.map((h) => ({ id: h.id, ad: h.ad, ikon: h.ikon, alt: h.aciklama, renk: h.renk }))}
          aktif={profil.hedef} onSec={(v) => pDegis("hedef", v)}
        />
        <KartSecim
          baslik="Makro dağılımı" renk={T.yag}
          secenekler={MAKRO_SABLONLARI.map((m) => ({ id: m.id, ad: m.ad, ikon: m.ikon, alt: m.aciklama, rozet: String(m.proteinGkg).replace(".", ",") + " g/kg" }))}
          aktif={profil.makro} onSec={(v) => pDegis("makro", v)}
        />

        <details>
          <summary style={{ cursor: "pointer", color: T.ana, fontSize: 13.5, fontWeight: 800, padding: "8px 0" }}>
            📏 Vücut yağ oranı — mezurayla ölç, hesap daha isabetli olsun
          </summary>
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              <BuyukGiris label="Boyun çevresi" deger={profil.boyun} onChange={(v) => pDegis("boyun", v)} birim="cm" adim={0.5} ondalik min={20} max={70} />
              <BuyukGiris label="Bel çevresi" deger={profil.bel} onChange={(v) => pDegis("bel", v)} birim="cm" adim={0.5} ondalik min={50} max={200} ipucu="Göbek deliği hizası" />
              {profil.cinsiyet === "kadin" ? (
                <BuyukGiris label="Kalça çevresi" deger={profil.kalca} onChange={(v) => pDegis("kalca", v)} birim="cm" adim={0.5} ondalik min={50} max={200} />
              ) : null}
              <BuyukGiris label="Yağ oranı" deger={profil.yagOrani} onChange={(v) => pDegis("yagOrani", v)} birim="%" adim={0.5} ondalik min={3} max={65}
                ipucu={hesap.yagTahmin ? `Ölçümden tahmin: %${r1(hesap.yagTahmin)}` : "Biliyorsan doğrudan yaz"} />
            </div>
            <Bilgi tur="bilgi">
              <strong>US Navy yöntemi.</strong> Mezura dışında alet istemez, ±%3 isabetlidir. Yağ oranını girersen
              BMR hesabı <strong>Katch-McArdle</strong> formülüne geçer; yağsız kütleye göre hesapladığı için
              kaslı kişilerde belirgin daha doğru sonuç verir.
            </Bilgi>
          </div>
        </details>

        {hesap.eksik ? (
          <Bilgi tur="uyari">Hesabın çalışması için <strong>yaş, boy ve kilo</strong> gerekiyor.</Bilgi>
        ) : (
          <>
            <SonucPaneli hesap={hesap} profil={profil} />
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <MakroHalka makro={hesap.makro} toplam={hesap.hk.deger} />
              <div style={{ flex: 1, minWidth: 230, display: "grid", gap: 13 }}>
                <MakroSatir ad="Protein" gram={hesap.makro.protein.gram} kcal={hesap.makro.protein.kcal}
                  toplam={hesap.hk.deger} renk={T.protein} not="Kas koruma ve tokluk" />
                <MakroSatir ad="Karbonhidrat" gram={hesap.makro.karb.gram} kcal={hesap.makro.karb.kcal}
                  toplam={hesap.hk.deger} renk={T.karb} not="Antrenman yakıtı" />
                <MakroSatir ad="Yağ" gram={hesap.makro.yag.gram} kcal={hesap.makro.yag.kcal}
                  toplam={hesap.hk.deger} renk={T.yag} not="Hormon üretimi · altına inme" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <Rozet etiket="Lif hedefi" deger={`${hesap.makro.lif} g`} ikon="🌾" />
              {hesap.yag ? <Rozet etiket="Vücut yağı" deger={`%${r1(hesap.yag)}`} alt={yagYorumu(profil.cinsiyet, hesap.yag)?.sinif} ikon="📏" /> : null}
              {hesap.bmr.yagsizKutle ? <Rozet etiket="Yağsız kütle" deger={`${r1(hesap.bmr.yagsizKutle)} kg`} ikon="💪" /> : null}
              {hesap.ideal ? <Rozet etiket="İdeal kilo aralığı" deger={`${r1(hesap.ideal.alt)}–${r1(hesap.ideal.ust)} kg`} ikon="⚖️" /> : null}
            </div>
            {hesap.sure && !hesap.sure.uyumsuz ? (
              <Bilgi tur="iyi">
                Bu tempoyla <strong>{r1(Math.abs(hesap.sure.fark))} kg</strong> değişim yaklaşık
                <strong> {Math.round(hesap.sure.hafta)} hafta</strong> sürer —
                yani {hesap.sure.tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} civarı.
              </Bilgi>
            ) : hesap.sure?.uyumsuz ? (
              <Bilgi tur="uyari">Hedef kilon ile seçtiğin hedef ters yönde. {num(profil.hedefKilo) < num(profil.kilo) ? "Kilo vermek" : "Kilo almak"} istiyorsan hedefini ona göre seç.</Bilgi>
            ) : null}
          </>
        )}
      </Kart>
    </div>
  );

  return (
    <section>
      <style dangerouslySetInnerHTML={{ __html: SAGLIK_CSS }} />

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "2px 2px 14px" }}>
        <div>
          <div style={{ color: T.ana, fontSize: 11, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" }}>Sağlık</div>
          <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "4px 0 0", lineHeight: 1.15 }}>Beslenme günlüğün</h2>
        </div>
      </div>

      {profilKarti}

      <GunOzeti tarih={tarih} setTarih={setTarih} toplam={toplam} hedefKcal={hedefKcal}
        makro={hesap.eksik ? null : hesap.makro} kilo={num(profil.kilo)}
        onEkle={() => setSayfa({ mod: "ara", ogun: saatinOgunu() })} />

      <div className="sg-hizli">
        <button type="button" className="sg-btn sg-btn-ana sg-btn-buyuk" onClick={() => setSayfa({ mod: "ara", ogun: saatinOgunu() })}>+ Besin ekle</button>
        <button type="button" className="sg-btn sg-btn-buyuk" onClick={() => setSayfa({ mod: "foto", ogun: saatinOgunu() })}>📷 Fotoğrafla</button>
        <button type="button" className="sg-btn sg-btn-su sg-btn-buyuk" onClick={suEkle}>💧 + Su</button>
      </div>

      <GunAkordeon gun={gun} onGun={gunDegis} hedefKcal={hedefKcal} kilo={num(profil.kilo)}
        onEkle={(ogun) => setSayfa({ mod: "ara", ogun })}
        onFoto={(ogun) => setSayfa({ mod: "foto", ogun })}
        onDuzenle={(ogunId, x) => setSayfa({ mod: "duzenle", ogun: ogunId, kayitOgun: ogunId, kayit: x })} />

      {!hesap.eksik ? (
        <HaftalikOzet gunler={kayit.gunler || {}} hedefKcal={hedefKcal} seciliTarih={tarih} onTarih={setTarih} />
      ) : null}


      {sayfa ? (
        <BesinSayfasi key={`${sayfa.mod}-${sayfa.kayit?.id || ""}`} durum={sayfa} gunler={kayit.gunler || {}}
          onKapat={() => setSayfa(null)} onEkle={kayitlariEkle} onGuncelle={kaydiGuncelle} />
      ) : null}
    </section>
  );
}

// ======================= PROFİL & HEDEFLER ===================================

function SonucPaneli({ hesap, profil }) {
  const kutular = [
    { etiket: "Bazal Metabolizma", deger: r0(hesap.bmr.deger), birim: "kcal", renk: "#60a5fa", ikon: "🫀", alt: `${hesap.bmr.yontem} · hiç hareket etmesen bile` },
    { etiket: "Günlük Harcama", deger: r0(hesap.tdee.deger), birim: "kcal", renk: T.su, ikon: "🔥", alt: `${hesap.tdee.aktivite.ad} · BMR × ${String(hesap.tdee.aktivite.carpan).replace(".", ",")}` },
    { etiket: "Hedef Kalori", deger: r0(hesap.hk.deger), birim: "kcal", renk: T.ana, ikon: "🎯", alt: `${hesap.hk.hedef.ikon} ${hesap.hk.hedef.ad}` },
    { etiket: "Haftalık Değişim", deger: `${hesap.haftalik >= 0 ? "+" : ""}${r1(hesap.haftalik)}`, birim: "kg", renk: Math.abs(hesap.haftalik) > 1 ? "#fb7185" : T.enerji, ikon: "📊", alt: hesap.haftalik === 0 ? "Kilo sabit kalır" : hesap.haftalik < 0 ? "Beklenen kayıp" : "Beklenen artış" },
    hesap.bmi ? { etiket: "Vücut Kitle İndeksi", deger: r1(hesap.bmi.deger), birim: "", renk: hesap.bmi.renk, ikon: "⚖️", alt: hesap.bmi.sinif } : null,
    { etiket: "Su İhtiyacı", deger: r1(suIhtiyaci(profil.kilo)), birim: "L", renk: T.su, ikon: "💧", alt: "Egzersiz günlerinde +0,5 L" },
  ].filter(Boolean);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(192px, 1fr))", gap: 12, marginBottom: 14 }}>
        {kutular.map((k) => (
          <div key={k.etiket} style={{
            border: `1px solid ${k.renk}33`, borderRadius: 17, padding: "15px 16px",
            background: `linear-gradient(145deg, ${k.renk}14, rgba(4,24,14,.5))`, minWidth: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <span style={{ fontSize: 17 }}>{k.ikon}</span>
              <span style={{ color: "#8fbfa3", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1.3 }}>{k.etiket}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ color: k.renk, fontSize: 29, fontWeight: 900, lineHeight: 1 }}>{k.deger}</span>
              {k.birim ? <span style={{ color: k.renk, fontSize: 13, fontWeight: 700, opacity: 0.75 }}>{k.birim}</span> : null}
            </div>
            <div style={{ color: "#5d8a70", fontSize: 10.5, marginTop: 7, lineHeight: 1.45 }}>{k.alt}</div>
          </div>
        ))}
      </div>

      {hesap.hk.kirpildi ? (
        <div style={{ marginBottom: 14 }}>
          <Bilgi tur="uyari">
            <strong>Hedefin güvenli sınırın altındaydı.</strong> Seçtiğin açık {r0(hesap.hk.hamDeger)} kcal'a denk
            geliyordu; {profil.cinsiyet === "kadin" ? "kadınlarda" : "erkeklerde"} {hesap.hk.sinir} kcal altına inmek
            mikro besin eksikliği ve kas kaybı riski taşıdığı için hedef {r0(hesap.hk.deger)} kcal'a çekildi.
            Daha hızlı ilerlemek istiyorsan kaloriyi düşürmek yerine hareketi artır.
          </Bilgi>
        </div>
      ) : null}
      {Math.abs(hesap.haftalik) > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <Bilgi tur="uyari">
            Haftada {r1(Math.abs(hesap.haftalik))} kg değişim agresif. Sürdürülebilir aralık haftada vücut
            ağırlığının <strong>%0,5–1'i</strong> kadardır; bunun üstü kas kaybı ve yoyo riski demek.
          </Bilgi>
        </div>
      ) : null}
    </>
  );
}

// ======================= GİRDİ BİLEŞENLERİ ==================================

// Büyük sayı girişi: iri rakam, yanlarda artı-eksi. Telefonla doldurulabilsin.
function BuyukGiris({ label, deger, onChange, birim, adim = 1, ondalik, min, max, ipucu }) {
  const [odak, setOdak] = useState(false);
  const kaydir = (yon) => {
    const mevcut = num(deger) || 0;
    let yeni = mevcut + yon * adim;
    if (min != null && yeni < min) yeni = min;
    if (max != null && yeni > max) yeni = max;
    onChange(ondalik ? String(Math.round(yeni * 10) / 10).replace(".", ",") : String(Math.round(yeni)));
  };
  const btn = {
    flex: "0 0 auto", width: 42, height: 42, borderRadius: 12, cursor: "pointer",
    border: `1px solid ${T.kenar}`, background: "rgba(4,24,14,.7)", color: T.ana,
    fontSize: 21, fontWeight: 900, lineHeight: 1, display: "grid", placeItems: "center",
  };
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
        <span style={{ color: "#b6e8c9", fontSize: 12.5, fontWeight: 800 }}>{label}</span>
        {ipucu ? <span style={{ color: "#5d8a70", fontSize: 10.5 }}>{ipucu}</span> : null}
      </span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => kaydir(-1)} style={btn} tabIndex={-1}>−</button>
        <span style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <input
            value={deger} inputMode={ondalik ? "decimal" : "numeric"} placeholder="0"
            onFocus={() => setOdak(true)} onBlur={() => setOdak(false)}
            onChange={(e) => onChange(e.target.value.replace(ondalik ? /[^\d.,]/g : /[^\d]/g, ""))}
            style={{
              width: "100%", minWidth: 0, height: 52, textAlign: "center",
              background: "rgba(2,20,12,.75)", borderRadius: 13,
              border: `1.5px solid ${odak ? T.ana + "99" : "rgba(74,222,128,.18)"}`,
              color: "#fff", fontSize: 22, fontWeight: 900, outline: "none",
              paddingRight: birim ? 30 : 0, letterSpacing: ".01em",
            }}
          />
          {birim ? (
            <span style={{
              position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
              color: "#5d8a70", fontSize: 12, fontWeight: 800, pointerEvents: "none",
            }}>{birim}</span>
          ) : null}
        </span>
        <button type="button" onClick={() => kaydir(1)} style={btn} tabIndex={-1}>+</button>
      </span>
    </label>
  );
}

function IkiliSecim({ label, deger, onChange, secenekler }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", color: "#b6e8c9", fontSize: 12.5, fontWeight: 800, marginBottom: 7 }}>{label}</span>
      <span style={{ display: "flex", gap: 8 }}>
        {secenekler.map(([v, l]) => {
          const s = deger === v;
          return (
            <button key={v} type="button" onClick={() => onChange(v)}
              style={{
                flex: 1, height: 52, borderRadius: 13, cursor: "pointer", fontSize: 15, fontWeight: 900,
                border: `1.5px solid ${s ? T.ana + "99" : "rgba(74,222,128,.18)"}`,
                background: s ? `linear-gradient(140deg, ${T.ana}2e, ${T.ana}0d)` : "rgba(2,20,12,.75)",
                color: s ? "#fff" : "#5d8a70",
              }}>{l}</button>
          );
        })}
      </span>
    </label>
  );
}

function KartSecim({ baslik, secenekler, aktif, onSec, renk }) {
  return (
    <div>
      <span style={{ display: "block", color: "#b6e8c9", fontSize: 12.5, fontWeight: 800, marginBottom: 9 }}>{baslik}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(228px, 1fr))", gap: 10 }}>
        {secenekler.map((s) => {
          const secili = s.id === aktif;
          const c = s.renk || renk;
          return (
            <button key={s.id} type="button" onClick={() => onSec(s.id)}
              style={{
                textAlign: "left", padding: "13px 14px", borderRadius: 15, cursor: "pointer",
                border: `1.5px solid ${secili ? c + "88" : "rgba(74,222,128,.14)"}`,
                background: secili ? `linear-gradient(140deg, ${c}2e, ${c}0a)` : "rgba(2,20,12,.6)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 14.5 }}>{s.ikon} {s.ad}</span>
                {s.rozet ? (
                  <span style={{
                    color: c, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
                    border: `1px solid ${c}44`, borderRadius: 999, padding: "2px 8px",
                  }}>{s.rozet}</span>
                ) : null}
              </div>
              <div style={{ color: "#7fae93", fontSize: 11.5, marginTop: 6, lineHeight: 1.55 }}>{s.alt}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================= MAKRO GÖRSELLERİ ===================================

function MakroHalka({ makro, toplam }) {
  const boyut = 160, r = 58, cevre = 2 * Math.PI * r;
  const dilimler = [
    { kcal: makro.protein.kcal, renk: T.protein },
    { kcal: makro.karb.kcal, renk: T.karb },
    { kcal: makro.yag.kcal, renk: T.yag },
  ];
  let offset = 0;
  return (
    <div style={{ position: "relative", width: boyut, height: boyut, flex: "0 0 auto" }}>
      <svg width={boyut} height={boyut} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="20" />
        {dilimler.map((d, i) => {
          const pay = toplam > 0 ? d.kcal / toplam : 0;
          const el = (
            <circle key={i} cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke={d.renk} strokeWidth="20"
              strokeDasharray={`${cevre * pay} ${cevre}`} strokeDashoffset={-cevre * offset} />
          );
          offset += pay;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{r0(toplam)}</div>
          <div style={{ color: "#8fbfa3", fontSize: 10, fontWeight: 700, marginTop: 3 }}>kcal/gün</div>
        </div>
      </div>
    </div>
  );
}

function MakroSatir({ ad, gram, kcal, toplam, renk, not }) {
  const yuzde = toplam > 0 ? (kcal / toplam) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ color: "#e2e8f0", fontSize: 13.5, fontWeight: 800 }}>{ad}
          <span style={{ color: "#5d8a70", fontWeight: 500, fontSize: 11, marginLeft: 8 }}>{not}</span>
        </span>
        <span style={{ color: renk, fontWeight: 900, fontSize: 16, whiteSpace: "nowrap" }}>
          {gram} g <span style={{ color: "#5d8a70", fontWeight: 600, fontSize: 11 }}>· {r0(kcal)} kcal · %{Math.round(yuzde)}</span>
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, yuzde)}%`, height: "100%", background: `linear-gradient(90deg, ${renk}99, ${renk})`, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function Rozet({ etiket, deger, alt, ikon }) {
  return (
    <div style={{
      border: "1px solid rgba(74,222,128,.14)", borderRadius: 14, padding: "11px 13px",
      background: "rgba(2,20,12,.5)", minWidth: 0,
    }}>
      <div style={{ color: "#5d8a70", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
        {ikon} {etiket}
      </div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{deger}</div>
      {alt ? <div style={{ color: "#7fae93", fontSize: 10.5, marginTop: 2 }}>{alt}</div> : null}
    </div>
  );
}

// ======================= GÜNLÜK =============================================

function HaftalikOzet({ gunler, hedefKcal, seciliTarih, onTarih }) {
  const son7 = useMemo(() => {
    const l = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const g = gunler[iso];
      let kcal = 0, yakilan = 0;
      if (g) {
        for (const o of OGUNLER) for (const x of g.ogunler?.[o.id] || []) kcal += num(x.kcal);
        yakilan = (g.egzersizler || []).reduce((s, e) => s + num(e.kcal), 0);
      }
      l.push({ iso, kisa: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][d.getDay()], net: kcal - yakilan, var: !!g });
    }
    return l;
  }, [gunler]);

  const kayitli = son7.filter((g) => g.var);
  const ortalama = kayitli.length ? kayitli.reduce((s, g) => s + g.net, 0) / kayitli.length : 0;
  const maxDeger = Math.max(hedefKcal * 1.3, ...son7.map((g) => g.net), 1);
  const hedefCizgi = hedefKcal > 0 ? (hedefKcal / maxDeger) * 100 : 0;

  return (
    <Kart baslik="Son 7 Gün" ikon="📈"
      aciklama="Tek bir gün değil, haftalık ortalama belirleyicidir. Bir günün aşımı haftayı bozmaz; süreklilik bozar.">
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 8, height: 150 }}>
        {hedefCizgi > 0 ? (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: `${hedefCizgi}%`, height: 0,
            borderTop: `1.5px dashed ${T.ana}66`, pointerEvents: "none",
          }}>
            <span style={{
              position: "absolute", right: 0, top: -17, color: T.ana, fontSize: 9.5, fontWeight: 800,
              background: "rgba(4,24,14,.85)", padding: "1px 6px", borderRadius: 5,
            }}>hedef {r0(hedefKcal)}</span>
          </div>
        ) : null}
        {son7.map((g) => {
          const yuzde = (g.net / maxDeger) * 100;
          const asti = hedefKcal > 0 && g.net > hedefKcal * 1.05;
          const secili = g.iso === seciliTarih;
          return (
            <button key={g.iso} type="button" onClick={() => onTarih(g.iso)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                height: "100%", cursor: "pointer", background: "transparent", border: "none", padding: 0, gap: 5,
              }} title={`${tarihAdi(g.iso)} — ${r0(g.net)} kcal`}>
              <span style={{ color: secili ? "#fff" : "#5d8a70", fontSize: 10, fontWeight: 900 }}>{g.var ? r0(g.net) : ""}</span>
              <span style={{
                height: `${Math.max(3, yuzde)}%`, borderRadius: "7px 7px 0 0",
                background: !g.var ? "rgba(255,255,255,.06)" : asti ? "linear-gradient(180deg,#fb7185,#be123c)" : `linear-gradient(180deg,${T.ana},${T.koyu})`,
                outline: secili ? `2px solid ${T.ana}` : "none", outlineOffset: 1,
              }} />
              <span style={{ color: secili ? "#fff" : "#5d8a70", fontSize: 11, fontWeight: 800 }}>{g.kisa}</span>
            </button>
          );
        })}
      </div>
      {hedefKcal > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Rozet etiket="Kayıtlı gün" deger={`${kayitli.length} / 7`} ikon="✅" />
          <Rozet etiket="Günlük ortalama" deger={kayitli.length ? `${r0(ortalama)} kcal` : "—"} ikon="📊" />
          <Rozet etiket="Hedefe fark" deger={kayitli.length ? `${ortalama > hedefKcal ? "+" : ""}${r0(ortalama - hedefKcal)} kcal` : "—"} ikon="🎯" />
          <Rozet etiket="Haftalık etki" deger={kayitli.length ? `${(((ortalama - hedefKcal) * 7) / 7700) >= 0 ? "+" : ""}${r1(((ortalama - hedefKcal) * 7) / 7700)} kg` : "—"} ikon="⚖️" />
        </div>
      ) : null}
    </Kart>
  );
}

// ======================= ORTAK KABUK ========================================

function Kart({ baslik, ikon, aciklama, acik = true, onToggle, sag, gorsel, children }) {
  return (
    <section style={{
      border: `1px solid ${T.kenar}`, borderRadius: 20, overflow: "hidden",
      background: T.zemin, marginBottom: 14,
    }}>
      <header
        onClick={onToggle}
        style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap", padding: "14px 16px",
          background: `linear-gradient(120deg, ${T.ana}1f, ${T.ana}07)`,
          borderBottom: acik ? `1px solid ${T.ana}22` : "none", cursor: onToggle ? "pointer" : "default",
        }}>
        {gorsel ? (
          <>
            <img src={gorsel} alt="" loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(4,24,14,.92), rgba(4,24,14,.55))" }} />
          </>
        ) : null}
        <span style={{ position: "relative", minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 16.5 }}>{ikon} {baslik}</span>
          {aciklama ? <span style={{ display: "block", color: "#8fbfa3", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{aciklama}</span> : null}
        </span>
        <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, flex: "0 0 auto" }}>
          {sag}
          {onToggle ? <span style={{ color: T.ana, fontWeight: 900, fontSize: 20 }}>{acik ? "−" : "+"}</span> : null}
        </span>
      </header>
      {acik ? <div style={{ padding: "16px", display: "grid", gap: 16 }}>{children}</div> : null}
    </section>
  );
}

function Bilgi({ tur = "bilgi", children }) {
  const renk = tur === "uyari" ? "#fbbf24" : tur === "iyi" ? T.ana : T.su;
  return (
    <div style={{
      border: `1px solid ${renk}44`, background: `${renk}12`, borderRadius: 13,
      padding: "12px 14px", color: "#e2e8f0", fontSize: 12.8, lineHeight: 1.65,
    }}>{children}</div>
  );
}
