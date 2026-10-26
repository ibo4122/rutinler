---
name: web-tasarim
description: Rutinler'de yeni bir ekran, alan ya da rehber/katalog (mekân listesi, şehir rehberi, ürün listesi) tasarlarken veya mevcut bir ekranı "daha profesyonel / daha heyecanlı / kafa karıştırmayan" hale getirirken kullan. Ürün tasarımcısı + araştırmacı + listeleme editörü gözüyle çalışır; filtre ve keşif arayüzü kalıpları, görsel kimlik, veri araştırma yöntemi ve tarayıcıda doğrulama kontrol listesi içerir. Kullanıcı "tasarımı geliştir", "banal duruyor", "daha profesyonel olsun", "kafa karıştırıyor", "liste/rehber yap", "daha çok yer/ürün ekle" dediğinde tetiklenir.
---

# Web Tasarım Standardı — Rutinler

Bu kullanıcı arayüzü **göz zevkiyle ve ilk 5 saniyedeki hisle** değerlendirir:
"banal", "sıkıcı", "kafa karıştırıyor", "nerede neyi seçeceğimi anlamıyorum"
geri bildirimleri bu standardın çıkış noktası. Amaç süs değil: **aradığını
hemen bulan, baktığında heyecanlanan** bir ekran.

## 0. Önce ne yapıldığını anla (5 dk)

- Mevcut ekranı tarayıcıda aç, kullanıcının gönderdiği ekran görüntüsünü oku.
- Ekranın **tek cümlelik işi** ne? ("Bu akşam gidilecek yeri 3 tıkta bul.")
- Diğer alanların görsel kimliğini listele (renk, tipografi, yoğunluk) —
  yeni alan bunlardan **ayrışmalı** (kullanıcı "seyahat sayfasının aynısı" dedi).

## 1. Seçim ve filtre arayüzü kuralları

| Kural | Neden |
|---|---|
| Her filtrenin başında açık bir **"Tümü"**, varsayılan seçili | Kullanıcı "sürekli bir şey seçmek zorunda kalıyorum" dedi |
| Filtre seçince **görünür değişim** olmalı (sıra, başlık, bölüm) | Sayı değişip üst sıra aynı kalınca "seçiyorum ama çıkmıyor" sanıldı |
| Uygulanan filtreler sonuç çubuğunda **✕ ile tek tek kaldırılabilir** | Nerede olduğunu bilmek güven verir |
| Her seçeneğin yanında **sonuç sayısı**; 0 sonuç veren seçenek soluk | Ölü uç yok |
| Filtre **soru diliyle** sorulur: "Nerede? · Kiminle? · Ne yiyip içelim? · Bütçe?" | "ORTAM", "DURUM" gibi teknik etiketler banal ve belirsiz |
| En önemli 1–2 seçim **görsel karo** (fotoğraflı), gerisi kompakt | Hepsi aynı çip olunca hiyerarşi kaybolur, ekran "form" gibi durur |
| Hazır seçkiler (öneri listeleri) **liste halinde**, numaralı, açıklamalı | Yatay kaydırmalı kartlar "nerede neyi seçeceğim" karmaşası yarattı |
| Coğrafi içerikte **bölge/semt** birinci sınıf filtre | İnsan "Kadıköy'deyim, ne var?" diye düşünür |
| Bölüm başlığına tıklayınca o bölüm filtrelenir; "kalanını göster" | Özet → detay (aşamalı açılım) |

## 2. Görsel kimlik ve "heyecan"

- **Gerçek görsel her şeydir.** Mekân/ürün kendi fotoğrafıyla; semt fotoğrafı,
  logo, stok görsel kabul edilmez. Görsel yoksa adıyla tasarlanmış kapak.
- Karo/kart üzerinde **ad + kısa bağlam** (sayı, öne çıkan isim) görselin üstünde.
- Renk: koyu zemin üzerinde her kategoriye **tek bir vurgu rengi**; aynı anda
  en fazla 2–3 vurgu görünür. Seçili durum dolu renk + gölge, seçili olmayan sade.
- Tipografi: tek büyük başlık (clamp ile 40–90px), gövde 13–15px, sayılar
  monospace. Etiketler küçük harf aralıklı (letter-spacing .14em) — az kullan.
- Mikro etkileşim: hover'da 2px yükselme, seçimde renk geçişi (.15–.25s). Fazlası değil.
- Boş durum asla çıplak "sonuç yok" değildir: neden + tek tıkla çözüm.

## 3. Listeleme / editörlük

- **Eksenleri karıştırma.** Katalogda her soru ayrı bir eksendir: *ne* (yemek/ürün:
  burger, pizza…), *nasıl bir yer* (tür: meyhane, bar…), *atmosfer* (rooftop, bahçe…),
  *nerede*, *kiminle*, *bütçe*. Tek bir "kategori" listesine karıştırılınca "en iyi
  burgerciler" gibi en doğal soru cevapsız kalır (kullanıcı "mantığında sorun var" dedi).
  Her öğe her eksende çoklu etiket taşıyabilir; arayüzde her eksen ayrı bir soru.
- Varsayılan liste, kullanıcının en sık sorduğu eksende bölümlenir ("En iyi
  burgerciler, en iyi pizzacılar…"); konum/durum seçilince tür eksenine geçer.
- Kural tabanlı etiketlemede **Türkçe kelime içi eşleşme** tuzakları: "kalabalık"→balık,
  "kokoreç"→kore, "ekşi mayalı"→yalı, "Anadolu yakası"→Anadolu mutfağı,
  "1977'den beri"→tarihi. Kelime başına bağla, sonra her etiketin listesini
  isim isim oku ve elle düzelt.
- İçki etiketleri (kokteyl/şarap/bira) yalnızca o türde bar olan yerlere: yoksa
  "en iyi kokteyl barları" listesinin başına restoranlar çıkar.

- **Sıralama bir görüştür.** Puan, ödül, fiyat; durum seçilince o duruma
  "asıl amacı bu olan" yerler öne çıkar.
- Her öğe: ad · tür · semt · fiyat · **"ne yenir/içilir" tek satır** · 1–2 cümle not.
- Kategori sayıları dengesiz olmamalı: bir kategoride 3–5 öğe varsa kullanıcı
  "çok sınırlı" der. Hedef: ana kategorilerde ≥15, semt başına ≥8.
- Kullanıcının adını verdiği örnekler (ör. "Kaburgacı Cabbar var mı?") mutlaka
  araştırılır ve eklenir — bu, kapsam testidir.

## 4. Araştırma yöntemi (veri uydurma yok)

1. Otorite kaynak önce: Michelin Rehberi sayfaları (`dLayer['distinction']`,
   JSON-LD adres/görsel; tam tarayıcı User-Agent gerekir), Time Out mekân sayfaları.
2. Güncellik: 2–3 yıldan eski liste sayfası kapanmış mekân içerebilir —
   yalnızca güncel ya da köklü olduğundan emin olunanlar.
3. Puan/yorum sayısı **uydurulmaz**; editoryal puan açıkça "rehber puanı" diye etiketlenir.
4. Görsel toplama sonrası **toplu temas sayfası** ile gözle kontrol: logo,
   alakasız görsel, el değiştirmiş alan adı (kumar reklamı çıktı) ayıklanır.
   Kanıtlanmış tuzaklar:
   - Rehber sayfalarında başlığın altındaki ilk görsel **kategori ikonu** olabilir
     (OGGUSTO'da `2025/09/Kahvalti.png` gibi). Birden çok başlığın altında geçen
     görseli at; mekâna özgü ilk fotoğrafı al.
   - Tahmin edilen alan adı **satılık/park** sayfası çıkabilir (hugedomains vb.);
     bu sağlayıcıların görselleri ve bağlantıları filtrelenir.
   - Kullanıcının "kaldır" dediği görseli kalıcı yasak listesine al; yeniden
     toplama turunda geri gelmesin.
6. Açılış ekranı "keşif" olmalı: fotoğraflı kategori karoları + bölge kartları +
   numaralı öneri listeleri; filtre seçilince sonuçlara kaydır.
5. Elle yazılan notlar kaynaktan **kendi cümlelerimizle**; kopya metin yok.

## 5. Doğrulama kontrol listesi (bitti demeden önce)

- [ ] Geçici `app/onizleme/page.js` ile bileşen mock veriyle açıldı.
- [ ] 1400px ve 375px (mobile preset) ekran görüntüsü alındı, göz kontrolü yapıldı.
- [ ] `document.documentElement.scrollWidth - innerWidth === 0` her iki genişlikte.
- [ ] Her filtre tek tek tıklandı; sonuç **görünür biçimde** değişiyor.
- [ ] Konsolda yeni hata yok (hydration için `<style dangerouslySetInnerHTML>`).
- [ ] Tüm görsel URL'leri 200 + `image/*` dönüyor; temas sayfasında logo yok.
- [ ] Önizleme silindi, `npm run build` temiz, yalnız ilgili dosyalar commit.

## Bu projede kanıtlanmış kalıplar

- Stil: bileşen içinde tek `CSS` sabiti + `<style dangerouslySetInnerHTML>`;
  medya sorguları için sınıf adları önekli (`ist-…`).
- Dar ekran tespiti `matchMedia("(max-width: 980px)")`; masaüstünde sabit
  detay paneli, telefonda tam ekran sayfa.
- **Geri Al** ortak sistemi: `components/GeriAl.jsx`. Veri dilimlerini page.js
  izler; bileşen yalnızca `useGeriAl().etiketle("X silindi")` der. Kullanıcı
  işlemi olmayan yazmalar (canlı fiyat) `sessiz()` ile geçmişe girmez. Yazarken
  her tuş toast açmasın: metin alanları `onBlur`'da kaydeder.
- Detay/alt sayfalar sol üstte `GeriButon` ile açılır; kaydedilmemiş giriş varsa
  `kaydedilmemis={() => kirli.current}` ile onay sorar. Esc de kapatır.
- **Adım adım Geri** (kullanıcı istedi: "her adımdan sonra geri gitmek istiyorum"): filtre/görünüm değişiklikleri bir geçmiş yığınına yazılır; üstte her zaman "← Geri" + konum izi, telefonda yüzen Geri. Hatırlanan filtrelerle açılınca yığına başlangıç hali konur. Kullanıcıyı "Tümü"ye basmaya zorlama.
- Konum her kartta belirgin: fotoğraf üstünde 📍 semt + gövdede semt/bölge/yaka satırı (haritaya bağlı).
- Filtre çubuğu kalıbı: arama + açılır kontroller (masaüstünde panel, ≤640px'te
  alttan açılan sayfa) + seçili etiketler (✕) + "Tümünü temizle". Seçenek
  yanındaki sayı "o eksen hariç diğer filtrelere" göre sayılır. Sonuç azsa
  hangi seçimi kaldırınca kaç sonuç geleceği tek tıkla önerilir.
- Elde olmayan veri (Google puanı, saat, telefon) **uydurulmaz**: "Google verisi
  bağlı değil" yazar, ilgili süzgeç devre dışı ve açıklamalı; tahmini alanlar
  "rehber tahmini" rozeti taşır.
- CSS tuzakları (yaşandı): (1) `backdrop-filter`/`transform` olan bir ata,
  içindeki `position:fixed` perdeyi kendi kutusuna hapseder — açılır panelin
  atasında kullanma. (2) Taşan bir grid'de `overflow-x:auto` olan öğe (galeri)
  0 yüksekliğe çöker → `grid-auto-rows:max-content` + `grid-template-columns:minmax(0,1fr)`.
- Gemini 2.5 Flash JSON yanıtında `thinkingConfig.thinkingBudget: 0` ver;
  düşünme jetonları çıktı sınırını yiyip JSON'u yarıda kesiyor.
- Google Haritalar: `maps.google.com/maps?q=…&output=embed` (anahtarsız),
  dış bağlantı `google.com/maps/search/?api=1&query=`; harita kutusu
  tıklanınca mekânı Google'da açar.
