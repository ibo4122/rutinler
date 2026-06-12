"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisel-panel-finans-clean-v1";

const emptyIncome = {
  salary: "",
  extraIncome: "",
  mealAllowance: "",
};

const emptyCredit = {
  title: "",
  monthlyPayment: "",
  totalInstallments: "",
  currentInstallment: "",
  remainingDebt: "",
  paymentStartDate: "",
  note: "",
};

const emptyExpense = {
  title: "",
  category: "",
  amount: "",
  note: "",
};

export default function HomePage() {
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(true);
  const [income, setIncome] = useState(emptyIncome);
  const [credits, setCredits] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [creditForm, setCreditForm] = useState(emptyCredit);
  const [cardForm, setCardForm] = useState(emptyExpense);
  const [otherForm, setOtherForm] = useState(emptyExpense);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setIncome(data.income || emptyIncome);
        setCredits(data.credits || []);
        setCardExpenses(data.cardExpenses || []);
        setOtherExpenses(data.otherExpenses || []);
      }
    } catch {
      setIncome(emptyIncome);
      setCredits([]);
      setCardExpenses([]);
      setOtherExpenses([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ income, credits, cardExpenses, otherExpenses })
    );
  }, [income, credits, cardExpenses, otherExpenses, loaded]);

  const isCreditActive = (dateText) => {
    if (!dateText) return true;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(dateText);
    start.setHours(0, 0, 0, 0);
    return start <= now;
  };

  const totals = useMemo(() => {
    const totalIncome =
      Number(income.salary || 0) +
      Number(income.extraIncome || 0) +
      Number(income.mealAllowance || 0);

    const activeCreditTotal = credits.reduce((sum, item) => {
      return isCreditActive(item.paymentStartDate)
        ? sum + Number(item.monthlyPayment || 0)
        : sum;
    }, 0);

    const deferredCreditTotal = credits.reduce((sum, item) => {
      return isCreditActive(item.paymentStartDate)
        ? sum
        : sum + Number(item.monthlyPayment || 0);
    }, 0);

    const cardTotal = cardExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const otherTotal = otherExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const expenseTotal = activeCreditTotal + cardTotal + otherTotal;

    return {
      totalIncome,
      activeCreditTotal,
      deferredCreditTotal,
      cardTotal,
      otherTotal,
      expenseTotal,
      balance: totalIncome - expenseTotal,
    };
  }, [income, credits, cardExpenses, otherExpenses]);

  const money = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const updateIncome = (field, value) => {
    setIncome((current) => ({ ...current, [field]: value }));
  };

  const updateCredit = (field, value) => {
    setCreditForm((current) => ({ ...current, [field]: value }));
  };

  const updateCard = (field, value) => {
    setCardForm((current) => ({ ...current, [field]: value }));
  };

  const updateOther = (field, value) => {
    setOtherForm((current) => ({ ...current, [field]: value }));
  };

  const addCredit = () => {
    const title = creditForm.title.trim();
    const monthlyPayment = Number(creditForm.monthlyPayment);
    if (!title || monthlyPayment <= 0) {
      alert("Kredi adÄ± ve geÃ§erli taksit tutarÄ± gir.");
      return;
    }
    setCredits((current) => [
      {
        id: String(Date.now()),
        title,
        monthlyPayment,
        totalInstallments: Number(creditForm.totalInstallments || 0),
        currentInstallment: Number(creditForm.currentInstallment || 0),
        remainingDebt: Number(creditForm.remainingDebt || 0),
        paymentStartDate: creditForm.paymentStartDate,
        note: creditForm.note.trim(),
      },
      ...current,
    ]);
    setCreditForm(emptyCredit);
  };

  const addSimpleExpense = (type) => {
    const form = type === "card" ? cardForm : otherForm;
    const title = form.title.trim();
    const amount = Number(form.amount);
    if (!title || amount <= 0) {
      alert("Gider adÄ± ve geÃ§erli tutar gir.");
      return;
    }
    const item = {
      id: String(Date.now()),
      title,
      category: form.category.trim() || (type === "card" ? "Kredi KartÄ±" : "DiÄŸer"),
      amount,
      note: form.note.trim(),
    };
    if (type === "card") {
      setCardExpenses((current) => [item, ...current]);
      setCardForm(emptyExpense);
    } else {
      setOtherExpenses((current) => [item, ...current]);
      setOtherForm(emptyExpense);
    }
  };

  return (
    <main className="financePage">
      <div className="financeShell">
        <section className="heroCard">
          <div className="heroBadge">KiÅŸisel Finans YÃ¶netimi</div>
          <h1>Gelir ve giderlerini profesyonel ÅŸekilde yÃ¶net.</h1>
          <p>
            Kredilerini, kredi kartÄ± giderlerini, nakit harcamalarÄ±nÄ± ve gelirlerini
            tek panelde takip et. ErtelenmiÅŸ krediler Ã¶deme tarihi gelince otomatik
            olarak aylÄ±k giderlere dahil edilir.
          </p>
        </section>

        <section className="summaryGrid">
          <SummaryCard tone="green" title="Toplam Gelir" value={money(totals.totalIncome)} detail="MaaÅŸ + ek gelir + yemek parasÄ±" />
          <SummaryCard tone="red" title="Toplam Gider" value={money(totals.expenseTotal)} detail="Aktif kredi + kart + diÄŸer giderler" />
          <SummaryCard tone="blue" title="AylÄ±k Kalan" value={money(totals.balance)} detail="Gelirlerden giderler dÃ¼ÅŸÃ¼lÃ¼r" />
          <SummaryCard tone="purple" title="Ertelenen Kredi" value={money(totals.deferredCreditTotal)} detail="Ã–deme tarihi gelince giderlere eklenir" />
        </section>

        <Panel
          color="green"
          open={incomeOpen}
          onToggle={() => setIncomeOpen((current) => !current)}
          title="Gelirler"
          subtitle="MaaÅŸ, ek gelir ve yemek parasÄ± bilgilerini buradan yÃ¶netebilirsin."
          totalLabel="Toplam Gelir"
          totalValue={money(totals.totalIncome)}
        >
          <div className="formGrid three">
            <InputBox label="MaaÅŸ" type="number" value={income.salary} onChange={(value) => updateIncome("salary", value)} />
            <InputBox label="Ek Gelir" type="number" value={income.extraIncome} onChange={(value) => updateIncome("extraIncome", value)} />
            <InputBox label="Yemek ParasÄ±" type="number" value={income.mealAllowance} onChange={(value) => updateIncome("mealAllowance", value)} />
          </div>
        </Panel>

        <Panel
          color="blue"
          open={expenseOpen}
          onToggle={() => setExpenseOpen((current) => !current)}
          title="Giderler"
          subtitle="Kredi, kredi kartÄ± ve diÄŸer nakit giderlerini ayrÄ± baÅŸlÄ±klarda takip edebilirsin."
          totalLabel="Toplam Gider"
          totalValue={money(totals.expenseTotal)}
        >
          <ExpenseSection color="purple" title="Krediler" totalLabel="Total kredi Ã¶demesi" totalValue={money(totals.activeCreditTotal)} description="Taksitli krediler burada tutulur. Ã–deme baÅŸlangÄ±Ã§ tarihi gelmeyen krediler toplam gidere eklenmez.">
            <div className="formGrid four">
              <InputBox label="Kredi AdÄ±" value={creditForm.title} onChange={(value) => updateCredit("title", value)} />
              <InputBox label="Taksit TutarÄ±" type="number" value={creditForm.monthlyPayment} onChange={(value) => updateCredit("monthlyPayment", value)} />
              <InputBox label="Toplam Taksit" type="number" value={creditForm.totalInstallments} onChange={(value) => updateCredit("totalInstallments", value)} />
              <InputBox label="KaÃ§Ä±ncÄ± Taksit" type="number" value={creditForm.currentInstallment} onChange={(value) => updateCredit("currentInstallment", value)} />
              <InputBox label="Kalan BorÃ§" type="number" value={creditForm.remainingDebt} onChange={(value) => updateCredit("remainingDebt", value)} />
              <InputBox label="Ã–deme BaÅŸlangÄ±Ã§ Tarihi" type="date" value={creditForm.paymentStartDate} onChange={(value) => updateCredit("paymentStartDate", value)} />
              <InputBox label="Not" value={creditForm.note} onChange={(value) => updateCredit("note", value)} />
              <button type="button" className="premiumButton" onClick={addCredit}>Kredi Ekle</button>
            </div>
            <CreditList items={credits} money={money} isCreditActive={isCreditActive} onDelete={(id) => setCredits((current) => current.filter((item) => item.id !== id))} />
          </ExpenseSection>

          <ExpenseSection color="red" title="Kredi KartÄ± Giderleri" totalLabel="Total kredi kartÄ± Ã¶demesi" totalValue={money(totals.cardTotal)} description="Kredi kartÄ± harcamalarÄ± veya ekstre tutarlarÄ± iÃ§in kullanÄ±lÄ±r. Bu alanda tarih tutulmaz.">
            <SimpleExpenseForm form={cardForm} onChange={updateCard} onAdd={() => addSimpleExpense("card")} buttonText="Kart Gideri Ekle" />
            <SimpleList items={cardExpenses} money={money} onDelete={(id) => setCardExpenses((current) => current.filter((item) => item.id !== id))} />
          </ExpenseSection>

          <ExpenseSection color="orange" title="DiÄŸer Nakit Giderler" totalLabel="Total diÄŸer Ã¶demeler" totalValue={money(totals.otherTotal)} description="Nakit, havale veya kart dÄ±ÅŸÄ± harcamalarÄ±nÄ± buradan takip edebilirsin.">
            <SimpleExpenseForm form={otherForm} onChange={updateOther} onAdd={() => addSimpleExpense("other")} buttonText="DiÄŸer Gider Ekle" />
            <SimpleList items={otherExpenses} money={money} onDelete={(id) => setOtherExpenses((current) => current.filter((item) => item.id !== id))} />
          </ExpenseSection>
        </Panel>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  return (
    <article className={`summaryCard ${tone}`}>
      <div className="summaryLabel">{title}</div>
      <div className="summaryValue">{value}</div>
      <div className="summaryDetail">{detail}</div>
    </article>
  );
}

function Panel({ title, subtitle, totalLabel, totalValue, open, onToggle, color, children }) {
  return (
    <section className={`panelCard ${color}`}>
      <button type="button" className="panelHeader" onClick={onToggle}>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="panelActions">
          <div className="panelTotal"><span>{totalLabel}</span><strong>{totalValue}</strong></div>
          <div className="toggleButton">{open ? "âˆ’" : "+"}</div>
        </div>
      </button>
      {open ? <div className="panelBody">{children}</div> : null}
    </section>
  );
}

function ExpenseSection({ title, description, totalLabel, totalValue, color, children }) {
  return (
    <section className={`expenseSection ${color}`}>
      <div className="sectionTop">
        <div><h3>{title}</h3><p>{description}</p></div>
        <div className="sectionTotal"><span>{totalLabel}</span><strong>{totalValue}</strong></div>
      </div>
      <div className="sectionContent">{children}</div>
    </section>
  );
}

function InputBox({ label, value, onChange, type = "text" }) {
  return (
    <label className="inputBox">
      <span>{label}</span>
      <input type={type} value={value} placeholder="0" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SimpleExpenseForm({ form, onChange, onAdd, buttonText }) {
  return (
    <div className="formGrid four">
      <InputBox label="Gider AdÄ±" value={form.title} onChange={(value) => onChange("title", value)} />
      <InputBox label="Kategori" value={form.category} onChange={(value) => onChange("category", value)} />
      <InputBox label="Tutar" type="number" value={form.amount} onChange={(value) => onChange("amount", value)} />
      <InputBox label="Not" value={form.note} onChange={(value) => onChange("note", value)} />
      <button type="button" className="premiumButton wide" onClick={onAdd}>{buttonText}</button>
    </div>
  );
}

function CreditList({ items, money, isCreditActive, onDelete }) {
  if (items.length === 0) return <EmptyState text="HenÃ¼z kredi kaydÄ± bulunmuyor." />;
  return (
    <div className="recordList">
      {items.map((item) => {
        const active = isCreditActive(item.paymentStartDate);
        return (
          <div key={item.id} className="recordCard">
            <div className="recordMain">
              <div className="recordTitleRow"><h4>{item.title}</h4><span className={active ? "status active" : "status waiting"}>{active ? "Aktif gider" : "Ã–deme tarihi bekleniyor"}</span></div>
              <div className="creditInfoGrid">
                <InfoBox label="Taksit TutarÄ±" value={money(item.monthlyPayment)} />
                <InfoBox label="Taksit Durumu" value={`${item.currentInstallment || 0} / ${item.totalInstallments || 0}`} />
                <InfoBox label="Kalan BorÃ§" value={money(item.remainingDebt)} />
                <InfoBox label="BaÅŸlangÄ±Ã§" value={item.paymentStartDate || "Hemen aktif"} />
              </div>
              {item.note ? <p className="recordNote">{item.note}</p> : null}
            </div>
            <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>Sil</button>
          </div>
        );
      })}
    </div>
  );
}

function SimpleList({ items, money, onDelete }) {
  if (items.length === 0) return <EmptyState text="HenÃ¼z kayÄ±t bulunmuyor." />;
  return (
    <div className="recordList">
      {items.map((item) => (
        <div key={item.id} className="recordCard simple">
          <div><h4>{item.title}</h4><p>{item.category}{item.note ? ` â€¢ ${item.note}` : ""}</p></div>
          <div className="recordSide"><strong>{money(item.amount)}</strong><button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>Sil</button></div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ label, value }) {
  return <div className="infoBox"><span>{label}</span><strong>{value}</strong></div>;
}

function EmptyState({ text }) {
  return <div className="emptyState"><strong>{text}</strong><span>Yeni kayÄ±t eklediÄŸinde bu alanda gÃ¶rÃ¼necek.</span></div>;
}
