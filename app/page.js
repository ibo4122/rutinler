"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import BesProjectionPanel from "../components/BesProjectionPanel";

const LOCAL_BACKUP_KEY = "kisisel-finans-panel-local-backup";

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

const emptyInvestments = {
  bes: [],
  locked: [],
  gold: [],
  crypto: [],
};

const emptyFinanceData = {
  income: emptyIncome,
  extraIncomes: [],
  credits: [],
  cardExpenses: [],
  otherExpenses: [],
  investments: emptyInvestments,
};

const emptyBesForm = {
  title: "",
  totalAmount: "",
  monthlyContribution: "",
  expectedReturn: "",
  note: "",
};

const emptyLockedForm = {
  title: "",
  amount: "",
  unlockDate: "",
  note: "",
};

const emptyAssetForm = {
  title: "",
  quantity: "",
  buyPrice: "",
  currentPrice: "",
  note: "",
};

function onlyDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function parseAmount(value) {
  return Number(onlyDigits(value));
}

function parseDecimal(value) {
  const cleaned = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  return Number(cleaned || 0);
}

function formatNumberInput(value) {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("tr-TR").format(Number(digits));
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeFinanceData(data) {
  if (!data) {
    return emptyFinanceData;
  }

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
      locked: Array.isArray(data.investments?.locked)
        ? data.investments.locked
        : [],
      gold: Array.isArray(data.investments?.gold) ? data.investments.gold : [],
      crypto: Array.isArray(data.investments?.crypto)
        ? data.investments.crypto
        : [],
    },
  };
}

function getLocalBackup() {
  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);

    if (!raw) {
      return null;
    }

    return normalizeFinanceData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveLocalBackup(payload) {
  try {
    window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
  } catch {}
}

function daysUntil(dateText) {
  if (!dateText) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateText);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [financeLoaded, setFinanceLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const rememberedEmail = window.localStorage.getItem(
        "remembered-finance-email"
      );

      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
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

    return () => {
      data.subscription.unsubscribe();
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
    }, 650);

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

    if (error) {
      console.log(error);
    }

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

      if (localBackup) {
        normalized = localBackup;
      }
    }

    setIncome(normalized.income || emptyIncome);
    setExtraIncomes(normalized.extraIncomes || []);
    setCredits(normalized.credits || []);
    setCardExpenses(normalized.cardExpenses || []);
    setOtherExpenses(normalized.otherExpenses || []);
    setInvestments(normalized.investments || emptyInvestments);

    setFinanceLoaded(true);
    setDataLoading(false);
  };

  const saveFinanceData = async () => {
    if (!session?.user || !supabase) {
      return;
    }

    const payload = currentPayload();

    saveLocalBackup(payload);
    setSaving(true);

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

    if (!supabase) {
      setAuthMessage("Supabase bağlantısı eksik.");
      return;
    }

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordAgain.trim()
    ) {
      setAuthMessage("Ad soyad, e-posta, şifre ve şifre tekrarı gir.");
      return;
    }

    if (!email.includes("@")) {
      setAuthMessage("Geçerli bir e-posta adresi gir.");
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== passwordAgain) {
      setAuthMessage("Şifreler eşleşmiyor.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setPendingEmail(cleanEmail);
    setAuthMode("verify");
    setAuthMessage("Hesap oluşturuldu. Mailine gelen doğrulama kodunu gir.");
  };

  const handleVerifyCode = async () => {
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Supabase bağlantısı eksik.");
      return;
    }

    if (!pendingEmail || !verificationCode.trim()) {
      setAuthMessage("Doğrulama kodunu gir.");
      return;
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

      if (secondTry.error) {
        setAuthMessage("Kod doğrulanamadı. Kodu kontrol et.");
        return;
      }
    }

    setAuthMessage("Hesap doğrulandı. Şimdi giriş yapabilirsin.");
    setAuthMode("login");
    setVerificationCode("");
    setPassword("");
    setPasswordAgain("");
  };

  const handleResendCode = async () => {
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Supabase bağlantısı eksik.");
      return;
    }

    const targetEmail = pendingEmail || email.trim().toLowerCase();

    if (!targetEmail) {
      setAuthMessage("Önce e-posta adresini gir.");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Yeni doğrulama kodu gönderildi.");
  };

  const handleLogin = async () => {
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Supabase bağlantısı eksik.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setAuthMessage("E-posta ve şifre gir.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setAuthMessage(
        "Giriş başarısız. E-posta doğrulanmamış olabilir veya şifre hatalı olabilir."
      );
      return;
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
    setAuthMessage("");

    if (!supabase) {
      setAuthMessage("Supabase bağlantısı eksik.");
      return;
    }

    if (!email.trim()) {
      setAuthMessage("Şifre sıfırlama için e-posta adresini gir.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
  };

  const handleLogout = async () => {
    await saveFinanceData();
    await supabase.auth.signOut();
    setSession(null);
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

  const financeTotals = useMemo(() => {
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

    const cardTotal = cardExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const otherTotal = otherExpenses.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const creditDebtTotal = credits.reduce((sum, item) => {
      return sum + Number(item.remainingDebt || 0);
    }, 0);

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
    const besTotal = investments.bes.reduce((sum, item) => {
      return sum + Number(item.totalAmount || 0);
    }, 0);

    const lockedTotal = investments.locked.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const goldCost = investments.gold.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.buyPrice || 0);
    }, 0);

    const goldValue = investments.gold.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.currentPrice || 0);
    }, 0);

    const cryptoCost = investments.crypto.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.buyPrice || 0);
    }, 0);

    const cryptoValue = investments.crypto.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.currentPrice || 0);
    }, 0);

    const totalInvestment = besTotal + lockedTotal + goldValue + cryptoValue;
    const totalCost = goldCost + cryptoCost;
    const totalPnl = goldValue + cryptoValue - totalCost;
    const totalPnlRate = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      besTotal,
      lockedTotal,
      goldCost,
      goldValue,
      cryptoCost,
      cryptoValue,
      totalInvestment,
      totalCost,
      totalPnl,
      totalPnlRate,
      availableInvestment: totalInvestment - lockedTotal,
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

    setCredits((current) => [
      {
        id: String(Date.now()),
        ...payload,
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

    const payload = {
      title,
      category: form.category.trim() || (isCard ? "Kredi Kartı" : "Diğer"),
      amount,
      note: form.note.trim(),
    };

    if (isCard) {
      if (editingId) {
        setCardExpenses((current) =>
          current.map((item) =>
            item.id === editingId ? { ...item, ...payload } : item
          )
        );

        resetCardForm();
        return;
      }

      setCardExpenses((current) => [
        {
          id: String(Date.now()),
          ...payload,
        },
        ...current,
      ]);

      setCardForm(emptyExpense);
      return;
    }

    if (editingId) {
      setOtherExpenses((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item
        )
      );

      resetOtherForm();
      return;
    }

    setOtherExpenses((current) => [
      {
        id: String(Date.now()),
        ...payload,
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

  const addOrUpdateBes = () => {
    const title = besForm.title.trim();
    const totalAmount = parseAmount(besForm.totalAmount);
    const monthlyContribution = parseAmount(besForm.monthlyContribution);

    if (!title || totalAmount <= 0) {
      alert("BES adı ve toplam birikim gir.");
      return;
    }

    const payload = {
      title,
      totalAmount,
      monthlyContribution,
      expectedReturn: besForm.expectedReturn,
      note: besForm.note.trim(),
    };

    if (editingBesId) {
      setInvestments((current) => ({
        ...current,
        bes: current.bes.map((item) =>
          item.id === editingBesId ? { ...item, ...payload } : item
        ),
      }));

      resetBesForm();
      return;
    }

    setInvestments((current) => ({
      ...current,
      bes: [
        {
          id: String(Date.now()),
          ...payload,
        },
        ...current.bes,
      ],
    }));

    setBesForm(emptyBesForm);
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
  };

  const addOrUpdateLocked = () => {
    const title = lockedForm.title.trim();
    const amount = parseAmount(lockedForm.amount);

    if (!title || amount <= 0 || !lockedForm.unlockDate) {
      alert("Yatırım adı, tutar ve açılış tarihi gir.");
      return;
    }

    const payload = {
      title,
      amount,
      unlockDate: lockedForm.unlockDate,
      note: lockedForm.note.trim(),
    };

    if (editingLockedId) {
      setInvestments((current) => ({
        ...current,
        locked: current.locked.map((item) =>
          item.id === editingLockedId ? { ...item, ...payload } : item
        ),
      }));

      resetLockedForm();
      return;
    }

    setInvestments((current) => ({
      ...current,
      locked: [
        {
          id: String(Date.now()),
          ...payload,
        },
        ...current.locked,
      ],
    }));

    setLockedForm(emptyLockedForm);
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
      alert("Altın adı, adet/gram, alış fiyatı ve güncel fiyat gir.");
      return;
    }

    const payload = {
      title,
      quantity,
      buyPrice,
      currentPrice,
      note: goldForm.note.trim(),
    };

    if (editingGoldId) {
      setInvestments((current) => ({
        ...current,
        gold: current.gold.map((item) =>
          item.id === editingGoldId ? { ...item, ...payload } : item
        ),
      }));

      resetGoldForm();
      return;
    }

    setInvestments((current) => ({
      ...current,
      gold: [
        {
          id: String(Date.now()),
          ...payload,
        },
        ...current.gold,
      ],
    }));

    setGoldForm(emptyAssetForm);
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
      alert("Coin adı, adet, alış fiyatı ve güncel fiyat gir.");
      return;
    }

    const payload = {
      title,
      quantity,
      buyPrice,
      currentPrice,
      note: cryptoForm.note.trim(),
    };

    if (editingCryptoId) {
      setInvestments((current) => ({
        ...current,
        crypto: current.crypto.map((item) =>
          item.id === editingCryptoId ? { ...item, ...payload } : item
        ),
      }));

      resetCryptoForm();
      return;
    }

    setInvestments((current) => ({
      ...current,
      crypto: [
        {
          id: String(Date.now()),
          ...payload,
        },
        ...current.crypto,
      ],
    }));

    setCryptoForm(emptyAssetForm);
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

              {authMessage ? (
                <div className="authMessage">{authMessage}</div>
              ) : null}

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
                  onClick={() => {
                    setAuthMode("login");
                    setAuthMessage("");
                  }}
                >
                  Giriş ekranına dön
                </button>
              </div>
            </>
          ) : authMode === "register" ? (
            <>
              <div className="authFormGrid">
                <label className="authInputBox">
                  <span>Ad Soyad</span>
                  <input
                    value={fullName}
                    placeholder="Ad Soyad"
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>

                <label className="authInputBox">
                  <span>E-posta</span>
                  <input
                    type="email"
                    value={email}
                    placeholder="ornek@mail.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>

                <label className="authInputBox">
                  <span>Şifre</span>
                  <input
                    type="password"
                    value={password}
                    placeholder="En az 6 karakter"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>

                <label className="authInputBox">
                  <span>Şifre Tekrarı</span>
                  <input
                    type="password"
                    value={passwordAgain}
                    placeholder="Şifreyi tekrar gir"
                    onChange={(event) => setPasswordAgain(event.target.value)}
                  />
                </label>
              </div>

              {authMessage ? (
                <div className="authMessage">{authMessage}</div>
              ) : null}

              <div className="authButtons">
                <button
                  type="button"
                  className="premiumButton authPrimaryButton"
                  onClick={handleRegister}
                >
                  Kaydı Oluştur
                </button>

                <button
                  type="button"
                  className="secondaryButton authSecondaryButton"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthMessage("");
                  }}
                >
                  Giriş Ekranına Dön
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="authFormGrid">
                <label className="authInputBox">
                  <span>E-posta</span>
                  <input
                    type="email"
                    value={email}
                    placeholder="ornek@mail.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>

                <label className="authInputBox">
                  <span>Şifre</span>
                  <input
                    type="password"
                    value={password}
                    placeholder="Şifren"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
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

                <button
                  type="button"
                  className="linkButton"
                  onClick={handleForgotPassword}
                >
                  Şifremi unuttum
                </button>
              </div>

              {authMessage ? (
                <div className="authMessage">{authMessage}</div>
              ) : null}

              <div className="authButtons">
                <button
                  type="button"
                  className="premiumButton authPrimaryButton"
                  onClick={handleLogin}
                >
                  Giriş Yap
                </button>

                <button
                  type="button"
                  className="secondaryButton authSecondaryButton"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthMessage("");
                  }}
                >
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

          <button
            type="button"
            className="secondaryButton"
            onClick={handleLogout}
          >
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
            value={money(financeTotals.totalIncome)}
            detail={`Yemek parası: ${money(
              financeTotals.mealAllowance
            )} • Gelire dahil değil`}
          />

          <SummaryCard
            tone="red"
            title="Toplam Gider"
            value={money(financeTotals.totalExpense)}
            detail="Kredi + kart + diğer giderler"
          />

          <SummaryCard
            tone="blue"
            title="Aylık Kalan"
            value={money(financeTotals.balance)}
            detail="Gelir - gider hesabı"
          />

          <SummaryCard
            tone="purple"
            title="Toplam Borç"
            value={money(financeTotals.totalDebt)}
            detail="Kredi + kart + diğer borçlar"
          />
        </section>

        <Panel
          title="Gelirler"
          subtitle="Maaş, yemek parası ve ek gelir yönetimi"
          totalLabel="Toplam Gelir"
          total={money(financeTotals.totalIncome)}
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
            total={money(financeTotals.extraIncomeTotal)}
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
          subtitle="Krediler, kredi kartı ve diğer borç/giderler"
          totalLabel="Toplam Gider"
          total={money(financeTotals.totalExpense)}
          open={expensesOpen}
          onToggle={() => setExpensesOpen((value) => !value)}
        >
          <MiniPanel
            title="Krediler"
            totalLabel="Total Kredi Ödemesi"
            total={money(financeTotals.activeCreditTotal)}
            color="purple"
            open={creditsOpen}
            onToggle={() => setCreditsOpen((value) => !value)}
          >
            <p className="sectionDescription">
              Taksit alanını <strong>8/24</strong> formatında yaz. Ödeme
              başlangıç tarihi gelmeyen krediler toplam gidere eklenmez.
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
                onChange={(value) =>
                  updateCreditForm("paymentStartDate", value)
                }
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
                setCredits((current) =>
                  current.filter((item) => item.id !== id)
                )
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Kredi Kartı Giderleri"
            totalLabel="Total Kredi Kartı"
            total={money(financeTotals.cardTotal)}
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
              <button
                type="button"
                className="deleteButton"
                onClick={resetCardForm}
              >
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
            title="Diğer Borç / Nakit Giderler"
            totalLabel="Total Diğer"
            total={money(financeTotals.otherTotal)}
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
              <button
                type="button"
                className="deleteButton"
                onClick={resetOtherForm}
              >
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
                
<BesProjectionPanel />

<section className="summaryGrid investmentSummaryGrid">
  <SummaryCard
    tone="green"
    title="Toplam Yatırım"
    value={money(investmentTotals.totalInvestment)}
    detail="BES + kilitli + altın + kripto"
  />
      
</section>
        <section className="summaryGrid investmentSummaryGrid">
          <SummaryCard
            tone="green"
            title="Toplam Yatırım"
            value={money(investmentTotals.totalInvestment)}
            detail="BES + kilitli + altın + kripto"
          />

          <SummaryCard
            tone="purple"
            title="Kilitli Yatırım"
            value={money(investmentTotals.lockedTotal)}
            detail="Açılış tarihine kadar blokajlı"
          />

          <SummaryCard
            tone="blue"
            title="Kullanılabilir"
            value={money(investmentTotals.availableInvestment)}
            detail="Toplam yatırım - kilitli yatırım"
          />

          <SummaryCard
            tone={investmentTotals.totalPnl >= 0 ? "green" : "red"}
            title="Kar / Zarar"
            value={money(investmentTotals.totalPnl)}
            detail={`Oran: %${investmentTotals.totalPnlRate.toFixed(2)}`}
          />
        </section>

        <Panel
          title="Yatırım Geliri"
          subtitle="BES, kilitli yatırım, altın ve kripto takip paneli"
          totalLabel="Toplam Yatırım"
          total={money(investmentTotals.totalInvestment)}
          open={investmentOpen}
          onToggle={() => setInvestmentOpen((value) => !value)}
        >
          <MiniPanel
            title="BES Yatırımı"
            totalLabel="BES Toplam"
            total={money(investmentTotals.besTotal)}
            color="mint"
            open={besOpen}
            onToggle={() => setBesOpen((value) => !value)}
          >
            <div className="formGrid five">
              <InputBox
                label="BES Adı"
                value={besForm.title}
                placeholder="Örn: BES"
                onChange={(value) => updateBesForm("title", value)}
              />

              <InputBox
                label="Toplam Birikim"
                value={besForm.totalAmount}
                placeholder="0"
                onChange={(value) => updateBesForm("totalAmount", value)}
              />

              <InputBox
                label="Aylık Katkı"
                value={besForm.monthlyContribution}
                placeholder="0"
                onChange={(value) =>
                  updateBesForm("monthlyContribution", value)
                }
              />

              <InputBox
                label="Getiri Beklentisi"
                value={besForm.expectedReturn}
                placeholder="Örn: %25"
                onChange={(value) => updateBesForm("expectedReturn", value)}
              />

              <InputBox
                label="Not"
                value={besForm.note}
                placeholder="Opsiyonel"
                onChange={(value) => updateBesForm("note", value)}
              />

              <button
                type="button"
                className="premiumButton wide"
                onClick={addOrUpdateBes}
              >
                {editingBesId ? "BES Güncelle" : "BES Ekle"}
              </button>
            </div>

            {editingBesId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetBesForm}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <BesList
              items={investments.bes}
              money={money}
              onEdit={startEditBes}
              onDelete={(id) =>
                setInvestments((current) => ({
                  ...current,
                  bes: current.bes.filter((item) => item.id !== id),
                }))
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Kilitli / Blokajlı Yatırım"
            totalLabel="Kilitli Toplam"
            total={money(investmentTotals.lockedTotal)}
            color="purple"
            open={lockedOpen}
            onToggle={() => setLockedOpen((value) => !value)}
          >
            <div className="formGrid four">
              <InputBox
                label="Yatırım Adı"
                value={lockedForm.title}
                placeholder="Örn: Vadeli / Fon"
                onChange={(value) => updateLockedForm("title", value)}
              />

              <InputBox
                label="Tutar"
                value={lockedForm.amount}
                placeholder="0"
                onChange={(value) => updateLockedForm("amount", value)}
              />

              <InputBox
                label="Açılış Tarihi"
                type="date"
                value={lockedForm.unlockDate}
                onChange={(value) => updateLockedForm("unlockDate", value)}
              />

              <InputBox
                label="Not"
                value={lockedForm.note}
                placeholder="Opsiyonel"
                onChange={(value) => updateLockedForm("note", value)}
              />

              <button
                type="button"
                className="premiumButton wide"
                onClick={addOrUpdateLocked}
              >
                {editingLockedId
                  ? "Kilitli Yatırımı Güncelle"
                  : "Kilitli Yatırım Ekle"}
              </button>
            </div>

            {editingLockedId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetLockedForm}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <LockedList
              items={investments.locked}
              money={money}
              onEdit={startEditLocked}
              onDelete={(id) =>
                setInvestments((current) => ({
                  ...current,
                  locked: current.locked.filter((item) => item.id !== id),
                }))
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Altın Yatırımı"
            totalLabel="Altın Değeri"
            total={money(investmentTotals.goldValue)}
            color="orange"
            open={goldOpen}
            onToggle={() => setGoldOpen((value) => !value)}
          >
            <AssetForm
              form={goldForm}
              onChange={updateGoldForm}
              buttonText={editingGoldId ? "Altını Güncelle" : "Altın Ekle"}
              onAdd={addOrUpdateGold}
              nameLabel="Altın Türü"
              namePlaceholder="Örn: Gram Altın"
            />

            {editingGoldId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetGoldForm}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <AssetList
              items={investments.gold}
              money={money}
              onEdit={startEditGold}
              onDelete={(id) =>
                setInvestments((current) => ({
                  ...current,
                  gold: current.gold.filter((item) => item.id !== id),
                }))
              }
            />
          </MiniPanel>

          <MiniPanel
            title="Kripto Yatırımı"
            totalLabel="Kripto Değeri"
            total={money(investmentTotals.cryptoValue)}
            color="rose"
            open={cryptoOpen}
            onToggle={() => setCryptoOpen((value) => !value)}
          >
            <AssetForm
              form={cryptoForm}
              onChange={updateCryptoForm}
              buttonText={editingCryptoId ? "Kriptoyu Güncelle" : "Kripto Ekle"}
              onAdd={addOrUpdateCrypto}
              nameLabel="Coin / Token"
              namePlaceholder="Örn: SOL"
            />

            {editingCryptoId ? (
              <button
                type="button"
                className="deleteButton"
                onClick={resetCryptoForm}
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}

            <AssetList
              items={investments.crypto}
              money={money}
              onEdit={startEditCrypto}
              onDelete={(id) =>
                setInvestments((current) => ({
                  ...current,
                  crypto: current.crypto.filter((item) => item.id !== id),
                }))
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
        inputMode={type === "date" ? undefined : "text"}
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

function AssetForm({
  form,
  onChange,
  onAdd,
  buttonText,
  nameLabel,
  namePlaceholder,
}) {
  return (
    <div className="formGrid five">
      <InputBox
        label={nameLabel}
        value={form.title}
        placeholder={namePlaceholder}
        onChange={(value) => onChange("title", value)}
      />

      <InputBox
        label="Adet / Miktar"
        value={form.quantity}
        placeholder="Örn: 4.43"
        onChange={(value) => onChange("quantity", value)}
      />

      <InputBox
        label="Alış Fiyatı"
        value={form.buyPrice}
        placeholder="0"
        onChange={(value) => onChange("buyPrice", value)}
      />

      <InputBox
        label="Güncel Fiyat"
        value={form.currentPrice}
        placeholder="0"
        onChange={(value) => onChange("currentPrice", value)}
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

function BesList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz BES kaydı bulunmuyor." />;
  }

  return (
    <div className="recordList">
      {items.map((item) => (
        <div key={item.id} className="simpleRecord investmentRecord">
          <div className="simpleRecordTop">
            <div>
              <h4>{item.title}</h4>
              <p>
                Aylık katkı: {money(item.monthlyContribution)}{" "}
                {item.expectedReturn ? `• Beklenti: ${item.expectedReturn}` : ""}
              </p>
              {item.note ? <p>{item.note}</p> : null}
            </div>

            <div className="simpleRecordRight">
              <strong>{money(item.totalAmount)}</strong>

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

function LockedList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz kilitli yatırım kaydı bulunmuyor." />;
  }

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
                  Açılış tarihi: {item.unlockDate || "-"}{" "}
                  {!unlocked && days !== null ? `• Kalan gün: ${days}` : ""}
                </p>

                {item.note ? <p>{item.note}</p> : null}
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
        );
      })}
    </div>
  );
}

function AssetList({ items, money, onEdit, onDelete }) {
  if (items.length === 0) {
    return <EmptyState text="Henüz yatırım kaydı bulunmuyor." />;
  }

  return (
    <div className="recordList">
      {items.map((item) => {
        const cost = Number(item.quantity || 0) * Number(item.buyPrice || 0);
        const value =
          Number(item.quantity || 0) * Number(item.currentPrice || 0);
        const pnl = value - cost;
        const pnlRate = cost > 0 ? (pnl / cost) * 100 : 0;

        return (
          <div key={item.id} className="simpleRecord investmentRecord">
            <div className="simpleRecordTop">
              <div>
                <h4>{item.title}</h4>

                <p>
                  Miktar: {item.quantity} • Alış: {money(item.buyPrice)} •
                  Güncel: {money(item.currentPrice)}
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

function EmptyState({ text }) {
  return (
    <div className="emptyState">
      <strong>{text}</strong>
      <span>Yeni kayıt eklediğinde burada görüntülenecek.</span>
    </div>
  );
}
