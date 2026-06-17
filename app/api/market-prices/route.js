export const dynamic = "force-dynamic";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeNumber(value) {
  if (typeof value === "number") return numberOrZero(value);
  if (!value) return 0;

  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace(/₺/g, "")
    .replace(/TL/gi, "")
    .replace(/USD/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  return numberOrZero(cleaned);
}

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9.]/g, "");
}

async function safeJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 market-price-panel",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.log("market api error", url, error?.message || error);
    return null;
  }
}

async function getUsdTry() {
  const data = await safeJson("https://open.er-api.com/v6/latest/USD");
  return numberOrZero(data?.rates?.TRY);
}

async function getForexPrices() {
  const data = await safeJson("https://open.er-api.com/v6/latest/TRY");
  const rates = data?.rates || {};

  const usd = rates.USD ? 1 / Number(rates.USD) : 0;
  const eur = rates.EUR ? 1 / Number(rates.EUR) : 0;
  const gbp = rates.GBP ? 1 / Number(rates.GBP) : 0;
  const chf = rates.CHF ? 1 / Number(rates.CHF) : 0;
  const jpy = rates.JPY ? 1 / Number(rates.JPY) : 0;

  return {
    USD: numberOrZero(usd),
    EUR: numberOrZero(eur),
    GBP: numberOrZero(gbp),
    CHF: numberOrZero(chf),
    JPY: numberOrZero(jpy),
    USDTRY: numberOrZero(usd),
    EURTRY: numberOrZero(eur),
    GBPTRY: numberOrZero(gbp),
    CHFTRY: numberOrZero(chf),
    JPYTRY: numberOrZero(jpy),
  };
}

const defaultCryptoSymbols = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "ENAUSDT", "AVAXUSDT", "AIXBTUSDT", "RENDERUSDT",
  "SUSDT", "ATOMUSDT", "ZKUSDT", "LRCUSDT", "APTUSDT", "FETUSDT", "GRTUSDT", "NEIROUSDT",
  "UNIUSDT", "PIXELUSDT", "DOGSUSDT", "THLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT",
  "LINKUSDT", "DOTUSDT", "MATICUSDT", "TRXUSDT", "LTCUSDT", "BCHUSDT", "NEARUSDT", "ARBUSDT", "OPUSDT"
];

async function getCryptoPrices() {
  const prices = {};
  const binanceData = await safeJson(
    `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(defaultCryptoSymbols))}`
  );

  if (Array.isArray(binanceData)) {
    binanceData.forEach((item) => {
      const symbol = String(item.symbol || "").replace("USDT", "");
      const price = numberOrZero(item.price);
      if (symbol && price > 0) prices[symbol] = price;
    });
  }

  const ids = [
    "bitcoin", "ethereum", "solana", "sui", "ethena", "avalanche-2", "aixbt", "render-token",
    "sonic-3", "cosmos", "zksync", "loopring", "aptos", "artificial-superintelligence-alliance",
    "the-graph", "neiro-3", "uniswap", "pixels", "dogs-2", "thala", "binancecoin", "ripple",
    "cardano", "dogecoin", "chainlink", "polkadot", "polygon", "tron", "litecoin", "bitcoin-cash",
    "near", "arbitrum", "optimism"
  ].join(",");

  const geckoData = await safeJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
  const geckoMap = {
    BTC: "bitcoin", ETH: "ethereum", SOL: "solana", SUI: "sui", ENA: "ethena", AVAX: "avalanche-2",
    AIXBT: "aixbt", RENDER: "render-token", RNDR: "render-token", S: "sonic-3", ATOM: "cosmos",
    ZK: "zksync", LRC: "loopring", APT: "aptos", FET: "artificial-superintelligence-alliance",
    ASI: "artificial-superintelligence-alliance", GRT: "the-graph", NEIRO: "neiro-3", UNI: "uniswap",
    PIXEL: "pixels", DOGS: "dogs-2", THL: "thala", BNB: "binancecoin", XRP: "ripple",
    ADA: "cardano", DOGE: "dogecoin", LINK: "chainlink", DOT: "polkadot", MATIC: "polygon",
    TRX: "tron", LTC: "litecoin", BCH: "bitcoin-cash", NEAR: "near", ARB: "arbitrum", OP: "optimism",
  };

  Object.entries(geckoMap).forEach(([symbol, id]) => {
    const price = numberOrZero(geckoData?.[id]?.usd);
    if (price > 0 && !prices[symbol]) prices[symbol] = price;
  });

  return prices;
}

async function getCryptoMarkets() {
  const pages = [1, 2, 3, 4];
  const results = [];

  for (const page of pages) {
    const data = await safeJson(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h`
    );
    if (Array.isArray(data)) {
      results.push(...data.map((coin) => ({
        id: coin.id,
        symbol: String(coin.symbol || "").toUpperCase(),
        name: coin.name,
        price: numberOrZero(coin.current_price),
        change24h: Number(coin.price_change_percentage_24h || 0),
        marketCap: Number(coin.market_cap || 0),
        volume: Number(coin.total_volume || 0),
        image: coin.image || "",
        source: "CoinGecko",
      })));
    }
  }

  return results;
}

async function getGoldPrices(usdTryRate) {
  const result = {};
  const metals = [];

  const genelPara = await safeJson("https://api.genelpara.com/embed/altin.json");
  const gram = normalizeNumber(genelPara?.GA?.satis || genelPara?.GA?.alis || genelPara?.gram_altin?.satis || genelPara?.gram_altin?.alis);
  const ceyrek = normalizeNumber(genelPara?.C?.satis || genelPara?.C?.alis || genelPara?.ceyrek_altin?.satis || genelPara?.ceyrek_altin?.alis);
  const yarim = normalizeNumber(genelPara?.Y?.satis || genelPara?.Y?.alis || genelPara?.yarim_altin?.satis || genelPara?.yarim_altin?.alis);
  const tam = normalizeNumber(genelPara?.T?.satis || genelPara?.T?.alis || genelPara?.tam_altin?.satis || genelPara?.tam_altin?.alis);
  const cumhuriyet = normalizeNumber(genelPara?.CMR?.satis || genelPara?.CMR?.alis || genelPara?.cumhuriyet_altini?.satis || genelPara?.cumhuriyet_altini?.alis);

  function addMetal(symbol, name, priceTry, category = "Altın") {
    const price = numberOrZero(priceTry);
    if (price <= 0) return;
    result[symbol] = price;
    metals.push({ symbol, name, priceTry: price, currency: "TRY", category, source: "GenelPara / Hesaplanan" });
  }

  if (gram > 0) {
    result.GRAM = gram;
    result.GRAMALTIN = gram;
    result.HAS = gram;
    result.HASALTIN = gram;
    result.AYAR_24 = gram;
    result.AYAR24 = gram;
    result.AYAR_22 = gram * 0.916;
    result.AYAR22 = gram * 0.916;
    result.AYAR_18 = gram * 0.75;
    result.AYAR18 = gram * 0.75;
    result.AYAR_14 = gram * 0.585;
    result.AYAR14 = gram * 0.585;

    addMetal("GRAM", "Gram Altın", gram);
    addMetal("HAS", "Has Altın", gram);
    addMetal("AYAR_24", "24 Ayar Gram", gram);
    addMetal("AYAR_22", "22 Ayar Altın", gram * 0.916);
    addMetal("AYAR_18", "18 Ayar Altın", gram * 0.75);
    addMetal("AYAR_14", "14 Ayar Altın", gram * 0.585);
    addMetal("GREMSE", "Gremse Altın", gram * 17.5);
    result.GREMSE = gram * 17.5;
    result.GREMSEALTIN = gram * 17.5;
  }

  if (ceyrek > 0) { result.CEYREK = ceyrek; result.CEYREKALTIN = ceyrek; addMetal("CEYREK", "Çeyrek Altın", ceyrek); }
  if (yarim > 0) { result.YARIM = yarim; result.YARIMALTIN = yarim; addMetal("YARIM", "Yarım Altın", yarim); }
  if (tam > 0) { result.TAM = tam; result.TAMALTIN = tam; addMetal("TAM", "Tam Altın", tam); }
  if (cumhuriyet > 0) {
    result.CUMHURIYET = cumhuriyet;
    result.CUMHURIYETALTINI = cumhuriyet;
    result.ATA = cumhuriyet;
    result.ATAALTIN = cumhuriyet;
    result.RESAT = cumhuriyet;
    result.RESATALTIN = cumhuriyet;
    addMetal("CUMHURIYET", "Cumhuriyet Altını", cumhuriyet);
    addMetal("ATA", "Ata Altın", cumhuriyet);
    addMetal("RESAT", "Reşat Altın", cumhuriyet);
  }

  const [paxg, silver, platinum, palladium] = await Promise.all([
    safeJson("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT"),
    safeJson("https://api.binance.com/api/v3/ticker/price?symbol=XAGUSDT"),
    safeJson("https://api.binance.com/api/v3/ticker/price?symbol=XPTUSDT"),
    safeJson("https://api.binance.com/api/v3/ticker/price?symbol=XPDUSDT"),
  ]);

  const onsUsd = numberOrZero(paxg?.price);
  if (onsUsd > 0 && usdTryRate > 0) {
    result.ONS = onsUsd * usdTryRate;
    result.ONSALTIN = onsUsd * usdTryRate;
    addMetal("ONS", "Ons Altın", onsUsd * usdTryRate);

    if (!result.GRAM) {
      const estimatedGram = (onsUsd * usdTryRate) / 31.1034768;
      result.GRAM = estimatedGram;
      result.GRAMALTIN = estimatedGram;
      result.HAS = estimatedGram;
      result.HASALTIN = estimatedGram;
      result.AYAR_24 = estimatedGram;
      result.AYAR24 = estimatedGram;
      addMetal("GRAM", "Gram Altın", estimatedGram);
    }
  }

  const silverUsd = numberOrZero(silver?.price);
  if (silverUsd > 0 && usdTryRate > 0) {
    const silverTryOz = silverUsd * usdTryRate;
    const silverTryGram = silverTryOz / 31.1034768;
    result.GUMUS = silverTryGram;
    result.GUMUSTRY = silverTryGram;
    result.XAG = silverTryOz;
    addMetal("GUMUS", "Gram Gümüş", silverTryGram, "Gümüş");
    addMetal("XAG", "Ons Gümüş", silverTryOz, "Gümüş");
  }

  const platinumUsd = numberOrZero(platinum?.price);
  if (platinumUsd > 0 && usdTryRate > 0) {
    result.XPT = platinumUsd * usdTryRate;
    addMetal("XPT", "Ons Platin", platinumUsd * usdTryRate, "Platin");
  }

  const palladiumUsd = numberOrZero(palladium?.price);
  if (palladiumUsd > 0 && usdTryRate > 0) {
    result.XPD = palladiumUsd * usdTryRate;
    addMetal("XPD", "Ons Paladyum", palladiumUsd * usdTryRate, "Paladyum");
  }

  return { gold: result, metals };
}

const fallbackTurkishSymbols = [
  "THYAO", "ASELS", "GARAN", "AKBNK", "YKBNK", "ISCTR", "KCHOL", "SAHOL", "TUPRS", "EREGL",
  "BIMAS", "MGROS", "FROTO", "TOASO", "SISE", "PETKM", "TCELL", "TTKOM", "ENKAI", "ARCLK",
  "ALARK", "ASTOR", "HEKTS", "KRDMD", "PGSUS", "SASA", "DOAS", "EKGYO", "KOZAL", "KOZAA",
  "GUBRF", "OYAKC", "MIATK", "SMRTG", "ODAS", "CIMSA", "VESTL", "ULKER", "MAVI", "AEFES"
];

const fallbackUsSymbols = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "GOOG", "AMZN", "META", "TSLA", "AVGO", "AMD",
  "NFLX", "ORCL", "CRM", "ADBE", "INTC", "QCOM", "CSCO", "IBM", "JPM", "BAC",
  "V", "MA", "PYPL", "KO", "PEP", "MCD", "NKE", "DIS", "WMT", "COST", "SPY", "QQQ", "VOO"
];

async function getYahooQuotes(symbols, type) {
  if (!symbols.length) return [];
  const chunks = [];
  for (let i = 0; i < symbols.length; i += 50) chunks.push(symbols.slice(i, i + 50));
  const rows = [];

  for (const chunk of chunks) {
    const query = chunk.join(",");
    const data = await safeJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`);
    const result = data?.quoteResponse?.result || [];
    rows.push(...result.map((item) => ({
      symbol: String(item.symbol || "").replace(".IS", ""),
      rawSymbol: item.symbol,
      name: item.shortName || item.longName || item.symbol,
      price: numberOrZero(item.regularMarketPrice),
      change: Number(item.regularMarketChange || 0),
      changePercent: Number(item.regularMarketChangePercent || 0),
      volume: Number(item.regularMarketVolume || 0),
      currency: item.currency || (type === "TR" ? "TRY" : "USD"),
      market: type === "TR" ? "BIST" : "ABD",
      source: "Yahoo Finance fallback",
    })));
  }

  return rows.filter((row) => row.price > 0 || row.name);
}

async function getTwelveDataStocks(exchange, country, apiKey) {
  if (!apiKey) return [];
  const params = new URLSearchParams({ apikey: apiKey });
  if (exchange) params.set("exchange", exchange);
  if (country) params.set("country", country);

  const list = await safeJson(`https://api.twelvedata.com/stocks?${params.toString()}`);
  const data = Array.isArray(list?.data) ? list.data : Array.isArray(list) ? list : [];
  return data.map((item) => ({
    symbol: item.symbol,
    rawSymbol: item.symbol,
    name: item.name || item.symbol,
    exchange: item.exchange,
    currency: item.currency || (country === "Turkey" ? "TRY" : "USD"),
    market: country === "Turkey" ? "BIST" : "ABD",
    source: "Twelve Data",
  })).filter((item) => item.symbol);
}

async function getStockMarkets() {
  const apiKey = process.env.TWELVE_DATA_API_KEY || "";

  const [tdTr, tdNasdaq, tdNyse] = await Promise.all([
    getTwelveDataStocks("BIST", "Turkey", apiKey),
    getTwelveDataStocks("NASDAQ", "United States", apiKey),
    getTwelveDataStocks("NYSE", "United States", apiKey),
  ]);

  const twelveTr = tdTr.slice(0, 650);
  const twelveUs = [...tdNasdaq, ...tdNyse].slice(0, 900);

  const fallbackTr = await getYahooQuotes(fallbackTurkishSymbols.map((symbol) => `${symbol}.IS`), "TR");
  const fallbackUs = await getYahooQuotes(fallbackUsSymbols, "US");

  const turkishStocks = twelveTr.length ? mergeStocks(twelveTr, fallbackTr) : fallbackTr;
  const usStocks = twelveUs.length ? mergeStocks(twelveUs, fallbackUs) : fallbackUs;

  const stocks = {};
  [...fallbackTr, ...fallbackUs].forEach((row) => {
    const symbol = normalizeSymbol(row.symbol);
    if (symbol && row.price > 0) stocks[symbol] = row.price;
  });

  return { turkishStocks, usStocks, stockPrices: stocks };
}

function mergeStocks(base, priced) {
  const priceMap = new Map(priced.map((item) => [normalizeSymbol(item.symbol), item]));
  return base.map((item) => {
    const found = priceMap.get(normalizeSymbol(item.symbol));
    return found ? { ...item, ...found, source: `${item.source} + fiyat` } : item;
  });
}

export async function GET() {
  const usdTryRate = await getUsdTry();
  const [crypto, forex, goldPayload, cryptoMarkets, stockPayload] = await Promise.all([
    getCryptoPrices(),
    getForexPrices(),
    getGoldPrices(usdTryRate),
    getCryptoMarkets(),
    getStockMarkets(),
  ]);

  return Response.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    prices: {
      usdTry: usdTryRate,
      usdTryRate,
      crypto,
      forex,
      gold: goldPayload.gold,
      stocks: stockPayload.stockPrices,
    },
    markets: {
      turkishStocks: stockPayload.turkishStocks,
      usStocks: stockPayload.usStocks,
      crypto: cryptoMarkets,
      metals: goldPayload.metals,
      forex: Object.entries(forex).map(([symbol, price]) => ({ symbol, name: symbol, priceTry: price, currency: "TRY", source: "ExchangeRate" })),
    },
  });
}

