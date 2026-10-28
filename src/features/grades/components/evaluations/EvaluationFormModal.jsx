import { useEffect, useState } from "react";
import Modal from "../../../../shared/ui/Modal/Modal";
import FieldError from "../../../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../../../shared/api/api";
import { useSubmitLock } from "../../../../shared/hooks/useSubmitLock";
import { EVALUATION_TYPES, checkEvaluation, evaluationTypeLabel } from "../../services/evaluationService";
import "./evaluations.css";

const EMPTY_FORM = { type: "PARCIAL", name: "", date: "", start_time: "", end_time: "", description: "", visible: true };

const NAME_EXAMPLES = {
  PARCIAL: "Ej: 1er Parcial",
  RECUPERATORIO: "Ej: Recuperatorio 1er Parcial",
  TRABAJO_PRACTICO: "Ej: Trabajo práctico 1",
};

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Alta y edición de una evaluación de la comisión. Mientras se elige la fecha y el tipo se consultan los avisos
// al servidor (fuera del cuatrimestre, choques con otras materias, poca anticipación): informan, no bloquean.
export default function EvaluationFormModal({ open, mode = "create", sectionId, initialData, onClose, onSubmit }) {
  const { lock, pending } = useSubmitLock();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            type: initialData.type ?? "PARCIAL",
            name: initialData.name,
            date: initialData.date,
            start_time: initialData.startTime ?? "",
            end_time: initialData.endTime ?? "",
            description: initialData.description ?? "",
            visible: initialData.visible ?? true,
          }
        : EMPTY_FORM,
    );
    setError("");
    setFieldErrors({});
    setCheck(null);
  }, [open, initialData]);

  const editingId = mode === "edit" ? initialData?.id : undefined;

  useEffect(() => {
    if (!open || !sectionId || !form.date) {
      setCheck(null);
      return undefined;
    }

    let cancelled = false;
    setChecking(true);

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkEvaluation({ sectionId, date: form.date, type: form.type, evaluationId: editingId });
        if (!cancelled) setCheck(result);
      } catch {
        if (!cancelled) setCheck(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [open, sectionId, form.date, form.type, editingId]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.date) {
      setError("Completá el nombre y la fecha de la evaluación.");
      return;
    }
    try {
      await onSubmit({
        section_id: sectionId,
        type: form.type,
        name: form.name,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        description: form.description,
        visible: form.visible,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const title = mode === "edit" ? "Editar evaluación" : "Nueva evaluación";
  const hasNotes = check && (check.warnings.length > 0 || check.conflicts.length > 0);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={lock(handleSubmit)} className="users-form" noValidate>
        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="evaluationFormModal-type">Tipo</label>
            <select
              id="evaluationFormModal-type"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="users-form-input"
            >
              {EVALUATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <FieldError errors={fieldErrors} field="type" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="evaluationFormModal-date">Fecha</label>
            <input
              id="evaluationFormModal-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="date" />
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="evaluationFormModal-name">Nombre</label>
          <input
            id="evaluationFormModal-name"
            type="text"
            maxLength={100}
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={NAME_EXAMPLES[form.type]}
            className="users-form-input"
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="users-form-row">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="evaluationFormModal-start">Hora de inicio (opcional)</label>
            <input
              id="evaluationFormModal-start"
              type="time"
              value={form.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="start_time" />
          </div>
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="evaluationFormModal-end">Hora de fin (opcional)</label>
            <input
              id="evaluationFormModal-end"
              type="time"
              value={form.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
              className="users-form-input"
            />
            <FieldError errors={fieldErrors} field="end_time" />
          </div>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="evaluationFormModal-description">Descripción (opcional)</label>
          <textarea
            id="evaluationFormModal-description"
            rows={2}
            maxLength={255}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Ej: Unidades 1 a 4. Traer calculadora."
            className="users-form-input eval-textarea"
          />
          <FieldError errors={fieldErrors} field="description" />
        </div>

        <label className="eval-visible">
          <input type="checkbox" checked={form.visible} onChange={(e) => handleChange("visible", e.target.checked)} />
          <span>
            <strong>Visible para los alumnos</strong>
            <small>
              {form.visible
                ? "Los alumnos la ven en su calendario."
                : "Queda oculta: la ven solo el docente y la administración, hasta que la hagas visible."}
            </small>
          </span>
        </label>

        {checking && <p className="users-subtitle">Verificando la fecha...</p>}

        {!checking && hasNotes && (
          <div className="eval-notes" role="status">
            {check.warnings.map((w) => <p key={w.code} className="eval-note">{w.message}</p>)}
            {check.conflicts.length > 0 && (
              <div className="eval-note">
                <p>
                  Se pisa con {check.conflicts.length === 1 ? "otra evaluación" : "otras evaluaciones"} de la carrera, según las
                  reglas de la institución:
                </p>
                <ul>
                  {check.conflicts.map((c) => (
                    <li key={c.evaluationId}>
                      <strong>{c.courseName}</strong> (comisión {c.sectionName}, {c.yearNumber}° año): {c.name},{" "}
                      {evaluationTypeLabel(c.type).toLowerCase()}, {formatDate(c.date)} (la institución pide al menos {c.minHours}{" "}
                      horas de diferencia)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="eval-note-hint">Son avisos: igual podés guardar.</p>
          </div>
        )}

        {error && <p className="users-form-error">{error}</p>}

        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="users-btn users-btn--primary" disabled={pending} aria-busy={pending}>
            {mode === "edit" ? "Guardar" : "Crear evaluación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
