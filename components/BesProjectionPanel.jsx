"use client";

import { useMemo, useState } from "react";

const defaultYearlyInputs = [
  { year: 2025, monthlyContribution: "5000", fundReturn: "30", stateReturn: "20" },
  { year: 2026, monthlyContribution: "6500", fundReturn: "30", stateReturn: "20" },
  { year: 2027, monthlyContribution: "10000", fundReturn: "30", stateReturn: "20" },
  { year: 2028, monthlyContribution: "15000", fundReturn: "30", stateReturn: "20" },
  { year: 2029, monthlyContribution: "20000", fundReturn: "30", stateReturn: "20" },
  { year: 2030, monthlyContribution: "25000", fundReturn: "30", stateReturn: "20" },
];

function numberValue(value) {
  return Number(String(value || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}
function percentValue(value) { return numberValue(value) / 100; }
function money(value) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function parseProgress(progressText, fallbackTotalMonth) {
  const clean = String(progressText || "").replace(/\s/g, "");
  if (!clean.includes("/")) return { currentMonth: 0, progressTotalMonth: fallbackTotalMonth };
  const [current, total] = clean.split("/");
  return { currentMonth: Number(current || 0), progressTotalMonth: Number(total || fallbackTotalMonth) };
}

export default function BesProjectionPanel() {
  const [progressText, setProgressText] = useState("15/72");
  const [startDate, setStartDate] = useState("2025-01-07");
  const [totalMonths, setTotalMonths] = useState("72");
  const [criticalMonth, setCriticalMonth] = useState("60");
  const [stateContributionRate, setStateContributionRate] = useState("30");
  const [vestingRate, setVestingRate] = useState("35");
  const [yearlyInputs, setYearlyInputs] = useState(defaultYearlyInputs);

  const projection = useMemo(() => {
    const modelTotalMonths = numberValue(totalMonths);
    const critical = numberValue(criticalMonth);
    const stateRate = percentValue(stateContributionRate);
    const vestRate = percentValue(vestingRate);
    const { currentMonth } = parseProgress(progressText, modelTotalMonths);
    let principalPaid = 0, fundOpening = 0, cumulativeFundReturn = 0, stateFundOpening = 0, cumulativeStateFundReturn = 0;
    const start = new Date(startDate || "2025-01-07");
    const rows = [];

    for (let month = 1; month <= modelTotalMonths; month += 1) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + month - 1);
      const year = date.getFullYear();
      const yearInput = yearlyInputs.find((item) => Number(item.year) === year) || yearlyInputs[yearlyInputs.length - 1];
      const monthlyContribution = numberValue(yearInput?.monthlyContribution);
      const monthlyFundRate = Math.pow(1 + percentValue(yearInput?.fundReturn), 1 / 12) - 1;
      const monthlyStateRate = Math.pow(1 + percentValue(yearInput?.stateReturn), 1 / 12) - 1;
      principalPaid += monthlyContribution;
      const monthlyFundReturn = (fundOpening + monthlyContribution) * monthlyFundRate;
      cumulativeFundReturn += monthlyFundReturn;
      const fundClosing = fundOpening + monthlyContribution + monthlyFundReturn;
      const monthlyStateContribution = monthlyContribution * stateRate;
      const monthlyStateFundReturn = (stateFundOpening + monthlyStateContribution) * monthlyStateRate;
      cumulativeStateFundReturn += monthlyStateFundReturn;
      const stateFundClosing = stateFundOpening + monthlyStateContribution + monthlyStateFundReturn;
      const earnedStateAmount = month >= critical ? stateFundClosing * vestRate : 0;
      const estimatedTotalReturn = cumulativeFundReturn + earnedStateAmount;
      const totalPortfolioValue = principalPaid + estimatedTotalReturn;
      rows.push({ month, period: `${month}/${modelTotalMonths}`, remainingMonth: Math.max(modelTotalMonths - month, 0), monthlyContribution, principalPaid, monthlyFundReturn, cumulativeFundReturn, fundClosing, monthlyStateContribution, monthlyStateFundReturn, earnedStateAmount, estimatedTotalReturn, totalPortfolioValue });
      fundOpening = fundClosing; stateFundOpening = stateFundClosing;
    }

    return { rows, currentMonth, remainingMonth: Math.max(modelTotalMonths - currentMonth, 0), criticalRow: rows[critical - 1], exitRow: rows[modelTotalMonths - 1] };
  }, [progressText, startDate, totalMonths, criticalMonth, stateContributionRate, vestingRate, yearlyInputs]);

  const updateYearInput = (index, field, value) => {
    setYearlyInputs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  return (
    <section className="panelCard besProjectionPanel">
      <button type="button" className="panelHeader">
        <div><h2 className="gradientTitle">BES Projeksiyon</h2><p>7 Ocak 2025 başlangıçlı, Aralık 2029 kritik eşik ve Aralık 2030 çıkış senaryosu.</p></div>
        <div className="panelRight"><div className="panelTotal"><span>Çıkış Portföyü</span><strong>{money(projection.exitRow?.totalPortfolioValue)}</strong></div></div>
      </button>
      <div className="panelBody">
        <section className="summaryGrid investmentSummaryGrid">
          <article className="summaryCard blue"><div className="summaryLabel">Güncel İlerleme</div><div className="summaryValue summaryValue-blue">{projection.currentMonth}. Ay</div><div className="summaryDetail">Kalan ay: {projection.remainingMonth}</div></article>
          <article className="summaryCard purple"><div className="summaryLabel">5. Yıl Sonu</div><div className="summaryValue summaryValue-purple">{money(projection.criticalRow?.totalPortfolioValue)}</div><div className="summaryDetail">Aralık 2029 kritik eşik</div></article>
          <article className="summaryCard green"><div className="summaryLabel">6. Yıl Sonu</div><div className="summaryValue summaryValue-green">{money(projection.exitRow?.totalPortfolioValue)}</div><div className="summaryDetail">Aralık 2030 çıkış senaryosu</div></article>
          <article className="summaryCard red"><div className="summaryLabel">Hak Edilen Devlet</div><div className="summaryValue summaryValue-red">{money(projection.exitRow?.earnedStateAmount)}</div><div className="summaryDetail">%{vestingRate} hak ediş varsayımı</div></article>
        </section>
        <section className="miniPanel purple"><div className="miniHeader"><h3 className="miniTitle miniTitle-purple">Dinamik Girdiler</h3></div><div className="miniBody"><div className="formGrid six besGrid"><label className="inputBox"><span>Güncel İlerleme</span><input value={progressText} onChange={(e) => setProgressText(e.target.value)}/></label><label className="inputBox"><span>Başlangıç Tarihi</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/></label><label className="inputBox"><span>Toplam Ay</span><input value={totalMonths} onChange={(e) => setTotalMonths(e.target.value)}/></label><label className="inputBox"><span>Kritik Eşik Ayı</span><input value={criticalMonth} onChange={(e) => setCriticalMonth(e.target.value)}/></label><label className="inputBox"><span>Devlet Katkısı %</span><input value={stateContributionRate} onChange={(e) => setStateContributionRate(e.target.value)}/></label><label className="inputBox"><span>Hak Ediş %</span><input value={vestingRate} onChange={(e) => setVestingRate(e.target.value)}/></label></div></div></section>
        <section className="miniPanel mint"><div className="miniHeader"><h3 className="miniTitle miniTitle-mint">Yıllık Katkı ve Getiri Varsayımları</h3></div><div className="besYearTable"><div className="besYearHeader"><span>Yıl</span><span>Aylık Katkı</span><span>Ana Fon Yıllık Getiri %</span><span>Devlet Fon Yıllık Getiri %</span></div>{yearlyInputs.map((item, index) => <div className="besYearRow" key={item.year}><strong>{item.year}</strong><input value={item.monthlyContribution} onChange={(e) => updateYearInput(index, "monthlyContribution", e.target.value)}/><input value={item.fundReturn} onChange={(e) => updateYearInput(index, "fundReturn", e.target.value)}/><input value={item.stateReturn} onChange={(e) => updateYearInput(index, "stateReturn", e.target.value)}/></div>)}</div></section>
        <section className="miniPanel orange"><div className="miniHeader"><h3 className="miniTitle miniTitle-orange">Ay Bazlı Projeksiyon</h3></div><div className="besProjectionTableWrap"><table className="besProjectionTable"><thead><tr><th>Dönem</th><th>Kalan Ay</th><th>Aylık Katkı</th><th>Mevcut Yatırım</th><th>Aylık Fon Getirisi</th><th>Kümülatif Fon Getirisi</th><th>Ana Fon Değeri</th><th>Devlet Katkısı</th><th>Devlet Fon Getirisi</th><th>Hak Edilen Devlet</th><th>Total Getiri</th><th>Portföy</th></tr></thead><tbody>{projection.rows.map((row) => <tr key={row.month} className={row.month === Number(criticalMonth) ? "criticalBesRow" : row.month === projection.currentMonth ? "currentBesRow" : ""}><td>{row.period}</td><td>{row.remainingMonth}</td><td>{money(row.monthlyContribution)}</td><td>{money(row.principalPaid)}</td><td>{money(row.monthlyFundReturn)}</td><td>{money(row.cumulativeFundReturn)}</td><td>{money(row.fundClosing)}</td><td>{money(row.monthlyStateContribution)}</td><td>{money(row.monthlyStateFundReturn)}</td><td>{money(row.earnedStateAmount)}</td><td>{money(row.estimatedTotalReturn)}</td><td>{money(row.totalPortfolioValue)}</td></tr>)}</tbody></table></div></section>
      </div>
    </section>
  );
}
