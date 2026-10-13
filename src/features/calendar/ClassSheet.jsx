import { useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import FormError from "../../shared/ui/FormError";
import { useToast } from "../../context/ToastContext";
import { createCancelledClass, deleteCancelledClass, getCancelledClasses } from "./services/staffCalendarService";
import "./staffCalendar.css";

const DEFAULT_REASON = "Falta del docente";

export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Hoja con el detalle de una clase y sus acciones. En celular ocupa el borde inferior de la
// pantalla (casi completa); en escritorio es un panel centrado.
export default function ClassSheet({ item, info, onClose, onChanged, onOpenSection }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState("view"); // view | cancel
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !confirmRemove) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirmRemove]);

  const cancelled = item.status === "CANCELLED";
  const section = info?.section;

  async function handleCancel() {
    const text = reason.trim();
    if (!text) {
      setError("Escribí el motivo de la cancelación.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createCancelledClass(item.sectionId, item.date, text);
      showToast(`Clase del ${formatDate(item.date)} marcada como cancelada.`);
      await onChanged();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo marcar la falta."));
      setBusy(false);
    }
  }

  async function handleRemove() {
    const list = await getCancelledClasses(item.sectionId);
    const found = list.find((c) => c.date === item.date);
    if (found) await deleteCancelledClass(found.id);
    showToast("Cancelación quitada: la clase vuelve a dictarse.");
    setConfirmRemove(false);
    await onChanged();
  }

  return (
    <>
    <div className="cal-sheet-overlay" onClick={onClose}>
      <div className="cal-sheet" role="dialog" aria-label="Detalle de la clase" onClick={(e) => e.stopPropagation()}>
        <div className="cal-sheet-header">
          <div>
            <h3 className="cal-sheet-title">{item.courseName}</h3>
            <p className="cal-sheet-sub">Comisión {item.sectionName}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="cal-sheet-body">
          <span className={`cal-status cal-status--${cancelled ? "cancelled" : "scheduled"}`}>
            {cancelled ? "Cancelada" : "Programada"}
          </span>

          <dl className="cal-sheet-data">
            <dt>Fecha</dt>
            <dd>{formatDate(item.date)}</dd>
            <dt>Horario</dt>
            <dd>
              {item.startTime} a {item.endTime}
            </dd>
            <dt>Aula</dt>
            <dd>{item.classroomName ?? "Sin aula"}</dd>
            {info?.program && (
              <>
                <dt>Carrera</dt>
                <dd>
                  {info.program.name}
                  {info.plan ? ` · Plan Res. ${info.plan.resolutionYear}` : ""}
                </dd>
              </>
            )}
            {section && (
              <>
                <dt>Docente</dt>
                <dd>
                  {section.teacherFirstName} {section.teacherLastName}
                </dd>
                <dt>Inscriptos</dt>
                <dd>
                  {section.enrolledCount} de {section.maxCapacity}
                </dd>
              </>
            )}
            {cancelled && item.reason && (
              <>
                <dt>Motivo</dt>
                <dd>{item.reason}</dd>
              </>
            )}
          </dl>

          {mode === "cancel" && (
            <div className="cal-sheet-cancel">
              <p className="users-confirm-text">
                Se va a marcar como cancelada la clase del {formatDate(item.date)}. El docente la va a ver cancelada
                y no se le va a pedir asistencia.
              </p>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="cancel-reason">
                  Motivo
                </label>
                <input
                  id="cancel-reason"
                  className="users-form-input"
                  value={reason}
                  maxLength={200}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="cal-sheet-actions cal-sheet-actions--row">
                <button type="button" className="users-btn users-btn--ghost" onClick={() => setMode("view")} disabled={busy}>
                  Volver
                </button>
                <button type="button" className="users-btn users-btn--danger" onClick={handleCancel} disabled={busy}>
                  Confirmar cancelación
                </button>
              </div>
              <FormError message={error} />
            </div>
          )}

          {mode === "view" && (
            <div className="cal-sheet-actions">
              {!cancelled && (
                <button type="button" className="users-btn users-btn--danger" onClick={() => setMode("cancel")}>
                  Marcar que faltó el docente
                </button>
              )}
              {cancelled && (
                <button type="button" className="users-btn users-btn--ghost" onClick={() => setConfirmRemove(true)}>
                  Quitar cancelación
                </button>
              )}
              <button type="button" className="users-btn users-btn--primary" onClick={() => onOpenSection(item.sectionId)}>
                Ver / editar la comisión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      <ConfirmModal
        open={confirmRemove}
        title="Quitar cancelación"
        confirmLabel="Quitar"
        message={`¿Volver a habilitar la clase del ${formatDate(item.date)}?`}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={handleRemove}
      />
    </>
  );
}
