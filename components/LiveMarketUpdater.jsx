"use client";

import { useState } from "react";

function cleanSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getCryptoSymbol(item) {
  const raw = cleanSymbol(item?.title);
  if (!raw) return "";
  return raw
    .replace(/USDT$/, "")
    .replace(/USDC$/, "")
    .replace(/FDUSD$/, "")
    .replace(/TRY$/, "");
}

function getForexCurrency(item) {
  const title = cleanSymbol(item?.title);
  const currency = cleanSymbol(item?.currency);

  if (["USD", "EUR", "GBP", "CHF", "JPY", "TRY"].includes(title)) return title;
  if (currency === "USDT") return "USD";
  return currency;
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

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Canlı fiyatlar alınamadı.");
      }

      let cryptoCount = 0;
      let forexCount = 0;

      setInvestments((current) => {
        const nextCrypto = (current.crypto || []).map((item) => {
          const symbol = getCryptoSymbol(item);
          const live = data.cryptoTryPrices?.[symbol];
          if (!live?.tryPrice) return item;

          cryptoCount += 1;

          return {
            ...item,
            currentPrice: Number(live.tryPrice),
            currency: "TRY",
            livePriceSource: live.source === "CoinGecko" ? "CoinGecko" : `Binance ${live.binanceSymbol}`,
            liveQuotePrice: Number(live.quotePrice || 0),
            liveQuoteCurrency: live.quote || "USDT",
            livePriceUpdatedAt: data.updatedAt,
          };
        });

        const nextForex = (current.forex || []).map((item) => {
          const currency = getForexCurrency(item);
          const rate = data.fiatTryRates?.[currency];
          if (!rate) return item;

          forexCount += 1;

          return {
            ...item,
            currentPrice: Number(rate),
            currency: "TRY",
            livePriceSource: `Frankfurter ${currency}/TRY`,
            liveBaseCurrency: currency,
            livePriceUpdatedAt: data.updatedAt,
          };
        });

        return {
          ...current,
          crypto: nextCrypto,
          forex: nextForex,
        };
      });

      const missing = Array.isArray(data.missingCryptoSymbols) && data.missingCryptoSymbols.length
        ? ` Bulunamayan kripto sembolleri: ${data.missingCryptoSymbols.join(", ")}.`
        : "";

      setMessage(`Canlı fiyat güncellemesi tamamlandı. Kripto: ${cryptoCount}, Döviz: ${forexCount}.${missing}`);
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
          <p className="sectionDescription">
            Kripto fiyatları Binance ve CoinGecko üzerinden, döviz kurları Frankfurter üzerinden TRY bazlı güncellenir.
          </p>
        </div>
        <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={loading}>
          {loading ? "Güncelleniyor..." : "Canlı Fiyatları Güncelle"}
        </button>
      </div>

      {message ? <div className="authMessage">{message}</div> : null}
    </section>
  );
}

