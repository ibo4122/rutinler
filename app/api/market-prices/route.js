export const dynamic = "force-dynamic";

const GOLD_TYPES = {
  GRAM: "Gram Altın",
  HAS: "Has Altın",
  AYAR_24: "24 Ayar Gram",
  AYAR_22: "22 Ayar Altın",
  AYAR_18: "18 Ayar Altın",
  AYAR_14: "14 Ayar Altın",
  CEYREK: "Çeyrek Altın",
  YARIM: "Yarım Altın",
  TAM: "Tam Altın",
  CUMHURIYET: "Cumhuriyet Altını",
  ATA: "Ata Altın",
  RESAT: "Reşat Altın",
  GREMSE: "Gremse Altın",
  ONS: "Ons Altın",
};

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
        "accept": "application/json,text/plain,*/*",
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
  const rate = numberOrZero(data?.rates?.TRY);
  return rate || 0;
}

async function getCryptoPrices() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "AVAXUSDT", "DOGEUSDT", "LINKUSDT", "DOTUSDT", "MATICUSDT"];
  const encodedSymbols = encodeURIComponent(JSON.stringify(symbols));
  const data = await safeJson(`https://api.binance.com/api/v3/ticker/price?symbols=${encodedSymbols}`);
  const prices = {};

  if (Array.isArray(data)) {
    data.forEach((item) => {
      const symbol = String(item.symbol || "").replace("USDT", "");
      const price = numberOrZero(item.price);
      if (symbol && price > 0) prices[symbol] = price;
    });
  }

  return prices;
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

async function getGoldPrices(usdTryRate) {
  const result = {};

  const data = await safeJson("https://api.genelpara.com/embed/altin.json");
  const gram = normalizeNumber(data?.GA?.satis || data?.GA?.alis || data?.gram_altin?.satis || data?.gram_altin?.alis);
  const ceyrek = normalizeNumber(data?.C?.satis || data?.C?.alis || data?.ceyrek_altin?.satis || data?.ceyrek_altin?.alis);
  const yarim = normalizeNumber(data?.Y?.satis || data?.Y?.alis || data?.yarim_altin?.satis || data?.yarim_altin?.alis);
  const tam = normalizeNumber(data?.T?.satis || data?.T?.alis || data?.tam_altin?.satis || data?.tam_altin?.alis);
  const cumhuriyet = normalizeNumber(data?.CMR?.satis || data?.CMR?.alis || data?.cumhuriyet_altini?.satis || data?.cumhuriyet_altini?.alis);

  if (gram > 0) {
    result.GRAM = gram;
    result.HAS = gram;
    result.AYAR_24 = gram;
    result.AYAR_22 = gram * 0.916;
    result.AYAR_18 = gram * 0.750;
    result.AYAR_14 = gram * 0.585;
  }
  if (ceyrek > 0) result.CEYREK = ceyrek;
  if (yarim > 0) result.YARIM = yarim;
  if (tam > 0) result.TAM = tam;
  if (cumhuriyet > 0) {
    result.CUMHURIYET = cumhuriyet;
    result.ATA = cumhuriyet;
    result.RESAT = cumhuriyet;
  }
  if (gram > 0) result.GREMSE = gram * 2.5;

  const binanceGold = await safeJson("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT");
  const onsUsd = numberOrZero(binanceGold?.price);
  if (onsUsd > 0) {
    result.ONS = onsUsd * usdTryRate;
    if (!result.GRAM && usdTryRate > 0) {
      const estimatedGram = (onsUsd * usdTryRate) / 31.1034768;
      result.GRAM = estimatedGram;
      result.HAS = estimatedGram;
      result.AYAR_24 = estimatedGram;
      result.AYAR_22 = estimatedGram * 0.916;
      result.AYAR_18 = estimatedGram * 0.750;
      result.AYAR_14 = estimatedGram * 0.585;
      result.CEYREK = estimatedGram * 1.75;
      result.YARIM = estimatedGram * 3.5;
      result.TAM = estimatedGram * 7.0;
      result.CUMHURIYET = estimatedGram * 7.216;
      result.ATA = estimatedGram * 7.216;
      result.RESAT = estimatedGram * 7.216;
      result.GREMSE = estimatedGram * 17.5;
    }
  }

  Object.keys(GOLD_TYPES).forEach((key) => {
    if (!result[key]) result[key] = 0;
  });

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

