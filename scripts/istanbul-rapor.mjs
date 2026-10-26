// İstanbul Rehberi — veri kalitesi raporu.
// Çalıştır: npm run rapor:istanbul
// Her etkinlik kategorisinde kimin, hangi kanıtla, hangi güvenle göründüğünü ve
// kaynak/görsel dağılımını yazdırır. Veri güncellemesinden sonra gözle kontrol için.
import { MEKANLAR, TUM_MEKANLAR } from "../lib/istanbul.js";
import { BOS_FILTRE, sonuclariHesapla } from "../lib/istanbulFiltre.js";
import { kategoriBul, kategoriKaniti, kayitGuveni } from "../lib/istanbulSkor.js";

const ctx = { g: {}, googleAktif: false, konum: null };
for (const id of ["konser", "after", "kulup", "dj", "canli", "dans"]) {
  const k = kategoriBul(id);
  const dogru = sonuclariHesapla({ ...BOS_FILTRE, kategoriler: [id] }, ctx);
  const hepsi = sonuclariHesapla({ ...BOS_FILTRE, kategoriler: [id], dogrulanmamis: true }, ctx);
  console.log(`\n## ${k.ad} — ${dogru.length} doğrulanmış/kaynaklı, +${hepsi.length - dogru.length} doğrulanmamış`);
  for (const { m, skor } of dogru) {
    const e = kategoriKaniti(m, k);
    console.log(`  ${String(skor.toplam).padStart(3)}  ${m.ad.padEnd(28)} [${m.turler.join("/")}]  ${e ? `${e.guven} · ${e.kaynakAd} ${e.tarih || ""}` : `tür: ${m.turGuven}`}`);
  }
}
const say = (f) => MEKANLAR.reduce((a, m) => ((a[f(m)] = (a[f(m)] || 0) + 1), a), {});
console.log("\n## Kayıt güveni", say(kayitGuveni));
console.log("## Ana kaynak", say((m) => m.kaynaklar[0]?.k));
console.log("## Görsel kökeni", say((m) => (m.gorsel ? m.gorselKoken?.k : "görselsiz")));
console.log("## Listeden çıkarılan (kapanan/taşınan)", TUM_MEKANLAR.filter((m) => m.kapandi).map((m) => `${m.ad}: ${m.kapandi}`));
