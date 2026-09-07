// Alışveriş kategorileri — "kendi alışveriş yerin" mantığı.
//
// Buradaki fikir bir mağaza reyonu gibi düşünmek: Zara'da ceket-gömlek-pantolon,
// MediaMarkt'ta telefon-laptop-beyaz eşya, Decathlon'da kamp-spor. Kullanıcı
// kategoriyi seçer, o reyonun kalemleri hazır gelir; fiyatları kendi yazar.
// Fiyat vermiyoruz — ürün ve marka farkı çok büyük, tahmin yanıltır.

export const ALISVERIS_KATEGORILER = [
  {
    id: "ustGiyim", ad: "Üst Giyim", ikon: "👕", renk: "#60a5fa",
    gruplar: [
      { ad: "Günlük", kalemler: ["Tişört", "Gömlek", "Polo yaka", "Sweatshirt", "Kapüşonlu"] },
      { ad: "Dış Giyim", kalemler: ["Ceket", "Blazer", "Mont", "Kaban", "Yağmurluk", "Yelek"] },
      { ad: "Örgü", kalemler: ["Kazak", "Hırka", "Süveter", "Boğazlı"] },
    ],
  },
  {
    id: "altGiyim", ad: "Alt Giyim", ikon: "👖", renk: "#818cf8",
    gruplar: [
      { ad: "Pantolon", kalemler: ["Jean", "Kumaş pantolon", "Chino", "Kargo pantolon", "Eşofman altı"] },
      { ad: "Yazlık", kalemler: ["Şort", "Bermuda", "Kapri", "Mayo / şort mayo"] },
      { ad: "Elbise & Etek", kalemler: ["Elbise", "Etek", "Tulum", "Takım elbise"] },
    ],
  },
  {
    id: "ayakkabi", ad: "Ayakkabı & Çanta", ikon: "👟", renk: "#f59e0b",
    gruplar: [
      { ad: "Ayakkabı", kalemler: ["Spor ayakkabı", "Sneaker", "Klasik ayakkabı", "Bot", "Sandalet", "Terlik", "Koşu ayakkabısı"] },
      { ad: "Çanta & Deri", kalemler: ["Sırt çantası", "El çantası", "Omuz çantası", "Cüzdan", "Kemer", "Valiz"] },
    ],
  },
  {
    id: "aksesuar", ad: "Aksesuar", ikon: "⌚", renk: "#a78bfa",
    gruplar: [
      { ad: "Takı & Saat", kalemler: ["Kol saati", "Akıllı saat kordonu", "Yüzük", "Kolye", "Bileklik", "Küpe"] },
      { ad: "Diğer", kalemler: ["Güneş gözlüğü", "Numaralı gözlük", "Şapka / bere", "Atkı & eldiven", "Parfüm", "Kravat / papyon"] },
    ],
  },
  {
    id: "teknoloji", ad: "Teknoloji", ikon: "📱", renk: "#22d3ee",
    gruplar: [
      { ad: "Mobil & Bilgisayar", kalemler: ["Telefon", "Tablet", "Dizüstü bilgisayar", "Masaüstü / kasa", "Monitör", "Yazıcı"] },
      { ad: "Ses & Görüntü", kalemler: ["Kulaklık", "Bluetooth hoparlör", "Televizyon", "Soundbar", "Kamera", "Projeksiyon"] },
      { ad: "Giyilebilir & Aksesuar", kalemler: ["Akıllı saat", "Powerbank", "Şarj cihazı & kablo", "Klavye & mouse", "Harici disk / SSD", "Router / modem"] },
      { ad: "Oyun", kalemler: ["Oyun konsolu", "Oyun kolu", "Oyun bilgisayarı", "VR gözlük", "Oyunlar"] },
    ],
  },
  {
    id: "beyazEsya", ad: "Beyaz Eşya", ikon: "🧺", renk: "#38bdf8",
    gruplar: [
      { ad: "Büyük Ev Aletleri", kalemler: ["Buzdolabı", "Çamaşır makinesi", "Bulaşık makinesi", "Kurutma makinesi", "Fırın", "Ankastre set", "Derin dondurucu", "Klima"] },
      { ad: "Küçük Ev Aletleri", kalemler: ["Elektrikli süpürge", "Robot süpürge", "Ütü", "Kahve makinesi", "Blender / rondo", "Airfryer", "Su ısıtıcısı", "Mikrodalga", "Tost makinesi"] },
    ],
  },
  {
    id: "evYasam", ad: "Ev & Yaşam", ikon: "🛋️", renk: "#10b981",
    gruplar: [
      { ad: "Mobilya", kalemler: ["Koltuk takımı", "Yatak & baza", "Gardırop", "Yemek masası", "Sandalye", "Sehpa", "Kitaplık", "Çalışma masası", "TV ünitesi"] },
      { ad: "Tekstil", kalemler: ["Nevresim takımı", "Yorgan", "Yastık", "Havlu seti", "Perde", "Halı", "Battaniye"] },
      { ad: "Mutfak", kalemler: ["Tencere & tava seti", "Yemek takımı", "Çatal-kaşık seti", "Bardak seti", "Saklama kapları"] },
      { ad: "Dekorasyon", kalemler: ["Aydınlatma / avize", "Tablo", "Ayna", "Saksı & bitki", "Mum & aksesuar"] },
    ],
  },
  {
    id: "kisiselBakim", ad: "Kişisel Bakım", ikon: "🧴", renk: "#f472b6",
    gruplar: [
      { ad: "Cilt & Saç", kalemler: ["Cilt bakım seti", "Güneş kremi", "Şampuan & saç bakım", "Saç kurutma / düzleştirici"] },
      { ad: "Bakım & Hijyen", kalemler: ["Tıraş makinesi", "Epilasyon cihazı", "Diş fırçası (şarjlı)", "Makyaj ürünleri", "Vitamin & takviye"] },
    ],
  },
  {
    id: "spor", ad: "Spor & Fitness", ikon: "🏋️", renk: "#84cc16",
    gruplar: [
      { ad: "Spor Giyim", kalemler: ["Antrenman tişörtü", "Tayt / şort", "Eşofman takımı", "Spor ayakkabı", "Spor çantası"] },
      { ad: "Ekipman", kalemler: ["Dambıl seti", "Yoga matı", "Direnç bandı", "Koşu bandı", "Bisiklet", "Akıllı tartı"] },
    ],
  },
  {
    id: "outdoor", ad: "Kamp & Outdoor", ikon: "⛺", renk: "#f97316",
    gruplar: [
      { ad: "Kamp Ekipmanı", kalemler: ["Çadır", "Uyku tulumu", "Mat / şişme yatak", "Kamp sandalyesi", "Kamp masası", "Kamp ocağı & tüp", "Termos", "Kafa lambası", "Buzluk"] },
      { ad: "Outdoor Giyim", kalemler: ["Outdoor mont", "Trekking botu", "Sırt çantası (50L+)", "Yağmurluk", "Termal içlik"] },
      { ad: "Doğa & Su", kalemler: ["Balıkçılık takımı", "Bisiklet & kask", "Kayak / snowboard", "Dalış / şnorkel"] },
    ],
  },
  {
    id: "hobi", ad: "Hobi & Eğlence", ikon: "🎨", renk: "#c084fc",
    gruplar: [
      { ad: "Hobi", kalemler: ["Kitap", "Müzik aleti", "Boya & resim malzemesi", "Fotoğraf ekipmanı", "El işi / model kit"] },
      { ad: "Oyun & Koleksiyon", kalemler: ["Kutu oyunu", "Puzzle", "Koleksiyon ürünü", "Drone", "Dijital oyun / abonelik"] },
    ],
  },
  {
    id: "mevsimlik", ad: "Yazlık / Kışlık", ikon: "🌤️", renk: "#fbbf24",
    gruplar: [
      { ad: "Yazlık", kalemler: ["Mayo / bikini", "Plaj havlusu", "Şapka & gözlük", "Sandalet", "Keten gömlek", "Plaj çantası"] },
      { ad: "Kışlık", kalemler: ["Kaban / mont", "Kışlık bot", "Atkı-bere-eldiven", "Termal içlik", "Kalın kazak", "Yağmurluk"] },
    ],
  },
  {
    id: "hediye", ad: "Hediye & Özel Gün", ikon: "🎁", renk: "#fb7185",
    gruplar: [
      { ad: "Özel Günler", kalemler: ["Doğum günü hediyesi", "Yılbaşı hediyesi", "Sevgililer günü", "Bayram hediyeleri", "Anneler / Babalar günü"] },
      { ad: "Organizasyon", kalemler: ["Düğün / nişan hediyesi", "Bebek hediyesi", "Çiçek & çikolata", "Hediye paketi"] },
    ],
  },
  {
    id: "cocuk", ad: "Bebek & Çocuk", ikon: "🧸", renk: "#2dd4bf",
    gruplar: [
      { ad: "Giyim & Bakım", kalemler: ["Çocuk kıyafeti", "Bebek bezi & mama", "Bebek arabası", "Oto koltuğu", "Beşik / yatak"] },
      { ad: "Oyun & Eğitim", kalemler: ["Oyuncak", "Eğitici set", "Kitap", "Bisiklet / scooter", "Okul çantası & kırtasiye"] },
    ],
  },
];

export const alisverisKategori = (id) => ALISVERIS_KATEGORILER.find((k) => k.id === id) || null;
