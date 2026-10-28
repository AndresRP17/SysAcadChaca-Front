import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import LoadError from "../../shared/ui/LoadError/LoadError";
import FormError from "../../shared/ui/FormError";
import FieldError from "../../shared/ui/FieldError";
import { getErrorMessage, getFieldErrors } from "../../shared/api/api";
import { getRegularityRules, updateRegularityRules } from "./services/regularityService";
import { useSubmitLock } from "../../shared/hooks/useSubmitLock";
import {
  FAILED_FINALS_RANGE,
  MONTHS_RANGE,
  RETAKE_OPTIONS,
  formToPayload,
  rulesToForm,
  sameRulesForm,
  validateRulesForm,
} from "./regularityRules";

const SWITCHES = [
  { key: "allowRevalidation", label: "Bedelía puede revalidar una regularidad perdida" },
  { key: "lostBlocksFinal", label: "Con la regularidad perdida no se puede rendir el final" },
  {
    key: "lostBreaksPrerequisites",
    label: "Con la regularidad perdida la materia deja de valer como correlativa de cursada",
  },
];

// Reglas de regularidad de la institución. El Administrador las edita; Bedelía las ve en solo lectura.
export default function RegularityRulesCard({ canEdit }) {
  const { lock, pending } = useSubmitLock();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    try {
      const next = rulesToForm(await getRegularityRules());
      setForm(next);
      setSaved(next);
      setLoadError("");
    } catch (e) {
      setLoadError(getErrorMessage(e, "No se pudieron cargar las reglas de regularidad."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function change(patch) {
    setForm((current) => ({ ...current, ...patch }));
    setFieldErrors({});
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const invalid = validateRulesForm(form);
    setFieldErrors(invalid);
    if (Object.keys(invalid).length > 0) return;

    setSaving(true);
    try {
      const next = rulesToForm(await updateRegularityRules(formToPayload(form)));
      setForm(next);
      setSaved(next);
      showToast("Reglas de regularidad guardadas.");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron guardar las reglas de regularidad."));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  const ready = form !== null;
  const locked = !canEdit || saving || !ready;
  const f = form ?? {};

  return (
    <section className="cal-card" aria-labelledby="regularity-rules-title">
      <h2 className="cal-card-title" id="regularity-rules-title">Reglas de regularidad</h2>
      <p className="cal-card-help">
        La regularidad de una materia se pierde por plazo, por aplazos o por ambos, según lo que configures acá. Los
        cambios no recalculan nada guardado: se evalúan en el momento de consultar.
      </p>
      <LoadError message={loadError} onRetry={load} />
      <form className="users-form cal-inline-form" onSubmit={lock(submit)} noValidate>
        <div className="reg-rules-grid">
          <div className="users-form-field">
            <label className="users-form-label" htmlFor="reg-expiry-mode">Vencimiento por tiempo</label>
            <select
              id="reg-expiry-mode"
              className="users-form-input cal-rules-select"
              value={f.expires ? "months" : "never"}
              disabled={locked}
              onChange={(e) => change({ expires: e.target.value === "months", validMonths: f.validMonths || "24" })}
            >
              <option value="never">No vence</option>
              <option value="months">Vence a los N meses</option>
            </select>
            {f.expires && (
              <>
                <label className="users-form-label" htmlFor="reg-valid-months">Meses de vigencia</label>
                <input
                  id="reg-valid-months"
                  type="number"
                  inputMode="numeric"
                  min={MONTHS_RANGE.min}
                  max={MONTHS_RANGE.max}
                  className="users-form-input"
                  value={f.validMonths}
                  disabled={locked}
                  aria-invalid={fieldErrors.valid_months ? "true" : undefined}
                  onChange={(e) => change({ validMonths: e.target.value })}
                />
              </>
            )}
            <FieldError errors={fieldErrors} field="valid_months" />
          </div>

          <div className="users-form-field">
            <label className="users-form-label" htmlFor="reg-limit-mode">Aplazos que hacen perder la regularidad</label>
            <select
              id="reg-limit-mode"
              className="users-form-input cal-rules-select"
              value={f.limited ? "count" : "none"}
              disabled={locked}
              onChange={(e) => change({ limited: e.target.value === "count", maxFailedFinals: f.maxFailedFinals || "4" })}
            >
              <option value="none">Sin límite</option>
              <option value="count">Al llegar a N aplazos</option>
            </select>
            {f.limited && (
              <>
                <label className="users-form-label" htmlFor="reg-max-finals">Cantidad de aplazos</label>
                <input
                  id="reg-max-finals"
                  type="number"
                  inputMode="numeric"
                  min={FAILED_FINALS_RANGE.min}
                  max={FAILED_FINALS_RANGE.max}
                  className="users-form-input"
                  value={f.maxFailedFinals}
                  disabled={locked}
                  aria-invalid={fieldErrors.max_failed_finals ? "true" : undefined}
                  onChange={(e) => change({ maxFailedFinals: e.target.value })}
                />
              </>
            )}
            <FieldError errors={fieldErrors} field="max_failed_finals" />
          </div>

          <div className="users-form-field reg-rules-wide">
            <label className="users-form-label" htmlFor="reg-retake">Recursar con la regularidad vigente</label>
            <select
              id="reg-retake"
              className="users-form-input cal-rules-select"
              value={f.retakePolicy ?? "STAFF_WITH_REASON"}
              disabled={locked}
              onChange={(e) => change({ retakePolicy: e.target.value })}
            >
              {RETAKE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FieldError errors={fieldErrors} field="retake_policy" />
          </div>
        </div>

        <div className="reg-switches">
          {SWITCHES.map((s) => (
            <div key={s.key}>
              <label className="reg-switch">
                <input
                  type="checkbox"
                  checked={Boolean(f[s.key])}
                  disabled={locked}
                  onChange={(e) => change({ [s.key]: e.target.checked })}
                />
                <span>{s.label}</span>
              </label>
              <FieldError
                errors={fieldErrors}
                field={s.key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}
              />
            </div>
          ))}
        </div>

        {canEdit ? (
          <button
            type="submit" aria-busy={pending}
            className="users-btn users-btn--primary"
            disabled={pending || (saving || !ready || sameRulesForm(form, saved))}
          >
            {saving ? "Guardando..." : "Guardar reglas"}
          </button>
        ) : (
          <p className="cal-card-help">Solo el Administrador puede cambiar estas reglas.</p>
        )}
        <FormError message={error} />
      </form>
    </section>
  );
}
