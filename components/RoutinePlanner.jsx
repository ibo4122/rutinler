use client";

import { useMemo, useState } from "react";

const dayNames = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const routineTypes = [
  { value: "work", label: "Günlük İş" },
  { value: "education", label: "Eğitim" },
  { value: "personal", label: "Kişisel" },
const WEEK_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const ROUTINE_TYPES = [
  { value: "is", label: "İş", className: "routineTypeWork" },
  { value: "egitim", label: "Eğitim", className: "routineTypeStudy" },
  { value: "spor", label: "Spor", className: "routineTypeSport" },
  { value: "finans", label: "Finans", className: "routineTypeFinance" },
  { value: "kisisel", label: "Kişisel", className: "routineTypePersonal" },
];

const priorities = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
const PRIORITIES = [
  { value: "dusuk", label: "Düşük" },
  { value: "orta", label: "Orta" },
  { value: "yuksek", label: "Yüksek" },
];

const emptyForm = {
  title: "",
  type: "is",
  priority: "orta",
  date: "",
  time: "",
  note: "",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getISOWeek(date) {
function getMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const days = [];

  const mondayBasedStart = (first.getDay() + 6) % 7;
  for (let i = 0; i < mondayBasedStart; i += 1) {
    days.push({ empty: true, id: `empty-start-${i}` });
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = new Date(year, monthIndex, day);
    days.push({
      empty: false,
      id: toISODate(date),
      date,
      day,
      iso: toISODate(date),
      week: getWeekOfYear(date),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ empty: true, id: `empty-end-${days.length}` });
  }

  return days;
}

function getWeekOfYear(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
}

function getWeeksInYear(year) {
  const lastDay = new Date(year, 11, 31);
  const week = getISOWeek(lastDay);
  return week === 1 ? 52 : week;
}

function getMondayOfISOWeek(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay() || 7;
  const monday = new Date(simple);
  monday.setDate(simple.getDate() - dayOfWeek + 1);
  return monday;
}

function formatDate(dateText) {
  if (!dateText) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateText));
}

function isSameDate(a, b) {
  return a && b && a === b;
}

function getTodayText() {
  return toDateInputValue(new Date());
function getTypeMeta(type) {
  return ROUTINE_TYPES.find((item) => item.value === type) || ROUTINE_TYPES[0];
}

function sortByDate(items) {
  return [...items].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function typeLabel(type) {
  return routineTypes.find((item) => item.value === type)?.label || "İş";
}

function priorityLabel(priority) {
  return priorities.find((item) => item.value === priority)?.label || "Orta";
function getUpcomingItems(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [...items]
    .filter((item) => item.date)
    .map((item) => ({ ...item, dateObject: new Date(`${item.date}T00:00:00`) }))
    .filter((item) => item.dateObject >= today)
    .sort((a, b) => a.dateObject - b.dateObject)
    .slice(0, 8);
}

export default function RoutinePlanner({ routines = [], setRoutines }) {
  const today = getTodayText();
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(now));
  const [form, setForm] = useState({
    title: "",
    type: "work",
    priority: "medium",
    date: today,
    note: "",
  });

  const weeksInSelectedYear = getWeeksInYear(Number(selectedYear));

  const weekDays = useMemo(() => {
    const monday = getMondayOfISOWeek(Number(selectedYear), Number(selectedWeek));
    return dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        date,
        dateText: toDateInputValue(date),
      };
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedType, setSelectedType] = useState("tum");
  const [form, setForm] = useState({ ...emptyForm, date: toISODate(today) });
  const [editingId, setEditingId] = useState(null);

  const monthDays = useMemo(() => getMonthDays(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const filteredRoutines = useMemo(() => {
    return (routines || []).filter((item) => {
      if (!item.date) return false;
      const date = new Date(`${item.date}T00:00:00`);
      const sameMonth = date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
      const sameType = selectedType === "tum" || item.type === selectedType;
      return sameMonth && sameType;
    });
  }, [selectedYear, selectedWeek]);
  }, [routines, selectedYear, selectedMonth, selectedType]);

  const weekStart = weekDays[0]?.dateText;
  const weekEnd = weekDays[6]?.dateText;
  const upcomingItems = useMemo(() => getUpcomingItems(routines || []), [routines]);

  const selectedWeekTasks = useMemo(() => {
    return routines.filter((item) => item.date >= weekStart && item.date <= weekEnd);
  }, [routines, weekStart, weekEnd]);
  const monthStats = useMemo(() => {
    const total = filteredRoutines.length;
    const completed = filteredRoutines.filter((item) => item.status === "done").length;
    const high = filteredRoutines.filter((item) => item.priority === "yuksek").length;
    return { total, completed, high };
  }, [filteredRoutines]);

  const upcoming = useMemo(() => {
    const pending = routines.filter((item) => item.status !== "done");
    const todayItems = pending.filter((item) => isSameDate(item.date, today));
    const weekItems = pending.filter((item) => item.date >= today && item.date <= weekEnd && item.date !== today);
    const overdueItems = pending.filter((item) => item.date < today);
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    return {
      today: sortByDate(todayItems),
      week: sortByDate(weekItems),
      overdue: sortByDate(overdueItems),
    };
  }, [routines, today, weekEnd]);

  const addRoutine = () => {
    const title = form.title.trim();
    if (!title) return alert("İş / eğitim başlığı gir.");
  const saveRoutine = () => {
    if (!form.title.trim()) return alert("Rutin / iş başlığı gir.");
    if (!form.date) return alert("Tarih seç.");

    const date = new Date(`${form.date}T00:00:00`);
    const payload = {
      id: String(Date.now()),
      title,
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      date: form.date,
      time: form.time,
      note: form.note.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      status: form.status || "open",
      month: date.getMonth(),
      year: date.getFullYear(),
      week: getWeekOfYear(date),
    };

    setRoutines((current) => [payload, ...current]);
    setForm((current) => ({ ...current, title: "", note: "" }));
    if (editingId) {
      setRoutines((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setEditingId(null);
      setForm({ ...emptyForm, date: toISODate(today) });
      return;
    }

    setRoutines((current) => [{ id: String(Date.now()), ...payload }, ...(current || [])]);
    setForm({ ...emptyForm, date: toISODate(today) });
  };

  const toggleStatus = (id) => {
    setRoutines((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "pending" : "done" }
          : item
      )
    );
  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      type: item.type || "is",
      priority: item.priority || "orta",
      date: item.date || toISODate(today),
      time: item.time || "",
      note: item.note || "",
      status: item.status || "open",
    });
  };

  const toggleDone = (id) => {
    setRoutines((current) => current.map((item) => (
      item.id === id ? { ...item, status: item.status === "done" ? "open" : "done" } : item
    )));
  };

  const deleteRoutine = (id) => {
    setRoutines((current) => current.filter((item) => item.id !== id));
  };

  const changeForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const itemsByDate = (iso) => filteredRoutines.filter((item) => item.date === iso);

  return (
    <section className="routinePageGrid">
      <div className="routineMainArea">
        <section className="panelCard routineHeroCard">
          <div className="panelHeader routineStaticHeader">
            <div>
              <h2 className="gradientTitle">Haftalık Rutin</h2>
              <p>Günlük işler, eğitim planı ve kişisel notlarını yıl boyunca hafta hafta takip et.</p>
            </div>

            <div className="panelRight">
              <div className="panelTotal">
                <span>Seçili Hafta</span>
                <strong>{selectedWeek}. Hafta</strong>
              </div>
            </div>
          </div>

          <div className="panelBody">
            <div className="formGrid five">
              <label className="inputBox">
                <span>Yıl</span>
                <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>

              <label className="inputBox">
                <span>Hafta</span>
                <select value={selectedWeek} onChange={(event) => setSelectedWeek(Number(event.target.value))}>
                  {Array.from({ length: weeksInSelectedYear }, (_, index) => index + 1).map((week) => (
                    <option key={week} value={week}>{week}. Hafta</option>
                  ))}
                </select>
              </label>

              <label className="inputBox">
                <span>Başlık</span>
                <input value={form.title} placeholder="Örn: SQL tekrar" onChange={(event) => changeForm("title", event.target.value)} />
              </label>

              <label className="inputBox">
                <span>Tarih</span>
                <input type="date" value={form.date} onChange={(event) => changeForm("date", event.target.value)} />
              </label>

              <label className="inputBox">
                <span>Tür</span>
                <select value={form.type} onChange={(event) => changeForm("type", event.target.value)}>
                  {routineTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="inputBox">
                <span>Öncelik</span>
                <select value={form.priority} onChange={(event) => changeForm("priority", event.target.value)}>
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </label>

              <label className="inputBox routineWideInput">
                <span>Not</span>
                <input value={form.note} placeholder="Opsiyonel not" onChange={(event) => changeForm("note", event.target.value)} />
              </label>

              <button type="button" className="premiumButton routineAddButton" onClick={addRoutine}>
                Rutine Ekle
              </button>
            </div>
          </div>
        </section>

        <section className="routineWeekGrid">
          {weekDays.map((day) => {
            const dayTasks = selectedWeekTasks.filter((item) => item.date === day.dateText);
            return (
              <article key={day.dateText} className="miniPanel purple routineDayCard">
                <div className="routineDayHeader">
                  <div>
                    <h3 className="miniTitle miniTitle-purple">{day.name}</h3>
                    <p className="sectionDescription">{formatDate(day.dateText)}</p>
                  </div>
                  <span className="status waiting">{dayTasks.length} kayıt</span>
                </div>

                <div className="recordList">
                  {dayTasks.length === 0 ? (
                    <div className="emptyState">
                      <strong>Bu gün için kayıt yok.</strong>
                      <span>Yeni rutin eklediğinde burada görünecek.</span>
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <RoutineItem
                        key={task.id}
                        task={task}
                        onToggle={toggleStatus}
                        onDelete={deleteRoutine}
                      />
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <aside className="routineSidePanel panelCard">
        <div className="routineSideHeader">
          <h2 className="gradientTitle">Yaklaşan İşler</h2>
          <p>Bugün, bu hafta ve geciken işler.</p>
    <section className="routineProShell">
      <div className="routineHero">
        <div>
          <span className="routineEyebrow">Yıllık Rutin Takvimi</span>
          <h2>{MONTHS[selectedMonth]} {selectedYear}</h2>
          <p>İş, eğitim, finans ve kişisel rutinlerini takvim görünümünde takip et.</p>
        </div>
        <div className="routineStatsGrid">
          <div className="routineStatCard"><span>Aylık İş</span><strong>{monthStats.total}</strong></div>
          <div className="routineStatCard routineStatGreen"><span>Tamamlanan</span><strong>{monthStats.completed}</strong></div>
          <div className="routineStatCard routineStatRed"><span>Yüksek Öncelik</span><strong>{monthStats.high}</strong></div>
        </div>
      </div>

        <UpcomingGroup title="Bugün" items={upcoming.today} onToggle={toggleStatus} onDelete={deleteRoutine} />
        <UpcomingGroup title="Bu Hafta" items={upcoming.week} onToggle={toggleStatus} onDelete={deleteRoutine} />
        <UpcomingGroup title="Gecikenler" items={upcoming.overdue} onToggle={toggleStatus} onDelete={deleteRoutine} danger />
      </aside>
    </section>
  );
}
      <div className="routineToolbar">
        <label>
          <span>Yıl</span>
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>Ay Filtresi</span>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
            {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
          </select>
        </label>
        <label>
          <span>Tür</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            <option value="tum">Tümü</option>
            {ROUTINE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
      </div>

function RoutineItem({ task, onToggle, onDelete }) {
  const priorityClass = task.priority === "high" ? "status deferred" : task.priority === "medium" ? "status waiting" : "status done";
      <div className="routineMonthPills">
        {MONTHS.map((month, index) => (
          <button key={month} type="button" className={selectedMonth === index ? "active" : ""} onClick={() => setSelectedMonth(index)}>
            {month.slice(0, 3)}
          </button>
        ))}
      </div>

  return (
    <div className={task.status === "done" ? "simpleRecord routineDoneRecord" : "simpleRecord"}>
      <div className="simpleRecordTop">
        <div>
          <div className="recordTitleRow">
            <h4>{task.title}</h4>
            <span className="status waiting">{typeLabel(task.type)}</span>
            <span className={priorityClass}>{priorityLabel(task.priority)}</span>
            {task.status === "done" ? <span className="status done">Tamamlandı</span> : null}
      <div className="routineLayoutGrid">
        <div className="routineCalendarCard">
          <div className="routineWeekHeader">
            {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="routineCalendarGrid">
            {monthDays.map((day) => {
              if (day.empty) return <div key={day.id} className="routineDayCell empty" />;
              const items = itemsByDate(day.iso);
              const isToday = day.iso === toISODate(today);
              return (
                <div key={day.id} className={isToday ? "routineDayCell today" : "routineDayCell"}>
                  <div className="routineDayTop"><strong>{day.day}</strong><span>{day.week}. hf</span></div>
                  <div className="routineDayItems">
                    {items.slice(0, 3).map((item) => {
                      const meta = getTypeMeta(item.type);
                      return <button type="button" key={item.id} className={`routineTinyItem ${meta.className}`} onClick={() => startEdit(item)}>{item.title}</button>;
                    })}
                    {items.length > 3 ? <span className="routineMore">+{items.length - 3}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <p>{formatDate(task.date)}{task.note ? ` • ${task.note}` : ""}</p>
        </div>

        <div className="simpleRecordRight">
          <button type="button" className="editButton" onClick={() => onToggle(task.id)}>
            {task.status === "done" ? "Geri Al" : "Tamamla"}
          </button>
          <button type="button" className="deleteButton" onClick={() => onDelete(task.id)}>Sil</button>
        </div>
      </div>
    </div>
  );
}

function UpcomingGroup({ title, items, onToggle, onDelete, danger = false }) {
  return (
    <section className="routineUpcomingGroup">
      <div className="routineUpcomingTitle">
        <h3 className={danger ? "miniTitle miniTitle-rose" : "miniTitle miniTitle-mint"}>{title}</h3>
        <span className={danger ? "status deferred" : "status waiting"}>{items.length}</span>
      </div>
        <aside className="routineSidePanel">
          <div className="routineFormCard">
            <h3>{editingId ? "Rutini Güncelle" : "Yeni Rutin"}</h3>
            <label><span>Başlık</span><input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Örn: SQL eğitimi" /></label>
            <label><span>Tarih</span><input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} /></label>
            <label><span>Saat</span><input type="time" value={form.time} onChange={(event) => updateForm("time", event.target.value)} /></label>
            <label><span>Tür</span><select value={form.type} onChange={(event) => updateForm("type", event.target.value)}>{ROUTINE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
            <label><span>Öncelik</span><select value={form.priority} onChange={(event) => updateForm("priority", event.target.value)}>{PRIORITIES.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label>
            <label><span>Not</span><textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="Kısa not" /></label>
            <button type="button" className="premiumButton" onClick={saveRoutine}>{editingId ? "Güncelle" : "Ekle"}</button>
            {editingId ? <button type="button" className="secondaryButton" onClick={() => { setEditingId(null); setForm({ ...emptyForm, date: toISODate(today) }); }}>Vazgeç</button> : null}
          </div>

      <div className="recordList">
        {items.length === 0 ? (
          <div className="emptyState">
            <strong>Kayıt yok.</strong>
            <span>Yaklaşan iş olduğunda burada görünür.</span>
          <div className="routineUpcomingCard">
            <h3>Yaklaşan İşler</h3>
            {upcomingItems.length === 0 ? <p className="routineEmptyText">Yaklaşan kayıt yok.</p> : upcomingItems.map((item) => {
              const meta = getTypeMeta(item.type);
              return (
                <div key={item.id} className={`routineUpcomingItem ${meta.className}`}>
                  <div><strong>{item.title}</strong><span>{item.date}{item.time ? ` • ${item.time}` : ""}</span></div>
                  <div className="routineUpcomingActions">
                    <button type="button" onClick={() => toggleDone(item.id)}>{item.status === "done" ? "Aç" : "Bitir"}</button>
                    <button type="button" onClick={() => startEdit(item)}>Düzenle</button>
                    <button type="button" onClick={() => deleteRoutine(item.id)}>Sil</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          items.slice(0, 8).map((task) => (
            <RoutineItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))
        )}
        </aside>
      </div>
    </section>
  );
