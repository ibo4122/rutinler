// Ortak biçimlendirme yardımcıları. Birden çok bileşende kopyalanmıştı; tek kaynak.

export function money(value) {
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
