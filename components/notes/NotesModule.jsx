"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NoteEditor from "./NoteEditor";
import {
  fetchCategories, fetchNotes, createCategory, updateCategory, deleteCategory,
  createNote, updateNote, deleteNote, isMissingTableError, uploadAttachment, refreshContentMedia,
} from "../../lib/notesApi";

const ICONS = ["📁", "📘", "📗", "📙", "📕", "💻", "🗄️", "📊", "💰", "💼", "🧠", "🌐", "🔤", "⚙️", "🎯", "📐"];
const CAT_COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#f472b6", "#fb923c"];

function extractText(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  let s = node.text || "";
  if (node.content) s += " " + extractText(node.content);
  return s;
}

export default function NotesModule({ userId }) {
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("tree"); // tree | favorites | recent
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState({ open: false, loading: false, title: "", result: "", error: "" });
  const saveTimer = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const catRes = await fetchCategories(userId);
    if (isMissingTableError(catRes.error)) {
      setSchemaMissing(true);
      setLoading(false);
      return;
    }
    const noteRes = await fetchNotes(userId);
    setCategories(catRes.data);
    setNotes(noteRes.data);
    setExpanded((prev) => {
      const next = { ...prev };
      catRes.data.forEach((c) => { if (next[c.id] === undefined) next[c.id] = true; });
      return next;
    });
    setLoading(false);
  };

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);
  const notesByCat = useMemo(() => {
    const map = {};
    notes.forEach((n) => { (map[n.category_id] = map[n.category_id] || []).push(n); });
    return map;
  }, [notes]);

  const favorites = useMemo(() => notes.filter((n) => n.is_favorite), [notes]);
  const recents = useMemo(() => [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 8), [notes]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const catName = (id) => (categories.find((c) => c.id === id)?.name || "").toLowerCase();
    return notes.filter((n) =>
      (n.title || "").toLowerCase().includes(q) ||
      catName(n.category_id).includes(q) ||
      extractText(n.content).toLowerCase().includes(q)
    );
  }, [query, notes, categories]);

  // --- Kategori işlemleri ---
  const addCategory = async () => {
    const name = window.prompt("Kategori adı:", "");
    if (!name || !name.trim()) return;
    const color = CAT_COLORS[categories.length % CAT_COLORS.length];
    const { data, error } = await createCategory(userId, { name: name.trim(), color, position: categories.length });
    if (!error && data) { setCategories((c) => [...c, data]); setExpanded((e) => ({ ...e, [data.id]: true })); }
  };
  const renameCategory = async (cat) => {
    const name = window.prompt("Yeni kategori adı:", cat.name);
    if (!name || !name.trim()) return;
    const { data } = await updateCategory(cat.id, { name: name.trim() });
    if (data) setCategories((c) => c.map((x) => (x.id === cat.id ? data : x)));
  };
  const cycleIcon = async (cat) => {
    const idx = (ICONS.indexOf(cat.icon) + 1) % ICONS.length;
    const { data } = await updateCategory(cat.id, { icon: ICONS[idx] });
    if (data) setCategories((c) => c.map((x) => (x.id === cat.id ? data : x)));
  };
  const cycleColor = async (cat) => {
    const idx = (CAT_COLORS.indexOf(cat.color) + 1) % CAT_COLORS.length;
    const { data } = await updateCategory(cat.id, { color: CAT_COLORS[idx] });
    if (data) setCategories((c) => c.map((x) => (x.id === cat.id ? data : x)));
  };
  const removeCategory = async (cat) => {
    if (!window.confirm(`"${cat.name}" kategorisi ve içindeki tüm notlar silinsin mi?`)) return;
    await deleteCategory(cat.id);
    setCategories((c) => c.filter((x) => x.id !== cat.id));
    setNotes((n) => n.filter((x) => x.category_id !== cat.id));
  };

  // --- Not işlemleri ---
  const addNote = async (categoryId) => {
    const { data, error } = await createNote(userId, categoryId, { title: "Yeni Not", content: {} });
    if (!error && data) { setNotes((n) => [data, ...n]); setSelectedId(data.id); setExpanded((e) => ({ ...e, [categoryId]: true })); setView("tree"); }
  };
  const renameNote = async (note) => {
    const title = window.prompt("Not başlığı:", note.title);
    if (title === null) return;
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, title } : x)));
    await updateNote(note.id, { title });
  };
  const removeNote = async (note) => {
    if (!window.confirm(`"${note.title}" notu silinsin mi?`)) return;
    await deleteNote(note.id);
    setNotes((n) => n.filter((x) => x.id !== note.id));
    if (selectedId === note.id) setSelectedId(null);
  };
  const toggleFavorite = async (note) => {
    const next = !note.is_favorite;
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, is_favorite: next } : x)));
    await updateNote(note.id, { is_favorite: next });
  };

  const scheduleSave = (id, patch) => {
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateNote(id, patch);
      setSaving(false);
    }, 800);
  };
  const onContentChange = (json) => {
    if (!selectedNote) return;
    setNotes((n) => n.map((x) => (x.id === selectedNote.id ? { ...x, content: json, updated_at: new Date().toISOString() } : x)));
    scheduleSave(selectedNote.id, { content: json });
  };
  const onTitleChange = (title) => {
    if (!selectedNote) return;
    setNotes((n) => n.map((x) => (x.id === selectedNote.id ? { ...x, title } : x)));
    scheduleSave(selectedNote.id, { title });
  };
  const handleUpload = async (file) => {
    if (!selectedNote) return { error: { message: "Önce bir not seç." } };
    return uploadAttachment(userId, selectedNote.id, file);
  };

  const AI_TITLES = {
    ask: "💬 Soru sor / Açıkla",
    summary: "📝 Özet", gaps: "🔍 Eksik Noktalar", quiz: "❓ Quiz", flashcards: "🃏 Flashcard'lar",
    toEn: "🇬🇧 İngilizce Çeviri", toTr: "🇹🇷 Türkçe Çeviri", keywords: "🔑 Anahtar Kavramlar", plan: "🗓️ Çalışma Planı",
  };
  const handleAiAction = async (action, text) => {
    // Serbest soru: önce kullanıcının sorusunu girmesi için input modunu aç.
    if (action === "ask") {
      setAi({ open: true, loading: false, title: AI_TITLES.ask, result: "", error: "", askMode: true, noteText: text || "", question: "" });
      return;
    }
    setAi({ open: true, loading: true, title: AI_TITLES[action] || "AI", result: "", error: "", askMode: false });
    try {
      const res = await fetch("/api/notes-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setAi((a) => ({ ...a, loading: false, error: data?.error || "AI çağrısı başarısız." }));
      else setAi((a) => ({ ...a, loading: false, result: data?.result || "(boş yanıt)" }));
    } catch (e) {
      setAi((a) => ({ ...a, loading: false, error: "AI çağrısı başarısız: " + e.message }));
    }
  };
  const runAsk = async () => {
    const question = (ai.question || "").trim();
    if (!question) return;
    setAi((a) => ({ ...a, loading: true, error: "", result: "" }));
    try {
      const res = await fetch("/api/notes-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "ask", question, text: ai.noteText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setAi((a) => ({ ...a, loading: false, error: data?.error || "AI çağrısı başarısız." }));
      else setAi((a) => ({ ...a, loading: false, result: data?.result || "(boş yanıt)", askMode: false }));
    } catch (e) {
      setAi((a) => ({ ...a, loading: false, error: "AI çağrısı başarısız: " + e.message }));
    }
  };
  const copyAiResult = async () => {
    try { await navigator.clipboard.writeText(ai.result); } catch {}
  };
  const insertAiIntoNote = () => {
    if (!ai.result || !editorRef.current) return;
    editorRef.current.appendAiResult(ai.title, ai.result);
    setAi((a) => ({ ...a, open: false }));
  };

  if (schemaMissing) {
    return (
      <section className="panelCard">
        <div className="emptyState" style={{ textAlign: "left", padding: 24 }}>
          <strong style={{ fontSize: 16 }}>Notlar şeması kurulmamış</strong>
          <span style={{ marginTop: 8 }}>Supabase → SQL Editor'da <code>categories</code>, <code>notes</code>, <code>attachments</code> tablolarını oluşturan SQL'i çalıştır, sonra bu sayfayı yenile.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="notesLayout">
      <aside className="notesSidebar">
        <div className="notesSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Notlarda ara…" />
        </div>

        <div className="notesViewTabs">
          <button className={view === "tree" ? "nv active" : "nv"} onClick={() => setView("tree")}>Kategoriler</button>
          <button className={view === "favorites" ? "nv active" : "nv"} onClick={() => setView("favorites")}>⭐ Favoriler</button>
          <button className={view === "recent" ? "nv active" : "nv"} onClick={() => setView("recent")}>🕘 Son</button>
        </div>

        <div className="notesTree">
          {query.trim() ? (
            <NoteFlatList title={`Arama (${searchResults.length})`} items={searchResults} categories={categories} selectedId={selectedId} onSelect={setSelectedId} />
          ) : view === "favorites" ? (
            <NoteFlatList title="Favoriler" items={favorites} categories={categories} selectedId={selectedId} onSelect={setSelectedId} emptyText="Henüz favori not yok." />
          ) : view === "recent" ? (
            <NoteFlatList title="Son düzenlenenler" items={recents} categories={categories} selectedId={selectedId} onSelect={setSelectedId} emptyText="Henüz not yok." />
          ) : (
            <>
              {categories.length === 0 ? <div className="notesHint">Henüz kategori yok. Aşağıdan ekle.</div> : null}
              {categories.map((cat) => (
                <div key={cat.id} className="catBlock">
                  <div className="catRow" style={{ borderLeft: `3px solid ${cat.color}` }}>
                    <button className="catToggle" onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))}>{expanded[cat.id] ? "▾" : "▸"}</button>
                    <button className="catIcon" title="İkonu değiştir" onClick={() => cycleIcon(cat)}>{cat.icon}</button>
                    <span className="catName" onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))}>{cat.name}</span>
                    <span className="catCount">{(notesByCat[cat.id] || []).length}</span>
                    <span className="catActions">
                      <button title="Not ekle" onClick={() => addNote(cat.id)}>＋</button>
                      <button title="Renk" onClick={() => cycleColor(cat)} style={{ color: cat.color }}>●</button>
                      <button title="Yeniden adlandır" onClick={() => renameCategory(cat)}>✎</button>
                      <button title="Sil" onClick={() => removeCategory(cat)}>🗑</button>
                    </span>
                  </div>
                  {expanded[cat.id] ? (
                    <div className="catNotes">
                      {(notesByCat[cat.id] || []).length === 0 ? <div className="notesHint small">Boş — ＋ ile sayfa ekle</div> : null}
                      {(notesByCat[cat.id] || []).map((note) => (
                        <div key={note.id} className={note.id === selectedId ? "noteRow active" : "noteRow"} onClick={() => setSelectedId(note.id)}>
                          <span className="noteTitle">{note.is_favorite ? "⭐ " : ""}{note.title || "Başlıksız"}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>

        <button className="addCategoryBtn" onClick={addCategory}>＋ Yeni Kategori</button>
      </aside>

      <main className="notesMain">
        {loading ? (
          <div className="notesEmpty"><strong>Yükleniyor…</strong></div>
        ) : selectedNote ? (
          <div className="noteWorkspace">
            <div className="noteHeader">
              <input className="noteTitleInput" value={selectedNote.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Başlıksız" />
              <div className="noteHeaderActions">
                <span className="saveDot">{saving ? "Kaydediliyor…" : "Kaydedildi"}</span>
                <button className="ghostBtn" onClick={() => toggleFavorite(selectedNote)}>{selectedNote.is_favorite ? "⭐ Favoride" : "☆ Favori"}</button>
                <button className="ghostBtn" onClick={() => renameNote(selectedNote)}>Yeniden adlandır</button>
                <button className="ghostBtn danger" onClick={() => removeNote(selectedNote)}>Sil</button>
              </div>
            </div>
            <NoteEditor ref={editorRef} noteId={selectedNote.id} content={selectedNote.content} onChange={onContentChange} uploadFile={handleUpload} onAiAction={handleAiAction} refreshMedia={refreshContentMedia} />
          </div>
        ) : (
          <div className="notesEmpty">
            <strong>Bir not seç ya da yeni oluştur</strong>
            <span>Soldan bir kategori aç, ＋ ile sayfa ekle ve yazmaya başla.</span>
          </div>
        )}
      </main>

      {ai.open ? (
        <div className="aiModalOverlay" onClick={() => setAi((a) => ({ ...a, open: false }))}>
          <div className="aiModal" onClick={(e) => e.stopPropagation()}>
            <div className="aiModalHead">
              <strong>{ai.title}</strong>
              <button className="ghostBtn" onClick={() => setAi((a) => ({ ...a, open: false }))}>Kapat</button>
            </div>
            <div className="aiModalBody">
              {ai.loading ? (
                <div className="aiLoading">✨ Yapay zeka çalışıyor…</div>
              ) : ai.askMode && !ai.result ? (
                <div className="aiAskBox">
                  <p className="sectionDescription" style={{ marginTop: 0 }}>Bu nota dayanarak bir şey sor: "şunu açıkla", "örnek ver", "bu ne demek", "beni sına"…</p>
                  <textarea
                    className="aiAskInput"
                    value={ai.question}
                    autoFocus
                    placeholder="Sorunu yaz…"
                    onChange={(e) => setAi((a) => ({ ...a, question: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runAsk(); }}
                  />
                  {ai.error ? <div className="aiError" style={{ marginTop: 10 }}>⚠️ {ai.error}</div> : null}
                </div>
              ) : ai.error ? (
                <div className="aiError">⚠️ {ai.error}</div>
              ) : (
                <pre className="aiResult">{ai.result}</pre>
              )}
            </div>
            <div className="aiModalFoot">
              {ai.askMode && !ai.result ? (
                <button className="premiumButton" onClick={runAsk} disabled={ai.loading || !(ai.question || "").trim()}>Gönder ✨</button>
              ) : !ai.loading && !ai.error && ai.result ? (
                <>
                  <button className="ghostBtn" onClick={copyAiResult}>📋 Kopyala</button>
                  {selectedNote ? <button className="premiumButton" onClick={insertAiIntoNote}>⬇ Nota ekle</button> : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function NoteFlatList({ title, items, categories, selectedId, onSelect, emptyText }) {
  return (
    <div className="flatList">
      <div className="flatTitle">{title}</div>
      {items.length === 0 ? <div className="notesHint">{emptyText || "Sonuç yok."}</div> : null}
      {items.map((note) => {
        const cat = categories.find((c) => c.id === note.category_id);
        return (
          <div key={note.id} className={note.id === selectedId ? "noteRow active" : "noteRow"} onClick={() => onSelect(note.id)}>
            <span className="noteTitle">{note.is_favorite ? "⭐ " : ""}{note.title || "Başlıksız"}</span>
            {cat ? <span className="noteCatTag" style={{ color: cat.color }}>{cat.icon} {cat.name}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
