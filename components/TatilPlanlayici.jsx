"use client";

import { useMemo, useState } from "react";
import {
  ULKELER, PARALAR, VIZE_TURLERI, KONAKLAMA_SEVIYELERI,
  YURTDISI_HARC, SIGORTA_GUNLUK,
} from "../lib/tatil";
import {
  num, tl, satirInput, Kutu, KutuIzgara, Bolum, Tablo,
  Alan, Izgara, Not, Sekmeler,
} from "./panelUI";

// Tatil Planlayıcı.
//
// Buradaki fikir: bir tatil bütçesi "ne kadar tutar" sorusuna uçak + otel
// toplayarak cevap vermez. Gerçek fatura dört yerden gelir — ulaşım,
// konaklama, günlük yaşam ve girişler — artı Türkiye'den çıkışa özel
// kalemler (vize, sigorta, çıkış harcı). Ekran hepsini ayrı ayrı gösterir,
// çünkü sürpriz hep unutulan kalemden çıkar.
//
// Gezilecek yerleri işaretledikçe bütçe canlı güncellenir: "bu müzeye
// girersem ne olur" sorusunun cevabı anında görünür.

const RENK = { ana: "#2dd4bf", butce: "#fbbf24", plan: "#a78bfa", yer: "#38bdf8" };

const anahtar = (u, s) => `${u}:${s}`;

export default function TatilPlanlayici({ data, setData }) {
  const kayit = data || {};
  const kurlar = { ...Object.fromEntries(Object.entries(PARALAR).map(([k, v]) => [k, v.kur])), ...(kayit.kurlar || {}) };

  const [ulkeId, setUlkeId] = useState(ULKELER[0].id);
  const aktifUlke = ULKELER.find((u) => u.id === ulkeId) || ULKELER[0];
  const [sehirId, setSehirId] = useState(aktifUlke.sehirler[0].id);
  const aktifSehir = aktifUlke.sehirler.find((s) => s.id === sehirId) || aktifUlke.sehirler[0];
  const [acik, setAcik] = useState({ ayar: true, butce: true, yerler: true, plan: true });
  const ac = (k) => setAcik((s) => ({ ...s, [k]: !s[k] }));

  const k = anahtar(aktifUlke.id, aktifSehir.id);
  const varsayilan = { kisi: 2, gun: aktifSehir.onerilenGun, seviye: "orta", secilen: [], alisveris: "", notlar: "" };
  const ayar = { ...varsayilan, ...((kayit.ayarlar || {})[k] || {}) };

  const ayarDegis = (alan, deger) =>
    setData((s) => ({
      ...(s || {}),
      ayarlar: { ...((s || {}).ayarlar || {}), [k]: { ...varsayilan, ...(((s || {}).ayarlar || {})[k] || {}), [alan]: deger } },
    }));

  const kurDegis = (kod, deger) =>
    setData((s) => ({ ...(s || {}), kurlar: { ...((s || {}).kurlar || {}), [kod]: num(deger) } }));

  const ulkeSec = (id) => {
    const u = ULKELER.find((x) => x.id === id);
    setUlkeId(id);
    if (u) setSehirId(u.sehirler[0].id);
  };

  const para = PARALAR[aktifUlke.para];
  const kur = num(kurlar[aktifUlke.para]) || para.kur;
  const vize = VIZE_TURLERI[aktifUlke.vize];
  // Yerel para → TL
  const yerelTL = (tutar) => num(tutar) * kur;
  const yerel = (tutar) => para.simge + Math.round(num(tutar)).toLocaleString("tr-TR");

  const kisi = Math.max(1, Math.round(num(ayar.kisi) || 1));
  const gun = Math.max(1, Math.round(num(ayar.gun) || 1));
  const gece = Math.max(1, gun - 1);
  // Oda başı iki kişi varsayımı: 3 kişi = 2 oda.
  const oda = Math.ceil(kisi / 2);

  const butce = useMemo(() => {
    const seviye = KONAKLAMA_SEVIYELERI.find((s) => s.id === ayar.seviye) || KONAKLAMA_SEVIYELERI[1];
    const geceFiyat = num(aktifSehir.konaklama[seviye.id]);

    const ucus = num(aktifSehir.ucusTL) * kisi;
    const vizeTL = (num(vize.ucret) * (num(kurlar[vize.para]) || PARALAR[vize.para].kur) + num(vize.hizmet)) * kisi;
    const sigorta = SIGORTA_GUNLUK * gun * kisi;
    const harc = YURTDISI_HARC * kisi;
    const konaklama = yerelTL(geceFiyat * gece * oda);
    const yemek = yerelTL(num(aktifSehir.gunluk.yemek) * gun * kisi);
    const ulasim = yerelTL(num(aktifSehir.gunluk.ulasim) * gun * kisi);
    const ekstra = yerelTL(num(aktifSehir.gunluk.ekstra) * gun * kisi);

    const secilenYerler = aktifSehir.gezilecek.filter((g) => (ayar.secilen || []).includes(g.ad));
    const girisYerel = secilenYerler.reduce((s, g) => s + num(g.ucret), 0);
    const girisler = yerelTL(girisYerel * kisi);

    const alisveris = num(ayar.alisveris);

    const araToplam = ucus + vizeTL + sigorta + harc + konaklama + yemek + ulasim + ekstra + girisler + alisveris;
    const pay = araToplam * 0.1;
    const toplam = araToplam + pay;

    return {
      seviye, geceFiyat, ucus, vizeTL, sigorta, harc, konaklama, yemek, ulasim, ekstra,
      girisler, girisYerel, secilenYerler, alisveris, araToplam, pay, toplam,
      kisiBasi: toplam / kisi, gunluk: toplam / gun,
    };
  }, [aktifSehir, ayar, kisi, gun, gece, oda, kur, kurlar, vize]);

  const yerSec = (ad) => {
    const liste = ayar.secilen || [];
    ayarDegis("secilen", liste.includes(ad) ? liste.filter((x) => x !== ad) : [...liste, ad]);
  };
  const hepsiniSec = () => {
    const hepsi = aktifSehir.gezilecek.map((g) => g.ad);
    ayarDegis("secilen", (ayar.secilen || []).length === hepsi.length ? [] : hepsi);
  };

  return (
    <section>
      <header style={{ marginBottom: 14 }}>
        <h2 style={{ color: "#fff", fontSize: 21, fontWeight: 900, margin: 0 }}>Tatil Planlaması</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "6px 0 0", lineHeight: 1.6 }}>
          Ülkeyi seç, kaç kişi kaç gün gideceğini yaz, gezmek istediğin yerleri işaretle —
          <strong style={{ color: "#cbd5e1" }}> günlük rota ve toplam bütçe anında oluşur.</strong>
        </p>
      </header>

      <Sekmeler
        secenekler={ULKELER.map((u) => ({ id: u.id, ad: u.ad, ikon: u.bayrak, renk: u.renk }))}
        aktif={ulkeId} onSec={ulkeSec}
      />

      {aktifUlke.sehirler.length > 1 ? (
        <Sekmeler
          secenekler={aktifUlke.sehirler.map((s) => ({ id: s.id, ad: s.ad, ikon: s.ikon, renk: aktifUlke.renk }))}
          aktif={sehirId} onSec={setSehirId}
        />
      ) : null}

      {/* --- Rota kimliği ---------------------------------------------------- */}
      <div style={{
        border: `1px solid ${aktifUlke.renk}44`, borderRadius: 18, padding: "15px 17px",
        background: `linear-gradient(130deg, ${aktifUlke.renk}22, rgba(2,6,23,.4))`, marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>{aktifSehir.ikon}</span>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 19 }}>{aktifSehir.ad}</span>
          <span style={{
            border: `1px solid ${aktifUlke.renk}66`, borderRadius: 999, padding: "3px 10px",
            color: aktifUlke.renk, fontSize: 11.5, fontWeight: 800,
          }}>{aktifUlke.bayrak} {aktifUlke.ad}</span>
          <span style={{
            border: "1px solid rgba(148,163,184,.25)", borderRadius: 999, padding: "3px 10px",
            color: "#94a3b8", fontSize: 11.5, fontWeight: 700,
          }}>Önerilen: {aktifSehir.onerilenGun} gün</span>
        </div>
        <p style={{ color: "#cbd5e1", fontSize: 13, margin: "0 0 9px", lineHeight: 1.65 }}>{aktifSehir.ozet}</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#94a3b8", fontSize: 11.5 }}>
          <span>🗓️ <strong style={{ color: "#cbd5e1" }}>En iyi zaman:</strong> {aktifSehir.enIyiZaman}</span>
          <span>🛂 <strong style={{ color: "#cbd5e1" }}>{vize.ad}</strong></span>
          <span>💱 <strong style={{ color: "#cbd5e1" }}>1 {para.simge} = {kur.toLocaleString("tr-TR")} ₺</strong></span>
        </div>
      </div>

      {/* --- Üst özet -------------------------------------------------------- */}
      <KutuIzgara>
        <Kutu etiket="Toplam Bütçe" deger={tl(butce.toplam)} renk={RENK.ana} alt={`${kisi} kişi · ${gun} gün · %10 acil pay dahil`} />
        <Kutu etiket="Kişi Başı" deger={tl(butce.kisiBasi)} renk="#60a5fa" alt="Her şey dahil" />
        <Kutu etiket="Günlük Maliyet" deger={tl(butce.gunluk)} renk="#a78bfa" alt="Toplam / gün" />
        <Kutu etiket="Gidiş Öncesi Ödenecek" deger={tl(butce.ucus + butce.vizeTL + butce.sigorta + butce.harc + butce.konaklama)} renk="#fb7185"
          alt="Uçak + vize + sigorta + harç + otel" />
        <Kutu etiket="Yanında Götüreceğin" deger={tl(butce.yemek + butce.ulasim + butce.ekstra + butce.girisler + butce.alisveris)} renk="#fbbf24"
          alt="Harcama + girişler + alışveriş" />
        <Kutu etiket="Seçilen Gezi Yeri" deger={`${butce.secilenYerler.length} / ${aktifSehir.gezilecek.length}`} renk={RENK.yer}
          alt={butce.girisYerel > 0 ? `Kişi başı ${yerel(butce.girisYerel)} giriş` : "Henüz seçim yok"} />
      </KutuIzgara>

      {/* --- Seyahat ayarları ------------------------------------------------ */}
      <Bolum baslik="Seyahat Ayarları" ikon="⚙️" renk={RENK.ana} acik={acik.ayar} onToggle={() => ac("ayar")}
        aciklama="Buradaki her değişiklik bütçeyi ve günlük planı anında yeniden hesaplar.">
        <Izgara min={140}>
          <Alan label="Kaç kişi" hint={`${oda} oda varsayıldı (2 kişi/oda)`}>
            <input value={ayar.kisi} inputMode="numeric"
              onChange={(e) => ayarDegis("kisi", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Alan label="Kaç gün" hint={`${gece} gece konaklama`}>
            <input value={ayar.gun} inputMode="numeric"
              onChange={(e) => ayarDegis("gun", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
          <Alan label={`Kur (1 ${para.simge} = ? ₺)`} hint={`${para.ad} · güncel kuru yaz`}>
            <input value={kurlar[aktifUlke.para]} inputMode="decimal"
              onChange={(e) => kurDegis(aktifUlke.para, e.target.value.replace(",", "."))} style={satirInput} />
          </Alan>
          <Alan label="Alışveriş / hediyelik (₺)" hint="Tamamen sana bağlı; bütçeye eklenir">
            <input value={ayar.alisveris} inputMode="numeric" placeholder="0"
              onChange={(e) => ayarDegis("alisveris", e.target.value.replace(/[^\d]/g, ""))} style={satirInput} />
          </Alan>
        </Izgara>

        <div>
          <span style={{ display: "block", color: "#cbd5e1", fontSize: 11.5, fontWeight: 700, marginBottom: 7 }}>Konaklama seviyesi</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 9 }}>
            {KONAKLAMA_SEVIYELERI.map((s) => {
              const secili = s.id === ayar.seviye;
              const fiyat = num(aktifSehir.konaklama[s.id]);
              return (
                <button key={s.id} type="button" onClick={() => ayarDegis("seviye", s.id)}
                  style={{
                    textAlign: "left", padding: "11px 12px", borderRadius: 13, cursor: "pointer",
                    border: `1px solid ${secili ? RENK.ana + "88" : "rgba(148,163,184,.22)"}`,
                    background: secili ? `linear-gradient(120deg, ${RENK.ana}2e, ${RENK.ana}0c)` : "rgba(2,6,23,.4)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13.5 }}>{s.ikon} {s.ad}</span>
                    <span style={{ color: RENK.ana, fontWeight: 900, fontSize: 13 }}>{yerel(fiyat)}</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 1.45 }}>{s.not}</div>
                  <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 3 }}>gece / oda · {tl(yerelTL(fiyat))}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Not tur="bilgi">
          <strong>{vize.ad}.</strong> {vize.not}
        </Not>
      </Bolum>

      {/* --- Bütçe tablosu ---------------------------------------------------- */}
      <Bolum baslik="Bütçe Dökümü" ikon="💰" renk={RENK.butce} acik={acik.butce} onToggle={() => ac("butce")}
        aciklama="Türkiye'den çıkış kalemleri dahil. Sürpriz hep burada unutulan satırdan çıkar."
        sag={<strong style={{ color: RENK.butce, fontSize: 16 }}>{tl(butce.toplam)}</strong>}>
        <Tablo
          renk={RENK.butce}
          minGenislik={480}
          basliklar={["Kalem", "Hesap", "Tutar (₺)"]}
          satirlar={[
            { hucreler: ["✈️ Uçak bileti (gidiş-dönüş)", `${kisi} kişi × ${tl(aktifSehir.ucusTL)}`, tl(butce.ucus)] },
            { hucreler: [`🛂 ${vize.ad}`, vize.ucret > 0 ? `${kisi} kişi × (${vize.ucret} ${vize.para} + ${tl(vize.hizmet)})` : `${kisi} kişi × ${tl(vize.hizmet)}`, tl(butce.vizeTL)] },
            { hucreler: ["🏥 Seyahat sağlık sigortası", `${gun} gün × ${kisi} kişi × ${tl(SIGORTA_GUNLUK)}`, tl(butce.sigorta)] },
            { hucreler: ["🧾 Yurt dışı çıkış harcı", `${kisi} kişi × ${tl(YURTDISI_HARC)}`, tl(butce.harc)] },
            { hucreler: [`🏨 Konaklama (${butce.seviye.ad})`, `${gece} gece × ${oda} oda × ${yerel(butce.geceFiyat)}`, tl(butce.konaklama)], vurgu: true },
            { hucreler: ["🍽️ Yemek", `${gun} gün × ${kisi} kişi × ${yerel(aktifSehir.gunluk.yemek)}`, tl(butce.yemek)] },
            { hucreler: ["🚇 Şehir içi ulaşım", `${gun} gün × ${kisi} kişi × ${yerel(aktifSehir.gunluk.ulasim)}`, tl(butce.ulasim)] },
            { hucreler: ["☕ Günlük ekstra (kahve, su, tuvalet)", `${gun} gün × ${kisi} kişi × ${yerel(aktifSehir.gunluk.ekstra)}`, tl(butce.ekstra)] },
            { hucreler: ["🎟️ Müze & giriş ücretleri", butce.secilenYerler.length ? `${butce.secilenYerler.length} yer × ${kisi} kişi` : "Aşağıdan seç", tl(butce.girisler)], vurgu: true },
            { hucreler: ["🛍️ Alışveriş & hediyelik", "Kendi girdiğin tutar", tl(butce.alisveris)] },
            { hucreler: ["🧯 Acil pay (%10)", "Gecikme, taksi, beklenmeyen", tl(butce.pay)], renk: "#94a3b8" },
            { hucreler: ["TOPLAM", `${kisi} kişi · ${gun} gün`, tl(butce.toplam)], vurgu: true, kalin: true, renk: RENK.butce },
            { hucreler: ["Kişi başı", "Toplam / kişi", tl(butce.kisiBasi)], kalin: true, renk: "#60a5fa" },
          ]}
          not={`Yerel fiyatlar ${para.ad} cinsindendir ve 1 ${para.simge} = ${kur} ₺ kuruyla çevrilmiştir. Kuru ve tutarları yukarıdan güncelleyebilirsin.`}
        />

        <Not tur="uyari">
          Uçak bileti bütçenin en oynak kalemi. Aynı rota 3 ay önceden alındığında {tl(aktifSehir.ucusTL * 0.6)} iken,
          son hafta {tl(aktifSehir.ucusTL * 1.8)} olabiliyor. Tarihi esnek tutabiliyorsan Salı–Çarşamba uçuşları
          hafta sonuna göre belirgin ucuz.
        </Not>
      </Bolum>

      {/* --- Gezilecek yerler --------------------------------------------------- */}
      <Bolum baslik="Gezilecek Yerler" ikon="🗺️" renk={RENK.yer} acik={acik.yerler} onToggle={() => ac("yerler")}
        aciklama="İşaretlediğin her yer bütçeye eklenir. Ücretsiz olanlar listeyi şişirmez ama plana girer."
        sag={
          <span onClick={(e) => { e.stopPropagation(); hepsiniSec(); }}
            style={{ border: `1px solid ${RENK.yer}66`, borderRadius: 10, padding: "5px 11px", color: RENK.yer, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
            {(ayar.secilen || []).length === aktifSehir.gezilecek.length ? "Seçimi temizle" : "Tümünü seç"}
          </span>
        }>
        <div style={{ display: "grid", gap: 8 }}>
          {aktifSehir.gezilecek.map((g) => {
            const secili = (ayar.secilen || []).includes(g.ad);
            const bedava = num(g.ucret) === 0;
            return (
              <button key={g.ad} type="button" onClick={() => yerSec(g.ad)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", width: "100%",
                  padding: "11px 13px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${secili ? RENK.yer + "77" : "rgba(148,163,184,.2)"}`,
                  background: secili ? `${RENK.yer}16` : "rgba(2,6,23,.38)",
                }}>
                <span style={{
                  flex: "0 0 auto", width: 20, height: 20, borderRadius: 6, marginTop: 1,
                  border: `1.5px solid ${secili ? RENK.yer : "rgba(148,163,184,.45)"}`,
                  background: secili ? RENK.yer : "transparent", color: "#04121f",
                  display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                }}>{secili ? "✓" : ""}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ color: "#fff", fontSize: 13.5 }}>{g.ad}</strong>
                    <span style={{ color: bedava ? "#34d399" : RENK.yer, fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" }}>
                      {bedava ? "Ücretsiz" : `${yerel(g.ucret)} · ${tl(yerelTL(g.ucret))}`}
                    </span>
                  </span>
                  <span style={{ display: "block", color: "#94a3b8", fontSize: 11.5, marginTop: 4, lineHeight: 1.5 }}>
                    ⏱ {g.sure} — {g.not}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Bolum>

      {/* --- Günlük plan -------------------------------------------------------- */}
      <Bolum baslik={`${aktifSehir.plan.length} Günlük Rota`} ikon="📍" renk={RENK.plan} acik={acik.plan} onToggle={() => ac("plan")}
        aciklama="Coğrafyaya göre kurulmuş sıra — aynı bölgedeki duraklar aynı güne toplanmış, yol kaybı en aza indirilmiş.">
        <div style={{ display: "grid", gap: 10 }}>
          {aktifSehir.plan.map((p) => (
            <div key={p.gun} style={{
              border: `1px solid ${RENK.plan}33`, borderRadius: 15, overflow: "hidden", background: `${RENK.plan}09`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 13px",
                background: `linear-gradient(120deg, ${RENK.plan}28, ${RENK.plan}0a)`, borderBottom: `1px solid ${RENK.plan}22`,
              }}>
                <span style={{
                  flex: "0 0 auto", width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center",
                  background: `${RENK.plan}30`, color: RENK.plan, fontWeight: 900, fontSize: 13,
                }}>{p.gun}</span>
                <strong style={{ color: "#fff", fontSize: 14.5 }}>{p.baslik}</strong>
              </div>
              <div style={{ padding: "11px 13px" }}>
                <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                  {p.duraklar.map((d, i) => (
                    <li key={i} style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.55 }}>{d}</li>
                  ))}
                </ol>
                <div style={{
                  marginTop: 10, borderLeft: `2px solid ${RENK.plan}66`, paddingLeft: 10,
                  color: "#94a3b8", fontSize: 11.5, lineHeight: 1.55,
                }}>
                  <strong style={{ color: RENK.plan }}>İpucu:</strong> {p.ipucu}
                </div>
              </div>
            </div>
          ))}
        </div>

        {gun !== aktifSehir.plan.length ? (
          <Not tur="uyari">
            Rota {aktifSehir.plan.length} gün için kurulmuş, sen {gun} gün seçtin.
            {gun > aktifSehir.plan.length
              ? ` Fazla ${gun - aktifSehir.plan.length} günü dinlenmeye, günübirlik bir çevre gezisine ya da en beğendiğin yere ikinci ziyarete ayır.`
              : ` ${aktifSehir.plan.length - gun} günü çıkarman gerekiyor — son günleri değil, en yorucu günü böl ve iki güne yay.`}
          </Not>
        ) : null}
      </Bolum>

      {/* --- İpuçları ve notlar -------------------------------------------------- */}
      <Bolum baslik="Bilmen Gerekenler" ikon="💡" renk="#34d399" acik>
        <div style={{ display: "grid", gap: 8 }}>
          {aktifSehir.ipuclari.map((i, idx) => (
            <div key={idx} style={{
              display: "flex", gap: 9, border: "1px solid rgba(52,211,153,.25)", background: "rgba(52,211,153,.08)",
              borderRadius: 12, padding: "10px 12px", color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.6,
            }}>
              <span style={{ flex: "0 0 auto", color: "#34d399", fontWeight: 900 }}>•</span>
              <span>{i}</span>
            </div>
          ))}
        </div>

        <Alan label="Kendi notların" hint="Rezervasyon numaraları, uçuş saatleri, kime hediye alınacak — buraya yaz, kaydedilir.">
          <textarea
            value={ayar.notlar} rows={4} placeholder="Örn: Kolosyum bileti 14 Mayıs 09:00 · otel onay no 4412 · anneme eşarp"
            onChange={(e) => ayarDegis("notlar", e.target.value)}
            style={{ ...satirInput, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </Alan>
      </Bolum>
    </section>
  );
}
