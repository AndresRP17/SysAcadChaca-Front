import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { getEvaluationsBySection, createEvaluation } from "../services/evaluationService";
import { getGradesByEvaluation, createGrade, updateGrade } from "../services/evaluationGradeService";

const CONDITIONS = ["APROBADO", "DESAPROBADO", "AUSENTE"];

export default function NotasTab({ sectionId, enrollments }) {
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationId, setEvaluationId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, gradeId, gradeValue, condition }
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sectionId) return;

    getEvaluationsBySection(sectionId)
      .then((data) => {
        setEvaluations(data);
        if (data.length > 0) setEvaluationId(String(data[0].id));
      })
      .catch((err) => setError(getErrorMessage(err, "No se pudieron cargar las evaluaciones.")));
  }, [sectionId]);

  useEffect(() => {
    async function load() {
      if (!evaluationId) {
        setRows([]);
        return;
      }

      setError("");
      setMessage("");
      try {
        const existing = await getGradesByEvaluation(evaluationId);
        const byEnrollment = new Map(existing.map((g) => [g.enrollmentId, g]));

        setRows(
          enrollments.map((e) => {
            const found = byEnrollment.get(e.id);
            return {
              enrollmentId: e.id,
              studentName: `${e.studentFirstName} ${e.studentLastName}`,
              gradeId: found?.id ?? null,
              gradeValue: found?.gradeValue ?? "",
              condition: found?.condition ?? "APROBADO",
            };
          }),
        );
      } catch (err) {
        setError(getErrorMessage(err, "No se pudieron cargar las notas."));
      }
    }

    load();
  }, [evaluationId, enrollments]);

  async function handleCreateEvaluation(e) {
    e.preventDefault();
    setError("");

    if (!newName.trim() || !newDate) {
      setError("Completá nombre y fecha de la evaluacion.");
      return;
    }

    try {
      const created = await createEvaluation({ section_id: sectionId, name: newName, date: newDate });
      setEvaluations((prev) => [created, ...prev]);
      setEvaluationId(String(created.id));
      setNewName("");
      setNewDate("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear la evaluacion."));
    }
  }

  function updateRow(enrollmentId, field, value) {
    setRows((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, [field]: value } : r)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      for (const row of rows) {
        const payload = {
          evaluation_id: evaluationId,
          enrollment_id: row.enrollmentId,
          grade_value: row.gradeValue === "" ? null : row.gradeValue,
          condition: row.condition,
        };

        if (row.gradeId) {
          await updateGrade(row.gradeId, payload);
        } else {
          await createGrade(payload);
        }
      }
      setMessage("Notas guardadas.");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron guardar las notas."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreateEvaluation} className="users-form-row" style={{ alignItems: "flex-end" }}>
        <div className="users-form-field">
          <label className="users-form-label">Nueva evaluacion</label>
          <input
            type="text"
            placeholder="Ej: Primer Parcial"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="users-form-input"
          />
        </div>
        <div className="users-form-field">
          <label className="users-form-label">Fecha</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="users-form-input"
          />
        </div>
        <button type="submit" className="users-btn users-btn--primary">
          Crear evaluacion
        </button>
      </form>

      <div className="users-form-field" style={{ maxWidth: 400 }}>
        <label className="users-form-label">Evaluacion</label>
        <select
          value={evaluationId}
          onChange={(e) => setEvaluationId(e.target.value)}
          className="users-form-input"
        >
          <option value="">Seleccioná una evaluacion...</option>
          {evaluations.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.date})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="users-form-error">{error}</p>}
      {message && <p className="users-subtitle">{message}</p>}

      {evaluationId && rows.length > 0 && (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="users-th">Alumno</th>
                  <th className="users-th users-th--center">Nota</th>
                  <th className="users-th users-th--center">Condicion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.enrollmentId}>
                    <td className="users-td">{row.studentName}</td>
                    <td className="users-td users-td--center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={row.gradeValue}
                        onChange={(e) => updateRow(row.enrollmentId, "gradeValue", e.target.value)}
                        className="users-form-input"
                        style={{ width: 80, margin: "0 auto" }}
                      />
                    </td>
                    <td className="users-td users-td--center">
                      <select
                        value={row.condition}
                        onChange={(e) => updateRow(row.enrollmentId, "condition", e.target.value)}
                        className="users-form-input"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
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
              {saving ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
