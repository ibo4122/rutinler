"use client";

import { useMemo, useState } from "react";
import {
  AKTIVITE_SEVIYELERI, HEDEFLER, MAKRO_SABLONLARI, EGZERSIZLER, OGUNLER,
  bmrHesapla, tdeeHesapla, hedefKalori, haftalikDegisim, makroHesapla,
  bmiHesapla, idealKiloAraligi, yagOraniTahmin, yagYorumu, suIhtiyaci,
  egzersizKalori, hedefeSure, bugun, tarihAdi,
} from "../lib/saglikKoc";
import { BESIN_KATEGORILERI, besinAra, besinBul } from "../lib/besinler";
import { num, yeniId, satirInput, kucukBtn, Kutu, KutuIzgara, Alan, Izgara, Not, Buton } from "./panelUI";

// Sağlık Yönetimi.
//
// İki iş yapıyor:
//   1) Fitness koçu gibi hesaplıyor — BMR, TDEE, hedef kalori, makrolar,
//      vücut kompozisyonu, hedefe kalan süre.
//   2) Günlük tutuyor — ne yediğini öğün öğün kaydediyor, yakılanı düşüyor,
//      kalan kaloriyi ve makro dengesini gösteriyor.
//
// Tasarım kararı: profil olmadan günlük anlamsız, o yüzden ilk ekran profil.
// Profil tamamlanınca ekranın ağırlığı günlüğe kayıyor — çünkü hesap bir kez
// yapılır, günlük her gün tutulur.

const RENK = { ana: "#34d399", kalori: "#fbbf24", makro: "#a78bfa", gunluk: "#38bdf8", spor: "#fb7185" };

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

  // --- Hesaplar -------------------------------------------------------------
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

  // --- Günün toplamları ------------------------------------------------------
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
  // Zorunlu alanlar eksikse profil paneli her hâlükârda açık kalsın.
  const profilGoster = profilAcik || hesap.eksik;

  return (
    <section>
      <Baslik />

      {/* --- Profil ------------------------------------------------------------ */}
      <Kart
        baslik="Profilin" ikon="👤" renk={RENK.ana} acik={profilGoster} onToggle={hesap.eksik ? undefined : () => setProfilAcik((v) => !v)}
        aciklama="Hesabın tamamı bu altı bilgiye dayanıyor. Kilon değiştikçe burayı güncelle."
        sag={!hesap.eksik ? <span style={{ color: RENK.ana, fontWeight: 900, fontSize: 14 }}>{r0(hesap.hk.deger)} kcal/gün</span> : null}
      >
        <Izgara min={128}>
          <Alan label="Cinsiyet">
            <div style={{ display: "flex", gap: 6 }}>
              {[["erkek", "Erkek"], ["kadin", "Kadın"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => pDegis("cinsiyet", v)}
                  style={{
                    flex: 1, padding: "7px 4px", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
                    border: `1px solid ${profil.cinsiyet === v ? RENK.ana + "88" : "rgba(148,163,184,.22)"}`,
                    background: profil.cinsiyet === v ? `${RENK.ana}22` : "rgba(2,6,23,.5)",
                    color: profil.cinsiyet === v ? "#fff" : "#94a3b8",
                  }}>{l}</button>
              ))}
            </div>
          </Alan>
          <Alan label="Yaş"><SayiGiris deger={profil.yas} onChange={(v) => pDegis("yas", v)} birim="yıl" /></Alan>
          <Alan label="Boy"><SayiGiris deger={profil.boy} onChange={(v) => pDegis("boy", v)} birim="cm" /></Alan>
          <Alan label="Kilo"><SayiGiris deger={profil.kilo} onChange={(v) => pDegis("kilo", v)} birim="kg" ondalik /></Alan>
          <Alan label="Hedef kilo" hint="Opsiyonel — süre tahmini için">
            <SayiGiris deger={profil.hedefKilo} onChange={(v) => pDegis("hedefKilo", v)} birim="kg" ondalik />
          </Alan>
        </Izgara>

        <SecimIzgara
          baslik="Günlük hareket düzeyin"
          secenekler={AKTIVITE_SEVIYELERI.map((a) => ({ id: a.id, ad: a.ad, ikon: a.ikon, alt: a.aciklama, sag: "×" + a.carpan }))}
          aktif={profil.aktivite} onSec={(v) => pDegis("aktivite", v)} renk={RENK.ana} min={200}
        />

        <SecimIzgara
          baslik="Hedefin"
          secenekler={HEDEFLER.map((h) => ({ id: h.id, ad: h.ad, ikon: h.ikon, alt: h.aciklama, renk: h.renk }))}
          aktif={profil.hedef} onSec={(v) => pDegis("hedef", v)} renk={RENK.kalori} min={215}
        />

        <SecimIzgara
          baslik="Makro dağılımı"
          secenekler={MAKRO_SABLONLARI.map((m) => ({ id: m.id, ad: m.ad, ikon: m.ikon, alt: m.aciklama, sag: m.proteinGkg + " g/kg" }))}
          aktif={profil.makro} onSec={(v) => pDegis("makro", v)} renk={RENK.makro} min={215}
        />

        <details>
          <summary style={{ cursor: "pointer", color: "#94a3b8", fontSize: 12.5, fontWeight: 700, padding: "4px 0" }}>
            Vücut yağ oranı — mezurayla ölç, hesap daha isabetli olsun
          </summary>
          <div style={{ marginTop: 11, display: "grid", gap: 11 }}>
            <Izgara min={128}>
              <Alan label="Boyun çevresi"><SayiGiris deger={profil.boyun} onChange={(v) => pDegis("boyun", v)} birim="cm" ondalik /></Alan>
              <Alan label="Bel çevresi" hint="Göbek deliği hizası"><SayiGiris deger={profil.bel} onChange={(v) => pDegis("bel", v)} birim="cm" ondalik /></Alan>
              {profil.cinsiyet === "kadin" ? (
                <Alan label="Kalça çevresi"><SayiGiris deger={profil.kalca} onChange={(v) => pDegis("kalca", v)} birim="cm" ondalik /></Alan>
              ) : null}
              <Alan label="Yağ oranı" hint="Biliyorsan doğrudan yaz">
                <SayiGiris deger={profil.yagOrani} onChange={(v) => pDegis("yagOrani", v)} birim="%" ondalik
                  yerTutucu={hesap.yagTahmin ? r1(hesap.yagTahmin) : "—"} />
              </Alan>
            </Izgara>
            <Not tur="bilgi">
              <strong>US Navy yöntemi.</strong> Mezura dışında alet istemez ve ±%3 isabetlidir. Yağ oranını
              girersen BMR hesabı <strong>Katch-McArdle</strong> formülüne geçer — yağsız kütleye göre hesapladığı
              için kaslı kişilerde belirgin daha doğru sonuç verir.
            </Not>
          </div>
        </details>

        {hesap.eksik ? (
          <Not tur="uyari">Hesabın çalışması için <strong>yaş, boy ve kilo</strong> gerekiyor.</Not>
        ) : null}
      </Kart>

      {hesap.eksik ? null : (
        <>
          {/* --- Sonuçlar ----------------------------------------------------- */}
          <KutuIzgara min={162}>
            <Kutu etiket="Bazal Metabolizma" deger={`${r0(hesap.bmr.deger)} kcal`} renk="#60a5fa"
              alt={`${hesap.bmr.yontem} · hiç hareket etmesen bile yaktığın`} />
            <Kutu etiket="Günlük Harcama (TDEE)" deger={`${r0(hesap.tdee.deger)} kcal`} renk="#38bdf8"
              alt={`${hesap.tdee.aktivite.ad} · BMR × ${String(hesap.tdee.aktivite.carpan).replace(".", ",")}`} />
            <Kutu etiket="Hedef Kalori" deger={`${r0(hesap.hk.deger)} kcal`} renk={RENK.kalori}
              alt={`${hesap.hk.hedef.ikon} ${hesap.hk.hedef.ad}`} />
            <Kutu etiket="Haftalık Değişim"
              deger={`${hesap.haftalik >= 0 ? "+" : ""}${r1(hesap.haftalik)} kg`}
              renk={Math.abs(hesap.haftalik) > 1 ? "#fb7185" : RENK.ana}
              alt={hesap.haftalik === 0 ? "Kilo sabit kalır" : hesap.haftalik < 0 ? "Beklenen kayıp" : "Beklenen artış"} />
            {hesap.bmi ? (
              <Kutu etiket="Vücut Kitle İndeksi" deger={r1(hesap.bmi.deger)} renk={hesap.bmi.renk} alt={hesap.bmi.sinif} />
            ) : null}
            <Kutu etiket="Su İhtiyacı" deger={`${r1(suIhtiyaci(profil.kilo))} L`} renk="#22d3ee"
              alt="Egzersiz günlerinde +0,5 L" />
          </KutuIzgara>

          {hesap.hk.kirpildi ? (
            <Not tur="uyari">
              <strong>Hedefin güvenli sınırın altındaydı.</strong> Seçtiğin açık {r0(hesap.hk.hamDeger)} kcal'a denk
              geliyordu; {profil.cinsiyet === "kadin" ? "kadınlarda" : "erkeklerde"} {hesap.hk.sinir} kcal altına inmek
              mikro besin eksikliği ve kas kaybı riski taşıdığı için hedef {r0(hesap.hk.deger)} kcal'a çekildi.
              Daha hızlı ilerlemek istiyorsan kaloriyi düşürmek yerine hareketi artır.
            </Not>
          ) : null}
          {Math.abs(hesap.haftalik) > 1 ? (
            <Not tur="uyari">
              Haftada {r1(Math.abs(hesap.haftalik))} kg değişim agresif. Sürdürülebilir aralık haftada
              vücut ağırlığının <strong>%0,5–1'i</strong> kadardır; bunun üstü kas kaybı ve yoyo riski demek.
            </Not>
          ) : null}

          <Kart baslik="Makro Hedeflerin" ikon="🍽️" renk={RENK.makro} acik
            aciklama={hesap.makro.sablon.aciklama}>
            <div style={{ display: "grid", gap: 11 }}>
              <MakroSatir ad="Protein" gram={hesap.makro.protein.gram} kcal={hesap.makro.protein.kcal}
                toplam={hesap.hk.deger} renk="#fb7185" not="Kas koruma ve tokluk" />
              <MakroSatir ad="Karbonhidrat" gram={hesap.makro.karb.gram} kcal={hesap.makro.karb.kcal}
                toplam={hesap.hk.deger} renk="#fbbf24" not="Antrenman yakıtı" />
              <MakroSatir ad="Yağ" gram={hesap.makro.yag.gram} kcal={hesap.makro.yag.kcal}
                toplam={hesap.hk.deger} renk="#a78bfa" not="Hormon üretimi · altına inme" />
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 4 }}>
              <Minik etiket="Lif hedefi" deger={`${hesap.makro.lif} g`} />
              {hesap.yag ? <Minik etiket="Vücut yağı" deger={`%${r1(hesap.yag)} · ${yagYorumu(profil.cinsiyet, hesap.yag)?.sinif || ""}`} /> : null}
              {hesap.bmr.yagsizKutle ? <Minik etiket="Yağsız kütle" deger={`${r1(hesap.bmr.yagsizKutle)} kg`} /> : null}
              {hesap.ideal ? <Minik etiket="İdeal kilo aralığı" deger={`${r1(hesap.ideal.alt)} – ${r1(hesap.ideal.ust)} kg`} /> : null}
            </div>
            {hesap.sure && !hesap.sure.uyumsuz ? (
              <Not tur="iyi">
                Bu tempoyla <strong>{r1(Math.abs(hesap.sure.fark))} kg</strong> değişim yaklaşık
                <strong> {Math.round(hesap.sure.hafta)} hafta</strong> sürer —
                yani {hesap.sure.tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} civarı.
              </Not>
            ) : hesap.sure?.uyumsuz ? (
              <Not tur="uyari">Hedef kilon ile seçtiğin hedef ters yönde. {num(profil.hedefKilo) < num(profil.kilo) ? "Kilo vermek" : "Kilo almak"} istiyorsan hedefini ona göre seç.</Not>
            ) : null}
          </Kart>

          {/* --- Günlük ------------------------------------------------------- */}
          <GunlukPanel
            tarih={tarih} setTarih={setTarih} gun={gun} onGun={gunDegis}
            hedefKcal={hedefKcal} toplam={gunToplam} kalan={kalan} makro={hesap.makro}
            kilo={num(profil.kilo)}
          />

          <HaftalikOzet gunler={kayit.gunler || {}} hedefKcal={hedefKcal} seciliTarih={tarih} onTarih={setTarih} />
        </>
      )}

      <Not tur="bilgi">
        Hesaplar Mifflin-St Jeor / Katch-McArdle, US Navy ve Compendium of Physical Activities MET değerleri gibi
        açık formüllere dayanır; besin değerleri USDA FoodData Central ve TürKomp verilerinden derlenmiştir.
        <strong> Bunlar tahmin aracıdır, tıbbi tavsiye değildir.</strong> Gerçek harcama kişiden kişiye %10–15
        sapar — doğru yol 2–3 hafta takip edip tartıdaki değişime göre kaloriyi ayarlamaktır.
      </Not>
    </section>
  );
}

function Baslik() {
  return (
    <header style={{
      position: "relative", overflow: "hidden", borderRadius: 20, marginBottom: 16,
      border: "1px solid rgba(52,211,153,.28)",
      background: "linear-gradient(130deg, rgba(52,211,153,.2), rgba(45,212,191,.1) 55%, rgba(2,6,23,.5))",
      padding: "20px 22px",
    }}>
      <div style={{ color: "#34d399", fontSize: 11.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>
        Sağlık Yönetimi
      </div>
      <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.2 }}>
        Kalori ve Beslenme Takibi
      </h2>
      <p style={{ color: "#cbd5e1", fontSize: 13.5, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 640 }}>
        Önce vücudunun gerçekte ne kadar yaktığını hesaplıyoruz, sonra ne yediğini gün gün tutuyoruz.
        <strong style={{ color: "#fff" }}> Bu ikisi arasındaki fark, her şeyi belirleyen tek sayı.</strong>
      </p>
    </header>
  );
}

function SayiGiris({ deger, onChange, birim, ondalik, yerTutucu }) {
  return (
    <span style={{ position: "relative", display: "block" }}>
      <input
        value={deger} inputMode={ondalik ? "decimal" : "numeric"} placeholder={yerTutucu || "0"}
        onChange={(e) => onChange(e.target.value.replace(ondalik ? /[^\d.,]/g : /[^\d]/g, ""))}
        style={{ ...satirInput, paddingRight: 38 }}
      />
      <span style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        color: "#64748b", fontSize: 11, fontWeight: 700, pointerEvents: "none",
      }}>{birim}</span>
    </span>
  );
}

function SecimIzgara({ baslik, secenekler, aktif, onSec, renk, min = 200 }) {
  return (
    <div>
      <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 8 }}>{baslik}</span>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 9 }}>
        {secenekler.map((s) => {
          const secili = s.id === aktif;
          const c = s.renk || renk;
          return (
            <button key={s.id} type="button" onClick={() => onSec(s.id)}
              style={{
                textAlign: "left", padding: "10px 12px", borderRadius: 13, cursor: "pointer",
                border: `1px solid ${secili ? c + "88" : "rgba(148,163,184,.2)"}`,
                background: secili ? `linear-gradient(120deg, ${c}2e, ${c}0c)` : "rgba(2,6,23,.4)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13 }}>{s.ikon} {s.ad}</span>
                {s.sag ? <span style={{ color: c, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>{s.sag}</span> : null}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{s.alt}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MakroSatir({ ad, gram, kcal, toplam, renk, not }) {
  const yuzde = toplam > 0 ? (kcal / toplam) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800 }}>{ad}
          <span style={{ color: "#64748b", fontWeight: 500, fontSize: 11, marginLeft: 7 }}>{not}</span>
        </span>
        <span style={{ color: renk, fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap" }}>
          {gram} g <span style={{ color: "#64748b", fontWeight: 600, fontSize: 11 }}>· {r0(kcal)} kcal · %{Math.round(yuzde)}</span>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, yuzde)}%`, height: "100%", background: `linear-gradient(90deg, ${renk}aa, ${renk})`, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function Minik({ etiket, deger }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span style={{ display: "block", color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{etiket}</span>
      <span style={{ display: "block", color: "#e2e8f0", fontSize: 13, fontWeight: 800, marginTop: 2 }}>{deger}</span>
    </span>
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
  const egzersizEkle = (e) => onGun({ ...gun, egzersizler: [...(gun.egzersizler || []), e] });
  const egzersizSil = (id) => onGun({ ...gun, egzersizler: (gun.egzersizler || []).filter((x) => x.id !== id) });

  const oran = hedefKcal > 0 ? Math.min(140, (toplam.net / hedefKcal) * 100) : 0;
  const durumRenk = kalan < -150 ? "#fb7185" : kalan < 120 ? "#34d399" : "#fbbf24";

  return (
    <Kart baslik="Günlük Beslenme" ikon="📒" renk={RENK.gunluk} acik
      aciklama="Yediğin her şeyi öğününe ekle; kalan kalorin ve makro dengen anında güncellensin."
      sag={
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); gunKaydir(-1); }}
            style={{ ...kucukBtn, border: "1px solid rgba(148,163,184,.3)", background: "rgba(2,6,23,.5)", color: "#cbd5e1" }}>‹</button>
          <span style={{ color: "#cbd5e1", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", minWidth: 150, textAlign: "center" }}>
            {tarih === bugun() ? "Bugün" : tarihAdi(tarih)}
          </span>
          <button type="button" onClick={(e) => { e.stopPropagation(); gunKaydir(1); }} disabled={tarih >= bugun()}
            style={{ ...kucukBtn, border: "1px solid rgba(148,163,184,.3)", background: "rgba(2,6,23,.5)", color: tarih >= bugun() ? "#334155" : "#cbd5e1" }}>›</button>
        </span>
      }
    >
      {/* Kalori durumu */}
      <div style={{
        border: `1px solid ${durumRenk}44`, background: `${durumRenk}0f`, borderRadius: 16, padding: "14px 15px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <span>
            <span style={{ color: durumRenk, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
              {kalan >= 0 ? r0(kalan) : "+" + r0(-kalan)}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 12.5, fontWeight: 700, marginLeft: 8 }}>
              {kalan >= 0 ? "kcal kaldı" : "kcal aşım"}
            </span>
          </span>
          <span style={{ color: "#94a3b8", fontSize: 11.5, textAlign: "right", lineHeight: 1.6 }}>
            {r0(toplam.kcal)} alındı − {r0(toplam.yakilan)} yakıldı<br />
            <span style={{ color: "#64748b" }}>hedef {r0(hedefKcal)} kcal</span>
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(0, Math.min(100, oran))}%`, height: "100%", background: `linear-gradient(90deg, ${durumRenk}99, ${durumRenk})`, borderRadius: 999 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 13 }}>
          <MakroMini ad="Protein" alinan={toplam.protein} hedef={makro.protein.gram} renk="#fb7185" />
          <MakroMini ad="Karbonhidrat" alinan={toplam.karb} hedef={makro.karb.gram} renk="#fbbf24" />
          <MakroMini ad="Yağ" alinan={toplam.yag} hedef={makro.yag.gram} renk="#a78bfa" />
        </div>
      </div>

      {/* Öğünler */}
      <div style={{ display: "grid", gap: 9 }}>
        {OGUNLER.map((o) => {
          const liste = (gun.ogunler || {})[o.id] || [];
          const oKcal = liste.reduce((s, x) => s + num(x.kcal), 0);
          const acik = acikOgun === o.id;
          return (
            <div key={o.id} style={{ border: `1px solid ${o.renk}33`, borderRadius: 14, overflow: "hidden", background: `${o.renk}08` }}>
              <button type="button" onClick={() => setAcikOgun(acik ? null : o.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  cursor: "pointer", border: "none", textAlign: "left",
                  background: `linear-gradient(120deg, ${o.renk}22, ${o.renk}08)`,
                }}>
                <span style={{ fontSize: 16, flex: "0 0 auto" }}>{o.ikon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: "#fff", fontWeight: 800, fontSize: 13.5 }}>{o.ad}</span>
                  <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 1 }}>
                    {liste.length ? `${liste.length} kayıt` : "Boş"} · önerilen ~{r0(hedefKcal * o.pay)} kcal
                  </span>
                </span>
                <span style={{ color: o.renk, fontWeight: 900, fontSize: 14, whiteSpace: "nowrap" }}>{r0(oKcal)} kcal</span>
                <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 16 }}>{acik ? "−" : "+"}</span>
              </button>

              {liste.length ? (
                <div style={{ padding: "4px 12px 0" }}>
                  {liste.map((x) => (
                    <div key={x.id} style={{
                      display: "flex", alignItems: "center", gap: 9, padding: "7px 0",
                      borderBottom: "1px solid rgba(255,255,255,.05)",
                    }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{x.ad}</span>
                        <span style={{ display: "block", color: "#64748b", fontSize: 10.5, marginTop: 1 }}>
                          {r0(x.gram)} g · P {r1(x.protein)} · K {r1(x.karb)} · Y {r1(x.yag)}
                        </span>
                      </span>
                      <span style={{ color: "#cbd5e1", fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap" }}>{r0(x.kcal)}</span>
                      <button type="button" onClick={() => ogunSil(o.id, x.id)} title="Sil"
                        style={{ ...kucukBtn, border: "1px solid rgba(248,113,113,.35)", background: "rgba(248,113,113,.1)", color: "#fb7185" }}>×</button>
                    </div>
                  ))}
                </div>
              ) : null}

              {acik ? <BesinEkle renk={o.renk} onEkle={(item) => ogunEkle(o.id, item)} /> : null}
            </div>
          );
        })}
      </div>

      {/* Egzersiz */}
      <EgzersizPanel gun={gun} kilo={kilo} onEkle={egzersizEkle} onSil={egzersizSil} />
    </Kart>
  );
}

function MakroMini({ ad, alinan, hedef, renk }) {
  const yuzde = hedef > 0 ? Math.min(100, (alinan / hedef) * 100) : 0;
  const asti = alinan > hedef * 1.1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700 }}>{ad}</span>
        <span style={{ color: asti ? "#fb7185" : renk, fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>
          {Math.round(alinan)} / {hedef} g
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ width: `${yuzde}%`, height: "100%", background: asti ? "#fb7185" : renk, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function BesinEkle({ renk, onEkle }) {
  const [terim, setTerim] = useState("");
  const [secili, setSecili] = useState(null);
  const [miktar, setMiktar] = useState("1");
  const [birim, setBirim] = useState("porsiyon");
  const [kategori, setKategori] = useState(null);

  const sonuclar = terim.trim().length >= 2 ? besinAra(terim) : [];
  const kategoriListesi = kategori
    ? (BESIN_KATEGORILERI.find((k) => k.id === kategori)?.besinler || []).map(([ad]) => besinBul(`${kategori}:${ad}`)).filter(Boolean)
    : [];
  const gosterilen = sonuclar.length ? sonuclar : kategoriListesi;

  const gram = secili
    ? (birim === "porsiyon" ? num(miktar) * secili.porsiyonGram : num(miktar))
    : 0;
  const hesapla = (alan) => (secili ? (secili[alan] * gram) / 100 : 0);

  const ekle = () => {
    if (!secili || gram <= 0) return;
    onEkle({
      id: yeniId(), besinId: secili.id, ad: secili.ad, gram,
      kcal: hesapla("kcal"), protein: hesapla("protein"), karb: hesapla("karb"), yag: hesapla("yag"),
    });
    setSecili(null); setTerim(""); setMiktar("1"); setBirim("porsiyon"); setKategori(null);
  };

  return (
    <div style={{ padding: "11px 12px", borderTop: `1px solid ${renk}22` }}>
      {!secili ? (
        <>
          <input
            value={terim} placeholder="Besin ara — örn: yoğurt, tavuk, pilav"
            onChange={(e) => { setTerim(e.target.value); setKategori(null); }}
            style={{ ...satirInput, marginBottom: 9 }}
          />
          {!terim.trim() ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
              {BESIN_KATEGORILERI.map((k) => (
                <button key={k.id} type="button" onClick={() => setKategori(kategori === k.id ? null : k.id)}
                  style={{
                    padding: "5px 10px", borderRadius: 999, cursor: "pointer", fontSize: 11, fontWeight: 700,
                    border: `1px solid ${kategori === k.id ? k.renk + "88" : "rgba(148,163,184,.2)"}`,
                    background: kategori === k.id ? `${k.renk}22` : "transparent",
                    color: kategori === k.id ? "#fff" : "#94a3b8", whiteSpace: "nowrap",
                  }}>{k.ikon} {k.ad}</button>
              ))}
            </div>
          ) : null}
          {gosterilen.length ? (
            <div style={{ maxHeight: 230, overflowY: "auto", display: "grid", gap: 4 }}>
              {gosterilen.map((b) => (
                <button key={b.id} type="button" onClick={() => setSecili(b)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                    padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(148,163,184,.14)", background: "rgba(2,6,23,.4)",
                  }}>
                  <span style={{ fontSize: 14, flex: "0 0 auto" }}>{b.ikon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{b.ad}</span>
                    <span style={{ display: "block", color: "#64748b", fontSize: 10, marginTop: 1 }}>
                      {b.porsiyonAd} ≈ {b.porsiyonGram} g · {b.kategoriAd}
                    </span>
                  </span>
                  <span style={{ color: b.renk, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>{b.kcal} <span style={{ fontSize: 9.5, color: "#64748b" }}>kcal/100g</span></span>
                </button>
              ))}
            </div>
          ) : terim.trim().length >= 2 ? (
            <div style={{ color: "#64748b", fontSize: 12, padding: "8px 2px", lineHeight: 1.6 }}>
              "{terim}" bulunamadı. Benzer bir besin seçip gramajı düzenleyebilir ya da paketteki değerlere göre
              en yakın kalemi kullanabilirsin.
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 16 }}>{secili.ikon}</span>
            <strong style={{ color: "#fff", fontSize: 13.5, flex: 1, minWidth: 0 }}>{secili.ad}</strong>
            <button type="button" onClick={() => setSecili(null)}
              style={{ ...kucukBtn, border: "1px solid rgba(148,163,184,.3)", background: "rgba(2,6,23,.5)", color: "#cbd5e1" }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr auto", gap: 8, alignItems: "end" }}>
            <Alan label="Miktar">
              <input value={miktar} inputMode="decimal"
                onChange={(e) => setMiktar(e.target.value.replace(/[^\d.,]/g, ""))} style={satirInput} />
            </Alan>
            <Alan label="Birim">
              <select value={birim} onChange={(e) => setBirim(e.target.value)} style={satirInput}>
                <option value="porsiyon">{secili.porsiyonAd} ({secili.porsiyonGram} g)</option>
                <option value="gram">gram</option>
              </select>
            </Alan>
            <Buton onClick={ekle} renk={renk} dolu>Ekle</Buton>
          </div>
          <div style={{
            display: "flex", gap: 14, flexWrap: "wrap", padding: "9px 11px", borderRadius: 11,
            background: "rgba(2,6,23,.5)", border: "1px solid rgba(255,255,255,.07)",
          }}>
            <Minik etiket="Toplam" deger={`${r0(gram)} g · ${r0(hesapla("kcal"))} kcal`} />
            <Minik etiket="Protein" deger={`${r1(hesapla("protein"))} g`} />
            <Minik etiket="Karb." deger={`${r1(hesapla("karb"))} g`} />
            <Minik etiket="Yağ" deger={`${r1(hesapla("yag"))} g`} />
          </div>
        </div>
      )}
    </div>
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
    <div style={{ border: `1px solid ${RENK.spor}33`, borderRadius: 14, overflow: "hidden", background: `${RENK.spor}08` }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        background: `linear-gradient(120deg, ${RENK.spor}22, ${RENK.spor}08)`,
      }}>
        <span style={{ fontSize: 16 }}>🔥</span>
        <span style={{ flex: 1, color: "#fff", fontWeight: 800, fontSize: 13.5 }}>Egzersiz</span>
        <span style={{ color: RENK.spor, fontWeight: 900, fontSize: 14 }}>−{r0(toplam)} kcal</span>
      </div>

      <div style={{ padding: "11px 12px", display: "grid", gap: 10 }}>
        {liste.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 9, borderBottom: "1px solid rgba(255,255,255,.05)", paddingBottom: 7 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", color: "#e2e8f0", fontSize: 12.5, fontWeight: 600 }}>{e.ad}</span>
              <span style={{ display: "block", color: "#64748b", fontSize: 10.5 }}>{e.dakika} dakika</span>
            </span>
            <span style={{ color: RENK.spor, fontWeight: 800, fontSize: 12.5 }}>−{r0(e.kcal)}</span>
            <button type="button" onClick={() => onSil(e.id)} title="Sil"
              style={{ ...kucukBtn, border: "1px solid rgba(248,113,113,.35)", background: "rgba(248,113,113,.1)", color: "#fb7185" }}>×</button>
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr auto", gap: 8, alignItems: "end" }}>
          <Alan label="Aktivite">
            <select value={tur} onChange={(e) => setTur(e.target.value)} style={satirInput}>
              {EGZERSIZLER.map((e) => <option key={e.ad} value={e.ad}>{e.ikon} {e.ad}</option>)}
            </select>
          </Alan>
          <Alan label="Süre (dk)">
            <input value={dakika} inputMode="numeric"
              onChange={(e) => setDakika(e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Buton renk={RENK.spor} dolu
            onClick={() => {
              if (!kilo || !num(dakika)) return;
              onEkle({ id: yeniId(), ad: `${secili.ikon} ${secili.ad}`, dakika: num(dakika), kcal: tahmin });
              setDakika("30");
            }}>Ekle</Buton>
        </div>
        <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.6 }}>
          {kilo ? <>Tahmin: <strong style={{ color: RENK.spor }}>{r0(tahmin)} kcal</strong> — {String(secili.met).replace(".", ",")} MET × {r1(kilo)} kg × {r1(num(dakika) / 60)} saat</> : "Kilonu girersen yakılan kalori hesaplanır."}
        </div>
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

  return (
    <Kart baslik="Son 7 Gün" ikon="📊" renk="#60a5fa" acik
      aciklama="Tek bir gün değil, haftalık ortalama belirleyicidir. Bir günün aşımı haftayı bozmaz; süreklilik bozar.">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 130 }}>
        {son7.map((g) => {
          const yuzde = (g.net / maxDeger) * 100;
          const asti = hedefKcal > 0 && g.net > hedefKcal * 1.05;
          const secili = g.iso === seciliTarih;
          return (
            <button key={g.iso} type="button" onClick={() => onTarih(g.iso)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                height: "100%", cursor: "pointer", background: "transparent", border: "none", padding: 0, gap: 4,
              }} title={`${tarihAdi(g.iso)} — ${r0(g.net)} kcal`}>
              <span style={{ color: secili ? "#fff" : "#64748b", fontSize: 9.5, fontWeight: 800 }}>{g.var ? r0(g.net) : ""}</span>
              <span style={{
                height: `${Math.max(2, yuzde)}%`, borderRadius: "5px 5px 0 0",
                background: !g.var ? "rgba(255,255,255,.07)" : asti ? "linear-gradient(180deg,#fb7185,#e11d48)" : "linear-gradient(180deg,#34d399,#10b981)",
                outline: secili ? "2px solid rgba(255,255,255,.35)" : "none", outlineOffset: -1,
              }} />
              <span style={{ color: secili ? "#fff" : "#64748b", fontSize: 10, fontWeight: 700 }}>{g.kisa}</span>
            </button>
          );
        })}
      </div>
      {hedefKcal > 0 ? (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 4 }}>
          <Minik etiket="Kayıtlı gün" deger={`${kayitli.length} / 7`} />
          <Minik etiket="Günlük ortalama" deger={kayitli.length ? `${r0(ortalama)} kcal` : "—"} />
          <Minik etiket="Hedefe fark" deger={kayitli.length ? `${ortalama > hedefKcal ? "+" : ""}${r0(ortalama - hedefKcal)} kcal` : "—"} />
          <Minik etiket="Haftalık tahmini etki"
            deger={kayitli.length ? `${(((ortalama - hedefKcal) * 7) / 7700) >= 0 ? "+" : ""}${r1(((ortalama - hedefKcal) * 7) / 7700)} kg` : "—"} />
        </div>
      ) : null}
    </Kart>
  );
}

function Kart({ baslik, ikon, aciklama, renk, acik = true, onToggle, sag, children }) {
  return (
    <section style={{ border: `1px solid ${renk}2e`, borderRadius: 18, overflow: "hidden", background: "rgba(2,6,23,.3)", marginBottom: 14 }}>
      <header
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
          padding: "12px 15px", background: `linear-gradient(120deg, ${renk}26, ${renk}0b)`,
          borderBottom: acik ? `1px solid ${renk}2e` : "none", cursor: onToggle ? "pointer" : "default",
        }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", color: "#fff", fontWeight: 900, fontSize: 15.5 }}>{ikon} {baslik}</span>
          {aciklama ? <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{aciklama}</span> : null}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
          {sag}
          {onToggle ? <span style={{ color: renk, fontWeight: 900, fontSize: 18 }}>{acik ? "−" : "+"}</span> : null}
        </span>
      </header>
      {acik ? <div style={{ padding: "14px 15px", display: "grid", gap: 14 }}>{children}</div> : null}
    </section>
  );
}
