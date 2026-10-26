// İstanbul Rehberi — ELLE EKLENEN mekânlar.
//
// istanbulMekanlar.js betikle üretilir; kullanıcının sorduğu ya da sonradan
// fark edilen eksikler buraya eklenir ki yeniden üretimde kaybolmasın. Şema
// aynı. Kaynak her satırda: Time Out İstanbul, OGGUSTO (Aralık 2025 burger
// listesi), yemek.com (Anadolu yakası meyhaneleri, Kadıköy 2026 rehberi).
// Notlar kendi cümlelerimiz; puan editoryal "rehber puanı".

const m = (o) => ({
  odul: null, yesil: false, adres: null, gorsel: null, site: null, ozellikler: [], guzel: null, ...o,
});

export const EK_MEKANLAR = [
  // Kaynak: Time Out İstanbul — "Kadıköy'ün en iyi burgercilerinden".
  m({ id: "zapata", ad: "Zapata Burger", semt: "Caferağa (Sakız Sk.)", bolge: "kadikoy", yaka: "anadolu", fiyat: 2, puan: 8.4,
    imza: "Patlıcan beğendili ve pastırmalı burger, Meksika burger, istiridye mantarlı vejetaryen burger",
    not: "Kadıköy'ün en sevilen burgercilerinden. Geniş menüde klasiklerin yanında beğendili, jalapeñolu imza burgerler var; yanına cheddar soslu patates.",
    etiketler: ["Burger", "Kadıköy klasiği", "Vejetaryen seçenek"], durumlar: ["arkadas", "tek"],
    adres: "Caferağa, Sakız Sk. No:1/C, Kadıköy", gorsel: "https://media.timeout.com/images/106102116/750/422/image.jpg",
    turler: ["sokak"], yemekler: ["burger"] }),
  // Kaynak: OGGUSTO, İstanbul'un en iyi hamburgercileri (2025).
  m({ id: "grillinguys", ad: "Grillin Guys", semt: "Şaşkınbakkal", bolge: "bagdat", yaka: "anadolu", fiyat: 2, puan: 8.0,
    imza: "Double cheese, dana bacon burger",
    not: "Şaşkınbakkal'da küçük bir burgerci; çift köfteli burgerleri ve paket servisiyle Bağdat Caddesi tarafının favorisi.",
    etiketler: ["Burger", "Paket servis"], durumlar: ["arkadas", "tek"],
    adres: "Kazım Özalp Sk. No:22, Suadiye", gorsel: "https://cdn.oggusto.com/uploads/2025/09/Grillin-Guys.webp",
    turler: ["sokak"], yemekler: ["burger"] }),
  m({ id: "tamirane", ad: "Tamirane", semt: "Maslak (UNIQ İstanbul)", bolge: "etiler", yaka: "avrupa", fiyat: 3, puan: 8.0,
    imza: "Burger, paylaşımlık tabaklar, kokteyl",
    not: "Bar havasında, canlı müzikli bir burger ve paylaşım mutfağı; Maslak'ta iş çıkışı buluşmaları için.",
    etiketler: ["Burger", "Canlı müzik", "Bar"], durumlar: ["arkadas", "is"],
    gorsel: "https://cdn.oggusto.com/uploads/2025/12/Tamirane4.webp",
    turler: ["restoran"], yemekler: ["burger", "kokteyl"], ozellikler: ["canli"] }),
  // Kaynak: yemek.com, Anadolu Yakası'nın en iyi meyhaneleri.
  m({ id: "benusen", ad: "Benusen Restaurant", semt: "Kadıköy Çarşı (Caferağa)", bolge: "kadikoy", yaka: "anadolu", fiyat: 2, puan: 8.1,
    imza: "Hardal soslu levrek marin, deniz börülcesi, kalamar",
    not: "Kadıköy Çarşısı'nın en eski meyhanelerinden; üst katta müzik, altta çarşının uğultusu içinde klasik meze-balık sofrası.",
    etiketler: ["Klasik", "Meze", "Canlı müzik"], durumlar: ["arkadas", "kutlama"],
    gorsel: "https://imgrosetta.yemek.com/file/3048/728xauto.jpg",
    turler: ["meyhane"], yemekler: ["meze", "balik"], ozellikler: ["canli"] }),
  m({ id: "adanaoz", ad: "Adana Öz Asmaaltı", semt: "Bostancı", bolge: "bagdat", yaka: "anadolu", fiyat: 2, puan: 8.2,
    imza: "Adana kebap, kaburga, çöp şiş, patlıcan ezmesi",
    not: "Bağdat Caddesi'nin ucunda açık ocaklı kebapçı; kaburgası ve ezmeleri için Anadolu yakasının dört bir yanından gelinir.",
    etiketler: ["Ocakbaşı", "Klasik", "Aile"], durumlar: ["aile", "arkadas"],
    adres: "Bağdat Cad. No:535/A, Bostancı", gorsel: "https://imgrosetta.yemek.com/file/3050/728xauto.jpg",
    turler: ["restoran"], yemekler: ["kebap", "kaburga"] }),
  m({ id: "sunaninyeri", ad: "Suna'nın Yeri", semt: "Kandilli", bolge: "uskudar", yaka: "anadolu", fiyat: 3, puan: 8.3,
    imza: "Günün balığı, közlenmiş patlıcan, zeytinyağlılar",
    not: "Kandilli iskelesinin dibinde, ağaç altında Boğaz'a bakan sade bir balıkçı; ev usulü zeytinyağlıları ve sakinliğiyle bilinir.",
    etiketler: ["Boğaz kıyısı", "Balık", "Sakin"], durumlar: ["randevu", "aile"],
    adres: "Kandilli İskele Cad. No:17, Üsküdar", gorsel: "https://imgrosetta.yemek.com/file/3051/728xauto.jpg",
    turler: ["restoran"], yemekler: ["balik", "meze"], ozellikler: ["bogaz"], guzel: "bogaz" }),
  m({ id: "cundabalik", ad: "Cunda Balık", semt: "Bostancı", bolge: "bagdat", yaka: "anadolu", fiyat: 3, puan: 8.1,
    imza: "70'ten fazla otlu Ege mezesi",
    not: "Ayvalık-Cunda usulü balıkçı: Ege mezeleri masaya tepsiyle gelir, beğendiğini seçersin.",
    etiketler: ["Ege", "Meze", "Balık"], durumlar: ["arkadas", "aile"],
    adres: "Köy Yolu Sk. No:6/1, Bostancı", gorsel: "https://imgrosetta.yemek.com/file/3052/728xauto.jpg",
    turler: ["meyhane"], yemekler: ["balik", "meze"] }),
  m({ id: "radika", ad: "Radika", semt: "Koşuyolu", bolge: "kadikoy", yaka: "anadolu", fiyat: 3, puan: 8.0,
    imza: "Karides güveç, ızgara ahtapot",
    not: "Koşuyolu'nun ağaçlı sokağında yarı açık terası olan deniz ürünleri restoranı; hafta sonu kahvaltısı da var.",
    etiketler: ["Teras", "Deniz ürünleri"], durumlar: ["randevu", "arkadas"],
    adres: "Kalfaçeşme Sk. No:30, Koşuyolu", gorsel: "https://imgrosetta.yemek.com/file/3054/728xauto.jpg",
    turler: ["restoran"], yemekler: ["balik", "kahvalti"], ozellikler: ["bahce"], guzel: "bahce" }),
  // Kaynak: Time Out İstanbul (Durak Büfe), yemek.com Kadıköy 2026 rehberi.
  m({ id: "durakbufe", ad: "Durak Büfe", semt: "Kadıköy (Körler Sk.)", bolge: "kadikoy", yaka: "anadolu", fiyat: 1, puan: 7.9,
    imza: "Döner, taze sıkma meyve suyu",
    not: "Kadıköy çarşısında yıllardır döneriyle anılan ayaküstü büfe; vapur öncesi hızlı bir dürüm için.",
    etiketler: ["Döner", "Hızlı", "Uygun"], durumlar: ["tek", "arkadas"],
    adres: "Körler Sk. No:1, Kadıköy", turler: ["sokak"], yemekler: ["doner"] }),
  m({ id: "ethemefendi", ad: "Ethem Efendi Kahvaltı", semt: "Erenköy", bolge: "bagdat", yaka: "anadolu", fiyat: 2, puan: 8.0,
    imza: "Serpme kahvaltı",
    not: "Erenköy'de bol çeşitli serpme kahvaltısıyla hafta sonu sırası oluşan klasik kahvaltıcı.",
    etiketler: ["Kahvaltı", "Aile"], durumlar: ["aile", "arkadas"],
    adres: "Ethem Efendi Cd. No:50, Erenköy", turler: ["kafe"], yemekler: ["kahvalti"] }),
  m({ id: "semolina", ad: "Semolina", semt: "Moda", bolge: "kadikoy", yaka: "anadolu", fiyat: 2, puan: 7.9,
    imza: "Taze makarnalar",
    not: "Moda'ya yakın, Kadıköy'ün bilinen İtalyan duraklarından; taze makarnaları ve rahat ortamıyla.",
    etiketler: ["İtalyan", "Makarna"], durumlar: ["randevu", "arkadas"],
    turler: ["restoran"], yemekler: ["italyan"] }),
  m({ id: "bop", ad: "Bop Breakfast of Pan", semt: "Rasimpaşa", bolge: "kadikoy", yaka: "anadolu", fiyat: 2, puan: 7.8,
    imza: "Yumurtalı brunch tabakları",
    not: "Yeldeğirmeni'ne komşu modern bir brunch kafesi; yumurta tabakları öne çıkıyor.",
    etiketler: ["Brunch"], durumlar: ["arkadas", "tek"],
    adres: "Rasimpaşa, Duatepe Sk. No:4/D, Kadıköy", turler: ["kafe"], yemekler: ["kahvalti"] }),
];
