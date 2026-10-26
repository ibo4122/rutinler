"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Ortak "Geri Al" sistemi.
//
// Sayfa, kaydedilen veri dilimlerini (gelir, krediler, tatil, sağlık, İstanbul…)
// izler: biri değişince önceki hali saklanır ve altta "Kayıt güncellendi · Geri Al"
// bildirimi çıkar. Geri Al, o işlemden önceki veriyi bütünüyle geri yükler.
// Böylece her bileşene ayrı geri alma kodu yazmak gerekmez; yeni bir veri alanı
// eklendiğinde page.js'teki listeye eklemek yeter.
//
// Bileşenler isterse bildirimi adlandırır: geriAl.etiketle("Kahvaltıdan silindi").
// Kullanıcının yapmadığı değişiklikler (canlı fiyat güncellemesi gibi) için
// geriAl.sessiz() çağrılır; o değişiklik geri alma geçmişine girmez.

const GeriAlContext = createContext({ etiketle: () => {}, sessiz: () => {} });
export const useGeriAl = () => useContext(GeriAlContext);

const BIRLESTIR_MS = 1500; // bu sürede art arda gelen değişiklikler (yazarken) tek işlem
const GORUNUR_MS = 6500;

export function useGeriAlKaydi(dilimler, setterlar, aktif) {
  const onceki = useRef(null);
  const sessizRef = useRef(false);
  const etiketRef = useRef("");
  const [kayit, setKayit] = useState(null);

  useEffect(() => {
    if (!aktif) { onceki.current = null; setKayit(null); return; }
    if (!onceki.current || sessizRef.current) {
      onceki.current = dilimler;
      sessizRef.current = false;
      etiketRef.current = "";
      return;
    }
    const degisen = Object.keys(dilimler).filter((k) => dilimler[k] !== onceki.current[k]);
    if (!degisen.length) return;
    const eski = Object.fromEntries(degisen.map((k) => [k, onceki.current[k]]));
    onceki.current = dilimler;
    const etiket = etiketRef.current;
    etiketRef.current = "";
    const simdi = Date.now();
    setKayit((k) => {
      // Yazarken her tuş ayrı işlem olmasın: aynı alandaki hızlı değişikliklerde
      // en eski hali koru, yalnızca zamanı uzat.
      if (k && !etiket && simdi - k.zaman < BIRLESTIR_MS && degisen.every((d) => d in k.eski)) {
        return { ...k, zaman: simdi };
      }
      return { id: simdi, zaman: simdi, eski, mesaj: etiket || "Kayıt güncellendi" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, ...Object.values(dilimler)]);

  useEffect(() => {
    if (!kayit) return;
    const t = setTimeout(() => setKayit(null), GORUNUR_MS);
    return () => clearTimeout(t);
  }, [kayit]);

  const geriAl = useCallback(() => {
    if (!kayit) return;
    sessizRef.current = true;
    for (const [k, v] of Object.entries(kayit.eski)) setterlar[k]?.(v);
    setKayit({ id: Date.now(), zaman: Date.now(), eski: null, mesaj: "Geri alındı" });
  }, [kayit, setterlar]);

  const api = useRef({
    etiketle: (m) => { etiketRef.current = m; },
    sessiz: () => { sessizRef.current = true; },
  }).current;

  return { kayit, geriAl, kapat: () => setKayit(null), api };
}

export function GeriAlSaglayici({ api, kayit, geriAl, kapat, children }) {
  return (
    <GeriAlContext.Provider value={api}>
      {children}
      <GeriAlBildirim kayit={kayit} geriAl={geriAl} kapat={kapat} />
    </GeriAlContext.Provider>
  );
}

function GeriAlBildirim({ kayit, geriAl, kapat }) {
  return (
    <div aria-live="polite" style={{
      position: "fixed", left: 0, right: 0, bottom: 18, zIndex: 9999, display: "flex", justifyContent: "center",
      pointerEvents: "none", padding: "0 16px",
    }}>
      {kayit ? (
        <div key={kayit.id} role="status" style={{
          pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12, maxWidth: 520, width: "100%",
          padding: "10px 10px 10px 16px", borderRadius: 16, background: "rgba(15,18,28,.96)",
          border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 14px 40px rgba(0,0,0,.45)",
          color: "#f1f5f9", fontSize: 14, fontWeight: 650, animation: "geriAlGir .22s ease-out",
        }}>
          <span aria-hidden style={{ fontSize: 16 }}>{kayit.eski ? "✓" : "↺"}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{kayit.mesaj}</span>
          {kayit.eski ? (
            <button type="button" onClick={geriAl} style={{
              height: 36, padding: "0 14px", borderRadius: 11, cursor: "pointer", border: "none",
              background: "#fde68a", color: "#1c1406", fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap",
            }}>Geri Al</button>
          ) : null}
          <button type="button" onClick={kapat} aria-label="Bildirimi kapat" style={{
            width: 32, height: 32, borderRadius: 10, cursor: "pointer", border: "none",
            background: "rgba(255,255,255,.08)", color: "#cbd5e1", fontSize: 15, fontWeight: 900,
          }}>✕</button>
        </div>
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: "@keyframes geriAlGir{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" }} />
    </div>
  );
}

// Detay ekranlarının sol üstündeki tek tip geri düğmesi. Kaydedilmemiş giriş
// varsa önce sorar. kaydedilmemis bir değer ya da (ref okuyan) bir fonksiyon olabilir.
export function GeriButon({ onClick, kaydedilmemis, etiket = "Geri", renk = "#e2e8f0", style }) {
  return (
    <button type="button"
      onClick={() => {
        const kirli = typeof kaydedilmemis === "function" ? kaydedilmemis() : kaydedilmemis;
        if (kirli && !window.confirm("Kaydedilmemiş bilgiler silinecek. Yine de geri dönmek istiyor musun?")) return;
        onClick();
      }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px 0 10px",
        borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,.14)",
        background: "rgba(255,255,255,.06)", color: renk, fontSize: 14, fontWeight: 800, ...style,
      }}>
      <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>←</span>{etiket}
    </button>
  );
}
