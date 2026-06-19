"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Image } from "@tiptap/extension-image";

const AI_ACTIONS = [
  { key: "ask", label: "Soru sor / Açıkla", icon: "💬" },
  { key: "summary", label: "Notu özetle", icon: "📝" },
  { key: "gaps", label: "Eksik noktaları bul", icon: "🔍" },
  { key: "quiz", label: "Quiz oluştur", icon: "❓" },
  { key: "flashcards", label: "Flashcard oluştur", icon: "🃏" },
  { key: "toEn", label: "İngilizceye çevir", icon: "🇬🇧" },
  { key: "toTr", label: "Türkçeye çevir", icon: "🇹🇷" },
  { key: "keywords", label: "Anahtar kavramları çıkar", icon: "🔑" },
  { key: "plan", label: "Çalışma planı oluştur", icon: "🗓️" },
];

const COLORS = ["#f8fafc", "#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#22d3ee"];

export default function NoteEditor({ noteId, content, onChange, onAiAction, uploadFile }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const uploadModeRef = useRef("image");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Yazmaya başla… başlık, liste, kod bloğu, tablo ekleyebilirsin." }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ HTMLAttributes: { class: "noteImg" } }),
    ],
    content: content && Object.keys(content || {}).length ? content : "",
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  });

  // Not değiştiğinde editör içeriğini yükle (Tiptap içeriği prop değişiminde otomatik güncellemiyor)
  useEffect(() => {
    if (!editor) return;
    const next = content && Object.keys(content || {}).length ? content : "";
    editor.commands.setContent(next, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Bağlantı adresi (URL):", "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const openUpload = (mode) => {
    if (!uploadFile || !fileInputRef.current) return;
    uploadModeRef.current = mode;
    fileInputRef.current.value = "";
    fileInputRef.current.accept = mode === "image" ? "image/*" : "*/*";
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadFile) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      if (res?.url) {
        if (uploadModeRef.current === "image") editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
        else editor.chain().focus().insertContent(`<a href="${res.url}">📎 ${file.name}</a> `).run();
      } else {
        window.alert("Yükleme başarısız: " + (res?.error?.message || "bilinmeyen hata"));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="noteEditor">
      <div className="noteToolbar">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Kalın"><b>B</b></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="İtalik"><i>I</i></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Altı çizili"><u>U</u></Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Üstü çizili"><s>S</s></Btn>
        <Sep />
        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Başlık 1">H1</Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Başlık 2">H2</Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Başlık 3">H3</Btn>
        <Sep />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Madde listesi">•</Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numaralı liste">1.</Btn>
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Alıntı">❝</Btn>
        <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Satır içi kod">{"</>"}</Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Kod bloğu">{"{ }"}</Btn>
        <Sep />
        <Btn active={editor.isActive("link")} onClick={addLink} title="Bağlantı">🔗</Btn>
        <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Tablo ekle">▦</Btn>
        {uploadFile ? <Btn onClick={() => openUpload("image")} title="Görsel ekle">{uploading ? "⏳" : "🖼"}</Btn> : null}
        {uploadFile ? <Btn onClick={() => openUpload("file")} title="Dosya ekle">📎</Btn> : null}
        <Sep />
        <span className="colorRow" title="Metin rengi">
          {COLORS.map((c) => (
            <button key={c} type="button" className="colorDot" style={{ background: c }} onClick={() => editor.chain().focus().setColor(c).run()} />
          ))}
        </span>
        <Sep />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Geri al">↶</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="İleri al">↷</Btn>

        <div className="aiWrap">
          <button type="button" className="aiButton" onClick={() => setAiOpen((v) => !v)}>✨ AI</button>
          {aiOpen ? (
            <div className="aiMenu" onMouseLeave={() => setAiOpen(false)}>
              {AI_ACTIONS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className="aiMenuItem"
                  onClick={() => { setAiOpen(false); onAiAction ? onAiAction(a.key, editor.getText()) : window.alert(`"${a.label}" — yapay zeka bağlantısı Faz 3'te eklenecek.`); }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />

      <EditorContent editor={editor} className="noteContent" />

      {editor.isActive("table") ? (
        <div className="tableTools">
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Sütun</button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Satır</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>− Sütun</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>− Satır</button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>Tabloyu sil</button>
        </div>
      ) : null}
    </div>
  );
}

function Btn({ active, onClick, title, children }) {
  return (
    <button type="button" className={active ? "tbBtn active" : "tbBtn"} onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

function Sep() {
  return <span className="tbSep" />;
}
