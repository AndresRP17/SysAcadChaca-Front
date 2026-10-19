import { useEffect, useRef, useState } from "react";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import {
  createViewList,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
// Schedule-X lee Temporal del scope global: hay que cargarlo así y usar esa misma instancia.
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../shared/api/api";
import { todayIso } from "../../shared/utils/formatters";
import { getAttendanceRules } from "../grades/services/attendanceService";
import { DEFAULT_RULES, STUDENT_STATUS_LABELS, attendanceSummary } from "../attendance/attendanceStatus";
import { getCalendar } from "./services/calendarService";
import { AgendaEvent, GridEvent, StudentStatusBadge } from "./calendarEventViews";
import Modal from "../../shared/ui/Modal";
import AttendanceModal from "../attendance/AttendanceModal";
import LoadError from "../../shared/ui/LoadError";
import "../users/usersPage.css";
import "./calendarPage.css";
import "./calendarEvents.css";

const { Temporal } = globalThis;

const TIMEZONE = "America/Argentina/Buenos_Aires";
const MONDAY = 1;

const CALENDARS = {
  scheduled: {
    colorName: "scheduled",
    lightColors: { main: "#1d4ed8", container: "#dbeafe", onContainer: "#1e3a8a" },
    darkColors: { main: "#93c5fd", container: "#1e3a8a", onContainer: "#dbeafe" },
  },
  holiday: {
    colorName: "holiday",
    lightColors: { main: "#b45309", container: "#fef3c7", onContainer: "#78350f" },
    darkColors: { main: "#fcd34d", container: "#78350f", onContainer: "#fef3c7" },
  },
  cancelled: {
    colorName: "cancelled",
    lightColors: { main: "#6b7280", container: "#f3f4f6", onContainer: "#374151" },
    darkColors: { main: "#9ca3af", container: "#374151", onContainer: "#f3f4f6" },
  },
};


function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Arma los eventos de Schedule-X a partir de las clases del backend. Los feriados
// se muestran una sola vez por dia (no una por comision) como evento de dia completo.
function toCalendarEvents(classes, isDocente) {
  const holidays = new Map();
  const events = [];

  for (const c of classes) {
    if (c.status === "HOLIDAY") {
      holidays.set(c.date, c.reason);
      continue;
    }

    events.push({
      id: `${c.sectionId}-${c.date}-${c.startTime}`,
      title: c.status === "CANCELLED" ? `Cancelada · ${c.courseName}` : `${c.courseName} · ${c.sectionName}`,
      start: Temporal.ZonedDateTime.from(`${c.date}T${c.startTime}:00[${TIMEZONE}]`),
      end: Temporal.ZonedDateTime.from(`${c.date}T${c.endTime}:00[${TIMEZONE}]`),
      location: c.classroomName ?? undefined,
      description: c.reason ?? undefined,
      calendarId: c.status === "CANCELLED" ? "cancelled" : "scheduled",
      // Para dibujar la clase como boton (ver calendarEventViews.jsx).
      attendanceTaken: c.attendanceTaken === true,
      // Solo el Alumno: su propia asistencia en esa clase (PRESENT / ABSENT / JUSTIFIED / LATE / LEFT_EARLY / null).
      attendanceStatus: c.attendanceStatus ?? null,
      attendanceComment: c.attendanceComment ?? null,
      actionLabel:
        isDocente && c.status === "SCHEDULED" ? (c.attendanceTaken ? "Editar asistencia" : "Tomar asistencia") : null,
    });
  }

  for (const [date, reason] of holidays) {
    events.push({
      id: `holiday-${date}`,
      title: `Feriado: ${reason}`,
      start: Temporal.PlainDate.from(date),
      end: Temporal.PlainDate.from(date),
      calendarId: "holiday",
    });
  }

  return events;
}

// El calendario de Schedule-X pide sus eventos al montarse: para "Reintentar" se remonta
// entero (cambiando la key) en vez de intentar forzarle una recarga desde afuera.
export default function CalendarPage() {
  const [attempt, setAttempt] = useState(0);
  return <CalendarContent key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function addDays(isoDate, delta) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatCredit(value) {
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

// Asistencia del Alumno sobre las clases con asistencia cargada, con las reglas institucionales
// (cuanto cuenta tarde / retiro anticipado; la justificada no cuenta). Si no se pueden leer las
// reglas se usan las de por defecto. El backend limita cada pedido a 100 dias, asi que se piden
// los ultimos 200 en dos tandas.
async function loadAttendanceSummary() {
  const today = todayIso();
  const ranges = [
    [addDays(today, -199), addDays(today, -100)],
    [addDays(today, -99), today],
  ];
  const [rules, ...results] = await Promise.all([
    getAttendanceRules().catch(() => DEFAULT_RULES),
    ...ranges.map(([from, to]) => getCalendar(from, to)),
  ]);
  const classes = results.flatMap((r) => r.events).filter((c) => c.status === "SCHEDULED" && c.attendanceStatus);
  return attendanceSummary(classes.map((c) => c.attendanceStatus), rules);
}

function CalendarContent({ onRetry }) {
  const { user } = useAuth();
  const isDocente = user?.role === "Docente";
  const isAlumno = user?.role === "Alumno";

  const [today, setToday] = useState({ classes: [], loaded: false });
  const [missingTerms, setMissingTerms] = useState([]);
  const [error, setError] = useState("");
  const [todayError, setTodayError] = useState("");
  const [attendance, setAttendance] = useState(null); // { total, justified, credit, percentage } (solo Alumno)
  const [detail, setDetail] = useState(null); // { title, lines } de la clase tocada
  const [attendanceTarget, setAttendanceTarget] = useState(null); // { sectionId, date } de la clase cuya asistencia se esta tomando

  const classesRef = useRef({}); // clases del rango visible por id de evento, para resolver el clic

  function takeAttendance(sectionId, date) {
    setAttendanceTarget({ sectionId, date });
  }

  // Despues de guardar: se cierra el modal y la clase pasa a "asistencia cargada" en la grilla y en
  // la tarjeta "Hoy", sin recargar la pagina. Los rangos ya pedidos quedan viejos: se descartan.
  function handleAttendanceSaved({ sectionId, date }) {
    setAttendanceTarget(null);
    rangesRef.current.clear();

    for (const c of Object.values(classesRef.current)) {
      if (c.sectionId === sectionId && c.date === date) c.attendanceTaken = true;
    }

    for (const event of calendarApp.events.getAll()) {
      const found = classesRef.current[event.id];
      if (found && found.sectionId === sectionId && found.date === date) {
        calendarApp.events.update({ ...event, attendanceTaken: true, actionLabel: "Editar asistencia" });
      }
    }

    setToday((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.sectionId === sectionId && c.date === date ? { ...c, attendanceTaken: true } : c,
      ),
    }));
  }

  // Schedule-X llama a fetchEvents al renderizar, cada vez que cambia el rango visible y
  // tambien cuando la pagina vuelve a renderizar. Se guarda la promesa por rango para pedir
  // cada rango una sola vez (sin esto, un cambio de estado volvia a pedir lo mismo en bucle).
  const rangesRef = useRef(new Map());

  function fetchEvents(range) {
    const from = range.start.toPlainDate().toString();
    const to = range.end.toPlainDate().toString();
    const key = `${from}|${to}`;

    if (!rangesRef.current.has(key)) {
      const request = getCalendar(from, to)
        .then((data) => {
          data.events.forEach((c) => {
            classesRef.current[`${c.sectionId}-${c.date}-${c.startTime}`] = c;
          });
          setMissingTerms((prev) => (JSON.stringify(prev) === JSON.stringify(data.missingTerms) ? prev : data.missingTerms));
          setError("");
          return toCalendarEvents(data.events, isDocente);
        })
        .catch((err) => {
          rangesRef.current.delete(key);
          setError(getErrorMessage(err, "No se pudo cargar el calendario."));
          return [];
        });

      rangesRef.current.set(key, request);
    }

    return rangesRef.current.get(key);
  }

  const isNarrow = typeof window !== "undefined" && window.innerWidth < 768;

  const calendarApp = useCalendarApp(
    {
      locale: "es-ES",
      timezone: TIMEZONE,
      firstDayOfWeek: MONDAY,
      defaultView: isNarrow ? "month-agenda" : "month-grid",
      views: [createViewMonthAgenda(), createViewMonthGrid(), createViewWeek(), createViewList()],
      calendars: CALENDARS,
      callbacks: {
        fetchEvents,
        onEventClick(event) {
          const found = classesRef.current[event.id];

          // Feriado (no es una clase): solo se muestra el motivo.
          if (!found) {
            setDetail({ title: event.title, lines: [] });
            return;
          }

          if (found.status === "CANCELLED") {
            setDetail({
              title: `Clase cancelada · ${found.courseName}`,
              lines: [`${formatDate(found.date)} · Comisión ${found.sectionName}`, `Motivo: ${found.reason}`],
            });
          } else if (isDocente) {
            takeAttendance(found.sectionId, found.date);
          } else {
            const attendance = STUDENT_STATUS_LABELS[found.attendanceStatus];
            setDetail({
              title: found.courseName,
              lines: [
                `Comisión ${found.sectionName}`,
                formatDate(found.date),
                `${found.startTime} a ${found.endTime}`,
                ...(found.classroomName ? [`Aula: ${found.classroomName}`] : []),
                ...(attendance ? [attendance] : []),
                ...(attendance && found.attendanceComment ? [`Comentario: ${found.attendanceComment}`] : []),
              ],
            });
          }
        },
      },
    },
  );

  useEffect(() => {
    const date = todayIso();
    getCalendar(date, date)
      .then((data) => setToday({ classes: data.events, loaded: true }))
      .catch((err) => {
        setTodayError(getErrorMessage(err, "No se pudieron cargar las clases de hoy."));
        setToday({ classes: [], loaded: true });
      });
  }, []);

  useEffect(() => {
    if (!isAlumno) return;
    loadAttendanceSummary()
      .then(setAttendance)
      .catch(() => setAttendance(null)); // dato accesorio: si falla, simplemente no se muestra
  }, [isAlumno]);

  // Se listan las clases de hoy aunque haya un feriado cargado: el feriado se avisa aparte.
  const todayClasses = today.classes.filter((c) => c.status === "SCHEDULED" || c.status === "CANCELLED");
  const todayHoliday = today.classes.find((c) => c.status === "HOLIDAY");

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Calendario</h1>
          <p className="users-subtitle">
            {isDocente ? "Tus clases. Tocá una para tomar asistencia." : "Tus clases del cuatrimestre y tu asistencia."}
          </p>
        </div>
      </div>

      <LoadError message={error || todayError} onRetry={onRetry} />

      {isAlumno && attendance && (attendance.total > 0 || attendance.justified > 0) && (
        <p className="calendar-attendance" aria-label="Resumen de tu asistencia">
          <strong>
            {attendance.percentage === null ? "Tu asistencia: sin clases contables" : `Tu asistencia: ${attendance.percentage}%`}
          </strong>
          <span>
            {attendance.total > 0 && (
              <>
                Cuentan {formatCredit(attendance.credit)} de {attendance.total}{" "}
                {attendance.total === 1 ? "clase contable" : "clases contables"}.{" "}
              </>
            )}
            {attendance.justified > 0 &&
              `${attendance.justified} ausencia${attendance.justified === 1 ? " justificada" : "s justificadas"} (no ${attendance.justified === 1 ? "cuenta" : "cuentan"}). `}
            (últimos 200 días)
          </span>
        </p>
      )}

      {missingTerms.length > 0 && (
        <p className="users-form-error">
          Faltan cargar las fechas de cursado de{" "}
          {missingTerms.map((t) => `${t.term}° cuatrimestre ${t.academicYear}`).join(", ")}. Avisá a Bedelía: hasta
          entonces esas comisiones no aparecen en el calendario.
        </p>
      )}

      <section className="calendar-today">
        <h2 className="calendar-today-title">Hoy · {formatDate(todayIso())}</h2>
        {!today.loaded && <p className="users-empty">Cargando...</p>}
        {today.loaded && todayHoliday && (
          <p className="calendar-today-holiday">Feriado: {todayHoliday.reason}. No hay clases.</p>
        )}
        {today.loaded && !todayHoliday && !todayError && todayClasses.length === 0 && (
          <p className="users-empty">No tenés clases hoy.</p>
        )}
        <ul className="calendar-today-list">
          {todayClasses.map((c) => (
            <li key={`${c.sectionId}-${c.startTime}`} className="calendar-today-item">
              <div>
                <p className="calendar-today-course">
                  {c.courseName}
                  {c.status === "CANCELLED" && <span className="calendar-today-cancelled"> · Cancelada{c.reason ? `: ${c.reason}` : ""}</span>}
                </p>
                <p className="calendar-today-meta">
                  Comisión {c.sectionName} · {c.startTime}–{c.endTime}
                  {c.classroomName ? ` · ${c.classroomName}` : ""}
                </p>
              </div>
              {isAlumno && c.status === "SCHEDULED" && c.attendanceStatus && (
                <span className="calendar-today-status">
                  <StudentStatusBadge status={c.attendanceStatus} />
                  {c.attendanceComment && <span className="calendar-today-comment">{c.attendanceComment}</span>}
                </span>
              )}
              {isDocente && c.status === "SCHEDULED" && (
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={() => takeAttendance(c.sectionId, c.date)}
                >
                  {c.attendanceTaken ? "Editar asistencia" : "Tomar asistencia"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <AttendanceModal target={attendanceTarget} onClose={() => setAttendanceTarget(null)} onSaved={handleAttendanceSaved} />

      <Modal open={detail !== null} title={detail?.title ?? ""} onClose={() => setDetail(null)}>
        <ul className="calendar-detail-lines">
          {(detail?.lines ?? []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--primary" onClick={() => setDetail(null)}>
            Cerrar
          </button>
        </div>
      </Modal>

      <div className="calendar-wrapper">
        <ScheduleXCalendar
          calendarApp={calendarApp}
          customComponents={{ monthAgendaEvent: AgendaEvent, monthGridEvent: GridEvent }}
        />
      </div>
    </div>
  );
}
