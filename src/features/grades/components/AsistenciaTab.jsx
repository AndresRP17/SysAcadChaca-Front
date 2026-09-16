import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import {
  getAttendancesBySectionAndDate,
  createAttendance,
  updateAttendance,
} from "../services/attendanceService";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AsistenciaTab({ sectionId, enrollments }) {
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, attendanceId, present }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
              present: found ? found.present : true,
            };
          }),
        );
      } catch (err) {
        setError(getErrorMessage(err, "No se pudo cargar la asistencia."));
      } finally {
        setLoading(false);
      }
    }

    if (sectionId && enrollments.length > 0) load();
    else setRows([]);
  }, [sectionId, date, enrollments]);

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
      setMessage("Asistencia guardada.");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar la asistencia."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="users-form-field" style={{ maxWidth: 220 }}>
        <label className="users-form-label">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="users-form-input"
        />
      </div>

      {error && <p className="users-form-error">{error}</p>}
      {message && <p className="users-subtitle">{message}</p>}
      {loading && <p className="users-empty">Cargando...</p>}

      {!loading && rows.length === 0 && (
        <p className="users-empty">No hay alumnos inscriptos en esta comision.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Presente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.enrollmentId}>
                    <td className="users-td">{row.studentName}</td>
                    <td className="users-td">
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
