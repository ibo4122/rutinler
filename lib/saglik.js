// Sağlık / Estetik kategorisi (Türkiye, 2026 piyasa ortalamaları)
//
// Bu alanın kendine özgü mantığı: sağlık harcaması İKİ FARKLI PARADIR.
//   1) TEK SEFERLİK İŞLEMLER — implant, saç ekimi, LASIK, ameliyat…
//      Biriktirip bir kerede ödersin.
//   2) DÜZENLİ GİDERLER — sigorta, ilaç, terapi, kontrol…
//      Her ay tekrar eder; yıllık toplamı çoğu insanın tahmin ettiğinden büyüktür.
// Ekran ikisini ayırır ve yıllık toplam sağlık maliyetini gösterir.
//
// Fiyatlar 2026 ortalamalarıdır; klinik, şehir ve doktora göre ciddi değişir.

export const SAGLIK_GRUPLARI = [
  {
    id: "dis", ad: "Diş Sağlığı", ikon: "🦷", renk: "#38bdf8", tur: "tek",
    gruplar: [
      { ad: "Tedavi", kalemler: [
        ["Muayene", 1500], ["Diş taşı temizliği", 2500], ["Dolgu (kompozit)", 3500],
        ["Kanal tedavisi", 8000], ["Diş çekimi", 3000], ["20'lik diş operasyonu", 6000],
      ] },
      { ad: "Protez & İmplant", kalemler: [
        ["İmplant (tek diş)", 28000], ["Zirkonyum kaplama (diş başı)", 12000],
        ["Porselen kaplama", 9000], ["Protez (hareketli)", 35000],
      ] },
      { ad: "Ortodonti & Estetik", kalemler: [
        ["Ortodonti / tel tedavisi", 90000], ["Şeffaf plak (aligner)", 180000],
        ["Diş beyazlatma", 12000], ["Gece plağı (diş sıkma)", 8000],
      ] },
    ],
  },
  {
    id: "estetikCerrahi", ad: "Estetik Cerrahi", ikon: "💉", renk: "#f472b6", tur: "tek",
    gruplar: [
      { ad: "Saç & Yüz", kalemler: [
        ["Saç ekimi (FUE, ~4000 greft)", 130000], ["Sakal / bıyık ekimi", 90000],
        ["Burun estetiği (rinoplasti)", 165000], ["Göz kapağı estetiği", 95000],
        ["Yüz germe", 210000], ["Çene / jawline dolgu-implant", 85000],
      ] },
      { ad: "Vücut", kalemler: [
        ["Liposuction", 140000], ["Karın germe", 190000], ["Meme estetiği", 175000],
        ["Jinekomasti", 120000], ["Tüp mide ameliyatı", 260000],
      ] },
    ],
  },
  {
    id: "estetikUygulama", ad: "Estetik Uygulama", ikon: "✨", renk: "#c084fc", tur: "tek",
    gruplar: [
      { ad: "Cilt & Yüz", kalemler: [
        ["Botoks (bölge)", 12000], ["Dolgu (1 ml)", 15000], ["Mezoterapi", 7000],
        ["PRP (seans)", 6000], ["Kimyasal peeling", 5000], ["Cilt bakımı (seans)", 4000],
      ] },
      { ad: "Vücut & Bakım", kalemler: [
        ["Lazer epilasyon (8 seans paket)", 25000], ["Mide botoksu", 45000],
        ["Bölgesel incelme paketi", 30000],
      ] },
    ],
  },
  {
    id: "goz", ad: "Göz Sağlığı", ikon: "👁️", renk: "#22d3ee", tur: "tek",
    gruplar: [
      { ad: "Göz", kalemler: [
        ["Göz muayenesi", 1500], ["Lazer göz ameliyatı (iki göz)", 95000],
        ["Katarakt ameliyatı", 65000], ["Gözlük (çerçeve + cam)", 12000],
        ["Lens (yıllık)", 9000],
      ] },
    ],
  },
  {
    id: "kontrol", ad: "Kontroller & Tahliller", ikon: "🩺", renk: "#34d399", tur: "tek",
    gruplar: [
      { ad: "Periyodik Kontrol", kalemler: [
        ["Kapsamlı check-up", 15000], ["Kan tahlili paneli", 3000],
        ["Kardiyoloji kontrolü", 4000], ["Dermatoloji (ben kontrolü)", 3500],
        ["Jinekoloji / üroloji kontrolü", 4000], ["Diş kontrolü (6 ayda bir)", 1500],
      ] },
      { ad: "Görüntüleme", kalemler: [
        ["MR", 8000], ["Tomografi", 6000], ["Ultrason", 2500], ["Röntgen", 1200],
      ] },
    ],
  },
  {
    id: "tedavi", ad: "Tedavi & Ameliyat", ikon: "🏥", renk: "#fb7185", tur: "tek",
    gruplar: [
      { ad: "Operasyon & Tedavi", kalemler: [
        ["Ameliyat (hastane payı)", 120000], ["Fizik tedavi (seans paketi)", 25000],
        ["Ortopedi tedavisi", 45000], ["İşitme cihazı", 60000],
        ["Ortez / protez", 35000], ["Acil / yatış farkı", 20000],
      ] },
    ],
  },
];

// Her ay tekrar eden giderler — yıllık toplamı sürpriz olur.
export const SAGLIK_DUZENLI = {
  ad: "Düzenli Sağlık Giderleri", ikon: "🔁", renk: "#f59e0b", tur: "aylik",
  gruplar: [
    { ad: "Sigorta", kalemler: [
      ["Özel sağlık sigortası", 2500], ["Tamamlayıcı sağlık sigortası", 900],
      ["Diş sigortası / paket", 400],
    ] },
    { ad: "İlaç & Takviye", kalemler: [
      ["Reçeteli ilaç", 1500], ["Vitamin & takviye", 1200], ["Eczane / sarf", 600],
    ] },
    { ad: "Terapi & Takip", kalemler: [
      ["Psikolog / terapi (4 seans)", 8000], ["Diyetisyen", 3000],
      ["Fizyoterapi", 6000], ["Spor salonu / pilates", 1800],
    ] },
  ],
};

export const saglikGrubu = (id) => SAGLIK_GRUPLARI.find((g) => g.id === id) || null;
