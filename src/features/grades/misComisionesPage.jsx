import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getMySections } from "../sections/services/sectionService";
import { getSectionSchedules } from "../sections/services/sectionScheduleService";
import { getEnrollmentsBySection } from "./services/enrollmentService";
import "../users/usersPage.css";
import "./misComisionesPage.css";

function periodKey(section) {
  return `${section.academicYear}-${section.term}`;
}

function periodLabel(key) {
  const [year, term] = key.split("-");
  return `${year} · ${term}º cuatrimestre`;
}

const WEEKDAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const WEEKDAY_LABEL = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
};

const WEEKDAY_SHORT = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
};

function timeToHour(time) {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${mm ? String(mm).padStart(2, "0") : "00"}`;
}

// Arma la semana del docente a partir de los horarios de las comisiones
// visibles (ya filtradas por período). El rango de horas se calcula a partir
// de los horarios reales (primera clase - 1h a última clase + 1h) en vez de
// uno fijo, para no obligar a hacer scroll si las clases son a la mañana, a
// la noche, o lo que sea.
function buildWeek(visibleSections, schedulesBySection) {
  const events = [];
  visibleSections.forEach((section) => {
    (schedulesBySection[section.id] ?? []).forEach((sch) => {
      events.push({
        day: WEEKDAYS.indexOf(sch.weekday),
        start: timeToHour(sch.startTime),
        end: timeToHour(sch.endTime),
        title: `${section.courseName ?? "Materia"} — ${section.name}`,
        room: sch.classroomName,
      });
    });
  });

  if (events.length === 0) {
    return { days: [], baseHour: 8, endHour: 22, events: [] };
  }

  const baseHour = Math.max(0, Math.floor(Math.min(...events.map((e) => e.start))) - 1);
  const endHour = Math.min(24, Math.ceil(Math.max(...events.map((e) => e.end))) + 1);

  const days = WEEKDAYS.map((weekday, i) => ({
    key: weekday,
    label: WEEKDAY_SHORT[weekday],
    events: events
      .filter((e) => e.day === i)
      .map((e) => ({
        ...e,
        top: (e.start - baseHour) * 44,
        height: (e.end - e.start) * 44 - 3,
      }))
      .sort((a, b) => a.start - b.start),
  }));

  return { days, baseHour, endHour, events };
}

export default function MisComisionesPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [schedulesBySection, setSchedulesBySection] = useState({});
  const [rosterBySection, setRosterBySection] = useState({});
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => Math.min(new Date().getDay() === 0 ? 5 : new Date().getDay() - 1, 5));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const me = await getMyTeacherProfile();
        const mySections = await getMySections(me.id);
        setSections(mySections);

        const schedules = await Promise.all(mySections.map((s) => getSectionSchedules(s.id)));
        const map = {};
        mySections.forEach((s, i) => {
          map[s.id] = schedules[i];
        });
        setSchedulesBySection(map);

        // Por defecto se ve solo el cuatrimestre más reciente -- con varios
        // años de comisiones acumuladas (nunca se borran, ni las cerradas),
        // mostrarlas todas juntas y sin agrupar se vuelve ilegible.
        if (mySections.length > 0) {
          const [latest] = [...mySections].sort(
            (a, b) => b.academicYear - a.academicYear || b.term - a.term,
          );
          setSelectedPeriod(periodKey(latest));
        }
      } catch (err) {
        setError(getErrorMessage(err, "No se pudieron cargar tus comisiones."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const periodOptions = useMemo(() => {
    const keys = new Set(sections.map(periodKey));
    return [...keys].sort().reverse();
  }, [sections]);

  const visibleSections = useMemo(
    () => sections.filter((s) => periodKey(s) === selectedPeriod),
    [sections, selectedPeriod],
  );

  const week = useMemo(
    () => buildWeek(visibleSections, schedulesBySection),
    [visibleSections, schedulesBySection],
  );

  const hourLabels = useMemo(() => {
    const labels = [];
    for (let h = week.baseHour; h <= week.endHour; h++) labels.push(h);
    return labels;
  }, [week.baseHour, week.endHour]);

  async function toggleRoster(sectionId) {
    if (expandedSectionId === sectionId) {
      setExpandedSectionId(null);
      return;
    }

    setExpandedSectionId(sectionId);

    if (rosterBySection[sectionId]) return;

    try {
      const enrollments = await getEnrollmentsBySection(sectionId);
      setRosterBySection((prev) => ({ ...prev, [sectionId]: enrollments }));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los alumnos de la comision."));
    }
  }

  if (loading) {
    return (
      <div className="users-page">
        <p className="users-empty">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Mis comisiones</h1>
          <p className="users-subtitle">Materias y horarios que tenés asignados</p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      {sections.length === 0 && !error && (
        <p className="users-empty">No tenés comisiones asignadas todavía.</p>
      )}

      {periodOptions.length > 0 && (
        <div className="users-form-field" style={{ maxWidth: 260 }}>
          <label className="users-form-label">Período</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="users-form-input"
          >
            {periodOptions.map((key) => (
              <option key={key} value={key}>{periodLabel(key)}</option>
            ))}
          </select>
        </div>
      )}

      {sections.length > 0 && visibleSections.length === 0 && (
        <p className="users-empty">No tenés comisiones en este período.</p>
      )}

      {week.events.length > 0 && (
        <div className="mis-comisiones-week">
          <h2 className="mis-comisiones-week-title">Mi semana</h2>

          <div className="mis-comisiones-daystrip">
            {week.days.map((day, i) => (
              <button
                key={day.key}
                type="button"
                className={`mis-comisiones-day-pill ${i === selectedDay ? "mis-comisiones-day-pill--selected" : ""}`}
                onClick={() => setSelectedDay(i)}
              >
                <span>{day.label}</span>
              </button>
            ))}
          </div>

          <div className="mis-comisiones-agenda">
            {week.days[selectedDay].events.length === 0 && (
              <p className="users-empty">Sin clases este día.</p>
            )}
            {week.days[selectedDay].events.map((e, i) => (
              <div key={i} className="mis-comisiones-event">
                <span className="mis-comisiones-event-time">
                  {formatHour(e.start)}–{formatHour(e.end)}
                </span>
                <div>
                  <div className="mis-comisiones-event-title">{e.title}</div>
                  <div className="mis-comisiones-event-room">{e.room}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mis-comisiones-grid">
            <div className="mis-comisiones-head-cell" style={{ borderLeft: "none" }} />
            {week.days.map((day) => (
              <div key={day.key} className="mis-comisiones-head-cell">{day.label}</div>
            ))}

            <div>
              {hourLabels.map((h, i) => (
                <div key={h} className={`mis-comisiones-hour-label ${i === 0 ? "mis-comisiones-hour-label--first" : ""}`}>
                  {h}
                </div>
              ))}
            </div>
            {week.days.map((day) => (
              <div key={day.key} className="mis-comisiones-daycol" style={{ minHeight: (week.endHour - week.baseHour) * 44 }}>
                {day.events.map((e, i) => (
                  <div key={i} className="mis-comisiones-block" style={{ top: e.top, height: e.height }}>
                    <b>{e.title}</b>
                    <span>{e.room}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mis-comisiones-list">
        {visibleSections.map((section) => {
          const schedules = schedulesBySection[section.id] ?? [];
          const roster = rosterBySection[section.id];

          return (
            <div key={section.id} className="mis-comisiones-card">
              <div className="mis-comisiones-card-header">
                <h2 className="mis-comisiones-card-title">{section.courseName ?? "Materia"}</h2>
                <span className="mis-comisiones-card-subtitle">
                  {section.name} · {section.academicYear} · {section.shift}
                </span>
                <span className={`users-badge ${section.closed ? "users-badge--inactive" : "users-badge--active"}`}>
                  {section.closed ? "Cerrada" : "Abierta"}
                </span>
              </div>

              <div className="mis-comisiones-schedules">
                {schedules.length === 0 && (
                  <span className="mis-comisiones-schedule-line">Sin horario asignado todavía.</span>
                )}
                {schedules.map((sch) => (
                  <span key={sch.id} className="mis-comisiones-schedule-line">
                    {WEEKDAY_LABEL[sch.weekday] ?? sch.weekday} {sch.startTime?.slice(0, 5)}–{sch.endTime?.slice(0, 5)} · {sch.classroomName}
                  </span>
                ))}
              </div>

              <div className="mis-comisiones-actions">
                <button
                  type="button"
                  className="users-btn users-btn--ghost"
                  onClick={() => toggleRoster(section.id)}
                >
                  {expandedSectionId === section.id ? "Ocultar alumnos" : "Ver alumnos"}
                </button>
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={() => navigate(`/planilla?section=${section.id}`)}
                >
                  {section.closed ? "Ver resultado" : "Cargar planilla"}
                </button>
              </div>

              {expandedSectionId === section.id && (
                <div className="mis-comisiones-roster">
                  {roster === undefined && <p className="users-empty">Cargando alumnos...</p>}
                  {roster?.length === 0 && <p className="users-empty">No hay alumnos inscriptos.</p>}
                  {roster?.map((e) => (
                    <p key={e.id} className="mis-comisiones-roster-item">
                      {e.studentFirstName} {e.studentLastName}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
