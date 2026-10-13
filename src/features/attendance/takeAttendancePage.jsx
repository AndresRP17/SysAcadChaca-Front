import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../shared/api/api";
import { getCalendar } from "../calendar/services/calendarService";
import { getEnrollmentsBySection } from "../grades/services/enrollmentService";
import {
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
} from "../grades/services/attendanceService";
import "../users/usersPage.css";
import "./takeAttendancePage.css";

function formatLongDate(isoDate) {
  const text = new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Asistencia de UNA clase: se llega desde el calendario (o la tarjeta "Hoy") con la
// comision y la fecha ya definidas, asi que no hay nada que elegir -- solo marcar y guardar.
export default function TakeAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("section");
  const date = searchParams.get("date");
  const validParams = /^\d+$/.test(sectionId ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");

  const [loading, setLoading] = useState(validParams);
  const [error, setError] = useState(validParams ? "" : "Falta indicar la clase. Elegila desde el calendario.");
  const [classInfo, setClassInfo] = useState(null);
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, attendanceId, present: true | false | null (sin marcar) }
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validParams) return undefined;

    let cancelled = false;

    Promise.all([
      getCalendar(date, date),
      getEnrollmentsBySection(sectionId),
      getAttendancesBySectionAndDate(sectionId, date),
    ])
      .then(([calendar, enrollments, attendances]) => {
        if (cancelled) return;

        const lesson = calendar.events.find((e) => String(e.sectionId) === sectionId);

        if (!lesson) {
          setError("No tenés una clase de esa comisión ese día.");
          return;
        }

        const byEnrollment = new Map(attendances.map((a) => [a.enrollmentId, a]));

        setClassInfo(lesson);
        setEditing(attendances.length > 0);
        setRows(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return {
              enrollmentId: e.id,
              studentName: `${e.studentFirstName} ${e.studentLastName}`,
              attendanceId: found?.id ?? null,
              // Sin marcar a proposito: ni presente ni ausente hasta que el docente lo decida.
              present: found ? found.present : null,
            };
          }),
        );
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "No se pudo cargar la clase."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [validParams, sectionId, date]);

  const presentCount = rows.filter((r) => r.present === true).length;
  const absentCount = rows.filter((r) => r.present === false).length;
  const unmarkedCount = rows.length - presentCount - absentCount;
  const canTakeAttendance = classInfo?.status === "SCHEDULED";

  function choose(enrollmentId, present) {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, present } : r)));
  }

  function markAllPresent() {
    setRows((prev) => prev.map((r) => ({ ...r, present: true })));
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      for (const row of rows) {
        const payload = { enrollment_id: row.enrollmentId, date, present: row.present === true ? 1 : 0 };

        if (row.attendanceId) {
          await updateAttendance(row.attendanceId, payload);
        } else {
          await createAttendance(payload);
        }
      }

      navigate("/calendario");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar la asistencia."));
      setSaving(false);
    }
  }

  return (
    <div className="users-page take-attendance">
      <Link to="/calendario" className="take-attendance-back">
        ← Calendario
      </Link>

      {loading && <p className="users-empty">Cargando...</p>}

      {error && <p className="users-form-error">{error}</p>}

      {classInfo && (
        <>
          <div className="take-attendance-header">
            <h1 className="users-title">{classInfo.courseName}</h1>
            <p className="users-subtitle">
              Comisión {classInfo.sectionName} · {formatLongDate(date)} · {classInfo.startTime}–{classInfo.endTime}
              {classInfo.classroomName ? ` · ${classInfo.classroomName}` : ""}
            </p>
            {editing && canTakeAttendance && (
              <p className="take-attendance-editing">Ya hay asistencia cargada: estás editándola.</p>
            )}
          </div>

          {!canTakeAttendance && (
            <p className="users-form-error">
              {classInfo.status === "HOLIDAY" ? "Feriado" : "Clase cancelada"}: {classInfo.reason}. No se toma asistencia.
            </p>
          )}

          {canTakeAttendance && rows.length === 0 && !loading && (
            <p className="users-empty">No hay alumnos inscriptos en esta comisión.</p>
          )}

          {canTakeAttendance && rows.length > 0 && (
            <>
              <div className="take-attendance-toolbar">
                <p className="take-attendance-count">
                  <span className="take-attendance-pill take-attendance-pill--present">Presentes {presentCount}</span>
                  <span className="take-attendance-pill take-attendance-pill--absent">Ausentes {absentCount}</span>
                  <span className="take-attendance-pill">Sin marcar {unmarkedCount}</span>
                </p>
                <button type="button" className="users-btn users-btn--ghost" onClick={markAllPresent}>
                  Marcar todos presentes
                </button>
              </div>

              <ul className="attendance-list">
                {rows.map((row) => (
                  <li key={row.enrollmentId}>
                    <div className="attendance-row">
                      <span className="attendance-row-name">{row.studentName}</span>
                      <div className="attendance-choices" role="group" aria-label={`Asistencia de ${row.studentName}`}>
                        <button
                          type="button"
                          aria-pressed={row.present === true}
                          className={`attendance-choice attendance-choice--present ${row.present === true ? "is-selected" : ""}`}
                          onClick={() => choose(row.enrollmentId, true)}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          aria-pressed={row.present === false}
                          className={`attendance-choice attendance-choice--absent ${row.present === false ? "is-selected" : ""}`}
                          onClick={() => choose(row.enrollmentId, false)}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="take-attendance-footer">
                {unmarkedCount > 0 && (
                  <p className="take-attendance-hint">
                    Falta marcar a {unmarkedCount} {unmarkedCount === 1 ? "alumno" : "alumnos"} para poder guardar.
                  </p>
                )}
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={handleSave}
                  disabled={saving || unmarkedCount > 0}
                >
                  {saving ? "Guardando..." : "Guardar asistencia"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
