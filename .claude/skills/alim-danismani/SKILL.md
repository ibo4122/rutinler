---
name: alim-danismani
description: Büyük satın alma hedeflerini (konut, araç, evlilik, iş kurma...) bir sektör danışmanı gibi kurgular. Kullanıcı "ev alma hedefi", "araç hedefi", "şu kategoriyi yapalım", "bu ekran karmaşık, basitleştir" dediğinde kullan. Gizli maliyetleri, kredi kurallarını ve ödenebilirlik eşiklerini ekrana taşır; ham veri girişini danışmanlığa çevirir.
---

# Büyük Alım Hedefi Danışmanı

Kullanıcı "ev alacağım" dediğinde **fiyat sormak yetmez**. Bir emlakçı/danışman
gibi düşün: kişinin bilmediği maliyetleri önüne koy, alabileceği krediyi söyle,
"bu bütçeyi kaldırır mısın?" sorusunu yanıtla.

## Temel ilke: 3 blok, tek cevap

Her kategori ekranı **aynı iskelette** kurulur — kullanıcı bir kez öğrenir:

1. **Ne alıyorsun?** → tek ana rakam (evin fiyatı / aracın fiyatı)
2. **Elinde ne var?** → nakit, satılacak varlık (üzerindeki borcu düşülür)
3. **Kredi** → tutar + vade + faiz → **taksit otomatik hesaplanır**

Altında **tek büyük sonuç**: Açık mı, fazla mı? Yanında taksitin geliri yiyip
yemediği (ödenebilirlik) ve açık varsa "ayda ne biriktirmelisin".

## Amatör vs. profesyonel fark

| Amatör ekran | Danışman ekranı |
|---|---|
| "Evin değeri" sorar | **Gerçek toplam maliyeti** hesaplar (fiyat + gizli masraflar) |
| Krediyi tutar olarak alır | **Taksiti hesaplar**, gelire oranlar, "kaldırabilirsin/zorlanırsın" der |
| Sınırsız kredi varsayar | **Yasal kredi tavanını** (LTV) bilir, aşınca uyarır |
| Mevcut evi varlık sayar | Mevcut evin **üzerindeki ipoteği düşer** (net eline geçen) |
| Kullanıcıya likit tutarı yazdırır | Uygulamadaki portföyden **tek tıkla çeker** |
| "%100 tamamlandı" der | Hangi varsayımla, ne zaman, hangi tempoyla — açık yazar |

## Konut (Türkiye, 2026) — alan bilgisi

**Alıcının ödediği gizli maliyetler** (ev fiyatına ek, toplam ≈ **%6,5–7**):

| Kalem | Oran / tutar | Not |
|---|---|---|
| Tapu harcı | **%4** | Yasada %2 alıcı + %2 satıcı; pratikte alıcıya yıkılır |
| Emlak komisyonu | **%2 + KDV = %2,4** | Alıcıdan alınabilecek yasal üst sınır |
| Ekspertiz | **12.000–25.000 ₺** | Kredi çekiliyorsa zorunlu |
| Kredi tahsis ücreti | kredinin **binde 5'i** | Yasal üst sınır |
| DASK | 400–1.300 ₺/yıl | Zorunlu deprem sigortası |
| Tadilat / taşınma / eşya | değişken | Kullanıcı girsin |

**Kredi kuralı:** Konut kredisi, ekspertiz değerinin **en fazla %90'ı** kadar
çıkar → **en az %10 peşinat** şart. Kredi bu sınırı aşıyorsa uyar.

**Ödenebilirlik eşiği:** aylık taksit / net gelir
→ **≤%35 rahat** · **%35–50 zorlayıcı** · **>%50 sürdürülemez**

**Taksit formülü (anüite):**
`taksit = K × i × (1+i)^n / ((1+i)^n − 1)` — `i` aylık faiz, `n` vade (ay).
Faiz 0 ise `K / n`.

## Araç — alan bilgisi

*(Bu bölüm araç kategorisi yapılırken doldurulacak. Aynı iskelet: fiyat →
kaynaklar → kredi → sonuç. Farkı: taşıt kredisinde LTV kademeli, ÖTV/KDV fiyata
dahil, ek maliyetler noter + trafik/kasko sigortası + plaka-tescil, ayrıca
**araç değer KAYBEDER** — konutun aksine yatırım değil gider kalemidir.)*

## Ekran kuralları

- **Girdi sayısını 8'i geçirme.** Geçiyorsa blokla ve varsayılanla otomatikleştir.
- **Her girdi tek satırda anlaşılmalı.** Anlaşılmıyorsa altına ipucu yaz
  ("Satacaksan yaz; yoksa boş bırak").
- **Masrafları otomatik hesapla, ama dökümü göster.** Katlanır "Masraf dökümü"
  bölümü; kullanıcı nereden geldiğini görebilmeli.
- **Uygulamadaki veriyi bağla.** Likit varlık, aylık kalan gibi değerler zaten
  sistemde varsa elle yazdırma — "Portföyümden al" butonu koy.
- **Sonuç tek ve büyük olsun.** Açık/fazla rakamı ekranın kahramanı; geri kalanı
  destek. Renk: açık varsa kehribar/kırmızı, tamamsa yeşil.
- **Uyarıları sonuçla birlikte ver**, ayrı sayfaya gömme.

## Yapma

- Kullanıcıya faiz oranını tahmin ettirme; makul varsayılan koy, "bankaların
  güncel oranı ~%X" ipucu ver, değiştirilebilir bırak.
- "%100 tamamlandı" gibi mutlak ifadeleri elle girilen rakama dayandırma —
  neyin varsayım olduğunu yaz.
- Vergi/harç oranlarını yılsız yazma. Ekranda **"(2026)"** geçmeli; mevzuat değişir.
- Kategoriyi "Yakında" diye ölü buton bırakma; ya çalışsın ya listede olmasın.
