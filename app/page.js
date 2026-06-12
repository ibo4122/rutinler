"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisel-panel-finans-v2";

const emptyIncomeForm = {
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

    const payload = {
      income,
      credits,
      creditCards,
      others,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [income, credits, creditCards, others, loaded]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCreditPaymentActive = (paymentStartDate) => {
    if (!paymentStartDate) return true;

    const startDate = new Date(paymentStartDate);
    startDate.setHours(0, 0, 0, 0);

    return startDate <= today;
  };

  const totals = useMemo(() => {
    const totalIncome =
      Number(income.salary || 0) +
      Number(income.extraIncome || 0) +
      Number(income.mealAllowance || 0);

    const totalCreditPayment = credits.reduce((total, item) => {
      if (!isCreditPaymentActive(item.paymentStartDate)) return total;
      return total + Number(item.monthlyPayment || 0);
    }, 0);

    const futureCreditPayment = credits.reduce((total, item) => {
      if (isCreditPaymentActive(item.paymentStartDate)) return total;
      return total + Number(item.monthlyPayment || 0);
    }, 0);

    const totalCreditCardPayment = creditCards.reduce((total, item) => {
      return total + Number(item.amount || 0);
    }, 0);

    const totalOtherPayment = others.reduce((total, item) => {
      return total + Number(item.amount || 0);
    }, 0);

    const totalExpense =
      totalCreditPayment + totalCreditCardPayment + totalOtherPayment;

    return {
      totalIncome,
      totalCreditPayment,
      futureCreditPayment,
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

  const saveIncome = () => {
    alert("Gelir bilgileri kaydedildi.");
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

  const deleteCredit = (id) => {
    setCredits((current) => current.filter((item) => item.id !== id));
  };

  const deleteCreditCard = (id) => {
    setCreditCards((current) => current.filter((item) => item.id !== id));
  };

  const deleteOther = (id) => {
    setOthers((current) => current.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen overflow-x-hidden p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100">
            Kişisel Finans Yönetimi
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            Gelir ve giderlerini tek panelden yönet.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Bu panelde gelirlerini, kredi ödemelerini, kredi kartı giderlerini ve
            nakit harcamalarını ayrı başlıklar altında takip edebilirsin.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Toplam Gelir"
            value={formatMoney(totals.totalIncome)}
            detail="Maaş, ek gelir ve yemek parası"
            tone="green"
          />

          <SummaryCard
            title="Toplam Gider"
            value={formatMoney(totals.totalExpense)}
            detail="Aktif kredi + kart + diğer giderler"
            tone="red"
          />

          <SummaryCard
            title="Aylık Kalan"
            value={formatMoney(totals.balance)}
            detail="Gelirlerden giderler düşülür"
            tone="blue"
          />

          <SummaryCard
            title="Ertelenen Kredi"
            value={formatMoney(totals.futureCreditPayment)}
            detail="Ödeme tarihi gelince gidere eklenir"
            tone="purple"
          />
        </section>

        <section className="mt-6">
          <PanelShell
            title="Gelirler"
            subtitle="Maaş, ek gelir ve yemek parası bilgilerini buradan yönetebilirsin."
            open={incomeOpen}
            onToggle={() => setIncomeOpen((current) => !current)}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <InputBox
                label="Maaş"
                type="number"
                placeholder="0"
                value={income.salary}
                onChange={(value) => updateIncome("salary", value)}
              />

              <InputBox
                label="Ek Gelir"
                type="number"
                placeholder="0"
                value={income.extraIncome}
                onChange={(value) => updateIncome("extraIncome", value)}
              />

              <InputBox
                label="Yemek Parası"
                type="number"
                placeholder="0"
                value={income.mealAllowance}
                onChange={(value) => updateIncome("mealAllowance", value)}
              />
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-4 md:flex-row md:items-center">
              <div>
                <div className="text-sm font-bold text-emerald-100">
                  Toplam Gelir
                </div>
                <div className="mt-1 text-2xl font-black text-white">
                  {formatMoney(totals.totalIncome)}
                </div>
              </div>

              <button
                type="button"
                onClick={saveIncome}
                className="primary-button px-5 py-3"
              >
                Geliri Kaydet
              </button>
            </div>
          </PanelShell>
        </section>

        <section className="mt-6">
          <PanelShell
            title="Giderler"
            subtitle="Kredi, kredi kartı ve diğer nakit giderlerini ayrı ayrı takip edebilirsin."
            open={expensesOpen}
            onToggle={() => setExpensesOpen((current) => !current)}
          >
            <ExpenseBlock
              title="Krediler"
              totalLabel="Total kredi ödemesi"
              totalValue={formatMoney(totals.totalCreditPayment)}
              helperText="Ödeme başlangıç tarihi gelmeyen krediler toplam gidere eklenmez."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InputBox
                  label="Kredi Adı"
                  placeholder="Örn: Garanti Kredi"
                  value={creditForm.title}
                  onChange={(value) => updateCreditForm("title", value)}
                />

                <InputBox
                  label="Taksit Tutarı"
                  type="number"
                  placeholder="0"
                  value={creditForm.monthlyPayment}
                  onChange={(value) =>
                    updateCreditForm("monthlyPayment", value)
                  }
                />

                <InputBox
                  label="Toplam Taksit"
                  type="number"
                  placeholder="0"
                  value={creditForm.totalInstallments}
                  onChange={(value) =>
                    updateCreditForm("totalInstallments", value)
                  }
                />

                <InputBox
                  label="Kaçıncı Taksit"
                  type="number"
                  placeholder="0"
                  value={creditForm.currentInstallment}
                  onChange={(value) =>
                    updateCreditForm("currentInstallment", value)
                  }
                />

                <InputBox
                  label="Kalan Borç"
                  type="number"
                  placeholder="0"
                  value={creditForm.remainingDebt}
                  onChange={(value) =>
                    updateCreditForm("remainingDebt", value)
                  }
                />

                <InputBox
                  label="Ödeme Başlangıç Tarihi"
                  type="date"
                  value={creditForm.paymentStartDate}
                  onChange={(value) =>
                    updateCreditForm("paymentStartDate", value)
                  }
                />

                <InputBox
                  label="Not"
                  placeholder="Opsiyonel"
                  value={creditForm.note}
                  onChange={(value) => updateCreditForm("note", value)}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addCredit}
                    className="primary-button w-full px-5 py-4"
                  >
                    Kredi Ekle
                  </button>
                </div>
              </div>

              <CreditList
                items={credits}
                formatMoney={formatMoney}
                isCreditPaymentActive={isCreditPaymentActive}
                onDelete={deleteCredit}
              />
            </ExpenseBlock>

            <ExpenseBlock
              title="Kredi Kartı Giderleri"
              totalLabel="Total kredi kartı ödemesi"
              totalValue={formatMoney(totals.totalCreditCardPayment)}
              helperText="Bu alanda tarih tutulmaz. Kart ekstresi veya kart harcamaları için kullanılır."
            >
              <SimpleExpenseForm
                form={creditCardForm}
                onChange={updateCreditCardForm}
                onAdd={addCreditCardExpense}
                buttonText="Kart Gideri Ekle"
              />

              <SimpleExpenseList
                items={creditCards}
                formatMoney={formatMoney}
                onDelete={deleteCreditCard}
              />
            </ExpenseBlock>

            <ExpenseBlock
              title="Diğer Nakit Giderler"
              totalLabel="Total diğer ödemeler"
              totalValue={formatMoney(totals.totalOtherPayment)}
              helperText="Nakit, havale veya kart dışı günlük giderleri buradan takip edebilirsin."
            >
              <SimpleExpenseForm
                form={otherForm}
                onChange={updateOtherForm}
                onAdd={addOtherExpense}
                buttonText="Diğer Gider Ekle"
              />

              <SimpleExpenseList
                items={others}
                formatMoney={formatMoney}
                onDelete={deleteOther}
              />
            </ExpenseBlock>
          </PanelShell>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/20 bg-emerald-500/10"
      : tone === "red"
      ? "border-rose-300/20 bg-rose-500/10"
      : tone === "blue"
      ? "border-sky-300/20 bg-sky-500/10"
      : "border-purple-300/20 bg-purple-500/10";

  return (
    <div className={`rounded-[28px] border p-6 ${toneClass}`}>
      <div className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">
        {title}
      </div>
      <div className="mt-3 break-words text-3xl font-black text-white">
        {value}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{detail}</div>
    </div>
  );
}

function PanelShell({ title, subtitle, open, onToggle, children }) {
  return (
    <div className="glass-card rounded-[28px] p-5 md:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black text-white">
          {open ? "−" : "+"}
        </div>
      </button>

      {open ? <div className="mt-6 space-y-6">{children}</div> : null}
    </div>
  );
}

function ExpenseBlock({ title, totalLabel, totalValue, helperText, children }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{helperText}</p>
        </div>

        <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-sky-100">
            {totalLabel}
          </div>
          <div className="mt-1 text-xl font-black text-white">{totalValue}</div>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </div>
  );
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SimpleExpenseForm({ form, onChange, onAdd, buttonText }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <InputBox
        label="Gider Adı"
        placeholder="Örn: Market"
        value={form.title}
        onChange={(value) => onChange("title", value)}
      />

      <InputBox
        label="Kategori"
        placeholder="Örn: Alışveriş"
        value={form.category}
        onChange={(value) => onChange("category", value)}
      />

      <InputBox
        label="Tutar"
        type="number"
        placeholder="0"
        value={form.amount}
        onChange={(value) => onChange("amount", value)}
      />

      <InputBox
        label="Not"
        placeholder="Opsiyonel"
        value={form.note}
        onChange={(value) => onChange("note", value)}
      />

      <div className="md:col-span-2 xl:col-span-4">
        <button
          type="button"
          onClick={onAdd}
          className="primary-button w-full px-5 py-4"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

function CreditList({ items, formatMoney, isCreditPaymentActive, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kredi kaydı bulunmuyor." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const active = isCreditPaymentActive(item.paymentStartDate);

        return (
          <div
            key={item.id}
            className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-white">{item.title}</h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      active
                        ? "bg-emerald-500/10 text-emerald-100"
                        : "bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {active ? "Aktif gider" : "Ödeme tarihi bekleniyor"}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                  <InfoLine
                    label="Taksit Tutarı"
                    value={formatMoney(item.monthlyPayment)}
                  />
                  <InfoLine
                    label="Taksit Durumu"
                    value={`${item.currentInstallment || 0} / ${
                      item.totalInstallments || 0
                    }`}
                  />
                  <InfoLine
                    label="Kalan Borç"
                    value={formatMoney(item.remainingDebt)}
                  />
                  <InfoLine
                    label="Başlangıç"
                    value={item.paymentStartDate || "Hemen aktif"}
                  />
                </div>

                {item.note ? (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {item.note}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"
              >
                Sil
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleExpenseList({ items, formatMoney, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kayıt bulunmuyor." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4 md:flex-row md:items-center"
        >
          <div className="min-w-0">
            <div className="text-lg font-black text-white">{item.title}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-400">
              <span>{item.category}</span>
              {item.note ? (
                <>
                  <span>•</span>
                  <span>{item.note}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 md:justify-end">
            <div className="text-lg font-black text-white">
              {formatMoney(item.amount)}
            </div>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words font-black text-white">{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-6 text-center">
      <div className="text-base font-black text-white">{text}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Yeni kayıt eklediğinde liste burada görüntülenecek.
      </p>
    </div>
  );
}
