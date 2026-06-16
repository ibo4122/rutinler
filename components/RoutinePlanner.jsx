"use client";

import { useMemo, useState } from "react";

const dayNames = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const routineTypes = [
  { value: "work", label: "Günlük İş" },
  { value: "education", label: "Eğitim" },
  { value: "personal", label: "Kişisel" },
];

const priorities = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getISOWeek(date) {
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
}

function sortByDate(items) {
  return [...items].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function typeLabel(type) {
  return routineTypes.find((item) => item.value === type)?.label || "İş";
}

function priorityLabel(priority) {
  return priorities.find((item) => item.value === priority)?.label || "Orta";
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
    });
  }, [selectedYear, selectedWeek]);

  const weekStart = weekDays[0]?.dateText;
  const weekEnd = weekDays[6]?.dateText;

  const selectedWeekTasks = useMemo(() => {
    return routines.filter((item) => item.date >= weekStart && item.date <= weekEnd);
  }, [routines, weekStart, weekEnd]);

  const upcoming = useMemo(() => {
    const pending = routines.filter((item) => item.status !== "done");
    const todayItems = pending.filter((item) => isSameDate(item.date, today));
    const weekItems = pending.filter((item) => item.date >= today && item.date <= weekEnd && item.date !== today);
    const overdueItems = pending.filter((item) => item.date < today);

    return {
      today: sortByDate(todayItems),
      week: sortByDate(weekItems),
      overdue: sortByDate(overdueItems),
    };
  }, [routines, today, weekEnd]);

  const addRoutine = () => {
    const title = form.title.trim();
    if (!title) return alert("İş / eğitim başlığı gir.");
    if (!form.date) return alert("Tarih seç.");

    const payload = {
      id: String(Date.now()),
      title,
      type: form.type,
      priority: form.priority,
      date: form.date,
      note: form.note.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setRoutines((current) => [payload, ...current]);
    setForm((current) => ({ ...current, title: "", note: "" }));
  };

  const toggleStatus = (id) => {
    setRoutines((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "pending" : "done" }
          : item
      )
    );
  };

  const deleteRoutine = (id) => {
    setRoutines((current) => current.filter((item) => item.id !== id));
  };

  const changeForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

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
        </div>

        <UpcomingGroup title="Bugün" items={upcoming.today} onToggle={toggleStatus} onDelete={deleteRoutine} />
        <UpcomingGroup title="Bu Hafta" items={upcoming.week} onToggle={toggleStatus} onDelete={deleteRoutine} />
        <UpcomingGroup title="Gecikenler" items={upcoming.overdue} onToggle={toggleStatus} onDelete={deleteRoutine} danger />
      </aside>
    </section>
  );
}

function RoutineItem({ task, onToggle, onDelete }) {
  const priorityClass = task.priority === "high" ? "status deferred" : task.priority === "medium" ? "status waiting" : "status done";

  return (
    <div className={task.status === "done" ? "simpleRecord routineDoneRecord" : "simpleRecord"}>
      <div className="simpleRecordTop">
        <div>
          <div className="recordTitleRow">
            <h4>{task.title}</h4>
            <span className="status waiting">{typeLabel(task.type)}</span>
            <span className={priorityClass}>{priorityLabel(task.priority)}</span>
            {task.status === "done" ? <span className="status done">Tamamlandı</span> : null}
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

      <div className="recordList">
        {items.length === 0 ? (
          <div className="emptyState">
            <strong>Kayıt yok.</strong>
            <span>Yaklaşan iş olduğunda burada görünür.</span>
          </div>
        ) : (
          items.slice(0, 8).map((task) => (
            <RoutineItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}
