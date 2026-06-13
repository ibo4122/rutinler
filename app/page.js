"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisel-finans-panel";

const emptyIncome = {
  salary: "",
  mealAllowance: "",
};

const emptyExtraIncome = {
  title: "",
  amount: "",
};

const emptyCredit = {
  title: "",
  monthlyPayment: "",
  installmentText: "",
  remainingDebt: "",
};

const emptyExpense = {
  title: "",
  category: "",
  amount: "",
  note: "",
};

export default function HomePage() {
  const [income, setIncome] =
    useState(emptyIncome);

  const [extraIncomes, setExtraIncomes] =
    useState([]);

  const [credits, setCredits] =
    useState([]);

  const [cardExpenses, setCardExpenses] =
    useState([]);

  const [otherExpenses, setOtherExpenses] =
    useState([]);

  const [extraIncomeForm, setExtraIncomeForm] =
    useState(emptyExtraIncome);

  const [creditForm, setCreditForm] =
    useState(emptyCredit);

  const [cardForm, setCardForm] =
    useState(emptyExpense);

  const [otherForm, setOtherForm] =
    useState(emptyExpense);

  const [incomeOpen, setIncomeOpen] =
    useState(true);

  const [creditOpen, setCreditOpen] =
    useState(true);

  const [cardOpen, setCardOpen] =
    useState(true);

  const [otherOpen, setOtherOpen] =
    useState(true);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        setIncome(data.income || emptyIncome);

        setExtraIncomes(
          data.extraIncomes || []
        );

        setCredits(data.credits || []);

        setCardExpenses(
          data.cardExpenses || []
        );

        setOtherExpenses(
          data.otherExpenses || []
        );
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        income,
        extraIncomes,
        credits,
        cardExpenses,
        otherExpenses,
      })
    );
  }, [
    income,
    extraIncomes,
    credits,
    cardExpenses,
    otherExpenses,
  ]);

  const money = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const totals = useMemo(() => {
    const salary = Number(
      income.salary || 0
    );

    const mealAllowance = Number(
      income.mealAllowance || 0
    );

    const extraIncomeTotal =
      extraIncomes.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalIncome =
      salary + extraIncomeTotal;

    const creditTotal = credits.reduce(
      (sum, item) =>
        sum +
        Number(item.monthlyPayment || 0),
      0
    );

    const cardTotal =
      cardExpenses.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const otherTotal =
      otherExpenses.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalDebt = credits.reduce(
      (sum, item) =>
        sum +
        Number(item.remainingDebt || 0),
      0
    );

    const totalExpense =
      creditTotal + cardTotal + otherTotal;

    return {
      totalIncome,
      totalExpense,
      totalDebt,
      balance:
        totalIncome - totalExpense,
      mealAllowance,
      extraIncomeTotal,
      creditTotal,
      cardTotal,
      otherTotal,
    };
  }, [
    income,
    extraIncomes,
    credits,
    cardExpenses,
    otherExpenses,
  ]);

  const addExtraIncome = () => {
    if (
      !extraIncomeForm.title ||
      !extraIncomeForm.amount
    ) {
      return;
    }

    setExtraIncomes((prev) => [
      {
        id: Date.now(),
        ...extraIncomeForm,
      },
      ...prev,
    ]);

    setExtraIncomeForm(
      emptyExtraIncome
    );
  };

  const addCredit = () => {
    if (
      !creditForm.title ||
      !creditForm.monthlyPayment
    ) {
      return;
    }

    setCredits((prev) => [
      {
        id: Date.now(),
        ...creditForm,
      },
      ...prev,
    ]);

    setCreditForm(emptyCredit);
  };

  const addCardExpense = () => {
    if (
      !cardForm.title ||
      !cardForm.amount
    ) {
      return;
    }

    setCardExpenses((prev) => [
      {
        id: Date.now(),
        ...cardForm,
      },
      ...prev,
    ]);

    setCardForm(emptyExpense);
  };

  const addOtherExpense = () => {
    if (
      !otherForm.title ||
      !otherForm.amount
    ) {
      return;
    }

    setOtherExpenses((prev) => [
      {
        id: Date.now(),
        ...otherForm,
      },
      ...prev,
    ]);

    setOtherForm(emptyExpense);
  };

  const installmentPercent = (text) => {
    if (!text?.includes("/")) return 0;

    const [current, total] =
      text.split("/");

    const percent =
      (Number(current) /
        Number(total)) *
      100;

    return Math.min(percent, 100);
  };

  return (
    <main className="financePage">

      <div className="financeShell">

        <header className="topHeader">

          <div className="topBadge">
            Finans Yönetim Paneli
          </div>

        </header>

        <section className="summaryGrid">

          <SummaryCard
            tone="green"
            title="Toplam Gelir"
            value={money(
              totals.totalIncome
            )}
            detail={`Yemek parası: ${money(
              totals.mealAllowance
            )}`}
          />

          <SummaryCard
            tone="red"
            title="Toplam Gider"
            value={money(
              totals.totalExpense
            )}
            detail="Tüm aylık giderler"
          />

          <SummaryCard
            tone="blue"
            title="Aylık Kalan"
            value={money(
              totals.balance
            )}
            detail="Gelir - gider"
          />

          <SummaryCard
            tone="purple"
            title="Toplam Borç"
            value={money(
              totals.totalDebt
            )}
            detail="Toplam kredi borcu"
          />

        </section>

        <Panel
          title="Gelirler"
          subtitle="Maaş ve ek gelir yönetimi"
          total={money(
            totals.totalIncome
          )}
          open={incomeOpen}
          onToggle={() =>
            setIncomeOpen(!incomeOpen)
          }
        >

          <div className="formGrid two">

            <InputBox
              label="Maaş"
              type="number"
              value={income.salary}
              onChange={(value) =>
                setIncome((prev) => ({
                  ...prev,
                  salary: value,
                }))
              }
            />

            <InputBox
              label="Yemek Parası"
              type="number"
              value={
                income.mealAllowance
              }
              onChange={(value) =>
                setIncome((prev) => ({
                  ...prev,
                  mealAllowance:
                    value,
                }))
              }
            />

          </div>

          <MiniPanel
            title="Ek Gelirler"
            total={money(
              totals.extraIncomeTotal
            )}
            color="mint"
          >

            <div className="formGrid three">

              <InputBox
                label="Gelir Adı"
                value={
                  extraIncomeForm.title
                }
                onChange={(value) =>
                  setExtraIncomeForm(
                    (prev) => ({
                      ...prev,
                      title: value,
                    })
                  )
                }
              />

              <InputBox
                label="Tutar"
                type="number"
                value={
                  extraIncomeForm.amount
                }
                onChange={(value) =>
                  setExtraIncomeForm(
                    (prev) => ({
                      ...prev,
                      amount: value,
                    })
                  )
                }
              />

              <button
                className="premiumButton"
                onClick={
                  addExtraIncome
                }
              >
                Gelir Ekle
              </button>

            </div>

            <SimpleList
              items={extraIncomes}
              money={money}
              onDelete={(id) =>
                setExtraIncomes(
                  (prev) =>
                    prev.filter(
                      (item) =>
                        item.id !== id
                    )
                )
              }
            />

          </MiniPanel>

        </Panel>

        <Panel
          title="Krediler"
          subtitle="Kredi takip sistemi"
          total={money(
            totals.creditTotal
          )}
          open={creditOpen}
          onToggle={() =>
            setCreditOpen(!creditOpen)
          }
        >

          <div className="formGrid four">

            <InputBox
              label="Kredi Adı"
              value={creditForm.title}
              onChange={(value) =>
                setCreditForm((prev) => ({
                  ...prev,
                  title: value,
                }))
              }
            />

            <InputBox
              label="Aylık Ödeme"
              type="number"
              value={
                creditForm.monthlyPayment
              }
              onChange={(value) =>
                setCreditForm((prev) => ({
                  ...prev,
                  monthlyPayment:
                    value,
                }))
              }
            />

            <InputBox
              label="Taksit"
              value={
                creditForm.installmentText
              }
              onChange={(value) =>
                setCreditForm((prev) => ({
                  ...prev,
                  installmentText:
                    value,
                }))
              }
            />

            <InputBox
              label="Kalan Borç"
              type="number"
              value={
                creditForm.remainingDebt
              }
              onChange={(value) =>
                setCreditForm((prev) => ({
                  ...prev,
                  remainingDebt:
                    value,
                }))
              }
            />

          </div>

          <button
            className="premiumButton wideButton"
            onClick={addCredit}
          >
            Kredi Ekle
          </button>

          <div className="recordList">

            {credits.map((item) => {

              const percent =
                installmentPercent(
                  item.installmentText
                );

              return (
                <div
                  key={item.id}
                  className="creditRecord"
                >

                  <div className="creditRecordTop">

                    <div>

                      <div className="recordTitleRow">

                        <h4>
                          {item.title}
                        </h4>

                        <span className="status waiting">
                          Aktif
                        </span>

                      </div>

                      <p className="recordSubText">
                        Taksit:
                        {" "}
                        {
                          item.installmentText
                        }
                      </p>

                      <p className="recordSubText">
                        Kalan:
                        {" "}
                        {money(
                          item.remainingDebt
                        )}
                      </p>

                    </div>

                    <div className="recordAmount">
                      {money(
                        item.monthlyPayment
                      )}
                    </div>

                  </div>

                  <div className="progressTrack">

                    <div
                      className="progressBar warm"
                      style={{
                        width: `${percent}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </Panel>

      </div>

    </main>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  tone,
}) {
  return (
    <article
      className={`summaryCard ${tone}`}
    >

      <div className="summaryLabel">
        {title}
      </div>

      <div className="summaryValue">
        {value}
      </div>

      <div className="summaryDetail">
        {detail}
      </div>

    </article>
  );
}

function Panel({
  title,
  subtitle,
  total,
  children,
  open,
  onToggle,
}) {
  return (
    <section className="panelCard">

      <button
        className="panelHeader"
        onClick={onToggle}
      >

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panelRight">

          <div className="panelTotal">
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div className="toggleButton">
            {open ? "−" : "+"}
          </div>

        </div>

      </button>

      {open ? (
        <div className="panelBody">
          {children}
        </div>
      ) : null}

    </section>
  );
}

function MiniPanel({
  title,
  total,
  children,
  color,
}) {
  return (
    <section
      className={`miniPanel ${color}`}
    >

      <div className="miniHeader">

        <div>
          <h3>{title}</h3>
        </div>

        <div className="miniRight">

          <div className="miniTotal">
            <span>Total</span>
            <strong>{total}</strong>
          </div>

        </div>

      </div>

      <div className="miniBody">
        {children}
      </div>

    </section>
  );
}

function InputBox({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label className="inputBox">

      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </label>
  );
}

function SimpleList({
  items,
  money,
  onDelete,
}) {
  if (items.length === 0) {
    return (
      <EmptyState text="Henüz kayıt bulunmuyor." />
    );
  }

  return (
    <div className="recordList">

      {items.map((item) => (

        <div
          key={item.id}
          className="simpleRecord"
        >

          <div className="simpleRecordTop">

            <div>

              <h4>{item.title}</h4>

              {item.category ? (
                <p>{item.category}</p>
              ) : null}

              {item.note ? (
                <p>{item.note}</p>
              ) : null}

            </div>

            <div className="simpleRecordRight">

              <strong>
                {money(item.amount)}
              </strong>

              <button
                className="deleteButton"
                onClick={() =>
                  onDelete(item.id)
                }
              >
                Sil
              </button>

            </div>

          </div>

        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="emptyState">

      <strong>{text}</strong>

      <span>
        Yeni kayıtlar burada görünecek.
      </span>

    </div>
  );
}
