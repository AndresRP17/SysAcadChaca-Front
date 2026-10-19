import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import LoadError from "../../shared/ui/LoadError";
import FormError from "../../shared/ui/FormError";
import { getErrorMessage } from "../../shared/api/api";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { formatDate } from "./ClassSheet";
import { getAttendanceRules, updateAttendanceRules } from "../grades/services/attendanceService";
import {
  createAcademicTerm,
  createNonTeachingDay,
  deleteAcademicTerm,
  deleteNonTeachingDay,
  getAcademicTerms,
  getNonTeachingDays,
} from "./services/staffCalendarService";
import "./staffCalendar.css";

const currentYear = new Date().getFullYear();

// Cuanto cuenta cada situacion en el porcentaje de asistencia (el backend solo acepta estos tres numeros).
const CREDIT_OPTIONS = [
  { value: "1", label: "Cuenta como presente" },
  { value: "0.5", label: "Media falta" },
  { value: "0", label: "Falta" },
];

// Calendario academico: fechas de cursado de cada cuatrimestre y feriados. Sin esas
// fechas el calendario no puede mostrar las clases de las comisiones.
export default function AcademicCalendarManager({ onBack, onChanged }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const canEditRules = user?.role === "Administrador"; // Bedel la ve en solo lectura
  const [rules, setRules] = useState({ late: "1", leftEarly: "1" });
  const [savedRules, setSavedRules] = useState(null);
  const [rulesError, setRulesError] = useState("");
  const [rulesLoadError, setRulesLoadError] = useState("");
  const [rulesSaving, setRulesSaving] = useState(false);
  const [terms, setTerms] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [termForm, setTermForm] = useState({ year: String(currentYear), term: "1", start: "", end: "" });
  const [termError, setTermError] = useState("");
  const [holidayForm, setHolidayForm] = useState({ date: "", reason: "" });
  const [holidayError, setHolidayError] = useState("");
  const [toDelete, setToDelete] = useState(null); // { kind: "term" | "holiday", item }

  const reload = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([getAcademicTerms(), getNonTeachingDays()]);
      setTerms([...t].sort((a, b) => b.academicYear - a.academicYear || b.term - a.term));
      setHolidays([...h].sort((a, b) => (a.date < b.date ? 1 : -1)));
      setError("");
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar el calendario académico."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const loadRules = useCallback(async () => {
    try {
      const r = await getAttendanceRules();
      const next = { late: String(r.lateCredit), leftEarly: String(r.leftEarlyCredit) };
      setRules(next);
      setSavedRules(next);
      setRulesLoadError("");
    } catch (e) {
      setRulesLoadError(getErrorMessage(e, "No se pudieron cargar las reglas de asistencia."));
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  async function submitRules(e) {
    e.preventDefault();
    setRulesError("");
    setRulesSaving(true);
    try {
      const r = await updateAttendanceRules({ lateCredit: Number(rules.late), leftEarlyCredit: Number(rules.leftEarly) });
      const next = { late: String(r.lateCredit), leftEarly: String(r.leftEarlyCredit) };
      setRules(next);
      setSavedRules(next);
      showToast("Reglas de asistencia guardadas.");
    } catch (err) {
      setRulesError(getErrorMessage(err, "No se pudieron guardar las reglas de asistencia."));
    } finally {
      setRulesSaving(false);
    }
  }

  async function submitTerm(e) {
    e.preventDefault();
    setTermError("");
    if (!termForm.start || !termForm.end) {
      setTermError("Completá las fechas de inicio y de fin.");
      return;
    }
    if (termForm.end < termForm.start) {
      setTermError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    try {
      await createAcademicTerm({
        academic_year: Number(termForm.year),
        term: Number(termForm.term),
        start_date: termForm.start,
        end_date: termForm.end,
      });
      setTermForm((f) => ({ ...f, start: "", end: "" }));
      showToast("Cuatrimestre agregado.");
      await reload();
      onChanged();
    } catch (err) {
      setTermError(getErrorMessage(err, "No se pudo guardar el cuatrimestre."));
    }
  }

  async function submitHoliday(e) {
    e.preventDefault();
    setHolidayError("");
    if (!holidayForm.date || !holidayForm.reason.trim()) {
      setHolidayError("Completá la fecha y el motivo.");
      return;
    }
    try {
      await createNonTeachingDay({ date: holidayForm.date, reason: holidayForm.reason.trim() });
      setHolidayForm({ date: "", reason: "" });
      showToast("Feriado agregado.");
      await reload();
      onChanged();
    } catch (err) {
      setHolidayError(getErrorMessage(err, "No se pudo guardar el feriado."));
    }
  }

  async function confirmDelete() {
    if (toDelete.kind === "term") await deleteAcademicTerm(toDelete.item.id);
    else await deleteNonTeachingDay(toDelete.item.id);
    showToast(toDelete.kind === "term" ? "Cuatrimestre eliminado." : "Feriado eliminado.");
    setToDelete(null);
    await reload();
    onChanged();
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Calendario académico</h1>
          <p className="users-subtitle">Fechas de cursado de cada cuatrimestre y feriados.</p>
        </div>
        <button type="button" className="users-btn users-btn--ghost" onClick={onBack}>
          ‹ Volver al calendario
        </button>
      </div>

      <LoadError message={error} onRetry={reload} />
      {loading && <p className="users-empty">Cargando...</p>}

      <section className="cal-card" aria-labelledby="attendance-rules-title">
        <h2 className="cal-card-title" id="attendance-rules-title">Reglas de asistencia</h2>
        <p className="cal-card-help">
          Una ausencia justificada no cuenta como falta ni como presente. Los porcentajes de clases ya cerradas no se
          recalculan.
        </p>
        <LoadError message={rulesLoadError} onRetry={loadRules} />
        <form className="users-form cal-inline-form" onSubmit={submitRules}>
          <div className="cal-form-grid">
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="rule-late">Llegó tarde</label>
              <select
                id="rule-late"
                className="users-form-input"
                value={rules.late}
                disabled={!canEditRules || rulesSaving}
                onChange={(e) => setRules({ ...rules, late: e.target.value })}
              >
                {CREDIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="rule-left-early">Se retiró antes</label>
              <select
                id="rule-left-early"
                className="users-form-input"
                value={rules.leftEarly}
                disabled={!canEditRules || rulesSaving}
                onChange={(e) => setRules({ ...rules, leftEarly: e.target.value })}
              >
                {CREDIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {canEditRules ? (
            <button
              type="submit"
              className="users-btn users-btn--primary"
              disabled={
                rulesSaving ||
                !savedRules ||
                (rules.late === savedRules.late && rules.leftEarly === savedRules.leftEarly)
              }
            >
              {rulesSaving ? "Guardando..." : "Guardar reglas"}
            </button>
          ) : (
            <p className="cal-card-help">Solo el Administrador puede cambiar estas reglas.</p>
          )}
          <FormError message={rulesError} />
        </form>
      </section>

      <section className="cal-card">
        <h2 className="cal-card-title">Fechas de cursado</h2>
        <p className="cal-card-help">
          Las comisiones de un cuatrimestre aparecen en el calendario solo dentro de estas fechas.
        </p>

        <form className="users-form cal-inline-form" onSubmit={submitTerm}>
          <div className="cal-form-grid">
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="term-year">Año</label>
              <input
                id="term-year"
                type="number"
                inputMode="numeric"
                className="users-form-input"
                value={termForm.year}
                onChange={(e) => setTermForm({ ...termForm, year: e.target.value })}
              />
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="term-term">Cuatrimestre</label>
              <select
                id="term-term"
                className="users-form-input"
                value={termForm.term}
                onChange={(e) => setTermForm({ ...termForm, term: e.target.value })}
              >
                <option value="1">1° cuatrimestre</option>
                <option value="2">2° cuatrimestre</option>
              </select>
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="term-start">Inicio</label>
              <input
                id="term-start"
                type="date"
                className="users-form-input"
                value={termForm.start}
                onChange={(e) => setTermForm({ ...termForm, start: e.target.value })}
              />
            </div>
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="term-end">Fin</label>
              <input
                id="term-end"
                type="date"
                className="users-form-input"
                value={termForm.end}
                onChange={(e) => setTermForm({ ...termForm, end: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="users-btn users-btn--primary">Agregar cuatrimestre</button>
          <FormError message={termError} />
        </form>

        {!loading && terms.length === 0 && <p className="users-empty">Todavía no hay cuatrimestres cargados.</p>}
        <ul className="cal-list">
          {terms.map((t) => (
            <li key={t.id} className="cal-list-item">
              <div>
                <p className="cal-list-main">{t.term}° cuatrimestre {t.academicYear}</p>
                <p className="cal-list-sub">{formatDate(t.startDate)} al {formatDate(t.endDate)}</p>
              </div>
              <button
                type="button"
                className="users-action-btn users-action-btn--danger"
                onClick={() => setToDelete({ kind: "term", item: t })}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="cal-card">
        <h2 className="cal-card-title">Feriados y días sin clases</h2>
        <p className="cal-card-help">Ese día no se dicta ninguna comisión y se muestra con su motivo.</p>

        <form className="users-form cal-inline-form" onSubmit={submitHoliday}>
          <div className="cal-form-grid">
            <div className="users-form-field">
              <label className="users-form-label" htmlFor="holiday-date">Fecha</label>
              <input
                id="holiday-date"
                type="date"
                className="users-form-input"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />
            </div>
            <div className="users-form-field cal-form-wide">
              <label className="users-form-label" htmlFor="holiday-reason">Motivo</label>
              <input
                id="holiday-reason"
                className="users-form-input"
                value={holidayForm.reason}
                maxLength={200}
                placeholder="Ej.: Día de la Independencia"
                onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="users-btn users-btn--primary">Agregar feriado</button>
          <FormError message={holidayError} />
        </form>

        {!loading && holidays.length === 0 && <p className="users-empty">Todavía no hay feriados cargados.</p>}
        <ul className="cal-list">
          {holidays.map((h) => (
            <li key={h.id} className="cal-list-item">
              <div>
                <p className="cal-list-main">{formatDate(h.date)}</p>
                <p className="cal-list-sub">{h.reason}</p>
              </div>
              <button
                type="button"
                className="users-action-btn users-action-btn--danger"
                onClick={() => setToDelete({ kind: "holiday", item: h })}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmModal
        open={!!toDelete}
        title={toDelete?.kind === "term" ? "Eliminar cuatrimestre" : "Eliminar feriado"}
        message={
          toDelete?.kind === "term"
            ? `¿Eliminar las fechas del ${toDelete.item.term}° cuatrimestre ${toDelete.item.academicYear}? Sus comisiones dejan de verse en el calendario.`
            : toDelete
              ? `¿Eliminar el feriado del ${formatDate(toDelete.item.date)} (${toDelete.item.reason})?`
              : ""
        }
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
