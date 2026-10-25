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
const ALANLAR = [
  "places.id", "places.displayName", "places.rating", "places.userRatingCount",
  "places.googleMapsUri", "places.photos", "places.formattedAddress", "places.websiteUri",
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

    let foto = null;
    const ad = yer.photos?.[0]?.name;
    if (ad) {
      const f = await fetch(`https://places.googleapis.com/v1/${ad}/media?maxWidthPx=1000&skipHttpRedirect=true`, {
        headers: { "X-Goog-Api-Key": ANAHTAR },
      });
      if (f.ok) foto = (await f.json()).photoUri || null;
    }
    return json({
      aktif: true,
      ad: yer.displayName?.text || null,
      puan: yer.rating ?? null,
      yorum: yer.userRatingCount ?? null,
      adres: yer.formattedAddress || null,
      harita: yer.googleMapsUri || null,
      site: yer.websiteUri || null,
      foto,
    }, 86400);
  } catch (e) {
    return json({ aktif: true, hata: String(e?.message || e) });
  }
}
