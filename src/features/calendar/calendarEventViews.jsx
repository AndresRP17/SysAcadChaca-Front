// Como se dibuja cada clase en el calendario. La idea: que se note que se puede tocar.
// En la agenda del dia (celular) cada clase es una tarjeta con un boton visible; en la
// grilla del mes (computadora) el chip lleva una flecha.

import { STUDENT_BADGES } from "../attendance/attendanceStatus";

// Estado de la clase para el Alumno, con su comentario si lo hay.
export function StudentStatusBadge({ status }) {
  const badge = STUDENT_BADGES[status];
  if (!badge) return null;
  return <span className={`cal-event-status cal-event-status--${badge.tone}`}>{badge.text}</span>;
}

function formatTime(zoned) {
  if (!zoned || typeof zoned.hour !== "number") return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(zoned.hour)}:${pad(zoned.minute)}`;
}

export function AgendaEvent({ calendarEvent }) {
  const { title, location, actionLabel, attendanceTaken, attendanceStatus, attendanceComment, calendarId } = calendarEvent;
  const time = calendarId === "holiday" ? "" : `${formatTime(calendarEvent.start)} – ${formatTime(calendarEvent.end)}`;

  return (
    <div className="cal-event">
      <p className="cal-event-title">{title}</p>
      {(time || location) && (
        <p className="cal-event-meta">
          {time}
          {time && location ? " · " : ""}
          {location}
        </p>
      )}
      {attendanceStatus && (
        <div className="cal-event-footer">
          <StudentStatusBadge status={attendanceStatus} />
        </div>
      )}
      {attendanceStatus && attendanceComment && <p className="cal-event-comment">{attendanceComment}</p>}
      {actionLabel && (
        <div className="cal-event-footer">
          <span className={`cal-event-status ${attendanceTaken ? "cal-event-status--done" : "cal-event-status--pending"}`}>
            {attendanceTaken ? "Asistencia cargada ✓" : "Falta tomar asistencia"}
          </span>
          <span className="cal-event-action">{actionLabel} ›</span>
        </div>
      )}
    </div>
  );
}

export function GridEvent({ calendarEvent }) {
  const { title, actionLabel, calendarId, attendanceStatus } = calendarEvent;

  return (
    <span className={`cal-chip cal-chip--${calendarId ?? "scheduled"} ${actionLabel ? "cal-chip--action" : ""}`} title={actionLabel ?? title}>
      <span className="cal-chip-text">{title}</span>
      {actionLabel && <span className="cal-chip-arrow">›</span>}
      {STUDENT_BADGES[attendanceStatus] && (
        <span
          className={`cal-chip-mark cal-chip-mark--${STUDENT_BADGES[attendanceStatus].tone}`}
          title={STUDENT_BADGES[attendanceStatus].text}
        >
          {STUDENT_BADGES[attendanceStatus].mark}
        </span>
      )}
    </span>
  );
}
