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
      mealAllowance,
      totalExpense,
      totalDebt,
      balance:
        totalIncome - totalExpense,
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
            value={money(
              totals.totalIncome
            )}
            detail={`Yemek parası: ${money(
              totals.mealAllowance
            )} • Gelire dahil değil`}
          />

          <SummaryCard
            tone="red"
            title="Toplam Gider"
            value={money(
              totals.totalExpense
            )}
            detail="Aylık toplam gider"
          />

          <SummaryCard
            tone="blue"
            title="Aylık Kalan"
            value={money(
              totals.balance
            )}
            detail="Gelir - gider farkı"
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

            <SimpleExpenseList
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
          subtitle="Kredi yönetimi"
          total={money(
            totals.creditTotal
          )}
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

          <CreditList
            items={credits}
            money={money}
            onDelete={(id) =>
              setCredits((prev) =>
                prev.filter(
                  (item) =>
                    item.id !== id
                )
              )
            }
          />

        </Panel>

        <Panel
          title="Kredi Kartı Giderleri"
          subtitle="Kart harcamaları"
          total={money(
            totals.cardTotal
          )}
        >

          <div className="formGrid four">

            <InputBox
              label="Başlık"
              value={cardForm.title}
              onChange={(value) =>
                setCardForm((prev) => ({
                  ...prev,
                  title: value,
                }))
              }
            />

            <InputBox
              label="Kategori"
              value={
                cardForm.category
              }
              onChange={(value) =>
                setCardForm((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
            />

            <InputBox
              label="Tutar"
              type="number"
              value={cardForm.amount}
              onChange={(value) =>
                setCardForm((prev) => ({
                  ...prev,
                  amount: value,
                }))
              }
            />

            <InputBox
              label="Not"
              value={cardForm.note}
              onChange={(value) =>
                setCardForm((prev) => ({
                  ...prev,
                  note: value,
                }))
              }
            />

          </div>

          <button
            className="premiumButton wideButton"
            onClick={
              addCardExpense
            }
          >
            Kart Gideri Ekle
          </button>

          <SimpleExpenseList
            items={cardExpenses}
            money={money}
            onDelete={(id) =>
              setCardExpenses(
                (prev) =>
                  prev.filter(
                    (item) =>
                      item.id !== id
                  )
              )
            }
          />

        </Panel>

        <Panel
          title="Diğer Giderler"
          subtitle="Nakit ve diğer giderler"
          total={money(
            totals.otherTotal
          )}
        >

          <div className="formGrid four">

            <InputBox
              label="Başlık"
              value={otherForm.title}
              onChange={(value) =>
                setOtherForm((prev) => ({
                  ...prev,
                  title: value,
                }))
              }
            />

            <InputBox
              label="Kategori"
              value={
                otherForm.category
              }
              onChange={(value) =>
                setOtherForm((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
            />

            <InputBox
              label="Tutar"
              type="number"
              value={otherForm.amount}
              onChange={(value) =>
                setOtherForm((prev) => ({
                  ...prev,
                  amount: value,
                }))
              }
            />

            <InputBox
              label="Not"
              value={otherForm.note}
              onChange={(value) =>
                setOtherForm((prev) => ({
                  ...prev,
                  note: value,
                }))
              }
            />

          </div>

          <button
            className="premiumButton wideButton"
            onClick={
              addOtherExpense
            }
          >
            Diğer Gider Ekle
          </button>

          <SimpleExpenseList
            items={otherExpenses}
            money={money}
            onDelete={(id) =>
              setOtherExpenses(
                (prev) =>
                  prev.filter(
                    (item) =>
                      item.id !== id
                  )
              )
            }
          />

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
}) {
  return (
    <section className="panelCard">

      <div className="panelHeader">

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panelRight">

          <div className="panelTotal">
            <span>Total</span>
            <strong>{total}</strong>
          </div>

        </div>

      </div>

      <div className="panelBody">
        {children}
      </div>

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

function CreditList({
  items,
  money,
  onDelete,
}) {
  if (items.length === 0) {
    return (
      <EmptyState text="Henüz kredi bulunmuyor." />
    );
  }

  return (
    <div className="recordList">

      {items.map((item) => (

        <div
          key={item.id}
          className="creditRecord"
        >

          <div className="creditRecordTop">

            <div>

              <div className="recordTitleRow">

                <h4>{item.title}</h4>

                <span className="status waiting">
                  Aktif
                </span>

              </div>

              <p className="recordSubText">
                Taksit:
                {" "}
                {item.installmentText}
              </p>

              <p className="recordSubText">
                Kalan borç:
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

          <div className="recordFooter">

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
      ))}
    </div>
  );
}

function SimpleExpenseList({
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

              <p>
                {item.category}
              </p>

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
