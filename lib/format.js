// Ortak biçimlendirme yardımcıları. Birden çok bileşende kopyalanmıştı; tek kaynak.

// Gizlilik (sansür) modu: açıkken para tutarları "••••" ile maskelenir (banka
// uygulamalarındaki "bakiyeyi gizle" gibi). Modül seviyesinde tutulur; üst bileşen
// her render'da setMoneyHidden ile günceller, böylece tüm money() çağrıları senkron olur.
let _moneyHidden = false;
const MASK = "••••";
export function setMoneyHidden(value) {
  _moneyHidden = !!value;
}
export function isMoneyHidden() {
  return _moneyHidden;
}
function currencySymbol(currency) {
  if (currency === "TRY") return "₺";
  if (currency === "USD" || currency === "USDT") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "";
}

export function money(value) {
  if (_moneyHidden) return `₺${MASK}`;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function pct(value) {
  return `%${Number(value || 0).toFixed(2)}`;
}

export function formatCurrency(value, currency = "TRY") {
  if (_moneyHidden) {
    const sym = currencySymbol(currency);
    return sym ? `${sym}${MASK}` : `${MASK} ${currency}`;
  }
  const number = Number(value || 0);
  if (currency === "USDT") return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 6 }).format(number)} USDT`;
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(number);
  } catch {
    return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(number)} ${currency}`;
  }
}
