"use client";

import { useMemo, useState } from "react";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CATEGORIES = [
  { value: "egitim", label: "Eğitim", icon: "🎓", color: "#60a5fa", bg: "linear-gradient(145deg, rgba(37,99,235,.46), rgba(14,165,233,.18))" },
  { value: "is", label: "İş", icon: "💼", color: "#a78bfa", bg: "linear-gradient(145deg, rgba(124,58,237,.46), rgba(168,85,247,.18))" },
  { value: "gunluk", label: "Günlük", icon: "🔅", color: "#34d399", bg: "linear-gradient(145deg, rgba(5,150,105,.42), rgba(16,185,129,.18))" },
  { value: "saglik", label: "Sağlık", icon: "💪", color: "#fb7185", bg: "linear-gradient(145deg, rgba(225,29,72,.42), rgba(251,113,133,.18))" },
  { value: "finans", label: "Finans", icon: "💰", color: "#fbbf24", bg: "linear-gradient(145deg, rgba(217,119,6,.42), rgba(251,191,36,.18))" },
  { value: "kisisel", label: "Kişisel", icon: "✨", color: "#22d3ee", bg: "linear-gradient(145deg, rgba(8,145,178,.42), rgba(34,211,238,.18))" },
  { value: "not", label: "Gün Notu", icon: "📝", color: "#f472b6", bg: "linear-gradient(145deg, rgba(190,24,93,.42), rgba(244,114,182,.18))" },
];

const PRIORITIES = [
  { value: "dusuk", label: "Düşük", icon: "🟢" },
  { value: "orta", label: "Orta", icon: "🟡" },
  { value: "yuksek", label: "Yüksek", icon: "🔴" },
];

const STATUSES = [
  { value: "pending", label: "Devam ediyor", icon: "🔵", color: "#60a5fa", bg: "rgba(96,165,250,.22)" },
  { value: "done", label: "Tamamlandı", icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,.22)" },
  { value: "failed", label: "Tamamlanamadı", icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,.22)" },
];

const GOAL_COLORS = [
  { value: "blue", label: "Mavi", color: "#60a5fa" },
  { value: "purple", label: "Mor", color: "#a78bfa" },
  { value: "green", label: "Yeşil", color: "#34d399" },
  { value: "yellow", label: "Sarı", color: "#fbbf24" },
  { value: "pink", label: "Pembe", color: "#f472b6" },
  { value: "cyan", label: "Camgöbeği", color: "#22d3ee" },
];

const MONTH_COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0891b2", "#65a30d", "#ea580c", "#4f46e5", "#db2777", "#0f766e", "#64748b"];

const glass = {
  border: "1px solid rgba(255,255,255,.14)",
  boxShadow: "0 22px 55px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.10)",
  backdropFilter: "blur(14px)",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(2,6,23,.72)",
  color: "#f8fafc",
  borderRadius: "14px",
  padding: "11px 12px",
  outline: "none",
};

const smallButton = {
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(15,23,42,.72)",
  color: "#f8fafc",
  borderRadius: "9px",
  padding: "7px 9px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "11px",
  minWidth: 0,
};

function pad(value) { return String(value).padStart(2, "0"); }
function localISO(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function todayISO() { return localISO(new Date()); }
function dateFromISO(value) {
  const [year, month, day] = String(value || todayISO()).split("-").map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1, 12, 0, 0, 0);
}
function formatDate(value) { const d = dateFromISO(value); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function categoryInfo(value) { return CATEGORIES.find((item) => item.value === value) || CATEGORIES[2]; }
function priorityInfo(value) { return PRIORITIES.find((item) => item.value === value) || PRIORITIES[1]; }
function statusInfo(value) { return STATUSES.find((item) => item.value === value) || STATUSES[0]; }
function goalColorInfo(value) { return GOAL_COLORS.find((item) => item.value === value) || GOAL_COLORS[0]; }
function daysInMonth(year, monthIndex) { return new Date(Number(year), Number(monthIndex) + 1, 0).getDate(); }

function buildMonthGrid(year, monthIndex) {
  const totalDays = daysInMonth(year, monthIndex);
  const firstDay = new Date(Number(year), Number(monthIndex), 1, 12);
  const mondayBasedStart = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayBasedStart; i += 1) cells.push({ type: "empty", id: `empty-start-${i}` });
  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(Number(year), Number(monthIndex), day, 12);
    cells.push({ type: "day", id: localISO(date), dateKey: localISO(date), day });
  }
  while (cells.length % 7 !== 0) cells.push({ type: "empty", id: `empty-end-${cells.length}` });
  return cells;
}

function normalizeTask(item) {
  const status = item?.status || (item?.failed ? "failed" : item?.done || item?.completed ? "done" : "pending");
  return {
    id: String(item?.id || Date.now() + Math.random()),
    title: item?.title || item?.name || "İsimsiz iş",
    category: item?.category || "gunluk",
    priority: item?.priority || "orta",
    date: item?.date || item?.dueDate || todayISO(),
    note: item?.note || "",
    status,
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

function yearOptions(currentYear) {
  const start = Math.min(2024, currentYear - 2);
  const end = Math.max(2030, currentYear);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function Field({ label, children }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}><span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 900 }}>{label}</span>{children}</label>;
}

function Select({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, ...style }}>
      {options.map((option) => <option key={option.value} value={option.value} style={{ color: "#0f172a", background: "#ffffff" }}>{option.label}</option>)}
    </select>
  );
}

export default function RoutinePlanner({ routines, setRoutines }) {
  const data = Array.isArray(routines) ? routines : [];
  const tasks = data.filter((item) => item?.recordType !== "goal").map(normalizeTask);
  const goals = data.filter((item) => item?.recordType === "goal").map(normalizeGoal);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(String(currentMonth));
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState("gunluk");
  const [quickPriority, setQuickPriority] = useState("orta");
  const [dayNote, setDayNote] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", category: "egitim", priority: "orta", date: todayISO(), note: "" });
  const [goalForm, setGoalForm] = useState({ title: "", progress: "0", color: "blue", note: "" });
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTask, setEditTask] = useState({ title: "", category: "gunluk", priority: "orta", date: todayISO(), note: "" });
  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoal, setEditGoal] = useState({ title: "", progress: "0", color: "blue", note: "" });
  const [openPanels, setOpenPanels] = useState({ hero: true, goals: true, filters: true, add: true, calendar: true, dayNote: true, upcoming: true });

  const monthIndex = Number(month);
  const calendarCells = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const selectedYearIsPast = Number(year) < currentYear;
  const selectedMonthIsPast = Number(year) < currentYear || (Number(year) === currentYear && monthIndex < currentMonth);

  const monthTasks = useMemo(() => tasks.filter((task) => {
    const date = dateFromISO(task.date);
    return date.getFullYear() === Number(year)
      && date.getMonth() === monthIndex
      && (statusFilter === "all" || task.status === statusFilter)
      && (categoryFilter === "all" || task.category === categoryFilter)
      && (priorityFilter === "all" || task.priority === priorityFilter)
      && (!search.trim() || `${task.title} ${task.note}`.toLowerCase().includes(search.toLowerCase()));
  }), [tasks, year, monthIndex, statusFilter, categoryFilter, priorityFilter, search]);

  const byDate = useMemo(() => monthTasks.reduce((map, task) => {
    if (!map[task.date]) map[task.date] = [];
    map[task.date].push(task);
    return map;
  }, {}), [monthTasks]);

  const selectedDateTasks = selectedDate ? tasks.filter((task) => task.date === selectedDate) : [];
  const doneCount = monthTasks.filter((task) => task.status === "done").length;
  const pendingCount = monthTasks.filter((task) => task.status === "pending").length;
  const failedCount = monthTasks.filter((task) => task.status === "failed").length;
  const goalAverage = goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;
  const upcoming = tasks.filter((task) => task.status === "pending" && dateFromISO(task.date) >= dateFromISO(todayISO())).sort((a, b) => a.date.localeCompare(b.date));

  const togglePanel = (key) => setOpenPanels((current) => ({ ...current, [key]: !current[key] }));
  const addItem = (payload) => setRoutines?.((current) => [{ id: String(Date.now()), status: "pending", done: false, completed: false, failed: false, ...payload }, ...(Array.isArray(current) ? current : [])]);
  const updateItem = (id, patch) => setRoutines?.((current) => (Array.isArray(current) ? current : []).map((item) => String(item.id) === String(id) ? { ...item, ...patch } : item));
  const deleteItem = (id) => setRoutines?.((current) => (Array.isArray(current) ? current : []).filter((item) => String(item.id) !== String(id)));

  const selectDay = (dateKey) => {
    setSelectedDate(dateKey);
    setTaskForm((current) => ({ ...current, date: dateKey }));
    setOpenPanels((current) => ({ ...current, dayNote: true }));
  };

  const changeStatus = (id, status) => updateItem(id, { status, done: status === "done", completed: status === "done", failed: status === "failed" });
  const startTaskEdit = (task) => { selectDay(task.date); setEditTaskId(task.id); setEditTask({ title: task.title, category: task.category, priority: task.priority, date: task.date, note: task.note || "" }); };
  const saveTaskEdit = (id) => { const title = editTask.title.trim(); if (!title) return alert("Başlık boş olamaz."); updateItem(id, { ...editTask, title, note: editTask.note.trim() }); setEditTaskId(null); };

  const addTask = () => {
    const title = taskForm.title.trim();
    if (!title) return alert("Rutin / iş adı gir.");
    addItem({ ...taskForm, title, note: taskForm.note.trim(), date: taskForm.date || selectedDate || todayISO() });
    setTaskForm({ title: "", category: taskForm.category, priority: taskForm.priority, date: selectedDate || todayISO(), note: "" });
  };

  const addQuick = () => {
    if (!selectedDate) return alert("Önce takvimden gün seç.");
    const title = quickTitle.trim();
    if (!title) return alert("Başlık gir.");
    addItem({ title, category: quickCategory, priority: quickPriority, date: selectedDate, note: "" });
    setQuickTitle("");
  };

  const addNote = () => {
    if (!selectedDate) return alert("Önce takvimden gün seç.");
    const note = dayNote.trim();
    if (!note) return alert("Not gir.");
    addItem({ title: `Gün Notu - ${formatDate(selectedDate)}`, category: "not", priority: "orta", date: selectedDate, note });
    setDayNote("");
  };

  const addGoal = () => {
    const title = goalForm.title.trim();
    if (!title) return alert("Hedef adı gir.");
    addItem({ recordType: "goal", title, progress: Math.max(0, Math.min(100, Number(goalForm.progress || 0))), color: goalForm.color, note: goalForm.note.trim() });
    setGoalForm({ title: "", progress: "0", color: goalForm.color, note: "" });
  };

  const startGoalEdit = (goal) => { setEditGoalId(goal.id); setEditGoal({ title: goal.title, progress: String(goal.progress), color: goal.color, note: goal.note || "" }); };
  const saveGoalEdit = (id) => { const title = editGoal.title.trim(); if (!title) return alert("Hedef adı boş olamaz."); updateItem(id, { title, progress: Math.max(0, Math.min(100, Number(editGoal.progress || 0))), color: editGoal.color, note: editGoal.note.trim() }); setEditGoalId(null); };

  const goToday = () => {
    setYear(currentYear);
    setMonth(String(currentMonth));
    setSelectedDate(todayISO());
    setTaskForm((current) => ({ ...current, date: todayISO() }));
  };

  const calendarOpacity = selectedYearIsPast ? .66 : selectedMonthIsPast ? .82 : 1;

  return (
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 22, alignItems: "start" }}>
      <div>
        <Panel title="Aylık Rutin Takvimi" open={openPanels.hero} onToggle={() => togglePanel("hero")} gradient="linear-gradient(135deg, rgba(30,64,175,.88), rgba(88,28,135,.82), rgba(15,23,42,.92))">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div><h2 style={{ margin: 0, color: "#fff", fontSize: 34 }}>{MONTHS[monthIndex]} {year}</h2><p style={{ color: "#dbeafe", marginBottom: 0 }}>Gün kutusuna tıklayıp aynı kutu içinden hızlı giriş yapabilirsin.</p></div>
            <button type="button" style={primaryButton("linear-gradient(135deg,#bfdbfe,#67e8f9,#fef08a)")} onClick={goToday}>Bugüne Dön</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 18 }}>
            <Stat label="Aylık Kayıt" value={monthTasks.length} color="#60a5fa" />
            <Stat label="Tamamlandı" value={doneCount} color="#22c55e" />
            <Stat label="Devam Ediyor" value={pendingCount} color="#60a5fa" />
            <Stat label="Tamamlanamadı" value={failedCount} color="#ef4444" />
          </div>
        </Panel>

        <Panel title="Hedeflerim" open={openPanels.goals} onToggle={() => togglePanel("goals")} gradient="linear-gradient(145deg, rgba(49,46,129,.88), rgba(8,47,73,.82), rgba(15,23,42,.88))">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
            <Field label="Hedef"><input style={inputStyle} value={goalForm.title} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="SQL, Saz, İngilizce" /></Field>
            <Field label="İlerleme %"><input style={inputStyle} type="number" min="0" max="100" value={goalForm.progress} onChange={(event) => setGoalForm((current) => ({ ...current, progress: event.target.value }))} /></Field>
            <Field label="Renk"><Select value={goalForm.color} onChange={(value) => setGoalForm((current) => ({ ...current, color: value }))} options={GOAL_COLORS.map((item) => ({ value: item.value, label: item.label }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={goalForm.note} onChange={(event) => setGoalForm((current) => ({ ...current, note: event.target.value }))} placeholder="Opsiyonel" /></Field>
            <button type="button" style={primaryButton("linear-gradient(135deg,#c4b5fd,#67e8f9,#fef08a)")} onClick={addGoal}>Hedef Ekle</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {goals.length === 0 ? <Empty text="Henüz hedef yok." /> : goals.map((goal) => <GoalCard key={goal.id} goal={goal} editId={editGoalId} edit={editGoal} setEdit={setEditGoal} onEdit={startGoalEdit} onSave={saveGoalEdit} onCancel={() => setEditGoalId(null)} onDelete={deleteItem} />)}
          </div>
        </Panel>

        <Panel title="Filtreler" open={openPanels.filters} onToggle={() => togglePanel("filters")} gradient="linear-gradient(145deg, rgba(120,53,15,.88), rgba(88,28,135,.70), rgba(15,23,42,.86))">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Field label="Yıl"><Select value={year} onChange={(value) => setYear(Number(value))} options={yearOptions(currentYear).map((item) => ({ value: item, label: String(item) }))} /></Field>
            <Field label="Ay"><Select value={month} onChange={setMonth} options={MONTHS.map((item, index) => ({ value: String(index), label: item }))} /></Field>
            <Field label="Durum"><Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Tüm Durumlar" }, ...STATUSES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Kategori"><Select value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "all", label: "Tüm Kategoriler" }, ...CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Öncelik"><Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "all", label: "Tüm Öncelikler" }, ...PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))]} /></Field>
            <Field label="Arama"><input style={inputStyle} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Başlık veya not ara" /></Field>
          </div>
        </Panel>

        <Panel title="Yeni Rutin / İş Ekle" open={openPanels.add} onToggle={() => togglePanel("add")} gradient="linear-gradient(145deg, rgba(6,78,59,.88), rgba(15,23,42,.86))">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Field label="Başlık"><input style={inputStyle} value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} /></Field>
            <Field label="Kategori"><Select value={taskForm.category} onChange={(value) => setTaskForm((current) => ({ ...current, category: value }))} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Öncelik"><Select value={taskForm.priority} onChange={(value) => setTaskForm((current) => ({ ...current, priority: value }))} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field>
            <Field label="Tarih"><input style={inputStyle} type="date" value={taskForm.date} onChange={(event) => setTaskForm((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Not"><input style={inputStyle} value={taskForm.note} onChange={(event) => setTaskForm((current) => ({ ...current, note: event.target.value }))} /></Field>
            <button type="button" style={primaryButton("linear-gradient(135deg,#fef08a,#34d399,#22d3ee)")} onClick={addTask}>Ekle</button>
          </div>
        </Panel>

        <Panel title={`${MONTHS[monthIndex]} ${year} Takvimi`} open={openPanels.calendar} onToggle={() => togglePanel("calendar")} gradient="linear-gradient(145deg, rgba(8,47,73,.90), rgba(15,23,42,.90))">
          <div style={{ display: "grid", gridTemplateColumns: "180px 180px 130px", gap: 10, marginBottom: 14, alignItems: "end" }}>
            <Field label="Takvim Yılı"><Select value={year} onChange={(value) => setYear(Number(value))} options={yearOptions(currentYear).map((item) => ({ value: item, label: String(item) }))} /></Field>
            <Field label="Takvim Ayı"><Select value={month} onChange={setMonth} options={MONTHS.map((item, index) => ({ value: String(index), label: item }))} /></Field>
            <button type="button" style={primaryButton("linear-gradient(135deg,#bfdbfe,#67e8f9,#fef08a)")} onClick={goToday}>Bugüne Dön</button>
          </div>

          <div style={{ opacity: calendarOpacity, transition: "opacity .2s ease" }}>
            {selectedYearIsPast ? <Notice text="Geçmiş yıl görüntüleniyor. Takvim bilinçli olarak hafif soluk gösterilir." /> : selectedMonthIsPast ? <Notice text="Geçmiş ay görüntüleniyor. Takvim hafif soluk gösterilir." /> : null}
            <div style={{ ...glass, borderRadius: 24, overflow: "hidden", background: `linear-gradient(145deg, ${MONTH_COLORS[monthIndex]}30, rgba(2,6,23,.62))` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", background: "rgba(255,255,255,.08)", borderBottom: "1px solid rgba(255,255,255,.14)" }}>
                {DAYS.map((day, index) => <div key={day} style={{ padding: "12px 10px", color: index >= 5 ? "#fca5a5" : "#dbeafe", fontWeight: 950, fontSize: 12, textAlign: "center", borderRight: index === 6 ? 0 : "1px solid rgba(255,255,255,.10)" }}>{day}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {calendarCells.map((cell, index) => cell.type === "empty" ? <div key={cell.id} style={{ minHeight: 166, borderRight: index % 7 === 6 ? 0 : "1px solid rgba(255,255,255,.08)", borderBottom: "1px solid rgba(255,255,255,.08)", background: "rgba(2,6,23,.20)" }} /> : (
                  <DayCell key={cell.dateKey} cell={cell} tasks={byDate[cell.dateKey] || []} isToday={cell.dateKey === todayISO()} isSelected={cell.dateKey === selectedDate} onSelect={selectDay} onStatus={changeStatus} onEdit={startTaskEdit} quickTitle={quickTitle} setQuickTitle={setQuickTitle} addQuick={addQuick} borderRight={index % 7 === 6 ? 0 : "1px solid rgba(255,255,255,.08)"} />
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {selectedDate ? <Panel title={`Seçili Gün - ${formatDate(selectedDate)}`} open={openPanels.dayNote} onToggle={() => togglePanel("dayNote")} gradient="linear-gradient(145deg, rgba(131,24,67,.88), rgba(15,23,42,.88))">
          <QuickEntry selectedDate={selectedDate} quickTitle={quickTitle} setQuickTitle={setQuickTitle} quickCategory={quickCategory} setQuickCategory={setQuickCategory} quickPriority={quickPriority} setQuickPriority={setQuickPriority} addQuick={addQuick} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 160px", gap: 12, marginBottom: 14 }}>
            <Field label="Güne Not Ekle"><textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Bu güne özel not yaz" /></Field>
            <button type="button" style={primaryButton("linear-gradient(135deg,#f9a8d4,#fef08a)")} onClick={addNote}>Not Kaydet</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedDateTasks.length === 0 ? <Empty text="Bu güne ait kayıt yok." /> : selectedDateTasks.map((task) => <TaskCard key={task.id} task={task} editId={editTaskId} edit={editTask} setEdit={setEditTask} onEdit={startTaskEdit} onSave={saveTaskEdit} onCancel={() => setEditTaskId(null)} onStatus={changeStatus} onDelete={deleteItem} />)}
          </div>
        </Panel> : null}
      </div>

      <aside style={{ position: "sticky", top: 18, maxHeight: "calc(100vh - 24px)", overflowY: "auto", paddingRight: 6 }}>
        <Panel title={`Yaklaşan İşler (${upcoming.length})`} open={openPanels.upcoming} onToggle={() => togglePanel("upcoming")} gradient="linear-gradient(145deg, rgba(49,46,129,.88), rgba(15,23,42,.88))">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.length ? upcoming.map((task) => <SmallTask key={task.id} task={task} onStatus={changeStatus} onEdit={startTaskEdit} />) : <Empty text="Yaklaşan iş yok." />}
          </div>
        </Panel>
      </aside>
    </section>
  );
}

function DayCell({ cell, tasks, isToday, isSelected, onSelect, onStatus, onEdit, quickTitle, setQuickTitle, addQuick, borderRight }) {
  const bg = isToday ? "linear-gradient(145deg, rgba(250,204,21,.38), rgba(34,211,238,.22), rgba(15,23,42,.80))" : isSelected ? "linear-gradient(145deg, rgba(255,255,255,.22), rgba(96,165,250,.16), rgba(15,23,42,.78))" : "rgba(2,6,23,.34)";
  return (
    <div onClick={() => onSelect(cell.dateKey)} style={{ minHeight: 166, padding: 8, background: bg, borderRight, borderBottom: "1px solid rgba(255,255,255,.08)", cursor: "pointer", outline: isSelected ? "2px solid rgba(255,255,255,.75)" : isToday ? "2px solid rgba(250,204,21,.86)" : "none", outlineOffset: -2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <strong style={{ color: isToday ? "#fef9c3" : "#fff", fontSize: 18, lineHeight: 1 }}>{cell.day}</strong>
        {isToday ? <span style={{ color: "#111827", background: "#facc15", borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 950 }}>BUGÜN</span> : null}
      </div>
      {isSelected ? <div onClick={(event) => event.stopPropagation()} style={{ display: "grid", gridTemplateColumns: "1fr 48px", gap: 5, marginBottom: 7 }}><input style={{ ...inputStyle, padding: "7px 8px", borderRadius: 10, fontSize: 11 }} value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Bu güne yaz" /><button type="button" style={{ ...smallButton, padding: "6px 5px", fontSize: 10 }} onClick={addQuick}>Ekle</button></div> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isSelected ? 88 : 120, overflowY: "auto", paddingRight: 2 }}>
        {tasks.length === 0 ? <span style={{ color: "#94a3b8", fontSize: 11 }}>Kayıt yok</span> : tasks.map((task) => <CalendarTask key={task.id} task={task} onStatus={onStatus} onEdit={onEdit} />)}
      </div>
    </div>
  );
}

function CalendarTask({ task, onStatus, onEdit }) {
  const category = categoryInfo(task.category);
  const status = statusInfo(task.status);
  return <div onClick={(event) => event.stopPropagation()} style={{ background: category.bg, border: `1px solid ${category.color}66`, borderRadius: 12, padding: 7, boxShadow: "0 8px 16px rgba(0,0,0,.18)" }}><div style={{ display: "flex", gap: 5, alignItems: "flex-start" }}><span>{category.icon}</span><strong style={{ color: "#fff", fontSize: 11, lineHeight: 1.25, wordBreak: "break-word", flex: 1 }}>{task.title}</strong></div>{task.note ? <div style={{ color: "#dbeafe", fontSize: 10, lineHeight: 1.25, marginTop: 4, wordBreak: "break-word" }}>{task.note}</div> : null}<div style={{ display: "grid", gridTemplateColumns: "1fr 54px", gap: 5, marginTop: 6 }}><select value={task.status || "pending"} onChange={(event) => onStatus(task.id, event.target.value)} style={{ ...smallButton, width: "100%", fontSize: 10, padding: "5px 4px", borderColor: `${status.color}66`, background: status.bg, color: "#fff" }}>{STATUSES.map((item) => <option key={item.value} value={item.value} style={{ color: "#0f172a", background: "#ffffff" }}>{item.icon} {item.label}</option>)}</select><button type="button" style={{ ...smallButton, fontSize: 10, padding: "5px 4px" }} onClick={() => onEdit(task)}>Düzenle</button></div></div>;
}

function Panel({ title, children, open, onToggle, gradient }) {
  return <div style={{ ...glass, background: gradient, borderRadius: 26, padding: 20, marginBottom: 18 }}><button type="button" onClick={onToggle} style={{ width: "100%", border: 0, background: "transparent", color: "#fff", padding: 0, marginBottom: open ? 16 : 0, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}><h3 style={{ margin: 0, fontSize: 20 }}>{title}</h3><span style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,255,255,.14)", fontWeight: 900 }}>{open ? "−" : "+"}</span></button>{open ? children : null}</div>;
}
function Stat({ label, value, color }) { return <div style={{ ...glass, background: `${color}33`, borderRadius: 20, padding: 16 }}><span style={{ color: "#dbeafe", fontSize: 12, fontWeight: 800 }}>{label}</span><strong style={{ display: "block", color: "#fff", fontSize: 24, marginTop: 6 }}>{value}</strong></div>; }
function Notice({ text }) { return <div style={{ marginBottom: 12, padding: 12, borderRadius: 16, background: "rgba(251,191,36,.13)", border: "1px solid rgba(251,191,36,.35)", color: "#fef3c7", fontSize: 12, fontWeight: 800 }}>{text}</div>; }
function Empty({ text }) { return <div style={{ padding: 13, borderRadius: 18, background: "rgba(2,6,23,.38)", border: "1px solid rgba(255,255,255,.12)", color: "#cbd5e1", fontSize: 12 }}>{text}</div>; }
function primaryButton(background) { return { border: 0, borderRadius: 16, padding: "12px 14px", color: "#08111f", fontWeight: 900, cursor: "pointer", background, alignSelf: "end" }; }

function QuickEntry({ selectedDate, quickTitle, setQuickTitle, quickCategory, setQuickCategory, quickPriority, setQuickPriority, addQuick }) {
  return <div style={{ marginBottom: 12 }}><strong style={{ color: "#fff", display: "block", marginBottom: 10 }}>Hızlı giriş - {formatDate(selectedDate)}</strong><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 140px 130px 95px", gap: 8 }}><input style={inputStyle} value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Bu güne iş / not yaz" /><Select value={quickCategory} onChange={setQuickCategory} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /><Select value={quickPriority} onChange={setQuickPriority} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /><button type="button" style={primaryButton("linear-gradient(135deg,#bfdbfe,#67e8f9)")} onClick={addQuick}>Ekle</button></div></div>;
}

function GoalCard({ goal, editId, edit, setEdit, onEdit, onSave, onCancel, onDelete }) {
  const color = goalColorInfo(goal.color);
  const isEdit = String(editId || "") === String(goal.id);
  if (isEdit) return <div style={{ ...glass, background: `${color.color}22`, borderColor: `${color.color}66`, borderRadius: 22, padding: 16 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}><Field label="Hedef"><input style={inputStyle} value={edit.title} onChange={(event) => setEdit((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="İlerleme %"><input style={inputStyle} type="number" min="0" max="100" value={edit.progress} onChange={(event) => setEdit((current) => ({ ...current, progress: event.target.value }))} /></Field><Field label="Renk"><Select value={edit.color} onChange={(value) => setEdit((current) => ({ ...current, color: value }))} options={GOAL_COLORS.map((item) => ({ value: item.value, label: item.label }))} /></Field><Field label="Not"><input style={inputStyle} value={edit.note} onChange={(event) => setEdit((current) => ({ ...current, note: event.target.value }))} /></Field></div><div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}><button type="button" style={smallButton} onClick={() => onSave(goal.id)}>Kaydet</button><button type="button" style={smallButton} onClick={onCancel}>Vazgeç</button><button type="button" style={{ ...smallButton, color: "#fecaca" }} onClick={() => onDelete(goal.id)}>Sil</button></div></div>;
  return <div style={{ ...glass, background: `${color.color}22`, borderColor: `${color.color}66`, borderRadius: 22, padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div style={{ minWidth: 0 }}><strong style={{ color: "#fff", fontSize: 18, wordBreak: "break-word" }}>{goal.title}</strong>{goal.note ? <span style={{ display: "block", color: "#cbd5e1", fontSize: 12, marginTop: 5, wordBreak: "break-word" }}>{goal.note}</span> : null}</div><strong style={{ color: color.color, fontSize: 22, flex: "0 0 auto" }}>%{goal.progress}</strong></div><div style={{ height: 14, borderRadius: 99, background: "rgba(2,6,23,.45)", marginTop: 14, overflow: "hidden" }}><div style={{ width: `${goal.progress}%`, height: "100%", background: `linear-gradient(90deg,${color.color},#fff)` }} /></div><div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 14 }}><input type="range" min="0" max="100" value={goal.progress} disabled readOnly /><div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 8 }}><input style={{ ...inputStyle, padding: "8px", textAlign: "center" }} value={goal.progress} readOnly /><button type="button" style={smallButton} onClick={() => onEdit(goal)}>Düzenle</button><button type="button" style={{ ...smallButton, color: "#fecaca" }} onClick={() => onDelete(goal.id)}>Sil</button></div></div></div>;
}

function TaskCard({ task, editId, edit, setEdit, onEdit, onSave, onCancel, onStatus, onDelete }) {
  const category = categoryInfo(task.category); const priority = priorityInfo(task.priority); const status = statusInfo(task.status); const isEdit = String(editId || "") === String(task.id);
  if (isEdit) return <div style={{ ...glass, background: category.bg, borderColor: `${category.color}66`, borderRadius: 18, padding: 12 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}><Field label="Başlık"><input style={inputStyle} value={edit.title} onChange={(event) => setEdit((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="Kategori"><Select value={edit.category} onChange={(value) => setEdit((current) => ({ ...current, category: value }))} options={CATEGORIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field><Field label="Öncelik"><Select value={edit.priority} onChange={(value) => setEdit((current) => ({ ...current, priority: value }))} options={PRIORITIES.map((item) => ({ value: item.value, label: `${item.icon} ${item.label}` }))} /></Field><Field label="Tarih"><input style={inputStyle} type="date" value={edit.date} onChange={(event) => setEdit((current) => ({ ...current, date: event.target.value }))} /></Field><Field label="Not"><textarea style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} value={edit.note} onChange={(event) => setEdit((current) => ({ ...current, note: event.target.value }))} /></Field></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}><button type="button" style={smallButton} onClick={() => onSave(task.id)}>Kaydet</button><button type="button" style={smallButton} onClick={onCancel}>Vazgeç</button><button type="button" style={{ ...smallButton, color: "#fecaca" }} onClick={() => onDelete(task.id)}>Sil</button></div></div>;
  return <div style={{ ...glass, background: category.bg, borderColor: `${category.color}66`, borderRadius: 18, padding: 12, opacity: task.status === "done" ? .82 : task.status === "failed" ? .70 : 1 }}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><div style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: status.bg, color: status.color, flex: "0 0 auto" }}>{status.icon}</div><div style={{ flex: 1, minWidth: 0 }}><strong style={{ color: "#fff", fontSize: 14, lineHeight: 1.35, wordBreak: "break-word" }}>{task.title}</strong><span style={{ display: "inline-flex", marginTop: 7, padding: "5px 9px", borderRadius: 99, background: "rgba(255,255,255,.14)", color: "#fff", fontSize: 11, fontWeight: 800, flexWrap: "wrap" }}>📅 {formatDate(task.date)} • {category.icon} {category.label} • {priority.icon} {priority.label}</span>{task.note ? <div style={{ color: "#fff", marginTop: 8, fontSize: 12, wordBreak: "break-word" }}>{task.note}</div> : null}</div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px", gap: 7, marginTop: 11 }}><select value={task.status || "pending"} onChange={(event) => onStatus(task.id, event.target.value)} style={{ ...smallButton, width: "100%", borderColor: `${status.color}66`, background: status.bg }}>{STATUSES.map((item) => <option key={item.value} value={item.value} style={{ color: "#0f172a", background: "#ffffff" }}>{item.icon} {item.label}</option>)}</select><button type="button" style={smallButton} onClick={() => onEdit(task)}>Düzenle</button><button type="button" style={{ ...smallButton, color: "#fecaca" }} onClick={() => onDelete(task.id)}>Sil</button></div></div>;
}

function SmallTask({ task, onStatus, onEdit }) {
  const category = categoryInfo(task.category); const priority = priorityInfo(task.priority); const status = statusInfo(task.status);
  return <div style={{ padding: 13, borderRadius: 18, background: category.bg, border: `1px solid ${category.color}66` }}><strong style={{ color: "#fff", wordBreak: "break-word" }}>{category.icon} {task.title}</strong><span style={{ display: "block", color: "#dbeafe", fontSize: 12, marginTop: 5 }}>{formatDate(task.date)} • {category.label} • {priority.icon} {priority.label}</span>{task.note ? <div style={{ marginTop: 7, color: "#fff", fontSize: 12, lineHeight: 1.35, background: "rgba(2,6,23,.25)", borderRadius: 10, padding: "7px 8px", wordBreak: "break-word" }}>{task.note}</div> : null}<div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 7, marginTop: 9 }}><select value={task.status || "pending"} onChange={(event) => onStatus(task.id, event.target.value)} style={{ ...smallButton, width: "100%", borderColor: `${status.color}66`, background: status.bg }}>{STATUSES.map((item) => <option key={item.value} value={item.value} style={{ color: "#0f172a", background: "#ffffff" }}>{item.icon} {item.label}</option>)}</select><button type="button" style={smallButton} onClick={() => onEdit(task)}>Düzenle</button></div></div>;
}

