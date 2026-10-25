"use client";

import { useMemo, useState } from "react";
import {
  AKTIVITE_SEVIYELERI, HEDEFLER, MAKRO_SABLONLARI, EGZERSIZLER, OGUNLER,
  bmrHesapla, tdeeHesapla, hedefKalori, haftalikDegisim, makroHesapla,
  bmiHesapla, idealKiloAraligi, yagOraniTahmin, yagYorumu, suIhtiyaci,
  egzersizKalori, hedefeSure, bugun, tarihAdi,
} from "../lib/saglikKoc";
import { KATEGORI_LISTESI, besinAra, kategoriBesinleri, BESIN_SAYISI } from "../lib/besinler";
import { num, yeniId } from "./panelUI";

// Sağlık Yönetimi — fitness teması.
//
// Finans alanı mavi-lacivert, tatil alanı turkuaz-fotoğraf. Burası bilinçli
// olarak ikisine de benzemiyor: lime-yeşil enerji, turuncu "yakılan", büyük
// halkalar ve iri rakamlar. Bir spor uygulaması gibi okunmalı, bir tablo gibi
// değil — çünkü buraya her gün girilecek, haftada bir değil.
//
// Girdiler kasıtlı olarak büyük: telefonla, mutfakta, ayaküstü doldurulacak.

const T = {
  ana: "#4ade80",       // lime-yeşil — ana vurgu
  koyu: "#15803d",
  enerji: "#fb923c",    // turuncu — yakılan kalori
  protein: "#f87171",
  karb: "#fbbf24",
  yag: "#a78bfa",
  su: "#38bdf8",
  zemin: "rgba(4,24,14,.55)",
  kenar: "rgba(74,222,128,.22)",
};

const GORSELLER = {
  hero: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1280px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
  sebze: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Marketvegetables.jpg/1280px-Marketvegetables.jpg",
  meyve: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/FruitArrangement.jpg/1280px-FruitArrangement.jpg",
  spor: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Small_group_fitness_sessions_bundall.jpg/500px-Small_group_fitness_sessions_bundall.jpg",
};

const bosProfil = {
  cinsiyet: "erkek", yas: "", boy: "", kilo: "", hedefKilo: "",
  aktivite: "hafif", hedef: "koru", makro: "dengeli",
  boyun: "", bel: "", kalca: "", yagOrani: "",
};

const r0 = (v) => Math.round(num(v)).toLocaleString("tr-TR");
const r1 = (v) => num(v).toFixed(1).replace(".", ",");

export default function SaglikYonetimi({ data, setData }) {
  const kayit = data || {};
  const profil = { ...bosProfil, ...(kayit.profil || {}) };
  const [tarih, setTarih] = useState(bugun());
  const [profilAcik, setProfilAcik] = useState(!kayit.profil);

  const pDegis = (alan, deger) =>
    setData((s) => ({ ...(s || {}), profil: { ...bosProfil, ...((s || {}).profil || {}), [alan]: deger } }));

  const gun = (kayit.gunler || {})[tarih] || { ogunler: {}, egzersizler: [] };
  const gunDegis = (yeni) =>
    setData((s) => ({ ...(s || {}), gunler: { ...((s || {}).gunler || {}), [tarih]: yeni } }));

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
  }, [profil]);

  const gunToplam = useMemo(() => {
    let kcal = 0, p = 0, k = 0, y = 0;
    for (const o of OGUNLER) {
      for (const item of gun.ogunler?.[o.id] || []) {
        kcal += num(item.kcal); p += num(item.protein); k += num(item.karb); y += num(item.yag);
      }
    }
    const yakilan = (gun.egzersizler || []).reduce((s, e) => s + num(e.kcal), 0);
    return { kcal, protein: p, karb: k, yag: y, yakilan, net: kcal - yakilan };
  }, [gun]);

  const hedefKcal = hesap.eksik ? 0 : hesap.hk.deger;
  const kalan = hedefKcal - gunToplam.net;
  const profilGoster = profilAcik || hesap.eksik;

  return (
    <section style={{ "--saglikAna": T.ana }}>
      <Hero hesap={hesap} toplam={gunToplam} hedefKcal={hedefKcal} kalan={kalan} />

      <Kart
        baslik="Profilin" ikon="👤" aciklama="Hesabın tamamı bu bilgilere dayanıyor. Kilon değiştikçe burayı güncelle."
        acik={profilGoster} onToggle={hesap.eksik ? undefined : () => setProfilAcik((v) => !v)}
        sag={!hesap.eksik ? <span style={{ color: T.ana, fontWeight: 900, fontSize: 15 }}>{r0(hesap.hk.deger)} kcal/gün</span> : null}
      >
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
        ) : null}
      </Kart>

      {hesap.eksik ? null : (
        <>
          <SonucPaneli hesap={hesap} profil={profil} />

          <Kart baslik="Makro Hedeflerin" ikon="🥗" aciklama={hesap.makro.sablon.aciklama} gorsel={GORSELLER.sebze}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, paddingTop: 4 }}>
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
          </Kart>

          <GunlukPanel
            tarih={tarih} setTarih={setTarih} gun={gun} onGun={gunDegis}
            hedefKcal={hedefKcal} toplam={gunToplam} kalan={kalan} makro={hesap.makro}
            kilo={num(profil.kilo)}
          />

          <HaftalikOzet gunler={kayit.gunler || {}} hedefKcal={hedefKcal} seciliTarih={tarih} onTarih={setTarih} />
        </>
      )}

      <VeriPaneli kayit={kayit} />
    </section>
  );
}

// ======================= ÜST BÖLÜM ==========================================

function Hero({ hesap, toplam, hedefKcal, kalan }) {
  return (
    <header style={{
      position: "relative", overflow: "hidden", borderRadius: 22, marginBottom: 16,
      border: `1px solid ${T.kenar}`, background: "rgba(4,24,14,.6)",
    }}>
      <img src={GORSELLER.hero} alt="" loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(115deg, rgba(4,24,14,.94) 20%, rgba(4,24,14,.75) 55%, rgba(4,24,14,.45))",
      }} />
      <div style={{
        position: "relative", display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap",
        padding: "22px 24px",
      }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ color: T.ana, fontSize: 11.5, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Sağlık Yönetimi
          </div>
          <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "9px 0 0", lineHeight: 1.15 }}>
            Kalori ve Beslenme Takibi
          </h2>
          <p style={{ color: "#b6e8c9", fontSize: 13.5, margin: "10px 0 0", lineHeight: 1.65, maxWidth: 480 }}>
            Önce vücudunun gerçekte ne kadar yaktığını hesaplıyoruz, sonra ne yediğini gün gün tutuyoruz.
            <strong style={{ color: "#fff" }}> Bu ikisi arasındaki fark, her şeyi belirleyen tek sayı.</strong>
          </p>
          {!hesap.eksik ? (
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
              <HeroRozet ikon="🔥" etiket="Günlük harcama" deger={`${r0(hesap.tdee.deger)} kcal`} />
              <HeroRozet ikon="🎯" etiket="Hedefin" deger={`${r0(hesap.hk.deger)} kcal`} renk={T.ana} />
              <HeroRozet ikon="📅" etiket="Haftalık" deger={`${hesap.haftalik >= 0 ? "+" : ""}${r1(hesap.haftalik)} kg`} />
            </div>
          ) : null}
        </div>
        {!hesap.eksik ? (
          <KaloriHalka hedef={hedefKcal} alinan={toplam.kcal} yakilan={toplam.yakilan} kalan={kalan} boyut={168} />
        ) : null}
      </div>
    </header>
  );
}

function HeroRozet({ ikon, etiket, deger, renk = "#cbd5e1" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 999,
      border: `1px solid ${renk}3a`, background: "rgba(2,20,12,.6)",
    }}>
      <span style={{ fontSize: 14 }}>{ikon}</span>
      <span style={{ color: "#8fbfa3", fontSize: 10.5, fontWeight: 700 }}>{etiket}</span>
      <strong style={{ color: renk, fontSize: 13.5, fontWeight: 900 }}>{deger}</strong>
    </span>
  );
}

// Kalori halkası — bu ekranın imzası. Dolu kısım alınan, taşma kırmızı.
function KaloriHalka({ hedef, alinan, yakilan, kalan, boyut = 150 }) {
  const net = alinan - yakilan;
  const oran = hedef > 0 ? net / hedef : 0;
  const r = boyut / 2 - 13;
  const cevre = 2 * Math.PI * r;
  const dolu = Math.min(1, Math.max(0, oran));
  const asim = Math.min(1, Math.max(0, oran - 1));
  const renk = oran > 1.05 ? "#fb7185" : oran > 0.85 ? T.ana : T.karb;

  return (
    <div style={{ position: "relative", width: boyut, height: boyut, flex: "0 0 auto" }}>
      <svg width={boyut} height={boyut} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="13" />
        {/* dolu=0 iken yuvarlak uç tek başına bir nokta bırakıyor; hiç çizme. */}
        {dolu > 0.001 ? (
          <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke={renk} strokeWidth="13" strokeLinecap="round"
            strokeDasharray={`${cevre * dolu} ${cevre}`} />
        ) : null}
        {asim > 0 ? (
          <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke="#ef4444" strokeWidth="13" strokeLinecap="round"
            strokeDasharray={`${cevre * asim} ${cevre}`} />
        ) : null}
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center",
      }}>
        <div>
          <div style={{ color: renk, fontSize: boyut > 155 ? 30 : 25, fontWeight: 900, lineHeight: 1 }}>
            {kalan >= 0 ? r0(kalan) : "+" + r0(-kalan)}
          </div>
          <div style={{ color: "#8fbfa3", fontSize: 10.5, fontWeight: 700, marginTop: 4 }}>
            {kalan >= 0 ? "kcal kaldı" : "kcal aşım"}
          </div>
          <div style={{ color: "#5d8a70", fontSize: 9.5, marginTop: 3 }}>
            {r0(alinan)} alındı{yakilan > 0 ? ` · ${r0(yakilan)} yakıldı` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function GunlukPanel({ tarih, setTarih, gun, onGun, hedefKcal, toplam, kalan, makro, kilo }) {
  const [acikOgun, setAcikOgun] = useState(null);
  const gunKaydir = (adim) => {
    const d = new Date(tarih + "T12:00:00");
    d.setDate(d.getDate() + adim);
    const yeni = d.toISOString().slice(0, 10);
    if (yeni <= bugun()) setTarih(yeni);
  };
  const ogunEkle = (ogunId, item) =>
    onGun({ ...gun, ogunler: { ...(gun.ogunler || {}), [ogunId]: [...((gun.ogunler || {})[ogunId] || []), item] } });
  const ogunSil = (ogunId, id) =>
    onGun({ ...gun, ogunler: { ...(gun.ogunler || {}), [ogunId]: ((gun.ogunler || {})[ogunId] || []).filter((x) => x.id !== id) } });

  const okBtn = (pasif) => ({
    flex: "0 0 auto", width: 36, height: 36, borderRadius: 11, cursor: pasif ? "default" : "pointer",
    border: `1px solid ${T.kenar}`, background: "rgba(4,24,14,.7)", color: pasif ? "#2d4a38" : T.ana,
    fontSize: 17, fontWeight: 900, display: "grid", placeItems: "center",
  });

  return (
    <Kart baslik="Günlük Beslenme" ikon="📒"
      aciklama="Yediğin her şeyi öğününe ekle; kalan kalorin ve makro dengen anında güncellensin."
      sag={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); gunKaydir(-1); }} style={okBtn(false)}>‹</button>
          <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 900, whiteSpace: "nowrap", minWidth: 158, textAlign: "center" }}>
            {tarih === bugun() ? "Bugün" : tarihAdi(tarih)}
          </span>
          <button type="button" onClick={(e) => { e.stopPropagation(); gunKaydir(1); }} disabled={tarih >= bugun()} style={okBtn(tarih >= bugun())}>›</button>
        </span>
      }
    >
      <div style={{
        display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
        border: `1px solid ${T.kenar}`, background: "rgba(2,20,12,.5)", borderRadius: 18, padding: "16px 18px",
      }}>
        <KaloriHalka hedef={hedefKcal} alinan={toplam.kcal} yakilan={toplam.yakilan} kalan={kalan} boyut={150} />
        <div style={{ flex: 1, minWidth: 220, display: "grid", gap: 12 }}>
          <MakroMini ad="Protein" alinan={toplam.protein} hedef={makro.protein.gram} renk={T.protein} />
          <MakroMini ad="Karbonhidrat" alinan={toplam.karb} hedef={makro.karb.gram} renk={T.karb} />
          <MakroMini ad="Yağ" alinan={toplam.yag} hedef={makro.yag.gram} renk={T.yag} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {OGUNLER.map((o) => {
          const liste = (gun.ogunler || {})[o.id] || [];
          const oKcal = liste.reduce((s, x) => s + num(x.kcal), 0);
          const acik = acikOgun === o.id;
          return (
            <div key={o.id} style={{ border: `1px solid ${o.renk}2e`, borderRadius: 16, overflow: "hidden", background: `${o.renk}08` }}>
              <button type="button" onClick={() => setAcikOgun(acik ? null : o.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                  cursor: "pointer", border: "none", textAlign: "left",
                  background: `linear-gradient(120deg, ${o.renk}24, ${o.renk}07)`,
                }}>
                <span style={{
                  flex: "0 0 auto", width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center",
                  background: `${o.renk}26`, fontSize: 19,
                }}>{o.ikon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 15 }}>{o.ad}</span>
                  <span style={{ display: "block", color: "#7fae93", fontSize: 11, marginTop: 2 }}>
                    {liste.length ? `${liste.length} kayıt` : "Boş"} · önerilen ~{r0(hedefKcal * o.pay)} kcal
                  </span>
                </span>
                <span style={{ color: o.renk, fontWeight: 900, fontSize: 17, whiteSpace: "nowrap" }}>{r0(oKcal)}</span>
                <span style={{
                  flex: "0 0 auto", width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center",
                  background: acik ? `${o.renk}2e` : "rgba(255,255,255,.06)", color: acik ? o.renk : "#7fae93",
                  fontWeight: 900, fontSize: 18,
                }}>{acik ? "−" : "+"}</span>
              </button>

              {liste.length ? (
                <div style={{ padding: "6px 14px 2px" }}>
                  {liste.map((x) => (
                    <div key={x.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                      borderBottom: "1px solid rgba(255,255,255,.05)",
                    }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", color: "#e2e8f0", fontSize: 13.5, fontWeight: 700 }}>{x.ad}</span>
                        <span style={{ display: "block", color: "#5d8a70", fontSize: 11, marginTop: 2 }}>
                          {r0(x.gram)} g · P {r1(x.protein)} · K {r1(x.karb)} · Y {r1(x.yag)}
                        </span>
                      </span>
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: 14.5, whiteSpace: "nowrap" }}>{r0(x.kcal)}</span>
                      <button type="button" onClick={() => ogunSil(o.id, x.id)} title="Sil"
                        style={{
                          flex: "0 0 auto", width: 32, height: 32, borderRadius: 10, cursor: "pointer",
                          border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.1)",
                          color: "#fb7185", fontSize: 17, fontWeight: 900,
                        }}>×</button>
                    </div>
                  ))}
                </div>
              ) : null}

              {acik ? <BesinEkle renk={o.renk} onEkle={(item) => ogunEkle(o.id, item)} /> : null}
            </div>
          );
        })}
      </div>

      <EgzersizPanel gun={gun} kilo={kilo}
        onEkle={(e) => onGun({ ...gun, egzersizler: [...(gun.egzersizler || []), e] })}
        onSil={(id) => onGun({ ...gun, egzersizler: (gun.egzersizler || []).filter((x) => x.id !== id) })} />
    </Kart>
  );
}

function MakroMini({ ad, alinan, hedef, renk }) {
  const yuzde = hedef > 0 ? Math.min(100, (alinan / hedef) * 100) : 0;
  const asti = alinan > hedef * 1.1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
        <span style={{ color: "#b6e8c9", fontSize: 12, fontWeight: 800 }}>{ad}</span>
        <span style={{ color: asti ? "#fb7185" : renk, fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>
          {Math.round(alinan)} <span style={{ color: "#5d8a70", fontSize: 11, fontWeight: 700 }}>/ {hedef} g</span>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ width: `${yuzde}%`, height: "100%", background: asti ? "#fb7185" : `linear-gradient(90deg, ${renk}99, ${renk})`, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// Besin arama — ilk harften itibaren sonuç gösterir, kategori gezinmesi de var.
function BesinEkle({ renk, onEkle }) {
  const [terim, setTerim] = useState("");
  const [secili, setSecili] = useState(null);
  const [miktar, setMiktar] = useState("1");
  const [birim, setBirim] = useState("porsiyon");
  const [kategori, setKategori] = useState(null);

  const sonuclar = terim.trim().length >= 1 ? besinAra(terim, 60) : [];
  const kategoriListesi = kategori ? kategoriBesinleri(kategori).slice(0, 120) : [];
  const gosterilen = sonuclar.length ? sonuclar : kategoriListesi;

  const gram = secili ? (birim === "porsiyon" ? num(miktar) * secili.porsiyonGram : num(miktar)) : 0;
  const hesapla = (alan) => (secili ? (secili[alan] * gram) / 100 : 0);

  const ekle = () => {
    if (!secili || gram <= 0) return;
    onEkle({
      id: yeniId(), besinId: secili.id,
      ad: secili.marka ? `${secili.ad} (${secili.marka})` : secili.ad,
      gram, kcal: hesapla("kcal"), protein: hesapla("protein"), karb: hesapla("karb"), yag: hesapla("yag"),
    });
    setSecili(null); setTerim(""); setMiktar("1"); setBirim("porsiyon"); setKategori(null);
  };

  if (secili) {
    return (
      <div style={{ padding: "13px 14px", borderTop: `1px solid ${renk}22`, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 19 }}>{secili.ikon}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", color: "#fff", fontSize: 15 }}>{secili.ad}</strong>
            <span style={{ display: "block", color: "#5d8a70", fontSize: 11, marginTop: 2 }}>
              {secili.marka ? secili.marka + " · " : ""}{secili.kcal} kcal/100 g · {secili.kategoriAd}
            </span>
          </span>
          <button type="button" onClick={() => setSecili(null)}
            style={{ width: 34, height: 34, borderRadius: 11, cursor: "pointer", border: `1px solid ${T.kenar}`, background: "rgba(4,24,14,.7)", color: "#b6e8c9", fontSize: 17, fontWeight: 900 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <BuyukGiris label="Miktar" deger={miktar} onChange={setMiktar} adim={birim === "gram" ? 10 : 0.5} ondalik min={0} />
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={{ display: "block", color: "#b6e8c9", fontSize: 12.5, fontWeight: 800, marginBottom: 7 }}>Birim</span>
            <select value={birim} onChange={(e) => setBirim(e.target.value)}
              style={{
                width: "100%", height: 52, borderRadius: 13, padding: "0 12px",
                background: "rgba(2,20,12,.75)", border: `1.5px solid rgba(74,222,128,.18)`,
                color: "#fff", fontSize: 14.5, fontWeight: 700, outline: "none",
              }}>
              <option value="porsiyon">{secili.porsiyonAd} ({secili.porsiyonGram} g)</option>
              <option value="gram">gram</option>
            </select>
          </label>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 10,
          padding: "12px 14px", borderRadius: 14, background: `${renk}12`, border: `1px solid ${renk}33`,
        }}>
          <Ozet etiket="Toplam" deger={`${r0(gram)} g`} />
          <Ozet etiket="Kalori" deger={`${r0(hesapla("kcal"))}`} renk={renk} buyuk />
          <Ozet etiket="Protein" deger={`${r1(hesapla("protein"))} g`} />
          <Ozet etiket="Karb." deger={`${r1(hesapla("karb"))} g`} />
          <Ozet etiket="Yağ" deger={`${r1(hesapla("yag"))} g`} />
        </div>

        <button type="button" onClick={ekle}
          style={{
            height: 50, borderRadius: 14, cursor: "pointer", border: "none",
            background: `linear-gradient(120deg, ${renk}, ${renk}bb)`, color: "#07140d",
            fontSize: 15.5, fontWeight: 900,
          }}>
          Öğüne Ekle · {r0(hesapla("kcal"))} kcal
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "13px 14px", borderTop: `1px solid ${renk}22` }}>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          value={terim} placeholder="Besin ara — yoğurt, tavuk, pilav, gofret…"
          onChange={(e) => { setTerim(e.target.value); setKategori(null); }}
          style={{
            width: "100%", height: 52, borderRadius: 14, padding: "0 44px 0 42px",
            background: "rgba(2,20,12,.75)", border: `1.5px solid rgba(74,222,128,.2)`,
            color: "#fff", fontSize: 15.5, fontWeight: 600, outline: "none",
          }}
        />
        <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
        {terim ? (
          <button type="button" onClick={() => setTerim("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, borderRadius: 9, cursor: "pointer", border: "none", background: "rgba(255,255,255,.08)", color: "#b6e8c9", fontSize: 15, fontWeight: 900 }}>×</button>
        ) : null}
      </div>

      {!terim.trim() ? (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
          {KATEGORI_LISTESI.map((k) => (
            <button key={k.id} type="button" onClick={() => setKategori(kategori === k.id ? null : k.id)}
              style={{
                padding: "8px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
                border: `1px solid ${kategori === k.id ? k.renk + "88" : "rgba(74,222,128,.16)"}`,
                background: kategori === k.id ? `${k.renk}24` : "rgba(2,20,12,.5)",
                color: kategori === k.id ? "#fff" : "#7fae93", whiteSpace: "nowrap",
              }}>{k.ikon} {k.ad}</button>
          ))}
        </div>
      ) : (
        <div style={{ color: "#5d8a70", fontSize: 11.5, marginBottom: 8 }}>
          {gosterilen.length ? `${gosterilen.length} sonuç` : "Sonuç yok"} · toplam {BESIN_SAYISI.toLocaleString("tr-TR")} besin
        </div>
      )}

      {gosterilen.length ? (
        <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 5 }}>
          {gosterilen.map((b) => (
            <button key={b.id} type="button" onClick={() => setSecili(b)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                padding: "11px 12px", borderRadius: 12,
                border: "1px solid rgba(74,222,128,.1)", background: "rgba(2,20,12,.5)",
              }}>
              <span style={{ fontSize: 17, flex: "0 0 auto" }}>{b.ikon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", color: "#e2e8f0", fontSize: 13.5, fontWeight: 700 }}>{b.ad}</span>
                <span style={{ display: "block", color: "#5d8a70", fontSize: 11, marginTop: 2 }}>
                  {b.marka ? <span style={{ color: "#7fae93", fontWeight: 700 }}>{b.marka} · </span> : null}
                  {b.porsiyonAd} ≈ {b.porsiyonGram} g · P{b.protein} K{b.karb} Y{b.yag}
                </span>
              </span>
              <span style={{ color: b.renk, fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", textAlign: "right" }}>
                {b.kcal}<br /><span style={{ fontSize: 9, color: "#5d8a70", fontWeight: 700 }}>kcal/100g</span>
              </span>
            </button>
          ))}
        </div>
      ) : terim.trim() ? (
        <div style={{ color: "#7fae93", fontSize: 12.5, padding: "10px 2px", lineHeight: 1.65 }}>
          "{terim}" bulunamadı. Benzer bir besin seçip gramajı düzenleyebilir ya da paketteki değerlere göre
          en yakın kalemi kullanabilirsin.
        </div>
      ) : null}
    </div>
  );
}

function Ozet({ etiket, deger, renk = "#fff", buyuk }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span style={{ display: "block", color: "#5d8a70", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{etiket}</span>
      <span style={{ display: "block", color: renk, fontSize: buyuk ? 20 : 15, fontWeight: 900, marginTop: 3, whiteSpace: "nowrap" }}>{deger}</span>
    </span>
  );
}

function EgzersizPanel({ gun, kilo, onEkle, onSil }) {
  const [tur, setTur] = useState(EGZERSIZLER[0].ad);
  const [dakika, setDakika] = useState("30");
  const liste = gun.egzersizler || [];
  const toplam = liste.reduce((s, e) => s + num(e.kcal), 0);
  const secili = EGZERSIZLER.find((e) => e.ad === tur) || EGZERSIZLER[0];
  const tahmin = egzersizKalori(secili.met, kilo, dakika);

  return (
    <div style={{ border: `1px solid ${T.enerji}33`, borderRadius: 16, overflow: "hidden", background: `${T.enerji}08` }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
        background: `linear-gradient(120deg, ${T.enerji}24, ${T.enerji}07)`,
      }}>
        <span style={{
          flex: "0 0 auto", width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center",
          background: `${T.enerji}26`, fontSize: 19,
        }}>🔥</span>
        <span style={{ flex: 1, color: "#fff", fontWeight: 900, fontSize: 15 }}>Egzersiz</span>
        <span style={{ color: T.enerji, fontWeight: 900, fontSize: 17 }}>−{r0(toplam)} kcal</span>
      </div>

      <div style={{ padding: "13px 14px", display: "grid", gap: 12 }}>
        {liste.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.05)", paddingBottom: 9 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", color: "#e2e8f0", fontSize: 13.5, fontWeight: 700 }}>{e.ad}</span>
              <span style={{ display: "block", color: "#5d8a70", fontSize: 11 }}>{e.dakika} dakika</span>
            </span>
            <span style={{ color: T.enerji, fontWeight: 900, fontSize: 14.5 }}>−{r0(e.kcal)}</span>
            <button type="button" onClick={() => onSil(e.id)} title="Sil"
              style={{ width: 32, height: 32, borderRadius: 10, cursor: "pointer", border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.1)", color: "#fb7185", fontSize: 17, fontWeight: 900 }}>×</button>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <label style={{ display: "block", minWidth: 0, gridColumn: "span 2" }}>
            <span style={{ display: "block", color: "#b6e8c9", fontSize: 12.5, fontWeight: 800, marginBottom: 7 }}>Aktivite</span>
            <select value={tur} onChange={(e) => setTur(e.target.value)}
              style={{
                width: "100%", height: 52, borderRadius: 13, padding: "0 12px",
                background: "rgba(2,20,12,.75)", border: "1.5px solid rgba(251,146,60,.22)",
                color: "#fff", fontSize: 14.5, fontWeight: 700, outline: "none",
              }}>
              {EGZERSIZLER.map((e) => <option key={e.ad} value={e.ad}>{e.ikon} {e.ad}</option>)}
            </select>
          </label>
          <BuyukGiris label="Süre" deger={dakika} onChange={setDakika} birim="dk" adim={5} min={0} max={600} />
        </div>

        <button type="button"
          onClick={() => {
            if (!kilo || !num(dakika)) return;
            onEkle({ id: yeniId(), ad: `${secili.ikon} ${secili.ad}`, dakika: num(dakika), kcal: tahmin });
            setDakika("30");
          }}
          style={{
            height: 50, borderRadius: 14, cursor: "pointer", border: "none",
            background: `linear-gradient(120deg, ${T.enerji}, ${T.enerji}bb)`, color: "#20100a",
            fontSize: 15.5, fontWeight: 900,
          }}>
          {kilo ? `Egzersizi Ekle · −${r0(tahmin)} kcal` : "Önce kilonu gir"}
        </button>
        {kilo ? (
          <div style={{ color: "#5d8a70", fontSize: 11, lineHeight: 1.6 }}>
            {String(secili.met).replace(".", ",")} MET × {r1(kilo)} kg × {r1(num(dakika) / 60)} saat
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

// ======================= VERİ SAKLAMA =======================================

function VeriPaneli({ kayit }) {
  const [acik, setAcik] = useState(false);
  const gunler = kayit.gunler || {};
  const gunSayisi = Object.keys(gunler).length;
  const kayitSayisi = Object.values(gunler).reduce((s, g) => {
    const o = Object.values(g.ogunler || {}).reduce((t, l) => t + (l?.length || 0), 0);
    return s + o + (g.egzersizler?.length || 0);
  }, 0);
  const tarihler = Object.keys(gunler).sort();

  const disaAktar = () => {
    try {
      const blob = new Blob([JSON.stringify({ disaAktarim: new Date().toISOString(), ...kayit }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `saglik-verilerim-${bugun()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
  };

  return (
    <section style={{ border: "1px solid rgba(74,222,128,.18)", borderRadius: 18, overflow: "hidden", background: "rgba(2,20,12,.45)", marginBottom: 14 }}>
      <button type="button" onClick={() => setAcik((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px",
          cursor: "pointer", border: "none", textAlign: "left", background: "transparent",
        }}>
        <span style={{ fontSize: 17 }}>🔐</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 14.5 }}>Verilerin nerede tutuluyor?</span>
          <span style={{ display: "block", color: "#7fae93", fontSize: 11.5, marginTop: 2 }}>
            {gunSayisi} gün · {kayitSayisi} kayıt · hesabına bağlı, buluta kaydediliyor
          </span>
        </span>
        <span style={{ color: T.ana, fontWeight: 900, fontSize: 18 }}>{acik ? "−" : "+"}</span>
      </button>

      {acik ? (
        <div style={{ padding: "4px 15px 15px", display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))", gap: 11 }}>
            <VeriKutu ikon="☁️" baslik="Bulut (ana kayıt)"
              metin="Supabase veritabanında, yalnızca senin hesabına bağlı tek bir satırda. Her değişiklikten ~0,7 saniye sonra otomatik kaydediliyor; başka bir cihazdan girdiğinde aynı veriyi görürsün." />
            <VeriKutu ikon="💾" baslik="Tarayıcı yedeği"
              metin="Aynı veri bu tarayıcıda da yedekleniyor. İnternet kesilirse kayıp olmaz; bulut boşsa yerel yedekten geri yüklenir. Yedek kullanıcıya özel anahtarda tutulur." />
            <VeriKutu ikon="👁️" baslik="Gizlilik"
              metin="Satır yalnızca senin kullanıcı kimliğinle okunabilir (RLS). Beslenme kaydın ne başka kullanıcılara ne de üçüncü taraflara gönderiliyor." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 11 }}>
            <Rozet etiket="Kayıtlı gün" deger={String(gunSayisi)} ikon="📅" />
            <Rozet etiket="Besin + egzersiz" deger={String(kayitSayisi)} ikon="🧾" />
            <Rozet etiket="İlk kayıt" deger={tarihler[0] ? tarihAdi(tarihler[0]).split(",")[0] : "—"} ikon="⏱" />
            <Rozet etiket="Son kayıt" deger={tarihler.length ? tarihAdi(tarihler[tarihler.length - 1]).split(",")[0] : "—"} ikon="🕐" />
          </div>

          <button type="button" onClick={disaAktar}
            style={{
              height: 46, borderRadius: 13, cursor: "pointer",
              border: `1px solid ${T.ana}55`, background: `${T.ana}18`, color: T.ana,
              fontSize: 13.5, fontWeight: 900,
            }}>
            ⬇ Tüm sağlık verimi JSON olarak indir
          </button>
        </div>
      ) : null}
    </section>
  );
}

function VeriKutu({ ikon, baslik, metin }) {
  return (
    <div style={{ border: "1px solid rgba(74,222,128,.14)", borderRadius: 14, padding: "12px 13px", background: "rgba(4,24,14,.5)" }}>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>{ikon} {baslik}</div>
      <div style={{ color: "#7fae93", fontSize: 11.5, marginTop: 6, lineHeight: 1.65 }}>{metin}</div>
    </div>
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
