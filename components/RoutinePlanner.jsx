"use client";

import { useMemo, useState } from "react";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CATEGORIES = [
  { value: "egitim", label: "Eğitim", icon: "🎓", color: "#60a5fa" },
  { value: "is", label: "İş", icon: "💼", color: "#a78bfa" },
  { value: "gunluk", label: "Günlük", icon: "✅", color: "#34d399" },
  { value: "saglik", label: "Sağlık", icon: "💪", color: "#fb7185" },
  { value: "finans", label: "Finans", icon: "💰", color: "#fbbf24" },
  { value: "kisisel", label: "Kişisel", icon: "✨", color: "#22d3ee" },
];

const PRIORITIES = [
  { value: "dusuk", label: "Düşük", icon: "🟢" },
  { value: "orta", label: "Orta", icon: "🟡" },
  { value: "yuksek", label: "Yüksek", icon: "🔴" },
];

const glass = {
  border: "1px solid rgba(148,163,184,.18)",
  background: "linear-gradient(145deg, rgba(15,23,42,.96), rgba(30,41,59,.78))",
  boxShadow: "0 22px 55px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.08)",
  backdropFilter: "blur(14px)",
};

const inputStyle = {
  width: "100%",
  border: "1px solid rgba(148,163,184,.24)",
  background: "rgba(2,6,23,.58)",
  color: "#f8fafc",
  borderRadius: "15px",
  padding: "13px 14px",
  outline: "none",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromISO(value) {
  const safe = value || todayISO();
  return new Date(`${safe}T12:00:00`);
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function weekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
}

function buildWeeks(year) {
  const first = new Date(Number(year), 0, 1);
  const last = new Date(Number(year), 11, 31);
  let cursor = startOfWeek(first);
  const weeks = [];

  while (cursor <= last) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
    const visibleDay = days.find((day) => day.getFullYear() === Number(year)) || days[0];
    weeks.push({
      id: `${year}-${toISO(cursor)}`,
      number: weekNumber(cursor),
      monthIndex: visibleDay.getMonth(),
      monthName: MONTHS[visibleDay.getMonth()],
      days,
    });
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

function normalizeRoutine(item) {
  return {
    id: String(item?.id || Date.now() + Math.random()),
    title: item?.title || item?.name || "İsimsiz iş",
    category: item?.category || "gunluk",
    priority: item?.priority || "orta",
    date: item?.date || item?.dueDate || todayISO(),
    note: item?.note || "",
    done: Boolean(item?.done || item?.completed),
  };
}

function categoryInfo(value) {
  return CATEGORIES.find((item) => item.value === value) || CATEGORIES[2];
}

function priorityInfo(value) {
  return PRIORITIES.find((item) => item.value === value) || PRIORITIES[1];
}

function formatDate(value) {
  const date = dateFromISO(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}>
      <span style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 800 }}>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

export default function RoutinePlanner({ routines, setRoutines }) {
  const list = Array.isArray(routines) ? routines : [];
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", category: "egitim", priority: "orta", date: todayISO(), note: "" });

  const normalized = useMemo(() => list.map(normalizeRoutine), [list]);
  const weeks = useMemo(() => buildWeeks(selectedYear), [selectedYear]);

  const filtered = useMemo(() => {
    return normalized.filter((item) => {
      const date = dateFromISO(item.date);
      const monthOk = selectedMonth === "all" || date.getMonth() === Number(selectedMonth);
      const statusOk = statusFilter === "all" || (statusFilter === "done" ? item.done : !item.done);
      const categoryOk = categoryFilter === "all" || item.category === categoryFilter;
      const priorityOk = priorityFilter === "all" || item.priority === priorityFilter;
      const searchOk = !search.trim() || `${item.title} ${item.note}`.toLowerCase().includes(search.toLowerCase());
      return date.getFullYear() === Number(selectedYear) && monthOk && statusOk && categoryOk && priorityOk && searchOk;
    });
  }, [normalized, selectedYear, selectedMonth, statusFilter, categoryFilter, priorityFilter, search]);

  const byDate = useMemo(() => {
    return filtered.reduce((map, item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
      return map;
    }, {});
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((item) => item.done).length;
    return { total, done, pending: total - done, ratio: total ? Math.round((done / total) * 100) : 0 };
  }, [filtered]);

  const upcoming = useMemo(() => {
    const today = new Date(`${todayISO()}T00:00:00`);
    return normalized
      .filter((item) => !item.done && new Date(`${item.date}T00:00:00`) >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 10);
  }, [normalized]);

  const addRoutine = () => {
    const title = form.title.trim();
    if (!title) return alert("Rutin / iş adı gir.");

    const next = {
      id: String(Date.now()),
      title,
      category: form.category,
      priority: form.priority,
      date: form.date || todayISO(),
      note: form.note.trim(),
      done: false,
      completed: false,
    };

    setRoutines?.((current) => [next, ...(Array.isArray(current) ? current : [])]);
    setForm({ title: "", category: form.category, priority: "orta", date: todayISO(), note: "" });
  };

  const toggleRoutine = (id) => {
    setRoutines?.((current) =>
      (Array.isArray(current) ? current : []).map((item) => {
        if (String(item.id) !== String(id)) return item;
        const nextDone = !Boolean(item.done || item.completed);
        return { ...item, done: nextDone, completed: nextDone };
      })
    );
  };

  const deleteRoutine = (id) => {
    setRoutines?.((current) => (Array.isArray(current) ? current : []).filter((item) => String(item.id) !== String(id)));
  };

  const gridTwo = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" };
  const gridMonth = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" };
  const gridWeek = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "16px" };

  return (
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "22px", alignItems: "start" }}>
      <div>
        <div style={{ ...glass, borderRadius: "28px", padding: "26px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "-100px", top: "-100px", width: "240px", height: "240px", background: "radial-gradient(circle, rgba(96,165,250,.45), transparent 65%)" }} />
          <div style={{ position: "absolute", right: "-100px", bottom: "-120px", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(168,85,247,.38), transparent 65%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: "999px", background: "rgba(96,165,250,.14)", color: "#bfdbfe", fontWeight: 900, marginBottom: "12px" }}>🗓️ 3D Yıllık Rutin Takvimi</div>
                <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 44px)", color: "#f8fafc", letterSpacing: "-0.04em" }}>{selectedYear} Rutin Planı</h2>
                <p style={{ color: "#cbd5e1", maxWidth: "760px", lineHeight: 1.6 }}>Haftalık düzen, aylık görünüm, yaklaşan işler, filtreler ve görsel kategori kartları tek ekranda.</p>
              </div>
              <Field label="Yıl">
                <Select value={selectedYear} onChange={setSelectedYear} options={[currentYear - 1, currentYear, currentYear + 1].map((year) => ({ value: year, label: String(year) }))} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginTop: "22px" }}>
              <Stat label="Toplam" value={stats.total} />
              <Stat label="Tamamlanan" value={stats.done} />
              <Stat label="Bekleyen" value={stats.pending} />
              <Stat label="Başarı" value={`%${stats.ratio}`} />
            </div>
          </div>
        </div>

        <Panel title="➕ Yeni Rutin / İş Ekle">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Başlık"><input style={inputStyle} value={form.title} placeholder="Örn: SQL çalış, spor yap" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field>
            <Field label="Kategori"><Select value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Öncelik"><Select value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Tarih"><input style={inputStyle} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={form.note} placeholder="Opsiyonel" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></Field>
            <button type="button" onClick={addRoutine} style={{ border: 0, borderRadius: "16px", padding: "14px 18px", color: "#08111f", fontWeight: 900, cursor: "pointer", background: "linear-gradient(135deg, #67e8f9, #60a5fa, #a78bfa)", boxShadow: "0 15px 30px rgba(96,165,250,.35)", alignSelf: "end" }}>Ekle</button>
          </div>
        </Panel>

        <Panel title="🔎 Filtreler">
          <div style={gridTwo}>
            <Field label="Ay"><Select value={selectedMonth} onChange={setSelectedMonth} options={[{ value: "all", label: "Tüm Aylar" }, ...MONTHS.map((month, index) => ({ value: String(index), label: month }))]} /></Field>
            <Field label="Durum"><Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Tümü" }, { value: "pending", label: "Bekleyen" }, { value: "done", label: "Tamamlanan" }]} /></Field>
            <Field label="Kategori"><Select value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "all", label: "Tüm Kategoriler" }, ...CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Öncelik"><Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "all", label: "Tüm Öncelikler" }, ...PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Arama"><input style={inputStyle} value={search} placeholder="Rutin ara" onChange={(event) => setSearch(event.target.value)} /></Field>
          </div>
        </Panel>

        <Panel title="📅 Aylar">
          <div style={gridMonth}>
            <MonthCard active={selectedMonth === "all"} title="Tüm Yıl" count={filtered.length} onClick={() => setSelectedMonth("all")} />
            {MONTHS.map((month, index) => {
              const count = normalized.filter((item) => {
                const date = dateFromISO(item.date);
                return date.getFullYear() === Number(selectedYear) && date.getMonth() === index;
              }).length;
              return <MonthCard key={month} active={selectedMonth === String(index)} title={month} count={count} onClick={() => setSelectedMonth(String(index))} />;
            })}
          </div>
        </Panel>

        <div style={gridWeek}>
          {weeks.filter((week) => selectedMonth === "all" || week.monthIndex === Number(selectedMonth)).map((week) => {
            const weekTasks = week.days.reduce((arr, day) => [...arr, ...(byDate[toISO(day)] || [])], []);
            return (
              <div key={week.id} style={{ ...glass, borderRadius: "24px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <strong style={{ color: "#f8fafc" }}>{week.monthName}</strong>
                  <span style={{ color: "#93c5fd", fontWeight: 900 }}>{week.number}. Hafta</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginBottom: "12px" }}>
                  {week.days.map((day, index) => {
                    const key = toISO(day);
                    const dayTasks = byDate[key] || [];
                    const isToday = key === todayISO();
                    return (
                      <div key={key} style={{ minHeight: "46px", borderRadius: "14px", padding: "6px", background: "rgba(2,6,23,.45)", border: isToday ? "1px solid rgba(96,165,250,.85)" : "1px solid rgba(148,163,184,.13)", color: "#cbd5e1", fontSize: "11px", boxShadow: isToday ? "0 12px 25px rgba(96,165,250,.20)" : "none" }}>
                        <strong>{DAYS[index]}</strong>
                        <div>{day.getDate()}</div>
                        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "5px" }}>
                          {dayTasks.slice(0, 4).map((task) => <span key={task.id} style={{ width: "7px", height: "7px", borderRadius: "999px", background: categoryInfo(task.category).color }} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {weekTasks.length === 0 ? <SmallEmpty text="Bu haftaya kayıt yok." /> : weekTasks.slice(0, 6).map((task) => <TaskCard key={task.id} task={task} onToggle={toggleRoutine} onDelete={deleteRoutine} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside style={{ minWidth: 0 }}>
        <Panel title="⏰ Yaklaşan İşler">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {upcoming.length === 0 ? <SmallEmpty text="Yaklaşan iş yok." /> : upcoming.map((task) => <UpcomingCard key={task.id} task={task} />)}
          </div>
        </Panel>

        <Panel title="🎯 Kategori Görselleri">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {CATEGORIES.map((category) => {
              const count = filtered.filter((item) => item.category === category.value).length;
              return <div key={category.value} style={{ padding: "13px", borderRadius: "18px", background: "rgba(2,6,23,.48)", border: `1px solid ${category.color}66` }}><strong style={{ color: "#f8fafc" }}>{category.icon} {category.label}</strong><span style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>{count} kayıt</span></div>;
            })}
          </div>
        </Panel>
      </aside>
    </section>
  );
}

function Panel({ title, children }) {
  return <div style={{ ...glass, borderRadius: "26px", padding: "20px", marginBottom: "18px" }}><div style={{ marginBottom: "16px" }}><h3 style={{ margin: 0, color: "#f8fafc", fontSize: "20px" }}>{title}</h3></div>{children}</div>;
}

function Stat({ label, value }) {
  return <div style={{ padding: "16px", borderRadius: "20px", background: "rgba(15,23,42,.72)", border: "1px solid rgba(255,255,255,.08)" }}><span style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 700 }}>{label}</span><strong style={{ display: "block", marginTop: "6px", fontSize: "24px", color: "#f8fafc" }}>{value}</strong></div>;
}

function MonthCard({ active, title, count, onClick }) {
  return <button type="button" onClick={onClick} style={{ ...glass, borderRadius: "20px", padding: "15px", cursor: "pointer", textAlign: "left", borderColor: active ? "rgba(96,165,250,.75)" : "rgba(148,163,184,.18)", transform: active ? "translateY(-4px)" : "none" }}><strong style={{ display: "block", color: "#f8fafc", fontSize: "15px" }}>{title}</strong><span style={{ display: "block", color: "#94a3b8", marginTop: "5px", fontSize: "12px" }}>{count} kayıt</span></button>;
}

function TaskCard({ task, onToggle, onDelete }) {
  const category = categoryInfo(task.category);
  const priority = priorityInfo(task.priority);
  return <div style={{ ...glass, borderRadius: "16px", padding: "10px 11px", display: "flex", justifyContent: "space-between", gap: "10px", opacity: task.done ? .55 : 1 }}><div style={{ display: "flex", gap: "9px" }}><span style={{ fontSize: "20px" }}>{category.icon}</span><div><strong style={{ color: "#f8fafc", display: "block", fontSize: "13px" }}>{task.title}</strong><span style={{ color: "#94a3b8", display: "block", fontSize: "11px", marginTop: "3px" }}>{formatDate(task.date)} • {category.label} • {priority.icon} {priority.label}</span>{task.note ? <span style={{ color: "#94a3b8", display: "block", fontSize: "11px", marginTop: "3px" }}>{task.note}</span> : null}</div></div><div style={{ display: "flex", gap: "6px", alignItems: "center" }}><MiniButton onClick={() => onToggle(task.id)}>{task.done ? "Geri Al" : "Bitti"}</MiniButton><MiniButton danger onClick={() => onDelete(task.id)}>Sil</MiniButton></div></div>;
}

function UpcomingCard({ task }) {
  const category = categoryInfo(task.category);
  const priority = priorityInfo(task.priority);
  return <div style={{ padding: "13px", borderRadius: "18px", background: "rgba(2,6,23,.48)", border: "1px solid rgba(148,163,184,.14)" }}><strong style={{ color: "#f8fafc", display: "block" }}>{category.icon} {task.title}</strong><span style={{ color: "#94a3b8", fontSize: "12px", marginTop: "5px", display: "block" }}>{formatDate(task.date)} • {category.label} • {priority.icon} {priority.label}</span>{task.note ? <span style={{ color: "#94a3b8", fontSize: "12px", marginTop: "5px", display: "block" }}>{task.note}</span> : null}</div>;
}

function SmallEmpty({ text }) {
  return <div style={{ padding: "13px", borderRadius: "18px", background: "rgba(2,6,23,.48)", border: "1px solid rgba(148,163,184,.14)", color: "#94a3b8", fontSize: "12px" }}>{text}</div>;
}

function MiniButton({ children, onClick, danger = false }) {
  return <button type="button" onClick={onClick} style={{ border: danger ? "1px solid rgba(248,113,113,.28)" : "1px solid rgba(148,163,184,.2)", background: "rgba(15,23,42,.8)", color: danger ? "#fecaca" : "#f8fafc", borderRadius: "10px", padding: "7px 9px", cursor: "pointer" }}>{children}</button>;
}
