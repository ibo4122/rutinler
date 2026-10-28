"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Uygulama içi gezinmeyi tarayıcı geçmişine bağlar.
//
// Sorun: alt sayfalar (şehir, il, tur, mekân detayı…) yalnızca React durumuyla
// açılıyordu; telefonun ya da tarayıcının "geri" hareketi uygulamadan çıkıyor,
// ekrandaki "← Geri" ise bazen yanlış yere (ör. Defter yerine Keşfet'e) dönüyordu.
//
// Çözüm: her bölüm ("alan") kendi gezinme yığınını tutar ve her adımda
// history.pushState ile bir geçmiş kaydı ekler. Kayıtta TÜM alanların o anki
// sırası saklanır ({ tatil: 2, turkiye: 1 }); böylece tarayıcı geri gidince her
// alan kendi önceki haline döner — iç içe bölümler (Tatil › Türkiye Rehberi)
// birbirini bozmaz. Ekrandaki "← Geri" de aynı yolu (history.back) kullanır;
// iki geri hareketi her zaman aynı yere gider.
//
// Next.js 14.1+ yerel pushState'i destekler (adres değişmez, sayfa yenilenmez).

const ANAHTAR = "rutinlerGezinme";

function gecmisDurumu() {
  if (typeof window === "undefined") return {};
  return (window.history.state && window.history.state[ANAHTAR]) || {};
}

export function useGezinme(alan, ilk) {
  const yigin = useRef([ilk]);
  const [sira, setSira] = useState(0);
  const [, setSurum] = useState(0);
  const siraRef = useRef(0);
  siraRef.current = sira;

  useEffect(() => {
    // Bu alan bu geçmiş kaydında henüz yoksa başlangıç sırasını yaz.
    const g = gecmisDurumu();
    if (g[alan] === undefined) {
      window.history.replaceState({ ...(window.history.state || {}), [ANAHTAR]: { ...g, [alan]: 0 } }, "");
    }
    const geriIleri = (e) => {
      const d = (e.state && e.state[ANAHTAR]) || {};
      const hedef = Math.min(Math.max(d[alan] ?? 0, 0), yigin.current.length - 1);
      if (hedef !== siraRef.current) setSira(hedef);
    };
    window.addEventListener("popstate", geriIleri);
    return () => window.removeEventListener("popstate", geriIleri);
  }, [alan]);

  // Yeni ekran: ileri geçmişi atılır, yeni durum eklenir.
  const git = useCallback((yeni) => {
    const y = yigin.current.slice(0, siraRef.current + 1);
    y.push(yeni);
    yigin.current = y;
    const yeniSira = y.length - 1;
    const g = gecmisDurumu();
    window.history.pushState({ ...(window.history.state || {}), [ANAHTAR]: { ...g, [alan]: yeniSira } }, "");
    siraRef.current = yeniSira;
    setSira(yeniSira);
  }, [alan]);

  // Aynı ekranda küçük değişiklik (ör. aramaya harf eklemek): yeni geçmiş kaydı açmaz.
  const degistir = useCallback((yeni) => {
    yigin.current = [...yigin.current.slice(0, siraRef.current), yeni, ...yigin.current.slice(siraRef.current + 1)];
    setSurum((v) => v + 1); // yeniden çiz
  }, []);

  const geri = useCallback(() => {
    if (siraRef.current > 0) window.history.back();
  }, []);

  return { durum: yigin.current[sira], git, degistir, geri, geriVar: sira > 0, adim: sira };
}
