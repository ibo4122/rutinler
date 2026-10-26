import { createClient } from "@supabase/supabase-js";
import { besinAra } from "../../../lib/besinler";

export const dynamic = "force-dynamic";

// Fotoğraftan kalori tahmini — Google Gemini (görsel) üzerinden tek çağrı.
//
// Akış: istemci fotoğrafı tarayıcıda küçültüp (≈1024 px JPEG) gönderir; model
// tabaktaki yemekleri ve tahmini gramajlarını döndürür. Yemek adı veritabanımızda
// birebir varsa değerler veritabanından (100 g değeri × gram) hesaplanır —
// modelin kalori tahmini yalnızca eşleşme yoksa kullanılır. Sonuç her zaman
// "tahmin" olarak gösterilir ve kullanıcı eklemeden önce düzeltir.
//
// Gizlilik: fotoğraf saklanmaz; yalnızca bu istek boyunca modele iletilir.

const MODEL = "gemini-2.5-flash";
const GUNLUK_LIMIT = 30;
const BURST_WINDOW_MS = 20_000;
const BURST_MAX = 5;
const MAKS_BASE64 = 2_000_000; // ≈1,5 MB görsel

const burstHits = new Map();
function burstLimited(key) {
  const now = Date.now();
  const hits = (burstHits.get(key) || []).filter((t) => now - t < BURST_WINDOW_MS);
  hits.push(now);
  burstHits.set(key, hits);
  return hits.length > BURST_MAX;
}

async function consumeQuota(token) {
  if (!token) return { allowed: false, reason: "auth" };
  try {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const { data: kullanici, error: kErr } = await supa.auth.getUser(token);
    if (kErr || !kullanici?.user) return { allowed: false, reason: "auth" };
    const { data, error } = await supa.rpc("consume_quota", { p_feature: "kalori_foto", p_limit: GUNLUK_LIMIT });
    if (error) return { allowed: true, soft: true };
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: !!row?.allowed, used: row?.used, lim: row?.lim };
  } catch {
    return { allowed: true, soft: true };
  }
}

const SISTEM =
  "Sen bir diyetisyen asistanısın. Fotoğraftaki yiyecek ve içecekleri tanı, her birinin tabaktaki " +
  "miktarını gram olarak tahmin et. Türk mutfağını iyi bilirsin (kavurma, sote, pilav, börek, meze…). " +
  "Yemek adlarını Türkçe, genel ve aranabilir yaz (ör. 'Tavuk sote', 'Pirinç pilavı', 'Çoban salata'). " +
  "Kalori ve makroları tahmin ettiğin gramaja göre TOPLAM olarak ver. Emin olmadığın şeyi uydurma; " +
  "fotoğrafta yiyecek yoksa boş liste döndür. Pişirme yağı görünüyorsa hesaba kat.";

const SEMA = {
  type: "OBJECT",
  properties: {
    yemekler: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          ad: { type: "STRING" },
          gram: { type: "NUMBER" },
          kcal: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          karb: { type: "NUMBER" },
          yag: { type: "NUMBER" },
          lif: { type: "NUMBER" },
          guven: { type: "STRING", enum: ["dusuk", "orta", "yuksek"] },
        },
        required: ["ad", "gram", "kcal", "protein", "karb", "yag", "guven"],
      },
    },
    not: { type: "STRING" },
  },
  required: ["yemekler"],
};

const sade = (s) => String(s || "").toLocaleLowerCase("tr").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
const sinirla = (v, ust) => Math.max(0, Math.min(ust, Number(v) || 0));

// Model "Tavuk sote" derse veritabanındaki "Tavuk sote" kullanılır; "Ev yapımı
// tavuk sote" gibi uzun bir ad da en iyi eşleşmenin adını tümüyle içeriyorsa sayılır.
function veritabanindan(ad) {
  const aday = besinAra(ad, 3).find((b) => b.kaynak === "temel");
  if (!aday) return null;
  const a = sade(ad), b = sade(aday.ad);
  return a === b || a.includes(b) || b.includes(a) ? aday : null;
}

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch {}
  const gorsel = String(body?.gorsel || "");
  const tur = /^image\/(jpeg|png|webp)$/.test(body?.tur) ? body.tur : "image/jpeg";
  if (!gorsel) return Response.json({ error: "Fotoğraf gelmedi." }, { status: 400 });
  if (gorsel.length > MAKS_BASE64) return Response.json({ error: "Fotoğraf çok büyük, daha küçük bir fotoğraf dene." }, { status: 413 });

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (burstLimited(token || "anon")) {
    return Response.json({ error: "Çok hızlı gidiyorsun, birkaç saniye sonra tekrar dene." }, { status: 429 });
  }
  const kota = await consumeQuota(token);
  if (!kota.allowed) {
    if (kota.reason === "auth") return Response.json({ error: "Oturum doğrulanamadı, sayfayı yenileyip tekrar dene." }, { status: 401 });
    return Response.json({ error: `Günlük fotoğraf analizi sınırına ulaştın (${kota.lim}/gün). Yarın tekrar dene.` }, { status: 429 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Fotoğraf analizi şu an kullanılamıyor (sunucu anahtarı tanımlı değil)." }, { status: 503 });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEM }] },
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: tur, data: gorsel } },
              { text: "Bu fotoğraftaki yiyecekleri ve tahmini miktarlarını listele." },
            ],
          }],
          // Düşünme bütçesi çıktı sınırından yer; açık kalırsa JSON yarıda kesiliyordu.
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: "application/json", responseSchema: SEMA },
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = res.status === 429 ? "Analiz kotası doldu, biraz sonra tekrar dene." : "Fotoğraf analiz edilemedi.";
      return Response.json({ error: msg }, { status: res.status === 429 ? 429 : 502 });
    }
    const metin = (data?.candidates?.[0]?.content?.parts || []).map((p) => p?.text || "").join("");
    let cevap;
    try { cevap = JSON.parse(metin); } catch { return Response.json({ error: "Fotoğraf analiz edilemedi, tekrar dene." }, { status: 502 }); }

    const yemekler = (Array.isArray(cevap?.yemekler) ? cevap.yemekler : []).slice(0, 12).map((y) => {
      const gram = Math.round(sinirla(y.gram, 2000));
      const db = veritabanindan(y.ad);
      if (db && gram > 0) {
        const o = gram / 100;
        return {
          ad: db.ad, gram, kaynak: "veritabani", guven: y.guven || "orta",
          kcal: db.kcal * o, protein: db.protein * o, karb: db.karb * o, yag: db.yag * o,
          lif: db.lif != null ? db.lif * o : (Number.isFinite(+y.lif) ? sinirla(y.lif, 100) : null),
        };
      }
      return {
        ad: String(y.ad || "Yiyecek").slice(0, 60), gram, kaynak: "tahmin", guven: y.guven || "orta",
        kcal: sinirla(y.kcal, 5000), protein: sinirla(y.protein, 300), karb: sinirla(y.karb, 500),
        yag: sinirla(y.yag, 300), lif: Number.isFinite(+y.lif) ? sinirla(y.lif, 100) : null,
      };
    });
    return Response.json({ yemekler, not: String(cevap?.not || "").slice(0, 300) });
  } catch (error) {
    console.log("kalori-foto error", error?.message || error);
    return Response.json({ error: "Fotoğraf analiz edilemedi." }, { status: 500 });
  }
}
