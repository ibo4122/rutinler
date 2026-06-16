"use client";

import { useState } from "react";

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
    const directNumber = pickNumber(direct, direct?.price, direct?.TRY, direct?.try, direct?.USD, direct?.usd);
    const lowerNumber = pickNumber(lower, lower?.price, lower?.TRY, lower?.try, lower?.USD, lower?.usd);
    const upperNumber = pickNumber(upper, upper?.price, upper?.TRY, upper?.try, upper?.USD, upper?.usd);
    const number = pickNumber(directNumber, lowerNumber, upperNumber);
    if (number > 0) return number;
  }
  return 0;
}

export default function LiveMarketUpdater({ investments, setInvestments }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateLivePrices = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/market-prices", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.prices) {
        setMessage("Fiyat verisi alınamadı");
        return;
      }

      const prices = payload.prices;
      const gold = prices.gold || {};
      const crypto = prices.crypto || {};
      const stocks = prices.stocks || {};
      const forex = prices.forex || {};
      const usdTryRate = pickNumber(prices.usdTryRate, prices.usdTry, forex.USDTRY, forex.USD);

      let updateCount = 0;

      setInvestments((current) => {
        const nextGold = (current.gold || []).map((item) => {
          const goldType = item.goldType || "GRAM";
          const price = findPrice(gold, [goldType, normalizeSymbol(item.title), item.title, "GRAM"]);
          if (price <= 0) return item;
          updateCount += 1;
          return {
            ...item,
            currentPrice: price,
            currentPriceTry: price,
            currency: "TRY",
            livePriceSource: "Canlı Altın",
          };
        });

        const nextCrypto = (current.crypto || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const price = findPrice(crypto, [symbol, `${symbol}USDT`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return {
            ...item,
            currentPrice: price,
            currency: item.currency || "USD",
            usdTryRate,
            livePriceSource: "Canlı Kripto",
          };
        });

        const nextStocks = (current.stocks || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const price = findPrice(stocks, [symbol, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return {
            ...item,
            currentPrice: price,
            livePriceSource: "Canlı Hisse",
          };
        });

        const nextForex = (current.forex || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const currency = item.currency || symbol || "USD";
          const price = findPrice(forex, [symbol, currency, `${currency}TRY`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return {
            ...item,
            currentPrice: price,
            currency,
            livePriceSource: "Canlı Döviz",
          };
        });

        return {
          ...current,
          gold: nextGold,
          crypto: nextCrypto,
          stocks: nextStocks,
          forex: nextForex,
        };
      });

      setTimeout(() => {
        setMessage(updateCount > 0 ? `${updateCount} fiyat güncellendi` : "Eşleşen kayıt bulunamadı");
      }, 0);
    } catch (error) {
      console.log(error);
      setMessage("Fiyat verisi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
      {message ? <span className="sectionDescription">{message}</span> : null}
      <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={loading}>
        {loading ? "Güncelleniyor" : "Fiyat Güncelle"}
      </button>
    </div>
  );
}

