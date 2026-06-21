import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Not modülü AI eylemleri — Google Gemini (ücretsiz kota) üzerinden tek çağrı.
const PROMPTS = {
  summary: "Aşağıdaki ders notunu Türkçe özetle. Ana noktaları kısa, net madde madde ver.",
  gaps: "Aşağıdaki ders notundaki eksik, belirsiz veya daha fazla detaylandırılması gereken noktaları Türkçe olarak tespit edip listele.",
  quiz: "Aşağıdaki ders notuna dayanarak 5 soruluk bir quiz oluştur. Soruları numaralandır; sonunda 'Cevaplar' başlığı altında doğru cevapları ver. Türkçe.",
  flashcards: "Aşağıdaki ders notundan flashcard'lar oluştur. Her kartı 'Ön: ... | Arka: ...' formatında, ayrı satırlarda, Türkçe ver.",
  toEn: "Translate the following study note into clear, natural English. Preserve the structure and any lists.",
  toTr: "Aşağıdaki metni akıcı ve doğru bir Türkçeye çevir. Yapıyı ve listeleri koru.",
  keywords: "Aşağıdaki ders notundaki anahtar kavramları çıkar ve her birini tek cümleyle Türkçe açıkla.",
  plan: "Aşağıdaki ders notuna dayanarak konuyu öğrenmek için maddeler halinde bir çalışma planı oluştur (Türkçe).",
};

const SYSTEM =
  "Sen bir öğrenme asistanısın. Kullanıcının ders/eğitim notları üzerinde çalışıyorsun. Net, düzenli, öğrenmeye yardımcı ve sade yanıtlar ver. Gereksiz giriş cümleleri kullanma; doğrudan sonucu üret.";

const MODEL = "gemini-2.5-flash";

const AI_DAILY_LIMIT = 50; // kullanıcı başına günlük AI isteği
const BURST_WINDOW_MS = 20_000; // 20 sn penceresi
const BURST_MAX = 8; // pencere içinde en fazla istek (ani spam koruması)

// Sıcak instance içinde basit ani-istek (burst) sayacı — token/IP bazlı.
const burstHits = new Map();
function burstLimited(key) {
  const now = Date.now();
  const hits = (burstHits.get(key) || []).filter((t) => now - t < BURST_WINDOW_MS);
  hits.push(now);
  burstHits.set(key, hits);
  return hits.length > BURST_MAX;
}

// Kullanıcının JWT'siyle bağlanıp atomik günlük kotayı tüketir (RLS ile kendi satırı).
async function consumeQuota(token) {
  if (!token) return { allowed: false, reason: "auth" };
  try {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const { data, error } = await supa.rpc("consume_quota", { p_feature: "notes_ai", p_limit: AI_DAILY_LIMIT });
    if (error) return { allowed: true, soft: true }; // kota altyapısı patlarsa kullanıcıyı engelleme
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: !!row?.allowed, used: row?.used, lim: row?.lim };
  } catch {
    return { allowed: true, soft: true };
  }
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const action = body?.action;
  const text = String(body?.text || "").trim();
  const question = String(body?.question || "").trim();

  // Serbest soru/açıklama: kullanıcının kendi sorusunu notu bağlam alarak yanıtlar.
  let userPrompt;
  if (action === "ask") {
    if (!question) return Response.json({ error: "Bir soru yaz." }, { status: 400 });
    userPrompt =
      "Aşağıdaki not bağlamında kullanıcının sorusunu Türkçe, açık ve öğretici biçimde yanıtla. " +
      "Not yetersizse genel bilginle de yardımcı ol; gerekirse örnek ver.\n\nSORU: " +
      question;
  } else {
    userPrompt = PROMPTS[action];
    if (!userPrompt) return Response.json({ error: "Geçersiz AI işlemi." }, { status: 400 });
    if (!text) return Response.json({ error: "Not içeriği boş — önce bir şeyler yaz." }, { status: 400 });
  }

  // Kötüye kullanım + maliyet koruması: ani-istek (burst) + günlük kota.
  // Yalnızca geçerli (doğrulamadan geçmiş) isteklerde tüketilir.
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (burstLimited(token || "anon")) {
    return Response.json({ error: "Çok hızlı gidiyorsun, birkaç saniye sonra tekrar dene." }, { status: 429 });
  }
  const quota = await consumeQuota(token);
  if (!quota.allowed) {
    if (quota.reason === "auth") {
      return Response.json({ error: "Oturum doğrulanamadı, sayfayı yenileyip tekrar dene." }, { status: 401 });
    }
    return Response.json({ error: `Günlük AI limitine ulaştın (${quota.lim}/gün). Yarın tekrar dene.` }, { status: 429 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "GEMINI_API_KEY tanımlı değil (.env.local / Vercel ortam değişkeni)." }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: `${userPrompt}\n\n---\nNOT:\n${text || "(boş)"}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const raw = data?.error?.message || "AI çağrısı başarısız.";
      const msg =
        res.status === 400 && /API key/i.test(raw)
          ? "Gemini API anahtarı geçersiz."
          : res.status === 429
            ? "Ücretsiz kota sınırına takıldı, biraz sonra tekrar dene."
            : raw;
      return Response.json({ error: msg }, { status: res.status });
    }

    const result = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part?.text || "")
      .join("\n")
      .trim();

    if (!result) {
      const blocked = data?.promptFeedback?.blockReason;
      return Response.json({ error: blocked ? `İçerik engellendi (${blocked}).` : "Boş yanıt döndü." }, { status: 502 });
    }

    return Response.json({ result });
  } catch (error) {
    console.log("notes-ai error", error?.message || error);
    return Response.json({ error: error?.message || "AI çağrısı başarısız." }, { status: 500 });
  }
}
