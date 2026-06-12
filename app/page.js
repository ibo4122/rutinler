"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Landmark,
  PiggyBank,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

const STORAGE_KEY = "kisisel-panel-finans-v1";

const initialForm = {
  title: "",
  category: "",
  amount: "",
  date: "",
  description: "",
};

export default function HomePage() {
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totals = useMemo(() => {
    const totalExpense = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      totalIncome: 0,
      totalExpense,
      balance: 0 - totalExpense,
      totalCount: items.length,
    };
  }, [items]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddExpense = () => {
    const cleanTitle = form.title.trim();
    const amountNumber = Number(form.amount);

    if (!cleanTitle || !amountNumber || amountNumber <= 0) {
      alert("Lütfen gider adı ve geçerli tutar gir.");
      return;
    }

    const newItem = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      category: form.category.trim() || "Genel",
      amount: amountNumber,
      date: form.date || new Date().toISOString().slice(0, 10),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
    };

    setItems((current) => [newItem, ...current]);
    setForm(initialForm);
    setExpensesOpen(true);
  };

  const handleDeleteExpense = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100">
              <WalletCards size={16} />
              Kişisel Yönetim Paneli
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Finans panelin hazır.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              Bu ekran kullanıcıya özel finans alanıdır. İlk açılışta tüm veriler boş gelir.
              Gider ekledikçe toplamlar otomatik hesaplanır.
            </p>
          </div>

          <Link
            href="/egitim-notlari"
            className="primary-button inline-flex items-center justify-center gap-2 px-5 py-4"
          >
            <BookOpen size={19} />
            Eğitim Notları
          </Link>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Toplam Gelir"
            value={formatCurrency(totals.totalIncome)}
            detail="Henüz gelir kaydı yok"
            icon={PiggyBank}
            color="from-emerald-400 to-teal-500"
          />

          <SummaryCard
            title="Toplam Gider"
            value={formatCurrency(totals.totalExpense)}
            detail={`${totals.totalCount} gider kaydı`}
            icon={WalletCards}
            color="from-rose-400 to-red-500"
          />

          <SummaryCard
            title="Kalan Tutar"
            value={formatCurrency(totals.balance)}
            detail="Gelir - gider sonucu"
            icon={Landmark}
            color="from-sky-400 to-blue-600"
          />

          <SummaryCard
            title="Kayıt Sayısı"
            value={`${totals.totalCount}`}
            detail="Toplam gider hareketi"
            icon={BookOpen}
            color="from-fuchsia-400 to-purple-600"
          />
        </section>

        <section className="mt-6">
          <div className="glass-card rounded-[28px] p-6">
            <button
              type="button"
              onClick={() => setExpensesOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-white">Giderlerim</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Gider alanını açıp kapatabilir, tüm giderlerini burada takip edebilirsin.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                {expensesOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </button>

            {expensesOpen ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-sky-200" />
                    <h3 className="text-lg font-black text-white">Yeni Gider Ekle</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-300">
                        Gider Adı
                      </span>
                      <input
                        className="input-field"
                        placeholder="Örn: Elektrik"
                        value={form.title}
                        onChange={(event) => handleChange("title", event.target.value)}
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
                        onChange={(event) => handleChange("category", event.target.value)}
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
                        onChange={(event) => handleChange("amount", event.target.value)}
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
                        onChange={(event) => handleChange("date", event.target.value)}
                      />
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddExpense}
                        className="primary-button flex w-full items-center justify-center gap-2 px-5 py-4"
                      >
                        <Plus size={18} />
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
                        handleChange("description", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
                    <div>
                      <h3 className="text-xl font-black text-white">Tüm Giderler</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Eklediğin tüm giderler burada listelenir.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100">
                      Toplam: {formatCurrency(totals.totalExpense)}
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-400/10 text-sky-200">
                        <WalletCards size={30} />
                      </div>
                      <h4 className="text-xl font-black text-white">
                        Henüz gider kaydı yok
                      </h4>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">
                        İlk giderini eklediğinde burada görünecek.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4 md:flex-row md:items-center"
                        >
                          <div>
                            <div className="font-black text-white">{item.title}</div>
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
                              {formatCurrency(item.amount)}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item.id)}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/20 bg-red-500/10 text-red-200"
                              aria-label="Gideri sil"
                            >
                              <Trash2 size={18} />
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

function SummaryCard({ icon: Icon, title, value, detail, color }) {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}
      >
        <Icon size={25} />
      </div>

      <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-3xl font-black text-white">{value}</div>

      <div className="mt-2 text-sm leading-6 text-slate-400">{detail}</div>
    </div>
  );
}
