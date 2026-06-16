"use client";

import { useEffect, useMemo, useState } from "react";

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

function percentValue(value) {
  return numberValue(value) / 100;
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function addMonths(dateText, monthCount) {
  const date = new Date(dateText || "2025-01-07");
  date.setMonth(date.getMonth() + monthCount);
  return date;
}

function PanelBlock({ title, subtitle, open, onToggle, color = "purple", children }) {
  return (
    <section className={`miniPanel ${color}`}>
      <button type="button" className="miniHeader" onClick={onToggle}>
        <div>
          <h3 className={`miniTitle miniTitle-${color}`}>{title}</h3>
          {subtitle ? <p className="sectionDescription">{subtitle}</p> : null}
        </div>
        <div className="miniRight"><div className="miniToggle">{open ? "âˆ’" : "+"}</div></div>
      </button>
      {open ? <div className="miniBody">{children}</div> : null}
    </section>
  );
}

export default function BesProjectionPanel({ onTotalChange }) {
  const [mainOpen, setMainOpen] = useState(false);
  const [inputsOpen, setInputsOpen] = useState(false);
  const [yearlyOpen, setYearlyOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const [currentMonthInput, setCurrentMonthInput] = useState("15");
  const [startDate, setStartDate] = useState("2025-01-07");
  const [totalMonths, setTotalMonths] = useState("72");
  const [vestingMonth, setVestingMonth] = useState("72");
  const [stateContributionRate, setStateContributionRate] = useState("30");
  const [vestingRate, setVestingRate] = useState("35");
  const [actualPrincipalPaid, setActualPrincipalPaid] = useState("");
  const [actualMainFundReturn, setActualMainFundReturn] = useState("25000");
  const [actualStateContribution, setActualStateContribution] = useState("21300");
  const [actualStateFundReturn, setActualStateFundReturn] = useState("5300");
  const [yearlyInputs, setYearlyInputs] = useState(defaultYearlyInputs);

  const projection = useMemo(() => {
    const modelTotalMonths = Math.max(1, numberValue(totalMonths));
    const currentMonth = Math.min(Math.max(0, numberValue(currentMonthInput)), modelTotalMonths);
    const vestMonth = Math.max(1, numberValue(vestingMonth));
    const stateRate = percentValue(stateContributionRate);
    const vestRate = percentValue(vestingRate);
    const actualFundReturn = numberValue(actualMainFundReturn);
    const actualStateBase = numberValue(actualStateContribution);
    const actualStateReturn = numberValue(actualStateFundReturn);
    const actualStateTotal = actualStateBase + actualStateReturn;

    let scheduledPrincipalUntilCurrent = 0;
    for (let month = 1; month <= currentMonth; month += 1) {
      const date = addMonths(startDate, month - 1);
      const yearInput = yearlyInputs.find((item) => Number(item.year) === date.getFullYear()) || yearlyInputs[yearlyInputs.length - 1];
      scheduledPrincipalUntilCurrent += numberValue(yearInput?.monthlyContribution);
    }

    const currentPrincipalPaid = numberValue(actualPrincipalPaid) > 0 ? numberValue(actualPrincipalPaid) : scheduledPrincipalUntilCurrent;
    const currentEarnedStateAmount = actualStateTotal * vestRate;
    const currentTotalMoney = currentPrincipalPaid + actualFundReturn + currentEarnedStateAmount;

    let principalPaid = 0;
    let fundOpening = 0;
    let cumulativeFundReturn = 0;
    let stateContributionTotal = 0;
    let stateFundOpening = 0;
    let cumulativeStateFundReturn = 0;
    const rows = [];

    for (let month = 1; month <= modelTotalMonths; month += 1) {
      const date = addMonths(startDate, month - 1);
      const year = date.getFullYear();
      const yearInput = yearlyInputs.find((item) => Number(item.year) === year) || yearlyInputs[yearlyInputs.length - 1];
      const monthlyContribution = numberValue(yearInput?.monthlyContribution);
      const monthlyFundRate = Math.pow(1 + percentValue(yearInput?.fundReturn), 1 / 12) - 1;
      const monthlyStateRate = Math.pow(1 + percentValue(yearInput?.stateReturn), 1 / 12) - 1;
      let monthlyFundReturn = 0;
      let monthlyStateContribution = 0;
      let monthlyStateFundReturn = 0;

      if (month < currentMonth) {
        const ratio = currentMonth > 0 ? month / currentMonth : 0;
        principalPaid = currentPrincipalPaid * ratio;
        cumulativeFundReturn = actualFundReturn * ratio;
        fundOpening = principalPaid + cumulativeFundReturn;
        stateContributionTotal = actualStateBase * ratio;
        cumulativeStateFundReturn = actualStateReturn * ratio;
        stateFundOpening = stateContributionTotal + cumulativeStateFundReturn;
        monthlyFundReturn = month === 1 ? cumulativeFundReturn : 0;
        monthlyStateContribution = month === 1 ? stateContributionTotal : 0;
        monthlyStateFundReturn = month === 1 ? cumulativeStateFundReturn : 0;
      } else if (month === currentMonth) {
        principalPaid = currentPrincipalPaid;
        cumulativeFundReturn = actualFundReturn;
        fundOpening = principalPaid + cumulativeFundReturn;
        stateContributionTotal = actualStateBase;
        cumulativeStateFundReturn = actualStateReturn;
        stateFundOpening = actualStateTotal;
        monthlyFundReturn = actualFundReturn;
        monthlyStateContribution = actualStateBase;
        monthlyStateFundReturn = actualStateReturn;
      } else {
        principalPaid += monthlyContribution;
        monthlyFundReturn = (fundOpening + monthlyContribution) * monthlyFundRate;
        cumulativeFundReturn += monthlyFundReturn;
        fundOpening = fundOpening + monthlyContribution + monthlyFundReturn;
        monthlyStateContribution = monthlyContribution * stateRate;
        stateContributionTotal += monthlyStateContribution;
        monthlyStateFundReturn = (stateFundOpening + monthlyStateContribution) * monthlyStateRate;
        cumulativeStateFundReturn += monthlyStateFundReturn;
        stateFundOpening = stateFundOpening + monthlyStateContribution + monthlyStateFundReturn;
      }

      const fundClosing = month <= currentMonth ? principalPaid + cumulativeFundReturn : fundOpening;
      const stateFundClosing = month <= currentMonth ? stateContributionTotal + cumulativeStateFundReturn : stateFundOpening;
      const earnedStateAmount = month >= vestMonth ? stateFundClosing * vestRate : 0;
      const estimatedTotalReturn = cumulativeFundReturn + earnedStateAmount;
      const totalPortfolioValue = principalPaid + estimatedTotalReturn;

      rows.push({ month, period: `${month}/${modelTotalMonths}`, remainingMonth: Math.max(modelTotalMonths - month, 0), date, year, monthlyContribution, principalPaid, monthlyFundReturn, cumulativeFundReturn, fundClosing, monthlyStateContribution, stateContributionTotal, monthlyStateFundReturn, cumulativeStateFundReturn, stateFundClosing, earnedStateAmount, estimatedTotalReturn, totalPortfolioValue });
    }

    const currentRow = rows[Math.max(currentMonth - 1, 0)] || rows[0];
    const vestingRow = rows[vestMonth - 1];
    const exitRow = rows[modelTotalMonths - 1];
    const sixYearDate = addMonths(startDate, 72);
    const progressPercent = Math.min(100, Math.max(0, (currentMonth / modelTotalMonths) * 100));

    return { rows, currentMonth, currentRow, remainingMonth: Math.max(modelTotalMonths - currentMonth, 0), vestingRow, exitRow, sixYearDate, currentStateTotal: actualStateTotal, currentPrincipalPaid, currentEarnedStateAmount, currentTotalMoney, progressPercent, modelTotalMonths };
  }, [currentMonthInput, startDate, totalMonths, vestingMonth, stateContributionRate, vestingRate, actualPrincipalPaid, actualMainFundReturn, actualStateContribution, actualStateFundReturn, yearlyInputs]);

  useEffect(() => {
    if (typeof onTotalChange === "function") onTotalChange(Number(projection.currentTotalMoney || 0));
  }, [onTotalChange, projection.currentTotalMoney]);

  const updateYearInput = (index, field, value) => {
    setYearlyInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  return (
    <section className="panelCard besProjectionPanel">
      <button type="button" className="panelHeader" onClick={() => setMainOpen((value) => !value)}>
        <div><h2 className="gradientTitle">BES Projeksiyon</h2><p>Mevcut BES deÄŸeri, yukarÄ±daki BlokajlÄ± YatÄ±rÄ±m toplamÄ±na otomatik eklenir.</p></div>
        <div className="panelRight"><div className="panelTotal"><span>Mevcut Total Para</span><strong>{money(projection.currentTotalMoney)}</strong></div><div className="panelTotal"><span>Ä°lerleme</span><strong>{projection.currentMonth} / {projection.modelTotalMonths} Ay</strong></div><div className="toggleButton">{mainOpen ? "âˆ’" : "+"}</div></div>
      </button>

      {mainOpen ? (
        <div className="panelBody">
          <div className="besProgressCard"><div className="besProgressTop"><div><span>Mevcut Ay</span><strong>{projection.currentMonth}. Ay</strong></div><div><span>Toplam SÃ¼re</span><strong>{projection.modelTotalMonths} Ay</strong></div><div><span>Tamamlanma</span><strong>%{projection.progressPercent.toFixed(1)}</strong></div></div><div className="besProgressTrack"><div className="besProgressFill" style={{ width: `${projection.progressPercent}%` }} /></div></div>

          <section className="summaryGrid investmentSummaryGrid"><article className="summaryCard green"><div className="summaryLabel">Mevcut Total Para</div><div className="summaryValue summaryValue-green">{money(projection.currentTotalMoney)}</div><div className="summaryDetail">Ana para + fon getirisi + devlet toplamÄ±nÄ±n %{vestingRate} payÄ±</div></article><article className="summaryCard blue"><div className="summaryLabel">GÃ¼ncel Ä°lerleme</div><div className="summaryValue summaryValue-blue">{projection.currentMonth}. Ay</div><div className="summaryDetail">Kalan ay: {projection.remainingMonth}</div></article><article className="summaryCard purple"><div className="summaryLabel">Mevcut Fon Getirisi</div><div className="summaryValue summaryValue-purple">{money(projection.currentRow?.cumulativeFundReturn)}</div><div className="summaryDetail">GerÃ§ekleÅŸen ana fon kÃ¢rÄ±</div></article><article className="summaryCard red"><div className="summaryLabel">Hak Edilen Devlet PayÄ±</div><div className="summaryValue summaryValue-red">{money(projection.currentEarnedStateAmount)}</div><div className="summaryDetail">Devlet katkÄ±sÄ± + devlet fon getirisi x %{vestingRate}</div></article></section>

          <PanelBlock title="GerÃ§ekleÅŸen GÃ¼ncel DeÄŸerler" subtitle="BugÃ¼ne kadar gerÃ§ekleÅŸen mevcut BES deÄŸerlerini buraya gir." color="purple" open={inputsOpen} onToggle={() => setInputsOpen((value) => !value)}>
            <div className="formGrid six besGrid"><label className="inputBox"><span>GÃ¼ncel Ay</span><input value={currentMonthInput} onChange={(event) => setCurrentMonthInput(event.target.value)} placeholder="15" /></label><label className="inputBox"><span>BaÅŸlangÄ±Ã§ Tarihi</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="inputBox"><span>Toplam Ay</span><input value={totalMonths} onChange={(event) => setTotalMonths(event.target.value)} /></label><label className="inputBox"><span>Hak EdiÅŸ AyÄ±</span><input value={vestingMonth} onChange={(event) => setVestingMonth(event.target.value)} /></label><label className="inputBox"><span>Hak EdiÅŸ %</span><input value={vestingRate} onChange={(event) => setVestingRate(event.target.value)} /></label><label className="inputBox"><span>GerÃ§ekleÅŸen Ana Para</span><input value={actualPrincipalPaid} onChange={(event) => setActualPrincipalPaid(event.target.value)} placeholder="BoÅŸsa plana gÃ¶re hesaplar" /></label><label className="inputBox"><span>Mevcut Fon Getirisi</span><input value={actualMainFundReturn} onChange={(event) => setActualMainFundReturn(event.target.value)} /></label><label className="inputBox"><span>Devlet KatkÄ±sÄ± Ana Para</span><input value={actualStateContribution} onChange={(event) => setActualStateContribution(event.target.value)} /></label><label className="inputBox"><span>Devlet KatkÄ±sÄ± Fon Getirisi</span><input value={actualStateFundReturn} onChange={(event) => setActualStateFundReturn(event.target.value)} /></label><label className="inputBox"><span>Gelecek Devlet KatkÄ±sÄ± %</span><input value={stateContributionRate} onChange={(event) => setStateContributionRate(event.target.value)} /></label></div>
          </PanelBlock>

          <PanelBlock title="Devlet KatkÄ±sÄ± MantÄ±ÄŸÄ±" subtitle="Devlet katkÄ±sÄ± ana para ve devlet katkÄ±sÄ± fon getirisi ayrÄ± takip edilir." color="mint" open={summaryOpen} onToggle={() => setSummaryOpen((value) => !value)}><div className="besLogicGrid"><div className="besLogicCard"><span>GerÃ§ekleÅŸen Ana Para</span><strong>{money(projection.currentPrincipalPaid)}</strong><p>BES hesabÄ±na bugÃ¼ne kadar yatÄ±rÄ±lan veya plana gÃ¶re hesaplanan ana para.</p></div><div className="besLogicCard"><span>Devlet KatkÄ±sÄ± Ana Para</span><strong>{money(numberValue(actualStateContribution))}</strong><p>Ã–denen katkÄ± paylarÄ±ndan oluÅŸan devlet katkÄ±sÄ± ana tutarÄ±.</p></div><div className="besLogicCard"><span>Devlet KatkÄ±sÄ± Fon Getirisi</span><strong>{money(numberValue(actualStateFundReturn))}</strong><p>Devlet katkÄ±sÄ± hesabÄ±nÄ±n fonlarda kazandÄ±rdÄ±ÄŸÄ± getiri.</p></div><div className="besLogicCard"><span>Mevcut Total Para</span><strong>{money(projection.currentTotalMoney)}</strong><p>Ana para + fon getirisi + devlet toplamÄ±nÄ±n %{vestingRate} hak edilen kÄ±smÄ±.</p></div></div></PanelBlock>

          <PanelBlock title="YÄ±llÄ±k KatkÄ± ve Getiri VarsayÄ±mlarÄ±" subtitle="Gelecek dÃ¶nem katkÄ± ve getiri varsayÄ±mlarÄ±nÄ± yÄ±l bazÄ±nda deÄŸiÅŸtir." color="orange" open={yearlyOpen} onToggle={() => setYearlyOpen((value) => !value)}><div className="besYearTable"><div className="besYearHeader"><span>YÄ±l</span><span>AylÄ±k KatkÄ±</span><span>Ana Fon YÄ±llÄ±k Getiri %</span><span>Devlet Fon YÄ±llÄ±k Getiri %</span></div>{yearlyInputs.map((item, index) => <div className="besYearRow" key={item.year}><strong>{item.year}</strong><input value={item.monthlyContribution} onChange={(event) => updateYearInput(index, "monthlyContribution", event.target.value)} /><input value={item.fundReturn} onChange={(event) => updateYearInput(index, "fundReturn", event.target.value)} /><input value={item.stateReturn} onChange={(event) => updateYearInput(index, "stateReturn", event.target.value)} /></div>)}</div></PanelBlock>

          <PanelBlock title="Ay BazlÄ± Projeksiyon" subtitle="Tablo varsayÄ±lan kapalÄ± gelir. AÃ§Ä±nca tÃ¼m aylar ve tarihler gÃ¶rÃ¼nÃ¼r." color="purple" open={tableOpen} onToggle={() => setTableOpen((value) => !value)}><div className="besProjectionTableWrap"><table className="besProjectionTable"><thead><tr><th>DÃ¶nem</th><th>Tarih</th><th>Kalan Ay</th><th>AylÄ±k KatkÄ±</th><th>Mevcut YatÄ±rÄ±m</th><th>AylÄ±k Fon Getirisi</th><th>KÃ¼mÃ¼latif Fon Getirisi</th><th>Ana Fon DeÄŸeri</th><th>Devlet KatkÄ±sÄ± Ana Para</th><th>Devlet KatkÄ±sÄ± Fon Getirisi</th><th>Toplam Devlet Fonu</th><th>Hak Edilen Devlet</th><th>Total Getiri</th><th>PortfÃ¶y</th></tr></thead><tbody>{projection.rows.map((row) => <tr key={row.month} className={row.month === Number(vestingMonth) ? "vestingBesRow" : row.month === projection.currentMonth ? "currentBesRow" : ""}><td>{row.period}</td><td>{formatDate(row.date)}</td><td>{row.remainingMonth}</td><td>{money(row.monthlyContribution)}</td><td>{money(row.principalPaid)}</td><td>{money(row.monthlyFundReturn)}</td><td>{money(row.cumulativeFundReturn)}</td><td>{money(row.fundClosing)}</td><td>{money(row.stateContributionTotal)}</td><td>{money(row.cumulativeStateFundReturn)}</td><td>{money(row.stateFundClosing)}</td><td>{money(row.earnedStateAmount)}</td><td>{money(row.estimatedTotalReturn)}</td><td>{money(row.totalPortfolioValue)}</td></tr>)}</tbody></table></div></PanelBlock>
        </div>
      ) : null}
    </section>
  );
}
