import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import LoadError from "../../shared/ui/LoadError";
import Pagination from "../../shared/ui/Pagination";
import { getAuditLogs } from "./services/auditService";
import "../users/usersPage.css";
import "./auditPage.css";

const PAGE_SIZE = 10;

// Mismas etiquetas que manda el backend en actionLabel (AuditAction::LABELS); acá solo
// sirven para armar el select de filtro. Al sumar una acción nueva en el backend, se agrega acá.
const ACTION_OPTIONS = [
  { value: "ENROLLMENT_OUT_OF_TERM", label: "Inscripción a cursada fuera de término" },
  { value: "EXAM_ENROLLMENT_OUT_OF_TERM", label: "Inscripción a mesa de final fuera de término" },
];

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
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs({ page, size: PAGE_SIZE, ...filters });
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo cargar el registro de auditoría."));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

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
                        {log.details?.reason && (
                          <span className="audit-reason">Motivo: {log.details.reason}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            noun={["registro", "registros"]}
          />
        </>
      )}
    </div>
  );
}
