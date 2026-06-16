"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import RoutinePlanner from "../components/RoutinePlanner";
import InvestmentLedger from "../components/InvestmentLedger";

const LOCAL_KEY = "finance-panel-backup-v2";

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function digits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function parseAmount(value) {
  return Number(digits(value));
}

function formatInput(value) {
  const clean = digits(value);
  return clean ? new Intl.NumberFormat("tr-TR").format(Number(clean)) : "";
}

const defaultData = {
  income: { salary: "", mealAllowance: "" },
  extraIncomes: [],
  credits: [],
  cardExpenses: [],
  otherExpenses: [],
  investments: {
    bes: [],
    locked: [],
    gold: [],
    crypto: [],
    stocks: [],
    forex: [],
    transactions: [],
    livePrices: {},
  },
  routines: [],
};

function normalizeData(data) {
  if (!data) return defaultData;
  return {
    income: {
      salary: formatInput(data.income?.salary || ""),
      mealAllowance: formatInput(data.income?.mealAllowance || ""),
    },
    extraIncomes: Array.isArray(data.extraIncomes) ? data.extraIncomes : [],
    credits: Array.isArray(data.credits) ? data.credits : [],
    cardExpenses: Array.isArray(data.cardExpenses) ? data.cardExpenses : [],
    otherExpenses: Array.isArray(data.otherExpenses) ? data.otherExpenses : [],
    investments: {
      bes: Array.isArray(data.investments?.bes) ? data.investments.bes : [],
      locked: Array.isArray(data.investments?.locked) ? data.investments.locked : [],
      gold: Array.isArray(data.investments?.gold) ? data.investments.gold : [],
      crypto: Array.isArray(data.investments?.crypto) ? data.investments.crypto : [],
      stocks: Array.isArray(data.investments?.stocks) ? data.investments.stocks : [],
      forex: Array.isArray(data.investments?.forex) ? data.investments.forex : [],
      transactions: Array.isArray(data.investments?.transactions) ? data.investments.transactions : [],
      livePrices: data.investments?.livePrices || {},
    },
    routines: Array.isArray(data.routines) ? data.routines : [],
  };
}

function getLocalBackup() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveLocalBackup(data) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {}
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [financeLoaded, setFinanceLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("finance");

  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [income, setIncome] = useState(defaultData.income);
  const [extraIncomes, setExtraIncomes] = useState([]);
  const [credits, setCredits] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [investments, setInvestments] = useState(defaultData.investments);
  const [routines, setRoutines] = useState([]);

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const [extraForm, setExtraForm] = useState({ title: "", amount: "" });
  const [creditForm, setCreditForm] = useState({ title: "", monthlyPayment: "", installmentText: "", remainingDebt: "", paymentStartDate: "" });
  const [cardForm, setCardForm] = useState({ title: "", category: "", amount: "", note: "" });
  const [otherForm, setOtherForm] = useState({ title: "", category: "", amount: "", note: "" });

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem("remembered-finance-email");
      if (remembered) setEmail(remembered);
    } catch {}
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
      setAuthLoading(false);
    };

    init();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession || null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setFinanceLoaded(false);
      return;
    }
    loadFinanceData(session.user.id);
  }, [session]);

  useEffect(() => {
    if (!session?.user || !financeLoaded) return;
    const timer = setTimeout(saveFinanceData, 700);
    return () => clearTimeout(timer);
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses, investments, routines, session, financeLoaded]);

  const currentPayload = () => ({ income, extraIncomes, credits, cardExpenses, otherExpenses, investments, routines });

  const loadFinanceData = async (userId) => {
    setDataLoading(true);
    const { data, error } = await supabase.from("user_finance_data").select("data").eq("user_id", userId).maybeSingle();
    if (error) console.log(error);

    let normalized = normalizeData(data?.data);
    const hasData = JSON.stringify(normalized) !== JSON.stringify(defaultData);
    if (!hasData) {
      const backup = getLocalBackup();
      if (backup) normalized = backup;
    }

    setIncome(normalized.income);
    setExtraIncomes(normalized.extraIncomes);
    setCredits(normalized.credits);
    setCardExpenses(normalized.cardExpenses);
    setOtherExpenses(normalized.otherExpenses);
    setInvestments(normalized.investments);
    setRoutines(normalized.routines);
    setFinanceLoaded(true);
    setDataLoading(false);
  };

  const saveFinanceData = async () => {
    if (!session?.user || !supabase) return;
    const payload = currentPayload();
    saveLocalBackup(payload);
    setSaving(true);
    const { error } = await supabase.from("user_finance_data").upsert({ user_id: session.user.id, data: payload }, { onConflict: "user_id" });
    if (error) console.log(error);
    setSaving(false);
  };

  const handleLogin = async () => {
    setAuthMessage("");
    if (!email.trim() || !password.trim()) return setAuthMessage("E-posta ve şifre gir.");
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) return setAuthMessage("Giriş başarısız. Bilgileri kontrol et.");
    try {
      if (rememberMe) window.localStorage.setItem("remembered-finance-email", cleanEmail);
      else window.localStorage.removeItem("remembered-finance-email");
    } catch {}
  };

  const handleRegister = async () => {
    setAuthMessage("");
    if (!fullName.trim() || !email.trim() || !password.trim() || !passwordAgain.trim()) return setAuthMessage("Tüm alanları doldur.");
    if (password.length < 6) return setAuthMessage("Şifre en az 6 karakter olmalı.");
    if (password !== passwordAgain) return setAuthMessage("Şifreler eşleşmiyor.");
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
    });
    setAuthMessage(error ? error.message : "Kayıt oluşturuldu. Mail doğrulaması gerekiyorsa mailini kontrol et.");
    if (!error) setAuthMode("login");
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return setAuthMessage("Şifre sıfırlama için e-posta adresini gir.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin });
    setAuthMessage(error ? error.message : "Şifre sıfırlama bağlantısı gönderildi.");
  };

  const handleLogout = async () => {
    await saveFinanceData();
    await supabase.auth.signOut();
  };

  const isCreditActive = (dateText) => {
    if (!dateText) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(dateText);
    start.setHours(0, 0, 0, 0);
    return start <= today;
  };

  const financeTotals = useMemo(() => {
    const salary = parseAmount(income.salary);
    const mealAllowance = parseAmount(income.mealAllowance);
    const extraIncomeTotal = extraIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalIncome = salary + extraIncomeTotal;
    const creditTotal = credits.reduce((sum, item) => isCreditActive(item.paymentStartDate) ? sum + Number(item.monthlyPayment || 0) : sum, 0);
    const cardTotal = cardExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const otherTotal = otherExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const creditDebt = credits.reduce((sum, item) => sum + Number(item.remainingDebt || 0), 0);
    const totalExpense = creditTotal + cardTotal + otherTotal;
    const totalDebt = creditDebt + cardTotal + otherTotal;
    return { salary, mealAllowance, extraIncomeTotal, totalIncome, creditTotal, cardTotal, otherTotal, totalExpense, totalDebt, balance: totalIncome - totalExpense };
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses]);

  const addExtraIncome = () => {
    const title = extraForm.title.trim();
    const amount = parseAmount(extraForm.amount);
    if (!title || amount <= 0) return alert("Ek gelir adı ve tutar gir.");
    setExtraIncomes((current) => [{ id: String(Date.now()), title, amount }, ...current]);
    setExtraForm({ title: "", amount: "" });
  };

  const addCredit = () => {
    const title = creditForm.title.trim();
    const monthlyPayment = parseAmount(creditForm.monthlyPayment);
    const remainingDebt = parseAmount(creditForm.remainingDebt);
    if (!title || monthlyPayment <= 0) return alert("Kredi adı ve taksit tutarı gir.");
    setCredits((current) => [{ id: String(Date.now()), title, monthlyPayment, remainingDebt, installmentText: creditForm.installmentText, paymentStartDate: creditForm.paymentStartDate }, ...current]);
    setCreditForm({ title: "", monthlyPayment: "", installmentText: "", remainingDebt: "", paymentStartDate: "" });
  };

  const addExpense = (type) => {
    const isCard = type === "card";
    const form = isCard ? cardForm : otherForm;
    const title = form.title.trim();
    const amount = parseAmount(form.amount);
    if (!title || amount <= 0) return alert("Gider adı ve tutar gir.");
    const payload = { id: String(Date.now()), title, amount, category: form.category || (isCard ? "Kredi Kartı" : "Diğer"), note: form.note || "" };
    if (isCard) {
      setCardExpenses((current) => [payload, ...current]);
      setCardForm({ title: "", category: "", amount: "", note: "" });
    } else {
      setOtherExpenses((current) => [payload, ...current]);
      setOtherForm({ title: "", category: "", amount: "", note: "" });
    }
  };

  if (authLoading) return <main className="financePage authPage"><section className="authCard premiumAuthCard"><h1 className="authTitle premiumAuthTitle">Yükleniyor...</h1></section></main>;

  if (!session) {
    return (
      <main className="financePage authPage">
        <section className="authCard premiumAuthCard">
          <div className="authGlow authGlowOne" />
          <div className="authGlow authGlowTwo" />
          <div className="authBrandRow"><div className="authLogo">₺</div><div><div className="authBrandTitle">Kişisel Finans Yönetimi</div><div className="authBrandSub">Güvenli kullanıcı paneli</div></div></div>
          <h1 className="authTitle premiumAuthTitle">{authMode === "register" ? "Hesap Oluştur" : "Giriş Yap"}</h1>
          {authMode === "register" ? <InputBox label="Ad Soyad" value={fullName} placeholder="Ad Soyad" onChange={setFullName} /> : null}
          <InputBox label="E-posta" type="email" value={email} placeholder="ornek@mail.com" onChange={setEmail} />
          <InputBox label="Şifre" type="password" value={password} placeholder="Şifren" onChange={setPassword} />
          {authMode === "register" ? <InputBox label="Şifre Tekrar" type="password" value={passwordAgain} placeholder="Şifre tekrar" onChange={setPasswordAgain} /> : null}
          <div className="authOptionsRow">
            <label className="rememberBox"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Beni hatırla</span></label>
            <button type="button" className="linkButton" onClick={handleForgotPassword}>Şifremi unuttum</button>
          </div>
          {authMessage ? <div className="authMessage">{authMessage}</div> : null}
          <div className="authButtons">
            {authMode === "register" ? <button type="button" className="premiumButton authPrimaryButton" onClick={handleRegister}>Kaydı Oluştur</button> : <button type="button" className="premiumButton authPrimaryButton" onClick={handleLogin}>Giriş Yap</button>}
            <button type="button" className="secondaryButton authSecondaryButton" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "Giriş Ekranına Dön" : "Hesap Oluştur"}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="financePage">
      <div className="financeShell">
        <header className="topHeader appHeader">
          <div><div className="topBadge">Kişisel Finans Yönetimi</div><p className="saveStatus">{saving ? "Kaydediliyor..." : "Veriler Supabase üzerinde güvende"}</p></div>
          <button type="button" className="secondaryButton" onClick={handleLogout}>Çıkış Yap</button>
        </header>

        <div className="tabBar">
          <button type="button" className={activeTab === "finance" ? "tabButton active" : "tabButton"} onClick={() => setActiveTab("finance")}>Gelir / Gider</button>
          <button type="button" className={activeTab === "investments" ? "tabButton active" : "tabButton"} onClick={() => setActiveTab("investments")}>Yatırımlar</button>
          <button type="button" className={activeTab === "routines" ? "tabButton active" : "tabButton"} onClick={() => setActiveTab("routines")}>Haftalık Rutin</button>
        </div>

        {dataLoading ? <section className="panelCard"><div className="emptyState"><strong>Veriler yükleniyor...</strong></div></section> : null}

        {activeTab === "finance" ? (
          <>
            <section className="summaryGrid">
              <SummaryCard tone="green" title="Toplam Gelir" value={money(financeTotals.totalIncome)} detail={`Yemek parası: ${money(financeTotals.mealAllowance)} • Gelire dahil değil`} />
              <SummaryCard tone="red" title="Toplam Gider" value={money(financeTotals.totalExpense)} detail="Kredi + kart + diğer giderler" />
              <SummaryCard tone="blue" title="Aylık Kalan" value={money(financeTotals.balance)} detail="Gelir - gider hesabı" />
              <SummaryCard tone="purple" title="Toplam Borç" value={money(financeTotals.totalDebt)} detail="Kredi + kart + diğer borçlar" />
            </section>

            <Panel title="Gelirler" subtitle="Maaş, yemek parası ve ek gelirler" totalLabel="Toplam Gelir" total={money(financeTotals.totalIncome)} open={incomeOpen} onToggle={() => setIncomeOpen((value) => !value)}>
              <div className="formGrid two"><InputBox label="Maaş" value={income.salary} placeholder="0" onChange={(value) => setIncome((current) => ({ ...current, salary: formatInput(value) }))} /><InputBox label="Yemek Parası" value={income.mealAllowance} placeholder="0" onChange={(value) => setIncome((current) => ({ ...current, mealAllowance: formatInput(value) }))} /></div>
              <MiniPanel title="Ek Gelirler" totalLabel="Ek Gelir" total={money(financeTotals.extraIncomeTotal)} color="mint" open onToggle={() => {}}>
                <div className="formGrid three"><InputBox label="Ek Gelir Adı" value={extraForm.title} placeholder="Örn: Prim" onChange={(value) => setExtraForm((current) => ({ ...current, title: value }))} /><InputBox label="Tutar" value={extraForm.amount} placeholder="0" onChange={(value) => setExtraForm((current) => ({ ...current, amount: formatInput(value) }))} /><button type="button" className="premiumButton" onClick={addExtraIncome}>Ek Gelir Ekle</button></div>
                <RecordList items={extraIncomes} money={money} onDelete={(id) => setExtraIncomes((current) => current.filter((item) => item.id !== id))} />
              </MiniPanel>
            </Panel>

            <Panel title="Giderler" subtitle="Krediler, kart ve diğer giderler" totalLabel="Toplam Gider" total={money(financeTotals.totalExpense)} open={expenseOpen} onToggle={() => setExpenseOpen((value) => !value)}>
              <MiniPanel title="Krediler" totalLabel="Kredi Ödemesi" total={money(financeTotals.creditTotal)} color="purple" open onToggle={() => {}}>
                <div className="formGrid five"><InputBox label="Kredi Adı" value={creditForm.title} placeholder="Örn: Kredi" onChange={(value) => setCreditForm((current) => ({ ...current, title: value }))} /><InputBox label="Taksit Tutarı" value={creditForm.monthlyPayment} placeholder="0" onChange={(value) => setCreditForm((current) => ({ ...current, monthlyPayment: formatInput(value) }))} /><InputBox label="Taksit" value={creditForm.installmentText} placeholder="Örn: 8/24" onChange={(value) => setCreditForm((current) => ({ ...current, installmentText: value }))} /><InputBox label="Kalan Borç" value={creditForm.remainingDebt} placeholder="0" onChange={(value) => setCreditForm((current) => ({ ...current, remainingDebt: formatInput(value) }))} /><InputBox label="Başlangıç" type="date" value={creditForm.paymentStartDate} onChange={(value) => setCreditForm((current) => ({ ...current, paymentStartDate: value }))} /><button type="button" className="premiumButton wide" onClick={addCredit}>Kredi Ekle</button></div>
                <CreditList items={credits} money={money} onDelete={(id) => setCredits((current) => current.filter((item) => item.id !== id))} />
              </MiniPanel>

              <MiniPanel title="Kredi Kartı Giderleri" totalLabel="Kart" total={money(financeTotals.cardTotal)} color="rose" open onToggle={() => {}}>
                <ExpenseForm form={cardForm} setForm={setCardForm} onAdd={() => addExpense("card")} buttonText="Kart Gideri Ekle" />
                <RecordList items={cardExpenses} money={money} onDelete={(id) => setCardExpenses((current) => current.filter((item) => item.id !== id))} />
              </MiniPanel>

              <MiniPanel title="Diğer Borç / Nakit Giderler" totalLabel="Diğer" total={money(financeTotals.otherTotal)} color="orange" open onToggle={() => {}}>
                <ExpenseForm form={otherForm} setForm={setOtherForm} onAdd={() => addExpense("other")} buttonText="Diğer Gider Ekle" />
                <RecordList items={otherExpenses} money={money} onDelete={(id) => setOtherExpenses((current) => current.filter((item) => item.id !== id))} />
              </MiniPanel>
            </Panel>
          </>
        ) : null}

        {activeTab === "investments" ? <InvestmentLedger investments={investments} setInvestments={setInvestments} /> : null}
        {activeTab === "routines" ? <RoutinePlanner routines={routines} setRoutines={setRoutines} /> : null}
      </div>
    </main>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  return <article className={`summaryCard ${tone}`}><div className="summaryLabel">{title}</div><div className={`summaryValue summaryValue-${tone}`}>{value}</div><div className="summaryDetail">{detail}</div></article>;
}

function Panel({ title, subtitle, totalLabel, total, open, onToggle, children }) {
  return <section className="panelCard"><button type="button" className="panelHeader" onClick={onToggle}><div><h2 className="gradientTitle">{title}</h2><p>{subtitle}</p></div><div className="panelRight"><div className="panelTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="toggleButton">{open ? "−" : "+"}</div></div></button>{open ? <div className="panelBody">{children}</div> : null}</section>;
}

function MiniPanel({ title, totalLabel, total, color, open, onToggle, children }) {
  return <section className={`miniPanel ${color}`}><button type="button" className="miniHeader" onClick={onToggle}><div><h3 className={`miniTitle miniTitle-${color}`}>{title}</h3></div><div className="miniRight"><div className="miniTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="miniToggle">{open ? "−" : "+"}</div></div></button>{open ? <div className="miniBody">{children}</div> : null}</section>;
}

function InputBox({ label, value, onChange, type = "text", placeholder = "" }) {
  return <label className="inputBox"><span>{label}</span><input type={type} value={value} placeholder={placeholder} inputMode={type === "date" ? undefined : "text"} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ExpenseForm({ form, setForm, onAdd, buttonText }) {
  return <div className="formGrid four"><InputBox label="Gider Adı" value={form.title} placeholder="Örn: Market" onChange={(value) => setForm((current) => ({ ...current, title: value }))} /><InputBox label="Kategori" value={form.category} placeholder="Örn: Alışveriş" onChange={(value) => setForm((current) => ({ ...current, category: value }))} /><InputBox label="Tutar" value={form.amount} placeholder="0" onChange={(value) => setForm((current) => ({ ...current, amount: formatInput(value) }))} /><InputBox label="Not" value={form.note} placeholder="Opsiyonel" onChange={(value) => setForm((current) => ({ ...current, note: value }))} /><button type="button" className="premiumButton wide" onClick={onAdd}>{buttonText}</button></div>;
}

function RecordList({ items, money, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz kayıt bulunmuyor." />;
  return <div className="recordList">{items.map((item) => <div key={item.id} className="simpleRecord"><div className="simpleRecordTop"><div><h4>{item.title}</h4><p>{item.category || "Kayıt"}{item.note ? ` • ${item.note}` : ""}</p></div><div className="simpleRecordRight"><strong>{money(item.amount)}</strong><button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>Sil</button></div></div></div>)}</div>;
}

function CreditList({ items, money, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz kredi kaydı bulunmuyor." />;
  return <div className="recordList">{items.map((item) => <div key={item.id} className="simpleRecord"><div className="simpleRecordTop"><div><h4>{item.title}</h4><p>Taksit: {item.installmentText || "-"} • Kalan borç: {money(item.remainingDebt)} • Başlangıç: {item.paymentStartDate || "Aktif"}</p></div><div className="simpleRecordRight"><strong>{money(item.monthlyPayment)}</strong><button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>Sil</button></div></div></div>)}</div>;
}

function EmptyState({ text }) {
  return <div className="emptyState"><strong>{text}</strong><span>Yeni kayıt eklediğinde burada görüntülenecek.</span></div>;
}

