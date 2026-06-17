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

async function safeJson(url) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 fiyat-guncelleme",
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
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

async function getCryptoPrices() {
  const prices = {};

  const binanceSymbols = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "ENAUSDT", "AVAXUSDT", "AIXBTUSDT", "RENDERUSDT",
    "SUSDT", "ATOMUSDT", "ZKUSDT", "LRCUSDT", "APTUSDT", "FETUSDT", "GRTUSDT", "NEIROUSDT",
    "UNIUSDT", "PIXELUSDT", "DOGSUSDT", "THLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT",
    "LINKUSDT", "DOTUSDT", "MATICUSDT", "TRXUSDT", "LTCUSDT", "BCHUSDT", "NEARUSDT", "ARBUSDT", "OPUSDT"
  ];

  const binanceData = await safeJson(
    `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`
  );

  if (Array.isArray(binanceData)) {
    binanceData.forEach((item) => {
      const symbol = String(item.symbol || "").replace("USDT", "");
      const price = numberOrZero(item.price);
      if (symbol && price > 0) prices[symbol] = price;
    });
  }

  const coinGeckoIds = [
    "bitcoin", "ethereum", "solana", "sui", "ethena", "avalanche-2", "aixbt", "render-token",
    "sonic-3", "cosmos", "zksync", "loopring", "aptos", "artificial-superintelligence-alliance",
    "the-graph", "neiro-3", "uniswap", "pixels", "dogs-2", "thala", "binancecoin", "ripple",
    "cardano", "dogecoin", "chainlink", "polkadot", "polygon", "tron", "litecoin", "bitcoin-cash",
    "near", "arbitrum", "optimism"
  ].join(",");

  const geckoData = await safeJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd`
  );

  const geckoMap = {
    BTC: "bitcoin",
    BITCOIN: "bitcoin",
    ETH: "ethereum",
    ETHEREUM: "ethereum",
    SOL: "solana",
    SOLANA: "solana",
    SUI: "sui",
    ENA: "ethena",
    ETHENA: "ethena",
    AVAX: "avalanche-2",
    AVALANCHE: "avalanche-2",
    AIXBT: "aixbt",
    RENDER: "render-token",
    RNDR: "render-token",
    S: "sonic-3",
    SONIC: "sonic-3",
    ATOM: "cosmos",
    COSMOS: "cosmos",
    ZK: "zksync",
    ZKSYNC: "zksync",
    LRC: "loopring",
    LOOPRING: "loopring",
    APT: "aptos",
    APTOS: "aptos",
    FET: "artificial-superintelligence-alliance",
    ASI: "artificial-superintelligence-alliance",
    GRT: "the-graph",
    GRAPH: "the-graph",
    NEIRO: "neiro-3",
    UNI: "uniswap",
    UNISWAP: "uniswap",
    PIXEL: "pixels",
    PIXELS: "pixels",
    DOGS: "dogs-2",
    THL: "thala",
    THALA: "thala",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    DOGE: "dogecoin",
    LINK: "chainlink",
    DOT: "polkadot",
    MATIC: "polygon",
    POLYGON: "polygon",
    TRX: "tron",
    LTC: "litecoin",
    BCH: "bitcoin-cash",
    NEAR: "near",
    ARB: "arbitrum",
    OP: "optimism",
  };

  Object.entries(geckoMap).forEach(([symbol, id]) => {
    const price = numberOrZero(geckoData?.[id]?.usd);
    if (price > 0 && !prices[symbol]) prices[symbol] = price;
  });

  return prices;
}

async function getGoldPrices(usdTryRate) {
  const result = {};

  const genelPara = await safeJson("https://api.genelpara.com/embed/altin.json");
  const gram = normalizeNumber(genelPara?.GA?.satis || genelPara?.GA?.alis || genelPara?.gram_altin?.satis || genelPara?.gram_altin?.alis);
  const ceyrek = normalizeNumber(genelPara?.C?.satis || genelPara?.C?.alis || genelPara?.ceyrek_altin?.satis || genelPara?.ceyrek_altin?.alis);
  const yarim = normalizeNumber(genelPara?.Y?.satis || genelPara?.Y?.alis || genelPara?.yarim_altin?.satis || genelPara?.yarim_altin?.alis);
  const tam = normalizeNumber(genelPara?.T?.satis || genelPara?.T?.alis || genelPara?.tam_altin?.satis || genelPara?.tam_altin?.alis);
  const cumhuriyet = normalizeNumber(genelPara?.CMR?.satis || genelPara?.CMR?.alis || genelPara?.cumhuriyet_altini?.satis || genelPara?.cumhuriyet_altini?.alis);

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
  }

  if (ceyrek > 0) {
    result.CEYREK = ceyrek;
    result.CEYREKALTIN = ceyrek;
  }
  if (yarim > 0) {
    result.YARIM = yarim;
    result.YARIMALTIN = yarim;
  }
  if (tam > 0) {
    result.TAM = tam;
    result.TAMALTIN = tam;
  }
  if (cumhuriyet > 0) {
    result.CUMHURIYET = cumhuriyet;
    result.CUMHURIYETALTINI = cumhuriyet;
    result.ATA = cumhuriyet;
    result.ATAALTIN = cumhuriyet;
    result.RESAT = cumhuriyet;
    result.RESATALTIN = cumhuriyet;
  }
  if (gram > 0) {
    result.GREMSE = gram * 2.5;
    result.GREMSEALTIN = gram * 2.5;
  }

  const paxg = await safeJson("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT");
  const onsUsd = numberOrZero(paxg?.price);

  if (onsUsd > 0 && usdTryRate > 0) {
    result.ONS = onsUsd * usdTryRate;
    result.ONSALTIN = onsUsd * usdTryRate;

    if (!result.GRAM) {
      const estimatedGram = (onsUsd * usdTryRate) / 31.1034768;
      result.GRAM = estimatedGram;
      result.GRAMALTIN = estimatedGram;
      result.HAS = estimatedGram;
      result.HASALTIN = estimatedGram;
      result.AYAR_24 = estimatedGram;
      result.AYAR24 = estimatedGram;
      result.AYAR_22 = estimatedGram * 0.916;
      result.AYAR22 = estimatedGram * 0.916;
      result.AYAR_18 = estimatedGram * 0.75;
      result.AYAR18 = estimatedGram * 0.75;
      result.AYAR_14 = estimatedGram * 0.585;
      result.AYAR14 = estimatedGram * 0.585;
      result.CEYREK = estimatedGram * 1.75;
      result.CEYREKALTIN = estimatedGram * 1.75;
      result.YARIM = estimatedGram * 3.5;
      result.YARIMALTIN = estimatedGram * 3.5;
      result.TAM = estimatedGram * 7;
      result.TAMALTIN = estimatedGram * 7;
      result.CUMHURIYET = estimatedGram * 7.216;
      result.CUMHURIYETALTINI = estimatedGram * 7.216;
      result.ATA = estimatedGram * 7.216;
      result.ATAALTIN = estimatedGram * 7.216;
      result.RESAT = estimatedGram * 7.216;
      result.RESATALTIN = estimatedGram * 7.216;
      result.GREMSE = estimatedGram * 17.5;
      result.GREMSEALTIN = estimatedGram * 17.5;
    }
  }

  return result;
}

export async function GET() {
  const usdTryRate = await getUsdTry();
  const [crypto, forex, gold] = await Promise.all([
    getCryptoPrices(),
    getForexPrices(),
    getGoldPrices(usdTryRate),
  ]);

  return Response.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    prices: {
      usdTry: usdTryRate,
      usdTryRate,
      crypto,
      forex,
      gold,
      stocks: {},
    },
  });
}
