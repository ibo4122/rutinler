"use client";

import { useState } from "react";

const cryptoAliases = {
  BTC: ["BTC", "BITCOIN"], ETH: ["ETH", "ETHER", "ETHEREUM"], SOL: ["SOL", "SOLANA"], SUI: ["SUI"],
  ENA: ["ENA", "ETHENA"], AVAX: ["AVAX", "AVALANCHE"], AIXBT: ["AIXBT"], RENDER: ["RENDER", "RNDR"],
  S: ["S", "SONIC"], ATOM: ["ATOM", "COSMOS"], ZK: ["ZK", "ZKSYNC"], LRC: ["LRC", "LOOPRING"],
  APT: ["APT", "APTOS"], FET: ["FET", "ASI"], GRT: ["GRT", "GRAPH"], NEIRO: ["NEIRO"],
  UNI: ["UNI", "UNISWAP"], PIXEL: ["PIXEL", "PIXELS"], DOGS: ["DOGS"], THL: ["THL", "THALA"],
  BNB: ["BNB", "BINANCE"], XRP: ["XRP", "RIPPLE"], ADA: ["ADA", "CARDANO"], DOGE: ["DOGE", "DOGECOIN"],
  LINK: ["LINK", "CHAINLINK"], DOT: ["DOT", "POLKADOT"], MATIC: ["MATIC", "POLYGON"], TRX: ["TRX", "TRON"],
  LTC: ["LTC", "LITECOIN"], BCH: ["BCH", "BITCOINCASH"], NEAR: ["NEAR"], ARB: ["ARB", "ARBITRUM"], OP: ["OP", "OPTIMISM"],
};

const goldAliases = {
  GRAM: ["GRAM", "GRAMALTIN", "GRAMALTINI"], CEYREK: ["CEYREK", "CEYREKALTIN", "CEYREKALTINI"],
  YARIM: ["YARIM", "YARIMALTIN", "YARIMALTINI"], TAM: ["TAM", "TAMALTIN", "TAMALTINI"],
  CUMHURIYET: ["CUMHURIYET", "CUMHURIYETALTIN", "CUMHURIYETALTINI"], ATA: ["ATA", "ATAALTIN", "ATAALTINI"],
  RESAT: ["RESAT", "RESATALTIN", "RESATALTINI", "REŞAT", "REŞATALTIN"], GREMSE: ["GREMSE", "GREMSEALTIN", "GREMSEALTINI"],
  ONS: ["ONS", "ONSALTIN", "ONSALTINI"], GUMUS: ["GUMUS", "GUMUSTRY", "GUMUSGRAM", "GÜMÜŞ"],
};

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C").replace(/[^A-Z0-9.]/g, "");
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
    const normalizedKey = normalizeSymbol(key);
    const direct = source[key];
    const normalized = source[normalizedKey];
    const lower = source[String(key).toLowerCase()];
    const upper = source[String(key).toUpperCase()];
    const number = pickNumber(direct, normalized, lower, upper, direct?.price, normalized?.price, lower?.price, upper?.price);
    if (number > 0) return number;
  }
  return 0;
}

function findCryptoSymbol(title) {
  const normalized = normalizeSymbol(title);
  for (const [symbol, aliases] of Object.entries(cryptoAliases)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) return symbol;
  }
  return normalized;
}

function findGoldSymbol(title, goldType) {
  const normalized = normalizeSymbol(`${goldType || ""} ${title || ""}`);
  for (const [symbol, aliases] of Object.entries(goldAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) return symbol;
  }
  return goldType || "GRAM";
}

export default function LiveMarketUpdater({ investments, setInvestments, onMarketData }) {
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

      onMarketData?.(payload);

      const prices = payload.prices;
      const gold = prices.gold || {};
      const crypto = prices.crypto || {};
      const stocks = prices.stocks || {};
      const forex = prices.forex || {};
      const usdTryRate = pickNumber(prices.usdTryRate, prices.usdTry, forex.USDTRY, forex.USD);
      let updateCount = 0;

      setInvestments((current) => {
        const nextGold = (current.gold || []).map((item) => {
          const symbol = findGoldSymbol(item.title, item.goldType);
          const price = findDirectPrice(gold, [symbol, item.goldType, item.title, "GRAM"]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currentPriceTry: price, currency: "TRY", goldType: symbol, livePriceSource: "Canlı Metal" };
        });

        const nextCrypto = (current.crypto || []).map((item) => {
          const symbol = findCryptoSymbol(item.title);
          const price = findDirectPrice(crypto, [symbol, `${symbol}USDT`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currency: item.currency || "USD", usdTryRate, livePriceSource: "Canlı Kripto" };
        });

        const nextStocks = (current.stocks || []).map((item) => {
          const symbol = normalizeSymbol(item.title).replace(/\.IS$/, "");
          const price = findDirectPrice(stocks, [symbol, `${symbol}.IS`, item.title]);
          if (price <= 0) return item;
          updateCount += 1;
          return { ...item, currentPrice: price, currency: item.currency || "TRY", livePriceSource: "Canlı Hisse" };
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
        setMessage(updateCount > 0 ? `${updateCount} fiyat güncellendi` : "Piyasa verisi alındı, portföyde eşleşen kayıt yok");
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

