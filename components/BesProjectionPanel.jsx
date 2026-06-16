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
  return (
    Number(
      String(value || "")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
    ) || 0
  );
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
function percentValue(value) { return numberValue(value) / 100; }
function money(value) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value || 0)); }

function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function parseProgress(progressText, fallbackTotalMonth) {
  const clean = String(progressText || "").replace(/\s/g, "");
  if (!clean.includes("/")) return { currentMonth: 0, progressTotalMonth: fallbackTotalMonth };

  if (!clean.includes("/")) {
    return {
      currentMonth: 0,
      progressTotalMonth: fallbackTotalMonth,
    };
  }

  const [current, total] = clean.split("/");
  return { currentMonth: Number(current || 0), progressTotalMonth: Number(total || fallbackTotalMonth) };

  return {
    currentMonth: Number(current || 0),
    progressTotalMonth: Number(total || fallbackTotalMonth),
  };
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

        <div className="miniRight">
          <div className="miniToggle">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? <div className="miniBody">{children}</div> : null}
    </section>
  );
}

export default function BesProjectionPanel() {
  const [mainOpen, setMainOpen] = useState(true);
  const [inputsOpen, setInputsOpen] = useState(true);
  const [yearlyOpen, setYearlyOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(false);

  const [progressText, setProgressText] = useState("15/72");
  const [startDate, setStartDate] = useState("2025-01-07");
  const [totalMonths, setTotalMonths] = useState("72");
  const [criticalMonth, setCriticalMonth] = useState("60");
  const [vestingMonth, setVestingMonth] = useState("72");

  const [stateContributionRate, setStateContributionRate] = useState("30");
  const [vestingRate, setVestingRate] = useState("35");

  const [actualPrincipalPaid, setActualPrincipalPaid] = useState("");
  const [actualMainFundReturn, setActualMainFundReturn] = useState("25000");
  const [actualStateContribution, setActualStateContribution] = useState("21300");
  const [actualStateFundReturn, setActualStateFundReturn] = useState("5300");

  const [yearlyInputs, setYearlyInputs] = useState(defaultYearlyInputs);

  const projection = useMemo(() => {
    const modelTotalMonths = numberValue(totalMonths);
    const critical = numberValue(criticalMonth);
    const vestMonth = numberValue(vestingMonth);
    const stateRate = percentValue(stateContributionRate);
    const vestRate = percentValue(vestingRate);

    const { currentMonth } = parseProgress(progressText, modelTotalMonths);
    let principalPaid = 0, fundOpening = 0, cumulativeFundReturn = 0, stateFundOpening = 0, cumulativeStateFundReturn = 0;
    const start = new Date(startDate || "2025-01-07");

    const actualFundReturn = numberValue(actualMainFundReturn);
    const actualStateBase = numberValue(actualStateContribution);
    const actualStateReturn = numberValue(actualStateFundReturn);
    const actualStateTotal = actualStateBase + actualStateReturn;

    let scheduledPrincipalUntilCurrent = 0;

    for (let month = 1; month <= currentMonth; month += 1) {
      const date = addMonths(startDate, month - 1);
      const year = date.getFullYear();

      const yearInput =
        yearlyInputs.find((item) => Number(item.year) === year) ||
        yearlyInputs[yearlyInputs.length - 1];

      scheduledPrincipalUntilCurrent += numberValue(yearInput?.monthlyContribution);
    }

    const currentPrincipalPaid =
      numberValue(actualPrincipalPaid) > 0
        ? numberValue(actualPrincipalPaid)
        : scheduledPrincipalUntilCurrent;

    let principalPaid = 0;
    let fundOpening = 0;
    let cumulativeFundReturn = 0;

    let stateContributionTotal = 0;
    let stateFundOpening = 0;
    let cumulativeStateFundReturn = 0;

    const rows = [];

    for (let month = 1; month <= modelTotalMonths; month += 1) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + month - 1);
      const date = addMonths(startDate, month - 1);
      const year = date.getFullYear();
      const yearInput = yearlyInputs.find((item) => Number(item.year) === year) || yearlyInputs[yearlyInputs.length - 1];

      const yearInput =
        yearlyInputs.find((item) => Number(item.year) === year) ||
        yearlyInputs[yearlyInputs.length - 1];

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
      const annualFundReturn = percentValue(yearInput?.fundReturn);
      const annualStateReturn = percentValue(yearInput?.stateReturn);

      const monthlyFundRate = Math.pow(1 + annualFundReturn, 1 / 12) - 1;
      const monthlyStateRate = Math.pow(1 + annualStateReturn, 1 / 12) - 1;

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

        const fundClosingFuture =
          fundOpening + monthlyContribution + monthlyFundReturn;

        monthlyStateContribution = monthlyContribution * stateRate;
        stateContributionTotal += monthlyStateContribution;

        monthlyStateFundReturn =
          (stateFundOpening + monthlyStateContribution) * monthlyStateRate;

        cumulativeStateFundReturn += monthlyStateFundReturn;

        const stateFundClosingFuture =
          stateFundOpening + monthlyStateContribution + monthlyStateFundReturn;

        fundOpening = fundClosingFuture;
        stateFundOpening = stateFundClosingFuture;
      }

      const fundClosing = month <= currentMonth ? principalPaid + cumulativeFundReturn : fundOpening;
      const stateFundClosing =
        month <= currentMonth
          ? stateContributionTotal + cumulativeStateFundReturn
          : stateFundOpening;

      const earnedStateAmount =
        month >= vestMonth ? stateFundClosing * vestRate : 0;

      const estimatedTotalReturn =
        cumulativeFundReturn + earnedStateAmount;

      const totalPortfolioValue =
        principalPaid + estimatedTotalReturn;

      rows.push({
        month,
        period: `${month}/${modelTotalMonths}`,
        remainingMonth: Math.max(modelTotalMonths - month, 0),
        date,
        year,
        monthlyContribution,
        principalPaid,
        monthlyFundReturn,
        cumulativeFundReturn,
        fundClosing,
        monthlyStateContribution,
        stateContributionTotal,
        monthlyStateFundReturn,
        cumulativeStateFundReturn,
        stateFundClosing,
        vestingRate: month >= vestMonth ? vestRate : 0,
        earnedStateAmount,
        estimatedTotalReturn,
        totalPortfolioValue,
      });
    }

    return { rows, currentMonth, remainingMonth: Math.max(modelTotalMonths - currentMonth, 0), criticalRow: rows[critical - 1], exitRow: rows[modelTotalMonths - 1] };
  }, [progressText, startDate, totalMonths, criticalMonth, stateContributionRate, vestingRate, yearlyInputs]);
    const currentRow = rows[Math.max(currentMonth - 1, 0)] || rows[0];
    const criticalRow = rows[critical - 1];
    const vestingRow = rows[vestMonth - 1];
    const exitRow = rows[modelTotalMonths - 1];

    const sixYearDate = addMonths(startDate, 72);

    return {
      rows,
      currentMonth,
      currentRow,
      remainingMonth: Math.max(modelTotalMonths - currentMonth, 0),
      criticalRow,
      vestingRow,
      exitRow,
      sixYearDate,
      currentStateTotal: actualStateTotal,
    };
  }, [
    progressText,
    startDate,
    totalMonths,
    criticalMonth,
    vestingMonth,
    stateContributionRate,
    vestingRate,
    actualPrincipalPaid,
    actualMainFundReturn,
    actualStateContribution,
    actualStateFundReturn,
    yearlyInputs,
  ]);

  const updateYearInput = (index, field, value) => {
    setYearlyInputs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    setYearlyInputs((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <section className="panelCard besProjectionPanel">
      <button type="button" className="panelHeader">
        <div><h2 className="gradientTitle">BES Projeksiyon</h2><p>7 Ocak 2025 başlangıçlı, Aralık 2029 kritik eşik ve Aralık 2030 çıkış senaryosu.</p></div>
        <div className="panelRight"><div className="panelTotal"><span>Çıkış Portföyü</span><strong>{money(projection.exitRow?.totalPortfolioValue)}</strong></div></div>
      <button
        type="button"
        className="panelHeader"
        onClick={() => setMainOpen((value) => !value)}
      >
        <div>
          <h2 className="gradientTitle">BES Projeksiyon</h2>
          <p>
            Gerçekleşen fon getirisi, devlet katkısı ana para ve devlet katkısı fon getirisi
            ayrı takip edilir. 6 yıl sonunda devlet katkısı hak edişi %{vestingRate}
            olarak hesaplanır.
          </p>
        </div>

        <div className="panelRight">
          <div className="panelTotal">
            <span>6 Yıl Hak Ediş Tarihi</span>
            <strong>{formatDate(projection.sixYearDate)}</strong>
          </div>

          <div className="toggleButton">{mainOpen ? "−" : "+"}</div>
        </div>
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

      {mainOpen ? (
        <div className="panelBody">
          <section className="summaryGrid investmentSummaryGrid">
            <article className="summaryCard blue">
              <div className="summaryLabel">Güncel İlerleme</div>
              <div className="summaryValue summaryValue-blue">
                {projection.currentMonth}. Ay
              </div>
              <div className="summaryDetail">
                Kalan ay: {projection.remainingMonth}
              </div>
            </article>

            <article className="summaryCard purple">
              <div className="summaryLabel">Mevcut Fon Getirisi</div>
              <div className="summaryValue summaryValue-purple">
                {money(projection.currentRow?.cumulativeFundReturn)}
              </div>
              <div className="summaryDetail">
                Senin verdiğin gerçekleşen ana fon kârı
              </div>
            </article>

            <article className="summaryCard green">
              <div className="summaryLabel">Mevcut Devlet Toplamı</div>
              <div className="summaryValue summaryValue-green">
                {money(projection.currentStateTotal)}
              </div>
              <div className="summaryDetail">
                Devlet katkısı + devlet katkısı fon getirisi
              </div>
            </article>

            <article className="summaryCard red">
              <div className="summaryLabel">6. Yıl Hak Edilen Devlet</div>
              <div className="summaryValue summaryValue-red">
                {money(projection.vestingRow?.earnedStateAmount)}
              </div>
              <div className="summaryDetail">
                {formatDate(projection.sixYearDate)} tarihinde %{vestingRate}
              </div>
            </article>
          </section>

          <PanelBlock
            title="Gerçekleşen Güncel Değerler"
            subtitle="Ocak 2025'ten bugüne kadar gerçekleşen mevcut değerleri buraya gir."
            color="purple"
            open={inputsOpen}
            onToggle={() => setInputsOpen((value) => !value)}
          >
            <div className="formGrid six besGrid">
              <label className="inputBox">
                <span>Güncel İlerleme</span>
                <input
                  value={progressText}
                  onChange={(event) => setProgressText(event.target.value)}
                  placeholder="15/72"
                />
              </label>

              <label className="inputBox">
                <span>Başlangıç Tarihi</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Toplam Ay</span>
                <input
                  value={totalMonths}
                  onChange={(event) => setTotalMonths(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>5. Yıl Kritik Ay</span>
                <input
                  value={criticalMonth}
                  onChange={(event) => setCriticalMonth(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Hak Ediş Ayı</span>
                <input
                  value={vestingMonth}
                  onChange={(event) => setVestingMonth(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Hak Ediş %</span>
                <input
                  value={vestingRate}
                  onChange={(event) => setVestingRate(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Gerçekleşen Ana Para</span>
                <input
                  value={actualPrincipalPaid}
                  onChange={(event) => setActualPrincipalPaid(event.target.value)}
                  placeholder="Boşsa plana göre hesaplar"
                />
              </label>

              <label className="inputBox">
                <span>Mevcut Fon Getirisi</span>
                <input
                  value={actualMainFundReturn}
                  onChange={(event) => setActualMainFundReturn(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Devlet Katkısı Ana Para</span>
                <input
                  value={actualStateContribution}
                  onChange={(event) => setActualStateContribution(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Devlet Katkısı Fon Getirisi</span>
                <input
                  value={actualStateFundReturn}
                  onChange={(event) => setActualStateFundReturn(event.target.value)}
                />
              </label>

              <label className="inputBox">
                <span>Gelecek Devlet Katkısı %</span>
                <input
                  value={stateContributionRate}
                  onChange={(event) => setStateContributionRate(event.target.value)}
                />
              </label>
            </div>
          </PanelBlock>

          <PanelBlock
            title="Devlet Katkısı Mantığı"
            subtitle="Devlet katkısı ana para ve devlet katkısı fon getirisi ayrı takip edilir."
            color="mint"
            open={summaryOpen}
            onToggle={() => setSummaryOpen((value) => !value)}
          >
            <div className="besLogicGrid">
              <div className="besLogicCard">
                <span>Devlet Katkısı Ana Para</span>
                <strong>{money(numberValue(actualStateContribution))}</strong>
                <p>Ödenen katkı paylarından oluşan devlet katkısı ana tutarı.</p>
              </div>

              <div className="besLogicCard">
                <span>Devlet Katkısı Fon Getirisi</span>
                <strong>{money(numberValue(actualStateFundReturn))}</strong>
                <p>Devlet katkısı hesabının fonlarda kazandırdığı getiri.</p>
              </div>

              <div className="besLogicCard">
                <span>Toplam Devlet Katkısı Fonu</span>
                <strong>{money(projection.currentStateTotal)}</strong>
                <p>Devlet katkısı ana para + devlet katkısı fon getirisi.</p>
              </div>

              <div className="besLogicCard">
                <span>6 Yıl Sonu Net Hak Edilen</span>
                <strong>{money(projection.vestingRow?.earnedStateAmount)}</strong>
                <p>6 yıl dolunca toplam devlet katkısı fonunun %{vestingRate} kısmı.</p>
              </div>
            </div>
          </PanelBlock>

          <PanelBlock
            title="Yıllık Katkı ve Getiri Varsayımları"
            subtitle="Gelecek dönem katkı ve getiri varsayımlarını yıl bazında değiştir."
            color="orange"
            open={yearlyOpen}
            onToggle={() => setYearlyOpen((value) => !value)}
          >
            <div className="besYearTable">
              <div className="besYearHeader">
                <span>Yıl</span>
                <span>Aylık Katkı</span>
                <span>Ana Fon Yıllık Getiri %</span>
                <span>Devlet Fon Yıllık Getiri %</span>
              </div>

              {yearlyInputs.map((item, index) => (
                <div className="besYearRow" key={item.year}>
                  <strong>{item.year}</strong>

                  <input
                    value={item.monthlyContribution}
                    onChange={(event) =>
                      updateYearInput(index, "monthlyContribution", event.target.value)
                    }
                  />

                  <input
                    value={item.fundReturn}
                    onChange={(event) =>
                      updateYearInput(index, "fundReturn", event.target.value)
                    }
                  />

                  <input
                    value={item.stateReturn}
                    onChange={(event) =>
                      updateYearInput(index, "stateReturn", event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </PanelBlock>

          <PanelBlock
            title="Ay Bazlı Projeksiyon"
            subtitle="Tablo varsayılan kapalı gelir. Açınca tüm aylar ve tarihler görünür."
            color="purple"
            open={tableOpen}
            onToggle={() => setTableOpen((value) => !value)}
          >
            <div className="besProjectionTableWrap">
              <table className="besProjectionTable">
                <thead>
                  <tr>
                    <th>Dönem</th>
                    <th>Tarih</th>
                    <th>Kalan Ay</th>
                    <th>Aylık Katkı</th>
                    <th>Mevcut Yatırım</th>
                    <th>Aylık Fon Getirisi</th>
                    <th>Kümülatif Fon Getirisi</th>
                    <th>Ana Fon Değeri</th>
                    <th>Devlet Katkısı Ana Para</th>
                    <th>Devlet Katkısı Fon Getirisi</th>
                    <th>Toplam Devlet Fonu</th>
                    <th>Hak Edilen Devlet</th>
                    <th>Total Getiri</th>
                    <th>Portföy</th>
                  </tr>
                </thead>

                <tbody>
                  {projection.rows.map((row) => (
                    <tr
                      key={row.month}
                      className={
                        row.month === Number(vestingMonth)
                          ? "vestingBesRow"
                          : row.month === Number(criticalMonth)
                          ? "criticalBesRow"
                          : row.month === projection.currentMonth
                          ? "currentBesRow"
                          : ""
                      }
                    >
                      <td>{row.period}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.remainingMonth}</td>
                      <td>{money(row.monthlyContribution)}</td>
                      <td>{money(row.principalPaid)}</td>
                      <td>{money(row.monthlyFundReturn)}</td>
                      <td>{money(row.cumulativeFundReturn)}</td>
                      <td>{money(row.fundClosing)}</td>
                      <td>{money(row.stateContributionTotal)}</td>
                      <td>{money(row.cumulativeStateFundReturn)}</td>
                      <td>{money(row.stateFundClosing)}</td>
                      <td>{money(row.earnedStateAmount)}</td>
                      <td>{money(row.estimatedTotalReturn)}</td>
                      <td>{money(row.totalPortfolioValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelBlock>
        </div>
      ) : null}
    </section>
  );
}
