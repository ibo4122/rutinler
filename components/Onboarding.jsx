"use client";

import { useState } from "react";
import ModulePicker from "./ModulePicker";
import { DEFAULT_PREFERENCES } from "../lib/preferences";

// Yeni kullanici karsilama akisi: ilk giriste bir kez gosterilir. Amac, bos ekran
// yerine kisiyi karsilamak, ne yapabilecegini anlatmak ve tum hesaplarin dayandigi
// temel bilgiyi (gelir) almak. Tamamlanma bilgisi kullanicinin bulut verisinde tutulur.

const FEATURES = [
  { icon: "📊", title: "Genel Bakış", desc: "Net değerin, gelir-gider dengen ve portföyün tek ekranda." },
  { icon: "💰", title: "Gelir / Gider", desc: "Maaş, ek gelir, kredi, kart ve diğer giderlerini yönet." },
  { icon: "📈", title: "Yatırımlar", desc: "Hisse, TEFAS fonu, kripto, altın ve döviz — fiyatlar canlı gelir." },
  { icon: "🎯", title: "Finansal Hedefler", desc: "Ev, araç gibi hedefler için finansman açığını hesapla." },
  { icon: "🗓️", title: "Rutinler & Hedefler", desc: "Günlük görevlerini ve kişisel hedeflerini takip et." },
  { icon: "📝", title: "Notlar", desc: "Zengin metin editörü ve yapay zekâ destekli ders notları." },
];

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(2,6,23,.82)",
  backdropFilter: "blur(10px)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  overflowY: "auto",
};

const card = {
  width: "min(680px, 100%)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 26,
  padding: "30px 28px",
  background: "linear-gradient(150deg, rgba(15,23,42,.96), rgba(49,46,129,.44))",
  boxShadow: "0 30px 80px rgba(0,0,0,.5)",
  color: "#f8fafc",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(2,6,23,.6)",
  color: "#f8fafc",
  borderRadius: 14,
  padding: "13px 15px",
  outline: "none",
  fontSize: 16,
};

// "12.500" gibi girisleri de kabul et
const onlyMoney = (v) => String(v || "").replace(/[^\d.,]/g, "");

export default function Onboarding({ fullName, onFinish }) {
  const [step, setStep] = useState(0);
  const [salary, setSalary] = useState("");
  const [meal, setMeal] = useState("");
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);

  const firstName = String(fullName || "").trim().split(" ")[0] || "";
  const financeAcik = prefs?.tabs?.finance !== false;

  const finish = () => onFinish?.({ salary: salary.trim(), mealAllowance: meal.trim(), preferences: prefs });

  return (
    <div style={overlay}>
      <div style={card}>
        {/* Adım göstergesi */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i <= step ? "linear-gradient(90deg,#60a5fa,#a78bfa)" : "rgba(255,255,255,.14)",
                transition: "background .3s ease",
              }}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900 }}>
              Hoş geldin{firstName ? `, ${firstName}` : ""}!
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px" }}>
              Burası kişisel finans ve yaşam yönetim panelin. Verilerin yalnızca sana ait —
              başka kimse göremez. Kısaca neler yapabileceğine bakalım:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: "13px 14px", background: "rgba(2,6,23,.42)" }}>
                  <div style={{ fontSize: 20 }}>{f.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 4 }}>{f.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11.5, marginTop: 3, lineHeight: 1.45 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧩</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900 }}>Neleri kullanacaksın?</h2>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Kullanmayacağın bölümleri kapat — panelin sade kalsın. Örneğin BES'in yoksa
              ya da fon almıyorsan onları şimdi kapatabilirsin. <strong>Her şeyi sonradan değiştirebilirsin.</strong>
            </p>
            <div style={{ maxHeight: "46vh", overflowY: "auto", paddingRight: 4 }}>
              <ModulePicker prefs={prefs} onChange={setPrefs} compact />
            </div>
          </>
        ) : step === 2 ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900 }}>Aylık gelirin</h2>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, margin: "0 0 22px" }}>
              Bütçe hesaplarının temeli bu. Şimdi girebilir ya da atlayıp sonra
              <strong> Gelir / Gider</strong> sekmesinden ekleyebilirsin.
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Net Maaş (₺)</span>
                <input style={inputStyle} inputMode="decimal" value={salary} placeholder="Örn: 45.000" autoFocus
                       onChange={(e) => setSalary(onlyMoney(e.target.value))} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Yemek Kartı (₺) — opsiyonel</span>
                <input style={inputStyle} inputMode="decimal" value={meal} placeholder="Örn: 5.000"
                       onChange={(e) => setMeal(onlyMoney(e.target.value))} />
                <span style={{ display: "block", color: "#64748b", fontSize: 11, marginTop: 5 }}>
                  Ayrı gösterilir, gelire dahil edilmez.
                </span>
              </label>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚀</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900 }}>Hazırsın!</h2>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Panelin hazır. Başlamak için birkaç ipucu:
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["📈", "Yatırım ekle", "Yatırımlar → Portföy Kayıtlarım'dan hisse/fon/kripto ekle, ardından Fiyat Güncelle'ye bas — fiyatlar otomatik gelsin."],
                ["👁", "Tutarları gizle", "Başkasının yanındayken sağ üstteki göz simgesiyle tüm tutarları maskeleyebilirsin."],
                ["✋", "Sekmeleri sırala", "Sekmeleri sürükleyerek kendine göre dizebilirsin."],
              ].map(([icon, t, d]) => (
                <div key={t} style={{ display: "flex", gap: 12, border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, padding: "12px 14px", background: "rgba(2,6,23,.42)" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 13 }}>{t}</span>
                    <span style={{ display: "block", color: "#94a3b8", fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{d}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Butonlar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 26 }}>
          <button type="button" onClick={finish}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", padding: "8px 4px" }}>
            {step === 3 ? "" : "Atla"}
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 ? (
              <button type="button" className="secondaryButton"
                      onClick={() => setStep((s) => (s === 3 && !financeAcik ? 1 : s - 1))}>Geri</button>
            ) : null}
            {step < 3 ? (
              <button type="button" className="premiumButton"
                      onClick={() => setStep((s) => (s === 1 && !financeAcik ? 3 : s + 1))}>Devam</button>
            ) : (
              <button type="button" className="premiumButton" onClick={finish}>Panele Git</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
