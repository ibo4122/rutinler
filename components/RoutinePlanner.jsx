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

const PRIORITIES = [
  { value: "dusuk", label: "Düşük", icon: "🟢" },
  { value: "orta", label: "Orta", icon: "🟡" },
  { value: "yuksek", label: "Yüksek", icon: "🔴" },
];

const MONTH_GRADIENTS = [
  "linear-gradient(145deg, rgba(59,130,246,.35), rgba(14,165,233,.12))",
  "linear-gradient(145deg, rgba(168,85,247,.35), rgba(99,102,241,.12))",
  "linear-gradient(145deg, rgba(16,185,129,.35), rgba(20,184,166,.12))",
  "linear-gradient(145deg, rgba(251,191,36,.35), rgba(245,158,11,.12))",
  "linear-gradient(145deg, rgba(244,63,94,.35), rgba(251,113,133,.12))",
  "linear-gradient(145deg, rgba(34,211,238,.35), rgba(59,130,246,.12))",
  "linear-gradient(145deg, rgba(132,204,22,.35), rgba(16,185,129,.12))",
  "linear-gradient(145deg, rgba(249,115,22,.35), rgba(251,191,36,.12))",
  "linear-gradient(145deg, rgba(99,102,241,.35), rgba(168,85,247,.12))",
  "linear-gradient(145deg, rgba(236,72,153,.35), rgba(244,63,94,.12))",
  "linear-gradient(145deg, rgba(20,184,166,.35), rgba(34,211,238,.12))",
  "linear-gradient(145deg, rgba(148,163,184,.34), rgba(96,165,250,.12))",
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
      <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 900 }}>{label}</span>
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
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [dayNote, setDayNote] = useState("");
  const [form, setForm] = useState({ title: "", category: "egitim", priority: "orta", date: todayISO(), note: "" });
  const [openPanels, setOpenPanels] = useState({
    hero: true,
    add: true,
    filters: true,
    months: true,
    calendar: true,
    dayNote: true,
    upcoming: true,
    categories: true,
  });

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

  const allByDate = useMemo(() => {
    return normalized.reduce((map, item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
      return map;
    }, {});
  }, [normalized]);

  const selectedDateTasks = allByDate[selectedDate] || [];

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

  const togglePanel = (key) => {
    setOpenPanels((current) => ({ ...current, [key]: !current[key] }));
  };

  const addRoutine = () => {
    const title = form.title.trim();
    if (!title) return alert("Rutin / iş adı gir.");

    const next = {
      id: String(Date.now()),
      title,
      category: form.category,
      priority: form.priority,
      date: form.date || selectedDate || todayISO(),
      note: form.note.trim(),
      done: false,
      completed: false,
    };

    setRoutines?.((current) => [next, ...(Array.isArray(current) ? current : [])]);
    setForm({ title: "", category: form.category, priority: "orta", date: selectedDate || todayISO(), note: "" });
  };

  const addDayNote = () => {
    const note = dayNote.trim();
    if (!note) return alert("Not gir.");

    const next = {
      id: String(Date.now()),
      title: `Gün Notu - ${formatDate(selectedDate)}`,
      category: "not",
      priority: "orta",
      date: selectedDate || todayISO(),
      note,
      done: false,
      completed: false,
    };

    setRoutines?.((current) => [next, ...(Array.isArray(current) ? current : [])]);
    setDayNote("");
  };

  const selectDay = (dateKey) => {
    setSelectedDate(dateKey);
    setForm((current) => ({ ...current, date: dateKey }));
    setOpenPanels((current) => ({ ...current, dayNote: true }));
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
              <p style={{ color: "#e0f2fe", maxWidth: "760px", lineHeight: 1.6 }}>Ay, hafta, kategori, öncelik, gün notu ve yaklaşan iş yönetimi.</p>
            </div>
            <Field label="Yıl">
              <Select value={selectedYear} onChange={setSelectedYear} options={[currentYear - 1, currentYear, currentYear + 1].map((year) => ({ value: year, label: String(year) }))} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginTop: "22px" }}>
            <Stat label="Toplam" value={stats.total} gradient="linear-gradient(145deg, rgba(59,130,246,.42), rgba(14,165,233,.18))" />
            <Stat label="Tamamlanan" value={stats.done} gradient="linear-gradient(145deg, rgba(16,185,129,.42), rgba(52,211,153,.18))" />
            <Stat label="Bekleyen" value={stats.pending} gradient="linear-gradient(145deg, rgba(251,191,36,.42), rgba(245,158,11,.18))" />
            <Stat label="Başarı" value={`%${stats.ratio}`} gradient="linear-gradient(145deg, rgba(168,85,247,.42), rgba(236,72,153,.16))" />
          </div>
        </Panel>

        <Panel title="➕ Yeni Rutin / İş Ekle" gradient="linear-gradient(145deg, rgba(6,78,59,.88), rgba(15,23,42,.86))" open={openPanels.add} onToggle={() => togglePanel("add")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Başlık"><input style={inputStyle} value={form.title} placeholder="Örn: SQL çalış, spor yap" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field>
            <Field label="Kategori"><Select value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Öncelik"><Select value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Tarih"><input style={inputStyle} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={form.note} placeholder="Opsiyonel" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></Field>
            <button type="button" onClick={addRoutine} style={{ border: 0, borderRadius: "16px", padding: "14px 18px", color: "#08111f", fontWeight: 900, cursor: "pointer", background: "linear-gradient(135deg, #fef08a, #34d399, #22d3ee)", boxShadow: "0 16px 34px rgba(34,211,238,.26)", alignSelf: "end" }}>Ekle</button>
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
              const weekTasks = week.days.reduce((arr, day) => [...arr, ...(byDate[toISO(day)] || [])], []);
              return (
                <div key={week.id} style={{ ...baseGlass, background: MONTH_GRADIENTS[week.monthIndex], borderRadius: "24px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <strong style={{ color: "#f8fafc" }}>{week.monthName}</strong>
                    <span style={{ color: "#dbeafe", fontWeight: 900 }}>{week.number}. Hafta</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginBottom: "12px" }}>
                    {week.days.map((day, index) => {
                      const key = toISO(day);
                      const dayTasks = byDate[key] || [];
                      const isToday = key === todayISO();
                      const isSelected = key === selectedDate;
                      return (
                        <button type="button" key={key} onClick={() => selectDay(key)} style={{ minHeight: "52px", borderRadius: "14px", padding: "6px", background: isSelected ? "rgba(255,255,255,.28)" : isToday ? "rgba(255,255,255,.18)" : "rgba(2,6,23,.38)", border: isSelected ? "2px solid rgba(255,255,255,.88)" : isToday ? "1px solid rgba(255,255,255,.70)" : "1px solid rgba(255,255,255,.12)", color: "#f8fafc", fontSize: "11px", boxShadow: isSelected ? "0 18px 34px rgba(255,255,255,.18)" : "none", cursor: "pointer", textAlign: "left" }}>
                          <strong>{DAYS[index]}</strong>
                          <div>{day.getDate()}</div>
                          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "5px" }}>
                            {dayTasks.slice(0, 4).map((task) => <span key={task.id} style={{ width: "7px", height: "7px", borderRadius: "999px", background: categoryInfo(task.category).color }} />)}
                          </div>
                        </button>
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
        </Panel>

        <Panel title={`📝 Seçili Gün Notu - ${formatDate(selectedDate)}`} gradient="linear-gradient(145deg, rgba(131,24,67,.88), rgba(15,23,42,.88))" open={openPanels.dayNote} onToggle={() => togglePanel("dayNote")}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 160px", gap: "12px" }}>
            <Field label="Güne Not Ekle">
              <textarea value={dayNote} placeholder="Bu güne ait notunu yaz..." onChange={(event) => setDayNote(event.target.value)} style={{ ...inputStyle, minHeight: "94px", resize: "vertical" }} />
            </Field>
            <button type="button" onClick={addDayNote} style={{ border: 0, borderRadius: "16px", padding: "14px 18px", color: "#08111f", fontWeight: 900, cursor: "pointer", background: "linear-gradient(135deg, #f9a8d4, #fef08a)", boxShadow: "0 16px 34px rgba(244,114,182,.24)", alignSelf: "end" }}>Not Ekle</button>
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

        <Panel title="🎯 Kategori Görselleri" gradient="linear-gradient(145deg, rgba(8,47,73,.88), rgba(15,23,42,.88))" open={openPanels.categories} onToggle={() => togglePanel("categories")}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {CATEGORIES.map((category) => {
              const count = filtered.filter((item) => item.category === category.value).length;
              return <div key={category.value} style={{ padding: "13px", borderRadius: "18px", background: category.bg, border: `1px solid ${category.color}66`, boxShadow: `0 12px 28px ${category.color}22` }}><strong style={{ color: "#f8fafc" }}>{category.icon} {category.label}</strong><span style={{ display: "block", color: "#cbd5e1", fontSize: "12px", marginTop: "5px" }}>{count} kayıt</span></div>;
            })}
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

