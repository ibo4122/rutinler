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
