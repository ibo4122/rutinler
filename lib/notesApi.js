import { supabase } from "./supabaseClient";

// Notlar modülü için Supabase CRUD yardımcıları (categories / notes tabloları).
// Tablolar yoksa PGRST205 döner; modül bunu yakalayıp "şemayı kur" uyarısı gösterir.

export async function fetchCategories(userId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return { data: data || [], error };
}

export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return { data: data || [], error };
}

export async function createCategory(userId, payload) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: payload.name, icon: payload.icon || "📁", color: payload.color || "#60a5fa", position: payload.position || 0 })
    .select()
    .single();
  return { data, error };
}

export async function updateCategory(id, patch) {
  const { data, error } = await supabase.from("categories").update(patch).eq("id", id).select().single();
  return { data, error };
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error };
}

export async function createNote(userId, categoryId, payload = {}) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      category_id: categoryId,
      title: payload.title || "Yeni Not",
      content: payload.content || {},
    })
    .select()
    .single();
  return { data, error };
}

export async function updateNote(id, patch) {
  const { data, error } = await supabase
    .from("notes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteNote(id) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  return { error };
}

export function isMissingTableError(error) {
  return error && (error.code === "PGRST205" || /Could not find the table/i.test(error.message || ""));
}

// note-attachments bucket'ı PRIVATE'dır: dosyalara yalnızca imzalı (signed) URL ile
// erişilir ve URL'ler süreli olduğundan not açıldığında yenilenir (refreshContentMedia).
const ATT_BUCKET = "note-attachments";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 gün (uzun düzenleme oturumlarına yeter; her açılışta tazelenir)

// İmzalı/eski public URL veya çıplak yol içinden bucket'a göre depolama yolunu çıkar.
export function extractStoragePath(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/note-attachments\/([^?]+)/);
  if (m) return decodeURIComponent(m[1]);
  return null;
}

export async function signStoragePath(path, expiresIn = SIGNED_URL_TTL) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(ATT_BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl || null;
}

// Tiptap içeriğindeki görsel/dosya bağlantılarının depolama URL'lerini taze imzalı
// URL'lerle değiştirir (kopya döner; medya yoksa içeriği aynen geri verir).
export async function refreshContentMedia(content) {
  if (!content || typeof content !== "object") return content;
  let clone;
  try { clone = JSON.parse(JSON.stringify(content)); } catch { return content; }

  const tasks = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "image" && node.attrs?.src) {
      const p = extractStoragePath(node.attrs.src);
      if (p) tasks.push(signStoragePath(p).then((u) => { if (u) node.attrs.src = u; }));
    }
    if (Array.isArray(node.marks)) {
      node.marks.forEach((mark) => {
        if (mark?.type === "link" && mark.attrs?.href) {
          const p = extractStoragePath(mark.attrs.href);
          if (p) tasks.push(signStoragePath(p).then((u) => { if (u) mark.attrs.href = u; }));
        }
      });
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(clone);
  if (!tasks.length) return content; // medya yok → orijinali döndür
  await Promise.all(tasks);
  return clone;
}

// Dosyayı kullanıcının klasörüne yükler, imzalı URL döner ve attachments tablosuna
// (kalıcı referans olarak depolama YOLU ile) kaydeder.
export async function uploadAttachment(userId, noteId, file) {
  const safeExt = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${noteId || "loose"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error: upErr } = await supabase.storage.from(ATT_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) return { error: upErr };
  const url = await signStoragePath(path);
  if (noteId) {
    await supabase.from("attachments").insert({ user_id: userId, note_id: noteId, file_url: path, file_name: file.name });
  }
  return { url: url || "", path, fileName: file.name };
}
