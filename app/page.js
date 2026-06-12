"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisel-finans-panel-v5";

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
  const [extraIncomeForm, setExtraIncomeForm] = useState(emptyExtraIncome);
  const [editingExtraIncomeId, setEditingExtraIncomeId] = useState(null);

  const [credits, setCredits] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);

  const [creditForm, setCreditForm] = useState(emptyCredit);
  const [cardForm, setCardForm] = useState(emptyExpense);
  const [otherForm, setOtherForm] = useState(emptyExpense);

  const [editingCreditId, setEditingCreditId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingOtherId, setEditingOtherId] = useState(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        setIncome(data.income || emptyIncome);
        setExtraIncomes(data.extraIncomes || []);
        setCredits(data.credits || []);
        setCardExpenses(data.cardExpenses || []);
        setOtherExpenses(data.otherExpenses || []);
      }
    } catch {
      setIncome(emptyIncome);
      setExtraIncomes([]);
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
      JSON.stringify({
        income,
        extraIncomes,
        credits,
        cardExpenses,
        otherExpenses,
      })
    );
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses, loaded]);

  const isCreditActive = (dateText) => {
    if (!dateText) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(dateText);
    startDate.setHours(0, 0, 0, 0);

    return startDate <= today;
  };

  const parseInstallment = (text) => {
    if (!text) {
      return {
        current: 0,
        total: 0,
        percent: 0,
        completed: false,
      };
    }

    const cleanText = text.replace(/\s/g, "");
    const parts = cleanText.split("/");

    if (parts.length !== 2) {
      return {
        current: 0,
        total: 0,
        percent: 0,
        completed: false,
      };
    }

    const current = Number(parts[0] || 0);
    const total = Number(parts[1] || 0);

    if (!current || !total || total <= 0) {
      return {
        current: 0,
        total: 0,
        percent: 0,
        completed: false,
      };
    }

    const percent = Math.min(100, Math.round((current / total) * 100));

    return {
      current,
      total,
      percent,
      completed: current >= total,
    };
  };

  const totals = useMemo(() => {
    const salary = Number(income.salary || 0);
    const mealAllowance = Number(income.mealAllowance || 0);

    const totalExtraIncome = extraIncomes.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalIncome = salary + totalExtraIncome;

    const activeCreditTotal = credits.reduce((sum, item) => {
      if (!isCreditActive(item.paymentStartDate)) return sum;

      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const deferredCreditTotal = credits.reduce((sum, item) => {
      if (isCreditActive(item.paymentStartDate)) return sum;

      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const cardTotal = cardExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const otherTotal = otherExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalExpense = activeCreditTotal + cardTotal + otherTotal;

    return {
      salary,
      mealAllowance,
      totalExtraIncome,
      totalIncome,
      activeCreditTotal,
      deferredCreditTotal,
      cardTotal,
      otherTotal,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses]);

  const money = (value) => {
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

  const updateExtraIncomeForm = (field, value) => {
    setExtraIncomeForm((current) => ({
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

  const updateCardForm = (field, value) => {
    setCardForm((current) => ({
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

  const resetExtraIncomeEdit = () => {
    setEditingExtraIncomeId(null);
    setExtraIncomeForm(emptyExtraIncome);
  };

  const resetCreditEdit = () => {
    setEditingCreditId(null);
    setCreditForm(emptyCredit);
  };

  const resetCardEdit = () => {
    setEditingCardId(null);
    setCardForm(emptyExpense);
  };

  const resetOtherEdit = () => {
    setEditingOtherId(null);
    setOtherForm(emptyExpense);
  };

  const addOrUpdateExtraIncome = () => {
    const title = extraIncomeForm.title.trim();
    const amount = Number(extraIncomeForm.amount);

    if (!title || amount <= 0) {
      alert("Lütfen ek gelir adı ve geçerli tutar gir.");
      return;
    }

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

      resetExtraIncomeEdit();
      return;
    }

    const item = {
      id: String(Date.now()),
      title,
      amount,
    };

    setExtraIncomes((current) => [item, ...current]);
    setExtraIncomeForm(emptyExtraIncome);
  };

  const startEditExtraIncome = (item) => {
    setEditingExtraIncomeId(item.id);
    setExtraIncomeForm({
      title: item.title || "",
      amount: String(item.amount || ""),
    });
    setExtraIncomeOpen(true);
  };

  const addOrUpdateCredit = () => {
    const title = creditForm.title.trim();
    const monthlyPayment = Number(creditForm.monthlyPayment);

    if (!title || monthlyPayment <= 0) {
      alert("Lütfen kredi adı ve geçerli taksit tutarı gir.");
      return;
    }

    if (!creditForm.installmentText.trim().includes("/")) {
      alert("Taksit alanını 8/24 formatında gir.");
      return;
    }

    const updatedCredit = {
      title,
      monthlyPayment,
      installmentText: creditForm.installmentText.trim(),
      remainingDebt: Number(creditForm.remainingDebt || 0),
      paymentStartDate: creditForm.paymentStartDate,
    };

    if (editingCreditId) {
      setCredits((current) =>
        current.map((item) =>
          item.id === editingCreditId
            ? {
                ...item,
                ...updatedCredit,
              }
            : item
        )
      );

      resetCreditEdit();
      return;
    }

    const item = {
      id: String(Date.now()),
      ...updatedCredit,
    };

    setCredits((current) => [item, ...current]);
    setCreditForm(emptyCredit);
  };

  const startEditCredit = (item) => {
    setEditingCreditId(item.id);
    setCreditForm({
      title: item.title || "",
      monthlyPayment: String(item.monthlyPayment || ""),
      installmentText: item.installmentText || "",
      remainingDebt: String(item.remainingDebt || ""),
      paymentStartDate: item.paymentStartDate || "",
    });
    setCreditsOpen(true);
    setExpensesOpen(true);
  };

  const addOrUpdateSimpleExpense = (type) => {
    const form = type === "card" ? cardForm : otherForm;
    const editingId = type === "card" ? editingCardId : editingOtherId;

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title || amount <= 0) {
      alert("Lütfen gider adı ve geçerli tutar gir.");
      return;
    }

    const updatedItem = {
      title,
      category: form.category.trim() || (type === "card" ? "Kredi Kartı" : "Diğer"),
      amount,
      note: form.note.trim(),
    };

    if (type === "card") {
      if (editingId) {
        setCardExpenses((current) =>
          current.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  ...updatedItem,
                }
              : item
          )
        );

        resetCardEdit();
        return;
      }

      setCardExpenses((current) => [
        {
          id: String(Date.now()),
          ...updatedItem,
        },
        ...current,
      ]);

      setCardForm(emptyExpense);
      return;
    }

    if (editingId) {
      setOtherExpenses((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...updatedItem,
              }
            : item
        )
      );

      resetOtherEdit();
      return;
    }

    setOtherExpenses((current) => [
      {
        id: String(Date.now()),
        ...updatedItem,
      },
      ...current,
    ]);

    setOtherForm(emptyExpense);
  };

  const startEditCard = (item) => {
    setEditingCardId(item.id);
    setCardForm({
      title: item.title || "",
      category: item.category || "",
      amount: String(item.amount || ""),
      note: item.note || "",
    });
    setCardsOpen(true);
    setExpensesOpen(true);
  };

  const startEditOther = (item) => {
    setEditingOtherId(item.id);
    setOtherForm({
      title: item.title || "",
      category: item.category || "",
      amount: String(item.amount || ""),
      note: item.note || "",
    });
    setOthersOpen(true);
    setExpensesOpen(true);
  };

  return (
    <main className="financePage">
      <div className="financeShell">
        <header className="topHeader">
          <div className="topBadge">Kişisel Finans Yönetimi</div>
        </header>

        <section className="summaryGrid">
          <SummaryCard
            tone="green"
            title="Toplam Gelir"
            value={money(totals.totalIncome)}
            detail="Maaş + ek gelirler"
          />

          <SummaryCard
            tone="red"
            title="Toplam Gider"
            value={money(totals.totalExpense)}
            detail="Kredi + kredi kartı + diğer giderler"
          />

          <SummaryCard
            tone="blue"
            title="Aylık Kalan"
            value={money(totals.balance)}
            detail="Gelirlerden giderler düşülür"
          />

          <SummaryCard
            tone="purple"
            title="Yemek Parası"
            value={money(totals.mealAllowance)}
            detail="Toplam gelire dahil edilmez"
          />
        </section>

        <Panel
          color="green"
          title="Gelirler"
          subtitle="Maaş ve manuel ek gelirlerini bu alandan yönetebilirsin. Yemek parası bilgi amaçlı tutulur."
          totalLabel="Toplam Gelir"
          totalValue={money(totals.totalIncome)}
          open={incomeOpen}
          onToggle={() => setIncomeOpen((current) => !current)}
        >
          <div className="formGrid two">
            <InputBox
              label="Maaş"
              type="number"
              value={income.salary}
              placeholder="0"
              onChange={(value) => updateIncome("salary", value)}
            />

            <InputBox
              label="Yemek Parası"
              type="number"
              value={income.mealAllowance}
              placeholder="0"
              onChange={(value) => updateIncome("mealAllowance", value)}
            />
          </div>

          <MiniPanel
            title="Ek Gelirler"
            totalLabel="Total ek gelir"
            totalValue={money(totals.totalExtraIncome)}
            open={extraIncomeOpen}
            onToggle={() => setExtraIncomeOpen((current) => !current)}
            color="mint"
          >
            <div className="formGrid three">
              <InputBox
                label="Ek Gelir Adı"
                value={extraIncomeForm.title}
                placeholder="Örn: Prim"
                onChange={(value) => updateExtraIncomeForm("title", value)}
              />

              <InputBox
                label="Tutar"
                type="number"
                value={extraIncomeForm.amount}
                placeholder="0"
                onChange={(value) => updateExtraIncomeForm("amount", value)}
              />

              <button
                type="button"
                className="premiumButton"
                onClick={addOrUpdateExtraIncome}
              >
                {editingExtraIncomeId ? "Ek Geliri Güncelle" : "Ek Gelir Ekle"}
              </button>
            </div>

            {editingExtraIncomeId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetExtraIncomeEdit}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <IncomeList
              items={extraIncomes}
              money={money}
              onEdit={startEditExtraIncome}
              onDelete={(id) =>
                setExtraIncomes((current) =>
                  current.filter((item) => item.id !== id)
                )
              }
            />
          </MiniPanel>
        </Panel>

        <Panel
          color="blue"
          title="Giderler"
          subtitle="Giderler ana başlığı kapanabilir. Alt başlıklar da ayrı ayrı açılıp kapanır."
          totalLabel="Toplam Gider"
          totalValue={money(totals.totalExpense)}
          open={expensesOpen}
          onToggle={() => setExpensesOpen((current) => !current)}
        >
          <MiniPanel
            title="Krediler"
            totalLabel="Total kredi ödemesi"
            totalValue={money(totals.activeCreditTotal)}
            open={creditsOpen}
            onToggle={() => setCreditsOpen((current) => !current)}
            color="purple"
          >
            <p className="sectionDescription">
              Taksit alanını <strong>8/24</strong> formatında yaz. Ödeme başlangıç
              tarihi gelmeyen krediler toplam gidere eklenmez.
            </p>

            <div className="formGrid five">
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
                label="Taksit"
                value={creditForm.installmentText}
                placeholder="Örn: 8/24"
                onChange={(value) => updateCreditForm("installmentText", value)}
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

              <button
                type="button"
                className="premiumButton wide"
                onClick={addOrUpdateCredit}
              >
                {editingCreditId ? "Krediyi Güncelle" : "Kredi Ekle"}
              </button>
            </div>

            {editingCreditId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetCreditEdit}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <CreditList
              items={credits}
              money={money}
              parseInstallment={parseInstallment}
              isCreditActive={isCreditActive}
              onEdit={startEditCredit}
              onDelete={(id) =>
                setCredits((current) => current.filter((item) => item.id !== id))
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Kredi Kartı Giderleri"
            totalLabel="Total kredi kartı ödemesi"
            totalValue={money(totals.cardTotal)}
            open={cardsOpen}
            onToggle={() => setCardsOpen((current) => !current)}
            color="rose"
          >
            <SimpleExpenseForm
              form={cardForm}
              onChange={updateCardForm}
              onAdd={() => addOrUpdateSimpleExpense("card")}
              buttonText={editingCardId ? "Kart Giderini Güncelle" : "Kart Gideri Ekle"}
            />

            {editingCardId ? (
              <button type="button" className="deleteButton" onClick={resetCardEdit}>
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <SimpleExpenseList
              items={cardExpenses}
              money={money}
              onEdit={startEditCard}
              onDelete={(id) =>
                setCardExpenses((current) =>
                  current.filter((item) => item.id !== id)
                )
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Diğer Nakit Giderler"
            totalLabel="Total diğer ödemeler"
            totalValue={money(totals.otherTotal)}
            open={othersOpen}
            onToggle={() => setOthersOpen((current) => !current)}
            color="orange"
          >
            <SimpleExpenseForm
              form={otherForm}
              onChange={updateOtherForm}
              onAdd={() => addOrUpdateSimpleExpense("other")}
              buttonText={editingOtherId ? "Diğer Gideri Güncelle" : "Diğer Gider Ekle"}
            />

            {editingOtherId ? (
              <button type="button" className="deleteButton" onClick={resetOtherEdit}>
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <SimpleExpenseList
              items={otherExpenses}
              money={money}
              onEdit={startEditOther}
              onDelete={(id) =>
                setOtherExpenses((current) =>
                  current.filter((item) => item.id !== id)
                )
              }
            />
          </MiniPanel>
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
    <section className={`panelCard ${color}`}>
      <button type="button" className="panelHeader" onClick={onToggle}>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panelRight">
          <div className="panelTotal">
            <span>{totalLabel}</span>
            <strong>{totalValue}</strong>
          </div>

          <div className="toggleButton">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? <div className="panelBody">{children}</div> : null}
    </section>
  );
}

function MiniPanel({
  title,
  totalLabel,
  totalValue,
  open,
  onToggle,
  color,
  children,
}) {
  return (
    <section className={`miniPanel ${color}`}>
      <button type="button" className="miniHeader" onClick={onToggle}>
        <div>
          <h3>{title}</h3>
        </div>

        <div className="miniRight">
          <div className="miniTotal">
            <span>{totalLabel}</span>
            <strong>{totalValue}</strong>
          </div>

          <div className="miniToggle">{open ? "−" : "+"}</div>
        </div>
      </button>

      {open ? <div className="miniBody">{children}</div> : null}
    </section>
  );
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="inputBox">
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
    <div className="formGrid four">
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

      <button type="button" className="premiumButton wide" onClick={onAdd}>
        {buttonText}
      </button>
    </div>
  );
}

function CreditList({
  items,
  money,
  parseInstallment,
  isCreditActive,
  onEdit,
  onDelete,
}) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kredi kaydı bulunmuyor." />;
  }

  return (
    <div className="recordList">
      {items.map((item) => {
        const installment = parseInstallment(item.installmentText);
        const active = isCreditActive(item.paymentStartDate);

        let progressClass = "danger";

        if (installment.percent >= 100) {
          progressClass = "success";
        } else if (installment.percent >= 70) {
          progressClass = "warm";
        } else if (installment.percent >= 35) {
          progressClass = "mid";
        }

        return (
          <div key={item.id} className="creditRecord">
            <div className="creditRecordTop">
              <div>
                <div className="recordTitleRow">
                  <h4>{item.title}</h4>

                  <span
                    className={
                      installment.completed ? "status done" : "status waiting"
                    }
                  >
                    {installment.completed ? "✅ Tamamlandı" : "⏳ Devam ediyor"}
                  </span>

                  {!active ? (
                    <span className="status deferred">
                      Ödeme tarihi bekleniyor
                    </span>
                  ) : null}
                </div>

                <p className="recordSubText">
                  Taksit: {item.installmentText || "0/0"} • Kalan borç:{" "}
                  {money(item.remainingDebt)}
                </p>
              </div>

              <div className="recordAmount">{money(item.monthlyPayment)}</div>
            </div>

            <div className="progressWrap">
              <div className="progressInfo">
                <span>Ödeme ilerlemesi</span>
                <strong>{installment.percent}%</strong>
              </div>

              <div className="progressTrack">
                <div
                  className={`progressBar ${progressClass}`}
                  style={{ width: `${installment.percent}%` }}
                />
              </div>
            </div>

            <div className="recordFooter">
              <span>Başlangıç: {item.paymentStartDate || "Hemen aktif"}</span>

              <div className="recordActions">
                <button
                  type="button"
                  className="editButton"
                  onClick={() => onEdit(item)}
                >
                  Düzenle
                </button>

                <button
                  type="button"
                  className="deleteButton"
                  onClick={() => onDelete(item.id)}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleExpenseList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kayıt bulunmuyor." />;
  }

  return (
    <div className="recordList">
      {items.map((item) => (
        <div key={item.id} className="simpleRecord">
          <div className="simpleRecordTop">
            <div>
              <h4>{item.title}</h4>
              <p>
                {item.category}
                {item.note ? ` • ${item.note}` : ""}
              </p>
            </div>

            <div className="simpleRecordRight">
              <strong>{money(item.amount)}</strong>

              <button
                type="button"
                className="editButton"
                onClick={() => onEdit(item)}
              >
                Düzenle
              </button>

              <button
                type="button"
                className="deleteButton"
                onClick={() => onDelete(item.id)}
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

function IncomeList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz ek gelir kaydı bulunmuyor." />;
  }

  return (
    <div className="recordList">
      {items.map((item) => (
        <div key={item.id} className="simpleRecord">
          <div className="simpleRecordTop">
            <div>
              <h4>{item.title}</h4>
              <p>Ek gelir</p>
            </div>

            <div className="simpleRecordRight">
              <strong>{money(item.amount)}</strong>

              <button
                type="button"
                className="editButton"
                onClick={() => onEdit(item)}
              >
                Düzenle
              </button>

              <button
                type="button"
                className="deleteButton"
                onClick={() => onDelete(item.id)}
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
      <span>Yeni kayıt eklediğinde burada görüntülenecek.</span>
    </div>
  );
}
