import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import LoadError from "../../shared/ui/LoadError";
import FormError from "../../shared/ui/FormError";
import FieldError from "../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../shared/api/api";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";
import {
  EVALUATION_RULES_LIMITS,
  getEvaluationRules,
  updateEvaluationRules,
} from "../grades/services/evaluationRulesService";

const FIELDS = [
  {
    key: "minHoursSameYear",
    apiKey: "min_hours_same_year",
    label: "Horas entre materias del mismo año",
    help: "Mínimo entre parciales y recuperatorios de materias del mismo año de la carrera. Con 48, no pueden caer el mismo día ni en días consecutivos.",
    limits: EVALUATION_RULES_LIMITS.hours,
    unit: "horas",
  },
  {
    key: "minHoursOtherYear",
    apiKey: "min_hours_other_year",
    label: "Horas entre materias de años distintos",
    help: "Mínimo entre evaluaciones de materias de años distintos. Con 24, no pueden caer el mismo día.",
    limits: EVALUATION_RULES_LIMITS.hours,
    unit: "horas",
  },
  {
    key: "minNoticeDays",
    apiKey: "min_notice_days",
    label: "Días de aviso para cambiar una fecha",
    help: "Se avisa al docente si cambia la fecha de una evaluación con menos anticipación que esta, y queda marcado en la auditoría.",
    limits: EVALUATION_RULES_LIMITS.noticeDays,
    unit: "días",
  },
];

function rulesToForm(rules) {
  return {
    minHoursSameYear: String(rules.minHoursSameYear),
    minHoursOtherYear: String(rules.minHoursOtherYear),
    minNoticeDays: String(rules.minNoticeDays),
  };
}

function sameForm(a, b) {
  return FIELDS.every((f) => a[f.key] === b[f.key]);
}

// Reglas de evaluaciones de la institución: avisos al programar parciales y recuperatorios. El Administrador las
// edita; Bedelía las ve en solo lectura. Son avisos, no bloqueos.
export default function EvaluationRulesCard({ canEdit }) {
  const { lock, pending } = useSubmitLock();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    try {
      const next = rulesToForm(await getEvaluationRules());
      setForm(next);
      setSaved(next);
      setLoadError("");
    } catch (e) {
      setLoadError(getErrorMessage(e, "No se pudieron cargar las reglas de evaluaciones."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors({});
    setError("");
  }

  async function submit() {
    setError("");

    const invalid = {};
    for (const f of FIELDS) {
      const value = Number(form[f.key]);
      if (form[f.key].trim() === "" || !Number.isInteger(value) || value < f.limits.min || value > f.limits.max) {
        invalid[f.apiKey] = `Tiene que ser un número entero entre ${f.limits.min} y ${f.limits.max}.`;
      }
    }
    setFieldErrors(invalid);
    if (Object.keys(invalid).length > 0) return;

    try {
      const next = rulesToForm(
        await updateEvaluationRules({
          minHoursSameYear: Number(form.minHoursSameYear),
          minHoursOtherYear: Number(form.minHoursOtherYear),
          minNoticeDays: Number(form.minNoticeDays),
        }),
      );
      setForm(next);
      setSaved(next);
      showToast("Reglas de evaluaciones guardadas.");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron guardar las reglas de evaluaciones."));
      setFieldErrors(getFieldErrors(err));
    }
  }

  const ready = form !== null;
  const locked = !canEdit || pending || !ready;

  return (
    <section className="cal-card" aria-labelledby="evaluation-rules-title">
      <h2 className="cal-card-title" id="evaluation-rules-title">Reglas de evaluaciones</h2>
      <p className="cal-card-help">
        Pautas para programar parciales y recuperatorios. Son avisos al docente cuando carga o cambia una fecha, no
        bloquean nada. Poné 0 para desactivar un aviso.
      </p>
      <LoadError message={loadError} onRetry={load} />
      <form className="users-form cal-inline-form" onSubmit={lock(submit)} noValidate>
        <div className="cal-rules-grid">
          {FIELDS.map((f) => (
            <div key={f.key} className="users-form-field">
              <label className="users-form-label" htmlFor={`eval-rule-${f.key}`}>{f.label}</label>
              <input
                id={`eval-rule-${f.key}`}
                type="number"
                inputMode="numeric"
                min={f.limits.min}
                max={f.limits.max}
                className="users-form-input"
                value={form?.[f.key] ?? ""}
                disabled={locked}
                aria-invalid={fieldErrors[f.apiKey] ? "true" : undefined}
                aria-describedby={`eval-rule-${f.key}-help`}
                onChange={(e) => change(f.key, e.target.value)}
              />
              <FieldError errors={fieldErrors} field={f.apiKey} />
              <small className="cal-card-help" id={`eval-rule-${f.key}-help`}>{f.help} ({f.unit})</small>
            </div>
          ))}
        </div>

        {canEdit ? (
          <button
            type="submit"
            className="users-btn users-btn--primary"
            disabled={pending || !ready || sameForm(form, saved)}
            aria-busy={pending}
          >
            Guardar reglas
          </button>
        ) : (
          <p className="cal-card-help">Solo el Administrador puede modificar estas reglas.</p>
        )}
        <FormError message={error} />
      </form>
    </section>
  );
}
