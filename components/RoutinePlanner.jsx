"use client";

import { useMemo, useState } from "react";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CATEGORIES = [
  { value: "egitim", label: "Eğitim", icon: "🎓", color: "#60a5fa", bg: "linear-gradient(145deg, rgba(37,99,235,.38), rgba(14,165,233,.16))" },
  { value: "is", label: "İş", icon: "💼", color: "#a78bfa", bg: "linear-gradient(145deg, rgba(124,58,237,.38), rgba(168,85,247,.14))" },
  { value: "gunluk", label: "Günlük", icon: "✅", color: "#34d399", bg: "linear-gradient(145deg, rgba(5,150,105,.34), rgba(16,185,129,.14))" },
  { value: "saglik", label: "Sağlık", icon: "💪", color: "#fb7185", bg: "linear-gradient(145deg, rgba(225,29,72,.34), rgba(251,113,133,.14))" },
  { value: "finans", label: "Finans", icon: "💰", color: "#fbbf24", bg: "linear-gradient(145deg, rgba(217,119,6,.34), rgba(251,191,36,.14))" },
  { value: "kisisel", label: "Kişisel", icon: "✨", color: "#22d3ee", bg: "linear-gradient(145deg, rgba(8,145,178,.34), rgba(34,211,238,.14))" },
  { value: "not", label: "Gün Notu", icon: "📝", color: "#f472b6", bg: "linear-gradient(145deg, rgba(190,24,93,.34), rgba(244,114,182,.14))" },
];

const GOAL_COLORS = [
  { value: "blue", label: "Mavi", color: "#60a5fa", bg: "linear-gradient(145deg, rgba(37,99,235,.45), rgba(14,165,233,.16))" },
  { value: "purple", label: "Mor", color: "#a78bfa", bg: "linear-gradient(145deg, rgba(124,58,237,.45), rgba(168,85,247,.16))" },
  { value: "green", label: "Yeşil", color: "#34d399", bg: "linear-gradient(145deg, rgba(5,150,105,.42), rgba(16,185,129,.16))" },
  { value: "yellow", label: "Sarı", color: "#fbbf24", bg: "linear-gradient(145deg, rgba(217,119,6,.42), rgba(251,191,36,.16))" },
  { value: "pink", label: "Pembe", color: "#f472b6", bg: "linear-gradient(145deg, rgba(190,24,93,.42), rgba(244,114,182,.16))" },
  { value: "cyan", label: "Camgöbeği", color: "#22d3ee", bg: "linear-gradient(145deg, rgba(8,145,178,.42), rgba(34,211,238,.16))" },
];

const PRIORITIES = [
  { value: "dusuk", label: "Düşük", icon: "🟢" },
  { value: "orta", label: "Orta", icon: "🟡" },
  { value: "yuksek", label: "Yüksek", icon: "🔴" },
];

const MONTH_GRADIENTS = [
  "linear-gradient(145deg, rgba(59,130,246,.36), rgba(14,165,233,.13))",
  "linear-gradient(145deg, rgba(168,85,247,.36), rgba(99,102,241,.13))",
  "linear-gradient(145deg, rgba(16,185,129,.36), rgba(20,184,166,.13))",
  "linear-gradient(145deg, rgba(251,191,36,.36), rgba(245,158,11,.13))",
  "linear-gradient(145deg, rgba(244,63,94,.36), rgba(251,113,133,.13))",
  "linear-gradient(145deg, rgba(34,211,238,.36), rgba(59,130,246,.13))",
  "linear-gradient(145deg, rgba(132,204,22,.36), rgba(16,185,129,.13))",
  "linear-gradient(145deg, rgba(249,115,22,.36), rgba(251,191,36,.13))",
  "linear-gradient(145deg, rgba(99,102,241,.36), rgba(168,85,247,.13))",
  "linear-gradient(145deg, rgba(236,72,153,.36), rgba(244,63,94,.13))",
  "linear-gradient(145deg, rgba(20,184,166,.36), rgba(34,211,238,.13))",
  "linear-gradient(145deg, rgba(148,163,184,.36), rgba(96,165,250,.13))",
];

const baseGlass = {
  border: "1px solid rgba(255,255,255,.14)",
  boxShadow: "0 22px 55px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.10)",
  backdropFilter: "blur(14px)",
};

const inputStyle = {
  width: "100%",
  border: "1px solid rgba(255,255,255,.20)",
  background: "rgba(2,6,23,.58)",
  color: "#f8fafc",
  borderRadius: "15px",
  padding: "12px 13px",
  outline: "none",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function localISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  return localISO(new Date());
}

function dateFromISO(value) {
  const safe = value || todayISO();
  const [year, month, day] = safe.split("-").map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1, 12, 0, 0, 0);
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
  next.setHours(12, 0, 0, 0);
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
  const first = new Date(Number(year), 0, 1, 12, 0, 0, 0);
  const last = new Date(Number(year), 11, 31, 12, 0, 0, 0);
  let cursor = startOfWeek(first);
  const weeks = [];

  while (cursor <= last) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
    const visibleDay = days.find((day) => day.getFullYear() === Number(year)) || days[0];
    weeks.push({
      id: `${year}-${localISO(cursor)}`,
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

function normalizeGoal(item) {
  return {
    id: String(item?.id || Date.now() + Math.random()),
    title: item?.title || "Yeni Hedef",
    progress: Math.max(0, Math.min(100, Number(item?.progress || 0))),
    color: item?.color || "blue",
    note: item?.note || "",
  };
}

function categoryInfo(value) {
  return CATEGORIES.find((item) => item.value === value) || CATEGORIES[2];
}

function priorityInfo(value) {
  return PRIORITIES.find((item) => item.value === value) || PRIORITIES[1];
}

function goalColorInfo(value) {
  return GOAL_COLORS.find((item) => item.value === value) || GOAL_COLORS[0];
}

function formatDate(value) {
  const date = dateFromISO(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}>
      <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 900 }}>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

export default function RoutinePlanner({ routines, setRoutines }) {
  const baseData = Array.isArray(routines) ? routines : [];
  const routineItems = baseData.filter((item) => item?.recordType !== "goal");
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [dayNote, setDayNote] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState("gunluk");
  const [quickPriority, setQuickPriority] = useState("orta");
  const [goalForm, setGoalForm] = useState({ title: "", progress: "0", color: "blue", note: "" });
  const [form, setForm] = useState({ title: "", category: "egitim", priority: "orta", date: todayISO(), note: "" });
  const [openPanels, setOpenPanels] = useState({ hero: true, goals: true, add: true, filters: true, months: true, calendar: true, dayNote: true, upcoming: true, categories: true });

  const normalized = useMemo(() => routineItems.map(normalizeRoutine), [routineItems]);
  const goals = useMemo(() => baseData.filter((item) => item?.recordType === "goal").map(normalizeGoal), [baseData]);
  const weeks = useMemo(() => buildWeeks(selectedYear), [selectedYear]);

  const filtered = useMemo(() => normalized.filter((item) => {
    const date = dateFromISO(item.date);
    const monthOk = selectedMonth === "all" || date.getMonth() === Number(selectedMonth);
    const statusOk = statusFilter === "all" || (statusFilter === "done" ? item.done : !item.done);
    const categoryOk = categoryFilter === "all" || item.category === categoryFilter;
    const priorityOk = priorityFilter === "all" || item.priority === priorityFilter;
    const searchOk = !search.trim() || `${item.title} ${item.note}`.toLowerCase().includes(search.toLowerCase());
    return date.getFullYear() === Number(selectedYear) && monthOk && statusOk && categoryOk && priorityOk && searchOk;
  }), [normalized, selectedYear, selectedMonth, statusFilter, categoryFilter, priorityFilter, search]);

  const byDate = useMemo(() => filtered.reduce((map, item) => {
    if (!map[item.date]) map[item.date] = [];
    map[item.date].push(item);
    return map;
  }, {}), [filtered]);

  const allByDate = useMemo(() => normalized.reduce((map, item) => {
    if (!map[item.date]) map[item.date] = [];
    map[item.date].push(item);
    return map;
  }, {}), [normalized]);

  const selectedDateTasks = allByDate[selectedDate] || [];

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((item) => item.done).length;
    return { total, done, pending: total - done, ratio: total ? Math.round((done / total) * 100) : 0 };
  }, [filtered]);

  const goalStats = useMemo(() => {
    const total = goals.length;
    const average = total ? Math.round(goals.reduce((sum, item) => sum + item.progress, 0) / total) : 0;
    const completed = goals.filter((item) => item.progress >= 100).length;
    return { total, average, completed };
  }, [goals]);

  const upcoming = useMemo(() => {
    const today = dateFromISO(todayISO());
    return normalized
      .filter((item) => !item.done && dateFromISO(item.date) >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 10);
  }, [normalized]);

  const togglePanel = (key) => setOpenPanels((current) => ({ ...current, [key]: !current[key] }));

  const addItem = (payload) => {
    setRoutines?.((current) => [{ id: String(Date.now()), done: false, completed: false, ...payload }, ...(Array.isArray(current) ? current : [])]);
  };

  const addRoutine = () => {
    const title = form.title.trim();
    if (!title) return alert("Rutin / iş adı gir.");
    addItem({ title, category: form.category, priority: form.priority, date: form.date || selectedDate || todayISO(), note: form.note.trim() });
    setForm({ title: "", category: form.category, priority: "orta", date: selectedDate || todayISO(), note: "" });
  };

  const addGoal = () => {
    const title = goalForm.title.trim();
    if (!title) return alert("Hedef adı gir. Örn: SQL, Saz, İngilizce");
    addItem({
      recordType: "goal",
      title,
      progress: Math.max(0, Math.min(100, Number(goalForm.progress || 0))),
      color: goalForm.color,
      note: goalForm.note.trim(),
    });
    setGoalForm({ title: "", progress: "0", color: goalForm.color, note: "" });
  };

  const updateGoal = (id, field, value) => {
    setRoutines?.((current) => (Array.isArray(current) ? current : []).map((item) => {
      if (String(item.id) !== String(id)) return item;
      if (field === "progress") return { ...item, progress: Math.max(0, Math.min(100, Number(value || 0))) };
      return { ...item, [field]: value };
    }));
  };

  const deleteGoal = (id) => {
    setRoutines?.((current) => (Array.isArray(current) ? current : []).filter((item) => String(item.id) !== String(id)));
  };

  const addQuickTask = () => {
    const title = quickTitle.trim();
    if (!title) return alert("Bu güne eklenecek iş / not başlığı gir.");
    addItem({ title, category: quickCategory, priority: quickPriority, date: selectedDate, note: "" });
    setQuickTitle("");
  };

  const addDayNote = () => {
    const note = dayNote.trim();
    if (!note) return alert("Not gir.");
    addItem({ title: `Gün Notu - ${formatDate(selectedDate)}`, category: "not", priority: "orta", date: selectedDate, note });
    setDayNote("");
  };

  const selectDay = (dateKey) => {
    setSelectedDate(dateKey);
    setForm((current) => ({ ...current, date: dateKey }));
    setOpenPanels((current) => ({ ...current, dayNote: true }));
  };

  const toggleRoutine = (id) => {
    setRoutines?.((current) => (Array.isArray(current) ? current : []).map((item) => {
      if (String(item.id) !== String(id)) return item;
      const nextDone = !Boolean(item.done || item.completed);
      return { ...item, done: nextDone, completed: nextDone };
    }));
  };

  const deleteRoutine = (id) => setRoutines?.((current) => (Array.isArray(current) ? current : []).filter((item) => String(item.id) !== String(id)));

  const pageGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "22px", alignItems: "start" };
  const gridTwo = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" };
  const gridMonth = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" };
  const gridWeek = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "16px" };

  return (
    <section style={pageGrid}>
      <div>
        <Panel title="🗓️ Renkli 3D Rutin Takvimi" gradient="linear-gradient(135deg, rgba(30,64,175,.88), rgba(88,28,135,.82), rgba(15,23,42,.92))" open={openPanels.hero} onToggle={() => togglePanel("hero")}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 44px)", color: "#f8fafc", letterSpacing: "-0.04em", textShadow: "0 14px 35px rgba(0,0,0,.35)" }}>{selectedYear} Rutin Planı</h2>
              <p style={{ color: "#e0f2fe", maxWidth: "760px", lineHeight: 1.6 }}>Hedeflerini, haftalık rutinlerini ve gün notlarını tek ekranda yönet.</p>
            </div>
            <Field label="Yıl"><Select value={selectedYear} onChange={setSelectedYear} options={[currentYear - 1, currentYear, currentYear + 1].map((year) => ({ value: year, label: String(year) }))} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginTop: "22px" }}>
            <Stat label="Rutin" value={stats.total} gradient="linear-gradient(145deg, rgba(59,130,246,.42), rgba(14,165,233,.18))" />
            <Stat label="Tamamlanan" value={stats.done} gradient="linear-gradient(145deg, rgba(16,185,129,.42), rgba(52,211,153,.18))" />
            <Stat label="Bekleyen" value={stats.pending} gradient="linear-gradient(145deg, rgba(251,191,36,.42), rgba(245,158,11,.18))" />
            <Stat label="Hedef Ort." value={`%${goalStats.average}`} gradient="linear-gradient(145deg, rgba(168,85,247,.42), rgba(236,72,153,.16))" />
          </div>
        </Panel>

        <Panel title="🎯 Hedeflerim" gradient="linear-gradient(145deg, rgba(49,46,129,.88), rgba(8,47,73,.82), rgba(15,23,42,.88))" open={openPanels.goals} onToggle={() => togglePanel("goals")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "14px" }}>
            <Field label="Hedef"><input style={inputStyle} value={goalForm.title} placeholder="Örn: SQL, Saz, İngilizce" onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} /></Field>
            <Field label="İlerleme %"><input style={inputStyle} type="number" min="0" max="100" value={goalForm.progress} onChange={(event) => setGoalForm((current) => ({ ...current, progress: event.target.value }))} /></Field>
            <Field label="Renk"><Select value={goalForm.color} onChange={(value) => setGoalForm((current) => ({ ...current, color: value }))} options={GOAL_COLORS.map((item) => ({ value: item.value, label: item.label }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={goalForm.note} placeholder="Opsiyonel" onChange={(event) => setGoalForm((current) => ({ ...current, note: event.target.value }))} /></Field>
            <button type="button" onClick={addGoal} style={primaryButtonStyle("linear-gradient(135deg, #c4b5fd, #67e8f9, #fef08a)")}>Hedef Ekle</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {goals.length === 0 ? <SmallEmpty text="Henüz hedef eklenmedi. Örn: SQL %10, Saz %5, İngilizce %20." /> : goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} />
            ))}
          </div>
        </Panel>

        <Panel title="➕ Yeni Rutin / İş Ekle" gradient="linear-gradient(145deg, rgba(6,78,59,.88), rgba(15,23,42,.86))" open={openPanels.add} onToggle={() => togglePanel("add")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Başlık"><input style={inputStyle} value={form.title} placeholder="Örn: SQL çalış, spor yap" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field>
            <Field label="Kategori"><Select value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Öncelik"><Select value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Tarih"><input style={inputStyle} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={form.note} placeholder="Opsiyonel" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></Field>
            <button type="button" onClick={addRoutine} style={primaryButtonStyle("linear-gradient(135deg, #fef08a, #34d399, #22d3ee)")}>Ekle</button>
          </div>
        </Panel>

        <Panel title="🔎 Filtreler" gradient="linear-gradient(145deg, rgba(120,53,15,.88), rgba(88,28,135,.70), rgba(15,23,42,.86))" open={openPanels.filters} onToggle={() => togglePanel("filters")}>
          <div style={gridTwo}>
            <Field label="Ay"><Select value={selectedMonth} onChange={setSelectedMonth} options={[{ value: "all", label: "Tüm Aylar" }, ...MONTHS.map((month, index) => ({ value: String(index), label: month }))]} /></Field>
            <Field label="Durum"><Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Tümü" }, { value: "pending", label: "Bekleyen" }, { value: "done", label: "Tamamlanan" }]} /></Field>
            <Field label="Kategori"><Select value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "all", label: "Tüm Kategoriler" }, ...CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Öncelik"><Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "all", label: "Tüm Öncelikler" }, ...PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Arama"><input style={inputStyle} value={search} placeholder="Rutin ara" onChange={(event) => setSearch(event.target.value)} /></Field>
          </div>
        </Panel>

        <Panel title="📅 Aylar" gradient="linear-gradient(145deg, rgba(30,41,59,.90), rgba(49,46,129,.64), rgba(15,23,42,.86))" open={openPanels.months} onToggle={() => togglePanel("months")}>
          <div style={gridMonth}>
            <MonthCard active={selectedMonth === "all"} title="Tüm Yıl" count={filtered.length} onClick={() => setSelectedMonth("all")} gradient="linear-gradient(145deg, rgba(255,255,255,.18), rgba(59,130,246,.16))" />
            {MONTHS.map((month, index) => {
              const count = normalized.filter((item) => {
                const date = dateFromISO(item.date);
                return date.getFullYear() === Number(selectedYear) && date.getMonth() === index;
              }).length;
              return <MonthCard key={month} active={selectedMonth === String(index)} title={month} count={count} onClick={() => setSelectedMonth(String(index))} gradient={MONTH_GRADIENTS[index]} />;
            })}
          </div>
        </Panel>

        <Panel title="📌 Haftalık Takvim" gradient="linear-gradient(145deg, rgba(8,47,73,.88), rgba(15,23,42,.88))" open={openPanels.calendar} onToggle={() => togglePanel("calendar")}>
          <div style={gridWeek}>
            {weeks.filter((week) => selectedMonth === "all" || week.monthIndex === Number(selectedMonth)).map((week) => {
              const weekTasks = week.days.reduce((arr, day) => [...arr, ...(byDate[localISO(day)] || [])], []);
              const selectedInThisWeek = week.days.some((day) => localISO(day) === selectedDate);
              return (
                <div key={week.id} style={{ ...baseGlass, background: MONTH_GRADIENTS[week.monthIndex], borderRadius: "24px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <strong style={{ color: "#f8fafc" }}>{week.monthName}</strong>
                    <span style={{ color: "#dbeafe", fontWeight: 900 }}>{week.number}. Hafta</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginBottom: "12px" }}>
                    {week.days.map((day, index) => {
                      const key = localISO(day);
                      const dayTasks = byDate[key] || [];
                      const isToday = key === todayISO();
                      const isSelected = key === selectedDate;
                      return (
                        <button type="button" key={key} onClick={() => selectDay(key)} style={dayButtonStyle(isSelected, isToday)}>
                          <strong>{DAYS[index]}</strong>
                          <div>{day.getDate()}</div>
                          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "5px" }}>
                            {dayTasks.slice(0, 4).map((task) => <span key={task.id} style={{ width: "7px", height: "7px", borderRadius: "999px", background: categoryInfo(task.category).color }} />)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedInThisWeek ? (
                    <div style={{ ...baseGlass, background: "rgba(2,6,23,.42)", borderRadius: "18px", padding: "12px", marginBottom: "12px" }}>
                      <strong style={{ color: "#f8fafc", display: "block", marginBottom: "10px" }}>⚡ {formatDate(selectedDate)} için hızlı giriş</strong>
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 130px 120px 90px", gap: "8px" }}>
                        <input style={inputStyle} value={quickTitle} placeholder="Bu güne iş / not yaz" onChange={(event) => setQuickTitle(event.target.value)} />
                        <Select value={quickCategory} onChange={setQuickCategory} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} />
                        <Select value={quickPriority} onChange={setQuickPriority} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} />
                        <button type="button" onClick={addQuickTask} style={primaryButtonStyle("linear-gradient(135deg, #bfdbfe, #67e8f9)")}>Ekle</button>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {weekTasks.length === 0 ? <SmallEmpty text="Bu haftaya kayıt yok." /> : weekTasks.slice(0, 6).map((task) => <TaskCard key={task.id} task={task} onToggle={toggleRoutine} onDelete={deleteRoutine} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={`📝 Seçili Gün Notu - ${formatDate(selectedDate)}`} gradient="linear-gradient(145deg, rgba(131,24,67,.88), rgba(15,23,42,.88))" open={openPanels.dayNote} onToggle={() => togglePanel("dayNote")}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 160px", gap: "12px" }}>
            <Field label="Güne Not Ekle"><textarea value={dayNote} placeholder="Bu güne ait notunu yaz..." onChange={(event) => setDayNote(event.target.value)} style={{ ...inputStyle, minHeight: "94px", resize: "vertical" }} /></Field>
            <button type="button" onClick={addDayNote} style={primaryButtonStyle("linear-gradient(135deg, #f9a8d4, #fef08a)")}>Not Ekle</button>
          </div>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedDateTasks.length === 0 ? <SmallEmpty text="Bu güne ait kayıt yok. Takvimden gün seçip not ekleyebilirsin." /> : selectedDateTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleRoutine} onDelete={deleteRoutine} />)}
          </div>
        </Panel>
      </div>

      <aside style={{ minWidth: 0 }}>
        <Panel title="⏰ Yaklaşan İşler" gradient="linear-gradient(145deg, rgba(49,46,129,.88), rgba(15,23,42,.88))" open={openPanels.upcoming} onToggle={() => togglePanel("upcoming")}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {upcoming.length === 0 ? <SmallEmpty text="Yaklaşan iş yok." /> : upcoming.map((task) => <UpcomingCard key={task.id} task={task} />)}
          </div>
        </Panel>
        <Panel title="🎯 Hedef Özeti" gradient="linear-gradient(145deg, rgba(88,28,135,.88), rgba(15,23,42,.88))" open={openPanels.categories} onToggle={() => togglePanel("categories")}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <SmallEmpty text={`Toplam hedef: ${goalStats.total} • Ortalama ilerleme: %${goalStats.average} • Tamamlanan: ${goalStats.completed}`} />
            {goals.slice(0, 5).map((goal) => <GoalMini key={goal.id} goal={goal} />)}
          </div>
        </Panel>
      </aside>
    </section>
  );
}

function Panel({ title, children, gradient, open = true, onToggle }) {
  return (
    <div style={{ ...baseGlass, background: gradient || "linear-gradient(145deg, rgba(15,23,42,.94), rgba(30,41,59,.76))", borderRadius: "26px", padding: "20px", marginBottom: "18px" }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", border: 0, background: "transparent", color: "#f8fafc", padding: 0, marginBottom: open ? "16px" : 0, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
        <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "20px", textShadow: "0 10px 24px rgba(0,0,0,.28)" }}>{title}</h3>
        <span style={{ width: "34px", height: "34px", borderRadius: "12px", display: "grid", placeItems: "center", background: "rgba(255,255,255,.14)", fontWeight: 900 }}>{open ? "−" : "+"}</span>
      </button>
      {open ? children : null}
    </div>
  );
}

function Stat({ label, value, gradient }) {
  return <div style={{ ...baseGlass, padding: "16px", borderRadius: "20px", background: gradient }}><span style={{ display: "block", color: "#dbeafe", fontSize: "12px", fontWeight: 800 }}>{label}</span><strong style={{ display: "block", marginTop: "6px", fontSize: "24px", color: "#f8fafc" }}>{value}</strong></div>;
}

function MonthCard({ active, title, count, onClick, gradient }) {
  return <button type="button" onClick={onClick} style={{ ...baseGlass, background: gradient, borderRadius: "20px", padding: "15px", cursor: "pointer", textAlign: "left", borderColor: active ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.15)", transform: active ? "translateY(-5px) scale(1.02)" : "none" }}><strong style={{ display: "block", color: "#f8fafc", fontSize: "15px" }}>{title}</strong><span style={{ display: "block", color: "#dbeafe", marginTop: "5px", fontSize: "12px" }}>{count} kayıt</span></button>;
}

function GoalCard({ goal, onUpdate, onDelete }) {
  const color = goalColorInfo(goal.color);
  return (
    <div style={{ ...baseGlass, background: color.bg, borderColor: `${color.color}66`, borderRadius: "22px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
        <div>
          <strong style={{ color: "#f8fafc", fontSize: "18px", display: "block" }}>{goal.title}</strong>
          {goal.note ? <span style={{ color: "#cbd5e1", fontSize: "12px", display: "block", marginTop: "4px" }}>{goal.note}</span> : null}
        </div>
        <strong style={{ color: color.color, fontSize: "22px" }}>%{goal.progress}</strong>
      </div>

      <div style={{ height: "14px", borderRadius: "999px", background: "rgba(2,6,23,.45)", marginTop: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ width: `${goal.progress}%`, height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${color.color}, #f8fafc)`, boxShadow: `0 0 18px ${color.color}66` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 82px 80px", gap: "8px", marginTop: "14px", alignItems: "center" }}>
        <input type="range" min="0" max="100" value={goal.progress} onChange={(event) => onUpdate(goal.id, "progress", event.target.value)} />
        <input style={{ ...inputStyle, padding: "9px 10px" }} type="number" min="0" max="100" value={goal.progress} onChange={(event) => onUpdate(goal.id, "progress", event.target.value)} />
        <MiniButton danger onClick={() => onDelete(goal.id)}>Sil</MiniButton>
      </div>
    </div>
  );
}

function GoalMini({ goal }) {
  const color = goalColorInfo(goal.color);
  return <div style={{ padding: "13px", borderRadius: "18px", background: color.bg, border: `1px solid ${color.color}66` }}><strong style={{ color: "#f8fafc", display: "block" }}>{goal.title} • %{goal.progress}</strong><div style={{ height: "8px", borderRadius: "999px", background: "rgba(2,6,23,.45)", marginTop: "8px", overflow: "hidden" }}><div style={{ width: `${goal.progress}%`, height: "100%", background: color.color }} /></div></div>;
}

function TaskCard({ task, onToggle, onDelete }) {
  const category = categoryInfo(task.category);
  const priority = priorityInfo(task.priority);
  return <div style={{ ...baseGlass, background: category.bg, borderColor: `${category.color}66`, borderRadius: "16px", padding: "10px 11px", display: "flex", justifyContent: "space-between", gap: "10px", opacity: task.done ? .58 : 1 }}><div style={{ display: "flex", gap: "9px" }}><span style={{ fontSize: "20px" }}>{category.icon}</span><div><strong style={{ color: "#f8fafc", display: "block", fontSize: "13px" }}>{task.title}</strong><span style={{ color: "#dbeafe", display: "block", fontSize: "11px", marginTop: "3px" }}>{formatDate(task.date)} • {category.label} • {priority.icon} {priority.label}</span>{task.note ? <span style={{ color: "#cbd5e1", display: "block", fontSize: "11px", marginTop: "3px" }}>{task.note}</span> : null}</div></div><div style={{ display: "flex", gap: "6px", alignItems: "center" }}><MiniButton onClick={() => onToggle(task.id)}>{task.done ? "Geri Al" : "Bitti"}</MiniButton><MiniButton danger onClick={() => onDelete(task.id)}>Sil</MiniButton></div></div>;
}

function UpcomingCard({ task }) {
  const category = categoryInfo(task.category);
  const priority = priorityInfo(task.priority);
  return <div style={{ padding: "13px", borderRadius: "18px", background: category.bg, border: `1px solid ${category.color}66`, boxShadow: `0 12px 28px ${category.color}22` }}><strong style={{ color: "#f8fafc", display: "block" }}>{category.icon} {task.title}</strong><span style={{ color: "#dbeafe", fontSize: "12px", marginTop: "5px", display: "block" }}>{formatDate(task.date)} • {category.label} • {priority.icon} {priority.label}</span>{task.note ? <span style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "5px", display: "block" }}>{task.note}</span> : null}</div>;
}

function SmallEmpty({ text }) {
  return <div style={{ padding: "13px", borderRadius: "18px", background: "rgba(2,6,23,.38)", border: "1px solid rgba(255,255,255,.12)", color: "#cbd5e1", fontSize: "12px" }}>{text}</div>;
}

function MiniButton({ children, onClick, danger = false }) {
  return <button type="button" onClick={onClick} style={{ border: danger ? "1px solid rgba(248,113,113,.32)" : "1px solid rgba(255,255,255,.22)", background: danger ? "rgba(127,29,29,.42)" : "rgba(15,23,42,.66)", color: danger ? "#fecaca" : "#f8fafc", borderRadius: "10px", padding: "7px 9px", cursor: "pointer" }}>{children}</button>;
}

function primaryButtonStyle(background) {
  return { border: 0, borderRadius: "16px", padding: "12px 14px", color: "#08111f", fontWeight: 900, cursor: "pointer", background, boxShadow: "0 16px 34px rgba(34,211,238,.22)", alignSelf: "end" };
}

function dayButtonStyle(isSelected, isToday) {
  return {
    minHeight: "52px",
    borderRadius: "14px",
    padding: "6px",
    background: isSelected ? "rgba(255,255,255,.28)" : isToday ? "rgba(255,255,255,.18)" : "rgba(2,6,23,.38)",
    border: isSelected ? "2px solid rgba(255,255,255,.88)" : isToday ? "1px solid rgba(255,255,255,.70)" : "1px solid rgba(255,255,255,.12)",
    color: "#f8fafc",
    fontSize: "11px",
    boxShadow: isSelected ? "0 18px 34px rgba(255,255,255,.18)" : "none",
    cursor: "pointer",
    textAlign: "left",
  };
}

