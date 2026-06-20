export const dynamic = "force-dynamic";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Hisse senetleri: TradingView scanner API'si (ücretsiz, auth yok, Node/Vercel uyumlu)
// tüm BIST ve ABD evrenini tek istekte verir: sembol, ad, fiyat, günlük değişim %,
// hacim ve piyasa değeri (piyasa değerine göre sıralı). Eski Yahoo/Twelve + sabit
// sembol listeleri kaldırıldı (kapsam dardı ve Yahoo auth/limit sorunları vardı).
async function getTradingViewStocks(market, limit) {
  const data = await safeJson(`https://scanner.tradingview.com/${market}/scan`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({
      columns: ["name", "description", "close", "change", "volume", "market_cap_basic"],
      filter: [{ left: "type", operation: "in_range", right: ["stock", "dr"] }],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      range: [0, limit],
    }),
  });

  const rows = Array.isArray(data?.data) ? data.data : [];
  const currency = market === "turkey" ? "TRY" : "USD";
  const marketLabel = market === "turkey" ? "BIST" : "ABD";

  return rows
    .map((row) => {
      const d = row.d || [];
      const symbol = normalizeSymbol(d[0] || String(row.s || "").split(":").pop());
      const price = numberOrZero(d[2]);
      if (!symbol) return null;
      return {
        symbol,
        name: d[1] || d[0] || symbol,
        price,
        changePercent: Number(d[3] || 0),
        volume: Number(d[4] || 0),
        marketCap: Number(d[5] || 0),
        currency,
        market: marketLabel,
        source: "TradingView",
      };
    })
    .filter(Boolean);
}

async function getStockPayload(extra = {}) {
  const portfolioTr = (extra.trStocks || []).map(normalizeSymbol);
  const portfolioUs = (extra.usStocks || []).map(normalizeSymbol);

  // TR'nin tamamı ~610 sembol → 700 hepsini kapsar. ABD'de piyasa değerine göre
  // en büyük ~1500 (retail portföydeki tüm popüler hisseleri içerir).
  const [trRows, usRows] = await Promise.all([
    getTradingViewStocks("turkey", 700),
    getTradingViewStocks("america", 1500),
  ]);

  const sortPortfolioFirst = (rows, portfolioSet) =>
    rows
      .map((r) => ({ ...r, portfolio: portfolioSet.includes(r.symbol) }))
      .sort(
        (a, b) =>
          Number(b.portfolio || false) - Number(a.portfolio || false) ||
          (b.marketCap || 0) - (a.marketCap || 0)
      );

  const turkishStocks = sortPortfolioFirst(trRows, portfolioTr);
  const usStocks = sortPortfolioFirst(usRows, portfolioUs);

  const prices = {};
  [...trRows, ...usRows].forEach((row) => {
    if (row.symbol && row.price > 0) prices[row.symbol] = row.price;
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

  // truncgil canlı altın/metal verisi (genelpara kapandı). Selling tercih edilir.
  const data = await safeJson("https://finance.truncgil.com/api/today.json");
  const rates = data?.Rates || data || {};
  const pick = (...keys) => {
    for (const key of keys) {
      const node = rates?.[key];
      const value = normalizeNumber(node?.Selling ?? node?.Buying ?? node);
      if (value > 0) return value;
    }
    return 0;
  };

  const gram = pick("GRA", "HAS", "GRAMALTIN");
  const ceyrek = pick("CEYREKALTIN") || (gram > 0 ? gram * 1.75 : 0);
  const yarim = pick("YARIMALTIN") || (gram > 0 ? gram * 3.5 : 0);
  const tam = pick("TAMALTIN") || (gram > 0 ? gram * 7 : 0);
  const cumhuriyet = pick("CUMHURIYETALTINI") || (gram > 0 ? gram * 7.216 : 0);
  const ata = pick("ATAALTIN") || cumhuriyet;
  const resat = pick("RESATALTIN") || cumhuriyet;
  const gremse = pick("GREMSEALTIN") || (gram > 0 ? gram * 17.5 : 0);
  const ayar22 = pick("22AYARALTIN") || (gram > 0 ? gram * 0.916 : 0);
  const ayar18 = pick("18AYARALTIN") || (gram > 0 ? gram * 0.75 : 0);
  const ayar14 = pick("14AYARALTIN") || (gram > 0 ? gram * 0.585 : 0);
  const gumus = pick("GUMUS"); // gram gümüş (TRY)
  const onsAltin = pick("ONS") || (gram > 0 ? gram * 31.1035 : 0); // truncgil ONS 0 dönebiliyor → gramdan hesapla
  const onsGumus = gumus > 0 ? gumus * 31.1035 : 0; // gram → ons
  const gramPlatin = pick("GPL", "PLATIN"); // truncgil gram platin veriyor
  const gramPaladyum = pick("PAL", "PALADYUM"); // truncgil gram paladyum veriyor
  const platin = gramPlatin > 0 ? gramPlatin * 31.1035 : 0; // ons platin
  const paladyum = gramPaladyum > 0 ? gramPaladyum * 31.1035 : 0; // ons paladyum

  if (gram > 0) {
    result.GRAM = gram;
    result.GRAMALTIN = gram;
    result.HAS = gram;
    result.HASALTIN = gram;
    result.AYAR_24 = gram;
    result.AYAR24 = gram;
    result.AYAR_22 = ayar22;
    result.AYAR22 = ayar22;
    result.AYAR_18 = ayar18;
    result.AYAR18 = ayar18;
    result.AYAR_14 = ayar14;
    result.AYAR14 = ayar14;
    result.GREMSE = gremse;
    result.GREMSEALTIN = gremse;

    addMetal("GRAM", "Gram Altın", gram);
    addMetal("HAS", "Has Altın", gram);
    addMetal("AYAR_24", "24 Ayar Gram", gram);
    addMetal("AYAR_22", "22 Ayar Altın", ayar22);
    addMetal("AYAR_18", "18 Ayar Altın", ayar18);
    addMetal("AYAR_14", "14 Ayar Altın", ayar14);
    addMetal("CEYREK", "Çeyrek Altın", ceyrek);
    addMetal("YARIM", "Yarım Altın", yarim);
    addMetal("TAM", "Tam Altın", tam);
    addMetal("CUMHURIYET", "Cumhuriyet Altını", cumhuriyet);
    addMetal("ATA", "Ata Altın", ata);
    addMetal("RESAT", "Reşat Altın", resat);
    addMetal("GREMSE", "Gremse Altın", gremse);
  }

  addMetal("ONS", "Ons Altın", onsAltin, "Altın", "truncgil");
  addMetal("GUMUS", "Gram Gümüş", gumus, "Gümüş", "truncgil");
  addMetal("XAG", "Ons Gümüş", onsGumus, "Gümüş", "truncgil");
  addMetal("XPT", "Ons Platin", platin, "Platin", "truncgil");
  addMetal("XPD", "Ons Paladyum", paladyum, "Paladyum", "truncgil");

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

// Fon (TEFAS) fiyatları: resmi TEFAS API'si (BindHistoryInfo) kapalı (ERR-006) ve
// fintables Cloudflare "managed challenge" ile sunucu fetch'ini bloklar. hangikredi
// fon sayfası HTML'i Cloudflare'siz, Node fetch ile sorunsuz açılır ve son birim pay
// fiyatını `data-testid="initial-data-last"` içinde verir (değişim: initial-data-cp).
async function fetchText(url) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "tr-TR,tr;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch (error) {
    console.log("market text error", url, error?.message || error);
    return "";
  }
}

async function getHangikrediFundOne(symbol) {
  const code = normalizeSymbol(symbol);
  if (!code) return null;

  const html = await fetchText(`https://www.hangikredi.com/yatirim-araclari/fon/${encodeURIComponent(code)}`);

  const value = normalizeNumber((html.match(/data-testid="initial-data-last">([\d.,]+)/) || [])[1] || "");

  // initial-data-cp: "(<!-- -->%-1,08<!-- -->)" → -1.08
  const cpBlock = (html.match(/data-testid="initial-data-cp">([\s\S]*?)<\/div>/) || [])[1] || "";
  const cpMatch = cpBlock.replace(/<!--[\s\S]*?-->/g, "").match(/-?\d+(?:[.,]\d+)?/);
  const changePercent = cpMatch ? Number(cpMatch[0].replace(",", ".")) : 0;

  // <title> "AFT Fon - AK PORTFÖY YENİ TEKNOLOJİ" → "AK PORTFÖY YENİ TEKNOLOJİ"
  const titleRaw = (html.match(/<title>([^<|]+)/) || [])[1] || "";
  const name = titleRaw.replace(/^[A-ZİĞÜŞÖÇ0-9]+\s*Fon\s*-\s*/i, "").trim() || code;

  if (value <= 0) {
    return {
      symbol: code,
      name: code,
      price: 0,
      currency: "TRY",
      changePercent: 0,
      volume: 0,
      date: "",
      source: "Fon / Fiyat bekleniyor",
      portfolio: true,
    };
  }

  return {
    symbol: code,
    name,
    price: value,
    currency: "TRY",
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    volume: 0,
    date: "",
    source: "hangikredi · TEFAS son fiyat",
    portfolio: true,
  };
}

async function getFundPayload(fundSymbols = []) {
  const clean = [...new Set((fundSymbols || []).map(normalizeSymbol).filter(Boolean))];

  const rows = [];
  for (const symbol of clean.slice(0, 40)) {
    const item = await getHangikrediFundOne(symbol);
    if (item) rows.push(item);
    await sleep(120);
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

// --- Önbellek ve son-geçerli-fiyat dayanıklılığı ---
// Sıcak instance boyunca: aynı portföy için kısa süre (TTL) içinde tekrar çağrı
// gelirse yeniden çekmeden döneriz (hız + kaynaklara yük binmemesi). Ayrıca bir
// kaynak boş dönerse, o sembolün son geçerli fiyatını koruruz (dayanıklılık).
const PAYLOAD_TTL_MS = 45_000;
const payloadCache = new Map();
let lastGoodPrices = null;

function payloadCacheKey(extra) {
  return JSON.stringify({
    c: [...(extra.crypto || [])].sort(),
    tr: [...(extra.trStocks || [])].sort(),
    us: [...(extra.usStocks || [])].sort(),
    f: [...(extra.funds || [])].sort(),
  });
}

function mergeGoodMap(previous = {}, fresh = {}) {
  const out = { ...previous };
  for (const [key, value] of Object.entries(fresh || {})) {
    if (numberOrZero(value) > 0) out[key] = value;
  }
  return out;
}

async function buildPayload(investments = {}, extra = null) {
  extra = extra || extractPortfolioSymbols(investments);

  const usdTryRate = await getUsdTry();

  const [cryptoPayload, forex, goldPayload, stockPayload, fundPayload] = await Promise.all([
    getCryptoPayload(extra.crypto),
    getForexPrices(),
    getGoldPrices(usdTryRate),
    getStockPayload(extra),
    getFundPayload(extra.funds),
  ]);

  const prices = {
    usdTry: usdTryRate || lastGoodPrices?.usdTry || 0,
    usdTryRate: usdTryRate || lastGoodPrices?.usdTryRate || 0,
    crypto: mergeGoodMap(lastGoodPrices?.crypto, cryptoPayload.prices),
    forex: mergeGoodMap(lastGoodPrices?.forex, forex),
    gold: mergeGoodMap(lastGoodPrices?.gold, goldPayload.gold),
    stocks: mergeGoodMap(lastGoodPrices?.stocks, stockPayload.prices),
    funds: mergeGoodMap(lastGoodPrices?.funds, fundPayload.prices),
  };

  lastGoodPrices = prices;

  return {
    ok: true,
    cached: false,
    updatedAt: new Date().toISOString(),
    prices,
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

async function getPayload(investments = {}) {
  const extra = extractPortfolioSymbols(investments);
  const key = payloadCacheKey(extra);
  const now = Date.now();

  const hit = payloadCache.get(key);
  if (hit && now - hit.ts < PAYLOAD_TTL_MS) {
    return { ...hit.payload, cached: true };
  }

  const payload = await buildPayload(investments, extra);
  payloadCache.set(key, { payload, ts: now });
  return payload;
}

export async function GET() {
  return Response.json(await getPayload({}));
}

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {}

  return Response.json(await getPayload(body?.investments || {}));
}
``
