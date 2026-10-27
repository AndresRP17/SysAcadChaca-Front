import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/api";
import { useToast } from "../../../context/ToastContext";
import LoadError from "../../../shared/ui/LoadError";
import FormError from "../../../shared/ui/FormError";
import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";
import {
  getEvaluationsBySection,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  evaluationTypeLabel,
} from "../services/evaluationService";
import { getGradesByEvaluation, createGrade, updateGrade } from "../services/evaluationGradeService";
import { isByEquivalence } from "../services/enrollmentService";
import EvaluationFormModal from "./EvaluationFormModal";
import "./evaluations.css";

// "" = Sin cargar: nadie arranca aprobado, la condición la elige el docente al cargar la nota.
const CONDITIONS = [
  { value: "APROBADO", label: "Aprobado" },
  { value: "DESAPROBADO", label: "Desaprobado" },
  { value: "AUSENTE", label: "Ausente" },
];
const NEEDS_GRADE = new Set(["APROBADO", "DESAPROBADO"]);

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function formatWhen(evaluation) {
  const day = formatDate(evaluation.date);
  return evaluation.startTime
    ? `${day}, ${evaluation.startTime}${evaluation.endTime ? ` a ${evaluation.endTime}` : ""}`
    : day;
}

// Evaluaciones de la comisión (parciales, recuperatorios, trabajos prácticos): una lista con alta, edición y baja
// y, al entrar a una, la planilla para cargar las notas de sus alumnos.
export default function NotasTab({ sectionId, enrollments }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [evaluationId, setEvaluationId] = useState(""); // "" = lista; con valor = planilla de esa evaluación
  const [rows, setRows] = useState([]); // { enrollmentId, studentName, gradeId, gradeValue, condition }
  const { showToast } = useToast();
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams] = useSearchParams();
  const requestedEvaluationId = searchParams.get("evaluacion");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    // Si no se resetea acá, al cambiar de comisión queda seleccionada la
    // evaluación de la comisión anterior cuando la nueva todavía no tiene
    // ninguna — y las notas que se guarden quedan cruzadas (evaluation_id
    // de una comisión, enrollment_id de otra).
    setEvaluationId("");
    setEvaluations([]);
    setRows([]);
    setLoadError("");
  }, [sectionId]);

  useEffect(() => {
    if (!sectionId) return;

    let cancelled = false;
    setLoadingList(true);

    getEvaluationsBySection(sectionId)
      .then((data) => {
        if (cancelled) return;
        setEvaluations(data);
        // Desde el calendario se llega con ?evaluacion=ID: se abre directo la planilla de esa evaluación.
        const requested = data.find((ev) => String(ev.id) === requestedEvaluationId);
        if (requested) setEvaluationId((current) => current || String(requested.id));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, "No se pudieron cargar las evaluaciones."));
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sectionId, reloadKey, requestedEvaluationId]);

  // De la más próxima a la más lejana, como se leen en un calendario.
  const sortedEvaluations = useMemo(
    () => [...evaluations].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    [evaluations],
  );
  const selectedEvaluation = evaluations.find((ev) => String(ev.id) === evaluationId);

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

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(evaluation) {
    setFormMode("edit");
    setEditing(evaluation);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editing) {
      await updateEvaluation(editing.id, data);
      showToast("Evaluación actualizada.");
    } else {
      await createEvaluation(data);
      showToast("Evaluación creada.");
    }
    setFormOpen(false);
    setReloadKey((k) => k + 1);
  }

  async function handleConfirmDelete() {
    await deleteEvaluation(toDelete.id);
    showToast("Evaluación eliminada.");
    setToDelete(null);
    setReloadKey((k) => k + 1);
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
      // Vuelve a la lista de evaluaciones, con el avance de carga actualizado.
      setEvaluationId("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      const prefix = saved > 0 ? `Se guardaron ${saved} notas, pero hubo un problema: ` : "";
      setSaveError(prefix + getErrorMessage(err, "No se pudieron guardar las notas."));
    } finally {
      setSaving(false);
    }
  }

  const formModals = (
    <>
      <EvaluationFormModal
        open={formOpen}
        mode={formMode}
        sectionId={sectionId}
        initialData={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
      <ConfirmModal
        open={!!toDelete}
        title="Eliminar evaluación"
        note={DELETE_NOTE}
        message={toDelete ? `¿Seguro que querés eliminar "${toDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );

  // ---- Planilla de notas de una evaluación
  if (evaluationId) {
    return (
      <div>
        <button type="button" className="users-action-btn eval-back" onClick={() => setEvaluationId("")}>
          ‹ Volver a las evaluaciones
        </button>

        {selectedEvaluation && (
          <div className="eval-header">
            <h3>{selectedEvaluation.name}</h3>
            <span className="users-badge users-badge--gray">{evaluationTypeLabel(selectedEvaluation.type)}</span>
            <p>{formatWhen(selectedEvaluation)}</p>
          </div>
        )}

        <LoadError message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />

        {rows.length > 0 && (
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
                aria-busy={saving}
              >
                {saving ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
            <FormError message={saveError} />
          </>
        )}

        {rows.length === 0 && !loadError && <p className="users-empty">Esta comisión no tiene alumnos inscriptos para cargar notas.</p>}
      </div>
    );
  }

  // ---- Lista de evaluaciones
  return (
    <div>
      <div className="eval-toolbar">
        <p className="users-subtitle">
          {evaluations.length} {evaluations.length === 1 ? "evaluación" : "evaluaciones"}
        </p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreate}>
          + Nueva evaluación
        </button>
      </div>

      <LoadError message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />

      {loadingList && evaluations.length === 0 && !loadError && <p className="users-empty">Cargando...</p>}

      {!loadingList && evaluations.length === 0 && !loadError && (
        <p className="users-empty">Esta comisión todavía no tiene evaluaciones. Creá la primera con "+ Nueva evaluación".</p>
      )}

      {sortedEvaluations.length > 0 && (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th className="users-th">Evaluación</th>
                <th className="users-th">Tipo</th>
                <th className="users-th">Fecha</th>
                <th className="users-th">Notas cargadas</th>
                <th className="users-th">Visibilidad</th>
                <th className="users-th users-th--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvaluations.map((ev) => {
                const percent = ev.studentsCount > 0 ? Math.round((ev.gradedCount / ev.studentsCount) * 100) : 0;
                return (
                  <tr key={ev.id}>
                    <td className="users-td" data-label="Evaluación">
                      <span className="eval-name">
                        <strong>{ev.name}</strong>
                        {ev.description && <small>{ev.description}</small>}
                      </span>
                    </td>
                    <td className="users-td" data-label="Tipo">
                      <span className="users-badge users-badge--gray">{evaluationTypeLabel(ev.type)}</span>
                    </td>
                    <td className="users-td" data-label="Fecha">{formatWhen(ev)}</td>
                    <td className="users-td" data-label="Notas cargadas">
                      <span className="eval-progress">
                        <span>{ev.gradedCount} de {ev.studentsCount}</span>
                        <span className="eval-progress-bar" aria-hidden="true">
                          <span style={{ width: `${percent}%` }} />
                        </span>
                      </span>
                    </td>
                    <td className="users-td" data-label="Visibilidad">
                      <span className={`users-badge ${ev.visible ? "users-badge--active" : "users-badge--inactive"}`}>
                        {ev.visible ? "Visible" : "Oculta"}
                      </span>
                    </td>
                    <td className="users-td users-td--actions" data-label="Acciones">
                      <span className="eval-actions">
                        <button type="button" className="users-btn users-btn--primary" onClick={() => setEvaluationId(String(ev.id))}>
                          Cargar notas
                        </button>
                        <button type="button" className="users-action-btn" onClick={() => openEdit(ev)}>
                          Editar
                        </button>
                        <button type="button" className="users-action-btn users-action-btn--danger" onClick={() => setToDelete(ev)}>
                          Quitar
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formModals}
    </div>
  );
}
