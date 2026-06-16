export const dynamic = "force-dynamic";

const SUPPORTED_FIAT = ["USD", "EUR", "GBP", "CHF", "JPY", "TRY"];
const CRYPTO_QUOTES = ["USDT", "USDC", "FDUSD", "TRY"];
const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3/ticker/price";
const FRANKFURTER_BASE_URL = "https://api.frankfurter.app/latest";
const COINGECKO_SIMPLE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const XAUS_SPOT_URL = "https://xaus.com/api/v1/spot";

const COINGECKO_IDS = {
  SOL: "solana",
  SUI: "sui",
  ENA: "ethena",
  AVAX: "avalanche-2",
  AIXBT: "aixbt",
  RENDER: "render-token",
  S: "sonic-3",
  ATOM: "cosmos",
  ZK: "zksync",
  LRC: "loopring",
  APT: "aptos",
  FET: "fetch-ai",
  GRT: "the-graph",
  NEIRO: "neiro-3",
  UNI: "uniswap",
  PIXEL: "pixels",
  DOGS: "dogs-2",
  THL: "thala",
};

const GOLD_TYPES = {
  GRAM: { label: "Gram Altın", unit: "gram", multiplier: 1, purity: 1 },
  HAS: { label: "Has Altın", unit: "gram", multiplier: 1, purity: 1 },
  AYAR_24: { label: "24 Ayar Gram", unit: "gram", multiplier: 1, purity: 1 },
  AYAR_22: { label: "22 Ayar Altın", unit: "gram", multiplier: 1, purity: 0.916 },
  AYAR_18: { label: "18 Ayar Altın", unit: "gram", multiplier: 1, purity: 0.750 },
  AYAR_14: { label: "14 Ayar Altın", unit: "gram", multiplier: 1, purity: 0.585 },
  CEYREK: { label: "Çeyrek Altın", unit: "adet", multiplier: 1.75, purity: 0.916 },
  YARIM: { label: "Yarım Altın", unit: "adet", multiplier: 3.50, purity: 0.916 },
  TAM: { label: "Tam Altın", unit: "adet", multiplier: 7.00, purity: 0.916 },
  CUMHURIYET: { label: "Cumhuriyet Altını", unit: "adet", multiplier: 7.216, purity: 0.916 },
  ATA: { label: "Ata Altın", unit: "adet", multiplier: 7.216, purity: 0.916 },
  RESAT: { label: "Reşat Altın", unit: "adet", multiplier: 7.216, purity: 0.916 },
  GREMSE: { label: "Gremse Altın", unit: "adet", multiplier: 17.50, purity: 0.916 },
  BESLI: { label: "Beşli Altın", unit: "adet", multiplier: 35.00, purity: 0.916 },
  ONS: { label: "Ons Altın", unit: "ons", multiplier: 31.1034768, purity: 1 },
  GUMUS_GRAM: { label: "Gram Gümüş", unit: "gram", multiplier: 1, purity: 1, metal: "silver" },
};

function cleanSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getUsdTryRate() {
  const data = await fetchJson(`${FRANKFURTER_BASE_URL}?from=USD&to=TRY`, { next: { revalidate: 60 * 30 } });
  const rate = Number(data?.rates?.TRY || 0);
  return rate > 0 ? rate : 0;
}

async function getFiatTryRates(currencies) {
  const result = { TRY: 1 };
  const targets = unique(currencies.map(cleanSymbol)).filter((currency) => currency !== "TRY" && SUPPORTED_FIAT.includes(currency));

  await Promise.all(targets.map(async (currency) => {
    const data = await fetchJson(`${FRANKFURTER_BASE_URL}?from=${currency}&to=TRY`, { next: { revalidate: 60 * 30 } });
    const rate = Number(data?.rates?.TRY || 0);
    if (rate > 0) result[currency] = rate;
  }));

  return result;
}

async function getBinanceTicker(symbol) {
  const data = await fetchJson(`${BINANCE_BASE_URL}?symbol=${symbol}`, { next: { revalidate: 60 } });
  const price = Number(data?.price || 0);
  return price > 0 ? price : 0;
}

async function getCoinGeckoUsdPrices(symbols) {
  const ids = unique(symbols.map((symbol) => COINGECKO_IDS[symbol]).filter(Boolean));
  const result = {};
  if (!ids.length) return result;

  const url = `${COINGECKO_SIMPLE_PRICE_URL}?ids=${ids.join(",")}&vs_currencies=usd`;
  const data = await fetchJson(url, { next: { revalidate: 60 * 2 } });
  if (!data) return result;

  Object.entries(COINGECKO_IDS).forEach(([symbol, id]) => {
    const usdPrice = Number(data?.[id]?.usd || 0);
    if (usdPrice > 0) result[symbol] = usdPrice;
  });

  return result;
}

async function getGoldPrices(usdTryRate) {
  const data = await fetchJson(XAUS_SPOT_URL, { next: { revalidate: 60 * 5 } });
  const spotUsdOz = Number(data?.spot_usd_oz || 0);
  const perGramUsdFromApi = Number(data?.per_gram_usd || 0);
  const gramUsd = perGramUsdFromApi > 0 ? perGramUsdFromApi : spotUsdOz > 0 ? spotUsdOz / 31.1034768 : 0;
  const gramTry = gramUsd > 0 && usdTryRate > 0 ? gramUsd * usdTryRate : 0;

  const prices = {};
  Object.entries(GOLD_TYPES).forEach(([key, config]) => {
    if (config.metal === "silver") return;
    const pureGramTry = gramTry * config.multiplier * config.purity;
    const pureGramUsd = gramUsd * config.multiplier * config.purity;
    prices[key] = {
      key,
      label: config.label,
      unit: config.unit,
      multiplier: config.multiplier,
      purity: config.purity,
      tryPrice: pureGramTry,
      usdPrice: pureGramUsd,
      source: "XAUS spot formül",
    };
  });

  return {
    source: "XAUS",
    updatedAt: data?.updated_at || new Date().toISOString(),
    spotUsdOz,
    gramUsd,
    gramTry,
    prices,
  };
}

async function getBestCryptoPrice(baseSymbol, usdTryRate, coingeckoUsdPrices) {
  for (const quote of CRYPTO_QUOTES) {
    const binanceSymbol = `${baseSymbol}${quote}`;
    const price = await getBinanceTicker(binanceSymbol);
    if (price <= 0) continue;

    if (["USDT", "USDC", "FDUSD"].includes(quote)) {
      return { symbol: baseSymbol, source: "Binance", binanceSymbol, quote, quotePrice: price, usdPrice: price, tryPrice: usdTryRate > 0 ? price * usdTryRate : 0 };
    }

    if (quote === "TRY" && usdTryRate > 0) {
      return { symbol: baseSymbol, source: "Binance", binanceSymbol, quote, quotePrice: price, usdPrice: price / usdTryRate, tryPrice: price };
    }
  }

  const coingeckoUsdPrice = Number(coingeckoUsdPrices?.[baseSymbol] || 0);
  if (coingeckoUsdPrice > 0) {
    return { symbol: baseSymbol, source: "CoinGecko", binanceSymbol: null, quote: "USD", quotePrice: coingeckoUsdPrice, usdPrice: coingeckoUsdPrice, tryPrice: usdTryRate > 0 ? coingeckoUsdPrice * usdTryRate : 0 };
  }

  return null;
}

async function getCryptoPrices(symbols, usdTryRate) {
  const result = {};
  const notFound = [];
  const normalizedSymbols = unique(symbols.map(cleanSymbol));
  const coingeckoUsdPrices = await getCoinGeckoUsdPrices(normalizedSymbols);

  await Promise.all(normalizedSymbols.map(async (rawSymbol) => {
    const baseSymbol = rawSymbol.replace(/USDT$/, "").replace(/USDC$/, "").replace(/FDUSD$/, "").replace(/TRY$/, "");
    if (!baseSymbol) return;

    const live = await getBestCryptoPrice(baseSymbol, usdTryRate, coingeckoUsdPrices);
    if (live?.usdPrice) result[baseSymbol] = live;
    else notFound.push(baseSymbol);
  }));

  return { prices: result, notFound };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cryptoSymbols = String(searchParams.get("crypto") || "").split(",").map(cleanSymbol).filter(Boolean);
    const fiatCurrencies = String(searchParams.get("fiat") || "").split(",").map(cleanSymbol).filter(Boolean);

    const usdTryRate = await getUsdTryRate();
    const [fiatTryRates, cryptoResult, goldPrices] = await Promise.all([
      getFiatTryRates(fiatCurrencies),
      getCryptoPrices(cryptoSymbols, usdTryRate),
      getGoldPrices(usdTryRate),
    ]);

    return Response.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      base: "USD",
      usdTryRate,
      fiatTryRates,
      cryptoPrices: cryptoResult.prices,
      cryptoTryPrices: cryptoResult.prices,
      missingCryptoSymbols: cryptoResult.notFound,
      goldPrices,
      goldPrice: {
        source: goldPrices.source,
        unit: "gram",
        usdPerGram: goldPrices.gramUsd,
        tryPerGram: goldPrices.gramTry,
        updatedAt: goldPrices.updatedAt,
      },
      goldTypes: GOLD_TYPES,
      note: "Altın fiyatları ons değil gram bazından hesaplanır. Çeyrek, yarım, tam gibi türler gram fiyatı ve standart gramajla yaklaşık hesaplanır.",
    });
  } catch (error) {
    return Response.json({ ok: false, message: error?.message || "Canlı fiyatlar alınamadı." }, { status: 500 });
  }
}

