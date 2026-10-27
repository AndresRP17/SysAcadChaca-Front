import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useTheme } from "../../context/ThemeContext";
import { getErrorMessage } from "../../shared/api/api";
import { todayIso } from "../../shared/utils/formatters";
import { getAttendanceRules } from "../grades/services/attendanceService";
import { DEFAULT_RULES, STUDENT_STATUS_LABELS, attendanceSummary } from "../attendance/attendanceStatus";
import { getCalendar } from "./services/calendarService";
import { AgendaEvent, GridEvent, StudentStatusBadge } from "./calendarEventViews";
import { evaluationTypeLabel } from "../grades/services/evaluationService";
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
  evaluation: {
    colorName: "evaluation",
    lightColors: { main: "#7c3aed", container: "#ede9fe", onContainer: "#4c1d95" },
    darkColors: { main: "#c4b5fd", container: "#4c1d95", onContainer: "#ede9fe" },
  },
  exam: {
    colorName: "exam",
    lightColors: { main: "#b91c1c", container: "#fee2e2", onContainer: "#7f1d1d" },
    darkColors: { main: "#fca5a5", container: "#7f1d1d", onContainer: "#fee2e2" },
  },
};

// Una mesa de final no tiene hora de fin: se dibuja con esta duracion.
const EXAM_DURATION_HOURS = 2;

// Periodos de inscripcion: no son eventos, se pinta el fondo de cada dia del periodo
// (verde las cursadas, azul los finales; si se superponen, mitad y mitad).
// Los mismos colores se usan en las casillas y en las referencias de arriba.
const PERIOD_COLORS = {
  CURSADA: { light: "#dcfce7", dark: "#1d4d32" },
  FINAL: { light: "#dbeafe", dark: "#1e3a6b" },
};

// Texto corto que va dentro de cada casilla pintada.
const PERIOD_DAY_LABELS = { CURSADA: "Inscripción a cursada", FINAL: "Inscripción a examen" };

function periodTitle(period) {
  if (period.type === "FINAL") return "Inscripción a examen";
  return period.term ? `Inscripción a cursada (${period.term}° cuat.)` : "Inscripción a cursada";
}

function periodLink(period) {
  return period.type === "FINAL" ? "/finales" : "/mis-cursadas";
}

// fecha (YYYY-MM-DD) -> tipos de periodo abiertos ese dia
function periodDays(periods) {
  const days = new Map();
  for (const p of periods) {
    const end = Temporal.PlainDate.from(p.endDate);
    for (let d = Temporal.PlainDate.from(p.startDate); Temporal.PlainDate.compare(d, end) <= 0; d = d.add({ days: 1 })) {
      const key = d.toString();
      if (!days.has(key)) days.set(key, new Set());
      days.get(key).add(p.type);
    }
  }
  return days;
}

function dayBackground(types, theme) {
  const colors = ["CURSADA", "FINAL"].filter((t) => types.has(t)).map((t) => PERIOD_COLORS[t][theme]);
  return colors.length === 1 ? colors[0] : `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
}

// Reglas CSS por fecha: la casilla del mes (data-date) y la cabecera del dia en la vista semanal.
// En la casilla del mes va ademas el texto de cada periodo: cursada en ::after y examen en ::before,
// cada uno con su color (estilos base en .calendar-wrapper, calendarPage.css). Con los dos, cursada
// queda arriba de examen.
function periodStyles(periods) {
  const rules = [];
  for (const [date, types] of periodDays(periods)) {
    const day = `.calendar-wrapper .sx__month-grid-day[data-date="${date}"]`;
    const selector = (prefix) => `${prefix} ${day}, ${prefix} .calendar-wrapper .sx__week-grid__date[data-date="${date}"]`;
    rules.push(`${selector("")} { background: ${dayBackground(types, "light")}; }`);
    rules.push(`${selector('[data-theme="dark"]')} { background: ${dayBackground(types, "dark")}; }`);
    rules.push(`${day} { cursor: pointer; }`);
    if (types.has("CURSADA")) {
      rules.push(`${day}::after { content: "${PERIOD_DAY_LABELS.CURSADA}"; bottom: ${types.has("FINAL") ? 17 : 3}px; }`);
    }
    if (types.has("FINAL")) {
      rules.push(`${day}::before { content: "${PERIOD_DAY_LABELS.FINAL}"; }`);
    }
  }
  return rules.join("\n");
}

// Tipos de periodo abiertos en una fecha (YYYY-MM-DD).
function periodTypesOn(periods, date) {
  return periods.filter((p) => p.startDate <= date && date <= p.endDate).map((p) => p.type);
}

function examEventId(exam) {
  return `exam-${exam.examEnrollmentId}`;
}

// Mesas de final a las que el Alumno esta inscripto.
function toExamEvents(exams) {
  return exams.map((x) => {
    const start = Temporal.ZonedDateTime.from(`${x.date}T${x.time}:00[${TIMEZONE}]`);
    return {
      id: examEventId(x),
      title: `Final · ${x.courseName}`,
      start,
      end: start.add({ hours: EXAM_DURATION_HOURS }),
      location: x.classroomName ?? undefined,
      calendarId: "exam",
    };
  });
}

function examResult(exam) {
  if (exam.status === "absent") return "Resultado: Ausente";
  if (exam.status === "present" && exam.finalGrade !== null) {
    return `Resultado: ${exam.finalGrade} (${exam.finalGrade >= 6 ? "Aprobado" : "Desaprobado"})`;
  }
  return "Estás inscripto. Todavía no rendiste.";
}

function examDetail(exam) {
  return {
    title: `Final · ${exam.courseName}`,
    lines: [
      `${formatDate(exam.date)}, ${exam.time} hs`,
      ...(exam.classroomName ? [`Aula: ${exam.classroomName}`] : []),
      examResult(exam),
    ],
    action: { label: "Ver mis finales", to: "/finales" },
  };
}

const CONDITION_LABELS = { APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", AUSENTE: "Ausente" };

function evaluationEventId(evaluation) {
  return `evaluation-${evaluation.evaluationId}`;
}

// Parciales (evaluaciones) de las comisiones del usuario: evento de dia completo.
function toEvaluationEvents(evaluations) {
  return evaluations.map((ev) => ({
    id: evaluationEventId(ev),
    title: `${ev.name} · ${ev.courseName}`,
    start: Temporal.PlainDate.from(ev.date),
    end: Temporal.PlainDate.from(ev.date),
    calendarId: "evaluation",
  }));
}

// El Alumno ve su nota; el Docente, un acceso directo a cargar las notas de ese parcial.
function evaluationDetail(ev, { isAlumno, isDocente }) {
  const grade =
    ev.condition === "AUSENTE"
      ? "Tu resultado: Ausente"
      : ev.condition
        ? `Tu nota: ${String(ev.gradeValue).replace(".", ",")} (${CONDITION_LABELS[ev.condition] ?? ev.condition})`
        : "Todavía no tiene nota cargada";

  return {
    title: `${ev.name} · ${ev.courseName}`,
    lines: [
      evaluationTypeLabel(ev.type),
      `Comisión ${ev.sectionName}`,
      ev.startTime ? `${formatDate(ev.date)}, ${ev.startTime}${ev.endTime ? ` a ${ev.endTime}` : ""}` : formatDate(ev.date),
      ...(ev.visible === false ? ["Oculta: los alumnos todavía no la ven"] : []),
      ...(isAlumno ? [grade] : []),
    ],
    action: isDocente
      ? { label: "Cargar notas", to: `/comision/${ev.sectionId}?evaluacion=${ev.evaluationId}` }
      : null,
  };
}


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
  const { darkMode } = useTheme();

  const [today, setToday] = useState({ classes: [], evaluations: [], periods: [], exams: [], loaded: false });
  const [missingTerms, setMissingTerms] = useState([]);
  const [error, setError] = useState("");
  const [todayError, setTodayError] = useState("");
  const [attendance, setAttendance] = useState(null); // { total, justified, credit, percentage } (solo Alumno)
  const [detail, setDetail] = useState(null); // { title, lines } de la clase tocada
  const [attendanceTarget, setAttendanceTarget] = useState(null); // { sectionId, date } de la clase cuya asistencia se esta tomando

  const classesRef = useRef({}); // clases del rango visible por id de evento, para resolver el clic
  const evaluationsRef = useRef({}); // parciales del rango visible por id de evento
  const [periods, setPeriods] = useState([]); // periodos de inscripcion abiertos o por abrir (solo Alumno)
  const periodCss = useMemo(() => periodStyles(periods), [periods]);
  // Schedule-X guarda los callbacks al crearse: leen los periodos de aca para no quedar viejos.
  const periodsRef = useRef([]);
  useEffect(() => {
    periodsRef.current = periods;
  }, [periods]);
  const navigate = useNavigate();
  const examsRef = useRef({}); // finales del Alumno por id de evento

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
          const evaluations = data.evaluations ?? [];
          evaluations.forEach((ev) => {
            evaluationsRef.current[evaluationEventId(ev)] = ev;
          });
          // Periodos de inscripcion y finales: solo los ve el Alumno (es quien se inscribe).
          // Los periodos no son eventos: se juntan (sin repetir entre rangos) para pintar los dias.
          const exams = isAlumno ? data.examEnrollments ?? [] : [];
          exams.forEach((x) => {
            examsRef.current[examEventId(x)] = x;
          });
          if (isAlumno) {
            const incoming = data.enrollmentPeriods ?? [];
            setPeriods((prev) => {
              const known = new Set(prev.map((p) => p.enrollmentPeriodId));
              const added = incoming.filter((p) => !known.has(p.enrollmentPeriodId));
              return added.length ? [...prev, ...added] : prev;
            });
          }
          setMissingTerms((prev) => (JSON.stringify(prev) === JSON.stringify(data.missingTerms) ? prev : data.missingTerms));
          setError("");
          return [
            ...toCalendarEvents(data.events, isDocente),
            ...toEvaluationEvents(evaluations),
            ...toExamEvents(exams),
          ];
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
      isDark: darkMode,
      timezone: TIMEZONE,
      firstDayOfWeek: MONDAY,
      defaultView: isNarrow ? "month-agenda" : "month-grid",
      views: [createViewMonthAgenda(), createViewMonthGrid(), createViewWeek(), createViewList()],
      calendars: CALENDARS,
      callbacks: {
        fetchEvents,
        // Tocar un dia pintado lleva a la inscripcion. Si el clic fue sobre un evento (clase,
        // parcial, final) o "+ N mas", lo resuelve ese elemento.
        onClickDate(date, e) {
          if (!isAlumno || e?.target?.closest?.(".sx__month-grid-event, .sx__month-grid-day__events-more")) return;

          const types = periodTypesOn(periodsRef.current, date.toString());

          if (types.length === 0) return;

          if (types.length === 1) {
            navigate(types[0] === "FINAL" ? "/finales" : "/mis-cursadas");
            return;
          }

          setDetail({
            title: `Inscripciones abiertas · ${formatDate(date.toString())}`,
            lines: ["Ese día podés inscribirte a cursadas y a exámenes."],
            actions: [
              { label: "Inscribirme a cursadas", to: "/mis-cursadas" },
              { label: "Inscribirme a un examen", to: "/finales" },
            ],
          });
        },
        onEventClick(event) {
          const evaluation = evaluationsRef.current[event.id];

          if (evaluation) {
            setDetail(evaluationDetail(evaluation, { isAlumno, isDocente }));
            return;
          }

          const exam = examsRef.current[event.id];

          if (exam) {
            setDetail(examDetail(exam));
            return;
          }

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

  // El calendario sigue al modo claro / oscuro de la app (sin esto quedaba siempre claro).
  useEffect(() => {
    calendarApp?.setTheme(darkMode ? "dark" : "light");
  }, [calendarApp, darkMode]);

  useEffect(() => {
    const date = todayIso();
    getCalendar(date, date)
      .then((data) =>
        setToday({
          classes: data.events,
          evaluations: data.evaluations ?? [],
          periods: data.enrollmentPeriods ?? [],
          exams: data.examEnrollments ?? [],
          loaded: true,
        }),
      )
      .catch((err) => {
        setTodayError(getErrorMessage(err, "No se pudieron cargar las clases de hoy."));
        setToday({ classes: [], evaluations: [], periods: [], exams: [], loaded: true });
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
  // Botones del detalle: uno (parcial, final) o varios (dia con las dos inscripciones abiertas).
  const detailActions = detail?.actions ?? (detail?.action ? [detail.action] : []);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Calendario</h1>
          <p className="users-subtitle">
            {isDocente
              ? "Tus clases y parciales. Tocá una clase para tomar asistencia."
              : "Tus clases, parciales, finales y períodos de inscripción, y tu asistencia."}
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
        {isAlumno &&
          today.exams.map((x) => (
            <p key={`exam-${x.examEnrollmentId}`} className="calendar-today-exam">
              Hoy tenés el final de {x.courseName} a las {x.time}
              {x.classroomName ? ` (${x.classroomName})` : ""}
            </p>
          ))}
        {isAlumno &&
          today.periods.map((p) => (
            <p key={`period-${p.enrollmentPeriodId}`} className="calendar-today-period">
              {periodTitle(p)} abierta hasta el {formatDate(p.endDate)}.{" "}
              <Link to={periodLink(p)}>Inscribirme</Link>
            </p>
          ))}
        {today.evaluations.map((ev) => (
          <p key={ev.evaluationId} className="calendar-today-evaluation">
            {isAlumno ? "Tenés" : "Hay"} {ev.name} de {ev.courseName} (comisión {ev.sectionName})
          </p>
        ))}
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
          {detailActions.map((action) => (
            <Link key={action.to} to={action.to} className="users-btn users-btn--primary">
              {action.label}
            </Link>
          ))}
          <button
            type="button"
            className={`users-btn ${detailActions.length ? "users-btn--ghost" : "users-btn--primary"}`}
            onClick={() => setDetail(null)}
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {isAlumno && periods.length > 0 && (
        <section className="calendar-periods" aria-label="Períodos de inscripción">
          <style>{periodCss}</style>
          <ul className="calendar-periods-list">
            {[...periods]
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .map((p) => (
                <li key={p.enrollmentPeriodId}>
                  <span
                    className="calendar-period-swatch"
                    style={{ background: PERIOD_COLORS[p.type === "FINAL" ? "FINAL" : "CURSADA"][darkMode ? "dark" : "light"] }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{periodTitle(p)}</strong>: del {formatDate(p.startDate)} al {formatDate(p.endDate)}.{" "}
                    <Link to={periodLink(p)}>Inscribirme</Link>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="calendar-wrapper">
        <ScheduleXCalendar
          calendarApp={calendarApp}
          customComponents={{ monthAgendaEvent: AgendaEvent, monthGridEvent: GridEvent }}
        />
      </div>
    </div>
  );
}
