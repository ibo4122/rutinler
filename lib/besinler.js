// Besin veritabanı.
//
// Değerler 100 gram (ya da sıvılarda 100 ml) içindir ve açık kaynaklardan
// derlenmiştir:
//   • USDA FoodData Central (SR Legacy / Foundation Foods) — kamu malı
//   • TürKomp — Türkiye Ulusal Gıda Kompozisyon Veri Tabanı
//   • Türk mutfağı yemeklerinde ev tipi tarif ortalamaları
//
// Biçim: [ad, kcal, protein(g), karbonhidrat(g), yağ(g), porsiyon adı, porsiyon gramı]
//
// Porsiyon alanı önemli: kimse "87 gram pilav" diye düşünmez, "bir kepçe
// pilav" diye düşünür. Ekran gramı da porsiyonu da kabul eder.
//
// NOT: Hazır ürünlerde marka farkı büyüktür. Paketin üstündeki değer her zaman
// buradakinden daha doğrudur; ekran elle düzenlemeye izin verir.

export const BESIN_KATEGORILERI = [
  {
    id: "ekmek", ad: "Ekmek & Tahıl", ikon: "🍞", renk: "#f59e0b",
    besinler: [
      ["Beyaz ekmek", 265, 9.0, 49.0, 3.2, "1 dilim", 25],
      ["Tam buğday ekmeği", 247, 13.0, 41.0, 3.4, "1 dilim", 28],
      ["Çavdar ekmeği", 259, 8.5, 48.0, 3.3, "1 dilim", 28],
      ["Simit", 320, 9.5, 57.0, 5.5, "1 adet", 110],
      ["Poğaça", 360, 7.5, 42.0, 18.0, "1 adet", 80],
      ["Açma", 345, 8.0, 48.0, 13.0, "1 adet", 90],
      ["Lavaş", 275, 8.5, 54.0, 1.5, "1 adet", 60],
      ["Pide (ekmek)", 275, 9.0, 53.0, 2.0, "1 dilim", 50],
      ["Yufka", 300, 9.0, 60.0, 2.0, "1 yaprak", 70],
      ["Pirinç (pişmiş)", 130, 2.7, 28.0, 0.3, "1 kepçe", 150],
      ["Bulgur (pişmiş)", 83, 3.1, 18.6, 0.2, "1 kepçe", 150],
      ["Makarna (pişmiş)", 158, 5.8, 31.0, 0.9, "1 porsiyon", 200],
      ["Kuskus (pişmiş)", 112, 3.8, 23.0, 0.2, "1 porsiyon", 150],
      ["Yulaf ezmesi (kuru)", 389, 16.9, 66.3, 6.9, "1 su bardağı", 80],
      ["Mısır gevreği", 357, 7.5, 84.0, 0.4, "1 kâse", 40],
      ["Granola", 471, 10.0, 64.0, 20.0, "1 kâse", 50],
      ["Kinoa (pişmiş)", 120, 4.4, 21.3, 1.9, "1 porsiyon", 150],
      ["Galeta / grissini", 400, 12.0, 72.0, 7.0, "1 adet", 12],
      ["Mısır (haşlanmış)", 96, 3.4, 21.0, 1.5, "1 koçan", 150],
      ["Patates (haşlanmış)", 87, 1.9, 20.1, 0.1, "1 orta", 150],
      ["Patates (fırın)", 93, 2.5, 21.0, 0.1, "1 porsiyon", 180],
      ["Tatlı patates (fırın)", 90, 2.0, 21.0, 0.2, "1 orta", 150],
    ],
  },
  {
    id: "et", ad: "Et, Tavuk & Balık", ikon: "🍗", renk: "#fb7185",
    besinler: [
      ["Tavuk göğsü (ızgara, derisiz)", 165, 31.0, 0.0, 3.6, "1 porsiyon", 150],
      ["Tavuk but (derisiz)", 209, 26.0, 0.0, 10.9, "1 adet", 120],
      ["Tavuk kanat (fırın)", 254, 25.0, 0.0, 17.0, "3 adet", 120],
      ["Hindi göğsü", 135, 29.0, 0.0, 1.0, "1 porsiyon", 150],
      ["Dana biftek (yağsız, ızgara)", 217, 30.0, 0.0, 10.0, "1 porsiyon", 150],
      ["Dana kıyma (%15 yağlı)", 254, 26.0, 0.0, 17.0, "1 porsiyon", 120],
      ["Dana kıyma (yağsız)", 187, 27.0, 0.0, 8.5, "1 porsiyon", 120],
      ["Kuzu pirzola", 294, 25.0, 0.0, 21.0, "2 adet", 150],
      ["Kuzu şiş", 258, 26.0, 0.0, 17.0, "1 porsiyon", 150],
      ["Adana kebap", 285, 20.0, 2.0, 22.0, "1 porsiyon", 180],
      ["Köfte (ızgara)", 240, 19.0, 6.0, 15.0, "4 adet", 120],
      ["Sucuk", 395, 22.0, 2.0, 33.0, "4 dilim", 40],
      ["Pastırma", 230, 36.0, 1.0, 9.0, "4 dilim", 30],
      ["Salam / jambon", 250, 17.0, 3.0, 19.0, "3 dilim", 40],
      ["Sosis", 290, 12.0, 4.0, 25.0, "2 adet", 80],
      ["Ton balığı (suda)", 116, 26.0, 0.0, 1.0, "1 konserve", 80],
      ["Somon (ızgara)", 208, 20.4, 0.0, 13.4, "1 porsiyon", 150],
      ["Levrek / çipura", 124, 23.0, 0.0, 3.0, "1 adet", 200],
      ["Hamsi (tava)", 195, 20.0, 4.0, 11.0, "1 porsiyon", 150],
      ["Palamut (ızgara)", 168, 24.0, 0.0, 8.0, "1 porsiyon", 150],
      ["Karides", 99, 24.0, 0.2, 0.3, "1 porsiyon", 120],
      ["Midye dolma", 155, 6.0, 20.0, 5.5, "5 adet", 100],
    ],
  },
  {
    id: "sut", ad: "Süt & Süt Ürünleri", ikon: "🥛", renk: "#60a5fa",
    besinler: [
      ["Süt (tam yağlı)", 61, 3.2, 4.8, 3.3, "1 su bardağı", 200],
      ["Süt (yarım yağlı)", 46, 3.3, 4.8, 1.5, "1 su bardağı", 200],
      ["Yoğurt (tam yağlı)", 61, 3.5, 4.7, 3.3, "1 kâse", 200],
      ["Yoğurt (light)", 40, 4.0, 5.0, 0.5, "1 kâse", 200],
      ["Süzme yoğurt", 97, 10.0, 3.6, 5.0, "1 kâse", 150],
      ["Ayran", 36, 1.7, 2.5, 1.9, "1 bardak", 200],
      ["Kefir", 41, 3.3, 4.5, 1.0, "1 bardak", 200],
      ["Beyaz peynir (tam yağlı)", 264, 17.0, 2.0, 21.0, "1 dilim", 30],
      ["Beyaz peynir (light)", 180, 20.0, 2.0, 10.0, "1 dilim", 30],
      ["Kaşar peyniri", 371, 25.0, 2.0, 29.0, "1 dilim", 25],
      ["Lor peyniri", 98, 11.0, 3.4, 4.3, "1 porsiyon", 60],
      ["Labne / krem peynir", 253, 6.0, 4.0, 24.0, "1 yemek kaşığı", 20],
      ["Tulum peyniri", 400, 24.0, 1.5, 33.0, "1 dilim", 30],
      ["Kaymak", 330, 4.0, 3.0, 34.0, "1 yemek kaşığı", 20],
      ["Tereyağı", 717, 0.9, 0.1, 81.0, "1 yemek kaşığı", 12],
      ["Dondurma (sade)", 207, 3.5, 24.0, 11.0, "1 top", 60],
    ],
  },
  {
    id: "yumurta", ad: "Yumurta & Baklagil", ikon: "🥚", renk: "#fbbf24",
    besinler: [
      ["Yumurta (haşlanmış)", 155, 13.0, 1.1, 11.0, "1 adet", 55],
      ["Yumurta beyazı", 52, 11.0, 0.7, 0.2, "1 adet", 33],
      ["Yumurta sarısı", 322, 16.0, 3.6, 27.0, "1 adet", 17],
      ["Menemen", 118, 6.0, 5.0, 8.0, "1 porsiyon", 250],
      ["Omlet (2 yumurta)", 154, 11.0, 1.0, 12.0, "1 porsiyon", 120],
      ["Nohut (haşlanmış)", 164, 8.9, 27.4, 2.6, "1 kepçe", 150],
      ["Kuru fasulye (haşlanmış)", 127, 8.7, 22.8, 0.5, "1 kepçe", 150],
      ["Mercimek (haşlanmış)", 116, 9.0, 20.1, 0.4, "1 kepçe", 150],
      ["Barbunya (haşlanmış)", 127, 9.0, 23.0, 0.5, "1 kepçe", 150],
      ["Börülce (haşlanmış)", 116, 7.7, 20.8, 0.5, "1 kepçe", 150],
      ["Bezelye (haşlanmış)", 84, 5.4, 15.6, 0.2, "1 porsiyon", 120],
      ["Humus", 166, 7.9, 14.3, 9.6, "1 porsiyon", 60],
      ["Tofu", 76, 8.0, 1.9, 4.8, "1 porsiyon", 100],
    ],
  },
  {
    id: "sebze", ad: "Sebzeler", ikon: "🥦", renk: "#34d399",
    besinler: [
      ["Domates", 18, 0.9, 3.9, 0.2, "1 orta", 120],
      ["Salatalık", 15, 0.7, 3.6, 0.1, "1 orta", 100],
      ["Marul", 15, 1.4, 2.9, 0.2, "1 kâse", 70],
      ["Roka", 25, 2.6, 3.7, 0.7, "1 porsiyon", 40],
      ["Ispanak (haşlanmış)", 23, 2.9, 3.6, 0.4, "1 porsiyon", 150],
      ["Brokoli (haşlanmış)", 35, 2.4, 7.2, 0.4, "1 porsiyon", 150],
      ["Karnabahar", 25, 1.9, 5.0, 0.3, "1 porsiyon", 150],
      ["Kabak", 17, 1.2, 3.1, 0.3, "1 orta", 180],
      ["Patlıcan", 25, 1.0, 5.9, 0.2, "1 orta", 200],
      ["Biber (yeşil)", 20, 0.9, 4.6, 0.2, "1 adet", 60],
      ["Havuç", 41, 0.9, 9.6, 0.2, "1 orta", 80],
      ["Soğan", 40, 1.1, 9.3, 0.1, "1 orta", 110],
      ["Mantar", 22, 3.1, 3.3, 0.3, "1 porsiyon", 100],
      ["Taze fasulye", 31, 1.8, 7.0, 0.1, "1 porsiyon", 150],
      ["Pırasa", 61, 1.5, 14.2, 0.3, "1 porsiyon", 150],
      ["Lahana", 25, 1.3, 5.8, 0.1, "1 porsiyon", 120],
      ["Turp", 16, 0.7, 3.4, 0.1, "1 porsiyon", 60],
      ["Avokado", 160, 2.0, 8.5, 14.7, "1 yarım", 100],
      ["Çoban salata", 45, 1.2, 6.0, 2.2, "1 porsiyon", 200],
      ["Mevsim salata (sos hariç)", 30, 1.3, 5.0, 0.5, "1 porsiyon", 180],
    ],
  },
  {
    id: "meyve", ad: "Meyveler", ikon: "🍎", renk: "#f472b6",
    besinler: [
      ["Elma", 52, 0.3, 13.8, 0.2, "1 orta", 150],
      ["Muz", 89, 1.1, 22.8, 0.3, "1 orta", 120],
      ["Portakal", 47, 0.9, 11.8, 0.1, "1 orta", 150],
      ["Mandalina", 53, 0.8, 13.3, 0.3, "1 orta", 90],
      ["Üzüm", 69, 0.7, 18.1, 0.2, "1 salkım", 150],
      ["Çilek", 32, 0.7, 7.7, 0.3, "1 kâse", 150],
      ["Karpuz", 30, 0.6, 7.6, 0.2, "1 dilim", 300],
      ["Kavun", 34, 0.8, 8.2, 0.2, "1 dilim", 200],
      ["Şeftali", 39, 0.9, 9.5, 0.3, "1 orta", 150],
      ["Kayısı", 48, 1.4, 11.1, 0.4, "3 adet", 100],
      ["Erik", 46, 0.7, 11.4, 0.3, "2 adet", 120],
      ["Armut", 57, 0.4, 15.2, 0.1, "1 orta", 170],
      ["Kiraz", 63, 1.1, 16.0, 0.2, "1 kâse", 150],
      ["Ananas", 50, 0.5, 13.1, 0.1, "1 dilim", 100],
      ["Kivi", 61, 1.1, 14.7, 0.5, "1 adet", 75],
      ["Nar", 83, 1.7, 18.7, 1.2, "1 orta", 180],
      ["İncir (taze)", 74, 0.8, 19.2, 0.3, "2 adet", 100],
      ["Kuru üzüm", 299, 3.1, 79.2, 0.5, "1 avuç", 30],
      ["Kuru kayısı", 241, 3.4, 63.0, 0.5, "4 adet", 30],
      ["Hurma", 282, 2.5, 75.0, 0.4, "2 adet", 30],
    ],
  },
  {
    id: "kuruyemis", ad: "Kuruyemiş, Tohum & Yağ", ikon: "🥜", renk: "#a78bfa",
    besinler: [
      ["Ceviz", 654, 15.2, 13.7, 65.2, "5 yarım", 20],
      ["Badem", 579, 21.2, 21.6, 49.9, "1 avuç", 25],
      ["Fındık", 628, 15.0, 16.7, 60.8, "1 avuç", 25],
      ["Antep fıstığı", 560, 20.2, 27.2, 45.3, "1 avuç", 25],
      ["Kaju", 553, 18.2, 30.2, 43.9, "1 avuç", 25],
      ["Yer fıstığı", 567, 25.8, 16.1, 49.2, "1 avuç", 25],
      ["Ay çekirdeği", 584, 20.8, 20.0, 51.5, "1 avuç", 25],
      ["Kabak çekirdeği", 559, 30.2, 10.7, 49.0, "1 avuç", 25],
      ["Chia tohumu", 486, 16.5, 42.1, 30.7, "1 yemek kaşığı", 12],
      ["Keten tohumu", 534, 18.3, 28.9, 42.2, "1 yemek kaşığı", 10],
      ["Fıstık ezmesi", 588, 25.1, 20.0, 50.4, "1 yemek kaşığı", 16],
      ["Tahin", 595, 17.0, 21.0, 53.8, "1 yemek kaşığı", 15],
      ["Zeytinyağı", 884, 0.0, 0.0, 100.0, "1 yemek kaşığı", 13],
      ["Ayçiçek yağı", 884, 0.0, 0.0, 100.0, "1 yemek kaşığı", 13],
      ["Siyah zeytin", 115, 0.8, 6.3, 10.9, "8 adet", 30],
      ["Yeşil zeytin", 145, 1.0, 3.8, 15.3, "8 adet", 30],
      ["Bal", 304, 0.3, 82.4, 0.0, "1 yemek kaşığı", 21],
      ["Reçel", 278, 0.4, 69.0, 0.1, "1 yemek kaşığı", 20],
      ["Pekmez", 290, 1.0, 70.0, 0.1, "1 yemek kaşığı", 20],
    ],
  },
  {
    id: "turk", ad: "Türk Mutfağı", ikon: "🍲", renk: "#fb923c",
    besinler: [
      ["Mercimek çorbası", 65, 3.5, 10.0, 1.5, "1 kâse", 250],
      ["Ezogelin çorbası", 72, 3.2, 11.0, 1.8, "1 kâse", 250],
      ["Yayla çorbası", 68, 2.8, 9.0, 2.5, "1 kâse", 250],
      ["Tarhana çorbası", 70, 3.0, 11.0, 1.8, "1 kâse", 250],
      ["İşkembe çorbası", 95, 7.0, 5.0, 5.0, "1 kâse", 250],
      ["Kuru fasulye (yemek)", 110, 6.0, 15.0, 3.0, "1 porsiyon", 250],
      ["Nohut yemeği", 120, 6.0, 16.0, 3.5, "1 porsiyon", 250],
      ["Etli türlü", 95, 5.0, 9.0, 4.5, "1 porsiyon", 250],
      ["Karnıyarık", 135, 5.0, 10.0, 8.5, "1 adet", 200],
      ["İmam bayıldı", 125, 2.0, 11.0, 8.5, "1 adet", 200],
      ["Dolma (zeytinyağlı)", 160, 2.5, 20.0, 8.0, "4 adet", 120],
      ["Etli biber dolma", 130, 6.0, 13.0, 6.0, "2 adet", 200],
      ["Mantı (yoğurtlu)", 215, 9.0, 28.0, 7.5, "1 porsiyon", 250],
      ["Lahmacun", 240, 10.0, 32.0, 8.0, "1 adet", 120],
      ["Pide (kıymalı)", 265, 11.0, 32.0, 10.0, "1 porsiyon", 250],
      ["Pide (kaşarlı)", 290, 13.0, 31.0, 13.0, "1 porsiyon", 250],
      ["Börek (peynirli)", 300, 8.0, 30.0, 16.0, "1 dilim", 120],
      ["Gözleme (peynirli)", 250, 8.5, 32.0, 9.5, "1 adet", 200],
      ["Pilav (tereyağlı)", 180, 3.5, 32.0, 4.5, "1 kepçe", 150],
      ["Menemen (sucuklu)", 165, 8.0, 5.0, 12.5, "1 porsiyon", 250],
      ["Kısır", 185, 4.0, 30.0, 5.5, "1 porsiyon", 150],
      ["Cacık", 45, 2.0, 3.0, 2.8, "1 kâse", 200],
      ["Haydari", 180, 6.0, 4.0, 15.0, "1 porsiyon", 80],
      ["İskender", 275, 15.0, 22.0, 14.0, "1 porsiyon", 350],
      ["Döner (et, dürüm)", 240, 13.0, 25.0, 10.0, "1 dürüm", 250],
      ["Tavuk dürüm", 210, 14.0, 24.0, 7.0, "1 dürüm", 250],
      ["Islak hamburger", 295, 11.0, 28.0, 16.0, "1 adet", 120],
      ["Kumpir", 185, 5.0, 25.0, 7.5, "1 adet", 350],
      ["Çiğ köfte (etsiz)", 190, 5.0, 37.0, 3.0, "1 porsiyon", 120],
      ["Su böreği", 265, 9.0, 28.0, 13.0, "1 dilim", 150],
    ],
  },
  {
    id: "fastfood", ad: "Fast Food & Hazır", ikon: "🍔", renk: "#ef4444",
    besinler: [
      ["Hamburger (klasik)", 250, 13.0, 30.0, 9.0, "1 adet", 150],
      ["Cheeseburger (büyük)", 295, 15.0, 27.0, 14.5, "1 adet", 220],
      ["Patates kızartması", 312, 3.4, 41.0, 15.0, "1 orta", 120],
      ["Pizza (margarita)", 266, 11.0, 33.0, 10.0, "1 dilim", 110],
      ["Pizza (sucuklu)", 298, 12.5, 31.0, 14.0, "1 dilim", 110],
      ["Tavuk nugget", 296, 15.0, 16.0, 19.0, "6 adet", 100],
      ["Tost (kaşarlı)", 300, 13.0, 30.0, 14.0, "1 adet", 150],
      ["Sandviç (ton balıklı)", 190, 11.0, 22.0, 6.0, "1 adet", 200],
      ["Noodle (hazır)", 448, 9.0, 60.0, 18.0, "1 paket", 75],
      ["Pizza (karışık, dilim)", 280, 12.0, 30.0, 12.5, "1 dilim", 120],
    ],
  },
  {
    id: "tatli", ad: "Tatlı & Atıştırmalık", ikon: "🍰", renk: "#c084fc",
    besinler: [
      ["Baklava", 430, 6.0, 48.0, 24.0, "1 dilim", 60],
      ["Künefe", 345, 8.0, 40.0, 17.0, "1 porsiyon", 150],
      ["Sütlaç", 143, 3.5, 24.0, 3.5, "1 kâse", 150],
      ["Kazandibi", 165, 4.0, 27.0, 4.5, "1 porsiyon", 150],
      ["Revani", 340, 4.5, 58.0, 10.0, "1 dilim", 80],
      ["Tulumba", 395, 3.5, 56.0, 18.0, "4 adet", 80],
      ["Lokma", 380, 4.0, 55.0, 16.0, "5 adet", 80],
      ["Çikolata (sütlü)", 535, 7.6, 59.0, 30.0, "1 sıra", 25],
      ["Bitter çikolata (%70)", 598, 7.8, 46.0, 43.0, "1 sıra", 20],
      ["Bisküvi (sade)", 450, 7.0, 72.0, 15.0, "4 adet", 30],
      ["Kek (sade)", 350, 5.0, 50.0, 14.0, "1 dilim", 60],
      ["Kurabiye", 480, 6.0, 62.0, 23.0, "3 adet", 40],
      ["Cips (patates)", 536, 7.0, 53.0, 34.0, "1 küçük paket", 35],
      ["Mısır patlağı (yağsız)", 387, 12.0, 78.0, 4.5, "1 kâse", 25],
      ["Protein bar", 380, 30.0, 35.0, 11.0, "1 adet", 60],
      ["Helva (tahin)", 516, 12.0, 53.0, 30.0, "1 dilim", 40],
      ["Lokum", 350, 0.2, 87.0, 0.1, "3 adet", 30],
      ["Dondurma (çikolatalı)", 216, 3.8, 28.0, 11.0, "1 top", 60],
    ],
  },
  {
    id: "icecek", ad: "İçecekler", ikon: "🥤", renk: "#38bdf8",
    besinler: [
      ["Su", 0, 0.0, 0.0, 0.0, "1 bardak", 250],
      ["Çay (şekersiz)", 1, 0.0, 0.2, 0.0, "1 bardak", 100],
      ["Türk kahvesi (sade)", 2, 0.1, 0.3, 0.0, "1 fincan", 70],
      ["Filtre kahve (sade)", 2, 0.1, 0.3, 0.0, "1 kupa", 240],
      ["Latte (tam yağlı süt)", 55, 3.0, 5.0, 2.5, "1 kupa", 330],
      ["Cappuccino", 45, 2.8, 4.2, 1.9, "1 kupa", 200],
      ["Kola", 42, 0.0, 10.6, 0.0, "1 kutu", 330],
      ["Kola (şekersiz)", 0, 0.0, 0.0, 0.0, "1 kutu", 330],
      ["Meyve suyu (portakal)", 45, 0.7, 10.4, 0.2, "1 bardak", 200],
      ["Limonata", 40, 0.1, 10.0, 0.0, "1 bardak", 250],
      ["Enerji içeceği", 45, 0.0, 11.0, 0.0, "1 kutu", 250],
      ["Bira", 43, 0.5, 3.6, 0.0, "1 şişe", 330],
      ["Şarap (kırmızı)", 85, 0.1, 2.6, 0.0, "1 kadeh", 150],
      ["Rakı", 245, 0.0, 0.0, 0.0, "1 duble", 100],
      ["Şalgam suyu", 20, 0.5, 4.0, 0.0, "1 bardak", 250],
      ["Protein tozu (whey)", 400, 80.0, 8.0, 6.0, "1 ölçek", 30],
      ["Smoothie (meyveli)", 70, 1.5, 15.0, 0.5, "1 bardak", 300],
    ],
  },
];

// Yukarıdaki listenin devamı. Open Food Facts paketli ürün ağırlıklı olduğu
// için ev yemekleri, sakatat, balık çeşitleri ve çorbalar burada tamamlandı.
// Biçim: [kategoriId, ad, kcal, protein, karb, yağ, porsiyon adı, porsiyon gramı]
const EK_BESINLER = [
  // --- Ekmek & tahıl ---
  ["ekmek", "Kepekli ekmek", 250, 10.0, 43.0, 3.5, "1 dilim", 28],
  ["ekmek", "Mısır ekmeği", 270, 6.5, 50.0, 4.5, "1 dilim", 50],
  ["ekmek", "Ramazan pidesi", 290, 9.0, 55.0, 3.5, "1 dilim", 70],
  ["ekmek", "Bazlama", 275, 8.0, 52.0, 3.0, "1 adet", 90],
  ["ekmek", "Tost ekmeği", 280, 9.0, 50.0, 4.5, "1 dilim", 30],
  ["ekmek", "Grissini / kraker", 420, 10.0, 70.0, 11.0, "5 adet", 25],
  ["ekmek", "Erişte (pişmiş)", 140, 5.0, 27.0, 1.5, "1 porsiyon", 180],
  ["ekmek", "Şehriye (pişmiş)", 150, 5.2, 30.0, 0.8, "1 porsiyon", 150],
  ["ekmek", "Arpa şehriye pilavı", 165, 4.5, 30.0, 3.5, "1 kepçe", 150],
  ["ekmek", "Bulgur pilavı (tereyağlı)", 145, 4.0, 26.0, 3.0, "1 kepçe", 150],
  ["ekmek", "İç pilav", 195, 4.5, 31.0, 6.0, "1 kepçe", 150],
  ["ekmek", "Karabuğday (pişmiş)", 92, 3.4, 19.9, 0.6, "1 porsiyon", 150],
  ["ekmek", "Patates püresi", 110, 2.0, 15.0, 4.5, "1 porsiyon", 180],
  ["ekmek", "Patates kroket", 230, 3.0, 28.0, 11.0, "5 adet", 100],

  // --- Et, tavuk, balık ---
  ["et", "Tavuk göğsü (haşlanmış)", 150, 30.0, 0.0, 3.0, "1 porsiyon", 150],
  ["et", "Tavuk şiş", 180, 27.0, 2.0, 7.0, "1 porsiyon", 150],
  ["et", "Tavuk pane", 290, 20.0, 18.0, 15.0, "1 porsiyon", 150],
  ["et", "Dana haşlama", 200, 29.0, 0.0, 9.0, "1 porsiyon", 150],
  ["et", "Dana jülyen / sote", 215, 25.0, 4.0, 11.0, "1 porsiyon", 180],
  ["et", "Kuzu tandır", 310, 24.0, 0.0, 24.0, "1 porsiyon", 150],
  ["et", "Kuzu incik", 265, 26.0, 1.0, 17.0, "1 adet", 250],
  ["et", "Ciğer (tava)", 230, 25.0, 6.0, 11.0, "1 porsiyon", 120],
  ["et", "Böbrek / yürek ızgara", 180, 26.0, 1.0, 8.0, "1 porsiyon", 120],
  ["et", "Kokoreç", 320, 18.0, 12.0, 23.0, "1 yarım ekmek", 180],
  ["et", "Tavuk döner", 225, 20.0, 3.0, 14.0, "1 porsiyon", 150],
  ["et", "Çiğ köfte (etli)", 215, 9.0, 32.0, 6.0, "1 porsiyon", 120],
  ["et", "Hamsi (ızgara)", 160, 20.0, 0.0, 9.0, "1 porsiyon", 150],
  ["et", "Lüfer / istavrit", 145, 21.0, 0.0, 6.5, "1 adet", 180],
  ["et", "Uskumru (ızgara)", 205, 22.0, 0.0, 13.0, "1 adet", 180],
  ["et", "Alabalık", 148, 21.0, 0.0, 7.0, "1 adet", 200],
  ["et", "Kalamar (tava)", 230, 16.0, 16.0, 11.0, "1 porsiyon", 150],
  ["et", "Ahtapot (ızgara)", 164, 30.0, 4.0, 2.0, "1 porsiyon", 150],
  ["et", "Levrek buğulama", 115, 21.0, 2.0, 2.5, "1 porsiyon", 200],
  ["et", "Balık ekmek", 215, 15.0, 22.0, 7.0, "1 adet", 250],

  // --- Süt ürünleri ---
  ["sut", "Süt (yağsız)", 34, 3.4, 5.0, 0.1, "1 su bardağı", 200],
  ["sut", "Badem sütü (şekersiz)", 15, 0.6, 0.6, 1.1, "1 su bardağı", 200],
  ["sut", "Yulaf sütü", 45, 1.0, 7.0, 1.5, "1 su bardağı", 200],
  ["sut", "Yunan yoğurdu", 97, 9.0, 4.0, 5.0, "1 kâse", 150],
  ["sut", "Meyveli yoğurt", 95, 3.5, 15.0, 2.2, "1 kap", 125],
  ["sut", "Çökelek", 85, 14.0, 3.0, 1.5, "1 porsiyon", 60],
  ["sut", "Ezine peyniri", 290, 18.0, 1.5, 24.0, "1 dilim", 30],
  ["sut", "Mihaliç peyniri", 355, 26.0, 1.5, 27.0, "1 dilim", 30],
  ["sut", "Örgü peyniri", 300, 22.0, 2.0, 23.0, "1 porsiyon", 30],
  ["sut", "Mozzarella", 280, 22.0, 2.2, 20.0, "1 dilim", 30],
  ["sut", "Rokfor / küflü peynir", 353, 21.0, 2.3, 29.0, "1 dilim", 25],
  ["sut", "Muhallebi", 120, 3.2, 20.0, 3.0, "1 kâse", 150],
  ["sut", "Puding (hazır)", 130, 3.0, 21.0, 3.5, "1 kap", 120],
  ["sut", "Sütlü nescafe", 50, 2.0, 7.0, 1.5, "1 kupa", 200],

  // --- Yumurta & baklagil ---
  ["yumurta", "Yumurta (sahanda)", 196, 13.6, 0.8, 15.3, "1 adet", 60],
  ["yumurta", "Kaygana", 175, 9.0, 8.0, 12.0, "1 porsiyon", 120],
  ["yumurta", "Mercimek köftesi", 165, 5.0, 29.0, 3.5, "5 adet", 100],
  ["yumurta", "Fava", 150, 6.0, 20.0, 5.0, "1 porsiyon", 100],
  ["yumurta", "Barbunya pilaki", 120, 5.5, 18.0, 3.5, "1 porsiyon", 180],
  ["yumurta", "Nohut salatası", 145, 7.0, 20.0, 4.5, "1 porsiyon", 150],
  ["yumurta", "Edamame", 121, 11.9, 8.9, 5.2, "1 porsiyon", 100],
  ["yumurta", "Soya kıyma (kuru)", 330, 50.0, 30.0, 1.5, "1 porsiyon", 50],

  // --- Sebzeler ---
  ["sebze", "Kırmızı biber", 31, 1.0, 6.0, 0.3, "1 adet", 80],
  ["sebze", "Enginar", 47, 3.3, 10.5, 0.2, "1 adet", 120],
  ["sebze", "Bamya", 33, 1.9, 7.5, 0.2, "1 porsiyon", 150],
  ["sebze", "Kereviz", 42, 1.5, 9.2, 0.3, "1 porsiyon", 150],
  ["sebze", "Brüksel lahanası", 43, 3.4, 9.0, 0.3, "1 porsiyon", 120],
  ["sebze", "Pancar (haşlanmış)", 44, 1.7, 10.0, 0.2, "1 porsiyon", 120],
  ["sebze", "Kuşkonmaz", 20, 2.2, 3.9, 0.1, "1 porsiyon", 120],
  ["sebze", "Semizotu", 16, 1.3, 3.4, 0.4, "1 porsiyon", 100],
  ["sebze", "Maydanoz", 36, 3.0, 6.3, 0.8, "1 demet", 50],
  ["sebze", "Dereotu", 43, 3.5, 7.0, 1.1, "1 demet", 40],
  ["sebze", "Mısır (konserve)", 81, 2.9, 19.0, 1.0, "1 porsiyon", 100],
  ["sebze", "Turşu (karışık)", 20, 0.9, 4.0, 0.2, "1 porsiyon", 80],
  ["sebze", "Közlenmiş patlıcan salatası", 95, 1.5, 7.0, 7.0, "1 porsiyon", 120],
  ["sebze", "Zeytinyağlı taze fasulye", 75, 2.0, 8.0, 4.0, "1 porsiyon", 180],
  ["sebze", "Zeytinyağlı pırasa", 85, 2.0, 11.0, 4.0, "1 porsiyon", 180],
  ["sebze", "Ispanak yemeği (etli)", 85, 5.0, 7.0, 4.0, "1 porsiyon", 200],
  ["sebze", "Kabak musakka", 110, 5.0, 8.0, 6.5, "1 porsiyon", 200],
  ["sebze", "Mantar sote", 95, 3.5, 6.0, 6.5, "1 porsiyon", 150],

  // --- Meyveler ---
  ["meyve", "Greyfurt", 42, 0.8, 10.7, 0.1, "1 yarım", 150],
  ["meyve", "Limon", 29, 1.1, 9.3, 0.3, "1 adet", 60],
  ["meyve", "Böğürtlen", 43, 1.4, 9.6, 0.5, "1 kâse", 150],
  ["meyve", "Yaban mersini", 57, 0.7, 14.5, 0.3, "1 kâse", 150],
  ["meyve", "Ahududu", 52, 1.2, 11.9, 0.7, "1 kâse", 150],
  ["meyve", "Mango", 60, 0.8, 15.0, 0.4, "1 adet", 200],
  ["meyve", "Avokado (yarım)", 160, 2.0, 8.5, 14.7, "1 yarım", 100],
  ["meyve", "Trabzon hurması", 70, 0.6, 18.6, 0.2, "1 adet", 150],
  ["meyve", "Ayva", 57, 0.4, 15.3, 0.1, "1 adet", 180],
  ["meyve", "Kuru incir", 249, 3.3, 63.9, 0.9, "3 adet", 45],
  ["meyve", "Kuru erik", 240, 2.2, 63.9, 0.4, "4 adet", 40],
  ["meyve", "Hindistan cevizi (kuru)", 660, 6.9, 24.0, 64.5, "1 avuç", 25],

  // --- Kuruyemiş & yağ ---
  ["kuruyemis", "Leblebi", 371, 19.0, 58.0, 6.0, "1 avuç", 30],
  ["kuruyemis", "Kaju ezmesi", 580, 18.0, 27.0, 46.0, "1 yemek kaşığı", 16],
  ["kuruyemis", "Badem ezmesi", 614, 21.0, 19.0, 56.0, "1 yemek kaşığı", 16],
  ["kuruyemis", "Susam", 573, 17.7, 23.4, 49.7, "1 yemek kaşığı", 10],
  ["kuruyemis", "Çam fıstığı", 673, 13.7, 13.1, 68.4, "1 yemek kaşığı", 15],
  ["kuruyemis", "Hindistan cevizi yağı", 862, 0.0, 0.0, 100.0, "1 yemek kaşığı", 13],
  ["kuruyemis", "Mayonez", 680, 1.0, 1.5, 75.0, "1 yemek kaşığı", 15],
  ["kuruyemis", "Ketçap", 101, 1.2, 25.0, 0.1, "1 yemek kaşığı", 17],
  ["kuruyemis", "Hardal", 66, 4.4, 5.8, 3.3, "1 yemek kaşığı", 15],
  ["kuruyemis", "Nar ekşisi", 265, 0.5, 65.0, 0.2, "1 yemek kaşığı", 18],
  ["kuruyemis", "Salça (domates)", 82, 4.3, 18.9, 0.5, "1 yemek kaşığı", 16],

  // --- Türk mutfağı ---
  ["turk", "Domates çorbası", 65, 1.8, 9.0, 2.5, "1 kâse", 250],
  ["turk", "Mantar çorbası", 78, 2.5, 8.0, 4.0, "1 kâse", 250],
  ["turk", "Tavuk suyu çorba", 55, 4.0, 6.0, 1.5, "1 kâse", 250],
  ["turk", "Düğün çorbası", 95, 4.5, 9.0, 4.5, "1 kâse", 250],
  ["turk", "Brokoli çorbası", 70, 2.5, 8.0, 3.2, "1 kâse", 250],
  ["turk", "Etli nohut", 135, 8.0, 15.0, 5.0, "1 porsiyon", 250],
  ["turk", "Kuru fasulye + pilav", 155, 6.5, 24.0, 4.0, "1 porsiyon", 350],
  ["turk", "Hünkar beğendi", 160, 9.0, 9.0, 10.0, "1 porsiyon", 250],
  ["turk", "Tas kebabı", 125, 11.0, 8.0, 5.5, "1 porsiyon", 250],
  ["turk", "Güveç", 110, 7.0, 9.0, 5.0, "1 porsiyon", 250],
  ["turk", "Patlıcan musakka", 130, 6.0, 9.0, 8.0, "1 porsiyon", 250],
  ["turk", "Zeytinyağlı yaprak sarma", 160, 2.5, 20.0, 8.0, "4 adet", 120],
  ["turk", "Lahana sarma (etli)", 115, 5.5, 12.0, 5.0, "4 adet", 180],
  ["turk", "Manti (fırın)", 250, 10.0, 32.0, 9.0, "1 porsiyon", 250],
  ["turk", "Erişte (ev)", 180, 6.0, 30.0, 4.0, "1 porsiyon", 200],
  ["turk", "Kayseri mantısı", 230, 9.5, 30.0, 8.0, "1 porsiyon", 250],
  ["turk", "Çiğ börek", 310, 9.0, 30.0, 17.0, "1 adet", 120],
  ["turk", "Kol böreği", 290, 8.0, 31.0, 15.0, "1 dilim", 120],
  ["turk", "Talaş böreği", 330, 9.0, 30.0, 19.0, "1 adet", 100],
  ["turk", "Pazı / ıspanaklı gözleme", 215, 7.0, 30.0, 7.5, "1 adet", 200],
  ["turk", "Kıymalı gözleme", 265, 11.0, 30.0, 11.0, "1 adet", 200],
  ["turk", "Pide (yumurtalı kıymalı)", 280, 12.0, 31.0, 12.0, "1 porsiyon", 250],
  ["turk", "Kıymalı ıspanaklı pide", 250, 10.0, 30.0, 10.0, "1 porsiyon", 250],
  ["turk", "Sucuklu yumurta", 230, 13.0, 2.0, 19.0, "1 porsiyon", 180],
  ["turk", "Serpme kahvaltı (ort.)", 190, 8.0, 16.0, 11.0, "1 kişilik", 450],
  ["turk", "Menemen (peynirli)", 135, 7.0, 5.0, 9.5, "1 porsiyon", 250],
  ["turk", "Piyaz", 130, 5.0, 17.0, 4.5, "1 porsiyon", 180],
  ["turk", "Mercimek salatası", 125, 6.0, 18.0, 3.0, "1 porsiyon", 150],
  ["turk", "Şakşuka", 120, 1.8, 9.0, 8.5, "1 porsiyon", 150],
  ["turk", "Ezme (acılı)", 55, 1.2, 7.0, 2.5, "1 porsiyon", 80],
  ["turk", "Atom / acılı ezme", 165, 5.0, 5.0, 14.0, "1 porsiyon", 80],
  ["turk", "Humuslu tabak", 180, 7.0, 16.0, 10.0, "1 porsiyon", 100],
  ["turk", "Tavuklu salata", 115, 12.0, 5.0, 5.0, "1 porsiyon", 250],
  ["turk", "Ton balıklı salata", 105, 10.0, 6.0, 4.5, "1 porsiyon", 250],

  // --- Fast food & hazır ---
  ["fastfood", "Tavuk burger", 265, 14.0, 28.0, 11.0, "1 adet", 180],
  ["fastfood", "Balık burger", 280, 13.0, 30.0, 13.0, "1 adet", 170],
  ["fastfood", "Wrap (tavuklu)", 215, 13.0, 24.0, 8.0, "1 adet", 230],
  ["fastfood", "Soğan halkası", 340, 4.5, 38.0, 19.0, "1 porsiyon", 100],
  ["fastfood", "Çıtır tavuk", 310, 20.0, 18.0, 18.0, "1 porsiyon", 150],
  ["fastfood", "Sushi (6 parça)", 145, 6.0, 26.0, 1.5, "6 parça", 150],
  ["fastfood", "Falafel", 333, 13.3, 31.8, 17.8, "5 adet", 100],
  ["fastfood", "Pizza (vejetaryen)", 240, 10.0, 32.0, 8.0, "1 dilim", 110],
  ["fastfood", "Hazır çorba (poşet)", 320, 8.0, 55.0, 7.0, "1 kâse", 25],
  ["fastfood", "Dondurulmuş pizza", 250, 10.0, 30.0, 10.0, "1 yarım", 180],

  // --- Tatlı & atıştırmalık ---
  ["tatli", "Şöbiyet", 440, 7.0, 45.0, 26.0, "1 dilim", 60],
  ["tatli", "Kadayıf", 380, 6.0, 50.0, 18.0, "1 porsiyon", 120],
  ["tatli", "Şekerpare", 360, 4.5, 60.0, 12.0, "2 adet", 70],
  ["tatli", "Kemalpaşa tatlısı", 330, 5.0, 58.0, 9.0, "2 adet", 80],
  ["tatli", "Aşure", 160, 3.5, 32.0, 2.5, "1 kâse", 150],
  ["tatli", "Trileçe", 290, 5.0, 38.0, 13.0, "1 dilim", 120],
  ["tatli", "Profiterol", 310, 5.0, 36.0, 16.0, "1 porsiyon", 120],
  ["tatli", "Cheesecake", 320, 6.0, 30.0, 20.0, "1 dilim", 110],
  ["tatli", "Brownie", 420, 5.5, 52.0, 22.0, "1 adet", 70],
  ["tatli", "Magnolia", 230, 4.0, 30.0, 11.0, "1 kap", 150],
  ["tatli", "Kurabiye (un)", 470, 5.5, 60.0, 23.0, "3 adet", 45],
  ["tatli", "Çikolatalı gofret", 510, 6.0, 60.0, 27.0, "1 adet", 35],
  ["tatli", "Beyaz çikolata", 539, 5.9, 59.0, 32.0, "1 sıra", 25],
  ["tatli", "Çikolatalı fındık kreması", 539, 6.3, 57.5, 30.9, "1 yemek kaşığı", 20],
  ["tatli", "Mısır cipsi (nacho)", 490, 7.0, 60.0, 24.0, "1 porsiyon", 40],
  ["tatli", "Tuzlu kraker", 430, 9.0, 70.0, 12.0, "5 adet", 30],
  ["tatli", "Jöle / jelibon", 350, 6.0, 80.0, 0.2, "1 avuç", 40],

  // --- İçecekler ---
  ["icecek", "Çay (1 şeker)", 21, 0.0, 5.2, 0.0, "1 bardak", 100],
  ["icecek", "Türk kahvesi (orta)", 25, 0.1, 6.0, 0.0, "1 fincan", 70],
  ["icecek", "Americano", 3, 0.2, 0.5, 0.0, "1 kupa", 240],
  ["icecek", "Mocha", 95, 3.2, 14.0, 3.2, "1 kupa", 330],
  ["icecek", "Sıcak çikolata", 110, 3.5, 18.0, 3.0, "1 kupa", 250],
  ["icecek", "Salep", 115, 3.0, 20.0, 2.5, "1 kupa", 200],
  ["icecek", "Boza", 110, 1.5, 24.0, 0.2, "1 bardak", 200],
  ["icecek", "Limonlu soda", 22, 0.0, 5.5, 0.0, "1 şişe", 250],
  ["icecek", "Maden suyu", 0, 0.0, 0.0, 0.0, "1 şişe", 250],
  ["icecek", "Ice tea", 30, 0.0, 7.5, 0.0, "1 kutu", 330],
  ["icecek", "Nar suyu", 54, 0.4, 13.0, 0.3, "1 bardak", 200],
  ["icecek", "Vişne suyu", 50, 0.5, 12.0, 0.2, "1 bardak", 200],
  ["icecek", "Portakal suyu (taze)", 45, 0.7, 10.4, 0.2, "1 bardak", 200],
  ["icecek", "Votka / cin", 231, 0.0, 0.0, 0.0, "1 duble", 100],
  ["icecek", "Viski", 250, 0.0, 0.1, 0.0, "1 duble", 100],
  ["icecek", "Şarap (beyaz)", 82, 0.1, 2.6, 0.0, "1 kadeh", 150],
  ["icecek", "Kazein / gece proteini", 370, 78.0, 6.0, 3.0, "1 ölçek", 30],
  ["icecek", "BCAA / aminoasit", 20, 4.0, 1.0, 0.0, "1 ölçek", 10],
];

// Marka ürünleri ayrı dosyada; arama indeksine burada katılıyor.
import { MARKA_URUNLERI } from "./besinlerMarka";
import { YEMEK_KATEGORILERI, EV_YEMEKLERI } from "./besinlerYemek";

const KAT_HARITA = Object.fromEntries([...BESIN_KATEGORILERI, ...YEMEK_KATEGORILERI].map((k) => [k.id, k]));
// Marka ürünlerinden gelen ama temel listede olmayan kategori:
const PAKET_KATEGORI = { id: "paket", ad: "Paketli Ürünler", ikon: "📦", renk: "#94a3b8" };

// Düz liste — arama için. Üç kaynak birleşiyor:
//   1) Temel besinler (USDA/TürKomp, yukarıdaki kategoriler)
//   2) Ek besinler (ev yemekleri, balık, çorba…)
//   3) Ev & restoran yemekleri (besinlerYemek.js — kavurma, sote, kebap…)
//   4) Market ürünleri (Open Food Facts, markalı)
// "lif" yalnızca bilinen kalemlerde dolu; bilinmiyorsa undefined (0 sanılmasın).
const TEMEL = [
  ...BESIN_KATEGORILERI.flatMap((k) =>
    k.besinler.map(([ad, kcal, protein, karb, yag, porsiyonAd, porsiyonGram]) => ({
      id: `${k.id}:${ad}`,
      ad, marka: "", kcal, protein, karb, yag, porsiyonAd, porsiyonGram,
      kategori: k.id, kategoriAd: k.ad, ikon: k.ikon, renk: k.renk, kaynak: "temel",
    }))
  ),
  ...EK_BESINLER.map(([katId, ad, kcal, protein, karb, yag, porsiyonAd, porsiyonGram]) => {
    const k = KAT_HARITA[katId] || PAKET_KATEGORI;
    return {
      id: `${katId}:${ad}`,
      ad, marka: "", kcal, protein, karb, yag, porsiyonAd, porsiyonGram,
      kategori: katId, kategoriAd: k.ad, ikon: k.ikon, renk: k.renk, kaynak: "temel",
    };
  }),
];
// Aynı ad iki listede varsa temel listedeki kalır.
const VAR_OLAN = new Set(TEMEL.map((b) => b.ad.toLocaleLowerCase("tr")));
export const TUM_BESINLER = [
  ...TEMEL,
  ...EV_YEMEKLERI.filter(([, ad]) => !VAR_OLAN.has(ad.toLocaleLowerCase("tr"))).map(([katId, ad, kcal, protein, karb, yag, porsiyonAd, porsiyonGram, lif]) => {
    const k = KAT_HARITA[katId] || PAKET_KATEGORI;
    return {
      id: `${katId}:${ad}`,
      ad, marka: "", kcal, protein, karb, yag, porsiyonAd, porsiyonGram, lif,
      kategori: katId, kategoriAd: k.ad, ikon: k.ikon, renk: k.renk, kaynak: "temel",
    };
  }),
  ...MARKA_URUNLERI.map(([ad, marka, katId, kcal, protein, karb, yag, porsiyonAd, porsiyonGram], i) => {
    const k = KAT_HARITA[katId] || PAKET_KATEGORI;
    return {
      id: `m${i}`,
      ad, marka, kcal, protein, karb, yag, porsiyonAd, porsiyonGram,
      kategori: katId, kategoriAd: k.ad, ikon: k.ikon, renk: k.renk, kaynak: "marka",
    };
  }),
];

export const KATEGORI_LISTESI = [...YEMEK_KATEGORILERI, ...BESIN_KATEGORILERI]
  .map(({ id, ad, ikon, renk }) => ({ id, ad, ikon, renk }))
  .concat(PAKET_KATEGORI);

export const kategoriBesinleri = (katId) => TUM_BESINLER.filter((b) => b.kategori === katId);

// Türkçe arama: büyük/küçük harf ve "i/ı" farkını yok sayar.
const sadelestir = (s) =>
  String(s || "").toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");

// Arama indeksi bir kez kurulur; her tuşta yeniden sadeleştirme yapılmaz.
const INDEKS = TUM_BESINLER.map((b) => ({
  b, ad: sadelestir(b.ad), marka: sadelestir(b.marka || ""),
}));

export function besinAra(terim, limit = 60) {
  const t = sadelestir(terim).trim();
  if (!t) return [];
  const bulunan = [];
  for (const x of INDEKS) {
    const i = x.ad.indexOf(t);
    const mi = x.marka ? x.marka.indexOf(t) : -1;
    if (i < 0 && mi < 0) continue;

    // Skorlama sırası önemli: "süt" aranınca önce Süt gelmeli, Sütlaç değil.
    // Bunun için kelime sınırına bakılıyor — eşleşmenin hemen ardından boşluk
    // ya da parantez geliyorsa bu tam bir kelimedir, kelimenin başlangıcı değil.
    const sinirMi = (son) => son === undefined || son === " " || son === "(" || son === "," || son === "-";
    let kademe;
    if (i === 0 && x.ad.length === t.length) kademe = 0;                               // birebir aynı
    else if (i === 0 && sinirMi(x.ad[t.length])) kademe = 1;                           // "süt (tam yağlı)"
    else if (i > 0 && x.ad[i - 1] === " " && sinirMi(x.ad[i + t.length])) kademe = 2;   // "tam yağlı süt"
    else if (i === 0) kademe = 3;                                                       // "sütlaç"
    else if (i > 0) kademe = 4;                                                         // adın ortasında
    else kademe = 5;                                                                    // yalnızca markada

    // Temel besinler (süt, yumurta, pilav…) markalı ürünlerin bir buçuk kademe
    // önünde başlar: insan "süt" ararken önce sütü görmek ister, bir markanın
    // "Sut" diye kaydedilmiş kutusunu değil. Ama çok iyi eşleşen bir marka
    // ürünü, kötü eşleşen bir temel besini yine de geçebilir.
    const skor = kademe + (x.b.kaynak === "temel" ? 0 : 1.5) + x.b.ad.length * 0.004;
    bulunan.push({ b: x.b, skor });
  }
  bulunan.sort((a, b) => a.skor - b.skor);
  return bulunan.slice(0, limit).map((x) => x.b);
}

export const BESIN_SAYISI = TUM_BESINLER.length;

export const besinBul = (id) => TUM_BESINLER.find((b) => b.id === id) || null;
