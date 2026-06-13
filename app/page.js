"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

const emptyFinanceData = {
  income: emptyIncome,
  extraIncomes: [],
  credits: [],
  cardExpenses: [],
  otherExpenses: [],
};

function usernameToEmail(username) {
  return `${String(username || "").trim().toLowerCase()}@finans.local`;
}

function onlyDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function parseAmount(value) {
  return Number(onlyDigits(value));
}

function formatNumberInput(value) {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("tr-TR").format(Number(digits));
}

function normalizeFinanceData(data) {
  if (!data) {
    return emptyFinanceData;
  }

  return {
    income: {
      salary: data.income?.salary || "",
      mealAllowance: data.income?.mealAllowance || "",
    },
    extraIncomes: Array.isArray(data.extraIncomes) ? data.extraIncomes : [],
    credits: Array.isArray(data.credits) ? data.credits : [],
    cardExpenses: Array.isArray(data.cardExpenses) ? data.cardExpenses : [],
    otherExpenses: Array.isArray(data.otherExpenses) ? data.otherExpenses : [],
  };
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

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

  const [extraIncomeForm, setExtraIncomeForm] = useState(emptyExtraIncome);
  const [creditForm, setCreditForm] = useState(emptyCredit);
  const [cardForm, setCardForm] = useState(emptyExpense);
  const [otherForm, setOtherForm] = useState(emptyExpense);

  const [editingExtraIncomeId, setEditingExtraIncomeId] = useState(null);
  const [editingCreditId, setEditingCreditId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingOtherId, setEditingOtherId] = useState(null);

  const [financeLoaded, setFinanceLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
      setAuthLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setFinanceLoaded(false);
      return;
    }

    loadFinanceData(session.user.id);
  }, [session]);

  useEffect(() => {
    if (!session?.user || !financeLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      saveFinanceData();
    }, 700);

    return () => clearTimeout(timer);
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses, session, financeLoaded]);

  const loadFinanceData = async (userId) => {
    setDataLoading(true);

    const { data, error } = await supabase
      .from("user_finance_data")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log(error);
    }

    const normalized = normalizeFinanceData(data?.data);

    setIncome(normalized.income);
    setExtraIncomes(normalized.extraIncomes);
    setCredits(normalized.credits);
    setCardExpenses(normalized.cardExpenses);
    setOtherExpenses(normalized.otherExpenses);

    setFinanceLoaded(true);
    setDataLoading(false);
  };

  const saveFinanceData = async () => {
    if (!session?.user) {
      return;
    }

    setSaving(true);

    const payload = {
      income,
      extraIncomes,
      credits,
      cardExpenses,
      otherExpenses,
    };

    const { error } = await supabase.from("user_finance_data").upsert(
      {
        user_id: session.user.id,
        data: payload,
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.log(error);
    }

    setSaving(false);
  };

  const handleRegister = async () => {
    setAuthMessage("");

    if (!username.trim() || !password.trim()) {
      setAuthMessage("Kullanıcı adı ve şifre gir.");
      return;
    }

    const email = usernameToEmail(username);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Hesap oluşturuldu. Şimdi giriş yapabilirsin.");
  };

  const handleLogin = async () => {
    setAuthMessage("");

    if (!username.trim() || !password.trim()) {
      setAuthMessage("Kullanıcı adı ve şifre gir.");
      return;
    }

    const email = usernameToEmail(username);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthMessage("Giriş başarısız. Kullanıcı adı veya şifreyi kontrol et.");
      return;
    }
  };

  const handleLogout = async () => {
    await saveFinanceData();
    await supabase.auth.signOut();
    setSession(null);
  };

  const money = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const isCreditActive = (dateText) => {
    if (!dateText) {
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(dateText);
    start.setHours(0, 0, 0, 0);

    return start <= today;
  };

  const parseInstallment = (text) => {
    const cleanText = String(text || "").replace(/\s/g, "");

    if (!cleanText.includes("/")) {
      return {
        percent: 0,
        completed: false,
      };
    }

    const [currentRaw, totalRaw] = cleanText.split("/");
    const current = Number(currentRaw || 0);
    const total = Number(totalRaw || 0);

    if (!current || !total || total <= 0) {
      return {
        percent: 0,
        completed: false,
      };
    }

    const percent = Math.min(100, Math.round((current / total) * 100));

    return {
      percent,
      completed: current >= total,
    };
  };

  const totals = useMemo(() => {
    const salary = parseAmount(income.salary);
    const mealAllowance = parseAmount(income.mealAllowance);

    const extraIncomeTotal = extraIncomes.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalIncome = salary + extraIncomeTotal;

    const activeCreditTotal = credits.reduce((sum, item) => {
      if (!isCreditActive(item.paymentStartDate)) {
        return sum;
      }

      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const deferredCreditTotal = credits.reduce((sum, item) => {
      if (isCreditActive(item.paymentStartDate)) {
        return sum;
      }

      return sum + Number(item.monthlyPayment || 0);
    }, 0);

    const cardTotal = cardExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const otherTotal = otherExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalDebt = credits.reduce((sum, item) => {
      return sum + Number(item.remainingDebt || 0);
    }, 0);

    const totalExpense = activeCreditTotal + cardTotal + otherTotal;

    return {
      mealAllowance,
      extraIncomeTotal,
      totalIncome,
      activeCreditTotal,
      deferredCreditTotal,
      cardTotal,
      otherTotal,
      totalDebt,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses]);

  const updateIncome = (field, value) => {
    setIncome((current) => ({
      ...current,
      [field]: formatNumberInput(value),
    }));
  };

  const updateExtraIncomeForm = (field, value) => {
    setExtraIncomeForm((current) => ({
      ...current,
      [field]: field === "amount" ? formatNumberInput(value) : value,
    }));
  };

  const updateCreditForm = (field, value) => {
    const amountFields = ["monthlyPayment", "remainingDebt"];

    setCreditForm((current) => ({
      ...current,
      [field]: amountFields.includes(field) ? formatNumberInput(value) : value,
    }));
  };

  const updateCardForm = (field, value) => {
    setCardForm((current) => ({
      ...current,
      [field]: field === "amount" ? formatNumberInput(value) : value,
    }));
  };

  const updateOtherForm = (field, value) => {
    setOtherForm((current) => ({
      ...current,
      [field]: field === "amount" ? formatNumberInput(value) : value,
    }));
  };

  const resetExtraIncomeForm = () => {
    setEditingExtraIncomeId(null);
    setExtraIncomeForm(emptyExtraIncome);
  };

  const resetCreditForm = () => {
    setEditingCreditId(null);
    setCreditForm(emptyCredit);
  };

  const resetCardForm = () => {
    setEditingCardId(null);
    setCardForm(emptyExpense);
  };

  const resetOtherForm = () => {
    setEditingOtherId(null);
    setOtherForm(emptyExpense);
  };

  const addOrUpdateExtraIncome = () => {
    const title = extraIncomeForm.title.trim();
    const amount = parseAmount(extraIncomeForm.amount);

    if (!title || amount <= 0) {
      alert("Ek gelir adı ve geçerli tutar gir.");
      return;
    }

    if (editingExtraIncomeId) {
      setExtraIncomes((current) =>
        current.map((item) =>
          item.id === editingExtraIncomeId ? { ...item, title, amount } : item
        )
      );
      resetExtraIncomeForm();
      return;
    }

    setExtraIncomes((current) => [
      {
        id: String(Date.now()),
        title,
        amount,
      },
      ...current,
    ]);

    setExtraIncomeForm(emptyExtraIncome);
  };

  const startEditExtraIncome = (item) => {
    setEditingExtraIncomeId(item.id);
    setExtraIncomeForm({
      title: item.title || "",
      amount: formatNumberInput(item.amount),
    });
    setIncomeOpen(true);
    setExtraIncomeOpen(true);
  };

  const addOrUpdateCredit = () => {
    const title = creditForm.title.trim();
    const monthlyPayment = parseAmount(creditForm.monthlyPayment);
    const remainingDebt = parseAmount(creditForm.remainingDebt);

    if (!title || monthlyPayment <= 0) {
      alert("Kredi adı ve taksit tutarı gir.");
      return;
    }

    if (!String(creditForm.installmentText || "").includes("/")) {
      alert("Taksit alanını 8/24 formatında gir.");
      return;
    }

    const itemPayload = {
      title,
      monthlyPayment,
      installmentText: creditForm.installmentText.trim(),
      remainingDebt,
      paymentStartDate: creditForm.paymentStartDate || "",
    };

    if (editingCreditId) {
      setCredits((current) =>
        current.map((item) =>
          item.id === editingCreditId ? { ...item, ...itemPayload } : item
        )
      );
      resetCreditForm();
      return;
    }

    setCredits((current) => [
      {
        id: String(Date.now()),
        ...itemPayload,
      },
      ...current,
    ]);

    setCreditForm(emptyCredit);
  };

  const startEditCredit = (item) => {
    setEditingCreditId(item.id);
    setCreditForm({
      title: item.title || "",
      monthlyPayment: formatNumberInput(item.monthlyPayment),
      installmentText: item.installmentText || "",
      remainingDebt: formatNumberInput(item.remainingDebt),
      paymentStartDate: item.paymentStartDate || "",
    });

    setExpensesOpen(true);
    setCreditsOpen(true);
  };

  const addOrUpdateSimpleExpense = (type) => {
    const isCard = type === "card";
    const form = isCard ? cardForm : otherForm;
    const editingId = isCard ? editingCardId : editingOtherId;

    const title = form.title.trim();
    const amount = parseAmount(form.amount);

    if (!title || amount <= 0) {
      alert("Gider adı ve geçerli tutar gir.");
      return;
    }

    const itemPayload = {
      title,
      category: form.category.trim() || (isCard ? "Kredi Kartı" : "Diğer"),
      amount,
      note: form.note.trim(),
    };

    if (isCard) {
      if (editingId) {
        setCardExpenses((current) =>
          current.map((item) =>
            item.id === editingId ? { ...item, ...itemPayload } : item
          )
        );
        resetCardForm();
        return;
      }

      setCardExpenses((current) => [
        {
          id: String(Date.now()),
          ...itemPayload,
        },
        ...current,
      ]);

      setCardForm(emptyExpense);
      return;
    }

    if (editingId) {
      setOtherExpenses((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...itemPayload } : item
        )
      );
      resetOtherForm();
      return;
    }

    setOtherExpenses((current) => [
      {
        id: String(Date.now()),
        ...itemPayload,
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
      amount: formatNumberInput(item.amount),
      note: item.note || "",
    });

    setExpensesOpen(true);
    setCardsOpen(true);
  };

  const startEditOther = (item) => {
    setEditingOtherId(item.id);
    setOtherForm({
      title: item.title || "",
      category: item.category || "",
      amount: formatNumberInput(item.amount),
      note: item.note || "",
    });

    setExpensesOpen(true);
    setOthersOpen(true);
  };

  if (authLoading) {
    return (
      <main className="financePage">
        <div className="authCard">
          <h1>Yükleniyor...</h1>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="financePage">
        <section className="authCard">
          <div className="topBadge">Kişisel Finans Yönetimi</div>

          <h1 className="authTitle">Giriş Yap</h1>

          <p className="authText">
            Kullanıcı adı ve şifreyle giriş yap. Her kullanıcının finans verisi ayrı tutulur.
          </p>

          <label className="inputBox">
            <span>Kullanıcı Adı</span>
            <input
              value={username}
              placeholder="Örn: ibrahim"
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="inputBox">
            <span>Şifre</span>
            <input
              type="password"
              value={password}
              placeholder="Şifren"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {authMessage ? <div className="authMessage">{authMessage}</div> : null}

          <div className="authButtons">
            <button type="button" className="premiumButton" onClick={handleLogin}>
              Giriş Yap
            </button>

            <button type="button" className="secondaryButton" onClick={handleRegister}>
              Hesap Oluştur
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="financePage">
      <div className="financeShell">
        <header className="topHeader appHeader">
          <div>
            <div className="topBadge">Kişisel Finans Yönetimi</div>
            <p className="saveStatus">
              {saving ? "Kaydediliyor..." : "Veriler Supabase üzerinde güvende"}
            </p>
          </div>

          <button type="button" className="secondaryButton" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </header>

        {dataLoading ? (
          <section className="panelCard">
            <div className="emptyState">
              <strong>Veriler yükleniyor...</strong>
            </div>
          </section>
        ) : null}

        <section className="summaryGrid">
          <SummaryCard
            tone="green"
            title="Toplam Gelir"
            value={money(totals.totalIncome)}
            detail={`Yemek parası: ${money(totals.mealAllowance)} • Gelire dahil değil`}
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
            value={money(totals.totalDebt)}
            detail="Kalan toplam kredi borcu"
          />
        </section>

        <Panel
          title="Gelirler"
          subtitle="Maaş, yemek parası ve ek gelir yönetimi"
          totalLabel="Toplam Gelir"
          total={money(totals.totalIncome)}
          open={incomeOpen}
          onToggle={() => setIncomeOpen((value) => !value)}
        >
          <div className="formGrid two">
            <InputBox
              label="Maaş"
              value={income.salary}
              placeholder="0"
              onChange={(value) => updateIncome("salary", value)}
            />

            <InputBox
              label="Yemek Parası"
              value={income.mealAllowance}
              placeholder="0"
              onChange={(value) => updateIncome("mealAllowance", value)}
            />
          </div>

          <MiniPanel
            title="Ek Gelirler"
            totalLabel="Total Ek Gelir"
            total={money(totals.extraIncomeTotal)}
            color="mint"
            open={extraIncomeOpen}
            onToggle={() => setExtraIncomeOpen((value) => !value)}
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
                onClick={resetExtraIncomeForm}
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
          title="Giderler"
          subtitle="Krediler, kredi kartı ve diğer giderler"
          totalLabel="Toplam Gider"
          total={money(totals.totalExpense)}
          open={expensesOpen}
          onToggle={() => setExpensesOpen((value) => !value)}
        >
          <MiniPanel
            title="Krediler"
            totalLabel="Total Kredi Ödemesi"
            total={money(totals.activeCreditTotal)}
            color="purple"
            open={creditsOpen}
            onToggle={() => setCreditsOpen((value) => !value)}
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
                onClick={resetCreditForm}
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
            totalLabel="Total Kredi Kartı"
            total={money(totals.cardTotal)}
            color="rose"
            open={cardsOpen}
            onToggle={() => setCardsOpen((value) => !value)}
          >
            <SimpleExpenseForm
              form={cardForm}
              onChange={updateCardForm}
              onAdd={() => addOrUpdateSimpleExpense("card")}
              buttonText={
                editingCardId ? "Kart Giderini Güncelle" : "Kart Gideri Ekle"
              }
            />

            {editingCardId ? (
              <button type="button" className="deleteButton" onClick={resetCardForm}>
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
            totalLabel="Total Diğer"
            total={money(totals.otherTotal)}
            color="orange"
            open={othersOpen}
            onToggle={() => setOthersOpen((value) => !value)}
          >
            <SimpleExpenseForm
              form={otherForm}
              onChange={updateOtherForm}
              onAdd={() => addOrUpdateSimpleExpense("other")}
              buttonText={
                editingOtherId ? "Diğer Gideri Güncelle" : "Diğer Gider Ekle"
              }
            />

            {editingOtherId ? (
              <button type="button" className="deleteButton" onClick={resetOtherForm}>
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
      <div className={`summaryValue summaryValue-${tone}`}>{value}</div>
      <div className="summaryDetail">{detail}</div>
    </article>
  );
}

function Panel({ title, subtitle, totalLabel, total, open, onToggle, children }) {
  return (
    <section className="panelCard">
      <button type="button" className="panelHeader" onClick={onToggle}>
        <div>
          <h2 className="gradientTitle">{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panelRight">
          <div className="panelTotal">
            <span>{totalLabel}</span>
            <strong>{total}</strong>
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
  total,
  color,
  open,
  onToggle,
  children,
}) {
  return (
    <section className={`miniPanel ${color}`}>
      <button type="button" className="miniHeader" onClick={onToggle}>
        <div>
          <h3 className={`miniTitle miniTitle-${color}`}>{title}</h3>
        </div>

        <div className="miniRight">
          <div className="miniTotal">
            <span>{totalLabel}</span>
            <strong>{total}</strong>
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
        inputMode={type === "date" ? undefined : "numeric"}
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
                    <span className="status deferred">Ödeme tarihi bekleniyor</span>
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
                <button type="button" className="editButton" onClick={() => onEdit(item)}>
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

              <button type="button" className="editButton" onClick={() => onEdit(item)}>
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

              <button type="button" className="editButton" onClick={() => onEdit(item)}>
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
