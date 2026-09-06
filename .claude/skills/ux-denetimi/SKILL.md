---
name: ux-denetimi
description: Rutinler panelini gerçek bir kullanıcı gibi gezip UX/ürün denetimi yapar; boş ekran, ölü buton, jargon, tıklama maliyeti ve "bu rakam iyi mi?" eksikliklerini bulup somut düzeltme önerir. Kullanıcı "UX denetimi yap", "kullanıcı gözüyle bak", "bu ekran profesyonel mi", "neyi sadeleştirebiliriz" dediğinde veya yeni bir sekme/modül bitirildiğinde kullan.
---

# UX Denetimi — Rutinler Paneli

Bu uygulama **kişisel finans + yaşam yönetim panelidir** (Next.js 14 App Router, JS).
Kullanıcı kitlesi: finans uzmanı değil, kendi parasını takip eden normal insanlar.
Denetimin amacı **daha çok özellik eklemek değil**, mevcut özelliği daha az tıkla
ve daha az kafa karışıklığıyla kullandırmaktır.

## Denetim nasıl yapılır

1. `preview_start` ile dev sunucusunu aç, `ibo41@icloud.com` ile giriş yap.
2. Sekmeleri **sırayla** gez: Genel Bakış → Gelir/Gider → Yatırımlar → Finansal
   Hedefler → Hedeflerim → Haftalık Rutin → Notlar.
3. Her sekmede iki soruyu ayrı ayrı sor:
   - **Dolu hesap gözüyle:** verimi görebiliyor muyum, kaç tıkla ulaşıyorum?
   - **Boş hesap gözüyle:** ilk açtığımda ne yapacağımı anlıyor muyum?
4. Ekran görüntüsü yerine **DOM sorgusu** tercih et (token tasarrufu):
   `document.querySelector('main').textContent`, panel başlıkları, buton metinleri.
   Görsel/hizalama şüphesi varsa `scale: 0.55` ile tek ekran görüntüsü al.

## Aranacak kusurlar (öncelik sırasıyla)

| # | Kusur | Nasıl anlaşılır | Doğrusu |
|---|---|---|---|
| 1 | **Boş ekran karşılaması** | Sekmeye girince tüm paneller kapalı | Ana bölümler açık; dolu alt bölümler otomatik açık, boşlar kapalı |
| 2 | **Ölü buton** | Tıklanınca hiçbir şey olmuyor / `alert` çıkıyor | Ya gizle, ya net "Hazırlanıyor" rozeti + satır içi açıklama |
| 3 | **Tıklama maliyeti** | Veriye ulaşmak 2+ tık (iç içe akordeon) | En çok kullanılan veri ilk ekranda |
| 4 | **Yorumsuz rakam** | Sadece toplam var, "iyi mi kötü mü" yok | Oran + eşik + renk (yeşil/sarı/kırmızı) |
| 5 | **Durum bildiren buton** | "Kâr/Zarar: Kapalı (göster)" | Eylem bildir: "Kâr/Zararı Göster" |
| 6 | **Gereksiz tekrar** | "Hisse Yatırımı", "Kripto Yatırımı" (bağlam zaten Yatırımlar) | "Hisseler", "Kripto" |
| 7 | **Teknik jargon sızıntısı** | "Supabase", "RLS", "payload", "sync" | Kullanıcı dili: "Tüm değişiklikler kaydedildi" |
| 8 | **Sessiz hata** | İstek başarısız, kullanıcı bilmiyor | Anlaşılır Türkçe mesaj + ne yapmalı |
| 9 | **Kopuk veri** | Ekranda gösterilen değer hesaba girmiyor | Ya otomatik bağla, ya "buradan al" butonu koy |
| 10 | **Kaybolan emek** | Uzun form, kaydetmeden çıkınca gidiyor | Otomatik kayıt veya çıkış uyarısı |

## Profesyonellik ölçütleri (bu üründe "profesyonel" ne demek)

- **Rakam yorumlanır.** Tasarruf oranı (hedef ≥%20), kredi yükü (sağlıklı ≤%35),
  borç kapanma süresi gibi oranlar ham toplamdan daha değerlidir.
- **Varsayım görünür.** Projeksiyon varsa hangi kabulle hesaplandığı yazmalı
  ("Bu bir tahmindir; gerçek tutar fon performansına göre değişir").
- **Mevzuat tarihli.** Vergi/teşvik oranları değişir; ekranda yıl belirtilmeli
  (örn. "Kurallar (2026): devlet katkısı %20").
- **Hesap açıklanır.** Büyük bir sonuç varsa "Nasıl hesaplanıyor?" katlanır
  bölümü, kullanıcının kendi rakamlarıyla adım adım göstermeli.
- **Sadelik özelliğe yeğdir.** Kullanmadığı modülü kapatabilmek (⚙️ Kişiselleştir),
  yeni modül eklemekten daha çok değer üretir.

## Bu üründe zaten çözülmüş olanlar (tekrar önerme)

- Modül seçimi / kişiselleştirme (`lib/preferences.js`, `⚙️ Kişiselleştir`)
- Yeni kullanıcı karşılama akışı (`components/Onboarding.jsx`, 4 adım)
- Tutar gizleme (sansür) modu · sürüklenebilir sekmeler
- Kullanıcı bazlı yerel yedek anahtarı (veri sızıntısı düzeltmesi)
- Fon fiyatları TEFAS resmî API'sinden (2000+ fon)

## Çıktı biçimi

Rapor değil, **uygulanmış düzeltme** üret. Sırayla:

1. Bulguları tabloya yaz: `Sekme | Kusur | Etki (yüksek/orta/düşük)`.
2. **Yüksek etkili ve küçük** olanları hemen uygula (kod değişikliği).
3. Büyük olanları ("bu modül baştan yazılmalı") ayrı başlıkta öner, yapma.
4. Tarayıcıda doğrula: DOM sorgusuyla değişikliğin gerçekten göründüğünü kanıtla.
5. Türkçe commit mesajıyla gönder; mesajda **neden** değiştiğini yaz.

## Dikkat

- **Veri kaybettirme.** Bir alanı gizlemek ≠ silmek. Tercih kapansa bile veri durur.
- Kişisel/gömülü varsayılan değer ekleme — her kullanıcı **sıfırdan** başlar.
- `money()` maskeleme modunu bozma; yüzdeler kasıtlı olarak maskelenmez.
- Bir kusuru "düzelttim" demeden önce tarayıcıda gör; konsolda biriken **eski**
  hataları yeni hata sanma (fresh reload sonrası sayı artıyor mu diye bak).
