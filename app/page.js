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
  paymentStartDate: "",
};

const emptyExpense = {
  title: "",
  category: "",
  amount: "",
  note: "",
};

export default function HomePage() {
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [extraIncomeOpen, setExtraIncomeOpen] = useState(true);

  const [expensesOpen, setExpensesOpen] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(true);
  const [cardsOpen, setCardsOpen] = useState(true);
  const [othersOpen, setOthersOpen] = useState(true);

  const [income, setIncome] = useState(emptyIncome);

  const [extraIncomes, setExtraIncomes] = useState([]);
  const [credits, setCredits] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);

  const [extraIncomeForm, setExtraIncomeForm] =
    useState(emptyExtraIncome);

  const [creditForm, setCreditForm] =
    useState(emptyCredit);

  const [cardForm, setCardForm] =
    useState(emptyExpense);

  const [otherForm, setOtherForm] =
    useState(emptyExpense);

  const [editingExtraIncomeId, setEditingExtraIncomeId] =
    useState(null);

  const [editingCreditId, setEditingCreditId] =
    useState(null);

  const [editingCardId, setEditingCardId] =
    useState(null);

  const [editingOtherId, setEditingOtherId] =
    useState(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        setIncome(data.income || emptyIncome);
        setExtraIncomes(data.extraIncomes || []);
        setCredits(data.credits || []);
        setCardExpenses(data.cardExpenses || []);
        setOtherExpenses(data.otherExpenses || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    window.localStorage.setItem(
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
    loaded,
  ]);

  const money = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const totalDebt = credits.reduce(
    (sum, item) =>
      sum + Number(item.remainingDebt || 0),
    0
  );

  const totals = useMemo(() => {
    const salary = Number(income.salary || 0);

    const mealAllowance = Number(
      income.mealAllowance || 0
    );

    const extraIncomeTotal = extraIncomes.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalIncome =
      salary + extraIncomeTotal;

    const creditTotal = credits.reduce(
      (sum, item) =>
        sum + Number(item.monthlyPayment || 0),
      0
    );

    const cardTotal = cardExpenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const otherTotal = otherExpenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalExpense =
      creditTotal + cardTotal + otherTotal;

    return {
      salary,
      mealAllowance,
      totalIncome,
      totalExpense,
      extraIncomeTotal,
      cardTotal,
      creditTotal,
      otherTotal,
      balance:
        totalIncome - totalExpense,
    };
  }, [
    income,
    extraIncomes,
    credits,
    cardExpenses,
    otherExpenses,
  ]);

  const updateIncome = (field, value) => {
    setIncome((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateExtraIncomeForm = (
    field,
    value
  ) => {
    setExtraIncomeForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCreditForm = (
    field,
    value
  ) => {
    setCreditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCardForm = (
    field,
    value
  ) => {
    setCardForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateOtherForm = (
    field,
    value
  ) => {
    setOtherForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addOrUpdateExtraIncome = () => {
    const title =
      extraIncomeForm.title.trim();

    const amount = Number(
      extraIncomeForm.amount
    );

    if (!title || amount <= 0) return;

    if (editingExtraIncomeId) {
      setExtraIncomes((current) =>
        current.map((item) =>
          item.id === editingExtraIncomeId
            ? {
                ...item,
                title,
                amount,
              }
            : item
        )
      );

      setEditingExtraIncomeId(null);
    } else {
      setExtraIncomes((current) => [
        {
          id: String(Date.now()),
          title,
          amount,
        },
        ...current,
      ]);
    }

    setExtraIncomeForm(emptyExtraIncome);
  };

  const addOrUpdateCredit = () => {
    const title = creditForm.title.trim();

    const monthlyPayment = Number(
      creditForm.monthlyPayment
    );

    if (!title || monthlyPayment <= 0)
      return;

    const item = {
      id:
        editingCreditId ||
        String(Date.now()),
      title,
      monthlyPayment,
      installmentText:
        creditForm.installmentText,
      remainingDebt:
        Number(
          creditForm.remainingDebt || 0
        ),
      paymentStartDate:
        creditForm.paymentStartDate,
    };

    if (editingCreditId) {
      setCredits((current) =>
        current.map((credit) =>
          credit.id === editingCreditId
            ? item
            : credit
        )
      );

      setEditingCreditId(null);
    } else {
      setCredits((current) => [
        item,
        ...current,
      ]);
    }

    setCreditForm(emptyCredit);
  };

  const addSimpleExpense = (type) => {
    const form =
      type === "card"
        ? cardForm
        : otherForm;

    const title = form.title.trim();

    const amount = Number(form.amount);

    if (!title || amount <= 0) return;

    const item = {
      id: String(Date.now()),
      title,
      category: form.category,
      amount,
      note: form.note,
    };

    if (type === "card") {
      setCardExpenses((current) => [
        item,
        ...current,
      ]);

      setCardForm(emptyExpense);
    } else {
      setOtherExpenses((current) => [
        item,
        ...current,
      ]);

      setOtherForm(emptyExpense);
    }
  };

  return (
    <main className="financePage">
      <div className="financeShell">

        <header className="topHeader">
          <div className="topBadge">
            Kişisel Finans Yönetimi
          </div>
        </header>

        <section className="summaryGrid">

          <SummaryCard
            tone="green"
            title="Toplam Gelir"
            value={money(totals.totalIncome)}
            detail={`Yemek parası: ${money(
              totals.mealAllowance
            )} • Gelire dahil değil`}
          />

          <SummaryCard
            tone="red"
            title="Toplam Gider"
            value={money(totals.totalExpense)}
            detail="Kredi + kart + diğer giderler"
          />

          <SummaryCard
            tone="blue"
            title="Aylık Kalan"
            value={money(totals.balance)}
            detail="Gelir - gider hesabı"
          />

          <SummaryCard
            tone="purple"
            title="Toplam Borç"
            value={money(totalDebt)}
            detail="Kalan toplam kredi borcu"
          />

        </section>

        <Panel
          title="Gelirler"
          subtitle="Maaş ve ek gelir yönetimi"
          total={money(totals.totalIncome)}
          open={incomeOpen}
          onToggle={() =>
            setIncomeOpen((prev) => !prev)
          }
        >

          <div className="formGrid two">

            <InputBox
              label="Maaş"
              type="number"
              value={income.salary}
              onChange={(value) =>
                updateIncome("salary", value)
              }
            />

            <InputBox
              label="Yemek Parası"
              type="number"
              value={income.mealAllowance}
              onChange={(value) =>
                updateIncome(
                  "mealAllowance",
                  value
                )
              }
            />

          </div>

          <MiniPanel
            title="Ek Gelirler"
            total={money(
              totals.extraIncomeTotal
            )}
            open={extraIncomeOpen}
            onToggle={() =>
              setExtraIncomeOpen(
                (prev) => !prev
              )
            }
            color="mint"
          >

            <div className="formGrid three">

              <InputBox
                label="Gelir Adı"
                value={extraIncomeForm.title}
                onChange={(value) =>
                  updateExtraIncomeForm(
                    "title",
                    value
                  )
                }
              />

              <InputBox
                label="Tutar"
                type="number"
                value={extraIncomeForm.amount}
                onChange={(value) =>
                  updateExtraIncomeForm(
                    "amount",
                    value
                  )
                }
              />

              <button
                className="premiumButton"
                onClick={
                  addOrUpdateExtraIncome
                }
              >
                Gelir Ekle
              </button>

            </div>

          </MiniPanel>

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
  open,
  onToggle,
  children,
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
  open,
  onToggle,
  color,
  children,
}) {
  return (
    <section
      className={`miniPanel ${color}`}
    >

      <button
        className="miniHeader"
        onClick={onToggle}
      >

        <div>
          <h3>{title}</h3>
        </div>

        <div className="miniRight">

          <div className="miniTotal">
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          <div className="miniToggle">
            {open ? "−" : "+"}
          </div>

        </div>

      </button>

      {open ? (
        <div className="miniBody">
          {children}
        </div>
      ) : null}

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
