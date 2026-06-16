export const dynamic = "force-dynamic";

const SUPPORTED_FIAT = ["USD", "EUR", "GBP", "CHF", "JPY", "TRY"];
const CRYPTO_QUOTES = ["USDT", "USDC", "FDUSD", "TRY"];
const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3/ticker/price";
const FRANKFURTER_BASE_URL = "https://api.frankfurter.app/latest";
const COINGECKO_SIMPLE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

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

function cleanSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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
  const data = await fetchJson(`${FRANKFURTER_BASE_URL}?from=USD&to=TRY`, {
    next: { revalidate: 60 * 30 },
  });

  const rate = Number(data?.rates?.TRY || 0);
  return rate > 0 ? rate : 0;
}

async function getFiatTryRates(currencies) {
  const result = { TRY: 1 };
  const targets = unique(currencies.map(cleanSymbol)).filter(
    (currency) => currency !== "TRY" && SUPPORTED_FIAT.includes(currency)
  );

  await Promise.all(
    targets.map(async (currency) => {
      const data = await fetchJson(`${FRANKFURTER_BASE_URL}?from=${currency}&to=TRY`, {
        next: { revalidate: 60 * 30 },
      });

      const rate = Number(data?.rates?.TRY || 0);
      if (rate > 0) result[currency] = rate;
    })
  );

  return result;
}

async function getBinanceTicker(symbol) {
  const data = await fetchJson(`${BINANCE_BASE_URL}?symbol=${symbol}`, {
    next: { revalidate: 60 },
  });

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

async function getBestCryptoPrice(baseSymbol, usdTryRate, coingeckoUsdPrices) {
  for (const quote of CRYPTO_QUOTES) {
    const binanceSymbol = `${baseSymbol}${quote}`;
    const price = await getBinanceTicker(binanceSymbol);

    if (price <= 0) continue;

    if (quote === "TRY") {
      return {
        symbol: baseSymbol,
        source: "Binance",
        binanceSymbol,
        quote,
        quotePrice: price,
        tryPrice: price,
      };
    }

    if (["USDT", "USDC", "FDUSD"].includes(quote) && usdTryRate > 0) {
      return {
        symbol: baseSymbol,
        source: "Binance",
        binanceSymbol,
        quote,
        quotePrice: price,
        tryPrice: price * usdTryRate,
      };
    }
  }

  const coingeckoUsdPrice = Number(coingeckoUsdPrices?.[baseSymbol] || 0);
  if (coingeckoUsdPrice > 0 && usdTryRate > 0) {
    return {
      symbol: baseSymbol,
      source: "CoinGecko",
      binanceSymbol: null,
      quote: "USD",
      quotePrice: coingeckoUsdPrice,
      tryPrice: coingeckoUsdPrice * usdTryRate,
    };
  }

  return null;
}

async function getCryptoTryPrices(symbols, usdTryRate) {
  const result = {};
  const notFound = [];
  const normalizedSymbols = unique(symbols.map(cleanSymbol));
  const coingeckoUsdPrices = await getCoinGeckoUsdPrices(normalizedSymbols);

  await Promise.all(
    normalizedSymbols.map(async (rawSymbol) => {
      const baseSymbol = rawSymbol
        .replace(/USDT$/, "")
        .replace(/USDC$/, "")
        .replace(/FDUSD$/, "")
        .replace(/TRY$/, "");

      if (!baseSymbol) return;

      const live = await getBestCryptoPrice(baseSymbol, usdTryRate, coingeckoUsdPrices);
      if (live?.tryPrice) {
        result[baseSymbol] = live;
      } else {
        notFound.push(baseSymbol);
      }
    })
  );

  return { prices: result, notFound };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const cryptoSymbols = String(searchParams.get("crypto") || "")
      .split(",")
      .map(cleanSymbol)
      .filter(Boolean);

    const fiatCurrencies = String(searchParams.get("fiat") || "")
      .split(",")
      .map(cleanSymbol)
      .filter(Boolean);

    const usdTryRate = await getUsdTryRate();
    const [fiatTryRates, cryptoResult] = await Promise.all([
      getFiatTryRates(fiatCurrencies),
      getCryptoTryPrices(cryptoSymbols, usdTryRate),
    ]);

    return Response.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      base: "TRY",
      usdTryRate,
      fiatTryRates,
      cryptoTryPrices: cryptoResult.prices,
      missingCryptoSymbols: cryptoResult.notFound,
      note: "Fiyatlar bilgilendirme amaçlıdır. Döviz için Frankfurter, kripto için Binance market data ve CoinGecko fallback kullanılır.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error?.message || "Canlı fiyatlar alınamadı.",
      },
      { status: 500 }
    );
  }
}

