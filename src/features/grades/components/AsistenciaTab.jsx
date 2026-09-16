import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { getSectionSchedules } from "../../sections/services/sectionScheduleService";
import {
  getAttendancesBySection,
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
} from "../services/attendanceService";

const WEEKDAY_INDEX = { LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 };
const INDEX_TO_WEEKDAY = Object.fromEntries(Object.entries(WEEKDAY_INDEX).map(([k, v]) => [v, k]));

function formatTime(time) {
  return time?.slice(0, 5) ?? "";
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function weekdayOf(isoDate) {
  return INDEX_TO_WEEKDAY[new Date(`${isoDate}T00:00:00`).getDay()];
}

// Fecha real mas reciente (hoy o antes) que caiga en el dia de semana de la
// clase elegida — asi al entrar a "Lunes 08:00-10:00" no te aparece un
// selector de fecha en blanco, ya te sugiere la ultima vez que esa clase se dio.
function mostRecentDateForWeekday(weekday) {
  const target = WEEKDAY_INDEX[weekday];
  const today = new Date();
  const diff = (today.getDay() - target + 7) % 7;
  today.setDate(today.getDate() - diff);
  return today.toISOString().slice(0, 10);
}

export default function AsistenciaTab({ sectionId, enrollments }) {
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState("");
  const [takenDates, setTakenDates] = useState([]); // fechas con asistencia ya cargada para la clase elegida
  const [date, setDate] = useState("");
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, attendanceId, present }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setScheduleId("");
    setDate("");
    setRows([]);

    if (!sectionId) {
      setSchedules([]);
      return;
    }

    getSectionSchedules(sectionId)
      .then(setSchedules)
      .catch((err) => setError(getErrorMessage(err, "No se pudieron cargar los horarios de la comision.")));
  }, [sectionId]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === scheduleId),
    [schedules, scheduleId],
  );

  async function selectSchedule(schedule) {
    setMessage("");
    setError("");
    setScheduleId(String(schedule.id));
    setDate("");

    try {
      const all = await getAttendancesBySection(sectionId);
      const uniqueDates = [...new Set(all.map((a) => a.date))];
      const matching = uniqueDates.filter((d) => weekdayOf(d) === schedule.weekday).sort().reverse();
      setTakenDates(matching);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las fechas ya tomadas."));
    }
  }

  function startNewDate() {
    setDate(mostRecentDateForWeekday(selectedSchedule.weekday));
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const existing = await getAttendancesBySectionAndDate(sectionId, date);
        const byEnrollment = new Map(existing.map((a) => [a.enrollmentId, a]));

        setRows(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return {
              enrollmentId: e.id,
              studentName: `${e.studentFirstName} ${e.studentLastName}`,
              attendanceId: found?.id ?? null,
              // Default en false a proposito: preferimos que el docente marque
              // presentes a mano antes que asumir que todos vinieron.
              present: found ? found.present : false,
            };
          }),
        );
      } catch (err) {
        setError(getErrorMessage(err, "No se pudo cargar la asistencia."));
      } finally {
        setLoading(false);
      }
    }

    if (scheduleId && date && enrollments.length > 0) load();
    else setRows([]);
  }, [sectionId, scheduleId, date, enrollments]);

  function togglePresent(enrollmentId) {
    setRows((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, present: !r.present } : r)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      for (const row of rows) {
        const payload = { enrollment_id: row.enrollmentId, date, present: row.present ? 1 : 0 };

        if (row.attendanceId) {
          await updateAttendance(row.attendanceId, payload);
        } else {
          await createAttendance(payload);
        }
      }
      setMessage(`Asistencia del ${formatDate(date)} guardada.`);
      // Cierra la planilla y vuelve al listado de fechas de esta clase, para
      // que quede claro que la accion termino en vez de dejar la tabla abierta.
      setDate("");
      setTakenDates((prev) => (prev.includes(date) ? prev : [date, ...prev].sort().reverse()));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar la asistencia."));
    } finally {
      setSaving(false);
    }
  }

  if (schedules.length === 0) {
    return <p className="users-empty">Esta comision todavia no tiene horarios asignados.</p>;
  }

  return (
    <div>
      <p className="users-form-label">Elegí la clase</p>
      <div className="users-form-row" style={{ flexWrap: "wrap", gap: 8 }}>
        {schedules.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`users-btn ${String(s.id) === scheduleId ? "users-btn--primary" : "users-btn--ghost"}`}
            onClick={() => selectSchedule(s)}
          >
            {s.weekday} {formatTime(s.startTime)}-{formatTime(s.endTime)} ({s.classroomName})
          </button>
        ))}
      </div>

      {error && <p className="users-form-error">{error}</p>}

      {selectedSchedule && !date && (
        <div style={{ marginTop: 16 }}>
          <p className="users-form-label">Fechas ya tomadas</p>
          {takenDates.length === 0 && (
            <p className="users-empty">Todavía no se tomó asistencia en esta clase.</p>
          )}
          <div className="users-form-row" style={{ flexWrap: "wrap", gap: 8 }}>
            {takenDates.map((d) => (
              <button
                key={d}
                type="button"
                className="users-btn users-btn--ghost"
                onClick={() => setDate(d)}
              >
                {formatDate(d)}
              </button>
            ))}
            <button type="button" className="users-btn users-btn--primary" onClick={startNewDate}>
              + Nueva fecha
            </button>
          </div>
        </div>
      )}

      {date && (
        <div className="users-form-field" style={{ maxWidth: 220, marginTop: 16 }}>
          <label className="users-form-label">
            Fecha {takenDates.includes(date) ? "(editando asistencia ya cargada)" : "(nueva)"}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="users-form-input"
          />
          <button
            type="button"
            className="users-btn users-btn--ghost"
            style={{ marginTop: 8 }}
            onClick={() => setDate("")}
          >
            ← Volver a fechas
          </button>
        </div>
      )}

      {message && <p className="users-subtitle">{message}</p>}
      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && date && rows.length === 0 && (
        <p className="users-empty">No hay alumnos inscriptos en esta comision.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="users-th">Alumno</th>
                  <th className="users-th users-th--center">Presente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.enrollmentId}>
                    <td className="users-td">{row.studentName}</td>
                    <td className="users-td users-td--center">
                      <input
                        type="checkbox"
                        checked={row.present}
                        onChange={() => togglePresent(row.enrollmentId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-form-actions">
            <button
              type="button"
              className="users-btn users-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar asistencia"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
