// İstanbul Rehberi için canlı Google puanı, yorum sayısı ve mekân fotoğrafı.
//
// NEDEN İSTEĞE BAĞLI: Google puanları yalnızca Places API ile, anahtarla
// alınabiliyor (sayfayı kazımak Google'ın kurallarına aykırı). Anahtar yoksa
// bu uç { aktif: false } döner ve rehber kendi editoryal puanıyla çalışır.
//
// KURULUM: Google Cloud'da "Places API (New)" açılıp bir API anahtarı alınır
// ve Vercel'de GOOGLE_PLACES_API_KEY ortam değişkeni olarak eklenir. Anahtar
// yalnızca sunucuda kullanılır; tarayıcıya hiç gitmez (fotoğraf adresi de
// anahtarsız bir googleusercontent bağlantısı olarak döner).
//
// MALİYET: Yanıt Vercel CDN'inde 1 gün önbelleklenir; ~70 mekân için ayda en
// fazla birkaç bin istek — Google'ın aylık ücretsiz kullanım payının içinde.

export const dynamic = "force-dynamic";

const ANAHTAR = process.env.GOOGLE_PLACES_API_KEY;
// Detay sayfası için saat, telefon, rezervasyon, alkol, açık alan, otopark ve
// konum da istenir. Bu alanlar Places'in Enterprise (+Atmosphere) SKU'suna
// düşer; CDN önbelleği sayesinde mekân başına günde en fazla bir istek gider.
const ALANLAR = [
  "places.id", "places.displayName", "places.rating", "places.userRatingCount",
  "places.googleMapsUri", "places.photos", "places.formattedAddress", "places.websiteUri",
  "places.regularOpeningHours", "places.nationalPhoneNumber", "places.reservable",
  "places.servesBeer", "places.servesWine", "places.servesCocktails", "places.outdoorSeating",
  "places.parkingOptions", "places.location", "places.priceLevel",
].join(",");

const json = (veri, saniye = 0) =>
  new Response(JSON.stringify(veri), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": saniye ? `public, s-maxage=${saniye}, stale-while-revalidate=${saniye * 7}` : "no-store",
    },
  });

export async function GET(istek) {
  const q = new URL(istek.url).searchParams.get("q");
  if (!ANAHTAR) return json({ aktif: false });
  if (!q) return json({ aktif: true });

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": ANAHTAR, "X-Goog-FieldMask": ALANLAR },
      body: JSON.stringify({ textQuery: q, languageCode: "tr", regionCode: "TR", pageSize: 1 }),
    });
    if (!r.ok) return json({ aktif: true, hata: `Google ${r.status}` });
    const yer = (await r.json()).places?.[0];
    if (!yer) return json({ aktif: true, bulunamadi: true }, 86400);

    // En fazla dört fotoğraf: ilki kapak, gerisi galeri.
    const fotolar = [];
    for (const ph of (yer.photos || []).slice(0, 4)) {
      const f = await fetch(`https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=1000&skipHttpRedirect=true`, {
        headers: { "X-Goog-Api-Key": ANAHTAR },
      });
      if (f.ok) { const u = (await f.json()).photoUri; if (u) fotolar.push(u); }
    }
    const po = yer.parkingOptions || {};
    const otopark = [po.freeParkingLot && "ücretsiz otopark", po.paidParkingLot && "ücretli otopark", po.valetParking && "vale",
      po.freeStreetParking && "sokakta ücretsiz park", po.paidStreetParking && "sokakta ücretli park"].filter(Boolean);
    return json({
      aktif: true,
      guncelleme: new Date().toISOString(),
      ad: yer.displayName?.text || null,
      puan: yer.rating ?? null,
      yorum: yer.userRatingCount ?? null,
      adres: yer.formattedAddress || null,
      harita: yer.googleMapsUri || null,
      site: yer.websiteUri || null,
      foto: fotolar[0] || null,
      fotolar,
      saatler: yer.regularOpeningHours?.weekdayDescriptions || null,
      periyotlar: yer.regularOpeningHours?.periods || null,
      telefon: yer.nationalPhoneNumber || null,
      rezervasyon: yer.reservable ?? null,
      alkol: { bira: !!yer.servesBeer, sarap: !!yer.servesWine, kokteyl: !!yer.servesCocktails },
      acikAlan: yer.outdoorSeating ?? null,
      otopark: otopark.length ? otopark.join(", ") : null,
      konum: yer.location ? { lat: yer.location.latitude, lng: yer.location.longitude } : null,
    }, 86400);
  } catch (e) {
    return json({ aktif: true, hata: String(e?.message || e) });
  }
}
