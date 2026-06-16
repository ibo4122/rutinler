
"use client";

import { useState } from "react";

const GOLD_TYPE_OPTIONS = [
  { value: "GRAM", label: "Gram Altın" },
  { value: "HAS", label: "Has Altın" },
  { value: "AYAR_24", label: "24 Ayar Gram" },
  { value: "AYAR_22", label: "22 Ayar Altın" },
  { value: "AYAR_18", label: "18 Ayar Altın" },
  { value: "AYAR_14", label: "14 Ayar Altın" },
  { value: "CEYREK", label: "Çeyrek Altın" },
  { value: "YARIM", label: "Yarım Altın" },
  { value: "TAM", label: "Tam Altın" },
  { value: "CUMHURIYET", label: "Cumhuriyet Altını" },
  { value: "ATA", label: "Ata Altın" },
  { value: "RESAT", label: "Reşat Altın" },
  { value: "GREMSE", label: "Gremse Altın" },
  { value: "ONS", label: "Ons Altın" },
];

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function pickNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function findPrice(source, keys) {
  if (!source) return 0;
  for (const key of keys) {
    const direct = source[key];
    const lower = source[String(key).toLowerCase()];
    const upper = source[String(key).toUpperCase()];
    const number = pickNumber(direct, lower, upper, direct?.price, direct?.try, direct?.TRY, direct?.usd, direct?.USD, lower?.price, upper?.price);
    if (number > 0) return number;
  }
  return 0;
}

export { GOLD_TYPE_OPTIONS };

export default function LiveMarketUpdater({ investments, setInvestments }) {
  const [loading, setLoading] = useState(false);

  const updateLivePrices = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/market-prices", { cache: "no-store" });
      if (!response.ok) throw new Error("market-prices api failed");
      const payload = await response.json();
      const prices = payload?.prices || payload || {};
      const gold = prices.gold || payload.gold || {};
      const crypto = prices.crypto || payload.crypto || {};
      const stocks = prices.stocks || payload.stocks || {};
      const forex = prices.forex || prices.rates || payload.forex || payload.rates || {};
      const usdTryRate = pickNumber(prices.usdTry, prices.usdTryRate, payload.usdTry, payload.usdTryRate, forex.USDTRY, forex.USD, forex.usd);

      setInvestments((current) => ({
        ...current,
        gold: (current.gold || []).map((item) => {
          const goldType = item.goldType || "GRAM";
          const currentPriceTry = findPrice(gold, [goldType, item.title, normalizeSymbol(item.title), "GRAM"]);
          return currentPriceTry > 0
            ? { ...item, currentPrice: currentPriceTry, currentPriceTry, currency: "TRY", livePriceSource: "Canlı Altın" }
            : item;
        }),
        crypto: (current.crypto || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const currentPrice = findPrice(crypto, [symbol, item.title]);
          return currentPrice > 0
            ? { ...item, currentPrice, currency: item.currency || "USD", usdTryRate, livePriceSource: "Canlı Kripto" }
            : item;
        }),
        stocks: (current.stocks || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const currentPrice = findPrice(stocks, [symbol, item.title]);
          return currentPrice > 0
            ? { ...item, currentPrice, livePriceSource: "Canlı Hisse" }
            : item;
        }),
        forex: (current.forex || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const currency = item.currency || symbol || "USD";
          const currentPrice = findPrice(forex, [symbol, currency, item.title]);
          return currentPrice > 0
            ? { ...item, currentPrice, currency, livePriceSource: "Canlı Döviz" }
            : item;
        }),
      }));
    } catch (error) {
      console.log(error);
      alert("Fiyatlar güncellenemedi. API veya veri kaynağı kontrol edilmeli.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={loading}>
      {loading ? "Güncelleniyor" : "Fiyat Güncelle"}
    </button>
  );
}

