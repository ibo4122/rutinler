// Kullanici bazli modul tercihleri. Herkesin BES'i, fonu ya da kripto yatirimi
// olmayabilir; kullanmadigi alanlar arayuzde hic gorunmesin diye burada tutulur.
// Tercihler kullanicinin bulut verisinde saklanir (cihazlar arasi tutarli).

export const TAB_MODULES = [
  { id: "finance", label: "Gelir / Gider", icon: "💰", desc: "Maaş, ek gelir, kredi, kart ve giderler" },
  { id: "investments", label: "Yatırımlar", icon: "📈", desc: "Hisse, fon, kripto, altın, döviz ve canlı fiyatlar" },
  { id: "fingoals", label: "Finansal Hedefler", icon: "🎯", desc: "Ev, araç gibi hedefler için finansman planı" },
  { id: "goals", label: "Hedeflerim", icon: "✨", desc: "Kişisel gelişim hedefleri ve ilerleme takibi" },
  { id: "routines", label: "Haftalık Rutin", icon: "🗓️", desc: "Günlük görevler ve takvim" },
  { id: "notes", label: "Notlar", icon: "📝", desc: "Zengin metin editörü ve yapay zekâ desteği" },
];

// Yatirimlar sekmesi icindeki alt bolumler
export const INVESTMENT_MODULES = [
  { id: "bes", label: "BES Projeksiyon", icon: "🏦", desc: "Bireysel emeklilik birikimi ve çıkış hesabı" },
  { id: "market", label: "Canlı Piyasa Merkezi", icon: "🌐", desc: "BIST, ABD hisseleri, kripto, fon ve metal fiyatları" },
  { id: "stocks", label: "Hisse", icon: "📊", desc: "BIST ve ABD hisse kayıtların" },
  { id: "funds", label: "Fon (TEFAS)", icon: "🧾", desc: "Yatırım fonu kayıtların" },
  { id: "crypto", label: "Kripto", icon: "₿", desc: "Coin ve token kayıtların" },
  { id: "gold", label: "Altın / Metal", icon: "🪙", desc: "Gram altın, gümüş ve diğer metaller" },
  { id: "forex", label: "Döviz / Nakit", icon: "💵", desc: "USD, EUR ve nakit pozisyonların" },
];

export const DEFAULT_PREFERENCES = {
  tabs: Object.fromEntries(TAB_MODULES.map((m) => [m.id, true])),
  inv: Object.fromEntries(INVESTMENT_MODULES.map((m) => [m.id, true])),
};

// Kayitli tercihi guvenli sekilde normalize et: bilinmeyen anahtarlari at,
// eksik olanlari varsayilan (acik) kabul et — yeni modul eklenince gizlenmesin.
export function normalizePreferences(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const pick = (list, saved) =>
    Object.fromEntries(
      list.map((m) => [m.id, saved && typeof saved === "object" && m.id in saved ? saved[m.id] !== false : true])
    );
  return {
    tabs: pick(TAB_MODULES, src.tabs),
    inv: pick(INVESTMENT_MODULES, src.inv),
  };
}

// Genel Bakis her zaman acik; digerleri tercihe bagli.
export function isTabEnabled(prefs, tabId) {
  if (tabId === "overview" || tabId === "admin" || tabId === "trading") return true;
  return prefs?.tabs?.[tabId] !== false;
}

export function isInvEnabled(prefs, moduleId) {
  return prefs?.inv?.[moduleId] !== false;
}
