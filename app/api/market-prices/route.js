export const dynamic = "force-dynamic";

const SUPPORTED_FIAT = ["USD", "EUR", "GBP", "CHF", "JPY", "TRY"];
const BINANCE_BASE_URL = "https://api.binance.com/api/v3/ticker/price";
const FRANKFURTER_BASE_URL = "https://api.frankfurter.app/latest";

function cleanSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function getUsdTryRate() {
  const response = await fetch(`${FRANKFURTER_BASE_URL}?from=USD&to=TRY`, {
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error("USD/TRY kuru alınamadı.");
  }

  const data = await response.json();
  return Number(data?.rates?.TRY || 0);
}

async function getFiatTryRates(currencies) {
  const result = { TRY: 1 };
  const targets = unique(currencies.map(cleanSymbol)).filter(
    (currency) => currency !== "TRY" && SUPPORTED_FIAT.includes(currency)
  );

  await Promise.all(
    targets.map(async (currency) => {
      try {
        const response = await fetch(`${FRANKFURTER_BASE_URL}?from=${currency}&to=TRY`, {
          next: { revalidate: 60 * 30 },
        });

        if (!response.ok) return;

        const data = await response.json();
        const rate = Number(data?.rates?.TRY || 0);
        if (rate > 0) result[currency] = rate;
      } catch {}
    })
  );

  return result;
}

async function getCryptoTryPrices(symbols, usdTryRate) {
  const result = {};
  const normalizedSymbols = unique(symbols.map(cleanSymbol));

  await Promise.all(
    normalizedSymbols.map(async (rawSymbol) => {
      const baseSymbol = rawSymbol.endsWith("USDT")
        ? rawSymbol.replace(/USDT$/, "")
        : rawSymbol;

      if (!baseSymbol) return;

      const binanceSymbol = `${baseSymbol}USDT`;

      try {
        const response = await fetch(`${BINANCE_BASE_URL}?symbol=${binanceSymbol}`, {
          next: { revalidate: 60 },
        });

        if (!response.ok) return;

        const data = await response.json();
        const usdtPrice = Number(data?.price || 0);
        if (usdtPrice > 0 && usdTryRate > 0) {
          result[baseSymbol] = {
            symbol: baseSymbol,
            binanceSymbol,
            usdtPrice,
            tryPrice: usdtPrice * usdTryRate,
          };
        }
      } catch {}
    })
  );

  return result;
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
    const [fiatTryRates, cryptoTryPrices] = await Promise.all([
      getFiatTryRates(fiatCurrencies),
      getCryptoTryPrices(cryptoSymbols, usdTryRate),
    ]);

    return Response.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      base: "TRY",
      usdTryRate,
      fiatTryRates,
      cryptoTryPrices,
      note: "Fiyatlar bilgilendirme amaçlıdır. Frankfurter günlük referans kur, Binance public ticker fiyatı kullanır.",
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

