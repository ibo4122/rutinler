"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisconst emptyIncomeForm = {const STORAGE_KEY = "kisisel-panel-finans-v3";
  salary: "",
  extraIncome: "",
  mealAllowance: "",
};

const emptyCreditForm = {
  title: "",
  monthlyPayment: "",
  totalInstallments: "",
  currentInstallment: "",
  remainingDebt: "",
  paymentStartDate: "",
  note: "",
};

const emptySimpleExpenseForm = {
  title: "",
  category: "",
  amount: "",
  note: "",
};

export default function HomePage() {
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(true);

  const [income, setIncome] = useState(emptyIncomeForm);
  const [credits, setCredits] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [others, setOthers] = useState([]);

  const [creditForm, setCreditForm] = useState(emptyCreditForm);
  const [creditCardForm, setCreditCardForm] = useState(emptySimpleExpenseForm);
  const [otherForm, setOtherForm] = useState(emptySimpleExpenseForm);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        setIncome(parsed.income || emptyIncomeForm);
        setCredits(parsed.credits || []);
        setCreditCards(parsed.creditCards || []);
        setOthers(parsed.others || []);
      }
    } catch {
      setIncome(emptyIncomeForm);
      setCredits([]);
      setCreditCards([]);
      setOthers([]);
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
        credits,
        creditCards,
        others,
      })
    );
  }, [income, credits, creditCards, others, loaded]);

  const isCreditActive = (paymentStartDate) => {
    if (!paymentStartDate) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(paymentStartDate);
    startDate.setHours(0, 0, 0, 0);

    return startDate <= today;
  };

  const totals = useMemo(() => {
    const totalIncome =
      Number(income.salary || 0) +
      Number(income.extraIncome || 0) +
      Number(income.mealAllowance || 0);

    const totalCreditPayment = credits.reduce((sum, item) => {
      if (!isCreditActive(item.paymentStartDate)) return sum;
      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const deferredCreditPayment = credits.reduce((sum, item) => {
      if (isCreditActive(item.paymentStartDate)) return sum;
      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const totalCreditCardPayment = creditCards.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalOtherPayment = others.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalExpense =
      totalCreditPayment + totalCreditCardPayment + totalOtherPayment;

    return {
      totalIncome,
      totalCreditPayment,
      deferredCreditPayment,
      totalCreditCardPayment,
      totalOtherPayment,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [income, credits, creditCards, others]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const updateIncome = (field, value) => {
    setIncome((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCreditForm = (field, value) => {
    setCreditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCreditCardForm = (field, value) => {
    setCreditCardForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateOtherForm = (field, value) => {
    setOtherForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addCredit = () => {
    const title = creditForm.title.trim();
    const monthlyPayment = Number(creditForm.monthlyPayment);

    if (!title || !monthlyPayment || monthlyPayment <= 0) {
      alert("Lütfen kredi adı ve geçerli taksit tutarı gir.");
      return;
    }

    const newCredit = {
      id: Date.now().toString(),
      title,
      monthlyPayment,
      totalInstallments: Number(creditForm.totalInstallments || 0),
      currentInstallment: Number(creditForm.currentInstallment || 0),
      remainingDebt: Number(creditForm.remainingDebt || 0),
      paymentStartDate: creditForm.paymentStartDate || "",
      note: creditForm.note.trim(),
    };

    setCredits((current) => [newCredit, ...current]);
    setCreditForm(emptyCreditForm);
  };

  const addCreditCardExpense = () => {
    const title = creditCardForm.title.trim();
    const amount = Number(creditCardForm.amount);

    if (!title || !amount || amount <= 0) {
      alert("Lütfen kredi kartı gider adı ve geçerli tutar gir.");
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      title,
      category: creditCardForm.category.trim() || "Kredi Kartı",
      amount,
      note: creditCardForm.note.trim(),
    };

    setCreditCards((current) => [newItem, ...current]);
    setCreditCardForm(emptySimpleExpenseForm);
  };

  const addOtherExpense = () => {
    const title = otherForm.title.trim();
    const amount = Number(otherForm.amount);

    if (!title || !amount || amount <= 0) {
      alert("Lütfen diğer gider adı ve geçerli tutar gir.");
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      title,
      category: otherForm.category.trim() || "Diğer",
      amount,
      note: otherForm.note.trim(),
    };

    setOthers((current) => [newItem, ...current]);
    setOtherForm(emptySimpleExpenseForm);
  };

  return (
    <main className="finance-page">
      <div className="finance-container">
        <section className="hero-card">
          <div className="hero-badge">Kişisel Finans Yönetimi</div>

          <h1>Gelir ve giderlerini profesyonel şekilde yönet.</h1>

          <p>
            Kredilerini, kredi kartı giderlerini, nakit harcamalarını ve gelirlerini
            tek panelde takip et. Ertelenmiş krediler ödeme tarihi gelince otomatik
            olarak aylık giderlere dahil edilir.
          </p>
        </section>

        <section className="summary-grid">
          <SummaryCard
            title="Toplam Gelir"
            value={formatMoney(totals.totalIncome)}
            detail="Maaş + ek gelir + yemek parası"
            type="income"
          />
          <SummaryCard
            title="Toplam Gider"
            value={formatMoney(totals.totalExpense)}
            detail="Aktif kredi + kart + diğer giderler"
            type="expense"
          />
          <SummaryCard
            title="Aylık Kalan"
            value={formatMoney(totals.balance)}
            detail="Gelirlerden giderler düşülür"
            type="balance"
          />
          <SummaryCard
            title="Ertelenen Kredi"
            value={formatMoney(totals.deferredCreditPayment)}
            detail="Ödeme tarihi gelince gidere eklenir"
            type="deferred"
          />
        </section>

        <Panel
          title="Gelirler"
          subtitle="Maaş, ek gelir ve yemek parası bilgilerini buradan yönetebilirsin."
          totalLabel="Toplam Gelir"
          totalValue={formatMoney(totals.totalIncome)}
          open={incomeOpen}
          onToggle={() => setIncomeOpen((current) => !current)}
          color="green"
        >
          <div className="form-grid three">
            <InputBox
              label="Maaş"
              type="number"
              value={income.salary}
              placeholder="0"
              onChange={(value) => updateIncome("salary", value)}
            />
            <InputBox
              label="Ek Gelir"
              type="number"
              value={income.extraIncome}
              placeholder="0"
              onChange={(value) => updateIncome("extraIncome", value)}
            />
            <InputBox
              label="Yemek Parası"
              type="number"
              value={income.mealAllowance}
              placeholder="0"
              onChange={(value) => updateIncome("mealAllowance", value)}
            />
          </div>
        </Panel>

        <Panel
          title="Giderler"
          subtitle="Kredi, kredi kartı ve diğer nakit giderlerini ayrı başlıklarda takip edebilirsin."
          totalLabel="Toplam Gider"
          totalValue={formatMoney(totals.totalExpense)}
          open={expensesOpen}
          onToggle={() => setExpensesOpen((current) => !current)}
          color="blue"
        >
          <ExpenseSection
            title="Krediler"
            description="Taksitli krediler burada tutulur. Ödeme başlangıç tarihi gelmeyen krediler toplam gidere eklenmez."
            totalLabel="Total kredi ödemesi"
            totalValue={formatMoney(totals.totalCreditPayment)}
            color="purple"
          >
            <div className="form-grid four">
              <InputBox
                label="Kredi Adı"
                value={creditForm.title}
                placeholder="Örn: Garanti Kredi"
                onChange={(value) => updateCreditForm("title", value)}
              />
              <InputBox
                label="Taksit Tutarı"
                type="number"
                value={creditForm.monthlyPayment}
                placeholder="0"
                onChange={(value) => updateCreditForm("monthlyPayment", value)}
              />
              <InputBox
                label="Toplam Taksit"
                type="number"
                value={creditForm.totalInstallments}
                placeholder="0"
                onChange={(value) => updateCreditForm("totalInstallments", value)}
              />
              <InputBox
                label="Kaçıncı Taksit"
                type="number"
                value={creditForm.currentInstallment}
                placeholder="0"
                onChange={(value) => updateCreditForm("currentInstallment", value)}
              />
              <InputBox
                label="Kalan Borç"
                type="number"
                value={creditForm.remainingDebt}
                placeholder="0"
                onChange={(value) => updateCreditForm("remainingDebt", value)}
              />
              <InputBox
                label="Ödeme Başlangıç Tarihi"
                type="date"
                value={creditForm.paymentStartDate}
                onChange={(value) => updateCreditForm("paymentStartDate", value)}
              />
              <InputBox
                label="Not"
                value={creditForm.note}
                placeholder="Opsiyonel"
                onChange={(value) => updateCreditForm("note", value)}
              />
              <button type="button" className="premium-button" onClick={addCredit}>
                Kredi Ekle
              </button>
            </div>

            <CreditList
              items={credits}
              formatMoney={formatMoney}
              isCreditActive={isCreditActive}
              onDelete={(id) =>
                setCredits((current) => current.filter((item) => item.id !== id))
              }
            />
          </ExpenseSection>

          <ExpenseSection
            title="Kredi Kartı Giderleri"
            description="Kredi kartı harcamaları veya ekstre tutarları için kullanılır. Bu alanda tarih tutulmaz."
            totalLabel="Total kredi kartı ödemesi"
            totalValue={formatMoney(totals.totalCreditCardPayment)}
            color="red"
          >
            <SimpleExpenseForm
              form={creditCardForm}
              onChange={updateCreditCardForm}
              onAdd={addCreditCardExpense}
              buttonText="Kart Gideri Ekle"
            />

            <SimpleList
              items={creditCards}
              formatMoney={formatMoney}
              onDelete={(id) =>
                setCreditCards((current) =>
                  current.filter((item) => item.id !== id)
                )
              }
            />
          </ExpenseSection>

          <ExpenseSection
            title="Diğer Nakit Giderler"
            description="Nakit, havale veya kart dışı harcamalarını buradan takip edebilirsin."
            totalLabel="Total diğer ödemeler"
            totalValue={formatMoney(totals.totalOtherPayment)}
            color="orange"
          >
            <SimpleExpenseForm
              form={otherForm}
              onChange={updateOtherForm}
              onAdd={addOtherExpense}
              buttonText="Diğer Gider Ekle"
            />

            <SimpleList
              items={others}
              formatMoney={formatMoney}
              onDelete={(id) =>
                setOthers((current) => current.filter((item) => item.id !== id))
              }
            />
          </ExpenseSection>
        </Panel>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, detail, type }) {
  return (
    <article className={`summary-card ${type}`}>
      <div className="summary-label">{title}</div>
      <div className="summary-value">{value}</div>
      <div className="summary-detail">{detail}</div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  totalLabel,
  totalValue,
  open,
  onToggle,
  color,
  children,
}) {
  return (
    <section className={`panel-card ${color}`}>
      <button type="button" className="panel-header" onClick={onToggle}>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panel-actions">
          <div className="panel-total">
            <span>{totalLabel}</span>
            <strong>{totalValue}</strong>
          </div>
          <div className="toggle-button">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}

function ExpenseSection({
  title,
  description,
  totalLabel,
  totalValue,
  color,
  children,
}) {
  return (
    <section className={`expense-section ${color}`}>
      <div className="section-top">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <div className="section-total">
          <span>{totalLabel}</span>
          <strong>{totalValue}</strong>
        </div>
      </div>

      <div className="section-content">{children}</div>
    </section>
  );
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="input-box">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SimpleExpenseForm({ form, onChange, onAdd, buttonText }) {
  return (
    <div className="form-grid four">
      <InputBox
        label="Gider Adı"
        value={form.title}
        placeholder="Örn: Market"
        onChange={(value) => onChange("title", value)}
      />
      <InputBox
        label="Kategori"
        value={form.category}
        placeholder="Örn: Alışveriş"
        onChange={(value) => onChange("category", value)}
      />
      <InputBox
        label="Tutar"
        type="number"
        value={form.amount}
        placeholder="0"
        onChange={(value) => onChange("amount", value)}
      />
      <InputBox
        label="Not"
        value={form.note}
        placeholder="Opsiyonel"
        onChange={(value) => onChange("note", value)}
      />

      <button type="button" className="premium-button wide" onClick={onAdd}>
        {buttonText}
      </button>
    </div>
  );
}

function CreditList({ items, formatMoney, isCreditActive, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kredi kaydı bulunmuyor." />;
  }

  return (
    <div className="record-list">
      {items.map((item) => {
        const active = isCreditActive(item.paymentStartDate);

        return (
          <div key={item.id} className="record-card">
            <div className="record-main">
              <div className="record-title-row">
                <h4>{item.title}</h4>
                <span className={active ? "status active" : "status waiting"}>
                  {active ? "Aktif gider" : "Ödeme tarihi bekleniyor"}
                </span>
              </div>

              <div className="credit-info-grid">
                <InfoBox label="Taksit Tutarı" value={formatMoney(item.monthlyPayment)} />
                <InfoBox
                  label="Taksit Durumu"
                  value={`${item.currentInstallment || 0} / ${
                    item.totalInstallments || 0
                  }`}
                />
                <InfoBox label="Kalan Borç" value={formatMoney(item.remainingDebt)} />
                <InfoBox
                  label="Başlangıç"
                  value={item.paymentStartDate || "Hemen aktif"}
                />
              </div>

              {item.note ? <p className="record-note">{item.note}</p> : null}
            </div>

            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(item.id)}
            >
              Sil
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SimpleList({ items, formatMoney, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kayıt bulunmuyor." />;
  }

  return (
    <div className="record-list">
      {items.map((item) => (
        <div key={item.id} className="record-card simple">
          <div>
            <h4>{item.title}</h4>
            <p>
              {item.category}
              {item.note ? ` • ${item.note}` : ""}
            </p>
          </div>

          <div className="record-side">
            <strong>{formatMoney(item.amount)}</strong>
            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(item.id)}
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <strong>{text}</strong>
      <span>Yeni kayıt eklediğinde bu alanda görünecek.</span>
    </div>
  );
}


