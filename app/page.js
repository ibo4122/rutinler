"use client";

import {
  BookOpen,
  ChartPie,
  GraduationCap,
  Landmark,
  PiggyBank,
  Plus,
  WalletCards,
} from "lucide-react";

const summaryCards = [
  {
    title: "Toplam Gelir",
    value: "110.000 TL",
    detail: "Aylık maaş ve ek gelir",
    icon: PiggyBank,
    color: "from-emerald-400 to-teal-500",
  },
  {
    title: "Toplam Gider",
    value: "108.910 TL",
    detail: "Sabit gider, kredi ve alışveriş",
    icon: WalletCards,
    color: "from-rose-400 to-red-500",
  },
  {
    title: "Kalan Tutar",
    value: "1.090 TL",
    detail: "Aylık net kalan",
    icon: Landmark,
    color: "from-sky-400 to-blue-600",
  },
  {
    title: "Eğitim Notları",
    value: "0 Not",
    detail: "SQL, Fraud, Frontend klasörleri",
    icon: BookOpen,
    color: "from-fuchsia-400 to-purple-600",
  },
];

const expenses = [
  { title: "Kredi Kartı", type: "Borç", amount: "104.170 TL" },
  { title: "ING Kredi", type: "Kredi", amount: "27.000 TL" },
  { title: "Yol Gideri", type: "Sabit Gider", amount: "3.500 TL" },
  { title: "Eğitimler", type: "Planlı Gider", amount: "10.000 TL" },
];

const folders = [
  { title: "SQL", text: "Sorgu mantığı, SELECT, JOIN ve proje notları" },
  { title: "Fraud", text: "MCC, işlem analizi ve vaka notları" },
  { title: "Frontend", text: "Next.js, React ve UI geliştirme notları" },
];

export default function HomePage() {
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
              Finans, yatırım ve eğitim notların tek yerde.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              Excel’deki gelir-gider yapısını daha profesyonel bir panele dönüştürüyoruz.
              Bu ilk sürüm demo arayüzdür. Sonraki adımda Supabase bağlantısını açıp
              verileri kalıcı hale getireceğiz.
            </p>
          </div>

          <button className="primary-button inline-flex items-center justify-center gap-2 px-5 py-4">
            <Plus size={19} />
            Yeni Kayıt
          </button>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="glass-card rounded-[28px] p-6">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}
                >
                  <Icon size={25} />
                </div>

                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  {card.title}
                </div>

                <div className="mt-2 text-3xl font-black text-white">
                  {card.value}
                </div>

                <div className="mt-2 text-sm leading-6 text-slate-400">
                  {card.detail}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="glass-card rounded-[28px] p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Giderlerim</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Excel’deki borç, sabit gider ve ihtiyaç kalemleri burada yönetilecek.
                </p>
              </div>

              <button className="secondary-button px-4 py-3">
                Gider Ekle
              </button>
            </div>

            <div className="space-y-3">
              {expenses.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-4 md:flex-row md:items-center"
                >
                  <div>
                    <div className="font-black text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.type}</div>
                  </div>

                  <div className="text-lg font-black text-white">{item.amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[28px] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <GraduationCap size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Eğitim Notları</h2>
                <p className="text-sm text-slate-400">
                  Metin ve görsel destekli not alanı.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {folders.map((folder) => (
                <div
                  key={folder.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                >
                  <div className="font-black text-white">{folder.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">
                    {folder.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="glass-card rounded-[28px] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                <ChartPie size={25} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Yatırım Özeti</h2>
                <p className="text-sm text-slate-400">
                  Kripto, altın, BES, BIST ve nakit dağılımı burada olacak.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-8 text-center">
              <p className="text-sm leading-7 text-slate-400">
                Sonraki adımda yatırım ekranı ve grafikler bağlanacak.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-[28px] p-6">
            <h2 className="text-2xl font-black text-white">Sıradaki Adım</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Şimdi bu dosyaları GitHub’a ekleyip Vercel’e bağlayacağız. Site açıldıktan
              sonra Supabase bilgilerini Vercel Environment Variables kısmına ekleyip
              gerçek veri kaydetme özelliğini aktif edeceğiz.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
