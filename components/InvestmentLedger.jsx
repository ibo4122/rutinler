"use client";

import { useEffect, useMemo, useState } from "react";
import BesProjectionPanel from "./BesProjectionPanel";

const emptyTransaction = {
  type: "BUY",
  assetClass: "crypto",
  title: "",
  symbol: "",
  goldType: "GRAM",
  quantity: "",
  price: "",
  currency: "USD",
  date: "",
  note: "",
};

const assetClassOptions = [
  { value: "gold", label: "Altın" },
  { value: "crypto", label: "Kripto" },
  { value: "stocks", label: "Hisse" },
  { value: "forex", label: "Döviz" },
];

const typeOptions = [
  { value: "BUY", label: "Alış" },
  { value: "SELL", label: "Satış" },
];

const currencyOptions = ["TRY", "USD", "EUR", "GBP", "CHF", "JPY", "USDT"];

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

function normalizeText(value) {
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

function money(value, currency = "TRY") {
  const number = Number(value || 0);
  if (currency === "USDT") return `${formatDecimal(number, 4)} USDT`;
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(number);
  } catch {
    return `${formatDecimal(number, 2)} ${currency}`;
  }
}

function moneyTry(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function buildAssetKey(tx) {
  if (tx.assetClass === "gold") return `gold:${tx.goldType || "GRAM"}`;
  return `${tx.assetClass}:${normalizeText(tx.symbol || tx.title)}`;
}

function readableAssetName(position) {
  if (position.assetClass === "gold") {
    const found = goldTypeOptions.find((item) => item.value === position.goldType);
    return found?.label || position.title || "Altın";
  }
  return position.title || position.symbol || "Yatırım";
}

function getLivePrice(position, livePrices) {
  const prices = livePrices || {};
  if (position.assetClass === "gold") {
    const price = Number(prices.gold?.[position.goldType] || 0);
    return { price, currency: "TRY", source: price > 0 ? "Canlı Altın" : "" };
  }

  if (position.assetClass === "crypto") {
    const symbol = normalizeText(position.symbol || position.title);
    const price = Number(prices.crypto?.[symbol] || 0);
    return { price, currency: "USD", usdTryRate: Number(prices.usdTryRate || prices.usdTry || 0), source: price > 0 ? "Canlı Kripto" : "" };
  }

  if (position.assetClass === "forex") {
    const symbol = normalizeText(position.symbol || position.currency || position.title);
    const price = Number(prices.forex?.[symbol] || prices.forex?.[`${symbol}TRY`] || 0);
    return { price, currency: "TRY", source: price > 0 ? "Canlı Döviz" : "" };
  }

  if (position.assetClass === "stocks") {
    const symbol = normalizeText(position.symbol || position.title);
    const price = Number(prices.stocks?.[symbol] || 0);
    return { price, currency: position.currency || "TRY", source: price > 0 ? "Canlı Hisse" : "" };
  }

  return { price: 0, currency: position.currency || "TRY", source: "" };
}

function toTryValue(value, currency, usdTryRate) {
  if (currency === "TRY") return Number(value || 0);
  if ((currency === "USD" || currency === "USDT") && Number(usdTryRate || 0) > 0) return Number(value || 0) * Number(usdTryRate || 0);
  return Number(value || 0);
}

function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function calculatePortfolio(transactions, livePrices) {
  const positions = {};
  const sales = [];

  sortTransactions(transactions).forEach((tx) => {
    const key = buildAssetKey(tx);
    if (!positions[key]) {
      positions[key] = {
        key,
        assetClass: tx.assetClass,
        title: tx.title,
        symbol: normalizeText(tx.symbol || tx.title),
        goldType: tx.goldType || "GRAM",
        currency: tx.currency || "TRY",
        quantity: 0,
        totalCostOriginal: 0,
        totalCostTry: 0,
        realizedPnlTry: 0,
        realizedPnlOriginal: 0,
        buyCount: 0,
        sellCount: 0,
      };
    }

    const position = positions[key];
    const quantity = Number(tx.quantity || 0);
    const price = Number(tx.price || 0);
    const currency = tx.currency || position.currency || "TRY";
    const usdTryRate = Number(tx.usdTryRate || livePrices?.usdTryRate || livePrices?.usdTry || 0);
    const totalOriginal = quantity * price;
    const totalTry = toTryValue(totalOriginal, currency, usdTryRate);

    if (tx.type === "BUY") {
      position.quantity += quantity;
      position.totalCostOriginal += totalOriginal;
      position.totalCostTry += totalTry;
      position.currency = currency;
      position.buyCount += 1;
      return;
    }

    if (tx.type === "SELL") {
      const availableQuantity = position.quantity;
      const sellQuantity = Math.min(quantity, availableQuantity);
      const averageCostOriginal = availableQuantity > 0 ? position.totalCostOriginal / availableQuantity : 0;
      const averageCostTry = availableQuantity > 0 ? position.totalCostTry / availableQuantity : 0;
      const realizedOriginal = sellQuantity * (price - averageCostOriginal);
      const sellTry = toTryValue(sellQuantity * price, currency, usdTryRate);
      const realizedTry = sellTry - sellQuantity * averageCostTry;

      position.quantity -= sellQuantity;
      position.totalCostOriginal -= averageCostOriginal * sellQuantity;
      position.totalCostTry -= averageCostTry * sellQuantity;
      position.realizedPnlOriginal += realizedOriginal;
      position.realizedPnlTry += realizedTry;
      position.sellCount += 1;

      sales.unshift({
        ...tx,
        key,
        sellQuantity,
        averageCostOriginal,
        averageCostTry,
        realizedOriginal,
        realizedTry,
      });
    }
  });

  const positionList = Object.values(positions).filter((position) => position.quantity > 0.00000001);

  const enrichedPositions = positionList.map((position) => {
    const live = getLivePrice(position, livePrices);
    const currentPrice = live.price || 0;
    const currentCurrency = live.currency || position.currency || "TRY";
    const usdTryRate = Number(live.usdTryRate || livePrices?.usdTryRate || livePrices?.usdTry || 0);
    const currentOriginalValue = position.quantity * currentPrice;
    const currentTryValue = currentPrice > 0 ? toTryValue(currentOriginalValue, currentCurrency, usdTryRate) : 0;
    const averageCostOriginal = position.quantity > 0 ? position.totalCostOriginal / position.quantity : 0;
    const averageCostTry = position.quantity > 0 ? position.totalCostTry / position.quantity : 0;
    const unrealizedPnlTry = currentTryValue > 0 ? currentTryValue - position.totalCostTry : 0;
    const unrealizedRate = position.totalCostTry > 0 && currentTryValue > 0 ? (unrealizedPnlTry / position.totalCostTry) * 100 : 0;

    return {
      ...position,
      currentPrice,
      currentCurrency,
      currentTryValue,
      averageCostOriginal,
      averageCostTry,
      unrealizedPnlTry,
      unrealizedRate,
      liveSource: live.source,
    };
  });

  const realizedPnlTry = Object.values(positions).reduce((sum, position) => sum + position.realizedPnlTry, 0);
  const unrealizedPnlTry = enrichedPositions.reduce((sum, position) => sum + position.unrealizedPnlTry, 0);
  const totalCurrentValueTry = enrichedPositions.reduce((sum, position) => sum + position.currentTryValue, 0);
  const totalCostTry = enrichedPositions.reduce((sum, position) => sum + position.totalCostTry, 0);

  return {
    positions: enrichedPositions,
    sales,
    realizedPnlTry,
    unrealizedPnlTry,
    totalPnlTry: realizedPnlTry + unrealizedPnlTry,
    totalCurrentValueTry,
    totalCostTry,
  };
}

function sortPositions(positions, sortMode) {
  return [...positions].sort((a, b) => {
    if (sortMode === "bakiyeBuyuk") return b.currentTryValue - a.currentTryValue;
    if (sortMode === "bakiyeKucuk") return a.currentTryValue - b.currentTryValue;
    if (sortMode === "karBuyuk") return b.unrealizedPnlTry - a.unrealizedPnlTry;
    if (sortMode === "karKucuk") return a.unrealizedPnlTry - b.unrealizedPnlTry;
    if (sortMode === "isim") return readableAssetName(a).localeCompare(readableAssetName(b), "tr");
    return b.currentTryValue - a.currentTryValue;
  });
}

function migrateLegacyAssets(investments) {
  if (Array.isArray(investments?.transactions) && investments.transactions.length > 0) return investments.transactions;

  const legacyTransactions = [];
  ["gold", "crypto", "stocks", "forex"].forEach((assetClass) => {
    (investments?.[assetClass] || []).forEach((item) => {
      if (!item?.title || Number(item.quantity || 0) <= 0) return;
      legacyTransactions.push({
        id: `legacy-${assetClass}-${item.id || Date.now()}-${legacyTransactions.length}`,
        type: "BUY",
        assetClass,
        title: item.title,
        symbol: normalizeText(item.title),
        goldType: item.goldType || "GRAM",
        quantity: Number(item.quantity || 0),
        price: Number(item.buyPrice || item.currentPrice || 0),
        currency: item.currency || (assetClass === "crypto" ? "USD" : "TRY"),
        date: item.date || getToday(),
        note: item.note || "Eski kayıttan aktarıldı",
      });
    });
  });

  return legacyTransactions;
}

export default function InvestmentLedger({ investments, setInvestments, onTotalsChange }) {
  const [form, setForm] = useState({ ...emptyTransaction, date: getToday() });
  const [sortMode, setSortMode] = useState("bakiyeBuyuk");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [besTotal, setBesTotal] = useState(0);

  const transactions = useMemo(() => migrateLegacyAssets(investments), [investments]);
  const livePrices = investments?.livePrices || {};
  const portfolio = useMemo(() => calculatePortfolio(transactions, livePrices), [transactions, livePrices]);
  const sortedPositions = useMemo(() => sortPositions(portfolio.positions, sortMode), [portfolio.positions, sortMode]);

  useEffect(() => {
    if (!investments?.transactions && transactions.length > 0) {
      setInvestments((current) => ({ ...current, transactions }));
    }
  }, []);

  useEffect(() => {
    onTotalsChange?.({
      besTotal,
      totalInvestment: portfolio.totalCurrentValueTry + besTotal,
      availableInvestment: portfolio.totalCurrentValueTry,
      realizedPnl: portfolio.realizedPnlTry,
      unrealizedPnl: portfolio.unrealizedPnlTry,
      totalPnl: portfolio.totalPnlTry,
      totalCost: portfolio.totalCostTry,
    });
  }, [besTotal, portfolio.totalCurrentValueTry, portfolio.realizedPnlTry, portfolio.unrealizedPnlTry, portfolio.totalPnlTry, portfolio.totalCostTry, onTotalsChange]);

  const updateForm = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "assetClass") {
        next.currency = value === "crypto" ? "USD" : "TRY";
        next.goldType = value === "gold" ? "GRAM" : current.goldType;
      }
      if (field === "title") next.symbol = normalizeText(value);
      return next;
    });
  };

  const addTransaction = () => {
    const quantity = parseDecimal(form.quantity);
    const price = parseDecimal(form.price);
    const title = form.title.trim();

    if (!title) return alert("Varlık adı gir.");
    if (quantity <= 0) return alert("Geçerli miktar gir.");
    if (price <= 0) return alert("Geçerli işlem fiyatı gir.");

    const nextTransaction = {
      id: String(Date.now()),
      type: form.type,
      assetClass: form.assetClass,
      title,
      symbol: normalizeText(form.symbol || title),
      goldType: form.goldType || "GRAM",
      quantity,
      price,
      currency: form.currency || "TRY",
      date: form.date || getToday(),
      note: form.note.trim(),
      usdTryRate: Number(livePrices.usdTryRate || livePrices.usdTry || 0),
    };

    if (nextTransaction.type === "SELL") {
      const currentPortfolio = calculatePortfolio(transactions, livePrices);
      const key = buildAssetKey(nextTransaction);
      const currentPosition = currentPortfolio.positions.find((position) => position.key === key);
      if (!currentPosition || currentPosition.quantity + 0.00000001 < quantity) {
        return alert("Satış miktarı mevcut bakiyeden fazla olamaz.");
      }
    }

    setInvestments((current) => ({
      ...current,
      transactions: [nextTransaction, ...(current.transactions || transactions)],
    }));

    setForm({ ...emptyTransaction, date: getToday(), assetClass: form.assetClass, currency: form.assetClass === "crypto" ? "USD" : "TRY" });
  };

  const deleteTransaction = (id) => {
    setInvestments((current) => ({
      ...current,
      transactions: (current.transactions || transactions).filter((item) => item.id !== id),
    }));
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
        <button type="button" className="premiumButton" onClick={updateLivePrices} disabled={liveLoading}>
          {liveLoading ? "Güncelleniyor" : "Fiyat Güncelle"}
        </button>
      </div>

      <section className="summaryGrid investmentSummaryGrid">
        <SummaryCard tone="green" title="Toplam Yatırım" value={moneyTry(portfolio.totalCurrentValueTry + besTotal)} detail="BES dahil toplam yatırım" />
        <SummaryCard tone="purple" title="Blokajlı Yatırım" value={moneyTry(besTotal)} detail="BES Projeksiyon toplamı" />
        <SummaryCard tone="blue" title="Kullanılabilir" value={moneyTry(portfolio.totalCurrentValueTry)} detail="Satışlar düşülmüş güncel portföy" />
        <SummaryCard tone={portfolio.totalPnlTry >= 0 ? "green" : "red"} title="Toplam Kar / Zarar" value={moneyTry(portfolio.totalPnlTry)} detail={`Gerçekleşen: ${moneyTry(portfolio.realizedPnlTry)} • Açık: ${moneyTry(portfolio.unrealizedPnlTry)}`} />
      </section>

      <BesProjectionPanel onTotalChange={setBesTotal} />

      <Panel title="İşlem Ekle" subtitle="Alış ve satış işlemlerini gir. Parçalı alımlarda ortalama maliyet otomatik hesaplanır." totalLabel="İşlem Sayısı" total={transactions.length} open onToggle={() => {}}>
        <div className="formGrid six">
          <SelectBox label="İşlem Tipi" value={form.type} onChange={(value) => updateForm("type", value)} options={typeOptions} />
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

      <Panel title="Güncel Portföy" subtitle="Satışlar düşülmüş mevcut bakiye ve ortalama maliyet" totalLabel="Güncel Değer" total={moneyTry(portfolio.totalCurrentValueTry)} open onToggle={() => {}}>
        <div className="formGrid two">
          <SelectBox
            label="Sıralama"
            value={sortMode}
            onChange={setSortMode}
            options={[
              { value: "bakiyeBuyuk", label: "Toplam bakiyeye göre büyükten küçüğe" },
              { value: "bakiyeKucuk", label: "Toplam bakiyeye göre küçükten büyüğe" },
              { value: "karBuyuk", label: "Kâra göre büyükten küçüğe" },
              { value: "karKucuk", label: "Kâra göre küçükten büyüğe" },
              { value: "isim", label: "İsme göre A-Z" },
            ]}
          />
          <div className="emptyState" style={{ padding: "14px 16px", minHeight: "58px", textAlign: "left" }}>
            <strong style={{ fontSize: "13px" }}>Ortalama Maliyet</strong>
            <span style={{ fontSize: "12px", marginTop: "4px" }}>Parçalı alışlar ağırlıklı ortalama maliyetle birleşir.</span>
          </div>
        </div>

        {sortedPositions.length === 0 ? <EmptyState text="Henüz açık yatırım bakiyesi bulunmuyor." /> : (
          <div className="recordList">
            {sortedPositions.map((position) => {
              const isProfit = position.unrealizedPnlTry >= 0;
              return (
                <div key={position.key} className="simpleRecord investmentRecord" style={{ borderColor: isProfit ? "rgba(34,197,94,.55)" : "rgba(248,113,113,.55)", background: isProfit ? "rgba(34,197,94,.10)" : "rgba(248,113,113,.10)" }}>
                  <div className="simpleRecordTop">
                    <div>
                      <h4>{readableAssetName(position)}</h4>
                      <p>Miktar: {formatDecimal(position.quantity)} • Ortalama maliyet: {money(position.averageCostOriginal, position.currency)}</p>
                      <p>Toplam maliyet: {moneyTry(position.totalCostTry)} • Güncel değer: {position.currentTryValue > 0 ? moneyTry(position.currentTryValue) : "Canlı fiyat bekleniyor"}</p>
                      <p>Canlı fiyat: {position.currentPrice > 0 ? money(position.currentPrice, position.currentCurrency) : "Bulunamadı"}{position.liveSource ? ` • ${position.liveSource}` : ""}</p>
                    </div>
                    <div className="simpleRecordRight">
                      <strong className={isProfit ? "profitText" : "lossText"}>{moneyTry(position.unrealizedPnlTry)} / %{position.unrealizedRate.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Geçmiş Satışlar" subtitle="Satılan varlıklar güncel bakiyeye dahil edilmez, gerçekleşen kâr/zarara eklenir." totalLabel="Gerçekleşen K/Z" total={moneyTry(portfolio.realizedPnlTry)} open={false} onToggle={() => {}}>
        {portfolio.sales.length === 0 ? <EmptyState text="Henüz satış kaydı bulunmuyor." /> : (
          <div className="recordList">
            {portfolio.sales.map((sale) => (
              <div key={sale.id} className="simpleRecord">
                <div className="simpleRecordTop">
                  <div>
                    <h4>{sale.title}</h4>
                    <p>Satış miktarı: {formatDecimal(sale.sellQuantity)} • Satış fiyatı: {money(sale.price, sale.currency)}</p>
                    <p>Ortalama maliyet: {money(sale.averageCostOriginal, sale.currency)} • Tarih: {sale.date}</p>
                    {sale.note ? <p>{sale.note}</p> : null}
                  </div>
                  <div className="simpleRecordRight">
                    <strong className={sale.realizedTry >= 0 ? "profitText" : "lossText"}>{moneyTry(sale.realizedTry)}</strong>
                    <button type="button" className="deleteButton" onClick={() => deleteTransaction(sale.id)}>Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="İşlem Geçmişi" subtitle="Tüm alış ve satış kayıtları" totalLabel="Toplam İşlem" total={transactions.length} open={false} onToggle={() => {}}>
        <div className="recordList">
          {transactions.map((tx) => (
            <div key={tx.id} className="simpleRecord">
              <div className="simpleRecordTop">
                <div>
                  <h4>{tx.type === "BUY" ? "Alış" : "Satış"} • {tx.title}</h4>
                  <p>Miktar: {formatDecimal(tx.quantity)} • Fiyat: {money(tx.price, tx.currency)} • Tarih: {tx.date}</p>
                  {tx.note ? <p>{tx.note}</p> : null}
                </div>
                <div className="simpleRecordRight">
                  <strong>{money(Number(tx.quantity || 0) * Number(tx.price || 0), tx.currency)}</strong>
                  <button type="button" className="deleteButton" onClick={() => deleteTransaction(tx.id)}>Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  return <article className={`summaryCard ${tone}`}><div className="summaryLabel">{title}</div><div className={`summaryValue summaryValue-${tone}`}>{value}</div><div className="summaryDetail">{detail}</div></article>;
}

function Panel({ title, subtitle, totalLabel, total, open, onToggle, children }) {
  return <section className="panelCard"><button type="button" className="panelHeader" onClick={onToggle}><div><h2 className="gradientTitle">{title}</h2><p>{subtitle}</p></div><div className="panelRight"><div className="panelTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="toggleButton">{open ? "−" : "+"}</div></div></button>{open ? <div className="panelBody">{children}</div> : null}</section>;
}

function MiniPanel({ title, totalLabel, total, color, open, onToggle, children }) {
  return <section className={`miniPanel ${color}`}><button type="button" className="miniHeader" onClick={onToggle}><div><h3 className={`miniTitle miniTitle-${color}`}>{title}</h3></div><div className="miniRight"><div className="miniTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="miniToggle">{open ? "−" : "+"}</div></div></button>{open ? <div className="miniBody">{children}</div> : null}</section>;
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return <label className="inputBox"><span>{label}</span><input type={type} value={value} placeholder={placeholder} inputMode={type === "date" ? undefined : "text"} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectBox({ label, value, onChange, options }) {
  return <label className="inputBox"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

