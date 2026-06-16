
"use client";

import { useMemo, useState } from "react";

const emptyForm = {
  type: "BUY",
  assetClass: "crypto",
  title: "",
  symbol: "",
  goldType: "GRAM",
  quantity: "",
  price: "",
  currency: "USD",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

const assetClassOptions = [
  { value: "gold", label: "Altın" },
  { value: "crypto", label: "Kripto" },
  { value: "stocks", label: "Hisse" },
  { value: "forex", label: "Döviz" },
];

const goldTypeOptions = [
  { value: "GRAM", label: "Gram Altın" },
  { value: "CEYREK", label: "Çeyrek Altın" },
  { value: "YARIM", label: "Yarım Altın" },
  { value: "TAM", label: "Tam Altın" },
  { value: "CUMHURIYET", label: "Cumhuriyet Altını" },
  { value: "ATA", label: "Ata Altın" },
  { value: "RESAT", label: "Reşat Altın" },
  { value: "GREMSE", label: "Gremse Altın" },
  { value: "ONS", label: "Ons Altın" },
];

const currencyOptions = ["TRY", "USD", "EUR", "GBP", "CHF", "JPY", "USDT"];

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
    .replace(/[^A-Z0-9]/g, "");
}

function parseDecimal(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  return Number(normalized) || 0;
}

function formatDecimal(value, digits = 6) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits }).format(Number(value || 0));
}

function moneyTry(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function money(value, currency = "TRY") {
  const number = Number(value || 0);
  if (currency === "USDT") return `${formatDecimal(number, 4)} USDT`;
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(number);
  } catch {
    return `${formatDecimal(number, 2)} ${currency}`;
  }
}

function toTry(value, currency, usdTryRate) {
  if (currency === "TRY") return Number(value || 0);
  if ((currency === "USD" || currency === "USDT") && Number(usdTryRate || 0) > 0) return Number(value || 0) * Number(usdTryRate || 0);
  return Number(value || 0);
}

function assetKey(tx) {
  if (tx.assetClass === "gold") return `gold:${tx.goldType || "GRAM"}`;
  return `${tx.assetClass}:${normalizeSymbol(tx.symbol || tx.title)}`;
}

function assetName(position) {
  if (position.assetClass === "gold") {
    return goldTypeOptions.find((item) => item.value === position.goldType)?.label || position.title || "Altın";
  }
  return position.title || position.symbol || "Yatırım";
}

function migrateLegacy(investments) {
  if (Array.isArray(investments?.transactions) && investments.transactions.length > 0) return investments.transactions;

  const legacy = [];
  ["gold", "crypto", "stocks", "forex"].forEach((assetClass) => {
    (investments?.[assetClass] || []).forEach((item) => {
      const quantity = Number(item.quantity || 0);
      if (!item.title || quantity <= 0) return;
      legacy.push({
        id: `legacy-${assetClass}-${item.id || Date.now()}-${legacy.length}`,
        type: "BUY",
        assetClass,
        title: item.title,
        symbol: normalizeSymbol(item.title),
        goldType: item.goldType || "GRAM",
        quantity,
        price: Number(item.buyPrice || item.currentPrice || 0),
        currency: item.currency || (assetClass === "crypto" ? "USD" : "TRY"),
        date: item.date || new Date().toISOString().slice(0, 10),
        note: item.note || "Eski kayıttan aktarıldı",
      });
    });
  });

  return legacy;
}

function livePriceFor(position, livePrices) {
  const prices = livePrices || {};
  if (position.assetClass === "gold") {
    const price = Number(prices.gold?.[position.goldType] || prices.gold?.GRAM || 0);
    return { price, currency: "TRY", usdTryRate: Number(prices.usdTryRate || prices.usdTry || 0), source: price > 0 ? "Canlı Altın" : "" };
  }

  if (position.assetClass === "crypto") {
    const symbol = normalizeSymbol(position.symbol || position.title);
    const price = Number(prices.crypto?.[symbol] || 0);
    return { price, currency: "USD", usdTryRate: Number(prices.usdTryRate || prices.usdTry || 0), source: price > 0 ? "Canlı Kripto" : "" };
  }

  if (position.assetClass === "forex") {
    const symbol = normalizeSymbol(position.symbol || position.currency || position.title);
    const price = Number(prices.forex?.[symbol] || prices.forex?.[`${symbol}TRY`] || 0);
    return { price, currency: "TRY", usdTryRate: Number(prices.usdTryRate || prices.usdTry || 0), source: price > 0 ? "Canlı Döviz" : "" };
  }

  return { price: 0, currency: position.currency || "TRY", usdTryRate: Number(prices.usdTryRate || prices.usdTry || 0), source: "" };
}

function calculatePortfolio(transactions, livePrices) {
  const positionsMap = {};
  const sales = [];

  [...transactions]
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .forEach((tx) => {
      const key = assetKey(tx);
      if (!positionsMap[key]) {
        positionsMap[key] = {
          key,
          assetClass: tx.assetClass,
          title: tx.title,
          symbol: normalizeSymbol(tx.symbol || tx.title),
          goldType: tx.goldType || "GRAM",
          currency: tx.currency || "TRY",
          quantity: 0,
          costOriginal: 0,
          costTry: 0,
          realizedTry: 0,
        };
      }

      const position = positionsMap[key];
      const quantity = Number(tx.quantity || 0);
      const price = Number(tx.price || 0);
      const currency = tx.currency || position.currency || "TRY";
      const usdTryRate = Number(tx.usdTryRate || livePrices?.usdTryRate || livePrices?.usdTry || 0);
      const originalTotal = quantity * price;
      const tryTotal = toTry(originalTotal, currency, usdTryRate);

      if (tx.type === "BUY") {
        position.quantity += quantity;
        position.costOriginal += originalTotal;
        position.costTry += tryTotal;
        position.currency = currency;
        return;
      }

      if (tx.type === "SELL") {
        const sellQuantity = Math.min(quantity, position.quantity);
        const avgOriginal = position.quantity > 0 ? position.costOriginal / position.quantity : 0;
        const avgTry = position.quantity > 0 ? position.costTry / position.quantity : 0;
        const sellTry = toTry(sellQuantity * price, currency, usdTryRate);
        const realizedTry = sellTry - sellQuantity * avgTry;

        position.quantity -= sellQuantity;
        position.costOriginal -= avgOriginal * sellQuantity;
        position.costTry -= avgTry * sellQuantity;
        position.realizedTry += realizedTry;

        sales.unshift({ ...tx, sellQuantity, avgOriginal, avgTry, realizedTry });
      }
    });

  const positions = Object.values(positionsMap)
    .filter((position) => position.quantity > 0.00000001)
    .map((position) => {
      const live = livePriceFor(position, livePrices);
      const currentOriginalValue = position.quantity * live.price;
      const currentTryValue = live.price > 0 ? toTry(currentOriginalValue, live.currency, live.usdTryRate) : 0;
      const avgOriginal = position.quantity > 0 ? position.costOriginal / position.quantity : 0;
      const avgTry = position.quantity > 0 ? position.costTry / position.quantity : 0;
      const unrealizedTry = currentTryValue > 0 ? currentTryValue - position.costTry : 0;
      const unrealizedRate = position.costTry > 0 && currentTryValue > 0 ? (unrealizedTry / position.costTry) * 100 : 0;

      return { ...position, avgOriginal, avgTry, currentPrice: live.price, currentCurrency: live.currency, currentTryValue, unrealizedTry, unrealizedRate, liveSource: live.source };
    });

  const realizedTry = Object.values(positionsMap).reduce((sum, item) => sum + item.realizedTry, 0);
  const unrealizedTry = positions.reduce((sum, item) => sum + item.unrealizedTry, 0);
  const currentValueTry = positions.reduce((sum, item) => sum + item.currentTryValue, 0);
  const costTry = positions.reduce((sum, item) => sum + item.costTry, 0);

  return { positions, sales, realizedTry, unrealizedTry, totalPnlTry: realizedTry + unrealizedTry, currentValueTry, costTry };
}

function sortPositions(positions, sortMode) {
  return [...positions].sort((a, b) => {
    if (sortMode === "bakiyeBuyuk") return b.currentTryValue - a.currentTryValue;
    if (sortMode === "bakiyeKucuk") return a.currentTryValue - b.currentTryValue;
    if (sortMode === "karBuyuk") return b.unrealizedTry - a.unrealizedTry;
    if (sortMode === "karKucuk") return a.unrealizedTry - b.unrealizedTry;
    if (sortMode === "isim") return assetName(a).localeCompare(assetName(b), "tr");
    return b.currentTryValue - a.currentTryValue;
  });
}

export default function InvestmentLedger({ investments = {}, setInvestments }) {
  const [form, setForm] = useState(emptyForm);
  const [sortMode, setSortMode] = useState("bakiyeBuyuk");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const transactions = useMemo(() => migrateLegacy(investments), [investments]);
  const livePrices = investments?.livePrices || {};
  const portfolio = useMemo(() => calculatePortfolio(transactions, livePrices), [transactions, livePrices]);
  const sortedPositions = useMemo(() => sortPositions(portfolio.positions, sortMode), [portfolio.positions, sortMode]);

  const updateForm = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "assetClass") {
        next.currency = value === "crypto" ? "USD" : "TRY";
        next.goldType = value === "gold" ? "GRAM" : current.goldType;
      }
      if (field === "title") next.symbol = normalizeSymbol(value);
      return next;
    });
  };

  const addTransaction = () => {
    const title = form.title.trim();
    const quantity = parseDecimal(form.quantity);
    const price = parseDecimal(form.price);

    if (!title) return alert("Varlık adı gir.");
    if (quantity <= 0) return alert("Geçerli miktar gir.");
    if (price <= 0) return alert("Geçerli işlem fiyatı gir.");

    const tx = {
      id: String(Date.now()),
      type: form.type,
      assetClass: form.assetClass,
      title,
      symbol: normalizeSymbol(form.symbol || title),
      goldType: form.goldType || "GRAM",
      quantity,
      price,
      currency: form.currency || "TRY",
      date: form.date || new Date().toISOString().slice(0, 10),
      note: form.note.trim(),
      usdTryRate: Number(livePrices.usdTryRate || livePrices.usdTry || 0),
    };

    if (tx.type === "SELL") {
      const currentPortfolio = calculatePortfolio(transactions, livePrices);
      const currentPosition = currentPortfolio.positions.find((position) => position.key === assetKey(tx));
      if (!currentPosition || currentPosition.quantity + 0.00000001 < quantity) return alert("Satış miktarı mevcut bakiyeden fazla olamaz.");
    }

    setInvestments((current) => ({ ...current, transactions: [tx, ...((current.transactions && current.transactions.length > 0) ? current.transactions : transactions)] }));
    setForm({ ...emptyForm, assetClass: form.assetClass, currency: form.assetClass === "crypto" ? "USD" : "TRY", date: new Date().toISOString().slice(0, 10) });
  };

  const deleteTransaction = (id) => {
    setInvestments((current) => ({ ...current, transactions: ((current.transactions && current.transactions.length > 0) ? current.transactions : transactions).filter((item) => item.id !== id) }));
  };

  const updateLivePrices = async () => {
    if (liveLoading) return;
    setLiveLoading(true);
    setLiveMessage("");

    try {
      const response = await fetch("/api/market-prices", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.prices) {
        setLiveMessage("Fiyat verisi alınamadı");
        return;
      }
      setInvestments((current) => ({ ...current, livePrices: payload.prices }));
      setLiveMessage("Fiyatlar güncellendi");
    } catch (error) {
      console.log(error);
      setLiveMessage("Fiyat verisi alınamadı");
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        {liveMessage ? <span className="sectionDescription">{liveMessage}</span> : null}
        <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={liveLoading}>{liveLoading ? "Güncelleniyor" : "Fiyat Güncelle"}</button>
      </div>

      <section className="summaryGrid investmentSummaryGrid">
        <SummaryCard tone="green" title="Güncel Portföy" value={moneyTry(portfolio.currentValueTry)} detail="Satışlar düşülmüş mevcut bakiye" />
        <SummaryCard tone="blue" title="Açık Pozisyon K/Z" value={moneyTry(portfolio.unrealizedTry)} detail="Canlı fiyata göre gerçekleşmemiş kâr/zarar" />
        <SummaryCard tone="purple" title="Gerçekleşen K/Z" value={moneyTry(portfolio.realizedTry)} detail="Satışlardan gelen kesin kâr/zarar" />
        <SummaryCard tone={portfolio.totalPnlTry >= 0 ? "green" : "red"} title="Toplam Kar / Zarar" value={moneyTry(portfolio.totalPnlTry)} detail="Gerçekleşen + açık pozisyon" />
      </section>

      <Panel title="İşlem Ekle" subtitle="Alış ve satış gir. Parçalı alımlar otomatik ortalama maliyet oluşturur." totalLabel="İşlem" total={transactions.length} open>
        <div className="formGrid six">
          <SelectBox label="İşlem Tipi" value={form.type} onChange={(value) => updateForm("type", value)} options={[{ value: "BUY", label: "Alış" }, { value: "SELL", label: "Satış" }]} />
          <SelectBox label="Varlık Türü" value={form.assetClass} onChange={(value) => updateForm("assetClass", value)} options={assetClassOptions} />
          <InputBox label="Varlık Adı" value={form.title} placeholder="Örn: SOL / Gram Altın" onChange={(value) => updateForm("title", value)} />
          <InputBox label="Canlı Sembol" value={form.symbol} placeholder="Örn: SOL / GRAM" onChange={(value) => updateForm("symbol", value)} />
          {form.assetClass === "gold" ? <SelectBox label="Altın Türü" value={form.goldType} onChange={(value) => updateForm("goldType", value)} options={goldTypeOptions} /> : null}
          <InputBox label="Miktar" value={form.quantity} placeholder="Örn: 4 veya 0,63" onChange={(value) => updateForm("quantity", value)} />
          <InputBox label="İşlem Fiyatı" value={form.price} placeholder="Birim fiyat" onChange={(value) => updateForm("price", value)} />
          <SelectBox label="Para Birimi" value={form.currency} onChange={(value) => updateForm("currency", value)} options={currencyOptions} />
          <InputBox label="Tarih" type="date" value={form.date} onChange={(value) => updateForm("date", value)} />
          <InputBox label="Not" value={form.note} placeholder="Opsiyonel" onChange={(value) => updateForm("note", value)} />
          <button type="button" className="premiumButton wide" onClick={addTransaction}>{form.type === "BUY" ? "Alış Ekle" : "Satış Ekle"}</button>
        </div>
      </Panel>

      <Panel title="Güncel Portföy" subtitle="Satışlar düşülmüş mevcut bakiye ve ortalama maliyet" totalLabel="Güncel Değer" total={moneyTry(portfolio.currentValueTry)} open>
        <div className="formGrid two">
          <SelectBox label="Sıralama" value={sortMode} onChange={setSortMode} options={[{ value: "bakiyeBuyuk", label: "Toplam bakiyeye göre büyükten küçüğe" }, { value: "bakiyeKucuk", label: "Toplam bakiyeye göre küçükten büyüğe" }, { value: "karBuyuk", label: "Kâra göre büyükten küçüğe" }, { value: "karKucuk", label: "Kâra göre küçükten büyüğe" }, { value: "isim", label: "İsme göre A-Z" }]} />
          <div className="emptyState" style={{ padding: "14px 16px", minHeight: "58px", textAlign: "left" }}><strong style={{ fontSize: "13px" }}>Ortalama Maliyet</strong><span style={{ fontSize: "12px", marginTop: "4px" }}>Ağırlıklı ortalama maliyet uygulanır.</span></div>
        </div>

        {sortedPositions.length === 0 ? <EmptyState text="Henüz açık yatırım bakiyesi bulunmuyor." /> : (
          <div className="recordList">
            {sortedPositions.map((position) => {
              const isProfit = position.unrealizedTry >= 0;
              return (
                <div key={position.key} className="simpleRecord investmentRecord" style={{ borderColor: isProfit ? "rgba(34,197,94,.55)" : "rgba(248,113,113,.55)", background: isProfit ? "rgba(34,197,94,.10)" : "rgba(248,113,113,.10)" }}>
                  <div className="simpleRecordTop">
                    <div>
                      <h4>{assetName(position)}</h4>
                      <p>Miktar: {formatDecimal(position.quantity)} • Ortalama maliyet: {money(position.avgOriginal, position.currency)}</p>
                      <p>Toplam maliyet: {moneyTry(position.costTry)} • Güncel değer: {position.currentTryValue > 0 ? moneyTry(position.currentTryValue) : "Canlı fiyat bekleniyor"}</p>
                      <p>Canlı fiyat: {position.currentPrice > 0 ? money(position.currentPrice, position.currentCurrency) : "Bulunamadı"}{position.liveSource ? ` • ${position.liveSource}` : ""}</p>
                    </div>
                    <div className="simpleRecordRight"><strong className={isProfit ? "profitText" : "lossText"}>{moneyTry(position.unrealizedTry)} / %{position.unrealizedRate.toFixed(2)}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Geçmiş Satışlar" subtitle="Satılan varlıklar güncel bakiyeye dahil edilmez." totalLabel="Gerçekleşen K/Z" total={moneyTry(portfolio.realizedTry)} open>
        {portfolio.sales.length === 0 ? <EmptyState text="Henüz satış kaydı bulunmuyor." /> : (
          <div className="recordList">
            {portfolio.sales.map((sale) => (
              <div key={sale.id} className="simpleRecord">
                <div className="simpleRecordTop">
                  <div><h4>{sale.title}</h4><p>Satış miktarı: {formatDecimal(sale.sellQuantity)} • Satış fiyatı: {money(sale.price, sale.currency)}</p><p>Ortalama maliyet: {money(sale.avgOriginal, sale.currency)} • Tarih: {sale.date}</p>{sale.note ? <p>{sale.note}</p> : null}</div>
                  <div className="simpleRecordRight"><strong className={sale.realizedTry >= 0 ? "profitText" : "lossText"}>{moneyTry(sale.realizedTry)}</strong><button type="button" className="deleteButton" onClick={() => deleteTransaction(sale.id)}>Sil</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="İşlem Geçmişi" subtitle="Tüm alış ve satış kayıtları" totalLabel="Toplam İşlem" total={transactions.length} open={false}>
        <div className="recordList">
          {transactions.map((tx) => (
            <div key={tx.id} className="simpleRecord"><div className="simpleRecordTop"><div><h4>{tx.type === "BUY" ? "Alış" : "Satış"} • {tx.title}</h4><p>Miktar: {formatDecimal(tx.quantity)} • Fiyat: {money(tx.price, tx.currency)} • Tarih: {tx.date}</p>{tx.note ? <p>{tx.note}</p> : null}</div><div className="simpleRecordRight"><strong>{money(Number(tx.quantity || 0) * Number(tx.price || 0), tx.currency)}</strong><button type="button" className="deleteButton" onClick={() => deleteTransaction(tx.id)}>Sil</button></div></div></div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  return <article className={`summaryCard ${tone}`}><div className="summaryLabel">{title}</div><div className={`summaryValue summaryValue-${tone}`}>{value}</div><div className="summaryDetail">{detail}</div></article>;
}

function Panel({ title, subtitle, totalLabel, total, open, children }) {
  const [innerOpen, setInnerOpen] = useState(Boolean(open));
  return <section className="panelCard"><button type="button" className="panelHeader" onClick={() => setInnerOpen((value) => !value)}><div><h2 className="gradientTitle">{title}</h2><p>{subtitle}</p></div><div className="panelRight"><div className="panelTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="toggleButton">{innerOpen ? "−" : "+"}</div></div></button>{innerOpen ? <div className="panelBody">{children}</div> : null}</section>;
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return <label className="inputBox"><span>{label}</span><input type={type} value={value} placeholder={placeholder} inputMode={type === "date" ? undefined : "text"} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectBox({ label, value, onChange, options }) {
  return <label className="inputBox"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function EmptyState({ text }) {
  return <div className="emptyState"><strong>{text}</strong><span>Yeni kayıt eklediğinde burada görüntülenecek.</span></div>;
}

