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
  { value: "BESLI", label: "Beşli Altın" },
  { value: "ONS", label: "Ons Altın" },
];

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

function detectGoldType(item) {
  if (item?.goldType) return item.goldType;
  const title = String(item?.title || "").toLocaleUpperCase("tr-TR");
  if (title.includes("ÇEYREK") || title.includes("CEYREK")) return "CEYREK";
  if (title.includes("YARIM")) return "YARIM";
  if (title.includes("TAM")) return "TAM";
  if (title.includes("CUMHUR")) return "CUMHURIYET";
  if (title.includes("ATA")) return "ATA";
  if (title.includes("REŞAT") || title.includes("RESAT")) return "RESAT";
  if (title.includes("GREMSE")) return "GREMSE";
  if (title.includes("BEŞ") || title.includes("BES")) return "BESLI";
  if (title.includes("22")) return "AYAR_22";
  if (title.includes("18")) return "AYAR_18";
  if (title.includes("14")) return "AYAR_14";
  if (title.includes("ONS")) return "ONS";
  if (title.includes("HAS")) return "HAS";
  return "GRAM";
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

export { GOLD_TYPE_OPTIONS };

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
          const goldType = detectGoldType(item);
          const liveGold = data.goldPrices?.prices?.[goldType] || data.goldPrices?.prices?.GRAM;
          if (!liveGold?.tryPrice) return enrichWithTryValues(item, usdTryRate);
          goldCount += 1;
          const currency = item.currency === "USD" ? "USD" : "TRY";
          const currentPrice = currency === "USD" ? Number(liveGold.usdPrice || 0) : Number(liveGold.tryPrice || 0);
          return {
            ...item,
            title: item.title || liveGold.label,
            goldType,
            goldTypeLabel: liveGold.label,
            currentPrice,
            currentPriceTry: Number(liveGold.tryPrice || 0),
            buyPriceTry: currency === "USD" ? Number(item.buyPrice || 0) * usdTryRate : Number(item.buyPrice || 0),
            currency,
            usdTryRate,
            livePriceSource: `${liveGold.source} - ${liveGold.label}`,
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
      setMessage(`Canlı fiyat güncellemesi tamamlandı. Kripto: ${cryptoCount}, Altın: ${goldCount}, Döviz: ${forexCount}. Altınlar ons değil gram ve tür bazlı hesaplandı.${missing}`);
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
          <p className="sectionDescription">Kripto USD, altın gram/tür bazlı, döviz TRY bazlı güncellenir. Altında gram, çeyrek, yarım, tam, cumhuriyet, ata, reşat, gremse ve ons desteklenir.</p>
        </div>
        <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={loading}>{loading ? "Güncelleniyor..." : "Canlı Fiyatları Güncelle"}</button>
      </div>
      {message ? <div className="authMessage">{message}</div> : null}
    </section>
  );
}

