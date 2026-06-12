"use client";

export default function EducationNotesPage() {
  return (
    <main className="min-h-center">    <main className="min-h-screen p-5 md:p-8">
          <div>
            <a
              href="/"
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200"
           bold text-purple-100">
              Eğitim Notları
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Ders notlarını ayrı bir alanda yönet.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              SQL, Fraud, Frontend veya kişisel eğitim notlarını burada
              tutacağız. Sonraki adımda klasör, metin editörü ve görsel ekleme
              özelliklerini aktif edeceğiz.
            </p>
          </div>

          <button className="primary-button inline-flex items-center justify-center gap-2 px-5 py-4">
            Yeni Not
          </button>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="glass-card rounded-[28px] p-6">
            <h2 className="text-2xl font-black text-white">Klasörler</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Şu an boş geliyor. Sonraki adımda istediğin klasörleri sen
              oluşturacaksın.
            </p>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-8 text-center">
              <h3 className="mt-4 text-xl font-black text-white">
                Henüz klasör yok
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                İlk klasörünü oluşturduğunda burada görünecek.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-[28px] p-6">
            <h2 className="text-2xl font-black text-white">Not Alanı</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Metin ve görsel destekli not editörü burada olacak.
            </p>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-500/35 bg-slate-950/35 p-8 text-center">
              <h3 className="mt-4 text-xl font-black text-white">
                Henüz not yok
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">
                Sonraki geliştirmede başlık, açıklama, zengin metin editörü ve
                görsel yükleme alanını buraya ekleyeceğiz.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
      <div className="mx-auto max-w-7xl">
