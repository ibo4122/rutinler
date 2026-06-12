"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kisisel-panel-giderler-v1";

const emptyForm = {
  title: "",
  category: "",
  amount: "",
  date: "",
  description: "",
};

export default function HomePage() {
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setExpenses(JSON.parse(saved));
      }
    } catch {
      setExpenses([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, loaded]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((total, item) => {
      return total + Number(item.amount || 0);
    }, 0);
  }, [expenses]);

  const balance = 0 - totalExpense;

  const formatMoney = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const updateForm = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const addExpense = () => {
    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title || !amount || amount <= 0) {
      alert("Lütfen gider adı ve geçerli tutar gir.");
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      title,
      category: form.category.trim() || "Genel",
      amount,
      date: form.date || new Date().toISOString().slice(0, 10),
      description: form.description.trim(),
    };

    setExpenses((currentExpenses) => [newExpense, ...currentExpenses]);
    setForm(emptyForm);
    setExpensesOpen(true);
  };

  const deleteExpense = (id) => {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((item) => item.id !== id)
    );
  };

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100">
            Kişisel Yönetim Paneli
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            Finans panelin hazır.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Bu ekran kullanıcıya özel finans alanıdır. İlk açılışta tüm veriler
            boş gelir. Gider ekledikçe toplamlar otomatik hesaplanır.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Toplam Gelir"
            value={formatMoney(0)}
            detail="Henüz gelir kaydı yok"
          />

          <SummaryCard
            title="Toplam Gider"
            value={formatMoney(totalExpense)}
            detail={expenses.length + " gider kaydı"}
          />

          <SummaryCard
            title="Kalan Tutar"
            value={formatMoney(balance)}
            detail="Gelir - gider sonucu"
          />

          <SummaryCard
            title="Kayıt Sayısı"
            value={expenses.length}
            detail="Toplam gider hareketi"
          />
        </section>

        <section className="mt-6">
          <div className="glass-card rounded-[28px] p-6">
            <button
              type="button"
              onClick={() => setExpensesOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-white">Giderlerim</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Gider alanını açıp kapatabilir, tüm giderlerini burada takip
                  edebilirsin.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black text-white">
                {expensesOpen ? "−" : "+"}
              </div>
            </button>

            {expensesOpen ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <h3 className="mb-4 text-lg font-black text-white">
                    Yeni Gider Ekle
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-300">
                        Gider Adı
                      </span>
                      <input
                        className="input-field"
                        placeholder="Örn: Elektrik"
                        value={form.title}
                        onChange={(event) =>
                          updateForm("title", event.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-300">
                        Kategori
                      </span>
                      <input
                        className="input-field"
                        placeholder="Örn: Sabit Gider"
                        value={form.category}
                        onChange={(event) =>
                          updateForm("category", event.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-300">
                        Tutar
                      </span>
                      <input
                        className="input-field"
                        type="number"
                        placeholder="0"
                        value={form.amount}
                        onChange={(event) =>
                          updateForm("amount", event.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-300">
                        Tarih
                      </span>
                      <input
                        className="input-field"
                        type="date"
                        value={form.date}
                        onChange={(event) =>
                          updateForm("date", event.target.value)
                        }
                      />
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addExpense}
                        className="primary-button w-full px-5 py-4"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-bold text-slate-300">
                      Açıklama
                    </span>
                    <textarea
                      className="input-field min-h-[90px] resize-none"
                      placeholder="İstersen açıklama ekleyebilirsin."
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
                    <div>
                      <h3 className="text-xl font-black text-white">
                        Tüm Giderler
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Eklediğin tüm giderler burada listelenir.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100">
                      Toplam: {formatMoney(totalExpense)}
                    </div>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-8 text-center">
                      <h4 className="text-xl font-black text-white">
                        Henüz gider kaydı yok
                      </h4>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">
                        İlk giderini eklediğinde burada görünecek.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4 md:flex-row md:items-center"
                        >
                          <div>
                            <div className="font-black text-white">
                              {item.title}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-400">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{item.date}</span>

                              {item.description ? (
                                <>
                                  <span>•</span>
                                  <span>{item.description}</span>
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
                              onClick={() => deleteExpense(item.id)}
                              className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, detail }) {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-3xl font-black text-white">{value}</div>

      <div className="mt-2 text-sm leading-6 text-slate-400">{detail}</div>
    </div>
  );
}
