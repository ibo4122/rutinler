"use client";

import { useMemo, useState } from "react";
import {
  STRATEJILER, kartFaizi, asgariOran, taksitAyristir, ayAdi,
  simule, karsilastir, saglikGostergeleri, SEVIYE_RENK, ortukFaiz,
} from "../lib/borc";
import {
  num, tl, yzd, yeniId, satirInput, kucukBtn, Kutu, KutuIzgara, Bolum, Tablo,
  Alan, Izgara, Not, BosDurum, Buton,
} from "./panelUI";

// Borç Planı ekranı.
//
// Tasarım kararı: burada AYRI bir borç listesi tutulmuyor. Gelir/Gider
// sekmesindeki krediler ve kart giderleri doğrudan buradan düzenleniyor —
// tek kayıt, tek gerçek. Bu ekran onların üzerine bir PLANLAMA katmanı koyuyor:
// faiz oranı, kapanış takvimi, strateji simülasyonu ve nakit akışı.
//
// Bir borç tablosu "ne kadar borcum var" der. Bu ekran "ne zaman biter,
// nasıl hızlandırırım, hangi sırayla ödersem ne kazanırım" sorusunu yanıtlar.

const RENK = {
  genel: "#60a5fa",
  kredi: "#a78bfa",
  kart: "#fb7185",
  strateji: "#34d399",
  takvim: "#38bdf8",
  akis: "#fbbf24",
};

export default function DebtPlanner({ credits, setCredits, financeTotals, plan, setPlan }) {
  const ayar = plan || {};
  const strateji = ayar.strateji || "cig";
  const kartKayitlari = Array.isArray(ayar.kartlar) ? ayar.kartlar : [];
  const gelir = Number(financeTotals?.totalIncome || 0);
  // Gelir/Gider sekmesinin kendi "aylık kalan" rakamı: gelir eksi tüm giderler
  // (kredi taksitleri dahil). Kart borcu ödemesi orada yoktur, burada düşülür.
  const aylikKalan = Number(financeTotals?.balance || 0);

  const [acik, setAcik] = useState({ tablo: true, strateji: true, takvim: true, akis: false });
  const ac = (k) => setAcik((s) => ({ ...s, [k]: !s[k] }));

  const guncelle = (alan, deger) => setPlan((s) => ({ ...(s || {}), [alan]: deger }));

  // --- Kayıtları plan motorunun anlayacağı biçime çevir ---------------------
  const borclar = useMemo(() => {
    const krediler = (credits || []).map((c) => {
      const t = taksitAyristir(c.installmentText);
      const bakiye = num(c.remainingDebt);
      const taksit = num(c.monthlyPayment);
      // Faiz girilmemişse taksit + kalan taksit + bakiye üçlüsünden çöz.
      const faiz = num(c.faiz) > 0 ? num(c.faiz) : (ortukFaiz(bakiye, taksit, t.kalan) ?? 0);
      // Kalan taksitlerin toplamı kalan borçtan küçükse veriler uyuşmuyor
      // demektir: ya taksit sayısı ya da kalan borç yanlış girilmiş.
      const tutarsiz = t.gecerli && t.kalan > 0 && taksit > 0 && taksit * t.kalan < bakiye;
      return {
        id: c.id, ad: c.title || "Adsız kredi", tur: "kredi",
        bakiye, taksit, aylikFaiz: faiz, limit: bakiye,
        kalanTaksit: t.gecerli ? t.kalan : null,
        taksitMetni: c.installmentText || "", faizOrtuk: !(num(c.faiz) > 0), tutarsiz,
      };
    });
    const kartlar = kartKayitlari.map((k) => {
      const bakiye = num(k.bakiye);
      const limit = num(k.limit) > 0 ? num(k.limit) : bakiye;
      const faiz = num(k.faiz) > 0 ? num(k.faiz) : kartFaizi(bakiye);
      const yasalAsgari = Math.max(bakiye * asgariOran(limit), bakiye > 0 ? 100 : 0);
      const odeme = num(k.odeme);
      return {
        id: k.id, ad: k.ad || "Adsız kart", tur: "kart",
        bakiye, taksit: odeme, aylikFaiz: faiz, limit,
        kalanTaksit: null, faizOrtuk: !(num(k.faiz) > 0),
        yasalAsgari, odemeGirildi: odeme > 0,
      };
    });
    return [...krediler, ...kartlar].filter((b) => b.bakiye > 0);
  }, [credits, kartKayitlari]);

  const krediler = borclar.filter((b) => b.tur === "kredi");
  const kartlar = borclar.filter((b) => b.tur === "kart");

  const ozet = useMemo(() => {
    const krediBorc = krediler.reduce((s, b) => s + b.bakiye, 0);
    const kartBorc = kartlar.reduce((s, b) => s + b.bakiye, 0);
    const kartLimit = kartlar.reduce((s, b) => s + b.limit, 0);
    const aylikTaksit = krediler.reduce((s, b) => s + b.taksit, 0);
    const kartAsgari = kartlar.reduce((s, b) => s + (b.odemeGirildi ? b.taksit : b.yasalAsgari), 0);
    const toplam = krediBorc + kartBorc;
    // Ağırlıklı ortalama aylık faiz: hangi borcun ne kadar "pahalı" olduğunu söyler.
    const agirlikliFaiz = toplam > 0 ? borclar.reduce((s, b) => s + b.aylikFaiz * b.bakiye, 0) / toplam : 0;
    const aylikFaizYuku = borclar.reduce((s, b) => s + (b.bakiye * b.aylikFaiz) / 100, 0);
    return { krediBorc, kartBorc, kartLimit, aylikTaksit, kartAsgari, toplam, agirlikliFaiz, aylikFaizYuku };
  }, [borclar, krediler, kartlar]);

  // Borca ayrılabilecek EK kapasite: kullanıcı yazmazsa gelirden zorunlu
  // yükler düşülerek önerilir.
  const onerilenKapasite = Math.max(0, aylikKalan - ozet.kartAsgari);
  const ekKapasite = ayar.ekKapasite === "" || ayar.ekKapasite == null ? onerilenKapasite : num(ayar.ekKapasite);

  const sonuc = useMemo(
    () => karsilastir(borclar, ekKapasite, strateji),
    [borclar, ekKapasite, strateji]
  );
  const diger = useMemo(() => {
    const alternatifId = strateji === "kartopu" ? "cig" : "kartopu";
    return { id: alternatifId, sonuc: simule({ borclar, ekKapasite, strateji: alternatifId }) };
  }, [borclar, ekKapasite, strateji]);

  const saglik = saglikGostergeleri({
    gelir,
    aylikTaksit: ozet.aylikTaksit + ozet.kartAsgari,
    toplamBorc: ozet.toplam,
    kartBorcu: ozet.kartBorc,
    kartLimiti: ozet.kartLimit,
  });

  // --- Satır düzenleyiciler --------------------------------------------------
  const krediDegis = (id, alan, deger) =>
    setCredits((liste) => liste.map((c) => (c.id === id ? { ...c, [alan]: deger } : c)));
  const kartDegis = (id, alan, deger) =>
    setPlan((s) => ({
      ...(s || {}),
      kartlar: (Array.isArray((s || {}).kartlar) ? s.kartlar : []).map((k) => (k.id === id ? { ...k, [alan]: deger } : k)),
    }));
  const kartEkle = () =>
    setPlan((s) => ({
      ...(s || {}),
      kartlar: [...(Array.isArray((s || {}).kartlar) ? s.kartlar : []), { id: yeniId(), ad: "", bakiye: "", limit: "", odeme: "", faiz: "" }],
    }));
  const kartSil = (id) =>
    setPlan((s) => ({
      ...(s || {}),
      kartlar: (Array.isArray((s || {}).kartlar) ? s.kartlar : []).filter((k) => k.id !== id),
    }));

  if (!borclar.length && !kartKayitlari.length) {
    return (
      <section style={{ display: "grid", gap: 14 }}>
        <Baslik />
        <BosDurum
          baslik="Henüz borç kaydın yok"
          aciklama="Krediler Gelir / Gider sekmesindeki kayıtlardan okunur — oraya kredilerini gir. Kredi kartı borçlarını ise buradan ekleyebilirsin; kart borcu aylık bir gider değil, eriyen bir bakiyedir ve ayrı izlenmesi gerekir."
          aksiyon={<Buton onClick={kartEkle} renk={RENK.kart} dolu>+ Kredi kartı borcu ekle</Buton>}
        />
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 0 }}>
      <Baslik />

      {/* --- Borçluluk tablosu --------------------------------------------- */}
      <KutuIzgara>
        <Kutu etiket="Toplam Borç" deger={tl(ozet.toplam)} renk={RENK.genel} alt={`${borclar.length} açık ürün`} />
        <Kutu etiket="Kredi Borcu" deger={tl(ozet.krediBorc)} renk={RENK.kredi}
          alt={ozet.toplam > 0 ? `Toplamdaki payı ${yzd((ozet.krediBorc / ozet.toplam) * 100)}` : "—"} />
        <Kutu etiket="Kart Borcu" deger={tl(ozet.kartBorc)} renk={RENK.kart}
          alt={ozet.toplam > 0 ? `Toplamdaki payı ${yzd((ozet.kartBorc / ozet.toplam) * 100)}` : "—"} />
        <Kutu etiket="Aylık Zorunlu Yük" deger={tl(ozet.aylikTaksit + ozet.kartAsgari)} renk="#f59e0b"
          alt={`Taksit ${tl(ozet.aylikTaksit)} + kart asgari ${tl(ozet.kartAsgari)}`} />
        <Kutu etiket="Aylık Faiz Maliyeti" deger={tl(ozet.aylikFaizYuku)} renk="#fb7185"
          alt={`Ortalama aylık ${yzd(ozet.agirlikliFaiz, 2)} · yılda ${tl(ozet.aylikFaizYuku * 12)}`} />
        <Kutu
          etiket="Borçsuzluk Tarihi"
          deger={sonuc.secili.bitti ? ayAdi(sonuc.secili.ay) : "30+ yıl"}
          renk={sonuc.secili.bitti ? RENK.strateji : "#fb7185"}
          alt={sonuc.secili.bitti ? `${sonuc.secili.ay} ay · seçili stratejiyle` : "Mevcut tempoda kapanmıyor"}
        />
      </KutuIzgara>

      {/* --- Sağlık yorumu -------------------------------------------------- */}
      <SaglikSeridi saglik={saglik} gelir={gelir} />

      {/* Zorunlu yük geliri aşıyorsa aşağıdaki hiçbir senaryo uygulanabilir
          değildir. Bunu en başta söylemek gerekir. */}
      {gelir > 0 && ozet.kartAsgari > aylikKalan ? (
        <div style={{ marginBottom: 14 }}>
          <Not tur="uyari">
            <strong>Kart ödemen aylık kalanını {tl(ozet.kartAsgari - aylikKalan)} aşıyor.</strong> Gelir / Gider'e göre
            tüm giderlerinden sonra elinde {tl(aylikKalan)} kalıyor; kartların için gereken aylık ödeme {tl(ozet.kartAsgari)}.
            Aşağıdaki senaryolar bu ödemeyi yapabildiğini varsayar — pratikte önce bu açığı kapatman gerekir:
            kart borcunu daha uzun vadeli bir ihtiyaç kredisine çevirmek, kredilerde vade uzatmak ya da bankayla
            yapılandırma görüşmek. Kartta sabit ve daha düşük bir ödeme yapıyorsan envanterdeki
            <em> “Aylık ödeyeceğin” </em> alanına onu yaz; hesap o zaman gerçek durumunu yansıtır.
          </Not>
        </div>
      ) : null}

      {/* --- Borç listesi (düzenlenebilir) ---------------------------------- */}
      <Bolum
        baslik="Borç Envanteri" ikon="📋" renk={RENK.genel} acik={acik.tablo} onToggle={() => ac("tablo")}
        aciklama="Bu kayıtlar Gelir / Gider sekmesiyle ortaktır — burada değiştirdiğin her şey orada da güncellenir."
        sag={<strong style={{ color: RENK.genel, fontSize: 15 }}>{tl(ozet.toplam)}</strong>}
      >
        {krediler.length ? (
          <div>
            <AltBaslik renk={RENK.kredi}>🏦 Krediler · {tl(ozet.krediBorc)}</AltBaslik>
            <div style={{ display: "grid", gap: 9 }}>
              {krediler.map((b) => {
                const kayit = credits.find((c) => c.id === b.id);
                return (
                  <BorcSatiri
                    key={b.id} borc={b} renk={RENK.kredi}
                    alanlar={[
                      { label: "Kalan borç", deger: kayit?.remainingDebt ?? "", onChange: (v) => krediDegis(b.id, "remainingDebt", v) },
                      { label: "Aylık taksit", deger: kayit?.monthlyPayment ?? "", onChange: (v) => krediDegis(b.id, "monthlyPayment", v) },
                      { label: "Taksit (8/24)", deger: kayit?.installmentText ?? "", onChange: (v) => krediDegis(b.id, "installmentText", v), metin: true },
                      {
                        label: "Aylık faiz %", deger: kayit?.faiz ?? "", onChange: (v) => krediDegis(b.id, "faiz", v), metin: true,
                        yerTutucu: b.faizOrtuk && b.aylikFaiz ? b.aylikFaiz.toFixed(2) : "—",
                      },
                    ]}
                    etiketler={[
                      b.kalanTaksit != null ? `${b.kalanTaksit} taksit kaldı` : "Taksit bilgisi eksik",
                      b.kalanTaksit ? `Doğal bitiş: ${ayAdi(b.kalanTaksit)}` : null,
                      b.faizOrtuk && b.aylikFaiz ? `Taksitten çözülen etkin aylık maliyet: ${yzd(b.aylikFaiz, 2)} (vergi ve fon dahil)` : null,
                      b.tutarsiz ? `⚠ ${b.kalanTaksit} × ${tl(b.taksit)} = ${tl(b.taksit * b.kalanTaksit)}, kalan borçtan az — taksit sayısını kontrol et` : null,
                    ]}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <AltBaslik renk={RENK.kart}>💳 Kredi Kartı Borçları · {tl(ozet.kartBorc)}</AltBaslik>
          <div style={{ display: "grid", gap: 9 }}>
            {kartKayitlari.map((kayit) => {
              const b = kartlar.find((x) => x.id === kayit.id) || {
                id: kayit.id, ad: kayit.ad || "Yeni kart", bakiye: 0, taksit: 0,
                aylikFaiz: kartFaizi(0), limit: 0, yasalAsgari: 0, odemeGirildi: false, faizOrtuk: true,
              };
              const kullanim = num(kayit.limit) > 0 ? (b.bakiye / num(kayit.limit)) * 100 : null;
              return (
                <BorcSatiri
                  key={kayit.id} borc={b} renk={RENK.kart}
                  adDegis={(v) => kartDegis(kayit.id, "ad", v)}
                  onSil={() => kartSil(kayit.id)}
                  alanlar={[
                    { label: "Güncel borç", deger: kayit.bakiye ?? "", onChange: (v) => kartDegis(kayit.id, "bakiye", v) },
                    { label: "Aylık ödeyeceğin", deger: kayit.odeme ?? "", onChange: (v) => kartDegis(kayit.id, "odeme", v), yerTutucu: b.yasalAsgari ? String(Math.round(b.yasalAsgari)) : "0" },
                    { label: "Kart limiti", deger: kayit.limit ?? "", onChange: (v) => kartDegis(kayit.id, "limit", v), yerTutucu: "Opsiyonel" },
                    {
                      label: "Aylık faiz %", deger: kayit.faiz ?? "", onChange: (v) => kartDegis(kayit.id, "faiz", v), metin: true,
                      yerTutucu: b.aylikFaiz.toFixed(2),
                    },
                  ]}
                  etiketler={[
                    b.yasalAsgari > 0 ? `Yasal asgari: ${tl(b.yasalAsgari)} (${yzd(asgariOran(b.limit) * 100, 0)})` : null,
                    b.odemeGirildi && b.taksit < b.yasalAsgari ? "⚠ Girdiğin ödeme yasal asgarinin altında" : null,
                    kullanim != null ? `Limit kullanımı ${yzd(kullanim, 0)}` : null,
                    b.faizOrtuk && b.bakiye > 0 ? `TCMB azami oranı uygulandı: aylık ${yzd(b.aylikFaiz, 2)}` : null,
                  ]}
                />
              );
            })}
            <Buton onClick={kartEkle} renk={RENK.kart}>+ Kredi kartı borcu ekle</Buton>
          </div>
        </div>

        <Not tur="bilgi">
          <strong>Neden krediler ortak, kartlar ayrı?</strong> Gelir / Gider sekmesindeki “Kredi Kartı Giderleri”
          her ay harcadığın tutardır — bir <em>gider</em> kalemidir. Kartın <em>borcu</em> ise eriyen bir bakiyedir
          ve ayrı izlenmesi gerekir; ikisi aynı satırda tutulursa hem aylık gider hem toplam borç yanlış çıkar.
          Kart borcuna yaptığın aylık ödemeyi ayrıca Gelir / Gider'e gider olarak girmeyi unutma.
        </Not>

        <Not tur="bilgi">
          <strong>Faiz oranını boş bırakabilirsin.</strong> Kredilerde oran, kalan borç + taksit + kalan taksit
          sayısından çözülür. Kartlarda TCMB'nin 2026 kademeli azami akdi faiz oranı uygulanır
          (30.000 ₺ altı %3,25 · 30.000–180.000 ₺ %3,75 · 180.000 ₺ üstü %4,25).
        </Not>
      </Bolum>

      {/* --- Strateji simülatörü -------------------------------------------- */}
      <Bolum
        baslik="Kapatma Stratejisi" ikon="🎯" renk={RENK.strateji} acik={acik.strateji} onToggle={() => ac("strateji")}
        aciklama="Aylık toplam ödemeni sabit tutup, kapanan her taksiti sıradaki borca yönlendirirsen ne olur?"
      >
        <Izgara min={200}>
          <Alan
            label="Aylık ek ödeme kapasiten (₺)"
            hint={`Zorunlu yük dışında borca ayırabileceğin tutar. Boş bırakırsan Gelir / Gider'deki aylık kalanından hesaplanan ${tl(onerilenKapasite)} kullanılır.`}
          >
            <input
              value={ayar.ekKapasite ?? ""} inputMode="numeric"
              placeholder={String(Math.round(onerilenKapasite))}
              onChange={(e) => guncelle("ekKapasite", e.target.value.replace(/[^\d]/g, ""))}
              style={satirInput}
            />
          </Alan>
          <Alan label="Toplam aylık ödeme" hint="Zorunlu yük + ek kapasite. Borçlar kapandıkça bu tutar sabit kalır; etkisi büyür.">
            <div style={{ ...satirInput, background: "rgba(52,211,153,.10)", borderColor: "rgba(52,211,153,.3)", color: "#34d399", fontWeight: 800 }}>
              {tl(ozet.aylikTaksit + ozet.kartAsgari + ekKapasite)}
            </div>
          </Alan>
          <Alan label="Gelire oranı" hint="Toplam ödemenin aylık gelirine oranı. %50 üstü uzun süre sürdürülemez.">
            <div style={{
              ...satirInput, fontWeight: 800,
              color: gelir > 0 ? (((ozet.aylikTaksit + ozet.kartAsgari + ekKapasite) / gelir) * 100 > 60 ? "#fb7185" : "#e2e8f0") : "#64748b",
            }}>
              {gelir > 0 ? yzd(((ozet.aylikTaksit + ozet.kartAsgari + ekKapasite) / gelir) * 100) : "Gelir girilmedi"}
            </div>
          </Alan>
        </Izgara>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
          {STRATEJILER.map((s) => {
            const secili = s.id === strateji;
            return (
              <button key={s.id} type="button" onClick={() => guncelle("strateji", s.id)}
                style={{
                  textAlign: "left", padding: "12px 13px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${secili ? RENK.strateji + "88" : "rgba(148,163,184,.22)"}`,
                  background: secili ? `linear-gradient(120deg, ${RENK.strateji}28, ${RENK.strateji}0c)` : "rgba(2,6,23,.4)",
                }}>
                <div style={{ color: secili ? "#fff" : "#cbd5e1", fontWeight: 900, fontSize: 13.5 }}>{s.ikon} {s.ad}</div>
                <div style={{ color: "#94a3b8", fontSize: 11.5, marginTop: 5, lineHeight: 1.5 }}>{s.aciklama}</div>
              </button>
            );
          })}
        </div>

        <SonucPaneli sonuc={sonuc} diger={diger} strateji={strateji} />
      </Bolum>

      {/* --- Kapanış takvimi ------------------------------------------------- */}
      <Bolum
        baslik="Kapanış Takvimi ve Rahatlama" ikon="📅" renk={RENK.takvim} acik={acik.takvim} onToggle={() => ac("takvim")}
        aciklama="Seçili stratejiyle hangi borç hangi ay kapanıyor ve her kapanış aylık bütçende ne kadar yer açıyor?"
      >
        {sonuc.secili.olaylar.length ? (
          <Takvim olaylar={sonuc.secili.olaylar} toplamYuk={ozet.aylikTaksit + ozet.kartAsgari + ekKapasite} />
        ) : (
          <Not tur="uyari">Seçili senaryoda 30 yıl içinde kapanan borç yok. Ek ödeme kapasitesini artırmadan bu borç yapısı erimiyor.</Not>
        )}
      </Bolum>

      {/* --- Nakit akışı ----------------------------------------------------- */}
      <Bolum
        baslik="Nakit Akışı Projeksiyonu" ikon="📈" renk={RENK.akis} acik={acik.akis} onToggle={() => ac("akis")}
        aciklama="Ay ay kalan borcun ve ödediğin faiz. Faiz kaleminin erimesi, planın gerçekten işlediğinin kanıtıdır."
      >
        <NakitAkisi aylik={sonuc.secili.aylik} />
      </Bolum>

      <Oneriler ozet={ozet} saglik={saglik} sonuc={sonuc} diger={diger} ekKapasite={ekKapasite} kartlar={kartlar} krediler={krediler} gelir={gelir} />
    </section>
  );
}

function Baslik() {
  return (
    <header style={{ marginBottom: 14 }}>
      <h2 style={{ color: "#fff", fontSize: 21, fontWeight: 900, margin: 0 }}>Borç Planı</h2>
      <p style={{ color: "#94a3b8", fontSize: 13, margin: "6px 0 0", lineHeight: 1.6 }}>
        Borcun ne kadar olduğunu zaten biliyorsun. Buradaki soru şu: <strong style={{ color: "#cbd5e1" }}>ne zaman biter,
        hangi sırayla ödersen ne kazanırsın ve her kapanış bütçende ne kadar yer açar?</strong>
      </p>
    </header>
  );
}

function AltBaslik({ renk, children }) {
  return (
    <div style={{ color: renk, fontWeight: 900, fontSize: 13, marginBottom: 9, textTransform: "uppercase", letterSpacing: ".03em" }}>
      {children}
    </div>
  );
}

// Tek borç satırı: adı solda, düzenlenebilir alanlar yanında, altında
// hesaplanan bilgiler (kalan taksit, asgari ödeme, çözülen faiz).
function BorcSatiri({ borc, renk, alanlar, etiketler, adDegis, onSil }) {
  return (
    <div style={{ border: `1px solid ${renk}33`, borderRadius: 14, padding: "11px 12px", background: `${renk}0b` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
        {adDegis ? (
          <input
            value={borc.ad === "Adsız kart" || borc.ad === "Yeni kart" ? "" : borc.ad}
            placeholder="Kart adı (örn: Garanti Bonus)"
            onChange={(e) => adDegis(e.target.value)}
            style={{ ...satirInput, flex: 1, minWidth: 120, color: "#fff", fontWeight: 800, fontSize: 14.5 }}
          />
        ) : (
          <strong style={{ color: "#fff", fontSize: 14.5, minWidth: 0 }}>{borc.ad}</strong>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 9, flex: "0 0 auto" }}>
          <span style={{ color: renk, fontWeight: 900, fontSize: 15, whiteSpace: "nowrap" }}>{tl(borc.bakiye)}</span>
          {onSil ? (
            <button type="button" onClick={onSil} title="Bu kaydı sil"
              style={{ ...kucukBtn, border: "1px solid rgba(248,113,113,.4)", background: "rgba(248,113,113,.12)", color: "#fb7185" }}>×</button>
          ) : null}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(118px, 1fr))`, gap: 9 }}>
        {alanlar.map((a) => (
          <label key={a.label} style={{ display: "block", minWidth: 0 }}>
            <span style={{ display: "block", color: "#94a3b8", fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>{a.label}</span>
            <input
              value={a.deger} placeholder={a.yerTutucu || "0"}
              inputMode={a.metin ? "text" : "numeric"}
              onChange={(e) => a.onChange(a.metin ? e.target.value : e.target.value.replace(/[^\d]/g, ""))}
              style={{ ...satirInput, fontSize: 13 }}
            />
          </label>
        ))}
      </div>
      {etiketler.filter(Boolean).length ? (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
          {etiketler.filter(Boolean).map((e, i) => (
            <span key={i} style={{
              border: "1px solid rgba(148,163,184,.22)", borderRadius: 999, padding: "3px 9px",
              color: "#94a3b8", fontSize: 10.5, fontWeight: 600,
            }}>{e}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SaglikSeridi({ saglik, gelir }) {
  if (!gelir) {
    return <Not tur="uyari">Gelir / Gider sekmesine aylık gelirini girersen borç/gelir oranın ve ödeme kapasiten otomatik hesaplanır.</Not>;
  }
  const kalemler = [
    {
      etiket: "Taksit / Gelir",
      deger: saglik.dti == null ? "—" : yzd(saglik.dti),
      seviye: saglik.dtiSeviye,
      alt: "Zorunlu borç ödemesinin gelire oranı · sağlıklı sınır %35",
    },
    {
      etiket: "Borç / Gelir",
      deger: saglik.borcGelir == null ? "—" : saglik.borcGelir.toFixed(1).replace(".", ",") + " aylık gelir",
      seviye: saglik.borcGelirSeviye,
      alt: "Toplam borç kaç aylık gelirine eşit · 6 altı rahat",
    },
    {
      etiket: "Kart Limit Kullanımı",
      deger: saglik.kartKullanim == null ? "Limit girilmedi" : yzd(saglik.kartKullanim, 0),
      seviye: saglik.kartKullanimSeviye,
      alt: "Kredi notunu en çok etkileyen kalem · %30 altı ideal",
    },
  ];
  return (
    <section style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      border: "1px solid rgba(255,255,255,.11)", borderRadius: 16,
      background: "rgba(2,6,23,.42)", overflow: "hidden", margin: "0 0 14px",
    }}>
      {kalemler.map((k, i) => (
        <div key={k.etiket} style={{ padding: "12px 15px", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{k.etiket}</div>
          <div style={{ color: SEVIYE_RENK[k.seviye], fontSize: 20, fontWeight: 900, marginTop: 3, lineHeight: 1.15 }}>{k.deger}</div>
          <div style={{ color: "#64748b", fontSize: 10.5, marginTop: 2, lineHeight: 1.4 }}>{k.alt}</div>
        </div>
      ))}
    </section>
  );
}

function SonucPaneli({ sonuc, diger, strateji }) {
  const s = sonuc.secili;
  const t = sonuc.taban;
  const alternatif = STRATEJILER.find((x) => x.id === diger.id);
  const secili = STRATEJILER.find((x) => x.id === strateji);

  if (!s.bitti) {
    return (
      <Not tur="uyari">
        <strong>Bu senaryo kapanmıyor.</strong> Mevcut ödeme tutarı faizi karşılamaya yetmiyor; borç 30 yıl içinde bitmiyor.
        Ek ödeme kapasiteni artırman ya da yüksek faizli kartı yapılandırman gerekiyor.
      </Not>
    );
  }

  const satirlar = [
    {
      hucreler: [`${secili.ikon} ${secili.ad}`, `${s.ay} ay`, ayAdi(s.ay), tl(s.toplamFaiz), tl(s.toplamOdeme)],
      vurgu: true, kalin: true, renk: "#34d399",
    },
    diger.sonuc.bitti ? {
      hucreler: [`${alternatif.ikon} ${alternatif.ad}`, `${diger.sonuc.ay} ay`, ayAdi(diger.sonuc.ay), tl(diger.sonuc.toplamFaiz), tl(diger.sonuc.toplamOdeme)],
    } : null,
    t.bitti ? {
      hucreler: ["🐌 Ek ödeme yapmazsan", `${t.ay} ay`, ayAdi(t.ay), tl(t.toplamFaiz), tl(t.toplamOdeme)],
      renk: "#fb7185",
    } : {
      hucreler: ["🐌 Ek ödeme yapmazsan", "30+ yıl", "Kapanmıyor", "—", "—"], renk: "#fb7185",
    },
  ].filter(Boolean);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <KutuIzgara min={160}>
        <Kutu etiket="Borçsuz Olma Tarihi" deger={ayAdi(s.ay)} renk="#34d399" alt={`Bugünden ${s.ay} ay sonra`} />
        <Kutu etiket="Kazanılan Süre" deger={sonuc.kazanilanAy != null ? `${sonuc.kazanilanAy} ay` : "—"} renk="#38bdf8"
          alt="Ek ödeme yapmamaya kıyasla" />
        <Kutu etiket="Faiz Tasarrufu" deger={sonuc.faizTasarrufu != null ? tl(sonuc.faizTasarrufu) : "—"} renk="#a78bfa"
          alt="Ek ödeme yapmamaya kıyasla" />
        <Kutu etiket="Ödenecek Toplam Faiz" deger={tl(s.toplamFaiz)} renk="#fb7185"
          alt={s.toplamOdeme > 0 ? `Toplam ödemedeki payı ${yzd((s.toplamFaiz / s.toplamOdeme) * 100)}` : "—"} />
      </KutuIzgara>

      <Tablo
        renk="#34d399"
        basliklar={["Senaryo", "Süre", "Bitiş", "Toplam Faiz", "Toplam Ödeme"]}
        satirlar={satirlar}
        not="Faiz oranları sabit varsayılmıştır. Bankaların erken kapama tutarı günlük faiz ve yasal kalemler nedeniyle buradaki kalan anaparadan farklı olabilir."
      />

      {diger.sonuc.bitti && Math.abs(diger.sonuc.toplamFaiz - s.toplamFaiz) > 1000 ? (
        <Not tur={diger.sonuc.toplamFaiz > s.toplamFaiz ? "iyi" : "uyari"}>
          {diger.sonuc.toplamFaiz > s.toplamFaiz
            ? <>Seçtiğin <strong>{secili.ad}</strong> yöntemi, {alternatif.ad} yöntemine göre {tl(diger.sonuc.toplamFaiz - s.toplamFaiz)} daha az faiz ödetiyor.</>
            : <><strong>{alternatif.ad}</strong> yöntemi {tl(s.toplamFaiz - diger.sonuc.toplamFaiz)} daha az faiz ödetirdi. Yine de kapanışları erken görmek seni ayakta tutuyorsa mevcut seçimin savunulabilir.</>}
        </Not>
      ) : null}
    </div>
  );
}

function Takvim({ olaylar, toplamYuk }) {
  let birikenRahatlama = 0;
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {olaylar.map((o, i) => {
        birikenRahatlama += o.serbestlesen;
        const son = i === olaylar.length - 1;
        return (
          <div key={o.id} style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            border: `1px solid ${son ? "rgba(52,211,153,.5)" : "rgba(56,189,248,.26)"}`,
            borderRadius: 14, padding: "11px 13px",
            background: son ? "rgba(52,211,153,.12)" : "rgba(56,189,248,.07)",
          }}>
            <span style={{
              flex: "0 0 auto", width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center",
              background: son ? "rgba(52,211,153,.25)" : "rgba(56,189,248,.2)",
              color: son ? "#34d399" : "#38bdf8", fontWeight: 900, fontSize: 12,
            }}>{i + 1}</span>
            <span style={{ flex: "0 0 auto", minWidth: 108, color: son ? "#34d399" : "#38bdf8", fontWeight: 900, fontSize: 13.5 }}>
              {o.ayAdi}
            </span>
            <span style={{ flex: 1, minWidth: 140, color: "#fff", fontWeight: 700, fontSize: 13.5 }}>
              {o.ad} kapanır
            </span>
            <span style={{ flex: "0 0 auto", color: "#94a3b8", fontSize: 11.5, textAlign: "right" }}>
              {o.serbestlesen > 0
                ? <>+{tl(o.serbestlesen)} {o.tur === "kart" ? "asgari" : "taksit"} serbest<br /><span style={{ color: "#64748b" }}>birikmiş: {tl(birikenRahatlama)}</span></>
                : <>Yüksek faizli döngü biter</>}
            </span>
          </div>
        );
      })}
      <Not tur="iyi">
        Son borç kapandığında aylık <strong>{tl(toplamYuk)}</strong> tamamen serbest kalır. Kritik kural:
        bu tutarı kapanışlar sırasında yaşam standardına değil, sıradaki borca yönlendir — planın tamamı buna dayanıyor.
      </Not>
    </div>
  );
}

function NakitAkisi({ aylik }) {
  const gosterilecek = aylik.length > 36 ? aylik.filter((a, i) => i % Math.ceil(aylik.length / 36) === 0 || i === aylik.length - 1) : aylik;
  const maxBorc = Math.max(...gosterilecek.map((a) => a.kalanBorc), 1);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 130, overflowX: "auto", paddingBottom: 4 }}>
        {gosterilecek.map((a) => (
          <div key={a.ay} title={`${a.ayAdi}: kalan ${tl(a.kalanBorc)} · faiz ${tl(a.faiz)}`}
            style={{ flex: "1 0 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", minWidth: 10 }}>
            <div style={{
              height: `${Math.max(2, (a.kalanBorc / maxBorc) * 100)}%`,
              background: "linear-gradient(180deg, #fbbf24, #f59e0b)", borderRadius: "4px 4px 0 0",
            }} />
          </div>
        ))}
      </div>
      <Tablo
        renk="#fbbf24"
        minGenislik={420}
        basliklar={["Dönem", "Ödeme", "Bunun faizi", "Kalan borç", "Açık ürün"]}
        satirlar={gosterilecek.slice(0, 24).map((a) => ({
          hucreler: [a.ayAdi, tl(a.odeme), tl(a.faiz), tl(a.kalanBorc), String(a.acikSayi)],
          renk: a.faiz > a.odeme * 0.5 ? "#fb7185" : "#fff",
        }))}
        not="Kırmızı satırlar, ödemenin yarısından fazlasının faize gittiği ayları gösterir. Bu aylarda anapara neredeyse hiç erimiyor."
      />
    </div>
  );
}

// Otomatik üretilen, duruma özgü öneriler. Genel tavsiye değil; kullanıcının
// kendi tablosundan çıkan tespitler.
function Oneriler({ ozet, saglik, sonuc, diger, ekKapasite, kartlar, krediler, gelir }) {
  const maddeler = [];

  const enPahali = [...kartlar, ...krediler].sort((a, b) => b.aylikFaiz - a.aylikFaiz)[0];
  if (enPahali && enPahali.aylikFaiz > 0) {
    maddeler.push({
      tur: "uyari",
      metin: <><strong>{enPahali.ad}</strong> aylık {yzd(enPahali.aylikFaiz, 2)} ile en pahalı borcun; tek başına ayda {tl((enPahali.bakiye * enPahali.aylikFaiz) / 100)} faiz üretiyor. Ek ödeme kapasitenin tamamı önce buraya gitmeli.</>,
    });
  }

  if (ozet.kartBorc > 0 && ozet.krediBorc > 0) {
    const kartFaizYuku = kartlar.reduce((s, b) => s + (b.bakiye * b.aylikFaiz) / 100, 0);
    const pay = ozet.aylikFaizYuku > 0 ? (kartFaizYuku / ozet.aylikFaizYuku) * 100 : 0;
    maddeler.push({
      tur: "uyari",
      metin: <>Kart borcunun toplam içindeki payı {yzd((ozet.kartBorc / ozet.toplam) * 100, 0)} ama aylık faiz maliyetindeki payı {yzd(pay, 0)}. Kartı krediye çevirmek (borç transferi / ihtiyaç kredisiyle kapama) tek başına ciddi tasarruf sağlayabilir — bankadan teklif iste.</>,
    });
  }

  if (saglik.dti != null && saglik.dti > 50) {
    maddeler.push({
      tur: "uyari",
      metin: <>Zorunlu borç ödemenin gelire oranı {yzd(saglik.dti, 0)}. %50 üstü, beklenmedik bir gider karşısında savunmasız olduğun anlamına gelir. Yeni kredi almadan önce bu oranı %35'in altına indirmeyi hedefle.</>,
    });
  }

  if (saglik.kartKullanim != null && saglik.kartKullanim > 60) {
    maddeler.push({
      tur: "uyari",
      metin: <>Kart limit kullanımın {yzd(saglik.kartKullanim, 0)}. Kredi notunu en hızlı düşüren kalem budur; borcu azaltmak notunu birkaç ay içinde görünür biçimde yukarı çeker.</>,
    });
  }

  if (ekKapasite <= 0) {
    maddeler.push({
      tur: "uyari",
      metin: <>Ek ödeme kapasiten görünmüyor — gelirin zorunlu yükü ancak karşılıyor. Bu durumda plan değil, <strong>yapılandırma</strong> gerekir: bankadan vade uzatma veya borç birleştirme teklifi al.</>,
    });
  } else if (gelir > 0) {
    maddeler.push({
      tur: "iyi",
      metin: <>Ayda {tl(ekKapasite)} ek ödeme, borcunu {sonuc.kazanilanAy ?? 0} ay erken bitiriyor ve {sonuc.faizTasarrufu != null ? tl(sonuc.faizTasarrufu) : "—"} faizden kurtarıyor. Bu tutarı otomatik talimata bağla; iradeye bırakma.</>,
    });
  }

  // Ders kitabı cevabı "3 aylık gider kadar acil fon"dur; ama borç yükü
  // gelirin yarısını aşmışsa bu hedef ulaşılamaz olduğu için caydırıcıdır.
  // O durumda tek aylık, ulaşılabilir bir tampon öner.
  const zorunluYuk = ozet.aylikTaksit + ozet.kartAsgari;
  const sikisik = saglik.dti != null && saglik.dti > 55;
  maddeler.push({
    tur: "bilgi",
    metin: sikisik
      ? <>Acil fon hedefini şimdilik küçük tut: <strong>{tl(zorunluYuk)}</strong> (bir aylık zorunlu yük) kadar bir tampon bile, beklenmedik bir giderde yeniden kart borcuna düşmeni engeller. Klasik "3 aylık fon" hedefi borç yükün hafifledikten sonra anlamlı olur.</>
      : <>Borç kapatırken bile <strong>{tl(zorunluYuk * 3)}</strong> (3 aylık zorunlu yük) kadar acil fon bulundurmaya çalış. Fonsuz plan, ilk beklenmedik giderde yeniden kart borcu doğurur ve baştan başlarsın.</>,
  });

  return (
    <Bolum baslik="Tespit ve Öneriler" ikon="🧭" renk="#c084fc" acik>
      <div style={{ display: "grid", gap: 9 }}>
        {maddeler.map((m, i) => <Not key={i} tur={m.tur}>{m.metin}</Not>)}
      </div>
    </Bolum>
  );
}
