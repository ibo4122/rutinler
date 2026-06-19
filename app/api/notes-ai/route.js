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

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const action = body?.action;
  const text = String(body?.text || "").trim();
  const prompt = PROMPTS[action];

  if (!prompt) return Response.json({ error: "Geçersiz AI işlemi." }, { status: 400 });
  if (!text) return Response.json({ error: "Not içeriği boş — önce bir şeyler yaz." }, { status: 400 });

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
          contents: [{ role: "user", parts: [{ text: `${prompt}\n\n---\nNOT:\n${text}` }] }],
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
