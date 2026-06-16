"use client";

import { useState } from "react";

function cleanSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getCryptoSymbol(item) {
  const raw = cleanSymbol(item?.title);
  if (!raw) return "";
  return raw.replace(/USDT$/, "").replace(/USDC$/, "").replace(/FDUSD$/, "").replace(/TRY$/, "");
}

function getForexCurrency(item) {
  const title = cleanSymbol(item?.title);
  const currency = cleanSymbol(item?.currency);
  if (["USD", "EUR", "GBP", "CHF", "JPY", "TRY"].includes(title)) return title;
  if (currency === "USDT") return "USD";
  return currency;
}

function enrichWithTryValues(item, usdTryRate) {
  const currency = cleanSymbol(item?.currency || "TRY");
  const buyPrice = Number(item?.buyPrice || 0);
  const currentPrice = Number(item?.currentPrice || 0);

  return {
    ...item,
    usdTryRate: Number(usdTryRate || item?.usdTryRate || 0),
    buyPriceTry: currency === "USD" && usdTryRate > 0 ? buyPrice * usdTryRate : Number(item?.buyPriceTry || 0),
    currentPriceTry: currency === "USD" && usdTryRate > 0 ? currentPrice * usdTryRate : Number(item?.currentPriceTry || 0),
  };
}

export default function LiveMarketUpdater({ investments, setInvestments }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateLivePrices = async () => {
    setLoading(true);
    setMessage("");

    try {
      const cryptoSymbols = unique((investments?.crypto || []).map(getCryptoSymbol));
      const fiatCurrencies = unique((investments?.forex || []).map(getForexCurrency));

      const params = new URLSearchParams();
      if (cryptoSymbols.length) params.set("crypto", cryptoSymbols.join(","));
      if (fiatCurrencies.length) params.set("fiat", fiatCurrencies.join(","));

      const response = await fetch(`/api/market-prices?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data?.ok) throw new Error(data?.message || "Canlı fiyatlar alınamadı.");

      let cryptoCount = 0;
      let forexCount = 0;
      let goldCount = 0;
      const usdTryRate = Number(data.usdTryRate || 0);

      setInvestments((current) => {
        const nextCrypto = (current.crypto || []).map((item) => {
          const symbol = getCryptoSymbol(item);
          const live = data.cryptoPrices?.[symbol] || data.cryptoTryPrices?.[symbol];
          if (!live?.usdPrice) return enrichWithTryValues(item, usdTryRate);

          cryptoCount += 1;
          return {
            ...item,
            currentPrice: Number(live.usdPrice),
            currentPriceTry: Number(live.tryPrice || 0),
            buyPriceTry: Number(item.buyPrice || 0) * usdTryRate,
            currency: "USD",
            usdTryRate,
            livePriceSource: live.source === "CoinGecko" ? "CoinGecko USD" : `Binance ${live.binanceSymbol}`,
            liveQuotePrice: Number(live.quotePrice || live.usdPrice || 0),
            liveQuoteCurrency: live.quote || "USD",
            livePriceUpdatedAt: data.updatedAt,
          };
        });

        const nextGold = (current.gold || []).map((item) => {
          const gold = data.goldPrice;
          if (!gold) return enrichWithTryValues(item, usdTryRate);

          const itemCurrency = cleanSymbol(item.currency || "TRY");
          const nextCurrentPrice = itemCurrency === "USD" ? Number(gold.usdPerGram || 0) : Number(gold.tryPerGram || 0);
          const nextCurrentPriceTry = Number(gold.tryPerGram || 0) || (Number(gold.usdPerGram || 0) * usdTryRate);
          if (nextCurrentPrice <= 0) return enrichWithTryValues(item, usdTryRate);

          goldCount += 1;
          return {
            ...item,
            currentPrice: nextCurrentPrice,
            currentPriceTry: nextCurrentPriceTry,
            buyPriceTry: itemCurrency === "USD" ? Number(item.buyPrice || 0) * usdTryRate : Number(item.buyPrice || 0),
            currency: itemCurrency,
            usdTryRate,
            livePriceSource: "XAUS Gram Altın",
            livePriceUpdatedAt: data.updatedAt,
          };
        });

        const nextStocks = (current.stocks || []).map((item) => enrichWithTryValues(item, usdTryRate));

        const nextForex = (current.forex || []).map((item) => {
          const currency = getForexCurrency(item);
          const rate = data.fiatTryRates?.[currency];
          if (!rate) return item;
          forexCount += 1;
          return { ...item, currentPrice: Number(rate), currentPriceTry: Number(rate), currency: "TRY", livePriceSource: `Frankfurter ${currency}/TRY`, liveBaseCurrency: currency, livePriceUpdatedAt: data.updatedAt };
        });

        return { ...current, crypto: nextCrypto, gold: nextGold, stocks: nextStocks, forex: nextForex };
      });

      const missing = Array.isArray(data.missingCryptoSymbols) && data.missingCryptoSymbols.length ? ` Bulunamayan kripto sembolleri: ${data.missingCryptoSymbols.join(", ")}.` : "";
      setMessage(`Canlı fiyat güncellemesi tamamlandı. Kripto: ${cryptoCount}, Altın: ${goldCount}, Döviz: ${forexCount}. USD/TRY kuru hesaplara işlendi.${missing}`);
    } catch (error) {
      setMessage(error?.message || "Canlı fiyat güncellemesi başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="miniPanel mint">
      <div className="miniHeader">
        <div>
          <h3 className="miniTitle miniTitle-mint">Canlı Fiyat Güncelle</h3>
          <p className="sectionDescription">Kripto USD, altın gram, döviz TRY bazlı güncellenir. USD bazlı varlıklar özetlerde güncel kurla TL’ye çevrilir.</p>
        </div>
        <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={loading}>{loading ? "Güncelleniyor..." : "Canlı Fiyatları Güncelle"}</button>
      </div>
      {message ? <div className="authMessage">{message}</div> : null}
    </section>
  );
}

