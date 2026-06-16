"use client";

import { useState } from "react";

const cryptoAliases = {
  BTC: ["BTC", "BITCOIN"],
  ETH: ["ETH", "ETHER", "ETHEREUM"],
  SOL: ["SOL", "SOLANA"],
  BNB: ["BNB", "BINANCE"],
  XRP: ["XRP", "RIPPLE"],
  ADA: ["ADA", "CARDANO"],
  AVAX: ["AVAX", "AVALANCHE"],
  DOGE: ["DOGE", "DOGECOIN"],
  LINK: ["LINK", "CHAINLINK"],
  DOT: ["DOT", "POLKADOT"],
  MATIC: ["MATIC", "POLYGON"],
  TRX: ["TRX", "TRON"],
  LTC: ["LTC", "LITECOIN"],
  BCH: ["BCH", "BITCOINCASH"],
  ATOM: ["ATOM", "COSMOS"],
  NEAR: ["NEAR"],
  APT: ["APT", "APTOS"],
  ARB: ["ARB", "ARBITRUM"],
  OP: ["OP", "OPTIMISM"],
};

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

function findDirectPrice(source, keys) {
  if (!source) return 0;
  for (const key of keys) {
    const direct = source[key];
    const lower = source[String(key).toLowerCase()];
    const upper = source[String(key).toUpperCase()];
    const number = pickNumber(direct, lower, upper, direct?.price, lower?.price, upper?.price);
    if (number > 0) return number;
  }
  return 0;
}

function findCryptoSymbol(title) {
  const normalized = normalizeSymbol(title);
  for (const [symbol, aliases] of Object.entries(cryptoAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) return symbol;
  }
  return normalized;
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
          const price = findDirectPrice(gold, [goldType, normalizeSymbol(item.title), item.title, "GRAM"]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currentPriceTry: price, currency: "TRY", livePriceSource: "Canlı Altın" };
        });

        const nextCrypto = (current.crypto || []).map((item) => {
          const symbol = findCryptoSymbol(item.title);
          const price = findDirectPrice(crypto, [symbol, `${symbol}USDT`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currency: item.currency || "USD", usdTryRate, livePriceSource: "Canlı Kripto" };
        });

        const nextStocks = (current.stocks || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const price = findDirectPrice(stocks, [symbol, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, livePriceSource: "Canlı Hisse" };
        });

        const nextForex = (current.forex || []).map((item) => {
          const symbol = normalizeSymbol(item.title);
          const currency = item.currency || symbol || "USD";
          const price = findDirectPrice(forex, [symbol, currency, `${currency}TRY`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currency, livePriceSource: "Canlı Döviz" };
        });

        return { ...current, gold: nextGold, crypto: nextCrypto, stocks: nextStocks, forex: nextForex };
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

