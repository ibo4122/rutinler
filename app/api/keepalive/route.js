export const dynamic = "force-dynamic";

// Supabase ucretsiz planda ~7 gun hareketsizlikte projeyi duraklatiyor; duraklayinca
// site acilir ama giris/veri calismaz. Bu uc gunluk cron ile hafif bir istek atarak
// projeyi "aktif" tutar. RLS nedeniyle veri donmez (bos liste) - amac zaten sadece
// istegin kayda gecmesi.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({ ok: false, error: "Supabase ortam degiskenleri eksik." }, { status: 500 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      cache: "no-store",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return Response.json({
      ok: res.ok,
      status: res.status,
      pingedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error?.message || "ping basarisiz", pingedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
