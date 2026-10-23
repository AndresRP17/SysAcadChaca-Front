import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/api";
import { useToast } from "../../../context/ToastContext";
import LoadError from "../../../shared/ui/LoadError";
import FormError from "../../../shared/ui/FormError";
import { getEvaluationsBySection, createEvaluation } from "../services/evaluationService";
import { getGradesByEvaluation, createGrade, updateGrade } from "../services/evaluationGradeService";
import { isByEquivalence } from "../services/enrollmentService";

// "" = Sin cargar: nadie arranca aprobado, la condición la elige el docente al cargar la nota.
const CONDITIONS = [
  { value: "APROBADO", label: "Aprobado" },
  { value: "DESAPROBADO", label: "Desaprobado" },
  { value: "AUSENTE", label: "Ausente" },
];
const NEEDS_GRADE = new Set(["APROBADO", "DESAPROBADO"]);

export default function NotasTab({ sectionId, enrollments }) {
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationId, setEvaluationId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, gradeId, gradeValue, condition }
  const { showToast } = useToast();
  const [loadError, setLoadError] = useState("");
  const [createError, setCreateError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams] = useSearchParams();
  const requestedEvaluationId = searchParams.get("evaluacion");

  useEffect(() => {
    // Si no se resetea acá, al cambiar de comisión queda seleccionada la
    // evaluación de la comisión anterior cuando la nueva todavía no tiene
    // ninguna — y las notas que se guarden quedan cruzadas (evaluation_id
    // de una comisión, enrollment_id de otra).
    setEvaluationId("");
    setEvaluations([]);
    setRows([]);
    setLoadError("");

    if (!sectionId) return;

    getEvaluationsBySection(sectionId)
      .then((data) => {
        setEvaluations(data);
        // Desde el calendario se llega con ?evaluacion=ID: queda elegida esa evaluacion.
        const requested = data.find((ev) => String(ev.id) === requestedEvaluationId);
        if (requested) setEvaluationId(String(requested.id));
        else if (data.length > 0) setEvaluationId(String(data[0].id));
      })
      .catch((err) => setLoadError(getErrorMessage(err, "No se pudieron cargar las evaluaciones.")));
  }, [sectionId, reloadKey, requestedEvaluationId]);

  useEffect(() => {
    async function load() {
      if (!evaluationId) {
        setRows([]);
        return;
      }

      setLoadError("");
      setSaveError("");
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
              condition: found?.condition ?? "",
              dirty: false,
              // Cursada por equivalencia: el backend le pone la nota de la equivalencia en cada
              // evaluacion y no deja cambiarla.
              byEquivalence: isByEquivalence(e),
            };
          }),
        );
      } catch (err) {
        setLoadError(getErrorMessage(err, "No se pudieron cargar las notas."));
      }
    }

    load();
  }, [evaluationId, enrollments, reloadKey]);

  async function handleCreateEvaluation(e) {
    e.preventDefault();
    setCreateError("");

    if (!newName.trim() || !newDate) {
      setCreateError("Completá nombre y fecha de la evaluación.");
      return;
    }

    try {
      const created = await createEvaluation({ section_id: sectionId, name: newName, date: newDate });
      setEvaluations((prev) => [created, ...prev]);
      setEvaluationId(String(created.id));
      setNewName("");
      setNewDate("");
      showToast("Evaluación creada.");
    } catch (err) {
      setCreateError(getErrorMessage(err, "No se pudo crear la evaluación."));
    }
  }

  function updateRow(enrollmentId, field, value) {
    setRows((prev) =>
      prev.map((r) =>
        r.enrollmentId === enrollmentId && !r.byEquivalence ? { ...r, [field]: value, dirty: true } : r,
      ),
    );
  }

  // Solo cuentan las filas con condición elegida ("Sin cargar" no se envía).
  const loadedCount = rows.filter((r) => r.condition !== "").length;
  const missingCount = rows.length - loadedCount;
  const pendingRows = rows.filter((r) => r.dirty && r.condition !== "");

  async function handleSave() {
    setSaveError("");

    const incomplete = pendingRows.find((r) => NEEDS_GRADE.has(r.condition) && r.gradeValue === "");
    if (incomplete) {
      setSaveError(`Cargá la nota de ${incomplete.studentName} o cambiá su condición a Ausente.`);
      return;
    }
    const stray = rows.find((r) => r.dirty && r.condition === "" && r.gradeValue !== "");
    if (stray) {
      setSaveError(`Elegí la condición de ${stray.studentName} (cargaste una nota pero falta la condición).`);
      return;
    }
    if (pendingRows.length === 0) {
      setSaveError("No hay notas nuevas para guardar. Cargá la nota y la condición de al menos un alumno.");
      return;
    }

    setSaving(true);
    let saved = 0;
    try {
      for (const row of pendingRows) {
        const payload = {
          evaluation_id: evaluationId,
          enrollment_id: row.enrollmentId,
          grade_value: row.gradeValue === "" ? null : row.gradeValue,
          condition: row.condition,
        };

        let result;
        if (row.gradeId) {
          result = await updateGrade(row.gradeId, payload);
        } else {
          result = await createGrade(payload);
        }
        saved += 1;
        // Lo guardado queda marcado: si un alumno posterior falla, reintentar no duplica.
        setRows((prev) =>
          prev.map((r) =>
            r.enrollmentId === row.enrollmentId ? { ...r, dirty: false, gradeId: result?.id ?? r.gradeId } : r,
          ),
        );
      }
      showToast(`Notas guardadas (${saved} ${saved === 1 ? "alumno" : "alumnos"}).`);
      // Cierra la planilla de notas y vuelve al selector de evaluacion.
      setEvaluationId("");
    } catch (err) {
      const prefix = saved > 0 ? `Se guardaron ${saved} notas, pero hubo un problema: ` : "";
      setSaveError(prefix + getErrorMessage(err, "No se pudieron guardar las notas."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreateEvaluation} className="users-form-row notas-new-form">
        <div className="users-form-field">
          <label className="users-form-label">Nueva evaluación</label>
          <input
            type="text"
            placeholder="Ej: Primer Parcial"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="users-form-input"
            aria-label="Nombre de la evaluación"
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
          Crear evaluación
        </button>
      </form>
      <FormError message={createError} />

      <div className="users-form-field notas-select">
        <label className="users-form-label">Evaluación</label>
        <select
          value={evaluationId}
          onChange={(e) => setEvaluationId(e.target.value)}
          className="users-form-input"
        >
          <option value="">Seleccioná una evaluación...</option>
          {evaluations.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.date})
            </option>
          ))}
        </select>
      </div>

      <LoadError message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />

      {evaluationId && rows.length > 0 && (
        <>
          <div className="users-table-wrapper">
            <table className="users-table notas-table">
              <thead>
                <tr>
                  <th className="users-th">Alumno</th>
                  <th className="users-th users-th--center">Nota</th>
                  <th className="users-th users-th--center">Condición</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.enrollmentId}>
                    <td className="users-td notas-name">
                      {row.studentName}
                      {row.byEquivalence && <span className="users-badge users-badge--navy">Por equivalencia</span>}
                    </td>
                    <td className="users-td users-td--center notas-cell" data-label="Nota">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={row.gradeValue}
                        onChange={(e) => updateRow(row.enrollmentId, "gradeValue", e.target.value)}
                        className="users-form-input"
                        aria-label={`Nota de ${row.studentName}`}
                        disabled={row.byEquivalence}
                        title={row.byEquivalence ? "Nota de la equivalencia: la completa el sistema" : undefined}
                      />
                    </td>
                    <td className="users-td users-td--center notas-cell" data-label="Condición">
                      <select
                        value={row.condition}
                        onChange={(e) => updateRow(row.enrollmentId, "condition", e.target.value)}
                        className="users-form-input"
                        aria-label={`Condición de ${row.studentName}`}
                        disabled={row.byEquivalence}
                      >
                        <option value="" disabled={Boolean(row.gradeId)}>
                          Sin cargar
                        </option>
                        {CONDITIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="users-subtitle notas-missing" aria-live="polite">
            {missingCount === 0
              ? "Todos los alumnos tienen nota cargada."
              : `Falta cargar ${missingCount} de ${rows.length} ${rows.length === 1 ? "alumno" : "alumnos"}. Solo se guardan los que tengan condición elegida.`}
          </p>

          <div className="users-form-actions notas-actions">
            <button
              type="button"
              className="users-btn users-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
          <FormError message={saveError} />
        </>
      )}
    </div>
  );
}
