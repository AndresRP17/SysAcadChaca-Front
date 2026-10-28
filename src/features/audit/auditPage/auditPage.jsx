import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import Pagination from "../../../shared/ui/Pagination/Pagination";
import { STATUS_LABELS } from "../../attendance/attendanceStatus";
import { getAuditLogs } from "../services/auditService";
import "../../users/usersPage/usersPage.css";
import "./auditPage.css";


// Mismas etiquetas que manda el backend en actionLabel (AuditAction::LABELS); acá solo
// sirven para armar el select de filtro. Al sumar una acción nueva en el backend, se agrega acá.
const ACTION_OPTIONS = [
  { value: "ENROLLMENT_OUT_OF_TERM", label: "Inscripción a cursada fuera de término" },
  { value: "EXAM_ENROLLMENT_OUT_OF_TERM", label: "Inscripción a mesa de final fuera de término" },
  { value: "ATTENDANCE_JUSTIFIED", label: "Ausencia justificada" },
  { value: "ATTENDANCE_CHANGED", label: "Asistencia modificada" },
  { value: "ATTENDANCE_LATE_LOADED", label: "Asistencia cargada con atraso" },
  { value: "ATTENDANCE_DELETED", label: "Asistencia eliminada" },
  { value: "EVALUATION_DATE_CHANGED", label: "Fecha de evaluación modificada" },
  { value: "EVALUATION_RULES_UPDATED", label: "Cambio en reglas de evaluaciones" },
  { value: "ATTENDANCE_RULES_UPDATED", label: "Cambio en reglas de asistencia" },
  { value: "REGULARITY_REVALIDATED", label: "Reválida de regularidad" },
  { value: "ENROLLMENT_RETAKE", label: "Recursada con regularidad vigente" },
  { value: "REGULARITY_RULES_UPDATED", label: "Cambio en reglas de regularidad" },
];

// Lista de alumnos de un registro de asistencia: los cambios (de qué estado a cuál) o los alumnos cargados con atraso.
// Con un solo cambio el resumen ya lo dice todo, así que no se repite.
function AttendanceDetails({ details }) {
  const status = (value) => STATUS_LABELS[value] ?? value;
  let items = [];
  if (Array.isArray(details?.changes)) {
    items = details.changes.map((c) => ({
      key: c.enrollmentId,
      text: `${c.student}: ${status(c.from?.status)} → ${status(c.to?.status)}`,
      note: c.to?.comment,
    }));
    if (items.length < 2 && !items[0]?.note) return null;
  } else if (Array.isArray(details?.students)) {
    items = details.students.map((s) => ({ key: s.enrollmentId, text: `${s.student}: ${status(s.status)}` }));
  }
  if (items.length === 0) return null;

  return (
    <details className="audit-details">
      <summary>Ver {items.length} {items.length === 1 ? "alumno" : "alumnos"}</summary>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            {item.text}
            {item.note && <span className="audit-reason">Nota: {item.note}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

const ROLE_BADGE_CLASS = {
  Administrador: "dash-badge dash-badge--navy",
  Bedel: "dash-badge dash-badge--gray",
};

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize();
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs({ page, size: pageSize, ...filters });
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar el registro de auditoría."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  function changePageSize(size) {
    setPage(1);
    setPageSize(size);
  }

  function changeFilter(name, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const hasFilters = filters.action || filters.from || filters.to;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Auditoría</h1>
          <p className="users-subtitle">Registro de quién hizo qué y cuándo en las acciones importantes</p>
        </div>
      </div>

      <div className="audit-filters">
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="audit-action">Acción</label>
          <select
            id="audit-action"
            className="users-form-input"
            value={filters.action}
            onChange={(e) => changeFilter("action", e.target.value)}
          >
            <option value="">Todas</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="audit-from">Desde</label>
          <input
            id="audit-from"
            type="date"
            className="users-form-input"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => changeFilter("from", e.target.value)}
          />
        </div>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="audit-to">Hasta</label>
          <input
            id="audit-to"
            type="date"
            className="users-form-input"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => changeFilter("to", e.target.value)}
          />
        </div>
        <div className="audit-filters-actions">
          <button
            type="button"
            className="users-btn users-btn--ghost"
            disabled={!hasFilters}
            onClick={() => {
              setPage(1);
              setFilters({ action: "", from: "", to: "" });
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <LoadError message={error} onRetry={load} />

      {loading ? (
        <p className="users-empty">Cargando...</p>
      ) : error ? null : logs.length === 0 ? (
        <p className="users-empty">{hasFilters ? "No hay registros con esos filtros" : "Todavía no hay registros"}</p>
      ) : (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="users-th">Fecha y hora</th>
                  <th className="users-th">Quién</th>
                  <th className="users-th">Acción</th>
                  <th className="users-th">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="users-row">
                    <td className="users-td audit-td--nowrap" data-label="Fecha y hora">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="users-td" data-label="Quién">
                      <span className="audit-actor">
                        <span>{log.actorName}</span>
                        <span className={ROLE_BADGE_CLASS[log.actorRole] ?? "dash-badge dash-badge--gray"}>{log.actorRole}</span>
                      </span>
                    </td>
                    <td className="users-td" data-label="Acción">
                      {log.actionLabel}
                    </td>
                    <td className="users-td" data-label="Detalle">
                      <span className="audit-summary">
                        {log.summary}
                        {(log.details?.reason || log.details?.comment) && (
                          <span className="audit-reason">Motivo: {log.details.reason || log.details.comment}</span>
                        )}
                        <AttendanceDetails details={log.details} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            noun={["registro", "registros"]}
          />
        </>
      )}
    </div>
  );
}
