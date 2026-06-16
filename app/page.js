"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import BesProjectionPanel from "../components/BesProjectionPanel";

const LOCAL_BACKUP_KEY = "kisisel-finans-panel-local-backup";

const emptyIncome = { salary: "", mealAllowance: "" };
const emptyExtraIncome = { title: "", amount: "" };
const emptyCredit = {
  title: "",
  monthlyPayment: "",
  installmentText: "",
  remainingDebt: "",
  paymentStartDate: "",
};
const emptyExpense = { title: "", category: "", amount: "", note: "" };
const emptyInvestments = { bes: [], locked: [], gold: [], crypto: [] };
const emptyBesForm = {
  title: "",
  totalAmount: "",
  monthlyContribution: "",
  expectedReturn: "",
  note: "",
};
const emptyLockedForm = { title: "", amount: "", unlockDate: "", note: "" };
const emptyAssetForm = {
  title: "",
  quantity: "",
  buyPrice: "",
  currentPrice: "",
  note: "",
};
const emptyFinanceData = {
  income: emptyIncome,
  extraIncomes: [],
  credits: [],
  cardExpenses: [],
  otherExpenses: [],
  investments: emptyInvestments,
};

function onlyDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function parseAmount(value) {
  return Number(onlyDigits(value));
}

function parseDecimal(value) {
  return (
    Number(
      String(value || "")
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
    ) || 0
  );
}

function formatNumberInput(value) {
  const digits = onlyDigits(value);
  return digits ? new Intl.NumberFormat("tr-TR").format(Number(digits)) : "";
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function daysUntil(dateText) {
  if (!dateText) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateText);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function normalizeFinanceData(data) {
  if (!data) return emptyFinanceData;

  return {
    income: {
      salary: formatNumberInput(data.income?.salary || ""),
      mealAllowance: formatNumberInput(data.income?.mealAllowance || ""),
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
    },
  };
}

function getLocalBackup() {
  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);
    return raw ? normalizeFinanceData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveLocalBackup(payload) {
  try {
    window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
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
  const [pendingEmail, setPendingEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  const [incomeOpen, setIncomeOpen] = useState(true);
  const [extraIncomeOpen, setExtraIncomeOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(true);
  const [cardsOpen, setCardsOpen] = useState(true);
  const [othersOpen, setOthersOpen] = useState(true);

  const [investmentOpen, setInvestmentOpen] = useState(true);
  const [besOpen, setBesOpen] = useState(true);
  const [lockedOpen, setLockedOpen] = useState(true);
  const [goldOpen, setGoldOpen] = useState(true);
  const [cryptoOpen, setCryptoOpen] = useState(true);

  const [income, setIncome] = useState(emptyIncome);
  const [extraIncomes, setExtraIncomes] = useState([]);
  const [credits, setCredits] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [investments, setInvestments] = useState(emptyInvestments);

  const [extraIncomeForm, setExtraIncomeForm] = useState(emptyExtraIncome);
  const [creditForm, setCreditForm] = useState(emptyCredit);
  const [cardForm, setCardForm] = useState(emptyExpense);
  const [otherForm, setOtherForm] = useState(emptyExpense);
  const [besForm, setBesForm] = useState(emptyBesForm);
  const [lockedForm, setLockedForm] = useState(emptyLockedForm);
  const [goldForm, setGoldForm] = useState(emptyAssetForm);
  const [cryptoForm, setCryptoForm] = useState(emptyAssetForm);

  const [editingExtraIncomeId, setEditingExtraIncomeId] = useState(null);
  const [editingCreditId, setEditingCreditId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingOtherId, setEditingOtherId] = useState(null);
  const [editingBesId, setEditingBesId] = useState(null);
  const [editingLockedId, setEditingLockedId] = useState(null);
  const [editingGoldId, setEditingGoldId] = useState(null);
  const [editingCryptoId, setEditingCryptoId] = useState(null);

  useEffect(() => {
    try {
      const rememberedEmail = window.localStorage.getItem("remembered-finance-email");
      if (rememberedEmail) setEmail(rememberedEmail);
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

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

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

    const timer = setTimeout(saveFinanceData, 650);
    return () => clearTimeout(timer);
  }, [
    income,
    extraIncomes,
    credits,
    cardExpenses,
    otherExpenses,
    investments,
    session,
    financeLoaded,
  ]);

  const currentPayload = () => ({
    income,
    extraIncomes,
    credits,
    cardExpenses,
    otherExpenses,
    investments,
  });

  const loadFinanceData = async (userId) => {
    setDataLoading(true);

    const { data, error } = await supabase
      .from("user_finance_data")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) console.log(error);

    let normalized = normalizeFinanceData(data?.data);

    const hasCloudData =
      normalized.income.salary ||
      normalized.income.mealAllowance ||
      normalized.extraIncomes.length ||
      normalized.credits.length ||
      normalized.cardExpenses.length ||
      normalized.otherExpenses.length ||
      normalized.investments.bes.length ||
      normalized.investments.locked.length ||
      normalized.investments.gold.length ||
      normalized.investments.crypto.length;

    if (!hasCloudData) {
      const localBackup = getLocalBackup();
      if (localBackup) normalized = localBackup;
    }

    setIncome(normalized.income);
    setExtraIncomes(normalized.extraIncomes);
    setCredits(normalized.credits);
    setCardExpenses(normalized.cardExpenses);
    setOtherExpenses(normalized.otherExpenses);
    setInvestments(normalized.investments);

    setFinanceLoaded(true);
    setDataLoading(false);
  };

  const saveFinanceData = async () => {
    if (!session?.user || !supabase) return;

    const payload = currentPayload();
    saveLocalBackup(payload);
    setSaving(true);

    const { error } = await supabase
      .from("user_finance_data")
      .upsert({ user_id: session.user.id, data: payload }, { onConflict: "user_id" });

    if (error) console.log(error);
    setSaving(false);
  };

  const handleRegister = async () => {
    setAuthMessage("");

    if (!supabase) return setAuthMessage("Supabase bağlantısı eksik.");
    if (!fullName.trim() || !email.trim() || !password.trim() || !passwordAgain.trim()) {
      return setAuthMessage("Ad soyad, e-posta, şifre ve şifre tekrarı gir.");
    }
    if (!email.includes("@")) return setAuthMessage("Geçerli bir e-posta adresi gir.");
    if (password.length < 6) return setAuthMessage("Şifre en az 6 karakter olmalı.");
    if (password !== passwordAgain) return setAuthMessage("Şifreler eşleşmiyor.");

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return setAuthMessage(error.message);

    setPendingEmail(cleanEmail);
    setAuthMode("verify");
    setAuthMessage("Hesap oluşturuldu. Mailine gelen doğrulama kodunu gir.");
  };

  const handleVerifyCode = async () => {
    setAuthMessage("");

    if (!pendingEmail || !verificationCode.trim()) {
      return setAuthMessage("Doğrulama kodunu gir.");
    }

    const firstTry = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: verificationCode.trim(),
      type: "signup",
    });

    if (firstTry.error) {
      const secondTry = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: verificationCode.trim(),
        type: "email",
      });

      if (secondTry.error) return setAuthMessage("Kod doğrulanamadı. Kodu kontrol et.");
    }

    setAuthMessage("Hesap doğrulandı. Şimdi giriş yapabilirsin.");
    setAuthMode("login");
    setVerificationCode("");
    setPassword("");
    setPasswordAgain("");
  };

  const handleResendCode = async () => {
    const targetEmail = pendingEmail || email.trim().toLowerCase();

    if (!targetEmail) return setAuthMessage("Önce e-posta adresini gir.");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
    });

    setAuthMessage(error ? error.message : "Yeni doğrulama kodu gönderildi.");
  };

  const handleLogin = async () => {
    setAuthMessage("");

    if (!email.trim() || !password.trim()) {
      return setAuthMessage("E-posta ve şifre gir.");
    }

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return setAuthMessage(
        "Giriş başarısız. E-posta doğrulanmamış olabilir veya şifre hatalı olabilir."
      );
    }

    try {
      if (rememberMe) {
        window.localStorage.setItem("remembered-finance-email", cleanEmail);
      } else {
        window.localStorage.removeItem("remembered-finance-email");
      }
    } catch {}
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      return setAuthMessage("Şifre sıfırlama için e-posta adresini gir.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin }
    );

    setAuthMessage(
      error ? error.message : "Şifre sıfırlama bağlantısı e-posta adresine gönderildi."
    );
  };

  const handleLogout = async () => {
    await saveFinanceData();
    await supabase.auth.signOut();
    setSession(null);
  };

  const isCreditActive = (dateText) => {
    if (!dateText) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(dateText);
    start.setHours(0, 0, 0, 0);

    return start <= today;
  };

  const parseInstallment = (text) => {
    const cleanText = String(text || "").replace(/\s/g, "");

    if (!cleanText.includes("/")) return { percent: 0, completed: false };

    const [currentRaw, totalRaw] = cleanText.split("/");
    const current = Number(currentRaw || 0);
    const total = Number(totalRaw || 0);

    if (!current || !total || total <= 0) {
      return { percent: 0, completed: false };
    }

    const percent = Math.min(100, Math.round((current / total) * 100));

    return {
      percent,
      completed: current >= total,
    };
  };

  const financeTotals = useMemo(() => {
    const salary = parseAmount(income.salary);
    const mealAllowance = parseAmount(income.mealAllowance);

    const extraIncomeTotal = extraIncomes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalIncome = salary + extraIncomeTotal;

    const activeCreditTotal = credits.reduce(
      (sum, item) =>
        isCreditActive(item.paymentStartDate)
          ? sum + Number(item.monthlyPayment || 0)
          : sum,
      0
    );

    const cardTotal = cardExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const otherTotal = otherExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const creditDebtTotal = credits.reduce(
      (sum, item) => sum + Number(item.remainingDebt || 0),
      0
    );

    const totalDebt = creditDebtTotal + cardTotal + otherTotal;
    const totalExpense = activeCreditTotal + cardTotal + otherTotal;

    return {
      mealAllowance,
      extraIncomeTotal,
      totalIncome,
      activeCreditTotal,
      cardTotal,
      otherTotal,
      creditDebtTotal,
      totalDebt,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [income, extraIncomes, credits, cardExpenses, otherExpenses]);

  const investmentTotals = useMemo(() => {
    const besTotal = investments.bes.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    const lockedTotal = investments.locked.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const goldCost = investments.gold.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.buyPrice || 0),
      0
    );

    const goldValue = investments.gold.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.currentPrice || 0),
      0
    );

    const cryptoCost = investments.crypto.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.buyPrice || 0),
      0
    );

    const cryptoValue = investments.crypto.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.currentPrice || 0),
      0
    );

    const blockedTotal = besTotal + lockedTotal;
    const totalInvestment = blockedTotal + goldValue + cryptoValue;
    const totalCost = goldCost + cryptoCost;
    const totalPnl = goldValue + cryptoValue - totalCost;

    return {
      besTotal,
      lockedTotal,
      blockedTotal,
      goldValue,
      cryptoValue,
      totalInvestment,
      totalPnl,
      totalPnlRate: totalCost > 0 ? (totalPnl / totalCost) * 100 : 0,
      availableInvestment: totalInvestment - blockedTotal,
    };
  }, [investments]);

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

  const updateBesForm = (field, value) => {
    const amountFields = ["totalAmount", "monthlyContribution"];

    setBesForm((current) => ({
      ...current,
      [field]: amountFields.includes(field) ? formatNumberInput(value) : value,
    }));
  };

  const updateLockedForm = (field, value) => {
    setLockedForm((current) => ({
      ...current,
      [field]: field === "amount" ? formatNumberInput(value) : value,
    }));
  };

  const updateGoldForm = (field, value) => {
    const amountFields = ["buyPrice", "currentPrice"];

    setGoldForm((current) => ({
      ...current,
      [field]: amountFields.includes(field) ? formatNumberInput(value) : value,
    }));
  };

  const updateCryptoForm = (field, value) => {
    const amountFields = ["buyPrice", "currentPrice"];

    setCryptoForm((current) => ({
      ...current,
      [field]: amountFields.includes(field) ? formatNumberInput(value) : value,
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

  const resetBesForm = () => {
    setEditingBesId(null);
    setBesForm(emptyBesForm);
  };

  const resetLockedForm = () => {
    setEditingLockedId(null);
    setLockedForm(emptyLockedForm);
  };

  const resetGoldForm = () => {
    setEditingGoldId(null);
    setGoldForm(emptyAssetForm);
  };

  const resetCryptoForm = () => {
    setEditingCryptoId(null);
    setCryptoForm(emptyAssetForm);
  };

  const addOrUpdateExtraIncome = () => {
    const title = extraIncomeForm.title.trim();
    const amount = parseAmount(extraIncomeForm.amount);

    if (!title || amount <= 0) return alert("Ek gelir adı ve geçerli tutar gir.");

    if (editingExtraIncomeId) {
      setExtraIncomes((current) =>
        current.map((item) =>
          item.id === editingExtraIncomeId ? { ...item, title, amount } : item
        )
      );
      resetExtraIncomeForm();
      return;
    }

    setExtraIncomes((current) => [{ id: String(Date.now()), title, amount }, ...current]);
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
      return alert("Kredi adı ve taksit tutarı gir.");
    }

    if (!String(creditForm.installmentText || "").includes("/")) {
      return alert("Taksit alanını 8/24 formatında gir.");
    }

    const payload = {
      title,
      monthlyPayment,
      installmentText: creditForm.installmentText.trim(),
      remainingDebt,
      paymentStartDate: creditForm.paymentStartDate || "",
    };

    if (editingCreditId) {
      setCredits((current) =>
        current.map((item) =>
          item.id === editingCreditId ? { ...item, ...payload } : item
        )
      );
      resetCreditForm();
      return;
    }

    setCredits((current) => [{ id: String(Date.now()), ...payload }, ...current]);
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
    const setter = isCard ? setCardExpenses : setOtherExpenses;

    const title = form.title.trim();
    const amount = parseAmount(form.amount);

    if (!title || amount <= 0) return alert("Gider adı ve geçerli tutar gir.");

    const payload = {
      title,
      category: form.category.trim() || (isCard ? "Kredi Kartı" : "Diğer"),
      amount,
      note: form.note.trim(),
    };

    if (editingId) {
      setter((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
      );
      isCard ? resetCardForm() : resetOtherForm();
      return;
    }

    setter((current) => [{ id: String(Date.now()), ...payload }, ...current]);
    isCard ? setCardForm(emptyExpense) : setOtherForm(emptyExpense);
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

  const addOrUpdateBes = () => {
    const title = besForm.title.trim();
    const totalAmount = parseAmount(besForm.totalAmount);
    const monthlyContribution = parseAmount(besForm.monthlyContribution);

    if (!title || totalAmount <= 0) return alert("BES adı ve toplam birikim gir.");

    const payload = {
      title,
      totalAmount,
      monthlyContribution,
      expectedReturn: besForm.expectedReturn,
      note: besForm.note.trim(),
    };

    setInvestments((current) => ({
      ...current,
      bes: editingBesId
        ? current.bes.map((item) =>
            item.id === editingBesId ? { ...item, ...payload } : item
          )
        : [{ id: String(Date.now()), ...payload }, ...current.bes],
    }));

    resetBesForm();
  };

  const startEditBes = (item) => {
    setEditingBesId(item.id);
    setBesForm({
      title: item.title || "",
      totalAmount: formatNumberInput(item.totalAmount),
      monthlyContribution: formatNumberInput(item.monthlyContribution),
      expectedReturn: item.expectedReturn || "",
      note: item.note || "",
    });
    setInvestmentOpen(true);
    setBesOpen(true);
    setLockedOpen(true);
  };

  const addOrUpdateLocked = () => {
    const title = lockedForm.title.trim();
    const amount = parseAmount(lockedForm.amount);

    if (!title || amount <= 0 || !lockedForm.unlockDate) {
      return alert("Yatırım adı, tutar ve açılış tarihi gir.");
    }

    const payload = {
      title,
      amount,
      unlockDate: lockedForm.unlockDate,
      note: lockedForm.note.trim(),
    };

    setInvestments((current) => ({
      ...current,
      locked: editingLockedId
        ? current.locked.map((item) =>
            item.id === editingLockedId ? { ...item, ...payload } : item
          )
        : [{ id: String(Date.now()), ...payload }, ...current.locked],
    }));

    resetLockedForm();
  };

  const startEditLocked = (item) => {
    setEditingLockedId(item.id);
    setLockedForm({
      title: item.title || "",
      amount: formatNumberInput(item.amount),
      unlockDate: item.unlockDate || "",
      note: item.note || "",
    });
    setInvestmentOpen(true);
    setLockedOpen(true);
  };

  const addOrUpdateGold = () => {
    const title = goldForm.title.trim();
    const quantity = parseDecimal(goldForm.quantity);
    const buyPrice = parseAmount(goldForm.buyPrice);
    const currentPrice = parseAmount(goldForm.currentPrice);

    if (!title || quantity <= 0 || buyPrice <= 0 || currentPrice <= 0) {
      return alert("Altın adı, adet/gram, alış fiyatı ve güncel fiyat gir.");
    }

    const payload = {
      title,
      quantity,
      buyPrice,
      currentPrice,
      note: goldForm.note.trim(),
    };

    setInvestments((current) => ({
      ...current,
      gold: editingGoldId
        ? current.gold.map((item) =>
            item.id === editingGoldId ? { ...item, ...payload } : item
          )
        : [{ id: String(Date.now()), ...payload }, ...current.gold],
    }));

    resetGoldForm();
  };

  const startEditGold = (item) => {
    setEditingGoldId(item.id);
    setGoldForm({
      title: item.title || "",
      quantity: String(item.quantity || ""),
      buyPrice: formatNumberInput(item.buyPrice),
      currentPrice: formatNumberInput(item.currentPrice),
      note: item.note || "",
    });
    setInvestmentOpen(true);
    setGoldOpen(true);
  };

  const addOrUpdateCrypto = () => {
    const title = cryptoForm.title.trim().toUpperCase();
    const quantity = parseDecimal(cryptoForm.quantity);
    const buyPrice = parseAmount(cryptoForm.buyPrice);
    const currentPrice = parseAmount(cryptoForm.currentPrice);

    if (!title || quantity <= 0 || buyPrice <= 0 || currentPrice <= 0) {
      return alert("Coin adı, adet, alış fiyatı ve güncel fiyat gir.");
    }

    const payload = {
      title,
      quantity,
      buyPrice,
      currentPrice,
      note: cryptoForm.note.trim(),
    };

    setInvestments((current) => ({
      ...current,
      crypto: editingCryptoId
        ? current.crypto.map((item) =>
            item.id === editingCryptoId ? { ...item, ...payload } : item
          )
        : [{ id: String(Date.now()), ...payload }, ...current.crypto],
    }));

    resetCryptoForm();
  };

  const startEditCrypto = (item) => {
    setEditingCryptoId(item.id);
    setCryptoForm({
      title: item.title || "",
      quantity: String(item.quantity || ""),
      buyPrice: formatNumberInput(item.buyPrice),
      currentPrice: formatNumberInput(item.currentPrice),
      note: item.note || "",
    });
    setInvestmentOpen(true);
    setCryptoOpen(true);
  };

  if (authLoading) {
    return (
      <main className="financePage authPage">
        <section className="authCard premiumAuthCard">
          <h1 className="authTitle premiumAuthTitle">Yükleniyor...</h1>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <AuthView
        authMode={authMode}
        setAuthMode={setAuthMode}
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        passwordAgain={passwordAgain}
        setPasswordAgain={setPasswordAgain}
        pendingEmail={pendingEmail}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        authMessage={authMessage}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleVerifyCode={handleVerifyCode}
        handleResendCode={handleResendCode}
        handleForgotPassword={handleForgotPassword}
      />
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

        <div className="tabBar">
          <button
            type="button"
            className={activeTab === "finance" ? "tabButton active" : "tabButton"}
            onClick={() => setActiveTab("finance")}
          >
            Gelir / Gider
          </button>

          <button
            type="button"
            className={activeTab === "investments" ? "tabButton active" : "tabButton"}
            onClick={() => setActiveTab("investments")}
          >
            Yatırımlar
          </button>
        </div>

        {dataLoading ? (
          <section className="panelCard">
            <div className="emptyState">
              <strong>Veriler yükleniyor...</strong>
            </div>
          </section>
        ) : null}

        {activeTab === "finance" ? (
          <FinanceTab
            financeTotals={financeTotals}
            income={income}
            updateIncome={updateIncome}
            incomeOpen={incomeOpen}
            setIncomeOpen={setIncomeOpen}
            extraIncomeOpen={extraIncomeOpen}
            setExtraIncomeOpen={setExtraIncomeOpen}
            extraIncomeForm={extraIncomeForm}
            updateExtraIncomeForm={updateExtraIncomeForm}
            addOrUpdateExtraIncome={addOrUpdateExtraIncome}
            editingExtraIncomeId={editingExtraIncomeId}
            resetExtraIncomeForm={resetExtraIncomeForm}
            extraIncomes={extraIncomes}
            startEditExtraIncome={startEditExtraIncome}
            setExtraIncomes={setExtraIncomes}
            expensesOpen={expensesOpen}
            setExpensesOpen={setExpensesOpen}
            creditsOpen={creditsOpen}
            setCreditsOpen={setCreditsOpen}
            creditForm={creditForm}
            updateCreditForm={updateCreditForm}
            addOrUpdateCredit={addOrUpdateCredit}
            editingCreditId={editingCreditId}
            resetCreditForm={resetCreditForm}
            credits={credits}
            parseInstallment={parseInstallment}
            isCreditActive={isCreditActive}
            startEditCredit={startEditCredit}
            setCredits={setCredits}
            cardsOpen={cardsOpen}
            setCardsOpen={setCardsOpen}
            cardForm={cardForm}
            updateCardForm={updateCardForm}
            addOrUpdateSimpleExpense={addOrUpdateSimpleExpense}
            editingCardId={editingCardId}
            resetCardForm={resetCardForm}
            cardExpenses={cardExpenses}
            startEditCard={startEditCard}
            setCardExpenses={setCardExpenses}
            othersOpen={othersOpen}
            setOthersOpen={setOthersOpen}
            otherForm={otherForm}
            updateOtherForm={updateOtherForm}
            editingOtherId={editingOtherId}
            resetOtherForm={resetOtherForm}
            otherExpenses={otherExpenses}
            startEditOther={startEditOther}
            setOtherExpenses={setOtherExpenses}
          />
        ) : null}

        {activeTab === "investments" ? (
          <InvestmentsTab
            investmentTotals={investmentTotals}
            investmentOpen={investmentOpen}
            setInvestmentOpen={setInvestmentOpen}
            besOpen={besOpen}
            setBesOpen={setBesOpen}
            besForm={besForm}
            updateBesForm={updateBesForm}
            addOrUpdateBes={addOrUpdateBes}
            editingBesId={editingBesId}
            resetBesForm={resetBesForm}
            investments={investments}
            startEditBes={startEditBes}
            setInvestments={setInvestments}
            lockedOpen={lockedOpen}
            setLockedOpen={setLockedOpen}
            lockedForm={lockedForm}
            updateLockedForm={updateLockedForm}
            addOrUpdateLocked={addOrUpdateLocked}
            editingLockedId={editingLockedId}
            resetLockedForm={resetLockedForm}
            startEditLocked={startEditLocked}
            goldOpen={goldOpen}
            setGoldOpen={setGoldOpen}
            goldForm={goldForm}
            updateGoldForm={updateGoldForm}
            addOrUpdateGold={addOrUpdateGold}
            editingGoldId={editingGoldId}
            resetGoldForm={resetGoldForm}
            startEditGold={startEditGold}
            cryptoOpen={cryptoOpen}
            setCryptoOpen={setCryptoOpen}
            cryptoForm={cryptoForm}
            updateCryptoForm={updateCryptoForm}
            addOrUpdateCrypto={addOrUpdateCrypto}
            editingCryptoId={editingCryptoId}
            resetCryptoForm={resetCryptoForm}
            startEditCrypto={startEditCrypto}
          />
        ) : null}
      </div>
    </main>
  );
}

function AuthView(props) {
  const {
    authMode,
    setAuthMode,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    passwordAgain,
    setPasswordAgain,
    pendingEmail,
    verificationCode,
    setVerificationCode,
    rememberMe,
    setRememberMe,
    authMessage,
    handleLogin,
    handleRegister,
    handleVerifyCode,
    handleResendCode,
    handleForgotPassword,
  } = props;

  return (
    <main className="financePage authPage">
      <section className="authCard premiumAuthCard">
        <div className="authGlow authGlowOne" />
        <div className="authGlow authGlowTwo" />

        <div className="authBrandRow">
          <div className="authLogo">₺</div>
          <div>
            <div className="authBrandTitle">Kişisel Finans Yönetimi</div>
            <div className="authBrandSub">
              {authMode === "verify"
                ? "OTP doğrulama ekranı"
                : authMode === "register"
                ? "Yeni hesap oluştur"
                : "Güvenli kullanıcı paneli"}
            </div>
          </div>
        </div>

        <h1 className="authTitle premiumAuthTitle">
          {authMode === "verify"
            ? "Kodu Gir"
            : authMode === "register"
            ? "Hesap Oluştur"
            : "Giriş Yap"}
        </h1>

        <p className="authText premiumAuthText">
          {authMode === "verify"
            ? `${pendingEmail} adresine gelen doğrulama kodunu gir.`
            : authMode === "register"
            ? "Ad soyad, e-posta ve şifre bilgilerini gir."
            : "E-posta ve şifreyle giriş yap."}
        </p>

        {authMode === "verify" ? (
          <>
            <label className="authInputBox fullAuthInput">
              <span>Doğrulama Kodu</span>
              <input
                value={verificationCode}
                placeholder="Mailine gelen kod"
                onChange={(event) => setVerificationCode(event.target.value)}
              />
            </label>

            {authMessage ? <div className="authMessage">{authMessage}</div> : null}

            <div className="authButtons">
              <button
                type="button"
                className="premiumButton authPrimaryButton"
                onClick={handleVerifyCode}
              >
                Kodu Doğrula
              </button>

              <button
                type="button"
                className="secondaryButton authSecondaryButton"
                onClick={handleResendCode}
              >
                Kodu Tekrar Gönder
              </button>

              <button
                type="button"
                className="linkButton authBackButton"
                onClick={() => setAuthMode("login")}
              >
                Giriş ekranına dön
              </button>
            </div>
          </>
        ) : authMode === "register" ? (
          <>
            <div className="authFormGrid">
              <InputBox label="Ad Soyad" value={fullName} placeholder="Ad Soyad" onChange={setFullName} />
              <InputBox label="E-posta" type="email" value={email} placeholder="ornek@mail.com" onChange={setEmail} />
              <InputBox label="Şifre" type="password" value={password} placeholder="En az 6 karakter" onChange={setPassword} />
              <InputBox label="Şifre Tekrarı" type="password" value={passwordAgain} placeholder="Şifreyi tekrar gir" onChange={setPasswordAgain} />
            </div>

            {authMessage ? <div className="authMessage">{authMessage}</div> : null}

            <div className="authButtons">
              <button type="button" className="premiumButton authPrimaryButton" onClick={handleRegister}>
                Kaydı Oluştur
              </button>

              <button type="button" className="secondaryButton authSecondaryButton" onClick={() => setAuthMode("login")}>
                Giriş Ekranına Dön
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="authFormGrid">
              <InputBox label="E-posta" type="email" value={email} placeholder="ornek@mail.com" onChange={setEmail} />
              <InputBox label="Şifre" type="password" value={password} placeholder="Şifren" onChange={setPassword} />
            </div>

            <div className="authOptionsRow">
              <label className="rememberBox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Beni hatırla</span>
              </label>

              <button type="button" className="linkButton" onClick={handleForgotPassword}>
                Şifremi unuttum
              </button>
            </div>

            {authMessage ? <div className="authMessage">{authMessage}</div> : null}

            <div className="authButtons">
              <button type="button" className="premiumButton authPrimaryButton" onClick={handleLogin}>
                Giriş Yap
              </button>

              <button type="button" className="secondaryButton authSecondaryButton" onClick={() => setAuthMode("register")}>
                Hesap Oluştur
              </button>
            </div>
          </>
        )}

        <div className="authFooterNote">
          {authMode === "verify"
            ? "Mailine gelen kodu girdikten sonra hesabın doğrulanır."
            : authMode === "register"
            ? "Kayıt sonrası OTP doğrulama ekranına geçilir."
            : "İlk kez kullanıyorsan Hesap Oluştur butonuna bas."}
        </div>
      </section>
    </main>
  );
}

function FinanceTab(props) {
  const p = props;

  return (
    <>
      <section className="summaryGrid">
        <SummaryCard
          tone="green"
          title="Toplam Gelir"
          value={money(p.financeTotals.totalIncome)}
          detail={`Yemek parası: ${money(p.financeTotals.mealAllowance)} • Gelire dahil değil`}
        />
        <SummaryCard
          tone="red"
          title="Toplam Gider"
          value={money(p.financeTotals.totalExpense)}
          detail="Kredi + kart + diğer giderler"
        />
        <SummaryCard
          tone="blue"
          title="Aylık Kalan"
          value={money(p.financeTotals.balance)}
          detail="Gelir - gider hesabı"
        />
        <SummaryCard
          tone="purple"
          title="Toplam Borç"
          value={money(p.financeTotals.totalDebt)}
          detail="Kredi + kart + diğer borçlar"
        />
      </section>

      <Panel
        title="Gelirler"
        subtitle="Maaş, yemek parası ve ek gelir yönetimi"
        totalLabel="Toplam Gelir"
        total={money(p.financeTotals.totalIncome)}
        open={p.incomeOpen}
        onToggle={() => p.setIncomeOpen((value) => !value)}
      >
        <div className="formGrid two">
          <InputBox label="Maaş" value={p.income.salary} placeholder="0" onChange={(value) => p.updateIncome("salary", value)} />
          <InputBox label="Yemek Parası" value={p.income.mealAllowance} placeholder="0" onChange={(value) => p.updateIncome("mealAllowance", value)} />
        </div>

        <MiniPanel
          title="Ek Gelirler"
          totalLabel="Total Ek Gelir"
          total={money(p.financeTotals.extraIncomeTotal)}
          color="mint"
          open={p.extraIncomeOpen}
          onToggle={() => p.setExtraIncomeOpen((value) => !value)}
        >
          <div className="formGrid three">
            <InputBox label="Ek Gelir Adı" value={p.extraIncomeForm.title} placeholder="Örn: Prim" onChange={(value) => p.updateExtraIncomeForm("title", value)} />
            <InputBox label="Tutar" value={p.extraIncomeForm.amount} placeholder="0" onChange={(value) => p.updateExtraIncomeForm("amount", value)} />
            <button type="button" className="premiumButton" onClick={p.addOrUpdateExtraIncome}>
              {p.editingExtraIncomeId ? "Ek Geliri Güncelle" : "Ek Gelir Ekle"}
            </button>
          </div>

          {p.editingExtraIncomeId ? (
            <button type="button" className="deleteButton" onClick={p.resetExtraIncomeForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <IncomeList
            items={p.extraIncomes}
            money={money}
            onEdit={p.startEditExtraIncome}
            onDelete={(id) => p.setExtraIncomes((current) => current.filter((item) => item.id !== id))}
          />
        </MiniPanel>
      </Panel>

      <Panel
        title="Giderler"
        subtitle="Krediler, kredi kartı ve diğer borç/giderler"
        totalLabel="Toplam Gider"
        total={money(p.financeTotals.totalExpense)}
        open={p.expensesOpen}
        onToggle={() => p.setExpensesOpen((value) => !value)}
      >
        <MiniPanel
          title="Krediler"
          totalLabel="Total Kredi Ödemesi"
          total={money(p.financeTotals.activeCreditTotal)}
          color="purple"
          open={p.creditsOpen}
          onToggle={() => p.setCreditsOpen((value) => !value)}
        >
          <p className="sectionDescription">
            Taksit alanını <strong>8/24</strong> formatında yaz. Ödeme başlangıç tarihi gelmeyen krediler toplam gidere eklenmez.
          </p>

          <div className="formGrid five">
            <InputBox label="Kredi Adı" value={p.creditForm.title} placeholder="Örn: Garanti Kredi" onChange={(value) => p.updateCreditForm("title", value)} />
            <InputBox label="Taksit Tutarı" value={p.creditForm.monthlyPayment} placeholder="0" onChange={(value) => p.updateCreditForm("monthlyPayment", value)} />
            <InputBox label="Taksit" value={p.creditForm.installmentText} placeholder="Örn: 8/24" onChange={(value) => p.updateCreditForm("installmentText", value)} />
            <InputBox label="Kalan Borç" value={p.creditForm.remainingDebt} placeholder="0" onChange={(value) => p.updateCreditForm("remainingDebt", value)} />
            <InputBox label="Ödeme Başlangıç Tarihi" type="date" value={p.creditForm.paymentStartDate} onChange={(value) => p.updateCreditForm("paymentStartDate", value)} />

            <button type="button" className="premiumButton wide" onClick={p.addOrUpdateCredit}>
              {p.editingCreditId ? "Krediyi Güncelle" : "Kredi Ekle"}
            </button>
          </div>

          {p.editingCreditId ? (
            <button type="button" className="deleteButton" onClick={p.resetCreditForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <CreditList
            items={p.credits}
            money={money}
            parseInstallment={p.parseInstallment}
            isCreditActive={p.isCreditActive}
            onEdit={p.startEditCredit}
            onDelete={(id) => p.setCredits((current) => current.filter((item) => item.id !== id))}
          />
        </MiniPanel>

        <MiniPanel
          title="Kredi Kartı Giderleri"
          totalLabel="Total Kredi Kartı"
          total={money(p.financeTotals.cardTotal)}
          color="rose"
          open={p.cardsOpen}
          onToggle={() => p.setCardsOpen((value) => !value)}
        >
          <SimpleExpenseForm
            form={p.cardForm}
            onChange={p.updateCardForm}
            onAdd={() => p.addOrUpdateSimpleExpense("card")}
            buttonText={p.editingCardId ? "Kart Giderini Güncelle" : "Kart Gideri Ekle"}
          />

          {p.editingCardId ? (
            <button type="button" className="deleteButton" onClick={p.resetCardForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <SimpleExpenseList
            items={p.cardExpenses}
            money={money}
            onEdit={p.startEditCard}
            onDelete={(id) => p.setCardExpenses((current) => current.filter((item) => item.id !== id))}
          />
        </MiniPanel>

        <MiniPanel
          title="Diğer Borç / Nakit Giderler"
          totalLabel="Total Diğer"
          total={money(p.financeTotals.otherTotal)}
          color="orange"
          open={p.othersOpen}
          onToggle={() => p.setOthersOpen((value) => !value)}
        >
          <SimpleExpenseForm
            form={p.otherForm}
            onChange={p.updateOtherForm}
            onAdd={() => p.addOrUpdateSimpleExpense("other")}
            buttonText={p.editingOtherId ? "Diğer Gideri Güncelle" : "Diğer Gider Ekle"}
          />

          {p.editingOtherId ? (
            <button type="button" className="deleteButton" onClick={p.resetOtherForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <SimpleExpenseList
            items={p.otherExpenses}
            money={money}
            onEdit={p.startEditOther}
            onDelete={(id) => p.setOtherExpenses((current) => current.filter((item) => item.id !== id))}
          />
        </MiniPanel>
      </Panel>
    </>
  );
}

function InvestmentsTab(props) {
  const p = props;

  return (
    <>
      <section className="summaryGrid investmentSummaryGrid">
        <SummaryCard
          tone="green"
          title="Toplam Yatırım"
          value={money(p.investmentTotals.totalInvestment)}
          detail="BES + blokajlı + altın + kripto"
        />

        <SummaryCard
          tone="purple"
          title="Blokajlı Yatırım"
          value={money(p.investmentTotals.blockedTotal)}
          detail="BES + kilitli / blokajlı yatırımlar"
        />

        <SummaryCard
          tone="blue"
          title="Kullanılabilir"
          value={money(p.investmentTotals.availableInvestment)}
          detail="Toplam yatırım - blokajlı yatırım"
        />

        <SummaryCard
          tone={p.investmentTotals.totalPnl >= 0 ? "green" : "red"}
          title="Kar / Zarar"
          value={money(p.investmentTotals.totalPnl)}
          detail={`Oran: %${p.investmentTotals.totalPnlRate.toFixed(2)}`}
        />
      </section>

      <BesProjectionPanel />

      <Panel
        title="Yatırım Geliri"
        subtitle="Blokajlı yatırım, altın ve kripto takip paneli"
        totalLabel="Toplam Yatırım"
        total={money(p.investmentTotals.totalInvestment)}
        open={p.investmentOpen}
        onToggle={() => p.setInvestmentOpen((value) => !value)}
      >
        <MiniPanel
          title="Blokajlı Yatırımlar"
          totalLabel="Blokajlı Toplam"
          total={money(p.investmentTotals.blockedTotal)}
          color="purple"
          open={p.lockedOpen}
          onToggle={() => p.setLockedOpen((value) => !value)}
        >
          <MiniPanel
            title="BES Yatırımı"
            totalLabel="BES Toplam"
            total={money(p.investmentTotals.besTotal)}
            color="mint"
            open={p.besOpen}
            onToggle={() => p.setBesOpen((value) => !value)}
          >
            <div className="formGrid five">
              <InputBox label="BES Adı" value={p.besForm.title} placeholder="Örn: BES" onChange={(value) => p.updateBesForm("title", value)} />
              <InputBox label="Toplam Birikim" value={p.besForm.totalAmount} placeholder="0" onChange={(value) => p.updateBesForm("totalAmount", value)} />
              <InputBox label="Aylık Katkı" value={p.besForm.monthlyContribution} placeholder="0" onChange={(value) => p.updateBesForm("monthlyContribution", value)} />
              <InputBox label="Getiri Beklentisi" value={p.besForm.expectedReturn} placeholder="Örn: %25" onChange={(value) => p.updateBesForm("expectedReturn", value)} />
              <InputBox label="Not" value={p.besForm.note} placeholder="Opsiyonel" onChange={(value) => p.updateBesForm("note", value)} />

              <button type="button" className="premiumButton wide" onClick={p.addOrUpdateBes}>
                {p.editingBesId ? "BES Güncelle" : "BES Ekle"}
              </button>
            </div>

            {p.editingBesId ? (
              <button type="button" className="deleteButton" onClick={p.resetBesForm}>
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <BesList
              items={p.investments.bes}
              money={money}
              onEdit={p.startEditBes}
              onDelete={(id) =>
                p.setInvestments((current) => ({
                  ...current,
                  bes: current.bes.filter((item) => item.id !== id),
                }))
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Kilitli / Blokajlı Yatırım"
            totalLabel="Kilitli Toplam"
            total={money(p.investmentTotals.lockedTotal)}
            color="purple"
            open={true}
            onToggle={() => {}}
          >
            <div className="formGrid four">
              <InputBox label="Yatırım Adı" value={p.lockedForm.title} placeholder="Örn: Vadeli / Fon" onChange={(value) => p.updateLockedForm("title", value)} />
              <InputBox label="Tutar" value={p.lockedForm.amount} placeholder="0" onChange={(value) => p.updateLockedForm("amount", value)} />
              <InputBox label="Açılış Tarihi" type="date" value={p.lockedForm.unlockDate} onChange={(value) => p.updateLockedForm("unlockDate", value)} />
              <InputBox label="Not" value={p.lockedForm.note} placeholder="Opsiyonel" onChange={(value) => p.updateLockedForm("note", value)} />

              <button type="button" className="premiumButton wide" onClick={p.addOrUpdateLocked}>
                {p.editingLockedId ? "Kilitli Yatırımı Güncelle" : "Kilitli Yatırım Ekle"}
              </button>
            </div>

            {p.editingLockedId ? (
              <button type="button" className="deleteButton" onClick={p.resetLockedForm}>
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <LockedList
              items={p.investments.locked}
              money={money}
              onEdit={p.startEditLocked}
              onDelete={(id) =>
                p.setInvestments((current) => ({
                  ...current,
                  locked: current.locked.filter((item) => item.id !== id),
                }))
              }
            />
          </MiniPanel>
        </MiniPanel>

        <MiniPanel
          title="Altın Yatırımı"
          totalLabel="Altın Değeri"
          total={money(p.investmentTotals.goldValue)}
          color="orange"
          open={p.goldOpen}
          onToggle={() => p.setGoldOpen((value) => !value)}
        >
          <AssetForm
            form={p.goldForm}
            onChange={p.updateGoldForm}
            buttonText={p.editingGoldId ? "Altını Güncelle" : "Altın Ekle"}
            onAdd={p.addOrUpdateGold}
            nameLabel="Altın Türü"
            namePlaceholder="Örn: Gram Altın"
          />

          {p.editingGoldId ? (
            <button type="button" className="deleteButton" onClick={p.resetGoldForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <AssetList
            items={p.investments.gold}
            money={money}
            onEdit={p.startEditGold}
            onDelete={(id) =>
              p.setInvestments((current) => ({
                ...current,
                gold: current.gold.filter((item) => item.id !== id),
              }))
            }
          />
        </MiniPanel>

        <MiniPanel
          title="Kripto Yatırımı"
          totalLabel="Kripto Değeri"
          total={money(p.investmentTotals.cryptoValue)}
          color="rose"
          open={p.cryptoOpen}
          onToggle={() => p.setCryptoOpen((value) => !value)}
        >
          <AssetForm
            form={p.cryptoForm}
            onChange={p.updateCryptoForm}
            buttonText={p.editingCryptoId ? "Kriptoyu Güncelle" : "Kripto Ekle"}
            onAdd={p.addOrUpdateCrypto}
            nameLabel="Coin / Token"
            namePlaceholder="Örn: SOL"
          />

          {p.editingCryptoId ? (
            <button type="button" className="deleteButton" onClick={p.resetCryptoForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}

          <AssetList
            items={p.investments.crypto}
            money={money}
            onEdit={p.startEditCrypto}
            onDelete={(id) =>
              p.setInvestments((current) => ({
                ...current,
                crypto: current.crypto.filter((item) => item.id !== id),
              }))
            }
          />
        </MiniPanel>
      </Panel>
    </>
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

function MiniPanel({ title, totalLabel, total, color, open, onToggle, children }) {
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
        inputMode={type === "date" ? undefined : "text"}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SimpleExpenseForm({ form, onChange, onAdd, buttonText }) {
  return (
    <div className="formGrid four">
      <InputBox label="Gider Adı" value={form.title} placeholder="Örn: Market" onChange={(value) => onChange("title", value)} />
      <InputBox label="Kategori" value={form.category} placeholder="Örn: Alışveriş" onChange={(value) => onChange("category", value)} />
      <InputBox label="Tutar" value={form.amount} placeholder="0" onChange={(value) => onChange("amount", value)} />
      <InputBox label="Not" value={form.note} placeholder="Opsiyonel" onChange={(value) => onChange("note", value)} />

      <button type="button" className="premiumButton wide" onClick={onAdd}>
        {buttonText}
      </button>
    </div>
  );
}

function AssetForm({ form, onChange, onAdd, buttonText, nameLabel, namePlaceholder }) {
  return (
    <div className="formGrid five">
      <InputBox label={nameLabel} value={form.title} placeholder={namePlaceholder} onChange={(value) => onChange("title", value)} />
      <InputBox label="Adet / Miktar" value={form.quantity} placeholder="Örn: 4.43" onChange={(value) => onChange("quantity", value)} />
      <InputBox label="Alış Fiyatı" value={form.buyPrice} placeholder="0" onChange={(value) => onChange("buyPrice", value)} />
      <InputBox label="Güncel Fiyat" value={form.currentPrice} placeholder="0" onChange={(value) => onChange("currentPrice", value)} />
      <InputBox label="Not" value={form.note} placeholder="Opsiyonel" onChange={(value) => onChange("note", value)} />

      <button type="button" className="premiumButton wide" onClick={onAdd}>
        {buttonText}
      </button>
    </div>
  );
}

function CreditList({ items, money, parseInstallment, isCreditActive, onEdit, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz kredi kaydı bulunmuyor." />;

  return (
    <div className="recordList">
      {items.map((item) => {
        const installment = parseInstallment(item.installmentText);
        const active = isCreditActive(item.paymentStartDate);

        const progressClass =
          installment.percent >= 100
            ? "success"
            : installment.percent >= 70
            ? "warm"
            : installment.percent >= 35
            ? "mid"
            : "danger";

        return (
          <div key={item.id} className="creditRecord">
            <div className="creditRecordTop">
              <div>
                <div className="recordTitleRow">
                  <h4>{item.title}</h4>

                  <span className={installment.completed ? "status done" : "status waiting"}>
                    {installment.completed ? "✅ Tamamlandı" : "⏳ Devam ediyor"}
                  </span>

                  {!active ? <span className="status deferred">Ödeme tarihi bekleniyor</span> : null}
                </div>

                <p className="recordSubText">
                  Taksit: {item.installmentText || "0/0"} • Kalan borç: {money(item.remainingDebt)}
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
                <div className={`progressBar ${progressClass}`} style={{ width: `${installment.percent}%` }} />
              </div>
            </div>

            <div className="recordFooter">
              <span>Başlangıç: {item.paymentStartDate || "Hemen aktif"}</span>

              <div className="recordActions">
                <button type="button" className="editButton" onClick={() => onEdit(item)}>
                  Düzenle
                </button>

                <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
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
  if (items.length === 0) return <EmptyState text="Henüz kayıt bulunmuyor." />;

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

              <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
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
  if (items.length === 0) return <EmptyState text="Henüz ek gelir kaydı bulunmuyor." />;

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

              <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
                Sil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BesList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz BES kaydı bulunmuyor." />;

  return (
    <div className="recordList">
      {items.map((item) => (
        <div key={item.id} className="simpleRecord investmentRecord">
          <div className="simpleRecordTop">
            <div>
              <h4>{item.title}</h4>
              <p>
                Aylık katkı: {money(item.monthlyContribution)}
                {item.expectedReturn ? ` • Beklenti: ${item.expectedReturn}` : ""}
              </p>
              {item.note ? <p>{item.note}</p> : null}
            </div>

            <div className="simpleRecordRight">
              <strong>{money(item.totalAmount)}</strong>

              <button type="button" className="editButton" onClick={() => onEdit(item)}>
                Düzenle
              </button>

              <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
                Sil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LockedList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz kilitli yatırım kaydı bulunmuyor." />;

  return (
    <div className="recordList">
      {items.map((item) => {
        const days = daysUntil(item.unlockDate);
        const unlocked = days !== null && days <= 0;

        return (
          <div key={item.id} className="simpleRecord investmentRecord">
            <div className="simpleRecordTop">
              <div>
                <div className="recordTitleRow">
                  <h4>{item.title}</h4>

                  <span className={unlocked ? "status done" : "status deferred"}>
                    {unlocked ? "✅ Açıldı" : "🔒 Kilitli"}
                  </span>
                </div>

                <p>
                  Açılış tarihi: {item.unlockDate || "-"}
                  {!unlocked && days !== null ? ` • Kalan gün: ${days}` : ""}
                </p>

                {item.note ? <p>{item.note}</p> : null}
              </div>

              <div className="simpleRecordRight">
                <strong>{money(item.amount)}</strong>

                <button type="button" className="editButton" onClick={() => onEdit(item)}>
                  Düzenle
                </button>

                <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
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

function AssetList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) return <EmptyState text="Henüz yatırım kaydı bulunmuyor." />;

  return (
    <div className="recordList">
      {items.map((item) => {
        const cost = Number(item.quantity || 0) * Number(item.buyPrice || 0);
        const value = Number(item.quantity || 0) * Number(item.currentPrice || 0);
        const pnl = value - cost;
        const pnlRate = cost > 0 ? (pnl / cost) * 100 : 0;

        return (
          <div key={item.id} className="simpleRecord investmentRecord">
            <div className="simpleRecordTop">
              <div>
                <h4>{item.title}</h4>
                <p>
                  Miktar: {item.quantity} • Alış: {money(item.buyPrice)} • Güncel: {money(item.currentPrice)}
                </p>
                <p>
                  Maliyet: {money(cost)} • Güncel değer: {money(value)}
                </p>
                {item.note ? <p>{item.note}</p> : null}
              </div>

              <div className="simpleRecordRight">
                <strong className={pnl >= 0 ? "profitText" : "lossText"}>
                  {money(pnl)} / %{pnlRate.toFixed(2)}
                </strong>

                <button type="button" className="editButton" onClick={() => onEdit(item)}>
                  Düzenle
                </button>

                <button type="button" className="deleteButton" onClick={() => onDelete(item.id)}>
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

function EmptyState({ text }) {
  return (
    <div className="emptyState">
      <strong>{text}</strong>
      <span>Yeni kayıt eklediğinde burada görüntülenecek.</span>
    </div>
  );
}
