// Varlık değer/maliyet hesapları. page.js ve MarketUniversePanel'de kopyalanmıştı.

export function assetUnitValue(item) {
  const quantity = Number(item?.quantity || 0);
  const currentPrice = Number(item?.currentPrice || 0);
  return quantity > 0 && currentPrice > 0 ? quantity * currentPrice : 0;
}

export function assetUnitCost(item) {
  const quantity = Number(item?.quantity || 0);
  const buyPrice = Number(item?.buyPrice || 0);
  return quantity > 0 && buyPrice > 0 ? quantity * buyPrice : 0;
}

export function assetValueTry(item) {
  const quantity = Number(item?.quantity || 0);
  const currentPriceTry = Number(item?.currentPriceTry || 0);
  if (quantity > 0 && currentPriceTry > 0) return quantity * currentPriceTry;

  const value = assetUnitValue(item);
  const currency = item?.currency || "TRY";
  const usdTryRate = Number(item?.usdTryRate || 0);

  if ((currency === "USD" || currency === "USDT") && usdTryRate > 0) return value * usdTryRate;
  return value;
}

export function assetCostTry(item) {
  const quantity = Number(item?.quantity || 0);
  const buyPriceTry = Number(item?.buyPriceTry || 0);
  if (quantity > 0 && buyPriceTry > 0) return quantity * buyPriceTry;

  const cost = assetUnitCost(item);
  const currency = item?.currency || "TRY";
  const usdTryRate = Number(item?.usdTryRate || 0);

  if ((currency === "USD" || currency === "USDT") && usdTryRate > 0) return cost * usdTryRate;
  return cost;
}
