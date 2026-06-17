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
    .replace(/[^A-Z0-9.=]/g, "");
}

async function safeJson(url) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 personal-finance-market-panel",
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
  const make = (symbol) => rates[symbol] ? numberOrZero(1 / Number(rates[symbol])) : 0;
  const out = {
    USD: make("USD"), EUR: make("EUR"), GBP: make("GBP"), CHF: make("CHF"), JPY: make("JPY"),
  };
  return {
    ...out,
    USDTRY: out.USD, EURTRY: out.EUR, GBPTRY: out.GBP, CHFTRY: out.CHF, JPYTRY: out.JPY,
  };
}

function extractPortfolioSymbols(investments = {}) {
  const crypto = new Set();
  const trStocks = new Set();
  const usStocks = new Set();
  const stocks = new Set();
  const metals = new Set();
  const forex = new Set();

  (investments.crypto || []).forEach((item) => {
    const symbol = normalizeSymbol(item.title).replace(/USDT$/, "");
    if (symbol) crypto.add(symbol);
  });

  (investments.stocks || []).forEach((item) => {
    const raw = normalizeSymbol(item.title).replace(/\.IS$/, "");
    if (!raw) return;
    stocks.add(raw);
    if ((item.currency || "TRY") === "TRY") trStocks.add(raw);
    else usStocks.add(raw);
  });

  (investments.gold || []).forEach((item) => {
    const symbol = normalizeSymbol(item.goldType || item.title || "GRAM");
    if (symbol) metals.add(symbol);
  });

  (investments.forex || []).forEach((item) => {
    const symbol = normalizeSymbol(item.currency || item.title || "USD");
    if (symbol) forex.add(symbol);
  });

  return { crypto: [...crypto], trStocks: [...trStocks], usStocks: [...usStocks], stocks: [...stocks], metals: [...metals], forex: [...forex] };
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
      });
    });
  }

  if (extraSymbols.length) {
    await Promise.all(extraSymbols.map(async (symbol) => {
      if (prices[symbol]) return;
      const data = await safeJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}USDT`);
      const price = numberOrZero(data?.lastPrice);
      if (price > 0) {
        prices[symbol] = price;
        prices[`${symbol}USDT`] = price;
        markets.unshift({
          id: symbol.toLowerCase(), symbol, name: symbol, price,
          change24h: Number(data?.priceChangePercent || 0), marketCap: 0,
          volume: Number(data?.quoteVolume || data?.volume || 0), source: "Binance / Portföy",
        });
      }
    }));
  }

  return { markets, prices };
}

async function getCoinGeckoCryptoMarkets(existingPrices = {}) {
  const markets = [];
  for (const page of [1, 2, 3, 4]) {
    const data = await safeJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h`);
    if (!Array.isArray(data)) continue;
    markets.push(...data.map((coin) => {
      const symbol = normalizeSymbol(coin.symbol);
      const price = numberOrZero(coin.current_price);
      if (symbol && price > 0 && !existingPrices[symbol]) existingPrices[symbol] = price;
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
      };
    }));
  }
  return { markets, prices: existingPrices };
}

async function getCryptoPayload(extraSymbols = []) {
  const binance = await getBinanceCryptoMarkets(extraSymbols);
  const gecko = await getCoinGeckoCryptoMarkets({ ...binance.prices });

  const bySymbol = new Map();
  [...gecko.markets, ...binance.markets].forEach((item) => {
    if (!item.symbol) return;
    const existing = bySymbol.get(item.symbol);
    if (!existing || (!existing.price && item.price) || item.source === "Binance") bySymbol.set(item.symbol, item);
  });

  return { prices: gecko.prices, markets: [...bySymbol.values()].filter((item) => item.price > 0).sort((a, b) => (b.marketCap || b.volume || 0) - (a.marketCap || a.volume || 0)) };
}

async function getYahooQuotes(symbols, type) {
  const clean = [...new Set(symbols.filter(Boolean))];
  if (!clean.length) return [];
  const rows = [];
  for (let i = 0; i < clean.length; i += 60) {
    const chunk = clean.slice(i, i + 60);
    const data = await safeJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(","))}`);
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
      source: "Yahoo Finance",
    })));
  }
  return rows.filter((row) => row.symbol);
}

const bistUniverse = [
  "A1CAP","ACSEL","ADEL","AEFES","AGESA","AGHOL","AGROT","AHGAZ","AKBNK","AKCNS","AKENR","AKFGY","AKFYE","AKGRT","AKSA","AKSEN","ALARK","ALBRK","ALCAR","ALCTL","ALFAS","ALKIM","ANHYT","ANSGR","ARCLK","ARDYZ","ASELS","ASTOR","ASUZU","ATAKP","AYDEM","AYEN","AYGAZ","BAGFS","BANVT","BERA","BEYAZ","BIMAS","BIOEN","BIZIM","BRSAN","BRYAT","BSOKE","BTCIM","BUCIM","CANTE","CCOLA","CIMSA","CLEBI","CWENE","DOAS","DOHOL","ECILC","ECZYT","EFOR","EGEEN","EKGYO","ENERY","ENJSA","ENKAI","EREGL","EUPWR","FROTO","GARAN","GENIL","GESAN","GOLTS","GOZDE","GUBRF","HALKB","HEKTS","ISCTR","ISDMR","ISMEN","KARSN","KCAER","KCHOL","KONTR","KORDS","KOZAA","KOZAL","KRDMD","MAVI","MGROS","MIATK","ODAS","OYAKC","PETKM","PGSUS","SAHOL","SASA","SISE","SMRTG","SOKM","TAVHL","TCELL","THYAO","TKFEN","TOASO","TSKB","TTKOM","TTRAK","TUPRS","ULKER","VAKBN","VESBE","VESTL","YKBNK","ZOREN"
];

const usUniverse = [
  "AAPL","MSFT","NVDA","GOOGL","GOOG","AMZN","META","TSLA","AVGO","AMD","NFLX","ORCL","CRM","ADBE","INTC","QCOM","CSCO","IBM","JPM","BAC","WFC","GS","MS","C","V","MA","PYPL","AXP","KO","PEP","MCD","NKE","DIS","WMT","COST","HD","LOW","TGT","SBUX","PFE","MRK","JNJ","UNH","ABBV","LLY","TMO","ABT","XOM","CVX","COP","BA","CAT","GE","MMM","DE","LMT","RTX","SPY","QQQ","VOO","VTI","DIA","IWM","ARKK","PLTR","SNOW","UBER","SHOP","SQ","COIN","MSTR","RIVN","LCID","NIO","BABA","TSM","ASML","SONY","TM"
];

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
    price: 0,
    changePercent: 0,
    volume: 0,
    source: "Twelve Data",
  })).filter((item) => item.symbol);
}

function mergeStocks(base, priced) {
  const map = new Map(priced.map((item) => [normalizeSymbol(item.symbol), item]));
  const merged = base.map((item) => {
    const found = map.get(normalizeSymbol(item.symbol));
    return found ? { ...item, ...found, source: `${item.source || "Liste"} + fiyat` } : item;
  });
  priced.forEach((item) => {
    if (!merged.some((row) => normalizeSymbol(row.symbol) === normalizeSymbol(item.symbol))) merged.push(item);
  });
  return merged;
}

async function getStockPayload(extra = {}) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || "";
  const portfolioTr = extra.trStocks || [];
  const portfolioUs = extra.usStocks || [];

  const trSymbols = [...new Set([...bistUniverse, ...portfolioTr])];
  const usSymbols = [...new Set([...usUniverse, ...portfolioUs])];

  const [tdTr, tdNasdaq, tdNyse, trPrices, usPrices] = await Promise.all([
    getTwelveDataStocks("BIST", "Turkey", apiKey),
    getTwelveDataStocks("NASDAQ", "United States", apiKey),
    getTwelveDataStocks("NYSE", "United States", apiKey),
    getYahooQuotes(trSymbols.map((s) => `${s}.IS`), "TR"),
    getYahooQuotes(usSymbols, "US"),
  ]);

  const trBase = tdTr.length ? tdTr.slice(0, 900) : trSymbols.map((s) => ({ symbol: s, name: s, currency: "TRY", market: "BIST", price: 0, changePercent: 0, volume: 0, source: "BIST sembol listesi" }));
  const usBase = (tdNasdaq.length || tdNyse.length) ? [...tdNasdaq, ...tdNyse].slice(0, 1400) : usSymbols.map((s) => ({ symbol: s, name: s, currency: "USD", market: "ABD", price: 0, changePercent: 0, volume: 0, source: "ABD sembol listesi" }));

  const turkishStocks = mergeStocks(trBase, trPrices);
  const usStocks = mergeStocks(usBase, usPrices);

  const prices = {};
  [...trPrices, ...usPrices].forEach((row) => {
    const symbol = normalizeSymbol(row.symbol).replace(/\.IS$/, "");
    if (symbol && row.price > 0) prices[symbol] = row.price;
  });

  return { turkishStocks, usStocks, prices };
}

async function getCommodityQuotes(usdTryRate) {
  const rows = await getYahooQuotes(["GC=F", "SI=F", "PL=F", "PA=F"], "US");
  const by = new Map(rows.map((row) => [row.rawSymbol || row.symbol, row]));
  const goldOz = numberOrZero(by.get("GC=F")?.price);
  const silverOz = numberOrZero(by.get("SI=F")?.price);
  const platinumOz = numberOrZero(by.get("PL=F")?.price);
  const palladiumOz = numberOrZero(by.get("PA=F")?.price);
  return { goldOz, silverOz, platinumOz, palladiumOz };
}

async function getGoldPrices(usdTryRate) {
  const result = {};
  const metals = [];

  function addMetal(symbol, name, priceTry, category = "Altın", source = "Canlı / Hesaplanan") {
    const price = numberOrZero(priceTry);
    if (price <= 0) return;
    result[symbol] = price;
    metals.push({ symbol, name, priceTry: price, price: price, currency: "TRY", category, source });
  }

  const [genelPara, commodities] = await Promise.all([
    safeJson("https://api.genelpara.com/embed/altin.json"),
    getCommodityQuotes(usdTryRate),
  ]);

  const gram = normalizeNumber(genelPara?.GA?.satis || genelPara?.GA?.alis || genelPara?.gram_altin?.satis || genelPara?.gram_altin?.alis) || (commodities.goldOz && usdTryRate ? (commodities.goldOz * usdTryRate) / 31.1034768 : 0);
  const ceyrek = normalizeNumber(genelPara?.C?.satis || genelPara?.C?.alis || genelPara?.ceyrek_altin?.satis || genelPara?.ceyrek_altin?.alis) || gram * 1.75;
  const yarim = normalizeNumber(genelPara?.Y?.satis || genelPara?.Y?.alis || genelPara?.yarim_altin?.satis || genelPara?.yarim_altin?.alis) || gram * 3.5;
  const tam = normalizeNumber(genelPara?.T?.satis || genelPara?.T?.alis || genelPara?.tam_altin?.satis || genelPara?.tam_altin?.alis) || gram * 7;
  const cumhuriyet = normalizeNumber(genelPara?.CMR?.satis || genelPara?.CMR?.alis || genelPara?.cumhuriyet_altini?.satis || genelPara?.cumhuriyet_altini?.alis) || gram * 7.216;

  if (gram > 0) {
    result.GRAM = gram; result.GRAMALTIN = gram; result.HAS = gram; result.HASALTIN = gram;
    result.AYAR_24 = gram; result.AYAR24 = gram;
    result.AYAR_22 = gram * 0.916; result.AYAR22 = gram * 0.916;
    result.AYAR_18 = gram * 0.75; result.AYAR18 = gram * 0.75;
    result.AYAR_14 = gram * 0.585; result.AYAR14 = gram * 0.585;
    result.GREMSE = gram * 17.5; result.GREMSEALTIN = gram * 17.5;
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

  if (commodities.goldOz > 0 && usdTryRate > 0) {
    const onsTry = commodities.goldOz * usdTryRate;
    result.ONS = onsTry; result.ONSALTIN = onsTry;
    addMetal("ONS", "Ons Altın", onsTry, "Altın", "Yahoo Finance GC=F");
  }

  if (commodities.silverOz > 0 && usdTryRate > 0) {
    const silverOzTry = commodities.silverOz * usdTryRate;
    const silverGramTry = silverOzTry / 31.1034768;
    result.GUMUS = silverGramTry; result.GUMUSTRY = silverGramTry; result.XAG = silverOzTry;
    addMetal("GUMUS", "Gram Gümüş", silverGramTry, "Gümüş", "Yahoo Finance SI=F");
    addMetal("XAG", "Ons Gümüş", silverOzTry, "Gümüş", "Yahoo Finance SI=F");
  }

  if (commodities.platinumOz > 0 && usdTryRate > 0) {
    result.XPT = commodities.platinumOz * usdTryRate;
    addMetal("XPT", "Ons Platin", result.XPT, "Platin", "Yahoo Finance PL=F");
  }

  if (commodities.palladiumOz > 0 && usdTryRate > 0) {
    result.XPD = commodities.palladiumOz * usdTryRate;
    addMetal("XPD", "Ons Paladyum", result.XPD, "Paladyum", "Yahoo Finance PA=F");
  }

  return { gold: result, metals };
}

async function buildPayload(investments = {}) {
  const extra = extractPortfolioSymbols(investments);
  const usdTryRate = await getUsdTry();
  const [cryptoPayload, forex, goldPayload, stockPayload] = await Promise.all([
    getCryptoPayload(extra.crypto),
    getForexPrices(),
    getGoldPrices(usdTryRate),
    getStockPayload(extra),
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
    },
    markets: {
      turkishStocks: stockPayload.turkishStocks,
      usStocks: stockPayload.usStocks,
      crypto: cryptoPayload.markets,
      metals: goldPayload.metals,
      forex: Object.entries(forex).map(([symbol, price]) => ({ symbol, name: symbol, priceTry: price, price, currency: "TRY", source: "ExchangeRate" })),
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

