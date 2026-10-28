import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/api";
import { todayIso } from "../../../shared/utils/formatters";
import Combobox from "../../../shared/ui/Combobox/Combobox";
import SearchCombobox from "../../../shared/ui/SearchCombobox";
import { teacherOption } from "../../../shared/ui/searchOptions";
import { getTeacher, searchTeachers } from "../../users/services/teacherService";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import AcademicCalendarManager from "./AcademicCalendarManager";
import ClassSheet, { formatDate } from "./ClassSheet";
import { eventInfo, useCalendarCatalog } from "../useCalendarCatalog";
import { getCalendarSummary, getFilteredCalendar } from "../services/staffCalendarService";
import { EVALUATION_TYPES, evaluationTypeLabel } from "../../grades/services/evaluationService";
import "../../users/usersPage/usersPage.css";
import "./staffCalendar.css";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const EMPTY_FILTERS = { programId: "", studyPlanId: "", classroomId: "", teacherId: "" };

const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Dias que se dibujan para un mes: arranca el lunes de la primera semana y termina el
// domingo de la ultima (5 o 6 filas de 7).
function buildMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const days = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(year, month, 1 - offset + i);
    days.push({ date: iso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return days;
}

const EVALUATION_FILTERS = [{ value: "", label: "Todas" }, ...EVALUATION_TYPES.map((t) => ({ value: t.value, label: t.label }))];

// Evaluaciones del día elegido. Con muchas se agrupan por materia para que la lista siga siendo legible.
function DayEvaluations({ evaluations, type, onTypeChange }) {
  const visible = evaluations
    .filter((ev) => !type || ev.type === type)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "") || a.courseName.localeCompare(b.courseName, "es"));

  const grouped = visible.length > 8;
  const byCourse = new Map();
  if (grouped) {
    for (const ev of visible) {
      if (!byCourse.has(ev.courseName)) byCourse.set(ev.courseName, []);
      byCourse.get(ev.courseName).push(ev);
    }
  }

  const row = (ev) => (
    <li key={ev.evaluationId} className="cal-eval">
      <span className="cal-eval-time">{ev.startTime ?? "Todo el día"}</span>
      <span className="cal-eval-body">
        <span className="cal-eval-title">
          {ev.name}
          <span className="users-badge users-badge--gray">{evaluationTypeLabel(ev.type)}</span>
          {ev.visible === false && <span className="users-badge users-badge--inactive">Oculta</span>}
        </span>
        <span className="cal-class-meta">
          {ev.courseName} · Comisión {ev.sectionName}
        </span>
      </span>
    </li>
  );

  return (
    <div className="cal-evals">
      <h3 className="cal-evals-title">
        Evaluaciones <span className="cal-group-count">{evaluations.length}</span>
      </h3>
      <div className="cal-evals-filters" role="group" aria-label="Filtrar evaluaciones por tipo">
        {EVALUATION_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`cal-chip ${type === f.value ? "cal-chip--active" : ""}`}
            aria-pressed={type === f.value}
            onClick={() => onTypeChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="users-empty">No hay evaluaciones de ese tipo este día.</p>}

      {!grouped && <ul className="cal-eval-list">{visible.map(row)}</ul>}

      {grouped &&
        [...byCourse.entries()].map(([course, items]) => (
          <details key={course} className="cal-group">
            <summary className="cal-group-summary">
              <span>{course}</span>
              <span className="cal-group-count">{items.length}</span>
            </summary>
            <ul className="cal-eval-list">{items.map(row)}</ul>
          </details>
        ))}
    </div>
  );
}

export default function StaffCalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const catalog = useCalendarCatalog();

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [summary, setSummary] = useState({ days: [], missingTerms: [] });
  const [dayData, setDayData] = useState({ date: null, events: [], evaluations: [], loading: true });
  const [evaluationType, setEvaluationType] = useState("");
  const [error, setError] = useState("");
  const [sheetItem, setSheetItem] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const panelRef = useRef(null);

  const monthDays = useMemo(() => buildMonthDays(cursor.year, cursor.month), [cursor]);
  const rangeFrom = monthDays[0].date;
  const rangeTo = monthDays[monthDays.length - 1].date;

  const summaryByDate = useMemo(() => new Map(summary.days.map((d) => [d.date, d])), [summary]);

  // Cada carga lleva un numero: si el usuario cambia de mes o de filtro antes de que
  // vuelva la respuesta anterior, esa respuesta se descarta.
  const summarySeq = useRef(0);
  useEffect(() => {
    const seq = ++summarySeq.current;
    getCalendarSummary(rangeFrom, rangeTo, filters)
      .then((data) => {
        if (seq !== summarySeq.current) return;
        setSummary(data);
        setError("");
      })
      .catch((e) => {
        if (seq === summarySeq.current) setError(getErrorMessage(e, "No se pudo cargar el calendario."));
      });
  }, [rangeFrom, rangeTo, filters, reloadKey]);

  const daySeq = useRef(0);
  useEffect(() => {
    const seq = ++daySeq.current;
    setDayData((prev) => ({ ...prev, loading: true }));
    getFilteredCalendar(selectedDate, selectedDate, filters)
      .then((data) => {
        if (seq === daySeq.current) setDayData({ date: selectedDate, events: data.events, evaluations: data.evaluations ?? [], loading: false });
      })
      .catch((e) => {
        if (seq !== daySeq.current) return;
        setDayData({ date: selectedDate, events: [], evaluations: [], loading: false });
        setError(getErrorMessage(e, "No se pudieron cargar las clases del día."));
      });
  }, [selectedDate, filters, reloadKey]);

  const programOptions = useMemo(
    () => catalog.programs.map((p) => ({ value: p.id, label: p.name })),
    [catalog.programs],
  );

  const planOptions = useMemo(() => {
    const plans = filters.programId
      ? catalog.studyPlans.filter((p) => String(p.programId) === String(filters.programId))
      : catalog.studyPlans;
    return plans.map((p) => ({
      value: p.id,
      label: filters.programId ? `Res. ${p.resolutionYear}` : `${p.programName} · Res. ${p.resolutionYear}`,
    }));
  }, [catalog.studyPlans, filters.programId]);

  const classroomOptions = useMemo(
    () =>
      catalog.classrooms.map((c) => ({
        value: c.id,
        label: c.buildingName ? `${c.name} (${c.buildingName})` : c.name,
      })),
    [catalog.classrooms],
  );

  function changeFilter(key, value) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "programId") next.studyPlanId = "";
      return next;
    });
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;

  function moveMonth(delta) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  function goToday() {
    const t = new Date();
    setCursor({ year: t.getFullYear(), month: t.getMonth() });
    setSelectedDate(todayIso());
  }

  function selectDate(date) {
    setSelectedDate(date);
    // En celular el panel queda debajo del mes: se lleva la vista hasta el.
    if (window.innerWidth < 900) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  async function handleChanged() {
    setSheetItem(null);
    refresh();
  }

  function openSection(sectionId) {
    const info = eventInfo(sheetItem);
    const params = new URLSearchParams({ section: String(sectionId) });
    if (info?.program) params.set("program", String(info.program.id));
    if (info?.plan) params.set("plan", String(info.plan.id));
    navigate(`/cursadas?${params.toString()}`);
  }

  // Clases del dia agrupadas por carrera y plan, ordenadas por horario dentro de cada grupo.
  const dayHoliday = dayData.date === selectedDate ? dayData.events.find((e) => e.status === "HOLIDAY") : undefined;
  const groups = useMemo(() => {
    const map = new Map();
    for (const e of dayData.events) {
      if (e.status === "HOLIDAY") continue;
      const info = eventInfo(e);
      const key = info?.plan ? `plan-${info.plan.id}` : "other";
      const label = info?.plan ? `${info.program?.name ?? info.plan.programName} · Plan Res. ${info.plan.resolutionYear}` : "Sin carrera asignada";
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key).items.push(e);
    }
    const list = [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
    list.forEach((g) => g.items.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.courseName.localeCompare(b.courseName, "es")));
    return list;
  }, [dayData.events]);

  // Al refrescar el mismo dia se sigue mostrando la lista anterior (sin parpadeo) hasta que llegue la nueva.
  const showingDay = dayData.date === selectedDate;
  const classCount = groups.reduce((n, g) => n + g.items.length, 0);

  if (searchParams.get("vista") === "academico") {
    return (
      <AcademicCalendarManager
        onBack={() => setSearchParams({})}
        onChanged={refresh}
      />
    );
  }

  const today = todayIso();

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Calendario</h1>
          <p className="users-subtitle">Clases de todas las comisiones. Tocá un día para ver el detalle.</p>
        </div>
        <button type="button" className="users-btn users-btn--ghost" onClick={() => setSearchParams({ vista: "academico" })}>
          Calendario académico
        </button>
      </div>

      <LoadError message={error} onRetry={refresh} />

      {summary.missingTerms.length > 0 && (
        <div className="cal-warning" role="alert">
          <p>
            Faltan cargar las fechas de cursado de{" "}
            {summary.missingTerms.map((t) => `${t.term}° cuatrimestre ${t.academicYear}`).join(", ")}. Hasta entonces
            esas comisiones no aparecen en el calendario.
          </p>
          <button type="button" className="users-btn users-btn--primary" onClick={() => setSearchParams({ vista: "academico" })}>
            Cargar fechas de cursado
          </button>
        </div>
      )}

      <details className="cal-filters" open={typeof window !== "undefined" && window.innerWidth >= 768}>
        <summary className="cal-filters-summary">Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}</summary>
        <div className="cal-filters-grid">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="staffCalendarPage-1">Carrera</label>
            <Combobox id="staffCalendarPage-1"
              options={programOptions}
              value={filters.programId}
              onChange={(v) => changeFilter("programId", v)}
              placeholder="Todas las carreras"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="staffCalendarPage-2">Plan de estudio</label>
            <Combobox id="staffCalendarPage-2"
              options={planOptions}
              value={filters.studyPlanId}
              onChange={(v) => changeFilter("studyPlanId", v)}
              placeholder={filters.programId ? "Todos los planes" : "Todos los planes"}
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="staffCalendarPage-3">Aula</label>
            <Combobox id="staffCalendarPage-3"
              options={classroomOptions}
              value={filters.classroomId}
              onChange={(v) => changeFilter("classroomId", v)}
              placeholder="Todas las aulas"
            />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="staffCalendarPage-4">Docente</label>
            <SearchCombobox id="staffCalendarPage-4"
              value={filters.teacherId}
              onChange={(v) => changeFilter("teacherId", v)}
              loadOptions={async (q) => {
                const page = await searchTeachers({ q });
                return { items: page.items.map(teacherOption), total: page.total };
              }}
              loadSelected={async (id) => teacherOption(await getTeacher(id))}
              browse
              placeholder="Todos los docentes"
              emptyLabel="No se encontraron docentes"
            />
          </div>
          {activeFilters > 0 && (
            <button type="button" className="users-btn users-btn--ghost cal-clear" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpiar filtros
            </button>
          )}
        </div>
      </details>

      <div className="cal-layout">
        <section className="cal-month" aria-label="Mes">
          <div className="cal-month-nav">
            <button type="button" className="cal-nav-btn" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              ‹
            </button>
            <h2 className="cal-month-title">
              {MONTHS[cursor.month]} {cursor.year}
            </h2>
            <button type="button" className="cal-nav-btn" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
              ›
            </button>
            <button type="button" className="users-btn users-btn--ghost cal-today-btn" onClick={goToday}>
              Hoy
            </button>
          </div>

          <div className="cal-grid">
            {WEEKDAYS.map((w) => (
              <div key={w} className="cal-weekday">
                {w}
              </div>
            ))}
            {monthDays.map(({ date, day, inMonth }) => {
              const s = summaryByDate.get(date);
              const classes = s?.classes ?? 0;
              const cancelled = s?.cancelled ?? 0;
              const evaluations = s?.evaluations ?? 0;
              const classCls = [
                "cal-day",
                inMonth ? "" : "cal-day--out",
                date === today ? "cal-day--today" : "",
                date === selectedDate ? "cal-day--selected" : "",
                s?.holiday ? "cal-day--holiday" : "",
              ].join(" ");
              return (
                <button
                  key={date}
                  type="button"
                  className={classCls}
                  onClick={() => selectDate(date)}
                  aria-label={`${formatDate(date)}${classes ? `, ${classes} clases` : ""}${cancelled ? `, ${cancelled} canceladas` : ""}${evaluations ? `, ${evaluations} ${evaluations === 1 ? "evaluación" : "evaluaciones"}` : ""}${s?.holiday ? `, feriado: ${s.holiday}` : ""}`}
                >
                  <span className="cal-day-num">{day}</span>
                  {s?.holiday && <span className="cal-badge cal-badge--holiday">Fer<span className="cal-badge-long">iado</span></span>}
                  {classes > 0 && (
                    <span className="cal-badge cal-badge--classes">
                      {classes}
                      <span className="cal-badge-long"> {classes === 1 ? "clase" : "clases"}</span>
                    </span>
                  )}
                  {cancelled > 0 && (
                    <span className="cal-badge cal-badge--cancelled">
                      {cancelled}
                      <span className="cal-badge-long"> {cancelled === 1 ? "cancelada" : "canceladas"}</span>
                    </span>
                  )}
                  {evaluations > 0 && (
                    <span className="cal-badge cal-badge--evaluations">
                      {evaluations}
                      <span className="cal-badge-long"> {evaluations === 1 ? "eval." : "evals."}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="cal-legend">
            <span className="cal-badge cal-badge--classes">N</span> clases
            <span className="cal-badge cal-badge--cancelled">N</span> canceladas
            <span className="cal-badge cal-badge--evaluations">N</span> evaluaciones
            <span className="cal-badge cal-badge--holiday">Feriado</span>
          </p>
        </section>

        <section className="cal-panel" ref={panelRef} aria-label="Clases del día">
          <h2 className="cal-panel-title">
            {formatDate(selectedDate)}
            {selectedDate === today ? " · Hoy" : ""}
          </h2>

          {dayHoliday && <p className="cal-holiday-banner">Feriado: {dayHoliday.reason}</p>}
          {!showingDay && <p className="users-empty">Cargando...</p>}
          {showingDay && classCount === 0 && !dayHoliday && (
            <p className="users-empty">No hay clases este día{activeFilters > 0 ? " con los filtros elegidos" : ""}.</p>
          )}

          {showingDay && classCount > 0 && (
            <p className="cal-panel-count">
              {classCount} {classCount === 1 ? "clase" : "clases"}
            </p>
          )}

          {showingDay &&
            groups.map((group) => (
              <details key={group.key} className="cal-group" open={groups.length <= 2 || activeFilters > 0}>
                <summary className="cal-group-summary">
                  <span>{group.label}</span>
                  <span className="cal-group-count">{group.items.length}</span>
                </summary>
                <ul className="cal-class-list">
                  {group.items.map((e) => {
                    const teacher = e.teacherName ?? null;
                    const isCancelled = e.status === "CANCELLED";
                    return (
                      <li key={`${e.sectionId}-${e.startTime}`}>
                        <button
                          type="button"
                          className={`cal-class ${isCancelled ? "cal-class--cancelled" : ""}`}
                          onClick={() => setSheetItem(e)}
                        >
                          <span className="cal-class-time">
                            {e.startTime}
                            <small>{e.endTime}</small>
                          </span>
                          <span className="cal-class-body">
                            <span className="cal-class-course">{e.courseName}</span>
                            <span className="cal-class-meta">
                              Comisión {e.sectionName}
                              {e.classroomName ? ` · ${e.classroomName}` : ""}
                              {teacher ? ` · ${teacher}` : ""}
                            </span>
                            {isCancelled && <span className="cal-status cal-status--cancelled">Cancelada · {e.reason}</span>}
                          </span>
                          <span className="cal-class-go" aria-hidden="true">›</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}

          {showingDay && dayData.evaluations.length > 0 && (
            <DayEvaluations evaluations={dayData.evaluations} type={evaluationType} onTypeChange={setEvaluationType} />
          )}
        </section>
      </div>

      {sheetItem && (
        <ClassSheet
          item={sheetItem}
          info={eventInfo(sheetItem)}
          onClose={() => setSheetItem(null)}
          onChanged={handleChanged}
          onOpenSection={openSection}
        />
      )}
    </div>
  );
}
