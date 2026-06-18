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
    .replace(/TRY/gi, "")
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
    .replace(/[^A-Z0-9.=]/g, "");
}

async function safeJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 personal-finance-market-panel",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.log("market json error", url, error?.message || error);
    return null;
  }
}

async function safeText(url, options = {}) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        accept: "text/csv,text/plain,*/*",
        "user-agent": "Mozilla/5.0 personal-finance-market-panel",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) return "";
    return await response.text();
  } catch (error) {
    console.log("market text error", url, error?.message || error);
    return "";
  }
}

async function getUsdTry() {
  const data = await safeJson("https://open.er-api.com/v6/latest/USD");
  return numberOrZero(data?.rates?.TRY);
}

async function getForexPrices() {
  const data = await safeJson("https://open.er-api.com/v6/latest/TRY");
  const rates = data?.rates || {};

  const make = (symbol) => {
    const rate = Number(rates[symbol] || 0);
    return rate > 0 ? numberOrZero(1 / rate) : 0;
  };

  const out = {
    USD: make("USD"),
    EUR: make("EUR"),
    GBP: make("GBP"),
    CHF: make("CHF"),
    JPY: make("JPY"),
  };

  return {
    ...out,
    USDTRY: out.USD,
    EURTRY: out.EUR,
    GBPTRY: out.GBP,
    CHFTRY: out.CHF,
    JPYTRY: out.JPY,
  };
}

function extractPortfolioSymbols(investments = {}) {
  const crypto = new Set();
  const trStocks = new Set();
  const usStocks = new Set();
  const funds = new Set();

  (investments.crypto || []).forEach((item) => {
    const symbol = normalizeSymbol(item.title).replace(/USDT$/, "");
    if (symbol) crypto.add(symbol);
  });

  (investments.stocks || []).forEach((item) => {
    const raw = normalizeSymbol(item.title).replace(/\.IS$/, "");
    if (!raw) return;

    const currency = item.currency || "TRY";
    if (currency === "TRY") trStocks.add(raw);
    else usStocks.add(raw);
  });

  (investments.funds || []).forEach((item) => {
    const symbol = normalizeSymbol(item.title);
    if (symbol) funds.add(symbol);
  });

  return {
    crypto: [...crypto],
    trStocks: [...trStocks],
    usStocks: [...usStocks],
    funds: [...funds],
  };
}

async function getBinanceCryptoMarkets(extraSymbols = []) {
  const ticker24 = await safeJson("https://api.binance.com/api/v3/ticker/24hr");
  const markets = [];
  const prices = {};

  if (Array.isArray(ticker24)) {
    ticker24.forEach((item) => {
      const pair = String(item.symbol || "");
      if (!pair.endsWith("USDT")) return;

      const symbol = pair.replace("USDT", "");
      const price = numberOrZero(item.lastPrice);
      if (!symbol || price <= 0) return;

      prices[symbol] = price;
      prices[pair] = price;

      markets.push({
        id: symbol.toLowerCase(),
        symbol,
        name: symbol,
        price,
        change24h: Number(item.priceChangePercent || 0),
        marketCap: 0,
        volume: Number(item.quoteVolume || item.volume || 0),
        source: "Binance",
        portfolio: extraSymbols.includes(symbol),
      });
    });
  }

  await Promise.all(
    extraSymbols.map(async (symbol) => {
      if (!symbol || prices[symbol]) return;

      const data = await safeJson(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}USDT`
      );

      const price = numberOrZero(data?.lastPrice);
      if (price > 0) {
        prices[symbol] = price;
        prices[`${symbol}USDT`] = price;

        markets.unshift({
          id: symbol.toLowerCase(),
          symbol,
          name: symbol,
          price,
          change24h: Number(data?.priceChangePercent || 0),
          marketCap: 0,
          volume: Number(data?.quoteVolume || data?.volume || 0),
          source: "Binance / Portföy",
          portfolio: true,
        });
      }
    })
  );

  return { markets, prices };
}

async function getCoinGeckoTopMarkets(existingPrices = {}, portfolioSymbols = []) {
  const markets = [];

  for (const page of [1, 2, 3, 4]) {
    const data = await safeJson(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h`
    );

    if (!Array.isArray(data)) continue;

    markets.push(
      ...data.map((coin) => {
        const symbol = normalizeSymbol(coin.symbol);
        const price = numberOrZero(coin.current_price);

        if (symbol && price > 0 && !existingPrices[symbol]) {
          existingPrices[symbol] = price;
        }

        return {
          id: coin.id,
          symbol,
          name: coin.name,
          price,
          change24h: Number(coin.price_change_percentage_24h || 0),
          marketCap: Number(coin.market_cap || 0),
          volume: Number(coin.total_volume || 0),
          image: coin.image || "",
          source: "CoinGecko",
          portfolio: portfolioSymbols.includes(symbol),
        };
      })
    );
  }

  return { markets, prices: existingPrices };
}

async function getCoinGeckoPortfolioPrices(portfolioSymbols = [], existingPrices = {}) {
  const rows = [];
  const missing = portfolioSymbols.filter((symbol) => symbol && !existingPrices[symbol]);

  if (!missing.length) return { rows, prices: existingPrices };

  const foundBySymbol = new Map();

  for (const symbol of missing.slice(0, 40)) {
    const search = await safeJson(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`
    );

    const coins = Array.isArray(search?.coins) ? search.coins : [];
    const exact =
      coins.find((coin) => normalizeSymbol(coin.symbol) === symbol) ||
      coins.find((coin) => normalizeSymbol(coin.name) === symbol) ||
      coins[0];

    if (exact?.id) foundBySymbol.set(symbol, exact);
  }

  const ids = [...new Set([...foundBySymbol.values()].map((coin) => coin.id))];

  if (ids.length) {
    const data = await safeJson(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        ids.join(",")
      )}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );

    for (const [symbol, coin] of foundBySymbol.entries()) {
      const price = numberOrZero(data?.[coin.id]?.usd);
      const change24h = Number(data?.[coin.id]?.usd_24h_change || 0);
      const marketCap = Number(data?.[coin.id]?.usd_market_cap || 0);
      const volume = Number(data?.[coin.id]?.usd_24h_vol || 0);

      if (price > 0) existingPrices[symbol] = price;

      rows.push({
        id: coin.id,
        symbol,
        name: coin.name || symbol,
        price,
        change24h,
        marketCap,
        volume,
        image: coin.large || coin.thumb || "",
        source: price > 0 ? "CoinGecko / Portföy" : "Portföy / Fiyat bekleniyor",
        portfolio: true,
      });
    }
  }

  missing.forEach((symbol) => {
    if (!rows.some((row) => row.symbol === symbol)) {
      rows.push({
        id: symbol.toLowerCase(),
        symbol,
        name: symbol,
        price: 0,
        change24h: 0,
        marketCap: 0,
        volume: 0,
        source: "Portföy / Fiyat bekleniyor",
        portfolio: true,
      });
    }
  });

  return { rows, prices: existingPrices };
}

async function getCryptoPayload(portfolioSymbols = []) {
  const binance = await getBinanceCryptoMarkets(portfolioSymbols);
  const geckoTop = await getCoinGeckoTopMarkets({ ...binance.prices }, portfolioSymbols);
  const geckoPortfolio = await getCoinGeckoPortfolioPrices(portfolioSymbols, geckoTop.prices);

  const bySymbol = new Map();

  [...geckoTop.markets, ...binance.markets, ...geckoPortfolio.rows].forEach((item) => {
    if (!item.symbol) return;

    const existing = bySymbol.get(item.symbol);

    if (
      !existing ||
      item.portfolio ||
      (!existing.price && item.price) ||
      item.source?.includes("Binance")
    ) {
      bySymbol.set(item.symbol, item);
    }
  });

  return {
    prices: geckoPortfolio.prices,
    markets: [...bySymbol.values()].sort(
      (a, b) =>
        Number(b.portfolio || false) - Number(a.portfolio || false) ||
        (b.marketCap || b.volume || b.price || 0) - (a.marketCap || a.volume || a.price || 0)
    ),
  };
}

async function getYahooQuotes(symbols, type) {
  const clean = [...new Set(symbols.filter(Boolean))];
  if (!clean.length) return [];

  const rows = [];

  for (let i = 0; i < clean.length; i += 60) {
    const chunk = clean.slice(i, i + 60);

    const data = await safeJson(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
        chunk.join(",")
      )}`
    );

    const result = data?.quoteResponse?.result || [];

    rows.push(
      ...result.map((item) => ({
        symbol: String(item.symbol || "").replace(".IS", ""),
        rawSymbol: item.symbol,
        name: item.shortName || item.longName || item.symbol,
        price: numberOrZero(item.regularMarketPrice),
        change: Number(item.regularMarketChange || 0),
        changePercent: Number(item.regularMarketChangePercent || 0),
        volume: Number(item.regularMarketVolume || 0),
        currency: item.currency || (type === "TR" ? "TRY" : "USD"),
        market: type === "TR" ? "BIST" : "ABD",
        source: "Yahoo Finance",
      }))
    );
  }

  return rows.filter((row) => row.symbol && row.price > 0);
}

async function getTwelveQuotes(symbols, type, apiKey) {
  if (!apiKey) return [];

  const clean = [...new Set(symbols.filter(Boolean))].slice(0, 80);
  const rows = [];

  for (const symbol of clean) {
    const params = new URLSearchParams({ symbol, apikey: apiKey });
    if (type === "TR") params.set("exchange", "BIST");

    const data = await safeJson(`https://api.twelvedata.com/quote?${params.toString()}`);
    const price = numberOrZero(data?.close || data?.price);

    if (data?.symbol || price > 0) {
      rows.push({
        symbol: normalizeSymbol(data?.symbol || symbol).replace(/\.IS$/, ""),
        rawSymbol: data?.symbol || symbol,
        name: data?.name || symbol,
        price,
        change: Number(data?.change || 0),
        changePercent: Number(data?.percent_change || 0),
        volume: Number(data?.volume || 0),
        currency: data?.currency || (type === "TR" ? "TRY" : "USD"),
        market: type === "TR" ? "BIST" : "ABD",
        source: "Twelve Data Quote",
      });
    }
  }

  return rows;
}

function parseStooqCsv(csv, type) {
  if (!csv || !csv.includes("Symbol")) return [];

  const lines = csv.trim().split(/\r?\n/).slice(1);

  return lines
    .map((line) => {
      const cells = line.split(",");
      const rawSymbol = cells[0] || "";
      const close = numberOrZero(cells[6]);
      const volume = Number(cells[7] || 0);
      const symbol = rawSymbol.replace(/\.US$/i, "").replace(/\.TR$/i, "").toUpperCase();

      return {
        symbol,
        rawSymbol,
        name: symbol,
        price: close,
        changePercent: 0,
        volume,
        currency: type === "TR" ? "TRY" : "USD",
        market: type === "TR" ? "BIST" : "ABD",
        source: "Stooq fallback",
      };
    })
    .filter((row) => row.symbol && row.price > 0);
}

async function getStooqQuotes(symbols, type) {
  const suffix = type === "TR" ? ".tr" : ".us";
  const clean = [...new Set(symbols.filter(Boolean))];

  if (!clean.length) return [];

  const rows = [];

  for (let i = 0; i < clean.length; i += 80) {
    const chunk = clean
      .slice(i, i + 80)
      .map((symbol) => `${String(symbol).toLowerCase()}${suffix}`)
      .join(",");

    const csv = await safeText(
      `https://stooq.com/q/l/?s=${encodeURIComponent(chunk)}&f=sd2t2ohlcv&h&e=csv`
    );

    rows.push(...parseStooqCsv(csv, type));
  }

  return rows;
}

const bistUniverse = [
  "A1CAP", "ACSEL", "ADEL", "AEFES", "AGESA", "AGHOL", "AGROT", "AHGAZ", "AKBNK",
  "AKCNS", "AKENR", "AKFGY", "AKFYE", "AKGRT", "AKSA", "AKSEN", "ALARK", "ALBRK",
  "ALCAR", "ALCTL", "ALFAS", "ALKIM", "ANHYT", "ANSGR", "ARCLK", "ARDYZ", "ASELS",
  "ASTOR", "ASUZU", "ATAKP", "AYDEM", "AYEN", "AYGAZ", "BAGFS", "BANVT", "BERA",
  "BEYAZ", "BIMAS", "BIOEN", "BIZIM", "BRSAN", "BRYAT", "BSOKE", "BTCIM", "BUCIM",
  "CANTE", "CCOLA", "CIMSA", "CLEBI", "CWENE", "DOAS", "DOHOL", "ECILC", "ECZYT",
  "EFOR", "EGEEN", "EKGYO", "ENERY", "ENJSA", "ENKAI", "EREGL", "EUPWR", "FROTO",
  "GARAN", "GENIL", "GESAN", "GOLTS", "GOZDE", "GUBRF", "HALKB", "HEKTS", "ISCTR",
  "ISDMR", "ISMEN", "KARSN", "KCAER", "KCHOL", "KONTR", "KORDS", "KOZAA", "KOZAL",
  "KRDMD", "MAVI", "MGROS", "MIATK", "ODAS", "OYAKC", "PETKM", "PGSUS", "SAHOL",
  "SASA", "SISE", "SMRTG", "SOKM", "TAVHL", "TCELL", "THYAO", "TKFEN", "TOASO",
  "TSKB", "TTKOM", "TTRAK", "TUPRS", "ULKER", "VAKBN", "VESBE", "VESTL", "YKBNK",
  "ZOREN"
];

const usUniverse = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "GOOG", "AMZN", "META", "TSLA", "AVGO", "AMD",
  "NFLX", "ORCL", "CRM", "ADBE", "INTC", "QCOM", "CSCO", "IBM", "JPM", "BAC",
  "WFC", "GS", "MS", "C", "V", "MA", "PYPL", "AXP", "KO", "PEP", "MCD", "NKE",
  "DIS", "WMT", "COST", "HD", "LOW", "TGT", "SBUX", "PFE", "MRK", "JNJ", "UNH",
  "ABBV", "LLY", "TMO", "ABT", "XOM", "CVX", "COP", "BA", "CAT", "GE", "MMM",
  "DE", "LMT", "RTX", "SPY", "QQQ", "VOO", "VTI", "DIA", "IWM", "ARKK", "PLTR",
  "SNOW", "UBER", "SHOP", "SQ", "COIN", "MSTR", "RIVN", "LCID", "NIO", "BABA",
  "TSM", "ASML", "SONY", "TM"
];

function mergeStocks(base, priced) {
  const map = new Map(priced.map((item) => [normalizeSymbol(item.symbol), item]));

  const merged = base.map((item) => {
    const found = map.get(normalizeSymbol(item.symbol));
    return found
      ? {
          ...item,
          ...found,
          source: found.source || item.source || "Fiyat",
          portfolio: item.portfolio || found.portfolio,
        }
      : item;
  });

  priced.forEach((item) => {
    if (!merged.some((row) => normalizeSymbol(row.symbol) === normalizeSymbol(item.symbol))) {
      merged.push(item);
    }
  });

  return merged;
}

async function getStockPayload(extra = {}) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || "";

  const portfolioTr = extra.trStocks || [];
  const portfolioUs = extra.usStocks || [];

  const trSymbols = [...new Set([...bistUniverse, ...portfolioTr])];
  const usSymbols = [...new Set([...usUniverse, ...portfolioUs])];

  const [yahooTr, yahooUs, stooqTr, stooqUs, twelveTr, twelveUs] = await Promise.all([
    getYahooQuotes(trSymbols.map((s) => `${s}.IS`), "TR"),
    getYahooQuotes(usSymbols, "US"),
    getStooqQuotes(trSymbols, "TR"),
    getStooqQuotes(usSymbols, "US"),
    getTwelveQuotes(portfolioTr, "TR", apiKey),
    getTwelveQuotes(portfolioUs, "US", apiKey),
  ]);

  const trPrices = mergeStocks(mergeStocks(yahooTr, stooqTr), twelveTr);
  const usPrices = mergeStocks(mergeStocks(yahooUs, stooqUs), twelveUs);

  const trBase = trSymbols.map((s) => ({
    symbol: s,
    name: s,
    currency: "TRY",
    market: "BIST",
    price: 0,
    changePercent: 0,
    volume: 0,
    source: portfolioTr.includes(s) ? "Portföy / Fiyat bekleniyor" : "BIST sembol listesi",
    portfolio: portfolioTr.includes(s),
  }));

  const usBase = usSymbols.map((s) => ({
    symbol: s,
    name: s,
    currency: "USD",
    market: "ABD",
    price: 0,
    changePercent: 0,
    volume: 0,
    source: portfolioUs.includes(s) ? "Portföy / Fiyat bekleniyor" : "ABD sembol listesi",
    portfolio: portfolioUs.includes(s),
  }));

  const turkishStocks = mergeStocks(trBase, trPrices).sort(
    (a, b) =>
      Number(b.portfolio || false) - Number(a.portfolio || false) ||
      Number(b.price || 0) - Number(a.price || 0)
  );

  const usStocks = mergeStocks(usBase, usPrices).sort(
    (a, b) =>
      Number(b.portfolio || false) - Number(a.portfolio || false) ||
      Number(b.price || 0) - Number(a.price || 0)
  );

  const prices = {};

  [...trPrices, ...usPrices].forEach((row) => {
    const symbol = normalizeSymbol(row.symbol).replace(/\.IS$/, "");
    if (symbol && row.price > 0) prices[symbol] = row.price;
  });

  return { turkishStocks, usStocks, prices };
}

async function getGoldPrices(usdTryRate) {
  const result = {};
  const metals = [];

  const addMetal = (symbol, name, priceTry, category = "Altın", source = "Canlı / Hesaplanan") => {
    const price = numberOrZero(priceTry);
    if (price <= 0) return;

    result[symbol] = price;

    metals.push({
      symbol,
      name,
      priceTry: price,
      price,
      currency: "TRY",
      category,
      source,
    });
  };

  const genelPara = await safeJson("https://api.genelpara.com/embed/altin.json");

  const gram = normalizeNumber(
    genelPara?.GA?.satis ||
      genelPara?.GA?.alis ||
      genelPara?.gram_altin?.satis ||
      genelPara?.gram_altin?.alis
  );

  const ceyrek =
    normalizeNumber(genelPara?.C?.satis || genelPara?.C?.alis) || (gram > 0 ? gram * 1.75 : 0);
  const yarim =
    normalizeNumber(genelPara?.Y?.satis || genelPara?.Y?.alis) || (gram > 0 ? gram * 3.5 : 0);
  const tam =
    normalizeNumber(genelPara?.T?.satis || genelPara?.T?.alis) || (gram > 0 ? gram * 7 : 0);
  const cumhuriyet =
    normalizeNumber(genelPara?.CMR?.satis || genelPara?.CMR?.alis) || (gram > 0 ? gram * 7.216 : 0);

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
    result.GREMSE = gram * 17.5;
    result.GREMSEALTIN = gram * 17.5;

    addMetal("GRAM", "Gram Altın", gram);
    addMetal("HAS", "Has Altın", gram);
    addMetal("AYAR_24", "24 Ayar Gram", gram);
    addMetal("AYAR_22", "22 Ayar Altın", gram * 0.916);
    addMetal("AYAR_18", "18 Ayar Altın", gram * 0.75);
    addMetal("AYAR_14", "14 Ayar Altın", gram * 0.585);
    addMetal("CEYREK", "Çeyrek Altın", ceyrek);
    addMetal("YARIM", "Yarım Altın", yarim);
    addMetal("TAM", "Tam Altın", tam);
    addMetal("CUMHURIYET", "Cumhuriyet Altını", cumhuriyet);
    addMetal("ATA", "Ata Altın", cumhuriyet);
    addMetal("RESAT", "Reşat Altın", cumhuriyet);
    addMetal("GREMSE", "Gremse Altın", gram * 17.5);
  }

  [
    ["GRAM", "Gram Altın", "Altın"],
    ["CEYREK", "Çeyrek Altın", "Altın"],
    ["YARIM", "Yarım Altın", "Altın"],
    ["TAM", "Tam Altın", "Altın"],
    ["CUMHURIYET", "Cumhuriyet Altını", "Altın"],
    ["ATA", "Ata Altın", "Altın"],
    ["RESAT", "Reşat Altın", "Altın"],
    ["GREMSE", "Gremse Altın", "Altın"],
    ["ONS", "Ons Altın", "Altın"],
    ["GUMUS", "Gram Gümüş", "Gümüş"],
    ["XAG", "Ons Gümüş", "Gümüş"],
    ["XPT", "Ons Platin", "Platin"],
    ["XPD", "Ons Paladyum", "Paladyum"],
  ].forEach(([symbol, name, category]) => {
    if (!metals.some((item) => item.symbol === symbol)) {
      metals.push({
        symbol,
        name,
        priceTry: result[symbol] || 0,
        price: result[symbol] || 0,
        currency: "TRY",
        category,
        source: result[symbol] ? "Canlı" : "Fiyat bekleniyor",
      });
    }
  });

  return { gold: result, metals };
}

function formatDateTR(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

async function getTefasFundOne(symbol) {
  const code = normalizeSymbol(symbol);
  if (!code) return null;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 21);

  const body = new URLSearchParams({
    fontip: "YAT",
    fonkod: code,
    bastarih: formatDateTR(start),
    bittarih: formatDateTR(end),
  });

  const data = await safeJson("https://www.tefas.gov.tr/api/DB/BindHistoryInfo", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://www.tefas.gov.tr",
      referer: "https://www.tefas.gov.tr/FonAnaliz.aspx",
      "x-requested-with": "XMLHttpRequest",
    },
    body,
  });

  const rows = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : Array.isArray(data?.Data)
        ? data.Data
        : [];

  const latest = rows
    .map((row) => {
      const price = normalizeNumber(
        row.FIYAT ||
          row.Fiyat ||
          row.fiyat ||
          row.BIRIMFIYAT ||
          row.BirimFiyat ||
          row.PRICE ||
          row.price
      );

      const name =
        row.FONUNVAN ||
        row.FONADI ||
        row.FON_ADI ||
        row.FonUnvan ||
        row.fonunvan ||
        row.name ||
        code;

      const date =
        row.TARIH ||
        row.Tarih ||
        row.tarih ||
        row.DATE ||
        row.date ||
        row.ISLEMTARIHI ||
        "";

      const changePercent = Number(
        String(
          row.GETIRI1G ||
            row.Getiri1G ||
            row.GUNLUKGETIRI ||
            row.GunlukGetiri ||
            row.changePercent ||
            0
        )
          .replace(",", ".")
          .replace(/[^\d.-]/g, "")
      );

      return { price, name, date, changePercent };
    })
    .filter((row) => row.price > 0)
    .pop();

  if (!latest) {
    return {
      symbol: code,
      name: code,
      price: 0,
      currency: "TRY",
      changePercent: 0,
      volume: 0,
      date: "",
      source: "TEFAS / Fiyat bekleniyor",
      portfolio: true,
    };
  }

  return {
    symbol: code,
    name: latest.name || code,
    price: latest.price,
    currency: "TRY",
    changePercent: Number.isFinite(latest.changePercent) ? latest.changePercent : 0,
    volume: 0,
    date: latest.date || "",
    source: "TEFAS / Son açıklanan fiyat",
    portfolio: true,
  };
}

async function getFundPayload(fundSymbols = []) {
  const clean = [...new Set((fundSymbols || []).map(normalizeSymbol).filter(Boolean))];

  const rows = [];

  for (const symbol of clean.slice(0, 60)) {
    const item = await getTefasFundOne(symbol);
    if (item) rows.push(item);
  }

  const prices = {};
  rows.forEach((row) => {
    if (row.symbol && row.price > 0) prices[row.symbol] = row.price;
  });

  return {
    funds: rows.sort((a, b) => Number(b.portfolio || false) - Number(a.portfolio || false)),
    prices,
  };
}

async function buildPayload(investments = {}) {
  const extra = extractPortfolioSymbols(investments);

  const usdTryRate = await getUsdTry();

  const [cryptoPayload, forex, goldPayload, stockPayload, fundPayload] = await Promise.all([
    getCryptoPayload(extra.crypto),
    getForexPrices(),
    getGoldPrices(usdTryRate),
    getStockPayload(extra),
    getFundPayload(extra.funds),
  ]);

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    prices: {
      usdTry: usdTryRate,
      usdTryRate,
      crypto: cryptoPayload.prices,
      forex,
      gold: goldPayload.gold,
      stocks: stockPayload.prices,
      funds: fundPayload.prices,
    },
    markets: {
      turkishStocks: stockPayload.turkishStocks,
      usStocks: stockPayload.usStocks,
      crypto: cryptoPayload.markets,
      metals: goldPayload.metals,
      forex: Object.entries(forex).map(([symbol, price]) => ({
        symbol,
        name: symbol,
        priceTry: price,
        price,
        currency: "TRY",
        source: "ExchangeRate",
      })),
      funds: fundPayload.funds,
    },
  };
}

export async function GET() {
  return Response.json(await buildPayload({}));
}

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {}

  return Response.json(await buildPayload(body?.investments || {}));
}
``
