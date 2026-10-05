import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { getErrorMessage } from "../../../shared/api/api";
import { getAcademicThresholds } from "../../exams/services/academicThresholdsService";

const OUTCOME_LABELS = {
  PROMOCIONADO: "Promocionado",
  REGULAR: "Regular",
  LIBRE: "Libre",
};

// Cierra todas las inscripciones activas de la comision de una sola vez
// (POST /sections/{id}/close): calcula nota final y resultado por alumno a
// partir de la asistencia y las notas ya cargadas. Es idempotente del lado
// del backend, pero en la practica no tiene vuelta atras -- se confirma antes.
export default function CloseSectionModal({ open, section, onClose, onSubmit, onClosed }) {
  const [phase, setPhase] = useState("confirm"); // "confirm" | "result"
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [thresholds, setThresholds] = useState(null);

  useEffect(() => {
    if (open) {
      setPhase("confirm");
      setResults([]);
      setError("");
      getAcademicThresholds().then(setThresholds).catch(() => setThresholds(null));
    }
  }, [open, section]);

  if (!open) return null;

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const response = await onSubmit();
      setResults(response.results ?? []);
      setPhase("result");
      onClosed?.();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cerrar la comision."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Cerrar comisión" onClose={onClose}>
      {phase === "confirm" && (
        <>
          <p className="users-confirm-text">
            Se va a cerrar <strong>{section?.courseName ?? "esta comisión"} — {section?.name}</strong>:
            se calcula la nota final y el resultado (Promocionado/Regular/Libre) de cada alumno
            inscripto, a partir de la asistencia y las notas ya cargadas.
          </p>
          {thresholds && (
            <p className="users-subtitle">
              Regulariza con nota final ≥ {thresholds.minRegular}, promociona con ≥ {thresholds.minPromotion}.
            </p>
          )}
          <p className="users-confirm-text">Esta acción no tiene vuelta atrás en la práctica. ¿Confirmás?</p>

          {error && <p className="users-form-error">{error}</p>}

          <div className="users-form-actions">
            <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="users-btn users-btn--success"
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? "Cerrando..." : "Cerrar comisión"}
            </button>
          </div>
        </>
      )}

      {phase === "result" && (
        <>
          <p className="users-confirm-text">Comisión cerrada. Resultado por alumno:</p>

          {results.length === 0 && <p className="users-empty">No había alumnos con inscripción activa.</p>}

          {results.length > 0 && (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="users-th">Alumno</th>
                    <th className="users-th users-th--center">Asistencia</th>
                    <th className="users-th users-th--center">Promedio</th>
                    <th className="users-th users-th--center">Nota final</th>
                    <th className="users-th users-th--center">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.enrollmentId}>
                      <td className="users-td">{r.studentFirstName} {r.studentLastName}</td>
                      <td className="users-td users-td--center">
                        {r.attendancePercentage != null ? `${Math.round(r.attendancePercentage)}%` : "—"}
                      </td>
                      <td className="users-td users-td--center">
                        {r.courseGradeAverage != null ? r.courseGradeAverage.toFixed(1) : "—"}
                      </td>
                      <td className="users-td users-td--center">{r.finalGrade}</td>
                      <td className="users-td users-td--center">{OUTCOME_LABELS[r.outcome] ?? r.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="users-form-actions">
            <button type="button" className="users-btn users-btn--primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
