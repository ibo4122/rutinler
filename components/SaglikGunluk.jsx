"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EGZERSIZLER, egzersizKalori, suIhtiyaci, bugun, tarihAdi } from "../lib/saglikKoc";
import { KATEGORI_LISTESI, besinAra, kategoriBesinleri, besinBul, BESIN_SAYISI } from "../lib/besinler";
import { supabase } from "../lib/supabaseClient";
import { num, yeniId } from "./panelUI";
import { GeriButon, useGeriAl } from "./GeriAl";

// Sağlık — günlük ekran.
//
// Ana bilgi "bugün ne aldım": büyük kalori sayısı ve makro kartları. Hedef ve
// kalan ikincil, ince bir çubukta. Öğünler akordeon; kapalıyken bile kalori,
// makro özeti ve kayıt sayısı görünür. Ekleme tek bir sayfadan yapılır: arama,
// fotoğraf ya da elle giriş.

export const RENK = {
  kalori: "#ff7a59", protein: "#60a5fa", karb: "#fbbf24", yag: "#a78bfa",
  lif: "#4ade80", su: "#7dd3fc", yakilan: "#fb923c", ana: "#4ade80",
};

// Ekrandaki öğün bölümleri. "Ara öğünler" eski iki ara öğün kaydını (ara1, ara2)
// birlikte gösterir; yeni ara öğünler ara1'e yazılır.
export const BOLUMLER = [
  { id: "kahvalti", ad: "Kahvaltı", yonelme: "Kahvaltıya", ikon: "🌅", renk: "#fbbf24", kayitlar: ["kahvalti"], pay: 0.25 },
  { id: "ogle", ad: "Öğle Yemeği", yonelme: "Öğle yemeğine", ikon: "☀️", renk: "#fb923c", kayitlar: ["ogle"], pay: 0.3 },
  { id: "aksam", ad: "Akşam Yemeği", yonelme: "Akşam yemeğine", ikon: "🌙", renk: "#a78bfa", kayitlar: ["aksam"], pay: 0.25 },
  { id: "ara1", ad: "Ara Öğünler", yonelme: "Ara öğünlere", ikon: "🍎", renk: "#2dd4bf", kayitlar: ["ara1", "ara2"], pay: 0.2 },
];
const bolumBul = (id) => BOLUMLER.find((b) => b.kayitlar.includes(id)) || BOLUMLER[3];

export const saatinOgunu = () => {
  const s = new Date().getHours();
  if (s >= 5 && s < 11) return "kahvalti";
  if (s >= 11 && s < 15) return "ogle";
  if (s >= 18 && s < 23) return "aksam";
  return "ara1";
};

const r0 = (v) => Math.round(num(v)).toLocaleString("tr-TR");
const r1 = (v) => (Math.round(num(v) * 10) / 10).toLocaleString("tr-TR");

export function gunToplami(gun) {
  let kcal = 0, protein = 0, karb = 0, yag = 0, lif = 0, lifBilinmeyen = 0, kayit = 0;
  for (const liste of Object.values(gun?.ogunler || {})) {
    for (const x of liste || []) {
      kcal += num(x.kcal); protein += num(x.protein); karb += num(x.karb); yag += num(x.yag);
      if (x.lif != null) lif += num(x.lif); else lifBilinmeyen++;
      kayit++;
    }
  }
  const yakilan = (gun?.egzersizler || []).reduce((s, e) => s + num(e.kcal), 0);
  const egzDk = (gun?.egzersizler || []).reduce((s, e) => s + num(e.dakika), 0);
  return { kcal, protein, karb, yag, lif, lifBilinmeyen, kayit, yakilan, egzDk, su: num(gun?.su), net: kcal - yakilan };
}

// ======================= GÜNÜN ÖZETİ ========================================

export function GunOzeti({ tarih, setTarih, toplam, hedefKcal, makro, kilo, onEkle }) {
  const gunKaydir = (adim) => {
    const d = new Date(tarih + "T12:00:00");
    d.setDate(d.getDate() + adim);
    const yeni = d.toISOString().slice(0, 10);
    if (yeni <= bugun()) setTarih(yeni);
  };
  const suHedef = Math.round((kilo ? suIhtiyaci(kilo, toplam.egzDk) : 2.5) * 1000);
  const oran = hedefKcal > 0 ? toplam.net / hedefKcal : 0;
  const kalan = hedefKcal - toplam.net;
  const bugunMu = tarih === bugun();

  return (
    <section className="sg-ozet" aria-label="Günün özeti">
      <div className="sg-ozet-ust">
        <div className="sg-gun" role="group" aria-label="Gün seçimi">
          <button type="button" className="sg-ok" onClick={() => gunKaydir(-1)} aria-label="Önceki gün">‹</button>
          <span className="sg-gun-ad">{bugunMu ? "Bugün" : tarihAdi(tarih)}</span>
          <button type="button" className="sg-ok" onClick={() => gunKaydir(1)} disabled={tarih >= bugun()} aria-label="Sonraki gün">›</button>
        </div>
        {!bugunMu ? <button type="button" className="sg-link" onClick={() => setTarih(bugun())}>Bugüne dön</button> : null}
      </div>

      <div className="sg-kcal-blok">
        <div className="sg-etiket">Alınan kalori</div>
        <div className="sg-kcal">
          <span className="sg-kcal-sayi">{r0(toplam.kcal)}</span>
          <span className="sg-kcal-birim">kcal</span>
        </div>
        {hedefKcal > 0 ? (
          <>
            <div className="sg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={hedefKcal} aria-valuenow={Math.round(toplam.net)} aria-label="Hedefe göre ilerleme">
              <span style={{ width: `${Math.min(100, oran * 100)}%`, background: oran > 1.05 ? "#fb7185" : `linear-gradient(90deg, ${RENK.kalori}aa, ${RENK.kalori})` }} />
            </div>
            <div className="sg-ikincil">
              <span>Hedef <b>{r0(hedefKcal)}</b></span>
              <span>%{Math.round(oran * 100)}</span>
              <span>{kalan >= 0 ? <>Kalan <b>{r0(kalan)}</b></> : <>Aşım <b style={{ color: "#fb7185" }}>{r0(-kalan)}</b></>}</span>
              {toplam.yakilan > 0 ? <span>🔥 Yakılan <b>{r0(toplam.yakilan)}</b> · net {r0(toplam.net)}</span> : null}
            </div>
          </>
        ) : (
          <div className="sg-ikincil"><span>Hedef görmek için aşağıdan profilini doldur.</span></div>
        )}
      </div>

      <div className="sg-makrolar">
        <MakroKart ad="Protein" deger={toplam.protein} hedef={makro?.protein?.gram} birim="g" renk={RENK.protein} />
        <MakroKart ad="Karbonhidrat" kisa="Karb." deger={toplam.karb} hedef={makro?.karb?.gram} birim="g" renk={RENK.karb} />
        <MakroKart ad="Yağ" deger={toplam.yag} hedef={makro?.yag?.gram} birim="g" renk={RENK.yag} />
        <MakroKart ad="Lif" deger={toplam.lif} hedef={makro?.lif} birim="g" renk={RENK.lif}
          not={toplam.lifBilinmeyen ? `${toplam.lifBilinmeyen} kayıtta lif bilgisi yok` : ""} />
        <MakroKart ad="Su" deger={toplam.su / 1000} hedef={suHedef / 1000} birim="L" renk={RENK.su} ondalik />
      </div>

      {toplam.kayit === 0 ? (
        <div className="sg-bos">
          <span>{bugunMu ? "Bugün henüz bir şey eklemedin." : "Bu güne kayıt yok."}</span>
          <button type="button" className="sg-btn sg-btn-ana" onClick={() => onEkle()}>+ İlk öğününü ekle</button>
        </div>
      ) : null}
    </section>
  );
}

function MakroKart({ ad, kisa, deger, hedef, birim, renk, ondalik, not }) {
  const h = num(hedef);
  const yuzde = h > 0 ? Math.min(100, (num(deger) / h) * 100) : 0;
  const asti = h > 0 && num(deger) > h * 1.1 && birim === "g" && ad !== "Lif" && ad !== "Protein";
  return (
    <div className="sg-makro" style={{ "--r": renk }} title={not || undefined}>
      <div className="sg-makro-ad"><span className="sg-nokta" />{kisa ? <><span className="sg-uzun">{ad}</span><span className="sg-kisa">{kisa}</span></> : ad}</div>
      <div className="sg-makro-deger">
        {ondalik ? r1(deger) : r0(deger)}<small>{birim}</small>
      </div>
      <div className="sg-makro-bar"><span style={{ width: `${yuzde}%`, background: asti ? "#fb7185" : renk }} /></div>
      <div className="sg-makro-hedef">{h > 0 ? `/ ${ondalik ? r1(h) : r0(h)} ${birim}` : "hedef yok"}{not ? " · *" : ""}</div>
    </div>
  );
}

// ======================= AKORDEON ===========================================

const TEK_ACIK_ANAHTAR = "rutinler:saglik:tekAcik";

export function GunAkordeon({ gun, onGun, hedefKcal, kilo, onEkle, onFoto, onDuzenle }) {
  const geriAl = useGeriAl();
  const [acik, setAcik] = useState(() => new Set());
  const [tekAcik, setTekAcik] = useState(false);
  useEffect(() => {
    try { setTekAcik(localStorage.getItem(TEK_ACIK_ANAHTAR) === "1"); } catch {}
  }, []);
  const tekAcikDegis = (v) => {
    setTekAcik(v);
    try { localStorage.setItem(TEK_ACIK_ANAHTAR, v ? "1" : "0"); } catch {}
    if (v) setAcik((s) => new Set([...s].slice(-1)));
  };
  const ac = (id) => setAcik((s) => {
    const y = new Set(tekAcik ? [] : s);
    if (s.has(id)) y.delete(id); else y.add(id);
    return y;
  });

  const sil = (kayitId, x) => {
    geriAl.etiketle(`${x.ad} silindi`);
    onGun({ ...gun, ogunler: { ...(gun.ogunler || {}), [kayitId]: ((gun.ogunler || {})[kayitId] || []).filter((y) => y.id !== x.id) } });
  };

  const suHedef = Math.round((kilo ? suIhtiyaci(kilo) : 2.5) * 1000);
  const yakilan = (gun.egzersizler || []).reduce((s, e) => s + num(e.kcal), 0);

  return (
    <section aria-label="Öğünler ve günlük kayıtlar">
      <div className="sg-akordeon-ust">
        <h3 className="sg-h3">Öğünler</h3>
        <label className="sg-anahtar">
          <input type="checkbox" checked={tekAcik} onChange={(e) => tekAcikDegis(e.target.checked)} />
          <span aria-hidden className="sg-anahtar-iz"><span /></span>
          Tek bölüm açık
        </label>
      </div>

      <div className="sg-akordeon">
        {BOLUMLER.map((b) => {
          const satirlar = b.kayitlar.flatMap((k) => ((gun.ogunler || {})[k] || []).map((x) => ({ x, k })));
          const t = satirlar.reduce((s, { x }) => ({ kcal: s.kcal + num(x.kcal), p: s.p + num(x.protein), k: s.k + num(x.karb), y: s.y + num(x.yag) }), { kcal: 0, p: 0, k: 0, y: 0 });
          return (
            <Bolum key={b.id} id={b.id} acik={acik.has(b.id)} onAc={() => ac(b.id)} ikon={b.ikon} renk={b.renk} ad={b.ad}
              alt={satirlar.length ? `${satirlar.length} kayıt · P ${r0(t.p)} · K ${r0(t.k)} · Y ${r0(t.y)} g` : `Boş · önerilen ~${r0(hedefKcal * b.pay)} kcal`}
              sag={<><b>{r0(t.kcal)}</b><small>kcal</small></>}>
              {satirlar.length ? (
                <>
                  <MakroSerit p={t.p} k={t.k} y={t.y} />
                  <ul className="sg-liste">
                    {satirlar.map(({ x, k }) => (
                      <li key={x.id} className="sg-kayit">
                        <div className="sg-kayit-ana">
                          <div className="sg-kayit-ad">{x.ad}{x.kaynak === "foto" ? <span className="sg-rozet" title="Fotoğraftan tahmin">📷 tahmin</span> : null}</div>
                          <div className="sg-kayit-alt">
                            {x.porsiyon || (num(x.gram) > 0 ? `${r0(x.gram)} g` : "elle girildi")}
                            <span className="sg-pky"><i style={{ color: RENK.protein }}>P {r1(x.protein)}</i><i style={{ color: RENK.karb }}>K {r1(x.karb)}</i><i style={{ color: RENK.yag }}>Y {r1(x.yag)}</i></span>
                          </div>
                        </div>
                        <div className="sg-kayit-kcal">{r0(x.kcal)}<small>kcal</small></div>
                        <div className="sg-kayit-eylem">
                          <button type="button" className="sg-mini" onClick={() => onDuzenle(k, x)} aria-label={`${x.ad} düzenle`}>Düzenle</button>
                          <button type="button" className="sg-mini sg-mini-sil" onClick={() => sil(k, x)} aria-label={`${x.ad} sil`}>Sil</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="sg-bos-metin">Bu öğüne henüz bir şey eklenmedi.</p>
              )}
              <div className="sg-bolum-eylem">
                <button type="button" className="sg-btn sg-btn-ana" onClick={() => onEkle(b.id)}>+ {b.yonelme} ekle</button>
                <button type="button" className="sg-btn" onClick={() => onFoto(b.id)}>📷 Fotoğrafla</button>
              </div>
            </Bolum>
          );
        })}

        <Bolum id="su" acik={acik.has("su")} onAc={() => ac("su")} ikon="💧" renk={RENK.su} ad="Su Tüketimi"
          alt={`Hedef ${r1(suHedef / 1000)} L · ${Math.round(num(gun.su) / 250)} bardak`}
          sag={<><b>{r1(num(gun.su) / 1000)}</b><small>L</small></>}>
          <SuBolumu gun={gun} onGun={onGun} hedef={suHedef} />
        </Bolum>

        <Bolum id="egzersiz" acik={acik.has("egzersiz")} onAc={() => ac("egzersiz")} ikon="🔥" renk={RENK.yakilan} ad="Egzersizler"
          alt={(gun.egzersizler || []).length ? `${gun.egzersizler.length} kayıt · ${r0((gun.egzersizler || []).reduce((s, e) => s + num(e.dakika), 0))} dk` : "Henüz egzersiz yok"}
          sag={<><b>−{r0(yakilan)}</b><small>kcal</small></>}>
          <EgzersizBolumu gun={gun} onGun={onGun} kilo={kilo} />
        </Bolum>

        <Bolum id="not" acik={acik.has("not")} onAc={() => ac("not")} ikon="📝" renk="#cbd5e1" ad="Günlük Notlar"
          alt={gun.not ? String(gun.not).slice(0, 60) + (String(gun.not).length > 60 ? "…" : "") : "Nasıl hissettin, ne fark ettin?"}
          sag={null}>
          <NotBolumu gun={gun} onGun={onGun} />
        </Bolum>
      </div>
    </section>
  );
}

function Bolum({ id, acik, onAc, ikon, renk, ad, alt, sag, children }) {
  return (
    <div className={`sg-bolum${acik ? " acik" : ""}`} style={{ "--r": renk }}>
      <button type="button" className="sg-bolum-bas" onClick={onAc} aria-expanded={acik} aria-controls={`sg-b-${id}`}>
        <span className="sg-bolum-ikon" aria-hidden>{ikon}</span>
        <span className="sg-bolum-metin">
          <span className="sg-bolum-ad">{ad}</span>
          <span className="sg-bolum-alt">{alt}</span>
        </span>
        {sag ? <span className="sg-bolum-sag">{sag}</span> : null}
        <span className="sg-chevron" aria-hidden>⌄</span>
      </button>
      <div className="sg-bolum-govde" id={`sg-b-${id}`} role="region" aria-label={ad}>
        <div className="sg-bolum-ic" inert={acik ? undefined : ""}><div className="sg-bolum-pad">{children}</div></div>
      </div>
    </div>
  );
}

function MakroSerit({ p, k, y }) {
  const kp = p * 4, kk = k * 4, ky = y * 9, top = kp + kk + ky;
  if (top <= 0) return null;
  return (
    <div className="sg-serit" aria-label={`Makro dağılımı: protein yüzde ${Math.round((kp / top) * 100)}, karbonhidrat yüzde ${Math.round((kk / top) * 100)}, yağ yüzde ${Math.round((ky / top) * 100)}`}>
      <div className="sg-serit-bar">
        <span style={{ width: `${(kp / top) * 100}%`, background: RENK.protein }} />
        <span style={{ width: `${(kk / top) * 100}%`, background: RENK.karb }} />
        <span style={{ width: `${(ky / top) * 100}%`, background: RENK.yag }} />
      </div>
      <div className="sg-serit-etiket">
        <span style={{ color: RENK.protein }}>Protein %{Math.round((kp / top) * 100)}</span>
        <span style={{ color: RENK.karb }}>Karb %{Math.round((kk / top) * 100)}</span>
        <span style={{ color: RENK.yag }}>Yağ %{Math.round((ky / top) * 100)}</span>
      </div>
    </div>
  );
}

function SuBolumu({ gun, onGun, hedef }) {
  const geriAl = useGeriAl();
  const su = num(gun.su);
  const ekle = (ml) => {
    const yeni = Math.max(0, su + ml);
    geriAl.etiketle(ml > 0 ? `+${ml} ml su eklendi` : `${-ml} ml su çıkarıldı`);
    onGun({ ...gun, su: yeni });
  };
  const bardak = Math.max(8, Math.ceil(hedef / 250));
  const dolu = Math.round(su / 250);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="sg-bardaklar" aria-label={`${dolu} / ${bardak} bardak`}>
        {Array.from({ length: bardak }).map((_, i) => (
          <span key={i} className={`sg-bardak${i < dolu ? " dolu" : ""}`} aria-hidden />
        ))}
      </div>
      <div className="sg-bolum-eylem">
        <button type="button" className="sg-btn sg-btn-su" onClick={() => ekle(250)}>+ 1 bardak <small>250 ml</small></button>
        <button type="button" className="sg-btn sg-btn-su" onClick={() => ekle(500)}>+ 0,5 L</button>
        <button type="button" className="sg-btn" onClick={() => ekle(-250)} disabled={su <= 0}>− 1 bardak</button>
      </div>
      <p className="sg-dipnot">Hedef kilona göre (35 ml/kg) hesaplandı; egzersiz yaptığın günlerde artar.</p>
    </div>
  );
}

function EgzersizBolumu({ gun, onGun, kilo }) {
  const geriAl = useGeriAl();
  const [tur, setTur] = useState(EGZERSIZLER[0].ad);
  const [dakika, setDakika] = useState("30");
  const liste = gun.egzersizler || [];
  const secili = EGZERSIZLER.find((e) => e.ad === tur) || EGZERSIZLER[0];
  const tahmin = egzersizKalori(secili.met, kilo, dakika);
  const ekle = () => {
    if (!kilo || !num(dakika)) return;
    geriAl.etiketle(`${secili.ad} eklendi`);
    onGun({ ...gun, egzersizler: [...liste, { id: yeniId(), ad: `${secili.ikon} ${secili.ad}`, dakika: num(dakika), kcal: tahmin }] });
    setDakika("30");
  };
  const sil = (e) => {
    geriAl.etiketle(`${e.ad} silindi`);
    onGun({ ...gun, egzersizler: liste.filter((x) => x.id !== e.id) });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {liste.length ? (
        <ul className="sg-liste">
          {liste.map((e) => (
            <li key={e.id} className="sg-kayit">
              <div className="sg-kayit-ana">
                <div className="sg-kayit-ad">{e.ad}</div>
                <div className="sg-kayit-alt">{e.dakika} dakika</div>
              </div>
              <div className="sg-kayit-kcal" style={{ color: RENK.yakilan }}>−{r0(e.kcal)}<small>kcal</small></div>
              <div className="sg-kayit-eylem">
                <button type="button" className="sg-mini sg-mini-sil" onClick={() => sil(e)} aria-label={`${e.ad} sil`}>Sil</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="sg-form-satir">
        <label className="sg-alan sg-alan-genis">
          <span>Aktivite</span>
          <select value={tur} onChange={(e) => setTur(e.target.value)}>
            {EGZERSIZLER.map((e) => <option key={e.ad} value={e.ad}>{e.ikon} {e.ad}</option>)}
          </select>
        </label>
        <label className="sg-alan">
          <span>Süre (dk)</span>
          <input inputMode="numeric" value={dakika} onChange={(e) => setDakika(e.target.value.replace(/[^\d]/g, ""))} />
        </label>
      </div>
      <button type="button" className="sg-btn sg-btn-ana sg-btn-tam" onClick={ekle} disabled={!kilo || !num(dakika)}
        style={{ background: kilo ? RENK.yakilan : undefined }}>
        {kilo ? `Egzersizi ekle · −${r0(tahmin)} kcal` : "Yakılan kaloriyi hesaplamak için önce kilonu gir"}
      </button>
    </div>
  );
}

function NotBolumu({ gun, onGun }) {
  const geriAl = useGeriAl();
  const [metin, setMetin] = useState(gun.not || "");
  useEffect(() => { setMetin(gun.not || ""); }, [gun.not]);
  const kaydet = () => {
    if ((gun.not || "") === metin) return;
    geriAl.etiketle("Not kaydedildi");
    onGun({ ...gun, not: metin });
  };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <textarea className="sg-not" rows={4} value={metin} onChange={(e) => setMetin(e.target.value)} onBlur={kaydet}
        placeholder="Enerjin, uykun, açlık hissin, dikkatini çeken bir şey…" aria-label="Günlük not" />
      <p className="sg-dipnot">Yazmayı bıraktığında otomatik kaydedilir.</p>
    </div>
  );
}

// ======================= EKLEME / DÜZENLEME SAYFASI ==========================

// mod: "ara" | "foto" | "elle" | "duzenle"
export function BesinSayfasi({ durum, gunler, onKapat, onEkle, onGuncelle }) {
  const [ogun, setOgun] = useState(durum.ogun || saatinOgunu());
  const [mod, setMod] = useState(durum.mod || "ara");
  const [eklenen, setEklenen] = useState(0);
  const kirli = useRef(false);
  const kapat = () => onKapat();

  useEffect(() => {
    const tus = (e) => {
      if (e.key !== "Escape") return;
      if (kirli.current && !window.confirm("Kaydedilmemiş bilgiler silinecek. Yine de geri dönmek istiyor musun?")) return;
      kapat();
    };
    window.addEventListener("keydown", tus);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tus); document.body.style.overflow = eski; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ekleVeSay = (items) => { onEkle(ogun, items); setEklenen((n) => n + items.length); kirli.current = false; };
  const duzenleme = mod === "duzenle";

  return (
    <div className="sg-perde" onMouseDown={(e) => { if (e.target === e.currentTarget && !kirli.current) kapat(); }}>
      <div className="sg-sayfa" role="dialog" aria-modal="true" aria-label={duzenleme ? "Kaydı düzenle" : "Besin ekle"}>
        <header className="sg-sayfa-bas">
          <GeriButon onClick={kapat} kaydedilmemis={() => kirli.current} />
          <div className="sg-sayfa-baslik">
            {duzenleme ? "Kaydı düzenle" : `${bolumBul(ogun).yonelme} ekle`}
            {eklenen ? <span className="sg-eklendi">✓ {eklenen} eklendi</span> : null}
          </div>
          {!duzenleme && eklenen ? <button type="button" className="sg-btn sg-btn-ana" onClick={kapat}>Bitti</button> : <span style={{ width: 8 }} />}
        </header>

        <div className="sg-ogun-sec" role="radiogroup" aria-label="Öğün">
          {BOLUMLER.map((b) => (
            <button key={b.id} type="button" role="radio" aria-checked={ogun === b.id || (b.id === "ara1" && ogun === "ara2")}
              className={`sg-cip${ogun === b.id || (b.id === "ara1" && ogun === "ara2") ? " secili" : ""}`}
              style={{ "--r": b.renk }} onClick={() => setOgun(b.id)}>{b.ikon} {b.ad.replace(" Yemeği", "")}</button>
          ))}
        </div>

        {!duzenleme ? (
          <div className="sg-sekmeler" role="tablist">
            {[["ara", "🔍 Ara"], ["foto", "📷 Fotoğraf"], ["elle", "✍️ Elle gir"]].map(([id, ad]) => (
              <button key={id} type="button" role="tab" aria-selected={mod === id} className={`sg-sekme${mod === id ? " secili" : ""}`}
                onClick={() => setMod(id)}>{ad}</button>
            ))}
          </div>
        ) : null}

        <div className="sg-sayfa-govde">
          {mod === "ara" ? <AraSekmesi gunler={gunler} onEkle={(x) => ekleVeSay([x])} kirli={kirli} /> : null}
          {mod === "foto" ? <FotoSekmesi onEkle={ekleVeSay} kirli={kirli} /> : null}
          {mod === "elle" ? <ElleSekmesi onEkle={(x) => ekleVeSay([x])} kirli={kirli} /> : null}
          {duzenleme ? <DuzenleSekmesi kayit={durum.kayit} onKaydet={(x) => { onGuncelle(durum.kayitOgun, ogun, x); kapat(); }} kirli={kirli} /> : null}
        </div>
      </div>
    </div>
  );
}

function AraSekmesi({ gunler, onEkle, kirli }) {
  const [terim, setTerim] = useState("");
  const [kategori, setKategori] = useState(null);
  const [secili, setSecili] = useState(null);
  const sonuclar = terim.trim() ? besinAra(terim, 60) : [];
  const gosterilen = terim.trim() ? sonuclar : kategori ? kategoriBesinleri(kategori).slice(0, 150) : [];

  // Sık eklenenler: son 30 günün kayıtlarından, besin veritabanında karşılığı olanlar.
  const sik = useMemo(() => {
    const sayac = new Map();
    const sinir = new Date(); sinir.setDate(sinir.getDate() - 30);
    const s = sinir.toISOString().slice(0, 10);
    for (const [t, g] of Object.entries(gunler || {})) {
      if (t < s) continue;
      for (const l of Object.values(g?.ogunler || {})) for (const x of l || []) if (x.besinId) sayac.set(x.besinId, (sayac.get(x.besinId) || 0) + 1);
    }
    return [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => besinBul(id)).filter(Boolean);
  }, [gunler]);

  if (secili) {
    return <PorsiyonSec besin={secili} onIptal={() => { setSecili(null); kirli.current = false; }}
      onEkle={(x) => { onEkle(x); setSecili(null); setTerim(""); }} kirli={kirli} />;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="sg-arama">
        <span aria-hidden>🔍</span>
        <input autoFocus value={terim} onChange={(e) => { setTerim(e.target.value); setKategori(null); }}
          placeholder="Ara — kavurma, tavuk sote, pilav, yoğurt…" aria-label="Besin ara" />
        {terim ? <button type="button" onClick={() => setTerim("")} aria-label="Aramayı temizle">✕</button> : null}
      </div>

      {!terim.trim() ? (
        <>
          {sik.length && !kategori ? (
            <div>
              <div className="sg-etiket" style={{ marginBottom: 8 }}>Sık eklediklerin</div>
              <div className="sg-cipler">
                {sik.map((b) => <button key={b.id} type="button" className="sg-cip" onClick={() => setSecili(b)}>{b.ikon} {b.ad}</button>)}
              </div>
            </div>
          ) : null}
          <div>
            <div className="sg-etiket" style={{ marginBottom: 8 }}>Kategoriler</div>
            <div className="sg-cipler">
              {KATEGORI_LISTESI.map((k) => (
                <button key={k.id} type="button" className={`sg-cip${kategori === k.id ? " secili" : ""}`} style={{ "--r": k.renk }}
                  onClick={() => setKategori(kategori === k.id ? null : k.id)}>{k.ikon} {k.ad}</button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="sg-dipnot">{gosterilen.length ? `${gosterilen.length} sonuç` : "Sonuç yok"} · {BESIN_SAYISI.toLocaleString("tr-TR")} besin içinde</div>
      )}

      {gosterilen.length ? (
        <ul className="sg-sonuclar">
          {gosterilen.map((b) => (
            <li key={b.id}>
              <button type="button" className="sg-sonuc" onClick={() => setSecili(b)}>
                <span className="sg-sonuc-ikon" aria-hidden>{b.ikon}</span>
                <span className="sg-sonuc-metin">
                  <span className="sg-sonuc-ad">{b.ad}{b.marka ? <em> · {b.marka}</em> : null}</span>
                  <span className="sg-sonuc-alt">{b.porsiyonAd} ≈ {b.porsiyonGram} g · <b>{r0((b.kcal * b.porsiyonGram) / 100)} kcal</b> · P {r1((b.protein * b.porsiyonGram) / 100)} K {r1((b.karb * b.porsiyonGram) / 100)} Y {r1((b.yag * b.porsiyonGram) / 100)}</span>
                </span>
                <span className="sg-sonuc-ekle" aria-hidden>+</span>
              </button>
            </li>
          ))}
        </ul>
      ) : terim.trim() ? (
        <div className="sg-bos-kutu">
          <b>"{terim}" listede yok.</b>
          <span>Daha genel bir ad dene (ör. "sote", "köfte") ya da <em>Fotoğraf</em> veya <em>Elle gir</em> sekmesini kullan.</span>
        </div>
      ) : null}
    </div>
  );
}

function PorsiyonSec({ besin, onIptal, onEkle, kirli }) {
  const [birim, setBirim] = useState("porsiyon");
  const [miktar, setMiktar] = useState(1);
  useEffect(() => { kirli.current = true; }, [kirli]);
  const gram = birim === "porsiyon" ? miktar * besin.porsiyonGram : miktar;
  const h = (a) => (num(besin[a]) * gram) / 100;
  const adim = birim === "porsiyon" ? 0.5 : 10;
  const ekle = () => {
    if (gram <= 0) return;
    kirli.current = false;
    onEkle({
      id: yeniId(), besinId: besin.id, ad: besin.marka ? `${besin.ad} (${besin.marka})` : besin.ad,
      gram, porsiyon: birim === "porsiyon" ? `${String(miktar).replace(".", ",")} × ${besin.porsiyonAd} · ${r0(gram)} g` : `${r0(gram)} g`,
      kcal: h("kcal"), protein: h("protein"), karb: h("karb"), yag: h("yag"), lif: besin.lif != null ? h("lif") : null,
    });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="sg-secili">
        <span className="sg-sonuc-ikon" aria-hidden>{besin.ikon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b>{besin.ad}</b>
          <small>{besin.marka ? besin.marka + " · " : ""}{besin.kcal} kcal / 100 g · {besin.kategoriAd}</small>
        </span>
        <button type="button" className="sg-mini" onClick={onIptal}>Değiştir</button>
      </div>

      <div className="sg-sekmeler" role="radiogroup" aria-label="Birim">
        <button type="button" role="radio" aria-checked={birim === "porsiyon"} className={`sg-sekme${birim === "porsiyon" ? " secili" : ""}`}
          onClick={() => { setBirim("porsiyon"); setMiktar(1); }}>{besin.porsiyonAd} ({besin.porsiyonGram} g)</button>
        <button type="button" role="radio" aria-checked={birim === "gram"} className={`sg-sekme${birim === "gram" ? " secili" : ""}`}
          onClick={() => { setBirim("gram"); setMiktar(besin.porsiyonGram); }}>Gram</button>
      </div>

      <div className="sg-adimci">
        <button type="button" onClick={() => setMiktar((m) => Math.max(0, Math.round((m - adim) * 10) / 10))} aria-label="Azalt">−</button>
        <input inputMode="decimal" value={String(miktar).replace(".", ",")} aria-label="Miktar"
          onChange={(e) => setMiktar(num(e.target.value.replace(",", ".")))} />
        <span>{birim === "porsiyon" ? "porsiyon" : "g"}</span>
        <button type="button" onClick={() => setMiktar((m) => Math.round((m + adim) * 10) / 10)} aria-label="Artır">+</button>
      </div>
      {birim === "porsiyon" ? (
        <div className="sg-cipler">
          {[0.5, 1, 1.5, 2].map((m) => <button key={m} type="button" className={`sg-cip${miktar === m ? " secili" : ""}`} onClick={() => setMiktar(m)}>{String(m).replace(".", ",")} porsiyon</button>)}
        </div>
      ) : null}

      <DegerOzeti kcal={h("kcal")} p={h("protein")} k={h("karb")} y={h("yag")} lif={besin.lif != null ? h("lif") : null} gram={gram} />
      <button type="button" className="sg-btn sg-btn-ana sg-btn-tam sg-btn-buyuk" onClick={ekle} disabled={gram <= 0}>Ekle · {r0(h("kcal"))} kcal</button>
    </div>
  );
}

function DegerOzeti({ kcal, p, k, y, lif, gram }) {
  return (
    <div className="sg-deger-ozeti">
      <div className="sg-deger-kcal"><b style={{ color: RENK.kalori }}>{r0(kcal)}</b><small>kcal{gram ? ` · ${r0(gram)} g` : ""}</small></div>
      <div className="sg-deger-makro">
        <span style={{ "--r": RENK.protein }}><i>Protein</i><b>{r1(p)} g</b></span>
        <span style={{ "--r": RENK.karb }}><i>Karb.</i><b>{r1(k)} g</b></span>
        <span style={{ "--r": RENK.yag }}><i>Yağ</i><b>{r1(y)} g</b></span>
        <span style={{ "--r": RENK.lif }}><i>Lif</i><b>{lif != null ? `${r1(lif)} g` : "—"}</b></span>
      </div>
    </div>
  );
}

// Fotoğrafı tarayıcıda küçült: telefon fotoğrafları 4–8 MB; modele 1024 px yeter.
async function gorseliKucult(dosya, enBuyuk = 1024) {
  const url = URL.createObjectURL(dosya);
  try {
    const img = await new Promise((coz, red) => { const i = new Image(); i.onload = () => coz(i); i.onerror = red; i.src = url; });
    const o = Math.min(1, enBuyuk / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.82);
    return { dataUrl, base64: dataUrl.split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function FotoSekmesi({ onEkle, kirli }) {
  const [onizleme, setOnizleme] = useState("");
  const [durum, setDurum] = useState("bos"); // bos | yukleniyor | sonuc | hata
  const [hata, setHata] = useState("");
  const [satirlar, setSatirlar] = useState([]);
  const [not, setNot] = useState("");
  const dosyaRef = useRef(null);

  const analizEt = async (dosya) => {
    if (!dosya) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setDurum("hata"); setHata("İnternet bağlantısı yok. Bağlandığında tekrar dene ya da Ara sekmesinden ekle."); return;
    }
    setDurum("yukleniyor"); setHata(""); setSatirlar([]);
    try {
      const { dataUrl, base64 } = await gorseliKucult(dosya);
      setOnizleme(dataUrl);
      const oturum = supabase ? (await supabase.auth.getSession()).data?.session : null;
      const res = await fetch("/api/kalori-foto", {
        method: "POST",
        headers: { "content-type": "application/json", ...(oturum?.access_token ? { Authorization: `Bearer ${oturum.access_token}` } : {}) },
        body: JSON.stringify({ gorsel: base64, tur: "image/jpeg" }),
      });
      const veri = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(veri.error || "Fotoğraf analiz edilemedi.");
      const liste = (veri.yemekler || []).map((y) => ({ ...y, id: yeniId(), sec: true, gram0: y.gram, oran: y.gram > 0 ? 1 / y.gram : 0 }));
      setSatirlar(liste); setNot(veri.not || "");
      setDurum("sonuc");
      kirli.current = liste.length > 0;
    } catch (e) {
      setDurum("hata"); setHata(e.message || "Fotoğraf analiz edilemedi.");
    }
  };

  // Gram değişince değerler orantılı güncellenir (modelin ilk tahminine göre).
  const degistir = (id, alan, deger) => setSatirlar((l) => l.map((s) => s.id === id ? { ...s, [alan]: deger } : s));
  const olcekli = (s, a) => (s.gram0 > 0 ? (num(s[a]) * num(s.gram)) / s.gram0 : num(s[a]));
  const secilen = satirlar.filter((s) => s.sec && num(s.gram) > 0);
  const toplamKcal = secilen.reduce((t, s) => t + olcekli(s, "kcal"), 0);

  const ekle = () => {
    onEkle(secilen.map((s) => ({
      id: yeniId(), ad: s.ad, gram: num(s.gram), porsiyon: `${r0(s.gram)} g · fotoğraftan`, kaynak: "foto",
      kcal: olcekli(s, "kcal"), protein: olcekli(s, "protein"), karb: olcekli(s, "karb"), yag: olcekli(s, "yag"),
      lif: s.lif != null ? olcekli(s, "lif") : null,
    })));
    setSatirlar([]); setOnizleme(""); setDurum("bos");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <input ref={dosyaRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { analizEt(e.target.files?.[0]); e.target.value = ""; }} />

      {durum === "bos" ? (
        <button type="button" className="sg-foto-alan" onClick={() => dosyaRef.current?.click()}>
          <span aria-hidden style={{ fontSize: 34 }}>📷</span>
          <b>Tabağının fotoğrafını çek ya da seç</b>
          <small>Yemekler ve yaklaşık gramajlar tahmin edilir; eklemeden önce düzeltebilirsin.</small>
        </button>
      ) : null}

      {onizleme ? <img src={onizleme} alt="Analiz edilen tabak" className="sg-foto-onizleme" /> : null}

      {durum === "yukleniyor" ? (
        <div className="sg-yukleniyor" role="status">
          <span className="sg-spin" aria-hidden /> Tabak inceleniyor… (5–15 sn)
          <div className="sg-iskelet" /><div className="sg-iskelet" style={{ width: "70%" }} />
        </div>
      ) : null}

      {durum === "hata" ? (
        <div className="sg-bos-kutu sg-hata" role="alert">
          <b>Analiz yapılamadı</b>
          <span>{hata}</span>
          <div className="sg-bolum-eylem">
            <button type="button" className="sg-btn sg-btn-ana" onClick={() => dosyaRef.current?.click()}>Tekrar dene</button>
          </div>
        </div>
      ) : null}

      {durum === "sonuc" ? (
        satirlar.length ? (
          <>
            <div className="sg-etiket">Bulunanlar — kontrol et, gramı düzelt</div>
            <ul className="sg-liste">
              {satirlar.map((s) => (
                <li key={s.id} className={`sg-foto-satir${s.sec ? "" : " pasif"}`}>
                  <label className="sg-onay"><input type="checkbox" checked={s.sec} onChange={(e) => degistir(s.id, "sec", e.target.checked)} aria-label={`${s.ad} ekle`} /></label>
                  <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 6 }}>
                    <input className="sg-satir-ad" value={s.ad} onChange={(e) => degistir(s.id, "ad", e.target.value)} aria-label="Yemek adı" />
                    <div className="sg-kayit-alt">
                      <span className="sg-gram"><input inputMode="numeric" value={s.gram} onChange={(e) => degistir(s.id, "gram", e.target.value.replace(/[^\d]/g, ""))} aria-label="Gram" /> g</span>
                      <span className="sg-pky"><i style={{ color: RENK.protein }}>P {r1(olcekli(s, "protein"))}</i><i style={{ color: RENK.karb }}>K {r1(olcekli(s, "karb"))}</i><i style={{ color: RENK.yag }}>Y {r1(olcekli(s, "yag"))}</i></span>
                    </div>
                    <div className="sg-kaynak">{s.kaynak === "veritabani" ? "✓ Değerler Rutinler veritabanından" : "≈ Yapay zekâ tahmini"} · güven {s.guven === "yuksek" ? "yüksek" : s.guven === "dusuk" ? "düşük" : "orta"}</div>
                  </div>
                  <div className="sg-kayit-kcal">{r0(olcekli(s, "kcal"))}<small>kcal</small></div>
                </li>
              ))}
            </ul>
            {not ? <p className="sg-dipnot">Not: {not}</p> : null}
            <button type="button" className="sg-btn sg-btn-ana sg-btn-tam sg-btn-buyuk" onClick={ekle} disabled={!secilen.length}>
              Seçilenleri ekle · {r0(toplamKcal)} kcal
            </button>
            <button type="button" className="sg-link" onClick={() => dosyaRef.current?.click()}>Başka fotoğraf dene</button>
          </>
        ) : (
          <div className="sg-bos-kutu">
            <b>Fotoğrafta yiyecek bulunamadı.</b>
            <span>Tabağı yukarıdan, iyi ışıkta çekmeyi dene ya da Ara sekmesinden ekle.</span>
            <div className="sg-bolum-eylem"><button type="button" className="sg-btn sg-btn-ana" onClick={() => dosyaRef.current?.click()}>Yeni fotoğraf</button></div>
          </div>
        )
      ) : null}

      <p className="sg-dipnot">🔒 Fotoğraf saklanmaz; yalnızca analiz için Google Gemini'ye gönderilir. Sonuçlar tahmindir — porsiyon ve yağ miktarı fotoğraftan tam görünmez.</p>
    </div>
  );
}

function ElleSekmesi({ onEkle, kirli }) {
  const bos = { ad: "", gram: "", kcal: "", protein: "", karb: "", yag: "", lif: "" };
  const [f, setF] = useState(bos);
  const d = (a) => (e) => { setF((x) => ({ ...x, [a]: e.target.value })); kirli.current = true; };
  const sayi = (v) => num(String(v).replace(",", "."));
  const gecerli = f.ad.trim() && sayi(f.kcal) > 0;
  const ekle = () => {
    if (!gecerli) return;
    onEkle({
      id: yeniId(), ad: f.ad.trim(), gram: sayi(f.gram) || null, porsiyon: sayi(f.gram) ? `${r0(sayi(f.gram))} g · elle` : "elle girildi", kaynak: "elle",
      kcal: sayi(f.kcal), protein: sayi(f.protein), karb: sayi(f.karb), yag: sayi(f.yag), lif: f.lif === "" ? null : sayi(f.lif),
    });
    setF(bos);
  };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p className="sg-dipnot">Paket üzerindeki ya da restoran menüsündeki değerleri yaz. Kalori zorunlu, gerisi isteğe bağlı.</p>
      <label className="sg-alan"><span>Ad</span><input value={f.ad} onChange={d("ad")} placeholder="Ör. Ev yapımı mercimek köftesi" /></label>
      <div className="sg-form-satir">
        <label className="sg-alan"><span>Kalori (kcal)</span><input inputMode="decimal" value={f.kcal} onChange={d("kcal")} /></label>
        <label className="sg-alan"><span>Miktar (g)</span><input inputMode="decimal" value={f.gram} onChange={d("gram")} /></label>
      </div>
      <div className="sg-form-satir sg-form-4">
        <label className="sg-alan"><span style={{ color: RENK.protein }}>Protein</span><input inputMode="decimal" value={f.protein} onChange={d("protein")} /></label>
        <label className="sg-alan"><span style={{ color: RENK.karb }}>Karb.</span><input inputMode="decimal" value={f.karb} onChange={d("karb")} /></label>
        <label className="sg-alan"><span style={{ color: RENK.yag }}>Yağ</span><input inputMode="decimal" value={f.yag} onChange={d("yag")} /></label>
        <label className="sg-alan"><span style={{ color: RENK.lif }}>Lif</span><input inputMode="decimal" value={f.lif} onChange={d("lif")} /></label>
      </div>
      <button type="button" className="sg-btn sg-btn-ana sg-btn-tam sg-btn-buyuk" onClick={ekle} disabled={!gecerli}>
        {gecerli ? `Ekle · ${r0(sayi(f.kcal))} kcal` : "Ad ve kalori gir"}
      </button>
    </div>
  );
}

function DuzenleSekmesi({ kayit, onKaydet, kirli }) {
  const gramli = num(kayit.gram) > 0;
  const [ad, setAd] = useState(kayit.ad);
  const [gram, setGram] = useState(gramli ? String(Math.round(num(kayit.gram))) : "");
  const [elle, setElle] = useState({ kcal: kayit.kcal, protein: kayit.protein, karb: kayit.karb, yag: kayit.yag });
  const oran = gramli ? num(gram) / num(kayit.gram) : 1;
  const deger = (a) => (gramli ? num(kayit[a]) * oran : num(String(elle[a]).replace(",", ".")));
  const lif = kayit.lif != null ? num(kayit.lif) * oran : null;
  const isaretle = () => { kirli.current = true; };
  const kaydet = () => {
    kirli.current = false;
    onKaydet({
      ...kayit, ad: ad.trim() || kayit.ad,
      ...(gramli ? { gram: num(gram), porsiyon: `${r0(gram)} g${kayit.kaynak === "foto" ? " · fotoğraftan" : ""}` } : {}),
      kcal: deger("kcal"), protein: deger("protein"), karb: deger("karb"), yag: deger("yag"), lif,
    });
  };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label className="sg-alan"><span>Ad</span><input value={ad} onChange={(e) => { setAd(e.target.value); isaretle(); }} /></label>
      {gramli ? (
        <>
          <label className="sg-alan"><span>Miktar (g)</span>
            <input inputMode="numeric" value={gram} onChange={(e) => { setGram(e.target.value.replace(/[^\d]/g, "")); isaretle(); }} />
          </label>
          <p className="sg-dipnot">Gramı değiştirince kalori ve makrolar orantılı güncellenir. Öğünü değiştirmek için yukarıdan seç.</p>
        </>
      ) : (
        <div className="sg-form-satir sg-form-4">
          {[["kcal", "Kalori"], ["protein", "Protein"], ["karb", "Karb."], ["yag", "Yağ"]].map(([a, e]) => (
            <label key={a} className="sg-alan"><span>{e}</span>
              <input inputMode="decimal" value={elle[a]} onChange={(ev) => { setElle((x) => ({ ...x, [a]: ev.target.value })); isaretle(); }} />
            </label>
          ))}
        </div>
      )}
      <DegerOzeti kcal={deger("kcal")} p={deger("protein")} k={deger("karb")} y={deger("yag")} lif={lif} gram={gramli ? num(gram) : 0} />
      <button type="button" className="sg-btn sg-btn-ana sg-btn-tam sg-btn-buyuk" onClick={kaydet} disabled={gramli && num(gram) <= 0}>Değişiklikleri kaydet</button>
    </div>
  );
}

// ======================= STİL ===============================================

export const SAGLIK_CSS = `
.sg-ozet{position:relative;overflow:hidden;border-radius:24px;padding:18px 18px 16px;margin-bottom:14px;
  background:radial-gradient(120% 90% at 0% 0%,rgba(255,122,89,.16),transparent 55%),linear-gradient(160deg,#10231b,#0a1712 70%);
  border:1px solid rgba(255,255,255,.08);box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 18px 40px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.25)}
.sg-ozet-ust{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.sg-gun{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:4px}
.sg-gun-ad{color:#fff;font-weight:850;font-size:13.5px;min-width:96px;text-align:center;white-space:nowrap}
.sg-ok{width:34px;height:34px;border-radius:10px;border:none;background:rgba(255,255,255,.06);color:#e2e8f0;font-size:18px;font-weight:900;cursor:pointer}
.sg-ok:disabled{opacity:.3;cursor:default}
.sg-link{background:none;border:none;color:#86efac;font-weight:800;font-size:13px;cursor:pointer;padding:6px 2px;text-decoration:underline;text-underline-offset:3px}
.sg-etiket{color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.sg-kcal{display:flex;align-items:baseline;gap:8px;margin:4px 0 10px}
.sg-kcal-sayi{font-size:clamp(46px,9vw,64px);font-weight:900;line-height:1;color:${RENK.kalori};letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-shadow:0 6px 24px rgba(255,122,89,.25)}
.sg-kcal-birim{color:#fda48c;font-weight:800;font-size:16px}
.sg-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.sg-bar span{display:block;height:100%;border-radius:99px;transition:width .4s ease}
.sg-ikincil{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;color:#94a3b8;font-size:12.5px}
.sg-ikincil b{color:#e2e8f0;font-weight:850}
.sg-makrolar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:16px}
.sg-makro{border-radius:16px;padding:10px 11px 9px;background:linear-gradient(170deg,rgba(255,255,255,.07),rgba(255,255,255,.02));
  border:1px solid color-mix(in srgb,var(--r) 28%,transparent);box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 6px 14px rgba(0,0,0,.18);min-width:0}
.sg-makro-ad{display:flex;align-items:center;gap:6px;color:#cbd5e1;font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden}
.sg-nokta{width:7px;height:7px;border-radius:50%;background:var(--r);flex:0 0 auto;box-shadow:0 0 8px var(--r)}
.sg-kisa{display:none}
.sg-makro-deger{color:#fff;font-size:22px;font-weight:900;margin-top:5px;font-variant-numeric:tabular-nums;line-height:1.1}
.sg-makro-deger small{font-size:11px;color:#94a3b8;font-weight:800;margin-left:2px}
.sg-makro-bar{height:3px;border-radius:99px;background:rgba(255,255,255,.08);margin-top:7px;overflow:hidden}
.sg-makro-bar span{display:block;height:100%;border-radius:99px;transition:width .4s ease}
.sg-makro-hedef{color:#64748b;font-size:10.5px;font-weight:700;margin-top:5px;white-space:nowrap}
.sg-bos{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.14);color:#cbd5e1;font-size:13.5px}
.sg-hizli{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:18px}
.sg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 14px;border-radius:13px;cursor:pointer;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#e2e8f0;font-weight:850;font-size:13.5px;transition:transform .15s,background .15s}
.sg-btn:hover:not(:disabled){transform:translateY(-1px);background:rgba(255,255,255,.09)}
.sg-btn:disabled{opacity:.45;cursor:not-allowed}
.sg-btn small{font-weight:700;opacity:.7;font-size:11px}
.sg-btn-ana{background:linear-gradient(135deg,#4ade80,#16a34a);border-color:transparent;color:#052e16;box-shadow:0 6px 16px rgba(34,197,94,.25)}
.sg-btn-ana:hover:not(:disabled){background:linear-gradient(135deg,#86efac,#22c55e)}
.sg-btn-su{border-color:rgba(125,211,252,.35);background:rgba(125,211,252,.1);color:#bae6fd}
.sg-btn-tam{width:100%}
.sg-btn-buyuk{min-height:52px;font-size:15.5px;border-radius:15px}
.sg-akordeon-ust{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:4px 2px 10px}
.sg-h3{color:#fff;font-size:18px;font-weight:900;margin:0}
.sg-anahtar{display:inline-flex;align-items:center;gap:8px;color:#94a3b8;font-size:12.5px;font-weight:750;cursor:pointer;user-select:none}
.sg-anahtar input{position:absolute;opacity:0;width:1px;height:1px}
.sg-anahtar-iz{width:34px;height:20px;border-radius:99px;background:rgba(255,255,255,.12);position:relative;transition:background .2s}
.sg-anahtar-iz span{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#e2e8f0;transition:transform .2s}
.sg-anahtar input:checked+.sg-anahtar-iz{background:#22c55e}
.sg-anahtar input:checked+.sg-anahtar-iz span{transform:translateX(14px)}
.sg-anahtar input:focus-visible+.sg-anahtar-iz{outline:2px solid #86efac;outline-offset:2px}
.sg-akordeon{display:grid;gap:10px;margin-bottom:18px}
.sg-bolum{border-radius:18px;background:linear-gradient(170deg,rgba(255,255,255,.055),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);
  box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 8px 20px rgba(0,0,0,.2);overflow:hidden;transition:border-color .2s}
.sg-bolum.acik{border-color:color-mix(in srgb,var(--r) 40%,transparent)}
.sg-bolum-bas{width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;background:none;border:none;cursor:pointer;text-align:left;color:inherit}
.sg-bolum-bas:focus-visible{outline:2px solid var(--r);outline-offset:-2px;border-radius:18px}
.sg-bolum-ikon{flex:0 0 auto;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:19px;
  background:color-mix(in srgb,var(--r) 20%,transparent);box-shadow:0 1px 0 rgba(255,255,255,.08) inset}
.sg-bolum-metin{flex:1;min-width:0}
.sg-bolum-ad{display:block;color:#fff;font-weight:900;font-size:15px}
.sg-bolum-alt{display:block;color:#94a3b8;font-size:11.8px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sg-bolum-sag{display:flex;align-items:baseline;gap:3px;white-space:nowrap}
.sg-bolum-sag b{color:#fff;font-size:18px;font-weight:900;font-variant-numeric:tabular-nums}
.sg-bolum-sag small{color:#94a3b8;font-size:11px;font-weight:800}
.sg-chevron{flex:0 0 auto;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:#94a3b8;background:rgba(255,255,255,.05);font-size:16px;line-height:1;padding-bottom:5px;transition:transform .25s}
.sg-bolum.acik .sg-chevron{transform:rotate(180deg);padding:5px 0 0;color:var(--r)}
.sg-bolum-govde{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s ease}
.sg-bolum.acik .sg-bolum-govde{grid-template-rows:1fr}
.sg-bolum-ic{overflow:hidden;min-height:0}
.sg-bolum-pad{padding:2px 14px 14px;border-top:1px solid rgba(255,255,255,.06);display:grid;gap:12px;padding-top:12px}
.sg-serit-bar{display:flex;height:6px;border-radius:99px;overflow:hidden;gap:2px}
.sg-serit-bar span{display:block;height:100%}
.sg-serit-etiket{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;font-weight:800;margin-top:6px}
.sg-liste{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.sg-kayit{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:13px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.05);flex-wrap:wrap}
.sg-kayit-ana{flex:1;min-width:160px}
.sg-kayit-ad{color:#f1f5f9;font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.sg-kayit-alt{color:#94a3b8;font-size:11.5px;margin-top:3px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.sg-pky{display:inline-flex;gap:8px}
.sg-pky i{font-style:normal;font-weight:800}
.sg-kayit-kcal{color:#fff;font-weight:900;font-size:16px;white-space:nowrap;font-variant-numeric:tabular-nums}
.sg-kayit-kcal small{color:#94a3b8;font-size:10.5px;margin-left:2px}
.sg-kayit-eylem{display:flex;gap:6px}
.sg-mini{height:32px;padding:0 11px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#e2e8f0;font-weight:800;font-size:12px}
.sg-mini:hover{background:rgba(255,255,255,.1)}
.sg-mini-sil{border-color:rgba(251,113,133,.3);background:rgba(251,113,133,.08);color:#fda4af}
.sg-rozet{font-size:10.5px;font-weight:800;color:#bae6fd;background:rgba(125,211,252,.12);border-radius:99px;padding:2px 7px}
.sg-bos-metin{color:#94a3b8;font-size:13px;margin:0}
.sg-bolum-eylem{display:flex;gap:8px;flex-wrap:wrap}
.sg-dipnot{color:#64748b;font-size:11.5px;line-height:1.55;margin:0}
.sg-bardaklar{display:flex;gap:6px;flex-wrap:wrap}
.sg-bardak{width:22px;height:30px;border-radius:4px 4px 7px 7px;border:2px solid rgba(125,211,252,.35);background:linear-gradient(0deg,rgba(125,211,252,0) 0%,rgba(125,211,252,0) 100%);transition:background .3s}
.sg-bardak.dolu{background:linear-gradient(0deg,#38bdf8,#7dd3fc);border-color:#7dd3fc}
.sg-form-satir{display:grid;grid-template-columns:2fr 1fr;gap:10px}
.sg-form-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.sg-alan{display:grid;gap:6px;min-width:0}
.sg-alan span{color:#cbd5e1;font-size:12px;font-weight:800}
.sg-alan input,.sg-alan select,.sg-not,.sg-satir-ad{width:100%;height:46px;border-radius:12px;padding:0 12px;background:rgba(0,0,0,.25);border:1.5px solid rgba(255,255,255,.12);color:#fff;font-size:15px;font-weight:650;outline:none;box-sizing:border-box}
.sg-not{height:auto;padding:12px;line-height:1.55;resize:vertical;font-family:inherit}
.sg-alan input:focus,.sg-alan select:focus,.sg-not:focus,.sg-satir-ad:focus,.sg-arama:focus-within{border-color:#4ade80}
/* Ekleme sayfası */
.sg-perde{position:fixed;inset:0;z-index:9000;background:rgba(2,6,4,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:sgPerde .2s ease}
.sg-sayfa{width:100%;max-width:640px;max-height:min(860px,calc(100vh - 40px));display:flex;flex-direction:column;border-radius:24px;overflow:hidden;
  background:linear-gradient(170deg,#11241c,#0a1612);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 80px rgba(0,0,0,.55);animation:sgSayfa .25s ease}
.sg-sayfa-bas{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
.sg-sayfa-baslik{flex:1;min-width:0;color:#fff;font-weight:900;font-size:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sg-eklendi{font-size:11.5px;color:#86efac;background:rgba(74,222,128,.12);border-radius:99px;padding:3px 9px;font-weight:800}
.sg-ogun-sec{display:flex;gap:6px;padding:12px 16px 0;overflow-x:auto;scrollbar-width:none}
.sg-sekmeler{display:flex;gap:4px;margin:12px 16px 0;padding:4px;border-radius:14px;background:rgba(0,0,0,.25)}
.sg-sayfa-govde .sg-sekmeler{margin:0}
.sg-sekme{flex:1;height:38px;border-radius:11px;border:none;background:none;color:#94a3b8;font-weight:850;font-size:13px;cursor:pointer;white-space:nowrap;padding:0 8px}
.sg-sekme.secili{background:rgba(255,255,255,.1);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.sg-sayfa-govde{padding:14px 16px 18px;overflow-y:auto;flex:1}
.sg-cipler{display:flex;gap:6px;flex-wrap:wrap}
.sg-cip{--r:#4ade80;height:34px;padding:0 12px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#cbd5e1;font-weight:800;font-size:12.5px;white-space:nowrap;transition:background .15s,border-color .15s}
.sg-cip.secili{background:color-mix(in srgb,var(--r) 22%,transparent);border-color:color-mix(in srgb,var(--r) 60%,transparent);color:#fff}
.sg-arama{display:flex;align-items:center;gap:8px;height:50px;border-radius:14px;padding:0 8px 0 14px;background:rgba(0,0,0,.28);border:1.5px solid rgba(255,255,255,.12)}
.sg-arama input{flex:1;min-width:0;background:none;border:none;outline:none;color:#fff;font-size:15.5px;font-weight:650}
.sg-arama button{width:32px;height:32px;border-radius:9px;border:none;background:rgba(255,255,255,.08);color:#cbd5e1;cursor:pointer;font-weight:900}
.sg-sonuclar{list-style:none;margin:0;padding:0;display:grid;gap:5px}
.sg-sonuc{width:100%;display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:13px;cursor:pointer;text-align:left;border:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.18);color:inherit}
.sg-sonuc:hover{background:rgba(255,255,255,.06)}
.sg-sonuc-ikon{font-size:18px;flex:0 0 auto}
.sg-sonuc-metin{flex:1;min-width:0}
.sg-sonuc-ad{display:block;color:#f1f5f9;font-weight:800;font-size:14px}
.sg-sonuc-ad em{font-style:normal;color:#94a3b8;font-weight:700}
.sg-sonuc-alt{display:block;color:#94a3b8;font-size:11.5px;margin-top:2px}
.sg-sonuc-alt b{color:${RENK.kalori}}
.sg-sonuc-ekle{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(74,222,128,.14);color:#86efac;font-weight:900;font-size:18px;flex:0 0 auto}
.sg-secili{display:flex;align-items:center;gap:11px;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.sg-secili b{display:block;color:#fff;font-size:15.5px}
.sg-secili small{display:block;color:#94a3b8;font-size:11.5px;margin-top:2px}
.sg-adimci{display:flex;align-items:center;gap:8px}
.sg-adimci button{width:50px;height:50px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:22px;font-weight:900;cursor:pointer}
.sg-adimci input{flex:1;min-width:0;height:50px;border-radius:14px;text-align:center;background:rgba(0,0,0,.25);border:1.5px solid rgba(255,255,255,.12);color:#fff;font-size:20px;font-weight:900;outline:none}
.sg-adimci span{color:#94a3b8;font-weight:800;font-size:13px}
.sg-deger-ozeti{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 14px;border-radius:16px;background:rgba(255,122,89,.07);border:1px solid rgba(255,122,89,.22)}
.sg-deger-kcal b{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}
.sg-deger-kcal small{display:block;color:#94a3b8;font-size:11px;font-weight:800}
.sg-deger-makro{flex:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;min-width:220px}
.sg-deger-makro span{border-left:3px solid var(--r);padding-left:8px}
.sg-deger-makro i{display:block;font-style:normal;color:#94a3b8;font-size:10.5px;font-weight:800}
.sg-deger-makro b{color:#fff;font-size:14px;font-weight:900}
.sg-foto-alan{display:grid;place-items:center;gap:8px;text-align:center;padding:34px 18px;border-radius:18px;cursor:pointer;border:2px dashed rgba(125,211,252,.35);background:rgba(125,211,252,.06);color:#e2e8f0}
.sg-foto-alan b{font-size:15.5px}
.sg-foto-alan small{color:#94a3b8;font-size:12px;max-width:360px;line-height:1.5}
.sg-foto-onizleme{width:100%;max-height:240px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,.1)}
.sg-yukleniyor{display:grid;gap:10px;color:#cbd5e1;font-weight:800;font-size:13.5px}
.sg-spin{display:inline-block;width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.2);border-top-color:#7dd3fc;animation:sgDon 0.8s linear infinite;vertical-align:-3px;margin-right:8px}
.sg-iskelet{height:52px;border-radius:13px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.1),rgba(255,255,255,.04));background-size:200% 100%;animation:sgParilti 1.2s ease infinite}
.sg-foto-satir{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:13px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06)}
.sg-foto-satir.pasif{opacity:.5}
.sg-onay input{width:20px;height:20px;accent-color:#22c55e;margin-top:12px}
.sg-satir-ad{height:38px;font-size:14px}
.sg-gram{display:inline-flex;align-items:center;gap:4px;font-weight:800;color:#cbd5e1}
.sg-gram input{width:64px;height:30px;border-radius:9px;background:rgba(0,0,0,.25);border:1.5px solid rgba(255,255,255,.14);color:#fff;font-weight:850;text-align:center;outline:none}
.sg-kaynak{color:#64748b;font-size:11px;font-weight:700}
.sg-bos-kutu{display:grid;gap:6px;padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.14);color:#cbd5e1;font-size:13px;line-height:1.55}
.sg-bos-kutu b{color:#fff}
.sg-hata{border-color:rgba(251,113,133,.35);background:rgba(251,113,133,.06)}
@keyframes sgPerde{from{opacity:0}to{opacity:1}}
@keyframes sgSayfa{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
@keyframes sgDon{to{transform:rotate(360deg)}}
@keyframes sgParilti{from{background-position:200% 0}to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.sg-bolum-govde,.sg-chevron,.sg-bar span,.sg-makro-bar span{transition:none}.sg-perde,.sg-sayfa{animation:none}}
@media (max-width:760px){
  .sg-makrolar{grid-template-columns:repeat(3,minmax(0,1fr))}
  .sg-uzun{display:none}.sg-kisa{display:inline}
}
@media (max-width:640px){
  .sg-ozet{padding:16px 14px 14px;border-radius:20px}
  .sg-makro{padding:9px 9px 8px}
  .sg-makro-deger{font-size:19px}
  .sg-hizli{grid-template-columns:1fr 1fr}
  .sg-hizli .sg-btn:first-child{grid-column:1/-1}
  .sg-perde{padding:0;align-items:stretch}
  .sg-sayfa{max-width:none;max-height:none;height:100%;border-radius:0;border:none}
  .sg-form-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sg-form-satir{grid-template-columns:1fr 1fr}
  .sg-kayit-ana{min-width:0;flex-basis:100%}
  .sg-kayit-kcal{margin-right:auto}
}
`;
